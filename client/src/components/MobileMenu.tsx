import { Link, useLocation } from "wouter";
import { 
  Shield, 
  Eye, 
  Menu,
  X,
  History,
  Users,
  LogOut,
  Home,
  ExternalLink
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
    UA: { panel: "Панель", history: "Історія", monitor: "Монітор", refs: "Реф", bot: "Бот", home: "Головна", logout: "Вихід" },
    RU: { panel: "Панель", history: "История", monitor: "Монитор", refs: "Реф", bot: "Бот", home: "Главная", logout: "Выход" },
    EN: { panel: "Panel", history: "History", monitor: "Monitor", refs: "Refs", bot: "Bot", home: "Home", logout: "Exit" }
  };
  const text = t[lang];

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
        className="h-auto max-h-[50vh] rounded-t-2xl bg-background/95 backdrop-blur-xl border-t border-white/10 p-0"
      >
        {/* Drag indicator */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-8 h-1 rounded-full bg-white/30" />
        </div>
        
        {/* Logo row */}
        <div className="flex items-center justify-between px-4 pb-2">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="DS" className="w-6 h-6 rounded" />
            <span className="font-bold text-sm">DARKSHARE</span>
            <span className="text-[8px] bg-primary/20 text-primary px-1.5 py-0.5 rounded">v4.1</span>
          </div>
          <SheetClose asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <X className="w-4 h-4" />
            </Button>
          </SheetClose>
        </div>

        {/* Quick actions grid - 2 columns */}
        <div className="grid grid-cols-2 gap-2 px-4 pb-2">
          <SheetClose asChild>
            <Link href={isAuthenticated ? "/dashboard" : "/login"}>
              <div className="flex items-center gap-2 p-3 bg-primary/15 border border-primary/30 rounded-xl active:scale-95 transition-transform" data-testid="link-mobile-dashboard">
                <Shield className="w-5 h-5 text-primary" />
                <span className="font-semibold text-sm">{text.panel}</span>
              </div>
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <a href="https://t.me/DARKSHAREN1_BOT" target="_blank" rel="noopener noreferrer">
              <div className="flex items-center gap-2 p-3 bg-[#2AABEE]/15 border border-[#2AABEE]/30 rounded-xl active:scale-95 transition-transform" data-testid="link-mobile-bot">
                <SiTelegram className="w-5 h-5 text-[#2AABEE]" />
                <span className="font-semibold text-sm">{text.bot}</span>
                <ExternalLink className="w-3 h-3 text-muted-foreground ml-auto" />
              </div>
            </a>
          </SheetClose>
        </div>

        {/* Nav items - horizontal row */}
        {isAuthenticated && (
          <div className="flex gap-1 px-4 pb-2 overflow-x-auto">
            {[
              { href: "/", icon: Home, label: text.home },
              { href: "/history", icon: History, label: text.history },
              { href: "/monitoring", icon: Eye, label: text.monitor },
              { href: "/referral", icon: Users, label: text.refs },
            ].map((item) => (
              <SheetClose key={item.href} asChild>
                <Link href={item.href}>
                  <div className={`flex items-center gap-1.5 px-3 py-2 rounded-lg shrink-0 ${
                    location === item.href 
                      ? 'bg-primary/20 text-primary' 
                      : 'bg-white/5 text-muted-foreground'
                  }`}>
                    <item.icon className="w-4 h-4" />
                    <span className="text-xs font-medium">{item.label}</span>
                  </div>
                </Link>
              </SheetClose>
            ))}
          </div>
        )}

        {/* Bottom actions */}
        <div className="flex gap-2 px-4 py-3 pb-6 border-t border-white/5">
          {isAuthenticated && onLogout ? (
            <>
              <SheetClose asChild>
                <Link href="/dashboard" className="flex-1">
                  <Button className="w-full gap-2" data-testid="button-mobile-start">
                    <Shield className="w-4 h-4" />
                    Перевірка
                  </Button>
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={onLogout}
                  data-testid="button-mobile-logout"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </SheetClose>
            </>
          ) : (
            <SheetClose asChild>
              <Link href="/login" className="w-full">
                <Button className="w-full gap-2" data-testid="button-mobile-start">
                  <Shield className="w-4 h-4" />
                  Увійти
                </Button>
              </Link>
            </SheetClose>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
