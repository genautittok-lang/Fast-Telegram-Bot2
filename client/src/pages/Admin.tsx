import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Shield,
  Users,
  FileText,
  Activity,
  CreditCard,
  Ticket,
  Settings,
  Plus,
  Trash2,
  Ban,
  Check,
  X,
  Loader2,
  RefreshCw,
  Shuffle,
  Calendar,
  Crown,
  Zap,
  ShieldAlert,
  ArrowLeft,
  DollarSign,
  Save,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { uk } from "date-fns/locale";

interface AdminStats {
  totalUsers: number;
  totalReports: number;
  activeWatches: number;
  pendingPayments: number;
}

interface Coupon {
  id: number;
  code: string;
  type: "checks" | "tier";
  value: number;
  tier: string | null;
  maxUses: number;
  usedCount: number;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
}

interface PaymentSettings {
  proPrice: string;
  enterprisePrice: string;
}

interface PendingPayment {
  id: number;
  userId: number;
  username: string | null;
  tier: string;
  amountUsdt: string;
  txHash: string | null;
  status: string;
  createdAt: string;
}

function StatCardSkeleton() {
  return (
    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
      <div className="flex items-center gap-3 mb-2">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="h-8 w-16" />
    </div>
  );
}

function generateCouponCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "DS-";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default function Admin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClientInstance = useQueryClient();

  const [couponForm, setCouponForm] = useState({
    code: "",
    type: "checks" as "checks" | "tier",
    value: 10,
    tier: "PRO",
    maxUses: 100,
    expiresAt: null as Date | null,
  });

  const [settingsForm, setSettingsForm] = useState({
    proPrice: "10",
    enterprisePrice: "50",
  });

  const { data: isAdmin, isLoading: adminLoading, error: adminError } = useQuery<boolean>({
    queryKey: ["/api/admin/verify"],
    retry: false,
  });

  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    enabled: !!isAdmin,
  });

  const { data: coupons, isLoading: couponsLoading } = useQuery<Coupon[]>({
    queryKey: ["/api/admin/coupons"],
    enabled: !!isAdmin,
  });

  const { data: settings, isLoading: settingsLoading } = useQuery<PaymentSettings>({
    queryKey: ["/api/admin/settings"],
    enabled: !!isAdmin,
  });

  const { data: pendingPayments, isLoading: paymentsLoading } = useQuery<PendingPayment[]>({
    queryKey: ["/api/admin/payments"],
    enabled: !!isAdmin,
  });

  useEffect(() => {
    if (settings) {
      setSettingsForm({
        proPrice: settings.proPrice,
        enterprisePrice: settings.enterprisePrice,
      });
    }
  }, [settings]);

  const createCouponMutation = useMutation({
    mutationFn: async (data: typeof couponForm) => {
      const res = await apiRequest("POST", "/api/admin/coupons", {
        ...data,
        expiresAt: data.expiresAt?.toISOString() || null,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClientInstance.invalidateQueries({ queryKey: ["/api/admin/coupons"] });
      toast({ title: "Успіх", description: "Купон створено" });
      setCouponForm({
        code: "",
        type: "checks",
        value: 10,
        tier: "PRO",
        maxUses: 100,
        expiresAt: null,
      });
    },
    onError: (error: Error) => {
      toast({ title: "Помилка", description: error.message, variant: "destructive" });
    },
  });

  const deleteCouponMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/coupons/${id}`);
    },
    onSuccess: () => {
      queryClientInstance.invalidateQueries({ queryKey: ["/api/admin/coupons"] });
      toast({ title: "Успіх", description: "Купон видалено" });
    },
    onError: (error: Error) => {
      toast({ title: "Помилка", description: error.message, variant: "destructive" });
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: PaymentSettings) => {
      await apiRequest("POST", "/api/admin/settings", data);
    },
    onSuccess: () => {
      queryClientInstance.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({ title: "Успіх", description: "Налаштування збережено" });
    },
    onError: (error: Error) => {
      toast({ title: "Помилка", description: error.message, variant: "destructive" });
    },
  });

  const approvePaymentMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/admin/payments/${id}/approve`);
    },
    onSuccess: () => {
      queryClientInstance.invalidateQueries({ queryKey: ["/api/admin/payments"] });
      queryClientInstance.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Успіх", description: "Платіж підтверджено" });
    },
    onError: (error: Error) => {
      toast({ title: "Помилка", description: error.message, variant: "destructive" });
    },
  });

  const rejectPaymentMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/admin/payments/${id}/reject`);
    },
    onSuccess: () => {
      queryClientInstance.invalidateQueries({ queryKey: ["/api/admin/payments"] });
      queryClientInstance.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Успіх", description: "Платіж відхилено" });
    },
    onError: (error: Error) => {
      toast({ title: "Помилка", description: error.message, variant: "destructive" });
    },
  });

  if (adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <Shield className="w-6 h-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-muted-foreground font-mono text-sm">Перевірка доступу...</p>
        </div>
      </div>
    );
  }

  if (adminError || !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <div className="w-20 h-20 mx-auto rounded-full bg-red-500/10 flex items-center justify-center">
            <ShieldAlert className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-red-400">Доступ заборонено</h1>
          <p className="text-muted-foreground">У вас немає прав адміністратора</p>
          <Link href="/dashboard">
            <Button variant="outline" className="gap-2" data-testid="button-back-dashboard">
              <ArrowLeft className="w-4 h-4" />
              Повернутися
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  const statsCards = [
    {
      label: "Користувачі",
      value: stats?.totalUsers ?? 0,
      icon: Users,
      gradient: "from-blue-500/20 to-cyan-500/10",
      iconColor: "text-blue-400",
    },
    {
      label: "Звіти",
      value: stats?.totalReports ?? 0,
      icon: FileText,
      gradient: "from-purple-500/20 to-pink-500/10",
      iconColor: "text-purple-400",
    },
    {
      label: "Моніторинг",
      value: stats?.activeWatches ?? 0,
      icon: Activity,
      gradient: "from-green-500/20 to-emerald-500/10",
      iconColor: "text-green-400",
    },
    {
      label: "Очікують оплату",
      value: stats?.pendingPayments ?? 0,
      icon: CreditCard,
      gradient: "from-orange-500/20 to-yellow-500/10",
      iconColor: "text-orange-400",
    },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      <header className="border-b border-white/5 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="h-9 w-9" data-testid="button-back">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center">
                <Shield className="w-4 h-4 text-black" />
              </div>
              <span className="font-display font-bold text-lg">ADMIN</span>
            </div>
          </div>
          <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30">
            <ShieldAlert className="w-3 h-3 mr-1" />
            Адміністратор
          </Badge>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 relative z-10 space-y-6">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Статистика
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {statsLoading
              ? Array(4)
                  .fill(0)
                  .map((_, i) => <StatCardSkeleton key={i} />)
              : statsCards.map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={`p-4 rounded-xl bg-gradient-to-br ${stat.gradient} border border-white/10 hover:border-white/20 transition-all`}
                    data-testid={`stat-${stat.label.toLowerCase()}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center ${stat.iconColor}`}>
                        <stat.icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs text-muted-foreground">{stat.label}</span>
                    </div>
                    <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
                  </motion.div>
                ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Ticket className="w-5 h-5 text-primary" />
            Керування купонами
          </h2>

          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-base">Новий купон</CardTitle>
              <CardDescription>Створіть новий промокод для користувачів</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Код</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="DS-XXXXXXXX"
                      value={couponForm.code}
                      onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                      className="bg-white/5 border-white/10"
                      data-testid="input-coupon-code"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCouponForm({ ...couponForm, code: generateCouponCode() })}
                      data-testid="button-generate-code"
                    >
                      <Shuffle className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Тип</label>
                  <Select
                    value={couponForm.type}
                    onValueChange={(v: "checks" | "tier") => setCouponForm({ ...couponForm, type: v })}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10" data-testid="select-coupon-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="checks">Перевірки</SelectItem>
                      <SelectItem value="tier">Підписка</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {couponForm.type === "checks" && (
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Кількість перевірок</label>
                    <Input
                      type="number"
                      min={1}
                      value={couponForm.value}
                      onChange={(e) => setCouponForm({ ...couponForm, value: parseInt(e.target.value) || 0 })}
                      className="bg-white/5 border-white/10"
                      data-testid="input-coupon-value"
                    />
                  </div>
                )}

                {couponForm.type === "tier" && (
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Рівень підписки</label>
                    <Select
                      value={couponForm.tier}
                      onValueChange={(v) => setCouponForm({ ...couponForm, tier: v })}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10" data-testid="select-coupon-tier">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PRO">PRO</SelectItem>
                        <SelectItem value="ENTERPRISE">ENTERPRISE</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Макс. використань</label>
                  <Input
                    type="number"
                    min={1}
                    value={couponForm.maxUses}
                    onChange={(e) => setCouponForm({ ...couponForm, maxUses: parseInt(e.target.value) || 0 })}
                    className="bg-white/5 border-white/10"
                    data-testid="input-coupon-maxuses"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Термін дії (опціонально)</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal bg-white/5 border-white/10"
                        data-testid="button-coupon-expiry"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {couponForm.expiresAt ? format(couponForm.expiresAt, "dd.MM.yyyy", { locale: uk }) : "Без обмежень"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={couponForm.expiresAt || undefined}
                        onSelect={(date) => setCouponForm({ ...couponForm, expiresAt: date || null })}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                      {couponForm.expiresAt && (
                        <div className="p-2 border-t border-white/10">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full"
                            onClick={() => setCouponForm({ ...couponForm, expiresAt: null })}
                          >
                            Очистити
                          </Button>
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="flex items-end">
                  <Button
                    onClick={() => createCouponMutation.mutate(couponForm)}
                    disabled={!couponForm.code || createCouponMutation.isPending}
                    className="w-full gap-2"
                    data-testid="button-create-coupon"
                  >
                    {createCouponMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    Створити
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-base">Активні купони</CardTitle>
            </CardHeader>
            <CardContent>
              {couponsLoading ? (
                <div className="space-y-2">
                  {Array(3)
                    .fill(0)
                    .map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                </div>
              ) : !coupons?.length ? (
                <p className="text-center text-muted-foreground py-8">Немає купонів</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10">
                        <TableHead>Код</TableHead>
                        <TableHead>Тип</TableHead>
                        <TableHead>Значення</TableHead>
                        <TableHead className="hidden md:table-cell">Використано</TableHead>
                        <TableHead className="hidden md:table-cell">Статус</TableHead>
                        <TableHead className="hidden lg:table-cell">Термін</TableHead>
                        <TableHead className="text-right">Дії</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {coupons.map((coupon) => (
                        <TableRow key={coupon.id} className="border-white/10" data-testid={`coupon-row-${coupon.id}`}>
                          <TableCell className="font-mono text-sm">{coupon.code}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={coupon.type === "tier" ? "bg-purple-500/10 text-purple-400 border-purple-500/30" : "bg-blue-500/10 text-blue-400 border-blue-500/30"}>
                              {coupon.type === "tier" ? <Crown className="w-3 h-3 mr-1" /> : <Zap className="w-3 h-3 mr-1" />}
                              {coupon.type === "tier" ? "Підписка" : "Перевірки"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {coupon.type === "tier" ? coupon.tier : `+${coupon.value}`}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {coupon.usedCount} / {coupon.maxUses}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {coupon.isActive ? (
                              <Badge className="bg-green-500/10 text-green-400 border-green-500/30">Активний</Badge>
                            ) : (
                              <Badge className="bg-zinc-500/10 text-zinc-400 border-zinc-500/30">Неактивний</Badge>
                            )}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                            {coupon.expiresAt ? format(new Date(coupon.expiresAt), "dd.MM.yyyy") : "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              onClick={() => deleteCouponMutation.mutate(coupon.id)}
                              disabled={deleteCouponMutation.isPending}
                              data-testid={`button-delete-coupon-${coupon.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            Налаштування цін
          </h2>

          <Card className="border-white/10 bg-white/5">
            <CardContent className="pt-6">
              {settingsLoading ? (
                <div className="flex gap-4">
                  <Skeleton className="h-10 flex-1" />
                  <Skeleton className="h-10 flex-1" />
                  <Skeleton className="h-10 w-24" />
                </div>
              ) : (
                <div className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-1 space-y-2">
                    <label className="text-sm text-muted-foreground flex items-center gap-2">
                      <Crown className="w-4 h-4 text-blue-400" />
                      PRO ціна (USDT)
                    </label>
                    <Input
                      type="number"
                      min={1}
                      value={settingsForm.proPrice}
                      onChange={(e) => setSettingsForm({ ...settingsForm, proPrice: e.target.value })}
                      className="bg-white/5 border-white/10"
                      data-testid="input-pro-price"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <label className="text-sm text-muted-foreground flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-purple-400" />
                      ENTERPRISE ціна (USDT)
                    </label>
                    <Input
                      type="number"
                      min={1}
                      value={settingsForm.enterprisePrice}
                      onChange={(e) => setSettingsForm({ ...settingsForm, enterprisePrice: e.target.value })}
                      className="bg-white/5 border-white/10"
                      data-testid="input-enterprise-price"
                    />
                  </div>
                  <Button
                    onClick={() => updateSettingsMutation.mutate(settingsForm)}
                    disabled={updateSettingsMutation.isPending}
                    className="gap-2"
                    data-testid="button-save-settings"
                  >
                    {updateSettingsMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Зберегти
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Очікуючі платежі
          </h2>

          <Card className="border-white/10 bg-white/5">
            <CardContent className="pt-6">
              {paymentsLoading ? (
                <div className="space-y-2">
                  {Array(3)
                    .fill(0)
                    .map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                </div>
              ) : !pendingPayments?.length ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 mx-auto text-green-400 mb-3" />
                  <p className="text-muted-foreground">Немає очікуючих платежів</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10">
                        <TableHead>Користувач</TableHead>
                        <TableHead>Підписка</TableHead>
                        <TableHead>Сума</TableHead>
                        <TableHead className="hidden md:table-cell">TX Hash</TableHead>
                        <TableHead className="hidden md:table-cell">Дата</TableHead>
                        <TableHead className="text-right">Дії</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingPayments.map((payment) => (
                        <TableRow key={payment.id} className="border-white/10" data-testid={`payment-row-${payment.id}`}>
                          <TableCell className="font-medium">{payment.username}</TableCell>
                          <TableCell>
                            <Badge
                              className={
                                payment.tier === "ENTERPRISE"
                                  ? "bg-purple-500/10 text-purple-400 border-purple-500/30"
                                  : "bg-blue-500/10 text-blue-400 border-blue-500/30"
                              }
                            >
                              {payment.tier}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono">
                            ${payment.amountUsdt} USDT
                          </TableCell>
                          <TableCell className="hidden md:table-cell font-mono text-xs text-muted-foreground max-w-[150px] truncate">
                            {payment.txHash || "—"}
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                            {format(new Date(payment.createdAt), "dd.MM.yyyy HH:mm")}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-green-400 hover:text-green-300 hover:bg-green-500/10"
                                onClick={() => approvePaymentMutation.mutate(payment.id)}
                                disabled={approvePaymentMutation.isPending}
                                data-testid={`button-approve-payment-${payment.id}`}
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                onClick={() => rejectPaymentMutation.mutate(payment.id)}
                                disabled={rejectPaymentMutation.isPending}
                                data-testid={`button-reject-payment-${payment.id}`}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.section>
      </main>
    </div>
  );
}
