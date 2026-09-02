import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Sparkles, Loader2, PhoneCall, Globe, ShieldAlert, PhoneOff } from 'lucide-react';
import { Layout } from '@/components/layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
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
      <div className="max-w-5xl mx-auto space-y-5">
        {/* Top Controls Bar */}
        <Card>
          <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-[#2F6FED]" />
                <Label className="mb-0 text-[#667085]">Language:</Label>
                <Select value={aiLang} onValueChange={(v: any) => setAiLang(v)}>
                  <SelectTrigger className="w-36 h-8.5 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white border-[#E5EAF1]">
                    {SUPPORTED_LANGUAGES.map((l) => (
                      <SelectItem key={l.code} value={l.code}>{l.nativeName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-[#D98A00]" />
                <Label className="mb-0 text-[#667085]">Max Discount:</Label>
                <Input
                  type="number"
                  className="w-16 h-8.5 text-xs px-2"
                  value={maxDiscount}
                  onChange={(e) => setMaxDiscount(parseInt(e.target.value) || 0)}
                />
                <span className="text-[#667085]">%</span>
              </div>
            </div>

            <Button size="sm" onClick={() => setShowVoiceModal(true)} className="bg-[#16845B] hover:bg-[#116947] text-white font-bold text-xs gap-1.5 shadow-xs">
              <PhoneCall className="h-4 w-4" /> Simulate Voice Call
            </Button>
          </CardContent>
        </Card>

        {/* Chat Interface Box */}
        <Card className="flex flex-col h-[560px] overflow-hidden shadow-sm">
          {/* Header */}
          <div className="px-5 py-3.5 border-b border-[#E5EAF1] bg-[#F7F9FC] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-[#EFF5FF] text-[#2F6FED] flex items-center justify-center">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#172033] flex items-center gap-1.5">
                  RENTAQ Virtual Front Desk
                </h3>
                <p className="text-[11px] text-[#667085]">Context-aware for {activeProperty?.name || 'All Properties'}</p>
              </div>
            </div>
          </div>

          {/* Messages Feed */}
          <CardContent className="flex-1 overflow-y-auto p-5 space-y-4 bg-white">
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <Avatar className="h-7 w-7 flex-shrink-0">
                  <AvatarFallback className={m.sender === 'user' ? 'bg-[#2F6FED] text-white text-xs' : 'bg-[#EFF5FF] text-[#2F6FED] text-xs'}>
                    {m.sender === 'user' ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                  </AvatarFallback>
                </Avatar>
                <div className={`max-w-[80%] space-y-1 ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`p-3.5 rounded-xl text-xs sm:text-sm leading-relaxed ${
                      m.sender === 'user'
                        ? 'bg-[#2F6FED] text-white rounded-tr-none shadow-xs'
                        : 'bg-[#F7F9FC] border border-[#E5EAF1] text-[#172033] rounded-tl-none'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.text}</p>
                  </div>
                  <p className="text-[10px] text-[#98A2B3] px-1">{m.timestamp}</p>
                </div>
              </motion.div>
            ))}

            {loading && (
              <div className="flex gap-3">
                <Avatar className="h-7 w-7 flex-shrink-0">
                  <AvatarFallback className="bg-[#EFF5FF] text-[#2F6FED]">
                    <Bot className="h-3.5 w-3.5" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-[#F7F9FC] border border-[#E5EAF1] p-3 rounded-xl rounded-tl-none flex items-center gap-2 text-xs text-[#667085]">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-[#2F6FED]" />
                  Querying live property database...
                </div>
              </div>
            )}
            <div ref={endRef} />
          </CardContent>

          {/* Input Form */}
          <div className="p-3.5 border-t border-[#E5EAF1] bg-[#F7F9FC]">
            <form onSubmit={handleSend} className="flex items-center gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask e.g. 'How many beds available?', 'Who has overdue payments?', or 'Can I give a 10% discount?'"
                className="flex-1 bg-white"
                disabled={loading}
              />
              <Button type="submit" disabled={loading || !input.trim()} className="btn-primary font-bold">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </Card>
      </div>

      {/* Voice Call Simulator Dialog */}
      <Dialog open={showVoiceModal} onOpenChange={setShowVoiceModal}>
        <DialogContent className="max-w-md bg-white border-[#E5EAF1] text-center">
          <DialogHeader>
            <DialogTitle>AI Phone Receptionist Simulation</DialogTitle>
            <DialogDescription className="text-xs text-[#667085]">Test how the AI greets incoming callers in Indian languages</DialogDescription>
          </DialogHeader>

          <div className="p-4 space-y-4">
            {!voiceCallActive ? (
              <div className="space-y-3 text-left">
                <div>
                  <Label>Caller Name</Label>
                  <Input value={callerName} onChange={(e) => setCallerName(e.target.value)} placeholder="e.g. Ramesh" />
                </div>
                <div>
                  <Label>Caller Preferred Language</Label>
                  <Select value={callerLang} onValueChange={setCallerLang}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-white border-[#E5EAF1]">
                      <SelectItem value="hi">Hindi (हिंदी)</SelectItem>
                      <SelectItem value="kn">Kannada (ಕನ್ನಡ)</SelectItem>
                      <SelectItem value="te">Telugu (తెలుగు)</SelectItem>
                      <SelectItem value="ta">Tamil (தமிழ்)</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleStartVoiceCall} className="w-full bg-[#16845B] hover:bg-[#116947] text-white font-bold">
                  <PhoneCall className="h-4 w-4 mr-2" /> Place Incoming Call
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="h-16 w-16 rounded-full bg-[#E8F5E9] text-[#16845B] flex items-center justify-center mx-auto animate-pulse">
                  <PhoneCall className="h-8 w-8" />
                </div>
                <p className="text-xs font-bold text-[#16845B] uppercase tracking-wider">Call Connected · Active Speech</p>

                <div className="p-4 rounded-xl bg-[#F7F9FC] border border-[#E5EAF1] text-xs font-medium text-[#172033] text-left leading-relaxed">
                  <p className="text-xs font-bold text-[#2F6FED] mb-1">AI Voice Output:</p>
                  "{voiceGreeting}"
                </div>

                <Button variant="destructive" onClick={() => setVoiceCallActive(false)} className="w-full font-bold">
                  <PhoneOff className="h-4 w-4 mr-2" /> End Call
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
