import type { Request, Response, Express } from "express";
import QRCode from "qrcode";
import { storage } from "./storage";
import { buildPublicSubUrl } from "./vpnProxy";

export interface AppDeepLink {
  id: string;
  name: string;
  platforms: ("ios" | "android" | "windows" | "macos" | "linux")[];
  deepLink: string;
  storeUrl: string;
  recommended?: boolean;
}

function b64(s: string): string {
  return Buffer.from(s, "utf8").toString("base64").replace(/=+$/, "");
}
function b64url(s: string): string {
  // URL-safe base64: replace + / with - _ and strip padding (safe inside URL path segments)
  return b64(s).replace(/\+/g, "-").replace(/\//g, "_");
}

export function buildDeepLinks(subUrl: string): AppDeepLink[] {
  const encoded = encodeURIComponent(subUrl);
  const base64Url = b64(subUrl);          // standard base64 — fine for sub://<b64>
  const base64UrlSafe = b64url(subUrl);   // url-safe base64 — for path segments (Happ)
  const subSchemeUniversal = `sub://${base64Url}`;

  return [
    {
      id: "happ",
      name: "Happ",
      platforms: ["ios", "android", "windows", "macos"],
      deepLink: `happ://add/${base64UrlSafe}`,
      storeUrl: "https://happ.su",
      recommended: true,
    },
    {
      id: "v2rayng",
      name: "v2rayNG",
      platforms: ["android"],
      deepLink: `v2rayng://install-sub?url=${encoded}`,
      storeUrl: "https://play.google.com/store/apps/details?id=com.v2ray.ang",
    },
    {
      id: "shadowrocket",
      name: "Shadowrocket",
      platforms: ["ios"],
      deepLink: subSchemeUniversal,
      storeUrl: "https://apps.apple.com/app/shadowrocket/id932747118",
      recommended: true,
    },
    {
      id: "streisand",
      name: "Streisand",
      platforms: ["ios"],
      deepLink: `streisand://import/${encoded}`,
      storeUrl: "https://apps.apple.com/app/streisand/id6450534064",
    },
    {
      id: "foxray",
      name: "FoXray",
      platforms: ["ios"],
      deepLink: `foxray://install-sub?url=${encoded}`,
      storeUrl: "https://apps.apple.com/app/foxray/id6448898396",
    },
    {
      id: "hiddify",
      name: "Hiddify",
      platforms: ["ios", "android", "windows", "macos", "linux"],
      deepLink: `hiddify://install-config?url=${encoded}`,
      storeUrl: "https://hiddify.com",
    },
    {
      id: "nekobox",
      name: "NekoBox",
      platforms: ["android", "windows"],
      deepLink: `sn://subscription?url=${encoded}`,
      storeUrl: "https://github.com/MatsuriDayo/NekoBoxForAndroid/releases",
    },
    {
      id: "clashverge",
      name: "Clash Verge",
      platforms: ["windows", "macos", "linux"],
      deepLink: `clash://install-config?url=${encoded}&name=DarkShare+VPN`,
      storeUrl: "https://github.com/clash-verge-rev/clash-verge-rev/releases",
    },
    {
      id: "v2rayn",
      name: "v2rayN",
      platforms: ["windows"],
      deepLink: subSchemeUniversal,
      storeUrl: "https://github.com/2dust/v2rayN/releases",
    },
  ];
}

// Simple in-memory rate limiter for QR endpoint (per IP). Light protection against compute abuse.
const qrHits = new Map<string, { count: number; resetAt: number }>();
function qrRateLimit(ip: string): boolean {
  const now = Date.now();
  const slot = qrHits.get(ip);
  if (!slot || slot.resetAt < now) {
    qrHits.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  slot.count += 1;
  return slot.count <= 30; // max 30 QR/min per IP
}

export function registerVpnDeepLinkRoutes(app: Express) {
  // HTTPS bridge that triggers a custom-scheme deep link.
  // Telegram inline keyboard URL buttons only accept http(s)/tg:// — so we hand off via a tiny HTML page.
  app.get("/vpn/open/:app/:token", async (req: Request, res: Response) => {
    try {
      const appId = String(req.params.app || "").trim();
      const token = String(req.params.token || "").trim();
      if (!appId || !token) return res.status(404).send("Not found");

      const subUrl = buildPublicSubUrl(req, token);
      const apps = buildDeepLinks(subUrl);
      const target = apps.find((a) => a.id === appId);
      if (!target) return res.status(404).send("Unknown app");

      const escapedDeep = target.deepLink.replace(/"/g, "&quot;");
      const escapedStore = target.storeUrl.replace(/"/g, "&quot;");
      const html = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="referrer" content="no-referrer">
<title>Opening ${target.name}…</title>
<style>
  body{margin:0;background:#0a0a0c;color:#e5e7eb;font:15px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:24px}
  .card{max-width:380px;width:100%;background:#111114;border:1px solid #1f1f24;border-radius:16px;padding:24px;text-align:center}
  h1{font-size:18px;margin:0 0 6px;color:#fff}
  p{margin:0 0 16px;color:#9ca3af;font-size:13.5px}
  .b{display:block;padding:12px 16px;border-radius:10px;background:#06b6d4;color:#000;font-weight:600;text-decoration:none;margin:8px 0}
  .b.s{background:transparent;color:#a1a1aa;border:1px solid #27272a}
  .muted{font-size:11.5px;color:#52525b;margin-top:14px}
</style></head><body>
<div class="card">
  <h1>Opening ${target.name}…</h1>
  <p>If the app doesn't open automatically, tap the button below.</p>
  <a class="b" href="${escapedDeep}" id="go">Open in ${target.name}</a>
  <a class="b s" href="${escapedStore}" target="_blank" rel="noopener">Don't have it? Install ${target.name}</a>
  <div class="muted">If nothing happens, install the app first, then return and tap again.</div>
</div>
<script>
  (function(){
    var u = ${JSON.stringify(target.deepLink)};
    try { window.location.replace(u); } catch(e) { window.location.href = u; }
  })();
</script>
</body></html>`;
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "no-store");
      return res.send(html);
    } catch (err: any) {
      console.error("[vpnDeepLinks] /open error:", err?.message || err);
      return res.status(500).send("Error");
    }
  });

  // QR code PNG of subscription URL — scannable by any V2Ray-compatible app
  app.get("/vpn/sub/:token/qr", async (req: Request, res: Response) => {
    const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip || "unknown";
    if (!qrRateLimit(ip)) return res.status(429).send("Too many requests");

    try {
      const token = String(req.params.token || "").trim();
      if (!token) return res.status(404).send("Not found");

      const subUrl = buildPublicSubUrl(req, token);
      const png = await QRCode.toBuffer(subUrl, {
        type: "png",
        errorCorrectionLevel: "M",
        margin: 2,
        width: 512,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });

      res.setHeader("Content-Type", "image/png");
      res.setHeader("Cache-Control", "public, max-age=300");
      return res.send(png);
    } catch (err: any) {
      console.error("[vpnDeepLinks] qr error:", err?.message || err);
      return res.status(500).send("QR error");
    }
  });

  // Note: /api/alor-vpn/deep-links removed — frontend gets `apps[]` + `qrUrl` from /api/alor-vpn/status,
  // and the bot calls buildDeepLinks() directly. No need for a duplicate endpoint with auth complexity.
}
