import { useState, useEffect, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Activity,
  Filter,
  Download,
  RefreshCw,
  Search,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { toast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";

interface LogEntry {
    id: number;
    key_name: string | null;
    username: string | null;
    model: string;
    total_tokens: number;
    latency_ms: number;
    status_code: number;
    ip_address: string;
    created_at: string;
}

interface OverviewStats {
    total_tokens: number;
    avg_latency: number;
    error_rate: number;
    total_requests: number;
}

const MonitoringAnalyticsPage = () => {
  const [timeRange, setTimeRange] = useState("24h"); // Currently backend supports 24h for activity, global for others.
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Data State
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [activityData, setActivityData] = useState<any[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [modelFilter, setModelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [models, setModels] = useState<string[]>([]);

  const fetchData = async () => {
      try {
          const token = localStorage.getItem("fortress_token");
          const headers = { Authorization: `Bearer ${token}` };

          // 1. Stats
          const statsRes = await fetch(`http://localhost:8000/api/stats/overview?range=${timeRange}`, { headers });
          if (statsRes.ok) setStats(await statsRes.json());

          // 2. Activity
          const actRes = await fetch(`http://localhost:8000/api/stats/activity?range=${timeRange}`, { headers });
          if (actRes.ok) setActivityData(await actRes.json());
          
          // 3. Models (for filter)
          const modelsRes = await fetch("http://localhost:8000/api/models", { headers });
          if (modelsRes.ok) {
              const data = await modelsRes.json();
              const list = Array.isArray(data) ? data : data.models || [];
              setModels(list.map((m: any) => m.id));
          }

      } catch (e) {
          console.error(e);
          toast({ title: "Failed to load metrics", variant: "destructive" });
      }
  };

  const fetchLogs = async () => {
      try {
          const token = localStorage.getItem("fortress_token");
          const params = new URLSearchParams();
          params.append("limit", "100");
          params.append("range", timeRange);
          if (modelFilter !== "all") params.append("model", modelFilter);
          if (statusFilter !== "all") params.append("status", statusFilter);
          if (searchQuery) params.append("search", searchQuery);

          const res = await fetch(`http://localhost:8000/api/stats/logs?${params.toString()}`, {
              headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
              const data = await res.json();
              setLogs(data.data); // data.data because of pagination wrapper
          }
      } catch (e) {
          console.error(e);
      }
  };

  useEffect(() => {
      setLoading(true);
      Promise.all([fetchData(), fetchLogs()]).finally(() => setLoading(false));
  }, []); // Initial load

  // Re-fetch everything when Time Range changes
  useEffect(() => {
      setLoading(true);
      Promise.all([fetchData(), fetchLogs()]).finally(() => setLoading(false));
  }, [timeRange]);

  // Re-fetch logs when other filters change
  useEffect(() => {
      fetchLogs();
  }, [modelFilter, statusFilter, searchQuery]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchData(), fetchLogs()]);
    setIsRefreshing(false);
    toast({ title: "Data Refreshed" });
  };

  const handleExport = (format: string) => {
    const exportData = {
        generated_at: new Date().toISOString(),
        overview: stats,
        logs: logs
    };

    if (format === "json") {
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `analytics-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === "csv") {
      const headers = ["Timestamp", "Model", "Key", "User", "Tokens", "Latency(ms)", "Status", "IP"];
      const rows = logs.map(l => [
          l.created_at,
          l.model,
          l.key_name || "N/A",
          l.username || "N/A",
          l.total_tokens,
          l.latency_ms,
          l.status_code,
          l.ip_address
      ]);
      const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
    toast({ title: "Export Complete" });
  };

  if (loading) {
    return (
      <div className="h-full overflow-y-auto space-y-4 p-1">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <Skeleton className="h-8 w-48" />
            <div className="flex gap-2">
                <Skeleton className="h-8 w-[120px]" />
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-[100px]" />
            </div>
        </div>

        {/* Metrics Cards Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="glass rounded-lg p-4 border border-border/50 bg-card h-[100px] flex flex-col justify-between">
                     <div className="flex justify-between items-start">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-4 rounded-full" />
                     </div>
                     <div className="space-y-2">
                        <Skeleton className="h-8 w-24" />
                        <Skeleton className="h-3 w-32" />
                     </div>
                </div>
            ))}
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-72">
             {[...Array(2)].map((_, i) => (
                 <div key={i} className="glass rounded-lg p-4 border border-border/50 bg-card flex flex-col">
                    <Skeleton className="h-5 w-32 mb-4" />
                    <Skeleton className="flex-1 w-full rounded-md" />
                 </div>
             ))}
        </div>

        {/* Logs Table Skeleton */}
        <div className="glass rounded-lg border border-border/50 bg-card flex flex-col overflow-hidden h-[500px]">
            <div className="p-4 border-b border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
               <div className="space-y-2">
                   <Skeleton className="h-5 w-24" />
                   <Skeleton className="h-3 w-48" />
               </div>
               <div className="flex gap-2">
                   <Skeleton className="h-8 w-48" />
                   <Skeleton className="h-8 w-32" />
               </div>
            </div>
            <div className="p-4 space-y-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between gap-4">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-12" />
                    </div>
                ))}
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto space-y-4 p-1">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
           <h2 className="text-lg font-semibold flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Monitoring & Analytics
           </h2>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[120px] h-8 text-xs">
              <SelectValue placeholder="Range" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="24h">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" className="h-8 gap-2" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          
          <Select defaultValue="json" onValueChange={handleExport}>
             <SelectTrigger className="w-[100px] h-8 text-xs gap-2">
                <Download className="w-3.5 h-3.5" />
                <span>Export</span>
             </SelectTrigger>
             <SelectContent>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
             </SelectContent>
          </Select>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass rounded-lg p-4 border border-border/50 bg-card flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Tokens</p>
                  <Zap className="w-4 h-4 text-primary" />
              </div>
              <div>
                  <h3 className="text-2xl font-bold">{stats?.total_tokens.toLocaleString() || 0}</h3>
                  <p className="text-[10px] text-muted-foreground mt-1">Across all models</p>
              </div>
          </div>
          <div className="glass rounded-lg p-4 border border-border/50 bg-card flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Avg Latency</p>
                  <Clock className="w-4 h-4 text-primary" />
              </div>
              <div>
                  <h3 className="text-2xl font-bold">{stats?.avg_latency || 0}ms</h3>
                  <p className="text-[10px] text-muted-foreground mt-1">Response time</p>
              </div>
          </div>
          <div className="glass rounded-lg p-4 border border-border/50 bg-card flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Requests</p>
                  <Activity className="w-4 h-4 text-primary" />
              </div>
              <div>
                  <h3 className="text-2xl font-bold">{stats?.total_requests.toLocaleString() || 0}</h3>
                  <p className="text-[10px] text-muted-foreground mt-1">Total interactions</p>
              </div>
          </div>
          <div className="glass rounded-lg p-4 border border-border/50 bg-card flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Error Rate</p>
                  <AlertCircle className="w-4 h-4 text-red-500" />
              </div>
              <div>
                  <h3 className="text-2xl font-bold">{stats?.error_rate || 0}%</h3>
                  <p className="text-[10px] text-muted-foreground mt-1">Failed requests</p>
              </div>
          </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-72">
           <div className="glass rounded-lg p-4 border border-border/50 bg-card flex flex-col">
               <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                   <Activity className="w-4 h-4 text-primary"/> Request Volume
               </h3>
               <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={activityData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.4} />
                            <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} dy={10} />
                            <YAxis fontSize={10} axisLine={false} tickLine={false} />
                            <Tooltip 
                                contentStyle={{ background: "hsl(var(--card))", borderRadius: "8px", border: "1px solid hsl(var(--border))" }}
                                itemStyle={{ fontSize: "12px" }}
                            />
                            <Bar dataKey="requests" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Requests" />
                        </BarChart>
                    </ResponsiveContainer>
               </div>
           </div>

           <div className="glass rounded-lg p-4 border border-border/50 bg-card flex flex-col">
               <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                   <Zap className="w-4 h-4 text-primary"/> Token Consumption
               </h3>
               <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={activityData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.4} />
                            <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} dy={10} />
                            <YAxis fontSize={10} axisLine={false} tickLine={false} />
                            <Tooltip 
                                contentStyle={{ background: "hsl(var(--card))", borderRadius: "8px", border: "1px solid hsl(var(--border))" }}
                                itemStyle={{ fontSize: "12px" }}
                            />
                            <Line type="monotone" dataKey="tokens" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} name="Tokens" />
                        </LineChart>
                    </ResponsiveContainer>
               </div>
           </div>
      </div>

      {/* Logs Table Section */}
      <div className="glass rounded-lg border border-border/50 bg-card flex flex-col overflow-hidden h-[500px]">
          <div className="p-4 border-b border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
               <div>
                   <h3 className="text-sm font-medium">Request Logs</h3>
                   <p className="text-xs text-muted-foreground">Detailed history of all model interactions.</p>
               </div>
               
               <div className="flex items-center gap-2">
                   <div className="relative">
                       <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                       <Input 
                            placeholder="Search user, key, IP..." 
                            className="h-8 w-48 pl-8 text-xs bg-background/50" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                       />
                   </div>
                   <Select value={modelFilter} onValueChange={setModelFilter}>
                       <SelectTrigger className="h-8 w-32 text-xs">
                           <div className="flex items-center gap-2">
                               <Filter className="w-3 h-3" />
                               <SelectValue placeholder="Model" />
                           </div>
                       </SelectTrigger>
                       <SelectContent>
                           <SelectItem value="all">All Models</SelectItem>
                           {models.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                       </SelectContent>
                   </Select>
                   <Select value={statusFilter} onValueChange={setStatusFilter}>
                       <SelectTrigger className="h-8 w-32 text-xs">
                            <SelectValue placeholder="Status" />
                       </SelectTrigger>
                       <SelectContent>
                           <SelectItem value="all">All Status</SelectItem>
                           <SelectItem value="success">Success</SelectItem>
                           <SelectItem value="error">Error</SelectItem>
                       </SelectContent>
                   </Select>
               </div>
          </div>
          
          <div className="flex-1 overflow-auto">
              {logs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <p>No logs found matching your filters.</p>
                  </div>
              ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[180px]">Timestamp</TableHead>
                            <TableHead>Model</TableHead>
                            <TableHead>Key Name</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead className="text-right">Tokens</TableHead>
                            <TableHead className="text-right">Latency</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {logs.map((log) => (
                            <TableRow key={log.id}>
                                <TableCell className="text-xs text-muted-foreground font-mono">
                                    {new Date(log.created_at).toLocaleString()}
                                </TableCell>
                                <TableCell className="font-medium text-xs">
                                     <Badge variant="outline" className="font-mono font-normal text-[10px]">{log.model}</Badge>
                                </TableCell>
                                <TableCell className="text-xs">
                                     {log.key_name || "-"}
                                </TableCell>
                                <TableCell className="text-xs">
                                     {log.username || "-"}
                                </TableCell>
                                <TableCell className="text-xs text-right font-mono text-muted-foreground">
                                     {log.total_tokens}
                                </TableCell>
                                <TableCell className="text-xs text-right font-mono text-muted-foreground">
                                     {Math.round(log.latency_ms)}ms
                                </TableCell>
                                <TableCell className="text-center">
                                     {log.status_code === 200 ? (
                                         <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 text-[10px] h-5">Success</Badge>
                                     ) : (
                                         <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20 text-[10px] h-5">{log.status_code}</Badge>
                                     )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
              )}
          </div>
      </div>
    </div>
  );
};
export default MonitoringAnalyticsPage;
