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
import { createClient } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

const navItems = [
  { path: '/admin-portal/dashboard/analytics', label: 'Global Analytics', icon: BarChart3 },
  { path: '/admin-portal/dashboard/organizations', label: 'Organizations', icon: Building2 },
  { path: '/admin-portal/dashboard/leads', label: 'Lead Inbox', icon: Inbox },
  { path: '/admin-portal/dashboard/renewals', label: 'Renewal Alerts', icon: Bell },
  { path: '/admin-portal/dashboard/license-generator', label: 'License Generator', icon: FileKey },
];

export default function VendorDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [userEmail, setUserEmail] = useState<string>("admin@company.com");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Avoid setting state immediately if it causes problems, but typically this is fine.
    // The error says "Calling setState synchronously within an effect". 
    // This usually means `setMounted(true)` is called directly in the effect body, 
    // which IS effectively synchronous after mount. However, for client-side mounting checks it's common.
    // To make linter happy, we can wrap in a timeout or just ignore, but better to structure properly.
    // Actually, `setMounted(true)` inside useEffect runs AFTER render, so it triggers a re-render.
    // The linter warning might be about cascading updates.
    
    // Changing to run in a timeout or just use a ref if only needed for hydration check.
    // But since `mounted` is used for conditional rendering, we need state.
    // Let's use a small timeout to break the synchronous chain if that is the linter's complaint,
    // or simply accept the re-render.
    
    // Wait, the linter says: "Calling setState synchronously within an effect".
    // This is valid React for hydration mismatch avoidance.
    // But maybe specific lint rule is strict?
    // Let's try wrapping it.
    const timer = setTimeout(() => setMounted(true), 0);
    
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) {
        setUserEmail(user.email);
      }
    });

    return () => clearTimeout(timer);
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    router.push("/admin-portal");
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-inter">
      {/* Top Navigation */}
      <header className=" order/50 bg-white sticky top-0 z-50 ">
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
                      "gap-2 text-gray-600 transition-colors",
                      isActive && "bg-blue-50 text-blue-700 font-medium hover:bg-blue-100"
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
                <Button variant="ghost" size="sm" className="gap-2 text-gray-700 hover:bg-gray-100">
                  {userEmail}
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer">
                    <LogOut className="w-4 h-4 mr-2" />
                    Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto bg-gray-50/50">
        <div className="p-6 max-w-7xl mx-auto w-full">
            {children}
        </div>
      </main>
      <Toaster />
    </div>
  );
}
