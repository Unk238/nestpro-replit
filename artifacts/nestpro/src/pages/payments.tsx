import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CreditCard, IndianRupee, AlertTriangle, CheckCircle, Clock, Plus, Filter } from 'lucide-react';
import { Layout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { usePropertyContext } from '@/components/property-provider';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { formatCurrency, formatDate } from '@/lib/utils';

const STATUS_BADGE: Record<string, any> = { paid: 'success', pending: 'warning', overdue: 'destructive', partial: 'secondary' };
const STATUS_ICON: Record<string, any> = { paid: CheckCircle, pending: Clock, overdue: AlertTriangle };

export default function PaymentsPage() {
  const qc = useQueryClient();
  const { activeProperty } = usePropertyContext();
  const pid = activeProperty?.id;

  const [statusFilter, setStatusFilter] = useState('all');
  const [editing, setEditing] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['payments', pid, statusFilter],
    queryFn: () => api.getPayments({ propertyId: pid, status: statusFilter === 'all' ? undefined : statusFilter }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => api.updatePayment(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['payments'] }); setEditing(null); toast({ title: 'Payment updated!', variant: 'success' }); },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const totalCollected = (payments as any[]).filter((p) => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount), 0);
  const totalOverdue = (payments as any[]).filter((p) => p.status === 'overdue').reduce((sum, p) => sum + Number(p.amount), 0);
  const totalPending = (payments as any[]).filter((p) => p.status === 'pending').reduce((sum, p) => sum + Number(p.amount), 0);

  const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <Layout title="Payments">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Collected', value: totalCollected, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Pending', value: totalPending, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Overdue', value: totalOverdue, color: 'text-red-400', bg: 'bg-red-500/10' },
        ].map(({ label, value, color, bg }) => (
          <Card key={label}>
            <CardContent className="p-5">
              <div className={`inline-flex items-center gap-2 text-sm font-medium ${color} ${bg} px-2.5 py-1 rounded-lg mb-2`}>
                <IndianRupee className="h-3.5 w-3.5" />{label}
              </div>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(value)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3 mb-4">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground ml-auto">{payments.length} records</span>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? <div className="p-6 space-y-3">{Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-12" />)}</div> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Guest</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Paid At</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {(payments as any[]).map((p) => {
                  const Icon = STATUS_ICON[p.status];
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium text-foreground">{p.guestName}</TableCell>
                      <TableCell className="text-muted-foreground">{MONTH_NAMES[p.month - 1]} {p.year}</TableCell>
                      <TableCell className="font-semibold text-foreground">{formatCurrency(p.amount)}</TableCell>
                      <TableCell className="text-muted-foreground capitalize">{p.method ?? '—'}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_BADGE[p.status] ?? 'ghost'} className="gap-1">
                          {Icon && <Icon className="h-3 w-3" />}{p.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{p.paidAt ? formatDate(p.paidAt) : '—'}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" onClick={() => { setEditing(p); setEditForm({ status: p.status, method: p.method, upiRef: p.upiRef ?? '', notes: p.notes ?? '' }); }}>Edit</Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {payments.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">No payments found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Update Payment</DialogTitle></DialogHeader>
          <div className="space-y-4 p-6">
            <div><Label>Status</Label>
              <Select value={editForm.status} onValueChange={(v) => setEditForm((f: any) => ({ ...f, status: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="paid">Paid</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="overdue">Overdue</SelectItem><SelectItem value="partial">Partial</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>Method</Label>
              <Select value={editForm.method ?? 'upi'} onValueChange={(v) => setEditForm((f: any) => ({ ...f, method: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="cash">Cash</SelectItem><SelectItem value="upi">UPI</SelectItem><SelectItem value="bank_transfer">Bank Transfer</SelectItem><SelectItem value="cheque">Cheque</SelectItem></SelectContent>
              </Select>
            </div>
            {editForm.method === 'upi' && <div><Label>UPI Ref</Label><Input className="mt-1" value={editForm.upiRef} onChange={(e) => setEditForm((f: any) => ({ ...f, upiRef: e.target.value }))} /></div>}
            <div><Label>Notes</Label><Input className="mt-1" value={editForm.notes} onChange={(e) => setEditForm((f: any) => ({ ...f, notes: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button disabled={updateMutation.isPending} onClick={() => updateMutation.mutate({ id: editing.id, data: editForm })}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
