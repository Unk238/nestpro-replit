import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserCog, Plus, ShieldCheck, Phone, Mail, Trash2, Pencil, CheckCircle2 } from 'lucide-react';
import { Layout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { getInitials } from '@/lib/utils';

const ROLE_PERMISSIONS: Record<string, string[]> = {
  owner: ['Full Financial Visibility', 'Property Creation & Deletion', 'Team Management', 'AI Pricing Limits', 'Legal & Services'],
  manager: ['Property Operations', 'Guest Management', 'Record Payments', 'Document Approvals', 'Maintenance Tasks'],
  operations_manager: ['Multi-Branch Supervision', 'Occupancy Analytics', 'Staff Delegation', 'Payment Approvals'],
  receptionist: ['Guest Check-Ins & Check-Outs', 'Phone Calls & AI Handoff', 'Registration Link Dispatch'],
  staff: ['Maintenance Updates', 'Room Cleaning Logs', 'Assigned Block Operations'],
  landlord: ['Monthly Rent Visibility', 'Tenancy Agreements', 'Utility Split Reports'],
  broker: ['New Tenant Onboarding', 'Room Vacancy Exploration'],
  admin: ['Full Configuration Access', 'Audit Logs', 'Database Settings'],
};

export default function TeamPage() {
  const qc = useQueryClient();
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: '', phone: '', email: '', role: 'manager' });

  const { data: staffList = [], isLoading } = useQuery({
    queryKey: ['staff'],
    queryFn: api.getStaff,
  });

  const inviteMutation = useMutation({
    mutationFn: api.createStaff,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff'] });
      setShowInvite(false);
      toast({ title: 'Team member added & invitation created!', variant: 'success' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteStaff,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff'] });
      toast({ title: 'Access revoked', variant: 'success' });
    },
  });

  return (
    <Layout title="Team Management & Role-Based Access Control (RBAC)">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <UserCog className="h-4 w-4 text-indigo-400" /> Multi-User Organization Team
          </h2>
          <p className="text-xs text-slate-300">
            Invite managers, receptionists, and staff with granular role-based permissions.
          </p>
        </div>
        <Button onClick={() => setShowInvite(true)} className="font-bold">
          <Plus className="h-4 w-4 mr-1.5" /> Invite Team Member
        </Button>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)
        ) : staffList.length === 0 ? (
          <Card className="col-span-full border-slate-800 bg-slate-900/90">
            <CardContent className="p-8 text-center text-slate-400 text-xs">
              No additional team members yet. Click "Invite Team Member" to grant staff access.
            </CardContent>
          </Card>
        ) : (
          staffList.map((s: any) => {
            const permissions = ROLE_PERMISSIONS[s.role] || ['Basic Operations'];
            return (
              <Card key={s.id} className="border-slate-800 bg-slate-900/90 flex flex-col justify-between">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-11 w-11 border border-slate-700">
                        <AvatarFallback className="font-bold">{getInitials(s.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-bold text-white text-sm">{s.name}</p>
                        <Badge variant="default" className="text-[10px] mt-0.5 capitalize">
                          {s.role.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                    <button
                      onClick={() => { if (confirm(`Revoke access for ${s.name}?`)) deleteMutation.mutate(s.id); }}
                      className="text-slate-500 hover:text-red-400 transition-colors p-1"
                      title="Remove member"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-1 text-xs text-slate-300">
                    {s.phone && <p className="flex items-center gap-2"><Phone className="h-3 w-3 text-slate-400" /> {s.phone}</p>}
                    {s.email && <p className="flex items-center gap-2"><Mail className="h-3 w-3 text-slate-400" /> {s.email}</p>}
                  </div>

                  {/* Granted Permissions List */}
                  <div className="pt-3 border-t border-slate-800 space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Role Permissions:</p>
                    <div className="space-y-1">
                      {permissions.map((p) => (
                        <div key={p} className="flex items-center gap-1.5 text-[11px] text-slate-300">
                          <CheckCircle2 className="h-3 w-3 text-emerald-400 flex-shrink-0" />
                          <span>{p}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Invite Member Dialog */}
      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent className="max-w-md bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Invite New Team Member</DialogTitle>
            <CardDescription className="text-slate-300">Assign a role and grant access to your workspace</CardDescription>
          </DialogHeader>
          <div className="space-y-4 p-6">
            <div>
              <Label>Full Name *</Label>
              <Input value={inviteForm.name} onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })} placeholder="Kavita Sharma" />
            </div>
            <div>
              <Label>Mobile Number (for OTP Login) *</Label>
              <Input value={inviteForm.phone} onChange={(e) => setInviteForm({ ...inviteForm, phone: e.target.value })} placeholder="+91 98765 43210" />
            </div>
            <div>
              <Label>Work Email</Label>
              <Input type="email" value={inviteForm.email} onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })} placeholder="kavita@rentaq.in" />
            </div>
            <div>
              <Label>Assigned Role & Access Level</Label>
              <Select value={inviteForm.role} onValueChange={(v) => setInviteForm({ ...inviteForm, role: v })}>
                <SelectTrigger className="bg-slate-900 border-slate-700 mt-1"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value="manager">Property Manager</SelectItem>
                  <SelectItem value="operations_manager">Operations Manager</SelectItem>
                  <SelectItem value="receptionist">Reception / Front Desk</SelectItem>
                  <SelectItem value="staff">Staff Member</SelectItem>
                  <SelectItem value="landlord">Landlord</SelectItem>
                  <SelectItem value="broker">Broker / Agent</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="p-6 border-t border-slate-800">
            <Button variant="ghost" onClick={() => setShowInvite(false)}>Cancel</Button>
            <Button
              disabled={inviteMutation.isPending || !inviteForm.name || !inviteForm.phone}
              onClick={() => inviteMutation.mutate(inviteForm)}
              className="font-bold"
            >
              Send Access Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
