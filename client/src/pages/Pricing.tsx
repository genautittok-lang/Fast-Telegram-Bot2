import { useState, useEffect } from "react";
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
  Lock,
  Users,
  Clock,
  Loader2,
  ChevronRight,
  ArrowLeftIcon
} from "lucide-react";


const PRICES = {
  PRO: { monthly: 10, yearly: 100 },
  ENTERPRISE: { monthly: 35, yearly: 349 },
  GROUPS: { monthly: 55, yearly: 549 },
};

function PricingContent() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const [isYearly, setIsYearly] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState<"PRO" | "ENTERPRISE" | "GROUPS" | null>(null);
  const [cryptoPayLoading, setCryptoPayLoading] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [timeLeft, setTimeLeft] = useState(600);
  const [timerExpired, setTimerExpired] = useState(false);
  const [paymentStep, setPaymentStep] = useState<"method" | "details">("method");
  const [selectedMethod, setSelectedMethod] = useState<"crypto" | "monobank" | "stars" | null>(null);

  useEffect(() => {
    if (!showPaymentModal || paymentStep !== "details") {
      setTimeLeft(600);
      setTimerExpired(false);
      return;
    }
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setTimerExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [showPaymentModal, paymentStep]);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const validatePromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    setPromoError("");
    try {
      const response = await fetch("/api/promo/validate", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCode.trim(), tier: showPaymentModal }),
      });
      const data = await response.json();
      if (response.ok && data.valid) {
        setPromoDiscount(data.discount);
        setPromoApplied(true);
        toast({ title: t('pricing.promoApplied') || "Promo code applied!", description: `-${data.discount}%` });
      } else {
        setPromoError(data.error || t('pricing.promoInvalid') || "Invalid promo code");
        setPromoDiscount(0);
        setPromoApplied(false);
      }
    } catch {
      setPromoError(t('pricing.promoInvalid') || "Invalid promo code");
    } finally {
      setPromoLoading(false);
    }
  };

  const handlePayment = (tier: "PRO" | "ENTERPRISE" | "GROUPS") => {
    if (!user) {
      setLocation("/login");
      return;
    }
    setPaymentStep("method");
    setSelectedMethod(null);
    setPromoCode("");
    setPromoDiscount(0);
    setPromoApplied(false);
    setPromoError("");
    setShowPaymentModal(tier);
  };

  const closePaymentModal = () => {
    setShowPaymentModal(null);
    setPaymentStep("method");
    setSelectedMethod(null);
    setPromoCode("");
    setPromoDiscount(0);
    setPromoApplied(false);
    setPromoError("");
  };

  const getPrice = (tier: "PRO" | "ENTERPRISE" | "GROUPS") => {
    return isYearly ? PRICES[tier].yearly : PRICES[tier].monthly;
  };

  const getFinalAmount = (tier: "PRO" | "ENTERPRISE" | "GROUPS") => {
    let base = getPrice(tier);
    if (promoApplied && promoDiscount > 0) {
      base = +(base * (1 - promoDiscount / 100)).toFixed(2);
    }
    return base;
  };

  const handleCryptoPay = async (tier: "PRO" | "ENTERPRISE" | "GROUPS") => {
    setCryptoPayLoading(true);
    try {
      const response = await fetch("/api/payments/cryptopay/create", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier,
          period: isYearly ? "yearly" : "monthly",
          promoCode: promoApplied ? promoCode.trim() : undefined,
        }),
      });
      const data = await response.json();
      if (response.ok && data.payUrl && /^https?:\/\//i.test(data.payUrl)) {
        window.open(data.payUrl, "_blank");
        toast({
          title: t('pricing.cryptoPayOpened') || "Crypto Pay opened",
          description: t('pricing.cryptoPayDesc') || "Complete the payment in CryptoBot. Your plan will be activated automatically.",
        });
        closePaymentModal();
      } else {
        toast({
          title: t('common.error'),
          description: data.error || "Failed to create crypto payment",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: t('common.error'),
        description: "Failed to connect to payment service",
        variant: "destructive",
      });
    } finally {
      setCryptoPayLoading(false);
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
                <button
                  className="w-full btn-3d btn-3d-green text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-sm"
                  onClick={() => handlePayment("PRO")}
                  data-testid="button-pro-plan"
                >
                  <span className="btn-3d-icon"><Star className="h-4 w-4" /></span>
                  {t('pricing.subscribe') || "Subscribe"} — ${getPrice("PRO")} USD
                </button>
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
                    <span className="ml-2 text-xs text-muted-foreground line-through">$420</span>
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
                <button
                  className="w-full btn-3d btn-3d-amber text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-sm"
                  onClick={() => handlePayment("ENTERPRISE")}
                  data-testid="button-enterprise-plan"
                >
                  <span className="btn-3d-icon"><Crown className="h-4 w-4" /></span>
                  {t('pricing.subscribe') || "Subscribe"} — ${getPrice("ENTERPRISE")} USD
                </button>
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
                    <span className="ml-2 text-xs text-muted-foreground line-through">$660</span>
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
                <button
                  className="w-full btn-3d btn-3d-violet text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-sm"
                  onClick={() => handlePayment("GROUPS")}
                  data-testid="button-groups-plan"
                >
                  <span className="btn-3d-icon"><Users className="h-4 w-4" /></span>
                  {t('pricing.subscribe') || "Subscribe"} — ${getPrice("GROUPS")} USD
                </button>
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
            <span className="text-xs">TON / ERC-20 / BEP-20 / Solana / XRP</span>
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
              onClick={closePaymentModal}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 10 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="bg-gradient-to-b from-zinc-900 to-[#0d0d14] border border-white/[0.08] rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl shadow-black/50"
                onClick={(e) => e.stopPropagation()}
                data-testid="modal-payment"
              >
                <div className={`relative px-5 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-white/[0.06] ${
                  showPaymentModal === "PRO" 
                    ? "bg-gradient-to-br from-emerald-500/[0.08] to-transparent" 
                    : showPaymentModal === "ENTERPRISE"
                    ? "bg-gradient-to-br from-amber-500/[0.08] to-transparent"
                    : "bg-gradient-to-br from-violet-500/[0.08] to-transparent"
                }`}>
                  <button
                    onClick={closePaymentModal}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-muted-foreground hover:text-white transition-colors"
                    data-testid="button-close-modal"
                  >
                    ✕
                  </button>

                  <div className="flex items-center gap-3.5">
                    {paymentStep === "details" && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setPaymentStep("method")}
                        className="shrink-0 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10"
                        data-testid="button-payment-back"
                      >
                        <ArrowLeftIcon className="w-4 h-4" />
                      </Button>
                    )}
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
                      showPaymentModal === "PRO" 
                        ? "bg-gradient-to-br from-emerald-500/30 to-emerald-600/10 border border-emerald-500/30 shadow-emerald-500/20" 
                        : showPaymentModal === "ENTERPRISE"
                        ? "bg-gradient-to-br from-amber-500/30 to-amber-600/10 border border-amber-500/30 shadow-amber-500/20"
                        : "bg-gradient-to-br from-violet-500/30 to-violet-600/10 border border-violet-500/30 shadow-violet-500/20"
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
                      <h3 className="text-lg font-bold font-display" data-testid="text-plan-name">
                        {showPaymentModal} {t('pricing.planLabel')}
                      </h3>
                      <p className="text-muted-foreground text-xs">
                        {isYearly ? t('pricing.yearlySubscription') : t('pricing.monthlySubscription')} — {getFinalAmount(showPaymentModal) < getPrice(showPaymentModal) ? (
                          <>
                            <span className="line-through text-muted-foreground/50">${getPrice(showPaymentModal)}</span>{" "}
                            <span className={`font-semibold ${showPaymentModal === "PRO" ? "text-emerald-400" : showPaymentModal === "ENTERPRISE" ? "text-amber-400" : "text-violet-400"}`}>${getFinalAmount(showPaymentModal)} USD</span>
                          </>
                        ) : (
                          <span className="font-semibold text-white">${getPrice(showPaymentModal)} USD</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="px-5 sm:px-6 py-5 sm:py-6">

                {paymentStep === "method" && (
                  <div className="space-y-5" data-testid="payment-step-method">
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">{t('pricing.selectPaymentMethod')}</div>
                      <div className="space-y-2.5">
                        <button
                          type="button"
                          onClick={() => setSelectedMethod("stars")}
                          className={`w-full relative flex items-center gap-3.5 p-4 rounded-2xl border text-left transition-all duration-200 ${
                            selectedMethod === "stars"
                              ? "border-yellow-500/50 bg-gradient-to-r from-yellow-500/[0.12] to-amber-500/[0.06] shadow-lg shadow-yellow-500/15 ring-1 ring-yellow-500/30"
                              : "border-yellow-500/20 bg-gradient-to-r from-yellow-500/[0.04] to-transparent hover:from-yellow-500/[0.08] hover:border-yellow-500/30"
                          }`}
                          data-testid="button-method-stars"
                        >
                          <div className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 text-[9px] font-bold text-black uppercase tracking-wide shadow-lg shadow-yellow-500/30">
                            {t('pricing.recommended') || "Recommended"}
                          </div>
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                            selectedMethod === "stars"
                              ? "bg-gradient-to-br from-yellow-500/40 to-amber-500/25 shadow-lg shadow-yellow-500/25 border border-yellow-500/30"
                              : "bg-gradient-to-br from-yellow-500/15 to-amber-500/10 border border-yellow-500/10"
                          }`}>
                            <span className="text-2xl">⭐</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-white flex items-center gap-1.5">
                              Telegram Stars
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-yellow-400">
                                <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M12 2L15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" opacity="0.15"/>
                              </svg>
                            </div>
                            <div className="text-[11px] text-muted-foreground mt-0.5">{t('pricing.starsNote') || "Pay with Stars in Telegram"}</div>
                          </div>
                          <div className="flex flex-col items-end gap-0.5">
                            {(() => {
                              const starPrices: Record<string, Record<string, number>> = {
                                PRO: { monthly: 500, yearly: 5000 },
                                ENTERPRISE: { monthly: 1750, yearly: 17500 },
                                GROUPS: { monthly: 2750, yearly: 27500 },
                              };
                              const base = showPaymentModal ? starPrices[showPaymentModal]?.[isYearly ? "yearly" : "monthly"] || 0 : 0;
                              const finalStars = promoApplied && promoDiscount > 0 ? Math.max(1, Math.round(base * (1 - promoDiscount / 100))) : base;
                              return (
                                <>
                                  <span className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-yellow-500/20 to-amber-500/15 text-xs font-bold text-yellow-400 border border-yellow-500/25 shadow-sm">{finalStars} ⭐</span>
                                  <span className="text-[9px] text-muted-foreground/60">≈ ${(finalStars * 0.019).toFixed(2)}</span>
                                </>
                              );
                            })()}
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedMethod("crypto")}
                          className={`w-full flex items-center gap-3.5 p-4 rounded-2xl border text-left transition-all duration-200 ${
                            selectedMethod === "crypto"
                              ? "border-blue-500/40 bg-blue-500/[0.08] shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/20"
                              : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/15"
                          }`}
                          data-testid="button-method-crypto"
                        >
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                            selectedMethod === "crypto"
                              ? "bg-gradient-to-br from-blue-500/30 to-cyan-500/20 shadow-lg shadow-blue-500/20 border border-blue-500/30"
                              : "bg-blue-500/10 border border-blue-500/10"
                          }`}>
                            <svg width="24" height="24" viewBox="0 0 48 48" fill="none">
                              <circle cx="24" cy="24" r="18" stroke="#2AABEE" strokeWidth="2" fill="none" opacity="0.3"/>
                              <path d="M15.5 24.5L21 30L33 18" stroke="#2AABEE" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-white">Crypto Pay</div>
                            <div className="text-[11px] text-muted-foreground mt-0.5">@CryptoBot · Telegram</div>
                          </div>
                          <div className="flex flex-col items-end gap-0.5">
                            <span className="px-2.5 py-1 rounded-lg bg-blue-500/15 text-xs font-bold text-blue-400 border border-blue-500/25 shadow-sm">${showPaymentModal ? getFinalAmount(showPaymentModal) : 0}</span>
                            <div className="flex flex-wrap gap-1 justify-end">
                              {["BTC", "TON", "USDT"].map(c => (
                                <span key={c} className="px-1 py-0 rounded bg-blue-500/10 text-[8px] font-mono text-blue-400/70">{c}</span>
                              ))}
                            </div>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedMethod("monobank")}
                          className={`w-full flex items-center gap-3.5 p-4 rounded-2xl border text-left transition-all duration-200 ${
                            selectedMethod === "monobank"
                              ? "border-violet-500/40 bg-violet-500/[0.08] shadow-lg shadow-violet-500/10 ring-1 ring-violet-500/20"
                              : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/15"
                          }`}
                          data-testid="button-method-monobank"
                        >
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                            selectedMethod === "monobank"
                              ? "bg-gradient-to-br from-violet-500/30 to-purple-500/20 shadow-lg shadow-violet-500/20 border border-violet-500/30"
                              : "bg-violet-500/10 border border-violet-500/10"
                          }`}>
                            <div className="flex items-center gap-0.5">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11.96 11.96 0 0 0 1 12c0 1.94.46 3.77 1.18 5.07l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                              <svg width="12" height="14" viewBox="0 0 814 1000" fill="white"><path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57.2-155.5-127c-56.5-79.2-102.2-202.4-102.2-319.3 0-187.8 122.1-287.5 242.3-287.5 63.9 0 117.2 42 157.5 42 38.3 0 98.2-44.5 171.8-44.5 27.8 0 127.6 2.5 193.2 95.3zM554.1 159.4c31.1-36.9 53.1-88.1 53.1-139.4 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8.6 15.7 1.3 18.2 2.5.6 6.4 1.3 10.2 1.3 45.4 0 103-30.4 139.5-71.3z"/></svg>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-white flex items-center gap-1.5">
                              Google Pay / Apple Pay
                            </div>
                            <div className="text-[11px] text-muted-foreground mt-0.5">Visa, Mastercard</div>
                          </div>
                          <div className="flex flex-col items-end gap-0.5">
                            <span className="px-2.5 py-1 rounded-lg bg-violet-500/15 text-xs font-bold text-violet-400 border border-violet-500/25 shadow-sm">${showPaymentModal ? getFinalAmount(showPaymentModal) : 0}</span>
                            <span className="text-[9px] text-muted-foreground/60">USD</span>
                          </div>
                        </button>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-muted-foreground mb-1.5">{t('pricing.promoCode') || "Promo code"}</div>
                      <div className="flex gap-2">
                        <Input
                          value={promoCode}
                          onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoError(""); setPromoApplied(false); }}
                          placeholder="DARKSHARE-XXX"
                          className="bg-black/50 border-white/10 font-mono text-xs"
                          disabled={promoApplied}
                          data-testid="input-promo-code"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={validatePromo}
                          disabled={promoLoading || promoApplied || !promoCode.trim()}
                          data-testid="button-apply-promo"
                        >
                          {promoLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : promoApplied ? <Check className="w-3 h-3" /> : (t('pricing.apply') || "Apply")}
                        </Button>
                      </div>
                      {promoError && <p className="text-xs text-red-400 mt-1">{promoError}</p>}
                      {promoApplied && <p className="text-xs text-emerald-400 mt-1">-{promoDiscount}% {t('pricing.promoAppliedLabel') || "discount applied"}</p>}
                    </div>

                    {promoApplied && showPaymentModal && (
                      <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/30">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{t('pricing.totalAmount') || "Total"}</span>
                          <div className="flex items-center gap-2">
                            <span className="line-through text-muted-foreground text-xs">${getPrice(showPaymentModal)}</span>
                            <span className="text-emerald-400 font-bold text-lg">${getFinalAmount(showPaymentModal)}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <Button
                      className={`w-full py-5 font-semibold text-sm rounded-2xl transition-all duration-200 ${
                        showPaymentModal === "PRO" 
                          ? "bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-lg shadow-emerald-500/20" 
                          : showPaymentModal === "ENTERPRISE" 
                          ? "bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 shadow-lg shadow-amber-500/20" 
                          : "bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 shadow-lg shadow-violet-500/20"
                      }`}
                      onClick={() => setPaymentStep("details")}
                      disabled={!selectedMethod}
                      data-testid="button-continue-to-details"
                    >
                      {t('pricing.continue')}
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                )}

                {paymentStep === "details" && showPaymentModal && (
                  <div className="space-y-4" data-testid="payment-step-details">
                    <div className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl border ${
                      timerExpired 
                        ? "bg-red-500/[0.08] border-red-500/25" 
                        : timeLeft <= 60 
                        ? "bg-amber-500/[0.08] border-amber-500/25" 
                        : "bg-emerald-500/[0.08] border-emerald-500/25"
                    }`} data-testid="timer-display">
                      <Clock className={`w-4 h-4 ${timerExpired ? "text-red-400" : timeLeft <= 60 ? "text-amber-400" : "text-emerald-400"}`} />
                      <span className={`font-mono text-xl font-bold tracking-wider ${timerExpired ? "text-red-400" : timeLeft <= 60 ? "text-amber-400" : "text-emerald-400"}`}>
                        {timerExpired ? (t('pricing.expired')) : formatTimer(timeLeft)}
                      </span>
                    </div>

                    {selectedMethod === "crypto" && (
                      <div className="space-y-4">
                        <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-500/[0.08] to-cyan-500/[0.04] border border-blue-500/20 text-center">
                          <div className="flex items-center justify-center mb-3">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/25 to-cyan-500/15 flex items-center justify-center shadow-lg shadow-blue-500/15 border border-blue-500/20">
                              <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
                                <circle cx="24" cy="24" r="20" stroke="#2AABEE" strokeWidth="2" fill="none" opacity="0.3"/>
                                <path d="M15.5 24.5L21 30L33 18" stroke="#2AABEE" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                          </div>
                          <p className="text-sm font-bold text-white mb-0.5">Crypto Pay</p>
                          <p className="text-[11px] text-muted-foreground mb-3">@CryptoBot · Telegram</p>
                          <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                            ${getFinalAmount(showPaymentModal)} USD
                          </div>
                          <p className="text-xs text-muted-foreground/80 mb-3">
                            {t('pricing.cryptoPayNote')}
                          </p>
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            {["BTC", "TON", "USDT", "ETH", "LTC", "SOL"].map(c => (
                              <span key={c} className="px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/15 text-[10px] font-mono font-medium text-blue-300">{c}</span>
                            ))}
                          </div>
                        </div>

                        <Button
                          className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold py-5 rounded-2xl shadow-lg shadow-blue-500/20 transition-all duration-200"
                          onClick={() => handleCryptoPay(showPaymentModal)}
                          disabled={timerExpired || cryptoPayLoading}
                          data-testid="button-cryptopay-checkout"
                        >
                          {cryptoPayLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                          ) : (
                            <svg width="20" height="20" viewBox="0 0 48 48" fill="none" className="mr-2">
                              <circle cx="24" cy="24" r="16" stroke="white" strokeWidth="2" fill="none" opacity="0.4"/>
                              <path d="M15.5 24.5L21 30L33 18" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                          {cryptoPayLoading 
                            ? (t('pricing.creating') || "Creating invoice...")
                            : t('pricing.payWithCryptoPay')
                          }
                        </Button>

                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground/60 justify-center">
                          <Lock className="w-3 h-3" />
                          <span>{t('pricing.cryptoPaySecure')}</span>
                        </div>
                      </div>
                    )}

                    {selectedMethod === "monobank" && (
                      <div className="space-y-4">
                        <div className="p-5 rounded-2xl bg-gradient-to-br from-violet-500/[0.08] to-purple-500/[0.04] border border-violet-500/20 text-center">
                          <div className="flex items-center justify-center gap-3 mb-3">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center shadow-lg">
                              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11.96 11.96 0 0 0 1 12c0 1.94.46 3.77 1.18 5.07l3.66-2.84z" fill="#FBBC05"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                              </svg>
                            </div>
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center shadow-lg">
                              <svg width="20" height="24" viewBox="0 0 170 200" fill="white">
                                <path d="M150.4 172.3c-7.8 18.2-16.3 27-30.5 27-8.1 0-13.6-4.7-22.4-4.7-9.1 0-15.2 4.8-22.8 4.8-14.4 0-28.1-18.1-38.7-42.7C26.1 132.4 20 109.3 20 87.3c0-35.2 23-53.8 45.5-53.8 9.8 0 17.9 5.4 24 5.4 5.8 0 14.8-5.7 25.9-5.7 7.3 0 23.6 2.8 33.2 17.7-1.2.8-23.6 14.3-23.6 38.7 0 28.2 24.6 38.1 25.4 38.4zM114.5 0c-17.1 1.3-33.3 18.9-31.5 36.8 15.6 0 33.2-17.2 31.5-36.8z"/>
                              </svg>
                            </div>
                          </div>
                          <p className="text-sm font-bold text-white mb-0.5 flex items-center justify-center gap-1.5">
                            Google Pay · Apple Pay
                          </p>
                          <div className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent my-2">
                            {(() => {
                              const uahPrices: Record<string, Record<string, number>> = {
                                PRO: { monthly: 410, yearly: 4100 },
                                ENTERPRISE: { monthly: 1435, yearly: 14309 },
                                GROUPS: { monthly: 2255, yearly: 22509 },
                              };
                              const base = uahPrices[showPaymentModal]?.[isYearly ? "yearly" : "monthly"] || 0;
                              const final = promoApplied && promoDiscount > 0
                                ? Math.round(base * (1 - promoDiscount / 100))
                                : base;
                              return `${final} UAH`;
                            })()}
                          </div>
                          <p className="text-xs text-muted-foreground/70 mb-3">
                            ~${getFinalAmount(showPaymentModal)} USD
                          </p>
                          <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
                            {t('pricing.bankConversionNote')}
                          </p>
                        </div>

                        <Button
                          className="w-full bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-500 hover:to-purple-400 text-white font-semibold py-5 rounded-2xl shadow-lg shadow-violet-500/20 transition-all duration-200"
                          onClick={async () => {
                              try {
                                const response = await fetch("/api/payments/monopay/create", {
                                  method: "POST",
                                  credentials: "include",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({
                                    tier: showPaymentModal,
                                    period: isYearly ? "yearly" : "monthly",
                                    promoCode: promoApplied ? promoCode.trim() : undefined,
                                    paymentMethod: "monobank",
                                  }),
                                });
                                const data = await response.json();
                                if (response.ok && data.pageUrl && /^https?:\/\//i.test(data.pageUrl)) {
                                  window.location.href = data.pageUrl;
                                } else if (response.status === 503) {
                                  toast({
                                    title: "Google Pay / Apple Pay",
                                    description: data.error || "Payment service is being set up. Please try another payment method.",
                                    variant: "destructive",
                                  });
                                } else {
                                  toast({
                                    title: t('common.error'),
                                    description: data.error || "Failed to create payment invoice",
                                    variant: "destructive",
                                  });
                                }
                              } catch {
                                toast({
                                  title: t('common.error'),
                                  description: "Failed to connect to payment service",
                                  variant: "destructive",
                                });
                              }
                            }}
                            disabled={timerExpired}
                            data-testid="button-monobank-checkout"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="mr-1.5">
                              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11.96 11.96 0 0 0 1 12c0 1.94.46 3.77 1.18 5.07l3.66-2.84z" fill="#FBBC05"/>
                              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                            </svg>
                            <svg width="12" height="14" viewBox="0 0 170 200" fill="white" className="mr-2">
                              <path d="M150.4 172.3c-7.8 18.2-16.3 27-30.5 27-8.1 0-13.6-4.7-22.4-4.7-9.1 0-15.2 4.8-22.8 4.8-14.4 0-28.1-18.1-38.7-42.7C26.1 132.4 20 109.3 20 87.3c0-35.2 23-53.8 45.5-53.8 9.8 0 17.9 5.4 24 5.4 5.8 0 14.8-5.7 25.9-5.7 7.3 0 23.6 2.8 33.2 17.7-1.2.8-23.6 14.3-23.6 38.7 0 28.2 24.6 38.1 25.4 38.4zM114.5 0c-17.1 1.3-33.3 18.9-31.5 36.8 15.6 0 33.2-17.2 31.5-36.8z"/>
                            </svg>
                            {t('pricing.payWithCard')}
                          </Button>

                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground/60 justify-center mt-3">
                            <Lock className="w-3 h-3" />
                            <span>{t('pricing.bankConversionNote')}</span>
                          </div>
                      </div>
                    )}

                    {selectedMethod === "stars" && (
                      <div className="space-y-4">
                        <div className="p-5 rounded-2xl bg-gradient-to-br from-yellow-500/[0.08] to-amber-500/[0.04] border border-yellow-500/20 text-center">
                          <div className="flex items-center justify-center mb-3">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-500/25 to-amber-500/15 flex items-center justify-center shadow-lg shadow-yellow-500/15 border border-yellow-500/20">
                              <span className="text-4xl">⭐</span>
                            </div>
                          </div>
                          <p className="text-sm font-bold text-white mb-0.5">Telegram Stars</p>
                          <p className="text-[11px] text-muted-foreground mb-3">{t('pricing.starsOfficialPayment') || "Official Telegram payment"}</p>
                          <div className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-amber-400 bg-clip-text text-transparent mb-2">
                            {(() => {
                              const starPrices: Record<string, Record<string, number>> = {
                                PRO: { monthly: 500, yearly: 5000 },
                                ENTERPRISE: { monthly: 1750, yearly: 17500 },
                                GROUPS: { monthly: 2750, yearly: 27500 },
                              };
                              const base = showPaymentModal ? starPrices[showPaymentModal]?.[isYearly ? "yearly" : "monthly"] || 0 : 0;
                              const final = promoApplied && promoDiscount > 0 ? Math.max(1, Math.round(base * (1 - promoDiscount / 100))) : base;
                              return `${final} Stars`;
                            })()}
                          </div>
                          <p className="text-xs text-muted-foreground/80 mb-3">
                            ~${getFinalAmount(showPaymentModal)} USD
                          </p>
                          <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
                            {t('pricing.starsRedirectNote') || "You will be redirected to our Telegram bot to complete the payment with Stars"}
                          </p>
                        </div>

                        <Button
                          className="w-full bg-gradient-to-r from-yellow-600 to-amber-500 hover:from-yellow-500 hover:to-amber-400 text-white font-semibold py-5 rounded-2xl shadow-lg shadow-yellow-500/20 transition-all duration-200"
                          onClick={() => {
                            const botUsername = "DarkShare1Bot";
                            const starPrices: Record<string, Record<string, number>> = {
                              PRO: { monthly: 500, yearly: 5000 },
                              ENTERPRISE: { monthly: 1750, yearly: 17500 },
                              GROUPS: { monthly: 2750, yearly: 27500 },
                            };
                            const tier = showPaymentModal || "PRO";
                            const base = starPrices[tier]?.[isYearly ? "yearly" : "monthly"] || 500;
                            const starsAmount = promoApplied && promoDiscount > 0 ? Math.max(1, Math.round(base * (1 - promoDiscount / 100))) : base;
                            const deepLink = `https://t.me/${botUsername}?start=stars_${tier}_${starsAmount}`;
                            window.open(deepLink, "_blank");
                          }}
                          disabled={timerExpired}
                          data-testid="button-stars-checkout"
                        >
                          <span className="mr-2 text-lg">⭐</span>
                          {t('pricing.payWithStars') || "Pay with Telegram Stars"}
                        </Button>

                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground/60 justify-center mt-3">
                          <Lock className="w-3 h-3" />
                          <span>{t('pricing.starsSecure') || "Secure payment via Telegram"}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

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
      <PageLayout title="Pricing">
        <PricingContent />
      </PageLayout>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-background/95 overflow-x-hidden max-w-[100vw]">
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
