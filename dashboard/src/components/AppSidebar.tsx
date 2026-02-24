import { Logo } from "@/components/ui/Logo";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Bot,
  FolderOpen,
  ScrollText,
  Users,
  Activity,
  Box,
  PanelLeft,
  MessageSquare,
  BarChart3,
  Download,
  BookOpen,
  FileText,
  X,
  Shield,
  KeyRound,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/contexts/SidebarContext";
import { usePermissions } from "@/lib/permissions";
import { useLicense } from "@/contexts/LicenseContext";
import { Progress } from "@/components/ui/progress";
import { useState, useEffect } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import { useDownload } from "@/contexts/DownloadContext";

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
  { id: "audit-logs", title: "Audit Logs", icon: ScrollText, url: "/audit-logs", staffOnly: true },
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
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const permissions = usePermissions();
  const { downloads, activeDownloadCount } = useDownload();
  const { license } = useLicense();
  
  const isActiveRoute = (url: string) => location.pathname === url;
  const navItems = permissions.isStaffOnly ? staffNavItems : adminNavItems;

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 bottom-6 bg-sidebar border-r border-border/30 flex flex-col z-50 transition-all duration-300",
        isCollapsed ? "w-14" : "w-64"
      )}
    >
      {/* Header */}
      <div className="p-3">
        <div className="flex items-center gap-3 pb-3">
          {isCollapsed ? (
            <Button variant="ghost" size="icon" onClick={toggle} className="w-8 h-8 mx-auto">
              <PanelLeft className="w-5 h-5 text-muted-foreground" />
            </Button>
          ) : (
            <>
              <div className="p-1.5 rounded-lg">
                <Logo size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="font-bold font-persis text-sm tracking-wide whitespace-nowrap">Fortress</h1>
                <p className="text-[10px] font-mono text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">
                  {license?.organization || "Secure Workspace"}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={toggle} className="w-8 h-8 shrink-0">
                <PanelLeft className="w-4 h-4 text-muted-foreground" />
              </Button>
            </>
          )}
        </div>
        <div className="mx-1">
          <div className="h-px bg-sidebar-border" />
        </div>
      </div>

      <div className="px-3 py-2">
        <Button
          variant="outline"
          className={cn(
            "relative h-9 w-full justify-start rounded-[0.5rem] bg-muted/50 text-sm font-normal text-muted-foreground shadow-none sm:pr-12 md:w-full",
            isCollapsed && "h-9 w-9 p-0 justify-center"
          )}
          onClick={() => setOpen(true)}
        >
          <Search className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
          {!isCollapsed && (
            <>
              <span className="hidden lg:inline-flex">Search...</span>
              <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                <span className="text-xs">⌘</span>K
              </kbd>
            </>
          )}
        </Button>
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." value={searchValue} onValueChange={setSearchValue} />
        {searchValue.length > 0 && (
            <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Navigation">
                {navItems.map((item) => (
                <CommandItem
                    key={item.id}
                    value={item.title}
                    onSelect={() => {
                    runCommand(() => navigate(item.url));
                    }}
                >
                    <item.icon className="mr-2 h-4 w-4" />
                    <span>{item.title}</span>
                </CommandItem>
                ))}
            </CommandGroup>
            </CommandList>
        )}
      </CommandDialog>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        <div className="space-y-1">
          {navItems.map((item) => (
            isCollapsed ? (
              <button
                key={item.id}
                onClick={toggle}
                className={cn(
                  "flex items-center justify-center w-10 h-10 mx-auto rounded-lg transition-colors cursor-pointer hover:bg-sidebar-accent",
                  isActiveRoute(item.url) ? "bg-sidebar-accent text-primary" : "text-muted-foreground"
                )}
              >
                <item.icon className="w-5 h-5" />
              </button>
            ) : (
              <Link
                key={item.id}
                to={item.url}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 text-sm font-medium hover:bg-sidebar-accent rounded-lg",
                  isActiveRoute(item.url) && "text-primary bg-sidebar-accent"
                )}
              >
                <item.icon className={cn(
                  "w-4 h-4 shrink-0",
                  isActiveRoute(item.url) ? "text-primary" : "text-muted-foreground"
                )} />
                <span className="whitespace-nowrap">{item.title}</span>
              </Link>
            )
          ))}
        </div>
      </nav>

      {/* Active Downloads Section */}
      {!isCollapsed && Object.values(downloads || {}).filter(d => d.status === 'downloading').length > 0 && (
        <div className="p-4 border-t border-border">
          <div className="text-xs font-semibold text-muted-foreground mb-2">
            Active Downloads
          </div>
          <div className="space-y-3">
            {Object.values(downloads)
              .filter(d => d.status === 'downloading' || d.status === 'Starting...' || d.status === 'Resuming...')
              .map((download) => (
              <div key={download.modelId} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="truncate max-w-[120px]">{download.modelId}</span>
                  <span>{Math.round(download.progress || 0)}%</span>
                </div>
                <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300" 
                    style={{ width: `${download.progress || 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
};

export default AppSidebar;

