import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { 
  ShieldCheck, 
  Globe, 
  Wallet, 
  FileText, 
  Activity, 
  Zap, 
  Terminal,
  Lock,
  ChevronRight,
  TrendingUp,
  Users,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  Flame,
  Languages,
  Bot
} from "lucide-react";
import { useStats } from "@/hooks/use-stats";
import { useActivity, useLeaderboard } from "@/hooks/use-activity";
import { TerminalText } from "@/components/TerminalText";
import { StatusBadge } from "@/components/StatusBadge";
import { FeatureCard } from "@/components/FeatureCard";
import { StatCard } from "@/components/StatCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { translations } from "@/lib/i18n";

export default function Home() {
  const [lang, setLang] = useState<"UA" | "RU" | "EN">("UA");
  const t = translations[lang as keyof typeof translations];

  useEffect(() => {
    const savedLang = localStorage.getItem("lang") as keyof typeof translations;
    if (savedLang && translations[savedLang]) {
      setLang(savedLang);
    }
  }, []);

  const toggleLang = (newLang: "UA" | "RU" | "EN") => {
    setLang(newLang);
    localStorage.setItem("lang", newLang);
  };
  
  const { data: stats } = useStats();
  const { data: activity } = useActivity();
  const { data: leaderboard } = useLeaderboard();
  
  const features = [
    {
      icon: <Wallet className="w-6 h-6" />,
      title: lang === "UA" ? "Blockchain Аналітика" : lang === "RU" ? "Blockchain Аналитика" : "Blockchain Analytics",
      description: lang === "UA" ? "Глибокий аналіз історій гаманців та ризиків." : lang === "RU" ? "Глубокий анализ историй кошельков и рисков." : "Deep dive into wallet histories and risk scoring."
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "OSINT Intelligence",
      description: "Deep data gathering from open sources across the web."
    }
  ];

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-muted-foreground';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'wallet': return <Wallet className="w-4 h-4" />;
      case 'ip': return <Globe className="w-4 h-4" />;
      case 'email': return <FileText className="w-4 h-4" />;
      case 'domain': return <Globe className="w-4 h-4" />;
      case 'url': return <AlertTriangle className="w-4 h-4" />;
      case 'phone': return <Activity className="w-4 h-4" />;
      default: return <CheckCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden flex flex-col bg-background">
      <div className="absolute inset-0 z-0 bg-[linear-gradient(rgba(10,10,10,0.9),rgba(10,10,10,0.95)),url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20 pointer-events-none" />
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <nav className="relative z-10 w-full border-b border-white/5 bg-background/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg overflow-hidden border border-primary/50 shadow-[0_0_15px_rgba(var(--primary),0.2)]">
              <img src="/logo.png" alt="DARKSHARE" className="w-full h-full object-cover" />
            </div>
            <span className="font-display font-bold text-2xl tracking-tighter text-white">DARKSHARE <span className="text-primary">v4.0</span></span>
          </div>
          <div className="flex items-center gap-4">
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
            <StatusBadge status="online" />
            <span className="text-xs text-muted-foreground font-mono hidden sm:block">
              Uptime: {stats?.uptime?.toFixed(1) || '99.9'}%
            </span>
          </div>
        </div>
      </nav>

      <main className="flex-grow relative z-10">
        <section className="pt-16 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="space-y-6"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-mono text-muted-foreground">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <TerminalText text="System v4.0.1 initialized..." speed={50} />
                </div>

                <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-white">
                  {t.heroTitle} <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/50 text-glow">
                    {t.heroSubtitle}
                  </span>
                </h1>

                <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
                  {t.heroDescription}
                </p>

                <div className="flex flex-col sm:flex-row items-start gap-4 pt-4">
                  <Link href="/login">
                    <div 
                      className="group relative px-8 py-4 bg-primary text-primary-foreground font-bold rounded-xl text-lg flex items-center gap-2 overflow-hidden transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                      data-testid="button-web-dashboard"
                    >
                      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                      <ShieldCheck className="w-5 h-5" />
                      <span>{t.webDashboard}</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                  <a 
                    href="https://t.me/DARKSHAREN1_BOT" 
                    target="_blank" 
                    rel="noreferrer"
                    className="group relative px-8 py-4 bg-white/10 border border-white/20 text-white font-bold rounded-xl text-lg flex items-center gap-2 overflow-hidden transition-transform hover:scale-105 active:scale-95"
                    data-testid="button-launch-bot"
                  >
                    <Zap className="w-5 h-5" />
                    <span>{t.launchBot}</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </a>
                </div>
              </motion.div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-8">
                <StatCard 
                  label={t.users} 
                  value={stats?.totalUsers?.toLocaleString() ?? '14,582'} 
                  icon={<Users className="w-4 h-4" />}
                  delay={0.1} 
                />
                <StatCard 
                  label={t.monitors} 
                  value={stats?.activeWatches?.toLocaleString() ?? '3,841'} 
                  icon={<Eye className="w-4 h-4" />}
                  delay={0.2} 
                />
                <StatCard 
                  label={t.threats} 
                  value={stats?.threatsBlocked?.toLocaleString() ?? '12,459'} 
                  icon={<AlertTriangle className="w-4 h-4" />}
                  delay={0.3} 
                />
                <StatCard 
                  label={t.today} 
                  value={stats?.checksToday?.toLocaleString() ?? '842'} 
                  icon={<TrendingUp className="w-4 h-4" />}
                  delay={0.4} 
                />
              </div>
            </div>


            <div className="space-y-4">
              <Card className="bg-black/40 border-white/10 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" />
                    Live Activity
                  </h3>
                  <span className="text-xs text-muted-foreground font-mono">Real-time</span>
                </div>
                <div className="space-y-2 max-h-[200px] overflow-hidden">
                  {activity?.slice(0, 6).map((item, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-center justify-between text-xs p-2 rounded bg-white/5 border border-white/5"
                    >
                      <div className="flex items-center gap-2">
                        {getTypeIcon(item.type)}
                        <span className="font-mono text-muted-foreground">{item.target}</span>
                      </div>
                      <span className={`font-bold uppercase text-[10px] ${getRiskColor(item.riskLevel)}`}>
                        {item.riskLevel}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </Card>

              <Card className="bg-black/40 border-white/10 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-500" />
                    Top Hunters
                  </h3>
                  <span className="text-xs text-muted-foreground font-mono">Streak</span>
                </div>
                <div className="space-y-2">
                  {leaderboard?.slice(0, 5).map((user, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-center justify-between text-xs p-2 rounded bg-white/5 border border-white/5"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          idx === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                          idx === 1 ? 'bg-gray-400/20 text-gray-400' :
                          idx === 2 ? 'bg-orange-500/20 text-orange-500' :
                          'bg-white/10 text-muted-foreground'
                        }`}>
                          {idx + 1}
                        </span>
                        <span className="font-mono">{user.username}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span>{user.checks}</span>
                        <Flame className="w-3 h-3 text-orange-500" />
                        <span>{user.streakDays}d</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-20 bg-black/20 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 space-y-2">
              <h2 className="text-3xl font-bold font-display">Modular Intelligence</h2>
              <p className="text-muted-foreground">Everything you need to stay safe in the digital dark forest.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, idx) => (
                <FeatureCard 
                  key={idx}
                  {...feature}
                  delay={0.1 * idx}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 max-w-5xl mx-auto px-4">
          <div className="rounded-xl overflow-hidden border border-white/10 bg-[#0c0c0c] shadow-2xl shadow-primary/5">
            <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border-b border-white/10">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
              </div>
              <div className="flex-1 text-center font-mono text-xs text-muted-foreground opacity-50">darkshare_cli — v4.0</div>
            </div>
            <div className="p-6 font-mono text-sm space-y-4 h-[350px] overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0c0c0c] z-10 pointer-events-none" />
              
              <div className="text-green-500/50 mb-2">$ ./darkshare scan 0x1234...5678</div>
              <div className="space-y-1 text-muted-foreground">
                <TerminalText text="[INIT] Connecting to blockchain nodes..." delay={500} speed={20} cursor={false} />
                <br />
                <TerminalText text="[INFO] Target: Wallet (ETH Mainnet)" delay={1500} speed={20} cursor={false} />
                <br />
                <TerminalText text="[SCAN] Analyzing transaction history (154 txs found)..." delay={2500} speed={30} cursor={false} />
                <br />
                <TerminalText text="[WARN] Interaction with Tornado Cash detected (Block #1234567)" delay={4500} speed={20} className="text-yellow-500" cursor={false} />
                <br />
                <TerminalText text="[SCAN] Checking blacklist databases..." delay={6000} speed={20} cursor={false} />
                <br />
                <TerminalText text="[OK] No sanctions found (OFAC/EU)" delay={7500} speed={20} className="text-green-500" cursor={false} />
                <br />
                <TerminalText text="[DONE] Risk Score: MEDIUM (45/100). Report generated." delay={9000} speed={30} className="text-primary font-bold" />
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-primary/5 border-t border-primary/20">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to Start?</h2>
            <p className="text-muted-foreground mb-8">Join thousands of users who trust DARKSHARE for their security needs.</p>
            <a 
              href="https://t.me/DARKSHAREN1_BOT" 
              target="_blank" 
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-bold rounded-xl text-lg transition-transform hover:scale-105 active:scale-95"
              data-testid="button-launch-bot-cta"
            >
              <Zap className="w-5 h-5 fill-current" />
              Launch DARKSHARE Bot
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5 py-8 bg-black/40 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 opacity-50">
            <ShieldCheck className="w-5 h-5" />
            <span className="font-display font-bold">DARKSHARE v4.0</span>
          </div>
          
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">Privacy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms</a>
            <a href="#" className="hover:text-primary transition-colors">Support</a>
          </div>

          <div className="text-xs text-muted-foreground font-mono">
            © 2024 DARKSHARE INT.
          </div>
        </div>
      </footer>
    </div>
  );
}
