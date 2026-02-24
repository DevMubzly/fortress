"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";

interface Renewal {
  id: string;
  customer: string;
  plan: string;
  expiryDate: string;
  daysRemaining: number;
  value: string;
  numericValue: number;
  status: 'critical' | 'warning' | 'healthy' | 'renewed';
  autoRenew: boolean;
}

export default function RenewalAlertsPage() {
  const { toast } = useToast();
  const [renewals, setRenewals] = useState<Renewal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [supabase] = useState(() => createClient());

  const fetchRenewals = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .not('renewal_date', 'is', null)
      .order('renewal_date', { ascending: true });

    // Handle null data or error safely
    if (error) {
      console.error("Supabase Error:", error);
      toast({
        title: "Error fetching renewals",
        description: error.message || "Unknown database error",
        variant: "destructive",
      });
      setIsLoading(false);
      return; 
    }
    
    if (data) {
        const mappedRenewals: Renewal[] = data.map((org: { id: string; name: string; plan: string; renewal_date: string }) => {
            const expiryDate = new Date(org.renewal_date);
            const today = new Date();
            const diffTime = expiryDate.getTime() - today.getTime();
            const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            let status: Renewal['status'] = 'healthy';
            if (daysRemaining < 30) status = 'critical';
            else if (daysRemaining < 90) status = 'warning';

            // Mocking value based on plan, using number for sum calculation
            let numericValue = 0;
            if (org.plan === 'enterprise') numericValue = 120000;
            else if (org.plan === 'growth') numericValue = 48000;
            else if (org.plan === 'starter') numericValue = 24000;

            return {
                id: org.id,
                customer: org.name,
                plan: org.plan,
                expiryDate: expiryDate.toLocaleDateString(),
                daysRemaining,
                value: `$${numericValue.toLocaleString()}`,
                numericValue,
                status,
                autoRenew: Math.random() > 0.5 // Mock auto-renew status
            };
        });
        setRenewals(mappedRenewals);
    }
    setIsLoading(false);
  }, [supabase, toast]);

  useEffect(() => {
    // Avoid direct call if possible, or wrap
    const init = async () => {
        await fetchRenewals();
    };
    init();
  }, [fetchRenewals]);

  const handleSendReminder = (id: string, customer: string) => {
    // In a real app, this would trigger an email via backend
    toast({
      title: "Reminder Sent",
      description: `Renewal notice sent to ${customer}.`,
    });
  };

  const criticalCount = renewals.filter(r => r.status === 'critical').length;
  const warningCount = renewals.filter(r => r.status === 'warning').length;
  // Calculate total value at risk (sum of numeric values for critical/warning)
  const totalValueRisk = renewals
    .filter(r => r.status === 'critical' || r.status === 'warning')
    .reduce((acc, curr) => acc + curr.numericValue, 0);

  // Calculate auto-renew percentage
  const autoRenewCount = renewals.filter(r => r.autoRenew).length;
  const autoRenewPercentage = renewals.length > 0 ? Math.round((autoRenewCount / renewals.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Renewal Alerts</h2>
          <p className="text-gray-500">Upcoming contract expirations and subscription renewals</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchRenewals}>
            Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-6 rounded-lg border-none  ">
        <div className="p-4 text-center border-r last:border-0 ">
             <p className="text-xs text-red-500 uppercase tracking-wide mb-1 font-semibold">Critical ({"<"} 30 days)</p>
             <div className="text-3xl font-bold text-gray-900">
                {isLoading ? <Skeleton className="h-8 w-8 mx-auto" /> : criticalCount}
             </div>
        </div>
        <div className="p-4 text-center border-r last:border-0 ">
             <p className="text-xs text-yellow-500 uppercase tracking-wide mb-1 font-semibold">Warning ({"<"} 90 days)</p>
             <div className="text-3xl font-bold text-gray-900">
                {isLoading ? <Skeleton className="h-8 w-8 mx-auto" /> : warningCount}
             </div>
        </div>
        <div className="p-4 text-center border-r last:border-0 ">
             <p className="text-xs text-gray-500 uppercase tracking-wide mb-1 font-semibold">Total Value Risk</p>
             <div className="text-3xl font-bold text-gray-900">
                {isLoading ? <Skeleton className="h-8 w-24 mx-auto" /> : `$${(totalValueRisk / 1000).toFixed(0)}k`}
             </div>
        </div>
        <div className="p-4 text-center">
             <p className="text-xs text-gray-500 uppercase tracking-wide mb-1 font-semibold">Auto-Renew Eligible</p>
             <div className="text-3xl font-bold text-gray-900">
                {isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : `${autoRenewPercentage}%`}
             </div>
        </div>
      </div>

      <Card className=" ">
        <CardHeader>
          <CardTitle>Upcoming Expirations</CardTitle>
          <CardDescription>Prioritize outreach for high-value accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Current Plan</TableHead>
                <TableHead>Expiration</TableHead>
                <TableHead>Contract Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                    </TableRow>
                  ))
              ) : renewals.length > 0 ? (
                renewals.map((renewal) => (
                <TableRow key={renewal.id}>
                  <TableCell className="font-medium text-gray-900">{renewal.customer}</TableCell>
                  <TableCell>
                     <Badge variant="outline" className="font-normal text-gray-600 capitalize">{renewal.plan}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                        <span className="text-sm text-gray-900">{renewal.expiryDate}</span>
                        <span className={`text-xs ${renewal.daysRemaining < 0 ? 'text-red-500 font-bold' : 'text-gray-500'}`}>
                            {renewal.daysRemaining < 0 ? `${Math.abs(renewal.daysRemaining)} days overdue` : `${renewal.daysRemaining} days left`}
                        </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-gray-700">{renewal.value}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                         {renewal.status === 'critical' ? (
                             <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200">Critical</Badge>
                         ) : renewal.status === 'warning' ? (
                             <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Attention</Badge>
                         ) : (
                             <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Healthy</Badge>
                         )}
                         {renewal.autoRenew && (
                             <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded flex items-center gap-1">
                                 Auto
                             </span>
                         )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => handleSendReminder(renewal.id, renewal.customer)}>
                        Send Reminder
                    </Button>
                  </TableCell>
                </TableRow>
              ))
              ) : (
                  <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500 py-6">
                          No upcoming renewals found.
                      </TableCell>
                  </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
