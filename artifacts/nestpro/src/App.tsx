import React, { useState, useEffect } from 'react';
import { Switch, Route, useLocation } from 'wouter';
import { I18nProvider } from './lib/i18n';
import { PropertyProvider } from './components/property-provider';
import { OnboardingWizard } from './components/onboarding-wizard';
import { WelcomeIntro } from './components/welcome-intro';
import { Toaster } from './components/ui/toaster';

// Pages
import LoginPage from './pages/login';
import DashboardPage from './pages/dashboard';
import PropertiesPage from './pages/properties';
import ExplorerPage from './pages/explorer';
import BookingsPage from './pages/bookings';
import GuestsPage from './pages/guests';
import GuestDetailPage from './pages/guest-detail';
import PaymentsPage from './pages/payments';
import UtilitiesPage from './pages/utilities';
import ComplaintsPage from './pages/complaints';
import StudioPage from './pages/studio';
import QRToolsPage from './pages/qr-tools';
import ServicesPage from './pages/services';
import TeamPage from './pages/team';
import ActivityPage from './pages/activity';
import SettingsPage from './pages/settings';
import AIPage from './pages/ai-receptionist';
import CheckinPortalPage from './pages/checkin-portal';
import PublicStorefrontPage from './pages/public-storefront';
import NotFoundPage from './pages/not-found';

export default function App() {
  const [location, navigate] = useLocation();
  const [showWelcome, setShowWelcome] = useState(() => {
    return !localStorage.getItem('rentaq_saw_welcome') && !localStorage.getItem('nestpro_user') && !localStorage.getItem('rentaq_user');
  });

  // 1. Public Guest Self Check-In Portal — /checkin/:token
  if (/^\/checkin\//.test(location)) {
    return (
      <I18nProvider>
        <Switch>
          <Route path="/checkin/:token" component={CheckinPortalPage} />
        </Switch>
        <Toaster />
      </I18nProvider>
    );
  }

  // 2. Public Property Website Storefront — /p/:slug
  if (/^\/p\//.test(location)) {
    return (
      <I18nProvider>
        <Switch>
          <Route path="/p/:slug" component={PublicStorefrontPage} />
        </Switch>
        <Toaster />
      </I18nProvider>
    );
  }

  // 3. Welcome Intro Carousel Experience (Before login)
  if (showWelcome) {
    return (
      <I18nProvider>
        <WelcomeIntro
          onGetStarted={() => {
            localStorage.setItem('rentaq_saw_welcome', 'true');
            setShowWelcome(false);
          }}
          onLogin={() => {
            localStorage.setItem('rentaq_saw_welcome', 'true');
            setShowWelcome(false);
          }}
        />
        <Toaster />
      </I18nProvider>
    );
  }

  const user = localStorage.getItem('rentaq_user') || localStorage.getItem('nestpro_user');
  const onboarded = localStorage.getItem('rentaq_onboarded') || localStorage.getItem('nestpro_onboarded');

  // 4. Sign-In Page
  if (!user) {
    return (
      <I18nProvider>
        <LoginPage />
        <Toaster />
      </I18nProvider>
    );
  }

  // 5. 8-Step Onboarding Wizard
  if (!onboarded) {
    return (
      <I18nProvider>
        <PropertyProvider>
          <OnboardingWizard onComplete={() => { window.location.href = '/'; }} />
          <Toaster />
        </PropertyProvider>
      </I18nProvider>
    );
  }

  // 6. Main RENTAQ SaaS Operating Platform
  return (
    <I18nProvider>
      <PropertyProvider>
        <Switch>
          <Route path="/" component={DashboardPage} />
          <Route path="/properties" component={PropertiesPage} />
          <Route path="/properties/:id/explorer" component={ExplorerPage} />
          <Route path="/bookings" component={BookingsPage} />
          <Route path="/guests" component={GuestsPage} />
          <Route path="/guests/:id" component={GuestDetailPage} />
          <Route path="/payments" component={PaymentsPage} />
          <Route path="/utilities" component={UtilitiesPage} />
          <Route path="/complaints" component={ComplaintsPage} />
          <Route path="/studio" component={StudioPage} />
          <Route path="/qr-tools" component={QRToolsPage} />
          <Route path="/services" component={ServicesPage} />
          <Route path="/team" component={TeamPage} />
          <Route path="/activity" component={ActivityPage} />
          <Route path="/settings" component={SettingsPage} />
          <Route path="/ai" component={AIPage} />
          <Route component={NotFoundPage} />
        </Switch>
        <Toaster />
      </PropertyProvider>
    </I18nProvider>
  );
}
