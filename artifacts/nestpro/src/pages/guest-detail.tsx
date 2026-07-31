import React, { useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Phone, Mail, BedDouble, Calendar, IndianRupee, User, Plus, LogOut, Loader2 } from 'lucide-react';
import { Layout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { formatCurrency, formatDate, getInitials } from '@/lib/utils';

export default function GuestDetailPage() {
  const [, params] = useRoute('/guests/:id');
  const [, navigate] = useLocation();
  const guestId = parseInt(params?.id ?? '0');
  const qc = useQueryClient();

  const [showPayment, setShowPayment] = useState(false);
  const [payForm, setPayForm] = useState<any>({ amount: '', month: new Date().getMonth() + 1, year: new Date().getFullYear(), status: 'paid', method: 'upi', upiRef: '', notes: '' });

  const { data: guest, isLoading } = useQuery({ queryKey: ['guest', guestId], queryFn: () => api.getGuest(guestId) });
  const { data: payments = [] } = useQuery({ queryKey: ['payments', 'guest', guestId], queryFn: () => api.getPayments({ guestId }) });

  const checkoutMutation = useMutation({
    mutationFn: () => api.checkoutGuest(guestId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['guest', guestId] }); qc.invalidateQueries({ queryKey: ['guests'] }); toast({ title: 'Checked out', variant: 'success' }); navigate('/guests'); },
  });

  const paymentMutation = useMutation({
    mutationFn: (data: any) => api.createPayment({ ...data, guestId, propertyId: guest?.propertyId }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['payments', 'guest', guestId] }); setShowPayment(false); toast({ title: 'Payment recorded!', variant: 'success' }); },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const statusColor: Record<string, string> = { paid: 'success', pending: 'warning', overdue: 'destructive', partial: 'secondary' };

  if (isLoading) return <Layout title="Guest"><div className="space-y-4">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-32" />)}</div></Layout>;

  return (
    <Layout title={guest?.name ?? 'Guest'}>
      <div className="mb-4 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/guests')}><ArrowLeft className="h-4 w-4 mr-1" />Back</Button>
        {guest?.status === 'active' && (
          <Button variant="outline" size="sm" className="ml-auto text-destructive hover:bg-destructive/10"
            onClick={() => { if (confirm('Check out this guest?')) checkoutMutation.mutate(); }}>
            {checkoutMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <LogOut className="h-4 w-4 mr-2" />}Check Out
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Profile */}
        <Card className="xl:col-span-1">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center mb-6">
              <Avatar className="h-16 w-16 mb-3">
                <AvatarFallback className="text-xl">{getInitials(guest?.name ?? 'G')}</AvatarFallback>
              </Avatar>
              <h2 className="text-lg font-semibold text-foreground">{guest?.name}</h2>
              <Badge className="mt-1" variant={guest?.status === 'active' ? 'success' : 'ghost'}>{guest?.status === 'active' ? 'Active' : 'Checked Out'}</Badge>
            </div>
            <div className="space-y-3 text-sm">
              {[
                { icon: Phone, label: 'Phone', value: guest?.phone },
                { icon: Mail, label: 'Email', value: guest?.email },
                { icon: BedDouble, label: 'Bed', value: guest?.bedLabel },
                { icon: Calendar, label: 'Check In', value: formatDate(guest?.checkInDate) },
                { icon: Calendar, label: 'Check Out', value: formatDate(guest?.checkOutDate) },
                { icon: IndianRupee, label: 'Monthly Rent', value: formatCurrency(guest?.monthlyRent) },
                { icon: IndianRupee, label: 'Deposit', value: formatCurrency(guest?.depositAmount) },
                { icon: User, label: 'Occupation', value: guest?.occupation },
                { icon: User, label: 'Hometown', value: guest?.hometown },
              ].filter((r) => r.value && r.value !== '—').map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="font-medium text-foreground">{value}</p>
                  </div>
                </div>
              ))}
            </div>
            {guest?.notes && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground mb-1">Notes</p>
                <p className="text-sm text-foreground">{guest.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payments */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Payment History</CardTitle>
              {guest?.status === 'active' && <Button size="sm" onClick={() => setShowPayment(true)}><Plus className="h-4 w-4 mr-1" />Record Payment</Button>}
            </div>
          </CardHeader>
          <CardContent>
            {(payments as any[]).length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">No payments yet</div>
            ) : (
              <div className="space-y-2">
                {(payments as any[]).map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
                    <div>
                      <p className="font-medium text-foreground text-sm">{MONTH_NAMES[p.month - 1]} {p.year}</p>
                      <p className="text-xs text-muted-foreground">{p.method ?? '—'}{p.upiRef ? ` · ${p.upiRef}` : ''}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">{formatCurrency(p.amount)}</p>
                      <Badge variant={(statusColor[p.status] as any) ?? 'ghost'} className="text-[10px] px-1.5 py-0">{p.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
          <div className="space-y-4 p-6">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Amount (₹) *</Label><Input className="mt-1" type="number" value={payForm.amount} onChange={(e) => setPayForm((f: any) => ({ ...f, amount: e.target.value }))} placeholder={String(guest?.monthlyRent ?? 0)} /></div>
              <div><Label>Month</Label>
                <Select value={String(payForm.month)} onValueChange={(v) => setPayForm((f: any) => ({ ...f, month: parseInt(v) }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{MONTH_NAMES.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Status</Label>
                <Select value={payForm.status} onValueChange={(v) => setPayForm((f: any) => ({ ...f, status: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="paid">Paid</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="overdue">Overdue</SelectItem><SelectItem value="partial">Partial</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Method</Label>
                <Select value={payForm.method ?? 'upi'} onValueChange={(v) => setPayForm((f: any) => ({ ...f, method: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="cash">Cash</SelectItem><SelectItem value="upi">UPI</SelectItem><SelectItem value="bank_transfer">Bank Transfer</SelectItem><SelectItem value="cheque">Cheque</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            {payForm.method === 'upi' && <div><Label>UPI Ref</Label><Input className="mt-1" value={payForm.upiRef} onChange={(e) => setPayForm((f: any) => ({ ...f, upiRef: e.target.value }))} /></div>}
            <div><Label>Notes</Label><Input className="mt-1" value={payForm.notes} onChange={(e) => setPayForm((f: any) => ({ ...f, notes: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowPayment(false)}>Cancel</Button>
            <Button disabled={paymentMutation.isPending || !payForm.amount} onClick={() => paymentMutation.mutate(payForm)}>
              {paymentMutation.isPending ? 'Saving...' : 'Record Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
