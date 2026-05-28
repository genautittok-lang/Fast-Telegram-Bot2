import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { Seo } from "@/components/Seo";
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
  ArrowLeftIcon,
  ShieldCheck,
  CheckCircle,
  Award,
  RefreshCw,
  Zap
} from "lucide-react";


const PRICES = {
  PRO: { monthly: 9, yearly: 90 },
  ENTERPRISE: { monthly: 29, yearly: 290 },
  GROUPS: { monthly: 49, yearly: 490 },
};

function PricingContent() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const { t, lang } = useTranslation();
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
  const [auditOpen, setAuditOpen] = useState(false);
  const [auditLoading, setAuditLoading] = useState<"crypto" | "monobank" | null>(null);

  const startSingleAudit = async (method: "crypto" | "monobank") => {
    if (!isAuthenticated) {
      toast({ title: lang === "uk" ? "Потрібен вхід" : lang === "ru" ? "Нужен вход" : "Sign in required", description: lang === "uk" ? "Увійдіть, щоб придбати разовий аудит." : lang === "ru" ? "Войдите, чтобы оплатить разовый аудит." : "Please sign in to purchase a single audit." });
      setLocation("/auth");
      return;
    }
    try {
      setAuditLoading(method);
      const r = await fetch("/api/payments/single-audit/create", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method }),
      });
      const data = await r.json();
      if (r.ok && data.pageUrl && /^https?:\/\//i.test(data.pageUrl)) {
        window.location.href = data.pageUrl;
        return;
      }
      toast({
        title: lang === "uk" ? "Не вдалося створити оплату" : lang === "ru" ? "Не удалось создать оплату" : lang === "es" ? "Error al crear el pago" : lang === "de" ? "Zahlung fehlgeschlagen" : "Failed to start payment",
        description: data.error || (lang === "uk" ? "Спробуйте інший спосіб" : lang === "ru" ? "Попробуйте другой способ" : lang === "es" ? "Intenta otro método" : lang === "de" ? "Versuche eine andere Methode" : "Try another method"),
        variant: "destructive",
      });
    } catch (e: any) {
      toast({ title: lang === "uk" ? "Помилка мережі" : lang === "ru" ? "Ошибка сети" : lang === "es" ? "Error de red" : lang === "de" ? "Netzwerkfehler" : "Network error", description: e?.message || (lang === "uk" ? "Спробуйте ще раз" : lang === "ru" ? "Попробуйте снова" : lang === "es" ? "Inténtalo de nuevo" : lang === "de" ? "Erneut versuchen" : "Try again"), variant: "destructive" });
    } finally {
      setAuditLoading(null);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const planParam = params.get("plan");
    const codeParam = params.get("code");
    const validPlans: Array<"PRO" | "ENTERPRISE" | "GROUPS"> = ["PRO", "ENTERPRISE", "GROUPS"];
    if (planParam && validPlans.includes(planParam as any)) {
      const tier = planParam as "PRO" | "ENTERPRISE" | "GROUPS";
      if (codeParam) {
        setPromoCode(codeParam);
      }
      if (!user) {
        const card = document.querySelector(`[data-testid="card-${tier.toLowerCase()}-plan"]`);
        if (card) card.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      setPaymentStep("method");
      setSelectedMethod(null);
      setShowPaymentModal(tier);
      if (codeParam) {
        setTimeout(() => { validatePromo(codeParam, tier); }, 50);
      }
    }
  }, [user]);

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

  const validatePromo = async (overrideCode?: string, overrideTier?: "PRO" | "ENTERPRISE" | "GROUPS") => {
    const code = (overrideCode ?? promoCode).trim();
    const tierForValidation = overrideTier ?? showPaymentModal;
    if (!code) return;
    setPromoLoading(true);
    setPromoError("");
    try {
      const response = await fetch("/api/promo/validate", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, tier: tierForValidation }),
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
          description: data.error || (lang === "uk" ? "Не вдалося створити крипто-платіж" : lang === "ru" ? "Не удалось создать крипто-платёж" : lang === "es" ? "Error al crear pago crypto" : lang === "de" ? "Krypto-Zahlung fehlgeschlagen" : "Failed to create crypto payment"),
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: t('common.error'),
        description: lang === "uk" ? "Не вдалося підключитися до платіжного сервісу" : lang === "ru" ? "Не удалось подключиться к платёжному сервису" : lang === "es" ? "No se pudo conectar al servicio de pago" : lang === "de" ? "Verbindung zum Zahlungsdienst fehlgeschlagen" : "Failed to connect to payment service",
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
      lang === "uk" ? "🛡️ DarkShare VPN — 7 країн, 2 пристрої, Trojan Reality" : lang === "ru" ? "🛡️ DarkShare VPN — 7 стран, 2 устройства, Trojan Reality" : lang === "es" ? "🛡️ DarkShare VPN — 7 países, 2 dispositivos, Trojan Reality" : lang === "de" ? "🛡️ DarkShare VPN — 7 Länder, 2 Geräte, Trojan Reality" : "🛡️ DarkShare VPN — 7 countries, 2 devices, Trojan Reality",
      t('pricing.prioritySupport'),
      t('pricing.realTimeMonitoring'),
      t('pricing.apiBeta'),
    ],
    enterprise: [
      t('pricing.unlimitedChecks'),
      t('pricing.fullApiAccess'),
      lang === "uk" ? "🛡️ DarkShare VPN — 20+ країн, 5 пристроїв, нуль логів" : lang === "ru" ? "🛡️ DarkShare VPN — 20+ стран, 5 устройств, ноль логов" : lang === "es" ? "🛡️ DarkShare VPN — 20+ países, 5 dispositivos, cero logs" : lang === "de" ? "🛡️ DarkShare VPN — 20+ Länder, 5 Geräte, keine Logs" : "🛡️ DarkShare VPN — 20+ countries, 5 devices, zero logs",
      t('pricing.support247'),
      t('pricing.customReports'),
      t('pricing.whiteLabelIntegration'),
      t('pricing.slaGuarantees'),
      t('pricing.teamAccess'),
    ],
    groups: [
      t('pricing.groupsAllEnterprise'),
      lang === "uk" ? "🛡️ Командний DarkShare VPN — 20+ країн, 5 пристроїв на учасника" : lang === "ru" ? "🛡️ Командный DarkShare VPN — 20+ стран, 5 устройств на участника" : lang === "es" ? "🛡️ DarkShare VPN de equipo — 20+ países, 5 dispositivos por miembro" : lang === "de" ? "🛡️ DarkShare Team-VPN — 20+ Länder, 5 Geräte pro Mitglied" : "🛡️ DarkShare Team VPN — 20+ countries, 5 devices per member",
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
      <div className="relative container mx-auto px-4 py-10 sm:py-16 max-w-6xl">
        {!isAuthenticated && (
          <Button
            variant="ghost"
            className="mb-6 text-zinc-400 hover:text-white"
            onClick={() => setLocation("/")}
            data-testid="button-back"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('common.back')}
          </Button>
        )}

        {/* New Hero — clean centered */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10 sm:mb-14"
        >
          <Badge variant="outline" className="mb-6 border-cyan-500/30 text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/10 px-3 py-1">
            {lang === "uk" ? "Тарифні плани" : lang === "ru" ? "Тарифные планы" : lang === "es" ? "Planes" : lang === "de" ? "Preispläne" : "Pricing Plans"}
          </Badge>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white tracking-tight mb-6 leading-[1.05]" data-testid="text-pricing-title">
            {lang === "uk" ? "Прості тарифи." : lang === "ru" ? "Простые тарифы." : lang === "es" ? "Precios simples." : lang === "de" ? "Klare Tarife." : "Simple pricing."}
            <br/>
            <span className="text-zinc-500">
              {lang === "uk" ? "Без прихованих платежів." : lang === "ru" ? "Без скрытых платежей." : lang === "es" ? "Sin cargos ocultos." : lang === "de" ? "Keine versteckten Kosten." : "No hidden fees."}
            </span>
          </h1>
          <p className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto mb-8">
            {t('pricing.subtitle')}
          </p>
        </motion.div>

        {/* Single report — one-time purchase block */}
        <div className="mb-8 sm:mb-10">
          <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-[#0E0E12] p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="text-[12px] uppercase tracking-[0.18em] text-cyan-300/80">
                  {lang === "uk" ? "Разова покупка" : lang === "ru" ? "Разовая покупка" : lang === "es" ? "Compra única" : lang === "de" ? "Einmaliger Kauf" : "One-time purchase"}
                </div>
                <div className="mt-1 text-[18px] sm:text-[20px] font-semibold text-white">
                  {lang === "uk" ? "Один повний звіт" : lang === "ru" ? "Один полный отчёт" : lang === "es" ? "Un informe completo" : lang === "de" ? "Ein vollständiger Bericht" : "One full report"} — <span className="text-cyan-300">$3</span>
                </div>
                <p className="mt-1 text-[13.5px] text-zinc-400">
                  {lang === "uk"
                    ? "Усі знахідки за однією ціллю, перелік джерел, PDF. Без підписки."
                    : lang === "ru"
                    ? "Все находки по одной цели, перечень источников, PDF. Без подписки."
                    : lang === "es"
                    ? "Todos los hallazgos para un objetivo, fuentes, PDF. Sin suscripción."
                    : lang === "de"
                    ? "Alle Funde für ein Ziel, Quellen, PDF. Ohne Abo."
                    : "All findings for one target, sources, PDF. No subscription."}
                </p>
              </div>
              <Button
                onClick={() => setAuditOpen(true)}
                className="bg-white text-black hover:bg-zinc-200"
                data-testid="button-buy-single-report"
              >
                {lang === "uk" ? "Купити за $3" : lang === "ru" ? "Купить за $3" : lang === "es" ? "Comprar por $3" : lang === "de" ? "Für $3 kaufen" : "Buy for $3"}
                <ChevronRight className="ml-1.5 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center mb-6 sm:mb-8">
          <div className="relative flex rounded-full border border-white/[0.08] bg-white/[0.03] p-1 gap-0.5" data-testid="billing-toggle">
            <button
              onClick={() => setIsYearly(false)}
              className={`relative rounded-full px-5 py-2 text-sm font-medium transition-all duration-200 ${!isYearly ? "bg-white/[0.09] text-white shadow-inner ring-1 ring-white/[0.07]" : "text-zinc-500 hover:text-zinc-300"}`}
              data-testid="toggle-monthly"
            >
              {t('pricing.monthly')}
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`relative rounded-full px-5 py-2 text-sm font-medium transition-all duration-200 flex items-center gap-2 ${isYearly ? "bg-white/[0.09] text-white shadow-inner ring-1 ring-white/[0.07]" : "text-zinc-500 hover:text-zinc-300"}`}
              data-testid="toggle-yearly"
            >
              {t('pricing.yearly')}
              <span className="rounded-full bg-cyan-500/20 border border-cyan-500/30 px-1.5 py-0.5 text-[10px] font-bold text-cyan-400">-17%</span>
            </button>
          </div>
          {isYearly && (
            <span className="ml-3 text-[11px] text-zinc-500">
              {lang === "uk" ? "= 2 міс. безплатно" : lang === "ru" ? "= 2 мес. бесплатно" : lang === "es" ? "= 2 meses gratis" : lang === "de" ? "= 2 Monate gratis" : "= 2 months free"}
            </span>
          )}
        </div>

        <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
          {/* Background glow behind cards */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-cyan-500/[0.07] blur-[120px] rounded-full pointer-events-none -z-10"></div>

          {/* FREE */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative rounded-2xl bg-zinc-900/50 backdrop-blur-sm border border-white/[0.06] p-6 flex flex-col hover:border-white/10 transition-colors"
            data-testid="card-free-plan"
          >
            <div className="mb-5">
              <h3 className="text-lg font-bold text-white mb-1.5">FREE</h3>
              <p className="text-xs text-zinc-500">{t('pricing.forBeginners')}</p>
            </div>
            <div className="mb-6">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white tracking-tight">$0</span>
                <span className="text-zinc-500 text-sm ml-1">{t('pricing.perMonth')}</span>
              </div>
            </div>
            <ul className="space-y-3 mb-6 flex-grow">
              {features.free.map((feature, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span className="text-zinc-300">{feature}</span>
                </li>
              ))}
            </ul>
            <Button
              variant="outline"
              className="w-full bg-white/5 hover:bg-white/10 text-white border-white/10 hover:border-white/20 h-11"
              onClick={() => setLocation(isAuthenticated ? "/dashboard" : "/login")}
              data-testid="button-free-plan"
            >
              {isAuthenticated ? t('nav.dashboard') : t('pricing.startFree')}
            </Button>
          </motion.div>

          {/* PRO — recommended (visually dominant) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative rounded-2xl bg-gradient-to-br from-cyan-950/60 via-zinc-900/80 to-zinc-950 backdrop-blur-sm border-2 border-cyan-500/60 shadow-[0_0_70px_rgba(6,182,212,0.35)] p-6 flex flex-col lg:scale-[1.06] z-10 overflow-hidden"
            data-testid="card-pro-plan"
          >
            <div className="absolute -top-24 -right-24 w-56 h-56 bg-cyan-500/20 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-cyan-400/10 rounded-full blur-[60px] pointer-events-none" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-400 to-cyan-500 text-zinc-950 text-[11px] font-extrabold px-4 py-1.5 rounded-full uppercase tracking-wider whitespace-nowrap shadow-[0_0_20px_rgba(6,182,212,0.6)] flex items-center gap-1.5">
              <Zap className="w-3 h-3" />
              {t('pricing.popular') || "Most Popular"}
            </div>
            <div className="relative mb-5 mt-2">
              <div className="flex items-center gap-2 mb-1.5">
                <h3 className="text-2xl font-extrabold text-white tracking-tight">PRO</h3>
                <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 border border-cyan-500/40 text-[10px] font-bold text-cyan-300 uppercase tracking-wider">
                  + VPN
                </span>
              </div>
              <p className="text-xs text-zinc-400">{t('pricing.forProfessionals')}</p>
              <div className="mt-2 inline-flex items-center gap-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-orange-500" />
                </span>
                <span className="text-[10px] text-orange-400 font-medium">
                  {lang === "uk" ? "Лише 12 місць залишилось" : lang === "ru" ? "Только 12 мест осталось" : lang === "es" ? "Solo quedan 12 lugares" : lang === "de" ? "Nur noch 12 Plätze" : "Only 12 spots left"}
                </span>
              </div>
            </div>
            <div className="mb-6">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white tracking-tight">${getPrice("PRO")}</span>
                <span className="text-zinc-500 text-sm ml-1">{isYearly ? t('pricing.perYear') : t('pricing.perMonth')}</span>
              </div>
              {isYearly && (
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="text-xs text-zinc-500 line-through">$120</span>
                  <Badge className="bg-cyan-500/15 text-cyan-400 border-cyan-500/30 text-[10px] px-1.5 py-0">-17%</Badge>
                </div>
              )}
            </div>
            <ul className="space-y-3 mb-6 flex-grow">
              {features.pro.map((feature, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span className="text-zinc-200">{feature}</span>
                </li>
              ))}
            </ul>
            <Button
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-semibold h-11 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
              onClick={() => handlePayment("PRO")}
              data-testid="button-pro-plan"
            >
              {t('pricing.subscribe') || "Subscribe"} — ${getPrice("PRO")}
            </Button>
            <div className="mt-3 space-y-1.5" data-testid="pro-trust-block">
              <div className="flex items-center gap-1.5 text-[11px] text-cyan-300/90">
                <Check className="w-3 h-3 shrink-0" />
                <span>
                  {lang === "uk" ? "Гарантія повернення 7 днів" :
                   lang === "ru" ? "Возврат денег 7 дней" :
                   lang === "es" ? "Garantía de devolución 7 días" :
                   lang === "de" ? "7 Tage Geld-zurück-Garantie" :
                   "7-day money-back guarantee"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                <Check className="w-3 h-3 shrink-0 text-cyan-400/70" />
                <span>
                  {lang === "uk" ? "Скасувати в будь-який момент • без прихованих платежів" :
                   lang === "ru" ? "Отмена в любой момент • без скрытых платежей" :
                   lang === "es" ? "Cancela cuando quieras • sin cargos ocultos" :
                   lang === "de" ? "Jederzeit kündbar • keine versteckten Gebühren" :
                   "Cancel anytime • no hidden fees"}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] text-orange-400/90">
                <span className="font-bold">DARKNEU</span>
                <span className="text-zinc-400">→</span>
                <span className="text-white font-semibold">${(getPrice("PRO") * 0.5).toFixed(0)}</span>
                <span className="text-zinc-500">{isYearly ? t('pricing.perYear') : t('pricing.perMonth')}</span>
                <span className="text-zinc-500 line-through">${getPrice("PRO")}</span>
              </div>
            </div>
          </motion.div>

          {/* ENTERPRISE */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative rounded-2xl bg-zinc-900/50 backdrop-blur-sm border border-white/[0.06] p-6 flex flex-col hover:border-white/10 transition-colors"
            data-testid="card-enterprise-plan"
          >
            <div className="mb-5">
              <h3 className="text-lg font-bold text-white mb-1.5">ENTERPRISE</h3>
              <p className="text-xs text-zinc-500">{t('pricing.forTeams')}</p>
            </div>
            <div className="mb-6">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white tracking-tight">${getPrice("ENTERPRISE")}</span>
                <span className="text-zinc-500 text-sm ml-1">{isYearly ? t('pricing.perYear') : t('pricing.perMonth')}</span>
              </div>
              {isYearly && (
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="text-xs text-zinc-500 line-through">$420</span>
                  <Badge className="bg-cyan-500/15 text-cyan-400 border-cyan-500/30 text-[10px] px-1.5 py-0">-17%</Badge>
                </div>
              )}
            </div>
            <ul className="space-y-3 mb-6 flex-grow">
              {features.enterprise.map((feature, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span className="text-zinc-300">{feature}</span>
                </li>
              ))}
            </ul>
            <Button
              variant="outline"
              className="w-full bg-white/5 hover:bg-white/10 text-white border-white/10 hover:border-white/20 h-11"
              onClick={() => handlePayment("ENTERPRISE")}
              data-testid="button-enterprise-plan"
            >
              {t('pricing.subscribe') || "Subscribe"} — ${getPrice("ENTERPRISE")}
            </Button>
          </motion.div>

          {/* GROUPS */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="relative rounded-2xl bg-zinc-900/50 backdrop-blur-sm border border-white/[0.06] p-6 flex flex-col sm:col-span-2 lg:col-span-1 hover:border-white/10 transition-colors"
            data-testid="card-groups-plan"
          >
            <div className="absolute top-4 right-4 px-2 py-0.5 bg-violet-500/15 text-violet-300 border border-violet-500/30 text-[10px] font-medium rounded-md">
              {t('pricing.newLabel') || "New"}
            </div>
            <div className="mb-5">
              <h3 className="text-lg font-bold text-white mb-1.5">GROUPS</h3>
              <p className="text-xs text-zinc-500">{t('pricing.forGroups')}</p>
            </div>
            <div className="mb-6">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white tracking-tight">${getPrice("GROUPS")}</span>
                <span className="text-zinc-500 text-sm ml-1">{isYearly ? t('pricing.perYear') : t('pricing.perMonth')}</span>
              </div>
              {isYearly && (
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="text-xs text-zinc-500 line-through">$660</span>
                  <Badge className="bg-cyan-500/15 text-cyan-400 border-cyan-500/30 text-[10px] px-1.5 py-0">-17%</Badge>
                </div>
              )}
            </div>
            <ul className="space-y-3 mb-6 flex-grow">
              {features.groups.map((feature, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span className="text-zinc-300">{feature}</span>
                </li>
              ))}
            </ul>
            <Button
              variant="outline"
              className="w-full bg-white/5 hover:bg-white/10 text-white border-white/10 hover:border-white/20 h-11"
              onClick={() => handlePayment("GROUPS")}
              data-testid="button-groups-plan"
            >
              {t('pricing.subscribe') || "Subscribe"} — ${getPrice("GROUPS")}
            </Button>
          </motion.div>
        </div>

        {/* ── Feature Comparison Table ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="mt-10 sm:mt-14"
          data-testid="feature-comparison-table"
        >
          <div className="text-center mb-6">
            <div className="text-[11px] uppercase tracking-[0.2em] text-cyan-300/70 mb-1">
              {lang === "uk" ? "Повне порівняння" : lang === "ru" ? "Полное сравнение" : lang === "es" ? "Comparación completa" : lang === "de" ? "Vollständiger Vergleich" : "Full comparison"}
            </div>
            <h2 className="text-[20px] sm:text-[24px] font-semibold text-white tracking-tight">
              {lang === "uk" ? "Що входить у кожен план" : lang === "ru" ? "Что входит в каждый план" : lang === "es" ? "Qué incluye cada plan" : lang === "de" ? "Was jeder Plan beinhaltet" : "What's included in each plan"}
            </h2>
          </div>

          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="min-w-[600px] sm:min-w-0">
              {/* Header row */}
              <div className="grid grid-cols-5 gap-px mb-px">
                <div className="bg-transparent px-3 py-3" />
                {(["FREE", "PRO", "ENTERPRISE", "GROUPS"] as const).map((plan) => (
                  <div
                    key={plan}
                    className={`px-3 py-3 text-center rounded-t-xl text-[12px] font-bold tracking-wide ${
                      plan === "PRO"
                        ? "bg-cyan-500/15 border border-b-0 border-cyan-500/30 text-cyan-300"
                        : "bg-white/[0.03] border border-b-0 border-white/[0.06] text-zinc-300"
                    }`}
                  >
                    {plan}
                  </div>
                ))}
              </div>

              {/* Feature rows */}
              {(() => {
                type Plan = "FREE" | "PRO" | "ENTERPRISE" | "GROUPS";
                type FeatureValue = boolean | string;
                interface FeatureRow {
                  category?: boolean;
                  label: string;
                  values: Record<Plan, FeatureValue>;
                }
                const rows: FeatureRow[] = [
                  {
                    category: true,
                    label: lang === "uk" ? "Перевірки" : lang === "ru" ? "Проверки" : lang === "es" ? "Verificaciones" : lang === "de" ? "Checks" : "Checks",
                    values: { FREE: false, PRO: false, ENTERPRISE: false, GROUPS: false },
                  },
                  {
                    label: lang === "uk" ? "Щоденних перевірок" : lang === "ru" ? "Проверок в день" : lang === "es" ? "Checks por día" : lang === "de" ? "Checks pro Tag" : "Checks per day",
                    values: { FREE: lang === "uk" ? "1 + 5 бонус" : lang === "ru" ? "1 + 5 бонус" : lang === "es" ? "1 + 5 bono" : lang === "de" ? "1 + 5 Bonus" : "1 + 5 bonus", PRO: "50", ENTERPRISE: lang === "uk" ? "Безліміт" : lang === "ru" ? "Безлимит" : lang === "es" ? "Ilimitado" : lang === "de" ? "Unbegrenzt" : "Unlimited", GROUPS: lang === "uk" ? "Безліміт" : lang === "ru" ? "Безлимит" : lang === "es" ? "Ilimitado" : lang === "de" ? "Unbegrenzt" : "Unlimited" },
                  },
                  {
                    label: lang === "uk" ? "Типів перевірок" : lang === "ru" ? "Типов проверок" : lang === "es" ? "Tipos de verificación" : lang === "de" ? "Check-Typen" : "Check types",
                    values: { FREE: "5", PRO: "17", ENTERPRISE: "17", GROUPS: "17" },
                  },
                  {
                    label: lang === "uk" ? "Пакетні перевірки" : lang === "ru" ? "Пакетные проверки" : lang === "es" ? "Verificaciones masivas" : lang === "de" ? "Batch-Checks" : "Batch checks",
                    values: { FREE: false, PRO: false, ENTERPRISE: true, GROUPS: true },
                  },
                  {
                    category: true,
                    label: lang === "uk" ? "Аналітика та звіти" : lang === "ru" ? "Аналитика и отчёты" : lang === "es" ? "Análisis e informes" : lang === "de" ? "Analyse & Berichte" : "Analytics & reports",
                    values: { FREE: false, PRO: false, ENTERPRISE: false, GROUPS: false },
                  },
                  {
                    label: lang === "uk" ? "AI-аналіз ризиків" : lang === "ru" ? "AI-анализ рисков" : lang === "es" ? "Análisis de riesgos IA" : lang === "de" ? "KI-Risikoanalyse" : "AI risk analysis",
                    values: { FREE: false, PRO: true, ENTERPRISE: true, GROUPS: true },
                  },
                  {
                    label: "PDF " + (lang === "uk" ? "звіти" : lang === "ru" ? "отчёты" : lang === "es" ? "informes" : lang === "de" ? "Berichte" : "reports"),
                    values: { FREE: false, PRO: true, ENTERPRISE: true, GROUPS: true },
                  },
                  {
                    label: lang === "uk" ? "Кастомні звіти" : lang === "ru" ? "Кастомные отчёты" : lang === "es" ? "Informes personalizados" : lang === "de" ? "Custom-Berichte" : "Custom reports",
                    values: { FREE: false, PRO: false, ENTERPRISE: true, GROUPS: true },
                  },
                  {
                    label: lang === "uk" ? "Командний дашборд" : lang === "ru" ? "Командный дашборд" : lang === "es" ? "Panel de equipo" : lang === "de" ? "Team-Dashboard" : "Team dashboard",
                    values: { FREE: false, PRO: false, ENTERPRISE: false, GROUPS: true },
                  },
                  {
                    category: true,
                    label: lang === "uk" ? "Можливості" : lang === "ru" ? "Возможности" : lang === "es" ? "Funcionalidades" : lang === "de" ? "Features" : "Features",
                    values: { FREE: false, PRO: false, ENTERPRISE: false, GROUPS: false },
                  },
                  {
                    label: lang === "uk" ? "Моніторинг у реальному часі" : lang === "ru" ? "Мониторинг в реальном времени" : lang === "es" ? "Monitoreo en tiempo real" : lang === "de" ? "Echtzeit-Monitoring" : "Real-time monitoring",
                    values: { FREE: false, PRO: true, ENTERPRISE: true, GROUPS: true },
                  },
                  {
                    label: "API " + (lang === "uk" ? "доступ" : lang === "ru" ? "доступ" : lang === "es" ? "acceso" : lang === "de" ? "Zugang" : "access"),
                    values: { FREE: false, PRO: lang === "uk" ? "Бета" : lang === "ru" ? "Бета" : lang === "es" ? "Beta" : lang === "de" ? "Beta" : "Beta", ENTERPRISE: true, GROUPS: true },
                  },
                  {
                    label: "DarkShare VPN",
                    values: {
                      FREE: false,
                      PRO: lang === "uk" ? "2 пристрої · 7 країн" : lang === "ru" ? "2 устройства · 7 стран" : lang === "es" ? "2 dispositivos · 7 países" : lang === "de" ? "2 Geräte · 7 Länder" : "2 devices · 7 countries",
                      ENTERPRISE: lang === "uk" ? "5 пристроїв · 20+ країн" : lang === "ru" ? "5 устройств · 20+ стран" : lang === "es" ? "5 dispositivos · 20+ países" : lang === "de" ? "5 Geräte · 20+ Länder" : "5 devices · 20+ countries",
                      GROUPS: lang === "uk" ? "5/учасник · 20+ країн" : lang === "ru" ? "5/участник · 20+ стран" : lang === "es" ? "5/miembro · 20+ países" : lang === "de" ? "5/Mitglied · 20+ Länder" : "5/member · 20+ countries",
                    },
                  },
                  {
                    label: "White-label",
                    values: { FREE: false, PRO: false, ENTERPRISE: true, GROUPS: false },
                  },
                  {
                    label: lang === "uk" ? "Telegram бот" : lang === "ru" ? "Telegram бот" : lang === "es" ? "Bot de Telegram" : lang === "de" ? "Telegram-Bot" : "Telegram bot",
                    values: { FREE: true, PRO: true, ENTERPRISE: true, GROUPS: true },
                  },
                  {
                    category: true,
                    label: lang === "uk" ? "Команда та безпека" : lang === "ru" ? "Команда и безопасность" : lang === "es" ? "Equipo y seguridad" : lang === "de" ? "Team & Sicherheit" : "Team & security",
                    values: { FREE: false, PRO: false, ENTERPRISE: false, GROUPS: false },
                  },
                  {
                    label: lang === "uk" ? "Учасників команди" : lang === "ru" ? "Участников команды" : lang === "es" ? "Miembros del equipo" : lang === "de" ? "Teammitglieder" : "Team members",
                    values: { FREE: "1", PRO: "1", ENTERPRISE: "5", GROUPS: "25" },
                  },
                  {
                    label: lang === "uk" ? "Управління ролями" : lang === "ru" ? "Управление ролями" : lang === "es" ? "Gestión de roles" : lang === "de" ? "Rollenverwaltung" : "Role management",
                    values: { FREE: false, PRO: false, ENTERPRISE: false, GROUPS: true },
                  },
                  {
                    label: lang === "uk" ? "Спільні звіти" : lang === "ru" ? "Общие отчёты" : lang === "es" ? "Informes compartidos" : lang === "de" ? "Geteilte Berichte" : "Shared reports",
                    values: { FREE: false, PRO: false, ENTERPRISE: false, GROUPS: true },
                  },
                  {
                    label: "SLA " + (lang === "uk" ? "гарантія" : lang === "ru" ? "гарантия" : lang === "es" ? "garantía" : lang === "de" ? "Garantie" : "guarantee"),
                    values: { FREE: false, PRO: false, ENTERPRISE: true, GROUPS: true },
                  },
                  {
                    category: true,
                    label: lang === "uk" ? "Підтримка" : lang === "ru" ? "Поддержка" : lang === "es" ? "Soporte" : lang === "de" ? "Support" : "Support",
                    values: { FREE: false, PRO: false, ENTERPRISE: false, GROUPS: false },
                  },
                  {
                    label: lang === "uk" ? "Пріоритетна підтримка" : lang === "ru" ? "Приоритетная поддержка" : lang === "es" ? "Soporte prioritario" : lang === "de" ? "Prioritätssupport" : "Priority support",
                    values: { FREE: false, PRO: true, ENTERPRISE: true, GROUPS: true },
                  },
                  {
                    label: "24/7 " + (lang === "uk" ? "підтримка" : lang === "ru" ? "поддержка" : lang === "es" ? "soporte" : lang === "de" ? "Support" : "support"),
                    values: { FREE: false, PRO: false, ENTERPRISE: true, GROUPS: true },
                  },
                  {
                    label: lang === "uk" ? "Повернення коштів" : lang === "ru" ? "Возврат средств" : lang === "es" ? "Reembolso" : lang === "de" ? "Rückerstattung" : "Money-back",
                    values: { FREE: false, PRO: lang === "uk" ? "7 днів" : lang === "ru" ? "7 дней" : lang === "es" ? "7 días" : lang === "de" ? "7 Tage" : "7 days", ENTERPRISE: lang === "uk" ? "7 днів" : lang === "ru" ? "7 дней" : lang === "es" ? "7 días" : lang === "de" ? "7 Tage" : "7 days", GROUPS: lang === "uk" ? "7 днів" : lang === "ru" ? "7 дней" : lang === "es" ? "7 días" : lang === "de" ? "7 Tage" : "7 days" },
                  },
                ];

                const plans: Plan[] = ["FREE", "PRO", "ENTERPRISE", "GROUPS"];

                return rows.map((row, idx) => {
                  if (row.category) {
                    return (
                      <div key={idx} className="grid grid-cols-5 gap-px mt-3 mb-1">
                        <div className="col-span-5 px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-zinc-500 font-semibold bg-white/[0.02] rounded-lg">
                          {row.label}
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div key={idx} className="grid grid-cols-5 gap-px hover:bg-white/[0.02] transition-colors group">
                      <div className="px-3 py-2.5 text-[12px] text-zinc-400 group-hover:text-zinc-300 transition-colors flex items-center">
                        {row.label}
                      </div>
                      {plans.map((plan) => {
                        const val = row.values[plan];
                        return (
                          <div
                            key={plan}
                            className={`px-3 py-2.5 text-center flex items-center justify-center text-[12px] ${
                              plan === "PRO"
                                ? "bg-cyan-500/[0.04] border-x border-cyan-500/20"
                                : ""
                            }`}
                          >
                            {val === true ? (
                              <Check className="w-4 h-4 text-cyan-400 mx-auto" />
                            ) : val === false ? (
                              <span className="w-3 h-px bg-zinc-700 block mx-auto" />
                            ) : (
                              <span className="text-[11px] text-zinc-300 font-medium">{val}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                });
              })()}

              {/* Bottom CTA row */}
              <div className="grid grid-cols-5 gap-px mt-px">
                <div className="px-3 py-3" />
                {(["FREE", "PRO", "ENTERPRISE", "GROUPS"] as const).map((plan) => (
                  <div
                    key={plan}
                    className={`px-3 py-3 rounded-b-xl ${
                      plan === "PRO"
                        ? "bg-cyan-500/15 border border-t-0 border-cyan-500/30"
                        : "bg-white/[0.03] border border-t-0 border-white/[0.06]"
                    }`}
                  >
                    <button
                      onClick={() => {
                        if (plan === "FREE") { setLocation(isAuthenticated ? "/dashboard" : "/login"); }
                        else { handlePayment(plan as "PRO" | "ENTERPRISE" | "GROUPS"); }
                      }}
                      className={`w-full text-[11px] font-semibold py-1.5 px-2 rounded-lg transition-colors ${
                        plan === "PRO"
                          ? "bg-cyan-500 hover:bg-cyan-400 text-black"
                          : "bg-white/10 hover:bg-white/15 text-white"
                      }`}
                      data-testid={`button-compare-${plan.toLowerCase()}`}
                    >
                      {plan === "FREE"
                        ? (lang === "uk" ? "Почати" : lang === "ru" ? "Начать" : lang === "es" ? "Empezar" : lang === "de" ? "Starten" : "Start free")
                        : (lang === "uk" ? "Обрати" : lang === "ru" ? "Выбрать" : lang === "es" ? "Elegir" : lang === "de" ? "Wählen" : "Choose")}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 sm:mt-10"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-b from-white/[0.03] to-transparent border border-white/[0.06] text-center">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  {lang === "uk" ? "Безпечна оплата" : lang === "ru" ? "Безопасная оплата" : lang === "es" ? "Pago seguro" : lang === "de" ? "Sichere Zahlung" : "Secure Payment"}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {lang === "uk" ? "Шифрування та захист даних" : lang === "ru" ? "Шифрование и защита данных" : lang === "es" ? "Cifrado y protegido" : lang === "de" ? "Verschlüsselt & geschützt" : "Encrypted & protected"}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-b from-white/[0.03] to-transparent border border-white/[0.06] text-center">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  {lang === "uk" ? "Миттєва активація" : lang === "ru" ? "Мгновенная активация" : lang === "es" ? "Activación instantánea" : lang === "de" ? "Sofortige Aktivierung" : "Instant Activation"}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {lang === "uk" ? "Доступ відразу після оплати" : lang === "ru" ? "Доступ сразу после оплаты" : lang === "es" ? "Acceso justo después del pago" : lang === "de" ? "Zugang sofort nach Zahlung" : "Access right after payment"}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-b from-white/[0.03] to-transparent border border-white/[0.06] text-center">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <Award className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  {lang === "uk" ? "Підтримка 24/7" : lang === "ru" ? "Поддержка 24/7" : lang === "es" ? "Soporte 24/7" : lang === "de" ? "24/7 Support" : "24/7 Support"}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {lang === "uk" ? "Відповідаємо у Telegram" : lang === "ru" ? "Отвечаем в Telegram" : lang === "es" ? "Respondemos en Telegram" : lang === "de" ? "Wir antworten in Telegram" : "We respond in Telegram"}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-6 sm:mt-8 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-cyan-500/[0.05] via-transparent to-cyan-500/[0.05] border border-cyan-500/15"
        >
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="text-3xl">💎</div>
              <div>
                <p className="text-sm font-bold text-white">
                  {lang === "uk" ? "Чому обирають DARKSHARE?" : lang === "ru" ? "Почему выбирают DARKSHARE?" : lang === "es" ? "¿Por qué elegir DARKSHARE?" : lang === "de" ? "Warum DARKSHARE wählen?" : "Why choose DARKSHARE?"}
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                  {[
                    lang === "uk" ? "17 типів перевірок" : lang === "ru" ? "17 типов проверок" : lang === "es" ? "17 tipos de verificación" : lang === "de" ? "17 Check-Typen" : "17 check types",
                    lang === "uk" ? "AI аналіз ризиків" : lang === "ru" ? "AI анализ рисков" : lang === "es" ? "Análisis IA de riesgos" : lang === "de" ? "KI-Risikoanalyse" : "AI risk analysis",
                    lang === "uk" ? "PDF звіти" : lang === "ru" ? "PDF отчёты" : lang === "es" ? "Informes PDF" : lang === "de" ? "PDF-Berichte" : "PDF reports",
                    lang === "uk" ? "Telegram бот" : lang === "ru" ? "Telegram бот" : lang === "es" ? "Bot de Telegram" : lang === "de" ? "Telegram-Bot" : "Telegram bot",
                  ].map((item, i) => (
                    <span key={i} className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Check className="w-3 h-3 text-cyan-500 shrink-0" />
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="sm:text-right">
              <div className="flex items-center gap-1.5 justify-center sm:justify-end">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" aria-hidden />
                <span className="text-xs font-medium text-emerald-300">
                  {lang === "uk" ? "Зашифровано" : lang === "ru" ? "Зашифровано" : lang === "es" ? "Cifrado" : lang === "de" ? "Verschlüsselt" : "Encrypted"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {lang === "uk" ? "Преміум-якість · без логів" : lang === "ru" ? "Премиум-качество · без логов" : lang === "es" ? "Calidad premium · sin registros" : lang === "de" ? "Premium-Qualität · keine Logs" : "Premium quality · zero logs"}
              </p>
            </div>
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
                    ? "bg-gradient-to-br from-cyan-500/[0.08] to-transparent" 
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

                  <div className="flex items-center gap-3 pr-12 sm:gap-3.5">
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
                    <div className={`shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shadow-lg ${
                      showPaymentModal === "PRO" 
                        ? "bg-gradient-to-br from-cyan-500/30 to-cyan-600/10 border border-cyan-500/30 shadow-cyan-500/20" 
                        : showPaymentModal === "ENTERPRISE"
                        ? "bg-gradient-to-br from-amber-500/30 to-amber-600/10 border border-amber-500/30 shadow-amber-500/20"
                        : "bg-gradient-to-br from-violet-500/30 to-violet-600/10 border border-violet-500/30 shadow-violet-500/20"
                    }`}>
                      {showPaymentModal === "PRO" ? (
                        <Star className="w-5 h-5 text-cyan-400" />
                      ) : showPaymentModal === "ENTERPRISE" ? (
                        <Crown className="w-5 h-5 text-amber-400" />
                      ) : (
                        <Users className="w-5 h-5 text-violet-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base sm:text-lg font-bold font-display truncate" data-testid="text-plan-name">
                        {showPaymentModal} {t('pricing.planLabel')}
                      </h3>
                      <p className="text-muted-foreground text-[11.5px] sm:text-xs truncate">
                        {isYearly ? t('pricing.yearlySubscription') : t('pricing.monthlySubscription')} — {getFinalAmount(showPaymentModal) < getPrice(showPaymentModal) ? (
                          <>
                            <span className="line-through text-muted-foreground/50">${getPrice(showPaymentModal)}</span>{" "}
                            <span className={`font-semibold ${showPaymentModal === "PRO" ? "text-cyan-400" : showPaymentModal === "ENTERPRISE" ? "text-amber-400" : "text-violet-400"}`}>${getFinalAmount(showPaymentModal)} USD</span>
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
                          className={`w-full flex items-center gap-3 p-3 sm:p-4 rounded-2xl border text-left transition-colors ${
                            selectedMethod === "monobank"
                              ? "border-cyan-400/40 bg-white/[0.04]"
                              : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20"
                          }`}
                          data-testid="button-method-monobank"
                        >
                          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-white/5 border border-white/10">
                            <div className="flex items-center gap-1">
                              <svg width="14" height="14" viewBox="0 0 48 48" aria-label="Google Pay"><path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"/><path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"/><path fill="#FBBC05" d="M11.69 28.18c-.44-1.32-.69-2.73-.69-4.18s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z"/><path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"/></svg>
                              <svg width="11" height="13" viewBox="0 0 170 200" fill="white" aria-label="Apple Pay"><path d="M150.4 172.3c-7.8 18.2-16.3 27-30.5 27-8.1 0-13.6-4.7-22.4-4.7-9.1 0-15.2 4.8-22.8 4.8-14.4 0-28.1-18.1-38.7-42.7C26.1 132.4 20 109.3 20 87.3c0-35.2 23-53.8 45.5-53.8 9.8 0 17.9 5.4 24 5.4 5.8 0 14.8-5.7 25.9-5.7 7.3 0 23.6 2.8 33.2 17.7-1.2.8-23.6 14.3-23.6 38.7 0 28.2 24.6 38.1 25.4 38.4zM114.5 0c-17.1 1.3-33.3 18.9-31.5 36.8 15.6 0 33.2-17.2 31.5-36.8z"/></svg>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-white truncate">
                              Google Pay · Apple Pay
                            </div>
                            <div className="text-[11px] text-zinc-500 mt-0.5 truncate">Visa · Mastercard</div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-sm font-semibold text-cyan-300 font-mono">${showPaymentModal ? getFinalAmount(showPaymentModal) : 0}</div>
                            <div className="text-[10px] text-zinc-500">USD</div>
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
                          onClick={() => validatePromo()}
                          disabled={promoLoading || promoApplied || !promoCode.trim()}
                          data-testid="button-apply-promo"
                        >
                          {promoLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : promoApplied ? <Check className="w-3 h-3" /> : (t('pricing.apply') || "Apply")}
                        </Button>
                      </div>
                      {promoError && <p className="text-xs text-red-400 mt-1">{promoError}</p>}
                      {promoApplied && <p className="text-xs text-cyan-400 mt-1">-{promoDiscount}% {t('pricing.promoAppliedLabel') || "discount applied"}</p>}
                    </div>

                    {promoApplied && showPaymentModal && (
                      <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/10 to-transparent border border-cyan-500/30">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{t('pricing.totalAmount') || "Total"}</span>
                          <div className="flex items-center gap-2">
                            <span className="line-through text-muted-foreground text-xs">${getPrice(showPaymentModal)}</span>
                            <span className="text-cyan-400 font-bold text-lg">${getFinalAmount(showPaymentModal)}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <Button
                      className={`w-full py-5 font-semibold text-sm rounded-2xl transition-all duration-200 ${
                        showPaymentModal === "PRO" 
                          ? "bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 shadow-lg shadow-cyan-500/20" 
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
                        : "bg-cyan-500/[0.08] border-cyan-500/25"
                    }`} data-testid="timer-display">
                      <Clock className={`w-4 h-4 ${timerExpired ? "text-red-400" : timeLeft <= 60 ? "text-amber-400" : "text-cyan-400"}`} />
                      <span className={`font-mono text-xl font-bold tracking-wider ${timerExpired ? "text-red-400" : timeLeft <= 60 ? "text-amber-400" : "text-cyan-400"}`}>
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
                        <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/10 text-center">
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/10 mb-3">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-label="Google Pay">
                              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11.96 11.96 0 0 0 1 12c0 1.94.46 3.77 1.18 5.07l3.66-2.84z" fill="#FBBC05"/>
                              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                            </svg>
                            <span className="text-[11px] text-zinc-400">Google Pay</span>
                            <span className="text-zinc-700">·</span>
                            <svg width="11" height="13" viewBox="0 0 170 200" fill="white" aria-label="Apple Pay">
                              <path d="M150.4 172.3c-7.8 18.2-16.3 27-30.5 27-8.1 0-13.6-4.7-22.4-4.7-9.1 0-15.2 4.8-22.8 4.8-14.4 0-28.1-18.1-38.7-42.7C26.1 132.4 20 109.3 20 87.3c0-35.2 23-53.8 45.5-53.8 9.8 0 17.9 5.4 24 5.4 5.8 0 14.8-5.7 25.9-5.7 7.3 0 23.6 2.8 33.2 17.7-1.2.8-23.6 14.3-23.6 38.7 0 28.2 24.6 38.1 25.4 38.4zM114.5 0c-17.1 1.3-33.3 18.9-31.5 36.8 15.6 0 33.2-17.2 31.5-36.8z"/>
                            </svg>
                            <span className="text-[11px] text-zinc-400">Apple Pay</span>
                          </div>
                          <div className="text-3xl sm:text-4xl font-semibold tracking-tight text-white my-2">
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
                          <p className="text-xs text-zinc-500 mb-2">
                            ≈ ${getFinalAmount(showPaymentModal)} USD · Visa · Mastercard
                          </p>
                          <p className="text-[11px] text-zinc-500/80 leading-relaxed">
                            {t('pricing.bankConversionNote')}
                          </p>
                        </div>

                        <Button
                          className="w-full bg-cyan-400 text-black hover:bg-cyan-300 font-semibold py-5 rounded-2xl transition-colors text-[14px] sm:text-[15px] whitespace-normal leading-snug px-3 shadow-[0_0_24px_-6px_rgba(34,211,238,0.55)]"
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
                                    description: data.error || (lang === "uk" ? "Сервіс оплати налаштовується. Спробуйте інший метод." : lang === "ru" ? "Сервис оплаты настраивается. Попробуйте другой способ." : lang === "es" ? "El servicio de pago está siendo configurado. Intenta otro método." : lang === "de" ? "Zahlungsdienst wird eingerichtet. Bitte anderen Weg versuchen." : "Payment service is being set up. Please try another payment method."),
                                    variant: "destructive",
                                  });
                                } else {
                                  toast({
                                    title: t('common.error'),
                                    description: data.error || (lang === "uk" ? "Не вдалося створити рахунок" : lang === "ru" ? "Не удалось создать счёт" : lang === "es" ? "Error al crear factura" : lang === "de" ? "Rechnung konnte nicht erstellt werden" : "Failed to create payment invoice"),
                                    variant: "destructive",
                                  });
                                }
                              } catch {
                                toast({
                                  title: t('common.error'),
                                  description: lang === "uk" ? "Не вдалося підключитися до платіжного сервісу" : lang === "ru" ? "Не удалось подключиться к платёжному сервису" : lang === "es" ? "No se pudo conectar al servicio de pago" : lang === "de" ? "Verbindung zum Zahlungsdienst fehlgeschlagen" : "Failed to connect to payment service",
                                  variant: "destructive",
                                });
                              }
                            }}
                            disabled={timerExpired}
                            data-testid="button-monobank-checkout"
                          >
                            <Lock className="w-4 h-4 mr-2" />
                            {t('pricing.payWithCard')}
                          </Button>

                          <div className="flex items-start gap-2 text-[11px] text-zinc-500 justify-center mt-3 px-2 text-center">
                            <Lock className="w-3 h-3 mt-0.5 shrink-0" />
                            <span className="break-words leading-snug">{t('pricing.bankConversionNote')}</span>
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

        <AnimatePresence>
          {auditOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
              onClick={() => !auditLoading && setAuditOpen(false)}
              data-testid="modal-single-audit"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0E0E12] p-6 shadow-2xl"
              >
                <div className="text-[12px] uppercase tracking-[0.2em] text-cyan-300/80 mb-1">
                  {lang === "uk" ? "Разовий аудит" : lang === "ru" ? "Разовый аудит" : lang === "es" ? "Auditoría única" : lang === "de" ? "Einmaliger Audit" : "Single audit"}
                </div>
                <div className="text-2xl font-semibold text-white mb-1">$3</div>
                <p className="text-[13.5px] text-zinc-400 mb-5">
                  {lang === "uk" ? "Один повний звіт за однією ціллю + 5 додаткових перевірок до твого балансу. Без підписки." : lang === "ru" ? "Один полный отчёт по цели + 5 дополнительных проверок к балансу. Без подписки." : lang === "es" ? "Un informe completo + 5 comprobaciones añadidas. Sin suscripción." : lang === "de" ? "Ein vollständiger Bericht + 5 zusätzliche Checks. Kein Abo." : "One full report for one target + 5 extra checks added to your balance. No subscription."}
                </p>

                <div className="space-y-2.5">
                  <button
                    type="button"
                    disabled={!!auditLoading}
                    onClick={() => startSingleAudit("monobank")}
                    className="w-full flex items-center justify-between gap-3 p-4 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-violet-400/30 transition-colors disabled:opacity-50"
                    data-testid="button-audit-card"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                        <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"/><path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"/><path fill="#FBBC05" d="M11.69 28.18c-.44-1.32-.69-2.73-.69-4.18s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z"/><path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"/></svg>
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-semibold text-white">Google Pay · Apple Pay</div>
                        <div className="text-[11px] text-zinc-400">Visa · Mastercard · 123 UAH</div>
                      </div>
                    </div>
                    {auditLoading === "monobank" ? <Loader2 className="w-4 h-4 animate-spin text-violet-300" /> : <ChevronRight className="w-4 h-4 text-zinc-500" />}
                  </button>

                  <button
                    type="button"
                    disabled={!!auditLoading}
                    onClick={() => startSingleAudit("crypto")}
                    className="w-full flex items-center justify-between gap-3 p-4 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-blue-400/30 transition-colors disabled:opacity-50"
                    data-testid="button-audit-crypto"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                        <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
                          <circle cx="24" cy="24" r="20" stroke="#2AABEE" strokeWidth="2" fill="none" opacity="0.3"/>
                          <path d="M15.5 24.5L21 30L33 18" stroke="#2AABEE" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-semibold text-white">Crypto Pay</div>
                        <div className="text-[11px] text-zinc-400">USDT · BTC · TON · $3</div>
                      </div>
                    </div>
                    {auditLoading === "crypto" ? <Loader2 className="w-4 h-4 animate-spin text-blue-300" /> : <ChevronRight className="w-4 h-4 text-zinc-500" />}
                  </button>
                </div>

                <button
                  type="button"
                  disabled={!!auditLoading}
                  onClick={() => setAuditOpen(false)}
                  className="mt-5 w-full text-[12px] text-zinc-500 hover:text-zinc-300 transition-colors disabled:opacity-50"
                  data-testid="button-audit-cancel"
                >
                  {lang === "uk" ? "Скасувати" : lang === "ru" ? "Отмена" : lang === "es" ? "Cancelar" : lang === "de" ? "Abbrechen" : "Cancel"}
                </button>
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
  const { t, lang } = useTranslation();
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
      <PageLayout title={lang === "uk" ? "Тарифи" : lang === "ru" ? "Тарифы" : lang === "es" ? "Precios" : lang === "de" ? "Preise" : "Pricing"}>
        <PricingContent />
      </PageLayout>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-background/95 overflow-x-hidden max-w-[100vw]">
      <Seo
        title="Pricing — FREE / PRO $9 / ENTERPRISE $30 / GROUPS $45"
        description="Transparent pricing for DARKSHARE OSINT platform. Free tier available. PRO from $9/mo unlocks unlimited scans, monitoring, PDF reports & full REST API. Pay with card, Apple Pay, Google Pay, Telegram Stars, or crypto."
        keywords="OSINT pricing, threat intelligence pricing, security API pricing, DARKSHARE plans"
        path="/pricing"
        type="product"
      />
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
