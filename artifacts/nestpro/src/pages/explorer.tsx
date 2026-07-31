import React, { useState } from 'react';
import { useRoute } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, ChevronRight, BedDouble, Building2, Layers, DoorOpen, Trash2 } from 'lucide-react';
import { Layout } from '@/components/layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { formatCurrency, cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const BED_STATUS_COLORS: Record<string, string> = {
  available: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20',
  occupied: 'bg-red-500/20 text-red-400 border-red-500/20',
  maintenance: 'bg-amber-500/20 text-amber-400 border-amber-500/20',
  reserved: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/20',
};

export default function ExplorerPage() {
  const [, params] = useRoute('/properties/:id/explorer');
  const propertyId = parseInt(params?.id ?? '0');
  const qc = useQueryClient();

  const [selectedBuilding, setSelectedBuilding] = useState<any>(null);
  const [selectedFloor, setSelectedFloor] = useState<any>(null);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);

  const [modal, setModal] = useState<{ type: 'building' | 'floor' | 'room' | 'bed'; parent?: any } | null>(null);
  const [formValues, setFormValues] = useState<Record<string, any>>({});

  const { data: property } = useQuery({ queryKey: ['property', propertyId], queryFn: () => api.getProperty(propertyId) });
  const { data: buildings = [] } = useQuery({ queryKey: ['buildings', propertyId], queryFn: () => api.getBuildings(propertyId) });
  const { data: floors = [] } = useQuery({ queryKey: ['floors', selectedBuilding?.id], queryFn: () => api.getFloors(selectedBuilding!.id), enabled: !!selectedBuilding });
  const { data: rooms = [] } = useQuery({ queryKey: ['rooms', selectedFloor?.id], queryFn: () => api.getRooms(selectedFloor!.id), enabled: !!selectedFloor });
  const { data: beds = [] } = useQuery({ queryKey: ['beds', selectedRoom?.id], queryFn: () => api.getBeds(selectedRoom!.id), enabled: !!selectedRoom });

  const createMutation = useMutation({
    mutationFn: async (data: { type: string; parent?: any; values: any }) => {
      const { type, parent, values } = data;
      if (type === 'building') return api.createBuilding(propertyId, values);
      if (type === 'floor') return api.createFloor(parent.id, values);
      if (type === 'room') return api.createRoom(parent.id, values);
      if (type === 'bed') return api.createBed(parent.id, values);
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: [vars.type + 's'] });
      if (vars.type === 'building') qc.invalidateQueries({ queryKey: ['buildings', propertyId] });
      if (vars.type === 'floor') qc.invalidateQueries({ queryKey: ['floors', selectedBuilding?.id] });
      if (vars.type === 'room') qc.invalidateQueries({ queryKey: ['rooms', selectedFloor?.id] });
      if (vars.type === 'bed') qc.invalidateQueries({ queryKey: ['beds', selectedRoom?.id] });
      setModal(null);
      toast({ title: 'Created!', variant: 'success' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ type, id }: { type: string; id: number }) => {
      if (type === 'building') return api.deleteBuilding(id);
      if (type === 'floor') return api.deleteFloor(id);
      if (type === 'room') return api.deleteRoom(id);
      if (type === 'bed') return api.deleteBed(id);
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['buildings', propertyId] });
      qc.invalidateQueries({ queryKey: ['floors', selectedBuilding?.id] });
      qc.invalidateQueries({ queryKey: ['rooms', selectedFloor?.id] });
      qc.invalidateQueries({ queryKey: ['beds', selectedRoom?.id] });
      toast({ title: 'Deleted', variant: 'success' });
    },
  });

  const renderModal = () => {
    if (!modal) return null;
    const { type, parent } = modal;

    const fields: Record<string, any[]> = {
      building: [{ key: 'name', label: 'Building Name', placeholder: 'Block A' }, { key: 'totalFloors', label: 'Total Floors', type: 'number', placeholder: '3' }],
      floor: [{ key: 'name', label: 'Floor Name', placeholder: 'Ground Floor' }, { key: 'floorNumber', label: 'Floor Number', type: 'number', placeholder: '0' }],
      room: [{ key: 'name', label: 'Room Name', placeholder: 'Room 101' }, { key: 'type', label: 'Type', select: ['single', 'double', 'triple', 'quad', 'dormitory'] }],
      bed: [{ key: 'label', label: 'Bed Label', placeholder: 'Bed A' }, { key: 'monthlyRent', label: 'Monthly Rent (₹)', type: 'number', placeholder: '8000' }, { key: 'status', label: 'Status', select: ['available', 'occupied', 'maintenance', 'reserved'] }],
    };

    return (
      <Dialog open={true} onOpenChange={() => setModal(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add {type.charAt(0).toUpperCase() + type.slice(1)}</DialogTitle></DialogHeader>
          <div className="space-y-4 p-6">
            {fields[type]?.map((f) => (
              <div key={f.key}>
                <Label>{f.label}</Label>
                {f.select ? (
                  <Select value={formValues[f.key] ?? f.select[0]} onValueChange={(v) => setFormValues((x) => ({ ...x, [f.key]: v }))}>
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>{f.select.map((s: string) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                ) : (
                  <Input className="mt-1.5" type={f.type ?? 'text'} placeholder={f.placeholder} value={formValues[f.key] ?? ''} onChange={(e) => setFormValues((x) => ({ ...x, [f.key]: e.target.value }))} />
                )}
              </div>
            ))}
          </div>
          <DialogFooter className="px-6 pb-6">
            <Button variant="ghost" onClick={() => setModal(null)}>Cancel</Button>
            <Button disabled={createMutation.isPending} onClick={() => createMutation.mutate({ type, parent, values: formValues })}>
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  const Column = ({ title, icon: Icon, items, selected, onSelect, onAdd, onDelete, renderItem }: any) => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Icon className="h-4 w-4 text-muted-foreground" />{title}
          <span className="text-xs text-muted-foreground">({items.length})</span>
        </div>
        {onAdd && <button onClick={onAdd} className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 transition-colors"><Plus className="h-3.5 w-3.5" /></button>}
      </div>
      <div className="flex-1 overflow-y-auto space-y-1 pr-1">
        {items.map((item: any) => (
          <button key={item.id} onClick={() => onSelect(item)}
            className={cn('w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-sm transition-all', selected?.id === item.id ? 'bg-indigo-500/15 border border-indigo-500/25 text-indigo-300' : 'hover:bg-secondary/60 text-muted-foreground hover:text-foreground')}>
            <span className="truncate font-medium">{renderItem ? renderItem(item) : item.name ?? item.label}</span>
            <div className="flex items-center gap-1 flex-shrink-0">
              {item.status && <span className={cn('text-[10px] px-1.5 py-0.5 rounded border', BED_STATUS_COLORS[item.status])}>{item.status}</span>}
              <button onClick={(e) => { e.stopPropagation(); if (confirm('Delete?')) onDelete(item.id); }} className="p-0.5 text-muted-foreground/40 hover:text-destructive transition-colors">
                <Trash2 className="h-3 w-3" />
              </button>
              {!item.status && <ChevronRight className="h-3 w-3 text-muted-foreground/40" />}
            </div>
          </button>
        ))}
        {items.length === 0 && <div className="text-xs text-muted-foreground text-center py-6 px-2">Nothing here yet</div>}
      </div>
    </div>
  );

  return (
    <Layout title={`Explorer — ${property?.name ?? ''}`}>
      <div className="h-[calc(100vh-10rem)] flex gap-4">
        {/* Buildings */}
        <Card className="flex-1 flex flex-col"><CardContent className="flex flex-col flex-1 p-4">
          <Column title="Buildings" icon={Building2} items={buildings} selected={selectedBuilding}
            onSelect={(b: any) => { setSelectedBuilding(b); setSelectedFloor(null); setSelectedRoom(null); }}
            onAdd={() => { setFormValues({}); setModal({ type: 'building' }); }}
            onDelete={(id: number) => deleteMutation.mutate({ type: 'building', id })} />
        </CardContent></Card>
        {/* Floors */}
        <Card className="flex-1 flex flex-col opacity-100"><CardContent className="flex flex-col flex-1 p-4">
          <Column title="Floors" icon={Layers} items={selectedBuilding ? floors : []} selected={selectedFloor}
            onSelect={(f: any) => { setSelectedFloor(f); setSelectedRoom(null); }}
            onAdd={selectedBuilding ? () => { setFormValues({}); setModal({ type: 'floor', parent: selectedBuilding }); } : undefined}
            onDelete={(id: number) => deleteMutation.mutate({ type: 'floor', id })} />
        </CardContent></Card>
        {/* Rooms */}
        <Card className="flex-1 flex flex-col"><CardContent className="flex flex-col flex-1 p-4">
          <Column title="Rooms" icon={DoorOpen} items={selectedFloor ? rooms : []} selected={selectedRoom}
            onSelect={(r: any) => setSelectedRoom(r)}
            onAdd={selectedFloor ? () => { setFormValues({}); setModal({ type: 'room', parent: selectedFloor }); } : undefined}
            onDelete={(id: number) => deleteMutation.mutate({ type: 'room', id })} />
        </CardContent></Card>
        {/* Beds */}
        <Card className="flex-1 flex flex-col"><CardContent className="flex flex-col flex-1 p-4">
          <Column title="Beds" icon={BedDouble} items={selectedRoom ? beds : []} selected={null}
            onSelect={() => {}}
            renderItem={(b: any) => <span>{b.label} · {formatCurrency(b.monthlyRent)}</span>}
            onAdd={selectedRoom ? () => { setFormValues({ status: 'available' }); setModal({ type: 'bed', parent: selectedRoom }); } : undefined}
            onDelete={(id: number) => deleteMutation.mutate({ type: 'bed', id })} />
        </CardContent></Card>
      </div>
      {renderModal()}
    </Layout>
  );
}
