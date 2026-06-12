import {
  type Lang,
  type ToolType,
  type Country,
  PSEO_LANGS,
  langPrefix,
  escapeHtml,
  sourcesFor,
  SOURCE_TOTAL,
  UI,
  TOOL_TYPES,
  COUNTRIES,
} from "./data";

export const SITE_URL = (process.env.WEB_DOMAIN || "https://www.darkshare.store").replace(/\/+$/, "");

const OG_LOCALE: Record<Lang, string> = { en: "en_US", uk: "uk_UA" };

function abs(path: string): string {
  return `${SITE_URL}${path}`;
}

function ogPageUrl(title: string, subtitle?: string, badge?: string): string {
  const q = new URLSearchParams({ title });
  if (subtitle) q.set("subtitle", subtitle);
  if (badge) q.set("badge", badge);
  return `${SITE_URL}/og/page.png?${q.toString()}`;
}

function jsonLd(obj: unknown): string {
  return `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, "\\u003c")}</script>`;
}

function breadcrumbLd(items: { name: string; path: string }[]): object {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: abs(it.path),
    })),
  };
}

function faqLd(faq: { q: string; a: string }[]): object {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

const STYLE = `
*{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#08080a;--panel:#0e0e12;--line:rgba(255,255,255,.09);--txt:#e7e7ea;--mut:#a1a1aa;--dim:#71717a;--cy:#22d3ee;--cy2:#67e8f9}
html{scroll-behavior:smooth}
body{background:var(--bg);color:var(--txt);font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.65;-webkit-font-smoothing:antialiased}
a{color:inherit;text-decoration:none}
.wrap{max-width:980px;margin:0 auto;padding:0 20px}
header.nav{position:sticky;top:0;z-index:20;backdrop-filter:blur(10px);background:rgba(8,8,10,.82);border-bottom:1px solid var(--line)}
header.nav .wrap{display:flex;align-items:center;justify-content:space-between;height:60px;gap:16px}
.brand{display:flex;align-items:center;gap:10px;font-weight:700;letter-spacing:.5px}
.brand .dot{width:13px;height:13px;border-radius:4px;background:var(--cy);box-shadow:0 0 16px rgba(34,211,238,.6)}
.nav-links{display:flex;align-items:center;gap:20px;font-size:14px}
.nav-links a{color:var(--mut)}
.nav-links a:hover{color:#fff}
.cta-btn{display:inline-flex;align-items:center;gap:8px;background:var(--cy);color:#012;font-weight:700;padding:9px 16px;border-radius:10px;font-size:14px;transition:transform .15s,box-shadow .15s}
.cta-btn:hover{transform:translateY(-1px);box-shadow:0 10px 30px -10px rgba(34,211,238,.6)}
.crumbs{font-size:12.5px;color:var(--dim);padding:18px 0 0}
.crumbs a:hover{color:var(--cy)}
.crumbs span{margin:0 7px;opacity:.5}
.hero{padding:26px 0 8px}
.badge{display:inline-block;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--cy2);background:rgba(34,211,238,.08);border:1px solid rgba(34,211,238,.25);padding:6px 13px;border-radius:999px;margin-bottom:16px}
h1{font-size:clamp(28px,5vw,44px);line-height:1.12;font-weight:800;letter-spacing:-.02em;max-width:760px}
.lede{margin-top:16px;font-size:17px;color:var(--mut);max-width:720px}
.lede p+p{margin-top:12px}
section{padding:30px 0;border-top:1px solid var(--line);margin-top:30px}
h2{font-size:23px;font-weight:700;letter-spacing:-.01em;margin-bottom:14px}
h3{font-size:16px;font-weight:700;margin-bottom:6px}
.muted{color:var(--mut)}
ul.checks{list-style:none;display:grid;gap:12px}
ul.checks li{display:flex;gap:11px;align-items:flex-start;background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:14px 16px}
ul.checks li .tick{color:var(--cy);font-weight:700;margin-top:1px}
.chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:6px}
.chip{font-size:12.5px;color:var(--mut);background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:6px 11px}
.chip:hover{border-color:rgba(34,211,238,.35);color:#fff}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:14px}
.card{display:block;background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:18px;transition:border-color .15s,transform .15s}
.card:hover{border-color:rgba(34,211,238,.4);transform:translateY(-2px)}
.card h3{color:#fff}
.card p{font-size:13.5px;color:var(--dim);margin-top:6px}
.facts{width:100%;border-collapse:collapse;background:var(--panel);border:1px solid var(--line);border-radius:12px;overflow:hidden}
.facts td{padding:12px 16px;border-top:1px solid var(--line);font-size:14.5px}
.facts tr:first-child td{border-top:none}
.facts td:first-child{color:var(--dim);width:40%}
.facts td:last-child{font-weight:600}
.faq details{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:4px 16px;margin-bottom:10px}
.faq summary{cursor:pointer;font-weight:600;padding:13px 0;list-style:none}
.faq summary::-webkit-details-marker{display:none}
.faq summary::after{content:"+";float:right;color:var(--cy);font-weight:700}
.faq details[open] summary::after{content:"–"}
.faq p{padding:0 0 14px;color:var(--mut);font-size:14.5px}
.cta-box{background:linear-gradient(135deg,rgba(34,211,238,.1),rgba(99,102,241,.06));border:1px solid rgba(34,211,238,.25);border-radius:16px;padding:24px;text-align:center;margin-top:24px}
.cta-box h2{margin-bottom:6px}
.cta-box p{color:var(--mut);margin-bottom:16px}
.scorecard{display:flex;align-items:center;gap:22px;background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:24px;flex-wrap:wrap}
.score-num{font-size:64px;font-weight:800;line-height:1}
.bar{flex:1;min-width:200px}
.bar .track{height:12px;border-radius:6px;background:#18181b;overflow:hidden}
.bar .fill{height:12px;border-radius:6px}
footer.ft{border-top:1px solid var(--line);margin-top:50px;padding:34px 0;color:var(--dim);font-size:13.5px}
footer.ft .cols{display:flex;flex-wrap:wrap;gap:30px;justify-content:space-between}
footer.ft a{color:var(--mut)}
footer.ft a:hover{color:var(--cy)}
footer.ft h4{color:#fff;font-size:13px;margin-bottom:10px;text-transform:uppercase;letter-spacing:.5px}
footer.ft ul{list-style:none;display:grid;gap:7px}
.disclaimer{margin-top:24px;font-size:12px;color:var(--dim);max-width:760px}
@media(max-width:640px){.nav-links a:not(.cta-btn){display:none}}
`;

export interface ShellOpts {
  lang: Lang;
  title: string;
  description: string;
  canonicalPath: string;
  altPaths: Partial<Record<Lang, string>>; // lang -> path for hreflang
  ogImage: string;
  jsonLdBlocks: object[];
  body: string;
  noindex?: boolean;
}

export function shell(o: ShellOpts): string {
  const u = UI[o.lang];
  const p = langPrefix(o.lang);
  const alternates = PSEO_LANGS.filter((l) => o.altPaths[l])
    .map((l) => `<link rel="alternate" hreflang="${l}" href="${abs(o.altPaths[l]!)}"/>`)
    .join("\n    ");
  const xDefault = o.altPaths.en ? `<link rel="alternate" hreflang="x-default" href="${abs(o.altPaths.en)}"/>` : "";
  const robots = o.noindex ? "noindex,follow" : "index,follow";
  const ld = o.jsonLdBlocks.map(jsonLd).join("\n    ");

  return `<!doctype html>
<html lang="${o.lang}">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${escapeHtml(o.title)}</title>
<meta name="description" content="${escapeHtml(o.description)}"/>
<meta name="robots" content="${robots}"/>
<link rel="canonical" href="${abs(o.canonicalPath)}"/>
${alternates}
    ${xDefault}
<meta property="og:type" content="website"/>
<meta property="og:site_name" content="DARKSHARE"/>
<meta property="og:locale" content="${OG_LOCALE[o.lang]}"/>
<meta property="og:title" content="${escapeHtml(o.title)}"/>
<meta property="og:description" content="${escapeHtml(o.description)}"/>
<meta property="og:url" content="${abs(o.canonicalPath)}"/>
<meta property="og:image" content="${escapeHtml(o.ogImage)}"/>
<meta property="og:image:width" content="1200"/>
<meta property="og:image:height" content="630"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="${escapeHtml(o.title)}"/>
<meta name="twitter:description" content="${escapeHtml(o.description)}"/>
<meta name="twitter:image" content="${escapeHtml(o.ogImage)}"/>
<meta name="theme-color" content="#08080a"/>
<link rel="icon" href="/favicon.ico"/>
<style>${STYLE}</style>
    ${ld}
</head>
<body>
<header class="nav"><div class="wrap">
  <a class="brand" href="${p || "/"}"><span class="dot"></span>DARKSHARE</a>
  <nav class="nav-links">
    <a href="${p}/tools">${u.nav_tools}</a>
    <a href="${p}/ip-reputation">${u.nav_ip}</a>
    <a class="cta-btn" href="/">${u.nav_home}</a>
  </nav>
</div></header>
<main class="wrap">
${o.body}
</main>
<footer class="ft"><div class="wrap">
  <div class="cols">
    <div style="max-width:320px">
      <div class="brand" style="margin-bottom:10px"><span class="dot"></span>DARKSHARE</div>
      <p class="muted">${u.footerTagline}</p>
    </div>
    <div>
      <h4>${u.footerChecks}</h4>
      <ul>
        ${TOOL_TYPES.slice(0, 6).map((t) => `<li><a href="${p}/tools/${t.slug}">${escapeHtml(t[o.lang].name)}</a></li>`).join("\n        ")}
        <li><a href="${p}/tools">${u.nav_tools} →</a></li>
      </ul>
    </div>
    <div>
      <h4>${u.footerCountries}</h4>
      <ul>
        ${COUNTRIES.slice(0, 6).map((c) => `<li><a href="${p}/ip-reputation/${c.iso}">${escapeHtml(o.lang === "uk" ? c.name_uk : c.name_en)}</a></li>`).join("\n        ")}
        <li><a href="${p}/ip-reputation">${u.nav_ip} →</a></li>
      </ul>
    </div>
    <div>
      <h4>${u.footerProduct}</h4>
      <ul>
        <li><a href="/">${u.nav_home}</a></li>
        <li><a href="/pricing">Pricing</a></li>
        <li><a href="/api-docs">API</a></li>
        <li><a href="/vpn">VPN</a></li>
      </ul>
    </div>
  </div>
  <p class="disclaimer">${u.disclaimer}</p>
  <p class="disclaimer">© ${new Date().getFullYear()} DARKSHARE</p>
</div></footer>
</body>
</html>`;
}

// ── Section helpers ───────────────────────────────────────────────────
function crumbsHtml(lang: Lang, items: { name: string; path: string }[]): string {
  return `<nav class="crumbs">${items
    .map((it, i) => (i < items.length - 1 ? `<a href="${langPrefixed(lang, it.path)}">${escapeHtml(it.name)}</a><span>/</span>` : `<span style="opacity:1;color:var(--mut);margin:0">${escapeHtml(it.name)}</span>`))
    .join("")}</nav>`;
}
function langPrefixed(lang: Lang, path: string): string {
  // breadcrumb paths are already lang-correct absolute-ish; pass through
  return path;
}

function sourcesSection(lang: Lang, cats: Parameters<typeof sourcesFor>[0]): string {
  const u = UI[lang];
  const srcs = sourcesFor(cats);
  const shown = srcs.slice(0, 28);
  const more = srcs.length - shown.length;
  return `<section><h2>${u.sourcesTitle}</h2>
  <p class="muted">${lang === "uk" ? `Ми зіставляємо результат із ${srcs.length}+ профільними джерелами (з ${SOURCE_TOTAL}+ загалом).` : `We cross-reference ${srcs.length}+ specialised sources (of ${SOURCE_TOTAL}+ total).`}</p>
  <div class="chips">${shown
    .map((s) => `<a class="chip" href="${escapeHtml(s.url)}" target="_blank" rel="nofollow noopener">${escapeHtml(s.name)}</a>`)
    .join("")}${more > 0 ? `<span class="chip">+${more} ${u.sourcesMore}</span>` : ""}</div></section>`;
}

function ctaBox(lang: Lang, heading: string): string {
  const u = UI[lang];
  return `<div class="cta-box"><h2>${escapeHtml(heading)}</h2><p>${u.checkSub}</p><a class="cta-btn" href="/">${u.checkCta}</a></div>`;
}

// ── Tool page ─────────────────────────────────────────────────────────
export function renderToolPage(tool: ToolType, lang: Lang): string {
  const u = UI[lang];
  const c = tool[lang];
  const p = langPrefix(lang);
  const path = `${p}/tools/${tool.slug}`;
  const homeName = u.home;
  const ogImg = ogPageUrl(c.h1.slice(0, 70), undefined, c.name);

  const related = TOOL_TYPES.filter((t) => t.slug !== tool.slug).slice(0, 5);

  const body = `
${crumbsHtml(lang, [
    { name: homeName, path: p || "/" },
    { name: u.nav_tools, path: `${p}/tools` },
    { name: c.name, path },
  ])}
<div class="hero">
  <span class="badge">${escapeHtml(c.name)} · OSINT</span>
  <h1>${escapeHtml(c.h1)}</h1>
  <div class="lede">${c.intro.map((para) => `<p>${escapeHtml(para)}</p>`).join("")}</div>
</div>
${ctaBox(lang, c.h1)}
<section>
  <h2>${u.whatWeCheck}</h2>
  <ul class="checks">${c.whatWeCheck.map((w) => `<li><span class="tick">✓</span><span>${escapeHtml(w)}</span></li>`).join("")}</ul>
</section>
${sourcesSection(lang, tool.categories)}
<section>
  <h2>${u.howScoring}</h2>
  <p class="muted">${escapeHtml(c.scoring)}</p>
</section>
<section class="faq">
  <h2>${u.faqTitle}</h2>
  ${c.faq.map((f) => `<details><summary>${escapeHtml(f.q)}</summary><p>${escapeHtml(f.a)}</p></details>`).join("")}
</section>
<section>
  <h2>${u.relatedTitle}</h2>
  <div class="grid">${related
    .map((t) => `<a class="card" href="${p}/tools/${t.slug}"><h3>${escapeHtml(t[lang].name)}</h3><p>${escapeHtml(t[lang].h1)}</p></a>`)
    .join("")}</div>
</section>`;

  return shell({
    lang,
    title: c.metaTitle,
    description: c.metaDescription,
    canonicalPath: path,
    altPaths: { en: `/tools/${tool.slug}`, uk: `/uk/tools/${tool.slug}` },
    ogImage: ogImg,
    jsonLdBlocks: [
      breadcrumbLd([
        { name: homeName, path: p || "/" },
        { name: u.nav_tools, path: `${p}/tools` },
        { name: c.name, path },
      ]),
      faqLd(c.faq),
    ],
    body,
  });
}

// ── Tools hub ─────────────────────────────────────────────────────────
export function renderToolsHub(lang: Lang): string {
  const u = UI[lang];
  const p = langPrefix(lang);
  const path = `${p}/tools`;
  const title =
    lang === "uk"
      ? "Усі OSINT-перевірки — email, телефон, гаманець, IP, домен | DARKSHARE"
      : "All OSINT checks — email, phone, wallet, IP, domain | DARKSHARE";
  const desc =
    lang === "uk"
      ? "Безкоштовні OSINT-перевірки: email, телефон, криптогаманець, домен, посилання, IP, пароль та інше. Оцінка ризику 0–100 за секунди."
      : "Free OSINT checks: email, phone, crypto wallet, domain, link, IP, password and more. A 0–100 risk score in seconds.";
  const h1 = lang === "uk" ? "Усі перевірки безпеки" : "All security checks";

  const body = `
${crumbsHtml(lang, [
    { name: u.home, path: p || "/" },
    { name: u.nav_tools, path },
  ])}
<div class="hero">
  <span class="badge">OSINT · ${SOURCE_TOTAL}+ ${lang === "uk" ? "джерел" : "sources"}</span>
  <h1>${escapeHtml(h1)}</h1>
  <div class="lede"><p>${
    lang === "uk"
      ? "Обери, що перевірити. Кожна перевірка зіставляє дані з десятками відкритих джерел і повертає зрозумілу оцінку ризику 0–100."
      : "Pick what to check. Each tool cross-references dozens of open sources and returns a clear 0–100 risk score."
  }</p></div>
</div>
<section style="border-top:none;padding-top:18px">
  <div class="grid">${TOOL_TYPES.map(
    (t) => `<a class="card" href="${p}/tools/${t.slug}"><h3>${escapeHtml(t[lang].name)}</h3><p>${escapeHtml(t[lang].h1)}</p></a>`,
  ).join("")}</div>
</section>
<section>
  <h2>${u.nav_ip}</h2>
  <p class="muted">${lang === "uk" ? "Перевір репутацію IP за країною — реєстратор, регіон, провайдери." : "Check IP reputation by country — registry, region, major providers."}</p>
  <div class="chips" style="margin-top:12px">${COUNTRIES.slice(0, 12)
    .map((cn) => `<a class="chip" href="${p}/ip-reputation/${cn.iso}">${escapeHtml(lang === "uk" ? cn.name_uk : cn.name_en)}</a>`)
    .join("")}<a class="chip" href="${p}/ip-reputation">${u.nav_ip} →</a></div>
</section>
${ctaBox(lang, h1)}`;

  return shell({
    lang,
    title,
    description: desc,
    canonicalPath: path,
    altPaths: { en: "/tools", uk: "/uk/tools" },
    ogImage: ogPageUrl(h1, desc.slice(0, 90), "OSINT"),
    jsonLdBlocks: [
      breadcrumbLd([
        { name: u.home, path: p || "/" },
        { name: u.nav_tools, path },
      ]),
      {
        "@context": "https://schema.org",
        "@type": "ItemList",
        itemListElement: TOOL_TYPES.map((t, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: t[lang].name,
          url: abs(`${p}/tools/${t.slug}`),
        })),
      },
    ],
    body,
  });
}

