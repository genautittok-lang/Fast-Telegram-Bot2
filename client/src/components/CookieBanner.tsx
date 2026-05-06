import { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Cookie, X } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const { lang } = useTranslation();

  useEffect(() => {
    const consent = localStorage.getItem("ds_cookie_consent");
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const reopen = () => { setShowDetails(false); setVisible(true); };
    window.addEventListener("ds:open-cookie-settings", reopen);
    return () => window.removeEventListener("ds:open-cookie-settings", reopen);
  }, []);

  const save = (value: "all" | "essential") => {
    localStorage.setItem("ds_cookie_consent", value);
    localStorage.setItem("ds_cookie_consent_at", new Date().toISOString());
    setVisible(false);
  };

  const T = {
    title:
      lang === "uk" ? "Ми поважаємо вашу приватність" :
      lang === "ru" ? "Мы уважаем вашу приватность" :
      lang === "es" ? "Respetamos tu privacidad" :
      lang === "de" ? "Wir respektieren Ihre Privatsphäre" :
      "We respect your privacy",
    body:
      lang === "uk" ? "Ми використовуємо обов'язкові cookie для роботи сайту (сесія, безпека) та опційні аналітичні cookie, щоб покращувати продукт. Ви можете прийняти все або лише обов'язкові. Налаштування можна змінити будь-коли." :
      lang === "ru" ? "Мы используем обязательные cookie для работы сайта (сессия, безопасность) и опциональные аналитические cookie, чтобы улучшать продукт. Вы можете принять всё или только обязательные. Настройки можно изменить в любой момент." :
      lang === "es" ? "Usamos cookies estrictamente necesarias (sesión, seguridad) y cookies analíticas opcionales para mejorar el producto. Puede aceptar todas o solo las necesarias. Puede cambiar su elección en cualquier momento." :
      lang === "de" ? "Wir verwenden notwendige Cookies (Sitzung, Sicherheit) sowie optionale Analyse-Cookies zur Produktverbesserung. Sie können alle oder nur notwendige Cookies akzeptieren. Ihre Auswahl ist jederzeit änderbar." :
      "We use strictly necessary cookies (session, security) and optional analytics cookies to improve the product. You can accept all or only necessary cookies. You can change your choice anytime.",
    detailsToggle:
      lang === "uk" ? "Деталі" : lang === "ru" ? "Подробнее" : lang === "es" ? "Detalles" : lang === "de" ? "Details" : "Details",
    necessaryTitle:
      lang === "uk" ? "Обов'язкові" : lang === "ru" ? "Обязательные" : lang === "es" ? "Necesarias" : lang === "de" ? "Notwendig" : "Necessary",
    necessaryDesc:
      lang === "uk" ? "Сесія, авторизація, CSRF-захист. Не вимикаються." :
      lang === "ru" ? "Сессия, авторизация, CSRF-защита. Не отключаются." :
      lang === "es" ? "Sesión, autenticación, CSRF. No se pueden desactivar." :
      lang === "de" ? "Sitzung, Auth, CSRF. Nicht deaktivierbar." :
      "Session, auth, CSRF. Cannot be disabled.",
    analyticsTitle:
      lang === "uk" ? "Аналітика" : lang === "ru" ? "Аналитика" : lang === "es" ? "Analítica" : lang === "de" ? "Analytik" : "Analytics",
    analyticsDesc:
      lang === "uk" ? "Анонімні метрики використання, без продажу третім сторонам." :
      lang === "ru" ? "Анонимные метрики использования, без продажи третьим сторонам." :
      lang === "es" ? "Métricas de uso anónimas. No se venden a terceros." :
      lang === "de" ? "Anonyme Nutzungsmetriken. Kein Verkauf an Dritte." :
      "Anonymous usage metrics. Never sold to third parties.",
    accept:
      lang === "uk" ? "Прийняти все" : lang === "ru" ? "Принять всё" : lang === "es" ? "Aceptar todo" : lang === "de" ? "Alle akzeptieren" : "Accept all",
    onlyEssential:
      lang === "uk" ? "Лише обов'язкові" : lang === "ru" ? "Только обязательные" : lang === "es" ? "Solo necesarias" : lang === "de" ? "Nur notwendige" : "Necessary only",
    privacyLink:
      lang === "uk" ? "Політика приватності" : lang === "ru" ? "Политика приватности" : lang === "es" ? "Política de privacidad" : lang === "de" ? "Datenschutz" : "Privacy Policy",
    cookiePolicy:
      lang === "uk" ? "Cookie" : lang === "ru" ? "Cookie" : lang === "es" ? "Cookies" : lang === "de" ? "Cookies" : "Cookies",
    close:
      lang === "uk" ? "Закрити" : lang === "ru" ? "Закрыть" : lang === "es" ? "Cerrar" : lang === "de" ? "Schließen" : "Close",
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 220 }}
          className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-4 sm:bottom-4 sm:max-w-md z-50"
          role="dialog"
          aria-label={T.title}
          data-testid="cookie-banner"
        >
          <div className="rounded-2xl border border-white/[0.10] bg-[#0E0E12]/95 backdrop-blur-xl shadow-[0_20px_60px_-10px_rgba(0,0,0,0.7)]">
            <div className="flex items-start gap-3 p-4 pb-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-cyan-400/20 bg-cyan-500/[0.08]">
                <Cookie className="h-4 w-4 text-cyan-300" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-[13px] font-semibold text-white leading-tight">{T.title}</h3>
                  <button
                    onClick={() => save("essential")}
                    className="-mt-0.5 -mr-1 grid h-6 w-6 place-items-center rounded-md text-zinc-500 hover:bg-white/[0.06] hover:text-white transition-colors"
                    aria-label={T.close}
                    data-testid="button-cookie-close"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="mt-1 text-[12px] leading-relaxed text-zinc-400">{T.body}</p>

                {showDetails && (
                  <div className="mt-3 space-y-2 rounded-lg border border-white/[0.08] bg-black/30 p-3">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11.5px] font-semibold text-white">{T.necessaryTitle}</span>
                        <span className="text-[10px] text-emerald-400 uppercase tracking-wider">Always on</span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-zinc-400 leading-relaxed">{T.necessaryDesc}</p>
                    </div>
                    <div className="border-t border-white/[0.06] pt-2">
                      <span className="text-[11.5px] font-semibold text-white">{T.analyticsTitle}</span>
                      <p className="mt-0.5 text-[11px] text-zinc-400 leading-relaxed">{T.analyticsDesc}</p>
                    </div>
                  </div>
                )}

                <div className="mt-3 flex items-center gap-3 text-[11px] text-zinc-500">
                  <button
                    onClick={() => setShowDetails(v => !v)}
                    className="underline-offset-2 hover:text-zinc-200 hover:underline transition-colors"
                    data-testid="button-cookie-details"
                  >
                    {T.detailsToggle}
                  </button>
                  <span className="text-zinc-700">·</span>
                  <Link href="/privacy">
                    <span className="cursor-pointer underline-offset-2 hover:text-zinc-200 hover:underline transition-colors">
                      {T.privacyLink}
                    </span>
                  </Link>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 border-t border-white/[0.06] p-3">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => save("essential")}
                className="flex-1 h-9 text-[12px] font-medium text-zinc-300 hover:bg-white/[0.05] hover:text-white"
                data-testid="button-cookie-essential"
              >
                {T.onlyEssential}
              </Button>
              <Button
                size="sm"
                onClick={() => save("all")}
                className="flex-1 h-9 text-[12px] font-semibold bg-cyan-400 text-black hover:bg-cyan-300"
                data-testid="button-cookie-accept"
              >
                {T.accept}
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
