# DARKSHARE v4.0

## Overview

DARKSHARE is a Telegram bot application for risk assessment and security analysis. The platform enables users to analyze various data types including blockchain wallets, IP addresses, email addresses, phone numbers, domains, and social profiles for potential risks. The system provides risk scoring, generates PDF reports, and offers real-time monitoring capabilities.

The application consists of:
- A React-based landing page showcasing features and live statistics
- A full web dashboard for performing security checks, viewing history, and managing monitors
- A Telegram bot (built with Telegraf) handling user interactions and analysis workflows
- A PostgreSQL database for user management, reports, monitoring watches, and payments

## Web Dashboard Features

### Authentication
- **Telegram Login Widget**: Users authenticate via Telegram OAuth
- **Session Management**: PostgreSQL-backed sessions with `connect-pg-simple`
- **Unified Accounts**: Telegram bot users automatically have web access with same tier/quota
- **HMAC Verification**: Telegram auth payloads verified server-side
- **Session Security**: HttpOnly, SameSite=Lax, session regeneration on login

### Routes
- `/` - Landing page with "Web Dashboard" and "Telegram Bot" buttons
- `/login` - Telegram authentication page
- `/dashboard` - Check form with 10 check types (protected route)
- `/history` - Report history with PDF download (protected route)
- `/monitoring` - Watchlist management (protected route)
- `/referral` - Referral program with stats and share links (protected route)

### API Endpoints

#### Authentication
- `POST /api/auth/telegram` - Telegram login (HMAC verified)
- `GET /api/auth/me` - Get current authenticated user
- `POST /api/auth/logout` - Logout and destroy session

#### Protected Endpoints (require authentication)
- `POST /api/check` - Performs security checks
- `GET /api/reports` - Lists user's reports
- `GET /api/reports/:id/pdf` - Downloads PDF (ownership verified)
- `GET /api/watches` - Lists user's monitors
- `POST /api/watches` - Creates a new monitor
- `DELETE /api/watches/:id` - Deletes a monitor
- `GET /api/referrals` - Gets user's referral stats and referred users

### Shared Check Service
The `server/checkService.ts` module provides:
- Input validation for all check types
- Real API integrations where possible (free services only)
- Risk scoring (0-100) with levels: low, medium, high, critical
- Detailed findings and metadata generation

**Check Types & APIs (v2.0):**
- **IP Check**: Uses ip-api.com, ipinfo.io, Shodan InternetDB (ports/vulns), GreyNoise, DNS blacklists (Spamhaus, Spamcop)
- **Wallet Check**: EVM/BTC/TRX/SOL support, Blockscout API, Blockchain.com API, sanctions check, known mixer detection
- **Email Check**: MX validation via dns.google, disposable email detection, Hunter.io integration (optional)
- **Domain Check**: RDAP/WHOIS via rdap.org, DNS checks, **SSL/TLS certificate analysis** (SSL Labs + crt.sh), typosquatting detection, domain age analysis
- **Phone Check**: Country detection, VOIP patterns, Numverify integration (optional)
- **URL Check**: urlscan.io API, Google Safe Browsing (optional), **SSL/TLS verification for HTTPS**, phishing patterns, dangerous extensions
- **CVE Check (NEW)**: NVD NIST API, CVSS scoring, CISA KEV catalog, CVE Details integration
- **Hash Check (NEW)**: VirusTotal API (optional), MalwareBazaar, URLhaus - file malware detection
- **Username Check (NEW)**: GitHub API, cross-platform existence check, pattern analysis
- **Bot Token Check**: Telegram Bot API validation, capability analysis

### SSL/TLS Verification Features (v2.1 - NEW)
The checkService now includes comprehensive SSL/TLS certificate analysis:

**Domain Check SSL Analysis:**
- Validates SSL certificate validity using SSL Labs API (with crt.sh fallback)
- Extracts and displays certificate issue dates
- Calculates days until certificate expiration
- Shows certificate issuer information
- Identifies expired or expiring certificates (alerts for <90 days to expiry)
- Detects multiple certificates and Subject Alternative Names (SANs)
- Includes organization details and signature algorithms

**URL Check SSL Verification (for HTTPS):**
- Automatically checks SSL certificates for URLs starting with https://
- Validates certificate chain and expiration status
- Provides same detailed certificate analysis as domain check
- Flags critical issues (expired certs, missing certs for HTTPS)
- Integrates findings into overall URL risk assessment

**APIs Used:**
- **SSL Labs API** (primary): `https://api.ssllabs.com/api/v3/analyze`
- **crt.sh API** (fallback): `https://crt.sh/?q={domain}&output=json` - Free, no rate limits
- Supports timeout and error handling with graceful fallback

### Payment Verification System
Manual payment workflow with moderator approval:
1. User sends screenshot or tx hash via Telegram bot
2. Moderator (ADMIN_IDS) receives notification with Approve/Reject buttons
3. On approval: user tier and request quota updated, confirmation sent
4. On rejection: user notified with rejection reason

