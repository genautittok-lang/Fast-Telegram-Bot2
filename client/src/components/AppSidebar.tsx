import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import {
  Shield,
  Home,
  History,
  Activity,
  Users,
  CreditCard,
  User,
  LogOut,
  FileText,
  Lock,
  Mail,
  MessageSquare,
  MessageCircle,
  Code2,
  Blocks,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "@/lib/i18n";

const navItems = [
  { id: "dashboard", labelKey: "nav.dashboard", icon: Home, href: "/dashboard" },
  { id: "history", labelKey: "nav.history", icon: History, href: "/history" },
  { id: "monitoring", labelKey: "nav.monitoring", icon: Activity, href: "/monitoring" },
  { id: "referral", labelKey: "nav.referral", icon: Users, href: "/referral" },
  { id: "pricing", labelKey: "nav.pricing", icon: CreditCard, href: "/pricing" },
  { id: "account", labelKey: "nav.account", icon: User, href: "/account" },
  { id: "teams", labelKey: "nav.teams", icon: Users, href: "/teams" },
  { id: "chat", labelKey: "nav.chat", icon: MessageCircle, href: "/chat" },
  { id: "support", labelKey: "nav.support", icon: MessageSquare, href: "/support" },
  { id: "api-docs", labelKey: "nav.apiDocs", icon: Code2, href: "/api-docs" },
  { id: "widget", labelKey: "nav.widget", icon: Blocks, href: "/widget" },
  { id: "guide", labelKey: "nav.guide", icon: BookOpen, href: "/guide" },
];

export function AppSidebar() {
  const [location, setLocation] = useLocation();
  const { t } = useTranslation();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    setLocation("/dashboard");
  };

  return (
    <aside className="hidden lg:flex flex-col w-[280px] min-w-[280px] border-r border-white/5 bg-black/50 backdrop-blur-2xl">
      <div className="p-6 border-b border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-cyan-500/5" />
        <Link href="/">
          <div className="relative flex items-center gap-3 group cursor-pointer">
            <motion.div
              className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary via-emerald-400 to-cyan-400 flex items-center justify-center shadow-[0_0_25px_rgba(34,197,94,0.4)] group-hover:shadow-[0_0_35px_rgba(34,197,94,0.6)] transition-all duration-500"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
            >
              <Shield className="w-6 h-6 text-black" />
            </motion.div>
            <div>
              <h1 className="font-display font-bold text-xl tracking-tight bg-gradient-to-r from-white via-white to-primary bg-clip-text">DARKSHARE</h1>
              <p className="text-[10px] text-muted-foreground tracking-[0.2em]">SECURITY OSINT</p>
            </div>
          </div>
        </Link>
      </div>

      <nav className="p-4 space-y-1 flex-1">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.id} href={item.href}>
              <motion.button
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                  isActive
                    ? "bg-gradient-to-r from-primary/20 via-primary/10 to-transparent text-primary border border-primary/30 shadow-[0_0_20px_rgba(34,197,94,0.15)]"
                    : "text-muted-foreground hover:text-white hover:bg-white/5 border border-transparent"
                }`}
                whileHover={{ x: isActive ? 0 : 4 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                data-testid={`nav-${item.id}`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? "text-primary" : ""}`} />
                <span>{t(item.labelKey)}</span>
                {isActive && (
                  <motion.div
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(34,197,94,0.6)]"
                    layoutId="activeNav"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </motion.button>
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-3 border-t border-white/5">
        <div className="space-y-1">
          <Link href="/terms">
            <span className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-white transition-colors rounded-lg cursor-pointer" data-testid="link-sidebar-terms">
              <FileText className="w-3.5 h-3.5" />
              {t('footer.termsOfService')}
            </span>
          </Link>
          <Link href="/privacy">
            <span className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-white transition-colors rounded-lg cursor-pointer" data-testid="link-sidebar-privacy">
              <Lock className="w-3.5 h-3.5" />
              {t('footer.privacyPolicy')}
            </span>
          </Link>
          <Link href="/support">
            <span className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-white transition-colors rounded-lg cursor-pointer" data-testid="link-sidebar-support">
              <MessageSquare className="w-3.5 h-3.5" />
              {t('footer.contact')}
            </span>
          </Link>
          <a href="mailto:darkshare.store@gmail.com" className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-white transition-colors rounded-lg" data-testid="link-sidebar-email">
            <Mail className="w-3.5 h-3.5" />
            darkshare.store@gmail.com
          </a>
        </div>
      </div>

      <div className="p-4 border-t border-white/5">
        <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:text-red-400 hover:bg-red-500/10" onClick={handleLogout} data-testid="button-sidebar-logout">
          <LogOut className="w-5 h-5" />
          {t('auth.logout')}
        </Button>
      </div>
    </aside>
  );
}
