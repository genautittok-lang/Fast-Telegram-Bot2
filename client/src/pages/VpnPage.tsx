import { useEffect, useState, type ReactNode } from "react";
import { Link } from "wouter";
import {
  Shield,
  Globe2,
  Zap,
  Lock,
  Copy,
  CheckCircle2,
  AlertCircle,
  Clock,
  Smartphone,
  Monitor,
  Apple,
  ExternalLink,
  RefreshCw,
  ChevronRight,
  Wifi,
  WifiOff,
  Star,
  Users,
} from "lucide-react";
import { Footer } from "@/components/Footer";
import { PublicHeader } from "@/components/PublicHeader";
import { AppSidebar } from "@/components/AppSidebar";
import { MobileMenu } from "@/components/MobileMenu";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface AppEntry {
  id: string;
  name: string;
  platforms: ("ios" | "android" | "windows" | "macos" | "linux")[];
  deepLink: string;
  storeUrl: string;
  recommended?: boolean;
}

interface VpnStatus {
  hasSubscription: boolean;
  isActive?: boolean;
  subscriptionUrl?: string;
  qrUrl?: string;
  apps?: AppEntry[];
  expiresAt?: string;
  uuid?: string;
  tier: string;
  deviceLimit: number;
  configured: boolean;
}

type Platform = "ios" | "android" | "windows" | "macos" | "linux" | "other";

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  if (/macintosh|mac os x/.test(ua)) return "macos";
  if (/windows/.test(ua)) return "windows";
  if (/linux/.test(ua)) return "linux";
  return "other";
}

const PLATFORM_LABELS: Record<Platform, string> = {
  ios: "iPhone / iPad",
  android: "Android",
  windows: "Windows",
  macos: "macOS",
  linux: "Linux",
  other: "All platforms",
};

