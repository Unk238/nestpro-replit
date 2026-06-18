import React from "react";
import { Layout } from "@/components/layout";
import { useGetGuest, useCheckoutGuest } from "@workspace/api-client-react";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserCircle, MapPin, Phone, Mail, FileText, CalendarDays, LogOut } from "lucide-react";

export default function GuestDetail() {
  const [, params] = useRoute("/guests/:id");
  const guestId = params?.id ? Number(params.id) : 0;

  const { data: guest, isLoading } = useGetGuest(guestId, {
    query: { enabled: !!guestId }
  });

  if (isLoading) return <Layout><div className="flex h-full items-center justify-center">Loading guest profile...</div></Layout>;
  if (!guest) return <Layout><div className="flex h-full items-center justify-center">Guest not found.</div></Layout>;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <UserCircle className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{guest.name}</h1>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant={guest.status === 'active' ? 'default' : 'secondary'}>
                  {guest.status.replace('_', ' ')}
                </Badge>
                <span className="text-sm text-muted-foreground">Guest ID: {guest.id}</span>
              </div>
            </div>
          </div>
          {guest.status === 'active' && (
            <Button variant="destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Check Out
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Profile Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground flex items-center"><Phone className="mr-2 h-4 w-4" /> Phone</div>
                  <div className="font-medium">{guest.phone}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground flex items-center"><Mail className="mr-2 h-4 w-4" /> Email</div>
                  <div className="font-medium">{guest.email || 'N/A'}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground flex items-center"><FileText className="mr-2 h-4 w-4" /> Aadhaar</div>
                  <div className="font-medium">{guest.aadhaar || 'N/A'}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground flex items-center"><MapPin className="mr-2 h-4 w-4" /> Hometown</div>
                  <div className="font-medium">{guest.hometown || 'N/A'}</div>
                </div>
              </div>

              <div className="border-t pt-4 grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Emergency Contact</div>
                  <div className="font-medium">{guest.emergencyContact || 'N/A'}</div>
                  <div className="text-sm">{guest.emergencyPhone || 'N/A'}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Occupation</div>
                  <div className="font-medium">{guest.occupation || 'N/A'}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Stay Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground flex items-center"><CalendarDays className="mr-2 h-4 w-4" /> Check In</div>
                <div className="font-medium">{new Date(guest.checkInDate).toLocaleDateString()}</div>
              </div>
              {guest.checkOutDate && (
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground flex items-center"><CalendarDays className="mr-2 h-4 w-4" /> Check Out</div>
                  <div className="font-medium">{new Date(guest.checkOutDate).toLocaleDateString()}</div>
                </div>
              )}
              <div className="space-y-1 pt-4 border-t">
                <div className="text-sm text-muted-foreground">Monthly Rent</div>
                <div className="font-bold text-xl">₹{guest.monthlyRent}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Deposit Amount</div>
                <div className="font-medium">₹{guest.depositAmount || 0}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
