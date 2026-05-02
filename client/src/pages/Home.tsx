import { useState, useEffect, useRef, useMemo, useTransition, memo } from "react";
import { Link } from "wouter";
import {
  Search,
  Loader2,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  Mail,
  Phone,
  AtSign,
  Wallet,
  Globe,
  Shield,
  Eye,
  Database,
  Activity,
  Hash,
  CreditCard,
  Bug,
  Bot,
  KeyRound,
  Sparkles,
  Network,
  Clock,
  Share2,
  Star,
  Check,
  Users,
  Zap,
  Copy,
  TrendingUp,
  Wifi,
} from "lucide-react";
import { Footer } from "@/components/Footer";
import { PublicHeader } from "@/components/PublicHeader";
import { useTranslation } from "@/lib/i18n";
import { OSINT_SOURCES, CATEGORY_LABELS, type OsintCategory } from "@/data/osintSources";
import { SourcesScanGrid, type ScanItem } from "@/components/SourcesScanGrid";
import { Seo } from "@/components/Seo";

type CheckType = "email" | "phone" | "username" | "wallet" | "domain" | "ip";

interface QuickCheckResponse {
  type: string;
  target: string;
  riskScore: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  summary: string;
  findings: string[];
  findingsHidden?: number;
  sourcesChecked?: string[];
  sourcesTotal?: number;
  sourcesScanned?: ScanItem[];
  coverage?: {
    hit: number;
    clean: number;
    scanned: number;
    paid_only: number;
    rate_limit: number;
    no_data: number;
    not_applicable: number;
    applicable: number;
    completed: number;
  } | null;
  dangerSignals?: number;
  timestamp: string;
  limited: boolean;
}

interface SiteStats {
  totalUsers: number;
  totalReports: number;
  checksToday: number;
}

function detectType(value: string): CheckType | null {
  const v = value.trim();
  if (!v) return null;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "email";
  if (
    (v.startsWith("0x") && v.length >= 40) ||
    /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(v) ||
    (v.startsWith("bc1") && v.length >= 40) ||
    (v.startsWith("T") && v.length === 34) ||
    /^[LM][a-km-zA-HJ-NP-Z1-9]{25,33}$/.test(v)
  )
    return "wallet";
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(v)) return "ip";
  const phoneClean = v.replace(/[\s\-()]/g, "");
  if (/^\+?\d{7,15}$/.test(phoneClean)) return "phone";
  if (/\.[a-zA-Z]{2,}$/.test(v) && !v.includes("@") && !v.includes(" ")) return "domain";
  if (/^[a-zA-Z0-9_.]{3,30}$/.test(v)) return "username";
  return null;
}

function typeLabel(type: CheckType, lang: string): string {
  const labels: Record<string, Record<string, string>> = {
    email:    { uk: "Email",     ru: "Email",     es: "Email",    de: "Email",      en: "Email" },
    phone:    { uk: "Телефон",   ru: "Телефон",   es: "Teléfono", de: "Telefon",    en: "Phone" },
    username: { uk: "Username",  ru: "Username",  es: "Usuario",  de: "Nutzername", en: "Username" },
    wallet:   { uk: "Гаманець",  ru: "Кошелёк",  es: "Cartera",  de: "Wallet",     en: "Wallet" },
    domain:   { uk: "Домен",     ru: "Домен",     es: "Dominio",  de: "Domain",     en: "Domain" },
    ip:       { uk: "IP",        ru: "IP",        es: "IP",       de: "IP",         en: "IP" },
  };
  return labels[type]?.[lang] ?? labels[type]?.en ?? type;
}

function typeIcon(type: CheckType, cls = "h-4 w-4") {
  switch (type) {
    case "email": return <Mail className={cls} />;
    case "phone": return <Phone className={cls} />;
    case "username": return <AtSign className={cls} />;
    case "wallet": return <Wallet className={cls} />;
    case "domain":
    case "ip": return <Globe className={cls} />;
  }
}

function riskMeta(level: string) {
  switch (level) {
    case "critical": return { label: "CRITICAL", text: "text-rose-300", dot: "bg-rose-400", bar: "bg-rose-400", ring: "ring-rose-500/20" };
    case "high":     return { label: "HIGH",     text: "text-rose-300", dot: "bg-rose-400", bar: "bg-rose-400", ring: "ring-rose-500/20" };
    case "medium":   return { label: "MEDIUM",   text: "text-amber-300", dot: "bg-amber-400", bar: "bg-amber-400", ring: "ring-amber-500/20" };
    default:         return { label: "LOW",      text: "text-emerald-300", dot: "bg-emerald-400", bar: "bg-emerald-400", ring: "ring-emerald-500/20" };
  }
}

function stripEmoji(s: string) {
  return s.replace(/^[\uD800-\uDFFF\u2600-\u27BF\uFE00-\uFEFF]+\s*/, "").trim();
}


/* ─────────── Hero + Check ─────────── */
function HeroCheck({ stats }: { stats: SiteStats | null }) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QuickCheckResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const detected = useMemo(() => detectType(value), [value]);
  const resultRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isLg, setIsLg] = useState(false);
  const { t, lang } = useTranslation();

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsLg(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    setResult(null);
    if (!value.trim()) {
      inputRef.current?.focus();
      return;
    }
    const type = detectType(value);
    if (!type) {
      setError(t('errors.detectFormat'));
      return;
    }
    setLoading(true);
    const minDelay = new Promise((r) => setTimeout(r, 900));
    try {
      const [resp] = await Promise.all([
        fetch("/api/quick-check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, value: value.trim() }),
        }),
        minDelay,
      ]);
      let data: any = null;
      try { data = await resp.json(); } catch {}
      if (!resp.ok) {
        if (resp.status === 429) setError(t('errors.limitReached'));
        else if (resp.status >= 500) setError(t('errors.serverError'));
        else setError(data?.error || t('errors.quickCheckFailed'));
        return;
      }
      if (!data || typeof data.riskScore !== "number") {
        setError(t('errors.parseResponse'));
        return;
      }
      startTransition(() => {
        setResult(data as QuickCheckResponse);
      });
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 120);
    } catch {
      setError(t('errors.networkError'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="relative overflow-hidden">
      {/* Background layer */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-x-0 top-0 h-[640px]"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 50% 0%, rgba(34,211,238,0.10), transparent 65%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            maskImage:
              "radial-gradient(ellipse 80% 60% at 50% 0%, black 0%, transparent 70%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 80% 60% at 50% 0%, black 0%, transparent 70%)",
          }}
        />
      </div>

      {/* Subtle perspective grid */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-72 overflow-hidden opacity-[0.18]" aria-hidden>
        <div
          className="absolute inset-x-[-20%] bottom-[-10%] h-[200px]"
          style={{
            backgroundImage: "linear-gradient(rgba(34,211,238,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.18) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            transform: "perspective(400px) rotateX(60deg)",
            maskImage: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 90%)",
            WebkitMaskImage: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 90%)",
          }}
        />
      </div>
      <div className="relative mx-auto max-w-6xl px-5 pt-10 pb-12 sm:pt-20 sm:pb-20 lg:pt-28">
        <div className="grid items-start gap-10 lg:grid-cols-[1.05fr_minmax(0,440px)] lg:gap-16">
          {/* LEFT — copy + form */}
          <div className="lg:pt-2">
            <div className="inline-flex max-w-full items-center gap-2 truncate rounded-full border border-cyan-400/20 bg-cyan-500/[0.06] px-3 py-1.5 text-[11.5px] text-cyan-300/90 sm:text-[12px]">
              <span className="relative flex h-1.5 w-1.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              <span className="truncate">{t('landing.hero.badge', { N: String(OSINT_SOURCES.length) })}</span>
            </div>

            <h1
              className="mt-5 text-balance text-[36px] font-semibold leading-[1.05] tracking-tight text-white sm:mt-6 sm:text-[52px] sm:leading-[1.02] lg:text-[64px]"
              data-testid="text-hero-title"
            >
              {t('landing.hero.title')}{" "}
              <span className="bg-gradient-to-r from-cyan-300 to-cyan-400 bg-clip-text text-transparent">{t('landing.hero.titleHighlight')}</span>
            </h1>

            <p
              className="mt-4 max-w-xl text-[14.5px] leading-relaxed text-zinc-400 sm:mt-6 sm:text-[16px]"
              data-testid="text-hero-sub"
            >
              {t('landing.hero.description', { N: String(OSINT_SOURCES.length) })}
            </p>

            <form onSubmit={submit} className="mt-7 max-w-xl sm:mt-9">
              <div className="group relative">
                <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                  {detected ? typeIcon(detected, "h-4 w-4 text-cyan-300") : <Search className="h-4 w-4" />}
                </div>
                <input
                  ref={inputRef}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="email · phone · username · wallet · domain · IP"
                  className="h-14 w-full rounded-xl border border-white/10 bg-[#111114] pl-11 pr-36 text-[15px] text-white placeholder:text-zinc-600 outline-none transition-colors focus:border-cyan-400/60"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  data-testid="input-target"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="absolute right-1.5 top-1.5 inline-flex h-11 items-center gap-1.5 rounded-lg bg-cyan-400 px-3.5 text-[13.5px] font-semibold text-black shadow-[0_0_24px_-6px_rgba(34,211,238,0.55)] transition-all hover:bg-cyan-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 sm:px-4"
                  data-testid="button-check"
                >
                  {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> {lang === "uk" ? "Сканую" : lang === "ru" ? "Сканирую" : lang === "es" ? "Escaneando" : lang === "de" ? "Scanne" : "Scanning"}</> : <>{lang === "uk" ? "Сканувати" : lang === "ru" ? "Сканировать" : lang === "es" ? "Escanear" : lang === "de" ? "Scannen" : "Scan"} <ArrowRight className="h-4 w-4" /></>}
                </button>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-zinc-500">
                {detected ? (
                  <span className="inline-flex items-center gap-1.5 text-cyan-300/90" data-testid="text-detected">
                    {typeIcon(detected, "h-3 w-3")} {lang === "uk" ? "виявлено" : lang === "ru" ? "определено" : lang === "es" ? "detectado" : lang === "de" ? "erkannt" : "detected"}: {typeLabel(detected, lang)}
                  </span>
                ) : (
                  <span>{lang === "uk" ? "3 анонімних сканування / день · без реєстрації" : lang === "ru" ? "3 анонимных сканирования / день · без регистрации" : lang === "es" ? "3 escaneos anónimos / día · sin registro" : lang === "de" ? "3 anonyme Scans / Tag · ohne Anmeldung" : "3 anonymous scans / day · no signup"}</span>
                )}
                <span className="text-zinc-700">·</span>
                <span>{lang === "uk" ? "TLS шифрування · нуль логів запитів" : lang === "ru" ? "TLS шифрование · ноль логов запросов" : lang === "es" ? "Cifrado TLS · cero registros de consultas" : lang === "de" ? "TLS-Verschlüsselung · keine Protokollierung" : "TLS encrypted · zero query logs"}</span>
                {stats && stats.checksToday > 0 ? (
                  <>
                    <span className="text-zinc-700">·</span>
                    <span data-testid="text-stats-today">{stats.checksToday.toLocaleString("en-US")} {lang === "uk" ? "сканувань сьогодні" : lang === "ru" ? "сканирований сегодня" : lang === "es" ? "escaneos hoy" : lang === "de" ? "Scans heute" : "scans today"}</span>
                  </>
                ) : null}
              </div>

              {error && (
                <div className="mt-5 inline-flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/5 px-4 py-2 text-[13px] text-rose-300" data-testid="text-error">
                  <AlertTriangle className="h-3.5 w-3.5" /> {error}
                </div>
              )}
            </form>

            {/* Inline trust pills */}
            <div className="mt-5 flex flex-wrap items-center gap-2">
              {([
                { icon: Lock,      label: lang === "uk" ? "TLS шифрування" : lang === "ru" ? "TLS шифрование" : lang === "es" ? "TLS cifrado" : lang === "de" ? "TLS-Verschlüsselung" : "TLS encrypted" },
                { icon: Database,  label: lang === "uk" ? `${OSINT_SOURCES.length}+ джерел` : lang === "ru" ? `${OSINT_SOURCES.length}+ источников` : lang === "es" ? `${OSINT_SOURCES.length}+ fuentes` : lang === "de" ? `${OSINT_SOURCES.length}+ Quellen` : `${OSINT_SOURCES.length}+ sources` },
                { icon: Eye,       label: lang === "uk" ? "Без реєстрації" : lang === "ru" ? "Без регистрации" : lang === "es" ? "Sin registro" : lang === "de" ? "Ohne Anmeldung" : "No signup" },
                { icon: Shield,    label: lang === "uk" ? "7-дн. гарантія" : lang === "ru" ? "7 дней гарантия" : lang === "es" ? "7 días garantía" : lang === "de" ? "7-Tage-Garantie" : "7-day guarantee" },
              ] as { icon: typeof Lock; label: string }[]).map(({ icon: Icon, label }) => (
                <span key={label} className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-white/[0.03] px-3 py-1 text-[11px] text-zinc-400 transition-colors hover:border-white/[0.14] hover:text-zinc-200">
                  <Icon className="h-2.5 w-2.5 text-zinc-600" />
                  {label}
                </span>
              ))}
            </div>

            {/* Mobile / md — result rendered inline (one mount) */}
            {!isLg && result && (
              <div ref={resultRef} className="mt-10">
                <ResultCard data={result} />
              </div>
            )}

            {/* Scroll hint */}
            {!result && (
              <div className="mt-10 hidden items-center gap-2 sm:flex lg:hidden">
                <ChevronDown className="h-3.5 w-3.5 animate-bounce text-zinc-700" />
                <span className="text-[11px] text-zinc-700">
                  {lang === "uk" ? "Прокрутіть, щоб дізнатись більше" : lang === "ru" ? "Прокрутите вниз" : lang === "es" ? "Desplázate para más" : lang === "de" ? "Scrollen für mehr" : "Scroll to learn more"}
                </span>
              </div>
            )}
          </div>

          {/* RIGHT — desktop only: live result or static demo (one mount) */}
          {isLg && (
            <div>
              {result ? (
                <div ref={resultRef}>
                  <ResultCard data={result} />
                </div>
              ) : (
                <HeroDemoCard />
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ─────────── Hero static product mockup ─────────── */
function HeroDemoCard() {
  const { lang } = useTranslation();
  return (
    <div className="relative">
      <div
        className="pointer-events-none absolute -inset-6 rounded-[2rem] opacity-60 blur-2xl"
        style={{ background: "radial-gradient(ellipse 60% 50% at 50% 30%, rgba(34,211,238,0.18), transparent 60%)" }}
      />
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0E0E12] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)]">
        {/* Window chrome */}
        <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
            <span className="ml-2 inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.02] px-2 py-0.5 text-[10.5px] font-mono text-zinc-500">
              <Lock className="h-3 w-3" /> darkshare.io / scan
            </span>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-wider text-emerald-400">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            LIVE
          </span>
        </div>

        {/* Target row */}
        <div className="flex items-center justify-between gap-3 border-b border-white/5 px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-rose-500/10 ring-1 ring-rose-500/20">
              <Mail className="h-4 w-4 text-rose-300" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-[12px] uppercase tracking-wider text-zinc-500">Email</div>
              <div className="truncate font-mono text-[14px] text-white">alex.morgan@gmail.com</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10.5px] font-medium tracking-wider text-rose-300">
              {lang === "uk" ? "ВИСОКИЙ РИЗИК" : lang === "ru" ? "ВЫСОКИЙ РИСК" : lang === "es" ? "RIESGO ALTO" : lang === "de" ? "HOHES RISIKO" : "HIGH RISK"}
            </div>
            <div className="text-[22px] font-semibold leading-none text-white">
              78<span className="text-[12px] text-zinc-500">/100</span>
            </div>
          </div>
        </div>

        {/* Risk bar */}
        <div className="px-5 pt-5">
          <div className="h-1 w-full overflow-hidden rounded-full bg-white/5">
            <div className="h-full w-[78%] rounded-full bg-gradient-to-r from-amber-400 to-rose-400" />
          </div>
          <p className="mt-4 text-[13px] text-zinc-300">
            {lang === "uk" ? "Знайдено в 4 підтверджених зливах з 2019 р. Email публічно індексується на 6 сайтах." : lang === "ru" ? "Найдено в 4 подтверждённых утечках с 2019 г. Email публично индексируется на 6 сайтах." : lang === "es" ? "Encontrado en 4 filtraciones confirmadas desde 2019. Email indexado públicamente en 6 sitios." : lang === "de" ? "In 4 bestätigten Leaks seit 2019 gefunden. E-Mail ist auf 6 Seiten öffentlich indiziert." : "Found in 4 confirmed leaks since 2019. Email is publicly indexed across 6 sites."}
          </p>
        </div>

        {/* Findings */}
        <div className="px-5 pb-5 pt-4">
          <div className="mb-2 text-[11px] uppercase tracking-wider text-zinc-500">
            {lang === "uk" ? "Знахідки" : lang === "ru" ? "Находки" : lang === "es" ? "Hallazgos" : lang === "de" ? "Funde" : "Findings"}
          </div>
          <ul className="space-y-2 text-[13px]">
            <li className="flex items-start gap-2">
              <span className="mt-1.5 inline-block h-1.5 w-1.5 rounded-full bg-rose-400" />
              <span className="text-zinc-200"><span className="text-rose-300">LinkedIn</span> · 700M record breach (2021)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 inline-block h-1.5 w-1.5 rounded-full bg-rose-400" />
              <span className="text-zinc-200"><span className="text-rose-300">MyFitnessPal</span> · password hash exposed (2019)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
              <span className="text-zinc-200"><span className="text-amber-300">Gravatar</span> · profile metadata public</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span className="text-zinc-200"><span className="text-emerald-300">HIBP Pwned Passwords</span> · no match</span>
            </li>
          </ul>
        </div>

        {/* Source dots */}
        <div className="border-t border-white/5 bg-white/[0.015] px-5 py-4">
          <div className="mb-2 flex items-center justify-between text-[10.5px] uppercase tracking-wider text-zinc-500">
            <span>{lang === "uk" ? "Перевірено джерел" : lang === "ru" ? "Проверено источников" : lang === "es" ? "Fuentes verificadas" : lang === "de" ? "Geprüfte Quellen" : "Sources scanned"}</span>
            <span>73 {lang === "uk" ? "застосовних" : lang === "ru" ? "применимых" : lang === "es" ? "aplicables" : lang === "de" ? "anwendbar" : "applicable"} · {OSINT_SOURCES.length}</span>
          </div>
          <div className="flex flex-wrap gap-[5px]">
            {Array.from({ length: 73 }).map((_, i) => {
              const status = i < 4 ? "rose" : i < 12 ? "amber" : i < 38 ? "emerald" : "zinc";
              const cls =
                status === "rose"
                  ? "bg-rose-400/80"
                  : status === "amber"
                  ? "bg-amber-400/70"
                  : status === "emerald"
                  ? "bg-emerald-400/70"
                  : "bg-zinc-700";
              return <span key={i} className={`h-2 w-2 rounded-sm ${cls}`} />;
            })}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10.5px] text-zinc-500">
            <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-sm bg-rose-400" /> {lang === "uk" ? "збіги" : lang === "ru" ? "совпадения" : lang === "es" ? "coincidencias" : lang === "de" ? "Treffer" : "hits"} 4</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-sm bg-amber-400" /> {lang === "uk" ? "попередження" : lang === "ru" ? "предупреждения" : lang === "es" ? "advertencias" : lang === "de" ? "Warnungen" : "warnings"} 8</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-sm bg-emerald-400" /> {lang === "uk" ? "чисто" : lang === "ru" ? "чисто" : lang === "es" ? "limpio" : lang === "de" ? "sauber" : "clean"} 26</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-sm bg-zinc-600" /> {lang === "uk" ? "без даних" : lang === "ru" ? "нет данных" : lang === "es" ? "sin datos" : lang === "de" ? "keine Daten" : "no data"} 35</span>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end gap-1.5 text-[10.5px] text-zinc-600">
        <Sparkles className="h-3 w-3" />
        {lang === "uk" ? "Зразок звіту · запусти свій вище" : lang === "ru" ? "Образец отчёта · запусти свой выше" : lang === "es" ? "Informe de muestra · ejecuta el tuyo arriba" : lang === "de" ? "Beispielbericht · starte deinen oben" : "Sample report · run yours above"}
      </div>
    </div>
  );
}

