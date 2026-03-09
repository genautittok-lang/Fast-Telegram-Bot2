import { useState, useEffect, useCallback } from "react";
import { Bell, X, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  hasAskedPermission,
  scheduleScanReminder,
  scheduleStreakReminder,
  clearAllScheduled,
} from "@/lib/notifications";

export function NotificationManager() {
  const [showBanner, setShowBanner] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');

  useEffect(() => {
    const perm = getNotificationPermission();
    setPermission(perm);

    if (perm === 'granted') {
      scheduleScanReminder();
      scheduleStreakReminder();
    } else if (perm === 'default' && !hasAskedPermission() && isNotificationSupported()) {
      const timer = setTimeout(() => setShowBanner(true), 5000);
      return () => clearTimeout(timer);
    }

    return () => clearAllScheduled();
  }, []);

  const handleAllow = useCallback(async () => {
    const result = await requestNotificationPermission();
    setPermission(result);
    setShowBanner(false);
    if (result === 'granted') {
      scheduleScanReminder();
      scheduleStreakReminder();
    }
  }, []);

  const handleDismiss = useCallback(() => {
    setShowBanner(false);
    localStorage.setItem('darkshare_notification_permission_asked', 'true');
  }, []);

  if (!showBanner || permission !== 'default') return null;

  return (
    <div
      data-testid="notification-permission-banner"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 animate-in slide-in-from-bottom-4 duration-300"
    >
      <div className="bg-card border rounded-md p-4 flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 p-2 rounded-md bg-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm" data-testid="text-notification-title">
              Stay Protected
            </p>
            <p className="text-xs text-muted-foreground mt-1" data-testid="text-notification-description">
              Enable notifications to get security alerts, daily scan reminders, and streak updates.
            </p>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleDismiss}
            data-testid="button-dismiss-notification-banner"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2 justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            data-testid="button-notification-later"
          >
            Later
          </Button>
          <Button
            size="sm"
            onClick={handleAllow}
            data-testid="button-enable-notifications"
          >
            <Bell className="h-3.5 w-3.5 mr-1.5" />
            Enable
          </Button>
        </div>
      </div>
    </div>
  );
}
