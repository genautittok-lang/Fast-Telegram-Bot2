import { type ReactNode, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Shield, Globe } from "lucide-react";
import { AppSidebar } from "@/components/AppSidebar";
import { BottomTabBar } from "@/components/BottomTabBar";
import { MobileMenu } from "@/components/MobileMenu";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "@/lib/i18n";

interface PageLayoutProps {
  children: ReactNode;
  headerActions?: ReactNode;
  title?: string;
  appMode?: boolean;
}

export function PageLayout({ children, headerActions, title, appMode = false }: PageLayoutProps) {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [isLoading, isAuthenticated, setLocation]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <Shield className="w-6 h-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-muted-foreground font-mono text-sm">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (appMode) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex overflow-hidden max-w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="lg:hidden flex items-center justify-between px-3 py-2 bg-[#0e0e14]/95 backdrop-blur-2xl sticky top-0 z-40 border-b border-white/[0.04]">
            <div className="flex items-center gap-2">
              <Link href="/">
                <button className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] active:bg-white/[0.08] transition-colors" data-testid="button-back-to-site">
                  <Globe className="w-3 h-3 text-zinc-400" />
                  <span className="text-[10px] font-medium text-zinc-400">Site</span>
                </button>
              </Link>
              <div className="w-px h-4 bg-white/[0.06]" />
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center shadow-[0_0_8px_rgba(34,197,94,0.25)]">
                <Shield className="w-3 h-3 text-black" />
              </div>
              {title ? (
                <span className="font-semibold text-sm text-white">{title}</span>
              ) : (
                <span className="font-bold text-sm">DARKSHARE</span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {headerActions}
              <LanguageSwitcher variant="minimal" />
            </div>
          </div>
          <main className="flex-1 overflow-y-auto pb-20 lg:pb-0 bg-[#0a0a0f]">
            {children}
          </main>
          <BottomTabBar />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex overflow-hidden max-w-full">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-cyan-400 flex items-center justify-center">
              <Shield className="w-4 h-4 text-black" />
            </div>
            <span className="font-bold">DARKSHARE</span>
          </div>
          <div className="flex items-center gap-2">
            {headerActions}
            <LanguageSwitcher variant="minimal" />
            <MobileMenu isAuthenticated={true} username={user?.username} tier={user?.tier} onLogout={logout} />
          </div>
        </div>
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
