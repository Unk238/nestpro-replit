import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Globe2, Plus, ArrowRight, IndianRupee, Filter,
  CheckCircle2, Clock, AlertCircle, RefreshCw, Calendar, Loader2
} from 'lucide-react';
import { Layout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { usePropertyContext } from '@/components/property-provider';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { formatCurrency, formatDate } from '@/lib/utils';
import { motion } from 'framer-motion';

const SOURCE_BADGES: Record<string, { label: string; color: string }> = {
  direct: { label: 'Direct Booking', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  booking_com: { label: 'Booking.com', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  airbnb: { label: 'Airbnb', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
  agoda: { label: 'Agoda', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  makemytrip: { label: 'MakeMyTrip', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  expedia: { label: 'Expedia', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
  phone: { label: 'Phone Inquiry', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
  other: { label: 'Other Channel', color: 'bg-slate-700 text-slate-300' },
};

export default function BookingsPage() {
  const qc = useQueryClient();
  const { activeProperty } = usePropertyContext();
  const pid = activeProperty?.id;

  const [channelFilter, setChannelFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [extendingBooking, setExtendingBooking] = useState<any>(null);
  const [extForm, setExtForm] = useState({ newCheckOutDate: '', additionalAmount: '', notes: '' });

  const [bookingForm, setBookingForm] = useState({
    guestName: '',
    guestPhone: '',
    guestEmail: '',
    source: 'direct',
    externalBookingId: '',
    checkInDate: new Date().toISOString().split('T')[0],
    checkOutDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
    grossAmount: '',
    platformFee: '0',
    amountReceived: '',
    notes: '',
  });

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['bookings', pid, channelFilter],
    queryFn: () => api.getBookings({ propertyId: pid, source: channelFilter === 'all' ? undefined : channelFilter }),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.createBooking({ ...data, propertyId: pid }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookings'] });
      setShowCreate(false);
      toast({ title: 'Booking recorded!', variant: 'success' });
    },
  });

  const extendMutation = useMutation({
    mutationFn: ({ id, data }: any) => api.extendBooking(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookings'] });
      setExtendingBooking(null);
      toast({ title: 'Stay extended successfully!', variant: 'success' });
    },
  });

  const totalGross = bookings.reduce((sum, b) => sum + Number(b.grossAmount || 0), 0);
  const totalFees = bookings.reduce((sum, b) => sum + Number(b.platformFee || 0), 0);
  const totalNet = totalGross - totalFees;
  const totalReceived = bookings.reduce((sum, b) => sum + Number(b.amountReceived || 0), 0);

  return (
    <Layout title="Central Booking Inbox & Channels">
      {/* Financial Reconciliation Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Gross Bookings', value: totalGross, color: 'text-indigo-400', bg: 'bg-indigo-950/40' },
          { label: 'Platform Fees (OTAs)', value: totalFees, color: 'text-amber-400', bg: 'bg-amber-950/40' },
          { label: 'Net Receivable', value: totalNet, color: 'text-purple-400', bg: 'bg-purple-950/40' },
          { label: 'Amount Received', value: totalReceived, color: 'text-emerald-400', bg: 'bg-emerald-950/40' },
        ].map(({ label, value, color, bg }) => (
          <Card key={label} className="border-slate-800 bg-slate-900/90">
            <CardContent className="p-5">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${color} ${bg} inline-flex items-center gap-1 mb-2`}>
                <IndianRupee className="h-3.5 w-3.5" /> {label}
              </span>
              <p className="text-2xl font-black text-white">{formatCurrency(value)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter and Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Filter className="h-4 w-4 text-slate-400" />
          <Select value={channelFilter} onValueChange={setChannelFilter}>
            <SelectTrigger className="w-48 bg-slate-900 border-slate-700"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700">
              <SelectItem value="all">All Channels</SelectItem>
              <SelectItem value="direct">Direct Bookings</SelectItem>
              <SelectItem value="booking_com">Booking.com</SelectItem>
              <SelectItem value="airbnb">Airbnb</SelectItem>
              <SelectItem value="agoda">Agoda</SelectItem>
              <SelectItem value="makemytrip">MakeMyTrip</SelectItem>
              <SelectItem value="phone">Phone Inquiries</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={() => setShowCreate(true)} className="font-bold">
          <Plus className="h-4 w-4 mr-1.5" /> Record New Booking
        </Button>
      </div>

      {/* Bookings Table */}
      <Card className="border-slate-800 bg-slate-900/90">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-16">
              <Globe2 className="h-12 w-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-100 font-bold">No bookings found</p>
              <p className="text-xs text-slate-400 mt-1">Direct bookings and channel reservations will appear here</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800">
                  <TableHead>Guest</TableHead>
                  <TableHead>Source / Channel</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Gross / Fees</TableHead>
                  <TableHead>Net Expected</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((b: any) => {
                  const sourceBadge = SOURCE_BADGES[b.source] || SOURCE_BADGES.direct;
                  return (
                    <TableRow key={b.id} className="border-slate-800/80">
                      <TableCell>
                        <p className="font-bold text-white text-sm">{b.guestName}</p>
                        <p className="text-xs text-slate-400">{b.guestPhone || b.guestEmail || '—'}</p>
                      </TableCell>
                      <TableCell>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${sourceBadge.color}`}>
                          {sourceBadge.label}
                        </span>
                        {b.externalBookingId && (
                          <span className="block text-[10px] font-mono text-slate-400 mt-0.5">#{b.externalBookingId}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-slate-200">{formatDate(b.checkInDate)} → {formatDate(b.checkOutDate)}</span>
                        {b.isExtension === 'yes' && (
                          <span className="block text-[10px] text-indigo-400 font-bold mt-0.5">Direct Extension</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-bold text-white">{formatCurrency(b.grossAmount)}</span>
                        {b.platformFee > 0 && (
                          <span className="block text-[10px] text-amber-400 font-mono">-₹{b.platformFee} fee</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-black text-emerald-400">{formatCurrency(b.netReceivable)}</span>
                        <span className="block text-[10px] text-slate-400 capitalize">Rec: {formatCurrency(b.amountReceived)}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={b.status === 'confirmed' ? 'success' : b.status === 'extended' ? 'default' : 'ghost'}>
                          {b.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setExtendingBooking(b);
                            setExtForm({
                              newCheckOutDate: new Date(new Date(b.checkOutDate).getTime() + 3 * 86400000).toISOString().split('T')[0],
                              additionalAmount: String(b.grossAmount || '3000'),
                              notes: '',
                            });
                          }}
                          className="text-xs font-bold"
                        >
                          Extend Stay <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* New Booking Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-xl bg-slate-900 border-slate-700">
          <DialogHeader><DialogTitle className="text-white">Record New Booking</DialogTitle></DialogHeader>
          <div className="space-y-4 p-6 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Guest Name *</Label>
                <Input value={bookingForm.guestName} onChange={(e) => setBookingForm({ ...bookingForm, guestName: e.target.value })} placeholder="Rahul Sharma" />
              </div>
              <div>
                <Label>Channel Source</Label>
                <Select value={bookingForm.source} onValueChange={(v) => setBookingForm({ ...bookingForm, source: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    <SelectItem value="direct">Direct Booking</SelectItem>
                    <SelectItem value="booking_com">Booking.com</SelectItem>
                    <SelectItem value="airbnb">Airbnb</SelectItem>
                    <SelectItem value="agoda">Agoda</SelectItem>
                    <SelectItem value="makemytrip">MakeMyTrip</SelectItem>
                    <SelectItem value="phone">Phone Inquiry</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Guest Phone</Label>
                <Input value={bookingForm.guestPhone} onChange={(e) => setBookingForm({ ...bookingForm, guestPhone: e.target.value })} placeholder="+91 98765 43210" />
              </div>
              <div>
                <Label>External Booking ID (Optional)</Label>
                <Input value={bookingForm.externalBookingId} onChange={(e) => setBookingForm({ ...bookingForm, externalBookingId: e.target.value })} placeholder="e.g. BKG-98471" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Check-In Date *</Label>
                <Input type="date" value={bookingForm.checkInDate} onChange={(e) => setBookingForm({ ...bookingForm, checkInDate: e.target.value })} />
              </div>
              <div>
                <Label>Check-Out Date *</Label>
                <Input type="date" value={bookingForm.checkOutDate} onChange={(e) => setBookingForm({ ...bookingForm, checkOutDate: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label>Gross Amount (₹) *</Label>
                <Input type="number" value={bookingForm.grossAmount} onChange={(e) => setBookingForm({ ...bookingForm, grossAmount: e.target.value })} placeholder="5000" />
              </div>
              <div>
                <Label>Platform Fee (₹)</Label>
                <Input type="number" value={bookingForm.platformFee} onChange={(e) => setBookingForm({ ...bookingForm, platformFee: e.target.value })} placeholder="500" />
              </div>
              <div>
                <Label>Amount Received (₹)</Label>
                <Input type="number" value={bookingForm.amountReceived} onChange={(e) => setBookingForm({ ...bookingForm, amountReceived: e.target.value })} placeholder="5000" />
              </div>
            </div>
          </div>
          <DialogFooter className="p-6 border-t border-slate-800">
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button disabled={createMutation.isPending || !bookingForm.guestName || !bookingForm.grossAmount} onClick={() => createMutation.mutate(bookingForm)}>
              {createMutation.isPending ? 'Recording...' : 'Confirm Booking'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Direct Stay Extension Modal */}
      <Dialog open={!!extendingBooking} onOpenChange={(v) => !v && setExtendingBooking(null)}>
        <DialogContent className="max-w-md bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Direct Stay Extension</DialogTitle>
            <CardDescription className="text-slate-300">
              Extend stay for <strong>{extendingBooking?.guestName}</strong> directly without OTA platform commission.
            </CardDescription>
          </DialogHeader>
          <div className="space-y-4 p-6">
            <div>
              <Label>New Extended Check-Out Date *</Label>
              <Input type="date" value={extForm.newCheckOutDate} onChange={(e) => setExtForm({ ...extForm, newCheckOutDate: e.target.value })} />
            </div>
            <div>
              <Label>Additional Direct Amount (₹) *</Label>
              <Input type="number" value={extForm.additionalAmount} onChange={(e) => setExtForm({ ...extForm, additionalAmount: e.target.value })} />
            </div>
            <div>
              <Label>Extension Notes</Label>
              <Input value={extForm.notes} onChange={(e) => setExtForm({ ...extForm, notes: e.target.value })} placeholder="Paid via UPI direct extension" />
            </div>
          </div>
          <DialogFooter className="p-6 border-t border-slate-800">
            <Button variant="ghost" onClick={() => setExtendingBooking(null)}>Cancel</Button>
            <Button
              disabled={extendMutation.isPending || !extForm.newCheckOutDate}
              onClick={() => extendMutation.mutate({ id: extendingBooking.id, data: { ...extForm, additionalAmount: Number(extForm.additionalAmount) } })}
            >
              {extendMutation.isPending ? 'Extending...' : 'Confirm Direct Extension'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
