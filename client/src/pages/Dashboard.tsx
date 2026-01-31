import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Shield, 
  Globe, 
  Wallet, 
  Mail, 
  Phone, 
  Link2, 
  Building,
  Search,
  AlertTriangle,
  Clock,
  FileText,
  ChevronRight,
  Loader2,
  Download,
  Eye,
  LogOut,
  User,
  CreditCard,
  Zap,
  Crown,
  Home,
  History,
  Activity,
  AlertCircle,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  Scan,
  Database,
  Radio,
  TrendingUp,
  CheckCircle2,
  XCircle,
  BarChart3,
  Copy,
  Check,
  MapPin,
  Server,
  Ban,
  Fingerprint,
  Shuffle,
  Coins,
  AtSign,
  Trash2,
  Lock,
  Signal,
  Hash,
  FileCheck,
  Globe2,
  Type,
  ExternalLink,
  LinkIcon,
  Bug,
  Info,
  Bot,
  Key,
  Users,
  MessageSquare,
  Sparkles,
  Menu,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface CheckResult {
  type: string;
  target: string;
  riskScore: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  summary: string;
  details: Record<string, any>;
  findings: string[];
  sources: string[];
  timestamp: string;
}

const checkTypes = [
  { 
    id: "ip", 
    label: "IP/GEO", 
    icon: Globe, 
    placeholder: "8.8.8.8", 
    description: "Аналіз IP-адреси через ip-api.com для визначення геолокації, ISP провайдера та виявлення VPN/Proxy сервісів",
    shortDescription: "Геолокація, провайдер, чорні списки",
    gradient: "from-blue-500/20 via-cyan-500/10 to-transparent",
    iconColor: "text-blue-400",
    borderColor: "border-blue-500/30 hover:border-blue-400/50",
    glowColor: "shadow-blue-500/20",
    services: [
      { name: "Геолокація", icon: MapPin, desc: "Країна, місто, координати" },
      { name: "ISP Info", icon: Server, desc: "Провайдер, ASN, організація" },
      { name: "Proxy/VPN", icon: ShieldAlert, desc: "Виявлення проксі та VPN" },
      { name: "Blacklists", icon: Ban, desc: "Перевірка спам-листів" },
    ]
  },
  { 
    id: "wallet", 
    label: "Crypto Wallet", 
    icon: Wallet, 
    placeholder: "0x1234...abcd", 
    description: "Аналіз криптовалютних гаманців: патерни адрес, виявлення mixer-сервісів, підтримка ETH/BTC/TRX/SOL/LTC/XRP/DOGE та Bybit/Binance UID",
    shortDescription: "Транзакції, mixers, санкції",
    gradient: "from-orange-500/20 via-yellow-500/10 to-transparent",
    iconColor: "text-orange-400",
    borderColor: "border-orange-500/30 hover:border-orange-400/50",
    glowColor: "shadow-orange-500/20",
    services: [
      { name: "Pattern Analysis", icon: Fingerprint, desc: "Аналіз формату адреси" },
      { name: "Mixer Detection", icon: Shuffle, desc: "Виявлення Tornado Cash та ін." },
      { name: "Multi-Chain", icon: Coins, desc: "ETH, BTC, TRX, SOL, LTC, XRP, DOGE" },
      { name: "Exchange UID", icon: Hash, desc: "Bybit, Binance UID перевірка" },
    ]
  },
  { 
    id: "email", 
    label: "Email OSINT", 
    icon: Mail, 
    placeholder: "user@example.com", 
    description: "OSINT-аналіз email: валідація домену, виявлення disposable-адрес, перевірка на витоки даних (breaches)",
    shortDescription: "Витоки даних, пов'язані акаунти",
    gradient: "from-purple-500/20 via-pink-500/10 to-transparent",
    iconColor: "text-purple-400",
    borderColor: "border-purple-500/30 hover:border-purple-400/50",
    glowColor: "shadow-purple-500/20",
    services: [
      { name: "Domain Check", icon: AtSign, desc: "Валідація MX та домену" },
      { name: "Disposable", icon: Trash2, desc: "Виявлення тимчасових email" },
      { name: "Breach Check", icon: Lock, desc: "Перевірка на витоки даних" },
      { name: "OSINT Scan", icon: Search, desc: "Пошук пов'язаних акаунтів" },
    ]
  },
  { 
    id: "phone", 
    label: "Phone Lookup", 
    icon: Phone, 
    placeholder: "+380501234567", 
    description: "Аналіз телефонних номерів: визначення коду країни, ідентифікація оператора зв'язку, валідація формату",
    shortDescription: "Оператор, регіон, спам-рейтинг",
    gradient: "from-green-500/20 via-emerald-500/10 to-transparent",
    iconColor: "text-green-400",
    borderColor: "border-green-500/30 hover:border-green-400/50",
    glowColor: "shadow-green-500/20",
    services: [
      { name: "Country Code", icon: Globe2, desc: "Визначення країни за кодом" },
      { name: "Carrier ID", icon: Signal, desc: "Ідентифікація оператора" },
      { name: "Format Check", icon: FileCheck, desc: "Валідація формату номера" },
      { name: "Type Detection", icon: Phone, desc: "Мобільний / стаціонарний" },
    ]
  },
  { 
    id: "domain", 
    label: "Domain Intel", 
    icon: Building, 
    placeholder: "example.com", 
    description: "Інтелект по домену: аналіз TLD, виявлення typosquatting-атак, пошук підозрілих патернів у назві",
    shortDescription: "WHOIS, DNS, репутація",
    gradient: "from-indigo-500/20 via-violet-500/10 to-transparent",
    iconColor: "text-indigo-400",
    borderColor: "border-indigo-500/30 hover:border-indigo-400/50",
    glowColor: "shadow-indigo-500/20",
    services: [
      { name: "TLD Analysis", icon: Globe, desc: "Аналіз доменної зони" },
      { name: "Typosquatting", icon: Type, desc: "Виявлення схожих доменів" },
      { name: "Patterns", icon: AlertTriangle, desc: "Підозрілі патерни в назві" },
      { name: "Reputation", icon: ShieldCheck, desc: "Перевірка репутації" },
    ]
  },
  { 
    id: "url", 
    label: "URL Scanner", 
    icon: Link2, 
    placeholder: "https://example.com/path", 
    description: "Сканування URL: аналіз протоколу, виявлення shortener-сервісів, детекція фішингових патернів",
    shortDescription: "Malware, фішинг, редиректи",
    gradient: "from-red-500/20 via-rose-500/10 to-transparent",
    iconColor: "text-red-400",
    borderColor: "border-red-500/30 hover:border-red-400/50",
    glowColor: "shadow-red-500/20",
    services: [
      { name: "Protocol", icon: LinkIcon, desc: "Аналіз HTTP/HTTPS протоколу" },
      { name: "Shorteners", icon: ExternalLink, desc: "Виявлення bit.ly, t.co та ін." },
      { name: "Phishing", icon: Bug, desc: "Детекція фішингових URL" },
      { name: "Redirect Scan", icon: ChevronRight, desc: "Аналіз редиректів" },
    ]
  },
  { 
    id: "bot", 
    label: "Bot Token", 
    icon: Bot, 
    placeholder: "123456789:ABC-DEF...", 
    description: "Перевірка Telegram Bot Token: валідація через API, інформація про бота, аналіз можливостей та безпеки токену",
    shortDescription: "Валідність, права, безпека",
    gradient: "from-cyan-500/20 via-teal-500/10 to-transparent",
    iconColor: "text-cyan-400",
    borderColor: "border-cyan-500/30 hover:border-cyan-400/50",
    glowColor: "shadow-cyan-500/20",
    services: [
      { name: "Token Verify", icon: Key, desc: "Перевірка валідності токену" },
      { name: "Bot Info", icon: Bot, desc: "Username, ім'я, ID бота" },
      { name: "Permissions", icon: Users, desc: "Права доступу до груп" },
      { name: "Capabilities", icon: Sparkles, desc: "Inline, WebApp, бізнес" },
    ]
  },
  { 
    id: "cve", 
    label: "CVE Scan", 
    icon: Bug, 
    placeholder: "CVE-2024-1234", 
    description: "Перевірка CVE вразливостей через NVD NIST API: CVSS скоринг, опис, рекомендації, CISA KEV каталог",
    shortDescription: "Вразливості, CVSS, рекомендації",
    gradient: "from-rose-500/20 via-red-500/10 to-transparent",
    iconColor: "text-rose-400",
    borderColor: "border-rose-500/30 hover:border-rose-400/50",
    glowColor: "shadow-rose-500/20",
    services: [
      { name: "NVD Lookup", icon: Database, desc: "Пошук в базі NVD NIST" },
      { name: "CVSS Score", icon: AlertCircle, desc: "Оцінка критичності" },
      { name: "CISA KEV", icon: ShieldAlert, desc: "Каталог активних вразливостей" },
      { name: "Recommendations", icon: FileText, desc: "Рекомендації щодо виправлення" },
    ]
  },
  { 
    id: "hash", 
    label: "Hash Check", 
    icon: Hash, 
    placeholder: "d41d8cd98f00b204e9800998ecf8427e", 
    description: "Перевірка MD5/SHA1/SHA256 хешів файлів на malware через MalwareBazaar, URLhaus, VirusTotal",
    shortDescription: "Malware, сигнатури, репутація",
    gradient: "from-slate-500/20 via-zinc-500/10 to-transparent",
    iconColor: "text-slate-400",
    borderColor: "border-slate-500/30 hover:border-slate-400/50",
    glowColor: "shadow-slate-500/20",
    services: [
      { name: "MalwareBazaar", icon: Bug, desc: "База шкідливих файлів" },
      { name: "URLhaus", icon: Link2, desc: "Перевірка URL-асоціацій" },
      { name: "VirusTotal", icon: Shield, desc: "Мультисканер антивірусів" },
      { name: "Signature Match", icon: FileCheck, desc: "Пошук відомих сигнатур" },
    ]
  },
  { 
    id: "username", 
    label: "Username OSINT", 
    icon: User, 
    placeholder: "johndoe", 
    description: "OSINT пошук по username на різних платформах: GitHub, соціальні мережі, форуми",
    shortDescription: "Профілі, соцмережі, витоки",
    gradient: "from-amber-500/20 via-yellow-500/10 to-transparent",
    iconColor: "text-amber-400",
    borderColor: "border-amber-500/30 hover:border-amber-400/50",
    glowColor: "shadow-amber-500/20",
    services: [
      { name: "GitHub Profile", icon: Users, desc: "Профіль та репозиторії" },
      { name: "Social Media", icon: Globe, desc: "Соціальні мережі" },
      { name: "Forums", icon: MessageSquare, desc: "Форуми та спільноти" },
      { name: "Data Breaches", icon: Lock, desc: "Перевірка витоків даних" },
    ]
  },
];

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: Home, href: "/dashboard" },
  { id: "history", label: "Історія", icon: History, href: "/history" },
  { id: "monitoring", label: "Моніторинг", icon: Activity, href: "/monitoring" },
  { id: "referral", label: "Рефералка", icon: Users, href: "/referral" },
];

