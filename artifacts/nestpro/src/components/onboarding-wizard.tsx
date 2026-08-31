import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Home, BedDouble, CheckCircle2, ChevronRight,
  ChevronLeft, Sparkles, MapPin, ShieldCheck, Wifi, IndianRupee,
  Layers, Upload, RefreshCw, X, Loader2
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { LanguageSelector } from './language-selector';
import { useTranslation } from '@/lib/i18n';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

interface Props {
  onComplete: () => void;
}

const PROPERTY_TYPES = [
  { id: 'pg', name: 'Paying Guest (PG)', category: 'Residential', icon: '🏠', desc: 'Bed-by-bed accommodations with food/cleaning' },
  { id: 'hostel', name: 'Student / Working Hostel', category: 'Residential', icon: '🏢', desc: 'Dormitories and shared block rooms' },
  { id: 'hotel', name: 'Hotel / Lodge / Guest House', category: 'Hospitality', icon: '🏨', desc: 'Daily reservations and transient bookings' },
  { id: 'villa', name: 'Villa / Homestay', category: 'Hospitality', icon: '🌴', desc: 'Full-property holiday rentals and estates' },
  { id: 'apartment', name: 'Serviced Apartment', category: 'Residential', icon: '🏬', desc: 'Flats, multi-room units, and long-term stays' },
  { id: 'kothi', name: 'Independent House / Kothi', category: 'Residential', icon: '🏡', desc: 'Bungalow floors and residential suites' },
  { id: 'shop', name: 'Commercial Shop / Retail', category: 'Commercial', icon: '🛍️', desc: 'Market shops, retail spaces, and showrooms' },
  { id: 'office', name: 'Office / Co-Working', category: 'Commercial', icon: '💼', desc: 'Workspaces, private cabins, and desks' },
  { id: 'library', name: 'Library / Study Hall', category: 'Commercial', icon: '📚', desc: 'Seat-by-seat reservation and study desks' },
  { id: 'co_living', name: 'Modern Co-Living Space', category: 'Residential', icon: '✨', desc: 'Community living suites with shared amenities' },
  { id: 'other', name: 'Custom Property', category: 'Other', icon: '📍', desc: 'Multi-purpose properties and units' },
];

const ROLES = [
  { id: 'owner', label: 'Property Owner', desc: 'Full ownership and financial control' },
  { id: 'manager', label: 'Property Manager', desc: 'Manages day-to-day operations and guests' },
  { id: 'landlord', label: 'Landlord', desc: 'Property owner managing long-term rentals' },
  { id: 'operations_manager', label: 'Operations Manager', desc: 'Multi-branch supervision' },
  { id: 'receptionist', label: 'Reception / Front Desk', desc: 'Check-ins, phone calls, and bookings' },
  { id: 'staff', label: 'Staff Member', desc: 'Room maintenance and basic tasks' },
  { id: 'broker', label: 'Broker / Agent', desc: 'Manages listings and tenant onboarding' },
  { id: 'admin', label: 'System Administrator', desc: 'Full configuration access' },
];

const AMENITY_OPTIONS = [
  'High-Speed Wi-Fi', 'Air Conditioning (AC)', 'Attached Bathroom', 'Geyser / Hot Water',
  'Daily Housekeeping', '3-Time Meals / Food', 'Washing Machine / Laundry', '24x7 CCTV Security',
  'Power Backup / Inverter', 'Car / Bike Parking', 'Refrigerator', 'RO Drinking Water',
  'Lift / Elevator', 'Study Table & Chair', 'Individual Wardrobes'
];

