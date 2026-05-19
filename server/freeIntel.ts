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
  if (cache.size > 500) {
    // simple bounded eviction: drop oldest 100 entries
    const keys = Array.from(cache.keys()).slice(0, 100);
    for (const ek of keys) cache.delete(ek);
  }
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

// ===========================================================
// ============== Batch 2: 13 more free APIs ================
// ===========================================================

// ---------- ScamSniffer + PhishFort (crypto scam address/domain darklist) ----------
let scamAddrCache: Set<string> | null = null;
let scamDomainCache: Set<string> | null = null;
let scamLoaded = 0;
let scamInflight: Promise<void> | null = null;
async function loadCryptoScamLists(): Promise<void> {
  if (scamInflight) return scamInflight;
  if (scamAddrCache && Date.now() - scamLoaded < 6 * 3600 * 1000) return;
  scamInflight = (async () => {
    try {
      const [addrR, domR, pfR] = await Promise.all([
        fetchT("https://raw.githubusercontent.com/scamsniffer/scam-database/main/blacklist/address.json", 12000),
        fetchT("https://raw.githubusercontent.com/scamsniffer/scam-database/main/blacklist/domains.json", 12000),
        fetchT("https://raw.githubusercontent.com/phishfort/phishfort-lists/master/blacklists/domains.json", 12000),
      ]);
      const addrSet = new Set<string>();
      const domSet = new Set<string>();
      if (addrR && addrR.ok) {
        const arr = await addrR.json();
        if (Array.isArray(arr)) for (const a of arr) if (typeof a === "string") addrSet.add(a.toLowerCase());
      }
      const ingestDomains = (arr: any) => {
        if (!Array.isArray(arr)) return;
        for (const d of arr) if (typeof d === "string") {
          const host = d.replace(/^https?:\/\//, "").split("/")[0].toLowerCase();
          if (host) domSet.add(host);
        }
      };
      if (domR && domR.ok) ingestDomains(await domR.json());
      if (pfR && pfR.ok) ingestDomains(await pfR.json());
      if (addrSet.size > 0) scamAddrCache = addrSet;
      if (domSet.size > 0) scamDomainCache = domSet;
      if (scamAddrCache || scamDomainCache) scamLoaded = Date.now();
    } catch {}
  })().finally(() => { scamInflight = null; });
  return scamInflight;
}
export async function isCryptoScamAddress(address: string): Promise<boolean | null> {
  if (!scamAddrCache) { loadCryptoScamLists(); return null; }
  if (Date.now() - scamLoaded > 6 * 3600 * 1000) loadCryptoScamLists();
  return scamAddrCache.has(address.toLowerCase());
}
export async function isCryptoScamDomain(host: string): Promise<boolean | null> {
  if (!scamDomainCache) { loadCryptoScamLists(); return null; }
  if (Date.now() - scamLoaded > 6 * 3600 * 1000) loadCryptoScamLists();
  return scamDomainCache.has(host.toLowerCase());
}

// ---------- GitHub Security Advisories ----------
export interface GhAdvisory { ghsaId: string; severity: string; summary: string; cvss?: number; packages: string[] }
export async function githubAdvisoriesForCve(cveId: string): Promise<GhAdvisory[] | null> {
  try {
    const r = await fetchT(`https://api.github.com/advisories?cve_id=${encodeURIComponent(cveId)}&per_page=5`, 6000, {
      headers: { Accept: "application/vnd.github+json" },
    });
    if (!r || !r.ok) return null;
    const arr = await r.json();
    if (!Array.isArray(arr)) return null;
    return arr.map((a: any) => ({
      ghsaId: a.ghsa_id, severity: a.severity, summary: a.summary,
      cvss: a.cvss?.score,
      packages: (a.vulnerabilities || []).map((v: any) => `${v.package?.ecosystem}/${v.package?.name}`).filter(Boolean).slice(0, 5),
    }));
  } catch { return null; }
}

// ---------- Blocklist.de (per-IP attack counters) ----------
export interface BlocklistDeResult { attacks: number; categories?: string[] }
export async function blocklistDe(ip: string): Promise<BlocklistDeResult | null> {
  try {
    const r = await fetchT(`https://api.blocklist.de/api.php?ip=${encodeURIComponent(ip)}`, 5000);
    if (!r || !r.ok) return null;
    const txt = await r.text();
    // returns "attacks: N\nreports: M\n..." or similar key:value text
    const attacks = parseInt(txt.match(/attacks:\s*(\d+)/i)?.[1] || "0", 10);
    const cats: string[] = [];
    for (const line of txt.split("\n")) {
      const m = line.match(/^(\w+):\s*(\d+)/);
      if (m && parseInt(m[2], 10) > 0 && !["attacks", "reports"].includes(m[1].toLowerCase())) {
        cats.push(`${m[1]}=${m[2]}`);
      }
    }
    return { attacks, categories: cats.slice(0, 5) };
  } catch { return null; }
}

// ---------- Aggregated attacker IP blocklist (IPsum + GreenSnow + CINS) ----------
let aggBlocklistCache: Map<string, string[]> | null = null;
let aggBlocklistLoaded = 0;
let aggBlocklistInflight: Promise<void> | null = null;
async function loadAggBlocklist(): Promise<void> {
  if (aggBlocklistInflight) return aggBlocklistInflight;
  if (aggBlocklistCache && Date.now() - aggBlocklistLoaded < 6 * 3600 * 1000) return;
  aggBlocklistInflight = (async () => {
    const next = new Map<string, string[]>();
    const feeds: { name: string; url: string }[] = [
      { name: "IPsum", url: "https://raw.githubusercontent.com/stamparm/ipsum/master/levels/3.txt" },
      { name: "GreenSnow", url: "https://blocklist.greensnow.co/greensnow.txt" },
      { name: "CINS Army", url: "https://cinsscore.com/list/ci-badguys.txt" },
    ];
    await Promise.all(feeds.map(async (f) => {
      const r = await fetchT(f.url, 12000);
      if (!r || !r.ok) return;
      const txt = await r.text();
      for (const raw of txt.split("\n")) {
        const ip = raw.trim().split(/\s+/)[0];
        if (!ip || ip.startsWith("#")) continue;
        if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip)) continue;
        const arr = next.get(ip) || [];
        arr.push(f.name);
        next.set(ip, arr);
      }
    }));
    if (next.size > 0) {
      aggBlocklistCache = next;
      aggBlocklistLoaded = Date.now();
    }
  })().finally(() => { aggBlocklistInflight = null; });
  return aggBlocklistInflight;
}
export async function aggregatedBlocklistLookup(ip: string): Promise<string[] | null> {
  if (!aggBlocklistCache) { loadAggBlocklist(); return null; }
  if (Date.now() - aggBlocklistLoaded > 6 * 3600 * 1000) loadAggBlocklist();
  return aggBlocklistCache.get(ip) || [];
}

