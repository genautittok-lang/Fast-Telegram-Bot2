import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, 
  FileText, 
  Download, 
  ArrowLeft,
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
  TrendingUp,
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
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { MobileMenu } from "@/components/MobileMenu";
import { useToast } from "@/hooks/use-toast";

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
};

const typeGradients: Record<string, string> = {
  ip: "from-blue-500 to-cyan-400",
  wallet: "from-orange-500 to-amber-400",
  email: "from-purple-500 to-pink-400",
  phone: "from-green-500 to-emerald-400",
  domain: "from-indigo-500 to-violet-400",
  url: "from-red-500 to-rose-400",
  bot: "from-cyan-500 to-teal-400",
  cve: "from-rose-500 to-red-400",
  hash: "from-slate-500 to-zinc-400",
  username: "from-amber-500 to-yellow-400",
  card: "from-emerald-500 to-teal-400",
};

const riskFilters = [
  { id: "all", label: "Всі", color: "bg-white/10 hover:bg-white/20" },
  { id: "low", label: "Низький", color: "bg-green-500/20 text-green-400 hover:bg-green-500/30" },
  { id: "medium", label: "Середній", color: "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30" },
  { id: "high", label: "Високий", color: "bg-orange-500/20 text-orange-400 hover:bg-orange-500/30" },
  { id: "critical", label: "Критичний", color: "bg-red-500/20 text-red-400 hover:bg-red-500/30" },
];

const dateFilters = [
  { id: "all", label: "Весь час" },
  { id: "today", label: "Сьогодні" },
  { id: "week", label: "Цей тиждень" },
  { id: "month", label: "Цей місяць" },
];

