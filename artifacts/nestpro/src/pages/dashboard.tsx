import React from "react";
import { Layout } from "@/components/layout";
import {
  useGetDashboardSummary, useGetRevenueStats,
  useGetRecentActivity, useListOverduePayments
} from "@workspace/api-client-react";
import { usePropertyContext } from "@/components/property-provider";
import { useListProperties } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  Users, BedDouble, TrendingUp, AlertCircle, CreditCard,
  Plus, UserPlus, ArrowRight, Building2, Sparkles, Activity,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { motion } from "framer-motion";

function EmptyStateCard({
  icon: Icon, color, title, desc, action, href,
}: {
  icon: React.ElementType; color: string; title: string; desc: string; action: string; href: string;
}) {
  return (
    <Link href={href}>
      <motion.div
        whileHover={{ y: -2, boxShadow: "0 8px 30px rgba(0,0,0,0.08)" }}
        className="bg-white border border-gray-100 rounded-2xl p-6 cursor-pointer transition-all"
      >
        <div className={`h-11 w-11 rounded-xl flex items-center justify-center mb-4 ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-400 mb-4">{desc}</p>
        <div className="flex items-center gap-1 text-blue-600 text-sm font-medium">
          {action} <ArrowRight className="h-3.5 w-3.5" />
        </div>
      </motion.div>
    </Link>
  );
}

function KPICard({
  title, value, sub, icon: Icon, color, index,
}: {
  title: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string; index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
    >
      <Card className="border-gray-100 shadow-none hover:shadow-sm transition-shadow">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-500">{title}</p>
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${color}`}>
              <Icon className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function Dashboard() {
  const { activePropertyId } = usePropertyContext();
  const { data: properties = [] } = useListProperties();

  const { data: summary, isLoading } = useGetDashboardSummary({
    query: { queryKey: ["dashboardSummary", activePropertyId] },
    request: { query: { propertyId: activePropertyId || undefined } } as any,
  });
  const { data: revenueData } = useGetRevenueStats({
    query: { queryKey: ["revenueStats", activePropertyId] },
    request: { query: { propertyId: activePropertyId || undefined } } as any,
  });
  const { data: activity } = useGetRecentActivity({ query: { queryKey: ["recentActivity"] } });
  const { data: overdue } = useListOverduePayments();

  const biz = (() => { try { return JSON.parse(localStorage.getItem("nestpro_business") ?? "null"); } catch { return null; } })();
  const userName = (() => { try { return JSON.parse(localStorage.getItem("nestpro_user") ?? "null")?.name; } catch { return null; } })();

  const hasGuests = (summary?.activeGuests ?? 0) > 0;
  const hasRevenue = (summary?.collectedRevenue ?? 0) > 0;
  const hasComplaints = (summary?.openComplaints ?? 0) > 0;
  const hasProperties = properties.length > 0;
  const hasOverdue = (overdue?.length ?? 0) > 0;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  if (isLoading) {
    return (
      <Layout>
        <div className="flex h-full items-center justify-center">
          <div className="space-y-3 text-center">
            <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-gray-400">Loading dashboard…</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8 max-w-7xl">
        {/* Welcome */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-gray-900">
            {greeting}{userName ? `, ${userName.split(" ")[0]}` : ""} 👋
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {biz?.name ? `${biz.name} · ` : ""}
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </motion.div>

        {/* No properties yet — guide setup */}
        {!hasProperties && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-8 text-white"
          >
            <div className="flex items-start gap-6">
              <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                <Building2 className="h-7 w-7 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold mb-1">Your workspace is ready</h2>
                <p className="text-blue-100 mb-5">Add your first property to start managing guests, payments, and rooms.</p>
                <Link href="/properties">
                  <button className="flex items-center gap-2 bg-white text-blue-700 font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-50 transition-colors">
                    <Plus className="h-4 w-4" /> Add First Property
                  </button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {/* KPIs (only if data exists) */}
        {hasProperties && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              index={0} title="Total Beds" icon={BedDouble} color="bg-blue-50 text-blue-600"
              value={summary?.totalBeds ?? 0}
              sub={`${summary?.activeGuests ?? 0} occupied`}
            />
            <KPICard
              index={1} title="Occupancy" icon={Users} color="bg-green-50 text-green-600"
              value={`${Math.round(summary?.occupancyRate ?? 0)}%`}
              sub={`${summary?.activeGuests ?? 0} active guests`}
            />
            <KPICard
              index={2} title="Revenue Collected" icon={TrendingUp} color="bg-purple-50 text-purple-600"
              value={`₹${(summary?.collectedRevenue ?? 0).toLocaleString("en-IN")}`}
              sub="this month"
            />
            <KPICard
              index={3} title="Open Complaints" icon={AlertCircle} color="bg-orange-50 text-orange-600"
              value={summary?.openComplaints ?? 0}
              sub={hasOverdue ? `${overdue?.length} overdue payments` : "all payments current"}
            />
          </div>
        )}

        {/* Action prompts — shown when sections are empty */}
        {hasProperties && !hasGuests && (
          <div>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Get started</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <EmptyStateCard
                icon={UserPlus} color="bg-blue-50 text-blue-600"
                title="Check In First Guest"
                desc="Record your first guest check-in and assign them a bed."
                action="Go to Guests" href="/guests"
              />
              <EmptyStateCard
                icon={CreditCard} color="bg-green-50 text-green-600"
                title="Record First Payment"
                desc="Log a rent payment and start tracking your revenue."
                action="Go to Payments" href="/payments"
              />
              <EmptyStateCard
                icon={AlertCircle} color="bg-orange-50 text-orange-600"
                title="Manage Complaints"
                desc="Track and resolve maintenance and guest complaints."
                action="Go to Complaints" href="/complaints"
              />
              <EmptyStateCard
                icon={Sparkles} color="bg-purple-50 text-purple-600"
                title="Try AI Receptionist"
                desc="Ask questions about your property in plain language."
                action="Open AI Chat" href="/ai"
              />
            </div>
          </div>
        )}

        {/* Revenue chart — only when there's data */}
        {hasProperties && hasRevenue && revenueData && revenueData.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="col-span-2"
            >
              <Card className="border-gray-100 shadow-none">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Revenue — Last 6 Months</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[260px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={revenueData} barGap={4}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="label" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: "#9ca3af" }} />
                        <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} tick={{ fill: "#9ca3af" }} />
                        <RechartsTooltip
                          cursor={{ fill: "#f9fafb" }}
                          contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb", fontSize: 12 }}
                          formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, undefined]}
                        />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                        <Bar dataKey="collected" name="Collected" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={24} />
                        <Bar dataKey="pending" name="Pending" fill="#f97316" radius={[4, 4, 0, 0]} barSize={24} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Card className="border-gray-100 shadow-none h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  {activity && activity.length > 0 ? (
                    <div className="space-y-4">
                      {activity.slice(0, 6).map((log) => (
                        <div key={log.id} className="flex items-start gap-3">
                          <div className="h-2 w-2 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                          <div>
                            <p className="text-sm text-gray-700 leading-snug">{log.description}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {new Date(log.createdAt).toLocaleString("en-IN", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-40 text-center">
                      <Activity className="h-8 w-8 text-gray-200 mb-2" />
                      <p className="text-sm text-gray-400">Activity will appear here as you use the app</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}

        {/* Activity feed when no revenue yet but have properties */}
        {hasProperties && !hasRevenue && activity && activity.length > 0 && (
          <Card className="border-gray-100 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activity.slice(0, 6).map((log) => (
                  <div key={log.id} className="flex items-start gap-3">
                    <div className="h-2 w-2 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                    <div>
                      <p className="text-sm text-gray-700">{log.description}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(log.createdAt).toLocaleString("en-IN", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Overdue payments alert */}
        {hasOverdue && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Card className="border-orange-100 shadow-none">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base text-orange-700">Overdue Payments</CardTitle>
                  <Badge variant="destructive">{overdue?.length} overdue</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Guest</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead className="text-right">Days Overdue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overdue?.slice(0, 5).map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <p className="font-medium text-sm">{p.guestName}</p>
                          <p className="text-xs text-gray-400">{p.guestPhone}</p>
                        </TableCell>
                        <TableCell className="font-semibold">₹{Number(p.amount).toLocaleString("en-IN")}</TableCell>
                        <TableCell className="text-sm text-gray-500">{p.month}/{p.year}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="destructive" className="ml-auto">{p.daysOverdue}d</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </Layout>
  );
}
