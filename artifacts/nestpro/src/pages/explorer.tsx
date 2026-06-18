import React from "react";
import { Layout } from "@/components/layout";
import { useGetOccupancyBreakdown, useGetProperty } from "@workspace/api-client-react";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BedDouble, CheckCircle, Clock, AlertCircle } from "lucide-react";

export default function Explorer() {
  const [, params] = useRoute("/properties/:id/explorer");
  const propertyId = params?.id ? Number(params.id) : 0;

  const { data: property, isLoading: loadingProperty } = useGetProperty(propertyId, {
    query: { enabled: !!propertyId }
  });

  const { data: breakdown, isLoading } = useGetOccupancyBreakdown({
    query: { enabled: !!propertyId, queryKey: ["occupancyBreakdown", propertyId] },
    request: { query: { propertyId } } as any
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available": return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/50";
      case "occupied": return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50";
      case "maintenance": return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50";
      case "reserved": return "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800/50";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (isLoading || loadingProperty) return <Layout><div className="flex h-full items-center justify-center">Loading explorer...</div></Layout>;

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{property?.name} - Explorer</h1>
          <p className="text-muted-foreground mt-1">Manage buildings, floors, rooms, and beds.</p>
        </div>

        <div className="flex gap-4 mb-6">
          <div className="flex items-center text-sm"><div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div> Available</div>
          <div className="flex items-center text-sm"><div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div> Occupied</div>
          <div className="flex items-center text-sm"><div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div> Maintenance</div>
          <div className="flex items-center text-sm"><div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div> Reserved</div>
        </div>

        {breakdown?.buildings.map(building => (
          <div key={building.buildingId} className="space-y-6 mb-8">
            <h2 className="text-2xl font-semibold border-b pb-2">{building.buildingName}</h2>
            {building.floors.map(floor => (
              <Card key={floor.floorId} className="shadow-sm">
                <CardHeader className="py-4 bg-muted/30 border-b">
                  <CardTitle className="text-lg">{floor.floorName}</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {floor.rooms.map(room => (
                      <div key={room.roomId} className="border rounded-md p-3 bg-card">
                        <div className="flex justify-between items-center mb-3">
                          <span className="font-semibold text-base">Room {room.roomNumber}</span>
                          <span className="text-xs text-muted-foreground capitalize">{room.roomType.replace('_', ' ')}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {room.beds.map(bed => (
                            <div 
                              key={bed.id} 
                              className={`p-2 rounded border text-xs text-center cursor-pointer transition-colors hover:brightness-95 ${getStatusColor(bed.status)}`}
                            >
                              <div className="font-medium mb-1">{bed.label}</div>
                              {bed.guestName && <div className="truncate max-w-full text-[10px] opacity-80">{bed.guestName}</div>}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ))}
      </div>
    </Layout>
  );
}
