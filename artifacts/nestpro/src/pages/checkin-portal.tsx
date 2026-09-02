import React, { useState } from 'react';
import { useRoute } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Building2, CheckCircle2, ShieldCheck, UserCheck,
  Upload, Phone, Mail, MapPin, Loader2, ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { LanguageSelector } from '@/components/language-selector';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

export default function CheckinPortalPage() {
  const [, params] = useRoute('/checkin/:token');
  const token = params?.token || '';

  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    aadhaar: '',
    emergencyContact: '',
    emergencyPhone: '',
    occupation: '',
    hometown: '',
    vehicleNumber: '',
    notes: '',
  });

  const { data: tokenInfo, isLoading, error } = useQuery({
    queryKey: ['checkin-token', token],
    queryFn: () => api.getCheckinToken(token),
    retry: false,
  });

  const submitMutation = useMutation({
    mutationFn: (data: any) => api.submitCheckin(token, data),
    onSuccess: () => {
      setSubmitted(true);
      toast({ title: 'Check-in details submitted!', variant: 'success' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) {
      toast({ title: 'Required fields missing', description: 'Please fill name and mobile number.', variant: 'destructive' });
      return;
    }
    submitMutation.mutate(form);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F9FC]">
        <Loader2 className="h-8 w-8 animate-spin text-[#2F6FED]" />
      </div>
    );
  }

  if (error || !tokenInfo) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-[#F7F9FC] p-4 text-center">
        <Card className="max-w-md w-full p-6">
          <ShieldCheck className="h-12 w-12 text-[#98A2B3] mx-auto mb-3" />
          <h2 className="text-lg font-bold text-[#172033]">Link Expired or Invalid</h2>
          <p className="text-xs text-[#667085] mt-1.5">
            This digital check-in invitation is invalid or has already been used. Please contact the property manager for a new link.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#F7F9FC] text-[#172033] p-4 sm:p-8 font-sans">
      {/* Header */}
      <header className="max-w-2xl w-full mx-auto flex items-center justify-between py-2 border-b border-[#E5EAF1] pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2F6FED] text-white">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <span className="text-base font-bold text-[#173B6C]">{tokenInfo.propertyName || 'Property'}</span>
            <span className="block text-[10px] text-[#667085] uppercase tracking-wider">Digital Self Check-In</span>
          </div>
        </div>
        <LanguageSelector />
      </header>

      {/* Main Container */}
      <main className="max-w-2xl w-full mx-auto my-6">
        <Card className="shadow-[0_4px_20px_rgba(23,32,51,0.04)]">
          {submitted ? (
            <CardContent className="p-8 sm:p-12 text-center space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#E8F5E9] text-[#16845B] mx-auto">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-bold text-[#172033]">Check-In Information Submitted!</h2>
              <p className="text-xs text-[#667085] max-w-md mx-auto leading-relaxed">
                Thank you, <strong>{form.name}</strong>. Your identification and stay details have been securely recorded with the property administration. Your room keys will be handed over upon arrival.
              </p>
            </CardContent>
          ) : (
            <>
              <CardHeader className="border-b border-[#E5EAF1] pb-4">
                <CardTitle className="text-base font-bold text-[#172033]">Guest Registration & KYC</CardTitle>
                <CardDescription className="text-xs text-[#667085]">
                  Please provide your personal details and emergency contact for government compliance and room allotment.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Full Name (as per ID) *</Label>
                      <Input
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Rohan Mehra"
                      />
                    </div>
                    <div>
                      <Label>Mobile Number (WhatsApp) *</Label>
                      <Input
                        required
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Email Address</Label>
                      <Input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="rohan@example.com"
                      />
                    </div>
                    <div>
                      <Label>Aadhaar / ID Card Number</Label>
                      <Input
                        value={form.aadhaar}
                        onChange={(e) => setForm({ ...form, aadhaar: e.target.value })}
                        placeholder="XXXX XXXX XXXX"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Occupation / Company / College</Label>
                      <Input
                        value={form.occupation}
                        onChange={(e) => setForm({ ...form, occupation: e.target.value })}
                        placeholder="Software Engineer / Student"
                      />
                    </div>
                    <div>
                      <Label>Permanent Hometown / City</Label>
                      <Input
                        value={form.hometown}
                        onChange={(e) => setForm({ ...form, hometown: e.target.value })}
                        placeholder="Pune, Maharashtra"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#E5EAF1]">
                    <div>
                      <Label>Emergency Contact Person</Label>
                      <Input
                        value={form.emergencyContact}
                        onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })}
                        placeholder="Parent / Guardian Name"
                      />
                    </div>
                    <div>
                      <Label>Emergency Contact Phone *</Label>
                      <Input
                        value={form.emergencyPhone}
                        onChange={(e) => setForm({ ...form, emergencyPhone: e.target.value })}
                        placeholder="+91 98765 00000"
                      />
                    </div>
                  </div>

                  <Button type="submit" disabled={submitMutation.isPending} className="btn-primary w-full font-bold text-xs py-2.5 mt-2">
                    {submitMutation.isPending ? 'Submitting Details...' : 'Complete Self Check-In'}
                    <ArrowRight className="h-4 w-4 ml-1.5" />
                  </Button>
                </form>
              </CardContent>
            </>
          )}
        </Card>
      </main>

      {/* Footer */}
      <footer className="max-w-2xl w-full mx-auto text-center py-2 text-xs text-[#667085]">
        <p>Powered by <strong className="text-[#173B6C]">RENTAQ</strong> · Encrypted property onboarding</p>
      </footer>
    </div>
  );
}