const recentChecks = [
  { target: "192.168.1.1", type: "IP", status: "safe", time: "5 хв тому" },
  { target: "test@mail.com", type: "Email", status: "warning", time: "12 хв тому" },
  { target: "0x1a2b...", type: "Wallet", status: "danger", time: "1 год тому" },
];

function TierBadge({ tier }: { tier: string }) {
  const config = {
    FREE: { 
      icon: Zap, 
      className: "bg-zinc-800 text-zinc-300 border-zinc-700",
      glow: ""
    },
    PRO: { 
      icon: Crown, 
      className: "bg-gradient-to-r from-blue-600 to-cyan-500 text-white border-blue-400/50",
      glow: "shadow-[0_0_15px_rgba(59,130,246,0.3)]"
    },
    ELITE: { 
      icon: ShieldAlert, 
      className: "bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white border-purple-400/50",
      glow: "shadow-[0_0_20px_rgba(168,85,247,0.4)]"
    },
  };
  
  const { icon: Icon, className, glow } = config[tier as keyof typeof config] || config.FREE;
  
  return (
    <Badge className={`${className} ${glow} border px-2 py-0.5 text-xs font-bold tracking-wider`}>
      <Icon className="w-3 h-3 mr-1" />
      {tier}
    </Badge>
  );
}

