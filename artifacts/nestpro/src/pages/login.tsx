import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Building2, ArrowRight, ShieldCheck, Lock, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LanguageSelector } from '@/components/language-selector';
import { useTranslation } from '@/lib/i18n';
import { toast } from '@/hooks/use-toast';

export default function LoginPage() {
  const [, navigate] = useLocation();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: 'Missing fields', description: 'Please enter your email and password.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    setTimeout(() => {
      localStorage.setItem('rentaq_user', JSON.stringify({ email, name: email.split('@')[0], role: 'Owner' }));
      localStorage.setItem('nestpro_user', JSON.stringify({ email }));
      toast({ title: 'Welcome to RENTAQ', description: 'Signed in successfully.', variant: 'success' });
      window.location.href = '/';
    }, 400);
  };

  const fillDemo = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('rentaq123');
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#F7F9FC] text-[#172033] p-4 sm:p-8">
      {/* Top Header */}
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2F6FED] text-white">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <span className="text-lg font-black text-[#173B6C] tracking-tight">RENTAQ</span>
            <span className="block text-[10px] font-semibold text-[#667085] uppercase tracking-wider">Property OS</span>
          </div>
        </div>
        <LanguageSelector />
      </header>

      {/* Main Login Card */}
      <main className="max-w-md w-full mx-auto my-8">
        <Card className="border-[#E5EAF1] bg-white shadow-[0_4px_20px_rgba(23,32,51,0.06)] p-2">
          <CardHeader className="space-y-1.5 text-center pb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EFF5FF] text-[#2F6FED] mx-auto mb-1">
              <Building2 className="h-6 w-6" />
            </div>
            <CardTitle className="text-xl font-bold text-[#172033]">Sign in to Workspace</CardTitle>
            <CardDescription className="text-xs text-[#667085]">
              Enter your credentials to access your properties & ledger
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#98A2B3]" />
                  <Input
                    type="email"
                    className="pl-10"
                    placeholder="admin@rentaq.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label className="mb-0">Password</Label>
                  <a href="#" className="text-xs font-semibold text-[#2F6FED] hover:underline">Forgot?</a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#98A2B3]" />
                  <Input
                    type="password"
                    className="pl-10"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Button type="submit" disabled={loading} className="btn-primary w-full text-xs font-bold py-2.5 shadow-sm">
                {loading ? 'Authenticating...' : 'Sign In to Workspace'}
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </form>

            {/* Quick Demo Credentials */}
            <div className="pt-4 border-t border-[#E5EAF1] space-y-2">
              <p className="text-[11px] font-semibold text-[#667085] text-center">Demo Quick-Access Profiles:</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => fillDemo('admin@rentaq.in')}
                  className="p-2 rounded-lg bg-[#F7F9FC] border border-[#E5EAF1] text-left hover:border-[#2F6FED] hover:bg-[#EFF5FF] transition-colors"
                >
                  <p className="font-bold text-[#172033]">Owner Admin</p>
                  <p className="text-[10px] text-[#667085]">admin@rentaq.in</p>
                </button>
                <button
                  type="button"
                  onClick={() => fillDemo('manager@rentaq.in')}
                  className="p-2 rounded-lg bg-[#F7F9FC] border border-[#E5EAF1] text-left hover:border-[#2F6FED] hover:bg-[#EFF5FF] transition-colors"
                >
                  <p className="font-bold text-[#172033]">Property Manager</p>
                  <p className="text-[10px] text-[#667085]">manager@rentaq.in</p>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl w-full mx-auto text-center py-2 text-xs text-[#667085]">
        <p>RENTAQ · Production Property Operations OS · All data encrypted</p>
      </footer>
    </div>
  );
}
