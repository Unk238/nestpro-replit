import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Sparkles, Loader2, PhoneCall, Globe, ShieldAlert, PhoneOff } from 'lucide-react';
import { Layout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { usePropertyContext } from '@/components/property-provider';
import { useTranslation, SUPPORTED_LANGUAGES } from '@/lib/i18n';
import { api } from '@/lib/api';
import { motion } from 'framer-motion';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export default function AIPage() {
  const { activeProperty } = usePropertyContext();
  const pid = activeProperty?.id;
  const { language } = useTranslation();

  const [aiLang, setAiLang] = useState(language || 'en');
  const [maxDiscount, setMaxDiscount] = useState(10);
  const [minRate, setMinRate] = useState(6000);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [voiceCallActive, setVoiceCallActive] = useState(false);
  const [voiceGreeting, setVoiceGreeting] = useState('');
  const [callerName, setCallerName] = useState('Rahul');
  const [callerLang, setCallerLang] = useState('hi');

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'ai',
      text: `Hello! I am your RENTAQ Virtual Receptionist. I have access to your live bed availability, overdue ledgers, guest history, and pricing rules. Ask me any property question or inquiry.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: Message = {
      id: String(Date.now()),
      sender: 'user',
      text: input,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    const queryText = input;
    setInput('');
    setLoading(true);

    try {
      const res = await api.chat(queryText, pid, {
        language: aiLang,
        maxDiscountPercent: maxDiscount,
        minAllowedRate: minRate,
      });
      const aiMsg: Message = {
        id: String(Date.now() + 1),
        sender: 'ai',
        text: res.message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: String(Date.now() + 1),
        sender: 'ai',
        text: `Error: ${err.message || 'Could not connect to AI receptionist.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleStartVoiceCall = async () => {
    setVoiceCallActive(true);
    try {
      const res = await api.simulateVoiceCall({
        callerName,
        callerLanguage: callerLang,
      });
      setVoiceGreeting(res.greeting);
    } catch (_e) {
      setVoiceGreeting('Namaste! RENTAQ virtual front desk me aapka swagat hai.');
    }
  };

  return (
    <Layout title="AI Virtual Front Desk & Voice Assistant">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Top Controls Bar */}
        <Card className="border-slate-800 bg-slate-900/90">
          <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-indigo-400" />
                <Label className="mb-0 text-slate-300">Conversation Language:</Label>
                <Select value={aiLang} onValueChange={setAiLang}>
                  <SelectTrigger className="w-36 h-8 text-xs bg-slate-950 border-slate-700"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    {SUPPORTED_LANGUAGES.map((l) => (
                      <SelectItem key={l.code} value={l.code}>{l.nativeName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-amber-400" />
                <Label className="mb-0 text-slate-300">Max Discount Limit:</Label>
                <Input
                  type="number"
                  className="w-16 h-8 text-xs bg-slate-950 border-slate-700 px-2"
                  value={maxDiscount}
                  onChange={(e) => setMaxDiscount(parseInt(e.target.value) || 0)}
                />
                <span className="text-slate-400">%</span>
              </div>
            </div>

            <Button size="sm" onClick={() => setShowVoiceModal(true)} className="bg-gradient-to-r from-emerald-600 to-teal-600 font-bold text-xs gap-1.5 shadow-md">
              <PhoneCall className="h-4 w-4" /> Simulate AI Voice Call
            </Button>
          </CardContent>
        </Card>

        {/* Chat Interface Box */}
        <Card className="flex flex-col h-[560px] overflow-hidden border-indigo-500/30 bg-slate-900/95 shadow-2xl">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  RENTAQ Virtual Front Desk <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                </h3>
                <p className="text-[11px] text-slate-400">Context-aware for {activeProperty?.name || 'All Properties'}</p>
              </div>
            </div>
          </div>

          {/* Messages Feed */}
          <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className={m.sender === 'user' ? 'bg-indigo-600 text-white' : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'}>
                    {m.sender === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
                <div className={`max-w-[80%] space-y-1 ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      m.sender === 'user'
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-tr-none shadow-md'
                        : 'bg-slate-950/80 border border-slate-800 text-slate-100 rounded-tl-none'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.text}</p>
                  </div>
                  <p className="text-[10px] text-slate-500 px-1">{m.timestamp}</p>
                </div>
              </motion.div>
            ))}

            {loading && (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-2xl rounded-tl-none flex items-center gap-2 text-xs text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                  Querying live property database...
                </div>
              </div>
            )}
            <div ref={endRef} />
          </CardContent>

          {/* Input Form */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/80">
            <form onSubmit={handleSend} className="flex items-center gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask e.g. 'How many beds available?', 'Who has overdue payments?', or 'Can I give a 15% discount?'"
                className="flex-1 bg-slate-900 border-slate-700"
                disabled={loading}
              />
              <Button type="submit" disabled={loading || !input.trim()} className="font-bold">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </Card>
      </div>

      {/* Interactive AI Voice Call Simulator Dialog */}
      <Dialog open={showVoiceModal} onOpenChange={setShowVoiceModal}>
        <DialogContent className="max-w-md bg-slate-900 border-slate-700 text-center">
          <DialogHeader>
            <DialogTitle className="text-white">AI Phone Receptionist Simulation</DialogTitle>
            <CardDescription className="text-slate-300">Test how the AI greets incoming callers in Indian languages</CardDescription>
          </DialogHeader>

          <div className="p-6 space-y-5">
            {!voiceCallActive ? (
              <div className="space-y-4 text-left">
                <div>
                  <Label>Caller Name</Label>
                  <Input value={callerName} onChange={(e) => setCallerName(e.target.value)} placeholder="e.g. Ramesh" />
                </div>
                <div>
                  <Label>Caller Preferred Language</Label>
                  <Select value={callerLang} onValueChange={setCallerLang}>
                    <SelectTrigger className="bg-slate-950 border-slate-700"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700">
                      <SelectItem value="hi">Hindi (हिंदी)</SelectItem>
                      <SelectItem value="kn">Kannada (ಕನ್ನಡ)</SelectItem>
                      <SelectItem value="te">Telugu (తెలుగు)</SelectItem>
                      <SelectItem value="ta">Tamil (தமிழ்)</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleStartVoiceCall} className="w-full bg-emerald-600 hover:bg-emerald-500 font-bold">
                  <PhoneCall className="h-4 w-4 mr-2" /> Place Incoming Call
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="h-20 w-20 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto animate-pulse">
                  <PhoneCall className="h-10 w-10" />
                </div>
                <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Call Connected · Active Speech</p>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-sm font-medium text-slate-100 text-left leading-relaxed">
                  <p className="text-xs font-bold text-indigo-400 mb-1">AI Voice Output:</p>
                  "{voiceGreeting}"
                </div>

                <Button variant="destructive" onClick={() => setVoiceCallActive(false)} className="w-full font-bold">
                  <PhoneOff className="h-4 w-4 mr-2" /> End Simulation Call
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
