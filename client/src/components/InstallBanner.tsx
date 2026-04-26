import { useState, useEffect } from "react";
import { Download, X, Smartphone, Share, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWA } from "@/lib/pwa";
import { useTranslation } from "@/lib/i18n";

const DISMISS_KEY = "darkshare_install_dismissed_v5";
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000;

type Lang = "en" | "uk" | "ru" | "es" | "de";

const labels: Record<Lang, Record<string, string>> = {
  en: {
    title: "Install DARKSHARE",
    subtitle: "Get instant access · works offline · no app stores",
    iosTitle: "Add DARKSHARE to your Home Screen",
    iosStep1: "Tap",
    iosStep2: "then",
    iosStep3: 'Choose "Add to Home Screen"',
    install: "Install",
    later: "Later",
  },
  uk: {
    title: "Встановити DARKSHARE",
    subtitle: "Миттєвий доступ · працює офлайн · без сторів",
    iosTitle: "Додай DARKSHARE на головний екран",
    iosStep1: "Натисни",
    iosStep2: "потім",
    iosStep3: 'Обери "На початковий екран"',
    install: "Встановити",
    later: "Пізніше",
  },
  ru: {
    title: "Установить DARKSHARE",
    subtitle: "Мгновенный доступ · работает офлайн · без сторов",
    iosTitle: "Добавь DARKSHARE на главный экран",
    iosStep1: "Нажми",
    iosStep2: "затем",
    iosStep3: 'Выбери "На экран Домой"',
    install: "Установить",
    later: "Позже",
  },
  es: {
    title: "Instalar DARKSHARE",
    subtitle: "Acceso instantáneo · funciona sin conexión · sin tiendas",
    iosTitle: "Añade DARKSHARE a tu pantalla de inicio",
    iosStep1: "Toca",
    iosStep2: "luego",
    iosStep3: 'Elige "Añadir a pantalla de inicio"',
    install: "Instalar",
    later: "Más tarde",
  },
  de: {
    title: "DARKSHARE installieren",
    subtitle: "Sofortzugriff · offline-fähig · keine App-Stores",
    iosTitle: "DARKSHARE zum Startbildschirm hinzufügen",
    iosStep1: "Tippe auf",
    iosStep2: "dann",
    iosStep3: '"Zum Home-Bildschirm" wählen',
    install: "Installieren",
    later: "Später",
  },
};

const SUPPORTED: Lang[] = ["en", "uk", "ru", "es", "de"];

export function InstallBanner() {
  const { canInstall, triggerInstall, isIOS, isInstalled } = usePWA();
  const { lang } = useTranslation();
  const safeLang: Lang = SUPPORTED.includes(lang as Lang) ? (lang as Lang) : "en";
  const t = labels[safeLang];
  const [dismissed, setDismissed] = useState(true);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const dismissedAt = localStorage.getItem(DISMISS_KEY);
      if (dismissedAt) {
        const elapsed = Date.now() - parseInt(dismissedAt, 10);
        if (!isNaN(elapsed) && elapsed < DISMISS_DURATION) {
          setDismissed(true);
          return;
        }
      }
    } catch {}
    setDismissed(false);
  }, []);

  useEffect(() => {
    if (isInstalled) { setVisible(false); return; }
    if (!dismissed && (canInstall || isIOS)) {
      const timer = setTimeout(() => setVisible(true), 2500);
      return () => clearTimeout(timer);
    }
    setVisible(false);
  }, [dismissed, canInstall, isIOS, isInstalled]);

  const handleDismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, Date.now().toString()); } catch {}
    setDismissed(true);
    setVisible(false);
  };

  const handleInstall = async () => {
    if (isIOS) return;
    const installed = await triggerInstall();
    if (installed) setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      data-testid="banner-install-app"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9997] w-[calc(100%-1.5rem)] max-w-md animate-in slide-in-from-bottom duration-500"
      role="region"
      aria-live="polite"
      aria-label={t.title}
    >
      <div className="relative rounded-2xl border border-cyan-500/40 bg-gradient-to-br from-zinc-950 via-zinc-900/95 to-zinc-950 backdrop-blur-2xl shadow-[0_0_40px_rgba(34,211,238,0.25)] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/[0.06] via-transparent to-cyan-500/[0.04] pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

        <button
          onClick={handleDismiss}
          aria-label={t.later}
          data-testid="button-dismiss-install"
          className="absolute top-2 right-2 p-1.5 rounded-lg text-zinc-500 hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors z-10"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        <div className="relative p-4 flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500/30 to-cyan-700/10 border border-cyan-500/40 flex items-center justify-center flex-shrink-0 shadow-[0_0_20px_rgba(34,211,238,0.3)]">
            <Smartphone className="w-5 h-5 text-cyan-300" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-0.5">
              <h3 data-testid="text-install-prompt" className="text-sm font-display font-bold text-cyan-300 leading-tight">
                {isIOS ? t.iosTitle : t.title}
              </h3>
            </div>
            <p className="text-[11px] text-zinc-400 leading-snug pr-4">
              {isIOS ? (
                <span className="inline-flex flex-wrap items-center gap-1">
                  {t.iosStep1}
                  <Share className="inline w-3 h-3 text-cyan-400" />
                  {t.iosStep2}
                  <Plus className="inline w-3 h-3 text-cyan-400" />
                  — {t.iosStep3}
                </span>
              ) : (
                t.subtitle
              )}
            </p>

            {!isIOS && (
              <div className="mt-3 flex items-center gap-2">
                <Button
                  data-testid="button-install-app"
                  size="sm"
                  onClick={handleInstall}
                  className="bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-medium gap-1.5 h-8 px-3 text-xs shadow-[0_0_20px_rgba(34,211,238,0.4)]"
                >
                  <Download className="w-3.5 h-3.5" />
                  {t.install}
                </Button>
                <button
                  onClick={handleDismiss}
                  className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors"
                  data-testid="button-install-later"
                >
                  {t.later}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
