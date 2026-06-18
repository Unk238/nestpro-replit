import React from "react";
import { Layout } from "@/components/layout";
import { useListComplaints } from "@workspace/api-client-react";
import { usePropertyContext } from "@/components/property-provider";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function Complaints() {
  const { activePropertyId } = usePropertyContext();
  const { data: complaints, isLoading } = useListComplaints({
    query: { queryKey: ["listComplaints", activePropertyId] },
    request: { query: { propertyId: activePropertyId || undefined } } as any
  });

  if (isLoading) return <Layout><div className="flex h-full items-center justify-center">Loading complaints...</div></Layout>;

  const columns = ['pending', 'assigned', 'in_progress', 'resolved', 'closed'];

  return (
    <Layout>
      <div className="space-y-6 h-full flex flex-col">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Complaints</h1>
            <p className="text-muted-foreground mt-1">Manage and track guest issues.</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Complaint
          </Button>
        </div>

        <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
          {columns.map(status => (
            <div key={status} className="flex-1 min-w-[300px] bg-muted/40 rounded-lg p-4 flex flex-col">
              <h3 className="font-semibold mb-4 capitalize text-sm">{status.replace('_', ' ')}</h3>
              <div className="space-y-3 flex-1 overflow-y-auto">
                {complaints?.filter(c => c.status === status).map(complaint => (
                  <div key={complaint.id} className="bg-card border shadow-sm rounded-md p-3 cursor-pointer hover:border-primary/50 transition-colors">
                    <div className="font-medium text-sm mb-1">{complaint.title}</div>
                    <div className="text-xs text-muted-foreground mb-2 line-clamp-2">{complaint.description}</div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-[10px] uppercase tracking-wider bg-secondary px-2 py-0.5 rounded text-secondary-foreground font-semibold">
                        {complaint.category}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        complaint.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                        complaint.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {complaint.priority}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
