import type { Express, Request, Response } from "express";
import { createHash } from "crypto";
import { storage } from "./storage";
import { vpnDeviceLimit } from "./alorVpn";

// Country access per tier: PRO sees a curated subset; ENTERPRISE/GROUPS see all.
// Keys match the country names AlorVPN reports (lowercased) — see FLAG_BY_COUNTRY for full mapping.
const TIER_COUNTRIES: Record<string, Set<string> | null> = {
  PRO: new Set(["germany", "netherlands", "finland", "france", "poland", "ukraine", "usa"]),
  ENTERPRISE: null, // null => no restriction
  GROUPS: null,
};

function detectCountryKey(remark: string): string {
  const lower = remark.toLowerCase();
  for (const key of Object.keys(FLAG_BY_COUNTRY)) {
    const re = new RegExp(`(^|[^a-z])${key}([^a-z]|$)`, "i");
    if (re.test(lower)) return key;
  }
  return "";
}

function isAllowedForTier(remark: string, tier: string): boolean {
  const allow = TIER_COUNTRIES[tier.toUpperCase()];
  if (allow === undefined || allow === null) return true; // ENTERPRISE/GROUPS/unknown → all
  const key = detectCountryKey(remark);
  if (!key) return false; // unknown country → hide for PRO (safer than leaking)
  // Map aliases to canonical names used in the allow-list
  const canonicalAliases: Record<string, string> = {
    de: "germany", nl: "netherlands", us: "usa", "united states": "usa",
    uk: "uk", gb: "uk", fr: "france", fi: "finland", pl: "poland", ua: "ukraine",
  };
  const canonical = canonicalAliases[key] || key;
  return allow.has(canonical);
}

function fingerprint(req: Request): { fp: string; ipPrefix: string; uaShort: string } {
  const ua = (req.get("user-agent") || "").slice(0, 200);
  const ipRaw = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip || "0.0.0.0";
  // Hash the /24 (IPv4) or /48 (IPv6) prefix so we don't pin the user to a specific session IP
  const ipPrefix = ipRaw.includes(":")
    ? ipRaw.split(":").slice(0, 3).join(":")
    : ipRaw.split(".").slice(0, 3).join(".");
  const fp = createHash("sha256").update(`${ua}|${ipPrefix}`).digest("hex").slice(0, 32);
  return { fp, ipPrefix, uaShort: ua };
}

function deviceNameFromUA(ua: string): string {
  const u = ua.toLowerCase();
  // App detection (order matters — most specific first)
  if (u.includes("happ")) return "Happ";
  if (u.includes("shadowrocket")) return "Shadowrocket";
  if (u.includes("streisand")) return "Streisand";
  if (u.includes("v2rayng") || u.includes("v2rayn")) return "v2rayNG";
  if (u.includes("hiddify")) return "Hiddify";
  if (u.includes("clash")) return "Clash";
  if (u.includes("nekobox") || u.includes("nekoray")) return "Nekobox";
  if (u.includes("foxray")) return "FoXray";
  if (u.includes("singbox") || u.includes("sing-box")) return "sing-box";
  if (u.includes("loon")) return "Loon";
  if (u.includes("quantumult")) return "Quantumult";
  // Platform fallback
  if (/iphone|ipad|ipod/.test(u)) return "iOS device";
  if (/android/.test(u)) return "Android device";
  if (/mac os|macintosh/.test(u)) return "macOS";
  if (/windows/.test(u)) return "Windows";
  if (/linux/.test(u)) return "Linux";
  return "VPN client";
}

const BRAND = "DarkShare VPN";
const SERVER_PREFIX = "DarkShare";

const FLAG_BY_COUNTRY: Record<string, string> = {
  de: "🇩🇪", germany: "🇩🇪",
  nl: "🇳🇱", netherlands: "🇳🇱",
  us: "🇺🇸", usa: "🇺🇸", "united states": "🇺🇸",
  uk: "🇬🇧", gb: "🇬🇧", britain: "🇬🇧",
  fr: "🇫🇷", france: "🇫🇷",
  fi: "🇫🇮", finland: "🇫🇮",
  se: "🇸🇪", sweden: "🇸🇪",
  pl: "🇵🇱", poland: "🇵🇱",
  ua: "🇺🇦", ukraine: "🇺🇦",
  ch: "🇨🇭", switzerland: "🇨🇭",
  at: "🇦🇹", austria: "🇦🇹",
  ca: "🇨🇦", canada: "🇨🇦",
  jp: "🇯🇵", japan: "🇯🇵",
  sg: "🇸🇬", singapore: "🇸🇬",
  hk: "🇭🇰",
  tr: "🇹🇷", turkey: "🇹🇷",
  ru: "🇷🇺",
  ee: "🇪🇪", estonia: "🇪🇪",
  lv: "🇱🇻", latvia: "🇱🇻",
  lt: "🇱🇹", lithuania: "🇱🇹",
  ro: "🇷🇴", romania: "🇷🇴",
  cz: "🇨🇿",
  es: "🇪🇸", spain: "🇪🇸",
  it: "🇮🇹", italy: "🇮🇹",
  bg: "🇧🇬", bulgaria: "🇧🇬",
};

