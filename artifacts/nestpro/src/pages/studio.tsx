import React, { useState } from 'react';
import { Printer, Download, FileText, Wifi, QrCode, ShieldCheck, Sparkles, Building2, CheckCircle2 } from 'lucide-react';
import { Layout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { usePropertyContext } from '@/components/property-provider';

export default function StudioPage() {
  const { activeProperty } = usePropertyContext();
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);

  const [houseRulesText, setHouseRulesText] = useState(
    activeProperty?.rules ||
    '1. Quiet hours between 10:00 PM and 6:00 AM\n2. No smoking or alcohol consumption in common areas\n3. Gate closes strictly at 10:30 PM\n4. Visitors allowed in reception lounge only\n5. Keep your room and corridors clean'
  );

  const [wifiSsid, setWifiSsid] = useState(activeProperty?.wifiSsid || 'RENTAQ_GUEST_5G');
  const [wifiPassword, setWifiPassword] = useState(activeProperty?.wifiPassword || 'Stay@2026');
  const [upiId, setUpiId] = useState(activeProperty?.upiId || 'rentaq@okaxis');
  const [roomNumber, setRoomNumber] = useState('101');

  const printDocument = () => {
    window.print();
  };

  const TEMPLATES = [
    {
      id: 'house_rules',
      title: 'House & Property Rules Poster',
      desc: 'Clean, printable poster with quiet hours, visitor policies, and cleanliness guidelines.',
      icon: ShieldCheck,
    },
    {
      id: 'wifi_card',
      title: 'Wi-Fi Login & Network Card',
      desc: 'Desk & wall card displaying Wi-Fi SSID and password clearly for incoming occupants.',
      icon: Wifi,
    },
    {
      id: 'payment_poster',
      title: 'UPI Rent Payment Poster',
      desc: 'Official payment QR notice for easy monthly rent settlement and recordkeeping.',
      icon: QrCode,
    },
    {
      id: 'room_sign',
      title: 'Room & Door Identification Sign',
      desc: 'Printable door signs featuring room number and property branding.',
      icon: Building2,
    },
    {
      id: 'rental_agreement',
      title: 'Standard Rental Agreement Template',
      desc: 'Legal 11-month tenancy agreement with auto-filled terms, rent, and deposit clauses.',
      icon: FileText,
    },
  ];

  return (
    <Layout title="RENTAQ Studio — Business Toolkit & Templates">
      <div>
        <h2 className="text-sm font-bold text-[#172033] flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#2F6FED]" /> Printable Business Materials & Posters
        </h2>
        <p className="text-xs text-[#667085]">
          Generate ready-to-print notices, room signs, and legal templates without leaving your operating system.
        </p>
      </div>

      {/* Templates Selection Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {TEMPLATES.map((t) => {
          const Icon = t.icon;
          return (
            <Card key={t.id} className="hover:border-[#CBD5E1] transition-all flex flex-col justify-between">
              <CardContent className="p-6 space-y-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EFF5FF] text-[#2F6FED]">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#172033] mb-1">{t.title}</h3>
                  <p className="text-xs text-[#667085] leading-relaxed">{t.desc}</p>
                </div>
                <Button
                  onClick={() => setActiveTemplate(t.id)}
                  className="btn-primary w-full text-xs font-bold"
                  size="sm"
                >
                  <Printer className="h-4 w-4 mr-1.5" /> Customize & Print
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Template Preview & Print Modal */}
      <Dialog open={!!activeTemplate} onOpenChange={(v) => !v && setActiveTemplate(null)}>
        <DialogContent className="max-w-3xl bg-white border-[#E5EAF1] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Template Preview & Print</span>
              <Button onClick={printDocument} className="btn-primary font-bold text-xs">
                <Printer className="h-4 w-4 mr-1" /> Print Document
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="p-4 space-y-5">
            {/* Customization Controls */}
            {activeTemplate === 'house_rules' && (
              <div className="space-y-2">
                <Label>Customize House Rules Text</Label>
                <Textarea rows={4} value={houseRulesText} onChange={(e) => setHouseRulesText(e.target.value)} />
              </div>
            )}
            {activeTemplate === 'wifi_card' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Wi-Fi Network Name (SSID)</Label>
                  <Input value={wifiSsid} onChange={(e) => setWifiSsid(e.target.value)} />
                </div>
                <div>
                  <Label>Wi-Fi Password</Label>
                  <Input value={wifiPassword} onChange={(e) => setWifiPassword(e.target.value)} />
                </div>
              </div>
            )}
            {activeTemplate === 'payment_poster' && (
              <div>
                <Label>UPI ID for Payments</Label>
                <Input value={upiId} onChange={(e) => setUpiId(e.target.value)} />
              </div>
            )}
            {activeTemplate === 'room_sign' && (
              <div>
                <Label>Room Number / Name</Label>
                <Input value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} />
              </div>
            )}

            {/* Printable Preview Sheet */}
            <div id="printable-sheet" className="bg-white text-[#172033] p-8 rounded-xl border-2 border-[#172033] font-sans">
              {/* Printable Header */}
              <div className="flex items-center justify-between border-b-2 border-[#172033] pb-4 mb-6">
                <div>
                  <h1 className="text-xl font-black tracking-tight uppercase text-[#172033]">
                    {activeProperty?.name || 'RENTAQ PROPERTY'}
                  </h1>
                  <p className="text-xs font-semibold text-[#667085]">
                    {[activeProperty?.address, activeProperty?.city].filter(Boolean).join(', ') || 'Official Accommodation Premises'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-bold uppercase tracking-wider bg-[#172033] text-white px-2.5 py-1 rounded">
                    Official Notice
                  </span>
                </div>
              </div>

              {/* Template Content Views */}
              {activeTemplate === 'house_rules' && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-center underline uppercase tracking-wide">
                    House & Property Rules
                  </h2>
                  <div className="space-y-2 text-xs leading-relaxed whitespace-pre-line font-medium p-4 bg-[#F7F9FC] rounded-lg border border-[#E5EAF1]">
                    {houseRulesText}
                  </div>
                  <div className="pt-6 flex justify-between text-xs font-bold text-[#172033]">
                    <p>Management Contact: {activeProperty?.contactPhone || '+91 98765 00000'}</p>
                    <p>Issued by Property Administration</p>
                  </div>
                </div>
              )}

              {activeTemplate === 'wifi_card' && (
                <div className="text-center py-6 space-y-4">
                  <Wifi className="h-12 w-12 mx-auto text-[#2F6FED]" />
                  <h2 className="text-xl font-black uppercase tracking-tight">High-Speed Wi-Fi Access</h2>
                  <div className="max-w-sm mx-auto p-4 rounded-xl border-2 border-dashed border-[#CBD5E1] bg-[#F7F9FC] space-y-2">
                    <p className="text-xs font-semibold text-[#667085]">Network Name (SSID):</p>
                    <p className="text-lg font-mono font-black text-[#172033]">{wifiSsid}</p>
                    <div className="border-t border-[#E5EAF1] pt-2">
                      <p className="text-xs font-semibold text-[#667085]">Password:</p>
                      <p className="text-lg font-mono font-black text-[#172033]">{wifiPassword}</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTemplate === 'payment_poster' && (
                <div className="text-center py-6 space-y-4">
                  <h2 className="text-xl font-black uppercase text-[#173B6C]">Direct Rent Payment</h2>
                  <p className="text-xs text-[#667085]">Scan & Pay via Google Pay, PhonePe, Paytm, or any UPI App</p>
                  <div className="h-40 w-40 mx-auto border-2 border-[#172033] p-2 rounded-xl flex items-center justify-center bg-white shadow-xs">
                    <QrCode className="h-32 w-32 text-[#172033]" />
                  </div>
                  <p className="text-base font-mono font-black text-[#172033]">UPI ID: {upiId}</p>
                </div>
              )}

              {activeTemplate === 'room_sign' && (
                <div className="text-center py-10 space-y-4">
                  <div className="text-6xl font-black tracking-tight text-[#172033] font-mono">
                    {roomNumber}
                  </div>
                  <p className="text-xs font-bold text-[#667085] uppercase tracking-widest">Private Accommodation Room</p>
                </div>
              )}

              {activeTemplate === 'rental_agreement' && (
                <div className="space-y-3 text-xs leading-relaxed">
                  <h2 className="text-base font-black text-center uppercase tracking-wide">
                    Residential Tenancy & Accommodation Agreement
                  </h2>
                  <p>
                    This agreement is executed between <strong>{activeProperty?.name || 'Property Owner'}</strong> (First Party/Landlord) and the Resident Tenant (Second Party).
                  </p>
                  <ol className="list-decimal pl-5 space-y-1 font-medium text-[#172033]">
                    <li>The monthly accommodation charges shall be settled on or before the 5th of every month.</li>
                    <li>A refundable security deposit shall be refunded upon vacating with 30 days prior written notice.</li>
                    <li>The resident agrees to abide by property peace, cleanliness, and security rules strictly.</li>
                  </ol>
                  <div className="pt-8 flex justify-between font-bold border-t border-[#CBD5E1] mt-6">
                    <div>
                      <p>__________________________</p>
                      <p>Signature of Landlord</p>
                    </div>
                    <div>
                      <p>__________________________</p>
                      <p>Signature of Tenant</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
