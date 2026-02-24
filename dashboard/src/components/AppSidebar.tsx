import { Logo } from "@/components/ui/Logo";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Bot,
  Box,
  PanelLeft,
  MessageSquare,
  BarChart3,
  Download,
  BookOpen,
  FileText,
  Activity,
  Users,
  KeyRound,
  Shield,
  ChevronRight,
  ChevronLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/contexts/SidebarContext";
import { usePermissions } from "@/lib/permissions";
import { Progress } from "@/components/ui/progress";
import { useDownload } from "@/contexts/DownloadContext";
import NotificationBell from "@/components/ui/NotificationBell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface NavItem {
  id: string;
  title: string;
  icon: React.ElementType;
  url: string;
  requiresPermission?: keyof ReturnType<typeof usePermissions>;
  staffOnly?: boolean;
}

const adminNavItems: NavItem[] = [
  { id: "overview", title: "Overview", icon: LayoutDashboard, url: "/dashboard" },
  { id: "model-hub", title: "Models", icon: Box, url: "/model-hub" },
  { id: "api-keys", title: "API Keys", icon: KeyRound, url: "/apikeys" },
  { id: "monitoring", title: "Monitoring", icon: BarChart3, url: "/monitoring" },
  { id: "system-health", title: "System Health", icon: Activity, url: "/system-health" },
  { id: "workspaces", title: "Workspaces", icon: MessageSquare, url: "/chat" },
  { id: "identity-access", title: "Identity & Access", icon: Users, url: "/identity-access" },
];

const staffNavItems: NavItem[] = [
  { id: "workspaces", title: "Workspaces", icon: MessageSquare, url: "/chat", staffOnly: true },
  { id: "prompt-library", title: "Prompt Library", icon: BookOpen, url: "/prompt-library", staffOnly: true },
  { id: "personal-rag", title: "My Documents", icon: FileText, url: "/personal-rag", staffOnly: true },
];

const AppSidebar = () => {
  const { isCollapsed, toggle } = useSidebar();
  const location = useLocation();
  const permissions = usePermissions();
  const { downloads } = useDownload();
  
  const isActiveRoute = (url: string) => location.pathname.startsWith(url);
  const navItems = permissions.isStaffOnly ? staffNavItems : adminNavItems;

  const activeDownloads = Object.values(downloads || {}).filter(d => 
    d.status === 'downloading' || d.status === 'Starting...' || d.status === 'Resuming...'
  );

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 bottom-6 bg-card/80 backdrop-blur-xl border-r border-border/40 flex flex-col z-50 transition-all duration-300 ease-in-out shadow-sm",
        isCollapsed ? "w-[70px]" : "w-[260px]"
      )}
    >
      {/* Header */}
      <div className="h-16 flex items-center px-4 border-b border-border/40">
        <div className={cn("flex items-center gap-3 w-full transition-all", isCollapsed ? "justify-center" : "justify-between")}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="bg-primary/10 p-2 rounded-lg shrink-0">
               <Shield className="w-5 h-5 text-primary" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-sm tracking-tight">Fortress</span>
                <span className="text-[10px] text-muted-foreground font-mono">Secure Workspace</span>
              </div>
            )}
          </div>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggle} 
            className={cn("h-8 w-8 hover:bg-accent text-muted-foreground", isCollapsed && "hidden")}
          >
            <PanelLeft className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.id}
            to={item.url}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 group relative text-sm",
              isActiveRoute(item.url) 
                ? "bg-primary/10 text-primary font-medium" 
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
              isCollapsed && "justify-center px-0 py-3"
            )}
          >
            <item.icon className={cn("w-5 h-5 shrink-0 transition-colors", isActiveRoute(item.url) ? "text-primary" : "group-hover:text-foreground")} />
            
            {!isCollapsed && (
              <span className="whitespace-nowrap overflow-hidden text-ellipsis">{item.title}</span>
            )}
            
            {/* Tooltip for collapsed state */}
            {isCollapsed && (
              <div className="absolute left-14 hidden group-hover:block ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded-md border shadow-md whitespace-nowrap z-50 animate-in fade-in zoom-in-95 duration-200">
                {item.title}
              </div>
            )}
          </Link>
        ))}
      </nav>

      {/* Footer Area */}
      <div className="p-4 border-t border-border/40 bg-muted/20 space-y-4">
        
        {/* Active Downloads Section */}
        {activeDownloads.length > 0 && (
          <div className={cn("rounded-lg bg-background border border-border shadow-sm transition-all", isCollapsed ? "p-2" : "p-3")}>
             {!isCollapsed ? (
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                  <Download className="w-3.5 h-3.5" />
                  <span>Downloads</span>
                </div>
                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-mono">
                  {activeDownloads.length}
                </span>
              </div>
            ) : (
                <div className="flex justify-center mb-2">
                   <Download className="w-4 h-4 text-primary animate-pulse" />
                </div>
            )}

            <div className="space-y-3 w-full">
              {activeDownloads.map((download) => (
                <div key={download.modelId} className="space-y-1.5 w-full">
                  {!isCollapsed && (
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span className="truncate max-w-[100px] font-medium" title={download.modelId}>{download.modelId}</span>
                      <span className="font-mono text-[10px]">{Math.round(download.progress || 0)}%</span>
                    </div>
                  )}
                  <Progress value={download.progress || 0} className="h-1.5 w-full bg-secondary" indicatorClassName="bg-primary" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* User Profile & Notifications */}
        <div className={cn("flex items-center gap-3 pt-1", isCollapsed ? "flex-col justify-center" : "justify-between")}>
           <div className="flex items-center gap-3 overflow-hidden">
                <Avatar className="h-8 w-8 border border-border/50">
                    <AvatarImage src="/placeholder-avatar.jpg" />
                    <AvatarFallback className="bg-primary/5 text-primary text-xs font-medium">AD</AvatarFallback>
                </Avatar>
                {!isCollapsed && (
                    <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium truncate text-foreground">Admin</span>
                    <span className="text-[10px] text-muted-foreground truncate">admin@fortress.ai</span>
                    </div>
                )}
           </div>
           
           {!isCollapsed && <NotificationBell />}
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;
