import type { Express, Request, Response } from "express";
import { storage } from "./storage";
import {
  createAlorSubscription,
  getAlorStatus,
  toggleAlorSubscription,
  isAlorConfigured,
  vpnDeviceLimit,
  vpnPlanDays,
  upstreamAlorToken,
} from "./alorVpn";
import { buildPublicSubUrl } from "./vpnProxy";
import { buildDeepLinks } from "./vpnDeepLinks";

interface AuthReq extends Request {
  user?: { id: number; tier?: string | null; tgId?: string | null } & any;
}

function publicSubUrl(req: Request, token: string | null | undefined): string | null {
  if (!token) return null;
  return buildPublicSubUrl(req, token);
}

function qrUrl(req: Request, token: string | null | undefined): string | null {
  if (!token) return null;
  const proto = (req.headers["x-forwarded-proto"] as string) || req.protocol || "https";
  const host = (req.headers["x-forwarded-host"] as string) || req.get("host");
  return `${proto}://${host}/vpn/sub/${token}/qr`;
}

export function registerAlorVpnRoutes(app: Express, loadUser: any, requireAuth: any) {
  app.get("/api/alor-vpn/status", loadUser, requireAuth, async (req: AuthReq, res: Response) => {
    try {
      const user = await storage.getUserById(req.user!.id);
      if (!user) return res.status(404).json({ error: "user_not_found" });

      const tier = (user.tier || "FREE").toUpperCase();
      const deviceLimit = vpnDeviceLimit(tier);
      const configured = isAlorConfigured();

      if (!user.alorVpnToken) {
        return res.json({
          hasSubscription: false,
          tier,
          deviceLimit,
          configured,
        });
      }

      let isActive = false;
      let expiresAt = user.alorVpnExpiresAt;
      const subscriptionUrl = publicSubUrl(req, user.alorVpnToken);

      if (configured && user.alorVpnToken) {
        try {
          const status = await getAlorStatus(upstreamAlorToken(user)!);
          isActive = status.is_active;
          expiresAt = new Date(status.expires_at);
          await storage.updateUser(user.id, { alorVpnExpiresAt: expiresAt });
        } catch {
          isActive = Boolean(user.alorVpnExpiresAt && user.alorVpnExpiresAt > new Date());
        }
      } else {
        isActive = Boolean(user.alorVpnExpiresAt && user.alorVpnExpiresAt > new Date());
      }

      return res.json({
        hasSubscription: true,
        isActive,
        subscriptionUrl,
        qrUrl: qrUrl(req, user.alorVpnToken),
        apps: subscriptionUrl ? buildDeepLinks(subscriptionUrl) : [],
        expiresAt,
        uuid: user.alorVpnUuid,
        tier,
        deviceLimit,
        configured,
      });
    } catch (err: any) {
      console.error("[AlorVPN] status error:", err);
      res.status(500).json({ error: "internal" });
    }
  });

  app.post("/api/alor-vpn/provision", loadUser, requireAuth, async (req: AuthReq, res: Response) => {
    try {
      const user = await storage.getUserById(req.user!.id);
      if (!user) return res.status(404).json({ error: "user_not_found" });

      const tier = (user.tier || "FREE").toUpperCase();
      if (!["PRO", "ENTERPRISE", "GROUPS"].includes(tier)) {
        return res.status(402).json({ error: "pro_required", message: "VPN requires PRO, ENTERPRISE or GROUPS plan" });
      }

      if (!isAlorConfigured()) {
        return res.status(503).json({ error: "vpn_not_configured", message: "VPN service not configured yet" });
      }

      const period = req.body?.period || "monthly";
      const planDays = vpnPlanDays(period);

      if (user.alorVpnToken) {
        try {
          const upTok = upstreamAlorToken(user)!;
          const status = await getAlorStatus(upTok);
          if (status.is_active) {
            return res.json({
              ok: true,
              alreadyActive: true,
              subscriptionUrl: publicSubUrl(req, user.alorVpnToken),
              expiresAt: status.expires_at,
              uuid: user.alorVpnUuid,
            });
          }
          // Upstream expiry is FIXED at creation (no extend API). Only reactivate
          // via toggle when the upstream expiry still covers the requested period;
          // otherwise rotate (create a fresh upstream subscription below).
          const upstreamExpMs = new Date(status.expires_at).getTime();
          if (upstreamExpMs >= Date.now() + (planDays - 1) * 86400000) {
            await toggleAlorSubscription(upTok, true);
            await storage.updateUser(user.id, { alorVpnExpiresAt: new Date(upstreamExpMs) });
            return res.json({
              ok: true,
              reactivated: true,
              subscriptionUrl: publicSubUrl(req, user.alorVpnToken),
              expiresAt: new Date(upstreamExpMs).toISOString(),
              uuid: user.alorVpnUuid,
            });
          }
          // fallthrough to rotate upstream subscription
        } catch {
          // fallthrough to create new subscription
        }
      }

      const sub = await createAlorSubscription(planDays);
      await storage.updateUser(user.id, {
        // Keep an existing public token stable so the user's imported sub URL keeps working.
        ...(user.alorVpnToken ? {} : { alorVpnToken: sub.token }),
        alorVpnUuid: sub.uuid,
        alorVpnSubscriptionUrl: sub.subscription_url,
        alorVpnExpiresAt: new Date(sub.expires_at),
      });

      try {
        await storage.logActivity({
          userId: user.id,
          action: "alor_vpn_provisioned",
          metadata: { tier, planDays, uuid: sub.uuid } as any,
        } as any);
      } catch {}

      return res.json({
        ok: true,
        subscriptionUrl: publicSubUrl(req, user.alorVpnToken || sub.token),
        expiresAt: sub.expires_at,
        uuid: sub.uuid,
      });
    } catch (err: any) {
      console.error("[AlorVPN] provision error:", err);
      res.status(500).json({ error: "internal", message: err.message });
    }
  });

  app.post("/api/alor-vpn/refresh", loadUser, requireAuth, async (req: AuthReq, res: Response) => {
    try {
      const user = await storage.getUserById(req.user!.id);
      if (!user || !user.alorVpnToken) {
        return res.status(404).json({ error: "no_subscription" });
      }
      if (!isAlorConfigured()) {
        return res.status(503).json({ error: "vpn_not_configured" });
      }

      const status = await getAlorStatus(upstreamAlorToken(user)!);
      await storage.updateUser(user.id, { alorVpnExpiresAt: new Date(status.expires_at) });

      return res.json({
        ok: true,
        isActive: status.is_active,
        subscriptionUrl: publicSubUrl(req, user.alorVpnToken),
        expiresAt: status.expires_at,
        uuid: user.alorVpnUuid,
      });
    } catch (err: any) {
      console.error("[AlorVPN] refresh error:", err);
      res.status(500).json({ error: "internal" });
    }
  });

  app.get("/api/alor-vpn/devices", loadUser, requireAuth, async (req: AuthReq, res: Response) => {
    try {
      const userId = req.user!.id;
      // Best-effort: keep VPN expiry in sync with main subscription before reporting.
      try { await syncAlorVpnWithSubscription(userId); } catch {}
      const rawDevices = await storage.listVpnDevices(userId);
      const user = await storage.getUserById(userId);
      const tier = (user?.tier || "FREE").toUpperCase();
      const limit = vpnDeviceLimit(tier);
      // Collapse rows by device NAME so the list (and count) matches how the proxy enforces
      // limits — a single phone can leave several fingerprint rows behind. rawDevices is
      // ordered by lastSeen desc, so the first row per name is the most recent; prefer a
      // non-revoked representative when one exists.
      const normName = (n: any) => (n && String(n).trim()) ? String(n).trim() : "VPN client";
      const byName = new Map<string, any>();
      for (const d of rawDevices) {
        const key = normName(d.deviceName);
        const existing = byName.get(key);
        if (!existing) byName.set(key, d);
        else if (existing.revokedAt && !d.revokedAt) byName.set(key, d);
      }
      const devices = Array.from(byName.values());
      const active = devices.filter((d: any) => !d.revokedAt);
      // Source of truth for days-left: the LATER of main subscription and VPN expiry,
      // because we always extend the VPN to match the main subscription.
      const vpnExp = (user as any)?.alorVpnExpiresAt ? new Date((user as any).alorVpnExpiresAt) : null;
      const mainExp = (user as any)?.subscriptionExpiresAt ? new Date((user as any).subscriptionExpiresAt) : null;
      const expiresAt = vpnExp && mainExp
        ? (vpnExp.getTime() > mainExp.getTime() ? vpnExp : mainExp)
        : (vpnExp || mainExp);
      const daysLeft = expiresAt ? Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / 86400000)) : null;
      res.json({
        ok: true,
        deviceLimit: limit,
        activeCount: active.length,
        tier,
        expiresAt: expiresAt ? expiresAt.toISOString() : null,
        daysLeft,
        devices: devices.map((d: any) => ({
          id: d.id,
          name: d.deviceName || "VPN client",
          userAgent: d.userAgent,
          ipPrefix: d.ipPrefix,
          firstSeen: d.firstSeen,
          lastSeen: d.lastSeen,
          revoked: Boolean(d.revokedAt),
        })),
      });
    } catch (err: any) {
      console.error("[AlorVPN] devices list error:", err);
      res.status(500).json({ error: "internal" });
    }
  });

  app.post("/api/alor-vpn/devices/:id/revoke", loadUser, requireAuth, async (req: AuthReq, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (!Number.isFinite(id)) return res.status(400).json({ error: "bad_id" });
      await storage.revokeVpnDevice(id, req.user!.id);
      res.json({ ok: true });
    } catch (err: any) {
      console.error("[AlorVPN] device revoke error:", err);
      res.status(500).json({ error: "internal" });
    }
  });

  // ============ ADMIN VPN MANAGEMENT ============
  app.get("/api/admin/vpn/users", loadUser, requireAuth, async (req: AuthReq, res: Response) => {
    try {
      if (!(await isAdminRequest(req))) return res.status(403).json({ error: "forbidden" });
      const all = await storage.getAllUsers();
      const vpnUsers = all.filter((u: any) => u.alorVpnToken);
      const enriched = await Promise.all(
        vpnUsers.map(async (u: any) => {
          let devices: any[] = [];
          try { devices = await storage.listVpnDevices(u.id); } catch {}
          const active = devices.filter((d) => !d.revokedAt);
          const tier = (u.tier || "FREE").toUpperCase();
          const vpnExp = u.alorVpnExpiresAt ? new Date(u.alorVpnExpiresAt) : null;
          const mainExp = u.subscriptionExpiresAt ? new Date(u.subscriptionExpiresAt) : null;
          const exp = vpnExp && mainExp ? (vpnExp.getTime() > mainExp.getTime() ? vpnExp : mainExp) : (vpnExp || mainExp);
          const daysLeft = exp ? Math.max(0, Math.ceil((exp.getTime() - Date.now()) / 86400000)) : null;
          return {
            id: u.id,
            username: u.username,
            tgId: u.tgId,
            tier,
            deviceLimit: vpnDeviceLimit(tier),
            activeDevices: active.length,
            totalDevices: devices.length,
            vpnExpiresAt: vpnExp ? vpnExp.toISOString() : null,
            subscriptionExpiresAt: mainExp ? mainExp.toISOString() : null,
            daysLeft,
            isActive: exp ? exp.getTime() > Date.now() : false,
            inSync: !mainExp || !vpnExp || Math.abs(mainExp.getTime() - vpnExp.getTime()) < 86400000,
            uuid: u.alorVpnUuid,
          };
        })
      );
      enriched.sort((a, b) => (b.activeDevices - a.activeDevices) || ((b.daysLeft || 0) - (a.daysLeft || 0)));
      res.json({ ok: true, users: enriched, total: enriched.length });
    } catch (err: any) {
      console.error("[AlorVPN admin] list error:", err);
      res.status(500).json({ error: "internal" });
    }
  });

  app.post("/api/admin/vpn/users/:id/sync", loadUser, requireAuth, async (req: AuthReq, res: Response) => {
    try {
      if (!(await isAdminRequest(req))) return res.status(403).json({ error: "forbidden" });
      const id = parseInt(req.params.id, 10);
      if (!Number.isFinite(id)) return res.status(400).json({ error: "bad_id" });
      const result = await syncAlorVpnWithSubscription(id);
      res.json({ ok: true, ...result });
    } catch (err: any) {
      console.error("[AlorVPN admin] sync error:", err);
      res.status(500).json({ error: "internal", message: err.message });
    }
  });

  app.post("/api/admin/vpn/users/:id/toggle", loadUser, requireAuth, async (req: AuthReq, res: Response) => {
    try {
      if (!(await isAdminRequest(req))) return res.status(403).json({ error: "forbidden" });
      const id = parseInt(req.params.id, 10);
      const isActive = Boolean(req.body?.is_active);
      const user = await storage.getUserById(id);
      if (!user || !(user as any).alorVpnToken) return res.status(404).json({ error: "no_subscription" });
      const result = await toggleAlorSubscription(upstreamAlorToken(user)!, isActive);
      res.json({ ok: true, is_active: result.is_active });
    } catch (err: any) {
      console.error("[AlorVPN admin] toggle error:", err);
      res.status(500).json({ error: "internal", message: err.message });
    }
  });

  app.post("/api/admin/vpn/users/:id/revoke-all", loadUser, requireAuth, async (req: AuthReq, res: Response) => {
    try {
      if (!(await isAdminRequest(req))) return res.status(403).json({ error: "forbidden" });
      const id = parseInt(req.params.id, 10);
      if (!Number.isFinite(id)) return res.status(400).json({ error: "bad_id" });
      const devices = await storage.listVpnDevices(id);
      let revoked = 0;
      for (const d of devices) {
        if (!d.revokedAt) { await storage.revokeVpnDevice(d.id, id); revoked++; }
      }
      res.json({ ok: true, revoked });
    } catch (err: any) {
      console.error("[AlorVPN admin] revoke-all error:", err);
      res.status(500).json({ error: "internal", message: err.message });
    }
  });

  app.get("/api/admin/vpn/users/:id/devices", loadUser, requireAuth, async (req: AuthReq, res: Response) => {
    try {
      if (!(await isAdminRequest(req))) return res.status(403).json({ error: "forbidden" });
      const id = parseInt(req.params.id, 10);
      if (!Number.isFinite(id)) return res.status(400).json({ error: "bad_id" });
      const devices = await storage.listVpnDevices(id);
      res.json({
        ok: true,
        devices: devices.map((d: any) => ({
          id: d.id,
          name: d.deviceName || "VPN client",
          userAgent: d.userAgent,
          ipPrefix: d.ipPrefix,
          firstSeen: d.firstSeen,
          lastSeen: d.lastSeen,
          revoked: Boolean(d.revokedAt),
        })),
      });
    } catch (err: any) {
      console.error("[AlorVPN admin] devices error:", err);
      res.status(500).json({ error: "internal", message: err.message });
    }
  });

  app.post("/api/alor-vpn/toggle", loadUser, requireAuth, async (req: AuthReq, res: Response) => {
    try {
      const user = await storage.getUserById(req.user!.id);
      if (!user || !user.alorVpnToken) {
        return res.status(404).json({ error: "no_subscription" });
      }
      if (!isAlorConfigured()) {
        return res.status(503).json({ error: "vpn_not_configured" });
      }

      const isActive = Boolean(req.body?.is_active);
      const result = await toggleAlorSubscription(upstreamAlorToken(user)!, isActive);
      return res.json({ ok: true, is_active: result.is_active });
    } catch (err: any) {
      console.error("[AlorVPN] toggle error:", err);
      res.status(500).json({ error: "internal" });
    }
  });
}

