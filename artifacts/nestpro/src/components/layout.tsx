import React from "react";
import { Link, useLocation } from "wouter";
import {
  Building2, Users, CreditCard, LayoutDashboard, AlertCircle,
  UserCircle, Activity, Settings, Sparkles, LogOut, ChevronDown,
} from "lucide-react";
import { usePropertyContext } from "./property-provider";
import { useListProperties } from "@workspace/api-client-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Toaster } from "@/components/ui/toaster";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Properties", href: "/properties", icon: Building2 },
  { name: "Guests", href: "/guests", icon: Users },
  { name: "Payments", href: "/payments", icon: CreditCard },
  { name: "Complaints", href: "/complaints", icon: AlertCircle },
  { name: "Team", href: "/staff", icon: UserCircle },
  { name: "Activity", href: "/activity", icon: Activity },
];

const bottomNav = [
  { name: "AI Receptionist", href: "/ai", icon: Sparkles },
  { name: "Settings", href: "/settings", icon: Settings },
];

function getUserInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function getUser(): { name: string; email: string } | null {
  try { return JSON.parse(localStorage.getItem("nestpro_user") ?? "null"); } catch { return null; }
}

function getBusiness(): { name: string } | null {
  try { return JSON.parse(localStorage.getItem("nestpro_business") ?? "null"); } catch { return null; }
}

function handleLogout() {
  localStorage.removeItem("nestpro_user");
  localStorage.removeItem("nestpro_onboarded");
  localStorage.removeItem("nestpro_business");
  localStorage.removeItem("nestpro_active_property");
  window.location.reload();
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { activePropertyId, setActivePropertyId } = usePropertyContext();
  const { data: properties = [] } = useListProperties();
  const user = getUser();
  const biz = getBusiness();

  React.useEffect(() => {
    if (!activePropertyId && properties.length > 0) {
      setActivePropertyId(properties[0].id);
    }
  }, [activePropertyId, properties, setActivePropertyId]);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-60 bg-white border-r border-gray-100 flex flex-col shrink-0 shadow-sm">
        {/* Brand */}
        <div className="h-14 flex items-center px-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 leading-none">
                {biz?.name ?? "NestPro"}
              </p>
              {biz?.name && <p className="text-[10px] text-gray-400 mt-0.5">NestPro</p>}
            </div>
          </div>
        </div>

        {/* Property switcher */}
        {properties.length > 0 && (
          <div className="px-4 pt-4 pb-2">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 px-1">Active Property</p>
            <Select
              value={activePropertyId ? String(activePropertyId) : ""}
              onValueChange={(val) => setActivePropertyId(Number(val))}
            >
              <SelectTrigger className="w-full h-9 text-xs bg-gray-50 border-gray-200">
                <SelectValue placeholder="Select Property" />
              </SelectTrigger>
              <SelectContent>
                {properties.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)} className="text-xs">
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Main nav */}
        <nav className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">Menu</p>
          {navigation.map((item) => {
            const isActive = location === item.href ||
              (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <item.icon className={`mr-2.5 shrink-0 h-4 w-4 ${isActive ? "text-blue-600" : "text-gray-400"}`} />
                {item.name}
                {isActive && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-500" />}
              </Link>
            );
          })}

          <div className="pt-3 mt-3 border-t border-gray-100 space-y-0.5">
            {bottomNav.map((item) => {
              const isActive = location === item.href || location.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <item.icon className={`mr-2.5 shrink-0 h-4 w-4 ${
                    item.name === "AI Receptionist"
                      ? isActive ? "text-purple-600" : "text-purple-400"
                      : isActive ? "text-blue-600" : "text-gray-400"
                  }`} />
                  {item.name}
                  {item.name === "AI Receptionist" && (
                    <span className="ml-auto text-[9px] font-bold bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full">AI</span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-gray-50 group">
            <div className="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold shrink-0">
              {user ? getUserInitials(user.name) : "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-900 truncate">{user?.name ?? "User"}</p>
              <p className="text-[10px] text-gray-400 truncate">{user?.email ?? ""}</p>
            </div>
            <button
              onClick={handleLogout}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500"
              title="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-8 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-gray-900 capitalize">
              {location === "/" ? "Dashboard" :
               location === "/ai" ? "AI Receptionist" :
               location.split("/")[1].replace(/-/g, " ")}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {properties.length > 0 && activePropertyId && (
              <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                {properties.find((p) => p.id === activePropertyId)?.name ?? ""}
              </span>
            )}
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
