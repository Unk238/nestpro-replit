import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Building2, Trash2, Pencil, Search, TrendingUp, BedDouble } from 'lucide-react';
import { Layout } from '@/components/layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';

const TYPE_LABELS: Record<string, string> = { pg: 'PG', hostel: 'Hostel', apartment: 'Apartment', villa: 'Villa', co_living: 'Co-Living' };

function PropertyForm({ initial, onSave, onCancel, loading }: any) {
  const [form, setForm] = useState(initial || { name: '', address: '', city: '', state: '', type: 'pg', description: '' });
  const set = (k: string, v: string) => setForm((f: any) => ({ ...f, [k]: v }));
  return (
    <div className="space-y-4 p-6">
      <div><Label>Name *</Label><Input className="mt-1.5" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Sunrise PG" /></div>
      <div><Label>Address</Label><Input className="mt-1.5" value={form.address} onChange={(e) => set('address', e.target.value)} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>City</Label><Input className="mt-1.5" value={form.city} onChange={(e) => set('city', e.target.value)} /></div>
        <div><Label>State</Label><Input className="mt-1.5" value={form.state} onChange={(e) => set('state', e.target.value)} /></div>
      </div>
      <div><Label>Type</Label>
        <Select value={form.type} onValueChange={(v) => set('type', v)}>
          <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div><Label>Description</Label><Input className="mt-1.5" value={form.description} onChange={(e) => set('description', e.target.value)} /></div>
      <DialogFooter>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave(form)} disabled={loading || !form.name}>{loading ? 'Saving...' : 'Save Property'}</Button>
      </DialogFooter>
    </div>
  );
}

export default function PropertiesPage() {
  const qc = useQueryClient();
  const [, navigate] = useLocation();
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const { data: properties = [], isLoading } = useQuery({ queryKey: ['properties'], queryFn: api.getProperties });

  const createMutation = useMutation({
    mutationFn: api.createProperty,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['properties'] }); setShowCreate(false); toast({ title: 'Property created!', variant: 'success' }); },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => api.updateProperty(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['properties'] }); setEditing(null); toast({ title: 'Property updated!', variant: 'success' }); },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
  const deleteMutation = useMutation({
    mutationFn: api.deleteProperty,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['properties'] }); toast({ title: 'Property deleted', variant: 'success' }); },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const filtered = (properties as any[]).filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <Layout title="Properties">
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search properties..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-2" />Add Property</Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Building2 className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <p className="text-foreground font-medium">No properties yet</p>
          <p className="text-muted-foreground text-sm mt-1">Add your first property to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((p: any, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="group hover:border-indigo-500/30 cursor-pointer transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20">
                      <Building2 className="h-5 w-5 text-indigo-400" />
                    </div>
                    <Badge variant="default">{TYPE_LABELS[p.type] ?? p.type}</Badge>
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{p.name}</h3>
                  <p className="text-xs text-muted-foreground mb-4">{[p.city, p.state].filter(Boolean).join(', ') || p.address || '—'}</p>

                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-muted-foreground flex items-center gap-1"><BedDouble className="h-3.5 w-3.5" />{p.occupiedBeds}/{p.totalBeds} occupied</span>
                    <span className="text-foreground font-medium">{p.occupancyRate}%</span>
                  </div>
                  <Progress value={p.occupancyRate} className="h-1.5 mb-4" />

                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="sm" variant="secondary" className="flex-1" onClick={() => navigate(`/properties/${p.id}/explorer`)}>
                      Explore
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditing(p)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10"
                      onClick={() => { if (confirm('Delete this property?')) deleteMutation.mutate(p.id); }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent><DialogHeader><DialogTitle>New Property</DialogTitle></DialogHeader>
          <PropertyForm onSave={(data: any) => createMutation.mutate(data)} onCancel={() => setShowCreate(false)} loading={createMutation.isPending} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent><DialogHeader><DialogTitle>Edit Property</DialogTitle></DialogHeader>
          {editing && <PropertyForm initial={editing} onSave={(data: any) => updateMutation.mutate({ id: editing.id, data })} onCancel={() => setEditing(null)} loading={updateMutation.isPending} />}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
