import React, { useState, useEffect } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { PropertyProvider } from "@/components/property-provider";
import LoginPage from "@/pages/login";

import Dashboard from "@/pages/dashboard";
import Properties from "@/pages/properties";
import Explorer from "@/pages/explorer";
import Guests from "@/pages/guests";
import GuestDetail from "@/pages/guest-detail";
import Payments from "@/pages/payments";
import Complaints from "@/pages/complaints";
import Staff from "@/pages/staff";
import Activity from "@/pages/activity";

const queryClient = new QueryClient();

const SESSION_KEY = "nestpro_user";

interface User {
  name: string;
  email: string;
}

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
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const handleLogin = (u: User) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(u));
    setUser(u);
  };

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

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
