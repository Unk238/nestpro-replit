import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Building2, BedDouble, CheckCircle, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

interface Props {
  onComplete: () => void;
}

const STEPS = ['Business', 'Property', 'Structure', 'Confirm'];

export function OnboardingWizard({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [isCreating, setIsCreating] = useState(false);

  const [business, setBusiness] = useState({ name: 'My Business', phone: '', category: 'pg' });
  const [property, setProperty] = useState({ name: '', address: '', city: '', state: '', type: 'pg' });
  const [structure, setStructure] = useState({ buildings: 1, floors: 2, rooms: 4, beds: 2, rent: 8000 });

  const totalBeds = structure.buildings * structure.floors * structure.rooms * structure.beds;

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const prop = await api.createProperty({ name: property.name || 'Main Property', address: property.address, city: property.city, state: property.state, type: property.type });

      for (let b = 0; b < structure.buildings; b++) {
        const building = await api.createBuilding(prop.id, { name: `Block ${String.fromCharCode(65 + b)}`, totalFloors: structure.floors });
        for (let f = 0; f < structure.floors; f++) {
          const floor = await api.createFloor(building.id, { name: f === 0 ? 'Ground Floor' : `Floor ${f}`, floorNumber: f });
          for (let r = 0; r < structure.rooms; r++) {
            const room = await api.createRoom(floor.id, { name: `Room ${r + 1}`, type: structure.beds > 2 ? 'triple' : structure.beds > 1 ? 'double' : 'single' });
            for (let bed = 0; bed < structure.beds; bed++) {
              await api.createBed(room.id, { label: `Bed ${String.fromCharCode(65 + bed)}`, monthlyRent: structure.rent });
            }
          }
        }
      }

      localStorage.setItem('nestpro_onboarded', 'true');
      toast({ title: '🎉 Setup complete!', description: `${totalBeds} beds created across ${structure.buildings} block(s).`, variant: 'success' });
      onComplete();
    } catch (err: any) {
      toast({ title: 'Setup failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg mx-4 rounded-2xl border border-border bg-[#0f1729] shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="relative px-8 pt-8 pb-4 bg-gradient-to-br from-indigo-900/40 to-violet-900/20 border-b border-border">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 mb-4">
            <Home className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Welcome to NestPro</h2>
          <p className="text-sm text-muted-foreground mt-1">Set up your property in 4 quick steps</p>

          {/* Step indicators */}
          <div className="flex items-center gap-2 mt-4">
            {STEPS.map((s, i) => (
              <React.Fragment key={s}>
                <div className={`flex items-center gap-1.5 text-xs ${i <= step ? 'text-indigo-400' : 'text-muted-foreground'}`}>
                  <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${i < step ? 'bg-indigo-500 text-white' : i === step ? 'border-2 border-indigo-500 text-indigo-400' : 'border border-border text-muted-foreground'}`}>
                    {i < step ? <CheckCircle className="h-3 w-3" /> : i + 1}
                  </div>
                  <span className="hidden sm:block">{s}</span>
                </div>
                {i < STEPS.length - 1 && <div className={`flex-1 h-px ${i < step ? 'bg-indigo-500' : 'bg-border'}`} />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="p-8">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div><Label>Business Name *</Label><Input className="mt-1.5" value={business.name} onChange={(e) => setBusiness({ ...business, name: e.target.value })} placeholder="Sunrise PG Homes" /></div>
                <div><Label>Phone</Label><Input className="mt-1.5" value={business.phone} onChange={(e) => setBusiness({ ...business, phone: e.target.value })} placeholder="+91 98765 43210" /></div>
              </motion.div>
            )}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div><Label>Property Name *</Label><Input className="mt-1.5" value={property.name} onChange={(e) => setProperty({ ...property, name: e.target.value })} placeholder="Sunrise PG" /></div>
                <div><Label>Address</Label><Input className="mt-1.5" value={property.address} onChange={(e) => setProperty({ ...property, address: e.target.value })} placeholder="123 MG Road" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>City</Label><Input className="mt-1.5" value={property.city} onChange={(e) => setProperty({ ...property, city: e.target.value })} placeholder="Bangalore" /></div>
                  <div><Label>State</Label><Input className="mt-1.5" value={property.state} onChange={(e) => setProperty({ ...property, state: e.target.value })} placeholder="Karnataka" /></div>
                </div>
                <div><Label>Type</Label>
                  <Select value={property.type} onValueChange={(v) => setProperty({ ...property, type: v })}>
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pg">PG (Paying Guest)</SelectItem>
                      <SelectItem value="hostel">Hostel</SelectItem>
                      <SelectItem value="apartment">Apartment</SelectItem>
                      <SelectItem value="villa">Villa</SelectItem>
                      <SelectItem value="co_living">Co-Living</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </motion.div>
            )}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <p className="text-sm text-muted-foreground">Define your property structure. We'll auto-generate rooms and beds.</p>
                {[
                  { label: 'Number of Blocks/Buildings', key: 'buildings', min: 1, max: 10 },
                  { label: 'Floors per Building', key: 'floors', min: 1, max: 20 },
                  { label: 'Rooms per Floor', key: 'rooms', min: 1, max: 30 },
                  { label: 'Beds per Room', key: 'beds', min: 1, max: 10 },
                  { label: 'Monthly Rent (₹)', key: 'rent', min: 1000, max: 100000 },
                ].map(({ label, key, min, max }) => (
                  <div key={key}>
                    <Label>{label}</Label>
                    <Input className="mt-1.5" type="number" min={min} max={max} value={(structure as any)[key]}
                      onChange={(e) => setStructure({ ...structure, [key]: parseInt(e.target.value) || min })} />
                  </div>
                ))}
                <div className="rounded-lg bg-indigo-500/10 border border-indigo-500/20 p-3 text-sm text-indigo-300">
                  This will create <strong>{totalBeds} beds</strong> across {structure.buildings} building(s), {structure.buildings * structure.floors} floor(s), and {structure.buildings * structure.floors * structure.rooms} room(s).
                </div>
              </motion.div>
            )}
            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
                <p className="text-sm text-muted-foreground">Review before creating:</p>
                {[
                  ['Business', business.name],
                  ['Property', property.name || 'Main Property'],
                  ['Location', [property.city, property.state].filter(Boolean).join(', ') || '—'],
                  ['Type', property.type],
                  ['Buildings', structure.buildings],
                  ['Total Beds', totalBeds],
                  ['Monthly Rent', `₹${structure.rent.toLocaleString()}`],
                ].map(([k, v]) => (
                  <div key={String(k)} className="flex justify-between text-sm py-1.5 border-b border-border/50">
                    <span className="text-muted-foreground">{k}</span>
                    <span className="font-medium text-foreground capitalize">{String(v)}</span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-8 pb-8 pt-0">
          <Button variant="ghost" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>Back</Button>
          {step < 3
            ? <Button onClick={() => setStep(step + 1)}>Continue <ChevronRight className="h-4 w-4" /></Button>
            : <Button onClick={handleCreate} disabled={isCreating}>
                {isCreating ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Creating...</> : '🚀 Create My Property'}
              </Button>
          }
        </div>
      </motion.div>
    </div>
  );
}
