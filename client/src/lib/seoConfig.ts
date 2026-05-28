export interface PageSeo {
  title: string;
  description: string;
  keywords?: string;
  type?: "website" | "article" | "product";
  noindex?: boolean;
  jsonLd?: Record<string, any> | Record<string, any>[];
}

const ORIGIN = "https://www.darkshare.store";

const productSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "DARKSHARE OSINT Subscription",
  description: "AI-powered OSINT and threat intelligence platform with 17 modules, real-time monitoring, and branded PDF reports.",
  brand: { "@type": "Brand", name: "DARKSHARE" },
  image: `${ORIGIN}/og-image.png`,
  offers: [
    { "@type": "Offer", name: "FREE", price: "0", priceCurrency: "USD", url: `${ORIGIN}/pricing`, availability: "https://schema.org/InStock" },
    { "@type": "Offer", name: "PRO", price: "9", priceCurrency: "USD", url: `${ORIGIN}/pricing`, availability: "https://schema.org/InStock" },
    { "@type": "Offer", name: "ENTERPRISE", price: "30", priceCurrency: "USD", url: `${ORIGIN}/pricing`, availability: "https://schema.org/InStock" },
    { "@type": "Offer", name: "GROUPS", price: "45", priceCurrency: "USD", url: `${ORIGIN}/pricing`, availability: "https://schema.org/InStock" },
  ],
  aggregateRating: { "@type": "AggregateRating", ratingValue: "4.8", ratingCount: "126", bestRating: "5", worstRating: "1" },
};

const howToSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to run an OSINT scan with DARKSHARE",
  description: "Step-by-step guide to scan IP addresses, crypto wallets, emails, domains and more using DARKSHARE OSINT platform.",
  image: `${ORIGIN}/og-image.png`,
  step: [
    { "@type": "HowToStep", name: "Sign in", text: "Sign in using Telegram or Google in one click." },
    { "@type": "HowToStep", name: "Pick a module", text: "Choose IP, wallet, email, domain, URL, CVE, EXIF or any of 17 modules." },
    { "@type": "HowToStep", name: "Enter the target", text: "Paste the value you want to scan." },
    { "@type": "HowToStep", name: "Read the AI report", text: "Get a risk score from 0-100 with AI analysis and actionable recommendations." },
    { "@type": "HowToStep", name: "Export PDF", text: "Download a branded multi-page PDF report with QR verification." },
  ],
};

const vpnSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "DarkShare VPN",
  description: "Modern privacy VPN built on Trojan Reality protocol. Bypasses DPI and censorship, zero logs, 20+ global server locations. Works on iOS, Android, Windows, macOS and Linux via Happ, Shadowrocket, Hiddify, v2rayNG, sing-box, Clash Verge, NekoBox, Streisand and FoXray.",
  brand: { "@type": "Brand", name: "DarkShare" },
  image: `${ORIGIN}/og-image.png`,
  category: "VPN service",
  offers: [
    { "@type": "Offer", name: "PRO — 2 devices · 20+ countries", price: "9", priceCurrency: "USD", url: `${ORIGIN}/pricing?plan=PRO`, availability: "https://schema.org/InStock" },
    { "@type": "Offer", name: "ENTERPRISE — 5 devices · 20+ countries", price: "29", priceCurrency: "USD", url: `${ORIGIN}/pricing?plan=ENTERPRISE`, availability: "https://schema.org/InStock" },
    { "@type": "Offer", name: "GROUPS — 5 devices/member · 20+ countries · team management", price: "55", priceCurrency: "USD", url: `${ORIGIN}/pricing?plan=GROUPS`, availability: "https://schema.org/InStock" },
  ],
};

const apiSchema = {
  "@context": "https://schema.org",
  "@type": "TechArticle",
  headline: "DARKSHARE Public REST API v1",
  description: "Full REST API for OSINT scanning, bulk checks, webhooks with HMAC-SHA256, and report retrieval.",
  author: { "@type": "Organization", name: "DARKSHARE" },
  publisher: { "@type": "Organization", name: "DARKSHARE", logo: { "@type": "ImageObject", url: `${ORIGIN}/logo-512.png` } },
  image: `${ORIGIN}/og-image.png`,
};

