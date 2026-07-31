import React, { useEffect, useRef } from 'react';
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

  // Poll for pending check-in submissions every 30s
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
    <div className="flex h-full min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 flex flex-col border-r border-border bg-[#0d1526] z-40">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30">
            <Home className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold gradient-text">NestPro</span>
        </div>

        {/* Property selector */}
        <div className="px-4 py-3 border-b border-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm bg-secondary/50 hover:bg-secondary transition-colors">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 flex-shrink-0" />
                  <span className="truncate text-foreground font-medium">
                    {activeProperty?.name ?? 'Select property'}
                  </span>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              {properties.map((p: any) => (
                <DropdownMenuItem key={p.id} onClick={() => setActiveProperty(p)} className="cursor-pointer">
                  <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="truncate">{p.name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== '/' && location.startsWith(item.href));
            return (
              <button
                key={item.href}
                onClick={() => navigate(item.href)}
                className={cn(
                  'relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-gradient-to-r from-indigo-500/20 to-violet-500/10 text-indigo-300 border border-indigo-500/20'
                    : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full bg-gradient-to-b from-indigo-500 to-violet-500" />
                )}
                <item.icon className={cn('h-4 w-4 flex-shrink-0', isActive && 'text-indigo-400')} />
                <span>{item.label}</span>
                {item.badge && pendingCount > 0 && (
                  <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/30">
                    {pendingCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="border-t border-border px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">{getInitials(user.email ?? 'U')}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{user.email ?? 'Admin'}</p>
                <p className="text-[10px] text-muted-foreground">Owner</p>
              </div>
            </div>
            <button onClick={handleLogout} className="rounded-md p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-64 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 flex h-14 items-center border-b border-border bg-background/80 backdrop-blur px-6">
          <h1 className="text-base font-semibold text-foreground">{title}</h1>
          <div className="ml-auto flex items-center gap-3">
            {activeProperty && (
              <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-md">
                {activeProperty.name}
              </span>
            )}
          </div>
        </header>
        <div className="flex-1 p-6">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            {children}
          </motion.div>
        </div>
      </main>

      <Toaster />
    </div>
  );
}
