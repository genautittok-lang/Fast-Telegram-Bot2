import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "@/lib/i18n";
import { PageLayout } from "@/components/PageLayout";
import { MobileMenu } from "@/components/MobileMenu";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Footer } from "@/components/Footer";
import { 
  Check, 
  Crown, 
  Shield, 
  Star,
  ArrowLeft,
  Copy,
  Lock,
  Users
} from "lucide-react";

const TRC20_ADDRESS = "TRYbty4Ew9knf61brdrixeY5M34mQTt3zY";

const PRICES = {
  PRO: { monthly: 10, yearly: 100 },
  ENTERPRISE: { monthly: 50, yearly: 498 },
  GROUPS: { monthly: 65, yearly: 647 },
};

function PricingContent() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const [isYearly, setIsYearly] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState<"PRO" | "ENTERPRISE" | "GROUPS" | null>(null);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [txHash, setTxHash] = useState("");

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(TRC20_ADDRESS);
      setCopiedAddress(true);
      toast({
        title: t('pricing.addressCopied'),
        description: t('pricing.addressCopiedDesc'),
      });
      setTimeout(() => setCopiedAddress(false), 3000);
    } catch {
      toast({
        title: t('pricing.copyError'),
        description: t('pricing.copyErrorDesc'),
        variant: "destructive",
      });
    }
  };

  const handlePayment = (tier: "PRO" | "ENTERPRISE" | "GROUPS") => {
    if (!user) {
      setLocation("/login");
      return;
    }
    setShowPaymentModal(tier);
  };

  const getPrice = (tier: "PRO" | "ENTERPRISE" | "GROUPS") => {
    return isYearly ? PRICES[tier].yearly : PRICES[tier].monthly;
  };

  const submitPayment = async (tier: "PRO" | "ENTERPRISE" | "GROUPS") => {
    if (!txHash.trim()) {
      toast({
        title: t('common.error'),
        description: t('pricing.enterTxHash'),
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/payment-request", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier,
          txHash: txHash.trim(),
          amount: getPrice(tier),
          period: isYearly ? "yearly" : "monthly",
        }),
      });

      if (response.ok) {
        toast({
          title: t('pricing.applicationSent'),
          description: t('pricing.applicationSentDesc'),
        });
        setShowPaymentModal(null);
        setTxHash("");
      } else {
        throw new Error("Failed to submit");
      }
    } catch {
      toast({
        title: t('pricing.applicationSent'),
        description: t('pricing.applicationSentDesc'),
      });
      setShowPaymentModal(null);
      setTxHash("");
    }
  };

  const features = {
    free: [
      t('pricing.checksPerDay15'),
      t('pricing.basicAnalysis'),
      t('pricing.telegramBotAccess'),
      t('pricing.checkHistory'),
    ],
    pro: [
      t('pricing.checksPerDay100'),
      t('pricing.aiAnalysis'),
      t('pricing.pdfReports'),
      t('pricing.prioritySupport'),
      t('pricing.realTimeMonitoring'),
      t('pricing.apiBeta'),
    ],
    enterprise: [
      t('pricing.unlimitedChecks'),
      t('pricing.fullApiAccess'),
      t('pricing.support247'),
      t('pricing.customReports'),
      t('pricing.whiteLabelIntegration'),
      t('pricing.slaGuarantees'),
      t('pricing.teamAccess'),
    ],
    groups: [
      t('pricing.groupsAllEnterprise'),
      t('pricing.groupsTeamMembers'),
      t('pricing.groupsSharedReports'),
      t('pricing.groupsTeamDashboard'),
      t('pricing.groupsRoleManagement'),
      t('pricing.groupsCentralBilling'),
      t('pricing.groupsActivityLog'),
    ],
  };

  return (
    <div className="min-h-full">
      <div className="relative container mx-auto px-4 py-6 sm:py-8 max-w-6xl">
        {!isAuthenticated && (
          <Button
            variant="ghost"
            className="mb-6"
            onClick={() => setLocation("/")}
            data-testid="button-back"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('common.back')}
          </Button>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6 sm:mb-8"
        >
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent" data-testid="text-pricing-title">
            {t('pricing.title')}
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto">
            {t('pricing.subtitle')}
          </p>
          
          <div className="flex items-center justify-center gap-2 mt-4">
            <Badge variant="outline" className="bg-amber-500/10 border-amber-500/30 text-amber-400 px-3 py-1.5">
              {t('pricing.paymentUSDT')}
            </Badge>
          </div>
        </motion.div>

        <div className="flex items-center justify-center gap-4 mb-6 sm:mb-8">
          <span className={`text-sm ${!isYearly ? "text-foreground font-medium" : "text-muted-foreground"}`}>
            {t('pricing.monthly')}
          </span>
          <Switch
            checked={isYearly}
            onCheckedChange={setIsYearly}
            data-testid="switch-billing-period"
          />
          <span className={`text-sm flex items-center gap-2 ${isYearly ? "text-foreground font-medium" : "text-muted-foreground"}`}>
            {t('pricing.yearly')}
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
              -17%
            </Badge>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="h-full border-border/50 bg-card/50 backdrop-blur" data-testid="card-free-plan">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-lg">FREE</CardTitle>
                </div>
                <CardDescription className="text-xs">{t('pricing.forBeginners')}</CardDescription>
                <div className="mt-3">
                  <span className="text-3xl font-bold">$0</span>
                  <span className="text-muted-foreground text-sm">{t('pricing.perMonth')}</span>
                </div>
              </CardHeader>
              <CardContent className="pb-3">
                <ul className="space-y-2">
                  {features.free.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setLocation(isAuthenticated ? "/dashboard" : "/login")}
                  data-testid="button-free-plan"
                >
                  {isAuthenticated ? t('nav.dashboard') : t('pricing.startFree')}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="h-full border-emerald-500/50 bg-gradient-to-b from-emerald-500/10 to-transparent relative" data-testid="card-pro-plan">
              <div className="absolute top-0 right-0 px-2.5 py-0.5 bg-emerald-500 text-white text-xs font-medium rounded-bl-lg">
                {t('pricing.popular')}
              </div>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Star className="h-5 w-5 text-emerald-500" />
                  <CardTitle className="text-lg text-emerald-400">PRO</CardTitle>
                </div>
                <CardDescription className="text-xs">{t('pricing.forProfessionals')}</CardDescription>
                <div className="mt-3">
                  <span className="text-3xl font-bold text-emerald-400">${getPrice("PRO")}</span>
                  <span className="text-muted-foreground text-sm">{isYearly ? t('pricing.perYear') : t('pricing.perMonth')}</span>
                  {isYearly && (
                    <span className="ml-2 text-xs text-muted-foreground line-through">$120</span>
                  )}
                  {isYearly && (
                    <Badge className="ml-1 bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">-17%</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pb-3">
                <ul className="space-y-2">
                  {features.pro.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full bg-emerald-600"
                  onClick={() => handlePayment("PRO")}
                  data-testid="button-pro-plan"
                >
                  <Star className="mr-2 h-4 w-4" />
                  {t('pricing.payAmount')} ${getPrice("PRO")} USDT
                </Button>
              </CardFooter>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="h-full border-amber-500/50 bg-gradient-to-b from-amber-500/10 to-transparent" data-testid="card-enterprise-plan">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Crown className="h-5 w-5 text-amber-500" />
                  <CardTitle className="text-lg text-amber-400">ENTERPRISE</CardTitle>
                </div>
                <CardDescription className="text-xs">{t('pricing.forTeams')}</CardDescription>
                <div className="mt-3">
                  <span className="text-3xl font-bold text-amber-400">${getPrice("ENTERPRISE")}</span>
                  <span className="text-muted-foreground text-sm">{isYearly ? t('pricing.perYear') : t('pricing.perMonth')}</span>
                  {isYearly && (
                    <span className="ml-2 text-xs text-muted-foreground line-through">$600</span>
                  )}
                  {isYearly && (
                    <Badge className="ml-1 bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">-17%</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pb-3">
                <ul className="space-y-2">
                  {features.enterprise.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full bg-amber-600"
                  onClick={() => handlePayment("ENTERPRISE")}
                  data-testid="button-enterprise-plan"
                >
                  <Crown className="mr-2 h-4 w-4" />
                  {t('pricing.payAmount')} ${getPrice("ENTERPRISE")} USDT
                </Button>
              </CardFooter>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="sm:col-span-2 lg:col-span-1"
          >
            <Card className="h-full border-violet-500/50 bg-gradient-to-b from-violet-500/10 to-transparent" data-testid="card-groups-plan">
              <div className="absolute top-0 right-0 px-2.5 py-0.5 bg-violet-500 text-white text-xs font-medium rounded-bl-lg">
                {t('pricing.newLabel')}
              </div>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Users className="h-5 w-5 text-violet-500" />
                  <CardTitle className="text-lg text-violet-400">GROUPS</CardTitle>
                </div>
                <CardDescription className="text-xs">{t('pricing.forGroups')}</CardDescription>
                <div className="mt-3">
                  <span className="text-3xl font-bold text-violet-400">${getPrice("GROUPS")}</span>
                  <span className="text-muted-foreground text-sm">{isYearly ? t('pricing.perYear') : t('pricing.perMonth')}</span>
                  {isYearly && (
                    <span className="ml-2 text-xs text-muted-foreground line-through">$780</span>
                  )}
                  {isYearly && (
                    <Badge className="ml-1 bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">-17%</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pb-3">
                <ul className="space-y-2">
                  {features.groups.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-violet-500 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full bg-violet-600"
                  onClick={() => handlePayment("GROUPS")}
                  data-testid="button-groups-plan"
                >
                  <Users className="mr-2 h-4 w-4" />
                  {t('pricing.payAmount')} ${getPrice("GROUPS")} USDT
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 sm:mt-8 text-center"
        >
          <p className="text-muted-foreground text-sm">
            {t('pricing.paymentNote')}
          </p>
          <div className="flex items-center justify-center gap-4 sm:gap-6 mt-3 opacity-50 flex-wrap">
            <span className="text-xs">{t('pricing.tronNetwork')}</span>
            <span className="text-xs">TRC-20 USDT</span>
            <span className="text-xs">{t('pricing.instantProcessing')}</span>
          </div>
        </motion.div>

        <AnimatePresence>
          {showPaymentModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
              onClick={() => setShowPaymentModal(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-zinc-900 border border-white/10 rounded-2xl max-w-md w-full p-5 sm:p-6"
                onClick={(e) => e.stopPropagation()}
                data-testid="modal-payment"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                    showPaymentModal === "PRO" 
                      ? "bg-emerald-500/20" 
                      : showPaymentModal === "ENTERPRISE"
                      ? "bg-amber-500/20"
                      : "bg-violet-500/20"
                  }`}>
                    {showPaymentModal === "PRO" ? (
                      <Star className="w-5 h-5 text-emerald-400" />
                    ) : showPaymentModal === "ENTERPRISE" ? (
                      <Crown className="w-5 h-5 text-amber-400" />
                    ) : (
                      <Users className="w-5 h-5 text-violet-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold" data-testid="text-plan-name">
                      {showPaymentModal} {t('pricing.planLabel')}
                    </h3>
                    <p className="text-muted-foreground text-xs">
                      {isYearly ? t('pricing.yearlySubscription') : t('pricing.monthlySubscription')} - ${getPrice(showPaymentModal)} USDT
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/30">
                    <div className="text-xs text-muted-foreground mb-1.5">{t('dashboard.paymentAddress')}</div>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs font-mono text-primary bg-black/50 p-2 rounded-lg break-all select-all">
                        {TRC20_ADDRESS}
                      </code>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={copyAddress}
                        className="shrink-0"
                        data-testid="button-copy-address"
                      >
                        {copiedAddress ? (
                          <Check className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-muted-foreground mb-1.5">{t('pricing.txHashOptional')}</div>
                    <Input
                      value={txHash}
                      onChange={(e) => setTxHash(e.target.value)}
                      placeholder={t('pricing.txHashPlaceholder')}
                      className="bg-black/50 border-white/10"
                      data-testid="input-tx-hash"
                    />
                  </div>

                  <Button
                    className={`w-full ${showPaymentModal === "PRO" ? "bg-emerald-600" : showPaymentModal === "ENTERPRISE" ? "bg-amber-600" : "bg-violet-600"}`}
                    onClick={() => submitPayment(showPaymentModal)}
                    data-testid="button-submit-payment"
                  >
                    {showPaymentModal === "PRO" ? (
                      <Star className="w-4 h-4 mr-2" />
                    ) : showPaymentModal === "ENTERPRISE" ? (
                      <Crown className="w-4 h-4 mr-2" />
                    ) : (
                      <Users className="w-4 h-4 mr-2" />
                    )}
                    {t('pricing.submitApplication')} {showPaymentModal} - ${getPrice(showPaymentModal)}
                  </Button>
                  
                  <p className="text-xs text-center text-muted-foreground">
                    {t('dashboard.requestWillBeSent')}
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function Pricing() {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const { t } = useTranslation();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <Shield className="w-6 h-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <PageLayout>
        <PricingContent />
      </PageLayout>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-background/95">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.1),transparent_50%)]" />
      <nav className="relative z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 cursor-pointer" onClick={() => setLocation("/")}>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30 flex-shrink-0">
              <Lock className="w-5 h-5 text-primary" />
            </div>
            <span className="font-bold text-base sm:text-lg">DARKSHARE</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher variant="minimal" />
            <MobileMenu isAuthenticated={false} />
          </div>
        </div>
      </nav>
      <PricingContent />
      <Footer />
    </div>
  );
}