function RiskBadge({ level, score }: { level: string; score: number }) {
  const config = {
    critical: {
      className: "bg-gradient-to-r from-red-600 to-rose-500 text-white border-red-400/50",
      glow: "shadow-[0_0_20px_rgba(239,68,68,0.5)] animate-pulse",
      icon: AlertCircle,
      label: "КРИТИЧНИЙ"
    },
    high: {
      className: "bg-gradient-to-r from-orange-600 to-amber-500 text-white border-orange-400/50",
      glow: "shadow-[0_0_15px_rgba(249,115,22,0.4)]",
      icon: AlertTriangle,
      label: "ВИСОКИЙ"
    },
    medium: {
      className: "bg-gradient-to-r from-yellow-600 to-amber-400 text-black border-yellow-400/50",
      glow: "shadow-[0_0_12px_rgba(234,179,8,0.3)]",
      icon: Clock,
      label: "СЕРЕДНІЙ"
    },
    low: {
      className: "bg-gradient-to-r from-green-600 to-emerald-500 text-white border-green-400/50",
      glow: "shadow-[0_0_12px_rgba(34,197,94,0.3)]",
      icon: ShieldCheck,
      label: "НИЗЬКИЙ"
    },
  };
  
  const { className, glow, icon: Icon, label } = config[level as keyof typeof config] || config.low;
  
  return (
    <Badge className={`${className} ${glow} border px-3 py-1 text-sm font-bold tracking-wide`}>
      <Icon className="w-4 h-4 mr-1.5" />
      {label} — {score}/100
    </Badge>
  );
}

const TRC20_ADDRESS = "TRYbty4Ew9knf61brdrixeY5M34mQTt3zY";