function getFlag(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, flag] of Object.entries(FLAG_BY_COUNTRY)) {
    const re = new RegExp(`(^|[^a-z])${key}([^a-z]|$)`, "i");
    if (re.test(lower)) return flag;
  }
  return "🌍";
}

function rebrandRemark(original: string): string {
  let cleaned = decodeURIComponent(original || "")
    .replace(/alor\s*vpn/gi, "")
    .replace(/alorvpn/gi, "")
    .replace(/alor/gi, "")
    .replace(/[\s\-_|]+/g, " ")
    .trim();
  if (!cleaned) cleaned = "Server";
  const flag = getFlag(cleaned);
  if (/^[\p{Emoji}]/u.test(cleaned)) {
    return `${SERVER_PREFIX} ${cleaned}`;
  }
  return `${SERVER_PREFIX} ${flag} ${cleaned}`;
}

function extractRemark(line: string): string {
  const hashIdx = line.indexOf("#");
  if (hashIdx === -1) return "";
  try { return decodeURIComponent(line.slice(hashIdx + 1)); } catch { return line.slice(hashIdx + 1); }
}

function rewriteVlessOrTrojan(line: string, scheme: string): string {
  const hashIdx = line.indexOf("#");
  if (hashIdx === -1) return `${line}#${encodeURIComponent(`${SERVER_PREFIX} 🌍 Server`)}`;
  const base = line.slice(0, hashIdx);
  const remark = line.slice(hashIdx + 1);
  const newRemark = rebrandRemark(remark);
  return `${base}#${encodeURIComponent(newRemark)}`;
}

function rewriteVmess(line: string): string {
  try {
    const b64 = line.slice("vmess://".length).trim();
    const json = JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
    if (json.ps) json.ps = rebrandRemark(String(json.ps));
    else json.ps = `${SERVER_PREFIX} 🌍 Server`;
    const newB64 = Buffer.from(JSON.stringify(json)).toString("base64");
    return `vmess://${newB64}`;
  } catch {
    return line;
  }
}

function rewriteSs(line: string): string {
  return rewriteVlessOrTrojan(line, "ss");
}

function rewriteLine(line: string): string {
  const trimmed = line.trim();
  if (!trimmed) return line;
  if (trimmed.startsWith("vless://") || trimmed.startsWith("trojan://")) {
    return rewriteVlessOrTrojan(trimmed, trimmed.split("://")[0]);
  }
  if (trimmed.startsWith("vmess://")) return rewriteVmess(trimmed);
  if (trimmed.startsWith("ss://")) return rewriteSs(trimmed);
  return line;
}

