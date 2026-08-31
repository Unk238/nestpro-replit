import React, { useState } from 'react';
import { Briefcase, ShieldCheck, FileCheck, Wrench, Sparkles, Phone, CheckCircle2, UserCheck, Star } from 'lucide-react';
import { Layout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';

const SERVICES = [
  {
    id: 'rental_agreement',
    category: 'Legal Services',
    title: 'Rental Agreement Drafting & Stamp Duty',
    provider: 'Adv. R. Venkat & Associates',
    rating: '4.9',
    reviews: '240+',
    price: '₹799 per agreement',
    desc: 'Legally vetted 11-month tenancy agreement with e-stamping and digital sign support.',
    icon: FileCheck,
    color: 'bg-indigo-500/20 text-indigo-400',
  },
  {
    id: 'police_verification',
    category: 'Legal Services',
    title: 'Police Tenant Verification Guidance',
    provider: 'LegalSeva Verified Partner',
    rating: '4.8',
    reviews: '180+',
    price: '₹299 per tenant',
    desc: 'Assistance with state police tenant verification forms and local station submission compliance.',
    icon: ShieldCheck,
    color: 'bg-purple-500/20 text-purple-400',
  },
  {
    id: 'ca_tax',
    category: 'Financial & Accounting',
    title: 'GST & Rental Property Income Tax Advisory',
    provider: 'FinPro Chartered Accountants',
    rating: '4.9',
    reviews: '95+',
    price: '₹1,499 per session',
    desc: 'Consultation on rental income deductions, GST applicability on commercial properties, and TDS filing.',
    icon: Briefcase,
    color: 'bg-emerald-500/20 text-emerald-400',
  },
  {
    id: 'deep_cleaning',
    category: 'Maintenance & Operations',
    title: 'PG & Hostel Deep Cleaning & Sanitization',
    provider: 'CleanSwift Pro Services',
    rating: '4.7',
    reviews: '310+',
    price: '₹2,499 per floor',
    desc: 'Professional bathroom acid wash, corridor floor scrubbing, and mattress sanitization.',
    icon: Sparkles,
    color: 'bg-amber-500/20 text-amber-400',
  },
  {
    id: 'electrician',
    category: 'Maintenance & Operations',
    title: 'Licensed Electrician & Sub-Meter Installation',
    provider: 'QuickFix Electricals',
    rating: '4.8',
    reviews: '420+',
    price: '₹499 inspection fee',
    desc: 'Individual room sub-meter wiring, geyser repair, switchboard replacement, and inverter setup.',
    icon: Wrench,
    color: 'bg-blue-500/20 text-blue-400',
  },
];

export default function ServicesPage() {
  const [selectedService, setSelectedService] = useState<any>(null);

  const handleBookService = () => {
    toast({
      title: 'Request submitted!',
      description: `The verified team for ${selectedService?.title} will contact you on your registered phone within 2 hours.`,
      variant: 'success',
    });
    setSelectedService(null);
  };

  return (
    <Layout title="Legal & Professional Services Marketplace">
      <div>
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-indigo-400" /> Verified Legal & Operational Partner Ecosystem
        </h2>
        <p className="text-xs text-slate-300">
          Access certified lawyers for tenancy agreements, police verification assistance, CAs, and local maintenance contractors.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SERVICES.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.id} className="border-slate-800 bg-slate-900/90 hover:border-indigo-500/40 transition-all flex flex-col justify-between">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${s.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <Badge variant="outline" className="text-[10px]">{s.category}</Badge>
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white leading-snug">{s.title}</h3>
                  <p className="text-xs text-slate-400">{s.provider}</p>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{s.desc}</p>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-emerald-400">{s.price}</span>
                    <div className="flex items-center gap-1 text-[11px] text-amber-400 font-semibold mt-0.5">
                      <Star className="h-3 w-3 fill-current" /> {s.rating} ({s.reviews})
                    </div>
                  </div>
                  <Button size="sm" onClick={() => setSelectedService(s)} className="font-bold text-xs">
                    Book Service
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Booking Dialog */}
      <Dialog open={!!selectedService} onOpenChange={(v) => !v && setSelectedService(null)}>
        <DialogContent className="max-w-md bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Request {selectedService?.title}</DialogTitle>
            <CardDescription className="text-slate-300">
              Provided by <strong>{selectedService?.provider}</strong> ({selectedService?.price})
            </CardDescription>
          </DialogHeader>
          <div className="p-6 space-y-4 text-xs text-slate-200">
            <div className="p-3 rounded-lg bg-indigo-950/40 border border-indigo-500/30">
              <p className="font-semibold text-indigo-200 mb-1">How it works:</p>
              <ol className="list-decimal pl-4 space-y-1 text-slate-300">
                <li>Your request is dispatched to the verified legal/operational team.</li>
                <li>They will review your property requirements and connect via phone or WhatsApp.</li>
                <li>Direct consultation & service execution with zero platform commission.</li>
              </ol>
            </div>
            <p className="text-slate-400 text-[11px]">
              RENTAQ connects you directly with certified external professionals for compliance and peace of mind.
            </p>
          </div>
          <DialogFooter className="p-6 border-t border-slate-800">
            <Button variant="ghost" onClick={() => setSelectedService(null)}>Cancel</Button>
            <Button onClick={handleBookService} className="font-bold">
              Confirm & Request Callback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
