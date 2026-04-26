import type { Express, Request, Response, NextFunction } from "express";
import { generateKeyPairSync, randomBytes } from "crypto";
import QRCode from "qrcode";
import { storage } from "./storage";
import { ADMIN_IDS } from "./bot";
import type { VpnServer, VpnPeer } from "@shared/schema";
import { insertVpnServerSchema } from "@shared/schema";

export function generateWireGuardKeyPair(): { privateKey: string; publicKey: string } {
  const { privateKey, publicKey } = generateKeyPairSync("x25519");
  const priv = privateKey.export({ format: "der", type: "pkcs8" }).subarray(-32);
  const pub = publicKey.export({ format: "der", type: "spki" }).subarray(-32);
  return { privateKey: priv.toString("base64"), publicKey: pub.toString("base64") };
}

export function generatePresharedKey(): string {
  return randomBytes(32).toString("base64");
}

export function allocatePeerIp(serverId: number, peerIndex: number): string {
  const block = ((serverId - 1) % 200) + 10;
  const host = (peerIndex % 250) + 2;
  return `10.${block}.0.${host}/32`;
}

export function buildPeerConfig(
  peer: { peerPrivateKey: string; presharedKey: string | null; allowedIp: string; dns: string | null },
  server: { serverPublicKey: string; publicEndpoint: string; port: number }
): string {
  const lines = [
    "[Interface]",
    `PrivateKey = ${peer.peerPrivateKey}`,
    `Address = ${peer.allowedIp}`,
    `DNS = ${peer.dns || "1.1.1.1, 1.0.0.1"}`,
    "",
    "[Peer]",
    `PublicKey = ${server.serverPublicKey}`,
  ];
  if (peer.presharedKey) lines.push(`PresharedKey = ${peer.presharedKey}`);
  lines.push(
    `Endpoint = ${server.publicEndpoint}:${server.port}`,
    "AllowedIPs = 0.0.0.0/0, ::/0",
    "PersistentKeepalive = 25",
  );
  return lines.join("\n");
}

const PRO_TIERS = new Set(["PRO", "ENTERPRISE", "GROUPS"]);

export function isProTier(tier: string | null | undefined): boolean {
  return PRO_TIERS.has(String(tier || "").toUpperCase());
}

const MAX_PEERS_PER_USER: Record<string, number> = {
  PRO: 3,
  ENTERPRISE: 10,
  GROUPS: 25,
};

interface AuthLikeRequest extends Request {
  user?: { id: number; tier?: string | null; tgId?: string | null } & any;
}

