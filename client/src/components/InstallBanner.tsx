import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWA } from "@/lib/pwa";

const DISMISS_KEY = "darkshare_install_dismissed";
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000;

export function InstallBanner() {
  const { canInstall, triggerInstall, isIOS } = usePWA();
  const [dismissed, setDismissed] = useState(true);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const elapsed = Date.now() - parseInt(dismissedAt, 10);
      if (elapsed < DISMISS_DURATION) {
        setDismissed(true);
        return;
      }
    }
    setDismissed(false);
  }, []);

  useEffect(() => {
    if (!dismissed && (canInstall || isIOS)) {
      const timer = setTimeout(() => setVisible(true), 2000);
      return () => clearTimeout(timer);
    }
    setVisible(false);
  }, [dismissed, canInstall, isIOS]);

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setDismissed(true);
    setVisible(false);
  };

  const handleInstall = async () => {
    if (isIOS) return;
    const installed = await triggerInstall();
    if (installed) {
      setVisible(false);
    }
  };

  if (!visible) return null;

  return (
    <div
      data-testid="banner-install-app"
      className="fixed bottom-0 left-0 right-0 z-[9997] flex items-center justify-between gap-3 px-4 py-3 bg-card border-t shadow-lg animate-in slide-in-from-bottom duration-500"
    >
      <div className="flex items-center gap-3 min-w-0">
        <Download className="h-5 w-5 shrink-0 text-primary" />
        <div className="min-w-0">
          <p data-testid="text-install-prompt" className="text-sm font-medium truncate">
            Install DARKSHARE for a better experience
          </p>
          {isIOS && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Tap the share button, then "Add to Home Screen"
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {!isIOS && (
          <Button
            data-testid="button-install-app"
            size="sm"
            onClick={handleInstall}
          >
            Install
          </Button>
        )}
        <Button
          data-testid="button-dismiss-install"
          size="icon"
          variant="ghost"
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
