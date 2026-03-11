type NotificationCategory = 'threat_alert' | 'daily_digest' | 'streak_reminder' | 'scan_reminder';

interface ScheduledNotification {
  id: string;
  timerId: ReturnType<typeof setTimeout> | ReturnType<typeof setInterval>;
  category: NotificationCategory;
}

const PERMISSION_KEY = 'darkshare_notification_permission_asked';
const LAST_CHECK_KEY = 'darkshare_last_check_date';
const scheduledNotifications: ScheduledNotification[] = [];

export function isNotificationSupported(): boolean {
  return 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isNotificationSupported()) return 'unsupported';
  const result = await Notification.requestPermission();
  localStorage.setItem(PERMISSION_KEY, 'true');
  return result;
}

export function hasAskedPermission(): boolean {
  return localStorage.getItem(PERMISSION_KEY) === 'true';
}

export function showNotification(
  title: string,
  options?: NotificationOptions & { category?: NotificationCategory }
): void {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return;

  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification(title, {
        icon: '/favicon.png',
        badge: '/favicon.png',
        ...options,
        data: { ...options?.data, category: options?.category },
      });
    });
  } else {
    new Notification(title, {
      icon: '/favicon.png',
      ...options,
    });
  }
}

export function scheduleScanReminder(intervalMs: number = 8 * 60 * 60 * 1000): void {
  clearScheduledByCategory('scan_reminder');

  const timerId = setInterval(() => {
    showNotification('Time for a Security Check', {
      body: 'Run a quick scan to keep your files safe. Stay protected!',
      category: 'scan_reminder',
      tag: 'scan-reminder',
    });
  }, intervalMs);

  scheduledNotifications.push({ id: 'scan-reminder', timerId, category: 'scan_reminder' });
}

export function scheduleStreakReminder(delayMs: number = 4 * 60 * 60 * 1000): void {
  clearScheduledByCategory('streak_reminder');

  const lastCheck = localStorage.getItem(LAST_CHECK_KEY);
  const today = new Date().toDateString();

  if (lastCheck === today) return;

  const timerId = setTimeout(() => {
    const stillNotChecked = localStorage.getItem(LAST_CHECK_KEY) !== new Date().toDateString();
    if (stillNotChecked) {
      showNotification('Keep Your Streak Alive!', {
        body: "You haven't scanned anything today. Don't break your streak!",
        category: 'streak_reminder',
        tag: 'streak-reminder',
      });
    }
  }, delayMs);

  scheduledNotifications.push({ id: 'streak-reminder', timerId, category: 'streak_reminder' });
}

export function showThreatAlert(threatName: string): void {
  showNotification('Threat Detected', {
    body: `A potential threat was found: ${threatName}. Review the results now.`,
    category: 'threat_alert',
    tag: 'threat-alert',
    requireInteraction: true,
  });
}

export function showDailyDigest(scansToday: number, threatsFound: number): void {
  showNotification('Daily Security Digest', {
    body: `Today: ${scansToday} scans completed, ${threatsFound} threats detected.`,
    category: 'daily_digest',
    tag: 'daily-digest',
  });
}

export function recordCheckToday(): void {
  localStorage.setItem(LAST_CHECK_KEY, new Date().toDateString());
}

export function hasCheckedToday(): boolean {
  return localStorage.getItem(LAST_CHECK_KEY) === new Date().toDateString();
}

function clearScheduledByCategory(category: NotificationCategory): void {
  const toRemove = scheduledNotifications.filter((n) => n.category === category);
  toRemove.forEach((n) => {
    clearTimeout(n.timerId);
    clearInterval(n.timerId);
  });
  const remaining = scheduledNotifications.filter((n) => n.category !== category);
  scheduledNotifications.length = 0;
  scheduledNotifications.push(...remaining);
}

export function clearAllScheduled(): void {
  scheduledNotifications.forEach((n) => {
    clearTimeout(n.timerId);
    clearInterval(n.timerId);
  });
  scheduledNotifications.length = 0;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeToPush(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;

  try {
    const vapidRes = await fetch('/api/push/vapid-key');
    if (!vapidRes.ok) return false;
    const { publicKey } = await vapidRes.json();
    if (!publicKey) return false;

    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
    }

    const subJson = subscription.toJSON();
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        endpoint: subJson.endpoint,
        keys: subJson.keys,
      }),
    });

    return true;
  } catch (err) {
    console.error('Push subscription failed:', err);
    return false;
  }
}

export async function unsubscribeFromPush(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return true;

    const endpoint = subscription.endpoint;
    await subscription.unsubscribe();

    await fetch('/api/push/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ endpoint }),
    });

    return true;
  } catch (err) {
    console.error('Push unsubscription failed:', err);
    return false;
  }
}

export async function isPushSubscribed(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return !!subscription;
  } catch {
    return false;
  }
}
