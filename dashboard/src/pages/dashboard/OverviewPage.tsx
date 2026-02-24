import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Activity, 
  Clock, 
  CheckCircle, 
  Brain,
  Server,
  Cpu
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, CartesianGrid, Legend, AreaChart, Area, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import StatusIndicator from "@/components/StatusIndicator";

// Glass Card Component
const GlassCard = ({ children, className, onClick }: { children: React.ReactNode; className?: string, onClick?: () => void }) => (
  <Card 
    className={cn(
      "glass border-border/50 bg-card/50 transition-all hover:bg-muted/10", 
      onClick && "cursor-pointer hover:border-primary/50",
      className
    )}
    onClick={onClick}
  >
    {children}
  </Card>
);

interface APIKey {
    id: number;
    name: string;
    is_active: boolean;
    expires_at: string | null;
}

interface Model {
    id: string; // name
    size: string;
    details?: any;
    status?: string;
}

interface SystemMetrics {
    cpu_usage: number;
    ram_usage: number;
    ram_total: number;
    ram_used: number;
    os: string;
    uptime: number;
    ollama_status: boolean;
    loaded_model: string | null;
}

interface OverviewStats {
    total_tokens: number;
    avg_latency: number;
    error_rate: number;
    total_requests: number;
}


const OverviewPage = () => {
  const navigate = useNavigate();
  const [keys, setKeys] = useState<APIKey[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  
  // Stats
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [activityData, setActivityData] = useState<any[]>([]);
  const [topKeysData, setTopKeysData] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
        try {
            const token = localStorage.getItem("fortress_token");
            const headers = { Authorization: `Bearer ${token}` };

            const [keysRes, modelsRes, metricsRes, statsRes, activityRes, topKeysRes] = await Promise.all([
                fetch("http://localhost:8000/api/apikeys", { headers }).catch(() => null),
                fetch("http://localhost:8000/api/models", { headers }).catch(() => null),
                fetch("http://localhost:8000/api/system/metrics", { headers }).catch(() => null),
                fetch("http://localhost:8000/api/stats/overview", { headers }).catch(() => null),
                fetch("http://localhost:8000/api/stats/activity", { headers }).catch(() => null),
                fetch("http://localhost:8000/api/stats/top-keys", { headers }).catch(() => null)
            ]);

            if (keysRes?.ok) {
                setKeys(await keysRes.json());
            }
            if (modelsRes?.ok) {
                const data = await modelsRes.json();
                const allModels = Array.isArray(data) ? data : data.models || [];
                setModels(allModels.filter((m: any) => m.status === 'installed'));
            }
            if (metricsRes?.ok) {
                setMetrics(await metricsRes.json());
            }
            if (statsRes?.ok) {
                setStats(await statsRes.json());
            }
            if (activityRes?.ok) {
                setActivityData(await activityRes.json());
            }
            if (topKeysRes?.ok) {
                setTopKeysData(await topKeysRes.json());
            }

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };
    fetchData();

    // Poll metrics every 5s
    const interval = setInterval(() => {
         fetch("http://localhost:8000/api/system/metrics")
            .then(r => r.ok && r.json().then(setMetrics))
            .catch(e => console.error(e));
         
         // Also refresh stats occasionally
         fetch("http://localhost:8000/api/stats/overview")
            .then(r => r.ok && r.json().then(setStats))
            .catch(e => console.error(e));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const activeKeysCount = keys.filter(k => k.is_active && (!k.expires_at || new Date(k.expires_at) > new Date())).length;
  const revokedKeysCount = keys.length - activeKeysCount;
  const hasKeys = keys.length > 0;
  
  const keyDistribution = hasKeys ? [
    { name: "Active", value: activeKeysCount, color: "hsl(var(--primary))" },
    { name: "Revoked", value: revokedKeysCount, color: "hsl(var(--muted-foreground))" },
  ] : [{ name: "No Keys", value: 1, color: "hsl(var(--muted))" }];

  const topKeys = [...keys].sort((a, b) => b.id - a.id).slice(0, 5);

  if (loading) {
    return (
      <div className="space-y-6 pt-4 animate-in fade-in duration-500">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
           <Skeleton className="col-span-4 h-[400px]" />
           <Skeleton className="col-span-3 h-[400px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-4 animate-in fade-in duration-500 pb-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
            <div>
                <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Overview</h2>
                <p className="text-muted-foreground mt-1">Real-time system insights and performance metrics.</p>
            </div>
            <div className="flex items-center gap-2">
                <StatusIndicator 
                    label="AI System" 
                    status={metrics?.ollama_status ? "healthy" : "critical"} 
                    value={metrics?.ollama_status ? "Online" : "Issues"}
                />
                <Button onClick={() => navigate("/monitoring")} size="sm" variant="outline" className="hidden md:flex gap-2">
                    <Activity className="h-4 w-4" />
                    Monitoring
                </Button>
            </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <GlassCard onClick={() => navigate("/monitoring")}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats?.total_requests?.toLocaleString() || 0}</div>
                    <p className="text-xs text-muted-foreground">+20.1% from last month</p>
                </CardContent>
            </GlassCard>
            
            <GlassCard onClick={() => navigate("/monitoring")}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats?.avg_latency ? stats.avg_latency.toFixed(0) : 0}ms</div>
                    <p className="text-xs text-muted-foreground">Response time</p>
                </CardContent>
            </GlassCard>
            
            <GlassCard onClick={() => navigate("/monitoring")}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats ? (100 - (stats.error_rate * 100)).toFixed(1) : 100}%</div>
                    <p className="text-xs text-muted-foreground">Successful requests</p>
                </CardContent>
            </GlassCard>

            <GlassCard onClick={() => navigate("/model-hub")}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Models</CardTitle>
                    <Brain className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{models.length}</div>
                    <p className="text-xs text-muted-foreground">Installed & Ready</p>
                </CardContent>
            </GlassCard>
        </div>

        {/* Charts Section */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 h-[350px]">
            <GlassCard className="col-span-4 flex flex-col">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Request Activity</CardTitle>
                    <CardDescription>
                        Traffic volume over the last 24 hours.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 w-full min-h-0 pl-0 pb-2">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={activityData}>
                            <defs>
                                <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <XAxis 
                                dataKey="hour" 
                                stroke="hsl(var(--muted-foreground))" 
                                fontSize={10} 
                                tickLine={false} 
                                axisLine={false}
                                dy={10}
                            />
                            <YAxis 
                                stroke="hsl(var(--muted-foreground))" 
                                fontSize={10} 
                                tickLine={false} 
                                axisLine={false}
                                tickFormatter={(value) => `${value}`}
                                width={30}
                            />
                            <Tooltip
                                contentStyle={{ 
                                    backgroundColor: "hsl(var(--card))", 
                                    borderColor: "hsl(var(--border))",
                                    borderRadius: "8px"
                                }}
                                itemStyle={{ color: "hsl(var(--foreground))", fontSize: "12px" }}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="count" 
                                stroke="hsl(var(--primary))" 
                                strokeWidth={2}
                                fillOpacity={1} 
                                fill="url(#colorRequests)" 
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </GlassCard>

            <GlassCard className="col-span-3 flex flex-col" onClick={() => navigate('/system-health')}>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">System Resources</CardTitle>
                    <CardDescription>
                        Real-time CPU and Memory usage.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-center space-y-6">
                     <div className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                    <Cpu className="h-4 w-4 text-primary" />
                                    <span>CPU Usage</span>
                                </div>
                                <span className="font-bold">{metrics?.cpu_usage?.toFixed(1) || 0}%</span>
                            </div>
                            <div className="h-2 w-full bg-secondary/50 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-primary transition-all duration-500" 
                                    style={{ width: `${metrics?.cpu_usage || 0}%` }}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                    <Server className="h-4 w-4 text-primary" />
                                    <span>Memory Usage</span>
                                </div>
                                <span className="font-bold">{metrics?.ram_usage?.toFixed(1) || 0}%</span>
                            </div>
                            <div className="h-2 w-full bg-secondary/50 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-primary transition-all duration-500" 
                                    style={{ width: `${metrics?.ram_usage || 0}%` }}
                                />
                            </div>
                            <p className="text-[10px] text-muted-foreground text-right mt-1">
                                {metrics?.ram_used?.toFixed(1)} GB / {metrics?.ram_total?.toFixed(1)} GB
                            </p>
                        </div>
                     </div>

                    <div className="pt-4 border-t border-border/50">
                        {metrics?.loaded_model ? (
                            <div className="flex items-center justify-between p-2.5 rounded-lg bg-primary/10 border border-primary/20">
                                <div className="flex items-center gap-2 truncate">
                                    <Brain className="h-3.5 w-3.5 text-primary" />
                                    <span className="text-xs font-medium truncate max-w-[120px]">{metrics.loaded_model}</span>
                                </div>
                                <Badge variant="default" className="text-[9px] h-5 bg-primary/80 hover:bg-primary/80">Active</Badge>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border/50">
                                <span className="text-xs text-muted-foreground">No model loaded</span>
                                <Badge variant="secondary" className="text-[9px] h-5">Idle</Badge>
                            </div>
                        )}
                    </div>
                </CardContent>
            </GlassCard>
        </div>

        {/* API Keys & Models Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 h-[300px]">
             <GlassCard className="lg:col-span-2 flex flex-col" onClick={() => navigate('/apikeys')}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div>
                        <CardTitle className="text-sm font-medium">Recent API Usage</CardTitle>
                        <CardDescription>Top keys by request volume.</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={(e) => { e.stopPropagation(); navigate('/apikeys'); }}>View All</Button>
                </CardHeader>
                <CardContent className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={topKeysData.length > 0 ? topKeysData : [{key_name: 'No Data', count: 0}]} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" opacity={0.4} />
                            <XAxis type="number" hide />
                            <YAxis 
                                dataKey="key_name" 
                                type="category" 
                                width={90} 
                                tick={{fontSize: 10, fill: "hsl(var(--muted-foreground))"}} 
                                interval={0}
                            />
                            <Tooltip 
                                cursor={{fill: 'hsl(var(--muted)/0.2)'}}
                                contentStyle={{ 
                                    backgroundColor: "hsl(var(--card))", 
                                    borderColor: "hsl(var(--border))",
                                    borderRadius: "8px"
                                }}
                                itemStyle={{ fontSize: "12px" }}
                            />
                            <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={16}>
                                {topKeysData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "hsl(var(--primary))" : "hsl(var(--primary)/0.7)"} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
             </GlassCard>

             <GlassCard className="flex flex-col" onClick={() => navigate('/apikeys')}>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Key Distribution</CardTitle>
                    <CardDescription>Active vs Revoked keys.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex justify-center items-center pb-2">
                    <div className="h-full w-full">
                         <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={keyDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={70}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {keyDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: "hsl(var(--card))", 
                                        borderColor: "hsl(var(--border))",
                                        borderRadius: "8px"
                                    }}
                                    itemStyle={{ color: "hsl(var(--foreground))", fontSize: "12px" }}
                                />
                                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: "11px" }}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
             </GlassCard>
        </div>
    </div>
  );
};

export default OverviewPage;
