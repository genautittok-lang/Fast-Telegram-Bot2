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
import { motion, AnimatePresence } from "framer-motion";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
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

const APP_PATHS = ["/dashboard", "/history", "/monitoring", "/referral", "/account", "/teams", "/chat", "/admin"];

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
