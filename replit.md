# DARKSHARE

## Overview

DARKSHARE is a professional OSINT platform providing comprehensive security intelligence and risk assessment across 17 data types, including blockchain wallets, IP addresses, email addresses, phone numbers, and domains. It offers AI-enhanced risk scoring, generates verifiable multi-page PDF reports, and provides real-time monitoring. The platform features a React-based landing page, a full web dashboard, and a Telegram bot, all supported by a PostgreSQL database. Its core purpose is to identify risks and provide actionable intelligence for proactive security measures.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript, Wouter for routing, and TanStack React Query for state management.
- **Styling**: Tailwind CSS, shadcn/ui, with a custom dark theme.
- **UI/UX**: Implements a 3D design system for internal app pages using GPU-accelerated effects, glassmorphism, and animations with Framer Motion. Includes a global `BottomTabBar` for mobile, app-native authentication flows, `SecurityGauge` for risk visualization, `AppHeroCard`, and `AppQuickActions`. The landing page maintains a clean, non-3D aesthetic.
- **PWA**: Features for offline support, install banners, and push notifications for scan reminders and threat alerts.

### Backend
- **Runtime**: Node.js with Express and TypeScript, utilizing Telegraf for Telegram bot interactions.
- **API Design**: RESTful endpoints with Zod validation for type safety.
- **Public API v1** (`server/apiV1.ts`): Stateless API-key auth (`dk_<userId>_<hmac32>`, verified with `timingSafeEqual`). Endpoints: `POST /api/v1/check`, `POST /api/v1/check/bulk` (Enterprise-only, max 100, concurrency 5), `GET/POST/DELETE /api/v1/watchlist` with HMAC-SHA256-signed webhooks (`X-DarkShare-Signature`) protected by SSRF guard rejecting private/loopback/link-local addresses, `GET /api/v1/feed` SSE stream (URLhaus + ThreatFox, polled every 60s, capped at 500 concurrent subscribers), `GET /api/v1/usage`. Quotas: PRO 5k req/month, ENT 50k; bursts 5/20 req/s. Watchlist poller runs every 30 min and fires webhooks on threshold-cross.
- **Check Service**: A centralized `checkService.ts` handles input validation, integration with 17 OSINT data types, risk scoring (0-100), and detailed findings.
- **PDF Generation**: Uses PDFKit for creating verifiable multi-page reports with AI analysis and certification.
- **Authentication**: Telegram Login Widget with HMAC verification, PostgreSQL-backed sessions, and 2FA (TOTP).
- **Payment System**: Supports Crypto Pay (@CryptoBot), MonoPay, and manual crypto payments, including auto-recurring payments, subscription management, and promo codes.
- **AI Integration**: Integrates with OpenAI for security summaries and recommendations, with rule-based fallbacks.
- **Notifications**: Web Push API for browser notifications and Telegram bot notifications for various events.
- **Admin Panel**: Provides a comprehensive interface for managing users, payments, tickets, coupons, revenue, reports, and broadcasting messages.

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM.
- **Key Tables**: Includes `users`, `reports`, `watches`, `payments`, `referrals`, `support_tickets`, `ds_coupons`, `ds_teams`, `ds_chat_messages`, `ds_ad_banners`, `ds_activity_log`, `push_subscriptions`, `ds_data_deletion_requests`, `ds_threat_profiles`, `ds_takedown_letters`.

### Code Organization
- `client/`: React frontend.
- `server/`: Express backend and Telegram bot logic.
- `shared/`: Shared types, Zod schemas, and route definitions.
- `migrations/`: Drizzle database migrations.

### Key Design Patterns
- **Storage Interface**: `IStorage` abstraction for database interactions.
- **Type-Safe Routes**: API routes defined with Zod schemas for validation.
- **Bot State Management**: In-memory Map for Telegram bot conversation states.

### Internationalization (i18n)
- Supports 5 languages (en, uk, ru, es, de) across both frontend and Telegram bot.

