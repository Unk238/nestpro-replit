import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, UserCog, Phone, Mail, Trash2, Pencil } from 'lucide-react';
import { Layout } from '@/components/layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { getInitials } from '@/lib/utils';

const ROLE_COLORS: Record<string, any> = { owner: 'default', manager: 'warning', operator: 'ghost' };

function StaffForm({ initial, onSave, onCancel, loading }: any) {
  const [form, setForm] = useState(initial || { name: '', phone: '', email: '', role: 'operator' });
  const set = (k: string, v: string) => setForm((f: any) => ({ ...f, [k]: v }));
  return (
    <div className="space-y-4 p-6">
      <div><Label>Name *</Label><Input className="mt-1.5" value={form.name} onChange={(e) => set('name', e.target.value)} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Phone</Label><Input className="mt-1.5" value={form.phone} onChange={(e) => set('phone', e.target.value)} /></div>
        <div><Label>Email</Label><Input className="mt-1.5" value={form.email} onChange={(e) => set('email', e.target.value)} /></div>
      </div>
      <div><Label>Role</Label>
        <Select value={form.role} onValueChange={(v) => set('role', v)}>
          <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="owner">Owner</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
            <SelectItem value="operator">Operator</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button disabled={loading || !form.name} onClick={() => onSave(form)}>{loading ? 'Saving...' : 'Save Staff'}</Button>
      </DialogFooter>
    </div>
  );
}

export default function StaffPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const { data: staffList = [], isLoading } = useQuery({ queryKey: ['staff'], queryFn: api.getStaff });

  const createMutation = useMutation({
    mutationFn: api.createStaff,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['staff'] }); setShowCreate(false); toast({ title: 'Staff added!', variant: 'success' }); },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => api.updateStaff(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['staff'] }); setEditing(null); toast({ title: 'Updated!', variant: 'success' }); },
  });
  const deleteMutation = useMutation({
    mutationFn: api.deleteStaff,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['staff'] }); toast({ title: 'Staff deactivated', variant: 'success' }); },
  });

  const active = (staffList as any[]).filter((s) => s.isActive);
  const inactive = (staffList as any[]).filter((s) => !s.isActive);

  return (
    <Layout title="Staff">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-muted-foreground">{active.length} active team members</p>
        <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-2" />Add Staff</Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">{Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)}</div>
      ) : active.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <UserCog className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <p className="text-foreground font-medium">No staff yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {active.map((s: any) => (
            <Card key={s.id} className="group hover:border-indigo-500/30 transition-all">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10"><AvatarFallback>{getInitials(s.name)}</AvatarFallback></Avatar>
                    <div>
                      <p className="font-semibold text-foreground">{s.name}</p>
                      <Badge variant={ROLE_COLORS[s.role] ?? 'ghost'} className="text-[10px] mt-0.5">{s.role}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditing(s)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:bg-destructive/10"
                      onClick={() => { if (confirm('Deactivate?')) deleteMutation.mutate(s.id); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  {s.phone && <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" />{s.phone}</p>}
                  {s.email && <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" />{s.email}</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent><DialogHeader><DialogTitle>Add Staff Member</DialogTitle></DialogHeader>
          <StaffForm onSave={(data: any) => createMutation.mutate(data)} onCancel={() => setShowCreate(false)} loading={createMutation.isPending} />
        </DialogContent>
      </Dialog>
      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent><DialogHeader><DialogTitle>Edit Staff</DialogTitle></DialogHeader>
          {editing && <StaffForm initial={editing} onSave={(data: any) => updateMutation.mutate({ id: editing.id, data })} onCancel={() => setEditing(null)} loading={updateMutation.isPending} />}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
