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
      <div className="min-h-screen flex items-center justify-center bg-[#F7F9FC]">
        <Loader2 className="h-8 w-8 animate-spin text-[#2F6FED]" />
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F9FC] text-[#172033] p-4 text-center">
        <Card className="max-w-md p-8">
          <Building2 className="h-12 w-12 text-[#98A2B3] mx-auto mb-3" />
          <h1 className="text-xl font-bold text-[#172033]">Property Not Found</h1>
          <p className="text-xs text-[#667085] mt-1.5">The requested public website is currently unavailable.</p>
        </Card>
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
    <div className="min-h-screen bg-[#F7F9FC] text-[#172033] font-sans">
      {/* Hero Header */}
      <header className="border-b border-[#E5EAF1] bg-white sticky top-0 z-30 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2F6FED] text-white">
              <Building2 className="h-5 w-5" />
            </div>
            <span className="text-lg font-black text-[#173B6C]">{property.name}</span>
          </div>

          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
            <Button size="sm" className="bg-[#16845B] hover:bg-[#116947] text-white font-bold text-xs gap-1.5 shadow-xs">
              <MessageSquare className="h-4 w-4" /> WhatsApp Inquiry
            </Button>
          </a>
        </div>
      </header>

      {/* Main Storefront Body */}
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Banner Section */}
        <div className="rounded-2xl p-8 sm:p-12 bg-white border border-[#E5EAF1] shadow-[0_4px_20px_rgba(23,32,51,0.04)]">
          <div className="max-w-2xl space-y-4">
            <Badge variant="default" className="text-xs uppercase font-bold tracking-wider">
              Verified {property.type.toUpperCase()} Accommodation
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-black text-[#172033] tracking-tight">
              Welcome to {property.name}
            </h1>
            <p className="text-xs sm:text-sm text-[#667085] leading-relaxed">
              {property.description || 'Premium living space equipped with modern amenities, 24x7 security, and exceptional hospitality.'}
            </p>
            <div className="flex items-center gap-2 text-xs text-[#2F6FED] font-semibold pt-1">
              <MapPin className="h-4 w-4 text-[#D64545] flex-shrink-0" />
              <span>{[property.address, property.city, property.state, property.pincode].filter(Boolean).join(', ')}</span>
            </div>
          </div>
        </div>

        {/* Content Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Amenities & Rules */}
          <div className="lg:col-span-8 space-y-6">
            <Card>
              <CardHeader className="border-b border-[#E5EAF1] pb-3">
                <CardTitle className="text-sm text-[#172033]">Included Amenities & Services</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {amenitiesList.map((a: string) => (
                    <div key={a} className="p-3 rounded-lg bg-[#F7F9FC] border border-[#E5EAF1] text-xs font-semibold text-[#172033] flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#16845B] flex-shrink-0" />
                      <span>{a}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {property.rules && (
              <Card>
                <CardHeader className="border-b border-[#E5EAF1] pb-3">
                  <CardTitle className="text-sm text-[#172033] flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-[#2F6FED]" /> Property Rules & Stay Policies
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="p-4 rounded-lg bg-[#F7F9FC] border border-[#E5EAF1] text-xs leading-relaxed text-[#172033] whitespace-pre-line">
                    {property.rules}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column: Direct Booking / Inquiry Form */}
          <div className="lg:col-span-4">
            <Card className="sticky top-24 shadow-sm">
              <CardHeader className="border-b border-[#E5EAF1] pb-3">
                <CardTitle className="text-sm text-[#172033]">Inquire / Book a Visit</CardTitle>
                <p className="text-xs text-[#667085]">Direct booking with zero commission</p>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                {inquirySubmitted ? (
                  <div className="p-6 text-center space-y-2 bg-[#E8F5E9] border border-[#C8E6C9] rounded-xl">
                    <CheckCircle2 className="h-8 w-8 text-[#16845B] mx-auto" />
                    <p className="text-sm font-bold text-[#172033]">Inquiry Received!</p>
                    <p className="text-xs text-[#667085]">We will call you shortly to confirm your room visit.</p>
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
                    <Button type="submit" size="lg" className="btn-primary w-full font-bold text-xs py-2.5">
                      <Send className="h-3.5 w-3.5 mr-1.5" /> Request Callback
                    </Button>
                  </form>
                )}

                <div className="pt-4 border-t border-[#E5EAF1] text-center">
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-[#16845B] hover:underline inline-flex items-center gap-1 font-semibold">
                    <MessageSquare className="h-3.5 w-3.5" /> Or chat directly on WhatsApp
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E5EAF1] py-8 text-center text-xs text-[#667085]">
        <p>Powered by <strong className="text-[#173B6C]">RENTAQ Property OS</strong></p>
      </footer>
    </div>
  );
}