export const SEO_CONFIG: Record<string, PageSeo> = {
  "/": {
    title: "AI-powered Security OSINT & Threat Intelligence Platform",
    description: "Scan IPs, crypto wallets, emails, domains, URLs, CVEs, EXIF and GEOINT in seconds. AI-driven risk scoring, real-time monitoring, branded PDF reports, full REST API. Free tier available.",
    keywords: "OSINT platform, threat intelligence, IP lookup, crypto wallet analysis, email OSINT, domain check, CVE scanner, EXIF analysis, AI risk scoring",
  },
  "/login": {
    title: "Sign in with Telegram or Google",
    description: "One-tap login via Telegram widget or Google OAuth. No passwords stored. Start scanning OSINT data in seconds.",
    keywords: "DARKSHARE login, Telegram login, Google OAuth, OSINT sign in",
    noindex: true,
  },
  "/dashboard": {
    title: "OSINT Dashboard",
    description: "Run OSINT scans across 17 modules, view AI risk scores, monitor targets in real time and download branded PDF reports.",
    noindex: true,
  },
  "/vpn": {
    title: "DarkShare VPN — Trojan Reality, 20+ countries, zero logs",
    description: "Modern VPN built into your DarkShare plan. Trojan Reality protocol bypasses DPI and censorship. Zero logs, 20+ global server locations, works on iOS, Android, Windows, macOS, Linux. PRO from $9/mo.",
    keywords: "DarkShare VPN, Trojan Reality VPN, zero logs VPN, DPI bypass VPN, censorship bypass, V2Ray subscription, sing-box, Happ, Shadowrocket, Hiddify, Clash Verge",
    type: "product",
    jsonLd: vpnSchema,
  },
  "/history": {
    title: "Scan History",
    description: "Your full OSINT scan history with search, filters, export to JSON/CSV, and on-demand PDF re-generation.",
    noindex: true,
  },
  "/monitoring": {
    title: "Real-time Monitoring & Watchlist Alerts",
    description: "Add IPs, wallets, domains and emails to watchlist. Get Web Push and Telegram alerts when threat level changes.",
    noindex: true,
  },
  "/referral": {
    title: "Referral Program — Earn 30%",
    description: "Invite users to DARKSHARE and earn 30% commission on every paid subscription. Real-time stats, instant payouts.",
    keywords: "DARKSHARE referral, OSINT affiliate, security affiliate program",
    noindex: true,
  },
  "/account": {
    title: "Account Settings",
    description: "Manage your DARKSHARE subscription, payment methods, API keys, white-label branding and notification preferences.",
    noindex: true,
  },
  "/admin": {
    title: "Admin Panel",
    description: "DARKSHARE administration panel.",
    noindex: true,
  },
  "/pricing": {
    title: "Pricing — Free, PRO $9, Enterprise $30, Groups $45",
    description: "Transparent pricing for OSINT scanning. FREE forever tier, PRO at $9/mo, Enterprise at $30/mo with white-label, Groups at $45/mo with multi-seat. Cancel anytime.",
    keywords: "OSINT pricing, threat intelligence pricing, DARKSHARE plans, security platform pricing",
    type: "product",
    jsonLd: productSchema,
  },
  "/support": {
    title: "Support & Contact",
    description: "Get help with DARKSHARE OSINT platform. Live chat, ticket system, Telegram support, 24/7 response on Enterprise.",
    keywords: "DARKSHARE support, OSINT help, threat intelligence contact",
  },
  "/api-docs": {
    title: "Public REST API v1 — Documentation",
    description: "Full REST API for OSINT scanning: single and bulk checks, webhooks with HMAC-SHA256, rate limits, error codes, code examples in cURL, Python, Node.js.",
    keywords: "OSINT API, threat intelligence API, REST API security, IP lookup API, crypto wallet API",
    type: "article",
    jsonLd: apiSchema,
  },
  "/teams": {
    title: "Teams — Multi-seat OSINT for Organizations",
    description: "Invite team members, share scan history, set role-based access, get group discounts and shared API quotas with DARKSHARE Groups plan.",
    keywords: "OSINT team, threat intelligence team, multi-seat OSINT, security team platform",
    noindex: true,
  },
  "/widget": {
    title: "Embeddable OSINT Widget",
    description: "Embed DARKSHARE OSINT scanner on your website with a single iframe. Customize colors, modules and branding.",
    keywords: "OSINT widget, embeddable security scanner, threat intelligence iframe",
  },
  "/terms": {
    title: "Terms of Service",
    description: "DARKSHARE Terms of Service. Acceptable use, subscription terms, refund policy and dispute resolution.",
    keywords: "DARKSHARE terms, OSINT terms of service",
  },
  "/privacy": {
    title: "Privacy Policy — GDPR Compliant",
    description: "GDPR Art. 13/14 compliant privacy policy. We process search inputs in-memory, store only what you save, and honor data deletion requests within 24 hours.",
    keywords: "DARKSHARE privacy, GDPR OSINT, OSINT privacy policy",
  },
  "/chat": {
    title: "Live Support Chat",
    description: "Real-time chat with DARKSHARE support team. Get OSINT scan help and platform guidance.",
    noindex: true,
  },
  "/guide": {
    title: "Complete OSINT Guide — How to Use DARKSHARE",
    description: "Step-by-step guide to running OSINT scans, understanding AI risk scores, setting up monitoring and exporting branded PDF reports.",
    keywords: "OSINT guide, how to OSINT, threat intelligence tutorial, DARKSHARE guide",
    type: "article",
    jsonLd: howToSchema,
  },
  "/download": {
    title: "Download Apps — PWA, Android, iOS, Telegram",
    description: "Install DARKSHARE as a Progressive Web App, Android APK or use the Telegram bot @DarkShare1Bot. Full OSINT power on any device.",
    keywords: "DARKSHARE app, OSINT mobile app, OSINT Android, OSINT iOS, Telegram OSINT bot",
  },
  "/exif": {
    title: "EXIF Metadata Extractor — Free OSINT Tool",
    description: "Extract GPS coordinates, camera model, capture time and full EXIF metadata from any image. Free, browser-based, no upload required.",
    keywords: "EXIF extractor, image metadata, GPS from photo, OSINT image analysis, EXIF tool",
    type: "product",
  },
  "/geoint": {
    title: "GEOINT Location Hints — Image Geolocation OSINT",
    description: "AI-powered geolocation hints from images: identify landmarks, vegetation, signage language, sun angle and time-of-day clues to narrow down a photo's location.",
    keywords: "GEOINT, image geolocation, location OSINT, AI geolocation, photo location finder",
  },
  "/aup": {
    title: "Acceptable Use Policy",
    description: "DARKSHARE Acceptable Use Policy. Prohibited activities, abuse reporting and enforcement procedures.",
    keywords: "DARKSHARE AUP, OSINT acceptable use",
  },
  "/data-deletion": {
    title: "GDPR Data Deletion Request",
    description: "Submit a GDPR Art. 17 / UK DPA 2018 / Ukrainian Personal Data Law data-deletion request. We erase data immediately and purge backups within 90 days.",
    keywords: "GDPR data deletion, right to be forgotten, OSINT data removal",
  },
  "/wizard": {
    title: "Account Compromise Wizard — Step-by-step Recovery",
    description: "Free interactive wizard that guides you through securing a compromised account: password reset, 2FA setup, session revocation, and leak monitoring.",
    keywords: "account compromise, account recovery, hacked account, security wizard, 2FA setup",
  },
  "/takedown": {
    title: "Takedown Letter Generator — Free DMCA & Abuse Templates",
    description: "Generate professional DMCA takedown letters, GDPR erasure requests and abuse reports. Pre-filled templates for hosting providers, registrars and search engines.",
    keywords: "DMCA takedown, abuse letter, takedown template, GDPR erasure letter, content removal",
  },
  "/threat-profile": {
    title: "AI Threat Profile Builder",
    description: "Build a comprehensive AI-generated threat profile from any indicator: IP, wallet, email or domain. Cross-source correlation, risk timeline and exportable PDF.",
    keywords: "threat profile, AI threat intelligence, IOC profile, threat actor profile",
    noindex: true,
  },
  "/trust": {
    title: "Trust & Security",
    description: "Our security practices: encrypted at rest and in transit, in-memory search processing, SOC2-aligned controls, GDPR/UK DPA/UA Law compliance.",
    keywords: "DARKSHARE security, OSINT trust, SOC2 OSINT, GDPR security",
  },
  "/community": {
    title: "Community — Telegram, Discord, GitHub",
    description: "Join the DARKSHARE OSINT community: Telegram channel, Discord server, GitHub discussions. Share findings, request features, get early access.",
    keywords: "OSINT community, DARKSHARE Telegram, DARKSHARE Discord, security community",
  },
};

export const SEO_DEFAULT: PageSeo = {
  title: "AI-powered Security OSINT & Threat Intelligence Platform",
  description: "Professional OSINT platform: scan IPs, wallets, emails, domains, CVEs and more with AI-driven risk scoring and real-time monitoring.",
  keywords: "OSINT, threat intelligence, security scanner",
};

export function resolveSeo(pathname: string): PageSeo {
  if (pathname in SEO_CONFIG) return SEO_CONFIG[pathname];
  if (pathname.startsWith("/r/")) return { title: "Referral Invite", description: "You were invited to DARKSHARE — AI-powered OSINT platform.", noindex: true };
  if (pathname.startsWith("/teams/join/")) return { title: "Join Team", description: "Accept your DARKSHARE team invitation.", noindex: true };
  if (pathname.startsWith("/verify/")) return { title: "Report Verification", description: "Verify the authenticity of a DARKSHARE OSINT report.", noindex: true };
  return SEO_DEFAULT;
}

export const ALL_SEO_PATHS = Object.keys(SEO_CONFIG).filter((p) => !SEO_CONFIG[p].noindex);
