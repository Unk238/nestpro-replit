import React, { useState } from "react";
import { Layout } from "@/components/layout";
import {
  Building2, User, Phone, Mail, Tag, Save, CheckCircle2,
  Shield, Bell, Palette, Users, Globe,
} from "lucide-react";
import { motion } from "framer-motion";

const BIZ_KEY = "nestpro_business";
const USER_KEY = "nestpro_user";

const SECTIONS = [
  { id: "business", label: "Business Profile", icon: Building2 },
  { id: "account", label: "My Account", icon: User },
  { id: "team", label: "Team & Roles", icon: Users },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
];

function getBiz() {
  try { return JSON.parse(localStorage.getItem(BIZ_KEY) ?? "null") ?? { name: "", phone: "", email: "", categories: [] }; } catch { return { name: "", phone: "", email: "", categories: [] }; }
}
function getUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY) ?? "null") ?? { name: "", email: "" }; } catch { return { name: "", email: "" }; }
}

const ROLES_INFO = [
  {
    role: "Owner",
    color: "bg-blue-50 border-blue-200 text-blue-700",
    badge: "bg-blue-600",
    perms: ["Full control over everything", "Manage subscriptions & billing", "Delete properties and accounts", "Add/remove team members"],
  },
  {
    role: "Manager",
    color: "bg-green-50 border-green-200 text-green-700",
    badge: "bg-green-600",
    perms: ["Manage guests, rooms, payments", "Manage complaints", "Add/remove operators", "Cannot access billing"],
  },
  {
    role: "Operator",
    color: "bg-orange-50 border-orange-200 text-orange-700",
    badge: "bg-orange-500",
    perms: ["Check in / check out guests", "Upload documents", "Record payments", "Nothing else"],
  },
];

export default function Settings() {
  const [activeSection, setActiveSection] = useState("business");
  const [biz, setBiz] = useState(getBiz());
  const [user, setUser] = useState(getUser());
  const [saved, setSaved] = useState(false);

  const handleSaveBiz = () => {
    localStorage.setItem(BIZ_KEY, JSON.stringify(biz));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleSaveAccount = () => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-400 text-sm mt-1">Manage your business profile, team, and preferences.</p>
        </div>

        <div className="flex gap-8">
          {/* Left nav */}
          <div className="w-52 shrink-0">
            <nav className="space-y-0.5">
              {SECTIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-all ${
                    activeSection === s.id
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <s.icon className={`h-4 w-4 ${activeSection === s.id ? "text-blue-600" : "text-gray-400"}`} />
                  {s.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1">
            <AnimateSection>
              {activeSection === "business" && (
                <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-1">Business Profile</h2>
                    <p className="text-sm text-gray-400">Update your business information. This appears on invoices and reports.</p>
                  </div>
                  <div className="space-y-4">
                    <Field label="Business Name" icon={Building2}>
                      <input
                        value={biz.name}
                        onChange={(e) => setBiz({ ...biz, name: e.target.value })}
                        className="input-base"
                        placeholder="Your Business Name"
                      />
                    </Field>
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Business Phone" icon={Phone}>
                        <input
                          value={biz.phone}
                          onChange={(e) => setBiz({ ...biz, phone: e.target.value })}
                          className="input-base"
                          placeholder="+91 98765 43210"
                        />
                      </Field>
                      <Field label="Business Email" icon={Mail}>
                        <input
                          value={biz.email}
                          onChange={(e) => setBiz({ ...biz, email: e.target.value })}
                          className="input-base"
                          placeholder="contact@business.com"
                        />
                      </Field>
                    </div>
                    <Field label="Business Categories" icon={Tag}>
                      <input
                        value={biz.categories?.join(", ") ?? ""}
                        onChange={(e) => setBiz({ ...biz, categories: e.target.value.split(",").map((s: string) => s.trim()) })}
                        className="input-base"
                        placeholder="PG, Hostel, Co-Living"
                      />
                    </Field>
                  </div>
                  <SaveButton onSave={handleSaveBiz} saved={saved} />
                </div>
              )}

              {activeSection === "account" && (
                <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-1">My Account</h2>
                    <p className="text-sm text-gray-400">Update your personal information and password.</p>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xl font-bold">
                      {user.name?.charAt(0)?.toUpperCase() ?? "?"}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-400">{user.email}</p>
                      <span className="inline-block mt-1 text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Owner</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <Field label="Full Name" icon={User}>
                      <input
                        value={user.name}
                        onChange={(e) => setUser({ ...user, name: e.target.value })}
                        className="input-base"
                        placeholder="Your Name"
                      />
                    </Field>
                    <Field label="Email" icon={Mail}>
                      <input
                        value={user.email}
                        onChange={(e) => setUser({ ...user, email: e.target.value })}
                        className="input-base"
                        placeholder="you@email.com"
                      />
                    </Field>
                  </div>
                  <SaveButton onSave={handleSaveAccount} saved={saved} />
                </div>
              )}

              {activeSection === "team" && (
                <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-1">Team & Roles</h2>
                    <p className="text-sm text-gray-400">NestPro uses three role levels. Invite team members from the Team page.</p>
                  </div>
                  <div className="space-y-4">
                    {ROLES_INFO.map((r) => (
                      <div key={r.role} className={`border rounded-2xl p-5 ${r.color}`}>
                        <div className="flex items-center gap-2.5 mb-3">
                          <span className={`h-2.5 w-2.5 rounded-full ${r.badge}`} />
                          <h3 className="font-bold text-base">{r.role}</h3>
                        </div>
                        <ul className="space-y-1">
                          {r.perms.map((p) => (
                            <li key={p} className="text-sm flex items-center gap-2">
                              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 opacity-70" />
                              {p}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                  <a href="/staff">
                    <button className="mt-2 text-sm text-blue-600 font-medium hover:underline">
                      Manage team members →
                    </button>
                  </a>
                </div>
              )}

              {(activeSection === "notifications" || activeSection === "security") && (
                <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
                  <div className="flex items-center justify-center h-48 flex-col text-center">
                    {activeSection === "notifications" ? (
                      <Bell className="h-10 w-10 text-gray-200 mb-3" />
                    ) : (
                      <Shield className="h-10 w-10 text-gray-200 mb-3" />
                    )}
                    <h3 className="font-semibold text-gray-500 mb-1">
                      {activeSection === "notifications" ? "Notification Settings" : "Security Settings"}
                    </h3>
                    <p className="text-sm text-gray-400">Coming soon — WhatsApp alerts, SMS reminders, and 2FA will be configurable here.</p>
                  </div>
                </div>
              )}
            </AnimateSection>
          </div>
        </div>
      </div>

      <style>{`
        .input-base {
          width: 100%; padding: 0.625rem 0.875rem; border-radius: 0.75rem;
          border: 1px solid #e5e7eb; background: #f9fafb;
          color: #111827; font-size: 0.875rem;
          outline: none; transition: box-shadow 0.15s;
        }
        .input-base:focus { box-shadow: 0 0 0 2px #3b82f6; border-color: transparent; }
      `}</style>
    </Layout>
  );
}

function Field({ label, icon: Icon, children }: { label: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
        <Icon className="h-3.5 w-3.5 text-gray-400" />
        {label}
      </label>
      {children}
    </div>
  );
}

function SaveButton({ onSave, saved }: { onSave: () => void; saved: boolean }) {
  return (
    <button
      onClick={onSave}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
        saved
          ? "bg-green-100 text-green-700"
          : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
      }`}
    >
      {saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
      {saved ? "Saved!" : "Save Changes"}
    </button>
  );
}

function AnimateSection({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      key={children?.toString()}
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}
