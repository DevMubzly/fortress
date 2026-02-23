import { Outlet, useLocation, Navigate } from "react-router-dom";
import AppSidebar from "@/components/AppSidebar";
import { SidebarProvider, useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";
import BottomTray from "@/components/BottomTray";
import { useEffect, useState } from "react";
import { WelcomeModal } from "@/components/WelcomeModal";


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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("fortress_token");
    setIsAuthenticated(!!token);
  }, []);

  if (isAuthenticated === null) {
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
  const pageTitle = routeTitles[location.pathname] || "Dashboard";
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    // Check if we just completed setup
    const justCompletedSetup = localStorage.getItem("fortress_setup_just_completed");
    
    if (justCompletedSetup === "true") {
        setShowWelcome(true);
        // Clear the flag so it doesn't show again on reload
        localStorage.removeItem("fortress_setup_just_completed");
    }
  }, []);

  return (
    <ProtectedRoute>
    <div className="h-screen bg-background overflow-hidden flex flex-col">
      <WelcomeModal open={showWelcome} onOpenChange={setShowWelcome} />
      <AppSidebar />
      
      {/* Fixed Header - aligned with sidebar header */}
      <header
        className={cn(
          "flex items-center px-4 lg:px-6 bg-background transition-all duration-300 shrink-0 pt-3 pb-3",
          isCollapsed ? "ml-14" : "ml-64"
        )}
      >
        <h1 className="text-sm font-medium font-persis text-foreground">{pageTitle}</h1>
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