// ── Country IP-reputation page ────────────────────────────────────────
export function renderCountryPage(cn: Country, lang: Lang): string {
  const u = UI[lang];
  const p = langPrefix(lang);
  const path = `${p}/ip-reputation/${cn.iso}`;
  const name = lang === "uk" ? cn.name_uk : cn.name_en;
  const region = lang === "uk" ? cn.region_uk : cn.region_en;
  const title =
    lang === "uk"
      ? `Перевірка репутації IP — ${name} | DARKSHARE`
      : `IP reputation check — ${name} | DARKSHARE`;
  const desc =
    lang === "uk"
      ? `Перевір репутацію будь-якої IP-адреси з ${name}: скарги на зловживання, блок-листи, ASN, геолокація та proxy/VPN. Безкоштовно, за секунди.`
      : `Check the reputation of any IP address from ${name}: abuse reports, blocklists, ASN, geolocation and proxy/VPN detection. Free, in seconds.`;
  const h1 = lang === "uk" ? `Репутація IP-адрес у країні ${name}` : `IP address reputation in ${name}`;

  const facts =
    lang === "uk"
      ? [
          ["Реєстратор (RIR)", cn.rir],
          ["Регіон", region],
          ["Код країни (ccTLD)", cn.ccTLD],
          ["Телефонний код", cn.calling],
          ["Великі провайдери", cn.networks.join(", ")],
        ]
      : [
          ["Regional registry (RIR)", cn.rir],
          ["Region", region],
          ["Country code (ccTLD)", cn.ccTLD],
          ["Calling code", cn.calling],
          ["Major networks", cn.networks.join(", ")],
        ];

  const intro =
    lang === "uk"
      ? `IP-адреси з країни ${name} розподіляє реєстратор ${cn.rir}. Серед найбільших мереж — ${cn.networks.join(", ")}. Перш ніж довіряти підключенню, листу чи реєстрації з такої IP, перевір її репутацію: чи немає скарг на зловживання, чи не в блок-листах і чи не належить вона проксі або VPN.`
      : `IP addresses from ${name} are allocated by the ${cn.rir} registry. Major networks include ${cn.networks.join(", ")}. Before trusting a connection, email or signup from such an IP, check its reputation: abuse reports, blocklist presence and whether it belongs to a proxy or VPN.`;

  const faq =
    lang === "uk"
      ? [
          { q: `Як перевірити IP з країни ${name}?`, a: `Встав адресу у перевірку IP — ми звіримо її зі скаргами на зловживання, блок-листами та мережевими даними і повернемо оцінку ризику 0–100.` },
          { q: "Що означає висока оцінка ризику?", a: "Адресу скаржили за зловмисну активність або вона в блок-листах. Варто обмежити чи заблокувати її трафік." },
          { q: "Чи можна визначити VPN або проксі?", a: `Так. Ми позначаємо IP з ${name}, що належать до VPN, відкритих проксі чи Tor.` },
        ]
      : [
          { q: `How do I check an IP from ${name}?`, a: `Paste the address into the IP check — we cross-reference abuse reports, blocklists and network data and return a 0–100 risk score.` },
          { q: "What does a high risk score mean?", a: "The address has been reported for malicious activity or sits on blocklists. Consider rate-limiting or blocking its traffic." },
          { q: "Can you detect VPN or proxy?", a: `Yes. We flag ${name} IPs that belong to VPNs, open proxies or Tor.` },
        ];

  const others = COUNTRIES.filter((x) => x.iso !== cn.iso).slice(0, 8);

  const body = `
${crumbsHtml(lang, [
    { name: u.home, path: p || "/" },
    { name: u.nav_ip, path: `${p}/ip-reputation` },
    { name, path },
  ])}
<div class="hero">
  <span class="badge">${cn.rir} · ${cn.ccTLD}</span>
  <h1>${escapeHtml(h1)}</h1>
  <div class="lede"><p>${escapeHtml(intro)}</p></div>
</div>
<section style="border-top:none;padding-top:14px">
  <h2>${lang === "uk" ? "Дані по країні" : "Country at a glance"}</h2>
  <table class="facts">${facts.map((r) => `<tr><td>${escapeHtml(r[0])}</td><td>${escapeHtml(r[1])}</td></tr>`).join("")}</table>
</section>
${sourcesSection(lang, ["ip", "threat", "darkweb"])}
<section class="faq">
  <h2>${u.faqTitle}</h2>
  ${faq.map((f) => `<details><summary>${escapeHtml(f.q)}</summary><p>${escapeHtml(f.a)}</p></details>`).join("")}
</section>
<section>
  <h2>${u.footerCountries}</h2>
  <div class="chips">${others
    .map((x) => `<a class="chip" href="${p}/ip-reputation/${x.iso}">${escapeHtml(lang === "uk" ? x.name_uk : x.name_en)}</a>`)
    .join("")}<a class="chip" href="${p}/tools/check-ip">${lang === "uk" ? "Перевірка IP →" : "IP check →"}</a></div>
</section>
${ctaBox(lang, lang === "uk" ? `Перевір IP з країни ${name}` : `Check an IP from ${name}`)}`;

  return shell({
    lang,
    title,
    description: desc,
    canonicalPath: path,
    altPaths: { en: `/ip-reputation/${cn.iso}`, uk: `/uk/ip-reputation/${cn.iso}` },
    ogImage: ogPageUrl(h1, desc.slice(0, 90), `${cn.rir}`),
    jsonLdBlocks: [
      breadcrumbLd([
        { name: u.home, path: p || "/" },
        { name: u.nav_ip, path: `${p}/ip-reputation` },
        { name, path },
      ]),
      faqLd(faq),
    ],
    body,
  });
}

