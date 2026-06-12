import { OSINT_SOURCES, type OsintCategory, type OsintSource } from "../../shared/osintSources";

export type Lang = "en" | "uk";
export const PSEO_LANGS: Lang[] = ["en", "uk"];

export function langPrefix(lang: Lang): string {
  return lang === "en" ? "" : `/${lang}`;
}

// ── HTML helpers ──────────────────────────────────────────────────────
export function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function maskTarget(type: string, raw: string): string {
  const v = (raw || "").trim();
  if (!v) return "—";
  if (type === "email" && v.includes("@")) {
    const [u, d] = v.split("@");
    const head = u.slice(0, 1);
    return `${head}${"*".repeat(Math.max(2, Math.min(u.length - 1, 4)))}@${d}`;
  }
  if (type === "phone") {
    const digits = v.replace(/[^\d+]/g, "");
    return digits.length > 4 ? `${digits.slice(0, 4)} *** ${digits.slice(-2)}` : "***";
  }
  if (type === "wallet" || type === "hash") {
    return v.length > 14 ? `${v.slice(0, 6)}…${v.slice(-4)}` : v;
  }
  if (type === "ip") {
    if (v.includes(":")) return v.split(":").slice(0, 2).join(":") + ":***";
    const p = v.split(".");
    return p.length === 4 ? `${p[0]}.${p[1]}.*.*` : v;
  }
  if (type === "domain" || type === "url") return v.slice(0, 48);
  return v.length > 10 ? `${v.slice(0, 4)}…${v.slice(-2)}` : v;
}

// ── Sources ───────────────────────────────────────────────────────────
export function sourcesFor(cats: OsintCategory[]): OsintSource[] {
  const seen = new Set<string>();
  const out: OsintSource[] = [];
  for (const c of cats) {
    for (const s of OSINT_SOURCES.filter((x) => x.category === c)) {
      if (!seen.has(s.name)) {
        seen.add(s.name);
        out.push(s);
      }
    }
  }
  return out;
}

export const SOURCE_TOTAL = OSINT_SOURCES.length;

// ── UI chrome strings ────────────────────────────────────────────────
export const UI: Record<Lang, Record<string, string>> = {
  en: {
    brandTag: "OSINT & Threat Intelligence",
    nav_tools: "All checks",
    nav_ip: "IP reputation",
    nav_home: "Run a scan",
    home: "Home",
    checkCta: "Check it free now",
    checkSub: "3 anonymous scans a day · no signup · zero query logs",
    whatWeCheck: "What we check",
    sourcesTitle: "Data sources we cross-reference",
    sourcesMore: "and more",
    howScoring: "How the 0–100 risk score works",
    faqTitle: "Frequently asked questions",
    relatedTitle: "Related checks",
    tryTitle: "Try it on your own data",
    footerTagline: "Open-source intelligence and risk scoring across 159+ sources and 14 leak databases.",
    footerChecks: "Popular checks",
    footerCountries: "IP reputation by country",
    footerProduct: "Product",
    disclaimer: "DARKSHARE aggregates publicly available open-source intelligence for security and fraud-prevention research. Results are indicators, not legal proof.",
    updated: "Updated",
    readMin: "min read",
    seconds: "in seconds",
  },
  uk: {
    brandTag: "OSINT та аналіз загроз",
    nav_tools: "Усі перевірки",
    nav_ip: "Репутація IP",
    nav_home: "Запустити сканування",
    home: "Головна",
    checkCta: "Перевірити безкоштовно",
    checkSub: "3 анонімних сканування на день · без реєстрації · нуль логів запитів",
    whatWeCheck: "Що ми перевіряємо",
    sourcesTitle: "Джерела, які ми зіставляємо",
    sourcesMore: "та інші",
    howScoring: "Як працює оцінка ризику 0–100",
    faqTitle: "Поширені запитання",
    relatedTitle: "Схожі перевірки",
    tryTitle: "Перевір на власних даних",
    footerTagline: "Розвідка з відкритих джерел та оцінка ризику за 159+ джерелами і 14 базами витоків.",
    footerChecks: "Популярні перевірки",
    footerCountries: "Репутація IP за країнами",
    footerProduct: "Продукт",
    disclaimer: "DARKSHARE агрегує загальнодоступну розвідку з відкритих джерел для дослідження безпеки та запобігання шахрайству. Результати є індикаторами, а не юридичним доказом.",
    updated: "Оновлено",
    readMin: "хв читання",
    seconds: "за секунди",
  },
};

// ── Tool page content ─────────────────────────────────────────────────
export interface ToolCopy {
  name: string;
  h1: string;
  metaTitle: string;
  metaDescription: string;
  intro: string[];
  whatWeCheck: string[];
  scoring: string;
  faq: { q: string; a: string }[];
}
export interface ToolType {
  slug: string; // e.g. "check-email"
  key: string; // maps to /api/check type when checkable
  checkable: boolean;
  categories: OsintCategory[];
  en: ToolCopy;
  uk: ToolCopy;
}

