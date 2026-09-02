import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CreditCard, Plus, IndianRupee, Filter,
  CheckCircle2, Clock, AlertCircle, Search, Download
} from 'lucide-react';
import { Layout } from '@/components/layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { usePropertyContext } from '@/components/property-provider';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function PaymentsPage() {
  const qc = useQueryClient();
  const { activeProperty } = usePropertyContext();
  const pid = activeProperty?.id;

  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddPayment, setShowAddPayment] = useState(false);

  const [payForm, setPayForm] = useState({
    guestId: '',
    amount: '8500',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    method: 'upi',
    status: 'paid',
    notes: '',
  });

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['payments', pid, statusFilter],
    queryFn: () => api.getPayments({ propertyId: pid, status: statusFilter === 'all' ? undefined : statusFilter }),
  });

  const { data: guests = [] } = useQuery({
    queryKey: ['guests', pid],
    queryFn: () => api.getGuests({ propertyId: pid, status: 'active' }),
  });

  const createPaymentMutation = useMutation({
    mutationFn: (data: any) => api.createPayment({ ...data, propertyId: pid, paidAt: new Date().toISOString() }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payments'] });
      setShowAddPayment(false);
      toast({ title: 'Payment recorded & ledger updated!', variant: 'success' });
    },
  });

  const totalCollected = payments.filter((p: any) => p.status === 'paid').reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
  const totalPending = payments.filter((p: any) => p.status !== 'paid').reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);

  return (
    <Layout title="Payments & Financial Ledger">
      {/* Top Financial Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-[#E8F5E9] text-[#16845B] inline-flex items-center gap-1 mb-2">
              <CheckCircle2 className="h-3.5 w-3.5" /> Total Collected
            </span>
            <p className="text-2xl font-black text-[#172033]">{formatCurrency(totalCollected)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-[#FFF8E1] text-[#D98A00] inline-flex items-center gap-1 mb-2">
              <Clock className="h-3.5 w-3.5" /> Pending Receivables
            </span>
            <p className="text-2xl font-black text-[#D98A00]">{formatCurrency(totalPending)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-[#EFF5FF] text-[#2F6FED] inline-flex items-center gap-1 mb-2">
              <CreditCard className="h-3.5 w-3.5" /> Total Transactions
            </span>
            <p className="text-2xl font-black text-[#172033]">{payments.length} entries</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Filter className="h-4 w-4 text-[#667085]" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-white border-[#E5EAF1]">
              <SelectItem value="all">All Payments</SelectItem>
              <SelectItem value="paid">Paid & Settled</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={() => setShowAddPayment(true)} disabled={guests.length === 0} className="btn-primary font-bold">
          <Plus className="h-4 w-4 mr-1.5" /> Record Payment
        </Button>
      </div>

      {/* Payments Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : payments.length === 0 ? (
            <div className="text-center py-16">
              <CreditCard className="h-12 w-12 text-[#CBD5E1] mx-auto mb-3" />
              <p className="text-[#172033] font-bold">No payments recorded</p>
              <p className="text-xs text-[#667085] mt-1">Recorded rent settlements and receipts will show here.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Resident</TableHead>
                  <TableHead>Billing Period</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment Mode</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Transaction Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <p className="font-bold text-[#172033] text-sm">{p.guestName || `Resident #${p.guestId}`}</p>
                    </TableCell>
                    <TableCell className="text-xs text-[#667085]">
                      Month {p.month} / {p.year}
                    </TableCell>
                    <TableCell className="text-xs font-black text-[#16845B]">
                      {formatCurrency(p.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] uppercase font-mono">{p.method || 'UPI'}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.status === 'paid' ? 'success' : p.status === 'overdue' ? 'destructive' : 'warning'}>
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

      {/* Record Payment Dialog */}
      <Dialog open={showAddPayment} onOpenChange={setShowAddPayment}>
        <DialogContent className="max-w-md bg-white border-[#E5EAF1]">
          <DialogHeader><DialogTitle>Record Payment Entry</DialogTitle></DialogHeader>
          <div className="space-y-4 p-4">
            <div>
              <Label>Select Resident *</Label>
              <Select value={payForm.guestId} onValueChange={(v) => setPayForm({ ...payForm, guestId: v })}>
                <SelectTrigger><SelectValue placeholder="Choose resident" /></SelectTrigger>
                <SelectContent className="bg-white border-[#E5EAF1]">
                  {guests.map((g: any) => (
                    <SelectItem key={g.id} value={String(g.id)}>{g.name} ({g.bedLabel || 'Room'})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Amount Settled (₹) *</Label>
              <Input type="number" value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Billing Month</Label>
                <Input type="number" min="1" max="12" value={payForm.month} onChange={(e) => setPayForm({ ...payForm, month: parseInt(e.target.value) || 1 })} />
              </div>
              <div>
                <Label>Year</Label>
                <Input type="number" value={payForm.year} onChange={(e) => setPayForm({ ...payForm, year: parseInt(e.target.value) || 2026 })} />
              </div>
            </div>

            <div>
              <Label>Payment Mode</Label>
              <Select value={payForm.method} onValueChange={(v) => setPayForm({ ...payForm, method: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="bg-white border-[#E5EAF1]">
                  <SelectItem value="upi">UPI (Google Pay, PhonePe, Paytm)</SelectItem>
                  <SelectItem value="cash">Cash in Hand</SelectItem>
                  <SelectItem value="bank_transfer">Bank NEFT / IMPS</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="p-4 border-t border-[#E5EAF1]">
            <Button variant="ghost" onClick={() => setShowAddPayment(false)}>Cancel</Button>
            <Button disabled={createPaymentMutation.isPending || !payForm.guestId || !payForm.amount} onClick={() => createPaymentMutation.mutate(payForm)} className="btn-primary font-bold">
              Record & Save Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
