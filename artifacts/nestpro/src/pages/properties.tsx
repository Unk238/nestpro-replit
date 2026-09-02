import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Building2, Trash2, Pencil, Search, BedDouble, Globe, ExternalLink } from 'lucide-react';
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

const TYPE_LABELS: Record<string, string> = {
  pg: 'Paying Guest (PG)',
  hostel: 'Hostel',
  hotel: 'Hotel / Lodge',
  villa: 'Villa / Homestay',
  apartment: 'Serviced Apartment',
  kothi: 'House / Kothi',
  shop: 'Commercial Shop',
  office: 'Office / Desk',
  library: 'Study Library',
  co_living: 'Co-Living Suite',
  other: 'Custom Property',
};

function PropertyForm({ initial, onSave, onCancel, loading }: any) {
  const [form, setForm] = useState(initial || {
    name: '', address: '', city: '', state: '', pincode: '', type: 'pg', description: '', contactPhone: '', contactEmail: ''
  });
  const set = (k: string, v: string) => setForm((f: any) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-4 p-5 max-h-[70vh] overflow-y-auto">
      <div>
        <Label>Property Name *</Label>
        <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Royal Orchid Co-Living" />
      </div>
      <div>
        <Label>Category</Label>
        <Select value={form.type} onValueChange={(v) => set('type', v)}>
          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-white border-[#E5EAF1]">
            {Object.entries(TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Street Address</Label>
        <Input value={form.address} onChange={(e) => set('address', e.target.value)} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div><Label>City</Label><Input value={form.city} onChange={(e) => set('city', e.target.value)} /></div>
        <div><Label>State</Label><Input value={form.state} onChange={(e) => set('state', e.target.value)} /></div>
        <div><Label>PIN Code</Label><Input value={form.pincode} onChange={(e) => set('pincode', e.target.value)} /></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div><Label>Contact Phone</Label><Input value={form.contactPhone} onChange={(e) => set('contactPhone', e.target.value)} placeholder="+91 98765 00000" /></div>
        <div><Label>Contact Email</Label><Input type="email" value={form.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} /></div>
      </div>
      <div>
        <Label>Public Description</Label>
        <Input value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Premium property with modern amenities..." />
      </div>
      <DialogFooter className="pt-4 border-t border-[#E5EAF1]">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave(form)} disabled={loading || !form.name} className="btn-primary font-bold">
          {loading ? 'Saving...' : 'Save Property'}
        </Button>
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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['properties'] }); setShowCreate(false); toast({ title: 'Property registered!', variant: 'success' }); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => api.updateProperty(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['properties'] }); setEditing(null); toast({ title: 'Property updated!', variant: 'success' }); },
  });
  const deleteMutation = useMutation({
    mutationFn: api.deleteProperty,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['properties'] }); toast({ title: 'Property removed', variant: 'success' }); },
  });

  const filtered = (properties as any[]).filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <Layout title="Properties">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#98A2B3]" />
          <Input className="pl-10" placeholder="Search properties..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button onClick={() => setShowCreate(true)} className="btn-primary font-bold">
          <Plus className="h-4 w-4 mr-1.5" /> Add Property
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-56 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-16">
          <CardContent>
            <Building2 className="h-12 w-12 text-[#CBD5E1] mx-auto mb-3" />
            <p className="text-base font-bold text-[#172033]">No properties registered yet</p>
            <p className="text-xs text-[#667085] mt-1 max-w-sm mx-auto">
              Add your first PG, hostel, hotel, flat, or commercial space to manage rooms, bookings, and tenants.
            </p>
            <Button onClick={() => setShowCreate(true)} className="btn-primary mt-4 text-xs font-bold">
              <Plus className="h-4 w-4 mr-1.5" /> Add First Property
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((p: any, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="hover:border-[#CBD5E1] transition-all flex flex-col justify-between">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EFF5FF] text-[#2F6FED]">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <Badge variant="default" className="text-[10px] capitalize">
                      {TYPE_LABELS[p.type] || p.type}
                    </Badge>
                  </div>

                  <h3 className="font-bold text-[#172033] text-base mb-1 truncate">{p.name}</h3>
                  <p className="text-xs text-[#667085] mb-4 truncate">{[p.city, p.state].filter(Boolean).join(', ') || p.address || '—'}</p>

                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-[#667085] flex items-center gap-1.5 font-medium">
                      <BedDouble className="h-4 w-4 text-[#2F6FED]" /> {p.occupiedBeds}/{p.totalBeds} Units Occupied
                    </span>
                    <span className="text-[#172033] font-black">{p.occupancyRate}%</span>
                  </div>
                  <Progress value={p.occupancyRate} className="h-2 mb-4 bg-[#EEF2F6]" />

                  {/* Public Storefront Link Button */}
                  {p.websiteSlug && (
                    <a
                      href={`/p/${p.websiteSlug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mb-4 flex items-center justify-center gap-1 text-[11px] font-bold text-[#2F6FED] bg-[#EFF5FF] border border-[#D6E4FF] py-1.5 px-3 rounded-lg hover:bg-[#E4ECF7] transition-colors"
                    >
                      <Globe className="h-3 w-3" /> View Public Website <ExternalLink className="h-3 w-3 ml-0.5" />
                    </a>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" className="flex-1 text-xs font-bold" onClick={() => navigate(`/properties/${p.id}/explorer`)}>
                      Explore Units
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditing(p)}>
                      <Pencil className="h-3.5 w-3.5 text-[#667085]" />
                    </Button>
                    <Button size="sm" variant="outline" className="text-[#D64545] hover:bg-[#FFEBEE] hover:border-[#FFCDD2]"
                      onClick={() => { if (confirm(`Delete property ${p.name}?`)) deleteMutation.mutate(p.id); }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-xl bg-white border-[#E5EAF1]">
          <DialogHeader><DialogTitle>Register New Property</DialogTitle></DialogHeader>
          <PropertyForm onSave={(data: any) => createMutation.mutate(data)} onCancel={() => setShowCreate(false)} loading={createMutation.isPending} />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className="max-w-xl bg-white border-[#E5EAF1]">
          <DialogHeader><DialogTitle>Edit Property</DialogTitle></DialogHeader>
          {editing && <PropertyForm initial={editing} onSave={(data: any) => updateMutation.mutate({ id: editing.id, data })} onCancel={() => setEditing(null)} loading={updateMutation.isPending} />}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
