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
    res.json({
      totalUsers: 14582,
      activeWatches: 3841,
      totalReports: 124509,
      checksToday: 842,
      threatsBlocked: 12459,
      uptime: Math.min(99.9, 99 + Math.random()),
    });
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
  const loadUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (req.session?.userId) {
      const user = await storage.getUserById(req.session.userId);
      if (user) {
        req.user = user;
      }
    }
    next();
  };

  // Require auth middleware
  const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.session?.userId || !req.user) {
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
  app.get("/api/auth/me", loadUser, async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    res.json({
      id: req.user.id,
      tgId: req.user.tgId,
      username: req.user.username,
      tier: req.user.tier,
      requestsLeft: req.user.requestsLeft,
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

  // Web check endpoint (requires auth)
  app.post(api.check.perform.path, loadUser, requireAuth, async (req: AuthenticatedRequest, res) => {
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

      // Store report using authenticated user
      await storage.createReport({
        userId: req.user!.id,
        objectType: type,
        dataJson: { 
          target: value, 
          riskScore: result.riskScore, 
          riskLevel: result.riskLevel,
          findings: result.findings,
          details: result.details,
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

  // Reports list endpoint (requires auth)
  app.get(api.reports.list.path, loadUser, requireAuth, async (req: AuthenticatedRequest, res) => {
    const reports = await storage.getReports(req.user!.id);
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

  // PDF download endpoint (requires auth)
  app.get(api.reports.download.path, loadUser, requireAuth, async (req: AuthenticatedRequest, res) => {
    const id = parseInt(req.params.id);
    const report = await storage.getReportById(id);
    
    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    if (report.userId !== req.user!.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    const data = report.dataJson as any || {};
    const riskLevel = data.riskLevel || 'medium';
    const riskScore = data.riskScore || 50;

    try {
      const pdfBuffer = await generateDetailedPDF({
        moduleType: report.objectType || 'unknown',
        targetValue: data.target || 'unknown',
        riskLevel,
        riskScore,
        timestamp: report.generatedAt || new Date(),
        userId: req.user!.username || 'user',
        findings: data.findings || generateFindings(report.objectType || 'unknown', riskLevel),
        sources: ["DARKSHARE Intel"],
        metadata: generateMetadata(report.objectType || 'unknown'),
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename=DARKSHARE_${report.objectType}_${id}.pdf`);
      res.send(pdfBuffer);
    } catch (err) {
      res.status(500).json({ error: "Failed to generate PDF" });
    }
  });

  // Watches list endpoint (requires auth)
  app.get(api.watches.list.path, loadUser, requireAuth, async (req: AuthenticatedRequest, res) => {
    const watches = await storage.getWatches(req.user!.id);
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
  app.post(api.watches.create.path, loadUser, requireAuth, async (req: AuthenticatedRequest, res) => {
    const { type, value, threshold } = req.body;
    
    if (!type || !value) {
      return res.status(400).json({ error: "Type and value are required" });
    }

    try {
      const watch = await storage.createWatch({
        userId: req.user!.id,
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
  app.delete(api.watches.delete.path, loadUser, requireAuth, async (req: AuthenticatedRequest, res) => {
    const id = parseInt(req.params.id);
    try {
      await storage.deleteWatch(id);
      res.json({ message: "Monitor deleted" });
    } catch (err) {
      res.status(404).json({ error: "Monitor not found" });
    }
  });

  // Payment request endpoint (requires auth)
  app.post("/api/payment-request", loadUser, requireAuth, async (req: AuthenticatedRequest, res) => {
    const { tier, txHash } = req.body;
    
    if (!tier || !["pro", "enterprise", "PRO", "ENTERPRISE"].includes(tier)) {
      return res.status(400).json({ error: "Invalid tier. Must be 'pro' or 'enterprise'" });
    }

    const normalizedTier = tier.toUpperCase();
    const amount = normalizedTier === "PRO" ? "10" : "50";

    try {
      const payment = await storage.createPayment({
        userId: req.user!.id,
        tier: normalizedTier,
        amountUsdt: amount,
        txHash: txHash || null,
        status: "pending",
      });

      if (botInstance) {
        const user = req.user!;
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
