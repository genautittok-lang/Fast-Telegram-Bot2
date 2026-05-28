import type { Express, Request, Response } from "express";
import { createHash } from "crypto";
import { storage } from "./storage";
import { vpnDeviceLimit } from "./alorVpn";

// Country access per tier. As of v2 product decision, ALL paid tiers receive every
// AlorVPN country (20+). Tiers are differentiated by device limit only — see
// `vpnDeviceLimit()` in alorVpn.ts. Keeping the map for future re-introduction.
const TIER_COUNTRIES: Record<string, Set<string> | null> = {
  PRO: null,
  ENTERPRISE: null,
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
    .trim();
  // Strip any pre-existing DarkShare prefix(es) — idempotent, handles "DarkShare DarkShare Paris"
  while (/^(?:DarkShare(?:\s*VPN)?)\s*[-|:·•]?\s*/i.test(cleaned)) {
    cleaned = cleaned.replace(/^(?:DarkShare(?:\s*VPN)?)\s*[-|:·•]?\s*/i, "").trim();
  }
  cleaned = cleaned.replace(/\s{2,}/g, " ").trim();
  if (!cleaned) cleaned = "Server";
  const flag = getFlag(cleaned);
  // If remark already starts with a flag emoji or regional-indicator pair, don't add another
  // (Country flags are pairs of regional indicators U+1F1E6..U+1F1FF, which Extended_Pictographic misses in Node.)
  if (/^(?:[\\u{1F1E6}-\u{1F1FF}]{2}|\p{Extended_Pictographic})/u.test(cleaned)) {
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

// Rewrite Clash YAML: rename every proxy + DROP proxy blocks restricted by tier,
// then strip those names from proxy-groups references.
function rewriteClashYaml(text: string, tier?: string): string {
  const restricted = tier ? TIER_COUNTRIES[tier.toUpperCase()] != null : false;
  const lines = text.split(/\r?\n/);
  const out: string[] = [];

  // Pass 1: walk top-level sections; in `proxies:` collect blocks and selectively drop.
  const droppedOriginal = new Set<string>(); // original (pre-rename) names that we dropped
  const renameMap = new Map<string, string>(); // original → new (DarkShare-branded) name

  let i = 0;
  const len = lines.length;

  // Helper: get indent (leading spaces) length
  const indentOf = (s: string) => (s.match(/^ */)?.[0].length ?? 0);
  const isBlank = (s: string) => /^\s*$/.test(s);
  const isCommentOrBlank = (s: string) => isBlank(s) || /^\s*#/.test(s);

  while (i < len) {
    const line = lines[i];

    // Detect `proxies:` top-level
    if (/^proxies\s*:\s*(#.*)?$/.test(line)) {
      out.push(line);
      i++;
      // Process proxy blocks until we leave the section
      while (i < len) {
        const cur = lines[i];
        if (cur === undefined) break;
        // Section ends when a non-indented, non-blank, non-comment line appears
        if (!isCommentOrBlank(cur) && indentOf(cur) === 0) break;

        // A new proxy block starts with `  - name: ...` (any 2+ indent)
        const startMatch = cur.match(/^(\s+)-\s+name:\s*(["']?)(.*?)\2\s*(#.*)?$/);
        if (startMatch) {
          const blockIndent = indentOf(cur);
          const dashIndent = startMatch[1];
          const originalName = startMatch[3];
          const newName = rebrandRemark(originalName);
          renameMap.set(originalName, newName);

          // Capture the full block: this line + all following lines whose indent > blockIndent
          // until next `- name:` at same indent or end of section
          const block: string[] = [];
          // First line — rewrite name
          const safe = newName.replace(/"/g, '\\"');
          block.push(`${dashIndent}- name: "${safe}"`);
          i++;
          while (i < len) {
            const nxt = lines[i];
            if (nxt === undefined) break;
            if (!isCommentOrBlank(nxt) && indentOf(nxt) === 0) break;
            // Next sibling proxy block at same indent
            if (indentOf(nxt) === blockIndent && /^\s+-\s/.test(nxt)) break;
            block.push(nxt);
            i++;
          }

          const allowed = !restricted || isAllowedForTier(originalName, tier!);
          if (allowed) {
            out.push(...block);
          } else {
            droppedOriginal.add(originalName);
            // skip block (don't push)
          }
          continue;
        }

        // Anything else inside the proxies section (blank/comment) — keep
        out.push(cur);
        i++;
      }
      continue;
    }

    // Standalone `- name:` outside of proxies (shouldn't normally happen) — still rename
    const standalone = line.match(/^(\s*-?\s*name:\s*)(["']?)(.*?)\2\s*(#.*)?$/);
    if (standalone) {
      const prefix = standalone[1];
      const orig = standalone[3];
      const trail = standalone[4] ? ` ${standalone[4]}` : "";
      const newName = rebrandRemark(orig);
      renameMap.set(orig, newName);
      const safe = newName.replace(/"/g, '\\"');
      out.push(`${prefix}"${safe}"${trail}`);
      i++;
      continue;
    }

    out.push(line);
    i++;
  }

  // Pass 2: rewrite list-item references (e.g. inside `proxy-groups[*].proxies`) — drop or rename.
  const pass2: string[] = [];
  for (const ln of out) {
    const ref = ln.match(/^(\s+-\s+)(["']?)(.+?)\2\s*(#.*)?$/);
    if (ref && !ref[3].includes(":")) {
      const name = ref[3];
      if (droppedOriginal.has(name)) continue; // drop reference
      if (renameMap.has(name)) {
        const newName = renameMap.get(name)!;
        const safe = newName.replace(/"/g, '\\"');
        const trail = ref[4] ? ` ${ref[4]}` : "";
        pass2.push(`${ref[1]}"${safe}"${trail}`);
        continue;
      }
    }
    pass2.push(ln);
  }

  // Pass 3: rewrite composite refs in `rules:` (e.g. `- MATCH,Manchester` or `- DOMAIN,a.com,Manchester,no-resolve`)
  // Policy target is conventionally the last non-flag token; we remap/drop it.
  const POLICY_FLAGS = new Set(["no-resolve", "force-remote-dns"]);
  const pass3: string[] = [];
  let inRules = false;
  for (const ln of pass2) {
    if (/^rules\s*:\s*(#.*)?$/.test(ln)) { inRules = true; pass3.push(ln); continue; }
    if (inRules && /^\S/.test(ln) && !/^\s/.test(ln) && !/^\s*#/.test(ln) && !/^rules/.test(ln)) {
      // Left rules section
      inRules = false;
    }
    if (inRules) {
      const rm = ln.match(/^(\s*-\s+)(.*?)(\s*#.*)?$/);
      if (rm) {
        const parts = rm[2].split(",").map((p) => p.trim());
        if (parts.length >= 2) {
          // Find policy target: last token not in POLICY_FLAGS
          let targetIdx = parts.length - 1;
          while (targetIdx > 0 && POLICY_FLAGS.has(parts[targetIdx])) targetIdx--;
          const target = parts[targetIdx];
          if (droppedOriginal.has(target)) {
            parts[targetIdx] = "DIRECT";
          } else if (renameMap.has(target)) {
            parts[targetIdx] = renameMap.get(target)!;
          }
          const trail = rm[3] || "";
          pass3.push(`${rm[1]}${parts.join(",")}${trail}`);
          continue;
        }
      }
    }
    pass3.push(ln);
  }

  // Pass 4: prevent empty proxy-groups (would break Clash). If a group's `proxies:` list is empty, inject DIRECT.
  const finalOut: string[] = [];
  let inProxyGroups = false;
  let i2 = 0;
  while (i2 < pass3.length) {
    const ln = pass3[i2];
    if (/^proxy-groups\s*:\s*(#.*)?$/.test(ln)) {
      inProxyGroups = true; finalOut.push(ln); i2++; continue;
    }
    if (inProxyGroups && /^\S/.test(ln) && !/^\s/.test(ln) && !/^\s*#/.test(ln)) {
      inProxyGroups = false;
    }
    if (inProxyGroups) {
      // Detect `    proxies:` line — could be followed by inline `[...]` or block list
      const pm = ln.match(/^(\s+)proxies\s*:\s*(\[.*\])?\s*(#.*)?$/);
      if (pm) {
        const proxiesIndent = indentOf(ln);
        // Inline form: proxies: [A, B]
        const inline = pm[2];
        if (inline !== undefined) {
          const inner = inline.replace(/^\[|\]$/g, "").trim();
          if (!inner) {
            finalOut.push(`${pm[1]}proxies: [DIRECT]`);
            i2++;
            continue;
          }
          finalOut.push(ln); i2++; continue;
        }
        // Block form: collect following indented `- xxx` items
        finalOut.push(ln); i2++;
        const items: string[] = [];
        let dashIndent = "";
        while (i2 < pass3.length) {
          const nxt = pass3[i2];
          if (!isCommentOrBlank(nxt) && indentOf(nxt) <= proxiesIndent) break;
          const isItem = /^\s+-\s/.test(nxt);
          if (isItem) {
            if (!dashIndent) dashIndent = nxt.match(/^(\s+)-/)?.[1] || `${pm[1]}  `;
            items.push(nxt);
          } else if (!isCommentOrBlank(nxt)) {
            // not a list item but still indented (mapping under proxies?) — break
            break;
          }
          i2++;
        }
        if (items.length === 0) {
          finalOut.push(`${dashIndent || `${pm[1]}  `}- DIRECT`);
        } else {
          finalOut.push(...items);
        }
        continue;
      }
    }
    finalOut.push(ln);
    i2++;
  }

  return finalOut.join("\n");
}

// Rewrite sing-box JSON: rename `tag` fields in `outbounds` AND drop outbounds whose
// country is not allowed for the tier. Also clean up references in selector/urltest groups
// (their `outbounds: ["tag", ...]` lists) so the config stays valid after the drop.
function rewriteSingBoxJson(text: string, tier?: string): string {
  try {
    const obj = JSON.parse(text);
    if (!Array.isArray(obj.outbounds)) return JSON.stringify(obj, null, 2);

    const restricted = tier ? TIER_COUNTRIES[tier.toUpperCase()] != null : false;
    const droppedTags = new Set<string>();
    const renameMap = new Map<string, string>();

    const isProxyType = (t?: string) =>
      typeof t === "string" && /^(vless|vmess|trojan|shadowsocks|ss)$/i.test(t);

    obj.outbounds = obj.outbounds.filter((item: any) => {
      if (!item || typeof item.tag !== "string") return true;
      if (!isProxyType(item.type)) return true;
      const orig = item.tag;
      if (restricted && !isAllowedForTier(orig, tier!)) {
        droppedTags.add(orig);
        return false;
      }
      const newTag = rebrandRemark(orig);
      if (newTag !== orig) {
        renameMap.set(orig, newTag);
        item.tag = newTag;
      }
      return true;
    });

    // Clean up selector/urltest outbounds references
    for (const item of obj.outbounds) {
      if (!item || !Array.isArray(item.outbounds)) continue;
      if (!/^(selector|urltest)$/i.test(item.type || "")) continue;
      const cleaned: string[] = [];
      for (const ref of item.outbounds) {
        if (typeof ref !== "string") { cleaned.push(ref); continue; }
        if (droppedTags.has(ref)) continue;
        cleaned.push(renameMap.get(ref) || ref);
      }
      if (cleaned.length === 0) cleaned.push("direct");
      item.outbounds = cleaned;
      if (typeof item.default === "string") {
        if (droppedTags.has(item.default)) item.default = cleaned[0];
        else if (renameMap.has(item.default)) item.default = renameMap.get(item.default);
      }
    }

    // Clean up route.rules outbound references AND route.final (independently — `final` can
    // exist without `rules`, and either alone can leave stale tags pointing to dropped outbounds).
    if (obj.route) {
      if (Array.isArray(obj.route.rules)) {
        for (const rule of obj.route.rules) {
          if (!rule || typeof rule.outbound !== "string") continue;
          if (droppedTags.has(rule.outbound)) rule.outbound = "direct";
          else if (renameMap.has(rule.outbound)) rule.outbound = renameMap.get(rule.outbound);
        }
      }
      if (typeof obj.route.final === "string") {
        if (droppedTags.has(obj.route.final)) obj.route.final = "direct";
        else if (renameMap.has(obj.route.final)) obj.route.final = renameMap.get(obj.route.final);
      }
    }

    return JSON.stringify(obj, null, 2);
  } catch {
    return text;
  }
}

function rewriteBody(text: string, tier?: string): string {
  const trimmed = text.trim();

  // Detect format
  const looksLikeBase64 =
    !/^(vless|vmess|trojan|ss):\/\//m.test(text) &&
    /^[A-Za-z0-9+/=\r\n\s]+$/.test(trimmed) &&
    trimmed.length > 40;

  // Sing-box JSON
  if (trimmed.startsWith("{") && /"outbounds"\s*:/.test(trimmed)) {
    return rewriteSingBoxJson(text, tier);
  }

  // Clash YAML
  if (/^proxies\s*:/m.test(text) || /^\s*-\s*name\s*:/m.test(text)) {
    return rewriteClashYaml(text, tier);
  }

  let working = text;
  let wasBase64 = false;
  if (looksLikeBase64) {
    try {
      const decoded = Buffer.from(trimmed, "base64").toString("utf8");
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
        "england:🇬🇧 United Kingdom",
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
        "lithuania:🇱🇹 Lithuania",
        "latvia:🇱🇻 Latvia",
        "belgium:🇧🇪 Belgium",
        "norway:🇳🇴 Norway",
        "denmark:🇩🇰 Denmark",
        "czech:🇨🇿 Czechia",
        "romania:🇷🇴 Romania",
        "ireland:🇮🇪 Ireland",
        "russia:🇷🇺 Russia",
      ].join(",");
      const sep = upstreamUrl.includes("?") ? "&" : "?";
      const upstreamUrlWithParams = `${upstreamUrl}${sep}prefix=${encodeURIComponent(`${SERVER_PREFIX} `)}&names=${encodeURIComponent(namesMap)}`;

      // AlorVPN officially supports: Happ, v2rayNG, V2rayN, Nekobox, Clash/Verge, Shadowrocket.
      // For other V2Ray-compatible clients (Hiddify, Streisand, FoXray, sing-box, NekoRay,
      // Loon, Quantumult, generic curl/browsers) AlorVPN can return empty/non-parsable content.
      // → Send a known-good upstream UA so AlorVPN returns the universal raw v2ray base64
      //   subscription, which ALL V2Ray-compatible clients (including Hiddify) can parse.
      const rawUA = (req.get("user-agent") || "").toLowerCase();
      const isAlorNative =
        rawUA.includes("happ") ||
        rawUA.includes("v2rayng") || rawUA.includes("v2rayn") ||
        rawUA.includes("nekobox") || rawUA.includes("nekoray") ||
        rawUA.includes("clash") ||
        rawUA.includes("shadowrocket");
      const upstreamUA = isAlorNative
        ? (req.get("user-agent") as string)
        : "v2rayNG/1.9.5"; // universal raw v2ray subscription

      const upstreamRes = await fetch(upstreamUrlWithParams, {
        method: "GET",
        headers: {
          "User-Agent": upstreamUA,
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
