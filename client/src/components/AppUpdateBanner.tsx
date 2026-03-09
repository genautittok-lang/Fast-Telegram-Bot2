import { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AppUpdateBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const handleControllerChange = () => {
      setShowBanner(true);
    };

    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);

    navigator.serviceWorker.getRegistration().then((registration) => {
      if (!registration) return;

      const handleUpdateFound = () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            setShowBanner(true);
          }
        });
      };

      registration.addEventListener("updatefound", handleUpdateFound);
    });

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
    };
  }, []);

  if (!showBanner) return null;

  return (
    <div
      data-testid="banner-app-update"
      className="fixed top-0 left-0 right-0 z-[9998] flex items-center justify-center gap-3 px-4 py-3 bg-primary text-primary-foreground text-sm font-medium shadow-lg animate-in slide-in-from-top duration-500"
    >
      <RefreshCw className="h-4 w-4" />
      <span data-testid="text-update-available">New version available</span>
      <Button
        data-testid="button-refresh-app"
        size="sm"
        variant="secondary"
        onClick={() => window.location.reload()}
      >
        Refresh
      </Button>
    </div>
  );
}
