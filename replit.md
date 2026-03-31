# DARKSHARE v4.5

## Overview

DARKSHARE is a professional security OSINT platform designed for analyzing 17 data types including blockchain wallets, IP addresses, email addresses, phone numbers, domains, URLs, CVEs, file hashes, usernames, bank card BINs, passwords, DNS records, SSL/TLS certificates, and MAC addresses. It aims to identify potential risks, provide AI-enhanced risk scoring, generate verifiable multi-page PDF reports, and offer real-time monitoring. The platform comprises a React-based landing page, a full web dashboard, and a Telegram bot, all backed by a PostgreSQL database. Its core purpose is to deliver comprehensive security intelligence and risk assessment to users.

## Full Audit (Mar 31, 2026)
- **Security: User data endpoint protected** — `/api/users/:tgId` now requires authentication; only the user themselves or admins can access; `cardToken` stripped from response
- **Security: MonoPay webhook hardened** — Always verifies payment via Monobank API (`/merchant/invoice/status`); rejects if MONOBANK_TOKEN not set or API fails
- **Security: File upload double-validation** — Validates both MIME type AND file extension; filenames sanitized with UUID to prevent collisions and path traversal; uploads directory blocks dotfiles and directory listing
- **Security: Session/API key secrets** — Removed `Date.now()` dynamic fallback; uses stable deterministic fallback chain
- **Security: Partnership input sanitized** — HTML/injection chars stripped, input capped at 200 chars before sending to admin Telegram
- **Security: Settings type validation** — `notifsOn`/`digestsOn` require boolean, `lang` requires valid enum value
- **Security: Widget user privacy** — Username masked to first 3 chars + `***`; userId validated as positive integer
- **Security: Upload headers** — `X-Robots-Tag: noindex`, private Cache-Control on uploaded files
- **Security: Error handler** — Multer errors now return proper 413/415 status codes; removed `throw err` after response
- **Code quality: TIER_REQUESTS centralized** — All payment flows (MonoPay, CryptoPay, Stars, manual admin approve) now use shared `TIER_REQUESTS` constant map
- **Code quality: File upload sanitization** — Filenames use UUID-based naming, extension whitelist enforced
- **UX/A11y: Chat accessibility** — Added `aria-label` to all icon-only close/clear/cancel buttons; added `data-testid` to search clear, share close, emoji close buttons; fixed empty `alt` on file preview
- **UX: ExifTool error messages** — Specific error messages for file too large (413), unsupported format (415), PRO-only (403) instead of generic "Failed to extract metadata"

