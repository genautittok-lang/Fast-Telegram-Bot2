import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import crypto from "crypto";
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
    
    const isProduction = process.env.NODE_ENV === "production";
    const sessionSecret = process.env.SESSION_SECRET;
    if (!sessionSecret) {
      console.warn("WARNING: SESSION_SECRET not set. Using random secret (sessions will not persist across restarts).");
    }
    
    return session({
      secret: sessionSecret || crypto.randomBytes(32).toString("hex"),
      store: sessionStore,
      resave: true,
      saveUninitialized: false,
      rolling: true,
      cookie: {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        maxAge: sessionTtl,
        path: "/",
      },
    });
  }
  
  const isProduction = process.env.NODE_ENV === "production";
  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret) {
    console.warn("WARNING: SESSION_SECRET not set. Using random secret (sessions will not persist across restarts).");
  }
  
  return session({
    secret: sessionSecret || crypto.randomBytes(32).toString("hex"),
    resave: true,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      secure: isProduction,
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
