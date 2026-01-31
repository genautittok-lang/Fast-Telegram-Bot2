import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";

declare module "express-session" {
  interface SessionData {
    userId?: number;
    tgId?: string;
  }
}

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000;
  
  if (process.env.DATABASE_URL) {
    const pgStore = connectPg(session);
    const sessionStore = new pgStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: false,
      ttl: sessionTtl,
      tableName: "session",
    });
    
    return session({
      secret: process.env.SESSION_SECRET || "darkshare-secret-key",
      store: sessionStore,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: sessionTtl,
      },
    });
  }
  
  return session({
    secret: process.env.SESSION_SECRET || "darkshare-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      maxAge: sessionTtl,
    },
  });
}

export async function setupGoogleAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());

  app.get("/api/auth/me", (req, res) => {
    if (req.session?.userId) {
      return res.json({
        authenticated: true,
        provider: "telegram",
        userId: req.session.userId,
        tgId: req.session.tgId,
      });
    }
    
    return res.status(401).json({ error: "Not authenticated" });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      res.redirect("/");
    });
  });

  console.log("Session management configured");
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.session?.userId) {
    return next();
  }
  return res.status(401).json({ error: "Not authenticated" });
};