export const TOOL_TYPES: ToolType[] = [
  {
    slug: "check-email",
    key: "email",
    checkable: true,
    categories: ["email", "leaks", "social"],
    en: {
      name: "Email",
      h1: "Has this email been leaked or used in a scam?",
      metaTitle: "Check an email for leaks & scams — free OSINT lookup | DARKSHARE",
      metaDescription:
        "Paste any email to see which data breaches exposed it, whether it's disposable or risky, and where it appears online. Free, no signup, results in seconds.",
      intro: [
        "An email address is the master key to someone's digital life — password resets, banking, social accounts. If it shows up in a breach or on a scam list, every account tied to it is at risk.",
        "DARKSHARE checks the address against 14 leak databases and dozens of reputation and social-footprint sources, then returns a single 0–100 risk score so you don't have to read raw dumps.",
      ],
      whatWeCheck: [
        "Breach exposure — how many known data leaks include this address, and roughly when.",
        "Reputation & deliverability — is it disposable, newly created, or flagged for spam/fraud.",
        "Account footprint — public services and social networks where the email is registered.",
        "Scam & abuse lists — appearance on spam and fraud reporting databases.",
      ],
      scoring:
        "Each signal is weighted by severity: a recent credential breach counts far more than a years-old marketing-list leak. Disposable domains, fraud-list hits and wide account exposure push the score up; a clean, established address with no leaks scores low.",
      faq: [
        { q: "Is it safe to check my own email here?", a: "Yes. We query public OSINT sources read-only and keep zero query logs. We never email the address or notify its owner." },
        { q: "What should I do if my email was breached?", a: "Change the password on every account that used it, enable two-factor authentication, and stop reusing that password. The report lists concrete next steps." },
        { q: "Does a leak mean I was hacked?", a: "Not necessarily — it means the address appeared in a dataset stolen from some service. But if you reused the password there, treat all those accounts as compromised." },
      ],
    },
    uk: {
      name: "Email",
      h1: "Чи витік цей email і чи не використовують його шахраї?",
      metaTitle: "Перевірка email на витоки та шахрайство — безкоштовно | DARKSHARE",
      metaDescription:
        "Встав будь-який email і дізнайся, у яких витоках він засвітився, чи він одноразовий або ризиковий, і де трапляється онлайн. Безкоштовно, без реєстрації, за секунди.",
      intro: [
        "Email — це головний ключ до цифрового життя людини: скидання паролів, банк, соцмережі. Якщо адреса потрапила у витік або до списку шахраїв, під загрозою кожен прив'язаний до неї акаунт.",
        "DARKSHARE звіряє адресу з 14 базами витоків і десятками джерел репутації та цифрового сліду, після чого повертає єдину оцінку ризику 0–100 — щоб ти не копався у сирих дампах.",
      ],
      whatWeCheck: [
        "Витоки — у скількох відомих витоках є ця адреса та приблизно коли.",
        "Репутація — чи це одноразова, щойно створена або позначена за спам/шахрайство адреса.",
        "Цифровий слід — публічні сервіси та соцмережі, де зареєстровано email.",
        "Списки шахрайства — наявність у базах скарг на спам і фрод.",
      ],
      scoring:
        "Кожен сигнал зважується за серйозністю: свіжий витік паролів важить набагато більше, ніж старий витік маркетингової бази. Одноразові домени, потрапляння у фрод-списки та широкий слід підвищують оцінку; чиста давня адреса без витоків отримує низький бал.",
      faq: [
        { q: "Чи безпечно перевіряти власний email тут?", a: "Так. Ми звертаємось до відкритих OSINT-джерел лише для читання і не зберігаємо логів запитів. Ми ніколи не пишемо на адресу й не повідомляємо її власника." },
        { q: "Що робити, якщо мій email у витоку?", a: "Зміни пароль на всіх акаунтах із цією адресою, увімкни двофакторну автентифікацію і перестань повторювати пароль. У звіті є конкретні кроки." },
        { q: "Витік означає, що мене зламали?", a: "Не обов'язково — це означає, що адреса з'явилася в наборі, викраденому в якогось сервісу. Але якщо ти повторював там пароль, вважай ці акаунти скомпрометованими." },
      ],
    },
  },
  {
    slug: "check-phone",
    key: "phone",
    checkable: true,
    categories: ["phone", "leaks", "social"],
    en: {
      name: "Phone number",
      h1: "Is this phone number a scammer or spam caller?",
      metaTitle: "Check a phone number for scams & spam — free lookup | DARKSHARE",
      metaDescription:
        "Look up any phone number: carrier and line type, scam/spam reports, leak exposure and linked accounts. Free OSINT phone check, no signup, results in seconds.",
      intro: [
        "Unknown number calling about a 'delivery', a 'bank security check' or a 'prize'? Most scams start with a phone call or message. Before you call back or trust it, check who's really behind the number.",
        "DARKSHARE combines carrier and line-type data with crowd-sourced spam reports and leak exposure into one 0–100 risk score.",
      ],
      whatWeCheck: [
        "Carrier & line type — mobile, landline or VoIP (VoIP and recently ported numbers are favoured by scammers).",
        "Spam & scam reports — community complaints and known fraud-caller databases.",
        "Leak exposure — breaches and dumps where the number appears.",
        "Linked accounts — public services and messengers registered to the number.",
      ],
      scoring:
        "VoIP origin, a cluster of recent spam reports and appearance on scam lists raise the score sharply. A long-held mobile number with no complaints scores low.",
      faq: [
        { q: "Can I find out who owns a number?", a: "We surface public caller-ID, linked accounts and reports — not private subscriber records. That's usually enough to tell a scammer from a legitimate caller." },
        { q: "Why are VoIP numbers riskier?", a: "They're cheap, disposable and easy to spoof, so fraudsters churn through them. A VoIP line claiming to be your bank is a red flag." },
        { q: "Does checking notify the number's owner?", a: "No. The lookup is silent and read-only." },
      ],
    },
    uk: {
      name: "Номер телефону",
      h1: "Цей номер — шахрай чи спам-дзвінок?",
      metaTitle: "Перевірка номера телефону на шахрайство та спам | DARKSHARE",
      metaDescription:
        "Перевір будь-який номер: оператор і тип лінії, скарги на спам/шахрайство, витоки та прив'язані акаунти. Безкоштовно, без реєстрації, за секунди.",
      intro: [
        "Невідомий номер дзвонить про «посилку», «перевірку безпеки банку» чи «виграш»? Більшість шахрайств починаються з дзвінка або повідомлення. Перш ніж передзвонити чи довіритись — перевір, хто справді за номером.",
        "DARKSHARE поєднує дані про оператора й тип лінії зі скаргами користувачів на спам і витоками в одну оцінку ризику 0–100.",
      ],
      whatWeCheck: [
        "Оператор і тип лінії — мобільний, стаціонарний чи VoIP (VoIP і щойно перенесені номери люблять шахраї).",
        "Скарги на спам — звернення спільноти та бази відомих шахрайських номерів.",
        "Витоки — бази й дампи, де трапляється номер.",
        "Прив'язані акаунти — публічні сервіси та месенджери, зареєстровані на номер.",
      ],
      scoring:
        "Походження VoIP, скупчення свіжих скарг на спам і потрапляння до шахрайських списків різко підвищують оцінку. Давній мобільний номер без скарг отримує низький бал.",
      faq: [
        { q: "Чи можна дізнатись власника номера?", a: "Ми показуємо публічний caller-ID, прив'язані акаунти та скарги — не приватні дані абонента. Зазвичай цього досить, щоб відрізнити шахрая від легітимного дзвінка." },
        { q: "Чому VoIP-номери ризикованіші?", a: "Вони дешеві, одноразові й легко підробляються, тож шахраї міняють їх пачками. VoIP-лінія, що видає себе за твій банк, — тривожний сигнал." },
        { q: "Чи дізнається власник про перевірку?", a: "Ні. Перевірка тиха й лише для читання." },
      ],
    },
  },
  {
    slug: "check-wallet",
    key: "wallet",
    checkable: true,
    categories: ["wallet", "darkweb", "threat"],
    en: {
      name: "Crypto wallet",
      h1: "Is this crypto wallet a scam or sanctioned address?",
      metaTitle: "Check a crypto wallet for scams & fraud — free | DARKSHARE",
      metaDescription:
        "Paste a BTC, ETH, TRON or BSC address to check it against scam darklists, sanctions (OFAC) and abuse reports before you send. Free, no signup, in seconds.",
      intro: [
        "Crypto is irreversible — once you send to a scammer's address, it's gone. Before paying an exchange, a seller or an 'investment', verify the wallet isn't already flagged.",
        "DARKSHARE screens the address against scam darklists, sanctions lists and on-chain abuse reports and returns a 0–100 risk score.",
      ],
      whatWeCheck: [
        "Scam darklists — known fraud, phishing-drainer and Ponzi addresses.",
        "Sanctions — OFAC SDN and other watchlists.",
        "Abuse reports — community reports of theft, extortion and ransomware.",
        "On-chain context — balance, age and links to flagged clusters or mixers.",
      ],
      scoring:
        "A sanctions hit or confirmed scam-list entry is near-maximal risk. Mixer exposure, links to flagged clusters and recent abuse reports add weight; a long-lived address with clean history scores low.",
      faq: [
        { q: "Which chains are supported?", a: "Major chains including Bitcoin, Ethereum, BSC, Polygon and TRON. Paste the address and we detect the network." },
        { q: "A clean score means it's safe to send?", a: "It means no public source has flagged it yet. New scam addresses appear constantly — a low score lowers risk but never guarantees safety." },
        { q: "Can I check an address that scammed me?", a: "Yes, and you can report it to the linked abuse databases to warn others." },
      ],
    },
    uk: {
      name: "Криптогаманець",
      h1: "Цей криптогаманець — шахрайський чи під санкціями?",
      metaTitle: "Перевірка криптогаманця на шахрайство — безкоштовно | DARKSHARE",
      metaDescription:
        "Встав адресу BTC, ETH, TRON чи BSC і звір її зі шахрайськими списками, санкціями (OFAC) та скаргами перед переказом. Безкоштовно, без реєстрації, за секунди.",
      intro: [
        "Крипта незворотна — щойно відправив на адресу шахрая, гроші зникли. Перш ніж платити біржі, продавцю чи в «інвестицію», перевір, чи не позначений гаманець.",
        "DARKSHARE звіряє адресу зі шахрайськими списками, санкційними переліками та on-chain скаргами і повертає оцінку ризику 0–100.",
      ],
      whatWeCheck: [
        "Шахрайські списки — відомі адреси фроду, дрейнерів-фішингу та пірамід.",
        "Санкції — OFAC SDN та інші списки спостереження.",
        "Скарги — звернення спільноти про крадіжки, вимагання та ransomware.",
        "On-chain контекст — баланс, вік і зв'язки з позначеними кластерами чи міксерами.",
      ],
      scoring:
        "Потрапляння під санкції чи у підтверджений шахрайський список — майже максимальний ризик. Зв'язок із міксерами, позначеними кластерами та свіжі скарги додають ваги; давня адреса з чистою історією отримує низький бал.",
      faq: [
        { q: "Які мережі підтримуються?", a: "Основні: Bitcoin, Ethereum, BSC, Polygon і TRON. Встав адресу — мережу визначимо автоматично." },
        { q: "Чистий бал означає, що відправляти безпечно?", a: "Це означає, що жодне публічне джерело ще не позначило адресу. Нові шахрайські адреси з'являються постійно — низький бал знижує ризик, але не гарантує безпеку." },
        { q: "Чи можна перевірити адресу, яка мене ошукала?", a: "Так, і ти можеш повідомити про неї у пов'язані бази, щоб попередити інших." },
      ],
    },
  },
  {
    slug: "check-domain",
    key: "domain",
    checkable: true,
    categories: ["domain", "threat", "darkweb"],
    en: {
      name: "Domain / website",
      h1: "Is this website safe or a phishing / scam site?",
      metaTitle: "Check if a website is safe — free domain scanner | DARKSHARE",
      metaDescription:
        "Enter a domain to check blacklists, phishing & malware feeds, WHOIS age, SSL and reputation before you trust the site. Free, no signup, results in seconds.",
      intro: [
        "Fake shops, phishing pages and malware sites copy real brands to steal money and logins. A newly registered domain pretending to be a known store is the classic scam setup.",
        "DARKSHARE checks the domain against phishing and malware feeds, security blacklists, WHOIS age and SSL posture, then scores it 0–100.",
      ],
      whatWeCheck: [
        "Blacklists — phishing, malware and spam feeds (PhishTank, URLhaus, Safe Browsing and more).",
        "Domain age & WHOIS — brand-new domains impersonating known names are high-risk.",
        "SSL & security headers — certificate validity and basic hardening.",
        "Infrastructure & history — hosting, related domains and archived snapshots.",
      ],
      scoring:
        "A live blacklist hit dominates the score. A domain registered days ago, with no valid certificate or hidden WHOIS, scores high; an established site with clean feeds and proper SSL scores low.",
      faq: [
        { q: "It has a padlock (HTTPS) — is it safe?", a: "No. A padlock only means the connection is encrypted. Scammers get free certificates too. We check reputation, age and blacklists, not just SSL." },
        { q: "How can I spot a fake shop?", a: "Very new domain, prices too good to be true, no real contact details and no reviews off-site. Our report flags these signals." },
        { q: "Do you visit the site?", a: "We query reputation and intelligence sources; we don't execute the site's code in your browser." },
      ],
    },
    uk: {
      name: "Домен / сайт",
      h1: "Цей сайт безпечний чи це фішинг / шахрайство?",
      metaTitle: "Перевірка, чи безпечний сайт — безкоштовний сканер | DARKSHARE",
      metaDescription:
        "Введи домен і перевір чорні списки, фішингові та malware-фіди, вік WHOIS, SSL і репутацію перш ніж довіряти сайту. Безкоштовно, без реєстрації, за секунди.",
      intro: [
        "Фейкові магазини, фішингові сторінки та malware-сайти копіюють справжні бренди, щоб красти гроші й паролі. Щойно зареєстрований домен, що видає себе за відомий магазин, — класична схема.",
        "DARKSHARE звіряє домен із фішинговими та malware-фідами, чорними списками безпеки, віком WHOIS і станом SSL, а потім дає оцінку 0–100.",
      ],
      whatWeCheck: [
        "Чорні списки — фішинг, malware і спам-фіди (PhishTank, URLhaus, Safe Browsing та інші).",
        "Вік домену та WHOIS — нові домени, що видають себе за відомі імена, дуже ризиковані.",
        "SSL і заголовки безпеки — дійсність сертифіката та базовий захист.",
        "Інфраструктура та історія — хостинг, пов'язані домени й архівні знімки.",
      ],
      scoring:
        "Активне потрапляння в чорний список домінує в оцінці. Домен, зареєстрований кілька днів тому, без дійсного сертифіката чи з прихованим WHOIS, отримує високий бал; давній сайт із чистими фідами та коректним SSL — низький.",
      faq: [
        { q: "Є замочок (HTTPS) — отже безпечно?", a: "Ні. Замочок означає лише шифрування з'єднання. Шахраї теж отримують безкоштовні сертифікати. Ми перевіряємо репутацію, вік і чорні списки, а не лише SSL." },
        { q: "Як розпізнати фейковий магазин?", a: "Дуже новий домен, надто низькі ціни, відсутність реальних контактів і відгуків поза сайтом. Звіт позначає ці сигнали." },
        { q: "Ви заходите на сайт?", a: "Ми звертаємось до джерел репутації та розвідки; ми не виконуємо код сайту у твоєму браузері." },
      ],
    },
  },
  {
    slug: "check-url",
    key: "url",
    checkable: true,
    categories: ["domain", "threat"],
    en: {
      name: "Link / URL",
      h1: "Is this link safe to click?",
      metaTitle: "Is this link safe? Free URL & phishing checker | DARKSHARE",
      metaDescription:
        "Paste a suspicious link to check it against phishing and malware feeds, expand shorteners and reveal the real destination before you click. Free, in seconds.",
      intro: [
        "One click on a phishing link can steal your login or drop malware. Short links and redirects hide where you're really going.",
        "DARKSHARE expands the link, reveals its true destination and checks it against phishing and malware intelligence — scored 0–100 before you ever open it.",
      ],
      whatWeCheck: [
        "Phishing & malware feeds — live threat lists for the URL and its domain.",
        "Redirect chain — where shorteners and redirects actually lead.",
        "Destination reputation — blacklists and age of the final domain.",
        "Page signals — suspicious patterns and known scam templates.",
      ],
      scoring:
        "A match on a phishing/malware feed is top risk. Hidden redirects to fresh domains, mismatched display text and flagged hosts raise the score.",
      faq: [
        { q: "Is it safe to paste the link here?", a: "Yes — we analyse it server-side against intelligence sources. You never have to open it yourself." },
        { q: "What about shortened links (bit.ly etc.)?", a: "We expand them and check the real destination, not just the short URL." },
        { q: "The link looks like my bank — can it still be fake?", a: "Absolutely. Display text and lookalike domains are the core of phishing. We check the actual destination." },
      ],
    },
    uk: {
      name: "Посилання / URL",
      h1: "Чи безпечно переходити за цим посиланням?",
      metaTitle: "Чи безпечне це посилання? Перевірка URL і фішингу | DARKSHARE",
      metaDescription:
        "Встав підозріле посилання й перевір його за фішинговими та malware-фідами, розгорни скорочення і дізнайся справжню адресу до переходу. Безкоштовно, за секунди.",
      intro: [
        "Один клік по фішинговому посиланню може вкрасти твій логін або встановити malware. Короткі посилання й редиректи ховають, куди ти насправді йдеш.",
        "DARKSHARE розгортає посилання, показує справжню адресу і звіряє її з розвідкою про фішинг і malware — оцінка 0–100 ще до того, як ти його відкриєш.",
      ],
      whatWeCheck: [
        "Фіди фішингу та malware — актуальні списки загроз для URL і його домену.",
        "Ланцюг редиректів — куди насправді ведуть скорочення й перенаправлення.",
        "Репутація призначення — чорні списки та вік кінцевого домену.",
        "Сигнали сторінки — підозрілі патерни та відомі шаблони шахрайства.",
      ],
      scoring:
        "Збіг із фішинговим/malware-фідом — найвищий ризик. Приховані редиректи на свіжі домени, невідповідність тексту й позначені хости підвищують оцінку.",
      faq: [
        { q: "Чи безпечно вставляти посилання сюди?", a: "Так — ми аналізуємо його на сервері за джерелами розвідки. Тобі не доведеться відкривати його самому." },
        { q: "А скорочені посилання (bit.ly тощо)?", a: "Ми розгортаємо їх і перевіряємо справжню адресу, а не лише короткий URL." },
        { q: "Посилання схоже на мій банк — воно може бути фейком?", a: "Безумовно. Підмінений текст і схожі домени — основа фішингу. Ми перевіряємо реальну адресу призначення." },
      ],
    },
  },
  {
    slug: "check-ip",
    key: "ip",
    checkable: true,
    categories: ["ip", "threat", "darkweb"],
    en: {
      name: "IP address",
      h1: "What's the reputation of this IP address?",
      metaTitle: "IP reputation & abuse checker — free OSINT lookup | DARKSHARE",
      metaDescription:
        "Look up any IP: abuse reports, blocklists, open ports, geolocation, ASN and proxy/VPN detection. Free IP reputation check, no signup, results in seconds.",
      intro: [
        "An IP hitting your server, login page or inbox could be a normal user — or a bot, proxy or known attacker. Reputation tells you which.",
        "DARKSHARE aggregates abuse reports, blocklists, exposure scans and network data into one 0–100 risk score.",
      ],
      whatWeCheck: [
        "Abuse reports — AbuseIPDB and attack-tracker counts for this IP.",
        "Blocklists — spam, botnet and known-attacker feeds (Spamhaus, Blocklist.de and more).",
        "Exposure — open ports and services seen by Shodan/Censys-style scanners.",
        "Network & proxy — ASN, geolocation and proxy/VPN/Tor detection.",
      ],
      scoring:
        "Heavy recent abuse reports and multiple blocklist hits dominate. Tor/open-proxy origin and dangerous exposed services add weight; a clean residential or cloud IP scores low.",
      faq: [
        { q: "What does a high IP risk score mean?", a: "The address has been reported for malicious activity or sits on blocklists. Treat its traffic with caution and consider rate-limiting or blocking." },
        { q: "Is checking an IP legal?", a: "Yes — IP reputation uses publicly published abuse and network data. It's standard security practice." },
        { q: "Can I check my own server's IP?", a: "Definitely — it's a good way to confirm you're not on a blocklist that hurts email delivery." },
      ],
    },
    uk: {
      name: "IP-адреса",
      h1: "Яка репутація в цієї IP-адреси?",
      metaTitle: "Перевірка репутації та зловживань IP — безкоштовно | DARKSHARE",
      metaDescription:
        "Перевір будь-яку IP: скарги на зловживання, блок-листи, відкриті порти, геолокацію, ASN і виявлення proxy/VPN. Безкоштовно, без реєстрації, за секунди.",
      intro: [
        "IP, що стукає у твій сервер, сторінку входу чи пошту, може бути звичайним користувачем — або ботом, проксі чи відомим зловмисником. Репутація підкаже, хто це.",
        "DARKSHARE збирає скарги на зловживання, блок-листи, скани експозиції та мережеві дані в одну оцінку ризику 0–100.",
      ],
      whatWeCheck: [
        "Скарги на зловживання — лічильники AbuseIPDB і трекерів атак для цієї IP.",
        "Блок-листи — спам, ботнети та фіди відомих зловмисників (Spamhaus, Blocklist.de та інші).",
        "Експозиція — відкриті порти й сервіси, які бачать сканери на кшталт Shodan/Censys.",
        "Мережа та проксі — ASN, геолокація і виявлення proxy/VPN/Tor.",
      ],
      scoring:
        "Численні свіжі скарги та збіги з кількома блок-листами домінують. Походження Tor/відкритий проксі та небезпечні відкриті сервіси додають ваги; чиста домашня чи хмарна IP отримує низький бал.",
      faq: [
        { q: "Що означає висока оцінка ризику IP?", a: "Адресу скаржили за зловмисну активність або вона є в блок-листах. Стався до її трафіку обережно — варто обмежити чи заблокувати." },
        { q: "Чи законно перевіряти IP?", a: "Так — репутація IP використовує загальнодоступні дані про зловживання й мережі. Це стандартна практика безпеки." },
        { q: "Чи можна перевірити IP власного сервера?", a: "Звісно — це гарний спосіб переконатися, що ти не в блок-листі, який псує доставку пошти." },
      ],
    },
  },
  {
    slug: "check-password",
    key: "password",
    checkable: true,
    categories: ["leaks"],
    en: {
      name: "Password",
      h1: "Has your password already leaked?",
      metaTitle: "Check if your password has been leaked — free & safe | DARKSHARE",
      metaDescription:
        "Find out if a password appears in known data breaches — checked privately without ever sending the full password. Free, no signup, results in seconds.",
      intro: [
        "Attackers don't guess passwords — they reuse ones already leaked in breaches. If your password is on a public list, every account using it is one automated attempt from takeover.",
        "DARKSHARE checks the password against billions of leaked credentials using a privacy-preserving method, so you learn if it's exposed without ever revealing it.",
      ],
      whatWeCheck: [
        "Breach exposure — whether this exact password appears in known credential dumps.",
        "Exposure frequency — how often it has been seen (common passwords are tried first).",
        "Strength signals — patterns that make it trivial to crack.",
        "Reuse guidance — why a leaked password must be retired everywhere.",
      ],
      scoring:
        "Any appearance in a breach is high risk regardless of complexity — known passwords are the first thing attackers try. Frequency and weakness push it higher.",
      faq: [
        { q: "Do you see my actual password?", a: "No. We use a k-anonymity range check: only a short hash prefix leaves your device, never the password itself." },
        { q: "My password leaked — what now?", a: "Stop using it everywhere immediately, set a unique strong password per account, and turn on two-factor authentication." },
        { q: "Is a complex password safe if it leaked?", a: "No. Once a password is in a public dump, complexity is irrelevant — attackers just look it up." },
      ],
    },
    uk: {
      name: "Пароль",
      h1: "Чи твій пароль уже витік?",
      metaTitle: "Перевірка, чи витік твій пароль — безпечно й безкоштовно | DARKSHARE",
      metaDescription:
        "Дізнайся, чи трапляється пароль у відомих витоках — перевірка приватна, повний пароль ніколи не надсилається. Безкоштовно, без реєстрації, за секунди.",
      intro: [
        "Зловмисники не вгадують паролі — вони повторно використовують ті, що вже витекли. Якщо твій пароль у публічному списку, кожен акаунт із ним за один автоматичний запит від злому.",
        "DARKSHARE звіряє пароль із мільярдами витоків приватним методом, тож ти дізнаєшся про загрозу, не розкриваючи сам пароль.",
      ],
      whatWeCheck: [
        "Витоки — чи трапляється саме цей пароль у відомих дампах.",
        "Частота — як часто його бачили (поширені паролі пробують першими).",
        "Сигнали стійкості — патерни, що роблять його легким для злому.",
        "Поради щодо повтору — чому витеклий пароль треба прибрати всюди.",
      ],
      scoring:
        "Будь-яка поява у витоку — високий ризик незалежно від складності: відомі паролі пробують першими. Частота й слабкість піднімають оцінку вище.",
      faq: [
        { q: "Ви бачите мій справжній пароль?", a: "Ні. Ми використовуємо перевірку діапазону за k-анонімністю: пристрій залишає лише короткий префікс хеша, а не сам пароль." },
        { q: "Пароль витік — що робити?", a: "Негайно перестань використовувати його всюди, постав унікальний міцний пароль для кожного акаунта й увімкни двофакторну автентифікацію." },
        { q: "Складний пароль безпечний, якщо витік?", a: "Ні. Щойно пароль у публічному дампі, складність не має значення — його просто шукають у списку." },
      ],
    },
  },
  {
    slug: "check-username",
    key: "username",
    checkable: true,
    categories: ["username", "social", "leaks"],
    en: {
      name: "Username",
      h1: "Where does this username exist online?",
      metaTitle: "Username search across 100+ sites — free OSINT | DARKSHARE",
      metaDescription:
        "Search a username across social networks and platforms to map someone's online footprint and spot impersonation. Free, no signup, results in seconds.",
      intro: [
        "People reuse the same handle everywhere. Searching a username maps an entire online footprint — useful for vetting a seller, spotting an impersonator or checking your own exposure.",
        "DARKSHARE checks the handle across dozens of platforms and people-search sources and summarises where it exists.",
      ],
      whatWeCheck: [
        "Platform presence — accounts found across social networks, forums and code hosts.",
        "Impersonation signals — lookalike handles and reused profile data.",
        "Leak exposure — appearances of the handle in breach data.",
        "Cross-links — connections between profiles that suggest one owner.",
      ],
      scoring:
        "Risk reflects exposure and impersonation indicators rather than wrongdoing — a widely reused handle tied to leaks scores higher for privacy exposure.",
      faq: [
        { q: "Can I find someone's real identity?", a: "We map public profiles and footprint, not private identity. It's for vetting and exposure-checking, not doxxing." },
        { q: "How do I reduce my own footprint?", a: "Use different handles for sensitive accounts and remove old profiles you no longer control. The report shows what's findable." },
        { q: "Is this legal?", a: "Yes — it searches publicly available profiles, the same data anyone could find manually." },
      ],
    },
    uk: {
      name: "Юзернейм",
      h1: "Де цей юзернейм існує в інтернеті?",
      metaTitle: "Пошук юзернейма по 100+ сайтах — безкоштовно | DARKSHARE",
      metaDescription:
        "Шукай юзернейм по соцмережах і платформах, щоб скласти цифровий слід людини й виявити підробку. Безкоштовно, без реєстрації, за секунди.",
      intro: [
        "Люди повторюють той самий нік усюди. Пошук юзернейма складає весь цифровий слід — корисно для перевірки продавця, виявлення самозванця чи власної експозиції.",
        "DARKSHARE перевіряє нік на десятках платформ і people-search джерелах і підсумовує, де він існує.",
      ],
      whatWeCheck: [
        "Присутність на платформах — акаунти в соцмережах, форумах і код-хостингах.",
        "Сигнали підробки — схожі ніки та повторно використані дані профілю.",
        "Витоки — поява ніка у даних витоків.",
        "Перехресні зв'язки — зв'язки між профілями, що вказують на одного власника.",
      ],
      scoring:
        "Ризик відображає експозицію та ознаки підробки, а не провину — широко вживаний нік, пов'язаний із витоками, отримує вищий бал за приватну експозицію.",
      faq: [
        { q: "Чи можна знайти справжню особу?", a: "Ми складаємо публічні профілі та слід, а не приватну особу. Це для перевірки й контролю експозиції, не для доксингу." },
        { q: "Як зменшити власний слід?", a: "Використовуй різні ніки для чутливих акаунтів і видаляй старі профілі, які більше не контролюєш. Звіт показує, що можна знайти." },
        { q: "Це законно?", a: "Так — пошук іде по загальнодоступних профілях, тих самих даних, які будь-хто знайшов би вручну." },
      ],
    },
  },
  {
    slug: "check-hash",
    key: "hash",
    checkable: true,
    categories: ["threat"],
    en: {
      name: "File hash",
      h1: "Is this file hash known malware?",
      metaTitle: "Check a file hash for malware — free lookup | DARKSHARE",
      metaDescription:
        "Paste an MD5, SHA-1 or SHA-256 hash to check it against malware intelligence and sandbox verdicts before you run the file. Free, no signup, in seconds.",
      intro: [
        "A file hash is a fingerprint. If a downloaded installer or attachment matches known malware, you can stop before running it.",
        "DARKSHARE checks the hash against malware databases and sandbox verdicts and returns a clear 0–100 risk score.",
      ],
      whatWeCheck: [
        "Malware databases — matches in MalwareBazaar, ThreatFox and related feeds.",
        "Sandbox verdicts — known dynamic-analysis results for the sample.",
        "Family & tags — malware family, campaign and behaviour tags when available.",
        "Prevalence — how widely the sample has been seen.",
      ],
      scoring:
        "A confirmed malware match is maximal risk. Suspicious tags or partial matches add weight; an unknown hash returns low confidence rather than a false all-clear.",
      faq: [
        { q: "Which hash types are supported?", a: "MD5, SHA-1 and SHA-256. Paste any of them." },
        { q: "Unknown hash — does that mean safe?", a: "No. It means no public source has seen it yet. New or targeted malware is often unknown — combine with other checks." },
        { q: "Do I upload the file?", a: "No, only its hash. Nothing leaves your device except the fingerprint." },
      ],
    },
    uk: {
      name: "Хеш файлу",
      h1: "Цей хеш файлу — відоме malware?",
      metaTitle: "Перевірка хешу файлу на malware — безкоштовно | DARKSHARE",
      metaDescription:
        "Встав хеш MD5, SHA-1 чи SHA-256 і звір його з розвідкою про malware та вердиктами пісочниць перед запуском файлу. Безкоштовно, без реєстрації, за секунди.",
      intro: [
        "Хеш файлу — це відбиток. Якщо завантажений інсталятор чи вкладення збігається з відомим malware, ти можеш зупинитись до запуску.",
        "DARKSHARE звіряє хеш із базами malware та вердиктами пісочниць і повертає зрозумілу оцінку 0–100.",
      ],
      whatWeCheck: [
        "Бази malware — збіги в MalwareBazaar, ThreatFox і суміжних фідах.",
        "Вердикти пісочниць — відомі результати динамічного аналізу зразка.",
        "Сімейство й теги — родина malware, кампанія та теги поведінки за наявності.",
        "Поширеність — наскільки широко бачили зразок.",
      ],
      scoring:
        "Підтверджений збіг із malware — максимальний ризик. Підозрілі теги чи часткові збіги додають ваги; невідомий хеш повертає низьку впевненість, а не хибне «все чисто».",
      faq: [
        { q: "Які типи хешів підтримуються?", a: "MD5, SHA-1 і SHA-256. Встав будь-який." },
        { q: "Невідомий хеш — це безпечно?", a: "Ні. Це означає, що публічні джерела ще його не бачили. Нове чи цільове malware часто невідоме — поєднуй з іншими перевірками." },
        { q: "Я завантажую файл?", a: "Ні, лише його хеш. Пристрій залишає тільки відбиток." },
      ],
    },
  },
  {
    slug: "check-cve",
    key: "cve",
    checkable: true,
    categories: ["threat"],
    en: {
      name: "CVE / vulnerability",
      h1: "How dangerous is this CVE?",
      metaTitle: "CVE lookup — severity, exploits & EPSS | DARKSHARE",
      metaDescription:
        "Enter a CVE ID to see its severity, known exploits, exploitation probability (EPSS) and whether it's in CISA's actively-exploited catalog. Free, in seconds.",
      intro: [
        "Not every vulnerability is urgent. The ones with public exploits and active attacks are what you patch first.",
        "DARKSHARE pulls severity, exploit availability, EPSS probability and known-exploited status into a single priority score.",
      ],
      whatWeCheck: [
        "Severity — CVSS score and affected products from the NVD.",
        "Exploit availability — public proof-of-concept and exploit-kit presence.",
        "EPSS — probability the flaw will be exploited in the wild.",
        "Active exploitation — presence in CISA's Known Exploited Vulnerabilities catalog.",
      ],
      scoring:
        "A CVE that's actively exploited or has a working public exploit ranks far above a high-CVSS bug with no exploit. We weight real-world risk, not just the base score.",
      faq: [
        { q: "What's the difference between CVSS and EPSS?", a: "CVSS rates how bad a flaw could be; EPSS estimates how likely it is to actually be exploited. Use both to prioritise patching." },
        { q: "Why does CISA KEV matter?", a: "It lists vulnerabilities confirmed exploited in real attacks — those should be patched immediately." },
        { q: "Can I look up any CVE?", a: "Yes, enter the CVE-YYYY-NNNN identifier." },
      ],
    },
    uk: {
      name: "CVE / вразливість",
      h1: "Наскільки небезпечна ця CVE?",
      metaTitle: "Пошук CVE — серйозність, експлойти та EPSS | DARKSHARE",
      metaDescription:
        "Введи ідентифікатор CVE і дізнайся серйозність, наявність експлойтів, імовірність експлуатації (EPSS) та чи є вона в каталозі CISA. Безкоштовно, за секунди.",
      intro: [
        "Не кожна вразливість термінова. Першими латають ті, що мають публічні експлойти й активні атаки.",
        "DARKSHARE збирає серйозність, наявність експлойтів, імовірність EPSS і статус активної експлуатації в єдину оцінку пріоритету.",
      ],
      whatWeCheck: [
        "Серйозність — оцінка CVSS і вразливі продукти з NVD.",
        "Наявність експлойтів — публічні PoC і присутність в exploit-kit.",
        "EPSS — імовірність експлуатації у дикій природі.",
        "Активна експлуатація — наявність у каталозі CISA Known Exploited Vulnerabilities.",
      ],
      scoring:
        "CVE, яку активно експлуатують або до якої є робочий публічний експлойт, стоїть набагато вище за баг із високим CVSS без експлойта. Ми зважуємо реальний ризик, а не лише базовий бал.",
      faq: [
        { q: "Чим CVSS відрізняється від EPSS?", a: "CVSS оцінює, наскільки поганою може бути вразливість; EPSS — наскільки ймовірно її справді експлуатуватимуть. Використовуй обидва для пріоритезації." },
        { q: "Чому важливий CISA KEV?", a: "Він перелічує вразливості, підтверджено експлуатовані в реальних атаках — їх треба латати негайно." },
        { q: "Чи можна шукати будь-яку CVE?", a: "Так, введи ідентифікатор CVE-РРРР-NNNN." },
      ],
    },
  },
  {
    slug: "check-dns",
    key: "dns",
    checkable: true,
    categories: ["domain", "ip"],
    en: {
      name: "DNS records",
      h1: "What do this domain's DNS records reveal?",
      metaTitle: "DNS lookup & email-security check — free | DARKSHARE",
      metaDescription:
        "Inspect a domain's DNS: A/AAAA, MX, NS, TXT plus SPF, DKIM and DMARC email-security records and possible misconfigurations. Free, no signup, in seconds.",
      intro: [
        "DNS is the backbone of a domain — and a common source of security gaps. Missing email-authentication records let anyone spoof a domain in phishing.",
        "DARKSHARE resolves the full record set and checks email-security posture, flagging risky misconfigurations.",
      ],
      whatWeCheck: [
        "Core records — A, AAAA, MX, NS and CNAME resolution.",
        "Email security — SPF, DKIM and DMARC presence and policy strength.",
        "TXT & verification — ownership and service-verification records.",
        "Misconfigurations — dangling records and spoofing-friendly gaps.",
      ],
      scoring:
        "Missing or weak DMARC/SPF (which enable email spoofing) raise the score. A fully configured, hardened domain scores low.",
      faq: [
        { q: "Why do SPF/DKIM/DMARC matter?", a: "Without them, attackers can send email that appears to come from the domain — the basis of business-email-compromise scams." },
        { q: "Can DNS reveal hidden services?", a: "Records and subdomains often expose mail servers, dev environments and third-party tools tied to the domain." },
        { q: "Is the lookup live?", a: "Yes, we resolve records in real time from public resolvers." },
      ],
    },
    uk: {
      name: "DNS-записи",
      h1: "Що розкривають DNS-записи цього домену?",
      metaTitle: "Перевірка DNS і безпеки пошти — безкоштовно | DARKSHARE",
      metaDescription:
        "Переглянь DNS домену: A/AAAA, MX, NS, TXT, а також SPF, DKIM і DMARC та можливі помилки конфігурації. Безкоштовно, без реєстрації, за секунди.",
      intro: [
        "DNS — це основа домену і поширене джерело прогалин безпеки. Відсутні записи автентифікації пошти дозволяють будь-кому підробити домен у фішингу.",
        "DARKSHARE отримує повний набір записів і перевіряє стан безпеки пошти, позначаючи ризиковані помилки конфігурації.",
      ],
      whatWeCheck: [
        "Основні записи — резолвінг A, AAAA, MX, NS і CNAME.",
        "Безпека пошти — наявність і сила політик SPF, DKIM і DMARC.",
        "TXT і верифікація — записи володіння та підтвердження сервісів.",
        "Помилки конфігурації — «висячі» записи та прогалини, зручні для підробки.",
      ],
      scoring:
        "Відсутні або слабкі DMARC/SPF (що дозволяють підробку пошти) підвищують оцінку. Повністю налаштований захищений домен отримує низький бал.",
      faq: [
        { q: "Чому важливі SPF/DKIM/DMARC?", a: "Без них зловмисники можуть надсилати листи, що видаються за домен — основа схем компрометації ділової пошти." },
        { q: "Чи може DNS розкрити приховані сервіси?", a: "Записи й піддомени часто розкривають поштові сервери, dev-середовища та сторонні інструменти домену." },
        { q: "Перевірка в реальному часі?", a: "Так, ми резолвимо записи наживо через публічні резолвери." },
      ],
    },
  },
  {
    slug: "check-ssl",
    key: "ssl",
    checkable: true,
    categories: ["domain"],
    en: {
      name: "SSL certificate",
      h1: "Is this site's SSL certificate valid and trustworthy?",
      metaTitle: "SSL/TLS certificate checker — free | DARKSHARE",
      metaDescription:
        "Check a domain's SSL/TLS certificate: validity, issuer, expiry, chain and certificate-transparency history. Free, no signup, results in seconds.",
      intro: [
        "An expired, mismatched or freshly issued certificate is a warning sign — especially on a site asking for payment or login.",
        "DARKSHARE inspects the certificate and its transparency-log history so you can judge trust at a glance.",
      ],
      whatWeCheck: [
        "Validity — issued/expiry dates and whether the certificate is current.",
        "Issuer & chain — certificate authority and a complete trust chain.",
        "Hostname match — does the certificate actually cover the domain.",
        "CT history — recent certificates from transparency logs (sudden new certs can signal impersonation).",
      ],
      scoring:
        "An expired, self-signed or mismatched certificate raises risk. A valid certificate from a trusted CA with consistent history scores low.",
      faq: [
        { q: "Does a valid certificate mean the site is legit?", a: "No — it only proves the connection is encrypted. Scam sites use valid free certificates too. Combine with our domain and reputation checks." },
        { q: "What is certificate transparency?", a: "Public logs of every issued certificate. A burst of new certs for a brand-like domain can reveal phishing prep." },
        { q: "Why warn on a brand-new certificate?", a: "Phishing sites are short-lived, so their certificates are often days old. It's one signal among many." },
      ],
    },
    uk: {
      name: "SSL-сертифікат",
      h1: "Чи дійсний і надійний SSL-сертифікат цього сайту?",
      metaTitle: "Перевірка SSL/TLS-сертифіката — безкоштовно | DARKSHARE",
      metaDescription:
        "Перевір SSL/TLS-сертифікат домену: дійсність, видавця, термін, ланцюг і історію Certificate Transparency. Безкоштовно, без реєстрації, за секунди.",
      intro: [
        "Прострочений, невідповідний чи щойно виданий сертифікат — тривожний знак, особливо на сайті, що просить оплату чи логін.",
        "DARKSHARE перевіряє сертифікат і його історію в логах прозорості, щоб ти оцінив довіру з першого погляду.",
      ],
      whatWeCheck: [
        "Дійсність — дати видачі/закінчення та чи сертифікат актуальний.",
        "Видавець і ланцюг — центр сертифікації та повний ланцюг довіри.",
        "Відповідність хосту — чи сертифікат справді покриває домен.",
        "Історія CT — нещодавні сертифікати з логів прозорості (раптові нові сертифікати можуть свідчити про підробку).",
      ],
      scoring:
        "Прострочений, самопідписаний чи невідповідний сертифікат підвищує ризик. Дійсний сертифікат від довіреного CA зі сталою історією отримує низький бал.",
      faq: [
        { q: "Дійсний сертифікат означає, що сайт легітимний?", a: "Ні — він лише доводить шифрування з'єднання. Шахрайські сайти теж мають дійсні безкоштовні сертифікати. Поєднуй із нашими перевірками домену й репутації." },
        { q: "Що таке certificate transparency?", a: "Публічні логи кожного виданого сертифіката. Сплеск нових сертифікатів для бренд-схожого домену може викрити підготовку фішингу." },
        { q: "Чому попереджати про щойно виданий сертифікат?", a: "Фішингові сайти живуть недовго, тож їхні сертифікати часто кількаденні. Це один сигнал із багатьох." },
      ],
    },
  },
  {
    slug: "check-telegram-bot",
    key: "bot",
    checkable: true,
    categories: ["social", "threat"],
    en: {
      name: "Telegram bot / account",
      h1: "Is this Telegram bot or account a scam?",
      metaTitle: "Check a Telegram bot or account for scams — free | DARKSHARE",
      metaDescription:
        "Verify a Telegram bot, channel or username before you trust it: scam reports, impersonation signals and footprint. Free, no signup, results in seconds.",
      intro: [
        "Telegram is full of fake 'support', 'airdrop' and 'investment' bots that impersonate real projects to drain wallets and steal logins.",
        "DARKSHARE checks the bot or account against scam reports and footprint sources so you can tell official from impostor.",
      ],
      whatWeCheck: [
        "Scam reports — community and database flags for the handle.",
        "Impersonation — lookalike usernames mimicking known brands or projects.",
        "Footprint — where the handle appears across platforms.",
        "Behaviour signals — patterns typical of drainer and airdrop scams.",
      ],
      scoring:
        "Direct scam-report hits and clear impersonation of a known brand dominate the score. An established, consistently referenced official account scores low.",
      faq: [
        { q: "How do Telegram scams usually work?", a: "A bot or account impersonates official support or an airdrop, then asks for your seed phrase, a 'verification' payment or wallet connection. Never share a seed phrase." },
        { q: "Can I verify an official project bot?", a: "Yes — cross-check the exact handle here and against the project's official site. Impostors use one-character differences." },
        { q: "Is checking anonymous?", a: "Yes, the lookup is read-only and the account isn't notified." },
      ],
    },
    uk: {
      name: "Telegram-бот / акаунт",
      h1: "Цей Telegram-бот чи акаунт — шахрайський?",
      metaTitle: "Перевірка Telegram-бота чи акаунта на шахрайство | DARKSHARE",
      metaDescription:
        "Перевір Telegram-бота, канал чи юзернейм перш ніж довіряти: скарги на шахрайство, ознаки підробки й слід. Безкоштовно, без реєстрації, за секунди.",
      intro: [
        "Telegram повний фейкових ботів «підтримки», «ейрдропів» та «інвестицій», що видають себе за справжні проєкти, аби спорожнити гаманці й вкрасти логіни.",
        "DARKSHARE звіряє бота чи акаунт зі скаргами на шахрайство та джерелами сліду, щоб ти відрізнив офіційний від самозванця.",
      ],
      whatWeCheck: [
        "Скарги на шахрайство — позначки спільноти й баз для цього хендла.",
        "Підробка — схожі юзернейми, що імітують відомі бренди чи проєкти.",
        "Слід — де хендл трапляється на різних платформах.",
        "Сигнали поведінки — патерни, типові для дрейнерів та ейрдроп-шахрайства.",
      ],
      scoring:
        "Прямі скарги на шахрайство та явна підробка відомого бренду домінують в оцінці. Давній, послідовно згадуваний офіційний акаунт отримує низький бал.",
      faq: [
        { q: "Як зазвичай працює шахрайство в Telegram?", a: "Бот чи акаунт видає себе за офіційну підтримку чи ейрдроп, а потім просить seed-фразу, «верифікаційний» платіж чи підключення гаманця. Ніколи не давай seed-фразу." },
        { q: "Чи можна перевірити офіційного бота проєкту?", a: "Так — звір точний хендл тут і з офіційним сайтом проєкту. Самозванці використовують різницю в один символ." },
        { q: "Перевірка анонімна?", a: "Так, перевірка лише для читання, акаунт не сповіщається." },
      ],
    },
  },
];

