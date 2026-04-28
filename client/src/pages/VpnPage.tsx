import { useEffect } from "react";
import { Link } from "wouter";
import {
  Shield,
  Globe2,
  ArrowUpRight,
  CheckCircle2,
  Star,
  Lock,
  Eye,
  EyeOff,
  Award,
  Apple,
  Download,
  Info,
} from "lucide-react";
import { Footer } from "@/components/Footer";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

interface VpnEntry {
  slug: string;
  name: string;
  url: string;
  jurisdiction: string;
  freeAllowance: string;
  servers: string;
  noLog: "audited" | "claimed" | "partial";
  signup: "no" | "email" | "account";
  highlight?: string;
  best?: boolean;
  note: string;
  platforms: string[];
}

const VPNS: VpnEntry[] = [
  {
    slug: "cloudflare-warp",
    name: "Cloudflare WARP (1.1.1.1)",
    url: "https://one.one.one.one/",
    jurisdiction: "USA · Cloudflare",
    freeAllowance: "Unlimited",
    servers: "Global anycast",
    noLog: "claimed",
    signup: "no",
    best: true,
    highlight: "No signup · unlimited · fastest",
    note: "Encrypts DNS + traffic to the nearest Cloudflare edge. Not a classic VPN (does not change country), but the easiest honest privacy upgrade — zero registration, zero limits.",
    platforms: ["iOS", "Android", "macOS", "Windows", "Linux"],
  },
  {
    slug: "protonvpn-free",
    name: "ProtonVPN Free",
    url: "https://protonvpn.com/free-vpn/",
    jurisdiction: "Switzerland",
    freeAllowance: "Unlimited traffic",
    servers: "USA · NL · JP",
    noLog: "audited",
    signup: "email",
    highlight: "No bandwidth limit",
    note: "Operated by the Proton Mail team. Independently audited no-log policy, open-source apps, strong Swiss privacy law. Free tier has 3 countries and one device at a time.",
    platforms: ["iOS", "Android", "macOS", "Windows", "Linux"],
  },
  {
    slug: "windscribe-free",
    name: "Windscribe Free",
    url: "https://windscribe.com/",
    jurisdiction: "Canada",
    freeAllowance: "10 GB / month",
    servers: "11 countries",
    noLog: "claimed",
    signup: "email",
    highlight: "Built-in adblock & firewall",
    note: "10 GB free per month with email signup, 15 GB if you tweet about them. Includes R.O.B.E.R.T. — DNS-level malware/ad blocker. Apps for every platform.",
    platforms: ["iOS", "Android", "macOS", "Windows", "Linux", "Browsers"],
  },
  {
    slug: "hide-me-free",
    name: "hide.me Free",
    url: "https://hide.me/en/free-vpn",
    jurisdiction: "Malaysia",
    freeAllowance: "10 GB / month",
    servers: "8 countries",
    noLog: "audited",
    signup: "no",
    highlight: "Free tier without account",
    note: "Audited no-log policy. Their browser-based free tier can be used without creating an account, which is rare. WireGuard supported in the desktop app.",
    platforms: ["iOS", "Android", "macOS", "Windows", "Linux"],
  },
  {
    slug: "riseup-vpn",
    name: "Riseup VPN",
    url: "https://riseup.net/en/vpn",
    jurisdiction: "USA · activist non-profit",
    freeAllowance: "Unlimited",
    servers: "Multi-region",
    noLog: "claimed",
    signup: "no",
    highlight: "No account · open source",
    note: "Free, donation-funded VPN run by the Riseup activist collective. No personal data required. Built on the Bitmask client — open source.",
    platforms: ["Android", "macOS", "Windows", "Linux"],
  },
];

const NOLOG_LABEL: Record<VpnEntry["noLog"], { text: string; cls: string; Icon: typeof EyeOff }> = {
  audited: { text: "Audited no-log", cls: "text-cyan-300", Icon: EyeOff },
  claimed: { text: "Claimed no-log", cls: "text-amber-300", Icon: Eye },
  partial: { text: "Partial logs", cls: "text-rose-300", Icon: Eye },
};

const SIGNUP_LABEL: Record<VpnEntry["signup"], string> = {
  no: "No signup",
  email: "Email only",
  account: "Account required",
};

function TopBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-[#0A0A0A]/90 backdrop-blur supports-[backdrop-filter]:bg-[#0A0A0A]/70">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/">
          <span className="inline-flex cursor-pointer items-center gap-2 text-white">
            <span className="grid h-7 w-7 place-items-center rounded-md border border-cyan-500/20 bg-cyan-500/[0.08]">
              <Shield className="h-3.5 w-3.5 text-cyan-300" />
            </span>
            <span className="text-[15px] font-semibold tracking-tight">DarkShare</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-6 text-[13.5px] text-zinc-300 md:flex">
          <Link href="/"><span className="cursor-pointer hover:text-white">Home</span></Link>
          <Link href="/pricing"><span className="cursor-pointer hover:text-white">Pricing</span></Link>
          <Link href="/guide"><span className="cursor-pointer hover:text-white">Guide</span></Link>
        </nav>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <Link href="/dashboard">
            <span className="inline-flex h-8 cursor-pointer items-center rounded-lg border border-white/15 bg-transparent px-3 text-[12.5px] font-medium text-white hover:bg-white/5">
              Dashboard
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="px-4 pt-12 pb-8 sm:px-6 sm:pt-16">
      <div className="mx-auto max-w-3xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[12px] text-zinc-400">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Honest review · No affiliate links · Updated 2026
        </div>
        <h1 className="mt-5 text-[40px] font-semibold leading-[1.05] tracking-tight text-white sm:text-[52px]" data-testid="text-hero-title">
          Free VPN that actually
          <br />respects your privacy.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-zinc-400">
          We didn&rsquo;t build a paid VPN to upsell you. Below are 5 services we actually trust —
          chosen for audited no-log policy, real free tier, and no dark patterns.
        </p>
      </div>
    </section>
  );
}

