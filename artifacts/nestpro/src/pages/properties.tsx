import React, { useState } from "react";
import { Layout } from "@/components/layout";
import { useListProperties } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Plus, MapPin, Bed } from "lucide-react";
import { Link } from "wouter";
import { OnboardingWizard } from "@/components/onboarding-wizard";
import { motion } from "framer-motion";

const TYPE_COLORS: Record<string, string> = {
  pg: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  hostel: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  co_living: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  dormitory: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  lodge: "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300",
};

export default function Properties() {
  const { data: properties, isLoading, refetch } = useListProperties();
  const [wizardOpen, setWizardOpen] = useState(false);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex h-full items-center justify-center text-muted-foreground">
          Loading properties…
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Properties</h1>
            <p className="text-muted-foreground mt-1">Manage your PG and hostel locations.</p>
          </div>
          <Button onClick={() => setWizardOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Property
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {properties?.map((property, i) => (
            <motion.div
              key={property.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.35 }}
            >
              <Card className="shadow-sm hover:shadow-md transition-shadow h-full">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{property.name}</CardTitle>
                        <span className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${
                          TYPE_COLORS[property.type] ?? "bg-gray-100 text-gray-700"
                        }`}>
                          {property.type.replace("_", " ")}
                        </span>
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
                        <div className="text-2xl font-bold">{property.totalBeds ?? 0}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Occupied</div>
                        <div className="text-2xl font-bold text-primary">{property.occupiedBeds ?? 0}</div>
                      </div>
                    </div>

                    {/* Occupancy bar */}
                    {(property.totalBeds ?? 0) > 0 && (
                      <div>
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Occupancy</span>
                          <span>{Math.round(((property.occupiedBeds ?? 0) / (property.totalBeds ?? 1)) * 100)}%</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-primary rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.round(((property.occupiedBeds ?? 0) / (property.totalBeds ?? 1)) * 100)}%` }}
                            transition={{ delay: i * 0.07 + 0.3, duration: 0.6 }}
                          />
                        </div>
                      </div>
                    )}

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
            </motion.div>
          ))}

          {(!properties || properties.length === 0) && (
            <div className="col-span-full py-16 text-center border-2 border-dashed rounded-2xl bg-muted/10">
              <Building2 className="mx-auto h-14 w-14 text-muted-foreground mb-4 opacity-40" />
              <h3 className="text-xl font-semibold text-foreground">No properties yet</h3>
              <p className="text-muted-foreground mt-2 mb-6 max-w-sm mx-auto">
                Get started by creating your first property. The wizard will set up your buildings, floors, rooms, and beds automatically.
              </p>
              <Button onClick={() => setWizardOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Property
              </Button>
            </div>
          )}
        </div>
      </div>

      <OnboardingWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onSuccess={() => refetch()}
      />
    </Layout>
  );
}
