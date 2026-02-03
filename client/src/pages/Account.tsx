import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Shield, 
  User,
  Crown,
  Zap,
  ShieldAlert,
  Home,
  History,
  Activity,
  Users,
  Settings,
  Bell,
  Globe,
  Key,
  Lock,
  Calendar,
  Flame,
  Target,
  Award,
  TrendingUp,
  BarChart3,
  CreditCard,
  ChevronRight,
  Copy,
  Check,
  LogOut,
  Smartphone,
  Clock,
  Monitor,
  Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: Home, href: "/dashboard" },
  { id: "history", label: "Історія", icon: History, href: "/history" },
  { id: "monitoring", label: "Моніторинг", icon: Activity, href: "/monitoring" },
  { id: "referral", label: "Рефералка", icon: Users, href: "/referral" },
  { id: "account", label: "Акаунт", icon: User, href: "/account" },
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
    ENTERPRISE: { 
      icon: ShieldAlert, 
      className: "bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white border-purple-400/50",
      glow: "shadow-[0_0_20px_rgba(168,85,247,0.4)]"
    },
  };
  
  const { icon: Icon, className, glow } = config[tier as keyof typeof config] || config.FREE;
  
  return (
    <Badge className={`${className} ${glow} border px-3 py-1 text-sm font-bold tracking-wider`}>
      <Icon className="w-4 h-4 mr-1.5" />
      {tier}
    </Badge>
  );
}

const mockUserData = {
  registrationDate: "15.01.2024",
  streakDays: 12,
  totalChecks: 247,
  activeMonitors: 5,
  referralsInvited: 3,
  mostUsedTypes: ["IP/GEO", "Email", "Wallet"],
  requestsUsed: 150,
  requestsTotal: 500,
  lastLogin: "02.02.2026, 14:30",
  achievements: {
    riskHunter: { current: 247, target: 10, completed: true },
    scamSlayer: { current: 247, target: 50, completed: true },
    streakMaster: { current: 12, target: 7, completed: true },
    referralKing: { current: 3, target: 5, completed: false },
  }
};

