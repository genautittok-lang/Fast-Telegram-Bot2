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
- **Telegraph API**: For generating instruction pages.