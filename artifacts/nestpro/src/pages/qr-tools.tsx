import React, { useState } from 'react';
import { QrCode, Download, Copy, Printer, MessageSquare, Wifi, MapPin, IndianRupee, UserCheck, ShieldCheck } from 'lucide-react';
import { Layout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePropertyContext } from '@/components/property-provider';
import { toast } from '@/hooks/use-toast';

export default function QRToolsPage() {
  const { activeProperty } = usePropertyContext();
  const [type, setType] = useState('upi');

  // Input states
  const [upiId, setUpiId] = useState(activeProperty?.upiId || 'rentaq@okaxis');
  const [upiAmount, setUpiAmount] = useState('');
  const [whatsappPhone, setWhatsappPhone] = useState(activeProperty?.contactPhone || '919876543210');
  const [whatsappMessage, setWhatsappMessage] = useState('Hello! I would like to inquire about room availability.');
  const [wifiSsid, setWifiSsid] = useState(activeProperty?.wifiSsid || 'RENTAQ_GUEST_5G');
  const [wifiPassword, setWifiPassword] = useState(activeProperty?.wifiPassword || 'Stay@2026');
  const [locationUrl, setLocationUrl] = useState('https://maps.google.com/?q=' + encodeURIComponent(activeProperty?.name || 'Property'));
  const [checkinUrl, setCheckinUrl] = useState(`${window.location.origin}/checkin/demo-token`);

  // Compute QR Data Payload
  let qrPayload = '';
  if (type === 'upi') {
    qrPayload = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(activeProperty?.name || 'Rent')}${upiAmount ? '&am=' + upiAmount : ''}&cu=INR`;
  } else if (type === 'whatsapp') {
    qrPayload = `https://wa.me/${whatsappPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(whatsappMessage)}`;
  } else if (type === 'wifi') {
    qrPayload = `WIFI:T:WPA;S:${wifiSsid};P:${wifiPassword};;`;
  } else if (type === 'location') {
    qrPayload = locationUrl;
  } else if (type === 'checkin') {
    qrPayload = checkinUrl;
  }

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(qrPayload)}`;

  const copyPayload = () => {
    navigator.clipboard.writeText(qrPayload);
    toast({ title: 'Link copied to clipboard!', variant: 'success' });
  };

  return (
    <Layout title="QR Code Generator Suite">
      <div>
        <h2 className="text-base font-bold text-white">Generate Instant Business QR Codes</h2>
        <p className="text-xs text-slate-300">Generate printable and shareable QR codes for payments, WhatsApp, Wi-Fi, and check-in links.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls Card */}
        <Card className="lg:col-span-7 border-slate-800 bg-slate-900/90">
          <CardHeader>
            <CardTitle className="text-base text-white">QR Code Configuration</CardTitle>
            <CardDescription className="text-slate-300">Select the type of QR code you want to generate</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <Label>QR Code Purpose</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="bg-slate-900 border-slate-700 mt-1"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value="upi">UPI / Rent Payment QR</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp Direct Chat QR</SelectItem>
                  <SelectItem value="wifi">Wi-Fi Instant Connect QR</SelectItem>
                  <SelectItem value="checkin">Guest Self Check-In QR</SelectItem>
                  <SelectItem value="location">Google Maps Property Location QR</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {type === 'upi' && (
              <div className="space-y-4">
                <div>
                  <Label>UPI VPA ID *</Label>
                  <Input value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="name@upi" />
                </div>
                <div>
                  <Label>Preset Amount (Optional)</Label>
                  <Input type="number" value={upiAmount} onChange={(e) => setUpiAmount(e.target.value)} placeholder="e.g. 7500 (leave blank for any amount)" />
                </div>
              </div>
            )}

            {type === 'whatsapp' && (
              <div className="space-y-4">
                <div>
                  <Label>WhatsApp Phone Number (with country code) *</Label>
                  <Input value={whatsappPhone} onChange={(e) => setWhatsappPhone(e.target.value)} placeholder="919876543210" />
                </div>
                <div>
                  <Label>Default Pre-filled Message</Label>
                  <Input value={whatsappMessage} onChange={(e) => setWhatsappMessage(e.target.value)} />
                </div>
              </div>
            )}

            {type === 'wifi' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            {type === 'checkin' && (
              <div>
                <Label>Guest Check-In URL</Label>
                <Input value={checkinUrl} onChange={(e) => setCheckinUrl(e.target.value)} />
              </div>
            )}

            {type === 'location' && (
              <div>
                <Label>Google Maps Link / Coordinates</Label>
                <Input value={locationUrl} onChange={(e) => setLocationUrl(e.target.value)} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* QR Preview Card */}
        <Card className="lg:col-span-5 border-slate-800 bg-slate-900/90 text-center flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-base text-white">Live QR Code Preview</CardTitle>
            <CardDescription className="text-slate-300">Scan with any mobile camera</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 py-4">
            <div className="p-4 bg-white rounded-2xl w-fit mx-auto shadow-2xl border-4 border-slate-700">
              <img src={qrImageUrl} alt="Generated QR" className="h-52 w-52" />
            </div>

            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] font-mono text-slate-300 break-all">
              {qrPayload}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copyPayload} className="flex-1 text-xs">
                <Copy className="h-3.5 w-3.5 mr-1" /> Copy Link
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  const w = window.open('');
                  w?.document.write(`<html><body style="text-align:center;padding:40px;font-family:sans-serif;"><h1>${activeProperty?.name || 'RENTAQ'}</h1><img src="${qrImageUrl}" style="width:300px;height:300px;border:4px solid #000;border-radius:16px;"/><p style="font-size:18px;margin-top:20px;font-weight:bold;">Scan to proceed</p><script>window.print();</script></body></html>`);
                }}
                className="flex-1 text-xs font-bold"
              >
                <Printer className="h-3.5 w-3.5 mr-1" /> Print QR
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
