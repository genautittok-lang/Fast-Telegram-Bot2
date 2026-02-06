import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { LanguageProvider } from "@/lib/i18n";
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
import Widget from "@/pages/Widget";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";

function Router() {
  return (
    <Switch>
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
      <Route path="/teams" component={Teams} />
      <Route path="/widget" component={Widget} />
      <Route path="/terms" component={Terms} />
      <Route path="/privacy" component={Privacy} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LanguageProvider>
          <AuthProvider>
            <Toaster />
            <Router />
          </AuthProvider>
        </LanguageProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
