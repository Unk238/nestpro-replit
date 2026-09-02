import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import {
  Users, Plus, Search, Filter, QrCode, ArrowRight,
  Phone, Mail, CheckCircle2, XCircle, Clock, Copy, ExternalLink
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

export default function GuestsPage() {
  const qc = useQueryClient();
  const [, navigate] = useLocation();
  const { activeProperty } = usePropertyContext();
  const pid = activeProperty?.id;

  const [statusFilter, setStatusFilter] = useState('active');
  const [search, setSearch] = useState('');
  const [showAddGuest, setShowAddGuest] = useState(false);
  const [showTokenDialog, setShowTokenDialog] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState('');

  const [guestForm, setGuestForm] = useState({
    name: '', phone: '', email: '', aadhaar: '', emergencyContact: '', emergencyPhone: '',
    occupation: '', hometown: '', monthlyRent: '8500', depositAmount: '10000', notes: ''
  });

  const { data: guests = [], isLoading } = useQuery({
    queryKey: ['guests', pid, statusFilter],
    queryFn: () => api.getGuests({ propertyId: pid, status: statusFilter === 'all' ? undefined : statusFilter }),
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ['checkin-submissions'],
    queryFn: api.getCheckinSubmissions,
  });

  const createGuestMutation = useMutation({
    mutationFn: (data: any) => api.createGuest({ ...data, propertyId: pid }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['guests'] });
      setShowAddGuest(false);
      toast({ title: 'Resident registered & checked in!', variant: 'success' });
    },
  });

  const generateTokenMutation = useMutation({
    mutationFn: () => api.generateCheckinToken({ propertyId: pid! }),
    onSuccess: (res) => {
      setGeneratedUrl(res.url);
      setShowTokenDialog(true);
      toast({ title: 'Self Check-In Link Generated!', variant: 'success' });
    },
  });

  const approveSubmissionMutation = useMutation({
    mutationFn: (id: number) => api.approveCheckin(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['checkin-submissions'] });
      qc.invalidateQueries({ queryKey: ['guests'] });
      toast({ title: 'Submission approved! Resident checked in.', variant: 'success' });
    },
  });

  const rejectSubmissionMutation = useMutation({
    mutationFn: (id: number) => api.rejectCheckin(id, 'Missing documentation'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['checkin-submissions'] });
      toast({ title: 'Submission rejected', variant: 'destructive' });
    },
  });

  const filteredGuests = guests.filter((g: any) =>
    g.name?.toLowerCase().includes(search.toLowerCase()) ||
    g.phone?.includes(search) ||
    g.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout title="Guests & Residents Management">
      {/* Submissions Section if any */}
      {submissions.length > 0 && (
        <Card className="border-[#FFE082] bg-[#FFFDF5]">
          <CardHeader className="p-4 pb-2 border-b border-[#FFE082]/60">
            <CardTitle className="text-sm font-bold text-[#D98A00] flex items-center gap-2">
              <Clock className="h-4 w-4" /> Pending Self Check-In Submissions ({submissions.length})
            </CardTitle>
            <CardDescription className="text-xs text-[#667085]">
              Guests who submitted their details and ID documents via self check-in link.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Guest Name</TableHead>
                  <TableHead>Phone / Email</TableHead>
                  <TableHead>Submitted Date</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((sub: any) => {
                  const data = sub.submittedData || {};
                  return (
                    <TableRow key={sub.id}>
                      <TableCell className="font-bold text-[#172033]">{data.name || 'Guest Applicant'}</TableCell>
                      <TableCell className="text-xs text-[#667085]">{data.phone || data.email || '—'}</TableCell>
                      <TableCell className="text-xs text-[#667085]">{formatDate(sub.createdAt)}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          size="sm"
                          onClick={() => approveSubmissionMutation.mutate(sub.id)}
                          className="bg-[#16845B] hover:bg-[#116947] text-white text-xs font-bold h-7.5 px-2.5"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => rejectSubmissionMutation.mutate(sub.id)}
                          className="text-[#D64545] hover:bg-[#FFEBEE] text-xs font-bold h-7.5 px-2.5"
                        >
                          <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Filter and Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#98A2B3]" />
            <Input className="pl-10" placeholder="Search resident name or phone..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-white border-[#E5EAF1]">
              <SelectItem value="active">Active Residents</SelectItem>
              <SelectItem value="checked_out">Checked Out</SelectItem>
              <SelectItem value="all">All Records</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => generateTokenMutation.mutate()} disabled={!pid} className="text-xs font-bold">
            <QrCode className="h-3.5 w-3.5 mr-1.5 text-[#2F6FED]" /> Issue Self Check-In Link
          </Button>
          <Button onClick={() => setShowAddGuest(true)} className="btn-primary text-xs font-bold">
            <Plus className="h-4 w-4 mr-1.5" /> Check-In Resident
          </Button>
        </div>
      </div>

      {/* Guests Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
          ) : filteredGuests.length === 0 ? (
            <div className="text-center py-16">
              <Users className="h-12 w-12 text-[#CBD5E1] mx-auto mb-3" />
              <p className="text-[#172033] font-bold">No residents found</p>
              <p className="text-xs text-[#667085] mt-1">Add your first resident or dispatch a digital self check-in link.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Resident Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Allotted Bed</TableHead>
                  <TableHead>Check-In Date</TableHead>
                  <TableHead>Monthly Rent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGuests.map((g: any) => (
                  <TableRow key={g.id}>
                    <TableCell>
                      <p className="font-bold text-[#172033] text-sm">{g.name}</p>
                      <p className="text-xs text-[#667085]">{g.occupation || 'Resident'}</p>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-[#172033] block">{g.phone || '—'}</span>
                      <span className="text-xs text-[#667085]">{g.email || '—'}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">{g.bedLabel || 'Unassigned'}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-[#667085]">{formatDate(g.checkInDate)}</TableCell>
                    <TableCell className="text-xs font-bold text-[#172033]">{formatCurrency(g.monthlyRent)}/mo</TableCell>
                    <TableCell>
                      <Badge variant={g.status === 'active' ? 'success' : 'secondary'}>
                        {g.status === 'active' ? 'Active Resident' : 'Checked Out'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => navigate(`/guests/${g.id}`)}
                        className="text-xs font-semibold"
                      >
                        Profile & Ledger <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Manual Check-In Dialog */}
      <Dialog open={showAddGuest} onOpenChange={setShowAddGuest}>
        <DialogContent className="max-w-xl bg-white border-[#E5EAF1]">
          <DialogHeader><DialogTitle>Resident Check-In Form</DialogTitle></DialogHeader>
          <div className="space-y-4 p-5 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Full Name *</Label>
                <Input value={guestForm.name} onChange={(e) => setGuestForm({ ...guestForm, name: e.target.value })} placeholder="Kunal Verma" />
              </div>
              <div>
                <Label>Phone Number *</Label>
                <Input value={guestForm.phone} onChange={(e) => setGuestForm({ ...guestForm, phone: e.target.value })} placeholder="+91 98765 43210" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Email Address</Label>
                <Input type="email" value={guestForm.email} onChange={(e) => setGuestForm({ ...guestForm, email: e.target.value })} placeholder="kunal@gmail.com" />
              </div>
              <div>
                <Label>Aadhaar / National ID No.</Label>
                <Input value={guestForm.aadhaar} onChange={(e) => setGuestForm({ ...guestForm, aadhaar: e.target.value })} placeholder="XXXX XXXX XXXX" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Monthly Rent (₹) *</Label>
                <Input type="number" value={guestForm.monthlyRent} onChange={(e) => setGuestForm({ ...guestForm, monthlyRent: e.target.value })} />
              </div>
              <div>
                <Label>Security Deposit (₹)</Label>
                <Input type="number" value={guestForm.depositAmount} onChange={(e) => setGuestForm({ ...guestForm, depositAmount: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Emergency Contact Person</Label>
                <Input value={guestForm.emergencyContact} onChange={(e) => setGuestForm({ ...guestForm, emergencyContact: e.target.value })} placeholder="Father / Guardian" />
              </div>
              <div>
                <Label>Emergency Phone</Label>
                <Input value={guestForm.emergencyPhone} onChange={(e) => setGuestForm({ ...guestForm, emergencyPhone: e.target.value })} placeholder="+91 98765 00000" />
              </div>
            </div>
          </div>
          <DialogFooter className="p-4 border-t border-[#E5EAF1]">
            <Button variant="ghost" onClick={() => setShowAddGuest(false)}>Cancel</Button>
            <Button disabled={createGuestMutation.isPending || !guestForm.name || !guestForm.phone} onClick={() => createGuestMutation.mutate(guestForm)} className="btn-primary font-bold">
              {createGuestMutation.isPending ? 'Checking In...' : 'Confirm Check-In'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generated Token Dialog */}
      <Dialog open={showTokenDialog} onOpenChange={setShowTokenDialog}>
        <DialogContent className="max-w-md bg-white border-[#E5EAF1] text-center">
          <DialogHeader>
            <DialogTitle>Self Check-In Link Generated</DialogTitle>
            <CardDescription className="text-xs text-[#667085]">
              Share this link with your incoming tenant to upload their KYC & emergency contact details.
            </CardDescription>
          </DialogHeader>
          <div className="space-y-4 p-4">
            <Input readOnly value={generatedUrl} className="bg-[#F7F9FC] font-mono text-xs text-center" />
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 text-xs font-bold"
                onClick={() => {
                  navigator.clipboard.writeText(generatedUrl);
                  toast({ title: 'Link copied to clipboard!', variant: 'success' });
                }}
              >
                <Copy className="h-3.5 w-3.5 mr-1" /> Copy Link
              </Button>
              <a href={generatedUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                <Button className="btn-primary w-full text-xs font-bold">
                  Open Portal <ExternalLink className="h-3.5 w-3.5 ml-1" />
                </Button>
              </a>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