// Resolve the effective VPN plan days for a user. We use the LATER of:
//   (a) the explicit periodDays passed in (current purchase window), and
//   (b) the days remaining on the user's main DarkShare subscription.
// This guarantees the VPN never expires before the user's paid subscription does.
function effectivePlanDays(user: any, periodDays: number): number {
  let days = Math.max(1, Math.floor(periodDays || 30));
  const mainExp = user?.subscriptionExpiresAt
    ? new Date(user.subscriptionExpiresAt)
    : null;
  if (mainExp && mainExp.getTime() > Date.now()) {
    const mainDays = Math.ceil((mainExp.getTime() - Date.now()) / 86400000);
    if (mainDays > days) days = mainDays;
  }
  return days;
}

// Per-user provisioning lock: overlapping triggers (payment webhook + lazy sync)
// must not both create upstream subscriptions, or one gets orphaned.
const provisionLocks: Map<number, Promise<void>> = new Map();

export async function autoProvisionAlorVpn(userId: number, tier: string, periodDays: number): Promise<void> {
  const prev = provisionLocks.get(userId) || Promise.resolve();
  const run = prev.then(() => autoProvisionAlorVpnInner(userId, tier, periodDays)).catch(() => {});
  provisionLocks.set(userId, run);
  await run;
  if (provisionLocks.get(userId) === run) provisionLocks.delete(userId);
}