### New Features (Cyan Redesign & Conversion Engine)
- **Visual Redesign**: Migration from green to cyan theme with updated UI components for pricing and hero sections, including live tickers, scarcity badges, and animated elements.
- **Conversion Hooks**: Implementation of `StickyPromoBar`, `ExitIntentPopup`, and `ScarcityBadge` for conversion optimization.
- **Reports & Visualization**: `RiskGauge` for animated risk scores, `ActivityTimeline` for historical risk distribution, and `PdfPreview` for in-browser PDF viewing. `EntityGraph` for interactive visualization of linked reports.
- **OSINT Services**: New `Domain OSINT` service with parallel DNS lookups, RDAP WHOIS, and SSL certificate inspection, including SSRF hardening and client-side visualization.
- **Compliance**: Added AUP and Data Deletion pages, and an AI Disclaimer component.
- **Interactive Tools**: `Compromise Wizard` for remediation steps and `GDPR Takedown Generator` for legal letter generation.
- **AI Threat Profile**: PRO+ feature for generating AI-hedged threat profiles.
- **PWA (v5.1)**: Cyan-themed `manifest.json` (#22d3ee, display_override, 4 icons any/maskable, 3 shortcuts), redesigned `InstallBanner` (5-language, iOS-aware, 7-day dismiss, role=region+aria-live), and `NotificationToggle` in Profile dialog (5-language, durable unsubscribe retry queue, getSubscription pre-check, re-sync on visibility/online/SW controllerchange). Service worker cache version `v5.1-pwa`.
- **Premium Result Cards**: `PhoneOsintCard` (carrier, line type, country, validity, risk indicators with Numverify+Veriphone backend) and `CryptoOsintCard` (chain detection for Bitcoin/EVM/Solana/Tron with tolerant matching, balance, tx count, smart contract status, sanctioned-address alert with role=alert, top tokens, totals) — both 5-language with SUPPORTED-guard fallback to "en", auto-rendered in Dashboard when result.details available for selectedType phone/wallet.
- **WireGuard VPN (PRO+)**: Owned WireGuard infrastructure across 6 regions (Frankfurt, Amsterdam, Stockholm, Singapore, Tokyo, NYC). Backend in `server/vpn.ts` enforces per-tier device limits: PRO=3, ENTERPRISE=10, GROUPS=25. Server-side keypair generation, no logs, auto-grant on subscription. UI in `client/src/pages/VpnPage.tsx` with server picker, QR/.conf download, and PRO upsell modal.
- **VPN Visibility on Landing**: Flagship VPN section on Home (above-the-fold after hero) with NEW badge, PRO+ badge, headline, 3 stats (6 locations / 0 logs / 3-25 devices), 6 location cards, and dual CTA (`Get with PRO` deep-link to `/pricing?plan=PRO&code=DARKNEU&src=vpn_hero` + `Learn more` to `/vpn`). VPN bullet added to PRO/ENTERPRISE/GROUPS feature lists in Pricing with tier-correct device counts. Pricing URL handler updated so anonymous users land on the pricing page (with promo pre-filled and target plan card scrolled into view) instead of being bounced to /login.
- **Conversion Paywall**: `PremiumLock` component with blur overlay + replace-block variants and `PostResultUpsell` banner; Dashboard wires these around AI Insights and post-results CTAs for FREE/BASIC users while PRO+ keeps original behaviour.
- **Capacitor Mobile Wrap**: `capacitor.config.ts` configured for production wrapper builds; `MOBILE_BUILD.md` documents the Android/iOS pipeline (no native projects committed).

## External Dependencies

- **Telegram Bot API**: Core for Telegram bot functionality.
- **PostgreSQL**: Primary database.
- **Stripe**: For credit card payments.
- **MonoPay**: For card payments.
- **Crypto Pay (@CryptoBot)**: For automated cryptocurrency payments.
- **OpenAI API**: For AI-enhanced analysis.
- **Resend API**: For email broadcasting.
- **Web-Push**: For web push notifications.
- **SSL Labs API**: For SSL/TLS certificate analysis.
- **crt.sh**: For Certificate Transparency logs.
- **ip-api.com, ipinfo.io, Shodan InternetDB, GreyNoise, AbuseIPDB, ipwhois.app**: For IP address analysis.
- **Blockscout API, Blockchain.com API, Ethplorer, Mempool.space**: For blockchain wallet analysis.
- **Hunter.io, Disify, EmailRep.io**: For email verification.
- **RDAP/WHOIS (rdap.org), hackertarget.com, ThreatFox abuse.ch**: For domain analysis.
- **Numverify, Veriphone.io**: For phone number validation.
- **urlscan.io API, Google Safe Browsing, URLhaus abuse.ch, PhishTank**: For URL analysis.
- **NVD NIST API, CVE Details**: For CVE vulnerability data.
- **VirusTotal API, MalwareBazaar, ThreatFox abuse.ch, CIRCL hashlookup**: For file hash analysis.
- **GitHub API**: For username reconnaissance.
- **xposedornot.com**: For dark web breach monitoring.

## Telegram Premium Custom Emojis

The bot integrates Telegram Premium custom emojis for higher visual fidelity on the most-viewed screens.
- **Module**: `server/premiumEmoji.ts` — `pe(slot, mode='html')` helper renders `<tg-emoji emoji-id="…">fallback</tg-emoji>`; falls back to plain unicode when the slot has no `id` or when sent in plain mode. Persistent registry at `server/data/premium-emojis.json` (40+ named slots: shield, fire, star, warning, check, cross, rocket, diamond, crown, search, chart, money, card, link, scroll, etc.).
- **Admin commands** (gated by `isAdmin`, default `ADMIN_IDS=7820995179`): `/emojiid [on|off]` toggles capture mode and returns custom_emoji_ids for premium emojis or stickers; `/setemoji <slot> <id> [fallback]`, `/clearemoji <slot>`, `/listemojis`.
- **HTML-mode screens** that render premium emojis: `showDashboard` (the /menu hub), `enter_panel_first` welcome, `upgrade` tier picker, `successful_payment` Stars receipt, `check_all` module picker + 4 category screens (`cat_network`, `cat_finance`, `cat_osint`, `cat_security`), `/stats` command, the **check result block** for every module (line ~2190+ — both card branch and generic branch including details, hookLine upsells, risk visuals, module emojis), `/referrals` (with dynamic bot username from `bot.telegram.getMe()`), `copy_ref_link` reply, `/profile` main screen, and `share_result_*` handler. All dynamic content escaped via `escHtml()`. Remaining Markdown screens: secondary admin tools, `profile_detailed_stats`, `/help`, payment flows, history listing, support/VPN/API menus.
- **Limitation**: Telegram only renders `<tg-emoji>` tags inside HTML parse_mode messages, so converting more screens requires switching their parse_mode + escaping.
- **Bug fix (April 2026)**: hardcoded `t.me/DarkShare1Bot` in `/referrals` and `copy_ref_link` was replaced with dynamic `bot.telegram.getMe().username` so referral links work after bot username changes.
- **Telegraph API**: For generating instruction pages.
- **Plausible Analytics**: Privacy-friendly analytics on home page (script in `client/index.html`, CSP allowlists `plausible.io`).

## Landing Page Overhaul Batch (v4.7 — May 2026 Session)

### All changes in `client/src/pages/Home.tsx` + `client/src/index.css`:

**Batch 1 — 5 section redesigns:**
- **TrustStrip**: bigger numbers (text-[26px]), cyan accent top bar per cell, vertical dividers, hover bg tint.
- **CTABottom**: ⭐ 4.9/5 stars social proof row, larger headline (text-[46px] sm), stronger glow blob (800px/blur-140), secondary button.
- **Sources**: category cards now show big count number top-right, icon in boxed square top-left, label + "sources" sub-label below.
- **HowItWorks**: dashed connector line with diamond arrows between steps on desktop, icon glow ring.
- **LiveActivity**: icon in rounded-md box, thicker h-1 risk bar, colored score number, "6/24h" pill in section header.

**Batch 2 — 6 improvements:**
- **TrustedAggregators**: 3 labeled category groups (Breach intel / Threat feeds / OSINT Network) instead of flat chip list.
- **Hero trust pills**: replaced ✓ text with lucide icon + label pills (Lock, Database, Eye, Shield).
- **PricingTeaser promo**: replaced plain `<p>` with styled pill banner (Sparkles icon + code highlight + description).
- **WhatWeCheck**: added bottom "Scan now →" CTA bar linking back to top.
- **ResultCard paywall**: `animate-ping` ring on "$3 single report" button to draw attention at the money moment.
- **HeroDemoCard**: `LIVE` badge with pulsing green dot in window chrome top-right.

**Batch 3 — scroll animations + PricingTeaser features:**
- **CSS**: `.section-fade` + `.section-fade.in-view` scroll-triggered fade-up transition added to `index.css`.
- **Home**: `IntersectionObserver` in `useEffect` auto-applies `section-fade`/`in-view` to all `section` elements inside `#home-sections` wrapper.
- **PricingTeaser**: expanded from 3 to 5 features per plan; Free/Single show `✕` locked rows for monitor/API/VPN, Enterprise shows Bulk API + white-label PDF instead of VPN.

**Batch 4 — final polish:**
- **SocialProofSection stats**: replaced 3-card grid with unified horizontal bar (icon box + big number + label), responsive divide.
- **Testimonial cards**: added "Verified" green pill badge next to each author.
- **FAQ**: added "Still have questions?" CTA at bottom (Telegram link + View pricing button).
- **Hero**: scroll hint text with bouncing chevron for tablet breakpoint when no result shown.
- **LiveActivity header**: `6 / 24h` count pill next to the section label.

**Batch 5 — animations & interactivity:**
- **CountUp component**: new `CountUp({ raw, suffix })` component with `IntersectionObserver` + `requestAnimationFrame` easeOutQuart; animates from 0 → target when section scrolls into viewport.
- **TrustStrip**: items now split into `raw`+`suffix` (animated) vs `static` (plain text); "OSINT sources", "Leak databases", "Active users" all count up on scroll; "0–100", "99.9%", "—" remain static.
- **CommunityCTA code block**: fully interactive language switcher — `useState<TabKey>` drives rendering of curl/Python/Node.js/Go snippets with per-language syntax highlighting (cyan/amber/emerald/purple color tokens); active tab has cyan-tinted border; tabs are real `<button>` elements.
- **Hero background**: subtle perspective grid overlay — cyan grid lines at 48px, `rotateX(60deg)`, fade-out mask toward top; `opacity-[0.18]`, pointer-events-none.
- **WhatWeCheck cards**: arrow icon `ArrowRight` appears on hover with `translate-x-0.5` slide-in and opacity transition.
- **Testimonial cards**: large decorative `"` watermark (80px serif, 3.5% opacity) in top-right corner; `overflow-hidden`, subtle `hover:bg-[#111116]` tint.

**Batches 7–28 — Micro-improvements (ongoing May 2026 session):**
- **Batch 7**: TrustStrip `live` destructured fix (runtime bug), HeroDemoCard macOS dots (red/yellow/green).
- **Batch 8**: FAQ Telegram button styled cyan-blue, WhatWeCheck bottom CTA button cyan.
- **Batch 9**: HowItWorks connector lines turn cyan as activeStep progresses.
- **Batch 10**: SocialProof hover-pauses auto-cycle, PublicHeader Guide link gets "NEW" cyan badge.
- **Batch 11**: HeroDemoCard risk score CountUp animation (78), Sources filter pills show OSINT_SOURCES count per category.
- **Batch 12**: Sources card hover cyan glow, LiveActivity live dot drop-shadow glow.
- **Batch 13**: CommunityCTA "340+ members online" live indicator, PromoBar glow shadow.
- **Batch 14**: CTABottom stars pill amber glow, SocialProof dot nav enhanced (wider active dot + glow).
- **Batch 15**: WhatWeCheck card hover glow shadow, Hero badge cycling interval tightened to 4.5s.
- **Batch 16**: SocialProof active testimonial glow stronger, ComplianceBadges ready/progress hover glows.
- **Batch 17**: HeroDemoCard applicable count shows cyan filtered number, SP stats tabular-nums + 99.9% emerald.
- **Batch 18**: HowItWorks step active border accent, LiveActivity section set to relative.
- **Batches 19–20**: SP stat3 emerald-300 tabular-nums, HowItWorks desc + title active brighter, TrustedAggregators chip hover scale.
- **Batches 21–22**: CommunityCTA tab active shadow, Sources pills items-center, FAQ btn hover bg, Sources active pill scale+glow.
- **Batches 23–24**: PricingTeaser Check icon cyan glow, CTABottom scan btn brighter glow, ComplianceBadges glows stronger, PromoBar glow upgrade.
- **Batches 25–26**: SP testimonial active glow upgrade, WhatWeCheck card glow upgrade, LA 24h pill emerald tint, Sources card hover upgrade.
- **Batches 27–28**: TrustStrip cyan top line hover-expand + tabular-nums + icon glow, LA inactive item hover, Hero trust pills cyan hover, PricingTeaser promo btn orange glow.


## Mobile UX & Landing Overhaul (v4.6 — May 2026 Session)

### Files changed:
- **Home.tsx**: Added burger/hamburger mobile menu to TopBar (drawer with backdrop, links + Bot + Sign In). Hero badge now has pulsing live dot + cyan border. Hero title highlight uses gradient `from-cyan-300 to-cyan-400`. Added inline trust-pill row below form (TLS / N+ sources / No signup / 7-day guarantee). WhatWeCheck section redesigned: mobile shows 2-col card grid with icon + title + desc; desktop keeps inline strip.
- **VpnPage.tsx**: Added burger/hamburger mobile menu to local TopBar (same drawer pattern). Dashboard link hidden on mobile.
- **Chat.tsx**: Fixed mobile scroll chain — outer wrapper now `height: calc(100dvh - 56px)` with `min-h-0` instead of `h-full lg:min-h-screen`; inner `flex-1 p-3` wrapper and `max-w-5xl` container both get `min-h-0`; Card and motion.div get `min-h-0`. Scroll container `flex-1 overflow-y-auto` now works on all screen sizes.

## i18n Polish (v4.5 — May 2026 Session)

### Files changed in this session:
- **History.tsx**: `Export JSON` button title/aria-label now multilingual (es/de added).
- **Account.tsx**: Fixed 13 more hardcoded English strings in the White-label & Integrations section — section title/description, PDF White-label subtitle, company name placeholder, Save Branding/Webhooks/Payout buttons, Monitoring Webhooks title, Webhook alert description, Referral Crypto Payout title, wallet address placeholder, payout description. Subscription subLabels (daysLeft/expires/expired/autoRenew/on/off/renew) now include es/de. `toLocaleDateString` locale covers es/de.
- **Dashboard.tsx**: `PageLayout title=` now multilingual (es/de/uk/ru).
- **Account.tsx**: `PageLayout title=` now multilingual.
- **History.tsx**: `PageLayout title=` now multilingual.
- **Monitoring.tsx**: `PageLayout title=` now multilingual.
- **Referral.tsx**: `PageLayout title=` now multilingual.
- **Support.tsx**: `lang` destructured from `useTranslation`, `PageLayout title=` now multilingual.
- **Pricing.tsx**: `lang` destructured from outer `useTranslation`, `PageLayout title=` now multilingual.
- **JoinTeam.tsx**: All 9 strings (sign-in message, Sign In button, Joining team..., You joined!, success message, Go to Teams, Error, Failed to join, Back to Teams) now fully include es/de.
- **Chat.tsx**: Team name fallback, chatSubtitle (private/general), and community subtitle now fully include es/de.

### Coverage after this session:
- All pages have multilingual `PageLayout title=` (5 languages).
- All button labels, placeholders, descriptions in Account White-label section are multilingual.
- JoinTeam and Chat fully multilingual including es/de.
- No ternary chains missing es/de across any page or component (verified by grep sweep).

## Batch 6 — UX Polish (May 2026)

### Files changed:
- **PublicHeader.tsx**: Added `useEffect` scroll listener (`scrollY > 8`). Header is now transparent at page top (`bg-transparent border-transparent backdrop-blur-none`) and transitions to `bg-[#09090B]/95 backdrop-blur-xl` with shadow on scroll — `duration-300` CSS transition.
- **Home.tsx / Sources**: Applied `<CountUp raw={count} />` to each category source count so numbers count up on scroll-in (same CountUp component used by TrustStrip).
- **Home.tsx / LiveActivity**: Added `useState(0)` + `setInterval(3000)` to auto-cycle a "newest scan" highlight — active card gets cyan border + subtle glow shadow, cycling every 3 seconds.
- **Home.tsx / CTABottom**: Replaced `animate-pulse` gradient div with a `cta-ring-glow` CSS class using `border-rotate` keyframe — a sweeping 120° gradient highlight animating over 6s, more elegant than pulse.
- **Pricing.tsx / billing toggle**: Replaced `<Switch>` component with a custom pill button pair — active option gets `bg-white/[0.09] ring-1` treatment; yearly option shows the `-17%` badge inline; animated reveal of "= 2 months free" label when yearly is selected.
- **index.css**: Added `@keyframes border-rotate` + `.cta-ring-glow` utility class for the CTABottom animated ring.


## Home.tsx Micro-Polish Batches 29–47 (May 2026)

### Summary of all improvements applied:
- **Section badge borders**: All `border-white/10` label pills upgraded to `border-white/[0.08]` across FAQ, SocialProof, ComplianceBadges, HowItWorks, Sources, CommunityCTA — unified look.
- **Border normalization**: All `border-white/10` → `/[0.10]`, `border-white/5` → `/[0.06]`, `border-white/15` → `/[0.15]` (explicit fraction notation). Zero remaining non-explicit border fractions.
- **Glow upgrades**: CTABottom scan btn `shadow 0.60/0.72`, HowItWorks dot active `shadow-[0_0_8px]`, PricingTeaser hot card `shadow 0.28/0.40 + scale`, cold card `+scale`, SocialProof testimonial active `0.30`, LA newest `0.28`, LA inactive `+shadow`, FAQ open `border /[0.14] bg /[0.0E0E12]`, FAQ closed `+hover:bg-white/[0.01]`, Sources card `+scale`, Sources active pill `0.40`, WhatWeCheck card `+scale`, SP dot nav active `shadow 0.80`, TrustStrip top line `group-hover:w-16 via-80% + drop-shadow 0.6`, PricingTeaser badge `shadow-[0_2px_8px_rgba(34,211,238,0.35)]`, HeroDemoCard LIVE badge `shadow-[0_0_8px]`, ResultCard finding icon `drop-shadow-[0_0_4px] cyan 0.4`.
- **Text upgrades**: TrustStrip label `zinc-500`, Sources sub-label `zinc-500`, SP stat labels `zinc-500`, HeroCheck subtext `zinc-400/80`, CTABottom stars text `zinc-300/80`, TrustedAggregators label `zinc-500`, PT see-all `zinc-400/90`. Comprehensive zinc-600→zinc-500 sweep: HeroCheck sep dots, HDC sample report label, RC lock icon, Sources 'all' badge, PT excluded feat/✕ icon, FAQ clear/search icons + no-results, CC API URL + tab step num, CB item label + sources text, LA time-ago, Hero scroll chevron + text, WWC cat icon. **Zero zinc-700 remaining. 6 intentional zinc-600 remain (placeholders, HowItWorks inactive steps, CC colormap def).**
- **Button hover upgrades**: CC explore btn `+scale+shadow`, CC Telegram btn `border /[0.25]`, CC GitHub btn `border /[0.25]`, ResultCard buy-single `+scale+shadow`, CTABottom allPlans `+scale border /[0.25]`.
- **PublicHeader NEW badge**: `bg-cyan-500/[0.18] border-cyan-500/40 text-cyan-300 +shadow-[0_0_6px]`.
- **PromoBar glow**: `shadow 0.60/0.32`, dismiss btn `zinc-500/hover:zinc-200`.
- **HeroDemoCard**: LIVE dot `bg-emerald-400 +shadow`, chrome border-b `/[0.06]`, URL bar border `/[0.10]`, card border `/[0.10]`, internal borders `/[0.06]`, mail icon ring `/25`, target label `zinc-400/80`, /100 suffix `zinc-400/80`, LIVE badge `+shadow-[0_0_8px]`.
- **ComplianceBadges**: ready `0.35/0.40+`, progress `0.30/0.35+`, planned `+hover:bg-white/[0.02]`, item label `zinc-500`, sources text `zinc-500`.
- **TA chip hover**: `bg-white/[0.08] scale-[1.05] +shadow`.
- **WhatWeCheck icon**: `transition-all group-hover:ring-2` upgrade.
- **TrustStrip**: separator `/[0.06]`, top line `w-16 0.80 + drop-shadow`, stat value tabular-nums.
- **ResultCard**: hidden banner `border-rose-500/20 bg-rose-500/[0.07]`, findings label `tracking-[0.14em]`, finding icon `drop-shadow cyan 0.4`.
- **RC findings**: `text-[11px] uppercase tracking-[0.14em]` label + `CheckCircle2 drop-shadow cyan`.
- **Zero TypeScript errors** maintained across all 47+ batches.

## Trust, Community & White-Label

- **`/trust`** (`client/src/pages/Trust.tsx`): public Trust Center. Compliance roadmap (GDPR/CCPA ready, SOC 2 Type II in progress Q4 ’26, ISO 27001 planned Q1 ’27, PCI DSS via Stripe, RFC 9116 security.txt), bug bounty $25–2 000, retention table, PGP fingerprint. No auth required.
- **`/community`** (`client/src/pages/Community.tsx`): public Community page. SDK tabs (curl/Python/Node/Go), channel grid (Telegram bot+channel, Discord, GitHub, Medium, Telegraph). No auth required.
- **Home polish** (`client/src/pages/Home.tsx`): adds `ComplianceBadges` + `CommunityCTA` sections, links to `/trust` and `/community`.
- **Footer** (`client/src/components/Footer.tsx`): Community section with Trust Center, Community SDK, GitHub, Discord, security.txt links.
- **White-label PDF**: `ReportData.branding` (`server/pdfGenerator.ts`) accepts `{ companyName, brandColor, companyLogoUrl }`. Top accent bar uses `brandColor`, cover page shows "PREPARED FOR", footer rebranded — only if user tier is ENTERPRISE/GROUPS. Wired through 3 call sites: `server/routes.ts` `/api/reports/:id/pdf`, `/api/check/generate-pdf`, and `server/bot.ts` Telegram PDF flow.
- **Account UI** (`client/src/pages/Account.tsx`): new "White-label & Integrations" card with three panels (PDF white-label gated by tier; Slack & Teams webhooks; crypto payout currency+address). Posts to `PATCH /api/account/branding`.
- **Slack/Teams webhook alerts**: monitoring scheduler in `server/bot.ts` mirrors each new alert to user's Slack `https://hooks.slack.com/...` (Block Kit) and Teams `https://*.webhook.office.com/...` (MessageCard) endpoints.
- **Referral leaderboard**: `IStorage.getReferralLeaderboard(period, limit)` (`server/storage.ts`) groups confirmed referrals by referrer with month/all period; `GET /api/referrals/leaderboard?period=month` returns top 10 with privacy-safe masked names (`xx***y` or `anonymous-N`), 120s public cache. Displayed in `client/src/pages/Referral.tsx`.
- **Schema additions** (`shared/schema.ts` users): `companyName`, `companyLogoUrl`, `brandColor`, `slackWebhookUrl`, `teamsWebhookUrl`, `payoutAddress`, `payoutCurrency`. Returned via `/api/auth/me` and synced through `client/src/lib/auth.tsx` `User` type.