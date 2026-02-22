"use client";

import { usePathname, useRouter } from "next/navigation";
import { 
  Building2, 
  FileKey, 
  BarChart3, 
  Inbox, 
  Bell, 
  LogOut,
  ChevronDown,
  Sun,
  Moon,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import Logo from "@/components/ui/logo";
import { Toaster } from "@/components/ui/toaster";

const navItems = [
  { path: '/vendor-tools/dashboard/organizations', label: 'Organizations', icon: Building2 },
  { path: '/vendor-tools/dashboard/license-generator', label: 'License Generator', icon: FileKey },
  { path: '/vendor-tools/dashboard/analytics', label: 'Global Analytics', icon: BarChart3 },
  { path: '/vendor-tools/dashboard/leads', label: 'Lead Inbox', icon: Inbox },
  { path: '/vendor-tools/dashboard/renewals', label: 'Renewal Alerts', icon: Bell },
];

export default function VendorDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    router.push("/vendor-tools");
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-inter">
      {/* Top Navigation */}
      <header className="border-b border-border/50 bg-white sticky top-0 z-50 shadow-sm">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
                <Logo />
                <div className="h-6 w-px bg-gray-200 mx-2" />
                <h1 className="font-semibold text-lg text-gray-900">Admin Portal</h1>
            </div>
            
            <nav className="flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.path;
                return (
                  <Button
                    key={item.path}
                    variant={isActive ? "secondary" : "ghost"}
                    size="sm"
                    className={cn(
                      "gap-2 text-gray-600",
                      isActive && "bg-blue-50 text-blue-700 font-medium"
                    )}
                    onClick={() => router.push(item.path)}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Button>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 text-gray-700">
                  admin@company.com
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-700 focus:bg-red-50">
                    <LogOut className="w-4 h-4 mr-2" />
                    Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {children}
      </main>
      <Toaster />
    </div>
  );
}
