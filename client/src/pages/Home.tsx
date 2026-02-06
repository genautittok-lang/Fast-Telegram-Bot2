import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Link } from "wouter";
import { 
  ShieldCheck, 
  Globe, 
  Wallet, 
  FileText, 
  Activity, 
  Zap, 
  Terminal,
  Lock,
  ChevronRight,
  TrendingUp,
  Users,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  Flame,
  Languages,
  Bot,
  Mail,
  Phone,
  Search,
  Database,
  Bug,
  Shield,
  Network,
  Scan,
  Server,
  ExternalLink,
  Send,
  ChevronDown,
  Menu,
  X,
  Smartphone,
  Star,
  Gift,
  CreditCard
} from "lucide-react";
import { SiTelegram } from "react-icons/si";
import { useStats } from "@/hooks/use-stats";
import { useActivity, useLeaderboard } from "@/hooks/use-activity";
import { TerminalText } from "@/components/TerminalText";
import { StatusBadge } from "@/components/StatusBadge";
import { Card } from "@/components/ui/card";
import { FloatingParticles } from "@/components/FloatingParticles";
import { Button } from "@/components/ui/button";
import { MobileMenu } from "@/components/MobileMenu";
import { ThreatFeed } from "@/components/ThreatFeed";
import { Footer } from "@/components/Footer";
import { useTranslation } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ScrollToTop } from "@/components/ScrollToTop";
import { Skeleton } from "@/components/ui/skeleton";

