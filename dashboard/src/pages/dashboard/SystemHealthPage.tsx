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
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          
          {/* 1. CPU & RAM History (Line Chart) */}
          <Card className="col-span-1 lg:col-span-2 glass border-primary/10">
              <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                      <Activity className="w-4 h-4 text-primary" />
                      System Load (CPU & RAM)
                  </CardTitle>
                  <CardDescription>Real-time resource utilization over the last minute.</CardDescription>
              </CardHeader>
              <CardContent className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={history}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                          <XAxis dataKey="time" hide />
                          <YAxis domain={[0, 100]} fontSize={10} tickFormatter={v => `${v}%`} axisLine={false} tickLine={false} />
                          <Tooltip 
                              contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                              itemStyle={{ fontSize: '12px' }}
                          />
                          <Legend verticalAlign="top" height={36}/>
                          <Line type="monotone" dataKey="cpu" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="CPU Usage" animationDuration={500} />
                          <Line type="monotone" dataKey="ram" stroke="#a855f7" strokeWidth={2} dot={false} name="RAM Usage" animationDuration={500} />
                      </LineChart>
                  </ResponsiveContainer>
              </CardContent>
          </Card>

          {/* 2. Disk Usage (Pie Chart) */}
          <Card className="glass border-primary/10">
              <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                      <HardDrive className="w-4 h-4 text-primary" />
                      Storage Distribution
                  </CardTitle>
                  <CardDescription>{metrics.disk_used}GB Used of {metrics.disk_total}GB Total</CardDescription>
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
                                <Cell key="used" fill="hsl(var(--primary))" />
                                <Cell key="free" fill="hsl(var(--muted))" opacity={0.3} />
                            </Pie>
                            <Tooltip 
                                formatter={(value: number) => [`${value} GB`, 'Size']}
                                contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                            />
                            <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                   </ResponsiveContainer>
                   <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                        <span className="text-2xl font-bold">{metrics.disk_percent}%</span>
                        <p className="text-[10px] text-muted-foreground">Used</p>
                   </div>
              </CardContent>
          </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
           {/* 3. Service Status List */}
           <Card className="col-span-1 glass border-primary/10 h-full">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Server className="w-4 h-4 text-primary" />
                        Platform Services
                    </CardTitle>
                    <CardDescription>Operational status of core components.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <ServiceStatusItem 
                        icon={Database} 
                        name="Helper DB (SQLite)" 
                        detail={`${metrics.db_size_mb} MB Storage`} 
                        status="healthy" 
                    />
                    <ServiceStatusItem 
                        icon={Activity} 
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

           {/* 4. Network Traffic (Bar Chart) */}
           <Card className="col-span-1 lg:col-span-2 glass border-primary/10">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Network className="w-4 h-4 text-primary" />
                        Network IO
                    </CardTitle>
                    <CardDescription>Total data transfer since boot.</CardDescription>
                </CardHeader>
                <CardContent className="h-[250px]">
                     <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={networkData} layout="vertical" margin={{ left: 20 }}>
                              <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.1} />
                              <XAxis type="number" hide />
                              <YAxis dataKey="name" type="category" width={120} tick={{fontSize: 12}} interval={0} axisLine={false} tickLine={false} />
                              <Tooltip 
                                  cursor={{fill: 'transparent'}}
                                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                              />
                              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={30}>
                                  <Cell fill="#3b82f6" /> {/* Upload/Sent blue */}
                                  <Cell fill="#10b981" /> {/* Download/Recv green */}
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
