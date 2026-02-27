import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { authStorage } from "./storage";

export function getSession() {
  const sessionTtl = 30 * 24 * 60 * 60 * 1000;
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET || "darkshare-secret-key",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  console.log("Google OAuth config:", clientID ? `ID starts with ${clientID.substring(0, 10)}...` : "NO ID", clientSecret ? "Secret set" : "NO SECRET");

  if (!clientID || !clientSecret) {
    console.warn("GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not set. Google login disabled.");
    return;
  }

  const replitDomain = process.env.REPLIT_DOMAINS?.split(",")[0];
  const webDomain = process.env.WEB_DOMAIN;
  const baseUrl = webDomain || (replitDomain ? `https://${replitDomain}` : "http://localhost:5000");
  const callbackURL = `${baseUrl}/api/callback`;
  console.log("Google OAuth callback URL:", callbackURL);

  passport.use(
    new GoogleStrategy(
      {
        clientID,
        clientSecret,
        callbackURL,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value || "";
          const firstName = profile.name?.givenName || profile.displayName || "";
          const lastName = profile.name?.familyName || "";
          const profileImageUrl = profile.photos?.[0]?.value || "";

          await authStorage.upsertUser({
            id: profile.id,
            email,
            firstName,
            lastName,
            profileImageUrl,
          });

          const user = {
            claims: {
              sub: profile.id,
              email,
              first_name: firstName,
              last_name: lastName,
              profile_image_url: profileImageUrl,
            },
          };

          done(null, user);
        } catch (err) {
          done(err as Error);
        }
      }
    )
  );

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    passport.authenticate("google", {
      scope: ["profile", "email"],
      prompt: "select_account",
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    console.log("Google callback received, query:", JSON.stringify(req.query));
    passport.authenticate("google", (err: any, user: any, info: any) => {
      if (err) {
        console.error("Google auth error:", err);
        return res.redirect("/login?error=auth_failed");
      }
      if (!user) {
        console.error("Google auth no user, info:", info);
        return res.redirect("/login?error=no_user");
      }
      req.logIn(user, (loginErr) => {
        if (loginErr) {
          console.error("Google login error:", loginErr);
          return res.redirect("/login?error=login_failed");
        }
        console.log("Google auth success, user:", JSON.stringify(user.claims?.email));
        return res.redirect("/dashboard");
      });
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      req.session.destroy(() => {
        res.redirect("/");
      });
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};
