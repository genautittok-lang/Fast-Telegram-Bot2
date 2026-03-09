import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  Download,
  Smartphone,
  Shield,
  ShieldCheck,
  Globe,
  Zap,
  Bell,
  CheckCircle,
  ArrowLeft,
  Lock,
  Eye,
  Wifi,
  Monitor,
  Star,
  Users,
  RefreshCw,
  Scan,
  ChevronRight,
  Fingerprint,
  ArrowDown,
  Share2,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { usePWA } from "@/lib/pwa";
import { Footer } from "@/components/Footer";
import { FloatingParticles } from "@/components/FloatingParticles";

export default function DownloadPage() {
  const { lang } = useTranslation();
  const { toast } = useToast();
  const { isInstalled, isIOS, canInstall, triggerInstall } = usePWA();
  const [installing, setInstalling] = useState(false);

  const handleInstall = async () => {
    setInstalling(true);
    const accepted = await triggerInstall();
    if (accepted) {
      toast({ title: tr.installed });
    }
    setInstalling(false);
  };

  const L = (uk: string, ru: string, en: string, es: string, de: string) =>
    lang === "uk" ? uk : lang === "ru" ? ru : lang === "es" ? es : lang === "de" ? de : en;

  const tr = {
    title: L("DARKSHARE", "DARKSHARE", "DARKSHARE", "DARKSHARE", "DARKSHARE"),
    subtitle: L("Безпека у твоїй кишені", "Безопасность в твоём кармане", "Security in your pocket", "Seguridad en tu bolsillo", "Sicherheit in deiner Tasche"),
    install: L("Встановити додаток", "Установить приложение", "Install App", "Instalar App", "App installieren"),
    installing: L("Встановлення...", "Установка...", "Installing...", "Instalando...", "Installiere..."),
    installed: L("Додаток встановлено!", "Приложение установлено!", "App installed!", "¡App instalada!", "App installiert!"),
    alreadyInstalled: L("Вже встановлено", "Уже установлено", "Already Installed", "Ya instalada", "Bereits installiert"),
    openApp: L("Відкрити додаток", "Открыть приложение", "Open App", "Abrir App", "App öffnen"),
    backHome: L("На головну", "На главную", "Back to Home", "Inicio", "Startseite"),
    free: L("Безкоштовно", "Бесплатно", "Free", "Gratis", "Kostenlos"),
    size: "~5 MB",
    rating: "4.9",
    installs: "10K+",
    features: L("Можливості", "Возможности", "Features", "Características", "Funktionen"),
    howToInstall: L("Як встановити", "Как установить", "How to Install", "Cómo instalar", "So installieren Sie"),
    iosStep1: L("Натисни кнопку 'Поділитися'", "Нажмите кнопку 'Поделиться'", "Tap the Share button", "Toca el botón Compartir", "Tippen Sie auf die Teilen-Taste"),
    iosStep2: L("Обери 'На Початковий екран'", "Выберите 'На экран «Домой»'", "Select 'Add to Home Screen'", "Selecciona 'Añadir a pantalla de inicio'", "Wählen Sie 'Zum Home-Bildschirm'"),
    iosStep3: L("Натисни 'Додати'", "Нажмите 'Добавить'", "Tap 'Add'", "Toca 'Añadir'", "Tippen Sie auf 'Hinzufügen'"),
    securityPlatform: L("OSINT Платформа безпеки", "OSINT Платформа безопасности", "OSINT Security Platform", "Plataforma de seguridad OSINT", "OSINT Sicherheitsplattform"),
    nativeExperience: L("Досвід як у додатку", "Опыт как в приложении", "Native App Experience", "Experiencia nativa", "Native App-Erfahrung"),
    worksOffline: L("Працює офлайн", "Работает офлайн", "Works Offline", "Funciona offline", "Funktioniert offline"),
    pushNotifs: L("Push-сповіщення", "Push-уведомления", "Push Notifications", "Notificaciones push", "Push-Benachrichtigungen"),
    autoUpdates: L("Автооновлення", "Автообновления", "Auto Updates", "Actualizaciones auto", "Auto-Updates"),
    biometric: L("Біометричний захист", "Биометрическая защита", "Biometric Protection", "Protección biométrica", "Biometrischer Schutz"),
    quickScan: L("Швидке сканування", "Быстрое сканирование", "Quick Scanning", "Escaneo rápido", "Schneller Scan"),
    instantChecks: L("Миттєві перевірки", "Мгновенные проверки", "Instant Checks", "Verificaciones instantáneas", "Sofortprüfungen"),
    monitoring247: L("Моніторинг 24/7", "Мониторинг 24/7", "24/7 Monitoring", "Monitoreo 24/7", "24/7 Überwachung"),
  };

  const features = [
    { icon: Shield, title: tr.instantChecks, desc: L("IP, Email, Wallet, Domain, Phone, URL, CVE, Hash", "IP, Email, Wallet, Domain, Phone, URL, CVE, Hash", "IP, Email, Wallet, Domain, Phone, URL, CVE, Hash", "IP, Email, Wallet, Domain, Phone, URL, CVE, Hash", "IP, Email, Wallet, Domain, Phone, URL, CVE, Hash"), color: "from-blue-500 to-cyan-500" },
    { icon: Bell, title: tr.pushNotifs, desc: L("Алерти про загрози в реальному часі", "Алерты об угрозах в реальном времени", "Real-time threat alerts", "Alertas de amenazas en tiempo real", "Echtzeit-Bedrohungswarnungen"), color: "from-purple-500 to-pink-500" },
    { icon: Wifi, title: tr.worksOffline, desc: L("Доступ до звітів без інтернету", "Доступ к отчётам без интернета", "Access reports without internet", "Accede a informes sin conexión", "Berichte ohne Internet abrufen"), color: "from-green-500 to-emerald-500" },
    { icon: Fingerprint, title: tr.biometric, desc: L("Face ID та відбиток пальця", "Face ID и отпечаток пальца", "Face ID and fingerprint", "Face ID y huella dactilar", "Face ID und Fingerabdruck"), color: "from-orange-500 to-amber-500" },
    { icon: Scan, title: tr.quickScan, desc: L("Перевірка одним дотиком", "Проверка одним касанием", "One-tap verification", "Verificación con un toque", "Ein-Tipp-Prüfung"), color: "from-red-500 to-rose-500" },
    { icon: Eye, title: tr.monitoring247, desc: L("Фоновий моніторинг активів", "Фоновый мониторинг активов", "Background asset monitoring", "Monitoreo en segundo plano", "Hintergrundüberwachung"), color: "from-indigo-500 to-violet-500" },
  ];

  return (
    <div className="min-h-screen w-full relative overflow-x-hidden overflow-y-auto flex flex-col bg-background max-w-[100vw]">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/8 via-background to-background" />
        <div className="absolute top-0 left-1/3 w-80 h-80 bg-emerald-500/12 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-60 h-60 bg-cyan-500/8 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: "2s" }} />
      </div>
      <FloatingParticles count={12} />

      <nav className="relative z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl sticky top-0">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
          <Link href="/">
            <Button variant="ghost" size="sm" data-testid="button-back-home">
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              {tr.backHome}
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-primary/30">
              <img src="/logo.png" alt="DARKSHARE" className="w-full h-full object-cover" />
            </div>
            <span className="font-bold text-sm text-white">DARKSHARE</span>
          </div>
        </div>
      </nav>

      <main className="flex-grow relative z-10 overflow-x-hidden">
        <section className="pt-8 sm:pt-14 pb-8 sm:pb-12 px-4 sm:px-6 max-w-5xl mx-auto w-full">

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16 mb-16"
          >
            <div className="flex-1 text-center lg:text-left space-y-5">
              <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-xs" data-testid="badge-free">
                {tr.free}
              </Badge>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight" data-testid="text-download-title">
                {tr.title}
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                  {tr.securityPlatform}
                </span>
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-md mx-auto lg:mx-0">
                {tr.subtitle}
              </p>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm text-muted-foreground pt-2 relative scan-beam overflow-hidden rounded-lg px-4 py-2">
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="font-semibold text-white">{tr.rating}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span>{tr.installs}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-cyan-400" />
                  <span>{tr.size}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-3">
                {isInstalled ? (
                  <Button
                    size="lg"
                    className="w-full sm:w-auto h-14 text-base px-8 bg-gradient-to-r from-emerald-600 to-green-500 btn-3d-press neon-text shadow-[0_0_30px_rgba(16,185,129,0.3)]"
                    onClick={() => window.open('/', '_blank')}
                    data-testid="button-open-app"
                  >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    {tr.openApp}
                  </Button>
                ) : canInstall ? (
                  <Button
                    size="lg"
                    className="w-full sm:w-auto h-14 text-base px-8 bg-gradient-to-r from-emerald-600 to-green-500 btn-3d-press animate-glow-pulse transition-all"
                    onClick={handleInstall}
                    disabled={installing}
                    data-testid="button-install-app"
                  >
                    {installing ? (
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    ) : (
                      <Download className="w-5 h-5 mr-2" />
                    )}
                    {installing ? tr.installing : tr.install}
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    className="w-full sm:w-auto h-14 text-base px-8 bg-gradient-to-r from-emerald-600 to-green-500 btn-3d-press animate-glow-pulse"
                    onClick={() => {
                      if (isIOS) {
                        const el = document.getElementById('ios-instructions');
                        el?.scrollIntoView({ behavior: 'smooth' });
                      } else {
                        toast({ title: L("Відкрий сайт у Chrome на телефоні", "Откройте сайт в Chrome на телефоне", "Open this site in Chrome on your phone", "Abre este sitio en Chrome en tu teléfono", "Öffnen Sie diese Seite in Chrome auf Ihrem Telefon") });
                      }
                    }}
                    data-testid="button-install-app"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    {tr.install}
                  </Button>
                )}

                {isInstalled && (
                  <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 px-3 py-2" data-testid="badge-installed">
                    <CheckCircle className="w-4 h-4 mr-1.5" />
                    {tr.alreadyInstalled}
                  </Badge>
                )}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="flex-shrink-0"
            >
              <div className="relative w-[220px] h-[440px] sm:w-[260px] sm:h-[520px]" style={{ perspective: "1200px" }}>
                <div className="absolute inset-0 rounded-[40px] bg-gradient-to-b from-zinc-700 via-zinc-800 to-zinc-900 p-[3px] shadow-[0_0_60px_rgba(16,185,129,0.2)]" style={{ transform: "rotateY(-8deg) rotateX(3deg)", transformStyle: "preserve-3d", transition: "transform 0.6s ease" }}>
                  <div className="w-full h-full rounded-[38px] bg-[#0a0a0b] overflow-hidden relative">
                    <div className="absolute inset-0 holographic opacity-30 pointer-events-none z-20 rounded-[38px]" />
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-zinc-900 rounded-b-2xl z-10" />

                    <div className="pt-8 px-3 space-y-2.5 h-full overflow-hidden">
                      <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-md bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center">
                            <Shield className="w-3 h-3 text-white" />
                          </div>
                          <span className="text-[9px] font-bold text-white">DARKSHARE</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[8px] text-emerald-400">Online</span>
                        </div>
                      </div>

                      <div className="bg-zinc-900/80 rounded-xl p-2.5 border border-white/5">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                          </div>
                          <div>
                            <div className="text-[9px] text-muted-foreground">{L("Рівень безпеки", "Уровень безопасности", "Security Score", "Puntuación", "Sicherheit")}</div>
                            <div className="text-sm font-bold text-emerald-400">92/100</div>
                          </div>
                        </div>
                        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: "92%" }}
                            transition={{ delay: 1, duration: 1.5 }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          { icon: Globe, label: "IP", color: "text-blue-400", bg: "bg-blue-500/10" },
                          { icon: Smartphone, label: "Email", color: "text-purple-400", bg: "bg-purple-500/10" },
                          { icon: Lock, label: "Wallet", color: "text-orange-400", bg: "bg-orange-500/10" },
                        ].map((item, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8 + i * 0.15 }}
                            className={`${item.bg} rounded-lg p-2 text-center border border-white/5`}
                          >
                            <item.icon className={`w-3.5 h-3.5 ${item.color} mx-auto mb-0.5`} />
                            <span className="text-[8px] text-white">{item.label}</span>
                          </motion.div>
                        ))}
                      </div>

                      <div className="space-y-1.5">
                        {[
                          { risk: "low", color: "bg-emerald-500", target: "192.168.1.***", score: "12" },
                          { risk: "high", color: "bg-red-500", target: "0x7a2d***", score: "87" },
                          { risk: "medium", color: "bg-yellow-500", target: "test@***.com", score: "45" },
                        ].map((item, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 1.2 + i * 0.2 }}
                            className="flex items-center gap-2 bg-zinc-900/60 rounded-lg px-2.5 py-1.5 border border-white/5"
                          >
                            <div className={`w-1.5 h-1.5 rounded-full ${item.color}`} />
                            <span className="text-[8px] text-muted-foreground flex-1 truncate">{item.target}</span>
                            <span className="text-[8px] font-bold text-white">{item.score}/100</span>
                          </motion.div>
                        ))}
                      </div>

                      <div className="flex items-center justify-around pt-1 border-t border-white/5">
                        {[Shield, Scan, Globe, Bell, Monitor].map((Icon, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.8 + i * 0.1 }}
                            className={`p-1.5 rounded-lg ${i === 0 ? "bg-emerald-500/20" : ""}`}
                          >
                            <Icon className={`w-3.5 h-3.5 ${i === 0 ? "text-emerald-400" : "text-zinc-500"}`} />
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="absolute -inset-4 rounded-[50px] bg-gradient-to-b from-emerald-500/10 via-transparent to-cyan-500/10 blur-xl pointer-events-none" />

                <div className="absolute inset-0 pointer-events-none hidden sm:block" style={{ perspective: "800px" }}>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0 h-0">
                    <div className="orbit absolute">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center backdrop-blur-sm">
                        <Shield className="w-4 h-4 text-emerald-400" />
                      </div>
                    </div>
                    <div className="orbit-reverse absolute" style={{ animationDelay: "-3s" }}>
                      <div className="w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center backdrop-blur-sm">
                        <Lock className="w-3.5 h-3.5 text-cyan-400" />
                      </div>
                    </div>
                    <div className="orbit absolute" style={{ animationDelay: "-7s" }}>
                      <div className="w-6 h-6 rounded-full bg-purple-500/15 border border-purple-500/30 flex items-center justify-center backdrop-blur-sm">
                        <Eye className="w-3 h-3 text-purple-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mb-16"
          >
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-8 text-center" data-testid="text-features-title">
              {tr.features}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {features.map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.1, duration: 0.5 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                >
                  <Card className="p-5 bg-card/30 backdrop-blur-sm border-white/5 hover:border-white/15 transition-all h-full card-3d-hover" data-testid={`card-feature-${i}`}>
                    <div className="flex items-start gap-4">
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                        <feature.icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white mb-1">{feature.title}</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">{feature.desc}</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="mb-16"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
              {[
                {
                  title: L("Дашборд", "Дашборд", "Dashboard", "Panel", "Dashboard"),
                  gradient: "from-emerald-500/20 to-cyan-500/10",
                  desc: L("Аналіз в реальному часі", "Анализ в реальном времени", "Real-time analysis", "Análisis en tiempo real", "Echtzeit-Analyse"),
                  icon: Monitor,
                },
                {
                  title: L("Сканер", "Сканер", "Scanner", "Escáner", "Scanner"),
                  gradient: "from-purple-500/20 to-pink-500/10",
                  desc: L("11 модулів перевірки", "11 модулей проверки", "11 check modules", "11 módulos", "11 Module"),
                  icon: Scan,
                },
                {
                  title: L("Моніторинг", "Мониторинг", "Monitoring", "Monitoreo", "Überwachung"),
                  gradient: "from-blue-500/20 to-indigo-500/10",
                  desc: L("Відстеження загроз 24/7", "Отслеживание угроз 24/7", "24/7 threat tracking", "Rastreo 24/7", "24/7 Verfolgung"),
                  icon: Eye,
                },
              ].map((screen, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + i * 0.15 }}
                >
                  <Card className={`p-6 bg-gradient-to-br ${screen.gradient} border-white/5 text-center h-full card-3d-hover depth-glow`}>
                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3">
                      <screen.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-white mb-1 text-sm">{screen.title}</h3>
                    <p className="text-xs text-muted-foreground">{screen.desc}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {isIOS && (
            <motion.div
              id="ios-instructions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="mb-16"
            >
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-8 text-center" data-testid="text-ios-install">
                {tr.howToInstall}
              </h2>
              <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
                {[
                  { step: 1, icon: Share2, text: tr.iosStep1 },
                  { step: 2, icon: Plus, text: tr.iosStep2 },
                  { step: 3, icon: CheckCircle, text: tr.iosStep3 },
                ].map((s, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.9 + i * 0.15 }}
                    className="flex-1"
                  >
                    <Card className="p-5 bg-card/30 backdrop-blur-sm border-white/5 text-center h-full">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-3">
                        <span className="text-sm font-bold text-emerald-400">{s.step}</span>
                      </div>
                      <s.icon className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                      <p className="text-xs text-white">{s.text}</p>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {!isIOS && !canInstall && !isInstalled && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="mb-16"
            >
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-8 text-center" data-testid="text-how-install">
                {tr.howToInstall}
              </h2>
              <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
                {[
                  { step: 1, icon: Globe, text: L("Відкрий сайт у Chrome на телефоні", "Откройте сайт в Chrome на телефоне", "Open this site in Chrome on your phone", "Abre este sitio en Chrome", "Öffne die Seite in Chrome") },
                  { step: 2, icon: ArrowDown, text: L("Натисни 'Встановити додаток'", "Нажмите 'Установить приложение'", "Tap 'Install App' button", "Toca 'Instalar App'", "Tippe auf 'App installieren'") },
                  { step: 3, icon: CheckCircle, text: L("Готово! Іконка на робочому столі", "Готово! Иконка на рабочем столе", "Done! Icon on your home screen", "¡Listo! Ícono en tu pantalla", "Fertig! Symbol auf dem Startbildschirm") },
                ].map((s, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.9 + i * 0.15 }}
                    className="flex-1"
                  >
                    <Card className="p-5 bg-card/30 backdrop-blur-sm border-white/5 text-center h-full">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-3">
                        <span className="text-sm font-bold text-emerald-400">{s.step}</span>
                      </div>
                      <s.icon className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                      <p className="text-xs text-white">{s.text}</p>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="mb-12"
          >
            <Card className="p-6 sm:p-8 bg-gradient-to-r from-emerald-500/10 via-cyan-500/5 to-emerald-500/10 backdrop-blur-sm border-emerald-500/20 max-w-lg mx-auto text-center cyber-border holographic">
              <Smartphone className="w-10 h-10 text-emerald-400 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">
                {tr.nativeExperience}
              </h3>
              <p className="text-sm text-muted-foreground mb-5">
                {L(
                  "Встановіть DARKSHARE як додаток — він працює як нативний, з іконкою на головному екрані, без адресного рядка, з пуш-повідомленнями та офлайн доступом.",
                  "Установите DARKSHARE как приложение — оно работает как нативное, с иконкой на главном экране, без адресной строки, с пуш-уведомлениями и офлайн доступом.",
                  "Install DARKSHARE as an app — it works like a native app, with a home screen icon, no address bar, push notifications and offline access.",
                  "Instala DARKSHARE como app — funciona como nativa, con ícono en la pantalla, sin barra de direcciones, notificaciones push y acceso offline.",
                  "Installieren Sie DARKSHARE als App — sie funktioniert wie eine native App, mit Home-Screen-Symbol, ohne Adressleiste, mit Push-Benachrichtigungen und Offline-Zugriff."
                )}
              </p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <Badge className="bg-white/5 text-white/60 border-white/10 text-xs">Android</Badge>
                <Badge className="bg-white/5 text-white/60 border-white/10 text-xs">iOS</Badge>
                <Badge className="bg-white/5 text-white/60 border-white/10 text-xs">Desktop</Badge>
              </div>
            </Card>
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
