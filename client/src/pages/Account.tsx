import { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { 
  Shield, 
  User,
  Crown,
  Zap,
  ShieldAlert,
  Settings,
  Bell,
  BellRing,
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
  LogOut,
  KeyRound,
  ShieldCheck,
  QrCode,
  X,
  Info,
  HardDrive,
  Wifi
} from "lucide-react";
import { Input } from "@/components/ui/input";
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
import { apiRequest, queryClient } from "@/lib/queryClient";
import { PageLayout } from "@/components/PageLayout";
import { useIsStandalone } from "@/hooks/use-mobile";
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
  const isStandalone = useIsStandalone();
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
  const [twoFASetupData, setTwoFASetupData] = useState<{ uri: string; secret: string } | null>(null);
  const [twoFACode, setTwoFACode] = useState("");
  const [twoFALoading, setTwoFALoading] = useState(false);
  const [twoFADisableCode, setTwoFADisableCode] = useState("");
  const [showTwoFASetup, setShowTwoFASetup] = useState(false);
  const [showTwoFADisable, setShowTwoFADisable] = useState(false);
  const [qrImageUrl, setQrImageUrl] = useState("");

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
      queryClient.invalidateQueries({ queryKey: ['/api/user/sessions'] });
    } catch {
      toast({ title: t('account.sessionDeleteError'), variant: "destructive" });
    }
  }, [toast, t]);

  const handleNotificationChange = useCallback((field: string, value: boolean) => {
    setNotifications(prev => ({ ...prev, [field]: value }));
    if (field === "email" || field === "telegram" || field === "threats") {
      saveSettings({ notifsOn: value });
    } else if (field === "updates") {
      saveSettings({ digestsOn: value });
    }
  }, [saveSettings]);

  const startTwoFASetup = useCallback(async () => {
    setTwoFALoading(true);
    try {
      const res = await apiRequest("POST", "/api/2fa/setup");
      const data = await res.json();
      setTwoFASetupData(data);
      setShowTwoFASetup(true);
      const QRCode = (await import("qrcode")).default;
      const url = await QRCode.toDataURL(data.uri, { width: 200, margin: 2 });
      setQrImageUrl(url);
    } catch {
      toast({ title: t('account.twoFactorError'), variant: "destructive" });
    } finally {
      setTwoFALoading(false);
    }
  }, [toast, t]);

  const verifyTwoFA = useCallback(async () => {
    if (twoFACode.length !== 6) return;
    setTwoFALoading(true);
    try {
      await apiRequest("POST", "/api/2fa/verify", { token: twoFACode });
      toast({ title: t('account.twoFactorSuccess') });
      setShowTwoFASetup(false);
      setTwoFASetupData(null);
      setTwoFACode("");
      setQrImageUrl("");
      await checkAuth();
    } catch {
      toast({ title: t('account.twoFactorInvalidCode'), variant: "destructive" });
      setTwoFACode("");
    } finally {
      setTwoFALoading(false);
    }
  }, [twoFACode, toast, t, checkAuth]);

  const disableTwoFA = useCallback(async () => {
    if (twoFADisableCode.length !== 6) return;
    setTwoFALoading(true);
    try {
      await apiRequest("POST", "/api/2fa/disable", { token: twoFADisableCode });
      toast({ title: t('account.twoFactorDisableSuccess') });
      setShowTwoFADisable(false);
      setTwoFADisableCode("");
      await checkAuth();
    } catch {
      toast({ title: t('account.twoFactorInvalidCode'), variant: "destructive" });
      setTwoFADisableCode("");
    } finally {
      setTwoFALoading(false);
    }
  }, [twoFADisableCode, toast, t, checkAuth]);

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
      queryClient.invalidateQueries({ queryKey: ['/api/user/sessions'] });
    } catch {
      toast({ title: t('account.allSessionsDeleteError'), variant: "destructive" });
    }
  }, [sessionsData, toast, t]);

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
      FREE: 3,
      BASIC: 30,
      PRO: 50,
      ENTERPRISE: 999999,
      GROUPS: 999999,
    };
    const total = tierLimits[userTier] || 3;
    const left = user?.requestsLeft ?? total;
    return {
      used: Math.max(0, total - left),
      total,
      left,
    };
  }, [userTier, user?.requestsLeft]);

  const [pushEnabled, setPushEnabled] = useState(false);
  const [cacheSize, setCacheSize] = useState<string | null>(null);
  const [lastSyncTime] = useState(() => new Date().toISOString());

  useEffect(() => {
    if ("Notification" in window) {
      setPushEnabled(Notification.permission === "granted");
    }
  }, []);

  useEffect(() => {
    if ("caches" in window) {
      caches.keys().then(async (names) => {
        let totalSize = 0;
        for (const name of names) {
          const cache = await caches.open(name);
          const keys = await cache.keys();
          totalSize += keys.length * 50 * 1024;
        }
        if (totalSize < 1024 * 1024) {
          setCacheSize(`${(totalSize / 1024).toFixed(1)} KB`);
        } else {
          setCacheSize(`${(totalSize / (1024 * 1024)).toFixed(1)} MB`);
        }
      });
    } else {
      setCacheSize("N/A");
    }
  }, []);

  const handlePushToggle = useCallback(async (enable: boolean) => {
    if (!("Notification" in window)) {
      toast({ title: t('account.pushNotSupported'), variant: "destructive" });
      return;
    }
    if (enable) {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        setPushEnabled(true);
        toast({ title: t('account.pushEnabled') });
      } else {
        setPushEnabled(false);
        toast({ title: t('account.pushPermissionDenied'), variant: "destructive" });
      }
    } else {
      setPushEnabled(false);
      toast({ title: t('account.pushDisabled') });
    }
  }, [toast, t]);

  const securityLevel = useMemo(() => {
    const totalChecks = reports.length;
    if (totalChecks >= 100) return { level: t('account.levelElite'), color: "from-purple-500 to-pink-500", textColor: "text-purple-400", borderColor: "border-purple-500/30", bgColor: "bg-purple-500/10" };
    if (totalChecks >= 50) return { level: t('account.levelExpert'), color: "from-orange-500 to-red-500", textColor: "text-orange-400", borderColor: "border-orange-500/30", bgColor: "bg-orange-500/10" };
    if (totalChecks >= 10) return { level: t('account.levelAnalyst'), color: "from-blue-500 to-cyan-500", textColor: "text-blue-400", borderColor: "border-blue-500/30", bgColor: "bg-blue-500/10" };
    return { level: t('account.levelBeginner'), color: "from-zinc-500 to-zinc-400", textColor: "text-zinc-400", borderColor: "border-zinc-500/30", bgColor: "bg-zinc-500/10" };
  }, [reports.length, t]);

  const heatmapData = useMemo(() => {
    const now = new Date();
    const days: { date: string; count: number; dayOfWeek: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const count = reports.filter(r => r.createdAt?.startsWith(dateStr)).length;
      days.push({ date: dateStr, count, dayOfWeek: d.getDay() });
    }
    return days;
  }, [reports]);

  const isDataLoading = reportsLoading || watchesLoading || referralsLoading;

  return (
    <PageLayout title="Account" appMode={isStandalone}>
      <main className="flex-1 overflow-y-auto pb-28 lg:pb-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
        <div className="p-4 lg:p-8 space-y-6 lg:space-y-8 max-w-6xl mx-auto">
          <motion.div 
            className="relative p-4 lg:p-8 rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900/95 to-zinc-950 border border-white/10 overflow-hidden glass-deep"
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
                    <span data-testid="text-telegram-id" className="truncate">{user?.tgId?.startsWith('replit:') ? 'Account' : t('account.telegramId')}: {user?.tgId?.startsWith('replit:') ? (user?.username || 'Web User') : (user?.tgId || "N/A")}</span>
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
                <div className="rounded-xl border border-white/10 bg-[#0E0E12] p-4 lg:p-5 transition-colors hover:border-cyan-400/30">
                  <div className="flex items-center gap-2 mb-3 text-[11px] uppercase tracking-wider text-zinc-500">
                    <BarChart3 className="w-3.5 h-3.5 text-cyan-300" />
                    <span>{t('account.totalChecks')}</span>
                  </div>
                  <p className="text-2xl lg:text-3xl font-semibold tracking-tight text-white font-mono" data-testid="text-total-checks">{stats.totalChecks}</p>
                </div>

                <div className="rounded-xl border border-white/10 bg-[#0E0E12] p-4 lg:p-5 transition-colors hover:border-cyan-400/30">
                  <div className="flex items-center gap-2 mb-3 text-[11px] uppercase tracking-wider text-zinc-500">
                    <Activity className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{t('account.activeMonitors')}</span>
                  </div>
                  <p className="text-2xl lg:text-3xl font-semibold tracking-tight text-white font-mono" data-testid="text-active-monitors">{stats.activeMonitors}</p>
                </div>

                <div className="rounded-xl border border-white/10 bg-[#0E0E12] p-4 lg:p-5 transition-colors hover:border-cyan-400/30">
                  <div className="flex items-center gap-2 mb-3 text-[11px] uppercase tracking-wider text-zinc-500">
                    <Users className="w-3.5 h-3.5 text-cyan-300" />
                    <span>{t('account.referrals')}</span>
                  </div>
                  <p className="text-2xl lg:text-3xl font-semibold tracking-tight text-white font-mono" data-testid="text-referrals-count">{stats.referralsCount}</p>
                </div>

                <div className="rounded-xl border border-white/10 bg-[#0E0E12] p-4 lg:p-5 transition-colors hover:border-cyan-400/30">
                  <div className="flex items-center gap-2 mb-3 text-[11px] uppercase tracking-wider text-zinc-500">
                    <TrendingUp className="w-3.5 h-3.5 text-cyan-300" />
                    <span>{t('account.top')}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {stats.mostUsedTypes.length === 0 ? (
                      <span className="text-[12px] text-zinc-500 font-mono">—</span>
                    ) : stats.mostUsedTypes.map((type, idx) => (
                      <span key={idx} className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[11px] font-mono text-zinc-300">
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}
          </motion.div>

          <motion.div 
            className="p-4 lg:p-6 rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900/95 to-zinc-950 border border-white/10 glass-deep"
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
            className="p-4 lg:p-6 rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900/95 to-zinc-950 border border-white/10 glass-deep"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
          >
            <div className="flex items-center justify-between gap-2 mb-4 lg:mb-6 flex-wrap">
              <div className="flex items-center gap-2 lg:gap-3">
                <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-cyan-500/10 flex items-center justify-center">
                  <Shield className="w-4 h-4 lg:w-5 lg:h-5 text-cyan-400" />
                </div>
                <h2 className="text-lg lg:text-xl font-bold text-white" data-testid="text-security-level-title">{t('account.securityLevel')}</h2>
              </div>
              <Badge className={`${securityLevel.bgColor} ${securityLevel.textColor} ${securityLevel.borderColor} border text-sm lg:text-base px-3 lg:px-4 py-1 lg:py-1.5 font-bold tracking-wider`} data-testid="badge-security-level">
                <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${securityLevel.color} mr-2`} />
                {securityLevel.level}
              </Badge>
            </div>
            <div className="flex items-center gap-3 p-3 lg:p-4 rounded-xl bg-zinc-900/50 border border-white/5">
              <div className={`w-14 h-14 lg:w-16 lg:h-16 rounded-xl bg-gradient-to-br ${securityLevel.color} flex items-center justify-center shadow-lg`}>
                <Shield className="w-7 h-7 lg:w-8 lg:h-8 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-lg lg:text-xl font-bold ${securityLevel.textColor}`} data-testid="text-security-level-value">{securityLevel.level}</p>
                <p className="text-xs lg:text-sm text-muted-foreground">
                  {stats.totalChecks} {t('account.totalChecks').toLowerCase()} — {
                    reports.length < 10 ? `10 ${t('account.scans')} → ${t('account.levelAnalyst')}` :
                    reports.length < 50 ? `50 ${t('account.scans')} → ${t('account.levelExpert')}` :
                    reports.length < 100 ? `100 ${t('account.scans')} → ${t('account.levelElite')}` :
                    t('account.levelElite')
                  }
                </p>
                <Progress
                  value={Math.min(100, reports.length >= 100 ? 100 : reports.length >= 50 ? (reports.length / 100) * 100 : reports.length >= 10 ? (reports.length / 50) * 100 : (reports.length / 10) * 100)}
                  className="h-1.5 mt-2 bg-zinc-800"
                />
              </div>
            </div>
          </motion.div>

          <motion.div
            className="p-4 lg:p-6 rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900/95 to-zinc-950 border border-white/10 glass-deep"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.27 }}
          >
            <div className="flex items-center justify-between gap-2 mb-4 lg:mb-6 flex-wrap">
              <div className="flex items-center gap-2 lg:gap-3">
                <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg bg-gradient-to-br from-green-500/20 to-cyan-500/10 flex items-center justify-center">
                  <Activity className="w-4 h-4 lg:w-5 lg:h-5 text-green-400" />
                </div>
                <h2 className="text-lg lg:text-xl font-bold text-white" data-testid="text-heatmap-title">{t('account.activityHeatmap')}</h2>
              </div>
              <span className="text-xs lg:text-sm text-muted-foreground">{t('account.activityLast30Days')}</span>
            </div>
            <div className="grid grid-cols-10 gap-1 lg:gap-1.5" data-testid="activity-heatmap">
              {heatmapData.map((day, idx) => {
                const intensity = day.count === 0 ? 0 : day.count <= 1 ? 1 : day.count <= 3 ? 2 : day.count <= 5 ? 3 : 4;
                const colors = [
                  "bg-zinc-800/60",
                  "bg-green-900/60",
                  "bg-green-700/60",
                  "bg-green-500/60",
                  "bg-green-400/80",
                ];
                return (
                  <div
                    key={idx}
                    className={`aspect-square rounded-sm ${colors[intensity]} border border-white/5 relative group`}
                    data-testid={`heatmap-cell-${idx}`}
                  >
                    <div className="invisible group-hover:visible absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-[10px] text-white whitespace-nowrap z-50">
                      {day.date}: {day.count} {t('account.scans')}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-end gap-1.5 mt-3">
              <span className="text-[10px] lg:text-xs text-muted-foreground mr-1">{t('account.noActivity')}</span>
              <div className="w-3 h-3 rounded-sm bg-zinc-800/60 border border-white/5" />
              <div className="w-3 h-3 rounded-sm bg-green-900/60 border border-white/5" />
              <div className="w-3 h-3 rounded-sm bg-green-700/60 border border-white/5" />
              <div className="w-3 h-3 rounded-sm bg-green-500/60 border border-white/5" />
              <div className="w-3 h-3 rounded-sm bg-green-400/80 border border-white/5" />
            </div>
          </motion.div>

          <motion.div 
            className="p-4 lg:p-6 rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900/95 to-zinc-950 border border-white/10 glass-deep"
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

                <div className="flex items-center justify-between gap-2 p-3 lg:p-4 rounded-xl bg-gradient-to-br from-amber-500/10 via-zinc-900/50 to-transparent border border-amber-500/20">
                  <div className="flex items-center gap-2 lg:gap-3 min-w-0">
                    <BellRing className="w-4 h-4 lg:w-5 lg:h-5 text-amber-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-white text-sm lg:text-base truncate">{t('account.pushNotifications')}</p>
                      <p className="text-xs lg:text-sm text-muted-foreground">{t('account.pushNotificationsDesc')}</p>
                    </div>
                  </div>
                  <Switch
                    checked={pushEnabled}
                    onCheckedChange={handlePushToggle}
                    data-testid="switch-push-notifications"
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
            className="p-4 lg:p-6 rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900/95 to-zinc-950 border border-white/10 glass-deep"
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
                {userTier !== "FREE" && user?.subscriptionExpiresAt && (() => {
                  const expiryDate = new Date(user.subscriptionExpiresAt);
                  const now = new Date();
                  const diffMs = expiryDate.getTime() - now.getTime();
                  const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
                  const isExpired = daysRemaining <= 0;
                  const progressPct = Math.max(0, Math.min(100, (daysRemaining / 30) * 100));
                  const colorClass = isExpired ? "text-red-400" : daysRemaining <= 3 ? "text-red-400" : daysRemaining <= 7 ? "text-orange-400" : "text-cyan-400";
                  const barColor = isExpired ? "bg-red-500" : daysRemaining <= 3 ? "bg-red-500" : daysRemaining <= 7 ? "bg-orange-500" : "bg-cyan-500";

                  const subLabels = {
                    daysLeft: lang === "uk" ? "днів залишилось" : lang === "ru" ? "дней осталось" : "days left",
                    expires: lang === "uk" ? "Закінчується" : lang === "ru" ? "Истекает" : "Expires",
                    expired: lang === "uk" ? "Підписка закінчилась!" : lang === "ru" ? "Подписка истекла!" : "Subscription expired!",
                    autoRenew: lang === "uk" ? "Авто-продовження" : lang === "ru" ? "Авто-продление" : "Auto-renew",
                    on: lang === "uk" ? "увімкнено" : lang === "ru" ? "включено" : "on",
                    off: lang === "uk" ? "вимкнено" : lang === "ru" ? "выключено" : "off",
                    renew: lang === "uk" ? "Продовжити" : lang === "ru" ? "Продлить" : "Renew",
                  };

                  const formattedDate = expiryDate.toLocaleDateString(lang === "uk" ? "uk-UA" : lang === "ru" ? "ru-RU" : "en-US", {
                    day: "numeric", month: "long", year: "numeric",
                  });

                  return (
                    <div className="mt-3 space-y-2" data-testid="subscription-expiry-info">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="text-xs lg:text-sm text-muted-foreground">
                          {isExpired ? subLabels.expired : `${subLabels.expires}: ${formattedDate}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className={`text-sm font-bold font-mono ${colorClass}`} data-testid="text-days-remaining-account">
                          {isExpired ? "0" : daysRemaining} {subLabels.daysLeft}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div className={`h-full rounded-full ${barColor} transition-all duration-500`} style={{ width: `${progressPct}%` }} />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-muted-foreground">
                          {subLabels.autoRenew}: <span className={user?.autoRenew ? "text-cyan-400" : "text-zinc-400"}>{user?.autoRenew ? subLabels.on : subLabels.off}</span>
                        </span>
                        {(isExpired || daysRemaining <= 5) && (
                          <Link href="/pricing">
                            <Button size="sm" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-xs h-7" data-testid="button-renew">
                              <RefreshCw className="w-3 h-3 mr-1" />{subLabels.renew}
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })()}
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
            className="p-4 lg:p-6 rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900/95 to-zinc-950 border border-white/10 glass-deep"
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

              <div className="p-3 lg:p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 via-zinc-900/50 to-transparent border border-cyan-500/20">
                <div className="flex items-center justify-between gap-2 mb-2 lg:mb-3">
                  <div className="flex items-center gap-2 lg:gap-3 min-w-0">
                    <ShieldCheck className="w-4 h-4 lg:w-5 lg:h-5 text-cyan-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-white text-sm lg:text-base">{t('account.twoFactorAuth')}</p>
                      <p className="text-xs lg:text-sm text-muted-foreground">{t('account.twoFactorDesc')}</p>
                    </div>
                  </div>
                  <Badge className={`text-xs lg:text-sm px-2 py-0.5 flex-shrink-0 ${user?.totpEnabled ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' : 'bg-zinc-700/50 text-zinc-400 border-zinc-600/50'}`}>
                    {user?.totpEnabled ? t('account.twoFactorEnabled') : t('account.twoFactorDisabled')}
                  </Badge>
                </div>

                <AnimatePresence mode="wait">
                  {!user?.totpEnabled && !showTwoFASetup && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <Button
                        variant="ghost"
                        className="w-full mt-2 text-cyan-400"
                        onClick={startTwoFASetup}
                        disabled={twoFALoading}
                        data-testid="button-2fa-enable"
                      >
                        <KeyRound className="w-3.5 h-3.5 mr-1.5" />
                        {twoFALoading ? (
                          <div className="w-4 h-4 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
                        ) : t('account.twoFactorEnable')}
                      </Button>
                    </motion.div>
                  )}

                  {showTwoFASetup && twoFASetupData && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3 mt-3"
                    >
                      <div className="flex flex-col items-center gap-3 p-4 rounded-lg bg-zinc-900/80 border border-white/5">
                        <p className="text-xs text-muted-foreground text-center">{t('account.twoFactorScanQR')}</p>
                        {qrImageUrl && (
                          <div className="p-2 rounded-lg bg-white">
                            <img src={qrImageUrl} alt="QR Code" className="w-40 h-40" data-testid="img-2fa-qr" />
                          </div>
                        )}
                        <div className="w-full">
                          <p className="text-xs text-muted-foreground mb-1">{t('account.twoFactorManualKey')}</p>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 text-xs font-mono text-cyan-400 bg-zinc-800 px-2 py-1.5 rounded border border-zinc-700 break-all" data-testid="text-2fa-secret">
                              {twoFASetupData.secret}
                            </code>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                navigator.clipboard.writeText(twoFASetupData.secret);
                                toast({ title: t('account.keyCopied') });
                              }}
                              data-testid="button-copy-2fa-secret"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                        <div className="w-full space-y-2">
                          <p className="text-xs text-muted-foreground">{t('account.twoFactorEnterCode')}</p>
                          <Input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={6}
                            placeholder="000000"
                            value={twoFACode}
                            onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, ""))}
                            onKeyDown={(e) => e.key === "Enter" && verifyTwoFA()}
                            className="text-center text-lg font-mono tracking-[0.4em] bg-zinc-800 border-zinc-700"
                            data-testid="input-2fa-setup-code"
                          />
                          <div className="flex gap-2">
                            <Button
                              onClick={verifyTwoFA}
                              disabled={twoFACode.length !== 6 || twoFALoading}
                              className="flex-1 bg-cyan-600"
                              data-testid="button-2fa-verify"
                            >
                              {twoFALoading ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              ) : (
                                <>
                                  <Check className="w-3.5 h-3.5 mr-1.5" />
                                  {t('account.twoFactorVerify')}
                                </>
                              )}
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                setShowTwoFASetup(false);
                                setTwoFASetupData(null);
                                setTwoFACode("");
                                setQrImageUrl("");
                              }}
                              data-testid="button-2fa-cancel"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {user?.totpEnabled && !showTwoFADisable && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <Button
                        variant="ghost"
                        className="w-full mt-2 text-red-400"
                        onClick={() => setShowTwoFADisable(true)}
                        data-testid="button-2fa-disable-start"
                      >
                        <X className="w-3.5 h-3.5 mr-1.5" />
                        {t('account.twoFactorDisable')}
                      </Button>
                    </motion.div>
                  )}

                  {showTwoFADisable && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2 mt-3"
                    >
                      <p className="text-xs text-muted-foreground">{t('account.twoFactorEnterCode')}</p>
                      <Input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        placeholder="000000"
                        value={twoFADisableCode}
                        onChange={(e) => setTwoFADisableCode(e.target.value.replace(/\D/g, ""))}
                        onKeyDown={(e) => e.key === "Enter" && disableTwoFA()}
                        className="text-center text-lg font-mono tracking-[0.4em] bg-zinc-800 border-zinc-700"
                        data-testid="input-2fa-disable-code"
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={disableTwoFA}
                          disabled={twoFADisableCode.length !== 6 || twoFALoading}
                          variant="destructive"
                          className="flex-1"
                          data-testid="button-2fa-disable-confirm"
                        >
                          {twoFALoading ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : t('account.twoFactorDisable')}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setShowTwoFADisable(false);
                            setTwoFADisableCode("");
                          }}
                          data-testid="button-2fa-disable-cancel"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
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

          <motion.div
            className="p-4 lg:p-6 rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900/95 to-zinc-950 border border-white/10 glass-deep"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <div className="flex items-center gap-2 lg:gap-3 mb-4 lg:mb-6">
              <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg bg-gradient-to-br from-slate-500/20 to-zinc-500/10 flex items-center justify-center">
                <Info className="w-4 h-4 lg:w-5 lg:h-5 text-slate-400" />
              </div>
              <h2 className="text-lg lg:text-xl font-bold text-white" data-testid="text-app-info-title">{t('account.appInfo')}</h2>
            </div>

            <div className="space-y-2 lg:space-y-3">
              <div className="flex items-center justify-between gap-2 p-3 lg:p-4 rounded-xl bg-zinc-900/50 border border-white/5">
                <div className="flex items-center gap-2 lg:gap-3 min-w-0">
                  <Zap className="w-4 h-4 lg:w-5 lg:h-5 text-blue-400 flex-shrink-0" />
                  <p className="font-medium text-white text-sm lg:text-base">{t('account.appVersion')}</p>
                </div>
                <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-xs lg:text-sm px-2 py-0.5" data-testid="text-app-version">
                  v4.4
                </Badge>
              </div>

              <div className="flex items-center justify-between gap-2 p-3 lg:p-4 rounded-xl bg-zinc-900/50 border border-white/5">
                <div className="flex items-center gap-2 lg:gap-3 min-w-0">
                  <HardDrive className="w-4 h-4 lg:w-5 lg:h-5 text-amber-400 flex-shrink-0" />
                  <p className="font-medium text-white text-sm lg:text-base">{t('account.cacheSize')}</p>
                </div>
                <span className="text-xs lg:text-sm font-mono text-muted-foreground" data-testid="text-cache-size">
                  {cacheSize || t('account.calculating')}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 p-3 lg:p-4 rounded-xl bg-zinc-900/50 border border-white/5">
                <div className="flex items-center gap-2 lg:gap-3 min-w-0">
                  <Wifi className="w-4 h-4 lg:w-5 lg:h-5 text-green-400 flex-shrink-0" />
                  <p className="font-medium text-white text-sm lg:text-base">{t('account.lastSync')}</p>
                </div>
                <span className="text-xs lg:text-sm font-mono text-muted-foreground" data-testid="text-last-sync">
                  {new Date(lastSyncTime).toLocaleString(lang === "uk" ? "uk-UA" : lang === "ru" ? "ru-RU" : lang === "es" ? "es-ES" : lang === "de" ? "de-DE" : "en-US")}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </PageLayout>
  );
}
