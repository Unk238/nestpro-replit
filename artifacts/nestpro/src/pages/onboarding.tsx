import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, CheckCircle2, ChevronRight, ChevronLeft, Plus,
  Trash2, Loader2, ArrowRight, Home, Hotel, Users, BedDouble,
  Star, Briefcase, MapPin, Phone, Mail, X,
} from "lucide-react";

const BIZ_CATEGORIES = [
  { value: "pg", label: "PG", desc: "Paying Guest" },
  { value: "hostel", label: "Hostel", desc: "Shared dorms" },
  { value: "hotel", label: "Hotel", desc: "Hotel rooms" },
  { value: "lodge", label: "Lodge", desc: "Lodge / Inn" },
  { value: "dormitory", label: "Dormitory", desc: "Institutional" },
  { value: "co_living", label: "Co-Living", desc: "Community" },
  { value: "service_apartment", label: "Service Apt", desc: "Furnished flats" },
  { value: "rental", label: "Rental", desc: "Rental property" },
];

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab",
  "Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh",
  "Uttarakhand","West Bengal","Delhi","Jammu and Kashmir","Ladakh","Chandigarh","Puducherry",
];

const SHARING_TYPES = [
  { value: "single", label: "Single", beds: 1 },
  { value: "double", label: "Double", beds: 2 },
  { value: "triple", label: "Triple", beds: 3 },
  { value: "quad", label: "Quad", beds: 4 },
  { value: "dormitory", label: "Dorm", beds: 6 },
];

interface Room { id: string; number: string; type: string; rent: number }
interface Floor { id: string; name: string; rooms: Room[] }
interface Building { id: string; name: string; floors: Floor[] }
interface Property {
  name: string; type: string; phone: string; address: string;
  city: string; state: string; pincode: string;
  buildings: Building[];
}

interface BusinessProfile {
  name: string; phone: string; email: string; categories: string[];
}

