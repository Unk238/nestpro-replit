import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Home, Eye, EyeOff, Loader2, CheckCircle2, ShieldCheck, Zap, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';

export default function LoginPage() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState('admin@nestpro.in');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      return toast({ title: 'Please enter your email and password', variant: 'destructive' });
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    localStorage.setItem('nestpro_user', JSON.stringify({ email }));
    setLoading(false);
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#060a14] px-4 py-12">
      {/* Background glowing gradients */}
      <div className="absolute top-1/4 left-1/3 h-96 w-96 rounded-full bg-indigo-600/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 h-96 w-96 rounded-full bg-purple-600/12 blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Clear Value Proposition & Features */}
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-6 space-y-6 text-left"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>Next-Gen PG & Hostel Operating System</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Manage your properties with <span className="gradient-text">effortless clarity</span>.
            </h1>
            <p className="text-base text-slate-300 leading-relaxed font-normal">
              Replace messy spreadsheets and WhatsApp threads with a single structured platform for Indian PG and hostel owners.
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="space-y-3 pt-2">
            {[
              { title: 'Automated Rent & Overdue Tracking', desc: 'Instant 6-month revenue analytics and payment alerts.' },
              { title: 'QR Guest Self Check-In Portal', desc: 'Zero-friction online onboarding for new guests.' },
              { title: 'AI Receptionist Assistant', desc: 'Ask natural questions about rooms, guests & complaints.' },
            ].map((f) => (
              <div key={f.title} className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400 mt-0.5 flex-shrink-0">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-100">{f.title}</p>
                  <p className="text-xs text-slate-400">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right Column: Sign-In Card with High-Contrast UI & 16px Spacing */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:col-span-6"
        >
          <div className="glass rounded-2xl p-6 sm:p-8 shadow-2xl border border-slate-700/80 bg-slate-900/90">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/40">
                <Home className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-100">Operator Sign In</h2>
                <p className="text-xs text-slate-300 font-medium">Access your NestPro dashboard</p>
              </div>
            </div>

            {/* Form with Fix #2: 16px Vertical Spacing & 12px Input Padding */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="email">Work Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@nestpro.in"
                  className="mt-1.5"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label htmlFor="password">Password</Label>
                  <span className="text-xs text-indigo-400 hover:underline cursor-pointer">Forgot password?</span>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={show ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShow(!show)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-100 transition-colors p-1"
                    aria-label={show ? 'Hide password' : 'Show password'}
                  >
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* High-Converting Primary CTA Button */}
              <Button type="submit" size="lg" className="w-full mt-2 text-base font-bold shadow-xl shadow-indigo-500/30" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    Sign In to Dashboard
                    <Zap className="h-4 w-4 ml-1 fill-current" />
                  </>
                )}
              </Button>
            </form>

            {/* Demo Notice */}
            <div className="mt-6 pt-5 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                Demo Credentials:
              </span>
              <span className="font-mono text-indigo-300 bg-indigo-950/60 border border-indigo-500/30 px-2 py-0.5 rounded">
                admin@nestpro.in / pass
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
