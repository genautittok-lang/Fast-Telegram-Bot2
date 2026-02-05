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
  Zap,
  CreditCard,
  User,
  Settings,
  Lock,
  ChevronRight
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
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
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
        className="md:hidden bg-white/5 border border-white/10 hover:bg-white/10"
        data-testid="button-mobile-menu-open"
      >
        <Menu className="w-5 h-5" />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] md:hidden"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-[280px] bg-background border-l border-white/10 z-[9999] md:hidden overflow-y-auto"
            >
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Lock className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-bold text-sm">DARKSHARE</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                    className="hover:bg-white/10"
                    data-testid="button-mobile-menu-close"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {isAuthenticated && username && (
                  <div className="p-4 border-b border-white/10 bg-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-blue-500/30 flex items-center justify-center border border-white/10">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">@{username}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${getTierColor(tier)}`}>
                          {tier}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <nav className="flex-1 p-3">
                  <div className="space-y-1">
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
                              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer ${
                                isActive 
                                  ? 'bg-primary/20 text-primary border border-primary/30' 
                                  : 'hover:bg-white/5'
                              } ${item.highlight && !isActive ? 'text-primary' : ''}`}
                              data-testid={`link-mobile-${item.href.replace('/', '')}`}
                            >
                              <item.icon className={`w-5 h-5 ${isActive ? 'text-primary' : item.highlight ? 'text-primary' : 'text-muted-foreground'}`} />
                              <span className="font-medium text-sm">{item.label}</span>
                              {isActive && <Zap className="w-4 h-4 text-primary ml-auto" />}
                              {!isActive && <ChevronRight className="w-4 h-4 text-muted-foreground/50 ml-auto" />}
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
                      className="mt-4 p-3 rounded-lg bg-gradient-to-br from-primary/10 to-transparent border border-primary/20"
                    >
                      <Link href="/login">
                        <Button className="w-full bg-primary hover:bg-primary/90" data-testid="button-mobile-login">
                          <Shield className="w-4 h-4 mr-2" />
                          {lang === "UA" ? "Увійти" : lang === "RU" ? "Войти" : "Sign In"}
                        </Button>
                      </Link>
                    </motion.div>
                  )}

                  <div className="mt-6 pt-4 border-t border-white/10">
                    <p className="text-xs text-muted-foreground mb-2 px-3">
                      {lang === "UA" ? "Посилання" : "Links"}
                    </p>
                    <motion.a
                      href="https://t.me/DARKSHAREN1_BOT"
                      target="_blank"
                      rel="noopener noreferrer"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-all"
                      data-testid="link-mobile-telegram"
                    >
                      <SiTelegram className="w-5 h-5 text-[#2AABEE]" />
                      <span className="font-medium text-sm">Telegram Bot</span>
                      <ExternalLink className="w-4 h-4 text-muted-foreground/50 ml-auto" />
                    </motion.a>
                  </div>
                </nav>

                {isAuthenticated && onLogout && (
                  <div className="p-3 border-t border-white/10">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setIsOpen(false);
                        onLogout();
                      }}
                      className="w-full justify-start text-red-400 hover:text-red-400 hover:bg-red-500/10"
                      data-testid="button-mobile-logout"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      {lang === "UA" ? "Вийти" : lang === "RU" ? "Выйти" : "Logout"}
                    </Button>
                  </div>
                )}

                <div className="p-4 border-t border-white/5 bg-white/5">
                  <p className="text-[10px] text-center text-muted-foreground/60">
                    DARKSHARE v4.1 - OSINT Security Platform
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