const PLATFORM_ICONS: Record<Platform, typeof Smartphone> = {
  ios: Apple,
  android: Smartphone,
  windows: Monitor,
  macos: Apple,
  linux: Monitor,
  other: Globe2,
};

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.04] px-3 py-1.5 text-[12.5px] font-medium text-zinc-300 transition hover:border-cyan-500/40 hover:bg-cyan-500/[0.08] hover:text-cyan-300"
    >
      {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied!" : label}
    </button>
  );
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold ${
        isActive
          ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
          : "border border-rose-500/30 bg-rose-500/10 text-rose-400"
      }`}
    >
      {isActive ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

function ActiveDashboard({ vpn, onRefresh, isRefreshing }: { vpn: VpnStatus; onRefresh: () => void; isRefreshing: boolean }) {
  const expiresAt = vpn.expiresAt ? new Date(vpn.expiresAt) : null;
  const daysLeft = expiresAt ? Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / 86400000)) : null;
  const { data: devData } = useQuery<{ activeCount: number; deviceLimit: number }>({
    queryKey: ["/api/alor-vpn/devices"],
    refetchInterval: 30000,
  });
  const activeCount = devData?.activeCount ?? 0;
  const daysAccent = daysLeft === null ? "" : daysLeft <= 3 ? "text-amber-400" : daysLeft <= 7 ? "text-yellow-400" : "";
  const slotsAccent = activeCount >= vpn.deviceLimit ? "text-amber-400" : "";

  return (
    <div className="space-y-4">
      {/* Status bar */}
      <div className="rounded-2xl border border-white/10 bg-[#0D0D11] p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/[0.08]">
              <Shield className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <div className="text-[15px] font-semibold text-white">DarkShare VPN</div>
              <div className="text-[12px] text-zinc-500">
                <span className="rounded bg-cyan-500/10 px-1.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-cyan-400">{vpn.tier}</span>
                <span className="ml-2">Trojan Reality · 20+ countries · zero logs</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge isActive={vpn.isActive ?? false} />
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-zinc-400 transition hover:border-white/20 hover:text-white disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard icon={Users} label="Devices used" value={<span className={slotsAccent}>{activeCount} / {vpn.deviceLimit}</span>} />
          <StatCard icon={Clock} label="Days left" value={<span className={daysAccent}>{daysLeft !== null ? `${daysLeft}d` : "—"}</span>} />
          <StatCard icon={Globe2} label="Locations" value="20+" />
          <StatCard icon={Lock} label="Logs" value="zero" />
        </div>
      </div>

      {/* Subscription URL */}
      {vpn.subscriptionUrl && (
        <div className="rounded-2xl border border-white/10 bg-[#0D0D11] p-5 sm:p-6">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[14px] font-semibold text-white">Subscription Link</h3>
            <CopyButton text={vpn.subscriptionUrl} label="Copy link" />
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-black/40 px-4 py-3 font-mono text-[11.5px] text-zinc-500 break-all">
            {vpn.subscriptionUrl}
          </div>
          <p className="mt-3 text-[12px] text-zinc-500">
            Paste this link into your VPN app. Works with Happ, v2rayNG, Nekobox, Clash, Shadowrocket, and more.
          </p>
        </div>
      )}

      {/* QR + One-tap install */}
      <ConnectPanel vpn={vpn} />

      {/* Devices */}
      <DevicesPanel deviceLimit={vpn.deviceLimit} />
    </div>
  );
}

interface DeviceEntry {
  id: number;
  name: string;
  userAgent?: string;
  ipPrefix?: string;
  firstSeen?: string;
  lastSeen?: string;
  revoked: boolean;
}

function DevicesPanel({ deviceLimit }: { deviceLimit: number }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<{ devices: DeviceEntry[]; activeCount: number; deviceLimit: number; tier?: string; daysLeft?: number | null; expiresAt?: string | null }>({
    queryKey: ["/api/alor-vpn/devices"],
    refetchInterval: 30000,
  });
  const revoke = useMutation({
    mutationFn: async (id: number) => apiRequest("POST", `/api/alor-vpn/devices/${id}/revoke`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/alor-vpn/devices"] }),
  });

  const devices = data?.devices ?? [];
  const active = devices.filter((d) => !d.revoked);
  const slotsUsed = data?.activeCount ?? active.length;

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0D0D11] p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-[14px] font-semibold text-white">Connected devices</h3>
          <p className="mt-0.5 text-[12px] text-zinc-500">
            <span className={slotsUsed >= deviceLimit ? "text-amber-400" : "text-zinc-400"}>
              {slotsUsed} / {deviceLimit}
            </span>{" "}
            slots used · {data?.tier ? `DarkShare ${data.tier}` : "—"}
            {typeof data?.daysLeft === "number" && data.daysLeft > 0 ? (
              <span className={data.daysLeft <= 3 ? "ml-2 text-amber-400" : "ml-2 text-emerald-400"}>
                · {data.daysLeft} days left
              </span>
            ) : data?.expiresAt ? (
              <span className="ml-2 text-rose-400">· Expired</span>
            ) : null}
          </p>
        </div>
        <div className="text-[11px] text-zinc-600">
          A device = one app on one network. Re-import to claim a free slot.
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-white/[0.06] bg-black/20 p-6 text-center text-[12.5px] text-zinc-500">Loading…</div>
      ) : devices.length === 0 ? (
        <div className="rounded-xl border border-white/[0.06] bg-black/20 p-6 text-center text-[12.5px] text-zinc-500">
          No devices yet. Import the subscription in your VPN app — it appears here automatically.
        </div>
      ) : (
        <ul className="divide-y divide-white/[0.06] overflow-hidden rounded-xl border border-white/[0.06] bg-black/20">
          {devices.map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`inline-block h-2 w-2 rounded-full ${d.revoked ? "bg-zinc-600" : "bg-emerald-400"}`} />
                  <span className="truncate text-[13.5px] font-medium text-white">{d.name}</span>
                  {d.revoked && <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-zinc-500">Revoked</span>}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-[11.5px] text-zinc-500">
                  {d.ipPrefix && <span className="font-mono">{d.ipPrefix}.x</span>}
                  {d.lastSeen && <span>Last seen {new Date(d.lastSeen).toLocaleString()}</span>}
                </div>
              </div>
              {!d.revoked && (
                <button
                  onClick={() => revoke.mutate(d.id)}
                  disabled={revoke.isPending}
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/[0.06] px-3 py-1.5 text-[12px] font-medium text-rose-300 transition hover:border-rose-400 hover:bg-rose-500/[0.12] disabled:opacity-50"
                >
                  Revoke
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ConnectPanel({ vpn }: { vpn: VpnStatus }) {
  const [platform, setPlatform] = useState<Platform>("other");
  useEffect(() => { setPlatform(detectPlatform()); }, []);

  const allPlatforms: Platform[] = ["ios", "android", "windows", "macos", "linux"];
  // When platform detection fails, default to a sensible tab without misleading the user.
  // Most desktop unknowns are Windows; mobile UA always matches above. Show all-platform Happ first.
  const visiblePlatform: Platform = platform === "other" ? "windows" : platform;

  const apps = vpn.apps ?? [];
  const filteredApps = apps.filter((a) => a.platforms.includes(visiblePlatform as any));
  const sortedApps = [...filteredApps].sort((a, b) => Number(!!b.recommended) - Number(!!a.recommended));

  return (
    <div className="space-y-4">
      {/* QR card */}
      {vpn.qrUrl && (
        <div className="rounded-2xl border border-white/10 bg-[#0D0D11] p-5 sm:p-6">
          <h3 className="mb-4 text-[14px] font-semibold text-white">Scan QR with your VPN app</h3>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <div className="rounded-2xl border border-white/10 bg-white p-3">
              <img src={vpn.qrUrl} alt="Subscription QR" className="h-44 w-44 sm:h-52 sm:w-52" />
            </div>
            <div className="flex-1 space-y-2 text-[13px] text-zinc-400">
              <p className="text-white font-medium">Fastest way to connect:</p>
              <ol className="space-y-1.5">
                <Step n={1}>Install a VPN app for your platform (buttons below).</Step>
                <Step n={2}>Open the app and tap <b>«Add subscription»</b> / scan QR.</Step>
                <Step n={3}>Choose any server and tap <b>Connect</b>.</Step>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* Platform tabs + one-tap buttons */}
      <div className="rounded-2xl border border-white/10 bg-[#0D0D11] p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-[14px] font-semibold text-white">One-tap install</h3>
          <span className="text-[11px] text-zinc-500">Detected: {PLATFORM_LABELS[platform]}</span>
        </div>

        {/* Platform tabs */}
        <div className="mb-4 flex flex-wrap gap-1.5">
          {allPlatforms.map((p) => {
            const Icon = PLATFORM_ICONS[p];
            const active = visiblePlatform === p;
            return (
              <button
                key={p}
                onClick={() => setPlatform(p)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-medium transition ${
                  active
                    ? "border-cyan-500/40 bg-cyan-500/[0.08] text-cyan-300"
                    : "border-white/10 bg-white/[0.02] text-zinc-400 hover:border-white/20 hover:text-white"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {PLATFORM_LABELS[p]}
              </button>
            );
          })}
        </div>

        {/* App cards with one-tap deep link */}
        <div className="grid gap-2.5 sm:grid-cols-2">
          {sortedApps.map((a) => (
            <div key={a.id} className="flex flex-col gap-2 rounded-xl border border-white/[0.06] bg-black/30 p-3.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[13.5px] font-semibold text-white">{a.name}</span>
                  {a.recommended && (
                    <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-300">
                      <Star className="h-2.5 w-2.5" /> Pick
                    </span>
                  )}
                </div>
                <a
                  href={a.storeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11.5px] text-zinc-500 hover:text-white"
                >
                  Get app <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <a
                href={a.deepLink}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-[12.5px] font-semibold text-black shadow-[0_0_12px_rgba(6,182,212,0.25)] transition hover:bg-cyan-400"
              >
                <Zap className="h-3.5 w-3.5" />
                Open in {a.name}
              </a>
            </div>
          ))}
          {sortedApps.length === 0 && (
            <div className="col-span-2 rounded-xl border border-white/[0.06] bg-black/20 p-4 text-center text-[12.5px] text-zinc-500">
              No apps for this platform yet — use the Subscription Link above with any V2Ray-compatible client.
            </div>
          )}
        </div>

        <p className="mt-4 text-[11.5px] text-zinc-600">
          Tip: tap <b>Get app</b> first if you don't have the client installed, then return and tap <b>Open in …</b> — the subscription imports automatically.
        </p>
      </div>
    </div>
  );
}

function Step({ n, children }: { n: number; children: ReactNode }) {
  return (
    <li className="flex gap-2.5">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-cyan-500/30 bg-cyan-500/[0.06] text-[10px] font-bold text-cyan-400">
        {n}
      </span>
      <span className="text-[12.5px] text-zinc-400">{children}</span>
    </li>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-black/20 px-4 py-3">
      <div className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-wider text-zinc-600">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className="mt-1 text-[14px] font-semibold text-white">{value}</div>
    </div>
  );
}

function ProvisionPanel({ tier, onProvision, isLoading }: { tier: string; onProvision: () => void; isLoading: boolean }) {
  return (
    <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-b from-cyan-950/20 to-[#0D0D11] p-6 sm:p-8 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.08]">
        <Shield className="h-7 w-7 text-cyan-400" />
      </div>
      <h2 className="text-[20px] font-bold text-white">Activate DarkShare VPN</h2>
      <p className="mt-2 text-[13.5px] text-zinc-400">
        Your <span className="font-semibold text-white">{tier}</span> plan includes VPN access. Click below to activate your subscription.
      </p>
      <button
        onClick={onProvision}
        disabled={isLoading}
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-6 py-3 text-[14px] font-semibold text-black shadow-[0_0_20px_rgba(6,182,212,0.3)] transition hover:bg-cyan-400 disabled:opacity-60"
      >
        {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
        {isLoading ? "Activating…" : "Activate VPN"}
      </button>
    </div>
  );
}

function UpgradePanel() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
          <Lock className="h-7 w-7 text-zinc-400" />
        </div>
        <h2 className="text-[22px] font-bold text-white">DarkShare VPN</h2>
        <p className="mt-2 text-[14px] text-zinc-400">Available on PRO and ENTERPRISE plans</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <PlanCard
          name="PRO VPN"
          tier="PRO"
          price="$9"
          period="/mo"
          devices={2}
          features={["2 devices", "Multiple locations", "Standard speed", "Auto-activation", "Web + Telegram"]}
        />
        <PlanCard
          name="ENTERPRISE VPN"
          tier="ENTERPRISE"
          price="$29"
          period="/mo"
          devices={5}
          features={["5 devices", "All locations", "Maximum speed", "Priority servers", "Auto-activation"]}
          highlight
        />
        <PlanCard
          name="GROUPS VPN"
          tier="GROUPS"
          price="$55"
          period="/mo"
          devices={5}
          features={["5 devices", "All locations", "Team management", "Priority support", "Shared billing"]}
        />
      </div>
    </div>
  );
}

function PlanCard({
  name,
  tier,
  price,
  period,
  devices,
  features,
  highlight,
}: {
  name: string;
  tier: string;
  price: string;
  period: string;
  devices: number;
  features: string[];
  highlight?: boolean;
}) {
  return (
    <div
      className={`relative rounded-2xl border p-5 ${
        highlight
          ? "border-cyan-500/30 bg-gradient-to-b from-cyan-950/20 to-[#0D0D11]"
          : "border-white/10 bg-[#0D0D11]"
      }`}
    >
      {highlight && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[10.5px] font-semibold uppercase tracking-wider text-cyan-400">
            <Star className="h-3 w-3" /> Recommended
          </span>
        </div>
      )}
      <div className="mb-3">
        <div className="text-[13px] font-medium text-zinc-400">{name}</div>
        <div className="flex items-baseline gap-1">
          <span className="text-[32px] font-bold text-white">{price}</span>
          <span className="text-[13px] text-zinc-500">{period}</span>
        </div>
      </div>
      <div className="mb-4 flex items-center gap-1.5">
        <Users className="h-3.5 w-3.5 text-zinc-500" />
        <span className="text-[12.5px] text-zinc-400">Up to {devices} devices</span>
      </div>
      <ul className="mb-5 space-y-1.5">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-[12.5px] text-zinc-400">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
            {f}
          </li>
        ))}
      </ul>
      <Link href={`/pricing?plan=${tier}`}>
        <span
          className={`block w-full rounded-xl py-2.5 text-center text-[13px] font-semibold transition cursor-pointer ${
            highlight
              ? "bg-cyan-500 text-black shadow-[0_0_16px_rgba(6,182,212,0.25)] hover:bg-cyan-400"
              : "border border-white/15 bg-white/[0.03] text-white hover:bg-white/[0.07]"
          }`}
        >
          Get {tier} <ChevronRight className="inline h-3.5 w-3.5" />
        </span>
      </Link>
    </div>
  );
}

function VpnContent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { data: vpn, isLoading } = useQuery<VpnStatus>({
    queryKey: ["/api/alor-vpn/status"],
    enabled: !!user,
    refetchInterval: 60000,
  });

  const provisionMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/alor-vpn/provision"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alor-vpn/status"] });
      setError(null);
    },
    onError: (err: any) => {
      setError(err?.message || "Failed to activate VPN. Please try again.");
    },
  });

  const refreshMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/alor-vpn/refresh"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alor-vpn/status"] });
    },
  });

  if (!user) return null;

  const tier = (user as any).tier?.toUpperCase() || "FREE";
  const isPro = ["PRO", "ENTERPRISE", "GROUPS"].includes(tier);

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-zinc-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-7">
        <div className="flex items-center gap-2 text-[12px] text-zinc-500">
          <Shield className="h-3.5 w-3.5" />
          DarkShare Secure Network
        </div>
        <h1 className="mt-1 text-[28px] font-bold tracking-tight text-white sm:text-[34px]">
          DarkShare VPN
        </h1>
        <p className="mt-1.5 text-[14px] text-zinc-400">
          Encrypted tunnel powered by Trojan Reality · Zero logs · Multiple locations
        </p>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/[0.06] px-4 py-3 text-[13px] text-rose-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {!isPro ? (
        <UpgradePanel />
      ) : vpn?.hasSubscription ? (
        <ActiveDashboard
          vpn={vpn}
          onRefresh={() => refreshMutation.mutate()}
          isRefreshing={refreshMutation.isPending}
        />
      ) : (
        <ProvisionPanel
          tier={tier}
          onProvision={() => provisionMutation.mutate()}
          isLoading={provisionMutation.isPending}
        />
      )}
    </div>
  );
}

function PublicVpnLanding() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <PublicHeader />
      <section className="px-4 pt-20 pb-12 sm:px-6 sm:pt-28">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/[0.05] px-3 py-1 text-[12px] text-cyan-400">
            <Shield className="h-3 w-3" /> DarkShare Secure Network
          </div>
          <h1 className="mt-5 text-[40px] font-bold leading-[1.05] tracking-tight text-white sm:text-[56px]">
            DarkShare
            <br />
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">VPN</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-zinc-400">
            Military-grade encryption built into your DarkShare plan. Zero logs, multiple global locations, works on all your devices.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link href="/pricing">
              <span className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl bg-cyan-500 px-5 text-[14px] font-semibold text-black shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:bg-cyan-400">
                <Zap className="h-4 w-4" /> Get PRO with VPN
              </span>
            </Link>
            <Link href="/login">
              <span className="inline-flex h-11 cursor-pointer items-center rounded-xl border border-white/15 px-5 text-[14px] font-medium text-white hover:bg-white/[0.04]">
                Sign in
              </span>
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 pb-12 sm:px-6">
        <div className="mx-auto grid max-w-4xl gap-3 sm:grid-cols-3">
          {[
            { icon: Lock, title: "Zero logs", text: "We never store your browsing activity or connection logs." },
            { icon: Globe2, title: "Multiple locations", text: "Connect from various countries for privacy and access." },
            { icon: Zap, title: "Trojan Reality", text: "Advanced protocol that bypasses DPI and censorship." },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-white/10 bg-[#0D0D11] p-5">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/[0.06]">
                <Icon className="h-4.5 w-4.5 text-cyan-400" />
              </div>
              <div className="text-[14px] font-semibold text-white">{title}</div>
              <div className="mt-1 text-[12.5px] text-zinc-500">{text}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 pb-16 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-6 text-center text-[22px] font-bold text-white">Plans with VPN</h2>
          <div className="grid gap-4 sm:grid-cols-2 max-w-2xl mx-auto">
            <PlanCard
              name="PRO VPN"
              tier="PRO"
              price="$9"
              period="/mo"
              devices={2}
              features={["2 devices", "Multiple locations", "Standard speed", "Auto-activation"]}
            />
            <PlanCard
              name="ENTERPRISE VPN"
              tier="ENTERPRISE"
              price="$29"
              period="/mo"
              devices={5}
              features={["5 devices", "All locations", "Max speed", "Priority servers"]}
              highlight
            />
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}

function applyVpnSeo() {
  const title = "DarkShare VPN — Secure, Zero-Log, Trojan Reality Network";
  const desc = "Military-grade VPN built into your DarkShare plan. Trojan Reality protocol bypasses DPI and censorship. Zero logs, 20+ server locations, works on iOS, Android, Windows, macOS, Linux. Activate in 30 seconds.";
  const canonical = "https://www.darkshare.store/vpn";
  const image = "https://www.darkshare.store/og-image.png";

  document.title = title;

  const setMeta = (selector: string, attr: "name" | "property", key: string, value: string) => {
    let el = document.head.querySelector<HTMLMetaElement>(selector);
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute(attr, key);
      document.head.appendChild(el);
    }
    el.setAttribute("content", value);
  };
  setMeta('meta[name="description"]', "name", "description", desc);
  setMeta('meta[name="keywords"]', "name", "keywords", "DarkShare VPN, Trojan Reality VPN, zero-log VPN, DPI bypass, censorship bypass, OSINT VPN, secure VPN subscription, V2Ray, sing-box, Happ, Shadowrocket, v2rayNG, Hiddify, Clash Verge");
  setMeta('meta[property="og:title"]', "property", "og:title", title);
  setMeta('meta[property="og:description"]', "property", "og:description", desc);
  setMeta('meta[property="og:url"]', "property", "og:url", canonical);
  setMeta('meta[property="og:image"]', "property", "og:image", image);
  setMeta('meta[property="og:type"]', "property", "og:type", "website");
  setMeta('meta[name="twitter:card"]', "name", "twitter:card", "summary_large_image");
  setMeta('meta[name="twitter:title"]', "name", "twitter:title", title);
  setMeta('meta[name="twitter:description"]', "name", "twitter:description", desc);
  setMeta('meta[name="twitter:image"]', "name", "twitter:image", image);

  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", canonical);

  // JSON-LD: Product + FAQ for rich SERP
  const ldId = "darkshare-vpn-jsonld";
  document.getElementById(ldId)?.remove();
  const ld = document.createElement("script");
  ld.id = ldId;
  ld.type = "application/ld+json";
  ld.text = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        name: "DarkShare VPN",
        description: desc,
        brand: { "@type": "Brand", name: "DarkShare" },
        url: canonical,
        image,
        offers: [
          { "@type": "Offer", name: "PRO", price: "9", priceCurrency: "USD", url: "https://www.darkshare.store/pricing?plan=PRO" },
          { "@type": "Offer", name: "ENTERPRISE", price: "29", priceCurrency: "USD", url: "https://www.darkshare.store/pricing?plan=ENTERPRISE" },
          { "@type": "Offer", name: "GROUPS", price: "55", priceCurrency: "USD", url: "https://www.darkshare.store/pricing?plan=GROUPS" },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          { "@type": "Question", name: "What protocol does DarkShare VPN use?", acceptedAnswer: { "@type": "Answer", text: "Trojan Reality — a modern protocol that disguises VPN traffic as regular HTTPS, bypassing DPI and censorship in restrictive networks." } },
          { "@type": "Question", name: "Does DarkShare VPN keep logs?", acceptedAnswer: { "@type": "Answer", text: "No. We do not log browsing activity or connection metadata. Your traffic stays private." } },
          { "@type": "Question", name: "Which apps work with DarkShare VPN?", acceptedAnswer: { "@type": "Answer", text: "Any V2Ray-compatible client: Happ (recommended), Shadowrocket, v2rayNG, Hiddify, Clash Verge, Streisand, FoXray, NekoBox, v2rayN." } },
          { "@type": "Question", name: "How many devices can I connect?", acceptedAnswer: { "@type": "Answer", text: "PRO supports 2 devices; ENTERPRISE and GROUPS support 5 devices each." } },
          { "@type": "Question", name: "How many countries are available?", acceptedAnswer: { "@type": "Answer", text: "PRO unlocks 7 countries (Germany, Netherlands, Finland, France, Poland, Ukraine, USA). ENTERPRISE and GROUPS unlock 20+ global locations." } },
        ],
      },
    ],
  });
  document.head.appendChild(ld);
}

export default function VpnPage() {
  const { isAuthenticated, isLoading, user, logout } = useAuth();

  useEffect(() => {
    applyVpnSeo();
    const prev = document.body.style.backgroundColor;
    document.body.style.backgroundColor = "#0A0A0A";
    return () => { document.body.style.backgroundColor = prev; };
  }, []);

  if (isLoading) return <div className="min-h-screen bg-[#0A0A0A]" />;

  if (!isAuthenticated) return <PublicVpnLanding />;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white antialiased flex overflow-hidden max-w-full">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-white/[0.08] bg-[#0A0A0A]/92 backdrop-blur-xl sticky top-0 z-40 min-h-[52px]">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_10px_rgba(6,182,212,0.30)]">
              <Shield className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-sm tracking-tight">DarkShare VPN</span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher variant="minimal" />
            <MobileMenu isAuthenticated={true} username={(user as any)?.username} tier={(user as any)?.tier} onLogout={logout} />
          </div>
        </div>
        <main className="flex-1 overflow-y-auto pb-28 lg:pb-0">
          <VpnContent />
          <Footer />
        </main>
      </div>
    </div>
  );
}
