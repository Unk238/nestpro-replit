import React, { useState, useEffect } from 'react';
import { Switch, Route, useLocation } from 'wouter';
import { PropertyProvider } from './components/property-provider';
import { OnboardingWizard } from './components/onboarding-wizard';
import { Toaster } from './components/ui/toaster';

// Pages
import LoginPage from './pages/login';
import DashboardPage from './pages/dashboard';
import PropertiesPage from './pages/properties';
import ExplorerPage from './pages/explorer';
import GuestsPage from './pages/guests';
import GuestDetailPage from './pages/guest-detail';
import PaymentsPage from './pages/payments';
import ComplaintsPage from './pages/complaints';
import StaffPage from './pages/staff';
import ActivityPage from './pages/activity';
import SettingsPage from './pages/settings';
import AIPage from './pages/ai-receptionist';
import CheckinPortalPage from './pages/checkin-portal';
import NotFoundPage from './pages/not-found';

export default function App() {
  const [location] = useLocation();

  // Public check-in portal — no auth required
  if (/^\/checkin\//.test(location)) {
    return (
      <>
        <Switch>
          <Route path="/checkin/:token" component={CheckinPortalPage} />
        </Switch>
        <Toaster />
      </>
    );
  }

  const user = localStorage.getItem('nestpro_user');
  const onboarded = localStorage.getItem('nestpro_onboarded');

  if (!user) return <><LoginPage /><Toaster /></>;

  if (!onboarded) {
    return (
      <PropertyProvider>
        <OnboardingWizard onComplete={() => { window.location.href = '/'; }} />
        <Toaster />
      </PropertyProvider>
    );
  }

  return (
    <PropertyProvider>
      <Switch>
        <Route path="/" component={DashboardPage} />
        <Route path="/properties" component={PropertiesPage} />
        <Route path="/properties/:id/explorer" component={ExplorerPage} />
        <Route path="/guests" component={GuestsPage} />
        <Route path="/guests/:id" component={GuestDetailPage} />
        <Route path="/payments" component={PaymentsPage} />
        <Route path="/complaints" component={ComplaintsPage} />
        <Route path="/staff" component={StaffPage} />
        <Route path="/activity" component={ActivityPage} />
        <Route path="/settings" component={SettingsPage} />
        <Route path="/ai" component={AIPage} />
        <Route component={NotFoundPage} />
      </Switch>
      <Toaster />
    </PropertyProvider>
  );
}
