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
  Radio
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
    description: "Геолокація, провайдер, чорні списки",
    gradient: "from-blue-500/20 via-cyan-500/10 to-transparent",
    iconColor: "text-blue-400",
    borderColor: "border-blue-500/30 hover:border-blue-400/50"
  },
  { 
    id: "wallet", 
    label: "Crypto Wallet", 
    icon: Wallet, 
    placeholder: "0x1234...abcd", 
    description: "Транзакції, mixers, санкції",
    gradient: "from-orange-500/20 via-yellow-500/10 to-transparent",
    iconColor: "text-orange-400",
    borderColor: "border-orange-500/30 hover:border-orange-400/50"
  },
  { 
    id: "email", 
    label: "Email OSINT", 
    icon: Mail, 
    placeholder: "user@example.com", 
    description: "Витоки даних, пов'язані акаунти",
    gradient: "from-purple-500/20 via-pink-500/10 to-transparent",
    iconColor: "text-purple-400",
    borderColor: "border-purple-500/30 hover:border-purple-400/50"
  },
  { 
    id: "phone", 
    label: "Phone Lookup", 
    icon: Phone, 
    placeholder: "+380501234567", 
    description: "Оператор, регіон, спам-рейтинг",
    gradient: "from-green-500/20 via-emerald-500/10 to-transparent",
    iconColor: "text-green-400",
    borderColor: "border-green-500/30 hover:border-green-400/50"
  },
  { 
    id: "domain", 
    label: "Domain Intel", 
    icon: Building, 
    placeholder: "example.com", 
    description: "WHOIS, DNS, репутація",
    gradient: "from-indigo-500/20 via-violet-500/10 to-transparent",
    iconColor: "text-indigo-400",
    borderColor: "border-indigo-500/30 hover:border-indigo-400/50"
  },
  { 
    id: "url", 
    label: "URL Scanner", 
    icon: Link2, 
    placeholder: "https://example.com/path", 
    description: "Malware, фішинг, редиректи",
    gradient: "from-red-500/20 via-rose-500/10 to-transparent",
    iconColor: "text-red-400",
    borderColor: "border-red-500/30 hover:border-red-400/50"
  },
];

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: Home, href: "/dashboard" },
  { id: "history", label: "Історія", icon: History, href: "/history" },
  { id: "monitoring", label: "Моніторинг", icon: Activity, href: "/monitoring" },
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

