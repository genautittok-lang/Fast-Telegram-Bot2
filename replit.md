# DARKSHARE v4.4

## Overview

DARKSHARE is a professional security OSINT platform designed for analyzing various data types including blockchain wallets, IP addresses, email addresses, phone numbers, domains, URLs, CVEs, file hashes, usernames, and bank card BINs. It aims to identify potential risks, provide AI-enhanced risk scoring, generate verifiable PDF reports, and offer real-time monitoring. The platform comprises a React-based landing page, a full web dashboard, and a Telegram bot, all backed by a PostgreSQL database. Its core purpose is to deliver comprehensive security intelligence and risk assessment to users.

## Recent Changes (Feb 2026)
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
- **3D Design System** (`client/src/index.css`): Full CSS 3D effects framework with `.card-3d-hover` (perspective tilt), `.holographic`/`.holographic-text` (rainbow shimmer), `.rotate-3d` (Y-axis spin), `.orbit`/`.orbit-reverse` (orbiting elements), `.float-3d` (translateZ float), `.neon-text`/`.neon-text-cyan`/`.neon-text-green`/`.neon-text-yellow`/`.neon-text-red` (multi-layer text-shadow), `.glitch` (periodic displacement), `.scan-beam` (vertical sweep line), `.cyber-border` (animated gradient outline), `.perspective-grid` (cyberpunk vanishing-point grid), `.depth-glow` (layered box-shadows), `.btn-3d-press` (physical depth button), `.hex-shield` (hexagonal clip-path), `.ring-pulse` (expanding ring). All GPU-accelerated, `@media (prefers-reduced-motion)` supported.
- Home hero: 3D rotating hexagonal shield with orbit rings (Lock/ShieldCheck icons), perspective grid background, floating 3D hexagons, holographic version badge, neon-glow heading, glitch effect on "DARKSHARE", btn-3d-press CTAs, cyber-border QuickCheck, scan-beam on Activity card, depth-glow module cards.
- Download page: CSS perspective rotateY phone mockup with holographic screen overlay, 3 orbiting icons (Shield/Lock/Eye), card-3d-hover feature cards, btn-3d-press install buttons, scan-beam stats bar, depth-glow screenshot cards, cyber-border + holographic bottom CTA.
- Dashboard: cyber-border status bar, 3D tilt hover on quick action cards, btn-3d-press scan button with ring-pulse when idle, holographic results container, scan-beam during analysis, depth-glow check type buttons, neon-text-green/yellow/red risk scores.
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
- Admin panel (`/admin`) has tabbed layout: Dashboard, Tickets, Payments, Users, Coupons, Settings.
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