export default function History() {
  const { isLoading: authLoading, isAuthenticated, user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const { data: reports, isLoading } = useQuery<Report[]>({
    queryKey: ["/api/reports"],
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [authLoading, isAuthenticated, setLocation]);

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

  if (authLoading) {
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

  if (!isAuthenticated) {
    return null;
  }

  const getRiskConfig = (level: string) => {
    switch (level) {
      case "critical": 
        return { 
          color: "text-red-400", 
          bg: "bg-red-500/10", 
          border: "border-l-red-500",
          glow: "shadow-red-500/20",
          icon: AlertCircle,
          label: "Критичний"
        };
      case "high": 
        return { 
          color: "text-orange-400", 
          bg: "bg-orange-500/10", 
          border: "border-l-orange-500",
          glow: "shadow-orange-500/20",
          icon: AlertTriangle,
          label: "Високий"
        };
      case "medium": 
        return { 
          color: "text-yellow-400", 
          bg: "bg-yellow-500/10", 
          border: "border-l-yellow-500",
          glow: "shadow-yellow-500/20",
          icon: Clock,
          label: "Середній"
        };
      default: 
        return { 
          color: "text-green-400", 
          bg: "bg-green-500/10", 
          border: "border-l-green-500",
          glow: "shadow-green-500/20",
          icon: CheckCircle,
          label: "Низький"
        };
    }
  };

  const handleDownload = (id: number) => {
    window.open(`/api/reports/${id}/pdf`, '_blank');
  };

  const handleCopyTarget = async (report: Report) => {
    try {
      await navigator.clipboard.writeText(report.target);
      setCopiedId(report.id);
      toast({
        title: "Скопійовано",
        description: "Ціль скопійовано до буферу обміну",
      });
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast({
        title: "Помилка",
        description: "Не вдалося скопіювати",
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

    if (diffMins < 1) return "Щойно";
    if (diffMins < 60) return `${diffMins} хв тому`;
    if (diffHours < 24) return `${diffHours} год тому`;
    if (diffDays < 7) return `${diffDays} д тому`;
    return date.toLocaleDateString('uk-UA');
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
      </div>
      
      <header className="border-b border-white/5 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="hidden sm:flex h-8 w-8 sm:h-9 sm:w-9" data-testid="button-back-dashboard">
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center flex-shrink-0">
                <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black" />
              </div>
              <span className="font-display font-bold text-base sm:text-lg truncate">DARKSHARE</span>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <Button 
              variant="ghost" 
              size="icon"
              className="hidden md:flex h-8 w-8 text-muted-foreground"
              onClick={() => window.open('/api/reports/export/json', '_blank')}
              data-testid="button-export-json"
            >
              <FileJson className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              className="hidden md:flex h-8 w-8 text-muted-foreground"
              onClick={() => window.open('/api/reports/export/csv', '_blank')}
              data-testid="button-export-csv"
            >
              <FileSpreadsheet className="w-4 h-4" />
            </Button>
            <Link href="/dashboard">
              <Button size="sm" className="hidden sm:flex gap-1.5 text-xs sm:text-sm h-8" data-testid="button-new-check">
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden md:inline">Нова перевірка</span>
                <span className="inline md:hidden">Нова</span>
              </Button>
            </Link>
            <MobileMenu lang="UA" isAuthenticated={true} username={user?.username} tier={user?.tier} />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-3 py-4 sm:px-4 sm:py-6 relative z-10 space-y-4 sm:space-y-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3"
        >
          <motion.div 
            whileHover={{ scale: 1.02, y: -2 }}
            className="p-2.5 sm:p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 group hover:border-primary/30 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              <div className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs text-green-400">
                <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                <span>+12%</span>
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-bold font-display">{stats.total}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Всього перевірок</p>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02, y: -2 }}
            className="p-2.5 sm:p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 group hover:border-cyan-500/30 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
            </div>
            <p className="text-xl sm:text-2xl font-bold font-display">{stats.thisWeek}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Цього тижня</p>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02, y: -2 }}
            className="p-2.5 sm:p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 group hover:border-red-500/30 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
            </div>
            <p className="text-xl sm:text-2xl font-bold font-display">{stats.critical}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Критичних ризиків</p>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02, y: -2 }}
            className="p-2.5 sm:p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 group hover:border-purple-500/30 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <Download className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
            </div>
            <p className="text-xl sm:text-2xl font-bold font-display">{stats.downloads}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Завантажено PDF</p>
          </motion.div>
        </motion.div>

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
                placeholder="Пошук по цілі..."
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
              <p className="text-xs sm:text-sm text-muted-foreground">Завантаження історії...</p>
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
                    className={`group relative p-2.5 sm:p-4 rounded-xl bg-white/[0.03] backdrop-blur-sm border border-white/10 
                      hover:bg-white/[0.06] hover:border-white/20 hover:shadow-lg hover:${riskConfig.glow}
                      transition-all duration-300 cursor-pointer border-l-2 ${riskConfig.border}`}
                    data-testid={`report-item-${report.id}`}
                  >
                    <div className="flex items-center gap-2 sm:gap-4">
                      <motion.div 
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className={`w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg flex-shrink-0`}
                      >
                        <TypeIcon className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                      </motion.div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                          <p className="font-mono text-xs sm:text-sm font-medium truncate max-w-[120px] sm:max-w-none">{report.target}</p>
                          <Badge variant="outline" className="text-[9px] sm:text-[10px] uppercase tracking-wider opacity-60 hidden sm:inline-flex">
                            {report.type}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-muted-foreground">
                          <span>{formatDate(report.createdAt)}</span>
                          <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-white/20" />
                          <span className="hidden sm:inline">{new Date(report.createdAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}</span>
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
                            onClick={(e) => { e.stopPropagation(); handleDownload(report.id); }}
                            data-testid={`button-download-${report.id}`}
                          >
                            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </Button>
                          <Link href="/dashboard">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 sm:h-8 sm:w-8 hidden sm:flex"
                              data-testid={`button-view-${report.id}`}
                            >
                              <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </Button>
                          </Link>
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
              <p className="text-base sm:text-lg font-medium mb-1">Нічого не знайдено</p>
              <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">Спробуйте змінити фільтри або пошуковий запит</p>
              <Button 
                variant="outline"
                size="sm"
                onClick={() => { setSearchQuery(""); setRiskFilter("all"); setDateFilter("all"); }}
                data-testid="button-clear-filters"
              >
                Очистити фільтри
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
              
              <h3 className="text-lg sm:text-xl font-display font-bold mb-1.5 sm:mb-2">Історія порожня</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6 max-w-sm mx-auto">
                Виконайте вашу першу перевірку щоб побачити результати тут
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
                      Почати перевірку
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-primary via-emerald-400 to-primary bg-[length:200%_100%] animate-[shimmer_2s_linear_infinite] opacity-0 group-hover:opacity-100 transition-opacity" />
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
            Показано {filteredReports.length} з {reports?.length || 0} записів
          </motion.p>
        )}
      </main>
    </div>
  );
}
