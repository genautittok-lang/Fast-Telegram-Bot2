import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Shield, Lock, Bot, ArrowLeft, Sparkles, CheckCircle, Zap, Globe, AlertTriangle, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useStats } from "@/hooks/use-stats";

function AnimatedCounter({ target, duration = 2000 }: { target: number; duration?: number }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (target <= 0) return;
    const stepTime = 30;
    const steps = Math.ceil(duration / stepTime);
    let current = 0;
    const increment = target / steps;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setValue(target);
        clearInterval(timer);
      } else {
        setValue(Math.floor(current));
      }
    }, stepTime);
    return () => clearInterval(timer);
  }, [target, duration]);

  return <span data-testid="animated-counter">{value.toLocaleString()}</span>;
}

declare global {
  interface Window {
    TelegramLoginWidget?: {
      dataOnauth: (user: any) => void;
    };
    onTelegramAuth?: (user: any) => void;
  }
}

export default function Login() {
  const telegramRef = useRef<HTMLDivElement>(null);
  const { login, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { data: platformStats } = useStats();
  
  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/dashboard");
      return;
    }
  }, [isAuthenticated, setLocation]);

  useEffect(() => {
    window.onTelegramAuth = async (telegramUser: any) => {
      try {
        await login(telegramUser);
        toast({
          title: t("auth.loginSuccess"),
          description: `${t("landing.hero.welcome")}, ${telegramUser.first_name || telegramUser.username}!`,
        });
        setLocation("/dashboard");
      } catch (err) {
        toast({
          title: t("auth.loginError"),
          description: t("auth.telegramFailed"),
          variant: "destructive",
        });
      }
    };

    if (telegramRef.current) {
      telegramRef.current.innerHTML = "";
      const script = document.createElement("script");
      script.src = "https://telegram.org/js/telegram-widget.js?22";
      script.setAttribute("data-telegram-login", "DARKSHAREN1_BOT");
      script.setAttribute("data-size", "large");
      script.setAttribute("data-radius", "8");
      script.setAttribute("data-onauth", "onTelegramAuth(user)");
      script.setAttribute("data-request-access", "write");
      script.setAttribute("data-userpic", "false");
      script.async = true;
      telegramRef.current.appendChild(script);
    }

    return () => {
      delete window.onTelegramAuth;
    };
  }, [login, setLocation, toast]);

  const featuresList = [
    { icon: Shield, title: t("landing.features.protection"), desc: t("landing.features.realTimeAnalysis") },
    { icon: Globe, title: t("landing.features.modules"), desc: "IP, Wallet, Email, Phone, Domain, URL, CVE, Hash, Username, Bot" },
    { icon: Zap, title: t("landing.features.instant"), desc: t("landing.features.resultInSeconds") },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10" />
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl opacity-30 animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-20" />

      <div className="relative z-10 min-h-screen flex">
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center p-12 xl:p-20">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex justify-between items-center mb-8">
              <Link href="/">
                <Button variant="ghost" data-testid="button-back-home">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t("common.back")}
                </Button>
              </Link>
              <LanguageSwitcher variant="minimal" />
            </div>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
                <Shield className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-display font-bold">DARKSHARE</h1>
                <p className="text-sm text-muted-foreground">Risk Intelligence Platform</p>
              </div>
            </div>

            <h2 className="text-4xl xl:text-5xl font-display font-bold mb-6 leading-tight">
              {t("auth.protectFrom")} <span className="text-primary">{t("auth.cyberThreats")}</span>
            </h2>
            
            <p className="text-lg text-muted-foreground mb-10 max-w-lg">
              {t("landing.hero.description")}
            </p>

            <div className="space-y-4">
              {featuresList.map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 + idx * 0.1 }}
                  className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {platformStats && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="grid grid-cols-3 gap-3 mt-8"
                data-testid="login-stats-bar"
              >
                <div className="text-center p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-xl font-bold font-display text-primary" data-testid="login-stat-checks">
                    <AnimatedCounter target={platformStats.totalReports} />
                  </div>
                  <div className="text-[10px] text-muted-foreground">{t('dashboard.checks')}</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-xl font-bold font-display text-orange-400" data-testid="login-stat-threats">
                    <AnimatedCounter target={platformStats.threatsBlocked} />
                  </div>
                  <div className="text-[10px] text-muted-foreground">{t('dashboard.threats')}</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-xl font-bold font-display text-green-400" data-testid="login-stat-today">
                    <AnimatedCounter target={platformStats.checksToday} />
                  </div>
                  <div className="text-[10px] text-muted-foreground">{t('dashboard.checksToday') || "Today"}</div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>

        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full max-w-md"
          >
            <div className="lg:hidden flex justify-between items-center mb-8">
              <Link href="/">
                <Button variant="ghost" data-testid="button-back-home-mobile">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t("common.back")}
                </Button>
              </Link>
              <LanguageSwitcher variant="minimal" />
            </div>

            <Card className="bg-card/80 backdrop-blur-xl border-white/10 shadow-2xl">
              <CardHeader className="text-center pb-2 pt-8">
                <div className="mx-auto mb-4 w-24 h-24 rounded-3xl overflow-hidden border-2 border-primary/30 shadow-[0_0_30px_rgba(var(--primary),0.2)]">
                  <img src="/logo.png" alt="DARKSHARE" className="w-full h-full object-cover" />
                </div>
                <h2 className="text-2xl font-display font-bold">{t("auth.loginTitle")}</h2>
                <p className="text-muted-foreground text-sm mt-2">
                  {t("auth.loginSubtitle")}
                </p>
              </CardHeader>
              <CardContent className="space-y-6 pb-8">
                <div className="flex flex-col items-center gap-4">
                  <div 
                    ref={telegramRef} 
                    className="telegram-login-container"
                    data-testid="telegram-login-widget"
                  />
                </div>
                
                              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
