"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
// import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const AnalyticsSkeleton = () => (
    <div className="space-y-6 animate-pulse">
        <div className="flex justify-between items-center">
            <div className="h-8 w-48 bg-gray-200 rounded"></div>
             <div className="h-8 w-24 bg-gray-200 rounded"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
             {[...Array(4)].map((_, i) => (
                 <div key={i} className="h-32 bg-gray-100 rounded-xl border border-gray-200"></div>
             ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <div className="h-[300px] bg-gray-100 rounded-xl border border-gray-200"></div>
             <div className="h-[300px] bg-gray-100 rounded-xl border border-gray-200"></div>
        </div>
    </div>
);


type Lead = {
    id: string;
    first_name: string;
    last_name: string;
    company_name: string;
    country: string;
    status: string;
    created_at: string;
};

type ChartData = {
    name: string;
    value: number;
};

export default function GlobalAnalyticsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalLeads: 0,
    totalOrgs: 0,
    activeOrgs: 0,
    totalRevenue: 0,
    totalUsers: 0,
    avgUsersPerOrg: 0,
  });
  const [countryData, setCountryData] = useState<ChartData[]>([]);
  const [planData, setPlanData] = useState<ChartData[]>([]);
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [supabase] = useState(() => createClient());

  useEffect(() => {
    async function fetchData() {
        setIsLoading(true);
        
        // Parallel fetching
        const [leadsRes, orgsRes] = await Promise.all([
            supabase.from('leads').select('*').order('created_at', { ascending: false }),
            supabase.from('organizations').select('plan, status, users_count')
        ]);

        if (leadsRes.error || orgsRes.error) {
            console.error("Error fetching analytics", leadsRes.error, orgsRes.error);

            setIsLoading(false);
            return;
        }

        const leads = leadsRes.data || [];
        const orgs = orgsRes.data || [];
        
        // Ensure properties exist before calculations to avoid NaN
        const activeOrgs = orgs.filter(o => o.status === 'active');
        const activeOrgsCount = activeOrgs.length;
        
        const totalUsers = orgs.reduce((acc, curr) => acc + (curr.users_count || 0), 0);
        const avgUsersPerOrg = activeOrgsCount > 0 ? Math.round(totalUsers / activeOrgsCount) : 0;

        // Mock revenue calculation based on plans
        const revenue = orgs.reduce((acc, curr) => {
            if (curr.plan === 'enterprise') return acc + 5000;
            if (curr.plan === 'growth') return acc + 1000;
            return acc + 100; // starter
        }, 0);

        setMetrics({
            totalLeads: leads.length,
            totalOrgs: orgs.length,
            activeOrgs: activeOrgsCount,
            totalRevenue: revenue,
            totalUsers,
            avgUsersPerOrg
        });

        // Country Distribution for BarChart
        const countryMap = new Map();
        leads.forEach(l => {
            const c = l.country || 'Unknown';
            countryMap.set(c, (countryMap.get(c) || 0) + 1);
        });
        const countryChartData = Array.from(countryMap.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5); // Top 5
        setCountryData(countryChartData);

        // Plan Distribution for PieChart
        const planMap = new Map();
        orgs.forEach(o => {
            const p = o.plan || 'Unknown';
            planMap.set(p, (planMap.get(p) || 0) + 1);
        });
        const planChartData = Array.from(planMap.entries())
            .map(([name, value]) => ({ name, value }));
        setPlanData(planChartData);

        setRecentLeads(leads.slice(0, 5));
        setIsLoading(false);
    }
    fetchData();
  }, [supabase]);

  if (isLoading) return <AnalyticsSkeleton />;

  return (
    <div className="h-full overflow-y-auto p-1 space-y-8 pb-20">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Global Analytics</h2>
        <p className="text-gray-500">Overview of platform performance and growth metrics</p>
      </div>

      {/* Key Metrics - no backgrounds/borders, centered */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-6 rounded-lg border border-gray-100 shadow-sm">
        <div className="p-4 text-center border-r last:border-0 border-gray-100">
          {/* <FileKey className="w-6 h-6 mx-auto mb-3 text-blue-500" /> */}
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1 font-semibold">Total Leads</p>
          <p className="text-3xl font-bold text-gray-900">{metrics.totalLeads}</p>
        </div>
        <div className="p-4 text-center border-r last:border-0 border-gray-100">
          {/* <Globe className="w-6 h-6 mx-auto mb-3 text-green-500" /> */}
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1 font-semibold">Active Organizations</p>
          <p className="text-3xl font-bold text-gray-900">{metrics.activeOrgs}</p>
        </div>

        <div className="p-4 text-center border-r last:border-0 border-gray-100">
          {/* <Users className="w-6 h-6 mx-auto mb-3 text-purple-500" /> */}
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1 font-semibold">Total Users</p>
          <p className="text-3xl font-bold text-gray-900">{metrics.totalUsers.toLocaleString()}</p>
        </div>
        <div className="p-4 text-center">
          {/* <TrendingUp className="w-6 h-6 mx-auto mb-3 text-yellow-500" /> */}
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1 font-semibold">Avg Users / Org</p>
          <p className="text-3xl font-bold text-gray-900">{metrics.avgUsersPerOrg}</p>
          {/* <p className="text-xs text-gray-400 mt-1">Trial → Paying</p> */}
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm border-gray-200">
            <CardHeader>
                <CardTitle>Leads by Country</CardTitle>
                <CardDescription>Top regions generating interest</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={countryData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                        <Tooltip cursor={{fill: 'transparent'}} />
                        <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-200">
            <CardHeader>
                <CardTitle>Plan Distribution</CardTitle>
                <CardDescription>Breakdown of organization tiers</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={planData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {planData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 text-sm text-gray-500 mt-2">
                    {planData.map((entry, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                            <span className="capitalize">{entry.name}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
      </div>

        {/* Recent Activity Table using Renewals Style */}
      <Card className="shadow-sm border-gray-200">
          <CardHeader>
              <CardTitle>Recent Leads</CardTitle>
              <CardDescription>Latest inquiries received</CardDescription>
          </CardHeader>
          <CardContent>
               <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Company</TableHead>
                          <TableHead>Country</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Date</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {recentLeads.map((lead) => (
                          <TableRow key={lead.id}>
                              <TableCell className="font-medium text-gray-900">{lead.first_name} {lead.last_name}</TableCell>
                              <TableCell>{lead.company_name}</TableCell>
                              <TableCell>{lead.country || 'N/A'}</TableCell>
                              <TableCell>
                                  <Badge variant={lead.status === 'new' ? 'default' : 'secondary'} className="capitalize border-none shadow-none font-normal">
                                      {lead.status}
                                  </Badge>
                              </TableCell>
                              <TableCell className="text-right text-gray-500 text-sm">
                                  {new Date(lead.created_at).toLocaleDateString()}
                              </TableCell>
                          </TableRow>
                      ))}
                  </TableBody>
              </Table>
          </CardContent>
      </Card>
    </div>
  );
}
