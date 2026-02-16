import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  Shield, 
  Globe, 
  Wallet, 
  Mail, 
  Phone, 
  Link2, 
  Building,
  Search,
  AlertTriangle,
  Clock,
  FileText,
  ChevronRight,
  Loader2,
  Download,
  Eye,
  User,
  CreditCard,
  Zap,
  Crown,
  AlertCircle,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  Scan,
  Database,
  Radio,
  TrendingUp,
  CheckCircle2,
  XCircle,
  BarChart3,
  Copy,
  Check,
  MapPin,
  Server,
  Ban,
  Fingerprint,
  Shuffle,
  Coins,
  AtSign,
  Trash2,
  Lock,
  Signal,
  Hash,
  FileCheck,
  Globe2,
  Type,
  ExternalLink,
  LinkIcon,
  Bug,
  Info,
  Bot,
  Key,
  Users,
  MessageSquare,
  Sparkles,
  RotateCcw,
  PlayCircle,
  Layers,
  Keyboard,
  HelpCircle,
  List,
  Star,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useKeyboardShortcuts, shortcuts } from "@/hooks/useKeyboardShortcuts";
import { apiRequest } from "@/lib/queryClient";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { PageLayout } from "@/components/PageLayout";
import { useTranslation } from "@/lib/i18n";
import { useStats } from "@/hooks/use-stats";
import { OnboardingTour, useOnboardingTour } from "@/components/OnboardingTour";

interface AIInsights {
  summary: string;
  recommendations: string[];
  threatLevel: string;
  verdict: string;
}

interface CheckResult {
  type: string;
  target: string;
  riskScore: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  summary: string;
  details: Record<string, any>;
  findings: string[];
  sources: string[];
  timestamp: string;
  aiInsights?: AIInsights;
}

const checkTypeStyles = [
  { id: "ip", icon: Globe, gradient: "from-blue-500/20 via-cyan-500/10 to-transparent", iconColor: "text-blue-400", borderColor: "border-blue-500/30 hover:border-blue-400/50", glowColor: "shadow-blue-500/20", btn3d: "btn-3d-blue", serviceIcons: [MapPin, Server, ShieldAlert, Ban] },
  { id: "wallet", icon: Wallet, gradient: "from-orange-500/20 via-yellow-500/10 to-transparent", iconColor: "text-orange-400", borderColor: "border-orange-500/30 hover:border-orange-400/50", glowColor: "shadow-orange-500/20", btn3d: "btn-3d-orange", serviceIcons: [Fingerprint, Shuffle, Coins, Hash] },
  { id: "email", icon: Mail, gradient: "from-purple-500/20 via-pink-500/10 to-transparent", iconColor: "text-purple-400", borderColor: "border-purple-500/30 hover:border-purple-400/50", glowColor: "shadow-purple-500/20", btn3d: "btn-3d-purple", serviceIcons: [AtSign, Trash2, Lock, Search] },
  { id: "phone", icon: Phone, gradient: "from-green-500/20 via-emerald-500/10 to-transparent", iconColor: "text-green-400", borderColor: "border-green-500/30 hover:border-green-400/50", glowColor: "shadow-green-500/20", btn3d: "btn-3d-green", serviceIcons: [Globe2, Signal, FileCheck, Phone] },
  { id: "domain", icon: Building, gradient: "from-indigo-500/20 via-violet-500/10 to-transparent", iconColor: "text-indigo-400", borderColor: "border-indigo-500/30 hover:border-indigo-400/50", glowColor: "shadow-indigo-500/20", btn3d: "btn-3d-indigo", serviceIcons: [Globe, Type, AlertTriangle, ShieldCheck] },
  { id: "url", icon: Link2, gradient: "from-red-500/20 via-rose-500/10 to-transparent", iconColor: "text-red-400", borderColor: "border-red-500/30 hover:border-red-400/50", glowColor: "shadow-red-500/20", btn3d: "btn-3d-red", serviceIcons: [LinkIcon, ExternalLink, Bug, ChevronRight] },
  { id: "bot", icon: Bot, gradient: "from-cyan-500/20 via-teal-500/10 to-transparent", iconColor: "text-cyan-400", borderColor: "border-cyan-500/30 hover:border-cyan-400/50", glowColor: "shadow-cyan-500/20", btn3d: "btn-3d-cyan", serviceIcons: [Key, Bot, Users, Sparkles] },
  { id: "cve", icon: Bug, gradient: "from-rose-500/20 via-red-500/10 to-transparent", iconColor: "text-rose-400", borderColor: "border-rose-500/30 hover:border-rose-400/50", glowColor: "shadow-rose-500/20", btn3d: "btn-3d-rose", serviceIcons: [Database, AlertCircle, ShieldAlert, FileText] },
  { id: "hash", icon: Hash, gradient: "from-slate-500/20 via-zinc-500/10 to-transparent", iconColor: "text-slate-400", borderColor: "border-slate-500/30 hover:border-slate-400/50", glowColor: "shadow-slate-500/20", btn3d: "btn-3d-slate", serviceIcons: [Bug, Link2, Shield, FileCheck] },
  { id: "username", icon: User, gradient: "from-amber-500/20 via-yellow-500/10 to-transparent", iconColor: "text-amber-400", borderColor: "border-amber-500/30 hover:border-amber-400/50", glowColor: "shadow-amber-500/20", btn3d: "btn-3d-amber", serviceIcons: [Users, Globe, MessageSquare, Lock] },
  { id: "card", icon: CreditCard, gradient: "from-emerald-500/20 via-teal-500/10 to-transparent", iconColor: "text-emerald-400", borderColor: "border-emerald-500/30 hover:border-emerald-400/50", glowColor: "shadow-emerald-500/20", btn3d: "btn-3d-emerald", serviceIcons: [CreditCard, Building, Wallet, Globe] },
];

const serviceKeyMap: Record<string, string[][]> = {
  ip: [["geolocation", "geolocationDesc"], ["ispInfo", "ispInfoDesc"], ["proxyVpn", "proxyVpnDesc"], ["blacklists", "blacklistsDesc"]],
  wallet: [["patternAnalysis", "patternAnalysisDesc"], ["mixerDetection", "mixerDetectionDesc"], ["multiChain", "multiChainDesc"], ["exchangeUid", "exchangeUidDesc"]],
  email: [["domainCheck", "domainCheckDesc"], ["disposable", "disposableDesc"], ["breachCheck", "breachCheckDesc"], ["osintScan", "osintScanDesc"]],
  phone: [["countryCode", "countryCodeDesc"], ["carrierId", "carrierIdDesc"], ["formatCheck", "formatCheckDesc"], ["typeDetection", "typeDetectionDesc"]],
  domain: [["tldAnalysis", "tldAnalysisDesc"], ["typosquatting", "typosquattingDesc"], ["patterns", "patternsDesc"], ["reputation", "reputationDesc"]],
  url: [["protocol", "protocolDesc"], ["shorteners", "shortenersDesc"], ["phishing", "phishingDesc"], ["redirectScan", "redirectScanDesc"]],
  bot: [["tokenVerify", "tokenVerifyDesc"], ["botInfo", "botInfoDesc"], ["permissions", "permissionsDesc"], ["capabilities", "capabilitiesDesc"]],
  cve: [["nvdLookup", "nvdLookupDesc"], ["cvssScore", "cvssScoreDesc"], ["cisaKev", "cisaKevDesc"], ["recommendations", "recommendationsDesc"]],
  hash: [["malwareBazaar", "malwareBazaarDesc"], ["urlhaus", "urlhausDesc"], ["virusTotal", "virusTotalDesc"], ["signatureMatch", "signatureMatchDesc"]],
  username: [["githubProfile", "githubProfileDesc"], ["socialMedia", "socialMediaDesc"], ["forums", "forumsDesc"], ["dataBreaches", "dataBreachesDesc"]],
  card: [["binLookup", "binLookupDesc"], ["bankInfo", "bankInfoDesc"], ["cardType", "cardTypeDesc"], ["country", "countryDesc"]],
};


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
      icon: ShieldAlert, 
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

