import { useState } from "react";
import { useLocation } from "wouter";
import { 
  Shield, 
  Code2, 
  Copy, 
  Check, 
  ArrowLeft, 
  Lock,
  Eye,
  Palette,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageLayout } from "@/components/PageLayout";
import { MobileMenu } from "@/components/MobileMenu";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Footer } from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";

type WidgetStyle = "dark" | "light" | "minimal";

function WidgetContent() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [style, setStyle] = useState<WidgetStyle>("dark");
  const [previewActive, setPreviewActive] = useState(true);

  const userId = user?.id || 0;
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const getWidgetCode = (widgetStyle: WidgetStyle) => {
    const styles: Record<WidgetStyle, string> = {
      dark: `background:linear-gradient(135deg,#0a0a0a 0%,#1a1a2e 100%);color:#fff;border:1px solid rgba(34,197,94,0.3);`,
      light: `background:linear-gradient(135deg,#f8fafc 0%,#e2e8f0 100%);color:#1a1a2e;border:1px solid rgba(34,197,94,0.3);`,
      minimal: `background:transparent;color:inherit;border:1px solid rgba(128,128,128,0.2);`,
    };

    return `<!-- DARKSHARE Security Badge -->
<a href="${baseUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:8px;padding:8px 16px;border-radius:8px;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;${styles[widgetStyle]}box-shadow:0 2px 8px rgba(0,0,0,0.1);transition:all 0.2s ease;" onmouseover="this.style.transform='translateY(-1px)';this.style.boxShadow='0 4px 12px rgba(34,197,94,0.2)'" onmouseout="this.style.transform='';this.style.boxShadow='0 2px 8px rgba(0,0,0,0.1)'">
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
  <span style="font-weight:600;">Verified by DARKSHARE</span>
</a>`;
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(getWidgetCode(style));
      setCopied(true);
      toast({ title: t('common.copied'), description: "Widget code copied" });
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast({ title: t('common.error'), description: "Failed to copy", variant: "destructive" });
    }
  };

  const styleOptions: Array<{ id: WidgetStyle; label: string; desc: string }> = [
    { id: "dark", label: "Dark", desc: "Dark background with green accent" },
    { id: "light", label: "Light", desc: "Light background, clean look" },
    { id: "minimal", label: "Minimal", desc: "Transparent, adapts to your site" },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8 space-y-5">
      <div className="text-center space-y-2">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-cyan-500/10 flex items-center justify-center border border-primary/20">
          <Shield className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-2xl font-bold" data-testid="text-widget-title">{t('nav.widget')}</h1>
        <p className="text-muted-foreground text-sm">Add a security badge to your website</p>
      </div>

      <Card className="border-border/50 bg-card/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 flex-wrap">
            <Eye className="w-4 h-4 text-primary" />
            Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`flex items-center justify-center p-8 rounded-lg ${
            style === "dark" ? "bg-zinc-950" : style === "light" ? "bg-slate-100" : "bg-zinc-800/50"
          }`}>
            {previewActive && (
              <a
                href={baseUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] no-underline transition-all"
                style={{
                  background: style === "dark" 
                    ? "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)" 
                    : style === "light"
                    ? "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)"
                    : "transparent",
                  color: style === "dark" ? "#fff" : style === "light" ? "#1a1a2e" : "inherit",
                  border: style === "minimal" ? "1px solid rgba(128,128,128,0.2)" : "1px solid rgba(34,197,94,0.3)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                }}
                data-testid="widget-preview"
              >
                <Shield className="w-5 h-5 text-emerald-500" />
                <span className="font-semibold" style={{ color: style === "dark" ? "#fff" : style === "light" ? "#1a1a2e" : "#e2e8f0" }}>
                  Verified by DARKSHARE
                </span>
              </a>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 flex-wrap">
            <Palette className="w-4 h-4 text-violet-400" />
            Style
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {styleOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setStyle(opt.id)}
                className={`p-3 rounded-lg text-left transition-all ${
                  style === opt.id
                    ? "bg-primary/10 border border-primary/30"
                    : "bg-white/5 border border-white/10 hover-elevate"
                }`}
                data-testid={`button-style-${opt.id}`}
              >
                <p className="text-sm font-medium">{opt.label}</p>
                <p className="text-[11px] text-muted-foreground">{opt.desc}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 flex-wrap">
            <Code2 className="w-4 h-4 text-cyan-400" />
            HTML Code
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <pre className="text-xs font-mono p-4 rounded-lg bg-black/50 border border-white/10 overflow-x-auto whitespace-pre-wrap break-all max-h-[200px] overflow-y-auto" data-testid="text-widget-code">
              {getWidgetCode(style)}
            </pre>
          </div>
          <Button
            className="w-full gap-2"
            onClick={copyCode}
            data-testid="button-copy-widget"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? t('common.copied') : t('common.copy')}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 flex-wrap">
            <ExternalLink className="w-4 h-4 text-emerald-400" />
            How to install
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-3">
              <Badge variant="outline" className="h-6 w-6 flex items-center justify-center flex-shrink-0 rounded-full text-[11px]">1</Badge>
              <span>Copy the HTML code above</span>
            </li>
            <li className="flex gap-3">
              <Badge variant="outline" className="h-6 w-6 flex items-center justify-center flex-shrink-0 rounded-full text-[11px]">2</Badge>
              <span>Paste it into your website's HTML, usually in the footer section</span>
            </li>
            <li className="flex gap-3">
              <Badge variant="outline" className="h-6 w-6 flex items-center justify-center flex-shrink-0 rounded-full text-[11px]">3</Badge>
              <span>The badge will link back to DARKSHARE, showing your site is security-verified</span>
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Widget() {
  const { isAuthenticated, isLoading } = useAuth();
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
      <PageLayout>
        <WidgetContent />
      </PageLayout>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="relative z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 cursor-pointer" onClick={() => setLocation("/")} data-testid="link-home-brand-widget">
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
        <WidgetContent />
      </div>
      <Footer />
    </div>
  );
}
