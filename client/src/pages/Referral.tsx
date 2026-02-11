import { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
  ExternalLink,
  Share2,
  TrendingUp,
  Star,
  Wallet,
  Award,
  UserPlus,
  Handshake,
  Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "@/lib/i18n";
import { PageLayout } from "@/components/PageLayout";
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
  const [partnerForm, setPartnerForm] = useState({ name: "", phone: "", email: "", method: "", volume: "" });
  const { toast, dismiss } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [location] = useLocation();
  const { t } = useTranslation();

  const referralTiers = [
    {
      level: 1,
      name: "Starter",
      referrals: "1-5",
      bonus: t('referral.starterBonus'),
      icon: Star,
      gradient: "from-zinc-500/20 via-zinc-500/10 to-transparent",
      iconColor: "text-zinc-400",
      borderColor: "border-zinc-500/30",
    },
    {
      level: 2,
      name: "Active",
      referrals: "6-15",
      bonus: t('referral.activeBonus'),
      icon: TrendingUp,
      gradient: "from-blue-500/20 via-blue-500/10 to-transparent",
      iconColor: "text-blue-400",
      borderColor: "border-blue-500/30",
    },
    {
      level: 3,
      name: "Ambassador",
      referrals: "16-30",
      bonus: t('referral.ambassadorBonus'),
      icon: Award,
      gradient: "from-purple-500/20 via-purple-500/10 to-transparent",
      iconColor: "text-purple-400",
      borderColor: "border-purple-500/30",
    },
    {
      level: 4,
      name: "Elite Partner",
      referrals: "31+",
      bonus: t('referral.eliteBonus'),
      icon: Crown,
      gradient: "from-amber-500/20 via-orange-500/10 to-transparent",
      iconColor: "text-amber-400",
      borderColor: "border-amber-500/30",
    },
  ];

  const { data: referralStats, isLoading: statsLoading } = useQuery<ReferralStats>({
    queryKey: ["/api/referrals"],
    enabled: isAuthenticated,
  });

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

  return (
    <PageLayout>
      <div className="flex-1 flex flex-col min-h-screen max-w-full overflow-hidden">
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
                    <span className="bg-gradient-to-r from-white via-white to-purple-400/80 bg-clip-text text-transparent">{t('referral.title')}</span>
                  </h1>
                  <p className="text-muted-foreground mt-2 ml-14">{t('referral.inviteFriendsDesc')}</p>
                </div>
              </motion.div>
            </div>

            <div className="lg:hidden mb-4">
              <h1 className="text-xl font-display font-bold flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-400" />
                <span>{t('nav.referral')}</span>
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
                <h2 className="font-semibold text-lg">{t('referral.yourRefCode')}</h2>
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
                  {copiedCode ? t('referral.copied') : t('referral.copyBtn')}
                </Button>
              </div>

              <div className="mt-4 p-3 rounded-xl bg-black/30 border border-white/5">
                <p className="text-xs text-muted-foreground mb-2">{t('referral.referralLink')}:</p>
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
                  <span className="text-xs text-muted-foreground">{t('referral.totalReferrals')}</span>
                </div>
                <p className="text-3xl font-bold text-emerald-400 font-mono">
                  {statsLoading ? "—" : referralStats?.referralCount || 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{t('referral.referralsLabel')}</p>
              </motion.div>

              <motion.div
                className="p-4 lg:p-5 rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent backdrop-blur-xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.25 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="w-4 h-4 text-amber-400" />
                  <span className="text-xs text-muted-foreground">{t('referral.totalBonus')}</span>
                </div>
                <p className="text-3xl font-bold text-amber-400 font-mono">
                  +{statsLoading ? "—" : referralStats?.totalEarned || 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{t('referral.earnedRequests')}</p>
              </motion.div>

              <motion.div
                className="p-4 lg:p-5 rounded-xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-transparent backdrop-blur-xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs text-muted-foreground">{t('referral.pendingBonusLabel')}</span>
                </div>
                <p className="text-3xl font-bold text-cyan-400 font-mono">
                  +{statsLoading ? "—" : referralStats?.pendingBonus || 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{t('referral.bonus')}</p>
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
                <h2 className="font-semibold text-lg">{t('referral.rewardLevels')}</h2>
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
                            {t('referral.current')}
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
                        {tier.referrals} {t('referral.referralsLabel')}
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
                  <h2 className="font-semibold text-lg">{t('referral.invitedUsers')}</h2>
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
                            {t('referral.bonus')}
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                            {t('referral.waiting')}
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
                  <p className="text-muted-foreground mb-2">{t('referral.noReferrals')}</p>
                  <p className="text-xs text-muted-foreground/60 max-w-xs">
                    {t('referral.inviteFriendsHint')}
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
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Card className="border-white/10 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent backdrop-blur-xl">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/20">
                      <Handshake className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg" data-testid="text-reversh-title">{t('referral.reversh.title')}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1" data-testid="text-reversh-description">{t('referral.reversh.description')}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePartnerSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        placeholder={t('referral.reversh.name')}
                        value={partnerForm.name}
                        onChange={(e) => setPartnerForm(prev => ({ ...prev, name: e.target.value }))}
                        className="bg-black/30 border-white/10"
                        data-testid="input-partner-name"
                      />
                      <Input
                        placeholder={t('referral.reversh.phone')}
                        value={partnerForm.phone}
                        onChange={(e) => setPartnerForm(prev => ({ ...prev, phone: e.target.value }))}
                        className="bg-black/30 border-white/10"
                        data-testid="input-partner-phone"
                      />
                    </div>
                    <Input
                      type="email"
                      placeholder={t('referral.reversh.email')}
                      value={partnerForm.email}
                      onChange={(e) => setPartnerForm(prev => ({ ...prev, email: e.target.value }))}
                      className="bg-black/30 border-white/10"
                      data-testid="input-partner-email"
                    />
                    <Textarea
                      placeholder={t('referral.reversh.method')}
                      value={partnerForm.method}
                      onChange={(e) => setPartnerForm(prev => ({ ...prev, method: e.target.value }))}
                      className="bg-black/30 border-white/10 min-h-[80px]"
                      data-testid="input-partner-method"
                    />
                    <Input
                      placeholder={t('referral.reversh.volume')}
                      value={partnerForm.volume}
                      onChange={(e) => setPartnerForm(prev => ({ ...prev, volume: e.target.value }))}
                      className="bg-black/30 border-white/10"
                      data-testid="input-partner-volume"
                    />
                    <Button
                      type="submit"
                      disabled={partnershipMutation.isPending || !partnerForm.name || !partnerForm.phone || !partnerForm.email || !partnerForm.method || !partnerForm.volume}
                      className="w-full bg-gradient-to-r from-amber-600 to-orange-500 text-white border-0"
                      data-testid="button-partner-submit"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {partnershipMutation.isPending ? t('common.loading') : t('referral.reversh.submit')}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </main>

      </div>
    </PageLayout>
  );
}
