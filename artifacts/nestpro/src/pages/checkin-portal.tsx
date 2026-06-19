import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, CheckCircle2, ChevronRight, ChevronLeft, Loader2,
  User, Phone, Mail, MapPin, Users, Calendar, CreditCard,
  Briefcase, Heart, Shield, FileText, Send,
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

const BOOKING_SOURCES = [
  "Direct Walk-In", "WhatsApp", "Google Search", "Booking.com",
  "Agoda", "Airbnb", "Hostelworld", "MakeMyTrip", "Goibibo", "OYO",
  "Travel Agent", "Other",
];

const GENDERS = ["Male", "Female", "Non-binary", "Prefer not to say"];

interface PropertyInfo {
  name: string;
  address: string;
  city: string;
  state: string;
  phone: string | null;
  type: string;
  bedLabel?: string;
}

interface FormData {
  // Personal
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
  // Emergency
  emergencyName: string;
  emergencyRelation: string;
  emergencyPhone: string;
  parentName: string;
  parentPhone: string;
  guardianName: string;
  guardianPhone: string;
  // Stay
  bookingSource: string;
  moveInDate: string;
  expectedMonths: string;
  monthlyRent: string;
  depositAmount: string;
  advancePaid: string;
  // Terms
  agreedToTerms: boolean;
}

const STEPS = [
  { label: "Welcome", icon: Building2 },
  { label: "Personal Info", icon: User },
  { label: "Emergency Contact", icon: Heart },
  { label: "Stay Details", icon: CreditCard },
  { label: "Terms & Submit", icon: FileText },
];

interface Props { token: string }

