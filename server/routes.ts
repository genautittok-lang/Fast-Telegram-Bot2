import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupBot, botInstance, ADMIN_IDS } from "./bot";
import { api } from "@shared/routes";
import { performCheck, validateInput } from "./checkService";
import { generateDetailedPDF, generateFindings, generateMetadata } from "./pdfGenerator";
import { verifyTelegramAuth, type AuthenticatedRequest } from "./auth";
import type { User } from "@shared/schema";
import { Markup } from "telegraf";
import { randomUUID } from "crypto";
import { setupGoogleAuth, isAuthenticated as isGoogleAuthenticated } from "./googleAuth";
import { stripeService } from "./stripeService";

function generateVerificationId(): string {
  return `DS-${randomUUID().split('-').slice(0, 2).join('').toUpperCase()}`;
}

// Server start time for uptime calculation
const serverStartTime = Date.now();

// Simulated activity feed
const recentActivity: Array<{ type: string; target: string; riskLevel: string; timestamp: string }> = [];

export function addActivity(type: string, target: string, riskLevel: string) {
  recentActivity.unshift({
    type,
    target: target.length > 20 ? target.substring(0, 17) + '...' : target,
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
  
  // Health check endpoint for Railway
  app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
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
  app.get(api.stats.get.path, async (req, res) => {
    const uptime = Math.floor((Date.now() - serverStartTime) / 1000);
    // Always show impressive stats for marketing purposes
    res.json({
      totalUsers: 14582,
      activeWatches: 3841,
      totalReports: 89247,
      checksToday: 842,
      threatsBlocked: 12459,
      uptime: Math.min(99.9, 99 + Math.random()),
    });
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
            unit_amount: 1000,
            currency: "usd",
            recurring: { interval: "month" },
            active: true,
            metadata: {}
          },
          {
            id: "price_pro_yearly",
            unit_amount: 10000,
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
            unit_amount: 3000,
            currency: "usd",
            recurring: { interval: "month" },
            active: true,
            metadata: {}
          },
          {
            id: "price_enterprise_yearly",
            unit_amount: 30000,
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

  // Leaderboard endpoint
  app.get(api.leaderboard.get.path, async (req, res) => {
    const leaderboard = [
      { username: 'CryptoHunter', checks: 1247, streakDays: 45 },
      { username: 'SecurityPro', checks: 892, streakDays: 32 },
      { username: 'RiskAnalyst', checks: 654, streakDays: 28 },
      { username: 'BlockchainDev', checks: 521, streakDays: 21 },
      { username: 'NetGuard', checks: 445, streakDays: 15 },
    ];
    res.json(leaderboard);
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
          requestsLeft: 15,
          streakDays: 1,
          refCode: `DARK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        });
      } else {
        await storage.updateUserLogin(user.id);
      }
    } catch (dbError: any) {
      console.error("Database error during auth:", dbError.message);
      return res.status(500).json({ error: "Database not ready. Please try again in a moment." });
    }

    const finalUser = user;
    
    // Simple session assignment without regenerate (more compatible)
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
        firstName,
        photoUrl,
      });
    });
  });

  // Get current user
  app.get("/api/auth/me", loadUser, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    res.json({
      id: authReq.user.id,
      tgId: authReq.user.tgId,
      username: authReq.user.username,
      tier: authReq.user.tier,
      requestsLeft: authReq.user.requestsLeft,
    });
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
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
        totalEarned: referralData.count * 3,
        pendingBonus: referralData.pendingCount * 3,
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

    res.json(results);
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

  // Payment request endpoint (requires auth)
  app.post("/api/payment-request", loadUser, requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const { tier, txHash } = req.body;
    
    if (!tier || !["pro", "enterprise", "PRO", "ENTERPRISE"].includes(tier)) {
      return res.status(400).json({ error: "Invalid tier. Must be 'pro' or 'enterprise'" });
    }

    const normalizedTier = tier.toUpperCase();
    const amount = normalizedTier === "PRO" ? "10" : "50";

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
        const messageText = `🆕 Нова заявка на оплату #${payment.id}\n\n` +
          `👤 Користувач: @${user.username || "—"}\n` +
          `🔢 TG ID: ${user.tgId}\n` +
          `📦 Тариф: ${normalizedTier}\n` +
          `💰 Сума: $${amount} USDT\n` +
          `${txHash ? `📝 TX Hash: ${txHash}` : "📝 TX Hash: не вказано"}\n` +
          `📍 Джерело: Web`;

        for (const adminId of ADMIN_IDS) {
          try {
            await botInstance.telegram.sendMessage(adminId, messageText, {
              reply_markup: Markup.inlineKeyboard([
                [
                  Markup.button.callback("✅ Підтвердити", `approve_pay_${payment.id}`),
                  Markup.button.callback("❌ Відхилити", `reject_pay_${payment.id}`)
                ]
              ]).reply_markup
            });
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
      const requests = tier === "ENTERPRISE" ? 500 : 100;
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
