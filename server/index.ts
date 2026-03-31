import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Create tables directly via SQL (more reliable than drizzle-kit on Railway)
async function ensureTablesExist() {
  if (!process.env.DATABASE_URL) {
    console.log("No DATABASE_URL - skipping table creation");
    return;
  }
  
  const { Pool } = await import("pg");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    console.log("Ensuring database tables exist...");
    
    // Create session table for connect-pg-simple
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "session" (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL,
        PRIMARY KEY ("sid")
      )
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire")
    `);
    
    // Create ds_users table first (no dependencies) - prefixed to avoid KVITKA conflict
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ds_users (
        id SERIAL PRIMARY KEY,
        tg_id TEXT NOT NULL UNIQUE,
        username TEXT,
        lang TEXT DEFAULT 'uk',
        lang_set BOOLEAN DEFAULT false,
        tier TEXT DEFAULT 'FREE',
        requests_left INTEGER DEFAULT 15,
        streak_days INTEGER DEFAULT 0,
        ref_code TEXT UNIQUE,
        discount_pct INTEGER DEFAULT 0,
        blocked BOOLEAN DEFAULT false,
        theme TEXT DEFAULT 'dark',
        notifs_on BOOLEAN DEFAULT true,
        digests_on BOOLEAN DEFAULT true,
        last_login TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Add lang_set column if missing (for existing databases)
    await pool.query(`
      ALTER TABLE ds_users ADD COLUMN IF NOT EXISTS lang_set BOOLEAN DEFAULT false
    `);
    
    await pool.query(`ALTER TABLE ds_users ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP`);
    await pool.query(`ALTER TABLE ds_users ADD COLUMN IF NOT EXISTS card_token TEXT`);
    await pool.query(`ALTER TABLE ds_users ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT false`);
    
    // Create dependent tables with ds_ prefix
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ds_reports (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES ds_users(id),
        object_type TEXT NOT NULL,
        data_json JSONB,
        pdf_path TEXT,
        verification_id TEXT,
        generated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Add verification_id column if missing (for existing databases)
    await pool.query(`
      ALTER TABLE ds_reports ADD COLUMN IF NOT EXISTS verification_id TEXT
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ds_watches (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES ds_users(id),
        object_type TEXT NOT NULL,
        value TEXT NOT NULL,
        thresholds_json JSONB,
        status TEXT DEFAULT 'low',
        last_check TIMESTAMP,
        alerts_on BOOLEAN DEFAULT true
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ds_payments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES ds_users(id),
        tier TEXT NOT NULL,
        amount_usdt DECIMAL NOT NULL,
        tx_hash TEXT,
        screenshot_url TEXT,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    await pool.query(`ALTER TABLE ds_payments ADD COLUMN IF NOT EXISTS period TEXT`);
    await pool.query(`ALTER TABLE ds_payments ADD COLUMN IF NOT EXISTS invoice_id TEXT`);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ds_referrals (
        id SERIAL PRIMARY KEY,
        referrer_id INTEGER REFERENCES ds_users(id),
        referred_id INTEGER REFERENCES ds_users(id),
        paid BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ds_achievements (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES ds_users(id),
        type TEXT NOT NULL,
        unlocked_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS ds_support_tickets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES ds_users(id),
        name TEXT NOT NULL,
        contact TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT DEFAULT 'open',
        admin_reply TEXT,
        source TEXT DEFAULT 'web',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS ds_coupons (
        id SERIAL PRIMARY KEY,
        code TEXT NOT NULL UNIQUE,
        type TEXT NOT NULL,
        value INTEGER NOT NULL,
        tier TEXT,
        max_uses INTEGER DEFAULT 1,
        used_count INTEGER DEFAULT 0,
        expires_at TIMESTAMP,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS ds_coupon_usages (
        id SERIAL PRIMARY KEY,
        coupon_id INTEGER REFERENCES ds_coupons(id),
        user_id INTEGER REFERENCES ds_users(id),
        used_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS ds_admin_settings (
        id SERIAL PRIMARY KEY,
        key TEXT NOT NULL UNIQUE,
        value TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS ds_teams (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        owner_id INTEGER REFERENCES ds_users(id) NOT NULL,
        max_members INTEGER DEFAULT 10,
        invite_code TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`ALTER TABLE ds_teams ADD COLUMN IF NOT EXISTS invite_code TEXT`).catch(() => {});
    await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_teams_invite_code ON ds_teams(invite_code) WHERE invite_code IS NOT NULL`).catch(() => {});

    await pool.query(`
      CREATE TABLE IF NOT EXISTS ds_team_members (
        id SERIAL PRIMARY KEY,
        team_id INTEGER REFERENCES ds_teams(id) NOT NULL,
        user_id INTEGER REFERENCES ds_users(id) NOT NULL,
        role TEXT DEFAULT 'member',
        joined_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS ds_favorites (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES ds_users(id),
        check_type TEXT NOT NULL,
        value TEXT NOT NULL,
        label TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS ds_chat_messages (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES ds_users(id) NOT NULL,
        username TEXT,
        message TEXT NOT NULL,
        message_type TEXT DEFAULT 'text',
        file_url TEXT,
        team_id INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query(`ALTER TABLE ds_chat_messages ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text'`);
    await pool.query(`ALTER TABLE ds_chat_messages ADD COLUMN IF NOT EXISTS file_url TEXT`);
    await pool.query(`ALTER TABLE ds_chat_messages ADD COLUMN IF NOT EXISTS team_id INTEGER`);
    await pool.query(`ALTER TABLE ds_chat_messages ADD COLUMN IF NOT EXISTS photo_url TEXT`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS ds_chat_reactions (
        id SERIAL PRIMARY KEY,
        message_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        emoji TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(message_id, user_id, emoji)
      )
    `);

    await pool.query(`ALTER TABLE ds_users ADD COLUMN IF NOT EXISTS totp_secret TEXT`);
    await pool.query(`ALTER TABLE ds_users ADD COLUMN IF NOT EXISTS totp_enabled BOOLEAN DEFAULT false`);
    await pool.query(`ALTER TABLE ds_users ADD COLUMN IF NOT EXISTS last_reminder_sent TIMESTAMP`);
    await pool.query(`ALTER TABLE ds_users ADD COLUMN IF NOT EXISTS photo_url TEXT`);
    await pool.query(`ALTER TABLE ds_users ADD COLUMN IF NOT EXISTS pending_ref_code TEXT`);

    await pool.query(`ALTER TABLE ds_coupons ADD COLUMN IF NOT EXISTS description TEXT`);
    await pool.query(`ALTER TABLE ds_coupons ADD COLUMN IF NOT EXISTS image_url TEXT`);
    await pool.query(`ALTER TABLE ds_coupons ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS ds_admin_messages (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES ds_users(id),
        message TEXT NOT NULL,
        sender TEXT NOT NULL,
        ticket_id INTEGER REFERENCES ds_support_tickets(id),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS ds_activity_log (
        id SERIAL PRIMARY KEY,
        event_type TEXT NOT NULL,
        user_id INTEGER REFERENCES ds_users(id),
        username TEXT,
        details TEXT,
        meta JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        sid VARCHAR PRIMARY KEY,
        sess JSONB NOT NULL,
        expire TIMESTAMP NOT NULL
      )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS "IDX_sessions_expire" ON sessions (expire)`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS ds_push_subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES ds_users(id) NOT NULL,
        endpoint TEXT NOT NULL,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`CREATE INDEX IF NOT EXISTS idx_reports_user_id ON ds_reports(user_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_watches_user_id ON ds_watches(user_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_payments_user_id ON ds_payments(user_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_payments_status ON ds_payments(status)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON ds_referrals(referrer_id)`);
    try {
      await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_referrals_referred_id_unique ON ds_referrals(referred_id)`);
    } catch (e: any) {
      if (e?.message?.includes("could not create unique index")) {
        console.log("Note: Duplicate referrals exist, cleaning up before creating unique index...");
        await pool.query(`
          DELETE FROM ds_referrals a USING ds_referrals b
          WHERE a.id < b.id AND a.referred_id = b.referred_id
        `);
        try {
          await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_referrals_referred_id_unique ON ds_referrals(referred_id)`);
          console.log("Unique referral index created after cleanup.");
        } catch { console.log("Unique referral index still could not be created."); }
      }
    }
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON ds_team_members(team_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON ds_team_members(user_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON ds_favorites(user_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_chat_messages_team_id ON ds_chat_messages(team_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON ds_chat_messages(user_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON ds_activity_log(user_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_activity_log_event_type ON ds_activity_log(event_type)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_chat_reactions_message_id ON ds_chat_reactions(message_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON ds_push_subscriptions(user_id)`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS ds_ad_banners (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        image_url TEXT,
        media_type TEXT DEFAULT 'image',
        link_url TEXT,
        link_text TEXT,
        bg_gradient TEXT DEFAULT 'from-purple-600/20 via-pink-500/10 to-transparent',
        position TEXT DEFAULT 'dashboard',
        is_active BOOLEAN DEFAULT true,
        priority INTEGER DEFAULT 0,
        show_for_tiers TEXT[] DEFAULT ARRAY['FREE','PRO'],
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query(`ALTER TABLE ds_ad_banners ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'image'`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS auth_users (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::VARCHAR,
        email VARCHAR UNIQUE,
        first_name VARCHAR,
        last_name VARCHAR,
        profile_image_url VARCHAR,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    console.log("Database tables ready!");
  } catch (error: any) {
    console.error("Error creating tables:", error.message);
  } finally {
    await pool.end();
  }
}

const app = express();

app.disable('x-powered-by');

const httpServer = createServer(app);


declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

console.log("Using PostgreSQL session store");

app.use((_req, res, next) => {
  res.removeHeader('X-Powered-By');
  res.setHeader('Server', 'DarkShare');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://replit.com https://telegram.org https://oauth.telegram.org; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' https: wss:; frame-src 'self' https://js.stripe.com https://replit.com https://oauth.telegram.org https://telegram.org; object-src 'none'; base-uri 'self'");

  if (_req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  } else {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
  }

  next();
});

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Create tables before starting server
  await ensureTablesExist();
  
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ message: "File too large" });
    }
    if (err.message?.includes("Invalid file type")) {
      return res.status(415).json({ message: err.message });
    }
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("Unhandled error:", message);
    res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 8080 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "8080", 10);
  
  console.log(`Starting HTTP server on port ${port}...`);
  
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      console.log(`HTTP server is listening on port ${port}`);
      log(`serving on port ${port}`);
    },
  );
  
  httpServer.on('error', (err) => {
    console.error('HTTP server error:', err);
  });
})().catch((err) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