export function findTool(slug: string): ToolType | undefined {
  return TOOL_TYPES.find((t) => t.slug === slug);
}

// ── Country IP-reputation pages (factual, differentiated data) ────────
export interface Country {
  iso: string; // lowercase, used in URL
  rir: string;
  region_en: string;
  region_uk: string;
  ccTLD: string;
  calling: string;
  name_en: string;
  name_uk: string;
  networks: string[]; // well-known ISPs/ASNs (factual)
}

export const COUNTRIES: Country[] = [
  { iso: "ua", rir: "RIPE NCC", region_en: "Eastern Europe", region_uk: "Східна Європа", ccTLD: ".ua", calling: "+380", name_en: "Ukraine", name_uk: "Україна", networks: ["Kyivstar", "Vodafone Ukraine", "Ukrtelecom"] },
  { iso: "pl", rir: "RIPE NCC", region_en: "Central Europe", region_uk: "Центральна Європа", ccTLD: ".pl", calling: "+48", name_en: "Poland", name_uk: "Польща", networks: ["Orange Polska", "Play (P4)", "T-Mobile Polska"] },
  { iso: "de", rir: "RIPE NCC", region_en: "Western Europe", region_uk: "Західна Європа", ccTLD: ".de", calling: "+49", name_en: "Germany", name_uk: "Німеччина", networks: ["Deutsche Telekom", "Vodafone Germany", "1&1"] },
  { iso: "us", rir: "ARIN", region_en: "North America", region_uk: "Північна Америка", ccTLD: ".us", calling: "+1", name_en: "United States", name_uk: "США", networks: ["Comcast", "AT&T", "Verizon"] },
  { iso: "gb", rir: "RIPE NCC", region_en: "Western Europe", region_uk: "Західна Європа", ccTLD: ".uk", calling: "+44", name_en: "United Kingdom", name_uk: "Велика Британія", networks: ["BT", "Sky Broadband", "Virgin Media"] },
  { iso: "fr", rir: "RIPE NCC", region_en: "Western Europe", region_uk: "Західна Європа", ccTLD: ".fr", calling: "+33", name_en: "France", name_uk: "Франція", networks: ["Orange", "Free (Iliad)", "SFR"] },
  { iso: "nl", rir: "RIPE NCC", region_en: "Western Europe", region_uk: "Західна Європа", ccTLD: ".nl", calling: "+31", name_en: "Netherlands", name_uk: "Нідерланди", networks: ["KPN", "VodafoneZiggo", "T-Mobile NL"] },
  { iso: "ca", rir: "ARIN", region_en: "North America", region_uk: "Північна Америка", ccTLD: ".ca", calling: "+1", name_en: "Canada", name_uk: "Канада", networks: ["Bell", "Rogers", "Telus"] },
  { iso: "es", rir: "RIPE NCC", region_en: "Southern Europe", region_uk: "Південна Європа", ccTLD: ".es", calling: "+34", name_en: "Spain", name_uk: "Іспанія", networks: ["Telefónica", "Orange España", "Vodafone Spain"] },
  { iso: "it", rir: "RIPE NCC", region_en: "Southern Europe", region_uk: "Південна Європа", ccTLD: ".it", calling: "+39", name_en: "Italy", name_uk: "Італія", networks: ["TIM", "Vodafone Italy", "WindTre"] },
  { iso: "tr", rir: "RIPE NCC", region_en: "Western Asia", region_uk: "Західна Азія", ccTLD: ".tr", calling: "+90", name_en: "Turkey", name_uk: "Туреччина", networks: ["Türk Telekom", "Turkcell", "Vodafone Turkey"] },
  { iso: "ro", rir: "RIPE NCC", region_en: "Eastern Europe", region_uk: "Східна Європа", ccTLD: ".ro", calling: "+40", name_en: "Romania", name_uk: "Румунія", networks: ["RCS & RDS (Digi)", "Orange Romania", "Vodafone Romania"] },
  { iso: "cz", rir: "RIPE NCC", region_en: "Central Europe", region_uk: "Центральна Європа", ccTLD: ".cz", calling: "+420", name_en: "Czechia", name_uk: "Чехія", networks: ["O2 Czech Republic", "T-Mobile CZ", "Vodafone CZ"] },
  { iso: "se", rir: "RIPE NCC", region_en: "Northern Europe", region_uk: "Північна Європа", ccTLD: ".se", calling: "+46", name_en: "Sweden", name_uk: "Швеція", networks: ["Telia", "Tele2", "Telenor Sweden"] },
  { iso: "fi", rir: "RIPE NCC", region_en: "Northern Europe", region_uk: "Північна Європа", ccTLD: ".fi", calling: "+358", name_en: "Finland", name_uk: "Фінляндія", networks: ["Telia Finland", "Elisa", "DNA"] },
  { iso: "no", rir: "RIPE NCC", region_en: "Northern Europe", region_uk: "Північна Європа", ccTLD: ".no", calling: "+47", name_en: "Norway", name_uk: "Норвегія", networks: ["Telenor", "Telia Norway", "Ice"] },
  { iso: "ch", rir: "RIPE NCC", region_en: "Western Europe", region_uk: "Західна Європа", ccTLD: ".ch", calling: "+41", name_en: "Switzerland", name_uk: "Швейцарія", networks: ["Swisscom", "Sunrise", "Salt"] },
  { iso: "at", rir: "RIPE NCC", region_en: "Central Europe", region_uk: "Центральна Європа", ccTLD: ".at", calling: "+43", name_en: "Austria", name_uk: "Австрія", networks: ["A1 Telekom Austria", "Magenta", "Drei (Hutchison)"] },
  { iso: "lt", rir: "RIPE NCC", region_en: "Northern Europe", region_uk: "Північна Європа", ccTLD: ".lt", calling: "+370", name_en: "Lithuania", name_uk: "Литва", networks: ["Telia Lithuania", "Bitė", "Tele2 Lithuania"] },
  { iso: "ee", rir: "RIPE NCC", region_en: "Northern Europe", region_uk: "Північна Європа", ccTLD: ".ee", calling: "+372", name_en: "Estonia", name_uk: "Естонія", networks: ["Telia Estonia", "Elisa Estonia", "Tele2 Estonia"] },
  { iso: "lv", rir: "RIPE NCC", region_en: "Northern Europe", region_uk: "Північна Європа", ccTLD: ".lv", calling: "+371", name_en: "Latvia", name_uk: "Латвія", networks: ["LMT", "Tele2 Latvia", "Bite Latvija"] },
  { iso: "ge", rir: "RIPE NCC", region_en: "Western Asia", region_uk: "Західна Азія", ccTLD: ".ge", calling: "+995", name_en: "Georgia", name_uk: "Грузія", networks: ["Magticom", "Silknet", "Cellfie"] },
  { iso: "md", rir: "RIPE NCC", region_en: "Eastern Europe", region_uk: "Східна Європа", ccTLD: ".md", calling: "+373", name_en: "Moldova", name_uk: "Молдова", networks: ["Moldtelecom", "Orange Moldova", "Moldcell"] },
  { iso: "kz", rir: "RIPE NCC", region_en: "Central Asia", region_uk: "Центральна Азія", ccTLD: ".kz", calling: "+7", name_en: "Kazakhstan", name_uk: "Казахстан", networks: ["Kazakhtelecom", "Kcell", "Beeline Kazakhstan"] },
  { iso: "in", rir: "APNIC", region_en: "South Asia", region_uk: "Південна Азія", ccTLD: ".in", calling: "+91", name_en: "India", name_uk: "Індія", networks: ["Reliance Jio", "Bharti Airtel", "BSNL"] },
  { iso: "br", rir: "LACNIC", region_en: "South America", region_uk: "Південна Америка", ccTLD: ".br", calling: "+55", name_en: "Brazil", name_uk: "Бразилія", networks: ["Vivo (Telefônica)", "Claro", "TIM Brasil"] },
  { iso: "au", rir: "APNIC", region_en: "Oceania", region_uk: "Океанія", ccTLD: ".au", calling: "+61", name_en: "Australia", name_uk: "Австралія", networks: ["Telstra", "Optus", "TPG"] },
  { iso: "jp", rir: "APNIC", region_en: "East Asia", region_uk: "Східна Азія", ccTLD: ".jp", calling: "+81", name_en: "Japan", name_uk: "Японія", networks: ["NTT", "KDDI", "SoftBank"] },
  { iso: "sg", rir: "APNIC", region_en: "Southeast Asia", region_uk: "Південно-Східна Азія", ccTLD: ".sg", calling: "+65", name_en: "Singapore", name_uk: "Сінгапур", networks: ["Singtel", "StarHub", "M1"] },
  { iso: "ae", rir: "RIPE NCC", region_en: "Western Asia", region_uk: "Західна Азія", ccTLD: ".ae", calling: "+971", name_en: "United Arab Emirates", name_uk: "ОАЕ", networks: ["Etisalat (e&)", "du"] },
];

export function findCountry(iso: string): Country | undefined {
  return COUNTRIES.find((c) => c.iso === iso.toLowerCase());
}