function AnimatedNumber({ value, duration = 2000 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  
  useEffect(() => {
    if (!isInView) return;
    
    let startTime: number;
    const startValue = 0;
    
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.floor(startValue + (value - startValue) * easeOut));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [value, duration, isInView]);
  
  return <span ref={ref}>{displayValue.toLocaleString()}</span>;
}

function ModuleCard({ icon, title, description, apis, delay = 0 }: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  apis?: string[];
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ 
        y: -4, 
        scale: 1.02,
        transition: { duration: 0.2, ease: "easeOut" }
      }}
      className="group relative p-3 sm:p-4 md:p-5 rounded-xl bg-card/50 border border-white/5 hover:border-primary/30 hover:shadow-[0_8px_30px_rgba(34,197,94,0.12)] transition-all duration-300 cursor-pointer"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl" />
      
      <div className="relative z-10 space-y-2 sm:space-y-3">
        <motion.div 
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20 group-hover:bg-primary/20 group-hover:border-primary/40 transition-all duration-300"
          whileHover={{ rotate: [0, -5, 5, 0], transition: { duration: 0.4 } }}
        >
          {icon}
        </motion.div>
        
        <div className="space-y-1 sm:space-y-1.5">
          <h3 className="text-xs sm:text-sm font-bold group-hover:text-primary transition-colors leading-tight">
            {title}
          </h3>
          <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">
            {description}
          </p>
          {apis && apis.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-0.5 sm:pt-1 min-w-0 overflow-hidden">
              {apis.map((api, idx) => (
                <span key={idx} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-muted-foreground font-mono truncate group-hover:bg-primary/10 group-hover:text-primary/80 transition-colors duration-300">
                  {api}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function Home() {
  const { t, lang } = useTranslation();
  
  const { data: stats, isLoading: statsLoading } = useStats();
  const { data: activity } = useActivity();
  const { data: leaderboard } = useLeaderboard();

  const modules = [
    {
      icon: <Wallet className="w-5 h-5" />,
      title: t("dashboard.checkTypes.wallet"),
      description: lang === "uk" ? "Аналіз криптогаманців, історія транзакцій та оцінка ризиків" : lang === "ru" ? "Анализ криптокошельков, история транзакций и оценка рисков" : lang === "es" ? "Análisis de billeteras, historial de transacciones y puntuación de riesgo" : lang === "de" ? "Wallet-Analyse, Transaktionshistorie & Risikobewertung" : "Wallet analysis, transaction history & risk scoring",
      apis: ["Etherscan", "Blockchair"]
    },
    {
      icon: <Globe className="w-5 h-5" />,
      title: t("dashboard.checkTypes.ip"),
      description: lang === "uk" ? "Геолокація, ISP інформація та перевірка репутації IP" : lang === "ru" ? "Геолокация, ISP информация и проверка репутации IP" : lang === "es" ? "Geolocalización, información ISP y reputación IP" : lang === "de" ? "Geolokalisierung, ISP-Info & IP-Reputation" : "Geolocation, ISP info & IP reputation check",
      apis: ["Shodan", "AbuseIPDB"]
    },
    {
      icon: <Search className="w-5 h-5" />,
      title: t("dashboard.checkTypes.domain"),
      description: lang === "uk" ? "WHOIS, DNS записи, SSL сертифікати та історія" : lang === "ru" ? "WHOIS, DNS записи, SSL сертификаты и история" : lang === "es" ? "WHOIS, registros DNS, certificados SSL e historial" : lang === "de" ? "WHOIS, DNS-Einträge, SSL-Zertifikate & Verlauf" : "WHOIS, DNS records, SSL certificates & history",
      apis: ["urlscan.io", "SecurityTrails"]
    },
    {
      icon: <Mail className="w-5 h-5" />,
      title: t("dashboard.checkTypes.email"),
      description: lang === "uk" ? "Перевірка витоків, пов'язані акаунти та breach data" : lang === "ru" ? "Проверка утечек, связанные аккаунты и breach data" : lang === "es" ? "Verificación de filtraciones, cuentas vinculadas y datos de brechas" : lang === "de" ? "Leak-Prüfung, verknüpfte Konten & Breach-Daten" : "Breach check, linked accounts & leak data",
      apis: ["HIBP", "LeakCheck"]
    },
    {
      icon: <Phone className="w-5 h-5" />,
      title: t("dashboard.checkTypes.phone"),
      description: lang === "uk" ? "Оператор, країна, лінія та перевірка spam" : lang === "ru" ? "Оператор, страна, линия и проверка spam" : lang === "es" ? "Operador, país, tipo de línea y verificación de spam" : lang === "de" ? "Anbieter, Land, Leitungstyp & Spam-Check" : "Carrier, country, line type & spam check",
      apis: ["NumVerify", "Twilio"]
    },
    {
      icon: <Bug className="w-5 h-5" />,
      title: t("dashboard.checkTypes.hash"),
      description: lang === "uk" ? "Аналіз файлів, хешів та URL на шкідливість" : lang === "ru" ? "Анализ файлов, хешей и URL на вредоносность" : lang === "es" ? "Análisis de archivos, hashes y URL maliciosos" : lang === "de" ? "Datei-, Hash- & URL-Malware-Analyse" : "File, hash & URL malware analysis",
      apis: ["VirusTotal", "MalwareBazaar"]
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: t("dashboard.checkTypes.cve"),
      description: lang === "uk" ? "Пошук вразливостей та exploits по CVE" : lang === "ru" ? "Поиск уязвимостей и exploits по CVE" : lang === "es" ? "Búsqueda de vulnerabilidades y exploits por CVE" : lang === "de" ? "Schwachstellen- & Exploit-Suche nach CVE" : "Vulnerability & exploit search by CVE",
      apis: ["NVD NIST", "Exploit-DB"]
    },
    {
      icon: <AlertTriangle className="w-5 h-5" />,
      title: t("dashboard.checkTypes.url"),
      description: lang === "uk" ? "Перевірка URL на фішинг та шкідливість" : lang === "ru" ? "Проверка URL на фишинг и вредоносность" : lang === "es" ? "Detección de phishing y malware en URL" : lang === "de" ? "URL-Phishing- & Malware-Erkennung" : "URL phishing & malware detection",
      apis: ["urlscan.io", "Google Safe"]
    },
    {
      icon: <Bot className="w-5 h-5" />,
      title: t("dashboard.checkTypes.bot"),
      description: lang === "uk" ? "Перевірка Telegram Bot API токенів на валідність" : lang === "ru" ? "Проверка Telegram Bot API токенов на валидность" : lang === "es" ? "Validar tokens de API de Telegram Bot" : lang === "de" ? "Telegram Bot API Token validieren" : "Validate Telegram Bot API tokens",
      apis: ["Telegram API"]
    },
    {
      icon: <Search className="w-5 h-5" />,
      title: t("dashboard.checkTypes.username"),
      description: lang === "uk" ? "Пошук профілів по username на різних платформах" : lang === "ru" ? "Поиск профилей по username на разных платформах" : lang === "es" ? "Buscar perfiles por nombre de usuario en plataformas" : lang === "de" ? "Profile nach Benutzername suchen" : "Search profiles by username across platforms",
      apis: ["GitHub", "Social"]
    }
  ];

  const apiSources = [
    { name: "Shodan", description: "IoT & Network Scanner" },
    { name: "VirusTotal", description: "Malware Analysis" },
    { name: "NVD NIST", description: "CVE Database" },
    { name: "urlscan.io", description: "URL Analysis" },
    { name: "MalwareBazaar", description: "Malware Samples" },
    { name: "AbuseIPDB", description: "IP Reputation" },
    { name: "Have I Been Pwned", description: "Breach Data" },
    { name: "Etherscan", description: "Blockchain Data" }
  ];

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-muted-foreground';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'wallet': return <Wallet className="w-3.5 h-3.5" />;
      case 'ip': return <Globe className="w-3.5 h-3.5" />;
      case 'email': return <Mail className="w-3.5 h-3.5" />;
      case 'domain': return <Search className="w-3.5 h-3.5" />;
      case 'url': return <AlertTriangle className="w-3.5 h-3.5" />;
      case 'phone': return <Phone className="w-3.5 h-3.5" />;
      default: return <CheckCircle className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden flex flex-col bg-background">
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 right-1/3 w-48 h-48 bg-blue-500/10 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>
      <div className="absolute inset-0 z-0 overflow-hidden bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <FloatingParticles count={25} />

      <nav className="relative z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden border border-primary/30 shadow-[0_0_20px_rgba(var(--primary),0.3)] flex-shrink-0">
              <img src="/logo.png" alt="DARKSHARE" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-base sm:text-lg tracking-tight text-white">DARKSHARE</span>
              <span className="text-[10px] text-primary font-mono -mt-0.5 hidden sm:block">v4.0 OSINT Platform</span>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-1">
            <Link href="/pricing">
              <Button variant="ghost" size="sm" data-testid="link-nav-pricing">
                <CreditCard className="w-4 h-4 mr-1.5" />
                {t("nav.pricing")}
              </Button>
            </Link>
            <a href="https://t.me/DARKSHAREN1_BOT" target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm" data-testid="link-nav-bot">
                <SiTelegram className="w-4 h-4 mr-1.5" />
                Bot
              </Button>
            </a>
            <Link href="/login">
              <Button size="sm" className="ml-2" data-testid="link-nav-login">
                <Shield className="w-4 h-4 mr-1.5" />
                {t("auth.signIn")}
              </Button>
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            <StatusBadge status="online" className="hidden sm:flex" />
            
            <LanguageSwitcher />
            
            <MobileMenu isAuthenticated={false} />
          </div>
        </div>
      </nav>

      <main className="flex-grow relative z-10 overflow-hidden">
        <section className="pt-8 sm:pt-12 md:pt-20 pb-12 sm:pb-16 md:pb-24 px-4 sm:px-6 max-w-7xl mx-auto w-full overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-12">
            <div className="lg:col-span-3 space-y-5 sm:space-y-6 md:space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="space-y-4 sm:space-y-5 md:space-y-6"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-primary/10 border border-primary/20 text-xs sm:text-sm font-medium text-primary">
                  <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>{t("landing.hero.badge")}</span>
                </div>

                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-white leading-[1.15] sm:leading-[1.1] overflow-hidden">
                  {t("landing.hero.title")} <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary to-blue-400 overflow-hidden">
                    {t("landing.hero.titleHighlight")}
                  </span>
                </h1>

                <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-xl leading-relaxed overflow-hidden">
                  {t("landing.hero.description")}
                </p>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Link href="/login">
                    <Button 
                      size="lg"
                      className="w-full sm:w-auto text-sm sm:text-base px-5 sm:px-6 h-12 sm:h-14 group animate-glow-pulse hover:scale-[1.02] transition-transform duration-300"
                      data-testid="button-web-dashboard"
                    >
                      <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      {t("landing.cta.webDashboard")}
                      <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <a 
                    href="https://t.me/DARKSHAREN1_BOT" 
                    target="_blank" 
                    rel="noreferrer"
                  >
                    <Button 
                      variant="outline"
                      size="lg"
                      className="w-full sm:w-auto text-sm sm:text-base px-5 sm:px-6 h-12 sm:h-14 group border-primary/30 hover:border-primary/50 hover:shadow-[0_0_20px_rgba(34,197,94,0.2)] hover:scale-[1.02] transition-all duration-300"
                      data-testid="button-launch-bot"
                    >
                      <SiTelegram className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      {t("landing.cta.telegramBot")}
                      <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </a>
                </div>

                <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-2 sm:pt-4 text-xs sm:text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>{t("landing.cta.freeStart")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>{t("landing.cta.apiIntegration")}</span>
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                <Card className="bg-card/50 backdrop-blur-sm border-white/10 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <Activity className="w-4 h-4 text-primary" />
                      {t("landing.activity")}
                    </h3>
                    <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      Real-time
                    </span>
                  </div>
                  <div className="space-y-2 max-h-[180px] overflow-hidden">
                    {activity?.slice(0, 4).map((item, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-white/5 border border-white/5"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-primary">{getTypeIcon(item.type)}</span>
                          <span className="font-mono text-muted-foreground truncate text-[11px]">{item.target}</span>
                        </div>
                        <span className={`font-bold uppercase text-[9px] flex-shrink-0 px-1.5 py-0.5 rounded ${getRiskColor(item.riskLevel)} ${
                          item.riskLevel === 'critical' ? 'bg-red-500/20 animate-risk-pulse' :
                          item.riskLevel === 'high' ? 'bg-orange-500/20 animate-risk-pulse-orange' :
                          ''
                        }`}>
                          {item.riskLevel}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
              >
                <Card className="bg-card/50 backdrop-blur-sm border-white/10 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <Flame className="w-4 h-4 text-orange-500" />
                      {t("landing.topHunters")}
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {leaderboard?.slice(0, 3).map((user, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-white/5 border border-white/5"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                            idx === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                            idx === 1 ? 'bg-gray-400/20 text-gray-400' :
                            idx === 2 ? 'bg-orange-500/20 text-orange-500' :
                            'bg-white/10 text-muted-foreground'
                          }`}>
                            {idx + 1}
                          </span>
                          <span className="font-mono truncate">{user.username}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground flex-shrink-0">
                          <span className="text-[11px]">{user.checks}</span>
                          <Flame className="w-3 h-3 text-orange-500" />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="py-6 sm:py-8 md:py-10 border-t border-white/5 bg-gradient-to-b from-transparent to-primary/5 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full overflow-hidden">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 md:gap-8"
            >
              <div className="text-center p-4 sm:p-0 rounded-xl sm:rounded-none bg-white/5 sm:bg-transparent border border-white/10 sm:border-0 space-y-1">
                {statsLoading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Skeleton className="h-8 sm:h-10 md:h-12 w-24 sm:w-28 skeleton-shimmer" />
                    <Skeleton className="h-3 sm:h-4 w-16 skeleton-shimmer" />
                  </div>
                ) : (
                  <>
                    <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                      <AnimatedNumber value={stats?.totalUsers ?? 14582} />
                    </div>
                    <div className="text-[11px] sm:text-xs md:text-sm text-muted-foreground flex items-center justify-center gap-1.5">
                      <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary" />
                      {t("landing.stats.users")}
                    </div>
                  </>
                )}
              </div>
              <div className="text-center p-4 sm:p-0 rounded-xl sm:rounded-none bg-white/5 sm:bg-transparent border border-white/10 sm:border-0 space-y-1">
                {statsLoading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Skeleton className="h-8 sm:h-10 md:h-12 w-24 sm:w-28 skeleton-shimmer" />
                    <Skeleton className="h-3 sm:h-4 w-16 skeleton-shimmer" />
                  </div>
                ) : (
                  <>
                    <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                      <AnimatedNumber value={stats?.activeWatches ?? 3841} />
                    </div>
                    <div className="text-[11px] sm:text-xs md:text-sm text-muted-foreground flex items-center justify-center gap-1.5">
                      <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary" />
                      {t("landing.stats.monitors")}
                    </div>
                  </>
                )}
              </div>
              <div className="text-center p-4 sm:p-0 rounded-xl sm:rounded-none bg-white/5 sm:bg-transparent border border-white/10 sm:border-0 space-y-1">
                {statsLoading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Skeleton className="h-8 sm:h-10 md:h-12 w-24 sm:w-28 skeleton-shimmer" />
                    <Skeleton className="h-3 sm:h-4 w-16 skeleton-shimmer" />
                  </div>
                ) : (
                  <>
                    <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                      <AnimatedNumber value={stats?.threatsBlocked ?? 12459} />
                    </div>
                    <div className="text-[11px] sm:text-xs md:text-sm text-muted-foreground flex items-center justify-center gap-1.5">
                      <AlertTriangle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary" />
                      {t("landing.stats.threats")}
                    </div>
                  </>
                )}
              </div>
              <div className="text-center p-4 sm:p-0 rounded-xl sm:rounded-none bg-white/5 sm:bg-transparent border border-white/10 sm:border-0 space-y-1">
                {statsLoading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Skeleton className="h-8 sm:h-10 md:h-12 w-24 sm:w-28 skeleton-shimmer" />
                    <Skeleton className="h-3 sm:h-4 w-16 skeleton-shimmer" />
                  </div>
                ) : (
                  <>
                    <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                      <AnimatedNumber value={stats?.checksToday ?? 842} />
                    </div>
                    <div className="text-[11px] sm:text-xs md:text-sm text-muted-foreground flex items-center justify-center gap-1.5">
                      <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary" />
                      {t("landing.stats.today")}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </section>

        <section className="py-8 sm:py-10 md:py-12 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-8 sm:mb-10 space-y-2 sm:space-y-3"
            >
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-xs font-medium text-red-400">
                <AlertTriangle className="w-3 h-3" />
                {lang === "uk" ? "Загрози в Реальному Часі" : lang === "ru" ? "Угрозы в Реальном Времени" : "Real-Time Threats"}
              </span>
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold px-2">
                {lang === "uk" ? "Стрічка Кіберзагроз" : lang === "ru" ? "Лента Киберугроз" : "Live Threat Intelligence"}
              </h2>
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground max-w-2xl mx-auto px-2">
                {lang === "uk" 
                  ? "Моніторинг останніх CVE, malware кампаній та активних загроз з провідних джерел безпеки"
                  : lang === "ru"
                  ? "Мониторинг последних CVE, malware кампаний и активных угроз из ведущих источников безопасности"
                  : "Monitoring the latest CVEs, malware campaigns and active threats from leading security sources"}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="max-w-3xl mx-auto"
            >
              <ThreatFeed />
            </motion.div>
          </div>
        </section>

        <section className="py-8 sm:py-10 md:py-14 lg:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-8 sm:mb-10 md:mb-14 space-y-2 sm:space-y-3"
            >
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary">
                <Terminal className="w-3 h-3" />
                {lang === "uk" ? "10 Модулів" : lang === "ru" ? "10 Модулей" : "10 Modules"}
              </span>
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold px-2">
                {lang === "uk" ? "Повний Арсенал OSINT" : lang === "ru" ? "Полный Арсенал OSINT" : "Complete OSINT Arsenal"}
              </h2>
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground max-w-2xl mx-auto px-2">
                {lang === "uk" 
                  ? "Кожен модуль інтегрований з провідними API для максимальної точності та актуальності даних"
                  : lang === "ru"
                  ? "Каждый модуль интегрирован с ведущими API для максимальной точности и актуальности данных"
                  : "Each module integrated with leading APIs for maximum accuracy and data relevance"}
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              {modules.map((module, idx) => (
                <ModuleCard 
                  key={idx}
                  {...module}
                  delay={0.05 * idx}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="py-8 sm:py-10 md:py-12 bg-card/30 border-y border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-8 sm:mb-10 md:mb-12 space-y-2 sm:space-y-3"
            >
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary">
                <Server className="w-3 h-3" />
                {lang === "uk" ? "API Інтеграції" : lang === "ru" ? "API Интеграции" : "API Integrations"}
              </span>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold px-2">
                {lang === "uk" ? "Джерела Даних" : lang === "ru" ? "Источники Данных" : "Data Sources"}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto px-2">
                {lang === "uk" 
                  ? "Інтеграція з найкращими API безпеки для актуальних та достовірних даних"
                  : lang === "ru"
                  ? "Интеграция с лучшими API безопасности для актуальных и достоверных данных"
                  : "Integration with top security APIs for accurate and reliable data"}
              </p>
            </motion.div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              {apiSources.map((source, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05 }}
                  className="group p-3 sm:p-4 md:p-5 rounded-xl bg-white/5 border border-white/5 hover:border-primary/20 transition-all duration-300 text-center"
                >
                  <div className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-2 sm:mb-3 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                    <Database className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <h3 className="font-bold text-xs sm:text-sm mb-0.5 sm:mb-1 group-hover:text-primary transition-colors">{source.name}</h3>
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-tight">{source.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-6 sm:py-8 md:py-10 max-w-5xl mx-auto px-3 sm:px-4 w-full">
          <div className="rounded-xl overflow-hidden border border-white/10 bg-[#0a0a0a] shadow-2xl shadow-primary/5">
            <div className="flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-white/5 border-b border-white/10">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <div className="flex-1 text-center font-mono text-xs text-muted-foreground">darkshare_cli — v4.0</div>
            </div>
            <div className="p-3 sm:p-4 md:p-6 font-mono text-[10px] sm:text-xs md:text-sm space-y-2 sm:space-y-3 h-[240px] sm:h-[280px] md:h-[320px] overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0a0a0a] z-10 pointer-events-none" />
              
              <div className="text-green-500/70 break-all">$ darkshare scan --target 0x1234...5678 --type wallet</div>
              <div className="space-y-1.5 text-muted-foreground">
                <TerminalText text="[INIT] Connecting to blockchain nodes..." delay={500} speed={25} cursor={false} />
                <br />
                <TerminalText text="[INFO] Target: ETH Wallet | Network: Mainnet" delay={1500} speed={25} cursor={false} />
                <br />
                <TerminalText text="[SCAN] Analyzing 154 transactions..." delay={2500} speed={30} cursor={false} />
                <br />
                <TerminalText text="[WARN] Mixer interaction detected: Tornado Cash" delay={4500} speed={25} className="text-yellow-500" cursor={false} />
                <br />
                <TerminalText text="[SCAN] Checking OFAC/EU sanctions lists..." delay={6000} speed={25} cursor={false} />
                <br />
                <TerminalText text="[OK] No sanctions match found" delay={7500} speed={25} className="text-green-500" cursor={false} />
                <br />
                <TerminalText text="[DONE] Risk Score: MEDIUM (45/100) | Report saved" delay={9000} speed={30} className="text-primary font-bold" />
              </div>
            </div>
          </div>
        </section>

        <section className="py-8 sm:py-10 md:py-14 lg:py-16 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-8 sm:mb-10 md:mb-14 space-y-2 sm:space-y-3"
            >
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-medium text-blue-400">
                <SiTelegram className="w-3 h-3" />
                {lang === "uk" ? "Telegram Бот" : lang === "ru" ? "Telegram Бот" : lang === "es" ? "Bot de Telegram" : lang === "de" ? "Telegram Bot" : "Telegram Bot"}
              </span>
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold px-2">
                {lang === "uk" ? "Як працює бот?" : lang === "ru" ? "Как работает бот?" : lang === "es" ? "¿Cómo funciona el bot?" : lang === "de" ? "Wie funktioniert der Bot?" : "How Does the Bot Work?"}
              </h2>
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground max-w-2xl mx-auto px-2">
                {lang === "uk" 
                  ? "Три прості кроки для повного аналізу безпеки прямо в Telegram"
                  : lang === "ru"
                  ? "Три простых шага для полного анализа безопасности прямо в Telegram"
                  : lang === "es"
                  ? "Tres simples pasos para un análisis de seguridad completo directamente en Telegram"
                  : lang === "de"
                  ? "Drei einfache Schritte für eine vollständige Sicherheitsanalyse direkt in Telegram"
                  : "Three simple steps for a complete security analysis right in Telegram"}
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
              {[
                {
                  step: "01",
                  img: "/images/bot-step1-start.png",
                  title: lang === "uk" ? "Запустіть бота" : lang === "ru" ? "Запустите бота" : lang === "es" ? "Inicia el bot" : lang === "de" ? "Starte den Bot" : "Start the Bot",
                  desc: lang === "uk" 
                    ? "Відкрийте @DARKSHAREN1_BOT в Telegram та натисніть /start. Оберіть тип перевірки з меню."
                    : lang === "ru"
                    ? "Откройте @DARKSHAREN1_BOT в Telegram и нажмите /start. Выберите тип проверки из меню."
                    : lang === "es"
                    ? "Abre @DARKSHAREN1_BOT en Telegram y pulsa /start. Elige el tipo de verificación del menú."
                    : lang === "de"
                    ? "Öffne @DARKSHAREN1_BOT in Telegram und drücke /start. Wähle den Prüftyp aus dem Menü."
                    : "Open @DARKSHAREN1_BOT in Telegram and press /start. Choose the check type from the menu."
                },
                {
                  step: "02",
                  img: "/images/bot-step2-check.png",
                  title: lang === "uk" ? "Введіть ціль" : lang === "ru" ? "Введите цель" : lang === "es" ? "Introduce el objetivo" : lang === "de" ? "Ziel eingeben" : "Enter the Target",
                  desc: lang === "uk" 
                    ? "Надішліть IP, домен, email, гаманець або інші дані. Бот миттєво почне аналіз."
                    : lang === "ru"
                    ? "Отправьте IP, домен, email, кошелёк или другие данные. Бот мгновенно начнёт анализ."
                    : lang === "es"
                    ? "Envía una IP, dominio, email, billetera u otros datos. El bot comenzará el análisis al instante."
                    : lang === "de"
                    ? "Sende eine IP, Domain, E-Mail, Wallet oder andere Daten. Der Bot beginnt sofort mit der Analyse."
                    : "Send an IP, domain, email, wallet or other data. The bot will instantly start the analysis."
                },
                {
                  step: "03",
                  img: "/images/bot-step3-results.png",
                  title: lang === "uk" ? "Отримайте звіт" : lang === "ru" ? "Получите отчёт" : lang === "es" ? "Recibe el informe" : lang === "de" ? "Erhalte den Bericht" : "Get the Report",
                  desc: lang === "uk" 
                    ? "Отримайте детальний звіт з оцінкою ризику, знахідками та рекомендаціями. Завантажте PDF."
                    : lang === "ru"
                    ? "Получите подробный отчёт с оценкой риска, находками и рекомендациями. Скачайте PDF."
                    : lang === "es"
                    ? "Recibe un informe detallado con puntuación de riesgo, hallazgos y recomendaciones. Descarga el PDF."
                    : lang === "de"
                    ? "Erhalte einen detaillierten Bericht mit Risikobewertung, Ergebnissen und Empfehlungen. Lade das PDF herunter."
                    : "Receive a detailed report with risk score, findings and recommendations. Download the PDF."
                }
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.15, duration: 0.5 }}
                  className="group relative"
                >
                  <div className="relative rounded-xl overflow-hidden border border-white/10 bg-card/50 backdrop-blur-sm" data-testid={`card-bot-step-${idx + 1}`}>
                    <div className="relative aspect-[3/4] overflow-hidden bg-black/50">
                      <img 
                        src={item.img} 
                        alt={item.title}
                        className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-500"
                        loading="lazy"
                        data-testid={`img-bot-step-${idx + 1}`}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <div className="absolute top-3 left-3 w-8 h-8 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-mono text-xs font-bold backdrop-blur-sm">
                        {item.step}
                      </div>
                    </div>
                    <div className="p-4 space-y-2">
                      <h3 className="text-sm sm:text-base font-bold" data-testid={`text-bot-step-title-${idx + 1}`}>{item.title}</h3>
                      <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed" data-testid={`text-bot-step-desc-${idx + 1}`}>{item.desc}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="text-center mt-8 sm:mt-10"
            >
              <a 
                href="https://t.me/DARKSHAREN1_BOT" 
                target="_blank" 
                rel="noreferrer"
              >
                <Button 
                  size="lg"
                  className="px-6 sm:px-8 h-12 sm:h-14 text-sm sm:text-base group"
                  data-testid="button-try-bot-how-it-works"
                >
                  <SiTelegram className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  {lang === "uk" ? "Спробувати бота" : lang === "ru" ? "Попробовать бота" : lang === "es" ? "Probar el bot" : lang === "de" ? "Bot ausprobieren" : "Try the Bot"}
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </Button>
              </a>
            </motion.div>
          </div>
        </section>

        <section className="py-8 sm:py-10 md:py-12 bg-gradient-to-b from-primary/10 to-transparent border-t border-primary/20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center w-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-4 sm:space-y-6"
            >
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold px-2">
                {lang === "uk" ? "Готові почати?" : lang === "ru" ? "Готовы начать?" : "Ready to Start?"}
              </h2>
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground max-w-xl mx-auto px-2">
                {lang === "uk" 
                  ? "Приєднуйтесь до тисяч користувачів, які довіряють DARKSHARE для своєї кібербезпеки"
                  : lang === "ru"
                  ? "Присоединяйтесь к тысячам пользователей, которые доверяют DARKSHARE для своей кибербезопасности"
                  : "Join thousands of users who trust DARKSHARE for their cybersecurity needs"}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2 px-2">
                <Link href="/login">
                  <Button size="lg" className="w-full sm:w-auto px-6 sm:px-8 h-12 sm:h-14 text-sm sm:text-base" data-testid="button-dashboard-cta">
                    <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    {t("landing.cta.webDashboard")}
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button variant="secondary" size="lg" className="w-full sm:w-auto px-6 sm:px-8 h-12 sm:h-14 text-sm sm:text-base bg-emerald-600 hover:bg-emerald-700 text-white" data-testid="button-pricing-cta">
                    <Zap className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    {t("nav.pricing")}
                  </Button>
                </Link>
                <a 
                  href="https://t.me/DARKSHAREN1_BOT" 
                  target="_blank" 
                  rel="noreferrer"
                >
                  <Button variant="outline" size="lg" className="w-full sm:w-auto px-6 sm:px-8 h-12 sm:h-14 text-sm sm:text-base border-primary/30" data-testid="button-launch-bot-cta">
                    <SiTelegram className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Telegram Bot
                    <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-2" />
                  </Button>
                </a>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
      <ScrollToTop />
    </div>
  );
}
