import { useEffect, useState, type ReactNode } from "react";
import { Link } from "wouter";
import {
  Shield,
  Globe2,
  Zap,
  Lock,
  Copy,
  CheckCircle2,
  AlertCircle,
  Clock,
  Smartphone,
  Monitor,
  Apple,
  ExternalLink,
  RefreshCw,
  ChevronRight,
  Wifi,
  WifiOff,
  Star,
  Users,
} from "lucide-react";
import { Footer } from "@/components/Footer";
import { PublicHeader } from "@/components/PublicHeader";
import { AppSidebar } from "@/components/AppSidebar";
import { MobileMenu } from "@/components/MobileMenu";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "@/lib/i18n";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

type L5 = { uk: string; ru: string; en: string; es?: string; de?: string };
function tr(lang: string, m: L5): string {
  return ((m as any)[lang] as string) ?? m.en;
}

// Plan feature labels (kept English at call sites, translated here so call sites stay terse).
const FEATURE_TR: Record<string, L5> = {
  "2 devices": { uk: "2 пристрої", ru: "2 устройства", en: "2 devices", es: "2 dispositivos", de: "2 Geräte" },
  "5 devices": { uk: "5 пристроїв", ru: "5 устройств", en: "5 devices", es: "5 dispositivos", de: "5 Geräte" },
  "Multiple locations": { uk: "Кілька локацій", ru: "Несколько локаций", en: "Multiple locations", es: "Varias ubicaciones", de: "Mehrere Standorte" },
  "All locations": { uk: "Усі локації", ru: "Все локации", en: "All locations", es: "Todas las ubicaciones", de: "Alle Standorte" },
  "Standard speed": { uk: "Стандартна швидкість", ru: "Стандартная скорость", en: "Standard speed", es: "Velocidad estándar", de: "Standard-Geschwindigkeit" },
  "Maximum speed": { uk: "Максимальна швидкість", ru: "Максимальная скорость", en: "Maximum speed", es: "Velocidad máxima", de: "Maximale Geschwindigkeit" },
  "Max speed": { uk: "Макс. швидкість", ru: "Макс. скорость", en: "Max speed", es: "Velocidad máx.", de: "Max. Geschwindigkeit" },
  "Auto-activation": { uk: "Автоактивація", ru: "Автоактивация", en: "Auto-activation", es: "Activación automática", de: "Auto-Aktivierung" },
  "Web + Telegram": { uk: "Веб + Telegram", ru: "Веб + Telegram", en: "Web + Telegram", es: "Web + Telegram", de: "Web + Telegram" },
  "Priority servers": { uk: "Пріоритетні сервери", ru: "Приоритетные серверы", en: "Priority servers", es: "Servidores prioritarios", de: "Prioritäts-Server" },
  "Team management": { uk: "Керування командою", ru: "Управление командой", en: "Team management", es: "Gestión de equipo", de: "Team-Verwaltung" },
  "Priority support": { uk: "Пріоритетна підтримка", ru: "Приоритетная поддержка", en: "Priority support", es: "Soporte prioritario", de: "Prioritäts-Support" },
  "Shared billing": { uk: "Спільна оплата", ru: "Общий биллинг", en: "Shared billing", es: "Facturación compartida", de: "Gemeinsame Abrechnung" },
};

interface AppEntry {
  id: string;
  name: string;
  platforms: ("ios" | "android" | "windows" | "macos" | "linux")[];
  deepLink: string;
  storeUrl: string;
  recommended?: boolean;
}

interface VpnStatus {
  hasSubscription: boolean;
  isActive?: boolean;
  subscriptionUrl?: string;
  qrUrl?: string;
  apps?: AppEntry[];
  expiresAt?: string;
  uuid?: string;
  tier: string;
  deviceLimit: number;
  configured: boolean;
}

type Platform = "ios" | "android" | "windows" | "macos" | "linux" | "other";

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  if (/macintosh|mac os x/.test(ua)) return "macos";
  if (/windows/.test(ua)) return "windows";
  if (/linux/.test(ua)) return "linux";
  return "other";
}

const PLATFORM_LABELS: Record<Platform, string> = {
  ios: "iPhone / iPad",
  android: "Android",
  windows: "Windows",
  macos: "macOS",
  linux: "Linux",
  other: "All platforms",
};

function platformLabel(lang: string, p: Platform): string {
  if (p === "other") return tr(lang, { uk: "Усі платформи", ru: "Все платформы", en: "All platforms", es: "Todas las plataformas", de: "Alle Plattformen" });
  return PLATFORM_LABELS[p];
}

const PLATFORM_ICONS: Record<Platform, typeof Smartphone> = {
  ios: Apple,
  android: Smartphone,
  windows: Monitor,
  macos: Apple,
  linux: Monitor,
  other: Globe2,
};

