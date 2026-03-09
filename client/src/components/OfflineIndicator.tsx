import { useState, useEffect } from "react";
import { WifiOff, Wifi } from "lucide-react";

const translations: Record<string, { offline: string; online: string }> = {
  en: { offline: "You're offline", online: "Back online!" },
  de: { offline: "Sie sind offline", online: "Wieder online!" },
  es: { offline: "Estás sin conexión", online: "De vuelta en línea!" },
  fr: { offline: "Vous êtes hors ligne", online: "De retour en ligne !" },
  ru: { offline: "Вы офлайн", online: "Снова онлайн!" },
};

function getTexts(lang: string) {
  return translations[lang] || translations.en;
}

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOnlineBanner, setShowOnlineBanner] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  const storedLang = typeof window !== "undefined"
    ? localStorage.getItem("darkshare_language") || "en"
    : "en";
  const texts = getTexts(storedLang);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        setShowOnlineBanner(true);
        setTimeout(() => setShowOnlineBanner(false), 3000);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [wasOffline]);

  if (isOnline && !showOnlineBanner) return null;

  return (
    <div
      data-testid="banner-offline-indicator"
      className={`fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white transition-transform duration-300 ${
        !isOnline
          ? "bg-red-600 dark:bg-red-700 animate-pulse"
          : "bg-green-600 dark:bg-green-700"
      }`}
      style={{ animation: !isOnline ? "pulse 2s infinite" : undefined }}
    >
      {!isOnline ? (
        <>
          <WifiOff className="h-4 w-4" />
          <span data-testid="text-offline-message">{texts.offline}</span>
        </>
      ) : (
        <>
          <Wifi className="h-4 w-4" />
          <span data-testid="text-online-message">{texts.online}</span>
        </>
      )}
    </div>
  );
}
