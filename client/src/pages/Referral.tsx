import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Shield, 
  Users, 
  Copy, 
  Check,
  Gift,
  Crown,
  Zap,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Share2,
  TrendingUp,
  Star,
  Wallet,
  Award,
  UserPlus,
  Handshake,
  Send,
  Trophy,
  Medal,
  Bitcoin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "@/lib/i18n";
import { PageLayout } from "@/components/PageLayout";
import { useIsStandalone } from "@/hooks/use-mobile";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SiTelegram } from "react-icons/si";
import { apiRequest } from "@/lib/queryClient";

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
      className: "bg-[#0D0D10] text-zinc-300 border-white/[0.09]",
      glow: ""
    },
    PRO: { 
      icon: Crown, 
      className: "bg-cyan-500/10 border-cyan-400/40 text-cyan-300",
      glow: ""
    },
    ELITE: { 
      icon: Shield, 
      className: "bg-amber-500/10 border-amber-400/40 text-amber-300",
      glow: ""
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
  const isStandalone = useIsStandalone();
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [partnerExpanded, setPartnerExpanded] = useState(false);
  const [partnerForm, setPartnerForm] = useState({ name: "", phone: "", email: "", method: "", volume: "" });
  const { toast, dismiss } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [location] = useLocation();
  const { t, lang } = useTranslation();

  const referralTiers = [
    {
      level: 1,
      name: lang === "uk" ? "Початківець" : lang === "ru" ? "Начинающий" : lang === "es" ? "Principiante" : lang === "de" ? "Starter" : "Starter",
      referrals: "1-5",
      bonus: t('referral.starterBonus'),
      icon: Star,
      iconColor: "text-zinc-300",
    },
    {
      level: 2,
      name: lang === "uk" ? "Активний" : lang === "ru" ? "Активный" : lang === "es" ? "Activo" : lang === "de" ? "Aktiv" : "Active",
      referrals: "6-15",
      bonus: t('referral.activeBonus'),
      icon: TrendingUp,
      iconColor: "text-cyan-300",
    },
    {
      level: 3,
      name: lang === "uk" ? "Амбасадор" : lang === "ru" ? "Амбассадор" : lang === "es" ? "Embajador" : lang === "de" ? "Botschafter" : "Ambassador",
      referrals: "16-30",
      bonus: t('referral.ambassadorBonus'),
      icon: Award,
      iconColor: "text-cyan-300",
    },
    {
      level: 4,
      name: lang === "uk" ? "Елітний Партнер" : lang === "ru" ? "Элитный Партнёр" : lang === "es" ? "Socio Élite" : lang === "de" ? "Elite-Partner" : "Elite Partner",
      referrals: "31+",
      bonus: t('referral.eliteBonus'),
      icon: Crown,
      iconColor: "text-amber-300",
    },
  ];

  const { data: referralStats, isLoading: statsLoading } = useQuery<ReferralStats>({
    queryKey: ["/api/referrals"],
    enabled: isAuthenticated,
  });

  const { data: leaderboard } = useQuery<{ period: string; items: Array<{ rank: number; username: string; count: number }> }>({
    queryKey: ["/api/referrals/leaderboard", "month"],
    queryFn: async () => {
      const r = await fetch("/api/referrals/leaderboard?period=month", { credentials: "include" });
      if (!r.ok) return { period: "month", items: [] };
      return r.json();
    },
  });

  // Deduplicate referred users by ID as a safety measure
  const uniqueUsers = referralStats?.referredUsers?.filter((user, index, self) => 
    index === self.findIndex(u => u.id === user.id)
  ) || [];

  useEffect(() => {
    dismiss();
  }, [location]);

  const referralCode = referralStats?.referralCode || user?.refCode || "DARK-XXXXXX";
  const referralLink = `https://www.darkshare.store/r/${referralCode}`;

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopiedCode(true);
      toast({
        title: t('referral.codeCopied'),
        description: t('referral.codeCopiedDesc'),
      });
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (error) {
      toast({
        title: t('referral.copyErrorTitle'),
        description: t('referral.copyErrorDesc'),
        variant: "destructive",
      });
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopiedLink(true);
      toast({
        title: t('referral.linkCopied'),
        description: t('referral.linkCopiedDesc'),
      });
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (error) {
      toast({
        title: t('referral.copyErrorTitle'),
        description: t('referral.copyErrorDesc'),
        variant: "destructive",
      });
    }
  };

  const shareToTelegram = () => {
    const text = encodeURIComponent(t('referral.shareMessage').replace('{code}', referralCode) + ` ${referralLink}`);
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

  const partnershipMutation = useMutation({
    mutationFn: async (data: typeof partnerForm) => {
      const res = await apiRequest("POST", "/api/partnership/apply", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: t('referral.reversh.success'),
        description: t('referral.reversh.successDesc'),
      });
      setPartnerForm({ name: "", phone: "", email: "", method: "", volume: "" });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('errors.serverError'),
        variant: "destructive",
      });
    },
  });

  const handlePartnerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerForm.name || !partnerForm.phone || !partnerForm.email || !partnerForm.method || !partnerForm.volume) return;
    partnershipMutation.mutate(partnerForm);
  };

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&bgcolor=0E0E12&color=22D3EE&data=${encodeURIComponent(referralLink)}`;
  const shareToX = () => {
    const text = encodeURIComponent(`${t('referral.shareMessage').replace('{code}', referralCode)} ${referralLink}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
  };

  return (
    <PageLayout title={lang === "uk" ? "Реферали" : lang === "ru" ? "Рефералы" : lang === "es" ? "Referidos" : lang === "de" ? "Empfehlungen" : "Referral"} appMode={isStandalone}>
      <div className="relative flex-1 flex flex-col min-h-screen max-w-full overflow-hidden bg-[#0A0A0A] overflow-x-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[480px]" style={{ background: "radial-gradient(ellipse 70% 60% at 50% 0%, rgba(34,211,238,0.08), transparent 65%)" }} />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[640px] opacity-[0.16]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)", backgroundSize: "44px 44px", maskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black 0%, transparent 70%)", WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black 0%, transparent 70%)" }} />
        <main className="relative flex-1 p-3 sm:p-5 lg:p-10 overflow-auto max-w-full pb-24 lg:pb-12">
          <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.09] bg-white/[0.04] px-3 py-1 text-[12px] text-zinc-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                {lang === "uk" ? "Рефералка · +5 перевірок за друга · топ отримує PRO безплатно" : lang === "ru" ? "Рефералка · +5 проверок за друга · топ получает PRO бесплатно" : lang === "es" ? "Referidos · +5 verificaciones por amigo · el top obtiene PRO gratis" : lang === "de" ? "Empfehlungen · +5 Prüfungen pro Freund · Top bekommt PRO gratis" : "Referral · +5 checks per friend · top get free PRO"}
              </div>
              <h1 className="text-balance text-[24px] sm:text-[36px] lg:text-[44px] font-semibold leading-[1.05] tracking-tight text-white" data-testid="text-referral-title">
                {t('referral.title')}<br />
                <span className="text-cyan-300">{t('referral.inviteFriendsDesc')}</span>
              </h1>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
            >
              <div
                className="rounded-2xl border border-white/[0.09] bg-[#0E0E12] cursor-pointer transition-colors hover:border-amber-400/40 hover:shadow-[0_0_28px_-4px_rgba(251,191,36,0.20)]"
                data-testid="button-partner-toggle"
              >
                <button
                  type="button"
                  onClick={() => setPartnerExpanded(!partnerExpanded)}
                  className="w-full flex items-center justify-between p-4 lg:p-5 text-left"
                  data-testid="button-partner-expand"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl border border-amber-500/20 bg-amber-500/5">
                      <Handshake className="w-5 h-5 text-amber-300" />
                    </div>
                    <div>
                      <h3 className="text-[14.5px] font-semibold tracking-tight text-white" data-testid="text-reversh-title">{t('referral.reversh.title')}</h3>
                      <p className="text-[12px] text-zinc-400 mt-0.5" data-testid="text-reversh-description">{t('referral.reversh.description')}</p>
                    </div>
                  </div>
                  <motion.div
                    animate={{ rotate: partnerExpanded ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown className="w-5 h-5 text-zinc-500 flex-shrink-0" />
                  </motion.div>
                </button>

                <AnimatePresence>
                  {partnerExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 lg:px-5 lg:pb-5 pt-0">
                        <div className="border-t border-white/[0.09] pt-4">
                          <form onSubmit={handlePartnerSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <Input
                                placeholder={t('referral.reversh.name')}
                                value={partnerForm.name}
                                onChange={(e) => setPartnerForm(prev => ({ ...prev, name: e.target.value }))}
                                className="h-11 bg-[#0D0D10] border-white/[0.09]"
                                data-testid="input-partner-name"
                              />
                              <Input
                                placeholder={t('referral.reversh.phone')}
                                value={partnerForm.phone}
                                onChange={(e) => setPartnerForm(prev => ({ ...prev, phone: e.target.value }))}
                                className="h-11 bg-[#0D0D10] border-white/[0.09]"
                                data-testid="input-partner-phone"
                              />
                            </div>
                            <Input
                              type="email"
                              placeholder={t('referral.reversh.email')}
                              value={partnerForm.email}
                              onChange={(e) => setPartnerForm(prev => ({ ...prev, email: e.target.value }))}
                              className="h-11 bg-[#0D0D10] border-white/[0.09]"
                              data-testid="input-partner-email"
                            />
                            <Textarea
                              placeholder={t('referral.reversh.method')}
                              value={partnerForm.method}
                              onChange={(e) => setPartnerForm(prev => ({ ...prev, method: e.target.value }))}
                              className="bg-[#0D0D10] border-white/[0.09] min-h-[80px]"
                              data-testid="input-partner-method"
                            />
                            <Input
                              placeholder={t('referral.reversh.volume')}
                              value={partnerForm.volume}
                              onChange={(e) => setPartnerForm(prev => ({ ...prev, volume: e.target.value }))}
                              className="h-11 bg-[#0D0D10] border-white/[0.09]"
                              data-testid="input-partner-volume"
                            />
                            <Button
                              type="submit"
                              disabled={partnershipMutation.isPending || !partnerForm.name || !partnerForm.phone || !partnerForm.email || !partnerForm.method || !partnerForm.volume}
                              className="w-full bg-white text-black hover:bg-zinc-200 border-0"
                              data-testid="button-partner-submit"
                            >
                              <Send className="w-4 h-4 mr-2" />
                              {partnershipMutation.isPending ? t('common.loading') : t('referral.reversh.submit')}
                            </Button>
                          </form>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_200px] gap-3 sm:gap-4 lg:gap-6 rounded-2xl border border-white/[0.09] bg-[#0E0E12] p-3 sm:p-4 lg:p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Gift className="w-4 h-4 text-cyan-300" />
                  <h2 className="text-[12px] uppercase tracking-wider text-zinc-500">{t('referral.yourRefCode')}</h2>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1 rounded-xl border border-white/[0.09] bg-[#0D0D10] px-4 py-3 font-mono text-xl lg:text-2xl text-cyan-300 tracking-[0.15em] text-center sm:text-left font-bold" data-testid="text-ref-code-display">
                    {referralCode}
                  </div>
                  <button
                    onClick={copyCode}
                    className="inline-flex h-12 min-h-[44px] items-center justify-center gap-2 rounded-xl bg-white px-4 text-[13px] font-medium text-black transition-colors hover:bg-zinc-200 active:scale-[0.97] touch-manipulation"
                    data-testid="button-copy-code"
                  >
                    {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copiedCode ? t('referral.copied') : t('referral.copyBtn')}
                  </button>
                </div>

                <div>
                  <p className="text-[11px] uppercase tracking-wider text-zinc-500 mb-2">{t('referral.referralLink')}</p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1 rounded-lg border border-white/[0.09] bg-[#0D0D10] px-3 py-2 font-mono text-[12px] text-zinc-300 truncate">
                      {referralLink}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={copyLink}
                        className="grid h-10 w-10 place-items-center rounded-lg border border-white/[0.09] text-zinc-400 transition-colors hover:border-white/[0.20] hover:text-white touch-manipulation"
                        data-testid="button-copy-link"
                        title="Copy"
                      >
                        {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={shareToTelegram}
                        className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-white/[0.09] bg-white/[0.04] px-3 text-[12px] text-zinc-200 transition-colors hover:border-white/[0.20] hover:text-white touch-manipulation"
                        data-testid="button-share-telegram"
                      >
                        <SiTelegram className="w-3.5 h-3.5 text-cyan-300" /> Telegram
                      </button>
                      <button
                        onClick={shareToX}
                        className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-white/[0.09] bg-white/[0.04] px-3 text-[12px] text-zinc-200 transition-colors hover:border-white/[0.20] hover:text-white touch-manipulation"
                        data-testid="button-share-x"
                      >
                        <Share2 className="w-3.5 h-3.5" /> X
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-white/[0.09] bg-[#0D0D10] p-3 sm:p-4">
                <img src={qrUrl} alt="Referral QR" width={160} height={160} className="rounded-md" data-testid="img-ref-qr" />
                <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">scan to invite</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="rounded-xl border border-white/[0.09] bg-[#0E0E12] p-4 lg:p-5 transition-colors hover:border-cyan-400/30">
                <div className="flex items-center gap-2 mb-3 text-[11px] uppercase tracking-wider text-zinc-500">
                  <UserPlus className="w-3.5 h-3.5 text-cyan-300" />
                  <span>{t('referral.totalReferrals')}</span>
                </div>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white font-mono tabular-nums">
                  {statsLoading ? "—" : referralStats?.referralCount || 0}
                </p>
                <p className="text-[11px] text-zinc-500 mt-1">{t('referral.referralsLabel')}</p>
              </div>

              <div className="rounded-xl border border-white/[0.09] bg-[#0E0E12] p-4 lg:p-5 transition-colors hover:border-cyan-400/30">
                <div className="flex items-center gap-2 mb-3 text-[11px] uppercase tracking-wider text-zinc-500">
                  <Wallet className="w-3.5 h-3.5 text-amber-300" />
                  <span>{t('referral.totalBonus')}</span>
                </div>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white font-mono tabular-nums">
                  +{statsLoading ? "—" : referralStats?.totalEarned || 0}
                </p>
                <p className="text-[11px] text-zinc-500 mt-1">{t('referral.earnedRequests')}</p>
              </div>

              <div className="rounded-xl border border-white/[0.09] bg-[#0E0E12] p-4 lg:p-5 transition-colors hover:border-cyan-400/30">
                <div className="flex items-center gap-2 mb-3 text-[11px] uppercase tracking-wider text-zinc-500">
                  <Gift className="w-3.5 h-3.5 text-cyan-300" />
                  <span>{t('referral.pendingBonusLabel')}</span>
                </div>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white font-mono tabular-nums">
                  +{statsLoading ? "—" : referralStats?.pendingBonus || 0}
                </p>
                <p className="text-[11px] text-zinc-500 mt-1">{t('referral.bonus')}</p>
              </div>
            </div>

            <div className="p-4 lg:p-6 rounded-2xl border border-white/[0.09] bg-[#0E0E12]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-cyan-300" />
                  <h2 className="text-[12px] uppercase tracking-wider text-zinc-500">{t('referral.rewardLevels')}</h2>
                </div>
                <span className="text-[11px] font-mono text-zinc-600">L{getCurrentTierLevel()} / L4</span>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                {referralTiers.map((tier, idx) => {
                  const currentLevel = getCurrentTierLevel();
                  const isActive = tier.level === currentLevel;
                  const isCompleted = tier.level < currentLevel;

                  return (
                    <motion.div
                      key={tier.level}
                      className={`relative p-4 rounded-xl border transition-colors ${
                        isActive
                          ? "border-cyan-400/40 bg-[#0E0E12]/80 shadow-[0_0_24px_-4px_rgba(34,211,238,0.22)]"
                          : isCompleted
                            ? "border-emerald-400/30 bg-[#0D0D10]"
                            : "border-white/[0.09] bg-[#0D0D10] hover:border-white/[0.20]"
                      }`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05, duration: 0.25 }}
                      data-testid={`tier-${tier.level}`}
                    >
                      {isActive && (
                        <div className="absolute -top-2 -right-2">
                          <span className="inline-flex items-center rounded-full border border-cyan-400/40 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-cyan-300">
                            {t('referral.current')}
                          </span>
                        </div>
                      )}
                      {isCompleted && (
                        <div className="absolute -top-2 -right-2">
                          <div className="w-5 h-5 rounded-full border border-emerald-400/40 bg-emerald-500/10 flex items-center justify-center">
                            <Check className="w-3 h-3 text-emerald-300" />
                          </div>
                        </div>
                      )}
                      <div className="w-9 h-9 rounded-lg border border-white/[0.09] bg-white/[0.04] flex items-center justify-center mb-3">
                        <tier.icon className={`w-4.5 h-4.5 ${isActive || isCompleted ? tier.iconColor : "text-zinc-500"}`} />
                      </div>
                      <h3 className={`text-[14px] font-semibold tracking-tight mb-1 ${isActive || isCompleted ? "text-white" : "text-zinc-300"}`}>
                        {tier.name}
                      </h3>
                      <p className="text-[11px] font-mono text-zinc-500 mb-2">
                        {tier.referrals} {t('referral.referralsLabel')}
                      </p>
                      <p className={`text-[12px] leading-relaxed ${isActive || isCompleted ? "text-zinc-300" : "text-zinc-500"}`}>
                        {tier.bonus}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 lg:p-6 rounded-2xl border border-white/[0.09] bg-[#0E0E12]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-cyan-300" />
                  <h2 className="text-[12px] uppercase tracking-wider text-zinc-500">{t('referral.invitedUsers')}</h2>
                </div>
                <span className="inline-flex items-center rounded-full border border-white/[0.09] bg-white/[0.04] px-2 py-0.5 text-[11px] font-mono text-zinc-300">
                  {uniqueUsers?.length || 0}
                </span>
              </div>
              
              {statsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-300 rounded-full animate-spin" />
                </div>
              ) : uniqueUsers && uniqueUsers.length > 0 ? (
                <div className="space-y-2">
                  {uniqueUsers.map((refUser, idx) => (
                    <motion.div
                      key={refUser.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-[#0D0D10] border border-white/[0.09] hover:border-white/[0.20] transition-colors"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05, duration: 0.2 }}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8 border border-white/[0.09]">
                          <AvatarFallback className="bg-cyan-500/10 text-cyan-300 text-xs font-mono">
                            {refUser.username?.slice(0, 2).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-white">@{refUser.username || "user"}</p>
                          <p className="text-[11px] font-mono text-zinc-500">
                            {new Date(refUser.joinedAt).toLocaleDateString("uk-UA")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <TierBadge tier={refUser.tier} />
                        {refUser.paid ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono text-emerald-300">
                            <Check className="w-3 h-3" />
                            {t('referral.bonus')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-mono text-amber-300">
                            {t('referral.waiting')}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-14 h-14 rounded-xl border border-white/[0.09] bg-white/[0.04] flex items-center justify-center mb-4">
                    <UserPlus className="w-6 h-6 text-zinc-500" />
                  </div>
                  <p className="text-zinc-300 mb-2">{t('referral.noReferrals')}</p>
                  <p className="text-[12px] text-zinc-500 max-w-xs">
                    {t('referral.inviteFriendsHint')}
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 lg:p-6 rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-[#0E0E12] to-[#0E0E12]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-white">Monthly Leaderboard</h3>
                  <p className="text-[11px] text-zinc-500">Top 10 referrers this month win 1-month PRO subscription. Updated hourly.</p>
                </div>
              </div>
              {leaderboard?.items && leaderboard.items.length > 0 ? (
                <div className="space-y-1.5">
                  {leaderboard.items.slice(0, 10).map((row) => (
                    <div
                      key={row.rank}
                      className="flex items-center justify-between gap-2 p-2 sm:p-2.5 rounded-lg bg-[#0D0D10] border border-white/[0.09] hover:border-white/[0.18] transition-colors"
                      data-testid={`row-leaderboard-${row.rank}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono font-bold flex-shrink-0 ${
                          row.rank === 1 ? "bg-amber-500/20 border border-amber-400/30 text-amber-200" :
                          row.rank === 2 ? "bg-zinc-300/10 border border-zinc-300/20 text-zinc-200" :
                          row.rank === 3 ? "bg-orange-500/15 border border-orange-400/25 text-orange-200" :
                          "bg-white/[0.06] border border-white/[0.09] text-zinc-400"
                        }`}>
                          {row.rank <= 3 ? <Medal className="w-3.5 h-3.5" /> : row.rank}
                        </div>
                        <span className="text-sm text-white/90 truncate font-mono max-w-[120px] sm:max-w-none">{row.username}</span>
                      </div>
                      <span className="text-sm font-mono text-cyan-300 flex-shrink-0">{row.count} ref</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-500 text-center py-6">No referrals yet this month — be first!</p>
              )}
            </div>

            <div className="p-4 lg:p-6 rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-[#0E0E12] to-[#0E0E12]">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <Bitcoin className="w-5 h-5 text-amber-300" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-base text-white mb-1">Crypto Payouts Available</h3>
                  <p className="text-xs text-zinc-400 mb-2">Earn 30% commission and withdraw in USDT (TRC20/ERC20), BTC, ETH or TON. Minimum $25.</p>
                  <a href="/account" className="inline-flex items-center gap-1.5 text-xs text-amber-300 hover:text-amber-200 font-mono" data-testid="link-setup-payout">
                    Set up payout address →
                  </a>
                </div>
              </div>
            </div>

            <div className="p-4 lg:p-6 rounded-2xl border border-white/[0.09] bg-[#0E0E12]">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl border border-cyan-500/20 bg-cyan-500/5 flex items-center justify-center flex-shrink-0">
                  <Gift className="w-5 h-5 text-cyan-300" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">{t('referral.howItWorksTitle')}</h3>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs text-primary font-bold">1</span>
                      </div>
                      <p>{t('referral.step1')}</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs text-primary font-bold">2</span>
                      </div>
                      <p>{t('referral.step2')}</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs text-primary font-bold">3</span>
                      </div>
                      <p>{t('referral.step3')}</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs text-primary font-bold">4</span>
                      </div>
                      <p>{t('referral.step4')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </main>

      </div>
    </PageLayout>
  );
}
