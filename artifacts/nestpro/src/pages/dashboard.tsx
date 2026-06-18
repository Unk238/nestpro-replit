import React from "react";
import { Layout } from "@/components/layout";
import { useGetDashboardSummary, useGetRevenueStats, useGetRecentActivity, useListOverduePayments } from "@workspace/api-client-react";
import { usePropertyContext } from "@/components/property-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, BedDouble, CheckCircle2, AlertCircle, CreditCard, Activity } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from "recharts";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { activePropertyId } = usePropertyContext();
  
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary({
    query: {
      queryKey: ["dashboardSummary", activePropertyId],
    },
    request: { query: { propertyId: activePropertyId || undefined } } as any
  });

  const { data: revenueData } = useGetRevenueStats({
    query: {
      queryKey: ["revenueStats", activePropertyId],
    },
    request: { query: { propertyId: activePropertyId || undefined } } as any
  });

  const { data: activity } = useGetRecentActivity({
    query: {
      queryKey: ["recentActivity"],
    }
  });

  const { data: overdue } = useListOverduePayments();

  if (loadingSummary) return <Layout><div className="flex h-full items-center justify-center text-muted-foreground">Loading dashboard...</div></Layout>;

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in zoom-in duration-500">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <BedDouble className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium text-muted-foreground">Total Beds</h3>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-bold">{summary?.totalBeds || 0}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium text-muted-foreground">Active Guests</h3>
              </div>
              <div className="mt-4 flex items-baseline">
                <span className="text-3xl font-bold">{summary?.activeGuests || 0}</span>
                <span className="ml-2 text-sm text-muted-foreground">
                  {summary?.occupancyRate ? Math.round(summary.occupancyRate) : 0}% Occupancy
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium text-muted-foreground">Revenue Collected</h3>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-bold">₹{summary?.collectedRevenue?.toLocaleString() || 0}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium text-muted-foreground">Open Complaints</h3>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-bold">{summary?.openComplaints || 0}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium text-muted-foreground">Overdue Payments</h3>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-bold">{summary?.overduePayments || 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="col-span-2 shadow-sm">
            <CardHeader>
              <CardTitle>Revenue (Last 6 Months)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                {revenueData && revenueData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                      <RechartsTooltip cursor={{fill: 'hsl(var(--muted))'}} contentStyle={{borderRadius: '8px', border: '1px solid hsl(var(--border))'}} />
                      <Legend iconType="circle" wrapperStyle={{fontSize: '12px'}} />
                      <Bar dataKey="collected" name="Collected" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={32} />
                      <Bar dataKey="pending" name="Pending" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} barSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground bg-muted/20 rounded-md border border-dashed">No data available</div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {activity && activity.length > 0 ? (
                  activity.slice(0, 5).map((log) => (
                    <div key={log.id} className="flex items-start space-x-4">
                      <div className="mt-1 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-primary/10 flex-shrink-0" />
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">{log.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(log.createdAt).toLocaleString(undefined, {
                            month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No recent activity.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Overdue Payments</CardTitle>
          </CardHeader>
          <CardContent>
            {overdue && overdue.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Guest</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead className="text-right">Days Overdue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overdue.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">
                        <div>{payment.guestName}</div>
                        <div className="text-xs text-muted-foreground">{payment.guestPhone}</div>
                      </TableCell>
                      <TableCell>{payment.propertyName}</TableCell>
                      <TableCell>₹{payment.amount}</TableCell>
                      <TableCell>{payment.month}/{payment.year}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="destructive" className="ml-auto">{payment.daysOverdue} days</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-md border border-dashed">
                No overdue payments found.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