export default function CheckInPortal({ token }: Props) {
  const [step, setStep] = useState(0);
  const [property, setProperty] = useState<PropertyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState<FormData>({
    fullName: "", phone: "", email: "", dob: "", gender: "", occupation: "",
    company: "", currentAddress: "", permanentAddress: "", aadhaar: "",
    emergencyName: "", emergencyRelation: "", emergencyPhone: "",
    parentName: "", parentPhone: "", guardianName: "", guardianPhone: "",
    bookingSource: "", moveInDate: new Date().toISOString().split("T")[0],
    expectedMonths: "12", monthlyRent: "", depositAmount: "", advancePaid: "",
    agreedToTerms: false,
  });

  useEffect(() => {
    apiFetch(`/checkin/${token}`)
      .then((data) => setProperty(data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  const set = (key: keyof FormData, val: string | boolean) =>
    setForm((f) => ({ ...f, [key]: val }));

  const validate = (): string => {
    if (step === 1) {
      if (!form.fullName.trim()) return "Full name is required.";
      if (!form.phone.trim()) return "Phone number is required.";
      if (!form.dob) return "Date of birth is required.";
      if (!form.gender) return "Please select your gender.";
      if (!form.currentAddress.trim()) return "Current address is required.";
    }
    if (step === 2) {
      if (!form.emergencyName.trim()) return "Emergency contact name is required.";
      if (!form.emergencyPhone.trim()) return "Emergency contact phone is required.";
    }
    if (step === 3) {
      if (!form.bookingSource) return "Please select how you found this property.";
      if (!form.moveInDate) return "Move-in date is required.";
      if (!form.monthlyRent) return "Monthly rent is required.";
    }
    if (step === 4) {
      if (!form.agreedToTerms) return "You must agree to the terms to proceed.";
    }
    return "";
  };

  const handleNext = () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError("");
    if (step === 0) { setStep(1); return; }
    if (step < 4) { setStep((s) => s + 1); return; }
    handleSubmit();
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      await apiFetch(`/checkin/${token}/submit`, {
        method: "POST",
        body: JSON.stringify(form),
      });
      setSubmitted(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error && !property && !submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="text-center max-w-xs">
          <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-red-400" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Invalid or Expired Link</h2>
          <p className="text-sm text-gray-500">
            This check-in link is no longer valid. Please ask your property manager to generate a new one.
          </p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-xs"
        >
          <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="h-10 w-10 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Registration Submitted!</h1>
          <p className="text-gray-500 mb-4">
            Your check-in request for <strong>{property?.name}</strong> has been submitted.
          </p>
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-left">
            <p className="text-sm font-semibold text-blue-700 mb-1">What happens next?</p>
            <ul className="text-sm text-blue-600 space-y-1">
              <li>• The property manager will review your details</li>
              <li>• You'll be contacted on your phone number</li>
              <li>• Your bed will be assigned on approval</li>
            </ul>
          </div>
        </motion.div>
      </div>
    );
  }

  const typeLabel = property?.type?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) ?? "Property";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-5 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-gray-900 text-sm leading-tight truncate">{property?.name}</p>
            <p className="text-xs text-gray-400 truncate">{typeLabel} · Digital Check-In</p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-1 mt-3">
          {STEPS.map((s, i) => (
            <div
              key={s.label}
              className={`h-1 flex-1 rounded-full transition-all ${
                i < step ? "bg-blue-600" : i === step ? "bg-blue-400" : "bg-gray-200"
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-1">{STEPS[step].label} · Step {step + 1} of {STEPS.length}</p>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 py-6 overflow-y-auto max-w-lg mx-auto w-full">
        <AnimatePresence mode="wait">
          {/* STEP 0 — Welcome */}
          {step === 0 && (
            <motion.div key="s0" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome!</h1>
              <p className="text-gray-500 text-sm mb-6">Please complete your digital check-in. It takes about 3 minutes.</p>

              <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3 mb-6">
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold text-gray-900">{property?.name}</p>
                    <p className="text-sm text-gray-500">{typeLabel}</p>
                  </div>
                </div>
                {property?.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-gray-600">{property.address}, {property.city}, {property.state}</p>
                  </div>
                )}
                {property?.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                    <p className="text-sm text-gray-600">{property.phone}</p>
                  </div>
                )}
                {property?.bedLabel && (
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    <p className="text-sm text-gray-700">Assigned bed: <strong>{property.bedLabel}</strong></p>
                  </div>
                )}
              </div>

              <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                <p className="text-sm font-semibold text-blue-700 mb-2">You'll need to provide:</p>
                <div className="space-y-1 text-sm text-blue-600">
                  <p>✓ Personal information & address</p>
                  <p>✓ Emergency contact details</p>
                  <p>✓ Stay & payment information</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 1 — Personal Info */}
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900">Personal Information</h2>
              <p className="text-sm text-gray-400 -mt-2">Please fill in your details accurately.</p>

              <Field label="Full Name *"><input value={form.fullName} onChange={(e) => set("fullName", e.target.value)} placeholder="As per government ID" className="inp" /></Field>
              <Field label="Phone Number *"><input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+91 98765 43210" type="tel" className="inp" /></Field>
              <Field label="Email Address"><input value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="your@email.com" type="email" className="inp" /></Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Date of Birth *"><input value={form.dob} onChange={(e) => set("dob", e.target.value)} type="date" className="inp" /></Field>
                <Field label="Gender *">
                  <select value={form.gender} onChange={(e) => set("gender", e.target.value)} className="inp">
                    <option value="">Select</option>
                    {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </Field>
              </div>

              <Field label="Occupation"><input value={form.occupation} onChange={(e) => set("occupation", e.target.value)} placeholder="Student / Software Engineer / etc." className="inp" /></Field>
              <Field label="College / Company"><input value={form.company} onChange={(e) => set("company", e.target.value)} placeholder="University or Employer name" className="inp" /></Field>
              <Field label="Aadhaar Number"><input value={form.aadhaar} onChange={(e) => set("aadhaar", e.target.value)} placeholder="XXXX XXXX XXXX" className="inp" maxLength={14} /></Field>
              <Field label="Current Address *"><textarea value={form.currentAddress} onChange={(e) => set("currentAddress", e.target.value)} placeholder="Your current address" rows={2} className="inp resize-none" /></Field>
              <Field label="Permanent Address"><textarea value={form.permanentAddress} onChange={(e) => set("permanentAddress", e.target.value)} placeholder="If different from above" rows={2} className="inp resize-none" /></Field>
            </motion.div>
          )}

          {/* STEP 2 — Emergency Contact */}
          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900">Emergency Contact</h2>
              <p className="text-sm text-gray-400 -mt-2">We'll contact them if we can't reach you.</p>

              <Field label="Contact Name *"><input value={form.emergencyName} onChange={(e) => set("emergencyName", e.target.value)} placeholder="Full name" className="inp" /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Relationship"><input value={form.emergencyRelation} onChange={(e) => set("emergencyRelation", e.target.value)} placeholder="Mother / Friend" className="inp" /></Field>
                <Field label="Phone *"><input value={form.emergencyPhone} onChange={(e) => set("emergencyPhone", e.target.value)} placeholder="+91..." type="tel" className="inp" /></Field>
              </div>

              <div className="border-t pt-4 mt-2">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Parent / Guardian (Optional)</p>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Parent Name"><input value={form.parentName} onChange={(e) => set("parentName", e.target.value)} placeholder="Name" className="inp" /></Field>
                    <Field label="Parent Phone"><input value={form.parentPhone} onChange={(e) => set("parentPhone", e.target.value)} placeholder="+91..." type="tel" className="inp" /></Field>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Guardian Name"><input value={form.guardianName} onChange={(e) => set("guardianName", e.target.value)} placeholder="Name" className="inp" /></Field>
                    <Field label="Guardian Phone"><input value={form.guardianPhone} onChange={(e) => set("guardianPhone", e.target.value)} placeholder="+91..." type="tel" className="inp" /></Field>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3 — Stay Details */}
          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900">Stay & Payment</h2>
              <p className="text-sm text-gray-400 -mt-2">Your booking and rental information.</p>

              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">How did you find us? *</p>
                <div className="grid grid-cols-2 gap-2">
                  {BOOKING_SOURCES.map((src) => (
                    <button
                      key={src}
                      onClick={() => set("bookingSource", src)}
                      className={`px-3 py-2 rounded-xl text-sm font-medium text-left transition-all border ${
                        form.bookingSource === src
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
                      }`}
                    >
                      {src}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Move-In Date *"><input value={form.moveInDate} onChange={(e) => set("moveInDate", e.target.value)} type="date" className="inp" /></Field>
                <Field label="Expected Stay (months)"><input value={form.expectedMonths} onChange={(e) => set("expectedMonths", e.target.value)} type="number" min="1" className="inp" /></Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Monthly Rent (₹) *"><input value={form.monthlyRent} onChange={(e) => set("monthlyRent", e.target.value)} type="number" placeholder="8000" className="inp" /></Field>
                <Field label="Security Deposit (₹)"><input value={form.depositAmount} onChange={(e) => set("depositAmount", e.target.value)} type="number" placeholder="16000" className="inp" /></Field>
              </div>

              <Field label="Advance Paid (₹)"><input value={form.advancePaid} onChange={(e) => set("advancePaid", e.target.value)} type="number" placeholder="0" className="inp" /></Field>
            </motion.div>
          )}

          {/* STEP 4 — Terms */}
          {step === 4 && (
            <motion.div key="s4" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900">House Rules & Terms</h2>

              <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3 text-sm text-gray-700">
                <p className="font-bold text-gray-900">General Rules</p>
                <ul className="space-y-2 text-gray-600">
                  <li>• Guests must not disturb other residents. Quiet hours: 10 PM – 7 AM.</li>
                  <li>• No overnight visitors without prior permission from management.</li>
                  <li>• Keep common areas (kitchen, bathrooms, lobby) clean after use.</li>
                  <li>• Rent is due on or before the 5th of every month.</li>
                  <li>• A late fee may apply for payments received after the 10th.</li>
                  <li>• 30 days' written notice required before vacating the property.</li>
                  <li>• Security deposit is refundable upon satisfactory checkout.</li>
                  <li>• Any damages to property will be deducted from the deposit.</li>
                  <li>• Cooking in rooms is not permitted unless specified.</li>
                  <li>• Management reserves the right to modify rules with notice.</li>
                </ul>
              </div>

              <button
                onClick={() => set("agreedToTerms", !form.agreedToTerms)}
                className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                  form.agreedToTerms
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 bg-white"
                }`}
              >
                <div className={`h-6 w-6 rounded-lg flex items-center justify-center shrink-0 ${
                  form.agreedToTerms ? "bg-green-500" : "border-2 border-gray-300"
                }`}>
                  {form.agreedToTerms && <CheckCircle2 className="h-4 w-4 text-white" />}
                </div>
                <p className={`text-sm font-medium text-left ${form.agreedToTerms ? "text-green-700" : "text-gray-600"}`}>
                  I have read and agree to all house rules and terms & conditions.
                </p>
              </button>

              <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-400">
                By submitting, you confirm that all information provided is accurate and true.
                The property management team will review your registration and contact you.
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-3 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3"
          >
            {error}
          </motion.p>
        )}
      </div>

      {/* Bottom nav */}
      <div className="sticky bottom-0 bg-white border-t px-5 py-4 flex gap-3">
        {step > 0 && (
          <button
            onClick={() => { setError(""); setStep((s) => s - 1); }}
            className="flex items-center gap-1 px-4 py-3 rounded-xl border text-gray-600 text-sm font-medium"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
        )}
        <button
          onClick={handleNext}
          disabled={submitting}
          className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-3 rounded-xl disabled:opacity-50 transition-colors hover:bg-blue-700"
        >
          {submitting ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
          ) : step === 4 ? (
            <><Send className="h-4 w-4" /> Submit Registration</>
          ) : (
            <>Continue <ChevronRight className="h-4 w-4" /></>
          )}
        </button>
      </div>

      <style>{`
        .inp { width: 100%; padding: 0.625rem 0.875rem; border-radius: 0.75rem; border: 1px solid #e5e7eb; background: #f9fafb; font-size: 0.875rem; color: #111827; outline: none; }
        .inp:focus { box-shadow: 0 0 0 2px #3b82f6; border-color: transparent; }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
