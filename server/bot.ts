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
    const refMatch = text.match(/start=ref_(\w+)/);
    const tgId = ctx.from!.id.toString();
    const user = await storage.getUserByTgId(tgId);
    const lang = getUserLang(user?.lang);
    
    const isNewUser = !user?.langSet;
    
    let welcomeText = t(lang, "welcome", { 
      username: ctx.from.first_name || ctx.from.username || "User",
      tgId: tgId 
    });

    if (refMatch) {
      welcomeText += "\n\n" + t(lang, "common.referralBonus");
    }

    if (isNewUser) {
      welcomeText += "\n\n" + t(lang, "common.selectLanguage");
      await ctx.reply(welcomeText, Markup.inlineKeyboard([
        [
          Markup.button.callback("🇺🇦 Українська", "lang_uk"),
          Markup.button.callback("🇬🇧 English", "lang_en"),
          Markup.button.callback("🇷🇺 Русский", "lang_ru")
        ]
      ]));
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

  async function showDashboard(ctx: any, tgId: string, isEdit: boolean = true) {
    const user = await storage.getUserByTgId(tgId);
    const lang = getUserLang(user?.lang);
    userStates.delete(tgId);

    const requestsWarning = user && user.requestsLeft! <= 3 
      ? "\n" + t(lang, "common.lowRequests")
      : '';

    const dashboardText = `${t(lang, "dashboard.title")}

${t(lang, "dashboard.stats", { requestsLeft: user?.requestsLeft?.toString() || "15", requestsLimit: "15" })} (${t(lang, "common.tierFree")})
🔥 ${t(lang, "common.streak")}: ${user?.streakDays} ${t(lang, "common.days")}${requestsWarning}

${t(lang, "common.tipOfDay")}

${t(lang, "dashboard.selectModule")}`;

    const webUrl = "https://fast-telegram-bot2-production.up.railway.app";

    const keyboard = Markup.inlineKeyboard([
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
        Markup.button.callback(t(lang, "buttons.achievements"), "achievements")
      ],
      [
        Markup.button.url("🖥️ " + t(lang, "common.webPanel"), webUrl)
      ]
    ]);

    try {
      if (isEdit) {
        await ctx.editMessageText(dashboardText, keyboard);
      } else {
        await ctx.reply(dashboardText, keyboard);
      }
    } catch {
      await ctx.reply(dashboardText, keyboard);
    }
  }

  bot.action(["dashboard", "back_to_dashboard"], async (ctx) => {
    const tgId = ctx.from!.id.toString();
    await showDashboard(ctx, tgId, true);
  });

  bot.command("menu", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    await showDashboard(ctx, tgId, false);
  });

  const moduleActions = ["mod_ip", "mod_wallet", "mod_phone", "mod_email", "mod_business", "mod_url", "mod_cve", "mod_hash", "mod_username"];
  const moduleMap: Record<string, string> = {
    "mod_ip": "ip",
    "mod_wallet": "wallet", 
    "mod_phone": "phone",
    "mod_email": "email",
    "mod_business": "domain",
    "mod_url": "url",
    "mod_cve": "cve",
    "mod_hash": "hash",
    "mod_username": "username"
  };

  for (const action of moduleActions) {
    bot.action(action, async (ctx) => {
      const tgId = ctx.from!.id.toString();
      const lang = await getLang(tgId);
      const module = moduleMap[action];
      userStates.set(tgId, { module, step: "input" });
      await ctx.reply(t(lang, `modulePrompts.${module}`), 
        Markup.inlineKeyboard([[Markup.button.callback(t(lang, "buttons.cancel"), "back_to_dashboard")]])
      );
    });
  }

  bot.action(["mod_iot", "mod_cloud"], async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const lang = await getLang(tgId);
    await ctx.answerCbQuery(t(lang, "premium.locked"));
    
    const text = t(lang, "common.proOnly");
    
    await ctx.reply(text, 
      Markup.inlineKeyboard([
        [Markup.button.callback(t(lang, "upgrade.buyPro"), "upgrade")],
        [Markup.button.callback(t(lang, "buttons.back"), "back_to_dashboard")]
      ])
    );
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
      return ctx.reply(t(lang, "validation.limitReached", { limit: "15" }), 
        Markup.inlineKeyboard([
          [Markup.button.callback(t(lang, "buttons.upgrade"), "upgrade")],
          [Markup.button.callback(t(lang, "buttons.back"), "back_to_dashboard")]
        ])
      );
    }

    if (!state || !state.module) {
      return ctx.reply(t(lang, "common.useMenu"));
    }

    const inputValue = text.trim();
    
    switch (state.module) {
      case "ip":
        if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(inputValue)) {
          return ctx.reply(t(lang, "validation.invalidIp"));
        }
        break;
      case "wallet":
        if (!inputValue.startsWith("0x") || inputValue.length < 20) {
          return ctx.reply(t(lang, "validation.invalidWallet"));
        }
        break;
      case "email":
        if (!inputValue.includes("@")) {
          return ctx.reply(t(lang, "validation.invalidEmail"));
        }
        break;
    }
    
    let checkResult: CheckResult;
    try {
      const analyzingText = t(lang, "common.analyzing");
      await ctx.reply(analyzingText);
      checkResult = await performCheck(state.module, inputValue);
    } catch (error: any) {
      console.error("Check error:", error);
      return ctx.reply(t(lang, "validation.error", { error: error.message }));
    }
    
    const getRiskEmoji = (level: string) => {
      switch (level) {
        case "low": return "🟢";
        case "medium": return "🟡";
        case "high": return "🔴";
        case "critical": return "⚫";
        default: return "🟡";
      }
    };

    const moduleEmojis: Record<string, string> = {
      ip: "🌐", wallet: "💰", phone: "📱", 
      email: "📧", domain: "🏢", url: "🔗"
    };
    
    const riskEmoji = getRiskEmoji(checkResult.riskLevel);
    const findingsText = checkResult.findings.slice(0, 5).map(f => `• ${f}`).join("\n");
    
    const riskWord = t(lang, "result.risk");
    const findingsWord = t(lang, "result.findings");
    const sourcesWord = t(lang, "result.sources");

    const result = `${moduleEmojis[state.module] || "🔍"} ${checkResult.type.toUpperCase()} ${t(lang, "result.analysis")}: ${checkResult.target.substring(0, 30)}${checkResult.target.length > 30 ? "..." : ""}
${riskEmoji} ${riskWord}: ${checkResult.riskLevel.toUpperCase()} (${checkResult.riskScore}/100)

📋 ${findingsWord}:
${findingsText}

📊 ${sourcesWord}: ${checkResult.sources.join(", ")}`;

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

    await ctx.reply(result, 
      Markup.inlineKeyboard([
        [
          Markup.button.callback(t(lang, "buttons.pdf"), `gen_pdf_${state.module}_${inputValue}`),
          Markup.button.callback(t(lang, "buttons.newCheck"), `mod_${state.module === "domain" ? "business" : state.module}`)
        ],
        [
          Markup.button.callback(t(lang, "buttons.monitoring"), `add_monitor_${state.module}_${inputValue}`),
          Markup.button.callback(t(lang, "buttons.back"), "back_to_dashboard")
        ]
      ])
    );
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

    await ctx.editMessageText(text, 
      Markup.inlineKeyboard([[Markup.button.callback(t(lang, "buttons.back"), "back_to_dashboard")]])
    );
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

    await ctx.editMessageText(text, 
      Markup.inlineKeyboard([[Markup.button.callback(t(lang, "buttons.back"), "back_to_dashboard")]])
    );
  });

  bot.action("settings", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const user = await storage.getUserByTgId(tgId);
    const lang = getUserLang(user?.lang);

    const text = `${t(lang, "settings.title")}\n\n${t(lang, "settings.language", { lang: languageNames[lang] })}\n\n${t(lang, "settings.selectLanguage")}`;

    await ctx.editMessageText(text, Markup.inlineKeyboard([
      [
        Markup.button.callback("🇺🇦 Українська", "set_lang_uk"),
        Markup.button.callback("🇬🇧 English", "set_lang_en"),
        Markup.button.callback("🇷🇺 Русский", "set_lang_ru")
      ],
      [Markup.button.callback(t(lang, "buttons.back"), "back_to_dashboard")]
    ]));
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

    const text = `${t(lang, "referrals.title")}\n\n${t(lang, "referrals.yourCode", { code: user?.refCode || t(lang, "common.na") })}\n${t(lang, "referrals.link", { code: user?.refCode || t(lang, "common.na") })}\n\n${t(lang, "referrals.count", { count: "0" })}\n${t(lang, "referrals.earnings", { amount: "0" })}\n\n${t(lang, "referrals.invite")}`;

    await ctx.editMessageText(text, 
      Markup.inlineKeyboard([
        [Markup.button.url(t(lang, "buttons.share"), `https://t.me/share/url?url=t.me/DARKSHAREN1_BOT?start=ref_${user?.refCode}`)],
        [Markup.button.callback(t(lang, "buttons.back"), "back_to_dashboard")]
      ])
    );
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
    const amount = tier === "PRO" ? "10" : "50";
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
    await ctx.reply(t(lang, "coupon.enter"), 
      Markup.inlineKeyboard([[Markup.button.callback(t(lang, "buttons.back"), "back_to_dashboard")]])
    );
  });

  bot.action("profile", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const user = await storage.getUserByTgId(tgId);
    const lang = getUserLang(user?.lang);
    
    const username = user?.username?.replace(/[_*`\[\]]/g, "\\$&") || "—";
    const refCode = user?.refCode?.replace(/[_*`\[\]]/g, "\\$&") || "—";
    
    const text = `${t(lang, "profile.title")}\n\n` +
      `${t(lang, "profile.tgId")}: ${tgId}\n` +
      `${t(lang, "profile.username")}: @${username}\n` +
      `${t(lang, "profile.tier")}: ${user?.tier || "FREE"}\n` +
      `${t(lang, "profile.requestsLeft")}: ${user?.requestsLeft ?? 15}\n` +
      `${t(lang, "profile.streakDays")}: ${user?.streakDays ?? 0}\n` +
      `${t(lang, "profile.refCode")}: ${refCode}\n\n` +
      `${t(lang, "profile.syncInfo")}`;

    await ctx.editMessageText(text, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([[Markup.button.callback(t(lang, "buttons.back"), "back_to_dashboard")]])
    });
  });

  bot.action("achievements", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const lang = await getLang(tgId);
    
    const text = `${t(lang, "achievements.title")}\n\n${t(lang, "achievements.riskHunter", { count: "0" })}\n${t(lang, "achievements.scamSlayer", { count: "0" })}\n${t(lang, "achievements.streakMaster", { count: "0" })}\n${t(lang, "achievements.referralKing", { count: "0" })}\n\n${t(lang, "achievements.unlock")}`;

    await ctx.editMessageText(text, 
      Markup.inlineKeyboard([[Markup.button.callback(t(lang, "buttons.back"), "back_to_dashboard")]])
    );
  });

  bot.action("history", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const lang = await getLang(tgId);

    const text = `${t(lang, "history.title")}\n\n${t(lang, "history.description")}\n\n${t(lang, "history.empty")}\n\n${t(lang, "history.addMonitor")}`;

    await ctx.editMessageText(text, 
      Markup.inlineKeyboard([[Markup.button.callback(t(lang, "buttons.back"), "back_to_dashboard")]])
    );
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
    
    const text = `📊 *ДЕТАЛЬНА СТАТИСТИКА*\n\n` +
      `👥 *Користувачі:*\n` +
      `├ Всього: ${stats.totalUsers}\n` +
      `├ FREE: ${freeUsers}\n` +
      `├ PRO: ${proUsers}\n` +
      `├ ENTERPRISE: ${enterpriseUsers}\n` +
      `└ Заблоковано: ${blockedUsers}\n\n` +
      `📄 *Звіти:*\n` +
      `├ Всього: ${stats.totalReports || 0}\n` +
      `└ Сьогодні: ${stats.checksToday || 0}\n\n` +
      `👁 *Моніторинг:*\n` +
      `└ Активних: ${stats.activeWatches}\n\n` +
      `💳 *Платежі:*\n` +
      `└ Pending: ${stats.pendingPayments || 0}`;

    await ctx.editMessageText(text, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [Markup.button.callback("🔄 Оновити", "admin_stats")],
        [Markup.button.callback("⬅️ Назад", "admin_back")]
      ])
    });
  });

  bot.action("admin_users", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    
    if (!isAdmin(tgId)) {
      return ctx.answerCbQuery("⛔ Доступ заборонено");
    }
    
    const latestUsers = await storage.getLatestUsers(10);
    
    let text = `👥 *ОСТАННІ 10 КОРИСТУВАЧІВ*\n\n`;
    
    if (latestUsers.length === 0) {
      text += "Користувачів ще немає.";
    } else {
      latestUsers.forEach((u, i) => {
        const username = u.username ? `@${u.username}` : "—";
        const blockedIcon = u.blocked ? "🔴" : "🟢";
        const date = u.createdAt ? new Date(u.createdAt).toLocaleDateString("uk-UA") : "—";
        text += `${i + 1}. ${blockedIcon} ${username}\n`;
        text += `   ID: \`${u.tgId}\` | ${u.tier} | ${date}\n`;
      });
    }
    
    text += `\n_Для блокування відправте ID користувача_`;

    await ctx.editMessageText(text, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [Markup.button.callback("🔄 Оновити", "admin_users")],
        [Markup.button.callback("⬅️ Назад", "admin_back")]
      ])
    });
  });

  bot.action("admin_payments", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    
    if (!isAdmin(tgId)) {
      return ctx.answerCbQuery("⛔ Доступ заборонено");
    }
    
    const pendingPayments = await storage.getPendingPayments();
    
    let text = `💳 *PENDING ПЛАТЕЖІ*\n\n`;
    
    if (pendingPayments.length === 0) {
      text += "Немає pending платежів.";
    } else {
      for (const p of pendingPayments) {
        const user = await storage.getUserById(p.userId!);
        const username = user?.username ? `@${user.username}` : user?.tgId || "—";
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

    await ctx.editMessageText(text, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard(buttons)
    });
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
    
    const text = `✅ *Тариф змінено!*\n\n` +
      `Користувач: @${user.username || user.tgId}\n` +
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
    
    const text = `👤 *ІНФОРМАЦІЯ ПРО КОРИСТУВАЧА*\n\n` +
      `${statusEmoji} *Статус:* ${user.blocked ? "Заблокований" : "Активний"}\n` +
      `${tierEmoji} *Тариф:* ${user.tier}\n\n` +
      `📋 *Дані:*\n` +
      `├ ID: \`${user.id}\`\n` +
      `├ TG ID: \`${user.tgId}\`\n` +
      `├ Username: ${user.username ? `@${user.username}` : "—"}\n` +
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
