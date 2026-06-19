import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, CheckCircle2, ChevronRight, ChevronLeft, Loader2,
  User, Phone, MapPin, Heart, FileText, Send, Upload, X,
  BedDouble, CreditCard, Camera, Trash2, Shield, AlertCircle,
} from "lucide-react";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

async function apiFetch(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${BASE}/api${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", ...opts.headers },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as any).error ?? `Error ${res.status}`);
  return json;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error("Failed to read file"));
    r.readAsDataURL(file);
  });
}

const BOOKING_SOURCES = [
  "Direct Walk-In", "WhatsApp", "Google Search", "Booking.com",
  "Agoda", "Airbnb", "Hostelworld", "MakeMyTrip", "Goibibo",
  "Travel Agent", "Other",
];

const GENDERS = ["Male", "Female", "Non-binary", "Prefer not to say"];
const STAY_TYPES = [
  { value: "night", label: "Night Stay", icon: "🌙", desc: "1–3 nights" },
  { value: "weekly", label: "Weekly Stay", icon: "📅", desc: "1–4 weeks" },
  { value: "monthly", label: "Monthly Stay", icon: "🗓️", desc: "1–6 months" },
  { value: "longterm", label: "Long-Term", icon: "🏠", desc: "6+ months" },
];

const DOC_TYPES = [
  "Aadhaar Card", "Passport", "Driving License", "Voter ID",
  "Employee ID", "Student ID", "Other Government ID",
];

interface UploadedFile {
  name: string;
  type: string;
  size: number;
  dataUrl: string;
  docType: string;
}

interface AvailableBed {
  id: number;
  label: string;
  monthlyRent: number | null;
  roomNumber: string;
  floorName: string;
  buildingName: string;
}

interface PropertyInfo {
  name: string;
  address: string;
  city: string;
  state: string;
  phone: string | null;
  type: string;
  propertyId: number;
  assignedBed?: {
    bedId: number;
    bedLabel: string;
    roomNumber: string;
    monthlyRent: number | null;
  };
  availableBeds: AvailableBed[];
}

interface FormData {
  fullName: string;
  phone: string;
  email: string;
  dob: string;
  gender: string;
  occupation: string;
  company: string;
  currentAddress: string;
  permanentAddress: string;
  aadhaar: string;
  emergencyName: string;
  emergencyRelation: string;
  emergencyPhone: string;
  parentName: string;
  parentPhone: string;
  guardianName: string;
  guardianPhone: string;
  stayType: string;
  checkInDate: string;
  checkOutDate: string;
  openEndedStay: boolean;
  selectedBedId: string;
  monthlyRent: string;
  depositAmount: string;
  advancePaid: string;
  bookingSource: string;
  documents: UploadedFile[];
  paymentProofs: UploadedFile[];
  agreedToTerms: boolean;
}

const STEPS = [
  { label: "Welcome", icon: Building2 },
  { label: "Personal Info", icon: User },
  { label: "Emergency Contact", icon: Heart },
  { label: "Stay & Room", icon: BedDouble },
  { label: "Documents", icon: FileText },
  { label: "Payment Proof", icon: CreditCard },
  { label: "Terms & Submit", icon: Shield },
];

const EMPTY_FORM: FormData = {
  fullName: "", phone: "", email: "", dob: "", gender: "", occupation: "",
  company: "", currentAddress: "", permanentAddress: "", aadhaar: "",
  emergencyName: "", emergencyRelation: "", emergencyPhone: "",
  parentName: "", parentPhone: "", guardianName: "", guardianPhone: "",
  stayType: "monthly",
  checkInDate: new Date().toISOString().split("T")[0],
  checkOutDate: "",
  openEndedStay: false,
  selectedBedId: "",
  monthlyRent: "", depositAmount: "", advancePaid: "",
  bookingSource: "",
  documents: [],
  paymentProofs: [],
  agreedToTerms: false,
};

function draftKey(token: string) { return `nestpro_checkin_${token}`; }

interface Props { token: string }

