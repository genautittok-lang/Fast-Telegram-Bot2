import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

const RAILWAY_DOMAIN = process.env.RAILWAY_DOMAIN || "fast-telegram-bot2-production.up.railway.app";

export interface GoogleUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImageUrl: string;
  provider: "google";
}

declare module "express-session" {
  interface SessionData {
    userId?: number;
    tgId?: string;
    googleUser?: GoogleUser;
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
  app.use(passport.initialize());
  app.use(passport.session());

  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientID || !clientSecret) {
    console.warn("Google OAuth not configured - missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET");
    return;
  }

  const callbackURL = process.env.NODE_ENV === "production"
    ? `https://${RAILWAY_DOMAIN}/api/auth/google/callback`
    : "http://localhost:5000/api/auth/google/callback";

  console.log("Google OAuth callback URL:", callbackURL);

  passport.use(
    new GoogleStrategy(
      {
        clientID,
        clientSecret,
        callbackURL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const googleUser: GoogleUser = {
            id: profile.id,
            email: profile.emails?.[0]?.value || "",
            firstName: profile.name?.givenName || "",
            lastName: profile.name?.familyName || "",
            profileImageUrl: profile.photos?.[0]?.value || "",
            provider: "google",
          };
          
          done(null, googleUser);
        } catch (error) {
          done(error as Error);
        }
      }
    )
  );

  passport.serializeUser((user: any, done) => {
    done(null, user);
  });

  passport.deserializeUser((user: any, done) => {
    done(null, user);
  });

  app.get("/api/auth/google", passport.authenticate("google", {
    scope: ["profile", "email"],
  }));

  app.get("/api/auth/google/callback",
    passport.authenticate("google", {
      failureRedirect: "/login?error=google_auth_failed",
    }),
    (req, res) => {
      const user = req.user as GoogleUser;
      if (user) {
        req.session.googleUser = user;
      }
      res.redirect("/dashboard");
    }
  );

  app.get("/api/auth/me", (req, res) => {
    if (req.session?.googleUser) {
      return res.json({
        authenticated: true,
        provider: "google",
        user: req.session.googleUser,
      });
    }
    
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

  console.log("Google OAuth configured successfully");
}

export const isGoogleAuthenticated: RequestHandler = (req, res, next) => {
  if (req.session?.googleUser || req.session?.userId) {
    return next();
  }
  return res.status(401).json({ error: "Not authenticated" });
};
