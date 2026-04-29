import type { Express, Request, Response, NextFunction } from "express";
import { createHmac, timingSafeEqual } from "crypto";
import { lookup as dnsLookup } from "dns/promises";
import net from "net";
import { performCheck, validateInput } from "./checkService";
import { storage } from "./storage";
import type { User } from "@shared/schema";

/* ────────────────────────────────────────────────────────────────────────── */
/* Private-IP filter (SSRF guard for webhook URLs)                           */
/* ────────────────────────────────────────────────────────────────────────── */

function isPrivateIPv4(ip: string): boolean {
  const p = ip.split(".").map((n) => parseInt(n, 10));
  if (p.length !== 4 || p.some((n) => Number.isNaN(n))) return false;
  if (p[0] === 10) return true;
  if (p[0] === 127) return true;
  if (p[0] === 0) return true;
  if (p[0] === 169 && p[1] === 254) return true; // link-local + AWS metadata
  if (p[0] === 172 && p[1] >= 16 && p[1] <= 31) return true;
  if (p[0] === 192 && p[1] === 168) return true;
  if (p[0] >= 224) return true; // multicast / reserved
  return false;
}

function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower === "::1" || lower === "::") return true;
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // ULA
  if (lower.startsWith("fe80")) return true; // link-local
  if (lower.startsWith("ff")) return true;   // multicast
  return false;
}