## Recent Changes (Mar 2026)
- **Security Headers Hardening**: Added comprehensive HTTP security headers — `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `X-XSS-Protection`, `Strict-Transport-Security` (HSTS 1yr), `Referrer-Policy`, `Permissions-Policy` (camera/mic/geo disabled), full `Content-Security-Policy` with whitelisted sources. Disabled `X-Powered-By` header. Addresses all 11 OWASP scanner warnings.
- **IP Validation Fix**: Enhanced IP validation to reject invalid octets (>255), reject first octet=0, reject all-zeros IP. Previously `883.837.938.938` passed regex but wasn't properly rejected.
- **BIN Card Check Fix**: Fixed "Country: undefined" and "Bank: null" display issues. API response now guarantees proper fallback values (`"Невідомо"` / `"Невідомий"`) instead of null/undefined when data is missing from binlist.net API.
- **Pricing Table Accuracy**: Updated FREE tier check types from `11` to `15` across Home, Guide, Download pages and bot help text. Total platform modules: 17 (EXIF + GeoINT are PRO+). All `"11 модулів"` references updated to correct counts.
- **Email Broadcast Statistics**: Enhanced admin Email tab with 4 stat cards (subscribers count, auto-broadcast status ON/OFF, last auto-broadcast reach, last sent date) and detailed manual broadcast result panel with progress bar and success percentage.
- **Expanded Free API Sources**: Added 12+ new free API integrations across all check types:
  - **IP**: ipwhois.app (geo/TOR/proxy/ASN/currency), AbuseIPDB (abuse confidence score, requires optional API key)
  - **Domain**: crt.sh (Certificate Transparency), hackertarget.com (subdomain enumeration), ThreatFox abuse.ch (IOC database)
  - **URL**: URLhaus abuse.ch (malicious URL database), PhishTank (phishing verification)
  - **Hash**: CIRCL hashlookup (known file identification), ThreatFox abuse.ch (IOC hash lookup)
  - **Email**: Disify (disposable email detection), EmailRep.io (reputation/profiles/leaked credentials)
  - **Wallet**: Mempool.space (Bitcoin address fallback), ThreatFox abuse.ch (wallet IOC lookup)
- **Email Broadcast via Resend**: Integrated Resend API for email newsletters. New `server/emailService.ts` with HTML-safe templating, proper Resend SDK error handling (checks `{ data, error }` response). Admin panel "Email" tab with subscriber list from `auth_users`, compose form (subject/title/body), test send to single email, and broadcast to all subscribers. Batch sending (50/batch with 1s delay). Branded HTML email template matching DarkShare design. Routes: `GET /api/admin/email-subscribers`, `POST /api/admin/email-broadcast`, `POST /api/admin/email-test`.

- **ENTERPRISE/GROUPS truly unlimited**: All tier limit maps across bot, web, webhookHandlers now use 999999 (was 9999). GROUPS added to all maps that previously only had ENTERPRISE. All 5 decrement points skip for ENTERPRISE/GROUPS tiers. Frontend shows ∞ for unlimited tiers.
- **Promo board system**: New DB columns on `ds_coupons`: `description`, `image_url`, `is_public`. Public `GET /api/promos` endpoint (no auth) returns active public coupons. Admin can set coupons as public with description/image via new form fields. `PATCH /api/admin/coupons/:id` with field whitelist validation. Beautiful PromoBoard component on Dashboard with gradient cards, copy-to-clipboard, expiry countdown.
- **Admin conversation improvements**: Admin messages now forwarded to user's Telegram via bot (plain text, no Markdown escaping issues). Response includes `telegramDelivered` status. New conversation initiation from admin panel.
- **Enterprise tier fix v2**: Admin tier assignment (bot + web) now properly sets `requestsLeft` along with tier. `updateUserTier` in storage sets limits: FREE=5, PRO=50, ENTERPRISE/GROUPS=999999.
- **Referral abuse fix v2**: Referrals now require the new user to perform at least 1 check before being credited. Flow: start with ref code → select language → `pendingRefCode` saved to DB → first check triggers referral credit. Previously credited immediately on language selection, allowing bot abuse.
- **EXIF Metadata Extractor**: Bot photo handler extracts EXIF metadata (camera, GPS coordinates with reverse geocoding, dates, serial numbers, resolution, ISO, aperture). Web API endpoint `POST /api/exif` with file upload. PRO+ tiers only. Risk scoring based on GPS presence and personal data exposure.
- **GeoSINT Tips**: `/geosint` bot command with interactive region selector (Western Europe, Eastern Europe/CIS, Asia, Americas, Africa/Middle East). Each region has 6-9 visual identification tips (license plates, architecture, road signs, vegetation, mailboxes). Full 5-language support. Web API `GET /api/geosint`.
- **Schema**: Added `pending_ref_code` column to `ds_users` for persistent referral tracking across restarts.
- **Telegram Stars payments**: Added official Telegram Stars as payment method in bot and web. Bot: `sendInvoice` with XTR currency, `pre_checkout_query` auto-approve, `successful_payment` handler with receipt + admin notification. Stars prices: PRO=500⭐, ENTERPRISE=1750⭐, GROUPS=2750⭐. Promo codes apply discount to Stars amount. Deep link `stars_TIER_AMOUNT` for web-to-bot redirect. Web Pricing page: Stars option in payment modal with redirect to bot.
- **Security hardening**: cookie.secure based on NODE_ENV, removed hardcoded session secret fallback (uses crypto.randomBytes), Stripe webhook rejects when secret not configured.
- **DB performance**: searchUsers uses SQL ILIKE, getHighRiskReportsCount uses SQL filter, getTopUsers/getReferralStats use single JOIN queries (eliminated N+1), indexes added on all FK columns.
- **User ID fix**: Replit/Google auth now extracts real name from claims, updates old "Dark..." usernames.
- **Error Boundary**: Global ErrorBoundary component wrapping entire App.
- **Push notifications**: Web Push API via `web-push` package, `push_subscriptions` DB table, VAPID key generation, auto-subscribe on Dashboard login, admin broadcast to all subscribers from `/api/admin/push-broadcast`.
- **Ad Banner System**: Admin-managed promotional banners on dashboard. `ds_ad_banners` table with title/description/imageUrl/linkUrl/linkText/bgGradient/priority/showForTiers. Admin panel "Банери" tab for CRUD with gradient picker and tier targeting. Dashboard renders active banners filtered by user tier with dismiss animation. Public `GET /api/banners` + admin CRUD endpoints.
- **Admin 403 fix**: Revenue and user-growth admin queries now use `adminFetch()` with `x-admin-token` header (were missing `queryFn`, defaulting to unauthenticated fetcher).
- **Dashboard UX Polish**: SecurityTipRotator component with 10 rotating security tips (5 languages), dot progress indicator. ScanProgressSteps component showing 5-step animated progress during scans (API connection → Intelligence → Cross-reference → AI → Report). Enhanced check type grid with smoother hover animations (scale, glow, translate). CSS duplicate cleanup.
- **Landing Page Enhancements**: OSINT Arsenal expanded from 11 to 17 modules (added Password, DNS, SSL/TLS, MAC, EXIF, GeoINT). Plan Comparison table with feature matrix across FREE/PRO/ENT/GROUPS tiers. Responsive grid for 17 module cards (2-6 columns). Testimonials section with 3 user reviews. Trust badges strip with 10 API sources.
- **History/Monitoring enrichment**: All 17 check type icons and gradients added (password/dns/ssl/mac/exif/geoint were missing).
- **Enhanced Admin panel**: Revenue analytics (total/monthly with tier breakdown), user growth chart (30-day bar chart), push broadcast form, system health monitor, improved card layouts with glassmorphism.
- **4 new check types**: Password (entropy/HIBP/patterns/crack time), DNS (A/MX/NS/TXT/SPF/DMARC/DNSSEC via Google DNS), SSL/TLS (cert validity/issuer/HSTS/SAN), MAC (OUI vendor/VM detection/unicast-multicast). All use free public APIs.
- **Multi-page PDF reports**: Cover page with risk gauge, classification banner, metadata grid; findings page with numbered color-coded cards and summary; details + AI analysis page; sources + certification page with verification stamp, QR code, legal disclaimer. Download directly from Dashboard via `/api/check/generate-pdf` POST endpoint.
- **i18n for new types**: Full translations for password/dns/ssl/mac across EN/UK/RU/ES/DE including checkTypes, checkDescriptions, checkShortDescs, services, placeholders, and checkLabels.
- **Glassmorphism CSS**: `.glass`, `.glass-card`, `.glass-strong`, `.glass-deep`, `.result-card-3d` classes with backdrop-filter blur, `.surface-1/2/3` elevation system, `.inner-glow-*` utilities for depth effects.
- **Dashboard 3D enhancements**: Result card uses result-card-3d (3D perspective, gradient border on hover, deep shadows), scan input panel uses glass-deep, finding items have backdrop-blur + hover scaling, technical detail cards have glass hover effects, AI insights section has enhanced blur + green glow shadow. Check type grid uses glass-card + btn-3d.
- **Account 3D enhancements**: All section cards use glass-deep for enhanced depth with backdrop-filter blur and inset shadows.
- Activity log system: `ds_activity_log` table tracks registrations, logins, checks, payments, tier changes, app downloads. Admin `/api/admin/activity` endpoint with pagination. Events auto-logged at registration, login, check, payment approval, tier change.
- Admin "Активність" tab: real-time event feed with color-coded icons, pagination, refresh, download link display (PWA + Telegram bot links with copy buttons).
- Bot inline mode fix: static import of validateInput, 12s timeout with Promise.race, plain text output (no Markdown escaping issues), proper error handling for timeouts.
- Mobile UX: pull-to-refresh with haptic feedback, floating quick-action button (FAB) with radial menu, notification badges on bottom tabs, micro-animations (page-enter, touch-feedback, slide-up-fade, scale-pop, badge-pulse), iOS-like overscroll.
- Bug fixes: coupon.discount → coupon.discountPct, hasUserUsedCoupon args order, ALTER TABLE before CREATE TABLE for ds_payments, ApiDocs target→value field.

## Changes (Feb 2026)
- Quick Check on landing page: public `/api/quick-check` endpoint (no auth, 3 checks/day per IP, limited response), QuickCheck widget in hero section with IP/Email/Domain/Wallet type selector
- Telegram bot inline mode: `@DarkShare1Bot ip 8.8.8.8` works in any chat, shows risk score and findings inline, validates input before checking, escapes Markdown in results
- Google OAuth via passport-google-oauth20: `/api/login` → Google consent → `/api/callback`, supports Railway (`WEB_DOMAIN` env var) and Replit (`REPLIT_DOMAINS`) deployments
- Enhanced Chat: supports photo/video uploads (multer, 25MB limit), emoji picker with 4 categories (faces, security, finance, flags), team group chat (switch between global and team-specific chats), auto-expanding textarea with Shift+Enter for newlines, media preview with lightbox for images
- Team Group Chat: team members can chat privately via team tabs in Chat page, messages filtered by teamId, access control verifies team membership
- Landing page improvements: "Today Detected" block with animated threat stats, Demo Result block showing example wallet analysis (risk score 78/100), "When to Use" section with 4 use cases (crypto, Telegram, investments, partners), Case Studies with 3 real protection stories, "Discuss Risks in Chat" CTA button
- Free checks counter on Dashboard: animated progress bar with color states (green/orange/red), shows remaining/max checks per tier, upgrade CTA when exhausted
- Enhanced Bot Admin Broadcast: text/photo broadcast types, inline button builder (up to 3 rows), photo support via sendPhoto, preview before send
- Chat schema: ds_chat_messages now has message_type (text/image/video), file_url, team_id columns
- Static file serving for /uploads directory (chat media, payment screenshots)
- Colored inline keyboard buttons: all 236 bot buttons now use Telegram Bot API `style` field (primary/blue for actions, success/green for payments & confirms, danger/red for cancel & back). Helper functions `cb()` and `urlS()` wrap `Markup.button.callback/url` with style support.
- 3D custom emoji on buttons: `icon_custom_emoji_id` added to all buttons via `E` constant map (search, shield, star, gear, chart, lock, fire, check, cross, bell, money, user, doc, link, globe, bolt, gift, crown, warn, back, home, msg, rocket, diamond, key, clock, eye, trash, card, phone, mail, flag, pin). Requires bot Premium or Fragment username to render.
- MonoPay payment verification fallback: invoiceId stored in payments table, manual "I paid" button in bot triggers MonoPay API status check, auto-check every 2 min for pending payments, auth-protected check-status endpoint (bot token or session), fixes webhook delivery gap
- Fixed expiryDate bug in MonoPay webhook handler: was always 30 days, now correctly uses periodDays for monthly/yearly
- Optional 2FA (TOTP): users can enable/disable in Account > Security, QR code setup with authenticator apps, login 2FA verification step, 5-language i18n support
- Auto-recurring payments via MonoPay: card tokenization with saveCardData, hourly renewal scheduler charges saved cards, idempotency check prevents double-charging
- Subscription management: subscriptionExpiresAt, cardToken, autoRenew fields on users table; period-aware expiry (30 days monthly, 365 yearly)
- Beautiful receipt notifications from bot: multilingual (5 languages) receipt with plan, amount, requests, expiry, auto-renewal status
- Promo codes: per-user one-time usage enforcement via hasUserUsedCoupon check, bot validates directly via storage (not HTTP)
- Bot payment flow: buy_pro/buy_enterprise now shows payment method choice (Google Pay/Apple Pay, Crypto USDT, Promo code)
- Removed "Вибери модуль:" text from bot dashboard
- Favorites system: save frequently-checked targets for quick recheck from Dashboard (ds_favorites table)
- Public report sharing: generate unique shareable links via verification IDs
- Report deletion: users can delete reports from History page with confirmation
- Rate limiting: in-memory rate limiter on login (10/min), checks (30/min), breach-check (10/min)
- Security: session deletion verifies ownership before deleting, blocked users denied at middleware level
- Performance: getUserByUsername DB query instead of loading all users for team member add
- Mobile UI: Quick Actions hidden on mobile Dashboard, CSV/Compare buttons hidden on small screens
- Fixed missing riskDistribution translation key with inline 5-language mapping
- Fixed session deletion UI update using query invalidation
- Team stats dashboard: stat cards, check type distribution with colored bars, member leaderboard, recent team activity feed
- CSV export functionality for report history with blob download
- Side-by-side report comparison feature with animated panels, risk score bars, and selection mode
- Dark Web breach monitoring using xposedornot.com API for email leak detection
- Fixed critical sessions table name mismatch (FROM sessions → FROM "session")
- Added session metadata storage (userAgent, IP, loginTime) during Telegram auth
- Added 3 new backend endpoints: GET /api/teams/:id/stats, GET /api/reports/export/csv, POST /api/breach-check
- Added getReportsByUserId storage method, removed duplicate /api/teams/join route
- Multi-step payment flow: tier selection → payment method (Crypto/Stripe/MonoPay) → payment details with timer
- Crypto Pay (@CryptoBot) integration: POST /api/payments/cryptopay/create creates fiat-based invoice, webhook with HMAC-SHA-256 verification auto-activates tier + sends bot receipt
- Removed Stripe integration (not available)
- Subscription expiry enforcement: hourly scheduler downgrades expired users to FREE, sends bot notification
- 5-day expiry reminder: bot sends multilingual notification 5 days before plan expires (once per 24h, tracks last_reminder_sent)
- MonoPay (Monobank) payment integration: invoice creation API + webhook for auto-confirmation (UAH pricing)
- FREE tier daily limits enforced: 5 checks/day FREE, 50 PRO, unlimited ENTERPRISE/GROUPS (web + bot + bulk)
- MonoPay webhook auto-confirms payments and upgrades user tier automatically on success
- Bot-accessible MonoPay endpoint `/api/payments/monopay/bot-create` with X-Bot-Token auth
- PWA (Progressive Web App): service worker (`client/public/sw.js`) with cache-first for assets & network-first for API, manifest.json with proper installability fields, `PWAProvider` context in `client/src/lib/pwa.tsx` captures `beforeinstallprompt` globally so install prompt works across all routes. Download page (`/download`) rebuilt as app-store-like install page with phone mockup, feature cards, iOS instructions, install detection. Home page button changed from "Download APK" to "Install App".
- Notification system: `client/src/lib/notifications.ts` provides browser notification API with permission management, scan/streak reminders (8h/4h intervals), threat alerts, daily digests. `NotificationManager` component shows permission prompt banner on first visit. Service worker handles `push` and `notificationclick` events.
- PWA UI components: `OfflineIndicator` (red/green status banner), `AppUpdateBanner` (SW update refresh prompt), `InstallBanner` (dismissible mobile install prompt with 7-day localStorage memory). All rendered globally in App.tsx.
- Enhanced Account page: Security Level badge (Beginner/Analyst/Expert/Elite based on check count), 30-day activity heatmap (GitHub-style grid), push notification toggle with real browser permission request, app info section (version, cache size, last sync).
- Dashboard widgets: API Key status widget (links to Account for key management), scan frequency mini chart (CSS bar chart, last 7 days from reports data), Quick Share button on results (Web Share API with clipboard fallback).
- **3D Design System** (`client/src/index.css`): Full CSS 3D effects framework — used ONLY on internal app pages (Dashboard, Download, Account), NOT on the landing site. Includes: `.card-3d-hover`, `.holographic`/`.holographic-text`, `.rotate-3d`, `.orbit`, `.float-3d`, `.neon-text-*`, `.glitch`, `.scan-beam`, `.cyber-border`, `.perspective-grid`, `.depth-glow`, `.btn-3d-press`, `.hex-shield`, `.ring-pulse`. All GPU-accelerated, `@media (prefers-reduced-motion)` supported.
- **App-style UI system** (`client/src/index.css`): `.app-card` (20px radius, gradient bg, soft shadow), `.app-icon-circle`/`.app-icon-circle-lg` (round icon containers), `.app-header-gradient`, `.app-section`, `.app-bottom-bar` (fixed bottom with safe-area-inset), `.app-gauge-ring` (SVG circular gauge animation).
- **BottomTabBar** (`client/src/components/BottomTabBar.tsx`): Global bottom tab navigation for all internal pages (mobile only). 5 tabs: Home, History, Scan (center accent), Chat, Profile. Uses wouter routing, framer-motion animations.
- **App-native auth flow**: PageLayout appMode now shows an animated splash screen (logo + spinner) then in-app login screen (Google + Telegram + 2FA support) instead of redirecting to `/login`. Website (`Home.tsx`) no longer has "Open App" buttons — site and app are fully separated experiences. Unauthenticated users on app routes see the native splash/login; unauthenticated users on site see normal website login.
- **PageLayout redesign**: Compact mobile header (h-12, logo + title + actions), no hamburger menu on mobile, bottom tab bar replaces slide-out menu. Desktop sidebar unchanged. All internal pages pass `title` prop.
- **Dashboard app redesign**: `AppHeroCard` replaces StatusBarWidget (user avatar greeting, tier badge, streak/checks pills). `SecurityGauge` with SVG circular ring (animated stroke-dasharray, neon glow). `AppQuickActions` with round icon grid (Last Check, Monitoring, Streak, Checks). `MobileBottomBar` removed (replaced by global BottomTabBar).
- Download page: CSS perspective rotateY phone mockup with holographic screen overlay, 3 orbiting icons, card-3d-hover feature cards, btn-3d-press install buttons, scan-beam stats bar.
- **Landing site (Home.tsx)** kept clean — NO 3D effects applied to the website. 3D/app effects only on internal app pages.
- **Telegram bot** `/download` button added to dashboard menu: "📲 Додаток" URL button links to `${webUrl}/download`.
- Home page modules compacted for mobile: 2-column grid, hidden descriptions/tags, smaller icons
- Reversh Partnership redesigned as collapsible banner at top of Referral page
- Reorganized Telegram bot dashboard into categories: Network & Web, Crypto & Finance, OSINT, Security
- Updated pricing: PRO $10/month, Enterprise $35/month (was $50), Groups $55/month (was $65)
- Added 10-minute countdown timer to payment modal with expiry handling
- Promo code system now uses database (ds_coupons): admin creates promos via bot, web validates against DB
- Activity feed targets properly masked (***middle***) to prevent raw data exposure
- Added screenshot upload option for payment proof (uses multer)
- Optimized History page for mobile: compact layout, smaller icons and spacing
- Added session management to Account page: view sessions with device/IP info, delete non-current sessions
- Added backend endpoints: POST /api/promo/validate, DELETE /api/user/sessions/:id, POST /api/partnership/apply
- Added Reversh Partnership form on Referral page (name/phone/email/method/volume → admin notification)
- Payment endpoint now supports FormData (screenshot + promo code)
- All pricing translations updated across 5 languages (uk, en, ru, es, de)
- Fixed dual-account session issues with session regeneration
- Added missing database tables (ds_coupons, ds_coupon_usages, ds_admin_settings, ds_teams, ds_team_members) to ensureTablesExist
- Fixed bulk check endpoint response format to return {results: [...]}
- Added interactive 6-step onboarding tour for new dashboard users (localStorage persistence)
- Added Teams page with team creation, member management, owner permissions
- Added Security Widget page with embeddable HTML badge generator
- Added API Documentation page for ENTERPRISE users
- Added Terms of Service and Privacy Policy pages
- Added GROUPS pricing tier ($55/month)
- Expanded bot admin panel with Stats, Coupons, Revenue, Reports, Broadcast sections
- Updated navigation: Teams and Widget in sidebar and mobile menu
- Multi-network crypto payments: TON (-5% discount), ERC-20, BEP-20, Solana, ETH, XRP (with memo)
- Fixed Railway healthcheck: /health endpoint registered before async DB/Stripe init
- Fixed bot 409 conflict: limited retries with exponential backoff instead of infinite retry
- Improved bot dashboard formatting: clean mobile-friendly layout without broken box characters
- Subscription expiry countdown on Dashboard: shows days remaining, expiry date, auto-renew badge for paid users; color-coded (green/orange/red) with animated progress bar
- /api/auth/me now returns subscriptionExpiresAt and autoRenew fields
- Enhanced Chat page: 3D holographic header, glassmorphism message cards, reply-to-message with quoted block rendering, message search, pinned messages bar (report messages), date separators, typing indicator, scroll-to-bottom with new message counter, message status indicators
- Mobile responsiveness fixes: overflow-x-hidden on html/body, reduced gradient blob sizes on mobile, fixed Home/Pricing/History overflow
- Guide page (/guide): comprehensive instruction page with check types, inline bot mode examples, dashboard features, subscription plans; multi-language (5 languages)
- Bot guide button in dashboard menu, /help command updated with inline mode examples, "open_guide" action handler with full instructions (uk/ru/en)
- Daily auto-broadcast: personalized daily message to all users with their stats, remaining checks, scam warning; scheduled at 10:00 UTC hourly check
- Admin daily broadcast controls: toggle on/off, send now, status display, reach stats (bot + web admin panel)
- Admin panel Settings tab: daily broadcast card with enable/disable, last sent date, reach count, message template preview
- Telegraph API integration: auto-creates instruction page on bot startup (telegra.ph), "Read on Telegraph" button in /help and Guide; Instant View support
- Removed duplicate /help handler (was registered twice); kept the detailed multilingual version
- Fixed admin keyboard layout: Block + Add Req paired in same row, Settings alone in row
- Added missing `common.or` translation key across all 5 languages (en/uk/ru/es/de)

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS with custom dark theme and shadcn/ui components
- **Animations**: Framer Motion for UI effects
- **Fonts**: JetBrains Mono, Inter, Space Grotesk
- **Build Tool**: Vite

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript (ES modules)
- **Bot Framework**: Telegraf for Telegram bot
- **PDF Generation**: PDFKit
- **API Design**: RESTful endpoints with Zod validation
- **Check Service**: `server/checkService.ts` handles input validation, API integrations, risk scoring (0-100), and detailed findings for 11 check types including IP, Wallet, Email, Domain (with SSL/TLS analysis), Phone, URL (with SSL/TLS verification), CVE, Hash, Username, and Bot Token.

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Key Tables**: `users`, `reports`, `watches`, `payments`, `referrals`, `support_tickets`
- **Schema Location**: `shared/schema.ts`

### Code Organization
- `client/` - React frontend
- `server/` - Express backend and Telegram bot
- `shared/` - Shared types, schemas, and route definitions
- `migrations/` - Drizzle database migrations

### Key Design Patterns
- **Storage Interface**: `IStorage` abstraction
- **Shared Schemas**: Drizzle schemas for DB types and Zod validation
- **Type-Safe Routes**: API routes with Zod schemas
- **Bot State Management**: In-memory Map for conversation states

### Internationalization (i18n)
- **Frontend**: Centralized system using `LanguageProvider` context (`client/src/lib/i18n.tsx`) supporting 5 languages (en, uk, ru, es, de).
- **Bot**: Uses `getTranslation(lang, key)` helper with translations in `server/i18n.ts`.

### Unified Navigation
- Shared `AppSidebar`, `PageLayout`, and `MobileMenu` components for authenticated pages.

### Authentication
- Telegram Login Widget with HMAC verification.
- PostgreSQL-backed sessions using `connect-pg-simple`.
- Session regeneration on account switch (prevents cross-account session leakage).
- Unified accounts for bot and web users.

### Payment System
- Supports Crypto Pay (@CryptoBot) for automated crypto payments, MonoPay (Google Pay/Apple Pay), and manual crypto (USDT).
- Crypto Pay webhook auto-confirms payments and activates tiers automatically.
- MonoPay webhook auto-confirms card payments.

### AI-Enhanced Analysis
- Integrates with OpenAI for AI-generated security summaries, threat level assessments, and actionable recommendations when configured. Fallbacks to rule-based analysis.

### Support System
- Contact form on web (`/support` page) and bot (`/support` command).
- Support email: darkshare.store@gmail.com displayed in Footer, AppSidebar, MobileMenu.
- Support tickets stored in `support_tickets` table with userId, name, contact, message, status (open/replied/closed), adminReply, source (web/telegram).
- Admin receives Telegram notifications when tickets are created (web or bot).
- Admin panel (`/admin`) has tabbed layout: Dashboard, Messages, Tickets, Payments, Users, Coupons, Settings.
- Admin Messages system: `ds_admin_messages` table for admin-user conversations. Admin can message any user, open dialogs from tickets or user list. User-side API at `/api/support/messages`. Conversation list with unread counts, real-time chat UI.
- Bot admin panel: expanded with Stats, Users, Search, Payments, Tickets, Coupons, Revenue, Reports, Broadcast, Block, Tiers, Add Requests, Settings sections.
- Free tier: 5 requests per day.

### API Documentation
- API Docs page (`/api-docs`) for ENTERPRISE users with endpoint docs, code examples, and interactive testing.
- Re-check from History: users can click re-check on any History report to pre-fill Dashboard with the target.

### Bot-Web Synchronization
- Unified report storage and listing across bot and web.
- Consistent PDF generation using the same data structure.
- Live statistics derived from combined bot and web activities.

## External Dependencies

- **Telegram Bot API**: For bot interactions.
- **PostgreSQL**: Primary database.
- **Stripe**: For card payments.
- **Ko-fi**: External donation platform.
- **SSL Labs API**: For SSL/TLS certificate analysis.
- **crt.sh API**: Fallback for SSL/TLS certificate analysis.
- **ip-api.com, ipinfo.io, Shodan InternetDB, GreyNoise, DNS blacklists (Spamhaus, Spamcop)**: For IP checks.
- **Blockscout API, Blockchain.com API**: For Wallet checks.
- **Hunter.io**: Optional for Email checks.
- **RDAP/WHOIS via rdap.org**: For Domain checks.
- **Numverify**: Optional for Phone checks.
- **urlscan.io API, Google Safe Browsing**: Optional for URL checks.
- **NVD NIST API, CVE Details**: For CVE checks.
- **VirusTotal API, MalwareBazaar, URLhaus**: For Hash checks.
- **GitHub API**: For Username checks.
- **OpenAI API**: For AI-enhanced analysis (optional).

### Key NPM Packages
- `telegraf`
- `drizzle-orm` + `drizzle-kit`
- `pdfkit`
- `@tanstack/react-query`
- `framer-motion`
- `zod`