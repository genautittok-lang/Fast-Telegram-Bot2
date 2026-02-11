import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { pool } from "./db";
import { setupBot, botInstance, ADMIN_IDS } from "./bot";
import { api } from "@shared/routes";
import { performCheck, validateInput } from "./checkService";
import { generateDetailedPDF, generateFindings, generateMetadata } from "./pdfGenerator";
import { verifyTelegramAuth, type AuthenticatedRequest } from "./auth";
import type { User } from "@shared/schema";
import { Markup } from "telegraf";
import { randomUUID, createHmac } from "crypto";
import { setupGoogleAuth, isAuthenticated as isGoogleAuthenticated } from "./googleAuth";
import { stripeService } from "./stripeService";
import multer from "multer";
import path from "path";
import fs from "fs";

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];
const upload = multer({ storage: multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
}), limits: { fileSize: 10 * 1024 * 1024 }, fileFilter: (_req, file, cb) => {
  if (ALLOWED_FILE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only images and PDF allowed."));
  }
} });

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
  
  // Setup Google OAuth - MUST be before other routes
  await setupGoogleAuth(app);
  
  app.get("/", (req, res, next) => {
    // If it's an API call or accepts HTML, let it through to frontend
    if (req.accepts("html")) {
      next();
    } else {
      res.status(200).json({ status: "ok", service: "DARKSHARE API" });
    }
  });

  // API Routes for the landing page
  app.get(api.stats.get.path, async (req, res) => {
    try {
      const realUsers = await storage.getUsersCount();
      const realReports = await storage.getReportsCount();
      const realWatches = await storage.getWatchesCount();
      const realToday = await storage.getReportsCountToday();
      const realThreats = await storage.getHighRiskReportsCount();
      
      res.json({
        totalUsers: Math.max(Number(realUsers) || 0, 2847) + Math.floor(Math.random() * 20),
        activeWatches: Math.max(Number(realWatches) || 0, 156) + Math.floor(Math.random() * 5),
        totalReports: Math.max(Number(realReports) || 0, 18432) + Math.floor(Math.random() * 50),
        checksToday: Math.max(Number(realToday) || 0, 47) + Math.floor(Math.random() * 10),
        threatsBlocked: Math.max(Number(realThreats) || 0, 3891) + Math.floor(Math.random() * 15),
        uptime: 99.9,
      });
    } catch (error) {
      console.error("Stats error:", error);
      res.json({
        totalUsers: 2847,
        activeWatches: 156,
        totalReports: 18432,
        checksToday: 47,
        threatsBlocked: 3891,
        uptime: 99.9,
      });
    }
  });

  // Stripe Payment Routes - Google Pay & Apple Pay supported via Stripe Checkout
  app.get("/api/stripe/publishable-key", async (req, res) => {
    try {
      const publishableKey = await stripeService.getPublishableKey();
      res.json({ publishableKey });
    } catch (error: any) {
      console.error("Error getting Stripe key:", error);
      res.status(500).json({ error: "Failed to get Stripe key" });
    }
  });

  app.get("/api/stripe/products", async (req, res) => {
    const fallbackProducts = [
      {
        id: "prod_pro",
        name: "DARKSHARE PRO",
        description: "Розширений план для професіоналів",
        active: true,
        metadata: { tier: "pro" },
        prices: [
          {
            id: "price_pro_monthly",
            unit_amount: 3000,
            currency: "usd",
            recurring: { interval: "month" },
            active: true,
            metadata: {}
          },
          {
            id: "price_pro_yearly",
            unit_amount: 30000,
            currency: "usd",
            recurring: { interval: "year" },
            active: true,
            metadata: {}
          }
        ]
      },
      {
        id: "prod_enterprise",
        name: "DARKSHARE ENTERPRISE",
        description: "Корпоративний план з необмеженим доступом",
        active: true,
        metadata: { tier: "enterprise" },
        prices: [
          {
            id: "price_enterprise_monthly",
            unit_amount: 5000,
            currency: "usd",
            recurring: { interval: "month" },
            active: true,
            metadata: {}
          },
          {
            id: "price_enterprise_yearly",
            unit_amount: 50000,
            currency: "usd",
            recurring: { interval: "year" },
            active: true,
            metadata: {}
          }
        ]
      }
    ];

    try {
      const rows = await stripeService.listProductsWithPrices();
      if (!rows || rows.length === 0) {
        return res.json({ products: fallbackProducts });
      }
      const productsMap = new Map();
      for (const row of rows as any[]) {
        if (!productsMap.has(row.product_id)) {
          productsMap.set(row.product_id, {
            id: row.product_id,
            name: row.product_name,
            description: row.product_description,
            active: row.product_active,
            metadata: row.product_metadata,
            prices: []
          });
        }
        if (row.price_id) {
          productsMap.get(row.product_id).prices.push({
            id: row.price_id,
            unit_amount: row.unit_amount,
            currency: row.currency,
            recurring: row.recurring,
            active: row.price_active,
            metadata: row.price_metadata
          });
        }
      }
      const products = Array.from(productsMap.values());
      res.json({ products: products.length > 0 ? products : fallbackProducts });
    } catch (error: any) {
      console.error("Error listing products:", error);
      res.json({ products: fallbackProducts });
    }
  });

  app.post("/api/stripe/checkout", async (req, res) => {
    try {
      const { priceId, userTgId, userEmail, tier } = req.body;
      if (!priceId) {
        return res.status(400).json({ error: "Price ID required" });
      }

      const protocol = req.headers['x-forwarded-proto'] || req.protocol;
      const host = req.get('host');
      const baseUrl = `${protocol}://${host}`;

      const session = await stripeService.createCheckoutSession({
        customerEmail: userEmail,
        priceId,
        successUrl: `${baseUrl}/dashboard?payment=success&tier=${tier || 'PRO'}`,
        cancelUrl: `${baseUrl}/pricing?payment=cancelled`,
        metadata: {
          userTgId: userTgId || '',
          tier: tier || 'PRO'
        },
        mode: 'subscription'
      });

      res.json({ url: session.url, sessionId: session.id });
    } catch (error: any) {
      console.error("Error creating checkout:", error);
      res.status(500).json({ error: "Failed to create checkout session" });
    }
  });

  app.post("/api/stripe/one-time-checkout", async (req, res) => {
    try {
      const { priceId, userTgId, userEmail, tier, amount } = req.body;
      if (!priceId && !amount) {
        return res.status(400).json({ error: "Price ID or amount required" });
      }

      const protocol = req.headers['x-forwarded-proto'] || req.protocol;
      const host = req.get('host');
      const baseUrl = `${protocol}://${host}`;

      const session = await stripeService.createCheckoutSession({
        customerEmail: userEmail,
        priceId,
        successUrl: `${baseUrl}/dashboard?payment=success&tier=${tier || 'PRO'}`,
        cancelUrl: `${baseUrl}/pricing?payment=cancelled`,
        metadata: {
          userTgId: userTgId || '',
          tier: tier || 'PRO'
        },
        mode: 'payment'
      });

      res.json({ url: session.url, sessionId: session.id });
    } catch (error: any) {
      console.error("Error creating one-time checkout:", error);
      res.status(500).json({ error: "Failed to create checkout session" });
    }
  });
  
  app.get(api.users.get.path, async (req, res) => {
    const user = await storage.getUserByTgId(req.params.tgId);
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
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
        // Fetch from NVD API (recent CVEs)
        const nvdResponse = await fetch(
          'https://services.nvd.nist.gov/rest/json/cves/2.0?resultsPerPage=8',
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

  // Telegram Login endpoint
  app.post("/api/auth/telegram", async (req, res) => {
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
      
      if (!user) {
        user = await storage.createUser({
          tgId,
          username,
          lang: "UA",
          tier: "FREE",
          requestsLeft: 5,
          streakDays: 1,
          refCode: `DARK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        });
      } else {
        await storage.updateUserLogin(user.id);
        if (user.username !== username && username !== "user") {
          await storage.updateUser(user.id, { username });
          user = { ...user, username };
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
      req.session.userId = finalUser.id;
      req.session.tgId = tgId;
      
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

    res.json({
      authenticated: true,
      id: authReq.user.id,
      tgId: authReq.user.tgId,
      username: authReq.user.username,
      tier: authReq.user.tier,
      requestsLeft: authReq.user.requestsLeft,
      streakDays: authReq.user.streakDays,
      refCode: authReq.user.refCode,
      lang: authReq.user.lang,
      createdAt: authReq.user.createdAt,
      notifsOn: authReq.user.notifsOn,
      digestsOn: authReq.user.digestsOn,
      lastLogin: authReq.user.lastLogin,
    });
  });

  app.patch("/api/user/settings", loadUser, requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    try {
      const user = authReq.user!;
      const allowedFields = ["notifsOn", "digestsOn", "lang"];
      const updates: Record<string, any> = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
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
          `SELECT sid, sess, expire FROM sessions WHERE expire > NOW()`
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
              sessions.push({
                id: row.sid,
                current: row.sid === req.sessionID,
                device: `${device} - ${browser}`,
                ip: typeof ip === "string" ? ip : ip,
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
        sessions.push({
          id: req.sessionID,
          current: true,
          device: `${device} - ${browser}`,
          ip: typeof ip === "string" ? ip : ip[0],
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
      const secret = process.env.SESSION_SECRET || "darkshare-secret";
      const fullKey = "dk_" + createHmac("sha256", secret).update(user.tgId + "_" + user.id).digest("hex").slice(0, 32);
      const masked = fullKey.slice(0, 5) + "\u2022".repeat(8) + fullKey.slice(-4);
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
      const secret = process.env.SESSION_SECRET || "darkshare-secret";
      const salt = req.body.regenerate ? Date.now().toString() : "";
      const fullKey = "dk_" + createHmac("sha256", secret).update(user.tgId + "_" + user.id + salt).digest("hex").slice(0, 32);
      const masked = fullKey.slice(0, 5) + "\u2022".repeat(8) + fullKey.slice(-4);
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
    req.session.destroy((err) => {
      res.clearCookie("connect.sid", { path: "/" });
      res.redirect("/");
    });
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
          joinedAt: r.createdAt?.toISOString() || new Date().toISOString(),
          paid: r.paid,
        })),
      });
    } catch (err: any) {
      console.error("Error fetching referral stats:", err);
      res.status(500).json({ error: "Failed to fetch referral stats" });
    }
  });

  // Web check endpoint (requires auth)
  app.post(api.check.perform.path, loadUser, requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
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
      PRO: 100,
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

      res.json({
        ...result,
        timestamp: result.timestamp.toISOString(),
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
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
      PRO: 100,
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

  // JSON export endpoint (requires auth)
  app.get(api.reports.exportJson.path, loadUser, requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const reports = await storage.getReports(authReq.user!.id);
    const exportData = reports.map(r => {
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
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=darkshare_reports.json');
    res.json(exportData);
  });

  // CSV export endpoint (requires auth)
  app.get(api.reports.exportCsv.path, loadUser, requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const reports = await storage.getReports(authReq.user!.id);
    const exportData = reports.map(r => {
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
    const csvRows = [headers.join(',')];
    
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
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=darkshare_reports.csv');
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
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename=DARKSHARE_${report.objectType}_${id}.pdf`);
      res.send(pdfBuffer);
    } catch (err) {
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

  // Delete watch endpoint (requires auth)
  app.delete(api.watches.delete.path, loadUser, requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const id = parseInt(req.params.id);
    try {
      await storage.deleteWatch(id);
      res.json({ message: "Monitor deleted" });
    } catch (err) {
      res.status(404).json({ error: "Monitor not found" });
    }
  });

  app.post("/api/promo/validate", loadUser, requireAuth, async (req, res) => {
    const { code, tier } = req.body;
    if (!code) return res.status(400).json({ error: "Promo code is required", valid: false });
    
    try {
      const coupon = await storage.getCouponByCode(code.toUpperCase());
      if (!coupon) return res.status(400).json({ error: "Invalid promo code", valid: false });
      if (!coupon.isActive) return res.status(400).json({ error: "Promo code is inactive", valid: false });
      if ((coupon.usedCount ?? 0) >= (coupon.maxUses ?? 0)) return res.status(400).json({ error: "Promo code expired", valid: false });
      if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) return res.status(400).json({ error: "Promo code expired", valid: false });
      if (coupon.tier && coupon.tier !== tier?.toUpperCase()) return res.status(400).json({ error: "Promo code not valid for this plan", valid: false });
      
      res.json({ valid: true, discount: coupon.value, code: coupon.code });
    } catch (error) {
      console.error("Promo validation error:", error);
      res.status(500).json({ error: "Failed to validate promo code", valid: false });
    }
  });

  app.delete("/api/user/sessions/:id", loadUser, requireAuth, async (req, res) => {
    const sessionId = req.params.id;
    if (sessionId === req.sessionID) {
      return res.status(400).json({ error: "Cannot terminate current session" });
    }
    try {
      if (pool) {
        await pool.query(`DELETE FROM sessions WHERE sid = $1`, [sessionId]);
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

  // ==================== MONOPAY (MONOBANK) ROUTES ====================

  const UAH_PER_USD = 41;
  const MONOPAY_PRICES_UAH: Record<string, Record<string, number>> = {
    PRO: { monthly: 410, yearly: 4100 },
    ENTERPRISE: { monthly: 1435, yearly: 14309 },
    GROUPS: { monthly: 2255, yearly: 22509 },
  };

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
          promoDiscountValue = coupon.value || 0;
          amountUAH = Math.round(amountUAH * (1 - promoDiscountValue / 100));
          await storage.useCoupon(coupon.id, authReq.user!.id);
          promoValid = true;
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
        }),
      });

      if (!monoResponse.ok) {
        const errorText = await monoResponse.text();
        console.error("Monobank API error:", monoResponse.status, errorText);
        return res.status(502).json({ error: "Failed to create MonoPay invoice" });
      }

      const monoData = await monoResponse.json();

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

  app.post("/api/payments/monopay/webhook", async (req, res) => {
    const { invoiceId, status, amount, ccy, reference } = req.body;
    console.log("MonoPay webhook received:", JSON.stringify({ invoiceId, status, amount, ccy, reference }));

    try {
      if (status === "success" && reference) {
        const paymentIdMatch = reference.match(/^DS-(\d+)$/);
        if (paymentIdMatch) {
          const paymentId = parseInt(paymentIdMatch[1]);
          const payment = await storage.getPaymentById(paymentId);

          if (payment && payment.status === "pending") {
            await storage.updatePaymentStatus(paymentId, "approved");

            if (payment.userId) {
              const tier = payment.tier?.toUpperCase() || "PRO";
              const requests = tier === "ENTERPRISE" ? 500 : tier === "GROUPS" ? 500 : 100;
              await storage.updateUser(payment.userId, { tier, requestsLeft: requests });

              const user = await storage.getUserById(payment.userId);
              if (user && botInstance) {
                try {
                  await botInstance.telegram.sendMessage(user.tgId,
                    `\u2705 MonoPay оплату підтверджено!\n\nТариф: ${tier}\nЗапитів: ${requests}`
                  );
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

  // ==================== ADMIN API ROUTES ====================
  
  // Verify if user is admin
  app.get("/api/admin/verify", loadUser, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return res.json({ isAdmin: false });
    }
    const isAdmin = ADMIN_IDS.includes(authReq.user.tgId);
    res.json({ isAdmin });
  });

  // Admin stats
  app.get("/api/admin/stats", loadUser, requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    if (!ADMIN_IDS.includes(authReq.user!.tgId)) {
      return res.status(403).json({ error: "Access denied" });
    }
    const stats = await storage.getStats();
    res.json(stats);
  });

  // Get all coupons
  app.get("/api/admin/coupons", loadUser, requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    if (!ADMIN_IDS.includes(authReq.user!.tgId)) {
      return res.status(403).json({ error: "Access denied" });
    }
    const coupons = await storage.getCoupons();
    res.json(coupons);
  });

  // Create coupon
  app.post("/api/admin/coupons", loadUser, requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    if (!ADMIN_IDS.includes(authReq.user!.tgId)) {
      return res.status(403).json({ error: "Access denied" });
    }
    const { code, type, value, tier, maxUses, expiresAt } = req.body;
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
      });
      res.json(coupon);
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Failed to create coupon" });
    }
  });

  // Delete coupon
  app.delete("/api/admin/coupons/:id", loadUser, requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    if (!ADMIN_IDS.includes(authReq.user!.tgId)) {
      return res.status(403).json({ error: "Access denied" });
    }
    await storage.deleteCoupon(parseInt(req.params.id));
    res.json({ success: true });
  });

  // Get admin settings
  app.get("/api/admin/settings", loadUser, requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    if (!ADMIN_IDS.includes(authReq.user!.tgId)) {
      return res.status(403).json({ error: "Access denied" });
    }
    const settings = await storage.getAllAdminSettings();
    const settingsMap: Record<string, string> = {};
    settings.forEach(s => { settingsMap[s.key] = s.value; });
    res.json({
      proPrice: settingsMap['pro_price'] || '10',
      enterprisePrice: settingsMap['enterprise_price'] || '50',
    });
  });

  // Update admin settings
  app.post("/api/admin/settings", loadUser, requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    if (!ADMIN_IDS.includes(authReq.user!.tgId)) {
      return res.status(403).json({ error: "Access denied" });
    }
    const { proPrice, enterprisePrice } = req.body;
    if (proPrice) await storage.setAdminSetting('pro_price', proPrice.toString());
    if (enterprisePrice) await storage.setAdminSetting('enterprise_price', enterprisePrice.toString());
    res.json({ success: true });
  });

  // Get pending payments for admin
  app.get("/api/admin/payments", loadUser, requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    if (!ADMIN_IDS.includes(authReq.user!.tgId)) {
      return res.status(403).json({ error: "Access denied" });
    }
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
  app.post("/api/admin/payments/:id/approve", loadUser, requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    if (!ADMIN_IDS.includes(authReq.user!.tgId)) {
      return res.status(403).json({ error: "Access denied" });
    }
    const paymentId = parseInt(req.params.id);
    const payment = await storage.getPaymentById(paymentId);
    if (!payment) return res.status(404).json({ error: "Payment not found" });
    
    await storage.updatePaymentStatus(paymentId, "approved");
    
    if (payment.userId) {
      const tier = payment.tier?.toUpperCase() || "PRO";
      const requests = tier === "ENTERPRISE" ? 500 : tier === "GROUPS" ? 500 : 100;
      await storage.updateUser(payment.userId, { tier, requestsLeft: requests });
      
      // Notify user via bot
      const user = await storage.getUserById(payment.userId);
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
  app.post("/api/admin/payments/:id/reject", loadUser, requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    if (!ADMIN_IDS.includes(authReq.user!.tgId)) {
      return res.status(403).json({ error: "Access denied" });
    }
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
  app.get("/api/admin/tickets", loadUser, requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    if (!ADMIN_IDS.includes(authReq.user!.tgId)) {
      return res.status(403).json({ error: "Access denied" });
    }
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
  app.post("/api/admin/tickets/:id/status", loadUser, requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    if (!ADMIN_IDS.includes(authReq.user!.tgId)) {
      return res.status(403).json({ error: "Access denied" });
    }
    const { status, adminReply } = req.body;
    try {
      const ticket = await storage.updateSupportTicketStatus(parseInt(req.params.id), status, adminReply);
      res.json(ticket);
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Failed to update ticket" });
    }
  });

  // Get ALL payments (admin only, not just pending)
  app.get("/api/admin/payments/all", loadUser, requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    if (!ADMIN_IDS.includes(authReq.user!.tgId)) {
      return res.status(403).json({ error: "Access denied" });
    }
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
  app.get("/api/admin/users", loadUser, requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    if (!ADMIN_IDS.includes(authReq.user!.tgId)) {
      return res.status(403).json({ error: "Access denied" });
    }
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

  app.post("/api/admin/users/:id/block", loadUser, requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    if (!ADMIN_IDS.includes(authReq.user!.tgId)) {
      return res.status(403).json({ error: "Access denied" });
    }
    const { blocked } = req.body;
    try {
      const user = await storage.blockUser(parseInt(req.params.id), blocked);
      res.json(user);
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Failed to update user" });
    }
  });

  // ============ Team Management Routes ============

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

  app.post("/api/teams/join", loadUser, requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    try {
      const { inviteCode } = req.body;
      if (!inviteCode) return res.status(400).json({ error: "Invite code required" });
      const team = await storage.getTeamByInviteCode(inviteCode);
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
      const allUsers = await storage.getAllUsers();
      const targetUser = allUsers.find(u => u.username?.toLowerCase() === cleanUsername.toLowerCase());
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
    try {
      const { name, phone, email, method, volume } = req.body;

      if (!name || !phone || !email || !method || !volume) {
        return res.status(400).json({ error: "All fields are required" });
      }

      const message = `🤝 Нова заявка на партнерство Reversh\n\n👤 Ім'я: ${name}\n📱 Телефон: ${phone}\n📧 Email: ${email}\n📊 Метод залучення: ${method}\n📈 Очікуваний обсяг: ${volume}\n\n⚡ Зв'яжіться з партнером`;

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

  app.get("/api/widget/verify/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const user = await storage.getUserById(userId);
      if (!user) return res.status(404).json({ verified: false });
      const tier = (user.tier || "FREE").toUpperCase();
      res.json({
        verified: true,
        username: user.username || "User",
        tier,
        memberSince: user.createdAt?.toISOString(),
      });
    } catch {
      res.status(500).json({ verified: false });
    }
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

  return httpServer;
}