function filterByTier(text: string, tier: string): string {
  const allowList = TIER_COUNTRIES[tier.toUpperCase()];
  // null/undefined → no restriction (ENTERPRISE/GROUPS or unknown tier)
  if (allowList === null || allowList === undefined) return text;
  return text
    .split(/\r?\n/)
    .filter((line) => {
      const trimmed = line.trim();
      if (!trimmed || !/^(vless|vmess|trojan|ss):\/\//.test(trimmed)) return true;
      if (trimmed.startsWith("vmess://")) {
        try {
          const b64 = trimmed.slice("vmess://".length).trim();
          const json = JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
          return isAllowedForTier(String(json.ps || ""), tier);
        } catch {
          // Fail closed for restricted tiers — unparseable entry is dropped
          return false;
        }
      }
      return isAllowedForTier(extractRemark(trimmed), tier);
    })
    .join("\n");
}

function rewriteBody(text: string, tier?: string): string {
  // First, try to detect base64 wrapper (single token, no scheme prefix)
  const looksLikeBase64 =
    !/^(vless|vmess|trojan|ss):\/\//m.test(text) &&
    /^[A-Za-z0-9+/=\r\n\s]+$/.test(text.trim()) &&
    text.trim().length > 40;

  let working = text;
  let wasBase64 = false;
  if (looksLikeBase64) {
    try {
      const decoded = Buffer.from(text.trim(), "base64").toString("utf8");
      if (/(vless|vmess|trojan|ss):\/\//.test(decoded)) {
        working = decoded;
        wasBase64 = true;
      }
    } catch {}
  }

  // Apply tier country filter AFTER base64 decode so PRO restrictions
  // are enforced on subscriptions delivered as base64 wrappers.
  const filtered = tier ? filterByTier(working, tier) : working;

  const rewritten = filtered
    .split(/\r?\n/)
    .map(rewriteLine)
    .join("\n");

  return wasBase64
    ? Buffer.from(rewritten).toString("base64")
    : rewritten;
}

function rewriteProfileTitleHeader(value: string | undefined): string {
  if (!value) return `base64:${Buffer.from(BRAND).toString("base64")}`;
  if (value.startsWith("base64:")) {
    return `base64:${Buffer.from(BRAND).toString("base64")}`;
  }
  return BRAND;
}

export function buildPublicSubUrl(req: Request, token: string): string {
  const proto = (req.headers["x-forwarded-proto"] as string) || req.protocol || "https";
  const host = (req.headers["x-forwarded-host"] as string) || req.get("host");
  return `${proto}://${host}/vpn/sub/${token}`;
}

export function registerVpnProxy(app: Express) {
  app.get("/vpn/sub/:token", async (req: Request, res: Response) => {
    try {
      const token = String(req.params.token || "").trim();
      if (!token) return res.status(404).send("Not found");

      const user = await storage.getUserByAlorVpnToken?.(token);

      // Device tracking & per-tier limit enforcement
      if (user?.id) {
        const tier = String(user.tier || "FREE").toUpperCase();
        const limit = vpnDeviceLimit(tier);
        const { fp, ipPrefix, uaShort } = fingerprint(req);
        try {
          const devices = await storage.listVpnDevices(user.id);
          const active = devices.filter((d: any) => !d.revokedAt);
          const existing = devices.find((d: any) => d.fingerprint === fp);
          if (!existing && limit > 0 && active.length >= limit) {
            res.setHeader("Content-Type", "text/plain; charset=utf-8");
            return res.status(403).send(
              `# DarkShare VPN — device limit reached\n# Your ${tier} plan allows up to ${limit} active devices.\n# Visit https://www.darkshare.store/vpn to revoke a device, then re-import.\n`
            );
          }
          await storage.upsertVpnDevice(user.id, fp, {
            userAgent: uaShort,
            ipPrefix,
            deviceName: deviceNameFromUA(uaShort),
          });
        } catch (e: any) {
          // Don't break VPN service if device tracking fails (e.g., table missing on stale deploy)
          console.warn("[vpnProxy] device tracking failed:", e?.message);
        }
      }

      let upstreamUrl: string | undefined = (user as any)?.alorVpnSubscriptionUrl;

      // Fallback: lookup by scanning is expensive; if storage method missing, just use token via AlorVPN convention
      if (!upstreamUrl) {
        // AlorVPN subscription_url pattern: https://sub.alorvpn.fun/sub/<token>
        upstreamUrl = `https://sub.alorvpn.fun/sub/${encodeURIComponent(token)}`;
      }

      // Leverage AlorVPN's native query-param rebranding (prefix + per-country names)
      // so even if our body rewriter misses a format edge-case, servers still show our brand.
      // Docs: https://alorvpn.fun/manual — supports ?prefix= and ?names=country:NewName,...
      const namesMap = [
        "germany:🇩🇪 Germany",
        "netherlands:🇳🇱 Netherlands",
        "usa:🇺🇸 USA",
        "us:🇺🇸 USA",
        "uk:🇬🇧 United Kingdom",
        "gb:🇬🇧 United Kingdom",
        "france:🇫🇷 France",
        "finland:🇫🇮 Finland",
        "sweden:🇸🇪 Sweden",
        "poland:🇵🇱 Poland",
        "ukraine:🇺🇦 Ukraine",
        "switzerland:🇨🇭 Switzerland",
        "austria:🇦🇹 Austria",
        "canada:🇨🇦 Canada",
        "japan:🇯🇵 Japan",
        "singapore:🇸🇬 Singapore",
        "turkey:🇹🇷 Turkey",
        "estonia:🇪🇪 Estonia",
        "spain:🇪🇸 Spain",
        "italy:🇮🇹 Italy",
      ].join(",");
      const sep = upstreamUrl.includes("?") ? "&" : "?";
      const upstreamUrlWithParams = `${upstreamUrl}${sep}prefix=${encodeURIComponent(`${SERVER_PREFIX} `)}&names=${encodeURIComponent(namesMap)}`;

      const upstreamRes = await fetch(upstreamUrlWithParams, {
        method: "GET",
        headers: {
          "User-Agent": req.get("user-agent") || "DarkShareVPN/1.0",
          "Accept": req.get("accept") || "*/*",
        },
      });

      const body = await upstreamRes.text();
      // Apply tier-based country filter (handles base64 wrappers internally) and white-label remarks
      const tier = String((user as any)?.tier || "FREE").toUpperCase();
      const rewritten = rewriteBody(body, tier);

      // Forward / rewrite headers
      const ctype = upstreamRes.headers.get("content-type") || "text/plain; charset=utf-8";
      const subUserinfo = upstreamRes.headers.get("subscription-userinfo");
      const profileUpdate = upstreamRes.headers.get("profile-update-interval") || "24";
      const profileTitle = rewriteProfileTitleHeader(upstreamRes.headers.get("profile-title") || undefined);

      res.setHeader("Content-Type", ctype);
      res.setHeader("Profile-Title", profileTitle);
      res.setHeader("Profile-Update-Interval", profileUpdate);
      res.setHeader("Profile-Web-Page-Url", `${req.protocol}://${req.get("host")}/vpn`);
      res.setHeader("Support-Url", `${req.protocol}://${req.get("host")}/contact`);
      if (subUserinfo) res.setHeader("Subscription-Userinfo", subUserinfo);
      res.setHeader("Cache-Control", "no-store");

      return res.status(upstreamRes.status).send(rewritten);
    } catch (err: any) {
      console.error("[vpnProxy] error:", err?.message || err);
      return res.status(502).send("Upstream error");
    }
  });
}
