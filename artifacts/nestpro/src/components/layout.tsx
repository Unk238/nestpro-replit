import React from "react";
import { Link, useLocation } from "wouter";
import { 
  Building2, Users, CreditCard, LayoutDashboard, AlertCircle, 
  UserCircle, Activity, ChevronDown 
} from "lucide-react";
import { usePropertyContext } from "./property-provider";
import { useListProperties } from "@workspace/api-client-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toaster } from "@/components/ui/toaster";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Properties", href: "/properties", icon: Building2 },
  { name: "Guests", href: "/guests", icon: Users },
  { name: "Payments", href: "/payments", icon: CreditCard },
  { name: "Complaints", href: "/complaints", icon: AlertCircle },
  { name: "Staff", href: "/staff", icon: UserCircle },
  { name: "Activity", href: "/activity", icon: Activity },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { activePropertyId, setActivePropertyId } = usePropertyContext();
  const { data: properties = [] } = useListProperties();

  // If no property is active and we have properties, set the first one
  React.useEffect(() => {
    if (!activePropertyId && properties.length > 0) {
      setActivePropertyId(properties[0].id);
    }
  }, [activePropertyId, properties, setActivePropertyId]);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
          <h1 className="text-xl font-bold text-sidebar-foreground">NestPro</h1>
        </div>
        
        <div className="p-4 border-b border-sidebar-border">
          <Select 
            value={activePropertyId ? String(activePropertyId) : ""} 
            onValueChange={(val) => setActivePropertyId(Number(val))}
          >
            <SelectTrigger className="w-full bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-border">
              <SelectValue placeholder="Select Property" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Properties</SelectItem>
              {properties.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location === item.href || 
              (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.name} href={item.href} className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                isActive 
                  ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              }`}>
                <item.icon className="mr-3 flex-shrink-0 h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white dark:bg-gray-900 border-b flex items-center justify-between px-8">
          <h2 className="text-lg font-semibold capitalize text-gray-900 dark:text-white">
            {location === "/" ? "Dashboard" : location.split("/")[1].replace("-", " ")}
          </h2>
          <div className="flex items-center space-x-4">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
              AD
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
      <Toaster />
    </div>
  );
}
