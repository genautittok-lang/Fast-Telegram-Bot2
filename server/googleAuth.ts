import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

declare module "express-session" {
  interface SessionData {
    userId?: number;
    tgId?: string;
  }
}

export function getSession() {
  const sessionTtl = 30 * 24 * 60 * 60 * 1000;
  
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
      resave: true,
      saveUninitialized: false,
      rolling: true,
      cookie: {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: sessionTtl,
        path: "/",
      },
    });
  }
  
  return session({
    secret: process.env.SESSION_SECRET || "darkshare-secret-key",
    resave: true,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: sessionTtl,
      path: "/",
    },
  });
}

export async function setupGoogleAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());

  console.log("Session management configured");
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.session?.userId) {
    return next();
  }
  return res.status(401).json({ error: "Not authenticated" });
};
