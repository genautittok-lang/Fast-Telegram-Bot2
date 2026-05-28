import type { Express, Request, Response } from "express";
import { storage } from "./storage";

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

function rewriteBody(text: string): string {
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

  const rewritten = working
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
      const rewritten = rewriteBody(body);

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
