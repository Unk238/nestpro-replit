import React, { useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2, Plus, BedDouble, ChevronRight,
  Pencil, Trash2, Layers, CheckCircle2, User, ArrowLeft
} from 'lucide-react';
import { Layout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';

export default function ExplorerPage() {
  const [, params] = useRoute('/properties/:id/explorer');
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const propertyId = parseInt(params?.id || '1', 10);

  const [selectedBuildingId, setSelectedBuildingId] = useState<number | null>(null);
  const [selectedFloorId, setSelectedFloorId] = useState<number | null>(null);

  // Dialog states
  const [showAddBuilding, setShowAddBuilding] = useState(false);
  const [showAddFloor, setShowAddFloor] = useState(false);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [showAddBed, setShowAddBed] = useState(false);
  const [activeRoomForBed, setActiveRoomForBed] = useState<number | null>(null);

  // Forms
  const [buildingName, setBuildingName] = useState('');
  const [floorName, setFloorName] = useState('');
  const [floorNum, setFloorNum] = useState(1);
  const [roomName, setRoomName] = useState('');
  const [roomType, setRoomType] = useState('single');
  const [bedLabel, setBedLabel] = useState('');
  const [bedRent, setBedRent] = useState('8000');

  // Queries
  const { data: property } = useQuery({
    queryKey: ['property', propertyId],
    queryFn: () => api.getProperty(propertyId),
  });

  const { data: buildings = [], isLoading: bldgLoading } = useQuery({
    queryKey: ['buildings', propertyId],
    queryFn: () => api.getBuildings(propertyId),
  });

  const currentBuildingId = selectedBuildingId || buildings[0]?.id;

  const { data: floors = [], isLoading: flrLoading } = useQuery({
    queryKey: ['floors', currentBuildingId],
    queryFn: () => api.getFloors(currentBuildingId!),
    enabled: !!currentBuildingId,
  });

  const currentFloorId = selectedFloorId || floors[0]?.id;

  const { data: rooms = [], isLoading: roomLoading } = useQuery({
    queryKey: ['rooms', currentFloorId],
    queryFn: () => api.getRooms(currentFloorId!),
    enabled: !!currentFloorId,
  });

  // Mutations
  const addBuildingMutation = useMutation({
    mutationFn: (data: any) => api.createBuilding(propertyId, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['buildings', propertyId] }); setShowAddBuilding(false); toast({ title: 'Building added', variant: 'success' }); },
  });

  const addFloorMutation = useMutation({
    mutationFn: (data: any) => api.createFloor(currentBuildingId!, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['floors', currentBuildingId] }); setShowAddFloor(false); toast({ title: 'Floor added', variant: 'success' }); },
  });

  const addRoomMutation = useMutation({
    mutationFn: (data: any) => api.createRoom(currentFloorId!, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['rooms', currentFloorId] }); setShowAddRoom(false); toast({ title: 'Room added', variant: 'success' }); },
  });

  const addBedMutation = useMutation({
    mutationFn: (data: any) => api.createBed(activeRoomForBed!, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['rooms', currentFloorId] }); setShowAddBed(false); toast({ title: 'Bed unit added', variant: 'success' }); },
  });

  return (
    <Layout title={`${property?.name || 'Property'} — Structure Explorer`}>
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => navigate('/properties')} className="text-xs">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Properties
        </Button>
        <Button size="sm" onClick={() => setShowAddBuilding(true)} className="btn-primary text-xs font-bold">
          <Plus className="h-4 w-4 mr-1" /> Add Building
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Buildings & Floors Tree */}
        <div className="lg:col-span-4 space-y-4">
          <Card>
            <CardHeader className="pb-3 border-b border-[#E5EAF1] flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Building Blocks</CardTitle>
              <Button size="sm" variant="ghost" onClick={() => setShowAddBuilding(true)} className="text-xs text-[#2F6FED] p-0 h-auto font-semibold">
                + Block
              </Button>
            </CardHeader>
            <CardContent className="p-2 space-y-1">
              {bldgLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : buildings.length === 0 ? (
                <p className="text-xs text-[#667085] p-3 text-center">No buildings yet</p>
              ) : (
                buildings.map((b: any) => (
                  <button
                    key={b.id}
                    onClick={() => { setSelectedBuildingId(b.id); setSelectedFloorId(null); }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold transition-colors ${
                      currentBuildingId === b.id
                        ? 'bg-[#EFF5FF] text-[#2F6FED]'
                        : 'text-[#172033] hover:bg-[#F7F9FC]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <span>{b.name}</span>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 opacity-60" />
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 border-b border-[#E5EAF1] flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Floors</CardTitle>
              <Button
                size="sm"
                variant="ghost"
                disabled={!currentBuildingId}
                onClick={() => setShowAddFloor(true)}
                className="text-xs text-[#2F6FED] p-0 h-auto font-semibold"
              >
                + Floor
              </Button>
            </CardHeader>
            <CardContent className="p-2 space-y-1">
              {flrLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : floors.length === 0 ? (
                <p className="text-xs text-[#667085] p-3 text-center">No floors created in this building</p>
              ) : (
                floors.map((f: any) => (
                  <button
                    key={f.id}
                    onClick={() => setSelectedFloorId(f.id)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold transition-colors ${
                      currentFloorId === f.id
                        ? 'bg-[#EFF5FF] text-[#2F6FED]'
                        : 'text-[#172033] hover:bg-[#F7F9FC]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4" />
                      <span>{f.name} (Level {f.floorNumber})</span>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 opacity-60" />
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Rooms & Beds in Floor */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#172033]">
              Units on {floors.find((f: any) => f.id === currentFloorId)?.name || 'Selected Floor'}
            </h3>
            <Button
              size="sm"
              disabled={!currentFloorId}
              onClick={() => setShowAddRoom(true)}
              className="btn-primary text-xs font-bold"
            >
              <Plus className="h-4 w-4 mr-1" /> Add Room
            </Button>
          </div>

          {roomLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
            </div>
          ) : rooms.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <BedDouble className="h-10 w-10 text-[#CBD5E1] mx-auto mb-2" />
                <p className="text-xs font-bold text-[#172033]">No rooms on this floor</p>
                <p className="text-xs text-[#667085] mt-1">Click "Add Room" to create rooms and bed allotments.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {rooms.map((r: any) => (
                <Card key={r.id} className="hover:border-[#CBD5E1] transition-all">
                  <CardHeader className="p-4 pb-2 border-b border-[#E5EAF1] flex flex-row items-center justify-between">
                    <div>
                      <p className="font-bold text-sm text-[#172033]">{r.name}</p>
                      <Badge variant="outline" className="text-[10px] uppercase font-mono mt-0.5">{r.type}</Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => { setActiveRoomForBed(r.id); setShowAddBed(true); }}
                      className="text-xs text-[#2F6FED] font-bold h-7 px-2"
                    >
                      + Bed Unit
                    </Button>
                  </CardHeader>
                  <CardContent className="p-4 pt-3 space-y-2">
                    {r.beds && r.beds.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {r.beds.map((b: any) => {
                          const isOccupied = b.status === 'occupied';
                          return (
                            <div
                              key={b.id}
                              className={`p-2.5 rounded-lg border text-xs flex flex-col justify-between ${
                                isOccupied
                                  ? 'bg-[#EFF5FF] border-[#D6E4FF] text-[#2F6FED]'
                                  : 'bg-[#E8F5E9] border-[#C8E6C9] text-[#16845B]'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-bold">{b.label}</span>
                                <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-white/70">
                                  {b.status}
                                </span>
                              </div>
                              <p className="text-[11px] font-semibold text-[#172033]">
                                {formatCurrency(b.monthlyRent)}/mo
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-[#667085] py-2 text-center">No beds added yet</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Building Dialog */}
      <Dialog open={showAddBuilding} onOpenChange={setShowAddBuilding}>
        <DialogContent className="max-w-md bg-white border-[#E5EAF1]">
          <DialogHeader><DialogTitle>Add Building Block</DialogTitle></DialogHeader>
          <div className="space-y-4 p-4">
            <div>
              <Label>Building Name *</Label>
              <Input value={buildingName} onChange={(e) => setBuildingName(e.target.value)} placeholder="e.g. Block B / Tower 2" />
            </div>
          </div>
          <DialogFooter className="p-4 border-t border-[#E5EAF1]">
            <Button variant="ghost" onClick={() => setShowAddBuilding(false)}>Cancel</Button>
            <Button disabled={addBuildingMutation.isPending || !buildingName} onClick={() => addBuildingMutation.mutate({ name: buildingName })} className="btn-primary font-bold">
              Save Building
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Floor Dialog */}
      <Dialog open={showAddFloor} onOpenChange={setShowAddFloor}>
        <DialogContent className="max-w-md bg-white border-[#E5EAF1]">
          <DialogHeader><DialogTitle>Add Floor</DialogTitle></DialogHeader>
          <div className="space-y-4 p-4">
            <div>
              <Label>Floor Name *</Label>
              <Input value={floorName} onChange={(e) => setFloorName(e.target.value)} placeholder="e.g. 1st Floor" />
            </div>
            <div>
              <Label>Floor Number (Level)</Label>
              <Input type="number" value={floorNum} onChange={(e) => setFloorNum(parseInt(e.target.value) || 0)} />
            </div>
          </div>
          <DialogFooter className="p-4 border-t border-[#E5EAF1]">
            <Button variant="ghost" onClick={() => setShowAddFloor(false)}>Cancel</Button>
            <Button disabled={addFloorMutation.isPending || !floorName} onClick={() => addFloorMutation.mutate({ name: floorName, floorNumber: floorNum })} className="btn-primary font-bold">
              Save Floor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Room Dialog */}
      <Dialog open={showAddRoom} onOpenChange={setShowAddRoom}>
        <DialogContent className="max-w-md bg-white border-[#E5EAF1]">
          <DialogHeader><DialogTitle>Add Room</DialogTitle></DialogHeader>
          <div className="space-y-4 p-4">
            <div>
              <Label>Room Label / Number *</Label>
              <Input value={roomName} onChange={(e) => setRoomName(e.target.value)} placeholder="e.g. Room 201" />
            </div>
            <div>
              <Label>Room Sharing Type</Label>
              <Select value={roomType} onValueChange={setRoomType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="bg-white border-[#E5EAF1]">
                  <SelectItem value="single">Single Occupancy</SelectItem>
                  <SelectItem value="double">Double Sharing</SelectItem>
                  <SelectItem value="triple">Triple Sharing</SelectItem>
                  <SelectItem value="quad">Four Sharing</SelectItem>
                  <SelectItem value="dormitory">Dormitory</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="p-4 border-t border-[#E5EAF1]">
            <Button variant="ghost" onClick={() => setShowAddRoom(false)}>Cancel</Button>
            <Button disabled={addRoomMutation.isPending || !roomName} onClick={() => addRoomMutation.mutate({ name: roomName, type: roomType })} className="btn-primary font-bold">
              Save Room
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Bed Dialog */}
      <Dialog open={showAddBed} onOpenChange={setShowAddBed}>
        <DialogContent className="max-w-md bg-white border-[#E5EAF1]">
          <DialogHeader><DialogTitle>Add Bed Unit</DialogTitle></DialogHeader>
          <div className="space-y-4 p-4">
            <div>
              <Label>Bed Label *</Label>
              <Input value={bedLabel} onChange={(e) => setBedLabel(e.target.value)} placeholder="e.g. 201-A" />
            </div>
            <div>
              <Label>Monthly Rent (₹)</Label>
              <Input type="number" value={bedRent} onChange={(e) => setBedRent(e.target.value)} />
            </div>
          </div>
          <DialogFooter className="p-4 border-t border-[#E5EAF1]">
            <Button variant="ghost" onClick={() => setShowAddBed(false)}>Cancel</Button>
            <Button disabled={addBedMutation.isPending || !bedLabel} onClick={() => addBedMutation.mutate({ label: bedLabel, monthlyRent: Number(bedRent) })} className="btn-primary font-bold">
              Save Bed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
