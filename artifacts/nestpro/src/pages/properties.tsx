import React from "react";
import { Layout } from "@/components/layout";
import { useListProperties } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Plus, MapPin, Bed, ExternalLink } from "lucide-react";
import { Link } from "wouter";

export default function Properties() {
  const { data: properties, isLoading } = useListProperties();

  if (isLoading) return <Layout><div className="flex h-full items-center justify-center">Loading properties...</div></Layout>;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Properties</h1>
            <p className="text-muted-foreground mt-1">Manage your PG and hostel locations.</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Property
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {properties?.map((property) => (
            <Card key={property.id} className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{property.name}</CardTitle>
                      <p className="text-sm text-muted-foreground capitalize">{property.type.replace('_', ' ')}</p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{property.address}, {property.city}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 py-4 border-y">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Total Beds</div>
                      <div className="text-2xl font-bold">{property.totalBeds || 0}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Occupied</div>
                      <div className="text-2xl font-bold text-primary">{property.occupiedBeds || 0}</div>
                    </div>
                  </div>
                  
                  <div className="pt-2 flex justify-between">
                    <Button variant="outline" size="sm">Edit Details</Button>
                    <Link href={`/properties/${property.id}/explorer`}>
                      <Button variant="secondary" size="sm">
                        <Bed className="mr-2 h-4 w-4" />
                        Explorer
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {(!properties || properties.length === 0) && (
            <div className="col-span-full py-12 text-center border-2 border-dashed rounded-lg bg-muted/10">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-foreground">No properties yet</h3>
              <p className="text-muted-foreground mt-1 mb-4">Get started by creating your first property.</p>
              <Button>Add Property</Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
