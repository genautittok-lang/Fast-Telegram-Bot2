import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { LanguageProvider } from "@/lib/i18n";
import { PWAProvider } from "@/lib/pwa";
import { CookieBanner } from "@/components/CookieBanner";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { AppUpdateBanner } from "@/components/AppUpdateBanner";
import { InstallBanner } from "@/components/InstallBanner";
import { NotificationManager } from "@/components/NotificationManager";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { BottomTabBar } from "@/components/BottomTabBar";
import { RouteSeo } from "@/components/RouteSeo";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import VpnPage from "@/pages/VpnPage";
import History from "@/pages/History";
import Monitoring from "@/pages/Monitoring";
import Referral from "@/pages/Referral";
import ReferralLanding from "@/pages/ReferralLanding";
import Account from "@/pages/Account";
import Admin from "@/pages/Admin";
import Pricing from "@/pages/Pricing";
import Support from "@/pages/Support";
import ApiDocs from "@/pages/ApiDocs";
import Teams from "@/pages/Teams";
import JoinTeam from "@/pages/JoinTeam";
import Widget from "@/pages/Widget";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import Chat from "@/pages/Chat";
import Guide from "@/pages/Guide";
import Download from "@/pages/Download";
import ExifTool from "@/pages/ExifTool";
import GeointHints from "@/pages/GeointHints";
import AUP from "@/pages/AUP";
import DataDeletion from "@/pages/DataDeletion";
import CompromiseWizard from "@/pages/CompromiseWizard";
import TakedownGenerator from "@/pages/TakedownGenerator";
import ThreatProfilePage from "@/pages/ThreatProfile";
import Trust from "@/pages/Trust";
import Community from "@/pages/Community";

const PARTNER_CHANNEL_URL = "https://t.me/AlorVPN";

