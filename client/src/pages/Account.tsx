import { useState, useMemo, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { 
  Shield, 
  User,
  Crown,
  Zap,
  ShieldAlert,
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
  Smartphone,
  Clock,
  Monitor,
  Check,
  Copy,
  RefreshCw,
  Users,
  Activity,
  Trash2,
  LogOut
} from "lucide-react";
import { FireStreak } from "@/components/FireStreak";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { PageLayout } from "@/components/PageLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Report {
  id: number;
  type: string;
  target: string;
  riskLevel: string;
  riskScore: number;
  createdAt: string;
}

interface Watch {
  id: number;
  objectType: string;
  value: string;
  status: string;
  lastCheck: string | null;
  createdAt: string;
}

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

function StatCardSkeleton() {
  return (
    <div className="p-5 rounded-xl bg-gradient-to-br from-zinc-800/50 via-zinc-900 to-zinc-950 border border-zinc-700/50">
      <div className="flex items-center gap-3 mb-3">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="h-8 w-16" />
    </div>
  );
}

export default function Account() {
  const { user, isAuthenticated, checkAuth } = useAuth();
  const { t, lang } = useTranslation();
  const { toast } = useToast();

  const [language, setLanguage] = useState(user?.lang || "uk");
  const [notifications, setNotifications] = useState({
    email: user?.notifsOn ?? true,
    telegram: user?.notifsOn ?? true,
    threats: user?.notifsOn ?? true,
    updates: user?.digestsOn ?? false,
  });

  useEffect(() => {
    if (user) {
      setLanguage(user.lang || "uk");
      setNotifications({
        email: user.notifsOn ?? true,
        telegram: user.notifsOn ?? true,
        threats: user.notifsOn ?? true,
        updates: user.digestsOn ?? false,
      });
    }
  }, [user?.lang, user?.notifsOn, user?.digestsOn]);

  const saveSettings = useCallback(async (updates: Record<string, any>) => {
    try {
      await apiRequest("PATCH", "/api/user/settings", updates);
      await checkAuth();
      toast({ title: t('account.settingsSaved') });
    } catch (error) {
      toast({ title: t('account.settingsSaveError'), variant: "destructive" });
    }
  }, [checkAuth, toast, t]);

  const handleLanguageChange = useCallback((val: string) => {
    setLanguage(val);
    saveSettings({ lang: val });
  }, [saveSettings]);

  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      await apiRequest("DELETE", `/api/user/sessions/${sessionId}`);
      toast({ title: t('account.sessionDeleted') });
      await checkAuth();
    } catch {
      toast({ title: t('account.sessionDeleteError'), variant: "destructive" });
    }
  }, [toast, t, checkAuth]);

  const handleNotificationChange = useCallback((field: string, value: boolean) => {
    setNotifications(prev => ({ ...prev, [field]: value }));
    if (field === "email" || field === "telegram" || field === "threats") {
      saveSettings({ notifsOn: value });
    } else if (field === "updates") {
      saveSettings({ digestsOn: value });
    }
  }, [saveSettings]);

  const { data: reports = [], isLoading: reportsLoading } = useQuery<Report[]>({
    queryKey: ['/api/reports'],
    enabled: isAuthenticated,
  });

  const { data: watches = [], isLoading: watchesLoading } = useQuery<Watch[]>({
    queryKey: ['/api/watches'],
    enabled: isAuthenticated,
  });

  const { data: referralStats, isLoading: referralsLoading } = useQuery<ReferralStats>({
    queryKey: ['/api/referrals'],
    enabled: isAuthenticated,
  });

  const userTier = (user?.tier || "FREE").toUpperCase();
  const isPaidTier = userTier === "PRO" || userTier === "ENTERPRISE";

  const { data: apiKeyData, refetch: refetchApiKey } = useQuery<{ key: string; masked: string }>({
    queryKey: ['/api/user/api-key'],
    enabled: isAuthenticated && isPaidTier,
  });

  const { data: sessionsData } = useQuery<Array<{ id: string; current: boolean; device: string; ip: string; lastActive: string; loginTime: string }>>({
    queryKey: ['/api/user/sessions'],
    enabled: isAuthenticated,
  });

  const deleteAllOtherSessions = useCallback(async () => {
    try {
      const otherSessions = sessionsData?.filter(s => !s.current) || [];
      for (const session of otherSessions) {
        await apiRequest("DELETE", `/api/user/sessions/${session.id}`);
      }
      toast({ title: t('account.allSessionsDeleted') });
      await checkAuth();
    } catch {
      toast({ title: t('account.allSessionsDeleteError'), variant: "destructive" });
    }
  }, [sessionsData, toast, t, checkAuth]);

  const stats = useMemo(() => {
    const totalChecks = reports.length;
    const activeMonitors = watches.length;
    const referralsCount = referralStats?.referralCount || 0;

    const typeCountMap: Record<string, number> = {};
    reports.forEach((report) => {
      const type = report.type || 'unknown';
      typeCountMap[type] = (typeCountMap[type] || 0) + 1;
    });

    const mostUsedTypes = Object.entries(typeCountMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([type]) => type.toUpperCase());

    return {
      totalChecks,
      activeMonitors,
      referralsCount,
      mostUsedTypes: mostUsedTypes.length > 0 ? mostUsedTypes : ["N/A"],
    };
  }, [reports, watches, referralStats]);

  const achievements = useMemo(() => {
    const totalChecks = reports.length;
    const streakDays = user?.streakDays || 0;
    const referralsCount = referralStats?.referralCount || 0;

    return {
      riskHunter: { current: totalChecks, target: 10, completed: totalChecks >= 10 },
      scamSlayer: { current: totalChecks, target: 50, completed: totalChecks >= 50 },
      streakMaster: { current: streakDays, target: 7, completed: streakDays >= 7 },
      referralKing: { current: referralsCount, target: 5, completed: referralsCount >= 5 },
    };
  }, [reports, user?.streakDays, referralStats]);

  const requestsUsed = useMemo(() => {
    const tierLimits: Record<string, number> = {
      FREE: 5,
      BASIC: 30,
      PRO: 50,
      ENTERPRISE: 9999,
    };
    const total = tierLimits[userTier] || 5;
    const left = user?.requestsLeft ?? total;
    return {
      used: Math.max(0, total - left),
      total,
      left,
    };
  }, [userTier, user?.requestsLeft]);

  const isDataLoading = reportsLoading || watchesLoading || referralsLoading;

  return (
    <PageLayout>
      <main className="flex-1 overflow-y-auto bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
        <div className="p-4 lg:p-8 space-y-6 lg:space-y-8 max-w-6xl mx-auto">
          <motion.div 
            className="relative p-4 lg:p-8 rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900/95 to-zinc-950 border border-white/10 overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-cyan-500/5" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/10 to-transparent blur-3xl" />
            
            <div className="relative flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-6">
              <Avatar className="w-16 h-16 lg:w-24 lg:h-24 border-4 border-primary/40 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                <AvatarImage src={user?.photoUrl || user?.profileImageUrl} />
                <AvatarFallback className="bg-gradient-to-br from-primary/30 to-cyan-500/20 text-primary text-3xl font-bold">
                  {user?.username?.slice(0, 2).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-2 lg:space-y-3">
                <div className="flex flex-wrap items-center gap-2 lg:gap-3">
                  <h1 className="text-lg lg:text-3xl font-bold text-white" data-testid="text-username">
                    @{user?.username || "anonymous"}
                  </h1>
                  <TierBadge tier={userTier} />
                </div>
                
                <div className="flex flex-wrap items-center gap-2 lg:gap-4 text-xs lg:text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-3 h-3 lg:w-4 lg:h-4 text-blue-400" />
                    <span data-testid="text-telegram-id" className="truncate">{t('account.telegramId')}: {user?.tgId || "N/A"}</span>
                  </div>
                  {user?.refCode && (
                    <div className="flex items-center gap-2">
                      <Users className="w-3 h-3 lg:w-4 lg:h-4 text-purple-400" />
                      <span data-testid="text-ref-code" className="truncate">{t('account.ref')}: {user.refCode}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2 mt-2" data-testid="text-streak-days">
                  <FireStreak streakDays={user?.streakDays || 0} size="sm" />
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {isDataLoading ? (
              <>
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
              </>
            ) : (
              <>
                <div className="p-3 lg:p-5 rounded-xl bg-gradient-to-br from-blue-500/10 via-zinc-900 to-zinc-950 border border-blue-500/20 hover:border-blue-400/40 transition-all group">
                  <div className="flex items-center gap-2 lg:gap-3 mb-2 lg:mb-3">
                    <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <BarChart3 className="w-4 h-4 lg:w-5 lg:h-5 text-blue-400" />
                    </div>
                    <span className="text-xs lg:text-sm text-muted-foreground">{t('account.totalChecks')}</span>
                  </div>
                  <p className="text-2xl lg:text-3xl font-bold text-blue-400 font-mono" data-testid="text-total-checks">{stats.totalChecks}</p>
                </div>
                
                <div className="p-3 lg:p-5 rounded-xl bg-gradient-to-br from-green-500/10 via-zinc-900 to-zinc-950 border border-green-500/20 hover:border-green-400/40 transition-all group">
                  <div className="flex items-center gap-2 lg:gap-3 mb-2 lg:mb-3">
                    <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                      <Activity className="w-4 h-4 lg:w-5 lg:h-5 text-green-400" />
                    </div>
                    <span className="text-xs lg:text-sm text-muted-foreground">{t('account.activeMonitors')}</span>
                  </div>
                  <p className="text-2xl lg:text-3xl font-bold text-green-400 font-mono" data-testid="text-active-monitors">{stats.activeMonitors}</p>
                </div>
                
                <div className="p-3 lg:p-5 rounded-xl bg-gradient-to-br from-purple-500/10 via-zinc-900 to-zinc-950 border border-purple-500/20 hover:border-purple-400/40 transition-all group">
                  <div className="flex items-center gap-2 lg:gap-3 mb-2 lg:mb-3">
                    <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <Users className="w-4 h-4 lg:w-5 lg:h-5 text-purple-400" />
                    </div>
                    <span className="text-xs lg:text-sm text-muted-foreground">{t('account.referrals')}</span>
                  </div>
                  <p className="text-2xl lg:text-3xl font-bold text-purple-400 font-mono" data-testid="text-referrals-count">{stats.referralsCount}</p>
                </div>
                
                <div className="p-3 lg:p-5 rounded-xl bg-gradient-to-br from-cyan-500/10 via-zinc-900 to-zinc-950 border border-cyan-500/20 hover:border-cyan-400/40 transition-all group">
                  <div className="flex items-center gap-2 lg:gap-3 mb-2 lg:mb-3">
                    <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 lg:w-5 lg:h-5 text-cyan-400" />
                    </div>
                    <span className="text-xs lg:text-sm text-muted-foreground">{t('account.top')}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 lg:gap-1.5 mt-1">
                    {stats.mostUsedTypes.map((type, idx) => (
                      <Badge key={idx} variant="secondary" className="text-[10px] lg:text-xs bg-cyan-500/10 text-cyan-400 border-cyan-500/20 px-2 py-0.5">
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
          </motion.div>

          <motion.div 
            className="p-4 lg:p-6 rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900/95 to-zinc-950 border border-white/10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex items-center gap-2 lg:gap-3 mb-4 lg:mb-6">
              <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/10 flex items-center justify-center">
                <Award className="w-4 h-4 lg:w-5 lg:h-5 text-amber-400" />
              </div>
              <h2 className="text-lg lg:text-xl font-bold text-white">{t('account.achievements')}</h2>
            </div>
            
            {isDataLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="p-3 lg:p-4 rounded-xl bg-zinc-900/50 border border-zinc-700/30">
                    <div className="flex items-center gap-3 mb-3">
                      <Skeleton className="w-5 h-5 rounded" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-2 w-full mb-2" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4">
                <div className="p-3 lg:p-4 rounded-xl bg-gradient-to-br from-orange-500/10 via-zinc-900/50 to-transparent border border-orange-500/20">
                  <div className="flex items-center justify-between gap-2 mb-2 lg:mb-3">
                    <div className="flex items-center gap-1.5 lg:gap-2 min-w-0">
                      <Target className="w-4 h-4 lg:w-5 lg:h-5 text-orange-400 flex-shrink-0" />
                      <span className="font-medium text-white text-sm lg:text-base truncate">{t('account.riskHunter')}</span>
                    </div>
                    {achievements.riskHunter.completed && (
                      <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs lg:text-sm px-2 py-0.5">{t('account.completed')}</Badge>
                    )}
                  </div>
                  <p className="text-xs lg:text-sm text-muted-foreground mb-1.5 lg:mb-2">{t('account.riskHunterDesc')}</p>
                  <Progress 
                    value={Math.min(100, (achievements.riskHunter.current / achievements.riskHunter.target) * 100)} 
                    className="h-1.5 lg:h-2 bg-orange-950/50"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {achievements.riskHunter.current} / {achievements.riskHunter.target}
                  </p>
                </div>
                
                <div className="p-3 lg:p-4 rounded-xl bg-gradient-to-br from-red-500/10 via-zinc-900/50 to-transparent border border-red-500/20">
                  <div className="flex items-center justify-between gap-2 mb-2 lg:mb-3">
                    <div className="flex items-center gap-1.5 lg:gap-2 min-w-0">
                      <ShieldAlert className="w-4 h-4 lg:w-5 lg:h-5 text-red-400 flex-shrink-0" />
                      <span className="font-medium text-white text-sm lg:text-base truncate">{t('account.scamSlayer')}</span>
                    </div>
                    {achievements.scamSlayer.completed && (
                      <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs lg:text-sm px-2 py-0.5">{t('account.completed')}</Badge>
                    )}
                  </div>
                  <p className="text-xs lg:text-sm text-muted-foreground mb-1.5 lg:mb-2">{t('account.scamSlayerDesc')}</p>
                  <Progress 
                    value={Math.min(100, (achievements.scamSlayer.current / achievements.scamSlayer.target) * 100)} 
                    className="h-1.5 lg:h-2 bg-red-950/50"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {Math.min(achievements.scamSlayer.current, achievements.scamSlayer.target)} / {achievements.scamSlayer.target}
                  </p>
                </div>
                
                <div className="p-3 lg:p-4 rounded-xl bg-gradient-to-br from-yellow-500/10 via-zinc-900/50 to-transparent border border-yellow-500/20">
                  <div className="flex items-center justify-between gap-2 mb-2 lg:mb-3">
                    <div className="flex items-center gap-1.5 lg:gap-2 min-w-0">
                      <Flame className="w-4 h-4 lg:w-5 lg:h-5 text-yellow-400 flex-shrink-0" />
                      <span className="font-medium text-white text-sm lg:text-base truncate">{t('account.streakMaster')}</span>
                    </div>
                    {achievements.streakMaster.completed && (
                      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs lg:text-sm px-2 py-0.5">{t('account.completed')}</Badge>
                    )}
                  </div>
                  <p className="text-xs lg:text-sm text-muted-foreground mb-1.5 lg:mb-2">{t('account.streakMasterDesc')}</p>
                  <Progress 
                    value={Math.min(100, (achievements.streakMaster.current / achievements.streakMaster.target) * 100)} 
                    className="h-1.5 lg:h-2 bg-yellow-950/50"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {achievements.streakMaster.current} / {achievements.streakMaster.target}
                  </p>
                </div>
                
                <div className="p-3 lg:p-4 rounded-xl bg-gradient-to-br from-purple-500/10 via-zinc-900/50 to-transparent border border-purple-500/20">
                  <div className="flex items-center justify-between gap-2 mb-2 lg:mb-3">
                    <div className="flex items-center gap-1.5 lg:gap-2 min-w-0">
                      <Crown className="w-4 h-4 lg:w-5 lg:h-5 text-purple-400 flex-shrink-0" />
                      <span className="font-medium text-white text-sm lg:text-base truncate">{t('account.referralKing')}</span>
                    </div>
                    {achievements.referralKing.completed && (
                      <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs lg:text-sm px-2 py-0.5">{t('account.completed')}</Badge>
                    )}
                  </div>
                  <p className="text-xs lg:text-sm text-muted-foreground mb-1.5 lg:mb-2">{t('account.referralKingDesc')}</p>
                  <Progress 
                    value={Math.min(100, (achievements.referralKing.current / achievements.referralKing.target) * 100)} 
                    className="h-1.5 lg:h-2 bg-purple-950/50"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {achievements.referralKing.current} / {achievements.referralKing.target}
                  </p>
                </div>
              </div>
            )}
          </motion.div>

          <motion.div 
            className="p-4 lg:p-6 rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900/95 to-zinc-950 border border-white/10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="flex items-center gap-2 lg:gap-3 mb-4 lg:mb-6">
              <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg bg-gradient-to-br from-slate-500/20 to-zinc-500/10 flex items-center justify-center">
                <Settings className="w-4 h-4 lg:w-5 lg:h-5 text-slate-400" />
              </div>
              <h2 className="text-lg lg:text-xl font-bold text-white">{t('account.settings')}</h2>
            </div>
            
            <div className="space-y-3 lg:space-y-6">
              <div className="flex flex-col gap-3 p-3 lg:p-4 rounded-xl bg-zinc-900/50 border border-white/5">
                <div className="flex items-center gap-2 lg:gap-3">
                  <Globe className="w-4 h-4 lg:w-5 lg:h-5 text-blue-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-white text-sm lg:text-base">{t('account.interfaceLanguage')}</p>
                    <p className="text-xs lg:text-sm text-muted-foreground">{t('account.chooseLanguage')}</p>
                  </div>
                </div>
                <Select value={language} onValueChange={handleLanguageChange}>
                  <SelectTrigger className="w-full lg:w-[180px] bg-zinc-800 border-zinc-700 text-sm" data-testid="select-language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="uk">Українська</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ru">Русский</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="de">Deutsch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2 lg:space-y-3">
                <div className="flex items-center justify-between gap-2 p-3 lg:p-4 rounded-xl bg-zinc-900/50 border border-white/5">
                  <div className="flex items-center gap-2 lg:gap-3 min-w-0">
                    <Bell className="w-4 h-4 lg:w-5 lg:h-5 text-green-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-white text-sm lg:text-base truncate">{t('account.emailNotifications')}</p>
                      <p className="text-xs lg:text-sm text-muted-foreground">{t('account.emailNotificationsDesc')}</p>
                    </div>
                  </div>
                  <Switch 
                    checked={notifications.email} 
                    onCheckedChange={(v) => handleNotificationChange("email", v)}
                    data-testid="switch-email-notifications"
                  />
                </div>
                
                <div className="flex items-center justify-between gap-2 p-3 lg:p-4 rounded-xl bg-zinc-900/50 border border-white/5">
                  <div className="flex items-center gap-2 lg:gap-3 min-w-0">
                    <Smartphone className="w-4 h-4 lg:w-5 lg:h-5 text-blue-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-white text-sm lg:text-base truncate">{t('account.telegramNotifications')}</p>
                      <p className="text-xs lg:text-sm text-muted-foreground">{t('account.telegramNotificationsDesc')}</p>
                    </div>
                  </div>
                  <Switch 
                    checked={notifications.telegram} 
                    onCheckedChange={(v) => handleNotificationChange("telegram", v)}
                    data-testid="switch-telegram-notifications"
                  />
                </div>
                
                <div className="flex items-center justify-between gap-2 p-3 lg:p-4 rounded-xl bg-zinc-900/50 border border-white/5">
                  <div className="flex items-center gap-2 lg:gap-3 min-w-0">
                    <ShieldAlert className="w-4 h-4 lg:w-5 lg:h-5 text-red-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-white text-sm lg:text-base truncate">{t('account.threatAlerts')}</p>
                      <p className="text-xs lg:text-sm text-muted-foreground">{t('account.threatAlertsDesc')}</p>
                    </div>
                  </div>
                  <Switch 
                    checked={notifications.threats} 
                    onCheckedChange={(v) => handleNotificationChange("threats", v)}
                    data-testid="switch-threat-notifications"
                  />
                </div>
                
                <div className="flex items-center justify-between gap-2 p-3 lg:p-4 rounded-xl bg-zinc-900/50 border border-white/5">
                  <div className="flex items-center gap-2 lg:gap-3 min-w-0">
                    <TrendingUp className="w-4 h-4 lg:w-5 lg:h-5 text-purple-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-white text-sm lg:text-base truncate">{t('account.updateNotifications')}</p>
                      <p className="text-xs lg:text-sm text-muted-foreground">{t('account.updateNotificationsDesc')}</p>
                    </div>
                  </div>
                  <Switch 
                    checked={notifications.updates} 
                    onCheckedChange={(v) => handleNotificationChange("updates", v)}
                    data-testid="switch-updates-notifications"
                  />
                </div>
              </div>
              
              <div className="p-3 lg:p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 via-zinc-900/50 to-transparent border border-cyan-500/20">
                <div className="flex items-center gap-2 lg:gap-3 mb-2 lg:mb-3">
                  <Key className="w-4 h-4 lg:w-5 lg:h-5 text-cyan-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-white text-sm lg:text-base">{t('account.apiKey')}</p>
                    <p className="text-xs lg:text-sm text-muted-foreground">{t('account.forIntegration')}</p>
                  </div>
                </div>
                {userTier === "FREE" ? (
                  <div className="flex items-center gap-1.5 lg:gap-2 px-2 lg:px-3 py-1.5 lg:py-2 rounded-lg bg-zinc-800/50 text-xs lg:text-sm text-muted-foreground border border-zinc-700">
                    <Lock className="w-3 h-3 lg:w-4 lg:h-4 flex-shrink-0" />
                    <span className="truncate">{t('account.upgradeForApi')}</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Check className="w-3 h-3 lg:w-4 lg:h-4 text-cyan-400 flex-shrink-0" />
                      <span className="text-xs lg:text-sm text-cyan-400">{t('account.apiAvailable')}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{t('account.apiKeyDesc')}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 flex items-center gap-1.5 px-2 lg:px-3 py-1.5 lg:py-2 rounded-lg bg-zinc-800 text-xs lg:text-sm text-cyan-400 border border-zinc-700 font-mono truncate" data-testid="text-api-key">
                        {apiKeyData?.masked || `dk_${"•".repeat(16)}`}
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        data-testid="button-copy-api-key"
                        onClick={() => {
                          if (apiKeyData?.key) {
                            navigator.clipboard.writeText(apiKeyData.key);
                            toast({ title: t('account.keyCopied') });
                          }
                        }}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        data-testid="button-regenerate-api-key"
                        onClick={async () => {
                          try {
                            await apiRequest("POST", "/api/user/api-key", { regenerate: true });
                            await refetchApiKey();
                            toast({ title: t('account.apiKeyRegenerated') });
                          } catch {
                            toast({ title: t('account.apiKeyRegenerateError'), variant: "destructive" });
                          }
                        }}
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="p-4 lg:p-6 rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900/95 to-zinc-950 border border-white/10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="flex items-center gap-2 lg:gap-3 mb-4 lg:mb-6">
              <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/10 flex items-center justify-center">
                <CreditCard className="w-4 h-4 lg:w-5 lg:h-5 text-indigo-400" />
              </div>
              <h2 className="text-lg lg:text-xl font-bold text-white">{t('account.subscriptionTitle')}</h2>
            </div>
            
            <div className="space-y-3 lg:space-y-4">
              <div className="flex flex-col gap-3 p-3 lg:p-5 rounded-xl bg-gradient-to-br from-indigo-500/10 via-zinc-900/50 to-transparent border border-indigo-500/20">
                <div>
                  <div className="flex items-center gap-2 lg:gap-3 mb-1 lg:mb-2 flex-wrap">
                    <p className="font-medium text-white text-sm lg:text-base">{t('account.currentPlan')}</p>
                    <TierBadge tier={userTier} />
                  </div>
                  {userTier === "FREE" ? (
                    <p className="text-xs lg:text-sm text-muted-foreground">{t('account.basicPlan')}</p>
                  ) : userTier === "PRO" ? (
                    <p className="text-xs lg:text-sm text-muted-foreground">{t('account.professionalPlan')}</p>
                  ) : (
                    <p className="text-xs lg:text-sm text-muted-foreground">{t('account.corporatePlan')}</p>
                  )}
                </div>
                {userTier === "FREE" && (
                  <Link href="/pricing">
                    <Button 
                      className="w-full lg:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-sm"
                      data-testid="button-upgrade"
                    >
                      <Crown className="w-3 h-3 lg:w-4 lg:h-4 mr-1.5 lg:mr-2" />
                      {t('account.upgradePlan')}
                      <ChevronRight className="w-3 h-3 lg:w-4 lg:h-4 ml-1 lg:ml-1" />
                    </Button>
                  </Link>
                )}
              </div>
              
              <div className="p-3 lg:p-5 rounded-xl bg-zinc-900/50 border border-white/5">
                <div className="flex items-center justify-between gap-2 mb-2 lg:mb-3">
                  <p className="font-medium text-white text-sm lg:text-base">{t('account.requests')}</p>
                  <span className="text-xs lg:text-sm font-mono text-muted-foreground" data-testid="text-requests-usage">
                    {requestsUsed.used} / {requestsUsed.total}
                  </span>
                </div>
                <Progress 
                  value={(requestsUsed.used / requestsUsed.total) * 100} 
                  className="h-2 lg:h-3 bg-zinc-800"
                />
                <p className="text-xs lg:text-sm text-muted-foreground mt-1.5 lg:mt-2" data-testid="text-requests-left">
                  {t('account.remaining')} {requestsUsed.left}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="p-4 lg:p-6 rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900/95 to-zinc-950 border border-white/10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <div className="flex items-center gap-2 lg:gap-3 mb-4 lg:mb-6">
              <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg bg-gradient-to-br from-red-500/20 to-orange-500/10 flex items-center justify-center">
                <Lock className="w-4 h-4 lg:w-5 lg:h-5 text-red-400" />
              </div>
              <h2 className="text-lg lg:text-xl font-bold text-white">{t('account.security')}</h2>
            </div>
            
            <div className="space-y-2 lg:space-y-4">
              <div className="flex items-center justify-between gap-2 p-3 lg:p-4 rounded-xl bg-zinc-900/50 border border-white/5">
                <div className="flex items-center gap-2 lg:gap-3 min-w-0">
                  <Smartphone className="w-4 h-4 lg:w-5 lg:h-5 text-blue-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-white text-sm lg:text-base">Telegram</p>
                    <p className="text-xs lg:text-sm text-muted-foreground truncate">@{user?.username || "connected"}</p>
                  </div>
                </div>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs lg:text-sm px-2 py-0.5 flex-shrink-0">
                  <Check className="w-2.5 h-2.5 lg:w-3 lg:h-3 mr-0.5" />
                  {t('account.connected')}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between gap-2 p-3 lg:p-4 rounded-xl bg-zinc-900/50 border border-white/5">
                <div className="flex items-center gap-2 lg:gap-3 min-w-0">
                  <Clock className="w-4 h-4 lg:w-5 lg:h-5 text-purple-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-white text-sm lg:text-base">{t('account.lastLogin')}</p>
                    <p className="text-xs lg:text-sm text-muted-foreground truncate" data-testid="text-last-login">{user?.lastLogin ? new Date(user.lastLogin).toLocaleString(lang === "uk" ? "uk-UA" : lang === "ru" ? "ru-RU" : lang === "es" ? "es-ES" : lang === "de" ? "de-DE" : "en-US") : new Date().toLocaleString(lang === "uk" ? "uk-UA" : lang === "ru" ? "ru-RU" : lang === "es" ? "es-ES" : lang === "de" ? "de-DE" : "en-US")}</p>
                  </div>
                </div>
              </div>
              
              <div className="p-3 lg:p-4 rounded-xl bg-zinc-900/50 border border-white/5">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 lg:gap-3 min-w-0">
                    <Monitor className="w-4 h-4 lg:w-5 lg:h-5 text-cyan-400 flex-shrink-0" />
                    <p className="font-medium text-white text-sm lg:text-base">{t('account.sessionsManage')}</p>
                  </div>
                </div>
                <div className="space-y-2 mt-2">
                  {sessionsData?.map((session) => (
                    <div key={session.id} className="flex items-center justify-between gap-2 p-2 lg:p-3 rounded-lg bg-zinc-800/50 border border-white/5" data-testid={`session-item-${session.id}`}>
                      <div className="flex items-center gap-2 min-w-0">
                        {session.device?.includes("Mobile") ? (
                          <Smartphone className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                        ) : (
                          <Monitor className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="text-xs lg:text-sm text-white truncate">{session.device}</p>
                          <p className="text-[10px] lg:text-xs text-muted-foreground truncate">
                            IP: {session.ip} {session.current ? `- ${t('account.currentSession')}` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {session.current ? (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px] lg:text-xs px-1.5 py-0.5">
                            <Activity className="w-2.5 h-2.5 mr-0.5" />
                            {t('account.active')}
                          </Badge>
                        ) : (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteSession(session.id)}
                            data-testid={`button-delete-session-${session.id}`}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  {sessionsData && sessionsData.filter(s => !s.current).length > 0 && (
                    <Button
                      variant="ghost"
                      className="w-full mt-2 text-red-400 hover:text-red-300"
                      onClick={deleteAllOtherSessions}
                      data-testid="button-delete-all-sessions"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                      {t('account.deleteAllSessions')}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </PageLayout>
  );
}
