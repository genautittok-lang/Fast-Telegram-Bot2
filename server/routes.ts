import express from "express";
import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { pool } from "./db";
import { setupBot, botInstance, ADMIN_IDS } from "./bot";
import { api } from "@shared/routes";
import { performCheck, validateInput, extractExifFromBuffer } from "./checkService";
import { SOURCES_COUNT } from "@shared/osintSources";
import { registerApiV1, generateApiKey } from "./apiV1";
import { registerSeoRoutes } from "./seo";
import { generateDetailedPDF, generateFindings, generateMetadata } from "./pdfGenerator";
import { verifyTelegramAuth, type AuthenticatedRequest } from "./auth";
import type { User } from "@shared/schema";
import { Markup } from "telegraf";
import { randomUUID, createHmac, timingSafeEqual } from "crypto";
import * as crypto from "crypto";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { setupGoogleAuth, isAuthenticated as isGoogleAuthenticated } from "./googleAuth";
import { registerVpnRoutes } from "./vpn";
import multer from "multer";
import path from "path";
import fs from "fs";
import { TOTP, Secret } from "otpauth";
import { promises as dnsPromises } from "dns";
import * as tls from "tls";
import * as net from "net";

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function rateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  entry.count++;
  if (entry.count > maxRequests) return true;
  return false;
}

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of Array.from(rateLimitMap.entries())) {
    if (now > entry.resetAt) rateLimitMap.delete(key);
  }
}, 5 * 60 * 1000);

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];
const CHAT_FILE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/webm", "video/quicktime"];
const SAFE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".pdf"]);
const CHAT_SAFE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".mp4", ".mov", ".avi"]);

function sanitizeFilename(original: string): string {
  const ext = original.slice(original.lastIndexOf('.')).toLowerCase();
  return `${Date.now()}-${randomUUID().slice(0, 8)}${ext}`;
}

const upload = multer({ storage: multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => cb(null, sanitizeFilename(file.originalname)),
}), limits: { fileSize: 10 * 1024 * 1024 }, fileFilter: (_req, file, cb) => {
  const ext = file.originalname.slice(file.originalname.lastIndexOf('.')).toLowerCase();
  if (ALLOWED_FILE_TYPES.includes(file.mimetype) && SAFE_EXTENSIONS.has(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only images and PDF allowed."));
  }
} });

const chatUpload = multer({ storage: multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => cb(null, `chat-${sanitizeFilename(file.originalname)}`),
}), limits: { fileSize: 25 * 1024 * 1024 }, fileFilter: (_req, file, cb) => {
  const ext = file.originalname.slice(file.originalname.lastIndexOf('.')).toLowerCase();
  if (CHAT_FILE_TYPES.includes(file.mimetype) && CHAT_SAFE_EXTENSIONS.has(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only images and videos allowed."));
  }
} });

const TIER_REQUESTS: Record<string, number> = {
  FREE: 5,
  PRO: 50,
  ENTERPRISE: 500,
  GROUPS: 500,
};

function generateVerificationId(): string {
  return `DS-${randomUUID().split('-').slice(0, 2).join('').toUpperCase()}`;
}

// Server start time for uptime calculation
const serverStartTime = Date.now();

// Simulated activity feed
const recentActivity: Array<{ type: string; target: string; riskLevel: string; timestamp: string }> = [];

