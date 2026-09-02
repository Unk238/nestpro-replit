import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import {
  Users, BedDouble, AlertCircle, IndianRupee, TrendingUp,
  UserPlus, CreditCard, AlertTriangle, QrCode, ArrowUpRight,
  Clock, CheckCircle2, ChevronRight, Sparkles
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Layout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { usePropertyContext } from '@/components/property-provider';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  const [, navigate] = useLocation();
  const { activeProperty } = usePropertyContext();
  const pid = activeProperty?.id;

  const { data: summary, isLoading: sumLoading } = useQuery({
    queryKey: ['dashboard-summary', pid],
    queryFn: () => api.getDashboardSummary(pid),
  });

  const { data: revenueData = [], isLoading: revLoading } = useQuery({
    queryKey: ['dashboard-revenue', pid],
    queryFn: () => api.getRevenue(pid),
  });

  const { data: recentActivity = [], isLoading: actLoading } = useQuery({
    queryKey: ['dashboard-activity', pid],
    queryFn: () => api.getRecentActivity(pid),
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ['checkin-submissions'],
    queryFn: api.getCheckinSubmissions,
  });

  const kpis = [
    {
      title: 'Occupancy Rate',
      value: sumLoading ? '—' : `${summary?.occupancyRate ?? 0}%`,
      subtitle: `${summary?.activeGuests ?? 0} active / ${summary?.totalBeds ?? 0} total beds`,
      icon: BedDouble,
      highlight: true,
    },
    {
      title: 'Active Residents',
      value: sumLoading ? '—' : String(summary?.activeGuests ?? 0),
      subtitle: 'Currently checked-in tenants',
      icon: Users,
    },
    {
      title: 'Revenue Collected',
      value: sumLoading ? '—' : formatCurrency(summary?.monthlyRevenue ?? 0),
      subtitle: 'This calendar month',
      icon: IndianRupee,
    },
    {
      title: 'Overdue Payments',
      value: sumLoading ? '—' : String(summary?.overdueCount ?? 0),
      subtitle: 'Require immediate collection',
      icon: AlertCircle,
      alert: (summary?.overdueCount ?? 0) > 0,
    },
  ];

  return (
    <Layout title="Operations Center">
      {/* Alert Banner if Pending Self Check-In Submissions exist */}
      {submissions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between p-4 rounded-xl bg-[#FFF8E1] border border-[#FFE082] text-xs text-[#D98A00]"
        >
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-4 w-4 text-[#D98A00] flex-shrink-0" />
            <span>
              <strong>{submissions.length} self check-in submission(s)</strong> awaiting review & room allotment.
            </span>
          </div>
          <Button
            size="sm"
            onClick={() => navigate('/guests')}
            className="bg-[#D98A00] hover:bg-[#B87500] text-white text-xs font-bold h-8 px-3"
          >
            Review Submissions <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </motion.div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.title}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="hover:border-[#CBD5E1] transition-all">
                <CardContent className="p-5 flex flex-col justify-between h-32">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#667085] uppercase tracking-wider">{kpi.title}</span>
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                      kpi.alert
                        ? 'bg-[#FFEBEE] text-[#D64545]'
                        : kpi.highlight
                        ? 'bg-[#EFF5FF] text-[#2F6FED]'
                        : 'bg-[#F0F4FA] text-[#667085]'
                    }`}>
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>
                  <div>
                    <p className={`text-2xl font-black tracking-tight ${
                      kpi.alert ? 'text-[#D64545]' : 'text-[#172033]'
                    }`}>
                      {kpi.value}
                    </p>
                    <p className="text-[11px] text-[#667085] truncate mt-0.5">{kpi.subtitle}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Operations Bar */}
      <Card>
        <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-bold text-[#173B6C] uppercase tracking-wider">Quick Actions:</span>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={() => navigate('/guests')} className="btn-primary text-xs font-semibold">
              <UserPlus className="h-3.5 w-3.5 mr-1" /> New Resident
            </Button>
            <Button size="sm" variant="outline" onClick={() => navigate('/payments')} className="text-xs font-semibold">
              <CreditCard className="h-3.5 w-3.5 mr-1 text-[#2F6FED]" /> Record Payment
            </Button>
            <Button size="sm" variant="outline" onClick={() => navigate('/complaints')} className="text-xs font-semibold">
              <AlertTriangle className="h-3.5 w-3.5 mr-1 text-[#D98A00]" /> Log Complaint
            </Button>
            <Button size="sm" variant="outline" onClick={() => navigate('/qr-tools')} className="text-xs font-semibold">
              <QrCode className="h-3.5 w-3.5 mr-1 text-[#173B6C]" /> Instant QR Codes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Analytics & Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Revenue Collection Trend Chart */}
        <Card className="lg:col-span-8">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-sm font-bold text-[#172033]">Revenue Collection (Last 6 Months)</CardTitle>
              <CardDescription className="text-xs text-[#667085]">Collected vs. pending monthly payments</CardDescription>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-[#172033]">
                <div className="h-2.5 w-2.5 rounded-xs bg-[#2F6FED]" /> Collected
              </span>
              <span className="flex items-center gap-1.5 text-[#667085]">
                <div className="h-2.5 w-2.5 rounded-xs bg-[#E5EAF1]" /> Pending
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            {revLoading ? (
              <Skeleton className="h-64 w-full rounded-lg" />
            ) : revenueData.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-xs text-[#667085]">
                <TrendingUp className="h-8 w-8 text-[#CBD5E1] mb-2" />
                No payment history recorded yet
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData} barGap={4}>
                    <XAxis dataKey="monthName" stroke="#98A2B3" fontSize={11} tickLine={false} axisLine={{ stroke: '#E5EAF1' }} />
                    <YAxis stroke="#98A2B3" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5EAF1', borderRadius: '8px', color: '#172033', fontSize: '12px', boxShadow: '0 4px 12px rgba(23,32,51,0.08)' }}
                      formatter={(val: any) => [formatCurrency(Number(val)), '']}
                    />
                    <Bar dataKey="collected" fill="#2F6FED" radius={[4, 4, 0, 0]} name="Collected" />
                    <Bar dataKey="pending" fill="#E5EAF1" radius={[4, 4, 0, 0]} name="Pending" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Live Operations & Activity Feed */}
        <Card className="lg:col-span-4 flex flex-col justify-between">
          <CardHeader className="pb-3 border-b border-[#E5EAF1]">
            <CardTitle className="text-sm font-bold text-[#172033] flex items-center justify-between">
              <span>Recent Activity Feed</span>
              <Button variant="ghost" size="sm" onClick={() => navigate('/activity')} className="text-xs text-[#2F6FED] p-0 h-auto font-semibold">
                View all
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-y-auto max-h-[290px]">
            {actLoading ? (
              <div className="p-4 space-y-3">
                {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : recentActivity.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#667085]">
                <Clock className="h-6 w-6 text-[#CBD5E1] mx-auto mb-1.5" />
                No activity logs recorded yet
              </div>
            ) : (
              <div className="divide-y divide-[#E5EAF1]">
                {recentActivity.slice(0, 5).map((log: any) => (
                  <div key={log.id} className="p-3.5 flex items-start gap-3 hover:bg-[#F9FBFE] transition-colors">
                    <div className="h-7 w-7 rounded-full bg-[#EFF5FF] text-[#2F6FED] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-[#172033] leading-snug">{log.description}</p>
                      <p className="text-[10px] text-[#98A2B3] mt-0.5">{formatDate(log.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
