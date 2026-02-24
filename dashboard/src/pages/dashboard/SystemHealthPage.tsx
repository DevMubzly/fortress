import { useState, useEffect, useMemo } from "react";
import { 
  Database, 
  Activity, 
  Server, 
  RefreshCw, 
  CheckCircle,
  Network,
  Cpu,
  HardDrive
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

interface SystemMetrics {
  cpu_usage: number;
  ram_usage: number;
  ram_total: number;
  ram_used: number;
  disk_total: number;
  disk_used: number;
  disk_percent: number;
  net_sent_mb: number;
  net_recv_mb: number;
  process_count: number;
  db_size_mb: number;
  os: string;
  uptime: number;
  ollama_status: boolean;
  loaded_model: string | null;
}

interface HistoryPoint {
    time: string;
    cpu: number;
    ram: number;
}

const SystemHealthPage = () => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [history, setHistory] = useState<HistoryPoint[]>([]);

  const fetchMetrics = async (isPolling = false) => {
    if (!isPolling) setIsLoading(true);
    try {
      const token = localStorage.getItem("fortress_token");
      const res = await fetch("http://localhost:8000/api/system/metrics", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch metrics");
      const data: SystemMetrics = await res.json();
      setMetrics(data);
      setLastUpdated(new Date());

      // Update history for charts
      setHistory(prev => {
          const newPoint = {
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              cpu: data.cpu_usage,
              ram: data.ram_usage
          };
          const newHistory = [...prev, newPoint];
          if (newHistory.length > 20) newHistory.shift(); // Keep last 20 points
          return newHistory;
      });

    } catch (error) {
       console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(() => fetchMetrics(true), 3000); // Poll every 3s
    return () => clearInterval(interval);
  }, []);

  // Data preparation for charts
  const diskData = useMemo(() => {
      if (!metrics) return [];
      return [
          { name: "Used", value: metrics.disk_used },
          { name: "Free", value: metrics.disk_total - metrics.disk_used }
      ];
  }, [metrics]);

  const networkData = useMemo(() => {
      if (!metrics) return [];
      return [
          { name: "Sent (Upload)", value: metrics.net_sent_mb },
          { name: "Received (Download)", value: metrics.net_recv_mb }
      ];
  }, [metrics]);

  const COLORS = {
      primary: "hsl(var(--primary))", 
      muted: "hsl(var(--muted))",
      success: "hsl(var(--success))",
      warning: "hsl(var(--warning))", 
      destructive: "hsl(var(--destructive))",
      chart1: "#0ea5e9", // Sky blue for free space
      chart2: "#ef4444", // Red for used space
  };

  const ServiceStatusItem = ({ icon: Icon, name, detail, status }: { icon: any, name: string, detail: string, status: "healthy" | "warning" | "error" }) => (
      <div className="flex items-center justify-between p-3 rounded-lg border bg-card/50 hover:bg-card/80 transition-colors">
          <div className="flex items-center gap-3">
              <div className={`p-2 rounded-md ${status === 'healthy' ? 'bg-green-500/10 text-green-500' : status === 'warning' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500'}`}>
                  <Icon className="w-4 h-4" />
              </div>
              <div>
                  <p className="font-medium text-sm">{name}</p>
                  <p className="text-xs text-muted-foreground">{detail}</p>
              </div>
          </div>
          <Badge variant="outline" className={`capitalize ${status === 'healthy' ? 'text-green-500 border-green-500/20 bg-green-500/5' : 'text-red-500 border-red-500/20 bg-red-500/5'}`}>
              {status}
          </Badge>
      </div>
  );

  if (!metrics && isLoading) {
     return (
        <div className="h-full p-6 space-y-6 overflow-y-auto bg-background">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-9 w-40" />
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[200px] w-full rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-[300px] w-full rounded-xl" />
        </div>
     );
  }

  if (!metrics) return null;

  return (
    <div className="h-full p-6 space-y-6 overflow-y-auto bg-background">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">System Health</h2>
          <p className="text-muted-foreground">Real-time infrastructure monitoring and service status.</p>
        </div>
        <div className="flex items-center gap-2">
           <Badge variant="outline" className="font-mono bg-background/50 backdrop-blur">
              Last updated: {lastUpdated.toLocaleTimeString()}
           </Badge>
           <Button variant="outline" size="icon" onClick={() => fetchMetrics(false)} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
           </Button>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          
          <div className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm flex flex-col justify-between hover:bg-muted/50 transition-colors">
             <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                 <span className="text-sm font-medium text-muted-foreground">CPU Usage</span>
                 <Cpu className="h-4 w-4 text-muted-foreground" />
             </div>
             <div>
                 <div className="text-2xl font-bold">{metrics.cpu_usage.toFixed(1)}%</div>
                 <div className="h-1.5 w-full bg-secondary rounded-full mt-3 overflow-hidden">
                     <div className="h-full bg-primary transition-all duration-500" style={{ width: `${Math.min(metrics.cpu_usage, 100)}%` }} />
                 </div>
                 <p className="text-xs text-muted-foreground mt-2">
                    {metrics.process_count} Processes Active
                 </p>
             </div>
          </div>

          <div className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm flex flex-col justify-between hover:bg-muted/50 transition-colors">
             <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                 <span className="text-sm font-medium text-muted-foreground">Memory Usage</span>
                 <Activity className="h-4 w-4 text-muted-foreground" />
             </div>
             <div>
                 <div className="text-2xl font-bold">{metrics.ram_usage.toFixed(1)}%</div>
                 <div className="h-1.5 w-full bg-secondary rounded-full mt-3 overflow-hidden">
                     <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${Math.min(metrics.ram_usage, 100)}%` }} />
                 </div>
                 <p className="text-xs text-muted-foreground mt-2">
                      {metrics.ram_used.toFixed(1)} GB / {metrics.ram_total.toFixed(1)} GB Used
                  </p>
             </div>
          </div>
          
          <div className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm flex flex-col justify-between hover:bg-muted/50 transition-colors">
             <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                 <span className="text-sm font-medium text-muted-foreground">Disk I/O</span>
                 <HardDrive className="h-4 w-4 text-muted-foreground" />
             </div>
             <div>
                 <div className="text-2xl font-bold">{metrics.disk_percent.toFixed(1)}%</div>
                 <div className="h-1.5 w-full bg-secondary rounded-full mt-3 overflow-hidden">
                     <div className="h-full bg-orange-500 transition-all duration-500" style={{ width: `${Math.min(metrics.disk_percent, 100)}%` }} />
                 </div>
                 <p className="text-xs text-muted-foreground mt-2">
                      {metrics.disk_used.toFixed(1)} GB Used
                  </p>
             </div>
          </div>

           <div className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm flex flex-col justify-between hover:bg-muted/50 transition-colors">
             <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                 <span className="text-sm font-medium text-muted-foreground">Network</span>
                 <Network className="h-4 w-4 text-muted-foreground" />
             </div>
             <div>
                 <div className="text-2xl font-bold">Active</div>
                 <div className="flex items-center gap-4 mt-3">
                     <div className="flex flex-col">
                        <span className="text-[10px] uppercase text-muted-foreground font-semibold">Sent</span>
                        <span className="text-sm font-medium">{metrics.net_sent_mb.toFixed(1)} MB</span>
                     </div>
                     <div className="w-px h-6 bg-border"></div>
                     <div className="flex flex-col">
                        <span className="text-[10px] uppercase text-muted-foreground font-semibold">Recv</span>
                        <span className="text-sm font-medium">{metrics.net_recv_mb.toFixed(1)} MB</span>
                     </div>
                 </div>
             </div>
          </div>

          {/* 1. CPU & RAM History (Line Chart) */}
          <Card className="col-span-1 lg:col-span-3 border bg-card shadow-sm">
              <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                      <Activity className="w-5 h-5 text-primary" />
                      Live System Load
                  </CardTitle>
                  <CardDescription>Real-time resource utilization (Last 60s)</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={history}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                          <XAxis dataKey="time" hide />
                          <YAxis domain={[0, 100]} fontSize={10} tickFormatter={v => `${v}%`} axisLine={false} tickLine={false} width={30} />
                          <Tooltip 
                              contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                              itemStyle={{ fontSize: '12px' }}
                              labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                          />
                          <Legend verticalAlign="top" height={36} iconType="circle" />
                          <Line type="monotone" dataKey="cpu" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="CPU Usage" animationDuration={500} isAnimationActive={false} />
                          <Line type="monotone" dataKey="ram" stroke="#a855f7" strokeWidth={2} dot={false} name="RAM Usage" animationDuration={500} isAnimationActive={false} />
                      </LineChart>
                  </ResponsiveContainer>
              </CardContent>
          </Card>

          {/* 2. Platform Services Status (Better Listing) */}
          <Card className="col-span-1 lg:col-span-1 border bg-card shadow-sm flex flex-col">
              <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                      <Server className="w-5 h-5 text-primary" />
                      Platform Services
                  </CardTitle>
                  <CardDescription>Core component status</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-center gap-3">
                    <ServiceStatusItem 
                        icon={Database} 
                        name="Helper DB (SQLite)" 
                        detail={`${metrics.db_size_mb.toFixed(2)} MB Storage`}
                        status="healthy" 
                    />
                    <ServiceStatusItem 
                        icon={Network} 
                        name="API Gateway" 
                        detail={`Uptime: ${(metrics.uptime / 3600).toFixed(1)}h`}
                        status="healthy" 
                    />
                    <ServiceStatusItem 
                        icon={Cpu} 
                        name="Process Manager" 
                        detail={`${metrics.process_count} Active Threads`}
                        status="healthy" 
                    />
              </CardContent>
          </Card>
          {/* 3. Disk Usage (Pie Chart) */}
          <Card className="col-span-1 lg:col-span-2 border bg-card shadow-sm">
              <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                      <HardDrive className="w-5 h-5 text-primary" />
                      Storage Distribution
                  </CardTitle>
                  <CardDescription>{metrics.disk_used.toFixed(1)}GB Used of {metrics.disk_total.toFixed(0)}GB Total</CardDescription>
              </CardHeader>
              <CardContent className="h-[250px] relative">
                   <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={diskData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            > 
                                <Cell key="used" fill={COLORS.chart2} />
                                <Cell key="free" fill={COLORS.chart1} opacity={0.3} />
                            </Pie>
                            <Tooltip 
                                formatter={(value: number) => [`${value} GB`, 'Size']}
                                contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                            />
                            <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                   </ResponsiveContainer>
                   <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                        <span className="text-2xl font-bold">{metrics.disk_percent.toFixed(0)}%</span>
                        <p className="text-[10px] text-muted-foreground">Used</p>
                   </div>
              </CardContent>
          </Card>
          
           {/* 4. Network Traffic (Bar Chart) */}
           <Card className="col-span-1 lg:col-span-2 border bg-card shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base font-semibold">
                        <Network className="w-5 h-5 text-primary" />
                        Network IO
                    </CardTitle>
                    <CardDescription>Total data transfer since boot.</CardDescription>
                </CardHeader>
                <CardContent className="h-[250px]">
                     <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={networkData} layout="vertical" margin={{ left: 20 }}>
                              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.1} />
                              <XAxis type="number" hide />
                              <YAxis dataKey="name" type="category" width={120} tick={{fontSize: 12}} interval={0} axisLine={false} tickLine={false} />
                              <Tooltip 
                                  cursor={{fill: 'transparent'}}
                                  contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                                  formatter={(val: number) => [`${val.toFixed(2)} MB`, "Data"]}
                              />
                              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                                  <Cell key="upload" fill="#3b82f6" /> {/* Upload/Sent blue */}
                                  <Cell key="download" fill="#10b981" /> {/* Download/Recv green */}
                              </Bar>
                          </BarChart>
                     </ResponsiveContainer>
                </CardContent>
           </Card>
      </div>

    </div>
  );
};

export default SystemHealthPage;
