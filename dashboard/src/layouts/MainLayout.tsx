import { Outlet, useLocation, Navigate, useNavigate } from "react-router-dom";
import AppSidebar from "@/components/AppSidebar";
import { SidebarProvider, useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";
import BottomTray from "@/components/BottomTray";
import { useEffect, useState } from "react";
import { FirstLoginModal } from "@/components/FirstLoginModal";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationCenter } from "@/components/NotificationCenter";
import { useLicense } from "@/contexts/LicenseContext";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";

// Route title mapping
const routeTitles: Record<string, string> = {
  "/dashboard": "System Overview",
  "/monitoring": "Monitoring & Analytics",
  "/model-hub": "Model Hub",
  "/apikeys": "API Keys",
  "/audit-logs": "Audit Logs",
  "/identity-access": "Identity & Access",
  "/system-health": "System Health",
  "/chat": "Workspaces",
  "/prompt-library": "Prompt Library",
  "/personal-rag": "My Documents",
  "/support": "Support Center",
  "/documentation": "Documentation",
  "/release-notes": "Release Notes",
  "/about": "About Fortress",
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
      // Optional: loading spinner
    return <div className="h-screen w-full flex items-center justify-center bg-background">Loading...</div>; 
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const MainContent = () => {
  const { isCollapsed } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const pageTitle = routeTitles[location.pathname] || "Dashboard";
  const [showWelcome, setShowWelcome] = useState(false);
  const { license, isLoading: isLicenseLoading } = useLicense();
  const { user } = useAuth();
  
  const isLicenseExpired = license?.status === "expired" || license?.status === "invalid";
  const [showLicenseBlocker, setShowLicenseBlocker] = useState(false);

  useEffect(() => {
    if (!isLicenseLoading && isLicenseExpired) {
        setShowLicenseBlocker(true);
    } else {
        setShowLicenseBlocker(false);
    }
  }, [isLicenseLoading, isLicenseExpired]);

  useEffect(() => {
    // Check if we just completed setup
    const justCompletedSetup = localStorage.getItem("fortress_setup_just_completed");
    
    if (justCompletedSetup === "true") {
        setShowWelcome(true);
        // Clear the flag so it doesn't show again on reload
        localStorage.removeItem("fortress_setup_just_completed");
    }
  }, []);

  const handleLicenseAction = () => {
      // If user is admin, go to license management
      // If user is not admin, just close (but it will reopen if we don't fix it? or maybe show contact info)
      if (user?.role === "admin") {
          navigate("/dashboard/admin/licenses"); // Assuming route exists or /admin/licenses
          // We need to allow navigation to this page even if blocked?
          // The blocker is "on top" but we can check location.pathname to allow it.
      }
  };

  // Allow access to license management page even if expired so admin can fix it
  const isLicensePage = location.pathname.includes("/admin/licenses") || location.pathname.includes("/license-management");

  return (
    <ProtectedRoute>
    <div className="h-screen bg-background overflow-hidden flex flex-col">
      <FirstLoginModal open={showWelcome} onOpenChange={setShowWelcome} />
      
      <Dialog open={showLicenseBlocker && !isLicensePage} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <div className="mx-auto bg-destructive/10 p-3 rounded-full mb-2 w-fit">
                    <ShieldAlert className="h-6 w-6 text-destructive" />
                </div>
                <DialogTitle className="text-center">License Expired</DialogTitle> {/* Fixed: Removed extra 'Title' */}
                <DialogDescription className="text-center">
                    Your Fortress license has expired. Please contact your administrator or renew your license to continue accessing the platform.
                </DialogDescription>
            </DialogHeader>
            <DialogFooter className="sm:justify-center">
                {user?.role === "admin" ? (
                    <Button onClick={() => navigate("/license-management")} className="w-full">
                        Manage License
                    </Button>
                ) : (
                    <Button variant="outline" className="w-full" disabled>
                        Contact Admin
                    </Button>
                )}
            </DialogFooter>
        </DialogContent>
      </Dialog>

      <AppSidebar />
      
      {/* Fixed Header - aligned with sidebar header */}
      <header
        className={cn(
          "flex items-center justify-between px-4 lg:px-6 bg-background transition-all duration-300 shrink-0 pt-3 pb-3",
          isCollapsed ? "ml-14" : "ml-64"
        )}
      >
        <h1 className="text-sm font-medium font-persis text-foreground">{pageTitle}</h1>
        <div className="flex items-center gap-4">
            <NotificationCenter />
        </div>
      </header>

      {/* Main Content */}
      <main
        className={cn(
          "transition-all duration-300 flex-1 overflow-hidden pb-6",
          isCollapsed ? "ml-14" : "ml-64"
        )}
      >
        <div className="p-6 lg:p-8 h-full overflow-y-auto">
          <Outlet />
        </div>
      </main>
      
      <BottomTray />
    </div>
    </ProtectedRoute>
  );
};

const MainLayout = () => {
  return (
    <SidebarProvider>
      <MainContent />
    </SidebarProvider>
  );
};

export default MainLayout;