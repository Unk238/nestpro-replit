import React from "react";
import { Layout } from "@/components/layout";
import { useListActivityLogs } from "@workspace/api-client-react";
import { usePropertyContext } from "@/components/property-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity as ActivityIcon } from "lucide-react";

export default function Activity() {
  const { activePropertyId } = usePropertyContext();
  const { data: logs, isLoading } = useListActivityLogs({
    query: { queryKey: ["listActivityLogs", activePropertyId] },
    request: { query: { propertyId: activePropertyId || undefined, limit: 100 } } as any
  });

  if (isLoading) return <Layout><div className="flex h-full items-center justify-center">Loading activity log...</div></Layout>;

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Log</h1>
          <p className="text-muted-foreground mt-1">Timeline of all actions across your properties.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <ActivityIcon className="mr-2 h-5 w-5 text-primary" />
              System Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative border-l border-muted ml-4 space-y-8 pb-4">
              {logs?.map((log, index) => (
                <div key={log.id} className="relative pl-6">
                  <div className="absolute w-3 h-3 bg-primary rounded-full -left-[6.5px] top-1.5 ring-4 ring-background" />
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-1">
                    <h4 className="font-semibold text-sm">{log.description}</h4>
                    <span className="text-xs text-muted-foreground whitespace-nowrap sm:ml-4">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <span className="text-xs uppercase tracking-wider bg-muted px-2 py-1 rounded font-medium">
                      {log.action}
                    </span>
                    <span className="text-xs bg-secondary/50 text-secondary-foreground px-2 py-1 rounded">
                      {log.entity} #{log.entityId}
                    </span>
                    {log.propertyName && (
                      <span className="text-xs border px-2 py-1 rounded">
                        @ {log.propertyName}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {(!logs || logs.length === 0) && (
                <div className="pl-6 text-muted-foreground py-8">
                  No activity recorded yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
