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
  Lock,
  FileText,
  Mail,
  MessageSquare,
  ChevronRight,
  Zap,
  Code2,
  Blocks,
} from "lucide-react";
import { SiTelegram } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/lib/i18n";

interface MobileMenuProps {
  isAuthenticated?: boolean;
  onLogout?: () => void;
  username?: string;
  tier?: string;
}

export function MobileMenu({ 
  isAuthenticated = false, 
  onLogout,
  username,
  tier = "FREE"
}: MobileMenuProps) {
  const { t } = useTranslation();
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
  
  const publicItems: Array<{ href: string; icon: any; label: string; highlight?: boolean; desc?: string }> = [
    { href: "/", icon: Home, label: t('mobile.home'), desc: "OSINT Platform" },
    { href: "/pricing", icon: CreditCard, label: t('nav.pricing'), desc: "PRO & Enterprise" },
    { href: "/login", icon: Shield, label: t('auth.signIn'), highlight: true, desc: "Telegram Login" },
  ];

  const authItems: Array<{ href: string; icon: any; label: string; highlight?: boolean; desc?: string }> = [
    { href: "/dashboard", icon: Shield, label: t('mobile.checks'), highlight: true, desc: "OSINT Scanner" },
    { href: "/history", icon: History, label: t('nav.history'), desc: "Check Results" },
    { href: "/monitoring", icon: Eye, label: t('nav.monitoring'), desc: "Real-time Alerts" },
    { href: "/referral", icon: Users, label: t('mobile.referrals'), desc: "Invite & Earn" },
    { href: "/pricing", icon: CreditCard, label: t('nav.pricing'), desc: "PRO & Enterprise" },
    { href: "/account", icon: User, label: t('mobile.profile'), desc: "Settings" },
    { href: "/teams", icon: Users, label: t('nav.teams'), desc: "Team Collaboration" },
    { href: "/support", icon: MessageSquare, label: t('nav.support'), desc: "Help Center" },
    { href: "/api-docs", icon: Code2, label: t('nav.apiDocs'), desc: "REST API" },
    { href: "/widget", icon: Blocks, label: t('nav.widget'), desc: "Security Badge" },
  ];

  const navItems = isAuthenticated ? authItems : publicItems;

  const getTierBadge = (t: string) => {
    switch(t?.toUpperCase()) {
      case 'PRO': return { bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: <Zap className="w-3 h-3" /> };
      case 'ENTERPRISE': return { bg: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: <Zap className="w-3 h-3" /> };
      default: return { bg: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30', icon: null };
    }
  };

  const tierInfo = getTierBadge(tier);

  return (
    <>
      <Button 
        variant="ghost" 
        size="icon"
        onClick={() => setIsOpen(true)}
        className="md:hidden"
        data-testid="button-mobile-menu-open"
      >
        <Menu className="w-5 h-5" />
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
            <div className="flex flex-col h-full w-full overflow-y-auto">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-background sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary via-emerald-400 to-cyan-400 flex items-center justify-center shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                    <Shield className="w-5 h-5 text-black" />
                  </div>
                  <div>
                    <span className="font-bold text-base">DARKSHARE</span>
                    <p className="text-[10px] text-muted-foreground tracking-wider">SECURITY OSINT</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  data-testid="button-mobile-menu-close"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {isAuthenticated && username && (
                <div className="mx-4 mt-4 p-4 rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-cyan-500/30 flex items-center justify-center border border-white/10">
                      <User className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">@{username}</p>
                      <Badge variant="outline" className={`mt-1 text-[10px] ${tierInfo.bg}`}>
                        {tierInfo.icon}
                        {tier}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}

              <nav className="flex-1 px-4 py-4">
                <div className="space-y-1.5">
                  {navItems.map((item, index) => {
                    const isActive = location === item.href;
                    return (
                      <motion.div
                        key={item.href + item.label}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.04 }}
                      >
                        <Link href={item.href}>
                          <div
                            className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all cursor-pointer active:scale-[0.98] ${
                              isActive 
                                ? 'bg-primary/15 border border-primary/30' 
                                : 'border border-transparent active:bg-white/5'
                            }`}
                            data-testid={`link-mobile-${item.href.replace('/', '') || 'home'}`}
                          >
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              isActive ? 'bg-primary/20' : item.highlight ? 'bg-primary/10' : 'bg-white/5'
                            }`}>
                              <item.icon className={`w-4.5 h-4.5 ${
                                isActive ? 'text-primary' : item.highlight ? 'text-primary' : 'text-muted-foreground'
                              }`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className={`font-medium text-sm block ${isActive ? 'text-primary' : ''}`}>{item.label}</span>
                              {item.desc && (
                                <span className="text-[10px] text-muted-foreground">{item.desc}</span>
                              )}
                            </div>
                            <ChevronRight className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground/40'}`} />
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>

                <div className="mt-5 pt-4 border-t border-border/30">
                  <motion.a
                    href="https://t.me/DARKSHAREN1_BOT"
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl bg-[#2AABEE]/10 border border-[#2AABEE]/20 active:bg-[#2AABEE]/20"
                    data-testid="link-mobile-telegram"
                  >
                    <div className="w-9 h-9 rounded-lg bg-[#2AABEE]/20 flex items-center justify-center flex-shrink-0">
                      <SiTelegram className="w-4.5 h-4.5 text-[#2AABEE]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-sm block">Telegram Bot</span>
                      <span className="text-[10px] text-muted-foreground">@DARKSHAREN1_BOT</span>
                    </div>
                    <ExternalLink className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
                  </motion.a>
                </div>

                <div className="mt-4 pt-3 border-t border-border/30 space-y-0.5">
                  <Link href="/support">
                    <span className="flex items-center gap-3 px-3 py-2.5 text-muted-foreground cursor-pointer rounded-lg active:bg-white/5" data-testid="link-mobile-support-footer">
                      <MessageSquare className="w-4 h-4" />
                      <span className="text-xs">{t('footer.contact')}</span>
                    </span>
                  </Link>
                  <a href="mailto:darkshare.store@gmail.com" className="flex items-center gap-3 px-3 py-2.5 text-muted-foreground rounded-lg active:bg-white/5" data-testid="link-mobile-email">
                    <Mail className="w-4 h-4" />
                    <span className="text-xs">darkshare.store@gmail.com</span>
                  </a>
                </div>
              </nav>

              {isAuthenticated && onLogout && (
                <div className="p-4 border-t border-border/30">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setIsOpen(false);
                      onLogout();
                    }}
                    className="w-full justify-center text-red-400 border border-red-500/20"
                    data-testid="button-mobile-logout"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    {t('auth.logout')}
                  </Button>
                </div>
              )}

              <div className="px-4 py-3 border-t border-border/10">
                <p className="text-[10px] text-center text-muted-foreground/50">
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