const uid = () => Math.random().toString(36).slice(2, 9);

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
async function apiFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE}/api${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

const STEPS = [
  "Business Profile",
  "Properties",
  "Property Details",
  "Structure Builder",
  "Review",
];

interface OnboardingProps {
  user: { name: string; email: string };
  onComplete: (business: BusinessProfile) => void;
}

export default function Onboarding({ user, onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const [biz, setBiz] = useState<BusinessProfile>({
    name: "", phone: "", email: user.email, categories: [],
  });
  const [propCount, setPropCount] = useState(1);
  const [properties, setProperties] = useState<Property[]>([
    { name: "", type: "pg", phone: "", address: "", city: "", state: "Maharashtra", pincode: "", buildings: [] },
  ]);
  const [activePropIdx, setActivePropIdx] = useState(0);

  const toggleCategory = (val: string) => {
    setBiz((b) => ({
      ...b,
      categories: b.categories.includes(val)
        ? b.categories.filter((c) => c !== val)
        : [...b.categories, val],
    }));
  };

  const setPropCount2 = (n: number) => {
    setPropCount(n);
    setProperties((prev) => {
      const arr = [...prev];
      while (arr.length < n) arr.push({ name: "", type: "pg", phone: "", address: "", city: "", state: "Maharashtra", pincode: "", buildings: [] });
      return arr.slice(0, n);
    });
  };

  const updateProp = (idx: number, patch: Partial<Property>) => {
    setProperties((prev) => prev.map((p, i) => (i === idx ? { ...p, ...patch } : p)));
  };

  const addBuilding = (pi: number) => {
    const b: Building = {
      id: uid(),
      name: properties[pi].buildings.length === 0 ? "Main Building" : `Block ${String.fromCharCode(65 + properties[pi].buildings.length)}`,
      floors: [{ id: uid(), name: "Floor 1", rooms: [{ id: uid(), number: "101", type: "double", rent: 8000 }] }],
    };
    updateProp(pi, { buildings: [...properties[pi].buildings, b] });
  };

  const addFloor = (pi: number, bi: number) => {
    const prop = properties[pi];
    const bldg = prop.buildings[bi];
    const floorNum = bldg.floors.length + 1;
    const f: Floor = { id: uid(), name: `Floor ${floorNum}`, rooms: [{ id: uid(), number: `${floorNum}01`, type: "double", rent: 8000 }] };
    const newBuildings = prop.buildings.map((b, i) =>
      i === bi ? { ...b, floors: [...b.floors, f] } : b
    );
    updateProp(pi, { buildings: newBuildings });
  };

  const addRoom = (pi: number, bi: number, fi: number) => {
    const floor = properties[pi].buildings[bi].floors[fi];
    const r: Room = { id: uid(), number: `${fi + 1}0${floor.rooms.length + 1}`, type: "double", rent: 8000 };
    const newBuildings = properties[pi].buildings.map((b, bi2) =>
      bi2 === bi
        ? {
            ...b,
            floors: b.floors.map((f, fi2) =>
              fi2 === fi ? { ...f, rooms: [...f.rooms, r] } : f
            ),
          }
        : b
    );
    updateProp(pi, { buildings: newBuildings });
  };

  const removeRoom = (pi: number, bi: number, fi: number, ri: number) => {
    const newBuildings = properties[pi].buildings.map((b, bi2) =>
      bi2 === bi
        ? {
            ...b,
            floors: b.floors.map((f, fi2) =>
              fi2 === fi ? { ...f, rooms: f.rooms.filter((_, i) => i !== ri) } : f
            ),
          }
        : b
    );
    updateProp(pi, { buildings: newBuildings });
  };

  const updateRoom = (pi: number, bi: number, fi: number, ri: number, patch: Partial<Room>) => {
    const newBuildings = properties[pi].buildings.map((b, bi2) =>
      bi2 === bi
        ? {
            ...b,
            floors: b.floors.map((f, fi2) =>
              fi2 === fi
                ? { ...f, rooms: f.rooms.map((r, i) => (i === ri ? { ...r, ...patch } : r)) }
                : f
            ),
          }
        : b
    );
    updateProp(pi, { buildings: newBuildings });
  };

  const totalBeds = (p: Property) =>
    p.buildings.flatMap((b) => b.floors.flatMap((f) => f.rooms)).reduce((sum, r) => {
      const st = SHARING_TYPES.find((s) => s.value === r.type);
      return sum + (st?.beds ?? 1);
    }, 0);

  const allTotalBeds = properties.reduce((sum, p) => sum + totalBeds(p), 0);
  const allTotalRooms = properties.reduce((sum, p) =>
    sum + p.buildings.flatMap((b) => b.floors.flatMap((f) => f.rooms)).length, 0
  );

  const validate = (): string => {
    if (step === 0) {
      if (!biz.name.trim()) return "Business name is required.";
      if (biz.categories.length === 0) return "Select at least one business category.";
    }
    if (step === 2) {
      const p = properties[activePropIdx];
      if (!p.name.trim()) return "Property name is required.";
      if (!p.address.trim()) return "Address is required.";
      if (!p.city.trim()) return "City is required.";
    }
    if (step === 3) {
      const p = properties[activePropIdx];
      if (p.buildings.length === 0) return "Add at least one building.";
    }
    return "";
  };

  const handleNext = () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError("");

    // For multi-property steps 2+3, advance through each property first
    if ((step === 2 || step === 3) && activePropIdx < properties.length - 1) {
      if (step === 3) {
        const err2 = validate();
        if (err2) { setError(err2); return; }
      }
      setActivePropIdx((i) => i + 1);
      return;
    }
    setActivePropIdx(0);
    setStep((s) => s + 1);
  };

  const handleBack = () => {
    setError("");
    if ((step === 2 || step === 3) && activePropIdx > 0) {
      setActivePropIdx((i) => i - 1);
      return;
    }
    setActivePropIdx(0);
    setStep((s) => s - 1);
  };

  const handleCreate = async () => {
    setCreating(true);
    setError("");
    try {
      for (const prop of properties) {
        const createdProp = await apiFetch("/properties", {
          method: "POST",
          body: JSON.stringify({
            name: prop.name, type: prop.type, address: prop.address,
            city: prop.city, state: prop.state, pincode: prop.pincode, phone: prop.phone,
          }),
        });

        for (const bldg of prop.buildings) {
          const createdBldg = await apiFetch(`/properties/${createdProp.id}/buildings`, {
            method: "POST",
            body: JSON.stringify({ name: bldg.name }),
          });

          for (const floor of bldg.floors) {
            const floorNum = parseInt(floor.name.replace(/\D/g, "")) || 1;
            const createdFloor = await apiFetch(`/buildings/${createdBldg.id}/floors`, {
              method: "POST",
              body: JSON.stringify({ number: floorNum, name: floor.name }),
            });

            for (const room of floor.rooms) {
              const createdRoom = await apiFetch(`/floors/${createdFloor.id}/rooms`, {
                method: "POST",
                body: JSON.stringify({ number: room.number, type: room.type, monthlyRent: room.rent }),
              });

              const st = SHARING_TYPES.find((s) => s.value === room.type);
              const bedCount = st?.beds ?? 1;
              const labels = bedCount <= 4
                ? ["A", "B", "C", "D"].slice(0, bedCount)
                : Array.from({ length: bedCount }, (_, i) => String(i + 1));

              for (const label of labels) {
                await apiFetch(`/rooms/${createdRoom.id}/beds`, {
                  method: "POST",
                  body: JSON.stringify({ label, status: "available", monthlyRent: room.rent }),
                });
              }
            }
          }
        }
      }

      localStorage.setItem("nestpro_business", JSON.stringify(biz));
      localStorage.setItem("nestpro_onboarded", "true");
      onComplete(biz);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create workspace. Please try again.");
      setCreating(false);
    }
  };

  const isLastProp = activePropIdx === properties.length - 1;
  const isFirstProp = activePropIdx === 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex flex-col">
      {/* Top nav */}
      <div className="border-b bg-white/80 backdrop-blur-sm px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <Building2 className="h-4.5 w-4.5 text-white h-5 w-5" />
          </div>
          <span className="font-bold text-lg text-gray-900">NestPro</span>
        </div>
        <span className="text-sm text-gray-400">Setting up your workspace</span>
      </div>

      {/* Step bar */}
      <div className="bg-white border-b px-8 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-1">
            {STEPS.map((label, i) => (
              <React.Fragment key={label}>
                <div className="flex items-center gap-2">
                  <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    i < step ? "bg-blue-600 text-white" :
                    i === step ? "bg-blue-600 text-white ring-4 ring-blue-100" :
                    "bg-gray-100 text-gray-400"
                  }`}>
                    {i < step ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${i === step ? "text-blue-600" : i < step ? "text-gray-700" : "text-gray-400"}`}>
                    {label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 rounded ${i < step ? "bg-blue-600" : "bg-gray-200"}`} />
                )}
              </React.Fragment>
            ))}
          </div>
          {properties.length > 1 && (step === 2 || step === 3) && (
            <p className="text-xs text-gray-400 mt-2 ml-1">
              Property {activePropIdx + 1} of {properties.length}
              {properties[activePropIdx].name ? ` — ${properties[activePropIdx].name}` : ""}
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center p-8">
        <div className="w-full max-w-3xl">
          <AnimatePresence mode="wait">
            {/* STEP 0 - Business Profile */}
            {step === 0 && (
              <motion.div key="s0" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-gray-900">Tell us about your business</h1>
                  <p className="text-gray-500 mt-2">This helps us personalise your workspace for your accommodation business.</p>
                </div>
                <div className="bg-white rounded-2xl border shadow-sm p-8 space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Business Name *</label>
                    <input
                      value={biz.name}
                      onChange={(e) => setBiz({ ...biz, name: e.target.value })}
                      placeholder="e.g. Sharma PG Services, Urban Stays Pvt Ltd"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Business Phone</label>
                      <input
                        value={biz.phone}
                        onChange={(e) => setBiz({ ...biz, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Business Email</label>
                      <input
                        value={biz.email}
                        onChange={(e) => setBiz({ ...biz, email: e.target.value })}
                        placeholder="contact@mybusiness.com"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">What type of accommodation do you run? *</label>
                    <p className="text-xs text-gray-400 mb-3">Select all that apply — many businesses run multiple types</p>
                    <div className="grid grid-cols-4 gap-3">
                      {BIZ_CATEGORIES.map((cat) => (
                        <button
                          key={cat.value}
                          onClick={() => toggleCategory(cat.value)}
                          className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center ${
                            biz.categories.includes(cat.value)
                              ? "border-blue-500 bg-blue-50 text-blue-700"
                              : "border-gray-200 hover:border-gray-300 text-gray-600"
                          }`}
                        >
                          {biz.categories.includes(cat.value) && (
                            <CheckCircle2 className="h-4 w-4 text-blue-500 absolute" />
                          )}
                          <span className="text-sm font-semibold">{cat.label}</span>
                          <span className="text-xs text-gray-400">{cat.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 1 - Property Count */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-gray-900">How many properties do you manage?</h1>
                  <p className="text-gray-500 mt-2">You can always add more later from the Properties section.</p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <button
                      key={n}
                      onClick={() => setPropCount2(n)}
                      className={`p-8 rounded-2xl border-2 transition-all text-center ${
                        propCount === n
                          ? "border-blue-500 bg-blue-50 shadow-lg shadow-blue-100"
                          : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                      }`}
                    >
                      <div className={`text-4xl font-bold mb-2 ${propCount === n ? "text-blue-600" : "text-gray-800"}`}>{n}</div>
                      <div className="text-sm text-gray-500">{n === 1 ? "Property" : "Properties"}</div>
                    </button>
                  ))}
                </div>
                <p className="text-center text-sm text-gray-400 mt-6">Managing 7 or more? Start with the main ones — you can add the rest after setup.</p>
              </motion.div>
            )}

            {/* STEP 2 - Property Details */}
            {step === 2 && (
              <motion.div key={`s2-${activePropIdx}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {properties.length > 1 ? `Property ${activePropIdx + 1} details` : "Property details"}
                  </h1>
                  <p className="text-gray-500 mt-1">Enter the details for this location.</p>
                </div>
                <div className="bg-white rounded-2xl border shadow-sm p-8 space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Property Name *</label>
                      <input
                        value={properties[activePropIdx].name}
                        onChange={(e) => updateProp(activePropIdx, { name: e.target.value })}
                        placeholder="e.g. Sunrise PG Koramangala, Block A Hostel"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Property Type</label>
                      <select
                        value={properties[activePropIdx].type}
                        onChange={(e) => updateProp(activePropIdx, { type: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {BIZ_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Property Phone</label>
                      <input
                        value={properties[activePropIdx].phone}
                        onChange={(e) => updateProp(activePropIdx, { phone: e.target.value })}
                        placeholder="+91 98765 43210"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Address *</label>
                      <input
                        value={properties[activePropIdx].address}
                        onChange={(e) => updateProp(activePropIdx, { address: e.target.value })}
                        placeholder="Street, Area, Landmark"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">City *</label>
                      <input
                        value={properties[activePropIdx].city}
                        onChange={(e) => updateProp(activePropIdx, { city: e.target.value })}
                        placeholder="Bangalore"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">State</label>
                      <select
                        value={properties[activePropIdx].state}
                        onChange={(e) => updateProp(activePropIdx, { state: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Pincode</label>
                      <input
                        value={properties[activePropIdx].pincode}
                        onChange={(e) => updateProp(activePropIdx, { pincode: e.target.value })}
                        placeholder="560001"
                        maxLength={6}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 3 - Structure Builder */}
            {step === 3 && (
              <motion.div key={`s3-${activePropIdx}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="mb-6 flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      Build structure — {properties[activePropIdx].name || `Property ${activePropIdx + 1}`}
                    </h1>
                    <p className="text-gray-500 mt-1">Add buildings, floors, and rooms. Each room can have its own sharing type.</p>
                  </div>
                  <div className="text-right bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 shrink-0 ml-4">
                    <div className="text-2xl font-bold text-blue-600">{totalBeds(properties[activePropIdx])}</div>
                    <div className="text-xs text-blue-500">total beds</div>
                  </div>
                </div>

                <div className="space-y-4">
                  {properties[activePropIdx].buildings.map((bldg, bi) => (
                    <div key={bldg.id} className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                      <div className="bg-gray-50 border-b px-5 py-3 flex items-center gap-3">
                        <Building2 className="h-4 w-4 text-gray-400" />
                        <input
                          value={bldg.name}
                          onChange={(e) => {
                            const newBuildings = properties[activePropIdx].buildings.map((b, i) =>
                              i === bi ? { ...b, name: e.target.value } : b
                            );
                            updateProp(activePropIdx, { buildings: newBuildings });
                          }}
                          className="flex-1 bg-transparent text-sm font-semibold text-gray-700 focus:outline-none"
                        />
                        <button
                          onClick={() => addFloor(activePropIdx, bi)}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                        >
                          <Plus className="h-3 w-3" /> Add Floor
                        </button>
                      </div>

                      <div className="divide-y">
                        {bldg.floors.map((floor, fi) => (
                          <div key={floor.id} className="px-5 py-3">
                            <div className="flex items-center justify-between mb-2">
                              <input
                                value={floor.name}
                                onChange={(e) => {
                                  const newBuildings = properties[activePropIdx].buildings.map((b, bi2) =>
                                    bi2 === bi
                                      ? { ...b, floors: b.floors.map((f, fi2) => fi2 === fi ? { ...f, name: e.target.value } : f) }
                                      : b
                                  );
                                  updateProp(activePropIdx, { buildings: newBuildings });
                                }}
                                className="text-xs font-semibold text-gray-500 uppercase tracking-wider bg-transparent focus:outline-none w-24"
                              />
                              <button
                                onClick={() => addRoom(activePropIdx, bi, fi)}
                                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                              >
                                <Plus className="h-3 w-3" /> Room
                              </button>
                            </div>
                            <div className="space-y-2">
                              {floor.rooms.map((room, ri) => {
                                const st = SHARING_TYPES.find((s) => s.value === room.type);
                                return (
                                  <div key={room.id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-2.5">
                                    <input
                                      value={room.number}
                                      onChange={(e) => updateRoom(activePropIdx, bi, fi, ri, { number: e.target.value })}
                                      className="w-16 text-sm font-medium text-gray-700 bg-transparent focus:outline-none border-b border-transparent focus:border-gray-300"
                                      placeholder="101"
                                    />
                                    <div className="flex gap-1 flex-1">
                                      {SHARING_TYPES.map((s) => (
                                        <button
                                          key={s.value}
                                          onClick={() => updateRoom(activePropIdx, bi, fi, ri, { type: s.value })}
                                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                                            room.type === s.value
                                              ? "bg-blue-600 text-white"
                                              : "bg-white border text-gray-500 hover:border-blue-300"
                                          }`}
                                        >
                                          {s.label}
                                        </button>
                                      ))}
                                    </div>
                                    <span className="text-xs text-gray-400">{st?.beds ?? 1} bed{(st?.beds ?? 1) > 1 ? "s" : ""}</span>
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs text-gray-400">₹</span>
                                      <input
                                        type="number"
                                        value={room.rent}
                                        onChange={(e) => updateRoom(activePropIdx, bi, fi, ri, { rent: Number(e.target.value) })}
                                        className="w-16 text-xs text-gray-600 bg-transparent focus:outline-none text-right"
                                      />
                                    </div>
                                    <button
                                      onClick={() => removeRoom(activePropIdx, bi, fi, ri)}
                                      className="text-gray-300 hover:text-red-400 transition-colors"
                                    >
                                      <X className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={() => addBuilding(activePropIdx)}
                    className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    <Plus className="h-4 w-4" />
                    Add Building
                  </button>

                  {properties[activePropIdx].buildings.length === 0 && (
                    <div className="text-center py-4 text-gray-400 text-sm">
                      Click "Add Building" to start building your property structure
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* STEP 4 - Review */}
            {step === 4 && (
              <motion.div key="s4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-gray-900">Review your workspace</h1>
                  <p className="text-gray-500 mt-1">Everything looks correct? We'll create your workspace now.</p>
                </div>

                <div className="space-y-4">
                  {/* Business summary */}
                  <div className="bg-white rounded-2xl border shadow-sm p-6">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Business</h3>
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                        <Briefcase className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-lg">{biz.name}</p>
                        <p className="text-sm text-gray-500">{biz.categories.join(" · ")}</p>
                      </div>
                    </div>
                  </div>

                  {/* Properties */}
                  {properties.map((prop, i) => (
                    <div key={i} className="bg-white rounded-2xl border shadow-sm p-6">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-gray-900">{prop.name}</h3>
                        <div className="text-right">
                          <span className="text-2xl font-bold text-blue-600">{totalBeds(prop)}</span>
                          <span className="text-xs text-gray-400 ml-1">beds</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mb-3">{prop.address}, {prop.city}, {prop.state}</p>
                      <div className="flex gap-4 text-sm text-gray-600">
                        <span>{prop.buildings.length} building{prop.buildings.length !== 1 ? "s" : ""}</span>
                        <span>·</span>
                        <span>{prop.buildings.reduce((s, b) => s + b.floors.length, 0)} floors</span>
                        <span>·</span>
                        <span>{prop.buildings.reduce((s, b) => s + b.floors.reduce((s2, f) => s2 + f.rooms.length, 0), 0)} rooms</span>
                      </div>
                    </div>
                  ))}

                  {/* Grand total */}
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 flex items-center justify-between text-white">
                    <div>
                      <p className="font-semibold text-blue-100 text-sm">Total capacity</p>
                      <p className="text-sm text-blue-200">{properties.length} {properties.length > 1 ? "properties" : "property"} · {allTotalRooms} rooms</p>
                    </div>
                    <div className="text-right">
                      <p className="text-4xl font-bold">{allTotalBeds}</p>
                      <p className="text-blue-200 text-sm">beds</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3"
            >
              {error}
            </motion.div>
          )}

          {/* Footer */}
          <div className="mt-8 flex justify-between items-center">
            <button
              onClick={handleBack}
              disabled={step === 0 && isFirstProp}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-gray-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 transition font-medium disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>

            {step < 4 ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors shadow-lg shadow-blue-200"
              >
                {step === 3 && isLastProp ? "Review" :
                 (step === 2 || step === 3) && !isLastProp ? `Next Property →` :
                 "Continue"}
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleCreate}
                disabled={creating}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors shadow-lg shadow-blue-200 disabled:opacity-60"
              >
                {creating ? (
                  <><Loader2 className="h-5 w-5 animate-spin" /> Creating workspace…</>
                ) : (
                  <><Star className="h-4 w-4" /> Launch Workspace</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
