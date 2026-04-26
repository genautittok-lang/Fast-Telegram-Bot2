import { useState } from "react";
import { ArrowLeft, Lock, Wand2, ShieldAlert, ShieldCheck, ChevronRight, ExternalLink, Clock, AlertOctagon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PageLayout } from "@/components/PageLayout";
import { MobileMenu } from "@/components/MobileMenu";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface WizardStep {
  priority: 1 | 2 | 3;
  category: string;
  title: string;
  description: string;
  estMinutes: number;
  external?: { label: string; url: string }[];
}
interface WizardResult {
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  summary: string;
  steps: WizardStep[];
  legalNote: string;
}

const RISK_COLORS: Record<string, string> = {
  LOW: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  MEDIUM: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  HIGH: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  CRITICAL: "bg-red-500/15 text-red-300 border-red-500/30",
};

function WizardContent() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [exposureType, setExposureType] = useState<string>("password");
  const [services, setServices] = useState<string>("");
  const [hasFinancial, setHasFinancial] = useState(false);
  const [hasSensitive, setHasSensitive] = useState(false);
  const [is2fa, setIs2fa] = useState(true);
  const [hasSim, setHasSim] = useState(false);
  const [result, setResult] = useState<WizardResult | null>(null);

  const runMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/wizard/compromise", {
        exposureType,
        affectedServices: services.split(",").map((s) => s.trim()).filter(Boolean),
        hasFinancialAccess: hasFinancial,
        hasSensitiveData: hasSensitive,
        is2faEnabled: is2fa,
        hasSimAccess: hasSim,
        language: "uk",
      });
      return (await res.json()) as WizardResult;
    },
    onSuccess: (data) => { setResult(data); setStep(3); },
    onError: () => toast({ title: "Помилка", description: "Не вдалося згенерувати чек-лист", variant: "destructive" }),
  });

  const reset = () => { setResult(null); setStep(0); };

  if (result) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8 space-y-5">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={reset} data-testid="button-wizard-restart">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold flex-1">Ваш план реагування</h1>
        </div>

        <Card className={`border-2 ${RISK_COLORS[result.riskLevel].split(" ").pop()}`}>
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className={`w-5 h-5 ${RISK_COLORS[result.riskLevel].split(" ")[1]}`} />
                <span className="text-sm text-muted-foreground">Рівень ризику:</span>
                <Badge className={RISK_COLORS[result.riskLevel]} data-testid="badge-wizard-risk">{result.riskLevel}</Badge>
              </div>
              <Badge variant="outline" className="text-xs">
                <Clock className="w-3 h-3 mr-1" />
                {result.steps.reduce((s, x) => s + x.estMinutes, 0)} хв
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground" data-testid="text-wizard-summary">{result.summary}</p>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {result.steps.map((s, i) => (
            <Card key={i} className="border-border/50" data-testid={`card-wizard-step-${i + 1}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={s.priority === 1 ? "destructive" : s.priority === 2 ? "default" : "secondary"} className="text-[10px]">
                      P{s.priority}
                    </Badge>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">{s.category}</span>
                  </div>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />~{s.estMinutes}хв
                  </span>
                </div>
                <CardTitle className="text-base mt-1">{s.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground leading-relaxed">{s.description}</p>
                {s.external && s.external.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {s.external.map((ext, j) => (
                      <a key={j} href={ext.url} target={ext.url.startsWith("/") ? "_self" : "_blank"} rel="noreferrer"
                         className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 border border-primary/20 text-primary text-xs hover:bg-primary/20"
                         data-testid={`link-wizard-ext-${i}-${j}`}>
                        {ext.label}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="pt-4">
            <p className="text-xs text-amber-200/80 leading-relaxed">
              <AlertOctagon className="w-3 h-3 inline mr-1" />
              {result.legalNote}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8 space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/")} data-testid="button-back-wizard">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1" />
      </div>

      <div className="text-center space-y-2">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-cyan-500/10 flex items-center justify-center border border-primary/30">
          <Wand2 className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-2xl font-bold" data-testid="text-wizard-title">Compromise Response Wizard</h1>
        <p className="text-muted-foreground text-sm">Безкоштовно • 3 кроки • Персональний план реагування</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold">{step + 1}</span>
            {step === 0 ? "Що скомпрометовано?" : step === 1 ? "Які сервіси під загрозою?" : "Контекст ризику"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 0 && (
            <>
              <div className="space-y-2">
                <Label>Тип витоку</Label>
                <Select value={exposureType} onValueChange={setExposureType}>
                  <SelectTrigger data-testid="select-exposure-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="password">Пароль</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="phone">Номер телефону</SelectItem>
                    <SelectItem value="wallet">Крипто-гаманець / seed</SelectItem>
                    <SelectItem value="social">Соцмережа / месенджер</SelectItem>
                    <SelectItem value="unknown">Не знаю точно</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => setStep(1)} className="w-full" data-testid="button-wizard-next-1">
                Далі <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </>
          )}

          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label>Сервіси / акаунти, які могли постраждати (через кому)</Label>
                <Input
                  placeholder="Gmail, Instagram, Binance, Telegram..."
                  value={services}
                  onChange={(e) => setServices(e.target.value)}
                  data-testid="input-wizard-services"
                />
                <p className="text-xs text-muted-foreground">Можна залишити порожнім.</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(0)} className="flex-1">Назад</Button>
                <Button onClick={() => setStep(2)} className="flex-1" data-testid="button-wizard-next-2">
                  Далі <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:bg-card/50 cursor-pointer">
                  <Checkbox checked={hasFinancial} onCheckedChange={(v) => setHasFinancial(!!v)} data-testid="check-wizard-financial" />
                  <div>
                    <p className="text-sm font-medium">Доступ до фінансів</p>
                    <p className="text-xs text-muted-foreground">Банки, картки, біржі, PayPal</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:bg-card/50 cursor-pointer">
                  <Checkbox checked={hasSensitive} onCheckedChange={(v) => setHasSensitive(!!v)} data-testid="check-wizard-sensitive" />
                  <div>
                    <p className="text-sm font-medium">Чутливі дані</p>
                    <p className="text-xs text-muted-foreground">Документи, медзаписи, особисте листування</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:bg-card/50 cursor-pointer">
                  <Checkbox checked={is2fa} onCheckedChange={(v) => setIs2fa(!!v)} data-testid="check-wizard-2fa" />
                  <div>
                    <p className="text-sm font-medium">2FA увімкнено</p>
                    <p className="text-xs text-muted-foreground">Authenticator-застосунок</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:bg-card/50 cursor-pointer">
                  <Checkbox checked={hasSim} onCheckedChange={(v) => setHasSim(!!v)} data-testid="check-wizard-sim" />
                  <div>
                    <p className="text-sm font-medium">Підозра на SIM-swap</p>
                    <p className="text-xs text-muted-foreground">Несподівані SMS, відсутність зв'язку</p>
                  </div>
                </label>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Назад</Button>
                <Button onClick={() => runMutation.mutate()} disabled={runMutation.isPending} className="flex-1" data-testid="button-wizard-generate">
                  {runMutation.isPending ? "Генерую..." : "Створити план"}
                  <ShieldCheck className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="border-emerald-500/20 bg-emerald-500/5">
        <CardContent className="pt-4">
          <p className="text-xs text-emerald-200/80 leading-relaxed">
            <ShieldCheck className="w-3 h-3 inline mr-1" />
            Ми не зберігаємо ваші відповіді. Усі дані обробляються в момент запиту та одразу видаляються.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CompromiseWizard() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <PageLayout title="Wizard"><WizardContent /></PageLayout>;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="relative z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 cursor-pointer" onClick={() => setLocation("/")} data-testid="link-home-brand-wizard">
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
      <div className="flex-1"><WizardContent /></div>
      <Footer />
    </div>
  );
}
