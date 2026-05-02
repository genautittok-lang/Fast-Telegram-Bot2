import { ReactNode } from "react";
import { Link } from "wouter";
import { Lock, Sparkles, ArrowRight, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

type Lang = "en" | "uk" | "ru" | "es" | "de";
const SUPPORTED: Lang[] = ["en", "uk", "ru", "es", "de"];

const labels: Record<Lang, { headline: string; sub: string; cta: string; promo: string }> = {
  en: {
    headline: "Full breakdown locked",
    sub: "Unlock all findings, AI verdict, sources & PDF report",
    cta: "Unlock with PRO — $9/mo",
    promo: "Use code DARKNEU for −50% → first month $4.50",
  },
  uk: {
    headline: "Повний звіт заблоковано",
    sub: "Розблокуй усі знахідки, AI-вердикт, джерела та PDF",
    cta: "Розблокувати з PRO — $9/міс",
    promo: "Промокод DARKNEU → −50% · перший місяць $4.50",
  },
  ru: {
    headline: "Полный отчёт заблокирован",
    sub: "Разблокируй все находки, AI-вердикт, источники и PDF",
    cta: "Разблокировать с PRO — $9/мес",
    promo: "Промокод DARKNEU → −50% · первый месяц $4.50",
  },
  es: {
    headline: "Informe completo bloqueado",
    sub: "Desbloquea todos los hallazgos, veredicto IA, fuentes y PDF",
    cta: "Desbloquear con PRO — $9/mes",
    promo: "Usa el código DARKNEU −50% → primer mes $4.50",
  },
  de: {
    headline: "Vollständiger Bericht gesperrt",
    sub: "Alle Funde, KI-Urteil, Quellen und PDF freischalten",
    cta: "Mit PRO freischalten — $9/Mo",
    promo: "Code DARKNEU für −50% → erster Monat $4.50",
  },
};

interface PremiumLockProps {
  lang: string;
  children: ReactNode;
  variant?: "blur" | "replace";
  testId?: string;
}

export function PremiumLock({ lang, children, variant = "blur", testId = "premium-lock" }: PremiumLockProps) {
  const safeLang: Lang = SUPPORTED.includes(lang as Lang) ? (lang as Lang) : "en";
  const L = labels[safeLang];

  if (variant === "replace") {
    return (
      <div
        className="relative rounded-xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/10 via-zinc-950 to-zinc-950 p-5 text-center"
        data-testid={testId}
      >
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-cyan-500/15 ring-1 ring-cyan-400/40 mb-3">
          <Lock className="h-5 w-5 text-cyan-300" />
        </div>
        <div className="text-cyan-100 font-semibold text-base mb-1" data-testid={`${testId}-headline`}>
          {L.headline}
        </div>
        <div className="text-zinc-400 text-sm mb-4 max-w-md mx-auto" data-testid={`${testId}-sub`}>
          {L.sub}
        </div>
        <Link href="/pricing?plan=PRO&code=DARKNEU&src=scan_lock" className="block w-full sm:w-auto sm:inline-block">
          <Button
            size="sm"
            className="w-full sm:w-auto bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-semibold shadow-[0_0_24px_rgba(34,211,238,0.4)] h-11 text-sm"
            data-testid={`${testId}-cta`}
          >
            <Sparkles className="h-4 w-4 mr-1.5" />
            {L.cta}
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
        <div className="text-xs text-cyan-400/80 mt-2" data-testid={`${testId}-promo`}>
          {L.promo}
        </div>
      </div>
    );
  }

  return (
    <div className="relative" data-testid={testId}>
      <div className="select-none pointer-events-none blur-[6px] opacity-50" aria-hidden>
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-zinc-950/40 via-zinc-950/80 to-zinc-950/95 rounded-xl p-4">
        <div className="text-center max-w-sm">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-cyan-500/20 ring-1 ring-cyan-400/40 mb-2">
            <Lock className="h-4 w-4 text-cyan-300" />
          </div>
          <div className="text-cyan-100 font-semibold text-sm mb-1" data-testid={`${testId}-headline`}>
            {L.headline}
          </div>
          <div className="text-zinc-400 text-xs mb-3" data-testid={`${testId}-sub`}>
            {L.sub}
          </div>
          <Link href="/pricing?plan=PRO&code=DARKNEU&src=scan_lock">
            <Button
              size="sm"
              className="bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-semibold shadow-[0_0_24px_rgba(34,211,238,0.4)]"
              data-testid={`${testId}-cta`}
            >
              <Sparkles className="h-3 w-3 mr-1" />
              {L.cta}
            </Button>
          </Link>
          <div className="text-[10px] text-cyan-400/80 mt-1.5" data-testid={`${testId}-promo`}>
            {L.promo}
          </div>
        </div>
      </div>
    </div>
  );
}

const ctaLabels: Record<Lang, { line1: string; line2: string; cta: string; social: string }> = {
  en: { line1: "Liked the scan?", line2: "Get unlimited checks, full reports, AI analysis & VPN", cta: "Get PRO — $9/mo", social: "Join 2,800+ security researchers" },
  uk: { line1: "Сподобалась перевірка?", line2: "Безліміт перевірок, повні звіти, AI-аналіз та VPN", cta: "Отримати PRO — $9/міс", social: "Вже 2 800+ дослідників захищені" },
  ru: { line1: "Понравилась проверка?", line2: "Безлимит проверок, полные отчёты, AI-анализ и VPN", cta: "Получить PRO — $9/мес", social: "Уже 2 800+ исследователей защищены" },
  es: { line1: "¿Te gustó el escaneo?", line2: "Verificaciones ilimitadas, informes completos, IA y VPN", cta: "Obtener PRO — $9/mes", social: "Únete a 2,800+ investigadores" },
  de: { line1: "Scan gefallen?", line2: "Unbegrenzte Prüfungen, volle Berichte, KI-Analyse und VPN", cta: "PRO holen — $9/Mo", social: "Bereits 2.800+ Forscher geschützt" },
};

export function PostResultUpsell({ lang, testId = "post-result-upsell" }: { lang: string; testId?: string }) {
  const safeLang: Lang = SUPPORTED.includes(lang as Lang) ? (lang as Lang) : "en";
  const L = ctaLabels[safeLang];
  return (
    <div
      className="rounded-xl border border-cyan-400/40 bg-gradient-to-r from-cyan-500/15 via-cyan-400/5 to-transparent p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3"
      data-testid={testId}
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-cyan-500/20 ring-1 ring-cyan-400/40 flex items-center justify-center">
        <Shield className="h-5 w-5 text-cyan-300" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-cyan-100 font-semibold text-sm" data-testid={`${testId}-line1`}>{L.line1}</div>
        <div className="text-zinc-400 text-xs mt-0.5" data-testid={`${testId}-line2`}>{L.line2}</div>
        <div className="text-[11px] text-cyan-300/70 mt-0.5" data-testid={`${testId}-social`}>{L.social}</div>
      </div>
      <Link href="/pricing?plan=PRO&code=DARKNEU&src=post_result" className="w-full sm:w-auto">
        <button
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-semibold text-sm px-4 h-9 transition-colors"
          data-testid={`${testId}-cta`}
        >
          {L.cta}
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </Link>
    </div>
  );
}
