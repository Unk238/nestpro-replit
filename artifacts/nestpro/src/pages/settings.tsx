import React, { useState } from 'react';
import { Settings, Save, RefreshCw } from 'lucide-react';
import { Layout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { OnboardingWizard } from '@/components/onboarding-wizard';

export default function SettingsPage() {
  const user = JSON.parse(localStorage.getItem('nestpro_user') || '{}');
  const [email, setEmail] = useState(user.email || 'admin@nestpro.in');
  const [showOnboarding, setShowOnboarding] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('nestpro_user', JSON.stringify({ ...user, email }));
    toast({ title: 'Settings saved!', variant: 'success' });
  };

  const handleResetData = () => {
    if (confirm('Re-run onboarding wizard to add new properties or reset setup?')) {
      setShowOnboarding(true);
    }
  };

  return (
    <Layout title="Settings">
      <div className="max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="h-4 w-4 text-indigo-400" /> Account Settings
            </CardTitle>
            <CardDescription>Manage your NestPro profile and credentials</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <Label htmlFor="email">Operator Email</Label>
                <Input id="email" className="mt-1.5" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <Button type="submit">
                <Save className="h-4 w-4 mr-2" /> Save Profile
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-amber-400">
              <RefreshCw className="h-4 w-4" /> Setup & Onboarding Wizard
            </CardTitle>
            <CardDescription>Re-run the setup wizard to quickly scaffold properties, rooms, and beds</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={handleResetData}>
              Launch Onboarding Wizard
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
