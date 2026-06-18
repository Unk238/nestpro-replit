import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, MapPin, Layers, Bed, CheckCircle2, ChevronRight,
  ChevronLeft, Loader2, X, Home, Hotel, Users, BedDouble,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const PROPERTY_TYPES = [
  { value: "pg", label: "PG", icon: Home, desc: "Paying Guest accommodation" },
  { value: "hostel", label: "Hostel", icon: Hotel, desc: "Shared dormitory-style" },
  { value: "co_living", label: "Co-living", icon: Users, desc: "Community living spaces" },
  { value: "dormitory", label: "Dormitory", icon: BedDouble, desc: "Institutional dorms" },
  { value: "lodge", label: "Lodge", icon: Building2, desc: "Short-stay lodging" },
];

const ROOM_TYPES = ["single", "double", "triple", "quad", "dormitory"];
const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab",
  "Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh",
  "Uttarakhand","West Bengal","Delhi","Jammu and Kashmir","Ladakh","Chandigarh",
  "Puducherry","Andaman and Nicobar Islands","Dadra and Nagar Haveli","Lakshadweep",
];

interface WizardProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface Step1Data {
  name: string; type: string; address: string; city: string;
  state: string; pincode: string; phone: string;
}

interface Step2Data {
  buildings: number; floorsPerBuilding: number; roomsPerFloor: number;
  bedsPerRoom: number; roomType: string; monthlyRent: number;
}

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

