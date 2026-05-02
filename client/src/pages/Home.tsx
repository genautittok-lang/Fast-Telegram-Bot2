import { useState, useEffect, useRef, useMemo } from "react";
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
} from "lucide-react";
import { Footer } from "@/components/Footer";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
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
  return s.replace(/^[^\w\d\sа-яА-ЯёЁїЇіІєЄґҐ]+\s*/u, "").trim();
}

/* ─────────── TopBar ─────────── */
function TopBar() {
  const { t } = useTranslation();
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-[#0A0A0A]/90 backdrop-blur supports-[backdrop-filter]:bg-[#0A0A0A]/70">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
        <Link href="/">
          <span className="flex cursor-pointer items-center gap-2" data-testid="link-logo">
            <div className="grid h-7 w-7 place-items-center rounded-md bg-cyan-500/10 ring-1 ring-cyan-400/30">
              <Shield className="h-3.5 w-3.5 text-cyan-300" />
            </div>
            <span className="text-[15px] font-semibold tracking-tight text-white">DarkShare</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-[13px] text-zinc-400 md:flex">
          <Link href="/pricing"><span className="cursor-pointer transition-colors hover:text-white" data-testid="link-pricing">Pricing</span></Link>
          <Link href="/api-docs"><span className="cursor-pointer transition-colors hover:text-white" data-testid="link-api">API</span></Link>
          <Link href="/guide"><span className="cursor-pointer transition-colors hover:text-white" data-testid="link-guide">Guide</span></Link>
          <Link href="/vpn"><span className="cursor-pointer transition-colors hover:text-white" data-testid="link-vpn">VPN</span></Link>
          <Link href="/trust"><span className="cursor-pointer transition-colors hover:text-white" data-testid="link-trust">Trust</span></Link>
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <LanguageSwitcher />
          <a
            href="https://t.me/darkshare_bot"
            target="_blank"
            rel="noopener"
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-cyan-400/25 bg-cyan-500/10 px-2.5 text-[12.5px] font-medium text-cyan-200 transition-colors hover:bg-cyan-500/15 sm:h-9 sm:px-3 sm:text-[13px]"
            data-testid="link-telegram-bot"
            aria-label="Open DarkShare Telegram bot"
          >
            <Bot className="h-3.5 w-3.5" />
            <span>Bot</span>
          </a>
          <Link href="/login">
            <span className="cursor-pointer rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-[12.5px] font-medium text-zinc-200 transition-colors hover:border-white/20 hover:bg-white/[0.06] sm:border-0 sm:bg-transparent sm:px-3 sm:text-[13px] sm:hover:bg-white/5" data-testid="link-login">
              {t('auth.signIn')}
            </span>
          </Link>
          <Link href="/pricing">
            <span className="cursor-pointer rounded-md bg-white px-2.5 py-1.5 text-[12.5px] font-medium text-black transition-colors hover:bg-zinc-200 sm:px-3 sm:text-[13px]" data-testid="link-pro">
              PRO
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ─────────── Hero + Check ─────────── */
function HeroCheck({ stats }: { stats: SiteStats | null }) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QuickCheckResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
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
      setResult(data as QuickCheckResponse);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
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

      <div className="relative mx-auto max-w-6xl px-5 pt-8 pb-12 sm:pt-20 sm:pb-20 lg:pt-28">
        <div className="grid items-start gap-10 lg:grid-cols-[1.05fr_minmax(0,440px)] lg:gap-16">
          {/* LEFT — copy + form */}
          <div className="lg:pt-2">
            <div className="inline-flex max-w-full items-center gap-2 truncate rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11.5px] text-zinc-400 sm:text-[12px]">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
              <span className="truncate">{t('landing.hero.badge', { N: String(OSINT_SOURCES.length) })}</span>
            </div>

            <h1
              className="mt-5 text-balance text-[34px] font-semibold leading-[1.05] tracking-tight text-white sm:mt-6 sm:text-[52px] sm:leading-[1.02] lg:text-[64px]"
              data-testid="text-hero-title"
            >
              {t('landing.hero.title')}{" "}
              <span className="text-cyan-300">{t('landing.hero.titleHighlight')}</span>
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
                    {typeIcon(detected, "h-3 w-3")} detected: {typeLabel(detected, lang)}
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

            {/* Mobile / md — result rendered inline (one mount) */}
            {!isLg && result && (
              <div ref={resultRef} className="mt-10">
                <ResultCard data={result} />
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
        <div className="flex items-center gap-1.5 border-b border-white/5 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
          <span className="ml-3 inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.02] px-2 py-0.5 text-[10.5px] font-mono text-zinc-500">
            <Lock className="h-3 w-3" /> darkshare.io / scan
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
            <span>Sources scanned</span>
            <span>73 applicable · {OSINT_SOURCES.length}</span>
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
function ResultCard({ data }: { data: QuickCheckResponse }) {
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
                    <span className="flex h-9 w-full cursor-pointer items-center justify-center rounded-lg bg-white px-3.5 text-[12.5px] font-semibold text-black hover:bg-zinc-200 transition-colors" data-testid="link-buy-single">
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
}

/* ─────────── Trusted aggregators strip ─────────── */
function TrustedAggregators() {
  const sources = [
    "HIBP", "Shodan", "VirusTotal", "AbuseIPDB", "GreyNoise",
    "Censys", "MaxMind", "IPQualityScore", "URLhaus", "Etherscan",
    "WHOIS", "PhishTank",
  ];
  return (
    <section className="border-t border-white/5 bg-[#08080A]">
      <div className="mx-auto max-w-6xl px-5 py-10">
        <div className="text-center text-[11px] uppercase tracking-[0.2em] text-zinc-600">
          Aggregating signal from
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-[13px] font-mono">
          {sources.map((s) => (
            <span
              key={s}
              className="text-zinc-500 transition-colors hover:text-zinc-200"
              data-testid={`text-aggregator-${s}`}
            >
              {s}
            </span>
          ))}
          <span className="text-zinc-700">+ {OSINT_SOURCES.length - sources.length} more</span>
        </div>
      </div>
    </section>
  );
}

/* ─────────── What we check (minimal line) ─────────── */
function WhatWeCheck() {
  const { lang } = useTranslation();
  const items: { Icon: typeof Mail; title: string }[] = [
    { Icon: Mail,       title: "Email" },
    { Icon: Phone,      title: "Phone" },
    { Icon: AtSign,     title: "Username" },
    { Icon: Wallet,     title: "Wallet" },
    { Icon: Globe,      title: "Domain" },
    { Icon: Network,    title: "IP" },
    { Icon: Hash,       title: "Hash" },
    { Icon: Bug,        title: "CVE" },
    { Icon: CreditCard, title: "Card BIN" },
    { Icon: KeyRound,   title: "Password" },
    { Icon: Shield,     title: "SSL" },
    { Icon: Bot,        title: "Bot" },
  ];
  const sectionLabel = lang === "uk" ? "Що перевіряємо" : lang === "ru" ? "Что проверяем" : lang === "es" ? "Qué analizamos" : lang === "de" ? "Was wir prüfen" : "What we scan";
  const headline = lang === "uk" ? "12 типів перевірок · одне поле вводу" : lang === "ru" ? "12 типов проверок · одно поле ввода" : lang === "es" ? "12 tipos de análisis · un solo campo" : lang === "de" ? "12 Prüftypen · ein Eingabefeld" : "12 scan types · one input field";
  return (
    <section className="border-t border-white/5">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:py-16">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <div className="mb-2 text-[11px] uppercase tracking-[0.2em] text-cyan-300/80">{sectionLabel}</div>
            <h2 className="text-[20px] font-semibold tracking-tight text-white sm:text-[22px]">
              {headline}
            </h2>
          </div>
        </div>

        {/* thin pro divider line */}
        <div className="relative">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />

          {/* Mobile: clean 3-col grid; sm+: single inline strip with dot separators */}
          <div className="grid grid-cols-3 gap-x-2 gap-y-3 px-2 py-5 sm:hidden">
            {items.map(({ Icon, title }) => (
              <span
                key={title}
                className="inline-flex items-center justify-center gap-1.5 text-[12px] text-zinc-300"
                data-testid={`chip-check-${title.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0 text-cyan-300/80" />
                <span className="truncate">{title}</span>
              </span>
            ))}
          </div>

          <div className="hidden flex-wrap items-center justify-center gap-x-5 gap-y-3 px-2 py-5 sm:flex">
            {items.map(({ Icon, title }, i) => (
              <span
                key={title}
                className="inline-flex items-center gap-1.5 text-[12.5px] text-zinc-400 transition-colors hover:text-white"
              >
                <Icon className="h-3.5 w-3.5 text-cyan-300/80" />
                <span>{title}</span>
                {i < items.length - 1 && <span className="ml-3 text-zinc-700">·</span>}
              </span>
            ))}
          </div>

          <div className="h-px w-full bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />
        </div>
      </div>
    </section>
  );
}

/* ─────────── How it works (minimal line) ─────────── */
function HowItWorks() {
  const { lang } = useTranslation();
  const sectionLabel = lang === "uk" ? "Як це працює" : lang === "ru" ? "Как это работает" : lang === "es" ? "Cómo funciona" : lang === "de" ? "Wie es funktioniert" : "How it works";
  const headline = lang === "uk" ? "Три кроки · 10 секунд · без реєстрації" : lang === "ru" ? "Три шага · 10 секунд · без регистрации" : lang === "es" ? "Tres pasos · 10 segundos · sin registro" : lang === "de" ? "Drei Schritte · 10 Sekunden · ohne Registrierung" : "Three steps · 10 seconds · no signup";
  const stepLabels = lang === "uk"
    ? ["Введи", `Скануємо ${OSINT_SOURCES.length}+ джерел`, "Отримай звіт"]
    : lang === "ru"
    ? ["Введи", `Сканируем ${OSINT_SOURCES.length}+ источников`, "Получи отчёт"]
    : lang === "es"
    ? ["Ingresa", `Analizamos ${OSINT_SOURCES.length}+ fuentes`, "Obtén el informe"]
    : lang === "de"
    ? ["Eingabe", `Wir prüfen ${OSINT_SOURCES.length}+ Quellen`, "Bericht erhalten"]
    : ["Enter target", `We scan ${OSINT_SOURCES.length}+ sources`, "Get your report"];
  const steps = [
    { n: "01", t: stepLabels[0] },
    { n: "02", t: stepLabels[1] },
    { n: "03", t: stepLabels[2] },
  ];
  return (
    <section id="how" className="border-t border-white/5">
      <div className="mx-auto max-w-6xl px-5 py-12 sm:py-14">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <div className="mb-1 text-[11px] uppercase tracking-[0.2em] text-cyan-300/80">{sectionLabel}</div>
            <h2 className="text-[20px] font-semibold tracking-tight text-white sm:text-[22px]">
              {headline}
            </h2>
          </div>
        </div>
        {/* Mobile: vertical stacked steps; sm+: single horizontal line */}
        <div className="rounded-xl border border-white/10 bg-[#0A0A0C] px-5 py-5">
          <div className="flex flex-col gap-3 sm:hidden">
            {steps.map((s) => (
              <div key={s.n} className="flex items-center gap-3" data-testid={`step-${s.n}`}>
                <span className="font-mono text-[11px] text-cyan-300/70">{s.n}</span>
                <span className="text-[13.5px] text-white">{s.t}</span>
              </div>
            ))}
          </div>
          <div className="hidden flex-wrap items-center justify-center gap-x-2 gap-y-3 sm:flex">
            {steps.map((s, i) => (
              <span key={s.n} className="inline-flex items-center gap-3">
                <span className="font-mono text-[11px] text-cyan-300/70">{s.n}</span>
                <span className="text-[13.5px] text-white">{s.t}</span>
                {i < steps.length - 1 && <span className="mx-3 text-zinc-700">→</span>}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────── Sources (minimal strip) ─────────── */
function Sources() {
  const { lang } = useTranslation();
  const cats: OsintCategory[] = ["leaks", "email", "phone", "ip", "domain", "wallet", "username", "threat", "darkweb", "social"];
  const sectionLabel = lang === "uk" ? "Джерела" : lang === "ru" ? "Источники" : lang === "es" ? "Fuentes" : lang === "de" ? "Quellen" : "Sources";
  const headline = lang === "uk" ? `${OSINT_SOURCES.length}+ відкритих OSINT-джерел · ${cats.length} категорій` : lang === "ru" ? `${OSINT_SOURCES.length}+ открытых OSINT-источников · ${cats.length} категорий` : lang === "es" ? `${OSINT_SOURCES.length}+ fuentes OSINT abiertas · ${cats.length} categorías` : lang === "de" ? `${OSINT_SOURCES.length}+ offene OSINT-Quellen · ${cats.length} Kategorien` : `${OSINT_SOURCES.length}+ open OSINT sources · ${cats.length} categories`;
  const fullListLabel = lang === "uk" ? "повний список →" : lang === "ru" ? "полный список →" : lang === "es" ? "lista completa →" : lang === "de" ? "vollständige Liste →" : "full list →";
  return (
    <section id="sources" className="border-t border-white/5 bg-[#08080A]">
      <div className="mx-auto max-w-6xl px-5 py-12 sm:py-14">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="mb-1 text-[11px] uppercase tracking-[0.2em] text-cyan-300/80">{sectionLabel}</div>
            <h2 className="text-[20px] font-semibold tracking-tight text-white sm:text-[22px]">
              {headline}
            </h2>
          </div>
          <Link href="/trust">
            <span className="cursor-pointer text-[12.5px] font-mono text-cyan-300/80 hover:text-cyan-200" data-testid="link-sources-all">
              {fullListLabel}
            </span>
          </Link>
        </div>

        <div className="relative">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          {/* Mobile: 2-col tidy grid; sm+: single inline strip */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 px-2 py-4 text-[12.5px] sm:hidden">
            {cats.map((cat) => {
              const count = OSINT_SOURCES.filter((s) => s.category === cat).length;
              const label = (CATEGORY_LABELS[cat] as any)[lang] ?? CATEGORY_LABELS[cat].en ?? CATEGORY_LABELS[cat].ru;
              return (
                <span key={cat} className="inline-flex items-baseline justify-between gap-2">
                  <span className="text-white">{label}</span>
                  <span className="font-mono text-[11px] text-zinc-600">{count}</span>
                </span>
              );
            })}
          </div>

          <div className="hidden flex-wrap items-center justify-center gap-x-4 gap-y-2 px-2 py-4 text-[12.5px] sm:flex">
            {cats.map((cat, i) => {
              const count = OSINT_SOURCES.filter((s) => s.category === cat).length;
              const label = (CATEGORY_LABELS[cat] as any)[lang] ?? CATEGORY_LABELS[cat].en ?? CATEGORY_LABELS[cat].ru;
              return (
                <span key={cat} className="inline-flex items-center gap-2 text-zinc-400">
                  <span className="text-white">{label}</span>
                  <span className="font-mono text-[11px] text-zinc-600">{count}</span>
                  {i < cats.length - 1 && <span className="ml-2 text-zinc-700">·</span>}
                </span>
              );
            })}
          </div>

          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
      </div>
    </section>
  );
}

/* ─────────── Pricing teaser ─────────── */
function PricingTeaser() {
  const { lang } = useTranslation();
  const sectionLabel = lang === "uk" ? "Ціни" : lang === "ru" ? "Цены" : lang === "es" ? "Precios" : lang === "de" ? "Preise" : "Pricing";
  const headline = lang === "uk" ? "Прозорі тарифи · без прихованих платежів" : lang === "ru" ? "Прозрачные тарифы · без скрытых платежей" : lang === "es" ? "Precios transparentes · sin cargos ocultos" : lang === "de" ? "Transparente Tarife · keine versteckten Gebühren" : "Transparent pricing · no hidden fees";
  const allPlansLabel = lang === "uk" ? "всі тарифи →" : lang === "ru" ? "все тарифы →" : lang === "es" ? "todos los planes →" : lang === "de" ? "alle Pläne →" : "all plans →";
  const perReport = lang === "uk" ? "за звіт" : lang === "ru" ? "за отчёт" : lang === "es" ? "por informe" : lang === "de" ? "pro Bericht" : "per report";
  const perMonth = lang === "uk" ? "/міс" : lang === "ru" ? "/мес" : lang === "es" ? "/mes" : lang === "de" ? "/Mo" : "/mo";
  return (
    <section className="border-t border-white/5">
      <div className="mx-auto max-w-6xl px-5 py-12 sm:py-14">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="mb-1 text-[11px] uppercase tracking-[0.2em] text-cyan-300/80">{sectionLabel}</div>
            <h2 className="text-[20px] font-semibold tracking-tight text-white sm:text-[22px]">
              {headline}
            </h2>
          </div>
          <Link href="/pricing">
            <span className="cursor-pointer text-[12.5px] font-mono text-cyan-300/80 hover:text-cyan-200" data-testid="link-pricing-all">
              {allPlansLabel}
            </span>
          </Link>
        </div>

        {(() => {
          const plans = [
            { name: "Single", price: "$3", note: perReport, href: "/pricing?single=1", testId: "link-price-single" },
            { name: "PRO", price: "$9", note: perMonth, href: "/pricing?plan=PRO&code=DARKNEU", testId: "link-price-pro", hot: true },
            { name: "ENTERPRISE", price: "$29", note: perMonth, href: "/pricing?plan=ENTERPRISE", testId: "link-price-enterprise" },
            { name: "GROUPS", price: "$49", note: perMonth, href: "/pricing?plan=GROUPS", testId: "link-price-groups" },
          ];
          return (
            <div className="relative">
              <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

              {/* Mobile: 2x2 grid of plan tiles; sm+: single inline strip */}
              <div className="grid grid-cols-2 gap-2 px-2 py-4 sm:hidden">
                {plans.map((p) => (
                  <Link key={p.name} href={p.href}>
                    <span
                      className={`flex cursor-pointer flex-col items-start gap-0.5 rounded-lg border px-3 py-2.5 transition-colors ${
                        p.hot
                          ? "border-cyan-400/40 bg-cyan-400/[0.04] hover:border-cyan-300"
                          : "border-white/10 bg-[#0A0A0C] hover:border-white/20"
                      }`}
                      data-testid={p.testId}
                    >
                      <span className={`text-[11px] uppercase tracking-wider ${p.hot ? "text-cyan-300" : "text-zinc-400"}`}>{p.name}</span>
                      <span className="flex items-baseline gap-1">
                        <span className="text-[18px] font-semibold text-white">{p.price}</span>
                        <span className="text-[11px] text-zinc-500">{p.note}</span>
                      </span>
                    </span>
                  </Link>
                ))}
              </div>

              <div className="hidden flex-wrap items-center justify-center gap-x-6 gap-y-3 px-2 py-5 text-[13px] sm:flex">
                {plans.map((p, i, arr) => (
                  <span key={p.name} className="inline-flex items-center gap-3">
                    <Link href={p.href}>
                      <span className="inline-flex cursor-pointer items-baseline gap-1.5 hover:opacity-90">
                        <span className={`text-[12px] uppercase tracking-wider ${p.hot ? "text-cyan-300" : "text-zinc-400"}`}>{p.name}</span>
                        <span className="text-[18px] font-semibold text-white">{p.price}</span>
                        <span className="text-[11.5px] text-zinc-500">{p.note}</span>
                      </span>
                    </Link>
                    {i < arr.length - 1 && <span className="text-zinc-700">·</span>}
                  </span>
                ))}
              </div>

              <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>
          );
        })()}
      </div>
    </section>
  );
}

/* ─────────── Trust strip ─────────── */
function TrustStrip({ stats }: { stats: SiteStats | null }) {
  const { lang } = useTranslation();
  const L = {
    sources: lang === "uk" ? "Джерел" : lang === "ru" ? "Источников" : lang === "es" ? "Fuentes" : lang === "de" ? "Quellen" : "Sources",
    leakDB: lang === "uk" ? "Бази витоків" : lang === "ru" ? "Базы утечек" : lang === "es" ? "Bases de filtraciones" : lang === "de" ? "Leak-Datenbanken" : "Leak databases",
    today: lang === "uk" ? "Перевірок сьогодні" : lang === "ru" ? "Проверок сегодня" : lang === "es" ? "Escaneos hoy" : lang === "de" ? "Scans heute" : "Scans today",
    risk: lang === "uk" ? "Рівень ризику" : lang === "ru" ? "Уровень риска" : lang === "es" ? "Nivel de riesgo" : lang === "de" ? "Risikolevel" : "Risk level",
  };
  const items = [
    { icon: Database, label: L.sources, value: `${OSINT_SOURCES.length}+` },
    { icon: Shield,   label: L.leakDB, value: "14" },
    { icon: Activity, label: L.today, value: stats?.checksToday ? stats.checksToday.toLocaleString("en-US") : "—" },
    { icon: Eye,      label: L.risk, value: "0–100" },
  ];
  return (
    <section className="border-t border-white/5 bg-[#08080A]">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/5 sm:grid-cols-4">
        {items.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-3 bg-[#0A0A0C] px-5 py-5">
            <Icon className="h-4 w-4 text-cyan-300/70" />
            <div>
              <div className="text-[11px] uppercase tracking-wider text-zinc-500">{label}</div>
              <div className="text-[16px] font-semibold text-white" data-testid={`text-trust-${label.replace(/\s+/g, "-").toLowerCase()}`}>{value}</div>
            </div>
          </div>
        ))}
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
    <section className="border-t border-white/5">
      <div className="mx-auto max-w-3xl px-5 py-20 sm:py-24">
        <div className="mb-10">
          <div className="mb-3 text-[12px] uppercase tracking-[0.18em] text-cyan-300/80">FAQ</div>
          <h2 className="text-[28px] font-semibold tracking-tight text-white sm:text-[34px]">{headline}</h2>
        </div>
        <div className="divide-y divide-white/5 rounded-xl border border-white/10 bg-[#0E0E12]">
          {items.map((it, i) => {
            const isOpen = open === i;
            return (
              <button
                key={i}
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                className="block w-full px-5 py-4 text-left transition-colors hover:bg-white/[0.02]"
                data-testid={`button-faq-${i}`}
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[14.5px] font-medium text-white">{it.q}</span>
                  <ChevronDown className={`h-4 w-4 shrink-0 text-zinc-500 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </div>
                {isOpen && <p className="mt-3 text-[13.5px] leading-relaxed text-zinc-400">{it.a}</p>}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─────────── Compliance / Trust badges ─────────── */
function ComplianceBadges() {
  const badges = [
    { label: "GDPR", sub: "Ready" },
    { label: "CCPA", sub: "Ready" },
    { label: "SOC 2 Type II", sub: "In progress · Q4 ’26" },
    { label: "ISO 27001", sub: "Planned · Q1 ’27" },
    { label: "PCI DSS", sub: "Stripe-handled" },
    { label: "RFC 9116", sub: "security.txt published" },
  ];
  return (
    <section className="border-t border-white/5 bg-[#08080A]">
      <div className="mx-auto max-w-6xl px-5 py-12">
        <div className="mb-6 flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <div className="mb-1 text-[11px] uppercase tracking-[0.18em] text-cyan-300/80">Compliance & trust</div>
            <h2 className="text-[20px] font-semibold tracking-tight text-white sm:text-[22px]">Built to enterprise standards</h2>
          </div>
          <Link href="/trust">
            <span className="cursor-pointer text-[12.5px] font-mono text-cyan-300/80 hover:text-cyan-200" data-testid="link-trust-center">
              Trust Center →
            </span>
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {badges.map((b) => (
            <div key={b.label} className="rounded-lg border border-white/10 bg-[#0E0E12] px-3 py-3" data-testid={`badge-compliance-${b.label.replace(/[^a-z0-9]/gi, "-").toLowerCase()}`}>
              <div className="text-[12.5px] font-semibold text-white">{b.label}</div>
              <div className="text-[10.5px] text-zinc-500">{b.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────── Community CTA ─────────── */
function CommunityCTA() {
  const { lang } = useTranslation();
  const L = {
    badge: lang === "uk" ? "Відкрита спільнота" : lang === "ru" ? "Открытое сообщество" : lang === "es" ? "Comunidad abierta" : lang === "de" ? "Offene Community" : "Open community",
    headline: lang === "uk" ? "Будуй з нами. SDK, документація, threat-intel дайджест." : lang === "ru" ? "Строй с нами. SDK, документация, threat-intel дайджест." : lang === "es" ? "Construye con nosotros. SDK, docs, digest de inteligencia." : lang === "de" ? "Baue mit uns. SDKs, Docs, Threat-Intel-Digest." : "Build with us. SDKs, docs, threat-intel digest.",
    desc: lang === "uk" ? "REST API з прикладами для curl, Python, Node, Go. Telegram-канал з щоденними IoC, GitHub для SDK-контрибуцій." : lang === "ru" ? "REST API с примерами для curl, Python, Node, Go. Telegram-канал с ежедневными IoC, GitHub для SDK-контрибуций." : lang === "es" ? "API REST con ejemplos para curl, Python, Node, Go. Canal de Telegram con IoCs diarios y SDK en GitHub." : lang === "de" ? "REST API mit Beispielen für curl, Python, Node, Go. Telegram-Kanal mit täglichen IoCs, GitHub für SDK-Beiträge." : "REST API with examples for curl, Python, Node, Go. Open Telegram channel with daily IoCs, GitHub for SDK contributions.",
    explore: lang === "uk" ? "Дослідити спільноту" : lang === "ru" ? "Исследовать сообщество" : lang === "es" ? "Explorar comunidad" : lang === "de" ? "Community erkunden" : "Explore community",
    telegram: lang === "uk" ? "Telegram-канал" : lang === "ru" ? "Telegram-канал" : lang === "es" ? "Canal de Telegram" : lang === "de" ? "Telegram-Kanal" : "Telegram channel",
    github: lang === "uk" ? "GitHub SDK" : lang === "ru" ? "GitHub SDK" : lang === "es" ? "SDK en GitHub" : lang === "de" ? "GitHub SDKs" : "GitHub SDKs",
  };
  return (
    <section className="border-t border-white/5 bg-[#08080A]">
      <div className="mx-auto max-w-6xl px-5 py-16">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-500/[0.06] via-[#0E0E12] to-[#0E0E12] p-6 sm:p-10">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-center">
            <div>
              <div className="mb-2 text-[11px] uppercase tracking-[0.18em] text-cyan-300/80">{L.badge}</div>
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
            <pre className="overflow-x-auto rounded-xl border border-white/10 bg-black/60 p-4 font-mono text-[12px] leading-relaxed text-zinc-300">
{`# 60-second integration
curl -H "X-API-Key: $DS_KEY" \\
  https://www.darkshare.store/api/check \\
  -d '{"type":"ip","value":"1.1.1.1"}'

# returns risk score, findings, sources`}
            </pre>
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
          <div className="mb-2 text-[11px] uppercase tracking-[0.2em] text-cyan-300/80">{headerBadge}</div>
          <h2 className="text-[22px] font-semibold tracking-tight text-white sm:text-[26px]">
            {headerTitle}
          </h2>
          <p className="mt-2 text-[13.5px] text-zinc-500">{headerSub}</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {testimonials.map((t, i) => (
            <div key={i} className="rounded-xl border border-white/10 bg-[#0E0E12] p-5" data-testid={`card-testimonial-${i}`}>
              <div className="flex items-center gap-0.5 mb-3">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-[13.5px] text-zinc-300 leading-relaxed mb-4">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-500/30 to-zinc-700 flex items-center justify-center text-[11px] font-bold text-cyan-300 shrink-0">
                  {t.avatar}
                </div>
                <div>
                  <div className="text-[13px] font-medium text-white">{t.author}</div>
                  <div className="text-[11px] text-zinc-500">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Live stat counter strip */}
        <div className="mt-8 grid grid-cols-3 gap-3 sm:gap-4">
          {[
            { icon: Users, value: "2,800+", label: statLabels.users },
            { icon: TrendingUp, value: "47,000+", label: statLabels.scans },
            { icon: Shield, value: "99.9%", label: statLabels.uptime },
          ].map(({ icon: Icon, value, label }) => (
            <div key={label} className="rounded-xl border border-white/5 bg-[#08080A] px-4 py-4 text-center" data-testid={`stat-${label.toLowerCase().replace(/\s+/g, "-")}`}>
              <Icon className="mx-auto h-4 w-4 text-cyan-300/70 mb-2" />
              <div className="text-[20px] font-semibold text-white">{value}</div>
              <div className="text-[11px] text-zinc-500">{label}</div>
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
  const riskLabels = {
    HIGH: lang === "uk" ? "ВИСОК. РИЗИК" : lang === "ru" ? "ВЫСОК. РИСК" : lang === "es" ? "RIESGO ALTO" : lang === "de" ? "HOHES RISIKO" : "HIGH RISK",
    MEDIUM: lang === "uk" ? "СЕРЕДНІЙ" : lang === "ru" ? "СРЕДНИЙ" : lang === "es" ? "MEDIO" : lang === "de" ? "MITTEL" : "MEDIUM",
    LOW: lang === "uk" ? "НИЗЬКИЙ" : lang === "ru" ? "НИЗКИЙ" : lang === "es" ? "BAJO" : lang === "de" ? "NIEDRIG" : "LOW",
    CRITICAL: lang === "uk" ? "КРИТИЧНИЙ" : lang === "ru" ? "КРИТИЧНЫЙ" : lang === "es" ? "CRÍTICO" : lang === "de" ? "KRITISCH" : "CRITICAL",
  };
  const activities = [
    { type: "email", target: "j***n@gmail.com", result: riskLabels.HIGH, score: 74, color: "rose" },
    { type: "ip", target: "91.108.4.***", result: riskLabels.MEDIUM, score: 45, color: "amber" },
    { type: "wallet", target: "0x742d...c4aB", result: riskLabels.LOW, score: 12, color: "emerald" },
    { type: "domain", target: "fake-shop.net", result: riskLabels.CRITICAL, score: 89, color: "rose" },
    { type: "phone", target: "+38067***4521", result: riskLabels.HIGH, score: 67, color: "rose" },
  ];
  const agoUnit = lang === "uk" ? "хв тому" : lang === "ru" ? "мин назад" : lang === "es" ? "min atrás" : lang === "de" ? "Vor Min." : "min ago";
  const agoLabels = [2, 5, 8, 11, 14].map(n => `${n} ${agoUnit}`);
  const liveLabel = lang === "uk" ? "Поточні сканування" : lang === "ru" ? "Текущие сканирования" : lang === "es" ? "Escaneos en vivo" : lang === "de" ? "Live-Scans" : "Live scans";

  return (
    <section className="border-t border-white/5 bg-[#08080A]">
      <div className="mx-auto max-w-6xl px-5 py-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">{liveLabel}</span>
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-emerald-400/20 to-transparent" />
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-5">
          {activities.map((a, i) => (
            <div key={i} className="flex sm:flex-col items-center sm:items-start justify-between gap-2 rounded-lg border border-white/5 bg-[#0A0A0C] px-3 py-2.5" data-testid={`card-live-${i}`}>
              <div>
                <span className="text-[11.5px] font-mono text-zinc-400">{a.target}</span>
              </div>
              <div className="flex sm:flex-col items-center sm:items-start gap-2">
                <span className={`text-[10.5px] font-bold tracking-wide ${a.color === "rose" ? "text-rose-400" : a.color === "amber" ? "text-amber-400" : "text-emerald-400"}`}>
                  {a.result} · {a.score}
                </span>
                <span className="text-[10px] text-zinc-600">{agoLabels[i]}</span>
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
  const headline = lang === "uk" ? "Дізнайся, що про тебе відомо в інтернеті." : lang === "ru" ? "Узнай, что о тебе известно в интернете." : lang === "es" ? "Descubre qué saben de ti en internet." : lang === "de" ? "Finde heraus, was das Internet über dich weiß." : "Find out what the internet knows about you.";
  const sub = lang === "uk" ? "Перша перевірка — безплатно. Без реєстрації, без email, без зобов'язань." : lang === "ru" ? "Первая проверка — бесплатно. Без регистрации, без email, без обязательств." : lang === "es" ? "Primera verificación gratis. Sin registro, sin email, sin compromisos." : lang === "de" ? "Erste Prüfung kostenlos. Ohne Registrierung, ohne E-Mail, ohne Verpflichtung." : "First scan is free. No signup, no email, no commitment.";
  const scanNow = lang === "uk" ? "Перевірити зараз" : lang === "ru" ? "Проверить сейчас" : lang === "es" ? "Escanear ahora" : lang === "de" ? "Jetzt prüfen" : "Scan now";
  const allPlans = lang === "uk" ? "Всі тарифи" : lang === "ru" ? "Все тарифы" : lang === "es" ? "Ver precios" : lang === "de" ? "Alle Pläne" : "All plans";
  return (
    <section className="border-t border-white/5 bg-[#08080A]">
      <div className="mx-auto max-w-3xl px-5 py-20 text-center sm:py-24">
        <h2 className="text-[28px] font-semibold tracking-tight text-white sm:text-[34px]">
          {headline}
        </h2>
        <p className="mx-auto mt-3 max-w-md text-[14px] text-zinc-400">
          {sub}
        </p>
        <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
          <a href="#top" className="w-full sm:w-auto inline-flex h-11 items-center justify-center rounded-lg bg-white px-5 text-[13.5px] font-medium text-black hover:bg-zinc-200" data-testid="link-cta-check">
            {scanNow}
          </a>
          <Link href="/pricing?code=DARKNEU">
            <span className="w-full sm:w-auto inline-flex h-11 cursor-pointer items-center justify-center rounded-lg border border-white/15 px-5 text-[13.5px] font-medium text-white hover:bg-white/5" data-testid="link-cta-pricing">
              {allPlans}
            </span>
          </Link>
        </div>
        <p className="mt-5 text-[12px] text-cyan-400/70">
          {lang === "uk" ? <>Код <span className="font-mono font-bold">DARKNEU</span> → −50% на перший місяць PRO</> : lang === "ru" ? <>Код <span className="font-mono font-bold">DARKNEU</span> → −50% на первый месяц PRO</> : lang === "es" ? <>Código <span className="font-mono font-bold">DARKNEU</span> → −50% en tu primer mes PRO</> : lang === "de" ? <>Code <span className="font-mono font-bold">DARKNEU</span> → −50% auf den ersten PRO-Monat</> : <>Code <span className="font-mono font-bold">DARKNEU</span> → −50% off your first PRO month</>}
        </p>
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
      <TopBar />
      <HeroCheck stats={stats} />
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
      <Footer />
    </div>
  );
}
