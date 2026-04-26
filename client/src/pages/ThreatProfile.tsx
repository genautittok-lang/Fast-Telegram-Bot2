import { useState } from "react";
import { ArrowLeft, Sparkles, Lock, Brain, Target, Eye, Zap, AlertTriangle, ShieldCheck, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PageLayout } from "@/components/PageLayout";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AIDisclaimer } from "@/components/AIDisclaimer";

interface ThreatProfileResult {
  query: string;
  queryType: string;
  generatedAt: string;
  riskScore: number;
  classification: "MINIMAL" | "LOW" | "ELEVATED" | "HIGH" | "CRITICAL";
  executiveSummary: string;
  identitySignals: Array<{ label: string; value: string; confidence: number }>;
  exposureFootprint: Array<{ category: string; details: string; severity: "info" | "warn" | "danger" }>;
  recommendedActions: Array<{ priority: number; action: string; rationale: string }>;
  legalDisclaimer: string;
  sources: string[];
}

const CLASS_COLORS: Record<string, string> = {
  MINIMAL: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  LOW: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  ELEVATED: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  HIGH: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  CRITICAL: "bg-red-500/15 text-red-300 border-red-500/30",
};

const SEVERITY_COLORS: Record<string, string> = {
  info: "bg-cyan-500/10 border-cyan-500/30 text-cyan-200",
  warn: "bg-amber-500/10 border-amber-500/30 text-amber-200",
  danger: "bg-red-500/10 border-red-500/30 text-red-200",
};

