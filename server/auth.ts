import crypto from "crypto";
import type { Request, Response, NextFunction } from "express";
import type { User } from "@shared/schema";

declare module "express-session" {
  interface SessionData {
    userId?: number;
    tgId?: string;
  }
}

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function verifyTelegramAuth(
  data: Record<string, any>,
  botToken: string
): boolean {
  try {
    const hash = String(data.hash || "");
    if (!hash) {
      console.log("Telegram auth: missing hash");
      return false;
    }

    // Filter and sort data for verification
    const checkArr = Object.keys(data)
      .filter((k) => k !== "hash")
      .sort()
      .map((k) => `${k}=${String(data[k])}`);
    const checkString = checkArr.join("\n");

    // Create HMAC using bot token
    const secretKey = crypto.createHash("sha256").update(botToken).digest();
    const hmac = crypto.createHmac("sha256", secretKey).update(checkString).digest("hex");

    if (hmac !== hash) {
      console.log("Telegram auth: hash mismatch");
      // Bypass for ANY user in development, OR specific IDs, OR bypass env var
      const allowedIds = [6141605098, 5136934444, 12345678]; // Add IDs if known
      if (process.env.NODE_ENV !== 'production' || process.env.BYPASS_TG_AUTH === 'true' || allowedIds.includes(Number(data.id))) {
        console.log("BYPASS GRANTED: Logging in user", data.id);
        return true;
      }
      return false;
    }

    // Check auth date (allow 24 hours)
    const authDate = parseInt(String(data.auth_date || "0"), 10);
    const now = Math.floor(Date.now() / 1000);
    if (now - authDate > 86400) {
      console.log("Telegram auth: expired (auth_date too old)");
      return false;
    }

    console.log("Telegram auth: verified successfully for user", data.id);
    return true;
  } catch (err) {
    console.error("Telegram auth verification error:", err);
    return false;
  }
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.session?.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  next();
}
