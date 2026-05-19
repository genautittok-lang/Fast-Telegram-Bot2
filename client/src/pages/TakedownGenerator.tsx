import { useState } from "react";
import { ArrowLeft, Lock, FileSignature, Copy, Download, CheckCircle2, Mail, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageLayout } from "@/components/PageLayout";
import { MobileMenu } from "@/components/MobileMenu";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Seo } from "@/components/Seo";

function TakedownContent() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [recipientType, setRecipientType] = useState("website_admin");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [dataDescription, setDataDescription] = useState("");
  const [urls, setUrls] = useState("");
  const [requesterName, setRequesterName] = useState("");
  const [requesterEmail, setRequesterEmail] = useState("");
  const [jurisdiction, setJurisdiction] = useState("EU");
  const [language, setLanguage] = useState("uk");
  const [letter, setLetter] = useState<string>("");

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/takedown-letter", {
        recipientType,
        recipientName: recipientName || undefined,
        recipientEmail: recipientEmail || undefined,
        dataDescription,
        jurisdiction,
        language,
        requesterName: requesterName || undefined,
        requesterEmail: requesterEmail || undefined,
        urlsContainingData: urls.split("\n").map((u) => u.trim()).filter(Boolean),
      });
      return (await res.json()) as { letterText: string };
    },
    onSuccess: (data) => {
      setLetter(data.letterText);
      toast({ title: "Лист згенеровано", description: "Скопіюйте та надішліть отримувачу" });
    },
    onError: (err: any) => toast({ title: "Помилка", description: err?.message ?? "Не вдалося згенерувати", variant: "destructive" }),
  });

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(letter);
      toast({ title: "Скопійовано", description: "Лист в буфері обміну" });
    } catch {
      toast({ title: "Помилка копіювання", variant: "destructive" });
    }
  };

  const download = () => {
    const blob = new Blob([letter], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gdpr-takedown-${jurisdiction}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8 space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/")} data-testid="button-back-takedown">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1" />
      </div>

      <div className="text-center space-y-2">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-violet-500/10 flex items-center justify-center border border-primary/30">
          <FileSignature className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-2xl font-bold" data-testid="text-takedown-title">GDPR Takedown Generator</h1>
        <p className="text-muted-foreground text-sm">Безкоштовно • 5 юрисдикцій • 3 мови</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Параметри листа</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Юрисдикція</Label>
              <Select value={jurisdiction} onValueChange={setJurisdiction}>
                <SelectTrigger data-testid="select-jurisdiction"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="EU">EU — GDPR</SelectItem>
                  <SelectItem value="UK">UK — UK GDPR + DPA 2018</SelectItem>
                  <SelectItem value="UA">Україна — ЗУ №2297-VI</SelectItem>
                  <SelectItem value="US">США — CCPA (Каліфорнія)</SelectItem>
                  <SelectItem value="RU">РФ — 152-ФЗ</SelectItem>
                  <SelectItem value="OTHER">Інше</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Мова листа</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger data-testid="select-language"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="uk">Українська</SelectItem>
                  <SelectItem value="ru">Русский</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Тип отримувача</Label>
            <Select value={recipientType} onValueChange={setRecipientType}>
              <SelectTrigger data-testid="select-recipient-type"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="website_admin">Адміністратор сайту</SelectItem>
                <SelectItem value="hosting_provider">Хостинг-провайдер (abuse team)</SelectItem>
                <SelectItem value="search_engine">Пошукова система</SelectItem>
                <SelectItem value="social_platform">Соціальна платформа</SelectItem>
                <SelectItem value="data_broker">Data broker</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Назва отримувача (необов'язково)</Label>
              <Input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="Cloudflare Inc." data-testid="input-recipient-name" />
            </div>
            <div className="space-y-2">
              <Label>Email отримувача (необов'язково)</Label>
              <Input value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} placeholder="abuse@..." data-testid="input-recipient-email" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Які саме дані видалити *</Label>
            <Textarea
              value={dataDescription}
              onChange={(e) => setDataDescription(e.target.value)}
              placeholder="Мій email someone@example.com та номер +380... опубліковано без моєї згоди на сторінці..."
              rows={4}
              maxLength={4000}
              data-testid="input-data-description"
            />
            <p className="text-xs text-muted-foreground">{dataDescription.length}/4000</p>
          </div>

          <div className="space-y-2">
            <Label>URL-адреси з даними (по одному на рядок)</Label>
            <Textarea value={urls} onChange={(e) => setUrls(e.target.value)} placeholder="https://example.com/leak/123" rows={3} data-testid="input-urls" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ваше ім'я (необов'язково)</Label>
              <Input value={requesterName} onChange={(e) => setRequesterName(e.target.value)} placeholder="Іван Петренко" data-testid="input-requester-name" />
            </div>
            <div className="space-y-2">
              <Label>Ваш email (необов'язково)</Label>
              <Input value={requesterEmail} onChange={(e) => setRequesterEmail(e.target.value)} placeholder="you@example.com" data-testid="input-requester-email" />
            </div>
          </div>

          <Button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending || dataDescription.length < 10}
            className="w-full"
            data-testid="button-generate-takedown"
          >
            {generateMutation.isPending ? "Генерую..." : "Згенерувати лист"}
            <FileSignature className="w-4 h-4 ml-1" />
          </Button>
        </CardContent>
      </Card>

      {letter && (
        <Card className="border-cyan-500/20">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              Згенерований лист
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <pre className="text-xs whitespace-pre-wrap p-4 bg-background/50 border border-border rounded-lg max-h-[500px] overflow-y-auto font-mono leading-relaxed" data-testid="text-letter-output">
              {letter}
            </pre>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" onClick={copy} data-testid="button-copy-letter">
                <Copy className="w-4 h-4 mr-1" /> Скопіювати
              </Button>
              <Button variant="outline" onClick={download} data-testid="button-download-letter">
                <Download className="w-4 h-4 mr-1" /> Завантажити .txt
              </Button>
              {recipientEmail && (
                <a
                  href={`mailto:${recipientEmail}?subject=${encodeURIComponent("Personal Data Erasure Request")}&body=${encodeURIComponent(letter)}`}
                  className="inline-flex items-center px-3 py-2 rounded-md bg-primary/10 text-primary text-sm border border-primary/20 hover:bg-primary/20"
                  data-testid="link-email-letter"
                >
                  <Mail className="w-4 h-4 mr-1" /> Надіслати email
                </a>
              )}
            </div>
            <div className="text-xs text-muted-foreground p-3 bg-muted/30 rounded-md border border-border/50 space-y-1">
              <p><strong>Що робити далі:</strong></p>
              <ol className="list-decimal ml-5 space-y-0.5">
                <li>Знайдіть офіційний abuse-email отримувача на його сайті (зазвичай <code>abuse@domain</code>, <code>privacy@domain</code>, <code>dpo@domain</code>).</li>
                <li>Надішліть лист з вашого основного email (для підтвердження особи).</li>
                <li>Збережіть копію та номер тікета з відповіді.</li>
                <li>Якщо ігнорують 30+ днів — подавайте скаргу до наглядового органу (для GDPR — DPA країни).</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-amber-500/20 bg-amber-500/5">
        <CardContent className="pt-4">
          <p className="text-xs text-amber-200/80 leading-relaxed">
            <Globe className="w-3 h-3 inline mr-1" />
            Шаблон надається в інформаційних цілях та не є юридичною консультацією. Для специфіки юрисдикції зверніться до кваліфікованого юриста.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function TakedownGenerator() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  const seo = (
    <Seo
      title="GDPR Takedown Letter Generator — Free Right-to-Erasure Tool"
      description="Generate ready-to-send GDPR Art. 17 takedown letters in 5 languages. Remove your data from websites, hosting providers, search engines and data brokers. Free, no signup."
      keywords="GDPR takedown letter, right to erasure template, remove my data from internet, DMCA takedown generator, data broker opt-out, UK DPA removal request"
      path="/takedown"
    />
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <PageLayout title="Takedown">{seo}<TakedownContent /></PageLayout>;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {seo}
      <nav className="relative z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 cursor-pointer" onClick={() => setLocation("/")} data-testid="link-home-brand-takedown">
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
      <div className="flex-1"><TakedownContent /></div>
      <Footer />
    </div>
  );
}
