import { useState, useEffect, useRef, useMemo } from "react";
import { Link, useLocation } from "wouter";
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
} from "lucide-react";
import { Footer } from "@/components/Footer";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { OSINT_SOURCES, CATEGORY_LABELS, type OsintCategory } from "@/data/osintSources";

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

function typeLabel(type: CheckType): string {
  return { email: "Email", phone: "Телефон", username: "Username", wallet: "Кошелёк", domain: "Домен", ip: "IP" }[type];
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

        <nav className="hidden items-center gap-7 text-[13px] text-zinc-400 md:flex">
          <Link href="/sample-report"><span className="cursor-pointer transition-colors hover:text-white" data-testid="link-sample">Пример отчёта</span></Link>
          <Link href="/pricing"><span className="cursor-pointer transition-colors hover:text-white" data-testid="link-pricing">Тарифы</span></Link>
          <a href="#how" className="transition-colors hover:text-white">Как работает</a>
          <a href="#sources" className="transition-colors hover:text-white">Источники</a>
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <Link href="/auth">
            <span className="hidden cursor-pointer rounded-md px-3 py-1.5 text-[13px] font-medium text-zinc-200 transition-colors hover:bg-white/5 sm:inline-block" data-testid="link-login">
              Войти
            </span>
          </Link>
          <Link href="/pricing">
            <span className="cursor-pointer rounded-md bg-white px-3 py-1.5 text-[13px] font-medium text-black transition-colors hover:bg-zinc-200" data-testid="link-pro">
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
      setError("Не удалось определить формат. Введите email, телефон, username, домен, IP или wallet.");
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
        if (resp.status === 429) setError("Дневной лимит бесплатных проверок исчерпан. Войди для большего количества.");
        else if (resp.status >= 500) setError("Сервис временно недоступен. Попробуйте через минуту.");
        else setError(data?.error || "Не удалось выполнить проверку");
        return;
      }
      if (!data || typeof data.riskScore !== "number") {
        setError("Не удалось разобрать ответ сервера.");
        return;
      }
      setResult(data as QuickCheckResponse);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch {
      setError("Сеть недоступна. Проверьте соединение.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(34,211,238,0.12), transparent 60%)",
        }}
      />
      <div className="relative mx-auto max-w-3xl px-5 pt-24 pb-20 text-center sm:pt-32 sm:pb-28">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[12px] text-zinc-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          150+ источников · 14 баз утечек · realtime
        </div>

        <h1 className="text-balance text-[40px] font-semibold leading-[1.05] tracking-tight text-white sm:text-[56px]" data-testid="text-hero-title">
          Проверь, попали ли твои данные в утечки.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-zinc-400 sm:text-[16px]" data-testid="text-hero-sub">
          Email, телефон, username, кошелёк, домен или IP — анализ из десятков OSINT-источников за 10 секунд.
          Без регистрации.
        </p>

        <form onSubmit={submit} className="mx-auto mt-10 max-w-xl">
          <div className="group relative">
            <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
              {detected ? typeIcon(detected, "h-4 w-4 text-cyan-300") : <Search className="h-4 w-4" />}
            </div>
            <input
              ref={inputRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="email, телефон, username, кошелёк, домен или IP"
              className="h-14 w-full rounded-xl border border-white/10 bg-[#111114] pl-11 pr-36 text-[15px] text-white placeholder:text-zinc-600 outline-none transition-colors focus:border-cyan-400/50"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              data-testid="input-target"
            />
            <button
              type="submit"
              disabled={loading || !value.trim()}
              className="absolute right-1.5 top-1.5 inline-flex h-11 items-center gap-2 rounded-lg bg-white px-4 text-[13.5px] font-medium text-black transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
              data-testid="button-check"
            >
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Сканирую</> : <>Проверить <ArrowRight className="h-4 w-4" /></>}
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[12px] text-zinc-500">
            {detected ? (
              <span className="inline-flex items-center gap-1.5 text-cyan-300/90" data-testid="text-detected">
                {typeIcon(detected, "h-3 w-3")} распознано: {typeLabel(detected)}
              </span>
            ) : (
              <span>Анонимно · 3 проверки в сутки бесплатно</span>
            )}
            <span className="text-zinc-700">·</span>
            <span>SSL · логи не хранятся</span>
            {stats && stats.checksToday > 0 ? (
              <>
                <span className="text-zinc-700">·</span>
                <span data-testid="text-stats-today">{stats.checksToday.toLocaleString("ru-RU")} проверок сегодня</span>
              </>
            ) : null}
          </div>

          {error && (
            <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/5 px-4 py-2 text-[13px] text-rose-300" data-testid="text-error">
              <AlertTriangle className="h-3.5 w-3.5" /> {error}
            </div>
          )}
        </form>

        {result && (
          <div ref={resultRef} className="mt-12">
            <ResultCard data={result} />
          </div>
        )}
      </div>
    </section>
  );
}