export default function Account() {
  const [language, setLanguage] = useState("uk");
  const [notifications, setNotifications] = useState({
    email: true,
    telegram: true,
    threats: true,
    updates: false,
  });
  const [copied, setCopied] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { toast } = useToast();
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const [location, setLocation] = useLocation();

  const handleLogout = async () => {
    await logout();
    setLocation("/login");
  };

  const copyApiKey = async () => {
    const apiKey = "dks_live_xxxxxxxxxxxxxxxxxxxxxxxx";
    await navigator.clipboard.writeText(apiKey);
    setCopied(true);
    toast({
      title: "API ключ скопійовано",
      description: "Ключ збережено в буфер обміну",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const userTier = (user?.tier || "FREE").toUpperCase();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <Shield className="w-6 h-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-muted-foreground font-mono text-sm">Завантаження...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    setLocation("/login");
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
        
        <nav className="p-4 space-y-1 flex-1">
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

        <div className="p-4 border-t border-white/5 mt-auto">
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
            onClick={handleLogout}
            data-testid="button-logout"
          >
            <LogOut className="w-5 h-5" />
            Вийти
          </Button>
        </div>
      </aside>

      <Sheet open={showMobileMenu} onOpenChange={setShowMobileMenu}>
        <SheetContent side="left" className="w-[280px] bg-black/95 border-white/10 p-0">
          <SheetHeader className="p-6 border-b border-white/5">
            <SheetTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-cyan-400 flex items-center justify-center">
                <Shield className="w-5 h-5 text-black" />
              </div>
              <span className="font-bold text-lg">DARKSHARE</span>
            </SheetTitle>
          </SheetHeader>
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.id} href={item.href}>
                  <button
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive 
                        ? "bg-primary/20 text-primary border border-primary/30" 
                        : "text-muted-foreground hover:text-white hover:bg-white/5"
                    }`}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </button>
                </Link>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>

      <main className="flex-1 overflow-y-auto bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-cyan-400 flex items-center justify-center">
              <Shield className="w-4 h-4 text-black" />
            </div>
            <span className="font-bold">DARKSHARE</span>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setShowMobileMenu(true)}
            data-testid="button-mobile-menu"
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 lg:p-8 space-y-8 max-w-6xl mx-auto">
          <motion.div 
            className="relative p-6 lg:p-8 rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900/95 to-zinc-950 border border-white/10 overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-cyan-500/5" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/10 to-transparent blur-3xl" />
            
            <div className="relative flex flex-col lg:flex-row items-start lg:items-center gap-6">
              <Avatar className="w-24 h-24 lg:w-28 lg:h-28 border-4 border-primary/40 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                <AvatarImage src={user?.photoUrl} />
                <AvatarFallback className="bg-gradient-to-br from-primary/30 to-cyan-500/20 text-primary text-3xl font-bold">
                  {user?.username?.slice(0, 2).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl lg:text-3xl font-bold text-white">
                    @{user?.username || "anonymous"}
                  </h1>
                  <TierBadge tier={userTier} />
                </div>
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-blue-400" />
                    <span>Telegram ID: {user?.tgId || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-purple-400" />
                    <span>З нами з {mockUserData.registrationDate}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500/20 to-yellow-500/10 border border-orange-500/30">
                    <Flame className="w-5 h-5 text-orange-400" />
                    <span className="text-lg font-bold text-orange-400">{mockUserData.streakDays}</span>
                    <span className="text-sm text-muted-foreground">днів підряд</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="p-5 rounded-xl bg-gradient-to-br from-blue-500/10 via-zinc-900 to-zinc-950 border border-blue-500/20 hover:border-blue-400/40 transition-all group">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                </div>
                <span className="text-sm text-muted-foreground">Всього перевірок</span>
              </div>
              <p className="text-3xl font-bold text-blue-400 font-mono">{mockUserData.totalChecks}</p>
            </div>
            
            <div className="p-5 rounded-xl bg-gradient-to-br from-green-500/10 via-zinc-900 to-zinc-950 border border-green-500/20 hover:border-green-400/40 transition-all group">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-green-400" />
                </div>
                <span className="text-sm text-muted-foreground">Активні монітори</span>
              </div>
              <p className="text-3xl font-bold text-green-400 font-mono">{mockUserData.activeMonitors}</p>
            </div>
            
            <div className="p-5 rounded-xl bg-gradient-to-br from-purple-500/10 via-zinc-900 to-zinc-950 border border-purple-500/20 hover:border-purple-400/40 transition-all group">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-400" />
                </div>
                <span className="text-sm text-muted-foreground">Рефералів</span>
              </div>
              <p className="text-3xl font-bold text-purple-400 font-mono">{mockUserData.referralsInvited}</p>
            </div>
            
            <div className="p-5 rounded-xl bg-gradient-to-br from-cyan-500/10 via-zinc-900 to-zinc-950 border border-cyan-500/20 hover:border-cyan-400/40 transition-all group">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-cyan-400" />
                </div>
                <span className="text-sm text-muted-foreground">Топ перевірки</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {mockUserData.mostUsedTypes.map((type, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs bg-cyan-500/10 text-cyan-400 border-cyan-500/20">
                    {type}
                  </Badge>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="p-6 rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900/95 to-zinc-950 border border-white/10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/10 flex items-center justify-center">
                <Award className="w-5 h-5 text-amber-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Досягнення</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-orange-500/10 via-zinc-900/50 to-transparent border border-orange-500/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-orange-400" />
                    <span className="font-medium text-white">Risk Hunter</span>
                  </div>
                  {mockUserData.achievements.riskHunter.completed && (
                    <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Виконано</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-2">10 перевірок</p>
                <Progress 
                  value={Math.min(100, (mockUserData.achievements.riskHunter.current / mockUserData.achievements.riskHunter.target) * 100)} 
                  className="h-2 bg-orange-950/50"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {mockUserData.achievements.riskHunter.current} / {mockUserData.achievements.riskHunter.target}
                </p>
              </div>
              
              <div className="p-4 rounded-xl bg-gradient-to-br from-red-500/10 via-zinc-900/50 to-transparent border border-red-500/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-red-400" />
                    <span className="font-medium text-white">Scam Slayer</span>
                  </div>
                  {mockUserData.achievements.scamSlayer.completed && (
                    <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Виконано</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-2">50 перевірок</p>
                <Progress 
                  value={Math.min(100, (mockUserData.achievements.scamSlayer.current / mockUserData.achievements.scamSlayer.target) * 100)} 
                  className="h-2 bg-red-950/50"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.min(mockUserData.achievements.scamSlayer.current, mockUserData.achievements.scamSlayer.target)} / {mockUserData.achievements.scamSlayer.target}
                </p>
              </div>
              
              <div className="p-4 rounded-xl bg-gradient-to-br from-yellow-500/10 via-zinc-900/50 to-transparent border border-yellow-500/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-yellow-400" />
                    <span className="font-medium text-white">Streak Master</span>
                  </div>
                  {mockUserData.achievements.streakMaster.completed && (
                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Виконано</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-2">7 днів підряд</p>
                <Progress 
                  value={Math.min(100, (mockUserData.achievements.streakMaster.current / mockUserData.achievements.streakMaster.target) * 100)} 
                  className="h-2 bg-yellow-950/50"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {mockUserData.achievements.streakMaster.current} / {mockUserData.achievements.streakMaster.target}
                </p>
              </div>
              
              <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 via-zinc-900/50 to-transparent border border-purple-500/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-purple-400" />
                    <span className="font-medium text-white">Referral King</span>
                  </div>
                  {mockUserData.achievements.referralKing.completed && (
                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Виконано</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-2">5 рефералів</p>
                <Progress 
                  value={Math.min(100, (mockUserData.achievements.referralKing.current / mockUserData.achievements.referralKing.target) * 100)} 
                  className="h-2 bg-purple-950/50"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {mockUserData.achievements.referralKing.current} / {mockUserData.achievements.referralKing.target}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="p-6 rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900/95 to-zinc-950 border border-white/10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-500/20 to-zinc-500/10 flex items-center justify-center">
                <Settings className="w-5 h-5 text-slate-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Налаштування</h2>
            </div>
            
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl bg-zinc-900/50 border border-white/5">
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="font-medium text-white">Мова інтерфейсу</p>
                    <p className="text-sm text-muted-foreground">Оберіть зручну мову</p>
                  </div>
                </div>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="w-[180px] bg-zinc-800 border-zinc-700" data-testid="select-language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="uk">Українська</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ru">Русский</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/50 border border-white/5">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-green-400" />
                    <div>
                      <p className="font-medium text-white">Email сповіщення</p>
                      <p className="text-sm text-muted-foreground">Отримувати звіти на пошту</p>
                    </div>
                  </div>
                  <Switch 
                    checked={notifications.email} 
                    onCheckedChange={(v) => setNotifications({...notifications, email: v})}
                    data-testid="switch-email-notifications"
                  />
                </div>
                
                <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/50 border border-white/5">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-blue-400" />
                    <div>
                      <p className="font-medium text-white">Telegram сповіщення</p>
                      <p className="text-sm text-muted-foreground">Повідомлення в Telegram</p>
                    </div>
                  </div>
                  <Switch 
                    checked={notifications.telegram} 
                    onCheckedChange={(v) => setNotifications({...notifications, telegram: v})}
                    data-testid="switch-telegram-notifications"
                  />
                </div>
                
                <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/50 border border-white/5">
                  <div className="flex items-center gap-3">
                    <ShieldAlert className="w-5 h-5 text-red-400" />
                    <div>
                      <p className="font-medium text-white">Сповіщення про загрози</p>
                      <p className="text-sm text-muted-foreground">Миттєві алерти при виявленні</p>
                    </div>
                  </div>
                  <Switch 
                    checked={notifications.threats} 
                    onCheckedChange={(v) => setNotifications({...notifications, threats: v})}
                    data-testid="switch-threat-notifications"
                  />
                </div>
                
                <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/50 border border-white/5">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-purple-400" />
                    <div>
                      <p className="font-medium text-white">Оновлення сервісу</p>
                      <p className="text-sm text-muted-foreground">Нові функції та зміни</p>
                    </div>
                  </div>
                  <Switch 
                    checked={notifications.updates} 
                    onCheckedChange={(v) => setNotifications({...notifications, updates: v})}
                    data-testid="switch-updates-notifications"
                  />
                </div>
              </div>
              
              {(userTier === "PRO" || userTier === "ENTERPRISE") && (
                <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 via-zinc-900/50 to-transparent border border-cyan-500/20">
                  <div className="flex items-center gap-3 mb-3">
                    <Key className="w-5 h-5 text-cyan-400" />
                    <div>
                      <p className="font-medium text-white">API ключ</p>
                      <p className="text-sm text-muted-foreground">Для інтеграції з вашими системами</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 rounded-lg bg-zinc-800 text-sm font-mono text-cyan-400 border border-zinc-700 truncate">
                      dks_live_xxxxxxxxxxxxxxxxxxxxxxxx
                    </code>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="shrink-0 hover:bg-cyan-500/10"
                      onClick={copyApiKey}
                      data-testid="button-copy-api-key"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div 
            className="p-6 rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900/95 to-zinc-950 border border-white/10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/10 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-indigo-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Підписка</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-xl bg-gradient-to-br from-indigo-500/10 via-zinc-900/50 to-transparent border border-indigo-500/20">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <p className="font-medium text-white">Поточний план</p>
                    <TierBadge tier={userTier} />
                  </div>
                  {userTier === "FREE" ? (
                    <p className="text-sm text-muted-foreground">Базовий план з обмеженнями</p>
                  ) : userTier === "PRO" ? (
                    <p className="text-sm text-muted-foreground">Професійний план з розширеними можливостями</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Корпоративний план з повним доступом</p>
                  )}
                </div>
                {userTier === "FREE" && (
                  <Link href="/dashboard">
                    <Button 
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500"
                      data-testid="button-upgrade"
                    >
                      <Crown className="w-4 h-4 mr-2" />
                      Оновити план
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                )}
              </div>
              
              <div className="p-5 rounded-xl bg-zinc-900/50 border border-white/5">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-medium text-white">Використання запитів</p>
                  <span className="text-sm font-mono text-muted-foreground">
                    {mockUserData.requestsUsed} / {mockUserData.requestsTotal}
                  </span>
                </div>
                <Progress 
                  value={(mockUserData.requestsUsed / mockUserData.requestsTotal) * 100} 
                  className="h-3 bg-zinc-800"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Залишилось {mockUserData.requestsTotal - mockUserData.requestsUsed} запитів до кінця періоду
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="p-6 rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900/95 to-zinc-950 border border-white/10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500/20 to-orange-500/10 flex items-center justify-center">
                <Lock className="w-5 h-5 text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Безпека</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/50 border border-white/5">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="font-medium text-white">Telegram акаунт</p>
                    <p className="text-sm text-muted-foreground">@{user?.username || "connected"}</p>
                  </div>
                </div>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  <Check className="w-3 h-3 mr-1" />
                  Підключено
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/50 border border-white/5">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-purple-400" />
                  <div>
                    <p className="font-medium text-white">Останній вхід</p>
                    <p className="text-sm text-muted-foreground">{mockUserData.lastLogin}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/50 border border-white/5">
                <div className="flex items-center gap-3">
                  <Monitor className="w-5 h-5 text-cyan-400" />
                  <div>
                    <p className="font-medium text-white">Активні сесії</p>
                    <p className="text-sm text-muted-foreground">Керування пристроями</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-white" data-testid="button-manage-sessions">
                  Керувати
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
