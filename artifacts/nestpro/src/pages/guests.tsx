import React from "react";
import { Layout } from "@/components/layout";
import { useListGuests } from "@workspace/api-client-react";
import { usePropertyContext } from "@/components/property-provider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Link } from "wouter";

export default function Guests() {
  const { activePropertyId } = usePropertyContext();
  const { data: guests, isLoading } = useListGuests({
    query: { queryKey: ["listGuests", activePropertyId] },
    request: { query: { propertyId: activePropertyId || undefined } } as any
  });

  if (isLoading) return <Layout><div className="flex h-full items-center justify-center">Loading guests...</div></Layout>;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Guests</h1>
            <p className="text-muted-foreground mt-1">Manage guest check-ins, profiles, and status.</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Check-In Guest
          </Button>
        </div>

        <div className="border rounded-md bg-white dark:bg-gray-950">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Check In</TableHead>
                <TableHead className="text-right">Rent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {guests?.map((guest) => (
                <TableRow key={guest.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-medium">
                    <Link href={`/guests/${guest.id}`}>
                      {guest.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{guest.phone}</div>
                    <div className="text-xs text-muted-foreground">{guest.email}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={guest.status === 'active' ? 'default' : 'secondary'}>
                      {guest.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(guest.checkInDate).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right font-medium">₹{guest.monthlyRent}</TableCell>
                </TableRow>
              ))}
              {(!guests || guests.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No guests found.
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
