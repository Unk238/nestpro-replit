import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Building2, Globe2, Users, CreditCard,
  Zap, AlertTriangle, Printer, QrCode, Bot,
  Briefcase, UserCog, Activity, Settings, LogOut,
  ChevronDown, Home, HelpCircle, Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePropertyContext } from './property-provider';
import { LanguageSelector } from './language-selector';
import { ProductTour } from './product-tour';
import { useTranslation } from '@/lib/i18n';
import { api } from '@/lib/api';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Avatar, AvatarFallback } from './ui/avatar';
import { getInitials } from '@/lib/utils';
import { Toaster } from './ui/toaster';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
}

export function Layout({ children, title }: LayoutProps) {
  const [location, navigate] = useLocation();
  const { t } = useTranslation();
  const { activeProperty, setActiveProperty, properties } = usePropertyContext();
  const user = JSON.parse(localStorage.getItem('rentaq_user') || localStorage.getItem('nestpro_user') || '{}');
  const [showTour, setShowTour] = useState(false);

  const { data: submissions = [] } = useQuery({
    queryKey: ['checkin-submissions'],
    queryFn: api.getCheckinSubmissions,
    refetchInterval: 30_000,
  });
  const pendingCount = submissions.length;

  const handleLogout = () => {
    localStorage.removeItem('rentaq_user');
    localStorage.removeItem('rentaq_onboarded');
    localStorage.removeItem('nestpro_user');
    localStorage.removeItem('nestpro_onboarded');
    window.location.href = '/';
  };

  const navItems = [
    { label: t('dashboard', 'Operations Center'), icon: LayoutDashboard, href: '/' },
    { label: t('properties', 'Properties'), icon: Building2, href: '/properties' },
    { label: t('bookings', 'Central Bookings'), icon: Globe2, href: '/bookings' },
    { label: t('guests', 'Guests & Tenants'), icon: Users, href: '/guests', badge: true },
    { label: t('payments', 'Payments & Ledger'), icon: CreditCard, href: '/payments' },
    { label: t('utilities', 'Utilities & Meters'), icon: Zap, href: '/utilities' },
    { label: 'Complaints & Work', icon: AlertTriangle, href: '/complaints' },
    { label: t('studio', 'RENTAQ Studio'), icon: Printer, href: '/studio' },
    { label: t('qrTools', 'QR Code Tools'), icon: QrCode, href: '/qr-tools' },
    { label: t('aiReceptionist', 'AI Virtual Reception'), icon: Bot, href: '/ai' },
    { label: t('services', 'Services Marketplace'), icon: Briefcase, href: '/services' },
    { label: t('team', 'Team & RBAC'), icon: UserCog, href: '/team' },
    { label: 'Activity Audit', icon: Activity, href: '/activity' },
    { label: t('settings', 'Settings'), icon: Settings, href: '/settings' },
  ];

  return (
    <div className="flex h-full min-h-screen bg-[#070b16] text-slate-100">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 flex flex-col border-r border-slate-800/90 bg-[#0a101f] z-40">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-600 shadow-lg shadow-indigo-500/30">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="text-xl font-black gradient-text tracking-tight">RENTAQ</span>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Business OS</span>
          </div>
        </div>

        {/* Property Selector */}
        <div className="px-4 py-3 border-b border-slate-800">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs bg-slate-900 border border-slate-700 hover:border-indigo-400 transition-colors text-slate-100 font-semibold focus-ring">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50 flex-shrink-0" />
                  <span className="truncate">{activeProperty?.name ?? 'All Properties'}</span>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-slate-900 border-slate-700 text-slate-100">
              {properties.map((p: any) => (
                <DropdownMenuItem key={p.id} onClick={() => setActiveProperty(p)} className="cursor-pointer text-slate-200 hover:text-white hover:bg-slate-800">
                  <Building2 className="h-3.5 w-3.5 mr-2 text-indigo-400" />
                  <span className="truncate text-xs font-semibold">{p.name}</span>
                  <span className="ml-auto text-[10px] uppercase text-slate-400 font-mono">{p.type}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== '/' && location.startsWith(item.href));
            return (
              <button
                key={item.href}
                onClick={() => navigate(item.href)}
                className={cn(
                  'relative flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-150 focus-ring',
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600/25 to-purple-600/15 text-white border border-indigo-500/35 shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-gradient-to-b from-indigo-400 to-fuchsia-500" />
                )}
                <item.icon className={cn('h-4 w-4 flex-shrink-0', isActive ? 'text-indigo-400' : 'text-slate-400')} />
                <span className="truncate">{item.label}</span>
                {item.badge && pendingCount > 0 && (
                  <span className="ml-auto flex h-4.5 w-4.5 items-center justify-center rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/40">
                    {pendingCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User footer & Tour trigger */}
        <div className="border-t border-slate-800 px-4 py-3 bg-slate-950/40 space-y-2">
          <button
            onClick={() => setShowTour(true)}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-[11px] font-bold text-indigo-300 hover:bg-indigo-900/40 transition-colors"
          >
            <HelpCircle className="h-3.5 w-3.5 text-indigo-400" />
            <span>Interactive Tour</span>
          </button>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2 min-w-0">
              <Avatar className="h-7 w-7 border border-slate-700">
                <AvatarFallback className="text-[10px] font-bold">{getInitials(user.name || user.email || 'Admin')}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-100 truncate">{user.name || user.email || 'Operator'}</p>
                <p className="text-[10px] text-slate-400 uppercase font-mono">{user.role || 'Owner'}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-lg p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/15 transition-colors focus-ring"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <main className="flex-1 ml-64 flex flex-col min-h-screen">
        {/* Header Bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-800 bg-[#070b16]/90 backdrop-blur-md px-8">
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">{title}</h1>
          </div>

          <div className="flex items-center gap-4">
            <LanguageSelector />
            {activeProperty && (
              <span className="text-xs font-semibold text-indigo-300 bg-indigo-950/70 border border-indigo-500/30 px-3 py-1 rounded-md">
                {activeProperty.name} ({activeProperty.type})
              </span>
            )}
          </div>
        </header>

        {/* Major Section Spacing System */}
        <div className="flex-1 p-8 space-y-8">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            {children}
          </motion.div>
        </div>
      </main>

      {showTour && <ProductTour onClose={() => setShowTour(false)} />}
      <Toaster />
    </div>
  );
}
