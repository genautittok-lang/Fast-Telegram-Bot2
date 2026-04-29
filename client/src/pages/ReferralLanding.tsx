import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import {
  Shield,
  Gift,
  CheckCircle2,
  ArrowRight,
  Search,
  Lock,
  Sparkles,
  Globe,
} from "lucide-react";
import { SiTelegram } from "react-icons/si";

const PERKS = [
  { Icon: Gift,    title: "+5 free scans",        sub: "Stacked on top of the daily 3" },
  { Icon: Shield,  title: "Full source coverage", sub: "Same 150+ OSINT sources as PRO" },
  { Icon: Lock,    title: "PDF reports",          sub: "Sharable, signed, watermark-free" },
  { Icon: Sparkles,title: "AI threat profile",    sub: "One generated automatically" },
];

export default function ReferralLanding() {
  const { code } = useParams<{ code: string }>();
  const [countdown, setCountdown] = useState(8);
  const [autoRedirect, setAutoRedirect] = useState(true);

  const botUsername = "DarkShare1Bot";
  const telegramDeepLink = `https://t.me/${botUsername}?start=ref_${code}`;

  useEffect(() => {
    if (!autoRedirect) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.href = telegramDeepLink;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [autoRedirect, telegramDeepLink]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0A0A0A] text-white">
      {/* background */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-x-0 top-0 h-[640px]"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(34,211,238,0.12), transparent 65%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            maskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black 0%, transparent 70%)",
            WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black 0%, transparent 70%)",
          }}
        />
      </div>

      {/* top bar */}
      <header className="relative border-b border-white/5">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <Link href="/">
            <span className="inline-flex cursor-pointer items-center gap-2" data-testid="link-logo">
              <span className="grid h-8 w-8 place-items-center rounded-lg border border-cyan-500/30 bg-cyan-500/10">
                <Shield className="h-4 w-4 text-cyan-300" />
              </span>
              <span className="text-[15px] font-semibold tracking-tight">DarkShare</span>
            </span>
          </Link>
          <div className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[12px] text-zinc-400 sm:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Live · 150+ OSINT sources
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-5xl px-5 py-16 sm:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_minmax(0,460px)] lg:gap-16">
          {/* LEFT — message */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/[0.06] px-3 py-1 text-[12px] text-cyan-300">
              <Gift className="h-3.5 w-3.5" /> A friend invited you
            </div>

            <h1 className="mt-6 text-balance text-[40px] font-semibold leading-[1.05] tracking-tight sm:text-[52px]" data-testid="text-hero-title">
              Your invite unlocks a <span className="text-cyan-300">free PRO trial</span>.
            </h1>

            <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-zinc-400 sm:text-[16px]">
              Use this code in the Telegram bot to instantly add bonus scans, full source coverage,
              and a PDF report — no card, no subscription, no upsell loop.
            </p>

            <div className="mt-7 inline-flex items-center gap-3 rounded-xl border border-white/10 bg-[#0E0E12] p-3 pl-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Code</div>
              <div className="font-mono text-[18px] font-semibold tracking-wide text-cyan-300" data-testid="text-ref-code">
                {code}
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href={telegramDeepLink}
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-white px-5 text-[14px] font-medium text-black transition-colors hover:bg-zinc-200"
                data-testid="button-open-telegram"
              >
                <SiTelegram className="h-4 w-4" /> Claim in Telegram
                <ArrowRight className="h-4 w-4" />
              </a>
              <Link href="/">
                <span className="inline-flex h-12 cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-5 text-[14px] font-medium text-zinc-200 transition-colors hover:border-white/20" data-testid="link-try-web">
                  <Search className="h-4 w-4" /> Try the web scanner first
                </span>
              </Link>
            </div>

            {autoRedirect && countdown > 0 && (
              <div className="mt-5 flex items-center gap-3 text-[12.5px] text-zinc-500">
                <span>Auto-opens Telegram in <span className="font-mono text-cyan-300">{countdown}s</span></span>
                <button
                  onClick={() => setAutoRedirect(false)}
                  className="text-zinc-400 underline-offset-2 transition-colors hover:text-zinc-200 hover:underline"
                  data-testid="button-cancel-redirect"
                >
                  cancel
                </button>
              </div>
            )}
          </div>

          {/* RIGHT — perks card */}
          <div className="relative">
            <div
              className="pointer-events-none absolute -inset-6 rounded-[2rem] opacity-50 blur-2xl"
              style={{ background: "radial-gradient(ellipse 60% 50% at 50% 30%, rgba(34,211,238,0.16), transparent 60%)" }}
            />
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0E0E12] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)]">
              <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-lg border border-cyan-500/30 bg-cyan-500/10">
                    <Sparkles className="h-4 w-4 text-cyan-300" />
                  </span>
                  <div>
                    <div className="text-[14px] font-medium">Friend bonus</div>
                    <div className="text-[11px] uppercase tracking-wider text-zinc-500">Auto-applied</div>
                  </div>
                </div>
                <span className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10.5px] text-emerald-300">
                  ACTIVE
                </span>
              </div>

              <ul className="divide-y divide-white/5">
                {PERKS.map(({ Icon, title, sub }) => (
                  <li key={title} className="flex items-start gap-3 px-5 py-4">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-cyan-500/20 bg-cyan-500/[0.06]">
                      <Icon className="h-4 w-4 text-cyan-300" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-[13.5px] font-medium text-white">{title}</div>
                        <CheckCircle2 className="h-4 w-4 text-emerald-400/80" />
                      </div>
                      <div className="text-[12px] text-zinc-500">{sub}</div>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="border-t border-white/5 bg-white/[0.015] px-5 py-3 text-[10.5px] uppercase tracking-wider text-zinc-500">
                Bonus is single-use · expires in 24h
              </div>
            </div>

            <div className="mt-3 flex items-center justify-end gap-1.5 text-[10.5px] text-zinc-600">
              <Globe className="h-3 w-3" /> Works on web and in Telegram bot
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