**Payment table tracks:**
- `screenshot_url`: Image file path
- `tx_hash`: Transaction hash
- `status`: pending, approved, rejected
- `tier_requested`: basic, pro, elite
- `amount`: Payment amount

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight router)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS with custom dark theme, CSS variables for theming
- **UI Components**: shadcn/ui component library (Radix UI primitives)
- **Animations**: Framer Motion for terminal-style effects and transitions
- **Fonts**: JetBrains Mono (code), Inter (body), Space Grotesk (display)
- **Build Tool**: Vite with path aliases (@/, @shared/, @assets/)

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript (ES modules)
- **Bot Framework**: Telegraf for Telegram bot interactions
- **PDF Generation**: PDFKit for generating analysis reports
- **API Design**: RESTful endpoints defined in shared/routes.ts with Zod validation

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: shared/schema.ts
- **Key Tables**:
  - `users`: User profiles, subscription tiers, request quotas, referral codes
  - `reports`: Generated analysis reports with PDF paths
  - `watches`: Active monitoring configurations with alert thresholds
  - `payments`: Payment records for subscriptions
  - `referrals`: Referral tracking between users

### Code Organization
- `client/` - React frontend application
- `server/` - Express backend and Telegram bot
- `shared/` - Shared types, schemas, and route definitions
- `migrations/` - Drizzle database migrations

### Key Design Patterns
- **Storage Interface**: `IStorage` abstraction allows for different storage implementations
- **Shared Schemas**: Drizzle schemas generate both database types and Zod validation
- **Type-Safe Routes**: API routes defined with Zod schemas for request/response validation
- **Bot State Management**: In-memory Map for tracking user conversation states

## External Dependencies

### Required Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `TELEGRAM_BOT_TOKEN`: Telegram Bot API token (optional - bot won't start without it)

### Third-Party Services
- **Telegram Bot API**: Primary user interface via Telegraf
- **PostgreSQL**: Database (use Replit's PostgreSQL or provision externally)

### Key NPM Packages
- `telegraf`: Telegram bot framework
- `drizzle-orm` + `drizzle-kit`: Database ORM and migrations
- `pdfkit`: PDF report generation
- `@tanstack/react-query`: Frontend data fetching
- `framer-motion`: UI animations
- `zod`: Runtime type validation

### Database Commands
- `npm run db:push`: Push schema changes to database

## Bot-Web Synchronization (v4.1+)

### Unified Report Storage
Both Telegram bot and web dashboard store reports with identical data structure for seamless synchronization:

**Report dataJson structure:**
```javascript
{
  target: string,                // The checked value (IP, email, wallet, etc.)
  riskScore: number,            // 0-100 risk score
  riskLevel: "low|medium|high|critical",
  findings: string[],           // List of findings/risks
  details: Record<string, any>, // Additional technical details
  sources: string[],            // Data sources used for the check
  summary: string               // Brief summary of findings
}
```

### Unified Report Listing
- `GET /api/reports` - Returns all reports for authenticated user regardless of source
- Works for both bot-generated and web-generated reports
- Reports include: id, type, target, riskLevel, riskScore, createdAt

### PDF Generation Consistency
- **Web**: Uses stored report data for PDF generation
- **Bot**: Generates PDFs immediately after check using fresh check result
- Both use `generateDetailedPDF()` with same data structure
- PDFs are consistent and contain all check metadata

### Live Statistics
Real-time statistics endpoint (`GET /api/stats`) now counts from database:
- `totalUsers`: Count of all users (bot + web)
- `totalReports`: Count of all reports from both sources
- `checksToday`: Reports generated today (24h window)
- `activeWatches`: Active monitoring watches
- `threatsBlocked`: Estimated threats (10% of total reports)

### History Page
The History page (`/history`) displays:
- All reports from both bot and web sources
- Sorted by creation date (newest first)
- Download PDF for any report
- Works seamlessly for unified user experience

## Deployment on Replit

### Web Application + Bot (Combined)
The application runs both the web server (Express + Vite) and Telegram bot in a single process:
- Use **Web Service** deployment type
- The bot runs integrated with the web server
- Default command: `npm run dev`

### Deployment Steps
1. Ensure `TELEGRAM_BOT_TOKEN` is set in Secrets
2. Ensure `DATABASE_URL` is configured (use Replit PostgreSQL)
3. Click "Deploy" or use the "Reserved VM" option for continuous operation
4. For production, the bot uses long-polling (no webhook needed)

### Reserved VM (Recommended for Bot)
For 24/7 bot operation, use **Reserved VM Deployment**:
- Provides dedicated computing resources
- Bot runs continuously without interruption
- Predictable costs and performance
- Set application type to "Web" (since we serve both web and bot)

### Environment Variables for Production
- `DATABASE_URL`: PostgreSQL connection (automatically set by Replit)
- `TELEGRAM_BOT_TOKEN`: Your bot token from @BotFather
- `NODE_ENV`: Set to "production" for production builds