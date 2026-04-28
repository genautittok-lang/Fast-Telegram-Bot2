import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, 
  FileText, 
  Download, 
  Globe,
  Wallet,
  Mail,
  Phone,
  Building,
  Link2,
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
  FileJson,
  FileSpreadsheet,
  Search,
  Calendar,
  AlertCircle,
  Copy,
  Check,
  Eye,
  Sparkles,
  BarChart3,
  Bot,
  Bug,
  CreditCard,
  Hash,
  User,
  RotateCcw,
  GitCompareArrows,
  X,
  Trash2,
  Share2,
  KeyRound,
  Network,
  ShieldCheck,
  Wifi,
  Camera,
  Map
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";
import { PageLayout } from "@/components/PageLayout";
import { useIsStandalone } from "@/hooks/use-mobile";
import { ActivityTimeline } from "@/components/ActivityTimeline";
import EntityGraph from "@/components/EntityGraph";
import PdfPreview from "@/components/PdfPreview";
import ScanInsights from "@/components/ScanInsights";

interface Report {
  id: number;
  type: string;
  target: string;
  riskLevel: string;
  riskScore: number;
  createdAt: string;
}

const typeIcons: Record<string, any> = {
  ip: Globe,
  wallet: Wallet,
  email: Mail,
  phone: Phone,
  domain: Building,
  url: Link2,
  bot: Bot,
  cve: Bug,
  hash: Hash,
  username: User,
  card: CreditCard,
  password: KeyRound,
  dns: Network,
  ssl: ShieldCheck,
  mac: Wifi,
  exif: Camera,
  geoint: Map,
};

const typeGradients: Record<string, string> = {
  ip: "from-blue-500 to-cyan-400",
  wallet: "from-orange-500 to-amber-400",
  email: "from-purple-500 to-pink-400",
  phone: "from-green-500 to-cyan-400",
  domain: "from-indigo-500 to-violet-400",
  url: "from-red-500 to-rose-400",
  bot: "from-cyan-500 to-teal-400",
  cve: "from-rose-500 to-red-400",
  hash: "from-slate-500 to-zinc-400",
  username: "from-amber-500 to-yellow-400",
  card: "from-cyan-500 to-teal-400",
  password: "from-yellow-500 to-amber-400",
  dns: "from-sky-500 to-blue-400",
  ssl: "from-lime-500 to-green-400",
  mac: "from-violet-500 to-purple-400",
  exif: "from-pink-500 to-rose-400",
  geoint: "from-teal-500 to-cyan-400",
};

const localeMap: Record<string, string> = {
  uk: "uk-UA",
  en: "en-US",
  ru: "ru-RU",
  es: "es-ES",
  de: "de-DE",
};

