import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, CheckCircle2, ChevronRight, ChevronLeft,
  Home, Hotel, Store, Briefcase, BookOpen, Layers,
  ShieldCheck, Wifi, MapPin, IndianRupee, Sparkles, UserCheck
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { LanguageSelector } from './language-selector';
import { useTranslation } from '@/lib/i18n';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

interface OnboardingProps {
  onComplete: () => void;
}

const PROPERTY_CATEGORIES = [
  { id: 'pg', label: 'Paying Guest (PG)', type: 'Residential', icon: Home },
  { id: 'hostel', label: 'Student / Working Hostel', type: 'Residential', icon: Building2 },
  { id: 'co_living', label: 'Co-Living Space', type: 'Residential', icon: Layers },
  { id: 'apartment', label: 'Serviced Apartment / Flat', type: 'Residential', icon: Home },
  { id: 'villa', label: 'Villa / Homestay / Kothi', type: 'Residential', icon: Home },
  { id: 'hotel', label: 'Hotel / Lodge / Guest House', type: 'Hospitality', icon: Hotel },
  { id: 'shop', label: 'Commercial Shop / Retail', type: 'Commercial', icon: Store },
  { id: 'office', label: 'Office / Co-Working Desk', type: 'Commercial', icon: Briefcase },
  { id: 'library', label: 'Study Library / Reading Hall', type: 'Commercial', icon: BookOpen },
];

const ROLES = [
  { id: 'owner', label: 'Property Owner / Founder' },
  { id: 'manager', label: 'Property Manager' },
  { id: 'landlord', label: 'Landlord' },
  { id: 'operations_manager', label: 'Operations Lead' },
  { id: 'receptionist', label: 'Front Desk / Reception' },
  { id: 'broker', label: 'Broker / Real Estate Agent' },
  { id: 'admin', label: 'Administrator' },
];

const AMENITY_OPTIONS = [
  'High-Speed Wi-Fi', '24x7 Security & CCTV', 'RO Drinking Water',
  'Daily Housekeeping', 'AC & Geyser', 'Power Backup (DG/Inverter)',
  'Nutritious 3-Time Meals', 'Biometric / Smart Entry', 'Washing Machine / Laundry',
  'Lift / Elevator', 'Attached Washroom', 'Parking Facility'
];