async function autoProvisionAlorVpnInner(userId: number, tier: string, periodDays: number): Promise<void> {
  if (!isAlorConfigured()) return;
  if (!["PRO", "ENTERPRISE", "GROUPS"].includes(tier.toUpperCase())) return;

  try {
    const user = await storage.getUserById(userId);
    if (!user) return;

    const planDays = effectivePlanDays(user, periodDays);
    const neededExpiryMs = Date.now() + planDays * 86400000;

    if (user.alorVpnToken) {
      // AlorVPN has NO "extend" API (only create/status/toggle), so the upstream
      // subscription has a FIXED expiry set at creation. If the upstream expiry
      // covers the needed period, just make sure it's toggled on. Otherwise we
      // must ROTATE: create a fresh upstream subscription for the needed days.
      // The user's public token (their /vpn/sub/<token> URL) stays the same —
      // the proxy fetches upstream via alorVpnSubscriptionUrl.
      const upTok = upstreamAlorToken(user)!;
      try {
        const status = await getAlorStatus(upTok);
        const upstreamExpMs = new Date(status.expires_at).getTime();
        // Allow 1 day of slack to avoid rotating on rounding differences.
        if (upstreamExpMs >= neededExpiryMs - 86400000) {
          if (!status.is_active) await toggleAlorSubscription(upTok, true);
          await storage.updateUser(userId, { alorVpnExpiresAt: new Date(upstreamExpMs) });
          console.log(`[AlorVPN] Reactivated subscription for user ${userId} (upstream valid until ${status.expires_at})`);
          return;
        }
        console.log(`[AlorVPN] Upstream expiry ${status.expires_at} too short for user ${userId} (need ${planDays}d) — rotating upstream token`);
        // fallthrough to create a new upstream subscription
      } catch {
        // status failed (token dead/expired upstream) — fallthrough to create new
      }
    }

    const sub = await createAlorSubscription(planDays);
    await storage.updateUser(userId, {
      // Keep the user's existing public token stable so their imported
      // subscription URL keeps working; only set it for first-time provisioning.
      ...(user.alorVpnToken ? {} : { alorVpnToken: sub.token }),
      alorVpnUuid: sub.uuid,
      alorVpnSubscriptionUrl: sub.subscription_url,
      alorVpnExpiresAt: new Date(sub.expires_at),
    });
    console.log(`[AlorVPN] ${user.alorVpnToken ? "Rotated" : "Created"} subscription for user ${userId}, expires ${sub.expires_at} (${planDays}d)`);
  } catch (err: any) {
    console.error(`[AlorVPN] Auto-provision failed for user ${userId}:`, err.message);
  }
}