function RiskBadge({ level, score }: { level: string; score: number }) {
  const { t } = useTranslation();
  const config = {
    critical: {
      className: "bg-gradient-to-r from-red-600 to-rose-500 text-white border-red-400/50",
      glow: "shadow-[0_0_20px_rgba(239,68,68,0.5)] animate-pulse",
      icon: AlertCircle,
      labelKey: "dashboard.riskLevels.critical"
    },
    high: {
      className: "bg-gradient-to-r from-orange-600 to-amber-500 text-white border-orange-400/50",
      glow: "shadow-[0_0_15px_rgba(249,115,22,0.4)]",
      icon: AlertTriangle,
      labelKey: "dashboard.riskLevels.high"
    },
    medium: {
      className: "bg-gradient-to-r from-yellow-600 to-amber-400 text-black border-yellow-400/50",
      glow: "shadow-[0_0_12px_rgba(234,179,8,0.3)]",
      icon: Clock,
      labelKey: "dashboard.riskLevels.medium"
    },
    low: {
      className: "bg-gradient-to-r from-green-600 to-emerald-500 text-white border-green-400/50",
      glow: "shadow-[0_0_12px_rgba(34,197,94,0.3)]",
      icon: ShieldCheck,
      labelKey: "dashboard.riskLevels.low"
    },
  };
  
  const { className, glow, icon: Icon, labelKey } = config[level as keyof typeof config] || config.low;
  
  return (
    <Badge className={`${className} ${glow} border px-3 py-1 text-sm font-bold tracking-wide`}>
      <Icon className="w-4 h-4 mr-1.5" />
      {t(labelKey).toUpperCase()} — {score}/100
    </Badge>
  );
}

const TRC20_ADDRESS = "TRYbty4Ew9knf61brdrixeY5M34mQTt3zY";

interface BulkCheckResult extends CheckResult {
  error?: string;
}

