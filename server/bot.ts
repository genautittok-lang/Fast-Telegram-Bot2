import { Telegraf, Markup, Context } from "telegraf";
import { IStorage } from "./storage";
import { generateDetailedPDF, generateFindings, generateMetadata } from "./pdfGenerator";
import { performCheck, CheckResult } from "./checkService";
import { t, Language, languageNames } from "./i18n";

interface BotContext extends Context {}

export const ADMIN_IDS = (process.env.ADMIN_IDS || "7820995179").split(",").map(id => id.trim());

export let botInstance: Telegraf<BotContext> | null = null;

function getUserLang(langCode: string | null | undefined): Language {
  if (!langCode) return "uk";
  const code = langCode.toLowerCase();
  if (code === "uk" || code === "ua") return "uk";
  if (code === "ru") return "ru";
  return "en";
}

export async function setupBot(storage: IStorage) {
  console.log("Setting up Telegram bot...");
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.warn("TELEGRAM_BOT_TOKEN not set. Bot will not start.");
    return null;
  }
  console.log("Token found, creating bot instance...");

  const bot = new Telegraf<BotContext>(token);
  botInstance = bot;

  bot.telegram.getMe()
    .then((botInfo) => console.log("Bot info:", botInfo.username))
    .catch((err) => console.error("Failed to get bot info:", err.message));

  const userStates: Map<string, { module?: string; step?: string; data?: any }> = new Map();

  bot.use(async (ctx, next) => {
    if (ctx.from) {
      const tgId = ctx.from.id.toString();
      let user = await storage.getUserByTgId(tgId);
      if (!user) {
        const detectedLang = getUserLang(ctx.from.language_code);
        user = await storage.createUser({
          tgId,
          username: ctx.from.username,
          lang: detectedLang,
          requestsLeft: 15,
          streakDays: 1,
          refCode: `DARK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        });
      }
    }
    return next();
  });

  async function getLang(tgId: string): Promise<Language> {
    const user = await storage.getUserByTgId(tgId);
    return getUserLang(user?.lang);
  }

  function isAdmin(tgId: string): boolean {
    return ADMIN_IDS.includes(tgId);
  }

  bot.command("start", async (ctx) => {
    const text = ctx.message.text;
    // Match both /start ref_CODE and /start=ref_CODE formats
    const refMatch = text.match(/(?:start\s+ref_|start=ref_)([A-Z0-9-]+)/i);
    const tgId = ctx.from!.id.toString();
    let user = await storage.getUserByTgId(tgId);
    const lang = getUserLang(user?.lang);
    
    const isNewUser = !user?.langSet;
    
    // Process referral code if present
    if (refMatch && refMatch[1]) {
      const refCode = refMatch[1].toUpperCase();
      console.log(`Processing referral code: ${refCode}`);
      
      // Find referrer by code
      const referrer = await storage.getUserByRefCode(refCode);
      if (referrer && referrer.id !== user?.id) {
        // Give bonus to new user
        if (user) {
          await storage.updateUser(user.id, { 
            requestsLeft: (user.requestsLeft || 15) + 5
          });
          user = await storage.getUserByTgId(tgId);
        }
        
        // Give bonus to referrer
        await storage.updateUser(referrer.id, {
          requestsLeft: (referrer.requestsLeft || 15) + 2
        });
        
        // Track referral
        try {
          await storage.createReferral({
            referrerId: referrer.id,
            referredId: user?.id || 0,
            bonus: 5
          });
        } catch (e) {
          // Ignore duplicate referral errors
        }
        
        console.log(`Referral processed: ${refCode} -> ${tgId}`);
      }
    }
    
    if (isNewUser && refMatch) {
      // Special welcome for referred users
      const welcomeText = `🎁 *DARKSHARE - SECURITY OSINT*

━━━━━━━━━━━━━━━━━━━━

✨ *Вітаємо, ${ctx.from.first_name || ctx.from.username || "друже"}!*

Тебе запросив друг до найкращої OSINT платформи!

🎁 *Твій бонус активовано:*
├ +5 безкоштовних перевірок
├ Повний доступ до 10 модулів
└ AI-аналіз та PDF звіти

━━━━━━━━━━━━━━━━━━━━

🔍 *Можливості DARKSHARE:*
├ 🌐 IP/GEO аналіз
├ 💰 Крипто гаманці
├ 📧 Email перевірка
├ 🔗 URL сканування
├ 🔓 CVE вразливості
└ ...та багато іншого!

━━━━━━━━━━━━━━━━━━━━

👇 *Обери мову для початку:*`;

      await ctx.reply(welcomeText, {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([
          [
            Markup.button.callback("🇺🇦 Українська", "lang_uk"),
            Markup.button.callback("🇬🇧 English", "lang_en"),
            Markup.button.callback("🇷🇺 Русский", "lang_ru")
          ]
        ])
      });
    } else if (isNewUser) {
      // Regular welcome for new users
      const welcomeText = `🌑 *DARKSHARE v4.1*

━━━━━━━━━━━━━━━━━━━━

👋 *Привіт, ${ctx.from.first_name || ctx.from.username || "друже"}!*

Твій ID: \`${tgId}\`

🛡️ *DARKSHARE* - професійна OSINT платформа для аналізу безпеки.

━━━━━━━━━━━━━━━━━━━━

🔍 *10 модулів аналізу:*
├ IP адреси та геолокація
├ Крипто гаманці (ETH/BTC/TRX/SOL)
├ Email та витоки даних
├ Домени та SSL сертифікати
├ URL та фішинг
├ CVE вразливості
├ Файлові хеші
└ Username OSINT

━━━━━━━━━━━━━━━━━━━━

👇 *Обери мову:*`;

      await ctx.reply(welcomeText, {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([
          [
            Markup.button.callback("🇺🇦 Українська", "lang_uk"),
            Markup.button.callback("🇬🇧 English", "lang_en"),
            Markup.button.callback("🇷🇺 Русский", "lang_ru")
          ]
        ])
      });
    } else {
      await showDashboard(ctx, tgId, false);
    }
  });

  bot.action(/^lang_/, async (ctx) => {
    const langCode = ctx.match.input.split('_')[1] as Language;
    const tgId = ctx.from!.id.toString();
    const user = await storage.getUserByTgId(tgId);
    if (user) {
      await storage.updateUser(user.id, { lang: langCode, langSet: true });
    }
    await ctx.answerCbQuery(t(langCode, "settings.languageChanged"));
    
    const startText = t(langCode, "common.languageSet");
    
    await ctx.editMessageText(startText, 
      Markup.inlineKeyboard([[Markup.button.callback("🚀 " + t(langCode, "buttons.back").replace("⬅️ ", ""), "dashboard")]])
    );
  });

  function generateProgressBar(current: number, max: number, length: number = 10): string {
    const filled = Math.round((current / max) * length);
    const empty = length - filled;
    return '▓'.repeat(Math.max(0, filled)) + '░'.repeat(Math.max(0, empty));
  }

  function formatLastActivity(date: Date | null | undefined, lang: Language): string {
    if (!date) return "—";
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (lang === "uk") {
      if (minutes < 1) return "щойно";
      if (minutes < 60) return `${minutes} хв тому`;
      if (hours < 24) return `${hours} год тому`;
      return `${days} дн тому`;
    } else if (lang === "ru") {
      if (minutes < 1) return "только что";
      if (minutes < 60) return `${minutes} мин назад`;
      if (hours < 24) return `${hours} ч назад`;
      return `${days} дн назад`;
    } else {
      if (minutes < 1) return "just now";
      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      return `${days}d ago`;
    }
  }

  async function showDashboard(ctx: any, tgId: string, isEdit: boolean = true) {
    const user = await storage.getUserByTgId(tgId);
    const lang = getUserLang(user?.lang);
    userStates.delete(tgId);

    const requestsLeft = user?.requestsLeft ?? 15;
    const requestsLimit = 15;
    const progressBar = generateProgressBar(requestsLeft, requestsLimit);
    const lastActivity = formatLastActivity(user?.lastLogin, lang);

    const tierEmoji = user?.tier === "ENTERPRISE" ? "👑" : user?.tier === "PRO" ? "⭐" : "🆓";
    const tierName = user?.tier || "FREE";

    const requestsWarning = requestsLeft <= 3 
      ? "\n⚠️ " + t(lang, "common.lowRequests")
      : requestsLeft <= 0
      ? "\n❌ " + (lang === "uk" ? "Ліміт вичерпано" : lang === "ru" ? "Лимит исчерпан" : "Limit exceeded")
      : '';

    const systemStatus = requestsLeft <= 0 ? "⚠️ LIMITED" : requestsLeft <= 3 ? "⚡ LOW" : "✅ READY";
    
    const dashboardText = `╔═══════════════════════╗
║  🌑 DARKSHARE v4.1   ║
╚═══════════════════════╝

⚙️ ${systemStatus}

${tierEmoji} ${t(lang, "common.tier")}: *${tierName}*
📊 ${t(lang, "dashboard.stats", { requestsLeft: String(requestsLeft), requestsLimit: String(requestsLimit) })}
    ${progressBar}
🔥 ${t(lang, "common.streak")}: *${user?.streakDays || 0}*
🕐 ${lastActivity}${requestsWarning}

━━━━━━━━━━━━━━━━━━━━

${t(lang, "dashboard.selectModule")}`;

    const webUrl = process.env.WEB_DOMAIN || "https://www.darkshare.store";

    const keyboardRows = [
      [
        Markup.button.callback(t(lang, "modules.ip"), "mod_ip"),
        Markup.button.callback(t(lang, "modules.wallet"), "mod_wallet"),
        Markup.button.callback(t(lang, "modules.phone"), "mod_phone")
      ],
      [
        Markup.button.callback(t(lang, "modules.email"), "mod_email"),
        Markup.button.callback(t(lang, "modules.domain"), "mod_business"),
        Markup.button.callback(t(lang, "modules.url"), "mod_url")
      ],
      [
        Markup.button.callback(t(lang, "modules.cve"), "mod_cve"),
        Markup.button.callback(t(lang, "modules.hash"), "mod_hash"),
        Markup.button.callback(t(lang, "modules.username"), "mod_username")
      ],
      [
        Markup.button.callback(t(lang, "modules.card"), "mod_card"),
        Markup.button.callback(t(lang, "modules.iot"), "mod_iot"),
        Markup.button.callback(t(lang, "modules.cloud"), "mod_cloud")
      ],
      [
        Markup.button.callback(t(lang, "buttons.monitoring"), "monitoring"),
        Markup.button.callback("📄 " + t(lang, "common.reports"), "reports"),
        Markup.button.callback(t(lang, "buttons.history"), "history")
      ],
      [
        Markup.button.callback(t(lang, "buttons.settings"), "settings"),
        Markup.button.callback(t(lang, "buttons.upgrade"), "upgrade"),
        Markup.button.callback(t(lang, "buttons.referrals"), "referrals")
      ],
      [
        Markup.button.callback(t(lang, "buttons.profile"), "profile"),
        Markup.button.callback(t(lang, "buttons.achievements"), "achievements"),
        Markup.button.callback("🔄 " + (lang === "uk" ? "Оновити" : lang === "ru" ? "Обновить" : "Refresh"), "refresh_dashboard")
      ],
      [
        Markup.button.url("🖥️ " + t(lang, "common.webPanel"), webUrl)
      ]
    ];
    
    if (isAdmin(tgId)) {
      keyboardRows.push([Markup.button.callback("🛡️ ADMIN PANEL", "open_admin_panel")]);
    }
    
    const keyboard = Markup.inlineKeyboard(keyboardRows);

    try {
      if (isEdit) {
        await ctx.editMessageText(dashboardText, { parse_mode: "Markdown", ...keyboard });
      } else {
        await ctx.reply(dashboardText, { parse_mode: "Markdown", ...keyboard });
      }
    } catch {
      await ctx.reply(dashboardText, { parse_mode: "Markdown", ...keyboard });
    }
  }

  bot.action(["dashboard", "back_to_dashboard"], async (ctx) => {
    const tgId = ctx.from!.id.toString();
    await showDashboard(ctx, tgId, true);
  });

  bot.action("refresh_dashboard", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const lang = await getLang(tgId);
    await ctx.answerCbQuery(lang === "uk" ? "🔄 Оновлено!" : lang === "ru" ? "🔄 Обновлено!" : "🔄 Refreshed!");
    await showDashboard(ctx, tgId, true);
  });

  bot.command("menu", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    await showDashboard(ctx, tgId, false);
  });

  bot.command("stats", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const user = await storage.getUserByTgId(tgId);
    const lang = getUserLang(user?.lang);
    
    if (!user) {
      return ctx.reply(t(lang, "common.error") + ": " + t(lang, "common.na"));
    }

    const reports = await storage.getReports(user.id);
    const watches = await storage.getWatches(user.id);
    
    let referralStats = { count: 0, pendingCount: 0, referredUsers: [] as any[] };
    try {
      referralStats = await storage.getReferralStats(user.id);
    } catch (e) {}

    const tierEmoji = user.tier === "ENTERPRISE" ? "👑" : user.tier === "PRO" ? "⭐" : "🆓";
    const requestsBar = generateProgressBar(user.requestsLeft || 0, 15);
    const streakBar = generateProgressBar(Math.min(user.streakDays || 0, 30), 30);
    
    const joinDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString(lang === "en" ? "en-US" : "uk-UA") : "—";
    const lastActive = formatLastActivity(user.lastLogin, lang);

    const statsText = `📊 *${t(lang, "common.stats")}*
━━━━━━━━━━━━━━━━━━━━

👤 ${t(lang, "common.profile")}:
• ID: ${user.tgId}
• Username: @${user.username ? user.username.replace(/_/g, "\\_") : "—"}
• ${tierEmoji} ${t(lang, "common.tier")}: ${user.tier || "FREE"}
• 📅 ${joinDate}

📈 ${t(lang, "common.activity")}:
• 🔍 ${t(lang, "common.checks")}: ${reports.length}
• 👁 ${t(lang, "buttons.monitoring")}: ${watches.length}
• 📣 ${t(lang, "buttons.referrals")}: ${referralStats.count}
• 🕐 ${lastActive}

🎯 ${t(lang, "common.progress")}:
• 📊 ${requestsBar} ${user.requestsLeft || 0}/15
• 🔥 ${streakBar} ${user.streakDays || 0}/30 ${t(lang, "common.days")}

🏅 ${t(lang, "buttons.achievements")}:
${reports.length >= 10 ? "✅" : "⬜"} 🏆 10+
${reports.length >= 50 ? "✅" : "⬜"} 🛡️ 50+
${(user.streakDays || 0) >= 7 ? "✅" : "⬜"} 🔥 7d
${referralStats.count >= 5 ? "✅" : "⬜"} 📣 5+`;

    await ctx.reply(statsText, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [Markup.button.callback(t(lang, "buttons.newCheck"), "dashboard")],
        [Markup.button.callback(t(lang, "buttons.referrals"), "referrals")],
        [Markup.button.callback(t(lang, "buttons.back"), "back_to_dashboard")]
      ])
    });
  });

  bot.command("help", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const user = await storage.getUserByTgId(tgId);
    const lang = getUserLang(user?.lang);

    const helpText = `❓ *${t(lang, "common.help")}*
━━━━━━━━━━━━━━━━━━━━

🤖 ${t(lang, "common.commands")}:
• /start - ${t(lang, "help.startDesc")}
• /menu - ${t(lang, "help.menuDesc")}
• /stats - ${t(lang, "help.statsDesc")}
• /help - ${t(lang, "help.helpDesc")}

━━━━━━━━━━━━━━━━━━━━

🔍 ${t(lang, "dashboard.selectModule")}:
• 🌐 IP - geo, VPN, blacklists
• 💰 Wallet - ETH/BTC/TRX/SOL
• 📱 Phone - carrier, VOIP
• 📧 Email - leaks, MX
• 🏢 Domain - WHOIS, SSL
• 🔗 URL - phishing scan
• 🔓 CVE - vulnerabilities
• 🔢 Hash - malware
• 👤 Username - OSINT

━━━━━━━━━━━━━━━━━━━━

📝 ${t(lang, "common.examples")}:
├ IP: \`8.8.8.8\`
• Wallet: 0x742d35Cc...
• Email: user@example.com
• Domain: example.com
• URL: https://site.com
• CVE: CVE-2024-1234

💡 ${t(lang, "common.tips")}:
• ${t(lang, "help.tipPdf")}
• ${t(lang, "help.tipMonitor")}
• ${t(lang, "help.tipReferral")}`;

    await ctx.reply(helpText, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [Markup.button.callback(t(lang, "buttons.newCheck"), "dashboard")],
        [Markup.button.callback(t(lang, "buttons.upgrade"), "upgrade")],
        [Markup.button.callback(t(lang, "buttons.back"), "back_to_dashboard")]
      ])
    });
  });

  bot.action(/^share_result_/, async (ctx) => {
    const parts = ctx.match.input.split('_');
    const module = parts[2];
    const target = parts.slice(3).join('_');
    const tgId = ctx.from!.id.toString();
    const user = await storage.getUserByTgId(tgId);
    const lang = getUserLang(user?.lang);
    
    const botUsername = (await bot.telegram.getMe()).username || "ShareposchukBot";
    const shareText = `🔍 ${t(lang, "share.checked")}:\n${module.toUpperCase()}: ${target.substring(0, 30)}...\n\n🤖 ${t(lang, "share.tryIt")}: @${botUsername}`;
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(`https://t.me/${botUsername}`)}&text=${encodeURIComponent(shareText)}`;
    
    await ctx.answerCbQuery(t(lang, "share.sharing"));
    await ctx.reply(`📤 *${t(lang, "share.title")}:*\n\n${t(lang, "share.clickBelow")}`, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [Markup.button.url(t(lang, "buttons.share"), shareUrl)],
        [Markup.button.callback(t(lang, "buttons.back"), "back_to_dashboard")]
      ])
    });
  });

  const moduleActions = ["mod_ip", "mod_wallet", "mod_phone", "mod_email", "mod_business", "mod_url", "mod_cve", "mod_hash", "mod_username", "mod_card"];
  const moduleMap: Record<string, string> = {
    "mod_ip": "ip",
    "mod_wallet": "wallet", 
    "mod_phone": "phone",
    "mod_email": "email",
    "mod_business": "domain",
    "mod_url": "url",
    "mod_cve": "cve",
    "mod_hash": "hash",
    "mod_username": "username",
    "mod_card": "card"
  };

  for (const action of moduleActions) {
    bot.action(action, async (ctx) => {
      const tgId = ctx.from!.id.toString();
      const lang = await getLang(tgId);
      const module = moduleMap[action];
      userStates.set(tgId, { module, step: "input" });
      const text = t(lang, `modulePrompts.${module}`);
      const keyboard = Markup.inlineKeyboard([[Markup.button.callback(t(lang, "buttons.cancel"), "back_to_dashboard")]]);
      try {
        await ctx.editMessageText(text, { parse_mode: "Markdown", ...keyboard });
      } catch {
        await ctx.reply(text, { parse_mode: "Markdown", ...keyboard });
      }
    });
  }

  bot.action(["mod_iot", "mod_cloud"], async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const lang = await getLang(tgId);
    await ctx.answerCbQuery(t(lang, "premium.locked"));
    
    const text = t(lang, "common.proOnly");
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback(t(lang, "upgrade.buyPro"), "upgrade")],
      [Markup.button.callback(t(lang, "buttons.back"), "back_to_dashboard")]
    ]);
    
    try {
      await ctx.editMessageText(text, { parse_mode: "Markdown", ...keyboard });
    } catch {
      await ctx.reply(text, { parse_mode: "Markdown", ...keyboard });
    }
  });

  bot.on("text", async (ctx) => {
    const text = ctx.message.text;
    const tgId = ctx.from!.id.toString();
    const user = await storage.getUserByTgId(tgId);
    const lang = getUserLang(user?.lang);
    const state = userStates.get(tgId);

    if (state?.module === "admin_broadcast" && state?.step === "awaiting_message") {
      if (!isAdmin(tgId)) {
        userStates.delete(tgId);
        return ctx.reply("⛔ Доступ заборонено");
      }
      
      const broadcastText = text.trim();
      userStates.set(tgId, { module: "admin_broadcast", step: "confirm", data: { message: broadcastText } });
      
      await ctx.reply(`📢 *Підтвердження розсилки*\n\n*Повідомлення:*\n${broadcastText}\n\nПідтвердіть розсилку:`, {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([
          [
            Markup.button.callback("✅ Відправити", "admin_broadcast_confirm"),
            Markup.button.callback("❌ Скасувати", "admin_broadcast_cancel")
          ]
        ])
      });
      return;
    }

    if (state?.module === "admin_block_user" && state?.step === "awaiting_tgid") {
      if (!isAdmin(tgId)) {
        userStates.delete(tgId);
        return ctx.reply("⛔ Доступ заборонено");
      }
      
      const targetTgId = text.trim();
      const targetUser = await storage.getUserByTgId(targetTgId);
      
      if (!targetUser) {
        return ctx.reply(`❌ Користувача з ID \`${targetTgId}\` не знайдено.`, {
          parse_mode: "Markdown",
          ...Markup.inlineKeyboard([[Markup.button.callback("⬅️ Назад", "admin_back")]])
        });
      }
      
      userStates.delete(tgId);
      
      const statusEmoji = targetUser.blocked ? "🔴" : "🟢";
      const resultText = `👤 *Користувач знайдений:*\n\n` +
        `${statusEmoji} ${targetUser.username ? `@${targetUser.username}` : targetUser.tgId}\n` +
        `Тариф: ${targetUser.tier}\n` +
        `Статус: ${targetUser.blocked ? "Заблокований" : "Активний"}\n\n` +
        `Виберіть дію:`;
      
      await ctx.reply(resultText, {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([
          [Markup.button.callback(targetUser.blocked ? "✅ Розблокувати" : "🚫 Заблокувати", `admin_toggle_block_${targetUser.id}`)],
          [Markup.button.callback("📋 Детальніше", `admin_user_info_${targetUser.id}`)],
          [Markup.button.callback("⬅️ Назад", "admin_back")]
        ])
      });
      return;
    }

    if (state?.module === "admin_change_tier" && state?.step === "awaiting_tgid") {
      if (!isAdmin(tgId)) {
        userStates.delete(tgId);
        return ctx.reply("⛔ Доступ заборонено");
      }
      
      const targetTgId = text.trim();
      const targetUser = await storage.getUserByTgId(targetTgId);
      
      if (!targetUser) {
        return ctx.reply(`❌ Користувача з ID \`${targetTgId}\` не знайдено.`, {
          parse_mode: "Markdown",
          ...Markup.inlineKeyboard([[Markup.button.callback("⬅️ Назад", "admin_back")]])
        });
      }
      
      userStates.delete(tgId);
      
      const tierEmoji = targetUser.tier === "ENTERPRISE" ? "👑" : targetUser.tier === "PRO" ? "⭐" : "🆓";
      const resultText = `📊 *ЗМІНА ТАРИФУ*\n\n` +
        `👤 ${targetUser.username ? `@${targetUser.username}` : targetUser.tgId}\n` +
        `${tierEmoji} Поточний тариф: ${targetUser.tier}\n\n` +
        `Виберіть новий тариф:`;
      
      await ctx.reply(resultText, {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([
          [
            Markup.button.callback("🆓 FREE", `admin_set_tier_${targetUser.id}_FREE`),
            Markup.button.callback("⭐ PRO", `admin_set_tier_${targetUser.id}_PRO`),
            Markup.button.callback("👑 ENTERPRISE", `admin_set_tier_${targetUser.id}_ENTERPRISE`)
          ],
          [Markup.button.callback("⬅️ Назад", "admin_back")]
        ])
      });
      return;
    }

    if (state?.module === "admin_search_user" && state?.step === "awaiting_query") {
      if (!isAdmin(tgId)) {
        userStates.delete(tgId);
        return ctx.reply("⛔ Доступ заборонено");
      }
      
      const query = text.trim();
      const foundUsers = await storage.searchUsers(query);
      
      userStates.delete(tgId);
      
      if (foundUsers.length === 0) {
        return ctx.reply(`🔍 *Результати пошуку*\n\nПо запиту "${query}" нічого не знайдено.`, {
          parse_mode: "Markdown",
          ...Markup.inlineKeyboard([
            [Markup.button.callback("🔍 Новий пошук", "admin_search_user")],
            [Markup.button.callback("⬅️ Назад", "admin_back")]
          ])
        });
      }
      
      let resultText = `🔍 *Результати пошуку* (${foundUsers.length})\n\n`;
      
      foundUsers.slice(0, 10).forEach((u, i) => {
        const statusEmoji = u.blocked ? "🔴" : "🟢";
        const tierEmoji = u.tier === "ENTERPRISE" ? "👑" : u.tier === "PRO" ? "⭐" : "🆓";
        resultText += `${i + 1}. ${statusEmoji} ${tierEmoji} ${u.username ? `@${u.username}` : "—"}\n`;
        resultText += `   ID: \`${u.tgId}\`\n`;
      });
      
      if (foundUsers.length > 10) {
        resultText += `\n_...та ще ${foundUsers.length - 10} результатів_`;
      }
      
      const buttons: any[][] = [];
      foundUsers.slice(0, 5).forEach(u => {
        buttons.push([Markup.button.callback(`👤 ${u.username || u.tgId}`, `admin_user_info_${u.id}`)]);
      });
      buttons.push([Markup.button.callback("🔍 Новий пошук", "admin_search_user")]);
      buttons.push([Markup.button.callback("⬅️ Назад", "admin_back")]);
      
      await ctx.reply(resultText, {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard(buttons)
      });
      return;
    }

    if (state?.module === "payment" && state?.step === "awaiting_proof") {
      if (!user) return;
      
      const txHash = text.trim();
      
      const payment = await storage.createPayment({
        userId: user.id,
        tier: state.data.tier,
        amountUsdt: state.data.amount,
        txHash: txHash,
        status: "pending",
      });

      userStates.delete(tgId);

      await ctx.reply(t(lang, "payment.created", { id: payment.id.toString() }) + `\n\n${t(lang, "common.tier")}: ${state.data.tier}\n${t(lang, "common.amount")}: $${state.data.amount} USDT\n${t("uk", "admin.txHash")}: ${txHash}\n\n${t(lang, "payment.pending")}`, 
        Markup.inlineKeyboard([[Markup.button.callback(t(lang, "buttons.back"), "back_to_dashboard")]])
      );

      for (const adminId of ADMIN_IDS) {
        try {
          await ctx.telegram.sendMessage(adminId, t("uk", "admin.newPayment", { id: payment.id.toString() }) + `\n\n${t("uk", "admin.user", { username: user.username || t("uk", "common.na"), tgId: user.tgId })}\n${t("uk", "admin.tier", { tier: state.data.tier })}\n${t("uk", "admin.paymentAmount", { amount: state.data.amount })}\n${t("uk", "admin.txHash")}: ${txHash}`, 
            {
              reply_markup: Markup.inlineKeyboard([
                [
                  Markup.button.callback(t("uk", "admin.approve"), `approve_pay_${payment.id}`),
                  Markup.button.callback(t("uk", "admin.reject"), `reject_pay_${payment.id}`)
                ]
              ]).reply_markup
            }
          );
        } catch (e) {
          console.log(`Failed to notify admin ${adminId}:`, e);
        }
      }
      return;
    }

    if (user && user.requestsLeft! <= 0) {
      const limitText = lang === "uk" 
        ? "❌ *Ліміт вичерпано*\n\n✨ Обновіть тариф щоб продовжити\n\n💡 PRO: безліміт запитів\n👑 ENTERPRISE: та ще більше!"
        : lang === "ru"
        ? "❌ *Лимит исчерпан*\n\n✨ Обновите тариф чтобы продолжить\n\n💡 PRO: неограниченные запросы\n👑 ENTERPRISE: и ещё больше!"
        : "❌ *Limit Exceeded*\n\n✨ Upgrade your plan to continue\n\n💡 PRO: unlimited requests\n👑 ENTERPRISE: and more!";
      
      return ctx.reply(limitText, {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([
          [Markup.button.callback(t(lang, "buttons.upgrade"), "upgrade")],
          [Markup.button.callback(t(lang, "buttons.back"), "back_to_dashboard")]
        ])
      });
    }

    if (!state || !state.module) {
      return ctx.reply(t(lang, "common.useMenu"));
    }

    const inputValue = text.trim();
    
    // Validation with helpful error messages
    switch (state.module) {
      case "ip":
        if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(inputValue)) {
          const ipErrorMsg = lang === "uk"
            ? "❌ *Невірна IP адреса*\n\n💡 Приклад: `8.8.8.8`"
            : lang === "ru"
            ? "❌ *Неверный IP адрес*\n\n💡 Пример: `8.8.8.8`"
            : "❌ *Invalid IP address*\n\n💡 Example: `8.8.8.8`";
          return ctx.reply(ipErrorMsg, { parse_mode: "Markdown" });
        }
        break;
      case "wallet":
        if (!inputValue.startsWith("0x") || inputValue.length < 20) {
          const walletErrorMsg = lang === "uk"
            ? "❌ *Невірна адреса гаманця*\n\n💡 Виглядає так: `0x742d35Cc6634C0532925a3b844Bc9e7595f...`"
            : lang === "ru"
            ? "❌ *Неверный адрес кошелька*\n\n💡 Выглядит так: `0x742d35Cc6634C0532925a3b844Bc9e7595f...`"
            : "❌ *Invalid wallet address*\n\n💡 Looks like: `0x742d35Cc6634C0532925a3b844Bc9e7595f...`";
          return ctx.reply(walletErrorMsg, { parse_mode: "Markdown" });
        }
        break;
      case "email":
        if (!inputValue.includes("@")) {
          const emailErrorMsg = lang === "uk"
            ? "❌ *Невірна email адреса*\n\n💡 Приклад: `user@example.com`"
            : lang === "ru"
            ? "❌ *Неверный email адрес*\n\n💡 Пример: `user@example.com`"
            : "❌ *Invalid email address*\n\n💡 Example: `user@example.com`";
          return ctx.reply(emailErrorMsg, { parse_mode: "Markdown" });
        }
        break;
    }
    
    // Send initial loading message and store message ID
    let checkResult: CheckResult;
    let loadingMsg = await ctx.reply(lang === "uk" ? "⏳ *Аналізую...* " : lang === "ru" ? "⏳ *Анализирую...* " : "⏳ *Analyzing...* ", { parse_mode: "Markdown" });
    
    try {
      // Loading animation
      const loadingEmojis = ["⏳", "🔄", "✅"];
      const animationDelay = 600;
      
      for (let i = 0; i < 2; i++) {
        await new Promise(resolve => setTimeout(resolve, animationDelay));
        try {
          const animText = loadingEmojis[i] + " " + 
            (lang === "uk" ? "*Аналізую...* " : lang === "ru" ? "*Анализирую...* " : "*Analyzing...* ");
          await ctx.telegram.editMessageText(
            ctx.chat.id,
            loadingMsg.message_id,
            undefined,
            animText,
            { parse_mode: "Markdown" }
          );
        } catch (e) {
          // Ignore edit errors
        }
      }

      checkResult = await performCheck(state.module, inputValue);
      
      // Final success animation
      try {
        const finalText = "✅ " + (lang === "uk" ? "*Готово!*" : lang === "ru" ? "*Готово!*" : "*Done!*");
        await ctx.telegram.editMessageText(
          ctx.chat.id,
          loadingMsg.message_id,
          undefined,
          finalText,
          { parse_mode: "Markdown" }
        );
      } catch (e) {
        // Ignore edit errors
      }
    } catch (error: any) {
      console.error("Check error:", error);
      try {
        await ctx.telegram.editMessageText(
          ctx.chat.id,
          loadingMsg.message_id,
          undefined,
          "❌ " + (lang === "uk" ? "*Помилка аналізу*" : lang === "ru" ? "*Ошибка анализа*" : "*Analysis error*"),
          { parse_mode: "Markdown" }
        );
      } catch (e) {
        // Ignore
      }
      const errorMsg = lang === "uk"
        ? "❌ *Помилка при обробці*\n\n💡 Спробуйте ще раз або змініть формат даних."
        : lang === "ru"
        ? "❌ *Ошибка при обработке*\n\n💡 Попробуйте ещё раз или измените формат данных."
        : "❌ *Processing error*\n\n💡 Try again or change the data format.";
      return ctx.reply(errorMsg, { parse_mode: "Markdown" });
    }
    
    const getStatusIndicator = (level: string, lang: Language) => {
      switch (level) {
        case "low": return lang === "uk" ? "✅ БЕЗПЕЧНО" : lang === "ru" ? "✅ БЕЗОПАСНО" : "✅ SAFE";
        case "medium": return lang === "uk" ? "⚠️ УВАГА" : lang === "ru" ? "⚠️ ВНИМАНИЕ" : "⚠️ CAUTION";
        case "high": return lang === "uk" ? "🔴 НЕБЕЗПЕКА" : lang === "ru" ? "🔴 ОПАСНОСТЬ" : "🔴 DANGER";
        case "critical": return lang === "uk" ? "💀 КРИТИЧНО" : lang === "ru" ? "💀 КРИТИЧНО" : "💀 CRITICAL";
        default: return "⚠️ CAUTION";
      }
    };

    const moduleEmojis: Record<string, string> = {
      ip: "🌐", wallet: "💰", phone: "📱", 
      email: "📧", domain: "🏢", url: "🔗",
      cve: "🔓", hash: "🔢", username: "👤",
      card: "💳", iot: "📡", cloud: "☁️"
    };

    const moduleNames: Record<string, string> = {
      ip: lang === "uk" ? "IP/GEO АНАЛІЗ" : lang === "ru" ? "IP/GEO АНАЛИЗ" : "IP/GEO ANALYSIS",
      wallet: lang === "uk" ? "КРИПТО АНАЛІЗ" : lang === "ru" ? "КРИПТО АНАЛИЗ" : "CRYPTO ANALYSIS", 
      phone: lang === "uk" ? "ТЕЛЕФОН OSINT" : lang === "ru" ? "ТЕЛЕФОН OSINT" : "PHONE OSINT",
      email: lang === "uk" ? "EMAIL АНАЛІЗ" : lang === "ru" ? "EMAIL АНАЛИЗ" : "EMAIL ANALYSIS",
      domain: lang === "uk" ? "ДОМЕН/WHOIS" : lang === "ru" ? "ДОМЕН/WHOIS" : "DOMAIN/WHOIS",
      url: lang === "uk" ? "URL ПЕРЕВІРКА" : lang === "ru" ? "URL ПРОВЕРКА" : "URL CHECK",
      cve: lang === "uk" ? "CVE СКАНУВАННЯ" : lang === "ru" ? "CVE СКАНИРОВАНИЕ" : "CVE SCAN",
      hash: lang === "uk" ? "ХЕШ АНАЛІЗ" : lang === "ru" ? "ХЕШ АНАЛИЗ" : "HASH ANALYSIS",
      username: "USERNAME OSINT",
      card: lang === "uk" ? "КАРТКА BIN АНАЛІЗ" : lang === "ru" ? "КАРТА BIN АНАЛИЗ" : "CARD BIN ANALYSIS",
      iot: "IOT SCAN",
      cloud: "CLOUD CHECK"
    };
    
    // Create visual risk indicator
    const getRiskVisuals = (score: number): { bar: string; color: string; emoji: string } => {
      if (score >= 80) return { bar: "🔴🔴🔴🔴🔴", color: "CRITICAL", emoji: "💀" };
      if (score >= 60) return { bar: "🔴🔴🔴🔴⚪", color: "HIGH", emoji: "🔴" };
      if (score >= 40) return { bar: "🔴🔴🔴⚪⚪", color: "MEDIUM", emoji: "⚠️" };
      if (score >= 20) return { bar: "🔴🔴⚪⚪⚪", color: "LOW", emoji: "✅" };
      return { bar: "🔴⚪⚪⚪⚪", color: "SAFE", emoji: "✅" };
    };

    const riskVisuals = getRiskVisuals(checkResult.riskScore);
    const statusIndicator = getStatusIndicator(checkResult.riskLevel, lang);
    
    const targetDisplay = checkResult.target.length > 30 
      ? checkResult.target.substring(0, 27) + "..." 
      : checkResult.target;

    let result: string;

    if (state.module === "card") {
      const bankName = checkResult.details?.bank?.name || (lang === "uk" ? "Невідомий" : lang === "ru" ? "Неизвестный" : "Unknown");
      const countryEmoji = checkResult.details?.country?.emoji || "🌍";
      const countryName = checkResult.details?.country?.name || (lang === "uk" ? "Невідомо" : lang === "ru" ? "Неизвестно" : "Unknown");
      const cardBrand = checkResult.details?.brand || "—";
      const cardType = checkResult.details?.type ? (
        checkResult.details.type === "debit" ? (lang === "uk" ? "Дебетова" : lang === "ru" ? "Дебетовая" : "Debit") :
        checkResult.details.type === "credit" ? (lang === "uk" ? "Кредитна" : lang === "ru" ? "Кредитная" : "Credit") :
        checkResult.details.type
      ) : "—";
      const isPrepaid = checkResult.details?.isPrepaid;
      
      const findingsFormatted = checkResult.findings.slice(0, 5).map((f, i, arr) => 
        i === arr.length - 1 ? `└ ${f}` : `├ ${f}`
      ).join("\n");

      const infoLabel = lang === "uk" ? "ІНФОРМАЦІЯ" : lang === "ru" ? "ИНФОРМАЦИЯ" : "INFO";
      const analysisLabel = lang === "uk" ? "АНАЛІЗ" : lang === "ru" ? "АНАЛИЗ" : "ANALYSIS";
      const riskLabel = lang === "uk" ? "РИЗИК" : lang === "ru" ? "РИСК" : "RISK";
      const bankLabel = lang === "uk" ? "Банк" : lang === "ru" ? "Банк" : "Bank";
      const countryLabel = lang === "uk" ? "Країна" : lang === "ru" ? "Страна" : "Country";
      const brandLabel = lang === "uk" ? "Бренд" : lang === "ru" ? "Бренд" : "Brand";
      const typeLabel = lang === "uk" ? "Тип" : lang === "ru" ? "Тип" : "Type";
      const statusLabel = lang === "uk" ? "Статус" : lang === "ru" ? "Статус" : "Status";

      result = `╔═══════════════════════╗
║ ${moduleEmojis.card} ${moduleNames.card}║
╚═══════════════════════╝

🔢 *BIN:* \`${targetDisplay}\`
⚡ *${statusLabel}:* ${statusIndicator}

┌─ ${infoLabel} ─┐
🏦 *${bankLabel}:* ${bankName}
🌍 *${countryLabel}:* ${countryEmoji} ${countryName}
💳 *${brandLabel}:* ${cardBrand}
📋 *${typeLabel}:* ${cardType}
└──────────────────┘

┌─ ${analysisLabel} ─┐
${findingsFormatted}
└──────────────────┘

${riskVisuals.emoji} *${riskLabel}*
${riskVisuals.bar}
${checkResult.riskScore}% | ${riskVisuals.color}

🔗 ${checkResult.sources.slice(0, 3).join(", ")}

═════════════════════`;

    } else {
      const findingsFormatted = checkResult.findings.slice(0, 6).map((f, i, arr) => 
        i === arr.length - 1 ? `└ ${f}` : `├ ${f}`
      ).join("\n");

      const statusLabel = lang === "uk" ? "Статус" : lang === "ru" ? "Статус" : "Status";
      const targetLabel = lang === "uk" ? "Ціль" : lang === "ru" ? "Цель" : "Target";
      const analysisLabel = lang === "uk" ? "АНАЛІЗ" : lang === "ru" ? "АНАЛИЗ" : "ANALYSIS";
      const riskLabel = lang === "uk" ? "РИЗИК" : lang === "ru" ? "РИСК" : "RISK";

      let detailsSection = "";
      
      if (state.module === "ip" && checkResult.details) {
        const countryInfo = checkResult.details.country ? `${checkResult.details.countryCode || ""} ${checkResult.details.country}` : "";
        const cityInfo = checkResult.details.city || "";
        const ispInfo = checkResult.details.isp || "";
        
        const locationLabel = lang === "uk" ? "Локація" : lang === "ru" ? "Локация" : "Location";
        const ispLabel = lang === "uk" ? "Провайдер" : lang === "ru" ? "Провайдер" : "ISP";
        
        if (countryInfo || cityInfo) {
          detailsSection = `
┌─ ${lang === "uk" ? "ДЕТАЛІ" : lang === "ru" ? "ДЕТАЛИ" : "DETAILS"} ─┐
🌍 *${locationLabel}:* ${cityInfo}${cityInfo && countryInfo ? ", " : ""}${countryInfo}
🏢 *${ispLabel}:* ${ispInfo}
└──────────────────┘`;
        }
      } else if (state.module === "wallet" && checkResult.details) {
        const chain = checkResult.details.chain || "";
        const chainLabel = lang === "uk" ? "Мережа" : lang === "ru" ? "Сеть" : "Chain";
        
        if (chain) {
          detailsSection = `
┌─ ${lang === "uk" ? "ДЕТАЛІ" : lang === "ru" ? "ДЕТАЛИ" : "DETAILS"} ─┐
⛓️ *${chainLabel}:* ${chain}
└──────────────────┘`;
        }
      } else if (state.module === "email" && checkResult.details) {
        const domain = checkResult.details.domain || "";
        const mx = checkResult.details.hasMx ? "✅" : "❌";
        
        if (domain) {
          detailsSection = `
┌─ ${lang === "uk" ? "ДЕТАЛІ" : lang === "ru" ? "ДЕТАЛИ" : "DETAILS"} ─┐
🌐 *${lang === "uk" ? "Домен" : lang === "ru" ? "Домен" : "Domain"}:* ${domain}
📧 *MX:* ${mx}
└──────────────────┘`;
        }
      }

      result = `╔═══════════════════════╗
║ ${moduleEmojis[state.module] || "🔍"} ${moduleNames[state.module] || state.module.toUpperCase().substring(0, 18)}║
╚═══════════════════════╝

🎯 *${targetLabel}:* \`${targetDisplay}\`
⚡ *${statusLabel}:* ${statusIndicator}${detailsSection}

┌─ ${analysisLabel} ─┐
${findingsFormatted}
└──────────────────┘

${riskVisuals.emoji} *${riskLabel}*
${riskVisuals.bar}
${checkResult.riskScore}% | ${riskVisuals.color}

🔗 ${checkResult.sources.slice(0, 3).join(", ")}

═════════════════════`;
    }

    if (user) {
      await storage.updateUser(user.id, { requestsLeft: Math.max(0, (user.requestsLeft || 15) - 1) });
      
      await storage.createReport({
        userId: user.id,
        objectType: state.module,
        dataJson: {
          target: checkResult.target,
          riskScore: checkResult.riskScore,
          riskLevel: checkResult.riskLevel,
          findings: checkResult.findings,
          details: checkResult.details,
          sources: checkResult.sources,
          summary: checkResult.summary,
        },
      });
    }

    userStates.delete(tgId);

    await ctx.reply(result, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [
          Markup.button.callback(t(lang, "buttons.pdf"), `gen_pdf_${state.module}_${inputValue}`),
          Markup.button.callback(t(lang, "buttons.newCheck"), `mod_${state.module === "domain" ? "business" : state.module}`)
        ],
        [
          Markup.button.callback(t(lang, "buttons.monitoring"), `add_monitor_${state.module}_${inputValue}`),
          Markup.button.callback(t(lang, "buttons.share"), `share_result_${state.module}_${inputValue}`)
        ],
        [
          Markup.button.callback(t(lang, "buttons.back"), "back_to_dashboard")
        ]
      ])
    });
  });

  bot.action(/^gen_pdf_/, async (ctx) => {
    const parts = ctx.match.input.split('_');
    const module = parts[2];
    const target = parts.slice(3).join('_');
    const tgId = ctx.from!.id.toString();
    const user = await storage.getUserByTgId(tgId);
    const lang = getUserLang(user?.lang);
    
    if (!user) return ctx.answerCbQuery(t(lang, "common.error"));

    try {
      const generatingText = t(lang, "common.generatingPdf");
      await ctx.answerCbQuery(generatingText);
      
      const checkResult = await performCheck(module, target);
      const findings = generateFindings(module, checkResult.riskLevel);
      const metadata = generateMetadata(module);
      
      const verificationId = `DS-${Date.now().toString(36).toUpperCase()}`;
      const pdfBuffer = await generateDetailedPDF({
        moduleType: module,
        targetValue: target,
        riskLevel: checkResult.riskLevel as "low" | "medium" | "high" | "critical",
        riskScore: checkResult.riskScore,
        timestamp: new Date(),
        userId: user.id.toString(),
        findings,
        sources: checkResult.sources,
        metadata,
        verificationId
      });

      const filename = `darkshare_${module}_${Date.now()}.pdf`;
      
      await ctx.replyWithDocument({
        source: pdfBuffer,
        filename: filename
      });
    } catch (err) {
      console.error("PDF generation error:", err);
      const errorText = t(lang, "common.pdfError");
      await ctx.reply(errorText);
    }
  });

  bot.action(/^add_monitor_/, async (ctx) => {
    const parts = ctx.match.input.split('_');
    const module = parts[2];
    const target = parts.slice(3).join('_');
    const tgId = ctx.from!.id.toString();
    const user = await storage.getUserByTgId(tgId);
    const lang = getUserLang(user?.lang);
    
    if (!user) return ctx.answerCbQuery(t(lang, "common.error"));

    const existingWatches = await storage.getWatches(user.id);
    const watchLimit = user.tier === "FREE" ? 1 : 999;
    
    if (existingWatches.length >= watchLimit) {
      await ctx.answerCbQuery(t(lang, "monitoring.limitReached"));
      return ctx.reply(t(lang, "monitoring.upgradeHint"), 
        Markup.inlineKeyboard([
          [Markup.button.callback(t(lang, "upgrade.buyPro"), "upgrade")],
          [Markup.button.callback(t(lang, "buttons.back"), "back_to_dashboard")]
        ])
      );
    }

    await storage.createWatch({
      userId: user.id,
      objectType: module,
      value: target,
      status: "low",
      alertsOn: true,
    });

    await ctx.answerCbQuery(t(lang, "monitoring.added"));
    await ctx.reply(t(lang, "monitoring.added") + "\n\n" + t(lang, "monitoring.description"), 
      Markup.inlineKeyboard([[Markup.button.callback(t(lang, "buttons.back"), "back_to_dashboard")]])
    );
  });

  bot.action("monitoring", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const user = await storage.getUserByTgId(tgId);
    const lang = getUserLang(user?.lang);
    
    if (!user) return;

    const watches = await storage.getWatches(user.id);
    
    const title = t(lang, "monitoring.title");
    let text = `${title}\n\n`;
    
    if (watches.length === 0) {
      text += t(lang, "common.empty") + "\n\n" + t(lang, "common.addAfterCheck");
    } else {
      watches.forEach((w, i) => {
        const statusEmoji = w.status === "low" ? "🟢" : w.status === "medium" ? "🟡" : "🔴";
        text += `${i + 1}. ${statusEmoji} ${w.objectType}: ${w.value}\n`;
      });
    }

    const keyboard = Markup.inlineKeyboard([[Markup.button.callback(t(lang, "buttons.back"), "back_to_dashboard")]]);
    try {
      await ctx.editMessageText(text, { parse_mode: "Markdown", ...keyboard });
    } catch {
      await ctx.reply(text, { parse_mode: "Markdown", ...keyboard });
    }
  });

  bot.action("reports", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const user = await storage.getUserByTgId(tgId);
    const lang = getUserLang(user?.lang);
    
    if (!user) return;

    const reports = await storage.getReports(user.id);
    
    const title = "📄 " + t(lang, "common.reports");
    let text = `${title}\n\n`;
    
    if (reports.length === 0) {
      text += t(lang, "common.empty") + "\n\n" + t(lang, "common.runCheck");
    } else {
      reports.slice(0, 10).forEach((r, i) => {
        const date = r.generatedAt ? new Date(r.generatedAt).toLocaleDateString() : t(lang, "common.na");
        text += `${i + 1}. ${r.objectType.toUpperCase()} - ${date}\n`;
      });
    }

    const keyboard = Markup.inlineKeyboard([[Markup.button.callback(t(lang, "buttons.back"), "back_to_dashboard")]]);
    try {
      await ctx.editMessageText(text, { parse_mode: "Markdown", ...keyboard });
    } catch {
      await ctx.reply(text, { parse_mode: "Markdown", ...keyboard });
    }
  });

  bot.action("settings", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const user = await storage.getUserByTgId(tgId);
    const lang = getUserLang(user?.lang);

    const text = `${t(lang, "settings.title")}\n\n${t(lang, "settings.language", { lang: languageNames[lang] })}\n\n${t(lang, "settings.selectLanguage")}`;

    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback("🇺🇦 Українська", "set_lang_uk"),
        Markup.button.callback("🇬🇧 English", "set_lang_en"),
        Markup.button.callback("🇷🇺 Русский", "set_lang_ru")
      ],
      [Markup.button.callback(t(lang, "buttons.back"), "back_to_dashboard")]
    ]);
    try {
      await ctx.editMessageText(text, { parse_mode: "Markdown", ...keyboard });
    } catch {
      await ctx.reply(text, { parse_mode: "Markdown", ...keyboard });
    }
  });

  bot.action(/^set_lang_/, async (ctx) => {
    const newLang = ctx.match.input.split('_')[2] as Language;
    const tgId = ctx.from!.id.toString();
    const user = await storage.getUserByTgId(tgId);
    
    if (user) {
      await storage.updateUser(user.id, { lang: newLang, langSet: true });
    }
    
    await ctx.answerCbQuery(t(newLang, "settings.languageChanged"));
    await showDashboard(ctx, tgId, true);
  });

  bot.action("referrals", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const user = await storage.getUserByTgId(tgId);
    const lang = getUserLang(user?.lang);
    
    if (!user) return;

    let referralStats = { count: 0, pendingCount: 0, referredUsers: [] as any[] };
    try {
      referralStats = await storage.getReferralStats(user.id);
    } catch (e) {
      console.log("Failed to get referral stats:", e);
    }

    const refLink = `t.me/DARKSHAREN1_BOT?start=ref_${user.refCode}`;
    const bonusEarned = referralStats.count * 2;
    const discountProgress = Math.min(referralStats.count, 5);
    const discountPercent = discountProgress * 4;

    let referredList = "";
    if (referralStats.referredUsers.length > 0) {
      referredList = "\n\n👥 *Твої реферали:*\n" + 
        referralStats.referredUsers.slice(0, 5).map((r, i) => {
          const tierEmoji = r.tier === "PRO" ? "⭐" : r.tier === "ENTERPRISE" ? "👑" : "🆓";
          return `${i + 1}. ${tierEmoji} @${r.username || "user"} - ${r.paid ? "✅ Оплатив" : "⏳ Free"}`;
        }).join("\n");
    }

    const text = `\`\`\`
╔═══════════════════════════════╗
║    📣 РЕФЕРАЛЬНА ПРОГРАМА     ║
╚═══════════════════════════════╝
\`\`\`

🎁 *Запрошуй друзів та отримуй бонуси!*

━━━━━━━━━━━━━━━━━━━━━━

🔗 *Твоє посилання:*
\`${refLink}\`

📊 *Статистика:*
├ 👥 Рефералів: *${referralStats.count}*
├ ⏳ Очікують: ${referralStats.pendingCount}
├ 🎁 Бонус запитів: *+${bonusEarned}*
└ 💰 Знижка: *${discountPercent}%* (${discountProgress}/5)

🎯 *Прогрес до -20%:*
${generateProgressBar(discountProgress, 5)} ${discountProgress}/5${referredList}

━━━━━━━━━━━━━━━━━━━━━━

💡 *Бонуси:*
├ +2 запити за кожного реферала
├ -4% знижка за кожного (до -20%)
└ Реферал отримує +5 запитів`;

    await ctx.editMessageText(text, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [Markup.button.callback("📋 Копіювати посилання", "copy_ref_link")],
        [Markup.button.url("📤 Поділитись", `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent("Приєднуйся до DARKSHARE - найкращої OSINT платформи! 🔍")}`)],
        [Markup.button.callback("⬅️ Панель", "back_to_dashboard")]
      ])
    });
  });

  bot.action("copy_ref_link", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const user = await storage.getUserByTgId(tgId);
    if (user) {
      const refLink = `t.me/DARKSHAREN1_BOT?start=ref_${user.refCode}`;
      await ctx.answerCbQuery("Посилання скопійовано!");
      await ctx.reply(`📋 Твоє реферальне посилання:\n\n\`${refLink}\``, { parse_mode: "Markdown" });
    }
  });

  bot.action("upgrade", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const lang = await getLang(tgId);

    const text = `${t(lang, "upgrade.title")}\n\n${t(lang, "upgrade.free")}\n${t(lang, "upgrade.freeDetails")}\n\n${t(lang, "upgrade.pro")}\n${t(lang, "upgrade.proDetails")}\n\n${t(lang, "upgrade.enterprise")}\n${t(lang, "upgrade.enterpriseDetails")}`;

    await ctx.editMessageText(text, 
      Markup.inlineKeyboard([
        [Markup.button.callback(t(lang, "upgrade.buyPro"), "buy_pro")],
        [Markup.button.callback(t(lang, "upgrade.buyEnterprise"), "buy_enterprise")],
        [Markup.button.callback(t(lang, "buttons.back"), "back_to_dashboard")]
      ])
    );
  });

  bot.action(["buy_pro", "buy_enterprise"], async (ctx) => {
    const tier = ctx.match.input === "buy_pro" ? "PRO" : "ENTERPRISE";
    const amount = tier === "PRO" ? "10" : "30";
    const tgId = ctx.from!.id.toString();
    const lang = await getLang(tgId);

    userStates.set(tgId, { module: "payment", step: "awaiting_proof", data: { tier, amount } });

    const text = `${t(lang, "payment.title", { tier })}\n\n${t(lang, "payment.amount", { amount })}\n\n${t(lang, "payment.address")}\n\n${t(lang, "payment.instructions")}`;

    await ctx.reply(text, 
      Markup.inlineKeyboard([
        [Markup.button.callback("📋 " + t(lang, "buttons.copyAddress"), "copy_address")],
        [Markup.button.callback(t(lang, "buttons.cancel"), "back_to_dashboard")]
      ])
    );
  });

  const TRC20_ADDRESS = "TRYbty4Ew9knf61brdrixeY5M34mQTt3zY";

  bot.action("copy_address", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const lang = await getLang(tgId);
    await ctx.answerCbQuery(t(lang, "payment.addressCopied"), { show_alert: false });
    await ctx.reply(`\`${TRC20_ADDRESS}\``, { parse_mode: "Markdown" });
  });

  bot.on("photo", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const state = userStates.get(tgId);
    
    if (state?.module === "payment" && state?.step === "awaiting_proof") {
      const user = await storage.getUserByTgId(tgId);
      if (!user) return;
      const lang = getUserLang(user.lang);

      const photo = ctx.message.photo[ctx.message.photo.length - 1];
      const fileId = photo.file_id;
      
      const payment = await storage.createPayment({
        userId: user.id,
        tier: state.data.tier,
        amountUsdt: state.data.amount,
        screenshotUrl: fileId,
        status: "pending",
      });

      userStates.delete(tgId);

      await ctx.reply(`${t(lang, "payment.created", { id: payment.id.toString() })}\n\n${t(lang, "common.tier")}: ${state.data.tier}\n${t(lang, "common.amount")}: $${state.data.amount} USDT\n\n${t(lang, "payment.pending")}`, 
        Markup.inlineKeyboard([[Markup.button.callback(t(lang, "buttons.back"), "back_to_dashboard")]])
      );

      for (const adminId of ADMIN_IDS) {
        try {
          await ctx.telegram.sendPhoto(adminId, fileId, {
            caption: `${t("uk", "admin.newPayment", { id: payment.id.toString() })}\n\n${t("uk", "admin.user", { username: user.username || t("uk", "common.na"), tgId: user.tgId })}\n${t("uk", "admin.tier", { tier: state.data.tier })}\n${t("uk", "admin.paymentAmount", { amount: state.data.amount })}\n${t("uk", "admin.type", { type: t(lang, "common.screenshot") })}`,
            reply_markup: Markup.inlineKeyboard([
              [
                Markup.button.callback(t("uk", "admin.approve"), `approve_pay_${payment.id}`),
                Markup.button.callback(t("uk", "admin.reject"), `reject_pay_${payment.id}`)
              ]
            ]).reply_markup
          });
        } catch (e) {
          console.log(`Failed to notify admin ${adminId}:`, e);
        }
      }
    }
  });

  bot.action(/^approve_pay_(\d+)$/, async (ctx) => {
    const adminTgId = ctx.from!.id.toString();
    const paymentId = parseInt(ctx.match[1]);
    
    const payment = await storage.getPaymentById(paymentId);
    if (!payment) {
      return ctx.answerCbQuery("Payment not found");
    }

    if (payment.status !== "pending") {
      return ctx.answerCbQuery(t("uk", "payment.alreadyProcessed"));
    }

    await storage.updatePaymentStatus(paymentId, "approved");
    
    const user = await storage.getUserById(payment.userId!);
    if (user) {
      const newTier = payment.tier;
      const tierLimits: Record<string, number> = {
        "pro": 50,
        "enterprise": 9999,
        "basic": 30
      };
      const newLimit = tierLimits[newTier.toLowerCase()] || 50;
      await storage.updateUser(user.id, { tier: newTier, requestsLeft: newLimit });
      
      const userLang = getUserLang(user.lang);
      const expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString();
      
      try {
        await ctx.telegram.sendMessage(user.tgId, t(userLang, "payment.approved", { id: paymentId.toString(), tier: newTier, expiry }), 
          Markup.inlineKeyboard([[Markup.button.callback(t(userLang, "buttons.back"), "back_to_dashboard")]])
        );
      } catch (e) {
        console.log(`Failed to notify user:`, e);
      }
    }

    await ctx.editMessageCaption(`${t("uk", "admin.approved", { admin: ctx.from!.username || t("uk", "common.na") })}\n\n${t("uk", "admin.newPayment", { id: paymentId.toString() })}\n${t("uk", "admin.user", { username: user?.username || t("uk", "common.na"), tgId: user?.tgId || t("uk", "common.na") })}`);
    await ctx.answerCbQuery(t("uk", "admin.approvedShort"));
  });

  bot.action(/^reject_pay_(\d+)$/, async (ctx) => {
    const paymentId = parseInt(ctx.match[1]);
    
    const payment = await storage.getPaymentById(paymentId);
    if (!payment) {
      return ctx.answerCbQuery("Payment not found");
    }

    if (payment.status !== "pending") {
      return ctx.answerCbQuery(t("uk", "payment.alreadyProcessed"));
    }

    await storage.updatePaymentStatus(paymentId, "rejected");

    const user = await storage.getUserById(payment.userId!);
    if (user) {
      const userLang = getUserLang(user.lang);
      try {
        await ctx.telegram.sendMessage(user.tgId, t(userLang, "payment.rejected", { id: paymentId.toString() }), 
          Markup.inlineKeyboard([[Markup.button.callback(t(userLang, "payment.tryAgain"), "upgrade")]])
        );
      } catch (e) {
        console.log(`Failed to notify user:`, e);
      }
    }

    await ctx.editMessageCaption(`${t("uk", "admin.rejected", { admin: ctx.from!.username || t("uk", "common.na") })}\n\n${t("uk", "admin.newPayment", { id: paymentId.toString() })}\n${t("uk", "admin.user", { username: user?.username || t("uk", "common.na"), tgId: user?.tgId || t("uk", "common.na") })}`);
    await ctx.answerCbQuery(t("uk", "admin.rejectedShort"));
  });

  bot.action("coupon", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const lang = await getLang(tgId);
    userStates.set(tgId, { module: "coupon", step: "input" });
    const text = t(lang, "coupon.enter");
    const keyboard = Markup.inlineKeyboard([[Markup.button.callback(t(lang, "buttons.back"), "back_to_dashboard")]]);
    try {
      await ctx.editMessageText(text, { parse_mode: "Markdown", ...keyboard });
    } catch {
      await ctx.reply(text, { parse_mode: "Markdown", ...keyboard });
    }
  });

  bot.action("profile", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const user = await storage.getUserByTgId(tgId);
    const lang = getUserLang(user?.lang);
    
    if (!user) {
      const errorText = t(lang, "common.error");
      try {
        await ctx.editMessageText(errorText, { parse_mode: "Markdown" });
      } catch {
        await ctx.reply(errorText, { parse_mode: "Markdown" });
      }
      return;
    }
    
    const username = user.username?.replace(/[_*`\[\]]/g, "\\$&") || "—";
    const refCode = user.refCode?.replace(/[_*`\[\]]/g, "\\$&") || "—";
    
    const reports = await storage.getReports(user.id);
    const watches = await storage.getWatches(user.id);
    
    let referralStats = { count: 0, pendingCount: 0, referredUsers: [] as any[] };
    try {
      referralStats = await storage.getReferralStats(user.id);
    } catch (e) {}
    
    const totalChecks = reports.length;
    const activeMonitors = watches.length;
    const referralCount = referralStats.count;
    const streakDays = user.streakDays || 0;
    
    const checkTypeCounts: Record<string, number> = {};
    for (const report of reports) {
      const type = report.objectType || "unknown";
      checkTypeCounts[type] = (checkTypeCounts[type] || 0) + 1;
    }
    const topCheckTypes = Object.entries(checkTypeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    
    const moduleEmojis: Record<string, string> = {
      ip: "🌐", wallet: "💰", phone: "📱", email: "📧", domain: "🏢",
      url: "🔗", cve: "🔓", hash: "🔢", username: "👤", card: "💳",
      iot: "📡", cloud: "☁️"
    };
    
    const topTypesText = topCheckTypes.length > 0
      ? topCheckTypes.map(([type, count]) => `${moduleEmojis[type] || "📊"} ${type}: ${count}`).join("\n")
      : "—";
    
    const createdAt = user.createdAt 
      ? new Date(user.createdAt).toLocaleDateString(lang === "en" ? "en-US" : "uk-UA")
      : "—";
    
    const tierEmoji = user.tier === "ENTERPRISE" ? "👑" : user.tier === "PRO" ? "⭐" : "🆓";
    const tierName = user.tier || "FREE";
    
    const tierBenefits = user.tier === "ENTERPRISE" 
      ? "API, SIEM, ∞ запитів"
      : user.tier === "PRO" 
        ? "∞ запитів, PDF, моніторинг"
        : "15 запитів/день, 1 монітор";
    
    const riskHunterProgress = Math.min(totalChecks, 10);
    const scamSlayerProgress = Math.min(totalChecks, 50);
    const streakMasterProgress = Math.min(streakDays, 7);
    const referralKingProgress = Math.min(referralCount, 5);
    
    const riskHunterBar = generateProgressBar(riskHunterProgress, 10, 10);
    const scamSlayerBar = generateProgressBar(scamSlayerProgress, 50, 10);
    const streakMasterBar = generateProgressBar(streakMasterProgress, 7, 10);
    const referralKingBar = generateProgressBar(referralKingProgress, 5, 10);
    
    const riskHunterDone = riskHunterProgress >= 10 ? "✅" : "⬜";
    const scamSlayerDone = scamSlayerProgress >= 50 ? "✅" : "⬜";
    const streakMasterDone = streakMasterProgress >= 7 ? "✅" : "⬜";
    const referralKingDone = referralKingProgress >= 5 ? "✅" : "⬜";

    const lastActive = formatLastActivity(user.lastLogin, lang);

    const text = `👤 ${lang === "uk" ? "МІЙ АКАУНТ" : lang === "ru" ? "МОЙ АККАУНТ" : "MY ACCOUNT"}
━━━━━━━━━━━━━━━━━━━━

📋 ${lang === "uk" ? "Профіль" : lang === "ru" ? "Профиль" : "Profile"}:
├ ID: ${tgId}
├ Username: @${username}
├ ${tierEmoji} ${lang === "uk" ? "Тариф" : lang === "ru" ? "Тариф" : "Tier"}: ${tierName}
├ 📅 ${lang === "uk" ? "Створено" : lang === "ru" ? "Создан" : "Created"}: ${createdAt}
├ ⏰ ${lang === "uk" ? "Остання активність" : lang === "ru" ? "Последняя активность" : "Last activity"}: ${lastActive}
└ 🎁 ${lang === "uk" ? "Реф. код" : lang === "ru" ? "Реф. код" : "Ref. code"}: ${refCode}

━━━━━━━━━━━━━━━━━━━━

📊 ${lang === "uk" ? "Статистика" : lang === "ru" ? "Статистика" : "Statistics"}:
├ 🔍 ${lang === "uk" ? "Всього перевірок" : lang === "ru" ? "Всего проверок" : "Total checks"}: ${totalChecks}
├ 👁 ${lang === "uk" ? "Активних моніторів" : lang === "ru" ? "Активных мониторов" : "Active monitors"}: ${activeMonitors}
├ 📣 ${lang === "uk" ? "Рефералів" : lang === "ru" ? "Рефералов" : "Referrals"}: ${referralCount}
├ 🔥 ${lang === "uk" ? "Серія днів" : lang === "ru" ? "Серия дней" : "Streak"}: ${streakDays} ${lang === "uk" ? "дн" : lang === "ru" ? "дн" : "days"}
└ 💳 ${lang === "uk" ? "Залишок" : lang === "ru" ? "Остаток" : "Remaining"}: ${user.requestsLeft ?? 15} ${lang === "uk" ? "запитів" : lang === "ru" ? "запросов" : "requests"}

━━━━━━━━━━━━━━━━━━━━

🎯 ${lang === "uk" ? "Топ перевірки" : lang === "ru" ? "Топ проверки" : "Top checks"}:
${topTypesText}

━━━━━━━━━━━━━━━━━━━━

🏅 ${lang === "uk" ? "Досягнення" : lang === "ru" ? "Достижения" : "Achievements"}:
${riskHunterDone} 🏆 Risk Hunter (${riskHunterProgress}/10)
    ${riskHunterBar}
${scamSlayerDone} 🛡️ Scam Slayer (${scamSlayerProgress}/50)
    ${scamSlayerBar}
${streakMasterDone} 🔥 Streak Master (${streakMasterProgress}/7)
    ${streakMasterBar}
${referralKingDone} 📣 Referral King (${referralKingProgress}/5)
    ${referralKingBar}

━━━━━━━━━━━━━━━━━━━━

💎 ${lang === "uk" ? "Переваги тарифу" : lang === "ru" ? "Преимущества тарифа" : "Tier benefits"}:
└ ${tierBenefits}`;

    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback("📊 " + (lang === "uk" ? "Детальна статистика" : lang === "ru" ? "Подробная статистика" : "Detailed stats"), "profile_detailed_stats"),
        Markup.button.callback("🎁 " + (lang === "uk" ? "Реф. посилання" : lang === "ru" ? "Реф. ссылка" : "Ref. link"), "profile_ref_link")
      ],
      [
        Markup.button.callback("⚙️ " + (lang === "uk" ? "Налаштування" : lang === "ru" ? "Настройки" : "Settings"), "settings"),
        Markup.button.callback("🏠 " + (lang === "uk" ? "Меню" : lang === "ru" ? "Меню" : "Menu"), "dashboard")
      ]
    ]);
    
    try {
      await ctx.editMessageText(text, { ...keyboard });
    } catch (e: any) {
      if (e.message?.includes("message is not modified")) {
        return;
      }
      await ctx.reply(text, { ...keyboard });
    }
  });

  bot.action("profile_detailed_stats", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const user = await storage.getUserByTgId(tgId);
    const lang = getUserLang(user?.lang);
    
    if (!user) {
      await ctx.answerCbQuery(t(lang, "common.error"));
      return;
    }
    
    const reports = await storage.getReports(user.id);
    const watches = await storage.getWatches(user.id);
    let referralStats = { count: 0, pendingCount: 0, referredUsers: [] as any[] };
    try {
      referralStats = await storage.getReferralStats(user.id);
    } catch (e) {}
    
    const checkTypeCounts: Record<string, number> = {};
    for (const report of reports) {
      const type = report.objectType || "unknown";
      checkTypeCounts[type] = (checkTypeCounts[type] || 0) + 1;
    }
    
    const moduleEmojis: Record<string, string> = {
      ip: "🌐", wallet: "💰", phone: "📱", email: "📧", domain: "🏢",
      url: "🔗", cve: "🔓", hash: "🔢", username: "👤", card: "💳",
      iot: "📡", cloud: "☁️"
    };
    
    const allTypesText = Object.entries(checkTypeCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => `├ ${moduleEmojis[type] || "📊"} ${type}: ${count}`)
      .join("\n") || "├ —";
    
    const tierEmoji = user.tier === "ENTERPRISE" ? "👑" : user.tier === "PRO" ? "⭐" : "🆓";
    const requestsBar = generateProgressBar(user.requestsLeft || 0, 15);
    const streakBar = generateProgressBar(Math.min(user.streakDays || 0, 30), 30);
    
    const joinDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString(lang === "en" ? "en-US" : "uk-UA") : "—";
    const lastActive = formatLastActivity(user.lastLogin, lang);

    const escapedUsername = user.username ? user.username.replace(/_/g, "\\_") : "—";
    
    const text = `📊 ${lang === "uk" ? "ДЕТАЛЬНА СТАТИСТИКА" : lang === "ru" ? "ПОДРОБНАЯ СТАТИСТИКА" : "DETAILED STATISTICS"}
━━━━━━━━━━━━━━━━━━━━

👤 ${lang === "uk" ? "Профіль" : lang === "ru" ? "Профиль" : "Profile"}:
├ ID: ${user.tgId}
├ Username: @${escapedUsername}
├ ${tierEmoji} ${lang === "uk" ? "Тариф" : lang === "ru" ? "Тариф" : "Tier"}: ${user.tier || "FREE"}
├ 📅 ${lang === "uk" ? "Реєстрація" : lang === "ru" ? "Регистрация" : "Registered"}: ${joinDate}
└ 🕐 ${lang === "uk" ? "Остання активність" : lang === "ru" ? "Последняя активность" : "Last active"}: ${lastActive}

━━━━━━━━━━━━━━━━━━━━

📈 ${lang === "uk" ? "Активність" : lang === "ru" ? "Активность" : "Activity"}:
├ 🔍 ${lang === "uk" ? "Перевірок" : lang === "ru" ? "Проверок" : "Checks"}: ${reports.length}
├ 👁 ${lang === "uk" ? "Моніторів" : lang === "ru" ? "Мониторов" : "Monitors"}: ${watches.length}
├ 📣 ${lang === "uk" ? "Рефералів" : lang === "ru" ? "Рефералов" : "Referrals"}: ${referralStats.count}
└ 🔥 ${lang === "uk" ? "Серія" : lang === "ru" ? "Серия" : "Streak"}: ${user.streakDays || 0} ${lang === "uk" ? "дн" : lang === "ru" ? "дн" : "days"}

━━━━━━━━━━━━━━━━━━━━

🎯 ${lang === "uk" ? "Перевірки по типах" : lang === "ru" ? "Проверки по типам" : "Checks by type"}:
${allTypesText}

━━━━━━━━━━━━━━━━━━━━

📊 ${lang === "uk" ? "Прогрес" : lang === "ru" ? "Прогресс" : "Progress"}:
├ 💳 ${lang === "uk" ? "Запити" : lang === "ru" ? "Запросы" : "Requests"}: ${user.requestsLeft || 0}/15
│   ${requestsBar}
└ 🔥 ${lang === "uk" ? "Серія" : lang === "ru" ? "Серия" : "Streak"}: ${user.streakDays || 0}/30 ${lang === "uk" ? "дн" : lang === "ru" ? "дн" : "days"}
    ${streakBar}`;

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback("⬅️ " + (lang === "uk" ? "Назад" : lang === "ru" ? "Назад" : "Back"), "profile")],
      [Markup.button.callback("🏠 " + (lang === "uk" ? "Меню" : lang === "ru" ? "Меню" : "Menu"), "dashboard")]
    ]);
    
    try {
      await ctx.editMessageText(text, { ...keyboard });
    } catch (err: any) {
      if (!err.message?.includes("message is not modified")) {
        try {
          await ctx.reply(text, { ...keyboard });
        } catch {}
      }
    }
  });

  bot.action("profile_ref_link", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const user = await storage.getUserByTgId(tgId);
    const lang = getUserLang(user?.lang);
    
    if (!user) {
      await ctx.answerCbQuery(t(lang, "common.error"));
      return;
    }
    
    const refCode = user.refCode || "—";
    const botUsername = "DARKSHAREN1_BOT";
    const refLink = `t.me/${botUsername}?start=ref_${refCode}`;
    
    let referralStats = { count: 0, pendingCount: 0, referredUsers: [] as any[] };
    try {
      referralStats = await storage.getReferralStats(user.id);
    } catch (e) {}

    const text = `🎁 *${lang === "uk" ? "РЕФЕРАЛЬНА ПРОГРАМА" : lang === "ru" ? "РЕФЕРАЛЬНАЯ ПРОГРАММА" : "REFERRAL PROGRAM"}*
━━━━━━━━━━━━━━━━━━━━

📣 *${lang === "uk" ? "Твоє посилання" : lang === "ru" ? "Твоя ссылка" : "Your link"}:*
\`${refLink}\`

🎫 *${lang === "uk" ? "Твій код" : lang === "ru" ? "Твой код" : "Your code"}:*
\`${refCode}\`

━━━━━━━━━━━━━━━━━━━━

📊 *${lang === "uk" ? "Статистика" : lang === "ru" ? "Статистика" : "Statistics"}:*
├ 👥 ${lang === "uk" ? "Запрошено" : lang === "ru" ? "Приглашено" : "Invited"}: *${referralStats.count}*
└ 🎯 ${lang === "uk" ? "До знижки -20%" : lang === "ru" ? "До скидки -20%" : "To -20% discount"}: ${Math.max(0, 5 - referralStats.count)} ${lang === "uk" ? "рефералів" : lang === "ru" ? "рефералов" : "referrals"}

━━━━━━━━━━━━━━━━━━━━

🎁 *${lang === "uk" ? "Бонуси" : lang === "ru" ? "Бонусы" : "Bonuses"}:*
├ ${lang === "uk" ? "Ти отримуєш" : lang === "ru" ? "Ты получаешь" : "You get"}: +2 ${lang === "uk" ? "запити" : lang === "ru" ? "запроса" : "requests"}
└ ${lang === "uk" ? "Друг отримує" : lang === "ru" ? "Друг получает" : "Friend gets"}: +5 ${lang === "uk" ? "запитів" : lang === "ru" ? "запросов" : "requests"}

━━━━━━━━━━━━━━━━━━━━

💡 ${lang === "uk" ? "Поділись посиланням з друзями!" : lang === "ru" ? "Поделись ссылкой с друзьями!" : "Share the link with friends!"}`;

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.url("📤 " + (lang === "uk" ? "Поділитись" : lang === "ru" ? "Поделиться" : "Share"), `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent("🌑 DARKSHARE - OSINT Security Bot")}`)],
      [Markup.button.callback("⬅️ " + (lang === "uk" ? "Назад" : lang === "ru" ? "Назад" : "Back"), "profile")],
      [Markup.button.callback("🏠 " + (lang === "uk" ? "Меню" : lang === "ru" ? "Меню" : "Menu"), "dashboard")]
    ]);
    
    try {
      await ctx.editMessageText(text, { parse_mode: "Markdown", ...keyboard });
    } catch {
      await ctx.reply(text, { parse_mode: "Markdown", ...keyboard });
    }
  });

  bot.action("achievements", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const lang = await getLang(tgId);
    
    const text = `${t(lang, "achievements.title")}\n\n${t(lang, "achievements.riskHunter", { count: "0" })}\n${t(lang, "achievements.scamSlayer", { count: "0" })}\n${t(lang, "achievements.streakMaster", { count: "0" })}\n${t(lang, "achievements.referralKing", { count: "0" })}\n\n${t(lang, "achievements.unlock")}`;

    const keyboard = Markup.inlineKeyboard([[Markup.button.callback(t(lang, "buttons.back"), "back_to_dashboard")]]);
    try {
      await ctx.editMessageText(text, { parse_mode: "Markdown", ...keyboard });
    } catch {
      await ctx.reply(text, { parse_mode: "Markdown", ...keyboard });
    }
  });

  bot.action("history", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const lang = await getLang(tgId);

    const text = `${t(lang, "history.title")}\n\n${t(lang, "history.description")}\n\n${t(lang, "history.empty")}\n\n${t(lang, "history.addMonitor")}`;

    const keyboard = Markup.inlineKeyboard([[Markup.button.callback(t(lang, "buttons.back"), "back_to_dashboard")]]);
    try {
      await ctx.editMessageText(text, { parse_mode: "Markdown", ...keyboard });
    } catch {
      await ctx.reply(text, { parse_mode: "Markdown", ...keyboard });
    }
  });

  bot.command("admin", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    
    if (!isAdmin(tgId)) {
      return ctx.reply("⛔ Доступ заборонено. Ви не є адміністратором.");
    }
    
    const stats = await storage.getStats();

    const text = `🔐 *АДМІН ПАНЕЛЬ*\n\n` +
      `📊 *Статистика:*\n` +
      `👥 Користувачів: ${stats.totalUsers}\n` +
      `📄 Звітів: ${stats.totalReports || 0}\n` +
      `🔍 Перевірок сьогодні: ${stats.checksToday || 0}\n` +
      `👁 Активних моніторів: ${stats.activeWatches}\n` +
      `💳 Pending платежів: ${stats.pendingPayments || 0}\n\n` +
      `Виберіть дію:`;

    await ctx.reply(text, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [
          Markup.button.callback("📊 Статистика", "admin_stats"),
          Markup.button.callback("👥 Користувачі", "admin_users")
        ],
        [
          Markup.button.callback("🔍 Пошук", "admin_search_user"),
          Markup.button.callback("🚫 Блокування", "admin_block_user")
        ],
        [
          Markup.button.callback("📊 Тарифи", "admin_change_tier"),
          Markup.button.callback("⚙️ Налаштування", "admin_settings")
        ],
        [
          Markup.button.callback("💳 Платежі", "admin_payments"),
          Markup.button.callback("📢 Розсилка", "admin_broadcast")
        ],
        [Markup.button.callback("⬅️ Вийти", "back_to_dashboard")]
      ])
    });
  });

  bot.action("open_admin_panel", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    
    if (!isAdmin(tgId)) {
      return ctx.answerCbQuery("⛔ Доступ заборонено");
    }
    
    const stats = await storage.getStats();

    const text = `🔐 *АДМІН ПАНЕЛЬ*\n\n` +
      `📊 *Статистика:*\n` +
      `👥 Користувачів: ${stats.totalUsers}\n` +
      `📄 Звітів: ${stats.totalReports || 0}\n` +
      `🔍 Перевірок сьогодні: ${stats.checksToday || 0}\n` +
      `👁 Активних моніторів: ${stats.activeWatches}\n` +
      `💳 Pending платежів: ${stats.pendingPayments || 0}\n\n` +
      `Виберіть дію:`;

    await ctx.editMessageText(text, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [
          Markup.button.callback("📊 Статистика", "admin_stats"),
          Markup.button.callback("👥 Користувачі", "admin_users")
        ],
        [
          Markup.button.callback("🔍 Пошук", "admin_search_user"),
          Markup.button.callback("🚫 Блокування", "admin_block_user")
        ],
        [
          Markup.button.callback("📊 Тарифи", "admin_change_tier"),
          Markup.button.callback("⚙️ Налаштування", "admin_settings")
        ],
        [
          Markup.button.callback("💳 Платежі", "admin_payments"),
          Markup.button.callback("📢 Розсилка", "admin_broadcast")
        ],
        [Markup.button.callback("⬅️ Назад", "back_to_dashboard")]
      ])
    });
  });

  bot.action("admin_stats", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    
    if (!isAdmin(tgId)) {
      return ctx.answerCbQuery("⛔ Доступ заборонено");
    }
    
    const stats = await storage.getStats();
    const allUsers = await storage.getAllUsers();
    
    const freeUsers = allUsers.filter(u => u.tier === "FREE").length;
    const proUsers = allUsers.filter(u => u.tier === "PRO").length;
    const enterpriseUsers = allUsers.filter(u => u.tier === "ENTERPRISE").length;
    const blockedUsers = allUsers.filter(u => u.blocked).length;
    
    const text = `📊 ДЕТАЛЬНА СТАТИСТИКА\n\n` +
      `👥 Користувачі:\n` +
      `├ Всього: ${stats.totalUsers}\n` +
      `├ FREE: ${freeUsers}\n` +
      `├ PRO: ${proUsers}\n` +
      `├ ENTERPRISE: ${enterpriseUsers}\n` +
      `└ Заблоковано: ${blockedUsers}\n\n` +
      `📄 Звіти:\n` +
      `├ Всього: ${stats.totalReports || 0}\n` +
      `└ Сьогодні: ${stats.checksToday || 0}\n\n` +
      `👁 Моніторинг:\n` +
      `└ Активних: ${stats.activeWatches}\n\n` +
      `💳 Платежі:\n` +
      `└ Pending: ${stats.pendingPayments || 0}`;

    try {
      await ctx.editMessageText(text, {
        ...Markup.inlineKeyboard([
          [Markup.button.callback("🔄 Оновити", "admin_stats")],
          [Markup.button.callback("⬅️ Назад", "admin_back")]
        ])
      });
    } catch (err: any) {
      if (!err.message?.includes("message is not modified")) {
        console.error("Error updating admin stats:", err);
      }
    }
  });

  bot.action("admin_users", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    
    if (!isAdmin(tgId)) {
      return ctx.answerCbQuery("⛔ Доступ заборонено");
    }
    
    const latestUsers = await storage.getLatestUsers(10);
    
    let text = `👥 ОСТАННІ 10 КОРИСТУВАЧІВ\n\n`;
    
    if (latestUsers.length === 0) {
      text += "Користувачів ще немає.";
    } else {
      latestUsers.forEach((u, i) => {
        const escapedUsername = u.username ? u.username.replace(/_/g, "\\_") : "";
        const username = u.username ? `@${escapedUsername}` : "—";
        const blockedIcon = u.blocked ? "🔴" : "🟢";
        const date = u.createdAt ? new Date(u.createdAt).toLocaleDateString("uk-UA") : "—";
        text += `${i + 1}. ${blockedIcon} ${username}\n`;
        text += `   ID: ${u.tgId} | ${u.tier} | ${date}\n`;
      });
    }
    
    text += `\nДля блокування відправте ID користувача`;

    try {
      await ctx.editMessageText(text, {
        ...Markup.inlineKeyboard([
          [Markup.button.callback("🔄 Оновити", "admin_users")],
          [Markup.button.callback("⬅️ Назад", "admin_back")]
        ])
      });
    } catch (err: any) {
      if (!err.message?.includes("message is not modified")) {
        console.error("Error updating admin users:", err);
      }
    }
  });

  bot.action("admin_payments", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    
    if (!isAdmin(tgId)) {
      return ctx.answerCbQuery("⛔ Доступ заборонено");
    }
    
    const pendingPayments = await storage.getPendingPayments();
    
    let text = `💳 PENDING ПЛАТЕЖІ\n\n`;
    
    if (pendingPayments.length === 0) {
      text += "Немає pending платежів.";
    } else {
      for (const p of pendingPayments) {
        const user = await storage.getUserById(p.userId!);
        const escapedUsername = user?.username ? user.username.replace(/_/g, "\\_") : "";
        const username = user?.username ? `@${escapedUsername}` : user?.tgId || "—";
        const date = p.createdAt ? new Date(p.createdAt).toLocaleDateString("uk-UA") : "—";
        text += `#${p.id} | ${username}\n`;
        text += `   ${p.tier} | $${p.amountUsdt} | ${date}\n\n`;
      }
    }

    const buttons: any[][] = [];
    
    pendingPayments.slice(0, 5).forEach(p => {
      buttons.push([
        Markup.button.callback(`✅ #${p.id}`, `approve_pay_${p.id}`),
        Markup.button.callback(`❌ #${p.id}`, `reject_pay_${p.id}`)
      ]);
    });
    
    buttons.push([Markup.button.callback("🔄 Оновити", "admin_payments")]);
    buttons.push([Markup.button.callback("⬅️ Назад", "admin_back")]);

    try {
      await ctx.editMessageText(text, {
        ...Markup.inlineKeyboard(buttons)
      });
    } catch (err: any) {
      if (!err.message?.includes("message is not modified")) {
        console.error("Error updating admin payments:", err);
      }
    }
  });

  bot.action("admin_broadcast", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    
    if (!isAdmin(tgId)) {
      return ctx.answerCbQuery("⛔ Доступ заборонено");
    }
    
    userStates.set(tgId, { module: "admin_broadcast", step: "awaiting_message" });
    
    const stats = await storage.getStats();
    
    const text = `📢 *РОЗСИЛКА*\n\n` +
      `Буде відправлено: ${stats.totalUsers} користувачам\n\n` +
      `Відправте текст повідомлення для розсилки.\n` +
      `Підтримується Markdown форматування.`;

    await ctx.editMessageText(text, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [Markup.button.callback("❌ Скасувати", "admin_back")]
      ])
    });
  });

  bot.action("admin_back", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    
    if (!isAdmin(tgId)) {
      return ctx.answerCbQuery("⛔ Доступ заборонено");
    }
    
    userStates.delete(tgId);
    
    const stats = await storage.getStats();

    const text = `🔐 *АДМІН ПАНЕЛЬ*\n\n` +
      `📊 *Статистика:*\n` +
      `👥 Користувачів: ${stats.totalUsers}\n` +
      `📄 Звітів: ${stats.totalReports || 0}\n` +
      `🔍 Перевірок сьогодні: ${stats.checksToday || 0}\n` +
      `👁 Активних моніторів: ${stats.activeWatches}\n` +
      `💳 Pending платежів: ${stats.pendingPayments || 0}\n\n` +
      `Виберіть дію:`;

    await ctx.editMessageText(text, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [
          Markup.button.callback("📊 Статистика", "admin_stats"),
          Markup.button.callback("👥 Користувачі", "admin_users")
        ],
        [
          Markup.button.callback("🔍 Пошук", "admin_search_user"),
          Markup.button.callback("🚫 Блокування", "admin_block_user")
        ],
        [
          Markup.button.callback("📊 Тарифи", "admin_change_tier"),
          Markup.button.callback("⚙️ Налаштування", "admin_settings")
        ],
        [
          Markup.button.callback("💳 Платежі", "admin_payments"),
          Markup.button.callback("📢 Розсилка", "admin_broadcast")
        ],
        [Markup.button.callback("⬅️ Вийти", "back_to_dashboard")]
      ])
    });
  });

  bot.action("admin_broadcast_confirm", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    
    if (!isAdmin(tgId)) {
      return ctx.answerCbQuery("⛔ Доступ заборонено");
    }
    
    const state = userStates.get(tgId);
    if (!state?.data?.message) {
      return ctx.answerCbQuery("Повідомлення не знайдено");
    }
    
    const broadcastMessage = state.data.message;
    userStates.delete(tgId);
    
    const allUsers = await storage.getAllUsers();
    let successCount = 0;
    let failCount = 0;
    
    await ctx.editMessageText("📢 Розсилка почалася...");
    
    for (const u of allUsers) {
      if (u.blocked) continue;
      
      try {
        await ctx.telegram.sendMessage(u.tgId, broadcastMessage, { parse_mode: "Markdown" });
        successCount++;
      } catch (e) {
        failCount++;
      }
      
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    await ctx.reply(`✅ *Розсилка завершена!*\n\n📤 Відправлено: ${successCount}\n❌ Помилки: ${failCount}`, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([[Markup.button.callback("⬅️ Назад", "admin_back")]])
    });
  });

  bot.action("admin_broadcast_cancel", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    
    if (!isAdmin(tgId)) {
      return ctx.answerCbQuery("⛔ Доступ заборонено");
    }
    
    userStates.delete(tgId);
    await ctx.answerCbQuery("Розсилку скасовано");
    
    const stats = await storage.getStats();

    const text = `🔐 *АДМІН ПАНЕЛЬ*\n\n` +
      `📊 *Статистика:*\n` +
      `👥 Користувачів: ${stats.totalUsers}\n` +
      `📄 Звітів: ${stats.totalReports || 0}\n` +
      `🔍 Перевірок сьогодні: ${stats.checksToday || 0}\n` +
      `👁 Активних моніторів: ${stats.activeWatches}\n` +
      `💳 Pending платежів: ${stats.pendingPayments || 0}\n\n` +
      `Виберіть дію:`;

    await ctx.editMessageText(text, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [
          Markup.button.callback("📊 Статистика", "admin_stats"),
          Markup.button.callback("👥 Користувачі", "admin_users")
        ],
        [
          Markup.button.callback("🔍 Пошук", "admin_search_user"),
          Markup.button.callback("🚫 Блокування", "admin_block_user")
        ],
        [
          Markup.button.callback("📊 Тарифи", "admin_change_tier"),
          Markup.button.callback("⚙️ Налаштування", "admin_settings")
        ],
        [
          Markup.button.callback("💳 Платежі", "admin_payments"),
          Markup.button.callback("📢 Розсилка", "admin_broadcast")
        ],
        [Markup.button.callback("⬅️ Вийти", "back_to_dashboard")]
      ])
    });
  });

  bot.action(/^admin_block_(\d+)$/, async (ctx) => {
    const adminTgId = ctx.from!.id.toString();
    
    if (!isAdmin(adminTgId)) {
      return ctx.answerCbQuery("⛔ Доступ заборонено");
    }
    
    const userId = parseInt(ctx.match[1]);
    const user = await storage.getUserById(userId);
    
    if (!user) {
      return ctx.answerCbQuery("Користувача не знайдено");
    }
    
    const newBlockedStatus = !user.blocked;
    await storage.updateUser(userId, { blocked: newBlockedStatus });
    
    const statusText = newBlockedStatus ? "заблоковано" : "розблоковано";
    await ctx.answerCbQuery(`Користувача ${statusText}`);
    
    try {
      await ctx.telegram.sendMessage(user.tgId, 
        newBlockedStatus 
          ? "⛔ Ваш акаунт було заблоковано адміністратором."
          : "✅ Ваш акаунт було розблоковано."
      );
    } catch (e) {
      console.log("Failed to notify user about block status:", e);
    }
  });

  bot.action("admin_block_user", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    
    if (!isAdmin(tgId)) {
      return ctx.answerCbQuery("⛔ Доступ заборонено");
    }
    
    userStates.set(tgId, { module: "admin_block_user", step: "awaiting_tgid" });
    
    const text = `🚫 *БЛОКУВАННЯ КОРИСТУВАЧА*\n\n` +
      `Відправте Telegram ID користувача для блокування/розблокування.\n\n` +
      `_Формат: числовий ID (наприклад: 123456789)_`;

    await ctx.editMessageText(text, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([[Markup.button.callback("❌ Скасувати", "admin_back")]])
    });
  });

  bot.action("admin_change_tier", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    
    if (!isAdmin(tgId)) {
      return ctx.answerCbQuery("⛔ Доступ заборонено");
    }
    
    userStates.set(tgId, { module: "admin_change_tier", step: "awaiting_tgid" });
    
    const text = `📊 *ЗМІНА ТАРИФУ*\n\n` +
      `Відправте Telegram ID користувача для зміни тарифу.\n\n` +
      `_Формат: числовий ID (наприклад: 123456789)_`;

    await ctx.editMessageText(text, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([[Markup.button.callback("❌ Скасувати", "admin_back")]])
    });
  });

  bot.action(/^admin_set_tier_(\d+)_(\w+)$/, async (ctx) => {
    const adminTgId = ctx.from!.id.toString();
    
    if (!isAdmin(adminTgId)) {
      return ctx.answerCbQuery("⛔ Доступ заборонено");
    }
    
    const userId = parseInt(ctx.match[1]);
    const newTier = ctx.match[2];
    
    const user = await storage.getUserById(userId);
    if (!user) {
      return ctx.answerCbQuery("Користувача не знайдено");
    }
    
    await storage.updateUser(userId, { tier: newTier });
    await ctx.answerCbQuery(`Тариф змінено на ${newTier}`);
    
    try {
      await ctx.telegram.sendMessage(user.tgId, 
        `✅ Ваш тариф було змінено на *${newTier}*.`,
        { parse_mode: "Markdown" }
      );
    } catch (e) {
      console.log("Failed to notify user about tier change:", e);
    }
    
    const escapedUsername = user.username ? user.username.replace(/_/g, "\\_") : user.tgId;
    const text = `✅ *Тариф змінено!*\n\n` +
      `Користувач: @${escapedUsername}\n` +
      `Новий тариф: ${newTier}`;

    await ctx.editMessageText(text, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([[Markup.button.callback("⬅️ Назад", "admin_back")]])
    });
  });

  bot.action("admin_search_user", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    
    if (!isAdmin(tgId)) {
      return ctx.answerCbQuery("⛔ Доступ заборонено");
    }
    
    userStates.set(tgId, { module: "admin_search_user", step: "awaiting_query" });
    
    const text = `🔍 *ПОШУК КОРИСТУВАЧА*\n\n` +
      `Відправте:\n` +
      `• Telegram ID (числовий)\n` +
      `• Username (без @)\n\n` +
      `_Приклад: 123456789 або darkuser_`;

    await ctx.editMessageText(text, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([[Markup.button.callback("❌ Скасувати", "admin_back")]])
    });
  });

  bot.action("admin_settings", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    
    if (!isAdmin(tgId)) {
      return ctx.answerCbQuery("⛔ Доступ заборонено");
    }
    
    const stats = await storage.getStats();
    const allUsers = await storage.getAllUsers();
    const proUsers = allUsers.filter(u => u.tier === "PRO").length;
    const enterpriseUsers = allUsers.filter(u => u.tier === "ENTERPRISE").length;
    const blockedUsers = allUsers.filter(u => u.blocked).length;
    
    const text = `⚙️ *НАЛАШТУВАННЯ СИСТЕМИ*\n\n` +
      `📊 *Ліміти:*\n` +
      `├ FREE: 15 запитів/день\n` +
      `├ PRO: Необмежено\n` +
      `└ ENTERPRISE: Необмежено + API\n\n` +
      `💰 *Ціни:*\n` +
      `├ PRO: $10 USDT\n` +
      `└ ENTERPRISE: $50 USDT\n\n` +
      `📈 *Статистика тарифів:*\n` +
      `├ FREE: ${stats.totalUsers - proUsers - enterpriseUsers}\n` +
      `├ PRO: ${proUsers}\n` +
      `├ ENTERPRISE: ${enterpriseUsers}\n` +
      `└ Заблоковано: ${blockedUsers}\n\n` +
      `🔐 *Адміни:* ${ADMIN_IDS.length}`;

    await ctx.editMessageText(text, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [Markup.button.callback("🔄 Оновити", "admin_settings")],
        [Markup.button.callback("⬅️ Назад", "admin_back")]
      ])
    });
  });

  bot.action(/^admin_user_info_(\d+)$/, async (ctx) => {
    const adminTgId = ctx.from!.id.toString();
    
    if (!isAdmin(adminTgId)) {
      return ctx.answerCbQuery("⛔ Доступ заборонено");
    }
    
    const userId = parseInt(ctx.match[1]);
    const user = await storage.getUserById(userId);
    
    if (!user) {
      return ctx.answerCbQuery("Користувача не знайдено");
    }
    
    const reports = await storage.getReports(user.id);
    const watches = await storage.getWatches(user.id);
    
    const statusEmoji = user.blocked ? "🔴" : "🟢";
    const tierEmoji = user.tier === "ENTERPRISE" ? "👑" : user.tier === "PRO" ? "⭐" : "🆓";
    
    const escapedUsername = user.username ? user.username.replace(/_/g, "\\_") : null;
    const text = `👤 *ІНФОРМАЦІЯ ПРО КОРИСТУВАЧА*\n\n` +
      `${statusEmoji} *Статус:* ${user.blocked ? "Заблокований" : "Активний"}\n` +
      `${tierEmoji} *Тариф:* ${user.tier}\n\n` +
      `📋 *Дані:*\n` +
      `├ ID: \`${user.id}\`\n` +
      `├ TG ID: \`${user.tgId}\`\n` +
      `├ Username: ${escapedUsername ? `@${escapedUsername}` : "—"}\n` +
      `├ Мова: ${user.lang?.toUpperCase() || "UK"}\n` +
      `├ Залишок запитів: ${user.requestsLeft}\n` +
      `├ Streak: ${user.streakDays} днів\n` +
      `├ Реф. код: \`${user.refCode || "—"}\`\n` +
      `├ Знижка: ${user.discountPct || 0}%\n` +
      `└ Реєстрація: ${user.createdAt ? new Date(user.createdAt).toLocaleDateString("uk-UA") : "—"}\n\n` +
      `📊 *Активність:*\n` +
      `├ Звітів: ${reports.length}\n` +
      `└ Моніторів: ${watches.length}`;

    const buttons: any[][] = [];
    
    buttons.push([
      Markup.button.callback(user.blocked ? "✅ Розблокувати" : "🚫 Заблокувати", `admin_toggle_block_${user.id}`),
    ]);
    
    buttons.push([
      Markup.button.callback("🆓 FREE", `admin_set_tier_${user.id}_FREE`),
      Markup.button.callback("⭐ PRO", `admin_set_tier_${user.id}_PRO`),
      Markup.button.callback("👑 ENT", `admin_set_tier_${user.id}_ENTERPRISE`),
    ]);
    
    buttons.push([Markup.button.callback("⬅️ Назад", "admin_back")]);

    await ctx.editMessageText(text, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard(buttons)
    });
  });

  bot.action(/^admin_toggle_block_(\d+)$/, async (ctx) => {
    const adminTgId = ctx.from!.id.toString();
    
    if (!isAdmin(adminTgId)) {
      return ctx.answerCbQuery("⛔ Доступ заборонено");
    }
    
    const userId = parseInt(ctx.match[1]);
    const user = await storage.getUserById(userId);
    
    if (!user) {
      return ctx.answerCbQuery("Користувача не знайдено");
    }
    
    const newBlockedStatus = !user.blocked;
    await storage.blockUser(userId, newBlockedStatus);
    
    const statusText = newBlockedStatus ? "заблоковано" : "розблоковано";
    await ctx.answerCbQuery(`Користувача ${statusText}`);
    
    try {
      await ctx.telegram.sendMessage(user.tgId, 
        newBlockedStatus 
          ? "⛔ Ваш акаунт було заблоковано адміністратором."
          : "✅ Ваш акаунт було розблоковано."
      );
    } catch (e) {
      console.log("Failed to notify user about block status:", e);
    }
    
    const updatedUser = await storage.getUserById(userId);
    if (updatedUser) {
      const reports = await storage.getReports(updatedUser.id);
      const watches = await storage.getWatches(updatedUser.id);
      
      const statusEmoji = updatedUser.blocked ? "🔴" : "🟢";
      const tierEmoji = updatedUser.tier === "ENTERPRISE" ? "👑" : updatedUser.tier === "PRO" ? "⭐" : "🆓";
      
      const text = `👤 *ІНФОРМАЦІЯ ПРО КОРИСТУВАЧА*\n\n` +
        `${statusEmoji} *Статус:* ${updatedUser.blocked ? "Заблокований" : "Активний"}\n` +
        `${tierEmoji} *Тариф:* ${updatedUser.tier}\n\n` +
        `📋 *Дані:*\n` +
        `├ ID: \`${updatedUser.id}\`\n` +
        `├ TG ID: \`${updatedUser.tgId}\`\n` +
        `├ Username: ${updatedUser.username ? `@${updatedUser.username}` : "—"}\n` +
        `├ Мова: ${updatedUser.lang?.toUpperCase() || "UK"}\n` +
        `├ Залишок запитів: ${updatedUser.requestsLeft}\n` +
        `├ Streak: ${updatedUser.streakDays} днів\n` +
        `├ Реф. код: \`${updatedUser.refCode || "—"}\`\n` +
        `├ Знижка: ${updatedUser.discountPct || 0}%\n` +
        `└ Реєстрація: ${updatedUser.createdAt ? new Date(updatedUser.createdAt).toLocaleDateString("uk-UA") : "—"}\n\n` +
        `📊 *Активність:*\n` +
        `├ Звітів: ${reports.length}\n` +
        `└ Моніторів: ${watches.length}`;

      const buttons: any[][] = [];
      buttons.push([
        Markup.button.callback(updatedUser.blocked ? "✅ Розблокувати" : "🚫 Заблокувати", `admin_toggle_block_${updatedUser.id}`),
      ]);
      buttons.push([
        Markup.button.callback("🆓 FREE", `admin_set_tier_${updatedUser.id}_FREE`),
        Markup.button.callback("⭐ PRO", `admin_set_tier_${updatedUser.id}_PRO`),
        Markup.button.callback("👑 ENT", `admin_set_tier_${updatedUser.id}_ENTERPRISE`),
      ]);
      buttons.push([Markup.button.callback("⬅️ Назад", "admin_back")]);

      await ctx.editMessageText(text, {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard(buttons)
      });
    }
  });

  bot.command("block", async (ctx) => {
    const adminTgId = ctx.from!.id.toString();
    
    if (!isAdmin(adminTgId)) {
      return ctx.reply("⛔ Доступ заборонено.");
    }
    
    const args = ctx.message.text.split(" ");
    if (args.length < 2) {
      return ctx.reply("Використання: /block <tg_id>\nНаприклад: /block 123456789");
    }
    
    const targetTgId = args[1];
    const user = await storage.getUserByTgId(targetTgId);
    
    if (!user) {
      return ctx.reply(`Користувача з ID ${targetTgId} не знайдено.`);
    }
    
    await storage.updateUser(user.id, { blocked: true });
    
    await ctx.reply(`✅ Користувача @${user.username || targetTgId} заблоковано.`);
    
    try {
      await ctx.telegram.sendMessage(targetTgId, "⛔ Ваш акаунт було заблоковано адміністратором.");
    } catch (e) {
      console.log("Failed to notify user about block:", e);
    }
  });

  bot.command("unblock", async (ctx) => {
    const adminTgId = ctx.from!.id.toString();
    
    if (!isAdmin(adminTgId)) {
      return ctx.reply("⛔ Доступ заборонено.");
    }
    
    const args = ctx.message.text.split(" ");
    if (args.length < 2) {
      return ctx.reply("Використання: /unblock <tg_id>\nНаприклад: /unblock 123456789");
    }
    
    const targetTgId = args[1];
    const user = await storage.getUserByTgId(targetTgId);
    
    if (!user) {
      return ctx.reply(`Користувача з ID ${targetTgId} не знайдено.`);
    }
    
    await storage.updateUser(user.id, { blocked: false });
    
    await ctx.reply(`✅ Користувача @${user.username || targetTgId} розблоковано.`);
    
    try {
      await ctx.telegram.sendMessage(targetTgId, "✅ Ваш акаунт було розблоковано.");
    } catch (e) {
      console.log("Failed to notify user about unblock:", e);
    }
  });

  // QUICK CHECK COMMAND - перевірка без меню
  bot.command("check", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const user = await storage.getUserByTgId(tgId);
    const lang = getUserLang(user?.lang);
    
    const args = ctx.message.text.split(" ");
    if (args.length < 3) {
      return ctx.reply(
        `🚀 *Швидка перевірка*\n\n` +
        `Використання: \`/check <тип> <значення>\`\n\n` +
        `*Доступні типи:*\n` +
        `• \`ip\` - IP адреса\n` +
        `• \`wallet\` - Крипто гаманець\n` +
        `• \`email\` - Email адреса\n` +
        `• \`phone\` - Номер телефону\n` +
        `• \`domain\` - Домен\n` +
        `• \`url\` - URL посилання\n` +
        `• \`username\` - Username\n` +
        `• \`hash\` - File hash\n` +
        `• \`cve\` - CVE ID\n\n` +
        `*Приклади:*\n` +
        `\`/check ip 8.8.8.8\`\n` +
        `\`/check email test@gmail.com\`\n` +
        `\`/check wallet 0x123...\``,
        { parse_mode: "Markdown" }
      );
    }
    
    const checkType = args[1].toLowerCase();
    const target = args.slice(2).join(" ");
    
    const validTypes = ["ip", "wallet", "email", "phone", "domain", "url", "username", "hash", "cve"];
    if (!validTypes.includes(checkType)) {
      return ctx.reply(`❌ Невідомий тип перевірки: ${checkType}\n\nДоступні: ${validTypes.join(", ")}`);
    }
    
    if (!user || user.requestsLeft! <= 0) {
      return ctx.reply(t(lang, "validation.limitReached", { limit: "15" }), 
        Markup.inlineKeyboard([
          [Markup.button.callback(t(lang, "buttons.upgrade"), "upgrade")]
        ])
      );
    }
    
    const processingMsg = await ctx.reply(`⏳ Аналізую ${checkType}: ${target}...`);
    
    try {
      const checkResult = await performCheck(checkType, target);
      await storage.updateUser(user.id, { requestsLeft: Math.max(0, (user.requestsLeft || 0) - 1) });
      
      const riskEmoji = checkResult.riskLevel === "critical" ? "🔴" : 
                        checkResult.riskLevel === "high" ? "🟠" : 
                        checkResult.riskLevel === "medium" ? "🟡" : "🟢";
      
      let result = `${riskEmoji} *${checkType.toUpperCase()} АНАЛІЗ*\n\n`;
      result += `📌 *Ціль:* \`${target}\`\n`;
      result += `📊 *Ризик:* ${checkResult.riskScore}/100 (${checkResult.riskLevel.toUpperCase()})\n\n`;
      result += `*Знахідки:*\n`;
      checkResult.findings.slice(0, 5).forEach(f => {
        result += `• ${f}\n`;
      });
      
      if (checkResult.aiInsights) {
        result += `\n🤖 *AI Вердикт:* ${checkResult.aiInsights.verdict}\n`;
      }
      
      await ctx.telegram.deleteMessage(ctx.chat!.id, processingMsg.message_id);
      
      await ctx.reply(result, {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([
          [
            Markup.button.callback("📄 PDF", `gen_pdf_${checkType}_${target}`),
            Markup.button.callback("👁 Моніторинг", `add_monitor_${checkType}_${target}`)
          ]
        ])
      });
      
      await storage.createReport({
        userId: user.id,
        objectType: checkType,
        dataJson: {
          target: checkResult.target,
          riskScore: checkResult.riskScore,
          riskLevel: checkResult.riskLevel,
          findings: checkResult.findings,
          details: checkResult.details,
          sources: checkResult.sources,
          summary: checkResult.summary,
        },
      });
    } catch (err) {
      console.error("Quick check error:", err);
      await ctx.reply("❌ Помилка перевірки. Спробуйте ще раз.");
    }
  });

  // STATS COMMAND - персональна статистика
  bot.command("stats", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const user = await storage.getUserByTgId(tgId);
    const lang = getUserLang(user?.lang);
    
    if (!user) return;
    
    const reports = await storage.getReports(user.id);
    const watches = await storage.getWatches(user.id);
    const referralStats = await storage.getReferralStats(user.id);
    
    const typeCounts: Record<string, number> = {};
    reports.forEach(r => {
      typeCounts[r.objectType] = (typeCounts[r.objectType] || 0) + 1;
    });
    
    const topTypes = Object.entries(typeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    
    const tierEmoji = user.tier === "ENTERPRISE" ? "👑" : user.tier === "PRO" ? "⭐" : "🆓";
    
    let text = `📊 *ВАША СТАТИСТИКА*\n\n`;
    text += `${tierEmoji} *Тариф:* ${user.tier}\n`;
    text += `🎯 *Запитів залишилось:* ${user.requestsLeft}/15\n`;
    text += `🔥 *Серія днів:* ${user.streakDays}\n`;
    text += `📈 *Всього перевірок:* ${reports.length}\n`;
    text += `👁 *Активних моніторів:* ${watches.length}\n`;
    text += `👥 *Рефералів:* ${referralStats.count}\n\n`;
    
    if (topTypes.length > 0) {
      text += `*Топ перевірки:*\n`;
      topTypes.forEach(([type, count], i) => {
        text += `${i + 1}. ${type.toUpperCase()}: ${count}\n`;
      });
    }
    
    await ctx.reply(text, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [Markup.button.callback("🏠 Меню", "dashboard")]
      ])
    });
  });

  // SHARE REFERRAL COMMAND
  bot.command("ref", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const user = await storage.getUserByTgId(tgId);
    
    if (!user) return;
    
    const referralStats = await storage.getReferralStats(user.id);
    const botUsername = ctx.botInfo?.username || "darkshare_bot";
    const refLink = `https://t.me/${botUsername}?start=ref_${user.refCode}`;
    
    const text = `🎁 *РЕФЕРАЛЬНА ПРОГРАМА*\n\n` +
      `Запрошуй друзів і отримуй бонуси!\n\n` +
      `📎 *Твоє посилання:*\n\`${refLink}\`\n\n` +
      `🏷️ *Твій код:* \`${user.refCode}\`\n` +
      `👥 *Запрошено:* ${referralStats.count} користувачів\n\n` +
      `*Бонуси:*\n` +
      `• +3 безкоштовних перевірки за кожного друга\n` +
      `• Топ-реферери отримують PRO тариф`;
    
    await ctx.reply(text, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [Markup.button.url("📤 Поділитись", `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent("🛡️ Перевір безпеку своїх даних з DARKSHARE!")}`)],
        [Markup.button.callback("🏠 Меню", "dashboard")]
      ])
    });
  });

  // HELP COMMAND - довідка
  bot.command("help", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const user = await storage.getUserByTgId(tgId);
    const lang = getUserLang(user?.lang);
    
    const text = `📚 *ДОВІДКА DARKSHARE*\n\n` +
      `*Команди:*\n` +
      `• /start - Головне меню\n` +
      `• /menu - Панель управління\n` +
      `• /check <тип> <значення> - Швидка перевірка\n` +
      `• /stats - Ваша статистика\n` +
      `• /ref - Реферальна програма\n` +
      `• /help - Ця довідка\n\n` +
      `*Типи перевірок:*\n` +
      `🌐 IP - аналіз IP адрес\n` +
      `💰 Wallet - крипто гаманці\n` +
      `📧 Email - email адреси\n` +
      `📱 Phone - номери телефонів\n` +
      `🔗 Domain - домени\n` +
      `🔍 URL - посилання\n` +
      `🐛 CVE - вразливості\n` +
      `#️⃣ Hash - файлові хеші\n` +
      `👤 Username - юзернейми\n\n` +
      `*Приклад швидкої перевірки:*\n` +
      `\`/check ip 8.8.8.8\`\n\n` +
      `🌐 Веб-панель: darkshare.store`;
    
    await ctx.reply(text, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [Markup.button.callback("🏠 Меню", "dashboard")]
      ])
    });
  });

  bot.catch((err, ctx) => {
    console.error(`Bot error for ${ctx.updateType}:`, err);
  });

  console.log("Starting bot polling...");
  
  const startBot = () => {
    bot.launch({ dropPendingUpdates: true })
      .catch((err: Error) => {
        console.error("Bot error:", err.message);
        // If conflict error (409), retry after delay
        if (err.message.includes("409") || err.message.includes("Conflict")) {
          console.log("Bot conflict detected, retrying in 5 seconds...");
          setTimeout(startBot, 5000);
        }
      });
  };
  
  startBot();

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));

  console.log("Bot is now running and listening for messages!");
  return bot;
}
