import React from "react";
import { Layout } from "@/components/layout";
import { useListStaff } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, UserCog, Mail, Phone } from "lucide-react";

export default function Staff() {
  const { data: staff, isLoading } = useListStaff();

  if (isLoading) return <Layout><div className="flex h-full items-center justify-center">Loading staff...</div></Layout>;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Staff Management</h1>
            <p className="text-muted-foreground mt-1">Manage managers and operators across properties.</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Staff
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {staff?.map((member) => (
            <Card key={member.id} className={`${!member.isActive ? 'opacity-60' : ''}`}>
              <CardHeader className="pb-4 flex flex-row items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                    <UserCog className="h-5 w-5 text-secondary-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{member.name}</CardTitle>
                    <Badge variant="outline" className="mt-1 capitalize">
                      {member.role}
                    </Badge>
                  </div>
                </div>
                {!member.isActive && <Badge variant="secondary">Inactive</Badge>}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Phone className="mr-2 h-4 w-4" />
                  {member.phone}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Mail className="mr-2 h-4 w-4" />
                  {member.email || 'No email provided'}
                </div>
                <div className="pt-4 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">Edit</Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {(!staff || staff.length === 0) && (
            <div className="col-span-full py-12 text-center border-2 border-dashed rounded-lg bg-muted/10">
              <UserCog className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-foreground">No staff members</h3>
              <p className="text-muted-foreground mt-1 mb-4">Add your team members to manage properties.</p>
              <Button>Add Staff</Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
