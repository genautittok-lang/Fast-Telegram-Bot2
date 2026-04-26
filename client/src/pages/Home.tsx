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
  CreditCard,
  HelpCircle,
  Trophy,
  ShieldAlert,
  FileWarning,
  Handshake,
  ShoppingBag,
  MessageCircle,
  Download
} from "lucide-react";
import { SiTelegram, SiInstagram } from "react-icons/si";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

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

function ModuleCard({ icon, title, description, apis, delay = 0, onClick }: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  apis?: string[];
  delay?: number;
  onClick?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ 
        y: -4, 
        transition: { duration: 0.25, ease: "easeOut" }
      }}
      onClick={onClick}
      className="group relative flex flex-col items-center justify-center gap-3 p-5 sm:p-6 rounded-xl premium-card cursor-pointer min-h-[110px] sm:min-h-[130px]"
      data-testid={`card-module-${title}`}
    >
      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:border-primary/40 group-hover:shadow-[0_0_20px_rgba(34,197,94,0.15)] transition-all duration-300">
        <div className="w-5 h-5 sm:w-5.5 sm:h-5.5 flex items-center justify-center">
          {icon}
        </div>
      </div>
      <h3 className="text-xs sm:text-sm font-semibold text-muted-foreground group-hover:text-white transition-colors leading-tight text-center line-clamp-2">
        {title}
      </h3>
    </motion.div>
  );
}

function QuickCheck({ lang }: { lang: string }) {
  const [quickType, setQuickType] = useState("ip");
  const [quickValue, setQuickValue] = useState("");
  const [quickResult, setQuickResult] = useState<any>(null);
  const [quickLoading, setQuickLoading] = useState(false);
  const [quickError, setQuickError] = useState("");

  const typeOptions = [
    { value: "ip", label: "IP", icon: "🌐", placeholder: "8.8.8.8" },
    { value: "email", label: "Email", icon: "📧", placeholder: "user@example.com" },
    { value: "domain", label: "Domain", icon: "🏢", placeholder: "example.com" },
    { value: "wallet", label: "Wallet", icon: "💰", placeholder: "0x..." },
  ];

  const handleQuickCheck = async () => {
    if (!quickValue.trim()) return;
    setQuickLoading(true);
    setQuickError("");
    setQuickResult(null);
    try {
      const res = await fetch("/api/quick-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: quickType, value: quickValue.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setQuickResult(data);
    } catch (err: any) {
      setQuickError(err.message);
    } finally {
      setQuickLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "low": return "text-green-400 border-green-500/30 bg-green-500/10";
      case "medium": return "text-yellow-400 border-yellow-500/30 bg-yellow-500/10";
      case "high": return "text-red-400 border-red-500/30 bg-red-500/10";
      case "critical": return "text-red-500 border-red-600/30 bg-red-600/10";
      default: return "text-gray-400";
    }
  };

  const tryItLabel = lang === "uk" ? "Спробуй безкоштовно" : lang === "ru" ? "Попробуй бесплатно" : lang === "es" ? "Prueba gratis" : lang === "de" ? "Kostenlos testen" : "Try it free";
  const noRegLabel = lang === "uk" ? "Без реєстрації · 3 перевірки/день" : lang === "ru" ? "Без регистрации · 3 проверки/день" : lang === "es" ? "Sin registro · 3 verificaciones/día" : lang === "de" ? "Ohne Registrierung · 3 Checks/Tag" : "No signup · 3 checks/day";
  const checkBtn = lang === "uk" ? "Перевірити" : lang === "ru" ? "Проверить" : lang === "es" ? "Verificar" : lang === "de" ? "Prüfen" : "Check";
  const fullReportLabel = lang === "uk" ? "Повний звіт — увійдіть для деталей" : lang === "ru" ? "Полный отчёт — войдите для деталей" : lang === "es" ? "Informe completo — inicie sesión" : lang === "de" ? "Vollständiger Bericht — melden Sie sich an" : "Full report — sign in for details";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.6 }}
      className="mt-6 sm:mt-8"
    >
      <Card className="bg-gradient-to-b from-[#0d1117] to-[#080c12] backdrop-blur-sm border-white/10 p-4 sm:p-5 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            {tryItLabel}
          </h3>
          <span className="text-[10px] text-muted-foreground">{noRegLabel}</span>
        </div>

        <div className="flex gap-2 mb-3">
          {typeOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setQuickType(opt.value); setQuickResult(null); setQuickError(""); }}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${quickType === opt.value ? "bg-primary/20 border border-primary/40 text-primary" : "bg-white/5 border border-white/10 text-muted-foreground hover:border-white/20"}`}
              data-testid={`quick-type-${opt.value}`}
            >
              <span>{opt.icon}</span>
              <span className="hidden sm:inline">{opt.label}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={quickValue}
            onChange={(e) => setQuickValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleQuickCheck()}
            placeholder={typeOptions.find(o => o.value === quickType)?.placeholder}
            className="flex-1 bg-[#0a0a0f] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40 transition-colors min-w-0"
            data-testid="input-quick-check"
          />
          <Button
            onClick={handleQuickCheck}
            disabled={quickLoading || !quickValue.trim()}
            className="px-4 h-[42px] shrink-0 w-full sm:w-auto"
            data-testid="button-quick-check"
          >
            {quickLoading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>{checkBtn}</>
            )}
          </Button>
        </div>

        {quickError && (
          <div className="mt-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            {quickError}
          </div>
        )}

        {quickResult && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-3"
          >
            <div className={`p-3 rounded-lg border ${getRiskColor(quickResult.riskLevel)}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono opacity-80">{quickResult.target}</span>
                <span className="text-sm font-bold">{quickResult.riskScore}% {quickResult.riskLevel.toUpperCase()}</span>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full mb-2">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${quickResult.riskScore >= 60 ? "bg-red-500" : quickResult.riskScore >= 40 ? "bg-yellow-500" : "bg-green-500"}`}
                  style={{ width: `${quickResult.riskScore}%` }}
                />
              </div>
              <p className="text-xs opacity-80 mb-2">{quickResult.summary}</p>
              {quickResult.findings?.map((f: string, i: number) => (
                <p key={i} className="text-[11px] opacity-60">{i === quickResult.findings.length - 1 ? "└" : "├"} {f}</p>
              ))}
              <div className="mt-2 pt-2 border-t border-white/10">
                <Link href="/login">
                  <span className="text-[11px] text-primary hover:underline cursor-pointer" data-testid="link-full-report">
                    {fullReportLabel} →
                  </span>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </Card>
    </motion.div>
  );
}

