import { type ReactNode } from "react";
import { useLocation } from "wouter";
import { Shield } from "lucide-react";
import { AppSidebar } from "@/components/AppSidebar";
import { MobileMenu } from "@/components/MobileMenu";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "@/lib/i18n";

interface PageLayoutProps {
  children: ReactNode;
  headerActions?: ReactNode;
}

export function PageLayout({ children, headerActions }: PageLayoutProps) {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { t } = useTranslation();

  if (isLoading) {
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

  if (!isAuthenticated) {
    setLocation("/login");
    return null;
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
