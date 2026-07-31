import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BedDouble, Users, TrendingUp, IndianRupee, AlertTriangle, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Layout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { usePropertyContext } from '@/components/property-provider';
import { api } from '@/lib/api';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';

const KPICard = ({ icon: Icon, label, value, sub, color, progress }: any) => (
  <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.15 }}>
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">{sub}</p>
        </div>
        {progress !== undefined && <Progress value={progress} className="mt-3 h-1.5" />}
      </CardContent>
    </Card>
  </motion.div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-[#1a2235] p-3 shadow-xl text-xs">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: {formatCurrency(p.value)}</p>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const { activeProperty } = usePropertyContext();
  const pid = activeProperty?.id;

  const { data: summary, isLoading: sumLoading } = useQuery({
    queryKey: ['dashboard-summary', pid],
    queryFn: () => api.getDashboardSummary(pid),
    enabled: true,
    refetchInterval: 60_000,
  });
  const { data: revenue = [], isLoading: revLoading } = useQuery({
    queryKey: ['dashboard-revenue', pid],
    queryFn: () => api.getRevenue(pid),
  });
  const { data: activity = [] } = useQuery({
    queryKey: ['recent-activity', pid],
    queryFn: () => api.getRecentActivity(pid),
    refetchInterval: 30_000,
  });
  const { data: overdue = [] } = useQuery({
    queryKey: ['overdue-payments'],
    queryFn: api.getOverduePayments,
    refetchInterval: 60_000,
  });

  return (
    <Layout title="Dashboard">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {sumLoading ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)
        ) : (
          <>
            <KPICard icon={BedDouble} label="Total Beds" value={summary?.totalBeds ?? 0} sub="Across all properties" color="bg-indigo-500" />
            <KPICard icon={Users} label="Active Guests" value={summary?.activeGuests ?? 0} sub="Currently checked in" color="bg-violet-500" />
            <KPICard icon={TrendingUp} label="Occupancy Rate" value={`${summary?.occupancyRate ?? 0}%`} sub="Beds occupied" color="bg-emerald-500" progress={summary?.occupancyRate} />
            <KPICard icon={IndianRupee} label="Monthly Revenue" value={formatCurrency(summary?.monthlyRevenue ?? 0)} sub="Collected this month" color="bg-amber-500" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <Card className="xl:col-span-2">
          <CardHeader><CardTitle className="text-base">Revenue — Last 6 Months</CardTitle></CardHeader>
          <CardContent>
            {revLoading ? <Skeleton className="h-48" /> : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={revenue} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gCollected" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gPending" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="monthName" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="collected" name="Collected" stroke="#6366f1" fill="url(#gCollected)" strokeWidth={2} />
                  <Area type="monotone" dataKey="pending" name="Pending" stroke="#f59e0b" fill="url(#gPending)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          {/* Overdue alerts */}
          {overdue.length > 0 && (
            <Card className="border-red-500/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2 text-red-400">
                  <AlertTriangle className="h-4 w-4" /> {overdue.length} Overdue Payment{overdue.length > 1 ? 's' : ''}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-36 overflow-y-auto">
                {overdue.slice(0, 5).map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between text-xs">
                    <span className="text-foreground font-medium truncate mr-2">{p.guestName}</span>
                    <span className="text-red-400 font-semibold flex-shrink-0">{formatCurrency(p.amount)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Recent activity */}
          <Card className="flex-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" /> Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-72 overflow-y-auto">
              {activity.length === 0 && <p className="text-xs text-muted-foreground">No recent activity</p>}
              {activity.map((a: any) => (
                <div key={a.id} className="flex items-start gap-2 text-xs">
                  <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-foreground truncate">{a.description}</p>
                    <p className="text-muted-foreground">{formatRelativeTime(a.createdAt)}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
