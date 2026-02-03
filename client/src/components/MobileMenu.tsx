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
  History,
  Users,
  LogOut,
  ChevronRight
} from "lucide-react";
import { SiTelegram } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";

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
      webVersion: "Веб",
      bot: "Бот",
      modules: "10 модулів",
      reports: "PDF звіти",
      monitoring: "Моніторинг",
      referrals: "Реферали",
      checks: "15 перевірок",
      free: "безкоштовно",
      start: "Почати",
      history: "Історія",
      logout: "Вийти"
    },
    RU: {
      dashboard: "Панель",
      webVersion: "Веб",
      bot: "Бот",
      modules: "10 модулей",
      reports: "PDF отчеты",
      monitoring: "Мониторинг",
      referrals: "Рефералы",
      checks: "15 проверок",
      free: "бесплатно",
      start: "Начать",
      history: "История",
      logout: "Выйти"
    },
    EN: {
      dashboard: "Dashboard",
      webVersion: "Web",
      bot: "Bot",
      modules: "10 modules",
      reports: "PDF reports",
      monitoring: "Monitoring",
      referrals: "Referrals",
      checks: "15 checks",
      free: "free",
      start: "Start",
      history: "History",
      logout: "Logout"
    }
  };

  const text = t[lang];

  const navItems = [
    { href: "/dashboard", icon: Shield, label: text.dashboard, color: "text-primary" },
    { href: "/history", icon: History, label: text.history, color: "text-blue-400" },
    { href: "/monitoring", icon: Eye, label: text.monitoring, color: "text-purple-400" },
    { href: "/referral", icon: Users, label: text.referrals, color: "text-green-400" },
  ];

  const features = [
    { icon: Globe, label: text.modules, sub: "IP, Wallet, Email", color: "bg-primary/20 text-primary" },
    { icon: FileText, label: text.reports, sub: "QR verified", color: "bg-blue-500/20 text-blue-400" },
    { icon: Eye, label: text.monitoring, sub: "24/7 alerts", color: "bg-purple-500/20 text-purple-400" },
    { icon: Gift, label: text.referrals, sub: "+5 checks", color: "bg-green-500/20 text-green-400" },
  ];

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="sm:hidden bg-white/5 border border-white/10"
          data-testid="button-mobile-menu"
        >
          <Menu className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent 
        side="bottom" 
        className="h-auto max-h-[70vh] rounded-t-2xl bg-background border-t border-white/10 p-0"
      >
        <div className="flex flex-col">
          {/* Drag Handle */}
          <div className="flex justify-center py-2">
            <div className="w-10 h-1 rounded-full bg-white/40" />
          </div>
          
          {/* Header - Compact */}
          <div className="px-4 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg overflow-hidden border border-primary/50">
                <img src="/logo.png" alt="DARKSHARE" className="w-full h-full object-cover" />
              </div>
              <div>
                <span className="font-bold text-sm text-white">DARKSHARE</span>
                <span className="text-[8px] text-primary ml-1 bg-primary/20 px-1 rounded">v4.1</span>
              </div>
            </div>
            <SheetClose asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full bg-white/10">
                <X className="w-4 h-4" />
              </Button>
            </SheetClose>
          </div>
          
          {/* Main Actions - Side by side compact */}
          <div className="px-4 py-2 grid grid-cols-2 gap-2">
            <SheetClose asChild>
              <Link href={isAuthenticated ? "/dashboard" : "/login"}>
                <div className="bg-primary/20 border border-primary/40 rounded-xl p-2.5 flex items-center gap-2 active:scale-[0.98]" data-testid="link-mobile-dashboard">
                  <div className="w-9 h-9 rounded-lg bg-primary/30 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-xs text-white">{text.dashboard}</p>
                    <p className="text-[8px] text-primary/70">{text.webVersion}</p>
                  </div>
                </div>
              </Link>
            </SheetClose>
            <SheetClose asChild>
              <a href="https://t.me/DARKSHAREN1_BOT" target="_blank" rel="noopener noreferrer">
                <div className="bg-[#2AABEE]/20 border border-[#2AABEE]/40 rounded-xl p-2.5 flex items-center gap-2 active:scale-[0.98]" data-testid="link-mobile-bot">
                  <div className="w-9 h-9 rounded-lg bg-[#2AABEE]/30 flex items-center justify-center">
                    <SiTelegram className="w-4 h-4 text-[#2AABEE]" />
                  </div>
                  <div>
                    <p className="font-bold text-xs text-white">Telegram</p>
                    <p className="text-[8px] text-[#2AABEE]/70">{text.bot}</p>
                  </div>
                </div>
              </a>
            </SheetClose>
          </div>
          
          {/* Navigation - Horizontal scroll pills */}
          {isAuthenticated && (
            <div className="px-4 py-1">
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                {navItems.map((item) => (
                  <SheetClose key={item.href} asChild>
                    <Link href={item.href}>
                      <div className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full border shrink-0 ${
                        location === item.href 
                          ? 'bg-primary/20 border-primary/40 text-primary' 
                          : 'bg-white/5 border-white/10 text-muted-foreground'
                      }`}>
                        <item.icon className="w-3 h-3" />
                        <span className="text-[10px] font-medium">{item.label}</span>
                      </div>
                    </Link>
                  </SheetClose>
                ))}
              </div>
            </div>
          )}
          
          {/* Features - Compact 2x2 grid */}
          <div className="px-4 py-2">
            <div className="grid grid-cols-4 gap-1.5">
              {features.map((feat, i) => (
                <div key={i} className="bg-white/5 rounded-lg p-2 border border-white/5 text-center">
                  <div className={`w-6 h-6 rounded-md ${feat.color} flex items-center justify-center mx-auto mb-1`}>
                    <feat.icon className="w-3 h-3" />
                  </div>
                  <p className="text-[8px] font-medium text-white truncate">{feat.label}</p>
                </div>
              ))}
            </div>
          </div>
          
          {/* Bottom CTA */}
          <div className="px-4 py-3 pb-6 border-t border-white/5 bg-background/80">
            {/* Free checks banner */}
            <div className="flex items-center justify-between mb-2 bg-yellow-500/10 rounded-lg px-3 py-2 border border-yellow-500/20">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500" />
                <span className="text-xs font-bold text-white">{text.checks}</span>
                <span className="text-[9px] text-yellow-500/80">{text.free}</span>
              </div>
              <Zap className="w-4 h-4 text-yellow-500" />
            </div>
            
            {/* Action buttons */}
            <div className="flex gap-2">
              {isAuthenticated && onLogout ? (
                <>
                  <SheetClose asChild>
                    <Link href="/dashboard" className="flex-1">
                      <Button className="w-full h-10 gap-1.5 text-xs font-bold rounded-lg" data-testid="button-mobile-start">
                        <Shield className="w-3.5 h-3.5" />
                        {text.start}
                        <ChevronRight className="w-3 h-3" />
                      </Button>
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button 
                      variant="outline" 
                      size="icon"
                      className="h-10 w-10 rounded-lg border-white/10"
                      onClick={onLogout}
                      data-testid="button-mobile-logout"
                    >
                      <LogOut className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </SheetClose>
                </>
              ) : (
                <SheetClose asChild>
                  <Link href="/login" className="w-full">
                    <Button className="w-full h-10 gap-1.5 text-xs font-bold rounded-lg" data-testid="button-mobile-start">
                      <Shield className="w-3.5 h-3.5" />
                      {text.start}
                      <ChevronRight className="w-3 h-3" />
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