/* ─────────── Result + Paywall ─────────── */
const ResultCard = memo(function ResultCard({ data }: { data: QuickCheckResponse }) {
  const meta = riskMeta(data.riskLevel);
  const hidden = data.findingsHidden ?? 4;
  const scanned = data.sourcesScanned || [];
  const sources = data.sourcesChecked || [];
  const [timeLeft, setTimeLeft] = useState(600);
  const [shared, setShared] = useState(false);
  const { lang } = useTranslation();

  useEffect(() => {
    const interval = setInterval(() => setTimeLeft(prev => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(interval);
  }, []);

  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const L = {
    findings: lang === "uk" ? "Знайдено" : lang === "ru" ? "Найдено" : lang === "es" ? "Encontrado" : lang === "de" ? "Gefunden" : "Findings",
    hiddenBanner: lang === "uk" ? `ще ${hidden} знахідок заблоковано` : lang === "ru" ? `ещё ${hidden} находок заблокировано` : lang === "es" ? `${hidden} hallazgos más bloqueados` : lang === "de" ? `${hidden} weitere Funde gesperrt` : `${hidden} more findings locked`,
    expiresIn: lang === "uk" ? "Результат доступний:" : lang === "ru" ? "Результат доступен:" : lang === "es" ? "Disponible por:" : lang === "de" ? "Verfügbar für:" : "Available for:",
    unlock: lang === "uk" ? `Розблокувати всі ${hidden} знахідки` : lang === "ru" ? `Разблокировать все ${hidden} находки` : lang === "es" ? `Desbloquear los ${hidden} hallazgos` : lang === "de" ? `Alle ${hidden} Funde freischalten` : `Unlock all ${hidden} findings`,
    unlockSub: lang === "uk" ? "Усі джерела · AI-вердикт · зв'язані акаунти · PDF" : lang === "ru" ? "Все источники · AI-вердикт · связанные аккаунты · PDF" : lang === "es" ? "Todas las fuentes · IA · cuentas vinculadas · PDF" : lang === "de" ? "Alle Quellen · KI-Urteil · verknüpfte Konten · PDF" : "All sources · AI verdict · linked accounts · PDF",
    singleReport: lang === "uk" ? "Разовий звіт — $3" : lang === "ru" ? "Разовый отчёт — $3" : lang === "es" ? "Informe único — $3" : lang === "de" ? "Einzel-Bericht — $3" : "Single report — $3",
    proSub: lang === "uk" ? "PRO — $9/міс" : lang === "ru" ? "PRO — $9/мес" : lang === "es" ? "PRO — $9/mes" : lang === "de" ? "PRO — $9/Mo" : "PRO — $9/mo",
    guarantee: lang === "uk" ? "7-денна гарантія · код DARKNEU → −50% на PRO" : lang === "ru" ? "Гарантия 7 дней · код DARKNEU → −50% на PRO" : lang === "es" ? "7 días de garantía · código DARKNEU → −50% en PRO" : lang === "de" ? "7 Tage Garantie · Code DARKNEU → −50% auf PRO" : "7-day guarantee · code DARKNEU → −50% off PRO",
    share: lang === "uk" ? "Поділитись" : lang === "ru" ? "Поделиться" : lang === "es" ? "Compartir" : lang === "de" ? "Teilen" : "Share",
    copiedMsg: lang === "uk" ? "Скопійовано!" : lang === "ru" ? "Скопировано!" : lang === "es" ? "¡Copiado!" : lang === "de" ? "Kopiert!" : "Copied!",
    sourcesTitle: lang === "uk" ? "Перевірено в OSINT-джерелах" : lang === "ru" ? "Проверено в OSINT-источниках" : lang === "es" ? "Verificado en fuentes OSINT" : lang === "de" ? "In OSINT-Quellen geprüft" : "Checked in OSINT sources",
    sourcesOf: lang === "uk" ? "із" : lang === "ru" ? "из" : lang === "es" ? "de" : lang === "de" ? "von" : "of",
  };

  const handleShare = () => {
    const shareText = lang === "uk"
      ? `Я перевірив свій цифровий слід на DarkShare! Рівень ризику: ${meta.label} (${data.riskScore}/100). Перевір свій: darkshare.store`
      : lang === "ru"
      ? `Я проверил цифровой след на DarkShare! Уровень риска: ${meta.label} (${data.riskScore}/100). Проверь свой: darkshare.store`
      : `I checked my digital footprint on DarkShare! Risk: ${meta.label} (${data.riskScore}/100). Check yours: darkshare.store`;
    if (navigator.share) {
      navigator.share({ title: "DarkShare Scan", text: shareText, url: "https://darkshare.store" }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareText).then(() => { setShared(true); setTimeout(() => setShared(false), 2500); }).catch(() => {});
    }
  };

  return (
    <div className="mx-auto max-w-2xl text-left">
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0E0E12]">
        {/* Header row */}
        <div className="flex items-center justify-between gap-3 border-b border-white/5 px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className={`grid h-9 w-9 place-items-center rounded-lg bg-white/[0.03] ring-1 ${meta.ring}`}>
              <Eye className={`h-4 w-4 ${meta.text}`} />
            </div>
            <div className="min-w-0">
              <div className="truncate text-[13px] text-zinc-400">{data.type.toUpperCase()}</div>
              <div className="truncate text-[14px] font-medium text-white" data-testid="text-target">{data.target}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleShare}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-[11.5px] text-zinc-400 hover:border-white/20 hover:text-white transition-colors"
              data-testid="button-share-result"
            >
              {shared ? <Check className="h-3 w-3 text-emerald-400" /> : <Share2 className="h-3 w-3" />}
              <span>{shared ? L.copiedMsg : L.share}</span>
            </button>
            <div className="text-right">
              <div className={`text-[11px] tracking-wider ${meta.text}`}>{meta.label}</div>
              <div className="text-[20px] font-semibold leading-none text-white" data-testid="text-risk-score">
                {data.riskScore}<span className="text-[12px] text-zinc-500">/100</span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 pt-5">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
            <div className={`h-full ${meta.bar} transition-all duration-700`} style={{ width: `${data.riskScore}%` }} />
          </div>
          <p className="mt-4 text-[13.5px] text-zinc-300" data-testid="text-summary">{stripEmoji(data.summary)}</p>
        </div>

        <div className="px-5 pb-5 pt-4">
          <div className="mb-2 text-[11px] uppercase tracking-wider text-zinc-500">{L.findings}</div>
          <ul className="space-y-2">
            {data.findings.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-[13.5px] text-zinc-200" data-testid={`row-finding-${i}`}>
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-300/80" />
                <span>{stripEmoji(f)}</span>
              </li>
            ))}
          </ul>

          {/* Blurred locked findings */}
          <div className="mt-3 space-y-2" aria-hidden>
            {Array.from({ length: Math.min(5, Math.max(3, hidden)) }).map((_, i) => (
              <div key={i} className="flex items-start gap-2">
                <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-600" />
                <div className="h-3.5 w-full max-w-[420px] rounded bg-white/5" style={{ filter: "blur(3px)", opacity: 0.7 - i * 0.1 }} />
              </div>
            ))}
          </div>

          {/* UPGRADED PAYWALL */}
          <div className="mt-5 overflow-hidden rounded-xl border border-rose-400/30 bg-gradient-to-br from-rose-950/40 via-zinc-900/60 to-zinc-950">
            <div className="flex items-center justify-between gap-3 border-b border-rose-500/15 bg-rose-500/[0.06] px-4 py-2.5">
              <div className="flex items-center gap-2 text-[11.5px] font-medium text-rose-300/90">
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500" />
                </span>
                {L.hiddenBanner}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                <Clock className="h-3 w-3" />
                <span>{L.expiresIn}</span>
                <span className="font-mono font-semibold text-zinc-300 tabular-nums">{fmt(timeLeft)}</span>
              </div>
            </div>
            <div className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-[13.5px] font-semibold text-white">{L.unlock}</div>
                  <div className="mt-0.5 text-[11.5px] text-zinc-400">{L.unlockSub}</div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Link href={`/pricing?single=1&t=${encodeURIComponent(data.target)}&type=${data.type}`} className="flex-1 sm:flex-none">
                    <span className="relative flex h-9 w-full cursor-pointer items-center justify-center rounded-lg bg-white px-3.5 text-[12.5px] font-semibold text-black hover:bg-zinc-200 transition-colors" data-testid="link-buy-single">
                      <span className="absolute -inset-[3px] rounded-[10px] bg-white/20 animate-ping opacity-40 pointer-events-none" />
                      {L.singleReport}
                    </span>
                  </Link>
                  <Link href="/pricing?plan=PRO&code=DARKNEU" className="flex-1 sm:flex-none">
                    <span className="flex h-9 w-full cursor-pointer items-center justify-center rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-3.5 text-[12.5px] font-semibold text-cyan-200 hover:bg-cyan-500/20 transition-colors" data-testid="link-buy-pro">
                      {L.proSub}
                    </span>
                  </Link>
                </div>
              </div>
              <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-emerald-400/80">
                <Check className="h-3 w-3 shrink-0" />
                {L.guarantee}
              </div>
            </div>
          </div>
        </div>

        {/* Share on mobile */}
        <div className="sm:hidden border-t border-white/5 bg-white/[0.01] px-5 py-3">
          <button onClick={handleShare} className="inline-flex items-center gap-2 text-[12px] text-zinc-400 hover:text-white transition-colors" data-testid="button-share-result-mobile">
            {shared ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Share2 className="h-3.5 w-3.5" />}
            {shared ? L.copiedMsg : `${L.share} · ${data.riskScore}/100`}
          </button>
        </div>

        {scanned.length > 0 ? (
          <div className="border-t border-white/5 bg-white/[0.015] px-5 py-4">
            <div className="mb-3 text-[11px] uppercase tracking-wider text-zinc-500">
              {L.sourcesTitle}
            </div>
            <SourcesScanGrid items={scanned} />
          </div>
        ) : sources.length > 0 ? (
          <div className="border-t border-white/5 bg-white/[0.015] px-5 py-4">
            <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-wider text-zinc-500">
              <span>{L.sourcesTitle}</span>
              <span>{sources.length} {L.sourcesOf} {data.sourcesTotal ?? 150}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {sources.slice(0, 12).map((s) => (
                <span key={s} className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-[11.5px] text-zinc-300" data-testid={`badge-source-${s}`}>
                  {s}
                </span>
              ))}
              {sources.length > 12 && (
                <span className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-[11.5px] text-zinc-400">
                  +{sources.length - 12}
                </span>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
});

/* ─────────── Count-up animation component ─────────── */
function CountUp({ raw, suffix = "" }: { raw: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const done = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || done.current) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || done.current) return;
      done.current = true;
      const start = performance.now();
      const dur = 1400;
      const tick = (now: number) => {
        const t = Math.min((now - start) / dur, 1);
        const ease = 1 - Math.pow(1 - t, 4);
        setDisplay(Math.round(ease * raw));
        if (t < 1) requestAnimationFrame(tick);
        else setDisplay(raw);
      };
      requestAnimationFrame(tick);
      obs.disconnect();
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [raw]);
  const fmt = display >= 1000 ? display.toLocaleString("en-US") : String(display);
  return <span ref={ref}>{fmt}{suffix}</span>;
}

/* ─────────── Trusted aggregators strip ─────────── */
function TrustedAggregators() {
  const { lang } = useTranslation();
  const label = lang === "uk" ? "Агрегуємо сигнали з провідних джерел" : lang === "ru" ? "Агрегируем сигналы из ведущих источников" : lang === "es" ? "Señales de fuentes líderes" : lang === "de" ? "Signale von führenden Quellen" : "Aggregating signal from leading sources";
  const moreCount = OSINT_SOURCES.length - 12;
  const moreLabel = lang === "uk" ? `+${moreCount} інших` : lang === "ru" ? `+${moreCount} других` : lang === "es" ? `+${moreCount} más` : lang === "de" ? `+${moreCount} weitere` : `+${moreCount} more`;
  type Group = { key: string; label: string; chips: string[] };
  const groups: Group[] = [
    {
      key: "breach",
      label: lang === "uk" ? "Витоки" : lang === "ru" ? "Утечки" : lang === "es" ? "Brechas" : lang === "de" ? "Leaks" : "Breach intel",
      chips: ["HIBP", "PhishTank", "Mailcheck", "URLhaus"],
    },
    {
      key: "threat",
      label: lang === "uk" ? "Threat-фіди" : lang === "ru" ? "Threat-фиды" : lang === "es" ? "Threat feeds" : lang === "de" ? "Threat-Feeds" : "Threat feeds",
      chips: ["VirusTotal", "AbuseIPDB", "GreyNoise"],
    },
    {
      key: "osint",
      label: "OSINT / Network",
      chips: ["Shodan", "Censys", "MaxMind", "Etherscan", "WHOIS"],
    },
  ];
  return (
    <section className="border-t border-white/[0.06] bg-[#07070A]">
      <div className="mx-auto max-w-6xl px-5 py-8">
        <p className="mb-6 text-center text-[11px] font-medium uppercase tracking-[0.22em] text-zinc-600">{label}</p>
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start sm:justify-center">
          {groups.map((g) => (
            <div key={g.key} className="flex flex-col items-center gap-2 sm:items-start">
              <span className="text-[9.5px] font-semibold uppercase tracking-[0.2em] text-zinc-700">{g.label}</span>
              <div className="flex flex-wrap justify-center gap-1.5 sm:justify-start">
                {g.chips.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center rounded-md border border-white/[0.07] bg-white/[0.03] px-2.5 py-1 font-mono text-[11.5px] text-zinc-500 transition-colors hover:border-white/[0.15] hover:text-zinc-200"
                    data-testid={`text-aggregator-${s}`}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          ))}
          <div className="flex flex-col items-center gap-2 sm:items-start">
            <span className="text-[9.5px] font-semibold uppercase tracking-[0.2em] text-zinc-700">&nbsp;</span>
            <span className="inline-flex items-center rounded-md border border-cyan-400/[0.12] bg-cyan-500/[0.04] px-2.5 py-1 font-mono text-[11.5px] text-cyan-400/60">
              {moreLabel}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────── What we check ─────────── */
function WhatWeCheck() {
  const { lang } = useTranslation();
  const items: { Icon: typeof Mail; title: string; desc: string; color: string }[] = [
    { Icon: Mail,       title: "Email",     color: "text-rose-300 bg-rose-500/10 ring-rose-500/20",    desc: lang === "uk" ? "Витоки та зливи" : lang === "ru" ? "Утечки и сливы" : lang === "es" ? "Filtraciones" : lang === "de" ? "Leaks & Breaches" : "Leaks & breaches" },
    { Icon: Phone,      title: "Phone",     color: "text-amber-300 bg-amber-500/10 ring-amber-500/20",  desc: lang === "uk" ? "Спам, шахрайство" : lang === "ru" ? "Спам, мошенники" : lang === "es" ? "Spam, fraude" : lang === "de" ? "Spam, Betrug" : "Spam & fraud flags" },
    { Icon: AtSign,     title: "Username",  color: "text-purple-300 bg-purple-500/10 ring-purple-500/20", desc: lang === "uk" ? "Профілі в мережі" : lang === "ru" ? "Профили в сети" : lang === "es" ? "Perfiles en red" : lang === "de" ? "Online-Profile" : "Cross-platform profiles" },
    { Icon: Wallet,     title: "Wallet",    color: "text-cyan-300 bg-cyan-500/10 ring-cyan-500/20",    desc: lang === "uk" ? "Блокчейн-ризик" : lang === "ru" ? "Блокчейн-риск" : lang === "es" ? "Riesgo cripto" : lang === "de" ? "Krypto-Risiko" : "Blockchain risk score" },
    { Icon: Globe,      title: "Domain",    color: "text-emerald-300 bg-emerald-500/10 ring-emerald-500/20", desc: lang === "uk" ? "DNS, SSL, репут." : lang === "ru" ? "DNS, SSL, репут." : lang === "es" ? "DNS, SSL, reput." : lang === "de" ? "DNS, SSL, Rep." : "DNS, SSL & reputation" },
    { Icon: Network,    title: "IP",        color: "text-blue-300 bg-blue-500/10 ring-blue-500/20",    desc: lang === "uk" ? "Геолокація, загрози" : lang === "ru" ? "Геолокация, угрозы" : lang === "es" ? "Geoloc. & amenazas" : lang === "de" ? "Geoloc. & Bedrohungen" : "Geoloc. & threat feeds" },
    { Icon: Hash,       title: "File Hash", color: "text-zinc-300 bg-zinc-500/10 ring-zinc-500/20",    desc: lang === "uk" ? "Шкідливий код" : lang === "ru" ? "Вредоносный код" : lang === "es" ? "Malware" : lang === "de" ? "Malware" : "Malware identification" },
    { Icon: Bug,        title: "CVE",       color: "text-orange-300 bg-orange-500/10 ring-orange-500/20", desc: lang === "uk" ? "Вразливості CVE" : lang === "ru" ? "Уязвимости CVE" : lang === "es" ? "Vulnerabilidades" : lang === "de" ? "Schwachstellen" : "CVE vulnerability lookup" },
    { Icon: CreditCard, title: "Card BIN",  color: "text-pink-300 bg-pink-500/10 ring-pink-500/20",   desc: lang === "uk" ? "Перевірка банку" : lang === "ru" ? "Проверка банка" : lang === "es" ? "Verif. bancaria" : lang === "de" ? "Bank-Check" : "Bank & BIN validation" },
    { Icon: KeyRound,   title: "Password",  color: "text-red-300 bg-red-500/10 ring-red-500/20",      desc: lang === "uk" ? "Злом, pwned" : lang === "ru" ? "Взлом, pwned" : lang === "es" ? "Brecha, pwned" : lang === "de" ? "Gehackt, pwned" : "Pwned hash check" },
    { Icon: Shield,     title: "SSL / TLS", color: "text-teal-300 bg-teal-500/10 ring-teal-500/20",   desc: lang === "uk" ? "Сертифікати" : lang === "ru" ? "Сертификаты" : lang === "es" ? "Certificados" : lang === "de" ? "Zertifikate" : "Certificate analysis" },
    { Icon: Wifi,       title: "VPN / Proxy", color: "text-indigo-300 bg-indigo-500/10 ring-indigo-500/20", desc: lang === "uk" ? "Виявлення VPN" : lang === "ru" ? "Обнаружение VPN" : lang === "es" ? "Detección VPN" : lang === "de" ? "VPN-Erkennung" : "VPN / proxy detection" },
  ];
  const sectionLabel = lang === "uk" ? "Що перевіряємо" : lang === "ru" ? "Что проверяем" : lang === "es" ? "Qué analizamos" : lang === "de" ? "Was wir prüfen" : "What we scan";
  const headline = lang === "uk" ? "12 типів перевірок · одне поле вводу" : lang === "ru" ? "12 типов проверок · одно поле ввода" : lang === "es" ? "12 tipos de análisis · un campo" : lang === "de" ? "12 Prüftypen · ein Eingabefeld" : "12 scan types · one input";
  const sub = lang === "uk" ? "Введіть будь-який ідентифікатор — DarkShare автоматично визначить тип і запустить потрібний модуль." : lang === "ru" ? "Введите любой идентификатор — DarkShare автоматически определит тип и запустит нужный модуль." : lang === "es" ? "Introduce cualquier identificador — DarkShare detectará el tipo y ejecutará el módulo correcto." : lang === "de" ? "Geben Sie einen Bezeichner ein — DarkShare erkennt den Typ und startet das richtige Modul." : "Enter any identifier — DarkShare auto-detects the type and runs the right module.";
  return (
    <section className="border-t border-white/[0.06]">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
        <div className="mb-10 max-w-xl">
          <div className="mb-3 inline-flex items-center rounded-full border border-cyan-400/20 bg-cyan-500/[0.06] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-cyan-300/90">
            {sectionLabel}
          </div>
          <h2 className="text-[24px] font-semibold tracking-tight text-white sm:text-[28px]">{headline}</h2>
          <p className="mt-3 text-[14px] leading-relaxed text-zinc-500">{sub}</p>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
          {items.map(({ Icon, title, desc, color }) => (
            <div
              key={title}
              className="group flex flex-col gap-3 rounded-xl border border-white/[0.07] bg-[#0D0D10] p-4 transition-all hover:border-white/[0.13] hover:bg-[#111116]"
              data-testid={`chip-check-${title.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <div className={`grid h-9 w-9 place-items-center rounded-lg ring-1 ${color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex items-end justify-between gap-2">
                <div>
                  <div className="text-[13px] font-semibold text-white">{title}</div>
                  <div className="mt-0.5 text-[11.5px] leading-snug text-zinc-500">{desc}</div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 translate-x-0 text-zinc-700 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-8 flex items-center justify-between gap-4 rounded-xl border border-white/[0.06] bg-[#0D0D10] px-5 py-4">
          <p className="text-[13px] text-zinc-400">
            {lang === "uk" ? "Введіть email, IP, гаманець або username — DarkShare визначить тип автоматично." : lang === "ru" ? "Введите email, IP, кошелёк или username — DarkShare определит тип автоматически." : lang === "es" ? "Introduce email, IP, wallet o username — DarkShare detecta el tipo automáticamente." : lang === "de" ? "E-Mail, IP, Wallet oder Username eingeben — DarkShare erkennt den Typ." : "Enter an email, IP, wallet or username — DarkShare auto-detects the type."}
          </p>
          <a href="#top" className="shrink-0 inline-flex h-9 items-center gap-1.5 rounded-lg bg-white/[0.06] border border-white/[0.10] px-4 text-[12.5px] font-medium text-white hover:bg-white/[0.10] transition-colors">
            {lang === "uk" ? "Сканувати" : lang === "ru" ? "Сканировать" : lang === "es" ? "Escanear" : lang === "de" ? "Scannen" : "Scan now"} <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </section>
  );
}

/* ─────────── How it works ─────────── */
function HowItWorks() {
  const { lang } = useTranslation();
  const sectionLabel = lang === "uk" ? "Як це працює" : lang === "ru" ? "Как это работает" : lang === "es" ? "Cómo funciona" : lang === "de" ? "Wie es funktioniert" : "How it works";
  const headline = lang === "uk" ? "Три кроки — і звіт у вас" : lang === "ru" ? "Три шага — и отчёт у вас" : lang === "es" ? "Tres pasos, resultado inmediato" : lang === "de" ? "Drei Schritte, sofortiges Ergebnis" : "Three steps · instant results";
  type Step = { n: string; title: string; desc: string; icon: typeof Search };
  const steps: Step[] = lang === "uk" ? [
    { n: "01", icon: Search,       title: "Введи ідентифікатор", desc: "Email, телефон, username, гаманець, домен або IP — одне поле без реєстрації" },
    { n: "02", icon: Zap,          title: "Паралельне сканування", desc: `Одночасно опитуємо ${OSINT_SOURCES.length}+ OSINT-джерел, threat-фідів та баз витоків` },
    { n: "03", icon: CheckCircle2, title: "Отримай звіт", desc: "AI-підсумок, оцінка ризику 0–100, конкретні знахідки та рекомендації" },
  ] : lang === "ru" ? [
    { n: "01", icon: Search,       title: "Введи идентификатор", desc: "Email, телефон, username, кошелёк, домен или IP — одно поле, без регистрации" },
    { n: "02", icon: Zap,          title: "Параллельное сканирование", desc: `Одновременно опрашиваем ${OSINT_SOURCES.length}+ OSINT-источников, threat-фидов и баз утечек` },
    { n: "03", icon: CheckCircle2, title: "Получи отчёт", desc: "AI-резюме, оценка риска 0–100, конкретные находки и рекомендации" },
  ] : lang === "es" ? [
    { n: "01", icon: Search,       title: "Introduce el objetivo", desc: "Email, teléfono, usuario, wallet, dominio o IP — sin registro" },
    { n: "02", icon: Zap,          title: "Escaneo en paralelo", desc: `Consultamos ${OSINT_SOURCES.length}+ fuentes OSINT, feeds de amenazas y bases de filtraciones` },
    { n: "03", icon: CheckCircle2, title: "Obtén el informe", desc: "Resumen IA, puntuación 0–100, hallazgos concretos y recomendaciones" },
  ] : lang === "de" ? [
    { n: "01", icon: Search,       title: "Ziel eingeben", desc: "E-Mail, Telefon, Benutzername, Wallet, Domain oder IP — ohne Registrierung" },
    { n: "02", icon: Zap,          title: "Paralleles Scanning", desc: `Gleichzeitige Abfrage von ${OSINT_SOURCES.length}+ OSINT-Quellen, Threat-Feeds und Leak-DBs` },
    { n: "03", icon: CheckCircle2, title: "Bericht erhalten", desc: "KI-Zusammenfassung, Risikobewertung 0–100, konkrete Funde und Empfehlungen" },
  ] : [
    { n: "01", icon: Search,       title: "Enter any identifier", desc: "Email, phone, username, wallet, domain or IP — no signup required" },
    { n: "02", icon: Zap,          title: "Parallel scan", desc: `We simultaneously query ${OSINT_SOURCES.length}+ OSINT sources, threat feeds & leak databases` },
    { n: "03", icon: CheckCircle2, title: "Get your report", desc: "AI summary, 0–100 risk score, specific findings and actionable recommendations" },
  ];
  return (
    <section id="how" className="border-t border-white/[0.06] bg-[#07070A]">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
        <div className="mb-10 text-center">
          <div className="mb-3 inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-400">
            {sectionLabel}
          </div>
          <h2 className="text-[24px] font-semibold tracking-tight text-white sm:text-[28px]">{headline}</h2>
        </div>
        <div className="relative grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Desktop connector line */}
          <div className="pointer-events-none absolute inset-x-0 top-[42px] hidden sm:block" aria-hidden>
            <div className="mx-auto flex max-w-[calc(100%-4rem)] items-center justify-between px-[calc(16.67%-20px)]">
              <div className="h-px flex-1 border-t border-dashed border-white/[0.10]" />
              <div className="mx-2 h-1.5 w-1.5 rotate-45 border-r border-t border-white/20" />
              <div className="h-px flex-1 border-t border-dashed border-white/[0.10]" />
              <div className="mx-2 h-1.5 w-1.5 rotate-45 border-r border-t border-white/20" />
            </div>
          </div>
          {steps.map(({ n, icon: Icon, title, desc }) => (
            <div key={n} className="relative rounded-2xl border border-white/[0.07] bg-[#0D0D10] p-6" data-testid={`step-${n}`}>
              <div className="mb-4 flex items-center gap-3">
                <div className="relative grid h-10 w-10 place-items-center rounded-xl border border-cyan-400/25 bg-cyan-500/[0.10] shadow-[0_0_16px_-4px_rgba(34,211,238,0.25)]">
                  <Icon className="h-5 w-5 text-cyan-300" />
                </div>
                <span className="font-mono text-[13px] font-bold tracking-widest text-zinc-700">{n}</span>
              </div>
              <div className="text-[15px] font-semibold text-white">{title}</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-500">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────── Sources ─────────── */
function Sources() {
  const { lang } = useTranslation();
  const cats: OsintCategory[] = ["leaks", "email", "phone", "ip", "domain", "wallet", "username", "threat", "darkweb", "social"];
  const sectionLabel = lang === "uk" ? "Джерела" : lang === "ru" ? "Источники" : lang === "es" ? "Fuentes" : lang === "de" ? "Quellen" : "Sources";
  const headline = lang === "uk" ? `${OSINT_SOURCES.length}+ перевірених OSINT-джерел` : lang === "ru" ? `${OSINT_SOURCES.length}+ проверенных OSINT-источников` : lang === "es" ? `${OSINT_SOURCES.length}+ fuentes OSINT verificadas` : lang === "de" ? `${OSINT_SOURCES.length}+ geprüfte OSINT-Quellen` : `${OSINT_SOURCES.length}+ verified OSINT sources`;
  const sub = lang === "uk" ? "Кожне джерело перевіряється вручну — жодних фейкових API." : lang === "ru" ? "Каждый источник проверяется вручную — никаких фейковых API." : lang === "es" ? "Cada fuente se verifica manualmente — sin APIs falsas." : lang === "de" ? "Jede Quelle wird manuell geprüft — keine gefälschten APIs." : "Every source is manually vetted — no fake APIs.";
  const fullListLabel = lang === "uk" ? "Повний список →" : lang === "ru" ? "Полный список →" : lang === "es" ? "Lista completa →" : lang === "de" ? "Vollständige Liste →" : "Full source list →";
  const catIconMap: Record<OsintCategory, typeof Mail> = {
    leaks: Shield, email: Mail, phone: Phone, ip: Network, domain: Globe,
    wallet: Wallet, username: AtSign, threat: Bug, darkweb: Eye, social: Users,
  };
  return (
    <section id="sources" className="border-t border-white/[0.06] bg-[#07070A]">
      <div className="mx-auto max-w-6xl px-5 py-16">
        <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-400">
              {sectionLabel}
            </div>
            <h2 className="text-[24px] font-semibold tracking-tight text-white sm:text-[28px]">{headline}</h2>
            <p className="mt-2 text-[13px] text-zinc-500">{sub}</p>
          </div>
          <Link href="/trust">
            <span className="cursor-pointer whitespace-nowrap text-[13px] text-zinc-400 transition-colors hover:text-white" data-testid="link-sources-all">
              {fullListLabel}
            </span>
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {cats.map((cat) => {
            const count = OSINT_SOURCES.filter((s) => s.category === cat).length;
            const label = (CATEGORY_LABELS[cat] as any)[lang] ?? CATEGORY_LABELS[cat].en ?? CATEGORY_LABELS[cat].ru;
            const Icon = catIconMap[cat];
            return (
              <div
                key={cat}
                className="flex flex-col gap-3 rounded-xl border border-white/[0.07] bg-[#0D0D10] p-4 transition-all hover:border-white/[0.14] hover:bg-[#111116]"
              >
                <div className="flex items-center justify-between">
                  <div className="grid h-7 w-7 place-items-center rounded-lg border border-white/[0.07] bg-white/[0.03]">
                    <Icon className="h-3.5 w-3.5 text-zinc-500" />
                  </div>
                  <span className="font-mono text-[18px] font-bold text-white"><CountUp raw={count} /></span>
                </div>
                <div>
                  <div className="text-[12.5px] font-medium text-zinc-200">{label}</div>
                  <div className="mt-0.5 font-mono text-[10px] text-zinc-600">{lang === "uk" ? "джерел" : lang === "ru" ? "источников" : lang === "es" ? "fuentes" : lang === "de" ? "Quellen" : "sources"}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─────────── Pricing teaser ─────────── */
function PricingTeaser() {
  const { lang } = useTranslation();
  const sectionLabel = lang === "uk" ? "Ціни" : lang === "ru" ? "Цены" : lang === "es" ? "Precios" : lang === "de" ? "Preise" : "Pricing";
  const headline = lang === "uk" ? "Починайте безплатно — платіть коли потрібно більше" : lang === "ru" ? "Начните бесплатно — платите когда нужно больше" : lang === "es" ? "Empieza gratis, paga cuando necesites más" : lang === "de" ? "Kostenlos starten, zahlen wenn Sie mehr brauchen" : "Start free · pay when you need more";
  const perMonth = lang === "uk" ? "/міс" : lang === "ru" ? "/мес" : lang === "es" ? "/mes" : lang === "de" ? "/Mo" : "/mo";
  const perReport = lang === "uk" ? "за звіт" : lang === "ru" ? "за отчёт" : lang === "es" ? "por informe" : lang === "de" ? "pro Bericht" : "per report";
  const mostPopular = lang === "uk" ? "Найпопулярніший" : lang === "ru" ? "Популярный" : lang === "es" ? "Más popular" : lang === "de" ? "Beliebtester" : "Most popular";
  const seeAll = lang === "uk" ? "Переглянути всі тарифи →" : lang === "ru" ? "Смотреть все тарифы →" : lang === "es" ? "Ver todos los planes →" : lang === "de" ? "Alle Pläne ansehen →" : "See all plans →";
  const promoNote = lang === "uk" ? "Код DARKNEU → −50% на перший місяць PRO" : lang === "ru" ? "Код DARKNEU → −50% на первый месяц PRO" : lang === "es" ? "Código DARKNEU → −50% primer mes PRO" : lang === "de" ? "Code DARKNEU → −50% erster PRO-Monat" : "Code DARKNEU → −50% off first PRO month";

  type PlanFeature = { text: string; included: boolean };
  type Plan = { name: string; price: string; note: string; href: string; testId: string; hot?: boolean; badge?: string; features: PlanFeature[] };
  const unlocked = (t: string): PlanFeature => ({ text: t, included: true });
  const locked   = (t: string): PlanFeature => ({ text: t, included: false });

  const f = {
    scan3:    lang === "uk" ? "3 сканування / день" : lang === "ru" ? "3 сканирования / день" : lang === "es" ? "3 escaneos / día" : lang === "de" ? "3 Scans / Tag" : "3 scans / day",
    scanUnl:  lang === "uk" ? "Необмежені сканування" : lang === "ru" ? "Безлимитные сканирования" : lang === "es" ? "Escaneos ilimitados" : lang === "de" ? "Unbegrenzte Scans" : "Unlimited scans",
    basic:    lang === "uk" ? "Базові результати" : lang === "ru" ? "Базовые результаты" : lang === "es" ? "Resultados básicos" : lang === "de" ? "Basisergebnisse" : "Basic results",
    full:     lang === "uk" ? "Повні результати + PDF" : lang === "ru" ? "Полные результаты + PDF" : lang === "es" ? "Resultados completos + PDF" : lang === "de" ? "Volle Ergebnisse + PDF" : "Full results + PDF",
    monitor:  lang === "uk" ? "Моніторинг 24/7" : lang === "ru" ? "Мониторинг 24/7" : lang === "es" ? "Monitoreo 24/7" : lang === "de" ? "24/7-Monitoring" : "24/7 monitoring",
    api:      lang === "uk" ? "REST API доступ" : lang === "ru" ? "Доступ REST API" : lang === "es" ? "Acceso REST API" : lang === "de" ? "REST-API-Zugang" : "REST API access",
    vpn3:     lang === "uk" ? "VPN 3 пристрої" : lang === "ru" ? "VPN 3 устройства" : lang === "es" ? "VPN 3 dispositivos" : lang === "de" ? "VPN 3 Geräte" : "VPN 3 devices",
    vpn10:    lang === "uk" ? "VPN 10 пристроїв" : lang === "ru" ? "VPN 10 устройств" : lang === "es" ? "VPN 10 dispositivos" : lang === "de" ? "VPN 10 Geräte" : "VPN 10 devices",
    bulk:     lang === "uk" ? "Bulk API (100/запит)" : lang === "ru" ? "Bulk API (100/запрос)" : lang === "es" ? "Bulk API (100/req)" : lang === "de" ? "Bulk-API (100/Req.)" : "Bulk API (100/req)",
    pdf:      lang === "uk" ? "Брендований PDF" : lang === "ru" ? "Брендированный PDF" : lang === "es" ? "PDF con marca" : lang === "de" ? "Gebrandetes PDF" : "White-label PDF",
  };

  const plans: Plan[] = [
    {
      name: "Free",
      price: "$0",
      note: lang === "uk" ? "назавжди" : lang === "ru" ? "навсегда" : lang === "es" ? "siempre" : lang === "de" ? "für immer" : "forever",
      href: "/login",
      testId: "link-price-free",
      features: [unlocked(f.scan3), unlocked(f.basic), locked(f.full), locked(f.monitor), locked(f.api)],
    },
    {
      name: "Single",
      price: "$3",
      note: perReport,
      href: "/pricing?single=1",
      testId: "link-price-single",
      features: [unlocked(f.scanUnl), unlocked(f.full), locked(f.monitor), locked(f.api), locked(f.vpn3)],
    },
    {
      name: "PRO",
      price: "$9",
      note: perMonth,
      href: "/pricing?plan=PRO&code=DARKNEU",
      testId: "link-price-pro",
      hot: true,
      badge: mostPopular,
      features: [unlocked(f.scanUnl), unlocked(f.full), unlocked(f.monitor), unlocked(f.api), unlocked(f.vpn3)],
    },
    {
      name: "Enterprise",
      price: "$29",
      note: perMonth,
      href: "/pricing?plan=ENTERPRISE",
      testId: "link-price-enterprise",
      features: [unlocked(f.scanUnl), unlocked(f.full), unlocked(f.monitor), unlocked(f.bulk), unlocked(f.pdf)],
    },
  ];

  return (
    <section className="border-t border-white/[0.06]">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
        <div className="mb-10 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center rounded-full border border-cyan-400/20 bg-cyan-500/[0.06] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-cyan-300/90">
              {sectionLabel}
            </div>
            <h2 className="text-[24px] font-semibold tracking-tight text-white sm:text-[28px]">{headline}</h2>
          </div>
          <Link href="/pricing">
            <span className="cursor-pointer text-[13px] text-zinc-400 transition-colors hover:text-white" data-testid="link-pricing-all">
              {seeAll}
            </span>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((p) => (
            <Link key={p.name} href={p.href}>
              <span
                className={`relative flex h-full cursor-pointer flex-col gap-5 rounded-2xl border p-5 transition-all ${
                  p.hot
                    ? "border-cyan-400/40 bg-gradient-to-b from-cyan-500/[0.08] to-[#0D0D10] shadow-[0_0_40px_-12px_rgba(34,211,238,0.2)] hover:border-cyan-400/60"
                    : "border-white/[0.08] bg-[#0D0D10] hover:border-white/[0.18] hover:bg-[#111116]"
                }`}
                data-testid={p.testId}
              >
                {p.badge && (
                  <span className="absolute -top-px left-4 inline-flex items-center rounded-b-lg bg-cyan-400 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-black">
                    {p.badge}
                  </span>
                )}
                <div>
                  <div className={`mb-1 text-[11px] font-semibold uppercase tracking-widest ${p.hot ? "text-cyan-300" : "text-zinc-400"}`}>
                    {p.name}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[28px] font-bold text-white">{p.price}</span>
                    <span className="text-[12px] text-zinc-500">{p.note}</span>
                  </div>
                </div>
                <ul className="flex-1 space-y-2">
                  {p.features.map((feat) => (
                    <li key={feat.text} className={`flex items-start gap-2 text-[12px] ${feat.included ? "text-zinc-300" : "text-zinc-700"}`}>
                      {feat.included
                        ? <Check className={`mt-0.5 h-3 w-3 shrink-0 ${p.hot ? "text-cyan-400" : "text-zinc-500"}`} />
                        : <span className="mt-0.5 h-3 w-3 shrink-0 text-[10px] leading-none text-zinc-700 select-none">✕</span>
                      }
                      {feat.text}
                    </li>
                  ))}
                </ul>
                <span className={`inline-flex h-9 w-full items-center justify-center rounded-xl text-[12.5px] font-semibold transition-colors ${
                  p.hot
                    ? "bg-cyan-400 text-black hover:bg-cyan-300"
                    : "border border-white/15 bg-white/[0.04] text-white hover:bg-white/[0.08]"
                }`}>
                  {p.hot ? (lang === "uk" ? "Вибрати PRO" : lang === "ru" ? "Выбрать PRO" : lang === "es" ? "Elegir PRO" : lang === "de" ? "PRO wählen" : "Get PRO") : (lang === "uk" ? "Почати" : lang === "ru" ? "Начать" : lang === "es" ? "Empezar" : lang === "de" ? "Starten" : "Get started")}
                </span>
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-6 flex justify-center">
          <div className="inline-flex items-center gap-2.5 rounded-full border border-cyan-400/[0.20] bg-cyan-500/[0.06] px-5 py-2 text-[12px] text-cyan-300/80">
            <Sparkles className="h-3 w-3 text-cyan-400/60 shrink-0" />
            <span>{lang === "uk" ? "Промокод" : lang === "ru" ? "Промокод" : lang === "es" ? "Código" : lang === "de" ? "Code" : "Promo code"}</span>
            <span className="rounded bg-cyan-400/10 px-1.5 py-0.5 font-mono font-bold text-cyan-300">DARKNEU</span>
            <span className="text-cyan-400/50">→</span>
            <span>{promoNote}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────── Trust strip ─────────── */
function TrustStrip({ stats }: { stats: SiteStats | null }) {
  const { lang } = useTranslation();
  const L = {
    sources: lang === "uk" ? "OSINT-джерел" : lang === "ru" ? "OSINT-источников" : lang === "es" ? "Fuentes OSINT" : lang === "de" ? "OSINT-Quellen" : "OSINT sources",
    leakDB:  lang === "uk" ? "Баз витоків" : lang === "ru" ? "Баз утечек" : lang === "es" ? "Bases de filtraciones" : lang === "de" ? "Leak-Datenbanken" : "Leak databases",
    today:   lang === "uk" ? "Перевірок сьогодні" : lang === "ru" ? "Проверок сегодня" : lang === "es" ? "Escaneos hoy" : lang === "de" ? "Scans heute" : "Scans today",
    uptime:  lang === "uk" ? "Доступність" : lang === "ru" ? "Аптайм" : lang === "es" ? "Disponibilidad" : lang === "de" ? "Verfügbarkeit" : "Uptime",
    users:   lang === "uk" ? "Активних користувачів" : lang === "ru" ? "Активных пользователей" : lang === "es" ? "Usuarios activos" : lang === "de" ? "Aktive Nutzer" : "Active users",
    risk:    lang === "uk" ? "AI-оцінка ризику" : lang === "ru" ? "AI-оценка риска" : lang === "es" ? "Puntuación IA" : lang === "de" ? "KI-Risikobewertung" : "AI risk score",
  };
  type StatItem = { icon: typeof Database; label: string; raw?: number; suffix?: string; static?: string };
  const items: StatItem[] = [
    { icon: Database, label: L.sources, raw: OSINT_SOURCES.length, suffix: "+" },
    { icon: Shield,   label: L.leakDB,  raw: 14 },
    { icon: Users,    label: L.users,   raw: 2800, suffix: "+" },
    { icon: Activity, label: L.today,   static: stats?.checksToday ? stats.checksToday.toLocaleString("en-US") : "—" },
    { icon: Eye,      label: L.risk,    static: "0–100" },
    { icon: Zap,      label: L.uptime,  static: "99.9%" },
  ];
  return (
    <section className="border-t border-white/[0.06] bg-[#07070A]">
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-6">
        <div className="grid grid-cols-3 sm:grid-cols-6">
          {items.map(({ icon: Icon, label, raw, suffix, static: staticVal }, idx) => (
            <div
              key={label}
              className={`group relative flex flex-col items-center gap-2 px-4 py-6 text-center transition-colors ${idx !== 0 ? "border-l border-white/[0.05]" : ""} hover:bg-white/[0.015]`}
            >
              <div className="absolute top-0 left-1/2 h-[2px] w-10 -translate-x-1/2 rounded-full bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />
              <Icon className="h-3.5 w-3.5 text-cyan-300/50" />
              <div
                className="text-[26px] font-bold leading-none tracking-tight text-white"
                data-testid={`text-trust-${label.replace(/\s+/g, "-").toLowerCase()}`}
              >
                {raw !== undefined
                  ? <CountUp raw={raw} suffix={suffix ?? ""} />
                  : staticVal}
              </div>
              <div className="text-[10px] leading-snug text-zinc-600">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────── FAQ ─────────── */
function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  const { lang } = useTranslation();
  const headline = lang === "uk" ? "Часті запитання" : lang === "ru" ? "Частые вопросы" : lang === "es" ? "Preguntas frecuentes" : lang === "de" ? "Häufige Fragen" : "Frequently asked questions";
  type FaqItem = { q: string; a: string };
  const itemsByLang: Record<string, FaqItem[]> = {
    en: [
      { q: "Is this legal?", a: "Yes. We only use public sources and APIs: HIBP, AbuseIPDB, VirusTotal, on-chain data, OSINT catalogs. No leaked databases without legal basis." },
      { q: "What do I get for $3?", a: "A full report on one target: all findings, source list, linked entities, recommendations, and a downloadable PDF." },
      { q: "How is it different from Have I Been Pwned?", a: `HIBP only checks email breaches. DarkShare covers email, phone, username, wallet, domain and IP — using ${OSINT_SOURCES.length}+ open sources and threat feeds, not just one database.` },
      { q: "Are my queries stored?", a: "Free checks — no. Paid plans only store your own scan history, accessible only to you. Delete it in one click." },
      { q: "Can I get a refund?", a: "Yes — within 7 days for PRO subscription, no questions asked. Single reports are non-refundable, but you can see a preview for free." },
      { q: "How do I pay?", a: "Card (Stripe) with Apple/Google Pay, Telegram Stars, USDT/BTC. All methods available on the pricing page." },
    ],
    uk: [
      { q: "Це легально?", a: "Так. Використовуємо лише публічні джерела та API: HIBP, AbuseIPDB, VirusTotal, ончейн-дані, OSINT-каталоги. Жодних зливів без правових підстав." },
      { q: "Що я отримаю за $3?", a: "Повний звіт по одній цілі: всі знахідки, перелік джерел, пов'язані сутності, рекомендації, PDF для завантаження." },
      { q: "Чим відрізняється від Have I Been Pwned?", a: `HIBP перевіряє лише email-витоки. DarkShare охоплює email, телефон, username, гаманець, домен і IP — і використовує ${OSINT_SOURCES.length}+ відкритих джерел та threat-фідів.` },
      { q: "Чи зберігаються мої запити?", a: "Безплатні перевірки — ні. У платних тарифах зберігається лише історія твоїх власних перевірок, доступна тільки тобі. Видалити можна в один клік." },
      { q: "Чи можна повернути гроші?", a: "Так, протягом 7 днів по підписці PRO без запитань. Разовий звіт — без повернення, але ти можеш побачити превʼю безплатно." },
      { q: "Як оплатити?", a: "Картка (Stripe) з Apple/Google Pay, Telegram Stars, USDT/BTC. Всі способи доступні на сторінці тарифів." },
    ],
    ru: [
      { q: "Это легально?", a: "Да. Используем только публичные источники и API: HIBP, AbuseIPDB, VirusTotal, ончейн-данные, OSINT-каталоги. Никаких слитых баз без правовых оснований." },
      { q: "Что я получу за $3?", a: "Полный отчёт по одной цели: все находки, перечень источников, связанные сущности, рекомендации, PDF на скачивание." },
      { q: "Чем отличается от Have I Been Pwned?", a: `HIBP проверяет только email-утечки. DarkShare охватывает email, телефон, username, кошелёк, домен и IP — и использует ${OSINT_SOURCES.length}+ открытых источников и threat-фидов.` },
      { q: "Хранятся ли мои запросы?", a: "Бесплатные проверки — нет. В платных тарифах сохраняется только история твоих собственных проверок. Удалить можно в один клик." },
      { q: "Можно ли вернуть деньги?", a: "Да, в течение 7 дней по подписке PRO без вопросов. Разовый отчёт — невозвратный, но ты можешь увидеть превью бесплатно." },
      { q: "Как оплатить?", a: "Карта (Stripe) с Apple/Google Pay, Telegram Stars, USDT/BTC. Все способы доступны на странице тарифов." },
    ],
    es: [
      { q: "¿Es esto legal?", a: "Sí. Solo usamos fuentes y APIs públicas: HIBP, AbuseIPDB, VirusTotal, datos on-chain, catálogos OSINT. Sin bases de datos filtradas sin base legal." },
      { q: "¿Qué obtengo por $3?", a: "Un informe completo de un objetivo: todos los hallazgos, lista de fuentes, entidades vinculadas, recomendaciones y PDF descargable." },
      { q: "¿En qué se diferencia de Have I Been Pwned?", a: `HIBP solo verifica filtraciones de email. DarkShare cubre email, teléfono, usuario, billetera, dominio e IP — usando ${OSINT_SOURCES.length}+ fuentes abiertas.` },
      { q: "¿Se almacenan mis consultas?", a: "Verificaciones gratuitas — no. Los planes de pago solo guardan tu historial de búsquedas, accesible solo para ti. Elimínalo con un clic." },
      { q: "¿Puedo obtener un reembolso?", a: "Sí — dentro de 7 días para la suscripción PRO, sin preguntas. Los informes únicos no son reembolsables, pero puedes ver una vista previa gratis." },
      { q: "¿Cómo pago?", a: "Tarjeta (Stripe) con Apple/Google Pay, Telegram Stars, USDT/BTC." },
    ],
    de: [
      { q: "Ist das legal?", a: "Ja. Wir verwenden nur öffentliche Quellen und APIs: HIBP, AbuseIPDB, VirusTotal, On-Chain-Daten, OSINT-Kataloge. Keine geleakten Datenbanken ohne rechtliche Grundlage." },
      { q: "Was bekomme ich für $3?", a: "Einen vollständigen Bericht zu einem Ziel: alle Funde, Quellenliste, verknüpfte Entitäten, Empfehlungen und downloadbares PDF." },
      { q: "Was unterscheidet es von Have I Been Pwned?", a: `HIBP prüft nur E-Mail-Leaks. DarkShare deckt E-Mail, Telefon, Benutzernamen, Wallet, Domain und IP ab — mit ${OSINT_SOURCES.length}+ offenen Quellen.` },
      { q: "Werden meine Abfragen gespeichert?", a: "Kostenlose Checks — nein. Bezahlpläne speichern nur Ihren eigenen Scan-Verlauf. Löschen mit einem Klick." },
      { q: "Kann ich eine Rückerstattung erhalten?", a: "Ja — innerhalb von 7 Tagen für PRO-Abonnement, ohne Fragen. Einzelberichte sind nicht erstattungsfähig, aber Sie können eine kostenlose Vorschau sehen." },
      { q: "Wie bezahle ich?", a: "Karte (Stripe) mit Apple/Google Pay, Telegram Stars, USDT/BTC." },
    ],
  };
  const items = itemsByLang[lang] ?? itemsByLang.en;
  return (
    <section className="border-t border-white/[0.06] bg-[#07070A]">
      <div className="mx-auto max-w-3xl px-5 py-20 sm:py-24">
        <div className="mb-12 text-center">
          <div className="mb-3 inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-400">
            FAQ
          </div>
          <h2 className="text-[28px] font-semibold tracking-tight text-white sm:text-[34px]">{headline}</h2>
        </div>
        <div className="space-y-1">
          {items.map((it, i) => {
            const isOpen = open === i;
            return (
              <div
                key={i}
                className={`rounded-xl border transition-colors ${isOpen ? "border-white/[0.12] bg-[#0D0D10]" : "border-white/[0.06] bg-transparent hover:border-white/[0.10]"}`}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left"
                  data-testid={`button-faq-${i}`}
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/[0.04] text-[11px] font-mono text-zinc-600">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="flex-1 text-[14.5px] font-medium text-white">{it.q}</span>
                  <ChevronDown className={`h-4 w-4 shrink-0 text-zinc-500 transition-transform duration-200 ${isOpen ? "rotate-180 text-cyan-400" : ""}`} />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pl-[3.25rem]">
                    <p className="text-[13.5px] leading-relaxed text-zinc-400">{it.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-10 flex flex-col items-center gap-3 text-center">
          <p className="text-[13.5px] text-zinc-500">
            {lang === "uk" ? "Залишилися питання?" : lang === "ru" ? "Остались вопросы?" : lang === "es" ? "¿Tienes más preguntas?" : lang === "de" ? "Noch Fragen?" : "Still have questions?"}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <a href="https://t.me/darkshare_channel" target="_blank" rel="noopener" className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/[0.09] bg-white/[0.04] px-4 text-[12.5px] text-zinc-300 hover:border-white/[0.18] hover:text-white transition-colors">
              Telegram
            </a>
            <Link href="/pricing">
              <span className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full bg-cyan-400 px-4 text-[12.5px] font-semibold text-black hover:bg-cyan-300 transition-colors">
                {lang === "uk" ? "Переглянути тарифи" : lang === "ru" ? "Смотреть тарифы" : lang === "es" ? "Ver precios" : lang === "de" ? "Preise ansehen" : "View pricing"} →
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────── Compliance / Trust badges ─────────── */
function ComplianceBadges() {
  const { lang } = useTranslation();
  type StatusKind = "ready" | "progress" | "planned";
  const badges: { label: string; sub: string; status: StatusKind }[] = [
    { label: "GDPR",      status: "ready",    sub: lang === "uk" ? "Готовий" : lang === "ru" ? "Готово" : lang === "es" ? "Listo" : lang === "de" ? "Bereit" : "Ready" },
    { label: "CCPA",      status: "ready",    sub: lang === "uk" ? "Готовий" : lang === "ru" ? "Готово" : lang === "es" ? "Listo" : lang === "de" ? "Bereit" : "Ready" },
    { label: "PCI DSS",   status: "ready",    sub: "Via Stripe" },
    { label: "RFC 9116",  status: "ready",    sub: "security.txt ✓" },
    { label: "SOC 2 II",  status: "progress", sub: lang === "uk" ? "В процесі · Q4 ’26" : lang === "ru" ? "В процессе · Q4 ’26" : lang === "es" ? "En progreso · Q4 ’26" : lang === "de" ? "In Arbeit · Q4 ’26" : "In progress · Q4 ’26" },
    { label: "ISO 27001", status: "planned",  sub: lang === "uk" ? "Заплановано · Q1 ’27" : lang === "ru" ? "Запланировано · Q1 ’27" : lang === "es" ? "Planificado · Q1 ’27" : lang === "de" ? "Geplant · Q1 ’27" : "Planned · Q1 ’27" },
  ];
  const statusCfg: Record<StatusKind, { dot: string; ring: string; bg: string; tag: string }> = {
    ready:    { dot: "bg-emerald-400", ring: "ring-emerald-400/25", bg: "bg-emerald-500/[0.08]", tag: lang === "uk" ? "Активний" : lang === "ru" ? "Активен" : lang === "es" ? "Activo" : lang === "de" ? "Aktiv" : "Active" },
    progress: { dot: "bg-amber-400",   ring: "ring-amber-400/25",   bg: "bg-amber-500/[0.06]",   tag: lang === "uk" ? "В процесі" : lang === "ru" ? "В процессе" : lang === "es" ? "En curso" : lang === "de" ? "Laufend" : "In progress" },
    planned:  { dot: "bg-zinc-500",    ring: "ring-zinc-500/20",    bg: "bg-zinc-500/[0.05]",    tag: lang === "uk" ? "Заплановано" : lang === "ru" ? "Запланировано" : lang === "es" ? "Planificado" : lang === "de" ? "Geplant" : "Planned" },
  };
  const sectionBadge = lang === "uk" ? "Відповідність та довіра" : lang === "ru" ? "Соответствие и доверие" : lang === "es" ? "Cumplimiento & confianza" : lang === "de" ? "Compliance & Vertrauen" : "Compliance & trust";
  const headline = lang === "uk" ? "Побудовано за корпоративними стандартами" : lang === "ru" ? "Создано по корпоративным стандартам" : lang === "es" ? "Construido según estándares empresariales" : lang === "de" ? "Gebaut nach Unternehmensstandards" : "Built to enterprise standards";
  const trustCenterLabel = lang === "uk" ? "Центр довіри →" : lang === "ru" ? "Центр доверия →" : lang === "es" ? "Centro de confianza →" : lang === "de" ? "Vertrauenszentrum →" : "Trust Center →";
  return (
    <section className="border-t border-white/[0.06] bg-[#07070A]">
      <div className="mx-auto max-w-6xl px-5 py-14">
        <div className="mb-8 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <div className="mb-3 inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-400">
              {sectionBadge}
            </div>
            <h2 className="text-[22px] font-semibold tracking-tight text-white sm:text-[26px]">{headline}</h2>
          </div>
          <Link href="/trust">
            <span className="cursor-pointer text-[13px] text-zinc-400 transition-colors hover:text-white" data-testid="link-trust-center">
              {trustCenterLabel}
            </span>
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
          {badges.map((b) => {
            const cfg = statusCfg[b.status];
            return (
              <div
                key={b.label}
                className="flex flex-col gap-3 rounded-xl border border-white/[0.07] bg-[#0D0D10] p-4 transition-all hover:border-white/[0.14]"
                data-testid={`badge-compliance-${b.label.replace(/[^a-z0-9]/gi, "-").toLowerCase()}`}
              >
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ring-1 ${cfg.ring} ${cfg.bg}`}>
                  <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-white">{b.label}</div>
                  <div className="mt-0.5 text-[10.5px] leading-snug text-zinc-500">{b.sub}</div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-1.5">
          {(["ready", "progress", "planned"] as StatusKind[]).map((s) => (
            <span key={s} className="inline-flex items-center gap-1.5 text-[11px] text-zinc-600">
              <span className={`h-1.5 w-1.5 rounded-full ${statusCfg[s].dot}`} />
              {statusCfg[s].tag}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────── Community CTA ─────────── */
function CommunityCTA() {
  const { lang } = useTranslation();
  type TabKey = "curl" | "python" | "node" | "go";
  const [tab, setTab] = useState<TabKey>("curl");
  const L = {
    badge: lang === "uk" ? "Відкрита спільнота" : lang === "ru" ? "Открытое сообщество" : lang === "es" ? "Comunidad abierta" : lang === "de" ? "Offene Community" : "Open community",
    headline: lang === "uk" ? "Будуй з нами. SDK, документація, threat-intel дайджест." : lang === "ru" ? "Строй с нами. SDK, документация, threat-intel дайджест." : lang === "es" ? "Construye con nosotros. SDK, docs, digest de inteligencia." : lang === "de" ? "Baue mit uns. SDKs, Docs, Threat-Intel-Digest." : "Build with us. SDKs, docs, threat-intel digest.",
    desc: lang === "uk" ? "REST API з прикладами для curl, Python, Node, Go. Telegram-канал з щоденними IoC, GitHub для SDK-контрибуцій." : lang === "ru" ? "REST API с примерами для curl, Python, Node, Go. Telegram-канал с ежедневными IoC, GitHub для SDK-контрибуций." : lang === "es" ? "API REST con ejemplos para curl, Python, Node, Go. Canal de Telegram con IoCs diarios y SDK en GitHub." : lang === "de" ? "REST API mit Beispielen für curl, Python, Node, Go. Telegram-Kanal mit täglichen IoCs, GitHub für SDK-Beiträge." : "REST API with examples for curl, Python, Node, Go. Open Telegram channel with daily IoCs, GitHub for SDK contributions.",
    explore: lang === "uk" ? "Дослідити спільноту" : lang === "ru" ? "Исследовать сообщество" : lang === "es" ? "Explorar comunidad" : lang === "de" ? "Community erkunden" : "Explore community",
    telegram: lang === "uk" ? "Telegram-канал" : lang === "ru" ? "Telegram-канал" : lang === "es" ? "Canal de Telegram" : lang === "de" ? "Telegram-Kanal" : "Telegram channel",
    github: lang === "uk" ? "GitHub SDK" : lang === "ru" ? "GitHub SDK" : lang === "es" ? "SDK en GitHub" : lang === "de" ? "GitHub SDKs" : "GitHub SDKs",
  };
  return (
    <section className="border-t border-white/[0.06]">
      <div className="mx-auto max-w-6xl px-5 py-16">
        <div className="rounded-2xl border border-cyan-400/[0.15] bg-gradient-to-br from-cyan-500/[0.07] via-[#0D0D10] to-[#0A0A0D] p-6 shadow-[0_0_60px_-20px_rgba(34,211,238,0.15)] sm:p-10">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-center">
            <div>
              <div className="mb-3 inline-flex items-center rounded-full border border-cyan-400/20 bg-cyan-500/[0.06] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-cyan-300/80">{L.badge}</div>
              <h2 className="text-[24px] font-semibold leading-tight tracking-tight text-white sm:text-[30px]">
                {L.headline}
              </h2>
              <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-zinc-400">{L.desc}</p>
              <div className="mt-6 flex flex-wrap items-center gap-2">
                <Link href="/community">
                  <span className="inline-flex h-10 cursor-pointer items-center rounded-lg bg-white px-4 text-[13px] font-medium text-black hover:bg-zinc-200" data-testid="link-community-explore">
                    {L.explore}
                  </span>
                </Link>
                <a href="https://t.me/darkshare_channel" target="_blank" rel="noopener" className="inline-flex h-10 items-center rounded-lg border border-white/15 px-4 text-[13px] font-medium text-white hover:bg-white/5" data-testid="link-community-telegram">
                  {L.telegram}
                </a>
                <a href="https://github.com/darkshare" target="_blank" rel="noopener" className="inline-flex h-10 items-center rounded-lg border border-white/15 px-4 text-[13px] font-medium text-white hover:bg-white/5" data-testid="link-community-github">
                  {L.github}
                </a>
              </div>
            </div>
            <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#050507]">
              {/* Window chrome */}
              <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2.5">
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
                  <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
                  <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
                </div>
                <span className="font-mono text-[10px] text-zinc-600">darkshare.store/api/check</span>
              </div>
              {/* Syntax-highlighted code per language */}
              {/* Code snippets per language */}
              {(() => {
                const S = {
                  curl: [
                    {c:"zn5",t:"# 60-second integration\n"},
                    {c:"cy3",t:"curl"},{c:"zn4",t:" -H "},{c:"amb",t:'\x22X-API-Key: $DS_KEY\x22'},{c:"zn4",t:" \\\n  "},
                    {c:"em3",t:"https://darkshare.store/api/check"},{c:"zn4",t:" \\\n  -d "},
                    {c:"amb",t:"'{\"type\":\"email\",\"value\":\"user@example.com\"}'"},
                    {c:"zn6",t:"\n\n# \u2192 risk_score \u00b7 findings \u00b7 sources"},
                  ],
                  python: [
                    {c:"pu4",t:"import"},{c:"zn3",t:" requests\n\n"},
                    {c:"zn4",t:"resp = requests."},{c:"cy3",t:"post"},{c:"zn4",t:"(\n  "},
                    {c:"amb",t:"\x22https://darkshare.store/api/check\x22"},{c:"zn4",t:",\n  headers={"},
                    {c:"amb",t:"\x22X-API-Key\x22"},{c:"zn4",t:": DS_KEY},\n  json={"},
                    {c:"amb",t:"\x22type\x22"},{c:"zn4",t:": "},{c:"amb",t:"\x22email\x22"},{c:"zn4",t:", "},
                    {c:"amb",t:"\x22value\x22"},{c:"zn4",t:": "},{c:"amb",t:"\x22user@example.com\x22"},{c:"zn4",t:"}\n)\n"},
                    {c:"zn6",t:"# data = resp.json()  # risk_score, findings"},
                  ],
                  node: [
                    {c:"pu4",t:"const"},{c:"zn3",t:" res = "},{c:"pu4",t:"await"},{c:"cy3",t:" fetch"},
                    {c:"zn4",t:"("},{c:"amb",t:"\x22https://darkshare.store/api/check\x22"},{c:"zn4",t:", {\n  method: "},
                    {c:"amb",t:"\x22POST\x22"},{c:"zn4",t:",\n  headers: { "},{c:"amb",t:"\x22X-API-Key\x22"},
                    {c:"zn4",t:": DS_KEY },\n  body: JSON.stringify({\n    type: "},
                    {c:"amb",t:"\x22email\x22"},{c:"zn4",t:", value: "},{c:"amb",t:"\x22user@example.com\x22"},
                    {c:"zn4",t:"\n  })\n});\n"},{c:"zn6",t:"// const data = await res.json();"},
                  ],
                  go: [
                    {c:"zn4",t:"body := strings."},{c:"cy3",t:"NewReader"},{c:"zn4",t:"(`"},
                    {c:"amb",t:"{\"type\":\"email\",\"value\":\"user@example.com\"}"},{c:"zn4",t:"`\n"},
                    {c:"zn4",t:"req, _ := http."},{c:"cy3",t:"NewRequest"},
                    {c:"zn4",t:"("},{c:"amb",t:"\x22POST\x22"},{c:"zn4",t:", url, body)\nreq.Header."},
                    {c:"cy3",t:"Set"},{c:"zn4",t:"("},{c:"amb",t:"\x22X-API-Key\x22"},{c:"zn4",t:", DS_KEY)\n"},
                    {c:"zn6",t:"// resp, _ := http.DefaultClient.Do(req)"},
                  ],
                } as const;
                const colorMap: Record<string,string> = {
                  cy3:"text-cyan-300", amb:"text-amber-300", em3:"text-emerald-300",
                  pu4:"text-purple-400", zn3:"text-zinc-300", zn4:"text-zinc-400",
                  zn5:"text-zinc-500", zn6:"text-zinc-600",
                };
                return (
                  <pre className="min-h-[120px] overflow-x-auto p-5 font-mono text-[12px] leading-relaxed">
                    {S[tab].map((seg, i) => (
                      <span key={i} className={colorMap[seg.c]}>{seg.t}</span>
                    ))}
                  </pre>
                );
              })()}
              {/* Language tabs */}
              <div className="flex flex-wrap gap-1.5 border-t border-white/[0.05] px-5 py-3">
                {(["curl","python","node","go"] as TabKey[]).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setTab(l)}
                    className={`rounded-md border px-2.5 py-1 font-mono text-[11px] transition-all ${
                      tab === l
                        ? "border-cyan-400/40 bg-cyan-500/[0.10] text-cyan-300"
                        : "border-white/[0.07] bg-white/[0.03] text-zinc-500 hover:border-white/15 hover:text-zinc-300"
                    }`}
                  >
                    {l === "node" ? "Node.js" : l}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────── Social proof ─────────── */
function SocialProofSection() {
  const { lang } = useTranslation();
  const testimonials = [
    {
      text: "Found my email in 3 databases I never knew about. Changed all passwords immediately. Worth every penny.",
      author: "Alex M.",
      role: lang === "uk" ? "Дослідник безпеки" : lang === "ru" ? "Исследователь безопасности" : lang === "es" ? "Investigador de seguridad" : lang === "de" ? "Sicherheitsforscher" : "Security Researcher",
      avatar: "AM",
      rating: 5,
    },
    {
      text: "The domain OSINT module is incredible — found subdomains and SSL issues our pentest completely missed.",
      author: "Sarah K.",
      role: lang === "uk" ? "DevSecOps Інженер" : lang === "ru" ? "DevSecOps-инженер" : lang === "es" ? "Ingeniera DevSecOps" : lang === "de" ? "DevSecOps-Ingenieur" : "DevSecOps Engineer",
      avatar: "SK",
      rating: 5,
    },
    {
      text: "Discovered my Telegram API token was exposed in a public forum. Fixed it in minutes. Potentially saved my bot.",
      author: "Denis T.",
      role: lang === "uk" ? "Розробник ботів" : lang === "ru" ? "Разработчик ботов" : lang === "es" ? "Desarrollador de bots" : lang === "de" ? "Bot-Entwickler" : "Bot Developer",
      avatar: "DT",
      rating: 5,
    },
    {
      text: "Used it to vet a vendor's IP before signing a contract. Found it linked to fraud networks. Saved us $40k.",
      author: "Maria V.",
      role: lang === "uk" ? "Фінансовий аналітик" : lang === "ru" ? "Финансовый аналитик" : lang === "es" ? "Analista financiera" : lang === "de" ? "Finanzanalystin" : "Financial Analyst",
      avatar: "MV",
      rating: 5,
    },
  ];

  const headerBadge = lang === "uk" ? "Довіряють професіонали" : lang === "ru" ? "Доверяют профессионалы" : lang === "es" ? "De confianza para profesionales" : lang === "de" ? "Von Profis vertraut" : "Trusted by professionals";
  const headerTitle = lang === "uk" ? "2 800+ дослідників безпеки, аналітиків і розробників" : lang === "ru" ? "2 800+ исследователей безопасности, аналитиков и разработчиков" : lang === "es" ? "Más de 2.800 investigadores de seguridad, analistas y desarrolladores" : lang === "de" ? "2.800+ Sicherheitsforscher, Analysten & Entwickler" : "2,800+ security researchers, analysts & developers";
  const headerSub = lang === "uk" ? "Реальні користувачі. Реальні результати." : lang === "ru" ? "Реальные пользователи. Реальные результаты." : lang === "es" ? "Usuarios reales. Resultados reales." : lang === "de" ? "Echte Nutzer. Echte Ergebnisse." : "Real users. Real results.";
  const statLabels = {
    users: lang === "uk" ? "Активних користувачів" : lang === "ru" ? "Активных пользователей" : lang === "es" ? "Usuarios activos" : lang === "de" ? "Aktive Nutzer" : "Active users",
    scans: lang === "uk" ? "Сканувань виконано" : lang === "ru" ? "Сканирований выполнено" : lang === "es" ? "Escaneos realizados" : lang === "de" ? "Scans durchgeführt" : "Scans run",
    uptime: lang === "uk" ? "Доступність" : lang === "ru" ? "Время работы" : lang === "es" ? "Tiempo activo" : lang === "de" ? "Verfügbarkeit" : "Uptime",
  };

  return (
    <section className="border-t border-white/5">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:py-16">
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-400">{headerBadge}</div>
          <h2 className="text-[22px] font-semibold tracking-tight text-white sm:text-[26px]">
            {headerTitle}
          </h2>
          <p className="mt-2 text-[13.5px] text-zinc-500">{headerSub}</p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0D0D10] p-6 transition-all hover:border-white/[0.14] hover:bg-[#111116]"
              data-testid={`card-testimonial-${i}`}
            >
              <span className="pointer-events-none absolute right-3 top-0 select-none font-serif text-[80px] leading-none text-white/[0.035]" aria-hidden>“</span>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="h-3 w-3 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="relative flex-1 text-[14px] leading-relaxed text-zinc-300">
                {t.text}
              </p>
              <div className="flex items-center gap-3 border-t border-white/[0.05] pt-4">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-cyan-500/40 via-zinc-700 to-zinc-800 text-[11px] font-bold text-cyan-200">
                  {t.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-white">{t.author}</div>
                  <div className="text-[11px] text-zinc-500">{t.role}</div>
                </div>
                <span className="shrink-0 inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-500/[0.07] px-2 py-0.5 text-[9.5px] font-medium text-emerald-400/70">
                  <span className="h-1 w-1 rounded-full bg-emerald-400 inline-block" />
                  {lang === "uk" ? "Перевірено" : lang === "ru" ? "Проверено" : lang === "es" ? "Verificado" : lang === "de" ? "Verifiziert" : "Verified"}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-col divide-y divide-white/[0.04] overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0D0D10] sm:flex-row sm:divide-x sm:divide-y-0">
          {[
            { icon: Users,     value: "2,800+",  label: statLabels.users },
            { icon: TrendingUp,value: "47,000+", label: statLabels.scans },
            { icon: Shield,    value: "99.9%",   label: statLabels.uptime },
          ].map(({ icon: Icon, value, label }) => (
            <div
              key={label}
              className="flex flex-1 items-center gap-4 px-6 py-5"
              data-testid={`stat-${label.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/[0.07] bg-white/[0.03]">
                <Icon className="h-4 w-4 text-cyan-300/60" />
              </div>
              <div>
                <div className="text-[22px] font-bold leading-none text-white">{value}</div>
                <div className="mt-1 text-[11px] text-zinc-600">{label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────── Live activity ticker ─────────── */
function LiveActivity() {
  const { lang } = useTranslation();
  const [newest, setNewest] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setNewest((n) => (n + 1) % 6), 3000);
    return () => clearInterval(t);
  }, []);
  const riskLabels = {
    HIGH:     lang === "uk" ? "ВИСОКИЙ" : lang === "ru" ? "ВЫСОКИЙ" : lang === "es" ? "ALTO"    : lang === "de" ? "HOCH"     : "HIGH",
    MEDIUM:   lang === "uk" ? "СЕРЕДНІЙ": lang === "ru" ? "СРЕДНИЙ" : lang === "es" ? "MEDIO"   : lang === "de" ? "MITTEL"   : "MEDIUM",
    LOW:      lang === "uk" ? "НИЗЬКИЙ" : lang === "ru" ? "НИЗКИЙ"  : lang === "es" ? "BAJO"    : lang === "de" ? "NIEDRIG"  : "LOW",
    CRITICAL: lang === "uk" ? "КРИТИЧНИЙ":lang === "ru" ? "КРИТИЧ." : lang === "es" ? "CRÍTICO" : lang === "de" ? "KRITISCH" : "CRITICAL",
  };
  type Activity = { Icon: typeof Mail; target: string; label: string; score: number; cls: string; bar: string; ago: number };
  const activities: Activity[] = [
    { Icon: Mail,    target: "j***n@gmail.com",  label: riskLabels.HIGH,     score: 74, cls: "text-rose-400",    bar: "bg-rose-500",    ago: 2  },
    { Icon: Network, target: "91.108.4.***",      label: riskLabels.MEDIUM,   score: 45, cls: "text-amber-400",   bar: "bg-amber-500",   ago: 5  },
    { Icon: Wallet,  target: "0x742d...c4aB",     label: riskLabels.LOW,      score: 12, cls: "text-emerald-400", bar: "bg-emerald-500", ago: 8  },
    { Icon: Globe,   target: "fake-shop.net",     label: riskLabels.CRITICAL, score: 89, cls: "text-rose-400",    bar: "bg-rose-500",    ago: 11 },
    { Icon: Phone,   target: "+38067***4521",     label: riskLabels.HIGH,     score: 67, cls: "text-rose-400",    bar: "bg-rose-500",    ago: 14 },
    { Icon: AtSign,  target: "user_d4rk_***",     label: riskLabels.MEDIUM,   score: 38, cls: "text-amber-400",   bar: "bg-amber-500",   ago: 17 },
  ];
  const agoUnit = lang === "uk" ? "хв" : lang === "ru" ? "мин" : lang === "es" ? "min" : lang === "de" ? "Min." : "min";
  const liveLabel = lang === "uk" ? "Поточні сканування" : lang === "ru" ? "Текущие сканирования" : lang === "es" ? "Escaneos en vivo" : lang === "de" ? "Live-Scans" : "Live scans";
  const riskLabel = lang === "uk" ? "Ризик" : lang === "ru" ? "Риск" : lang === "es" ? "Riesgo" : lang === "de" ? "Risiko" : "Risk";

  return (
    <section className="border-t border-white/[0.06]">
      <div className="mx-auto max-w-6xl px-5 py-10">
        <div className="mb-5 flex items-center gap-3">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-zinc-500">{liveLabel}</span>
          <span className="rounded-full border border-white/[0.07] bg-white/[0.03] px-2 py-0.5 font-mono text-[10px] text-zinc-600">6 / 24h</span>
          <div className="flex-1 h-px bg-gradient-to-r from-emerald-400/15 to-transparent" />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {activities.map((a, i) => (
            <div
              key={i}
              className={`flex flex-col gap-3 rounded-xl border p-3.5 transition-all duration-500 ${i === newest ? "border-cyan-400/30 bg-[#0E1214] shadow-[0_0_16px_-4px_rgba(34,211,238,0.18)]" : "border-white/[0.07] bg-[#0D0D10]"}`}
              data-testid={`card-live-${i}`}
            >
              <div className="flex items-center justify-between gap-1">
                <div className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-white/[0.04]">
                  <a.Icon className="h-3 w-3 text-zinc-500" />
                </div>
                <span className="font-mono text-[9.5px] text-zinc-700">{a.ago} {agoUnit}</span>
              </div>
              <span className="font-mono text-[11px] leading-none text-zinc-300 truncate">{a.target}</span>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className={`text-[9.5px] font-bold tracking-wider ${a.cls}`}>{a.label}</span>
                  <span className={`font-mono text-[11px] font-bold ${a.cls}`}>{a.score}</span>
                </div>
                <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
                  <div className={`h-1 rounded-full ${a.bar} opacity-80`} style={{ width: `${a.score}%` }} />
                </div>
                <div className="text-[9px] text-zinc-700">/ 100</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────── CTA bottom ─────────── */
function CTABottom() {
  const { lang } = useTranslation();
  const headline = lang === "uk" ? "Дізнайся, що про тебе знає інтернет." : lang === "ru" ? "Узнай, что интернет знает о тебе." : lang === "es" ? "Descubre qué sabe internet sobre ti." : lang === "de" ? "Finde heraus, was das Internet über dich weiß." : "Find out what the internet knows about you.";
  const sub = lang === "uk" ? "Перша перевірка — безплатно. Без реєстрації, без email, без зобов'язань." : lang === "ru" ? "Первая проверка — бесплатно. Без регистрации, без email, без обязательств." : lang === "es" ? "Primera verificación gratis. Sin registro, sin email, sin compromisos." : lang === "de" ? "Erste Prüfung kostenlos. Ohne Registrierung, ohne E-Mail, ohne Verpflichtung." : "First scan is free. No signup, no email, no commitment.";
  const scanNow = lang === "uk" ? "Перевірити зараз" : lang === "ru" ? "Проверить сейчас" : lang === "es" ? "Escanear ahora" : lang === "de" ? "Jetzt prüfen" : "Scan now →";
  const allPlans = lang === "uk" ? "Переглянути тарифи" : lang === "ru" ? "Смотреть тарифы" : lang === "es" ? "Ver precios" : lang === "de" ? "Alle Pläne" : "View pricing";
  const promoCode = lang === "uk" ? <>Код <span className="font-mono font-bold">DARKNEU</span> → −50% на перший місяць PRO</> : lang === "ru" ? <>Код <span className="font-mono font-bold">DARKNEU</span> → −50% на первый месяц PRO</> : lang === "es" ? <>Código <span className="font-mono font-bold">DARKNEU</span> → −50% en tu primer mes PRO</> : lang === "de" ? <>Code <span className="font-mono font-bold">DARKNEU</span> → −50% auf den ersten PRO-Monat</> : <>Code <span className="font-mono font-bold">DARKNEU</span> → −50% off your first PRO month</>;
  return (
    <section className="border-t border-white/[0.06]">
      <div className="relative mx-auto max-w-6xl px-5 py-20 sm:py-28">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[500px] w-[800px] rounded-full bg-cyan-500/[0.07] blur-[140px]" />
        </div>
        {/* Animated ring */}
        <div className="pointer-events-none absolute inset-x-4 inset-y-8 rounded-3xl border border-cyan-400/[0.07] sm:inset-x-10" aria-hidden>
          <div className="cta-ring-glow absolute inset-0 rounded-3xl" />
        </div>
        <div className="relative mx-auto max-w-2xl text-center">
          {/* Stars row */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-1.5">
            <span className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
              ))}
            </span>
            <span className="text-[12px] text-zinc-400">4.9 / 5 &middot; 2,800+ {lang === "uk" ? "користувачів" : lang === "ru" ? "пользователей" : lang === "es" ? "usuarios" : lang === "de" ? "Nutzer" : "users"}</span>
          </div>
          <h2 className="text-[32px] font-semibold tracking-tight text-white sm:text-[46px] sm:leading-[1.05]">
            {headline}
          </h2>
          <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-zinc-500">
            {sub}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="#top"
              className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-cyan-400 px-6 text-[14px] font-semibold text-black shadow-[0_0_32px_-6px_rgba(34,211,238,0.5)] transition-all hover:bg-cyan-300 active:scale-[0.98] sm:w-auto"
              data-testid="link-cta-check"
            >
              {scanNow}
            </a>
            <Link href="/pricing?code=DARKNEU">
              <span
                className="inline-flex h-12 w-full cursor-pointer items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] px-6 text-[14px] font-medium text-white transition-colors hover:bg-white/[0.08] sm:w-auto"
                data-testid="link-cta-pricing"
              >
                {allPlans}
              </span>
            </Link>
          </div>
          <p className="mt-5 text-[12px] text-cyan-400/70">
            {promoCode}
          </p>
        </div>
      </div>
    </section>
  );
}

/* ─────────── Page ─────────── */
export default function Home() {
  const [stats, setStats] = useState<SiteStats | null>(null);

  useEffect(() => {
    document.documentElement.style.setProperty("background-color", "#0A0A0A");
    document.body.style.backgroundColor = "#0A0A0A";
    document.body.style.color = "#fff";
    return () => {
      document.documentElement.style.removeProperty("background-color");
      document.body.style.backgroundColor = "";
    };
  }, []);

  // Scroll-triggered section fade-in
  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>("#home-sections section");
    if (!sections.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.06, rootMargin: "0px 0px -32px 0px" }
    );
    sections.forEach((s) => {
      s.classList.add("section-fade");
      observer.observe(s);
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    fetch("/api/stats", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setStats(d))
      .catch(() => {});
  }, []);

  return (
    <div id="top" className="min-h-screen bg-[#0A0A0A] text-white">
      <Seo
        title="AI-powered OSINT & Threat Intelligence"
        description="17 OSINT modules · IP, crypto, email, domain, CVE, EXIF, GEOINT · AI risk scoring · real-time monitoring · branded PDF reports · full REST API. Free tier available."
        keywords="OSINT, threat intelligence, IP lookup, wallet OSINT, email leak, domain analysis, CVE scanner, EXIF, GEOINT, security API"
        path="/"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "What is DARKSHARE?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "DARKSHARE is an AI-powered OSINT and threat intelligence platform with 17 scanning modules — IP, crypto wallet, email, domain, URL, CVE, EXIF, GEOINT and more — plus real-time monitoring, branded PDF reports, and a full REST API.",
              },
            },
            {
              "@type": "Question",
              name: "Is there a free tier?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Yes. The FREE tier lets you run quick checks daily. PRO ($9/mo) unlocks unlimited scans, monitoring, PDF exports and the API. ENTERPRISE ($29/mo) and GROUPS ($49/mo) add bulk checks and team features.",
              },
            },
            {
              "@type": "Question",
              name: "Can I use DARKSHARE via API?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Yes — PRO, ENTERPRISE and GROUPS plans include REST API access. Generate a key in the web account or directly in the Telegram bot, then call /api/check, /api/reports, /api/watches and more.",
              },
            },
            {
              "@type": "Question",
              name: "What payment methods are supported?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Card (Visa / Mastercard) via Stripe with Apple Pay & Google Pay support, Telegram Stars, and crypto.",
              },
            },
          ],
        }}
      />
      <PublicHeader />
      <HeroCheck stats={stats} />
      <div id="home-sections">
        <TrustedAggregators />
        <LiveActivity />
        <WhatWeCheck />
        <HowItWorks />
        <Sources />
        <SocialProofSection />
        <TrustStrip stats={stats} />
        <ComplianceBadges />
        <PricingTeaser />
        <CommunityCTA />
        <FAQ />
        <CTABottom />
      </div>
      <Footer />
    </div>
  );
}
