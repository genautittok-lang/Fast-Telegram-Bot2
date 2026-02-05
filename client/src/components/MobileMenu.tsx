import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, 
  Eye, 
  Menu,
  X,
  History,
  Users,
  LogOut,
  Home,
  ExternalLink,
  CreditCard,
  User,
  Lock
} from "lucide-react";
import { SiTelegram } from "react-icons/si";
import { Button } from "@/components/ui/button";

interface MobileMenuProps {
  lang?: "UA" | "RU" | "EN";
  isAuthenticated?: boolean;
  onLogout?: () => void;
  username?: string;
  tier?: string;
}

export function MobileMenu({ 
  lang = "UA", 
  isAuthenticated = false, 
  onLogout,
  username,
  tier = "FREE"
}: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${window.scrollY}px`;
    } else {
      const scrollY = document.body.style.top;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
      window.scrollTo(0, parseInt(scrollY || '0') * -1);
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
    };
  }, [isOpen]);
  
  const publicItems: Array<{ href: string; icon: any; label: string; highlight?: boolean }> = [
    { href: "/", icon: Home, label: lang === "UA" ? "Головна" : lang === "RU" ? "Главная" : "Home" },
    { href: "/pricing", icon: CreditCard, label: lang === "UA" ? "Тарифи" : lang === "RU" ? "Тарифы" : "Pricing" },
  ];

  const authItems: Array<{ href: string; icon: any; label: string; highlight?: boolean }> = [
    { href: "/dashboard", icon: Shield, label: lang === "UA" ? "Перевірки" : "Checks", highlight: true },
    { href: "/history", icon: History, label: lang === "UA" ? "Історія" : "History" },
    { href: "/monitoring", icon: Eye, label: lang === "UA" ? "Моніторинг" : "Monitoring" },
    { href: "/referral", icon: Users, label: lang === "UA" ? "Реферали" : "Referrals" },
    { href: "/pricing", icon: CreditCard, label: lang === "UA" ? "Тарифи" : "Pricing" },
    { href: "/account", icon: User, label: lang === "UA" ? "Профіль" : "Profile" },
  ];

  const navItems = isAuthenticated ? authItems : publicItems;

  const getTierColor = (t: string) => {
    switch(t?.toUpperCase()) {
      case 'PRO': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'ENTERPRISE': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default: return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
    }
  };

  return (
    <>
      <Button 
        variant="ghost" 
        size="icon"
        onClick={() => setIsOpen(true)}
        className="md:hidden bg-white/5 border border-white/10 hover:bg-white/10 h-11 w-11"
        data-testid="button-mobile-menu-open"
      >
        <Menu className="w-6 h-6" />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 w-screen h-screen bg-background md:hidden"
            style={{ 
              zIndex: 2147483647,
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          >
            <div className="flex flex-col h-full w-full overflow-y-auto safe-area-inset">
              <div className="flex items-center justify-between p-4 border-b border-white/10 bg-background sticky top-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
                    <Lock className="w-5 h-5 text-primary" />
                  </div>
                  <span className="font-bold text-lg">DARKSHARE</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="hover:bg-white/10 h-11 w-11"
                  data-testid="button-mobile-menu-close"
                >
                  <X className="w-6 h-6" />
                </Button>
              </div>

              {isAuthenticated && username && (
                <div className="p-4 border-b border-white/10 bg-white/5">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/30 to-blue-500/30 flex items-center justify-center border border-white/10">
                      <User className="w-7 h-7 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-lg truncate">@{username}</p>
                      <span className={`text-sm px-3 py-1 rounded-full border ${getTierColor(tier)}`}>
                        {tier}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <nav className="flex-1 p-4">
                <div className="space-y-2">
                  {navItems.map((item, index) => {
                    const isActive = location === item.href;
                    return (
                      <motion.div
                        key={item.href}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Link href={item.href}>
                          <div
                            className={`flex items-center gap-4 px-4 py-4 rounded-xl transition-all cursor-pointer active:scale-[0.98] ${
                              isActive 
                                ? 'bg-primary/20 text-primary border-2 border-primary/40' 
                                : 'bg-white/5 border border-white/10 active:bg-white/10'
                            } ${item.highlight && !isActive ? 'text-primary border-primary/20' : ''}`}
                            data-testid={`link-mobile-${item.href.replace('/', '')}`}
                          >
                            <item.icon className={`w-6 h-6 ${isActive ? 'text-primary' : item.highlight ? 'text-primary' : 'text-muted-foreground'}`} />
                            <span className="font-semibold text-base">{item.label}</span>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>

                {!isAuthenticated && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mt-6"
                  >
                    <Link href="/login">
                      <Button className="w-full bg-primary hover:bg-primary/90 h-14 text-base" data-testid="button-mobile-login">
                        <Shield className="w-5 h-5 mr-2" />
                        {lang === "UA" ? "Увійти через Telegram" : lang === "RU" ? "Войти через Telegram" : "Sign In with Telegram"}
                      </Button>
                    </Link>
                  </motion.div>
                )}

                <div className="mt-6 pt-4 border-t border-white/10">
                  <motion.a
                    href="https://t.me/DARKSHAREN1_BOT"
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-center gap-4 px-4 py-4 rounded-xl bg-[#2AABEE]/10 border border-[#2AABEE]/30 active:bg-[#2AABEE]/20"
                    data-testid="link-mobile-telegram"
                  >
                    <SiTelegram className="w-6 h-6 text-[#2AABEE]" />
                    <span className="font-semibold text-base">Telegram Bot</span>
                    <ExternalLink className="w-5 h-5 text-muted-foreground ml-auto" />
                  </motion.a>
                </div>
              </nav>

              {isAuthenticated && onLogout && (
                <div className="p-4 border-t border-white/10">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setIsOpen(false);
                      onLogout();
                    }}
                    className="w-full justify-center h-14 text-base text-red-400 hover:text-red-400 hover:bg-red-500/10 border border-red-500/20"
                    data-testid="button-mobile-logout"
                  >
                    <LogOut className="w-5 h-5 mr-2" />
                    {lang === "UA" ? "Вийти" : lang === "RU" ? "Выйти" : "Logout"}
                  </Button>
                </div>
              )}

              <div className="p-4 border-t border-white/5 bg-white/5">
                <p className="text-xs text-center text-muted-foreground/60">
                  DARKSHARE v4.1 - OSINT Security Platform
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
