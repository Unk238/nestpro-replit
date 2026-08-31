import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, BedDouble, Globe2, FileText, MessageSquare,
  Bot, Users, ShieldCheck, ChevronRight, Play, Pause
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LanguageSelector } from './language-selector';
import { useTranslation } from '@/lib/i18n';

interface Props {
  onGetStarted: () => void;
  onLogin: () => void;
}

const SLIDES = [
  {
    id: 1,
    title: 'Everything you manage. One place.',
    subtitle: 'RENTAQ replaces spreadsheets and WhatsApp chaos with a single intelligent operating system.',
    icon: Building2,
    badge: 'All-In-One SaaS',
    color: 'from-indigo-500 to-violet-600',
    highlight: 'PGs · Hostels · Hotels · Villas · Shops · Libraries',
  },
  {
    id: 2,
    title: 'Properties. Rooms. Guests. Payments.',
    subtitle: 'Real-time bed availability, automated rent reminders, instant invoice receipts, and overdue alerts.',
    icon: BedDouble,
    badge: 'Operations & Ledger',
    color: 'from-purple-500 to-pink-600',
    highlight: 'Instant Live Occupancy & Cashflow Tracking',
  },
  {
    id: 3,
    title: 'Bookings from multiple platforms.',
    subtitle: 'Seamless central inbox tracking Booking.com, Airbnb, Agoda, MakeMyTrip, and Direct stay extensions.',
    icon: Globe2,
    badge: 'Channel Inbox',
    color: 'from-blue-500 to-indigo-600',
    highlight: 'Platform Fee Reconciliation & Direct Extensions',
  },
  {
    id: 4,
    title: 'Documents, agreements & verification.',
    subtitle: 'Paperless guest onboarding with digital Aadhaar, passport, rental agreements, and human verification.',
    icon: FileText,
    badge: 'Document Vault',
    color: 'from-emerald-500 to-teal-600',
    highlight: 'QR Self Check-In with Zero Manual Data Entry',
  },
  {
    id: 5,
    title: 'WhatsApp communication automation.',
    subtitle: 'Automated check-in links, payment receipts, rent due reminders, and house rules delivered directly.',
    icon: MessageSquare,
    badge: 'Automations',
    color: 'from-green-500 to-emerald-600',
    highlight: 'Respectful, Policy-Compliant Business Messaging',
  },
  {
    id: 6,
    title: 'AI receptionist & voice call assistant.',
    subtitle: 'Multilingual virtual front desk that answers room inquiries, enforces pricing rules, and escalates to humans.',
    icon: Bot,
    badge: 'AI Front Desk',
    color: 'from-amber-500 to-orange-600',
    highlight: '13 Indian Languages · Never Violates Rate Limits',
  },
  {
    id: 7,
    title: 'Team management & RENTAQ Studio.',
    subtitle: 'Multi-user role-based permissions, printable posters, QR door signs, and utility meter split calculations.',
    icon: Users,
    badge: 'Business Toolkit',
    color: 'from-fuchsia-500 to-purple-600',
    highlight: 'Printable Room Signs, QR Codes & Meter Management',
  },
  {
    id: 8,
    title: 'Built for the way Indian businesses actually work.',
    subtitle: 'Empowering owners across India with legal agreement guidance, CA consultations, and verified local pros.',
    icon: ShieldCheck,
    badge: 'Indian Business OS',
    color: 'from-indigo-600 to-violet-700',
    highlight: 'Trust · Speed · Multilingual · Cloud & Local Safe',
  },
];

export function WelcomeIntro({ onGetStarted, onLogin }: Props) {
  const { t } = useTranslation();
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-advancing visual presentation
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % SLIDES.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isPaused]);

  const slide = SLIDES[current];
  const Icon = slide.icon;

  return (
    <div className="min-h-screen bg-[#050811] text-white flex flex-col justify-between relative overflow-hidden px-4 py-6 sm:p-8">
      {/* Background glow orbs */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Bar: Brand, Language, Skip/Login */}
      <header className="relative z-10 max-w-6xl w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="text-2xl font-black gradient-text tracking-tight">RENTAQ</span>
            <span className="hidden sm:inline-block text-[11px] font-semibold text-slate-400 ml-2 uppercase tracking-wider">Business OS</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <LanguageSelector />
          <Button variant="ghost" size="sm" onClick={onLogin} className="text-slate-300 hover:text-white">
            Sign In
          </Button>
          <Button variant="outline" size="sm" onClick={onGetStarted} className="hidden sm:inline-flex border-slate-700">
            Skip Intro
          </Button>
        </div>
      </header>

      {/* Center Slide Carousel Container */}
      <main className="relative z-10 max-w-4xl w-full mx-auto my-auto py-10 flex flex-col items-center text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center space-y-6"
          >
            {/* Visual Icon Badge */}
            <div className={`flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br ${slide.color} shadow-2xl shadow-indigo-500/30 ring-1 ring-white/20`}>
              <Icon className="h-12 w-12 text-white" />
            </div>

            {/* Badge */}
            <span className="inline-flex items-center px-4 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 uppercase tracking-wider">
              {slide.badge}
            </span>

            {/* Headlines */}
            <div className="space-y-3 max-w-2xl">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
                {slide.title}
              </h2>
              <p className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed">
                {slide.subtitle}
              </p>
            </div>

            {/* Value Highlight Pill */}
            <div className="p-3 px-6 rounded-xl bg-slate-900/80 border border-slate-800 text-xs sm:text-sm font-semibold text-slate-200 shadow-inner">
              ✨ <span className="text-indigo-400 font-bold">{slide.highlight}</span>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Slide Progress Indicators */}
        <div className="flex items-center gap-2 mt-10">
          {SLIDES.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setCurrent(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === current ? 'w-8 bg-gradient-to-r from-indigo-500 to-purple-500' : 'w-2 bg-slate-700 hover:bg-slate-500'
              }`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="ml-3 text-slate-400 hover:text-white transition-colors"
            title={isPaused ? 'Resume auto-play' : 'Pause auto-play'}
          >
            {isPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
          </button>
        </div>
      </main>

      {/* Bottom CTA Bar */}
      <footer className="relative z-10 max-w-md w-full mx-auto flex flex-col sm:flex-row gap-3 items-center">
        <Button size="lg" className="w-full text-base font-bold shadow-2xl shadow-indigo-500/40" onClick={onGetStarted}>
          Get Started with RENTAQ
          <ChevronRight className="h-5 w-5 ml-1" />
        </Button>
      </footer>
    </div>
  );
}
