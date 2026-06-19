import React, { useState, useEffect, useCallback } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { PropertyProvider } from "@/components/property-provider";
import LoginPage from "@/pages/login";
import Onboarding from "@/pages/onboarding";

import Dashboard from "@/pages/dashboard";
import Properties from "@/pages/properties";
import Explorer from "@/pages/explorer";
import Guests from "@/pages/guests";
import GuestDetail from "@/pages/guest-detail";
import Payments from "@/pages/payments";
import Complaints from "@/pages/complaints";
import Staff from "@/pages/staff";
import Activity from "@/pages/activity";
import Settings from "@/pages/settings";
import AIReceptionist from "@/pages/ai-receptionist";

const queryClient = new QueryClient();

const SESSION_KEY = "nestpro_user";
const ONBOARD_KEY = "nestpro_onboarded";
const BIZ_KEY = "nestpro_business";

interface User { name: string; email: string }
interface Business { name: string; phone: string; email: string; categories: string[] }

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/properties" component={Properties} />
      <Route path="/properties/:id/explorer" component={Explorer} />
      <Route path="/guests" component={Guests} />
      <Route path="/guests/:id" component={GuestDetail} />
      <Route path="/payments" component={Payments} />
      <Route path="/complaints" component={Complaints} />
      <Route path="/staff" component={Staff} />
      <Route path="/activity" component={Activity} />
      <Route path="/settings" component={Settings} />
      <Route path="/ai" component={AIReceptionist} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [user, setUser] = useState<User | null>(() => {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) ?? "null"); } catch { return null; }
  });
  const [onboarded, setOnboarded] = useState(() => !!localStorage.getItem(ONBOARD_KEY));

  const handleLogin = (u: User) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(u));
    setUser(u);
  };

  const handleOnboardingComplete = (biz: Business) => {
    localStorage.setItem(BIZ_KEY, JSON.stringify(biz));
    localStorage.setItem(ONBOARD_KEY, "true");
    setOnboarded(true);
    queryClient.invalidateQueries();
  };

  if (!user) return <LoginPage onLogin={handleLogin} />;
  if (!onboarded) return <Onboarding user={user} onComplete={handleOnboardingComplete} />;

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <PropertyProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        </PropertyProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
