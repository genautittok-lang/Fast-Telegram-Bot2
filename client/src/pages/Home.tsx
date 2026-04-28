import { useState, useEffect, useRef, useMemo } from "react";
import { Link, useLocation } from "wouter";
import {
  Search,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  Lock,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  Mail,
  Phone,
  AtSign,
  Wallet,
  Globe,
} from "lucide-react";
import { Footer } from "@/components/Footer";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

type CheckType = "email" | "phone" | "username" | "wallet" | "domain" | "ip";

interface QuickCheckResponse {
  type: string;
  target: string;
  riskScore: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  summary: string;
  findings: string[];
  timestamp: string;
  limited: boolean;
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
    (/^[LM][a-km-zA-HJ-NP-Z1-9]{25,33}$/.test(v))
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
  return {
    email: "Email",
    phone: "Телефон",
    username: "Username",
    wallet: "Wallet",
    domain: "Домен",
    ip: "IP",
  }[type];
}

function typeIcon(type: CheckType) {
  const cls = "h-4 w-4";
  switch (type) {
    case "email":
      return <Mail className={cls} />;
    case "phone":
      return <Phone className={cls} />;
    case "username":
      return <AtSign className={cls} />;
    case "wallet":
      return <Wallet className={cls} />;
    case "domain":
    case "ip":
      return <Globe className={cls} />;
  }
}