async function apiFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE}/api${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

const STEPS = ["Property Details", "Structure Setup", "Review & Create"];

export function OnboardingWizard({ open, onClose, onSuccess }: WizardProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [creating, setCreating] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const [s1, setS1] = useState<Step1Data>({
    name: "", type: "pg", address: "", city: "", state: "Maharashtra", pincode: "", phone: "",
  });
  const [s2, setS2] = useState<Step2Data>({
    buildings: 1, floorsPerBuilding: 2, roomsPerFloor: 4, bedsPerRoom: 2,
    roomType: "double", monthlyRent: 8000,
  });

  const totalRooms = s2.buildings * s2.floorsPerBuilding * s2.roomsPerFloor;
  const totalBeds = totalRooms * s2.bedsPerRoom;

  const reset = () => {
    setStep(0); setCreating(false); setDone(false); setError("");
    setS1({ name: "", type: "pg", address: "", city: "", state: "Maharashtra", pincode: "", phone: "" });
    setS2({ buildings: 1, floorsPerBuilding: 2, roomsPerFloor: 4, bedsPerRoom: 2, roomType: "double", monthlyRent: 8000 });
  };

  const handleClose = () => { reset(); onClose(); };

  const validateStep1 = () => {
    if (!s1.name.trim()) return "Property name is required.";
    if (!s1.address.trim()) return "Address is required.";
    if (!s1.city.trim()) return "City is required.";
    return "";
  };

  const handleNext = () => {
    if (step === 0) {
      const err = validateStep1();
      if (err) { setError(err); return; }
    }
    setError("");
    setStep((s) => s + 1);
  };

  const handleCreate = async () => {
    setCreating(true);
    setError("");
    try {
      const property = await apiFetch("/properties", {
        method: "POST",
        body: JSON.stringify({
          name: s1.name, type: s1.type, address: s1.address,
          city: s1.city, state: s1.state, pincode: s1.pincode, phone: s1.phone,
        }),
      });

      for (let b = 0; b < s2.buildings; b++) {
        const bLabel = s2.buildings === 1 ? "Main Building" : `Block ${String.fromCharCode(65 + b)}`;
        const building = await apiFetch(`/properties/${property.id}/buildings`, {
          method: "POST",
          body: JSON.stringify({ name: bLabel }),
        });

        for (let f = 0; f < s2.floorsPerBuilding; f++) {
          const floorNum = f + 1;
          const floor = await apiFetch(`/buildings/${building.id}/floors`, {
            method: "POST",
            body: JSON.stringify({ number: floorNum, name: `Floor ${floorNum}` }),
          });

          for (let r = 0; r < s2.roomsPerFloor; r++) {
            const roomNum = `${floorNum}0${r + 1}`;
            const room = await apiFetch(`/floors/${floor.id}/rooms`, {
              method: "POST",
              body: JSON.stringify({ number: roomNum, type: s2.roomType, monthlyRent: s2.monthlyRent }),
            });

            const bedLabels = s2.bedsPerRoom <= 4
              ? ["A", "B", "C", "D"].slice(0, s2.bedsPerRoom)
              : Array.from({ length: s2.bedsPerRoom }, (_, i) => String(i + 1));

            for (const label of bedLabels) {
              await apiFetch(`/rooms/${room.id}/beds`, {
                method: "POST",
                body: JSON.stringify({ label, status: "available", monthlyRent: s2.monthlyRent }),
              });
            }
          }
        }
      }

      await queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      setDone(true);
      onSuccess?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create property. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.25 }}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
          <button onClick={handleClose} className="absolute top-4 right-4 text-white/70 hover:text-white">
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3 mb-4">
            <Building2 className="h-6 w-6 text-white" />
            <h2 className="text-xl font-bold text-white">Add New Property</h2>
          </div>
          {/* Step indicator */}
          {!done && (
            <div className="flex items-center gap-2">
              {STEPS.map((label, i) => (
                <React.Fragment key={label}>
                  <div className="flex items-center gap-2">
                    <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      i < step ? "bg-white text-blue-600" :
                      i === step ? "bg-white/30 border-2 border-white text-white" :
                      "bg-white/10 text-white/50"
                    }`}>
                      {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                    </div>
                    <span className={`text-xs font-medium hidden sm:block ${i === step ? "text-white" : "text-white/50"}`}>
                      {label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 rounded ${i < step ? "bg-white" : "bg-white/20"}`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="px-8 py-6 min-h-[340px]">
          <AnimatePresence mode="wait">
            {done ? (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center h-64 text-center"
              >
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-9 w-9 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Property Created!
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">
                  <strong>{s1.name}</strong> is ready with {totalBeds} beds across {totalRooms} rooms.
                </p>
                <p className="text-gray-400 text-xs">Head to Property Explorer to see your bed grid.</p>
                <button
                  onClick={handleClose}
                  className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-2.5 rounded-xl transition-colors"
                >
                  Done
                </button>
              </motion.div>
            ) : step === 0 ? (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-5">Property Details</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Property Name *</label>
                    <input
                      value={s1.name}
                      onChange={(e) => setS1({ ...s1, name: e.target.value })}
                      placeholder="Sunrise PG, Urban Hostel..."
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Property Type *</label>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {PROPERTY_TYPES.map((pt) => (
                        <button
                          key={pt.value}
                          onClick={() => setS1({ ...s1, type: pt.value })}
                          className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all text-center ${
                            s1.type === pt.value
                              ? "border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                              : "border-gray-200 dark:border-gray-700 hover:border-gray-300 text-gray-600 dark:text-gray-400"
                          }`}
                        >
                          <pt.icon className="h-5 w-5" />
                          <span className="text-xs font-medium">{pt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Address *</label>
                    <input
                      value={s1.address}
                      onChange={(e) => setS1({ ...s1, address: e.target.value })}
                      placeholder="Street, Area, Landmark"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">City *</label>
                      <input
                        value={s1.city}
                        onChange={(e) => setS1({ ...s1, city: e.target.value })}
                        placeholder="Pune"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">State</label>
                      <select
                        value={s1.state}
                        onChange={(e) => setS1({ ...s1, state: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Pincode</label>
                      <input
                        value={s1.pincode}
                        onChange={(e) => setS1({ ...s1, pincode: e.target.value })}
                        placeholder="411001"
                        maxLength={6}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Phone</label>
                      <input
                        value={s1.phone}
                        onChange={(e) => setS1({ ...s1, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : step === 1 ? (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Structure Setup</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Define how many buildings, floors, and rooms to create.</p>

                <div className="grid grid-cols-2 gap-5 mb-6">
                  {[
                    { label: "Buildings", key: "buildings", min: 1, max: 10, icon: Building2 },
                    { label: "Floors per Building", key: "floorsPerBuilding", min: 1, max: 20, icon: Layers },
                    { label: "Rooms per Floor", key: "roomsPerFloor", min: 1, max: 20, icon: Home },
                    { label: "Beds per Room", key: "bedsPerRoom", min: 1, max: 12, icon: Bed },
                  ].map(({ label, key, min, max, icon: Icon }) => (
                    <div key={key} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Icon className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setS2({ ...s2, [key]: Math.max(min, (s2 as Record<string, number>)[key] - 1) })}
                          className="h-8 w-8 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                        >−</button>
                        <span className="text-xl font-bold text-gray-900 dark:text-white w-8 text-center">
                          {(s2 as Record<string, number>)[key]}
                        </span>
                        <button
                          onClick={() => setS2({ ...s2, [key]: Math.min(max, (s2 as Record<string, number>)[key] + 1) })}
                          className="h-8 w-8 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                        >+</button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Room Type</label>
                    <select
                      value={s2.roomType}
                      onChange={(e) => setS2({ ...s2, roomType: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 capitalize"
                    >
                      {ROOM_TYPES.map((t) => <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Monthly Rent (₹)</label>
                    <input
                      type="number"
                      value={s2.monthlyRent}
                      onChange={(e) => setS2({ ...s2, monthlyRent: Number(e.target.value) })}
                      placeholder="8000"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="mt-5 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-xl px-5 py-4 flex items-center justify-between">
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    <strong>{s2.buildings}</strong> bldg × <strong>{s2.floorsPerBuilding}</strong> floors × <strong>{s2.roomsPerFloor}</strong> rooms × <strong>{s2.bedsPerRoom}</strong> beds
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{totalBeds}</div>
                    <div className="text-xs text-blue-500">total beds</div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-5">Review & Create</h3>
                <div className="space-y-3">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Property</div>
                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                      <span className="text-gray-500">Name</span>
                      <span className="font-medium text-gray-900 dark:text-white">{s1.name}</span>
                      <span className="text-gray-500">Type</span>
                      <span className="font-medium text-gray-900 dark:text-white capitalize">{s1.type.replace("_", "-")}</span>
                      <span className="text-gray-500">Address</span>
                      <span className="font-medium text-gray-900 dark:text-white">{s1.address}, {s1.city}</span>
                      <span className="text-gray-500">State</span>
                      <span className="font-medium text-gray-900 dark:text-white">{s1.state}</span>
                      {s1.phone && <><span className="text-gray-500">Phone</span><span className="font-medium text-gray-900 dark:text-white">{s1.phone}</span></>}
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Structure</div>
                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                      <span className="text-gray-500">Buildings</span>
                      <span className="font-medium text-gray-900 dark:text-white">{s2.buildings}</span>
                      <span className="text-gray-500">Floors each</span>
                      <span className="font-medium text-gray-900 dark:text-white">{s2.floorsPerBuilding}</span>
                      <span className="text-gray-500">Rooms per floor</span>
                      <span className="font-medium text-gray-900 dark:text-white">{s2.roomsPerFloor} ({s2.roomType})</span>
                      <span className="text-gray-500">Beds per room</span>
                      <span className="font-medium text-gray-900 dark:text-white">{s2.bedsPerRoom}</span>
                      <span className="text-gray-500">Monthly rent</span>
                      <span className="font-medium text-gray-900 dark:text-white">₹{s2.monthlyRent.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                  <div className="bg-blue-600 rounded-xl p-4 flex items-center justify-between text-white">
                    <span className="font-medium">Total beds to be created</span>
                    <span className="text-3xl font-bold">{totalBeds}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <div className="mt-4 text-sm text-red-600 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl px-4 py-2.5">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        {!done && (
          <div className="px-8 py-5 border-t border-gray-100 dark:border-gray-800 flex justify-between">
            <button
              onClick={step === 0 ? handleClose : () => setStep((s) => s - 1)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition font-medium"
            >
              <ChevronLeft className="h-4 w-4" />
              {step === 0 ? "Cancel" : "Back"}
            </button>
            {step < 2 ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleCreate}
                disabled={creating}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors disabled:opacity-60"
              >
                {creating ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Creating…</>
                ) : (
                  <><CheckCircle2 className="h-4 w-4" /> Create Property</>
                )}
              </button>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
