import { OSINT_SOURCES, type OsintSource, type OsintCategory } from "@shared/osintSources";

export type ScanStatus =
  | "hit"
  | "clean"
  | "scanned"
  | "paid_only"
  | "rate_limit"
  | "no_data"
  | "not_applicable";

export interface ScanResult {
  name: string;
  category: OsintCategory;
  status: ScanStatus;
  evidence?: string;
}

const APPLICABLE: Record<OsintCategory, string[]> = {
  leaks: ["email", "phone", "username", "password", "wallet"],
  email: ["email"],
  phone: ["phone"],
  ip: ["ip"],
  domain: ["domain", "url"],
  wallet: ["wallet"],
  username: ["username"],
  threat: ["ip", "domain", "url", "hash", "email"],
  darkweb: ["email", "phone", "username", "wallet", "domain"],
  social: ["username", "email", "phone"],
};

const MIN_NAME_LEN = 5;

const PAID_ONLY = new Set([
  "DeHashed",
  "LeakCheck",
  "IntelligenceX",
  "Spycloud",
  "Hudson Rock",
  "BreachAware",
  "Hunter.io",
  "Snov.io",
  "VoilaNorbert",
  "Verifalia",
  "ZeroBounce",
  "MailboxValidator",
  "Skrapp",
  "Truecaller",
  "Sync.me",
  "OpenCNAM",
  "Twilio Lookup",
  "NumVerify",
  "Whitepages",
  "EveryCaller",
  "Censys",
  "FraudGuard",
  "IPQualityScore",
  "MaxMind",
  "BinaryEdge",
  "ZoomEye",
  "SecurityTrails",
  "RiskIQ PassiveTotal",
  "DomainTools",
  "Recorded Future",
  "ThreatBook",
  "ZeroFox",
  "Flashpoint",
  "DarkOwl",
  "Webhose",
  "Sixgill",
  "TRM Labs",
  "Chainabuse",
  "Crystal Blockchain",
  "Elliptic",
  "MetaSleuth",
  "Bitquery",
  "AnyRun",
  "Hybrid Analysis",
  "Joe Sandbox",
  "Intezer",
  "Maltiverse",
]);

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findHitForSource(name: string, findings: string[]): string | null {
  if (name.length < MIN_NAME_LEN) return null;
  const re = new RegExp(`(^|[^a-z0-9])${escapeRegex(name.toLowerCase())}([^a-z0-9]|$)`, "i");
  for (const f of findings) {
    if (re.test(f)) return f;
  }
  return null;
}

function wasQueried(source: OsintSource, sourcesUsed: string[]): boolean {
  const host = source.url
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .toLowerCase();
  const candidates = [source.name.toLowerCase(), host].filter((c) => c.length >= 4);
  if (candidates.length === 0) return false;
  return sourcesUsed.some((u) => {
    const ul = u.toLowerCase().trim();
    if (ul.length < 3) return false;
    return candidates.some((c) => ul === c || ul.includes(c) || c.includes(ul));
  });
}

export function buildScanCoverage(
  type: string,
  _target: string,
  sourcesUsed: string[],
  findings: string[],
  hasHits: boolean
): ScanResult[] {
  return OSINT_SOURCES.map((src) => {
    const applies = (APPLICABLE[src.category] || []).includes(type);
    if (!applies) {
      return { name: src.name, category: src.category, status: "not_applicable" as ScanStatus };
    }

    const queried = wasQueried(src, sourcesUsed);
    if (queried) {
      const hit = hasHits ? findHitForSource(src.name, findings) : null;
      if (hit) return { name: src.name, category: src.category, status: "hit", evidence: hit };
      return { name: src.name, category: src.category, status: "clean" };
    }

    if (PAID_ONLY.has(src.name)) {
      return { name: src.name, category: src.category, status: "paid_only" };
    }
    return { name: src.name, category: src.category, status: "no_data" };
  });
}

export function summarizeCoverage(scan: ScanResult[]) {
  const counts = { hit: 0, clean: 0, scanned: 0, paid_only: 0, rate_limit: 0, no_data: 0, not_applicable: 0 };
  for (const s of scan) counts[s.status]++;
  const applicable = scan.length - counts.not_applicable;
  const completed = counts.hit + counts.clean + counts.scanned;
  return { ...counts, applicable, completed };
}
