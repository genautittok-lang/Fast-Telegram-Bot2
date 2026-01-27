import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
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
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        tg_id TEXT NOT NULL UNIQUE,
        username TEXT,
        lang TEXT DEFAULT 'uk',
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
      );
      
      CREATE TABLE IF NOT EXISTS reports (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        object_type TEXT NOT NULL,
        data_json JSONB,
        pdf_path TEXT,
        generated_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS watches (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        object_type TEXT NOT NULL,
        value TEXT NOT NULL,
        thresholds_json JSONB,
        status TEXT DEFAULT 'low',
        last_check TIMESTAMP,
        alerts_on BOOLEAN DEFAULT true
      );
      
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        tier TEXT NOT NULL,
        amount_usdt DECIMAL NOT NULL,
        tx_hash TEXT,
        screenshot_url TEXT,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS referrals (
        id SERIAL PRIMARY KEY,
        referrer_id INTEGER REFERENCES users(id),
        referred_id INTEGER REFERENCES users(id),
        paid BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS achievements (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        type TEXT NOT NULL,
        unlocked_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    console.log("Database tables ready!");
  } catch (error: any) {
    console.error("Error creating tables:", error.message);
  } finally {
    await pool.end();
  }
}

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// Configure session store - use memory if no database
import pgSessionModule from "connect-pg-simple";
let sessionStore: session.Store | undefined = undefined;

if (process.env.DATABASE_URL) {
  try {
    const PgStore = pgSessionModule(session);
    sessionStore = new PgStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true,
    });
    console.log("Using PostgreSQL session store");
  } catch (error) {
    console.warn("Failed to create PostgreSQL session store, using memory store:", error);
  }
} else {
  console.log("Using memory session store (no DATABASE_URL)");
}

app.use(
  session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || "darkshare-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  })
);

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

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
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
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