// ── Country hub ───────────────────────────────────────────────────────
export function renderCountryHub(lang: Lang): string {
  const u = UI[lang];
  const p = langPrefix(lang);
  const path = `${p}/ip-reputation`;
  const title =
    lang === "uk"
      ? "Репутація IP за країнами — перевірка зловживань та блок-листів | DARKSHARE"
      : "IP reputation by country — abuse & blocklist checks | DARKSHARE";
  const desc =
    lang === "uk"
      ? "Перевір репутацію IP-адрес за країнами: реєстратор, регіон, провайдери, скарги на зловживання та блок-листи. Безкоштовно, за секунди."
      : "Check IP address reputation by country: registry, region, providers, abuse reports and blocklists. Free, in seconds.";
  const h1 = lang === "uk" ? "Репутація IP за країнами" : "IP reputation by country";

  const body = `
${crumbsHtml(lang, [
    { name: u.home, path: p || "/" },
    { name: u.nav_ip, path },
  ])}
<div class="hero">
  <span class="badge">${COUNTRIES.length}+ ${lang === "uk" ? "країн" : "countries"}</span>
  <h1>${escapeHtml(h1)}</h1>
  <div class="lede"><p>${escapeHtml(desc)}</p></div>
</div>
<section style="border-top:none;padding-top:14px">
  <div class="grid">${COUNTRIES.map(
    (cn) =>
      `<a class="card" href="${p}/ip-reputation/${cn.iso}"><h3>${escapeHtml(lang === "uk" ? cn.name_uk : cn.name_en)}</h3><p>${cn.rir} · ${cn.ccTLD} · ${cn.calling}</p></a>`,
  ).join("")}</div>
</section>
${ctaBox(lang, h1)}`;

  return shell({
    lang,
    title,
    description: desc,
    canonicalPath: path,
    altPaths: { en: "/ip-reputation", uk: "/uk/ip-reputation" },
    ogImage: ogPageUrl(h1, desc.slice(0, 90), "IP REPUTATION"),
    jsonLdBlocks: [
      breadcrumbLd([
        { name: u.home, path: p || "/" },
        { name: u.nav_ip, path },
      ]),
    ],
    body,
  });
}