async function isUrlSafe(rawUrl: string): Promise<boolean> {
  let u: URL;
  try {
    u = new URL(rawUrl);
  } catch {
    return false;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return false;
  const host = u.hostname.replace(/^\[|\]$/g, "");
  if (!host || host === "localhost") return false;
  // Direct IP literal
  const fam = net.isIP(host);
  if (fam === 4) return !isPrivateIPv4(host);
  if (fam === 6) return !isPrivateIPv6(host);
  // DNS — reject if any A/AAAA record points to a private range
  try {
    const records = await dnsLookup(host, { all: true });
    if (!records.length) return false;
    for (const r of records) {
      if (r.family === 4 && isPrivateIPv4(r.address)) return false;
      if (r.family === 6 && isPrivateIPv6(r.address)) return false;
    }
    return true;
  } catch {
    return false;
  }
}

/* ────────────────────────────────────────────────────────────────────────── */
/* API key                                                                   */
/* ────────────────────────────────────────────────────────────────────────── */

function apiSecret(): string {
  return (
    process.env.SESSION_SECRET ||
    process.env.REPL_ID ||
    "darkshare-api-key-secret"
  );
}

function hmacSlice(payload: string, len = 32): string {
  return createHmac("sha256", apiSecret()).update(payload).digest("hex").slice(0, len);
}

export function generateApiKey(userId: number, tgId: string, salt = ""): string {
  const sig = hmacSlice(`${userId}:${tgId}:${salt}`);
  return `dk_${userId}_${sig}`;
}

function parseApiKey(raw: string | undefined): { userId: number; sig: string } | null {
  if (!raw) return null;
  const m = raw.match(/^dk_(\d+)_([a-f0-9]{32})$/i);
  if (!m) return null;
  return { userId: parseInt(m[1], 10), sig: m[2].toLowerCase() };
}

async function verifyKeyForUser(
  parsed: { userId: number; sig: string },
): Promise<User | null> {
  const user = await storage.getUserById(parsed.userId);
  if (!user) return null;
  // Try unsalted (default) and a small range of historical salts.
  // For first release we only accept unsalted; regenerate-on-demand can be
  // re-introduced later by storing a salt on the user record.
  const expected = hmacSlice(`${user.id}:${user.tgId}:`);
  try {
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(parsed.sig, "hex");
    if (a.length !== b.length) return null;
    if (timingSafeEqual(a, b)) return user;
  } catch {
    /* malformed hex */
  }
  return null;
}

export interface ApiKeyRequest extends Request {
  apiUser?: User;
}

export async function apiKeyAuth(
  req: ApiKeyRequest,
  res: Response,
  next: NextFunction,
) {
  const auth =
    (req.header("authorization") || "").replace(/^Bearer\s+/i, "").trim() ||
    req.header("x-api-key") ||
    "";
  const parsed = parseApiKey(auth);
  if (!parsed) {
    return res
      .status(401)
      .json({ error: "Missing or malformed API key. Send `Authorization: Bearer dk_…` or `X-API-Key: dk_…`." });
  }
  const user = await verifyKeyForUser(parsed);
  if (!user) {
    return res.status(401).json({ error: "Invalid API key." });
  }
  if (user.blocked) {
    return res.status(403).json({ error: "Account suspended." });
  }
  const tier = (user.tier || "FREE").toUpperCase();
  if (tier !== "PRO" && tier !== "ENTERPRISE") {
    return res.status(403).json({ error: "API access requires PRO or ENTERPRISE plan." });
  }
  req.apiUser = user;
  next();
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Quotas / rate limit                                                       */
/* ────────────────────────────────────────────────────────────────────────── */

const MONTHLY_QUOTAS: Record<string, number> = {
  PRO: 5_000,
  ENTERPRISE: 50_000,
};

const RPS_BURST: Record<string, number> = {
  PRO: 5,
  ENTERPRISE: 20,
};

const burstMap = new Map<string, { count: number; resetAt: number }>();

function rpsBurstCheck(userId: number, tier: string): { ok: boolean; resetIn: number } {
  const limit = RPS_BURST[tier] || 5;
  const key = `apiv1:${userId}`;
  const now = Date.now();
  const e = burstMap.get(key);
  if (!e || now > e.resetAt) {
    burstMap.set(key, { count: 1, resetAt: now + 1000 });
    return { ok: true, resetIn: 1 };
  }
  e.count++;
  if (e.count > limit) return { ok: false, resetIn: Math.max(1, Math.ceil((e.resetAt - now) / 1000)) };
  return { ok: true, resetIn: Math.max(1, Math.ceil((e.resetAt - now) / 1000)) };
}

setInterval(() => {
  const now = Date.now();
  for (const [k, v] of Array.from(burstMap.entries())) {
    if (now > v.resetAt + 5000) burstMap.delete(k);
  }
}, 60_000);

async function monthlyUsage(userId: number): Promise<number> {
  const reports = await storage.getReports(userId);
  const since = Date.now() - 30 * 24 * 60 * 60 * 1000;
  return reports.filter((r) => r.generatedAt && new Date(r.generatedAt).getTime() >= since).length;
}

function attachQuotaHeaders(res: Response, tier: string, used: number) {
  const limit = MONTHLY_QUOTAS[tier] || 0;
  res.setHeader("X-RateLimit-Limit-Month", String(limit));
  res.setHeader("X-RateLimit-Remaining-Month", String(Math.max(0, limit - used)));
  res.setHeader("X-RateLimit-Burst-Per-Sec", String(RPS_BURST[tier] || 0));
}

/* ────────────────────────────────────────────────────────────────────────── */
/* SSE: live IOC feed                                                        */
/* ────────────────────────────────────────────────────────────────────────── */

interface FeedItem {
  id: string;
  type: "malware_url" | "malware_ioc" | "malicious_domain" | "malicious_ip";
  source: string;
  indicator: string;
  threat?: string;
  tags?: string[];
  timestamp: string;
}

const subscribers = new Set<Response>();
const feedCache: FeedItem[] = [];
const seenIds = new Set<string>();
const FEED_CACHE_LIMIT = 50;
const POLL_INTERVAL = 60_000;
const MAX_SSE_SUBSCRIBERS = 500;

function pushFeedItem(item: FeedItem) {
  if (seenIds.has(item.id)) return;
  seenIds.add(item.id);
  feedCache.unshift(item);
  if (feedCache.length > FEED_CACHE_LIMIT) {
    const drop = feedCache.pop();
    if (drop) seenIds.delete(drop.id);
  }
  const payload = `data: ${JSON.stringify(item)}\n\n`;
  for (const r of Array.from(subscribers)) {
    try {
      r.write(payload);
    } catch {
      subscribers.delete(r);
    }
  }
}

async function pollUrlhausRecent() {
  try {
    const r = await fetch("https://urlhaus-api.abuse.ch/v1/urls/recent/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "limit=20",
      signal: AbortSignal.timeout(5000),
    });
    if (!r.ok) return;
    const j: any = await r.json();
    if (j?.query_status === "ok" && Array.isArray(j.urls)) {
      for (const u of j.urls.slice(0, 20)) {
        pushFeedItem({
          id: `urlhaus:${u.id}`,
          type: "malware_url",
          source: "urlhaus.abuse.ch",
          indicator: u.url,
          threat: u.threat || "malware",
          tags: u.tags || [],
          timestamp: u.dateadded || new Date().toISOString(),
        });
      }
    }
  } catch {
    /* silent */
  }
}

async function pollThreatFoxRecent() {
  try {
    const r = await fetch("https://threatfox-api.abuse.ch/api/v1/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "get_iocs", days: 1 }),
      signal: AbortSignal.timeout(5000),
    });
    if (!r.ok) return;
    const j: any = await r.json();
    if (j?.query_status === "ok" && Array.isArray(j.data)) {
      for (const ioc of j.data.slice(0, 20)) {
        const t = (ioc.ioc_type || "").toLowerCase();
        const type: FeedItem["type"] =
          t.includes("url")
            ? "malware_url"
            : t.includes("domain")
            ? "malicious_domain"
            : t.includes("ip")
            ? "malicious_ip"
            : "malware_ioc";
        pushFeedItem({
          id: `threatfox:${ioc.id}`,
          type,
          source: "threatfox.abuse.ch",
          indicator: ioc.ioc,
          threat: ioc.malware_printable || ioc.threat_type || "malware",
          tags: ioc.tags || [],
          timestamp: ioc.first_seen || new Date().toISOString(),
        });
      }
    }
  } catch {
    /* silent */
  }
}