function riskColors(level: string) {
  switch (level) {
    case "critical":
      return { text: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30", label: "CRITICAL" };
    case "high":
      return { text: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30", label: "HIGH" };
    case "medium":
      return { text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", label: "MEDIUM" };
    default:
      return { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", label: "LOW" };
  }
}

function maskTarget(target: string, type: string): string {
  if (type === "email") {
    const [user, domain] = target.split("@");
    if (!user || !domain) return target;
    return `${user.slice(0, 2)}${"•".repeat(Math.max(2, user.length - 2))}@${domain}`;
  }
  if (type === "phone") {
    return target.slice(0, 4) + "•".repeat(Math.max(2, target.length - 6)) + target.slice(-2);
  }
  if (type === "wallet") {
    return target.slice(0, 6) + "…" + target.slice(-4);
  }
  return target;
}

function TopBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#0B0B0B]/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/">
          <span data-testid="link-home" className="flex cursor-pointer items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-cyan-500/10 ring-1 ring-cyan-500/30">
              <ShieldCheck className="h-4 w-4 text-cyan-400" />
            </span>
            <span className="font-semibold tracking-tight text-white">DarkShare</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/pricing">
            <span data-testid="link-pricing" className="hidden cursor-pointer rounded-md px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:text-white sm:inline-block">
              Тарифы
            </span>
          </Link>
          <LanguageSwitcher />
          <Link href="/login">
            <span data-testid="link-signin" className="cursor-pointer rounded-md border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/[0.06]">
              Войти
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}

function HeroCheck() {
  const [, setLocation] = useLocation();
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QuickCheckResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const detected = useMemo(() => detectType(value), [value]);

  const onCheck = async () => {
    setError(null);
    setResult(null);

    const type = detectType(value);
    if (!type) {
      setError("Введи email, телефон, username, wallet, домен или IP");
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
      try {
        data = await resp.json();
      } catch {
        // server returned non-JSON (502, html error page, etc)
      }

      if (!resp.ok) {
        if (resp.status === 429) {
          setError("Дневной лимит бесплатных проверок исчерпан. Войди для большего количества.");
        } else if (resp.status >= 500) {
          setError("Сервис временно недоступен. Попробуй через минуту.");
        } else {
          setError(data?.error || "Не удалось выполнить проверку");
        }
        return;
      }

      if (!data || typeof data.riskScore !== "number") {
        setError("Не удалось разобрать ответ сервера. Попробуй ещё раз.");
        return;
      }

      setResult(data as QuickCheckResponse);
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (e) {
      setError("Сеть недоступна. Попробуй ещё раз.");
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") onCheck();
  };

  return (
    <section className="relative overflow-hidden border-b border-white/[0.06]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 60% 35% at 50% -10%, rgba(0,184,212,0.10) 0%, transparent 60%)",
        }}
      />

      <div className="relative mx-auto max-w-3xl px-4 pb-16 pt-16 sm:px-6 sm:pt-24">
        <div className="text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-zinc-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Сервис работает · 50+ источников
          </div>

          <h1 className="text-balance text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl md:text-6xl">
            Проверь, сливались ли<br className="hidden sm:block" /> твои данные в сеть
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-balance text-base text-zinc-400 sm:text-lg">
            Email · Телефон · Username · Wallet — анализ из десятков открытых источников.
            Результат за 10 секунд.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-xl">
          <div
            className={`group relative flex items-center gap-2 rounded-xl border bg-[#111113] p-2 transition-all ${
              detected ? "border-cyan-500/40 ring-2 ring-cyan-500/10" : "border-white/10 focus-within:border-white/20"
            }`}
          >
            <div className="flex items-center justify-center pl-2 text-zinc-500">
              <Search className="h-5 w-5" />
            </div>
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="email, телефон, username или wallet"
              autoComplete="off"
              spellCheck={false}
              data-testid="input-check"
              className="flex-1 bg-transparent py-3 text-base text-white outline-none placeholder:text-zinc-600 sm:text-lg"
            />
            <button
              onClick={onCheck}
              disabled={loading || !value.trim()}
              data-testid="button-check"
              className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-black transition-all hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50 sm:px-5"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="hidden sm:inline">Проверяем…</span>
                </>
              ) : (
                <>
                  <span>Проверить</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>

          <div className="mt-3 flex h-5 items-center justify-between px-1 text-xs">
            <div className="flex items-center gap-2 text-zinc-500">
              {detected ? (
                <span className="inline-flex items-center gap-1.5 text-cyan-400" data-testid="text-detected-type">
                  {typeIcon(detected)}
                  Определено: {typeLabel(detected)}
                </span>
              ) : (
                <span>Без регистрации · Анонимно · 3 проверки в сутки бесплатно</span>
              )}
            </div>
          </div>

          {error && (
            <div
              data-testid="text-error"
              className="mt-4 rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-300"
            >
              {error}
            </div>
          )}
        </div>

        <div ref={resultRef}>{result && <ResultCard result={result} onUpgrade={() => setLocation("/pricing")} />}</div>
      </div>
    </section>
  );
}

function ResultCard({ result, onUpgrade }: { result: QuickCheckResponse; onUpgrade: () => void }) {
  const colors = riskColors(result.riskLevel);
  const masked = maskTarget(result.target, result.type);
  const [, setLocation] = useLocation();

  const hiddenPlaceholders = [
    "Источник: ███████████ · 2024-██-██",
    "Источник: ████████ · 2023-██-██",
    "Связанный username: ████████",
    "Связанный аккаунт: ████████.██",
    "Гео: ███████, ███",
  ];

  return (
    <div className="mx-auto mt-10 max-w-xl" data-testid="card-result">
      <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111113]">
        <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <div className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              {typeLabel((result.type as CheckType) || "email")}
            </div>
            <div className="mt-1 truncate font-mono text-sm text-white sm:text-base" data-testid="text-target">
              {masked}
            </div>
          </div>
          <div className={`shrink-0 rounded-lg border px-3 py-1.5 text-right ${colors.border} ${colors.bg}`}>
            <div className={`text-xs font-bold tracking-wider ${colors.text}`} data-testid="text-risk-level">
              {colors.label}
            </div>
            <div className={`text-xl font-bold leading-none ${colors.text}`} data-testid="text-risk-score">
              {result.riskScore}
              <span className="text-xs text-zinc-500">/100</span>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 sm:px-6">
          <p className="text-sm text-zinc-300" data-testid="text-summary">
            {result.summary}
          </p>

          {result.findings && result.findings.length > 0 && (
            <ul className="mt-4 space-y-2">
              {result.findings.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-zinc-400" data-testid={`text-finding-${i}`}>
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400/70" />
                  <span>{f.replace(/^[✅⚠️❌ℹ️🔴🟡🟢]\s*/u, "")}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-5 rounded-lg border border-white/[0.06] bg-black/30 p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
              <Lock className="h-3.5 w-3.5" />
              Скрыто в полном отчёте
            </div>
            <ul className="space-y-1.5 select-none">
              {hiddenPlaceholders.map((p, i) => (
                <li
                  key={i}
                  className="font-mono text-sm text-zinc-600 [filter:blur(3px)]"
                  data-testid={`text-blurred-${i}`}
                >
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 border-t border-white/[0.06] bg-black/20 p-4 sm:grid-cols-2 sm:p-5">
          <button
            onClick={onUpgrade}
            data-testid="button-buy-report"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 py-3 text-sm font-semibold text-black transition-all hover:bg-cyan-400"
          >
            Открыть полный отчёт — $3
          </button>
          <button
            onClick={() => setLocation("/pricing")}
            data-testid="button-get-pro"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-white/[0.06]"
          >
            PRO доступ — $9/мес
          </button>
        </div>

        <div className="border-t border-white/[0.06] px-5 py-3 text-center text-xs text-zinc-500 sm:px-6">
          Возврат денег 7 дней · PDF-отчёт · Без логов
        </div>
      </div>
    </div>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "Введи запрос",
      desc: "Email, телефон, username или кошелёк. Тип определится автоматически.",
    },
    {
      n: "02",
      title: "Получи частичный результат",
      desc: "Risk Score, кол-во утечек и сводка — за 3–10 секунд. Бесплатно.",
    },
    {
      n: "03",
      title: "Открой полный отчёт",
      desc: "Все источники, даты, связанные данные и рекомендации — в PDF.",
    },
  ];

  return (
    <section className="border-b border-white/[0.06] py-16 sm:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Как это работает</h2>
          <p className="mt-2 text-sm text-zinc-400">Три шага между «не знаю» и «знаю всё»</p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          {steps.map((s) => (
            <div
              key={s.n}
              className="rounded-xl border border-white/[0.06] bg-[#111113] p-5"
              data-testid={`card-step-${s.n}`}
            >
              <div className="mb-3 font-mono text-xs text-cyan-400">{s.n}</div>
              <h3 className="mb-1.5 text-base font-semibold text-white">{s.title}</h3>
              <p className="text-sm leading-relaxed text-zinc-400">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Sources() {
  const sources = [
    "Have I Been Pwned",
    "AbuseIPDB",
    "VirusTotal",
    "URLScan.io",
    "Etherscan",
    "Blockchair",
    "ip-api",
    "crt.sh",
    "WhoisXML",
    "Google Safe Browsing",
    "NumVerify",
    "Hunter",
  ];

  return (
    <section className="border-b border-white/[0.06] py-16 sm:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Один запрос — десятки источников
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            Используем те же базы, что и крупные threat-intelligence платформы
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {sources.map((s) => (
            <div
              key={s}
              className="rounded-lg border border-white/[0.06] bg-[#111113] px-4 py-3 text-center text-sm text-zinc-300"
              data-testid={`text-source-${s.toLowerCase().replace(/\s+/g, "-")}`}
            >
              {s}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingTeaser() {
  return (
    <section className="border-b border-white/[0.06] py-16 sm:py-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Простые цены</h2>
          <p className="mt-2 text-sm text-zinc-400">Без скрытых платежей. Возврат 7 дней.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/[0.08] bg-[#111113] p-6 sm:p-7" data-testid="card-price-single">
            <div className="text-xs font-medium uppercase tracking-wider text-zinc-500">Разовый отчёт</div>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-4xl font-bold tracking-tight text-white">$3</span>
              <span className="text-sm text-zinc-500">/ отчёт</span>
            </div>
            <p className="mt-3 text-sm text-zinc-400">Полный отчёт по одному запросу. PDF, источники, рекомендации.</p>
            <ul className="mt-5 space-y-2 text-sm text-zinc-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-cyan-400" /> Все источники утечек
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-cyan-400" /> PDF с risk score
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-cyan-400" /> Рекомендации по защите
              </li>
            </ul>
            <Link href="/pricing">
              <span
                data-testid="button-buy-single"
                className="mt-6 block cursor-pointer rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-white/[0.06]"
              >
                Получить отчёт
              </span>
            </Link>
          </div>

          <div
            className="relative rounded-2xl border border-cyan-500/30 bg-gradient-to-b from-cyan-500/[0.06] to-transparent p-6 sm:p-7"
            data-testid="card-price-pro"
          >
            <div className="absolute -top-2.5 right-5 rounded-full bg-cyan-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-black">
              Лучший выбор
            </div>
            <div className="text-xs font-medium uppercase tracking-wider text-cyan-400">PRO</div>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-4xl font-bold tracking-tight text-white">$9</span>
              <span className="text-sm text-zinc-500">/ месяц</span>
            </div>
            <p className="mt-3 text-sm text-zinc-400">Безлимитные проверки и мониторинг изменений.</p>
            <ul className="mt-5 space-y-2 text-sm text-zinc-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-cyan-400" /> 50 проверок в день
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-cyan-400" /> История и PDF-отчёты
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-cyan-400" /> Уведомления о новых утечках
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-cyan-400" /> Telegram-бот без лимитов
              </li>
            </ul>
            <Link href="/pricing">
              <span
                data-testid="button-buy-pro"
                className="mt-6 block cursor-pointer rounded-lg bg-cyan-500 px-4 py-3 text-center text-sm font-semibold text-black transition-colors hover:bg-cyan-400"
              >
                Оформить PRO
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/[0.06] py-4 last:border-b-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-start justify-between gap-4 text-left"
        data-testid={`button-faq-${q.slice(0, 20)}`}
      >
        <span className="text-sm font-medium text-white sm:text-base">{q}</span>
        <ChevronDown
          className={`mt-1 h-4 w-4 shrink-0 text-zinc-500 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <p className="mt-3 text-sm leading-relaxed text-zinc-400">{a}</p>}
    </div>
  );
}

function FAQ() {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Частые вопросы</h2>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-[#111113] px-5 py-2 sm:px-6">
          <FaqItem
            q="Это легально?"
            a="Да. Мы агрегируем только публично доступные данные: известные утечки баз, open-source intelligence, blacklist'ы и публичные блокчейны. Мы не взламываем сервисы и не покупаем приватные данные."
          />
          <FaqItem
            q="Где хранятся мои запросы?"
            a="Бесплатные проверки не привязаны к аккаунту. Для оплаченных отчётов мы храним только сам отчёт в твоём аккаунте — ты можешь удалить его в любой момент. Запросы не передаются третьим лицам."
          />
          <FaqItem
            q="Можно ли вернуть деньги?"
            a="Да, в течение 7 дней с момента оплаты — без вопросов. Напиши в поддержку и мы вернём средства тем же способом."
          />
          <FaqItem
            q="Чем вы отличаетесь от бесплатных сервисов?"
            a="Бесплатные сервисы (типа HIBP) проверяют только утечки email. Мы агрегируем 50+ источников по 6 типам объектов: email, телефон, username, wallet, домен, IP — и отдаём один цельный отчёт с risk-score и рекомендациями."
          />
          <FaqItem
            q="Какие способы оплаты?"
            a="Карта (Visa / Mastercard через Stripe), а также крипта (USDT, BTC, ETH). Возврат — на ту же карту в течение 5–10 рабочих дней."
          />
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  useEffect(() => {
    document.title = "DarkShare — Проверка утечек данных";
    document.body.style.backgroundColor = "#0B0B0B";
    return () => {
      document.body.style.backgroundColor = "";
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white">
      <TopBar />
      <main>
        <HeroCheck />
        <HowItWorks />
        <Sources />
        <PricingTeaser />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
