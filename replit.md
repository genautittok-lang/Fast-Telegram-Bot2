# DARKSHARE

## Overview

DARKSHARE is a professional OSINT platform designed for comprehensive security intelligence and risk assessment across 17 data types, including blockchain wallets, IP addresses, email addresses, phone numbers, domains, URLs, CVEs, file hashes, usernames, bank card BINs, passwords, DNS records, SSL/TLS certificates, and MAC addresses. It identifies risks, provides AI-enhanced risk scoring, generates verifiable multi-page PDF reports, and offers real-time monitoring. The platform includes a React-based landing page, a full web dashboard, and a Telegram bot, all powered by a PostgreSQL database.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **State Management**: TanStack React Query
- **Styling**: Tailwind CSS, shadcn/ui, custom dark theme
- **Animations**: Framer Motion
- **Design System**: Implements a 3D design system with GPU-accelerated effects for internal app pages (Dashboard, Download, Account), featuring elements like `.card-3d-hover`, `.holographic`, `.btn-3d-press`, and glassmorphism.
- **UI/UX**: Features a global `BottomTabBar` for mobile navigation, app-native authentication flow with splash screen, `SecurityGauge` for risk visualization, `AppHeroCard`, and `AppQuickActions`. The landing page maintains a clean, non-3D aesthetic.
- **PWA**: Progressive Web App capabilities including service worker for offline support, install banners, and push notifications for scan reminders and threat alerts.

### Backend
- **Runtime**: Node.js with Express and TypeScript
- **Bot Framework**: Telegraf for Telegram bot interactions.
- **API Design**: RESTful endpoints with Zod validation for type safety.
- **Check Service**: Centralized `server/checkService.ts` handles input validation, integrations with 17 different OSINT data types, risk scoring (0-100), and detailed findings.
- **PDF Generation**: Utilizes PDFKit to create verifiable multi-page PDF reports with cover, findings, AI analysis, and certification pages.
- **Authentication**: Telegram Login Widget with HMAC verification, PostgreSQL-backed sessions, and 2FA (TOTP) support.
- **Payment System**: Supports Crypto Pay (@CryptoBot) with automated webhooks, MonoPay (Google Pay/Apple Pay) for card payments, and manual crypto payments. Features auto-recurring payments, subscription management, and promo code system.
- **AI Integration**: Integrates with OpenAI for AI-generated security summaries and recommendations, with fallbacks to rule-based analysis.
- **Notifications**: Web Push API for browser notifications, and Telegram bot notifications for various events like payment receipts, expiry reminders, and daily digests.
- **Admin Panel**: Comprehensive admin interface for managing users, payments, tickets, coupons, revenue, reports, and broadcasting messages/push notifications.

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM.
- **Key Tables**: `users`, `reports`, `watches`, `payments`, `referrals`, `support_tickets`, `ds_coupons`, `ds_teams`, `ds_chat_messages`, `ds_ad_banners`, `ds_activity_log`, `push_subscriptions`.

### Code Organization
- `client/`: React frontend.
- `server/`: Express backend and Telegram bot logic.
- `shared/`: Shared types, Zod schemas, and route definitions for unified validation.
- `migrations/`: Drizzle database migrations.

### Key Design Patterns
- **Storage Interface**: `IStorage` abstraction for database interactions.
- **Type-Safe Routes**: API routes defined with Zod schemas for request/response validation.
- **Bot State Management**: In-memory Map for managing Telegram bot conversation states.

### Internationalization (i18n)
- Supports 5 languages (en, uk, ru, es, de) across both frontend and Telegram bot, using centralized translation files and helpers.

## v4.5 Premium Mega-Level Upgrade (April 2026)

### Conversion & Visual Upgrades
- **Pricing page** — Live social proof ticker (viewer count + recent buyers), urgency countdown timer, scarcity badge ("Only 12 spots left" on PRO), trust section (secure payment / instant activation / 24/7 support), star ratings row.
- **Home page** — Animated live dot badge, v4.5 version badge, "17 check types" CTA checklist item, avatar stack + "2,800+ active users" social proof row, stats section with colored icon boxes + hover scale effects.
- **Premium CSS** (`index.css`) — 300+ lines: aurora-bg, shimmer-border-effect, levitate-card, neon-border-green, hero-gradient-text, typewriter-cursor, pricing-card-hover, live-indicator, cta-ring, animated-gradient-border, spotlight-sweep, burst-in, savings-pulse, plan-card-3d, particle-float, urgency-shake, float-badge, glow-card, social-slide-in, ticker-in/out animations.
- **Plan card effects** — All plan cards use `.pricing-card-hover` (translateY + scale on hover) + `.shimmer-border-effect` (animated shimmer border on hover). PRO card additionally uses `.spotlight-sweep` for a sweep light effect.

