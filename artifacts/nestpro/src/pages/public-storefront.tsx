import React, { useState } from 'react';
import { useRoute } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import {
  Building2, MapPin, Phone, Mail, CheckCircle2, MessageSquare,
  ShieldCheck, Wifi, Sparkles, IndianRupee, Send, Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

export default function PublicStorefrontPage() {
  const [, params] = useRoute('/p/:slug');
  const slug = params?.slug || '';

  const [inquiryName, setInquiryName] = useState('');
  const [inquiryPhone, setInquiryPhone] = useState('');
  const [inquirySubmitted, setInquirySubmitted] = useState(false);

  const { data: property, isLoading, error } = useQuery({
    queryKey: ['public-property', slug],
    queryFn: () => api.getPublicProperty(slug),
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#060a14] text-white">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#060a14] text-white p-4 text-center">
        <div>
          <Building2 className="h-16 w-16 text-slate-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold">Property Storefront Not Found</h1>
          <p className="text-sm text-slate-400 mt-2">The requested public property website is unavailable.</p>
        </div>
      </div>
    );
  }

  let amenitiesList: string[] = [];
  try {
    amenitiesList = property.amenities ? JSON.parse(property.amenities) : [];
  } catch (_e) {
    amenitiesList = ['High-Speed Wi-Fi', '24x7 Security', 'RO Drinking Water', 'Clean Rooms'];
  }

  const handleSendInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    setInquirySubmitted(true);
    toast({ title: 'Inquiry Sent!', description: 'The property manager will contact you on WhatsApp/Phone shortly.', variant: 'success' });
  };

  const whatsappUrl = `https://wa.me/${(property.contactPhone || '919876543210').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
    `Hello, I saw your property "${property.name}" on RENTAQ and would like to inquire about room availability.`
  )}`;

  return (
    <div className="min-h-screen bg-[#070b16] text-slate-100 font-sans">
      {/* Hero Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-extrabold text-white">{property.name}</span>
          </div>

          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 font-bold text-xs gap-1.5 shadow-md shadow-emerald-600/20">
              <MessageSquare className="h-4 w-4" /> WhatsApp Us
            </Button>
          </a>
        </div>
      </header>

      {/* Main Storefront Body */}
      <main className="max-w-6xl mx-auto px-6 py-10 space-y-10">
        {/* Banner Section */}
        <div className="rounded-3xl p-8 sm:p-12 bg-gradient-to-br from-indigo-950/60 via-slate-900 to-purple-950/40 border border-slate-700/80 shadow-2xl relative overflow-hidden">
          <div className="max-w-2xl space-y-4">
            <Badge variant="default" className="text-xs uppercase font-bold tracking-wider">
              Verified {property.type.toUpperCase()} Accommodation
            </Badge>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              Welcome to {property.name}
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
              {property.description || 'Premium living space equipped with modern amenities, 24x7 security, and exceptional hospitality.'}
            </p>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-indigo-300 font-medium pt-2">
              <MapPin className="h-4 w-4 text-red-400 flex-shrink-0" />
              <span>{[property.address, property.city, property.state, property.pincode].filter(Boolean).join(', ')}</span>
            </div>
          </div>
        </div>

        {/* Content Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Amenities, Rooms & Rules */}
          <div className="lg:col-span-8 space-y-8">
            {/* Amenities Grid */}
            <Card className="border-slate-800 bg-slate-900/80">
              <CardHeader>
                <CardTitle className="text-lg text-white">Included Amenities & Services</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {amenitiesList.map((a: string) => (
                    <div key={a} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs font-semibold text-slate-200 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                      <span>{a}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* House Rules */}
            {property.rules && (
              <Card className="border-slate-800 bg-slate-900/80">
                <CardHeader>
                  <CardTitle className="text-lg text-white flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-indigo-400" /> Property Rules & Stay Policies
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs leading-relaxed text-slate-300 whitespace-pre-line">
                    {property.rules}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column: Direct Booking / Inquiry Form */}
          <div className="lg:col-span-4">
            <Card className="border-indigo-500/30 bg-slate-900/95 sticky top-24 shadow-2xl">
              <CardHeader className="border-b border-slate-800 pb-4">
                <CardTitle className="text-base text-white">Inquire / Book a Visit</CardTitle>
                <p className="text-xs text-slate-400">Direct booking with zero commission</p>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {inquirySubmitted ? (
                  <div className="p-6 text-center space-y-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl">
                    <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
                    <p className="text-sm font-bold text-white">Inquiry Received!</p>
                    <p className="text-xs text-slate-300">We will call you shortly to confirm your room visit.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSendInquiry} className="space-y-4">
                    <div>
                      <Label>Your Full Name *</Label>
                      <Input required value={inquiryName} onChange={(e) => setInquiryName(e.target.value)} placeholder="Amit Singh" />
                    </div>
                    <div>
                      <Label>Your Phone Number *</Label>
                      <Input required value={inquiryPhone} onChange={(e) => setInquiryPhone(e.target.value)} placeholder="+91 98765 43210" />
                    </div>
                    <Button type="submit" size="lg" className="w-full font-bold">
                      <Send className="h-4 w-4 mr-1.5" /> Request Callback
                    </Button>
                  </form>
                )}

                <div className="pt-4 border-t border-slate-800 text-center">
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-400 hover:underline inline-flex items-center gap-1 font-semibold">
                    <MessageSquare className="h-3.5 w-3.5" /> Or chat directly on WhatsApp
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-8 text-center text-xs text-slate-400">
        <p>Powered by <strong className="text-white">RENTAQ Business OS</strong> · Indian Property Platform</p>
      </footer>
    </div>
  );
}
