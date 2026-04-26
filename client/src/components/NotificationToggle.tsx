import { useEffect, useRef, useState, useCallback } from "react";
import { Bell, BellOff, Loader2, AlertCircle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";

type Lang = "en" | "uk" | "ru" | "es" | "de";

const labels: Record<Lang, Record<string, string>> = {
  en: {
    title: "Push notifications",
    subtitle: "Get instant alerts for new threats & report updates",
    enabled: "Enabled",
    disabled: "Disabled",
    enabling: "Enabling…",
    disabling: "Disabling…",
    blocked: "Blocked in browser settings",
    unsupported: "Not supported on this device",
    notConfigured: "Push not yet configured",
    enableSuccess: "Notifications enabled",
    disableSuccess: "Notifications disabled",
    permDenied: "Permission denied — enable in browser settings",
    swMissing: "Service worker unavailable",
    failed: "Failed to enable notifications",
  },
  uk: {
    title: "Push-сповіщення",
    subtitle: "Миттєві алерти про нові загрози та оновлення звітів",
    enabled: "Увімкнено",
    disabled: "Вимкнено",
    enabling: "Вмикання…",
    disabling: "Вимкнення…",
    blocked: "Заблоковано в налаштуваннях браузера",
    unsupported: "Не підтримується на цьому пристрої",
    notConfigured: "Push ще не налаштовано",
    enableSuccess: "Сповіщення увімкнено",
    disableSuccess: "Сповіщення вимкнено",
    permDenied: "Дозвіл відхилено — увімкни в налаштуваннях браузера",
    swMissing: "Service worker недоступний",
    failed: "Не вдалося увімкнути сповіщення",
  },
  ru: {
    title: "Push-уведомления",
    subtitle: "Мгновенные алерты о новых угрозах и обновлениях отчётов",
    enabled: "Включено",
    disabled: "Выключено",
    enabling: "Включение…",
    disabling: "Выключение…",
    blocked: "Заблокировано в настройках браузера",
    unsupported: "Не поддерживается на этом устройстве",
    notConfigured: "Push ещё не настроен",
    enableSuccess: "Уведомления включены",
    disableSuccess: "Уведомления выключены",
    permDenied: "Разрешение отклонено — включи в настройках браузера",
    swMissing: "Service worker недоступен",
    failed: "Не удалось включить уведомления",
  },
  es: {
    title: "Notificaciones push",
    subtitle: "Alertas instantáneas sobre nuevas amenazas y actualizaciones",
    enabled: "Activadas",
    disabled: "Desactivadas",
    enabling: "Activando…",
    disabling: "Desactivando…",
    blocked: "Bloqueado en la configuración del navegador",
    unsupported: "No compatible con este dispositivo",
    notConfigured: "Push aún no configurado",
    enableSuccess: "Notificaciones activadas",
    disableSuccess: "Notificaciones desactivadas",
    permDenied: "Permiso denegado — actívalo en la configuración del navegador",
    swMissing: "Service worker no disponible",
    failed: "Error al activar las notificaciones",
  },
  de: {
    title: "Push-Benachrichtigungen",
    subtitle: "Sofortige Alerts zu neuen Bedrohungen & Reports",
    enabled: "Aktiviert",
    disabled: "Deaktiviert",
    enabling: "Aktivieren…",
    disabling: "Deaktivieren…",
    blocked: "In Browser-Einstellungen blockiert",
    unsupported: "Auf diesem Gerät nicht unterstützt",
    notConfigured: "Push noch nicht konfiguriert",
    enableSuccess: "Benachrichtigungen aktiviert",
    disableSuccess: "Benachrichtigungen deaktiviert",
    permDenied: "Erlaubnis verweigert — in Browser-Einstellungen aktivieren",
    swMissing: "Service Worker nicht verfügbar",
    failed: "Aktivieren fehlgeschlagen",
  },
};

const SUPPORTED: Lang[] = ["en", "uk", "ru", "es", "de"];
const RETRY_KEY = "darkshare_push_unsub_retry_v1";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

function readRetryQueue(): string[] {
  try {
    const raw = localStorage.getItem(RETRY_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
  } catch { return []; }
}
function writeRetryQueue(arr: string[]) {
  try {
    if (arr.length === 0) localStorage.removeItem(RETRY_KEY);
    else localStorage.setItem(RETRY_KEY, JSON.stringify(arr.slice(0, 20)));
  } catch {}
}
function enqueueUnsubRetry(endpoint: string) {
  const q = readRetryQueue();
  if (!q.includes(endpoint)) { q.push(endpoint); writeRetryQueue(q); }
}
async function flushUnsubRetryQueue() {
  const q = readRetryQueue();
  if (q.length === 0) return;
  const remaining: string[] = [];
  for (const endpoint of q) {
    try {
      const r = await fetch("/api/push/unsubscribe", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint }),
      });
      if (!r.ok && r.status !== 404) remaining.push(endpoint);
    } catch { remaining.push(endpoint); }
  }
  writeRetryQueue(remaining);
}

