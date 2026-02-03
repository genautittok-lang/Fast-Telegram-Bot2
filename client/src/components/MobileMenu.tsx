import { Link, useLocation } from "wouter";
import { 
  Shield, 
  FileText, 
  Eye, 
  Gift, 
  Globe,
  Menu,
  X,
  Zap,
  Star,
  Home,
  History,
  Users,
  LogOut
} from "lucide-react";
import { SiTelegram } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { StatusBadge } from "@/components/StatusBadge";

interface MobileMenuProps {
  lang?: "UA" | "RU" | "EN";
  isAuthenticated?: boolean;
  onLogout?: () => void;
}

export function MobileMenu({ lang = "UA", isAuthenticated = false, onLogout }: MobileMenuProps) {
  const [location] = useLocation();
  
  const t = {
    UA: {
      dashboard: "Панель",
      webVersion: "Веб версія",
      bot: "Бот перевірок",
      features: "Можливості",
      modules: "10 модулів",
      reports: "PDF звіти",
      monitoring: "Моніторинг",
      referrals: "Реферали",
      bonuses: "Бонуси",
      checks: "15 перевірок",
      free: "безкоштовно",
      start: "Почати перевірку",
      home: "Головна",
      history: "Історія",
      logout: "Вийти"
    },
    RU: {
      dashboard: "Панель",
      webVersion: "Веб версия",
      bot: "Бот проверок",
      features: "Возможности",
      modules: "10 модулей",
      reports: "PDF отчеты",
      monitoring: "Мониторинг",
      referrals: "Рефералы",
      bonuses: "Бонусы",
      checks: "15 проверок",
      free: "бесплатно",
      start: "Начать проверку",
      home: "Главная",
      history: "История",
      logout: "Выйти"
    },
    EN: {
      dashboard: "Dashboard",
      webVersion: "Web version",
      bot: "Check bot",
      features: "Features",
      modules: "10 modules",
      reports: "PDF reports",
      monitoring: "Monitoring",
      referrals: "Referrals",
      bonuses: "Bonuses",
      checks: "15 checks",
      free: "free",
      start: "Start checking",
      home: "Home",
      history: "History",
      logout: "Logout"
    }
  };

  const text = t[lang];

  const navItems = isAuthenticated ? [
    { href: "/dashboard", icon: Shield, label: text.dashboard, color: "primary" },
    { href: "/history", icon: History, label: text.history, color: "blue" },
    { href: "/monitoring", icon: Eye, label: text.monitoring, color: "purple" },
    { href: "/referral", icon: Users, label: text.referrals, color: "green" },
  ] : [];

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="sm:hidden bg-white/5 border border-white/10 hover:bg-white/10"
          data-testid="button-mobile-menu"
        >
          <Menu className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-auto max-h-[85vh] rounded-t-[1.5rem] bg-gradient-to-b from-background via-background to-background/95 border-t border-white/10 p-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />
        
        <div className="flex flex-col h-full relative z-10">
          <div className="flex justify-center py-2">
            <div className="w-12 h-1 rounded-full bg-white/50" />
          </div>
          
          <div className="px-4 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/40 blur-lg rounded-full" />
                <div className="relative w-10 h-10 rounded-xl overflow-hidden border-2 border-primary/50 shadow-[0_0_20px_rgba(var(--primary),0.3)]">
                  <img src="/logo.png" alt="DARKSHARE" className="w-full h-full object-cover" />
                </div>
              </div>
              <div>
                <span className="font-display font-bold text-lg text-white tracking-tight">DARKSHARE</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[9px] text-primary font-mono bg-primary/20 px-1.5 py-0.5 rounded-full border border-primary/30">v4.0</span>
                  <StatusBadge status="online" />
                </div>
              </div>
            </div>
            <SheetClose asChild>
              <Button variant="ghost" size="icon" className="rounded-full bg-white/10 hover:bg-white/20 border border-white/10 h-8 w-8">
                <X className="w-4 h-4" />
              </Button>
            </SheetClose>
          </div>
          
          <div className="px-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <SheetClose asChild>
                <Link href={isAuthenticated ? "/dashboard" : "/login"}>
                  <div className="relative overflow-hidden bg-gradient-to-br from-primary/30 via-primary/20 to-primary/5 border border-primary/40 rounded-2xl p-3 flex flex-col items-center gap-2 active:scale-[0.98] transition-all duration-200 shadow-[0_4px_20px_rgba(var(--primary),0.2)]" data-testid="link-mobile-dashboard">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-primary/20 rounded-full blur-2xl" />
                    <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-primary/40 to-primary/20 flex items-center justify-center border border-primary/30">
                      <Shield className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-center relative">
                      <p className="font-bold text-sm text-white">{text.dashboard}</p>
                      <p className="text-[9px] text-primary/80">{text.webVersion}</p>
                    </div>
                  </div>
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <a href="https://t.me/DARKSHAREN1_BOT" target="_blank" rel="noopener noreferrer">
                  <div className="relative overflow-hidden bg-gradient-to-br from-[#2AABEE]/30 via-[#2AABEE]/20 to-[#2AABEE]/5 border border-[#2AABEE]/40 rounded-2xl p-3 flex flex-col items-center gap-2 active:scale-[0.98] transition-all duration-200 shadow-[0_4px_20px_rgba(42,171,238,0.2)]" data-testid="link-mobile-bot">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-[#2AABEE]/20 rounded-full blur-2xl" />
                    <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-[#2AABEE]/40 to-[#2AABEE]/20 flex items-center justify-center border border-[#2AABEE]/30">
                      <SiTelegram className="w-5 h-5 text-[#2AABEE]" />
                    </div>
                    <div className="text-center relative">
                      <p className="font-bold text-sm text-white">Telegram</p>
                      <p className="text-[9px] text-[#2AABEE]/80">{text.bot}</p>
                    </div>
                  </div>
                </a>
              </SheetClose>
            </div>
          </div>
          
          {isAuthenticated && navItems.length > 0 && (
            <div className="px-4 py-2">
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                {navItems.map((item) => (
                  <SheetClose key={item.href} asChild>
                    <Link href={item.href}>
                      <div className={`flex items-center gap-1.5 px-3 py-2 rounded-full border transition-all ${
                        location === item.href 
                          ? 'bg-primary/20 border-primary/40 text-primary' 
                          : 'bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10'
                      }`}>
                        <item.icon className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium whitespace-nowrap">{item.label}</span>
                      </div>
                    </Link>
                  </SheetClose>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex-1 overflow-y-auto px-4 py-2">
            <p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-2 font-bold">
              {text.features}
            </p>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gradient-to-br from-white/10 to-white/5 rounded-xl p-3 border border-white/10 backdrop-blur-sm">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center mb-2">
                  <Globe className="w-4 h-4 text-primary" />
                </div>
                <p className="text-xs font-semibold text-white">{text.modules}</p>
                <p className="text-[9px] text-muted-foreground">IP, Email, Wallet</p>
              </div>
              <div className="bg-gradient-to-br from-white/10 to-white/5 rounded-xl p-3 border border-white/10 backdrop-blur-sm">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center mb-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                </div>
                <p className="text-xs font-semibold text-white">{text.reports}</p>
                <p className="text-[9px] text-muted-foreground">QR code</p>
              </div>
              <div className="bg-gradient-to-br from-white/10 to-white/5 rounded-xl p-3 border border-white/10 backdrop-blur-sm">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center mb-2">
                  <Eye className="w-4 h-4 text-purple-400" />
                </div>
                <p className="text-xs font-semibold text-white">{text.monitoring}</p>
                <p className="text-[9px] text-muted-foreground">24/7</p>
              </div>
              <div className="bg-gradient-to-br from-white/10 to-white/5 rounded-xl p-3 border border-white/10 backdrop-blur-sm">
                <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center mb-2">
                  <Gift className="w-4 h-4 text-green-400" />
                </div>
                <p className="text-xs font-semibold text-white">{text.referrals}</p>
                <p className="text-[9px] text-muted-foreground">{text.bonuses}</p>
              </div>
            </div>
          </div>
          
          <div className="px-4 py-3 pb-6 border-t border-white/10 bg-gradient-to-t from-background to-transparent">
            <div className="flex items-center justify-between mb-3 bg-gradient-to-r from-yellow-500/20 via-orange-500/15 to-yellow-500/20 rounded-xl p-3 border border-yellow-500/30 shadow-[0_0_20px_rgba(234,179,8,0.1)]">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-yellow-500/30 to-orange-500/30 flex items-center justify-center">
                  <Star className="w-4 h-4 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{text.checks}</p>
                  <p className="text-[10px] text-yellow-500/80">{text.free}</p>
                </div>
              </div>
              <Zap className="w-5 h-5 text-yellow-500 animate-pulse" />
            </div>
            
            <div className="flex gap-2">
              {isAuthenticated && onLogout ? (
                <>
                  <SheetClose asChild>
                    <Link href="/dashboard" className="flex-1">
                      <Button className="w-full h-11 gap-2 text-sm font-bold rounded-xl shadow-[0_4px_20px_rgba(var(--primary),0.3)]" data-testid="button-mobile-start">
                        <Shield className="w-4 h-4" />
                        {text.start}
                      </Button>
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button 
                      variant="outline" 
                      size="icon"
                      className="h-11 w-11 rounded-xl border-red-500/30 hover:bg-red-500/10"
                      onClick={onLogout}
                      data-testid="button-mobile-logout"
                    >
                      <LogOut className="w-4 h-4 text-red-400" />
                    </Button>
                  </SheetClose>
                </>
              ) : (
                <SheetClose asChild>
                  <Link href="/login" className="w-full">
                    <Button className="w-full h-11 gap-2 text-sm font-bold rounded-xl shadow-[0_4px_20px_rgba(var(--primary),0.3)]" data-testid="button-mobile-start">
                      <Shield className="w-4 h-4" />
                      {text.start}
                    </Button>
                  </Link>
                </SheetClose>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}