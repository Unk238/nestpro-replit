import React, { useState } from "react";
import { Layout } from "@/components/layout";
import { useListGuests, useListProperties } from "@workspace/api-client-react";
import { usePropertyContext } from "@/components/property-provider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Link2, Copy, Check, X, ExternalLink, MessageCircle,
  Clock, CheckCircle2, XCircle, ChevronDown, ChevronUp,
  Users, Loader2, Building2, BedDouble, Send,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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

function useSubmissions() {
  return useQuery({
    queryKey: ["checkin-submissions"],
    queryFn: () => apiFetch("/checkin/submissions"),
  });
}

function getShareLink(token: string) {
  const origin = window.location.origin;
  const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
  return `${origin}${base}/checkin/${token}`;
}

function getWhatsAppMessage(propertyName: string, link: string) {
  return encodeURIComponent(
    `Welcome to ${propertyName}! 🏠\n\nPlease complete your digital check-in using the link below:\n\n${link}\n\nThis link is valid for 7 days. If you face any issues, please contact us.`
  );
}

// ─── Generate Link Dialog ────────────────────────────────────────────────────
function GenerateLinkDialog({ onClose }: { onClose: () => void }) {
  const [propertyId, setPropertyId] = useState("");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ token: string; propertyName: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const { data: properties = [] } = useListProperties();

  const generate = async () => {
    if (!propertyId) return;
    setGenerating(true);
    try {
      const data = await apiFetch("/checkin/generate", {
        method: "POST",
        body: JSON.stringify({ propertyId: Number(propertyId) }),
      });
      const prop = properties.find((p) => p.id === Number(propertyId));
      setResult({ token: data.token, propertyName: prop?.name ?? "Property" });
    } catch (e: any) {
      alert(e.message);
    } finally {
      setGenerating(false);
    }
  };

  const copyLink = () => {
    if (!result) return;
    navigator.clipboard.writeText(getShareLink(result.token));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const link = result ? getShareLink(result.token) : "";

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Link2 className="h-4 w-4 text-blue-600" />
            </div>
            <h2 className="font-bold text-gray-900">Generate Check-In Link</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {!result ? (
            <>
              <p className="text-sm text-gray-500">
                Generate a unique link and send it to your guest via WhatsApp or SMS. They'll complete their own digital check-in.
              </p>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Select Property *</label>
                <select
                  value={propertyId}
                  onChange={(e) => setPropertyId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose a property…</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={generate}
                disabled={!propertyId || generating}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                {generating ? "Generating…" : "Generate Link"}
              </button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <p className="text-sm font-medium">Link generated! Valid for 7 days.</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Check-In Link</p>
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                  <p className="flex-1 text-xs text-gray-700 break-all font-mono">{link}</p>
                  <button onClick={copyLink} className="shrink-0 text-gray-400 hover:text-blue-600 transition-colors">
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={copyLink}
                  className="flex items-center justify-center gap-2 border border-gray-200 text-gray-700 font-medium py-2.5 rounded-xl hover:bg-gray-50 transition text-sm"
                >
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied!" : "Copy Link"}
                </button>
                <a
                  href={`https://wa.me/?text=${getWhatsAppMessage(result.propertyName, link)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-medium py-2.5 rounded-xl transition text-sm"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </a>
              </div>

              <a
                href={link}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 text-xs text-gray-400 hover:text-blue-500 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Preview guest portal
              </a>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Pending Submissions Section ─────────────────────────────────────────────
function PendingSection() {
  const { data: submissions = [], refetch } = useSubmissions();
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState<number | null>(null);
  const [acting, setActing] = useState<number | null>(null);

  const pending = submissions.filter((s: any) => s.status === "submitted");
  if (pending.length === 0) return null;

  const approve = async (id: number) => {
    setActing(id);
    try {
      await apiFetch(`/checkin/submissions/${id}/approve`, { method: "POST", body: JSON.stringify({}) });
      refetch();
      qc.invalidateQueries({ queryKey: ["listGuests"] });
    } catch (e: any) { alert(e.message); }
    finally { setActing(null); }
  };

  const reject = async (id: number) => {
    if (!confirm("Reject this registration?")) return;
    setActing(id);
    try {
      await apiFetch(`/checkin/submissions/${id}/reject`, { method: "POST", body: JSON.stringify({ reason: "Rejected by operator" }) });
      refetch();
    } catch (e: any) { alert(e.message); }
    finally { setActing(null); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="bg-amber-50 border border-amber-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 flex items-center gap-3">
          <div className="h-8 w-8 bg-amber-100 rounded-lg flex items-center justify-center">
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <div>
            <p className="font-bold text-amber-900 text-sm">Pending Registrations</p>
            <p className="text-xs text-amber-600">{pending.length} guest{pending.length !== 1 ? "s" : ""} waiting for approval</p>
          </div>
        </div>

        <div className="divide-y divide-amber-100">
          {pending.map((sub: any) => {
            const data = sub.submittedData ?? {};
            const isExpanded = expanded === sub.id;
            const isActing = acting === sub.id;
            return (
              <div key={sub.id} className="bg-white">
                <div
                  className="px-5 py-3.5 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition"
                  onClick={() => setExpanded(isExpanded ? null : sub.id)}
                >
                  <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-bold shrink-0">
                    {(data.fullName ?? "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{data.fullName ?? "Unknown"}</p>
                    <p className="text-xs text-gray-400">{data.phone} · {sub.propertyName}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 text-xs">Pending</Badge>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-4 space-y-4 border-t border-gray-100 pt-4">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                          <Detail label="Email" value={data.email} />
                          <Detail label="Gender" value={data.gender} />
                          <Detail label="DOB" value={data.dob} />
                          <Detail label="Occupation" value={data.occupation} />
                          <Detail label="Company" value={data.company} />
                          <Detail label="Aadhaar" value={data.aadhaar} />
                          <Detail label="Move-In" value={data.moveInDate} />
                          <Detail label="Rent" value={data.monthlyRent ? `₹${data.monthlyRent}` : undefined} />
                          <Detail label="Deposit" value={data.depositAmount ? `₹${data.depositAmount}` : undefined} />
                          <Detail label="Booking Source" value={data.bookingSource} />
                          <div className="col-span-2">
                            <Detail label="Address" value={data.currentAddress} />
                          </div>
                          <Detail label="Emergency Contact" value={data.emergencyName} />
                          <Detail label="Emergency Phone" value={data.emergencyPhone} />
                        </div>

                        <div className="flex gap-3 pt-1">
                          <button
                            onClick={() => approve(sub.id)}
                            disabled={isActing}
                            className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-2.5 rounded-xl text-sm disabled:opacity-50 transition"
                          >
                            {isActing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                            Approve & Check In
                          </button>
                          <button
                            onClick={() => reject(sub.id)}
                            disabled={isActing}
                            className="flex items-center justify-center gap-2 border border-red-200 text-red-500 hover:bg-red-50 font-medium py-2.5 px-4 rounded-xl text-sm disabled:opacity-50 transition"
                          >
                            <XCircle className="h-4 w-4" />
                            Reject
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

function Detail({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm text-gray-700">{value}</p>
    </div>
  );
}

// ─── Main Guests Page ─────────────────────────────────────────────────────────
export default function Guests() {
  const { activePropertyId } = usePropertyContext();
  const [showGenerate, setShowGenerate] = useState(false);

  const { data: guests, isLoading } = useListGuests({
    query: { queryKey: ["listGuests", activePropertyId] },
    request: { query: { propertyId: activePropertyId || undefined } } as any,
  });

  return (
    <Layout>
      <div className="space-y-6 max-w-5xl">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Guests</h1>
            <p className="text-sm text-gray-400 mt-0.5">Manage check-ins, profiles, and registrations.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowGenerate(true)}
              className="flex items-center gap-2 border border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100 font-medium px-4 py-2.5 rounded-xl text-sm transition"
            >
              <Link2 className="h-4 w-4" />
              Generate Check-In Link
            </button>
            <Button className="text-sm gap-1.5">
              <Plus className="h-4 w-4" />
              Manual Check-In
            </Button>
          </div>
        </div>

        {/* Pending registrations */}
        <PendingSection />

        {/* Guest list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
          </div>
        ) : guests && guests.length > 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Guest</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Check-In</TableHead>
                  <TableHead className="text-right">Monthly Rent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {guests.map((guest) => (
                  <TableRow key={guest.id} className="hover:bg-gray-50 cursor-pointer">
                    <TableCell>
                      <Link href={`/guests/${guest.id}`}>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold shrink-0">
                            {guest.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-sm text-gray-900">{guest.name}</span>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-gray-700">{guest.phone}</p>
                      {guest.email && <p className="text-xs text-gray-400">{guest.email}</p>}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={guest.status === "active" ? "default" : "secondary"}
                        className={guest.status === "active" ? "bg-green-100 text-green-700 border-0" : ""}
                      >
                        {guest.status === "active" ? "Active" : "Checked Out"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(guest.checkInDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-sm">
                      ₹{Number(guest.monthlyRent).toLocaleString("en-IN")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20 bg-white border border-gray-100 rounded-2xl"
          >
            <div className="h-14 w-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="h-7 w-7 text-blue-400" />
            </div>
            <h3 className="font-bold text-gray-900 mb-1">No guests yet</h3>
            <p className="text-sm text-gray-400 mb-6 max-w-xs mx-auto">
              Generate a check-in link and send it to your guest, or add one manually.
            </p>
            <button
              onClick={() => setShowGenerate(true)}
              className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-700 transition text-sm"
            >
              <Link2 className="h-4 w-4" />
              Generate Check-In Link
            </button>
          </motion.div>
        )}
      </div>

      {/* Generate link dialog */}
      <AnimatePresence>
        {showGenerate && <GenerateLinkDialog onClose={() => setShowGenerate(false)} />}
      </AnimatePresence>
    </Layout>
  );
}