/* ─────────── Result + Paywall ─────────── */
function ResultCard({ data }: { data: QuickCheckResponse }) {
  const meta = riskMeta(data.riskLevel);
  const hidden = data.findingsHidden ?? 4;
  const sources = data.sourcesChecked || [];

  return (
    <div className="mx-auto max-w-2xl text-left">
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0E0E12]">
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
          <div className="text-right">
            <div className={`text-[11px] tracking-wider ${meta.text}`}>{meta.label}</div>
            <div className="text-[20px] font-semibold leading-none text-white" data-testid="text-risk-score">
              {data.riskScore}<span className="text-[12px] text-zinc-500">/100</span>
            </div>
          </div>
        </div>

        <div className="px-5 pt-5">
          <div className="h-1 w-full overflow-hidden rounded-full bg-white/5">
            <div className={`h-full ${meta.bar}`} style={{ width: `${data.riskScore}%` }} />
          </div>
          <p className="mt-4 text-[13.5px] text-zinc-300" data-testid="text-summary">{stripEmoji(data.summary)}</p>
        </div>

        <div className="px-5 pb-5 pt-4">
          <div className="mb-2 text-[11px] uppercase tracking-wider text-zinc-500">Что нашли</div>
          <ul className="space-y-2">
            {data.findings.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-[13.5px] text-zinc-200" data-testid={`row-finding-${i}`}>
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-300/80" />
                <span>{stripEmoji(f)}</span>
              </li>
            ))}
          </ul>

          {/* Paywall */}
          <div className="mt-3 space-y-2" aria-hidden>
            {Array.from({ length: Math.min(5, Math.max(3, hidden)) }).map((_, i) => (
              <div key={i} className="flex items-start gap-2">
                <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-600" />
                <div className="h-3.5 w-full max-w-[420px] rounded bg-white/5" style={{ filter: "blur(3px)", opacity: 0.7 - i * 0.1 }} />
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[14px] font-medium text-white">Скрыто в полном отчёте</div>
                <div className="mt-0.5 text-[12.5px] text-zinc-500">
                  Полный список находок, источники, связанные аккаунты, PDF.
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/pricing?single=1&t=${encodeURIComponent(data.target)}&type=${data.type}`}>
                  <span className="inline-flex h-9 cursor-pointer items-center rounded-lg bg-white px-3.5 text-[13px] font-medium text-black hover:bg-zinc-200" data-testid="link-buy-single">
                    Открыть отчёт — $3
                  </span>
                </Link>
                <Link href="/pricing?plan=PRO">
                  <span className="inline-flex h-9 cursor-pointer items-center rounded-lg border border-white/15 bg-transparent px-3.5 text-[13px] font-medium text-white hover:bg-white/5" data-testid="link-buy-pro">
                    PRO — $9/мес
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {sources.length > 0 && (
          <div className="border-t border-white/5 bg-white/[0.015] px-5 py-4">
            <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-wider text-zinc-500">
              <span>Проверено в источниках</span>
              <span>{sources.length} из {data.sourcesTotal ?? 150}</span>
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
        )}
      </div>
    </div>
  );
}

/* ─────────── How it works ─────────── */
function HowItWorks() {
  const steps = [
    { n: "01", t: "Введи идентификатор", d: "Email, телефон, username, кошелёк, домен или IP. Формат определяется автоматически." },
    { n: "02", t: "Сканируем 150 источников", d: "Базы утечек, threat intelligence, ончейн-данные, dark web, репутационные сервисы." },
    { n: "03", t: "Получи риск-отчёт", d: "Risk score, список находок, рекомендации, PDF. Бесплатно — 3 проверки в сутки." },
  ];
  return (
    <section id="how" className="border-t border-white/5">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:py-24">
        <div className="mb-12 max-w-2xl">
          <div className="mb-3 text-[12px] uppercase tracking-[0.18em] text-cyan-300/80">Как это работает</div>
          <h2 className="text-[28px] font-semibold tracking-tight text-white sm:text-[34px]">
            Три шага. Десять секунд. Без регистрации.
          </h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="rounded-xl border border-white/10 bg-[#0E0E12] p-6">
              <div className="mb-5 text-[12px] font-mono text-zinc-600">{s.n}</div>
              <div className="text-[16px] font-medium text-white">{s.t}</div>
              <p className="mt-2 text-[13.5px] leading-relaxed text-zinc-400">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────── Sources ─────────── */
function Sources() {
  const cats: OsintCategory[] = ["leaks", "email", "phone", "ip", "domain", "wallet", "username", "threat", "darkweb", "social"];
  return (
    <section id="sources" className="border-t border-white/5 bg-[#08080A]">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:py-24">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <div className="mb-3 text-[12px] uppercase tracking-[0.18em] text-cyan-300/80">Источники</div>
            <h2 className="text-[28px] font-semibold tracking-tight text-white sm:text-[34px]">
              {OSINT_SOURCES.length}+ открытых OSINT-источников
            </h2>
            <p className="mt-3 max-w-xl text-[14px] text-zinc-400">
              Используем общедоступные базы и API. Никаких слитых данных без правовых оснований.
              Полный перечень — в каждом отчёте.
            </p>
          </div>
        </div>

        <div className="space-y-8">
          {cats.map((cat) => {
            const items = OSINT_SOURCES.filter((s) => s.category === cat);
            return (
              <div key={cat}>
                <div className="mb-3 flex items-baseline justify-between">
                  <h3 className="text-[14px] font-medium text-white">{CATEGORY_LABELS[cat].ru}</h3>
                  <span className="text-[12px] text-zinc-600">{items.length} источников</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {items.map((s) => (
                    <span
                      key={s.name}
                      className="rounded-md border border-white/[0.08] bg-white/[0.02] px-2.5 py-1.5 text-[12.5px] text-zinc-300 transition-colors hover:border-white/20 hover:text-white"
                      data-testid={`badge-source-${s.name}`}
                      title={s.url}
                    >
                      {s.name}
                    </span>
                  ))}
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
  return (
    <section className="border-t border-white/5">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:py-24">
        <div className="mb-10 max-w-2xl">
          <div className="mb-3 text-[12px] uppercase tracking-[0.18em] text-cyan-300/80">Цены</div>
          <h2 className="text-[28px] font-semibold tracking-tight text-white sm:text-[34px]">
            Только то, что нужно. Без скрытых платежей.
          </h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {/* Single */}
          <div className="rounded-2xl border border-white/10 bg-[#0E0E12] p-7">
            <div className="text-[13px] text-zinc-400">Разовый отчёт</div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-[40px] font-semibold tracking-tight text-white">$3</span>
              <span className="text-[13px] text-zinc-500">за один отчёт</span>
            </div>
            <p className="mt-3 text-[13.5px] text-zinc-400">
              Полный отчёт по одной цели: все находки, источники, связанные аккаунты, PDF.
            </p>
            <ul className="mt-5 space-y-2 text-[13.5px] text-zinc-300">
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-300/80" /> Полный список находок</li>
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-300/80" /> Скачиваемый PDF</li>
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-300/80" /> Без подписки</li>
            </ul>
            <Link href="/pricing?single=1">
              <span className="mt-6 inline-flex h-10 w-full cursor-pointer items-center justify-center rounded-lg border border-white/15 bg-transparent text-[13.5px] font-medium text-white hover:bg-white/5" data-testid="link-pricing-single">
                Купить отчёт
              </span>
            </Link>
          </div>

          {/* PRO */}
          <div className="relative rounded-2xl border border-cyan-400/30 bg-gradient-to-b from-cyan-400/[0.04] to-transparent p-7">
            <div className="absolute right-5 top-5 rounded-md border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 text-[10.5px] font-medium uppercase tracking-wider text-cyan-300">
              Популярно
            </div>
            <div className="text-[13px] text-zinc-400">PRO</div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-[40px] font-semibold tracking-tight text-white">$9</span>
              <span className="text-[13px] text-zinc-500">в месяц</span>
            </div>
            <p className="mt-3 text-[13.5px] text-zinc-400">
              Всё, что нужно для постоянного контроля своих данных и доменов.
            </p>
            <ul className="mt-5 space-y-2 text-[13.5px] text-zinc-300">
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-300" /> 200 проверок в месяц</li>
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-300" /> Мониторинг утечек 24/7</li>
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-300" /> История + экспорт</li>
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-300" /> API-доступ</li>
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-300" /> Встроенный VPN</li>
            </ul>
            <Link href="/pricing?plan=PRO">
              <span className="mt-6 inline-flex h-10 w-full cursor-pointer items-center justify-center rounded-lg bg-white text-[13.5px] font-medium text-black hover:bg-zinc-200" data-testid="link-pricing-pro">
                Оформить PRO
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────── Trust strip ─────────── */
function TrustStrip({ stats }: { stats: SiteStats | null }) {
  const items = [
    { icon: Database, label: "Источников", value: `${OSINT_SOURCES.length}+` },
    { icon: Shield,   label: "Базы утечек", value: "14" },
    { icon: Activity, label: "Проверок сегодня", value: stats?.checksToday ? stats.checksToday.toLocaleString("ru-RU") : "—" },
    { icon: Eye,      label: "Уровень риска", value: "0–100" },
  ];
  return (
    <section className="border-t border-white/5 bg-[#08080A]">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/5 sm:grid-cols-4">
        {items.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-3 bg-[#0A0A0C] px-5 py-5">
            <Icon className="h-4 w-4 text-cyan-300/70" />
            <div>
              <div className="text-[11px] uppercase tracking-wider text-zinc-500">{label}</div>
              <div className="text-[16px] font-semibold text-white" data-testid={`text-trust-${label}`}>{value}</div>
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
  const items = [
    { q: "Это легально?", a: "Да. Используем только публичные источники и API: HIBP, AbuseIPDB, VirusTotal, ончейн-данные, OSINT-каталоги. Никаких слитых баз без правовых оснований." },
    { q: "Что я получу за $3?", a: "Полный отчёт по одной цели: все находки, перечень источников, связанные сущности, рекомендации, PDF на скачивание." },
    { q: "А чем отличается от Have I Been Pwned?", a: "HIBP проверяет только email-утечки. DarkShare охватывает email, телефон, username, кошелёк, домен и IP — и использует не одну базу, а 150+ открытых источников и threat-фидов." },
    { q: "Хранятся ли мои запросы?", a: "Бесплатные проверки — нет. В платных тарифах сохраняется только история твоих собственных проверок, доступная только тебе. Удалить можно в один клик." },
    { q: "Можно ли вернуть деньги?", a: "Да, в течение 7 дней по подписке PRO без вопросов. Разовый отчёт — невозвратный, но ты можешь увидеть превью бесплатно." },
    { q: "Как оплатить?", a: "Карта (Stripe), Telegram Stars, USDT/BTC. Все способы доступны на странице тарифов." },
  ];
  return (
    <section className="border-t border-white/5">
      <div className="mx-auto max-w-3xl px-5 py-20 sm:py-24">
        <div className="mb-10">
          <div className="mb-3 text-[12px] uppercase tracking-[0.18em] text-cyan-300/80">FAQ</div>
          <h2 className="text-[28px] font-semibold tracking-tight text-white sm:text-[34px]">Частые вопросы</h2>
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

/* ─────────── CTA bottom ─────────── */
function CTABottom() {
  return (
    <section className="border-t border-white/5 bg-[#08080A]">
      <div className="mx-auto max-w-3xl px-5 py-20 text-center sm:py-24">
        <h2 className="text-[28px] font-semibold tracking-tight text-white sm:text-[34px]">
          Узнай, что о тебе известно в интернете.
        </h2>
        <p className="mx-auto mt-3 max-w-md text-[14px] text-zinc-400">
          Первая проверка — бесплатно. Без регистрации, без email, без обязательств.
        </p>
        <div className="mt-7 flex items-center justify-center gap-3">
          <a href="#top" className="inline-flex h-11 items-center rounded-lg bg-white px-5 text-[13.5px] font-medium text-black hover:bg-zinc-200" data-testid="link-cta-check">
            Проверить сейчас
          </a>
          <Link href="/pricing">
            <span className="inline-flex h-11 cursor-pointer items-center rounded-lg border border-white/15 px-5 text-[13.5px] font-medium text-white hover:bg-white/5" data-testid="link-cta-pricing">
              Все тарифы
            </span>
          </Link>
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

  useEffect(() => {
    fetch("/api/stats", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setStats(d))
      .catch(() => {});
  }, []);

  return (
    <div id="top" className="min-h-screen bg-[#0A0A0A] text-white">
      <TopBar />
      <HeroCheck stats={stats} />
      <TrustStrip stats={stats} />
      <HowItWorks />
      <Sources />
      <PricingTeaser />
      <FAQ />
      <CTABottom />
      <Footer />
    </div>
  );
}