// ---------- OpenPhish (phishing URL feed) ----------
let openPhishCache: Set<string> | null = null;
let openPhishLoaded = 0;
let openPhishInflight: Promise<void> | null = null;
async function loadOpenPhish(): Promise<void> {
  if (openPhishInflight) return openPhishInflight;
  if (openPhishCache && Date.now() - openPhishLoaded < 1 * 3600 * 1000) return;
  openPhishInflight = (async () => {
    const r = await fetchT("https://openphish.com/feed.txt", 10000);
    if (!r || !r.ok) return;
    const txt = await r.text();
    const set = new Set<string>();
    for (const raw of txt.split("\n")) {
      const u = raw.trim();
      if (!u) continue;
      try {
        const host = new URL(u).hostname.toLowerCase();
        set.add(host);
      } catch {}
    }
    if (set.size > 0) {
      openPhishCache = set;
      openPhishLoaded = Date.now();
    }
  })().finally(() => { openPhishInflight = null; });
  return openPhishInflight;
}
export async function isOpenPhish(host: string): Promise<boolean | null> {
  if (!openPhishCache) { loadOpenPhish(); return null; }
  if (Date.now() - openPhishLoaded > 1 * 3600 * 1000) loadOpenPhish();
  return openPhishCache.has(host.toLowerCase());
}

