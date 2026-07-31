import React from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Building2, Users, CreditCard, AlertTriangle,
  UserCog, Activity, Bot, Settings, LogOut, ChevronDown, Home,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePropertyContext } from './property-provider';
import { api } from '@/lib/api';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Avatar, AvatarFallback } from './ui/avatar';
import { getInitials } from '@/lib/utils';
import { Toaster } from './ui/toaster';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/' },
  { label: 'Properties', icon: Building2, href: '/properties' },
  { label: 'Guests', icon: Users, href: '/guests', badge: true },
  { label: 'Payments', icon: CreditCard, href: '/payments' },
  { label: 'Complaints', icon: AlertTriangle, href: '/complaints' },
  { label: 'Staff', icon: UserCog, href: '/staff' },
  { label: 'Activity', icon: Activity, href: '/activity' },
  { label: 'AI Receptionist', icon: Bot, href: '/ai' },
  { label: 'Settings', icon: Settings, href: '/settings' },
];

interface LayoutProps {
  children: React.ReactNode;
  title: string;
}

export function Layout({ children, title }: LayoutProps) {
  const [location, navigate] = useLocation();
  const { activeProperty, setActiveProperty, properties } = usePropertyContext();
  const user = JSON.parse(localStorage.getItem('nestpro_user') || '{}');

  const { data: submissions = [] } = useQuery({
    queryKey: ['checkin-submissions'],
    queryFn: api.getCheckinSubmissions,
    refetchInterval: 30_000,
  });
  const pendingCount = submissions.length;

  const handleLogout = () => {
    localStorage.removeItem('nestpro_user');
    localStorage.removeItem('nestpro_onboarded');
    window.location.href = '/';
  };

  return (
    <div className="flex h-full min-h-screen bg-[#080d1a]">
      {/* Sidebar with high contrast typography */}
      <aside className="fixed left-0 top-0 h-full w-64 flex flex-col border-r border-slate-800 bg-[#0c1322] z-40">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-violet-600 shadow-lg shadow-indigo-500/30">
            <Home className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="text-xl font-extrabold gradient-text tracking-tight">NestPro</span>
            <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">PG & Hostel OS</span>
          </div>
        </div>

        {/* Property Selector */}
        <div className="px-4 py-3 border-b border-slate-800">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm bg-slate-900 border border-slate-700/80 hover:border-indigo-400/50 transition-colors text-slate-100 font-semibold focus-ring">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50 flex-shrink-0" />
                  <span className="truncate">{activeProperty?.name ?? 'Select property'}</span>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-400 flex-shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-slate-900 border-slate-700 text-slate-100">
              {properties.map((p: any) => (
                <DropdownMenuItem key={p.id} onClick={() => setActiveProperty(p)} className="cursor-pointer text-slate-200 hover:text-white hover:bg-slate-800">
                  <Building2 className="h-4 w-4 mr-2 text-indigo-400" />
                  <span className="truncate font-medium">{p.name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== '/' && location.startsWith(item.href));
            return (
              <button
                key={item.href}
                onClick={() => navigate(item.href)}
                className={cn(
                  'relative flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-semibold transition-all duration-150 focus-ring',
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600/25 to-purple-600/15 text-white border border-indigo-500/35 shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-gradient-to-b from-indigo-400 to-violet-500" />
                )}
                <item.icon className={cn('h-4.5 w-4.5 flex-shrink-0', isActive ? 'text-indigo-400' : 'text-slate-400')} />
                <span>{item.label}</span>
                {item.badge && pendingCount > 0 && (
                  <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/40 shadow-sm">
                    {pendingCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="border-t border-slate-800 px-4 py-3.5 bg-slate-950/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar className="h-8.5 w-8.5 border border-slate-700">
                <AvatarFallback className="text-xs font-bold">{getInitials(user.email ?? 'A')}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-100 truncate">{user.email ?? 'Admin Operator'}</p>
                <p className="text-[10px] font-semibold text-slate-400">Owner Account</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-lg p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/15 transition-colors focus-ring"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-64 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 flex h-16 items-center border-b border-slate-800 bg-[#080d1a]/90 backdrop-blur-md px-8">
          <h1 className="text-lg font-bold text-slate-100 tracking-tight">{title}</h1>
          <div className="ml-auto flex items-center gap-3">
            {activeProperty && (
              <span className="text-xs font-semibold text-indigo-300 bg-indigo-950/70 border border-indigo-500/30 px-3 py-1 rounded-md shadow-sm">
                {activeProperty.name}
              </span>
            )}
          </div>
        </header>

        {/* 32px major section spacing system */}
        <div className="flex-1 p-8 space-y-8">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            {children}
          </motion.div>
        </div>
      </main>

      <Toaster />
    </div>
  );
}