function CopyButton({ text, label }: { text: string; label?: string }) {
  const { lang } = useTranslation();
  const [copied, setCopied] = useState(false);
  const resolvedLabel = label ?? tr(lang, { uk: "Копіювати", ru: "Копировать", en: "Copy", es: "Copiar", de: "Kopieren" });
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.04] px-3 py-1.5 text-[12.5px] font-medium text-zinc-300 transition hover:border-cyan-500/40 hover:bg-cyan-500/[0.08] hover:text-cyan-300"
    >
      {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? tr(lang, { uk: "Скопійовано!", ru: "Скопировано!", en: "Copied!", es: "¡Copiado!", de: "Kopiert!" }) : resolvedLabel}
    </button>
  );
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  const { lang } = useTranslation();
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold ${
        isActive
          ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
          : "border border-rose-500/30 bg-rose-500/10 text-rose-400"
      }`}
    >
      {isActive ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
      {isActive
        ? tr(lang, { uk: "Активний", ru: "Активен", en: "Active", es: "Activo", de: "Aktiv" })
        : tr(lang, { uk: "Неактивний", ru: "Неактивен", en: "Inactive", es: "Inactivo", de: "Inaktiv" })}
    </span>
  );
}

function ActiveDashboard({ vpn, onRefresh, isRefreshing }: { vpn: VpnStatus; onRefresh: () => void; isRefreshing: boolean }) {
  const expiresAt = vpn.expiresAt ? new Date(vpn.expiresAt) : null;
  const daysLeft = expiresAt ? Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / 86400000)) : null;
  const { data: devData } = useQuery<{ activeCount: number; deviceLimit: number }>({
    queryKey: ["/api/alor-vpn/devices"],
    refetchInterval: 30000,
  });
  const { lang } = useTranslation();
  const activeCount = devData?.activeCount ?? 0;
  const daysAccent = daysLeft === null ? "" : daysLeft <= 3 ? "text-amber-400" : daysLeft <= 7 ? "text-yellow-400" : "";
  const slotsAccent = activeCount >= vpn.deviceLimit ? "text-amber-400" : "";

  return (
    <div className="space-y-4">
      {/* Status bar */}
      <div className="rounded-2xl border border-white/10 bg-[#0D0D11] p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/[0.08]">
              <Shield className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <div className="text-[15px] font-semibold text-white">DarkShare VPN</div>
              <div className="text-[12px] text-zinc-500">
                <span className="rounded bg-cyan-500/10 px-1.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-cyan-400">{vpn.tier}</span>
                <span className="ml-2">{tr(lang, { uk: "Trojan Reality · 20+ країн · без логів", ru: "Trojan Reality · 20+ стран · без логов", en: "Trojan Reality · 20+ countries · zero logs", es: "Trojan Reality · 20+ países · sin registros", de: "Trojan Reality · 20+ Länder · keine Logs" })}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge isActive={vpn.isActive ?? false} />
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-zinc-400 transition hover:border-white/20 hover:text-white disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard icon={Users} label={tr(lang, { uk: "Пристрої", ru: "Устройства", en: "Devices used", es: "Dispositivos", de: "Geräte" })} value={<span className={slotsAccent}>{activeCount} / {vpn.deviceLimit}</span>} />
          <StatCard icon={Clock} label={tr(lang, { uk: "Залишилось днів", ru: "Осталось дней", en: "Days left", es: "Días restantes", de: "Tage übrig" })} value={<span className={daysAccent}>{daysLeft !== null ? `${daysLeft}${tr(lang, { uk: "д", ru: "д", en: "d", es: "d", de: "T" })}` : "—"}</span>} />
          <StatCard icon={Globe2} label={tr(lang, { uk: "Локації", ru: "Локации", en: "Locations", es: "Ubicaciones", de: "Standorte" })} value="20+" />
          <StatCard icon={Lock} label={tr(lang, { uk: "Логи", ru: "Логи", en: "Logs", es: "Registros", de: "Logs" })} value={tr(lang, { uk: "нуль", ru: "ноль", en: "zero", es: "cero", de: "keine" })} />
        </div>
      </div>

      {/* Subscription URL */}
      {vpn.subscriptionUrl && (
        <div className="rounded-2xl border border-white/10 bg-[#0D0D11] p-5 sm:p-6">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[14px] font-semibold text-white">{tr(lang, { uk: "Посилання на підписку", ru: "Ссылка на подписку", en: "Subscription Link", es: "Enlace de suscripción", de: "Abonnement-Link" })}</h3>
            <CopyButton text={vpn.subscriptionUrl} label={tr(lang, { uk: "Копіювати лінк", ru: "Копировать ссылку", en: "Copy link", es: "Copiar enlace", de: "Link kopieren" })} />
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-black/40 px-4 py-3 font-mono text-[11.5px] text-zinc-500 break-all">
            {vpn.subscriptionUrl}
          </div>
          <p className="mt-3 text-[12px] text-zinc-500">
            {tr(lang, { uk: "Встав це посилання у свій VPN-застосунок. Працює з Happ, v2rayNG, Nekobox, Clash, Shadowrocket та іншими.", ru: "Вставь эту ссылку в свой VPN-приложение. Работает с Happ, v2rayNG, Nekobox, Clash, Shadowrocket и другими.", en: "Paste this link into your VPN app. Works with Happ, v2rayNG, Nekobox, Clash, Shadowrocket, and more.", es: "Pega este enlace en tu app VPN. Funciona con Happ, v2rayNG, Nekobox, Clash, Shadowrocket y más.", de: "Füge diesen Link in deine VPN-App ein. Funktioniert mit Happ, v2rayNG, Nekobox, Clash, Shadowrocket u. a." })}
          </p>
        </div>
      )}

      {/* QR + One-tap install */}
      <ConnectPanel vpn={vpn} />

      {/* Devices */}
      <DevicesPanel deviceLimit={vpn.deviceLimit} />
    </div>
  );
}

interface DeviceEntry {
  id: number;
  name: string;
  userAgent?: string;
  ipPrefix?: string;
  firstSeen?: string;
  lastSeen?: string;
  revoked: boolean;
}

function DevicesPanel({ deviceLimit }: { deviceLimit: number }) {
  const { lang } = useTranslation();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<{ devices: DeviceEntry[]; activeCount: number; deviceLimit: number; tier?: string; daysLeft?: number | null; expiresAt?: string | null }>({
    queryKey: ["/api/alor-vpn/devices"],
    refetchInterval: 30000,
  });
  const revoke = useMutation({
    mutationFn: async (id: number) => apiRequest("POST", `/api/alor-vpn/devices/${id}/revoke`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/alor-vpn/devices"] }),
  });

  const devices = data?.devices ?? [];
  const active = devices.filter((d) => !d.revoked);
  const slotsUsed = data?.activeCount ?? active.length;

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0D0D11] p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-[14px] font-semibold text-white">{tr(lang, { uk: "Підключені пристрої", ru: "Подключённые устройства", en: "Connected devices", es: "Dispositivos conectados", de: "Verbundene Geräte" })}</h3>
          <p className="mt-0.5 text-[12px] text-zinc-500">
            <span className={slotsUsed >= deviceLimit ? "text-amber-400" : "text-zinc-400"}>
              {slotsUsed} / {deviceLimit}
            </span>{" "}
            {tr(lang, { uk: "слотів зайнято", ru: "слотов занято", en: "slots used", es: "espacios usados", de: "Plätze belegt" })} · {data?.tier ? `DarkShare ${data.tier}` : "—"}
            {typeof data?.daysLeft === "number" && data.daysLeft > 0 ? (
              <span className={data.daysLeft <= 3 ? "ml-2 text-amber-400" : "ml-2 text-emerald-400"}>
                · {data.daysLeft} {tr(lang, { uk: "дн. залишилось", ru: "дн. осталось", en: "days left", es: "días restantes", de: "Tage übrig" })}
              </span>
            ) : data?.expiresAt ? (
              <span className="ml-2 text-rose-400">· {tr(lang, { uk: "Завершено", ru: "Истёк", en: "Expired", es: "Expirado", de: "Abgelaufen" })}</span>
            ) : null}
          </p>
        </div>
        <div className="text-[11px] text-zinc-600">
          {tr(lang, { uk: "Пристрій = один застосунок в одній мережі. Переімпортуй, щоб звільнити слот.", ru: "Устройство = одно приложение в одной сети. Переимпортируй, чтобы освободить слот.", en: "A device = one app on one network. Re-import to claim a free slot.", es: "Un dispositivo = una app en una red. Reimporta para liberar un espacio.", de: "Ein Gerät = eine App in einem Netzwerk. Neu importieren, um einen Platz freizugeben." })}
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-white/[0.06] bg-black/20 p-6 text-center text-[12.5px] text-zinc-500">{tr(lang, { uk: "Завантаження…", ru: "Загрузка…", en: "Loading…", es: "Cargando…", de: "Laden…" })}</div>
      ) : devices.length === 0 ? (
        <div className="rounded-xl border border-white/[0.06] bg-black/20 p-6 text-center text-[12.5px] text-zinc-500">
          {tr(lang, { uk: "Ще немає пристроїв. Імпортуй підписку у свій VPN-застосунок — вони з'являться тут автоматично.", ru: "Пока нет устройств. Импортируй подписку в свой VPN-приложение — они появятся здесь автоматически.", en: "No devices yet. Import the subscription in your VPN app — it appears here automatically.", es: "Aún no hay dispositivos. Importa la suscripción en tu app VPN — aparecerán aquí automáticamente.", de: "Noch keine Geräte. Importiere das Abonnement in deine VPN-App — sie erscheinen hier automatisch." })}
        </div>
      ) : (
        <ul className="divide-y divide-white/[0.06] overflow-hidden rounded-xl border border-white/[0.06] bg-black/20">
          {devices.map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`inline-block h-2 w-2 rounded-full ${d.revoked ? "bg-zinc-600" : "bg-emerald-400"}`} />
                  <span className="truncate text-[13.5px] font-medium text-white">{d.name}</span>
                  {d.revoked && <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-zinc-500">{tr(lang, { uk: "Відкликано", ru: "Отозвано", en: "Revoked", es: "Revocado", de: "Widerrufen" })}</span>}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-[11.5px] text-zinc-500">
                  {d.ipPrefix && <span className="font-mono">{d.ipPrefix}.x</span>}
                  {d.lastSeen && <span>{tr(lang, { uk: "Востаннє", ru: "Последний раз", en: "Last seen", es: "Visto", de: "Zuletzt" })} {new Date(d.lastSeen).toLocaleString()}</span>}
                </div>
              </div>
              {!d.revoked && (
                <button
                  onClick={() => revoke.mutate(d.id)}
                  disabled={revoke.isPending}
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/[0.06] px-3 py-1.5 text-[12px] font-medium text-rose-300 transition hover:border-rose-400 hover:bg-rose-500/[0.12] disabled:opacity-50"
                >
                  {tr(lang, { uk: "Відкликати", ru: "Отозвать", en: "Revoke", es: "Revocar", de: "Widerrufen" })}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ConnectPanel({ vpn }: { vpn: VpnStatus }) {
  const { lang } = useTranslation();
  const [platform, setPlatform] = useState<Platform>("other");
  useEffect(() => { setPlatform(detectPlatform()); }, []);

  const allPlatforms: Platform[] = ["ios", "android", "windows", "macos", "linux"];
  // When platform detection fails, default to a sensible tab without misleading the user.
  // Most desktop unknowns are Windows; mobile UA always matches above. Show all-platform Happ first.
  const visiblePlatform: Platform = platform === "other" ? "windows" : platform;

  const apps = vpn.apps ?? [];
  const filteredApps = apps.filter((a) => a.platforms.includes(visiblePlatform as any));
  const sortedApps = [...filteredApps].sort((a, b) => Number(!!b.recommended) - Number(!!a.recommended));

  return (
    <div className="space-y-4">
      {/* QR card */}
      {vpn.qrUrl && (
        <div className="rounded-2xl border border-white/10 bg-[#0D0D11] p-5 sm:p-6">
          <h3 className="mb-4 text-[14px] font-semibold text-white">{tr(lang, { uk: "Скануй QR своїм VPN-застосунком", ru: "Сканируй QR своим VPN-приложением", en: "Scan QR with your VPN app", es: "Escanea el QR con tu app VPN", de: "Scanne den QR mit deiner VPN-App" })}</h3>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <div className="rounded-2xl border border-white/10 bg-white p-3">
              <img src={vpn.qrUrl} alt={tr(lang, { uk: "QR підписки", ru: "QR подписки", en: "Subscription QR", es: "QR de suscripción", de: "Abonnement-QR" })} className="h-44 w-44 sm:h-52 sm:w-52" />
            </div>
            <div className="flex-1 space-y-2 text-[13px] text-zinc-400">
              <p className="text-white font-medium">{tr(lang, { uk: "Найшвидший спосіб підключитися:", ru: "Самый быстрый способ подключиться:", en: "Fastest way to connect:", es: "La forma más rápida de conectar:", de: "Schnellster Weg zu verbinden:" })}</p>
              <ol className="space-y-1.5">
                <Step n={1}>{tr(lang, { uk: "Встанови VPN-застосунок для своєї платформи (кнопки нижче).", ru: "Установи VPN-приложение для своей платформы (кнопки ниже).", en: "Install a VPN app for your platform (buttons below).", es: "Instala una app VPN para tu plataforma (botones abajo).", de: "Installiere eine VPN-App für deine Plattform (Buttons unten)." })}</Step>
                <Step n={2}>{tr(lang, { uk: "Відкрий застосунок і натисни «Додати підписку» / скануй QR.", ru: "Открой приложение и нажми «Добавить подписку» / сканируй QR.", en: "Open the app and tap «Add subscription» / scan QR.", es: "Abre la app y toca «Añadir suscripción» / escanea el QR.", de: "Öffne die App und tippe auf «Abo hinzufügen» / scanne den QR." })}</Step>
                <Step n={3}>{tr(lang, { uk: "Обери будь-який сервер і натисни «Підключити».", ru: "Выбери любой сервер и нажми «Подключить».", en: "Choose any server and tap Connect.", es: "Elige cualquier servidor y toca Conectar.", de: "Wähle einen Server und tippe auf Verbinden." })}</Step>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* Platform tabs + one-tap buttons */}
      <div className="rounded-2xl border border-white/10 bg-[#0D0D11] p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-[14px] font-semibold text-white">{tr(lang, { uk: "Підключення в один клік", ru: "Подключение в один клик", en: "One-tap install", es: "Instalación en un toque", de: "Ein-Klick-Installation" })}</h3>
          <span className="text-[11px] text-zinc-500">{tr(lang, { uk: "Виявлено", ru: "Определено", en: "Detected", es: "Detectado", de: "Erkannt" })}: {platformLabel(lang, platform)}</span>
        </div>

        {/* Platform tabs */}
        <div className="mb-4 flex flex-wrap gap-1.5">
          {allPlatforms.map((p) => {
            const Icon = PLATFORM_ICONS[p];
            const active = visiblePlatform === p;
            return (
              <button
                key={p}
                onClick={() => setPlatform(p)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-medium transition ${
                  active
                    ? "border-cyan-500/40 bg-cyan-500/[0.08] text-cyan-300"
                    : "border-white/10 bg-white/[0.02] text-zinc-400 hover:border-white/20 hover:text-white"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {platformLabel(lang, p)}
              </button>
            );
          })}
        </div>

        {/* App cards with one-tap deep link */}
        <div className="grid gap-2.5 sm:grid-cols-2">
          {sortedApps.map((a) => (
            <div key={a.id} className="flex flex-col gap-2 rounded-xl border border-white/[0.06] bg-black/30 p-3.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[13.5px] font-semibold text-white">{a.name}</span>
                  {a.recommended && (
                    <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-300">
                      <Star className="h-2.5 w-2.5" /> {tr(lang, { uk: "Вибір", ru: "Выбор", en: "Pick", es: "Elección", de: "Wahl" })}
                    </span>
                  )}
                </div>
                <a
                  href={a.storeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11.5px] text-zinc-500 hover:text-white"
                >
                  {tr(lang, { uk: "Завантажити", ru: "Скачать", en: "Get app", es: "Obtener app", de: "App holen" })} <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <a
                href={a.deepLink}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-[12.5px] font-semibold text-black shadow-[0_0_12px_rgba(6,182,212,0.25)] transition hover:bg-cyan-400"
              >
                <Zap className="h-3.5 w-3.5" />
                {tr(lang, { uk: "Відкрити в", ru: "Открыть в", en: "Open in", es: "Abrir en", de: "Öffnen in" })} {a.name}
              </a>
            </div>
          ))}
          {sortedApps.length === 0 && (
            <div className="col-span-2 rounded-xl border border-white/[0.06] bg-black/20 p-4 text-center text-[12.5px] text-zinc-500">
              {tr(lang, { uk: "Для цієї платформи ще немає застосунків — скористайся посиланням на підписку вище з будь-яким V2Ray-сумісним клієнтом.", ru: "Для этой платформы пока нет приложений — используй ссылку на подписку выше с любым V2Ray-совместимым клиентом.", en: "No apps for this platform yet — use the Subscription Link above with any V2Ray-compatible client.", es: "Aún no hay apps para esta plataforma — usa el enlace de suscripción de arriba con cualquier cliente compatible con V2Ray.", de: "Noch keine Apps für diese Plattform — nutze den Abonnement-Link oben mit einem V2Ray-kompatiblen Client." })}
            </div>
          )}
        </div>

        <p className="mt-4 text-[11.5px] text-zinc-600">
          {tr(lang, { uk: "Порада: спершу натисни «Завантажити», якщо клієнт ще не встановлено, потім повернись і натисни «Відкрити в…» — підписка імпортується автоматично.", ru: "Совет: сначала нажми «Скачать», если клиент ещё не установлен, затем вернись и нажми «Открыть в…» — подписка импортируется автоматически.", en: "Tip: tap Get app first if you don't have the client installed, then return and tap Open in … — the subscription imports automatically.", es: "Consejo: toca «Obtener app» primero si no tienes el cliente, luego vuelve y toca «Abrir en…» — la suscripción se importa automáticamente.", de: "Tipp: Tippe zuerst auf «App holen», wenn du den Client nicht hast, dann zurück und auf «Öffnen in…» — das Abo wird automatisch importiert." })}
        </p>
      </div>
    </div>
  );
}

function Step({ n, children }: { n: number; children: ReactNode }) {
  return (
    <li className="flex gap-2.5">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-cyan-500/30 bg-cyan-500/[0.06] text-[10px] font-bold text-cyan-400">
        {n}
      </span>
      <span className="text-[12.5px] text-zinc-400">{children}</span>
    </li>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-black/20 px-4 py-3">
      <div className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-wider text-zinc-600">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className="mt-1 text-[14px] font-semibold text-white">{value}</div>
    </div>
  );
}

function ProvisionPanel({ tier, onProvision, isLoading }: { tier: string; onProvision: () => void; isLoading: boolean }) {
  const { lang } = useTranslation();
  return (
    <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-b from-cyan-950/20 to-[#0D0D11] p-6 sm:p-8 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.08]">
        <Shield className="h-7 w-7 text-cyan-400" />
      </div>
      <h2 className="text-[20px] font-bold text-white">{tr(lang, { uk: "Активувати DarkShare VPN", ru: "Активировать DarkShare VPN", en: "Activate DarkShare VPN", es: "Activar DarkShare VPN", de: "DarkShare VPN aktivieren" })}</h2>
      <p className="mt-2 text-[13.5px] text-zinc-400">
        {tr(lang, { uk: "Твій план", ru: "Твой план", en: "Your", es: "Tu plan", de: "Dein" })} <span className="font-semibold text-white">{tier}</span> {tr(lang, { uk: "включає доступ до VPN. Натисни нижче, щоб активувати підписку.", ru: "включает доступ к VPN. Нажми ниже, чтобы активировать подписку.", en: "plan includes VPN access. Click below to activate your subscription.", es: "incluye acceso VPN. Pulsa abajo para activar tu suscripción.", de: "Plan beinhaltet VPN-Zugang. Klicke unten, um dein Abo zu aktivieren." })}
      </p>
      <button
        onClick={onProvision}
        disabled={isLoading}
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-6 py-3 text-[14px] font-semibold text-black shadow-[0_0_20px_rgba(6,182,212,0.3)] transition hover:bg-cyan-400 disabled:opacity-60"
      >
        {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
        {isLoading ? tr(lang, { uk: "Активація…", ru: "Активация…", en: "Activating…", es: "Activando…", de: "Aktivierung…" }) : tr(lang, { uk: "Активувати VPN", ru: "Активировать VPN", en: "Activate VPN", es: "Activar VPN", de: "VPN aktivieren" })}
      </button>
    </div>
  );
}

function UpgradePanel() {
  const { lang } = useTranslation();
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
          <Lock className="h-7 w-7 text-zinc-400" />
        </div>
        <h2 className="text-[22px] font-bold text-white">DarkShare VPN</h2>
        <p className="mt-2 text-[14px] text-zinc-400">{tr(lang, { uk: "Доступно на планах PRO та ENTERPRISE", ru: "Доступно на планах PRO и ENTERPRISE", en: "Available on PRO and ENTERPRISE plans", es: "Disponible en los planes PRO y ENTERPRISE", de: "Verfügbar in den PRO- und ENTERPRISE-Plänen" })}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <PlanCard
          name="PRO VPN"
          tier="PRO"
          price="$9"
          period="/mo"
          devices={2}
          features={["2 devices", "Multiple locations", "Standard speed", "Auto-activation", "Web + Telegram"]}
        />
        <PlanCard
          name="ENTERPRISE VPN"
          tier="ENTERPRISE"
          price="$29"
          period="/mo"
          devices={5}
          features={["5 devices", "All locations", "Maximum speed", "Priority servers", "Auto-activation"]}
          highlight
        />
        <PlanCard
          name="GROUPS VPN"
          tier="GROUPS"
          price="$55"
          period="/mo"
          devices={5}
          features={["5 devices", "All locations", "Team management", "Priority support", "Shared billing"]}
        />
      </div>
    </div>
  );
}

function PlanCard({
  name,
  tier,
  price,
  period,
  devices,
  features,
  highlight,
}: {
  name: string;
  tier: string;
  price: string;
  period: string;
  devices: number;
  features: string[];
  highlight?: boolean;
}) {
  const { lang } = useTranslation();
  return (
    <div
      className={`relative rounded-2xl border p-5 ${
        highlight
          ? "border-cyan-500/30 bg-gradient-to-b from-cyan-950/20 to-[#0D0D11]"
          : "border-white/10 bg-[#0D0D11]"
      }`}
    >
      {highlight && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[10.5px] font-semibold uppercase tracking-wider text-cyan-400">
            <Star className="h-3 w-3" /> {tr(lang, { uk: "Рекомендовано", ru: "Рекомендуем", en: "Recommended", es: "Recomendado", de: "Empfohlen" })}
          </span>
        </div>
      )}
      <div className="mb-3">
        <div className="text-[13px] font-medium text-zinc-400">{name}</div>
        <div className="flex items-baseline gap-1">
          <span className="text-[32px] font-bold text-white">{price}</span>
          <span className="text-[13px] text-zinc-500">{period === "/mo" ? tr(lang, { uk: "/міс", ru: "/мес", en: "/mo", es: "/mes", de: "/Mon" }) : period}</span>
        </div>
      </div>
      <div className="mb-4 flex items-center gap-1.5">
        <Users className="h-3.5 w-3.5 text-zinc-500" />
        <span className="text-[12.5px] text-zinc-400">{tr(lang, { uk: `До ${devices} пристроїв`, ru: `До ${devices} устройств`, en: `Up to ${devices} devices`, es: `Hasta ${devices} dispositivos`, de: `Bis zu ${devices} Geräte` })}</span>
      </div>
      <ul className="mb-5 space-y-1.5">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-[12.5px] text-zinc-400">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
            {FEATURE_TR[f] ? tr(lang, FEATURE_TR[f]) : f}
          </li>
        ))}
      </ul>
      <Link href={`/pricing?plan=${tier}`}>
        <span
          className={`block w-full rounded-xl py-2.5 text-center text-[13px] font-semibold transition cursor-pointer ${
            highlight
              ? "bg-cyan-500 text-black shadow-[0_0_16px_rgba(6,182,212,0.25)] hover:bg-cyan-400"
              : "border border-white/15 bg-white/[0.03] text-white hover:bg-white/[0.07]"
          }`}
        >
          {tr(lang, { uk: "Обрати", ru: "Выбрать", en: "Get", es: "Obtener", de: "Holen" })} {tier} <ChevronRight className="inline h-3.5 w-3.5" />
        </span>
      </Link>
    </div>
  );
}

function VpnContent() {
  const { lang } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { data: vpn, isLoading } = useQuery<VpnStatus>({
    queryKey: ["/api/alor-vpn/status"],
    enabled: !!user,
    refetchInterval: 60000,
  });

  const provisionMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/alor-vpn/provision"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alor-vpn/status"] });
      setError(null);
    },
    onError: (err: any) => {
      setError(err?.message || tr(lang, { uk: "Не вдалося активувати VPN. Спробуй ще раз.", ru: "Не удалось активировать VPN. Попробуй ещё раз.", en: "Failed to activate VPN. Please try again.", es: "No se pudo activar la VPN. Inténtalo de nuevo.", de: "VPN konnte nicht aktiviert werden. Bitte versuche es erneut." }));
    },
  });

  const refreshMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/alor-vpn/refresh"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alor-vpn/status"] });
    },
  });

  if (!user) return null;

  const tier = (user as any).tier?.toUpperCase() || "FREE";
  const isPro = ["PRO", "ENTERPRISE", "GROUPS"].includes(tier);

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-zinc-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-7">
        <div className="flex items-center gap-2 text-[12px] text-zinc-500">
          <Shield className="h-3.5 w-3.5" />
          {tr(lang, { uk: "Захищена мережа DarkShare", ru: "Защищённая сеть DarkShare", en: "DarkShare Secure Network", es: "Red segura DarkShare", de: "DarkShare Sicheres Netzwerk" })}
        </div>
        <h1 className="mt-1 text-[28px] font-bold tracking-tight text-white sm:text-[34px]">
          DarkShare VPN
        </h1>
        <p className="mt-1.5 text-[14px] text-zinc-400">
          {tr(lang, { uk: "Зашифрований тунель на базі Trojan Reality · Без логів · Багато локацій", ru: "Зашифрованный туннель на базе Trojan Reality · Без логов · Множество локаций", en: "Encrypted tunnel powered by Trojan Reality · Zero logs · Multiple locations", es: "Túnel cifrado con Trojan Reality · Sin registros · Múltiples ubicaciones", de: "Verschlüsselter Tunnel mit Trojan Reality · Keine Logs · Mehrere Standorte" })}
        </p>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/[0.06] px-4 py-3 text-[13px] text-rose-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {!isPro ? (
        <UpgradePanel />
      ) : vpn?.hasSubscription ? (
        <ActiveDashboard
          vpn={vpn}
          onRefresh={() => refreshMutation.mutate()}
          isRefreshing={refreshMutation.isPending}
        />
      ) : (
        <ProvisionPanel
          tier={tier}
          onProvision={() => provisionMutation.mutate()}
          isLoading={provisionMutation.isPending}
        />
      )}
    </div>
  );
}

function PublicVpnLanding() {
  const { lang } = useTranslation();
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <PublicHeader />
      <section className="px-4 pt-20 pb-12 sm:px-6 sm:pt-28">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/[0.05] px-3 py-1 text-[12px] text-cyan-400">
            <Shield className="h-3 w-3" /> {tr(lang, { uk: "Захищена мережа DarkShare", ru: "Защищённая сеть DarkShare", en: "DarkShare Secure Network", es: "Red segura DarkShare", de: "DarkShare Sicheres Netzwerk" })}
          </div>
          <h1 className="mt-5 text-[40px] font-bold leading-[1.05] tracking-tight text-white sm:text-[56px]">
            DarkShare
            <br />
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">VPN</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-zinc-400">
            {tr(lang, { uk: "Шифрування військового рівня, вбудоване у твій план DarkShare. Без логів, багато глобальних локацій, працює на всіх твоїх пристроях.", ru: "Шифрование военного уровня, встроенное в твой план DarkShare. Без логов, множество глобальных локаций, работает на всех твоих устройствах.", en: "Military-grade encryption built into your DarkShare plan. Zero logs, multiple global locations, works on all your devices.", es: "Cifrado de grado militar integrado en tu plan DarkShare. Sin registros, múltiples ubicaciones globales, funciona en todos tus dispositivos.", de: "Verschlüsselung in Militärqualität, integriert in deinen DarkShare-Plan. Keine Logs, mehrere globale Standorte, funktioniert auf all deinen Geräten." })}
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link href="/pricing">
              <span className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl bg-cyan-500 px-5 text-[14px] font-semibold text-black shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:bg-cyan-400">
                <Zap className="h-4 w-4" /> {tr(lang, { uk: "Отримати PRO з VPN", ru: "Получить PRO с VPN", en: "Get PRO with VPN", es: "Obtener PRO con VPN", de: "PRO mit VPN holen" })}
              </span>
            </Link>
            <Link href="/login">
              <span className="inline-flex h-11 cursor-pointer items-center rounded-xl border border-white/15 px-5 text-[14px] font-medium text-white hover:bg-white/[0.04]">
                {tr(lang, { uk: "Увійти", ru: "Войти", en: "Sign in", es: "Iniciar sesión", de: "Anmelden" })}
              </span>
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 pb-12 sm:px-6">
        <div className="mx-auto grid max-w-4xl gap-3 sm:grid-cols-3">
          {[
            { icon: Lock, title: tr(lang, { uk: "Без логів", ru: "Без логов", en: "Zero logs", es: "Sin registros", de: "Keine Logs" }), text: tr(lang, { uk: "Ми ніколи не зберігаємо твою активність у мережі чи логи підключень.", ru: "Мы никогда не храним твою активность в сети или логи подключений.", en: "We never store your browsing activity or connection logs.", es: "Nunca almacenamos tu actividad de navegación ni los registros de conexión.", de: "Wir speichern niemals deine Surfaktivität oder Verbindungsprotokolle." }) },
            { icon: Globe2, title: tr(lang, { uk: "Багато локацій", ru: "Множество локаций", en: "Multiple locations", es: "Múltiples ubicaciones", de: "Mehrere Standorte" }), text: tr(lang, { uk: "Підключайся з різних країн для приватності та доступу.", ru: "Подключайся из разных стран для приватности и доступа.", en: "Connect from various countries for privacy and access.", es: "Conéctate desde varios países para privacidad y acceso.", de: "Verbinde dich aus verschiedenen Ländern für Privatsphäre und Zugang." }) },
            { icon: Zap, title: "Trojan Reality", text: tr(lang, { uk: "Сучасний протокол, що обходить DPI та цензуру.", ru: "Современный протокол, обходящий DPI и цензуру.", en: "Advanced protocol that bypasses DPI and censorship.", es: "Protocolo avanzado que evita el DPI y la censura.", de: "Fortschrittliches Protokoll, das DPI und Zensur umgeht." }) },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-white/10 bg-[#0D0D11] p-5">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/[0.06]">
                <Icon className="h-4.5 w-4.5 text-cyan-400" />
              </div>
              <div className="text-[14px] font-semibold text-white">{title}</div>
              <div className="mt-1 text-[12.5px] text-zinc-500">{text}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 pb-16 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-6 text-center text-[22px] font-bold text-white">{tr(lang, { uk: "Плани з VPN", ru: "Планы с VPN", en: "Plans with VPN", es: "Planes con VPN", de: "Pläne mit VPN" })}</h2>
          <div className="grid gap-4 sm:grid-cols-2 max-w-2xl mx-auto">
            <PlanCard
              name="PRO VPN"
              tier="PRO"
              price="$9"
              period="/mo"
              devices={2}
              features={["2 devices", "Multiple locations", "Standard speed", "Auto-activation"]}
            />
            <PlanCard
              name="ENTERPRISE VPN"
              tier="ENTERPRISE"
              price="$29"
              period="/mo"
              devices={5}
              features={["5 devices", "All locations", "Max speed", "Priority servers"]}
              highlight
            />
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}

function applyVpnSeo() {
  const title = "DarkShare VPN — Secure, Zero-Log, Trojan Reality Network";
  const desc = "Military-grade VPN built into your DarkShare plan. Trojan Reality protocol bypasses DPI and censorship. Zero logs, 20+ server locations, works on iOS, Android, Windows, macOS, Linux. Activate in 30 seconds.";
  const canonical = "https://www.darkshare.store/vpn";
  const image = "https://www.darkshare.store/og-image.png";

  document.title = title;

  const setMeta = (selector: string, attr: "name" | "property", key: string, value: string) => {
    let el = document.head.querySelector<HTMLMetaElement>(selector);
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute(attr, key);
      document.head.appendChild(el);
    }
    el.setAttribute("content", value);
  };
  setMeta('meta[name="description"]', "name", "description", desc);
  setMeta('meta[name="keywords"]', "name", "keywords", "DarkShare VPN, Trojan Reality VPN, zero-log VPN, DPI bypass, censorship bypass, OSINT VPN, secure VPN subscription, V2Ray, Happ, Shadowrocket, v2rayNG, v2rayN, Nekobox, Clash Verge");
  setMeta('meta[property="og:title"]', "property", "og:title", title);
  setMeta('meta[property="og:description"]', "property", "og:description", desc);
  setMeta('meta[property="og:url"]', "property", "og:url", canonical);
  setMeta('meta[property="og:image"]', "property", "og:image", image);
  setMeta('meta[property="og:type"]', "property", "og:type", "website");
  setMeta('meta[name="twitter:card"]', "name", "twitter:card", "summary_large_image");
  setMeta('meta[name="twitter:title"]', "name", "twitter:title", title);
  setMeta('meta[name="twitter:description"]', "name", "twitter:description", desc);
  setMeta('meta[name="twitter:image"]', "name", "twitter:image", image);

  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", canonical);

  // JSON-LD: Product + FAQ for rich SERP
  const ldId = "darkshare-vpn-jsonld";
  document.getElementById(ldId)?.remove();
  const ld = document.createElement("script");
  ld.id = ldId;
  ld.type = "application/ld+json";
  ld.text = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        name: "DarkShare VPN",
        description: desc,
        brand: { "@type": "Brand", name: "DarkShare" },
        url: canonical,
        image,
        offers: [
          { "@type": "Offer", name: "PRO", price: "9", priceCurrency: "USD", url: "https://www.darkshare.store/pricing?plan=PRO" },
          { "@type": "Offer", name: "ENTERPRISE", price: "29", priceCurrency: "USD", url: "https://www.darkshare.store/pricing?plan=ENTERPRISE" },
          { "@type": "Offer", name: "GROUPS", price: "55", priceCurrency: "USD", url: "https://www.darkshare.store/pricing?plan=GROUPS" },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          { "@type": "Question", name: "What protocol does DarkShare VPN use?", acceptedAnswer: { "@type": "Answer", text: "Trojan Reality — a modern protocol that disguises VPN traffic as regular HTTPS, bypassing DPI and censorship in restrictive networks." } },
          { "@type": "Question", name: "Does DarkShare VPN keep logs?", acceptedAnswer: { "@type": "Answer", text: "No. We do not log browsing activity or connection metadata. Your traffic stays private." } },
          { "@type": "Question", name: "Which apps work with DarkShare VPN?", acceptedAnswer: { "@type": "Answer", text: "Officially tested clients: Happ (recommended), Shadowrocket (iOS), v2rayNG (Android), NekoBox (Android/Win), Clash Verge (desktop), v2rayN (Windows)." } },
          { "@type": "Question", name: "How many devices can I connect?", acceptedAnswer: { "@type": "Answer", text: "PRO supports 2 devices; ENTERPRISE and GROUPS support 5 devices each." } },
          { "@type": "Question", name: "How many countries are available?", acceptedAnswer: { "@type": "Answer", text: "PRO unlocks 7 countries (Germany, Netherlands, Finland, France, Poland, Ukraine, USA). ENTERPRISE and GROUPS unlock 20+ global locations." } },
        ],
      },
    ],
  });
  document.head.appendChild(ld);
}

export default function VpnPage() {
  const { isAuthenticated, isLoading, user, logout } = useAuth();

  useEffect(() => {
    applyVpnSeo();
    const prev = document.body.style.backgroundColor;
    document.body.style.backgroundColor = "#0A0A0A";
    return () => { document.body.style.backgroundColor = prev; };
  }, []);

  if (isLoading) return <div className="min-h-screen bg-[#0A0A0A]" />;

  if (!isAuthenticated) return <PublicVpnLanding />;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white antialiased flex overflow-hidden max-w-full">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-white/[0.08] bg-[#0A0A0A]/92 backdrop-blur-xl sticky top-0 z-40 min-h-[52px]">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_10px_rgba(6,182,212,0.30)]">
              <Shield className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-sm tracking-tight">DarkShare VPN</span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher variant="minimal" />
            <MobileMenu isAuthenticated={true} username={(user as any)?.username} tier={(user as any)?.tier} onLogout={logout} />
          </div>
        </div>
        <main className="flex-1 overflow-y-auto pb-28 lg:pb-0">
          <VpnContent />
          <Footer />
        </main>
      </div>
    </div>
  );
}
