import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useNavigate } from "react-router-dom";
import { ChevronUp, FileText, HelpCircle, Copy, Info, ExternalLink, Cpu, MemoryStick, KeyRound, AlertTriangle, CheckCircle, XCircle, Clock, Sun, Moon, User, Settings, LogOut, Database, Gauge, Bot, Shield, RotateCw } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import LicenseSheet from "./LicenseSheet";
import { Logo } from "@/components/ui/Logo";
import { toast } from "@/hooks/use-toast";
import { useDownload } from "@/contexts/DownloadContext";
import { useLicense } from "@/contexts/LicenseContext";

const BottomTray = () => {
  const [isLicenseSheetOpen, setIsLicenseSheetOpen] = useState(false);
  const [systemMetrics, setSystemMetrics] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { downloads } = useDownload();
  const { license } = useLicense();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("fortress_token");
        if (!token) return;
        
        const res = await fetch("http://localhost:8000/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.ok) {
          const user = await res.json();
          setCurrentUser(user);
        }
      } catch (e) {
        console.error("Failed to fetch user", e);
      }
    };
    
    fetchUser();
  }, []);

  useEffect(() => {
    const fetchMetrics = async () => {
      const start = performance.now();
      try {
        const res = await fetch("http://localhost:8000/api/system/metrics");
        const end = performance.now();
        setLatencyMs(Math.round(end - start));

        if (res.ok) {
          const metrics = await res.json();
          setSystemMetrics(metrics);
        }
      } catch (e) {
        console.error("Failed to fetch metrics", e);
        setLatencyMs(null);
      }
    };
    
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 2000);
    return () => clearInterval(interval);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };
  
  // Real system metrics or default
  const cpuUsage = systemMetrics?.cpu_usage ?? 0;
  const ramUsage = systemMetrics?.ram_usage ?? 0;
  const ramTotal = systemMetrics?.ram_total ?? 0;
  const ramUsed = systemMetrics?.ram_used ?? 0;
  
  // Real connection status
  const ollamaConnected = systemMetrics?.ollama_status ?? false;
  const vectorDbActive = true; // Still mocked
  const latency = latencyMs !== null ? `${latencyMs}ms` : "Offline";
  const currentModel = systemMetrics?.loaded_model || "No Model Loaded";
  
  // Mock license data
  const licenseStatus = "active" as "active" | "expiring" | "expired" | "invalid";

  const handleCopyInfo = () => {
    const info = `Fortress v1.0.0\nCPU: ${cpuUsage}%\nRAM: ${ramUsed}GB / ${ramTotal}GB\nOllama: ${ollamaConnected ? "Connected" : "Offline"}\nVector DB: ${vectorDbActive ? "Active" : "Inactive"}\nLatency: ${latency}\nUser: ${currentUser?.full_name || "Unknown"}`;
    navigator.clipboard.writeText(info);
    toast({ title: "Copied", description: "System info copied to clipboard." });
  };


  const getLicenseStatusIcon = () => {
    switch (licenseStatus) {
      case "active":
        return <CheckCircle className="h-2.5 w-2.5 text-success" />;
      case "expiring":
        return <Clock className="h-2.5 w-2.5 text-warning" />;
      case "expired":
        return <XCircle className="h-2.5 w-2.5 text-destructive" />;
      case "invalid":
        return <AlertTriangle className="h-2.5 w-2.5 text-destructive" />;
    }
  };

  const getLicenseStatusColor = () => {
    switch (licenseStatus) {
      case "active":
        return "text-success";
      case "expiring":
        return "text-warning";
      case "expired":
      case "invalid":
        return "text-destructive";
    }
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 h-6 bg-sidebar-background border-t border-border z-50">
        <div className="flex items-center justify-between h-full px-2">
          {/* Left side - Status Indicators */}
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1.5 px-1.5 py-0.5 rounded hover:bg-sidebar-accent transition-colors group">
                  <div className="h-3.5 w-3.5 flex items-center justify-center">
                    <Logo size={14} />
                  </div>
                  <span className="text-[10px] text-sidebar-foreground font-persis">
                    Fortress v1.0.0 {license?.organization ? `• ${license.organization}` : ""}
                  </span>
                  <ChevronUp className="h-2.5 w-2.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-44 mb-0.5">
                <DropdownMenuItem className="gap-1.5 text-[10px] py-1" onClick={() => navigate('/support')}>
                  <HelpCircle className="h-3 w-3" />
                  Support
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-1.5 text-[10px] py-1" onClick={() => window.open('https://fortress-stack.tech/docs', '_blank')}>
                  <FileText className="h-3 w-3" />
                  Documentation
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-1.5 text-[10px] py-1" onClick={handleCopyInfo}>
                  <Copy className="h-3 w-3" />
                  Copy System Info
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="h-3 w-px bg-border" />

            <TooltipProvider delayDuration={0}>
              {/* Vector DB Status */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 px-1 py-0.5 rounded hover:bg-sidebar-accent transition-colors cursor-default">
                    <Database className="h-2.5 w-2.5 text-muted-foreground" />
                    <div className={cn("h-1.5 w-1.5 rounded-full", vectorDbActive ? "bg-success" : "bg-destructive")} />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-[10px]">
                  <p>Vector DB: {vectorDbActive ? "Active" : "Inactive"}</p>
                </TooltipContent>
              </Tooltip>

              {/* Latency */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 px-1 py-0.5 rounded hover:bg-sidebar-accent transition-colors cursor-default">
                    <Gauge className="h-2.5 w-2.5 text-muted-foreground" />
                    <span className="text-[9px] text-success">{latency}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-[10px]">
                  <p>API Latency: {latency}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Center - Current Model or Download Progress */}
          {Object.keys(downloads).length > 0 ? (
            <div className="flex items-center gap-2 px-2 py-0.5 rounded-lg select-none">
               <RotateCw className="h-2.5 w-2.5 animate-spin text-primary" />
               <span className="text-[9px] font-medium text-primary">
                  Downloading {Object.values(downloads)[0]?.modelId || 'Unknown'}: {Object.values(downloads)[0]?.progress || 0}%
               </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg select-none">
                <Bot className="h-2.5 w-2.5 text-muted-foreground" />
                <span className="text-[9px] font-medium text-muted-foreground">{currentModel}</span>
            </div>
          )}

          {/* Right side - Metrics and License */}
          <div className="flex items-center gap-2">
            <TooltipProvider delayDuration={0}>
              {/* CPU Usage */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 px-1 py-0.5 rounded hover:bg-sidebar-accent transition-colors cursor-default">
                    <Cpu className="h-2.5 w-2.5 text-muted-foreground" />
                    <span className="text-[9px] text-muted-foreground">{cpuUsage}%</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-[10px]">
                  <div className="space-y-0.5">
                    <p className="font-medium">CPU Usage</p>
                    <p className="text-muted-foreground">Current: {cpuUsage}%</p>
                    <p className="text-muted-foreground">Cores: 8</p>
                  </div>
                </TooltipContent>
              </Tooltip>

              <div className="h-3 w-px bg-border" />

              {/* RAM Usage */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 px-1 py-0.5 rounded hover:bg-sidebar-accent transition-colors cursor-default">
                    <MemoryStick className="h-2.5 w-2.5 text-muted-foreground" />
                    <span className="text-[9px] text-muted-foreground">{ramUsed}GB</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-[10px]">
                  <div className="space-y-0.5">
                    <p className="font-medium">Memory Usage</p>
                    <p className="text-muted-foreground">Used: {ramUsed}GB / {ramTotal}GB</p>
                    <p className="text-muted-foreground">Usage: {ramUsage}%</p>
                  </div>
                </TooltipContent>
              </Tooltip>

              <div className="h-3 w-px bg-border" />

              {/* Theme Toggle */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={toggleTheme}
                    className="flex items-center gap-1 px-1 py-0.5 rounded hover:bg-sidebar-accent transition-colors"
                  >
                    {theme === "dark" ? (
                      <Moon className="h-2.5 w-2.5 text-muted-foreground" />
                    ) : (
                      <Sun className="h-2.5 w-2.5 text-muted-foreground" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-[10px]">
                  <p>Switch to {theme === "dark" ? "light" : "dark"} mode</p>
                </TooltipContent>
              </Tooltip>

              <div className="h-3 w-px bg-border" />

              {/* License */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={() => setIsLicenseSheetOpen(true)}
                    className={cn(
                      "flex items-center gap-1 px-1 py-0.5 rounded hover:bg-sidebar-accent transition-colors",
                      getLicenseStatusColor()
                    )}
                  >
                    <KeyRound className="h-2.5 w-2.5" />
                    {getLicenseStatusIcon()}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-[10px]">
                  <p>License: {licenseStatus.charAt(0).toUpperCase() + licenseStatus.slice(1)}</p>
                </TooltipContent>
              </Tooltip>

              <div className="h-3 w-px bg-border" />

              {/* User Profile */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1.5 px-1 py-0.5 rounded hover:bg-sidebar-accent transition-colors">
                    <div className="w-3.5 h-3.5 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="w-2 h-2 text-primary" />
                    </div>
                    <span className="text-[10px] text-sidebar-foreground truncate max-w-[100px]">{currentUser ? currentUser.full_name : "Loading..."}</span>
                    <span className="text-[9px] text-muted-foreground">{currentUser ? currentUser.role : ""}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44 mb-0.5">
                  <DropdownMenuItem className="gap-1.5 text-[10px] py-1">
                    <User className="h-3 w-3" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-1.5 text-[10px] py-1">
                    <Settings className="h-3 w-3" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="gap-1.5 text-[10px] py-1 text-destructive">
                    <LogOut className="h-3 w-3" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TooltipProvider>
          </div>
        </div>
      </div>

      <LicenseSheet 
        isOpen={isLicenseSheetOpen} 
        onClose={() => setIsLicenseSheetOpen(false)} 
      />
    </>
  );
};

export default BottomTray;
