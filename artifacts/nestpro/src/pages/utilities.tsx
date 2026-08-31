import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Zap, Plus, IndianRupee, Calculator, CheckCircle2, History } from 'lucide-react';
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
import { formatCurrency } from '@/lib/utils';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function UtilitiesPage() {
  const qc = useQueryClient();
  const { activeProperty } = usePropertyContext();
  const pid = activeProperty?.id;

  const [showAddMeter, setShowAddMeter] = useState(false);
  const [showRecordBill, setShowRecordBill] = useState(false);

  const [meterForm, setMeterForm] = useState({ meterNumber: '', label: '', type: 'electricity', unitRate: '9.50' });
  const [billForm, setBillForm] = useState({
    meterId: '',
    previousReading: '',
    currentReading: '',
    billingMonth: new Date().getMonth() + 1,
    billingYear: new Date().getFullYear(),
    splitMethod: 'equal',
    notes: '',
  });

  const { data: meters = [], isLoading: metersLoading } = useQuery({
    queryKey: ['meters', pid],
    queryFn: () => api.getMeters(pid!),
    enabled: !!pid,
  });

  const { data: bills = [], isLoading: billsLoading } = useQuery({
    queryKey: ['utility-bills', pid],
    queryFn: () => api.getUtilityBills(pid!),
    enabled: !!pid,
  });

  const addMeterMutation = useMutation({
    mutationFn: (data: any) => api.createMeter(pid!, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meters', pid] });
      setShowAddMeter(false);
      toast({ title: 'Meter added!', variant: 'success' });
    },
  });

  const recordBillMutation = useMutation({
    mutationFn: (data: any) => api.createUtilityBill(pid!, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['utility-bills', pid] });
      setShowRecordBill(false);
      toast({ title: 'Utility bill calculated and saved!', variant: 'success' });
    },
  });

  const selectedMeter = meters.find((m) => String(m.id) === String(billForm.meterId));
  const calcUnits = Math.max(0, Number(billForm.currentReading || 0) - Number(billForm.previousReading || 0));
  const calcTotal = calcUnits * Number(selectedMeter?.unitRate || 9.5);

  return (
    <Layout title="Utilities & Multi-Meter Management">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white">Electricity & Utility Meters</h2>
          <p className="text-xs text-slate-300">Track multiple floor/room meters and divide bills equally or per occupant</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowAddMeter(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add Meter
          </Button>
          <Button onClick={() => setShowRecordBill(true)} disabled={meters.length === 0}>
            <Calculator className="h-4 w-4 mr-1" /> Record Meter Reading
          </Button>
        </div>
      </div>

      {/* Meter Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {metersLoading ? (
          Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)
        ) : meters.length === 0 ? (
          <Card className="col-span-full border-slate-800 bg-slate-900/90">
            <CardContent className="p-8 text-center">
              <Zap className="h-10 w-10 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-100 font-bold text-sm">No utility meters configured</p>
              <p className="text-xs text-slate-400 mt-1">Add your building or floor meters to track kilowatt-hour (kWh) readings</p>
            </CardContent>
          </Card>
        ) : (
          meters.map((m: any) => (
            <Card key={m.id} className="border-slate-800 bg-slate-900/90">
              <CardContent className="p-5 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                      <Zap className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-white">{m.label}</p>
                      <p className="text-xs font-mono text-slate-400">Meter #{m.meterNumber}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="capitalize text-[10px]">{m.type}</Badge>
                </div>
                <div className="pt-2 flex justify-between items-center text-xs border-t border-slate-800">
                  <span className="text-slate-400">Rate per Unit (kWh):</span>
                  <span className="text-emerald-400 font-bold font-mono">₹{m.unitRate}/unit</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Bill Calculation History */}
      <Card className="border-slate-800 bg-slate-900/90">
        <CardHeader>
          <CardTitle className="text-base text-white flex items-center gap-2">
            <History className="h-4 w-4 text-indigo-400" /> Utility Bill History & Allocations
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {billsLoading ? (
            <div className="p-6 space-y-3">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : bills.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">No bill calculations recorded yet</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800">
                  <TableHead>Meter</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Readings (Prev → Curr)</TableHead>
                  <TableHead>Units Consumed</TableHead>
                  <TableHead>Total Bill</TableHead>
                  <TableHead>Split Allocation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bills.map((b: any) => (
                  <TableRow key={b.id} className="border-slate-800/80">
                    <TableCell className="font-bold text-white">{b.meterLabel}</TableCell>
                    <TableCell className="text-xs text-slate-300">{MONTH_NAMES[b.billingMonth - 1]} {b.billingYear}</TableCell>
                    <TableCell className="text-xs font-mono text-slate-400">{b.previousReading} → {b.currentReading}</TableCell>
                    <TableCell className="text-xs font-bold text-indigo-300">{b.unitsConsumed} units</TableCell>
                    <TableCell className="text-xs font-extrabold text-emerald-400">{formatCurrency(b.totalAmount)}</TableCell>
                    <TableCell>
                      <Badge variant="default" className="text-[10px] capitalize">
                        {b.splitMethod.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Meter Dialog */}
      <Dialog open={showAddMeter} onOpenChange={setShowAddMeter}>
        <DialogContent className="max-w-md bg-slate-900 border-slate-700">
          <DialogHeader><DialogTitle className="text-white">Add Utility Meter</DialogTitle></DialogHeader>
          <div className="space-y-4 p-6">
            <div>
              <Label>Meter Label *</Label>
              <Input value={meterForm.label} onChange={(e) => setMeterForm({ ...meterForm, label: e.target.value })} placeholder="e.g. Ground Floor AC Meter" />
            </div>
            <div>
              <Label>Physical Meter Number / CA No. *</Label>
              <Input value={meterForm.meterNumber} onChange={(e) => setMeterForm({ ...meterForm, meterNumber: e.target.value })} placeholder="e.g. BESCOM-748291" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Utility Type</Label>
                <Select value={meterForm.type} onValueChange={(v) => setMeterForm({ ...meterForm, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    <SelectItem value="electricity">Electricity</SelectItem>
                    <SelectItem value="water">Water Tanker</SelectItem>
                    <SelectItem value="generator">Diesel Generator</SelectItem>
                    <SelectItem value="gas">Commercial Gas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Rate per Unit (₹)</Label>
                <Input type="number" step="0.5" value={meterForm.unitRate} onChange={(e) => setMeterForm({ ...meterForm, unitRate: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter className="p-6 border-t border-slate-800">
            <Button variant="ghost" onClick={() => setShowAddMeter(false)}>Cancel</Button>
            <Button disabled={addMeterMutation.isPending || !meterForm.label || !meterForm.meterNumber} onClick={() => addMeterMutation.mutate(meterForm)}>
              Save Meter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record Bill Dialog */}
      <Dialog open={showRecordBill} onOpenChange={setShowRecordBill}>
        <DialogContent className="max-w-md bg-slate-900 border-slate-700">
          <DialogHeader><DialogTitle className="text-white">Record & Calculate Meter Reading</DialogTitle></DialogHeader>
          <div className="space-y-4 p-6">
            <div>
              <Label>Select Meter</Label>
              <Select value={billForm.meterId} onValueChange={(v) => setBillForm({ ...billForm, meterId: v })}>
                <SelectTrigger><SelectValue placeholder="Choose meter" /></SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  {meters.map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>{m.label} (₹{m.unitRate}/u)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Previous Reading</Label>
                <Input type="number" value={billForm.previousReading} onChange={(e) => setBillForm({ ...billForm, previousReading: e.target.value })} placeholder="1240" />
              </div>
              <div>
                <Label>Current Reading</Label>
                <Input type="number" value={billForm.currentReading} onChange={(e) => setBillForm({ ...billForm, currentReading: e.target.value })} placeholder="1580" />
              </div>
            </div>

            {selectedMeter && (
              <div className="p-3.5 rounded-xl bg-indigo-950/50 border border-indigo-500/30 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-300">Units Consumed:</span>
                  <span className="font-bold text-white">{calcUnits} units</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-400 text-sm pt-1 border-t border-indigo-900">
                  <span>Total Calculated Bill:</span>
                  <span>₹{calcTotal.toFixed(0)}</span>
                </div>
              </div>
            )}

            <div>
              <Label>Tenant Split Method</Label>
              <Select value={billForm.splitMethod} onValueChange={(v) => setBillForm({ ...billForm, splitMethod: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value="equal">Equal Split Across All Occupants</SelectItem>
                  <SelectItem value="per_room">Divide by Occupied Rooms</SelectItem>
                  <SelectItem value="per_bed">Divide by Active Beds</SelectItem>
                  <SelectItem value="by_days">Pro-rata by Days Stayed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="p-6 border-t border-slate-800">
            <Button variant="ghost" onClick={() => setShowRecordBill(false)}>Cancel</Button>
            <Button disabled={recordBillMutation.isPending || !billForm.meterId || !billForm.currentReading} onClick={() => recordBillMutation.mutate(billForm)}>
              Save Calculation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
