import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, Clock, CheckCircle2, Building2 } from 'lucide-react';
import { Layout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { usePropertyContext } from '@/components/property-provider';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';

export default function ActivityPage() {
  const { activeProperty } = usePropertyContext();
  const pid = activeProperty?.id;

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['activity', pid],
    queryFn: () => api.getActivity({ propertyId: pid, limit: 50 }),
  });

  return (
    <Layout title="Activity Audit & Operational Logs">
      <Card>
        <CardHeader className="border-b border-[#E5EAF1] pb-4">
          <CardTitle className="text-sm text-[#172033] flex items-center gap-2">
            <Activity className="h-4 w-4 text-[#2F6FED]" /> System Activity Trail
          </CardTitle>
          <CardDescription className="text-xs text-[#667085]">
            Chronological audit of resident check-ins, payments recorded, and property updates.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">{Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : logs.length === 0 ? (
            <div className="p-16 text-center text-xs text-[#667085]">
              <Clock className="h-8 w-8 text-[#CBD5E1] mx-auto mb-2" />
              No activity recorded yet
            </div>
          ) : (
            <div className="divide-y divide-[#E5EAF1]">
              {logs.map((log: any) => (
                <div key={log.id} className="p-4 flex items-start gap-3.5 hover:bg-[#F9FBFE] transition-colors">
                  <div className="h-8 w-8 rounded-full bg-[#EFF5FF] text-[#2F6FED] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-[#172033]">{log.description}</p>
                    <div className="flex items-center gap-3 text-[11px] text-[#667085] mt-1">
                      <span className="capitalize font-medium text-[#2F6FED]">{log.action.replace('_', ' ')}</span>
                      <span>•</span>
                      <span>{formatDate(log.createdAt)}</span>
                      {log.propertyName && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 font-semibold text-[#172033]">
                            <Building2 className="h-3 w-3 text-[#98A2B3]" /> {log.propertyName}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Layout>
  );
}