export default function Dashboard() {
  const [selectedType, setSelectedType] = useState("ip");
  const [inputValue, setInputValue] = useState("");
  const [result, setResult] = useState<CheckResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const [location, setLocation] = useLocation();

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
    <div className="min-h-screen bg-background flex">
      <aside className="hidden lg:flex flex-col w-64 border-r border-white/5 bg-black/40 backdrop-blur-xl">
        <div className="p-6 border-b border-white/5">
          <Link href="/">
            <div className="flex items-center gap-3 group cursor-pointer">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.3)] group-hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] transition-all">
                <Shield className="w-5 h-5 text-black" />
              </div>
              <div>
                <h1 className="font-display font-bold text-lg tracking-tight">DARKSHARE</h1>
                <p className="text-[10px] text-muted-foreground tracking-widest">SECURITY OSINT</p>
              </div>
            </div>
          </Link>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.id} href={item.href}>
                <button
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    isActive 
                      ? "bg-primary/20 text-primary border border-primary/30" 
                      : "text-muted-foreground hover:text-white hover:bg-white/5"
                  }`}
                  data-testid={`nav-${item.id}`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </button>
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-white/5">
          <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 via-transparent to-transparent border border-primary/20">
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="w-12 h-12 border-2 border-primary/30">
                <AvatarImage src={user?.photoUrl} />
                <AvatarFallback className="bg-primary/20 text-primary font-bold">
                  {user?.username?.slice(0, 2).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">@{user?.username}</p>
                <TierBadge tier={user?.tier || "FREE"} />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Запитів</span>
                <span className="font-mono text-primary font-bold">{user?.requestsLeft ?? 0}</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(((user?.requestsLeft ?? 0) / 15) * 100, 100)}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
            </div>
          </div>
          
          <div className="mt-3 space-y-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full justify-start text-muted-foreground hover:text-white"
              onClick={() => {
                toast({
                  title: "Поповнення балансу",
                  description: "Скористайтесь Telegram ботом @DARKSHAREN1_BOT",
                });
              }}
              data-testid="button-topup"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Поповнити
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full justify-start text-muted-foreground hover:text-red-400"
              onClick={handleLogout}
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Вийти
            </Button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="lg:hidden sticky top-0 z-50 border-b border-white/5 bg-black/80 backdrop-blur-xl">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center">
                <Shield className="w-5 h-5 text-black" />
              </div>
              <span className="font-display font-bold">DARKSHARE</span>
            </div>
            <div className="flex items-center gap-2">
              <TierBadge tier={user?.tier || "FREE"} />
              <Avatar className="w-8 h-8 border border-white/10">
                <AvatarImage src={user?.photoUrl} />
                <AvatarFallback className="bg-primary/20 text-primary text-xs">
                  {user?.username?.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="hidden lg:flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-display font-bold flex items-center gap-3">
                  <Scan className="w-8 h-8 text-primary" />
                  Security Scanner
                </h1>
                <p className="text-muted-foreground mt-1">Виберіть тип перевірки та введіть дані для аналізу</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10">
                  <Radio className="w-4 h-4 text-green-400 animate-pulse" />
                  <span className="text-sm text-muted-foreground">Система активна</span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
                {checkTypes.map((type) => {
                  const isSelected = selectedType === type.id;
                  return (
                    <motion.button
                      key={type.id}
                      onClick={() => {
                        setSelectedType(type.id);
                        setInputValue("");
                        setResult(null);
                      }}
                      className={`relative p-4 lg:p-5 rounded-xl border transition-all overflow-hidden group ${
                        isSelected
                          ? `${type.borderColor.replace('hover:', '')} bg-gradient-to-br ${type.gradient}`
                          : `border-white/10 hover:border-white/20 bg-black/40`
                      }`}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      data-testid={`button-check-type-${type.id}`}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${type.gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />
                      <div className="relative flex flex-col items-center gap-2 lg:gap-3">
                        <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-lg flex items-center justify-center ${
                          isSelected ? 'bg-white/10' : 'bg-white/5 group-hover:bg-white/10'
                        } transition-colors`}>
                          <type.icon className={`w-5 h-5 lg:w-6 lg:h-6 ${isSelected ? type.iconColor : 'text-muted-foreground group-hover:' + type.iconColor} transition-colors`} />
                        </div>
                        <span className={`text-xs lg:text-sm font-medium text-center ${isSelected ? 'text-white' : 'text-muted-foreground group-hover:text-white'} transition-colors`}>
                          {type.label}
                        </span>
                      </div>
                      {isSelected && (
                        <motion.div
                          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-t-full"
                          layoutId="activeIndicator"
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
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
                transition={{ duration: 0.3 }}
              >
                <div className={`p-6 lg:p-8 rounded-2xl border ${selectedCheck?.borderColor} bg-gradient-to-br ${selectedCheck?.gradient} backdrop-blur-sm`}>
                  <div className="flex items-center gap-3 mb-4">
                    {selectedCheck && <selectedCheck.icon className={`w-6 h-6 ${selectedCheck.iconColor}`} />}
                    <div>
                      <h3 className="font-display font-semibold text-lg">{selectedCheck?.label}</h3>
                      <p className="text-sm text-muted-foreground">{selectedCheck?.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Terminal className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        ref={inputRef}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={selectedCheck?.placeholder}
                        className="h-14 pl-12 pr-4 text-lg font-mono bg-black/60 border-white/10 focus:border-primary/50 rounded-xl placeholder:text-muted-foreground/50"
                        onKeyDown={(e) => e.key === "Enter" && handleCheck()}
                        data-testid="input-check-value"
                      />
                    </div>
                    <Button 
                      onClick={handleCheck} 
                      disabled={checkMutation.isPending}
                      className="h-14 px-8 text-lg font-semibold bg-gradient-to-r from-primary to-emerald-400 hover:from-primary/90 hover:to-emerald-400/90 text-black rounded-xl shadow-[0_0_30px_rgba(34,197,94,0.3)] hover:shadow-[0_0_40px_rgba(34,197,94,0.5)] transition-all"
                      data-testid="button-perform-check"
                    >
                      {checkMutation.isPending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Search className="w-5 h-5 mr-2" />
                          Сканувати
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>

            <AnimatePresence mode="wait">
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 30, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.98 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="space-y-6"
                >
                  <div className="p-6 lg:p-8 rounded-2xl border border-white/10 bg-black/60 backdrop-blur-xl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-white/10">
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                          result.riskLevel === 'critical' ? 'bg-red-500/20' :
                          result.riskLevel === 'high' ? 'bg-orange-500/20' :
                          result.riskLevel === 'medium' ? 'bg-yellow-500/20' :
                          'bg-green-500/20'
                        }`}>
                          {result.riskLevel === 'critical' || result.riskLevel === 'high' ? (
                            <AlertTriangle className={`w-7 h-7 ${result.riskLevel === 'critical' ? 'text-red-400' : 'text-orange-400'}`} />
                          ) : result.riskLevel === 'medium' ? (
                            <Clock className="w-7 h-7 text-yellow-400" />
                          ) : (
                            <ShieldCheck className="w-7 h-7 text-green-400" />
                          )}
                        </div>
                        <div>
                          <h2 className="text-xl lg:text-2xl font-display font-bold">Результат аналізу</h2>
                          <p className="text-sm text-muted-foreground font-mono">{result.timestamp}</p>
                        </div>
                      </div>
                      <RiskBadge level={result.riskLevel} score={result.riskScore} />
                    </div>

                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-6">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        <Database className="w-4 h-4" />
                        Ціль сканування
                      </div>
                      <p className="font-mono text-lg lg:text-xl break-all text-primary">{result.target}</p>
                    </div>

                    <div className="mb-6">
                      <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-500" />
                        Знахідки ({result.findings.length})
                      </h4>
                      <div className="space-y-2">
                        {result.findings.map((finding, idx) => {
                          const isCritical = finding.includes("КРИТИЧНО");
                          const isWarning = finding.includes("УВАГА");
                          const isSafe = finding.includes("не виявлено") || finding.includes("Чиста") || finding.includes("Безпечн");
                          
                          return (
                            <motion.div 
                              key={idx}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.1 }}
                              className={`p-4 rounded-xl text-sm flex items-start gap-3 border ${
                                isCritical ? "bg-red-500/10 border-red-500/30 text-red-300" :
                                isWarning ? "bg-orange-500/10 border-orange-500/30 text-orange-300" :
                                isSafe ? "bg-green-500/10 border-green-500/30 text-green-300" :
                                "bg-yellow-500/10 border-yellow-500/30 text-yellow-300"
                              }`}
                            >
                              <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                              <span>{finding}</span>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mb-6">
                      <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-primary" />
                        Технічні деталі
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {Object.entries(result.details).map(([key, value], idx) => (
                          <motion.div 
                            key={key}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 + idx * 0.05 }}
                            className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
                          >
                            <p className="text-xs text-muted-foreground capitalize mb-1">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </p>
                            <p className="font-mono text-sm break-all">
                              {typeof value === "boolean" ? (
                                <Badge variant={value ? "destructive" : "secondary"} className="text-xs">
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

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6 border-t border-white/10">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Database className="w-4 h-4" />
                        Джерела: {result.sources.join(", ")}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="rounded-lg" data-testid="button-download-pdf">
                          <Download className="w-4 h-4 mr-2" />
                          Експорт PDF
                        </Button>
                        <Button variant="outline" size="sm" className="rounded-lg" data-testid="button-add-to-monitor">
                          <Eye className="w-4 h-4 mr-2" />
                          Моніторити
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {!result && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { icon: Shield, label: "Перевірок", value: "12.4K+", color: "text-primary" },
                  { icon: AlertTriangle, label: "Загроз виявлено", value: "847", color: "text-orange-400" },
                  { icon: Database, label: "Баз даних", value: "50+", color: "text-blue-400" },
                  { icon: Activity, label: "Uptime", value: "99.9%", color: "text-green-400" },
                ].map((stat, idx) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="p-5 rounded-xl border border-white/10 bg-black/40 hover:border-white/20 transition-all group"
                  >
                    <stat.icon className={`w-6 h-6 ${stat.color} mb-3 group-hover:scale-110 transition-transform`} />
                    <p className="text-2xl font-display font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </main>

        <nav className="lg:hidden fixed bottom-0 left-0 right-0 border-t border-white/5 bg-black/90 backdrop-blur-xl z-50">
          <div className="flex items-center justify-around py-2">
            {navItems.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.id} href={item.href}>
                  <button
                    className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all ${
                      isActive 
                        ? "text-primary" 
                        : "text-muted-foreground"
                    }`}
                    data-testid={`mobile-nav-${item.id}`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="text-xs">{item.label}</span>
                  </button>
                </Link>
              );
            })}
            <button
              onClick={handleLogout}
              className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg text-muted-foreground"
              data-testid="mobile-nav-logout"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-xs">Вийти</span>
            </button>
          </div>
        </nav>
        <div className="lg:hidden h-16" />
      </div>
    </div>
  );
}
