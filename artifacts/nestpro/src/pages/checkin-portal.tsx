import React, { useState } from 'react';
import { useRoute } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Home, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';
import { motion } from 'framer-motion';

export default function CheckinPortalPage() {
  const [, params] = useRoute('/checkin/:token');
  const token = params?.token || '';

  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    aadhaar: '',
    occupation: '',
    hometown: '',
    emergencyContact: '',
    emergencyPhone: '',
    checkInDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const { data: tokenData, isLoading, error } = useQuery({
    queryKey: ['checkin-token', token],
    queryFn: () => api.getCheckinToken(token),
    retry: false,
  });

  const submitMutation = useMutation({
    mutationFn: (data: any) => api.submitCheckin(token, data),
    onSuccess: () => setSubmitted(true),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0f1e] text-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (error || !tokenData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0f1e] p-4">
        <Card className="max-w-md w-full border-red-500/30">
          <CardContent className="p-8 text-center space-y-3">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto" />
            <h2 className="text-xl font-bold text-foreground">Invalid or Expired Link</h2>
            <p className="text-sm text-muted-foreground">
              {(error as any)?.message || 'This check-in link is no longer active. Please request a new link from your PG/hostel operator.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0f1e] p-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full">
          <Card className="border-emerald-500/30 text-center">
            <CardContent className="p-8 space-y-4">
              <div className="h-16 w-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Registration Submitted!</h2>
              <p className="text-sm text-muted-foreground">
                Thank you for completing your check-in details for <strong className="text-foreground">{tokenData.propertyName}</strong>. The operator will review and confirm your check-in shortly.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] py-12 px-4 flex justify-center">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-xl mb-3">
            <Home className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">{tokenData.propertyName}</h1>
          <p className="text-sm text-muted-foreground mt-1">Guest Self Check-In Form</p>
        </div>

        <Card className="shadow-2xl border-indigo-500/20">
          <CardHeader>
            <CardTitle className="text-lg">Enter Your Details</CardTitle>
            <CardDescription>Please provide accurate information for verification and record keeping</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitMutation.mutate(form);
              }}
              className="space-y-4"
            >
              <div>
                <Label>Full Name *</Label>
                <Input className="mt-1" required value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Rahul Sharma" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Phone Number *</Label>
                  <Input className="mt-1" required value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+91 98765 43210" />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input className="mt-1" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="rahul@example.com" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Aadhaar Number</Label>
                  <Input className="mt-1" value={form.aadhaar} onChange={(e) => set('aadhaar', e.target.value)} placeholder="1234 5678 9012" />
                </div>
                <div>
                  <Label>Occupation</Label>
                  <Input className="mt-1" value={form.occupation} onChange={(e) => set('occupation', e.target.value)} placeholder="Software Engineer / Student" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Hometown / Permanent Address</Label>
                  <Input className="mt-1" value={form.hometown} onChange={(e) => set('hometown', e.target.value)} placeholder="Jaipur, Rajasthan" />
                </div>
                <div>
                  <Label>Intended Check-In Date</Label>
                  <Input className="mt-1" type="date" value={form.checkInDate} onChange={(e) => set('checkInDate', e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border/50 pt-4">
                <div>
                  <Label>Emergency Contact Name</Label>
                  <Input className="mt-1" value={form.emergencyContact} onChange={(e) => set('emergencyContact', e.target.value)} placeholder="Father / Mother / Guardian" />
                </div>
                <div>
                  <Label>Emergency Contact Phone</Label>
                  <Input className="mt-1" value={form.emergencyPhone} onChange={(e) => set('emergencyPhone', e.target.value)} placeholder="+91 98765 00000" />
                </div>
              </div>

              <div>
                <Label>Additional Notes or Preferences</Label>
                <Textarea className="mt-1" value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Special dietary preferences, room preferences, etc." />
              </div>

              {submitMutation.isError && (
                <p className="text-xs text-red-400 font-medium">
                  {(submitMutation.error as any)?.message || 'Failed to submit. Please try again.'}
                </p>
              )}

              <Button type="submit" className="w-full mt-4" disabled={submitMutation.isPending || !form.name || !form.phone}>
                {submitMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Submitting...</> : 'Submit Registration'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
