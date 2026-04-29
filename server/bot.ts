import { Telegraf, Markup, Context } from "telegraf";
import { IStorage } from "./storage";
import { generateDetailedPDF, generateFindings, generateMetadata } from "./pdfGenerator";
import { performCheck, CheckResult, validateInput, extractExifFromBuffer } from "./checkService";
import { t, Language, languageNames } from "./i18n";
import { generateWireGuardKeyPair, generatePresharedKey, allocatePeerIp, buildPeerConfig, isProTier } from "./vpn";
import { pe, setEmoji, clearEmoji, getMappings, extractCustomEmojis, escHtml, suggestSlotForEmoji } from "./premiumEmoji";
import { generateApiKey } from "./apiV1";

interface BotContext extends Context {}

function escMd(text: string): string {
  return String(text).replace(/[_*`[\]]/g, "\\$&");
}

type BtnStyle = "primary" | "success" | "danger";
function cb(text: string, data: string, style?: BtnStyle, emoji?: string) {
  const btn = Markup.button.callback(text, data) as any;
  if (style) btn.style = style;
  if (emoji) btn.icon_custom_emoji_id = emoji;
  return btn;
}
function urlS(text: string, url: string, style?: BtnStyle, emoji?: string) {
  const btn = Markup.button.url(text, url) as any;
  if (style) btn.style = style;
  if (emoji) btn.icon_custom_emoji_id = emoji;
  return btn;
}

const E = {
  search: "5188217332748527444",
  shield: "5408935401442267103",
  star: "5435957248314579621",
  gear: "5449428597922079323",
  chart: "5431577498364158238",
  lock: "5472308992514464048",
  fire: "5420315771991497307",
  check: "5427009714745517609",
  cross: "5465665476971471368",
  bell: "5242628160297641831",
  money: "5375296873982604963",
  user: "5373012449597335010",
  doc: "5334882760735598374",
  link: "5375129357373165375",
  globe: "5399898266265475100",
  bolt: "5431449001532594346",
  gift: "5199749070830197566",
  crown: "5467406098367521267",
  warn: "5467928559664242360",
  back: "5264727218734524899",
  home: "5465226866321268133",
  msg: "5465300082628763143",
  rocket: "5445284980978621387",
  diamond: "5471952986970267163",
  key: "5330115548900501467",
  clock: "5413704112220949842",
  eye: "5424892643760937442",
  trash: "5433653135799228968",
  card: "5375296873982604963",
  phone: "5407025283456835913",
  mail: "5350421256627838238",
  flag: "5411520005386806155",
  pin: "5431736674147114227",
};

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

  const telegraphUrls: Record<string, string> = {};
  async function createTelegraphPage() {
    try {
      const webUrl = process.env.WEB_DOMAIN || "https://www.darkshare.store";
      const accRes = await fetch("https://api.telegra.ph/createAccount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ short_name: "DARKSHARE", author_name: "DARKSHARE OSINT", author_url: webUrl })
      });
      const accData = await accRes.json() as any;
      if (!accData.ok) { console.error("Telegraph account error:", accData); return; }
      const accessToken = accData.result.access_token;

      const tl = (uk: string, ru: string, en: string, pl: string) => pl === "uk" ? uk : pl === "ru" ? ru : en;

      const buildContent = (pl: string) => {
        return [
        { tag: "h3", children: [tl("🛡 DARKSHARE v4.4 — Професійна OSINT платформа безпеки", "🛡 DARKSHARE v4.4 — Профессиональная OSINT платформа безопасности", "🛡 DARKSHARE v4.4 — Professional Security OSINT Platform", pl)] },
        { tag: "p", children: [{ tag: "b", children: [tl("Комплексна платформа аналізу безпеки для перевірки крипто гаманців, IP адрес, email, телефонів, доменів, URL, CVE вразливостей, хешів файлів, юзернеймів та BIN карток. Доступна як Telegram бот, веб-дашборд та REST API.", "Комплексная платформа анализа безопасности для проверки крипто кошельков, IP адресов, email, телефонов, доменов, URL, CVE уязвимостей, хешей файлов, юзернеймов и BIN карт. Доступна как Telegram бот, веб-дашборд и REST API.", "Comprehensive security intelligence platform for analyzing blockchain wallets, IP addresses, emails, phone numbers, domains, URLs, CVE vulnerabilities, file hashes, usernames, and bank card BINs. Available as Telegram bot, web dashboard, and REST API.", pl)] }] },

        { tag: "h3", children: [tl("📋 Початок роботи", "📋 Начало работы", "📋 Getting Started", pl)] },
        { tag: "p", children: [tl("DARKSHARE доступний трьома способами:", "DARKSHARE доступен тремя способами:", "DARKSHARE is available in three ways:", pl)] },
        { tag: "ul", children: [
          { tag: "li", children: [{ tag: "b", children: ["Telegram Bot"] }, " — @DarkShare1Bot ", tl("для швидких перевірок та inline режиму", "для быстрых проверок и inline режима", "for quick checks and inline mode", pl)] },
          { tag: "li", children: [{ tag: "b", children: [tl("Веб-дашборд", "Веб-дашборд", "Web Dashboard", pl)] }, " — ", { tag: "a", attrs: { href: webUrl }, children: [webUrl] }, tl(" для аналітики, масових перевірок, моніторингу", " для аналитики, массовых проверок, мониторинга", " for full analytics, bulk checks, monitoring", pl)] },
          { tag: "li", children: [{ tag: "b", children: ["REST API"] }, " — ", tl("для інтеграції з вашими системами безпеки та SIEM/SOC", "для интеграции с вашими системами безопасности и SIEM/SOC", "for integration with your security tools and SIEM/SOC", pl)] },
        ]},
        { tag: "p", children: [{ tag: "b", children: [tl("Швидкий старт:", "Быстрый старт:", "Quick start:", pl)] }] },
        { tag: "ul", children: [
          { tag: "li", children: [tl("1. Відкрийте @DarkShare1Bot у Telegram і натисніть /start", "1. Откройте @DarkShare1Bot в Telegram и нажмите /start", "1. Open @DarkShare1Bot in Telegram and press /start", pl)] },
          { tag: "li", children: [tl("2. Увійдіть на ", "2. Войдите на ", "2. Sign in at ", pl), { tag: "a", attrs: { href: webUrl }, children: [webUrl] }, tl(" через Telegram або Google", " через Telegram или Google", " via Telegram or Google", pl)] },
          { tag: "li", children: [tl("3. Оберіть тип перевірки та введіть значення", "3. Выберите тип проверки и введите значение", "3. Choose a check type and enter the target value", pl)] },
          { tag: "li", children: [tl("4. Отримайте детальний звіт з risk score, findings та metadata", "4. Получите детальный отчёт с risk score, findings и metadata", "4. Get a detailed report with risk score, findings, and metadata", pl)] },
        ]},

        { tag: "h3", children: [tl("🔍 Типи перевірок (17 модулів)", "🔍 Типы проверок (17 модулей)", "🔍 Check Types (17 Modules)", pl)] },

        { tag: "p", children: [{ tag: "b", children: ["🌐 IP Address Analysis"] }] },
        { tag: "p", children: ["Geolocation, ISP identification, VPN/proxy/Tor detection, blacklist checks across 80+ databases, ASN info, abuse contact data, hosting provider, risk score assessment."] },
        { tag: "p", children: ["Example: ", { tag: "code", children: ["8.8.8.8"] }] },

        { tag: "p", children: [{ tag: "b", children: ["💰 Crypto Wallet Analysis"] }] },
        { tag: "p", children: ["Support for ETH, BTC, TRX, SOL networks. Balance check, transaction history, mixer/tumbler detection, scam database matching, token holdings, risk assessment, associated addresses."] },
        { tag: "p", children: ["Example: ", { tag: "code", children: ["0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18"] }] },

        { tag: "p", children: [{ tag: "b", children: ["📧 Email OSINT"] }] },
        { tag: "p", children: ["Data breach history (HaveIBeenPwned, Dark Web), MX record validation, SPF/DKIM checks, disposable email detection, linked accounts discovery, compromised password alerts."] },
        { tag: "p", children: ["Example: ", { tag: "code", children: ["user@example.com"] }] },

        { tag: "p", children: [{ tag: "b", children: ["📱 Phone Number Lookup"] }] },
        { tag: "p", children: ["Carrier identification, country/region, line type (mobile/landline/VOIP), spam report count, caller ID data, number format validation."] },
        { tag: "p", children: ["Example: ", { tag: "code", children: ["+380501234567"] }] },

        { tag: "p", children: [{ tag: "b", children: ["🔗 Domain WHOIS & DNS"] }] },
        { tag: "p", children: ["Full WHOIS data, DNS records (A, AAAA, MX, NS, TXT, CNAME), SSL certificate details, domain age, registrar info, nameservers, technology detection."] },
        { tag: "p", children: ["Example: ", { tag: "code", children: ["example.com"] }] },

        { tag: "p", children: [{ tag: "b", children: ["🔍 URL Scanner"] }] },
        { tag: "p", children: ["Phishing detection, malware scan, redirect chain analysis, SSL certificate validation, Google Safe Browsing check, safety score, screenshot capture."] },
        { tag: "p", children: ["Example: ", { tag: "code", children: ["https://suspicious-site.com"] }] },

        { tag: "p", children: [{ tag: "b", children: ["🐛 CVE Vulnerability Lookup"] }] },
        { tag: "p", children: ["Vulnerability details from NVD/MITRE, CVSS v3 score, severity level, affected products/versions, known exploits, patch availability, CWE classification."] },
        { tag: "p", children: ["Example: ", { tag: "code", children: ["CVE-2021-44228"] }] },

        { tag: "p", children: [{ tag: "b", children: ["#️⃣ File Hash Analysis"] }] },
        { tag: "p", children: ["MD5/SHA1/SHA256 hash lookup via VirusTotal. Detection rate across 70+ engines, malware family identification, file metadata, sandbox analysis results."] },
        { tag: "p", children: ["Example: ", { tag: "code", children: ["d41d8cd98f00b204e9800998ecf8427e"] }] },

        { tag: "p", children: [{ tag: "b", children: ["👤 Username OSINT"] }] },
        { tag: "p", children: ["Search across 200+ platforms including social media, forums, dev platforms (GitHub, Reddit, Twitter, Instagram, LinkedIn, etc.). Digital footprint analysis."] },
        { tag: "p", children: ["Example: ", { tag: "code", children: ["johndoe"] }] },

        { tag: "p", children: [{ tag: "b", children: ["💳 Card BIN Lookup"] }] },
        { tag: "p", children: ["Issuing bank identification, country, card type (credit/debit/prepaid), brand (Visa/Mastercard/AmEx), level (Classic/Gold/Platinum/Black)."] },
        { tag: "p", children: ["Example: ", { tag: "code", children: ["424242"] }] },

        { tag: "p", children: [{ tag: "b", children: ["🤖 Bot Token Validator"] }] },
        { tag: "p", children: ["Validate Telegram bot tokens, retrieve bot name, username, capabilities (can_join_groups, supports_inline_queries)."] },

        { tag: "h3", children: [tl("📱 Команди Telegram бота", "📱 Команды Telegram бота", "📱 Telegram Bot Commands", pl)] },
        { tag: "pre", children: ["/start    — Main menu and dashboard\n/menu     — Open control panel\n/check    — Quick check: /check ip 8.8.8.8\n/stats    — Your personal statistics\n/ref      — Referral program\n/help     — Full help & instructions\n/support  — Contact support team"] },

        { tag: "h3", children: [tl("⚡ Inline режим (у будь-якому чаті!)", "⚡ Inline режим (в любом чате!)", "⚡ Inline Mode (Use in Any Chat!)", pl)] },
        { tag: "p", children: ["Type @DarkShare1Bot followed by check type and value directly in any Telegram chat — personal, group, or channel. Results appear as inline messages."] },
        { tag: "pre", children: ["@DarkShare1Bot ip 8.8.8.8\n@DarkShare1Bot email test@mail.com\n@DarkShare1Bot domain google.com\n@DarkShare1Bot wallet 0x742d35Cc...\n@DarkShare1Bot phone +380501234567\n@DarkShare1Bot cve CVE-2021-44228\n@DarkShare1Bot hash d41d8cd98f...\n@DarkShare1Bot username johndoe\n@DarkShare1Bot card 424242\n@DarkShare1Bot url https://site.com"] },
        { tag: "p", children: ["All 17 modules work in inline mode. Each result includes risk score, key findings, and a link to the full report."] },

        { tag: "h3", children: [tl("🖥 Можливості веб-дашборду", "🖥 Возможности веб-дашборда", "🖥 Web Dashboard Features", pl)] },
        { tag: "ul", children: [
          { tag: "li", children: [{ tag: "b", children: ["Quick Check"] }, " — instant analysis from homepage, no registration needed for basic checks (3/day)"] },
          { tag: "li", children: [{ tag: "b", children: ["Dashboard"] }, " — full analytics, check statistics, risk distribution charts, streak tracking, leaderboard"] },
          { tag: "li", children: [{ tag: "b", children: ["Bulk Checks"] }, " — check up to 50 targets at once (paste a list of IPs, emails, or domains)"] },
          { tag: "li", children: [{ tag: "b", children: ["Monitoring 24/7"] }, " — automatic change tracking for domains, IPs, wallets with Telegram notifications"] },
          { tag: "li", children: [{ tag: "b", children: ["PDF Reports"] }, " — generate branded PDF reports with risk score, findings, metadata for clients"] },
          { tag: "li", children: [{ tag: "b", children: ["Check History"] }, " — full history with filtering, search, side-by-side comparison, CSV export"] },
          { tag: "li", children: [{ tag: "b", children: ["Favorites"] }, " — save frequently checked targets for one-click re-analysis"] },
          { tag: "li", children: [{ tag: "b", children: ["Teams"] }, " — create teams, add members, shared access to results, team analytics, team chat"] },
          { tag: "li", children: [{ tag: "b", children: ["Community Chat"] }, " — real-time discussion with other researchers, file/image attachments"] },
          { tag: "li", children: [{ tag: "b", children: ["Dark Web Breach Check"] }, " — check if emails have been compromised in dark web leaks"] },
          { tag: "li", children: [{ tag: "b", children: ["Security Widget"] }, " — embeddable HTML widget for your website showing security status"] },
          { tag: "li", children: [{ tag: "b", children: ["2FA Protection"] }, " — TOTP-based two-factor authentication (Google Authenticator, Authy)"] },
          { tag: "li", children: [{ tag: "b", children: ["Referral Program"] }, " — earn +3 free checks per friend, unique link and QR code"] },
        ]},

        { tag: "h3", children: [tl("🔌 REST API документація", "🔌 REST API документация", "🔌 REST API Documentation", pl)] },
        { tag: "p", children: ["API is available for PRO and ENTERPRISE plans. Authentication via cookie session (login through Telegram or Google first)."] },
        { tag: "p", children: ["Base URL: ", { tag: "code", children: [webUrl] }] },
        { tag: "p", children: [{ tag: "b", children: ["Core Endpoints:"] }] },
        { tag: "pre", children: ["POST /api/check\n  Body: { type: \"ip\"|\"email\"|\"domain\"|..., target: \"8.8.8.8\" }\n  Response: { riskScore, findings[], metadata }\n\nGET /api/reports\n  Response: [{ id, objectType, target, riskScore, generatedAt }]\n\nGET /api/reports/:id\n  Response: { id, objectType, target, riskScore, findings, metadata }\n\nGET /api/reports/:id/pdf\n  Response: PDF file download\n\nPOST /api/bulk-check\n  Body: { type: \"ip\", targets: [\"8.8.8.8\", \"1.1.1.1\"] }\n  Response: { results: [{ target, riskScore, findings }] }\n\nGET /api/watches\n  Response: [{ id, type, target, interval, lastChecked }]\n\nPOST /api/watches\n  Body: { type: \"domain\", target: \"example.com\", interval: \"24h\" }\n\nDELETE /api/watches/:id\n\nGET /api/auth/me\n  Response: { id, username, tier, requestsLeft, subscriptionExpiresAt }\n\nGET /api/stats\n  Response: { totalUsers, totalReports, checksToday, threatsBlocked }\n\nGET /api/activity\n  Response: [{ type, target, riskLevel, timestamp }]\n\nGET /api/threat-feed\n  Response: [{ id, title, severity, type, source, description }]\n\nPOST /api/breach-check\n  Body: { email: \"user@example.com\" }\n  Response: { breached, breaches[], exposedData[] }\n\nGET /api/quick-check?type=ip&target=8.8.8.8\n  (Public, no auth, 3 checks/day per IP)"] },

        { tag: "h3", children: [tl("🛡 Сценарії використання", "🛡 Сценарии использования", "🛡 Use Cases", pl)] },
        { tag: "p", children: [{ tag: "b", children: ["Crypto Security"] }, " — Check wallet addresses before sending crypto. Detect scam wallets, mixers, and suspicious transaction patterns."] },
        { tag: "p", children: [{ tag: "b", children: ["Email Protection"] }, " — Verify email addresses for data breaches. Check if passwords have been compromised. Detect disposable/fake emails."] },
        { tag: "p", children: [{ tag: "b", children: ["Infrastructure Analysis"] }, " — Full domain/IP OSINT: WHOIS, DNS, SSL, technologies. Perfect for pentesting, bug bounty, due diligence."] },
        { tag: "p", children: [{ tag: "b", children: ["Anti-Fraud"] }, " — Verify counterparties, phone numbers, emails, domains before business deals. Reduce fraud risks."] },
        { tag: "p", children: [{ tag: "b", children: ["Threat Intelligence"] }, " — Track CVE vulnerabilities, analyze malware hashes, monitor suspicious URLs. Integrate with SIEM/SOC via API."] },
        { tag: "p", children: [{ tag: "b", children: ["OSINT Intelligence"] }, " — Username search across 200+ platforms, digital footprint analysis, card BIN checks. For journalists and investigators."] },

        { tag: "h3", children: [tl("⭐ Тарифні плани", "⭐ Тарифные планы", "⭐ Subscription Plans", pl)] },
        { tag: "p", children: [{ tag: "b", children: ["🆓 FREE — $0/month"] }] },
        { tag: "ul", children: [
          { tag: "li", children: ["3 free trial checks"] },
          { tag: "li", children: ["Basic analysis"] },
          { tag: "li", children: ["30-day history"] },
          { tag: "li", children: ["1 monitor"] },
          { tag: "li", children: ["Community chat"] },
        ]},
        { tag: "p", children: [{ tag: "b", children: ["⭐ PRO — $10/month"] }] },
        { tag: "ul", children: [
          { tag: "li", children: ["50 checks per day"] },
          { tag: "li", children: ["Full analysis + API access"] },
          { tag: "li", children: ["10 monitors"] },
          { tag: "li", children: ["PDF reports + Bulk checks"] },
          { tag: "li", children: ["Priority support + Inline mode"] },
        ]},
        { tag: "p", children: [{ tag: "b", children: ["👑 ENTERPRISE — $35/month"] }] },
        { tag: "ul", children: [
          { tag: "li", children: ["Unlimited checks + all modules"] },
          { tag: "li", children: ["Unlimited API + 50 monitors"] },
          { tag: "li", children: ["Teams + API Documentation"] },
          { tag: "li", children: ["Security Widget + Personal manager"] },
        ]},
        { tag: "p", children: [{ tag: "b", children: ["👥 GROUPS — $55/month"] }] },
        { tag: "ul", children: [
          { tag: "li", children: ["Everything from Enterprise + up to 10 team members"] },
          { tag: "li", children: ["Team analytics + shared reports + team chat"] },
        ]},
        { tag: "p", children: ["Payment methods: Crypto (TON -5%, USDT, ETH, BTC), MonoPay (Monobank), promo codes."] },

        { tag: "h3", children: [tl("💡 Поради безпеки", "💡 Советы безопасности", "💡 Security Tips", pl)] },
        { tag: "ul", children: [
          { tag: "li", children: ["Always check crypto wallets before sending funds — even from trusted contacts"] },
          { tag: "li", children: ["Verify URLs before entering passwords — phishing sites look identical to originals"] },
          { tag: "li", children: ["Use Bulk mode for mass checking IP/email lists after suspicious activity"] },
          { tag: "li", children: ["Set up monitoring for your critical domains and infrastructure"] },
          { tag: "li", children: ["Enable 2FA to protect your DARKSHARE account"] },
          { tag: "li", children: ["Use inline bot mode for quick checks during client conversations"] },
          { tag: "li", children: ["Export PDF reports for documentation and client reporting"] },
          { tag: "li", children: ["Check new counterparty emails for data breaches before deals"] },
          { tag: "li", children: ["Regularly audit your own emails and domains for compromise"] },
          { tag: "li", children: ["Invite colleagues via referral program — earn bonus checks (+3 per friend)"] },
        ]},

        { tag: "h3", children: [tl("❓ Часті питання", "❓ Частые вопросы", "❓ FAQ", pl)] },
        { tag: "p", children: [{ tag: "b", children: ["How many free checks total?"] }, " — FREE plan: 3 trial checks (lifetime). Earn +5 more via referrals."] },
        { tag: "p", children: [{ tag: "b", children: ["How does inline mode work?"] }, " — In any Telegram chat, type @DarkShare1Bot + check type + value. Result appears as sendable inline message."] },
        { tag: "p", children: [{ tag: "b", children: ["How to pay?"] }, " — Crypto (TON, USDT, ETH, BTC), MonoPay, or promo codes. Available in bot and on website /pricing page."] },
        { tag: "p", children: [{ tag: "b", children: ["Is my data safe?"] }, " — Yes. No raw data stored. Results encrypted. 2FA available. Sessions manageable from Account page."] },
        { tag: "p", children: [{ tag: "b", children: ["What is Bulk mode?"] }, " — Check up to 50 targets at once. Paste a list (one per line) and get a bulk report."] },
        { tag: "p", children: [{ tag: "b", children: ["How does monitoring work?"] }, " — Add targets to monitoring. System auto-checks at chosen intervals (1/6/24h) and notifies via Telegram."] },

        { tag: "p", children: ["—"] },
        { tag: "p", children: [{ tag: "a", attrs: { href: webUrl }, children: [tl("🌐 Відкрити DARKSHARE", "🌐 Открыть DARKSHARE", "🌐 Open DARKSHARE Web Panel", pl)] }, " | ", { tag: "a", attrs: { href: `${webUrl}/guide` }, children: [tl("📖 Повна інструкція", "📖 Полная инструкция", "📖 Full Guide on Website", pl)] }, " | ", { tag: "a", attrs: { href: `${webUrl}/api-docs` }, children: ["📄 API Documentation"] }] },
      ];
      }

      const titles: Record<string, string> = { uk: "DARKSHARE — Інструкція OSINT", ru: "DARKSHARE — Инструкция OSINT", en: "DARKSHARE — Security OSINT Guide" };

      for (const pageLang of ["uk", "ru", "en"]) {
        try {
          const pageRes = await fetch("https://api.telegra.ph/createPage", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              access_token: accessToken,
              title: titles[pageLang] || titles.en,
              author_name: "DARKSHARE",
              author_url: webUrl,
              content: buildContent(pageLang),
              return_content: false
            })
          });
          const pageData = await pageRes.json() as any;
          if (pageData.ok) {
            telegraphUrls[pageLang] = pageData.result.url;
            console.log(`Telegraph page (${pageLang}) created:`, pageData.result.url);
          } else {
            console.error(`Telegraph page error (${pageLang}):`, pageData);
          }
        } catch (e) {
          console.error(`Failed to create Telegraph page (${pageLang}):`, e);
        }
      }
    } catch (err) {
      console.error("Failed to create Telegraph pages:", err);
    }
  }
  createTelegraphPage();

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

  const _userStatesMap = new Map<string, { module?: string; step?: string; data?: any; _ts: number }>();
  const userStates = {
    get: (key: string) => _userStatesMap.get(key),
    set: (key: string, val: any) => { _userStatesMap.set(key, { ...val, _ts: Date.now() }); },
    delete: (key: string) => _userStatesMap.delete(key),
    has: (key: string) => _userStatesMap.has(key),
  };
  const pendingReferrals: Map<string, string> = new Map();

  setInterval(() => {
    const now = Date.now();
    const STALE_MS = 30 * 60 * 1000;
    for (const [key, val] of _userStatesMap) {
      if (now - val._ts > STALE_MS) _userStatesMap.delete(key);
    }
  }, 5 * 60 * 1000);

  async function creditPendingReferral(user: any) {
    if (!user?.pendingRefCode) return;
    try {
      const referrer = await storage.getUserByRefCode(user.pendingRefCode);
      if (referrer && referrer.id !== user.id) {
        await storage.createReferral({
          referrerId: referrer.id,
          referredId: user.id,
          bonus: 5
        });
        await storage.updateUser(user.id, { 
          requestsLeft: (user.requestsLeft || 3) + 5,
          pendingRefCode: null
        });
        await storage.updateUser(referrer.id, {
          requestsLeft: (referrer.requestsLeft || 3) + 2
        });
        console.log(`Referral credited after first check: ${user.pendingRefCode} -> user ${user.id}`);
      } else {
        await storage.updateUser(user.id, { pendingRefCode: null });
      }
    } catch (e) {
      console.log(`Referral credit failed: ${user.pendingRefCode} -> user ${user.id}`, e);
      await storage.updateUser(user.id, { pendingRefCode: null }).catch(() => {});
    }
  }

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
          requestsLeft: 3,
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
      [cb((t(lang, "admin.statsBtn") || "Stats"), "admin_stats", "primary", E.chart),
       cb((t(lang, "admin.usersBtn") || "Users"), "admin_users", "primary", E.user)],
      [cb((t(lang, "admin.searchBtn") || "Search"), "admin_search_user", "primary", E.search),
       cb((t(lang, "admin.paymentsBtn") || "Payments"), "admin_payments", "success", E.money)],
      [cb((t(lang, "admin.ticketsBtn") || "Tickets"), "admin_tickets", "primary", E.msg),
       cb((t(lang, "admin.couponsBtn") || "Coupons"), "admin_coupons", "success", E.gift)],
      [cb((t(lang, "admin.revenueBtn") || "Revenue"), "admin_revenue", "success", E.chart),
       cb((t(lang, "admin.reportsBtn") || "Reports"), "admin_reports", "primary", E.doc)],
      [cb((t(lang, "admin.broadcastBtn") || "Broadcast"), "admin_broadcast", "primary", E.bell),
       cb((lang === "uk" ? "Авторозсилка" : lang === "ru" ? "Авторассылка" : "Auto Mail"), "admin_daily_broadcast", "success", E.clock)],
      [cb((t(lang, "admin.blockingBtn") || "Block"), "admin_block_user", "danger", E.cross),
       cb((t(lang, "admin.addReqBtn") || "Add Req"), "admin_add_requests", "success", E.check)],
      [cb((t(lang, "admin.tiersBtn") || "Tiers"), "admin_change_tier", "primary", E.star),
       cb((lang === "uk" ? "Онлайн" : lang === "ru" ? "Онлайн" : "Online"), "admin_online", "primary", E.globe)],
      [cb((t(lang, "admin.settingsBtn") || "Settings"), "admin_settings", "primary", E.gear)],
      [Markup.button.url("🌐 " + (lang === "uk" ? "Веб-адмінка" : lang === "ru" ? "Веб-админка" : "Web Admin"), (process.env.WEB_DOMAIN || "https://www.darkshare.store") + "/admin")],
      [cb((t(lang, "admin.exitBtn") || "Exit"), exitAction, "danger", E.back)]
    ]);
  }

  bot.command("start", async (ctx) => {
    const text = ctx.message.text;
    // Match both /start ref_CODE and /start=ref_CODE formats
    const refMatch = text.match(/(?:start\s+ref_|start=ref_)([A-Z0-9-]+)/i);
    const starsMatch = text.match(/(?:start\s+stars_|start=stars_)(PRO|ENTERPRISE|GROUPS)_(\d+)/i);
    const tgId = ctx.from!.id.toString();
    let user = await storage.getUserByTgId(tgId);
    const lang = getUserLang(user?.lang);
    
    const isNewUser = !user?.langSet;
    
    // Process referral code if present
    if (refMatch && refMatch[1]) {
      const refCode = refMatch[1].toUpperCase();
      console.log(`Processing referral code: ${refCode}`);
      
      const referrer = await storage.getUserByRefCode(refCode);
      if (referrer && referrer.id !== user?.id) {
        if (isNewUser) {
          pendingReferrals.set(tgId, refCode);
          console.log(`Referral deferred until language selection: ${refCode} -> ${tgId}`);
        } else if (user) {
          try {
            await storage.createReferral({
              referrerId: referrer.id,
              referredId: user.id,
              bonus: 5
            });
            await storage.updateUser(user.id, { 
              requestsLeft: (user.requestsLeft || 3) + 5
            });
            await storage.updateUser(referrer.id, {
              requestsLeft: (referrer.requestsLeft || 3) + 2
            });
            user = await storage.getUserByTgId(tgId);
            console.log(`Referral processed: ${refCode} -> ${tgId}`);
          } catch (e) {
            console.log(`Referral already exists or failed: ${refCode} -> ${tgId}`);
          }
        }
      }
    }
    
    if (starsMatch && user) {
      const starsTier = starsMatch[1].toUpperCase();
      const requestedStars = parseInt(starsMatch[2]);
      
      const canonicalStarPrices: Record<string, Record<string, number>> = {
        PRO: { monthly: 500, yearly: 5000 },
        ENTERPRISE: { monthly: 1750, yearly: 17500 },
        GROUPS: { monthly: 2750, yearly: 27500 },
      };
      
      if (["PRO", "ENTERPRISE", "GROUPS"].includes(starsTier) && canonicalStarPrices[starsTier]) {
        const monthlyPrice = canonicalStarPrices[starsTier].monthly;
        const yearlyPrice = canonicalStarPrices[starsTier].yearly;
        const isYearly = requestedStars > monthlyPrice && requestedStars <= yearlyPrice;
        const canonicalPrice = isYearly ? yearlyPrice : monthlyPrice;
        const period = isYearly ? "yearly" : "monthly";
        const periodDays = isYearly ? 365 : 30;

        const validAmount = (requestedStars > 0 && requestedStars <= canonicalPrice) ? requestedStars : canonicalPrice;
        
        try {
          const payment = await storage.createPayment({
            userId: user.id,
            tier: starsTier,
            amountUsdt: String(validAmount),
            txHash: null,
            status: "pending",
          });

          const periodLabel = isYearly
            ? (lang === "uk" ? "рік" : lang === "ru" ? "год" : "year")
            : (lang === "uk" ? "30 днів" : lang === "ru" ? "30 дней" : "30 days");
          const titles: Record<string, string> = {
            uk: `DARKSHARE ${starsTier} — Підписка (${periodLabel})`,
            ru: `DARKSHARE ${starsTier} — Подписка (${periodLabel})`,
            en: `DARKSHARE ${starsTier} — Subscription (${periodLabel})`,
            es: `DARKSHARE ${starsTier} — Suscripción (${periodLabel})`,
            de: `DARKSHARE ${starsTier} — Abonnement (${periodLabel})`,
          };
          const descriptions: Record<string, string> = {
            uk: `${starsTier} тариф на ${periodLabel}. Після оплати тариф активується автоматично!`,
            ru: `${starsTier} тариф на ${periodLabel}. После оплаты тариф активируется автоматически!`,
            en: `${starsTier} plan for ${periodLabel}. Plan activates automatically after payment!`,
            es: `Plan ${starsTier} por ${periodLabel}. ¡Se activa automáticamente!`,
            de: `${starsTier} Tarif für ${periodLabel}. Wird automatisch aktiviert!`,
          };

          await ctx.sendInvoice({
            title: titles[lang] || titles["en"],
            description: descriptions[lang] || descriptions["en"],
            payload: JSON.stringify({ paymentId: payment.id, userId: user.id, tier: starsTier, period, periodDays }),
            provider_token: "",
            currency: "XTR",
            prices: [{ label: `${starsTier} Plan (${period})`, amount: validAmount }],
          });
          return;
        } catch (err) {
          console.error("Stars deep link payment error:", err);
        }
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
            cb("🇺🇦 Українська", "lang_uk", "primary", E.globe),
            cb("🇬🇧 English", "lang_en", "primary", E.globe),
            cb("🇷🇺 Русский", "lang_ru", "primary", E.globe)
          ],
          [
            cb("🇪🇸 Español", "lang_es", "primary", E.globe),
            cb("🇩🇪 Deutsch", "lang_de", "primary", E.globe)
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
            cb("🇺🇦 Українська", "lang_uk", "primary", E.globe),
            cb("🇬🇧 English", "lang_en", "primary", E.globe),
            cb("🇷🇺 Русский", "lang_ru", "primary", E.globe)
          ],
          [
            cb("🇪🇸 Español", "lang_es", "primary", E.globe),
            cb("🇩🇪 Deutsch", "lang_de", "primary", E.globe)
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
    let user = await storage.getUserByTgId(tgId);
    if (user) {
      await storage.updateUser(user.id, { lang: langCode, langSet: true });
    }

    const pendingRefCode = pendingReferrals.get(tgId);
    if (pendingRefCode && user) {
      pendingReferrals.delete(tgId);
      await storage.updateUser(user.id, { pendingRefCode: pendingRefCode });
      console.log(`Referral saved to DB, will credit after first check: ${pendingRefCode} -> ${tgId}`);
    }

    await ctx.answerCbQuery(t(langCode, "settings.languageChanged"));
    
    const startText = t(langCode, "common.languageSet");
    
    await ctx.editMessageText(startText, 
      Markup.inlineKeyboard([[cb(langCode === "uk" ? "Увійти в панель" : langCode === "ru" ? "Войти в панель" : langCode === "es" ? "Entrar al panel" : langCode === "de" ? "Panel öffnen" : "Enter Panel", "enter_panel_first", "success", E.rocket)]])
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

    const requestsLeft = user?.requestsLeft ?? 3;
    const tierLimits: Record<string, number> = {
      "FREE": 3,
      "BASIC": 30,
      "PRO": 50,
      "ENTERPRISE": 999999,
      "GROUPS": 999999,
    };
    const requestsLimit = tierLimits[(user?.tier || "FREE").toUpperCase()] || 3;
    const progressBar = generateProgressBar(requestsLeft, requestsLimit);
    const lastActivity = formatLastActivity(user?.lastLogin, lang);

    const tierName = user?.tier || "FREE";
    const tierSlot = user?.tier === "ENTERPRISE" ? "crown" : user?.tier === "PRO" ? "diamond" : "star";

    const dashTier = (user?.tier || "FREE").toUpperCase();
    const dashUnlimited = dashTier === "ENTERPRISE" || dashTier === "GROUPS";
    const requestsWarning = dashUnlimited ? ''
      : requestsLeft <= 1 
      ? `\n${pe("warning")} ` + escHtml(t(lang, "common.lowRequests"))
      : requestsLeft <= 0
      ? `\n${pe("cross")} ` + escHtml(lang === "uk" ? "Ліміт вичерпано" : lang === "ru" ? "Лимит исчерпан" : "Limit exceeded")
      : '';

    const systemStatus = dashUnlimited ? "✅ UNLIMITED" : requestsLeft <= 0 ? "⚠️ LIMITED" : requestsLeft <= 1 ? "⚡ LOW" : "✅ READY";
    
    const greetName = escHtml(user?.username || (lang === "uk" ? "Користувач" : lang === "ru" ? "Пользователь" : "User"));
    const tierLabel = tierName === "FREE" ? (lang === "uk" ? "Безкоштовний" : lang === "ru" ? "Бесплатный" : "Free") :
                      tierName === "PRO" ? "PRO" : tierName === "ENTERPRISE" ? "Enterprise" : tierName;
    const statusSlot = dashUnlimited ? "low_risk" : requestsLeft <= 0 ? "high_risk" : requestsLeft <= 1 ? "med_risk" : "low_risk";

    const dashboardText = `${pe("shield")} <b>DARKSHARE</b> — Risk Intelligence

${escHtml(lang === "uk" ? "Привіт" : lang === "ru" ? "Привет" : "Hi")}, <b>${greetName}</b>! ${pe("wave")}

${pe("chart")} <b>${escHtml(lang === "uk" ? "Статус" : lang === "ru" ? "Статус" : "Status")}</b>
├ ${pe(tierSlot)} ${escHtml(lang === "uk" ? "Тариф" : lang === "ru" ? "Тариф" : "Plan")}: <b>${escHtml(tierLabel)}</b>
├ ${pe(statusSlot)} ${escHtml(lang === "uk" ? "Перевірок" : lang === "ru" ? "Проверок" : "Checks")}: <b>${requestsLeft}</b> / ${requestsLimit}
├ <code>${progressBar}</code>
├ ${pe("fire")} ${escHtml(lang === "uk" ? "Серія" : lang === "ru" ? "Серия" : "Streak")}: <b>${user?.streakDays || 0}</b> ${escHtml(lang === "uk" ? "днів" : lang === "ru" ? "дней" : "days")}
└ ${pe("clock") || "🕐"} ${escHtml(lastActivity)}${requestsWarning}${(() => {
  if (user?.subscriptionExpiresAt && tierName !== "FREE") {
    const expDate = new Date(user.subscriptionExpiresAt);
    const daysLeft = Math.max(0, Math.ceil((expDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
    const expStr = expDate.toLocaleDateString(lang === "uk" ? "uk-UA" : lang === "ru" ? "ru-RU" : "en-US", { day: "numeric", month: "short" });
    const slot = daysLeft <= 0 ? "high_risk" : daysLeft <= 7 ? "warning" : "pin";
    const label = daysLeft <= 0 
      ? (lang === "uk" ? "Підписка закінчилась!" : lang === "ru" ? "Подписка истекла!" : "Subscription expired!")
      : `${daysLeft} ${lang === "uk" ? "дн. до" : lang === "ru" ? "дн. до" : "days until"} ${expStr}`;
    return `\n${pe(slot)} ${escHtml(label)}`;
  }
  return "";
})()}

${pe("bulb")} ${escHtml(lang === "uk" ? "Натисни «Перевірка» для початку аналізу" : lang === "ru" ? "Нажми «Проверка» для начала анализа" : "Press «Check» to start analysis")}`;

    const webUrl = process.env.WEB_DOMAIN || "https://www.darkshare.store";

    const keyboardRows: any[][] = [
      [cb(t(lang, "buttons.check"), "check_all", "primary", E.search)],
      [
        cb(t(lang, "buttons.profile"), "profile", "primary", E.user),
        cb(t(lang, "buttons.upgrade"), "upgrade", "success", E.star)
      ],
      [
        cb(t(lang, "buttons.referrals"), "referrals", "success", E.link),
        cb(t(lang, "buttons.history"), "history", "primary", E.clock)
      ],
      [
        cb(t(lang, "buttons.monitoring"), "monitoring", "primary", E.eye),
        cb(t(lang, "support.command"), "open_support", "primary", E.msg)
      ],
      [
        cb((lang === "uk" ? "VPN" : lang === "ru" ? "VPN" : lang === "es" ? "VPN" : lang === "de" ? "VPN" : "VPN") + " ✨", "vpn_menu", "success", E.shield),
        cb((lang === "uk" ? "Інструкція" : lang === "ru" ? "Инструкция" : lang === "es" ? "Guía" : lang === "de" ? "Anleitung" : "Guide"), "open_guide", "primary", E.doc),
      ],
      [
        cb((lang === "uk" ? "🔌 API" : lang === "ru" ? "🔌 API" : lang === "es" ? "🔌 API" : lang === "de" ? "🔌 API" : "🔌 API"), "open_api", "primary", E.lock),
        cb((lang === "uk" ? "Оновити" : lang === "ru" ? "Обновить" : lang === "es" ? "Actualizar" : lang === "de" ? "Aktualisieren" : "Refresh"), "refresh_dashboard", "danger", E.bolt)
      ],
      [
        urlS(t(lang, "common.webPanel"), webUrl, "primary", E.globe),
        urlS((lang === "uk" ? "Додаток" : lang === "ru" ? "Приложение" : lang === "es" ? "App" : lang === "de" ? "App" : "App"), `${webUrl}/download`, "success", E.phone)
      ]
    ];
    
    if (isAdmin(tgId)) {
      keyboardRows.push([cb("ADMIN PANEL", "open_admin_panel", "danger", E.crown)]);
    }
    
    const keyboard = Markup.inlineKeyboard(keyboardRows);

    const safeText = dashboardText.length > 4000 ? dashboardText.substring(0, 3990) + '...' : dashboardText;

    try {
      if (isEdit) {
        await ctx.editMessageText(safeText, { parse_mode: "HTML", ...keyboard });
      } else {
        await ctx.reply(safeText, { parse_mode: "HTML", ...keyboard });
      }
    } catch {
      await ctx.reply(safeText, { parse_mode: "HTML", ...keyboard });
    }
  }

  bot.action("check_all", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const lang = await getLang(tgId);

    const text = `${pe("search")} <b>${escHtml(t(lang, "dashboard.selectModule"))}</b>\n\n${escHtml(lang === "uk" ? "Оберіть тип перевірки:" : lang === "ru" ? "Выберите тип проверки:" : "Select check type:")}`;
    const keyboard = Markup.inlineKeyboard([
      [
        cb(t(lang, "modules.ip"), "mod_ip", "primary", E.globe),
        cb(t(lang, "modules.wallet"), "mod_wallet", "primary", E.money),
        cb(t(lang, "modules.email"), "mod_email", "primary", E.mail)
      ],
      [
        cb(t(lang, "modules.phone"), "mod_phone", "primary", E.phone),
        cb(t(lang, "modules.domain"), "mod_business", "primary", E.globe),
        cb(t(lang, "modules.url"), "mod_url", "primary", E.globe)
      ],
      [
        cb(t(lang, "modules.cve"), "mod_cve", "primary", E.warn),
        cb(t(lang, "modules.hash"), "mod_hash", "primary", E.key),
        cb(t(lang, "modules.username"), "mod_username", "primary", E.user)
      ],
      [
        cb(t(lang, "modules.card"), "mod_card", "primary", E.card),
        cb(t(lang, "modules.bot") || "🤖 Bot Token", "mod_bot", "primary", E.shield),
        cb(t(lang, "modules.password"), "mod_password", "primary", E.key)
      ],
      [
        cb(t(lang, "modules.dns"), "mod_dns", "primary", E.globe),
        cb(t(lang, "modules.ssl"), "mod_ssl", "primary", E.shield),
        cb(t(lang, "modules.mac"), "mod_mac", "primary", E.bolt)
      ],
      [
        cb("📸 EXIF", "mod_exif", "primary", E.doc),
        cb("🗺 GEOINT", "mod_geoint", "primary", E.globe)
      ],
      [cb(t(lang, "buttons.back"), "back_to_dashboard", "danger", E.back)]
    ]);
    try {
      await ctx.editMessageText(text, { parse_mode: "HTML", ...keyboard });
    } catch {
      await ctx.reply(text, { parse_mode: "HTML", ...keyboard });
    }
  });

  bot.action("cat_network", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const lang = await getLang(tgId);
    const text = `${pe("globe")} <b>${escHtml(lang === "uk" ? "Мережа & Web" : lang === "ru" ? "Сеть & Web" : "Network & Web")}</b>\n\n${escHtml(lang === "uk" ? "Оберіть модуль перевірки:" : lang === "ru" ? "Выберите модуль проверки:" : "Select check module:")}`;
    const keyboard = Markup.inlineKeyboard([
      [
        cb(t(lang, "modules.ip"), "mod_ip", "primary", E.globe),
        cb(t(lang, "modules.domain"), "mod_business", "primary", E.globe),
        cb(t(lang, "modules.url"), "mod_url", "primary", E.globe)
      ],
      [
        cb(t(lang, "modules.dns"), "mod_dns", "primary", E.globe),
        cb(t(lang, "modules.ssl"), "mod_ssl", "primary", E.shield),
        cb(t(lang, "modules.mac"), "mod_mac", "primary", E.bolt)
      ],
      [cb(t(lang, "buttons.back"), "back_to_dashboard", "danger", E.back)]
    ]);
    try {
      await ctx.editMessageText(text, { parse_mode: "HTML", ...keyboard });
    } catch {
      await ctx.reply(text, { parse_mode: "HTML", ...keyboard });
    }
  });

  bot.action("cat_finance", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const lang = await getLang(tgId);
    const text = `${pe("money")} <b>${escHtml(lang === "uk" ? "Крипто & Фінанси" : lang === "ru" ? "Крипто & Финансы" : "Crypto & Finance")}</b>\n\n${escHtml(lang === "uk" ? "Оберіть модуль перевірки:" : lang === "ru" ? "Выберите модуль проверки:" : "Select check module:")}`;
    const keyboard = Markup.inlineKeyboard([
      [
        cb(t(lang, "modules.wallet"), "mod_wallet", "primary", E.money),
        cb(t(lang, "modules.card"), "mod_card", "primary", E.card)
      ],
      [cb(t(lang, "buttons.back"), "back_to_dashboard", "danger", E.back)]
    ]);
    try {
      await ctx.editMessageText(text, { parse_mode: "HTML", ...keyboard });
    } catch {
      await ctx.reply(text, { parse_mode: "HTML", ...keyboard });
    }
  });

  bot.action("cat_osint", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const lang = await getLang(tgId);
    const text = `${pe("search")} <b>OSINT</b>\n\n${escHtml(lang === "uk" ? "Оберіть модуль перевірки:" : lang === "ru" ? "Выберите модуль проверки:" : "Select check module:")}`;
    const keyboard = Markup.inlineKeyboard([
      [
        cb(t(lang, "modules.email"), "mod_email", "primary", E.mail),
        cb(t(lang, "modules.phone"), "mod_phone", "primary", E.phone)
      ],
      [
        cb(t(lang, "modules.username"), "mod_username", "primary", E.user),
        cb(t(lang, "modules.bot") || "🤖 Bot Token", "mod_bot", "primary", E.shield)
      ],
      [cb(t(lang, "buttons.back"), "back_to_dashboard", "danger", E.back)]
    ]);
    try {
      await ctx.editMessageText(text, { parse_mode: "HTML", ...keyboard });
    } catch {
      await ctx.reply(text, { parse_mode: "HTML", ...keyboard });
    }
  });

  bot.action("cat_security", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const lang = await getLang(tgId);
    const text = `${pe("shield")} <b>${escHtml(lang === "uk" ? "Безпека" : lang === "ru" ? "Безопасность" : "Security")}</b>\n\n${escHtml(lang === "uk" ? "Оберіть модуль перевірки:" : lang === "ru" ? "Выберите модуль проверки:" : "Select check module:")}`;
    const keyboard = Markup.inlineKeyboard([
      [
        cb(t(lang, "modules.cve"), "mod_cve", "primary", E.warn),
        cb(t(lang, "modules.hash"), "mod_hash", "primary", E.key),
        cb(t(lang, "modules.password"), "mod_password", "primary", E.key)
      ],
      [
        cb(t(lang, "modules.iot"), "mod_iot", "primary", E.bolt),
        cb(t(lang, "modules.cloud"), "mod_cloud", "primary", E.globe)
      ],
      [cb(t(lang, "buttons.back"), "back_to_dashboard", "danger", E.back)]
    ]);
    try {
      await ctx.editMessageText(text, { parse_mode: "HTML", ...keyboard });
    } catch {
      await ctx.reply(text, { parse_mode: "HTML", ...keyboard });
    }
  });

  bot.action("enter_panel_first", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const lang = await getLang(tgId);
    await showDashboard(ctx, tgId, true);

    const welcomeName = escHtml(ctx.from!.first_name || ctx.from!.username || (lang === "uk" ? "друже" : lang === "ru" ? "друг" : lang === "es" ? "amigo" : lang === "de" ? "Freund" : "friend"));
    const titleStr = lang === "uk" ? "Вітаємо в DARKSHARE!"
      : lang === "ru" ? "Добро пожаловать в DARKSHARE!"
      : lang === "es" ? "¡Bienvenido a DARKSHARE!"
      : lang === "de" ? "Willkommen bei DARKSHARE!"
      : "Welcome to DARKSHARE!";
    const helloStr = lang === "uk" ? "Привіт" : lang === "ru" ? "Привет" : lang === "es" ? "Hola" : lang === "de" ? "Hallo" : "Hi";
    const promoStr = lang === "uk" ? "Твій промокод"
      : lang === "ru" ? "Твой промокод"
      : lang === "es" ? "Tu código promocional"
      : lang === "de" ? "Dein Promo-Code"
      : "Your promo code";
    const offStr = lang === "uk" ? "на будь-який тариф"
      : lang === "ru" ? "на любой тариф"
      : lang === "es" ? "en cualquier plan"
      : lang === "de" ? "auf jeden Tarif"
      : "on any plan";
    const freeStr = lang === "uk" ? "У тебе <b>5 безкоштовних перевірок</b>!"
      : lang === "ru" ? "У тебя <b>5 бесплатных проверок</b>!"
      : lang === "es" ? "¡Tienes <b>5 verificaciones gratuitas</b>!"
      : lang === "de" ? "Du hast <b>5 kostenlose Prüfungen</b>!"
      : "You have <b>5 free checks</b>!";

    const welcomeText = `${pe("party")} <b>${escHtml(titleStr)}</b>\n\n${pe("wave")} ${escHtml(helloStr)}, <b>${welcomeName}</b>!\n\n${pe("gift")} ${escHtml(promoStr)}: <code>DARKNEU</code> — <b>-50%</b> ${escHtml(offStr)}!\n${pe("rocket")} ${freeStr}`;

    try {
      await bot.telegram.sendMessage(tgId, welcomeText, {
        parse_mode: "HTML",
        ...Markup.inlineKeyboard([
          [cb(lang === "uk" ? "💎 Активувати промокод" : lang === "ru" ? "💎 Активировать промокод" : lang === "es" ? "💎 Activar código" : lang === "de" ? "💎 Code aktivieren" : "💎 Activate promo", "pricing", "success", E.gift)],
        ])
      });
    } catch (e) {
      console.log(`[Welcome Bot] Failed to send welcome to ${tgId}:`, e);
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

  /* ───────── Premium emoji admin commands ───────── */

  // Persistent capture mode set — while admin's tg_id is here, every message
  // they send (text with premium emojis OR a sticker) is parsed and IDs returned.
  const emojiCaptureMode = new Set<string>();

  function formatCaptureReply(captured: ReturnType<typeof extractCustomEmojis>): string {
    const lines = captured.map((c, i) => {
      const slot = c.suggestedSlot ? `(slot: \`${c.suggestedSlot}\`)` : "(no slot match — pick manually)";
      return `${i + 1}. ${c.fallback}  →  \`${c.customEmojiId}\`  ${slot}`;
    });
    const setLines = captured.map((c) => {
      const slot = c.suggestedSlot || "<slot>";
      return `\`/setemoji ${slot} ${c.customEmojiId} ${c.fallback}\``;
    });
    return (
      `🎨 *Знайдено ${captured.length} преміум-емодзі:*\n\n` +
      lines.join("\n") +
      `\n\n*Швидке прив'язування — копіюй та виконуй:*\n` +
      setLines.join("\n")
    );
  }

  bot.command("emojiid", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    if (!isAdmin(tgId)) {
      return ctx.reply(
        `🚫 Команда лише для адмінів.\nВаш Telegram ID: \`${tgId}\`\n` +
          `Поточні адміни: \`${ADMIN_IDS.join(", ")}\`\n\n` +
          `Якщо ви адмін — додайте свій ID у змінну середовища ADMIN_IDS.`,
        { parse_mode: "Markdown" },
      );
    }

    const args = ctx.message.text.split(/\s+/).slice(1);
    const sub = (args[0] || "").toLowerCase();

    // Explicit on/off toggle
    if (sub === "on" || sub === "start") {
      emojiCaptureMode.add(tgId);
      return ctx.reply(
        "🟢 *Capture mode ON.*\n\n" +
          "Тепер шли мені:\n" +
          "• Повідомлення з преміум-емодзі (просто 🛡🔥💎 у тексті)\n" +
          "• Преміум-стікери (sticker-pack або custom_emoji-стікери)\n\n" +
          "На кожне я поверну `custom_emoji_id` + готову команду `/setemoji`.\n\n" +
          "Вимкнути: `/emojiid off`",
        { parse_mode: "Markdown" },
      );
    }
    if (sub === "off" || sub === "stop") {
      emojiCaptureMode.delete(tgId);
      return ctx.reply("🔴 Capture mode OFF.");
    }

    // 1) Reply to a message with premium emojis
    const replied = (ctx.message as any).reply_to_message;
    let captured: ReturnType<typeof extractCustomEmojis> = [];
    if (replied && (replied.text || replied.caption)) {
      const text = replied.text || replied.caption || "";
      const entities = replied.entities || replied.caption_entities;
      captured = extractCustomEmojis(text, entities);
    } else {
      // 2) Inline emojis in the same message
      const text = ctx.message.text || "";
      const entities = (ctx.message as any).entities || [];
      captured = extractCustomEmojis(text, entities);
    }

    // 3) If admin replied to a sticker
    if (!captured.length && replied?.sticker) {
      const s = replied.sticker;
      const fallback = s.emoji || "⭐";
      const sId = s.custom_emoji_id || s.file_unique_id;
      return ctx.reply(
        `🎨 *Sticker info:*\n` +
          `Emoji: ${fallback}\n` +
          `\`custom_emoji_id\`: ${s.custom_emoji_id ? `\`${s.custom_emoji_id}\`` : "_(this is a regular sticker, not a premium custom emoji — only premium custom emojis can be embedded in messages)_"}\n` +
          `\`file_id\`: \`${s.file_id}\`\n` +
          `\`set_name\`: \`${s.set_name || "—"}\`\n` +
          (s.custom_emoji_id
            ? `\n*Швидке прив'язування:*\n\`/setemoji <slot> ${s.custom_emoji_id} ${fallback}\``
            : ""),
        { parse_mode: "Markdown" },
      );
    }

    if (!captured.length) {
      // Auto-enable capture mode for convenience
      emojiCaptureMode.add(tgId);
      return ctx.reply(
        "🎨 *Premium emoji capture* — режим увімкнено автоматично.\n\n" +
          "Тепер просто шли мені:\n" +
          "• Преміум-емодзі в тексті: `🛡🔥💎` (з твого преміум-набору)\n" +
          "• Або преміум-стікер (тільки `custom_emoji`-тип містить ID)\n\n" +
          "На кожне я поверну `custom_emoji_id`.\n\n" +
          "Вимкнути: `/emojiid off`",
        { parse_mode: "Markdown" },
      );
    }

    await ctx.reply(formatCaptureReply(captured), { parse_mode: "Markdown" });
  });

  // Sticker handler — when admin sends a sticker, return its custom_emoji_id (if any)
  bot.on("sticker", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    if (!isAdmin(tgId)) return;
    if (!emojiCaptureMode.has(tgId)) return;

    const s = (ctx.message as any).sticker;
    if (!s) return;
    const fallback = s.emoji || "⭐";
    if (s.custom_emoji_id) {
      const slot = suggestSlotForEmoji(fallback);
      return ctx.reply(
        `🎨 *Premium custom emoji captured:*\n\n` +
          `Emoji: ${fallback}\n` +
          `\`custom_emoji_id\`: \`${s.custom_emoji_id}\`\n` +
          `Suggested slot: \`${slot || "<pick>"}\`\n\n` +
          `*Швидке прив'язування:*\n\`/setemoji ${slot || "<slot>"} ${s.custom_emoji_id} ${fallback}\``,
        { parse_mode: "Markdown" },
      );
    }
    // Regular sticker — no premium emoji ID, just info
    return ctx.reply(
      `ℹ️ Це звичайний *стікер*, а не преміум-емодзі.\n` +
        `Преміум-емодзі — це ті, які ти набираєш у текст з клавіатури (тип \`custom_emoji\`).\n\n` +
        `Sticker info:\n` +
        `\`file_id\`: \`${s.file_id}\`\n` +
        `\`set_name\`: \`${s.set_name || "—"}\`\n` +
        `Emoji label: ${fallback}`,
      { parse_mode: "Markdown" },
    );
  });

  bot.command("setemoji", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    if (!isAdmin(tgId)) return;
    const args = ctx.message.text.split(/\s+/).slice(1);
    if (args.length < 2) {
      return ctx.reply(
        "Usage: `/setemoji <slot> <custom_emoji_id> [fallback]`\n" +
        "Example: `/setemoji shield 5368324170671202286 🛡`",
        { parse_mode: "Markdown" },
      );
    }
    const [slot, id, ...rest] = args;
    if (!/^\d{6,}$/.test(id)) {
      return ctx.reply("`custom_emoji_id` має бути числом (6+ цифр).", { parse_mode: "Markdown" });
    }
    const fallback = rest.join(" ").trim() || undefined;
    const bound = setEmoji(slot, id, fallback);
    await ctx.reply(
      `✅ Slot <b>${escHtml(slot)}</b> bound:\n` +
      `Premium: <tg-emoji emoji-id="${bound.id}">${escHtml(bound.fallback)}</tg-emoji>\n` +
      `Fallback: ${escHtml(bound.fallback)}\n` +
      `ID: <code>${bound.id}</code>`,
      { parse_mode: "HTML" },
    );
  });

  bot.command("clearemoji", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    if (!isAdmin(tgId)) return;
    const args = ctx.message.text.split(/\s+/).slice(1);
    if (!args[0]) return ctx.reply("Usage: `/clearemoji <slot>`", { parse_mode: "Markdown" });
    const ok = clearEmoji(args[0]);
    await ctx.reply(ok ? `🧹 Cleared slot \`${args[0]}\`` : `❓ Slot \`${args[0]}\` not found.`, { parse_mode: "Markdown" });
  });

  bot.command("listemojis", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    if (!isAdmin(tgId)) return;
    const map = getMappings();
    const entries = Object.entries(map);
    const bound = entries.filter(([, v]) => v.id);
    const unbound = entries.filter(([, v]) => !v.id);

    const renderLine = (slot: string, v: typeof map[string]) => {
      const visual = v.id
        ? `<tg-emoji emoji-id="${v.id}">${escHtml(v.fallback)}</tg-emoji>`
        : escHtml(v.fallback);
      return `${visual}  <b>${escHtml(slot)}</b>  <i>${escHtml(v.description || "")}</i>`;
    };

    const isPremium = (ctx.from as any)?.is_premium === true;
    const lines: string[] = [];
    lines.push(`<b>🎨 Premium emojis (${bound.length}/${entries.length} bound)</b>`);
    lines.push("");
    lines.push(
      isPremium
        ? "✅ <i>Ваш Telegram має Premium — преміум-емодзі будуть відображатись як кольорові/анімовані.</i>"
        : "⚠️ <i>У вашого Telegram-акаунта НЕМАЄ Premium-підписки — нижче ви побачите лише звичайний фолбек-юнікод. Це обмеження Telegram, не баг бота. Преміум-емодзі бачать ТІЛЬКИ користувачі з активним Telegram Premium.</i>"
    );
    lines.push("");
    if (bound.length) {
      lines.push("<b>Bound:</b>");
      for (const [slot, v] of bound) lines.push(renderLine(slot, v));
      lines.push("");
    }
    if (unbound.length) {
      lines.push(`<b>Unbound (${unbound.length}):</b>`);
      for (const [slot, v] of unbound) lines.push(renderLine(slot, v));
    }
    lines.push("");
    lines.push("Use <code>/emojiid</code> to capture IDs, then <code>/setemoji &lt;slot&gt; &lt;id&gt;</code>.");
    lines.push("Use <code>/testemojis</code> for a compact visual self-test.");

    // Telegram message limit ~4096 chars — chunk if needed
    const text = lines.join("\n");
    const CHUNK = 3800;
    if (text.length <= CHUNK) {
      await ctx.reply(text, { parse_mode: "HTML" });
    } else {
      for (let i = 0; i < text.length; i += CHUNK) {
        await ctx.reply(text.slice(i, i + CHUNK), { parse_mode: "HTML" });
      }
    }
  });

  bot.command("testemojis", async (ctx) => {
    // Public diagnostic — no admin gate. Helps any user verify if their
    // Telegram client renders premium custom emojis (requires Telegram Premium).
    const map = getMappings();
    const bound = Object.entries(map).filter(([, v]) => v.id);
    const isPremium = (ctx.from as any)?.is_premium === true;

    const header = isPremium
      ? "✅ <b>Ваш Telegram = Premium</b>\nЯкщо нижче бачите анімовані/кольорові — все ОК.\nЯкщо бачите звичайні емодзі — ID невалідні."
      : "⚠️ <b>Ваш Telegram БЕЗ Premium</b>\nВи фізично не побачите преміум-емодзі — лише фолбек.\nДля перевірки роботи ID — потрібен акаунт із Telegram Premium.";

    const visualRow = bound
      .map(([, v]) => `<tg-emoji emoji-id="${v.id}">${escHtml(v.fallback)}</tg-emoji>`)
      .join(" ");

    const fallbackRow = bound.map(([, v]) => v.fallback).join(" ");

    const text =
      `${header}\n\n` +
      `<b>Premium-рендер (${bound.length} слотів):</b>\n${visualRow}\n\n` +
      `<b>Фолбек-юнікод (як бачить non-Premium):</b>\n${escHtml(fallbackRow)}`;

    await ctx.reply(text, { parse_mode: "HTML" });
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

    const tierSlot = user.tier === "ENTERPRISE" ? "crown" : user.tier === "PRO" ? "diamond" : "star";
    const statsTierLimits: Record<string, number> = { "FREE": 3, "BASIC": 30, "PRO": 50, "ENTERPRISE": 999999, "GROUPS": 999999 };
    const statsUserLimit = statsTierLimits[(user?.tier || "FREE").toUpperCase()] || 3;
    const requestsBar = generateProgressBar(user.requestsLeft || 0, statsUserLimit);
    const streakBar = generateProgressBar(Math.min(user.streakDays || 0, 30), 30);
    
    const joinDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString(lang === "en" ? "en-US" : "uk-UA") : "—";
    const lastActive = formatLastActivity(user.lastLogin, lang);

    const statsText = `${pe("chart")} <b>${escHtml(t(lang, "common.stats"))}</b>
━━━━━━━━━━━━━━━━━━━━

${pe("user")} <b>${escHtml(t(lang, "common.profile"))}</b>
• ID: <code>${escHtml(user.tgId)}</code>
• Username: @${escHtml(user.username || "—")}
• ${pe(tierSlot)} ${escHtml(t(lang, "common.tier"))}: <b>${escHtml(user.tier || "FREE")}</b>
• ${pe("pin")} ${escHtml(joinDate)}

${pe("chart")} <b>${escHtml(t(lang, "common.activity"))}</b>
• ${pe("search")} ${escHtml(t(lang, "common.checks"))}: <b>${reports.length}</b>
• ${pe("eye")} ${escHtml(t(lang, "buttons.monitoring"))}: <b>${watches.length}</b>
• ${pe("people")} ${escHtml(t(lang, "buttons.referrals"))}: <b>${referralStats.count}</b>
• ${pe("zap")} ${escHtml(lastActive)}

${pe("rocket_up")} <b>${escHtml(t(lang, "common.progress"))}</b>
• ${pe("chart")} ${escHtml(requestsBar)} <b>${user.requestsLeft || 0}/${statsUserLimit}</b>
• ${pe("fire")} ${escHtml(streakBar)} <b>${user.streakDays || 0}/30</b> ${escHtml(t(lang, "common.days"))}

${pe("trophy")} <b>${escHtml(t(lang, "buttons.achievements"))}</b>
${reports.length >= 10 ? pe("check") : "⬜"} ${pe("trophy")} 10+
${reports.length >= 50 ? pe("check") : "⬜"} ${pe("shield")} 50+
${(user.streakDays || 0) >= 7 ? pe("check") : "⬜"} ${pe("fire")} 7d
${referralStats.count >= 5 ? pe("check") : "⬜"} ${pe("people")} 5+`;

    await ctx.reply(statsText, {
      parse_mode: "HTML",
      ...Markup.inlineKeyboard([
        [cb(t(lang, "buttons.newCheck"), "dashboard", "primary", E.search)],
        [cb(t(lang, "buttons.referrals"), "referrals", "success", E.link)],
        [cb(t(lang, "buttons.back"), "back_to_dashboard", "danger", E.back)]
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
    
    const botUsername = (await bot.telegram.getMe()).username || "DarkShare1Bot";
    const shareText = `🔍 ${t(lang, "share.checked")}:\n${module.toUpperCase()}: ${target.substring(0, 30)}...\n\n🤖 ${t(lang, "share.tryIt")}: @${botUsername}`;
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(`https://t.me/${botUsername}`)}&text=${encodeURIComponent(shareText)}`;
    
    await ctx.answerCbQuery(t(lang, "share.sharing"));
    await ctx.reply(`${pe("rocket_up")} <b>${escHtml(t(lang, "share.title"))}:</b>\n\n${escHtml(t(lang, "share.clickBelow"))}`, {
      parse_mode: "HTML",
      ...Markup.inlineKeyboard([
        [urlS(t(lang, "buttons.share"), shareUrl, "success", E.link)],
        [cb(t(lang, "buttons.back"), "back_to_dashboard", "danger", E.back)]
      ])
    });
  });

  const moduleActions = ["mod_ip", "mod_wallet", "mod_phone", "mod_email", "mod_business", "mod_url", "mod_cve", "mod_hash", "mod_username", "mod_card", "mod_bot", "mod_password", "mod_dns", "mod_ssl", "mod_mac"];
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
    "mod_bot": "bot",
    "mod_password": "password",
    "mod_dns": "dns",
    "mod_ssl": "ssl",
    "mod_mac": "mac"
  };

  for (const action of moduleActions) {
    bot.action(action, async (ctx) => {
      const tgId = ctx.from!.id.toString();
      const lang = await getLang(tgId);
      const module = moduleMap[action];
      userStates.set(tgId, { module, step: "input" });
      const text = t(lang, `modulePrompts.${module}`);
      const keyboard = Markup.inlineKeyboard([[cb(t(lang, "buttons.cancel"), "back_to_dashboard", "danger", E.back)]]);
      try {
        await ctx.editMessageText(text, { parse_mode: "Markdown", ...keyboard });
      } catch {
        await ctx.reply(text, { parse_mode: "Markdown", ...keyboard });
      }
    });
  }

  bot.action("mod_exif", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const lang = await getLang(tgId);
    const user = await storage.getUserByTgId(tgId);
    const userTier = (user?.tier || "FREE").toUpperCase();
    if (userTier === "FREE") {
      return ctx.answerCbQuery(t(lang, "exif.proRequired"), { show_alert: true });
    }
    userStates.set(tgId, { module: "exif", step: "input" });
    const text = `📸 *EXIF ${lang === "uk" ? "Аналіз метаданих" : lang === "ru" ? "Анализ метаданных" : "Metadata Analysis"}*\n\n${lang === "uk" ? "Надішліть фото для аналізу EXIF-метаданих.\n\n🔍 Аналізуємо: GPS, камера, дата, програмне забезпечення" : lang === "ru" ? "Отправьте фото для анализа EXIF-метаданных.\n\n🔍 Анализируем: GPS, камера, дата, программное обеспечение" : "Send a photo to analyze EXIF metadata.\n\n🔍 We analyze: GPS, camera, date, software"}`;
    const keyboard = Markup.inlineKeyboard([[cb(t(lang, "buttons.cancel"), "back_to_dashboard", "danger", E.back)]]);
    try {
      await ctx.editMessageText(text, { parse_mode: "Markdown", ...keyboard });
    } catch {
      await ctx.reply(text, { parse_mode: "Markdown", ...keyboard });
    }
  });

  bot.action("mod_geoint", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const lang = await getLang(tgId);
    let text = `🗺 *GEOINT ${lang === "uk" ? "Довідник" : lang === "ru" ? "Справочник" : "Reference"}*\n\n${lang === "uk" ? "Оберіть регіон для підказок геолокації:" : lang === "ru" ? "Выберите регион для подсказок геолокации:" : "Select a region for geolocation hints:"}`;
    const buttons = Object.entries(geosintData).map(([key, region]) => {
      const regionName = region.name[lang] || region.name.en;
      return [cb(`${region.emoji} ${regionName}`, `geosint_${key}`, "primary")];
    });
    buttons.push([cb(t(lang, "buttons.back"), "back_to_dashboard", "danger", E.back)]);
    try {
      await ctx.editMessageText(text, { parse_mode: "Markdown", ...Markup.inlineKeyboard(buttons) });
    } catch {
      await ctx.reply(text, { parse_mode: "Markdown", ...Markup.inlineKeyboard(buttons) });
    }
  });

  bot.action(["mod_iot", "mod_cloud"], async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const lang = await getLang(tgId);
    await ctx.answerCbQuery(t(lang, "premium.locked"));
    
    const text = t(lang, "common.proOnly");
    const keyboard = Markup.inlineKeyboard([
      [cb(t(lang, "upgrade.buyPro"), "upgrade", "success", E.star)],
      [cb(t(lang, "buttons.back"), "back_to_dashboard", "danger", E.back)]
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

    // Premium emoji capture mode — intercept any text from admin in capture
    // mode and respond with their custom_emoji IDs.
    if (isAdmin(tgId) && emojiCaptureMode.has(tgId) && !text.startsWith("/")) {
      const entities = (ctx.message as any).entities || [];
      const captured = extractCustomEmojis(text, entities);
      if (captured.length) {
        await ctx.reply(formatCaptureReply(captured), { parse_mode: "Markdown" });
        return;
      }
    }

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
        
        const starPricesPromo: Record<string, number> = { PRO: 500, ENTERPRISE: 1750, GROUPS: 2750 };
        const discountedStars = Math.round(starPricesPromo[tier] * (1 - (coupon.value || 0) / 100));
        
        await ctx.reply(promoText, {
          parse_mode: "Markdown",
          ...Markup.inlineKeyboard([
            [cb(`⭐ Telegram Stars (${discountedStars} ⭐)`, `bot_pay_method_${tier}_stars_promo_${coupon.value}`, "primary", E.star)],
            [cb("Google Pay / Apple Pay", `bot_pay_method_${tier}_monobank`, "primary", E.card)],
            [cb("Crypto Pay", `bot_pay_method_${tier}_crypto`, "success", E.money)],
            [cb(t(lang, "buttons.back"), `bot_pay_tier_${tier}`, "danger", E.back)]
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
      const existingData = state.data || {};
      userStates.set(tgId, { module: "admin_broadcast", step: "confirm", data: { ...existingData, type: existingData.type || "text", message: broadcastText, buttons: existingData.buttons || [] } });
      
      await showBroadcastPreview(ctx, tgId, lang, { ...existingData, type: existingData.type || "text", message: broadcastText, buttons: existingData.buttons || [] });
      return;
    }

    if (state?.module === "admin_broadcast" && state?.step === "awaiting_btn_text") {
      if (!isAdmin(tgId)) {
        userStates.delete(tgId);
        const lang = await getLang(tgId);
        return ctx.reply(t(lang, "admin.accessDenied"));
      }
      
      const lang = await getLang(tgId);
      const btnText = text.trim();
      const existingData = state.data || {};
      userStates.set(tgId, { module: "admin_broadcast", step: "awaiting_btn_url", data: { ...existingData, pendingBtnText: btnText } });
      
      const urlPrompt = `🔗 *${lang === "uk" ? "Введіть URL для кнопки" : lang === "ru" ? "Введите URL для кнопки" : "Enter button URL"}:*\n\n` +
        `${lang === "uk" ? "Кнопка" : lang === "ru" ? "Кнопка" : "Button"}: "${btnText}"\n\n` +
        `${lang === "uk" ? "Надішліть посилання (https://...):" : lang === "ru" ? "Отправьте ссылку (https://...):" : "Send the link (https://...):"}`;
      
      await ctx.reply(urlPrompt, {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([[cb(t(lang, "admin.cancel"), "admin_broadcast_skip_btns", "danger", E.back)]])
      });
      return;
    }

    if (state?.module === "admin_broadcast" && state?.step === "awaiting_btn_url") {
      if (!isAdmin(tgId)) {
        userStates.delete(tgId);
        const lang = await getLang(tgId);
        return ctx.reply(t(lang, "admin.accessDenied"));
      }
      
      const lang = await getLang(tgId);
      let url = text.trim();
      
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = "https://" + url;
      }
      
      const existingData = state.data || {};
      const buttons = existingData.buttons || [];
      buttons.push({ text: existingData.pendingBtnText, url });
      delete existingData.pendingBtnText;
      
      userStates.set(tgId, { module: "admin_broadcast", step: "confirm", data: { ...existingData, buttons } });
      
      await showBroadcastPreview(ctx, tgId, lang, { ...existingData, buttons });
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
          ...Markup.inlineKeyboard([[cb(t(lang, "admin.back"), "admin_back", "danger", E.back)]])
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
          [cb(targetUser.blocked ? t(lang, "admin.unblock") : t(lang, "admin.block"), `admin_toggle_block_${targetUser.id}`, "danger", E.cross)],
          [cb(t(lang, "admin.moreInfo"), `admin_user_info_${targetUser.id}`, "primary", E.user)],
          [cb(t(lang, "admin.back"), "admin_back", "danger", E.back)]
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
          ...Markup.inlineKeyboard([[cb(t(lang, "admin.back"), "admin_back", "danger", E.back)]])
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
            cb("FREE", `admin_set_tier_${targetUser.id}_FREE`, "danger", E.star),
            cb("PRO", `admin_set_tier_${targetUser.id}_PRO`, "success", E.star),
            cb("ENTERPRISE", `admin_set_tier_${targetUser.id}_ENTERPRISE`, "primary", E.crown)
          ],
          [cb(t(lang, "admin.back"), "admin_back", "danger", E.back)]
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
            [cb(t(lang, "admin.newSearch"), "admin_search_user", "primary", E.search)],
            [cb(t(lang, "admin.back"), "admin_back", "danger", E.back)]
          ])
        });
      }
      
      let resultText = `${t(lang, "admin.searchResults")} (${foundUsers.length})\n\n`;
      
      foundUsers.slice(0, 10).forEach((u, i) => {
        const statusEmoji = u.blocked ? "🔴" : "🟢";
        const tierEmoji = u.tier === "ENTERPRISE" ? "👑" : u.tier === "PRO" ? "⭐" : "🆓";
        resultText += `${i + 1}. ${statusEmoji} ${tierEmoji} ${u.username ? `@${escMd(u.username)}` : "—"}\n`;
        resultText += `   ID: \`${u.tgId}\`\n`;
      });
      
      if (foundUsers.length > 10) {
        resultText += `\n_${t(lang, "admin.andMore", { count: foundUsers.length - 10 })}_`;
      }
      
      const buttons: any[][] = [];
      foundUsers.slice(0, 5).forEach(u => {
        buttons.push([cb(`👤 ${u.username || u.tgId}`, `admin_user_info_${u.id}`, "primary", E.user)]);
      });
      buttons.push([cb(t(lang, "admin.newSearch"), "admin_search_user", "primary", E.search)]);
      buttons.push([cb(t(lang, "admin.back"), "admin_back", "danger", E.back)]);
      
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
        ...Markup.inlineKeyboard([[cb(t(lang, "admin.back"), "admin_tickets", "danger", E.msg)]])
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
        ...Markup.inlineKeyboard([[cb(t(lang, "admin.cancel"), "admin_coupons", "danger", E.back)]])
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
        ...Markup.inlineKeyboard([[cb(t(lang, "admin.cancel"), "admin_coupons", "danger", E.back)]])
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
        ...Markup.inlineKeyboard([[cb(t(lang, "admin.cancel"), "admin_coupons", "danger", E.back)]])
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
        ...Markup.inlineKeyboard([[cb(t(lang, "admin.back"), "admin_coupons", "danger", E.gift)]])
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
          ...Markup.inlineKeyboard([[cb(t(lang, "admin.back"), "admin_back", "danger", E.back)]])
        });
      }
      
      userStates.set(tgId, { module: "admin_add_requests", step: "awaiting_amount", data: { targetUserId: targetUser.id, targetTgId: targetUser.tgId, targetUsername: targetUser.username } });
      
      await ctx.reply(t(lang, "admin.enterRequestsAmount"), {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([[cb(t(lang, "admin.cancel"), "admin_back", "danger", E.back)]])
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
        ...Markup.inlineKeyboard([[cb(t(lang, "admin.back"), "admin_back", "danger", E.back)]])
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
        Markup.inlineKeyboard([[cb(t(lang, "buttons.back"), "back_to_dashboard", "danger", E.back)]])
      );

      for (const adminId of ADMIN_IDS) {
        try {
          await ctx.telegram.sendMessage(adminId, t("uk", "admin.newPayment", { id: payment.id.toString() }) + `\n\n${t("uk", "admin.user", { username: user.username || t("uk", "common.na"), tgId: user.tgId })}\n${t("uk", "admin.tier", { tier: state.data.tier })}\n${t("uk", "admin.paymentAmount", { amount: state.data.amount })}\n${t("uk", "admin.txHash")}: ${txHash}`, 
            {
              reply_markup: Markup.inlineKeyboard([
                [
                  cb(t("uk", "admin.approve"), `approve_pay_${payment.id}`, "success", E.check),
                  cb(t("uk", "admin.reject"), `reject_pay_${payment.id}`, "danger", E.cross)
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
          ...Markup.inlineKeyboard([[cb(t(lang, "buttons.cancel"), "back_to_dashboard", "danger", E.back)]])
        });
      }

      if (state.step === "contact") {
        userStates.set(tgId, { module: "support", step: "message", data: { ...state.data, contact: text.trim() } });
        return ctx.reply(t(lang, "support.askMessage"), {
          parse_mode: "Markdown",
          ...Markup.inlineKeyboard([[cb(t(lang, "buttons.cancel"), "back_to_dashboard", "danger", E.back)]])
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
            ...Markup.inlineKeyboard([[cb(t(lang, "buttons.back"), "back_to_dashboard", "danger", E.back)]])
          });

          for (const adminId of ADMIN_IDS) {
            try {
              await ctx.telegram.sendMessage(adminId, 
                `📩 Нове звернення #${ticket.id}\n\n👤 Ім'я: ${name}\n📱 Контакт: ${contact}\n🔢 TG ID: ${user.tgId} (@${user.username || '—'})\n📍 Джерело: Telegram Bot\n\n💬 Повідомлення:\n${message}`,
                {
                  reply_markup: Markup.inlineKeyboard([
                    [
                      cb("Відповісти", `reply_ticket_${ticket.id}`, "primary", E.msg),
                      cb("Закрити", `close_ticket_${ticket.id}`, "success", E.check)
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
            ...Markup.inlineKeyboard([[cb(t(lang, "buttons.back"), "back_to_dashboard", "danger", E.back)]])
          });
        }
        return;
      }
    }

    const userTier = (user?.tier || "FREE").toUpperCase();
    const isUnlimitedTier = userTier === "ENTERPRISE" || userTier === "GROUPS";
    if (user && !isUnlimitedTier && user.requestsLeft! <= 0) {
      return ctx.reply(t(lang, "checkResult.limitExceeded"), {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([
          [cb(t(lang, "buttons.upgrade"), "upgrade", "success", E.star)],
          [cb(t(lang, "buttons.back"), "back_to_dashboard", "danger", E.back)]
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
        FREE: 3,
        PRO: 50,
        ENTERPRISE: Infinity,
        GROUPS: Infinity,
      };
      
      const dailyLimit = DAILY_LIMITS[userTier] || 3;
      
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
              [cb(t(lang, "buttons.upgrade"), "upgrade", "success", E.star)],
              [cb(t(lang, "buttons.back"), "back_to_dashboard", "danger", E.back)]
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
      ip: pe("globe"), wallet: pe("diamond"), phone: pe("mobile"),
      email: pe("envelope"), domain: pe("globe"), url: pe("link"),
      cve: pe("bug"), hash: pe("search"), username: pe("user"),
      card: pe("card"), iot: pe("cog"), cloud: pe("globe"),
      password: pe("key"), dns: pe("link"), ssl: pe("lock"), mac: pe("cog")
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
      cloud: "CLOUD CHECK",
      password: t(lang, "checkResult.passwordCheck"),
      dns: t(lang, "checkResult.dnsRecords"),
      ssl: t(lang, "checkResult.sslCheck"),
      mac: t(lang, "checkResult.macLookup")
    };
    
    // Create visual risk indicator
    const getRiskVisuals = (score: number): { bar: string; color: string; emoji: string } => {
      const filled = Math.round(score / 10);
      const empty = 10 - filled;
      if (score >= 80) return { bar: "▓".repeat(filled) + "░".repeat(empty), color: "CRITICAL", emoji: pe("ghost") };
      if (score >= 60) return { bar: "▓".repeat(filled) + "░".repeat(empty), color: "HIGH", emoji: pe("high_risk") };
      if (score >= 40) return { bar: "▓".repeat(filled) + "░".repeat(empty), color: "MEDIUM", emoji: pe("med_risk") };
      if (score >= 20) return { bar: "▓".repeat(filled) + "░".repeat(empty), color: "LOW", emoji: pe("low_risk") };
      return { bar: "▓".repeat(filled) + "░".repeat(empty), color: "SAFE", emoji: pe("check") };
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

      result = `${moduleEmojis.card} <b>${escHtml(moduleNames.card)}</b>

${pe("key")} BIN: <code>${escHtml(targetDisplay)}</code>
${pe("zap")} ${escHtml(statusLabel)}: ${escHtml(statusIndicator)}

${pe("scroll")} <b>${escHtml(infoLabel)}</b>
├ ${pe("home")} ${escHtml(bankLabel)}: <b>${escHtml(bankName)}</b>
├ ${pe("globe")} ${escHtml(countryLabel)}: ${countryEmoji} ${escHtml(countryName)}
├ ${pe("card")} ${escHtml(brandLabel)}: <b>${escHtml(cardBrand)}</b>
└ ${pe("scroll")} ${escHtml(typeLabel)}: <b>${escHtml(cardType)}</b>

${pe("search")} <b>${escHtml(analysisLabel)}</b>
${escHtml(findingsFormatted)}

${riskVisuals.emoji} <b>${escHtml(riskLabel)}:</b> <b>${checkResult.riskScore}%</b>  <code>${riskVisuals.color}</code>
<code>${riskVisuals.bar}</code>

${pe("link")} ${escHtml(checkResult.sources.slice(0, 3).join(" · "))}`;

    } else {
      const findingsFormatted = checkResult.findings.slice(0, 6).map((f, i, arr) => 
        i === arr.length - 1 ? `└ ${f}` : `├ ${f}`
      ).join("\n");

      const statusLabel = t(lang, "checkResult.status");
      const targetLabel = t(lang, "checkResult.target");
      const analysisLabel = t(lang, "checkResult.analysis");
      const riskLabel = t(lang, "checkResult.risk");

      let detailsSection = "";
      const detailsLabel = t(lang, "checkResult.details");
      
      if (state.module === "ip" && checkResult.details) {
        const d = checkResult.details;
        const countryInfo = d.country ? `${d.countryCode || ""} ${d.country}` : "";
        const cityInfo = d.city || "";
        const ispInfo = d.isp || "";
        const locationLabel = t(lang, "checkResult.location");
        const ispLabel = t(lang, "checkResult.isp");
        const lines: string[] = [];
        if (countryInfo || cityInfo) lines.push(`${pe("globe")} ${escHtml(locationLabel)}: <b>${escHtml(cityInfo)}${cityInfo && countryInfo ? ", " : ""}${escHtml(countryInfo)}</b>`);
        if (ispInfo) lines.push(`${pe("briefcase")} ${escHtml(ispLabel)}: <b>${escHtml(ispInfo)}</b>`);
        if (d.isTor) lines.push(`${pe("forbidden")} <b>${escHtml(lang === "uk" ? "TOR Exit Node — анонімний трафік" : lang === "ru" ? "TOR Exit Node — анонимный трафик" : lang === "es" ? "Nodo de salida TOR — tráfico anónimo" : lang === "de" ? "TOR Exit Node — anonymer Traffic" : "TOR Exit Node — anonymous traffic")}</b>`);
        if (d.urlhausCount && d.urlhausCount > 0) lines.push(`${pe("warning")} URLhaus: <b>${d.urlhausCount} ${escHtml(lang === "uk" ? "загроз" : lang === "ru" ? "угроз" : lang === "es" ? "amenazas" : lang === "de" ? "Bedrohungen" : "threats")}</b>${d.urlhausOnline ? ` (${d.urlhausOnline} online)` : ""}`);
        if (d.isProxy || d.isVpn) lines.push(`${pe("shield")} ${d.isProxy ? "Proxy" : "VPN"} ${escHtml(lang === "uk" ? "виявлено" : lang === "ru" ? "обнаружен" : "detected")}`);
        if (lines.length > 0) {
          detailsSection = `\n\n${pe("scroll")} <b>${escHtml(detailsLabel)}</b>\n${lines.map((l, i) => (i === lines.length - 1 ? "└ " : "├ ") + l).join("\n")}`;
        }
      } else if (state.module === "wallet" && checkResult.details) {
        const chain = checkResult.details.chain || "";
        const chainLabel = t(lang, "checkResult.chain");
        if (chain) {
          detailsSection = `\n\n${pe("scroll")} <b>${escHtml(detailsLabel)}</b>\n└ ${pe("link")} ${escHtml(chainLabel)}: <b>${escHtml(chain)}</b>`;
        }
      } else if (state.module === "email" && checkResult.details) {
        const d = checkResult.details;
        const lines: string[] = [];
        if (d.domain) lines.push(`${pe("globe")} ${escHtml(t(lang, "checkResult.domain"))}: <b>${escHtml(d.domain)}</b>`);
        lines.push(`${pe("envelope")} MX: ${d.hasMx ? pe("check") : pe("cross")}`);
        if (d.isDisposable || d.evaDisposable) lines.push(`${pe("trash")} <b>${escHtml(lang === "uk" ? "Одноразова пошта" : lang === "ru" ? "Одноразовая почта" : lang === "es" ? "Email desechable" : lang === "de" ? "Wegwerf-E-Mail" : "Disposable email")}</b>`);
        if (d.smtpValid === false) lines.push(`${pe("warning")} SMTP: ${escHtml(lang === "uk" ? "не відповідає" : lang === "ru" ? "не отвечает" : "no response")}`);
        detailsSection = `\n\n${pe("scroll")} <b>${escHtml(detailsLabel)}</b>\n${lines.map((l, i) => (i === lines.length - 1 ? "└ " : "├ ") + l).join("\n")}`;
      } else if ((state.module === "domain" || state.module === "business") && checkResult.details) {
        const d = checkResult.details;
        const lines: string[] = [];
        if (d.registrar) lines.push(`${pe("pin")} ${escHtml(lang === "uk" ? "Реєстратор" : lang === "ru" ? "Регистратор" : "Registrar")}: <b>${escHtml(String(d.registrar))}</b>`);
        if (d.creationDate || d.createdDate) lines.push(`${pe("pin")} ${escHtml(lang === "uk" ? "Створено" : lang === "ru" ? "Создан" : "Created")}: <b>${escHtml(String(d.creationDate || d.createdDate))}</b>`);
        if (d.dmarcMissing) lines.push(`${pe("warning")} <b>DMARC ${escHtml(lang === "uk" ? "відсутній — можливі spoofing-атаки" : lang === "ru" ? "отсутствует — возможен спуфинг" : "missing — spoofing risk")}</b>`);
        if (d.spfMissing) lines.push(`${pe("warning")} <b>SPF ${escHtml(lang === "uk" ? "відсутній" : lang === "ru" ? "отсутствует" : "missing")}</b>`);
        if (d.urlhausCount && d.urlhausCount > 0) lines.push(`${pe("warning")} URLhaus: <b>${d.urlhausCount} ${escHtml(lang === "uk" ? "інцидентів" : lang === "ru" ? "инцидентов" : "incidents")}</b>`);
        if (lines.length > 0) {
          detailsSection = `\n\n${pe("scroll")} <b>${escHtml(detailsLabel)}</b>\n${lines.map((l, i) => (i === lines.length - 1 ? "└ " : "├ ") + l).join("\n")}`;
        }
      }

      result = `${moduleEmojis[state.module] || pe("search")} <b>${escHtml(moduleNames[state.module] || state.module.toUpperCase())}</b>

${pe("pin")} ${escHtml(targetLabel)}: <code>${escHtml(targetDisplay)}</code>
${pe("zap")} ${escHtml(statusLabel)}: ${escHtml(statusIndicator)}${detailsSection}

${pe("search")} <b>${escHtml(analysisLabel)}</b>
${escHtml(findingsFormatted)}

${riskVisuals.emoji} <b>${escHtml(riskLabel)}:</b> <b>${checkResult.riskScore}%</b>  <code>${riskVisuals.color}</code>
<code>${riskVisuals.bar}</code>

${pe("link")} ${escHtml(checkResult.sources.slice(0, 3).join(" · "))}`;
    }

    if (user) {
      const checkTier = (user.tier || "FREE").toUpperCase();
      if (checkTier !== "ENTERPRISE" && checkTier !== "GROUPS") {
        await storage.updateUser(user.id, { requestsLeft: Math.max(0, (user.requestsLeft || 3) - 1) });
      }
      creditPendingReferral(user).catch(() => {});
      
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

    // ─────────── Conversion hooks ───────────
    const hookTier = (user?.tier || "FREE").toUpperCase();
    const isFree = hookTier === "FREE" || hookTier === "BASIC";
    const left = Math.max(0, (user?.requestsLeft ?? 3) - 1);
    const isHighRisk = checkResult.riskScore >= 50;

    let hookLine = "";
    if (isFree) {
      if (left === 0) {
        hookLine = lang === "uk"
          ? `\n\n${pe("warning")} <b>Безкоштовні перевірки закінчилися.</b> ${pe("diamond")} PRO — $9/міс, безлімітні перевірки + моніторинг 24/7.`
          : lang === "ru"
          ? `\n\n${pe("warning")} <b>Бесплатные проверки закончились.</b> ${pe("diamond")} PRO — $9/мес, безлимит + мониторинг 24/7.`
          : lang === "es"
          ? `\n\n${pe("warning")} <b>Comprobaciones gratuitas agotadas.</b> ${pe("diamond")} PRO — $9/mes, ilimitado + monitoreo 24/7.`
          : lang === "de"
          ? `\n\n${pe("warning")} <b>Kostenlose Prüfungen aufgebraucht.</b> ${pe("diamond")} PRO — $9/Monat, unbegrenzt + 24/7-Überwachung.`
          : `\n\n${pe("warning")} <b>Free checks used up.</b> ${pe("diamond")} PRO — $9/mo, unlimited + 24/7 monitoring.`;
      } else if (left <= 2) {
        hookLine = lang === "uk"
          ? `\n\n${pe("soon")} Залишилось <b>${left}</b> безкоштовних перевірок. ${pe("diamond")} PRO — $9/міс, без обмежень.`
          : lang === "ru"
          ? `\n\n${pe("soon")} Осталось <b>${left}</b> бесплатных проверок. ${pe("diamond")} PRO — $9/мес, без ограничений.`
          : lang === "es"
          ? `\n\n${pe("soon")} Quedan <b>${left}</b> comprobaciones gratis. ${pe("diamond")} PRO — $9/mes, sin límite.`
          : lang === "de"
          ? `\n\n${pe("soon")} Noch <b>${left}</b> kostenlose Prüfungen. ${pe("diamond")} PRO — $9/Monat, unbegrenzt.`
          : `\n\n${pe("soon")} <b>${left}</b> free checks left. ${pe("diamond")} PRO — $9/mo, unlimited.`;
      } else if (isHighRisk) {
        hookLine = lang === "uk"
          ? `\n\n${pe("key")} Хочеш бачити <b>усі</b> знахідки та джерела? Розблокуй повний звіт — $3.`
          : lang === "ru"
          ? `\n\n${pe("key")} Хочешь видеть <b>все</b> находки и источники? Разблокируй полный отчёт — $3.`
          : lang === "es"
          ? `\n\n${pe("key")} ¿Quieres ver <b>todos</b> los hallazgos y fuentes? Desbloquea el informe completo — $3.`
          : lang === "de"
          ? `\n\n${pe("key")} Willst du <b>alle</b> Funde und Quellen sehen? Vollständiger Bericht — $3.`
          : `\n\n${pe("key")} Want to see <b>all</b> findings and sources? Unlock the full report — $3.`;
      }
    }

    const proRowLabel = lang === "uk" ? "💎 PRO — $9/міс" : lang === "ru" ? "💎 PRO — $9/мес" : lang === "es" ? "💎 PRO — $9/mes" : lang === "de" ? "💎 PRO — $9/Mon." : "💎 PRO — $9/mo";
    const singleRowLabel = lang === "uk" ? "🔓 Повний звіт — $3" : lang === "ru" ? "🔓 Полный отчёт — $3" : lang === "es" ? "🔓 Informe — $3" : lang === "de" ? "🔓 Vollbericht — $3" : "🔓 Full report — $3";

    const upgradeRow = isFree
      ? [[cb(singleRowLabel, `buy_single_${state.module}_${inputValue}`, "primary"), cb(proRowLabel, "show_plans_pro", "success")]]
      : [];

    await ctx.reply(result + hookLine, {
      parse_mode: "HTML",
      ...Markup.inlineKeyboard([
        ...upgradeRow,
        [
          cb(t(lang, "buttons.pdf"), `gen_pdf_${state.module}_${inputValue}`, "primary", E.doc),
          cb(t(lang, "buttons.newCheck"), `mod_${state.module === "domain" ? "business" : state.module}`, "primary", E.search)
        ],
        [
          cb(t(lang, "buttons.monitoring"), `add_monitor_${state.module}_${inputValue}`, "primary", E.eye),
          cb(t(lang, "buttons.share"), `share_result_${state.module}_${inputValue}`, "success", E.link)
        ],
        [
          cb(t(lang, "buttons.back"), "back_to_dashboard", "danger", E.back)
        ]
      ])
    });
  });

  bot.action(/^buy_single_/, async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const user = await storage.getUserByTgId(tgId);
    const lang = getUserLang(user?.lang);
    const parts = ctx.match.input.split('_');
    const module = parts[2];
    const target = parts.slice(3).join('_');
    const webBase = process.env.WEB_BASE_URL || `https://${process.env.REPLIT_DEV_DOMAIN || ""}`;
    const url = `${webBase}/pricing?single=1&type=${encodeURIComponent(module)}&t=${encodeURIComponent(target)}`;
    await ctx.answerCbQuery();
    const title = lang === "uk" ? "🔓 Повний звіт — $3" : lang === "ru" ? "🔓 Полный отчёт — $3" : lang === "es" ? "🔓 Informe completo — $3" : lang === "de" ? "🔓 Vollständiger Bericht — $3" : "🔓 Full report — $3";
    const desc = lang === "uk"
      ? "Усі знахідки, перелік джерел, PDF за однією ціллю. Без підписки."
      : lang === "ru"
      ? "Все находки, перечень источников, PDF по одной цели. Без подписки."
      : lang === "es"
      ? "Todos los hallazgos, fuentes y PDF para un objetivo. Sin suscripción."
      : lang === "de"
      ? "Alle Funde, Quellen und PDF für ein Ziel. Ohne Abo."
      : "All findings, sources and PDF for one target. No subscription.";
    await ctx.reply(`*${title}*\n\n${desc}`, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [Markup.button.url(lang === "uk" ? "Оплатити $3" : lang === "ru" ? "Оплатить $3" : lang === "es" ? "Pagar $3" : lang === "de" ? "$3 bezahlen" : "Pay $3", url)],
      ]),
    });
  });

  bot.action("show_plans_pro", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const user = await storage.getUserByTgId(tgId);
    const lang = getUserLang(user?.lang);
    const webBase = process.env.WEB_BASE_URL || `https://${process.env.REPLIT_DEV_DOMAIN || ""}`;
    const url = `${webBase}/pricing?plan=PRO`;
    await ctx.answerCbQuery();
    const title = lang === "uk" ? "💎 PRO — $9/міс" : lang === "ru" ? "💎 PRO — $9/мес" : lang === "es" ? "💎 PRO — $9/mes" : lang === "de" ? "💎 PRO — $9/Monat" : "💎 PRO — $9/mo";
    const benefits = lang === "uk"
      ? "• 200 перевірок на місяць\n• Моніторинг утечок 24/7\n• Історія + експорт\n• API-доступ\n• Вбудований VPN"
      : lang === "ru"
      ? "• 200 проверок в месяц\n• Мониторинг утечек 24/7\n• История + экспорт\n• API-доступ\n• Встроенный VPN"
      : lang === "es"
      ? "• 200 comprobaciones/mes\n• Monitoreo 24/7\n• Historial + exportación\n• Acceso API\n• VPN integrada"
      : lang === "de"
      ? "• 200 Prüfungen/Monat\n• 24/7-Überwachung\n• Verlauf + Export\n• API-Zugang\n• Integriertes VPN"
      : "• 200 checks per month\n• 24/7 leak monitoring\n• History + export\n• API access\n• Built-in VPN";
    await ctx.reply(`*${title}*\n\n${benefits}`, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [Markup.button.url(lang === "uk" ? "Оформити PRO" : lang === "ru" ? "Оформить PRO" : lang === "es" ? "Activar PRO" : lang === "de" ? "PRO aktivieren" : "Activate PRO", url)],
      ]),
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
      const wlt = String(user.tier || "FREE").toUpperCase();
      const branding = (wlt === "ENTERPRISE" || wlt === "GROUPS")
        ? { companyName: (user as any).companyName, brandColor: (user as any).brandColor, companyLogoUrl: (user as any).companyLogoUrl }
        : undefined;
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
        verificationId,
        branding,
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
          [cb(t(lang, "upgrade.buyPro"), "upgrade", "success", E.star)],
          [cb(t(lang, "buttons.back"), "back_to_dashboard", "danger", E.back)]
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
      Markup.inlineKeyboard([[cb(t(lang, "buttons.back"), "back_to_dashboard", "danger", E.back)]])
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

    const keyboard = Markup.inlineKeyboard([[cb(t(lang, "buttons.back"), "back_to_dashboard", "danger", E.back)]]);
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

    const keyboard = Markup.inlineKeyboard([[cb(t(lang, "buttons.back"), "back_to_dashboard", "danger", E.back)]]);
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
        cb("🇺🇦 Українська", "set_lang_uk", "primary", E.globe),
        cb("🇬🇧 English", "set_lang_en", "primary", E.globe),
        cb("🇷🇺 Русский", "set_lang_ru", "primary", E.globe)
      ],
      [cb(t(lang, "buttons.back"), "back_to_dashboard", "danger", E.back)]
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

    const botUserName = (await bot.telegram.getMe()).username || "DarkShare1Bot";
    const refLink = `t.me/${botUserName}?start=ref_${user.refCode}`;
    const bonusEarned = referralStats.count * 2;
    const discountProgress = Math.min(referralStats.count, 5);
    const discountPercent = discountProgress * 4;

    const topRef = referralStats.referredUsers.slice(0, 3);
    const leaderboardText = topRef.length > 0 
      ? topRef.map((r, i) => {
          const medalSlot = i === 0 ? "trophy" : i === 1 ? "star" : "diamond";
          return `${pe(medalSlot)} ${r.username ? `@${escHtml(r.username)}` : "user"} — <b>${escHtml(r.tier || "FREE")}</b>`;
        }).join("\n")
      : escHtml(lang === "uk" ? "Поки немає рефералів" : lang === "ru" ? "Пока нет рефералов" : "No referrals yet");

    const participateTitle = lang === "uk" ? "Як можна поучаствувати?" : lang === "ru" ? "Как можно поучаствовать?" : "How to participate?";
    const participateSteps = lang === "uk"
      ? `${pe("camera")} Знімай відео в TikTok / Reels / Shorts\n(вказуй бота прямо в відео)\n\n${pe("wave")} Діліся своєю реферальною\nпосиланням в чатах і ком'юніті\n\n${pe("people")} Відправляй посилання друзям та\nзнайомим\n\n${pe("warning")} Пусті переходи і боти не зараховуються`
      : lang === "ru"
      ? `${pe("camera")} Снимай видео в TikTok / Reels / Shorts\n(указывай бота прямо в видео)\n\n${pe("wave")} Делись своей реферальной\nссылкой в чатах и комьюнити\n\n${pe("people")} Отправляй ссылку друзьям и\nзнакомым\n\n${pe("warning")} Пустые переходы и боты не засчитываются`
      : `${pe("camera")} Create TikTok / Reels / Shorts videos\n(mention the bot in your video)\n\n${pe("wave")} Share your referral link in chats\nand communities\n\n${pe("people")} Send the link to friends and\nacquaintances\n\n${pe("warning")} Empty clicks and bots don't count`;

    const faqTitle = lang === "uk" ? "FAQ | Нарахування бонусів" : lang === "ru" ? "FAQ | Начисление бонусов" : "FAQ | Earning bonuses";
    const faqText = lang === "uk"
      ? `${pe("thinking")} <b>Як нараховуються бонуси?</b>\nБонуси нараховуються за кожного нового користувача, який перейшов за вашим посиланням та почав користуватися ботом.`
      : lang === "ru"
      ? `${pe("thinking")} <b>Как начисляются бонусы?</b>\nБонусы начисляются за каждого нового пользователя, перешедшего по вашей ссылке и начавшего использовать бота.`
      : `${pe("thinking")} <b>How are bonuses earned?</b>\nBonuses are earned for each new user who joins via your link and starts using the bot.`;

    const text = `${pe("trophy")} <b>${escHtml(lang === "uk" ? "Реферальна програма" : lang === "ru" ? "Реферальная программа" : "Referral Program")}</b>
${pe("gift")} ${escHtml(lang === "uk" ? "Запрошуй користувачів і заробляй!" : lang === "ru" ? "Приглашай пользователей и зарабатывай!" : "Invite users and earn rewards!")}

${pe("chart")} <b>${escHtml(lang === "uk" ? "Твоя статистика" : lang === "ru" ? "Твоя статистика" : "Your stats")}:</b>
├ ${pe("people")} ${escHtml(lang === "uk" ? "Рефералів" : lang === "ru" ? "Рефералов" : "Referrals")}: <b>${referralStats.count}</b>
├ ${pe("gift")} ${escHtml(lang === "uk" ? "Бонус запитів" : lang === "ru" ? "Бонус запросов" : "Bonus checks")}: <b>+${bonusEarned}</b>
└ ${pe("money")} ${escHtml(lang === "uk" ? "Знижка" : lang === "ru" ? "Скидка" : "Discount")}: <b>${discountPercent}%</b>

${pe("link")} <b>${escHtml(lang === "uk" ? "Реферальне посилання" : lang === "ru" ? "Реферальная ссылка" : "Referral link")}:</b>
<code>${escHtml(refLink)}</code>
${pe("plane")} ${escHtml(lang === "uk" ? "Поділися з друзями" : lang === "ru" ? "Поделись с друзьями" : "Share with friends")}

${pe("trophy")} <b>${escHtml(lang === "uk" ? "Топ реферали" : lang === "ru" ? "Топ рефералы" : "Top referrals")}</b>
${leaderboardText}

${pe("rocket")} <b>${escHtml(participateTitle)}</b>

${participateSteps}

${pe("thinking")} <b>${escHtml(faqTitle)}</b>
${faqText}`;

    const copyLabel = lang === "uk" ? "Копіювати посилання" : lang === "ru" ? "Скопировать ссылку" : "Copy link";
    const shareLabel = lang === "uk" ? "Поділитись" : lang === "ru" ? "Поделиться" : "Share";
    const shareCaption = lang === "uk" ? "Приєднуйся до DARKSHARE — найкращої OSINT платформи! 🔍"
      : lang === "ru" ? "Присоединяйся к DARKSHARE — лучшей OSINT-платформе! 🔍"
      : "Join DARKSHARE — the best OSINT platform! 🔍";

    try {
      await ctx.editMessageText(text, {
        parse_mode: "HTML",
        ...Markup.inlineKeyboard([
          [cb(copyLabel, "copy_ref_link", "primary", E.link)],
          [urlS(shareLabel, `https://t.me/share/url?url=${encodeURIComponent("https://" + refLink)}&text=${encodeURIComponent(shareCaption)}`, "success", E.link)],
          [cb(t(lang, "buttons.back"), "back_to_dashboard", "danger", E.back)]
        ])
      });
    } catch {
      await ctx.reply(text, {
        parse_mode: "HTML",
        ...Markup.inlineKeyboard([
          [cb(copyLabel, "copy_ref_link", "primary", E.link)],
          [urlS(shareLabel, `https://t.me/share/url?url=${encodeURIComponent("https://" + refLink)}&text=${encodeURIComponent(shareCaption)}`, "success", E.link)],
          [cb(t(lang, "buttons.back"), "back_to_dashboard", "danger", E.back)]
        ])
      });
    }
  });

  bot.action("copy_ref_link", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const user = await storage.getUserByTgId(tgId);
    const lang = getUserLang(user?.lang);
    if (user) {
      const botUserName = (await bot.telegram.getMe()).username || "DarkShare1Bot";
      const refLink = `t.me/${botUserName}?start=ref_${user.refCode}`;
      await ctx.answerCbQuery(lang === "uk" ? "Посилання скопійовано!" : lang === "ru" ? "Ссылка скопирована!" : "Link copied!");
      await ctx.reply(`${pe("scroll")} <b>${escHtml(lang === "uk" ? "Твоє реферальне посилання" : lang === "ru" ? "Твоя реферальная ссылка" : "Your referral link")}:</b>\n\n<code>${escHtml(refLink)}</code>`, { parse_mode: "HTML" });
    }
  });

  bot.action("upgrade", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const lang = await getLang(tgId);

    const groupsTitle = lang === "uk" ? "GROUPS — $55/міс" : lang === "ru" ? "GROUPS — $55/мес" : lang === "es" ? "GROUPS — $55/mes" : lang === "de" ? "GROUPS — $55/Mon" : "GROUPS — $55/mo";
    const groupsDetails = lang === "uk"
      ? "Все з ENTERPRISE + до 5 робочих місць, спільна історія, ролі, аудит-лог."
      : lang === "ru"
      ? "Всё из ENTERPRISE + до 5 рабочих мест, общая история, роли, аудит-лог."
      : lang === "es"
      ? "Todo de ENTERPRISE + hasta 5 puestos, historial compartido, roles, registro de auditoría."
      : lang === "de"
      ? "Alles aus ENTERPRISE + bis zu 5 Plätze, gemeinsamer Verlauf, Rollen, Audit-Log."
      : "Everything in ENTERPRISE + up to 5 seats, shared history, roles, audit log.";
    const buyGroupsLabel = lang === "uk" ? "Купити GROUPS" : lang === "ru" ? "Купить GROUPS" : lang === "es" ? "Comprar GROUPS" : lang === "de" ? "GROUPS kaufen" : "Buy GROUPS";

    const text =
      `${pe("rocket")} <b>${escHtml(t(lang, "upgrade.title"))}</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n\n` +
      `${pe("star")} <b>${escHtml(t(lang, "upgrade.free"))}</b>\n${escHtml(t(lang, "upgrade.freeDetails"))}\n\n` +
      `${pe("diamond")} <b>${escHtml(t(lang, "upgrade.pro"))}</b>\n${escHtml(t(lang, "upgrade.proDetails"))}\n\n` +
      `${pe("crown")} <b>${escHtml(t(lang, "upgrade.enterprise"))}</b>\n${escHtml(t(lang, "upgrade.enterpriseDetails"))}\n\n` +
      `${pe("money")} <b>${escHtml(groupsTitle)}</b>\n${escHtml(groupsDetails)}`;

    const kb = Markup.inlineKeyboard([
      [cb(t(lang, "upgrade.buyPro"), "buy_pro", "success", E.star)],
      [cb(t(lang, "upgrade.buyEnterprise"), "buy_enterprise", "success", E.crown)],
      [cb(buyGroupsLabel, "buy_groups", "success", E.money)],
      [cb(t(lang, "buttons.back"), "back_to_dashboard", "danger", E.back)]
    ]);

    try {
      await ctx.editMessageText(text, { parse_mode: "HTML", ...kb });
    } catch {
      await ctx.reply(text, { parse_mode: "HTML", ...kb });
    }
  });

  bot.action("bot_payment", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const lang = await getLang(tgId);
    const user = await storage.getUserByTgId(tgId);

    const titleText = lang === "uk" ? "Оплата підписки" : lang === "ru" ? "Оплата подписки" : lang === "es" ? "Pago de suscripción" : lang === "de" ? "Abozahlung" : "Subscription Payment";
    const pickText = lang === "uk" ? "Оберіть тариф:" : lang === "ru" ? "Выберите тариф:" : lang === "es" ? "Selecciona el plan:" : lang === "de" ? "Tarif wählen:" : "Select plan:";

    const text = `${pe("card")} <b>${escHtml(titleText)}</b>\n\n${pe("crown")} ${escHtml(pickText)}`;
    
    const keyboard = Markup.inlineKeyboard([
      [cb("PRO — $10/mo (410 UAH)", "bot_pay_tier_PRO", "success", E.money)],
      [cb("ENTERPRISE — $35/mo (1435 UAH)", "bot_pay_tier_ENTERPRISE", "success", E.money)],
      [cb("GROUPS — $55/mo (2255 UAH)", "bot_pay_tier_GROUPS", "success", E.money)],
      [cb(t(lang, "buttons.back"), "back_to_dashboard", "danger", E.back)]
    ]);
    
    try {
      await ctx.editMessageText(text, { parse_mode: "HTML", ...keyboard });
    } catch {
      await ctx.reply(text, { parse_mode: "HTML", ...keyboard });
    }
  });

  bot.action(/^bot_pay_tier_(PRO|ENTERPRISE|GROUPS)$/, async (ctx) => {
    const tier = ctx.match[1];
    const tgId = ctx.from!.id.toString();
    const lang = await getLang(tgId);
    
    const uahPrices: Record<string, number> = { PRO: 410, ENTERPRISE: 1435, GROUPS: 2255 };
    const usdPrices: Record<string, number> = { PRO: 10, ENTERPRISE: 35, GROUPS: 55 };
    const starPrices: Record<string, number> = { PRO: 500, ENTERPRISE: 1750, GROUPS: 2750 };

    const amountLabel = lang === "uk" ? "Сума" : lang === "ru" ? "Сумма" : lang === "es" ? "Monto" : lang === "de" ? "Betrag" : "Amount";
    const pickMethodText = lang === "uk" ? "Оберіть спосіб оплати:" : lang === "ru" ? "Выберите способ оплаты:" : lang === "es" ? "Selecciona el método de pago:" : lang === "de" ? "Zahlungsmethode wählen:" : "Select payment method:";
    const tipText = lang === "uk" ? "Сума в гривнях (UAH). Ваш банк автоматично конвертує з вашої валюти." : lang === "ru" ? "Сумма в гривнах (UAH). Ваш банк автоматически конвертирует из вашей валюты." : lang === "es" ? "Monto en UAH. Tu banco convierte automáticamente desde tu moneda." : lang === "de" ? "Betrag in UAH. Deine Bank rechnet automatisch um." : "Amount in UAH. Your bank converts automatically from your currency.";

    const text =
      `${pe("card")} <b>${escHtml(tier)}</b>\n\n` +
      `${pe("money")} ${escHtml(amountLabel)}: <b>${uahPrices[tier]} UAH</b> (~$${usdPrices[tier]} USD)\n\n` +
      `${pe("rocket")} ${escHtml(pickMethodText)}\n\n` +
      `${pe("bulb")} <i>${escHtml(tipText)}</i>`;
    
    const keyboard = Markup.inlineKeyboard([
      [cb(`⭐ Telegram Stars (${starPrices[tier]} ⭐)`, `bot_pay_method_${tier}_stars`, "primary", E.star)],
      [cb("Google Pay / Apple Pay", `bot_pay_method_${tier}_monobank`, "primary", E.card)],
      [cb("Crypto Pay", `bot_pay_method_${tier}_crypto`, "success", E.money)],
      [cb((lang === "uk" ? "Промокод" : lang === "ru" ? "Промокод" : lang === "es" ? "Código promo" : lang === "de" ? "Promo-Code" : "Promo code"), `bot_pay_promo_${tier}`, "success", E.gift)],
      [cb(t(lang, "buttons.back"), "bot_payment", "danger", E.back)]
    ]);
    
    try {
      await ctx.editMessageText(text, { parse_mode: "HTML", ...keyboard });
    } catch {
      await ctx.reply(text, { parse_mode: "HTML", ...keyboard });
    }
  });

  bot.action(/^bot_pay_method_(PRO|ENTERPRISE|GROUPS)_stars$/, async (ctx) => {
    const tier = ctx.match[1];
    const tgId = ctx.from!.id.toString();
    const lang = await getLang(tgId);
    
    const starPrices: Record<string, number> = { PRO: 500, ENTERPRISE: 1750, GROUPS: 2750 };
    const stars = starPrices[tier];
    
    try {
      await ctx.answerCbQuery();
      
      const user = await storage.getUserByTgId(tgId);
      if (!user) return;

      const payment = await storage.createPayment({
        userId: user.id,
        tier,
        amountUsdt: String(stars),
        txHash: null,
        status: "pending",
      });

      const titles: Record<string, string> = {
        uk: `DARKSHARE ${tier} — Підписка`,
        ru: `DARKSHARE ${tier} — Подписка`,
        en: `DARKSHARE ${tier} — Subscription`,
        es: `DARKSHARE ${tier} — Suscripción`,
        de: `DARKSHARE ${tier} — Abonnement`,
      };
      const descriptions: Record<string, string> = {
        uk: `${tier} тариф на 30 днів. Після оплати тариф активується автоматично!`,
        ru: `${tier} тариф на 30 дней. После оплаты тариф активируется автоматически!`,
        en: `${tier} plan for 30 days. Plan activates automatically after payment!`,
        es: `Plan ${tier} por 30 días. ¡Se activa automáticamente después del pago!`,
        de: `${tier} Tarif für 30 Tage. Der Tarif wird nach der Zahlung automatisch aktiviert!`,
      };

      await ctx.sendInvoice({
        title: titles[lang] || titles["en"],
        description: descriptions[lang] || descriptions["en"],
        payload: JSON.stringify({ paymentId: payment.id, userId: user.id, tier, period: "monthly", periodDays: 30 }),
        provider_token: "",
        currency: "XTR",
        prices: [{ label: `${tier} Plan`, amount: stars }],
      });
    } catch (err) {
      console.error("Bot Stars payment error:", err);
      const errText = lang === "uk" ? "❌ Помилка створення платежу зірками." : lang === "ru" ? "❌ Ошибка создания платежа звёздами." : "❌ Failed to create Stars payment.";
      await ctx.reply(errText);
    }
  });

  bot.on("pre_checkout_query", async (ctx) => {
    try {
      await ctx.answerPreCheckoutQuery(true);
    } catch (err) {
      console.error("Pre-checkout query error:", err);
      try {
        await ctx.answerPreCheckoutQuery(false, "Payment processing error. Please try again.");
      } catch {}
    }
  });

  bot.on("successful_payment", async (ctx) => {
    try {
      const payment = ctx.message?.successful_payment;
      if (!payment) return;

      const payload = JSON.parse(payment.invoice_payload);
      const { paymentId, userId, tier, periodDays } = payload;
      const tgId = ctx.from!.id.toString();
      const user = await storage.getUserByTgId(tgId);
      if (!user) return;
      const lang = getUserLang(user.lang);

      const telegramPaymentId = payment.telegram_payment_charge_id;
      await storage.updatePaymentStatus(paymentId, "approved");

      const tierLimits: Record<string, number> = { PRO: 50, ENTERPRISE: 999999, GROUPS: 999999 };
      const newLimit = tierLimits[tier] || 50;
      const days = periodDays || 30;
      const expiryDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
      await storage.updateUser(user.id, { tier, requestsLeft: newLimit, subscriptionExpiresAt: expiryDate });

      const expiryStr = expiryDate.toLocaleDateString("uk-UA");
      const requestsDisplay = tier === "ENTERPRISE" || tier === "GROUPS" ? "∞" : "50";
      const starsAmount = payment.total_amount;

      const L = (uk: string, ru: string, en: string, es?: string, de?: string) =>
        lang === "uk" ? uk : lang === "ru" ? ru : lang === "es" ? (es || en) : lang === "de" ? (de || en) : en;
      const receiptTitle = L("КВИТАНЦІЯ DARKSHARE", "КВИТАНЦИЯ DARKSHARE", "DARKSHARE RECEIPT", "RECIBO DARKSHARE", "DARKSHARE QUITTUNG");
      const confirmedLabel = L("Оплату зірками підтверджено!", "Оплата звёздами подтверждена!", "Stars payment confirmed!", "¡Pago con estrellas confirmado!", "Stars-Zahlung bestätigt!");
      const planLabel    = L("Тариф", "Тариф", "Plan", "Plan", "Tarif");
      const sumLabel     = L("Сума", "Сумма", "Amount", "Monto", "Betrag");
      const reqLabel     = L("Запитів", "Запросов", "Requests", "Solicitudes", "Anfragen");
      const perLabel     = L("день", "день", "day", "día", "Tag");
      const tillLabel    = L("Діє до", "Действует до", "Valid until", "Válido hasta", "Gültig bis");
      const payLabel     = L("Платіж", "Платёж", "Payment", "Pago", "Zahlung");
      const thanksLabel  = L("Дякуємо за довіру!", "Спасибо за доверие!", "Thank you for your trust!", "¡Gracias por su confianza!", "Vielen Dank für Ihr Vertrauen!");

      const receiptText =
        `${pe("scroll")} <b>${escHtml(receiptTitle)}</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n\n` +
        `${pe("check")} ${escHtml(confirmedLabel)}\n\n` +
        `${pe("gift")} ${escHtml(planLabel)}: <b>${escHtml(tier)}</b>\n` +
        `${pe("star")} ${escHtml(sumLabel)}: <b>${starsAmount}</b> Stars\n` +
        `${pe("chart")} ${escHtml(reqLabel)}: <b>${requestsDisplay}</b>/${escHtml(perLabel)}\n` +
        `${pe("pin")} ${escHtml(tillLabel)}: <b>${escHtml(expiryStr)}</b>\n` +
        `${pe("key")} ${escHtml(payLabel)}: <code>#${paymentId}</code>\n` +
        `${pe("sparkle")} TG ID: <code>${escHtml(telegramPaymentId)}</code>\n\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `${pe("heart")} ${escHtml(thanksLabel)}`;

      await ctx.reply(receiptText, {
        parse_mode: "HTML",
        ...Markup.inlineKeyboard([[cb("🏠 " + (lang === "uk" ? "Меню" : lang === "ru" ? "Меню" : "Menu"), "dashboard", "primary", E.home)]])
      });

      const ADMIN_IDS = (process.env.ADMIN_TG_IDS || "").split(",").map(id => id.trim()).filter(Boolean);
      for (const adminId of ADMIN_IDS) {
        try {
          await bot.telegram.sendMessage(adminId, `⭐ *Stars Payment Received*\n\nUser: @${user.username || "N/A"} (${tgId})\nTier: ${tier}\nStars: ${starsAmount}\nPayment #${paymentId}\nTG Charge: ${telegramPaymentId}`, { parse_mode: "Markdown" });
        } catch {}
      }
    } catch (err) {
      console.error("Successful payment handler error:", err);
    }
  });

  bot.action(/^bot_pay_method_(PRO|ENTERPRISE|GROUPS)_stars_promo_(\d+)$/, async (ctx) => {
    const tier = ctx.match[1];
    const discount = parseInt(ctx.match[2]);
    const tgId = ctx.from!.id.toString();
    const lang = await getLang(tgId);
    
    const starPrices: Record<string, number> = { PRO: 500, ENTERPRISE: 1750, GROUPS: 2750 };
    const baseStars = starPrices[tier];
    const discountedStars = Math.max(1, Math.round(baseStars * (1 - discount / 100)));
    
    try {
      await ctx.answerCbQuery();
      
      const user = await storage.getUserByTgId(tgId);
      if (!user) return;

      const payment = await storage.createPayment({
        userId: user.id,
        tier,
        amountUsdt: String(discountedStars),
        txHash: null,
        status: "pending",
      });

      const titles: Record<string, string> = {
        uk: `DARKSHARE ${tier} — Підписка (-${discount}%)`,
        ru: `DARKSHARE ${tier} — Подписка (-${discount}%)`,
        en: `DARKSHARE ${tier} — Subscription (-${discount}%)`,
      };
      const descriptions: Record<string, string> = {
        uk: `${tier} тариф на 30 днів зі знижкою ${discount}%! Активується автоматично.`,
        ru: `${tier} тариф на 30 дней со скидкой ${discount}%! Активируется автоматически.`,
        en: `${tier} plan for 30 days with ${discount}% discount! Activates automatically.`,
      };

      await ctx.sendInvoice({
        title: titles[lang] || titles["en"],
        description: descriptions[lang] || descriptions["en"],
        payload: JSON.stringify({ paymentId: payment.id, userId: user.id, tier, period: "monthly", periodDays: 30 }),
        provider_token: "",
        currency: "XTR",
        prices: [{ label: `${tier} Plan (-${discount}%)`, amount: discountedStars }],
      });
    } catch (err) {
      console.error("Bot Stars promo payment error:", err);
      const errText = lang === "uk" ? "❌ Помилка створення платежу зірками." : lang === "ru" ? "❌ Ошибка создания платежа звёздами." : "❌ Failed to create Stars payment.";
      await ctx.reply(errText);
    }
  });

  bot.action(/^bot_pay_method_(PRO|ENTERPRISE|GROUPS)_monobank$/, async (ctx) => {
    const tier = ctx.match[1];
    const tgId = ctx.from!.id.toString();
    const lang = await getLang(tgId);
    
    const uahPrices: Record<string, number> = { PRO: 410, ENTERPRISE: 1435, GROUPS: 2255 };
    
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
        const methodName = lang === "uk" ? "Google Pay / Apple Pay" : lang === "ru" ? "Google Pay / Apple Pay" : "Google Pay / Apple Pay";
        const amountLabel = lang === "uk" ? "Сума" : lang === "ru" ? "Сумма" : lang === "es" ? "Monto" : lang === "de" ? "Betrag" : "Amount";
        const clickText = lang === "uk" ? "Натисніть кнопку нижче для оплати:" : lang === "ru" ? "Нажмите кнопку ниже для оплаты:" : lang === "es" ? "Pulsa el botón para pagar:" : lang === "de" ? "Tippe auf den Button zum Bezahlen:" : "Click the button below to pay:";
        const text =
          `${pe("card")} <b>${escHtml(methodName)}</b>\n\n` +
          `${pe("money")} ${escHtml(amountLabel)}: <b>${uahPrices[tier]} UAH</b>\n\n` +
          `${pe("rocket")} ${escHtml(clickText)}`;
        
        const keyboard = Markup.inlineKeyboard([
          [urlS(`💳 ${lang === "uk" ? "Оплатити" : lang === "ru" ? "Оплатить" : "Pay"} ${uahPrices[tier]} UAH`, data.pageUrl, "success", E.money)],
          [cb(`✅ ${lang === "uk" ? "Я оплатив" : lang === "ru" ? "Я оплатил" : "I paid"}`, `check_mono_payment`, "success", E.check)],
          [cb(t(lang, "buttons.back"), `bot_pay_tier_${tier}`, "danger", E.back)]
        ]);
        
        try {
          await ctx.editMessageText(text, { parse_mode: "HTML", ...keyboard });
        } catch {
          await ctx.reply(text, { parse_mode: "HTML", ...keyboard });
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

  bot.action("check_mono_payment", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const lang = await getLang(tgId);
    
    try {
      const response = await fetch(`http://localhost:${process.env.PORT || 5000}/api/payments/monopay/check-status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Bot-Token": process.env.TELEGRAM_BOT_TOKEN || "",
        },
        body: JSON.stringify({ tgId }),
      });
      
      const data = await response.json();
      
      if (data.status === "success" && data.processed) {
        const successText = lang === "uk" ? "\u2705 \u041E\u043F\u043B\u0430\u0442\u0443 \u043F\u0456\u0434\u0442\u0432\u0435\u0440\u0434\u0436\u0435\u043D\u043E! \u0412\u0430\u0448 \u0442\u0430\u0440\u0438\u0444 \u043E\u043D\u043E\u0432\u043B\u0435\u043D\u043E. \u041A\u0432\u0438\u0442\u0430\u043D\u0446\u0456\u044E \u043D\u0430\u0434\u0456\u0441\u043B\u0430\u043D\u043E \u0432\u0438\u0449\u0435." :
                            lang === "ru" ? "\u2705 \u041E\u043F\u043B\u0430\u0442\u0430 \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0430! \u0412\u0430\u0448 \u0442\u0430\u0440\u0438\u0444 \u043E\u0431\u043D\u043E\u0432\u043B\u0451\u043D. \u041A\u0432\u0438\u0442\u0430\u043D\u0446\u0438\u044F \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0430 \u0432\u044B\u0448\u0435." :
                            "\u2705 Payment confirmed! Your plan has been upgraded. Receipt sent above.";
        await ctx.answerCbQuery(successText, { show_alert: true });
        
        const doneTitle = lang === "uk" ? "Оплату підтверджено!" : lang === "ru" ? "Оплата подтверждена!" : lang === "es" ? "¡Pago confirmado!" : lang === "de" ? "Zahlung bestätigt!" : "Payment confirmed!";
        const doneSub = lang === "uk" ? "Ваш тариф оновлено автоматично." : lang === "ru" ? "Ваш тариф обновлён автоматически." : lang === "es" ? "Tu plan se ha actualizado automáticamente." : lang === "de" ? "Dein Tarif wurde automatisch aktualisiert." : "Your plan has been upgraded automatically.";
        const doneText = `${pe("check")} <b>${escHtml(doneTitle)}</b>\n\n${pe("rocket_up")} ${escHtml(doneSub)}`;
        const keyboard = Markup.inlineKeyboard([
          [cb("\u{1F3E0} " + (lang === "uk" ? "\u041C\u0435\u043D\u044E" : lang === "ru" ? "\u041C\u0435\u043D\u044E" : "Menu"), "dashboard", "primary", E.home)]
        ]);
        try {
          await ctx.editMessageText(doneText, { parse_mode: "HTML", ...keyboard });
        } catch { }
      } else if (data.status === "expired" || data.status === "failure") {
        const failText = lang === "uk" ? "\u274C \u041F\u043B\u0430\u0442\u0456\u0436 \u043D\u0435 \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043D\u043E \u0430\u0431\u043E \u0447\u0430\u0441 \u043C\u0438\u043D\u0443\u0432. \u0421\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u0449\u0435 \u0440\u0430\u0437." :
                         lang === "ru" ? "\u274C \u041F\u043B\u0430\u0442\u0451\u0436 \u043D\u0435 \u0437\u0430\u0432\u0435\u0440\u0448\u0451\u043D \u0438\u043B\u0438 \u0432\u0440\u0435\u043C\u044F \u0438\u0441\u0442\u0435\u043A\u043B\u043E. \u041F\u043E\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u0441\u043D\u043E\u0432\u0430." :
                         "\u274C Payment not completed or expired. Please try again.";
        await ctx.answerCbQuery(failText, { show_alert: true });
      } else if (data.alreadyProcessed) {
        const alreadyText = lang === "uk" ? "\u2705 \u0426\u0435\u0439 \u043F\u043B\u0430\u0442\u0456\u0436 \u0432\u0436\u0435 \u043E\u0431\u0440\u043E\u0431\u043B\u0435\u043D\u043E." :
                            lang === "ru" ? "\u2705 \u042D\u0442\u043E\u0442 \u043F\u043B\u0430\u0442\u0451\u0436 \u0443\u0436\u0435 \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u0430\u043D." :
                            "\u2705 This payment has already been processed.";
        await ctx.answerCbQuery(alreadyText, { show_alert: true });
      } else if (data.error === "No pending payment found") {
        const noPaymentText = lang === "uk" ? "\u23F3 \u041D\u0435 \u0437\u043D\u0430\u0439\u0434\u0435\u043D\u043E \u0430\u043A\u0442\u0438\u0432\u043D\u0438\u0445 \u043F\u043B\u0430\u0442\u0435\u0436\u0456\u0432. \u0421\u0442\u0432\u043E\u0440\u0456\u0442\u044C \u043D\u043E\u0432\u0438\u0439." :
                              lang === "ru" ? "\u23F3 \u0410\u043A\u0442\u0438\u0432\u043D\u044B\u0445 \u043F\u043B\u0430\u0442\u0435\u0436\u0435\u0439 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E. \u0421\u043E\u0437\u0434\u0430\u0439\u0442\u0435 \u043D\u043E\u0432\u044B\u0439." :
                              "\u23F3 No active payments found. Create a new one.";
        await ctx.answerCbQuery(noPaymentText, { show_alert: true });
      } else {
        const pendingText = lang === "uk" ? "\u23F3 \u041E\u043F\u043B\u0430\u0442\u0443 \u0449\u0435 \u043D\u0435 \u043E\u0442\u0440\u0438\u043C\u0430\u043D\u043E. \u0421\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u0447\u0435\u0440\u0435\u0437 \u0445\u0432\u0438\u043B\u0438\u043D\u0443." :
                            lang === "ru" ? "\u23F3 \u041E\u043F\u043B\u0430\u0442\u0430 \u0435\u0449\u0451 \u043D\u0435 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0430. \u041F\u043E\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u0447\u0435\u0440\u0435\u0437 \u043C\u0438\u043D\u0443\u0442\u0443." :
                            "\u23F3 Payment not received yet. Try again in a minute.";
        await ctx.answerCbQuery(pendingText, { show_alert: true });
      }
    } catch (err) {
      console.error("Check mono payment error:", err);
      const errorText = lang === "uk" ? "\u274C \u041F\u043E\u043C\u0438\u043B\u043A\u0430 \u043F\u0435\u0440\u0435\u0432\u0456\u0440\u043A\u0438. \u0421\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u043F\u0456\u0437\u043D\u0456\u0448\u0435." :
                        lang === "ru" ? "\u274C \u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0438. \u041F\u043E\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u043F\u043E\u0437\u0436\u0435." :
                        "\u274C Check failed. Try again later.";
      await ctx.answerCbQuery(errorText, { show_alert: true });
    }
  });

  bot.action(/^bot_pay_method_(PRO|ENTERPRISE|GROUPS)_crypto$/, async (ctx) => {
    const tier = ctx.match[1];
    const tgId = ctx.from!.id.toString();
    const lang = await getLang(tgId);
    
    const usdPrices: Record<string, number> = { PRO: 10, ENTERPRISE: 35, GROUPS: 55 };
    const amount = usdPrices[tier];
    const CRYPTO_PAY_TOKEN = process.env.CRYPTO_PAY_API_TOKEN || "";
    
    if (!CRYPTO_PAY_TOKEN) {
      await ctx.answerCbQuery(lang === "uk" ? "Crypto Pay недоступний" : "Crypto Pay unavailable", { show_alert: true });
      return;
    }

    try {
      await ctx.answerCbQuery();
      
      const user = await storage.getUserByTgId(tgId);
      if (!user) return;

      const payment = await storage.createPayment({
        userId: user.id,
        tier,
        amountUsdt: String(amount),
        txHash: null,
        status: "pending",
      });

      const invoiceRes = await fetch("https://pay.crypt.bot/api/createInvoice", {
        method: "POST",
        headers: {
          "Crypto-Pay-API-Token": CRYPTO_PAY_TOKEN,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currency_type: "fiat",
          fiat: "USD",
          amount: String(amount),
          description: `DARKSHARE ${tier} (monthly) - Payment #${payment.id}`,
          payload: JSON.stringify({
            paymentId: payment.id,
            userId: user.id,
            tier,
            period: "monthly",
            requests: tier === "ENTERPRISE" || tier === "GROUPS" ? 500 : 50,
            periodDays: 30,
          }),
          expires_in: 600,
        }),
      });

      const invoiceData = await invoiceRes.json();

      if (!invoiceData.ok || !invoiceData.result) {
        const errText = lang === "uk" ? "❌ Помилка створення інвойсу" : lang === "ru" ? "❌ Ошибка создания инвойса" : "❌ Failed to create invoice";
        await ctx.reply(errText);
        return;
      }

      const invoice = invoiceData.result;
      const payUrl = invoice.bot_invoice_url || invoice.mini_app_invoice_url || invoice.web_app_invoice_url;

      const amountLabel = lang === "uk" ? "Сума" : lang === "ru" ? "Сумма" : lang === "es" ? "Monto" : lang === "de" ? "Betrag" : "Amount";
      const timeLabel = lang === "uk" ? "Час на оплату" : lang === "ru" ? "Время на оплату" : lang === "es" ? "Tiempo" : lang === "de" ? "Zahlungsfrist" : "Time to pay";
      const minStr = lang === "uk" ? "хв" : lang === "ru" ? "мин" : lang === "de" ? "Min" : "min";
      const autoActivateText = lang === "uk" ? "Після оплати тариф активується автоматично!" : lang === "ru" ? "После оплаты тариф активируется автоматически!" : lang === "es" ? "¡Tu plan se activará automáticamente después del pago!" : lang === "de" ? "Dein Tarif wird nach der Zahlung automatisch aktiviert!" : "Your plan will be activated automatically after payment!";
      const clickPayText = lang === "uk" ? "Натисніть кнопку нижче для оплати:" : lang === "ru" ? "Нажмите кнопку ниже для оплаты:" : lang === "es" ? "Haz clic en el botón de abajo para pagar:" : lang === "de" ? "Klicken Sie auf den Button unten:" : "Click the button below to pay:";

      const cryptoText =
        `${pe("diamond")} <b>Crypto Pay — ${escHtml(tier)}</b>\n\n` +
        `${pe("money")} ${escHtml(amountLabel)}: <b>$${amount} USD</b>\n` +
        `${pe("zap")} ${escHtml(timeLabel)}: 10 ${escHtml(minStr)}\n\n` +
        `${pe("check")} ${escHtml(autoActivateText)}\n\n` +
        `${pe("rocket")} ${escHtml(clickPayText)}`;

      const keyboard = Markup.inlineKeyboard([
        [Markup.button.url(`💎 ${lang === "uk" ? "Оплатити" : lang === "ru" ? "Оплатить" : "Pay"} $${amount}`, payUrl)],
        [cb(t(lang, "buttons.back"), `bot_pay_tier_${tier}`, "danger", E.back)]
      ]);

      try {
        await ctx.editMessageText(cryptoText, { parse_mode: "HTML", ...keyboard });
      } catch {
        await ctx.reply(cryptoText, { parse_mode: "HTML", ...keyboard });
      }
    } catch (err) {
      console.error("Bot Crypto Pay error:", err);
      await ctx.reply("❌ Error creating payment");
    }
  });

  bot.action(/^bot_pay_promo_(PRO|ENTERPRISE|GROUPS)$/, async (ctx) => {
    const tier = ctx.match[1];
    const tgId = ctx.from!.id.toString();
    const lang = await getLang(tgId);
    
    userStates.set(tgId, { module: "promo_payment", step: "input", data: { tier } });
    
    const text = `🎁 *${lang === "uk" ? "Промокод" : lang === "ru" ? "Промокод" : "Promo Code"}*\n\n${lang === "uk" ? "Введіть ваш промокод:" : lang === "ru" ? "Введите ваш промокод:" : "Enter your promo code:"}`;
    
    const keyboard = Markup.inlineKeyboard([
      [cb(t(lang, "buttons.back"), `bot_pay_tier_${tier}`, "danger", E.back)]
    ]);
    
    try {
      await ctx.editMessageText(text, { parse_mode: "Markdown", ...keyboard });
    } catch {
      await ctx.reply(text, { parse_mode: "Markdown", ...keyboard });
    }
  });

  bot.action(["buy_pro", "buy_enterprise", "buy_groups"], async (ctx) => {
    const tier = ctx.match.input === "buy_pro" ? "PRO" : ctx.match.input === "buy_groups" ? "GROUPS" : "ENTERPRISE";
    const tgId = ctx.from!.id.toString();
    const lang = await getLang(tgId);
    
    const uahPrices: Record<string, number> = { PRO: 410, ENTERPRISE: 1435, GROUPS: 2255 };
    const usdPrices: Record<string, number> = { PRO: 10, ENTERPRISE: 35, GROUPS: 55 };
    const starPrices: Record<string, number> = { PRO: 500, ENTERPRISE: 1750, GROUPS: 2750 };
    
    const text = `💳 *${tier}*\n\n${lang === "uk" ? "Сума" : lang === "ru" ? "Сумма" : "Amount"}: ${uahPrices[tier]} UAH (~$${usdPrices[tier]} USD)\n\n${lang === "uk" ? "Оберіть спосіб оплати:" : lang === "ru" ? "Выберите способ оплаты:" : "Select payment method:"}\n\n${lang === "uk" ? "💡 Сума в гривнях (UAH). Ваш банк автоматично конвертує з вашої валюти." : lang === "ru" ? "💡 Сумма в гривнах (UAH). Ваш банк автоматически конвертирует из вашей валюты." : "💡 Amount in UAH. Your bank converts automatically from your currency."}`;
    
    const keyboard = Markup.inlineKeyboard([
      [cb(`⭐ Telegram Stars (${starPrices[tier]} ⭐)`, `bot_pay_method_${tier}_stars`, "primary", E.star)],
      [cb("Google Pay / Apple Pay", `bot_pay_method_${tier}_monobank`, "primary", E.card)],
      [cb("Crypto Pay", `bot_pay_method_${tier}_crypto`, "success", E.money)],
      [cb((lang === "uk" ? "Промокод" : lang === "ru" ? "Промокод" : "Promo code"), `bot_pay_promo_${tier}`, "success", E.gift)],
      [cb(t(lang, "buttons.back"), "bot_payment", "danger", E.back)]
    ]);
    
    try {
      await ctx.editMessageText(text, { parse_mode: "Markdown", ...keyboard });
    } catch {
      await ctx.reply(text, { parse_mode: "Markdown", ...keyboard });
    }
  });

  bot.on("photo", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const state = userStates.get(tgId);

    if (state?.module === "admin_broadcast" && state?.step === "awaiting_photo") {
      if (!isAdmin(tgId)) {
        userStates.delete(tgId);
        const lang = await getLang(tgId);
        return ctx.reply(t(lang, "admin.accessDenied"));
      }

      const lang = await getLang(tgId);
      const photo = ctx.message.photo[ctx.message.photo.length - 1];
      const photoId = photo.file_id;
      const caption = ctx.message.caption || "";
      const existingData = state.data || {};

      userStates.set(tgId, { module: "admin_broadcast", step: "confirm", data: { ...existingData, type: "photo", photoId, message: caption, buttons: existingData.buttons || [] } });

      await showBroadcastPreview(ctx, tgId, lang, { ...existingData, type: "photo", photoId, message: caption, buttons: existingData.buttons || [] });
      return;
    }
    
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
        Markup.inlineKeyboard([[cb(t(lang, "buttons.back"), "back_to_dashboard", "danger", E.back)]])
      );

      for (const adminId of ADMIN_IDS) {
        try {
          await ctx.telegram.sendPhoto(adminId, fileId as string, {
            caption: `${t("uk", "admin.newPayment", { id: payment.id.toString() })}\n\n${t("uk", "admin.user", { username: user.username || t("uk", "common.na"), tgId: user.tgId })}\n${t("uk", "admin.tier", { tier: state.data.tier })}\n${t("uk", "admin.paymentAmount", { amount: state.data.amount })}\n${t("uk", "admin.type", { type: t(lang, "common.screenshot") })}`,
            reply_markup: Markup.inlineKeyboard([
              [
                cb(t("uk", "admin.approve"), `approve_pay_${payment.id}`, "success", E.check),
                cb(t("uk", "admin.reject"), `reject_pay_${payment.id}`, "danger", E.cross)
              ]
            ]).reply_markup
          });
        } catch (e) {
          console.log(`Failed to notify admin ${adminId}:`, e);
        }
      }
      return;
    }

    const user = await storage.getUserByTgId(tgId);
    if (!user) return;
    const lang = getUserLang(user.lang);

    const userTier = (user.tier || "FREE").toUpperCase();
    if (userTier === "FREE") {
      return ctx.reply(t(lang, "exif.proRequired"), 
        Markup.inlineKeyboard([[cb(t(lang, "buttons.upgrade"), "upgrade", "success", E.crown)]])
      );
    }

    if ((user.requestsLeft || 0) <= 0 && userTier !== "ENTERPRISE" && userTier !== "GROUPS") {
      return ctx.reply(t(lang, "check.noRequestsLeft"));
    }

    const photo = ctx.message.photo[ctx.message.photo.length - 1];
    const processingMsg = await ctx.reply(`🔍 ${t(lang, "exif.analyzing")}...`);
    
    try {
      const fileLink = await ctx.telegram.getFileLink(photo.file_id);
      const response = await fetch(fileLink.href);
      const arrayBuf = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuf);
      const filename = `photo_${photo.file_id.slice(0, 8)}.jpg`;

      const result = await extractExifFromBuffer(buffer, filename);

      if (userTier !== "ENTERPRISE" && userTier !== "GROUPS") {
        await storage.updateUser(user.id, { requestsLeft: Math.max(0, (user.requestsLeft || 0) - 1) });
      }
      creditPendingReferral(user).catch(() => {});

      await storage.createReport({
        userId: user.id,
        objectType: "exif",
        dataJson: {
          target: filename,
          riskScore: result.riskScore,
          riskLevel: result.riskLevel,
          findings: result.findings,
          details: result.details,
          sources: result.sources,
          summary: result.summary,
        },
      });

      const riskEmoji = result.riskLevel === "critical" ? "🔴" : 
                        result.riskLevel === "high" ? "🟠" : 
                        result.riskLevel === "medium" ? "🟡" : "🟢";

      let text = `${riskEmoji} *EXIF Analysis*\n`;
      text += `📄 ${escMd(filename)}\n`;
      text += `📊 Risk: ${result.riskScore}/100 (${result.riskLevel.toUpperCase()})\n\n`;

      if (result.findings.length > 0) {
        text += `*${t(lang, "exif.findings")}:*\n`;
        for (const f of result.findings.slice(0, 20)) {
          text += `• ${escMd(f)}\n`;
        }
      }

      if (result.details?.gps) {
        text += `\n🗺 [${t(lang, "exif.openMap")}](https://www.google.com/maps?q=${result.details.gps.latitude},${result.details.gps.longitude})`;
      }

      await ctx.telegram.editMessageText(ctx.chat!.id, processingMsg.message_id, undefined, text, { 
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([[cb(t(lang, "buttons.back"), "dashboard", "primary", E.home)]])
      });
    } catch (e: any) {
      console.error("EXIF analysis error:", e);
      await ctx.telegram.editMessageText(ctx.chat!.id, processingMsg.message_id, undefined, 
        `❌ ${t(lang, "exif.error")}: ${e.message}`);
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
        "enterprise": 999999,
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
          ...Markup.inlineKeyboard([[cb(t(userLang, "buttons.back"), "back_to_dashboard", "danger", E.back)]])
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
          Markup.inlineKeyboard([[cb(t(userLang, "payment.tryAgain"), "upgrade", "success", E.star)]])
        );
      } catch (e) {
        console.log(`Failed to notify user:`, e);
      }
    }

    await ctx.editMessageCaption(`${t("uk", "admin.rejected", { admin: ctx.from!.username || t("uk", "common.na") })}\n\n${t("uk", "admin.newPayment", { id: paymentId.toString() })}\n${t("uk", "admin.user", { username: user?.username || t("uk", "common.na"), tgId: user?.tgId || t("uk", "common.na") })}`);
    await ctx.answerCbQuery(t("uk", "admin.rejectedShort"));
  });

  // ==================== VPN ====================
  function vpnT(lang: Language, key: string): string {
    const dict: Record<string, Record<string, string>> = {
      title: { uk: "DARKSHARE VPN", ru: "DARKSHARE VPN", en: "DARKSHARE VPN", es: "DARKSHARE VPN", de: "DARKSHARE VPN" },
      tagline: {
        uk: "WireGuard · 0 логів · ~5 локацій",
        ru: "WireGuard · 0 логов · ~5 локаций",
        en: "WireGuard · zero logs · ~5 locations",
        es: "WireGuard · sin registros · ~5 ubicaciones",
        de: "WireGuard · keine Logs · ~5 Standorte",
      },
      proRequired: {
        uk: "VPN доступний на тарифах PRO / ENTERPRISE / GROUPS\n\nОтримай WireGuard-конфіг для до 3-х пристроїв за $35/міс.\nПромокод DARKNEU — мінус 50%.",
        ru: "VPN доступен на тарифах PRO / ENTERPRISE / GROUPS\n\nПолучи WireGuard-конфиг для 3-х устройств за $35/мес.\nПромокод DARKNEU — минус 50%.",
        en: "VPN is available on PRO / ENTERPRISE / GROUPS\n\nGet a WireGuard config for up to 3 devices for $35/mo.\nUse promo DARKNEU — 50% off.",
        es: "VPN disponible en PRO / ENTERPRISE / GROUPS\n\nObtén configuración WireGuard para hasta 3 dispositivos por $35/mes.\nPromo DARKNEU — 50% off.",
        de: "VPN ist in PRO / ENTERPRISE / GROUPS verfügbar\n\nWireGuard-Konfiguration für bis zu 3 Geräte für $35/Monat.\nPromo DARKNEU — 50% Rabatt.",
      },
      pickServer: { uk: "Обери локацію:", ru: "Выбери локацию:", en: "Pick a location:", es: "Elige ubicación:", de: "Standort wählen:" },
      yourPeers: { uk: "Твої активні підключення:", ru: "Твои активные подключения:", en: "Your active connections:", es: "Tus conexiones activas:", de: "Deine aktiven Verbindungen:" },
      noServers: { uk: "Сервери поки в розгортанні. Зайди трохи пізніше.", ru: "Серверы в процессе развертывания. Загляни позже.", en: "Servers are still being deployed. Check back soon.", es: "Servidores aún desplegándose. Vuelve pronto.", de: "Server werden gerade bereitgestellt. Schau bald wieder vorbei." },
      noPeers: { uk: "Підключень ще немає. Створи перше нижче ⤵️", ru: "Подключений ещё нет. Создай первое ниже ⤵️", en: "No connections yet. Create your first one below ⤵️", es: "Aún sin conexiones. Crea la primera abajo ⤵️", de: "Noch keine Verbindungen. Erstelle die erste unten ⤵️" },
      activate: { uk: "✨ Підключити", ru: "✨ Подключить", en: "✨ Connect", es: "✨ Conectar", de: "✨ Verbinden" },
      myPeers: { uk: "📋 Мої підключення", ru: "📋 Мои подключения", en: "📋 My connections", es: "📋 Mis conexiones", de: "📋 Meine Verbindungen" },
      back: { uk: "◀️ Назад", ru: "◀️ Назад", en: "◀️ Back", es: "◀️ Atrás", de: "◀️ Zurück" },
      buyPro: { uk: "💎 Купити PRO −50%", ru: "💎 Купить PRO −50%", en: "💎 Buy PRO −50%", es: "💎 Comprar PRO −50%", de: "💎 PRO kaufen −50%" },
      capacity: { uk: "Завантаження", ru: "Загрузка", en: "Load", es: "Carga", de: "Auslastung" },
      created: { uk: "✅ Створено!\n\nКонфіг надіслано окремим повідомленням нижче. Імпортуй його у застосунок WireGuard.", ru: "✅ Создано!\n\nКонфиг отправлен отдельным сообщением ниже. Импортируй его в приложение WireGuard.", en: "✅ Created!\n\nConfig sent in a separate message below. Import it into the WireGuard app.", es: "✅ ¡Creado!\n\nConfig enviada abajo. Impórtala en la app WireGuard.", de: "✅ Erstellt!\n\nKonfig unten gesendet. In WireGuard-App importieren." },
      revoke: { uk: "🗑 Відключити", ru: "🗑 Отключить", en: "🗑 Revoke", es: "🗑 Revocar", de: "🗑 Widerrufen" },
      revoked: { uk: "✅ Підключення відключено", ru: "✅ Подключение отключено", en: "✅ Connection revoked", es: "✅ Conexión revocada", de: "✅ Verbindung widerrufen" },
      limitReached: { uk: "⚠️ Досягнуто ліміт пристроїв на твоєму тарифі. Відключи одне зі старих з'єднань або оновись до Enterprise.", ru: "⚠️ Достигнут лимит устройств на твоём тарифе. Отключи одно из старых или обновись до Enterprise.", en: "⚠️ Device limit reached on your tier. Revoke an old connection or upgrade to Enterprise.", es: "⚠️ Límite de dispositivos alcanzado. Revoca una conexión antigua o actualiza a Enterprise.", de: "⚠️ Gerätelimit erreicht. Widerrufe eine alte Verbindung oder upgrade auf Enterprise." },
      configFile: { uk: "📎 Твій WireGuard конфіг", ru: "📎 Твой WireGuard конфиг", en: "📎 Your WireGuard config", es: "📎 Tu config WireGuard", de: "📎 Deine WireGuard-Konfig" },
      installApp: { uk: "📲 Встанови WireGuard:", ru: "📲 Установи WireGuard:", en: "📲 Install WireGuard:", es: "📲 Instala WireGuard:", de: "📲 Installiere WireGuard:" },
    };
    return dict[key]?.[lang] || dict[key]?.en || key;
  }

  async function showVpnMenu(ctx: any, tgId: string, isEdit: boolean = true) {
    const user = await storage.getUserByTgId(tgId);
    const lang = getUserLang(user?.lang);
    if (!user) {
      const text = `${pe("lock")} <b>${escHtml(vpnT(lang, "title"))}</b>\n\n${escHtml(vpnT(lang, "tagline"))}\n\n${pe("warning")} ${escHtml(vpnT(lang, "proRequired"))}`;
      const kb = Markup.inlineKeyboard([[cb(vpnT(lang, "back"), "back_to_dashboard", "danger", E.back)]]);
      return ctx.reply(text, { parse_mode: "HTML", ...kb });
    }
    const tier = (user.tier || "FREE").toUpperCase();
    const webUrl = process.env.WEB_DOMAIN || "https://www.darkshare.store";

    if (!isProTier(tier)) {
      const text = `${pe("lock")} <b>${escHtml(vpnT(lang, "title"))}</b>\n\n${escHtml(vpnT(lang, "tagline"))}\n\n${pe("warning")} ${escHtml(vpnT(lang, "proRequired"))}`;
      const kb = Markup.inlineKeyboard([
        [urlS(vpnT(lang, "buyPro"), `${webUrl}/pricing?plan=PRO&code=DARKNEU&src=bot_vpn`, "success", E.diamond)],
        [cb(vpnT(lang, "back"), "back_to_dashboard", "danger", E.back)],
      ]);
      try { await ctx.editMessageText(text, { parse_mode: "HTML", ...kb }); } catch { await ctx.reply(text, { parse_mode: "HTML", ...kb }); }
      return;
    }

    const [servers, peers] = await Promise.all([
      storage.listVpnServers(false),
      storage.listUserVpnPeers(user.id),
    ]);

    let text = `${pe("lock")} <b>${escHtml(vpnT(lang, "title"))}</b>\n${escHtml(vpnT(lang, "tagline"))}\n\n`;
    if (peers.length > 0) {
      text += `${pe("eye")} <b>${escHtml(vpnT(lang, "yourPeers"))}</b>\n`;
      peers.forEach((p, i) => {
        text += `${i + 1}. ${p.serverFlag} ${escHtml(p.serverRegion)} (<code>${escHtml(p.allowedIp)}</code>)\n`;
      });
      text += "\n";
    } else {
      text += `<i>${escHtml(vpnT(lang, "noPeers"))}</i>\n\n`;
    }
    if (servers.length === 0) {
      text += `<i>${escHtml(vpnT(lang, "noServers"))}</i>`;
    } else {
      text += `${pe("globe")} <b>${escHtml(vpnT(lang, "pickServer"))}</b>`;
    }

    const rows: any[][] = [];
    if (servers.length > 0) {
      const chunked: any[][] = [];
      for (let i = 0; i < servers.length; i += 2) chunked.push(servers.slice(i, i + 2));
      for (const row of chunked) {
        rows.push(
          row.map((s) => {
            const cap = s.capacity > 0 ? Math.min(100, Math.round(((s.used || 0) / s.capacity) * 100)) : 0;
            const label = `${s.flag} ${s.region} · ${cap}%`;
            return cb(label, `vpn_create_${s.id}`, "success", E.globe);
          })
        );
      }
    }
    if (peers.length > 0) {
      rows.push([cb(vpnT(lang, "myPeers"), "vpn_my_peers", "primary", E.eye)]);
    }
    rows.push([cb(vpnT(lang, "back"), "back_to_dashboard", "danger", E.back)]);

    const kb = Markup.inlineKeyboard(rows);
    try { await ctx.editMessageText(text, { parse_mode: "HTML", ...kb }); } catch { await ctx.reply(text, { parse_mode: "HTML", ...kb }); }
  }

  bot.command("vpn", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    await showVpnMenu(ctx, tgId, false);
  });

  bot.action("vpn_menu", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    await ctx.answerCbQuery();
    await showVpnMenu(ctx, tgId, true);
  });

  bot.action(/^vpn_create_(\d+)$/, async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const user = await storage.getUserByTgId(tgId);
    const lang = getUserLang(user?.lang);
    if (!user) return ctx.answerCbQuery("⛔");
    const tier = (user.tier || "FREE").toUpperCase();
    if (!isProTier(tier)) {
      await ctx.answerCbQuery("PRO required");
      return showVpnMenu(ctx, tgId, true);
    }
    const limits: Record<string, number> = { PRO: 3, ENTERPRISE: 10, GROUPS: 25 };
    const max = limits[tier] || 1;
    const existing = await storage.listUserVpnPeers(user.id);
    const activeCount = existing.filter((p: any) => p.status === "active").length;
    if (activeCount >= max) {
      await ctx.answerCbQuery(vpnT(lang, "limitReached"), { show_alert: true });
      return;
    }
    const serverId = parseInt((ctx.match as RegExpMatchArray)[1]);
    const server = await storage.getVpnServer(serverId);
    if (!server || server.status !== "active") {
      return ctx.answerCbQuery(lang === "uk" ? "Сервер недоступний" : lang === "ru" ? "Сервер недоступен" : "Server unavailable", { show_alert: true });
    }
    if (server.capacity > 0 && (server.used || 0) >= server.capacity) {
      return ctx.answerCbQuery(lang === "uk" ? "Сервер переповнений" : lang === "ru" ? "Сервер переполнен" : "Server full", { show_alert: true });
    }

    const { privateKey, publicKey } = generateWireGuardKeyPair();
    const presharedKey = generatePresharedKey();
    const allowedIp = allocatePeerIp(serverId, (server.used || 0) + 1);
    const peer = await storage.createVpnPeer({
      userId: user.id,
      serverId,
      peerPublicKey: publicKey,
      peerPrivateKey: privateKey,
      presharedKey,
      allowedIp,
      dns: "1.1.1.1, 1.0.0.1",
      status: "active",
    });
    await storage.incrementVpnServerUsed(serverId, 1);
    await ctx.answerCbQuery("✅");

    const conf = buildPeerConfig(
      { peerPrivateKey: privateKey, presharedKey, allowedIp, dns: "1.1.1.1, 1.0.0.1" },
      { serverPublicKey: server.serverPublicKey, publicEndpoint: server.publicEndpoint, port: server.port }
    );
    const filename = `darkshare-${server.countryCode.toLowerCase()}-${peer.id}.conf`;

    try {
      await ctx.editMessageText(vpnT(lang, "created"), { parse_mode: "Markdown" });
    } catch {}

    await ctx.replyWithDocument(
      { source: Buffer.from(conf, "utf-8"), filename },
      {
        caption: `${vpnT(lang, "configFile")} · ${server.flag} ${server.region}\n\n${vpnT(lang, "installApp")}\n• Android: play.google.com/store/apps/details?id=com.wireguard.android\n• iOS: apps.apple.com/app/wireguard/id1441195209\n• Win/Mac/Linux: wireguard.com/install`,
      }
    );

    setTimeout(() => showVpnMenu(ctx, tgId, false).catch(() => {}), 1500);
  });

  bot.action("vpn_my_peers", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const user = await storage.getUserByTgId(tgId);
    const lang = getUserLang(user?.lang);
    if (!user) return ctx.answerCbQuery("⛔");
    const peers = await storage.listUserVpnPeers(user.id);
    await ctx.answerCbQuery();
    if (peers.length === 0) {
      return showVpnMenu(ctx, tgId, true);
    }
    let text = `${pe("lock")} <b>${escHtml(vpnT(lang, "title"))}</b>\n\n${pe("eye")} <b>${escHtml(vpnT(lang, "yourPeers"))}</b>\n\n`;
    const rows: any[][] = [];
    peers.forEach((p, i) => {
      text += `${i + 1}. ${p.serverFlag} ${escHtml(p.serverRegion)}\n   <code>${escHtml(p.allowedIp)}</code>\n\n`;
      rows.push([cb(`${vpnT(lang, "revoke")} #${i + 1} · ${p.serverFlag}`, `vpn_revoke_${p.id}`, "danger", E.trash)]);
    });
    rows.push([cb(vpnT(lang, "back"), "vpn_menu", "primary", E.back)]);
    const kb = Markup.inlineKeyboard(rows);
    try { await ctx.editMessageText(text, { parse_mode: "HTML", ...kb }); } catch { await ctx.reply(text, { parse_mode: "HTML", ...kb }); }
  });

  bot.action(/^vpn_revoke_(\d+)$/, async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const user = await storage.getUserByTgId(tgId);
    const lang = getUserLang(user?.lang);
    if (!user) return ctx.answerCbQuery("⛔");
    const peerId = parseInt((ctx.match as RegExpMatchArray)[1]);
    const peer = await storage.getVpnPeer(peerId);
    if (!peer || peer.userId !== user.id) return ctx.answerCbQuery("⛔");
    await storage.revokeVpnPeer(peerId, user.id);
    if (peer.serverId) await storage.incrementVpnServerUsed(peer.serverId, -1);
    await ctx.answerCbQuery(vpnT(lang, "revoked"));
    await showVpnMenu(ctx, tgId, true);
  });

  bot.command("support", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const lang = await getLang(tgId);
    userStates.set(tgId, { module: "support", step: "name" });
    await ctx.reply(t(lang, "support.askName"), {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([[cb(t(lang, "buttons.cancel"), "back_to_dashboard", "danger", E.back)]])
    });
  });

  bot.action("open_support", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const lang = await getLang(tgId);
    userStates.set(tgId, { module: "support", step: "name" });
    const text = t(lang, "support.askName");
    const keyboard = Markup.inlineKeyboard([[cb(t(lang, "buttons.cancel"), "back_to_dashboard", "danger", E.back)]]);
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
    const keyboard = Markup.inlineKeyboard([[cb(t(lang, "buttons.back"), "back_to_dashboard", "danger", E.back)]]);
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
    
    const username = user.username || "—";
    const refCode = user.refCode || "—";
    
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
    
    const moduleEmojiSlots: Record<string, string> = {
      ip: pe("globe"), wallet: pe("diamond"), phone: pe("mobile"), email: pe("envelope"), domain: pe("globe"),
      url: pe("link"), cve: pe("bug"), hash: pe("search"), username: pe("user"), card: pe("card"),
      iot: pe("cog"), cloud: pe("globe")
    };
    
    const topTypesText = topCheckTypes.length > 0
      ? topCheckTypes.map(([type, count]) => `${moduleEmojiSlots[type] || pe("chart")} ${escHtml(type)}: <b>${count}</b>`).join("\n")
      : "—";
    
    const createdAt = user.createdAt 
      ? new Date(user.createdAt).toLocaleDateString(lang === "en" ? "en-US" : "uk-UA")
      : "—";
    
    const tierSlot = user.tier === "ENTERPRISE" ? "crown" : user.tier === "PRO" ? "diamond" : "star";
    const tierName = user.tier || "FREE";
    
    const tierBenefits = user.tier === "ENTERPRISE" 
      ? (lang === "uk" ? "API, SIEM, ∞ запитів" : lang === "ru" ? "API, SIEM, ∞ запросов" : "API, SIEM, ∞ checks")
      : user.tier === "PRO" 
        ? (lang === "uk" ? "∞ запитів, PDF, моніторинг" : lang === "ru" ? "∞ запросов, PDF, мониторинг" : "∞ checks, PDF, monitoring")
        : (lang === "uk" ? "5 запитів/день, 1 монітор" : lang === "ru" ? "5 запросов/день, 1 монитор" : "5 checks/day, 1 monitor");
    
    const riskHunterProgress = Math.min(totalChecks, 10);
    const scamSlayerProgress = Math.min(totalChecks, 50);
    const streakMasterProgress = Math.min(streakDays, 7);
    const referralKingProgress = Math.min(referralCount, 5);
    
    const riskHunterDone = riskHunterProgress >= 10 ? pe("check") : "⬜";
    const scamSlayerDone = scamSlayerProgress >= 50 ? pe("check") : "⬜";
    const streakMasterDone = streakMasterProgress >= 7 ? pe("check") : "⬜";
    const referralKingDone = referralKingProgress >= 5 ? pe("check") : "⬜";

    const lastActive = formatLastActivity(user.lastLogin, lang);

    const text = `${pe("user")} <b>${escHtml(lang === "uk" ? "Мій акаунт" : lang === "ru" ? "Мой аккаунт" : "My Account")}</b>

${pe("scroll")} <b>${escHtml(lang === "uk" ? "Профіль" : lang === "ru" ? "Профиль" : "Profile")}</b>
├ ${pe("pin")} ID: <code>${escHtml(tgId)}</code>
├ ${pe("user")} @${escHtml(username)}
├ ${pe(tierSlot)} ${escHtml(lang === "uk" ? "Тариф" : lang === "ru" ? "Тариф" : "Plan")}: <b>${escHtml(tierName)}</b>
├ ${pe("pin")} ${escHtml(createdAt)}
└ ${pe("link")} Ref: <code>${escHtml(refCode)}</code>

${pe("chart")} <b>${escHtml(lang === "uk" ? "Статистика" : lang === "ru" ? "Статистика" : "Statistics")}</b>
├ ${pe("search")} ${escHtml(lang === "uk" ? "Перевірок" : lang === "ru" ? "Проверок" : "Checks")}: <b>${totalChecks}</b>
├ ${pe("eye")} ${escHtml(lang === "uk" ? "Моніторів" : lang === "ru" ? "Мониторов" : "Monitors")}: <b>${activeMonitors}</b>
├ ${pe("people")} ${escHtml(lang === "uk" ? "Рефералів" : lang === "ru" ? "Рефералов" : "Referrals")}: <b>${referralCount}</b>
├ ${pe("fire")} ${escHtml(lang === "uk" ? "Серія" : lang === "ru" ? "Серия" : "Streak")}: <b>${streakDays}</b> ${escHtml(lang === "uk" ? "дн" : lang === "ru" ? "дн" : "days")}
└ ${pe("zap")} ${escHtml(lang === "uk" ? "Залишок" : lang === "ru" ? "Остаток" : "Left")}: <b>${user.requestsLeft ?? 3}</b>

${pe("trophy")} <b>${escHtml(lang === "uk" ? "Топ перевірки" : lang === "ru" ? "Топ проверки" : "Top checks")}</b>
${topTypesText}

${pe("trophy")} <b>${escHtml(lang === "uk" ? "Досягнення" : lang === "ru" ? "Достижения" : "Achievements")}</b>
${riskHunterDone} ${pe("trophy")} Risk Hunter — <b>${riskHunterProgress}/10</b>
${scamSlayerDone} ${pe("shield")} Scam Slayer — <b>${scamSlayerProgress}/50</b>
${streakMasterDone} ${pe("fire")} Streak Master — <b>${streakMasterProgress}/7</b>
${referralKingDone} ${pe("crown")} Referral King — <b>${referralKingProgress}/5</b>

${pe("diamond")} <b>${escHtml(lang === "uk" ? "Переваги тарифу" : lang === "ru" ? "Преимущества тарифа" : "Tier benefits")}</b>
└ ${escHtml(tierBenefits)}

${pe("globe")} <b>${escHtml(lang === "uk" ? "Мова" : lang === "ru" ? "Язык" : "Language")}:</b> ${escHtml(languageNames[lang])}`;

    const langFlags: Record<string, string> = { uk: "🇺🇦", en: "🇬🇧", ru: "🇷🇺", es: "🇪🇸", de: "🇩🇪" };
    const currentFlag = langFlags[lang] || "🌐";

    const keyboard = Markup.inlineKeyboard([
      [
        cb((lang === "uk" ? "Детальна статистика" : lang === "ru" ? "Подробная статистика" : "Detailed stats"), "profile_detailed_stats", "primary", E.chart),
        cb((lang === "uk" ? "Реф. посилання" : lang === "ru" ? "Реф. ссылка" : "Ref. link"), "profile_ref_link", "success", E.link)
      ],
      [
        cb("🇺🇦 UA", "set_lang_uk", lang === "uk" ? "success" : "primary", E.globe),
        cb("🇬🇧 EN", "set_lang_en", lang === "en" ? "success" : "primary", E.globe),
        cb("🇷🇺 RU", "set_lang_ru", lang === "ru" ? "success" : "primary", E.globe)
      ],
      [
        cb((lang === "uk" ? "Меню" : lang === "ru" ? "Меню" : "Menu"), "dashboard", "primary", E.home)
      ]
    ]);
    
    try {
      await ctx.editMessageText(text, { parse_mode: "HTML", ...keyboard });
    } catch (e: any) {
      if (e.message?.includes("message is not modified")) {
        return;
      }
      await ctx.reply(text, { parse_mode: "HTML", ...keyboard });
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
    
    const detailModuleEmojis: Record<string, string> = {
      ip: pe("globe"), wallet: pe("diamond"), phone: pe("mobile"), email: pe("envelope"), domain: pe("globe"),
      url: pe("link"), cve: pe("bug"), hash: pe("search"), username: pe("user"), card: pe("card"),
      iot: pe("cog"), cloud: pe("globe")
    };
    
    const allTypesText = Object.entries(checkTypeCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => `├ ${detailModuleEmojis[type] || pe("chart")} ${escHtml(type)}: <b>${count}</b>`)
      .join("\n") || "├ —";
    
    const detailTierSlot = user.tier === "ENTERPRISE" ? "crown" : user.tier === "PRO" ? "diamond" : "star";
    const detailTierLimits: Record<string, number> = { "FREE": 3, "BASIC": 30, "PRO": 50, "ENTERPRISE": 999999, "GROUPS": 999999 };
    const detailUserLimit = detailTierLimits[(user?.tier || "FREE").toUpperCase()] || 3;
    const requestsBar = generateProgressBar(user.requestsLeft || 0, detailUserLimit);
    const streakBar = generateProgressBar(Math.min(user.streakDays || 0, 30), 30);
    
    const joinDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString(lang === "en" ? "en-US" : "uk-UA") : "—";
    const lastActive = formatLastActivity(user.lastLogin, lang);

    const escapedUsername = user.username ? escHtml(user.username) : "—";
    
    const text = `${pe("chart")} <b>${escHtml(lang === "uk" ? "ДЕТАЛЬНА СТАТИСТИКА" : lang === "ru" ? "ПОДРОБНАЯ СТАТИСТИКА" : "DETAILED STATISTICS")}</b>

${pe("user")} <b>${escHtml(lang === "uk" ? "Профіль" : lang === "ru" ? "Профиль" : "Profile")}</b>
├ ${pe("pin")} ID: <code>${escHtml(user.tgId)}</code>
├ ${pe("user")} @${escapedUsername}
├ ${pe(detailTierSlot)} ${escHtml(lang === "uk" ? "Тариф" : lang === "ru" ? "Тариф" : "Tier")}: <b>${escHtml(user.tier || "FREE")}</b>
├ ${pe("pin")} ${escHtml(lang === "uk" ? "Реєстрація" : lang === "ru" ? "Регистрация" : "Registered")}: <b>${escHtml(joinDate)}</b>
└ ${pe("zap")} ${escHtml(lang === "uk" ? "Остання активність" : lang === "ru" ? "Последняя активность" : "Last active")}: <b>${escHtml(lastActive)}</b>

${pe("chart")} <b>${escHtml(lang === "uk" ? "Активність" : lang === "ru" ? "Активность" : "Activity")}</b>
├ ${pe("search")} ${escHtml(lang === "uk" ? "Перевірок" : lang === "ru" ? "Проверок" : "Checks")}: <b>${reports.length}</b>
├ ${pe("eye")} ${escHtml(lang === "uk" ? "Моніторів" : lang === "ru" ? "Мониторов" : "Monitors")}: <b>${watches.length}</b>
├ ${pe("people")} ${escHtml(lang === "uk" ? "Рефералів" : lang === "ru" ? "Рефералов" : "Referrals")}: <b>${referralStats.count}</b>
└ ${pe("fire")} ${escHtml(lang === "uk" ? "Серія" : lang === "ru" ? "Серия" : "Streak")}: <b>${user.streakDays || 0}</b> ${escHtml(lang === "uk" ? "дн" : lang === "ru" ? "дн" : "days")}

${pe("trophy")} <b>${escHtml(lang === "uk" ? "Перевірки по типах" : lang === "ru" ? "Проверки по типам" : "Checks by type")}</b>
${allTypesText}

${pe("rocket_up")} <b>${escHtml(lang === "uk" ? "Прогрес" : lang === "ru" ? "Прогресс" : "Progress")}</b>
├ ${pe("zap")} ${escHtml(lang === "uk" ? "Запити" : lang === "ru" ? "Запросы" : "Requests")}: <b>${user.requestsLeft || 0}/${detailUserLimit}</b>
│   <code>${escHtml(requestsBar)}</code>
└ ${pe("fire")} ${escHtml(lang === "uk" ? "Серія" : lang === "ru" ? "Серия" : "Streak")}: <b>${user.streakDays || 0}/30</b> ${escHtml(lang === "uk" ? "дн" : lang === "ru" ? "дн" : "days")}
    <code>${escHtml(streakBar)}</code>`;

    const keyboard = Markup.inlineKeyboard([
      [cb((lang === "uk" ? "Назад" : lang === "ru" ? "Назад" : "Back"), "profile", "danger", E.back)],
      [cb((lang === "uk" ? "Меню" : lang === "ru" ? "Меню" : "Menu"), "dashboard", "primary", E.home)]
    ]);
    
    try {
      await ctx.editMessageText(text, { parse_mode: "HTML", ...keyboard });
    } catch (err: any) {
      if (!err.message?.includes("message is not modified")) {
        try {
          await ctx.reply(text, { parse_mode: "HTML", ...keyboard });
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
    const botUsername = (await bot.telegram.getMe()).username || "DarkShare1Bot";
    const refLink = `t.me/${botUsername}?start=ref_${refCode}`;
    
    let referralStats = { count: 0, pendingCount: 0, referredUsers: [] as any[] };
    try {
      referralStats = await storage.getReferralStats(user.id);
    } catch (e) {}

    const text = `${pe("gift")} <b>${escHtml(lang === "uk" ? "РЕФЕРАЛЬНА ПРОГРАМА" : lang === "ru" ? "РЕФЕРАЛЬНАЯ ПРОГРАММА" : "REFERRAL PROGRAM")}</b>

${pe("link")} <b>${escHtml(lang === "uk" ? "Твоє посилання" : lang === "ru" ? "Твоя ссылка" : "Your link")}:</b>
<code>${escHtml(refLink)}</code>

${pe("key")} <b>${escHtml(lang === "uk" ? "Твій код" : lang === "ru" ? "Твой код" : "Your code")}:</b>
<code>${escHtml(refCode)}</code>

${pe("chart")} <b>${escHtml(lang === "uk" ? "Статистика" : lang === "ru" ? "Статистика" : "Statistics")}:</b>
├ ${pe("people")} ${escHtml(lang === "uk" ? "Запрошено" : lang === "ru" ? "Приглашено" : "Invited")}: <b>${referralStats.count}</b>
└ ${pe("trophy")} ${escHtml(lang === "uk" ? "До знижки -20%" : lang === "ru" ? "До скидки -20%" : "To -20% discount")}: <b>${Math.max(0, 5 - referralStats.count)}</b> ${escHtml(lang === "uk" ? "рефералів" : lang === "ru" ? "рефералов" : "referrals")}

${pe("gift")} <b>${escHtml(lang === "uk" ? "Бонуси" : lang === "ru" ? "Бонусы" : "Bonuses")}:</b>
├ ${pe("zap")} ${escHtml(lang === "uk" ? "Ти отримуєш" : lang === "ru" ? "Ты получаешь" : "You get")}: <b>+2</b> ${escHtml(lang === "uk" ? "запити" : lang === "ru" ? "запроса" : "requests")}
└ ${pe("rocket_up")} ${escHtml(lang === "uk" ? "Друг отримує" : lang === "ru" ? "Друг получает" : "Friend gets")}: <b>+5</b> ${escHtml(lang === "uk" ? "запитів" : lang === "ru" ? "запросов" : "requests")}

${pe("bulb")} ${escHtml(lang === "uk" ? "Поділись посиланням з друзями!" : lang === "ru" ? "Поделись ссылкой с друзьями!" : "Share the link with friends!")}`;

    const keyboard = Markup.inlineKeyboard([
      [urlS((lang === "uk" ? "Поділитись" : lang === "ru" ? "Поделиться" : "Share"), `https://t.me/share/url?url=${encodeURIComponent("https://" + refLink)}&text=${encodeURIComponent("🌑 DARKSHARE - OSINT Security Bot")}`, "success", E.link)],
      [cb((lang === "uk" ? "Назад" : lang === "ru" ? "Назад" : "Back"), "profile", "danger", E.back)],
      [cb((lang === "uk" ? "Меню" : lang === "ru" ? "Меню" : "Menu"), "dashboard", "primary", E.home)]
    ]);
    
    try {
      await ctx.editMessageText(text, { parse_mode: "HTML", ...keyboard });
    } catch {
      await ctx.reply(text, { parse_mode: "HTML", ...keyboard });
    }
  });

  bot.action("achievements", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const lang = await getLang(tgId);

    const titleText = lang === "uk" ? "Досягнення" : lang === "ru" ? "Достижения" : lang === "es" ? "Logros" : lang === "de" ? "Erfolge" : "Achievements";
    const riskHunterName = lang === "uk" ? "Мисливець за ризиками" : lang === "ru" ? "Охотник за рисками" : lang === "es" ? "Cazador de Riesgos" : lang === "de" ? "Risiko-Jäger" : "Risk Hunter";
    const scamSlayerName = lang === "uk" ? "Знищувач скаму" : lang === "ru" ? "Истребитель скама" : lang === "es" ? "Cazador de Estafas" : lang === "de" ? "Scam-Schlächter" : "Scam Slayer";
    const streakMasterName = lang === "uk" ? "Майстер серій" : lang === "ru" ? "Мастер серий" : lang === "es" ? "Maestro de Rachas" : lang === "de" ? "Serien-Meister" : "Streak Master";
    const referralKingName = lang === "uk" ? "Король рефералів" : lang === "ru" ? "Король рефералов" : lang === "es" ? "Rey de Referidos" : lang === "de" ? "Empfehlungs-König" : "Referral King";
    const checksLabel = lang === "uk" ? "перевірок" : lang === "ru" ? "проверок" : lang === "es" ? "comprob." : lang === "de" ? "Prüfungen" : "checks";
    const daysRowLabel = lang === "uk" ? "днів поспіль" : lang === "ru" ? "дней подряд" : lang === "es" ? "días seguidos" : lang === "de" ? "Tage in Folge" : "days streak";
    const refsLabel = lang === "uk" ? "рефералів" : lang === "ru" ? "рефералов" : lang === "es" ? "referidos" : lang === "de" ? "Empfehlungen" : "referrals";
    const unlockText = lang === "uk" ? "Розблокуй бейджі та отримуй бонусні запити!" : lang === "ru" ? "Разблокируй бейджи и получай бонусные запросы!" : lang === "es" ? "¡Desbloquea insignias y consigue solicitudes bonus!" : lang === "de" ? "Schalte Abzeichen frei und hol dir Bonus-Anfragen!" : "Unlock badges and get bonus requests!";

    const text =
      `${pe("game")} <b>${escHtml(titleText)}</b>\n\n` +
      `${pe("trophy")} <b>${escHtml(riskHunterName)}</b> — 10 ${escHtml(checksLabel)} (0/10)\n` +
      `${pe("shield")} <b>${escHtml(scamSlayerName)}</b> — 50 ${escHtml(checksLabel)} (0/50)\n` +
      `${pe("fire")} <b>${escHtml(streakMasterName)}</b> — 7 ${escHtml(daysRowLabel)} (0/7)\n` +
      `${pe("crown")} <b>${escHtml(referralKingName)}</b> — 5 ${escHtml(refsLabel)} (0/5)\n\n` +
      `${pe("gift")} <i>${escHtml(unlockText)}</i>`;

    const keyboard = Markup.inlineKeyboard([[cb(t(lang, "buttons.back"), "back_to_dashboard", "danger", E.back)]]);
    try {
      await ctx.editMessageText(text, { parse_mode: "HTML", ...keyboard });
    } catch {
      await ctx.reply(text, { parse_mode: "HTML", ...keyboard });
    }
  });

  const buildHistoryView = async (tgId: string) => {
    const lang = await getLang(tgId);
    const user = await storage.getUserByTgId(tgId);
    const webUrl = process.env.WEB_DOMAIN || "https://www.darkshare.store";

    if (!user) {
      return {
        text: `${t(lang, "history.title")}\n\n${t(lang, "history.empty")}`,
        keyboard: Markup.inlineKeyboard([[cb(t(lang, "buttons.back"), "back_to_dashboard", "danger", E.back)]]),
      };
    }

    const reports = await storage.getReports(user.id);
    const watches = await storage.getWatches(user.id).catch(() => [] as any[]);
    const recent = (reports || []).slice().sort((a: any, b: any) => {
      const ad = a.generatedAt ? new Date(a.generatedAt).getTime() : 0;
      const bd = b.generatedAt ? new Date(b.generatedAt).getTime() : 0;
      return bd - ad;
    }).slice(0, 10);

    const fmtDate = (d: any) => {
      try {
        const dt = new Date(d);
        return dt.toLocaleString(lang === "uk" ? "uk-UA" : lang === "ru" ? "ru-RU" : lang === "es" ? "es-ES" : lang === "de" ? "de-DE" : "en-US", { dateStyle: "short", timeStyle: "short" });
      } catch { return ""; }
    };
    const riskPe = (lvl: string) => lvl === "critical" ? pe("ghost") : lvl === "high" ? pe("high_risk") : lvl === "medium" ? pe("med_risk") : pe("low_risk");

    const heading = `${pe("scroll")} <b>${escHtml(t(lang, "history.title"))}</b>\n${escHtml(t(lang, "history.description"))}`;
    const reportsLabel = lang === "uk" ? "Звітів" : lang === "ru" ? "Отчётов" : lang === "es" ? "Informes" : lang === "de" ? "Berichte" : "Reports";
    const monitoringLabel = lang === "uk" ? "Моніторинг" : lang === "ru" ? "Мониторинг" : lang === "es" ? "Monitoreo" : lang === "de" ? "Monitoring" : "Monitoring";
    const stats = `\n\n${pe("scroll")} ${escHtml(reportsLabel)}: <b>${reports.length}</b> · ${pe("eye")} ${escHtml(monitoringLabel)}: <b>${watches.length}</b>`;

    let body: string;
    if (recent.length === 0) {
      body = `\n\n${escHtml(t(lang, "history.empty"))}\n\n${escHtml(t(lang, "history.addMonitor"))}`;
    } else {
      const recentLabel = lang === "uk" ? "Останні перевірки:" : lang === "ru" ? "Последние проверки:" : lang === "es" ? "Comprobaciones recientes:" : lang === "de" ? "Letzte Checks:" : "Recent checks:";
      const lines = recent.map((r: any, i: number) => {
        const data = (r.dataJson || {}) as any;
        const lvl = String(data.riskLevel || r.riskLevel || "low");
        const score = Number(data.riskScore ?? r.riskScore ?? 0);
        const rawTarget = String(data.target ?? r.target ?? r.verificationId ?? "—");
        const safeTarget = rawTarget.replace(/[<>&"'`\[\]]/g, "").slice(0, 36);
        const date = fmtDate(r.generatedAt);
        const objType = (r.objectType || data.objectType || "").toString().toUpperCase();
        return `${i + 1}. ${riskPe(lvl)} <code>${escHtml(safeTarget)}</code> · ${escHtml(objType)} · <b>${score}/100</b> · ${escHtml(date)}`;
      }).join("\n");
      body = `\n\n${pe("search")} <b>${escHtml(recentLabel)}</b>\n${lines}`;
    }

    const text = `${heading}${stats}${body}`;

    const buttons: any[][] = [
      [urlS(lang === "uk" ? "🌐 Відкрити веб-історію" : lang === "ru" ? "🌐 Открыть веб-историю" : lang === "es" ? "🌐 Abrir historial web" : lang === "de" ? "🌐 Web-Verlauf öffnen" : "🌐 Open web history", `${webUrl}/history`, "primary", E.globe)],
      [cb(t(lang, "buttons.monitoring"), "monitoring", "primary", E.eye)],
      [cb(t(lang, "buttons.back"), "back_to_dashboard", "danger", E.back)],
    ];
    return { text, keyboard: Markup.inlineKeyboard(buttons) };
  };

  bot.action("history", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const { text, keyboard } = await buildHistoryView(tgId);
    try {
      await ctx.editMessageText(text, { parse_mode: "HTML", ...keyboard });
    } catch {
      await ctx.reply(text, { parse_mode: "HTML", ...keyboard });
    }
  });

  bot.command("history", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const { text, keyboard } = await buildHistoryView(tgId);
    await ctx.reply(text, { parse_mode: "HTML", ...keyboard });
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
          [cb((lang === "uk" ? "Оновити" : lang === "ru" ? "Обновить" : "Refresh"), "admin_stats", "danger", E.bolt)],
          [cb(t(lang, "admin.back"), "admin_back", "danger", E.back)]
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
        const escapedUsername = u.username ? escMd(u.username) : "";
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
          [cb(t(lang, "admin.refresh"), "admin_users", "danger", E.bolt)],
          [cb(t(lang, "admin.back"), "admin_back", "danger", E.back)]
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
        const escapedUsername = user?.username ? escMd(user.username) : "";
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
        cb(`✅ #${p.id}`, `approve_pay_${p.id}`, "success", E.check),
        cb(`❌ #${p.id}`, `reject_pay_${p.id}`, "danger", E.cross)
      ]);
    });
    
    buttons.push([cb(t(lang, "admin.refresh"), "admin_payments", "danger", E.bolt)]);
    buttons.push([cb(t(lang, "admin.back"), "admin_back", "danger", E.back)]);

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
    
    const stats = await storage.getStats();
    
    const text = `📢 *${lang === "uk" ? "Розсилка" : lang === "ru" ? "Рассылка" : "Broadcast"}*\n\n` +
      `👥 ${lang === "uk" ? "Користувачів" : lang === "ru" ? "Пользователей" : "Users"}: *${stats.totalUsers}*\n\n` +
      `${lang === "uk" ? "Оберіть тип розсилки:" : lang === "ru" ? "Выберите тип рассылки:" : "Select broadcast type:"}`;

    await ctx.editMessageText(text, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [
          cb((lang === "uk" ? "Текст" : lang === "ru" ? "Текст" : "Text"), "admin_broadcast_type_text", "primary", E.doc),
          cb((lang === "uk" ? "Фото" : lang === "ru" ? "Фото" : "Photo"), "admin_broadcast_type_photo", "primary", E.eye)
        ],
        [cb(t(lang, "admin.cancel"), "admin_back", "danger", E.back)]
      ])
    });
  });

  bot.action("admin_broadcast_type_text", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const lang = await getLang(tgId);
    if (!isAdmin(tgId)) return ctx.answerCbQuery(t(lang, "admin.accessDenied"));

    userStates.set(tgId, { module: "admin_broadcast", step: "awaiting_message", data: { type: "text", buttons: [] } });

    const text = `📝 *${lang === "uk" ? "Текстова розсилка" : lang === "ru" ? "Текстовая рассылка" : "Text Broadcast"}*\n\n` +
      `${lang === "uk" ? "Надішліть текст повідомлення:" : lang === "ru" ? "Отправьте текст сообщения:" : "Send the message text:"}\n` +
      `${t(lang, "admin.markdownSupported")}`;

    await ctx.editMessageText(text, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([[cb(t(lang, "admin.cancel"), "admin_back", "danger", E.back)]])
    });
  });

  bot.action("admin_broadcast_type_photo", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const lang = await getLang(tgId);
    if (!isAdmin(tgId)) return ctx.answerCbQuery(t(lang, "admin.accessDenied"));

    userStates.set(tgId, { module: "admin_broadcast", step: "awaiting_photo", data: { type: "photo", buttons: [] } });

    const text = `📷 *${lang === "uk" ? "Фото розсилка" : lang === "ru" ? "Фото рассылка" : "Photo Broadcast"}*\n\n` +
      `${lang === "uk" ? "Надішліть фото з підписом (або без):" : lang === "ru" ? "Отправьте фото с подписью (или без):" : "Send a photo with caption (or without):"}`;

    await ctx.editMessageText(text, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([[cb(t(lang, "admin.cancel"), "admin_back", "danger", E.back)]])
    });
  });

  bot.action("admin_broadcast_add_btn", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const lang = await getLang(tgId);
    if (!isAdmin(tgId)) return ctx.answerCbQuery(t(lang, "admin.accessDenied"));

    const state = userStates.get(tgId);
    if (!state?.data) return;

    userStates.set(tgId, { ...state, step: "awaiting_btn_text" });

    const btnCount = state.data.buttons?.length || 0;
    const text = `🔘 *${lang === "uk" ? "Додати кнопку" : lang === "ru" ? "Добавить кнопку" : "Add Button"}* (${btnCount + 1}/6)\n\n` +
      `${lang === "uk" ? "Надішліть текст кнопки:" : lang === "ru" ? "Отправьте текст кнопки:" : "Send button text:"}`;

    try {
      await ctx.editMessageText(text, {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([[cb(t(lang, "admin.cancel"), "admin_broadcast_skip_btns", "danger", E.back)]])
      });
    } catch {
      await ctx.reply(text, {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([[cb(t(lang, "admin.cancel"), "admin_broadcast_skip_btns", "danger", E.back)]])
      });
    }
  });

  bot.action("admin_broadcast_skip_btns", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const lang = await getLang(tgId);
    if (!isAdmin(tgId)) return ctx.answerCbQuery(t(lang, "admin.accessDenied"));

    const state = userStates.get(tgId);
    if (!state?.data) return;

    userStates.set(tgId, { ...state, step: "confirm" });
    await showBroadcastPreview(ctx, tgId, lang, state.data);
  });

  bot.action("admin_broadcast_remove_btn", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const lang = await getLang(tgId);
    if (!isAdmin(tgId)) return ctx.answerCbQuery(t(lang, "admin.accessDenied"));

    const state = userStates.get(tgId);
    if (!state?.data?.buttons?.length) return;

    state.data.buttons.pop();
    userStates.set(tgId, { ...state, step: "confirm" });
    await showBroadcastPreview(ctx, tgId, lang, state.data);
  });

  async function showBroadcastPreview(ctx: any, tgId: string, lang: Language, data: any) {
    const btnsText = data.buttons?.length
      ? "\n\n🔘 " + (lang === "uk" ? "Кнопки" : lang === "ru" ? "Кнопки" : "Buttons") + ":\n" +
        data.buttons.map((b: any, i: number) => `  ${i + 1}. [${b.text}](${b.url})`).join("\n")
      : "";

    const typeLabel = data.type === "photo"
      ? (lang === "uk" ? "📷 Фото + підпис" : lang === "ru" ? "📷 Фото + подпись" : "📷 Photo + caption")
      : (lang === "uk" ? "📝 Текст" : lang === "ru" ? "📝 Текст" : "📝 Text");

    const previewText = `👁 *${lang === "uk" ? "Попередній перегляд" : lang === "ru" ? "Предпросмотр" : "Preview"}*\n\n` +
      `${lang === "uk" ? "Тип" : lang === "ru" ? "Тип" : "Type"}: ${typeLabel}\n\n` +
      `${lang === "uk" ? "Повідомлення" : lang === "ru" ? "Сообщение" : "Message"}:\n${data.message || (lang === "uk" ? "(без тексту)" : lang === "ru" ? "(без текста)" : "(no text)")}` +
      btnsText + "\n\n" +
      `${lang === "uk" ? "Підтвердити відправку?" : lang === "ru" ? "Подтвердить отправку?" : "Confirm sending?"}`;

    const keyboardRows: any[][] = [];
    if ((data.buttons?.length || 0) < 6) {
      keyboardRows.push([cb((lang === "uk" ? "Додати кнопку" : lang === "ru" ? "Добавить кнопку" : "Add Button"), "admin_broadcast_add_btn", "primary", E.link)]);
    }
    if (data.buttons?.length > 0) {
      keyboardRows.push([cb((lang === "uk" ? "Видалити останню" : lang === "ru" ? "Удалить последнюю" : "Remove Last"), "admin_broadcast_remove_btn", "danger", E.trash)]);
    }
    keyboardRows.push([
      cb(t(lang, "admin.send"), "admin_broadcast_confirm", "success", E.check),
      cb(t(lang, "admin.cancel"), "admin_broadcast_cancel", "danger", E.back)
    ]);

    try {
      await ctx.editMessageText(previewText, {
        parse_mode: "Markdown",
        disable_web_page_preview: true,
        ...Markup.inlineKeyboard(keyboardRows)
      });
    } catch {
      await ctx.reply(previewText, {
        parse_mode: "Markdown",
        disable_web_page_preview: true,
        ...Markup.inlineKeyboard(keyboardRows)
      });
    }
  }

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
    if (!state?.data) {
      return ctx.answerCbQuery(t(lang, "admin.messageNotFound"));
    }
    
    const data = state.data;
    userStates.delete(tgId);
    
    const allUsers = await storage.getAllUsers();
    let successCount = 0;
    let failCount = 0;
    
    await ctx.editMessageText(t(lang, "admin.broadcastStarted"));

    const inlineButtons = data.buttons?.length
      ? data.buttons.map((b: any) => [Markup.button.url(b.text, b.url)])
      : undefined;
    const replyMarkup = inlineButtons ? Markup.inlineKeyboard(inlineButtons).reply_markup : undefined;
    
    for (const u of allUsers) {
      if (u.blocked) continue;
      
      try {
        if (data.type === "photo" && data.photoId) {
          await ctx.telegram.sendPhoto(u.tgId, data.photoId, {
            caption: data.message || undefined,
            parse_mode: "Markdown",
            reply_markup: replyMarkup
          });
        } else {
          await ctx.telegram.sendMessage(u.tgId, data.message || "", {
            parse_mode: "Markdown",
            reply_markup: replyMarkup
          });
        }
        successCount++;
      } catch (e) {
        failCount++;
      }
      
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    await ctx.reply(`${t(lang, "admin.broadcastComplete")}\n\n${t(lang, "admin.sent")} ${successCount}\n${t(lang, "admin.errors")} ${failCount}`, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([[cb(t(lang, "admin.back"), "admin_back", "danger", E.back)]])
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
      ...Markup.inlineKeyboard([[cb(t(lang, "admin.cancel"), "admin_back", "danger", E.back)]])
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
      ...Markup.inlineKeyboard([[cb(t(lang, "admin.cancel"), "admin_back", "danger", E.back)]])
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
    
    const tierLimits: Record<string, number> = { FREE: 3, PRO: 50, ENTERPRISE: 999999, GROUPS: 999999 };
    const newRequests = tierLimits[newTier] || 3;
    await storage.updateUser(userId, { tier: newTier, requestsLeft: newRequests });
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
    
    const escapedUsername = user.username ? escMd(user.username) : user.tgId;
    const text = `${t(lang, "admin.tierChangedSuccess")}\n\n` +
      `${t(lang, "admin.userLabel")} @${escapedUsername}\n` +
      `${t(lang, "admin.newTierLabel")} ${newTier}`;

    await ctx.editMessageText(text, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([[cb(t(lang, "admin.back"), "admin_back", "danger", E.back)]])
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
      ...Markup.inlineKeyboard([[cb(t(lang, "admin.cancel"), "admin_back", "danger", E.back)]])
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
      `├ 🆓 FREE: ${lang === "uk" ? "3 пробних" : lang === "ru" ? "3 пробных" : "3 trial"}\n` +
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
        [cb((lang === "uk" ? "Оновити" : lang === "ru" ? "Обновить" : "Refresh"), "admin_settings", "danger", E.bolt)],
        [cb(t(lang, "admin.back"), "admin_back", "danger", E.back)]
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
        const escapedUsername = u.username ? escMd(u.username) : u.tgId;
        const tierEmoji = u.tier === "ENTERPRISE" ? "👑" : u.tier === "PRO" ? "⭐" : "🆓";
        text += `${i + 1}. ${tierEmoji} @${escapedUsername}\n`;
      });
    }
    
    if (recentUsers.length > onlineNow.length) {
      text += `\n📋 *${lang === "uk" ? "Нещодавно активні:" : lang === "ru" ? "Недавно активные:" : "Recently active:"}*\n`;
      recentUsers.filter(u => !onlineNow.includes(u)).slice(0, 10).forEach((u, i) => {
        const escapedUsername = u.username ? escMd(u.username) : u.tgId;
        const tierEmoji = u.tier === "ENTERPRISE" ? "👑" : u.tier === "PRO" ? "⭐" : "🆓";
        const lastTime = u.lastLogin ? new Date(u.lastLogin).toLocaleTimeString() : "?";
        text += `${i + 1}. ${tierEmoji} @${escapedUsername} (${lastTime})\n`;
      });
    }
    
    await ctx.editMessageText(text, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [cb((lang === "uk" ? "Оновити" : lang === "ru" ? "Обновить" : "Refresh"), "admin_online", "danger", E.bolt)],
        [cb(t(lang, "admin.back"), "admin_back", "danger", E.back)]
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
    
    const escapedUsername = user.username ? escMd(user.username) : null;
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
      `├ ${t(lang, "admin.registrationDate")} ${user.createdAt ? new Date(user.createdAt).toLocaleDateString(dateLocale) : "—"}\n` +
      (() => {
        if (user.subscriptionExpiresAt) {
          const expDate = new Date(user.subscriptionExpiresAt);
          const daysLeft = Math.max(0, Math.ceil((expDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
          const expStr = expDate.toLocaleDateString(dateLocale);
          const statusIcon = daysLeft <= 0 ? "🔴" : daysLeft <= 7 ? "🟠" : "🟢";
          const expiryLabel = lang === "uk" ? "Підписка до" : lang === "ru" ? "Подписка до" : "Subscription until";
          const daysLabel = lang === "uk" ? "днів" : lang === "ru" ? "дней" : "days";
          return `└ ${statusIcon} ${expiryLabel}: ${expStr} (${daysLeft} ${daysLabel})`;
        }
        return `└ ${lang === "uk" ? "Без підписки" : lang === "ru" ? "Без подписки" : "No subscription"}`;
      })() + `\n\n` +
      `${t(lang, "admin.activityTitle")}\n` +
      `├ ${t(lang, "admin.reportsLabel")} ${reports.length}\n` +
      `└ ${t(lang, "admin.monitorsLabel")} ${watches.length}`;

    const buttons: any[][] = [];
    
    buttons.push([
      cb(user.blocked ? t(lang, "admin.unblock") : t(lang, "admin.block"), `admin_toggle_block_${user.id}`, "danger", E.cross),
    ]);
    
    buttons.push([
      cb("FREE", `admin_set_tier_${user.id}_FREE`, "danger", E.star),
      cb("PRO", `admin_set_tier_${user.id}_PRO`, "success", E.star),
      cb("ENT", `admin_set_tier_${user.id}_ENTERPRISE`, "primary", E.crown),
    ]);
    
    buttons.push([cb(t(lang, "admin.back"), "admin_back", "danger", E.back)]);

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
      const escapedUsername = updatedUser.username ? escMd(updatedUser.username) : null;
      
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
        cb(updatedUser.blocked ? t(lang, "admin.unblock") : t(lang, "admin.block"), `admin_toggle_block_${updatedUser.id}`, "danger", E.cross),
      ]);
      buttons.push([
        cb("FREE", `admin_set_tier_${updatedUser.id}_FREE`, "danger", E.star),
        cb("PRO", `admin_set_tier_${updatedUser.id}_PRO`, "success", E.star),
        cb("ENT", `admin_set_tier_${updatedUser.id}_ENTERPRISE`, "primary", E.crown),
      ]);
      buttons.push([cb(t(lang, "admin.back"), "admin_back", "danger", E.back)]);

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
        ...Markup.inlineKeyboard([[cb(t(lang, "admin.back"), "admin_back", "danger", E.back)]])
      });
    }
    
    let text = t(lang, "admin.ticketsTitle") + "\n\n";
    const buttons: any[][] = [];
    
    openTickets.slice(0, 10).forEach((tk, i) => {
      text += `${i + 1}. ${t(lang, "admin.ticketFrom")} ${tk.name || tk.contact || "?"}\n`;
      text += `   ${t(lang, "admin.ticketStatus")} ${tk.status}\n`;
      text += `   ${t(lang, "admin.ticketDate")} ${tk.createdAt ? new Date(tk.createdAt).toLocaleDateString() : "?"}\n\n`;
      buttons.push([
        cb(`#${tk.id} - ${(tk.message || "").slice(0, 20)}...`, `admin_ticket_view_${tk.id}`, "primary", E.msg)
      ]);
    });
    
    buttons.push([cb(t(lang, "admin.back"), "admin_back", "danger", E.back)]);
    
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
    
    const escapeMd = (s: string) => s.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
    const msgText = ticket.message ? escapeMd(ticket.message).slice(0, 500) : "—";
    const replyText = ticket.adminReply ? escapeMd(ticket.adminReply) : "";
    const text = t(lang, "admin.ticketsTitle") + "\n\n" +
      `${t(lang, "admin.ticketFrom")} ${escapeMd(ticket.name || ticket.contact || "?")}\n` +
      `${t(lang, "admin.ticketStatus")} ${ticket.status}\n` +
      `${t(lang, "admin.ticketDate")} ${ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : "?"}\n\n` +
      `${t(lang, "admin.ticketMessage")}\n${msgText}` +
      (ticket.adminReply ? `\n\n${t(lang, "admin.ticketReply")} ${replyText}` : "");
    
    await ctx.editMessageText(text, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [
          cb(t(lang, "admin.ticketReply"), `admin_ticket_reply_${ticketId}`, "primary", E.msg),
          cb(t(lang, "admin.ticketClose"), `admin_ticket_close_${ticketId}`, "danger", E.check)
        ],
        [cb(t(lang, "admin.back"), "admin_tickets", "danger", E.msg)]
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
      ...Markup.inlineKeyboard([[cb(t(lang, "admin.cancel"), "admin_tickets", "danger", E.back)]])
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
        ...Markup.inlineKeyboard([[cb(t(lang, "admin.back"), "admin_back", "danger", E.back)]])
      });
    }
    
    let text = t(lang, "admin.ticketsTitle") + "\n\n";
    const buttons: any[][] = [];
    
    openTickets.slice(0, 10).forEach((tk, i) => {
      text += `${i + 1}. ${t(lang, "admin.ticketFrom")} ${tk.name || tk.contact || "?"}\n`;
      text += `   ${t(lang, "admin.ticketStatus")} ${tk.status}\n\n`;
      buttons.push([
        cb(`#${tk.id} - ${(tk.message || "").slice(0, 20)}...`, `admin_ticket_view_${tk.id}`, "primary", E.msg)
      ]);
    });
    
    buttons.push([cb(t(lang, "admin.back"), "admin_back", "danger", E.back)]);
    
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
        [cb((lang === "uk" ? "Оновити" : lang === "ru" ? "Обновить" : "Refresh"), "admin_revenue", "danger", E.bolt)],
        [cb(t(lang, "admin.back"), "admin_back", "danger", E.back)]
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
        ...Markup.inlineKeyboard([[cb(t(lang, "admin.back"), "admin_back", "danger", E.back)]])
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
        text += `${i + 1}. ${escMd(u.username || "?")} - ${u.checksCount} checks\n`;
      });
    }
    
    await ctx.editMessageText(text, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([[cb(t(lang, "admin.back"), "admin_back", "danger", E.back)]])
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
          [cb(t(lang, "admin.createCoupon"), "admin_coupon_create", "success", E.gift)],
          [cb(t(lang, "admin.back"), "admin_back", "danger", E.back)]
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
      buttons.push([cb(`${t(lang, "admin.deleteCoupon")} ${c.code}`, `admin_coupon_delete_${c.id}`, "danger", E.trash)]);
    });
    
    buttons.push([cb(t(lang, "admin.createCoupon"), "admin_coupon_create", "success", E.gift)]);
    buttons.push([cb(t(lang, "admin.back"), "admin_back", "danger", E.back)]);
    
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
      ...Markup.inlineKeyboard([[cb(t(lang, "admin.cancel"), "admin_coupons", "danger", E.back)]])
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
          [cb(t(lang, "admin.createCoupon"), "admin_coupon_create", "success", E.gift)],
          [cb(t(lang, "admin.back"), "admin_back", "danger", E.back)]
        ])
      });
    }
    
    let text = t(lang, "admin.couponsTitle") + "\n\n";
    const buttons: any[][] = [];
    
    coupons.forEach((c, i) => {
      text += `${i + 1}. ${t(lang, "admin.couponCode")} \`${c.code}\`\n`;
      text += `   ${t(lang, "admin.couponDiscount")} ${c.value}%\n`;
      text += `   ${t(lang, "admin.couponUses")} ${c.usedCount || 0}/${c.maxUses || "inf"}\n\n`;
      buttons.push([cb(`${t(lang, "admin.deleteCoupon")} ${c.code}`, `admin_coupon_delete_${c.id}`, "danger", E.trash)]);
    });
    
    buttons.push([cb(t(lang, "admin.createCoupon"), "admin_coupon_create", "success", E.gift)]);
    buttons.push([cb(t(lang, "admin.back"), "admin_back", "danger", E.back)]);
    
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
      ...Markup.inlineKeyboard([[cb(t(lang, "admin.cancel"), "admin_back", "danger", E.back)]])
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

  const geosintData: Record<string, { emoji: string; name: Record<string, string>; tips: Record<string, string[]> }> = {
    europe_west: {
      emoji: "🇪🇺",
      name: { uk: "Західна Європа", en: "Western Europe", ru: "Западная Европа", es: "Europa Occidental", de: "Westeuropa" },
      tips: {
        uk: [
          "🚗 Номерні знаки: білі з синьою смугою зліва (прапор ЄС)",
          "🏠 Червоні/коричневі черепичні дахи — Німеччина, Нідерланди",
          "🛣️ Дорожні знаки: кругла форма з червоною рамкою",
          "🔌 Розетки типу F (Schuko) — Німеччина, Франція, Іспанія",
          "🏗️ Фахверкові будинки — Німеччина, Франція (Ельзас)",
          "🚦 Жовті світлофори — Нідерланди",
          "📮 Жовті поштові скриньки — Франція, Німеччина",
          "🌿 Платани уздовж доріг — Франція",
        ],
        en: [
          "🚗 License plates: white with blue EU strip on left",
          "🏠 Red/brown tile roofs — Germany, Netherlands",
          "🛣️ Road signs: circular shape with red border",
          "🔌 Type F (Schuko) outlets — Germany, France, Spain",
          "🏗️ Half-timbered houses — Germany, France (Alsace)",
          "🚦 Yellow traffic lights — Netherlands",
          "📮 Yellow mailboxes — France, Germany",
          "🌿 Plane trees along roads — France",
        ],
        ru: [
          "🚗 Номерные знаки: белые с синей полосой ЕС слева",
          "🏠 Красные/коричневые черепичные крыши — Германия, Нидерланды",
          "🛣️ Дорожные знаки: круглая форма с красной рамкой",
          "🔌 Розетки типа F (Schuko) — Германия, Франция, Испания",
          "🏗️ Фахверковые дома — Германия, Франция (Эльзас)",
          "🚦 Жёлтые светофоры — Нидерланды",
          "📮 Жёлтые почтовые ящики — Франция, Германия",
          "🌿 Платаны вдоль дорог — Франция",
        ],
        es: [
          "🚗 Matrículas: blancas con franja azul UE a la izquierda",
          "🏠 Tejados rojos/marrones — Alemania, Países Bajos",
          "🛣️ Señales de tráfico: forma circular con borde rojo",
          "🔌 Enchufes tipo F (Schuko) — Alemania, Francia, España",
          "🏗️ Casas con entramado de madera — Alemania, Francia (Alsacia)",
          "🚦 Semáforos amarillos — Países Bajos",
          "📮 Buzones amarillos — Francia, Alemania",
          "🌿 Plátanos a lo largo de las carreteras — Francia",
        ],
        de: [
          "🚗 Kennzeichen: weiß mit blauem EU-Streifen links",
          "🏠 Rote/braune Ziegeldächer — Deutschland, Niederlande",
          "🛣️ Verkehrszeichen: runde Form mit rotem Rand",
          "🔌 Steckdosen Typ F (Schuko) — Deutschland, Frankreich, Spanien",
          "🏗️ Fachwerkhäuser — Deutschland, Frankreich (Elsass)",
          "🚦 Gelbe Ampeln — Niederlande",
          "📮 Gelbe Briefkästen — Frankreich, Deutschland",
          "🌿 Platanen entlang der Straßen — Frankreich",
        ],
      },
    },
    europe_east: {
      emoji: "🇺🇦",
      name: { uk: "Східна Європа / СНД", en: "Eastern Europe / CIS", ru: "Восточная Европа / СНГ", es: "Europa del Este / CEI", de: "Osteuropa / GUS" },
      tips: {
        uk: [
          "🏠 Панельні 5-9 поверхові будинки (хрущовки, брежнєвки)",
          "🧱 Бетонні паркани з ромбовидним візерунком — Україна, Росія",
          "🛣️ Білі стовпчики з червоними смугами вздовж доріг",
          "🚗 Жовті номерні знаки — старі українські; білі — нові",
          "📮 Сині поштові скриньки — Україна",
          "⛪ Цибулеподібні куполи церков — Росія, Україна",
          "🚌 Маршрутки (мікроавтобуси) — типові для СНД",
          "🌻 Соняшникові поля — Україна, південь Росії",
          "🏗️ Радянські мозаїки на будівлях",
        ],
        en: [
          "🏠 Panel 5-9 story apartment blocks (Khrushchyovkas)",
          "🧱 Concrete fences with diamond pattern — Ukraine, Russia",
          "🛣️ White road posts with red stripes along roads",
          "🚗 Yellow plates — old Ukrainian; white — new Ukrainian",
          "📮 Blue mailboxes — Ukraine",
          "⛪ Onion-shaped church domes — Russia, Ukraine",
          "🚌 Marshrutkas (minibuses) — typical for CIS countries",
          "🌻 Sunflower fields — Ukraine, southern Russia",
          "🏗️ Soviet mosaics on buildings",
        ],
        ru: [
          "🏠 Панельные 5-9 этажные дома (хрущёвки, брежневки)",
          "🧱 Бетонные заборы с ромбовидным узором — Украина, Россия",
          "🛣️ Белые столбики с красными полосами вдоль дорог",
          "🚗 Жёлтые номера — старые украинские; белые — новые",
          "📮 Синие почтовые ящики — Украина",
          "⛪ Луковичные купола церквей — Россия, Украина",
          "🚌 Маршрутки (микроавтобусы) — типичны для СНГ",
          "🌻 Подсолнечные поля — Украина, юг России",
          "🏗️ Советские мозаики на зданиях",
        ],
        es: [
          "🏠 Bloques de apartamentos de 5-9 pisos (Khrushchyovkas)",
          "🧱 Vallas de hormigón con patrón de diamantes — Ucrania, Rusia",
          "🛣️ Postes blancos con franjas rojas a lo largo de las carreteras",
          "🚗 Matrículas amarillas — ucranianas antiguas; blancas — nuevas",
          "📮 Buzones azules — Ucrania",
          "⛪ Cúpulas en forma de cebolla — Rusia, Ucrania",
          "🚌 Marshrutkas (minibuses) — típicos de los países de la CEI",
          "🌻 Campos de girasoles — Ucrania, sur de Rusia",
          "🏗️ Mosaicos soviéticos en edificios",
        ],
        de: [
          "🏠 Plattenbauten mit 5-9 Stockwerken (Chruschtschowkas)",
          "🧱 Betonzäune mit Rautenmuster — Ukraine, Russland",
          "🛣️ Weiße Pfosten mit roten Streifen entlang der Straßen",
          "🚗 Gelbe Kennzeichen — alte ukrainische; weiße — neue",
          "📮 Blaue Briefkästen — Ukraine",
          "⛪ Zwiebelförmige Kirchenkuppeln — Russland, Ukraine",
          "🚌 Marshrutkas (Minibusse) — typisch für GUS-Länder",
          "🌻 Sonnenblumenfelder — Ukraine, Südrussland",
          "🏗️ Sowjetische Mosaike an Gebäuden",
        ],
      },
    },
    asia: {
      emoji: "🌏",
      name: { uk: "Азія", en: "Asia", ru: "Азия", es: "Asia", de: "Asien" },
      tips: {
        uk: [
          "🚗 Рух лівосторонній — Японія, Таїланд, Індія, Індонезія",
          "📝 Ієрогліфи: прості — китайські; складні з рисками — японські",
          "🏮 Червоні ліхтарі та вивіски — Китай",
          "⛩️ Торії (червоні ворота) — Японія",
          "🛕 Буддійські храми з золотими шпилями — Таїланд, М'янма",
          "🛺 Тук-туки — Таїланд, Індія, Шрі-Ланка",
          "🌾 Рисові тераси — В'єтнам, Філіппіни, Індонезія",
          "🔠 Корейський алфавіт (хангиль) — кола та лінії",
        ],
        en: [
          "🚗 Left-hand traffic — Japan, Thailand, India, Indonesia",
          "📝 Characters: simple — Chinese; complex with strokes — Japanese",
          "🏮 Red lanterns and signs — China",
          "⛩️ Torii gates (red gates) — Japan",
          "🛕 Buddhist temples with golden spires — Thailand, Myanmar",
          "🛺 Tuk-tuks — Thailand, India, Sri Lanka",
          "🌾 Rice terraces — Vietnam, Philippines, Indonesia",
          "🔠 Korean alphabet (Hangul) — circles and lines",
        ],
        ru: [
          "🚗 Левостороннее движение — Япония, Таиланд, Индия, Индонезия",
          "📝 Иероглифы: простые — китайские; сложные с чертами — японские",
          "🏮 Красные фонари и вывески — Китай",
          "⛩️ Тории (красные ворота) — Япония",
          "🛕 Буддийские храмы с золотыми шпилями — Таиланд, Мьянма",
          "🛺 Тук-туки — Таиланд, Индия, Шри-Ланка",
          "🌾 Рисовые террасы — Вьетнам, Филиппины, Индонезия",
          "🔠 Корейский алфавит (хангыль) — круги и линии",
        ],
        es: [
          "🚗 Tráfico por la izquierda — Japón, Tailandia, India, Indonesia",
          "📝 Caracteres: simples — chinos; complejos — japoneses",
          "🏮 Farolillos rojos — China",
          "⛩️ Puertas torii (rojas) — Japón",
          "🛕 Templos budistas con agujas doradas — Tailandia, Myanmar",
          "🛺 Tuk-tuks — Tailandia, India, Sri Lanka",
          "🌾 Terrazas de arroz — Vietnam, Filipinas, Indonesia",
          "🔠 Alfabeto coreano (Hangul) — círculos y líneas",
        ],
        de: [
          "🚗 Linksverkehr — Japan, Thailand, Indien, Indonesien",
          "📝 Zeichen: einfach — Chinesisch; komplex — Japanisch",
          "🏮 Rote Laternen und Schilder — China",
          "⛩️ Torii-Tore (rote Tore) — Japan",
          "🛕 Buddhistische Tempel mit goldenen Spitzen — Thailand, Myanmar",
          "🛺 Tuk-Tuks — Thailand, Indien, Sri Lanka",
          "🌾 Reisterrassen — Vietnam, Philippinen, Indonesien",
          "🔠 Koreanisches Alphabet (Hangul) — Kreise und Linien",
        ],
      },
    },
    americas: {
      emoji: "🌎",
      name: { uk: "Америка", en: "Americas", ru: "Америка", es: "América", de: "Amerika" },
      tips: {
        uk: [
          "🚗 Жовті школьні автобуси — США, Канада",
          "🛣️ Зелені знаки з білим текстом — американські хайвеї",
          "🏠 Дерев'яні будинки з верандами — південь США",
          "📮 Сині поштові скриньки USPS — США",
          "🚦 Горизонтальні світлофори — США (вертикальні — Канада)",
          "🏗️ Кольорові колоніальні будинки — Латинська Америка",
          "🌵 Кактуси та пустелі — Мексика, США (Аризона, Техас)",
          "🛤️ Довгі прямі дороги — американський Середній Захід",
        ],
        en: [
          "🚗 Yellow school buses — USA, Canada",
          "🛣️ Green signs with white text — American highways",
          "🏠 Wooden houses with porches — Southern USA",
          "📮 Blue USPS mailboxes — USA",
          "🚦 Horizontal traffic lights — USA (vertical — Canada)",
          "🏗️ Colorful colonial buildings — Latin America",
          "🌵 Cacti and deserts — Mexico, USA (Arizona, Texas)",
          "🛤️ Long straight roads — American Midwest",
        ],
        ru: [
          "🚗 Жёлтые школьные автобусы — США, Канада",
          "🛣️ Зелёные знаки с белым текстом — американские хайвеи",
          "🏠 Деревянные дома с верандами — юг США",
          "📮 Синие почтовые ящики USPS — США",
          "🚦 Горизонтальные светофоры — США (вертикальные — Канада)",
          "🏗️ Красочные колониальные здания — Латинская Америка",
          "🌵 Кактусы и пустыни — Мексика, США (Аризона, Техас)",
          "🛤️ Длинные прямые дороги — американский Средний Запад",
        ],
        es: [
          "🚗 Autobuses escolares amarillos — EE.UU., Canadá",
          "🛣️ Señales verdes con texto blanco — autopistas americanas",
          "🏠 Casas de madera con porches — sur de EE.UU.",
          "📮 Buzones azules USPS — EE.UU.",
          "🚦 Semáforos horizontales — EE.UU. (verticales — Canadá)",
          "🏗️ Edificios coloniales coloridos — América Latina",
          "🌵 Cactus y desiertos — México, EE.UU. (Arizona, Texas)",
          "🛤️ Carreteras largas y rectas — Medio Oeste americano",
        ],
        de: [
          "🚗 Gelbe Schulbusse — USA, Kanada",
          "🛣️ Grüne Schilder mit weißem Text — amerikanische Highways",
          "🏠 Holzhäuser mit Veranden — Süden der USA",
          "📮 Blaue USPS-Briefkästen — USA",
          "🚦 Horizontale Ampeln — USA (vertikal — Kanada)",
          "🏗️ Bunte Kolonialgebäude — Lateinamerika",
          "🌵 Kakteen und Wüsten — Mexiko, USA (Arizona, Texas)",
          "🛤️ Lange gerade Straßen — amerikanischer Mittlerer Westen",
        ],
      },
    },
    africa_mideast: {
      emoji: "🌍",
      name: { uk: "Африка та Близький Схід", en: "Africa & Middle East", ru: "Африка и Ближний Восток", es: "África y Medio Oriente", de: "Afrika & Naher Osten" },
      tips: {
        uk: [
          "🕌 Мечеті з мінаретами — Близький Схід, Північна Африка",
          "🏜️ Піщані дюни та пустелі — Сахара, Аравійський п-ів",
          "📝 Арабська в'язь (справа наліво) — арабські країни",
          "🚗 Зелені номерні знаки — Саудівська Аравія",
          "🏠 Глинобитні будинки — Марокко, Малі, Нігер",
          "🌴 Пальмові плантації — Єгипет, ОАЕ",
          "🛣️ Червона ґрунтова дорога — Субсахарна Африка",
          "🦒 Савана з акаціями — Кенія, Танзанія",
        ],
        en: [
          "🕌 Mosques with minarets — Middle East, North Africa",
          "🏜️ Sand dunes and deserts — Sahara, Arabian Peninsula",
          "📝 Arabic script (right to left) — Arab countries",
          "🚗 Green license plates — Saudi Arabia",
          "🏠 Mud-brick houses — Morocco, Mali, Niger",
          "🌴 Palm plantations — Egypt, UAE",
          "🛣️ Red dirt roads — Sub-Saharan Africa",
          "🦒 Savanna with acacia trees — Kenya, Tanzania",
        ],
        ru: [
          "🕌 Мечети с минаретами — Ближний Восток, Северная Африка",
          "🏜️ Песчаные дюны и пустыни — Сахара, Аравийский п-ов",
          "📝 Арабская вязь (справа налево) — арабские страны",
          "🚗 Зелёные номерные знаки — Саудовская Аравия",
          "🏠 Глинобитные дома — Марокко, Мали, Нигер",
          "🌴 Пальмовые плантации — Египет, ОАЭ",
          "🛣️ Красная грунтовая дорога — Субсахарная Африка",
          "🦒 Саванна с акациями — Кения, Танзания",
        ],
        es: [
          "🕌 Mezquitas con minaretes — Medio Oriente, Norte de África",
          "🏜️ Dunas de arena y desiertos — Sahara, Península Arábiga",
          "📝 Escritura árabe (de derecha a izquierda) — países árabes",
          "🚗 Matrículas verdes — Arabia Saudita",
          "🏠 Casas de adobe — Marruecos, Mali, Níger",
          "🌴 Plantaciones de palmeras — Egipto, EAU",
          "🛣️ Caminos de tierra roja — África subsahariana",
          "🦒 Sabana con acacias — Kenia, Tanzania",
        ],
        de: [
          "🕌 Moscheen mit Minaretten — Naher Osten, Nordafrika",
          "🏜️ Sanddünen und Wüsten — Sahara, Arabische Halbinsel",
          "📝 Arabische Schrift (rechts nach links) — arabische Länder",
          "🚗 Grüne Kennzeichen — Saudi-Arabien",
          "🏠 Lehmziegelhäuser — Marokko, Mali, Niger",
          "🌴 Palmenplantagen — Ägypten, VAE",
          "🛣️ Rote Erdstraßen — Subsahara-Afrika",
          "🦒 Savanne mit Akazien — Kenia, Tansania",
        ],
      },
    },
  };

  bot.command("geosint", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const lang = await getLang(tgId);

    let text = `${t(lang, "geosint.title")}\n${t(lang, "geosint.description")}\n\n${t(lang, "geosint.selectRegion")}`;

    const buttons = Object.entries(geosintData).map(([key, region]) => {
      const regionName = region.name[lang] || region.name.en;
      return [cb(`${region.emoji} ${regionName}`, `geosint_${key}`, "primary")];
    });

    await ctx.reply(text, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard(buttons),
    });
  });

  bot.action(/^geosint_(.+)$/, async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const lang = await getLang(tgId);
    const regionKey = ctx.match[1];

    if (regionKey === "back") {
      let text = `${t(lang, "geosint.title")}\n${t(lang, "geosint.description")}\n\n${t(lang, "geosint.selectRegion")}`;
      const buttons = Object.entries(geosintData).map(([key, region]) => {
        const regionName = region.name[lang] || region.name.en;
        return [cb(`${region.emoji} ${regionName}`, `geosint_${key}`, "primary")];
      });
      await ctx.editMessageText(text, {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard(buttons),
      });
      return;
    }

    const region = geosintData[regionKey];
    if (!region) return ctx.answerCbQuery("Region not found");

    const regionName = region.name[lang] || region.name.en;
    const tips = region.tips[lang] || region.tips.en;

    let text = `${region.emoji} *${escMd(regionName)}*\n\n`;
    for (const tip of tips) {
      text += `${tip}\n`;
    }

    await ctx.editMessageText(text, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([[cb(t(lang, "geosint.back"), "geosint_back", "danger", E.back)]]),
    });
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
        `• ${t(lang, "quickCheck.typeCve")}\n` +
        `• ${t(lang, "quickCheck.typePassword")}\n` +
        `• ${t(lang, "quickCheck.typeDns")}\n` +
        `• ${t(lang, "quickCheck.typeSsl")}\n` +
        `• ${t(lang, "quickCheck.typeMac")}\n\n` +
        `${t(lang, "quickCheck.examples")}\n` +
        `\`/check ip 8.8.8.8\`\n` +
        `\`/check email test@gmail.com\`\n` +
        `\`/check wallet 0x123...\`\n` +
        `\`/check password MyP@ss123\`\n` +
        `\`/check dns example.com\``,
        { parse_mode: "Markdown" }
      );
    }
    
    const checkType = args[1].toLowerCase();
    const target = args.slice(2).join(" ");
    
    const validTypes = ["ip", "wallet", "email", "phone", "domain", "url", "username", "hash", "cve", "password", "dns", "ssl", "mac"];
    if (!validTypes.includes(checkType)) {
      return ctx.reply(t(lang, "quickCheck.unknownType", { type: checkType, available: validTypes.join(", ") }));
    }
    
    const qcTier = (user?.tier || "FREE").toUpperCase();
    const qcUnlimited = qcTier === "ENTERPRISE" || qcTier === "GROUPS";
    if (!user || (!qcUnlimited && user.requestsLeft! <= 0)) {
      return ctx.reply(t(lang, "validation.limitReached", { limit: "5" }), 
        Markup.inlineKeyboard([
          [cb(t(lang, "buttons.upgrade"), "upgrade", "success", E.star)]
        ])
      );
    }
    
    const processingMsg = await ctx.reply(t(lang, "quickCheck.analyzing", { type: checkType, target }));
    
    try {
      const checkResult = await performCheck(checkType, target);
      if (qcTier !== "ENTERPRISE" && qcTier !== "GROUPS") {
        await storage.updateUser(user.id, { requestsLeft: Math.max(0, (user.requestsLeft || 0) - 1) });
      }
      creditPendingReferral(user).catch(() => {});
      
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
            cb(t(lang, "buttons.pdf"), `gen_pdf_${checkType}_${target}`, "primary", E.doc),
            cb(t(lang, "buttons.monitoring"), `add_monitor_${checkType}_${target}`, "primary", E.eye)
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

  // STATS COMMAND - duplicate removed; the canonical HTML+pe() /stats handler lives earlier in this file (around line 1213).

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
        [urlS("Поділитись", `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent("🛡️ Перевір безпеку своїх даних з DARKSHARE!")}`, "success", E.link)],
        [cb("Меню", "dashboard", "primary", E.home)]
      ])
    });
  });

  // HELP COMMAND - довідка
  const buildApiInfo = (lang: Language, opts?: { canGenerate?: boolean }) => {
    const webUrl = process.env.WEB_DOMAIN || "https://www.darkshare.store";

    const T: Record<string, { title: string; intro: string; authHead: string; authLine1: string; authLine2: string; endpoints: string; example: string; tiers: string; webBtn: string; docsBtn: string; keyBtn: string; genBtn: string }> = {
      uk: {
        title: "DARKSHARE API",
        intro: "Програмний доступ до OSINT-перевірок, моніторингу та звітів.",
        authHead: "Автентифікація",
        authLine1: "Заголовок:",
        authLine2: "Ключ створюється у веб-кабінеті.",
        endpoints: "Основні ендпоінти",
        example: "Приклад",
        tiers: "Доступ: PRO ($9/міс) · ENTERPRISE ($30/міс) · GROUPS ($45/міс).",
        webBtn: "🌐 Відкрити сайт",
        docsBtn: "📄 Повна документація",
        keyBtn: "🔑 Отримати API-ключ",
        genBtn: "⚡ Згенерувати мій ключ",
      },
      ru: {
        title: "DARKSHARE API",
        intro: "Программный доступ к OSINT-проверкам, мониторингу и отчётам.",
        authHead: "Аутентификация",
        authLine1: "Заголовок:",
        authLine2: "Ключ создаётся в веб-кабинете.",
        endpoints: "Основные эндпоинты",
        example: "Пример",
        tiers: "Доступ: PRO ($9/мес) · ENTERPRISE ($30/мес) · GROUPS ($45/мес).",
        webBtn: "🌐 Открыть сайт",
        docsBtn: "📄 Полная документация",
        keyBtn: "🔑 Получить API-ключ",
        genBtn: "⚡ Сгенерировать мой ключ",
      },
      es: {
        title: "DARKSHARE API",
        intro: "Acceso programático a comprobaciones OSINT, monitoreo e informes.",
        authHead: "Autenticación",
        authLine1: "Cabecera:",
        authLine2: "La clave se crea en el panel web.",
        endpoints: "Endpoints principales",
        example: "Ejemplo",
        tiers: "Acceso: PRO ($9/mes) · ENTERPRISE ($30/mes) · GROUPS ($45/mes).",
        webBtn: "🌐 Abrir sitio",
        docsBtn: "📄 Documentación completa",
        keyBtn: "🔑 Obtener clave API",
        genBtn: "⚡ Generar mi clave",
      },
      de: {
        title: "DARKSHARE API",
        intro: "Programmatischer Zugriff auf OSINT-Checks, Monitoring und Berichte.",
        authHead: "Authentifizierung",
        authLine1: "Header:",
        authLine2: "Schlüssel wird im Web-Konto erstellt.",
        endpoints: "Hauptendpunkte",
        example: "Beispiel",
        tiers: "Zugang: PRO ($9/Mo) · ENTERPRISE ($30/Mo) · GROUPS ($45/Mo).",
        webBtn: "🌐 Website öffnen",
        docsBtn: "📄 Vollständige Doku",
        keyBtn: "🔑 API-Schlüssel holen",
        genBtn: "⚡ Meinen Schlüssel erstellen",
      },
      en: {
        title: "DARKSHARE API",
        intro: "Programmatic access to OSINT checks, monitoring and reports.",
        authHead: "Authentication",
        authLine1: "Header:",
        authLine2: "Key is generated in your web account.",
        endpoints: "Core endpoints",
        example: "Example",
        tiers: "Access: PRO ($9/mo) · ENTERPRISE ($30/mo) · GROUPS ($45/mo).",
        webBtn: "🌐 Open website",
        docsBtn: "📄 Full docs",
        keyBtn: "🔑 Get API key",
        genBtn: "⚡ Generate my key",
      },
    };

    const L = T[lang] || T.en;
    const endpointsBlock =
      "<code>POST /api/check</code>\n" +
      "   { type, target } → riskScore, findings\n" +
      "<code>GET  /api/reports</code>\n" +
      "   list of your reports\n" +
      "<code>GET  /api/reports/:id</code>\n" +
      "   full report\n" +
      "<code>GET  /api/reports/:id/pdf</code>\n" +
      "   PDF export\n" +
      "<code>POST /api/bulk-check</code>\n" +
      "   batch up to 100 targets\n" +
      "<code>GET  /api/watches</code> · <code>POST /api/watches</code> · <code>DELETE /api/watches/:id</code>\n" +
      "<code>GET  /api/quick-check?type=ip&amp;target=8.8.8.8</code> (free, 3/day per IP)";
    const exampleBlock =
      "<pre>curl -X POST " + escHtml(webUrl) + "/api/check \\\n" +
      "  -H \"Authorization: Bearer $DS_KEY\" \\\n" +
      "  -H \"Content-Type: application/json\" \\\n" +
      "  -d '{\"type\":\"ip\",\"target\":\"8.8.8.8\"}'</pre>";

    const text =
      `${pe("link")} <b>${escHtml(L.title)}</b>\n` +
      `${escHtml(L.intro)}\n\n` +
      `${pe("key")} <b>${escHtml(L.authHead)}</b>\n` +
      `${escHtml(L.authLine1)} <code>Authorization: Bearer &lt;API_KEY&gt;</code>\n` +
      `${escHtml(L.authLine2)}\n\n` +
      `${pe("cog")} <b>${escHtml(L.endpoints)}</b>\n${endpointsBlock}\n\n` +
      `${pe("bulb")} <b>${escHtml(L.example)}</b>\n${exampleBlock}\n\n` +
      `${pe("crown")} ${escHtml(L.tiers)}`;

    const buttons: any[][] = [];
    const lockHint: Record<string, string> = {
      uk: " 🔒", ru: " 🔒", es: " 🔒", de: " 🔒", en: " 🔒",
    };
    const genLabel = opts?.canGenerate ? L.genBtn : `${L.genBtn}${lockHint[lang] || lockHint.en}`;
    buttons.push([cb(genLabel, "gen_api_key", opts?.canGenerate ? "success" : "primary", E.bolt)]);
    buttons.push([urlS(L.docsBtn, `${webUrl}/api-docs`, "primary", E.doc)]);
    buttons.push([urlS(L.keyBtn, `${webUrl}/account`, "success", E.lock), urlS(L.webBtn, webUrl, "primary", E.globe)]);
    buttons.push([cb(t(lang, "buttons.back") || "← Back", "dashboard", "danger", E.back)]);

    return { text, buttons };
  };

  const isApiTier = (tier?: string | null) => {
    const t = String(tier || "FREE").toUpperCase();
    return t === "PRO" || t === "ENTERPRISE" || t === "GROUPS";
  };

  bot.command("api", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const lang = await getLang(tgId);
    const user = await storage.getUserByTgId(tgId);
    const { text, buttons } = buildApiInfo(lang, { canGenerate: isApiTier(user?.tier) });
    await ctx.reply(text, { parse_mode: "HTML", ...Markup.inlineKeyboard(buttons) });
  });

  bot.action("open_api", async (ctx) => {
    try { await ctx.answerCbQuery(); } catch {}
    const tgId = ctx.from!.id.toString();
    const lang = await getLang(tgId);
    const user = await storage.getUserByTgId(tgId);
    const { text, buttons } = buildApiInfo(lang, { canGenerate: isApiTier(user?.tier) });
    try {
      await ctx.editMessageText(text, { parse_mode: "HTML", ...Markup.inlineKeyboard(buttons) });
    } catch {
      await ctx.reply(text, { parse_mode: "HTML", ...Markup.inlineKeyboard(buttons) });
    }
  });

  // Make API key visible from the dashboard /account screen as well
  bot.action("open_api_key", async (ctx) => { await sendApiKey(ctx); });

  const sendApiKey = async (ctx: any) => {
    const tgId = ctx.from!.id.toString();
    const lang = await getLang(tgId);
    const user = await storage.getUserByTgId(tgId);
    if (!user) {
      try { await ctx.answerCbQuery(); } catch {}
      return;
    }
    if (!isApiTier(user.tier)) {
      const upgradeMsg: Record<string, string> = {
        uk: "🔒 API доступ — лише для тарифів *PRO / ENTERPRISE / GROUPS*. Оформи підписку, щоб отримати ключ.",
        ru: "🔒 API-доступ — только для тарифов *PRO / ENTERPRISE / GROUPS*. Оформи подписку, чтобы получить ключ.",
        es: "🔒 Acceso API — solo planes *PRO / ENTERPRISE / GROUPS*. Suscríbete para obtener una clave.",
        de: "🔒 API-Zugriff — nur für Tarife *PRO / ENTERPRISE / GROUPS*. Abo nötig, um einen Schlüssel zu erhalten.",
        en: "🔒 API access is for *PRO / ENTERPRISE / GROUPS* tiers only. Upgrade to get your key.",
      };
      try { await ctx.answerCbQuery(); } catch {}
      await ctx.reply(upgradeMsg[lang] || upgradeMsg.en, {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([[cb(t(lang, "buttons.upgrade"), "upgrade", "success", E.star)]]),
      });
      return;
    }
    const fullKey = generateApiKey(user.id, user.tgId);
    const titleMap: Record<string, string> = {
      uk: "🔑 *Твій API-ключ*",
      ru: "🔑 *Твой API-ключ*",
      es: "🔑 *Tu clave API*",
      de: "🔑 *Dein API-Schlüssel*",
      en: "🔑 *Your API key*",
    };
    const warnMap: Record<string, string> = {
      uk: "⚠️ Збережи ключ. Використовується у заголовку `Authorization: Bearer …`.\nКлюч прив'язаний до акаунта — не передавай третім особам.",
      ru: "⚠️ Сохрани ключ. Используется в заголовке `Authorization: Bearer …`.\nКлюч привязан к аккаунту — не передавай третьим лицам.",
      es: "⚠️ Guarda la clave. Se usa en el header `Authorization: Bearer …`.\nLa clave está ligada a tu cuenta — no la compartas.",
      de: "⚠️ Schlüssel sichern. Wird im Header `Authorization: Bearer …` verwendet.\nDer Schlüssel ist an dein Konto gebunden — nicht weitergeben.",
      en: "⚠️ Save it. Used in the `Authorization: Bearer …` header.\nKey is tied to your account — don't share it.",
    };
    const text = `${titleMap[lang] || titleMap.en}\n\n\`${fullKey}\`\n\n${warnMap[lang] || warnMap.en}`;
    const keyboard = Markup.inlineKeyboard([
      [cb(t(lang, "buttons.back") || "← Back", "open_api", "primary", E.back)],
    ]);
    try { await ctx.answerCbQuery(); } catch {}
    await ctx.reply(text, { parse_mode: "Markdown", ...keyboard });
  };

  bot.action("gen_api_key", async (ctx) => { await sendApiKey(ctx); });

  bot.action("api_docs", async (ctx) => {
    try { await ctx.answerCbQuery(); } catch {}
    const tgId = ctx.from!.id.toString();
    const lang = await getLang(tgId);
    const webUrl = process.env.WEB_DOMAIN || "https://www.darkshare.store";
    const label = lang === "uk" ? "📄 Документація" : lang === "ru" ? "📄 Документация" : lang === "es" ? "📄 Documentación" : lang === "de" ? "📄 Dokumentation" : "📄 Documentation";
    await ctx.reply(label, Markup.inlineKeyboard([[urlS(label, `${webUrl}/api-docs`, "primary", E.doc)]]));
  });

  bot.command("help", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const user = await storage.getUserByTgId(tgId);
    const lang = getUserLang(user?.lang);
    const webUrl = process.env.WEB_DOMAIN || "https://www.darkshare.store";
    const helpBotUsername = (await bot.telegram.getMe()).username || "DarkShare1Bot";

    const helpTitle = lang === "uk" ? "ДОВІДКА DARKSHARE" : lang === "ru" ? "СПРАВКА DARKSHARE" : "DARKSHARE HELP";
    const cmdsTitle = lang === "uk" ? "Команди" : lang === "ru" ? "Команды" : "Commands";
    const cmdMenuDesc = lang === "uk" ? "Головне меню" : lang === "ru" ? "Главное меню" : "Main menu";
    const cmdDashDesc = lang === "uk" ? "Панель управління" : lang === "ru" ? "Панель управления" : "Dashboard";
    const cmdCheckDesc = lang === "uk" ? "Швидка перевірка" : lang === "ru" ? "Быстрая проверка" : "Quick check";
    const cmdCheckArgs = lang === "uk" ? "&lt;тип&gt; &lt;значення&gt;" : lang === "ru" ? "&lt;тип&gt; &lt;значение&gt;" : "&lt;type&gt; &lt;value&gt;";
    const cmdStatsDesc = lang === "uk" ? "Ваша статистика" : lang === "ru" ? "Ваша статистика" : "Your statistics";
    const cmdRefDesc = lang === "uk" ? "Реферальна програма" : lang === "ru" ? "Реферальная программа" : "Referral program";
    const cmdHelpDesc = lang === "uk" ? "Ця довідка" : lang === "ru" ? "Эта справка" : "This help";
    const inlineTitle = lang === "uk" ? "Inline режим (будь-який чат)" : lang === "ru" ? "Inline режим (любой чат)" : "Inline mode (any chat)";
    const typesTitle = lang === "uk" ? "Типи перевірок" : lang === "ru" ? "Типы проверок" : "Check types";
    const webLabel = lang === "uk" ? "Веб-панель" : lang === "ru" ? "Веб-панель" : "Web panel";

    const text =
      `${pe("scroll")} <b>${escHtml(helpTitle)}</b>\n\n` +
      `<b>${escHtml(cmdsTitle)}:</b>\n` +
      `├ <code>/start</code> — ${escHtml(cmdMenuDesc)}\n` +
      `├ <code>/menu</code> — ${escHtml(cmdDashDesc)}\n` +
      `├ <code>/check ${cmdCheckArgs}</code> — ${escHtml(cmdCheckDesc)}\n` +
      `├ <code>/stats</code> — ${escHtml(cmdStatsDesc)}\n` +
      `├ <code>/ref</code> — ${escHtml(cmdRefDesc)}\n` +
      `└ <code>/help</code> — ${escHtml(cmdHelpDesc)}\n\n` +
      `${pe("mobile")} <b>${escHtml(inlineTitle)}:</b>\n` +
      `├ <code>@${escHtml(helpBotUsername)} ip 8.8.8.8</code>\n` +
      `├ <code>@${escHtml(helpBotUsername)} email test@mail.com</code>\n` +
      `├ <code>@${escHtml(helpBotUsername)} domain google.com</code>\n` +
      `└ <code>@${escHtml(helpBotUsername)} wallet 0x...</code>\n\n` +
      `<b>${escHtml(typesTitle)}:</b>\n` +
      `${pe("globe")} IP  ${pe("diamond")} Wallet  ${pe("envelope")} Email  ${pe("mobile")} Phone\n` +
      `${pe("link")} Domain  ${pe("search")} URL  ${pe("bug")} CVE  ${pe("search")} Hash\n` +
      `${pe("user")} Username  ${pe("card")} Card BIN\n\n` +
      `${pe("globe")} ${escHtml(webLabel)}: ${escHtml(webUrl)}`;
    
    const helpButtons: any[][] = [
      [cb((lang === "uk" ? "Інструкція" : lang === "ru" ? "Инструкция" : "Guide"), "open_guide", "primary", E.doc)],
    ];
    const tgUrl = telegraphUrls[lang] || telegraphUrls["en"] || "";
    if (tgUrl) {
      helpButtons.push([urlS((lang === "uk" ? "Читати на Telegraph" : lang === "ru" ? "Читать на Telegraph" : "Read on Telegraph"), tgUrl, "success", E.doc)]);
    }
    helpButtons.push([urlS((lang === "uk" ? "Сайт" : lang === "ru" ? "Сайт" : "Website"), `${webUrl}/guide`, "success", E.globe)]);
    helpButtons.push([cb((lang === "uk" ? "Меню" : lang === "ru" ? "Меню" : "Menu"), "dashboard", "primary", E.home)]);

    await ctx.reply(text, {
      parse_mode: "HTML",
      ...Markup.inlineKeyboard(helpButtons)
    });
  });

  bot.on("inline_query", async (ctx) => {
    const query = ctx.inlineQuery.query.trim();

    const validTypes: Record<string, { label: string; emoji: string; example: string; desc: string }> = {
      ip: { label: "IP Analysis", emoji: "🌐", example: "8.8.8.8", desc: "GEO, ISP, proxy/VPN, blacklists" },
      wallet: { label: "Crypto Wallet", emoji: "💰", example: "bc1q...", desc: "Chain analysis, mixer detection" },
      email: { label: "Email OSINT", emoji: "📧", example: "user@mail.com", desc: "Breaches, disposable, domain check" },
      phone: { label: "Phone OSINT", emoji: "📱", example: "+380...", desc: "Carrier, country, format validation" },
      domain: { label: "Domain WHOIS", emoji: "🏢", example: "google.com", desc: "WHOIS, DNS, typosquatting" },
      url: { label: "URL Scanner", emoji: "🔗", example: "https://example.com", desc: "Phishing, redirects, reputation" },
      cve: { label: "CVE Lookup", emoji: "🔓", example: "CVE-2024-1234", desc: "CVSS score, CISA KEV, patches" },
      hash: { label: "Hash Analysis", emoji: "🔢", example: "d41d8cd9...", desc: "Malware check, VirusTotal, signatures" },
      username: { label: "Username OSINT", emoji: "👤", example: "johndoe", desc: "Social media, forums, breaches" },
      card: { label: "BIN Lookup", emoji: "💳", example: "424242", desc: "Bank, card type, country" },
      password: { label: "Password Check", emoji: "🔑", example: "MyP@ss123", desc: "Entropy, complexity, crack time" },
      dns: { label: "DNS Records", emoji: "🌍", example: "example.com", desc: "A, AAAA, MX, NS, TXT, CNAME, SOA" },
      ssl: { label: "SSL/TLS Check", emoji: "🔒", example: "google.com", desc: "Certificate, expiry, trust chain" },
      mac: { label: "MAC OUI Lookup", emoji: "📡", example: "AA:BB:CC:DD:EE:FF", desc: "Device manufacturer, type" },
    };

    if (!query) {
      const items = Object.entries(validTypes).map(([key, info]) => ({
        type: "article" as const,
        id: `type-${key}`,
        title: `${info.emoji} ${info.label}`,
        description: `${info.desc}  •  Example: ${key} ${info.example}`,
        input_message_content: { 
          message_text: `🛡 DARKSHARE ${info.emoji} ${info.label}\n\n${info.desc}\n\nUse: @DarkShare1Bot ${key} ${info.example}` 
        },
        thumb_url: undefined,
      }));
      return ctx.answerInlineQuery(items, { 
        cache_time: 300,
        switch_pm_text: "Open DarkShare Bot",
        switch_pm_parameter: "inline"
      } as any);
    }

    const parts = query.split(/\s+/);
    const moduleType = parts[0]?.toLowerCase();
    const inputValue = parts.slice(1).join(" ");

    if (!validTypes[moduleType]) {
      const filtered = Object.entries(validTypes)
        .filter(([key, info]) => key.startsWith(moduleType) || info.label.toLowerCase().includes(moduleType))
        .slice(0, 10);
      
      if (filtered.length === 0) {
        const all = Object.entries(validTypes).map(([key, info]) => ({
          type: "article" as const,
          id: `suggest-${key}`,
          title: `${info.emoji} ${info.label}`,
          description: `Type: ${key} ${info.example}`,
          input_message_content: { message_text: `🛡 DARKSHARE ${info.emoji} ${info.label}\n\nUse: @DarkShare1Bot ${key} ${info.example}` },
        }));
        return ctx.answerInlineQuery(all, { cache_time: 60 });
      }
      
      const suggestions = filtered.map(([key, info]) => ({
        type: "article" as const,
        id: `suggest-${key}`,
        title: `${info.emoji} ${info.label}`,
        description: `${info.desc}  •  ${key} ${info.example}`,
        input_message_content: { message_text: `🛡 DARKSHARE ${info.emoji} ${info.label}\n\n${info.desc}\n\nUse: @DarkShare1Bot ${key} ${info.example}` },
      }));
      return ctx.answerInlineQuery(suggestions, { cache_time: 30 });
    }

    const typeInfo = validTypes[moduleType];

    if (!inputValue) {
      return ctx.answerInlineQuery([
        {
          type: "article",
          id: "need-value",
          title: `${typeInfo.emoji} ${typeInfo.label}`,
          description: `Enter value: ${moduleType} ${typeInfo.example}`,
          input_message_content: { message_text: `${typeInfo.emoji} ${typeInfo.label}\n\n${typeInfo.desc}\n\nType: @DarkShare1Bot ${moduleType} ${typeInfo.example}` },
        },
        {
          type: "article",
          id: "example",
          title: `📝 Example: ${moduleType} ${typeInfo.example}`,
          description: "Tap to use this example",
          input_message_content: { message_text: `🔍 @DarkShare1Bot ${moduleType} ${typeInfo.example}` },
        }
      ], { cache_time: 10 });
    }

    const validation = validateInput(moduleType, inputValue);
    if (!validation.valid) {
      return ctx.answerInlineQuery([{
        type: "article",
        id: "invalid",
        title: "❌ Invalid input",
        description: validation.error || "Check your input format",
        input_message_content: { message_text: `❌ ${validation.error || "Invalid input"}` },
      }], { cache_time: 5 });
    }

    try {
      const tgId = ctx.from.id.toString();
      const user = await storage.getUserByTgId(tgId);

      const inlineTier = (user?.tier || "FREE").toUpperCase();
      const inlineUnlimited = inlineTier === "ENTERPRISE" || inlineTier === "GROUPS";
      if (!user || (!inlineUnlimited && (user.requestsLeft ?? 0) <= 0)) {
        return ctx.answerInlineQuery([{
          type: "article",
          id: "no-checks",
          title: "⚠️ No checks remaining",
          description: "Daily limit reached. Upgrade your plan!",
          input_message_content: { message_text: "⚠️ Daily check limit reached.\n🚀 Upgrade at darkshare.store/pricing" },
        }], { cache_time: 5 });
      }

      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error("timeout")), 12000)
      );
      const checkResult = await Promise.race([
        performCheck(moduleType, inputValue),
        timeoutPromise
      ]);
      
      if (inlineTier !== "ENTERPRISE" && inlineTier !== "GROUPS") {
        await storage.updateUser(user.id, { requestsLeft: Math.max(0, (user.requestsLeft ?? 1) - 1) });
      }
      creditPendingReferral(user).catch(() => {});

      const getRiskEmoji = (level: string) => {
        switch (level) {
          case "low": return "🟢";
          case "medium": return "⚠️";
          case "high": return "🔴";
          case "critical": return "💀";
          default: return "⚪";
        }
      };

      const riskEmoji = getRiskEmoji(checkResult.riskLevel);
      const filled = Math.round(checkResult.riskScore / 10);
      const riskBar = "▓".repeat(filled) + "░".repeat(10 - filled);
      
      const findings = checkResult.findings.slice(0, 4).map((f: string, i: number, arr: string[]) => 
        i === arr.length - 1 ? `└ ${f}` : `├ ${f}`
      ).join("\n");

      const resultText = `🛡 DARKSHARE ${typeInfo.emoji} ${typeInfo.label}\n\n` +
        `🎯 Target: ${checkResult.target}\n` +
        `${riskEmoji} Risk: ${checkResult.riskScore}% ${checkResult.riskLevel.toUpperCase()}\n` +
        `${riskBar}\n\n` +
        `📋 Findings:\n${findings}\n\n` +
        `📝 ${checkResult.summary}\n\n` +
        `🔗 Full report → darkshare.store`;

      return ctx.answerInlineQuery([{
        type: "article",
        id: `result-${Date.now()}`,
        title: `${riskEmoji} ${checkResult.riskLevel.toUpperCase()} — ${checkResult.riskScore}% risk`,
        description: checkResult.summary.slice(0, 100),
        input_message_content: { message_text: resultText },
      }], { cache_time: 0 });

    } catch (err: any) {
      const isTimeout = err.message === "timeout";
      return ctx.answerInlineQuery([{
        type: "article",
        id: "error",
        title: isTimeout ? "⏳ Check took too long" : "❌ Check failed",
        description: isTimeout ? "Try again or use the bot directly" : (err.message || "Error performing check"),
        input_message_content: { message_text: isTimeout ? "⏳ Inline check timed out. Send /start to use the full bot interface." : `❌ Error: ${err.message || "Check failed"}` },
      }], { cache_time: 5 });
    }
  });

  // GUIDE / INSTRUCTION handler
  bot.action("open_guide", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const lang = await getLang(tgId);
    const webUrl = process.env.WEB_DOMAIN || "https://www.darkshare.store";

    const guideText = lang === "uk" ? 
`📖 *ІНСТРУКЦІЯ DARKSHARE*
━━━━━━━━━━━━━━━━━━━━

🔍 *Як перевіряти?*

*1. Через бота:*
├ Натисни «Перевірка» в меню
├ Обери тип (IP, Email, Wallet...)
└ Відправ дані для аналізу

*2. Inline режим (в будь-якому чаті):*
├ Напиши: \`@DarkShare1Bot ip 8.8.8.8\`
├ Або: \`@DarkShare1Bot email test@mail.com\`
└ Результат з'явиться прямо в чаті!

*3. Веб-панель:*
└ Перейди на ${webUrl}/dashboard

📋 *Типи перевірок:*
├ 🌐 \`ip\` — IP адреси
├ 💰 \`wallet\` — крипто гаманці
├ 📧 \`email\` — email адреси
├ 📱 \`phone\` — номери телефонів
├ 🔗 \`domain\` — домени
├ 🔍 \`url\` — посилання
├ 🐛 \`cve\` — вразливості
├ #️⃣ \`hash\` — файлові хеші
├ 👤 \`username\` — юзернейми
└ 💳 \`card\` — BIN карток

⭐ *Тарифи:*
├ 🆓 FREE — 3 пробні перевірки
├ ⭐ PRO — 50 перевірок/день ($10/міс)
└ 👑 ENTERPRISE — безлімітно ($35/міс)

💡 *Поради:*
├ Перевіряй перед переказом крипти
├ Завжди перевіряй нові контакти
└ Використай inline для швидкої перевірки` :
    lang === "ru" ?
`📖 *ИНСТРУКЦИЯ DARKSHARE*
━━━━━━━━━━━━━━━━━━━━

🔍 *Как проверять?*

*1. Через бота:*
├ Нажми «Проверка» в меню
├ Выбери тип (IP, Email, Wallet...)
└ Отправь данные для анализа

*2. Inline режим (в любом чате):*
├ Напиши: \`@DarkShare1Bot ip 8.8.8.8\`
├ Или: \`@DarkShare1Bot email test@mail.com\`
└ Результат появится прямо в чате!

*3. Веб-панель:*
└ Перейди на ${webUrl}/dashboard

📋 *Типы проверок:*
├ 🌐 \`ip\` — IP адреса
├ 💰 \`wallet\` — крипто кошельки
├ 📧 \`email\` — email адреса
├ 📱 \`phone\` — номера телефонов
├ 🔗 \`domain\` — домены
├ 🔍 \`url\` — ссылки
├ 🐛 \`cve\` — уязвимости
├ #️⃣ \`hash\` — файловые хеши
├ 👤 \`username\` — юзернеймы
└ 💳 \`card\` — BIN карт

⭐ *Тарифы:*
├ 🆓 FREE — 3 пробные проверки
├ ⭐ PRO — 50 проверок/день ($10/мес)
└ 👑 ENTERPRISE — безлимитно ($35/мес)` :
`📖 *DARKSHARE GUIDE*
━━━━━━━━━━━━━━━━━━━━

🔍 *How to check?*

*1. Via bot:*
├ Press «Check» in the menu
├ Choose type (IP, Email, Wallet...)
└ Send data for analysis

*2. Inline mode (in any chat):*
├ Type: \`@DarkShare1Bot ip 8.8.8.8\`
├ Or: \`@DarkShare1Bot email test@mail.com\`
└ Result appears right in the chat!

*3. Web panel:*
└ Go to ${webUrl}/dashboard

📋 *Check types:*
├ 🌐 \`ip\` — IP addresses
├ 💰 \`wallet\` — crypto wallets
├ 📧 \`email\` — email addresses
├ 📱 \`phone\` — phone numbers
├ 🔗 \`domain\` — domains
├ 🔍 \`url\` — URLs
├ 🐛 \`cve\` — vulnerabilities
├ #️⃣ \`hash\` — file hashes
├ 👤 \`username\` — usernames
└ 💳 \`card\` — card BINs

⭐ *Plans:*
├ 🆓 FREE — 3 free trial checks
├ ⭐ PRO — 50 checks/day ($10/mo)
└ 👑 ENTERPRISE — unlimited ($35/mo)`;

    const guideButtons: any[][] = [];
    const guideTgUrl = telegraphUrls[lang] || telegraphUrls["en"] || "";
    if (guideTgUrl) {
      guideButtons.push([urlS((lang === "uk" ? "Читати на Telegraph" : lang === "ru" ? "Читать на Telegraph" : "Read on Telegraph"), guideTgUrl, "success", E.doc)]);
    }
    guideButtons.push([urlS((lang === "uk" ? "Інструкція на сайті" : lang === "ru" ? "Инструкция на сайте" : "Guide on website"), `${webUrl}/guide`, "primary", E.globe)]);
    guideButtons.push([cb((lang === "uk" ? "Меню" : lang === "ru" ? "Меню" : "Menu"), "dashboard", "primary", E.home)]);

    try {
      await ctx.editMessageText(guideText, {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard(guideButtons)
      });
    } catch {
      await ctx.reply(guideText, {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard(guideButtons)
      });
    }
  });

  // ADMIN DAILY BROADCAST settings
  bot.action("admin_daily_broadcast", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const lang = await getLang(tgId);
    if (!isAdmin(tgId)) return ctx.answerCbQuery(t(lang, "admin.accessDenied"));

    const enabled = await storage.getAdminSetting("daily_broadcast_enabled");
    const lastSent = await storage.getAdminSetting("daily_broadcast_last_sent");
    const lastReach = await storage.getAdminSetting("daily_broadcast_last_reach");
    const allUsers = await storage.getAllUsers();
    const eligibleUsers = allUsers.filter(u => !u.blocked && u.notifsOn !== false);

    const statusEmoji = enabled === "true" ? "✅" : "❌";
    const statusText = enabled === "true" 
      ? (lang === "uk" ? "Увімкнено" : lang === "ru" ? "Включено" : "Enabled")
      : (lang === "uk" ? "Вимкнено" : lang === "ru" ? "Выключено" : "Disabled");

    const lastSentText = lastSent 
      ? new Date(lastSent).toLocaleString(lang === "uk" ? "uk-UA" : lang === "ru" ? "ru-RU" : "en-US")
      : (lang === "uk" ? "Ще не відправлялась" : lang === "ru" ? "Еще не отправлялась" : "Never sent");

    const text = `📅 *${lang === "uk" ? "Авторозсилка" : lang === "ru" ? "Авторассылка" : "Auto Daily Broadcast"}*
━━━━━━━━━━━━━━━━━━━━

${statusEmoji} ${lang === "uk" ? "Статус" : lang === "ru" ? "Статус" : "Status"}: *${statusText}*
🕐 ${lang === "uk" ? "Час відправки" : lang === "ru" ? "Время отправки" : "Send time"}: *10:00 UTC*
📨 ${lang === "uk" ? "Остання розсилка" : lang === "ru" ? "Последняя рассылка" : "Last broadcast"}: ${lastSentText}
📊 ${lang === "uk" ? "Останнє охоплення" : lang === "ru" ? "Последний охват" : "Last reach"}: *${lastReach || 0}* ${lang === "uk" ? "юзерів" : lang === "ru" ? "юзеров" : "users"}

👥 ${lang === "uk" ? "Всього користувачів" : lang === "ru" ? "Всего пользователей" : "Total users"}: *${allUsers.length}*
🔔 ${lang === "uk" ? "З нотифікаціями" : lang === "ru" ? "С уведомлениями" : "With notifications"}: *${eligibleUsers.length}*

💬 *${lang === "uk" ? "Шаблон повідомлення" : lang === "ru" ? "Шаблон сообщения" : "Message template"}:*
_"${lang === "uk" ? "Привіт, {username}! У тебе {requestsLeft} перевірок. Сьогодні {scamCount} людей ледь не попалися на скам!" : lang === "ru" ? "Привет, {username}! У тебя {requestsLeft} проверок. Сегодня {scamCount} людей чуть не попались на скам!" : "Hi {username}! You have {requestsLeft} checks left. Today {scamCount} people nearly got scammed!"}_`;

    await ctx.editMessageText(text, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [enabled === "true"
          ? cb((lang === "uk" ? "Вимкнути" : lang === "ru" ? "Выключить" : "Disable"), "admin_daily_toggle_off", "danger", E.cross)
          : cb((lang === "uk" ? "Увімкнути" : lang === "ru" ? "Включить" : "Enable"), "admin_daily_toggle_on", "success", E.check)
        ],
        [cb((lang === "uk" ? "Надіслати зараз" : lang === "ru" ? "Отправить сейчас" : "Send now"), "admin_daily_send_now", "primary", E.rocket)],
        [cb((lang === "uk" ? "Оновити" : lang === "ru" ? "Обновить" : "Refresh"), "admin_daily_broadcast", "primary", E.bolt)],
        [cb(t(lang, "admin.back"), "admin_back", "danger", E.back)]
      ])
    });
  });

  bot.action("admin_daily_toggle_on", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    if (!isAdmin(tgId)) return;
    await storage.setAdminSetting("daily_broadcast_enabled", "true");
    await ctx.answerCbQuery(
      (await getLang(tgId)) === "uk" ? "✅ Увімкнено" : (await getLang(tgId)) === "ru" ? "✅ Включено" : "✅ Enabled"
    );
    const lang = await getLang(tgId);
    const lastSent = await storage.getAdminSetting("daily_broadcast_last_sent");
    const lastReach = await storage.getAdminSetting("daily_broadcast_last_reach");
    const allUsers = await storage.getAllUsers();
    const eligibleUsers = allUsers.filter(u => !u.blocked && u.notifsOn !== false);
    const text = `📅 *${lang === "uk" ? "Авторозсилка" : lang === "ru" ? "Авторассылка" : "Auto Daily Broadcast"}*\n━━━━━━━━━━━━━━━━━━━━\n\n✅ ${lang === "uk" ? "Статус" : lang === "ru" ? "Статус" : "Status"}: *${lang === "uk" ? "Увімкнено" : lang === "ru" ? "Включено" : "Enabled"}*\n🕐 ${lang === "uk" ? "Час" : lang === "ru" ? "Время" : "Time"}: *10:00 UTC*\n📨 ${lang === "uk" ? "Остання" : lang === "ru" ? "Последняя" : "Last"}: ${lastSent ? new Date(lastSent).toLocaleString(lang === "uk" ? "uk-UA" : lang === "ru" ? "ru-RU" : "en-US") : "—"}\n📊 ${lang === "uk" ? "Охоплення" : lang === "ru" ? "Охват" : "Reach"}: *${lastReach || 0}*\n👥 ${lang === "uk" ? "Всього" : lang === "ru" ? "Всего" : "Total"}: *${allUsers.length}*\n🔔 ${lang === "uk" ? "Активних" : lang === "ru" ? "Активных" : "Active"}: *${eligibleUsers.length}*`;
    try {
      await ctx.editMessageText(text, { parse_mode: "Markdown", ...Markup.inlineKeyboard([
        [cb((lang === "uk" ? "Вимкнути" : lang === "ru" ? "Выключить" : "Disable"), "admin_daily_toggle_off", "danger", E.cross)],
        [cb((lang === "uk" ? "Надіслати зараз" : lang === "ru" ? "Отправить сейчас" : "Send now"), "admin_daily_send_now", "primary", E.rocket)],
        [cb(t(lang, "admin.back"), "admin_back", "danger", E.back)]
      ]) });
    } catch { }
  });

  bot.action("admin_daily_toggle_off", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    if (!isAdmin(tgId)) return;
    await storage.setAdminSetting("daily_broadcast_enabled", "false");
    const lang = await getLang(tgId);
    await ctx.answerCbQuery(lang === "uk" ? "❌ Вимкнено" : lang === "ru" ? "❌ Выключено" : "❌ Disabled");
    const allUsers = await storage.getAllUsers();
    const eligibleUsers = allUsers.filter(u => !u.blocked && u.notifsOn !== false);
    const lastSent = await storage.getAdminSetting("daily_broadcast_last_sent");
    const lastReach = await storage.getAdminSetting("daily_broadcast_last_reach");
    const text = `📅 *${lang === "uk" ? "Авторозсилка" : lang === "ru" ? "Авторассылка" : "Auto Daily Broadcast"}*\n━━━━━━━━━━━━━━━━━━━━\n\n❌ ${lang === "uk" ? "Статус" : lang === "ru" ? "Статус" : "Status"}: *${lang === "uk" ? "Вимкнено" : lang === "ru" ? "Выключено" : "Disabled"}*\n🕐 ${lang === "uk" ? "Час" : lang === "ru" ? "Время" : "Time"}: *10:00 UTC*\n📨 ${lang === "uk" ? "Остання" : lang === "ru" ? "Последняя" : "Last"}: ${lastSent ? new Date(lastSent).toLocaleString(lang === "uk" ? "uk-UA" : lang === "ru" ? "ru-RU" : "en-US") : "—"}\n📊 ${lang === "uk" ? "Охоплення" : lang === "ru" ? "Охват" : "Reach"}: *${lastReach || 0}*\n👥 ${lang === "uk" ? "Всього" : lang === "ru" ? "Всего" : "Total"}: *${allUsers.length}*\n🔔 ${lang === "uk" ? "Активних" : lang === "ru" ? "Активных" : "Active"}: *${eligibleUsers.length}*`;
    try {
      await ctx.editMessageText(text, { parse_mode: "Markdown", ...Markup.inlineKeyboard([
        [cb((lang === "uk" ? "Увімкнути" : lang === "ru" ? "Включить" : "Enable"), "admin_daily_toggle_on", "success", E.check)],
        [cb((lang === "uk" ? "Надіслати зараз" : lang === "ru" ? "Отправить сейчас" : "Send now"), "admin_daily_send_now", "primary", E.rocket)],
        [cb(t(lang, "admin.back"), "admin_back", "danger", E.back)]
      ]) });
    } catch { }
  });

  function getBroadcastTemplateType(): number {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    return dayOfYear % 4;
  }

  function getFriendName(lang: Language): string {
    const names: Record<Language, string> = { uk: "друже", ru: "друг", en: "friend", es: "amigo", de: "Freund" };
    return names[lang];
  }

  function getCheckNowLabel(lang: Language): string {
    const labels: Record<Language, string> = { uk: "Перевірити зараз", ru: "Проверить сейчас", en: "Check now", es: "Verificar ahora", de: "Jetzt prüfen" };
    return labels[lang];
  }

  function getOpenLabel(lang: Language): string {
    const labels: Record<Language, string> = { uk: "Відкрити DARKSHARE", ru: "Открыть DARKSHARE", en: "Open DARKSHARE", es: "Abrir DARKSHARE", de: "DARKSHARE öffnen" };
    return labels[lang];
  }

  function buildDailyReportText(lang: Language, name: string, tierLabel: string, left: number, streak: number): string {
    const scamCount = Math.floor(Math.random() * 8) + 2;
    const texts: Record<Language, string> = {
      uk: `🛡 *DARKSHARE — Щоденний звіт*
━━━━━━━━━━━━━━━━━━━━

👋 Привіт, *${name}*!

📊 *Твій акаунт:*
├ 🎖 Тариф: ${tierLabel}
├ 🔍 Залишилось перевірок: *${left}*
└ 🔥 Серія: *${streak}* днів

⚠️ *Сьогодні ${scamCount} людей ледь не попалися на скам!*
Перевіряй контакти, адреси і гаманці перед тим як довіряти.

💡 _Використай свої перевірки — захисти себе!_`,
      ru: `🛡 *DARKSHARE — Ежедневный отчёт*
━━━━━━━━━━━━━━━━━━━━

👋 Привет, *${name}*!

📊 *Твой аккаунт:*
├ 🎖 Тариф: ${tierLabel}
├ 🔍 Осталось проверок: *${left}*
└ 🔥 Серия: *${streak}* дней

⚠️ *Сегодня ${scamCount} людей чуть не попались на скам!*
Проверяй контакты, адреса и кошельки перед тем как доверять.

💡 _Используй свои проверки — защити себя!_`,
      en: `🛡 *DARKSHARE — Daily Report*
━━━━━━━━━━━━━━━━━━━━

👋 Hi, *${name}*!

📊 *Your account:*
├ 🎖 Plan: ${tierLabel}
├ 🔍 Checks remaining: *${left}*
└ 🔥 Streak: *${streak}* days

⚠️ *Today ${scamCount} people almost got scammed!*
Always check contacts, addresses and wallets before trusting.

💡 _Use your checks — protect yourself!_`,
      es: `🛡 *DARKSHARE — Informe diario*
━━━━━━━━━━━━━━━━━━━━

👋 Hola, *${name}*!

📊 *Tu cuenta:*
├ 🎖 Plan: ${tierLabel}
├ 🔍 Verificaciones restantes: *${left}*
└ 🔥 Racha: *${streak}* días

⚠️ *Hoy ${scamCount} personas casi fueron estafadas!*
Siempre verifica contactos, direcciones y billeteras antes de confiar.

💡 _Usa tus verificaciones — protégete!_`,
      de: `🛡 *DARKSHARE — Tagesbericht*
━━━━━━━━━━━━━━━━━━━━

👋 Hallo, *${name}*!

📊 *Dein Konto:*
├ 🎖 Tarif: ${tierLabel}
├ 🔍 Verbleibende Prüfungen: *${left}*
└ 🔥 Serie: *${streak}* Tage

⚠️ *Heute wären ${scamCount} Personen fast betrogen worden!*
Überprüfe immer Kontakte, Adressen und Wallets, bevor du vertraust.

💡 _Nutze deine Prüfungen — schütze dich!_`,
    };
    return texts[lang];
  }

  function buildSecurityTipText(lang: Language, name: string): string {
    const tipIndex = Math.floor(Math.random() * 6);
    const tips: Record<Language, string[]> = {
      uk: [
        "Завжди перевіряй крипто-адресу перед відправкою коштів — навіть від довірених контактів. Шахраї часто підміняють адреси в буфері обміну.",
        "Використовуй двофакторну автентифікацію (2FA) на всіх акаунтах. TOTP-додатки (Google Authenticator) надійніші за SMS.",
        "Перевіряй URL-адресу перед введенням пароля — фішингові сайти виглядають ідентично оригіналам. Зверни увагу на домен!",
        "Регулярно перевіряй свій email на витоки даних. Якщо пароль скомпрометований — зміни його негайно на всіх сервісах.",
        "Не відкривай підозрілі файли та посилання в месенджерах. Спочатку перевір хеш файлу або URL через DARKSHARE.",
        "Налаштуй моніторинг своїх доменів та IP. DARKSHARE автоматично попередить про зміни та загрози 24/7.",
      ],
      ru: [
        "Всегда проверяй крипто-адрес перед отправкой средств — даже от доверенных контактов. Мошенники часто подменяют адреса в буфере обмена.",
        "Используй двухфакторную аутентификацию (2FA) на всех аккаунтах. TOTP-приложения (Google Authenticator) надёжнее SMS.",
        "Проверяй URL-адрес перед вводом пароля — фишинговые сайты выглядят идентично оригиналам. Обрати внимание на домен!",
        "Регулярно проверяй свой email на утечки данных. Если пароль скомпрометирован — смени его немедленно на всех сервисах.",
        "Не открывай подозрительные файлы и ссылки в мессенджерах. Сначала проверь хеш файла или URL через DARKSHARE.",
        "Настрой мониторинг своих доменов и IP. DARKSHARE автоматически предупредит об изменениях и угрозах 24/7.",
      ],
      en: [
        "Always verify a crypto address before sending funds — even from trusted contacts. Scammers often replace addresses in your clipboard.",
        "Enable two-factor authentication (2FA) on all accounts. TOTP apps (Google Authenticator) are more secure than SMS.",
        "Check the URL before entering your password — phishing sites look identical to originals. Pay attention to the domain!",
        "Regularly check your email for data breaches. If a password is compromised — change it immediately on all services.",
        "Don't open suspicious files or links in messengers. First check the file hash or URL through DARKSHARE.",
        "Set up monitoring for your domains and IPs. DARKSHARE will automatically alert you about changes and threats 24/7.",
      ],
      es: [
        "Siempre verifica la dirección cripto antes de enviar fondos — incluso de contactos de confianza. Los estafadores suelen reemplazar direcciones en el portapapeles.",
        "Activa la autenticación de dos factores (2FA) en todas tus cuentas. Las apps TOTP (Google Authenticator) son más seguras que los SMS.",
        "Verifica la URL antes de ingresar tu contraseña — los sitios de phishing se ven idénticos a los originales. Presta atención al dominio!",
        "Revisa regularmente tu email en busca de filtraciones de datos. Si una contraseña fue comprometida — cámbiala de inmediato en todos los servicios.",
        "No abras archivos o enlaces sospechosos en mensajeros. Primero verifica el hash del archivo o la URL a través de DARKSHARE.",
        "Configura el monitoreo de tus dominios e IPs. DARKSHARE te alertará automáticamente sobre cambios y amenazas 24/7.",
      ],
      de: [
        "Überprüfe immer eine Krypto-Adresse vor dem Senden von Geldern — auch von vertrauenswürdigen Kontakten. Betrüger ersetzen oft Adressen in der Zwischenablage.",
        "Aktiviere die Zwei-Faktor-Authentifizierung (2FA) für alle Konten. TOTP-Apps (Google Authenticator) sind sicherer als SMS.",
        "Überprüfe die URL vor der Passworteingabe — Phishing-Seiten sehen identisch mit Originalen aus. Achte auf die Domain!",
        "Überprüfe regelmäßig deine E-Mail auf Datenlecks. Wenn ein Passwort kompromittiert wurde — ändere es sofort bei allen Diensten.",
        "Öffne keine verdächtigen Dateien oder Links in Messengern. Überprüfe zuerst den Datei-Hash oder die URL über DARKSHARE.",
        "Richte die Überwachung deiner Domains und IPs ein. DARKSHARE warnt dich automatisch bei Änderungen und Bedrohungen 24/7.",
      ],
    };
    const tip = tips[lang][tipIndex];
    const titles: Record<Language, string> = {
      uk: "Порада безпеки дня",
      ru: "Совет безопасности дня",
      en: "Security Tip of the Day",
      es: "Consejo de seguridad del día",
      de: "Sicherheitstipp des Tages",
    };
    const stayLabels: Record<Language, string> = {
      uk: "Будь у безпеці з DARKSHARE!",
      ru: "Будь в безопасности с DARKSHARE!",
      en: "Stay safe with DARKSHARE!",
      es: "Mantente seguro con DARKSHARE!",
      de: "Bleib sicher mit DARKSHARE!",
    };
    return `🔐 *DARKSHARE — ${titles[lang]}*
━━━━━━━━━━━━━━━━━━━━

👋 *${name}*,

💡 *${tip}*

🛡 _${stayLabels[lang]}_`;
  }

  function buildThreatAlertText(lang: Language, name: string): string {
    const newThreats = Math.floor(Math.random() * 120) + 30;
    const blockedIPs = Math.floor(Math.random() * 5000) + 1000;
    const phishingSites = Math.floor(Math.random() * 300) + 50;
    const compromisedWallets = Math.floor(Math.random() * 40) + 5;
    const texts: Record<Language, string> = {
      uk: `⚠️ *DARKSHARE — Зведення загроз*
━━━━━━━━━━━━━━━━━━━━

👋 *${name}*, ось що відбувається:

🌍 *Глобальна статистика за 24г:*
├ 🆕 Нових загроз виявлено: *${newThreats}*
├ 🚫 Заблоковано шкідливих IP: *${blockedIPs}*
├ 🎣 Фішингових сайтів знайдено: *${phishingSites}*
└ 💰 Скомпрометованих гаманців: *${compromisedWallets}*

🔴 *Топ загрози:*
├ Зростання фішингу через Telegram-боти
├ Нові дрейнери для SOL/ETH гаманців
└ Масові витоки email-баз даних

🛡 _Перевіряй свої адреси та контакти регулярно!_`,
      ru: `⚠️ *DARKSHARE — Сводка угроз*
━━━━━━━━━━━━━━━━━━━━

👋 *${name}*, вот что происходит:

🌍 *Глобальная статистика за 24ч:*
├ 🆕 Новых угроз обнаружено: *${newThreats}*
├ 🚫 Заблокировано вредоносных IP: *${blockedIPs}*
├ 🎣 Фишинговых сайтов найдено: *${phishingSites}*
└ 💰 Скомпрометированных кошельков: *${compromisedWallets}*

🔴 *Топ угрозы:*
├ Рост фишинга через Telegram-ботов
├ Новые дрейнеры для SOL/ETH кошельков
└ Массовые утечки email-баз данных

🛡 _Проверяй свои адреса и контакты регулярно!_`,
      en: `⚠️ *DARKSHARE — Threat Briefing*
━━━━━━━━━━━━━━━━━━━━

👋 *${name}*, here's the latest:

🌍 *Global stats (last 24h):*
├ 🆕 New threats detected: *${newThreats}*
├ 🚫 Malicious IPs blocked: *${blockedIPs}*
├ 🎣 Phishing sites found: *${phishingSites}*
└ 💰 Compromised wallets flagged: *${compromisedWallets}*

🔴 *Top threats:*
├ Rising Telegram bot phishing campaigns
├ New SOL/ETH wallet drainers detected
└ Mass email database leaks reported

🛡 _Check your addresses and contacts regularly!_`,
      es: `⚠️ *DARKSHARE — Resumen de amenazas*
━━━━━━━━━━━━━━━━━━━━

👋 *${name}*, esto es lo último:

🌍 *Estadísticas globales (últimas 24h):*
├ 🆕 Nuevas amenazas detectadas: *${newThreats}*
├ 🚫 IPs maliciosas bloqueadas: *${blockedIPs}*
├ 🎣 Sitios de phishing encontrados: *${phishingSites}*
└ 💰 Billeteras comprometidas: *${compromisedWallets}*

🔴 *Principales amenazas:*
├ Aumento de phishing a través de bots de Telegram
├ Nuevos drainers para billeteras SOL/ETH
└ Filtraciones masivas de bases de datos de email

🛡 _Verifica tus direcciones y contactos regularmente!_`,
      de: `⚠️ *DARKSHARE — Bedrohungsbericht*
━━━━━━━━━━━━━━━━━━━━

👋 *${name}*, hier sind die Neuigkeiten:

🌍 *Globale Statistik (letzte 24h):*
├ 🆕 Neue Bedrohungen erkannt: *${newThreats}*
├ 🚫 Schädliche IPs blockiert: *${blockedIPs}*
├ 🎣 Phishing-Seiten gefunden: *${phishingSites}*
└ 💰 Kompromittierte Wallets: *${compromisedWallets}*

🔴 *Top-Bedrohungen:*
├ Zunehmende Phishing-Kampagnen über Telegram-Bots
├ Neue SOL/ETH Wallet-Drainer entdeckt
└ Massive E-Mail-Datenbank-Lecks gemeldet

🛡 _Überprüfe deine Adressen und Kontakte regelmäßig!_`,
    };
    return texts[lang];
  }

  function buildFeatureSpotlightText(lang: Language, name: string): string {
    const featureIndex = Math.floor(Math.random() * 6);
    const features: Record<Language, Array<{ title: string; desc: string; tip: string }>> = {
      uk: [
        { title: "Моніторинг 24/7", desc: "Автоматичне відстеження змін для доменів, IP та гаманців з миттєвими Telegram-сповіщеннями.", tip: "Додай свій домен у моніторинг і отримуй алерти про будь-які зміни DNS, SSL або WHOIS." },
        { title: "Bulk-перевірка", desc: "Перевіряй до 50 цілей одночасно — IP, email або домени списком.", tip: "Вставляй список по одному на рядок і отримуй зведений звіт за секунди." },
        { title: "PDF-звіти", desc: "Генеруй брендовані PDF-звіти з risk score, findings та metadata для клієнтів.", tip: "Ідеально для пентестерів та консультантів — надсилай професійні звіти клієнтам." },
        { title: "Inline-режим", desc: "Використовуй @DarkShare1Bot прямо в будь-якому чаті для швидких перевірок.", tip: "Введи @DarkShare1Bot ip 8.8.8.8 прямо в чаті — результат з'явиться як inline-повідомлення." },
        { title: "Крипто-аналіз", desc: "Аналіз ETH, BTC, TRX, SOL гаманців: баланс, транзакції, міксери, скам-бази.", tip: "Перевіряй гаманці перед відправкою криптовалюти — захисти свої кошти." },
        { title: "Username OSINT", desc: "Пошук профілів на 200+ платформах: соцмережі, форуми, dev-платформи.", tip: "Введи username і дізнайся, де ця людина зареєстрована — для розслідувань та OSINT." },
      ],
      ru: [
        { title: "Мониторинг 24/7", desc: "Автоматическое отслеживание изменений для доменов, IP и кошельков с мгновенными Telegram-уведомлениями.", tip: "Добавь свой домен в мониторинг и получай алерты о любых изменениях DNS, SSL или WHOIS." },
        { title: "Bulk-проверка", desc: "Проверяй до 50 целей одновременно — IP, email или домены списком.", tip: "Вставляй список по одному на строку и получай сводный отчёт за секунды." },
        { title: "PDF-отчёты", desc: "Генерируй брендированные PDF-отчёты с risk score, findings и metadata для клиентов.", tip: "Идеально для пентестеров и консультантов — отправляй профессиональные отчёты клиентам." },
        { title: "Inline-режим", desc: "Используй @DarkShare1Bot прямо в любом чате для быстрых проверок.", tip: "Введи @DarkShare1Bot ip 8.8.8.8 прямо в чате — результат появится как inline-сообщение." },
        { title: "Крипто-анализ", desc: "Анализ ETH, BTC, TRX, SOL кошельков: баланс, транзакции, миксеры, скам-базы.", tip: "Проверяй кошельки перед отправкой криптовалюты — защити свои средства." },
        { title: "Username OSINT", desc: "Поиск профилей на 200+ платформах: соцсети, форумы, dev-платформы.", tip: "Введи username и узнай, где этот человек зарегистрирован — для расследований и OSINT." },
      ],
      en: [
        { title: "24/7 Monitoring", desc: "Automatic change tracking for domains, IPs, and wallets with instant Telegram notifications.", tip: "Add your domain to monitoring and get alerts about any DNS, SSL, or WHOIS changes." },
        { title: "Bulk Check", desc: "Check up to 50 targets at once — IPs, emails, or domains as a list.", tip: "Paste a list (one per line) and get a summary report in seconds." },
        { title: "PDF Reports", desc: "Generate branded PDF reports with risk score, findings, and metadata for clients.", tip: "Perfect for pentesters and consultants — send professional reports to your clients." },
        { title: "Inline Mode", desc: "Use @DarkShare1Bot directly in any chat for quick checks.", tip: "Type @DarkShare1Bot ip 8.8.8.8 right in a chat — the result appears as an inline message." },
        { title: "Crypto Analysis", desc: "Analyze ETH, BTC, TRX, SOL wallets: balance, transactions, mixers, scam databases.", tip: "Check wallets before sending crypto — protect your funds." },
        { title: "Username OSINT", desc: "Search profiles across 200+ platforms: social media, forums, dev platforms.", tip: "Enter a username and discover where that person is registered — for investigations and OSINT." },
      ],
      es: [
        { title: "Monitoreo 24/7", desc: "Seguimiento automático de cambios para dominios, IPs y billeteras con notificaciones instantáneas por Telegram.", tip: "Agrega tu dominio al monitoreo y recibe alertas sobre cualquier cambio en DNS, SSL o WHOIS." },
        { title: "Verificación masiva", desc: "Verifica hasta 50 objetivos a la vez — IPs, emails o dominios como lista.", tip: "Pega una lista (uno por línea) y obtén un informe resumido en segundos." },
        { title: "Informes PDF", desc: "Genera informes PDF con marca, puntuación de riesgo, hallazgos y metadatos para clientes.", tip: "Perfecto para pentesters y consultores — envía informes profesionales a tus clientes." },
        { title: "Modo Inline", desc: "Usa @DarkShare1Bot directamente en cualquier chat para verificaciones rápidas.", tip: "Escribe @DarkShare1Bot ip 8.8.8.8 en un chat — el resultado aparece como mensaje inline." },
        { title: "Análisis Cripto", desc: "Analiza billeteras ETH, BTC, TRX, SOL: balance, transacciones, mixers, bases de scam.", tip: "Verifica billeteras antes de enviar cripto — protege tus fondos." },
        { title: "Username OSINT", desc: "Busca perfiles en más de 200 plataformas: redes sociales, foros, plataformas dev.", tip: "Ingresa un username y descubre dónde está registrada esa persona — para investigaciones y OSINT." },
      ],
      de: [
        { title: "24/7 Überwachung", desc: "Automatische Änderungsverfolgung für Domains, IPs und Wallets mit sofortigen Telegram-Benachrichtigungen.", tip: "Füge deine Domain zur Überwachung hinzu und erhalte Warnungen bei DNS-, SSL- oder WHOIS-Änderungen." },
        { title: "Massenprüfung", desc: "Prüfe bis zu 50 Ziele gleichzeitig — IPs, E-Mails oder Domains als Liste.", tip: "Füge eine Liste ein (eine pro Zeile) und erhalte einen zusammenfassenden Bericht in Sekunden." },
        { title: "PDF-Berichte", desc: "Erstelle gebrandete PDF-Berichte mit Risikobewertung, Ergebnissen und Metadaten für Kunden.", tip: "Perfekt für Pentester und Berater — sende professionelle Berichte an deine Kunden." },
        { title: "Inline-Modus", desc: "Verwende @DarkShare1Bot direkt in jedem Chat für schnelle Prüfungen.", tip: "Gib @DarkShare1Bot ip 8.8.8.8 direkt im Chat ein — das Ergebnis erscheint als Inline-Nachricht." },
        { title: "Krypto-Analyse", desc: "Analysiere ETH, BTC, TRX, SOL Wallets: Guthaben, Transaktionen, Mixer, Scam-Datenbanken.", tip: "Überprüfe Wallets vor dem Senden von Krypto — schütze deine Gelder." },
        { title: "Username OSINT", desc: "Suche Profile auf über 200 Plattformen: Social Media, Foren, Dev-Plattformen.", tip: "Gib einen Benutzernamen ein und finde heraus, wo diese Person registriert ist — für Ermittlungen und OSINT." },
      ],
    };
    const feature = features[lang][featureIndex];
    const spotlightLabels: Record<Language, string> = {
      uk: "Функція дня",
      ru: "Функция дня",
      en: "Feature Spotlight",
      es: "Función del día",
      de: "Feature des Tages",
    };
    const tipLabels: Record<Language, string> = {
      uk: "Порада",
      ru: "Совет",
      en: "Tip",
      es: "Consejo",
      de: "Tipp",
    };
    const tryLabels: Record<Language, string> = {
      uk: "Спробуй прямо зараз!",
      ru: "Попробуй прямо сейчас!",
      en: "Try it right now!",
      es: "Pruébalo ahora mismo!",
      de: "Probiere es jetzt aus!",
    };
    return `🚀 *DARKSHARE — ${spotlightLabels[lang]}*
━━━━━━━━━━━━━━━━━━━━

👋 *${name}*,

⭐ *${feature.title}*
${feature.desc}

💡 *${tipLabels[lang]}:* ${feature.tip}

🎯 _${tryLabels[lang]}_`;
  }

  async function sendDailyBroadcast(): Promise<number> {
    const allUsers = await storage.getAllUsers();
    const eligibleUsers = allUsers.filter(u => !u.blocked && u.notifsOn !== false && u.tgId && !u.tgId.startsWith("replit:"));
    const webUrl = process.env.WEB_DOMAIN || "https://www.darkshare.store";
    const templateType = getBroadcastTemplateType();
    let sentCount = 0;

    for (const u of eligibleUsers) {
      const lang = getUserLang(u.lang);
      const name = u.username || getFriendName(lang);
      const left = u.requestsLeft ?? 0;
      const tierLabel = u.tier === "PRO" ? "⭐ PRO" : u.tier === "ENTERPRISE" ? "👑 ENTERPRISE" : u.tier === "GROUPS" ? "👥 GROUPS" : "🆓 FREE";

      let text: string;
      switch (templateType) {
        case 0:
          text = buildDailyReportText(lang, name, tierLabel, left, u.streakDays || 0);
          break;
        case 1:
          text = buildSecurityTipText(lang, name);
          break;
        case 2:
          text = buildThreatAlertText(lang, name);
          break;
        case 3:
          text = buildFeatureSpotlightText(lang, name);
          break;
        default:
          text = buildDailyReportText(lang, name, tierLabel, left, u.streakDays || 0);
      }

      try {
        await bot.telegram.sendMessage(u.tgId!, text, {
          parse_mode: "Markdown",
          ...Markup.inlineKeyboard([
            [cb(getCheckNowLabel(lang), "check_all", "primary", E.search)],
            [urlS(getOpenLabel(lang), webUrl, "success", E.globe)]
          ])
        });
        sentCount++;
      } catch (err: any) {
        if (err?.response?.error_code === 403) {
          // user blocked the bot
        }
      }
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    await storage.setAdminSetting("daily_broadcast_last_sent", new Date().toISOString());
    await storage.setAdminSetting("daily_broadcast_last_reach", sentCount.toString());
    console.log(`Daily broadcast sent to ${sentCount}/${eligibleUsers.length} users (template: ${templateType})`);
    return sentCount;
  }

  bot.action("admin_daily_send_now", async (ctx) => {
    const tgId = ctx.from!.id.toString();
    const lang = await getLang(tgId);
    if (!isAdmin(tgId)) return ctx.answerCbQuery(t(lang, "admin.accessDenied"));
    
    await ctx.answerCbQuery(lang === "uk" ? "🚀 Розсилка почалась..." : "🚀 Broadcasting...");
    try {
      await ctx.editMessageText(
        `🚀 *${lang === "uk" ? "Розсилка почалась..." : lang === "ru" ? "Рассылка началась..." : "Broadcasting..."}*\n\n${lang === "uk" ? "Зачекайте, це може зайняти деякий час." : lang === "ru" ? "Подождите, это может занять некоторое время." : "Please wait, this may take some time."}`,
        { parse_mode: "Markdown" }
      );
    } catch { }

    const sentCount = await sendDailyBroadcast();
    
    const doneText = `✅ *${lang === "uk" ? "Розсилку завершено!" : lang === "ru" ? "Рассылка завершена!" : "Broadcast complete!"}*\n\n📊 ${lang === "uk" ? "Відправлено" : lang === "ru" ? "Отправлено" : "Sent"}: *${sentCount}* ${lang === "uk" ? "повідомлень" : lang === "ru" ? "сообщений" : "messages"}`;
    try {
      await ctx.editMessageText(doneText, {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([
          [cb((lang === "uk" ? "Назад" : lang === "ru" ? "Назад" : "Back"), "admin_daily_broadcast", "primary", E.back)],
          [cb(t(lang, "admin.back"), "admin_back", "danger", E.back)]
        ])
      });
    } catch {
      await ctx.reply(doneText, {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([
          [cb(t(lang, "admin.back"), "admin_back", "danger", E.back)]
        ])
      });
    }
  });

  // Telegram monitoring poller — checks active watches and notifies users via DM
  const MONITOR_INTERVAL_MS = Math.max(60_000, Number(process.env.BOT_MONITOR_INTERVAL_MS || 5 * 60_000));
  const monitorState = new Map<string, number>();
  const intervalSeconds = (val: any): number => {
    const s = String(val || "").toLowerCase().trim();
    if (s === "1h") return 3600;
    if (s === "6h") return 21600;
    if (s === "24h" || s === "1d") return 86400;
    const n = Number(val);
    return Number.isFinite(n) && n > 0 ? n : 21600;
  };
  setInterval(async () => {
    try {
      const watches = await storage.getAllWatches().catch(() => [] as any[]);
      if (!Array.isArray(watches) || watches.length === 0) return;

      const { performCheck } = await import("./checkService.js").catch(() => ({ performCheck: null as any }));
      if (typeof performCheck !== "function") return;

      const now = Date.now();
      for (const w of watches) {
        try {
          if (w.alertsOn === false) continue;
          const meta = (w.thresholdsJson || {}) as any;
          const intervalS = intervalSeconds((w as any).interval || meta.interval);
          const lastTs = w.lastCheck ? new Date(w.lastCheck).getTime() : 0;
          if (lastTs && now - lastTs < intervalS * 1000) continue;

          const result = await performCheck(w.objectType, w.value);
          const threshold: number = typeof meta.threshold === "number" ? meta.threshold : 70;
          const lastScore: number | undefined = meta.lastScore;
          const crossed = result.riskScore >= threshold && (lastScore === undefined || lastScore < threshold);

          await storage.updateWatch(w.id, {
            lastCheck: new Date(),
            status: result.riskLevel,
            thresholdsJson: { ...meta, lastScore: result.riskScore },
          } as any);

          if (!crossed) continue;

          const user = await storage.getUser(w.userId).catch(() => null);
          if (!user || !user.tgId) continue;

          const dedupeKey = `${w.id}:${result.riskLevel}`;
          const lastNotified = monitorState.get(dedupeKey) || 0;
          if (now - lastNotified < 30 * 60_000) continue;
          monitorState.set(dedupeKey, now);

          const lang = getUserLang(user.lang);
          const webUrl = process.env.WEB_DOMAIN || "https://www.darkshare.store";
          const emoji = result.riskLevel === "critical" ? "🔴" : result.riskLevel === "high" ? "🟠" : "🟡";
          const head = lang === "uk" ? "Сповіщення моніторингу" : lang === "ru" ? "Уведомление мониторинга" : lang === "es" ? "Alerta de monitoreo" : lang === "de" ? "Monitoring-Alarm" : "Monitoring alert";
          const lvlLabel = lang === "uk" ? "Рівень" : lang === "ru" ? "Уровень" : lang === "es" ? "Nivel" : lang === "de" ? "Stufe" : "Level";
          const scoreLabel = lang === "uk" ? "Ризик" : lang === "ru" ? "Риск" : lang === "es" ? "Riesgo" : lang === "de" ? "Risiko" : "Risk";
          const targetLabel = lang === "uk" ? "Об'єкт" : lang === "ru" ? "Объект" : lang === "es" ? "Objeto" : lang === "de" ? "Ziel" : "Target";
          const safeTarget = String(w.value || "").replace(/[*_`\[\]]/g, "").slice(0, 80);
          const text = `${emoji} *${head}*\n\n` +
            `${targetLabel}: \`${safeTarget}\`\n` +
            `${lvlLabel}: *${result.riskLevel.toUpperCase()}*\n` +
            `${scoreLabel}: *${result.riskScore}/100*\n` +
            `${(w.objectType || "").toUpperCase()}`;
          const kb = Markup.inlineKeyboard([
            [urlS(lang === "uk" ? "🌐 Відкрити" : lang === "ru" ? "🌐 Открыть" : lang === "es" ? "🌐 Abrir" : lang === "de" ? "🌐 Öffnen" : "🌐 Open", `${webUrl}/history`, "primary", E.globe)],
            [cb(t(lang, "buttons.monitoring"), "monitoring", "primary", E.eye)],
          ]);
          try {
            await bot.telegram.sendMessage(user.tgId, text, { parse_mode: "Markdown", ...kb });
          } catch (e: any) {
            console.warn("[bot-monitor] sendMessage failed:", e?.message || e);
          }

          // Mirror alerts to Slack / Microsoft Teams webhooks if configured
          try {
            const plain = `${emoji} ${head}\n${targetLabel}: ${safeTarget}\n${lvlLabel}: ${result.riskLevel.toUpperCase()}\n${scoreLabel}: ${result.riskScore}/100\nModule: ${(w.objectType || "").toUpperCase()}\n${webUrl}/history`;
            const slack = (user as any).slackWebhookUrl as string | null | undefined;
            if (slack && /^https:\/\/hooks\.slack\.com\//.test(slack)) {
              fetch(slack, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  text: `*${head}*`,
                  blocks: [
                    { type: "header", text: { type: "plain_text", text: `${emoji} ${head}` } },
                    { type: "section", fields: [
                      { type: "mrkdwn", text: `*${targetLabel}:*\n\`${safeTarget}\`` },
                      { type: "mrkdwn", text: `*${lvlLabel}:*\n${result.riskLevel.toUpperCase()}` },
                      { type: "mrkdwn", text: `*${scoreLabel}:*\n${result.riskScore}/100` },
                      { type: "mrkdwn", text: `*Module:*\n${(w.objectType || "").toUpperCase()}` },
                    ]},
                    { type: "actions", elements: [
                      { type: "button", text: { type: "plain_text", text: "Open dashboard" }, url: `${webUrl}/history` },
                    ]},
                  ],
                }),
              }).catch((err) => console.warn("[bot-monitor] slack webhook failed:", err?.message || err));
            }
            const teams = (user as any).teamsWebhookUrl as string | null | undefined;
            if (teams && /^https:\/\/[\w.-]+\.webhook\.office\.com\//.test(teams)) {
              const colorMap: Record<string, string> = { critical: "FF3B30", high: "FF9500", medium: "FFCC00", low: "34C759" };
              fetch(teams, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  "@type": "MessageCard",
                  "@context": "https://schema.org/extensions",
                  themeColor: colorMap[result.riskLevel] || "FF9500",
                  summary: head,
                  title: `${emoji} ${head}`,
                  sections: [{
                    facts: [
                      { name: targetLabel, value: safeTarget },
                      { name: lvlLabel, value: result.riskLevel.toUpperCase() },
                      { name: scoreLabel, value: `${result.riskScore}/100` },
                      { name: "Module", value: (w.objectType || "").toUpperCase() },
                    ],
                    markdown: true,
                  }],
                  potentialAction: [{
                    "@type": "OpenUri",
                    name: "Open dashboard",
                    targets: [{ os: "default", uri: `${webUrl}/history` }],
                  }],
                }),
              }).catch((err) => console.warn("[bot-monitor] teams webhook failed:", err?.message || err));
            }
          } catch {}
        } catch (perWatchErr: any) {
          // skip individual failures
        }
      }
    } catch (err: any) {
      console.warn("[bot-monitor] poller error:", err?.message || err);
    }
  }, MONITOR_INTERVAL_MS);

  // Daily broadcast scheduler - runs every hour, sends at 10:00 UTC
  setInterval(async () => {
    try {
      const enabled = await storage.getAdminSetting("daily_broadcast_enabled");
      if (enabled !== "true") return;

      const now = new Date();
      if (now.getUTCHours() !== 10) return;

      const lastSent = await storage.getAdminSetting("daily_broadcast_last_sent");
      if (lastSent) {
        const lastDate = new Date(lastSent);
        const hoursSince = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60);
        if (hoursSince < 20) return;
      }

      console.log("Running scheduled daily broadcast...");
      await sendDailyBroadcast();
    } catch (err) {
      console.error("Daily broadcast scheduler error:", err);
    }
  }, 60 * 60 * 1000);

  bot.catch((err: any, ctx) => {
    if (err?.message?.includes("message is not modified")) {
      return;
    }
    console.error(`Bot error for ${ctx.updateType}:`, err);
  });

  console.log("Starting bot polling...");
  
  let retryCount = 0;
  const maxRetries = 5;
  
  const startBot = () => {
    bot.launch({ 
        dropPendingUpdates: true,
        allowedUpdates: ["message", "callback_query", "inline_query", "chosen_inline_result", "chat_member", "my_chat_member", "pre_checkout_query"]
      })
      .catch((err: Error) => {
        console.error("Bot error:", err.message);
        if ((err.message.includes("409") || err.message.includes("Conflict")) && retryCount < maxRetries) {
          retryCount++;
          const delay = 10000 * Math.pow(2, retryCount - 1);
          console.log(`Bot conflict detected, retry ${retryCount}/${maxRetries} in ${delay / 1000}s...`);
          setTimeout(startBot, delay);
        } else if (retryCount >= maxRetries) {
          console.warn("Bot polling failed after max retries. Another instance may be running.");
        }
      });
  };
  
  console.log("Waiting 8s before starting bot polling to avoid conflicts...");
  setTimeout(startBot, 8000);

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));

  console.log("Bot is now running and listening for messages!");
  return bot;
}
