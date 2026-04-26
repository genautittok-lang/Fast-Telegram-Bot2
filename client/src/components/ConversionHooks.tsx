import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Flame, X, Clock, Gift, Sparkles, ArrowRight, Zap } from "lucide-react";

const STORAGE_KEY_BANNER = "ds_promo_banner_dismissed_v1";
const STORAGE_KEY_EXIT = "ds_exit_intent_shown_v1";

const safeStorage = {
  getLocal(key: string): string | null {
    try { return typeof window !== "undefined" ? window.localStorage.getItem(key) : null; }
    catch { return null; }
  },
  setLocal(key: string, value: string): void {
    try { if (typeof window !== "undefined") window.localStorage.setItem(key, value); }
    catch { /* swallow */ }
  },
  getSession(key: string): string | null {
    try { return typeof window !== "undefined" ? window.sessionStorage.getItem(key) : null; }
    catch { return null; }
  },
  setSession(key: string, value: string): void {
    try { if (typeof window !== "undefined") window.sessionStorage.setItem(key, value); }
    catch { /* swallow */ }
  },
};

function useCountdown(targetTimestamp: number, active: boolean = true) {
  const [remaining, setRemaining] = useState(() => Math.max(0, targetTimestamp - Date.now()));
  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => {
      setRemaining(Math.max(0, targetTimestamp - Date.now()));
    }, 1000);
    return () => clearInterval(interval);
  }, [targetTimestamp, active]);

  const totalSeconds = Math.floor(remaining / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { hours, minutes, seconds, isFinished: remaining === 0 };
}

function getOfferEnd(): number {
  const stored = safeStorage.getLocal("ds_offer_end_v1");
  if (stored) {
    const ts = Number(stored);
    if (!Number.isNaN(ts) && ts > Date.now()) return ts;
  }
  const ts = Date.now() + 24 * 60 * 60 * 1000;
  safeStorage.setLocal("ds_offer_end_v1", String(ts));
  return ts;
}

interface Props {
  lang: string;
  isAuthenticated?: boolean;
}