export function registerVpnRoutes(
  app: Express,
  loadUser: any,
  requireAuth: any,
) {
  // Public: list active servers (no secrets exposed)
  app.get("/api/vpn/servers", async (_req: Request, res: Response) => {
    try {
      const servers = await storage.listVpnServers(false);
      const sanitized = servers.map((s) => ({
        id: s.id,
        region: s.region,
        countryCode: s.countryCode,
        flag: s.flag,
        capacity: s.capacity,
        used: s.used,
        load: s.capacity > 0 ? Math.min(100, Math.round((s.used / s.capacity) * 100)) : 0,
        isPremium: s.isPremium,
        status: s.status,
      }));
      res.json(sanitized);
    } catch (err: any) {
      console.error("VPN list servers error:", err);
      res.status(500).json({ error: "internal" });
    }
  });

  // Auth: list current user's peers (without private keys)
  app.get("/api/vpn/peers/me", loadUser, requireAuth, async (req: AuthLikeRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const peers = await storage.listUserVpnPeers(userId);
      const sanitized = peers.map((p) => ({
        id: p.id,
        serverId: p.serverId,
        serverRegion: p.serverRegion,
        serverFlag: p.serverFlag,
        allowedIp: p.allowedIp,
        status: p.status,
        trafficUsed: p.trafficUsed,
        lastHandshakeAt: p.lastHandshakeAt,
        createdAt: p.createdAt,
        expiresAt: p.expiresAt,
      }));
      res.json(sanitized);
    } catch (err: any) {
      console.error("VPN list user peers error:", err);
      res.status(500).json({ error: "internal" });
    }
  });

  // Auth: create new peer (PRO+ only)
  app.post("/api/vpn/peers", loadUser, requireAuth, async (req: AuthLikeRequest, res: Response) => {
    try {
      const user = req.user!;
      const tier = String(user.tier || "FREE").toUpperCase();
      if (!isProTier(tier)) {
        return res.status(402).json({ error: "pro_required", message: "VPN requires PRO+ subscription" });
      }

      const serverId = Number(req.body?.serverId);
      if (!Number.isFinite(serverId) || serverId <= 0) {
        return res.status(400).json({ error: "invalid_server_id" });
      }

      const server = await storage.getVpnServer(serverId);
      if (!server || server.status !== "active") {
        return res.status(404).json({ error: "server_not_found" });
      }
      if (server.isPremium && tier !== "ENTERPRISE" && tier !== "GROUPS") {
        return res.status(402).json({ error: "premium_server_requires_enterprise" });
      }
      if (server.used >= server.capacity) {
        return res.status(503).json({ error: "server_full" });
      }

      const limit = MAX_PEERS_PER_USER[tier] ?? 1;
      const activeCount = await storage.countActiveVpnPeers(user.id);
      if (activeCount >= limit) {
        return res.status(429).json({ error: "peer_limit_reached", limit });
      }

      const { privateKey, publicKey } = generateWireGuardKeyPair();
      const presharedKey = generatePresharedKey();
      const allowedIp = allocatePeerIp(server.id, server.used + activeCount);

      const expires = new Date();
      expires.setDate(expires.getDate() + 30);

      const peer = await storage.createVpnPeer({
        userId: user.id,
        serverId: server.id,
        peerPublicKey: publicKey,
        peerPrivateKey: privateKey,
        presharedKey,
        allowedIp,
        dns: "1.1.1.1, 1.0.0.1",
        expiresAt: expires,
        status: "active",
      } as any);

      await storage.incrementVpnServerUsed(server.id, 1);

      try {
        await storage.logActivity({
          userId: user.id,
          action: "vpn_peer_created",
          metadata: { serverId: server.id, peerId: peer.id, region: server.region } as any,
        } as any);
      } catch {}

      res.json({
        id: peer.id,
        serverId: peer.serverId,
        serverRegion: server.region,
        serverFlag: server.flag,
        allowedIp: peer.allowedIp,
        status: peer.status,
        expiresAt: peer.expiresAt,
        createdAt: peer.createdAt,
      });
    } catch (err: any) {
      console.error("VPN create peer error:", err);
      res.status(500).json({ error: "internal" });
    }
  });

  // Auth: download .conf file (sensitive — only owner)
  app.get("/api/vpn/peers/:id/config", loadUser, requireAuth, async (req: AuthLikeRequest, res: Response) => {
    try {
      const peerId = parseInt(req.params.id, 10);
      if (!Number.isFinite(peerId)) return res.status(400).json({ error: "invalid_id" });
      const peer = await storage.getVpnPeer(peerId);
      if (!peer) return res.status(404).json({ error: "not_found" });
      if (peer.userId !== req.user!.id) return res.status(403).json({ error: "forbidden" });
      const server = await storage.getVpnServer(peer.serverId);
      if (!server) return res.status(404).json({ error: "server_gone" });

      const conf = buildPeerConfig(peer, server);
      const filename = `darkshare-vpn-${server.countryCode.toLowerCase()}-${peer.id}.conf`;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Cache-Control", "no-store, max-age=0");
      res.send(conf);
    } catch (err: any) {
      console.error("VPN config error:", err);
      res.status(500).json({ error: "internal" });
    }
  });

  // Auth: QR code (PNG) of the .conf for mobile WireGuard apps
  app.get("/api/vpn/peers/:id/qr", loadUser, requireAuth, async (req: AuthLikeRequest, res: Response) => {
    try {
      const peerId = parseInt(req.params.id, 10);
      if (!Number.isFinite(peerId)) return res.status(400).json({ error: "invalid_id" });
      const peer = await storage.getVpnPeer(peerId);
      if (!peer) return res.status(404).json({ error: "not_found" });
      if (peer.userId !== req.user!.id) return res.status(403).json({ error: "forbidden" });
      const server = await storage.getVpnServer(peer.serverId);
      if (!server) return res.status(404).json({ error: "server_gone" });

      const conf = buildPeerConfig(peer, server);
      const dataUrl = await QRCode.toDataURL(conf, { width: 512, margin: 2, color: { dark: "#0a0a0a", light: "#ffffff" } });
      const base64 = dataUrl.split(",")[1] || "";
      const png = Buffer.from(base64, "base64");
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Cache-Control", "no-store, max-age=0");
      res.send(png);
    } catch (err: any) {
      console.error("VPN QR error:", err);
      res.status(500).json({ error: "internal" });
    }
  });

  // Auth: revoke a peer
  app.delete("/api/vpn/peers/:id", loadUser, requireAuth, async (req: AuthLikeRequest, res: Response) => {
    try {
      const peerId = parseInt(req.params.id, 10);
      if (!Number.isFinite(peerId)) return res.status(400).json({ error: "invalid_id" });
      const peer = await storage.getVpnPeer(peerId);
      if (!peer) return res.status(404).json({ error: "not_found" });
      if (peer.userId !== req.user!.id) return res.status(403).json({ error: "forbidden" });
      if (peer.status === "revoked") return res.json({ ok: true, alreadyRevoked: true });

      await storage.revokeVpnPeer(peerId, req.user!.id);
      await storage.incrementVpnServerUsed(peer.serverId, -1);
      try {
        await storage.logActivity({
          userId: req.user!.id,
          action: "vpn_peer_revoked",
          metadata: { peerId, serverId: peer.serverId } as any,
        } as any);
      } catch {}
      res.json({ ok: true });
    } catch (err: any) {
      console.error("VPN revoke error:", err);
      res.status(500).json({ error: "internal" });
    }
  });

  // ===== Admin =====
  const requireAdmin = async (req: AuthLikeRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "auth_required" });
    if (!ADMIN_IDS.includes(String(req.user.tgId || ""))) return res.status(403).json({ error: "admin_only" });
    next();
  };

  app.get("/api/admin/vpn/servers", loadUser, requireAuth, requireAdmin, async (_req, res) => {
    try {
      const servers = await storage.listVpnServers(true);
      res.json(servers);
    } catch (err: any) {
      console.error("Admin VPN list error:", err);
      res.status(500).json({ error: "internal" });
    }
  });

  app.post("/api/admin/vpn/servers", loadUser, requireAuth, requireAdmin, async (req, res) => {
    try {
      const parsed = insertVpnServerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "invalid_body", details: parsed.error.flatten() });
      }
      const created = await storage.createVpnServer(parsed.data);
      res.json(created);
    } catch (err: any) {
      console.error("Admin VPN create error:", err);
      res.status(500).json({ error: "internal" });
    }
  });

  app.patch("/api/admin/vpn/servers/:id", loadUser, requireAuth, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (!Number.isFinite(id)) return res.status(400).json({ error: "invalid_id" });
      const partial = insertVpnServerSchema.partial().safeParse(req.body);
      if (!partial.success) return res.status(400).json({ error: "invalid_body" });
      const updated = await storage.updateVpnServer(id, partial.data);
      res.json(updated);
    } catch (err: any) {
      console.error("Admin VPN patch error:", err);
      res.status(500).json({ error: "internal" });
    }
  });

  app.delete("/api/admin/vpn/servers/:id", loadUser, requireAuth, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (!Number.isFinite(id)) return res.status(400).json({ error: "invalid_id" });
      await storage.deleteVpnServer(id);
      res.json({ ok: true });
    } catch (err: any) {
      console.error("Admin VPN delete error:", err);
      res.status(500).json({ error: "internal" });
    }
  });
}