export function OnboardingWizard({ onComplete }: Props) {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);

  // Form State
  const [profile, setProfile] = useState({
    name: '',
    phone: '',
    email: '',
    role: 'owner',
    pincode: '',
  });

  const [property, setProperty] = useState({
    type: 'pg',
    name: '',
    address: '',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '',
    contactPhone: '',
    contactEmail: '',
    description: '',
  });

  const [structure, setStructure] = useState({
    buildings: 1,
    includeGroundFloor: true,
    totalFloors: 2,
    hasBasement: false,
    roomsPerFloor: 3,
    capacityPerRoom: 2, // beds or seats
    baseRate: 7500,
    depositAmount: 10000,
  });

  const [amenities, setAmenities] = useState<string[]>([
    'High-Speed Wi-Fi', '24x7 CCTV Security', 'RO Drinking Water', 'Geyser / Hot Water'
  ]);

  const [bathroomModel, setBathroomModel] = useState<'attached' | 'shared'>('attached');

  const [policies, setPolicies] = useState({
    checkInTime: '12:00 PM',
    checkOutTime: '11:00 AM',
    ruleType: 'calendar_month', // 'calendar_month' | '24_hours' | 'daily'
    maxDiscountPercent: 10,
    rulesText: '1. No smoking inside premises\n2. Quiet hours between 10 PM and 6 AM\n3. Gate closes at 10:30 PM\n4. Visitors allowed in lobby only',
  });

  const [branding, setBranding] = useState({
    logoSample: 'gradient_indigo',
    wifiSsid: '',
    wifiPassword: '',
    upiId: '',
  });

  const toggleAmenity = (a: string) => {
    setAmenities((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
    );
  };

  const totalUnits = structure.buildings * structure.totalFloors * structure.roomsPerFloor * structure.capacityPerRoom;

  const handleFinishOnboarding = async () => {
    setIsCreating(true);
    try {
      // 1. Create Property
      const prop = await api.createProperty({
        name: property.name || 'My Primary Property',
        address: property.address,
        city: property.city,
        state: property.state,
        pincode: property.pincode,
        type: property.type,
        description: property.description,
        amenities,
        rules: policies.rulesText,
        wifiSsid: branding.wifiSsid,
        wifiPassword: branding.wifiPassword,
        upiId: branding.upiId,
        contactPhone: property.contactPhone || profile.phone,
        contactEmail: property.contactEmail || profile.email,
      });

      // 2. Build Hierarchy: Buildings -> Floors -> Rooms -> Beds
      for (let b = 0; b < structure.buildings; b++) {
        const building = await api.createBuilding(prop.id, {
          name: structure.buildings > 1 ? `Block ${String.fromCharCode(65 + b)}` : 'Main Block',
          totalFloors: structure.totalFloors,
        });

        if (structure.hasBasement) {
          const bFloor = await api.createFloor(building.id, { name: 'Basement Floor', floorNumber: -1 });
          const room = await api.createRoom(bFloor.id, { name: 'Room B01', type: 'double' });
          await api.createBed(room.id, { label: 'Bed A', monthlyRent: structure.baseRate });
          await api.createBed(room.id, { label: 'Bed B', monthlyRent: structure.baseRate });
        }

        for (let f = 0; f < structure.totalFloors; f++) {
          const floorName = f === 0 && structure.includeGroundFloor ? 'Ground Floor' : `Floor ${f}`;
          const floor = await api.createFloor(building.id, { name: floorName, floorNumber: f });

          for (let r = 0; r < structure.roomsPerFloor; r++) {
            const roomNum = (f === 0 ? 'G0' : `${f}0`) + (r + 1);
            const room = await api.createRoom(floor.id, {
              name: `Room ${roomNum}`,
              type: structure.capacityPerRoom >= 4 ? 'dormitory' : structure.capacityPerRoom === 3 ? 'triple' : structure.capacityPerRoom === 2 ? 'double' : 'single',
            });

            for (let c = 0; c < structure.capacityPerRoom; c++) {
              const bedLabel = `Bed ${String.fromCharCode(65 + c)}`;
              await api.createBed(room.id, { label: bedLabel, monthlyRent: structure.baseRate });
            }
          }
        }
      }

      // 3. Save User Profile in LocalStorage
      const workspaceId = 'RENTAQ-' + Math.floor(100000 + Math.random() * 900000);
      localStorage.setItem('rentaq_user', JSON.stringify({
        ...profile,
        workspaceId,
        onboardedAt: new Date().toISOString(),
      }));
      localStorage.setItem('rentaq_onboarded', 'true');
      localStorage.setItem('nestpro_onboarded', 'true'); // Backward compatibility
      localStorage.setItem('nestpro_user', JSON.stringify({ email: profile.email || 'admin@rentaq.in' }));

      toast({
        title: '🎉 RENTAQ Workspace Ready!',
        description: `Successfully configured ${property.name || 'Property'} with ${totalUnits} units.`,
        variant: 'success',
      });

      onComplete();
    } catch (err: any) {
      toast({ title: 'Configuration error', description: err.message, variant: 'destructive' });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050811]/90 backdrop-blur-md p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-3xl my-auto rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Wizard Header */}
        <div className="px-6 sm:px-8 py-5 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg font-extrabold gradient-text">RENTAQ</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Setup Wizard · Step {step} of 8
              </span>
            </div>
            <p className="text-xs text-slate-300">Intelligent property & business setup</p>
          </div>
          <LanguageSelector />
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 h-1.5">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 transition-all duration-300"
            style={{ width: `${(step / 8) * 100}%` }}
          />
        </div>

        {/* Wizard Content Body */}
        <div className="p-6 sm:p-8 flex-1 overflow-y-auto max-h-[65vh]">
          <AnimatePresence mode="wait">
            {/* Step 1: User Profile & Role */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                <div>
                  <h3 className="text-xl font-bold text-white">Your Profile & Business Role</h3>
                  <p className="text-xs text-slate-300 mt-1">Tell us about yourself so we can customize your workspace permissions.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Full Name *</Label>
                    <Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} placeholder="Rajesh Kumar" />
                  </div>
                  <div>
                    <Label>Mobile Number (with WhatsApp) *</Label>
                    <Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="+91 98765 43210" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Work Email</Label>
                    <Input type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} placeholder="rajesh@example.com" />
                  </div>
                  <div>
                    <Label>Your PIN Code</Label>
                    <Input value={profile.pincode} onChange={(e) => setProfile({ ...profile, pincode: e.target.value })} placeholder="560001" />
                  </div>
                </div>

                <div>
                  <Label>What best describes your role in this business?</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                    {ROLES.map((r) => (
                      <div
                        key={r.id}
                        onClick={() => setProfile({ ...profile, role: r.id })}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          profile.role === r.id
                            ? 'bg-indigo-600/25 border-indigo-500 text-white shadow-sm'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <p className="font-semibold text-sm">{r.label}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{r.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Property Category */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                <div>
                  <h3 className="text-xl font-bold text-white">Select Property Category</h3>
                  <p className="text-xs text-slate-300 mt-1">RENTAQ natively supports multiple residential, commercial, and hospitality property types.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {PROPERTY_TYPES.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setProperty({ ...property, type: t.id })}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        property.type === t.id
                          ? 'bg-indigo-600/25 border-indigo-400 text-white shadow-md shadow-indigo-500/20'
                          : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-2xl mb-2">{t.icon}</div>
                      <p className="font-bold text-sm text-slate-100">{t.name}</p>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{t.desc}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 3: Property Details & Location */}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-white">Property Details & Location</h3>
                  <p className="text-xs text-slate-300 mt-1">Enter your property address and contact details.</p>
                </div>

                <div>
                  <Label>Property Name *</Label>
                  <Input value={property.name} onChange={(e) => setProperty({ ...property, name: e.target.value })} placeholder="e.g. Royal Orchid PG / Sunset Villa" />
                </div>

                <div>
                  <Label>Complete Street Address</Label>
                  <Input value={property.address} onChange={(e) => setProperty({ ...property, address: e.target.value })} placeholder="12th Main Road, Indiranagar" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label>City</Label>
                    <Input value={property.city} onChange={(e) => setProperty({ ...property, city: e.target.value })} placeholder="Bangalore" />
                  </div>
                  <div>
                    <Label>State</Label>
                    <Input value={property.state} onChange={(e) => setProperty({ ...property, state: e.target.value })} placeholder="Karnataka" />
                  </div>
                  <div>
                    <Label>PIN Code</Label>
                    <Input value={property.pincode} onChange={(e) => setProperty({ ...property, pincode: e.target.value })} placeholder="560038" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Contact Phone for Guests</Label>
                    <Input value={property.contactPhone} onChange={(e) => setProperty({ ...property, contactPhone: e.target.value })} placeholder="+91 98765 00000" />
                  </div>
                  <div>
                    <Label>Contact Email</Label>
                    <Input type="email" value={property.contactEmail} onChange={(e) => setProperty({ ...property, contactEmail: e.target.value })} placeholder="stay@royalorchid.in" />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 4: Flexible Structure */}
            {step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-white">Building & Unit Structure</h3>
                  <p className="text-xs text-slate-300 mt-1">Configure your blocks, floors (including Ground Floor & Basements), and room occupancy.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Number of Blocks / Buildings</Label>
                    <Input type="number" min={1} max={10} value={structure.buildings} onChange={(e) => setStructure({ ...structure, buildings: parseInt(e.target.value) || 1 })} />
                  </div>
                  <div>
                    <Label>Total Floors per Building</Label>
                    <Input type="number" min={1} max={20} value={structure.totalFloors} onChange={(e) => setStructure({ ...structure, totalFloors: parseInt(e.target.value) || 1 })} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Rooms / Units per Floor</Label>
                    <Input type="number" min={1} max={30} value={structure.roomsPerFloor} onChange={(e) => setStructure({ ...structure, roomsPerFloor: parseInt(e.target.value) || 1 })} />
                  </div>
                  <div>
                    <Label>Capacity per Room (Beds / Seats)</Label>
                    <Input type="number" min={1} max={10} value={structure.capacityPerRoom} onChange={(e) => setStructure({ ...structure, capacityPerRoom: parseInt(e.target.value) || 1 })} />
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-200">
                  ⚡ Auto-generating <strong>{totalUnits} total units/beds</strong> across {structure.buildings} block(s), Ground Floor & Floors 1 to {structure.totalFloors - 1}.
                </div>
              </motion.div>
            )}

            {/* Step 5: Bathroom Model & Amenities */}
            {step === 5 && (
              <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-white">Bathroom Model & Amenities</h3>
                  <p className="text-xs text-slate-300 mt-1">Specify whether bathrooms are attached or shared, and select available amenities.</p>
                </div>

                <div>
                  <Label>Bathroom Model</Label>
                  <div className="grid grid-cols-2 gap-3 mt-1.5">
                    <div
                      onClick={() => setBathroomModel('attached')}
                      className={`p-3.5 rounded-xl border cursor-pointer text-center ${
                        bathroomModel === 'attached' ? 'bg-indigo-600/30 border-indigo-400 text-white font-bold' : 'bg-slate-900 border-slate-800 text-slate-300'
                      }`}
                    >
                      Attached Bathroom (Per Room)
                    </div>
                    <div
                      onClick={() => setBathroomModel('shared')}
                      className={`p-3.5 rounded-xl border cursor-pointer text-center ${
                        bathroomModel === 'shared' ? 'bg-indigo-600/30 border-indigo-400 text-white font-bold' : 'bg-slate-900 border-slate-800 text-slate-300'
                      }`}
                    >
                      Shared / Common Floor Bathrooms
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Available Property Amenities</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-2">
                    {AMENITY_OPTIONS.map((a) => (
                      <div
                        key={a}
                        onClick={() => toggleAmenity(a)}
                        className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-center gap-2 transition-colors ${
                          amenities.includes(a)
                            ? 'bg-indigo-600/25 border-indigo-400 text-indigo-200 font-semibold'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <CheckCircle2 className={`h-3.5 w-3.5 flex-shrink-0 ${amenities.includes(a) ? 'text-indigo-400' : 'opacity-20'}`} />
                        <span className="truncate">{a}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 6: Pricing, Policies & Stay Rules */}
            {step === 6 && (
              <motion.div key="step6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-white">Pricing & Stay Policies</h3>
                  <p className="text-xs text-slate-300 mt-1">Set your base rates, deposit terms, and house rules.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Monthly Rent / Base Rate (₹) *</Label>
                    <Input type="number" value={structure.baseRate} onChange={(e) => setStructure({ ...structure, baseRate: parseInt(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <Label>Security Deposit Amount (₹)</Label>
                    <Input type="number" value={structure.depositAmount} onChange={(e) => setStructure({ ...structure, depositAmount: parseInt(e.target.value) || 0 })} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Standard Check-In Time</Label>
                    <Input value={policies.checkInTime} onChange={(e) => setPolicies({ ...policies, checkInTime: e.target.value })} />
                  </div>
                  <div>
                    <Label>Standard Check-Out Time</Label>
                    <Input value={policies.checkOutTime} onChange={(e) => setPolicies({ ...policies, checkOutTime: e.target.value })} />
                  </div>
                </div>

                <div>
                  <Label>House / Property Rules (Included in registration & posters)</Label>
                  <Textarea rows={4} value={policies.rulesText} onChange={(e) => setPolicies({ ...policies, rulesText: e.target.value })} />
                </div>
              </motion.div>
            )}

            {/* Step 7: Branding & Digital Connectivity */}
            {step === 7 && (
              <motion.div key="step7" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-white">Branding & Payment Details</h3>
                  <p className="text-xs text-slate-300 mt-1">Provide Wi-Fi and UPI details to auto-generate posters in RENTAQ Studio.</p>
                </div>

                <div>
                  <Label>UPI ID for Direct Rent Payments</Label>
                  <Input value={branding.upiId} onChange={(e) => setBranding({ ...branding, upiId: e.target.value })} placeholder="e.g. royalorchid@okaxis" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Property Wi-Fi Network (SSID)</Label>
                    <Input value={branding.wifiSsid} onChange={(e) => setBranding({ ...branding, wifiSsid: e.target.value })} placeholder="e.g. RoyalOrchid_Guest_5G" />
                  </div>
                  <div>
                    <Label>Wi-Fi Password</Label>
                    <Input value={branding.wifiPassword} onChange={(e) => setBranding({ ...branding, wifiPassword: e.target.value })} placeholder="e.g. Welcome2026" />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 8: Final Review & Launch Workspace */}
            {step === 8 && (
              <motion.div key="step8" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5 text-center">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500 text-white shadow-xl shadow-indigo-500/40 mx-auto">
                  <Sparkles className="h-8 w-8" />
                </div>

                <div>
                  <h3 className="text-2xl font-extrabold text-white">Your RENTAQ Workspace is Ready!</h3>
                  <p className="text-sm text-slate-300 mt-1">Review your summary before initializing your business operating center.</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-left space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Operator Name:</span>
                    <span className="text-slate-100 font-bold">{profile.name || 'Owner'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Property:</span>
                    <span className="text-slate-100 font-bold">{property.name || 'Main Property'} ({property.type.toUpperCase()})</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Location:</span>
                    <span className="text-slate-100 font-bold">{[property.city, property.state].filter(Boolean).join(', ')}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Total Units / Beds:</span>
                    <span className="text-indigo-300 font-bold">{totalUnits} Beds/Units</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Base Monthly Rent:</span>
                    <span className="text-emerald-400 font-bold">₹{structure.baseRate.toLocaleString()}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Wizard Footer Navigation */}
        <div className="px-6 sm:px-8 py-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1 || isCreating}
            className="text-slate-300 hover:text-white"
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Back
          </Button>

          {step < 8 ? (
            <Button
              size="default"
              onClick={() => setStep(step + 1)}
              className="font-bold"
            >
              Continue <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              size="lg"
              onClick={handleFinishOnboarding}
              disabled={isCreating}
              className="font-bold shadow-xl shadow-indigo-500/30"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" /> Initializing Workspace...
                </>
              ) : (
                '🚀 Launch RENTAQ Dashboard'
              )}
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
