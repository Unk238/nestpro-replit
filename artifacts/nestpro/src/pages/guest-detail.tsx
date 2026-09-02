import React, { useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, User, Phone, Mail, MapPin, ShieldCheck,
  CreditCard, Plus, LogOut, CheckCircle2, AlertCircle, Clock
} from 'lucide-react';
import { Layout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function GuestDetailPage() {
  const [, params] = useRoute('/guests/:id');
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const guestId = parseInt(params?.id || '1', 10);

  const [showRecordPayment, setShowRecordPayment] = useState(false);
  const [payAmount, setPayAmount] = useState('8500');
  const [payMonth, setPayMonth] = useState(new Date().getMonth() + 1);
  const [payYear, setPayYear] = useState(new Date().getFullYear());
  const [payMethod, setPayMethod] = useState('upi');

  const { data: guest, isLoading: guestLoading } = useQuery({
    queryKey: ['guest', guestId],
    queryFn: () => api.getGuest(guestId),
  });

  const { data: payments = [], isLoading: payLoading } = useQuery({
    queryKey: ['payments', { guestId }],
    queryFn: () => api.getPayments({ guestId }),
  });

  const checkoutMutation = useMutation({
    mutationFn: () => api.checkoutGuest(guestId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['guest', guestId] });
      qc.invalidateQueries({ queryKey: ['guests'] });
      toast({ title: 'Resident checked out', description: 'Bed allotment released to available.', variant: 'success' });
    },
  });

  const recordPaymentMutation = useMutation({
    mutationFn: (data: any) => api.createPayment(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payments', { guestId }] });
      setShowRecordPayment(false);
      toast({ title: 'Payment recorded & receipt issued!', variant: 'success' });
    },
  });

  if (guestLoading) {
    return (
      <Layout title="Resident Profile">
        <Skeleton className="h-64 w-full rounded-xl" />
      </Layout>
    );
  }

  if (!guest) {
    return (
      <Layout title="Resident Profile">
        <Card className="p-8 text-center">
          <p className="text-sm font-bold text-[#172033]">Resident not found</p>
          <Button onClick={() => navigate('/guests')} className="btn-primary mt-4 text-xs font-bold">
            Back to Resident List
          </Button>
        </Card>
      </Layout>
    );
  }

  const isActive = guest.status === 'active';

  return (
    <Layout title={`${guest.name} — Profile & Ledger`}>
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => navigate('/guests')} className="text-xs">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Residents
        </Button>
        {isActive && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => { if (confirm(`Confirm checkout for ${guest.name}?`)) checkoutMutation.mutate(); }}
            className="text-[#D64545] hover:bg-[#FFEBEE] hover:border-[#FFCDD2] text-xs font-bold"
          >
            <LogOut className="h-4 w-4 mr-1.5" /> Process Check-Out
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-4">
          <CardHeader className="border-b border-[#E5EAF1] pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-full bg-[#EFF5FF] text-[#2F6FED] flex items-center justify-center font-bold text-sm">
                  {guest.name?.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-[#172033]">{guest.name}</CardTitle>
                  <p className="text-xs text-[#667085]">{guest.occupation || 'Resident Tenant'}</p>
                </div>
              </div>
              <Badge variant={isActive ? 'success' : 'secondary'}>
                {isActive ? 'Active' : 'Checked Out'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-4 text-xs">
            <div className="space-y-2">
              <p className="flex items-center gap-2 text-[#172033]"><Phone className="h-4 w-4 text-[#667085]" /> {guest.phone || '—'}</p>
              <p className="flex items-center gap-2 text-[#172033]"><Mail className="h-4 w-4 text-[#667085]" /> {guest.email || '—'}</p>
              <p className="flex items-center gap-2 text-[#172033]"><ShieldCheck className="h-4 w-4 text-[#667085]" /> Aadhaar: {guest.aadhaar || 'Verified'}</p>
            </div>

            <div className="pt-3 border-t border-[#E5EAF1] space-y-2">
              <div className="flex justify-between">
                <span className="text-[#667085]">Allotted Bed:</span>
                <span className="font-bold text-[#2F6FED] font-mono">{guest.bedLabel || 'Room Unit'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#667085]">Monthly Rent:</span>
                <span className="font-bold text-[#172033]">{formatCurrency(guest.monthlyRent)}/mo</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#667085]">Deposit Held:</span>
                <span className="font-bold text-[#16845B]">{formatCurrency(guest.depositAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#667085]">Check-In Date:</span>
                <span className="text-[#172033] font-medium">{formatDate(guest.checkInDate)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Ledger History */}
        <Card className="lg:col-span-8">
          <CardHeader className="flex flex-row items-center justify-between border-b border-[#E5EAF1] pb-4">
            <div>
              <CardTitle className="text-sm font-bold text-[#172033]">Rent & Payment Ledger</CardTitle>
              <CardDescription className="text-xs text-[#667085]">Record of transactions and digital receipts</CardDescription>
            </div>
            {isActive && (
              <Button size="sm" onClick={() => setShowRecordPayment(true)} className="btn-primary text-xs font-bold">
                <Plus className="h-3.5 w-3.5 mr-1" /> Record Rent Payment
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {payLoading ? (
              <div className="p-4 space-y-3">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : payments.length === 0 ? (
              <div className="p-12 text-center text-xs text-[#667085]">
                <CreditCard className="h-8 w-8 text-[#CBD5E1] mx-auto mb-2" />
                No payment entries recorded for this resident yet.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Billing Period</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment Mode</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Paid On</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-bold text-[#172033] text-xs">
                        Month {p.month} / {p.year}
                      </TableCell>
                      <TableCell className="text-xs font-black text-[#16845B]">
                        {formatCurrency(p.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] uppercase font-mono">{p.method || 'UPI'}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={p.status === 'paid' ? 'success' : 'warning'}>
                          {p.status === 'paid' ? 'Settled' : p.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-xs text-[#667085]">
                        {formatDate(p.paidAt || p.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Record Payment Dialog */}
      <Dialog open={showRecordPayment} onOpenChange={setShowRecordPayment}>
        <DialogContent className="max-w-md bg-white border-[#E5EAF1]">
          <DialogHeader><DialogTitle>Record Payment for {guest.name}</DialogTitle></DialogHeader>
          <div className="space-y-4 p-4">
            <div>
              <Label>Payment Amount (₹) *</Label>
              <Input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Billing Month</Label>
                <Input type="number" min="1" max="12" value={payMonth} onChange={(e) => setPayMonth(parseInt(e.target.value) || 1)} />
              </div>
              <div>
                <Label>Year</Label>
                <Input type="number" value={payYear} onChange={(e) => setPayYear(parseInt(e.target.value) || 2026)} />
              </div>
            </div>
          </div>
          <DialogFooter className="p-4 border-t border-[#E5EAF1]">
            <Button variant="ghost" onClick={() => setShowRecordPayment(false)}>Cancel</Button>
            <Button
              disabled={recordPaymentMutation.isPending || !payAmount}
              onClick={() => recordPaymentMutation.mutate({
                guestId,
                propertyId: guest.propertyId,
                amount: Number(payAmount),
                month: payMonth,
                year: payYear,
                method: payMethod,
                status: 'paid',
                paidAt: new Date().toISOString(),
              })}
              className="btn-primary font-bold"
            >
              Confirm & Issue Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
