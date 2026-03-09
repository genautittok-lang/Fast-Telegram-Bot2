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
  Mail,
  Lock,
  Eye,
  Wifi,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import { SiGoogleplay } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { Footer } from "@/components/Footer";
import { FloatingParticles } from "@/components/FloatingParticles";

export default function DownloadPage() {
  const { t, lang } = useTranslation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const tr = {
    title: lang === "uk" ? "DARKSHARE для Android" : lang === "ru" ? "DARKSHARE для Android" : lang === "es" ? "DARKSHARE para Android" : lang === "de" ? "DARKSHARE für Android" : "DARKSHARE for Android",
    subtitle: lang === "uk" ? "Повна потужність OSINT у вашій кишені" : lang === "ru" ? "Полная мощь OSINT в вашем кармане" : lang === "es" ? "Todo el poder OSINT en tu bolsillo" : lang === "de" ? "Die volle OSINT-Power in Ihrer Tasche" : "Full OSINT power in your pocket",
    comingSoon: lang === "uk" ? "Скоро" : lang === "ru" ? "Скоро" : lang === "es" ? "Próximamente" : lang === "de" ? "Demnächst" : "Coming Soon",
    apkDownload: lang === "uk" ? "Завантажити APK" : lang === "ru" ? "Скачать APK" : lang === "es" ? "Descargar APK" : lang === "de" ? "APK herunterladen" : "Download APK",
    googlePlay: lang === "uk" ? "Незабаром у Google Play" : lang === "ru" ? "Скоро в Google Play" : lang === "es" ? "Próximamente en Google Play" : lang === "de" ? "Bald im Google Play" : "Coming to Google Play",
    features: lang === "uk" ? "Можливості додатку" : lang === "ru" ? "Возможности приложения" : lang === "es" ? "Características de la app" : lang === "de" ? "App-Funktionen" : "App Features",
    requirements: lang === "uk" ? "Системні вимоги" : lang === "ru" ? "Системные требования" : lang === "es" ? "Requisitos del sistema" : lang === "de" ? "Systemanforderungen" : "System Requirements",
    notifyTitle: lang === "uk" ? "Отримати сповіщення" : lang === "ru" ? "Получить уведомление" : lang === "es" ? "Recibir notificación" : lang === "de" ? "Benachrichtigung erhalten" : "Get Notified",
    notifyDesc: lang === "uk" ? "Залиште email і ми повідомимо вас, коли додаток буде доступний" : lang === "ru" ? "Оставьте email и мы сообщим вам, когда приложение будет доступно" : lang === "es" ? "Deja tu email y te avisaremos cuando la app esté disponible" : lang === "de" ? "Hinterlassen Sie Ihre E-Mail und wir benachrichtigen Sie" : "Leave your email and we'll notify you when the app is available",
    notify: lang === "uk" ? "Повідомити мене" : lang === "ru" ? "Уведомить меня" : lang === "es" ? "Notificarme" : lang === "de" ? "Benachrichtigen" : "Notify Me",
    subscribed: lang === "uk" ? "Ви підписані! Ми повідомимо вас." : lang === "ru" ? "Вы подписаны! Мы уведомим вас." : lang === "es" ? "¡Suscrito! Te avisaremos." : lang === "de" ? "Abonniert! Wir benachrichtigen Sie." : "Subscribed! We'll notify you.",
    backHome: lang === "uk" ? "На головну" : lang === "ru" ? "На главную" : lang === "es" ? "Inicio" : lang === "de" ? "Startseite" : "Back to Home",
  };

  const features = [
    {
      icon: <Shield className="w-5 h-5" />,
      title: lang === "uk" ? "11+ модулів перевірки" : lang === "ru" ? "11+ модулей проверки" : lang === "es" ? "11+ módulos de verificación" : lang === "de" ? "11+ Prüfmodule" : "11+ Check Modules",
      desc: lang === "uk" ? "IP, Email, Wallet, Domain, Phone та інші" : lang === "ru" ? "IP, Email, Wallet, Domain, Phone и другие" : lang === "es" ? "IP, Email, Wallet, Domain, Phone y más" : lang === "de" ? "IP, Email, Wallet, Domain, Phone und mehr" : "IP, Email, Wallet, Domain, Phone and more",
    },
    {
      icon: <Bell className="w-5 h-5" />,
      title: lang === "uk" ? "Push-сповіщення" : lang === "ru" ? "Push-уведомления" : lang === "es" ? "Notificaciones push" : lang === "de" ? "Push-Benachrichtigungen" : "Push Notifications",
      desc: lang === "uk" ? "Миттєві алерти про нові загрози" : lang === "ru" ? "Мгновенные алерты о новых угрозах" : lang === "es" ? "Alertas instantáneas de nuevas amenazas" : lang === "de" ? "Sofortige Bedrohungswarnungen" : "Instant alerts on new threats",
    },
    {
      icon: <Wifi className="w-5 h-5" />,
      title: lang === "uk" ? "Офлайн кеш" : lang === "ru" ? "Офлайн кеш" : lang === "es" ? "Caché offline" : lang === "de" ? "Offline-Cache" : "Offline Cache",
      desc: lang === "uk" ? "Доступ до останніх звітів без інтернету" : lang === "ru" ? "Доступ к последним отчётам без интернета" : lang === "es" ? "Acceso a informes recientes sin conexión" : lang === "de" ? "Zugriff auf aktuelle Berichte offline" : "Access recent reports without internet",
    },
    {
      icon: <Lock className="w-5 h-5" />,
      title: lang === "uk" ? "Біометрична автентифікація" : lang === "ru" ? "Биометрическая аутентификация" : lang === "es" ? "Autenticación biométrica" : lang === "de" ? "Biometrische Authentifizierung" : "Biometric Auth",
      desc: lang === "uk" ? "Відбиток пальця або Face ID" : lang === "ru" ? "Отпечаток пальца или Face ID" : lang === "es" ? "Huella dactilar o Face ID" : lang === "de" ? "Fingerabdruck oder Face ID" : "Fingerprint or Face ID",
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: lang === "uk" ? "Швидкий сканер" : lang === "ru" ? "Быстрый сканер" : lang === "es" ? "Escáner rápido" : lang === "de" ? "Schnellscanner" : "Quick Scanner",
      desc: lang === "uk" ? "Перевірка одним дотиком через віджет" : lang === "ru" ? "Проверка одним касанием через виджет" : lang === "es" ? "Verificación con un toque vía widget" : lang === "de" ? "Ein-Tipp-Prüfung über Widget" : "One-tap check via home widget",
    },
    {
      icon: <Eye className="w-5 h-5" />,
      title: lang === "uk" ? "Моніторинг 24/7" : lang === "ru" ? "Мониторинг 24/7" : lang === "es" ? "Monitoreo 24/7" : lang === "de" ? "24/7 Überwachung" : "24/7 Monitoring",
      desc: lang === "uk" ? "Фоновий моніторинг ваших активів" : lang === "ru" ? "Фоновый мониторинг ваших активов" : lang === "es" ? "Monitoreo en segundo plano de tus activos" : lang === "de" ? "Hintergrundüberwachung Ihrer Assets" : "Background monitoring of your assets",
    },
  ];

  const requirements = [
    { label: "OS", value: "Android 8.0+ (Oreo)" },
    { label: "RAM", value: "2 GB+" },
    { label: lang === "uk" ? "Місце" : lang === "ru" ? "Место" : lang === "es" ? "Espacio" : lang === "de" ? "Speicher" : "Storage", value: "50 MB" },
    { label: lang === "uk" ? "Мережа" : lang === "ru" ? "Сеть" : lang === "es" ? "Red" : lang === "de" ? "Netzwerk" : "Network", value: lang === "uk" ? "Інтернет-з'єднання" : lang === "ru" ? "Интернет-подключение" : lang === "es" ? "Conexión a internet" : lang === "de" ? "Internetverbindung" : "Internet connection" },
  ];

  const handleNotify = () => {
    if (!email.trim() || !email.includes("@")) return;
    setSubscribed(true);
    toast({
      title: tr.subscribed,
    });
  };

  return (
    <div className="min-h-screen w-full relative overflow-x-hidden overflow-y-auto flex flex-col bg-background max-w-[100vw]">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-background to-background" />
        <div className="absolute top-0 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-emerald-500/15 rounded-full blur-[128px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-48 sm:w-64 h-48 sm:h-64 bg-green-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />
      </div>
      <FloatingParticles count={15} />

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
        <section className="pt-10 sm:pt-16 pb-12 sm:pb-16 px-4 sm:px-6 max-w-5xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center space-y-4 mb-12"
          >
            <div className="inline-flex items-center gap-2 mx-auto">
              <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30" data-testid="badge-coming-soon">
                {tr.comingSoon}
              </Badge>
            </div>

            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-emerald-600 to-green-500 flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.3)]">
                <Smartphone className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white" data-testid="text-download-title">
              {tr.title}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto" data-testid="text-download-subtitle">
              {tr.subtitle}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <Button
                size="lg"
                disabled
                className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-green-500 opacity-60 cursor-not-allowed"
                data-testid="button-apk-download-disabled"
              >
                <Download className="w-5 h-5 mr-2" />
                {tr.apkDownload}
                <Badge className="ml-2 bg-white/20 text-white border-white/20 text-[10px]">{tr.comingSoon}</Badge>
              </Button>

              <Button
                variant="outline"
                size="lg"
                disabled
                className="w-full sm:w-auto border-white/10 opacity-60 cursor-not-allowed"
                data-testid="button-google-play-disabled"
              >
                <SiGoogleplay className="w-5 h-5 mr-2" />
                {tr.googlePlay}
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mb-12"
          >
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-6 text-center" data-testid="text-features-title">
              {tr.features}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {features.map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.08, duration: 0.5 }}
                >
                  <Card className="p-4 bg-card/50 backdrop-blur-sm border-white/10" data-testid={`card-feature-${i}`}>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
                        {feature.icon}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white mb-1">{feature.title}</h3>
                        <p className="text-xs text-muted-foreground">{feature.desc}</p>
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
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mb-12"
          >
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-6 text-center" data-testid="text-requirements-title">
              {tr.requirements}
            </h2>
            <Card className="p-5 bg-card/50 backdrop-blur-sm border-white/10 max-w-md mx-auto" data-testid="card-requirements">
              <div className="space-y-3">
                {requirements.map((req, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                    <span className="text-sm text-muted-foreground">{req.label}</span>
                    <span className="text-sm font-medium text-white">{req.value}</span>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mb-12"
          >
            <Card className="p-6 sm:p-8 bg-gradient-to-br from-emerald-500/10 to-green-500/5 backdrop-blur-sm border-emerald-500/20 max-w-lg mx-auto text-center" data-testid="card-notify">
              <Bell className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
              <h2 className="text-lg font-semibold text-white mb-2" data-testid="text-notify-title">
                {tr.notifyTitle}
              </h2>
              <p className="text-sm text-muted-foreground mb-5">
                {tr.notifyDesc}
              </p>

              {subscribed ? (
                <div className="flex items-center justify-center gap-2 text-emerald-400" data-testid="text-subscribed">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">{tr.subscribed}</span>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-2 max-w-sm mx-auto">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleNotify()}
                    placeholder="email@example.com"
                    className="flex-1 bg-background/50 border-white/10"
                    data-testid="input-notify-email"
                  />
                  <Button
                    onClick={handleNotify}
                    disabled={!email.trim() || !email.includes("@")}
                    className="bg-emerald-600 hover:bg-emerald-700 shrink-0"
                    data-testid="button-notify-submit"
                  >
                    <Mail className="w-4 h-4 mr-1.5" />
                    {tr.notify}
                  </Button>
                </div>
              )}
            </Card>
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
