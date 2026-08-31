import React, { useState } from 'react';
import { Settings, Save, RefreshCw, Globe, Gift, CreditCard, Sparkles, Copy, CheckCircle2 } from 'lucide-react';
import { Layout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation, SUPPORTED_LANGUAGES } from '@/lib/i18n';
import { toast } from '@/hooks/use-toast';
import { OnboardingWizard } from '@/components/onboarding-wizard';

export default function SettingsPage() {
  const { language, setLanguage } = useTranslation();
  const user = JSON.parse(localStorage.getItem('rentaq_user') || localStorage.getItem('nestpro_user') || '{}');

  const [name, setName] = useState(user.name || 'Owner Operator');
  const [email, setEmail] = useState(user.email || 'admin@rentaq.in');
  const [phone, setPhone] = useState(user.phone || '+91 98765 43210');
  const [showOnboarding, setShowOnboarding] = useState(false);

  const referralCode = 'RENTAQ-' + (user.name?.slice(0, 3).toUpperCase() || 'PRO') + '88';

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('rentaq_user', JSON.stringify({ ...user, name, email, phone }));
    localStorage.setItem('nestpro_user', JSON.stringify({ email }));
    toast({ title: 'Settings saved!', variant: 'success' });
  };

  const copyReferral = () => {
    navigator.clipboard.writeText(`https://rentaq.in/join?ref=${referralCode}`);
    toast({ title: 'Referral link copied!', variant: 'success' });
  };

  return (
    <Layout title="Settings & Subscription">
      <div className="max-w-4xl space-y-6">
        {/* Profile Card */}
        <Card className="border-slate-800 bg-slate-900/90">
          <CardHeader>
            <CardTitle className="text-base text-white flex items-center gap-2">
              <Settings className="h-4 w-4 text-indigo-400" /> Account & Profile Settings
            </CardTitle>
            <CardDescription className="text-slate-300">Manage your RENTAQ account credentials and language</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Operator Full Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div>
                  <Label>Mobile Number</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Work Email</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div>
                  <Label>Interface Language</Label>
                  <Select value={language} onValueChange={(v: any) => setLanguage(v)}>
                    <SelectTrigger className="bg-slate-900 border-slate-700 mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700">
                      {SUPPORTED_LANGUAGES.map((l) => (
                        <SelectItem key={l.code} value={l.code}>{l.nativeName} ({l.name})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button type="submit" className="font-bold">
                <Save className="h-4 w-4 mr-2" /> Save Profile Changes
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Free Trial & Subscription Architecture */}
        <Card className="border-indigo-500/30 bg-slate-900/90">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base text-white flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-emerald-400" /> Subscription & Plan Status
              </CardTitle>
              <CardDescription className="text-slate-300">Your current plan and active trial details</CardDescription>
            </div>
            <Badge variant="success">Active Pro Trial</Badge>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div>
                <p className="text-slate-400">Plan Name:</p>
                <p className="text-sm font-bold text-white">RENTAQ Business Unlimited</p>
              </div>
              <div>
                <p className="text-slate-400">Trial Period:</p>
                <p className="text-sm font-bold text-emerald-400">30 Days Free (Full Access)</p>
              </div>
              <div>
                <p className="text-slate-400">Next Billing Date:</p>
                <p className="text-sm font-bold text-white">30 Sept 2026</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Refer & Earn Program */}
        <Card className="border-slate-800 bg-slate-900/90">
          <CardHeader>
            <CardTitle className="text-base text-white flex items-center gap-2 text-amber-400">
              <Gift className="h-4 w-4" /> Refer & Earn Rewards
            </CardTitle>
            <CardDescription className="text-slate-300">
              Share RENTAQ with fellow PG and property owners to earn extended subscription credits.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Input readOnly value={`https://rentaq.in/join?ref=${referralCode}`} className="bg-slate-950 border-slate-700 font-mono text-xs" />
              <Button variant="outline" onClick={copyReferral} className="font-bold flex-shrink-0">
                <Copy className="h-4 w-4 mr-1.5" /> Copy Link
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Setup Wizard Re-launcher */}
        <Card className="border-slate-800 bg-slate-900/90">
          <CardHeader>
            <CardTitle className="text-base text-white flex items-center gap-2 text-indigo-300">
              <RefreshCw className="h-4 w-4" /> Re-run Setup Wizard
            </CardTitle>
            <CardDescription className="text-slate-300">Add new properties or re-generate structure blocks</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => setShowOnboarding(true)} className="font-bold border-slate-700">
              Launch Setup Wizard
            </Button>
          </CardContent>
        </Card>
      </div>

      {showOnboarding && (
        <OnboardingWizard onComplete={() => setShowOnboarding(false)} />
      )}
    </Layout>
  );
}