function ProfileContent() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [queryType, setQueryType] = useState("username");
  const [profile, setProfile] = useState<ThreatProfileResult | null>(null);

  const tier = (user?.tier || "FREE").toUpperCase();
  const isPro = tier !== "FREE";

  const historyQuery = useQuery<any[]>({ queryKey: ["/api/threat-profiles"], enabled: isPro });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/threat-profile", { query, queryType });
      return (await res.json()) as { id: number; profile: ThreatProfileResult };
    },
    onSuccess: (data) => {
      setProfile(data.profile);
      toast({ title: "Профіль згенеровано", description: `Класифікація: ${data.profile.classification}` });
    },
    onError: (err: any) => {
      const msg = err?.message?.includes("PRO_REQUIRED")
        ? "AI Threat Profile доступний на PRO+ тарифі"
        : err?.message ?? "Помилка генерації";
      toast({ title: "Не вдалося", description: msg, variant: "destructive" });
    },
  });

  if (!isPro) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/dashboard")} data-testid="button-back-tp-locked">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold flex-1">AI Threat Profile</h1>
        </div>

        <Card className="border-primary/30 bg-gradient-to-br from-primary/10 via-purple-500/5 to-transparent">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-primary/20 flex items-center justify-center border border-primary/40">
              <Brain className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">AI-аналітик загроз</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Глибокий профіль цілі: ідентичність, цифровий слід, рекомендації — все в одному структурованому звіті, що генерується ШІ за 30 секунд.
            </p>
            <div className="grid grid-cols-3 gap-3 max-w-md mx-auto pt-2">
              <div className="p-3 rounded-lg bg-card/50 border border-border/50 space-y-1">
                <Brain className="w-5 h-5 text-primary mx-auto" />
                <p className="text-[10px] text-muted-foreground">AI-аналіз</p>
              </div>
              <div className="p-3 rounded-lg bg-card/50 border border-border/50 space-y-1">
                <Target className="w-5 h-5 text-primary mx-auto" />
                <p className="text-[10px] text-muted-foreground">Структуровано</p>
              </div>
              <div className="p-3 rounded-lg bg-card/50 border border-border/50 space-y-1">
                <Zap className="w-5 h-5 text-primary mx-auto" />
                <p className="text-[10px] text-muted-foreground">~30 сек</p>
              </div>
            </div>
            <Button onClick={() => setLocation("/pricing")} size="lg" className="mt-2" data-testid="button-tp-upgrade">
              Перейти на PRO <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8 space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/dashboard")} data-testid="button-back-tp">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold flex-1">AI Threat Profile</h1>
        <Badge className="bg-primary/15 text-primary border-primary/30">{tier}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" />
            Згенерувати профіль
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2 col-span-1">
              <Label>Тип</Label>
              <Select value={queryType} onValueChange={setQueryType}>
                <SelectTrigger data-testid="select-query-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="username">Username</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="wallet">Wallet</SelectItem>
                  <SelectItem value="ip">IP</SelectItem>
                  <SelectItem value="domain">Domain</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Ціль</Label>
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="username / email / wallet..." data-testid="input-tp-query" />
            </div>
          </div>
          <Button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending || query.length < 2}
            className="w-full"
            data-testid="button-generate-tp"
          >
            {generateMutation.isPending ? "Аналізую..." : "Згенерувати AI-профіль"}
            <Sparkles className="w-4 h-4 ml-1" />
          </Button>
        </CardContent>
      </Card>

      {profile && (
        <>
          <Card className={`border-2 ${CLASS_COLORS[profile.classification].split(" ").pop()}`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{profile.query}</CardTitle>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">{profile.queryType}</p>
                </div>
                <Badge className={CLASS_COLORS[profile.classification]} data-testid="badge-tp-class">{profile.classification}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Risk score</span>
                  <span className="font-mono">{profile.riskScore}/100</span>
                </div>
                <Progress value={profile.riskScore} className="h-2" />
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed" data-testid="text-tp-summary">{profile.executiveSummary}</p>
            </CardContent>
          </Card>

          {profile.identitySignals.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  Identity signals
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {profile.identitySignals.map((s, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-muted/20 border border-border/50" data-testid={`row-tp-signal-${i + 1}`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</p>
                      <p className="text-sm truncate">{s.value}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] flex-shrink-0">conf {s.confidence}%</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {profile.exposureFootprint.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Eye className="w-4 h-4 text-primary" />
                  Exposure footprint
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {profile.exposureFootprint.map((e, i) => (
                  <div key={i} className={`p-3 rounded-lg border ${SEVERITY_COLORS[e.severity]}`} data-testid={`row-tp-exposure-${i + 1}`}>
                    <p className="text-xs uppercase tracking-wider opacity-75">{e.category}</p>
                    <p className="text-sm mt-1">{e.details}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {profile.recommendedActions.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  Recommended actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {profile.recommendedActions.map((a, i) => (
                  <div key={i} className="flex gap-3 p-2.5 rounded-lg bg-muted/20 border border-border/50" data-testid={`row-tp-action-${i + 1}`}>
                    <Badge variant={a.priority === 1 ? "destructive" : "secondary"} className="text-[10px] h-5 flex-shrink-0">P{a.priority}</Badge>
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <p className="text-sm font-medium">{a.action}</p>
                      <p className="text-xs text-muted-foreground">{a.rationale}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {profile.sources.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Джерела</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {profile.sources.map((s, i) => (
                    <Badge key={i} variant="outline" className="text-[10px]">{s}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <AIDisclaimer variant="full" />
        </>
      )}

      {historyQuery.data && historyQuery.data.length > 0 && !profile && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Останні профілі</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {historyQuery.data.slice(0, 10).map((p: any) => (
              <button
                key={p.id}
                onClick={() => setProfile(p.profileJson)}
                className="w-full text-left p-2.5 rounded-lg bg-muted/20 border border-border/50 hover:bg-muted/40 transition-colors flex items-center justify-between gap-2"
                data-testid={`button-tp-history-${p.id}`}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm truncate font-medium">{p.query}</p>
                  <p className="text-xs text-muted-foreground">{p.queryType} • {new Date(p.createdAt).toLocaleDateString()}</p>
                </div>
                <Badge className={CLASS_COLORS[p.profileJson?.classification ?? "LOW"]}>{p.profileJson?.classification ?? "LOW"}</Badge>
              </button>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function ThreatProfilePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }
  if (!isAuthenticated) {
    setLocation("/login");
    return null;
  }
  return <PageLayout title="AI Threat Profile"><ProfileContent /></PageLayout>;
}
