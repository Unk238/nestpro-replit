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
  <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.15 }}>
    <Card className="overflow-hidden border-slate-800 bg-slate-900/90 shadow-md">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${color} shadow-lg shadow-indigo-500/20`}>
            <Icon className="h-5.5 w-5.5 text-white" />
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-3xl font-extrabold text-slate-100 tracking-tight">{value}</p>
          <p className="text-sm font-semibold text-slate-200">{label}</p>
          <p className="text-xs text-slate-400 font-medium">{sub}</p>
        </div>
        {progress !== undefined && <Progress value={progress} className="mt-3.5 h-2" />}
      </CardContent>
    </Card>
  </motion.div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900 p-3.5 shadow-2xl text-xs space-y-1">
      <p className="font-bold text-slate-100 border-b border-slate-800 pb-1 mb-1">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <span className="font-semibold" style={{ color: p.color }}>{p.name}:</span>
          <span className="font-mono text-slate-100 font-bold">{formatCurrency(p.value)}</span>
        </div>
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
      {/* 32px major section spacing system */}
      <div className="space-y-8">
        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {sumLoading ? (
            Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)
          ) : (
            <>
              <KPICard icon={BedDouble} label="Total Beds" value={summary?.totalBeds ?? 0} sub="Across all properties" color="bg-indigo-600" />
              <KPICard icon={Users} label="Active Guests" value={summary?.activeGuests ?? 0} sub="Currently checked in" color="bg-purple-600" />
              <KPICard icon={TrendingUp} label="Occupancy Rate" value={`${summary?.occupancyRate ?? 0}%`} sub="Beds occupied" color="bg-emerald-600" progress={summary?.occupancyRate} />
              <KPICard icon={IndianRupee} label="Monthly Revenue" value={formatCurrency(summary?.monthlyRevenue ?? 0)} sub="Collected this month" color="bg-amber-600" />
            </>
          )}
        </div>

        {/* Charts and Feeds */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Revenue Chart */}
          <Card className="xl:col-span-2 border-slate-800 bg-slate-900/90">
            <CardHeader className="border-b border-slate-800/80 pb-4">
              <CardTitle className="text-base font-bold text-slate-100">Revenue Breakdown — Last 6 Months</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {revLoading ? (
                <Skeleton className="h-64" />
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={revenue} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gCollected" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gPending" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="monthName" tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }} />
                    <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="collected" name="Collected" stroke="#818cf8" fill="url(#gCollected)" strokeWidth={2.5} />
                    <Area type="monotone" dataKey="pending" name="Pending" stroke="#f59e0b" fill="url(#gPending)" strokeWidth={2.5} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Right Column Feed */}
          <div className="flex flex-col gap-6">
            {/* Overdue Alerts */}
            {overdue.length > 0 && (
              <Card className="border-red-500/30 bg-red-950/20">
                <CardHeader className="pb-3 border-b border-red-500/20">
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-red-300">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                    {overdue.length} Overdue Payment{overdue.length > 1 ? 's' : ''}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-3 space-y-2.5 max-h-40 overflow-y-auto">
                  {overdue.slice(0, 5).map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-red-950/40 border border-red-500/20">
                      <span className="text-slate-100 font-semibold truncate mr-2">{p.guestName}</span>
                      <span className="text-red-300 font-bold font-mono flex-shrink-0">{formatCurrency(p.amount)}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Recent Activity */}
            <Card className="flex-1 border-slate-800 bg-slate-900/90">
              <CardHeader className="border-b border-slate-800/80 pb-3">
                <CardTitle className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-indigo-400" />
                  Recent Activity Audit
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3.5 max-h-80 overflow-y-auto">
                {activity.length === 0 && <p className="text-xs text-slate-400 font-medium">No recent activity logged</p>}
                {activity.map((a: any) => (
                  <div key={a.id} className="flex items-start gap-2.5 text-xs">
                    <div className="mt-1 h-2 w-2 rounded-full bg-indigo-400 shadow-sm shadow-indigo-400/50 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-slate-200 font-medium leading-tight">{a.description}</p>
                      <p className="text-slate-400 text-[10px] font-semibold mt-0.5">{formatRelativeTime(a.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