function PartnerSubGate() {
  const { user, checkAuth } = useAuth();
  const { lang } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [notYet, setNotYet] = useState(false);

  const t = (uk: string, ru: string, en: string) =>
    lang === "uk" ? uk : lang === "ru" ? ru : en;

  if (!user || user.partnerChannelSubscribed) return null;

  const handleVerify = async () => {
    setLoading(true);
    setNotYet(false);
    try {
      const res = await apiRequest("POST", "/api/auth/verify-partner-sub", {});
      const data = await res.json();
      if (data.subscribed) {
        await checkAuth();
      } else {
        setNotYet(true);
      }
    } catch {
      setNotYet(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
      data-testid="partner-sub-gate"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
        className="w-full max-w-md bg-card border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="h-1.5 w-full bg-gradient-to-r from-primary via-cyan-400 to-primary" />
        <div className="p-8 flex flex-col items-center text-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-primary" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
              <path d="M9.78 11.49L8.22 9.93 12 6.15l3.78 3.78-1.56 1.56L12 9.27l-2.22 2.22zm0 1.02L12 14.73l2.22-2.22 1.56 1.56L12 17.85l-3.78-3.78 1.56-1.56z" />
            </svg>
          </div>

          <div>
            <h2 className="text-xl font-bold font-display mb-2">
              {t("🤝 Один крок до входу", "🤝 Один шаг ко входу", "🤝 One step to access")}
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {t(
                "DARKSHARE VPN працює на інфраструктурі нашого офіційного партнера AlorVPN. Підпишись на їхній Telegram-канал — це обов'язкова умова партнерства.",
                "DARKSHARE VPN работает на инфраструктуре нашего официального партнёра AlorVPN. Подпишись на их Telegram-канал — это обязательное условие партнёрства.",
                "DARKSHARE VPN runs on infrastructure by our official partner AlorVPN. Subscribe to their Telegram channel — it's a partnership requirement."
              )}
            </p>
          </div>

          <a
            href={PARTNER_CHANNEL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full"
            data-testid="link-partner-channel"
          >
            <Button className="w-full h-12 text-base gap-2 bg-[#229ED9] hover:bg-[#1a8bbf] text-white border-0">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.027 9.56c-.148.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L6.15 13.965l-2.951-.922c-.64-.203-.654-.64.138-.948l11.53-4.448c.533-.194 1 .13.695.601z" />
              </svg>
              {t("📢 Відкрити канал AlorVPN", "📢 Открыть канал AlorVPN", "📢 Open AlorVPN channel")}
            </Button>
          </a>

          {notYet && (
            <p className="text-sm text-destructive font-medium" data-testid="text-not-subscribed-error">
              {t(
                "Схоже, ти ще не підписався. Підпишись на канал і спробуй ще раз.",
                "Похоже, ты ещё не подписался. Подпишись на канал и попробуй снова.",
                "Looks like you haven't subscribed yet. Subscribe to the channel and try again."
              )}
            </p>
          )}

          <Button
            variant="outline"
            className="w-full h-11 border-white/10 bg-white/5 hover:bg-white/10"
            onClick={handleVerify}
            disabled={loading}
            data-testid="button-verify-partner-sub"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              t("✅ Я підписався — продовжити", "✅ Я подписался — продолжить", "✅ I subscribed — continue")
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

const APP_PATHS = ["/dashboard", "/history", "/monitoring", "/referral", "/account", "/teams", "/chat", "/admin", "/exif", "/geoint"];

const pageVariants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
};

const pageTransition = {
  duration: 0.18,
  ease: [0.25, 0.1, 0.25, 1],
};

function AnimatedPage({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
      className="min-h-[100dvh]"
    >
      {children}
    </motion.div>
  );
}

function PersistentBottomBar() {
  const { isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();

  if (isLoading || !isAuthenticated) return null;

  const isAppPage = APP_PATHS.some(p => location === p || location.startsWith(p + "/"));
  if (!isAppPage) return null;

  return <BottomTabBar />;
}

function Router() {
  const [location] = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <AnimatedPage key={location}>
        <Switch location={location}>
          <Route path="/" component={Home} />
          <Route path="/login" component={Login} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/vpn" component={VpnPage} />
          <Route path="/history" component={History} />
          <Route path="/monitoring" component={Monitoring} />
          <Route path="/referral" component={Referral} />
          <Route path="/r/:code" component={ReferralLanding} />
          <Route path="/account" component={Account} />
          <Route path="/admin" component={Admin} />
          <Route path="/pricing" component={Pricing} />
          <Route path="/support" component={Support} />
          <Route path="/api-docs" component={ApiDocs} />
          <Route path="/teams/join/:code" component={JoinTeam} />
          <Route path="/teams" component={Teams} />
          <Route path="/widget" component={Widget} />
          <Route path="/terms" component={Terms} />
          <Route path="/privacy" component={Privacy} />
          <Route path="/chat" component={Chat} />
          <Route path="/guide" component={Guide} />
          <Route path="/download" component={Download} />
          <Route path="/exif" component={ExifTool} />
          <Route path="/geoint" component={GeointHints} />
          <Route path="/aup" component={AUP} />
          <Route path="/data-deletion" component={DataDeletion} />
          <Route path="/wizard" component={CompromiseWizard} />
          <Route path="/takedown" component={TakedownGenerator} />
          <Route path="/threat-profile" component={ThreatProfilePage} />
          <Route path="/trust" component={Trust} />
          <Route path="/community" component={Community} />
          <Route component={NotFound} />
        </Switch>
      </AnimatedPage>
    </AnimatePresence>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <LanguageProvider>
            <PWAProvider>
              <AuthProvider>
                <PartnerSubGate />
                <RouteSeo />
                <OfflineIndicator />
                <AppUpdateBanner />
                <InstallBanner />
                <NotificationManager />
                <Toaster />
                <CookieBanner />
                <Router />
                <PersistentBottomBar />
              </AuthProvider>
            </PWAProvider>
          </LanguageProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