export default function CheckInPortal({ token }: Props) {
  const [step, setStep] = useState(0);
  const [property, setProperty] = useState<PropertyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

  const [form, setForm] = useState<FormData>(() => {
    try {
      const saved = localStorage.getItem(draftKey(token));
      if (saved) return { ...EMPTY_FORM, ...JSON.parse(saved), documents: [], paymentProofs: [] };
    } catch {}
    return { ...EMPTY_FORM };
  });

  // Auto-save draft on every change
  useEffect(() => {
    try {
      const toSave = { ...form, documents: [], paymentProofs: [] }; // don't persist large files
      localStorage.setItem(draftKey(token), JSON.stringify(toSave));
    } catch {}
  }, [form, token]);

  useEffect(() => {
    apiFetch(`/checkin/${token}`)
      .then((data: PropertyInfo) => {
        setProperty(data);
        // Pre-fill bed if assigned
        if (data.assignedBed) {
          setForm((f) => ({
            ...f,
            selectedBedId: String(data.assignedBed!.bedId),
            monthlyRent: f.monthlyRent || String(data.assignedBed!.monthlyRent ?? ""),
          }));
        }
      })
      .catch((e: Error) => {
        if (e.message.includes("approved")) setAlreadySubmitted(true);
        else setError(e.message);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const set = <K extends keyof FormData>(key: K, val: FormData[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const validate = (): string => {
    if (step === 1) {
      if (!form.fullName.trim()) return "Full name is required.";
      const phoneDigits = form.phone.replace(/\D/g, "");
      if (!phoneDigits) return "Phone number is required.";
      if (phoneDigits.length !== 10) return "Please enter a valid 10-digit Indian mobile number.";
      if (!form.dob) return "Date of birth is required.";
      if (!form.gender) return "Please select your gender.";
      if (!form.currentAddress.trim()) return "Current address is required.";
    }
    if (step === 2) {
      if (!form.emergencyName.trim()) return "Emergency contact name is required.";
      if (!form.emergencyPhone.trim()) return "Emergency contact phone is required.";
    }
    if (step === 3) {
      if (!form.stayType) return "Please select a stay type.";
      if (!form.checkInDate) return "Check-in date is required.";
      if (!form.openEndedStay && !form.checkOutDate) return "Please select a check-out date or mark as open-ended.";
      if (!form.selectedBedId && (property?.availableBeds?.length ?? 0) > 0) return "Please select a bed.";
      if (!form.bookingSource) return "Please tell us how you found this property.";
      if (!form.monthlyRent) return "Monthly rent is required.";
    }
    if (step === 6) {
      if (!form.agreedToTerms) return "You must agree to the house rules to proceed.";
    }
    return "";
  };

  const handleNext = () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError("");
    if (step === 0) { setStep(1); return; }
    if (step < 6) { setStep((s) => s + 1); return; }
    handleSubmit();
  };

  const handleBack = () => {
    setError("");
    setStep((s) => Math.max(0, s - 1));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      await apiFetch(`/checkin/${token}/submit`, {
        method: "POST",
        body: JSON.stringify({
          ...form,
          // strip large file data from localStorage-safe payload, include summary
          documents: form.documents.map((d) => ({ name: d.name, type: d.type, size: d.size, docType: d.docType, dataUrl: d.dataUrl })),
          paymentProofs: form.paymentProofs.map((p) => ({ name: p.name, type: p.type, size: p.size, dataUrl: p.dataUrl })),
        }),
      });
      localStorage.removeItem(draftKey(token));
      setSubmitted(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── File upload handler ──────────────────────────────────────────────────────
  async function handleFileUpload(
    files: FileList | null,
    field: "documents" | "paymentProofs",
    docType = "Document"
  ) {
    if (!files || files.length === 0) return;
    const MAX_SIZE = 4 * 1024 * 1024; // 4MB
    const newFiles: UploadedFile[] = [];
    for (const file of Array.from(files)) {
      if (file.size > MAX_SIZE) { setError(`${file.name} is too large (max 4MB).`); return; }
      try {
        const dataUrl = await readFileAsDataUrl(file);
        newFiles.push({ name: file.name, type: file.type, size: file.size, dataUrl, docType });
      } catch { setError("Failed to read file. Please try again."); return; }
    }
    setError("");
    setForm((f) => ({ ...f, [field]: [...f[field], ...newFiles] }));
  }

  function removeFile(field: "documents" | "paymentProofs", idx: number) {
    setForm((f) => ({ ...f, [field]: f[field].filter((_, i) => i !== idx) }));
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (alreadySubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="text-center max-w-xs">
          <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Already Processed</h2>
          <p className="text-sm text-gray-500">Your check-in has been approved. Please contact your property manager for details.</p>
        </div>
      </div>
    );
  }

  if (error && !property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="text-center max-w-xs">
          <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-400" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Invalid Link</h2>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-6">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-xs">
          <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="h-10 w-10 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Submitted!</h1>
          <p className="text-gray-500 text-sm mb-5">
            Your registration for <strong>{property?.name}</strong> has been received.
          </p>
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-left space-y-2">
            <p className="text-sm font-semibold text-blue-700">What happens next?</p>
            <p className="text-sm text-blue-600">• Manager reviews your documents</p>
            <p className="text-sm text-blue-600">• You'll be contacted on {form.phone}</p>
            <p className="text-sm text-blue-600">• Bed assigned upon approval</p>
          </div>
        </motion.div>
      </div>
    );
  }

  const typeLabel = property?.type?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) ?? "Property";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header + Progress */}
      <div className="bg-white border-b px-4 py-3 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
            <Building2 className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-gray-900 text-sm truncate">{property?.name}</p>
            <p className="text-[11px] text-gray-400">{STEPS[step].label} · Step {step + 1} / {STEPS.length}</p>
          </div>
        </div>
        <div className="flex gap-0.5 mt-3 max-w-lg mx-auto">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < step ? "bg-blue-600" : i === step ? "bg-blue-400" : "bg-gray-200"}`} />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 py-6">
          <AnimatePresence mode="wait">
            {step === 0 && <WelcomeStep key="s0" property={property} typeLabel={typeLabel} />}
            {step === 1 && <PersonalStep key="s1" form={form} set={set} />}
            {step === 2 && <EmergencyStep key="s2" form={form} set={set} />}
            {step === 3 && <StayRoomStep key="s3" form={form} set={set} property={property} />}
            {step === 4 && <DocumentsStep key="s4" form={form} onUpload={handleFileUpload} onRemove={removeFile} />}
            {step === 5 && <PaymentStep key="s5" form={form} onUpload={handleFileUpload} onRemove={removeFile} />}
            {step === 6 && <TermsStep key="s6" form={form} set={set} />}
          </AnimatePresence>

          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="mt-4 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Bottom Nav */}
      <div className="sticky bottom-0 bg-white border-t px-4 py-3 shadow-lg">
        <div className="max-w-lg mx-auto flex gap-3">
          {step > 0 && (
            <button onClick={handleBack}
              className="flex items-center gap-1 px-5 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition">
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
          )}
          <button onClick={handleNext} disabled={submitting}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl disabled:opacity-50 transition text-sm">
            {submitting ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
            ) : step === 6 ? (
              <><Send className="h-4 w-4" /> Submit Registration</>
            ) : (
              <>Continue <ChevronRight className="h-4 w-4" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Step components ────────────────────────────────────────────────────────────

function Slide({ children }: { children: React.ReactNode }) {
  return (
    <motion.div key={Math.random()} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.18 }} className="space-y-4">
      {children}
    </motion.div>
  );
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

function Inp(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input {...props}
      className={`w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${props.className ?? ""}`} />
  );
}

function Sel(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props}
      className={`w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${props.className ?? ""}`} />
  );
}

function WelcomeStep({ property, typeLabel }: { property: PropertyInfo | null; typeLabel: string }) {
  return (
    <Slide>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome! 🏠</h1>
        <p className="text-sm text-gray-400">Complete your digital check-in in ~3 minutes.</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
        <div className="flex items-start gap-3">
          <Building2 className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
          <div>
            <p className="font-bold text-gray-900">{property?.name}</p>
            <p className="text-xs text-gray-400">{typeLabel}</p>
          </div>
        </div>
        {property?.address && (
          <div className="flex items-start gap-3">
            <MapPin className="h-4 w-4 text-gray-300 mt-0.5 shrink-0" />
            <p className="text-sm text-gray-500">{property.address}, {property.city}, {property.state}</p>
          </div>
        )}
        {property?.phone && (
          <div className="flex items-center gap-3">
            <Phone className="h-4 w-4 text-gray-300 shrink-0" />
            <p className="text-sm text-gray-500">{property.phone}</p>
          </div>
        )}
        {property?.assignedBed && (
          <div className="flex items-center gap-3">
            <BedDouble className="h-4 w-4 text-green-500 shrink-0" />
            <p className="text-sm text-gray-700 font-medium">
              Pre-assigned: Room {property.assignedBed.roomNumber} — Bed {property.assignedBed.bedLabel}
              {property.assignedBed.monthlyRent ? ` · ₹${property.assignedBed.monthlyRent.toLocaleString("en-IN")}/mo` : ""}
            </p>
          </div>
        )}
      </div>
      <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
        <p className="text-sm font-semibold text-blue-700 mb-2">You'll need to provide:</p>
        <div className="space-y-1 text-sm text-blue-600">
          <p>✓ Personal info & address</p>
          <p>✓ Emergency contact</p>
          <p>✓ Stay dates & room selection</p>
          <p>✓ ID document (photo/PDF)</p>
          <p>✓ Payment proof (optional)</p>
        </div>
      </div>
      <p className="text-xs text-gray-400 text-center">Your progress is saved automatically — you can go back anytime.</p>
    </Slide>
  );
}

function PersonalStep({ form, set }: { form: FormData; set: any }) {
  return (
    <Slide>
      <div>
        <h2 className="text-xl font-bold text-gray-900">Personal Information</h2>
        <p className="text-xs text-gray-400 mt-1">Fill in your details as they appear on your ID.</p>
      </div>
      <Field label="Full Name *"><Inp value={form.fullName} onChange={(e) => set("fullName", e.target.value)} placeholder="As per government ID" /></Field>
      <Field label="Mobile Number *" hint="10-digit Indian number (e.g. 9876543210)">
        <Inp value={form.phone} onChange={(e) => set("phone", e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="9876543210" type="tel" inputMode="numeric" maxLength={10} />
      </Field>
      <Field label="Email Address"><Inp value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="your@email.com" type="email" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date of Birth *"><Inp value={form.dob} onChange={(e) => set("dob", e.target.value)} type="date" /></Field>
        <Field label="Gender *">
          <Sel value={form.gender} onChange={(e) => set("gender", e.target.value)}>
            <option value="">Select</option>
            {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
          </Sel>
        </Field>
      </div>
      <Field label="Occupation"><Inp value={form.occupation} onChange={(e) => set("occupation", e.target.value)} placeholder="Student / Software Engineer / etc." /></Field>
      <Field label="College / Company"><Inp value={form.company} onChange={(e) => set("company", e.target.value)} placeholder="University or employer name" /></Field>
      <Field label="Aadhaar Number" hint="Optional — 12 digits"><Inp value={form.aadhaar} onChange={(e) => set("aadhaar", e.target.value.replace(/\D/g, "").slice(0, 12))} placeholder="123456789012" inputMode="numeric" /></Field>
      <Field label="Current Address *"><textarea value={form.currentAddress} onChange={(e) => set("currentAddress", e.target.value)} placeholder="Your current full address" rows={2} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" /></Field>
      <Field label="Permanent Address"><textarea value={form.permanentAddress} onChange={(e) => set("permanentAddress", e.target.value)} placeholder="If different from current" rows={2} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" /></Field>
    </Slide>
  );
}

function EmergencyStep({ form, set }: { form: FormData; set: any }) {
  return (
    <Slide>
      <div>
        <h2 className="text-xl font-bold text-gray-900">Emergency Contact</h2>
        <p className="text-xs text-gray-400 mt-1">We'll contact them only in emergencies.</p>
      </div>
      <Field label="Contact Name *"><Inp value={form.emergencyName} onChange={(e) => set("emergencyName", e.target.value)} placeholder="Full name" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Relationship"><Inp value={form.emergencyRelation} onChange={(e) => set("emergencyRelation", e.target.value)} placeholder="Mother / Friend" /></Field>
        <Field label="Phone Number *"><Inp value={form.emergencyPhone} onChange={(e) => set("emergencyPhone", e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="10-digit" type="tel" inputMode="numeric" /></Field>
      </div>
      <div className="border-t border-gray-100 pt-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Parent / Guardian (Optional)</p>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Parent Name"><Inp value={form.parentName} onChange={(e) => set("parentName", e.target.value)} placeholder="Name" /></Field>
            <Field label="Parent Phone"><Inp value={form.parentPhone} onChange={(e) => set("parentPhone", e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="10-digit" inputMode="numeric" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Guardian Name"><Inp value={form.guardianName} onChange={(e) => set("guardianName", e.target.value)} placeholder="Name" /></Field>
            <Field label="Guardian Phone"><Inp value={form.guardianPhone} onChange={(e) => set("guardianPhone", e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="10-digit" inputMode="numeric" /></Field>
          </div>
        </div>
      </div>
    </Slide>
  );
}

function StayRoomStep({ form, set, property }: { form: FormData; set: any; property: PropertyInfo | null }) {
  const beds = property?.availableBeds ?? [];
  const hasAssigned = !!property?.assignedBed;

  return (
    <Slide>
      <div>
        <h2 className="text-xl font-bold text-gray-900">Stay & Room</h2>
        <p className="text-xs text-gray-400 mt-1">Tell us about your stay.</p>
      </div>

      {/* Stay type */}
      <Field label="Stay Type *">
        <div className="grid grid-cols-2 gap-2">
          {STAY_TYPES.map((s) => (
            <button key={s.value} type="button" onClick={() => set("stayType", s.value)}
              className={`p-3 rounded-xl border-2 text-left transition-all ${form.stayType === s.value ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white hover:border-gray-300"}`}>
              <span className="text-lg block mb-0.5">{s.icon}</span>
              <span className={`text-sm font-semibold block ${form.stayType === s.value ? "text-blue-700" : "text-gray-800"}`}>{s.label}</span>
              <span className="text-xs text-gray-400">{s.desc}</span>
            </button>
          ))}
        </div>
      </Field>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Check-In Date *"><Inp value={form.checkInDate} onChange={(e) => set("checkInDate", e.target.value)} type="date" /></Field>
        <Field label="Check-Out Date">
          <Inp value={form.checkOutDate} onChange={(e) => set("checkOutDate", e.target.value)} type="date" disabled={form.openEndedStay} className={form.openEndedStay ? "opacity-40" : ""} />
        </Field>
      </div>
      <button type="button" onClick={() => set("openEndedStay", !form.openEndedStay)}
        className={`flex items-center gap-3 w-full p-3 rounded-xl border-2 transition-all ${form.openEndedStay ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white"}`}>
        <div className={`h-5 w-5 rounded flex items-center justify-center shrink-0 ${form.openEndedStay ? "bg-blue-500" : "border-2 border-gray-300"}`}>
          {form.openEndedStay && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
        </div>
        <span className={`text-sm font-medium ${form.openEndedStay ? "text-blue-700" : "text-gray-600"}`}>Open-ended stay (no fixed check-out)</span>
      </button>

      {/* Bed selection */}
      {hasAssigned ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <BedDouble className="h-5 w-5 text-green-600 shrink-0" />
          <div>
            <p className="text-sm font-bold text-green-700">Bed Pre-Assigned</p>
            <p className="text-sm text-green-600">Room {property!.assignedBed!.roomNumber} — Bed {property!.assignedBed!.bedLabel}</p>
          </div>
        </div>
      ) : beds.length > 0 ? (
        <Field label="Select Your Bed *">
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {beds.map((bed) => (
              <button key={bed.id} type="button" onClick={() => { set("selectedBedId", String(bed.id)); set("monthlyRent", form.monthlyRent || String(bed.monthlyRent ?? "")); }}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${form.selectedBedId === String(bed.id) ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white hover:border-gray-300"}`}>
                <BedDouble className={`h-4 w-4 shrink-0 ${form.selectedBedId === String(bed.id) ? "text-blue-500" : "text-gray-300"}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${form.selectedBedId === String(bed.id) ? "text-blue-700" : "text-gray-800"}`}>
                    {bed.buildingName} · {bed.floorName} · Room {bed.roomNumber} · Bed {bed.label}
                  </p>
                  {bed.monthlyRent && <p className="text-xs text-gray-400">₹{bed.monthlyRent.toLocaleString("en-IN")}/month</p>}
                </div>
                {form.selectedBedId === String(bed.id) && <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0" />}
              </button>
            ))}
          </div>
        </Field>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700">
          No beds available yet. Your manager will assign one on approval.
        </div>
      )}

      {/* Booking source */}
      <Field label="How did you find us? *">
        <div className="grid grid-cols-2 gap-2">
          {BOOKING_SOURCES.map((src) => (
            <button key={src} type="button" onClick={() => set("bookingSource", src)}
              className={`px-3 py-2 rounded-xl border text-sm font-medium text-left transition-all ${form.bookingSource === src ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"}`}>
              {src}
            </button>
          ))}
        </div>
      </Field>

      {/* Rent */}
      <div className="grid grid-cols-3 gap-3">
        <Field label="Monthly Rent (₹) *"><Inp value={form.monthlyRent} onChange={(e) => set("monthlyRent", e.target.value)} type="number" placeholder="8000" inputMode="numeric" /></Field>
        <Field label="Security Deposit (₹)"><Inp value={form.depositAmount} onChange={(e) => set("depositAmount", e.target.value)} type="number" placeholder="16000" inputMode="numeric" /></Field>
        <Field label="Advance Paid (₹)"><Inp value={form.advancePaid} onChange={(e) => set("advancePaid", e.target.value)} type="number" placeholder="0" inputMode="numeric" /></Field>
      </div>
    </Slide>
  );
}

function UploadBox({ label, accept, onUpload, multiple = false }: {
  label: string; accept: string;
  onUpload: (files: FileList | null) => void;
  multiple?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <button type="button" onClick={() => ref.current?.click()}
      className="w-full border-2 border-dashed border-gray-200 rounded-xl p-5 flex flex-col items-center gap-2 hover:border-blue-400 hover:bg-blue-50 transition-all group">
      <Upload className="h-6 w-6 text-gray-300 group-hover:text-blue-400 transition-colors" />
      <p className="text-sm font-medium text-gray-500 group-hover:text-blue-600">{label}</p>
      <p className="text-xs text-gray-300">JPG, PNG, PDF — max 4MB</p>
      <input ref={ref} type="file" accept={accept} className="hidden" multiple={multiple}
        onChange={(e) => { onUpload(e.target.files); e.target.value = ""; }} />
    </button>
  );
}

function FileChip({ file, onRemove }: { file: UploadedFile; onRemove: () => void }) {
  const isImage = file.type.startsWith("image/");
  return (
    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl p-2.5">
      {isImage ? (
        <img src={file.dataUrl} alt={file.name} className="h-10 w-10 rounded-lg object-cover shrink-0" />
      ) : (
        <div className="h-10 w-10 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
          <FileText className="h-5 w-5 text-red-400" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-700 truncate">{file.docType}</p>
        <p className="text-[11px] text-gray-400 truncate">{file.name} · {(file.size / 1024).toFixed(0)}KB</p>
      </div>
      <button type="button" onClick={onRemove} className="shrink-0 text-gray-300 hover:text-red-400 transition-colors">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

function DocumentsStep({ form, onUpload, onRemove }: {
  form: FormData;
  onUpload: (files: FileList | null, field: "documents" | "paymentProofs", docType?: string) => void;
  onRemove: (field: "documents" | "paymentProofs", idx: number) => void;
}) {
  const [selectedDocType, setSelectedDocType] = useState("Aadhaar Card");

  return (
    <Slide>
      <div>
        <h2 className="text-xl font-bold text-gray-900">Identity Documents</h2>
        <p className="text-xs text-gray-400 mt-1">Upload a photo or PDF of your ID. Front + back preferred.</p>
      </div>

      <Field label="Document Type">
        <Sel value={selectedDocType} onChange={(e) => setSelectedDocType(e.target.value)}>
          {DOC_TYPES.map((d) => <option key={d} value={d}>{d}</option>)}
        </Sel>
      </Field>

      <UploadBox
        label={`Upload ${selectedDocType}`}
        accept="image/*,.pdf"
        multiple
        onUpload={(files) => onUpload(files, "documents", selectedDocType)}
      />

      {form.documents.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Uploaded ({form.documents.length})</p>
          <div className="space-y-2">
            {form.documents.map((doc, i) => (
              <FileChip key={i} file={doc} onRemove={() => onRemove("documents", i)} />
            ))}
          </div>
        </div>
      )}

      {form.documents.length === 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
          <p className="text-xs text-amber-600 font-medium">At least one ID document is strongly recommended for faster approval.</p>
        </div>
      )}
    </Slide>
  );
}

function PaymentStep({ form, onUpload, onRemove }: {
  form: FormData;
  onUpload: (files: FileList | null, field: "documents" | "paymentProofs", docType?: string) => void;
  onRemove: (field: "documents" | "paymentProofs", idx: number) => void;
}) {
  return (
    <Slide>
      <div>
        <h2 className="text-xl font-bold text-gray-900">Payment Proof</h2>
        <p className="text-xs text-gray-400 mt-1">Optional — upload a screenshot of any payment you've made.</p>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <p className="text-sm font-semibold text-blue-700 mb-1">Accepted proof types:</p>
        <p className="text-sm text-blue-600">UPI screenshot · Bank transfer · Booking.com invoice · Agoda receipt · Cash receipt · PDF invoice</p>
      </div>

      <UploadBox
        label="Upload Payment Screenshot or Receipt"
        accept="image/*,.pdf"
        multiple
        onUpload={(files) => onUpload(files, "paymentProofs", "Payment Proof")}
      />

      {form.paymentProofs.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Uploaded ({form.paymentProofs.length})</p>
          <div className="space-y-2">
            {form.paymentProofs.map((pf, i) => (
              <FileChip key={i} file={pf} onRemove={() => onRemove("paymentProofs", i)} />
            ))}
          </div>
        </div>
      )}

      {form.paymentProofs.length === 0 && (
        <p className="text-xs text-gray-400 text-center">You can skip this — payment can be recorded later by your manager.</p>
      )}
    </Slide>
  );
}

function TermsStep({ form, set }: { form: FormData; set: any }) {
  return (
    <Slide>
      <div>
        <h2 className="text-xl font-bold text-gray-900">House Rules & Terms</h2>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-2 text-sm text-gray-700 max-h-64 overflow-y-auto">
        <p className="font-bold text-gray-900 mb-2">General Rules</p>
        {[
          "Guests must not disturb other residents. Quiet hours: 10 PM – 7 AM.",
          "No overnight visitors without prior permission from management.",
          "Keep common areas (kitchen, bathrooms, lobby) clean after use.",
          "Rent is due on or before the 5th of every month.",
          "A late fee may apply for payments received after the 10th.",
          "30 days' written notice required before vacating the property.",
          "Security deposit is refundable upon satisfactory checkout.",
          "Any damages to property will be deducted from the deposit.",
          "Cooking in rooms is not permitted unless specified.",
          "Management reserves the right to modify rules with reasonable notice.",
          "All guests must comply with local laws and regulations.",
        ].map((rule, i) => <p key={i} className="text-gray-600">• {rule}</p>)}
      </div>

      <button type="button" onClick={() => set("agreedToTerms", !form.agreedToTerms)}
        className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${form.agreedToTerms ? "border-green-500 bg-green-50" : "border-gray-200 bg-white"}`}>
        <div className={`h-6 w-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${form.agreedToTerms ? "bg-green-500" : "border-2 border-gray-300"}`}>
          {form.agreedToTerms && <CheckCircle2 className="h-4 w-4 text-white" />}
        </div>
        <p className={`text-sm font-medium text-left ${form.agreedToTerms ? "text-green-700" : "text-gray-600"}`}>
          I have read and agree to all house rules and terms & conditions.
        </p>
      </button>

      <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-400 text-center">
        By submitting, you confirm all information is accurate. The management team will review your registration and contact you shortly.
      </div>
    </Slide>
  );
}
