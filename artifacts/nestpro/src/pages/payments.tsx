import React from "react";
import { Layout } from "@/components/layout";
import { useListPayments } from "@workspace/api-client-react";
import { usePropertyContext } from "@/components/property-provider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, IndianRupee } from "lucide-react";

export default function Payments() {
  const { activePropertyId } = usePropertyContext();
  const { data: payments, isLoading } = useListPayments({
    query: { queryKey: ["listPayments", activePropertyId] },
    request: { query: { propertyId: activePropertyId || undefined } } as any
  });

  if (isLoading) return <Layout><div className="flex h-full items-center justify-center">Loading payments...</div></Layout>;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Payments Ledger</h1>
            <p className="text-muted-foreground mt-1">Track rent collections, dues, and payment history.</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Record Payment
          </Button>
        </div>

        <div className="border rounded-md bg-white dark:bg-gray-950">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments?.map((payment) => (
                <TableRow key={payment.id} className="hover:bg-muted/50">
                  <TableCell>
                    {payment.paidAt ? new Date(payment.paidAt).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {new Date(payment.year, payment.month - 1).toLocaleString('default', { month: 'short', year: 'numeric' })}
                  </TableCell>
                  <TableCell className="font-medium">
                    ₹{payment.amount}
                  </TableCell>
                  <TableCell className="capitalize">
                    {payment.method?.replace('_', ' ') || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      payment.status === 'paid' ? 'default' : 
                      payment.status === 'overdue' ? 'destructive' : 
                      payment.status === 'partial' ? 'secondary' : 'outline'
                    }>
                      {payment.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {payment.status !== 'paid' && (
                      <Button variant="ghost" size="sm">
                        <IndianRupee className="h-3 w-3 mr-1" />
                        Collect
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {(!payments || payments.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No payments found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </Layout>
  );
}
