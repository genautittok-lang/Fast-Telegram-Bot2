# DARKSHARE v4.1

## Overview

DARKSHARE is a professional security OSINT platform designed for analyzing various data types including blockchain wallets, IP addresses, email addresses, phone numbers, domains, URLs, CVEs, file hashes, usernames, and bank card BINs. It aims to identify potential risks, provide AI-enhanced risk scoring, generate verifiable PDF reports, and offer real-time monitoring. The platform comprises a React-based landing page, a full web dashboard, and a Telegram bot, all backed by a PostgreSQL database. Its core purpose is to deliver comprehensive security intelligence and risk assessment to users.

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
- **Key Tables**: `users`, `reports`, `watches`, `payments`, `referrals`
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
- Unified accounts for bot and web users.

### Payment System
- Supports Card payments (Stripe), Crypto payments (USDT TRC-20), and Ko-fi donations.
- Manual payment verification process via Telegram bot for crypto and Ko-fi.

### AI-Enhanced Analysis
- Integrates with OpenAI for AI-generated security summaries, threat level assessments, and actionable recommendations when configured. Fallbacks to rule-based analysis.

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