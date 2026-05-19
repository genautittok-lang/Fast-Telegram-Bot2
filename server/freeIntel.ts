// Free no-key OSINT helpers. All return null on any failure.
// Cached for large feeds (OFAC, Feodo, Spamhaus DROP).

async function fetchT(url: string, timeout = 6000, init?: RequestInit): Promise<Response | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeout);
    const r = await fetch(url, { ...init, signal: ctrl.signal, headers: { "User-Agent": "DarkShare-OSINT/1.0", ...(init?.headers || {}) } });
    clearTimeout(t);
    return r;
  } catch { return null; }
}

type CacheEntry<T> = { value: T; expires: number };
const cache = new Map<string, CacheEntry<any>>();
function cacheGet<T>(k: string): T | undefined {
  const e = cache.get(k);
  if (!e) return undefined;
  if (Date.now() > e.expires) { cache.delete(k); return undefined; }
  return e.value as T;
}
function cacheSet<T>(k: string, v: T, ttlMs: number) {
  cache.set(k, { value: v, expires: Date.now() + ttlMs });
}

// ---------- EPSS (FIRST.org) ----------
export interface EpssData { score: number; percentile: number; date?: string }
export async function epssLookup(cveId: string): Promise<EpssData | null> {
  try {
    const r = await fetchT(`https://api.first.org/data/v1/epss?cve=${encodeURIComponent(cveId)}`, 6000);
    if (!r || !r.ok) return null;
    const j = await r.json();
    const row = j?.data?.[0];
    if (!row) return null;
    return { score: parseFloat(row.epss), percentile: parseFloat(row.percentile), date: row.date };
  } catch { return null; }
}

// ---------- OSV.dev ----------
export interface OsvVuln { id: string; summary?: string; severity?: string }
export async function osvLookupByCve(cveId: string): Promise<OsvVuln[] | null> {
  try {
    const r = await fetchT("https://api.osv.dev/v1/query", 7000, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vulnerability: { id: cveId } }),
    });
    if (!r || !r.ok) {
      const r2 = await fetchT(`https://api.osv.dev/v1/vulns/${encodeURIComponent(cveId)}`, 6000);
      if (!r2 || !r2.ok) return null;
      const v = await r2.json();
      return [{ id: v.id, summary: v.summary, severity: v.severity?.[0]?.score }];
    }
    const j = await r.json();
    if (!j?.vulns?.length) return [];
    return j.vulns.slice(0, 10).map((v: any) => ({ id: v.id, summary: v.summary, severity: v.severity?.[0]?.score }));
  } catch { return null; }
}

// ---------- Mozilla Observatory v2 ----------
export interface ObservatoryResult { grade: string; score: number; testsPassed?: number; testsFailed?: number }
export async function mozillaObservatory(host: string): Promise<ObservatoryResult | null> {
  try {
    const r = await fetchT(`https://observatory-api.mdn.mozilla.net/api/v2/scan?host=${encodeURIComponent(host)}`, 8000, { method: "POST" });
    if (!r || !r.ok) return null;
    const j = await r.json();
    if (!j?.grade) return null;
    return { grade: j.grade, score: j.score, testsPassed: j.tests_passed, testsFailed: j.tests_failed };
  } catch { return null; }
}

// ---------- RIPEstat (network info) ----------
export interface RipeData { asn?: number; holder?: string; prefix?: string; country?: string; abuseContacts?: string[] }
export async function ripestat(ip: string): Promise<RipeData | null> {
  try {
    const [overview, abuse] = await Promise.all([
      fetchT(`https://stat.ripe.net/data/network-info/data.json?resource=${encodeURIComponent(ip)}`, 6000),
      fetchT(`https://stat.ripe.net/data/abuse-contact-finder/data.json?resource=${encodeURIComponent(ip)}`, 6000),
    ]);
    const result: RipeData = {};
    if (overview && overview.ok) {
      const j = await overview.json();
      const asns: string[] = j?.data?.asns || [];
      if (asns.length) result.asn = parseInt(asns[0], 10);
      if (j?.data?.prefix) result.prefix = j.data.prefix;
    }
    if (abuse && abuse.ok) {
      const j = await abuse.json();
      const contacts: string[] = j?.data?.abuse_contacts || [];
      if (contacts.length) result.abuseContacts = contacts.slice(0, 3);
    }
    if (!result.asn && !result.prefix && !result.abuseContacts) return null;
    return result;
  } catch { return null; }
}

// ---------- BGPView ----------
export interface BgpViewData { asn?: number; name?: string; description?: string; country?: string; prefixes?: number }
export async function bgpview(ip: string): Promise<BgpViewData | null> {
  try {
    const r = await fetchT(`https://api.bgpview.io/ip/${encodeURIComponent(ip)}`, 6000);
    if (!r || !r.ok) return null;
    const j = await r.json();
    const prefix = j?.data?.prefixes?.[0];
    const asn = prefix?.asn;
    if (!asn) return null;
    return {
      asn: asn.asn,
      name: asn.name,
      description: asn.description,
      country: asn.country_code,
      prefixes: j?.data?.prefixes?.length || 0,
    };
  } catch { return null; }
}