export default function Dashboard() {
  const [selectedType, setSelectedType] = useState("ip");
  const [inputValue, setInputValue] = useState("");
  const [result, setResult] = useState<CheckResult | null>(null);
  const [showSubscription, setShowSubscription] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [copied, setCopied] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkInput, setBulkInput] = useState("");
  const [bulkResults, setBulkResults] = useState<BulkCheckResult[]>([]);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [selectedBulkResult, setSelectedBulkResult] = useState<BulkCheckResult | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [inputShake, setInputShake] = useState(false);
  const [copiedResult, setCopiedResult] = useState(false);
  const [breachEmail, setBreachEmail] = useState("");
  const [breachResult, setBreachResult] = useState<any>(null);
  const [breachLoading, setBreachLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const bulkTextareaRef = useRef<HTMLTextAreaElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const { toast, dismiss } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [location] = useLocation();
  const { t, lang } = useTranslation();
  const { data: platformStats } = useStats();
  const { showTour, completeTour } = useOnboardingTour();

  const checkTypes = useMemo(() => checkTypeStyles.map(style => ({
    ...style,
    label: t(`dashboard.checkLabels.${style.id}`),
    placeholder: t(`dashboard.checkPlaceholders.${style.id}`),
    description: t(`dashboard.checkDescriptions.${style.id}`),
    shortDescription: t(`dashboard.checkShortDescs.${style.id}`),
    services: (serviceKeyMap[style.id] || []).map((keys, idx) => ({
      name: t(`dashboard.services.${style.id}.${keys[0]}`),
      icon: style.serviceIcons[idx],
      desc: t(`dashboard.services.${style.id}.${keys[1]}`),
    })),
  })), [t]);


  const paymentMutation = useMutation({
    mutationFn: async ({ tier, txHash }: { tier: string; txHash?: string }) => {
      const res = await apiRequest("POST", "/api/payment-request", { tier, txHash: txHash || undefined });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: t('dashboard.requestSent'),
        description: t('dashboard.requestSentDesc').replace('{id}', data.paymentId),
      });
      setTxHash("");
      setShowSubscription(false);
    },
    onError: (error: any) => {
      toast({
        title: t('common.error'),
        description: error.message || t('common.error'),
        variant: "destructive",
      });
    },
  });

  const handlePaymentRequest = (tier: "pro" | "enterprise") => {
    paymentMutation.mutate({ tier, txHash: txHash.trim() || undefined });
  };

  useEffect(() => {
    dismiss();
  }, [location]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const recheckType = params.get("type");
    const recheckTarget = params.get("target");
    const isRecheck = params.get("recheck");
    
    if (recheckType && recheckTarget) {
      setSelectedType(recheckType);
      setInputValue(recheckTarget);
      
      if (isRecheck === "1") {
        window.history.replaceState({}, "", "/dashboard");
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }, 300);
      }
    }
  }, []);

  const copyAddress = async () => {
    await navigator.clipboard.writeText(TRC20_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const checkMutation = useMutation({
    mutationFn: async ({ type, value }: { type: string; value: string }) => {
      const res = await apiRequest("POST", "/api/check", { type, value });
      return res.json();
    },
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    },
    onError: (error: any) => {
      toast({
        title: t('common.error'),
        description: error.message || t('dashboard.checkError'),
        variant: "destructive",
      });
    },
  });

  const bulkCheckMutation = useMutation({
    mutationFn: async (checks: Array<{ type: string; value: string }>) => {
      setBulkProgress(0);
      setBulkResults([]);
      
      const res = await apiRequest("POST", "/api/bulk-check", { checks });
      const data = await res.json();
      
      setBulkProgress(100);
      setBulkResults(data.results || []);
      
      return data.results || [];
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      toast({
        title: t('dashboard.bulkComplete'),
        description: t('dashboard.bulkChecked').replace('{count}', String(data.length)),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('common.error'),
        description: error.message || t('dashboard.checkError'),
        variant: "destructive",
      });
    },
  });

  interface ReportItem {
    id: number;
    type: string;
    target: string;
    riskLevel: string;
    riskScore: number;
    createdAt: string;
  }

  const { data: recentReports = [], isLoading: reportsLoading } = useQuery<ReportItem[]>({
    queryKey: ["/api/reports"],
  });

  const handleRepeatCheck = (report: ReportItem) => {
    const checkType = checkTypes.find(t => t.id === report.type.toLowerCase());
    if (checkType) {
      setSelectedType(checkType.id);
      setInputValue(report.target);
      setResult(null);
      setTimeout(() => {
        checkMutation.mutate({ type: checkType.id, value: report.target });
      }, 100);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('time.justNow');
    if (diffMins < 60) return `${diffMins} ${t('time.minutesAgo')}`;
    if (diffHours < 24) return `${diffHours} ${t('time.hoursAgo')}`;
    return `${diffDays} ${t('time.daysAgo')}`;
  };

  const getRiskConfig = (level: string) => {
    switch (level.toLowerCase()) {
      case "critical":
        return { icon: AlertCircle, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" };
      case "high":
        return { icon: AlertTriangle, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30" };
      case "medium":
        return { icon: Clock, color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30" };
      default:
        return { icon: ShieldCheck, color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/30" };
    }
  };

  const triggerShake = () => {
    setInputShake(true);
    setTimeout(() => setInputShake(false), 500);
  };

  const copyResultsToClipboard = async () => {
    if (!result) return;
    const textToCopy = `DARKSHARE Security Report
Target: ${result.target}
Type: ${result.type}
Risk Level: ${result.riskLevel.toUpperCase()}
Risk Score: ${result.riskScore}/100

Summary: ${result.summary}

Findings:
${result.findings.map(f => `• ${f}`).join('\n')}

Sources: ${result.sources.join(', ')}`;
    
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedResult(true);
      toast({
        title: t('dashboard.resultCopied'),
        description: t('dashboard.resultCopiedDesc'),
      });
      setTimeout(() => setCopiedResult(false), 2000);
    } catch {
      toast({
        title: t('common.error'),
        description: t('dashboard.copyFailed'),
        variant: "destructive",
      });
    }
  };

  const handleCheck = () => {
    if (user && (user.requestsLeft ?? 0) <= 0) {
      setShowSubscription(true);
      toast({
        title: t('dashboard.limitReachedTitle'),
        description: t('dashboard.limitReachedDesc'),
        variant: "destructive",
      });
      return;
    }
    
    const value = inputValue.trim() || inputRef.current?.value?.trim() || "";
    if (!value) {
      triggerShake();
      toast({
        title: t('common.error'),
        description: t('dashboard.enterValueError'),
        variant: "destructive",
      });
      return;
    }
    checkMutation.mutate({ type: selectedType, value });
  };

  const handleBulkCheck = () => {
    if (user && (user.requestsLeft ?? 0) <= 0) {
      setShowSubscription(true);
      toast({
        title: t('dashboard.limitReachedTitle'),
        description: t('dashboard.limitReachedDesc'),
        variant: "destructive",
      });
      return;
    }
    
    const values = bulkInput
      .split('\n')
      .map(v => v.trim())
      .filter(v => v.length > 0);
    
    if (values.length === 0) {
      toast({
        title: t('common.error'),
        description: t('dashboard.enterValueError'),
        variant: "destructive",
      });
      return;
    }

    if (values.length > 20) {
      toast({
        title: t('common.error'),
        description: t('dashboard.bulkMax'),
        variant: "destructive",
      });
      return;
    }
    
    const checks = values.map(value => ({ type: selectedType, value }));
    setResult(null);
    setSelectedBulkResult(null);
    bulkCheckMutation.mutate(checks);
  };

  useKeyboardShortcuts({
    inputRef,
    bulkTextareaRef,
    bulkMode,
    onSubmit: handleCheck,
    onBulkSubmit: handleBulkCheck,
    onSelectType: (index) => {
      if (index >= 0 && index < checkTypes.length) {
        setSelectedType(checkTypes[index].id);
      }
    },
    onClearResults: () => {
      setResult(null);
      setBulkResults([]);
      setSelectedBulkResult(null);
    },
    onShowHelp: () => setShowShortcuts(true),
    checkTypesCount: checkTypes.length,
    disabled: showSubscription || showProfile || showShortcuts,
  });

  const checkBreach = async () => {
    if (!breachEmail) return;
    setBreachLoading(true);
    try {
      const res = await apiRequest("POST", "/api/breach-check", { email: breachEmail });
      const data = await res.json();
      setBreachResult(data);
    } catch (error) {
      toast({ title: t('common.error'), variant: "destructive" });
    } finally {
      setBreachLoading(false);
    }
  };

  const breachLabels = {
    title: lang === "uk" ? "Монітор витоків" : lang === "ru" ? "Монитор утечек" : lang === "es" ? "Monitor de filtraciones" : lang === "de" ? "Datenleck-Monitor" : "Breach Monitor",
    description: lang === "uk" ? "Перевірте чи ваш email був скомпрометований" : lang === "ru" ? "Проверьте был ли ваш email скомпрометирован" : lang === "es" ? "Verifique si su email fue comprometido" : lang === "de" ? "Prüfen Sie ob Ihre E-Mail kompromittiert wurde" : "Check if your email has been compromised",
    placeholder: lang === "uk" ? "Введіть email..." : lang === "ru" ? "Введите email..." : lang === "es" ? "Ingrese email..." : lang === "de" ? "E-Mail eingeben..." : "Enter email...",
    check: lang === "uk" ? "Перевірити" : lang === "ru" ? "Проверить" : lang === "es" ? "Verificar" : lang === "de" ? "Prüfen" : "Check",
    exposed: lang === "uk" ? "Скомпрометовано" : lang === "ru" ? "Скомпрометирован" : lang === "es" ? "Comprometido" : lang === "de" ? "Kompromittiert" : "Exposed",
    clean: lang === "uk" ? "Безпечно" : lang === "ru" ? "Безопасно" : lang === "es" ? "Seguro" : lang === "de" ? "Sicher" : "Clean",
    breachesFound: lang === "uk" ? "Витоків знайдено" : lang === "ru" ? "Утечек найдено" : lang === "es" ? "Filtraciones encontradas" : lang === "de" ? "Datenlecks gefunden" : "Breaches found",
    noBreaches: lang === "uk" ? "Витоків не знайдено" : lang === "ru" ? "Утечек не найдено" : lang === "es" ? "Sin filtraciones" : lang === "de" ? "Keine Datenlecks" : "No breaches found",
    date: lang === "uk" ? "Дата" : lang === "ru" ? "Дата" : lang === "es" ? "Fecha" : lang === "de" ? "Datum" : "Date",
    dataTypes: lang === "uk" ? "Типи даних" : lang === "ru" ? "Типы данных" : lang === "es" ? "Tipos de datos" : lang === "de" ? "Datentypen" : "Data types",
  };

  const favLabels = {
    title: lang === "uk" ? "Обрані" : lang === "ru" ? "Избранное" : lang === "es" ? "Favoritos" : lang === "de" ? "Favoriten" : "Favorites",
    addToFav: lang === "uk" ? "Додати до обраних" : lang === "ru" ? "Добавить в избранное" : lang === "es" ? "Agregar a favoritos" : lang === "de" ? "Zu Favoriten" : "Add to favorites",
    remove: lang === "uk" ? "Видалити" : lang === "ru" ? "Удалить" : lang === "es" ? "Eliminar" : lang === "de" ? "Entfernen" : "Remove",
    added: lang === "uk" ? "Додано до обраних" : lang === "ru" ? "Добавлено в избранное" : lang === "es" ? "Agregado a favoritos" : lang === "de" ? "Zu Favoriten hinzugefügt" : "Added to favorites",
    removed: lang === "uk" ? "Видалено з обраних" : lang === "ru" ? "Удалено из избранного" : lang === "es" ? "Eliminado de favoritos" : lang === "de" ? "Aus Favoriten entfernt" : "Removed from favorites",
  };

  const { data: userFavorites = [], isLoading: favoritesLoading } = useQuery<Array<{ id: number; checkType: string; value: string; label: string | null; createdAt: string }>>({
    queryKey: ["/api/favorites"],
  });

  const addFavoriteMutation = useMutation({
    mutationFn: async (data: { checkType: string; value: string; label?: string }) => {
      const res = await apiRequest("POST", "/api/favorites", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      toast({ title: favLabels.added });
    },
  });

  const deleteFavoriteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/favorites/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      toast({ title: favLabels.removed });
    },
  });

  const isCurrentTargetFavorited = result && userFavorites.some(
    f => f.checkType === result.type && f.value === result.target
  );

  const favTypeColorMap: Record<string, string> = {
    ip: "bg-blue-500/20 border-blue-500/30 text-blue-400",
    domain: "bg-purple-500/20 border-purple-500/30 text-purple-400",
    wallet: "bg-amber-500/20 border-amber-500/30 text-amber-400",
    email: "bg-green-500/20 border-green-500/30 text-green-400",
    url: "bg-cyan-500/20 border-cyan-500/30 text-cyan-400",
    phone: "bg-pink-500/20 border-pink-500/30 text-pink-400",
    hash: "bg-red-500/20 border-red-500/30 text-red-400",
    cve: "bg-orange-500/20 border-orange-500/30 text-orange-400",
    username: "bg-indigo-500/20 border-indigo-500/30 text-indigo-400",
    bot: "bg-cyan-500/20 border-cyan-500/30 text-cyan-400",
    card: "bg-emerald-500/20 border-emerald-500/30 text-emerald-400",
  };

  const selectedCheck = checkTypes.find(c => c.id === selectedType);

  return (
    <PageLayout>
      <AnimatePresence>
        {showTour && <OnboardingTour onComplete={completeTour} />}
      </AnimatePresence>
      <div className="flex-1 flex flex-col min-h-screen max-w-full overflow-hidden">
        <div className="flex-1 p-3 lg:p-8 overflow-auto max-w-full">
          <div className="max-w-6xl mx-auto space-y-6 lg:space-y-8">
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
                    <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-cyan-500/10 border border-primary/20">
                      <Scan className="w-7 h-7 text-primary" />
                    </div>
                    <span className="bg-gradient-to-r from-white via-white to-primary/80 bg-clip-text text-transparent">Security Scanner</span>
                  </h1>
                  <p className="text-muted-foreground mt-2 ml-14">{t('dashboard.selectTypeAndEnter')}</p>
                </div>
                <div className="flex items-center gap-4">
                  <motion.div 
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-green-500/10 to-transparent border border-green-500/20 backdrop-blur-sm"
                    animate={{ 
                      boxShadow: ["0 0 15px rgba(34,197,94,0.1)", "0 0 25px rgba(34,197,94,0.2)", "0 0 15px rgba(34,197,94,0.1)"]
                    }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Radio className="w-4 h-4 text-green-400 animate-pulse" />
                    <span className="text-sm font-medium text-green-400">{t('dashboard.systemActive')}</span>
                  </motion.div>
                </div>
              </motion.div>
            </div>

            {/* Quick Actions Widget - hidden on mobile */}
            {recentReports.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="hidden md:block p-4 lg:p-6 rounded-2xl bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-transparent border border-cyan-500/20 backdrop-blur-xl shadow-[0_0_30px_rgba(6,182,212,0.1)]"
              >
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl flex items-center justify-center bg-cyan-500/20 border border-cyan-500/30">
                        <PlayCircle className="w-4 h-4 lg:w-5 lg:h-5 text-cyan-400" />
                      </div>
                      <div>
                        <h3 className="text-sm lg:text-base font-display font-semibold text-white">{t('dashboard.quickActions')}</h3>
                        <p className="text-[10px] lg:text-xs text-muted-foreground">{t('dashboard.repeatLastChecks')}</p>
                      </div>
                    </div>
                    <Link href="/history">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-[10px] h-7 px-2 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                        data-testid="button-view-all-history"
                      >
                        {t('dashboard.all')}
                        <ChevronRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </Link>
                  </div>
                
                {reportsLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                    <span className="text-xs text-muted-foreground ml-2">{t('common.loading')}</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 lg:gap-3">
                    {recentReports.slice(0, 5).map((report, idx) => {
                      const riskConfig = getRiskConfig(report.riskLevel);
                      const RiskIcon = riskConfig.icon;
                      const checkType = checkTypes.find(t => t.id === report.type.toLowerCase());
                      const TypeIcon = checkType?.icon || Globe;
                      
                      return (
                        <motion.div
                          key={report.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.05, duration: 0.3 }}
                          className={`relative p-3 lg:p-4 rounded-xl ${riskConfig.bg} ${riskConfig.border} border backdrop-blur-sm group hover:border-white/30 transition-all duration-300`}
                        >
                          <div className="flex items-start gap-2 mb-2">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${checkType?.iconColor ? checkType.iconColor.replace('text-', 'bg-').replace('400', '500/20') : 'bg-white/10'}`}>
                              <TypeIcon className={`w-3.5 h-3.5 ${checkType?.iconColor || 'text-white'}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] lg:text-xs font-medium uppercase tracking-wide text-muted-foreground">{checkType?.label || report.type}</p>
                              <p className="text-xs lg:text-sm font-mono truncate text-white/90" title={report.target}>
                                {report.target.length > 15 ? `${report.target.slice(0, 12)}...` : report.target}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1.5">
                              <RiskIcon className={`w-3 h-3 ${riskConfig.color}`} />
                              <span className={`text-[9px] lg:text-[10px] font-medium uppercase ${riskConfig.color}`}>
                                {report.riskLevel}
                              </span>
                              <span className="text-[9px] lg:text-[10px] text-muted-foreground">·</span>
                              <span className="text-[9px] lg:text-[10px] text-muted-foreground">
                                {formatTimeAgo(report.createdAt)}
                              </span>
                            </div>
                          </div>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRepeatCheck(report)}
                            disabled={checkMutation.isPending}
                            className="absolute top-2 right-2 w-7 h-7 lg:w-8 lg:h-8 p-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity bg-white/10 hover:bg-white/20 border border-white/10"
                            data-testid={`button-repeat-check-${report.id}`}
                          >
                            {checkMutation.isPending ? (
                              <Loader2 className="w-3 h-3 lg:w-3.5 lg:h-3.5 animate-spin" />
                            ) : (
                              <RotateCcw className="w-3 h-3 lg:w-3.5 lg:h-3.5" />
                            )}
                          </Button>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            <div className="space-y-4 lg:space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-2.5 lg:gap-3">
                {checkTypes.map((type, idx) => {
                  const isSelected = selectedType === type.id;
                  return (
                    <motion.button
                      key={type.id}
                      onClick={() => {
                        setSelectedType(type.id);
                        setInputValue("");
                        setResult(null);
                      }}
                      className={`relative flex flex-col items-center justify-center gap-2 sm:gap-2.5 lg:gap-3 p-3 sm:p-4 lg:p-5 rounded-xl transition-all duration-300 touch-manipulation min-h-[80px] sm:min-h-[90px] lg:min-h-[110px] bg-[#141418] border ${
                        isSelected ? 'border-primary/50 ring-1 ring-primary/30' : 'border-white/10 hover:border-white/20'
                      }`}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.04, duration: 0.3, type: "spring", stiffness: 300 }}
                      data-testid={`button-check-type-${type.id}`}
                    >
                      <div className={`w-9 h-9 sm:w-10 sm:h-10 lg:w-11 lg:h-11 rounded-lg flex items-center justify-center bg-white/5 border border-white/10 transition-all duration-300 ${
                        isSelected ? 'border-primary/30 text-primary' : 'text-muted-foreground'
                      }`}>
                        <type.icon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-5 lg:h-5" />
                      </div>
                      <span className={`text-[10px] sm:text-[11px] lg:text-xs font-medium text-center leading-tight line-clamp-2 transition-colors duration-300 ${
                        isSelected ? 'text-primary' : 'text-muted-foreground'
                      }`}>
                        {type.label}
                      </span>
                      {isSelected && (
                        <motion.div
                          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 lg:w-12 h-0.5 bg-primary/60 rounded-full"
                          layoutId="activeIndicator"
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}
                    </motion.button>
                  );
                })}
              </div>

              <motion.div
                className="relative"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className={`p-3.5 lg:p-8 rounded-2xl border ${selectedCheck?.borderColor} bg-gradient-to-br ${selectedCheck?.gradient} backdrop-blur-xl shadow-[0_0_40px_rgba(0,0,0,0.2)]`}>
                  <AnimatePresence mode="wait">
                    <motion.div 
                      key={selectedType}
                      className="flex items-center gap-2.5 mb-3 lg:mb-4"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.2 }}
                    >
                      {selectedCheck && (
                        <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded-lg lg:rounded-xl flex items-center justify-center bg-white/10 backdrop-blur-sm`}>
                          <selectedCheck.icon className={`w-4 h-4 lg:w-5 lg:h-5 ${selectedCheck.iconColor}`} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display font-semibold text-sm lg:text-lg truncate">{selectedCheck?.label}</h3>
                        <p className="text-[10px] lg:text-sm text-muted-foreground">{selectedCheck?.shortDescription}</p>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                  
                  {selectedCheck?.services && (
                    <motion.div 
                      key={`services-${selectedType}`}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      transition={{ duration: 0.3 }}
                      className="mb-3 lg:mb-4"
                    >
                      <div className="p-3 lg:p-4 rounded-xl bg-black/40 border border-white/5 backdrop-blur-sm">
                        <div className="flex items-center gap-2 mb-2.5">
                          <Info className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-[10px] lg:text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('dashboard.whatIsAnalyzed')}</span>
                        </div>
                        <p className="text-[10px] lg:text-xs text-muted-foreground/80 mb-3 leading-relaxed">
                          {selectedCheck.description}
                        </p>
                        <div className="grid grid-cols-2 gap-1.5 lg:gap-2">
                          {selectedCheck.services.map((service, idx) => (
                            <motion.div
                              key={service.name}
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.05, duration: 0.2 }}
                              className="flex items-start gap-2 p-2 lg:p-2.5 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
                            >
                              <div className={`w-6 h-6 lg:w-7 lg:h-7 rounded-md flex items-center justify-center flex-shrink-0 ${selectedCheck.iconColor.replace('text-', 'bg-').replace('400', '500/20')}`}>
                                <service.icon className={`w-3 h-3 lg:w-3.5 lg:h-3.5 ${selectedCheck.iconColor}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] lg:text-xs font-medium truncate">{service.name}</p>
                                <p className="text-[9px] lg:text-[10px] text-muted-foreground/70 leading-tight">{service.desc}</p>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                  
                  <div className="flex flex-col gap-2.5 lg:gap-3">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Bulk Mode</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={bulkMode}
                          onCheckedChange={(checked) => {
                            setBulkMode(checked);
                            setResult(null);
                            setBulkResults([]);
                            setSelectedBulkResult(null);
                          }}
                          data-testid="switch-bulk-mode"
                        />
                        <span className="text-xs text-muted-foreground">{bulkMode ? t('dashboard.enabled') : t('dashboard.disabled')}</span>
                      </div>
                    </div>
                    
                    {bulkMode ? (
                      <div className="relative w-full">
                        <Textarea
                          ref={bulkTextareaRef}
                          value={bulkInput}
                          onChange={(e) => setBulkInput(e.target.value)}
                          placeholder={`${t('dashboard.bulkPlaceholder')}\n${selectedCheck?.placeholder || ''}\n${selectedCheck?.placeholder || ''}`}
                          className="min-h-[120px] lg:min-h-[160px] text-sm lg:text-base font-mono bg-black/60 border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/30 rounded-xl placeholder:text-muted-foreground/50 w-full resize-none"
                          data-testid="textarea-bulk-input"
                        />
                        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                          <span>{bulkInput.split('\n').filter(v => v.trim()).length} / 20 {t('dashboard.values')}</span>
                        </div>
                      </div>
                    ) : (
                      <div className={`relative w-full ${inputShake ? 'animate-shake' : ''}`}>
                        <Terminal className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 lg:w-5 lg:h-5 text-muted-foreground pointer-events-none" />
                        <Input
                          ref={inputRef}
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          placeholder={selectedCheck?.placeholder}
                          className="h-11 lg:h-14 pl-9 lg:pl-12 pr-3 lg:pr-4 text-sm lg:text-lg font-mono bg-black/60 border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/30 rounded-xl placeholder:text-muted-foreground/50 w-full max-w-full touch-manipulation"
                          onKeyDown={(e) => e.key === "Enter" && handleCheck()}
                          data-testid="input-check-value"
                        />
                      </div>
                    )}

                    {bulkCheckMutation.isPending && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{t('dashboard.checkProgress')}</span>
                          <span>{bulkProgress}%</span>
                        </div>
                        <Progress value={bulkProgress} className="h-2" />
                      </div>
                    )}

                    <motion.div whileTap={{ scale: 0.98 }}>
                      <Button 
                        onClick={bulkMode ? handleBulkCheck : handleCheck} 
                        disabled={checkMutation.isPending || bulkCheckMutation.isPending}
                        className={`h-11 lg:h-14 px-5 lg:px-8 text-sm lg:text-lg font-semibold bg-gradient-to-r from-primary via-emerald-400 to-cyan-400 hover:from-primary/90 hover:via-emerald-400/90 hover:to-cyan-400/90 active:from-primary/80 active:via-emerald-400/80 active:to-cyan-400/80 text-black rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.25)] active:shadow-[0_0_30px_rgba(34,197,94,0.4)] transition-all duration-300 w-full touch-manipulation ${!inputValue.trim() && !bulkMode ? 'animate-subtle-pulse' : ''}`}
                        data-testid="button-perform-check"
                      >
                        {(checkMutation.isPending || bulkCheckMutation.isPending) ? (
                          <div className="flex items-center gap-2">
                            <motion.div
                              className="relative w-5 h-5"
                              animate={{ rotate: 360 }}
                              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            >
                              <Scan className="w-5 h-5 absolute" />
                            </motion.div>
                            <motion.span
                              animate={{ opacity: [1, 0.5, 1] }}
                              transition={{ duration: 1.2, repeat: Infinity }}
                            >
                              {t('dashboard.analyzing')}
                            </motion.span>
                          </div>
                        ) : (
                          <>
                            {bulkMode ? (
                              <>
                                <Layers className="w-4 h-4 lg:w-5 lg:h-5 mr-2" />
                                {t('dashboard.bulkScan')}
                              </>
                            ) : (
                              <>
                                <Search className="w-4 h-4 lg:w-5 lg:h-5 mr-2" />
                                {t('dashboard.scan')}
                              </>
                            )}
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </div>

            <AnimatePresence mode="wait">
              {checkMutation.isPending && (
                <motion.div
                  ref={resultsRef}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="p-3.5 lg:p-8 rounded-2xl border border-primary/20 bg-gradient-to-br from-black/70 via-black/50 to-transparent backdrop-blur-2xl space-y-4 relative overflow-hidden"
                >
                  <div className="absolute inset-0 overflow-hidden">
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="relative">
                        <Skeleton className="w-10 h-10 lg:w-14 lg:h-14 rounded-xl skeleton-shimmer" />
                        <motion.div 
                          className="absolute inset-0 flex items-center justify-center"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        >
                          <Scan className="w-5 h-5 lg:w-6 lg:h-6 text-primary/60" />
                        </motion.div>
                      </div>
                      <div className="flex-1">
                        <Skeleton className="h-5 w-40 mb-2 skeleton-shimmer" />
                        <Skeleton className="h-3 w-24 skeleton-shimmer" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-4 text-xs text-primary/80">
                      <motion.div
                        className="w-2 h-2 rounded-full bg-primary"
                        animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      />
                      <motion.span
                        animate={{ opacity: [1, 0.6, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        {t('dashboard.scanInProgress')}
                      </motion.span>
                    </div>
                    <Skeleton className="h-16 w-full rounded-xl skeleton-shimmer" />
                    <div className="space-y-2 mt-4">
                      <Skeleton className="h-4 w-32 mb-3 skeleton-shimmer" />
                      <Skeleton className="h-12 w-full rounded-xl skeleton-shimmer" />
                      <Skeleton className="h-12 w-full rounded-xl skeleton-shimmer" />
                      <Skeleton className="h-12 w-3/4 rounded-xl skeleton-shimmer" />
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 mt-4">
                      <Skeleton className="h-16 rounded-lg skeleton-shimmer" />
                      <Skeleton className="h-16 rounded-lg skeleton-shimmer" />
                      <Skeleton className="h-16 rounded-lg skeleton-shimmer" />
                      <Skeleton className="h-16 rounded-lg skeleton-shimmer" />
                      <Skeleton className="h-16 rounded-lg skeleton-shimmer" />
                      <Skeleton className="h-16 rounded-lg skeleton-shimmer" />
                    </div>
                  </div>
                </motion.div>
              )}
              {result && !checkMutation.isPending && (
                <motion.div
                  ref={resultsRef}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="space-y-3 lg:space-y-6"
                >
                  <div className="p-3.5 lg:p-8 rounded-2xl border border-white/10 bg-gradient-to-br from-black/70 via-black/50 to-transparent backdrop-blur-2xl shadow-[0_0_40px_rgba(0,0,0,0.3)]">
                    <div className="flex flex-col gap-3 mb-4 lg:mb-6 pb-4 lg:pb-6 border-b border-white/10">
                      <div className="flex items-center gap-3">
                        <motion.div 
                          className={`w-10 h-10 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl flex items-center justify-center ${
                            result.riskLevel === 'critical' ? 'bg-red-500/20' :
                            result.riskLevel === 'high' ? 'bg-orange-500/20' :
                            result.riskLevel === 'medium' ? 'bg-yellow-500/20' :
                            'bg-green-500/20'
                          }`}
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.3, type: "spring" }}
                        >
                          {result.riskLevel === 'critical' || result.riskLevel === 'high' ? (
                            <AlertTriangle className={`w-5 h-5 lg:w-7 lg:h-7 ${result.riskLevel === 'critical' ? 'text-red-400' : 'text-orange-400'}`} />
                          ) : result.riskLevel === 'medium' ? (
                            <Clock className="w-5 h-5 lg:w-7 lg:h-7 text-yellow-400" />
                          ) : (
                            <ShieldCheck className="w-5 h-5 lg:w-7 lg:h-7 text-green-400" />
                          )}
                        </motion.div>
                        <div className="flex-1 min-w-0">
                          <h2 className="text-base lg:text-2xl font-display font-bold">{t('dashboard.results')}</h2>
                          <p className="text-[10px] lg:text-sm text-muted-foreground font-mono">{result.timestamp}</p>
                        </div>
                      </div>
                      <RiskBadge level={result.riskLevel} score={result.riskScore} />
                    </div>

                    <motion.div 
                      className="p-3 lg:p-4 rounded-xl bg-white/5 border border-white/10 mb-3 lg:mb-6"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1, duration: 0.3 }}
                    >
                      <div className="flex items-center gap-2 text-[10px] lg:text-xs text-muted-foreground mb-1.5 lg:mb-2">
                        <Database className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                        {t('dashboard.scan')}
                      </div>
                      <p className="font-mono text-xs lg:text-xl break-all text-primary leading-relaxed">{result.target}</p>
                    </motion.div>

                    <div className="mb-3 lg:mb-6">
                      <h4 className="text-xs lg:text-sm font-semibold mb-2.5 lg:mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-yellow-500" />
                        {t('dashboard.findings')} ({result.findings.length})
                      </h4>
                      <div className="space-y-1.5 lg:space-y-2 max-h-[200px] sm:max-h-[300px] lg:max-h-none overflow-y-auto pr-1">
                        {result.findings.map((finding, idx) => {
                          const isCritical = finding.includes("CRITICAL") || finding.includes("КРИТИЧНО");
                          const isWarning = finding.includes("WARNING") || finding.includes("УВАГА");
                          const isSafe = finding.includes("not found") || finding.includes("Clean") || finding.includes("Safe") || finding.includes("не виявлено") || finding.includes("Чиста") || finding.includes("Безпечн");
                          
                          return (
                            <motion.div 
                              key={idx}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.05, duration: 0.3 }}
                              className={`p-2.5 lg:p-4 rounded-xl text-[11px] lg:text-sm flex items-start gap-2 lg:gap-3 border ${
                                isCritical ? "bg-red-500/10 border-red-500/30 text-red-300" :
                                isWarning ? "bg-orange-500/10 border-orange-500/30 text-orange-300" :
                                isSafe ? "bg-green-500/10 border-green-500/30 text-green-300" :
                                "bg-yellow-500/10 border-yellow-500/30 text-yellow-300"
                              }`}
                            >
                              <ChevronRight className="w-3.5 h-3.5 lg:w-4 lg:h-4 mt-0.5 flex-shrink-0" />
                              <span className="leading-relaxed">{finding}</span>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>

                    {/* AI INSIGHTS SECTION */}
                    {result.aiInsights && (
                      <motion.div 
                        className="mb-3 lg:mb-6 p-3 lg:p-5 rounded-xl bg-gradient-to-br from-primary/10 via-cyan-500/5 to-transparent border border-primary/30"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.4 }}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles className="w-4 h-4 lg:w-5 lg:h-5 text-primary" />
                          <h4 className="text-xs lg:text-sm font-semibold">{t('dashboard.aiAnalysis')}</h4>
                          <Badge 
                            className={`text-[9px] lg:text-xs ml-auto ${
                              result.aiInsights.threatLevel === "CRITICAL" || result.aiInsights.threatLevel === "КРИТИЧНО" ? "bg-red-500/20 text-red-400 border-red-500/30" :
                              result.aiInsights.threatLevel === "DANGEROUS" || result.aiInsights.threatLevel === "НЕБЕЗПЕЧНО" ? "bg-orange-500/20 text-orange-400 border-orange-500/30" :
                              result.aiInsights.threatLevel === "WARNING" || result.aiInsights.threatLevel === "УВАГА" ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" :
                              "bg-green-500/20 text-green-400 border-green-500/30"
                            }`}
                          >
                            {result.aiInsights.threatLevel}
                          </Badge>
                        </div>
                        
                        <p className="text-[10px] lg:text-sm font-semibold text-primary mb-2">{result.aiInsights.verdict}</p>
                        <p className="text-[10px] lg:text-xs text-muted-foreground mb-3 leading-relaxed">{result.aiInsights.summary}</p>
                        
                        <div className="space-y-1.5">
                          <p className="text-[9px] lg:text-xs font-semibold text-white/70">{t('dashboard.services.cve.recommendations')}:</p>
                          {result.aiInsights.recommendations.slice(0, 3).map((rec, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-[9px] lg:text-xs text-muted-foreground">
                              <CheckCircle2 className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
                              <span>{rec}</span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    <div className="mb-3 lg:mb-6">
                      <h4 className="text-xs lg:text-sm font-semibold mb-2.5 lg:mb-4 flex items-center gap-2">
                        <Terminal className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-primary" />
                        {t('dashboard.technicalDetails') || 'Technical Details'}
                      </h4>
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-1.5 lg:gap-3">
                        {Object.entries(result.details).map(([key, value], idx) => (
                          <motion.div 
                            key={key}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.15 + idx * 0.03, duration: 0.3 }}
                            className="p-2.5 lg:p-4 rounded-lg lg:rounded-xl bg-white/5 border border-white/5 active:border-white/20 transition-all duration-300"
                          >
                            <p className="text-[9px] lg:text-xs text-muted-foreground capitalize mb-0.5 lg:mb-1 truncate">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </p>
                            <p className="font-mono text-[10px] lg:text-sm break-all leading-relaxed">
                              {typeof value === "boolean" ? (
                                <Badge variant={value ? "destructive" : "secondary"} className="text-[9px] lg:text-xs px-1.5">
                                  {value ? "Yes" : "No"}
                                </Badge>
                              ) : typeof value === "object" ? 
                                JSON.stringify(value) : 
                                String(value)}
                            </p>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2.5 lg:gap-4 pt-3 lg:pt-6 border-t border-white/10">
                      <div className="flex items-center gap-1.5 text-[9px] lg:text-xs text-muted-foreground">
                        <Database className="w-3 h-3 lg:w-4 lg:h-4 flex-shrink-0" />
                        <span className="truncate">{t('dashboard.sources')}: {result.sources.join(", ")}</span>
                      </div>
                      <div className="flex gap-1.5 sm:gap-2 w-full flex-wrap">
                        <motion.div whileTap={{ scale: 0.97 }} className="flex-1 min-w-0">
                          <Button variant="outline" size="sm" className="w-full rounded-xl text-[10px] sm:text-xs lg:text-sm border-white/10 touch-manipulation" data-testid="button-download-pdf">
                            <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 mr-1 sm:mr-1.5 flex-shrink-0" />
                            <span className="truncate">PDF</span>
                          </Button>
                        </motion.div>
                        <motion.div whileTap={{ scale: 0.97 }} className="flex-1 min-w-0">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full rounded-xl text-[10px] sm:text-xs lg:text-sm border-cyan-500/30 text-cyan-400 touch-manipulation" 
                            onClick={copyResultsToClipboard}
                            data-testid="button-copy-results"
                          >
                            {copiedResult ? (
                              <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 mr-1 sm:mr-1.5 flex-shrink-0" />
                            ) : (
                              <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 mr-1 sm:mr-1.5 flex-shrink-0" />
                            )}
                            <span className="truncate">{copiedResult ? t('common.copied') : t('common.copy')}</span>
                          </Button>
                        </motion.div>
                        <motion.div whileTap={{ scale: 0.97 }} className="flex-1 min-w-0">
                          <Button variant="outline" size="sm" className="w-full rounded-xl text-[10px] sm:text-xs lg:text-sm border-primary/30 text-primary touch-manipulation" data-testid="button-add-to-monitor">
                            <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 mr-1 sm:mr-1.5 flex-shrink-0" />
                            <span className="truncate">{t('dashboard.addToMonitor')}</span>
                          </Button>
                        </motion.div>
                        <motion.div whileTap={{ scale: 0.97 }} className="flex-1 min-w-0">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className={`w-full rounded-xl text-[10px] sm:text-xs lg:text-sm touch-manipulation ${
                              isCurrentTargetFavorited 
                                ? "border-yellow-500/50 text-yellow-400" 
                                : "border-yellow-500/30 text-yellow-500/70"
                            }`}
                            onClick={() => {
                              if (isCurrentTargetFavorited) {
                                const fav = userFavorites.find(f => f.checkType === result.type && f.value === result.target);
                                if (fav) deleteFavoriteMutation.mutate(fav.id);
                              } else {
                                addFavoriteMutation.mutate({ checkType: result.type, value: result.target });
                              }
                            }}
                            disabled={addFavoriteMutation.isPending || deleteFavoriteMutation.isPending}
                            data-testid="button-toggle-favorite"
                          >
                            <Star className={`w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 mr-1 sm:mr-1.5 flex-shrink-0 ${isCurrentTargetFavorited ? "fill-yellow-400" : ""}`} />
                            <span className="truncate">{isCurrentTargetFavorited ? favLabels.remove : favLabels.addToFav}</span>
                          </Button>
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {(userFavorites.length > 0 || result) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="p-3 lg:p-4 rounded-xl border border-white/10 bg-gradient-to-br from-black/50 via-black/30 to-transparent backdrop-blur-xl"
                data-testid="section-favorites"
              >
                <div className="flex items-center gap-2 mb-2.5">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span className="text-xs lg:text-sm font-semibold">{favLabels.title}</span>
                  <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20 text-[9px] lg:text-[10px] ml-auto">
                    {userFavorites.length}
                  </Badge>
                </div>
                {userFavorites.length > 0 ? (
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-white/10" data-testid="favorites-list">
                    {userFavorites.map((fav) => {
                      const typeStyle = checkTypeStyles.find(s => s.id === fav.checkType);
                      const TypeIcon = typeStyle?.icon || Globe;
                      const colorClass = favTypeColorMap[fav.checkType] || "bg-white/10 border-white/20 text-white/70";
                      return (
                        <motion.div
                          key={fav.id}
                          className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border cursor-pointer transition-all duration-200 flex-shrink-0 group ${colorClass}`}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => {
                            setSelectedType(fav.checkType);
                            setInputValue(fav.value);
                            setResult(null);
                          }}
                          data-testid={`favorite-item-${fav.id}`}
                        >
                          <TypeIcon className="w-3 h-3 flex-shrink-0" />
                          <span className="text-[10px] lg:text-xs font-mono max-w-[120px] truncate">
                            {fav.value}
                          </span>
                          <button
                            className="ml-1 opacity-0 group-hover:opacity-100 visible transition-opacity duration-200 flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteFavoriteMutation.mutate(fav.id);
                            }}
                            data-testid={`button-delete-favorite-${fav.id}`}
                          >
                            <X className="w-3 h-3 text-white/50 hover:text-white/80" />
                          </button>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[10px] lg:text-xs text-muted-foreground" data-testid="text-no-favorites">
                    {lang === "uk" ? "Додайте перші обрані для швидкого доступу" : lang === "ru" ? "Добавьте первые избранные для быстрого доступа" : lang === "es" ? "Agregue los primeros favoritos para acceso rpido" : lang === "de" ? "Erste Favoriten fr Schnellzugriff hinzufgen" : "Add your first favorites for quick access"}
                  </p>
                )}
              </motion.div>
            )}

            {bulkMode && bulkResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="space-y-3 lg:space-y-4"
              >
                <div className="p-3.5 lg:p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-black/70 via-black/50 to-transparent backdrop-blur-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <List className="w-5 h-5 text-primary" />
                      <h3 className="text-sm lg:text-lg font-display font-semibold">{t('dashboard.bulkComplete')}</h3>
                    </div>
                    <Badge className="bg-primary/20 text-primary border-primary/30">
                      {bulkResults.length} {t('dashboard.results')}
                    </Badge>
                  </div>
                  
                  <div className="grid gap-2 max-h-[400px] overflow-y-auto pr-1">
                    {bulkResults.map((bulkResult, idx) => {
                      const riskConfig = getRiskConfig(bulkResult.riskLevel);
                      const RiskIcon = riskConfig.icon;
                      const isSelected = selectedBulkResult?.target === bulkResult.target;
                      
                      return (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.03, duration: 0.2 }}
                          onClick={() => setSelectedBulkResult(isSelected ? null : bulkResult)}
                          className={`p-3 lg:p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                            isSelected
                              ? `${riskConfig.border} ${riskConfig.bg} ring-1 ring-white/20`
                              : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                          }`}
                          data-testid={`bulk-result-${idx}`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${riskConfig.bg}`}>
                                <RiskIcon className={`w-4 h-4 ${riskConfig.color}`} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs lg:text-sm font-mono truncate" title={bulkResult.target}>
                                  {bulkResult.target}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className={`text-[10px] font-medium uppercase ${riskConfig.color}`}>
                                    {bulkResult.riskLevel}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground">
                                    Score: {bulkResult.riskScore}/100
                                  </span>
                                  {bulkResult.error && (
                                    <Badge variant="destructive" className="text-[9px] px-1.5">
                                      {t('common.error')}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                          </div>
                          
                          <AnimatePresence>
                            {isSelected && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="mt-3 pt-3 border-t border-white/10"
                              >
                                {bulkResult.error ? (
                                  <p className="text-xs text-red-400">{bulkResult.error}</p>
                                ) : (
                                  <div className="space-y-2">
                                    <p className="text-xs text-muted-foreground">{bulkResult.summary}</p>
                                    {bulkResult.findings.length > 0 && (
                                      <div className="space-y-1">
                                        {bulkResult.findings.slice(0, 3).map((finding, fIdx) => (
                                          <div key={fIdx} className="text-[10px] text-muted-foreground flex items-start gap-1.5">
                                            <ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                            <span>{finding}</span>
                                          </div>
                                        ))}
                                        {bulkResult.findings.length > 3 && (
                                          <p className="text-[10px] text-muted-foreground/60">
                                            +{bulkResult.findings.length - 3} more findings...
                                          </p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </div>
                  
                  <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/10">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                      <span>{bulkResults.filter(r => r.riskLevel === 'low').length} {t('dashboard.riskLevels.low')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <AlertTriangle className="w-4 h-4 text-orange-400" />
                      <span>{bulkResults.filter(r => r.riskLevel === 'high' || r.riskLevel === 'critical').length} {t('dashboard.riskLevels.high')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <XCircle className="w-4 h-4 text-red-400" />
                      <span>{bulkResults.filter(r => r.error).length} {t('common.error')}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {!result && !bulkMode && bulkResults.length === 0 && (
              <motion.div 
                className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                {[
                  { icon: Shield, label: t('dashboard.checks'), value: platformStats ? platformStats.totalReports.toLocaleString() : "—", color: "text-primary", gradient: "from-primary/20 to-transparent", border: "border-primary/20" },
                  { icon: AlertTriangle, label: t('dashboard.threats'), value: platformStats ? platformStats.threatsBlocked.toLocaleString() : "—", color: "text-orange-400", gradient: "from-orange-500/20 to-transparent", border: "border-orange-500/20" },
                  { icon: Database, label: t('dashboard.sources'), value: "50+", color: "text-blue-400", gradient: "from-blue-500/20 to-transparent", border: "border-blue-500/20" },
                  { icon: TrendingUp, label: t('dashboard.checksToday') || "Today", value: platformStats ? platformStats.checksToday.toLocaleString() : "—", color: "text-green-400", gradient: "from-green-500/20 to-transparent", border: "border-green-500/20" },
                ].map((stat, idx) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + idx * 0.1, duration: 0.4 }}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    className={`p-4 lg:p-6 rounded-xl lg:rounded-2xl border ${stat.border} bg-gradient-to-br ${stat.gradient} backdrop-blur-sm hover:border-white/20 transition-all duration-300 group`}
                  >
                    <stat.icon className={`w-5 h-5 lg:w-6 lg:h-6 ${stat.color} mb-2 lg:mb-3 group-hover:scale-110 transition-transform duration-300`} />
                    <p className="text-xl lg:text-2xl font-display font-bold" data-testid={`stat-value-${idx}`}>{stat.value}</p>
                    <p className="text-[10px] lg:text-sm text-muted-foreground" data-testid={`stat-label-${idx}`}>{stat.label}</p>
                  </motion.div>
                ))}
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="p-4 lg:p-6 rounded-2xl bg-gradient-to-br from-red-500/10 via-orange-500/5 to-transparent border border-red-500/20 backdrop-blur-xl"
              data-testid="section-breach-monitor"
            >
              <div className="flex items-center gap-2 mb-3 lg:mb-4">
                <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl flex items-center justify-center bg-red-500/20 border border-red-500/30">
                  <Shield className="w-4 h-4 lg:w-5 lg:h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-sm lg:text-base font-display font-semibold" data-testid="text-breach-title">{breachLabels.title}</h3>
                  <p className="text-[10px] lg:text-xs text-muted-foreground">{breachLabels.description}</p>
                </div>
              </div>

              <div className="flex gap-2 mb-3">
                <Input
                  type="email"
                  placeholder={breachLabels.placeholder}
                  value={breachEmail}
                  onChange={(e) => setBreachEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && checkBreach()}
                  className="bg-white/5 border-white/10 focus:border-red-500/50 text-sm flex-1"
                  data-testid="input-breach-email"
                />
                <Button
                  size="sm"
                  onClick={checkBreach}
                  disabled={breachLoading || !breachEmail}
                  className="gap-1.5"
                  data-testid="button-breach-check"
                >
                  {breachLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Search className="w-3.5 h-3.5" />
                  )}
                  {breachLabels.check}
                </Button>
              </div>

              <AnimatePresence>
                {breachResult && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-3"
                  >
                    <div className={`flex items-center gap-2 p-3 rounded-xl border ${
                      breachResult.breaches && breachResult.breaches.length > 0
                        ? "bg-red-500/10 border-red-500/30"
                        : "bg-green-500/10 border-green-500/30"
                    }`} data-testid="breach-status">
                      <Shield className={`w-5 h-5 ${
                        breachResult.breaches && breachResult.breaches.length > 0 ? "text-red-400" : "text-green-400"
                      }`} />
                      <div className="flex-1">
                        <p className={`text-sm font-semibold ${
                          breachResult.breaches && breachResult.breaches.length > 0 ? "text-red-400" : "text-green-400"
                        }`} data-testid="text-breach-status">
                          {breachResult.breaches && breachResult.breaches.length > 0 ? breachLabels.exposed : breachLabels.clean}
                        </p>
                        <p className="text-[10px] text-muted-foreground" data-testid="text-breach-count">
                          {breachResult.breaches && breachResult.breaches.length > 0
                            ? `${breachLabels.breachesFound}: ${breachResult.breaches.length}`
                            : breachLabels.noBreaches}
                        </p>
                      </div>
                    </div>

                    {breachResult.breaches && breachResult.breaches.length > 0 && (
                      <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                        {breachResult.breaches.map((breach: any, idx: number) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="p-3 rounded-xl bg-white/5 border border-white/10"
                            data-testid={`breach-item-${idx}`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <p className="text-xs lg:text-sm font-semibold truncate" data-testid={`text-breach-name-${idx}`}>
                                {breach.name || breach.Name || `Breach #${idx + 1}`}
                              </p>
                              {(breach.date || breach.BreachDate) && (
                                <Badge variant="outline" className="text-[9px] lg:text-[10px] flex-shrink-0" data-testid={`text-breach-date-${idx}`}>
                                  {breachLabels.date}: {breach.date || breach.BreachDate}
                                </Badge>
                              )}
                            </div>
                            {(breach.dataTypes || breach.DataClasses) && (
                              <div className="flex flex-wrap gap-1" data-testid={`breach-datatypes-${idx}`}>
                                <span className="text-[9px] text-muted-foreground mr-1">{breachLabels.dataTypes}:</span>
                                {(breach.dataTypes || breach.DataClasses || []).slice(0, 5).map((dt: string, dtIdx: number) => (
                                  <Badge key={dtIdx} variant="secondary" className="text-[9px] px-1.5">
                                    {dt}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>

      </div>

      <Dialog open={showProfile} onOpenChange={setShowProfile}>
        <DialogContent className="bg-black/95 border-cyan-500/30 backdrop-blur-xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-display flex items-center gap-2">
              <User className="w-5 h-5 text-cyan-400" />
              {t('dashboard.profile')}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {t('dashboard.botSyncOk')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-gradient-to-br from-cyan-500/10 to-transparent border border-cyan-500/20">
                <div className="text-[10px] text-muted-foreground mb-1">Telegram ID</div>
                <div className="font-mono text-cyan-400 text-sm" data-testid="text-tg-id">{user?.tgId || "—"}</div>
              </div>
              <div className="p-3 rounded-lg bg-gradient-to-br from-primary/10 to-transparent border border-primary/20">
                <div className="text-[10px] text-muted-foreground mb-1">Username</div>
                <div className="font-mono text-primary text-sm" data-testid="text-username">@{user?.username || "—"}</div>
              </div>
              <div className="p-3 rounded-lg bg-gradient-to-br from-yellow-500/10 to-transparent border border-yellow-500/20">
                <div className="text-[10px] text-muted-foreground mb-1">{t('account.tier')}</div>
                <div className="font-mono text-yellow-400 text-sm" data-testid="text-tier">{user?.tier || "FREE"}</div>
              </div>
              <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20">
                <div className="text-[10px] text-muted-foreground mb-1">{t('account.remaining')}</div>
                <div className="font-mono text-blue-400 text-sm" data-testid="text-requests-left">{user?.requestsLeft ?? 0}/{(() => { const limits: Record<string, number> = { FREE: 5, BASIC: 30, PRO: 50, ENTERPRISE: 9999 }; return limits[(user?.tier || "FREE").toUpperCase()] || 5; })()}</div>
              </div>
              <div className="p-3 rounded-lg bg-gradient-to-br from-orange-500/10 to-transparent border border-orange-500/20">
                <div className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1">
                  <Zap className="w-3 h-3" /> {t('account.streak')}
                </div>
                <div className="font-mono text-orange-400 text-sm" data-testid="text-streak">{user?.streakDays ?? 0} {t('account.streakDays')}</div>
              </div>
              <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20">
                <div className="text-[10px] text-muted-foreground mb-1">{t('referral.yourCode')}</div>
                <div className="font-mono text-purple-400 text-sm" data-testid="text-ref-code">{user?.refCode || "—"}</div>
              </div>
            </div>
            
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2" data-testid="status-bot-sync">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-emerald-400">{t('dashboard.botSyncOk')}</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showSubscription} onOpenChange={setShowSubscription}>
        <DialogContent className="bg-black/95 border-primary/30 backdrop-blur-xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-display flex items-center gap-2">
              <Crown className="w-5 h-5 text-primary" />
              {t('account.subscriptionTitle')}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {t('dashboard.selectTypeAndEnter')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/30">
              <div className="text-xs text-muted-foreground mb-2">{t('dashboard.paymentAddress')}</div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs font-mono text-primary bg-black/50 p-2 rounded-lg break-all select-all">
                  {TRC20_ADDRESS}
                </code>
                <Button
                  size="icon"
                  variant="outline"
                  className="flex-shrink-0 border-primary/30 hover:bg-primary/20"
                  onClick={copyAddress}
                  data-testid="button-copy-address"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-primary" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">{t('dashboard.txHashLabel')}</label>
              <Input
                placeholder={t('dashboard.txHashPlaceholder')}
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                className="bg-black/50 border-white/10 focus:border-primary/50"
                data-testid="input-tx-hash"
              />
            </div>

            <div className="space-y-2">
              <Button
                onClick={() => handlePaymentRequest("pro")}
                disabled={paymentMutation.isPending}
                className="w-full p-4 h-auto rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 border border-blue-500/30 transition-all"
                data-testid="button-submit-pro"
              >
                {paymentMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Shield className="w-4 h-4 mr-2" />
                )}
                <div className="flex items-center justify-between w-full">
                  <span className="font-semibold">{t('dashboard.submitRequestBtn')} PRO</span>
                  <span className="text-sm opacity-80">$10</span>
                </div>
              </Button>
              
              <Button
                onClick={() => handlePaymentRequest("enterprise")}
                disabled={paymentMutation.isPending}
                className="w-full p-4 h-auto rounded-xl bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 border border-purple-500/30 transition-all"
                data-testid="button-submit-enterprise"
              >
                {paymentMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Crown className="w-4 h-4 mr-2" />
                )}
                <div className="flex items-center justify-between w-full">
                  <span className="font-semibold">{t('dashboard.submitRequestBtn')} ENTERPRISE</span>
                  <span className="text-sm opacity-80">$50</span>
                </div>
              </Button>
            </div>

            <div className="pt-2 border-t border-white/10">
              <p className="text-xs text-muted-foreground text-center">
                {t('dashboard.requestWillBeSent')}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showShortcuts} onOpenChange={setShowShortcuts}>
        <DialogContent className="bg-black/95 border-primary/30 backdrop-blur-xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl font-display flex items-center gap-2">
              <Keyboard className="w-5 h-5 text-primary" />
              {t('dashboard.keyboardShortcuts')}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {t('dashboard.selectTypeAndEnter')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 mt-4">
            {shortcuts.map((shortcut, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10"
              >
                <span className="text-sm text-muted-foreground">{shortcut.description}</span>
                <div className="flex items-center gap-1">
                  {shortcut.keys.map((key, keyIndex) => (
                    <span key={keyIndex}>
                      {key === "-" ? (
                        <span className="text-muted-foreground mx-1">-</span>
                      ) : (
                        <kbd className="px-2 py-1 text-xs font-mono bg-black/50 border border-white/20 rounded text-primary">
                          {key === "Ctrl" && navigator.platform.includes("Mac") ? "⌘" : key}
                        </kbd>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-3 border-t border-white/10">
            <p className="text-xs text-muted-foreground text-center">
              {t('dashboard.keyboardShortcuts')} <kbd className="px-1.5 py-0.5 text-xs bg-black/50 border border-white/20 rounded">?</kbd>
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <motion.button
        className="fixed bottom-6 right-6 z-40 w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-cyan-500/10 border border-primary/30 flex items-center justify-center text-primary hover:border-primary/50 hover:shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-all duration-300"
        onClick={() => setShowShortcuts(true)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        title={t('dashboard.keyboardShortcuts')}
        data-testid="button-shortcuts-help"
      >
        <HelpCircle className="w-5 h-5" />
      </motion.button>
    </PageLayout>
  );
}