// ---------- ISC SANS (Internet Storm Center) ----------
export interface IscSansIp { count?: number; attacks?: number; maxdate?: string; mindate?: string; comment?: string }
export async function iscSansIp(ip: string): Promise<IscSansIp | null> {
  try {
    const r = await fetchT(`https://isc.sans.edu/api/ip/${encodeURIComponent(ip)}?json`, 6000);
    if (!r || !r.ok) return null;
    const j = await r.json();
    const node = j?.ip;
    if (!node) return null;
    return {
      count: parseInt(node.count, 10) || 0,
      attacks: parseInt(node.attacks, 10) || 0,
      maxdate: node.maxdate,
      mindate: node.mindate,
      comment: node.comment,
    };
  } catch { return null; }
}

// ---------- CoinPaprika (backup price feed) ----------
const paprikaId: Record<string, string> = {
  btc: "btc-bitcoin", eth: "eth-ethereum", trx: "trx-tron", sol: "sol-solana",
  bnb: "bnb-binance-coin", matic: "matic-polygon", ltc: "ltc-litecoin",
  doge: "doge-dogecoin", xrp: "xrp-xrp", usdt: "usdt-tether", usdc: "usdc-usd-coin",
};
export async function coinPaprikaUsd(symbol: string): Promise<number | null> {
  const id = paprikaId[symbol.toLowerCase()];
  if (!id) return null;
  const ck = `cp:${id}`;
  const cached = cacheGet<number>(ck);
  if (cached !== undefined) return cached;
  try {
    const r = await fetchT(`https://api.coinpaprika.com/v1/tickers/${id}`, 6000);
    if (!r || !r.ok) return null;
    const j = await r.json();
    const price = j?.quotes?.USD?.price;
    if (typeof price !== "number") return null;
    cacheSet(ck, price, 5 * 60 * 1000);
    return price;
  } catch { return null; }
}

// ---------- Wikipedia summary ----------
export interface WikiSummary { title: string; extract: string; description?: string; url?: string }
export async function wikipediaSummary(title: string): Promise<WikiSummary | null> {
  try {
    const r = await fetchT(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`, 5000);
    if (!r || r.status === 404 || !r.ok) return null;
    const j = await r.json();
    if (!j?.extract) return null;
    return { title: j.title, extract: j.extract, description: j.description, url: j.content_urls?.desktop?.page };
  } catch { return null; }
}

// ---------- GLEIF (Legal Entity Identifier) ----------
export interface GleifEntity { lei: string; name: string; country?: string; status?: string }
export async function gleifEntity(name: string): Promise<GleifEntity[] | null> {
  try {
    const r = await fetchT(`https://api.gleif.org/api/v1/lei-records?filter[entity.legalName]=${encodeURIComponent(name)}&page[size]=3`, 7000, {
      headers: { Accept: "application/vnd.api+json" },
    });
    if (!r || !r.ok) return null;
    const j = await r.json();
    const data = j?.data || [];
    return data.map((d: any) => ({
      lei: d.id,
      name: d.attributes?.entity?.legalName?.name || d.attributes?.entity?.legalName,
      country: d.attributes?.entity?.legalAddress?.country,
      status: d.attributes?.entity?.status,
    }));
  } catch { return null; }
}

// ---------- AdGuard DNS (security filtering resolver) ----------
// Returns: { blocked: true } if AdGuard's security filter blocks the host (malware/phish),
// { blocked: false, ips } if resolved normally, null on error.
export interface AdGuardResult { blocked: boolean; ips?: string[]; status?: number }
export async function adguardCheck(host: string): Promise<AdGuardResult | null> {
  try {
    const r = await fetchT(`https://dns.adguard-dns.com/resolve?name=${encodeURIComponent(host)}&type=A`, 5000, {
      headers: { Accept: "application/dns-json" },
    });
    if (!r || !r.ok) return null;
    const j = await r.json();
    const status = j?.Status;
    const answers: any[] = j?.Answer || [];
    const ips = answers.filter((a) => a.type === 1).map((a) => a.data as string);
    // AdGuard returns 0.0.0.0 (or NXDOMAIN) for blocked domains
    const blocked = status === 3 || ips.length === 0 || ips.some((ip) => ip === "0.0.0.0" || ip.startsWith("94.140.14.")); // 94.140.14.33 = AdGuard block-page IPs
    return { blocked, ips, status };
  } catch { return null; }
}
