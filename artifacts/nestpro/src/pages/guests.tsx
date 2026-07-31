import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Users, QrCode, LogOut, Pencil, Phone, Mail, BedDouble, Loader2 } from 'lucide-react';
import { useLocation } from 'wouter';
import { Layout } from '@/components/layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { usePropertyContext } from '@/components/property-provider';
import { toast } from '@/hooks/use-toast';
import { formatCurrency, formatDate, getInitials } from '@/lib/utils';
import { motion } from 'framer-motion';

function GuestForm({ initial, propertyId, onSave, onCancel, loading }: any) {
  const { data: beds = [] } = useQuery({ queryKey: ['property-beds', propertyId], queryFn: () => api.getPropertyBeds(propertyId), enabled: !!propertyId });
  const availableBeds = beds.filter((b: any) => b.status === 'available');
  const [form, setForm] = useState(initial || { name: '', phone: '', email: '', aadhaar: '', occupation: '', hometown: '', emergencyContact: '', emergencyPhone: '', bedId: '', checkInDate: new Date().toISOString().split('T')[0], monthlyRent: '', depositAmount: '', notes: '' });
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-3 p-6 max-h-[70vh] overflow-y-auto">
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Full Name *</Label><Input className="mt-1" value={form.name} onChange={(e) => set('name', e.target.value)} /></div>
        <div><Label>Phone</Label><Input className="mt-1" value={form.phone} onChange={(e) => set('phone', e.target.value)} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Email</Label><Input className="mt-1" value={form.email} onChange={(e) => set('email', e.target.value)} /></div>
        <div><Label>Aadhaar</Label><Input className="mt-1" value={form.aadhaar} onChange={(e) => set('aadhaar', e.target.value)} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Occupation</Label><Input className="mt-1" value={form.occupation} onChange={(e) => set('occupation', e.target.value)} /></div>
        <div><Label>Hometown</Label><Input className="mt-1" value={form.hometown} onChange={(e) => set('hometown', e.target.value)} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Emergency Contact</Label><Input className="mt-1" value={form.emergencyContact} onChange={(e) => set('emergencyContact', e.target.value)} /></div>
        <div><Label>Emergency Phone</Label><Input className="mt-1" value={form.emergencyPhone} onChange={(e) => set('emergencyPhone', e.target.value)} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Monthly Rent (₹)</Label><Input className="mt-1" type="number" value={form.monthlyRent} onChange={(e) => set('monthlyRent', e.target.value)} /></div>
        <div><Label>Deposit (₹)</Label><Input className="mt-1" type="number" value={form.depositAmount} onChange={(e) => set('depositAmount', e.target.value)} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Check-In Date</Label><Input className="mt-1" type="date" value={form.checkInDate} onChange={(e) => set('checkInDate', e.target.value)} /></div>
        <div><Label>Assign Bed</Label>
          <Select value={String(form.bedId ?? '')} onValueChange={(v) => { set('bedId', v ? parseInt(v) : null); const bed = beds.find((b: any) => b.id === parseInt(v)); if (bed && !form.monthlyRent) set('monthlyRent', String(bed.monthlyRent)); }}>
            <SelectTrigger className="mt-1"><SelectValue placeholder="Select bed" /></SelectTrigger>
            <SelectContent>
              {availableBeds.map((b: any) => <SelectItem key={b.id} value={String(b.id)}>{b.buildingName} › {b.floorName} › {b.roomName} › {b.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div><Label>Notes</Label><Input className="mt-1" value={form.notes} onChange={(e) => set('notes', e.target.value)} /></div>
      <DialogFooter>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button disabled={loading || !form.name} onClick={() => onSave({ ...form, propertyId })}>{loading ? 'Saving...' : 'Save Guest'}</Button>
      </DialogFooter>
    </div>
  );
}

export default function GuestsPage() {
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const { activeProperty } = usePropertyContext();
  const pid = activeProperty?.id;

  const [tab, setTab] = useState<'active' | 'checked_out'>('active');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [genLoading, setGenLoading] = useState(false);

  const { data: guests = [], isLoading } = useQuery({
    queryKey: ['guests', pid, tab],
    queryFn: () => api.getGuests({ propertyId: pid, status: tab }),
  });

  const createMutation = useMutation({
    mutationFn: api.createGuest,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['guests'] }); setShowCreate(false); toast({ title: 'Guest checked in!', variant: 'success' }); },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const checkoutMutation = useMutation({
    mutationFn: api.checkoutGuest,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['guests'] }); toast({ title: 'Guest checked out', variant: 'success' }); },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const filtered = (guests as any[]).filter((g) =>
    [g.name, g.phone, g.email].some((s) => s?.toLowerCase().includes(search.toLowerCase()))
  );

  const handleGenerateLink = async () => {
    if (!pid) return;
    setGenLoading(true);
    try {
      const result = await api.generateCheckinToken({ propertyId: pid });
      setGeneratedLink(result.url);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
    setGenLoading(false);
  };

  return (
    <Layout title="Guests">
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search guests..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button variant="outline" onClick={() => setShowQR(true)}><QrCode className="h-4 w-4 mr-2" />Self Check-In Link</Button>
        <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-2" />Add Guest</Button>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList className="mb-4">
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="checked_out">Checked Out</TabsTrigger>
        </TabsList>

        <TabsContent value={tab}>
          {isLoading ? (
            <div className="space-y-2">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Users className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <p className="text-foreground font-medium">No guests found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((g: any, i) => (
                <motion.div key={g.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                  <Card className="hover:border-indigo-500/30 transition-all cursor-pointer" onClick={() => navigate(`/guests/${g.id}`)}>
                    <CardContent className="flex items-center gap-4 p-4">
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarFallback>{getInitials(g.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground">{g.name}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                          {g.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{g.phone}</span>}
                          {g.bedLabel && <span className="flex items-center gap-1"><BedDouble className="h-3 w-3" />{g.bedLabel}</span>}
                          <span>Since {formatDate(g.checkInDate)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-right hidden sm:block">
                          <p className="text-sm font-semibold text-foreground">{formatCurrency(g.monthlyRent)}</p>
                          <p className="text-xs text-muted-foreground">/month</p>
                        </div>
                        <Badge variant={g.status === 'active' ? 'success' : 'ghost'}>{g.status === 'active' ? 'Active' : 'Checked Out'}</Badge>
                        {g.status === 'active' && (
                          <Button size="sm" variant="outline" className="text-muted-foreground"
                            onClick={(e) => { e.stopPropagation(); if (confirm(`Check out ${g.name}?`)) checkoutMutation.mutate(g.id); }}>
                            {checkoutMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-xl"><DialogHeader><DialogTitle>New Guest Check-In</DialogTitle></DialogHeader>
          <GuestForm propertyId={pid} onSave={(data: any) => createMutation.mutate(data)} onCancel={() => setShowCreate(false)} loading={createMutation.isPending} />
        </DialogContent>
      </Dialog>

      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogContent>
          <DialogHeader><DialogTitle>Self Check-In Link</DialogTitle></DialogHeader>
          <div className="p-6 space-y-4">
            <p className="text-sm text-muted-foreground">Generate a link for guests to fill in their own details. You'll review and approve the submission.</p>
            {generatedLink ? (
              <div className="space-y-3">
                <div className="rounded-lg bg-secondary/50 border border-border p-3 text-xs font-mono break-all text-indigo-300">{generatedLink}</div>
                <Button className="w-full" variant="outline" onClick={() => { navigator.clipboard.writeText(generatedLink); toast({ title: 'Link copied!', variant: 'success' }); }}>Copy Link</Button>
              </div>
            ) : (
              <Button className="w-full" onClick={handleGenerateLink} disabled={genLoading}>
                {genLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <QrCode className="h-4 w-4 mr-2" />}Generate Link
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
