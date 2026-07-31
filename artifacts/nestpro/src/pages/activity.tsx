import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity } from 'lucide-react';
import { Layout } from '@/components/layout';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { usePropertyContext } from '@/components/property-provider';
import { api } from '@/lib/api';
import { formatRelativeTime } from '@/lib/utils';

const ACTION_COLORS: Record<string, string> = {
  checkin: 'bg-emerald-500',
  checkout: 'bg-amber-500',
  payment_recorded: 'bg-indigo-500',
  complaint_created: 'bg-red-500',
  complaint_updated: 'bg-blue-500',
  created: 'bg-violet-500',
  deleted: 'bg-slate-500',
};

export default function ActivityPage() {
  const { activeProperty } = usePropertyContext();
  const pid = activeProperty?.id;

  const { data: activity = [], isLoading } = useQuery({
    queryKey: ['activity', pid],
    queryFn: () => api.getActivity({ propertyId: pid, limit: 100 }),
    refetchInterval: 30_000,
  });

  return (
    <Layout title="Activity Log">
      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="space-y-4">{Array(8).fill(0).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
          ) : (activity as any[]).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Activity className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <p className="text-foreground font-medium">No activity yet</p>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-[19px] top-0 h-full w-px bg-border" />
              <div className="space-y-6">
                {(activity as any[]).map((a: any) => (
                  <div key={a.id} className="flex items-start gap-4 relative">
                    <div className={`flex-shrink-0 h-[10px] w-[10px] rounded-full mt-1.5 ring-2 ring-background ${ACTION_COLORS[a.action] ?? 'bg-indigo-500'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">{a.description}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                        <span>{formatRelativeTime(a.createdAt)}</span>
                        {a.propertyName && <><span>·</span><span>{a.propertyName}</span></>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Layout>
  );
}
