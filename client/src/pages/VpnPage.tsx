import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Shield, Globe2, Zap, Download, Copy, QrCode, Trash2, Lock, AlertCircle, CheckCircle2, Server, Users } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { PageLayout } from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Lang = "en" | "uk" | "ru" | "es" | "de";
const SUPPORTED: Lang[] = ["en", "uk", "ru", "es", "de"];

const labels: Record<Lang, Record<string, string>> = {
  en: {
    pageTitle: "DARKSHARE VPN",
    subtitle: "Premium WireGuard infrastructure — owned, audited, no logs",
    proRequired: "Active VPN requires PRO+ subscription",
    proRequiredDesc: "Get 3 simultaneous connections, all regions, no speed limits.",
    upgradeBtn: "Upgrade to PRO",
    serversTitle: "Available servers",
    serversEmpty: "No servers available right now. Admins are provisioning new locations.",
    capacity: "Load",
    premiumOnly: "Enterprise only",
    connect: "Generate config",
    connecting: "Generating…",
    activeTitle: "Your active connections",
    activeEmpty: "No active connections. Pick a server above to get started.",
    download: "Download .conf",
    showQr: "Show QR",
    copyConfig: "Copy config",
    revoke: "Revoke",
    revokeConfirm: "This will disconnect any device using this config. Continue?",
    revoked: "Connection revoked.",
    copied: "Config copied to clipboard.",
    created: "Config generated. Import into WireGuard.",
    qrTitle: "Scan with WireGuard mobile",
    qrHint: "Open WireGuard on your phone → + → Scan QR code",
    serverFull: "This server is at full capacity.",
    peerLimit: "You've reached your VPN connection limit.",
    error: "Something went wrong. Try again.",
    howItWorks: "How it works",
    step1: "1. Tap a server to generate a personal WireGuard config",
    step2: "2. Download the .conf or scan the QR with WireGuard app",
    step3: "3. Connect — your traffic is encrypted end-to-end through our infrastructure",
    privacyNote: "Zero-log policy. Sessions auto-expire in 30 days. Configs are unique per device.",
  },
  uk: {
    pageTitle: "DARKSHARE VPN",
    subtitle: "Преміум WireGuard інфраструктура — власна, аудитована, без логів",
    proRequired: "Активний VPN потребує підписки PRO+",
    proRequiredDesc: "Отримайте 3 одночасних з'єднання, всі регіони, без обмежень швидкості.",
    upgradeBtn: "Оновити до PRO",
    serversTitle: "Доступні сервери",
    serversEmpty: "Зараз немає доступних серверів. Адміністратори додають нові локації.",
    capacity: "Навантаження",
    premiumOnly: "Тільки Enterprise",
    connect: "Згенерувати конфіг",
    connecting: "Генерую…",
    activeTitle: "Ваші активні з'єднання",
    activeEmpty: "Немає активних з'єднань. Виберіть сервер вище щоб почати.",
    download: "Завантажити .conf",
    showQr: "Показати QR",
    copyConfig: "Копіювати конфіг",
    revoke: "Відкликати",
    revokeConfirm: "Це відключить будь-який пристрій, що використовує цей конфіг. Продовжити?",
    revoked: "З'єднання відкликано.",
    copied: "Конфіг скопійовано.",
    created: "Конфіг згенеровано. Імпортуйте в WireGuard.",
    qrTitle: "Скануйте з мобільного WireGuard",
    qrHint: "Відкрийте WireGuard на телефоні → + → Сканувати QR-код",
    serverFull: "Сервер заповнений.",
    peerLimit: "Ви досягли ліміту VPN-з'єднань.",
    error: "Щось пішло не так. Спробуйте знову.",
    howItWorks: "Як це працює",
    step1: "1. Натисніть на сервер щоб згенерувати персональний WireGuard конфіг",
    step2: "2. Завантажте .conf або скануйте QR в додатку WireGuard",
    step3: "3. Підключайтеся — ваш трафік зашифрований наскрізно через нашу інфраструктуру",
    privacyNote: "Політика нуль-логів. Сесії авто-завершуються через 30 днів. Конфіги унікальні для кожного пристрою.",
  },
  ru: {
    pageTitle: "DARKSHARE VPN",
    subtitle: "Премиум WireGuard инфраструктура — собственная, аудит, без логов",
    proRequired: "Активный VPN требует подписки PRO+",
    proRequiredDesc: "Получите 3 одновременных соединения, все регионы, без ограничений скорости.",
    upgradeBtn: "Обновить до PRO",
    serversTitle: "Доступные серверы",
    serversEmpty: "Сейчас нет доступных серверов. Администраторы добавляют новые локации.",
    capacity: "Нагрузка",
    premiumOnly: "Только Enterprise",
    connect: "Сгенерировать конфиг",
    connecting: "Генерирую…",
    activeTitle: "Ваши активные соединения",
    activeEmpty: "Нет активных соединений. Выберите сервер выше чтобы начать.",
    download: "Скачать .conf",
    showQr: "Показать QR",
    copyConfig: "Копировать конфиг",
    revoke: "Отозвать",
    revokeConfirm: "Это отключит любое устройство, использующее этот конфиг. Продолжить?",
    revoked: "Соединение отозвано.",
    copied: "Конфиг скопирован.",
    created: "Конфиг сгенерирован. Импортируйте в WireGuard.",
    qrTitle: "Сканируйте с мобильного WireGuard",
    qrHint: "Откройте WireGuard на телефоне → + → Сканировать QR",
    serverFull: "Сервер заполнен.",
    peerLimit: "Вы достигли лимита VPN-соединений.",
    error: "Что-то пошло не так. Попробуйте снова.",
    howItWorks: "Как это работает",
    step1: "1. Нажмите на сервер чтобы сгенерировать персональный WireGuard конфиг",
    step2: "2. Скачайте .conf или сканируйте QR в приложении WireGuard",
    step3: "3. Подключайтесь — ваш трафик зашифрован сквозь нашу инфраструктуру",
    privacyNote: "Политика ноль-логов. Сессии авто-истекают через 30 дней. Конфиги уникальны для каждого устройства.",
  },
  es: {
    pageTitle: "DARKSHARE VPN",
    subtitle: "Infraestructura WireGuard premium — propia, auditada, sin registros",
    proRequired: "VPN activo requiere suscripción PRO+",
    proRequiredDesc: "Obtén 3 conexiones simultáneas, todas las regiones, sin límites de velocidad.",
    upgradeBtn: "Actualizar a PRO",
    serversTitle: "Servidores disponibles",
    serversEmpty: "No hay servidores disponibles ahora. Los administradores están añadiendo nuevas ubicaciones.",
    capacity: "Carga",
    premiumOnly: "Solo Enterprise",
    connect: "Generar config",
    connecting: "Generando…",
    activeTitle: "Tus conexiones activas",
    activeEmpty: "Sin conexiones activas. Elige un servidor arriba para empezar.",
    download: "Descargar .conf",
    showQr: "Mostrar QR",
    copyConfig: "Copiar config",
    revoke: "Revocar",
    revokeConfirm: "Esto desconectará cualquier dispositivo usando esta config. ¿Continuar?",
    revoked: "Conexión revocada.",
    copied: "Config copiada.",
    created: "Config generada. Importa en WireGuard.",
    qrTitle: "Escanea con WireGuard móvil",
    qrHint: "Abre WireGuard en tu móvil → + → Escanear código QR",
    serverFull: "Servidor lleno.",
    peerLimit: "Has alcanzado tu límite de conexiones VPN.",
    error: "Algo salió mal. Intenta de nuevo.",
    howItWorks: "Cómo funciona",
    step1: "1. Toca un servidor para generar una config WireGuard personal",
    step2: "2. Descarga el .conf o escanea el QR en la app WireGuard",
    step3: "3. Conéctate — tu tráfico está cifrado de extremo a extremo a través de nuestra infraestructura",
    privacyNote: "Política cero registros. Las sesiones expiran en 30 días. Configs únicas por dispositivo.",
  },
  de: {
    pageTitle: "DARKSHARE VPN",
    subtitle: "Premium-WireGuard-Infrastruktur — eigen, auditiert, ohne Logs",
    proRequired: "Aktives VPN benötigt PRO+ Abonnement",
    proRequiredDesc: "Erhalten Sie 3 gleichzeitige Verbindungen, alle Regionen, keine Geschwindigkeitsbegrenzung.",
    upgradeBtn: "Auf PRO upgraden",
    serversTitle: "Verfügbare Server",
    serversEmpty: "Derzeit keine Server verfügbar. Admins richten neue Standorte ein.",
    capacity: "Auslastung",
    premiumOnly: "Nur Enterprise",
    connect: "Konfig generieren",
    connecting: "Generiere…",
    activeTitle: "Ihre aktiven Verbindungen",
    activeEmpty: "Keine aktiven Verbindungen. Wählen Sie oben einen Server.",
    download: ".conf herunterladen",
    showQr: "QR anzeigen",
    copyConfig: "Konfig kopieren",
    revoke: "Widerrufen",
    revokeConfirm: "Dies trennt jedes Gerät, das diese Konfig nutzt. Fortfahren?",
    revoked: "Verbindung widerrufen.",
    copied: "Konfig kopiert.",
    created: "Konfig generiert. In WireGuard importieren.",
    qrTitle: "Mit WireGuard-Mobile scannen",
    qrHint: "Öffnen Sie WireGuard auf dem Handy → + → QR-Code scannen",
    serverFull: "Server voll.",
    peerLimit: "Sie haben Ihr VPN-Verbindungslimit erreicht.",
    error: "Etwas ist schiefgelaufen. Versuchen Sie es erneut.",
    howItWorks: "So funktioniert es",
    step1: "1. Tippen Sie auf einen Server, um eine persönliche WireGuard-Konfig zu generieren",
    step2: "2. .conf herunterladen oder QR in der WireGuard-App scannen",
    step3: "3. Verbinden — Ihr Verkehr wird Ende-zu-Ende durch unsere Infrastruktur verschlüsselt",
    privacyNote: "Null-Log-Richtlinie. Sitzungen laufen nach 30 Tagen automatisch ab. Konfigs sind pro Gerät einzigartig.",
  },
};

