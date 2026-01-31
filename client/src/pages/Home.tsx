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
  Send
} from "lucide-react";
import { SiTelegram } from "react-icons/si";
import { useStats } from "@/hooks/use-stats";
import { useActivity, useLeaderboard } from "@/hooks/use-activity";
import { TerminalText } from "@/components/TerminalText";
import { StatusBadge } from "@/components/StatusBadge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { translations } from "@/lib/i18n";

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
      className="group relative p-4 sm:p-5 rounded-xl bg-card/50 border border-white/5 hover:border-primary/30 transition-all duration-300"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl" />
      
      <div className="relative z-10 space-y-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
          {icon}
        </div>
        
        <div className="space-y-1.5">
          <h3 className="text-sm font-bold group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {description}
          </p>
          {apis && apis.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {apis.map((api, idx) => (
                <span key={idx} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-muted-foreground font-mono">
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
  const [lang, setLang] = useState<"UA" | "RU" | "EN">("UA");
  const [langSelected, setLangSelected] = useState(false);
  const t = translations[lang as keyof typeof translations];

  useEffect(() => {
    const savedLang = localStorage.getItem("lang") as keyof typeof translations;
    if (savedLang && translations[savedLang]) {
      setLang(savedLang);
      setLangSelected(true);
    }
  }, []);

  const toggleLang = (newLang: "UA" | "RU" | "EN") => {
    setLang(newLang);
    localStorage.setItem("lang", newLang);
    setLangSelected(true);
  };
  
  const { data: stats } = useStats();
  const { data: activity } = useActivity();
  const { data: leaderboard } = useLeaderboard();

  const modules = [
    {
      icon: <Wallet className="w-5 h-5" />,
      title: lang === "UA" ? "Crypto Wallet" : lang === "RU" ? "Крипто Кошелек" : "Crypto Wallet",
      description: lang === "UA" ? "Аналіз криптогаманців, історія транзакцій та оцінка ризиків" : lang === "RU" ? "Анализ криптокошельков, история транзакций и оценка рисков" : "Wallet analysis, transaction history & risk scoring",
      apis: ["Etherscan", "Blockchair"]
    },
    {
      icon: <Globe className="w-5 h-5" />,
      title: lang === "UA" ? "IP Lookup" : lang === "RU" ? "IP Поиск" : "IP Lookup",
      description: lang === "UA" ? "Геолокація, ISP інформація та перевірка репутації IP" : lang === "RU" ? "Геолокация, ISP информация и проверка репутации IP" : "Geolocation, ISP info & IP reputation check",
      apis: ["Shodan", "AbuseIPDB"]
    },
    {
      icon: <Search className="w-5 h-5" />,
      title: lang === "UA" ? "Domain Intel" : lang === "RU" ? "Домен Intel" : "Domain Intel",
      description: lang === "UA" ? "WHOIS, DNS записи, SSL сертифікати та історія" : lang === "RU" ? "WHOIS, DNS записи, SSL сертификаты и история" : "WHOIS, DNS records, SSL certificates & history",
      apis: ["urlscan.io", "SecurityTrails"]
    },
    {
      icon: <Mail className="w-5 h-5" />,
      title: lang === "UA" ? "Email OSINT" : lang === "RU" ? "Email OSINT" : "Email OSINT",
      description: lang === "UA" ? "Перевірка витоків, пов'язані акаунти та breach data" : lang === "RU" ? "Проверка утечек, связанные аккаунты и breach data" : "Breach check, linked accounts & leak data",
      apis: ["HIBP", "LeakCheck"]
    },
    {
      icon: <Phone className="w-5 h-5" />,
      title: lang === "UA" ? "Phone Lookup" : lang === "RU" ? "Телефон Поиск" : "Phone Lookup",
      description: lang === "UA" ? "Оператор, країна, лінія та перевірка spam" : lang === "RU" ? "Оператор, страна, линия и проверка spam" : "Carrier, country, line type & spam check",
      apis: ["NumVerify", "Twilio"]
    },
    {
      icon: <Bug className="w-5 h-5" />,
      title: lang === "UA" ? "Malware Check" : lang === "RU" ? "Malware Проверка" : "Malware Check",
      description: lang === "UA" ? "Аналіз файлів, хешів та URL на шкідливість" : lang === "RU" ? "Анализ файлов, хешей и URL на вредоносность" : "File, hash & URL malware analysis",
      apis: ["VirusTotal", "MalwareBazaar"]
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: lang === "UA" ? "CVE Scanner" : lang === "RU" ? "CVE Сканер" : "CVE Scanner",
      description: lang === "UA" ? "Пошук вразливостей та exploits по CVE" : lang === "RU" ? "Поиск уязвимостей и exploits по CVE" : "Vulnerability & exploit search by CVE",
      apis: ["NVD NIST", "Exploit-DB"]
    },
    {
      icon: <AlertTriangle className="w-5 h-5" />,
      title: lang === "UA" ? "URL Scanner" : lang === "RU" ? "URL Сканер" : "URL Scanner",
      description: lang === "UA" ? "Перевірка URL на фішинг та шкідливість" : lang === "RU" ? "Проверка URL на фишинг и вредоносность" : "URL phishing & malware detection",
      apis: ["urlscan.io", "Google Safe"]
    },
    {
      icon: <Bot className="w-5 h-5" />,
      title: lang === "UA" ? "Bot Token" : lang === "RU" ? "Bot Token" : "Bot Token",
      description: lang === "UA" ? "Перевірка Telegram Bot API токенів на валідність" : lang === "RU" ? "Проверка Telegram Bot API токенов на валидность" : "Validate Telegram Bot API tokens",
      apis: ["Telegram API"]
    },
    {
      icon: <Search className="w-5 h-5" />,
      title: lang === "UA" ? "Username OSINT" : lang === "RU" ? "Username OSINT" : "Username OSINT",
      description: lang === "UA" ? "Пошук профілів по username на різних платформах" : lang === "RU" ? "Поиск профилей по username на разных платформах" : "Search profiles by username across platforms",
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
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 right-1/3 w-48 h-48 bg-blue-500/10 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      <nav className="relative z-10 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden border border-primary/30 shadow-[0_0_20px_rgba(var(--primary),0.3)] flex-shrink-0">
              <img src="/logo.png" alt="DARKSHARE" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-base sm:text-lg tracking-tight text-white">DARKSHARE</span>
              <span className="text-[10px] text-primary font-mono -mt-0.5">v4.0 OSINT Platform</span>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
            <div className="flex bg-white/5 rounded-lg p-0.5 border border-white/10">
              {(["UA", "RU", "EN"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => toggleLang(l)}
                  className={`px-2 py-1 text-[10px] font-bold rounded transition-all ${lang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-white"}`}
                  data-testid={`button-lang-${l}`}
                >
                  {l}
                </button>
              ))}
            </div>
            <StatusBadge status="online" />
          </div>
        </div>
      </nav>

      <main className="flex-grow relative z-10">
        <section className="pt-12 sm:pt-16 md:pt-24 pb-16 sm:pb-20 md:pb-32 px-4 max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
            <div className="lg:col-span-3 space-y-6 sm:space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="space-y-6"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary">
                  <Shield className="w-4 h-4" />
                  <span>{lang === "UA" ? "Професійна OSINT Платформа" : lang === "RU" ? "Профессиональная OSINT Платформа" : "Professional OSINT Platform"}</span>
                </div>

                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.1]">
                  {lang === "UA" ? "Кібербезпека та" : lang === "RU" ? "Кибербезопасность и" : "Cybersecurity &"} <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary to-blue-400">
                    {lang === "UA" ? "Розвідка Загроз" : lang === "RU" ? "Разведка Угроз" : "Threat Intelligence"}
                  </span>
                </h1>

                <p className="text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed">
                  {lang === "UA" 
                    ? "10+ модулів для комплексного аналізу: IP, домени, гаманці, email, телефони, malware, CVE та leak databases. Інтеграція з провідними API безпеки."
                    : lang === "RU"
                    ? "10+ модулей для комплексного анализа: IP, домены, кошельки, email, телефоны, malware, CVE и leak databases. Интеграция с ведущими API безопасности."
                    : "10+ modules for comprehensive analysis: IPs, domains, wallets, emails, phones, malware, CVE & leak databases. Integration with leading security APIs."}
                </p>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
                  <Link href="/login">
                    <Button 
                      size="lg"
                      className="w-full sm:w-auto text-base px-6 py-6 group"
                      data-testid="button-web-dashboard"
                    >
                      <ShieldCheck className="w-5 h-5 mr-2" />
                      {t.webDashboard}
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
                      className="w-full sm:w-auto text-base px-6 py-6 group border-primary/30 hover:border-primary/50"
                      data-testid="button-launch-bot"
                    >
                      <SiTelegram className="w-5 h-5 mr-2" />
                      {t.launchBot}
                      <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </a>
                </div>

                <div className="flex items-center gap-6 pt-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>{lang === "UA" ? "Безкоштовний старт" : lang === "RU" ? "Бесплатный старт" : "Free to start"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>{lang === "UA" ? "API інтеграція" : lang === "RU" ? "API интеграция" : "API integration"}</span>
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
                      {lang === "UA" ? "Активність" : lang === "RU" ? "Активность" : "Live Activity"}
                    </h3>
                    <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      Real-time
                    </span>
                  </div>
                  <div className="space-y-2 max-h-[180px] overflow-hidden">
                    {activity?.slice(0, 5).map((item, idx) => (
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
                        <span className={`font-bold uppercase text-[9px] flex-shrink-0 ${getRiskColor(item.riskLevel)}`}>
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
                      {lang === "UA" ? "Топ Хантери" : lang === "RU" ? "Топ Хантеры" : "Top Hunters"}
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {leaderboard?.slice(0, 4).map((user, idx) => (
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

        <section className="py-12 sm:py-16 border-t border-white/5 bg-gradient-to-b from-transparent to-primary/5">
          <div className="max-w-7xl mx-auto px-4 w-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8"
            >
              <div className="text-center space-y-1">
                <div className="text-3xl sm:text-4xl font-bold text-white">
                  <AnimatedNumber value={stats?.totalUsers ?? 14582} />
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground flex items-center justify-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-primary" />
                  {t.users}
                </div>
              </div>
              <div className="text-center space-y-1">
                <div className="text-3xl sm:text-4xl font-bold text-white">
                  <AnimatedNumber value={stats?.activeWatches ?? 3841} />
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground flex items-center justify-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-primary" />
                  {t.monitors}
                </div>
              </div>
              <div className="text-center space-y-1">
                <div className="text-3xl sm:text-4xl font-bold text-white">
                  <AnimatedNumber value={stats?.threatsBlocked ?? 12459} />
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground flex items-center justify-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-primary" />
                  {t.threats}
                </div>
              </div>
              <div className="text-center space-y-1">
                <div className="text-3xl sm:text-4xl font-bold text-white">
                  <AnimatedNumber value={stats?.checksToday ?? 842} />
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground flex items-center justify-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-primary" />
                  {t.today}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="py-16 sm:py-20 md:py-24">
          <div className="max-w-7xl mx-auto px-4 w-full">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-10 sm:mb-14 space-y-3"
            >
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary">
                <Terminal className="w-3 h-3" />
                {lang === "UA" ? "10 Модулів" : lang === "RU" ? "10 Модулей" : "10 Modules"}
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">
                {lang === "UA" ? "Повний Арсенал OSINT" : lang === "RU" ? "Полный Арсенал OSINT" : "Complete OSINT Arsenal"}
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
                {lang === "UA" 
                  ? "Кожен модуль інтегрований з провідними API для максимальної точності та актуальності даних"
                  : lang === "RU"
                  ? "Каждый модуль интегрирован с ведущими API для максимальной точности и актуальности данных"
                  : "Each module integrated with leading APIs for maximum accuracy and data relevance"}
              </p>
            </motion.div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
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

        <section className="py-16 sm:py-20 bg-card/30 border-y border-white/5">
          <div className="max-w-7xl mx-auto px-4 w-full">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-10 sm:mb-12 space-y-3"
            >
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary">
                <Server className="w-3 h-3" />
                {lang === "UA" ? "API Інтеграції" : lang === "RU" ? "API Интеграции" : "API Integrations"}
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold">
                {lang === "UA" ? "Джерела Даних" : lang === "RU" ? "Источники Данных" : "Data Sources"}
              </h2>
              <p className="text-sm text-muted-foreground max-w-xl mx-auto">
                {lang === "UA" 
                  ? "Інтеграція з найкращими API безпеки для актуальних та достовірних даних"
                  : lang === "RU"
                  ? "Интеграция с лучшими API безопасности для актуальных и достоверных данных"
                  : "Integration with top security APIs for accurate and reliable data"}
              </p>
            </motion.div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
              {apiSources.map((source, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05 }}
                  className="group p-4 sm:p-5 rounded-xl bg-white/5 border border-white/5 hover:border-primary/20 transition-all duration-300 text-center"
                >
                  <div className="w-10 h-10 mx-auto mb-3 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                    <Database className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-sm mb-1 group-hover:text-primary transition-colors">{source.name}</h3>
                  <p className="text-[11px] text-muted-foreground">{source.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12 sm:py-16 max-w-5xl mx-auto px-4 w-full">
          <div className="rounded-xl overflow-hidden border border-white/10 bg-[#0a0a0a] shadow-2xl shadow-primary/5">
            <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border-b border-white/10">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <div className="flex-1 text-center font-mono text-xs text-muted-foreground">darkshare_cli — v4.0</div>
            </div>
            <div className="p-4 sm:p-6 font-mono text-xs sm:text-sm space-y-3 h-[280px] sm:h-[320px] overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0a0a0a] z-10 pointer-events-none" />
              
              <div className="text-green-500/70">$ darkshare scan --target 0x1234...5678 --type wallet</div>
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

        <section className="py-16 sm:py-20 bg-gradient-to-b from-primary/10 to-transparent border-t border-primary/20">
          <div className="max-w-4xl mx-auto px-4 text-center w-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">
                {lang === "UA" ? "Готові почати?" : lang === "RU" ? "Готовы начать?" : "Ready to Start?"}
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
                {lang === "UA" 
                  ? "Приєднуйтесь до тисяч користувачів, які довіряють DARKSHARE для своєї кібербезпеки"
                  : lang === "RU"
                  ? "Присоединяйтесь к тысячам пользователей, которые доверяют DARKSHARE для своей кибербезопасности"
                  : "Join thousands of users who trust DARKSHARE for their cybersecurity needs"}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <Link href="/login">
                  <Button size="lg" className="w-full sm:w-auto px-8" data-testid="button-dashboard-cta">
                    <ShieldCheck className="w-5 h-5 mr-2" />
                    {t.webDashboard}
                  </Button>
                </Link>
                <a 
                  href="https://t.me/DARKSHAREN1_BOT" 
                  target="_blank" 
                  rel="noreferrer"
                >
                  <Button variant="outline" size="lg" className="w-full sm:w-auto px-8 border-primary/30" data-testid="button-launch-bot-cta">
                    <SiTelegram className="w-5 h-5 mr-2" />
                    Telegram Bot
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                </a>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5 bg-card/30 relative z-10">
        <div className="max-w-7xl mx-auto px-4 py-12 sm:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden border border-primary/30">
                  <img src="/logo.png" alt="DARKSHARE" className="w-full h-full object-cover" />
                </div>
                <div>
                  <span className="font-display font-bold text-lg">DARKSHARE</span>
                  <span className="text-primary ml-1 text-sm">v4.0</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground max-w-md">
                {lang === "UA" 
                  ? "Професійна платформа для OSINT розвідки та аналізу кіберзагроз. 10+ модулів для комплексного захисту."
                  : lang === "RU"
                  ? "Профессиональная платформа для OSINT разведки и анализа киберугроз. 10+ модулей для комплексной защиты."
                  : "Professional platform for OSINT intelligence and cyber threat analysis. 10+ modules for comprehensive protection."}
              </p>
              <div className="flex items-center gap-3 pt-2">
                <a 
                  href="https://t.me/DARKSHAREN1_BOT" 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#229ED9]/10 border border-[#229ED9]/20 text-[#229ED9] text-sm font-medium hover:bg-[#229ED9]/20 transition-colors"
                  data-testid="link-telegram-footer"
                >
                  <SiTelegram className="w-4 h-4" />
                  @DARKSHAREN1_BOT
                </a>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-sm">{lang === "UA" ? "Модулі" : lang === "RU" ? "Модули" : "Modules"}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Crypto Wallet Analysis</li>
                <li>IP & Domain Lookup</li>
                <li>Email OSINT</li>
                <li>Malware Scanner</li>
                <li>CVE Database</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-sm">{lang === "UA" ? "Ресурси" : lang === "RU" ? "Ресурсы" : "Resources"}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">API Docs</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
                <li><a href="https://t.me/DARKSHAREN1_BOT" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">Support</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/5 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-xs text-muted-foreground font-mono">
              © 2024 DARKSHARE INT. All rights reserved.
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                {lang === "UA" ? "Всі системи онлайн" : lang === "RU" ? "Все системы онлайн" : "All systems online"}
              </span>
              <span>Uptime: {stats?.uptime?.toFixed(1) ?? '99.9'}%</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
