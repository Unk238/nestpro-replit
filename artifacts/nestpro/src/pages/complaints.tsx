import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle, Plus, CheckCircle2, Clock,
  Filter, Search, Wrench, ShieldAlert
} from 'lucide-react';
import { Layout } from '@/components/layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { usePropertyContext } from '@/components/property-provider';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils';

export default function ComplaintsPage() {
  const qc = useQueryClient();
  const { activeProperty } = usePropertyContext();
  const pid = activeProperty?.id;

  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddComplaint, setShowAddComplaint] = useState(false);

  const [complaintForm, setComplaintForm] = useState({
    title: '', description: '', category: 'maintenance', priority: 'medium', guestId: ''
  });

  const { data: complaints = [], isLoading } = useQuery({
    queryKey: ['complaints', pid, statusFilter],
    queryFn: () => api.getComplaints({ propertyId: pid, status: statusFilter === 'all' ? undefined : statusFilter }),
  });

  const { data: guests = [] } = useQuery({
    queryKey: ['guests', pid],
    queryFn: () => api.getGuests({ propertyId: pid, status: 'active' }),
  });

  const createComplaintMutation = useMutation({
    mutationFn: (data: any) => api.createComplaint({ ...data, propertyId: pid }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['complaints'] });
      setShowAddComplaint(false);
      toast({ title: 'Maintenance complaint registered!', variant: 'success' });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: any) => api.updateComplaint(id, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['complaints'] });
      toast({ title: 'Status updated!', variant: 'success' });
    },
  });

  return (
    <Layout title="Complaints & Maintenance Tasks">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Filter className="h-4 w-4 text-[#667085]" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-white border-[#E5EAF1]">
              <SelectItem value="all">All Complaints</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={() => setShowAddComplaint(true)} className="btn-primary font-bold">
          <Plus className="h-4 w-4 mr-1.5" /> Log Issue / Complaint
        </Button>
      </div>

      {/* Complaints Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : complaints.length === 0 ? (
            <div className="text-center py-16">
              <Wrench className="h-12 w-12 text-[#CBD5E1] mx-auto mb-3" />
              <p className="text-[#172033] font-bold">No active complaints</p>
              <p className="text-xs text-[#667085] mt-1">All maintenance issues and resident tickets are resolved.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Complaint Title</TableHead>
                  <TableHead>Resident / Unit</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {complaints.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <p className="font-bold text-[#172033] text-sm">{c.title}</p>
                      {c.description && <p className="text-xs text-[#667085] line-clamp-1">{c.description}</p>}
                    </TableCell>
                    <TableCell className="text-xs text-[#172033]">
                      {c.guestName || 'Property Common Area'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize text-[10px]">{c.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={c.priority === 'urgent' || c.priority === 'high' ? 'destructive' : c.priority === 'medium' ? 'warning' : 'secondary'}>
                        {c.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={c.status === 'resolved' ? 'success' : c.status === 'in_progress' ? 'default' : 'warning'}>
                        {c.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {c.status !== 'resolved' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatusMutation.mutate({ id: c.id, status: 'resolved' })}
                          className="text-xs font-semibold text-[#16845B] hover:bg-[#E8F5E9]"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Mark Resolved
                        </Button>
                      ) : (
                        <span className="text-[11px] text-[#16845B] font-bold">Completed</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Complaint Dialog */}
      <Dialog open={showAddComplaint} onOpenChange={setShowAddComplaint}>
        <DialogContent className="max-w-md bg-white border-[#E5EAF1]">
          <DialogHeader><DialogTitle>Log Maintenance / Complaint</DialogTitle></DialogHeader>
          <div className="space-y-4 p-4">
            <div>
              <Label>Complaint Title *</Label>
              <Input value={complaintForm.title} onChange={(e) => setComplaintForm({ ...complaintForm, title: e.target.value })} placeholder="e.g. Geyser not heating in Room 204" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Category</Label>
                <Select value={complaintForm.category} onValueChange={(v) => setComplaintForm({ ...complaintForm, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white border-[#E5EAF1]">
                    <SelectItem value="maintenance">Maintenance / Repair</SelectItem>
                    <SelectItem value="cleanliness">Cleanliness</SelectItem>
                    <SelectItem value="internet">Wi-Fi / Internet</SelectItem>
                    <SelectItem value="food">Food / Mess</SelectItem>
                    <SelectItem value="noise">Noise / Disturbance</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priority</Label>
                <Select value={complaintForm.priority} onValueChange={(v) => setComplaintForm({ ...complaintForm, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white border-[#E5EAF1]">
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Detailed Notes</Label>
              <Textarea rows={3} value={complaintForm.description} onChange={(e) => setComplaintForm({ ...complaintForm, description: e.target.value })} placeholder="Describe the issue..." />
            </div>
          </div>
          <DialogFooter className="p-4 border-t border-[#E5EAF1]">
            <Button variant="ghost" onClick={() => setShowAddComplaint(false)}>Cancel</Button>
            <Button disabled={createComplaintMutation.isPending || !complaintForm.title} onClick={() => createComplaintMutation.mutate(complaintForm)} className="btn-primary font-bold">
              Submit Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