// ── Share / scan-result page ──────────────────────────────────────────
type RiskLevel = "low" | "medium" | "high" | "critical";
const RISK_HEX: Record<RiskLevel, string> = { low: "#34d399", medium: "#fbbf24", high: "#fb923c", critical: "#f43f5e" };
const RISK_TXT: Record<RiskLevel, Record<Lang, string>> = {
  low: { en: "Low risk", uk: "Низький ризик" },
  medium: { en: "Medium risk", uk: "Середній ризик" },
  high: { en: "High risk", uk: "Високий ризик" },
  critical: { en: "Critical risk", uk: "Критичний ризик" },
};

function ogScanUrl(o: { type: string; target: string; score: number; level: RiskLevel; lang: Lang }): string {
  const q = new URLSearchParams({
    type: o.type,
    target: o.target,
    score: String(o.score),
    level: o.level,
    lang: o.lang,
  });
  return `${SITE_URL}/og/scan.png?${q.toString()}`;
}

export function renderSharePage(o: { type: string; typeLabel: string; target: string; score: number; level: RiskLevel; lang: Lang }): string {
  const u = UI[o.lang];
  const hex = RISK_HEX[o.level];
  const levelLabel = (RISK_TXT[o.level] && RISK_TXT[o.level][o.lang]) || o.level;
  const title =
    o.lang === "uk"
      ? `Ризик ${o.score}/100 — ${o.typeLabel} перевірено на DARKSHARE`
      : `Risk ${o.score}/100 — ${o.typeLabel} checked on DARKSHARE`;
  const desc =
    o.lang === "uk"
      ? `${o.typeLabel} ${o.target} отримав оцінку ризику ${o.score}/100 (${levelLabel}). Перевір власні дані безкоштовно за секунди.`
      : `${o.typeLabel} ${o.target} scored ${o.score}/100 (${levelLabel}). Check your own data free in seconds.`;

  const body = `
<div class="hero" style="padding-top:48px">
  <span class="badge">DARKSHARE · ${escapeHtml(o.typeLabel)}</span>
  <h1>${escapeHtml(o.lang === "uk" ? `Оцінка ризику: ${o.score}/100` : `Risk score: ${o.score}/100`)}</h1>
</div>
<section style="border-top:none;padding-top:14px">
  <div class="scorecard">
    <div class="score-num" style="color:${hex}">${o.score}<span style="font-size:24px;color:var(--dim)">/100</span></div>
    <div class="bar">
      <div style="color:${hex};font-weight:700;margin-bottom:8px">${escapeHtml(levelLabel)}</div>
      <div class="track"><div class="fill" style="width:${o.score}%;background:${hex}"></div></div>
      <div class="muted" style="margin-top:10px;font-size:14px">${escapeHtml(o.typeLabel)}: <b>${escapeHtml(o.target)}</b></div>
    </div>
  </div>
</section>
${ctaBox(o.lang, o.lang === "uk" ? "Перевір власні дані" : "Check your own data")}
<section>
  <h2>${u.nav_tools}</h2>
  <div class="chips">${TOOL_TYPES.slice(0, 8)
    .map((t) => `<a class="chip" href="${langPrefix(o.lang)}/tools/${t.slug}">${escapeHtml(t[o.lang].name)}</a>`)
    .join("")}</div>
</section>`;

  return shell({
    lang: o.lang,
    title,
    description: desc,
    canonicalPath: "/",
    altPaths: {},
    ogImage: ogScanUrl({ type: o.typeLabel, target: o.target, score: o.score, level: o.level, lang: o.lang }),
    jsonLdBlocks: [],
    body,
    noindex: true,
  });
}

// ── 404 ───────────────────────────────────────────────────────────────
export function render404(lang: Lang): string {
  const u = UI[lang];
  const body = `<div class="hero" style="padding-top:60px"><span class="badge">404</span><h1>${
    lang === "uk" ? "Сторінку не знайдено" : "Page not found"
  }</h1><div class="lede"><p>${
    lang === "uk" ? "Можливо, вона переїхала. Спробуй усі перевірки нижче." : "It may have moved. Try all checks below."
  }</p></div><p style="margin-top:18px"><a class="cta-btn" href="${langPrefix(lang)}/tools">${u.nav_tools}</a></p></div>`;
  return shell({
    lang,
    title: lang === "uk" ? "404 — DARKSHARE" : "404 — DARKSHARE",
    description: "Not found",
    canonicalPath: langPrefix(lang) + "/tools",
    altPaths: {},
    ogImage: ogPageUrl("DARKSHARE"),
    jsonLdBlocks: [],
    body,
    noindex: true,
  });
}
