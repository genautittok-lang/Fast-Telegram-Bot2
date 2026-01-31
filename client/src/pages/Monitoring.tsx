import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
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
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
}

const typeIcons: Record<string, any> = {
  ip: Globe,
  wallet: Wallet,
  email: Mail,
  phone: Phone,
  domain: Building,
  url: Link2,
};

const typeLabels: Record<string, string> = {
  ip: "IP Address",
  wallet: "Wallet",
  email: "Email",
  phone: "Phone",
  domain: "Domain",
  url: "URL",
};

export default function Monitoring() {
  const [newType, setNewType] = useState("ip");
  const [newValue, setNewValue] = useState("");
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
      toast({
        title: "Успіх",
        description: "Монітор створено",
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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      
      <header className="border-b border-white/10 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="hidden sm:flex" data-testid="button-back-dashboard">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              <span className="font-display font-bold text-lg sm:text-xl">DARKSHARE</span>
              <Badge variant="outline" className="text-xs hidden sm:inline-flex">Моніторинг</Badge>
            </div>
          </div>
          <MobileMenu lang="UA" isAuthenticated={true} />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 relative z-10 space-y-6">
        <Card className="bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Додати монітор
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Select value={newType} onValueChange={setNewType}>
                <SelectTrigger className="w-40 bg-white/5 border-white/10" data-testid="select-monitor-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ip">IP Address</SelectItem>
                  <SelectItem value="wallet">Wallet</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="domain">Domain</SelectItem>
                  <SelectItem value="url">URL</SelectItem>
                </SelectContent>
              </Select>
              <Input
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="Введіть значення для моніторингу..."
                className="flex-1 bg-white/5 border-white/10"
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                data-testid="input-monitor-value"
              />
              <Button 
                onClick={handleCreate} 
                disabled={createMutation.isPending}
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
          </CardContent>
        </Card>

        <Card className="bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              Активні монітори
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : watches && watches.length > 0 ? (
              <div className="space-y-3">
                {watches.map((watch, idx) => {
                  const TypeIcon = typeIcons[watch.objectType] || Globe;
                  return (
                    <motion.div
                      key={watch.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="p-4 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                          <TypeIcon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-mono text-sm truncate">{watch.value}</p>
                            <Badge variant="outline" className="text-xs">
                              {typeLabels[watch.objectType] || watch.objectType}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <Activity className="w-3 h-3" />
                            <span>
                              {watch.lastCheck 
                                ? `Остання перевірка: ${new Date(watch.lastCheck).toLocaleString('uk-UA')}`
                                : 'Очікує перевірки'
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={watch.status === 'active' 
                          ? 'bg-green-500/20 text-green-500 border-green-500/50' 
                          : 'bg-gray-500/20 text-gray-500 border-gray-500/50'
                        }>
                          {watch.status === 'active' ? 'Активний' : 'Пауза'}
                        </Badge>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => deleteMutation.mutate(watch.id)}
                          disabled={deleteMutation.isPending}
                          data-testid={`button-delete-${watch.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Eye className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>Немає активних моніторів</p>
                <p className="text-sm mt-1">Додайте об'єкт для моніторингу</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-primary">Як працює моніторинг?</p>
                <p className="text-muted-foreground mt-1">
                  Система автоматично перевіряє додані об'єкти кожні 5 хвилин. 
                  При зміні рівня ризику ви отримаєте сповіщення.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
