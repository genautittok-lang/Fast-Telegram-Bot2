import type { Express, Request, Response } from "express";
import { storage } from "./storage";
import {
  createAlorSubscription,
  getAlorStatus,
  toggleAlorSubscription,
  isAlorConfigured,
  vpnDeviceLimit,
  vpnPlanDays,
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
          const status = await getAlorStatus(user.alorVpnToken);
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
        return res.status(402).json({ error: "pro_required", message: "VPN requires PRO or ENTERPRISE plan" });
      }

      if (!isAlorConfigured()) {
        return res.status(503).json({ error: "vpn_not_configured", message: "VPN service not configured yet" });
      }

      const period = req.body?.period || "monthly";
      const planDays = vpnPlanDays(period);

      if (user.alorVpnToken) {
        try {
          const status = await getAlorStatus(user.alorVpnToken);
          if (status.is_active) {
            return res.json({
              ok: true,
              alreadyActive: true,
              subscriptionUrl: publicSubUrl(req, user.alorVpnToken),
              expiresAt: status.expires_at,
              uuid: user.alorVpnUuid,
            });
          }
          await toggleAlorSubscription(user.alorVpnToken, true);
          const newExpiry = new Date(Date.now() + planDays * 86400000);
          await storage.updateUser(user.id, { alorVpnExpiresAt: newExpiry });
          return res.json({
            ok: true,
            reactivated: true,
            subscriptionUrl: publicSubUrl(req, user.alorVpnToken),
            expiresAt: newExpiry.toISOString(),
            uuid: user.alorVpnUuid,
          });
        } catch {
          // fallthrough to create new subscription
        }
      }

      const sub = await createAlorSubscription(planDays);
      await storage.updateUser(user.id, {
        alorVpnToken: sub.token,
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
        subscriptionUrl: publicSubUrl(req, sub.token),
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

      const status = await getAlorStatus(user.alorVpnToken);
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
      const devices = await storage.listVpnDevices(userId);
      const user = await storage.getUserById(userId);
      const tier = (user?.tier || "FREE").toUpperCase();
      const limit = vpnDeviceLimit(tier);
      const active = devices.filter((d: any) => !d.revokedAt);
      res.json({
        ok: true,
        deviceLimit: limit,
        activeCount: active.length,
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
      const result = await toggleAlorSubscription(user.alorVpnToken, isActive);
      return res.json({ ok: true, is_active: result.is_active });
    } catch (err: any) {
      console.error("[AlorVPN] toggle error:", err);
      res.status(500).json({ error: "internal" });
    }
  });
}

export async function autoProvisionAlorVpn(userId: number, tier: string, periodDays: number): Promise<void> {
  if (!isAlorConfigured()) return;
  if (!["PRO", "ENTERPRISE", "GROUPS"].includes(tier.toUpperCase())) return;

  try {
    const user = await storage.getUserById(userId);
    if (!user) return;

    if (user.alorVpnToken) {
      try {
        await toggleAlorSubscription(user.alorVpnToken, true);
        const newExpiry = new Date(Date.now() + periodDays * 86400000);
        await storage.updateUser(userId, { alorVpnExpiresAt: newExpiry });
        console.log(`[AlorVPN] Reactivated subscription for user ${userId}`);
        return;
      } catch {
        // fallthrough to create new
      }
    }

    const sub = await createAlorSubscription(periodDays);
    await storage.updateUser(userId, {
      alorVpnToken: sub.token,
      alorVpnUuid: sub.uuid,
      alorVpnSubscriptionUrl: sub.subscription_url,
      alorVpnExpiresAt: new Date(sub.expires_at),
    });
    console.log(`[AlorVPN] Created subscription for user ${userId}, expires ${sub.expires_at}`);
  } catch (err: any) {
    console.error(`[AlorVPN] Auto-provision failed for user ${userId}:`, err.message);
  }
}