export function StickyPromoBar({ lang, isAuthenticated = false }: Props) {
  const [hidden, setHidden] = useState(true);
  const [offerEnd] = useState(() => getOfferEnd());
  const { hours, minutes, seconds, isFinished } = useCountdown(offerEnd, !hidden);

  useEffect(() => {
    if (isAuthenticated) return;
    const dismissed = safeStorage.getLocal(STORAGE_KEY_BANNER);
    if (!dismissed) {
      const t = setTimeout(() => setHidden(false), 1500);
      return () => clearTimeout(t);
    }
  }, [isAuthenticated]);

  if (isAuthenticated || isFinished) return null;

  const close = () => {
    setHidden(true);
    safeStorage.setLocal(STORAGE_KEY_BANNER, "1");
  };

  const labels = {
    title: lang === "uk" ? "🔥 Промокод DARKNEU — знижка 50% на перші 3 місяці" :
           lang === "ru" ? "🔥 Промокод DARKNEU — скидка 50% на первые 3 месяца" :
           lang === "es" ? "🔥 Código DARKNEU — 50% de descuento los primeros 3 meses" :
           lang === "de" ? "🔥 Code DARKNEU — 50% Rabatt für die ersten 3 Monate" :
                          "🔥 Promo DARKNEU — 50% off first 3 months",
    cta: lang === "uk" ? "Активувати" :
         lang === "ru" ? "Активировать" :
         lang === "es" ? "Activar" :
         lang === "de" ? "Aktivieren" :
                        "Activate",
    endsIn: lang === "uk" ? "Закінчується через" :
            lang === "ru" ? "Заканчивается через" :
            lang === "es" ? "Termina en" :
            lang === "de" ? "Endet in" :
                           "Ends in"
  };

  return (
    <AnimatePresence>
      {!hidden && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed bottom-3 left-1/2 -translate-x-1/2 z-[100] w-[min(96vw,720px)]"
          data-testid="sticky-promo-bar"
        >
          <div className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-zinc-950/95 backdrop-blur-xl shadow-[0_20px_50px_-15px_rgba(6,182,212,0.4)]">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-cyan-500/10 pointer-events-none" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />

            <div className="relative flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-3">
              <div className="hidden sm:flex w-9 h-9 rounded-lg bg-cyan-500/15 border border-cyan-500/30 items-center justify-center flex-shrink-0">
                <Flame className="w-4 h-4 text-cyan-400" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-white truncate">
                  {labels.title}
                </p>
                <div className="flex items-center gap-2 mt-1 text-[10px] sm:text-xs text-zinc-400">
                  <Clock className="w-3 h-3 text-cyan-400" />
                  <span>{labels.endsIn}:</span>
                  <span className="font-mono font-semibold text-cyan-300">
                    {String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
                  </span>
                </div>
              </div>

              <Link href="/pricing">
                <Button
                  size="sm"
                  className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold h-9 px-3 sm:px-4 text-xs sm:text-sm shadow-[0_0_20px_rgba(6,182,212,0.3)] flex-shrink-0"
                  data-testid="button-promo-activate"
                >
                  {labels.cta}
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>

              <button
                onClick={close}
                className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 -mr-1 flex-shrink-0"
                aria-label="Close"
                data-testid="button-promo-close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ExitIntentPopup({ lang, isAuthenticated = false }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated) return;
    if (safeStorage.getSession(STORAGE_KEY_EXIT)) return;

    let triggered = false;
    const onMouseLeave = (e: MouseEvent) => {
      if (triggered) return;
      if (e.clientY > 0) return;
      triggered = true;
      safeStorage.setSession(STORAGE_KEY_EXIT, "1");
      setOpen(true);
    };

    const minDelay = setTimeout(() => {
      document.addEventListener("mouseleave", onMouseLeave);
    }, 12000);

    return () => {
      clearTimeout(minDelay);
      document.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  if (isAuthenticated) return null;

  const labels = {
    headline: lang === "uk" ? "Зачекайте! 🎁" :
              lang === "ru" ? "Подождите! 🎁" :
              lang === "es" ? "¡Espera! 🎁" :
              lang === "de" ? "Warten Sie! 🎁" :
                             "Wait! 🎁",
    sub: lang === "uk" ? "Перш ніж піти, отримайте ексклюзивну знижку" :
         lang === "ru" ? "Прежде чем уйти, получите эксклюзивную скидку" :
         lang === "es" ? "Antes de irte, recibe un descuento exclusivo" :
         lang === "de" ? "Bevor Sie gehen, erhalten Sie einen exklusiven Rabatt" :
                        "Before you go, grab an exclusive discount",
    code: "DARKNEU",
    discount: lang === "uk" ? "−50% на 3 місяці" :
              lang === "ru" ? "−50% на 3 месяца" :
              lang === "es" ? "−50% por 3 meses" :
              lang === "de" ? "−50% für 3 Monate" :
                             "−50% for 3 months",
    cta: lang === "uk" ? "Скористатися знижкою" :
         lang === "ru" ? "Воспользоваться скидкой" :
         lang === "es" ? "Aplicar descuento" :
         lang === "de" ? "Rabatt einlösen" :
                        "Claim the discount",
    skip: lang === "uk" ? "Ні, дякую" :
          lang === "ru" ? "Нет, спасибо" :
          lang === "es" ? "No, gracias" :
          lang === "de" ? "Nein, danke" :
                         "No, thanks"
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          data-testid="exit-intent-popup"
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 30 }}
            transition={{ type: "spring", damping: 22, stiffness: 200 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="exit-popup-title"
            aria-describedby="exit-popup-desc"
            tabIndex={-1}
            className="relative w-full max-w-md rounded-2xl border border-cyan-500/30 bg-zinc-950 shadow-[0_30px_80px_-20px_rgba(6,182,212,0.5)] overflow-hidden focus:outline-none"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/15 via-transparent to-cyan-500/5 pointer-events-none" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 z-10 text-zinc-500 hover:text-white transition-colors p-1"
              aria-label="Close"
              data-testid="button-exit-popup-close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="relative p-7 sm:p-8 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 mb-4">
                <Gift className="w-7 h-7 text-cyan-400" />
              </div>

              <h2 id="exit-popup-title" className="text-2xl sm:text-3xl font-bold text-white mb-2 tracking-tight">
                {labels.headline}
              </h2>
              <p id="exit-popup-desc" className="text-zinc-400 mb-6">
                {labels.sub}
              </p>

              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span className="font-mono font-bold text-2xl sm:text-3xl text-cyan-400 tracking-widest px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                  {labels.code}
                </span>
                <Sparkles className="w-4 h-4 text-cyan-400" />
              </div>
              <p className="text-sm font-semibold text-white mb-6">
                {labels.discount}
              </p>

              <Link href="/pricing">
                <Button
                  size="lg"
                  className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold h-12 text-base shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all hover:scale-[1.02]"
                  onClick={() => setOpen(false)}
                  data-testid="button-exit-popup-claim"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  {labels.cta}
                </Button>
              </Link>

              <button
                onClick={() => setOpen(false)}
                className="mt-3 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                data-testid="button-exit-popup-skip"
              >
                {labels.skip}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ScarcityBadge({ lang }: { lang: string }) {
  const [spots] = useState(() => {
    const stored = sessionStorage.getItem("ds_pro_spots");
    if (stored) return Number(stored);
    const n = 8 + Math.floor(Math.random() * 7);
    sessionStorage.setItem("ds_pro_spots", String(n));
    return n;
  });

  const label = lang === "uk" ? `Залишилось ${spots} PRO місць сьогодні` :
                lang === "ru" ? `Осталось ${spots} PRO мест сегодня` :
                lang === "es" ? `Quedan ${spots} plazas PRO hoy` :
                lang === "de" ? `Nur noch ${spots} PRO-Plätze heute` :
                               `Only ${spots} PRO spots left today`;

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/25 text-xs font-medium text-orange-400" data-testid="scarcity-badge">
      <span className="relative flex h-1.5 w-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-orange-500" />
      </span>
      {label}
    </div>
  );
}