export function addActivity(type: string, target: string, riskLevel: string) {
  const maskTarget = (t: string): string => {
    const len = t.length;
    if (len <= 4) return '***' + t[0] + '***';
    const start = Math.floor(len / 4);
    const mid = t.substring(start, start + Math.min(6, Math.ceil(len / 2)));
    return '***' + mid + '***';
  };
  
  recentActivity.unshift({
    type,
    target: maskTarget(target),
    riskLevel,
    timestamp: new Date().toISOString(),
  });
  if (recentActivity.length > 50) recentActivity.pop();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.use("/uploads", (_req, res, next) => {
    res.setHeader("X-Robots-Tag", "noindex, nofollow");
    res.setHeader("Cache-Control", "private, max-age=3600");
    next();
  }, express.static(uploadsDir, { dotfiles: "deny", index: false }));

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok", service: "DARKSHARE", timestamp: Date.now() });
  });

  // Setup Google Auth - MUST be before other routes
  await setupAuth(app);
  registerAuthRoutes(app);
  
  // Bridge: when Replit Auth user accesses the app, link to ds_users
  app.use(async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const passportUser = (req as any).user;
      if (passportUser?.claims?.sub && !req.session?.userId) {
        const claims = passportUser.claims;
        const email = claims.email || claims.sub;
        const firstName = claims.first_name || claims.given_name || '';
        const lastName = claims.last_name || claims.family_name || '';
        let username = '';
        if (firstName) {
          username = lastName ? `${firstName} ${lastName}` : firstName;
        } else if (email && email.includes('@')) {
          username = email.split('@')[0];
        } else {
          username = 'Agent_' + Math.random().toString(36).substring(2, 8).toUpperCase();
        }
        const photoUrl = claims.profile_image_url || '';
        
        let dsUser = await storage.getUserByTgId(`replit:${claims.sub}`);
        if (!dsUser) {
          dsUser = await storage.createUser({
            tgId: `replit:${claims.sub}`,
            username,
            photoUrl: photoUrl || null,
            lang: "uk",
            tier: "FREE",
            requestsLeft: 5,
            streakDays: 1,
            refCode: `DARK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          });
          storage.logActivity({ eventType: "registration", userId: dsUser.id, username: dsUser.username || null, details: `New user registered via Google/Replit`, meta: { provider: "replit" } }).catch(() => {});
          if (email) {
            import("./emailService").then(({ sendWelcomeEmail }) => {
              sendWelcomeEmail(email, username || "друг").catch(() => {});
            }).catch(() => {});
          }
        } else {
          const updates: any = {};
          if (photoUrl && !dsUser.photoUrl) updates.photoUrl = photoUrl;
          if (firstName && dsUser.username?.startsWith('Dark') && /^Dark\d+$/.test(dsUser.username)) {
            updates.username = username;
          }
          if (Object.keys(updates).length > 0) {
            await storage.updateUser(dsUser.id, updates);
            dsUser = { ...dsUser, ...updates };
          }
          await storage.updateUserLogin(dsUser!.id);
          storage.logActivity({ eventType: "login", userId: dsUser!.id, username: dsUser!.username || null, details: `User logged in via Google/Replit` }).catch(() => {});
        }
        
        req.session.userId = dsUser!.id;
        req.session.tgId = dsUser!.tgId;
        (req.session as any).provider = 'replit';
        (req.session as any).email = email;
        req.session.save((err) => { if (err) console.error("Session save error:", err); });
      }
    } catch (e) {
      console.error("Auth bridge error:", e);
    }
    next();
  });
  
  app.get("/", (req, res, next) => {
    // If it's an API call or accepts HTML, let it through to frontend
    if (req.accepts("html")) {
      next();
    } else {
      res.status(200).json({ status: "ok", service: "DARKSHARE API" });
    }
  });

  // API Routes for the landing page
  let statsCache: { data: any; ts: number } | null = null;
  const STATS_CACHE_MS = 15000;
  
  app.get(api.stats.get.path, async (req, res) => {
    try {
      const now = Date.now();
      if (statsCache && now - statsCache.ts < STATS_CACHE_MS) {
        return res.json(statsCache.data);
      }
      
      const [realUsers, realReports, realWatches, realToday, realThreats] = await Promise.all([
        storage.getUsersCount(),
        storage.getReportsCount(),
        storage.getWatchesCount(),
        storage.getReportsCountToday(),
        storage.getHighRiskReportsCount(),
      ]);
      
      const data = {
        totalUsers: Number(realUsers) || 0,
        activeWatches: Number(realWatches) || 0,
        totalReports: Number(realReports) || 0,
        checksToday: Number(realToday) || 0,
        threatsBlocked: Number(realThreats) || 0,
        uptime: 99.9,
      };
      statsCache = { data, ts: now };
      res.json(data);
    } catch (error) {
      console.error("Stats error:", error);
      res.json({
        totalUsers: 0,
        activeWatches: 0,
        totalReports: 0,
        checksToday: 0,
        threatsBlocked: 0,
        uptime: 99.9,
      });
    }
  });

  // Activity feed endpoint
  app.get(api.activity.get.path, async (req, res) => {
    // Return recent activity or generate sample data
    if (recentActivity.length === 0) {
      const sampleTypes = ['wallet', 'ip', 'email', 'domain', 'url', 'phone'];
      const sampleRisks = ['low', 'medium', 'high'];
      for (let i = 0; i < 10; i++) {
        recentActivity.push({
          type: sampleTypes[Math.floor(Math.random() * sampleTypes.length)],
          target: `***${Math.random().toString(36).substring(2, 8)}***`,
          riskLevel: sampleRisks[Math.floor(Math.random() * sampleRisks.length)],
          timestamp: new Date(Date.now() - i * 60000 * Math.random() * 10).toISOString(),
        });
      }
    }
    res.json(recentActivity.slice(0, 10));
  });

  // Threat feed cache
  let threatFeedCache: Array<{
    id: string;
    title: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    type: 'cve' | 'malware' | 'phishing' | 'botnet' | 'ransomware' | 'apt';
    source: string;
    timestamp: string;
    description?: string;
    cveId?: string;
  }> = [];
  let threatFeedLastUpdate = 0;

  // Threat feed endpoint
  app.get(api.threatFeed.get.path, async (req, res) => {
    const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
    const now = Date.now();

    if (threatFeedCache.length === 0 || now - threatFeedLastUpdate > CACHE_TTL) {
      try {
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        const pubStartDate = oneYearAgo.toISOString().split('.')[0] + '.000';
        const nvdResponse = await fetch(
          `https://services.nvd.nist.gov/rest/json/cves/2.0?resultsPerPage=8&pubStartDate=${pubStartDate}`,
          {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'DARKSHARE-ThreatFeed/1.0'
            }
          }
        );

        if (nvdResponse.ok) {
          const nvdData = await nvdResponse.json();
          const cves = nvdData.vulnerabilities || [];
          
          threatFeedCache = cves.slice(0, 8).map((vuln: any, idx: number) => {
            const cve = vuln.cve || {};
            const metrics = cve.metrics?.cvssMetricV31?.[0]?.cvssData || 
                           cve.metrics?.cvssMetricV30?.[0]?.cvssData ||
                           cve.metrics?.cvssMetricV2?.[0]?.cvssData;
            const baseScore = metrics?.baseScore || 5;
            
            let severity: 'critical' | 'high' | 'medium' | 'low' = 'medium';
            if (baseScore >= 9) severity = 'critical';
            else if (baseScore >= 7) severity = 'high';
            else if (baseScore >= 4) severity = 'medium';
            else severity = 'low';

            const description = cve.descriptions?.find((d: any) => d.lang === 'en')?.value || 
                               cve.descriptions?.[0]?.value || 
                               'No description available';

            return {
              id: `cve-${idx}-${Date.now()}`,
              title: cve.id || `CVE-${Date.now()}`,
              severity,
              type: 'cve' as const,
              source: 'NVD NIST',
              timestamp: cve.published || new Date().toISOString(),
              description: description.substring(0, 200) + (description.length > 200 ? '...' : ''),
              cveId: cve.id,
            };
          });
        }
      } catch (error) {
        console.error('Failed to fetch CVE data from NVD:', error);
      }

      // Add supplementary threat types if CVE fetch failed or for variety
      if (threatFeedCache.length < 6) {
        const supplementaryThreats = [
          {
            id: `threat-${Date.now()}-1`,
            title: 'LockBit 3.0 Ransomware Campaign',
            severity: 'critical' as const,
            type: 'ransomware' as const,
            source: 'CISA Alert',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            description: 'Active ransomware campaign targeting critical infrastructure sectors.',
          },
          {
            id: `threat-${Date.now()}-2`,
            title: 'Emotet Botnet Resurgence',
            severity: 'high' as const,
            type: 'botnet' as const,
            source: 'Abuse.ch',
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            description: 'New Emotet variant detected with enhanced evasion capabilities.',
          },
          {
            id: `threat-${Date.now()}-3`,
            title: 'APT29 Phishing Campaign',
            severity: 'high' as const,
            type: 'apt' as const,
            source: 'Mandiant',
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
            description: 'State-sponsored threat actor targeting government entities.',
          },
          {
            id: `threat-${Date.now()}-4`,
            title: 'Credential Phishing Kit Detected',
            severity: 'medium' as const,
            type: 'phishing' as const,
            source: 'URLScan.io',
            timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
            description: 'New phishing kit mimicking major financial institutions.',
          },
          {
            id: `threat-${Date.now()}-5`,
            title: 'Mirai Botnet Variant',
            severity: 'medium' as const,
            type: 'botnet' as const,
            source: 'Shodan',
            timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
            description: 'IoT-targeting botnet exploiting unpatched devices.',
          },
          {
            id: `threat-${Date.now()}-6`,
            title: 'RedLine Stealer Malware',
            severity: 'high' as const,
            type: 'malware' as const,
            source: 'MalwareBazaar',
            timestamp: new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString(),
            description: 'Information stealer targeting credentials and crypto wallets.',
          },
        ];

        threatFeedCache = [...threatFeedCache, ...supplementaryThreats].slice(0, 12);
      }

      threatFeedLastUpdate = now;
    }

    res.json(threatFeedCache);
  });

  // Leaderboard endpoint - real data from database
  app.get(api.leaderboard.get.path, async (req, res) => {
    try {
      const topUsers = await storage.getTopUsers(5);
      const leaderboard = topUsers.map(u => ({
        username: u.username ? u.username.substring(0, 12) : 'User' + u.id,
        checks: u.checksCount || 0,
        streakDays: u.streakDays || 0,
      }));

      const fakeLeaders = [
        { username: "CyberHunter", checks: 342, streakDays: 45 },
        { username: "ShadowSec", checks: 287, streakDays: 38 },
        { username: "NetWatcher", checks: 231, streakDays: 29 },
        { username: "ThreatEye", checks: 198, streakDays: 22 },
        { username: "BlockGuard", checks: 156, streakDays: 17 },
      ];

      const merged = [...leaderboard];
      for (const fake of fakeLeaders) {
        if (merged.length < 5 && !merged.find(m => m.username === fake.username)) {
          merged.push(fake);
        }
      }
      merged.sort((a, b) => Number(b.checks) - Number(a.checks));

      res.json(merged.slice(0, 5));
    } catch (error) {
      console.error("Leaderboard error:", error);
      res.json([
        { username: "CyberHunter", checks: 342, streakDays: 45 },
        { username: "ShadowSec", checks: 287, streakDays: 38 },
        { username: "NetWatcher", checks: 231, streakDays: 29 },
        { username: "ThreatEye", checks: 198, streakDays: 22 },
        { username: "BlockGuard", checks: 156, streakDays: 17 },
      ]);
    }
  });

  // Auth middleware to load user
  const loadUser = async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    if (req.session?.userId) {
      const user = await storage.getUserById(req.session.userId);
      if (user) {
        if (user.blocked && !ADMIN_IDS.includes(user.tgId)) {
          return res.status(403).json({ error: "Account is blocked" });
        }
        authReq.user = user;
      }
    }
    next();
  };

  // Require auth middleware
  const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    if (!req.session?.userId || !authReq.user) {
      return res.status(401).json({ error: "Unauthorized. Please login with Telegram." });
    }
    next();
  };

  // VPN routes (Phase 6 — own WireGuard infrastructure)
  registerVpnRoutes(app, loadUser, requireAuth);
  registerApiV1(app);
  registerSeoRoutes(app);

  // Auto-seed demo VPN servers on first run so the /vpn flow has stock to show.
  // Endpoints/keys are placeholders — replace via /admin VPN panel when real boxes come online.
  // Awaited (not fire-and-forget) so /api/vpn/servers never returns empty after restart.
  try {
    const existingServers = await storage.listVpnServers(true);
    if (existingServers.length === 0) {
      const demoServers = [
        { region: "Frankfurt",  countryCode: "DE", flag: "🇩🇪", hostname: "de1.vpn.darkshare.store", publicEndpoint: "vpn-de1.darkshare.store",  serverPublicKey: "DE1xQwertyAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAa0=" },
        { region: "Amsterdam",  countryCode: "NL", flag: "🇳🇱", hostname: "nl1.vpn.darkshare.store", publicEndpoint: "vpn-nl1.darkshare.store",  serverPublicKey: "NL1xQwertyBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBb0=" },
        { region: "Stockholm",  countryCode: "SE", flag: "🇸🇪", hostname: "se1.vpn.darkshare.store", publicEndpoint: "vpn-se1.darkshare.store",  serverPublicKey: "SE1xQwertyCcCcCcCcCcCcCcCcCcCcCcCcCcCcCcCc0=" },
        { region: "Singapore",  countryCode: "SG", flag: "🇸🇬", hostname: "sg1.vpn.darkshare.store", publicEndpoint: "vpn-sg1.darkshare.store",  serverPublicKey: "SG1xQwertyDdDdDdDdDdDdDdDdDdDdDdDdDdDdDdDd0=" },
        { region: "Tokyo",      countryCode: "JP", flag: "🇯🇵", hostname: "jp1.vpn.darkshare.store", publicEndpoint: "vpn-jp1.darkshare.store",  serverPublicKey: "JP1xQwertyEeEeEeEeEeEeEeEeEeEeEeEeEeEeEeEe0=" },
        { region: "New York",   countryCode: "US", flag: "🇺🇸", hostname: "us1.vpn.darkshare.store", publicEndpoint: "vpn-us1.darkshare.store",  serverPublicKey: "US1xQwertyFfFfFfFfFfFfFfFfFfFfFfFfFfFfFfFf0=" },
      ];
      for (const s of demoServers) {
        await storage.createVpnServer({ ...s, port: 51820, capacity: 100, status: "active", isPremium: false });
      }
      console.log(`[VPN] Seeded ${demoServers.length} demo servers`);
    }
  } catch (e: any) {
    console.warn("[VPN] Server seed skipped:", e?.message || e);
  }

  app.get(api.users.get.path, loadUser, requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const requestedTgId = req.params.tgId;
    if (authReq.user!.tgId !== requestedTgId && !ADMIN_IDS.includes(authReq.user!.tgId)) {
      return res.status(403).json({ message: "Access denied" });
    }
    const user = await storage.getUserByTgId(requestedTgId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const { ...safeUser } = user;
    delete (safeUser as any).cardToken;
    res.json(safeUser);
  });

  // Telegram Login endpoint
  app.post("/api/auth/telegram", async (req, res) => {
    const ip = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "unknown";
    if (rateLimit("login:" + ip, 10, 60000)) return res.status(429).json({ error: "Too many login attempts. Try again later." });

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return res.status(500).json({ error: "Bot not configured" });
    }

    const telegramData = req.body;
    
    if (!verifyTelegramAuth(telegramData, botToken)) {
      return res.status(401).json({ error: "Invalid Telegram authentication" });
    }

    const tgId = telegramData.id?.toString();
    const username = telegramData.username || telegramData.first_name || "user";
    const firstName = telegramData.first_name || "";
    const photoUrl = telegramData.photo_url || "";

    if (!tgId) {
      return res.status(400).json({ error: "Missing Telegram ID" });
    }

    let user;
    try {
      user = await storage.getUserByTgId(tgId);
      
      if (user && user.blocked && !ADMIN_IDS.includes(tgId)) {
        return res.status(403).json({ error: "Account is blocked. Contact support." });
      }

      if (!user) {
        user = await storage.createUser({
          tgId,
          username,
          photoUrl: photoUrl || null,
          lang: "UA",
          tier: "FREE",
          requestsLeft: 5,
          streakDays: 1,
          refCode: `DARK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        });
        storage.logActivity({ eventType: "registration", userId: user.id, username: user.username || null, details: `New user registered via Telegram`, meta: { provider: "telegram" } }).catch(() => {});
      } else {
        await storage.updateUserLogin(user.id);
        storage.logActivity({ eventType: "login", userId: user.id, username: user.username || null, details: `User logged in via Telegram` }).catch(() => {});
        const updates: any = {};
        if (user.username !== username && username !== "user") updates.username = username;
        if (photoUrl && user.photoUrl !== photoUrl) updates.photoUrl = photoUrl;
        if (Object.keys(updates).length > 0) {
          await storage.updateUser(user.id, updates);
          user = { ...user, ...updates };
        }
      }
    } catch (dbError: any) {
      console.error("Database error during auth:", dbError.message);
      return res.status(500).json({ error: "Database not ready. Please try again in a moment." });
    }

    const finalUser = user;
    
    const previousTgId = req.session?.tgId;
    const previousUserId = req.session?.userId;
    
    const finishLogin = () => {
      if (finalUser.totpEnabled) {
        req.session.pendingTwoFactorUserId = finalUser.id;
        req.session.save((err) => {
          if (err) {
            console.error("Session save error:", err);
            if (!res.headersSent) {
              return res.status(500).json({ error: "Session save error" });
            }
            return;
          }
          res.json({ requiresTwoFactor: true });
        });
        return;
      }

      req.session.userId = finalUser.id;
      req.session.tgId = tgId;
      (req.session as any).userAgent = req.headers["user-agent"] || "Unknown";
      (req.session as any).ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "Unknown";
      (req.session as any).loginTime = new Date().toISOString();
      
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          if (!res.headersSent) {
            return res.status(500).json({ error: "Session save error" });
          }
          return;
        }
        res.json({
          id: finalUser.id,
          tgId: finalUser.tgId,
          username: finalUser.username,
          tier: finalUser.tier,
          requestsLeft: finalUser.requestsLeft,
          streakDays: finalUser.streakDays,
          refCode: finalUser.refCode,
          firstName,
          photoUrl,
        });
      });
    };
    
    if (previousTgId && previousTgId !== tgId) {
      console.log(`Session switch: ${previousTgId} -> ${tgId} (user ${previousUserId} -> ${finalUser.id})`);
      req.session.regenerate((err) => {
        if (err) {
          console.error("Session regenerate error:", err);
        }
        finishLogin();
      });
    } else {
      finishLogin();
    }
  });

  // Get current user
  app.get("/api/auth/me", loadUser, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const isReplitUser = authReq.user.tgId?.startsWith('replit:');
    res.json({
      authenticated: true,
      id: authReq.user.id,
      tgId: authReq.user.tgId,
      username: authReq.user.username,
      photoUrl: authReq.user.photoUrl || "",
      tier: authReq.user.tier,
      requestsLeft: authReq.user.requestsLeft,
      streakDays: authReq.user.streakDays,
      refCode: authReq.user.refCode,
      lang: authReq.user.lang,
      createdAt: authReq.user.createdAt,
      notifsOn: authReq.user.notifsOn,
      digestsOn: authReq.user.digestsOn,
      lastLogin: authReq.user.lastLogin,
      totpEnabled: authReq.user.totpEnabled || false,
      provider: isReplitUser ? "google" : "telegram",
      email: (req.session as any)?.email || null,
      subscriptionExpiresAt: authReq.user.subscriptionExpiresAt || null,
      autoRenew: authReq.user.autoRenew || false,
      companyName: (authReq.user as any).companyName || null,
      companyLogoUrl: (authReq.user as any).companyLogoUrl || null,
      brandColor: (authReq.user as any).brandColor || null,
      slackWebhookUrl: (authReq.user as any).slackWebhookUrl || null,
      teamsWebhookUrl: (authReq.user as any).teamsWebhookUrl || null,
      payoutAddress: (authReq.user as any).payoutAddress || null,
      payoutCurrency: (authReq.user as any).payoutCurrency || null,
    });
  });

  app.patch("/api/user/settings", loadUser, requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    try {
      const user = authReq.user!;
      const fieldValidators: Record<string, (v: any) => boolean> = {
        notifsOn: (v) => typeof v === "boolean",
        digestsOn: (v) => typeof v === "boolean",
        lang: (v) => typeof v === "string" && ["uk", "en", "ru"].includes(v),
      };
      const updates: Record<string, any> = {};
      for (const [field, validate] of Object.entries(fieldValidators)) {
        if (req.body[field] !== undefined) {
          if (!validate(req.body[field])) {
            return res.status(400).json({ error: `Invalid value for ${field}` });
          }
          updates[field] = req.body[field];
        }
      }
      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: "No valid fields to update" });
      }
      const updatedUser = await storage.updateUser(user.id, updates);
      res.json({ success: true, user: updatedUser });
    } catch (error) {
      console.error("Settings update error:", error);
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  app.get("/api/user/sessions", loadUser, requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    try {
      const user = authReq.user!;
      const sessions: any[] = [];

      if (pool) {
        const result = await pool.query(
          `SELECT sid, sess, expire FROM "session" WHERE expire > NOW()`
        );
        for (const row of result.rows) {
          try {
            const sessData = typeof row.sess === "string" ? JSON.parse(row.sess) : row.sess;
            const userId = sessData?.passport?.user || sessData?.userId;
            if (userId && String(userId) === String(user.id)) {
              const ua = sessData?.userAgent || "Unknown";
              const ip = sessData?.ip || "Unknown";
              const device = /Mobile|Android|iPhone/i.test(ua) ? "Mobile" : "Desktop";
              const browser = ua.match(/(Chrome|Firefox|Safari|Edge|Opera)/i)?.[1] || "Unknown";
              const ipStr = typeof ip === "string" ? ip : String(ip);
              const maskedIp = ipStr.match(/^(::1|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|0\.0\.0)/) ? "Internal" : ipStr;
              sessions.push({
                id: row.sid,
                current: row.sid === req.sessionID,
                device: `${device} - ${browser}`,
                ip: maskedIp,
                lastActive: row.expire ? new Date(row.expire).toISOString() : new Date().toISOString(),
                loginTime: sessData?.loginTime || new Date().toISOString(),
              });
            }
          } catch {}
        }
      }

      if (sessions.length === 0) {
        const ua = req.headers["user-agent"] || "Unknown";
        const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "Unknown";
        const device = /Mobile|Android|iPhone/i.test(ua) ? "Mobile" : "Desktop";
        const browser = ua.match(/(Chrome|Firefox|Safari|Edge|Opera)/i)?.[1] || "Unknown";
        const rawIp = typeof ip === "string" ? ip : ip[0];
        const safeIp = rawIp.match(/^(::1|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|0\.0\.0)/) ? "Internal" : rawIp;
        sessions.push({
          id: req.sessionID,
          current: true,
          device: `${device} - ${browser}`,
          ip: safeIp,
          lastActive: new Date().toISOString(),
          loginTime: user.lastLogin?.toISOString() || new Date().toISOString(),
        });
      }

      res.json(sessions);
    } catch (error) {
      console.error("Sessions error:", error);
      res.status(500).json({ error: "Failed to get sessions" });
    }
  });

  app.get("/api/user/api-key", loadUser, requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    try {
      const user = authReq.user!;
      const tier = (user.tier || "FREE").toUpperCase();
      if (tier !== "PRO" && tier !== "ENTERPRISE") {
        return res.status(403).json({ error: "API key available only for PRO/ENTERPRISE users" });
      }
      const fullKey = generateApiKey(user.id, user.tgId);
      const masked = fullKey.slice(0, 8) + "\u2022".repeat(8) + fullKey.slice(-4);
      res.json({ key: fullKey, masked });
    } catch (error) {
      console.error("API key error:", error);
      res.status(500).json({ error: "Failed to get API key" });
    }
  });

  app.post("/api/user/api-key", loadUser, requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    try {
      const user = authReq.user!;
      const tier = (user.tier || "FREE").toUpperCase();
      if (tier !== "PRO" && tier !== "ENTERPRISE") {
        return res.status(403).json({ error: "API key available only for PRO/ENTERPRISE users" });
      }
      const salt = req.body.regenerate ? Date.now().toString() : "";
      const fullKey = generateApiKey(user.id, user.tgId, salt);
      const masked = fullKey.slice(0, 8) + "\u2022".repeat(8) + fullKey.slice(-4);
      res.json({ key: fullKey, masked });
    } catch (error) {
      console.error("API key generation error:", error);
      res.status(500).json({ error: "Failed to generate API key" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.clearCookie("connect.sid", { path: "/" });
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/logout", (req, res) => {
    if (req.method !== "GET") return res.status(405).end();
    req.session.destroy((err) => {
      res.clearCookie("connect.sid", { path: "/" });
      res.redirect("/");
    });
  });

  app.post("/api/2fa/setup", loadUser, requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    try {
      const user = authReq.user!;
      const secret = new Secret();
      const totp = new TOTP({
        issuer: "DARKSHARE",
        label: user.username || "user",
        algorithm: "SHA1",
        digits: 6,
        period: 30,
        secret,
      });
      await storage.updateUser(user.id, { totpSecret: secret.base32 } as any);
      res.json({ uri: totp.toString(), secret: secret.base32 });
    } catch (error) {
      console.error("2FA setup error:", error);
      res.status(500).json({ error: "Failed to setup 2FA" });
    }
  });

  app.post("/api/2fa/verify", loadUser, requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    if (rateLimit(`2fa:${authReq.user?.id || "anon"}`, 5, 60000)) {
      return res.status(429).json({ error: "Too many 2FA attempts. Please wait 1 minute." });
    }
    try {
      const user = authReq.user!;
      const { token } = req.body;
      if (!user.totpSecret) {
        return res.status(400).json({ error: "2FA not set up" });
      }
      const totp = new TOTP({
        issuer: "DARKSHARE",
        label: user.username || "user",
        algorithm: "SHA1",
        digits: 6,
        period: 30,
        secret: Secret.fromBase32(user.totpSecret),
      });
      const result = totp.validate({ token, window: 1 });
      if (result === null) {
        return res.status(400).json({ error: "Invalid token" });
      }
      await storage.updateUser(user.id, { totpEnabled: true } as any);
      res.json({ success: true });
    } catch (error) {
      console.error("2FA verify error:", error);
      res.status(500).json({ error: "Failed to verify 2FA" });
    }
  });

  app.post("/api/2fa/disable", loadUser, requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    try {
      const user = authReq.user!;
      const { token } = req.body;
      if (!user.totpSecret) {
        return res.status(400).json({ error: "2FA not set up" });
      }
      const totp = new TOTP({
        issuer: "DARKSHARE",
        label: user.username || "user",
        algorithm: "SHA1",
        digits: 6,
        period: 30,
        secret: Secret.fromBase32(user.totpSecret),
      });
      const result = totp.validate({ token, window: 1 });
      if (result === null) {
        return res.status(400).json({ error: "Invalid token" });
      }
      await storage.updateUser(user.id, { totpEnabled: false, totpSecret: null } as any);
      res.json({ success: true });
    } catch (error) {
      console.error("2FA disable error:", error);
      res.status(500).json({ error: "Failed to disable 2FA" });
    }
  });

  app.post("/api/2fa/login-verify", async (req, res) => {
    try {
      const { token } = req.body;
      const pendingUserId = req.session?.pendingTwoFactorUserId;
      if (!pendingUserId) {
        return res.status(400).json({ error: "No pending 2FA login" });
      }
      const user = await storage.getUserById(pendingUserId);
      if (!user || !user.totpSecret) {
        return res.status(400).json({ error: "User not found or 2FA not configured" });
      }
      const totp = new TOTP({
        issuer: "DARKSHARE",
        label: user.username || "user",
        algorithm: "SHA1",
        digits: 6,
        period: 30,
        secret: Secret.fromBase32(user.totpSecret),
      });
      const result = totp.validate({ token, window: 1 });
      if (result === null) {
        return res.status(400).json({ error: "Invalid token" });
      }
      req.session.userId = user.id;
      req.session.tgId = user.tgId;
      delete req.session.pendingTwoFactorUserId;
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ error: "Session save error" });
        }
        res.json({
          id: user.id,
          tgId: user.tgId,
          username: user.username,
          tier: user.tier,
          requestsLeft: user.requestsLeft,
          streakDays: user.streakDays,
          refCode: user.refCode,
        });
      });
    } catch (error) {
      console.error("2FA login-verify error:", error);
      res.status(500).json({ error: "Failed to verify 2FA login" });
    }
  });

  app.get("/api/2fa/status", loadUser, requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const user = authReq.user!;
    res.json({ enabled: user.totpEnabled || false });
  });

  // Referrals endpoint (requires auth)
  app.get("/api/referrals", loadUser, requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    try {
      const user = authReq.user!;
      const referralData = await storage.getReferralStats(user.id);
      
      res.json({
        referralCode: user.refCode || `DARK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        referralCount: referralData.count,
        totalEarned: referralData.count * 2,
        pendingBonus: referralData.pendingCount * 2,
        referredUsers: referralData.referredUsers.map(r => ({
          id: r.id,
          username: r.username || "user",
          tier: r.tier || "FREE",
          joinedAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
          paid: r.paid,
        })),
      });
    } catch (err: any) {
      console.error("Error fetching referral stats:", err);
      res.status(500).json({ error: "Failed to fetch referral stats" });
    }
  });

  // Public referral leaderboard (top 10 of the month + all-time)
  app.get("/api/referrals/leaderboard", async (req, res) => {
    try {
      const period = (req.query.period === "all" ? "all" : "month") as "month" | "all";
      const limit = Math.min(parseInt(String(req.query.limit || "10")) || 10, 50);
      const top = await storage.getReferralLeaderboard(period, limit);
      const masked = top.map((r) => ({
        rank: r.rank,
        username: r.username ? `${r.username.slice(0, 2)}***${r.username.length > 4 ? r.username.slice(-1) : ""}` : `anonymous-${r.rank}`,
        tier: r.tier || "FREE",
        count: r.count,
      }));
      res.set("Cache-Control", "public, max-age=120");
      res.json({ period, items: masked });
    } catch (err: any) {
      console.error("leaderboard error:", err);
      res.json({ period: "month", items: [] });
    }
  });

  // Save user white-label / payout / webhook settings
  app.patch("/api/account/branding", loadUser, requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const user = authReq.user!;
    const tier = String(user.tier || "FREE").toUpperCase();
    const allowed = tier === "ENTERPRISE" || tier === "GROUPS";
    const body = req.body || {};
    const updates: any = {};
    if (typeof body.payoutAddress === "string") updates.payoutAddress = body.payoutAddress.trim().slice(0, 200) || null;
    if (typeof body.payoutCurrency === "string") updates.payoutCurrency = body.payoutCurrency.trim().slice(0, 16) || null;
    if (typeof body.slackWebhookUrl === "string") {
      const v = body.slackWebhookUrl.trim();
      if (v && !/^https:\/\/hooks\.slack\.com\//.test(v)) return res.status(400).json({ error: "Invalid Slack webhook URL" });
      updates.slackWebhookUrl = v || null;
    }
    if (typeof body.teamsWebhookUrl === "string") {
      const v = body.teamsWebhookUrl.trim();
      if (v && !/^https:\/\/[\w.-]+\.webhook\.office\.com\//.test(v)) return res.status(400).json({ error: "Invalid Teams webhook URL" });
      updates.teamsWebhookUrl = v || null;
    }
    if (allowed) {
      if (typeof body.companyName === "string") updates.companyName = body.companyName.trim().slice(0, 120) || null;
      if (typeof body.companyLogoUrl === "string") {
        const v = body.companyLogoUrl.trim();
        if (v && !/^https:\/\//.test(v)) return res.status(400).json({ error: "Logo URL must be HTTPS" });
        updates.companyLogoUrl = v || null;
      }
      if (typeof body.brandColor === "string") {
        const v = body.brandColor.trim();
        if (v && !/^#[0-9A-Fa-f]{6}$/.test(v)) return res.status(400).json({ error: "brandColor must be #RRGGBB" });
        updates.brandColor = v || null;
      }
    }
    if (Object.keys(updates).length === 0) return res.json({ ok: true });
    await storage.updateUser(user.id, updates);
    res.json({ ok: true, whiteLabelEnabled: allowed });
  });

  // Web check endpoint (requires auth)
  app.post(api.check.perform.path, loadUser, requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    if (rateLimit("check:" + authReq.user!.id, 30, 60000)) return res.status(429).json({ error: "Too many requests. Please slow down." });

    const { type, value } = req.body;
    
    if (!type || !value) {
      return res.status(400).json({ error: "Type and value are required" });
    }

    const validation = validateInput(type, value);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    // Check daily limits per tier
    const user = authReq.user!;
    const userTier = (user.tier || "FREE").toUpperCase();
    
    const DAILY_LIMITS: Record<string, number> = {
      FREE: 5,
      PRO: 50,
      ENTERPRISE: Infinity,
      GROUPS: Infinity,
    };
    
    const dailyLimit = DAILY_LIMITS[userTier] || 5;
    
    if (dailyLimit !== Infinity) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const userReports = await storage.getReports(user.id);
      const todayChecks = userReports.filter(r => r.generatedAt && new Date(r.generatedAt) >= today).length;
      
      if (todayChecks >= dailyLimit) {
        return res.status(429).json({ 
          error: `Daily check limit reached (${todayChecks}/${dailyLimit}). Upgrade your plan for more checks.`,
          limit: dailyLimit,
          used: todayChecks,
        });
      }
    }

    if (userTier !== "ENTERPRISE" && userTier !== "GROUPS" && (user.requestsLeft || 0) > 0) {
      await storage.updateUser(user.id, { requestsLeft: Math.max(0, (user.requestsLeft || 0) - 1) });
    }

    try {
      const result = await performCheck(type, value);
      
      addActivity(type, value, result.riskLevel);
      storage.logActivity({ eventType: "check", userId: authReq.user!.id, username: authReq.user!.username || null, details: `Check: ${type}`, meta: { type, riskLevel: result.riskLevel, riskScore: result.riskScore } }).catch(() => {});

      if (authReq.user!.pendingRefCode) {
        try {
          const referrer = await storage.getUserByRefCode(authReq.user!.pendingRefCode);
          if (referrer && referrer.id !== authReq.user!.id) {
            await storage.createReferral({ referrerId: referrer.id, referredId: authReq.user!.id, bonus: 5 });
            await storage.updateUser(authReq.user!.id, { requestsLeft: (authReq.user!.requestsLeft || 3) + 5, pendingRefCode: null });
            await storage.updateUser(referrer.id, { requestsLeft: (referrer.requestsLeft || 3) + 2 });
          } else {
            await storage.updateUser(authReq.user!.id, { pendingRefCode: null });
          }
        } catch (e) {
          await storage.updateUser(authReq.user!.id, { pendingRefCode: null }).catch(() => {});
        }
      }

      const verificationId = generateVerificationId();

      await storage.createReport({
        userId: authReq.user!.id,
        objectType: type,
        verificationId,
        dataJson: {
          target: value,
          riskScore: result.riskScore,
          riskLevel: result.riskLevel,
          findings: result.findings,
          details: result.details,
          sources: result.sources,
          summary: result.summary,
        },
      });

      res.json({
        ...result,
        timestamp: result.timestamp.toISOString(),
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post("/api/exif", loadUser, requireAuth, upload.single("photo"), async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const user = authReq.user!;
    const userTier = (user.tier || "FREE").toUpperCase();

    if (userTier === "FREE") {
      return res.status(403).json({ error: "EXIF analysis requires PRO tier or higher" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    if ((user.requestsLeft || 0) <= 0 && userTier !== "ENTERPRISE" && userTier !== "GROUPS") {
      return res.status(403).json({ error: "No requests left" });
    }

    try {
      const buffer = await fs.promises.readFile(req.file.path);
      const result = await extractExifFromBuffer(buffer, req.file.originalname || "photo.jpg");

      if (userTier !== "ENTERPRISE" && userTier !== "GROUPS") {
        await storage.updateUser(user.id, { requestsLeft: Math.max(0, (user.requestsLeft || 0) - 1) });
      }

      await storage.createReport({
        userId: user.id,
        objectType: "exif",
        dataJson: {
          target: req.file.originalname,
          riskScore: result.riskScore,
          riskLevel: result.riskLevel,
          findings: result.findings,
          details: result.details,
          sources: result.sources,
          summary: result.summary,
        },
      });

      fs.unlinkSync(req.file.path);

      res.json({
        type: "exif",
        target: req.file.originalname,
        riskScore: result.riskScore,
        riskLevel: result.riskLevel,
        findings: result.findings,
        details: result.details,
        sources: result.sources,
        summary: result.summary,
        aiInsights: result.aiInsights,
      });
    } catch (err: any) {
      if (req.file?.path) fs.unlinkSync(req.file.path);
      res.status(400).json({ error: err.message });
    }
  });

  app.get("/api/geosint", (_req, res) => {
    const regions = [
      { id: "europe_west", emoji: "🇪🇺", name: { en: "Western Europe", uk: "Західна Європа", ru: "Западная Европа" }, tips: {
        en: ["White license plates with blue EU strip", "Red/brown tile roofs — Germany, Netherlands", "Circular road signs with red border", "Half-timbered houses — Germany, France", "Yellow mailboxes — France, Germany", "Plane trees along roads — France"],
        uk: ["Білі номерні знаки з синьою смугою ЄС", "Червоно-коричневі черепичні дахи — Німеччина, Нідерланди", "Круглі дорожні знаки з червоною рамкою", "Фахверкові будинки — Німеччина, Франція", "Жовті поштові скриньки — Франція, Німеччина", "Платани вздовж доріг — Франція"],
        ru: ["Белые номерные знаки с синей полосой ЕС", "Красно-коричневые черепичные крыши — Германия, Нидерланды", "Круглые дорожные знаки с красной рамкой", "Фахверковые дома — Германия, Франция", "Жёлтые почтовые ящики — Франция, Германия", "Платаны вдоль дорог — Франция"],
      }},
      { id: "europe_east", emoji: "🇺🇦", name: { en: "Eastern Europe / CIS", uk: "Східна Європа / СНД", ru: "Восточная Европа / СНГ" }, tips: {
        en: ["Panel 5-9 story apartment blocks (Khrushchyovkas)", "Concrete fences with diamond pattern — Ukraine, Russia", "White road posts with red stripes", "Onion-shaped church domes", "Marshrutkas (minibuses)", "Sunflower fields — Ukraine", "Soviet mosaics on buildings"],
        uk: ["Панельні 5-9 поверхові будинки (хрущовки)", "Бетонні паркани з ромбовидним візерунком — Україна, Росія", "Білі дорожні стовпчики з червоними смугами", "Цибулеподібні куполи церков", "Маршрутки (мікроавтобуси)", "Соняшникові поля — Україна", "Радянські мозаїки на будівлях"],
        ru: ["Панельные 5-9 этажные дома (хрущёвки)", "Бетонные заборы с ромбовидным узором — Украина, Россия", "Белые дорожные столбики с красными полосами", "Луковичные купола церквей", "Маршрутки (микроавтобусы)", "Подсолнечные поля — Украина", "Советские мозаики на зданиях"],
      }},
      { id: "asia", emoji: "🌏", name: { en: "Asia", uk: "Азія", ru: "Азия" }, tips: {
        en: ["Left-hand traffic — Japan, Thailand, India", "Chinese characters vs Japanese kanji vs Korean Hangul", "Red lanterns — China", "Torii gates — Japan", "Buddhist temples with golden spires — Thailand", "Tuk-tuks — Thailand, India", "Rice terraces — Vietnam, Philippines"],
        uk: ["Лівосторонній рух — Японія, Таїланд, Індія", "Китайські ієрогліфи vs японські кандзі vs корейський хангиль", "Червоні ліхтарі — Китай", "Ворота торії — Японія", "Буддійські храми із золотими шпилями — Таїланд", "Тук-туки — Таїланд, Індія", "Рисові тераси — В'єтнам, Філіппіни"],
        ru: ["Левостороннее движение — Япония, Таиланд, Индия", "Китайские иероглифы vs японские кандзи vs корейский хангыль", "Красные фонари — Китай", "Ворота тории — Япония", "Буддийские храмы с золотыми шпилями — Таиланд", "Тук-туки — Таиланд, Индия", "Рисовые террасы — Вьетнам, Филиппины"],
      }},
      { id: "americas", emoji: "🌎", name: { en: "Americas", uk: "Америка", ru: "Америка" }, tips: {
        en: ["Yellow school buses — USA, Canada", "Green signs with white text — American highways", "Horizontal traffic lights — USA", "Blue USPS mailboxes — USA", "Colorful colonial buildings — Latin America", "Cacti and deserts — Mexico, Arizona", "Long straight roads — Midwest"],
        uk: ["Жовті шкільні автобуси — США, Канада", "Зелені знаки з білим текстом — американські шосе", "Горизонтальні світлофори — США", "Сині поштові скриньки USPS — США", "Кольорові колоніальні будівлі — Латинська Америка", "Кактуси та пустелі — Мексика, Арізона", "Довгі прямі дороги — Середній Захід"],
        ru: ["Жёлтые школьные автобусы — США, Канада", "Зелёные знаки с белым текстом — американские шоссе", "Горизонтальные светофоры — США", "Синие почтовые ящики USPS — США", "Цветные колониальные здания — Латинская Америка", "Кактусы и пустыни — Мексика, Аризона", "Длинные прямые дороги — Средний Запад"],
      }},
      { id: "africa_mideast", emoji: "🌍", name: { en: "Africa & Middle East", uk: "Африка та Близький Схід", ru: "Африка и Ближний Восток" }, tips: {
        en: ["Mosques with minarets", "Arabic script (right to left)", "Green license plates — Saudi Arabia", "Mud-brick houses — Morocco, Mali", "Red dirt roads — Sub-Saharan Africa", "Savanna with acacia trees — Kenya, Tanzania"],
        uk: ["Мечеті з мінаретами", "Арабська писемність (справа наліво)", "Зелені номерні знаки — Саудівська Аравія", "Глинобитні будинки — Марокко, Малі", "Червоні ґрунтові дороги — Субсахарська Африка", "Савана з акаціями — Кенія, Танзанія"],
        ru: ["Мечети с минаретами", "Арабская письменность (справа налево)", "Зелёные номерные знаки — Саудовская Аравия", "Глинобитные дома — Марокко, Мали", "Красные грунтовые дороги — Субсахарская Африка", "Саванна с акациями — Кения, Танзания"],
      }},
    ];
    res.json(regions);
  });

  app.post("/api/quick-check", async (req, res) => {
    const ip = req.ip || "unknown";
    if (rateLimit("quickcheck:" + ip, 3, 86400000)) {
      return res.status(429).json({ error: "Daily quick check limit reached. Sign up for more!" });
    }

    const { type, value } = req.body;
    if (!type || !value) {
      return res.status(400).json({ error: "Type and value are required" });
    }

    const allowedTypes = ["ip", "email", "domain", "wallet", "phone", "username"];
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({ error: "Quick check supports: IP, Email, Domain, Wallet, Phone, Username" });
    }

    const validation = validateInput(type, value);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    try {
      const result = await performCheck(type, value);
      addActivity(type, value, result.riskLevel);

      const sourcesMap: Record<string, string[]> = {
        email: [
          "HaveIBeenPwned", "DeHashed", "LeakCheck", "Snusbase", "BreachDirectory",
          "IntelligenceX", "Hudson Rock", "EmailRep", "Hunter.io", "Verifalia",
          "Holehe", "GHunt", "Spycloud", "Cybernews Leak Checker", "OSINT.industries",
        ],
        phone: [
          "NumVerify", "Truecaller", "Sync.me", "PhoneInfoga", "OpenCNAM",
          "Twilio Lookup", "Whitepages", "Spokeo", "Pipl", "HaveIBeenPwned",
          "LeakCheck", "EveryCaller",
        ],
        username: [
          "Sherlock", "Maigret", "WhatsMyName", "Namechk", "Knowem",
          "UserSearch.org", "Social-Searcher", "PeekYou", "Idcrawl", "HaveIBeenPwned",
        ],
        wallet: [
          "Etherscan", "Blockchair", "BscScan", "PolygonScan", "TronScan",
          "ChainAbuse", "Arkham Intelligence", "OFAC SDN List", "MistTrack", "Solscan",
          "WalletExplorer", "CryptoScamDB", "Bitcoin Abuse DB",
        ],
        domain: [
          "URLScan.io", "WHOIS", "DNSDumpster", "SecurityTrails", "crt.sh",
          "VirusTotal", "Google Safe Browsing", "PhishTank", "OpenPhish", "URLhaus",
          "SiteCheck (Sucuri)", "Wappalyzer", "BuiltWith", "WebArchive",
        ],
        ip: [
          "AbuseIPDB", "VirusTotal", "Shodan", "Censys", "GreyNoise",
          "IPinfo", "MaxMind", "FraudGuard", "IPQualityScore", "Spamhaus",
          "Project Honeypot", "Talos Intelligence", "BinaryEdge", "ZoomEye",
        ],
      };
      const sourcesChecked = sourcesMap[type] || [];

      const findingsCount = result.findings?.length || 0;
      const dangerCount = result.findings?.filter(
        (f: any) => f && (f.includes("⚠️") || f.includes("❌") || f.includes("🚨") || f.includes("🔴"))
      ).length || 0;

      // Strip evidence for FREE tier — keep only name/category/status
      const sourcesScannedPublic = (result.sourcesScanned || []).map((s) => ({
        name: s.name,
        category: s.category,
        status: s.status,
      }));

      res.json({
        type: result.type,
        target: result.target,
        riskScore: result.riskScore,
        riskLevel: result.riskLevel,
        summary: result.summary,
        findings: (result.findings || []).slice(0, 3),
        findingsHidden: Math.max(0, findingsCount - 3),
        sourcesChecked,
        sourcesTotal: result.sourcesScanned?.length || SOURCES_COUNT,
        sourcesScanned: sourcesScannedPublic,
        coverage: result.coverage || null,
        dangerSignals: dangerCount,
        timestamp: result.timestamp.toISOString(),
        limited: true,
      });
    } catch (err: any) {
      console.error("quick-check error:", err);
      res.status(400).json({ error: "Не удалось выполнить проверку. Попробуйте позже." });
    }
  });

  app.get("/api/recent-public-checks", async (req, res) => {
    try {
      const items = recentActivity.slice(0, 8).map((a) => ({
        type: a.type,
        riskLevel: a.riskLevel,
        timestamp: a.timestamp,
      }));
      res.json(items);
    } catch {
      res.json([]);
    }
  });

  // Bulk check endpoint (requires auth)
  app.post(api.check.bulk.path, loadUser, requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const { checks } = req.body;
    
    if (!checks || !Array.isArray(checks) || checks.length === 0) {
      return res.status(400).json({ error: "Checks array is required" });
    }

    if (checks.length > 20) {
      return res.status(400).json({ error: "Maximum 20 checks per request" });
    }

    // Check daily limits per tier
    const user = authReq.user!;
    const userTier = (user.tier || "FREE").toUpperCase();
    
    const DAILY_LIMITS: Record<string, number> = {
      FREE: 5,
      PRO: 50,
      ENTERPRISE: Infinity,
      GROUPS: Infinity,
    };
    
    const dailyLimit = DAILY_LIMITS[userTier] || 5;
    
    if (dailyLimit !== Infinity) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const userReports = await storage.getReports(user.id);
      const todayChecks = userReports.filter(r => r.generatedAt && new Date(r.generatedAt) >= today).length;
      
      if (todayChecks >= dailyLimit) {
        return res.status(429).json({ 
          error: `Daily check limit reached (${todayChecks}/${dailyLimit}). Upgrade your plan for more checks.`,
          limit: dailyLimit,
          used: todayChecks,
        });
      }
    }

    const results: any[] = [];

    for (const check of checks) {
      const { type, value } = check;
      
      if (!type || !value) {
        results.push({
          type: type || 'unknown',
          target: value || 'unknown',
          riskScore: 0,
          riskLevel: 'low',
          summary: 'Invalid check parameters',
          details: {},
          findings: [],
          sources: [],
          timestamp: new Date().toISOString(),
          error: 'Type and value are required',
        });
        continue;
      }

      const validation = validateInput(type, value);
      if (!validation.valid) {
        results.push({
          type,
          target: value,
          riskScore: 0,
          riskLevel: 'low',
          summary: validation.error || 'Validation failed',
          details: {},
          findings: [],
          sources: [],
          timestamp: new Date().toISOString(),
          error: validation.error,
        });
        continue;
      }

      try {
        const result = await performCheck(type, value);
        
        // Add to activity feed
        addActivity(type, value, result.riskLevel);

        // Generate unique verificationId for QR code verification
        const verificationId = generateVerificationId();

        // Store report using authenticated user
        await storage.createReport({
          userId: authReq.user!.id,
          objectType: type,
          verificationId,
          dataJson: {
            target: value,
            riskScore: result.riskScore,
            riskLevel: result.riskLevel,
            findings: result.findings,
            details: result.details,
            sources: result.sources,
            summary: result.summary,
          },
        });

        results.push({
          ...result,
          timestamp: result.timestamp.toISOString(),
        });
      } catch (err: any) {
        results.push({
          type,
          target: value,
          riskScore: 0,
          riskLevel: 'low',
          summary: err.message || 'Check failed',
          details: {},
          findings: [],
          sources: [],
          timestamp: new Date().toISOString(),
          error: err.message,
        });
      }
    }

    res.json({ results });
  });

  // Reports list endpoint (requires auth)
  app.get(api.reports.list.path, loadUser, requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const reports = await storage.getReports(authReq.user!.id);
    res.json(reports.map(r => {
      const data = r.dataJson as any || {};
      return {
        id: r.id,
        type: r.objectType,
        target: data.target || 'unknown',
        riskLevel: data.riskLevel || 'unknown',
        riskScore: data.riskScore || 0,
        createdAt: r.generatedAt?.toISOString() || new Date().toISOString(),
      };
    }));
  });

  // Delete report endpoint (requires auth)
  app.delete("/api/reports/:id", loadUser, requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const id = parseInt(req.params.id);
    try {
      const report = await storage.getReportById(id);
      if (!report) {
        return res.status(404).json({ error: "Report not found" });
      }
      if (report.userId !== authReq.user!.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      await storage.deleteReport(id);
      res.json({ success: true });
    } catch (err) {
      console.error("Delete report error:", err);
      res.status(500).json({ error: "Failed to delete report" });
    }
  });

  // JSON export endpoint (requires auth)
  app.get(api.reports.exportJson.path, loadUser, requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const user = authReq.user!;
    const isPaid = user.tier && user.tier !== "FREE";
    const FREE_LIMIT = 10;

    const allReports = await storage.getReports(user.id);
    const reports = allReports.slice().sort((a, b) => {
      const aT = a.generatedAt ? new Date(a.generatedAt).getTime() : 0;
      const bT = b.generatedAt ? new Date(b.generatedAt).getTime() : 0;
      return bT - aT;
    });
    const limitedReports = isPaid ? reports : reports.slice(0, FREE_LIMIT);

    const exportData = limitedReports.map(r => {
      const data = r.dataJson as any || {};
      return {
        id: r.id,
        type: r.objectType,
        target: data.target || 'unknown',
        riskLevel: data.riskLevel || 'unknown',
        riskScore: data.riskScore || 0,
        createdAt: r.generatedAt?.toISOString() || new Date().toISOString(),
      };
    });

    // Backward-compatible: response body is the array (consumers reading [0..n] still work).
    // Watermark/meta delivered via custom HTTP headers for FREE.
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=darkshare_reports${isPaid ? '' : '_free'}.json`);
    res.setHeader('X-Darkshare-Tier', isPaid ? String(user.tier) : 'FREE');
    res.setHeader('X-Darkshare-Total', String(reports.length));
    res.setHeader('X-Darkshare-Exported', String(exportData.length));
    if (!isPaid) {
      res.setHeader('X-Darkshare-Watermark', 'FREE PLAN — last 10 reports. Upgrade to PRO with code DARKNEU for -50% off.');
      res.setHeader('X-Darkshare-Promo', 'DARKNEU');
      res.setHeader('X-Darkshare-Upgrade-Url', 'https://darkshare.store/pricing');
    }
    res.json(exportData);
  });

  // CSV export endpoint (requires auth)
  app.get(api.reports.exportCsv.path, loadUser, requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const user = authReq.user!;
    const isPaid = user.tier && user.tier !== "FREE";
    const FREE_LIMIT = 10;

    const allReports = await storage.getReports(user.id);
    const reports = allReports.slice().sort((a, b) => {
      const aT = a.generatedAt ? new Date(a.generatedAt).getTime() : 0;
      const bT = b.generatedAt ? new Date(b.generatedAt).getTime() : 0;
      return bT - aT;
    });
    const limitedReports = isPaid ? reports : reports.slice(0, FREE_LIMIT);

    const exportData = limitedReports.map(r => {
      const data = r.dataJson as any || {};
      return {
        id: r.id,
        type: r.objectType,
        target: data.target || 'unknown',
        riskLevel: data.riskLevel || 'unknown',
        riskScore: data.riskScore || 0,
        createdAt: r.generatedAt?.toISOString() || new Date().toISOString(),
      };
    });

    const headers = ['id', 'type', 'target', 'riskLevel', 'riskScore', 'createdAt'];
    const csvRows: string[] = [];

    if (!isPaid) {
      csvRows.push('# ============================================================');
      csvRows.push('# DARKSHARE — FREE PLAN EXPORT');
      csvRows.push(`# Limited to last ${FREE_LIMIT} reports (you have ${reports.length} total)`);
      csvRows.push('# Upgrade to PRO to remove watermark + unlock full history');
      csvRows.push('# Promo code: DARKNEU  |  -50% on first subscription');
      csvRows.push('# https://darkshare.store/pricing');
      csvRows.push('# ============================================================');
    } else {
      csvRows.push(`# DARKSHARE — ${user.tier} export · ${new Date().toISOString()} · ${exportData.length} reports`);
    }
    csvRows.push(headers.join(','));

    for (const report of exportData) {
      const row = headers.map(header => {
        const value = report[header as keyof typeof report];
        const stringValue = String(value ?? '');
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      });
      csvRows.push(row.join(','));
    }

    if (!isPaid) {
      csvRows.push('');
      csvRows.push('# === END OF FREE EXPORT ===');
      csvRows.push(`# Showing ${exportData.length} of ${reports.length} reports`);
      csvRows.push('# Use code DARKNEU for -50% on PRO at darkshare.store/pricing');
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=darkshare_reports${isPaid ? '' : '_free'}.csv`);
    res.send(csvRows.join('\n'));
  });

  // PDF download endpoint (requires auth)
  app.get(api.reports.download.path, loadUser, requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const id = parseInt(req.params.id);
    const report = await storage.getReportById(id);
    
    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    if (report.userId !== authReq.user!.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    const data = report.dataJson as any || {};
    const riskLevel = data.riskLevel || 'medium';
    const riskScore = data.riskScore || 50;

    try {
      // Use existing verificationId or generate new one if missing
      const verificationId = report.verificationId || generateVerificationId();
      
      const u = authReq.user! as any;
      const wlTier = String(u.tier || "FREE").toUpperCase();
      const branding = (wlTier === "ENTERPRISE" || wlTier === "GROUPS")
        ? { companyName: u.companyName, brandColor: u.brandColor, companyLogoUrl: u.companyLogoUrl }
        : undefined;
      const pdfBuffer = await generateDetailedPDF({
        moduleType: report.objectType || 'unknown',
        targetValue: data.target || 'unknown',
        riskLevel,
        riskScore,
        timestamp: report.generatedAt || new Date(),
        userId: authReq.user!.username || 'user',
        findings: data.findings || generateFindings(report.objectType || 'unknown', riskLevel),
        sources: data.sources || ["DARKSHARE Intel"],
        metadata: generateMetadata(report.objectType || 'unknown'),
        verificationId,
        branding,
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename=DARKSHARE_${report.objectType}_${id}.pdf`);
      res.send(pdfBuffer);
    } catch (err) {
      res.status(500).json({ error: "Failed to generate PDF" });
    }
  });

  // Direct PDF generation from check result data (no saved report needed)
  app.post("/api/check/generate-pdf", loadUser, requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;

    const validTypes = ["ip", "wallet", "email", "phone", "domain", "url", "bot", "cve", "hash", "username", "card", "password", "dns", "ssl", "mac"];
    const validRiskLevels = ["low", "medium", "high", "critical"];

    const type = typeof req.body.type === "string" ? req.body.type.trim() : "";
    const target = typeof req.body.target === "string" ? req.body.target.trim().substring(0, 200) : "";

    if (!type || !target || !validTypes.includes(type)) {
      return res.status(400).json({ error: "Invalid or missing type/target" });
    }

    const riskLevel = validRiskLevels.includes(req.body.riskLevel) ? req.body.riskLevel : "medium";
    const riskScore = typeof req.body.riskScore === "number" ? Math.min(100, Math.max(0, Math.round(req.body.riskScore))) : 50;

    const rawFindings = Array.isArray(req.body.findings) ? req.body.findings.filter((f: unknown) => typeof f === "string").slice(0, 20) : [];
    const rawSources = Array.isArray(req.body.sources) ? req.body.sources.filter((s: unknown) => typeof s === "string").slice(0, 10) : ["DARKSHARE Intel"];

    try {
      const parsedFindings = rawFindings.map((f: string) => {
        const clean = f.substring(0, 200);
        const isWarning = clean.includes("⚠") || clean.includes("WARNING");
        const isDanger = clean.includes("CRITICAL") || clean.includes("КРИТИЧНО") || clean.includes("DANGER");
        const isSuccess = clean.includes("✅") || clean.includes("SAFE") || clean.includes("✓");
        return {
          type: isDanger ? "danger" as const : isWarning ? "warning" as const : isSuccess ? "success" as const : "info" as const,
          title: clean.replace(/^[^\w\u0400-\u04FF]+/, '').substring(0, 100),
          description: "",
        };
      });

      let sanitizedMeta: Record<string, string | number> | undefined;
      if (req.body.details && typeof req.body.details === "object" && !Array.isArray(req.body.details)) {
        sanitizedMeta = Object.fromEntries(
          Object.entries(req.body.details)
            .slice(0, 8)
            .filter(([k, v]) => typeof k === "string" && (typeof v === "string" || typeof v === "number"))
            .map(([k, v]) => [k.substring(0, 30), typeof v === "string" ? (v as string).substring(0, 100) : v as number])
        ) as Record<string, string | number>;
      }

      const u2 = authReq.user! as any;
      const wlTier2 = String(u2.tier || "FREE").toUpperCase();
      const branding2 = (wlTier2 === "ENTERPRISE" || wlTier2 === "GROUPS")
        ? { companyName: u2.companyName, brandColor: u2.brandColor, companyLogoUrl: u2.companyLogoUrl }
        : undefined;
      const pdfBuffer = await generateDetailedPDF({
        moduleType: type,
        targetValue: target,
        riskLevel: riskLevel as "low" | "medium" | "high" | "critical",
        riskScore,
        timestamp: new Date(),
        userId: authReq.user!.username || 'user',
        findings: parsedFindings.length > 0 ? parsedFindings : generateFindings(type, riskLevel),
        sources: rawSources.map((s: string) => s.substring(0, 50)),
        metadata: sanitizedMeta || generateMetadata(type),
        verificationId: `DRAFT-${Date.now().toString(36)}`,
        aiInsights: undefined,
        branding: branding2,
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=DARKSHARE_${type}_report.pdf`);
      res.send(pdfBuffer);
    } catch (err) {
      console.error("PDF generation error:", err);
      res.status(500).json({ error: "Failed to generate PDF" });
    }
  });

  // Public verification endpoint (no auth required)
  app.get("/api/verify/:verificationId", async (req, res) => {
    const { verificationId } = req.params;
    
    if (!verificationId) {
      return res.status(400).json({ error: "Verification ID is required" });
    }

    try {
      const report = await storage.getReportByVerificationId(verificationId);
      
      if (!report) {
        return res.status(404).json({ error: "Report not found", valid: false });
      }

      const data = report.dataJson as any || {};
      
      res.json({
        valid: true,
        verificationId: report.verificationId,
        type: report.objectType,
        target: data.target || 'unknown',
        riskLevel: data.riskLevel || 'unknown',
        riskScore: data.riskScore || 0,
        summary: data.summary || null,
        generatedAt: report.generatedAt?.toISOString() || new Date().toISOString(),
      });
    } catch (err) {
      res.status(500).json({ error: "Verification failed" });
    }
  });

  // Watches list endpoint (requires auth)
  app.get(api.watches.list.path, loadUser, requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const watches = await storage.getWatches(authReq.user!.id);
    res.json(watches.map(w => ({
      id: w.id,
      objectType: w.objectType,
      value: w.value,
      status: w.status || 'active',
      lastCheck: w.lastCheck?.toISOString() || null,
      createdAt: new Date().toISOString(),
    })));
  });

  // Create watch endpoint (requires auth)
  app.post(api.watches.create.path, loadUser, requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const { type, value, threshold } = req.body;
    
    if (!type || !value) {
      return res.status(400).json({ error: "Type and value are required" });
    }

    try {
      const watch = await storage.createWatch({
        userId: authReq.user!.id,
        objectType: type,
        value,
        thresholdsJson: { scoreThreshold: threshold || 50 },
        status: "active",
      });
      res.status(201).json({ id: watch.id, message: "Monitor created" });
    } catch (err) {
      res.status(400).json({ error: "Failed to create monitor" });
    }
  });

  // Delete watch endpoint (requires auth + ownership)
  app.delete(api.watches.delete.path, loadUser, requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: "Invalid monitor id" });
    }
    try {
      const watch = await storage.getWatchById(id);
      if (!watch) {
        return res.status(404).json({ error: "Monitor not found" });
      }
      if (watch.userId !== authReq.user!.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      await storage.deleteWatch(id);
      res.json({ message: "Monitor deleted" });
    } catch (err) {
      console.error("Delete watch error:", err);
      res.status(500).json({ error: "Failed to delete monitor" });
    }
  });

  app.post("/api/promo/validate", loadUser, requireAuth, async (req, res) => {
    const authReqPromo = req as AuthenticatedRequest;
    if (rateLimit(`promo:${authReqPromo.user?.id || "anon"}`, 10, 60000)) {
      return res.status(429).json({ error: "Too many attempts. Please try again later.", valid: false });
    }
    const { code, tier } = req.body;
    if (!code) return res.status(400).json({ error: "Promo code is required", valid: false });
    
    try {
      const coupon = await storage.getCouponByCode(code.toUpperCase());
      if (!coupon) return res.status(400).json({ error: "Invalid promo code", valid: false });
      if (!coupon.isActive) return res.status(400).json({ error: "Promo code is inactive", valid: false });
      if ((coupon.usedCount ?? 0) >= (coupon.maxUses ?? 0)) return res.status(400).json({ error: "Promo code expired", valid: false });
      if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) return res.status(400).json({ error: "Promo code expired", valid: false });
      if (coupon.tier && coupon.tier !== tier?.toUpperCase()) return res.status(400).json({ error: "Promo code not valid for this plan", valid: false });
      
      const authReq = req as AuthenticatedRequest;
      const alreadyUsed = await storage.hasUserUsedCoupon(coupon.id, authReq.user!.id);
      if (alreadyUsed) return res.status(400).json({ error: "You have already used this promo code", valid: false });

      res.json({ valid: true, discount: coupon.value, code: coupon.code });
    } catch (error) {
      console.error("Promo validation error:", error);
      res.status(500).json({ error: "Failed to validate promo code", valid: false });
    }
  });

  app.delete("/api/user/sessions/:id", loadUser, requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const sessionId = req.params.id;
    if (sessionId === req.sessionID) {
      return res.status(400).json({ error: "Cannot terminate current session" });
    }
    try {
      if (pool) {
        const result = await pool.query(
          `SELECT sess FROM "session" WHERE sid = $1`,
          [sessionId]
        );
        
        if (result.rows.length === 0) {
          return res.status(404).json({ error: "Session not found" });
        }
        
        const sessData = typeof result.rows[0].sess === "string" 
          ? JSON.parse(result.rows[0].sess) 
          : result.rows[0].sess;
        const sessionUserId = sessData?.passport?.user || sessData?.userId;
        
        if (String(sessionUserId) !== String(authReq.user!.id)) {
          return res.status(403).json({ error: "Cannot terminate another user's session" });
        }
        
        await pool.query(`DELETE FROM "session" WHERE sid = $1`, [sessionId]);
      }
      res.json({ message: "Session terminated" });
    } catch (error) {
      console.error("Session delete error:", error);
      res.status(500).json({ error: "Failed to terminate session" });
    }
  });

  app.post("/api/payment-request", loadUser, requireAuth, upload.single("screenshot"), async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const { tier, txHash, amount: reqAmount, period, network, promoCode } = req.body;
    const screenshotFile = req.file;
    
    if (!tier || !["pro", "enterprise", "groups", "PRO", "ENTERPRISE", "GROUPS"].includes(tier)) {
      return res.status(400).json({ error: "Invalid tier. Must be 'pro', 'enterprise', or 'groups'" });
    }

    const normalizedTier = tier.toUpperCase();
    const isYearly = period === "yearly";
    const amount = reqAmount?.toString() || (
      normalizedTier === "PRO" 
        ? (isYearly ? "100" : "10") 
        : normalizedTier === "GROUPS"
        ? (isYearly ? "549" : "55")
        : (isYearly ? "349" : "35")
    );

    let promoValid = false;
    if (promoCode) {
      try {
        const coupon = await storage.getCouponByCode(promoCode.toUpperCase());
        if (coupon && coupon.isActive && (coupon.usedCount ?? 0) < (coupon.maxUses ?? 0) && 
            (!coupon.expiresAt || new Date(coupon.expiresAt) >= new Date()) &&
            (!coupon.tier || coupon.tier === normalizedTier)) {
          await storage.useCoupon(coupon.id, authReq.user!.id);
          promoValid = true;
        }
      } catch (promoError) {
        console.error("Promo code processing error:", promoError);
      }
    }

    try {
      const payment = await storage.createPayment({
        userId: authReq.user!.id,
        tier: normalizedTier,
        amountUsdt: amount,
        txHash: txHash || null,
        status: "pending",
      });

      if (botInstance) {
        const user = authReq.user!;
        const messageText = `\u{1F195} Нова заявка на оплату #${payment.id}\n\n` +
          `\u{1F464} Користувач: @${user.username || "\u2014"}\n` +
          `\u{1F522} TG ID: ${user.tgId}\n` +
          `\u{1F4E6} Тариф: ${normalizedTier} (${isYearly ? "рік" : "місяць"})\n` +
          `\u{1F4B0} Сума: $${amount} USDT\n` +
          `\u{1F310} Мережа: ${network || "не вказано"}\n` +
          `${txHash ? `\u{1F4DD} TX Hash: ${txHash}` : "\u{1F4DD} TX Hash: не вказано"}\n` +
          `${promoCode ? `\u{1F3AB} Промокод: ${promoCode}${promoValid ? " \u2705" : " \u274C"}\n` : ""}` +
          `${screenshotFile ? `\u{1F4F7} Скріншот: додано\n` : ""}` +
          `\u{1F4CD} Джерело: Web\n\n` +
          `\u26A1 Перевірте транзакцію та підтвердіть оплату`;

        for (const adminId of ADMIN_IDS) {
          try {
            await botInstance.telegram.sendMessage(adminId, messageText, {
              reply_markup: Markup.inlineKeyboard([
                [
                  Markup.button.callback("\u2705 Підтвердити", `approve_pay_${payment.id}`),
                  Markup.button.callback("\u274C Відхилити", `reject_pay_${payment.id}`)
                ]
              ]).reply_markup
            });
            if (screenshotFile) {
              await botInstance.telegram.sendDocument(adminId, { 
                source: screenshotFile.path, 
                filename: screenshotFile.originalname 
              }, { caption: `\u{1F4F7} Скріншот оплати #${payment.id}` });
            }
          } catch (e) {
            console.log(`Failed to notify admin ${adminId}:`, e);
          }
        }
      }

      res.json({ success: true, paymentId: payment.id });
    } catch (err: any) {
      console.error("Payment request error:", err);
      res.status(500).json({ error: "Failed to create payment request" });
    }
  });

  // ==================== CRYPTO PAY (CRYPTOBOT) ROUTES ====================

  const CRYPTO_PAY_API = "https://pay.crypt.bot/api";
  const CRYPTO_PAY_TOKEN = process.env.CRYPTO_PAY_API_TOKEN || "";

  const CRYPTO_PAY_USD_PRICES: Record<string, Record<string, number>> = {
    PRO: { monthly: 10, yearly: 100 },
    ENTERPRISE: { monthly: 35, yearly: 349 },
    GROUPS: { monthly: 55, yearly: 549 },
  };

  app.post("/api/payments/cryptopay/create", loadUser, requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const { tier, period, promoCode } = req.body;

    if (!tier || !["PRO", "ENTERPRISE", "GROUPS"].includes(tier.toUpperCase())) {
      return res.status(400).json({ error: "Invalid tier" });
    }
    if (!period || !["monthly", "yearly"].includes(period)) {
      return res.status(400).json({ error: "Invalid period" });
    }
    if (!CRYPTO_PAY_TOKEN) {
      return res.status(503).json({ error: "Crypto Pay is not configured" });
    }

    const normalizedTier = tier.toUpperCase();
    let amount = CRYPTO_PAY_USD_PRICES[normalizedTier]?.[period] || 10;

    let promoValid = false;
    if (promoCode) {
      try {
        const coupon = await storage.getCouponByCode(promoCode.toUpperCase());
        if (coupon && coupon.isActive && (coupon.usedCount ?? 0) < (coupon.maxUses ?? 0) &&
            (!coupon.expiresAt || new Date(coupon.expiresAt) >= new Date()) &&
            (!coupon.tier || coupon.tier === normalizedTier)) {
          const used = await storage.hasUserUsedCoupon(coupon.id, authReq.user!.id);
          if (!used) {
            await storage.useCoupon(coupon.id, authReq.user!.id);
            amount = Math.round(amount * (1 - (coupon.value || 0) / 100) * 100) / 100;
            promoValid = true;
          }
        }
      } catch (e) {
        console.error("Promo code error:", e);
      }
    }

    const requests = normalizedTier === "ENTERPRISE" || normalizedTier === "GROUPS" ? 500 : 50;
    const periodDays = period === "yearly" ? 365 : 30;

    try {
      const payment = await storage.createPayment({
        userId: authReq.user!.id,
        tier: normalizedTier,
        amountUsdt: String(amount),
        txHash: null,
        status: "pending",
      });

      const invoiceRes = await fetch(`${CRYPTO_PAY_API}/createInvoice`, {
        method: "POST",
        headers: {
          "Crypto-Pay-API-Token": CRYPTO_PAY_TOKEN,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currency_type: "fiat",
          fiat: "USD",
          amount: String(amount),
          description: `DARKSHARE ${normalizedTier} (${period}) - Payment #${payment.id}`,
          payload: JSON.stringify({
            paymentId: payment.id,
            userId: authReq.user!.id,
            tier: normalizedTier,
            period,
            requests,
            periodDays,
          }),
          expires_in: 600,
        }),
      });

      const invoiceData = await invoiceRes.json();

      if (!invoiceData.ok || !invoiceData.result) {
        console.error("Crypto Pay createInvoice error:", invoiceData);
        return res.status(500).json({ error: "Failed to create crypto invoice" });
      }

      const invoice = invoiceData.result;

      if (pool) {
        await pool.query(
          `UPDATE ds_payments SET invoice_id = $1 WHERE id = $2`,
          [String(invoice.invoice_id), payment.id]
        );
      }

      res.json({
        payUrl: invoice.bot_invoice_url || invoice.mini_app_invoice_url || invoice.web_app_invoice_url,
        invoiceId: invoice.invoice_id,
        paymentId: payment.id,
      });
    } catch (err: any) {
      console.error("Crypto Pay create error:", err);
      res.status(500).json({ error: "Failed to create payment" });
    }
  });

  app.post("/api/payments/cryptopay/webhook", express.json(), async (req, res) => {
    try {
      const signature = req.headers["crypto-pay-api-signature"] as string;
      if (!signature || !CRYPTO_PAY_TOKEN) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const secret = createHmac("sha256", "WebAppData").update(CRYPTO_PAY_TOKEN).digest();
      const checkString = JSON.stringify(req.body);
      const hmac = createHmac("sha256", secret).update(checkString).digest("hex");

      if (hmac !== signature) {
        console.error("Crypto Pay webhook signature mismatch");
        return res.status(401).json({ error: "Invalid signature" });
      }

      const update = req.body;

      if (update.update_type === "invoice_paid") {
        const invoice = update.payload;
        let meta: any = {};
        try {
          meta = JSON.parse(invoice.payload || "{}");
        } catch (e) {}

        if (meta && meta.type === "audit" && meta.paymentId && meta.userId) {
          const payment = await storage.getPaymentById(meta.paymentId);
          if (payment && payment.status === "pending") {
            await storage.updatePaymentStatus(meta.paymentId, "approved");
            if (pool) {
              await pool.query(`UPDATE ds_payments SET tx_hash = $1 WHERE id = $2`, [invoice.hash || invoice.invoice_id?.toString() || "cryptopay", meta.paymentId]);
            }
            const credits = Number(meta.credits) || 5;
            const buyer = await storage.getUserById(meta.userId);
            const newCredits = (buyer?.requestsLeft || 0) + credits;
            await storage.updateUser(meta.userId, { requestsLeft: newCredits } as any);
            if (buyer && botInstance) {
              try {
                const lang = buyer.lang || "uk";
                const m: Record<string, string> = {
                  uk: `🧾 *Оплату підтверджено!*\n\nДодано *${credits}* перевірок до твого балансу.\nЗагалом доступно: *${newCredits}*`,
                  ru: `🧾 *Оплата подтверждена!*\n\nДобавлено *${credits}* проверок к балансу.\nВсего доступно: *${newCredits}*`,
                  en: `🧾 *Payment confirmed!*\n\nAdded *${credits}* checks to your balance.\nTotal available: *${newCredits}*`,
                  es: `🧾 *Pago confirmado!*\n\nAñadidas *${credits}* comprobaciones.\nDisponibles: *${newCredits}*`,
                  de: `🧾 *Zahlung bestätigt!*\n\n*${credits}* Checks gutgeschrieben.\nVerfügbar: *${newCredits}*`,
                };
                await botInstance.telegram.sendMessage(buyer.tgId, m[lang] || m.en, { parse_mode: "Markdown" });
              } catch { /* ignore */ }
            }
          }
          return res.json({ ok: true });
        }

        const paymentId = meta.paymentId;
        const userId = meta.userId;
        const tier = meta.tier || "PRO";
        const requests = meta.requests || 50;
        const periodDays = meta.periodDays || 30;

        if (paymentId && userId) {
          await storage.updatePaymentStatus(paymentId, "approved");

          if (pool) {
            await pool.query(
              `UPDATE ds_payments SET tx_hash = $1 WHERE id = $2`,
              [invoice.hash || invoice.invoice_id?.toString() || "cryptopay", paymentId]
            );
          }

          const expiryDate = new Date(Date.now() + periodDays * 24 * 60 * 60 * 1000);
          await storage.updateUser(userId, {
            tier,
            requestsLeft: requests,
            subscriptionExpiresAt: expiryDate,
            autoRenew: false,
          } as any);

          const user = await storage.getUserById(userId);
          if (user && botInstance) {
            try {
              const lang = user.lang || "uk";
              const expiryStr = expiryDate.toLocaleDateString("uk-UA");
              const requestsDisplay = tier === "ENTERPRISE" || tier === "GROUPS" ? "∞" : "50";
              const paidAmount = invoice.paid_amount ? `${invoice.paid_amount} ${invoice.paid_asset || ""}` : `$${invoice.amount || "?"} USD`;
              const receiptTexts: Record<string, string> = {
                uk: `🧾 *КВИТАНЦІЯ DARKSHARE*\n━━━━━━━━━━━━━━━━━━━━\n\n✅ Оплату підтверджено!\n\n📦 Тариф: *${tier}*\n💰 Сума: ${paidAmount}\n💎 Метод: Crypto Pay\n🔢 Запитів: ${requestsDisplay}/день\n📅 Діє до: ${expiryStr}\n\n━━━━━━━━━━━━━━━━━━━━\nДякуємо за довіру! 🙏`,
                ru: `🧾 *КВИТАНЦИЯ DARKSHARE*\n━━━━━━━━━━━━━━━━━━━━\n\n✅ Оплата подтверждена!\n\n📦 Тариф: *${tier}*\n💰 Сумма: ${paidAmount}\n💎 Метод: Crypto Pay\n🔢 Запросов: ${requestsDisplay}/день\n📅 Действует до: ${expiryStr}\n\n━━━━━━━━━━━━━━━━━━━━\nСпасибо за доверие! 🙏`,
                en: `🧾 *DARKSHARE RECEIPT*\n━━━━━━━━━━━━━━━━━━━━\n\n✅ Payment confirmed!\n\n📦 Plan: *${tier}*\n💰 Amount: ${paidAmount}\n💎 Method: Crypto Pay\n🔢 Requests: ${requestsDisplay}/day\n📅 Valid until: ${expiryStr}\n\n━━━━━━━━━━━━━━━━━━━━\nThank you for your trust! 🙏`,
                es: `🧾 *RECIBO DARKSHARE*\n━━━━━━━━━━━━━━━━━━━━\n\n✅ ¡Pago confirmado!\n\n📦 Plan: *${tier}*\n💰 Monto: ${paidAmount}\n💎 Método: Crypto Pay\n🔢 Solicitudes: ${requestsDisplay}/día\n📅 Válido hasta: ${expiryStr}\n\n━━━━━━━━━━━━━━━━━━━━\n¡Gracias por su confianza! 🙏`,
                de: `🧾 *DARKSHARE QUITTUNG*\n━━━━━━━━━━━━━━━━━━━━\n\n✅ Zahlung bestätigt!\n\n📦 Tarif: *${tier}*\n💰 Betrag: ${paidAmount}\n💎 Methode: Crypto Pay\n🔢 Anfragen: ${requestsDisplay}/Tag\n📅 Gültig bis: ${expiryStr}\n\n━━━━━━━━━━━━━━━━━━━━\nVielen Dank für Ihr Vertrauen! 🙏`,
              };
              await botInstance.telegram.sendMessage(user.tgId, receiptTexts[lang] || receiptTexts["en"], { parse_mode: "Markdown" });
            } catch (e) { /* ignore */ }
          }

          for (const adminId of ADMIN_IDS) {
            try {
              await botInstance?.telegram.sendMessage(adminId,
                `✅ Crypto Pay оплата #${paymentId} підтверджена\n\n📦 ${tier}\n💰 ${invoice.paid_amount || invoice.amount} ${invoice.paid_asset || "USD"}\n👤 User #${userId} (@${user?.username || "—"})`
              );
            } catch (e) {}
          }
        }
      }

      res.json({ ok: true });
    } catch (err: any) {
      console.error("Crypto Pay webhook error:", err);
      res.status(400).json({ error: "Webhook processing failed" });
    }
  });

  // ==================== MONOPAY (MONOBANK) ROUTES ====================

  const UAH_PER_USD = 41;
  const MONOPAY_PRICES_UAH: Record<string, Record<string, number>> = {
    PRO: { monthly: 410, yearly: 4100 },
    ENTERPRISE: { monthly: 1435, yearly: 14309 },
    GROUPS: { monthly: 2255, yearly: 22509 },
  };
  const SINGLE_AUDIT_USD = 3;
  const SINGLE_AUDIT_UAH = 123;
  const SINGLE_AUDIT_CREDITS = 5;

  app.post("/api/payments/single-audit/create", loadUser, requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const { method } = req.body || {};
    if (!method || !["monobank", "crypto"].includes(method)) {
      return res.status(400).json({ error: "Invalid payment method" });
    }
    try {
      const payment = await storage.createPayment({
        userId: authReq.user!.id,
        tier: "AUDIT",
        amountUsdt: SINGLE_AUDIT_USD.toFixed(2),
        txHash: null,
        period: "single",
        status: "pending",
      });
      const appUrl = process.env.APP_URL || 'https://darkshare.store';
      const reference = `DS-AUDIT-${payment.id}`;

      if (method === "monobank") {
        const monoToken = process.env.MONOBANK_TOKEN;
        if (!monoToken) {
          return res.status(503).json({ error: "Card payment is not configured. Please use Crypto Pay." });
        }
        const monoResponse = await fetch("https://api.monobank.ua/api/merchant/invoice/create", {
          method: "POST",
          headers: { "X-Token": monoToken, "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: SINGLE_AUDIT_UAH * 100,
            ccy: 980,
            merchantPaymInfo: {
              reference,
              destination: `DARKSHARE single audit (${SINGLE_AUDIT_CREDITS} checks)`,
              comment: "DARKSHARE one-time audit",
            },
            redirectUrl: `${appUrl}/?audit=success`,
            webHookUrl: `${appUrl}/api/payments/monopay/webhook`,
          }),
        });
        if (!monoResponse.ok) {
          const errorText = await monoResponse.text();
          console.error("Monobank single-audit error:", monoResponse.status, errorText);
          return res.status(502).json({ error: "Failed to create card invoice" });
        }
        const monoData = await monoResponse.json();
        if (monoData.invoiceId && pool) {
          await pool.query(`UPDATE ds_payments SET invoice_id = $1 WHERE id = $2`, [monoData.invoiceId, payment.id]);
        }
        return res.json({ pageUrl: monoData.pageUrl, invoiceId: monoData.invoiceId });
      }

      const cryptoToken = process.env.CRYPTOPAY_TOKEN || process.env.CRYPTO_PAY_TOKEN;
      if (!cryptoToken) {
        return res.status(503).json({ error: "Crypto Pay is not configured. Please try card payment." });
      }
      const cryptoResponse = await fetch("https://pay.crypt.bot/api/createInvoice", {
        method: "POST",
        headers: { "Crypto-Pay-API-Token": cryptoToken, "Content-Type": "application/json" },
        body: JSON.stringify({
          asset: "USDT",
          amount: SINGLE_AUDIT_USD.toFixed(2),
          description: `DARKSHARE one-time audit (${SINGLE_AUDIT_CREDITS} checks)`,
          payload: JSON.stringify({ type: "audit", paymentId: payment.id, userId: authReq.user!.id, credits: SINGLE_AUDIT_CREDITS }),
          paid_btn_name: "openBot",
          paid_btn_url: `${appUrl}/?audit=success`,
        }),
      });
      const cryptoData = await cryptoResponse.json();
      if (!cryptoResponse.ok || !cryptoData?.result?.pay_url) {
        console.error("CryptoPay single-audit error:", cryptoData);
        return res.status(502).json({ error: "Failed to create crypto invoice" });
      }
      if (pool) {
        await pool.query(`UPDATE ds_payments SET invoice_id = $1 WHERE id = $2`, [String(cryptoData.result.invoice_id), payment.id]);
      }
      return res.json({ pageUrl: cryptoData.result.pay_url, invoiceId: cryptoData.result.invoice_id });
    } catch (err: any) {
      console.error("single-audit create error:", err);
      return res.status(500).json({ error: "Failed to create audit payment" });
    }
  });

  app.post("/api/payments/monopay/create", loadUser, requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const { tier, period, promoCode } = req.body;

    if (!tier || !["PRO", "ENTERPRISE", "GROUPS"].includes(tier.toUpperCase())) {
      return res.status(400).json({ error: "Invalid tier" });
    }
    if (!period || !["monthly", "yearly"].includes(period)) {
      return res.status(400).json({ error: "Invalid period" });
    }

    const monoToken = process.env.MONOBANK_TOKEN;
    if (!monoToken) {
      return res.status(503).json({ error: "MonoPay is not configured yet. Please use another payment method." });
    }

    const normalizedTier = tier.toUpperCase();
    let amountUAH = MONOPAY_PRICES_UAH[normalizedTier]?.[period] || 0;
    if (!amountUAH) {
      return res.status(400).json({ error: "Could not calculate price" });
    }

    let promoValid = false;
    let promoDiscountValue = 0;
    if (promoCode) {
      try {
        const coupon = await storage.getCouponByCode(promoCode.toUpperCase());
        if (coupon && coupon.isActive && (coupon.usedCount ?? 0) < (coupon.maxUses ?? 0) &&
            (!coupon.expiresAt || new Date(coupon.expiresAt) >= new Date()) &&
            (!coupon.tier || coupon.tier === normalizedTier)) {
          const alreadyUsed = await storage.hasUserUsedCoupon(coupon.id, authReq.user!.id);
          if (!alreadyUsed) {
            promoDiscountValue = coupon.value || 0;
            amountUAH = Math.round(amountUAH * (1 - promoDiscountValue / 100));
            await storage.useCoupon(coupon.id, authReq.user!.id);
            promoValid = true;
          }
        }
      } catch (promoError) {
        console.error("MonoPay promo code error:", promoError);
      }
    }

    const amountUSD = (amountUAH / UAH_PER_USD).toFixed(2);

    try {
      const payment = await storage.createPayment({
        userId: authReq.user!.id,
        tier: normalizedTier,
        amountUsdt: amountUSD,
        txHash: null,
        period,
        status: "pending",
      });

      const appUrl = process.env.APP_URL || 'https://darkshare.store';
      const reference = `DS-${payment.id}`;

      const monoResponse = await fetch("https://api.monobank.ua/api/merchant/invoice/create", {
        method: "POST",
        headers: {
          "X-Token": monoToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amountUAH * 100,
          ccy: 980,
          merchantPaymInfo: {
            reference,
            destination: `DARKSHARE ${normalizedTier} ${period}`,
            comment: "DARKSHARE subscription",
          },
          redirectUrl: `${appUrl}/pricing?payment=success`,
          webHookUrl: `${appUrl}/api/payments/monopay/webhook`,
          saveCardData: {
            saveCard: true,
            walletId: `darkshare_${authReq.user!.id}`,
          },
        }),
      });

      if (!monoResponse.ok) {
        const errorText = await monoResponse.text();
        console.error("Monobank API error:", monoResponse.status, errorText);
        return res.status(502).json({ error: "Failed to create MonoPay invoice" });
      }

      const monoData = await monoResponse.json();

      if (monoData.invoiceId && pool) {
        await pool.query(`UPDATE ds_payments SET invoice_id = $1 WHERE id = $2`, [monoData.invoiceId, payment.id]);
      }

      if (botInstance) {
        const user = authReq.user!;
        const msgText = `\u{1F4B3} MonoPay заявка #${payment.id}\n\n` +
          `\u{1F464} @${user.username || "\u2014"} (TG: ${user.tgId})\n` +
          `\u{1F4E6} ${normalizedTier} (${period === "yearly" ? "рік" : "місяць"})\n` +
          `\u{1F4B0} ${amountUAH} UAH (~$${amountUSD})\n` +
          `${promoCode ? `\u{1F3AB} Промокод: ${promoCode}${promoValid ? " \u2705" : " \u274C"}\n` : ""}` +
          `\u{1F517} Invoice: ${monoData.invoiceId || "—"}`;

        for (const adminId of ADMIN_IDS) {
          try {
            await botInstance.telegram.sendMessage(adminId, msgText);
          } catch (e) {
            console.log(`Failed to notify admin ${adminId}:`, e);
          }
        }
      }

      res.json({ invoiceId: monoData.invoiceId, pageUrl: monoData.pageUrl });
    } catch (err: any) {
      console.error("MonoPay create error:", err);
      res.status(500).json({ error: "Failed to create MonoPay payment" });
    }
  });

  app.post("/api/payments/monopay/bot-create", async (req, res) => {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const authHeader = req.headers["x-bot-token"];
    if (!botToken || authHeader !== botToken) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { tier, period, tgId } = req.body;

    if (!tgId) {
      return res.status(400).json({ error: "Missing tgId" });
    }
    if (!tier || !["PRO", "ENTERPRISE", "GROUPS"].includes(tier.toUpperCase())) {
      return res.status(400).json({ error: "Invalid tier" });
    }

    const paymentPeriod = period || "monthly";
    if (!["monthly", "yearly"].includes(paymentPeriod)) {
      return res.status(400).json({ error: "Invalid period" });
    }

    const monoToken = process.env.MONOBANK_TOKEN;
    if (!monoToken) {
      return res.status(503).json({ error: "MonoPay is not configured yet. Please use another payment method." });
    }

    const user = await storage.getUserByTgId(tgId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const normalizedTier = tier.toUpperCase();
    let amountUAH = MONOPAY_PRICES_UAH[normalizedTier]?.[paymentPeriod] || 0;
    if (!amountUAH) {
      return res.status(400).json({ error: "Could not calculate price" });
    }

    const amountUSD = (amountUAH / UAH_PER_USD).toFixed(2);

    try {
      const payment = await storage.createPayment({
        userId: user.id,
        tier: normalizedTier,
        amountUsdt: amountUSD,
        txHash: null,
        period: paymentPeriod,
        status: "pending",
      });

      const appUrl = process.env.APP_URL || 'https://darkshare.store';
      const reference = `DS-${payment.id}`;

      const monoResponse = await fetch("https://api.monobank.ua/api/merchant/invoice/create", {
        method: "POST",
        headers: {
          "X-Token": monoToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amountUAH * 100,
          ccy: 980,
          merchantPaymInfo: {
            reference,
            destination: `DARKSHARE ${normalizedTier} ${paymentPeriod}`,
            comment: "DARKSHARE subscription",
          },
          redirectUrl: `${appUrl}/pricing?payment=success`,
          webHookUrl: `${appUrl}/api/payments/monopay/webhook`,
          saveCardData: {
            saveCard: true,
            walletId: `darkshare_${user.id}`,
          },
        }),
      });

      if (!monoResponse.ok) {
        const errorText = await monoResponse.text();
        console.error("MonoPay bot API error:", monoResponse.status, errorText);
        return res.status(502).json({ error: "Failed to create MonoPay invoice" });
      }

      const monoData = await monoResponse.json();

      if (monoData.invoiceId && pool) {
        await pool.query(`UPDATE ds_payments SET invoice_id = $1 WHERE id = $2`, [monoData.invoiceId, payment.id]);
      }

      if (botInstance) {
        const msgText = `\u{1F4B3} MonoPay \u0437\u0430\u044F\u0432\u043A\u0430 #${payment.id}\n\n` +
          `\u{1F464} @${user.username || "\u2014"} (TG: ${user.tgId})\n` +
          `\u{1F4E6} ${normalizedTier} (${paymentPeriod === "yearly" ? "\u0440\u0456\u043A" : "\u043C\u0456\u0441\u044F\u0446\u044C"})\n` +
          `\u{1F4B0} ${amountUAH} UAH (~$${amountUSD})\n` +
          `\u{1F517} Invoice: ${monoData.invoiceId || "\u2014"}\n` +
          `\u{1F4F1} Source: Bot`;

        for (const adminId of ADMIN_IDS) {
          try {
            await botInstance.telegram.sendMessage(adminId, msgText);
          } catch (e) {
            console.log(`Failed to notify admin ${adminId}:`, e);
          }
        }
      }

      res.json({ invoiceId: monoData.invoiceId, pageUrl: monoData.pageUrl });
    } catch (err: any) {
      console.error("MonoPay bot create error:", err);
      res.status(500).json({ error: "Failed to create MonoPay payment" });
    }
  });

  app.post("/api/payments/monopay/webhook", async (req, res) => {
    const { invoiceId, status, amount, ccy, reference } = req.body;
    console.log("MonoPay webhook received:", JSON.stringify({ invoiceId, status, amount, ccy, reference }));

    try {
      if (status === "success" && reference) {
        const paymentIdMatch = reference.match(/^DS-(?:AUDIT-)?(\d+)$/);
        const isAuditPayment = /^DS-AUDIT-/.test(reference);
        if (paymentIdMatch) {
          const paymentId = parseInt(paymentIdMatch[1]);
          const payment = await storage.getPaymentById(paymentId);

          if (payment && payment.status === "pending") {
            const MONO_TOKEN = process.env.MONOBANK_TOKEN;
            if (MONO_TOKEN) {
              try {
                const verifyResp = await fetch(`https://api.monobank.ua/api/merchant/invoice/status?invoiceId=${invoiceId}`, {
                  headers: { "X-Token": MONO_TOKEN },
                });
                const verifyData = await verifyResp.json() as any;
                if (verifyData.status !== "success") {
                  console.error("MonoPay webhook: API verification failed, status:", verifyData.status);
                  return res.status(403).json({ error: "Payment not verified" });
                }
              } catch (verifyErr) {
                console.error("MonoPay webhook: API verification error — rejecting:", verifyErr);
                return res.status(500).json({ error: "Payment verification failed" });
              }
            } else {
              console.error("MonoPay webhook: MONOBANK_TOKEN not set — cannot verify payment");
              return res.status(500).json({ error: "Payment verification unavailable" });
            }
            await storage.updatePaymentStatus(paymentId, "approved");

            if (payment.userId && isAuditPayment) {
              const buyer = await storage.getUserById(payment.userId);
              const newCredits = (buyer?.requestsLeft || 0) + SINGLE_AUDIT_CREDITS;
              await storage.updateUser(payment.userId, { requestsLeft: newCredits } as any);
              if (buyer && botInstance) {
                try {
                  const lang = buyer.lang || "uk";
                  const m: Record<string, string> = {
                    uk: `🧾 *Оплату підтверджено!*\n\nДодано *${SINGLE_AUDIT_CREDITS}* перевірок до твого балансу.\nЗагалом доступно: *${newCredits}*`,
                    ru: `🧾 *Оплата подтверждена!*\n\nДобавлено *${SINGLE_AUDIT_CREDITS}* проверок к твоему балансу.\nВсего доступно: *${newCredits}*`,
                    en: `🧾 *Payment confirmed!*\n\nAdded *${SINGLE_AUDIT_CREDITS}* checks to your balance.\nTotal available: *${newCredits}*`,
                    es: `🧾 *Pago confirmado!*\n\nAñadidas *${SINGLE_AUDIT_CREDITS}* comprobaciones.\nDisponibles: *${newCredits}*`,
                    de: `🧾 *Zahlung bestätigt!*\n\n*${SINGLE_AUDIT_CREDITS}* Checks gutgeschrieben.\nVerfügbar: *${newCredits}*`,
                  };
                  await botInstance.telegram.sendMessage(buyer.tgId, m[lang] || m.en, { parse_mode: "Markdown" });
                } catch { /* ignore */ }
              }
            } else if (payment.userId) {
              const tier = payment.tier?.toUpperCase() || "PRO";
              const requests = TIER_REQUESTS[tier] || TIER_REQUESTS.PRO;
              const periodDays = (payment as any).period === "yearly" ? 365 : 30;
              const expiryDate = new Date(Date.now() + periodDays * 24 * 60 * 60 * 1000);
              const updateData: any = { tier, requestsLeft: requests, subscriptionExpiresAt: expiryDate, autoRenew: true };

              if (req.body.cardToken) {
                updateData.cardToken = req.body.cardToken;
              }

              await storage.updateUser(payment.userId, updateData);

              const user = await storage.getUserById(payment.userId);
              if (user && botInstance) {
                try {
                  const lang = user.lang || "uk";
                  const expiryStr = expiryDate.toLocaleDateString("uk-UA");
                  const amountUAH_display = amount ? (amount / 100).toFixed(2) : "?";
                  const receiptTexts: Record<string, string> = {
                    uk: `🧾 *КВИТАНЦІЯ DARKSHARE*\n━━━━━━━━━━━━━━━━━━━━\n\n✅ Оплату підтверджено!\n\n📦 Тариф: *${tier}*\n💰 Сума: ${amountUAH_display} UAH\n🔢 Запитів: ${requests}/день\n📅 Діє до: ${expiryStr}\n🔄 Автоподовження: увімкнено\n\n━━━━━━━━━━━━━━━━━━━━\nДякуємо за довіру! 🙏`,
                    ru: `🧾 *КВИТАНЦИЯ DARKSHARE*\n━━━━━━━━━━━━━━━━━━━━\n\n✅ Оплата подтверждена!\n\n📦 Тариф: *${tier}*\n💰 Сумма: ${amountUAH_display} UAH\n🔢 Запросов: ${requests}/день\n📅 Действует до: ${expiryStr}\n🔄 Автопродление: включено\n\n━━━━━━━━━━━━━━━━━━━━\nСпасибо за доверие! 🙏`,
                    en: `🧾 *DARKSHARE RECEIPT*\n━━━━━━━━━━━━━━━━━━━━\n\n✅ Payment confirmed!\n\n📦 Plan: *${tier}*\n💰 Amount: ${amountUAH_display} UAH\n🔢 Requests: ${requests}/day\n📅 Valid until: ${expiryStr}\n🔄 Auto-renewal: enabled\n\n━━━━━━━━━━━━━━━━━━━━\nThank you for your trust! 🙏`,
                    es: `🧾 *RECIBO DARKSHARE*\n━━━━━━━━━━━━━━━━━━━━\n\n✅ ¡Pago confirmado!\n\n📦 Plan: *${tier}*\n💰 Monto: ${amountUAH_display} UAH\n🔢 Solicitudes: ${requests}/día\n📅 Válido hasta: ${expiryStr}\n🔄 Renovación automática: activada\n\n━━━━━━━━━━━━━━━━━━━━\n¡Gracias por su confianza! 🙏`,
                    de: `🧾 *DARKSHARE QUITTUNG*\n━━━━━━━━━━━━━━━━━━━━\n\n✅ Zahlung bestätigt!\n\n📦 Tarif: *${tier}*\n💰 Betrag: ${amountUAH_display} UAH\n🔢 Anfragen: ${requests}/Tag\n📅 Gültig bis: ${expiryStr}\n🔄 Automatische Verlängerung: aktiviert\n\n━━━━━━━━━━━━━━━━━━━━\nVielen Dank für Ihr Vertrauen! 🙏`,
                  };
                  const receiptText = receiptTexts[lang] || receiptTexts["en"];
                  await botInstance.telegram.sendMessage(user.tgId, receiptText, { parse_mode: "Markdown" });
                } catch (e) { /* ignore */ }
              }
            }

            if (botInstance) {
              const amountUAH = amount ? (amount / 100).toFixed(2) : "?";
              const msgText = `\u2705 MonoPay оплата #${paymentId} підтверджена\n\n` +
                `\u{1F4B0} ${amountUAH} UAH\n` +
                `\u{1F4E6} ${payment.tier}\n` +
                `\u{1F517} Invoice: ${invoiceId || "—"}`;
              for (const adminId of ADMIN_IDS) {
                try {
                  await botInstance.telegram.sendMessage(adminId, msgText);
                } catch (e) {
                  console.log(`Failed to notify admin ${adminId}:`, e);
                }
              }
            }
          }
        }
      }

      res.json({ status: "ok" });
    } catch (err: any) {
      console.error("MonoPay webhook error:", err);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });

  async function processAutoRenewals() {
    try {
      const monoToken = process.env.MONOBANK_TOKEN;
      if (!monoToken) return;

      if (!pool) return;
      
      const result = await pool.query(
        `SELECT u.* FROM ds_users u WHERE u.auto_renew = true AND u.card_token IS NOT NULL AND u.subscription_expires_at IS NOT NULL AND u.subscription_expires_at <= NOW() + INTERVAL '1 day' AND u.tier != 'FREE' AND NOT EXISTS (SELECT 1 FROM ds_payments p WHERE p.user_id = u.id AND p.status = 'pending' AND p.created_at > NOW() - INTERVAL '2 days')`
      );
      
      const usersToRenew = result.rows;
      
      for (const user of usersToRenew) {
        try {
          const tier = user.tier || "PRO";
          const uahPrices: Record<string, number> = { PRO: 410, ENTERPRISE: 1435, GROUPS: 2255 };
          const amountUAH = uahPrices[tier] || 410;
          const amountUSD = (amountUAH / 41).toFixed(2);
          
          const payment = await storage.createPayment({
            userId: user.id,
            tier,
            amountUsdt: amountUSD,
            txHash: null,
            status: "pending",
          });
          
          const appUrl = process.env.APP_URL || 'https://darkshare.store';
          const reference = `DS-${payment.id}`;
          
          const monoResponse = await fetch("https://api.monobank.ua/api/merchant/wallet/payment", {
            method: "POST",
            headers: {
              "X-Token": monoToken,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              cardToken: user.card_token,
              amount: amountUAH * 100,
              ccy: 980,
              initiationKind: "merchant",
              webHookUrl: `${appUrl}/api/payments/monopay/webhook`,
              merchantPaymInfo: {
                reference,
                destination: `DARKSHARE ${tier} auto-renewal`,
                comment: "DARKSHARE subscription auto-renewal",
              },
            }),
          });
          
          if (!monoResponse.ok) {
            const errorText = await monoResponse.text();
            console.error(`Auto-renewal failed for user ${user.id}:`, errorText);
            
            if (botInstance) {
              const lang = user.lang || "uk";
              const failTexts: Record<string, string> = {
                uk: `⚠️ *Автоподовження не вдалося*\n\nВаша підписка ${tier} не була автоматично подовжена. Будь ласка, оновіть спосіб оплати.`,
                ru: `⚠️ *Автопродление не удалось*\n\nВаша подписка ${tier} не была автоматически продлена. Пожалуйста, обновите способ оплаты.`,
                en: `⚠️ *Auto-renewal failed*\n\nYour ${tier} subscription could not be automatically renewed. Please update your payment method.`,
                es: `⚠️ *Renovación automática fallida*\n\nSu suscripción ${tier} no pudo renovarse automáticamente. Actualice su método de pago.`,
                de: `⚠️ *Automatische Verlängerung fehlgeschlagen*\n\nIhr ${tier}-Abonnement konnte nicht automatisch verlängert werden. Bitte aktualisieren Sie Ihre Zahlungsmethode.`,
              };
              const failText = failTexts[lang] || failTexts["en"];
              try {
                await botInstance.telegram.sendMessage(user.tg_id, failText, { parse_mode: "Markdown" });
              } catch (e) { /* ignore */ }
            }
            
            await storage.updateUser(user.id, { autoRenew: false });
            continue;
          }
          
          console.log(`Auto-renewal initiated for user ${user.id}, tier ${tier}, payment #${payment.id}`);
          
        } catch (err) {
          console.error(`Auto-renewal error for user ${user.id}:`, err);
        }
      }
    } catch (err) {
      console.error("Auto-renewal scheduler error:", err);
    }
  }

  setInterval(processAutoRenewals, 60 * 60 * 1000);

  // --- Subscription expiry checker + 5-day reminder ---
  async function checkSubscriptionExpiry() {
    if (!pool) return;
    try {
      const expiredResult = await pool.query(
        `SELECT * FROM ds_users WHERE tier != 'FREE' AND subscription_expires_at IS NOT NULL AND subscription_expires_at < NOW() AND auto_renew = false`
      );
      for (const user of expiredResult.rows) {
        try {
          await storage.updateUser(user.id, { tier: "FREE", requestsLeft: 5, autoRenew: false } as any);
          console.log(`Subscription expired for user ${user.id}, downgraded to FREE`);

          if (botInstance && user.tg_id) {
            const lang = user.lang || "uk";
            const expiredTexts: Record<string, string> = {
              uk: `⚠️ *Підписка закінчилась*\n\nВаш тариф *${user.tier}* закінчився. Ви переведені на безкоштовний план (5 перевірок/день).\n\n💡 Поновіть підписку, щоб продовжити користуватися всіма функціями.`,
              ru: `⚠️ *Подписка истекла*\n\nВаш тариф *${user.tier}* истёк. Вы переведены на бесплатный план (5 проверок/день).\n\n💡 Обновите подписку, чтобы продолжить использование всех функций.`,
              en: `⚠️ *Subscription expired*\n\nYour *${user.tier}* plan has expired. You've been downgraded to the free plan (5 checks/day).\n\n💡 Renew your subscription to keep using all features.`,
              es: `⚠️ *Suscripción expirada*\n\nSu plan *${user.tier}* ha expirado. Ha sido degradado al plan gratuito (5 verificaciones/día).\n\n💡 Renueve su suscripción para seguir usando todas las funciones.`,
              de: `⚠️ *Abonnement abgelaufen*\n\nIhr *${user.tier}*-Plan ist abgelaufen. Sie wurden auf den kostenlosen Plan herabgestuft (5 Prüfungen/Tag).\n\n💡 Verlängern Sie Ihr Abonnement, um alle Funktionen weiterhin nutzen zu können.`,
            };
            try {
              await botInstance.telegram.sendMessage(user.tg_id, expiredTexts[lang] || expiredTexts["en"], { parse_mode: "Markdown" });
            } catch (e) { /* ignore */ }
          }
        } catch (err) {
          console.error(`Failed to downgrade user ${user.id}:`, err);
        }
      }

      const reminderResult = await pool.query(
        `SELECT * FROM ds_users WHERE tier != 'FREE' AND subscription_expires_at IS NOT NULL AND subscription_expires_at > NOW() AND subscription_expires_at <= NOW() + INTERVAL '5 days' AND (last_reminder_sent IS NULL OR last_reminder_sent < NOW() - INTERVAL '24 hours')`
      );
      for (const user of reminderResult.rows) {
        try {
          if (botInstance && user.tg_id) {
            const lang = user.lang || "uk";
            const daysLeft = Math.ceil((new Date(user.subscription_expires_at).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
            const expiryStr = new Date(user.subscription_expires_at).toLocaleDateString("uk-UA");
            const reminderTexts: Record<string, string> = {
              uk: `🔔 *Нагадування про підписку*\n\nВаш тариф *${user.tier}* закінчується через *${daysLeft}* ${daysLeft === 1 ? "день" : daysLeft < 5 ? "дні" : "днів"} (${expiryStr}).\n\n${user.auto_renew ? "🔄 Автоподовження увімкнено — оплата буде списана автоматично." : "💡 Поновіть підписку, щоб не втратити доступ до функцій.\n\n/buy — оновити тариф"}`,
              ru: `🔔 *Напоминание о подписке*\n\nВаш тариф *${user.tier}* заканчивается через *${daysLeft}* ${daysLeft === 1 ? "день" : daysLeft < 5 ? "дня" : "дней"} (${expiryStr}).\n\n${user.auto_renew ? "🔄 Автопродление включено — оплата будет списана автоматически." : "💡 Обновите подписку, чтобы не потерять доступ к функциям.\n\n/buy — обновить тариф"}`,
              en: `🔔 *Subscription reminder*\n\nYour *${user.tier}* plan expires in *${daysLeft}* day${daysLeft === 1 ? "" : "s"} (${expiryStr}).\n\n${user.auto_renew ? "🔄 Auto-renewal is enabled — you'll be charged automatically." : "💡 Renew your subscription to keep access to all features.\n\n/buy — upgrade plan"}`,
              es: `🔔 *Recordatorio de suscripción*\n\nSu plan *${user.tier}* vence en *${daysLeft}* día${daysLeft === 1 ? "" : "s"} (${expiryStr}).\n\n${user.auto_renew ? "🔄 La renovación automática está activada." : "💡 Renueve su suscripción para mantener el acceso.\n\n/buy — actualizar plan"}`,
              de: `🔔 *Abonnement-Erinnerung*\n\nIhr *${user.tier}*-Plan läuft in *${daysLeft}* Tag${daysLeft === 1 ? "" : "en"} ab (${expiryStr}).\n\n${user.auto_renew ? "🔄 Automatische Verlängerung ist aktiviert." : "💡 Verlängern Sie Ihr Abonnement, um den Zugang zu behalten.\n\n/buy — Plan erneuern"}`,
            };
            try {
              await botInstance.telegram.sendMessage(user.tg_id, reminderTexts[lang] || reminderTexts["en"], { parse_mode: "Markdown" });
              await pool.query(`UPDATE ds_users SET last_reminder_sent = NOW() WHERE id = $1`, [user.id]);
            } catch (e) { /* ignore */ }
          }
        } catch (err) {
          console.error(`Failed to send reminder to user ${user.id}:`, err);
        }
      }
    } catch (err) {
      console.error("Subscription expiry checker error:", err);
    }
  }

  setInterval(checkSubscriptionExpiry, 60 * 60 * 1000);
  setTimeout(checkSubscriptionExpiry, 30000);

  app.post("/api/payments/monopay/check-status", async (req, res) => {
    const botToken = req.headers["x-bot-token"];
    const isBot = botToken === process.env.TELEGRAM_BOT_TOKEN;
    const isAuthenticated = req.session?.userId;
    if (!isBot && !isAuthenticated) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { paymentId, tgId } = req.body;
    const monoToken = process.env.MONOBANK_TOKEN;
    if (!monoToken) return res.status(503).json({ error: "MonoPay not configured" });

    try {
      let payment: any;
      if (paymentId) {
        payment = await storage.getPaymentById(paymentId);
      } else if (tgId) {
        const user = await storage.getUserByTgId(tgId);
        if (!user) return res.status(404).json({ error: "User not found" });
        if (pool) {
          const result = await pool.query(
            `SELECT * FROM ds_payments WHERE user_id = $1 AND status = 'pending' AND invoice_id IS NOT NULL ORDER BY created_at DESC LIMIT 1`,
            [user.id]
          );
          if (result.rows.length > 0) {
            const row = result.rows[0];
            payment = {
              id: row.id,
              userId: row.user_id,
              tier: row.tier,
              amountUsdt: row.amount_usdt,
              txHash: row.tx_hash,
              screenshotUrl: row.screenshot_url,
              invoiceId: row.invoice_id,
              period: row.period,
              status: row.status,
              createdAt: row.created_at,
            };
          }
        }
      }

      if (!payment || !payment.invoiceId) {
        return res.status(404).json({ error: "No pending payment found" });
      }

      if (payment.status !== "pending") {
        return res.json({ status: payment.status, alreadyProcessed: true });
      }

      const statusResponse = await fetch(`https://api.monobank.ua/api/merchant/invoice/status?invoiceId=${payment.invoiceId}`, {
        headers: { "X-Token": monoToken },
      });

      if (!statusResponse.ok) {
        return res.status(502).json({ error: "Failed to check MonoPay status" });
      }

      const statusData = await statusResponse.json();
      console.log("MonoPay status check:", JSON.stringify({ invoiceId: payment.invoiceId, status: statusData.status }));

      if (statusData.status === "success") {
        await storage.updatePaymentStatus(payment.id, "approved");

        if (payment.userId) {
          const tier = payment.tier?.toUpperCase() || "PRO";
          const requests = TIER_REQUESTS[tier] || TIER_REQUESTS.PRO;
          const periodDays = payment.period === "yearly" ? 365 : 30;
          const expiryDate = new Date(Date.now() + periodDays * 24 * 60 * 60 * 1000);
          const updateData: any = { tier, requestsLeft: requests, subscriptionExpiresAt: expiryDate, autoRenew: true };

          await storage.updateUser(payment.userId, updateData);

          const user = await storage.getUserById(payment.userId);
          if (user && botInstance) {
            try {
              const lang = user.lang || "uk";
              const expiryStr = expiryDate.toLocaleDateString("uk-UA");
              const requestsDisplay = tier === "ENTERPRISE" || tier === "GROUPS" ? "\u221E" : "50";
              const amountDisplay = statusData.amount ? (statusData.amount / 100).toFixed(2) + " UAH" : `$${payment.amountUsdt} USD`;
              const receiptTexts: Record<string, string> = {
                uk: `\u{1F9FE} *\u041A\u0412\u0418\u0422\u0410\u041D\u0426\u0406\u042F DARKSHARE*\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\n\u2705 \u041E\u043F\u043B\u0430\u0442\u0443 \u043F\u0456\u0434\u0442\u0432\u0435\u0440\u0434\u0436\u0435\u043D\u043E!\n\n\u{1F4E6} \u0422\u0430\u0440\u0438\u0444: *${tier}*\n\u{1F4B0} \u0421\u0443\u043C\u0430: ${amountDisplay}\n\u{1F522} \u0417\u0430\u043F\u0438\u0442\u0456\u0432: ${requestsDisplay}/\u0434\u0435\u043D\u044C\n\u{1F4C5} \u0414\u0456\u0454 \u0434\u043E: ${expiryStr}\n\u{1F194} \u041F\u043B\u0430\u0442\u0456\u0436: #${payment.id}\n\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\u0414\u044F\u043A\u0443\u0454\u043C\u043E \u0437\u0430 \u0434\u043E\u0432\u0456\u0440\u0443! \u{1F64F}`,
                ru: `\u{1F9FE} *\u041A\u0412\u0418\u0422\u0410\u041D\u0426\u0418\u042F DARKSHARE*\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\n\u2705 \u041E\u043F\u043B\u0430\u0442\u0430 \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0430!\n\n\u{1F4E6} \u0422\u0430\u0440\u0438\u0444: *${tier}*\n\u{1F4B0} \u0421\u0443\u043C\u043C\u0430: ${amountDisplay}\n\u{1F522} \u0417\u0430\u043F\u0440\u043E\u0441\u043E\u0432: ${requestsDisplay}/\u0434\u0435\u043D\u044C\n\u{1F4C5} \u0414\u0435\u0439\u0441\u0442\u0432\u0443\u0435\u0442 \u0434\u043E: ${expiryStr}\n\u{1F194} \u041F\u043B\u0430\u0442\u0451\u0436: #${payment.id}\n\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\u0421\u043F\u0430\u0441\u0438\u0431\u043E \u0437\u0430 \u0434\u043E\u0432\u0435\u0440\u0438\u0435! \u{1F64F}`,
                en: `\u{1F9FE} *DARKSHARE RECEIPT*\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\n\u2705 Payment confirmed!\n\n\u{1F4E6} Plan: *${tier}*\n\u{1F4B0} Amount: ${amountDisplay}\n\u{1F522} Requests: ${requestsDisplay}/day\n\u{1F4C5} Valid until: ${expiryStr}\n\u{1F194} Payment: #${payment.id}\n\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\nThank you for your trust! \u{1F64F}`,
                es: `\u{1F9FE} *RECIBO DARKSHARE*\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\n\u2705 \u00A1Pago confirmado!\n\n\u{1F4E6} Plan: *${tier}*\n\u{1F4B0} Monto: ${amountDisplay}\n\u{1F522} Solicitudes: ${requestsDisplay}/d\u00EDa\n\u{1F4C5} V\u00E1lido hasta: ${expiryStr}\n\u{1F194} Pago: #${payment.id}\n\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\u00A1Gracias por su confianza! \u{1F64F}`,
                de: `\u{1F9FE} *DARKSHARE QUITTUNG*\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\n\u2705 Zahlung best\u00E4tigt!\n\n\u{1F4E6} Tarif: *${tier}*\n\u{1F4B0} Betrag: ${amountDisplay}\n\u{1F522} Anfragen: ${requestsDisplay}/Tag\n\u{1F4C5} G\u00FCltig bis: ${expiryStr}\n\u{1F194} Zahlung: #${payment.id}\n\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\nVielen Dank f\u00FCr Ihr Vertrauen! \u{1F64F}`,
              };
              const receiptText = receiptTexts[lang] || receiptTexts["en"];
              await botInstance.telegram.sendMessage(user.tgId, receiptText, { parse_mode: "Markdown" });
            } catch (e) { console.log("Failed to send receipt:", e); }
          }

          if (botInstance) {
            const amountStr = statusData.amount ? (statusData.amount / 100).toFixed(2) + " UAH" : `$${payment.amountUsdt}`;
            const msgText = `\u2705 MonoPay \u043E\u043F\u043B\u0430\u0442\u0430 #${payment.id} \u043F\u0456\u0434\u0442\u0432\u0435\u0440\u0434\u0436\u0435\u043D\u0430 (manual check)\n\n\u{1F4B0} ${amountStr}\n\u{1F4E6} ${payment.tier}\n\u{1F517} Invoice: ${payment.invoiceId || "\u2014"}`;
            for (const adminId of ADMIN_IDS) {
              try { await botInstance.telegram.sendMessage(adminId, msgText); } catch (e) {}
            }
          }
        }

        return res.json({ status: "success", processed: true });
      } else if (statusData.status === "expired" || statusData.status === "failure") {
        await storage.updatePaymentStatus(payment.id, "expired");
        return res.json({ status: statusData.status, processed: false });
      }

      return res.json({ status: statusData.status || "pending", processed: false });
    } catch (err: any) {
      console.error("MonoPay status check error:", err);
      res.status(500).json({ error: "Status check failed" });
    }
  });

  async function checkPendingMonoPayments() {
    const monoToken = process.env.MONOBANK_TOKEN;
    if (!monoToken || !pool) return;

    try {
      const result = await pool.query(
        `SELECT * FROM ds_payments WHERE status = 'pending' AND invoice_id IS NOT NULL AND created_at > NOW() - INTERVAL '1 hour'`
      );

      for (const row of result.rows) {
        try {
          const statusResponse = await fetch(`https://api.monobank.ua/api/merchant/invoice/status?invoiceId=${row.invoice_id}`, {
            headers: { "X-Token": monoToken },
          });

          if (!statusResponse.ok) continue;
          const statusData = await statusResponse.json();

          if (statusData.status === "success") {
            await storage.updatePaymentStatus(row.id, "approved");

            if (row.user_id) {
              const tier = row.tier?.toUpperCase() || "PRO";
              const requests = TIER_REQUESTS[tier] || TIER_REQUESTS.PRO;
              const periodDays = row.period === "yearly" ? 365 : 30;
              const expiryDate = new Date(Date.now() + periodDays * 24 * 60 * 60 * 1000);

              await storage.updateUser(row.user_id, { tier, requestsLeft: requests, subscriptionExpiresAt: expiryDate, autoRenew: true } as any);

              const user = await storage.getUserById(row.user_id);
              if (user && botInstance) {
                try {
                  const lang = user.lang || "uk";
                  const expiryStr = expiryDate.toLocaleDateString("uk-UA");
                  const requestsDisplay = tier === "ENTERPRISE" || tier === "GROUPS" ? "\u221E" : "50";
                  const amountDisplay = statusData.amount ? (statusData.amount / 100).toFixed(2) + " UAH" : `$${row.amount_usdt} USD`;
                  const receiptTexts: Record<string, string> = {
                    uk: `\u{1F9FE} *\u041A\u0412\u0418\u0422\u0410\u041D\u0426\u0406\u042F DARKSHARE*\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\n\u2705 \u041E\u043F\u043B\u0430\u0442\u0443 \u043F\u0456\u0434\u0442\u0432\u0435\u0440\u0434\u0436\u0435\u043D\u043E!\n\n\u{1F4E6} \u0422\u0430\u0440\u0438\u0444: *${tier}*\n\u{1F4B0} \u0421\u0443\u043C\u0430: ${amountDisplay}\n\u{1F522} \u0417\u0430\u043F\u0438\u0442\u0456\u0432: ${requestsDisplay}/\u0434\u0435\u043D\u044C\n\u{1F4C5} \u0414\u0456\u0454 \u0434\u043E: ${expiryStr}\n\u{1F194} \u041F\u043B\u0430\u0442\u0456\u0436: #${row.id}\n\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\u0414\u044F\u043A\u0443\u0454\u043C\u043E \u0437\u0430 \u0434\u043E\u0432\u0456\u0440\u0443! \u{1F64F}`,
                    ru: `\u{1F9FE} *\u041A\u0412\u0418\u0422\u0410\u041D\u0426\u0418\u042F DARKSHARE*\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\n\u2705 \u041E\u043F\u043B\u0430\u0442\u0430 \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0430!\n\n\u{1F4E6} \u0422\u0430\u0440\u0438\u0444: *${tier}*\n\u{1F4B0} \u0421\u0443\u043C\u043C\u0430: ${amountDisplay}\n\u{1F522} \u0417\u0430\u043F\u0440\u043E\u0441\u043E\u0432: ${requestsDisplay}/\u0434\u0435\u043D\u044C\n\u{1F4C5} \u0414\u0435\u0439\u0441\u0442\u0432\u0443\u0435\u0442 \u0434\u043E: ${expiryStr}\n\u{1F194} \u041F\u043B\u0430\u0442\u0451\u0436: #${row.id}\n\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\u0421\u043F\u0430\u0441\u0438\u0431\u043E \u0437\u0430 \u0434\u043E\u0432\u0435\u0440\u0438\u0435! \u{1F64F}`,
                    en: `\u{1F9FE} *DARKSHARE RECEIPT*\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\n\u2705 Payment confirmed!\n\n\u{1F4E6} Plan: *${tier}*\n\u{1F4B0} Amount: ${amountDisplay}\n\u{1F522} Requests: ${requestsDisplay}/day\n\u{1F4C5} Valid until: ${expiryStr}\n\u{1F194} Payment: #${row.id}\n\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\nThank you for your trust! \u{1F64F}`,
                    es: `\u{1F9FE} *RECIBO DARKSHARE*\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\n\u2705 \u00A1Pago confirmado!\n\n\u{1F4E6} Plan: *${tier}*\n\u{1F4B0} Monto: ${amountDisplay}\n\u{1F522} Solicitudes: ${requestsDisplay}/d\u00EDa\n\u{1F4C5} V\u00E1lido hasta: ${expiryStr}\n\u{1F194} Pago: #${row.id}\n\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\u00A1Gracias por su confianza! \u{1F64F}`,
                    de: `\u{1F9FE} *DARKSHARE QUITTUNG*\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\n\u2705 Zahlung best\u00E4tigt!\n\n\u{1F4E6} Tarif: *${tier}*\n\u{1F4B0} Betrag: ${amountDisplay}\n\u{1F522} Anfragen: ${requestsDisplay}/Tag\n\u{1F4C5} G\u00FCltig bis: ${expiryStr}\n\u{1F194} Zahlung: #${row.id}\n\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\nVielen Dank f\u00FCr Ihr Vertrauen! \u{1F64F}`,
                  };
                  const receiptText = receiptTexts[lang] || receiptTexts["en"];
                  await botInstance.telegram.sendMessage(user.tgId, receiptText, { parse_mode: "Markdown" });
                } catch (e) { console.log("Failed to send auto-receipt:", e); }
              }

              if (botInstance) {
                const amountStr = statusData.amount ? (statusData.amount / 100).toFixed(2) + " UAH" : `$${row.amount_usdt}`;
                const msgText = `\u2705 MonoPay \u043E\u043F\u043B\u0430\u0442\u0430 #${row.id} \u043F\u0456\u0434\u0442\u0432\u0435\u0440\u0434\u0436\u0435\u043D\u0430 (auto-check)\n\n\u{1F4B0} ${amountStr}\n\u{1F4E6} ${row.tier}`;
                for (const adminId of ADMIN_IDS) {
                  try { await botInstance.telegram.sendMessage(adminId, msgText); } catch (e) {}
                }
              }
            }
          } else if (statusData.status === "expired" || statusData.status === "failure") {
            await storage.updatePaymentStatus(row.id, "expired");
          }

          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (e) {
          console.log(`Failed to check payment ${row.id}:`, e);
        }
      }
    } catch (err) {
      console.error("Pending payments check error:", err);
    }
  }

  setInterval(checkPendingMonoPayments, 2 * 60 * 1000);

  // ==================== ADMIN API ROUTES ====================
  
  const ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD || "").trim();
  const ADMIN_TOKEN_SECRET = (process.env.ADMIN_TOKEN_SECRET || "").trim();
  const ADMIN_LOGIN_ENABLED = ADMIN_PASSWORD.length >= 8 && ADMIN_TOKEN_SECRET.length >= 16;
  console.log(`[admin] login enabled=${ADMIN_LOGIN_ENABLED} pwdLen=${ADMIN_PASSWORD.length} tokenLen=${ADMIN_TOKEN_SECRET.length}`);
  if (!ADMIN_LOGIN_ENABLED) {
    console.warn("[admin] ADMIN_PASSWORD/ADMIN_TOKEN_SECRET not configured — admin password login disabled. Use Telegram ADMIN_IDS to access admin features.");
  }

  const timingSafeEqualStr = (a: string, b: string): boolean => {
    try {
      const ab = Buffer.from(a, "utf8");
      const bb = Buffer.from(b, "utf8");
      if (ab.length !== bb.length) {
        crypto.timingSafeEqual(ab, ab);
        return false;
      }
      return crypto.timingSafeEqual(ab, bb);
    } catch { return false; }
  };

  app.post("/api/admin/login", (req, res) => {
    const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";
    if (rateLimit(`admin-login:${ip}`, 5, 15 * 60 * 1000)) {
      return res.status(429).json({ success: false, error: "Too many attempts. Try again later." });
    }
    if (!ADMIN_LOGIN_ENABLED) {
      return res.status(503).json({ success: false, error: "Admin password login is disabled" });
    }
    const password = (typeof req.body?.password === "string" ? req.body.password : "").trim();
    if (!password || !timingSafeEqualStr(password, ADMIN_PASSWORD)) {
      console.warn(`[admin] login fail: submittedLen=${password.length} expectedLen=${ADMIN_PASSWORD.length} match=${password === ADMIN_PASSWORD}`);
      return res.status(401).json({ success: false, error: "Invalid password" });
    }
    return res.json({ success: true, token: ADMIN_TOKEN_SECRET });
  });

  const requireAdmin: express.RequestHandler = async (req, res, next) => {
    const authHeader = (req.headers["x-admin-token"] as string) || "";
    if (ADMIN_LOGIN_ENABLED && authHeader && timingSafeEqualStr(authHeader, ADMIN_TOKEN_SECRET)) {
      return next();
    }
    const authReq = req as AuthenticatedRequest;
    if (authReq.user && ADMIN_IDS.includes(authReq.user.tgId)) {
      return next();
    }
    res.status(403).json({ error: "Access denied" });
  };

  app.get("/api/admin/verify", loadUser, async (req, res) => {
    const authHeader = (req.headers["x-admin-token"] as string) || "";
    if (ADMIN_LOGIN_ENABLED && authHeader && timingSafeEqualStr(authHeader, ADMIN_TOKEN_SECRET)) {
      return res.json({ isAdmin: true });
    }
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return res.json({ isAdmin: false });
    }
    const isAdmin = ADMIN_IDS.includes(authReq.user.tgId);
    res.json({ isAdmin });
  });

  // Admin stats
  app.get("/api/admin/stats", requireAdmin, async (req, res) => {
    const stats = await storage.getStats();
    res.json(stats);
  });

  // Get all coupons
  app.get("/api/admin/coupons", requireAdmin, async (req, res) => {
    const coupons = await storage.getCoupons();
    res.json(coupons);
  });

  // Create coupon
  app.post("/api/admin/coupons", requireAdmin, async (req, res) => {
    const { code, type, value, tier, maxUses, expiresAt, description, imageUrl, isPublic } = req.body;
    if (!code || !type || value === undefined) {
      return res.status(400).json({ error: "Code, type and value are required" });
    }
    try {
      const coupon = await storage.createCoupon({
        code,
        type,
        value: parseInt(value),
        tier: tier || null,
        maxUses: maxUses ? parseInt(maxUses) : 1,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive: true,
        description: description || null,
        imageUrl: imageUrl || null,
        isPublic: isPublic || false,
      });
      res.json(coupon);
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Failed to create coupon" });
    }
  });

  // Delete coupon
  app.delete("/api/admin/coupons/:id", requireAdmin, async (req, res) => {
    await storage.deleteCoupon(parseInt(req.params.id));
    res.json({ success: true });
  });

  // Update coupon (full edit support)
  app.patch("/api/admin/coupons/:id", requireAdmin, async (req, res) => {
    try {
      const allowedFields = ["code", "type", "value", "tier", "maxUses", "expiresAt", "description", "imageUrl", "isPublic", "isActive"];
      const updates: Record<string, any> = {};
      for (const key of allowedFields) {
        if (req.body[key] === undefined) continue;
        const val = req.body[key];
        if (key === "value") {
          const num = parseInt(val);
          if (isNaN(num) || num < 1 || num > 1000000) return res.status(400).json({ error: "Invalid value (1-1000000)" });
          updates[key] = num;
        } else if (key === "maxUses") {
          const num = parseInt(val);
          if (isNaN(num) || num < 1 || num > 10000000) return res.status(400).json({ error: "Invalid maxUses (1-10000000)" });
          updates[key] = num;
        } else if (key === "type") {
          if (val !== "checks" && val !== "tier") return res.status(400).json({ error: "Invalid type" });
          updates[key] = val;
        } else if (key === "tier") {
          if (val !== null && val !== "PRO" && val !== "ENTERPRISE") return res.status(400).json({ error: "Invalid tier" });
          updates[key] = val;
        } else if (key === "expiresAt") {
          if (val === null || val === "") { updates[key] = null; }
          else {
            const d = new Date(val);
            if (isNaN(d.getTime())) return res.status(400).json({ error: "Invalid expiresAt" });
            updates[key] = d;
          }
        } else if (key === "code") {
          const code = String(val).trim().toUpperCase();
          if (!code || code.length > 64) return res.status(400).json({ error: "Invalid code" });
          updates[key] = code;
        } else if (key === "isPublic" || key === "isActive") {
          updates[key] = Boolean(val);
        } else {
          updates[key] = typeof val === "string" ? val.slice(0, 1000) : val;
        }
      }
      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: "No valid fields to update" });
      }
      const coupon = await storage.updateCoupon(parseInt(req.params.id), updates);
      res.json(coupon);
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Failed to update coupon" });
    }
  });

  // Public promo board - returns active public coupons (no auth required)
  app.get("/api/promos", async (_req, res) => {
    try {
      const allCoupons = await storage.getCoupons();
      const publicPromos = allCoupons.filter(c => 
        c.isPublic && c.isActive && 
        (c.usedCount || 0) < (c.maxUses || 1) &&
        (!c.expiresAt || new Date(c.expiresAt) > new Date())
      ).map(c => ({
        id: c.id,
        code: c.code,
        type: c.type,
        value: c.value,
        tier: c.tier,
        description: c.description,
        imageUrl: c.imageUrl,
        expiresAt: c.expiresAt,
        usesLeft: (c.maxUses || 1) - (c.usedCount || 0),
      }));
      res.json(publicPromos);
    } catch (err) {
      res.json([]);
    }
  });

  // Get admin settings
  app.get("/api/admin/settings", requireAdmin, async (req, res) => {
    const settings = await storage.getAllAdminSettings();
    const settingsMap: Record<string, string> = {};
    settings.forEach(s => { settingsMap[s.key] = s.value; });
    res.json({
      proPrice: settingsMap['pro_price'] || '10',
      enterprisePrice: settingsMap['enterprise_price'] || '50',
      dailyBroadcastEnabled: settingsMap['daily_broadcast_enabled'] === 'true',
      dailyBroadcastLastSent: settingsMap['daily_broadcast_last_sent'] || null,
      dailyBroadcastLastReach: parseInt(settingsMap['daily_broadcast_last_reach'] || '0'),
      dailyEmailEnabled: settingsMap['daily_email_enabled'] === 'true',
      dailyEmailSubject: settingsMap['daily_email_subject'] || '',
      dailyEmailTitle: settingsMap['daily_email_title'] || '',
      dailyEmailBody: settingsMap['daily_email_body'] || '',
      dailyEmailLastSent: settingsMap['daily_email_last_sent'] || null,
      dailyEmailLastReach: parseInt(settingsMap['daily_email_last_reach'] || '0'),
    });
  });

  // Update admin settings
  app.post("/api/admin/settings", requireAdmin, async (req, res) => {
    const { proPrice, enterprisePrice, dailyBroadcastEnabled, dailyEmailEnabled, dailyEmailSubject, dailyEmailTitle, dailyEmailBody } = req.body;
    if (proPrice) await storage.setAdminSetting('pro_price', proPrice.toString());
    if (enterprisePrice) await storage.setAdminSetting('enterprise_price', enterprisePrice.toString());
    if (dailyBroadcastEnabled !== undefined) {
      await storage.setAdminSetting('daily_broadcast_enabled', dailyBroadcastEnabled ? 'true' : 'false');
    }
    if (dailyEmailEnabled !== undefined) {
      await storage.setAdminSetting('daily_email_enabled', dailyEmailEnabled ? 'true' : 'false');
    }
    if (dailyEmailSubject !== undefined) await storage.setAdminSetting('daily_email_subject', dailyEmailSubject);
    if (dailyEmailTitle !== undefined) await storage.setAdminSetting('daily_email_title', dailyEmailTitle);
    if (dailyEmailBody !== undefined) await storage.setAdminSetting('daily_email_body', dailyEmailBody);
    res.json({ success: true });
  });

  // Get pending payments for admin
  app.get("/api/admin/payments", requireAdmin, async (req, res) => {
    const payments = await storage.getPendingPayments();
    // Enrich with user info
    const enrichedPayments = await Promise.all(
      payments.map(async (p) => {
        const user = p.userId ? await storage.getUserById(p.userId) : null;
        return { ...p, username: user?.username || null };
      })
    );
    res.json(enrichedPayments);
  });

  // Approve payment
  app.post("/api/admin/payments/:id/approve", requireAdmin, async (req, res) => {
    const paymentId = parseInt(req.params.id);
    const payment = await storage.getPaymentById(paymentId);
    if (!payment) return res.status(404).json({ error: "Payment not found" });
    
    await storage.updatePaymentStatus(paymentId, "approved");
    
    if (payment.userId) {
      const tier = payment.tier?.toUpperCase() || "PRO";
      const requests = TIER_REQUESTS[tier] || TIER_REQUESTS.PRO;
      await storage.updateUser(payment.userId, { tier, requestsLeft: requests });
      
      const user = await storage.getUserById(payment.userId);
      storage.logActivity({ eventType: "payment", userId: payment.userId, username: user?.username || null, details: `Payment approved: ${tier}`, meta: { paymentId, tier, amount: payment.amountUsdt } }).catch(() => {});
      
      if (user && botInstance) {
        try {
          await botInstance.telegram.sendMessage(user.tgId, 
            `✅ Вашу оплату підтверджено!\n\nТариф: ${tier}\nЗапитів: ${requests}`
          );
        } catch (e) { /* ignore */ }
      }
    }
    
    res.json({ success: true });
  });

  // Reject payment
  app.post("/api/admin/payments/:id/reject", requireAdmin, async (req, res) => {
    const paymentId = parseInt(req.params.id);
    const payment = await storage.getPaymentById(paymentId);
    if (!payment) return res.status(404).json({ error: "Payment not found" });
    
    await storage.updatePaymentStatus(paymentId, "rejected");
    
    // Notify user via bot
    if (payment.userId) {
      const user = await storage.getUserById(payment.userId);
      if (user && botInstance) {
        try {
          await botInstance.telegram.sendMessage(user.tgId, 
            `❌ Вашу оплату відхилено.\n\nЗверніться до підтримки для уточнення.`
          );
        } catch (e) { /* ignore */ }
      }
    }
    
    res.json({ success: true });
  });

  // ==================== SUPPORT TICKET ROUTES ====================
  
  // Create support ticket (public - doesn't require auth but uses it if available)
  app.post("/api/support", loadUser, async (req, res) => {
    const ip = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "unknown";
    if (rateLimit(`support:${ip}`, 3, 60000)) {
      return res.status(429).json({ error: "Too many support requests. Please try again later." });
    }
    const authReq = req as AuthenticatedRequest;
    const { name, contact, message } = req.body;
    
    if (!name || !contact || !message) {
      return res.status(400).json({ error: "Name, contact and message are required" });
    }
    
    if (message.length > 2000) {
      return res.status(400).json({ error: "Message too long (max 2000 characters)" });
    }
    
    try {
      const ticket = await storage.createSupportTicket({
        userId: authReq.user?.id || null,
        name,
        contact,
        message,
        status: "open",
        source: "web",
      });

      // Notify admins via Telegram bot
      if (botInstance) {
        const msgText = `📩 Нове звернення #${ticket.id}\n\n` +
          `👤 Ім'я: ${name}\n` +
          `📱 Контакт: ${contact}\n` +
          `${authReq.user ? `🔢 User ID: ${authReq.user.id} (@${authReq.user.username || '—'})\n` : ''}` +
          `📍 Джерело: Web\n\n` +
          `💬 Повідомлення:\n${message.substring(0, 500)}${message.length > 500 ? '...' : ''}\n\n` +
          `⏰ ${new Date().toLocaleString('uk-UA')}`;

        for (const adminId of ADMIN_IDS) {
          try {
            await botInstance.telegram.sendMessage(adminId, msgText, {
              reply_markup: Markup.inlineKeyboard([
                [
                  Markup.button.callback("✅ Відповісти", `reply_ticket_${ticket.id}`),
                  Markup.button.callback("🔒 Закрити", `close_ticket_${ticket.id}`)
                ]
              ]).reply_markup
            });
          } catch (e) {
            console.log(`Failed to notify admin ${adminId}:`, e);
          }
        }
      }

      res.json({ success: true, ticketId: ticket.id });
    } catch (err: any) {
      console.error("Support ticket error:", err);
      res.status(500).json({ error: "Failed to create support ticket" });
    }
  });

  // Get support tickets (admin only)
  app.get("/api/admin/tickets", requireAdmin, async (req, res) => {
    const tickets = await storage.getSupportTickets();
    const enriched = await Promise.all(
      tickets.map(async (t) => {
        const user = t.userId ? await storage.getUserById(t.userId) : null;
        return { ...t, username: user?.username || null };
      })
    );
    res.json(enriched);
  });

  // Update support ticket status (admin only)
  app.post("/api/admin/tickets/:id/status", requireAdmin, async (req, res) => {
    const { status, adminReply } = req.body;
    try {
      const ticket = await storage.updateSupportTicketStatus(parseInt(req.params.id), status, adminReply);
      res.json(ticket);
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Failed to update ticket" });
    }
  });

  // Get ALL payments (admin only, not just pending)
  app.get("/api/admin/payments/all", requireAdmin, async (req, res) => {
    const allPayments = await storage.getAllPayments();
    const enriched = await Promise.all(
      allPayments.map(async (p) => {
        const user = p.userId ? await storage.getUserById(p.userId) : null;
        return { ...p, username: user?.username || null };
      })
    );
    res.json(enriched);
  });

  // Get all users (admin only)
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    const allUsers = await storage.getAllUsers();
    res.json(allUsers.map(u => ({
      id: u.id,
      tgId: u.tgId,
      username: u.username,
      tier: u.tier,
      requestsLeft: u.requestsLeft,
      streakDays: u.streakDays,
      blocked: u.blocked,
      createdAt: u.createdAt?.toISOString(),
      lastLogin: u.lastLogin?.toISOString(),
    })));
  });

  app.post("/api/admin/users/:id/block", requireAdmin, async (req, res) => {
    const { blocked } = req.body;
    try {
      const user = await storage.blockUser(parseInt(req.params.id), blocked);
      res.json(user);
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Failed to update user" });
    }
  });

  // ============ Admin Messages / Support Dialog Routes ============

  app.get("/api/admin/conversations", requireAdmin, async (req, res) => {
    try {
      const conversations = await storage.getConversationList();
      res.json(conversations);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to fetch conversations" });
    }
  });

  app.get("/api/admin/messages/:userId", requireAdmin, async (req, res) => {
    try {
      const messages = await storage.getAdminMessages(parseInt(req.params.userId));
      res.json(messages);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to fetch messages" });
    }
  });

  app.post("/api/admin/messages/:userId", requireAdmin, async (req, res) => {
    const { message, ticketId } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: "Message required" });
    try {
      const targetUserId = parseInt(req.params.userId);
      const created = await storage.createAdminMessage({
        userId: targetUserId,
        message: message.trim(),
        sender: "admin",
        ticketId: ticketId || null,
      });

      let telegramDelivered = false;
      try {
        const targetUser = await storage.getUser(targetUserId);
        if (targetUser?.tgId && botInstance) {
          const { t: tt, normalizeLang: nl } = await import("./i18n");
          const userLang = nl(targetUser.lang);
          const prefix = tt(userLang, "admin.supportMessagePrefix");
          await botInstance.telegram.sendMessage(
            targetUser.tgId,
            `${prefix}\n\n${message.trim()}`
          );
          telegramDelivered = true;
        }
      } catch (botErr) {
        console.log("Failed to forward admin message to Telegram:", botErr);
      }

      res.json({ ...created, telegramDelivered });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to send message" });
    }
  });

  app.get("/api/support/messages", loadUser, requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    try {
      const messages = await storage.getAdminMessages(authReq.user!.id);
      res.json(messages);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to fetch messages" });
    }
  });

  app.post("/api/support/messages", loadUser, requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const { message } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: "Message required" });
    try {
      const created = await storage.createAdminMessage({
        userId: authReq.user!.id,
        message: message.trim(),
        sender: "user",
        ticketId: null,
      });
      res.json(created);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to send message" });
    }
  });

  app.post("/api/admin/users/:id/tier", requireAdmin, async (req, res) => {
    const { tier } = req.body;
    if (!["FREE", "PRO", "ENTERPRISE"].includes(tier)) return res.status(400).json({ error: "Invalid tier" });
    try {
      const user = await storage.updateUserTier(parseInt(req.params.id), tier);
      const adminId = (req as AuthenticatedRequest).user?.id ?? null;
      storage.logActivity({ eventType: "tier_change", userId: user.id, username: user.username || null, details: `Tier changed to ${tier}`, meta: { tier, adminId } }).catch(() => {});
      res.json(user);
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Failed to update tier" });
    }
  });

  app.post("/api/admin/users/:id/checks", requireAdmin, async (req, res) => {
    const amount = parseInt(req.body.amount, 10);
    if (!Number.isFinite(amount) || amount < 1 || amount > 10000) return res.status(400).json({ error: "Invalid amount (1-10000)" });
    try {
      const user = await storage.addChecksToUser(parseInt(req.params.id), amount);
      res.json(user);
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Failed to add checks" });
    }
  });

  app.get("/api/admin/activity", requireAdmin, async (req, res) => {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const offset = parseInt(req.query.offset as string) || 0;
    try {
      const [events, total] = await Promise.all([
        storage.getActivityLog(limit, offset),
        storage.getActivityLogCount(),
      ]);
      res.json({ events, total, limit, offset });
    } catch (err: any) {
      console.error("Activity log error:", err.message);
      res.json({ events: [], total: 0, limit, offset });
    }
  });

  app.post("/api/admin/activity", requireAdmin, async (req, res) => {
    const { eventType, userId, username, details, meta } = req.body;
    if (!eventType) return res.status(400).json({ error: "eventType is required" });
    try {
      const entry = await storage.logActivity({ eventType, userId: userId || null, username: username || null, details: details || null, meta: meta || null });
      res.json(entry);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to log activity" });
    }
  });

  // ============ Push Notifications ============

  app.post("/api/push/subscribe", loadUser, requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const { endpoint, keys } = req.body;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ error: "Invalid subscription" });
    }
    try {
      await storage.savePushSubscription(authReq.user!.id, endpoint, keys.p256dh, keys.auth);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/push/unsubscribe", loadUser, requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const { endpoint } = req.body;
    if (!endpoint) return res.status(400).json({ error: "Missing endpoint" });
    try {
      await storage.removePushSubscription(endpoint, authReq.user!.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/push/vapid-key", (_req, res) => {
    const vapidKey = process.env.VAPID_PUBLIC_KEY;
    if (!vapidKey) return res.status(404).json({ error: "VAPID key not configured" });
    res.json({ publicKey: vapidKey });
  });

  app.post("/api/admin/push-broadcast", requireAdmin, async (req, res) => {
    const { title, body: msgBody } = req.body;
    if (!title || !msgBody) return res.status(400).json({ error: "title and body required" });

    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const webPush = await import("web-push");
      const vapidPublic = process.env.VAPID_PUBLIC_KEY;
      const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
      if (!vapidPublic || !vapidPrivate) {
        return res.status(500).json({ error: "VAPID keys not configured" });
      }
      webPush.default.setVapidDetails("mailto:darkshare.store@gmail.com", vapidPublic, vapidPrivate);
      
      const subs = await storage.getPushSubscriptions();
      let sent = 0;
      let failed = 0;
      const payload = JSON.stringify({ title, body: msgBody, icon: "/favicon.png", badge: "/favicon.png", tag: "broadcast" });
      
      for (const sub of subs) {
        try {
          await webPush.default.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload);
          sent++;
        } catch (err: any) {
          failed++;
          if (err.statusCode === 410 || err.statusCode === 404) {
            await storage.removePushSubscription(sub.endpoint);
          }
        }
      }
      
      res.json({ sent, failed, total: subs.length });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ============ Email Broadcast (Resend) ============

  app.get("/api/admin/email-subscribers", requireAdmin, async (_req, res) => {
    try {
      const result = await pool.query("SELECT email FROM auth_users WHERE email IS NOT NULL AND email != '' ORDER BY created_at DESC");
      const emails = result.rows.map((r: any) => r.email);
      res.json({ emails, total: emails.length });
    } catch (err: any) {
      console.error("[Email Subscribers] Error:", err);
      res.status(500).json({ error: "Failed to fetch subscribers" });
    }
  });

  app.post("/api/admin/email-broadcast", requireAdmin, async (req, res) => {
    const { subject, title, body: msgBody, recipients } = req.body;
    if (!subject || !title || !msgBody) {
      return res.status(400).json({ error: "subject, title and body required" });
    }

    try {
      const { sendEmailBroadcast, buildBroadcastHtml } = await import("./emailService");
      const html = buildBroadcastHtml(title, msgBody);

      let targetEmails: string[];
      if (recipients && Array.isArray(recipients) && recipients.length > 0) {
        targetEmails = recipients;
      } else {
        const result = await pool.query("SELECT email FROM auth_users WHERE email IS NOT NULL AND email != ''");
        targetEmails = result.rows.map((r: any) => r.email);
      }

      if (targetEmails.length === 0) {
        return res.status(400).json({ error: "No email recipients found" });
      }

      console.log(`[Email Broadcast] Sending to ${targetEmails.length} recipients, subject: "${subject}"`);
      const result = await sendEmailBroadcast({ to: targetEmails, subject, html });
      console.log(`[Email Broadcast] Done: ${result.sent} sent, ${result.failed} failed`);
      res.json({ ...result, total: targetEmails.length });
    } catch (err: any) {
      console.error("[Email Broadcast] Error:", err);
      res.status(500).json({ error: "Failed to send email broadcast" });
    }
  });

  app.post("/api/admin/email-test", requireAdmin, async (req, res) => {
    const { email, subject, title, body: msgBody } = req.body;
    if (!email || !subject || !title || !msgBody) {
      return res.status(400).json({ error: "email, subject, title and body required" });
    }

    try {
      const { sendSingleEmail, buildBroadcastHtml } = await import("./emailService");
      const html = buildBroadcastHtml(title, msgBody);
      await sendSingleEmail(email, subject, html);
      res.json({ success: true });
    } catch (err: any) {
      console.error("[Email Test] Error:", err);
      res.status(500).json({ error: "Failed to send test email" });
    }
  });

  // ============ Admin Analytics ============

  app.get("/api/admin/revenue", requireAdmin, async (req, res) => {
    try {
      const revenueStats = await storage.getRevenueStats();
      res.json(revenueStats);
    } catch (err: any) {
      res.json({ totalRevenue: 0, monthlyRevenue: 0, paymentsByTier: {} });
    }
  });

  app.get("/api/admin/system-health", requireAdmin, async (req, res) => {
    const mem = process.memoryUsage();
    const uptimeSec = process.uptime();
    const hours = Math.floor(uptimeSec / 3600);
    const mins = Math.floor((uptimeSec % 3600) / 60);
    res.json({
      uptime: `${hours}h ${mins}m`,
      uptimeSeconds: Math.round(uptimeSec),
      memoryUsedMB: Math.round(mem.rss / 1024 / 1024),
      heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
      nodeVersion: process.version,
      platform: process.platform,
      dbConnected: !!process.env.DATABASE_URL,
    });
  });

  app.get("/api/admin/user-growth", requireAdmin, async (req, res) => {
    try {
      const growth = await storage.getUserGrowthStats();
      res.json(growth);
    } catch (err: any) {
      res.json([]);
    }
  });

  // ============ Ad Banners ============

  app.get("/api/banners", async (_req, res) => {
    try {
      const result = await pool.query(`SELECT * FROM ds_ad_banners WHERE is_active = true AND position = 'dashboard' ORDER BY priority DESC`);
      res.json(result.rows.map((r: any) => ({
        id: r.id, title: r.title, description: r.description, imageUrl: r.image_url,
        mediaType: r.media_type, linkUrl: r.link_url, linkText: r.link_text, bgGradient: r.bg_gradient,
        position: r.position, isActive: r.is_active, priority: r.priority,
        showForTiers: r.show_for_tiers, createdAt: r.created_at,
      })));
    } catch {
      res.json([]);
    }
  });

  app.get("/api/admin/banners", requireAdmin, async (_req, res) => {
    try {
      const result = await pool.query(`SELECT * FROM ds_ad_banners ORDER BY created_at DESC`);
      res.json(result.rows.map((r: any) => ({
        id: r.id, title: r.title, description: r.description, imageUrl: r.image_url,
        mediaType: r.media_type, linkUrl: r.link_url, linkText: r.link_text, bgGradient: r.bg_gradient,
        position: r.position, isActive: r.is_active, priority: r.priority,
        showForTiers: r.show_for_tiers, createdAt: r.created_at,
      })));
    } catch {
      res.json([]);
    }
  });

  const bannerUpload = multer({ storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => cb(null, `banner-${Date.now()}-${sanitizeFilename(file.originalname)}`),
  }), limits: { fileSize: 50 * 1024 * 1024 }, fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/webm", "video/quicktime"];
    const ext = file.originalname.slice(file.originalname.lastIndexOf('.')).toLowerCase();
    const safeExts = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".mp4", ".mov", ".webm"]);
    cb(null, allowed.includes(file.mimetype) && safeExts.has(ext));
  } });

  app.post("/api/admin/banners/upload", requireAdmin, bannerUpload.single("media"), (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const isVideo = req.file.mimetype.startsWith("video/");
    res.json({ url: `/uploads/${req.file.filename}`, mediaType: isVideo ? "video" : "image", filename: req.file.filename });
  });

  app.post("/api/admin/banners", requireAdmin, async (req, res) => {
    try {
      const { title, description, imageUrl, mediaType, linkUrl, linkText, bgGradient, position, isActive, priority, showForTiers } = req.body;
      if (!title || typeof title !== 'string' || title.length > 200) return res.status(400).json({ error: "Invalid title" });
      if (linkUrl && linkUrl.length > 0 && !/^https?:\/\//i.test(linkUrl)) return res.status(400).json({ error: "Link URL must start with http:// or https://" });
      const validMediaTypes = ["image", "video"];
      const safeMediaType = validMediaTypes.includes(mediaType) ? mediaType : "image";
      const result = await pool.query(
        `INSERT INTO ds_ad_banners (title, description, image_url, media_type, link_url, link_text, bg_gradient, position, is_active, priority, show_for_tiers) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
        [title, description || null, imageUrl || null, safeMediaType, linkUrl || null, linkText || null, bgGradient || 'from-purple-600/20 via-pink-500/10 to-transparent', position || 'dashboard', isActive !== false, priority || 0, showForTiers || ['FREE','PRO']]
      );
      const r = result.rows[0];
      res.json({ id: r.id, title: r.title, description: r.description, imageUrl: r.image_url, mediaType: r.media_type, linkUrl: r.link_url, linkText: r.link_text, bgGradient: r.bg_gradient, position: r.position, isActive: r.is_active, priority: r.priority, showForTiers: r.show_for_tiers, createdAt: r.created_at });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.patch("/api/admin/banners/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (req.body.linkUrl && !/^https?:\/\//i.test(req.body.linkUrl)) return res.status(400).json({ error: "Link URL must start with http:// or https://" });
      const fields: string[] = [];
      const values: any[] = [];
      let idx = 1;
      const fieldMap: Record<string, string> = { title: 'title', description: 'description', imageUrl: 'image_url', mediaType: 'media_type', linkUrl: 'link_url', linkText: 'link_text', bgGradient: 'bg_gradient', position: 'position', isActive: 'is_active', priority: 'priority', showForTiers: 'show_for_tiers' };
      for (const [key, col] of Object.entries(fieldMap)) {
        if (req.body[key] !== undefined) { fields.push(`${col} = $${idx++}`); values.push(req.body[key]); }
      }
      if (fields.length === 0) return res.status(400).json({ error: "No fields to update" });
      values.push(id);
      const result = await pool.query(`UPDATE ds_ad_banners SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`, values);
      const r = result.rows[0];
      res.json({ id: r.id, title: r.title, description: r.description, imageUrl: r.image_url, mediaType: r.media_type, linkUrl: r.link_url, linkText: r.link_text, bgGradient: r.bg_gradient, position: r.position, isActive: r.is_active, priority: r.priority, showForTiers: r.show_for_tiers, createdAt: r.created_at });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete("/api/admin/banners/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await pool.query(`DELETE FROM ds_ad_banners WHERE id = $1`, [id]);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // ============ Domain OSINT (DNS + WHOIS/RDAP + SSL) ============

  // Block private/loopback/link-local/CGNAT/multicast/reserved IPs to prevent SSRF.
  function isPublicIp(ip: string): boolean {
    if (!ip) return false;
    const fam = net.isIP(ip);
    if (fam === 4) {
      const parts = ip.split(".").map((n) => parseInt(n, 10));
      if (parts.length !== 4 || parts.some((n) => isNaN(n) || n < 0 || n > 255)) return false;
      const [a, b] = parts;
      if (a === 10) return false;
      if (a === 127) return false;
      if (a === 0) return false;
      if (a === 169 && b === 254) return false; // link-local
      if (a === 172 && b >= 16 && b <= 31) return false;
      if (a === 192 && b === 168) return false;
      if (a === 192 && b === 0) return false; // 192.0.0.0/24 + 192.0.2.0/24
      if (a === 198 && (b === 18 || b === 19)) return false; // benchmark
      if (a === 100 && b >= 64 && b <= 127) return false; // CGNAT
      if (a >= 224) return false; // multicast/reserved
      return true;
    }
    if (fam === 6) {
      const lower = ip.toLowerCase();
      if (lower === "::1" || lower === "::") return false;
      if (lower.startsWith("fe80:") || lower.startsWith("fc") || lower.startsWith("fd")) return false;
      if (lower.startsWith("ff")) return false; // multicast
      if (lower.startsWith("::ffff:")) {
        // IPv4-mapped — validate the embedded v4
        return isPublicIp(lower.slice(7));
      }
      return true;
    }
    return false;
  }

  function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | null> {
    return new Promise((resolve) => {
      let done = false;
      const timer = setTimeout(() => { if (!done) { done = true; resolve(null); } }, ms);
      p.then((v) => { if (!done) { done = true; clearTimeout(timer); resolve(v); } })
       .catch(() => { if (!done) { done = true; clearTimeout(timer); resolve(null); } });
    });
  }

  app.post("/api/osint/domain", loadUser, requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    if (rateLimit("domain-osint:" + authReq.user!.id, 10, 60000)) {
      return res.status(429).json({ error: "Too many domain checks. Try again later." });
    }

    const rawDomain = String(req.body?.domain || "").trim().toLowerCase();
    if (!rawDomain) return res.status(400).json({ error: "Domain required" });

    const stripped = rawDomain
      .replace(/^https?:\/\//, "")
      .replace(/\/.*$/, "")
      .replace(/:\d+$/, "");
    if (!/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/i.test(stripped)) {
      return res.status(400).json({ error: "Invalid domain" });
    }
    if (stripped.endsWith(".local") || stripped.endsWith(".internal") || stripped.endsWith(".localhost")) {
      return res.status(400).json({ error: "Internal domains not allowed" });
    }

    const domain = stripped;

    // ---- DNS lookups (each individually time-bounded) ----
    const dnsTimeout = 4000;
    const [a, aaaa, mx, ns, txt, cname, soa] = await Promise.all([
      withTimeout(dnsPromises.resolve4(domain).catch(() => null as any), dnsTimeout),
      withTimeout(dnsPromises.resolve6(domain).catch(() => null as any), dnsTimeout),
      withTimeout(dnsPromises.resolveMx(domain).catch(() => null as any), dnsTimeout),
      withTimeout(dnsPromises.resolveNs(domain).catch(() => null as any), dnsTimeout),
      withTimeout(dnsPromises.resolveTxt(domain).catch(() => null as any), dnsTimeout),
      withTimeout(dnsPromises.resolveCname(domain).catch(() => null as any), dnsTimeout),
      withTimeout(dnsPromises.resolveSoa(domain).catch(() => null as any), dnsTimeout),
    ]);

    // SSRF guard: collect all resolved IPs; require at least one public IP for SSL probe.
    const allIps: string[] = [...(a || []), ...(aaaa || [])];
    const publicIps = allIps.filter(isPublicIp);
    const hasPrivateIp = allIps.length > 0 && publicIps.length === 0;

    // ---- RDAP / WHOIS ----
    let whois: any = null;
    try {
      const rdapResp = await fetch(`https://rdap.org/domain/${encodeURIComponent(domain)}`, {
        headers: { Accept: "application/rdap+json" },
        signal: AbortSignal.timeout(7000),
        redirect: "follow",
      });
      if (rdapResp.ok) {
        const rdap: any = await rdapResp.json();
        const eventDate = (name: string) =>
          rdap.events?.find((e: any) => e.eventAction === name)?.eventDate || null;
        const registrar =
          rdap.entities?.find((e: any) => e.roles?.includes("registrar"))?.vcardArray?.[1]
            ?.find((v: any) => v[0] === "fn")?.[3] || null;
        whois = {
          handle: rdap.handle || null,
          ldhName: rdap.ldhName || domain,
          status: rdap.status || [],
          registrar,
          registered: eventDate("registration"),
          expires: eventDate("expiration"),
          lastChanged: eventDate("last changed"),
          nameservers: (rdap.nameservers || []).map((n: any) => n.ldhName).filter(Boolean),
        };
      }
    } catch {}

    // ---- SSL certificate (connect by VETTED IP, with SNI=domain to prevent rebinding) ----
    let ssl: any = null;
    let sslSkippedReason: "no_public_ip" | null = null;
    if (publicIps.length === 0) {
      sslSkippedReason = "no_public_ip";
    } else {
      const targetIp = publicIps[0]; // first public IP
      try {
        ssl = await new Promise<any>((resolve) => {
          const socket = tls.connect({
            host: targetIp,
            port: 443,
            servername: domain,
            rejectUnauthorized: false,
            timeout: 6000,
          }, () => {
            try {
              const cert = socket.getPeerCertificate(false);
              if (!cert || !cert.subject) {
                socket.end();
                return resolve(null);
              }
              const issuerCn = cert.issuer?.CN || cert.issuer?.O || null;
              const subjectCn = cert.subject?.CN || null;
              resolve({
                valid: socket.authorized,
                authorizationError: socket.authorizationError ? String(socket.authorizationError) : null,
                issuer: issuerCn,
                subject: subjectCn,
                validFrom: cert.valid_from || null,
                validTo: cert.valid_to || null,
                altNames: typeof cert.subjectaltname === "string"
                  ? cert.subjectaltname.split(",").map((s: string) => s.trim().replace(/^DNS:/, "")).slice(0, 30)
                  : [],
                fingerprint256: cert.fingerprint256 || null,
                serialNumber: cert.serialNumber || null,
              });
              socket.end();
            } catch {
              try { socket.destroy(); } catch {}
              resolve(null);
            }
          });
          socket.on("error", () => resolve(null));
          socket.on("timeout", () => { try { socket.destroy(); } catch {} resolve(null); });
        });
      } catch {}
    }

    // ---- Risk scoring (typed codes for client-side localization) ----
    const findings: { code: string; params?: Record<string, string | number> }[] = [];
    let score = 0;
    if (hasPrivateIp) { findings.push({ code: "private_ip" }); score += 35; }
    if (sslSkippedReason === "no_public_ip") {
      findings.push({ code: "ssl_unreachable" }); score += 20;
    } else if (!ssl) { findings.push({ code: "ssl_missing" }); score += 25; }
    else if (ssl.validTo) {
      const daysLeft = Math.floor((new Date(ssl.validTo).getTime() - Date.now()) / 86400000);
      if (daysLeft < 0) { findings.push({ code: "ssl_expired", params: { days: -daysLeft } }); score += 40; }
      else if (daysLeft < 14) { findings.push({ code: "ssl_expiring", params: { days: daysLeft } }); score += 20; }
      if (!ssl.valid) { findings.push({ code: "ssl_chain_invalid", params: { reason: ssl.authorizationError || "unknown" } }); score += 15; }
    }
    if (whois?.expires) {
      const days = Math.floor((new Date(whois.expires).getTime() - Date.now()) / 86400000);
      if (days < 0) { findings.push({ code: "domain_expired", params: { days: -days } }); score += 30; }
      else if (days < 30) { findings.push({ code: "domain_expiring", params: { days } }); score += 15; }
    }
    if (!a && !aaaa) { findings.push({ code: "no_a_records" }); score += 25; }
    if (!mx || mx.length === 0) { findings.push({ code: "no_mx_records" }); score += 5; }
    if ((whois?.status || []).some((s: string) => /hold|locked|prohibited/i.test(s))) {
      findings.push({ code: "domain_status_locked" });
      score += 5;
    }
    score = Math.min(100, score);
    const riskLevel = score >= 75 ? "critical" : score >= 50 ? "high" : score >= 25 ? "medium" : "low";

    res.json({
      domain,
      checkedAt: new Date().toISOString(),
      riskScore: score,
      riskLevel,
      findings,
      dns: {
        a: a || [],
        aaaa: aaaa || [],
        mx: mx || [],
        ns: ns || [],
        txt: (txt || []).map((rr: string[]) => rr.join("")),
        cname: cname || [],
        soa: soa || null,
      },
      whois,
      ssl,
    });
  });

  // ============ Breach Check Route ============

  app.post("/api/breach-check", loadUser, requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    if (rateLimit("breach:" + authReq.user!.id, 10, 60000)) return res.status(429).json({ error: "Too many breach checks. Try again later." });

    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: "Email required" });
      
      const breaches: any[] = [];
      
      try {
        const emailHash = email.toLowerCase().trim();
        const response = await fetch(`https://api.xposedornot.com/v1/check-email/${encodeURIComponent(emailHash)}`);
        if (response.ok) {
          const data = await response.json();
          if (data.breaches_details) {
            for (const breach of data.breaches_details) {
              breaches.push({
                name: breach.breach || breach.domain || "Unknown",
                date: breach.xposed_date || breach.searchable || "Unknown",
                dataTypes: breach.xposed_data || "Email",
                domain: breach.domain || "Unknown",
              });
            }
          }
        }
      } catch (e) {
      }
      
      res.json({
        email,
        breachCount: breaches.length,
        breaches: breaches.slice(0, 20),
        checkedAt: new Date().toISOString(),
        status: breaches.length > 0 ? "exposed" : "clean",
      });
    } catch (error: any) {
      console.error("Breach check error:", error.message);
      res.status(500).json({ error: "Failed to check breaches" });
    }
  });

  // ============ Team Management Routes ============

  app.get("/api/teams/:id/stats", loadUser, requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    try {
      const teamId = parseInt(req.params.id);
      const team = await storage.getTeamById(teamId);
      if (!team) return res.status(404).json({ error: "Team not found" });
      const userTeams = await storage.getTeamsByUser(authReq.user!.id);
      if (!userTeams.find(t => t.id === teamId)) {
        return res.status(403).json({ error: "Access denied" });
      }
      const members = await storage.getTeamMembers(teamId);
      const memberIds = [team.ownerId, ...members.map(m => m.userId)];
      
      let totalChecks = 0;
      let recentReports: any[] = [];
      const checksByType: Record<string, number> = {};
      const memberStats: any[] = [];
      
      for (const memberId of memberIds) {
        const reports = await storage.getReportsByUserId(memberId);
        totalChecks += reports.length;
        for (const r of reports) {
          const data = r.dataJson as any || {};
          const type = r.objectType || "unknown";
          checksByType[type] = (checksByType[type] || 0) + 1;
          recentReports.push({
            id: r.id,
            type: r.objectType,
            target: data.target ? data.target.substring(0, 3) + "***" + data.target.substring(data.target.length - 3) : "***",
            riskLevel: data.riskLevel,
            riskScore: data.riskScore,
            createdAt: r.generatedAt,
            userId: memberId,
          });
        }
        const memberUser = await storage.getUserById(memberId);
        memberStats.push({
          userId: memberId,
          username: memberUser?.username || "unknown",
          checks: reports.length,
          tier: memberUser?.tier || "FREE",
        });
      }
      
      recentReports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      recentReports = recentReports.slice(0, 20);
      
      res.json({
        totalChecks,
        totalMembers: memberIds.length,
        checksByType,
        memberStats,
        recentReports,
      });
    } catch (error: any) {
      console.error("GET /api/teams/:id/stats error:", error.message);
      res.status(500).json({ error: "Failed to get team stats" });
    }
  });

  app.get("/api/teams", loadUser, requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    try {
      const userTeams = await storage.getTeamsByUser(authReq.user!.id);
      res.json(userTeams);
    } catch (error: any) {
      console.error("GET /api/teams error:", error.message, error.stack);
      res.status(500).json({ error: "Failed to get teams" });
    }
  });

  app.post("/api/teams/join", loadUser, requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    try {
      const { inviteCode } = req.body;
      if (!inviteCode) return res.status(400).json({ error: "Invite code required" });
      const team = await storage.getTeamByInviteCode(inviteCode.trim());
      if (!team) return res.status(404).json({ error: "Invalid invite code" });
      if (team.ownerId === authReq.user!.id) {
        return res.status(400).json({ error: "You are the owner of this team" });
      }
      const members = await storage.getTeamMembers(team.id);
      if (members.find(m => m.userId === authReq.user!.id)) {
        return res.status(400).json({ error: "Already a member" });
      }
      if (members.length >= (team.maxMembers || 10)) {
        return res.status(400).json({ error: "Team is full" });
      }
      const member = await storage.addTeamMember({ teamId: team.id, userId: authReq.user!.id, role: "member" });
      res.json({ team, member });
    } catch (error: any) {
      console.error("POST /api/teams/join error:", error.message, error.stack);
      res.status(500).json({ error: "Failed to join team" });
    }
  });

  app.post("/api/teams", loadUser, requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const user = authReq.user!;
    const tier = (user.tier || "FREE").toUpperCase();
    if (tier !== "GROUPS" && tier !== "ENTERPRISE") {
      return res.status(403).json({ error: "Team creation requires GROUPS or ENTERPRISE tier" });
    }
    const { name } = req.body;
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return res.status(400).json({ error: "Team name must be at least 2 characters" });
    }
    try {
      const team = await storage.createTeam({ name: name.trim(), ownerId: user.id, maxMembers: 10 });
      res.json(team);
    } catch (error: any) {
      console.error("POST /api/teams error:", error.message, error.stack);
      res.status(500).json({ error: "Failed to create team" });
    }
  });

  app.get("/api/teams/:id/members", loadUser, requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    try {
      const teamId = parseInt(req.params.id);
      const team = await storage.getTeamById(teamId);
      if (!team) return res.status(404).json({ error: "Team not found" });
      const userTeams = await storage.getTeamsByUser(authReq.user!.id);
      if (!userTeams.find(t => t.id === teamId)) {
        return res.status(403).json({ error: "Access denied" });
      }
      const members = await storage.getTeamMembers(teamId);
      const owner = await storage.getUserById(team.ownerId);
      res.json({ team, members, owner: { id: owner?.id, username: owner?.username, tier: owner?.tier } });
    } catch (error: any) {
      console.error("GET /api/teams/:id/members error:", error.message, error.stack);
      res.status(500).json({ error: "Failed to get team members" });
    }
  });

  app.post("/api/teams/:id/members", loadUser, requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const teamId = parseInt(req.params.id);
    try {
      const team = await storage.getTeamById(teamId);
      if (!team) return res.status(404).json({ error: "Team not found" });
      if (team.ownerId !== authReq.user!.id) {
        return res.status(403).json({ error: "Only team owner can add members" });
      }
      const { username: rawUsername } = req.body;
      if (!rawUsername) return res.status(400).json({ error: "Username required" });
      const cleanUsername = rawUsername.trim().replace(/^@/, "");
      const targetUser = await storage.getUserByUsername(cleanUsername);
      if (!targetUser) return res.status(404).json({ error: "User not found" });
      const members = await storage.getTeamMembers(teamId);
      if (members.find(m => m.userId === targetUser.id)) {
        return res.status(400).json({ error: "User already in team" });
      }
      if (members.length >= (team.maxMembers || 10)) {
        return res.status(400).json({ error: "Team is full" });
      }
      const member = await storage.addTeamMember({ teamId, userId: targetUser.id, role: "member" });
      res.json(member);
    } catch (error: any) {
      console.error("POST /api/teams/:id/members error:", error.message, error.stack);
      res.status(500).json({ error: "Failed to add member" });
    }
  });

  app.delete("/api/teams/:id/members/:userId", loadUser, requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const teamId = parseInt(req.params.id);
    const userId = parseInt(req.params.userId);
    try {
      const team = await storage.getTeamById(teamId);
      if (!team) return res.status(404).json({ error: "Team not found" });
      if (team.ownerId !== authReq.user!.id) {
        return res.status(403).json({ error: "Only team owner can remove members" });
      }
      await storage.removeTeamMember(teamId, userId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("DELETE /api/teams/:id/members error:", error.message, error.stack);
      res.status(500).json({ error: "Failed to remove member" });
    }
  });

  app.delete("/api/teams/:id", loadUser, requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const teamId = parseInt(req.params.id);
    try {
      const team = await storage.getTeamById(teamId);
      if (!team) return res.status(404).json({ error: "Team not found" });
      if (team.ownerId !== authReq.user!.id) {
        return res.status(403).json({ error: "Only team owner can delete team" });
      }
      await storage.deleteTeam(teamId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("DELETE /api/teams/:id error:", error.message, error.stack);
      res.status(500).json({ error: "Failed to delete team" });
    }
  });

  // ============ Partnership Application Route ============

  app.post("/api/partnership/apply", async (req, res) => {
    const ip = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "unknown";
    if (rateLimit(`partner:${ip}`, 2, 300000)) {
      return res.status(429).json({ error: "Too many requests. Please try again later." });
    }
    try {
      const { name, phone, email, method, volume } = req.body;

      if (!name || !phone || !email || !method || !volume) {
        return res.status(400).json({ error: "All fields are required" });
      }

      const sanitize = (s: string) => String(s).replace(/[<>&"'`]/g, "").slice(0, 200);
      const message = `🤝 Нова заявка на партнерство\n\n👤 Ім'я: ${sanitize(name)}\n📱 Телефон: ${sanitize(phone)}\n📧 Email: ${sanitize(email)}\n📊 Метод залучення: ${sanitize(method)}\n📈 Очікуваний обсяг: ${sanitize(volume)}\n\n⚡ Зв'яжіться з партнером`;

      if (botInstance && ADMIN_IDS.length > 0) {
        for (const adminId of ADMIN_IDS) {
          try {
            await botInstance.telegram.sendMessage(adminId, message);
          } catch (err) {
            console.error(`Failed to send partnership notification to admin ${adminId}:`, err);
          }
        }
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Partnership apply error:", error);
      res.status(500).json({ error: "Failed to submit partnership application" });
    }
  });

  // ============ Widget Verification Route ============

  // Favorites endpoints
  app.get("/api/favorites", loadUser, requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const favs = await storage.getFavorites(authReq.user!.id);
    res.json(favs);
  });

  app.post("/api/favorites", loadUser, requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const { checkType, value, label } = req.body;
    if (!checkType || !value) return res.status(400).json({ error: "checkType and value required" });
    try {
      const fav = await storage.addFavorite({ userId: authReq.user!.id, checkType, value, label: label || null });
      res.json(fav);
    } catch (err) {
      res.status(500).json({ error: "Failed to add favorite" });
    }
  });

  app.delete("/api/favorites/:id", loadUser, requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    try {
      const favs = await storage.getFavorites(authReq.user!.id);
      const fav = favs.find(f => f.id === parseInt(req.params.id));
      if (!fav) return res.status(404).json({ error: "Favorite not found" });
      await storage.deleteFavorite(fav.id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete favorite" });
    }
  });

  app.get("/api/widget/verify/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId) || userId <= 0) return res.status(400).json({ verified: false });
      const user = await storage.getUserById(userId);
      if (!user) return res.status(404).json({ verified: false });
      const tier = (user.tier || "FREE").toUpperCase();
      res.json({
        verified: true,
        username: (user.username || "User").slice(0, 3) + "***",
        tier,
      });
    } catch {
      res.status(500).json({ verified: false });
    }
  });

  app.get("/api/reports/:id/share-link", loadUser, requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const id = parseInt(req.params.id);
    try {
      const report = await storage.getReportById(id);
      if (!report) return res.status(404).json({ error: "Report not found" });
      if (report.userId !== authReq.user!.id) return res.status(403).json({ error: "Access denied" });
      const verificationId = report.verificationId;
      if (!verificationId) return res.status(400).json({ error: "Report has no verification ID" });
      res.json({ shareUrl: `/verify/${verificationId}`, verificationId });
    } catch (err) {
      res.status(500).json({ error: "Failed to generate share link" });
    }
  });

  app.post("/api/chat/share-report", loadUser, requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user!.id;
    const { reportId, teamId } = req.body;
    if (!reportId) return res.status(400).json({ error: "reportId required" });
    try {
      const reports = await storage.getReportsByUserId(userId);
      const report = reports.find((r: any) => r.id === reportId);
      if (!report) return res.status(404).json({ error: "Report not found" });
      const data = report.dataJson as any;
      const riskEmoji = data.riskScore >= 80 ? "🔴" : data.riskScore >= 50 ? "🟡" : "🟢";
      const shareMsg = `${riskEmoji} Check Result: ${data.type?.toUpperCase() || "UNKNOWN"}\n🎯 Target: ${data.target ? data.target.substring(0, 6) + "***" + data.target.substring(data.target.length - 4) : "***"}\n📊 Risk: ${data.riskScore || 0}/100 (${data.riskLevel || "unknown"})\n${data.summary ? "📝 " + data.summary.substring(0, 120) : ""}\n🔗 Verify: /verify/${report.verificationId || "N/A"}`;
      const user = await storage.getUser(userId);
      const created = await storage.createChatMessage({
        userId,
        username: user?.username || "Anonymous",
        photoUrl: user?.photoUrl || null,
        message: shareMsg,
        messageType: "report",
        fileUrl: null,
        teamId: teamId || null,
      });
      res.json(created);
    } catch (err) {
      res.status(500).json({ error: "Failed to share report" });
    }
  });

  const chatRateLimit = new Map<number, number[]>();
  app.get("/api/chat/messages", async (req, res) => {
    if (!req.session?.userId) return res.status(401).json({ error: "Not authenticated" });
    try {
      const teamId = req.query.teamId ? parseInt(req.query.teamId as string) : null;
      if (teamId) {
        const userTeams = await storage.getTeamsByUser(req.session.userId);
        if (!userTeams.some(t => t.id === teamId)) {
          return res.status(403).json({ error: "Not a team member" });
        }
      }
      const messages = await storage.getChatMessages(100, teamId);
      const ordered = messages.reverse();
      const ids = ordered.map(m => m.id);
      const reactions = await storage.getReactions(ids);
      const reactionsMap: Record<number, { emoji: string; userIds: number[] }[]> = {};
      for (const r of reactions) {
        if (!reactionsMap[r.messageId]) reactionsMap[r.messageId] = [];
        const existing = reactionsMap[r.messageId].find(x => x.emoji === r.emoji);
        if (existing) { existing.userIds.push(r.userId); }
        else { reactionsMap[r.messageId].push({ emoji: r.emoji, userIds: [r.userId] }); }
      }
      const result = ordered.map(m => ({ ...m, reactions: reactionsMap[m.id] || [] }));
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.post("/api/chat/reactions", loadUser, requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const { messageId, emoji } = req.body;
    if (!messageId || !emoji) return res.status(400).json({ error: "messageId and emoji required" });
    try {
      const reactions = await storage.getReactions([messageId]);
      const existing = reactions.find(r => r.messageId === messageId && r.userId === authReq.user!.id && r.emoji === emoji);
      if (existing) {
        await storage.removeReaction(messageId, authReq.user!.id, emoji);
        res.json({ action: "removed" });
      } else {
        await storage.addReaction(messageId, authReq.user!.id, emoji);
        res.json({ action: "added" });
      }
    } catch (err) {
      res.status(500).json({ error: "Failed to toggle reaction" });
    }
  });

  app.post("/api/chat/messages", chatUpload.single("file"), async (req, res) => {
    if (!req.session?.userId) return res.status(401).json({ error: "Not authenticated" });
    const userId = req.session.userId;
    const message = (req.body.message || "").trim();
    const teamId = req.body.teamId ? parseInt(req.body.teamId) : null;
    const file = req.file;

    if (!message && !file) {
      return res.status(400).json({ error: "Message or file required" });
    }
    if (message && message.length > 500) {
      return res.status(400).json({ error: "Message too long" });
    }

    if (teamId) {
      const userTeams = await storage.getTeamsByUser(userId);
      if (!userTeams.some(t => t.id === teamId)) {
        return res.status(403).json({ error: "Not a team member" });
      }
    }

    const now = Date.now();
    const userRates = chatRateLimit.get(userId) || [];
    const recent = userRates.filter(t => now - t < 60000);
    if (recent.length >= 20) return res.status(429).json({ error: "Too many messages" });
    recent.push(now);
    chatRateLimit.set(userId, recent);
    try {
      const user = await storage.getUser(userId);
      let messageType = "text";
      let fileUrl: string | null = null;
      if (file) {
        messageType = file.mimetype.startsWith("video/") ? "video" : "image";
        fileUrl = `/uploads/${file.filename}`;
      }
      const created = await storage.createChatMessage({
        userId,
        username: user?.username || "Anonymous",
        photoUrl: user?.photoUrl || null,
        message: message || (messageType === "image" ? "📷 Photo" : "🎥 Video"),
        messageType,
        fileUrl,
        teamId,
      });
      res.json(created);
    } catch (err) {
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  // GEOINT hints reference endpoint
  app.get("/api/geoint-hints", (_req, res) => {
    const hints = [
      {
        category: "road_signs",
        icon: "🛣️",
        items: [
          { region: "Europe (EU)", hint: "White rectangular signs with red borders, blue motorway signs" },
          { region: "USA/Canada", hint: "Green highway signs, yellow diamond warning signs, stop signs with white text" },
          { region: "Japan", hint: "Blue info signs, inverted triangle yield, red circle prohibition" },
          { region: "Australia", hint: "Yellow diamond signs, green/gold highway markers, kangaroo warnings" },
          { region: "Russia/CIS", hint: "Blue rectangular info signs, white speed limit with red circle" },
          { region: "Middle East", hint: "Arabic + English text, green signs, km-based distances" },
          { region: "South America", hint: "Spanish/Portuguese text, similar to EU style but local variations" },
          { region: "Africa", hint: "French/English text depending on region, varied sign quality" }
        ]
      },
      {
        category: "road_markings",
        icon: "🔲",
        items: [
          { region: "UK/Japan/Australia", hint: "Left-hand traffic, road markings on left side" },
          { region: "Continental Europe", hint: "Right-hand traffic, white dashed center lines" },
          { region: "USA", hint: "Yellow center lines (double/single), white lane lines" },
          { region: "Southeast Asia", hint: "Mixed quality, sometimes absent in rural areas" }
        ]
      },
      {
        category: "license_plates",
        icon: "🚗",
        items: [
          { region: "EU countries", hint: "Blue strip on left with country code and EU stars" },
          { region: "USA", hint: "State-specific designs, various colors and graphics" },
          { region: "Russia", hint: "White with black text, region code on right" },
          { region: "Japan", hint: "Green (commercial) or white (private), prefecture name in Japanese" },
          { region: "Brazil", hint: "Mercosul standard: white with blue top strip" },
          { region: "Middle East", hint: "Arabic numerals, country-specific colors" },
          { region: "China", hint: "Blue plate with white characters, first character is province" }
        ]
      },
      {
        category: "architecture",
        icon: "🏠",
        items: [
          { region: "Eastern Europe", hint: "Soviet-era panel buildings (khrushchyovkas), concrete fences, 5-9 floor blocks" },
          { region: "Western Europe", hint: "Stone/brick buildings, tiled roofs, narrow streets in old towns" },
          { region: "Southeast Asia", hint: "Shophouses, corrugated metal roofs, open-air markets" },
          { region: "Middle East", hint: "Flat roofs, sand/beige colored walls, courtyard houses" },
          { region: "Latin America", hint: "Colorful painted walls, flat concrete roofs, rebar visible on top" },
          { region: "Sub-Saharan Africa", hint: "Corrugated iron roofs, red laterite soil, compound walls" },
          { region: "Japan", hint: "Compact houses, curved tile roofs, vending machines everywhere" },
          { region: "USA/Canada", hint: "Wood-frame houses, front lawns, attached garages, wide streets" }
        ]
      },
      {
        category: "fences_barriers",
        icon: "🚧",
        items: [
          { region: "Eastern Europe/CIS", hint: "Concrete panel fences (PO-2), metal corrugated fences, brick columns" },
          { region: "Western Europe", hint: "Hedges, wooden picket fences, stone walls" },
          { region: "USA", hint: "Chain-link fences, white vinyl fences, split-rail wood" },
          { region: "Latin America", hint: "High concrete walls with broken glass on top, iron gates" },
          { region: "Australia", hint: "Post and wire fences, Colorbond steel fences" },
          { region: "Japan", hint: "Block walls with tile caps, bamboo fences near temples" }
        ]
      },
      {
        category: "vegetation",
        icon: "🌿",
        items: [
          { region: "Tropical (SE Asia, Central Africa)", hint: "Palm trees, banana plants, dense jungle canopy" },
          { region: "Mediterranean", hint: "Olive trees, cypress, dry scrubland, pine forests" },
          { region: "Northern Europe/Russia", hint: "Birch forests, coniferous (spruce/pine), moss" },
          { region: "Desert (Sahara, Arabia)", hint: "Sparse vegetation, date palms near oases, sand dunes" },
          { region: "South America", hint: "Rainforest, cacti in arid regions, pampas grasslands" },
          { region: "Australia", hint: "Eucalyptus, red earth, spinifex grass, baobab-like trees" }
        ]
      },
      {
        category: "utility_poles",
        icon: "⚡",
        items: [
          { region: "Japan", hint: "Dense wiring, wooden/concrete poles, many transformers" },
          { region: "USA", hint: "Wooden poles, crossarm design, less dense wiring" },
          { region: "Europe (Western)", hint: "Underground cables common, fewer visible poles in cities" },
          { region: "Eastern Europe", hint: "Concrete poles, Soviet-standard designs, above-ground wires" },
          { region: "Southeast Asia", hint: "Chaotic wiring clusters, overloaded poles" }
        ]
      },
      {
        category: "ground_surface",
        icon: "🧱",
        items: [
          { region: "Netherlands/Germany", hint: "Red/brown brick pavers, herringbone pattern" },
          { region: "Portugal", hint: "Calçada portuguesa — black and white stone mosaic sidewalks" },
          { region: "Russia/Ukraine", hint: "Concrete tiles (FEM), asphalt with patches, curbs painted white" },
          { region: "Japan", hint: "Tactile paving (yellow bumps) for visually impaired, clean asphalt" },
          { region: "USA", hint: "Wide concrete sidewalks, asphalt roads, painted curbs" },
          { region: "India", hint: "Mixed surfaces, red laterite, unfinished edges" }
        ]
      },
      {
        category: "language_scripts",
        icon: "🔤",
        items: [
          { region: "Cyrillic", hint: "Russia, Ukraine, Serbia, Bulgaria, Mongolia" },
          { region: "Arabic script", hint: "Middle East, North Africa, Iran (Farsi), Pakistan (Urdu)" },
          { region: "Devanagari", hint: "India (Hindi, Marathi, Nepali)" },
          { region: "Thai script", hint: "Thailand — unique curvy characters" },
          { region: "Hangul", hint: "South Korea — block-shaped syllable characters" },
          { region: "Kanji + Hiragana + Katakana", hint: "Japan — mixed scripts" },
          { region: "Simplified Chinese", hint: "China — fewer strokes than traditional" },
          { region: "Traditional Chinese", hint: "Taiwan, Hong Kong — more complex characters" }
        ]
      },
      {
        category: "vehicles",
        icon: "🚙",
        items: [
          { region: "Southeast Asia", hint: "Many motorbikes/scooters, tuk-tuks, songthaews" },
          { region: "India", hint: "Auto-rickshaws, Tata/Mahindra trucks, colorful decorations" },
          { region: "Japan", hint: "Kei cars (tiny), Toyota/Honda dominant, very clean vehicles" },
          { region: "Russia", hint: "Lada, UAZ, many Hyundai/Kia, dashcams visible" },
          { region: "USA", hint: "Large pickup trucks, SUVs, wider vehicles overall" },
          { region: "Africa", hint: "Older model vehicles, overloaded trucks, matatus (minibuses)" }
        ]
      }
    ];
    res.json({ hints });
  });

  // Start the bot
  try {
      await setupBot(storage);
  } catch (err) {
      console.error("Failed to setup bot:", err);
  }

  // Seed data if needed - wrapped in try/catch for first run without tables
  try {
    const stats = await storage.getStats();
    if (stats.totalUsers === 0) {
        console.log("Seeding initial data...");
        await storage.createUser({
            tgId: "123456789",
            username: "admin_demo",
            lang: "UA",
            tier: "PREMIUM"
        });
    }
  } catch (err) {
    console.log("Database tables not ready yet - skipping seed (run db:push to create tables)");
  }

  // ============ Daily Email Broadcast Scheduler ============
  setInterval(async () => {
    try {
      const enabled = await storage.getAdminSetting("daily_email_enabled");
      if (enabled !== "true") return;

      const now = new Date();
      if (now.getUTCHours() !== 10) return;

      const lastSent = await storage.getAdminSetting("daily_email_last_sent");
      if (lastSent) {
        const lastDate = new Date(lastSent);
        const hoursSince = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60);
        if (hoursSince < 20) return;
      }

      const subject = await storage.getAdminSetting("daily_email_subject");
      const title = await storage.getAdminSetting("daily_email_title");
      const body = await storage.getAdminSetting("daily_email_body");

      if (!subject || !title || !body) {
        console.log("[Daily Email] Skipping — subject/title/body not configured");
        return;
      }

      console.log("[Daily Email] Running scheduled daily email broadcast...");

      const { sendEmailBroadcast, buildBroadcastHtml } = await import("./emailService");
      const html = buildBroadcastHtml(title, body);

      const emailResult = await pool.query("SELECT email FROM auth_users WHERE email IS NOT NULL AND email != ''");
      const emails = emailResult.rows.map((r: any) => r.email);

      if (emails.length === 0) {
        console.log("[Daily Email] No subscribers found");
        return;
      }

      const result = await sendEmailBroadcast({ to: emails, subject, html });

      await storage.setAdminSetting("daily_email_last_sent", new Date().toISOString());
      await storage.setAdminSetting("daily_email_last_reach", result.sent.toString());

      console.log(`[Daily Email] Done: ${result.sent} sent, ${result.failed} failed out of ${emails.length}`);
    } catch (err) {
      console.error("[Daily Email] Scheduler error:", err);
    }
  }, 60 * 60 * 1000);

  // ============ DARKSHARE v4.5 — Compliance & Wow Features ============

  // GDPR Data Deletion Request — automatic removal from our index/cache
  // Art. 17 GDPR (Right to erasure) + UK DPA 2018 + ЗУ "Про захист персональних даних"
  app.post("/api/data-deletion", loadUser, async (req: Request, res: Response) => {
    try {
      const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0] || req.ip || "anon";
      if (rateLimit(`del:${ip}`, 3, 60 * 60 * 1000)) {
        return res.status(429).json({ error: "Too many requests. Try again in an hour." });
      }
      const { insertDataDeletionRequestSchema } = await import("@shared/schema");
      const parsed = insertDataDeletionRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
      }
      const userId = (req as any).user?.id ?? null;
      const created = await storage.createDataDeletionRequest({ ...parsed.data, userId });

      // ---- AUTOMATIC ERASURE — only for authenticated users on THEIR OWN rows ----
      // Unauthenticated / cross-user requests stay `pending` and go to admin queue.
      let deletedCounts = { watches: 0, reports: 0, favorites: 0, threatProfiles: 0, chatMessages: 0 };
      const identifier = (parsed.data.identifier || "").trim();
      const canAutoErase = !!userId && identifier.length >= 3 && identifier.length <= 256;
      try {
        if (canAutoErase) {
          const { db: dbConn } = await import("./db");
          const schema = await import("@shared/schema");
          const { eq, and } = await import("drizzle-orm");
          if (dbConn) {
            const ident = identifier;

            const w = await dbConn.delete(schema.watches)
              .where(and(eq(schema.watches.userId, userId), eq(schema.watches.value, ident)))
              .returning({ id: schema.watches.id });
            deletedCounts.watches = w.length;

            const f = await dbConn.delete(schema.favorites)
              .where(and(eq(schema.favorites.userId, userId), eq(schema.favorites.value, ident)))
              .returning({ id: schema.favorites.id });
            deletedCounts.favorites = f.length;

            const tp = await dbConn.delete(schema.threatProfiles)
              .where(and(eq(schema.threatProfiles.userId, userId), eq(schema.threatProfiles.query, ident)))
              .returning({ id: schema.threatProfiles.id });
            deletedCounts.threatProfiles = tp.length;

            // Reports: delete by exact value match in object_type/data_json scoped to user only.
            // Use parameterized query; require exact identifier presence in data_json text.
            try {
              const { sql } = await import("drizzle-orm");
              const r = await dbConn.execute(
                sql`DELETE FROM ds_reports WHERE user_id = ${userId} AND data_json::text LIKE ${"%" + ident.replace(/[%_\\]/g, "\\$&") + "%"} ESCAPE '\\' RETURNING id`
              );
              deletedCounts.reports = (r as any).rowCount ?? ((r as any).rows?.length ?? 0);
            } catch (e) { console.error("[GDPR] reports purge error:", e); }
            // chatMessages: only purge user's own messages exactly equal to identifier (no substring abuse)
            try {
              const c = await dbConn.delete(schema.chatMessages)
                .where(and(eq(schema.chatMessages.userId, userId), eq(schema.chatMessages.message, ident)))
                .returning({ id: schema.chatMessages.id });
              deletedCounts.chatMessages = c.length;
            } catch (e) { /* ignore */ }
          }
        }
      } catch (e) {
        console.error("[GDPR] auto-erasure error:", e);
      }

      const totalDeleted = Object.values(deletedCounts).reduce((a, b) => a + b, 0);
      const status = canAutoErase ? "auto_resolved" : "pending";
      const notes = canAutoErase
        ? `Auto-erased ${totalDeleted} records for user #${userId}: watches=${deletedCounts.watches}, reports=${deletedCounts.reports}, favorites=${deletedCounts.favorites}, threatProfiles=${deletedCounts.threatProfiles}, chatMessages=${deletedCounts.chatMessages}`
        : userId
          ? "Pending: identifier missing or invalid length"
          : "Pending: unauthenticated request requires manual identity verification (GDPR Art. 12(6))";
      try {
        await storage.updateDataDeletionRequest(created.id, { status, adminNotes: notes, resolvedAt: canAutoErase ? new Date() : undefined });
      } catch {}

      try {
        for (const adminId of ADMIN_IDS) {
          await botInstance?.telegram.sendMessage(
            adminId,
            `🗑 GDPR request #${created.id}\n\nStatus: ${status}\nEmail: ${created.email}\nUser: ${userId ?? "anonymous"}\nIdentifier: ${created.identifier ?? "—"}\nAuto-deleted: ${totalDeleted}${canAutoErase ? ` (W:${deletedCounts.watches} R:${deletedCounts.reports} F:${deletedCounts.favorites} TP:${deletedCounts.threatProfiles} C:${deletedCounts.chatMessages})` : ""}\nReason: ${created.reason ?? "—"}`
          ).catch(() => {});
        }
      } catch {}
      return res.json({ success: true, requestId: created.id, status, deletedCount: totalDeleted, breakdown: deletedCounts, autoErased: canAutoErase });
    } catch (err: any) {
      console.error("Data deletion request error:", err);
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // Compromise Wizard — free, public
  app.post("/api/wizard/compromise", async (req: Request, res: Response) => {
    try {
      const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0] || req.ip || "anon";
      if (rateLimit(`wiz:${ip}`, 30, 60 * 60 * 1000)) {
        return res.status(429).json({ error: "Rate limit. Спробуйте за годину." });
      }
      const { generateCompromiseChecklist } = await import("./wizardService");
      const result = generateCompromiseChecklist({
        exposureType: req.body?.exposureType ?? "unknown",
        affectedServices: Array.isArray(req.body?.affectedServices) ? req.body.affectedServices.slice(0, 20) : [],
        hasFinancialAccess: !!req.body?.hasFinancialAccess,
        hasSensitiveData: !!req.body?.hasSensitiveData,
        is2faEnabled: !!req.body?.is2faEnabled,
        hasSimAccess: !!req.body?.hasSimAccess,
        language: ["uk", "ru", "en"].includes(req.body?.language) ? req.body.language : "uk",
      });
      return res.json(result);
    } catch (err: any) {
      console.error("Wizard error:", err);
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // Takedown Letter Generator — free, public
  app.post("/api/takedown-letter", loadUser, async (req: Request, res: Response) => {
    try {
      const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0] || req.ip || "anon";
      if (rateLimit(`tdn:${ip}`, 10, 60 * 60 * 1000)) {
        return res.status(429).json({ error: "Rate limit. Try again later." });
      }
      const { generateTakedownLetter } = await import("./takedownService");
      const language = ["uk", "ru", "en"].includes(req.body?.language) ? req.body.language : "uk";
      const jurisdiction = ["EU", "UK", "UA", "US", "RU", "OTHER"].includes(req.body?.jurisdiction) ? req.body.jurisdiction : "EU";
      const recipientType = ["website_admin", "hosting_provider", "search_engine", "social_platform", "data_broker"].includes(req.body?.recipientType) ? req.body.recipientType : "website_admin";
      const dataDescription = String(req.body?.dataDescription ?? "").slice(0, 4000);
      if (!dataDescription || dataDescription.length < 10) {
        return res.status(400).json({ error: "dataDescription required (min 10 chars)" });
      }
      const letterText = generateTakedownLetter({
        recipientType,
        recipientName: String(req.body?.recipientName ?? "").slice(0, 200) || undefined,
        recipientEmail: String(req.body?.recipientEmail ?? "").slice(0, 200) || undefined,
        dataDescription,
        jurisdiction,
        language,
        requesterName: String(req.body?.requesterName ?? "").slice(0, 200) || undefined,
        requesterEmail: String(req.body?.requesterEmail ?? "").slice(0, 200) || undefined,
        urlsContainingData: Array.isArray(req.body?.urlsContainingData) ? req.body.urlsContainingData.slice(0, 20).map((u: any) => String(u).slice(0, 500)) : undefined,
      });
      const userId = (req as any).user?.id;
      if (userId) {
        try {
          await storage.createTakedownLetter({
            userId,
            recipientType,
            recipientName: req.body?.recipientName ?? null,
            recipientEmail: req.body?.recipientEmail ?? null,
            dataDescription,
            jurisdiction,
            language,
            letterText,
          });
        } catch (e) { console.error("Failed to save takedown letter:", e); }
      }
      return res.json({ letterText, jurisdiction, language });
    } catch (err: any) {
      console.error("Takedown letter error:", err);
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // AI Threat Profile — auth required, PRO+ tier
  app.post("/api/threat-profile", loadUser, requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) return res.status(401).json({ error: "Auth required" });
      const user = await storage.getUserById(userId);
      if (!user) return res.status(401).json({ error: "User not found" });
      const tier = (user.tier || "FREE").toUpperCase();
      if (tier === "FREE") {
        return res.status(403).json({ error: "PRO_REQUIRED", message: "AI Threat Profile доступний на PRO+ тарифі." });
      }
      if (rateLimit(`tp:${userId}`, 10, 60 * 60 * 1000)) {
        return res.status(429).json({ error: "Rate limit. 10 профілів на годину." });
      }
      const query = String(req.body?.query ?? "").slice(0, 200);
      const queryType = ["username", "email", "phone", "wallet", "ip", "domain"].includes(req.body?.queryType) ? req.body.queryType : "username";
      if (!query || query.length < 2) {
        return res.status(400).json({ error: "Query required" });
      }
      const { generateThreatProfile } = await import("./threatProfilerService");
      const profile = await generateThreatProfile({
        query,
        queryType,
        context: {
          findings: Array.isArray(req.body?.context?.findings) ? req.body.context.findings.slice(0, 20) : [],
          relatedAccounts: Array.isArray(req.body?.context?.relatedAccounts) ? req.body.context.relatedAccounts.slice(0, 20) : [],
          breaches: Array.isArray(req.body?.context?.breaches) ? req.body.context.breaches.slice(0, 20) : [],
          riskScore: typeof req.body?.context?.riskScore === "number" ? req.body.context.riskScore : 0,
        },
      });
      const saved = await storage.createThreatProfile({
        userId,
        query,
        queryType,
        profileJson: profile as any,
        confidenceScore: profile.riskScore,
      });
      return res.json({ id: saved.id, profile });
    } catch (err: any) {
      console.error("Threat profile error:", err);
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // List user's threat profiles
  app.get("/api/threat-profiles", loadUser, requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) return res.status(401).json({ error: "Auth required" });
      const list = await storage.getThreatProfiles(userId, 30);
      return res.json(list);
    } catch (err: any) {
      console.error("Threat profiles list error:", err);
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // Admin: list deletion requests
  app.get("/api/admin/data-deletion", loadUser, requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) return res.status(401).json({ error: "Auth required" });
      const user = await storage.getUserById(userId);
      if (!user || !ADMIN_IDS.includes(String(user.tgId || ""))) {
        return res.status(403).json({ error: "Admin only" });
      }
      const status = typeof req.query.status === "string" ? req.query.status : undefined;
      const list = await storage.getDataDeletionRequests(status);
      return res.json(list);
    } catch (err: any) {
      console.error("Admin deletion list error:", err);
      return res.status(500).json({ error: "Internal error" });
    }
  });

  app.patch("/api/admin/data-deletion/:id", loadUser, requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) return res.status(401).json({ error: "Auth required" });
      const user = await storage.getUserById(userId);
      if (!user || !ADMIN_IDS.includes(String(user.tgId || ""))) {
        return res.status(403).json({ error: "Admin only" });
      }
      const id = parseInt(req.params.id, 10);
      const updates: any = {};
      if (typeof req.body?.status === "string") updates.status = req.body.status;
      if (typeof req.body?.adminNotes === "string") updates.adminNotes = req.body.adminNotes;
      if (req.body?.status === "resolved") updates.resolvedAt = new Date();
      const updated = await storage.updateDataDeletionRequest(id, updates);
      return res.json(updated);
    } catch (err: any) {
      console.error("Admin deletion update error:", err);
      return res.status(500).json({ error: "Internal error" });
    }
  });

  return httpServer;
}
