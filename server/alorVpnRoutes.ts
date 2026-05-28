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

interface AuthReq extends Request {
  user?: { id: number; tier?: string | null; tgId?: string | null } & any;
}

function publicSubUrl(req: Request, token: string | null | undefined): string | null {
  if (!token) return null;
  return buildPublicSubUrl(req, token);
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