// ---------- StopForumSpam (IP / email / username) ----------
export interface SfsResult { appearances: number; lastSeen?: string; confidence?: number }
export async function stopForumSpam(kind: "ip" | "email" | "username", value: string): Promise<SfsResult | null> {
  try {
    const r = await fetchT(`https://api.stopforumspam.org/api?${kind}=${encodeURIComponent(value)}&json`, 5000);
    if (!r || !r.ok) return null;
    const j = await r.json();
    const node = j?.[kind];
    if (!node) return null;
    const appearances = node.appears ? (node.frequency || 1) : 0;
    return { appearances, lastSeen: node.lastseen, confidence: node.confidence };
  } catch { return null; }
}

// ---------- Feodo Tracker (botnet C2 IPs) ----------
let feodoCache: Set<string> | null = null;
let feodoLoaded = 0;
let feodoInflight: Promise<void> | null = null;
export async function isFeodoC2(ip: string): Promise<boolean | null> {
  try {
    const stale = !feodoCache || Date.now() - feodoLoaded > 6 * 3600 * 1000;
    if (stale) {
      if (!feodoInflight) {
        feodoInflight = (async () => {
          const r = await fetchT("https://feodotracker.abuse.ch/downloads/ipblocklist.json", 10000);
          if (r && r.ok) {
            try {
              const arr = await r.json();
              const set = new Set<string>();
              for (const row of arr) if (row?.ip_address) set.add(row.ip_address);
              feodoCache = set;
              feodoLoaded = Date.now();
            } catch {}
          }
        })().finally(() => { feodoInflight = null; });
      }
      // If we already have a cache, serve stale rather than waiting
      if (!feodoCache) await feodoInflight;
    }
    if (!feodoCache) return null;
    return feodoCache.has(ip);
  } catch { return feodoCache ? feodoCache.has(ip) : null; }
}

// ---------- HackerNews (Firebase) ----------
export interface HnUser { karma: number; created: number; about?: string; submitted?: number }
export async function hackerNewsUser(username: string): Promise<HnUser | null> {
  try {
    const r = await fetchT(`https://hacker-news.firebaseio.com/v0/user/${encodeURIComponent(username)}.json`, 5000);
    if (!r || !r.ok) return null;
    const j = await r.json();
    if (!j || !j.id) return null;
    return { karma: j.karma || 0, created: j.created || 0, about: j.about, submitted: j.submitted?.length };
  } catch { return null; }
}

// ---------- CoinGecko (free price) ----------
const coinGeckoId: Record<string, string> = {
  btc: "bitcoin", eth: "ethereum", trx: "tron", sol: "solana",
  bnb: "binancecoin", matic: "matic-network", ltc: "litecoin",
  doge: "dogecoin", xrp: "ripple", usdt: "tether", usdc: "usd-coin",
};
export async function coingeckoUsd(symbol: string): Promise<number | null> {
  const k = symbol.toLowerCase();
  const id = coinGeckoId[k];
  if (!id) return null;
  const cacheKey = `cg:${id}`;
  const cached = cacheGet<number>(cacheKey);
  if (cached !== undefined) return cached;
  try {
    const r = await fetchT(`https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`, 5000);
    if (!r || !r.ok) return null;
    const j = await r.json();
    const v = j?.[id]?.usd;
    if (typeof v !== "number") return null;
    cacheSet(cacheKey, v, 5 * 60 * 1000);
    return v;
  } catch { return null; }
}

// ---------- OFAC SDN (US Treasury sanctions, crypto addresses) ----------
let ofacCache: Set<string> | null = null;
let ofacLoaded = 0;
async function loadOfacCryptoSdn(): Promise<Set<string> | null> {
  if (ofacCache && Date.now() - ofacLoaded < 24 * 3600 * 1000) return ofacCache;
  try {
    const r = await fetchT("https://www.treasury.gov/ofac/downloads/sdn.csv", 15000);
    if (!r || !r.ok) return ofacCache;
    const txt = await r.text();
    const set = new Set<string>();
    const re = /\b(0x[a-fA-F0-9]{40}|bc1[a-z0-9]{20,80}|[13][a-km-zA-HJ-NP-Z1-9]{25,34}|T[a-zA-Z0-9]{33}|[1-9A-HJ-NP-Za-km-z]{32,44})\b/g;
    const matches = txt.match(re);
    if (matches) for (const m of matches) set.add(m.toLowerCase());
    ofacCache = set;
    ofacLoaded = Date.now();
    return set;
  } catch { return ofacCache; }
}
export async function isOfacSanctioned(address: string): Promise<boolean | null> {
  const set = await loadOfacCryptoSdn();
  if (!set) return null;
  return set.has(address.toLowerCase());
}
