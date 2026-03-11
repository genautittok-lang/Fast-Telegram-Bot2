import { useState, useEffect, useRef } from "react";
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
  Check,
  X,
  Loader2,
  Shuffle,
  Calendar,
  Crown,
  Zap,
  ShieldAlert,
  ArrowLeft,
  Save,
  CheckCircle,
  MessageSquare,
  Mail,
  Search,
  UserCheck,
  UserX,
  Send,
  MessagesSquare,
  ChevronRight,
  MoreHorizontal,
  Eye,
  Hash,
  TrendingUp,
  Clock,
  AlertCircle,
  ArrowUpRight,
  Download,
  LogIn,
  UserPlus,
  RefreshCw,
  DollarSign,
  BarChart3,
  Bell,
  Server,
  Wifi,
  Database,
  Globe,
  PieChart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Link } from "wouter";
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
  dailyBroadcastEnabled?: boolean;
  dailyBroadcastLastSent?: string | null;
  dailyBroadcastLastReach?: number;
}

interface PaymentRecord {
  id: number;
  userId: number;
  username: string | null;
  tier: string;
  amountUsdt: string;
  txHash: string | null;
  status: string;
  createdAt: string;
}

interface SupportTicketRecord {
  id: number;
  userId: number | null;
  username: string | null;
  name: string;
  contact: string;
  message: string;
  status: string;
  adminReply: string | null;
  source: string;
  createdAt: string;
}

interface AdminUser {
  id: number;
  tgId: string;
  username: string | null;
  tier: string | null;
  requestsLeft: number | null;
  streakDays: number | null;
  blocked: boolean | null;
  createdAt: string | null;
  lastLogin: string | null;
}

interface AdminMessage {
  id: number;
  userId: number;
  message: string;
  sender: string;
  ticketId: number | null;
  createdAt: string;
}

interface Conversation {
  userId: number;
  username: string | null;
  lastMessage: string;
  lastAt: string | null;
  unreadCount: number;
}

interface ActivityLogEntry {
  id: number;
  eventType: string;
  userId: number | null;
  username: string | null;
  details: string | null;
  meta: any;
  createdAt: string | null;
}

interface ActivityLogResponse {
  events: ActivityLogEntry[];
  total: number;
  limit: number;
  offset: number;
}

type AdminTab = "dashboard" | "tickets" | "payments" | "users" | "coupons" | "settings" | "messages" | "activity";

function generateCouponCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "DS-";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "щойно";
  if (mins < 60) return `${mins} хв`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} год`;
  const days = Math.floor(hrs / 24);
  return `${days} д`;
}

export default function Admin() {
  const { toast } = useToast();
  const queryClientInstance = useQueryClient();
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [userSearch, setUserSearch] = useState("");
  const [ticketReply, setTicketReply] = useState<{ id: number; text: string } | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [newConvUserId, setNewConvUserId] = useState("");
  const [newConvMessage, setNewConvMessage] = useState("");
  const [userTierFilter, setUserTierFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [editChecksAmount, setEditChecksAmount] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const { data: isAdminData, isLoading: adminLoading, error: adminError } = useQuery<{ isAdmin: boolean }>({
    queryKey: ["/api/admin/verify"],
    retry: false,
  });
  const isAdmin = isAdminData?.isAdmin;

  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    enabled: !!isAdmin,
  });

  const { data: coupons, isLoading: couponsLoading } = useQuery<Coupon[]>({
    queryKey: ["/api/admin/coupons"],
    enabled: !!isAdmin && activeTab === "coupons",
  });

  const { data: settings, isLoading: settingsLoading } = useQuery<PaymentSettings>({
    queryKey: ["/api/admin/settings"],
    enabled: !!isAdmin && activeTab === "settings",
  });

  const { data: revenueData } = useQuery<{ totalRevenue: number; monthlyRevenue: number; paymentsByTier: Record<string, number> }>({
    queryKey: ["/api/admin/revenue"],
    enabled: !!isAdmin && activeTab === "dashboard",
  });

  const { data: userGrowth } = useQuery<Array<{ date: string; count: number }>>({
    queryKey: ["/api/admin/user-growth"],
    enabled: !!isAdmin && activeTab === "dashboard",
  });

  const [pushTitle, setPushTitle] = useState("");
  const [pushBody, setPushBody] = useState("");

  const pushBroadcastMutation = useMutation({
    mutationFn: async ({ title, body }: { title: string; body: string }) => {
      const res = await apiRequest("POST", "/api/admin/push-broadcast", { title, body });
      return res.json();
    },
    onSuccess: (data: any) => {
      toast({ title: `Push надіслано: ${data.sent} успішних, ${data.failed} невдалих` });
      setPushTitle("");
      setPushBody("");
    },
    onError: (err: Error) => {
      toast({ title: "Помилка push-розсилки", description: err.message, variant: "destructive" });
    },
  });

  const { data: pendingPayments } = useQuery<PaymentRecord[]>({
    queryKey: ["/api/admin/payments"],
    enabled: !!isAdmin,
  });

  const { data: allPayments, isLoading: allPaymentsLoading } = useQuery<PaymentRecord[]>({
    queryKey: ["/api/admin/payments/all"],
    enabled: !!isAdmin && activeTab === "payments",
  });

  const { data: tickets, isLoading: ticketsLoading } = useQuery<SupportTicketRecord[]>({
    queryKey: ["/api/admin/tickets"],
    enabled: !!isAdmin && (activeTab === "tickets" || activeTab === "dashboard"),
  });

  const { data: allUsers, isLoading: usersLoading } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
    enabled: !!isAdmin && (activeTab === "users" || activeTab === "messages"),
  });

  const { data: conversations, isLoading: convsLoading } = useQuery<Conversation[]>({
    queryKey: ["/api/admin/conversations"],
    enabled: !!isAdmin && activeTab === "messages",
    refetchInterval: 10000,
  });

  const { data: chatMessages, isLoading: chatLoading } = useQuery<AdminMessage[]>({
    queryKey: ["/api/admin/messages", selectedConversation],
    enabled: !!isAdmin && !!selectedConversation,
    refetchInterval: 5000,
  });

  const [activityPage, setActivityPage] = useState(0);
  const ACTIVITY_PAGE_SIZE = 50;

  const { data: activityData, isLoading: activityLoading } = useQuery<ActivityLogResponse>({
    queryKey: ["/api/admin/activity", activityPage],
    queryFn: async () => {
      const res = await fetch(`/api/admin/activity?limit=${ACTIVITY_PAGE_SIZE}&offset=${activityPage * ACTIVITY_PAGE_SIZE}`);
      if (!res.ok) throw new Error("Failed to fetch activity log");
      return res.json();
    },
    enabled: !!isAdmin && activeTab === "activity",
    refetchInterval: 15000,
  });

  useEffect(() => {
    if (settings) {
      setSettingsForm({ proPrice: settings.proPrice, enterprisePrice: settings.enterprisePrice });
    }
  }, [settings]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const createCouponMutation = useMutation({
    mutationFn: async (data: typeof couponForm) => {
      const res = await apiRequest("POST", "/api/admin/coupons", { ...data, expiresAt: data.expiresAt?.toISOString() || null });
      return res.json();
    },
    onSuccess: () => {
      queryClientInstance.invalidateQueries({ queryKey: ["/api/admin/coupons"] });
      toast({ title: "Купон створено" });
      setCouponForm({ code: "", type: "checks", value: 10, tier: "PRO", maxUses: 100, expiresAt: null });
    },
    onError: (error: Error) => { toast({ title: "Помилка", description: error.message, variant: "destructive" }); },
  });

  const deleteCouponMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/admin/coupons/${id}`); },
    onSuccess: () => {
      queryClientInstance.invalidateQueries({ queryKey: ["/api/admin/coupons"] });
      toast({ title: "Купон видалено" });
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: PaymentSettings) => { await apiRequest("POST", "/api/admin/settings", data); },
    onSuccess: () => {
      queryClientInstance.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({ title: "Налаштування збережено" });
    },
  });

  const approvePaymentMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("POST", `/api/admin/payments/${id}/approve`); },
    onSuccess: () => {
      queryClientInstance.invalidateQueries({ queryKey: ["/api/admin/payments"] });
      queryClientInstance.invalidateQueries({ queryKey: ["/api/admin/payments/all"] });
      queryClientInstance.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Платіж підтверджено" });
    },
  });

  const rejectPaymentMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("POST", `/api/admin/payments/${id}/reject`); },
    onSuccess: () => {
      queryClientInstance.invalidateQueries({ queryKey: ["/api/admin/payments"] });
      queryClientInstance.invalidateQueries({ queryKey: ["/api/admin/payments/all"] });
      queryClientInstance.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Платіж відхилено" });
    },
  });

  const updateTicketMutation = useMutation({
    mutationFn: async ({ id, status, adminReply }: { id: number; status: string; adminReply?: string }) => {
      await apiRequest("POST", `/api/admin/tickets/${id}/status`, { status, adminReply });
    },
    onSuccess: () => {
      queryClientInstance.invalidateQueries({ queryKey: ["/api/admin/tickets"] });
      setTicketReply(null);
      toast({ title: "Тікет оновлено" });
    },
  });

  const blockUserMutation = useMutation({
    mutationFn: async ({ userId, blocked }: { userId: number; blocked: boolean }) => {
      await apiRequest("POST", `/api/admin/users/${userId}/block`, { blocked });
    },
    onSuccess: () => {
      queryClientInstance.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Користувача оновлено" });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ userId, message, ticketId }: { userId: number; message: string; ticketId?: number }) => {
      const res = await apiRequest("POST", `/api/admin/messages/${userId}`, { message, ticketId });
      return res.json();
    },
    onSuccess: () => {
      queryClientInstance.invalidateQueries({ queryKey: ["/api/admin/messages", selectedConversation] });
      queryClientInstance.invalidateQueries({ queryKey: ["/api/admin/conversations"] });
      setNewMessage("");
    },
  });

  const changeTierMutation = useMutation({
    mutationFn: async ({ userId, tier }: { userId: number; tier: string }) => {
      await apiRequest("POST", `/api/admin/users/${userId}/tier`, { tier });
    },
    onSuccess: () => {
      queryClientInstance.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Тариф оновлено" });
      setSelectedUser(null);
    },
  });

  const addChecksMutation = useMutation({
    mutationFn: async ({ userId, amount }: { userId: number; amount: number }) => {
      await apiRequest("POST", `/api/admin/users/${userId}/checks`, { amount });
    },
    onSuccess: () => {
      queryClientInstance.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Перевірки додано" });
      setEditChecksAmount("");
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
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-4">
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

  const openTickets = tickets?.filter(t => t.status === "open").length || 0;
  const totalUnread = conversations?.reduce((sum, c) => sum + c.unreadCount, 0) || 0;

  const tabs: { id: AdminTab; label: string; icon: any; count?: number }[] = [
    { id: "dashboard", label: "Огляд", icon: Activity },
    { id: "activity", label: "Активність", icon: TrendingUp },
    { id: "messages", label: "Повідомлення", icon: MessagesSquare, count: totalUnread },
    { id: "tickets", label: "Звернення", icon: MessageSquare, count: openTickets },
    { id: "payments", label: "Платежі", icon: CreditCard, count: pendingPayments?.length },
    { id: "users", label: "Користувачі", icon: Users },
    { id: "coupons", label: "Купони", icon: Ticket },
    { id: "settings", label: "Налаштування", icon: Settings },
  ];

  const statsCards = [
    { label: "Користувачі", value: stats?.totalUsers ?? 0, icon: Users, gradient: "from-blue-500/20 to-cyan-500/10", iconColor: "text-blue-400" },
    { label: "Звіти", value: stats?.totalReports ?? 0, icon: FileText, gradient: "from-purple-500/20 to-pink-500/10", iconColor: "text-purple-400" },
    { label: "Моніторинг", value: stats?.activeWatches ?? 0, icon: Activity, gradient: "from-green-500/20 to-emerald-500/10", iconColor: "text-green-400" },
    { label: "Очікують оплату", value: stats?.pendingPayments ?? 0, icon: CreditCard, gradient: "from-orange-500/20 to-yellow-500/10", iconColor: "text-orange-400" },
    { label: "Відкриті тікети", value: openTickets, icon: AlertCircle, gradient: "from-red-500/20 to-rose-500/10", iconColor: "text-red-400" },
    { label: "Діалоги", value: conversations?.length ?? 0, icon: MessagesSquare, gradient: "from-indigo-500/20 to-violet-500/10", iconColor: "text-indigo-400" },
  ];

  const filteredUsers = allUsers?.filter(u => {
    const matchesSearch = !userSearch || u.username?.toLowerCase().includes(userSearch.toLowerCase()) || u.tgId.includes(userSearch) || u.id.toString().includes(userSearch);
    const matchesTier = userTierFilter === "all" || (u.tier || "FREE") === userTierFilter;
    return matchesSearch && matchesTier;
  }) || [];

  const handleOpenDialog = (userId: number) => {
    setSelectedConversation(userId);
    setActiveTab("messages");
  };

  const handleStartNewConversation = () => {
    if (!newConvUserId || !newConvMessage.trim()) return;
    const userId = parseInt(newConvUserId);
    if (isNaN(userId)) {
      toast({ title: "Невірний ID користувача", variant: "destructive" });
      return;
    }
    sendMessageMutation.mutate({ userId, message: newConvMessage.trim() }, {
      onSuccess: () => {
        setShowNewConversation(false);
        setNewConvUserId("");
        setNewConvMessage("");
        setSelectedConversation(userId);
      }
    });
  };

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
              <Button variant="ghost" size="icon" data-testid="button-back">
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
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:block">darkshare.store@gmail.com</span>
            <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30">
              <ShieldAlert className="w-3 h-3 mr-1" />
              Admin
            </Badge>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-4 relative z-10">
        <div className="flex gap-1 overflow-x-auto pb-2 mb-6 border-b border-white/5 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "bg-primary/10 text-primary border border-primary/30"
                  : "text-muted-foreground hover:text-white hover:bg-white/5 border border-transparent"
              }`}
              data-testid={`tab-${tab.id}`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <Badge variant="secondary" className="ml-1 bg-red-500/20 text-red-400 border-none text-xs px-1.5 py-0">
                  {tab.count}
                </Badge>
              )}
            </button>
          ))}
        </div>

        <main className="space-y-6 pb-8">
          {activeTab === "dashboard" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {statsLoading
                  ? Array(6).fill(0).map((_, i) => (
                      <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <Skeleton className="h-4 w-20 mb-2" />
                        <Skeleton className="h-8 w-16" />
                      </div>
                    ))
                  : statsCards.map((stat, i) => (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={`p-4 rounded-xl bg-gradient-to-br ${stat.gradient} border border-white/10 hover:border-white/20 transition-colors cursor-default`}
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

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="border-white/10 bg-white/[0.03] backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                      Дохід
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <p className="text-xs text-emerald-300/70">Загальний</p>
                        <p className="text-xl font-bold text-emerald-400">${revenueData?.totalRevenue?.toFixed(0) || '0'}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                        <p className="text-xs text-blue-300/70">За 30 днів</p>
                        <p className="text-xl font-bold text-blue-400">${revenueData?.monthlyRevenue?.toFixed(0) || '0'}</p>
                      </div>
                    </div>
                    {revenueData?.paymentsByTier && Object.keys(revenueData.paymentsByTier).length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">По тарифах</p>
                        {Object.entries(revenueData.paymentsByTier).map(([tier, amount]) => (
                          <div key={tier} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                            <div className="flex items-center gap-2">
                              <Crown className={`w-3.5 h-3.5 ${tier === 'ENTERPRISE' ? 'text-purple-400' : tier === 'PRO' ? 'text-blue-400' : 'text-gray-400'}`} />
                              <span className="text-sm">{tier}</span>
                            </div>
                            <span className="text-sm font-mono font-bold">${(amount as number).toFixed(0)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-white/10 bg-white/[0.03] backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-cyan-400" />
                      Ріст користувачів (30 днів)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {userGrowth && userGrowth.length > 0 ? (
                      <div className="flex items-end gap-[3px] h-28">
                        {userGrowth.map((day, i) => {
                          const maxCount = Math.max(...userGrowth.map(d => d.count), 1);
                          const height = (day.count / maxCount) * 100;
                          return (
                            <motion.div
                              key={day.date}
                              initial={{ height: 0 }}
                              animate={{ height: `${height}%` }}
                              transition={{ delay: i * 0.02, duration: 0.4 }}
                              className="flex-1 bg-gradient-to-t from-cyan-500 to-cyan-300 rounded-t opacity-80 hover:opacity-100 transition-opacity min-w-[4px] relative group"
                              title={`${day.date}: ${day.count} нових`}
                            >
                              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black/90 text-[9px] px-1.5 py-0.5 rounded text-cyan-300 hidden group-hover:block whitespace-nowrap z-10">
                                {day.count}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="h-28 flex items-center justify-center text-sm text-muted-foreground">
                        Немає даних
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="border-white/10 bg-white/[0.03] backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Bell className="w-4 h-4 text-orange-400" />
                      Push-розсилка
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Надіслати push-сповіщення всім підписникам
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Input
                        placeholder="Заголовок"
                        value={pushTitle}
                        onChange={(e) => setPushTitle(e.target.value)}
                        className="bg-white/5 border-white/10"
                        data-testid="input-push-title"
                      />
                      <Textarea
                        placeholder="Текст повідомлення"
                        value={pushBody}
                        onChange={(e) => setPushBody(e.target.value)}
                        className="bg-white/5 border-white/10 min-h-[60px]"
                        data-testid="input-push-body"
                      />
                      <Button
                        onClick={() => pushBroadcastMutation.mutate({ title: pushTitle, body: pushBody })}
                        disabled={!pushTitle || !pushBody || pushBroadcastMutation.isPending}
                        className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-black font-bold hover:from-orange-600 hover:to-amber-600"
                        data-testid="button-send-push"
                      >
                        {pushBroadcastMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                        Надіслати Push
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-white/10 bg-white/[0.03] backdrop-blur-sm">
                  <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Server className="w-4 h-4 text-green-400" />
                      Система
                    </CardTitle>
                    <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
                      <Wifi className="w-3 h-3 mr-1" />
                      Online
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                        <div className="flex items-center gap-2">
                          <Database className="w-3.5 h-3.5 text-blue-400" />
                          <span className="text-sm">PostgreSQL</span>
                        </div>
                        <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20 text-[10px]">Connected</Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                        <div className="flex items-center gap-2">
                          <Globe className="w-3.5 h-3.5 text-purple-400" />
                          <span className="text-sm">Web Server</span>
                        </div>
                        <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20 text-[10px]">Port 5000</Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                        <div className="flex items-center gap-2">
                          <Shield className="w-3.5 h-3.5 text-cyan-400" />
                          <span className="text-sm">Uptime</span>
                        </div>
                        <span className="text-sm font-mono text-cyan-400">99.9%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-white/10 bg-white/[0.03] backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Download className="w-4 h-4 text-emerald-400" />
                    Посилання на застосунок
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab("activity")}
                    data-testid="button-view-activity"
                  >
                    Активність
                    <ArrowUpRight className="w-3 h-3 ml-1" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                          <Download className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium">PWA Web App</p>
                          <p className="text-xs text-muted-foreground truncate">{window.location.origin}/download</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/download`);
                          toast({ title: "Посилання скопійовано" });
                        }}
                        data-testid="button-copy-download-link"
                      >
                        Копіювати
                      </Button>
                    </div>
                    <div className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                          <MessagesSquare className="w-4 h-4 text-blue-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium">Telegram Bot</p>
                          <p className="text-xs text-muted-foreground truncate">t.me/DarkShareBot</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText("https://t.me/DarkShareBot");
                          toast({ title: "Посилання скопійовано" });
                        }}
                        data-testid="button-copy-bot-link"
                      >
                        Копіювати
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {tickets && tickets.filter(t => t.status === "open").length > 0 && (
                  <Card className="border-white/10 bg-white/5">
                    <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-primary" />
                        Нові звернення ({tickets.filter(t => t.status === "open").length})
                      </CardTitle>
                      <Button variant="outline" size="sm" onClick={() => setActiveTab("tickets")} data-testid="button-view-all-tickets">
                        Переглянути
                        <ArrowUpRight className="w-3 h-3 ml-1" />
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {tickets.filter(t => t.status === "open").slice(0, 4).map((ticket) => (
                          <div key={ticket.id} className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-1 hover:bg-white/8 transition-colors cursor-pointer" onClick={() => { setActiveTab("tickets"); }}>
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <span className="text-sm font-medium">#{ticket.id} {ticket.name}</span>
                              <span className="text-[10px] text-muted-foreground">{timeAgo(ticket.createdAt)}</span>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{ticket.message}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {pendingPayments && pendingPayments.length > 0 && (
                  <Card className="border-white/10 bg-white/5">
                    <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-orange-400" />
                        Очікуючі платежі ({pendingPayments.length})
                      </CardTitle>
                      <Button variant="outline" size="sm" onClick={() => setActiveTab("payments")} data-testid="button-view-all-payments">
                        Переглянути
                        <ArrowUpRight className="w-3 h-3 ml-1" />
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {pendingPayments.slice(0, 4).map((p) => (
                          <div key={p.id} className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between gap-4 flex-wrap">
                            <div>
                              <span className="text-sm font-medium">{p.username || `User #${p.userId}`}</span>
                              <span className="text-xs text-muted-foreground ml-2">{p.tier} - ${p.amountUsdt}</span>
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="text-green-400 h-8 w-8" onClick={() => approvePaymentMutation.mutate(p.id)} data-testid={`button-quick-approve-${p.id}`}>
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="text-red-400 h-8 w-8" onClick={() => rejectPaymentMutation.mutate(p.id)} data-testid={`button-quick-reject-${p.id}`}>
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {conversations && conversations.length > 0 && (
                  <Card className="border-white/10 bg-white/5">
                    <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <MessagesSquare className="w-4 h-4 text-indigo-400" />
                        Останні діалоги
                      </CardTitle>
                      <Button variant="outline" size="sm" onClick={() => setActiveTab("messages")} data-testid="button-view-all-messages">
                        Переглянути
                        <ArrowUpRight className="w-3 h-3 ml-1" />
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {conversations.slice(0, 4).map((conv) => (
                          <div key={conv.userId} className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between gap-3 hover:bg-white/8 transition-colors cursor-pointer" onClick={() => handleOpenDialog(conv.userId)}>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{conv.username || `#${conv.userId}`}</span>
                                {conv.unreadCount > 0 && (
                                  <Badge className="bg-red-500/20 text-red-400 text-[10px] px-1.5 py-0">{conv.unreadCount}</Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground truncate">{conv.lastMessage}</p>
                            </div>
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">{timeAgo(conv.lastAt)}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card className="border-white/10 bg-white/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Zap className="w-4 h-4 text-yellow-400" />
                      Швидкі дії
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm" className="justify-start gap-2" onClick={() => setActiveTab("users")} data-testid="button-quick-users">
                        <Users className="w-3.5 h-3.5" /> Користувачі
                      </Button>
                      <Button variant="outline" size="sm" className="justify-start gap-2" onClick={() => { setActiveTab("messages"); setShowNewConversation(true); }} data-testid="button-quick-message">
                        <Send className="w-3.5 h-3.5" /> Написати
                      </Button>
                      <Button variant="outline" size="sm" className="justify-start gap-2" onClick={() => setActiveTab("coupons")} data-testid="button-quick-coupon">
                        <Ticket className="w-3.5 h-3.5" /> Купони
                      </Button>
                      <Button variant="outline" size="sm" className="justify-start gap-2" onClick={() => setActiveTab("settings")} data-testid="button-quick-settings">
                        <Settings className="w-3.5 h-3.5" /> Налаштування
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}

          {activeTab === "messages" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <MessagesSquare className="w-5 h-5 text-primary" />
                  Діалоги з користувачами
                </h2>
                <Button size="sm" className="gap-2" onClick={() => setShowNewConversation(!showNewConversation)} data-testid="button-new-conversation">
                  <Plus className="w-4 h-4" />
                  Написати
                </Button>
              </div>

              <AnimatePresence>
                {showNewConversation && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                    <Card className="border-primary/30 bg-primary/5">
                      <CardContent className="pt-4 space-y-3">
                        <p className="text-sm font-medium">Новий діалог</p>
                        <div className="flex gap-3 flex-col sm:flex-row">
                          <div className="space-y-1 flex-1">
                            <label className="text-xs text-muted-foreground">User ID</label>
                            <Input value={newConvUserId} onChange={(e) => setNewConvUserId(e.target.value)} placeholder="ID користувача" className="bg-white/5 border-white/10" data-testid="input-conv-user-id" />
                          </div>
                          <div className="space-y-1 flex-[2]">
                            <label className="text-xs text-muted-foreground">Повідомлення</label>
                            <div className="flex gap-2">
                              <Input value={newConvMessage} onChange={(e) => setNewConvMessage(e.target.value)} placeholder="Введіть повідомлення..." className="bg-white/5 border-white/10" onKeyDown={(e) => e.key === "Enter" && handleStartNewConversation()} data-testid="input-conv-message" />
                              <Button onClick={handleStartNewConversation} disabled={sendMessageMutation.isPending} data-testid="button-send-new-conv">
                                {sendMessageMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="border-white/10 bg-white/5 lg:col-span-1">
                  <CardContent className="pt-4 p-3">
                    <div className="space-y-1 max-h-[500px] overflow-y-auto scrollbar-hide">
                      {convsLoading ? (
                        Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full mb-1" />)
                      ) : !conversations?.length ? (
                        <div className="text-center py-8">
                          <MessagesSquare className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">Немає діалогів</p>
                        </div>
                      ) : (
                        conversations.map((conv) => (
                          <div
                            key={conv.userId}
                            onClick={() => setSelectedConversation(conv.userId)}
                            className={`p-3 rounded-lg cursor-pointer transition-all ${
                              selectedConversation === conv.userId
                                ? "bg-primary/10 border border-primary/30"
                                : "hover:bg-white/5 border border-transparent"
                            }`}
                            data-testid={`conv-${conv.userId}`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                                  <Users className="w-4 h-4 text-muted-foreground" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium truncate">{conv.username || `User #${conv.userId}`}</p>
                                  <p className="text-[11px] text-muted-foreground truncate">{conv.lastMessage}</p>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                                <span className="text-[10px] text-muted-foreground">{timeAgo(conv.lastAt)}</span>
                                {conv.unreadCount > 0 && (
                                  <Badge className="bg-red-500 text-white text-[10px] px-1.5 py-0 h-4">{conv.unreadCount}</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-white/10 bg-white/5 lg:col-span-2">
                  <CardContent className="pt-4 p-3 flex flex-col h-[500px]">
                    {!selectedConversation ? (
                      <div className="flex-1 flex items-center justify-center">
                        <div className="text-center space-y-2">
                          <MessagesSquare className="w-12 h-12 mx-auto text-muted-foreground" />
                          <p className="text-muted-foreground">Оберіть діалог</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 pb-3 border-b border-white/10 mb-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {conversations?.find(c => c.userId === selectedConversation)?.username || `User #${selectedConversation}`}
                            </p>
                            <p className="text-[10px] text-muted-foreground">ID: {selectedConversation}</p>
                          </div>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-2 scrollbar-hide pr-1">
                          {chatLoading ? (
                            <div className="flex items-center justify-center h-full">
                              <Loader2 className="w-6 h-6 animate-spin text-primary" />
                            </div>
                          ) : !chatMessages?.length ? (
                            <div className="flex items-center justify-center h-full">
                              <p className="text-sm text-muted-foreground">Немає повідомлень</p>
                            </div>
                          ) : (
                            chatMessages.map((msg) => (
                              <div key={msg.id} className={`flex ${msg.sender === "admin" ? "justify-end" : "justify-start"}`}>
                                <div className={`max-w-[75%] p-2.5 rounded-xl text-sm ${
                                  msg.sender === "admin"
                                    ? "bg-primary/20 border border-primary/30 rounded-br-sm"
                                    : "bg-white/5 border border-white/10 rounded-bl-sm"
                                }`}>
                                  <p className="break-words">{msg.message}</p>
                                  <p className={`text-[10px] mt-1 ${msg.sender === "admin" ? "text-primary/60" : "text-muted-foreground"}`}>
                                    {msg.sender === "admin" ? "Адмін" : "Користувач"} · {msg.createdAt ? format(new Date(msg.createdAt), "HH:mm dd.MM") : ""}
                                  </p>
                                </div>
                              </div>
                            ))
                          )}
                          <div ref={messagesEndRef} />
                        </div>

                        <div className="flex gap-2 pt-3 border-t border-white/10 mt-3">
                          <Input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Написати повідомлення..."
                            className="bg-white/5 border-white/10"
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && newMessage.trim()) {
                                sendMessageMutation.mutate({ userId: selectedConversation, message: newMessage.trim() });
                              }
                            }}
                            data-testid="input-chat-message"
                          />
                          <Button
                            onClick={() => newMessage.trim() && sendMessageMutation.mutate({ userId: selectedConversation, message: newMessage.trim() })}
                            disabled={!newMessage.trim() || sendMessageMutation.isPending}
                            data-testid="button-send-message"
                          >
                            {sendMessageMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                          </Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}

          {activeTab === "tickets" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                Звернення користувачів
              </h2>
              <Card className="border-white/10 bg-white/5">
                <CardContent className="pt-6">
                  {ticketsLoading ? (
                    <div className="space-y-2">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
                  ) : !tickets?.length ? (
                    <div className="text-center py-12">
                      <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">Немає звернень</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {tickets.map((ticket) => (
                        <div key={ticket.id} className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-3" data-testid={`ticket-${ticket.id}`}>
                          <div className="flex items-start justify-between gap-3 flex-wrap">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium">#{ticket.id}</span>
                                <span className="text-sm">{ticket.name}</span>
                                {ticket.username && <Badge variant="outline" className="text-xs">@{ticket.username}</Badge>}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                                <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{ticket.contact}</span>
                                <span>{ticket.source}</span>
                                <span>{ticket.createdAt ? format(new Date(ticket.createdAt), "dd.MM.yyyy HH:mm") : ""}</span>
                              </div>
                            </div>
                            <Badge
                              variant="outline"
                              className={
                                ticket.status === "open"
                                  ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
                                  : ticket.status === "replied"
                                  ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                                  : "bg-green-500/10 text-green-400 border-green-500/30"
                              }
                            >
                              {ticket.status === "open" ? "Відкрито" : ticket.status === "replied" ? "Відповідь" : "Закрито"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground bg-black/20 p-3 rounded-lg">{ticket.message}</p>
                          {ticket.adminReply && (
                            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                              <p className="text-xs text-primary mb-1">Відповідь адміна:</p>
                              <p className="text-sm">{ticket.adminReply}</p>
                            </div>
                          )}
                          {ticketReply?.id === ticket.id ? (
                            <div className="flex gap-2">
                              <Textarea
                                value={ticketReply.text}
                                onChange={(e) => setTicketReply({ ...ticketReply, text: e.target.value })}
                                placeholder="Введіть відповідь..."
                                className="bg-white/5 border-white/10 min-h-[80px]"
                                data-testid={`textarea-reply-${ticket.id}`}
                              />
                              <div className="flex flex-col gap-1">
                                <Button
                                  size="sm"
                                  onClick={() => updateTicketMutation.mutate({ id: ticket.id, status: "replied", adminReply: ticketReply.text })}
                                  disabled={!ticketReply.text.trim() || updateTicketMutation.isPending}
                                  data-testid={`button-send-reply-${ticket.id}`}
                                >
                                  {updateTicketMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setTicketReply(null)}>
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex gap-2 flex-wrap">
                              <Button variant="outline" size="sm" onClick={() => setTicketReply({ id: ticket.id, text: "" })} data-testid={`button-reply-${ticket.id}`}>
                                <MessageSquare className="w-3 h-3 mr-1" />
                                Відповісти
                              </Button>
                              {ticket.userId && (
                                <Button variant="outline" size="sm" onClick={() => handleOpenDialog(ticket.userId!)} data-testid={`button-open-dialog-${ticket.id}`}>
                                  <MessagesSquare className="w-3 h-3 mr-1" />
                                  Діалог
                                </Button>
                              )}
                              {ticket.status !== "closed" && (
                                <Button variant="outline" size="sm" onClick={() => updateTicketMutation.mutate({ id: ticket.id, status: "closed" })} data-testid={`button-close-ticket-${ticket.id}`}>
                                  <Check className="w-3 h-3 mr-1" />
                                  Закрити
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === "payments" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                Історія платежів
              </h2>
              <Card className="border-white/10 bg-white/5">
                <CardContent className="pt-6">
                  {allPaymentsLoading ? (
                    <div className="space-y-2">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
                  ) : !allPayments?.length ? (
                    <div className="text-center py-12">
                      <CreditCard className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">Немає платежів</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-white/10">
                            <TableHead>ID</TableHead>
                            <TableHead>Користувач</TableHead>
                            <TableHead>Підписка</TableHead>
                            <TableHead>Сума</TableHead>
                            <TableHead className="hidden md:table-cell">TX Hash</TableHead>
                            <TableHead>Статус</TableHead>
                            <TableHead className="hidden md:table-cell">Дата</TableHead>
                            <TableHead className="text-right">Дії</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {allPayments.map((payment) => (
                            <TableRow key={payment.id} className="border-white/10" data-testid={`payment-row-${payment.id}`}>
                              <TableCell className="font-mono text-xs">#{payment.id}</TableCell>
                              <TableCell className="font-medium">{payment.username || `#${payment.userId}`}</TableCell>
                              <TableCell>
                                <Badge className={payment.tier === "ENTERPRISE" ? "bg-purple-500/10 text-purple-400 border-purple-500/30" : "bg-blue-500/10 text-blue-400 border-blue-500/30"}>
                                  {payment.tier}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-mono">${payment.amountUsdt}</TableCell>
                              <TableCell className="hidden md:table-cell font-mono text-xs text-muted-foreground max-w-[120px] truncate">{payment.txHash || "—"}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className={
                                  payment.status === "approved" ? "bg-green-500/10 text-green-400 border-green-500/30"
                                  : payment.status === "rejected" ? "bg-red-500/10 text-red-400 border-red-500/30"
                                  : "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
                                }>
                                  {payment.status === "approved" ? "Підтверджено" : payment.status === "rejected" ? "Відхилено" : "Очікує"}
                                </Badge>
                              </TableCell>
                              <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                                {payment.createdAt ? format(new Date(payment.createdAt), "dd.MM.yyyy HH:mm") : ""}
                              </TableCell>
                              <TableCell className="text-right">
                                {payment.status === "pending" && (
                                  <div className="flex justify-end gap-1">
                                    <Button variant="ghost" size="icon" className="text-green-400 h-8 w-8" onClick={() => approvePaymentMutation.mutate(payment.id)} data-testid={`button-approve-${payment.id}`}>
                                      <Check className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="text-red-400 h-8 w-8" onClick={() => rejectPaymentMutation.mutate(payment.id)} data-testid={`button-reject-${payment.id}`}>
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === "users" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Користувачі
                </h2>
                <div className="flex items-center gap-2">
                  <Select value={userTierFilter} onValueChange={setUserTierFilter}>
                    <SelectTrigger className="w-32 bg-white/5 border-white/10 h-9" data-testid="select-tier-filter">
                      <SelectValue placeholder="Тариф" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Всі</SelectItem>
                      <SelectItem value="FREE">FREE</SelectItem>
                      <SelectItem value="PRO">PRO</SelectItem>
                      <SelectItem value="ENTERPRISE">ENTERPRISE</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="relative w-48">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="Пошук..."
                      className="pl-9 bg-white/5 border-white/10 h-9"
                      data-testid="input-search-users"
                    />
                  </div>
                </div>
              </div>
              <Card className="border-white/10 bg-white/5">
                <CardContent className="pt-6">
                  {usersLoading ? (
                    <div className="space-y-2">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-white/10">
                            <TableHead>ID</TableHead>
                            <TableHead>Username</TableHead>
                            <TableHead>TG ID</TableHead>
                            <TableHead>Тариф</TableHead>
                            <TableHead className="hidden md:table-cell">Запити</TableHead>
                            <TableHead className="hidden md:table-cell">Streak</TableHead>
                            <TableHead>Статус</TableHead>
                            <TableHead className="hidden lg:table-cell">Останній вхід</TableHead>
                            <TableHead className="text-right">Дії</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredUsers.map((user) => (
                            <TableRow key={user.id} className="border-white/10 group" data-testid={`user-row-${user.id}`}>
                              <TableCell className="font-mono text-xs">#{user.id}</TableCell>
                              <TableCell className="font-medium">{user.username || "—"}</TableCell>
                              <TableCell className="font-mono text-xs text-muted-foreground">{user.tgId}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className={
                                  user.tier === "ENTERPRISE" ? "bg-purple-500/10 text-purple-400 border-purple-500/30"
                                  : user.tier === "PRO" ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                                  : "bg-zinc-500/10 text-zinc-400 border-zinc-500/30"
                                }>
                                  {user.tier || "FREE"}
                                </Badge>
                              </TableCell>
                              <TableCell className="hidden md:table-cell">{user.requestsLeft ?? 0}</TableCell>
                              <TableCell className="hidden md:table-cell">{user.streakDays ?? 0}</TableCell>
                              <TableCell>
                                {user.blocked ? (
                                  <Badge className="bg-red-500/10 text-red-400 border-red-500/30">Blocked</Badge>
                                ) : (
                                  <Badge className="bg-green-500/10 text-green-400 border-green-500/30">Active</Badge>
                                )}
                              </TableCell>
                              <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                                {user.lastLogin ? format(new Date(user.lastLogin), "dd.MM.yyyy HH:mm") : "—"}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-indigo-400 h-7 w-7"
                                    onClick={() => handleOpenDialog(user.id)}
                                    title="Написати"
                                    data-testid={`button-message-${user.id}`}
                                  >
                                    <Send className="w-3.5 h-3.5" />
                                  </Button>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button variant="ghost" size="icon" className="text-muted-foreground h-7 w-7" data-testid={`button-more-${user.id}`}>
                                        <MoreHorizontal className="w-3.5 h-3.5" />
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-56 p-2" align="end">
                                      <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground px-2 py-1 font-medium">Змінити тариф</p>
                                        {["FREE", "PRO", "ENTERPRISE"].map(tier => (
                                          <Button
                                            key={tier}
                                            variant="ghost"
                                            size="sm"
                                            className={`w-full justify-start text-xs ${(user.tier || "FREE") === tier ? "text-primary" : ""}`}
                                            onClick={() => changeTierMutation.mutate({ userId: user.id, tier })}
                                            disabled={changeTierMutation.isPending}
                                            data-testid={`button-set-tier-${user.id}-${tier}`}
                                          >
                                            <Crown className="w-3 h-3 mr-2" />
                                            {tier}
                                          </Button>
                                        ))}
                                        <div className="border-t border-white/10 my-1" />
                                        <div className="flex items-center gap-1 px-2">
                                          <Input
                                            type="number"
                                            placeholder="+перевірки"
                                            className="h-7 text-xs bg-white/5 border-white/10"
                                            value={editChecksAmount}
                                            onChange={(e) => setEditChecksAmount(e.target.value)}
                                            data-testid={`input-checks-${user.id}`}
                                          />
                                          <Button
                                            size="sm"
                                            className="h-7 px-2"
                                            onClick={() => {
                                              const amount = parseInt(editChecksAmount);
                                              if (amount > 0) addChecksMutation.mutate({ userId: user.id, amount });
                                            }}
                                            disabled={addChecksMutation.isPending}
                                            data-testid={`button-add-checks-${user.id}`}
                                          >
                                            <Plus className="w-3 h-3" />
                                          </Button>
                                        </div>
                                        <div className="border-t border-white/10 my-1" />
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className={`w-full justify-start text-xs ${user.blocked ? "text-green-400" : "text-red-400"}`}
                                          onClick={() => blockUserMutation.mutate({ userId: user.id, blocked: !user.blocked })}
                                          disabled={blockUserMutation.isPending}
                                          data-testid={`button-toggle-block-${user.id}`}
                                        >
                                          {user.blocked ? <UserCheck className="w-3 h-3 mr-2" /> : <UserX className="w-3 h-3 mr-2" />}
                                          {user.blocked ? "Розблокувати" : "Заблокувати"}
                                        </Button>
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      <p className="text-xs text-muted-foreground mt-3">{filteredUsers.length} / {allUsers?.length || 0} користувачів</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === "coupons" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Ticket className="w-5 h-5 text-primary" />
                Керування купонами
              </h2>

              <Card className="border-white/10 bg-white/5">
                <CardHeader>
                  <CardTitle className="text-base">Новий купон</CardTitle>
                  <CardDescription>Створіть промокод для користувачів</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Код</label>
                      <div className="flex gap-2">
                        <Input placeholder="DS-XXXXXXXX" value={couponForm.code} onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })} className="bg-white/5 border-white/10" data-testid="input-coupon-code" />
                        <Button variant="outline" size="icon" onClick={() => setCouponForm({ ...couponForm, code: generateCouponCode() })} data-testid="button-generate-code">
                          <Shuffle className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Тип</label>
                      <Select value={couponForm.type} onValueChange={(v: "checks" | "tier") => setCouponForm({ ...couponForm, type: v })}>
                        <SelectTrigger className="bg-white/5 border-white/10" data-testid="select-coupon-type"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="checks">Перевірки</SelectItem>
                          <SelectItem value="tier">Підписка</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {couponForm.type === "checks" && (
                      <div className="space-y-2">
                        <label className="text-sm text-muted-foreground">Кількість</label>
                        <Input type="number" min={1} value={couponForm.value} onChange={(e) => setCouponForm({ ...couponForm, value: parseInt(e.target.value) || 0 })} className="bg-white/5 border-white/10" data-testid="input-coupon-value" />
                      </div>
                    )}
                    {couponForm.type === "tier" && (
                      <div className="space-y-2">
                        <label className="text-sm text-muted-foreground">Рівень</label>
                        <Select value={couponForm.tier} onValueChange={(v) => setCouponForm({ ...couponForm, tier: v })}>
                          <SelectTrigger className="bg-white/5 border-white/10" data-testid="select-coupon-tier"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PRO">PRO</SelectItem>
                            <SelectItem value="ENTERPRISE">ENTERPRISE</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Макс. використань</label>
                      <Input type="number" min={1} value={couponForm.maxUses} onChange={(e) => setCouponForm({ ...couponForm, maxUses: parseInt(e.target.value) || 0 })} className="bg-white/5 border-white/10" data-testid="input-coupon-maxuses" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Термін дії</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal bg-white/5 border-white/10" data-testid="button-coupon-expiry">
                            <Calendar className="mr-2 h-4 w-4" />
                            {couponForm.expiresAt ? format(couponForm.expiresAt, "dd.MM.yyyy", { locale: uk }) : "Без обмежень"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent mode="single" selected={couponForm.expiresAt || undefined} onSelect={(date) => setCouponForm({ ...couponForm, expiresAt: date || null })} disabled={(date) => date < new Date()} initialFocus />
                          {couponForm.expiresAt && (
                            <div className="p-2 border-t border-white/10">
                              <Button variant="ghost" size="sm" className="w-full" onClick={() => setCouponForm({ ...couponForm, expiresAt: null })}>Очистити</Button>
                            </div>
                          )}
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="flex items-end">
                      <Button onClick={() => createCouponMutation.mutate(couponForm)} disabled={!couponForm.code || createCouponMutation.isPending} className="w-full gap-2" data-testid="button-create-coupon">
                        {createCouponMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
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
                    <div className="space-y-2">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
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
                              <TableCell>{coupon.type === "tier" ? coupon.tier : `+${coupon.value}`}</TableCell>
                              <TableCell className="hidden md:table-cell">{coupon.usedCount} / {coupon.maxUses}</TableCell>
                              <TableCell className="hidden md:table-cell">
                                {coupon.isActive ? <Badge className="bg-green-500/10 text-green-400 border-green-500/30">Активний</Badge> : <Badge className="bg-zinc-500/10 text-zinc-400 border-zinc-500/30">Неактивний</Badge>}
                              </TableCell>
                              <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">{coupon.expiresAt ? format(new Date(coupon.expiresAt), "dd.MM.yyyy") : "—"}</TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="icon" className="text-red-400 h-8 w-8" onClick={() => deleteCouponMutation.mutate(coupon.id)} disabled={deleteCouponMutation.isPending} data-testid={`button-delete-coupon-${coupon.id}`}>
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
            </motion.div>
          )}

          {activeTab === "activity" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Активність
                </h2>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => queryClientInstance.invalidateQueries({ queryKey: ["/api/admin/activity", activityPage] })}
                    className="gap-2"
                    data-testid="button-refresh-activity"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Оновити
                  </Button>
                  <Badge variant="outline" className="bg-white/5 border-white/10">
                    {activityData?.total ?? 0} подій
                  </Badge>
                </div>
              </div>

              <Card className="border-white/10 bg-white/5">
                <CardContent className="pt-6">
                  {activityLoading ? (
                    <div className="space-y-3">
                      {Array(8).fill(0).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
                    </div>
                  ) : !activityData?.events?.length ? (
                    <div className="text-center py-12">
                      <Activity className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                      <p className="text-muted-foreground">Немає подій</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {activityData.events.map((event, idx) => {
                        const eventConfig: Record<string, { icon: any; color: string; label: string }> = {
                          registration: { icon: UserPlus, color: "text-green-400", label: "Реєстрація" },
                          login: { icon: LogIn, color: "text-blue-400", label: "Вхід" },
                          check: { icon: Shield, color: "text-cyan-400", label: "Перевірка" },
                          payment: { icon: CreditCard, color: "text-orange-400", label: "Оплата" },
                          tier_change: { icon: Crown, color: "text-purple-400", label: "Зміна тарифу" },
                          app_download: { icon: Download, color: "text-emerald-400", label: "Завантаження" },
                        };
                        const config = eventConfig[event.eventType] || { icon: Activity, color: "text-muted-foreground", label: event.eventType };
                        const EventIcon = config.icon;

                        return (
                          <motion.div
                            key={event.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.02 }}
                            className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
                            data-testid={`activity-event-${event.id}`}
                          >
                            <div className={`w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5 ${config.color}`}>
                              <EventIcon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="outline" className={`text-[10px] ${config.color} border-current/30`}>
                                  {config.label}
                                </Badge>
                                {event.username && (
                                  <span className="text-sm font-medium truncate">@{event.username}</span>
                                )}
                                {event.userId && (
                                  <span className="text-[10px] text-muted-foreground font-mono">#{event.userId}</span>
                                )}
                              </div>
                              {event.details && (
                                <p className="text-xs text-muted-foreground mt-1 truncate">{event.details}</p>
                              )}
                              {event.meta && typeof event.meta === 'object' && (
                                <div className="flex gap-2 mt-1 flex-wrap">
                                  {Object.entries(event.meta as Record<string, any>).slice(0, 4).map(([key, val]) => (
                                    <span key={key} className="text-[10px] text-muted-foreground bg-white/5 px-1.5 py-0.5 rounded">
                                      {key}: {String(val)}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap flex-shrink-0">
                              {event.createdAt ? timeAgo(event.createdAt) : "—"}
                            </span>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}

                  {activityData && activityData.total > ACTIVITY_PAGE_SIZE && (
                    <div className="flex items-center justify-between gap-4 mt-4 pt-4 border-t border-white/10">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={activityPage === 0}
                        onClick={() => setActivityPage(p => Math.max(0, p - 1))}
                        data-testid="button-activity-prev"
                      >
                        <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                        Назад
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        {activityPage * ACTIVITY_PAGE_SIZE + 1}–{Math.min((activityPage + 1) * ACTIVITY_PAGE_SIZE, activityData.total)} з {activityData.total}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={(activityPage + 1) * ACTIVITY_PAGE_SIZE >= activityData.total}
                        onClick={() => setActivityPage(p => p + 1)}
                        data-testid="button-activity-next"
                      >
                        Далі
                        <ChevronRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === "settings" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                Налаштування
              </h2>
              <Card className="border-white/10 bg-white/5">
                <CardHeader>
                  <CardTitle className="text-base">Ціни підписок (USDT)</CardTitle>
                </CardHeader>
                <CardContent>
                  {settingsLoading ? (
                    <div className="flex gap-4"><Skeleton className="h-10 flex-1" /><Skeleton className="h-10 flex-1" /><Skeleton className="h-10 w-24" /></div>
                  ) : (
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                      <div className="flex-1 space-y-2">
                        <label className="text-sm text-muted-foreground flex items-center gap-2"><Crown className="w-4 h-4 text-blue-400" />PRO</label>
                        <Input type="number" min={1} value={settingsForm.proPrice} onChange={(e) => setSettingsForm({ ...settingsForm, proPrice: e.target.value })} className="bg-white/5 border-white/10" data-testid="input-pro-price" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <label className="text-sm text-muted-foreground flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-purple-400" />ENTERPRISE</label>
                        <Input type="number" min={1} value={settingsForm.enterprisePrice} onChange={(e) => setSettingsForm({ ...settingsForm, enterprisePrice: e.target.value })} className="bg-white/5 border-white/10" data-testid="input-enterprise-price" />
                      </div>
                      <Button onClick={() => updateSettingsMutation.mutate(settingsForm)} disabled={updateSettingsMutation.isPending} className="gap-2" data-testid="button-save-settings">
                        {updateSettingsMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Зберегти
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-white/5">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    Авторозсилка (Щоденна)
                  </CardTitle>
                  <CardDescription>Щоденне повідомлення всім користувачам з їхньою статистикою</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`w-3 h-3 rounded-full ${settings?.dailyBroadcastEnabled ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`} />
                      <span className="text-sm font-medium">{settings?.dailyBroadcastEnabled ? 'Увімкнено' : 'Вимкнено'}</span>
                    </div>
                    <Button
                      variant={settings?.dailyBroadcastEnabled ? "destructive" : "default"}
                      size="sm"
                      onClick={() => updateSettingsMutation.mutate({ ...settingsForm, dailyBroadcastEnabled: !settings?.dailyBroadcastEnabled })}
                      disabled={updateSettingsMutation.isPending}
                      className="gap-2"
                      data-testid="button-toggle-daily-broadcast"
                    >
                      {settings?.dailyBroadcastEnabled ? <X className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                      {settings?.dailyBroadcastEnabled ? 'Вимкнути' : 'Увімкнути'}
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Час відправки</p>
                      <p className="text-sm font-mono font-bold mt-1">10:00 UTC</p>
                    </div>
                    <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Остання розсилка</p>
                      <p className="text-sm font-mono font-bold mt-1">
                        {settings?.dailyBroadcastLastSent 
                          ? new Date(settings.dailyBroadcastLastSent).toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
                          : '—'
                        }
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Охоплення</p>
                      <p className="text-sm font-mono font-bold mt-1">{settings?.dailyBroadcastLastReach || 0} юзерів</p>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-xs text-muted-foreground mb-1">Шаблон повідомлення:</p>
                    <p className="text-xs text-white/70 italic">"Привіт, {'{'}{'{'}username{'}'}{'}'}'! У тебе {'{'}{'{'}requestsLeft{'}'}{'}'} перевірок. Сьогодні N людей ледь не попалися на скам!"</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-white/5">
                <CardHeader>
                  <CardTitle className="text-base">Підтримка</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                    <Mail className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Email підтримки</p>
                      <p className="text-sm font-medium">darkshare.store@gmail.com</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
}
