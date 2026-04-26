import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, 
  Gift, 
  Zap, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  Globe,
  Lock,
  Search,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SiTelegram } from "react-icons/si";

const features = [
  { icon: Search, text: "10+ OSINT модулів аналізу", color: "text-cyan-400" },
  { icon: Lock, text: "AI-powered звіти безпеки", color: "text-cyan-400" },
  { icon: Globe, text: "Аналіз IP, крипто, email...", color: "text-purple-400" },
  { icon: Zap, text: "Миттєві результати", color: "text-amber-400" },
];

export default function ReferralLanding() {
  const { code } = useParams<{ code: string }>();
  const [countdown, setCountdown] = useState(5);
  const [autoRedirect, setAutoRedirect] = useState(true);
  
  const botUsername = "DarkShare1Bot";
  const telegramDeepLink = `https://t.me/${botUsername}?start=ref_${code}`;
  
  useEffect(() => {
    if (!autoRedirect) return;
    
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.href = telegramDeepLink;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [autoRedirect, telegramDeepLink]);
  
  const handleOpenBot = () => {
    window.location.href = telegramDeepLink;
  };
  
  const handleCancelRedirect = () => {
    setAutoRedirect(false);
    setCountdown(0);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(34,197,94,0.15)_0%,transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.1)_0%,transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(168,85,247,0.1)_0%,transparent_50%)]" />
      
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <motion.div
        className="relative z-10 max-w-md w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="text-center mb-8">
          <motion.div
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary via-cyan-400 to-cyan-400 mb-6 shadow-[0_0_60px_rgba(34,197,94,0.5)]"
            animate={{ 
              boxShadow: [
                "0 0 40px rgba(34,197,94,0.4)",
                "0 0 80px rgba(34,197,94,0.6)",
                "0 0 40px rgba(34,197,94,0.4)"
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Shield className="w-10 h-10 text-black" />
          </motion.div>
          
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-3">
            <span className="bg-gradient-to-r from-white via-white to-primary bg-clip-text text-transparent">
              DARKSHARE
            </span>
          </h1>
          <p className="text-sm text-muted-foreground tracking-[0.3em] mb-6">SECURITY OSINT PLATFORM</p>
          
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 via-pink-500/10 to-transparent border border-purple-500/30"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Gift className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-purple-300">Тебе запросив друг!</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </motion.div>
        </div>

        <motion.div
          className="p-6 rounded-2xl bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent border border-white/10 backdrop-blur-xl mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/20">
              <Star className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">Твій бонус</h2>
              <p className="text-xs text-muted-foreground">За реферальним кодом</p>
            </div>
          </div>
          
          <div className="p-4 rounded-xl bg-black/40 border border-primary/20 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Реферальний код:</span>
              <Badge className="bg-gradient-to-r from-primary/20 to-cyan-500/20 text-primary border-primary/30 font-mono text-sm px-3">
                {code}
              </Badge>
            </div>
          </div>
          
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-4 h-4 text-primary" />
              </div>
              <span className="text-muted-foreground">+5 безкоштовних перевірок</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-4 h-4 text-primary" />
              </div>
              <span className="text-muted-foreground">Повний доступ до всіх модулів</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-4 h-4 text-primary" />
              </div>
              <span className="text-muted-foreground">AI-аналіз та PDF звіти</span>
            </div>
          </div>
          
          <Button
            onClick={handleOpenBot}
            className="w-full h-14 text-lg bg-gradient-to-r from-[#0088cc] via-[#00a8e8] to-[#0088cc] hover:from-[#0099dd] hover:via-[#00b8f8] hover:to-[#0099dd] text-white border-0 shadow-[0_0_30px_rgba(0,136,204,0.4)] hover:shadow-[0_0_50px_rgba(0,136,204,0.6)] transition-all duration-300"
            data-testid="button-open-telegram"
          >
            <SiTelegram className="w-6 h-6 mr-3" />
            Відкрити в Telegram
            <ArrowRight className="w-5 h-5 ml-3" />
          </Button>
          
          <AnimatePresence>
            {autoRedirect && countdown > 0 && (
              <motion.div
                className="mt-4 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <p className="text-sm text-muted-foreground mb-2">
                  Автоматичне перенаправлення через <span className="text-primary font-bold">{countdown}</span> сек...
                </p>
                <button
                  onClick={handleCancelRedirect}
                  className="text-xs text-muted-foreground hover:text-white underline transition-colors"
                >
                  Скасувати
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div
          className="grid grid-cols-2 gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              className="p-3 rounded-xl bg-white/[0.02] border border-white/5 backdrop-blur-sm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + idx * 0.1 }}
            >
              <feature.icon className={`w-5 h-5 ${feature.color} mb-2`} />
              <p className="text-xs text-muted-foreground">{feature.text}</p>
            </motion.div>
          ))}
        </motion.div>

        <motion.p
          className="text-center text-xs text-muted-foreground/60 mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          darkshare.store - Professional Security OSINT
        </motion.p>
      </motion.div>
    </div>
  );
}
