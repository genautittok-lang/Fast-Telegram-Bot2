import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { 
  Shield, 
  Users, 
  Copy, 
  Check,
  Gift,
  Crown,
  Zap,
  Home,
  History,
  Activity,
  ChevronRight,
  ExternalLink,
  Share2,
  TrendingUp,
  Star,
  Wallet,
  LogOut,
  User,
  CheckCircle2,
  Award,
  UserPlus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SiTelegram } from "react-icons/si";

interface ReferralStats {
  referralCode: string;
  referralCount: number;
  totalEarned: number;
  pendingBonus: number;
  referredUsers: Array<{
    id: number;
    username: string;
    tier: string;
    joinedAt: string;
    paid: boolean;
  }>;
}

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: Home, href: "/dashboard" },
  { id: "history", label: "Історія", icon: History, href: "/history" },
  { id: "monitoring", label: "Моніторинг", icon: Activity, href: "/monitoring" },
  { id: "referral", label: "Рефералка", icon: Users, href: "/referral" },
];

const referralTiers = [
  {
    level: 1,
    name: "Starter",
    referrals: "1-5",
    bonus: "+5 запитів",
    icon: Star,
    gradient: "from-zinc-500/20 via-zinc-500/10 to-transparent",
    iconColor: "text-zinc-400",
    borderColor: "border-zinc-500/30",
  },
  {
    level: 2,
    name: "Active",
    referrals: "6-15",
    bonus: "+15 запитів + 5% знижка",
    icon: TrendingUp,
    gradient: "from-blue-500/20 via-blue-500/10 to-transparent",
    iconColor: "text-blue-400",
    borderColor: "border-blue-500/30",
  },
  {
    level: 3,
    name: "Ambassador",
    referrals: "16-30",
    bonus: "+30 запитів + 10% знижка",
    icon: Award,
    gradient: "from-purple-500/20 via-purple-500/10 to-transparent",
    iconColor: "text-purple-400",
    borderColor: "border-purple-500/30",
  },
  {
    level: 4,
    name: "Elite Partner",
    referrals: "31+",
    bonus: "Безлім запитів + 20% знижка",
    icon: Crown,
    gradient: "from-amber-500/20 via-orange-500/10 to-transparent",
    iconColor: "text-amber-400",
    borderColor: "border-amber-500/30",
  },
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
      icon: Shield, 
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

export default function Referral() {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const { toast, dismiss } = useToast();
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const [location, setLocation] = useLocation();

  const { data: referralStats, isLoading: statsLoading } = useQuery<ReferralStats>({
    queryKey: ["/api/referrals"],
    enabled: isAuthenticated,
  });

  useEffect(() => {
    dismiss();
  }, [location]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [isLoading, isAuthenticated, setLocation]);

  const handleLogout = async () => {
    await logout();
    setLocation("/login");
  };

  const referralCode = referralStats?.referralCode || user?.refCode || "DARK-XXXXXX";
  const referralLink = `https://darkshare.app/r/${referralCode}`;

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopiedCode(true);
      toast({
        title: "Скопійовано!",
        description: "Реферальний код скопійовано в буфер обміну",
      });
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (error) {
      toast({
        title: "Помилка копіювання",
        description: "Не вдалося скопіювати код. Спробуйте ще раз.",
        variant: "destructive",
      });
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopiedLink(true);
      toast({
        title: "Скопійовано!",
        description: "Реферальне посилання скопійовано в буфер обміну",
      });
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (error) {
      toast({
        title: "Помилка копіювання",
        description: "Не вдалося скопіювати посилання. Спробуйте ще раз.",
        variant: "destructive",
      });
    }
  };

  const shareToTelegram = () => {
    const text = encodeURIComponent(`Приєднуйся до DARKSHARE - найкращого OSINT сервісу! Використай мій код ${referralCode} для отримання бонусів! ${referralLink}`);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${text}`, "_blank");
  };

  const getCurrentTierLevel = () => {
    const count = referralStats?.referralCount || 0;
    if (count >= 31) return 4;
    if (count >= 16) return 3;
    if (count >= 6) return 2;
    if (count >= 1) return 1;
    return 0;
  };

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
            <div className="flex items-center gap-2.5 flex-shrink-0">
              <motion.div whileTap={{ scale: 0.95 }}>
                <Avatar className="w-8 h-8 border-2 border-primary/30 shadow-[0_0_12px_rgba(34,197,94,0.2)]">
                  <AvatarImage src={user?.photoUrl} />
                  <AvatarFallback className="bg-gradient-to-br from-primary/30 to-cyan-500/20 text-primary text-xs font-bold">
                    {user?.username?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </motion.div>
            </div>
          </div>
        </motion.header>

        <main className="flex-1 p-3 lg:p-8 overflow-auto max-w-full">
          <div className="max-w-4xl mx-auto space-y-6 lg:space-y-8">
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
                    <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-purple-500/20">
                      <Users className="w-7 h-7 text-purple-400" />
                    </div>
                    <span className="bg-gradient-to-r from-white via-white to-purple-400/80 bg-clip-text text-transparent">Реферальна програма</span>
                  </h1>
                  <p className="text-muted-foreground mt-2 ml-14">Запрошуй друзів та отримуй бонуси</p>
                </div>
              </motion.div>
            </div>

            <div className="lg:hidden mb-4">
              <h1 className="text-xl font-display font-bold flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-400" />
                <span>Рефералка</span>
              </h1>
            </div>

            <motion.div
              className="p-4 lg:p-6 rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-transparent backdrop-blur-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Gift className="w-5 h-5 text-purple-400" />
                <h2 className="font-semibold text-lg">Твій реферальний код</h2>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <div className="p-4 rounded-xl bg-black/40 border border-white/10 font-mono text-xl lg:text-2xl text-center text-purple-400 tracking-wider shadow-[0_0_20px_rgba(168,85,247,0.2)]">
                    {referralCode}
                  </div>
                </div>
                <Button
                  onClick={copyCode}
                  className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white border-0 shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                  data-testid="button-copy-code"
                >
                  {copiedCode ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                  {copiedCode ? "Скопійовано" : "Копіювати"}
                </Button>
              </div>

              <div className="mt-4 p-3 rounded-xl bg-black/30 border border-white/5">
                <p className="text-xs text-muted-foreground mb-2">Реферальне посилання:</p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1 p-2 rounded-lg bg-black/40 border border-white/10 font-mono text-xs text-cyan-400 truncate">
                    {referralLink}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={copyLink}
                      className="border-cyan-500/30 hover:bg-cyan-500/10 hover:border-cyan-400/50"
                      data-testid="button-copy-link"
                    >
                      {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="sm"
                      onClick={shareToTelegram}
                      className="bg-[#0088cc] hover:bg-[#0099dd] text-white border-0"
                      data-testid="button-share-telegram"
                    >
                      <SiTelegram className="w-4 h-4 mr-1" />
                      Telegram
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <motion.div
                className="p-4 lg:p-5 rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-green-500/5 to-transparent backdrop-blur-xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <UserPlus className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-muted-foreground">Запрошено</span>
                </div>
                <p className="text-3xl font-bold text-emerald-400 font-mono">
                  {statsLoading ? "—" : referralStats?.referralCount || 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1">рефералів</p>
              </motion.div>

              <motion.div
                className="p-4 lg:p-5 rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent backdrop-blur-xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.25 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="w-4 h-4 text-amber-400" />
                  <span className="text-xs text-muted-foreground">Зароблено</span>
                </div>
                <p className="text-3xl font-bold text-amber-400 font-mono">
                  +{statsLoading ? "—" : referralStats?.totalEarned || 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1">запитів</p>
              </motion.div>

              <motion.div
                className="p-4 lg:p-5 rounded-xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-transparent backdrop-blur-xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs text-muted-foreground">Очікує</span>
                </div>
                <p className="text-3xl font-bold text-cyan-400 font-mono">
                  +{statsLoading ? "—" : referralStats?.pendingBonus || 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1">бонусів</p>
              </motion.div>
            </div>

            <motion.div
              className="p-4 lg:p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 via-transparent to-transparent backdrop-blur-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-5 h-5 text-amber-400" />
                <h2 className="font-semibold text-lg">Рівні винагород</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {referralTiers.map((tier, idx) => {
                  const currentLevel = getCurrentTierLevel();
                  const isActive = tier.level === currentLevel;
                  const isCompleted = tier.level < currentLevel;
                  
                  return (
                    <motion.div
                      key={tier.level}
                      className={`relative p-4 rounded-xl border transition-all duration-300 ${
                        isActive 
                          ? `${tier.borderColor} bg-gradient-to-br ${tier.gradient} shadow-lg`
                          : isCompleted
                            ? "border-primary/30 bg-gradient-to-br from-primary/10 to-transparent"
                            : "border-white/10 bg-black/40"
                      }`}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.1, duration: 0.3 }}
                    >
                      {isActive && (
                        <div className="absolute -top-2 -right-2">
                          <Badge className="bg-gradient-to-r from-primary to-emerald-400 text-black text-[10px] px-2 py-0.5">
                            Поточний
                          </Badge>
                        </div>
                      )}
                      {isCompleted && (
                        <div className="absolute -top-2 -right-2">
                          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                            <Check className="w-3 h-3 text-black" />
                          </div>
                        </div>
                      )}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                        isActive || isCompleted ? `bg-white/10` : "bg-white/5"
                      }`}>
                        <tier.icon className={`w-5 h-5 ${isActive || isCompleted ? tier.iconColor : "text-muted-foreground"}`} />
                      </div>
                      <h3 className={`font-semibold text-sm mb-1 ${isActive || isCompleted ? "text-white" : "text-muted-foreground"}`}>
                        {tier.name}
                      </h3>
                      <p className={`text-xs mb-2 ${isActive || isCompleted ? tier.iconColor : "text-muted-foreground/60"}`}>
                        {tier.referrals} рефералів
                      </p>
                      <p className={`text-xs ${isActive || isCompleted ? "text-white/80" : "text-muted-foreground/50"}`}>
                        {tier.bonus}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            <motion.div
              className="p-4 lg:p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 via-transparent to-transparent backdrop-blur-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-cyan-400" />
                  <h2 className="font-semibold text-lg">Запрошені користувачі</h2>
                </div>
                <Badge variant="outline" className="border-cyan-500/30 text-cyan-400">
                  {referralStats?.referredUsers?.length || 0}
                </Badge>
              </div>
              
              {statsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
              ) : referralStats?.referredUsers && referralStats.referredUsers.length > 0 ? (
                <div className="space-y-2">
                  {referralStats.referredUsers.map((refUser, idx) => (
                    <motion.div
                      key={refUser.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-black/30 border border-white/5 hover:border-white/10 transition-colors"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05, duration: 0.2 }}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8 border border-white/10">
                          <AvatarFallback className="bg-gradient-to-br from-cyan-500/20 to-purple-500/20 text-xs">
                            {refUser.username?.slice(0, 2).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">@{refUser.username || "user"}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(refUser.joinedAt).toLocaleDateString("uk-UA")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <TierBadge tier={refUser.tier} />
                        {refUser.paid ? (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                            <Check className="w-3 h-3 mr-1" />
                            Бонус
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                            Очікує
                          </Badge>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
                    <UserPlus className="w-8 h-8 text-purple-400/60" />
                  </div>
                  <p className="text-muted-foreground mb-2">Поки що немає рефералів</p>
                  <p className="text-xs text-muted-foreground/60 max-w-xs">
                    Поділіться своїм реферальним кодом з друзями та отримуйте бонуси за кожного запрошеного користувача
                  </p>
                </div>
              )}
            </motion.div>

            <motion.div
              className="p-4 lg:p-6 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-emerald-500/5 to-transparent backdrop-blur-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.45 }}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/30 to-emerald-500/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
                  <Gift className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">Як це працює?</h3>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs text-primary font-bold">1</span>
                      </div>
                      <p>Поділіться своїм реферальним кодом або посиланням з друзями</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs text-primary font-bold">2</span>
                      </div>
                      <p>Коли друг реєструється за вашим кодом, він отримує +5 безкоштовних запитів</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs text-primary font-bold">3</span>
                      </div>
                      <p>Ви отримуєте +3 запити за кожного запрошеного користувача</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs text-primary font-bold">4</span>
                      </div>
                      <p>Досягайте нових рівнів для отримання більших бонусів та знижок</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </main>

        <nav className="lg:hidden sticky bottom-0 border-t border-white/5 bg-gradient-to-t from-black via-black/98 to-black/95 backdrop-blur-2xl">
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          <div className="flex justify-around py-2 px-2">
            {navItems.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.id} href={item.href}>
                  <motion.button
                    className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-300 ${
                      isActive 
                        ? "bg-gradient-to-t from-primary/20 to-transparent text-primary" 
                        : "text-muted-foreground active:text-white"
                    }`}
                    whileTap={{ scale: 0.9 }}
                    data-testid={`nav-mobile-${item.id}`}
                  >
                    <item.icon className={`w-5 h-5 ${isActive ? 'drop-shadow-[0_0_6px_rgba(34,197,94,0.6)]' : ''}`} />
                    <span className="text-[10px] font-medium">{item.label}</span>
                    {isActive && (
                      <motion.div
                        className="absolute bottom-1 w-1 h-1 rounded-full bg-primary shadow-[0_0_6px_rgba(34,197,94,0.8)]"
                        layoutId="mobileNavIndicator"
                      />
                    )}
                  </motion.button>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
