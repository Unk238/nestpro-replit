import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Building2, Globe2, Users, CreditCard,
  Zap, AlertTriangle, Printer, QrCode, Bot,
  Briefcase, UserCog, Activity, Settings, LogOut,
  ChevronDown, HelpCircle, Menu, X
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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-[#E5EAF1]">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-6 py-4.5 border-b border-[#E5EAF1]">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2F6FED] text-white shadow-xs">
          <Building2 className="h-5 w-5" />
        </div>
        <div>
          <span className="text-lg font-black text-[#173B6C] tracking-tight">RENTAQ</span>
          <span className="block text-[10px] font-semibold text-[#667085] uppercase tracking-wider">Property OS</span>
        </div>
      </div>

      {/* Property Selector */}
      <div className="px-3.5 py-3 border-b border-[#E5EAF1]">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs bg-[#F7F9FC] border border-[#E5EAF1] hover:border-[#CBD5E1] hover:bg-white transition-colors text-[#172033] font-semibold focus-ring">
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-2 w-2 rounded-full bg-[#16845B] flex-shrink-0" />
                <span className="truncate">{activeProperty?.name ?? 'All Properties'}</span>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-[#667085] flex-shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-white border-[#E5EAF1] shadow-lg">
            {properties.map((p: any) => (
              <DropdownMenuItem
                key={p.id}
                onClick={() => {
                  setActiveProperty(p);
                  setMobileNavOpen(false);
                }}
                className="cursor-pointer text-[#172033] hover:bg-[#EFF5FF] hover:text-[#2F6FED]"
              >
                <Building2 className="h-3.5 w-3.5 mr-2 text-[#2F6FED]" />
                <span className="truncate text-xs font-semibold">{p.name}</span>
                <span className="ml-auto text-[10px] uppercase text-[#98A2B3] font-mono">{p.type}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
        {navItems.map((item) => {
          const isActive = location === item.href || (item.href !== '/' && location.startsWith(item.href));
          return (
            <button
              key={item.href}
              onClick={() => {
                navigate(item.href);
                setMobileNavOpen(false);
              }}
              className={cn(
                'relative flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-150 text-left focus-ring',
                isActive
                  ? 'bg-[#EFF5FF] text-[#2F6FED] font-bold shadow-2xs'
                  : 'text-[#667085] hover:bg-[#F7F9FC] hover:text-[#172033]'
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-[#2F6FED]" />
              )}
              <item.icon className={cn('h-4 w-4 flex-shrink-0', isActive ? 'text-[#2F6FED]' : 'text-[#667085]')} />
              <span className="truncate">{item.label}</span>
              {item.badge && pendingCount > 0 && (
                <span className="ml-auto flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#FFF8E1] text-[#D98A00] text-[10px] font-bold border border-[#FFE082]">
                  {pendingCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User footer & Tour trigger */}
      <div className="border-t border-[#E5EAF1] p-3.5 bg-[#F7F9FC]/60 space-y-2">
        <button
          onClick={() => setShowTour(true)}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-white border border-[#E5EAF1] text-[11px] font-semibold text-[#173B6C] hover:bg-[#F7F9FC] transition-colors shadow-2xs"
        >
          <HelpCircle className="h-3.5 w-3.5 text-[#2F6FED]" />
          <span>Product Tour Guide</span>
        </button>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2 min-w-0">
            <Avatar className="h-7 w-7 border border-[#E5EAF1] bg-[#EFF5FF] text-[#2F6FED]">
              <AvatarFallback className="text-[10px] font-bold text-[#2F6FED]">{getInitials(user.name || user.email || 'Admin')}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#172033] truncate">{user.name || user.email || 'Operator'}</p>
              <p className="text-[10px] text-[#667085] uppercase font-mono">{user.role || 'Owner'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg p-1.5 text-[#667085] hover:text-[#D64545] hover:bg-[#FFEBEE] transition-colors focus-ring"
            title="Sign Out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-full min-h-screen bg-[#F7F9FC] text-[#172033]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed left-0 top-0 h-full w-64 z-40">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileNavOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileNavOpen(false)}
              className="fixed inset-0 z-50 bg-[#172033]/40 backdrop-blur-xs lg:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="fixed left-0 top-0 bottom-0 w-64 z-50 lg:hidden shadow-xl"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#E5EAF1] bg-white/95 backdrop-blur-md px-4 sm:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="p-2 -ml-2 rounded-lg text-[#667085] hover:text-[#172033] hover:bg-[#F7F9FC] lg:hidden focus-ring"
              aria-label="Open Navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-base sm:text-lg font-bold text-[#172033] tracking-tight">{title}</h1>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSelector />
            {activeProperty && (
              <span className="hidden sm:inline-flex items-center text-xs font-semibold text-[#2F6FED] bg-[#EFF5FF] border border-[#D6E4FF] px-2.5 py-1 rounded-md">
                {activeProperty.name} ({activeProperty.type})
              </span>
            )}
          </div>
        </header>

        {/* Page Content Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {showTour && <ProductTour onClose={() => setShowTour(false)} />}
      <Toaster />
    </div>
  );
}
