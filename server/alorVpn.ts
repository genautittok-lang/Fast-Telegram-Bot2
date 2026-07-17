const ALOR_BASE = "https://sub.alorvpn.fun";

function getApiKey(): string {
  return process.env.ALOR_VPN_API_KEY || "";
}

function headers() {
  return {
    "X-API-Key": getApiKey(),
    "Content-Type": "application/json",
  };
}

export interface AlorSubscription {
  ok: boolean;
  token: string;
  uuid: string;
  subscription_url: string;
  expires_at: string;
  plan_days: number;
  vless_links?: string[];
}

export interface AlorStatusResult {
  ok: boolean;
  token: string;
  uuid: string;
  is_active: boolean;
  expires_at: string;
  created_at: string;
  vless_links?: string[];
}

export interface AlorToggleResult {
  ok: boolean;
  token: string;
  is_active: boolean;
}

export async function createAlorSubscription(planDays: number = 30): Promise<AlorSubscription> {
  const res = await fetch(`${ALOR_BASE}/api/v1/external/subscription/create`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ plan_days: planDays }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`AlorVPN create failed: ${res.status} ${text}`);
  }
  return res.json();
}

export async function getAlorStatus(token: string): Promise<AlorStatusResult> {
  const res = await fetch(`${ALOR_BASE}/api/v1/external/subscription/status`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ token }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`AlorVPN status failed: ${res.status} ${text}`);
  }
  return res.json();
}

export async function toggleAlorSubscription(token: string, isActive: boolean): Promise<AlorToggleResult> {
  const res = await fetch(`${ALOR_BASE}/api/v1/external/subscription/toggle`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ token, is_active: isActive ? 1 : 0 }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`AlorVPN toggle failed: ${res.status} ${text}`);
  }
  return res.json();
}

// The user's PUBLIC token (alorVpnToken, used in their /vpn/sub/<token> URL) stays
// stable forever. When we rotate the upstream subscription (AlorVPN has no "extend"
// API — only create/status/toggle), the CURRENT upstream token lives inside
// alorVpnSubscriptionUrl. Always use this helper for upstream status/toggle calls.
export function upstreamAlorToken(user: any): string | null {
  const url: string | undefined = user?.alorVpnSubscriptionUrl;
  if (url) {
    const m = String(url).match(/\/sub\/([^/?#]+)/);
    if (m) {
      try { return decodeURIComponent(m[1]); } catch { return m[1]; }
    }
  }
  return user?.alorVpnToken || null;
}

export function isAlorConfigured(): boolean {
  const key = getApiKey();
  return Boolean(key && key.length > 10);
}

export function vpnDeviceLimit(tier: string): number {
  const t = tier.toUpperCase();
  if (t === "ENTERPRISE" || t === "GROUPS") return 5;
  if (t === "PRO") return 2;
  return 0;
}

export function vpnPlanDays(period: string): number {
  return period === "yearly" ? 365 : 30;
}
