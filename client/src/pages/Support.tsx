import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Mail, MessageSquare, Send, Loader2, CheckCircle, Phone, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLayout } from "@/components/PageLayout";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";
import { apiRequest } from "@/lib/queryClient";

export default function Support() {
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
    <PageLayout>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-cyan-500/10 flex items-center justify-center border border-primary/20">
            <MessageSquare className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">{t('support.title')}</h1>
          <p className="text-muted-foreground text-sm">{t('support.subtitle')}</p>
        </div>

        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary" />
              {t('support.contactInfo')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
              <Mail className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">{t('support.email')}</p>
                <a href="mailto:darkshare.store@gmail.com" className="text-sm font-medium hover:text-primary transition-colors" data-testid="link-support-email">
                  darkshare.store@gmail.com
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
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
    </PageLayout>
  );
}
