# DARKSHARE

DARKSHARE is a professional OSINT platform offering AI-enhanced security intelligence and risk assessment across 17 data types, generating verifiable multi-page PDF reports, and providing real-time monitoring for proactive security.

## Run & Operate

- **Dev**: `npm run dev` (runs on port 5000)
- **Build**: `npm run build`
- **Start (prod)**: `npm run start`
- **DB push**: `npm run db:push`

**Required secrets** (set via Replit Secrets):
- `DATABASE_URL` — PostgreSQL connection string (auto-provided by Replit DB)
- `SESSION_SECRET` — express-session secret
- `TELEGRAM_BOT_TOKEN` — Telegram bot (optional, bot disabled if missing)
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Google OAuth (optional)
- `GOOGLE_SAFE_BROWSING_KEY` — URL safety checks (optional)
- `RESEND_API_KEY` — email sending (optional)
- `MONOBANK_TOKEN` — MonoPay payments (optional)
- `CRYPTO_PAY_API_TOKEN` — CryptoPay payments (optional)
- `STRIPE_WEBHOOK_SECRET` — Stripe webhook verification (Stripe via Replit connector)

## Stack

- **Frontend**: React 18 (TypeScript), Wouter, TanStack React Query, Tailwind CSS, shadcn/ui, Framer Motion
- **Backend**: Node.js 20, Express (TypeScript), tsx (dev), esbuild (prod)
- **Database**: PostgreSQL (Replit built-in), Drizzle ORM
- **Telegram Bot**: Telegraf
- **PDF**: pdfkit
- **Payments**: Stripe (via Replit connector), CryptoPay, MonoPay
- **Email**: Resend
- **Validation**: Zod
- **Build Tool**: Vite (frontend), esbuild (backend)

## Where things live

- `client/` — React frontend (entry: `client/src/main.tsx`)
- `server/` — Express backend, Telegram bot (`server/bot.ts`), REST API v1 (`server/apiV1.ts`), PDF generation (`server/pdfGenerator.ts`), email (`server/emailService.ts`)
- `server/replit_integrations/auth/` — Google OAuth + session auth setup
- `shared/` — Shared types, Zod schemas, OSINT sources (`shared/schema.ts`, `shared/routes.ts`)
- `script/build.ts` — production build script
- `drizzle.config.ts` — Drizzle ORM config

## Architecture decisions

- **Port 5000**: Server always runs on port 5000 (Replit webview requirement); falls back from `PORT` env var.
- **Inline DB migrations**: `ensureTablesExist()` in `server/index.ts` runs raw SQL on startup to create/alter all tables idempotently — no migration files needed.
- **Stripe via Replit connector**: `server/stripeClient.ts` fetches Stripe keys from Replit's connector API (`REPLIT_CONNECTORS_HOSTNAME`), not from env vars directly.
- **Auth dual-track**: Telegram widget auth + Google OAuth both map users into `ds_users` table; session stored in PostgreSQL (`sessions` table).
- **Stateless Public REST API v1**: API-key auth with `timingSafeEqual`, HMAC-SHA256 webhooks with SSRF guards (`server/apiV1.ts`).

## Product

- **OSINT Platform**: Checks 17 data types (blockchain, IP, email, phone, domain, URL, etc.) across 159+ sources.
- **AI-Enhanced Risk Scoring**: Scores 0–100 with AI summaries and recommendations.
- **Verifiable PDF Reports**: Multi-page reports with AI analysis, branding, and verification ID.
- **Real-time Monitoring**: Watchlist alerts via Web Push and Telegram.
- **Telegram Bot**: Full-featured bot with multi-language support (5 languages).
- **Payment System**: Stripe, CryptoPay, MonoPay with subscription tiers (FREE/PRO/Enterprise/Groups).
- **WireGuard VPN**: PRO+ feature, 6 regions, server-side key generation, no logs.
- **White-label Reports**: Enterprise/Groups custom branding on PDFs.

## User preferences

- Preferred communication style: Simple, everyday language.

## Gotchas

- Telegram only renders `<tg-emoji>` tags in HTML parse_mode; other screens need escaping when switching modes.
- SSRF guard on webhooks rejects private/loopback/link-local addresses.
- Bulk check (`/api/v1/check/bulk`) is Enterprise-only, capped at 100 items / 5 concurrency.
- Watchlist poller runs every 30 minutes.
- `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` are stored as env vars (not secrets) for Web Push.

## Pointers

- Drizzle ORM: https://orm.drizzle.team/docs/
- Telegraf: https://telegraf.js.org/
- shadcn/ui: https://ui.shadcn.com/docs
- Stripe Replit connector: `server/stripeClient.ts`