// Cooldown to avoid hammering the Alor API when called from polling endpoints.
// We track the last sync attempt per-user and short-circuit subsequent calls within the window.
const SYNC_COOLDOWN_MS = 60_000;
const lastSyncAt: Map<number, number> = new Map();

// Re-sync an existing user's VPN with their main subscription. Safe to call repeatedly.
// If the user's main subscription expires later than their VPN, re-provision (extend) the VPN.
// Pass `force=true` from admin actions to bypass the polling cooldown.
export async function syncAlorVpnWithSubscription(userId: number, force = false): Promise<{ extended: boolean; expiresAt: string | null; skipped?: boolean }> {
  if (!isAlorConfigured()) return { extended: false, expiresAt: null };
  const user = await storage.getUserById(userId);
  if (!user) return { extended: false, expiresAt: null };
  const tier = (user.tier || "FREE").toUpperCase();
  if (!["PRO", "ENTERPRISE", "GROUPS"].includes(tier)) return { extended: false, expiresAt: null };

  const mainExp = (user as any).subscriptionExpiresAt
    ? new Date((user as any).subscriptionExpiresAt)
    : null;
  const vpnExp = (user as any).alorVpnExpiresAt
    ? new Date((user as any).alorVpnExpiresAt)
    : null;

  // If the main sub is active, verify the VPN really covers it. IMPORTANT: do not
  // trust the LOCAL alorVpnExpiresAt alone — older code bumped it blindly on renewal
  // while the upstream expiry (fixed at creation, no extend API) stayed in the past.
  // So under the cooldown we also ask upstream for the REAL expiry.
  if (mainExp && mainExp.getTime() > Date.now()) {
    // Cooldown: skip if we tried recently (prevents hammering Alor API when extension fails).
    const last = lastSyncAt.get(userId) || 0;
    if (!force && Date.now() - last < SYNC_COOLDOWN_MS) {
      return { extended: false, expiresAt: vpnExp ? vpnExp.toISOString() : null, skipped: true };
    }
    lastSyncAt.set(userId, Date.now());

    // Real upstream expiry (falls back to local if status call fails).
    let realVpnExpMs = vpnExp ? vpnExp.getTime() : 0;
    if ((user as any).alorVpnToken) {
      try {
        const status = await getAlorStatus(upstreamAlorToken(user)!);
        realVpnExpMs = new Date(status.expires_at).getTime();
        // Heal the local record if it was overstated by old code.
        if (vpnExp && Math.abs(realVpnExpMs - vpnExp.getTime()) > 3600000) {
          await storage.updateUser(userId, { alorVpnExpiresAt: new Date(realVpnExpMs) });
        }
      } catch {
        // upstream token likely dead — treat as expired so we rotate below
        realVpnExpMs = 0;
      }
    }

    // Nothing to do if the REAL VPN expiry already covers the main subscription (±1d).
    if (realVpnExpMs && mainExp.getTime() - realVpnExpMs <= 86400000) {
      return { extended: false, expiresAt: new Date(realVpnExpMs).toISOString() };
    }

    const days = Math.ceil((mainExp.getTime() - Date.now()) / 86400000);
    if (days > 0) {
      const beforeExp = realVpnExpMs;
      await autoProvisionAlorVpn(userId, tier, days);
      const refreshed = await storage.getUserById(userId);
      const afterExp = (refreshed as any)?.alorVpnExpiresAt
        ? new Date((refreshed as any).alorVpnExpiresAt).getTime()
        : 0;
      // Only report extended=true when the expiry actually advanced.
      return {
        extended: afterExp > beforeExp + 86400000,
        expiresAt: afterExp ? new Date(afterExp).toISOString() : null,
      };
    }
  }
  return { extended: false, expiresAt: vpnExp ? vpnExp.toISOString() : null };
}

