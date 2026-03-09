# DARKSHARE v4.4

Digital risk assessment platform with Telegram bot and web dashboard.

## Features

- **6 Check Types**: IP, Wallet, Email, Domain, Phone, URL analysis
- **Real API Integration**: ip-api.com for IP geolocation, local pattern analysis for others
- **PDF Reports**: Professional risk assessment reports
- **Telegram Bot**: Full-featured bot with inline keyboards
- **Web Dashboard**: React-based dashboard with Telegram authentication
- **Unified Accounts**: Same tier/quota across bot and web
- **Monitoring**: Real-time watchlist with alerts
- **Payment System**: Manual verification with moderator approval

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express, Telegraf
- **Database**: PostgreSQL with Drizzle ORM
- **PDF**: PDFKit

## Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
DATABASE_URL=postgresql://user:password@host:5432/database
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
SESSION_SECRET=your_session_secret
```

## Development

```bash
# Install dependencies
npm install

# Push database schema
npm run db:push

# Start development server
npm run dev
```

## Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Railway Deployment

1. Connect your GitHub repository to Railway
2. Add environment variables in Railway dashboard:
   - `DATABASE_URL` (use Railway's PostgreSQL or external)
   - `TELEGRAM_BOT_TOKEN`
   - `SESSION_SECRET`
3. Deploy!

## Bot Commands

- `/start` - Start the bot
- `/menu` - Open main menu

## API Endpoints

### Authentication
- `POST /api/auth/telegram` - Telegram login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Checks (requires auth)
- `POST /api/check` - Perform security check
- `GET /api/reports` - Get user reports
- `GET /api/reports/:id/pdf` - Download PDF report

### Monitoring (requires auth)
- `GET /api/watches` - Get user watches
- `POST /api/watches` - Create watch
- `DELETE /api/watches/:id` - Delete watch

## License

MIT
