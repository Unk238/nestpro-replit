import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, AlertTriangle, CheckCircle2, Loader2, ChevronDown } from 'lucide-react';
import { Layout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { usePropertyContext } from '@/components/property-provider';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { formatRelativeTime, cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const STATUSES = ['pending', 'assigned', 'in_progress', 'resolved', 'closed'];
const PRIORITY_COLORS: Record<string, string> = { low: 'ghost', medium: 'default', high: 'warning', urgent: 'destructive' };
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
  assigned: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
  in_progress: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
  resolved: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
  closed: 'bg-muted/40 border-border text-muted-foreground',
};

export default function ComplaintsPage() {
  const qc = useQueryClient();
  const { activeProperty } = usePropertyContext();
  const pid = activeProperty?.id;

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: 'other', priority: 'medium' });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const { data: complaints = [], isLoading } = useQuery({
    queryKey: ['complaints', pid],
    queryFn: () => api.getComplaints({ propertyId: pid }),
  });

  const grouped = STATUSES.reduce((acc, status) => {
    acc[status] = (complaints as any[]).filter((c) => c.status === status);
    return acc;
  }, {} as Record<string, any[]>);

  const createMutation = useMutation({
    mutationFn: (data: any) => api.createComplaint({ ...data, propertyId: pid }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['complaints', pid] }); setShowCreate(false); setForm({ title: '', description: '', category: 'other', priority: 'medium' }); toast({ title: 'Complaint created!', variant: 'success' }); },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => api.updateComplaint(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['complaints', pid] }); toast({ title: 'Updated!', variant: 'success' }); },
  });

  const STATUS_LABELS: Record<string, string> = { pending: 'Pending', assigned: 'Assigned', in_progress: 'In Progress', resolved: 'Resolved', closed: 'Closed' };

  return (
    <Layout title="Complaints">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-muted-foreground">{(complaints as any[]).length} total complaints</p>
        <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-2" />New Complaint</Button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 overflow-x-auto">
        {STATUSES.map((status) => (
          <div key={status} className="flex flex-col min-w-[200px]">
            <div className={cn('rounded-lg px-3 py-2 mb-3 border flex items-center justify-between', STATUS_COLORS[status])}>
              <span className="text-xs font-semibold">{STATUS_LABELS[status]}</span>
              <span className="text-xs font-bold">{grouped[status]?.length ?? 0}</span>
            </div>
            <div className="space-y-2">
              {grouped[status]?.map((c: any, i) => (
                <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className="group hover:border-indigo-500/30 transition-all">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-xs font-semibold text-foreground leading-snug">{c.title}</p>
                        <Badge variant={PRIORITY_COLORS[c.priority] as any} className="text-[9px] px-1 py-0 flex-shrink-0">{c.priority}</Badge>
                      </div>
                      {c.guestName && <p className="text-[10px] text-muted-foreground mb-2">{c.guestName}</p>}
                      <p className="text-[10px] text-muted-foreground mb-3">{formatRelativeTime(c.createdAt)}</p>
                      <Select value={c.status} onValueChange={(v) => updateMutation.mutate({ id: c.id, data: { status: v } })}>
                        <SelectTrigger className="h-6 text-[10px] px-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUSES.map((s) => <SelectItem key={s} value={s} className="text-xs">{STATUS_LABELS[s]}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
              {grouped[status]?.length === 0 && (
                <div className="rounded-lg border border-dashed border-border/50 p-4 text-center">
                  <p className="text-[10px] text-muted-foreground/60">Empty</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Complaint</DialogTitle></DialogHeader>
          <div className="space-y-4 p-6">
            <div><Label>Title *</Label><Input className="mt-1.5" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Wi-Fi not working in Room 201" /></div>
            <div><Label>Description</Label><Textarea className="mt-1.5" value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Details..." /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => set('category', v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['maintenance', 'cleanliness', 'noise', 'security', 'food', 'internet', 'other'].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => set('priority', v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['low', 'medium', 'high', 'urgent'].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button disabled={createMutation.isPending || !form.title} onClick={() => createMutation.mutate(form)}>
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