// Local admin guard mirroring the requireAdmin defined in server/routes.ts so that both
// x-admin-token (password admin) and ADMIN_IDS (Telegram admin) modes work consistently.
async function isAdminRequest(req: any): Promise<boolean> {
  const ADMIN_TOKEN_SECRET = process.env.ADMIN_TOKEN_SECRET || "";
  const ADMIN_LOGIN_ENABLED = Boolean(process.env.ADMIN_PASSWORD && ADMIN_TOKEN_SECRET);
  const tokenHeader = (req.headers["x-admin-token"] as string) || "";
  if (ADMIN_LOGIN_ENABLED && tokenHeader && tokenHeader.length === ADMIN_TOKEN_SECRET.length) {
    // constant-time compare
    let diff = 0;
    for (let i = 0; i < tokenHeader.length; i++) diff |= tokenHeader.charCodeAt(i) ^ ADMIN_TOKEN_SECRET.charCodeAt(i);
    if (diff === 0) return true;
  }
  const ADMIN_IDS = (process.env.ADMIN_IDS || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (req.user && ADMIN_IDS.includes(String(req.user.tgId || ""))) return true;
  if (!req.user && req.session?.userId) {
    try {
      const u = await storage.getUserById(req.session.userId);
      if (u && ADMIN_IDS.includes(u.tgId)) return true;
    } catch {}
  }
  return false;
}