export default function Dashboard() {
  const [selectedType, setSelectedType] = useState("ip");
  const [inputValue, setInputValue] = useState("");
  const [result, setResult] = useState<CheckResult | null>(null);
  const [showSubscription, setShowSubscription] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [txHash, setTxHash] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast, dismiss } = useToast();
  const queryClient = useQueryClient();
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const [location, setLocation] = useLocation();

  const paymentMutation = useMutation({
    mutationFn: async ({ tier, txHash }: { tier: string; txHash?: string }) => {
      const res = await apiRequest("POST", "/api/payment-request", { tier, txHash: txHash || undefined });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Заявку відправлено!",
        description: `Заявка #${data.paymentId} створена. Очікуйте підтвердження від адміністратора.`,
      });
      setTxHash("");
      setShowSubscription(false);
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося відправити заявку",
        variant: "destructive",
      });
    },
  });

  const handlePaymentRequest = (tier: "pro" | "enterprise") => {
    paymentMutation.mutate({ tier, txHash: txHash.trim() || undefined });
  };

  useEffect(() => {
    dismiss();
  }, [location]);

  const copyAddress = async () => {
    await navigator.clipboard.writeText(TRC20_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const checkMutation = useMutation({
    mutationFn: async ({ type, value }: { type: string; value: string }) => {
      const res = await apiRequest("POST", "/api/check", { type, value });
      return res.json();
    },
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося виконати перевірку",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [isLoading, isAuthenticated, setLocation]);

  const handleLogout = async () => {
    await logout();
    setLocation("/login");
  };

  const handleCheck = () => {
    const value = inputValue.trim() || inputRef.current?.value?.trim() || "";
    if (!value) {
      toast({
        title: "Помилка",
        description: "Введіть значення для перевірки",
        variant: "destructive",
      });
      return;
    }
    checkMutation.mutate({ type: selectedType, value });
  };

  const selectedCheck = checkTypes.find(c => c.id === selectedType);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <Shield className="w-6 h-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-muted-foreground font-mono text-sm">Завантаження системи...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex overflow-hidden max-w-full">
      <aside className="hidden lg:flex flex-col w-[280px] min-w-[280px] border-r border-white/5 bg-black/50 backdrop-blur-2xl">
        <div className="p-6 border-b border-white/5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-cyan-500/5" />
          <Link href="/">
            <div className="relative flex items-center gap-3 group cursor-pointer">
              <motion.div 
                className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary via-emerald-400 to-cyan-400 flex items-center justify-center shadow-[0_0_25px_rgba(34,197,94,0.4)] group-hover:shadow-[0_0_35px_rgba(34,197,94,0.6)] transition-all duration-500"
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
              >
                <Shield className="w-6 h-6 text-black" />
              </motion.div>
              <div>
                <h1 className="font-display font-bold text-xl tracking-tight bg-gradient-to-r from-white via-white to-primary bg-clip-text">DARKSHARE</h1>
                <p className="text-[10px] text-muted-foreground tracking-[0.2em]">SECURITY OSINT</p>
              </div>
            </div>
          </Link>
        </div>
        
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.id} href={item.href}>
                <motion.button
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                    isActive 
                      ? "bg-gradient-to-r from-primary/20 via-primary/10 to-transparent text-primary border border-primary/30 shadow-[0_0_20px_rgba(34,197,94,0.15)]" 
                      : "text-muted-foreground hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  data-testid={`nav-${item.id}`}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-primary' : ''}`} />
                  {item.label}
                  {isActive && (
                    <motion.div
                      className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(34,197,94,0.8)]"
                      layoutId="navIndicator"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </motion.button>
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-3">
          <div className="p-4 rounded-xl bg-gradient-to-br from-white/5 via-transparent to-transparent border border-white/10 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-semibold text-white/80">Статистика</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
                <p className="text-lg font-bold text-primary font-mono">247</p>
                <p className="text-[10px] text-muted-foreground">Перевірок</p>
              </div>
              <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
                <p className="text-lg font-bold text-orange-400 font-mono">12</p>
                <p className="text-[10px] text-muted-foreground">Загроз</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 py-2 flex-1">
          <div className="p-4 rounded-xl bg-gradient-to-br from-white/5 via-transparent to-transparent border border-white/10 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-semibold text-white/80">Останні перевірки</span>
            </div>
            <div className="space-y-2">
              {recentChecks.map((check, idx) => (
                <motion.div
                  key={idx}
                  className="flex items-center gap-2 p-2 rounded-lg bg-black/30 border border-white/5 hover:border-white/10 transition-colors cursor-pointer"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1, duration: 0.3 }}
                  whileHover={{ x: 2 }}
                >
                  {check.status === 'safe' && <CheckCircle2 className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />}
                  {check.status === 'warning' && <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />}
                  {check.status === 'danger' && <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono truncate text-white/80">{check.target}</p>
                    <p className="text-[10px] text-muted-foreground">{check.type} · {check.time}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="p-4 border-t border-white/5 mt-auto">
          <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 via-cyan-500/5 to-transparent border border-primary/20 backdrop-blur-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="w-12 h-12 border-2 border-primary/40 shadow-[0_0_15px_rgba(34,197,94,0.2)]">
                <AvatarImage src={user?.photoUrl} />
                <AvatarFallback className="bg-gradient-to-br from-primary/30 to-cyan-500/20 text-primary font-bold">
                  {user?.username?.slice(0, 2).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">@{user?.username}</p>
                <TierBadge tier={user?.tier || "FREE"} />
              </div>
            </div>
            
            <div className="space-y-1.5 mb-3 text-[10px]">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Telegram ID</span>
                <span className="font-mono text-cyan-400">{user?.tgId || "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Ref. code</span>
                <span className="font-mono text-primary">{user?.refCode || "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Zap className="w-3 h-3 text-orange-400" />
                  Streak
                </span>
                <span className="font-mono text-orange-400">{user?.streakDays ?? 0}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Залишилось запитів</span>
                <span className="font-mono text-primary font-bold">{user?.requestsLeft ?? 0}/15</span>
              </div>
              <div className="h-2.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                <motion.div 
                  className="h-full bg-gradient-to-r from-primary via-emerald-400 to-cyan-400 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(((user?.requestsLeft ?? 0) / 15) * 100, 100)}%` }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                />
              </div>
            </div>
            
            <div className="mt-2 pt-2 border-t border-white/5">
              <div className="flex items-center gap-1.5 text-[9px] text-emerald-400">
                <CheckCircle2 className="w-3 h-3" />
                <span>Bot sync OK</span>
              </div>
            </div>
          </div>
          
          <div className="mt-3 space-y-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full justify-start text-muted-foreground hover:text-cyan-400 hover:bg-cyan-500/10 transition-all duration-300"
              onClick={() => setShowProfile(true)}
              data-testid="button-profile"
            >
              <User className="w-4 h-4 mr-2" />
              Профіль
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full justify-start text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-300"
              onClick={() => setShowSubscription(true)}
              data-testid="button-subscription"
            >
              <Crown className="w-4 h-4 mr-2" />
              Підписка
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full justify-start text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all duration-300"
              onClick={handleLogout}
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Вийти
            </Button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen max-w-full overflow-hidden">
        <motion.header 
          className="lg:hidden sticky top-0 z-50 bg-gradient-to-b from-black via-black/95 to-black/90 backdrop-blur-2xl"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-cyan-500/5 to-purple-500/5" />
          <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          <div className="relative flex items-center justify-between px-4 py-3 max-w-full">
            <Link href="/">
              <motion.div 
                className="flex items-center gap-2.5 min-w-0"
                whileTap={{ scale: 0.97 }}
              >
                <motion.div 
                  className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary via-emerald-400 to-cyan-400 flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.4)] flex-shrink-0"
                  whileHover={{ rotate: 5, scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                >
                  <Shield className="w-4.5 h-4.5 text-black" />
                </motion.div>
                <div className="flex flex-col">
                  <span className="font-display font-bold text-sm tracking-tight bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">DARKSHARE</span>
                  <span className="text-[8px] text-primary/60 tracking-[0.15em] font-medium">SECURITY OSINT</span>
                </div>
              </motion.div>
            </Link>
            <div className="flex items-center gap-2 flex-shrink-0">
              <motion.div 
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gradient-to-r from-green-500/10 to-transparent border border-green-500/20"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[9px] font-medium text-green-400 hidden xs:inline">Online</span>
              </motion.div>
              
              <Sheet open={showMobileMenu} onOpenChange={setShowMobileMenu}>
                <SheetTrigger asChild>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="w-11 h-11 rounded-xl border border-white/10 bg-white/5"
                    data-testid="button-hamburger-menu"
                  >
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent 
                  side="left" 
                  className="w-[300px] bg-black/98 border-r border-white/10 backdrop-blur-2xl p-0"
                >
                  <SheetHeader className="p-5 border-b border-white/10 bg-gradient-to-br from-primary/5 via-transparent to-cyan-500/5">
                    <SheetTitle className="flex items-center gap-3">
                      <Avatar className="w-12 h-12 border-2 border-primary/40 shadow-[0_0_15px_rgba(34,197,94,0.2)]">
                        <AvatarImage src={user?.photoUrl} />
                        <AvatarFallback className="bg-gradient-to-br from-primary/30 to-cyan-500/20 text-primary font-bold text-lg">
                          {user?.username?.slice(0, 2).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="font-semibold text-base truncate text-white">@{user?.username}</p>
                        <TierBadge tier={user?.tier || "FREE"} />
                      </div>
                    </SheetTitle>
                  </SheetHeader>
                  
                  <div className="p-4 space-y-1 flex flex-col h-[calc(100%-100px)]">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Залишилось запитів</span>
                        <span className="font-mono text-primary font-bold">{user?.requestsLeft ?? 0}/15</span>
                      </div>
                      <div className="h-2.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                        <motion.div 
                          className="h-full bg-gradient-to-r from-primary via-emerald-400 to-cyan-400 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(((user?.requestsLeft ?? 0) / 15) * 100, 100)}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                    
                    <nav className="space-y-1">
                      {navItems.map((item) => {
                        const isActive = location === item.href;
                        return (
                          <Link key={item.id} href={item.href}>
                            <motion.button
                              onClick={() => setShowMobileMenu(false)}
                              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-medium transition-all duration-300 min-h-[48px] ${
                                isActive 
                                  ? "bg-gradient-to-r from-primary/20 via-primary/10 to-transparent text-primary border border-primary/30" 
                                  : "text-muted-foreground hover:text-white hover:bg-white/5 border border-transparent"
                              }`}
                              whileTap={{ scale: 0.98 }}
                              data-testid={`mobile-nav-${item.id}`}
                            >
                              <item.icon className={`w-5 h-5 ${isActive ? 'text-primary' : ''}`} />
                              {item.label}
                              {isActive && (
                                <motion.div
                                  className="ml-auto w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(34,197,94,0.8)]"
                                  layoutId="mobileNavIndicator"
                                />
                              )}
                            </motion.button>
                          </Link>
                        );
                      })}
                    </nav>
                    
                    <div className="flex-1" />
                    
                    <div className="pt-4 border-t border-white/10 space-y-1 mt-auto">
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start text-muted-foreground hover:text-cyan-400 hover:bg-cyan-500/10 h-12 rounded-xl text-base"
                        onClick={() => {
                          setShowMobileMenu(false);
                          setShowProfile(true);
                        }}
                        data-testid="menu-button-profile"
                      >
                        <User className="w-5 h-5 mr-3" />
                        Профіль
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start text-muted-foreground hover:text-primary hover:bg-primary/10 h-12 rounded-xl text-base"
                        onClick={() => {
                          setShowMobileMenu(false);
                          setShowSubscription(true);
                        }}
                        data-testid="menu-button-subscription"
                      >
                        <Crown className="w-5 h-5 mr-3" />
                        Підписка
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10 h-12 rounded-xl text-base"
                        onClick={() => {
                          setShowMobileMenu(false);
                          handleLogout();
                        }}
                        data-testid="menu-button-logout"
                      >
                        <LogOut className="w-5 h-5 mr-3" />
                        Вийти
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </motion.header>

        <main className="flex-1 p-3 lg:p-8 overflow-auto max-w-full">
          <div className="max-w-6xl mx-auto space-y-6 lg:space-y-8">
            <div className="hidden lg:block relative">
              <div className="absolute inset-x-0 -bottom-4 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
              <motion.div 
                className="flex items-center justify-between p-6 rounded-2xl bg-gradient-to-br from-black/60 via-black/40 to-transparent border border-white/10 backdrop-blur-xl shadow-[0_0_40px_rgba(0,0,0,0.3)]"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                <div>
                  <h1 className="text-3xl font-display font-bold flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-cyan-500/10 border border-primary/20">
                      <Scan className="w-7 h-7 text-primary" />
                    </div>
                    <span className="bg-gradient-to-r from-white via-white to-primary/80 bg-clip-text text-transparent">Security Scanner</span>
                  </h1>
                  <p className="text-muted-foreground mt-2 ml-14">Виберіть тип перевірки та введіть дані для аналізу</p>
                </div>
                <div className="flex items-center gap-4">
                  <motion.div 
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-green-500/10 to-transparent border border-green-500/20 backdrop-blur-sm"
                    animate={{ 
                      boxShadow: ["0 0 15px rgba(34,197,94,0.1)", "0 0 25px rgba(34,197,94,0.2)", "0 0 15px rgba(34,197,94,0.1)"]
                    }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Radio className="w-4 h-4 text-green-400 animate-pulse" />
                    <span className="text-sm font-medium text-green-400">Система активна</span>
                  </motion.div>
                </div>
              </motion.div>
            </div>

            <div className="space-y-4 lg:space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-2.5 lg:gap-3">
                {checkTypes.map((type, idx) => {
                  const isSelected = selectedType === type.id;
                  return (
                    <motion.button
                      key={type.id}
                      onClick={() => {
                        setSelectedType(type.id);
                        setInputValue("");
                        setResult(null);
                      }}
                      className={`relative p-3 sm:p-3.5 lg:p-5 rounded-xl lg:rounded-2xl border transition-all duration-500 overflow-hidden group touch-manipulation min-h-[72px] sm:min-h-[80px] lg:min-h-[100px] ${
                        isSelected
                          ? `${type.borderColor.replace('hover:', '')} bg-gradient-to-br ${type.gradient} backdrop-blur-xl shadow-lg ${type.glowColor}`
                          : `border-white/10 active:border-white/30 bg-black/40 backdrop-blur-sm active:bg-black/60`
                      }`}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.04, duration: 0.3, type: "spring", stiffness: 300 }}
                      whileTap={{ scale: 0.97 }}
                      data-testid={`button-check-type-${type.id}`}
                    >
                      {isSelected && (
                        <motion.div
                          className={`absolute inset-0 bg-gradient-to-br ${type.gradient}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3 }}
                        />
                      )}
                      <div className="relative flex flex-col items-center justify-center gap-1.5 sm:gap-2 lg:gap-3 h-full">
                        <motion.div 
                          className={`w-8 h-8 sm:w-9 sm:h-9 lg:w-12 lg:h-12 rounded-lg lg:rounded-xl flex items-center justify-center ${
                            isSelected ? 'bg-white/15 shadow-inner' : 'bg-white/5'
                          } transition-all duration-300`}
                          animate={isSelected ? { scale: [1, 1.05, 1] } : {}}
                          transition={{ duration: 0.4 }}
                        >
                          <type.icon className={`w-4 h-4 sm:w-4.5 sm:h-4.5 lg:w-6 lg:h-6 ${isSelected ? type.iconColor : 'text-muted-foreground'} transition-colors duration-300 ${isSelected ? 'drop-shadow-[0_0_8px_currentColor]' : ''}`} />
                        </motion.div>
                        <span className={`text-[10px] sm:text-[11px] lg:text-xs font-medium text-center leading-tight line-clamp-2 ${isSelected ? 'text-white' : 'text-muted-foreground'} transition-colors duration-300`}>
                          {type.label}
                        </span>
                      </div>
                      {isSelected && (
                        <motion.div
                          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 lg:w-12 h-0.5 lg:h-1 bg-gradient-to-r from-transparent via-white/60 to-transparent rounded-t-full"
                          layoutId="activeIndicator"
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}
                    </motion.button>
                  );
                })}
              </div>

              <motion.div
                className="relative"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className={`p-3.5 lg:p-8 rounded-2xl border ${selectedCheck?.borderColor} bg-gradient-to-br ${selectedCheck?.gradient} backdrop-blur-xl shadow-[0_0_40px_rgba(0,0,0,0.2)]`}>
                  <AnimatePresence mode="wait">
                    <motion.div 
                      key={selectedType}
                      className="flex items-center gap-2.5 mb-3 lg:mb-4"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.2 }}
                    >
                      {selectedCheck && (
                        <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded-lg lg:rounded-xl flex items-center justify-center bg-white/10 backdrop-blur-sm`}>
                          <selectedCheck.icon className={`w-4 h-4 lg:w-5 lg:h-5 ${selectedCheck.iconColor}`} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display font-semibold text-sm lg:text-lg truncate">{selectedCheck?.label}</h3>
                        <p className="text-[10px] lg:text-sm text-muted-foreground">{selectedCheck?.shortDescription}</p>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                  
                  {selectedCheck?.services && (
                    <motion.div 
                      key={`services-${selectedType}`}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      transition={{ duration: 0.3 }}
                      className="mb-3 lg:mb-4"
                    >
                      <div className="p-3 lg:p-4 rounded-xl bg-black/40 border border-white/5 backdrop-blur-sm">
                        <div className="flex items-center gap-2 mb-2.5">
                          <Info className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-[10px] lg:text-xs font-medium text-muted-foreground uppercase tracking-wider">Що аналізується</span>
                        </div>
                        <p className="text-[10px] lg:text-xs text-muted-foreground/80 mb-3 leading-relaxed">
                          {selectedCheck.description}
                        </p>
                        <div className="grid grid-cols-2 gap-1.5 lg:gap-2">
                          {selectedCheck.services.map((service, idx) => (
                            <motion.div
                              key={service.name}
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.05, duration: 0.2 }}
                              className="flex items-start gap-2 p-2 lg:p-2.5 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
                            >
                              <div className={`w-6 h-6 lg:w-7 lg:h-7 rounded-md flex items-center justify-center flex-shrink-0 ${selectedCheck.iconColor.replace('text-', 'bg-').replace('400', '500/20')}`}>
                                <service.icon className={`w-3 h-3 lg:w-3.5 lg:h-3.5 ${selectedCheck.iconColor}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] lg:text-xs font-medium truncate">{service.name}</p>
                                <p className="text-[9px] lg:text-[10px] text-muted-foreground/70 leading-tight">{service.desc}</p>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                  
                  <div className="flex flex-col gap-2.5 lg:gap-3">
                    <div className="relative w-full">
                      <Terminal className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 lg:w-5 lg:h-5 text-muted-foreground pointer-events-none" />
                      <Input
                        ref={inputRef}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={selectedCheck?.placeholder}
                        className="h-11 lg:h-14 pl-9 lg:pl-12 pr-3 lg:pr-4 text-sm lg:text-lg font-mono bg-black/60 border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/30 rounded-xl placeholder:text-muted-foreground/50 w-full max-w-full touch-manipulation"
                        onKeyDown={(e) => e.key === "Enter" && handleCheck()}
                        data-testid="input-check-value"
                      />
                    </div>
                    <motion.div whileTap={{ scale: 0.98 }}>
                      <Button 
                        onClick={handleCheck} 
                        disabled={checkMutation.isPending}
                        className="h-11 lg:h-14 px-5 lg:px-8 text-sm lg:text-lg font-semibold bg-gradient-to-r from-primary via-emerald-400 to-cyan-400 hover:from-primary/90 hover:via-emerald-400/90 hover:to-cyan-400/90 active:from-primary/80 active:via-emerald-400/80 active:to-cyan-400/80 text-black rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.25)] active:shadow-[0_0_30px_rgba(34,197,94,0.4)] transition-all duration-300 w-full touch-manipulation"
                        data-testid="button-perform-check"
                      >
                        {checkMutation.isPending ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          >
                            <Loader2 className="w-5 h-5" />
                          </motion.div>
                        ) : (
                          <>
                            <Search className="w-4 h-4 lg:w-5 lg:h-5 mr-2" />
                            Сканувати
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </div>

            <AnimatePresence mode="wait">
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="space-y-3 lg:space-y-6"
                >
                  <div className="p-3.5 lg:p-8 rounded-2xl border border-white/10 bg-gradient-to-br from-black/70 via-black/50 to-transparent backdrop-blur-2xl shadow-[0_0_40px_rgba(0,0,0,0.3)]">
                    <div className="flex flex-col gap-3 mb-4 lg:mb-6 pb-4 lg:pb-6 border-b border-white/10">
                      <div className="flex items-center gap-3">
                        <motion.div 
                          className={`w-10 h-10 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl flex items-center justify-center ${
                            result.riskLevel === 'critical' ? 'bg-red-500/20' :
                            result.riskLevel === 'high' ? 'bg-orange-500/20' :
                            result.riskLevel === 'medium' ? 'bg-yellow-500/20' :
                            'bg-green-500/20'
                          }`}
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.3, type: "spring" }}
                        >
                          {result.riskLevel === 'critical' || result.riskLevel === 'high' ? (
                            <AlertTriangle className={`w-5 h-5 lg:w-7 lg:h-7 ${result.riskLevel === 'critical' ? 'text-red-400' : 'text-orange-400'}`} />
                          ) : result.riskLevel === 'medium' ? (
                            <Clock className="w-5 h-5 lg:w-7 lg:h-7 text-yellow-400" />
                          ) : (
                            <ShieldCheck className="w-5 h-5 lg:w-7 lg:h-7 text-green-400" />
                          )}
                        </motion.div>
                        <div className="flex-1 min-w-0">
                          <h2 className="text-base lg:text-2xl font-display font-bold">Результат аналізу</h2>
                          <p className="text-[10px] lg:text-sm text-muted-foreground font-mono">{result.timestamp}</p>
                        </div>
                      </div>
                      <RiskBadge level={result.riskLevel} score={result.riskScore} />
                    </div>

                    <motion.div 
                      className="p-3 lg:p-4 rounded-xl bg-white/5 border border-white/10 mb-3 lg:mb-6"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1, duration: 0.3 }}
                    >
                      <div className="flex items-center gap-2 text-[10px] lg:text-xs text-muted-foreground mb-1.5 lg:mb-2">
                        <Database className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                        Ціль сканування
                      </div>
                      <p className="font-mono text-xs lg:text-xl break-all text-primary leading-relaxed">{result.target}</p>
                    </motion.div>

                    <div className="mb-3 lg:mb-6">
                      <h4 className="text-xs lg:text-sm font-semibold mb-2.5 lg:mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-yellow-500" />
                        Знахідки ({result.findings.length})
                      </h4>
                      <div className="space-y-1.5 lg:space-y-2 max-h-[200px] sm:max-h-[300px] lg:max-h-none overflow-y-auto pr-1">
                        {result.findings.map((finding, idx) => {
                          const isCritical = finding.includes("КРИТИЧНО");
                          const isWarning = finding.includes("УВАГА");
                          const isSafe = finding.includes("не виявлено") || finding.includes("Чиста") || finding.includes("Безпечн");
                          
                          return (
                            <motion.div 
                              key={idx}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.05, duration: 0.3 }}
                              className={`p-2.5 lg:p-4 rounded-xl text-[11px] lg:text-sm flex items-start gap-2 lg:gap-3 border ${
                                isCritical ? "bg-red-500/10 border-red-500/30 text-red-300" :
                                isWarning ? "bg-orange-500/10 border-orange-500/30 text-orange-300" :
                                isSafe ? "bg-green-500/10 border-green-500/30 text-green-300" :
                                "bg-yellow-500/10 border-yellow-500/30 text-yellow-300"
                              }`}
                            >
                              <ChevronRight className="w-3.5 h-3.5 lg:w-4 lg:h-4 mt-0.5 flex-shrink-0" />
                              <span className="leading-relaxed">{finding}</span>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mb-3 lg:mb-6">
                      <h4 className="text-xs lg:text-sm font-semibold mb-2.5 lg:mb-4 flex items-center gap-2">
                        <Terminal className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-primary" />
                        Технічні деталі
                      </h4>
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-1.5 lg:gap-3">
                        {Object.entries(result.details).map(([key, value], idx) => (
                          <motion.div 
                            key={key}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.15 + idx * 0.03, duration: 0.3 }}
                            className="p-2.5 lg:p-4 rounded-lg lg:rounded-xl bg-white/5 border border-white/5 active:border-white/20 transition-all duration-300"
                          >
                            <p className="text-[9px] lg:text-xs text-muted-foreground capitalize mb-0.5 lg:mb-1 truncate">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </p>
                            <p className="font-mono text-[10px] lg:text-sm break-all leading-relaxed">
                              {typeof value === "boolean" ? (
                                <Badge variant={value ? "destructive" : "secondary"} className="text-[9px] lg:text-xs px-1.5">
                                  {value ? "Так" : "Ні"}
                                </Badge>
                              ) : typeof value === "object" ? 
                                JSON.stringify(value) : 
                                String(value)}
                            </p>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2.5 lg:gap-4 pt-3 lg:pt-6 border-t border-white/10">
                      <div className="flex items-center gap-1.5 text-[9px] lg:text-xs text-muted-foreground">
                        <Database className="w-3 h-3 lg:w-4 lg:h-4 flex-shrink-0" />
                        <span className="truncate">Джерела: {result.sources.join(", ")}</span>
                      </div>
                      <div className="flex gap-2 w-full">
                        <motion.div whileTap={{ scale: 0.97 }} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full rounded-xl h-10 text-xs lg:text-sm border-white/10 hover:border-white/20 hover:bg-white/5 touch-manipulation" data-testid="button-download-pdf">
                            <Download className="w-3.5 h-3.5 lg:w-4 lg:h-4 mr-1.5 lg:mr-2" />
                            PDF
                          </Button>
                        </motion.div>
                        <motion.div whileTap={{ scale: 0.97 }} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full rounded-xl h-10 text-xs lg:text-sm border-primary/30 hover:border-primary/50 hover:bg-primary/10 text-primary touch-manipulation" data-testid="button-add-to-monitor">
                            <Eye className="w-3.5 h-3.5 lg:w-4 lg:h-4 mr-1.5 lg:mr-2" />
                            Моніторити
                          </Button>
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {!result && (
              <motion.div 
                className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                {[
                  { icon: Shield, label: "Перевірок", value: "12.4K+", color: "text-primary", gradient: "from-primary/20 to-transparent", border: "border-primary/20" },
                  { icon: AlertTriangle, label: "Загроз виявлено", value: "847", color: "text-orange-400", gradient: "from-orange-500/20 to-transparent", border: "border-orange-500/20" },
                  { icon: Database, label: "Баз даних", value: "50+", color: "text-blue-400", gradient: "from-blue-500/20 to-transparent", border: "border-blue-500/20" },
                  { icon: TrendingUp, label: "Uptime", value: "99.9%", color: "text-green-400", gradient: "from-green-500/20 to-transparent", border: "border-green-500/20" },
                ].map((stat, idx) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + idx * 0.1, duration: 0.4 }}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    className={`p-4 lg:p-6 rounded-xl lg:rounded-2xl border ${stat.border} bg-gradient-to-br ${stat.gradient} backdrop-blur-sm hover:border-white/20 transition-all duration-300 group`}
                  >
                    <stat.icon className={`w-5 h-5 lg:w-6 lg:h-6 ${stat.color} mb-2 lg:mb-3 group-hover:scale-110 transition-transform duration-300`} />
                    <p className="text-xl lg:text-2xl font-display font-bold">{stat.value}</p>
                    <p className="text-[10px] lg:text-sm text-muted-foreground">{stat.label}</p>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </main>

      </div>

      <Dialog open={showProfile} onOpenChange={setShowProfile}>
        <DialogContent className="bg-black/95 border-cyan-500/30 backdrop-blur-xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-display flex items-center gap-2">
              <User className="w-5 h-5 text-cyan-400" />
              Мій профіль
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Акаунт синхронізований з ботом
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-gradient-to-br from-cyan-500/10 to-transparent border border-cyan-500/20">
                <div className="text-[10px] text-muted-foreground mb-1">Telegram ID</div>
                <div className="font-mono text-cyan-400 text-sm" data-testid="text-tg-id">{user?.tgId || "—"}</div>
              </div>
              <div className="p-3 rounded-lg bg-gradient-to-br from-primary/10 to-transparent border border-primary/20">
                <div className="text-[10px] text-muted-foreground mb-1">Username</div>
                <div className="font-mono text-primary text-sm" data-testid="text-username">@{user?.username || "—"}</div>
              </div>
              <div className="p-3 rounded-lg bg-gradient-to-br from-yellow-500/10 to-transparent border border-yellow-500/20">
                <div className="text-[10px] text-muted-foreground mb-1">Тариф</div>
                <div className="font-mono text-yellow-400 text-sm" data-testid="text-tier">{user?.tier || "FREE"}</div>
              </div>
              <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20">
                <div className="text-[10px] text-muted-foreground mb-1">Залишилось</div>
                <div className="font-mono text-blue-400 text-sm" data-testid="text-requests-left">{user?.requestsLeft ?? 0}/15</div>
              </div>
              <div className="p-3 rounded-lg bg-gradient-to-br from-orange-500/10 to-transparent border border-orange-500/20">
                <div className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Серія
                </div>
                <div className="font-mono text-orange-400 text-sm" data-testid="text-streak">{user?.streakDays ?? 0} днів</div>
              </div>
              <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20">
                <div className="text-[10px] text-muted-foreground mb-1">Реф. код</div>
                <div className="font-mono text-purple-400 text-sm" data-testid="text-ref-code">{user?.refCode || "—"}</div>
              </div>
            </div>
            
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2" data-testid="status-bot-sync">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-emerald-400">Синхронізація з ботом активна</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showSubscription} onOpenChange={setShowSubscription}>
        <DialogContent className="bg-black/95 border-primary/30 backdrop-blur-xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-display flex items-center gap-2">
              <Crown className="w-5 h-5 text-primary" />
              Тарифні плани
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Оберіть план та подайте заявку на активацію
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/30">
              <div className="text-xs text-muted-foreground mb-2">Адреса оплати (TRC20 USDT)</div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs font-mono text-primary bg-black/50 p-2 rounded-lg break-all select-all">
                  {TRC20_ADDRESS}
                </code>
                <Button
                  size="icon"
                  variant="outline"
                  className="flex-shrink-0 border-primary/30 hover:bg-primary/20"
                  onClick={copyAddress}
                  data-testid="button-copy-address"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-primary" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">TX Hash (опціонально)</label>
              <Input
                placeholder="Введіть TX Hash транзакції..."
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                className="bg-black/50 border-white/10 focus:border-primary/50"
                data-testid="input-tx-hash"
              />
            </div>

            <div className="space-y-2">
              <Button
                onClick={() => handlePaymentRequest("pro")}
                disabled={paymentMutation.isPending}
                className="w-full p-4 h-auto rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 border border-blue-500/30 transition-all"
                data-testid="button-submit-pro"
              >
                {paymentMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Shield className="w-4 h-4 mr-2" />
                )}
                <div className="flex items-center justify-between w-full">
                  <span className="font-semibold">Подати заявку на PRO</span>
                  <span className="text-sm opacity-80">$10</span>
                </div>
              </Button>
              
              <Button
                onClick={() => handlePaymentRequest("enterprise")}
                disabled={paymentMutation.isPending}
                className="w-full p-4 h-auto rounded-xl bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 border border-purple-500/30 transition-all"
                data-testid="button-submit-enterprise"
              >
                {paymentMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Crown className="w-4 h-4 mr-2" />
                )}
                <div className="flex items-center justify-between w-full">
                  <span className="font-semibold">Подати заявку на ENTERPRISE</span>
                  <span className="text-sm opacity-80">$50</span>
                </div>
              </Button>
            </div>

            <div className="pt-2 border-t border-white/10">
              <p className="text-xs text-muted-foreground text-center">
                Заявка буде відправлена адміністратору в Telegram для підтвердження
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
