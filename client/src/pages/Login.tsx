import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Shield, Lock, Bot, ArrowLeft, Sparkles, CheckCircle, Zap, Globe, Languages } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { translations } from "@/lib/i18n";

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
  const [lang, setLang] = useState<keyof typeof translations>("UA");
  const t = translations[lang];

  useEffect(() => {
    const savedLang = localStorage.getItem("lang") as keyof typeof translations;
    if (savedLang && translations[savedLang]) {
      setLang(savedLang);
    }
  }, []);

  const toggleLang = (newLang: keyof typeof translations) => {
    setLang(newLang);
    localStorage.setItem("lang", newLang);
  };
  
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
          title: lang === "UA" ? "Успішний вхід" : lang === "RU" ? "Успешный вход" : "Login Successful",
          description: `Welcome, ${telegramUser.first_name || telegramUser.username}!`,
        });
        setLocation("/dashboard");
      } catch (err) {
        toast({
          title: lang === "UA" ? "Помилка входу" : lang === "RU" ? "Ошибка входа" : "Login Error",
          description: "Telegram auth failed",
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
  }, [login, setLocation, toast, lang]);

  const featuresList = [
    { icon: Shield, title: t.features.shield, desc: lang === "UA" ? "Аналіз загроз в реальному часі" : lang === "EN" ? "Real-time threat analysis" : "Анализ угроз в реальном времени" },
    { icon: Globe, title: t.features.modules, desc: "IP, Wallet, Email, Phone, Domain, URL" },
    { icon: Zap, title: t.features.instant, desc: lang === "UA" ? "Результат за секунди" : lang === "EN" ? "Result in seconds" : "Результат за секунды" },
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
                  {t.backHome}
                </Button>
              </Link>
              <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
                {(["UA", "RU", "EN"] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => toggleLang(l)}
                    className={`px-3 py-1.5 text-xs font-bold rounded ${lang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-white"}`}
                  >
                    {l}
                  </button>
                ))}
              </div>
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
              {lang === "UA" ? "Захистіть себе від " : lang === "RU" ? "Защитите себя от " : "Protect yourself from "}
              <span className="text-primary">{lang === "UA" ? "кіберзагроз" : lang === "RU" ? "киберугроз" : "cyber threats"}</span>
            </h2>
            
            <p className="text-lg text-muted-foreground mb-10 max-w-lg">
              {t.heroDescription}
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
                  {t.backHome}
                </Button>
              </Link>
              <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
                {(["UA", "RU", "EN"] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => toggleLang(l)}
                    className={`px-2 py-1 text-[10px] font-bold rounded ${lang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-white"}`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <Card className="bg-card/80 backdrop-blur-xl border-white/10 shadow-2xl">
              <CardHeader className="text-center pb-2 pt-8">
                <div className="mx-auto mb-4 w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20">
                  <Lock className="w-9 h-9 text-primary" />
                </div>
                <h2 className="text-2xl font-display font-bold">{t.loginTitle}</h2>
                <p className="text-muted-foreground text-sm mt-2">
                  {t.loginSubtitle}
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