export default function Home() {
  const { t, lang } = useTranslation();
  
  const [openFaqItems, setOpenFaqItems] = useState<number[]>([]);
  const [selectedModule, setSelectedModule] = useState<number | null>(null);
  const { data: stats, isLoading: statsLoading } = useStats();
  const { data: activity } = useActivity();
  const { data: leaderboard } = useLeaderboard();

  const whatIsAnalyzed = lang === "uk" ? "ЩО АНАЛІЗУЄТЬСЯ" : lang === "ru" ? "ЧТО АНАЛИЗИРУЕТСЯ" : lang === "es" ? "QUÉ SE ANALIZA" : lang === "de" ? "WAS WIRD ANALYSIERT" : "WHAT IS ANALYZED";
  const goToCheck = lang === "uk" ? "Перейти до перевірки" : lang === "ru" ? "Перейти к проверке" : lang === "es" ? "Ir a verificación" : lang === "de" ? "Zur Überprüfung" : "Go to check";

  const modules = [
    {
      icon: <Globe className="w-5 h-5" />,
      title: t("dashboard.checkTypes.ip"),
      description: lang === "uk" ? "Геолокація, ISP інформація та перевірка репутації IP" : lang === "ru" ? "Геолокация, ISP информация и проверка репутации IP" : lang === "es" ? "Geolocalización, información ISP y reputación IP" : lang === "de" ? "Geolokalisierung, ISP-Info & IP-Reputation" : "Geolocation, ISP info & IP reputation check",
      apis: ["Shodan", "AbuseIPDB"]
    },
    {
      icon: <Wallet className="w-5 h-5" />,
      title: t("dashboard.checkTypes.wallet"),
      description: lang === "uk" ? "Аналіз криптогаманців, історія транзакцій та оцінка ризиків" : lang === "ru" ? "Анализ криптокошельков, история транзакций и оценка рисков" : lang === "es" ? "Análisis de billeteras, historial de transacciones y puntuación de riesgo" : lang === "de" ? "Wallet-Analyse, Transaktionshistorie & Risikobewertung" : "Wallet analysis, transaction history & risk scoring",
      apis: ["Etherscan", "Blockchair"]
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
      icon: <Search className="w-5 h-5" />,
      title: t("dashboard.checkTypes.domain"),
      description: lang === "uk" ? "WHOIS, DNS записи, SSL сертифікати та історія" : lang === "ru" ? "WHOIS, DNS записи, SSL сертификаты и история" : lang === "es" ? "WHOIS, registros DNS, certificados SSL e historial" : lang === "de" ? "WHOIS, DNS-Einträge, SSL-Zertifikate & Verlauf" : "WHOIS, DNS records, SSL certificates & history",
      apis: ["urlscan.io", "SecurityTrails"]
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
      icon: <Shield className="w-5 h-5" />,
      title: t("dashboard.checkTypes.cve"),
      description: lang === "uk" ? "Пошук вразливостей та exploits по CVE" : lang === "ru" ? "Поиск уязвимостей и exploits по CVE" : lang === "es" ? "Búsqueda de vulnerabilidades y exploits por CVE" : lang === "de" ? "Schwachstellen- & Exploit-Suche nach CVE" : "Vulnerability & exploit search by CVE",
      apis: ["NVD NIST", "Exploit-DB"]
    },
    {
      icon: <Bug className="w-5 h-5" />,
      title: t("dashboard.checkTypes.hash"),
      description: lang === "uk" ? "Аналіз файлів, хешів та URL на шкідливість" : lang === "ru" ? "Анализ файлов, хешей и URL на вредоносность" : lang === "es" ? "Análisis de archivos, hashes y URL maliciosos" : lang === "de" ? "Datei-, Hash- & URL-Malware-Analyse" : "File, hash & URL malware analysis",
      apis: ["VirusTotal", "MalwareBazaar"]
    },
    {
      icon: <Search className="w-5 h-5" />,
      title: t("dashboard.checkTypes.username"),
      description: lang === "uk" ? "Пошук профілів по username на різних платформах" : lang === "ru" ? "Поиск профилей по username на разных платформах" : lang === "es" ? "Buscar perfiles por nombre de usuario en plataformas" : lang === "de" ? "Profile nach Benutzername suchen" : "Search profiles by username across platforms",
      apis: ["GitHub", "Social"]
    },
    {
      icon: <CreditCard className="w-5 h-5" />,
      title: lang === "uk" ? "BIN Card" : lang === "ru" ? "BIN Card" : lang === "es" ? "BIN Card" : lang === "de" ? "BIN Card" : "BIN Card",
      description: lang === "uk" ? "Перевірка BIN коду банківської картки" : lang === "ru" ? "Проверка BIN кода банковской карты" : lang === "es" ? "Verificación del código BIN de tarjeta" : lang === "de" ? "BIN-Code-Prüfung der Bankkarte" : "Bank card BIN code verification",
      apis: ["BINList"]
    },
    {
      icon: <Lock className="w-5 h-5" />,
      title: lang === "uk" ? "Password" : lang === "ru" ? "Пароль" : lang === "es" ? "Contraseña" : lang === "de" ? "Passwort" : "Password",
      description: lang === "uk" ? "Ентропія, злам-час та перевірка у витоках" : lang === "ru" ? "Энтропия, время взлома и проверка в утечках" : lang === "es" ? "Entropía, tiempo de craqueo y verificación de filtraciones" : lang === "de" ? "Entropie, Knackzeit & Leak-Prüfung" : "Entropy, crack time & breach check",
      apis: ["HIBP", "zxcvbn"]
    },
    {
      icon: <Network className="w-5 h-5" />,
      title: "DNS",
      description: lang === "uk" ? "A/MX/NS/TXT записи, SPF/DMARC та DNSSEC" : lang === "ru" ? "A/MX/NS/TXT записи, SPF/DMARC и DNSSEC" : lang === "es" ? "Registros A/MX/NS/TXT, SPF/DMARC y DNSSEC" : lang === "de" ? "A/MX/NS/TXT-Einträge, SPF/DMARC & DNSSEC" : "A/MX/NS/TXT records, SPF/DMARC & DNSSEC",
      apis: ["Google DNS"]
    },
    {
      icon: <ShieldCheck className="w-5 h-5" />,
      title: "SSL/TLS",
      description: lang === "uk" ? "Валідність сертифікату, HSTS та SAN аналіз" : lang === "ru" ? "Валидность сертификата, HSTS и SAN анализ" : lang === "es" ? "Validez del certificado, HSTS y análisis SAN" : lang === "de" ? "Zertifikatsgültigkeit, HSTS & SAN-Analyse" : "Certificate validity, HSTS & SAN analysis",
      apis: ["SSL Labs"]
    },
    {
      icon: <Server className="w-5 h-5" />,
      title: "MAC",
      description: lang === "uk" ? "OUI vendor, виявлення VM та тип пристрою" : lang === "ru" ? "OUI vendor, обнаружение VM и тип устройства" : lang === "es" ? "Vendor OUI, detección de VM y tipo de dispositivo" : lang === "de" ? "OUI-Vendor, VM-Erkennung & Gerätetyp" : "OUI vendor lookup, VM detection & device type",
      apis: ["IEEE OUI"]
    },
    {
      icon: <Download className="w-5 h-5" />,
      title: "EXIF",
      description: lang === "uk" ? "GPS, камера, дата з метаданих зображень" : lang === "ru" ? "GPS, камера, дата из метаданных изображений" : lang === "es" ? "GPS, cámara, fecha de metadatos de imagen" : lang === "de" ? "GPS, Kamera, Datum aus Bild-Metadaten" : "GPS, camera, date from image metadata",
      apis: ["ExifReader"]
    },
    {
      icon: <Scan className="w-5 h-5" />,
      title: "GeoINT",
      description: lang === "uk" ? "Підказки для геолокації по регіонам світу" : lang === "ru" ? "Подсказки для геолокации по регионам мира" : lang === "es" ? "Consejos de geolocalización por regiones del mundo" : lang === "de" ? "Geolokalisierungstipps nach Weltregionen" : "Geolocation hints by world regions",
      apis: ["Regional DB"]
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
    <div className="min-h-screen w-full relative overflow-x-hidden overflow-y-auto flex flex-col bg-background max-w-[100vw]">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(34,197,94,0.15),transparent_60%)]" />
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/15 rounded-full blur-[180px]" />
        <div className="absolute top-[30%] right-[10%] w-[400px] h-[400px] bg-cyan-500/8 rounded-full blur-[150px]" />
        <div className="absolute top-[60%] left-[5%] w-[300px] h-[300px] bg-violet-500/6 rounded-full blur-[120px]" />
      </div>
      <div className="absolute inset-0 z-0 overflow-hidden bg-[linear-gradient(to_right,#80808006_1px,transparent_1px),linear-gradient(to_bottom,#80808006_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none opacity-60" />
      <FloatingParticles count={20} />

      <nav className="relative z-50 w-full border-b border-white/[0.08] bg-[rgba(5,5,8,0.75)] backdrop-blur-2xl backdrop-saturate-150 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden border border-primary/40 shadow-[0_0_30px_rgba(34,197,94,0.3)] flex-shrink-0 ring-1 ring-primary/10">
              <img src="/logo.png" alt="DARKSHARE" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-base sm:text-lg tracking-tight text-white">DARKSHARE</span>
              <span className="text-[10px] text-primary font-mono -mt-0.5 hidden sm:block tracking-wider uppercase">v4.4 OSINT Platform</span>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-1">
            <Link href="/pricing">
              <Button variant="ghost" size="sm" data-testid="link-nav-pricing">
                <CreditCard className="w-4 h-4 mr-1.5" />
                {t("nav.pricing")}
              </Button>
            </Link>
            <a href="https://t.me/DarkShare1Bot" target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm" data-testid="link-nav-bot">
                <SiTelegram className="w-4 h-4 mr-1.5" />
                {lang === "uk" ? "Бот" : lang === "ru" ? "Бот" : lang === "es" ? "Bot" : lang === "de" ? "Bot" : "Bot"}
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

      <main className="flex-grow relative z-10 overflow-x-hidden">
        <section className="pt-8 sm:pt-12 md:pt-20 pb-12 sm:pb-16 md:pb-24 px-4 sm:px-6 max-w-7xl mx-auto w-full overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-12">
            <div className="lg:col-span-3 space-y-5 sm:space-y-6 md:space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="space-y-4 sm:space-y-5 md:space-y-6"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-gradient-to-r from-primary/15 to-emerald-500/10 border border-primary/30 text-xs sm:text-sm font-semibold text-primary shadow-[0_0_20px_rgba(34,197,94,0.15)]">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
                    </span>
                    <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>{t("landing.hero.badge")}</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-xs font-medium text-amber-400">
                    <Star className="w-3 h-3" />
                    <span>v4.5</span>
                  </div>
                </div>

                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-white leading-[1.15] sm:leading-[1.1] overflow-hidden">
                  {t("landing.hero.title")} <br />
                  <span className="gradient-text-animated overflow-hidden">
                    {t("landing.hero.titleHighlight")}
                  </span>
                </h1>

                <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-xl leading-relaxed overflow-hidden">
                  {t("landing.hero.description")}
                </p>

                <div className="flex flex-col sm:flex-row flex-wrap gap-3 pt-3">
                  <Link href="/login">
                    <Button 
                      size="lg"
                      className="w-full sm:w-auto text-sm sm:text-base px-6 sm:px-8 h-12 sm:h-14 group bg-gradient-to-r from-primary to-emerald-400 text-black font-bold shadow-[0_0_30px_rgba(34,197,94,0.35)] hover:shadow-[0_0_50px_rgba(34,197,94,0.5)] hover:scale-[1.03] transition-all duration-300 rounded-xl"
                      data-testid="button-web-dashboard"
                    >
                      <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      {t("landing.cta.webDashboard")}
                      <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <a 
                    href="https://t.me/DarkShare1Bot" 
                    target="_blank" 
                    rel="noreferrer"
                  >
                    <Button 
                      variant="outline"
                      size="lg"
                      className="w-full sm:w-auto text-sm sm:text-base px-6 sm:px-8 h-12 sm:h-14 group border-white/15 bg-white/[0.04] hover:bg-white/[0.08] hover:border-primary/40 hover:shadow-[0_0_30px_rgba(34,197,94,0.15)] hover:scale-[1.03] transition-all duration-300 rounded-xl"
                      data-testid="button-launch-bot"
                    >
                      <SiTelegram className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-[#229ED9]" />
                      {t("landing.cta.telegramBot")}
                      <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </a>
                  <Link href="/download">
                    <Button 
                      size="lg"
                      className="w-full sm:w-auto text-sm sm:text-base px-6 sm:px-8 h-12 sm:h-14 group bg-gradient-to-r from-emerald-600 to-green-500 text-white font-bold border-none hover:scale-[1.03] transition-all duration-300 shadow-[0_4px_20px_rgba(16,185,129,0.3)] rounded-xl"
                      data-testid="button-download-apk"
                    >
                      <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      {lang === "uk" ? "Встановити додаток" : lang === "ru" ? "Установить приложение" : lang === "es" ? "Instalar app" : lang === "de" ? "App installieren" : "Install App"}
                      <Download className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
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
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>
                      {lang === "uk" ? "17 типів перевірок" : lang === "ru" ? "17 типов проверок" : lang === "es" ? "17 tipos de análisis" : lang === "de" ? "17 Prüfungsarten" : "17 check types"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <div className="flex -space-x-2">
                    {["🧑", "👩", "🧔", "👨"].map((emoji, i) => (
                      <div key={i} className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center text-xs">
                        {emoji}
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <span className="text-white font-semibold">2,800+</span>{" "}
                    {lang === "uk" ? "активних користувачів" : lang === "ru" ? "активных пользователей" : lang === "es" ? "usuarios activos" : lang === "de" ? "aktive Nutzer" : "active users"}
                  </div>
                </div>

                <QuickCheck lang={lang} />
              </motion.div>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                <Card className="premium-card backdrop-blur-sm p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <Activity className="w-4 h-4 text-primary" />
                      {t("landing.activity")}
                    </h3>
                    <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1.5">
                      <span className="glow-dot animate-pulse" />
                      {lang === "uk" ? "Реал-тайм" : lang === "ru" ? "Реал-тайм" : lang === "es" ? "Tiempo Real" : lang === "de" ? "Echtzeit" : "Real-time"}
                    </span>
                  </div>
                  <div className="space-y-2 max-h-[180px] overflow-hidden">
                    {activity?.slice(0, 4).map((item, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-colors"
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
                <Card className="premium-card backdrop-blur-sm p-4 sm:p-5">
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
                        className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-colors"
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

        <section className="py-8 sm:py-10 md:py-14 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Card className="relative bg-gradient-to-br from-[#1a1012] to-[#120a0c] border-red-500/15 p-5 sm:p-6 md:p-8 overflow-visible rounded-2xl shadow-2xl shadow-red-500/5">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-red-500/5 via-orange-500/5 to-red-500/5 pointer-events-none" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />

                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-5 sm:mb-6">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 animate-pulse" />
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-white tracking-wide uppercase">
                      {t("landing.todayDetected.title")}
                    </h3>
                    <span className="ml-auto text-[10px] text-red-400/60 font-mono flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      LIVE
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-5 sm:mb-6">
                    <div className="flex items-center gap-3 p-3 sm:p-4 rounded-lg bg-white/5 border border-white/5">
                      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                        <Wallet className="w-5 h-5 text-red-400" />
                      </div>
                      <div>
                        <div className="text-xl sm:text-2xl font-bold text-red-400">
                          <AnimatedNumber value={4} duration={1500} />
                        </div>
                        <div className="text-[11px] sm:text-xs text-muted-foreground leading-tight">
                          {t("landing.todayDetected.walletsHighRisk")}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 sm:p-4 rounded-lg bg-white/5 border border-white/5">
                      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
                        <Globe className="w-5 h-5 text-orange-400" />
                      </div>
                      <div>
                        <div className="text-xl sm:text-2xl font-bold text-orange-400">
                          <AnimatedNumber value={2} duration={1500} />
                        </div>
                        <div className="text-[11px] sm:text-xs text-muted-foreground leading-tight">
                          {t("landing.todayDetected.domainsComplaints")}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 sm:p-4 rounded-lg bg-white/5 border border-white/5">
                      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center flex-shrink-0">
                        <Phone className="w-5 h-5 text-yellow-400" />
                      </div>
                      <div>
                        <div className="text-xl sm:text-2xl font-bold text-yellow-400">
                          <AnimatedNumber value={1} duration={1500} />
                        </div>
                        <div className="text-[11px] sm:text-xs text-muted-foreground leading-tight">
                          {t("landing.todayDetected.phonesMatches")}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <Link href="/login">
                      <Button
                        size="sm"
                        className="bg-red-500/90 hover:bg-red-500 border-red-400/30 text-white no-default-hover-elevate"
                        data-testid="button-today-detected-cta"
                      >
                        <ShieldCheck className="w-4 h-4 mr-1.5" />
                        {t("landing.todayDetected.cta")}
                        <ChevronRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </section>

        <section className="py-10 sm:py-14 md:py-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] via-transparent to-transparent pointer-events-none" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full overflow-hidden relative">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
              {[
                { 
                  icon: <Users className="w-5 h-5 text-primary" />, 
                  value: stats?.totalUsers ?? 2853, 
                  label: t("landing.stats.users"), 
                  loading: statsLoading,
                  color: "text-primary",
                  bg: "from-primary/10 to-primary/5",
                  border: "border-primary/20"
                },
                { 
                  icon: <Eye className="w-5 h-5 text-cyan-400" />, 
                  value: stats?.activeWatches ?? 160, 
                  label: t("landing.stats.monitors"), 
                  loading: statsLoading,
                  color: "text-cyan-400",
                  bg: "from-cyan-500/10 to-cyan-500/5",
                  border: "border-cyan-500/20"
                },
                { 
                  icon: <AlertTriangle className="w-5 h-5 text-orange-400" />, 
                  value: stats?.threatsBlocked ?? 3895, 
                  label: t("landing.stats.threats"), 
                  loading: statsLoading,
                  color: "text-orange-400",
                  bg: "from-orange-500/10 to-orange-500/5",
                  border: "border-orange-500/20"
                },
                { 
                  icon: <TrendingUp className="w-5 h-5 text-emerald-400" />, 
                  value: stats?.checksToday ?? 53, 
                  label: t("landing.stats.today"), 
                  loading: statsLoading,
                  color: "text-emerald-400",
                  bg: "from-emerald-500/10 to-emerald-500/5",
                  border: "border-emerald-500/20"
                }
              ].map((stat, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1, duration: 0.5 }}
                  className="stats-card text-center space-y-3 group"
                >
                  {stat.loading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Skeleton className="h-8 sm:h-10 md:h-12 w-24 sm:w-28 skeleton-shimmer" />
                      <Skeleton className="h-3 sm:h-4 w-16 skeleton-shimmer" />
                    </div>
                  ) : (
                    <>
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.bg} border ${stat.border} flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300`}>
                        {stat.icon}
                      </div>
                      <div className={`text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight ${stat.color}`}>
                        <AnimatedNumber value={stat.value} />
                      </div>
                      <div className="text-[11px] sm:text-xs md:text-sm text-muted-foreground">
                        {stat.label}
                      </div>
                    </>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-10 sm:py-14 md:py-16 relative" data-testid="section-when-to-use">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent pointer-events-none" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-8 sm:mb-10 space-y-2 sm:space-y-3"
            >
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary">
                <ShieldAlert className="w-3 h-3" />
                {lang === "uk" ? "Навіщо це потрібно" : lang === "ru" ? "Зачем это нужно" : lang === "es" ? "¿Por qué lo necesitas?" : lang === "de" ? "Warum brauchen Sie das?" : "Why You Need This"}
              </span>
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold px-2">
                {lang === "uk" ? "Перевіряй перед тим, як довіряти" : lang === "ru" ? "Проверяй, прежде чем доверять" : lang === "es" ? "Verifica antes de confiar" : lang === "de" ? "Prüfe, bevor du vertraust" : "Check Before You Trust"}
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  icon: <Wallet className="w-6 h-6" />,
                  color: "from-orange-500/20 to-orange-500/5 border-orange-500/20",
                  iconColor: "text-orange-400",
                  title: lang === "uk" ? "Переказ крипти" : lang === "ru" ? "Перевод крипты" : lang === "es" ? "Transferir cripto" : lang === "de" ? "Krypto senden" : "Sending Crypto",
                  desc: lang === "uk"
                    ? "Перед тим як відправити гроші — перевір адресу гаманця. Чи не пов'язаний він з шахрайством або міксерами?"
                    : lang === "ru"
                    ? "Перед отправкой денег — проверь адрес кошелька. Не связан ли он с мошенничеством или миксерами?"
                    : lang === "es"
                    ? "Antes de enviar dinero, verifica la dirección. ¿Está vinculada a fraude o mixers?"
                    : lang === "de"
                    ? "Vor dem Senden — prüfe die Wallet-Adresse. Ist sie mit Betrug oder Mixern verbunden?"
                    : "Before sending money — check the wallet address. Is it linked to scams or mixers?",
                  cta: lang === "uk" ? "Вставь адресу → дізнайся ризик" : lang === "ru" ? "Вставь адрес → узнай риск" : "Paste address → get risk score"
                },
                {
                  icon: <Globe className="w-6 h-6" />,
                  color: "from-blue-500/20 to-blue-500/5 border-blue-500/20",
                  iconColor: "text-blue-400",
                  title: lang === "uk" ? "Підозріле посилання" : lang === "ru" ? "Подозрительная ссылка" : lang === "es" ? "Enlace sospechoso" : lang === "de" ? "Verdächtiger Link" : "Suspicious Link",
                  desc: lang === "uk"
                    ? "Отримав посилання в чаті чи по email? Перевір його на фішинг і шкідливий контент за секунди."
                    : lang === "ru"
                    ? "Получил ссылку в чате или по email? Проверь её на фишинг и вредоносный контент за секунды."
                    : lang === "es"
                    ? "¿Recibiste un enlace en chat o email? Verifica phishing y malware en segundos."
                    : lang === "de"
                    ? "Einen Link im Chat oder per E-Mail erhalten? Prüfe ihn in Sekunden auf Phishing und Malware."
                    : "Got a link via chat or email? Check it for phishing and malware in seconds.",
                  cta: lang === "uk" ? "Вставь URL → миттєва перевірка" : lang === "ru" ? "Вставь URL → мгновенная проверка" : "Paste URL → instant check"
                },
                {
                  icon: <Handshake className="w-6 h-6" />,
                  color: "from-green-500/20 to-green-500/5 border-green-500/20",
                  iconColor: "text-green-400",
                  title: lang === "uk" ? "Новий партнер" : lang === "ru" ? "Новый партнёр" : lang === "es" ? "Nuevo socio" : lang === "de" ? "Neuer Partner" : "New Partner",
                  desc: lang === "uk"
                    ? "Перевір email або телефон нового контрагента. Чи немає витоків даних, шахрайства або підозрілих зв'язків?"
                    : lang === "ru"
                    ? "Проверь email или телефон контрагента. Нет ли утечек данных, мошенничества или подозрительных связей?"
                    : lang === "es"
                    ? "Verifica el email o teléfono del socio. ¿Hay filtraciones, fraude o conexiones sospechosas?"
                    : lang === "de"
                    ? "Prüfe die E-Mail oder Telefonnummer des Partners. Gibt es Datenlecks, Betrug oder verdächtige Verbindungen?"
                    : "Check a partner's email or phone. Any data breaches, fraud, or suspicious connections?",
                  cta: lang === "uk" ? "Вставь email → повний звіт" : lang === "ru" ? "Вставь email → полный отчёт" : "Paste email → full report"
                },
                {
                  icon: <ShoppingBag className="w-6 h-6" />,
                  color: "from-purple-500/20 to-purple-500/5 border-purple-500/20",
                  iconColor: "text-purple-400",
                  title: lang === "uk" ? "Інвестиція / покупка" : lang === "ru" ? "Инвестиция / покупка" : lang === "es" ? "Inversión / compra" : lang === "de" ? "Investition / Kauf" : "Investment / Purchase",
                  desc: lang === "uk"
                    ? "Перед вкладенням грошей — перевір домен проєкту, IP-адресу сервера або гаманець засновника на ризики."
                    : lang === "ru"
                    ? "Перед вложением денег — проверь домен проекта, IP-адрес сервера или кошелёк основателя на риски."
                    : lang === "es"
                    ? "Antes de invertir, verifica el dominio del proyecto, la IP del servidor o la billetera del fundador."
                    : lang === "de"
                    ? "Vor der Investition — prüfe die Projekt-Domain, Server-IP oder Gründer-Wallet auf Risiken."
                    : "Before investing — check the project domain, server IP, or founder's wallet for risks.",
                  cta: lang === "uk" ? "Вставь домен → аналіз загроз" : lang === "ru" ? "Вставь домен → анализ угроз" : "Paste domain → threat analysis"
                }
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1, duration: 0.4 }}
                  data-testid={`card-use-case-${idx}`}
                >
                  <Card className={`h-full bg-gradient-to-b ${item.color} backdrop-blur-sm p-5 sm:p-6 flex flex-col hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}>
                    <div className={`w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 ${item.iconColor} shadow-lg`}>
                      {item.icon}
                    </div>
                    <h3 className="font-bold text-base mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4 flex-1">{item.desc}</p>
                    <div className="text-xs font-mono text-primary bg-primary/5 rounded-lg px-3 py-2.5 border border-primary/15 flex items-center gap-1.5">
                      <ChevronRight className="w-3 h-3 flex-shrink-0" />
                      {item.cta}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-10 sm:py-14 md:py-16 relative" data-testid="section-demo-result">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-8 sm:mb-10 space-y-2 sm:space-y-3"
            >
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-xs font-medium text-orange-400">
                <FileText className="w-3 h-3" />
                {lang === "uk" ? "Приклад звіту" : lang === "ru" ? "Пример отчёта" : lang === "es" ? "Informe de ejemplo" : lang === "de" ? "Beispielbericht" : "Example Report"}
              </span>
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold px-2">
                {lang === "uk" ? "Як виглядає результат аналізу" : lang === "ru" ? "Как выглядит результат анализа" : lang === "es" ? "Cómo se ve un resultado de análisis" : lang === "de" ? "So sieht ein Analyseergebnis aus" : "What an Analysis Result Looks Like"}
              </h2>
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground max-w-2xl mx-auto px-2">
                {lang === "uk"
                  ? "Реальний приклад перевірки криптогаманця з оцінкою ризику та детальними знахідками"
                  : lang === "ru"
                  ? "Реальный пример проверки криптокошелька с оценкой риска и детальными находками"
                  : lang === "es"
                  ? "Ejemplo real de verificación de billetera cripto con puntuación de riesgo y hallazgos detallados"
                  : lang === "de"
                  ? "Reales Beispiel einer Krypto-Wallet-Prüfung mit Risikobewertung und detaillierten Ergebnissen"
                  : "Real example of a crypto wallet check with risk scoring and detailed findings"}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="max-w-2xl mx-auto"
            >
              <Card className="premium-card backdrop-blur-sm overflow-visible">
                <div className="p-4 sm:p-6 space-y-5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/25 flex-shrink-0 shadow-lg shadow-orange-500/10">
                        <Wallet className="w-5 h-5 text-orange-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs text-muted-foreground">
                          {lang === "uk" ? "Криптогаманець" : lang === "ru" ? "Криптокошелёк" : lang === "es" ? "Billetera cripto" : lang === "de" ? "Krypto-Wallet" : "Crypto Wallet"}
                        </div>
                        <div className="font-mono text-sm text-white truncate">0x742d...a4F8</div>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/15 border border-orange-500/25 text-xs font-bold text-orange-400 flex-shrink-0">
                      <AlertTriangle className="w-3 h-3" />
                      HIGH RISK
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{lang === "uk" ? "Оцінка ризику" : lang === "ru" ? "Оценка риска" : lang === "es" ? "Puntuación de riesgo" : lang === "de" ? "Risikobewertung" : "Risk Score"}</span>
                      <span className="font-bold text-orange-400">78 / 100</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-white/5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: "78%" }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                        className="h-full rounded-full bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500"
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>{lang === "uk" ? "Безпечно" : lang === "ru" ? "Безопасно" : lang === "es" ? "Seguro" : lang === "de" ? "Sicher" : "Safe"}</span>
                      <span>{lang === "uk" ? "Критичний" : lang === "ru" ? "Критический" : lang === "es" ? "Crítico" : lang === "de" ? "Kritisch" : "Critical"}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {lang === "uk" ? "Знахідки" : lang === "ru" ? "Находки" : lang === "es" ? "Hallazgos" : lang === "de" ? "Ergebnisse" : "Findings"}
                    </h4>
                    <div className="space-y-1.5">
                      {[
                        {
                          icon: <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />,
                          text: lang === "uk" ? "Адреса пов'язана з відомим міксером Tornado Cash" : lang === "ru" ? "Адрес связан с известным миксером Tornado Cash" : lang === "es" ? "Dirección vinculada al mixer conocido Tornado Cash" : lang === "de" ? "Adresse mit bekanntem Mixer Tornado Cash verknüpft" : "Address linked to known mixer Tornado Cash",
                          color: "text-red-400"
                        },
                        {
                          icon: <AlertTriangle className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />,
                          text: lang === "uk" ? "Виявлено 3 транзакції з підсанкційними гаманцями" : lang === "ru" ? "Обнаружено 3 транзакции с подсанкционными кошельками" : lang === "es" ? "Se detectaron 3 transacciones con billeteras sancionadas" : lang === "de" ? "3 Transaktionen mit sanktionierten Wallets erkannt" : "3 transactions with sanctioned wallets detected",
                          color: "text-orange-400"
                        },
                        {
                          icon: <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />,
                          text: lang === "uk" ? "Підозрілий патерн: висока частота малих переказів" : lang === "ru" ? "Подозрительный паттерн: высокая частота малых переводов" : lang === "es" ? "Patrón sospechoso: alta frecuencia de transferencias pequeñas" : lang === "de" ? "Verdächtiges Muster: hohe Frequenz kleiner Überweisungen" : "Suspicious pattern: high frequency of small transfers",
                          color: "text-yellow-400"
                        },
                        {
                          icon: <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />,
                          text: lang === "uk" ? "Валідний формат адреси Ethereum (ERC-20)" : lang === "ru" ? "Валидный формат адреса Ethereum (ERC-20)" : lang === "es" ? "Formato de dirección Ethereum válido (ERC-20)" : lang === "de" ? "Gültiges Ethereum-Adressformat (ERC-20)" : "Valid Ethereum address format (ERC-20)",
                          color: "text-green-400"
                        }
                      ].map((finding, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.4 + idx * 0.1 }}
                          className="flex items-start gap-2 p-2.5 rounded-lg bg-white/5 border border-white/5"
                        >
                          {finding.icon}
                          <span className={`text-xs leading-relaxed ${finding.color}`}>{finding.text}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-2.5 rounded-lg bg-white/5 border border-white/5">
                      <div className="text-lg font-bold text-white">47</div>
                      <div className="text-[10px] text-muted-foreground">{lang === "uk" ? "Транзакцій" : lang === "ru" ? "Транзакций" : lang === "es" ? "Transacciones" : lang === "de" ? "Transaktionen" : "Transactions"}</div>
                    </div>
                    <div className="text-center p-2.5 rounded-lg bg-white/5 border border-white/5">
                      <div className="text-lg font-bold text-white">5</div>
                      <div className="text-[10px] text-muted-foreground">{lang === "uk" ? "API джерел" : lang === "ru" ? "API источников" : lang === "es" ? "Fuentes API" : lang === "de" ? "API-Quellen" : "API Sources"}</div>
                    </div>
                    <div className="text-center p-2.5 rounded-lg bg-white/5 border border-white/5">
                      <div className="text-lg font-bold text-white">2.4s</div>
                      <div className="text-[10px] text-muted-foreground">{lang === "uk" ? "Час аналізу" : lang === "ru" ? "Время анализа" : lang === "es" ? "Tiempo de análisis" : lang === "de" ? "Analysezeit" : "Analysis Time"}</div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    <Link href="/login" className="flex-1">
                      <Button className="w-full" data-testid="button-demo-try-now">
                        <ShieldCheck className="w-4 h-4 mr-2" />
                        {lang === "uk" ? "Перевірити зараз" : lang === "ru" ? "Проверить сейчас" : lang === "es" ? "Verificar ahora" : lang === "de" ? "Jetzt prüfen" : "Check Now"}
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </section>

        <section className="py-8 sm:py-10 md:py-12 section-divider">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-8 sm:mb-10 space-y-2 sm:space-y-3"
            >
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary">
                <Zap className="w-3 h-3" />
                {lang === "uk" ? "Як це працює" : lang === "ru" ? "Как это работает" : lang === "es" ? "Cómo funciona" : lang === "de" ? "So funktioniert's" : "How it Works"}
              </span>
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold px-2">
                {lang === "uk" ? "Почніть за 3 простих кроки" : lang === "ru" ? "Начните за 3 простых шага" : lang === "es" ? "Comienza en 3 simples pasos" : lang === "de" ? "Starten Sie in 3 einfachen Schritten" : "Start in 3 Simple Steps"}
              </h2>
            </motion.div>

            <div className="relative grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              <div className="hidden md:block absolute top-1/2 left-[20%] right-[20%] h-px bg-gradient-to-r from-primary/30 via-primary/20 to-primary/30 -translate-y-1/2 z-0" />

              {[
                {
                  icon: <Search className="w-5 h-5" />,
                  num: "01",
                  title: lang === "uk" ? "Введіть ціль" : lang === "ru" ? "Введите цель" : lang === "es" ? "Ingrese el objetivo" : lang === "de" ? "Ziel eingeben" : "Enter Target",
                  desc: lang === "uk" ? "Введіть IP, гаманець, домен, email або будь-яку іншу ціль для аналізу" : lang === "ru" ? "Введите IP, кошелёк, домен, email или любую другую цель для анализа" : lang === "es" ? "Escriba una IP, billetera, dominio, email o cualquier otro objetivo para analizar" : lang === "de" ? "Geben Sie eine IP, Wallet, Domain, E-Mail oder ein anderes Ziel zur Analyse ein" : "Type an IP, wallet, domain, email or any other target for analysis"
                },
                {
                  icon: <Scan className="w-5 h-5" />,
                  num: "02",
                  title: lang === "uk" ? "AI Аналіз" : lang === "ru" ? "AI Анализ" : lang === "es" ? "Análisis con IA" : lang === "de" ? "KI-Analyse" : "AI Analysis",
                  desc: lang === "uk" ? "Наша система опитує 15+ API безпеки, а ШІ генерує комплексну оцінку ризиків" : lang === "ru" ? "Наша система запрашивает 15+ API безопасности, а ИИ генерирует комплексную оценку рисков" : lang === "es" ? "Nuestro sistema consulta más de 15 APIs de seguridad y la IA genera una evaluación integral de riesgos" : lang === "de" ? "Unser System fragt 15+ Sicherheits-APIs ab und die KI erstellt eine umfassende Risikobewertung" : "Our system queries 15+ security APIs and AI generates a comprehensive risk assessment"
                },
                {
                  icon: <FileText className="w-5 h-5" />,
                  num: "03",
                  title: lang === "uk" ? "Отримайте звіт" : lang === "ru" ? "Получите отчёт" : lang === "es" ? "Obtenga el informe" : lang === "de" ? "Bericht erhalten" : "Get Report",
                  desc: lang === "uk" ? "Отримайте детальні результати з оцінкою ризику, рекомендаціями та PDF для завантаження" : lang === "ru" ? "Получите детальные результаты с оценкой риска, рекомендациями и загружаемым PDF" : lang === "es" ? "Reciba hallazgos detallados con puntuación de riesgo, recomendaciones y PDF descargable" : lang === "de" ? "Erhalten Sie detaillierte Ergebnisse mit Risikobewertung, Empfehlungen und herunterladbarem PDF" : "Receive detailed findings with risk score, recommendations and downloadable PDF"
                }
              ].map((step, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.15, duration: 0.5 }}
                  className="relative z-10 p-4 sm:p-5 md:p-6 rounded-xl premium-card"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                      {step.icon}
                    </div>
                    <div className="step-badge">{step.num}</div>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold mb-1.5">{step.title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-10 sm:py-14 md:py-16 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-orange-500/[0.02] to-transparent pointer-events-none" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-8 sm:mb-10 space-y-2 sm:space-y-3"
            >
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-xs font-medium text-orange-400">
                <ShieldAlert className="w-3 h-3" />
                {t("landing.whenToUse.badge")}
              </span>
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold px-2">
                {t("landing.whenToUse.title")}
              </h2>
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground max-w-2xl mx-auto px-2">
                {t("landing.whenToUse.subtitle")}
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6" data-testid="when-to-use-section">
              {[
                {
                  icon: <Wallet className="w-5 h-5" />,
                  title: t("landing.whenToUse.cryptoTitle"),
                  desc: t("landing.whenToUse.cryptoDesc"),
                  accent: "text-orange-400",
                  bg: "bg-orange-500/10",
                  border: "border-orange-500/20"
                },
                {
                  icon: <ShoppingBag className="w-5 h-5" />,
                  title: t("landing.whenToUse.telegramTitle"),
                  desc: t("landing.whenToUse.telegramDesc"),
                  accent: "text-blue-400",
                  bg: "bg-blue-500/10",
                  border: "border-blue-500/20"
                },
                {
                  icon: <TrendingUp className="w-5 h-5" />,
                  title: t("landing.whenToUse.investTitle"),
                  desc: t("landing.whenToUse.investDesc"),
                  accent: "text-yellow-400",
                  bg: "bg-yellow-500/10",
                  border: "border-yellow-500/20"
                },
                {
                  icon: <Handshake className="w-5 h-5" />,
                  title: t("landing.whenToUse.partnerTitle"),
                  desc: t("landing.whenToUse.partnerDesc"),
                  accent: "text-green-400",
                  bg: "bg-green-500/10",
                  border: "border-green-500/20"
                }
              ].map((card, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1, duration: 0.5 }}
                  data-testid={`card-when-to-use-${idx}`}
                >
                  <Card className="p-4 sm:p-5 md:p-6 premium-card h-full">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className={`w-11 h-11 rounded-xl ${card.bg} flex items-center justify-center ${card.accent} border ${card.border} flex-shrink-0 shadow-lg`}>
                        {card.icon}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm sm:text-base font-bold mb-1.5">{card.title}</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{card.desc}</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-10 sm:py-14 md:py-16 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-8 sm:mb-10 space-y-2 sm:space-y-3"
            >
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary">
                <Users className="w-3 h-3" />
                {lang === "uk" ? "Сценарії використання" : lang === "ru" ? "Сценарии использования" : lang === "es" ? "Casos de uso" : lang === "de" ? "Anwendungsfälle" : "Use Cases"}
              </span>
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold px-2">
                {lang === "uk" ? "Для будь-яких потреб безпеки" : lang === "ru" ? "Для любых потребностей безопасности" : lang === "es" ? "Para cada necesidad de seguridad" : lang === "de" ? "Für jeden Sicherheitsbedarf" : "Built for Every Security Need"}
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {[
                {
                  icon: <TrendingUp className="w-5 h-5" />,
                  title: lang === "uk" ? "Бізнес та корпорації" : lang === "ru" ? "Бизнес и корпорации" : lang === "es" ? "Empresas y corporaciones" : lang === "de" ? "Unternehmen & Konzerne" : "Business & Enterprise",
                  desc: lang === "uk" ? "Перевіряйте партнерів, аналізуйте домени постачальників, захищайтеся від шахрайства та витоків даних" : lang === "ru" ? "Проверяйте партнёров, анализируйте домены поставщиков, защищайтесь от мошенничества и утечек данных" : lang === "es" ? "Verifique socios, compruebe dominios de proveedores, protéjase contra fraudes y filtraciones de datos" : lang === "de" ? "Überprüfen Sie Partner, prüfen Sie Lieferanten-Domains, schützen Sie sich vor Betrug und Datenlecks" : "Verify partners, check supplier domains, protect against fraud and data breaches"
                },
                {
                  icon: <Wallet className="w-5 h-5" />,
                  title: lang === "uk" ? "Криптоінвестори та трейдери" : lang === "ru" ? "Криптоинвесторы и трейдеры" : lang === "es" ? "Inversores y traders de cripto" : lang === "de" ? "Krypto-Investoren & Trader" : "Crypto Investors & Traders",
                  desc: lang === "uk" ? "Аналізуйте гаманці перед транзакціями, виявляйте міксери, перевіряйте санкційні списки" : lang === "ru" ? "Анализируйте кошельки перед транзакциями, выявляйте миксеры, проверяйте санкционные списки" : lang === "es" ? "Analice billeteras antes de transacciones, detecte el uso de mixers, verifique sanciones" : lang === "de" ? "Analysieren Sie Wallets vor Transaktionen, erkennen Sie Mixer-Nutzung, prüfen Sie Sanktionslisten" : "Analyze wallets before transactions, detect mixer usage, check for sanctions"
                },
                {
                  icon: <Terminal className="w-5 h-5" />,
                  title: lang === "uk" ? "IT та DevOps команди" : lang === "ru" ? "IT и DevOps команды" : lang === "es" ? "Equipos de IT y DevOps" : lang === "de" ? "IT- & DevOps-Teams" : "IT & DevOps Teams",
                  desc: lang === "uk" ? "Моніторте IP інфраструктури, скануйте домени на проблеми SSL, відстежуйте CVE вразливості" : lang === "ru" ? "Мониторьте IP инфраструктуры, сканируйте домены на проблемы SSL, отслеживайте CVE уязвимости" : lang === "es" ? "Monitoree IPs de infraestructura, escanee dominios en busca de problemas SSL, rastree vulnerabilidades CVE" : lang === "de" ? "Überwachen Sie Infrastruktur-IPs, scannen Sie Domains auf SSL-Probleme, verfolgen Sie CVE-Schwachstellen" : "Monitor infrastructure IPs, scan domains for SSL issues, track CVE vulnerabilities"
                },
                {
                  icon: <Shield className="w-5 h-5" />,
                  title: lang === "uk" ? "Дослідники безпеки" : lang === "ru" ? "Исследователи безопасности" : lang === "es" ? "Investigadores de seguridad" : lang === "de" ? "Sicherheitsforscher" : "Security Researchers",
                  desc: lang === "uk" ? "Глибокі OSINT розслідування, аналіз хешів шкідливого ПЗ, відстеження username на різних платформах" : lang === "ru" ? "Глубокие OSINT расследования, анализ хешей вредоносного ПО, отслеживание username на разных платформах" : lang === "es" ? "Investigaciones OSINT profundas, análisis de hashes de malware, rastreo de nombres de usuario en múltiples plataformas" : lang === "de" ? "Tiefgehende OSINT-Ermittlungen, Malware-Hash-Analyse, Benutzernamen-Tracking über Plattformen hinweg" : "Deep OSINT investigations, malware hash analysis, username tracking across platforms"
                }
              ].map((card, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1, duration: 0.5 }}
                >
                  <Card className="p-4 sm:p-5 md:p-6 premium-card h-full">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center text-primary border border-primary/25 mb-3 shadow-lg shadow-primary/5">
                      {card.icon}
                    </div>
                    <h3 className="text-sm sm:text-base font-bold mb-1.5">{card.title}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{card.desc}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-10 sm:py-14 md:py-16 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.02] via-transparent to-transparent pointer-events-none" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-8 sm:mb-10 space-y-2 sm:space-y-3"
            >
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary">
                <Lock className="w-3 h-3" />
                {lang === "uk" ? "Довіра та безпека" : lang === "ru" ? "Доверие и безопасность" : lang === "es" ? "Confianza y seguridad" : lang === "de" ? "Vertrauen & Sicherheit" : "Trust & Security"}
              </span>
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold px-2">
                {lang === "uk" ? "Ваша безпека — наш пріоритет" : lang === "ru" ? "Ваша безопасность — наш приоритет" : lang === "es" ? "Su seguridad es nuestra prioridad" : lang === "de" ? "Ihre Sicherheit ist unsere Priorität" : "Your Security is Our Priority"}
              </h2>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {[
                {
                  icon: <Lock className="w-5 h-5" />,
                  title: lang === "uk" ? "Конфіденційність даних" : lang === "ru" ? "Конфиденциальность данных" : lang === "es" ? "Privacidad de datos" : lang === "de" ? "Datenschutz" : "Data Privacy",
                  desc: lang === "uk" ? "Ваші запити зашифровані і ніколи не передаються третім сторонам" : lang === "ru" ? "Ваши запросы зашифрованы и никогда не передаются третьим лицам" : lang === "es" ? "Sus búsquedas están cifradas y nunca se comparten con terceros" : lang === "de" ? "Ihre Suchanfragen sind verschlüsselt und werden nie an Dritte weitergegeben" : "Your searches are encrypted and never shared with third parties"
                },
                {
                  icon: <Zap className="w-5 h-5" />,
                  title: lang === "uk" ? "Миттєвий аналіз" : lang === "ru" ? "Мгновенный анализ" : lang === "es" ? "Análisis instantáneo" : lang === "de" ? "Sofortige Analyse" : "Instant Analysis",
                  desc: lang === "uk" ? "Результати за секунди завдяки підключенню до баз даних безпеки в реальному часі" : lang === "ru" ? "Результаты за секунды благодаря подключению к базам данных безопасности в реальном времени" : lang === "es" ? "Resultados en segundos mediante conexiones API en tiempo real a bases de datos de seguridad" : lang === "de" ? "Ergebnisse in Sekunden dank Echtzeit-API-Verbindungen zu Sicherheitsdatenbanken" : "Results in seconds using real-time API connections to security databases"
                },
                {
                  icon: <Shield className="w-5 h-5" />,
                  title: lang === "uk" ? "Перевірені джерела" : lang === "ru" ? "Проверенные источники" : lang === "es" ? "Fuentes verificadas" : lang === "de" ? "Verifizierte Quellen" : "Verified Sources",
                  desc: lang === "uk" ? "Дані з 15+ перевірених API безпеки, включаючи Shodan, VirusTotal, NVD" : lang === "ru" ? "Данные из 15+ проверенных API безопасности, включая Shodan, VirusTotal, NVD" : lang === "es" ? "Datos de más de 15 APIs de seguridad confiables, incluyendo Shodan, VirusTotal y NVD" : lang === "de" ? "Daten aus 15+ vertrauenswürdigen Sicherheits-APIs, darunter Shodan, VirusTotal und NVD" : "Data from 15+ trusted security APIs including Shodan, VirusTotal, NVD"
                },
                {
                  icon: <Gift className="w-5 h-5" />,
                  title: lang === "uk" ? "Безкоштовний старт" : lang === "ru" ? "Бесплатный старт" : lang === "es" ? "Empiece gratis" : lang === "de" ? "Kostenlos starten" : "Free to Start",
                  desc: lang === "uk" ? "5 безкоштовних перевірок щодня, кредитна картка не потрібна" : lang === "ru" ? "5 бесплатных проверок ежедневно, кредитная карта не требуется" : lang === "es" ? "5 verificaciones gratuitas diarias, no se requiere tarjeta de crédito" : lang === "de" ? "5 kostenlose Prüfungen täglich, keine Kreditkarte erforderlich" : "5 free checks daily, no credit card required to begin"
                }
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1, duration: 0.5 }}
                  className="text-center p-4 sm:p-5 md:p-6 premium-card"
                >
                  <div className="w-11 h-11 mx-auto rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center text-primary border border-primary/25 mb-3 shadow-lg shadow-primary/5">
                    {item.icon}
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold mb-1.5">{item.title}</h3>
                  <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-10 sm:py-14 md:py-16 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-500/[0.015] to-transparent pointer-events-none" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full relative">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-8 sm:mb-10 space-y-2 sm:space-y-3"
            >
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-xs font-medium text-red-400">
                <AlertTriangle className="w-3 h-3" />
                {lang === "uk" ? "Загрози в Реальному Часі" : lang === "ru" ? "Угрозы в Реальном Времени" : lang === "es" ? "Amenazas en Tiempo Real" : lang === "de" ? "Echtzeit-Bedrohungen" : "Real-Time Threats"}
              </span>
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold px-2">
                {lang === "uk" ? "Стрічка Кіберзагроз" : lang === "ru" ? "Лента Киберугроз" : lang === "es" ? "Inteligencia de Amenazas en Vivo" : lang === "de" ? "Live-Bedrohungsinformationen" : "Live Threat Intelligence"}
              </h2>
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground max-w-2xl mx-auto px-2">
                {lang === "uk" 
                  ? "Моніторинг останніх CVE, malware кампаній та активних загроз з провідних джерел безпеки"
                  : lang === "ru"
                  ? "Мониторинг последних CVE, malware кампаний и активных угроз из ведущих источников безопасности"
                  : lang === "es"
                  ? "Monitoreo de los últimos CVE, campañas de malware y amenazas activas de fuentes de seguridad líderes"
                  : lang === "de"
                  ? "Überwachung der neuesten CVEs, Malware-Kampagnen und aktiver Bedrohungen aus führenden Sicherheitsquellen"
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

        <section className="py-8 sm:py-10 md:py-14 lg:py-16 section-divider">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-8 sm:mb-10 md:mb-14 space-y-2 sm:space-y-3"
            >
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary">
                <Terminal className="w-3 h-3" />
                {lang === "uk" ? "17 Модулів" : lang === "ru" ? "17 Модулей" : lang === "es" ? "17 Módulos" : lang === "de" ? "17 Module" : "17 Modules"}
              </span>
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold px-2">
                {lang === "uk" ? "Повний Арсенал OSINT" : lang === "ru" ? "Полный Арсенал OSINT" : lang === "es" ? "Arsenal OSINT Completo" : lang === "de" ? "Vollständiges OSINT-Arsenal" : "Complete OSINT Arsenal"}
              </h2>
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground max-w-2xl mx-auto px-2">
                {lang === "uk" 
                  ? "Кожен модуль інтегрований з провідними API для максимальної точності та актуальності даних"
                  : lang === "ru"
                  ? "Каждый модуль интегрирован с ведущими API для максимальной точности и актуальности данных"
                  : lang === "es"
                  ? "Cada módulo está integrado con APIs líderes para máxima precisión y relevancia de datos"
                  : lang === "de"
                  ? "Jedes Modul ist mit führenden APIs für maximale Genauigkeit und Datenrelevanz integriert"
                  : "Each module integrated with leading APIs for maximum accuracy and data relevance"}
              </p>
            </motion.div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
              {modules.map((module, idx) => (
                <ModuleCard 
                  key={idx}
                  icon={module.icon}
                  title={module.title}
                  description={module.description}
                  apis={module.apis}
                  delay={0.03 * idx}
                  onClick={() => setSelectedModule(idx)}
                />
              ))}
            </div>

            <Dialog open={selectedModule !== null} onOpenChange={(open) => { if (!open) setSelectedModule(null); }}>
              <DialogContent className="sm:max-w-md" data-testid="dialog-module-detail">
                {selectedModule !== null && (
                  <>
                    <DialogHeader>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                          <div className="w-6 h-6 flex items-center justify-center">
                            {modules[selectedModule].icon}
                          </div>
                        </div>
                        <DialogTitle className="text-lg font-bold">
                          {modules[selectedModule].title}
                        </DialogTitle>
                      </div>
                      <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
                        {modules[selectedModule].description}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 pt-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        {whatIsAnalyzed}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {modules[selectedModule].apis.map((api, i) => (
                          <span
                            key={i}
                            className="text-xs px-2.5 py-1 rounded-md bg-primary/10 text-primary font-mono"
                          >
                            {api}
                          </span>
                        ))}
                      </div>
                      <Link href="/login">
                        <Button className="w-full mt-3" data-testid="button-go-to-check">
                          <ChevronRight className="w-4 h-4 mr-2" />
                          {goToCheck}
                        </Button>
                      </Link>
                    </div>
                  </>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </section>

        <section className="py-10 sm:py-14 md:py-16 relative bg-gradient-to-b from-white/[0.015] via-transparent to-transparent">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-8 sm:mb-10 md:mb-12 space-y-2 sm:space-y-3"
            >
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary">
                <Server className="w-3 h-3" />
                {lang === "uk" ? "API Інтеграції" : lang === "ru" ? "API Интеграции" : lang === "es" ? "Integraciones API" : lang === "de" ? "API-Integrationen" : "API Integrations"}
              </span>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold px-2">
                {lang === "uk" ? "Джерела Даних" : lang === "ru" ? "Источники Данных" : lang === "es" ? "Fuentes de Datos" : lang === "de" ? "Datenquellen" : "Data Sources"}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto px-2">
                {lang === "uk" 
                  ? "Інтеграція з найкращими API безпеки для актуальних та достовірних даних"
                  : lang === "ru"
                  ? "Интеграция с лучшими API безопасности для актуальных и достоверных данных"
                  : lang === "es"
                  ? "Integración con las mejores APIs de seguridad para datos precisos y confiables"
                  : lang === "de"
                  ? "Integration mit führenden Sicherheits-APIs für genaue und zuverlässige Daten"
                  : "Integration with top security APIs for accurate and reliable data"}
              </p>
            </motion.div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 md:gap-6">
              {apiSources.map((source, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05 }}
                  className="group p-3 sm:p-4 md:p-5 rounded-xl premium-card text-center"
                >
                  <div className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-1.5 sm:mb-3 rounded-xl bg-gradient-to-br from-primary/10 to-cyan-500/5 flex items-center justify-center text-primary/70 border border-primary/15 group-hover:text-primary group-hover:border-primary/30 transition-all duration-300">
                    <Database className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                  </div>
                  <h3 className="font-bold text-[10px] sm:text-sm mb-0 sm:mb-1 group-hover:text-primary transition-colors line-clamp-1">{source.name}</h3>
                  <p className="hidden sm:block text-[10px] sm:text-[11px] text-muted-foreground leading-tight">{source.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-6 sm:py-8 md:py-10 max-w-5xl mx-auto px-3 sm:px-4 w-full">
          <div className="rounded-2xl overflow-hidden border border-white/[0.08] bg-[#080810] shadow-2xl shadow-primary/10">
            <div className="flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-white/[0.03] border-b border-white/[0.06]">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/70 shadow-sm shadow-red-500/30" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/70 shadow-sm shadow-yellow-500/30" />
                <div className="w-3 h-3 rounded-full bg-green-500/70 shadow-sm shadow-green-500/30" />
              </div>
              <div className="flex-1 text-center font-mono text-xs text-muted-foreground/70">darkshare_cli — v4.4</div>
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

        <section className="py-8 sm:py-10 md:py-12 section-divider bg-gradient-to-b from-transparent to-primary/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-8 sm:mb-10 space-y-2 sm:space-y-3"
            >
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary">
                <Trophy className="w-3 h-3" />
                {lang === "uk" ? "Кейси" : lang === "ru" ? "Кейсы" : lang === "es" ? "Casos de Éxito" : lang === "de" ? "Fallstudien" : "Case Studies"}
              </span>
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold px-2">
                {lang === "uk" ? "Реальні Історії Захисту" : lang === "ru" ? "Реальные Истории Защиты" : lang === "es" ? "Historias Reales de Protección" : lang === "de" ? "Echte Schutzgeschichten" : "Real Protection Stories"}
              </h2>
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground max-w-2xl mx-auto px-2">
                {lang === "uk"
                  ? "Як DARKSHARE допоміг користувачам уникнути фінансових втрат та кіберзагроз"
                  : lang === "ru"
                  ? "Как DARKSHARE помог пользователям избежать финансовых потерь и киберугроз"
                  : lang === "es"
                  ? "Cómo DARKSHARE ayudó a los usuarios a evitar pérdidas financieras y ciberamenazas"
                  : lang === "de"
                  ? "Wie DARKSHARE Nutzern half, finanzielle Verluste und Cyberbedrohungen zu vermeiden"
                  : "How DARKSHARE helped users avoid financial losses and cyber threats"}
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              {[
                {
                  icon: <Wallet className="w-5 h-5" />,
                  iconBg: "bg-red-500/10 border-red-500/20 text-red-400",
                  title: lang === "uk" ? "Запобігли крадіжці $50K" : lang === "ru" ? "Предотвратили кражу $50K" : lang === "es" ? "Evitaron robo de $50K" : lang === "de" ? "$50K Diebstahl verhindert" : "Prevented $50K Scam",
                  description: lang === "uk"
                    ? "Користувач перевірив криптогаманець перед переказом. DARKSHARE виявив зв'язки з відомим скам-проектом та взаємодію з Tornado Cash."
                    : lang === "ru"
                    ? "Пользователь проверил криптокошелек перед переводом. DARKSHARE обнаружил связи с известным скам-проектом и взаимодействие с Tornado Cash."
                    : lang === "es"
                    ? "El usuario verificó la billetera antes de la transferencia. DARKSHARE detectó vínculos con un proyecto de estafa conocido e interacción con Tornado Cash."
                    : lang === "de"
                    ? "Der Nutzer überprüfte die Wallet vor der Überweisung. DARKSHARE erkannte Verbindungen zu einem bekannten Betrug und Tornado Cash-Interaktionen."
                    : "A user checked a crypto wallet before transferring funds. DARKSHARE detected links to a known scam project and Tornado Cash mixer interactions.",
                  riskBefore: 0,
                  riskAfter: 87,
                  outcome: lang === "uk" ? "Переказ скасовано, кошти збережено" : lang === "ru" ? "Перевод отменен, средства сохранены" : lang === "es" ? "Transferencia cancelada, fondos salvados" : lang === "de" ? "Überweisung abgebrochen, Gelder gesichert" : "Transfer cancelled, funds saved",
                  type: lang === "uk" ? "Перевірка гаманця" : lang === "ru" ? "Проверка кошелька" : lang === "es" ? "Verificación de billetera" : lang === "de" ? "Wallet-Prüfung" : "Wallet Check"
                },
                {
                  icon: <Search className="w-5 h-5" />,
                  iconBg: "bg-orange-500/10 border-orange-500/20 text-orange-400",
                  title: lang === "uk" ? "Виявили фішинговий домен" : lang === "ru" ? "Обнаружили фишинговый домен" : lang === "es" ? "Detectaron dominio phishing" : lang === "de" ? "Phishing-Domain erkannt" : "Detected Phishing Domain",
                  description: lang === "uk"
                    ? "Компанія перевірила підозрілий домен, що імітував їхній бренд. Аналіз показав реєстрацію 2 дні тому та фішинговий контент для крадіжки даних."
                    : lang === "ru"
                    ? "Компания проверила подозрительный домен, имитирующий их бренд. Анализ показал регистрацию 2 дня назад и фишинговый контент для кражи данных."
                    : lang === "es"
                    ? "Una empresa verificó un dominio sospechoso que imitaba su marca. El análisis reveló registro hace 2 días y contenido phishing para robo de datos."
                    : lang === "de"
                    ? "Ein Unternehmen überprüfte eine verdächtige Domain, die ihre Marke imitierte. Die Analyse zeigte eine 2 Tage alte Registrierung und Phishing-Inhalte."
                    : "A company checked a suspicious domain mimicking their brand. Analysis revealed registration 2 days prior and phishing content designed to steal credentials.",
                  riskBefore: 0,
                  riskAfter: 92,
                  outcome: lang === "uk" ? "Домен заблоковано, витік запобіжено" : lang === "ru" ? "Домен заблокирован, утечка предотвращена" : lang === "es" ? "Dominio bloqueado, filtración evitada" : lang === "de" ? "Domain gesperrt, Datenleck verhindert" : "Domain blocked, data leak prevented",
                  type: lang === "uk" ? "Аналіз домену" : lang === "ru" ? "Анализ домена" : lang === "es" ? "Análisis de dominio" : lang === "de" ? "Domain-Analyse" : "Domain Analysis"
                },
                {
                  icon: <Mail className="w-5 h-5" />,
                  iconBg: "bg-yellow-500/10 border-yellow-500/20 text-yellow-400",
                  title: lang === "uk" ? "Виявили скомпрометований email" : lang === "ru" ? "Обнаружили скомпрометированный email" : lang === "es" ? "Detectaron email comprometido" : lang === "de" ? "Kompromittierte E-Mail erkannt" : "Identified Compromised Email",
                  description: lang === "uk"
                    ? "Перевірка email партнера виявила присутність у 5 великих витоках даних та пов'язані підозрілі акаунти. Акаунт використовувався для шахрайства."
                    : lang === "ru"
                    ? "Проверка email партнера выявила присутствие в 5 крупных утечках данных и связанные подозрительные аккаунты. Аккаунт использовался для мошенничества."
                    : lang === "es"
                    ? "La verificación del email del socio reveló presencia en 5 grandes filtraciones y cuentas sospechosas vinculadas. La cuenta se usaba para fraude."
                    : lang === "de"
                    ? "Die E-Mail-Prüfung des Partners ergab eine Präsenz in 5 großen Datenlecks und verknüpfte verdächtige Konten. Das Konto wurde für Betrug genutzt."
                    : "Checking a business partner's email revealed presence in 5 major data breaches and linked suspicious accounts. The account was being used for fraud.",
                  riskBefore: 0,
                  riskAfter: 78,
                  outcome: lang === "uk" ? "Партнерство припинено, дані захищено" : lang === "ru" ? "Партнерство прекращено, данные защищены" : lang === "es" ? "Asociación terminada, datos protegidos" : lang === "de" ? "Partnerschaft beendet, Daten geschützt" : "Partnership terminated, data protected",
                  type: lang === "uk" ? "Перевірка email" : lang === "ru" ? "Проверка email" : lang === "es" ? "Verificación de email" : lang === "de" ? "E-Mail-Prüfung" : "Email Check"
                }
              ].map((study, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.15, duration: 0.5 }}
                  data-testid={`card-case-study-${idx}`}
                >
                  <Card className="premium-card p-5 sm:p-6 h-full flex flex-col backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-11 h-11 rounded-xl border flex items-center justify-center ${study.iconBg} shadow-lg`}>
                        {study.icon}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{study.type}</span>
                        <h3 className="text-sm sm:text-base font-bold text-white leading-tight">{study.title}</h3>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-4 flex-grow">
                      {study.description}
                    </p>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                              {lang === "uk" ? "Оцінка ризику" : lang === "ru" ? "Оценка риска" : lang === "es" ? "Puntuación" : lang === "de" ? "Risikobewertung" : "Risk Score"}
                            </span>
                            <span className={`text-sm font-bold ${study.riskAfter >= 80 ? "text-red-400" : study.riskAfter >= 60 ? "text-orange-400" : "text-yellow-400"}`}>
                              {study.riskAfter}/100
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              whileInView={{ width: `${study.riskAfter}%` }}
                              viewport={{ once: true }}
                              transition={{ delay: 0.3 + idx * 0.15, duration: 1, ease: "easeOut" }}
                              className={`h-full rounded-full ${study.riskAfter >= 80 ? "bg-gradient-to-r from-red-500 to-red-400" : study.riskAfter >= 60 ? "bg-gradient-to-r from-orange-500 to-orange-400" : "bg-gradient-to-r from-yellow-500 to-yellow-400"}`}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-green-500/5 border border-green-500/10">
                        <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                        <span className="text-[11px] sm:text-xs text-green-400 font-medium">{study.outcome}</span>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-8 sm:py-10 md:py-12 section-divider">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 w-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-8 sm:mb-10 space-y-2 sm:space-y-3"
            >
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary">
                <HelpCircle className="w-3 h-3" />
                FAQ
              </span>
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold px-2">
                {lang === "uk" ? "Часті Запитання" : lang === "ru" ? "Часто Задаваемые Вопросы" : lang === "es" ? "Preguntas Frecuentes" : lang === "de" ? "Häufig Gestellte Fragen" : "Frequently Asked Questions"}
              </h2>
            </motion.div>

            <div className="space-y-3" data-testid="faq-section">
              {[
                {
                  q: lang === "uk" ? "Чи є DARKSHARE безкоштовним?" : lang === "ru" ? "DARKSHARE бесплатный?" : lang === "es" ? "¿Es DARKSHARE gratuito?" : lang === "de" ? "Ist DARKSHARE kostenlos?" : "Is DARKSHARE free to use?",
                  a: lang === "uk" ? "Так! Ви отримуєте 5 безкоштовних перевірок на день без реєстраційного внеску. Для більшої кількості перевірок оновіться до PRO ($10/міс) або Enterprise ($35/міс)." : lang === "ru" ? "Да! Вы получаете 5 бесплатных проверок в день без регистрационного взноса. Для большего количества проверок перейдите на PRO ($10/мес) или Enterprise ($35/мес)." : lang === "es" ? "¡Sí! Obtiene 5 verificaciones gratuitas por día sin tarifa de registro. Para más verificaciones, actualice a PRO ($10/mes) o Enterprise ($35/mes)." : lang === "de" ? "Ja! Sie erhalten 5 kostenlose Prüfungen pro Tag ohne Registrierungsgebühr. Für mehr Prüfungen upgraden Sie auf PRO ($10/Monat) oder Enterprise ($35/Monat)." : "Yes! You get 5 free checks per day without any registration fee. For more checks, upgrade to PRO ($10/month) or Enterprise ($35/month)."
                },
                {
                  q: lang === "uk" ? "Які дані можна аналізувати?" : lang === "ru" ? "Какие данные можно анализировать?" : lang === "es" ? "¿Qué datos puedo analizar?" : lang === "de" ? "Welche Daten kann ich analysieren?" : "What data can I analyze?",
                  a: lang === "uk" ? "Ви можете перевіряти IP-адреси, криптогаманці, електронні адреси, домени, URL-адреси, номери телефонів, CVE-вразливості, хеші файлів, імена користувачів та токени Telegram-ботів." : lang === "ru" ? "Вы можете проверять IP-адреса, криптокошельки, адреса электронной почты, домены, URL-адреса, номера телефонов, CVE-уязвимости, хеши файлов, имена пользователей и токены Telegram-ботов." : lang === "es" ? "Puede verificar direcciones IP, billeteras de criptomonedas, direcciones de correo electrónico, dominios, URLs, números de teléfono, vulnerabilidades CVE, hashes de archivos, nombres de usuario y tokens de bots de Telegram." : lang === "de" ? "Sie können IP-Adressen, Krypto-Wallets, E-Mail-Adressen, Domains, URLs, Telefonnummern, CVE-Schwachstellen, Datei-Hashes, Benutzernamen und Telegram-Bot-Token überprüfen." : "You can check IP addresses, crypto wallets, email addresses, domains, URLs, phone numbers, CVE vulnerabilities, file hashes, usernames, and Telegram bot tokens."
                },
                {
                  q: lang === "uk" ? "Чи є мої дані безпечними та конфіденційними?" : lang === "ru" ? "Мои данные в безопасности?" : lang === "es" ? "¿Están mis datos seguros y privados?" : lang === "de" ? "Sind meine Daten sicher und privat?" : "Is my data safe and private?",
                  a: lang === "uk" ? "Абсолютно. Усі пошуки зашифровані, ми не зберігаємо ваші цілі пошуку, а ваші дані ніколи не передаються третім сторонам." : lang === "ru" ? "Абсолютно. Все поиски зашифрованы, мы не храним ваши цели поиска, а ваши данные никогда не передаются третьим лицам." : lang === "es" ? "Absolutamente. Todas las búsquedas están cifradas, no almacenamos sus objetivos de búsqueda y sus datos nunca se comparten con terceros." : lang === "de" ? "Absolut. Alle Suchanfragen sind verschlüsselt, wir speichern Ihre Suchziele nicht und Ihre Daten werden niemals an Dritte weitergegeben." : "Absolutely. All searches are encrypted, we don't store your search targets, and your data is never shared with third parties."
                },
                {
                  q: lang === "uk" ? "Наскільки точні результати?" : lang === "ru" ? "Насколько точны результаты?" : lang === "es" ? "¿Qué tan precisos son los resultados?" : lang === "de" ? "Wie genau sind die Ergebnisse?" : "How accurate are the results?",
                  a: lang === "uk" ? "Ми агрегуємо дані з 15+ перевірених API безпеки, включаючи Shodan, VirusTotal та NVD NIST, у поєднанні з AI-аналізом для комплексної оцінки ризиків." : lang === "ru" ? "Мы агрегируем данные из 15+ проверенных API безопасности, включая Shodan, VirusTotal и NVD NIST, в сочетании с AI-анализом для комплексной оценки рисков." : lang === "es" ? "Agregamos datos de más de 15 APIs de seguridad verificadas, incluyendo Shodan, VirusTotal y NVD NIST, combinados con análisis de IA para una puntuación de riesgo integral." : lang === "de" ? "Wir aggregieren Daten aus über 15 verifizierten Sicherheits-APIs, darunter Shodan, VirusTotal und NVD NIST, kombiniert mit KI-Analyse für eine umfassende Risikobewertung." : "We aggregate data from 15+ verified security APIs including Shodan, VirusTotal, and NVD NIST, combined with AI analysis for comprehensive risk scoring."
                },
                {
                  q: lang === "uk" ? "Чи можна використовувати DARKSHARE через Telegram?" : lang === "ru" ? "Можно ли использовать DARKSHARE через Telegram?" : lang === "es" ? "¿Puedo usar DARKSHARE a través de Telegram?" : lang === "de" ? "Kann ich DARKSHARE über Telegram nutzen?" : "Can I use DARKSHARE via Telegram?",
                  a: lang === "uk" ? "Так! Наш Telegram-бот @DarkShare1Bot надає ті ж можливості аналізу прямо у вашому месенджері. Просто надішліть ціль і отримайте миттєві результати." : lang === "ru" ? "Да! Наш Telegram-бот @DarkShare1Bot предоставляет те же возможности анализа прямо в вашем мессенджере. Просто отправьте цель и получите мгновенные результаты." : lang === "es" ? "¡Sí! Nuestro bot de Telegram @DarkShare1Bot ofrece las mismas capacidades de análisis directamente en su mensajero. Solo envíe un objetivo y obtenga resultados instantáneos." : lang === "de" ? "Ja! Unser Telegram-Bot @DarkShare1Bot bietet die gleichen Analysefunktionen direkt in Ihrem Messenger. Senden Sie einfach ein Ziel und erhalten Sie sofortige Ergebnisse." : "Yes! Our Telegram bot @DarkShare1Bot provides the same analysis capabilities directly in your messenger. Just send a target and get instant results."
                },
                {
                  q: lang === "uk" ? "Які способи оплати ви приймаєте?" : lang === "ru" ? "Какие способы оплаты вы принимаете?" : lang === "es" ? "¿Qué métodos de pago aceptan?" : lang === "de" ? "Welche Zahlungsmethoden akzeptieren Sie?" : "What payment methods do you accept?",
                  a: lang === "uk" ? "Ми приймаємо криптовалюту (USDT у кількох мережах, включаючи TON, ERC-20, BEP-20, Solana) та Google Pay / Apple Pay (UAH)." : lang === "ru" ? "Мы принимаем криптовалюту (USDT в нескольких сетях, включая TON, ERC-20, BEP-20, Solana) и Google Pay / Apple Pay (UAH)." : lang === "es" ? "Aceptamos criptomonedas (USDT en múltiples redes, incluyendo TON, ERC-20, BEP-20, Solana) y Google Pay / Apple Pay (UAH)." : lang === "de" ? "Wir akzeptieren Kryptowährungen (USDT in mehreren Netzwerken, einschließlich TON, ERC-20, BEP-20, Solana) und Google Pay / Apple Pay (UAH)-Zahlungen." : "We accept cryptocurrency (USDT on multiple networks including TON, ERC-20, BEP-20, Solana) and Google Pay / Apple Pay (UAH) payments."
                }
              ].map((item, idx) => {
                const isOpen = openFaqItems.includes(idx);
                const toggleFaq = () => {
                  setOpenFaqItems(prev => 
                    prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
                  );
                };
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.08, duration: 0.4 }}
                  >
                    <button
                      type="button"
                      className="w-full rounded-xl premium-card text-left"
                      onClick={toggleFaq}
                      aria-expanded={isOpen}
                      data-testid={`faq-item-${idx}`}
                    >
                      <div className="flex items-center justify-between p-4 sm:p-5 gap-3">
                        <h3 className="text-xs sm:text-sm font-semibold text-white leading-snug">{item.q}</h3>
                        <ChevronDown className={`w-4 h-4 text-primary/60 flex-shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
                      </div>
                    </button>
                    <div
                      role="region"
                      className={`overflow-hidden transition-all duration-300 ease-in-out rounded-b-xl bg-card/30 border border-t-0 border-white/[0.04] ${isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}
                      aria-hidden={!isOpen}
                    >
                      <p className="px-4 sm:px-5 pb-4 sm:pb-5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        {item.a}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-8 sm:py-10 md:py-14 lg:py-16 section-divider">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 w-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-8 sm:mb-10 space-y-2 sm:space-y-3"
            >
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs font-medium text-violet-400">
                <Zap className="w-3 h-3" />
                {lang === "uk" ? "Порівняння Планів" : lang === "ru" ? "Сравнение Планов" : lang === "es" ? "Comparación de Planes" : lang === "de" ? "Planvergleich" : "Plan Comparison"}
              </span>
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold px-2">
                {lang === "uk" ? "Оберіть Свій Рівень" : lang === "ru" ? "Выберите Свой Уровень" : lang === "es" ? "Elija Su Nivel" : lang === "de" ? "Wählen Sie Ihren Level" : "Choose Your Level"}
              </h2>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0"
            >
              <table className="w-full text-xs sm:text-sm border-collapse min-w-[500px]" data-testid="table-plan-comparison">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-2 sm:px-3 text-muted-foreground font-medium">
                      {lang === "uk" ? "Можливість" : lang === "ru" ? "Возможность" : lang === "es" ? "Característica" : lang === "de" ? "Funktion" : "Feature"}
                    </th>
                    <th className="text-center py-3 px-2 sm:px-3 text-muted-foreground font-medium">FREE</th>
                    <th className="text-center py-3 px-2 sm:px-3 text-primary font-bold relative">
                      PRO
                      <span className="absolute -top-1 left-1/2 -translate-x-1/2 text-[8px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full border border-primary/30">
                        {lang === "uk" ? "Популярний" : lang === "ru" ? "Популярный" : "Popular"}
                      </span>
                    </th>
                    <th className="text-center py-3 px-2 sm:px-3 text-amber-400 font-bold">ENT</th>
                    <th className="text-center py-3 px-2 sm:px-3 text-cyan-400 font-bold">GROUPS</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: lang === "uk" ? "Перевірок на день" : lang === "ru" ? "Проверок в день" : "Daily checks", free: "5", pro: "50", ent: "∞", grp: "∞" },
                    { feature: lang === "uk" ? "Типів перевірок" : lang === "ru" ? "Типов проверок" : "Check types", free: "15", pro: "17", ent: "17", grp: "17" },
                    { feature: "AI " + (lang === "uk" ? "аналіз" : lang === "ru" ? "анализ" : "analysis"), free: "—", pro: "✓", ent: "✓", grp: "✓" },
                    { feature: "PDF " + (lang === "uk" ? "звіти" : lang === "ru" ? "отчёты" : "reports"), free: "—", pro: "✓", ent: "✓", grp: "✓" },
                    { feature: lang === "uk" ? "Моніторинг 24/7" : lang === "ru" ? "Мониторинг 24/7" : "24/7 Monitoring", free: "—", pro: "5", ent: "25", grp: "50" },
                    { feature: "API " + (lang === "uk" ? "доступ" : lang === "ru" ? "доступ" : "access"), free: "—", pro: "✓", ent: "✓", grp: "✓" },
                    { feature: "EXIF / GeoINT", free: "—", pro: "✓", ent: "✓", grp: "✓" },
                    { feature: "Bulk " + (lang === "uk" ? "перевірки" : lang === "ru" ? "проверки" : "checks"), free: "—", pro: "10", ent: "50", grp: "100" },
                    { feature: lang === "uk" ? "Підтримка" : lang === "ru" ? "Поддержка" : "Support", free: "—", pro: "Email", ent: "Priority", grp: "Dedicated" },
                  ].map((row, idx) => (
                    <tr key={idx} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors" data-testid={`row-comparison-${idx}`}>
                      <td className="py-2.5 px-2 sm:px-3 text-white/80 font-medium">{row.feature}</td>
                      <td className="py-2.5 px-2 sm:px-3 text-center text-muted-foreground">{row.free}</td>
                      <td className="py-2.5 px-2 sm:px-3 text-center text-primary font-medium">{row.pro}</td>
                      <td className="py-2.5 px-2 sm:px-3 text-center text-amber-400 font-medium">{row.ent}</td>
                      <td className="py-2.5 px-2 sm:px-3 text-center text-cyan-400 font-medium">{row.grp}</td>
                    </tr>
                  ))}
                  <tr className="border-t border-white/10">
                    <td className="py-3 px-2 sm:px-3 text-white font-bold">
                      {lang === "uk" ? "Ціна / місяць" : lang === "ru" ? "Цена / месяц" : "Price / month"}
                    </td>
                    <td className="py-3 px-2 sm:px-3 text-center text-muted-foreground font-bold">$0</td>
                    <td className="py-3 px-2 sm:px-3 text-center text-primary font-bold">$10</td>
                    <td className="py-3 px-2 sm:px-3 text-center text-amber-400 font-bold">$35</td>
                    <td className="py-3 px-2 sm:px-3 text-center text-cyan-400 font-bold">$55</td>
                  </tr>
                </tbody>
              </table>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="text-center mt-6"
            >
              <Link href="/pricing">
                <Button size="lg" className="px-8 h-12 bg-gradient-to-r from-primary to-emerald-400 text-black font-bold rounded-xl hover:scale-[1.03] transition-all duration-300 shadow-[0_0_30px_rgba(34,197,94,0.2)]" data-testid="button-view-pricing">
                  {lang === "uk" ? "Детальніше про тарифи" : lang === "ru" ? "Подробнее о тарифах" : lang === "es" ? "Más sobre los planes" : lang === "de" ? "Mehr über Tarife" : "View Full Pricing"}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        <section className="py-8 sm:py-10 md:py-12 section-divider">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-8 space-y-2"
            >
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary">
                <Star className="w-3 h-3" />
                {lang === "uk" ? "Відгуки" : lang === "ru" ? "Отзывы" : lang === "es" ? "Testimonios" : lang === "de" ? "Bewertungen" : "Testimonials"}
              </span>
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold px-2">
                {lang === "uk" ? "Що Говорять Наші Користувачі" : lang === "ru" ? "Что Говорят Наши Пользователи" : lang === "es" ? "Lo Que Dicen Nuestros Usuarios" : lang === "de" ? "Was Unsere Nutzer Sagen" : "What Our Users Say"}
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  name: lang === "uk" ? "Олександр К." : lang === "ru" ? "Александр К." : "Alexander K.",
                  role: lang === "uk" ? "Криптоінвестор" : lang === "ru" ? "Криптоинвестор" : lang === "es" ? "Criptoinversor" : lang === "de" ? "Kryptoinvestor" : "Crypto Investor",
                  text: lang === "uk" ? "DARKSHARE врятував мені $12,000. Перевірив гаманець продавця перед угодою — виявив зв'язок з mixer'ом. Мій must-have інструмент." : lang === "ru" ? "DARKSHARE спас мне $12,000. Проверил кошелёк продавца перед сделкой — обнаружил связь с миксером. Мой must-have инструмент." : lang === "es" ? "DARKSHARE me salvó $12,000. Verifiqué la billetera del vendedor antes del trato — se detectó conexión con mixer." : lang === "de" ? "DARKSHARE hat mir $12.000 gespart. Die Wallet des Verkäufers wurde vor dem Deal geprüft — Mixer-Verbindung erkannt." : "DARKSHARE saved me $12,000. Checked seller's wallet before deal — detected mixer connection. My must-have tool.",
                  rating: 5,
                  avatar: "🛡️",
                },
                {
                  name: lang === "uk" ? "Марина Д." : lang === "ru" ? "Марина Д." : "Marina D.",
                  role: lang === "uk" ? "IT-безпека" : lang === "ru" ? "IT-безопасность" : lang === "es" ? "Seguridad IT" : lang === "de" ? "IT-Sicherheit" : "IT Security",
                  text: lang === "uk" ? "Використовую для аудиту корпоративних доменів та email. AI-аналіз дає професійні рекомендації. PDF-звіти — знахідка для клієнтів." : lang === "ru" ? "Использую для аудита корпоративных доменов и email. AI-анализ даёт профессиональные рекомендации. PDF-отчёты — находка для клиентов." : lang === "es" ? "Lo uso para auditar dominios corporativos y emails. El análisis de IA da recomendaciones profesionales." : lang === "de" ? "Nutze es für Audits von Unternehmensdomains und E-Mails. Die KI-Analyse gibt professionelle Empfehlungen." : "I use it for corporate domain and email audits. AI analysis gives professional recommendations. PDF reports are a goldmine for clients.",
                  rating: 5,
                  avatar: "💼",
                },
                {
                  name: lang === "uk" ? "Тарас В." : lang === "ru" ? "Тарас В." : "Taras V.",
                  role: lang === "uk" ? "Фрілансер" : lang === "ru" ? "Фрилансер" : lang === "es" ? "Freelancer" : lang === "de" ? "Freelancer" : "Freelancer",
                  text: lang === "uk" ? "Перевіряю замовників перед початком роботи. Один раз знайшов фішинговий домен у портфоліо 'клієнта'. Бот у Telegram — дуже зручно!" : lang === "ru" ? "Проверяю заказчиков перед началом работы. Однажды нашёл фишинговый домен в портфолио 'клиента'. Бот в Telegram — очень удобно!" : lang === "es" ? "Verifico clientes antes de comenzar a trabajar. Una vez encontré un dominio de phishing en el portafolio del 'cliente'." : lang === "de" ? "Ich überprüfe Auftraggeber vor Arbeitsbeginn. Einmal fand ich eine Phishing-Domain im Portfolio eines 'Kunden'." : "I check clients before starting work. Once found a phishing domain in a 'client's' portfolio. Telegram bot is super convenient!",
                  rating: 5,
                  avatar: "🎯",
                },
              ].map((review, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1, duration: 0.5 }}
                  className="premium-card p-5 space-y-3"
                  data-testid={`card-review-${idx}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center text-lg">
                      {review.avatar}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{review.name}</p>
                      <p className="text-[10px] text-muted-foreground">{review.role}</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: review.rating }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{review.text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-6 sm:py-8 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center text-xs text-muted-foreground mb-4"
            >
              {lang === "uk" ? "Працюємо з провідними джерелами безпеки" : lang === "ru" ? "Работаем с ведущими источниками безопасности" : lang === "es" ? "Trabajamos con las principales fuentes de seguridad" : lang === "de" ? "Wir arbeiten mit führenden Sicherheitsquellen" : "Powered by leading security intelligence sources"}
            </motion.p>
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
              {["Shodan", "VirusTotal", "AbuseIPDB", "NVD NIST", "Etherscan", "URLScan", "MalwareBazaar", "HIBP", "Google DNS", "SSL Labs"].map((source, idx) => (
                <motion.div
                  key={source}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05, duration: 0.3 }}
                  className="px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-[10px] sm:text-xs text-muted-foreground font-mono hover:border-primary/30 hover:text-primary/80 transition-colors"
                  data-testid={`badge-source-${source.toLowerCase().replace(/\s/g, '-')}`}
                >
                  {source}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-14 sm:py-18 md:py-24 relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_50%,rgba(34,197,94,0.08),transparent_70%)] pointer-events-none" />
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center w-full relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-5 sm:space-y-8"
            >
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold px-2 gradient-text-animated">
                {lang === "uk" ? "Готові почати?" : lang === "ru" ? "Готовы начать?" : lang === "es" ? "¿Listo para empezar?" : lang === "de" ? "Bereit loszulegen?" : "Ready to Start?"}
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-xl mx-auto px-2">
                {lang === "uk" 
                  ? "Приєднуйтесь до тисяч користувачів, які довіряють DARKSHARE для своєї кібербезпеки"
                  : lang === "ru"
                  ? "Присоединяйтесь к тысячам пользователей, которые доверяют DARKSHARE для своей кибербезопасности"
                  : lang === "es"
                  ? "Únase a miles de usuarios que confían en DARKSHARE para su ciberseguridad"
                  : lang === "de"
                  ? "Schließen Sie sich Tausenden von Nutzern an, die DARKSHARE für ihre Cybersicherheit vertrauen"
                  : "Join thousands of users who trust DARKSHARE for their cybersecurity needs"}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2 px-2">
                <Link href="/login">
                  <Button size="lg" className="w-full sm:w-auto px-8 sm:px-10 h-13 sm:h-14 text-sm sm:text-base bg-gradient-to-r from-primary to-emerald-400 text-black font-bold shadow-[0_0_40px_rgba(34,197,94,0.3)] hover:shadow-[0_0_60px_rgba(34,197,94,0.5)] hover:scale-[1.03] transition-all duration-300 rounded-xl" data-testid="button-dashboard-cta">
                    <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    {t("landing.cta.webDashboard")}
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button variant="secondary" size="lg" className="w-full sm:w-auto px-8 sm:px-10 h-13 sm:h-14 text-sm sm:text-base bg-white/[0.06] hover:bg-white/[0.1] border border-white/15 text-white hover:scale-[1.03] transition-all duration-300 rounded-xl" data-testid="button-pricing-cta">
                    <Zap className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-primary" />
                    {t("nav.pricing")}
                  </Button>
                </Link>
                <a 
                  href="https://t.me/DarkShare1Bot" 
                  target="_blank" 
                  rel="noreferrer"
                >
                  <Button variant="outline" size="lg" className="w-full sm:w-auto px-8 sm:px-10 h-13 sm:h-14 text-sm sm:text-base border-[#229ED9]/30 text-[#229ED9] hover:bg-[#229ED9]/10 hover:scale-[1.03] transition-all duration-300 rounded-xl" data-testid="button-launch-bot-cta">
                    <SiTelegram className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    {lang === "uk" ? "Telegram Бот" : lang === "ru" ? "Telegram Бот" : lang === "es" ? "Bot de Telegram" : lang === "de" ? "Telegram Bot" : "Telegram Bot"}
                    <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-2" />
                  </Button>
                </a>
                <a 
                  href="https://www.instagram.com/darkshare.store" 
                  target="_blank" 
                  rel="noreferrer"
                >
                  <Button variant="outline" size="lg" className="w-full sm:w-auto px-8 sm:px-10 h-13 sm:h-14 text-sm sm:text-base border-[#E4405F]/30 text-[#E4405F] hover:bg-[#E4405F]/10 hover:scale-[1.03] transition-all duration-300 rounded-xl" data-testid="button-instagram-cta">
                    <SiInstagram className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Instagram
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