interface VpnServerDto {
  id: number;
  region: string;
  countryCode: string;
  flag: string;
  capacity: number;
  used: number;
  load: number;
  isPremium: boolean | null;
  status: string;
}

interface VpnPeerDto {
  id: number;
  serverId: number;
  serverRegion: string;
  serverFlag: string;
  allowedIp: string;
  status: string;
  trafficUsed: number | null;
  lastHandshakeAt: string | null;
  createdAt: string | null;
  expiresAt: string | null;
}

const PRO_TIERS = new Set(["PRO", "ENTERPRISE", "GROUPS"]);

export default function VpnPage() {
  const { lang } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const safeLang: Lang = SUPPORTED.includes(lang as Lang) ? (lang as Lang) : "en";
  const L = labels[safeLang];

  const [qrPeer, setQrPeer] = useState<VpnPeerDto | null>(null);

  const userTier = String(user?.tier || "FREE").toUpperCase();
  const isPro = PRO_TIERS.has(userTier);

  const { data: servers = [], isLoading: serversLoading } = useQuery<VpnServerDto[]>({
    queryKey: ["/api/vpn/servers"],
  });

  const { data: peers = [], isLoading: peersLoading } = useQuery<VpnPeerDto[]>({
    queryKey: ["/api/vpn/peers/me"],
    enabled: !!user,
  });

  const connectMutation = useMutation({
    mutationFn: async (serverId: number) => {
      const r = await apiRequest("POST", "/api/vpn/peers", { serverId });
      return r.json();
    },
    onSuccess: () => {
      toast({ title: L.created });
      queryClient.invalidateQueries({ queryKey: ["/api/vpn/peers/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vpn/servers"] });
    },
    onError: (err: any) => {
      const msg = err?.message || "";
      if (msg.includes("server_full")) toast({ title: L.serverFull, variant: "destructive" });
      else if (msg.includes("peer_limit")) toast({ title: L.peerLimit, variant: "destructive" });
      else if (msg.includes("pro_required")) toast({ title: L.proRequired, variant: "destructive" });
      else toast({ title: L.error, variant: "destructive" });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async (peerId: number) => {
      const r = await apiRequest("DELETE", `/api/vpn/peers/${peerId}`);
      return r.json();
    },
    onSuccess: () => {
      toast({ title: L.revoked });
      queryClient.invalidateQueries({ queryKey: ["/api/vpn/peers/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vpn/servers"] });
    },
    onError: () => toast({ title: L.error, variant: "destructive" }),
  });

  const downloadConfig = (peerId: number) => {
    window.location.href = `/api/vpn/peers/${peerId}/config`;
  };

  const copyConfig = async (peerId: number) => {
    try {
      const r = await fetch(`/api/vpn/peers/${peerId}/config`, { credentials: "include" });
      if (!r.ok) throw new Error("fetch");
      const text = await r.text();
      await navigator.clipboard.writeText(text);
      toast({ title: L.copied });
    } catch {
      toast({ title: L.error, variant: "destructive" });
    }
  };

  const activePeers = peers.filter((p) => p.status === "active");

  return (
    <PageLayout title={L.pageTitle}>
      <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8" data-testid="vpn-page">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-cyan-500/10 ring-1 ring-cyan-400/30">
            <Shield className="h-8 w-8 text-cyan-400" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-100" data-testid="text-vpn-title">
              {L.pageTitle}
            </h1>
            <p className="text-zinc-400 mt-1" data-testid="text-vpn-subtitle">{L.subtitle}</p>
          </div>
        </div>

        {/* PRO upsell */}
        {!isPro && (
          <Card className="border-cyan-400/30 bg-gradient-to-br from-cyan-500/10 via-zinc-900 to-zinc-900" data-testid="card-pro-upsell">
            <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="p-2 rounded-lg bg-cyan-500/20 ring-1 ring-cyan-400/40 shrink-0">
                <Lock className="h-6 w-6 text-cyan-300" />
              </div>
              <div className="flex-1">
                <div className="text-cyan-100 font-semibold" data-testid="text-pro-required">{L.proRequired}</div>
                <div className="text-zinc-400 text-sm mt-1">{L.proRequiredDesc}</div>
              </div>
              <Link href="/pricing">
                <Button className="bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-semibold" data-testid="button-upgrade-pro">
                  {L.upgradeBtn}
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Active connections */}
        <Card className="border-zinc-800 bg-zinc-950/60" data-testid="card-active-peers">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-zinc-100">
              <Zap className="h-5 w-5 text-cyan-400" />
              {L.activeTitle}
              {activePeers.length > 0 && (
                <Badge variant="secondary" className="ml-2 bg-cyan-500/20 text-cyan-300 border-cyan-400/30" data-testid="badge-active-count">
                  {activePeers.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {peersLoading ? (
              <div className="text-zinc-500 py-4" data-testid="text-peers-loading">…</div>
            ) : activePeers.length === 0 ? (
              <div className="text-zinc-500 py-4" data-testid="text-peers-empty">{L.activeEmpty}</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activePeers.map((peer) => (
                  <div
                    key={peer.id}
                    className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 space-y-3"
                    data-testid={`peer-card-${peer.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl" aria-hidden>{peer.serverFlag}</span>
                        <div>
                          <div className="text-zinc-100 font-medium" data-testid={`text-peer-region-${peer.id}`}>
                            {peer.serverRegion}
                          </div>
                          <div className="text-xs text-zinc-500 font-mono" data-testid={`text-peer-ip-${peer.id}`}>
                            {peer.allowedIp}
                          </div>
                        </div>
                      </div>
                      <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/30">
                        <CheckCircle2 className="h-3 w-3 mr-1" />active
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-cyan-400/30 text-cyan-300 hover:bg-cyan-500/10"
                        onClick={() => downloadConfig(peer.id)}
                        data-testid={`button-download-${peer.id}`}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        {L.download}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-cyan-400/30 text-cyan-300 hover:bg-cyan-500/10"
                        onClick={() => setQrPeer(peer)}
                        data-testid={`button-qr-${peer.id}`}
                      >
                        <QrCode className="h-4 w-4 mr-1" />
                        {L.showQr}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                        onClick={() => copyConfig(peer.id)}
                        data-testid={`button-copy-${peer.id}`}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        {L.copyConfig}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                        onClick={() => {
                          if (confirm(L.revokeConfirm)) revokeMutation.mutate(peer.id);
                        }}
                        disabled={revokeMutation.isPending}
                        data-testid={`button-revoke-${peer.id}`}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        {L.revoke}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Server picker */}
        <Card className="border-zinc-800 bg-zinc-950/60" data-testid="card-servers">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-zinc-100">
              <Globe2 className="h-5 w-5 text-cyan-400" />
              {L.serversTitle}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {serversLoading ? (
              <div className="text-zinc-500 py-4" data-testid="text-servers-loading">…</div>
            ) : servers.length === 0 ? (
              <div className="rounded-lg border border-dashed border-zinc-800 p-8 text-center" data-testid="empty-servers">
                <Server className="h-8 w-8 mx-auto text-zinc-600 mb-2" />
                <div className="text-zinc-500 text-sm">{L.serversEmpty}</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {servers.map((srv) => {
                  const full = srv.used >= srv.capacity;
                  const enterpriseLocked = srv.isPremium && userTier !== "ENTERPRISE" && userTier !== "GROUPS";
                  const disabled = !isPro || full || enterpriseLocked || connectMutation.isPending;
                  return (
                    <button
                      key={srv.id}
                      onClick={() => !disabled && connectMutation.mutate(srv.id)}
                      disabled={disabled}
                      className={`text-left rounded-lg border p-4 transition-all ${
                        disabled
                          ? "border-zinc-800 bg-zinc-900/40 opacity-60 cursor-not-allowed"
                          : "border-cyan-400/20 bg-zinc-900/60 hover:border-cyan-400/60 hover:bg-cyan-500/5 hover-elevate active-elevate-2"
                      }`}
                      data-testid={`server-card-${srv.id}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl" aria-hidden>{srv.flag}</span>
                          <div className="text-zinc-100 font-medium" data-testid={`text-server-region-${srv.id}`}>
                            {srv.region}
                          </div>
                        </div>
                        {srv.isPremium && (
                          <Badge className="bg-amber-500/20 text-amber-300 border-amber-400/30 text-xs" data-testid={`badge-premium-${srv.id}`}>
                            ★
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1 text-zinc-500">
                          <Users className="h-3 w-3" />
                          <span data-testid={`text-server-load-${srv.id}`}>{srv.used}/{srv.capacity}</span>
                        </div>
                        <span className={`${srv.load > 85 ? "text-rose-400" : srv.load > 60 ? "text-amber-400" : "text-emerald-400"}`}>
                          {L.capacity}: {srv.load}%
                        </span>
                      </div>
                      <div className="mt-2 h-1 rounded-full bg-zinc-800 overflow-hidden">
                        <div
                          className={`h-full transition-all ${srv.load > 85 ? "bg-rose-500" : srv.load > 60 ? "bg-amber-500" : "bg-cyan-500"}`}
                          style={{ width: `${srv.load}%` }}
                        />
                      </div>
                      {enterpriseLocked && (
                        <div className="mt-2 text-xs text-amber-400 flex items-center gap-1">
                          <Lock className="h-3 w-3" />
                          {L.premiumOnly}
                        </div>
                      )}
                      {full && !enterpriseLocked && (
                        <div className="mt-2 text-xs text-rose-400 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {L.serverFull}
                        </div>
                      )}
                      {isPro && !full && !enterpriseLocked && (
                        <div className="mt-2 text-xs text-cyan-300">{L.connect} →</div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* How it works */}
        <Card className="border-zinc-800 bg-zinc-950/40" data-testid="card-how-it-works">
          <CardHeader>
            <CardTitle className="text-zinc-100 text-base">{L.howItWorks}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-zinc-400 space-y-2">
            <div data-testid="text-step-1">{L.step1}</div>
            <div data-testid="text-step-2">{L.step2}</div>
            <div data-testid="text-step-3">{L.step3}</div>
            <div className="pt-3 mt-3 border-t border-zinc-800/60 text-xs text-zinc-500" data-testid="text-privacy-note">
              {L.privacyNote}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* QR dialog */}
      <Dialog open={!!qrPeer} onOpenChange={(open) => !open && setQrPeer(null)}>
        <DialogContent className="bg-zinc-950 border-zinc-800 max-w-md" data-testid="dialog-qr">
          <DialogHeader>
            <DialogTitle className="text-cyan-300 flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              {L.qrTitle}
            </DialogTitle>
          </DialogHeader>
          {qrPeer && (
            <div className="space-y-3">
              <div className="rounded-lg overflow-hidden bg-white p-2 mx-auto w-fit">
                <img
                  src={`/api/vpn/peers/${qrPeer.id}/qr`}
                  alt="WireGuard QR"
                  className="w-64 h-64"
                  data-testid="img-qr"
                />
              </div>
              <div className="text-xs text-zinc-400 text-center" data-testid="text-qr-hint">{L.qrHint}</div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
