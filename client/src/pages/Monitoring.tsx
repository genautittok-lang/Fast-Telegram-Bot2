import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, 
  Eye, 
  ArrowLeft,
  Globe,
  Wallet,
  Mail,
  Phone,
  Building,
  Link2,
  Plus,
  Trash2,
  Activity,
  Loader2,
  AlertCircle,
  Bell,
  Clock,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Link, useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { MobileMenu } from "@/components/MobileMenu";

interface Watch {
  id: number;
  objectType: string;
  value: string;
  status: string;
  lastCheck: string | null;
  createdAt: string;
  riskScore?: number;
  previousRiskScore?: number;
}

const typeConfig: Record<string, {
  icon: any;
  label: string;
  gradient: string;
  borderColor: string;
  bgGradient: string;
  iconBg: string;
}> = {
  ip: {
    icon: Globe,
    label: "IP Address",
    gradient: "from-blue-500 to-cyan-400",
    borderColor: "border-l-blue-500",
    bgGradient: "from-blue-500/20 via-blue-500/5 to-transparent",
    iconBg: "bg-gradient-to-br from-blue-500/30 to-cyan-500/20",
  },
  wallet: {
    icon: Wallet,
    label: "Wallet",
    gradient: "from-orange-500 to-amber-400",
    borderColor: "border-l-orange-500",
    bgGradient: "from-orange-500/20 via-orange-500/5 to-transparent",
    iconBg: "bg-gradient-to-br from-orange-500/30 to-amber-500/20",
  },
  email: {
    icon: Mail,
    label: "Email",
    gradient: "from-purple-500 to-pink-400",
    borderColor: "border-l-purple-500",
    bgGradient: "from-purple-500/20 via-purple-500/5 to-transparent",
    iconBg: "bg-gradient-to-br from-purple-500/30 to-pink-500/20",
  },
  phone: {
    icon: Phone,
    label: "Phone",
    gradient: "from-green-500 to-emerald-400",
    borderColor: "border-l-green-500",
    bgGradient: "from-green-500/20 via-green-500/5 to-transparent",
    iconBg: "bg-gradient-to-br from-green-500/30 to-emerald-500/20",
  },
  domain: {
    icon: Building,
    label: "Domain",
    gradient: "from-indigo-500 to-violet-400",
    borderColor: "border-l-indigo-500",
    bgGradient: "from-indigo-500/20 via-indigo-500/5 to-transparent",
    iconBg: "bg-gradient-to-br from-indigo-500/30 to-violet-500/20",
  },
  url: {
    icon: Link2,
    label: "URL",
    gradient: "from-red-500 to-rose-400",
    borderColor: "border-l-red-500",
    bgGradient: "from-red-500/20 via-red-500/5 to-transparent",
    iconBg: "bg-gradient-to-br from-red-500/30 to-rose-500/20",
  },
};