## v4.5 Compliance & Wow Features (April 2026)

### Phase 1 — Legal Compliance
- **AUP page** (`/aup`): Acceptable Use Policy with allowed/forbidden use cases (UA copy).
- **Data Deletion page** (`/data-deletion`): GDPR Art. 17 + UK DPA 2018 + UA law request form. Public, rate-limited (3/hr per IP). Submits to `POST /api/data-deletion`. Sends Telegram notification to ADMIN_IDS. Stored in `ds_data_deletion_requests` table.
- **AI Disclaimer component** (`AIDisclaimer.tsx`): Reusable warning that AI output is informational/probabilistic, not legal/forensic conclusion.

### Phase 2 — Wow Features
- **Compromise Wizard** (`/wizard`): Free 3-step interactive checklist that asks about leak type / 2FA / financial access / sim swap, then returns priority-ordered remediation steps with risk score. UA/RU/EN. Stateless. `POST /api/wizard/compromise` (rate 30/hr per IP).
- **GDPR Takedown Generator** (`/takedown`): Free letter generator for 5 jurisdictions (EU/UK/UA/US/RU/OTHER) and 3 languages (uk/ru/en). Recipient types: website_admin, hosting_provider, search_engine, social_platform, data_broker. `POST /api/takedown-letter` (rate 10/hr per IP). Optionally saved to `ds_takedown_letters` if user authed.
- **AI Threat Profile** (`/threat-profile`, PRO+ only): Uses gpt-5-nano via AI_INTEGRATIONS_OPENAI_API_KEY/_BASE_URL with structured JSON output. Generates hedged threat profile (UA) with risk score, indicators, recommendations. Auth-required → if FREE tier, returns 403 with upgrade card. Stored in `ds_threat_profiles`. Rate 10/hr per user.

### New DB Tables (`ds_` prefix, serial PKs)
- `ds_data_deletion_requests` — GDPR queue with status (pending/in_review/resolved/rejected), admin notes, resolved timestamp.
- `ds_threat_profiles` — JSONB profile data, confidence score.
- `ds_takedown_letters` — Generated letter text + recipient/jurisdiction metadata.

### New Admin Endpoints (admin via tgId in ADMIN_IDS)
- `GET /api/admin/data-deletion?status=` — List GDPR requests.
- `PATCH /api/admin/data-deletion/:id` — Update status / add admin notes.

### Service files
- `server/threatProfilerService.ts` — gpt-5-nano structured output, lazy-init OpenAI client.
- `server/takedownService.ts` — Multi-jurisdiction template renderer.
- `server/wizardService.ts` — Risk scoring + checklist generator.

## External Dependencies

- **Telegram Bot API**: For all Telegram bot functionality.
- **PostgreSQL**: Primary database for all application data.
- **Stripe**: For credit card payments.
- **MonoPay**: For card payments (Monobank integration).
- **Crypto Pay (@CryptoBot)**: For automated cryptocurrency payments.
- **OpenAI API**: For AI-enhanced analysis and risk scoring.
- **Resend API**: For email broadcasting and newsletters.
- **Web-Push**: For sending web push notifications.
- **SSL Labs API**: For SSL/TLS certificate analysis.
- **crt.sh**: For Certificate Transparency logs.
- **ip-api.com, ipinfo.io, Shodan InternetDB, GreyNoise, AbuseIPDB, ipwhois.app**: For IP address analysis.
- **Blockscout API, Blockchain.com API, Ethplorer, Mempool.space**: For blockchain wallet analysis.
- **Hunter.io, Disify, EmailRep.io**: For email verification and reputation.
- **RDAP/WHOIS (rdap.org), crt.sh, hackertarget.com, ThreatFox abuse.ch**: For domain analysis.
- **Numverify, Veriphone.io**: For phone number validation.
- **urlscan.io API, Google Safe Browsing, URLhaus abuse.ch, PhishTank**: For URL analysis.
- **NVD NIST API, CVE Details**: For CVE vulnerability data.
- **VirusTotal API, MalwareBazaar, ThreatFox abuse.ch, CIRCL hashlookup**: For file hash analysis.
- **GitHub API**: For username reconnaissance.
- **xposedornot.com**: For dark web breach monitoring.
- **Telegraph API**: For generating instruction pages.
- **Ko-fi**: External donation platform.