export function OnboardingWizard({ onComplete }: OnboardingProps) {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Personal & Role
    userName: '',
    userPhone: '',
    userRole: 'owner',
    pincode: '',

    // Step 2: Category
    category: 'pg',

    // Step 3: Location & Details
    propertyName: '',
    address: '',
    city: '',
    state: '',
    contactPhone: '',
    contactEmail: '',
    description: '',

    // Step 4: Structure
    buildingName: 'Main Block',
    totalFloors: 3,
    roomsPerFloor: 4,
    bedsPerRoom: 2,

    // Step 5: Bathroom & Amenities
    bathroomModel: 'attached',
    amenities: ['High-Speed Wi-Fi', 'RO Drinking Water', '24x7 Security & CCTV', 'Daily Housekeeping'],

    // Step 6: Pricing & Policies
    monthlyRent: '8500',
    depositAmount: '10000',
    gateClosingTime: '10:30 PM',
    houseRules: '1. Maintain quiet hours after 10 PM.\n2. Visitors allowed in common lounge only.\n3. Cleanliness to be maintained in all shared spaces.',

    // Step 7: Digital & Wi-Fi
    wifiSsid: 'RENTAQ_GUEST_5G',
    wifiPassword: 'Stay@2026',
    upiId: 'rentaq@okaxis',
  });

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleAmenity = (item: string) => {
    setFormData((prev) => {
      const exists = prev.amenities.includes(item);
      return {
        ...prev,
        amenities: exists ? prev.amenities.filter((a) => a !== item) : [...prev.amenities, item],
      };
    });
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      // 1. Create Property
      const prop = await api.createProperty({
        name: formData.propertyName || 'My Property',
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        type: formData.category,
        description: formData.description,
        amenities: JSON.stringify(formData.amenities),
        rules: formData.houseRules,
        wifiSsid: formData.wifiSsid,
        wifiPassword: formData.wifiPassword,
        upiId: formData.upiId,
        contactPhone: formData.contactPhone || formData.userPhone,
        contactEmail: formData.contactEmail,
      });

      // 2. Create Building
      const bldg = await api.createBuilding(prop.id, {
        name: formData.buildingName,
        totalFloors: Number(formData.totalFloors),
      });

      // 3. Create Floors, Rooms, and Beds in loop
      for (let f = 1; f <= Number(formData.totalFloors); f++) {
        const floor = await api.createFloor(bldg.id, {
          name: `Floor ${f}`,
          floorNumber: f,
        });

        for (let r = 1; r <= Number(formData.roomsPerFloor); r++) {
          const roomNum = `${f}0${r}`;
          const room = await api.createRoom(floor.id, {
            name: `Room ${roomNum}`,
            type: formData.bedsPerRoom === 1 ? 'single' : formData.bedsPerRoom === 2 ? 'double' : 'triple',
          });

          for (let b = 1; b <= Number(formData.bedsPerRoom); b++) {
            const bedLabel = `${roomNum}-${String.fromCharCode(64 + b)}`;
            await api.createBed(room.id, {
              label: bedLabel,
              monthlyRent: Number(formData.monthlyRent),
              status: 'available',
            });
          }
        }
      }

      // Save user session in localStorage
      localStorage.setItem('rentaq_onboarded', 'true');
      localStorage.setItem('rentaq_user', JSON.stringify({
        name: formData.userName || 'Owner',
        phone: formData.userPhone,
        role: formData.userRole,
        workspaceId: `RQ-${Math.floor(100000 + Math.random() * 900000)}`,
      }));

      toast({
        title: 'Workspace Initialized!',
        description: `${formData.propertyName || 'Property'} and units created successfully.`,
        variant: 'success',
      });

      onComplete();
    } catch (err: any) {
      toast({
        title: 'Setup error',
        description: err.message || 'Could not complete workspace setup',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#F7F9FC] text-[#172033] p-4 sm:p-8">
      {/* Header */}
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between py-2 border-b border-[#E5EAF1] pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2F6FED] text-white">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <span className="text-lg font-black text-[#173B6C]">RENTAQ</span>
            <span className="block text-[10px] font-semibold text-[#667085] uppercase">Property Onboarding</span>
          </div>
        </div>
        <LanguageSelector />
      </header>

      {/* Main Wizard Card */}
      <main className="max-w-3xl w-full mx-auto my-6">
        <div className="rounded-2xl border border-[#E5EAF1] bg-white p-6 sm:p-10 shadow-[0_4px_16px_rgba(23,32,51,0.04)]">
          {/* Step Progress Pills */}
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#E5EAF1]">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#EFF5FF] text-[#2F6FED] font-bold text-xs">
                {currentStep}
              </span>
              <span className="text-xs font-bold text-[#173B6C] uppercase tracking-wide">
                Step {currentStep} of 8
              </span>
            </div>
            <div className="flex items-center gap-1">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i + 1 === currentStep
                      ? 'w-6 bg-[#2F6FED]'
                      : i + 1 < currentStep
                      ? 'w-2 bg-[#16845B]'
                      : 'w-2 bg-[#E5EAF1]'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Step Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
              className="space-y-6 min-h-[340px]"
            >
              {/* STEP 1: Personal Profile & Role */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-bold text-[#172033]">Operator Profile & Role</h2>
                    <p className="text-xs text-[#667085]">Enter your credentials to configure permissions.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Your Full Name *</Label>
                      <Input
                        value={formData.userName}
                        onChange={(e) => updateField('userName', e.target.value)}
                        placeholder="e.g. Anand Kulkarni"
                      />
                    </div>
                    <div>
                      <Label>Mobile Number (for SMS / WhatsApp) *</Label>
                      <Input
                        value={formData.userPhone}
                        onChange={(e) => updateField('userPhone', e.target.value)}
                        placeholder="+91 98765 43210"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Operating Role</Label>
                      <Select value={formData.userRole} onValueChange={(v) => updateField('userRole', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-white border-[#E5EAF1]">
                          {ROLES.map((r) => (
                            <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>City PIN Code</Label>
                      <Input
                        value={formData.pincode}
                        onChange={(e) => updateField('pincode', e.target.value)}
                        placeholder="560001"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Property Category */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-bold text-[#172033]">Select Property Category</h2>
                    <p className="text-xs text-[#667085]">RENTAQ supports residential, hospitality, and commercial models.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {PROPERTY_CATEGORIES.map((cat) => {
                      const Icon = cat.icon;
                      const isSelected = formData.category === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => updateField('category', cat.id)}
                          className={`p-4 rounded-xl border text-left transition-all ${
                            isSelected
                              ? 'bg-[#EFF5FF] border-[#2F6FED] text-[#2F6FED] shadow-xs'
                              : 'bg-white border-[#E5EAF1] text-[#172033] hover:border-[#CBD5E1] hover:bg-[#F7F9FC]'
                          }`}
                        >
                          <div className={`flex h-9 w-9 items-center justify-center rounded-lg mb-2.5 ${
                            isSelected ? 'bg-[#2F6FED] text-white' : 'bg-[#F0F4FA] text-[#667085]'
                          }`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <p className="font-bold text-xs text-[#172033] leading-snug">{cat.label}</p>
                          <span className="text-[10px] text-[#667085] uppercase tracking-wider">{cat.type}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 3: Details & Location */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-bold text-[#172033]">Property Details & Address</h2>
                    <p className="text-xs text-[#667085]">Enter the public name and physical location.</p>
                  </div>
                  <div>
                    <Label>Property Name *</Label>
                    <Input
                      value={formData.propertyName}
                      onChange={(e) => updateField('propertyName', e.target.value)}
                      placeholder="e.g. Royal Orchid Co-Living & PG"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <Label>Street Address</Label>
                      <Input
                        value={formData.address}
                        onChange={(e) => updateField('address', e.target.value)}
                        placeholder="12th Cross, Indiranagar"
                      />
                    </div>
                    <div>
                      <Label>City *</Label>
                      <Input
                        value={formData.city}
                        onChange={(e) => updateField('city', e.target.value)}
                        placeholder="Bengaluru"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label>Contact Phone</Label>
                      <Input
                        value={formData.contactPhone}
                        onChange={(e) => updateField('contactPhone', e.target.value)}
                        placeholder="+91 98765 00000"
                      />
                    </div>
                    <div>
                      <Label>Contact Email</Label>
                      <Input
                        type="email"
                        value={formData.contactEmail}
                        onChange={(e) => updateField('contactEmail', e.target.value)}
                        placeholder="contact@royalorchid.in"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: Structure Configuration */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-bold text-[#172033]">Structure & Layout</h2>
                    <p className="text-xs text-[#667085]">RENTAQ will automatically generate building floors, rooms, and units.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Building / Block Name</Label>
                      <Input
                        value={formData.buildingName}
                        onChange={(e) => updateField('buildingName', e.target.value)}
                        placeholder="Block A"
                      />
                    </div>
                    <div>
                      <Label>Total Floors</Label>
                      <Input
                        type="number"
                        min="1"
                        max="20"
                        value={formData.totalFloors}
                        onChange={(e) => updateField('totalFloors', parseInt(e.target.value) || 1)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Rooms Per Floor</Label>
                      <Input
                        type="number"
                        min="1"
                        max="30"
                        value={formData.roomsPerFloor}
                        onChange={(e) => updateField('roomsPerFloor', parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div>
                      <Label>Beds / Capacity Per Room</Label>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        value={formData.bedsPerRoom}
                        onChange={(e) => updateField('bedsPerRoom', parseInt(e.target.value) || 1)}
                      />
                    </div>
                  </div>
                  <div className="p-3.5 rounded-lg bg-[#EFF5FF] border border-[#D6E4FF] text-xs text-[#2F6FED] font-medium">
                    Calculated Capacity: <strong>{Number(formData.totalFloors) * Number(formData.roomsPerFloor)}</strong> rooms (<strong>{Number(formData.totalFloors) * Number(formData.roomsPerFloor) * Number(formData.bedsPerRoom)}</strong> total units/beds).
                  </div>
                </div>
              )}

              {/* STEP 5: Bathroom & Amenities */}
              {currentStep === 5 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-bold text-[#172033]">Bathroom Model & Amenities</h2>
                    <p className="text-xs text-[#667085]">Select amenities included in the monthly rent.</p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {AMENITY_OPTIONS.map((item) => {
                      const selected = formData.amenities.includes(item);
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => toggleAmenity(item)}
                          className={`p-3 rounded-lg border text-left text-xs font-semibold flex items-center gap-2 transition-all ${
                            selected
                              ? 'bg-[#EFF5FF] border-[#2F6FED] text-[#2F6FED]'
                              : 'bg-white border-[#E5EAF1] text-[#172033] hover:bg-[#F7F9FC]'
                          }`}
                        >
                          <CheckCircle2 className={`h-4 w-4 flex-shrink-0 ${selected ? 'text-[#2F6FED]' : 'text-[#CBD5E1]'}`} />
                          <span className="truncate">{item}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 6: Pricing & House Rules */}
              {currentStep === 6 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-bold text-[#172033]">Pricing & Property Rules</h2>
                    <p className="text-xs text-[#667085]">Default monthly rent and gate policies.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <Label>Default Rent (₹ / month) *</Label>
                      <Input
                        type="number"
                        value={formData.monthlyRent}
                        onChange={(e) => updateField('monthlyRent', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Security Deposit (₹)</Label>
                      <Input
                        type="number"
                        value={formData.depositAmount}
                        onChange={(e) => updateField('depositAmount', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Gate Closing Time</Label>
                      <Input
                        value={formData.gateClosingTime}
                        onChange={(e) => updateField('gateClosingTime', e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>House Rules</Label>
                    <Textarea
                      rows={3}
                      value={formData.houseRules}
                      onChange={(e) => updateField('houseRules', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* STEP 7: Branding & Wi-Fi */}
              {currentStep === 7 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-bold text-[#172033]">Digital Branding & Wi-Fi</h2>
                    <p className="text-xs text-[#667085]">Will be pre-filled on your printable posters and QR cards.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Wi-Fi Network Name (SSID)</Label>
                      <Input
                        value={formData.wifiSsid}
                        onChange={(e) => updateField('wifiSsid', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Wi-Fi Password</Label>
                      <Input
                        value={formData.wifiPassword}
                        onChange={(e) => updateField('wifiPassword', e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>UPI ID for Rent Collection</Label>
                    <Input
                      value={formData.upiId}
                      onChange={(e) => updateField('upiId', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* STEP 8: Review & Ready */}
              {currentStep === 8 && (
                <div className="space-y-4 text-center py-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8F5E9] text-[#16845B] mx-auto">
                    <Sparkles className="h-7 w-7" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-[#172033]">Workspace Ready to Launch!</h2>
                    <p className="text-xs text-[#667085] mt-1">Review your property configuration before initializing.</p>
                  </div>

                  <div className="max-w-md mx-auto p-4 rounded-xl bg-[#F7F9FC] border border-[#E5EAF1] text-xs text-left space-y-2">
                    <div className="flex justify-between border-b border-[#E5EAF1] pb-1.5">
                      <span className="text-[#667085]">Property Name:</span>
                      <span className="font-bold text-[#172033]">{formData.propertyName || 'My Property'}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#E5EAF1] pb-1.5">
                      <span className="text-[#667085]">Category:</span>
                      <span className="font-bold text-[#172033] uppercase">{formData.category}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#E5EAF1] pb-1.5">
                      <span className="text-[#667085]">Total Capacity:</span>
                      <span className="font-bold text-[#2F6FED]">
                        {Number(formData.totalFloors) * Number(formData.roomsPerFloor) * Number(formData.bedsPerRoom)} units
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#667085]">Monthly Rent:</span>
                      <span className="font-bold text-[#16845B]">₹{formData.monthlyRent} / month</span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-6 mt-6 border-t border-[#E5EAF1]">
            {currentStep > 1 ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="text-xs font-semibold"
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Back
              </Button>
            ) : <div />}

            {currentStep < 8 ? (
              <Button
                size="sm"
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={currentStep === 1 && !formData.userName}
                className="btn-primary text-xs font-bold"
              >
                Continue <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleFinish}
                disabled={loading}
                className="btn-primary text-xs font-bold"
              >
                {loading ? 'Initializing Workspace...' : 'Launch RENTAQ Workspace'}
              </Button>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl w-full mx-auto text-center py-2 text-xs text-[#667085]">
        <p>RENTAQ · Multi-Property Operations OS</p>
      </footer>
    </div>
  );
}