let pollerStarted = false;
function startFeedPoller() {
  if (pollerStarted) return;
  pollerStarted = true;
  const tick = async () => {
    await Promise.allSettled([pollUrlhausRecent(), pollThreatFoxRecent()]);
  };
  // initial fill, then interval
  tick().catch(() => {});
  setInterval(() => tick().catch(() => {}), POLL_INTERVAL);
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Watchlist poller                                                          */
/* ────────────────────────────────────────────────────────────────────────── */

const WATCH_INTERVAL = 30 * 60 * 1000; // 30 min

function watchHmac(payload: string): string {
  return createHmac("sha256", apiSecret()).update(payload).digest("hex");
}

async function deliverWebhook(url: string, body: any) {
  try {
    if (!(await isUrlSafe(url))) {
      console.warn("[watchlist] webhook rejected (private/invalid URL):", url);
      return;
    }
    const json = JSON.stringify(body);
    const sig = watchHmac(json);
    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-DarkShare-Signature": sig,
        "User-Agent": "DarkShare-Watcher/1.0",
      },
      body: json,
      signal: AbortSignal.timeout(10_000),
      redirect: "manual",
    });
  } catch (err) {
    console.warn("[watchlist] webhook delivery failed:", (err as Error).message);
  }
}

let watchPollerStarted = false;
function startWatchPoller() {
  if (watchPollerStarted) return;
  watchPollerStarted = true;
  const tick = async () => {
    try {
      const watches = await storage.getAllWatches();
      if (!Array.isArray(watches)) return;
      for (const w of watches) {
        const meta = (w.thresholdsJson || {}) as any;
        const webhookUrl: string | undefined = meta.webhookUrl;
        if (!webhookUrl) continue;
        if (w.alertsOn === false) continue;
        const threshold: number = typeof meta.threshold === "number" ? meta.threshold : 70;
        try {
          const result = await performCheck(w.objectType, w.value);
          const lastScore: number | undefined = meta.lastScore;
          const crossed = result.riskScore >= threshold && (lastScore === undefined || lastScore < threshold);
          await storage.updateWatch(w.id, {
            lastCheck: new Date(),
            status: result.riskLevel,
            thresholdsJson: { ...meta, lastScore: result.riskScore },
          } as any);
          if (crossed) {
            await deliverWebhook(webhookUrl, {
              event: "watch.threshold_crossed",
              watchId: w.id,
              type: w.objectType,
              target: w.value,
              riskScore: result.riskScore,
              riskLevel: result.riskLevel,
              findings: result.findings.slice(0, 10),
              sources: result.sources,
              checkedAt: new Date().toISOString(),
            });
          }
        } catch (err) {
          // Skip individual watch failures
        }
      }
    } catch (err) {
      console.warn("[watchlist] poller error:", (err as Error).message);
    }
  };
  setInterval(() => tick().catch(() => {}), WATCH_INTERVAL);
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Routes                                                                    */
/* ────────────────────────────────────────────────────────────────────────── */

export function registerApiV1(app: Express) {
  startFeedPoller();
  startWatchPoller();

  /* --- single check --- */
  app.post("/api/v1/check", apiKeyAuth, async (req: ApiKeyRequest, res) => {
    const user = req.apiUser!;
    const tier = (user.tier || "FREE").toUpperCase();

    const burst = rpsBurstCheck(user.id, tier);
    if (!burst.ok) {
      res.setHeader("Retry-After", String(burst.resetIn));
      return res.status(429).json({ error: "Burst rate limit exceeded.", retry_after: burst.resetIn });
    }

    const used = await monthlyUsage(user.id);
    const limit = MONTHLY_QUOTAS[tier] || 0;
    attachQuotaHeaders(res, tier, used);
    if (used >= limit) {
      return res.status(429).json({ error: `Monthly quota reached (${used}/${limit}).`, used, limit });
    }

    const { type, value } = req.body || {};
    if (!type || !value) return res.status(400).json({ error: "type and value are required" });
    const v = validateInput(type, value);
    if (!v.valid) return res.status(400).json({ error: v.error });

    try {
      const result = await performCheck(type, value);
      // Record the call against quota by saving a lightweight report
      await storage.createReport({
        userId: user.id,
        objectType: type,
        dataJson: {
          target: value,
          riskScore: result.riskScore,
          riskLevel: result.riskLevel,
          findings: result.findings,
          sources: result.sources,
          summary: result.summary,
          via: "api/v1",
        },
      } as any).catch(() => {});
      res.json({
        type: result.type,
        target: result.target,
        risk_score: result.riskScore,
        risk_level: result.riskLevel,
        summary: result.summary,
        findings: result.findings,
        details: result.details,
        sources_scanned: result.sources,
        sources_total: (result as any).sourcesTotal,
        timestamp: result.timestamp.toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Check failed" });
    }
  });

  /* --- bulk check (ENTERPRISE only) --- */
  app.post("/api/v1/check/bulk", apiKeyAuth, async (req: ApiKeyRequest, res) => {
    const user = req.apiUser!;
    const tier = (user.tier || "FREE").toUpperCase();
    if (tier !== "ENTERPRISE") {
      return res.status(403).json({ error: "Bulk endpoint is ENTERPRISE-only." });
    }

    const { checks } = req.body || {};
    if (!Array.isArray(checks) || checks.length === 0) {
      return res.status(400).json({ error: "`checks` must be a non-empty array of {type,value}" });
    }
    if (checks.length > 100) {
      return res.status(400).json({ error: "Maximum 100 checks per request" });
    }

    const used = await monthlyUsage(user.id);
    const limit = MONTHLY_QUOTAS[tier] || 0;
    attachQuotaHeaders(res, tier, used);
    if (used + checks.length > limit) {
      return res.status(429).json({
        error: `Monthly quota would be exceeded (${used} used + ${checks.length} requested > ${limit}).`,
      });
    }

    const concurrency = 5;
    const results: any[] = [];
    let cursor = 0;
    async function worker() {
      while (cursor < checks.length) {
        const i = cursor++;
        const c = checks[i];
        if (!c?.type || !c?.value) {
          results[i] = { error: "type and value required", input: c };
          continue;
        }
        const v = validateInput(c.type, c.value);
        if (!v.valid) {
          results[i] = { type: c.type, target: c.value, error: v.error };
          continue;
        }
        try {
          const r = await performCheck(c.type, c.value);
          results[i] = {
            type: r.type,
            target: r.target,
            risk_score: r.riskScore,
            risk_level: r.riskLevel,
            summary: r.summary,
            findings: r.findings,
            sources_scanned: r.sources,
            timestamp: r.timestamp.toISOString(),
          };
          storage.createReport({
            userId: user.id,
            objectType: c.type,
            dataJson: {
              target: c.value,
              riskScore: r.riskScore,
              riskLevel: r.riskLevel,
              findings: r.findings,
              sources: r.sources,
              summary: r.summary,
              via: "api/v1/bulk",
            },
          } as any).catch(() => {});
        } catch (err: any) {
          results[i] = { type: c.type, target: c.value, error: err?.message || "check failed" };
        }
      }
    }
    await Promise.all(Array.from({ length: Math.min(concurrency, checks.length) }, worker));
    res.json({ count: results.length, results });
  });

  /* --- watchlist --- */
  app.get("/api/v1/watchlist", apiKeyAuth, async (req: ApiKeyRequest, res) => {
    const user = req.apiUser!;
    const watches = await storage.getWatches(user.id);
    res.json({
      count: watches.length,
      items: watches.map((w) => {
        const meta: any = w.thresholdsJson || {};
        return {
          id: w.id,
          type: w.objectType,
          target: w.value,
          threshold: typeof meta.threshold === "number" ? meta.threshold : 70,
          webhook_url: meta.webhookUrl || null,
          status: w.status,
          last_check: w.lastCheck,
          last_score: meta.lastScore ?? null,
          alerts_on: w.alertsOn !== false,
        };
      }),
    });
  });

  app.post("/api/v1/watchlist", apiKeyAuth, async (req: ApiKeyRequest, res) => {
    const user = req.apiUser!;
    const tier = (user.tier || "FREE").toUpperCase();
    const max = tier === "ENTERPRISE" ? 200 : 25;
    const existing = await storage.getWatches(user.id);
    if (existing.length >= max) {
      return res.status(403).json({ error: `Watchlist limit reached (${max}). Upgrade plan to add more.` });
    }

    const { type, value, webhook_url, threshold } = req.body || {};
    if (!type || !value) return res.status(400).json({ error: "type and value are required" });
    const v = validateInput(type, value);
    if (!v.valid) return res.status(400).json({ error: v.error });
    if (webhook_url) {
      if (!/^https?:\/\//.test(webhook_url)) {
        return res.status(400).json({ error: "webhook_url must be a valid http(s) URL" });
      }
      if (!(await isUrlSafe(webhook_url))) {
        return res.status(400).json({ error: "webhook_url cannot resolve to a private, loopback, link-local or multicast address" });
      }
    }
    const t = Math.max(1, Math.min(100, Number(threshold) || 70));

    const watch = await storage.createWatch({
      userId: user.id,
      objectType: type,
      value,
      thresholdsJson: { threshold: t, webhookUrl: webhook_url || null },
      status: "low",
      alertsOn: true,
    } as any);
    res.status(201).json({
      id: watch.id,
      type: watch.objectType,
      target: watch.value,
      threshold: t,
      webhook_url: webhook_url || null,
      status: watch.status,
      created_at: new Date().toISOString(),
    });
  });

  app.delete("/api/v1/watchlist/:id", apiKeyAuth, async (req: ApiKeyRequest, res) => {
    const user = req.apiUser!;
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ error: "invalid id" });
    const watches = await storage.getWatches(user.id);
    const w = watches.find((x) => x.id === id);
    if (!w) return res.status(404).json({ error: "watch not found" });
    await storage.deleteWatch(id);
    res.json({ deleted: true, id });
  });

  /* --- live IOC feed (SSE) --- */
  app.get("/api/v1/feed", apiKeyAuth, (req: ApiKeyRequest, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    if (subscribers.size >= MAX_SSE_SUBSCRIBERS) {
      res.write(`event: error\ndata: {"error":"Server at SSE capacity, retry shortly"}\n\n`);
      res.end();
      return;
    }

    res.write(`: connected as user ${req.apiUser!.id}\n\n`);
    // Replay last cached items so consumer immediately sees data
    for (const item of feedCache.slice(0, 20).reverse()) {
      res.write(`data: ${JSON.stringify(item)}\n\n`);
    }
    subscribers.add(res);

    const ping = setInterval(() => {
      try {
        res.write(`: ping ${Date.now()}\n\n`);
      } catch {
        clearInterval(ping);
      }
    }, 25_000);

    req.on("close", () => {
      clearInterval(ping);
      subscribers.delete(res);
    });
  });

  /* --- usage / quota introspection --- */
  app.get("/api/v1/usage", apiKeyAuth, async (req: ApiKeyRequest, res) => {
    const user = req.apiUser!;
    const tier = (user.tier || "FREE").toUpperCase();
    const used = await monthlyUsage(user.id);
    const limit = MONTHLY_QUOTAS[tier] || 0;
    attachQuotaHeaders(res, tier, used);
    res.json({
      tier,
      used_30d: used,
      limit_month: limit,
      remaining: Math.max(0, limit - used),
      burst_per_sec: RPS_BURST[tier] || 0,
      reset_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
  });
}