const formatTimeAgo = (dateString: string | null) => {
  if (!dateString) return "Очікує";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "щойно";
  if (diffMins < 60) return `${diffMins} хв тому`;
  if (diffHours < 24) return `${diffHours} год тому`;
  return `${diffDays} д тому`;
};

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  gradient,
  delay = 0 
}: { 
  icon: any; 
  label: string; 
  value: string | number; 
  gradient: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="relative group"
    >
      <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl blur-xl -z-10"
        style={{ background: `linear-gradient(135deg, ${gradient})` }} />
      <div className="relative p-4 rounded-xl bg-white/[0.03] backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold font-display">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function MonitorCardSkeleton() {
  return (
    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
      <div className="flex items-center gap-4">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
    </div>
  );
}

function MonitorCard({ 
  watch, 
  index, 
  onDelete, 
  isDeleting 
}: { 
  watch: Watch; 
  index: number; 
  onDelete: () => void; 
  isDeleting: boolean;
}) {
  const config = typeConfig[watch.objectType] || typeConfig.ip;
  const TypeIcon = config.icon;
  const isActive = watch.status === 'active';
  
  const getRiskTrend = () => {
    if (watch.riskScore === undefined || watch.previousRiskScore === undefined) return null;
    if (watch.riskScore > watch.previousRiskScore) return { icon: TrendingUp, color: "text-red-400", label: "Зріс" };
    if (watch.riskScore < watch.previousRiskScore) return { icon: TrendingDown, color: "text-green-400", label: "Знизився" };
    return { icon: Minus, color: "text-muted-foreground", label: "Стабільний" };
  };
  
  const trend = getRiskTrend();

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20, scale: 0.95 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="group relative"
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-gradient-to-b ${config.gradient}`} />
      <div className={`relative ml-1 p-4 rounded-r-xl rounded-l-none bg-gradient-to-r ${config.bgGradient} border border-white/5 hover:border-white/15 transition-all duration-300 hover:translate-x-1 hover:shadow-lg hover:shadow-black/20`}>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl ${config.iconBg} flex items-center justify-center border border-white/10`}>
            <TypeIcon className={`w-6 h-6 bg-gradient-to-r ${config.gradient} bg-clip-text`} style={{ color: 'transparent', WebkitBackgroundClip: 'text', backgroundImage: `linear-gradient(135deg, var(--tw-gradient-stops))` }} />
            <TypeIcon className={`w-6 h-6 absolute opacity-80`} style={{ color: config.gradient.includes('blue') ? '#3b82f6' : config.gradient.includes('orange') ? '#f97316' : config.gradient.includes('purple') ? '#a855f7' : config.gradient.includes('green') ? '#22c55e' : config.gradient.includes('indigo') ? '#6366f1' : '#ef4444' }} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-mono text-sm truncate max-w-[200px] sm:max-w-none">{watch.value}</p>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-white/20 text-muted-foreground">
                {config.label}
              </Badge>
            </div>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTimeAgo(watch.lastCheck)}
              </span>
              {trend && (
                <span className={`flex items-center gap-1 ${trend.color}`}>
                  <trend.icon className="w-3 h-3" />
                  {trend.label}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              {isActive && (
                <span className="absolute inset-0 rounded-full bg-green-500/30 animate-ping" />
              )}
              <Badge className={`relative ${isActive 
                ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                : 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
              } border`}>
                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isActive ? 'bg-green-400' : 'bg-zinc-400'}`} />
                {isActive ? 'Активний' : 'Пауза'}
              </Badge>
            </div>
            
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onDelete}
              disabled={isDeleting}
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              data-testid={`button-delete-${watch.id}`}
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function Monitoring() {
  const [newType, setNewType] = useState("ip");
  const [newValue, setNewValue] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [faqOpen, setFaqOpen] = useState(false);
  const { toast } = useToast();
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const { data: watches, isLoading } = useQuery<Watch[]>({
    queryKey: ["/api/watches"],
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  const createMutation = useMutation({
    mutationFn: async ({ type, value }: { type: string; value: string }) => {
      const res = await apiRequest("POST", "/api/watches", { type, value });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/watches"] });
      setNewValue("");
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      toast({
        title: "Монітор створено",
        description: "Об'єкт додано до моніторингу",
      });
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося створити монітор",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/watches/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/watches"] });
      toast({
        title: "Видалено",
        description: "Монітор видалено",
      });
    },
  });

  const handleCreate = () => {
    if (!newValue.trim()) {
      toast({
        title: "Помилка",
        description: "Введіть значення для моніторингу",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate({ type: newType, value: newValue.trim() });
  };

  const activeCount = watches?.filter(w => w.status === 'active').length || 0;
  const lastAlert = watches?.[0]?.lastCheck || null;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
            <Shield className="w-5 h-5 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-sm text-muted-foreground">Завантаження...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const currentTypeConfig = typeConfig[newType] || typeConfig.ip;
  const CurrentTypeIcon = currentTypeConfig.icon;

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-primary/10 via-primary/5 to-transparent blur-3xl" />
      </div>
      
      <header className="border-b border-white/5 bg-background/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="hidden sm:flex" data-testid="button-back-dashboard">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20">
                <Activity className="w-4 h-4 text-primary" />
              </div>
              <span className="font-display font-bold text-lg">Моніторинг</span>
            </div>
          </div>
          <MobileMenu lang="UA" isAuthenticated={true} />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 relative z-10 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            icon={Eye}
            label="Активних моніторів"
            value={isLoading ? "..." : activeCount}
            gradient="from-primary/80 to-emerald-500/80"
            delay={0}
          />
          <StatCard
            icon={Bell}
            label="Сповіщень за тиждень"
            value={0}
            gradient="from-amber-500/80 to-orange-500/80"
            delay={0.1}
          />
          <StatCard
            icon={Clock}
            label="Останнє сповіщення"
            value={lastAlert ? formatTimeAgo(lastAlert) : "—"}
            gradient="from-blue-500/80 to-cyan-500/80"
            delay={0.2}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/5 rounded-2xl blur-xl" />
          <div className="relative p-5 rounded-2xl bg-white/[0.02] backdrop-blur-sm border border-white/10">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-primary" />
              <h2 className="font-display font-semibold">Додати новий монітор</h2>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={newType} onValueChange={setNewType}>
                <SelectTrigger 
                  className={`w-full sm:w-44 bg-white/5 border-white/10 focus:border-white/30 focus:ring-2 focus:ring-primary/20 transition-all duration-300`}
                  data-testid="select-monitor-type"
                >
                  <SelectValue placeholder="Виберіть тип" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(typeConfig).map(([key, cfg]) => {
                    const Icon = cfg.icon;
                    return (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          {cfg.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              
              <div className="relative flex-1">
                <Input
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder="Введіть значення для моніторингу..."
                  className="bg-white/5 border-white/10 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-300 pr-10"
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  data-testid="input-monitor-value"
                />
                <AnimatePresence>
                  {showSuccess && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              <Button 
                onClick={handleCreate} 
                disabled={createMutation.isPending}
                className={`relative overflow-hidden bg-gradient-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-500/90 border-0 ${!createMutation.isPending && 'animate-subtle-pulse'}`}
                data-testid="button-create-monitor"
              >
                {createMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Додати
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" />
              Активні монітори
            </h2>
            {watches && watches.length > 0 && (
              <Badge variant="outline" className="text-xs border-white/20">
                {watches.length} об'єкт{watches.length === 1 ? '' : watches.length < 5 ? 'и' : 'ів'}
              </Badge>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <MonitorCardSkeleton key={i} />
              ))}
            </div>
          ) : watches && watches.length > 0 ? (
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {watches.map((watch, idx) => (
                  <MonitorCard
                    key={watch.id}
                    watch={watch}
                    index={idx}
                    onDelete={() => deleteMutation.mutate(watch.id)}
                    isDeleting={deleteMutation.isPending}
                  />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16 rounded-2xl bg-white/[0.02] border border-white/5"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
                <Eye className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <p className="text-muted-foreground">Немає активних моніторів</p>
              <p className="text-sm text-muted-foreground/60 mt-1">Додайте об'єкт для відстеження змін</p>
            </motion.div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <div className="relative p-[1px] rounded-2xl bg-gradient-to-r from-primary/50 via-primary/20 to-primary/50">
            <div className="rounded-2xl bg-background p-5">
              <Collapsible open={faqOpen} onOpenChange={setFaqOpen}>
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Zap className="w-4 h-4 text-primary" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-sm">Як працює моніторинг?</p>
                        <p className="text-xs text-muted-foreground">Дізнайтесь більше про можливості</p>
                      </div>
                    </div>
                    <motion.div
                      animate={{ rotate: faqOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    </motion.div>
                  </div>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <div className="mt-4 pt-4 border-t border-white/5 space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-4 h-4 text-blue-400" />
                          <span className="text-sm font-medium">Автоматичні перевірки</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Система автоматично перевіряє додані об'єкти кожні 5 хвилин на зміни рівня ризику.
                        </p>
                      </div>
                      
                      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                        <div className="flex items-center gap-2 mb-2">
                          <Bell className="w-4 h-4 text-amber-400" />
                          <span className="text-sm font-medium">Миттєві сповіщення</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          При зміні рівня ризику ви отримаєте сповіщення в Telegram та на email.
                        </p>
                      </div>
                      
                      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="w-4 h-4 text-green-400" />
                          <span className="text-sm font-medium">Трекінг трендів</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Відстежуйте як змінюється рівень ризику об'єктів з часом для прийняття рішень.
                        </p>
                      </div>
                      
                      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                        <div className="flex items-center gap-2 mb-2">
                          <Shield className="w-4 h-4 text-purple-400" />
                          <span className="text-sm font-medium">Безпека даних</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Всі дані моніторингу зберігаються в зашифрованому вигляді та недоступні третім особам.
                        </p>
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
