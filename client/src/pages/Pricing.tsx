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
  Copy,
  Lock,
  Users,
  Clock,
  Upload,
  Loader2,
  Wallet,
  ChevronRight,
  ArrowLeftIcon
} from "lucide-react";

const CRYPTO_NETWORKS = [
  { id: "ton", name: "USDT TON", address: "UQDaWlIDU3JeokvuMrJdLO0jQ7ugVF2ipGnirh91MF8J_1eL", discount: 5 },
  { id: "erc20", name: "ERC-20 (USDT)", address: "0x7532b40d06a9ead486b467a12735c68573f83d16" },
  { id: "bep20", name: "BEP-20 (USDT)", address: "0x7532b40d06a9ead486b467a12735c68573f83d16" },
  { id: "sol", name: "Solana (USDT)", address: "C9CqBPdfyfhkeUN3uLgsvagJiHyLf4ja4RdFTNQXKrbD" },
  { id: "eth", name: "ETH ERC-20", address: "0x7532b40d06a9ead486b467a12735c68573f83d16" },
  { id: "xrp", name: "XRP", address: "rJn2zAPdFA193sixJwuFixRkYDUtx3apQh", memo: "500755807" },
] as const;

type CryptoNetwork = typeof CRYPTO_NETWORKS[number];

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
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedMemo, setCopiedMemo] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState<CryptoNetwork>(CRYPTO_NETWORKS[0]);
  const [promoCode, setPromoCode] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [timeLeft, setTimeLeft] = useState(600);
  const [timerExpired, setTimerExpired] = useState(false);
  const [paymentStep, setPaymentStep] = useState<"method" | "details">("method");
  const [selectedMethod, setSelectedMethod] = useState<"crypto" | "monobank" | null>(null);

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

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(selectedNetwork.address);
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

  const copyMemo = async () => {
    if (!("memo" in selectedNetwork)) return;
    try {
      await navigator.clipboard.writeText(selectedNetwork.memo);
      setCopiedMemo(true);
      toast({
        title: t('pricing.addressCopied'),
        description: "Memo copied",
      });
      setTimeout(() => setCopiedMemo(false), 3000);
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
    setTxHash("");
    setScreenshotFile(null);
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
    if ("discount" in selectedNetwork && selectedNetwork.discount) {
      base = +(base * (1 - selectedNetwork.discount / 100)).toFixed(2);
    }
    if (promoApplied && promoDiscount > 0) {
      base = +(base * (1 - promoDiscount / 100)).toFixed(2);
    }
    return base;
  };

  const submitPayment = async (tier: "PRO" | "ENTERPRISE" | "GROUPS") => {
    if (timerExpired) {
      toast({
        title: t('pricing.timerExpired') || "Session expired",
        description: t('pricing.timerExpiredDesc') || "Please reopen the payment window",
        variant: "destructive",
      });
      return;
    }

    if (!txHash.trim() && !screenshotFile) {
      toast({
        title: t('common.error'),
        description: t('pricing.enterTxOrScreenshot') || "Enter TX Hash or upload a screenshot",
        variant: "destructive",
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append("tier", tier);
      formData.append("amount", getFinalAmount(tier).toString());
      formData.append("period", isYearly ? "yearly" : "monthly");
      formData.append("network", selectedNetwork.name);
      if (txHash.trim()) formData.append("txHash", txHash.trim());
      if (promoCode.trim() && promoApplied) formData.append("promoCode", promoCode.trim());
      if (screenshotFile) formData.append("screenshot", screenshotFile);

      const response = await fetch("/api/payment-request", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (response.ok) {
        toast({
          title: t('pricing.applicationSent'),
          description: t('pricing.applicationSentDesc'),
        });
        closePaymentModal();
      } else {
        throw new Error("Failed to submit");
      }
    } catch {
      toast({
        title: t('pricing.applicationSent'),
        description: t('pricing.applicationSentDesc'),
      });
      closePaymentModal();
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
                  {t('pricing.subscribe') || "Subscribe"} — ${getPrice("PRO")} USDT
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
                  {t('pricing.subscribe') || "Subscribe"} — ${getPrice("ENTERPRISE")} USDT
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
                  {t('pricing.subscribe') || "Subscribe"} — ${getPrice("GROUPS")} USDT
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
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-zinc-900 border border-white/10 rounded-2xl max-w-md w-full p-5 sm:p-6 max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
                data-testid="modal-payment"
              >
                <div className="flex items-center gap-3 mb-5">
                  {paymentStep === "details" && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setPaymentStep("method")}
                      className="shrink-0"
                      data-testid="button-payment-back"
                    >
                      <ArrowLeftIcon className="w-4 h-4" />
                    </Button>
                  )}
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
                      {isYearly ? t('pricing.yearlySubscription') : t('pricing.monthlySubscription')} — {getFinalAmount(showPaymentModal) < getPrice(showPaymentModal) ? (
                        <>
                          <span className="line-through">${getPrice(showPaymentModal)}</span>{" "}
                          <span className="text-emerald-400 font-medium">${getFinalAmount(showPaymentModal)} USDT</span>
                        </>
                      ) : (
                        <>${getPrice(showPaymentModal)} USDT</>
                      )}
                    </p>
                  </div>
                </div>

                {paymentStep === "method" && (
                  <div className="space-y-4" data-testid="payment-step-method">
                    <div>
                      <div className="text-xs text-muted-foreground mb-2">{t('pricing.selectPaymentMethod') || "Select payment method"}</div>
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => setSelectedMethod("crypto")}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors hover-elevate ${
                            selectedMethod === "crypto"
                              ? "border-primary bg-primary/10"
                              : "border-white/10 bg-black/30"
                          }`}
                          data-testid="button-method-crypto"
                        >
                          <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                            <Wallet className="w-5 h-5 text-amber-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium">Crypto (USDT)</div>
                            <div className="text-xs text-muted-foreground">TON, ERC-20, BEP-20, Solana, XRP</div>
                          </div>
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] shrink-0">
                            TON -5%
                          </Badge>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedMethod("monobank")}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors hover-elevate ${
                            selectedMethod === "monobank"
                              ? "border-primary bg-primary/10"
                              : "border-white/10 bg-black/30"
                          }`}
                          data-testid="button-method-monobank"
                        >
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500/20 to-zinc-800/50 flex items-center justify-center gap-1 shrink-0">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11.96 11.96 0 0 0 1 12c0 1.94.46 3.77 1.18 5.07l3.66-2.84z" fill="#FBBC05"/>
                              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                            </svg>
                            <svg width="12" height="14" viewBox="0 0 170 200" fill="white">
                              <path d="M150.4 172.3c-7.8 18.2-16.3 27-30.5 27-8.1 0-13.6-4.7-22.4-4.7-9.1 0-15.2 4.8-22.8 4.8-14.4 0-28.1-18.1-38.7-42.7C26.1 132.4 20 109.3 20 87.3c0-35.2 23-53.8 45.5-53.8 9.8 0 17.9 5.4 24 5.4 5.8 0 14.8-5.7 25.9-5.7 7.3 0 23.6 2.8 33.2 17.7-1.2.8-23.6 14.3-23.6 38.7 0 28.2 24.6 38.1 25.4 38.4zM114.5 0c-17.1 1.3-33.3 18.9-31.5 36.8 15.6 0 33.2-17.2 31.5-36.8z"/>
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium">Monobank</div>
                            <div className="text-xs text-muted-foreground">{t('pricing.cardPaymentDesc') || "Pay with any Visa/Mastercard. Amount in UAH, your bank converts automatically."}</div>
                          </div>
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] shrink-0">
                            UAH
                          </Badge>
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

                    {(promoApplied || (selectedMethod === "crypto" && "discount" in selectedNetwork && selectedNetwork.discount)) && showPaymentModal && (
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
                      className={`w-full ${showPaymentModal === "PRO" ? "bg-emerald-600" : showPaymentModal === "ENTERPRISE" ? "bg-amber-600" : "bg-violet-600"}`}
                      onClick={() => setPaymentStep("details")}
                      disabled={!selectedMethod}
                      data-testid="button-continue-to-details"
                    >
                      {t('pricing.continue') || "Continue"}
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                )}

                {paymentStep === "details" && showPaymentModal && (
                  <div className="space-y-4" data-testid="payment-step-details">
                    <div className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border ${
                      timerExpired 
                        ? "bg-red-500/10 border-red-500/30" 
                        : timeLeft <= 60 
                        ? "bg-amber-500/10 border-amber-500/30" 
                        : "bg-emerald-500/10 border-emerald-500/30"
                    }`} data-testid="timer-display">
                      <Clock className={`w-4 h-4 ${timerExpired ? "text-red-400" : timeLeft <= 60 ? "text-amber-400" : "text-emerald-400"}`} />
                      <span className={`font-mono text-lg font-bold ${timerExpired ? "text-red-400" : timeLeft <= 60 ? "text-amber-400" : "text-emerald-400"}`}>
                        {timerExpired ? (t('pricing.expired') || "Expired") : formatTimer(timeLeft)}
                      </span>
                    </div>

                    {selectedMethod === "crypto" && (
                      <>
                        <div>
                          <div className="text-xs text-muted-foreground mb-2">{t('pricing.selectNetwork')}</div>
                          <div className="grid grid-cols-3 gap-1.5">
                            {CRYPTO_NETWORKS.map((net) => (
                              <button
                                key={net.id}
                                type="button"
                                onClick={() => setSelectedNetwork(net)}
                                className={`relative text-left px-2.5 py-2 rounded-lg border text-xs font-medium transition-colors hover-elevate ${
                                  selectedNetwork.id === net.id
                                    ? "border-primary bg-primary/10 text-foreground"
                                    : "border-white/10 bg-black/30 text-muted-foreground"
                                }`}
                                data-testid={`button-network-${net.id}`}
                              >
                                <span>{net.name}</span>
                                {"discount" in net && net.discount && (
                                  <Badge className="absolute -top-1.5 -right-1.5 bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[9px] px-1 py-0">
                                    -{net.discount}%
                                  </Badge>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/30">
                          <div className="text-xs text-muted-foreground mb-1.5">{t('dashboard.paymentAddress')} ({selectedNetwork.name})</div>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 text-xs font-mono text-primary bg-black/50 p-2 rounded-lg break-all select-all">
                              {selectedNetwork.address}
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

                        {"memo" in selectedNetwork && selectedNetwork.memo && (
                          <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30">
                            <div className="text-xs text-muted-foreground mb-1.5">Memo / Tag</div>
                            <div className="flex items-center gap-2">
                              <code className="flex-1 text-xs font-mono text-amber-400 bg-black/50 p-2 rounded-lg break-all select-all">
                                {selectedNetwork.memo}
                              </code>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={copyMemo}
                                className="shrink-0"
                                data-testid="button-copy-memo"
                              >
                                {copiedMemo ? (
                                  <Check className="h-4 w-4 text-emerald-400" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        )}

                        {"discount" in selectedNetwork && selectedNetwork.discount && (
                          <div className="flex items-center justify-between text-xs px-1">
                            <span className="text-muted-foreground">{t('pricing.tonDiscount')} (-{selectedNetwork.discount}%)</span>
                            <span className="text-emerald-400 font-medium">
                              <span className="line-through text-muted-foreground mr-2">${getPrice(showPaymentModal)}</span>
                              ${getFinalAmount(showPaymentModal)}
                            </span>
                          </div>
                        )}

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

                        <div>
                          <div className="text-xs text-muted-foreground mb-1.5">{t('pricing.uploadScreenshot') || "Upload payment screenshot"}</div>
                          <label className="flex items-center gap-2 p-2.5 rounded-xl border border-white/10 bg-black/30 cursor-pointer hover-elevate" data-testid="input-screenshot">
                            <Upload className="w-4 h-4 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground truncate">
                              {screenshotFile ? screenshotFile.name : (t('pricing.chooseFile') || "Choose file...")}
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => setScreenshotFile(e.target.files?.[0] || null)}
                            />
                          </label>
                        </div>

                        <Button
                          className={`w-full ${showPaymentModal === "PRO" ? "bg-emerald-600" : showPaymentModal === "ENTERPRISE" ? "bg-amber-600" : "bg-violet-600"}`}
                          onClick={() => submitPayment(showPaymentModal)}
                          disabled={timerExpired}
                          data-testid="button-submit-payment"
                        >
                          {showPaymentModal === "PRO" ? (
                            <Star className="w-4 h-4 mr-2" />
                          ) : showPaymentModal === "ENTERPRISE" ? (
                            <Crown className="w-4 h-4 mr-2" />
                          ) : (
                            <Users className="w-4 h-4 mr-2" />
                          )}
                          {t('pricing.submitApplication')} {showPaymentModal} — ${getFinalAmount(showPaymentModal)}
                        </Button>
                        
                        <p className="text-xs text-center text-muted-foreground">
                          {t('dashboard.requestWillBeSent')}
                        </p>
                      </>
                    )}

                    {selectedMethod === "monobank" && (
                      <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-gradient-to-br from-violet-500/10 to-transparent border border-violet-500/30 text-center">
                          <div className="flex items-center justify-center gap-3 mb-3">
                            <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11.96 11.96 0 0 0 1 12c0 1.94.46 3.77 1.18 5.07l3.66-2.84z" fill="#FBBC05"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                              </svg>
                            </div>
                            <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center">
                              <svg width="22" height="26" viewBox="0 0 170 200" fill="white">
                                <path d="M150.4 172.3c-7.8 18.2-16.3 27-30.5 27-8.1 0-13.6-4.7-22.4-4.7-9.1 0-15.2 4.8-22.8 4.8-14.4 0-28.1-18.1-38.7-42.7C26.1 132.4 20 109.3 20 87.3c0-35.2 23-53.8 45.5-53.8 9.8 0 17.9 5.4 24 5.4 5.8 0 14.8-5.7 25.9-5.7 7.3 0 23.6 2.8 33.2 17.7-1.2.8-23.6 14.3-23.6 38.7 0 28.2 24.6 38.1 25.4 38.4zM114.5 0c-17.1 1.3-33.3 18.9-31.5 36.8 15.6 0 33.2-17.2 31.5-36.8z"/>
                              </svg>
                            </div>
                          </div>
                          <p className="text-sm font-medium mb-1">Monobank</p>
                          <div className="text-2xl font-bold text-violet-400 mb-1">
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
                          <p className="text-xs text-muted-foreground mb-3">
                            ~${getFinalAmount(showPaymentModal)} USD
                          </p>
                          <p className="text-xs text-muted-foreground mb-4">
                            {t('pricing.bankConversionNote') || "Amount is in Ukrainian hryvnia (UAH). Your bank will automatically convert from your currency at the current exchange rate."}
                          </p>
                          <Button
                            className="w-full bg-violet-600"
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
                                if (response.ok && data.pageUrl) {
                                  window.location.href = data.pageUrl;
                                } else if (response.status === 503) {
                                  toast({
                                    title: "Monobank",
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
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="mr-1">
                              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11.96 11.96 0 0 0 1 12c0 1.94.46 3.77 1.18 5.07l3.66-2.84z" fill="#FBBC05"/>
                              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                            </svg>
                            <svg width="12" height="14" viewBox="0 0 170 200" fill="white" className="mr-2">
                              <path d="M150.4 172.3c-7.8 18.2-16.3 27-30.5 27-8.1 0-13.6-4.7-22.4-4.7-9.1 0-15.2 4.8-22.8 4.8-14.4 0-28.1-18.1-38.7-42.7C26.1 132.4 20 109.3 20 87.3c0-35.2 23-53.8 45.5-53.8 9.8 0 17.9 5.4 24 5.4 5.8 0 14.8-5.7 25.9-5.7 7.3 0 23.6 2.8 33.2 17.7-1.2.8-23.6 14.3-23.6 38.7 0 28.2 24.6 38.1 25.4 38.4zM114.5 0c-17.1 1.3-33.3 18.9-31.5 36.8 15.6 0 33.2-17.2 31.5-36.8z"/>
                            </svg>
                            {t('pricing.payWithMonobank') || "Pay with Monobank"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
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
