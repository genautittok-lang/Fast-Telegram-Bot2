import { useState } from "react";
import { Shield, ArrowLeft, Lock, Trash2, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PageLayout } from "@/components/PageLayout";
import { MobileMenu } from "@/components/MobileMenu";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

function DataDeletionContent() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [reason, setReason] = useState("");
  const [submittedId, setSubmittedId] = useState<number | null>(null);

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/data-deletion", { email, identifier: identifier || undefined, reason: reason || undefined });
      return await res.json();
    },
    onSuccess: (data: any) => {
      if (data?.requestId) {
        setSubmittedId(data.requestId);
        toast({ title: "Запит прийнято", description: `Номер заявки: #${data.requestId}` });
      }
    },
    onError: (err: any) => {
      toast({ title: "Помилка", description: err?.message ?? "Не вдалося надіслати запит", variant: "destructive" });
    },
  });

  if (submittedId) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30">
            <CheckCircle2 className="w-8 h-8 text-cyan-400" />
          </div>
          <h1 className="text-2xl font-bold" data-testid="text-deletion-success">Запит прийнято</h1>
          <p className="text-muted-foreground">Номер заявки: <span className="text-primary font-mono">#{submittedId}</span></p>
        </div>

        <Card className="border-cyan-500/20 bg-cyan-500/5">
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-2 text-sm">
                <p><strong>Що відбувається далі:</strong></p>
                <ul className="space-y-1.5 text-muted-foreground list-disc ml-5">
                  <li>Ваш запит передано команді DARKSHARE та внесено до журналу обробки.</li>
                  <li>Ми відповімо на вказаний email протягом <strong className="text-cyan-300">30 календарних днів</strong> згідно зі ст. 12(3) GDPR.</li>
                  <li>За потреби ми можемо запитати додаткову верифікацію особи (ст. 12(6) GDPR).</li>
                  <li>Після підтвердження дані будуть видалені з активних баз протягом 7 днів та з резервних копій протягом 90 днів.</li>
                </ul>
                <p className="pt-2"><strong>Зв'язок:</strong> darkshare.store@gmail.com або @DarkShare1Bot із зазначенням номера #{submittedId}.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button onClick={() => setLocation("/")} variant="outline" className="w-full" data-testid="button-deletion-home">
          На головну
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8 space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/")} data-testid="button-back-deletion">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1" />
      </div>

      <div className="text-center space-y-2">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-red-500/20 to-rose-500/10 flex items-center justify-center border border-red-500/30">
          <Trash2 className="w-7 h-7 text-red-400" />
        </div>
        <h1 className="text-2xl font-bold" data-testid="text-deletion-title">Видалення персональних даних</h1>
        <p className="text-muted-foreground text-sm">GDPR Art. 17 • UK DPA 2018 • ЗУ «Про захист персональних даних»</p>
      </div>

      <Card className="border-amber-500/20 bg-amber-500/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm space-y-2 text-amber-100/85">
              <p><strong>Перед поданням:</strong></p>
              <ul className="list-disc ml-5 space-y-1 text-amber-100/75">
                <li>Якщо ви маєте акаунт DARKSHARE — швидше видалити через <a href="/account" className="text-amber-300 underline">сторінку акаунта</a>.</li>
                <li>Якщо ви хочете видалити записи про себе, що з'явились у наших OSINT-результатах через сторонні джерела — заповніть цю форму.</li>
                <li>Ми НЕ контролюємо первинні джерела (leak-бази, blockchain, public WHOIS). Для повного очищення скористайтесь <a href="/takedown" className="text-amber-300 underline">генератором GDPR-листів</a>.</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Форма запиту</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="del-email">Email для відповіді *</Label>
            <Input
              id="del-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              data-testid="input-deletion-email"
              required
            />
            <p className="text-xs text-muted-foreground">Використовуємо лише для відповіді про статус запиту.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="del-identifier">Що саме видалити (ідентифікатор)</Label>
            <Input
              id="del-identifier"
              placeholder="email / phone / wallet / username / IP"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              data-testid="input-deletion-identifier"
            />
            <p className="text-xs text-muted-foreground">Конкретні дані, які ми маємо видалити з нашого індексу/кешу.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="del-reason">Підстава запиту (необов'язково)</Label>
            <Textarea
              id="del-reason"
              placeholder="Наприклад: я є власником цього email, мене переслідують, цей телефон більше не використовую..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              maxLength={2000}
              data-testid="input-deletion-reason"
            />
          </div>

          <Button
            onClick={() => submitMutation.mutate()}
            disabled={submitMutation.isPending || !email}
            className="w-full"
            data-testid="button-submit-deletion"
          >
            {submitMutation.isPending ? "Надсилаю..." : "Надіслати запит на видалення"}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Подаючи цю форму, ви підтверджуєте достовірність наданої інформації. Подача завідомо неправдивих запитів є порушенням AUP.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function DataDeletion() {
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
    return <PageLayout title="Data Deletion"><DataDeletionContent /></PageLayout>;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="relative z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 cursor-pointer" onClick={() => setLocation("/")} data-testid="link-home-brand-deletion">
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
      <div className="flex-1"><DataDeletionContent /></div>
      <Footer />
    </div>
  );
}