function PromiseStrip() {
  const items = [
    { Icon: Award,     title: "No affiliate fees",  text: "Nothing on this page pays us a commission." },
    { Icon: Shield,    title: "Real no-log audits", text: "We label exactly what was independently audited." },
    { Icon: EyeOff,    title: "Plain-English caveats", text: "If a free tier has a catch, we say so." },
  ];
  return (
    <section className="px-4 pb-8 sm:px-6">
      <div className="mx-auto grid max-w-5xl gap-3 sm:grid-cols-3">
        {items.map(({ Icon, title, text }) => (
          <div key={title} className="rounded-xl border border-white/10 bg-[#0E0E12] p-4">
            <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-500/20 bg-cyan-500/[0.06]">
              <Icon className="h-4 w-4 text-cyan-300" />
            </div>
            <div className="text-[13.5px] font-medium text-white">{title}</div>
            <div className="mt-0.5 text-[12.5px] text-zinc-500">{text}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function VpnCard({ vpn }: { vpn: VpnEntry }) {
  const NL = NOLOG_LABEL[vpn.noLog];
  return (
    <div
      className={`rounded-2xl border ${vpn.best ? "border-cyan-500/30" : "border-white/10"} bg-[#0E0E12] p-5 sm:p-6`}
      data-testid={`card-vpn-${vpn.slug}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-[18px] font-semibold text-white tracking-tight">{vpn.name}</h3>
            {vpn.best && (
              <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/30 bg-cyan-500/[0.08] px-2 py-0.5 text-[10.5px] font-medium uppercase tracking-wider text-cyan-300">
                <Star className="h-3 w-3" /> Top pick
              </span>
            )}
          </div>
          {vpn.highlight && (
            <div className="mt-1 text-[12.5px] text-zinc-400">{vpn.highlight}</div>
          )}
        </div>
        <a
          href={vpn.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-white px-3.5 text-[13px] font-medium text-black hover:bg-zinc-200"
          data-testid={`link-vpn-visit-${vpn.slug}`}
        >
          Visit site <ArrowUpRight className="h-3.5 w-3.5" />
        </a>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
        <Spec label="Jurisdiction" value={vpn.jurisdiction} Icon={Globe2} />
        <Spec label="Free tier" value={vpn.freeAllowance} Icon={CheckCircle2} />
        <Spec label="Servers" value={vpn.servers} Icon={Globe2} />
        <Spec label="Signup" value={SIGNUP_LABEL[vpn.signup]} Icon={Lock} />
      </div>

      <div className="mt-4 flex items-center gap-2 text-[12.5px]">
        <NL.Icon className={`h-3.5 w-3.5 ${NL.cls}`} />
        <span className={NL.cls}>{NL.text}</span>
      </div>

      <p className="mt-3 text-[13.5px] leading-relaxed text-zinc-300">{vpn.note}</p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {vpn.platforms.map((p) => (
          <span
            key={p}
            className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-[11px] text-zinc-400"
          >
            {p === "iOS" || p === "macOS" ? <Apple className="h-3 w-3" /> : <Download className="h-3 w-3" />}
            {p}
          </span>
        ))}
      </div>
    </div>
  );
}

function Spec({ label, value, Icon }: { label: string; value: string; Icon: typeof Globe2 }) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1 text-[10.5px] uppercase tracking-wider text-zinc-500">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div className="mt-0.5 truncate text-[13px] text-white" title={value}>{value}</div>
    </div>
  );
}

function VpnList() {
  return (
    <section className="px-4 pb-12 sm:px-6">
      <div className="mx-auto max-w-3xl space-y-4">
        {VPNS.map((v) => <VpnCard key={v.slug} vpn={v} />)}
      </div>
    </section>
  );
}

function HowToChoose() {
  const rows = [
    { q: "Do you mostly want privacy from your ISP / public Wi-Fi?", a: "Cloudflare WARP — install once, forget about it." },
    { q: "Do you need to look like you&rsquo;re in another country?",   a: "ProtonVPN Free — 3 countries, unlimited bandwidth." },
    { q: "Do you torrent or stream often?",                              a: "Windscribe Free 10 GB or hide.me 10 GB — both allow P2P." },
    { q: "Do you want zero account, zero email?",                       a: "Cloudflare WARP, hide.me Free, or Riseup." },
    { q: "Do you want the strongest legal protection?",                 a: "ProtonVPN (Switzerland) or Mullvad (paid, Sweden)." },
  ];
  return (
    <section className="px-4 pb-16 sm:px-6">
      <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-[#0E0E12] p-6 sm:p-8">
        <h2 className="text-[22px] font-semibold tracking-tight text-white">How to choose</h2>
        <p className="mt-1 text-[13.5px] text-zinc-500">Four short questions. Pick the one that matches you.</p>

        <div className="mt-5 divide-y divide-white/5">
          {rows.map((r, i) => (
            <div key={i} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:gap-6">
              <div
                className="flex-1 text-[13.5px] text-zinc-300"
                dangerouslySetInnerHTML={{ __html: r.q }}
              />
              <div
                className="text-[13.5px] font-medium text-white sm:text-right"
                dangerouslySetInnerHTML={{ __html: r.a }}
              />
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-[12.5px] text-zinc-400">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
          <div>
            <span className="text-white">Reality check:</span> a VPN is not anonymity. It hides your IP from
            websites and your activity from your ISP — but the VPN provider still sees the metadata. That&rsquo;s
            why &ldquo;no-log&rdquo; matters, and why we ranked audits above slogans.
          </div>
        </div>
      </div>
    </section>
  );
}

function CTABottom() {
  return (
    <section className="px-4 pb-20 sm:px-6">
      <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-[#0E0E12] p-6 sm:p-8 text-center">
        <h3 className="text-[22px] font-semibold tracking-tight text-white">
          A free VPN is step one. Step two: check what&rsquo;s already leaked.
        </h3>
        <p className="mx-auto mt-2 max-w-xl text-[13.5px] text-zinc-400">
          Run an OSINT scan on your email, phone, username or wallet across 150+ sources.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <Link href="/">
            <span className="inline-flex h-10 cursor-pointer items-center rounded-lg bg-white px-4 text-[13.5px] font-medium text-black hover:bg-zinc-200" data-testid="link-cta-check">
              Run a free check
            </span>
          </Link>
          <Link href="/pricing">
            <span className="inline-flex h-10 cursor-pointer items-center rounded-lg border border-white/15 bg-transparent px-4 text-[13.5px] font-medium text-white hover:bg-white/5" data-testid="link-cta-pricing">
              Pricing
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function VpnPage() {
  useEffect(() => {
    document.title = "Free VPN — honest 2026 guide | DarkShare";
    const prevBg = document.body.style.backgroundColor;
    document.body.style.backgroundColor = "#0A0A0A";
    return () => { document.body.style.backgroundColor = prevBg; };
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white antialiased">
      <TopBar />
      <Hero />
      <PromiseStrip />
      <VpnList />
      <HowToChoose />
      <CTABottom />
      <Footer />
    </div>
  );
}
