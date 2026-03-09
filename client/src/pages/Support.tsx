import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Mail, MessageSquare, Send, Loader2, CheckCircle, Phone, User, ArrowLeft, Lock, Shield } from "lucide-react";
import { SiTelegram } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLayout } from "@/components/PageLayout";
import { MobileMenu } from "@/components/MobileMenu";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Footer } from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

function SupportForm() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", contact: "", message: "" });

  const submitMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await apiRequest("POST", "/api/support", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: t('support.sent'), description: t('support.sentDesc') });
      setForm({ name: "", contact: "", message: "" });
    },
    onError: (error: Error) => {
      toast({ title: t('common.error'), description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.contact.trim() || !form.message.trim()) return;
    submitMutation.mutate(form);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8 space-y-5">
      <div className="text-center space-y-2">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-cyan-500/10 flex items-center justify-center border border-primary/20">
          <MessageSquare className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-2xl font-bold" data-testid="text-support-title">{t('support.title')}</h1>
        <p className="text-muted-foreground text-sm">{t('support.subtitle')}</p>
      </div>

      <Card className="border-border/50 bg-card/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 flex-wrap">
            <Mail className="w-4 h-4 text-primary" />
            {t('support.contactInfo')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <a href="mailto:darkshare.store@gmail.com" className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 active:bg-white/10" data-testid="link-support-email">
            <Mail className="w-5 h-5 text-primary flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{t('support.email')}</p>
              <p className="text-sm font-medium truncate">darkshare.store@gmail.com</p>
            </div>
          </a>
          <a href="https://t.me/DarkShare1Bot" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-lg bg-[#2AABEE]/5 border border-[#2AABEE]/20 active:bg-[#2AABEE]/10" data-testid="link-support-telegram">
            <SiTelegram className="w-5 h-5 text-[#2AABEE] flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Telegram Bot</p>
              <p className="text-sm font-medium">@DarkShare1Bot</p>
            </div>
          </a>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 flex-wrap">
            <Send className="w-4 h-4 text-primary" />
            {t('support.formTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                {t('support.nameLabel')}
              </label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={t('support.namePlaceholder')}
                className="bg-white/5 border-white/10"
                data-testid="input-support-name"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" />
                {t('support.contactLabel')}
              </label>
              <Input
                value={form.contact}
                onChange={(e) => setForm({ ...form, contact: e.target.value })}
                placeholder={t('support.contactPlaceholder')}
                className="bg-white/5 border-white/10"
                data-testid="input-support-contact"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                {t('support.messageLabel')}
              </label>
              <Textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder={t('support.messagePlaceholder')}
                className="bg-white/5 border-white/10 min-h-[120px] resize-none"
                data-testid="input-support-message"
                required
              />
            </div>
            <Button
              type="submit"
              disabled={submitMutation.isPending || !form.name.trim() || !form.contact.trim() || !form.message.trim()}
              className="w-full gap-2"
              data-testid="button-submit-support"
            >
              {submitMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : submitMutation.isSuccess ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {submitMutation.isPending ? t('common.loading') : submitMutation.isSuccess ? t('support.sent') : t('common.submit')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Support() {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const { t } = useTranslation();
  const [, setLocation] = useLocation();

  if (isLoading) {
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

  if (isAuthenticated) {
    return (
      <PageLayout title="Support">
        <SupportForm />
      </PageLayout>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="relative z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 cursor-pointer" onClick={() => setLocation("/")}>
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
      <div className="flex-1">
        <SupportForm />
      </div>
      <Footer />
    </div>
  );
}
