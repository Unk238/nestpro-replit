import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronRight, ChevronLeft, X,
  LayoutDashboard, Building2, Globe2, CreditCard,
  Printer, Bot, MessageSquare, CheckCircle2
} from 'lucide-react';
import { Button } from './ui/button';

interface TourProps {
  onClose: () => void;
}

const TOUR_STEPS = [
  {
    step: 1,
    title: 'Operations Center',
    desc: 'Live operational control. Instantly see today’s check-ins, check-outs, overdue alerts, and bed availability.',
    icon: LayoutDashboard,
  },
  {
    step: 2,
    title: 'Multi-Type Properties',
    desc: 'Manage PGs, Hostels, Hotels, Villas, Shops, and Offices side-by-side with drill-down building & room trees.',
    icon: Building2,
  },
  {
    step: 3,
    title: 'Central Booking Inbox',
    desc: 'Track bookings from Booking.com, Airbnb, Agoda, MakeMyTrip, and Direct stay extensions with fee reconciliation.',
    icon: Globe2,
  },
  {
    step: 4,
    title: 'Payments & Ledger',
    desc: 'Record cash & UPI payments, auto-generate digital receipts, and track overdue receivables effortlessly.',
    icon: CreditCard,
  },
  {
    step: 5,
    title: 'RENTAQ Studio',
    desc: 'Generate printable House Rules, Room Number signs, Wi-Fi login cards, and Rental Agreements in one click.',
    icon: Printer,
  },
  {
    step: 6,
    title: 'AI Virtual Receptionist',
    desc: 'Context-aware virtual front desk that answers room inquiries in 13 Indian languages and adheres to your pricing rules.',
    icon: Bot,
  },
  {
    step: 7,
    title: 'QR Code & Self Check-In',
    desc: 'Send digital self-check-in links to guests so they upload their Aadhaar, passport, and details before arrival.',
    icon: MessageSquare,
  },
  {
    step: 8,
    title: 'Services & Legal Ecosystem',
    desc: 'Connect with verified lawyers for rental agreements, police verification forms, CA consultation, and electricians.',
    icon: CheckCircle2,
  },
];

export function ProductTour({ onClose }: TourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const stepData = TOUR_STEPS[currentStep];
  const Icon = stepData.icon;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full p-2">
      <motion.div
        initial={{ opacity: 0, y: 15, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 15, scale: 0.97 }}
        className="rounded-xl border border-[#E5EAF1] bg-white shadow-[0_8px_30px_rgba(23,32,51,0.12)] p-6 relative overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EFF5FF] text-[#2F6FED]">
              <Icon className="h-4 w-4" />
            </span>
            <span className="text-xs font-bold text-[#173B6C] uppercase tracking-wider">
              Tour · {currentStep + 1} of {TOUR_STEPS.length}
            </span>
          </div>
          <button onClick={onClose} className="text-[#667085] hover:text-[#172033] transition-colors p-1" title="Close tour">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-1.5 mb-6">
          <h4 className="text-sm font-bold text-[#172033]">{stepData.title}</h4>
          <p className="text-xs text-[#667085] leading-relaxed">{stepData.desc}</p>
        </div>

        {/* Progress Dots & Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-[#E5EAF1]">
          <div className="flex items-center gap-1.5">
            {TOUR_STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === currentStep ? 'w-5 bg-[#2F6FED]' : 'w-1.5 bg-[#E5EAF1]'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="text-xs text-[#667085] hover:text-[#172033] h-8 px-2.5"
              >
                <ChevronLeft className="h-3.5 w-3.5 mr-0.5" /> Back
              </Button>
            )}

            {currentStep < TOUR_STEPS.length - 1 ? (
              <Button
                size="sm"
                onClick={() => setCurrentStep(currentStep + 1)}
                className="btn-primary text-xs font-bold h-8 px-3.5"
              >
                Next <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
              </Button>
            ) : (
              <Button size="sm" onClick={onClose} className="btn-primary text-xs font-bold h-8 px-3.5">
                Got It!
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