export function NotificationToggle() {
  const { lang } = useTranslation();
  const safeLang: Lang = SUPPORTED.includes(lang as Lang) ? (lang as Lang) : "en";
  const t = labels[safeLang];
  const { toast } = useToast();

  const [supported, setSupported] = useState<boolean>(true);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [vapidAvailable, setVapidAvailable] = useState<boolean | null>(null);
  const mountedRef = useRef(true);

  const checkSupport = useCallback(() => {
    return (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window
    );
  }, []);

  const syncState = useCallback(async () => {
    if (!checkSupport()) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (!mountedRef.current) return;
      setEnabled(!!sub);
      setPermission(Notification.permission);
    } catch {
      if (!mountedRef.current) return;
      setEnabled(false);
    }
  }, [checkSupport]);

  useEffect(() => {
    mountedRef.current = true;
    const supp = checkSupport();
    setSupported(supp);
    if (!supp) return;

    setPermission(Notification.permission);
    syncState();
    flushUnsubRetryQueue();

    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/push/vapid-key");
        if (cancelled || !mountedRef.current) return;
        if (r.ok) {
          const j = await r.json().catch(() => ({}));
          setVapidAvailable(!!j.publicKey);
        } else {
          setVapidAvailable(false);
        }
      } catch {
        if (!cancelled && mountedRef.current) setVapidAvailable(false);
      }
    })();

    const onVisibility = () => { if (document.visibilityState === "visible") { syncState(); flushUnsubRetryQueue(); } };
    const onOnline = () => { flushUnsubRetryQueue(); syncState(); };
    const onControllerChange = () => { syncState(); };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("online", onOnline);
    if (navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    }

    return () => {
      mountedRef.current = false;
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("online", onOnline);
      if (navigator.serviceWorker) {
        navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      }
    };
  }, [checkSupport, syncState]);

  const registerSubOnServer = async (sub: PushSubscription): Promise<boolean> => {
    const json: any = sub.toJSON();
    try {
      const r = await fetch("/api/push/subscribe", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: { p256dh: json.keys?.p256dh, auth: json.keys?.auth },
        }),
      });
      return r.ok;
    } catch { return false; }
  };

  const enable = async () => {
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      if (!mountedRef.current) return;
      setPermission(perm);
      if (perm !== "granted") {
        toast({ title: t.permDenied, variant: "destructive" });
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      if (!reg) {
        toast({ title: t.swMissing, variant: "destructive" });
        return;
      }

      const existing = await reg.pushManager.getSubscription();
      if (existing) {
        const ok = await registerSubOnServer(existing);
        if (!ok) {
          try { await existing.unsubscribe(); } catch {}
          toast({ title: t.failed, variant: "destructive" });
          if (mountedRef.current) setEnabled(false);
          return;
        }
        if (mountedRef.current) {
          setEnabled(true);
          toast({ title: t.enableSuccess });
        }
        return;
      }

      const keyResp = await fetch("/api/push/vapid-key", { credentials: "include" });
      if (!keyResp.ok) {
        toast({ title: t.notConfigured, variant: "destructive" });
        if (mountedRef.current) setVapidAvailable(false);
        return;
      }
      const { publicKey } = await keyResp.json();
      if (!publicKey) {
        toast({ title: t.notConfigured, variant: "destructive" });
        return;
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const ok = await registerSubOnServer(sub);
      if (!ok) {
        try { await sub.unsubscribe(); } catch {}
        toast({ title: t.failed, variant: "destructive" });
        if (mountedRef.current) setEnabled(false);
        return;
      }
      if (mountedRef.current) {
        setEnabled(true);
        toast({ title: t.enableSuccess });
      }
    } catch (e: any) {
      if (mountedRef.current) toast({ title: e?.message || t.failed, variant: "destructive" });
    } finally {
      if (mountedRef.current) setBusy(false);
    }
  };

  const disable = async () => {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        const endpoint = sub.endpoint;
        let serverOk = false;
        try {
          const r = await fetch("/api/push/unsubscribe", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endpoint }),
          });
          serverOk = r.ok || r.status === 404;
        } catch {}
        if (!serverOk) enqueueUnsubRetry(endpoint);
        try { await sub.unsubscribe(); } catch {}
      }
      if (mountedRef.current) {
        setEnabled(false);
        toast({ title: t.disableSuccess });
      }
    } finally {
      if (mountedRef.current) setBusy(false);
    }
  };

  const handleToggle = (next: boolean) => {
    if (busy) return;
    if (next) enable(); else disable();
  };

  let statusText: string = enabled ? t.enabled : t.disabled;
  let statusClass = enabled ? "text-cyan-300" : "text-zinc-500";

  if (!supported) { statusText = t.unsupported; statusClass = "text-zinc-500"; }
  else if (permission === "denied") { statusText = t.blocked; statusClass = "text-orange-400"; }
  else if (vapidAvailable === false) { statusText = t.notConfigured; statusClass = "text-zinc-500"; }
  else if (busy) { statusText = enabled ? t.disabling : t.enabling; statusClass = "text-cyan-300"; }

  const disabled = !supported || permission === "denied" || vapidAvailable === false || busy;

  return (
    <div
      className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/[0.08] via-zinc-900/40 to-transparent border border-cyan-500/25"
      data-testid="notification-toggle"
    >
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 border ${enabled ? "bg-cyan-500/20 border-cyan-500/50 shadow-[0_0_15px_rgba(34,211,238,0.3)]" : "bg-zinc-800/60 border-zinc-700/60"}`}>
          {busy ? (
            <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
          ) : enabled ? (
            <Bell className="w-4 h-4 text-cyan-300" />
          ) : (
            <BellOff className="w-4 h-4 text-zinc-400" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-xs font-display font-semibold text-cyan-300 uppercase tracking-wider truncate">
              {t.title}
            </h4>
            <Switch
              checked={enabled}
              onCheckedChange={handleToggle}
              disabled={disabled}
              data-testid="switch-notifications"
              aria-label={t.title}
              className="data-[state=checked]:bg-cyan-500"
            />
          </div>
          <p className="text-[10px] text-zinc-500 mt-0.5 leading-snug">{t.subtitle}</p>
          <div className={`text-[10px] mt-1 flex items-center gap-1 ${statusClass}`}>
            {(permission === "denied" || vapidAvailable === false) && <AlertCircle className="w-2.5 h-2.5" />}
            <span data-testid="text-notification-status">{statusText}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
