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
  if (code === "es") return "es";
  if (code === "de") return "de";
  if (code === "en") return "en";
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

  bot.telegram.setMyCommands([
    { command: "start", description: "Start / Restart bot" },
    { command: "menu", description: "Main dashboard" },
    { command: "check", description: "Quick check" },
    { command: "stats", description: "Your statistics" },
    { command: "help", description: "Help & commands" },
    { command: "support", description: "Contact support" },
  ]).catch(err => console.error("Failed to set commands:", err.message));

  bot.telegram.setChatMenuButton({ menuButton: { type: "commands" } })
    .catch(err => console.error("Failed to reset menu button:", err.message));

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
          requestsLeft: 5,
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

  function getAdminKeyboard(lang: Language, exitAction: string = "back_to_dashboard") {
    return Markup.inlineKeyboard([
      [Markup.button.callback("📊 " + (t(lang, "admin.statsBtn") || "Stats"), "admin_stats"),
       Markup.button.callback("👥 " + (t(lang, "admin.usersBtn") || "Users"), "admin_users")],
      [Markup.button.callback("🔍 " + (t(lang, "admin.searchBtn") || "Search"), "admin_search_user"),
       Markup.button.callback("💰 " + (t(lang, "admin.paymentsBtn") || "Payments"), "admin_payments")],
      [Markup.button.callback("🎫 " + (t(lang, "admin.ticketsBtn") || "Tickets"), "admin_tickets"),
       Markup.button.callback("🎁 " + (t(lang, "admin.couponsBtn") || "Coupons"), "admin_coupons")],
      [Markup.button.callback("💵 " + (t(lang, "admin.revenueBtn") || "Revenue"), "admin_revenue"),
       Markup.button.callback("📋 " + (t(lang, "admin.reportsBtn") || "Reports"), "admin_reports")],
      [Markup.button.callback("📢 " + (t(lang, "admin.broadcastBtn") || "Broadcast"), "admin_broadcast"),
       Markup.button.callback("🚫 " + (t(lang, "admin.blockingBtn") || "Block"), "admin_block_user")],
      [Markup.button.callback("⭐ " + (t(lang, "admin.tiersBtn") || "Tiers"), "admin_change_tier"),
       Markup.button.callback("➕ " + (t(lang, "admin.addReqBtn") || "Add Req"), "admin_add_requests")],
      [Markup.button.callback("⚙️ " + (t(lang, "admin.settingsBtn") || "Settings"), "admin_settings"),
       Markup.button.callback("📈 " + (lang === "uk" ? "Онлайн" : lang === "ru" ? "Онлайн" : "Online"), "admin_online")],
      [Markup.button.callback("🔙 " + (t(lang, "admin.exitBtn") || "Exit"), exitAction)]
    ]);
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
            requestsLeft: (user.requestsLeft || 5) + 5
          });
          user = await storage.getUserByTgId(tgId);
        }
        
        // Give bonus to referrer
        await storage.updateUser(referrer.id, {
          requestsLeft: (referrer.requestsLeft || 5) + 2
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
      const userName = ctx.from.first_name || ctx.from.username || t(lang, "startWelcome.friend");
      const welcomeText = `${t(lang, "startWelcome.referralTitle")}

━━━━━━━━━━━━━━━━━━━━

${t(lang, "startWelcome.referralGreeting", { name: userName })}

${t(lang, "startWelcome.referralInvited")}

${t(lang, "startWelcome.referralBonusTitle")}
  ${t(lang, "startWelcome.referralBonusChecks")}
  ${t(lang, "startWelcome.referralBonusAccess")}
  ${t(lang, "startWelcome.referralBonusAi")}

━━━━━━━━━━━━━━━━━━━━

${t(lang, "startWelcome.capabilitiesTitle")}
  ${t(lang, "startWelcome.capIpGeo")}
  ${t(lang, "startWelcome.capCrypto")}
  ${t(lang, "startWelcome.capEmail")}
  ${t(lang, "startWelcome.capUrl")}
  ${t(lang, "startWelcome.capCve")}
  ${t(lang, "startWelcome.capMore")}

━━━━━━━━━━━━━━━━━━━━

${t(lang, "startWelcome.selectLanguage")}`;

      await ctx.reply(welcomeText, {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([
          [
            Markup.button.callback("🇺🇦 Українська", "lang_uk"),
            Markup.button.callback("🇬🇧 English", "lang_en"),
            Markup.button.callback("🇷🇺 Русский", "lang_ru")
          ],
          [
            Markup.button.callback("🇪🇸 Español", "lang_es"),
            Markup.button.callback("🇩🇪 Deutsch", "lang_de")
          ]
        ])
      });
    } else if (isNewUser) {
      // Regular welcome for new users
      const userName = ctx.from.first_name || ctx.from.username || t(lang, "startWelcome.friend");
      const welcomeText = `${t(lang, "startWelcome.regularTitle")}

━━━━━━━━━━━━━━━━━━━━

${t(lang, "startWelcome.regularGreeting", { name: userName })}

${t(lang, "startWelcome.yourId")} \`${tgId}\`

${t(lang, "startWelcome.platformDesc")}

━━━━━━━━━━━━━━━━━━━━

${t(lang, "startWelcome.modulesTitle")}
  ${t(lang, "startWelcome.modIpGeo")}
  ${t(lang, "startWelcome.modCrypto")}
  ${t(lang, "startWelcome.modEmail")}
  ${t(lang, "startWelcome.modDomain")}
  ${t(lang, "startWelcome.modUrl")}
  ${t(lang, "startWelcome.modCve")}
  ${t(lang, "startWelcome.modHash")}
  ${t(lang, "startWelcome.modUsername")}

━━━━━━━━━━━━━━━━━━━━

${t(lang, "startWelcome.selectLang")}`;

      await ctx.reply(welcomeText, {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([
          [
            Markup.button.callback("🇺🇦 Українська", "lang_uk"),
            Markup.button.callback("🇬🇧 English", "lang_en"),
            Markup.button.callback("🇷🇺 Русский", "lang_ru")
          ],
          [
            Markup.button.callback("🇪🇸 Español", "lang_es"),
            Markup.button.callback("🇩🇪 Deutsch", "lang_de")
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
    const ratio = Math.min(current / Math.max(max, 1), 1);
    const filled = Math.round(ratio * length);
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

    const requestsLeft = user?.requestsLeft ?? 5;
    const tierLimits: Record<string, number> = {
      "FREE": 5,
      "BASIC": 30,
      "PRO": 50,
      "ENTERPRISE": 9999,
    };
    const requestsLimit = tierLimits[(user?.tier || "FREE").toUpperCase()] || 5;
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
    
    const dashboardText = `🌑 *DARKSHARE v4.2*
━━━━━━━━━━━━━━━━━━━━

${systemStatus}

${tierEmoji} ${t(lang, "common.tier")}: *${tierName}*
${t(lang, "dashboard.stats", { requestsLeft: String(requestsLeft), requestsLimit: String(requestsLimit) })}
${progressBar}
🔥 ${t(lang, "common.streak")}: *${user?.streakDays || 0}*
🕐 ${lastActivity}${requestsWarning}`;

    const webUrl = process.env.WEB_DOMAIN || "https://www.darkshare.store";

    const keyboardRows: any[][] = [
      [Markup.button.callback("🔍 " + t(lang, "buttons.check"), "check_all")],
      [
        Markup.button.callback(t(lang, "buttons.settings"), "settings"),
        Markup.button.callback(t(lang, "buttons.upgrade"), "upgrade")
      ],
      [
        Markup.button.callback(t(lang, "buttons.profile"), "profile"),
        Markup.button.callback(t(lang, "buttons.referrals"), "referrals")
      ],
      [
        Markup.button.callback(t(lang, "buttons.history"), "history"),
        Markup.button.callback(t(lang, "buttons.monitoring"), "monitoring")
      ],
      [
        Markup.button.callback(t(lang, "support.command"), "open_support"),
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

    const safeText = dashboardText.length > 4000 ? dashboardText.substring(0, 3990) + '...' : dashboardText;

    try {
      if (isEdit) {
        await ctx.editMessageText(safeText, { parse_mode: "Markdown", ...keyboard });
      } else {
        await ctx.reply(safeText, { parse_mode: "Markdown", ...keyboard });
      }
    } catch {
      await ctx.reply(safeText, { parse_mode: "Markdown", ...keyboard });
    }
  }

  bot.action("check_all", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const lang = await getLang(tgId);

    const text = `🔍 *${t(lang, "dashboard.selectModule")}*\n\n${lang === "uk" ? "Оберіть тип перевірки:" : lang === "ru" ? "Выберите тип проверки:" : "Select check type:"}`;
    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback(t(lang, "modules.ip"), "mod_ip"),
        Markup.button.callback(t(lang, "modules.wallet"), "mod_wallet"),
        Markup.button.callback(t(lang, "modules.email"), "mod_email")
      ],
      [
        Markup.button.callback(t(lang, "modules.phone"), "mod_phone"),
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
        Markup.button.callback(t(lang, "modules.bot") || "🤖 Bot Token", "mod_bot")
      ],
      [Markup.button.callback(t(lang, "buttons.back"), "back_to_dashboard")]
    ]);
    try {
      await ctx.editMessageText(text, { parse_mode: "Markdown", ...keyboard });
    } catch {
      await ctx.reply(text, { parse_mode: "Markdown", ...keyboard });
    }
  });

  bot.action("cat_network", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const lang = await getLang(tgId);
    const text = `🌐 *${lang === "uk" ? "Мережа & Web" : lang === "ru" ? "Сеть & Web" : "Network & Web"}*\n\n${lang === "uk" ? "Оберіть модуль перевірки:" : lang === "ru" ? "Выберите модуль проверки:" : "Select check module:"}`;
    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback(t(lang, "modules.ip"), "mod_ip"),
        Markup.button.callback(t(lang, "modules.domain"), "mod_business"),
        Markup.button.callback(t(lang, "modules.url"), "mod_url")
      ],
      [Markup.button.callback(t(lang, "buttons.back"), "back_to_dashboard")]
    ]);
    try {
      await ctx.editMessageText(text, { parse_mode: "Markdown", ...keyboard });
    } catch {
      await ctx.reply(text, { parse_mode: "Markdown", ...keyboard });
    }
  });

  bot.action("cat_finance", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const lang = await getLang(tgId);
    const text = `💰 *${lang === "uk" ? "Крипто & Фінанси" : lang === "ru" ? "Крипто & Финансы" : "Crypto & Finance"}*\n\n${lang === "uk" ? "Оберіть модуль перевірки:" : lang === "ru" ? "Выберите модуль проверки:" : "Select check module:"}`;
    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback(t(lang, "modules.wallet"), "mod_wallet"),
        Markup.button.callback(t(lang, "modules.card"), "mod_card")
      ],
      [Markup.button.callback(t(lang, "buttons.back"), "back_to_dashboard")]
    ]);
    try {
      await ctx.editMessageText(text, { parse_mode: "Markdown", ...keyboard });
    } catch {
      await ctx.reply(text, { parse_mode: "Markdown", ...keyboard });
    }
  });

  bot.action("cat_osint", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const lang = await getLang(tgId);
    const text = `🔍 *OSINT*\n\n${lang === "uk" ? "Оберіть модуль перевірки:" : lang === "ru" ? "Выберите модуль проверки:" : "Select check module:"}`;
    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback(t(lang, "modules.email"), "mod_email"),
        Markup.button.callback(t(lang, "modules.phone"), "mod_phone")
      ],
      [
        Markup.button.callback(t(lang, "modules.username"), "mod_username"),
        Markup.button.callback(t(lang, "modules.bot") || "🤖 Bot Token", "mod_bot")
      ],
      [Markup.button.callback(t(lang, "buttons.back"), "back_to_dashboard")]
    ]);
    try {
      await ctx.editMessageText(text, { parse_mode: "Markdown", ...keyboard });
    } catch {
      await ctx.reply(text, { parse_mode: "Markdown", ...keyboard });
    }
  });

  bot.action("cat_security", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const lang = await getLang(tgId);
    const text = `🛡 *${lang === "uk" ? "Безпека" : lang === "ru" ? "Безопасность" : "Security"}*\n\n${lang === "uk" ? "Оберіть модуль перевірки:" : lang === "ru" ? "Выберите модуль проверки:" : "Select check module:"}`;
    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback(t(lang, "modules.cve"), "mod_cve"),
        Markup.button.callback(t(lang, "modules.hash"), "mod_hash")
      ],
      [
        Markup.button.callback(t(lang, "modules.iot"), "mod_iot"),
        Markup.button.callback(t(lang, "modules.cloud"), "mod_cloud")
      ],
      [Markup.button.callback(t(lang, "buttons.back"), "back_to_dashboard")]
    ]);
    try {
      await ctx.editMessageText(text, { parse_mode: "Markdown", ...keyboard });
    } catch {
      await ctx.reply(text, { parse_mode: "Markdown", ...keyboard });
    }
  });

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
    const statsTierLimits: Record<string, number> = { "FREE": 5, "BASIC": 30, "PRO": 50, "ENTERPRISE": 9999 };
    const statsUserLimit = statsTierLimits[(user?.tier || "FREE").toUpperCase()] || 5;
    const requestsBar = generateProgressBar(user.requestsLeft || 0, statsUserLimit);
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
• 📊 ${requestsBar} ${user.requestsLeft || 0}/${statsUserLimit}
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
• IP: \`8.8.8.8\`
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

  const moduleActions = ["mod_ip", "mod_wallet", "mod_phone", "mod_email", "mod_business", "mod_url", "mod_cve", "mod_hash", "mod_username", "mod_card", "mod_bot"];
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
    "mod_card": "card",
    "mod_bot": "bot"
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

    if (state?.module === "promo_payment" && state?.step === "input") {
      const code = text.trim().toUpperCase();
      const tier = state.data.tier;
      
      try {
        const coupon = await storage.getCouponByCode(code);
        
        if (!coupon || !coupon.isActive) {
          const errorText = `❌ ${lang === "uk" ? "Недійсний промокод. Спробуйте ще раз:" : lang === "ru" ? "Недействительный промокод. Попробуйте ещё раз:" : lang === "es" ? "Código promocional inválido. Intente de nuevo:" : lang === "de" ? "Ungültiger Promo-Code. Versuchen Sie es erneut:" : "Invalid promo code. Try again:"}`;
          await ctx.reply(errorText);
          return;
        }
        
        if ((coupon.usedCount ?? 0) >= (coupon.maxUses ?? 0)) {
          const errorText = `❌ ${lang === "uk" ? "Промокод вичерпано." : lang === "ru" ? "Промокод исчерпан." : lang === "es" ? "Código promocional agotado." : lang === "de" ? "Promo-Code aufgebraucht." : "Promo code exhausted."}`;
          await ctx.reply(errorText);
          userStates.delete(tgId);
          return;
        }
        
        if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
          const errorText = `❌ ${lang === "uk" ? "Промокод прострочений." : lang === "ru" ? "Промокод просрочен." : lang === "es" ? "Código promocional expirado." : lang === "de" ? "Promo-Code abgelaufen." : "Promo code expired."}`;
          await ctx.reply(errorText);
          userStates.delete(tgId);
          return;
        }
        
        if (coupon.tier && coupon.tier !== tier.toUpperCase()) {
          const errorText = `❌ ${lang === "uk" ? "Промокод не діє для цього тарифу." : lang === "ru" ? "Промокод не действует для этого тарифа." : lang === "es" ? "Código no válido para este plan." : lang === "de" ? "Promo-Code gilt nicht für diesen Tarif." : "Promo code not valid for this plan."}`;
          await ctx.reply(errorText);
          return;
        }
        
        if (user) {
          const alreadyUsed = await storage.hasUserUsedCoupon(coupon.id, user.id);
          if (alreadyUsed) {
            const errorText = `❌ ${lang === "uk" ? "Ви вже використовували цей промокод." : lang === "ru" ? "Вы уже использовали этот промокод." : lang === "es" ? "Ya ha utilizado este código promocional." : lang === "de" ? "Sie haben diesen Promo-Code bereits verwendet." : "You have already used this promo code."}`;
            await ctx.reply(errorText);
            userStates.delete(tgId);
            return;
          }
        }
        
        const uahPrices: Record<string, number> = { PRO: 410, ENTERPRISE: 1435, GROUPS: 2255 };
        const basePrice = uahPrices[tier] || 0;
        const discountedPrice = Math.round(basePrice * (1 - (coupon.value || 0) / 100));
        
        userStates.delete(tgId);
        
        const promoText = `✅ *${lang === "uk" ? "Промокод активовано!" : lang === "ru" ? "Промокод активирован!" : lang === "es" ? "¡Código promocional activado!" : lang === "de" ? "Promo-Code aktiviert!" : "Promo code activated!"}*\n\n🎁 ${lang === "uk" ? "Знижка" : lang === "ru" ? "Скидка" : lang === "es" ? "Descuento" : lang === "de" ? "Rabatt" : "Discount"}: -${coupon.value}%\n💰 ${lang === "uk" ? "Нова ціна" : lang === "ru" ? "Новая цена" : lang === "es" ? "Nuevo precio" : lang === "de" ? "Neuer Preis" : "New price"}: ~~${basePrice}~~ ${discountedPrice} UAH\n\n${lang === "uk" ? "Оберіть спосіб оплати:" : lang === "ru" ? "Выберите способ оплаты:" : lang === "es" ? "Seleccione método de pago:" : lang === "de" ? "Zahlungsmethode wählen:" : "Select payment method:"}`;
        
        await ctx.reply(promoText, {
          parse_mode: "Markdown",
          ...Markup.inlineKeyboard([
            [Markup.button.callback("💳 Google Pay / Apple Pay", `bot_pay_method_${tier}_monobank`)],
            [Markup.button.callback("💰 Crypto (USDT)", `bot_pay_method_${tier}_crypto`)],
            [Markup.button.callback(t(lang, "buttons.back"), `bot_pay_tier_${tier}`)]
          ])
        });
        
        if (user) {
          await storage.useCoupon(coupon.id, user.id);
        }
      } catch (err) {
        console.error("Bot promo validation error:", err);
        const errorText = `❌ ${lang === "uk" ? "Помилка перевірки промокоду." : lang === "ru" ? "Ошибка проверки промокода." : lang === "es" ? "Error de validación del código." : lang === "de" ? "Fehler bei der Promo-Code-Überprüfung." : "Promo code validation error."}`;
        await ctx.reply(errorText);
        userStates.delete(tgId);
      }
      return;
    }

    if (state?.module === "admin_broadcast" && state?.step === "awaiting_message") {
      if (!isAdmin(tgId)) {
        userStates.delete(tgId);
        const lang = await getLang(tgId);
        return ctx.reply(t(lang, "admin.accessDenied"));
      }
      
      const lang = await getLang(tgId);
      const broadcastText = text.trim();
      userStates.set(tgId, { module: "admin_broadcast", step: "confirm", data: { message: broadcastText } });
      
      await ctx.reply(`${t(lang, "admin.confirmBroadcast")}\n\n${t(lang, "admin.message")}\n${broadcastText}\n\n${t(lang, "admin.confirmPrompt")}`, {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([
          [
            Markup.button.callback(t(lang, "admin.send"), "admin_broadcast_confirm"),
            Markup.button.callback(t(lang, "admin.cancel"), "admin_broadcast_cancel")
          ]
        ])
      });
      return;
    }

    if (state?.module === "admin_block_user" && state?.step === "awaiting_tgid") {
      if (!isAdmin(tgId)) {
        userStates.delete(tgId);
        const lang = await getLang(tgId);
        return ctx.reply(t(lang, "admin.accessDenied"));
      }
      
      const lang = await getLang(tgId);
      const targetTgId = text.trim();
      const targetUser = await storage.getUserByTgId(targetTgId);
      
      if (!targetUser) {
        return ctx.reply(t(lang, "admin.userNotFound", { id: targetTgId }), {
          parse_mode: "Markdown",
          ...Markup.inlineKeyboard([[Markup.button.callback(t(lang, "admin.back"), "admin_back")]])
        });
      }
      
      userStates.delete(tgId);
      
      const statusEmoji = targetUser.blocked ? "🔴" : "🟢";
      const resultText = `${t(lang, "admin.userFound")}\n\n` +
        `${statusEmoji} ${targetUser.username ? `@${targetUser.username}` : targetUser.tgId}\n` +
        `${t(lang, "admin.tierLabel")} ${targetUser.tier}\n` +
        `${t(lang, "admin.statusLabel")} ${targetUser.blocked ? t(lang, "admin.blocked") : t(lang, "admin.active")}\n\n` +
        `${t(lang, "admin.selectAction")}`;
      
      await ctx.reply(resultText, {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([
          [Markup.button.callback(targetUser.blocked ? t(lang, "admin.unblock") : t(lang, "admin.block"), `admin_toggle_block_${targetUser.id}`)],
          [Markup.button.callback(t(lang, "admin.moreInfo"), `admin_user_info_${targetUser.id}`)],
          [Markup.button.callback(t(lang, "admin.back"), "admin_back")]
        ])
      });
      return;
    }

    if (state?.module === "admin_change_tier" && state?.step === "awaiting_tgid") {
      if (!isAdmin(tgId)) {
        userStates.delete(tgId);
        const lang = await getLang(tgId);
        return ctx.reply(t(lang, "admin.accessDenied"));
      }
      
      const lang = await getLang(tgId);
      const targetTgId = text.trim();
      const targetUser = await storage.getUserByTgId(targetTgId);
      
      if (!targetUser) {
        return ctx.reply(t(lang, "admin.userNotFound", { id: targetTgId }), {
          parse_mode: "Markdown",
          ...Markup.inlineKeyboard([[Markup.button.callback(t(lang, "admin.back"), "admin_back")]])
        });
      }
      
      userStates.delete(tgId);
      
      const tierEmoji = targetUser.tier === "ENTERPRISE" ? "👑" : targetUser.tier === "PRO" ? "⭐" : "🆓";
      const resultText = `${t(lang, "admin.changeTierTitle")}\n\n` +
        `👤 ${targetUser.username ? `@${targetUser.username}` : targetUser.tgId}\n` +
        `${tierEmoji} ${t(lang, "admin.currentTier")} ${targetUser.tier}\n\n` +
        `${t(lang, "admin.selectNewTier")}`;
      
      await ctx.reply(resultText, {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([
          [
            Markup.button.callback("🆓 FREE", `admin_set_tier_${targetUser.id}_FREE`),
            Markup.button.callback("⭐ PRO", `admin_set_tier_${targetUser.id}_PRO`),
            Markup.button.callback("👑 ENTERPRISE", `admin_set_tier_${targetUser.id}_ENTERPRISE`)
          ],
          [Markup.button.callback(t(lang, "admin.back"), "admin_back")]
        ])
      });
      return;
    }

    if (state?.module === "admin_search_user" && state?.step === "awaiting_query") {
      if (!isAdmin(tgId)) {
        userStates.delete(tgId);
        const lang = await getLang(tgId);
        return ctx.reply(t(lang, "admin.accessDenied"));
      }
      
      const lang = await getLang(tgId);
      const query = text.trim();
      const foundUsers = await storage.searchUsers(query);
      
      userStates.delete(tgId);
      
      if (foundUsers.length === 0) {
        return ctx.reply(`${t(lang, "admin.searchResults")}\n\n${t(lang, "admin.nothingFound", { query })}`, {
          parse_mode: "Markdown",
          ...Markup.inlineKeyboard([
            [Markup.button.callback(t(lang, "admin.newSearch"), "admin_search_user")],
            [Markup.button.callback(t(lang, "admin.back"), "admin_back")]
          ])
        });
      }
      
      let resultText = `${t(lang, "admin.searchResults")} (${foundUsers.length})\n\n`;
      
      foundUsers.slice(0, 10).forEach((u, i) => {
        const statusEmoji = u.blocked ? "🔴" : "🟢";
        const tierEmoji = u.tier === "ENTERPRISE" ? "👑" : u.tier === "PRO" ? "⭐" : "🆓";
        resultText += `${i + 1}. ${statusEmoji} ${tierEmoji} ${u.username ? `@${u.username}` : "—"}\n`;
        resultText += `   ID: \`${u.tgId}\`\n`;
      });
      
      if (foundUsers.length > 10) {
        resultText += `\n_${t(lang, "admin.andMore", { count: foundUsers.length - 10 })}_`;
      }
      
      const buttons: any[][] = [];
      foundUsers.slice(0, 5).forEach(u => {
        buttons.push([Markup.button.callback(`👤 ${u.username || u.tgId}`, `admin_user_info_${u.id}`)]);
      });
      buttons.push([Markup.button.callback(t(lang, "admin.newSearch"), "admin_search_user")]);
      buttons.push([Markup.button.callback(t(lang, "admin.back"), "admin_back")]);
      
      await ctx.reply(resultText, {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard(buttons)
      });
      return;
    }

    if (state?.module === "admin_ticket_reply" && state?.step === "awaiting_reply") {
      if (!isAdmin(tgId)) {
        userStates.delete(tgId);
        return ctx.reply(t(lang, "admin.accessDenied"));
      }
      
      const ticketId = state.data?.ticketId;
      const replyText = text.trim();
      userStates.delete(tgId);
      
      const ticket = await storage.getTicketById(ticketId);
      await storage.updateSupportTicketStatus(ticketId, "answered", replyText);
      
      if (ticket?.userId) {
        try {
          const ticketUser = await storage.getUserById(ticket.userId);
          if (ticketUser) {
            await ctx.telegram.sendMessage(ticketUser.tgId, `${t(lang, "admin.ticketReply")}\n\n${replyText}`);
          }
        } catch (e) {
          console.log("Failed to notify user about ticket reply");
        }
      }
      
      await ctx.reply(t(lang, "admin.ticketReplySent"), {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([[Markup.button.callback(t(lang, "admin.back"), "admin_tickets")]])
      });
      return;
    }

    if (state?.module === "admin_coupon_create" && state?.step === "awaiting_code") {
      if (!isAdmin(tgId)) {
        userStates.delete(tgId);
        return ctx.reply(t(lang, "admin.accessDenied"));
      }
      
      const code = text.trim().toUpperCase();
      userStates.set(tgId, { module: "admin_coupon_create", step: "awaiting_discount", data: { code } });
      
      await ctx.reply(t(lang, "admin.enterCouponDiscount"), {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([[Markup.button.callback(t(lang, "admin.cancel"), "admin_coupons")]])
      });
      return;
    }

    if (state?.module === "admin_coupon_create" && state?.step === "awaiting_discount") {
      if (!isAdmin(tgId)) {
        userStates.delete(tgId);
        return ctx.reply(t(lang, "admin.accessDenied"));
      }
      
      const discount = parseInt(text.trim());
      if (isNaN(discount) || discount < 1 || discount > 100) {
        return ctx.reply(t(lang, "admin.invalidAmount"));
      }
      
      userStates.set(tgId, { module: "admin_coupon_create", step: "awaiting_max_uses", data: { ...state.data, discount } });
      
      await ctx.reply(t(lang, "admin.enterCouponMaxUses"), {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([[Markup.button.callback(t(lang, "admin.cancel"), "admin_coupons")]])
      });
      return;
    }

    if (state?.module === "admin_coupon_create" && state?.step === "awaiting_max_uses") {
      if (!isAdmin(tgId)) {
        userStates.delete(tgId);
        return ctx.reply(t(lang, "admin.accessDenied"));
      }
      
      const maxUses = parseInt(text.trim());
      if (isNaN(maxUses) || maxUses < 0) {
        return ctx.reply(t(lang, "admin.invalidAmount"));
      }
      
      userStates.set(tgId, { module: "admin_coupon_create", step: "awaiting_expiry", data: { ...state.data, maxUses } });
      
      await ctx.reply(t(lang, "admin.enterCouponExpiry"), {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([[Markup.button.callback(t(lang, "admin.cancel"), "admin_coupons")]])
      });
      return;
    }

    if (state?.module === "admin_coupon_create" && state?.step === "awaiting_expiry") {
      if (!isAdmin(tgId)) {
        userStates.delete(tgId);
        return ctx.reply(t(lang, "admin.accessDenied"));
      }
      
      const expiryDays = parseInt(text.trim());
      if (isNaN(expiryDays) || expiryDays < 0) {
        return ctx.reply(t(lang, "admin.invalidAmount"));
      }
      
      const { code, discount, maxUses } = state.data;
      const expiresAt = expiryDays > 0 ? new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000) : null;
      
      userStates.delete(tgId);
      
      await storage.createCoupon({
        code,
        type: "checks",
        value: discount,
        maxUses: maxUses || 1,
        expiresAt,
        isActive: true,
      });
      
      await ctx.reply(t(lang, "admin.couponCreated"), {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([[Markup.button.callback(t(lang, "admin.back"), "admin_coupons")]])
      });
      return;
    }

    if (state?.module === "admin_add_requests" && state?.step === "awaiting_tgid") {
      if (!isAdmin(tgId)) {
        userStates.delete(tgId);
        return ctx.reply(t(lang, "admin.accessDenied"));
      }
      
      const targetTgId = text.trim();
      const targetUser = await storage.getUserByTgId(targetTgId);
      
      if (!targetUser) {
        return ctx.reply(t(lang, "admin.userNotFound", { id: targetTgId }), {
          parse_mode: "Markdown",
          ...Markup.inlineKeyboard([[Markup.button.callback(t(lang, "admin.back"), "admin_back")]])
        });
      }
      
      userStates.set(tgId, { module: "admin_add_requests", step: "awaiting_amount", data: { targetUserId: targetUser.id, targetTgId: targetUser.tgId, targetUsername: targetUser.username } });
      
      await ctx.reply(t(lang, "admin.enterRequestsAmount"), {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([[Markup.button.callback(t(lang, "admin.cancel"), "admin_back")]])
      });
      return;
    }

    if (state?.module === "admin_add_requests" && state?.step === "awaiting_amount") {
      if (!isAdmin(tgId)) {
        userStates.delete(tgId);
        return ctx.reply(t(lang, "admin.accessDenied"));
      }
      
      const amount = parseInt(text.trim());
      if (isNaN(amount) || amount <= 0) {
        return ctx.reply(t(lang, "admin.invalidAmount"));
      }
      
      const { targetUserId, targetUsername } = state.data;
      userStates.delete(tgId);
      
      const updatedUser = await storage.addRequestsToUser(targetUserId, amount);
      
      await ctx.reply(t(lang, "admin.requestsAdded", { 
        amount: amount.toString(), 
        username: targetUsername || state.data.targetTgId,
        total: (updatedUser.requestsLeft || 0).toString()
      }), {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([[Markup.button.callback(t(lang, "admin.back"), "admin_back")]])
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

    if (state?.module === "support") {
      if (!user) return;

      if (state.step === "name") {
        userStates.set(tgId, { module: "support", step: "contact", data: { name: text.trim() } });
        return ctx.reply(t(lang, "support.askContact"), {
          parse_mode: "Markdown",
          ...Markup.inlineKeyboard([[Markup.button.callback(t(lang, "buttons.cancel"), "back_to_dashboard")]])
        });
      }

      if (state.step === "contact") {
        userStates.set(tgId, { module: "support", step: "message", data: { ...state.data, contact: text.trim() } });
        return ctx.reply(t(lang, "support.askMessage"), {
          parse_mode: "Markdown",
          ...Markup.inlineKeyboard([[Markup.button.callback(t(lang, "buttons.cancel"), "back_to_dashboard")]])
        });
      }

      if (state.step === "message") {
        const name = state.data?.name || "";
        const contact = state.data?.contact || "";
        const message = text.trim();

        try {
          const ticket = await storage.createSupportTicket({
            userId: user.id,
            name,
            contact,
            message,
            source: "telegram",
          });

          userStates.delete(tgId);

          await ctx.reply(t(lang, "support.sent"), {
            parse_mode: "Markdown",
            ...Markup.inlineKeyboard([[Markup.button.callback(t(lang, "buttons.back"), "back_to_dashboard")]])
          });

          for (const adminId of ADMIN_IDS) {
            try {
              await ctx.telegram.sendMessage(adminId, 
                `📩 Нове звернення #${ticket.id}\n\n👤 Ім'я: ${name}\n📱 Контакт: ${contact}\n🔢 TG ID: ${user.tgId} (@${user.username || '—'})\n📍 Джерело: Telegram Bot\n\n💬 Повідомлення:\n${message}`,
                {
                  reply_markup: Markup.inlineKeyboard([
                    [
                      Markup.button.callback("💬 Відповісти", `reply_ticket_${ticket.id}`),
                      Markup.button.callback("✅ Закрити", `close_ticket_${ticket.id}`)
                    ]
                  ]).reply_markup
                }
              );
            } catch (e) {
              console.log(`Failed to notify admin ${adminId} about support ticket:`, e);
            }
          }
        } catch (e) {
          console.error("Failed to create support ticket:", e);
          userStates.delete(tgId);
          await ctx.reply(t(lang, "support.error"), {
            parse_mode: "Markdown",
            ...Markup.inlineKeyboard([[Markup.button.callback(t(lang, "buttons.back"), "back_to_dashboard")]])
          });
        }
        return;
      }
    }

    if (user && user.requestsLeft! <= 0) {
      return ctx.reply(t(lang, "checkResult.limitExceeded"), {
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

    // Check daily limits per tier
    if (user) {
      const userTier = (user.tier || "FREE").toUpperCase();
      
      const DAILY_LIMITS: Record<string, number> = {
        FREE: 5,
        PRO: 50,
        ENTERPRISE: Infinity,
        GROUPS: Infinity,
      };
      
      const dailyLimit = DAILY_LIMITS[userTier] || 5;
      
      if (dailyLimit !== Infinity) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const userReports = await storage.getReports(user.id);
        const todayChecks = userReports.filter(r => r.generatedAt && new Date(r.generatedAt) >= today).length;
        
        if (todayChecks >= dailyLimit) {
          const errorMsg = lang === "uk" 
            ? `❌ Денний ліміт досягнутий (${todayChecks}/${dailyLimit}). Оновіться для більше перевірок.`
            : lang === "ru"
            ? `❌ Дневной лимит достигнут (${todayChecks}/${dailyLimit}). Обновитесь для большего количества проверок.`
            : `❌ Daily check limit reached (${todayChecks}/${dailyLimit}). Upgrade your plan for more checks.`;
          
          return ctx.reply(errorMsg, {
            parse_mode: "Markdown",
            ...Markup.inlineKeyboard([
              [Markup.button.callback(t(lang, "buttons.upgrade"), "upgrade")],
              [Markup.button.callback(t(lang, "buttons.back"), "back_to_dashboard")]
            ])
          });
        }
      }
    }

    const inputValue = text.trim();
    
    // Validation with helpful error messages
    switch (state.module) {
      case "ip":
        if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(inputValue)) {
          return ctx.reply(t(lang, "checkResult.invalidIp"), { parse_mode: "Markdown" });
        }
        break;
      case "wallet":
        const isEVM = inputValue.startsWith("0x") && inputValue.length >= 40;
        const isBTC = /^(1|3|bc1)[a-zA-HJ-NP-Z0-9]{25,62}$/.test(inputValue);
        const isTRX = inputValue.startsWith("T") && inputValue.length === 34;
        const isSOL = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(inputValue) && !inputValue.startsWith("T") && !inputValue.startsWith("0x");
        
        if (!isEVM && !isBTC && !isTRX && !isSOL) {
          return ctx.reply(t(lang, "checkResult.invalidWallet"), { parse_mode: "Markdown" });
        }
        break;
      case "email":
        if (!inputValue.includes("@") || !inputValue.includes(".")) {
          return ctx.reply(t(lang, "checkResult.invalidEmail"), { parse_mode: "Markdown" });
        }
        break;
      case "domain":
        if (!inputValue.includes(".") || inputValue.includes(" ") || inputValue.startsWith("http://") || inputValue.startsWith("https://")) {
          return ctx.reply(t(lang, "checkResult.invalidDomain"), { parse_mode: "Markdown" });
        }
        break;
      case "url":
        if (!inputValue.startsWith("http://") && !inputValue.startsWith("https://")) {
          return ctx.reply(t(lang, "checkResult.invalidUrl"), { parse_mode: "Markdown" });
        }
        break;
      case "cve":
        if (!/^CVE-\d{4}-\d{4,}$/i.test(inputValue)) {
          return ctx.reply(t(lang, "checkResult.invalidCve"), { parse_mode: "Markdown" });
        }
        break;
      case "hash":
        if (!/^[a-fA-F0-9]{32,128}$/.test(inputValue)) {
          return ctx.reply(t(lang, "checkResult.invalidHash"), { parse_mode: "Markdown" });
        }
        break;
      case "phone":
        if (!/^\+?[\d\s\-()]{7,20}$/.test(inputValue)) {
          return ctx.reply(t(lang, "checkResult.invalidPhone"), { parse_mode: "Markdown" });
        }
        break;
    }
    
    // Send initial loading message and store message ID
    let checkResult: CheckResult;
    let loadingMsg = await ctx.reply("⏳ *" + t(lang, "checkResult.analyzing") + "* ", { parse_mode: "Markdown" });
    
    try {
      // Loading animation
      const loadingEmojis = ["⏳", "🔄", "✅"];
      const animationDelay = 600;
      
      for (let i = 0; i < 2; i++) {
        await new Promise(resolve => setTimeout(resolve, animationDelay));
        try {
          const animText = loadingEmojis[i] + " *" + t(lang, "checkResult.analyzing") + "* ";
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
        const finalText = "✅ *" + t(lang, "checkResult.done") + "*";
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
          "❌ *" + t(lang, "checkResult.analysisError") + "*",
          { parse_mode: "Markdown" }
        );
      } catch (e) {
        // Ignore
      }
      return ctx.reply(t(lang, "checkResult.processingError"), { parse_mode: "Markdown" });
    }
    
    const getStatusIndicator = (level: string, lang: Language) => {
      switch (level) {
        case "low": return t(lang, "checkResult.statusSafe");
        case "medium": return t(lang, "checkResult.statusCaution");
        case "high": return t(lang, "checkResult.statusDanger");
        case "critical": return t(lang, "checkResult.statusCritical");
        default: return t(lang, "checkResult.statusCaution");
      }
    };

    const moduleEmojis: Record<string, string> = {
      ip: "🌐", wallet: "💰", phone: "📱", 
      email: "📧", domain: "🏢", url: "🔗",
      cve: "🔓", hash: "🔢", username: "👤",
      card: "💳", iot: "📡", cloud: "☁️"
    };

    const moduleNames: Record<string, string> = {
      ip: t(lang, "checkResult.ipAnalysis"),
      wallet: t(lang, "checkResult.cryptoAnalysis"), 
      phone: t(lang, "checkResult.phoneOsint"),
      email: t(lang, "checkResult.emailAnalysis"),
      domain: t(lang, "checkResult.domainWhois"),
      url: t(lang, "checkResult.urlCheck"),
      cve: t(lang, "checkResult.cveScan"),
      hash: t(lang, "checkResult.hashAnalysis"),
      username: "USERNAME OSINT",
      card: t(lang, "checkResult.cardBinAnalysis"),
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
      const bankName = checkResult.details?.bank?.name || t(lang, "checkResult.unknown");
      const countryEmoji = checkResult.details?.country?.emoji || "🌍";
      const countryName = checkResult.details?.country?.name || t(lang, "checkResult.unknownCountry");
      const cardBrand = checkResult.details?.brand || "—";
      const cardType = checkResult.details?.type ? (
        checkResult.details.type === "debit" ? t(lang, "checkResult.debit") :
        checkResult.details.type === "credit" ? t(lang, "checkResult.credit") :
        checkResult.details.type
      ) : "—";
      const isPrepaid = checkResult.details?.isPrepaid;
      
      const findingsFormatted = checkResult.findings.slice(0, 5).map((f, i, arr) => 
        i === arr.length - 1 ? `└ ${f}` : `├ ${f}`
      ).join("\n");

      const infoLabel = t(lang, "checkResult.info");
      const analysisLabel = t(lang, "checkResult.analysis");
      const riskLabel = t(lang, "checkResult.risk");
      const bankLabel = t(lang, "checkResult.bank");
      const countryLabel = t(lang, "checkResult.country");
      const brandLabel = t(lang, "checkResult.brand");
      const typeLabel = t(lang, "checkResult.type");
      const statusLabel = t(lang, "checkResult.status");

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

      const statusLabel = t(lang, "checkResult.status");
      const targetLabel = t(lang, "checkResult.target");
      const analysisLabel = t(lang, "checkResult.analysis");
      const riskLabel = t(lang, "checkResult.risk");

      let detailsSection = "";
      
      if (state.module === "ip" && checkResult.details) {
        const countryInfo = checkResult.details.country ? `${checkResult.details.countryCode || ""} ${checkResult.details.country}` : "";
        const cityInfo = checkResult.details.city || "";
        const ispInfo = checkResult.details.isp || "";
        
        const locationLabel = t(lang, "checkResult.location");
        const ispLabel = t(lang, "checkResult.isp");
        
        if (countryInfo || cityInfo) {
          detailsSection = `
┌─ ${t(lang, "checkResult.details")} ─┐
🌍 *${locationLabel}:* ${cityInfo}${cityInfo && countryInfo ? ", " : ""}${countryInfo}
🏢 *${ispLabel}:* ${ispInfo}
└──────────────────┘`;
        }
      } else if (state.module === "wallet" && checkResult.details) {
        const chain = checkResult.details.chain || "";
        const chainLabel = t(lang, "checkResult.chain");
        
        if (chain) {
          detailsSection = `
┌─ ${t(lang, "checkResult.details")} ─┐
⛓️ *${chainLabel}:* ${chain}
└──────────────────┘`;
        }
      } else if (state.module === "email" && checkResult.details) {
        const domain = checkResult.details.domain || "";
        const mx = checkResult.details.hasMx ? "✅" : "❌";
        
        if (domain) {
          detailsSection = `
┌─ ${t(lang, "checkResult.details")} ─┐
🌐 *${t(lang, "checkResult.domain")}:* ${domain}
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
      await storage.updateUser(user.id, { requestsLeft: Math.max(0, (user.requestsLeft || 5) - 1) });
      
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

  bot.action("bot_payment", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const lang = await getLang(tgId);
    const user = await storage.getUserByTgId(tgId);
    
    const text = `💳 *${lang === "uk" ? "Оплата підписки" : lang === "ru" ? "Оплата подписки" : "Subscription Payment"}*\n\n${lang === "uk" ? "Оберіть тариф:" : lang === "ru" ? "Выберите тариф:" : "Select plan:"}`;
    
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback("⭐ PRO — $10/mo (410 UAH)", "bot_pay_tier_PRO")],
      [Markup.button.callback("👑 ENTERPRISE — $35/mo (1435 UAH)", "bot_pay_tier_ENTERPRISE")],
      [Markup.button.callback("👥 GROUPS — $55/mo (2255 UAH)", "bot_pay_tier_GROUPS")],
      [Markup.button.callback(t(lang, "buttons.back"), "back_to_dashboard")]
    ]);
    
    try {
      await ctx.editMessageText(text, { parse_mode: "Markdown", ...keyboard });
    } catch {
      await ctx.reply(text, { parse_mode: "Markdown", ...keyboard });
    }
  });

  bot.action(/^bot_pay_tier_(PRO|ENTERPRISE|GROUPS)$/, async (ctx) => {
    const tier = ctx.match[1];
    const tgId = ctx.from!.id.toString();
    const lang = await getLang(tgId);
    
    const uahPrices: Record<string, number> = { PRO: 410, ENTERPRISE: 1435, GROUPS: 2255 };
    const usdPrices: Record<string, number> = { PRO: 10, ENTERPRISE: 35, GROUPS: 55 };
    
    const text = `💳 *${tier}*\n\n${lang === "uk" ? "Сума" : lang === "ru" ? "Сумма" : "Amount"}: ${uahPrices[tier]} UAH (~$${usdPrices[tier]} USD)\n\n${lang === "uk" ? "Оберіть спосіб оплати:" : lang === "ru" ? "Выберите способ оплаты:" : "Select payment method:"}\n\n${lang === "uk" ? "💡 Сума в гривнях (UAH). Ваш банк автоматично конвертує з вашої валюти." : lang === "ru" ? "💡 Сумма в гривнах (UAH). Ваш банк автоматически конвертирует из вашей валюты." : "💡 Amount in UAH. Your bank converts automatically from your currency."}`;
    
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback("💳 Google Pay / Apple Pay", `bot_pay_method_${tier}_monobank`)],
      [Markup.button.callback("💰 Crypto (USDT)", `bot_pay_method_${tier}_crypto`)],
      [Markup.button.callback("🎁 " + (lang === "uk" ? "Промокод" : lang === "ru" ? "Промокод" : "Promo code"), `bot_pay_promo_${tier}`)],
      [Markup.button.callback(t(lang, "buttons.back"), "bot_payment")]
    ]);
    
    try {
      await ctx.editMessageText(text, { parse_mode: "Markdown", ...keyboard });
    } catch {
      await ctx.reply(text, { parse_mode: "Markdown", ...keyboard });
    }
  });

  bot.action(/^bot_pay_method_(PRO|ENTERPRISE|GROUPS)_monobank$/, async (ctx) => {
    const tier = ctx.match[1];
    const tgId = ctx.from!.id.toString();
    const lang = await getLang(tgId);
    
    const uahPrices: Record<string, number> = { PRO: 410, ENTERPRISE: 1435, GROUPS: 2255 };
    const methodName = "💳 Google Pay / Apple Pay";
    
    try {
      const response = await fetch(`http://localhost:${process.env.PORT || 5000}/api/payments/monopay/bot-create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Bot-Token": process.env.TELEGRAM_BOT_TOKEN || "",
        },
        body: JSON.stringify({
          tier,
          period: "monthly",
          tgId
        }),
      });
      
      const data = await response.json();
      if (response.ok && data.pageUrl) {
        const text = `${methodName}\n\n${lang === "uk" ? "Сума" : lang === "ru" ? "Сумма" : "Amount"}: ${uahPrices[tier]} UAH\n\n${lang === "uk" ? "Натисніть кнопку нижче для оплати:" : lang === "ru" ? "Нажмите кнопку ниже для оплаты:" : "Click the button below to pay:"}`;
        
        const keyboard = Markup.inlineKeyboard([
          [Markup.button.url(`💳 ${lang === "uk" ? "Оплатити" : lang === "ru" ? "Оплатить" : "Pay"} ${uahPrices[tier]} UAH`, data.pageUrl)],
          [Markup.button.callback(t(lang, "buttons.back"), `bot_pay_tier_${tier}`)]
        ]);
        
        try {
          await ctx.editMessageText(text, { parse_mode: "Markdown", ...keyboard });
        } catch {
          await ctx.reply(text, { parse_mode: "Markdown", ...keyboard });
        }
      } else {
        const errorText = lang === "uk" ? "❌ Помилка створення платежу. Спробуйте інший спосіб оплати." : lang === "ru" ? "❌ Ошибка создания платежа. Попробуйте другой способ оплаты." : "❌ Payment creation failed. Try another payment method.";
        await ctx.answerCbQuery(errorText, { show_alert: true });
      }
    } catch {
      const errorText = lang === "uk" ? "❌ Помилка з'єднання з платіжною системою." : lang === "ru" ? "❌ Ошибка соединения с платёжной системой." : "❌ Payment system connection error.";
      await ctx.answerCbQuery(errorText, { show_alert: true });
    }
  });

  bot.action(/^bot_pay_method_(PRO|ENTERPRISE|GROUPS)_crypto$/, async (ctx) => {
    const tier = ctx.match[1];
    const tgId = ctx.from!.id.toString();
    const lang = await getLang(tgId);
    
    const usdPrices: Record<string, string> = { PRO: "10", ENTERPRISE: "35", GROUPS: "55" };
    const amount = usdPrices[tier];
    
    userStates.set(tgId, { module: "payment", step: "awaiting_proof", data: { tier, amount } });
    
    const text = `${t(lang, "payment.title", { tier })}\n\n${t(lang, "payment.amount", { amount })}\n\n${t(lang, "payment.address")}\n\n${t(lang, "payment.instructions")}`;
    
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback("📋 " + t(lang, "buttons.copyAddress"), "copy_address")],
      [Markup.button.callback(t(lang, "buttons.back"), `bot_pay_tier_${tier}`)]
    ]);
    
    try {
      await ctx.editMessageText(text, { parse_mode: "Markdown", ...keyboard });
    } catch {
      await ctx.reply(text, { parse_mode: "Markdown", ...keyboard });
    }
  });

  bot.action(/^bot_pay_promo_(PRO|ENTERPRISE|GROUPS)$/, async (ctx) => {
    const tier = ctx.match[1];
    const tgId = ctx.from!.id.toString();
    const lang = await getLang(tgId);
    
    userStates.set(tgId, { module: "promo_payment", step: "input", data: { tier } });
    
    const text = `🎁 *${lang === "uk" ? "Промокод" : lang === "ru" ? "Промокод" : "Promo Code"}*\n\n${lang === "uk" ? "Введіть ваш промокод:" : lang === "ru" ? "Введите ваш промокод:" : "Enter your promo code:"}`;
    
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback(t(lang, "buttons.back"), `bot_pay_tier_${tier}`)]
    ]);
    
    try {
      await ctx.editMessageText(text, { parse_mode: "Markdown", ...keyboard });
    } catch {
      await ctx.reply(text, { parse_mode: "Markdown", ...keyboard });
    }
  });

  bot.action(["buy_pro", "buy_enterprise"], async (ctx) => {
    const tier = ctx.match.input === "buy_pro" ? "PRO" : "ENTERPRISE";
    const tgId = ctx.from!.id.toString();
    const lang = await getLang(tgId);
    
    const uahPrices: Record<string, number> = { PRO: 410, ENTERPRISE: 1435, GROUPS: 2255 };
    const usdPrices: Record<string, number> = { PRO: 10, ENTERPRISE: 35, GROUPS: 55 };
    
    const text = `💳 *${tier}*\n\n${lang === "uk" ? "Сума" : lang === "ru" ? "Сумма" : "Amount"}: ${uahPrices[tier]} UAH (~$${usdPrices[tier]} USD)\n\n${lang === "uk" ? "Оберіть спосіб оплати:" : lang === "ru" ? "Выберите способ оплаты:" : "Select payment method:"}\n\n${lang === "uk" ? "💡 Сума в гривнях (UAH). Ваш банк автоматично конвертує з вашої валюти." : lang === "ru" ? "💡 Сумма в гривнах (UAH). Ваш банк автоматически конвертирует из вашей валюты." : "💡 Amount in UAH. Your bank converts automatically from your currency."}`;
    
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback("💳 Google Pay / Apple Pay", `bot_pay_method_${tier}_monobank`)],
      [Markup.button.callback("💰 Crypto (USDT)", `bot_pay_method_${tier}_crypto`)],
      [Markup.button.callback("🎁 " + (lang === "uk" ? "Промокод" : lang === "ru" ? "Промокод" : "Promo code"), `bot_pay_promo_${tier}`)],
      [Markup.button.callback(t(lang, "buttons.back"), "bot_payment")]
    ]);
    
    try {
      await ctx.editMessageText(text, { parse_mode: "Markdown", ...keyboard });
    } catch {
      await ctx.reply(text, { parse_mode: "Markdown", ...keyboard });
    }
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
      const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await storage.updateUser(user.id, { tier: newTier, requestsLeft: newLimit, subscriptionExpiresAt: expiryDate });
      
      const userLang = getUserLang(user.lang);
      const expiryStr = expiryDate.toLocaleDateString("uk-UA");
      const requestsDisplay = newTier.toUpperCase() === "ENTERPRISE" || newTier.toUpperCase() === "GROUPS" ? "∞" : "50";
      const receiptTexts: Record<string, string> = {
        uk: `🧾 *КВИТАНЦІЯ DARKSHARE*\n━━━━━━━━━━━━━━━━━━━━\n\n✅ Оплату підтверджено!\n\n📦 Тариф: *${newTier}*\n💰 Сума: $${payment.amountUsdt} USDT\n🔢 Запитів: ${requestsDisplay}/день\n📅 Діє до: ${expiryStr}\n🆔 Платіж: #${paymentId}\n\n━━━━━━━━━━━━━━━━━━━━\nДякуємо за довіру! 🙏`,
        ru: `🧾 *КВИТАНЦИЯ DARKSHARE*\n━━━━━━━━━━━━━━━━━━━━\n\n✅ Оплата подтверждена!\n\n📦 Тариф: *${newTier}*\n💰 Сумма: $${payment.amountUsdt} USDT\n🔢 Запросов: ${requestsDisplay}/день\n📅 Действует до: ${expiryStr}\n🆔 Платёж: #${paymentId}\n\n━━━━━━━━━━━━━━━━━━━━\nСпасибо за доверие! 🙏`,
        en: `🧾 *DARKSHARE RECEIPT*\n━━━━━━━━━━━━━━━━━━━━\n\n✅ Payment confirmed!\n\n📦 Plan: *${newTier}*\n💰 Amount: $${payment.amountUsdt} USDT\n🔢 Requests: ${requestsDisplay}/day\n📅 Valid until: ${expiryStr}\n🆔 Payment: #${paymentId}\n\n━━━━━━━━━━━━━━━━━━━━\nThank you for your trust! 🙏`,
        es: `🧾 *RECIBO DARKSHARE*\n━━━━━━━━━━━━━━━━━━━━\n\n✅ ¡Pago confirmado!\n\n📦 Plan: *${newTier}*\n💰 Monto: $${payment.amountUsdt} USDT\n🔢 Solicitudes: ${requestsDisplay}/día\n📅 Válido hasta: ${expiryStr}\n🆔 Pago: #${paymentId}\n\n━━━━━━━━━━━━━━━━━━━━\n¡Gracias por su confianza! 🙏`,
        de: `🧾 *DARKSHARE QUITTUNG*\n━━━━━━━━━━━━━━━━━━━━\n\n✅ Zahlung bestätigt!\n\n📦 Tarif: *${newTier}*\n💰 Betrag: $${payment.amountUsdt} USDT\n🔢 Anfragen: ${requestsDisplay}/Tag\n📅 Gültig bis: ${expiryStr}\n🆔 Zahlung: #${paymentId}\n\n━━━━━━━━━━━━━━━━━━━━\nVielen Dank für Ihr Vertrauen! 🙏`,
      };
      const receiptText = receiptTexts[userLang] || receiptTexts["en"];
      
      try {
        await ctx.telegram.sendMessage(user.tgId, receiptText, {
          parse_mode: "Markdown",
          ...Markup.inlineKeyboard([[Markup.button.callback(t(userLang, "buttons.back"), "back_to_dashboard")]])
        });
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

  bot.command("support", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const lang = await getLang(tgId);
    userStates.set(tgId, { module: "support", step: "name" });
    await ctx.reply(t(lang, "support.askName"), {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([[Markup.button.callback(t(lang, "buttons.cancel"), "back_to_dashboard")]])
    });
  });

  bot.action("open_support", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const lang = await getLang(tgId);
    userStates.set(tgId, { module: "support", step: "name" });
    const text = t(lang, "support.askName");
    const keyboard = Markup.inlineKeyboard([[Markup.button.callback(t(lang, "buttons.cancel"), "back_to_dashboard")]]);
    try {
      await ctx.editMessageText(text, { parse_mode: "Markdown", ...keyboard });
    } catch {
      await ctx.reply(text, { parse_mode: "Markdown", ...keyboard });
    }
  });

  bot.action(/^close_ticket_(\d+)$/, async (ctx) => {
    const tgId = ctx.from!.id.toString();
    if (!isAdmin(tgId)) {
      return ctx.answerCbQuery("⛔ Access denied");
    }
    const ticketId = parseInt(ctx.match[1]);
    try {
      await storage.updateSupportTicketStatus(ticketId, "closed");
      await ctx.answerCbQuery(`✅ Тікет #${ticketId} закрито`);
      await ctx.editMessageText(ctx.callbackQuery.message && 'text' in ctx.callbackQuery.message ? ctx.callbackQuery.message.text + `\n\n✅ Закрито адміном @${ctx.from!.username || '—'}` : `✅ Тікет #${ticketId} закрито`);
    } catch (e) {
      console.error("Failed to close ticket:", e);
      await ctx.answerCbQuery("❌ Помилка закриття тікета");
    }
  });

  bot.action(/^reply_ticket_(\d+)$/, async (ctx) => {
    const tgId = ctx.from!.id.toString();
    if (!isAdmin(tgId)) {
      return ctx.answerCbQuery("⛔ Access denied");
    }
    const ticketId = ctx.match[1];
    await ctx.answerCbQuery(`💬 Відповідайте через email: darkshare.store@gmail.com (тікет #${ticketId})`);
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
        : "5 запитів/день, 1 монітор";
    
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
└ 💳 ${lang === "uk" ? "Залишок" : lang === "ru" ? "Остаток" : "Remaining"}: ${user.requestsLeft ?? 5} ${lang === "uk" ? "запитів" : lang === "ru" ? "запросов" : "requests"}

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
    const detailTierLimits: Record<string, number> = { "FREE": 5, "BASIC": 30, "PRO": 50, "ENTERPRISE": 9999 };
    const detailUserLimit = detailTierLimits[(user?.tier || "FREE").toUpperCase()] || 5;
    const requestsBar = generateProgressBar(user.requestsLeft || 0, detailUserLimit);
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
├ 💳 ${lang === "uk" ? "Запити" : lang === "ru" ? "Запросы" : "Requests"}: ${user.requestsLeft || 0}/${detailUserLimit}
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
    const lang = await getLang(tgId);
    
    if (!isAdmin(tgId)) {
      return ctx.reply(t(lang, "admin.accessDeniedNotAdmin"));
    }
    
    const stats = await storage.getStats();
    const allUsers = await storage.getAllUsers();
    const proCount = allUsers.filter(u => u.tier === "PRO").length;
    const entCount = allUsers.filter(u => u.tier === "ENTERPRISE").length;
    const groupsCount = allUsers.filter(u => u.tier === "GROUPS").length;
    const blockedCount = allUsers.filter(u => u.blocked).length;
    const todayUsers = allUsers.filter(u => {
      if (!u.createdAt) return false;
      const d = new Date(u.createdAt);
      const now = new Date();
      return d.toDateString() === now.toDateString();
    }).length;

    const text = `🛡️ *DARKSHARE Admin Panel*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n\n` +
      `📊 *${lang === "uk" ? "Статистика" : lang === "ru" ? "Статистика" : "Statistics"}*\n` +
      `├ 👥 ${lang === "uk" ? "Всього" : lang === "ru" ? "Всего" : "Total"}: *${stats.totalUsers}*\n` +
      `├ 🆕 ${lang === "uk" ? "Сьогодні" : lang === "ru" ? "Сегодня" : "Today"}: *${todayUsers}*\n` +
      `├ ⭐ PRO: *${proCount}* | 👑 ENT: *${entCount}* | 👥 GRP: *${groupsCount}*\n` +
      `├ 🚫 ${lang === "uk" ? "Заблоковано" : lang === "ru" ? "Заблокировано" : "Blocked"}: *${blockedCount}*\n` +
      `├ 📋 ${lang === "uk" ? "Звіти" : lang === "ru" ? "Отчёты" : "Reports"}: *${stats.totalReports || 0}*\n` +
      `├ 🔍 ${lang === "uk" ? "Перевірок сьогодні" : lang === "ru" ? "Проверок сегодня" : "Checks today"}: *${stats.checksToday || 0}*\n` +
      `├ 👁️ ${lang === "uk" ? "Моніторинг" : lang === "ru" ? "Мониторинг" : "Monitors"}: *${stats.activeWatches}*\n` +
      `└ 💰 ${lang === "uk" ? "Очікують оплати" : lang === "ru" ? "Ожидают оплаты" : "Pending"}: *${stats.pendingPayments || 0}*\n\n` +
      `${t(lang, "admin.selectAction")}`;

    await ctx.reply(text, {
      parse_mode: "Markdown",
      ...getAdminKeyboard(lang)
    });
  });

  bot.action("open_admin_panel", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const lang = await getLang(tgId);
    
    if (!isAdmin(tgId)) {
      return ctx.answerCbQuery(t(lang, "admin.accessDenied"));
    }
    
    const stats = await storage.getStats();
    const allUsers = await storage.getAllUsers();
    const proCount = allUsers.filter(u => u.tier === "PRO").length;
    const entCount = allUsers.filter(u => u.tier === "ENTERPRISE").length;
    const groupsCount = allUsers.filter(u => u.tier === "GROUPS").length;
    const blockedCount = allUsers.filter(u => u.blocked).length;
    const todayUsers = allUsers.filter(u => {
      if (!u.createdAt) return false;
      const d = new Date(u.createdAt);
      const now = new Date();
      return d.toDateString() === now.toDateString();
    }).length;

    const text = `🛡️ *DARKSHARE Admin Panel*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n\n` +
      `📊 *${lang === "uk" ? "Статистика" : lang === "ru" ? "Статистика" : "Statistics"}*\n` +
      `├ 👥 ${lang === "uk" ? "Всього" : lang === "ru" ? "Всего" : "Total"}: *${stats.totalUsers}*\n` +
      `├ 🆕 ${lang === "uk" ? "Сьогодні" : lang === "ru" ? "Сегодня" : "Today"}: *${todayUsers}*\n` +
      `├ ⭐ PRO: *${proCount}* | 👑 ENT: *${entCount}* | 👥 GRP: *${groupsCount}*\n` +
      `├ 🚫 ${lang === "uk" ? "Заблоковано" : lang === "ru" ? "Заблокировано" : "Blocked"}: *${blockedCount}*\n` +
      `├ 📋 ${lang === "uk" ? "Звіти" : lang === "ru" ? "Отчёты" : "Reports"}: *${stats.totalReports || 0}*\n` +
      `├ 🔍 ${lang === "uk" ? "Перевірок сьогодні" : lang === "ru" ? "Проверок сегодня" : "Checks today"}: *${stats.checksToday || 0}*\n` +
      `├ 👁️ ${lang === "uk" ? "Моніторинг" : lang === "ru" ? "Мониторинг" : "Monitors"}: *${stats.activeWatches}*\n` +
      `└ 💰 ${lang === "uk" ? "Очікують оплати" : lang === "ru" ? "Ожидают оплаты" : "Pending"}: *${stats.pendingPayments || 0}*\n\n` +
      `${t(lang, "admin.selectAction")}`;

    await ctx.editMessageText(text, {
      parse_mode: "Markdown",
      ...getAdminKeyboard(lang, "back_to_dashboard")
    });
  });

  bot.action("admin_stats", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const lang = await getLang(tgId);
    
    if (!isAdmin(tgId)) {
      return ctx.answerCbQuery(t(lang, "admin.accessDenied"));
    }
    
    const stats = await storage.getStats();
    const allUsers = await storage.getAllUsers();
    
    const freeUsers = allUsers.filter(u => !u.tier || u.tier === "FREE").length;
    const proUsers = allUsers.filter(u => u.tier === "PRO").length;
    const enterpriseUsers = allUsers.filter(u => u.tier === "ENTERPRISE").length;
    const groupsUsers = allUsers.filter(u => u.tier === "GROUPS").length;
    const blockedUsers = allUsers.filter(u => u.blocked).length;
    
    const totalPaid = proUsers + enterpriseUsers + groupsUsers;
    const conversionRate = allUsers.length > 0 ? ((totalPaid / allUsers.length) * 100).toFixed(1) : "0";
    
    const todayUsers = allUsers.filter(u => {
      if (!u.createdAt) return false;
      const d = new Date(u.createdAt);
      const now = new Date();
      return d.toDateString() === now.toDateString();
    }).length;
    
    const weekUsers = allUsers.filter(u => {
      if (!u.createdAt) return false;
      const d = new Date(u.createdAt).getTime();
      return (Date.now() - d) < 7 * 24 * 60 * 60 * 1000;
    }).length;
    
    const allPayments = await storage.getAllPayments();
    const completedPayments = allPayments.filter(p => p.status === "completed" || p.status === "paid");
    let totalRevenue = 0;
    completedPayments.forEach(p => {
      totalRevenue += parseFloat(p.amountUsdt?.toString() || "0");
    });
    
    const makeBar = (value: number, total: number, length: number = 10): string => {
      if (total === 0) return "░".repeat(length);
      const filled = Math.round((value / total) * length);
      return "█".repeat(Math.min(filled, length)) + "░".repeat(Math.max(length - filled, 0));
    };
    
    const text = `📊 *${lang === "uk" ? "Детальна статистика" : lang === "ru" ? "Подробная статистика" : "Detailed Statistics"}*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n\n` +
      `👥 *${lang === "uk" ? "Користувачі" : lang === "ru" ? "Пользователи" : "Users"}*\n` +
      `├ ${lang === "uk" ? "Всього" : lang === "ru" ? "Всего" : "Total"}: *${allUsers.length}*\n` +
      `├ ${lang === "uk" ? "Сьогодні" : lang === "ru" ? "Сегодня" : "Today"}: +${todayUsers}\n` +
      `├ ${lang === "uk" ? "За тиждень" : lang === "ru" ? "За неделю" : "This week"}: +${weekUsers}\n` +
      `└ 🚫 ${lang === "uk" ? "Заблоковано" : lang === "ru" ? "Заблокировано" : "Blocked"}: ${blockedUsers}\n\n` +
      `⭐ *${lang === "uk" ? "Тарифи" : lang === "ru" ? "Тарифы" : "Tiers"}*\n` +
      `├ 🆓 FREE: ${freeUsers} [${makeBar(freeUsers, allUsers.length)}]\n` +
      `├ ⭐ PRO: ${proUsers} [${makeBar(proUsers, allUsers.length)}]\n` +
      `├ 👑 ENT: ${enterpriseUsers} [${makeBar(enterpriseUsers, allUsers.length)}]\n` +
      `├ 👥 GRP: ${groupsUsers} [${makeBar(groupsUsers, allUsers.length)}]\n` +
      `└ 📈 ${lang === "uk" ? "Конверсія" : lang === "ru" ? "Конверсия" : "Conversion"}: ${conversionRate}%\n\n` +
      `💰 *${lang === "uk" ? "Фінанси" : lang === "ru" ? "Финансы" : "Finances"}*\n` +
      `├ ${lang === "uk" ? "Дохід" : lang === "ru" ? "Доход" : "Revenue"}: $${totalRevenue.toFixed(2)}\n` +
      `├ ${lang === "uk" ? "Оплат" : lang === "ru" ? "Оплат" : "Payments"}: ${completedPayments.length}\n` +
      `└ ${lang === "uk" ? "Очікують" : lang === "ru" ? "Ожидают" : "Pending"}: ${stats.pendingPayments || 0}\n\n` +
      `📋 *${lang === "uk" ? "Активність" : lang === "ru" ? "Активность" : "Activity"}*\n` +
      `├ ${lang === "uk" ? "Звітів" : lang === "ru" ? "Отчётов" : "Reports"}: ${stats.totalReports || 0}\n` +
      `├ ${lang === "uk" ? "Перевірок сьогодні" : lang === "ru" ? "Проверок сегодня" : "Today"}: ${stats.checksToday || 0}\n` +
      `└ ${lang === "uk" ? "Моніторинг" : lang === "ru" ? "Мониторинг" : "Monitors"}: ${stats.activeWatches}`;

    try {
      await ctx.editMessageText(text, {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([
          [Markup.button.callback("🔄 " + (lang === "uk" ? "Оновити" : lang === "ru" ? "Обновить" : "Refresh"), "admin_stats")],
          [Markup.button.callback(t(lang, "admin.back"), "admin_back")]
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
    const lang = await getLang(tgId);
    
    if (!isAdmin(tgId)) {
      return ctx.answerCbQuery(t(lang, "admin.accessDenied"));
    }
    
    const latestUsers = await storage.getLatestUsers(10);
    
    let text = `${t(lang, "admin.last10users")}\n\n`;
    
    if (latestUsers.length === 0) {
      text += t(lang, "admin.noUsersYet");
    } else {
      latestUsers.forEach((u, i) => {
        const escapedUsername = u.username ? u.username.replace(/_/g, "\\_") : "";
        const username = u.username ? `@${escapedUsername}` : "—";
        const blockedIcon = u.blocked ? "🔴" : "🟢";
        const dateLocale = lang === "en" ? "en-US" : lang === "de" ? "de-DE" : lang === "es" ? "es-ES" : lang === "ru" ? "ru-RU" : "uk-UA";
        const date = u.createdAt ? new Date(u.createdAt).toLocaleDateString(dateLocale) : "—";
        text += `${i + 1}. ${blockedIcon} ${username}\n`;
        text += `   ID: ${u.tgId} | ${u.tier} | ${date}\n`;
      });
    }
    
    text += `\n${t(lang, "admin.blockHint")}`;

    try {
      await ctx.editMessageText(text, {
        ...Markup.inlineKeyboard([
          [Markup.button.callback(t(lang, "admin.refresh"), "admin_users")],
          [Markup.button.callback(t(lang, "admin.back"), "admin_back")]
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
    const lang = await getLang(tgId);
    
    if (!isAdmin(tgId)) {
      return ctx.answerCbQuery(t(lang, "admin.accessDenied"));
    }
    
    const pendingPayments = await storage.getPendingPayments();
    
    let text = `${t(lang, "admin.pendingPaymentsTitle")}\n\n`;
    
    if (pendingPayments.length === 0) {
      text += t(lang, "admin.noPendingPayments");
    } else {
      for (const p of pendingPayments) {
        const user = await storage.getUserById(p.userId!);
        const escapedUsername = user?.username ? user.username.replace(/_/g, "\\_") : "";
        const username = user?.username ? `@${escapedUsername}` : user?.tgId || "—";
        const dateLocale = lang === "en" ? "en-US" : lang === "de" ? "de-DE" : lang === "es" ? "es-ES" : lang === "ru" ? "ru-RU" : "uk-UA";
        const date = p.createdAt ? new Date(p.createdAt).toLocaleDateString(dateLocale) : "—";
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
    
    buttons.push([Markup.button.callback(t(lang, "admin.refresh"), "admin_payments")]);
    buttons.push([Markup.button.callback(t(lang, "admin.back"), "admin_back")]);

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
    const lang = await getLang(tgId);
    
    if (!isAdmin(tgId)) {
      return ctx.answerCbQuery(t(lang, "admin.accessDenied"));
    }
    
    userStates.set(tgId, { module: "admin_broadcast", step: "awaiting_message" });
    
    const stats = await storage.getStats();
    
    const text = `${t(lang, "admin.broadcastTitle")}\n\n` +
      `${t(lang, "admin.broadcastInfo", { count: stats.totalUsers })}\n\n` +
      `${t(lang, "admin.broadcastPrompt")}\n` +
      `${t(lang, "admin.markdownSupported")}`;

    await ctx.editMessageText(text, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [Markup.button.callback(t(lang, "admin.cancel"), "admin_back")]
      ])
    });
  });

  bot.action("admin_back", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const lang = await getLang(tgId);
    
    if (!isAdmin(tgId)) {
      return ctx.answerCbQuery(t(lang, "admin.accessDenied"));
    }
    
    userStates.delete(tgId);
    
    const stats = await storage.getStats();
    const allUsers = await storage.getAllUsers();
    const proCount = allUsers.filter(u => u.tier === "PRO").length;
    const entCount = allUsers.filter(u => u.tier === "ENTERPRISE").length;
    const groupsCount = allUsers.filter(u => u.tier === "GROUPS").length;
    const blockedCount = allUsers.filter(u => u.blocked).length;
    const todayUsers = allUsers.filter(u => {
      if (!u.createdAt) return false;
      const d = new Date(u.createdAt);
      const now = new Date();
      return d.toDateString() === now.toDateString();
    }).length;

    const text = `🛡️ *DARKSHARE Admin Panel*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n\n` +
      `📊 *${lang === "uk" ? "Статистика" : lang === "ru" ? "Статистика" : "Statistics"}*\n` +
      `├ 👥 ${lang === "uk" ? "Всього" : lang === "ru" ? "Всего" : "Total"}: *${stats.totalUsers}*\n` +
      `├ 🆕 ${lang === "uk" ? "Сьогодні" : lang === "ru" ? "Сегодня" : "Today"}: *${todayUsers}*\n` +
      `├ ⭐ PRO: *${proCount}* | 👑 ENT: *${entCount}* | 👥 GRP: *${groupsCount}*\n` +
      `├ 🚫 ${lang === "uk" ? "Заблоковано" : lang === "ru" ? "Заблокировано" : "Blocked"}: *${blockedCount}*\n` +
      `├ 📋 ${lang === "uk" ? "Звіти" : lang === "ru" ? "Отчёты" : "Reports"}: *${stats.totalReports || 0}*\n` +
      `├ 🔍 ${lang === "uk" ? "Перевірок сьогодні" : lang === "ru" ? "Проверок сегодня" : "Checks today"}: *${stats.checksToday || 0}*\n` +
      `├ 👁️ ${lang === "uk" ? "Моніторинг" : lang === "ru" ? "Мониторинг" : "Monitors"}: *${stats.activeWatches}*\n` +
      `└ 💰 ${lang === "uk" ? "Очікують оплати" : lang === "ru" ? "Ожидают оплаты" : "Pending"}: *${stats.pendingPayments || 0}*\n\n` +
      `${t(lang, "admin.selectAction")}`;

    await ctx.editMessageText(text, {
      parse_mode: "Markdown",
      ...getAdminKeyboard(lang)
    });
  });

  bot.action("admin_broadcast_confirm", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const lang = await getLang(tgId);
    
    if (!isAdmin(tgId)) {
      return ctx.answerCbQuery(t(lang, "admin.accessDenied"));
    }
    
    const state = userStates.get(tgId);
    if (!state?.data?.message) {
      return ctx.answerCbQuery(t(lang, "admin.messageNotFound"));
    }
    
    const broadcastMessage = state.data.message;
    userStates.delete(tgId);
    
    const allUsers = await storage.getAllUsers();
    let successCount = 0;
    let failCount = 0;
    
    await ctx.editMessageText(t(lang, "admin.broadcastStarted"));
    
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
    
    await ctx.reply(`${t(lang, "admin.broadcastComplete")}\n\n${t(lang, "admin.sent")} ${successCount}\n${t(lang, "admin.errors")} ${failCount}`, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([[Markup.button.callback(t(lang, "admin.back"), "admin_back")]])
    });
  });

  bot.action("admin_broadcast_cancel", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const lang = await getLang(tgId);
    
    if (!isAdmin(tgId)) {
      return ctx.answerCbQuery(t(lang, "admin.accessDenied"));
    }
    
    userStates.delete(tgId);
    await ctx.answerCbQuery(t(lang, "admin.broadcastCancelled"));
    
    const stats = await storage.getStats();
    const allUsers = await storage.getAllUsers();
    const proCount = allUsers.filter(u => u.tier === "PRO").length;
    const entCount = allUsers.filter(u => u.tier === "ENTERPRISE").length;
    const groupsCount = allUsers.filter(u => u.tier === "GROUPS").length;
    const blockedCount = allUsers.filter(u => u.blocked).length;
    const todayUsers = allUsers.filter(u => {
      if (!u.createdAt) return false;
      const d = new Date(u.createdAt);
      const now = new Date();
      return d.toDateString() === now.toDateString();
    }).length;

    const text = `🛡️ *DARKSHARE Admin Panel*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n\n` +
      `📊 *${lang === "uk" ? "Статистика" : lang === "ru" ? "Статистика" : "Statistics"}*\n` +
      `├ 👥 ${lang === "uk" ? "Всього" : lang === "ru" ? "Всего" : "Total"}: *${stats.totalUsers}*\n` +
      `├ 🆕 ${lang === "uk" ? "Сьогодні" : lang === "ru" ? "Сегодня" : "Today"}: *${todayUsers}*\n` +
      `├ ⭐ PRO: *${proCount}* | 👑 ENT: *${entCount}* | 👥 GRP: *${groupsCount}*\n` +
      `├ 🚫 ${lang === "uk" ? "Заблоковано" : lang === "ru" ? "Заблокировано" : "Blocked"}: *${blockedCount}*\n` +
      `├ 📋 ${lang === "uk" ? "Звіти" : lang === "ru" ? "Отчёты" : "Reports"}: *${stats.totalReports || 0}*\n` +
      `├ 🔍 ${lang === "uk" ? "Перевірок сьогодні" : lang === "ru" ? "Проверок сегодня" : "Checks today"}: *${stats.checksToday || 0}*\n` +
      `├ 👁️ ${lang === "uk" ? "Моніторинг" : lang === "ru" ? "Мониторинг" : "Monitors"}: *${stats.activeWatches}*\n` +
      `└ 💰 ${lang === "uk" ? "Очікують оплати" : lang === "ru" ? "Ожидають оплаты" : "Pending"}: *${stats.pendingPayments || 0}*\n\n` +
      `${t(lang, "admin.selectAction")}`;

    await ctx.editMessageText(text, {
      parse_mode: "Markdown",
      ...getAdminKeyboard(lang)
    });
  });

  bot.action(/^admin_block_(\d+)$/, async (ctx) => {
    const adminTgId = ctx.from!.id.toString();
    const lang = await getLang(adminTgId);
    
    if (!isAdmin(adminTgId)) {
      return ctx.answerCbQuery(t(lang, "admin.accessDenied"));
    }
    
    const userId = parseInt(ctx.match[1]);
    const user = await storage.getUserById(userId);
    
    if (!user) {
      return ctx.answerCbQuery(t(lang, "admin.userNotFound", { id: userId.toString() }));
    }
    
    const newBlockedStatus = !user.blocked;
    await storage.updateUser(userId, { blocked: newBlockedStatus });
    
    const statusText = newBlockedStatus ? t(lang, "admin.blocked2") : t(lang, "admin.unblocked");
    await ctx.answerCbQuery(t(lang, "admin.userBlockedStatus", { status: statusText }));
    
    const userLang = await getLang(user.tgId);
    try {
      await ctx.telegram.sendMessage(user.tgId, 
        newBlockedStatus 
          ? t(userLang, "admin.accountBlockedNotify")
          : t(userLang, "admin.accountUnblockedNotify")
      );
    } catch (e) {
      console.log("Failed to notify user about block status:", e);
    }
  });

  bot.action("admin_block_user", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const lang = await getLang(tgId);
    
    if (!isAdmin(tgId)) {
      return ctx.answerCbQuery(t(lang, "admin.accessDenied"));
    }
    
    userStates.set(tgId, { module: "admin_block_user", step: "awaiting_tgid" });
    
    const text = `${t(lang, "admin.toggleBlockTitle")}\n\n${t(lang, "admin.formatHint")}`;

    await ctx.editMessageText(text, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([[Markup.button.callback(t(lang, "admin.cancel"), "admin_back")]])
    });
  });

  bot.action("admin_change_tier", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const lang = await getLang(tgId);
    
    if (!isAdmin(tgId)) {
      return ctx.answerCbQuery(t(lang, "admin.accessDenied"));
    }
    
    userStates.set(tgId, { module: "admin_change_tier", step: "awaiting_tgid" });
    
    const text = `${t(lang, "admin.enterUserIdToChangeTier")}\n\n${t(lang, "admin.formatHint")}`;

    await ctx.editMessageText(text, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([[Markup.button.callback(t(lang, "admin.cancel"), "admin_back")]])
    });
  });

  bot.action(/^admin_set_tier_(\d+)_(\w+)$/, async (ctx) => {
    const adminTgId = ctx.from!.id.toString();
    const lang = await getLang(adminTgId);
    
    if (!isAdmin(adminTgId)) {
      return ctx.answerCbQuery(t(lang, "admin.accessDenied"));
    }
    
    const userId = parseInt(ctx.match[1]);
    const newTier = ctx.match[2];
    
    const user = await storage.getUserById(userId);
    if (!user) {
      return ctx.answerCbQuery(t(lang, "admin.userNotFound", { id: userId.toString() }));
    }
    
    await storage.updateUser(userId, { tier: newTier });
    await ctx.answerCbQuery(t(lang, "admin.tierChangedTo", { tier: newTier }));
    
    const userLang = await getLang(user.tgId);
    try {
      await ctx.telegram.sendMessage(user.tgId, 
        t(userLang, "admin.yourTierChanged", { tier: newTier }),
        { parse_mode: "Markdown" }
      );
    } catch (e) {
      console.log("Failed to notify user about tier change:", e);
    }
    
    const escapedUsername = user.username ? user.username.replace(/_/g, "\\_") : user.tgId;
    const text = `${t(lang, "admin.tierChangedSuccess")}\n\n` +
      `${t(lang, "admin.userLabel")} @${escapedUsername}\n` +
      `${t(lang, "admin.newTierLabel")} ${newTier}`;

    await ctx.editMessageText(text, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([[Markup.button.callback(t(lang, "admin.back"), "admin_back")]])
    });
  });

  bot.action("admin_search_user", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const lang = await getLang(tgId);
    
    if (!isAdmin(tgId)) {
      return ctx.answerCbQuery(t(lang, "admin.accessDenied"));
    }
    
    userStates.set(tgId, { module: "admin_search_user", step: "awaiting_query" });
    
    const text = `${t(lang, "admin.enterSearchQuery")}\n\n${t(lang, "admin.searchHint")}\n\n${t(lang, "admin.searchExample")}`;

    await ctx.editMessageText(text, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([[Markup.button.callback(t(lang, "admin.cancel"), "admin_back")]])
    });
  });

  bot.action("admin_settings", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const lang = await getLang(tgId);
    
    if (!isAdmin(tgId)) {
      return ctx.answerCbQuery(t(lang, "admin.accessDenied"));
    }
    
    const stats = await storage.getStats();
    const allUsers = await storage.getAllUsers();
    const proUsers = allUsers.filter(u => u.tier === "PRO").length;
    const enterpriseUsers = allUsers.filter(u => u.tier === "ENTERPRISE").length;
    const groupsUsers = allUsers.filter(u => u.tier === "GROUPS").length;
    const blockedUsers = allUsers.filter(u => u.blocked).length;
    
    const uptimeMs = process.uptime() * 1000;
    const uptimeHrs = Math.floor(uptimeMs / 3600000);
    const uptimeMins = Math.floor((uptimeMs % 3600000) / 60000);
    
    const text = `⚙️ *${lang === "uk" ? "Налаштування системи" : lang === "ru" ? "Настройки системы" : "System Settings"}*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n\n` +
      `🖥️ *${lang === "uk" ? "Система" : lang === "ru" ? "Система" : "System"}*\n` +
      `├ Uptime: ${uptimeHrs}h ${uptimeMins}m\n` +
      `├ Node: ${process.version}\n` +
      `├ Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB\n` +
      `└ ${lang === "uk" ? "Адмінів" : lang === "ru" ? "Админов" : "Admins"}: ${ADMIN_IDS.length}\n\n` +
      `📊 *${lang === "uk" ? "Ліміти запитів" : lang === "ru" ? "Лимиты запросов" : "Request Limits"}*\n` +
      `├ 🆓 FREE: 5/${lang === "uk" ? "день" : lang === "ru" ? "день" : "day"}\n` +
      `├ ⭐ PRO: 50/${lang === "uk" ? "день" : lang === "ru" ? "день" : "day"}\n` +
      `├ 👑 ENTERPRISE: ${lang === "uk" ? "безлім" : lang === "ru" ? "безлим" : "unlimited"}\n` +
      `└ 👥 GROUPS: ${lang === "uk" ? "безлім" : lang === "ru" ? "безлим" : "unlimited"}\n\n` +
      `💳 *${lang === "uk" ? "Ціни" : lang === "ru" ? "Цены" : "Prices"}*\n` +
      `├ PRO: $10/m (410 UAH)\n` +
      `├ ENTERPRISE: $35/m (1435 UAH)\n` +
      `└ GROUPS: $55/m (2255 UAH)\n\n` +
      `👥 *${lang === "uk" ? "Розподіл тарифів" : lang === "ru" ? "Распределение тарифов" : "Tier Distribution"}*\n` +
      `├ FREE: ${stats.totalUsers - proUsers - enterpriseUsers - groupsUsers}\n` +
      `├ PRO: ${proUsers}\n` +
      `├ ENTERPRISE: ${enterpriseUsers}\n` +
      `├ GROUPS: ${groupsUsers}\n` +
      `└ 🚫 ${lang === "uk" ? "Заблоковано" : lang === "ru" ? "Заблокировано" : "Blocked"}: ${blockedUsers}`;

    await ctx.editMessageText(text, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [Markup.button.callback("🔄 " + (lang === "uk" ? "Оновити" : lang === "ru" ? "Обновить" : "Refresh"), "admin_settings")],
        [Markup.button.callback(t(lang, "admin.back"), "admin_back")]
      ])
    });
  });

  bot.action("admin_online", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const lang = await getLang(tgId);
    
    if (!isAdmin(tgId)) {
      return ctx.answerCbQuery(t(lang, "admin.accessDenied"));
    }
    
    const allUsers = await storage.getAllUsers();
    const now = Date.now();
    const onlineThreshold = 15 * 60 * 1000;
    const dayThreshold = 24 * 60 * 60 * 1000;
    
    const recentUsers = allUsers.filter(u => {
      if (!u.lastLogin) return false;
      const lastActive = new Date(u.lastLogin).getTime();
      return (now - lastActive) < dayThreshold;
    }).sort((a, b) => {
      const aTime = a.lastLogin ? new Date(a.lastLogin).getTime() : 0;
      const bTime = b.lastLogin ? new Date(b.lastLogin).getTime() : 0;
      return bTime - aTime;
    });
    
    const onlineNow = recentUsers.filter(u => {
      const lastActive = new Date(u.lastLogin!).getTime();
      return (now - lastActive) < onlineThreshold;
    });
    
    let text = `📈 *${lang === "uk" ? "Активність користувачів" : lang === "ru" ? "Активность пользователей" : "User Activity"}*\n\n`;
    text += `🟢 ${lang === "uk" ? "Онлайн (15 хв)" : lang === "ru" ? "Онлайн (15 мин)" : "Online (15 min)"}: *${onlineNow.length}*\n`;
    text += `📊 ${lang === "uk" ? "За 24 години" : lang === "ru" ? "За 24 часа" : "Last 24h"}: *${recentUsers.length}*\n\n`;
    
    if (onlineNow.length > 0) {
      text += `🟢 *${lang === "uk" ? "Зараз онлайн:" : lang === "ru" ? "Сейчас онлайн:" : "Currently online:"}*\n`;
      onlineNow.slice(0, 15).forEach((u, i) => {
        const escapedUsername = u.username ? u.username.replace(/_/g, "\\_") : u.tgId;
        const tierEmoji = u.tier === "ENTERPRISE" ? "👑" : u.tier === "PRO" ? "⭐" : "🆓";
        text += `${i + 1}. ${tierEmoji} @${escapedUsername}\n`;
      });
    }
    
    if (recentUsers.length > onlineNow.length) {
      text += `\n📋 *${lang === "uk" ? "Нещодавно активні:" : lang === "ru" ? "Недавно активные:" : "Recently active:"}*\n`;
      recentUsers.filter(u => !onlineNow.includes(u)).slice(0, 10).forEach((u, i) => {
        const escapedUsername = u.username ? u.username.replace(/_/g, "\\_") : u.tgId;
        const tierEmoji = u.tier === "ENTERPRISE" ? "👑" : u.tier === "PRO" ? "⭐" : "🆓";
        const lastTime = u.lastLogin ? new Date(u.lastLogin).toLocaleTimeString() : "?";
        text += `${i + 1}. ${tierEmoji} @${escapedUsername} (${lastTime})\n`;
      });
    }
    
    await ctx.editMessageText(text, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [Markup.button.callback("🔄 " + (lang === "uk" ? "Оновити" : lang === "ru" ? "Обновить" : "Refresh"), "admin_online")],
        [Markup.button.callback(t(lang, "admin.back"), "admin_back")]
      ])
    });
  });

  bot.action(/^admin_user_info_(\d+)$/, async (ctx) => {
    const adminTgId = ctx.from!.id.toString();
    const lang = await getLang(adminTgId);
    
    if (!isAdmin(adminTgId)) {
      return ctx.answerCbQuery(t(lang, "admin.accessDenied"));
    }
    
    const userId = parseInt(ctx.match[1]);
    const user = await storage.getUserById(userId);
    
    if (!user) {
      return ctx.answerCbQuery(t(lang, "admin.userNotFound", { id: userId.toString() }));
    }
    
    const reports = await storage.getReports(user.id);
    const watches = await storage.getWatches(user.id);
    
    const statusEmoji = user.blocked ? "🔴" : "🟢";
    const tierEmoji = user.tier === "ENTERPRISE" ? "👑" : user.tier === "PRO" ? "⭐" : "🆓";
    const dateLocale = lang === "en" ? "en-US" : lang === "de" ? "de-DE" : lang === "es" ? "es-ES" : lang === "ru" ? "ru-RU" : "uk-UA";
    
    const escapedUsername = user.username ? user.username.replace(/_/g, "\\_") : null;
    const text = `${t(lang, "admin.userInfoTitle")}\n\n` +
      `${statusEmoji} *${t(lang, "admin.statusLabel")}* ${user.blocked ? t(lang, "admin.blocked") : t(lang, "admin.active")}\n` +
      `${tierEmoji} *${t(lang, "admin.tierLabel")}* ${user.tier}\n\n` +
      `${t(lang, "admin.data")}\n` +
      `├ ID: \`${user.id}\`\n` +
      `├ TG ID: \`${user.tgId}\`\n` +
      `├ Username: ${escapedUsername ? `@${escapedUsername}` : "—"}\n` +
      `├ ${t(lang, "admin.langLabel")} ${user.lang?.toUpperCase() || "UK"}\n` +
      `├ ${t(lang, "admin.requestsLeft")} ${user.requestsLeft}\n` +
      `├ ${t(lang, "admin.streakLabel")} ${user.streakDays} ${t(lang, "admin.days")}\n` +
      `├ ${t(lang, "admin.refCode")} \`${user.refCode || "—"}\`\n` +
      `├ ${t(lang, "admin.discount")} ${user.discountPct || 0}%\n` +
      `└ ${t(lang, "admin.registrationDate")} ${user.createdAt ? new Date(user.createdAt).toLocaleDateString(dateLocale) : "—"}\n\n` +
      `${t(lang, "admin.activityTitle")}\n` +
      `├ ${t(lang, "admin.reportsLabel")} ${reports.length}\n` +
      `└ ${t(lang, "admin.monitorsLabel")} ${watches.length}`;

    const buttons: any[][] = [];
    
    buttons.push([
      Markup.button.callback(user.blocked ? t(lang, "admin.unblock") : t(lang, "admin.block"), `admin_toggle_block_${user.id}`),
    ]);
    
    buttons.push([
      Markup.button.callback("🆓 FREE", `admin_set_tier_${user.id}_FREE`),
      Markup.button.callback("⭐ PRO", `admin_set_tier_${user.id}_PRO`),
      Markup.button.callback("👑 ENT", `admin_set_tier_${user.id}_ENTERPRISE`),
    ]);
    
    buttons.push([Markup.button.callback(t(lang, "admin.back"), "admin_back")]);

    await ctx.editMessageText(text, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard(buttons)
    });
  });

  bot.action(/^admin_toggle_block_(\d+)$/, async (ctx) => {
    const adminTgId = ctx.from!.id.toString();
    const lang = await getLang(adminTgId);
    
    if (!isAdmin(adminTgId)) {
      return ctx.answerCbQuery(t(lang, "admin.accessDenied"));
    }
    
    const userId = parseInt(ctx.match[1]);
    const user = await storage.getUserById(userId);
    
    if (!user) {
      return ctx.answerCbQuery(t(lang, "admin.userNotFound", { id: userId.toString() }));
    }
    
    const newBlockedStatus = !user.blocked;
    await storage.blockUser(userId, newBlockedStatus);
    
    const statusText = newBlockedStatus ? t(lang, "admin.blocked2") : t(lang, "admin.unblocked");
    await ctx.answerCbQuery(t(lang, "admin.userBlockedStatus", { status: statusText }));
    
    const userLang = await getLang(user.tgId);
    try {
      await ctx.telegram.sendMessage(user.tgId, 
        newBlockedStatus 
          ? t(userLang, "admin.accountBlockedNotify")
          : t(userLang, "admin.accountUnblockedNotify")
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
      const dateLocale = lang === "en" ? "en-US" : lang === "de" ? "de-DE" : lang === "es" ? "es-ES" : lang === "ru" ? "ru-RU" : "uk-UA";
      const escapedUsername = updatedUser.username ? updatedUser.username.replace(/_/g, "\\_") : null;
      
      const text = `${t(lang, "admin.userInfoTitle")}\n\n` +
        `${statusEmoji} *${t(lang, "admin.statusLabel")}* ${updatedUser.blocked ? t(lang, "admin.blocked") : t(lang, "admin.active")}\n` +
        `${tierEmoji} *${t(lang, "admin.tierLabel")}* ${updatedUser.tier}\n\n` +
        `${t(lang, "admin.data")}\n` +
        `├ ID: \`${updatedUser.id}\`\n` +
        `├ TG ID: \`${updatedUser.tgId}\`\n` +
        `├ Username: ${escapedUsername ? `@${escapedUsername}` : "—"}\n` +
        `├ ${t(lang, "admin.langLabel")} ${updatedUser.lang?.toUpperCase() || "UK"}\n` +
        `├ ${t(lang, "admin.requestsLeft")} ${updatedUser.requestsLeft}\n` +
        `├ ${t(lang, "admin.streakLabel")} ${updatedUser.streakDays} ${t(lang, "admin.days")}\n` +
        `├ ${t(lang, "admin.refCode")} \`${updatedUser.refCode || "—"}\`\n` +
        `├ ${t(lang, "admin.discount")} ${updatedUser.discountPct || 0}%\n` +
        `└ ${t(lang, "admin.registrationDate")} ${updatedUser.createdAt ? new Date(updatedUser.createdAt).toLocaleDateString(dateLocale) : "—"}\n\n` +
        `${t(lang, "admin.activityTitle")}\n` +
        `├ ${t(lang, "admin.reportsLabel")} ${reports.length}\n` +
        `└ ${t(lang, "admin.monitorsLabel")} ${watches.length}`;

      const buttons: any[][] = [];
      buttons.push([
        Markup.button.callback(updatedUser.blocked ? t(lang, "admin.unblock") : t(lang, "admin.block"), `admin_toggle_block_${updatedUser.id}`),
      ]);
      buttons.push([
        Markup.button.callback("🆓 FREE", `admin_set_tier_${updatedUser.id}_FREE`),
        Markup.button.callback("⭐ PRO", `admin_set_tier_${updatedUser.id}_PRO`),
        Markup.button.callback("👑 ENT", `admin_set_tier_${updatedUser.id}_ENTERPRISE`),
      ]);
      buttons.push([Markup.button.callback(t(lang, "admin.back"), "admin_back")]);

      await ctx.editMessageText(text, {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard(buttons)
      });
    }
  });

  bot.action("admin_tickets", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const lang = await getLang(tgId);
    
    if (!isAdmin(tgId)) {
      return ctx.answerCbQuery(t(lang, "admin.accessDenied"));
    }
    
    const tickets = await storage.getSupportTickets();
    const openTickets = tickets.filter(tk => tk.status === "open" || tk.status === "pending");
    
    if (openTickets.length === 0) {
      return ctx.editMessageText(t(lang, "admin.ticketsTitle") + "\n\n" + t(lang, "admin.noTickets"), {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([[Markup.button.callback(t(lang, "admin.back"), "admin_back")]])
      });
    }
    
    let text = t(lang, "admin.ticketsTitle") + "\n\n";
    const buttons: any[][] = [];
    
    openTickets.slice(0, 10).forEach((tk, i) => {
      text += `${i + 1}. ${t(lang, "admin.ticketFrom")} ${tk.name || tk.contact || "?"}\n`;
      text += `   ${t(lang, "admin.ticketStatus")} ${tk.status}\n`;
      text += `   ${t(lang, "admin.ticketDate")} ${tk.createdAt ? new Date(tk.createdAt).toLocaleDateString() : "?"}\n\n`;
      buttons.push([
        Markup.button.callback(`#${tk.id} - ${(tk.message || "").slice(0, 20)}...`, `admin_ticket_view_${tk.id}`)
      ]);
    });
    
    buttons.push([Markup.button.callback(t(lang, "admin.back"), "admin_back")]);
    
    await ctx.editMessageText(text, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard(buttons)
    });
  });

  bot.action(/^admin_ticket_view_(\d+)$/, async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const lang = await getLang(tgId);
    
    if (!isAdmin(tgId)) {
      return ctx.answerCbQuery(t(lang, "admin.accessDenied"));
    }
    
    const ticketId = parseInt(ctx.match[1]);
    const ticket = await storage.getTicketById(ticketId);
    
    if (!ticket) {
      return ctx.answerCbQuery("Ticket not found");
    }
    
    const text = t(lang, "admin.ticketsTitle") + "\n\n" +
      `${t(lang, "admin.ticketFrom")} ${ticket.name || ticket.contact || "?"}\n` +
      `${t(lang, "admin.ticketStatus")} ${ticket.status}\n` +
      `${t(lang, "admin.ticketDate")} ${ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : "?"}\n\n` +
      `${t(lang, "admin.ticketMessage")}\n${ticket.message || "—"}` +
      (ticket.adminReply ? `\n\n${t(lang, "admin.ticketReply")} ${ticket.adminReply}` : "");
    
    await ctx.editMessageText(text, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [
          Markup.button.callback(t(lang, "admin.ticketReply"), `admin_ticket_reply_${ticketId}`),
          Markup.button.callback(t(lang, "admin.ticketClose"), `admin_ticket_close_${ticketId}`)
        ],
        [Markup.button.callback(t(lang, "admin.back"), "admin_tickets")]
      ])
    });
  });

  bot.action(/^admin_ticket_reply_(\d+)$/, async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const lang = await getLang(tgId);
    
    if (!isAdmin(tgId)) {
      return ctx.answerCbQuery(t(lang, "admin.accessDenied"));
    }
    
    const ticketId = parseInt(ctx.match[1]);
    userStates.set(tgId, { module: "admin_ticket_reply", step: "awaiting_reply", data: { ticketId } });
    
    await ctx.editMessageText(t(lang, "admin.enterTicketReply"), {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([[Markup.button.callback(t(lang, "admin.cancel"), "admin_tickets")]])
    });
  });

  bot.action(/^admin_ticket_close_(\d+)$/, async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const lang = await getLang(tgId);
    
    if (!isAdmin(tgId)) {
      return ctx.answerCbQuery(t(lang, "admin.accessDenied"));
    }
    
    const ticketId = parseInt(ctx.match[1]);
    const ticket = await storage.getTicketById(ticketId);
    
    await storage.updateSupportTicketStatus(ticketId, "closed");
    await ctx.answerCbQuery(t(lang, "admin.ticketClosed"));
    
    if (ticket?.userId) {
      try {
        const ticketUser = await storage.getUserById(ticket.userId);
        if (ticketUser) {
          await ctx.telegram.sendMessage(ticketUser.tgId, t(lang, "admin.ticketClosed"));
        }
      } catch (e) {
        console.log("Failed to notify user about ticket closure");
      }
    }
    
    const tickets = await storage.getSupportTickets();
    const openTickets = tickets.filter(tk => tk.status === "open" || tk.status === "pending");
    
    if (openTickets.length === 0) {
      return ctx.editMessageText(t(lang, "admin.ticketsTitle") + "\n\n" + t(lang, "admin.noTickets"), {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([[Markup.button.callback(t(lang, "admin.back"), "admin_back")]])
      });
    }
    
    let text = t(lang, "admin.ticketsTitle") + "\n\n";
    const buttons: any[][] = [];
    
    openTickets.slice(0, 10).forEach((tk, i) => {
      text += `${i + 1}. ${t(lang, "admin.ticketFrom")} ${tk.name || tk.contact || "?"}\n`;
      text += `   ${t(lang, "admin.ticketStatus")} ${tk.status}\n\n`;
      buttons.push([
        Markup.button.callback(`#${tk.id} - ${(tk.message || "").slice(0, 20)}...`, `admin_ticket_view_${tk.id}`)
      ]);
    });
    
    buttons.push([Markup.button.callback(t(lang, "admin.back"), "admin_back")]);
    
    await ctx.editMessageText(text, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard(buttons)
    });
  });

  bot.action("admin_revenue", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const lang = await getLang(tgId);
    
    if (!isAdmin(tgId)) {
      return ctx.answerCbQuery(t(lang, "admin.accessDenied"));
    }
    
    const allPayments = await storage.getAllPayments();
    const completed = allPayments.filter(p => p.status === "completed" || p.status === "paid");
    const pending = allPayments.filter(p => p.status === "pending");
    
    let totalRevenue = 0;
    const tierRevenue: Record<string, number> = {};
    const monthlyRevenue: Record<string, number> = {};
    
    completed.forEach(p => {
      const amount = parseFloat(p.amountUsdt?.toString() || "0");
      totalRevenue += amount;
      const tier = p.tier || "UNKNOWN";
      tierRevenue[tier] = (tierRevenue[tier] || 0) + amount;
      if (p.createdAt) {
        const d = new Date(p.createdAt);
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + amount;
      }
    });
    
    let pendingAmount = 0;
    pending.forEach(p => {
      pendingAmount += parseFloat(p.amountUsdt?.toString() || "0");
    });
    
    let text = `💵 *${lang === "uk" ? "Фінансовий звіт" : lang === "ru" ? "Финансовый отчёт" : "Revenue Report"}*\n`;
    text += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    text += `💰 ${lang === "uk" ? "Загальний дохід" : lang === "ru" ? "Общий доход" : "Total revenue"}: *$${totalRevenue.toFixed(2)}*\n`;
    text += `📊 ${lang === "uk" ? "Оплачено" : lang === "ru" ? "Оплачено" : "Completed"}: *${completed.length}*\n`;
    text += `⏳ ${lang === "uk" ? "Очікують" : lang === "ru" ? "Ожидают" : "Pending"}: ${pending.length} (~$${pendingAmount.toFixed(2)})\n\n`;
    
    if (Object.keys(tierRevenue).length > 0) {
      text += `⭐ *${lang === "uk" ? "По тарифах" : lang === "ru" ? "По тарифам" : "By tier"}:*\n`;
      Object.entries(tierRevenue).sort((a, b) => b[1] - a[1]).forEach(([tier, amount]) => {
        text += `├ ${tier}: $${amount.toFixed(2)}\n`;
      });
      text += `\n`;
    }
    
    const sortedMonths = Object.entries(monthlyRevenue).sort((a, b) => b[0].localeCompare(a[0]));
    if (sortedMonths.length > 0) {
      text += `📅 *${lang === "uk" ? "По місяцях" : lang === "ru" ? "По месяцам" : "Monthly"}:*\n`;
      sortedMonths.slice(0, 6).forEach(([month, amount]) => {
        text += `├ ${month}: $${amount.toFixed(2)}\n`;
      });
      text += `\n`;
    }
    
    text += `📋 *${lang === "uk" ? "Останні оплати" : lang === "ru" ? "Последние оплаты" : "Recent payments"}:*\n`;
    completed.slice(0, 5).forEach(p => {
      const date = p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "?";
      text += `├ $${p.amountUsdt} | ${p.tier || "?"} | ${date}\n`;
    });
    
    await ctx.editMessageText(text, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [Markup.button.callback("🔄 " + (lang === "uk" ? "Оновити" : lang === "ru" ? "Обновить" : "Refresh"), "admin_revenue")],
        [Markup.button.callback(t(lang, "admin.back"), "admin_back")]
      ])
    });
  });

  bot.action("admin_reports", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const lang = await getLang(tgId);
    
    if (!isAdmin(tgId)) {
      return ctx.answerCbQuery(t(lang, "admin.accessDenied"));
    }
    
    const latestReports = await storage.getLatestReportsAll(10);
    
    if (!latestReports || latestReports.length === 0) {
      return ctx.editMessageText(t(lang, "admin.reportsTitle") + "\n\n" + t(lang, "admin.noReports"), {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([[Markup.button.callback(t(lang, "admin.back"), "admin_back")]])
      });
    }
    
    let text = t(lang, "admin.reportsTitle") + "\n\n";
    
    text += `${t(lang, "admin.latestReports")}\n`;
    latestReports.forEach((r, i) => {
      const date = r.generatedAt ? new Date(r.generatedAt).toLocaleDateString() : "?";
      text += `${i + 1}. ${r.objectType || "?"} (${date})\n`;
    });
    
    const typeDist: Record<string, number> = {};
    latestReports.forEach(r => {
      const type = r.objectType || "unknown";
      typeDist[type] = (typeDist[type] || 0) + 1;
    });
    
    text += `\n${t(lang, "admin.typeDistribution")}\n`;
    Object.entries(typeDist).forEach(([type, count]) => {
      text += `  ${type}: ${count}\n`;
    });
    
    const topUsers = await storage.getTopUsers(5);
    if (topUsers && topUsers.length > 0) {
      text += `\n${t(lang, "admin.mostActiveUsers")}\n`;
      topUsers.forEach((u, i) => {
        text += `${i + 1}. ${u.username || "?"} - ${u.checksCount} checks\n`;
      });
    }
    
    await ctx.editMessageText(text, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([[Markup.button.callback(t(lang, "admin.back"), "admin_back")]])
    });
  });

  bot.action("admin_coupons", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const lang = await getLang(tgId);
    
    if (!isAdmin(tgId)) {
      return ctx.answerCbQuery(t(lang, "admin.accessDenied"));
    }
    
    const coupons = await storage.getCoupons();
    
    if (!coupons || coupons.length === 0) {
      return ctx.editMessageText(t(lang, "admin.couponsTitle") + "\n\n" + t(lang, "admin.noCoupons"), {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([
          [Markup.button.callback(t(lang, "admin.createCoupon"), "admin_coupon_create")],
          [Markup.button.callback(t(lang, "admin.back"), "admin_back")]
        ])
      });
    }
    
    let text = t(lang, "admin.couponsTitle") + "\n\n";
    const buttons: any[][] = [];
    
    coupons.forEach((c, i) => {
      text += `${i + 1}. ${t(lang, "admin.couponCode")} \`${c.code}\`\n`;
      text += `   ${t(lang, "admin.couponDiscount")} ${c.value}%\n`;
      text += `   ${t(lang, "admin.couponUses")} ${c.usedCount || 0}/${c.maxUses || "inf"}\n`;
      text += `   ${t(lang, "admin.couponExpiry")} ${c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "never"}\n\n`;
      buttons.push([Markup.button.callback(`${t(lang, "admin.deleteCoupon")} ${c.code}`, `admin_coupon_delete_${c.id}`)]);
    });
    
    buttons.push([Markup.button.callback(t(lang, "admin.createCoupon"), "admin_coupon_create")]);
    buttons.push([Markup.button.callback(t(lang, "admin.back"), "admin_back")]);
    
    await ctx.editMessageText(text, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard(buttons)
    });
  });

  bot.action("admin_coupon_create", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const lang = await getLang(tgId);
    
    if (!isAdmin(tgId)) {
      return ctx.answerCbQuery(t(lang, "admin.accessDenied"));
    }
    
    userStates.set(tgId, { module: "admin_coupon_create", step: "awaiting_code" });
    
    await ctx.editMessageText(t(lang, "admin.enterCouponCode"), {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([[Markup.button.callback(t(lang, "admin.cancel"), "admin_coupons")]])
    });
  });

  bot.action(/^admin_coupon_delete_(\d+)$/, async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const lang = await getLang(tgId);
    
    if (!isAdmin(tgId)) {
      return ctx.answerCbQuery(t(lang, "admin.accessDenied"));
    }
    
    const couponId = parseInt(ctx.match[1]);
    await storage.deleteCoupon(couponId);
    await ctx.answerCbQuery(t(lang, "admin.couponDeleted"));
    
    const coupons = await storage.getCoupons();
    
    if (!coupons || coupons.length === 0) {
      return ctx.editMessageText(t(lang, "admin.couponsTitle") + "\n\n" + t(lang, "admin.noCoupons"), {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([
          [Markup.button.callback(t(lang, "admin.createCoupon"), "admin_coupon_create")],
          [Markup.button.callback(t(lang, "admin.back"), "admin_back")]
        ])
      });
    }
    
    let text = t(lang, "admin.couponsTitle") + "\n\n";
    const buttons: any[][] = [];
    
    coupons.forEach((c, i) => {
      text += `${i + 1}. ${t(lang, "admin.couponCode")} \`${c.code}\`\n`;
      text += `   ${t(lang, "admin.couponDiscount")} ${c.value}%\n`;
      text += `   ${t(lang, "admin.couponUses")} ${c.usedCount || 0}/${c.maxUses || "inf"}\n\n`;
      buttons.push([Markup.button.callback(`${t(lang, "admin.deleteCoupon")} ${c.code}`, `admin_coupon_delete_${c.id}`)]);
    });
    
    buttons.push([Markup.button.callback(t(lang, "admin.createCoupon"), "admin_coupon_create")]);
    buttons.push([Markup.button.callback(t(lang, "admin.back"), "admin_back")]);
    
    await ctx.editMessageText(text, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard(buttons)
    });
  });

  bot.action("admin_add_requests", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const lang = await getLang(tgId);
    
    if (!isAdmin(tgId)) {
      return ctx.answerCbQuery(t(lang, "admin.accessDenied"));
    }
    
    userStates.set(tgId, { module: "admin_add_requests", step: "awaiting_tgid" });
    
    await ctx.editMessageText(t(lang, "admin.addRequestsTitle") + "\n\n" + t(lang, "admin.enterTgIdForRequests"), {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([[Markup.button.callback(t(lang, "admin.cancel"), "admin_back")]])
    });
  });

  bot.command("block", async (ctx) => {
    const adminTgId = ctx.from!.id.toString();
    const lang = await getLang(adminTgId);
    
    if (!isAdmin(adminTgId)) {
      return ctx.reply(t(lang, "admin.accessDenied"));
    }
    
    const args = ctx.message.text.split(" ");
    if (args.length < 2) {
      return ctx.reply(t(lang, "admin.blockUsage"));
    }
    
    const targetTgId = args[1];
    const user = await storage.getUserByTgId(targetTgId);
    
    if (!user) {
      return ctx.reply(t(lang, "admin.userNotFound", { id: targetTgId }));
    }
    
    await storage.updateUser(user.id, { blocked: true });
    
    await ctx.reply(t(lang, "admin.userBlockedSuccess", { username: user.username || targetTgId }));
    
    const userLang = await getLang(targetTgId);
    try {
      await ctx.telegram.sendMessage(targetTgId, t(userLang, "admin.accountBlockedNotify"));
    } catch (e) {
      console.log("Failed to notify user about block:", e);
    }
  });

  bot.command("unblock", async (ctx) => {
    const adminTgId = ctx.from!.id.toString();
    const lang = await getLang(adminTgId);
    
    if (!isAdmin(adminTgId)) {
      return ctx.reply(t(lang, "admin.accessDenied"));
    }
    
    const args = ctx.message.text.split(" ");
    if (args.length < 2) {
      return ctx.reply(t(lang, "admin.unblockUsage"));
    }
    
    const targetTgId = args[1];
    const user = await storage.getUserByTgId(targetTgId);
    
    if (!user) {
      return ctx.reply(t(lang, "admin.userNotFound", { id: targetTgId }));
    }
    
    await storage.updateUser(user.id, { blocked: false });
    
    await ctx.reply(t(lang, "admin.userUnblockedSuccess", { username: user.username || targetTgId }));
    
    const userLang = await getLang(targetTgId);
    try {
      await ctx.telegram.sendMessage(targetTgId, t(userLang, "admin.accountUnblockedNotify"));
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
        `${t(lang, "quickCheck.title")}\n\n` +
        `${t(lang, "quickCheck.usage")}\n\n` +
        `${t(lang, "quickCheck.availableTypes")}\n` +
        `• ${t(lang, "quickCheck.typeIp")}\n` +
        `• ${t(lang, "quickCheck.typeWallet")}\n` +
        `• ${t(lang, "quickCheck.typeEmail")}\n` +
        `• ${t(lang, "quickCheck.typePhone")}\n` +
        `• ${t(lang, "quickCheck.typeDomain")}\n` +
        `• ${t(lang, "quickCheck.typeUrl")}\n` +
        `• ${t(lang, "quickCheck.typeUsername")}\n` +
        `• ${t(lang, "quickCheck.typeHash")}\n` +
        `• ${t(lang, "quickCheck.typeCve")}\n\n` +
        `${t(lang, "quickCheck.examples")}\n` +
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
      return ctx.reply(t(lang, "quickCheck.unknownType", { type: checkType, available: validTypes.join(", ") }));
    }
    
    if (!user || user.requestsLeft! <= 0) {
      return ctx.reply(t(lang, "validation.limitReached", { limit: "5" }), 
        Markup.inlineKeyboard([
          [Markup.button.callback(t(lang, "buttons.upgrade"), "upgrade")]
        ])
      );
    }
    
    const processingMsg = await ctx.reply(t(lang, "quickCheck.analyzing", { type: checkType, target }));
    
    try {
      const checkResult = await performCheck(checkType, target);
      await storage.updateUser(user.id, { requestsLeft: Math.max(0, (user.requestsLeft || 0) - 1) });
      
      const riskEmoji = checkResult.riskLevel === "critical" ? "🔴" : 
                        checkResult.riskLevel === "high" ? "🟠" : 
                        checkResult.riskLevel === "medium" ? "🟡" : "🟢";
      
      let result = `${riskEmoji} *${checkType.toUpperCase()} ${t(lang, "quickCheck.analysis")}*\n\n`;
      result += `📌 *${t(lang, "quickCheck.target")}:* \`${target}\`\n`;
      result += `📊 *${t(lang, "quickCheck.risk")}:* ${checkResult.riskScore}/100 (${checkResult.riskLevel.toUpperCase()})\n\n`;
      result += `*${t(lang, "quickCheck.findings")}:*\n`;
      checkResult.findings.slice(0, 5).forEach(f => {
        result += `• ${f}\n`;
      });
      
      if (checkResult.aiInsights) {
        result += `\n🤖 *${t(lang, "quickCheck.aiVerdict")}:* ${checkResult.aiInsights.verdict}\n`;
      }
      
      await ctx.telegram.deleteMessage(ctx.chat!.id, processingMsg.message_id);
      
      await ctx.reply(result, {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([
          [
            Markup.button.callback(t(lang, "buttons.pdf"), `gen_pdf_${checkType}_${target}`),
            Markup.button.callback(t(lang, "buttons.monitoring"), `add_monitor_${checkType}_${target}`)
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
      await ctx.reply(t(lang, "quickCheck.error"));
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
    const myStatsTierLimits: Record<string, number> = { "FREE": 5, "BASIC": 30, "PRO": 50, "ENTERPRISE": 9999 };
    const myStatsUserLimit = myStatsTierLimits[(user?.tier || "FREE").toUpperCase()] || 5;
    text += `🎯 *Запитів залишилось:* ${user.requestsLeft}/${myStatsUserLimit}\n`;
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
      `🌐 Веб-панель: www.darkshare.store`;
    
    await ctx.reply(text, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [Markup.button.callback("🏠 Меню", "dashboard")]
      ])
    });
  });

  bot.catch((err: any, ctx) => {
    if (err?.message?.includes("message is not modified")) {
      return;
    }
    console.error(`Bot error for ${ctx.updateType}:`, err);
  });

  console.log("Starting bot polling...");
  
  let retryCount = 0;
  const maxRetries = 3;
  
  const startBot = () => {
    bot.launch({ dropPendingUpdates: true })
      .catch((err: Error) => {
        console.error("Bot error:", err.message);
        if ((err.message.includes("409") || err.message.includes("Conflict")) && retryCount < maxRetries) {
          retryCount++;
          const delay = 5000 * Math.pow(2, retryCount - 1);
          console.log(`Bot conflict detected, retry ${retryCount}/${maxRetries} in ${delay / 1000}s...`);
          setTimeout(startBot, delay);
        } else if (retryCount >= maxRetries) {
          console.warn("Bot polling failed after max retries. Another instance may be running.");
        }
      });
  };
  
  startBot();

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));

  console.log("Bot is now running and listening for messages!");
  return bot;
}