export default function History() {
  const isStandalone = useIsStandalone();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const { t, lang } = useTranslation();
  const isFreeTier = !user?.tier || user.tier === "FREE";
  const [pdfPreview, setPdfPreview] = useState<{ url: string; name: string } | null>(null);
  const [showGraph, setShowGraph] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedReports, setSelectedReports] = useState<any[]>([]);

  const toggleReportSelect = (report: any) => {
    if (!compareMode) return;
    setSelectedReports(prev => {
      const exists = prev.find((r: any) => r.id === report.id);
      if (exists) return prev.filter((r: any) => r.id !== report.id);
      if (prev.length >= 2) return [prev[1], report];
      return [...prev, report];
    });
  };

  const compareLabel = lang === "uk" ? "Порівняти" : lang === "ru" ? "Сравнить" : lang === "es" ? "Comparar" : lang === "de" ? "Vergleichen" : "Compare";
  const compareTargetLabel = lang === "uk" ? "Ціль" : lang === "ru" ? "Цель" : lang === "es" ? "Objetivo" : lang === "de" ? "Ziel" : "Target";
  const compareTypeLabel = lang === "uk" ? "Тип перевірки" : lang === "ru" ? "Тип проверки" : lang === "es" ? "Tipo de verificación" : lang === "de" ? "Prüfungstyp" : "Check Type";
  const compareRiskScoreLabel = lang === "uk" ? "Оцінка ризику" : lang === "ru" ? "Оценка риска" : lang === "es" ? "Puntuación de riesgo" : lang === "de" ? "Risikobewertung" : "Risk Score";
  const compareRiskLevelLabel = lang === "uk" ? "Рівень ризику" : lang === "ru" ? "Уровень риска" : lang === "es" ? "Nivel de riesgo" : lang === "de" ? "Risikostufe" : "Risk Level";
  const compareDateLabel = lang === "uk" ? "Дата перевірки" : lang === "ru" ? "Дата проверки" : lang === "es" ? "Fecha de verificación" : lang === "de" ? "Prüfdatum" : "Date Checked";
  const compareCloseLabel = lang === "uk" ? "Закрити" : lang === "ru" ? "Закрыть" : lang === "es" ? "Cerrar" : lang === "de" ? "Schließen" : "Close";
  const compareTitle = lang === "uk" ? "Порівняння звітів" : lang === "ru" ? "Сравнение отчётов" : lang === "es" ? "Comparación de informes" : lang === "de" ? "Berichtsvergleich" : "Report Comparison";
  const compareHint = lang === "uk" ? "Оберіть 2 звіти для порівняння" : lang === "ru" ? "Выберите 2 отчёта для сравнения" : lang === "es" ? "Seleccione 2 informes para comparar" : lang === "de" ? "Wählen Sie 2 Berichte zum Vergleichen" : "Select 2 reports to compare";
  const compareVsLabel = lang === "uk" ? "проти" : lang === "ru" ? "против" : lang === "es" ? "contra" : lang === "de" ? "gegen" : "vs";

  const getRiskBarColor = (level: string) => {
    switch (level) {
      case "critical": return "bg-red-500";
      case "high": return "bg-orange-500";
      case "medium": return "bg-yellow-500";
      default: return "bg-green-500";
    }
  };

  const { data: reports, isLoading } = useQuery<Report[]>({
    queryKey: ["/api/reports"],
    enabled: isAuthenticated,
  });

  const riskFilters = [
    { id: "all", label: t('history.all'), color: "bg-white/10 hover:bg-white/20" },
    { id: "low", label: t('dashboard.riskLevels.low'), color: "bg-green-500/20 text-green-400 hover:bg-green-500/30" },
    { id: "medium", label: t('dashboard.riskLevels.medium'), color: "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30" },
    { id: "high", label: t('dashboard.riskLevels.high'), color: "bg-orange-500/20 text-orange-400 hover:bg-orange-500/30" },
    { id: "critical", label: t('dashboard.riskLevels.critical'), color: "bg-red-500/20 text-red-400 hover:bg-red-500/30" },
  ];

  const dateFilters = [
    { id: "all", label: t('history.allTime') },
    { id: "today", label: t('history.today') },
    { id: "week", label: t('history.thisWeek') },
    { id: "month", label: t('history.thisMonth') },
  ];

  const filteredReports = useMemo(() => {
    if (!reports) return [];
    
    return reports.filter(report => {
      if (searchQuery && !report.target.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      if (riskFilter !== "all" && report.riskLevel !== riskFilter) {
        return false;
      }
      
      if (dateFilter !== "all") {
        const reportDate = new Date(report.createdAt);
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(startOfDay);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        switch (dateFilter) {
          case "today":
            if (reportDate < startOfDay) return false;
            break;
          case "week":
            if (reportDate < startOfWeek) return false;
            break;
          case "month":
            if (reportDate < startOfMonth) return false;
            break;
        }
      }
      
      return true;
    });
  }, [reports, searchQuery, riskFilter, dateFilter]);

  const stats = useMemo(() => {
    if (!reports) return { total: 0, thisWeek: 0, critical: 0, downloads: 0 };
    
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    return {
      total: reports.length,
      thisWeek: reports.filter(r => new Date(r.createdAt) >= weekAgo).length,
      critical: reports.filter(r => r.riskLevel === "critical" || r.riskLevel === "high").length,
      downloads: Math.floor(reports.length * 0.7),
    };
  }, [reports]);

  const riskDistribution = useMemo(() => {
    if (!reports) return { high: 0, medium: 0, low: 0, critical: 0 };
    return {
      critical: reports.filter(r => r.riskLevel === "critical").length,
      high: reports.filter(r => r.riskLevel === "high").length,
      medium: reports.filter(r => r.riskLevel === "medium").length,
      low: reports.filter(r => r.riskLevel === "low").length,
    };
  }, [reports]);

  const getRiskConfig = (level: string) => {
    switch (level) {
      case "critical": 
        return { 
          color: "text-red-400", 
          bg: "bg-red-500/10", 
          border: "border-l-red-500",
          glow: "shadow-red-500/20",
          icon: AlertCircle,
          label: t('dashboard.riskLevels.critical')
        };
      case "high": 
        return { 
          color: "text-orange-400", 
          bg: "bg-orange-500/10", 
          border: "border-l-orange-500",
          glow: "shadow-orange-500/20",
          icon: AlertTriangle,
          label: t('dashboard.riskLevels.high')
        };
      case "medium": 
        return { 
          color: "text-yellow-400", 
          bg: "bg-yellow-500/10", 
          border: "border-l-yellow-500",
          glow: "shadow-yellow-500/20",
          icon: Clock,
          label: t('dashboard.riskLevels.medium')
        };
      default: 
        return { 
          color: "text-green-400", 
          bg: "bg-green-500/10", 
          border: "border-l-green-500",
          glow: "shadow-green-500/20",
          icon: CheckCircle,
          label: t('dashboard.riskLevels.low')
        };
    }
  };

  const handleDeleteReport = async (id: number) => {
    const confirmText = lang === "uk" ? "Видалити цей звіт?" : lang === "ru" ? "Удалить этот отчёт?" : lang === "es" ? "¿Eliminar este informe?" : lang === "de" ? "Diesen Bericht löschen?" : "Delete this report?";
    if (!window.confirm(confirmText)) return;
    try {
      await apiRequest("DELETE", `/api/reports/${id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      toast({
        title: lang === "uk" ? "Звіт видалено" : lang === "ru" ? "Отчёт удалён" : lang === "es" ? "Informe eliminado" : lang === "de" ? "Bericht gelöscht" : "Report deleted",
        description: lang === "uk" ? "Звіт успішно видалено" : lang === "ru" ? "Отчёт успешно удалён" : lang === "es" ? "Informe eliminado con éxito" : lang === "de" ? "Bericht erfolgreich gelöscht" : "Report deleted successfully",
      });
    } catch {
      toast({
        title: lang === "uk" ? "Помилка" : lang === "ru" ? "Ошибка" : lang === "es" ? "Error" : lang === "de" ? "Fehler" : "Error",
        description: lang === "uk" ? "Не вдалося видалити звіт" : lang === "ru" ? "Не удалось удалить отчёт" : lang === "es" ? "No se pudo eliminar el informe" : lang === "de" ? "Bericht konnte nicht gelöscht werden" : "Failed to delete report",
        variant: "destructive",
      });
    }
  };

  const handleShareLink = async (id: number) => {
    try {
      const res = await fetch(`/api/reports/${id}/share-link`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to get share link");
      const data = await res.json();
      await navigator.clipboard.writeText(window.location.origin + data.shareUrl);
      toast({
        title: lang === "uk" ? "Посилання скопійовано!" : lang === "ru" ? "Ссылка скопирована!" : lang === "es" ? "Enlace copiado!" : lang === "de" ? "Link kopiert!" : "Link copied!",
        description: lang === "uk" ? "Поділіться цим посиланням" : lang === "ru" ? "Поделитесь этой ссылкой" : lang === "es" ? "Comparte este enlace" : lang === "de" ? "Teilen Sie diesen Link" : "Share this link with others",
      });
    } catch {
      toast({
        title: lang === "uk" ? "Помилка" : lang === "ru" ? "Ошибка" : lang === "es" ? "Error" : lang === "de" ? "Fehler" : "Error",
        description: lang === "uk" ? "Не вдалося отримати посилання" : lang === "ru" ? "Не удалось получить ссылку" : lang === "es" ? "No se pudo obtener el enlace" : lang === "de" ? "Link konnte nicht abgerufen werden" : "Failed to get share link",
        variant: "destructive",
      });
    }
  };

  const handleDownload = (id: number) => {
    window.open(`/api/reports/${id}/pdf`, '_blank');
  };

  const handlePreview = (id: number) => {
    setPdfPreview({ url: `/api/reports/${id}/pdf`, name: `darkshare-report-${id}.pdf` });
  };

  const handleCopyTarget = async (report: Report) => {
    try {
      await navigator.clipboard.writeText(report.target);
      setCopiedId(report.id);
      toast({
        title: t('history.copied'),
        description: t('history.copiedDesc'),
      });
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast({
        title: t('errors.invalidInput'),
        description: t('history.copyError'),
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('time.justNow');
    if (diffMins < 60) return `${diffMins} ${t('time.minutesAgo')}`;
    if (diffHours < 24) return `${diffHours} ${t('time.hoursAgo')}`;
    if (diffDays < 7) return `${diffDays} ${t('time.daysAgo')}`;
    return date.toLocaleDateString(localeMap[lang] || 'en-US');
  };

  const locale = localeMap[lang] || 'en-US';

  const exportCSV = async () => {
    try {
      const res = await fetch("/api/reports/export/csv", { credentials: "include" });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `darkshare-reports-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast({ title: t('common.error'), description: "Export failed", variant: "destructive" });
    }
  };

  const csvLabel = lang === "uk" ? "Експорт CSV" : lang === "ru" ? "Экспорт CSV" : lang === "es" ? "Exportar CSV" : lang === "de" ? "CSV exportieren" : "Export CSV";
  const freeLimitTooltip = lang === "uk"
    ? "FREE: останні 10 звітів + водяний знак. PRO — повний експорт без обмежень."
    : lang === "ru"
    ? "FREE: последние 10 отчётов + водяной знак. PRO — полный экспорт без ограничений."
    : lang === "es"
    ? "FREE: últimos 10 informes + marca de agua. PRO — exportación completa sin límites."
    : lang === "de"
    ? "FREE: letzte 10 Berichte + Wasserzeichen. PRO — voller Export ohne Limits."
    : "FREE: last 10 reports + watermark. PRO — full export, no limits.";

  const headerActions = (
    <>
      <Button 
        variant="ghost" 
        size="icon"
        className="hidden md:flex h-8 w-8 text-muted-foreground relative"
        onClick={() => {
          if (isFreeTier) {
            toast({ title: "FREE", description: freeLimitTooltip });
          }
          window.open('/api/reports/export/json', '_blank');
        }}
        title={isFreeTier ? freeLimitTooltip : "Export JSON"}
        aria-label={isFreeTier ? `Export JSON — ${freeLimitTooltip}` : "Export JSON"}
        data-testid="button-export-json"
      >
        <FileJson className="w-4 h-4" />
        {isFreeTier && (
          <span
            aria-hidden="true"
            className="absolute -top-1.5 -right-1.5 text-[10px] font-bold text-cyan-300 bg-zinc-950 border border-cyan-500/60 rounded px-1 leading-none py-0.5 shadow-[0_0_6px_rgba(34,211,238,0.3)]"
          >
            10
          </span>
        )}
      </Button>
      <Button 
        variant="outline" 
        size="sm"
        className="hidden sm:flex gap-1.5 text-[10px] sm:text-xs relative"
        onClick={() => {
          if (isFreeTier) {
            toast({ title: "FREE", description: freeLimitTooltip });
          }
          exportCSV();
        }}
        title={isFreeTier ? freeLimitTooltip : csvLabel}
        aria-label={isFreeTier ? `${csvLabel} — ${freeLimitTooltip}` : csvLabel}
        data-testid="button-export-csv"
      >
        <Download className="w-3.5 h-3.5" />
        {csvLabel}
        {isFreeTier && (
          <span
            aria-hidden="true"
            className="text-[10px] font-bold text-cyan-300 bg-zinc-950 border border-cyan-500/60 rounded px-1 leading-none py-0.5 ml-1 shadow-[0_0_6px_rgba(34,211,238,0.3)]"
          >
            10
          </span>
        )}
      </Button>
      <Button
        variant={compareMode ? "default" : "outline"}
        size="sm"
        className={`hidden sm:flex gap-1.5 text-[10px] sm:text-xs toggle-elevate ${compareMode ? "toggle-elevated" : ""}`}
        onClick={() => {
          setCompareMode(!compareMode);
          setSelectedReports([]);
        }}
        data-testid="button-compare-toggle"
      >
        <GitCompareArrows className="w-3.5 h-3.5" />
        {compareLabel}
      </Button>
      <Link href="/dashboard">
        <Button size="sm" variant="outline" className="gap-1.5 text-[10px] h-7 px-2" data-testid="button-new-check">
          <Sparkles className="w-3.5 h-3.5" />
          {t('dashboard.newCheck')}
        </Button>
      </Link>
    </>
  );

  return (
    <PageLayout title="History" appMode={isStandalone} headerActions={headerActions}>
      <div className="min-h-screen bg-background relative overflow-x-hidden">
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        </div>

        <main className="max-w-6xl mx-auto px-3 py-4 sm:px-4 sm:py-6 relative z-10 space-y-3 sm:space-y-6">
        <ScanInsights langProp={lang} />
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3"
        >
          <div 
            className="p-2 sm:p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 group hover:border-primary/30 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </div>
            <p className="text-lg sm:text-2xl font-bold font-display">{stats.total}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">{t('history.totalChecks')}</p>
          </div>

          <div 
            className="p-2 sm:p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 group hover:border-cyan-500/30 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
            </div>
            <p className="text-lg sm:text-2xl font-bold font-display">{stats.thisWeek}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">{t('history.thisWeekChecks')}</p>
          </div>

          <div 
            className="p-2 sm:p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 group hover:border-red-500/30 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
            </div>
            <p className="text-lg sm:text-2xl font-bold font-display">{stats.critical}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">{t('history.criticalRisks')}</p>
          </div>

          <div 
            className="p-2 sm:p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 group hover:border-purple-500/30 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <Download className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
            </div>
            <p className="text-lg sm:text-2xl font-bold font-display">{stats.downloads}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">{t('history.pdfDownloaded')}</p>
          </div>
        </motion.div>

        {reports && reports.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex flex-wrap items-center gap-2"
            data-testid="risk-distribution-summary"
          >
            <span className="text-xs text-muted-foreground mr-1">{lang === "uk" ? "Розподіл ризиків" : lang === "ru" ? "Распределение рисков" : lang === "es" ? "Distribución de riesgos" : lang === "de" ? "Risikoverteilung" : "Risk Distribution"}:</span>
            {riskDistribution.critical > 0 && (
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30 no-default-hover-elevate no-default-active-elevate" data-testid="badge-risk-critical">
                <AlertCircle className="w-3 h-3 mr-1" />
                {riskDistribution.critical} {t('dashboard.riskLevels.critical')}
              </Badge>
            )}
            {riskDistribution.high > 0 && (
              <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 no-default-hover-elevate no-default-active-elevate" data-testid="badge-risk-high">
                <AlertTriangle className="w-3 h-3 mr-1" />
                {riskDistribution.high} {t('dashboard.riskLevels.high')}
              </Badge>
            )}
            {riskDistribution.medium > 0 && (
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 no-default-hover-elevate no-default-active-elevate" data-testid="badge-risk-medium">
                <Clock className="w-3 h-3 mr-1" />
                {riskDistribution.medium} {t('dashboard.riskLevels.medium')}
              </Badge>
            )}
            {riskDistribution.low > 0 && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 no-default-hover-elevate no-default-active-elevate" data-testid="badge-risk-low">
                <CheckCircle className="w-3 h-3 mr-1" />
                {riskDistribution.low} {t('dashboard.riskLevels.low')}
              </Badge>
            )}
          </motion.div>
        )}

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-3 sm:space-y-4"
        >
          <div className="flex flex-col gap-2 sm:gap-3">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t('history.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 focus:border-primary/50 text-sm"
                data-testid="input-search"
              />
            </div>
            
            <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0">
              {dateFilters.map((filter) => (
                <Button
                  key={filter.id}
                  variant="ghost"
                  size="sm"
                  onClick={() => setDateFilter(filter.id)}
                  className={`text-[11px] sm:text-xs px-2 sm:px-3 h-7 sm:h-8 whitespace-nowrap flex-shrink-0 ${
                    dateFilter === filter.id 
                      ? "bg-white/10 text-foreground" 
                      : "text-muted-foreground"
                  }`}
                  data-testid={`button-date-${filter.id}`}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0">
            {riskFilters.map((filter) => (
              <motion.button
                key={filter.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setRiskFilter(filter.id)}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                  riskFilter === filter.id 
                    ? `${filter.color} ring-1 ring-white/20` 
                    : "bg-white/5 text-muted-foreground hover:bg-white/10"
                }`}
                data-testid={`button-filter-${filter.id}`}
              >
                {filter.label}
                {filter.id !== "all" && reports && (
                  <span className="ml-1 sm:ml-1.5 opacity-60">
                    ({reports.filter(r => r.riskLevel === filter.id).length})
                  </span>
                )}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {!isLoading && reports && reports.length > 0 && (
          <div className="mb-4 space-y-3">
            <ActivityTimeline reports={reports} days={14} lang={lang} />

            <div className="flex items-center justify-between gap-2">
              <div className="text-[11px] uppercase tracking-wider text-zinc-500 font-display">
                {lang === "uk" ? "Інтерактивна мапа сутностей" : lang === "ru" ? "Интерактивная карта сущностей" : lang === "es" ? "Mapa interactivo de entidades" : lang === "de" ? "Interaktive Entitätskarte" : "Interactive entity map"}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowGraph(v => !v)}
                className={`h-7 text-[10px] sm:text-xs gap-1.5 border-cyan-500/30 ${showGraph ? "bg-cyan-500/10 text-cyan-300" : "text-zinc-400"}`}
                aria-pressed={showGraph}
                aria-label={lang === "uk" ? "Перемкнути граф" : lang === "ru" ? "Переключить граф" : "Toggle graph"}
                data-testid="button-toggle-graph"
              >
                <Network className="w-3.5 h-3.5" />
                {showGraph
                  ? (lang === "uk" ? "Сховати" : lang === "ru" ? "Скрыть" : lang === "es" ? "Ocultar" : lang === "de" ? "Ausblenden" : "Hide")
                  : (lang === "uk" ? "Показати граф" : lang === "ru" ? "Показать граф" : lang === "es" ? "Mostrar grafo" : lang === "de" ? "Graph anzeigen" : "Show graph")}
              </Button>
            </div>

            {showGraph && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <EntityGraph
                  reports={reports.map(r => ({
                    id: r.id,
                    target: r.target,
                    type: r.type,
                    riskLevel: r.riskLevel,
                    riskScore: r.riskScore,
                    createdAt: r.createdAt,
                  }))}
                  lang={lang}
                  height={420}
                  onNodeClick={(id) => handlePreview(id)}
                />
              </motion.div>
            )}
          </div>
        )}

        <PdfPreview
          open={!!pdfPreview}
          onOpenChange={(open) => { if (!open) setPdfPreview(null); }}
          pdfUrl={pdfPreview?.url || ""}
          fileName={pdfPreview?.name}
          lang={lang}
        />

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-2 sm:space-y-3"
        >
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 sm:py-20 gap-3 sm:gap-4">
              <div className="relative">
                <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 sm:border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">{t('history.loadingHistory')}</p>
            </div>
          ) : filteredReports.length > 0 ? (
            <AnimatePresence mode="popLayout">
              {filteredReports.map((report, idx) => {
                const TypeIcon = typeIcons[report.type] || Globe;
                const gradient = typeGradients[report.type] || "from-gray-500 to-gray-400";
                const riskConfig = getRiskConfig(report.riskLevel);
                const RiskIcon = riskConfig.icon;
                
                return (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.03 }}
                    whileHover={{ y: -2 }}
                    onClick={() => toggleReportSelect(report)}
                    className={`group relative p-2 sm:p-4 rounded-xl bg-white/[0.03] backdrop-blur-sm border border-white/10 
                      hover:bg-white/[0.06] hover:border-white/20 hover:shadow-lg hover:${riskConfig.glow}
                      transition-all duration-300 cursor-pointer border-l-2 ${riskConfig.border}
                      ${compareMode && selectedReports.find((r: any) => r.id === report.id) ? "ring-2 ring-primary border-primary/50 bg-primary/5" : ""}`}
                    data-testid={`report-item-${report.id}`}
                  >
                    <div className="flex items-center gap-2 sm:gap-4">
                      {compareMode && (
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                          selectedReports.find((r: any) => r.id === report.id)
                            ? "bg-primary border-primary"
                            : "border-white/30"
                        }`}>
                          {selectedReports.find((r: any) => r.id === report.id) && (
                            <Check className="w-3 h-3 text-primary-foreground" />
                          )}
                        </div>
                      )}
                      <motion.div 
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className={`w-7 h-7 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg flex-shrink-0`}
                      >
                        <TypeIcon className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                      </motion.div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                          <p className="font-mono text-[11px] sm:text-sm font-medium truncate max-w-[120px] sm:max-w-none">{report.target}</p>
                          <Badge variant="outline" className="text-[9px] sm:text-[10px] uppercase tracking-wider opacity-60 hidden sm:inline-flex">
                            {report.type}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-muted-foreground">
                          <span>{formatDate(report.createdAt)}</span>
                          <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-white/20" />
                          <span className="hidden sm:inline">{new Date(report.createdAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                        <Badge className={`${riskConfig.bg} ${riskConfig.color} border-0 flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs`}>
                          <RiskIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          <span className="font-semibold">{report.riskScore}</span>
                        </Badge>
                        
                        <div className="flex items-center gap-0.5 sm:gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 sm:h-8 sm:w-8"
                            onClick={(e) => { e.stopPropagation(); handleCopyTarget(report); }}
                            data-testid={`button-copy-${report.id}`}
                          >
                            {copiedId === report.id ? (
                              <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 sm:h-8 sm:w-8"
                            onClick={(e) => { e.stopPropagation(); handlePreview(report.id); }}
                            aria-label={lang === "uk" ? "Перегляд PDF" : lang === "ru" ? "Просмотр PDF" : lang === "es" ? "Vista previa PDF" : lang === "de" ? "PDF-Vorschau" : "Preview PDF"}
                            data-testid={`button-preview-${report.id}`}
                          >
                            <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 sm:h-8 sm:w-8"
                            onClick={(e) => { e.stopPropagation(); handleDownload(report.id); }}
                            aria-label={lang === "uk" ? "Завантажити PDF" : lang === "ru" ? "Скачать PDF" : lang === "es" ? "Descargar PDF" : lang === "de" ? "PDF herunterladen" : "Download PDF"}
                            data-testid={`button-download-${report.id}`}
                          >
                            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 sm:h-8 sm:w-8"
                            onClick={(e) => { e.stopPropagation(); handleShareLink(report.id); }}
                            data-testid={`button-share-${report.id}`}
                          >
                            <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </Button>
                          <Link href={`/dashboard?type=${report.type}&target=${encodeURIComponent(report.target)}&recheck=1`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 sm:h-8 sm:w-8"
                              data-testid={`button-recheck-${report.id}`}
                            >
                              <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground hover:text-destructive"
                            onClick={(e) => { e.stopPropagation(); handleDeleteReport(report.id); }}
                            data-testid={`button-delete-${report.id}`}
                          >
                            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          ) : reports && reports.length > 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-10 sm:py-16 px-4"
            >
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Search className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
              </div>
              <p className="text-base sm:text-lg font-medium mb-1">{t('history.nothingFound')}</p>
              <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">{t('history.changeFilters')}</p>
              <Button 
                variant="outline"
                size="sm"
                onClick={() => { setSearchQuery(""); setRiskFilter("all"); setDateFilter("all"); }}
                data-testid="button-clear-filters"
              >
                {t('history.clearFilters')}
              </Button>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12 sm:py-20 px-4"
            >
              <motion.div 
                animate={{ 
                  y: [0, -8, 0],
                  rotate: [0, -3, 3, 0]
                }}
                transition={{ 
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6"
              >
                <div className="absolute inset-0 bg-primary/20 rounded-xl sm:rounded-2xl blur-xl animate-pulse" />
                <div className="relative w-full h-full rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary/20 to-cyan-500/20 border border-white/10 flex items-center justify-center">
                  <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                </div>
              </motion.div>
              
              <h3 className="text-lg sm:text-xl font-display font-bold mb-1.5 sm:mb-2">{t('history.emptyHistory')}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6 max-w-sm mx-auto">
                {t('history.emptyHistoryHint')}
              </p>
              
              <Link href="/dashboard">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    size="sm"
                    className="relative overflow-hidden group px-4 sm:px-6"
                    data-testid="button-start-checking"
                  >
                    <span className="relative z-10 flex items-center gap-1.5 sm:gap-2">
                      <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      {t('history.startChecking')}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-primary via-cyan-400 to-primary bg-[length:200%_100%] animate-[shimmer_2s_linear_infinite] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Button>
                </motion.div>
              </Link>
            </motion.div>
          )}
        </motion.div>

        {filteredReports.length > 0 && (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-xs text-muted-foreground pt-4"
          >
            {t('history.showingResults', { filtered: String(filteredReports.length), total: String(reports?.length || 0) })}
          </motion.p>
        )}

        <AnimatePresence>
          {compareMode && selectedReports.length < 2 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50"
            >
              <div className="px-4 py-2 rounded-full bg-primary/90 text-primary-foreground text-xs sm:text-sm font-medium backdrop-blur-sm shadow-lg flex items-center gap-2">
                <GitCompareArrows className="w-4 h-4" />
                {compareHint} ({selectedReports.length}/2)
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {compareMode && selectedReports.length === 2 && (
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              data-testid="compare-panel"
            >
              <Card className="p-4 sm:p-6 bg-white/[0.03] backdrop-blur-sm border-white/10">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <div className="flex items-center gap-2">
                    <GitCompareArrows className="w-5 h-5 text-primary" />
                    <h3 className="text-sm sm:text-base font-display font-bold">{compareTitle}</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedReports([]);
                      setCompareMode(false);
                    }}
                    className="gap-1.5 text-xs"
                    data-testid="button-compare-close"
                  >
                    <X className="w-3.5 h-3.5" />
                    {compareCloseLabel}
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-6">
                  {selectedReports.map((report: any, i: number) => {
                    const TypeIcon = typeIcons[report.type] || Globe;
                    const gradient = typeGradients[report.type] || "from-gray-500 to-gray-400";
                    const riskConfig = getRiskConfig(report.riskLevel);
                    const RiskIcon = riskConfig.icon;

                    return (
                      <motion.div
                        key={report.id}
                        initial={{ opacity: 0, x: i === 0 ? -20 : 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="space-y-3 sm:space-y-4"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                            <TypeIcon className="w-4 h-4 text-white" />
                          </div>
                          {i === 0 && <span className="text-[10px] text-muted-foreground uppercase tracking-wider">A</span>}
                          {i === 1 && <span className="text-[10px] text-muted-foreground uppercase tracking-wider">B</span>}
                        </div>

                        <div>
                          <p className="text-[10px] sm:text-xs text-muted-foreground mb-0.5">{compareTargetLabel}</p>
                          <p className="text-xs sm:text-sm font-mono font-medium truncate">{report.target}</p>
                        </div>

                        <div>
                          <p className="text-[10px] sm:text-xs text-muted-foreground mb-0.5">{compareTypeLabel}</p>
                          <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                            {report.type}
                          </Badge>
                        </div>

                        <div>
                          <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">{compareRiskScoreLabel}</p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 sm:h-3 rounded-full bg-white/10 overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${report.riskScore}%` }}
                                transition={{ duration: 0.8, ease: "easeOut", delay: i * 0.15 }}
                                className={`h-full rounded-full ${getRiskBarColor(report.riskLevel)}`}
                              />
                            </div>
                            <span className={`text-xs sm:text-sm font-bold ${riskConfig.color}`}>{report.riskScore}</span>
                          </div>
                        </div>

                        <div>
                          <p className="text-[10px] sm:text-xs text-muted-foreground mb-0.5">{compareRiskLevelLabel}</p>
                          <Badge className={`${riskConfig.bg} ${riskConfig.color} border-0 flex items-center gap-1 w-fit px-2 py-0.5 text-[10px] sm:text-xs`}>
                            <RiskIcon className="w-3 h-3" />
                            {riskConfig.label}
                          </Badge>
                        </div>

                        <div>
                          <p className="text-[10px] sm:text-xs text-muted-foreground mb-0.5">{compareDateLabel}</p>
                          <p className="text-xs sm:text-sm">{new Date(report.createdAt).toLocaleDateString(localeMap[lang] || 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-center">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="font-mono truncate max-w-[100px] sm:max-w-none">{selectedReports[0]?.target}</span>
                    <Badge variant="outline" className="text-[10px]">{compareVsLabel}</Badge>
                    <span className="font-mono truncate max-w-[100px] sm:max-w-none">{selectedReports[1]?.target}</span>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      </div>
    </PageLayout>
  );
}
