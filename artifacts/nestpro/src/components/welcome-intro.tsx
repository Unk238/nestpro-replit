import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, ArrowRight, ShieldCheck, Zap,
  Globe2, Bot, CreditCard, ChevronRight, CheckCircle2
} from 'lucide-react';
import { Button } from './ui/button';
import { LanguageSelector } from './language-selector';
import { useTranslation } from '@/lib/i18n';

interface WelcomeProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

const HIGHLIGHT_SLIDES = [
  {
    step: '01',
    title: 'Operations & Multi-Property Control',
    tagline: 'PGs, Hostels, Lodges, Flats, Villas, and Shops',
    desc: 'Manage all your residential, commercial, and hospitality properties in one unified operating system.',
    icon: Building2,
  },
  {
    step: '02',
    title: 'Central Booking & OTA Reconciliation',
    tagline: 'Booking.com, Airbnb, Agoda & Direct extensions',
    desc: 'Track reservations across channels, reconcile platform commission fees, and extend stays directly.',
    icon: Globe2,
  },
  {
    step: '03',
    title: 'Automated Rent & Payment Ledger',
    tagline: 'Instant UPI QR, digital receipts & overdue tracking',
    desc: 'Record cash, UPI, and bank payments. Track receivables and automate monthly rent reminders.',
    icon: CreditCard,
  },
  {
    step: '04',
    title: 'Multi-Meter Electricity & Utilities',
    tagline: 'Split bills by bed, room, or days stayed',
    desc: 'Record meter kWh readings and let RENTAQ automatically calculate tenant bills with zero math errors.',
    icon: Zap,
  },
  {
    step: '05',
    title: 'Multilingual AI Virtual Front Desk',
    tagline: '13 Indian Languages + Gemini Context Engine',
    desc: 'Answer room vacancy queries, share pricing policies, and simulate voice calls in regional languages.',
    icon: Bot,
  },
];

export function WelcomeIntro({ onGetStarted, onLogin }: WelcomeProps) {
  const { t } = useTranslation();
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HIGHLIGHT_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const slide = HIGHLIGHT_SLIDES[currentSlide];
  const Icon = slide.icon;

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#F7F9FC] text-[#172033] p-4 sm:p-8">
      {/* Top Header */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2F6FED] text-white shadow-sm">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xl font-black text-[#173B6C] tracking-tight">RENTAQ</span>
            <span className="block text-[10px] font-semibold text-[#667085] uppercase tracking-wider">Property OS</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <LanguageSelector />
          <Button variant="ghost" size="sm" onClick={onLogin} className="text-xs font-semibold text-[#173B6C]">
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Visual Card */}
      <main className="max-w-4xl w-full mx-auto my-6">
        <div className="rounded-2xl border border-[#E5EAF1] bg-white p-6 sm:p-12 shadow-[0_4px_16px_rgba(23,32,51,0.04)]">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            {/* Left Content */}
            <div className="md:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#EFF5FF] border border-[#D6E4FF] text-xs font-bold text-[#2F6FED]">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Feature {slide.step} of 05</span>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-3"
                >
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight leading-snug">
                    {slide.title}
                  </h1>
                  <p className="text-xs sm:text-sm font-semibold text-[#2F6FED]">{slide.tagline}</p>
                  <p className="text-xs sm:text-sm text-[#667085] leading-relaxed">{slide.desc}</p>
                </motion.div>
              </AnimatePresence>

              {/* Slide Indicators */}
              <div className="flex items-center gap-2 pt-2">
                {HIGHLIGHT_SLIDES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentSlide(i)}
                    className={`h-1.5 rounded-full transition-all ${
                      i === currentSlide ? 'w-6 bg-[#2F6FED]' : 'w-1.5 bg-[#E5EAF1] hover:bg-[#CBD5E1]'
                    }`}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-3 pt-4">
                <Button size="lg" onClick={onGetStarted} className="btn-primary gap-2 text-xs sm:text-sm shadow-sm">
                  <span>Start 30-Day Free Trial</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="lg" onClick={onLogin} className="text-xs sm:text-sm">
                  Sign In to Workspace
                </Button>
              </div>
            </div>

            {/* Right Graphic Preview */}
            <div className="md:col-span-5 flex justify-center">
              <div className="w-full max-w-xs rounded-xl border border-[#E5EAF1] bg-[#F7F9FC] p-6 space-y-4 shadow-xs">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#EFF5FF] text-[#2F6FED] border border-[#D6E4FF]">
                  <Icon className="h-7 w-7" />
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-3/4 bg-[#E5EAF1] rounded" />
                  <div className="h-2.5 w-1/2 bg-[#E5EAF1] rounded" />
                </div>
                <div className="space-y-1.5 pt-2 border-t border-[#E5EAF1]">
                  {['Zero setup friction', '13 Indian Languages', 'Embedded local storage'].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-xs font-medium text-[#172033]">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#16845B]" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl w-full mx-auto text-center py-2 text-xs text-[#667085]">
        <p>RENTAQ · Production Property Operations OS · Free trial with zero credit card</p>
      </footer>
    </div>
  );
}
