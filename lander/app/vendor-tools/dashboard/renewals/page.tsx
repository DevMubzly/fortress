"use client";

import { useState } from "react";
import { Bell, Calendar, BadgeAlert, CheckCircle2, AlertTriangle, ArrowUpRight } from "lucide-react";
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

interface Renewal {
  id: string;
  customer: string;
  plan: string;
  expiryDate: string;
  daysRemaining: number;
  value: string;
  status: 'critical' | 'warning' | 'healthy' | 'renewed';
  autoRenew: boolean;
}

const mockRenewals: Renewal[] = [
  { id: '1', customer: 'Stark Industries', plan: 'Enterprise', expiryDate: '2024-03-20', daysRemaining: 5, value: '$120,000', status: 'critical', autoRenew: true },
  { id: '2', customer: 'Wayne Enterprises', plan: 'Enterprise', expiryDate: '2024-04-05', daysRemaining: 21, value: '$95,000', status: 'warning', autoRenew: false },
  { id: '3', customer: 'Cyberdyne Systems', plan: 'Growth', expiryDate: '2024-05-12', daysRemaining: 58, value: '$24,000', status: 'healthy', autoRenew: true },
  { id: '4', customer: 'Tyrell Corp', plan: 'Enterprise', expiryDate: '2024-03-18', daysRemaining: 3, value: '$150,000', status: 'critical', autoRenew: false },
  { id: '5', customer: 'Oscorp', plan: 'Growth', expiryDate: '2024-04-15', daysRemaining: 31, value: '$30,000', status: 'warning', autoRenew: true },
];

export default function RenewalAlertsPage() {
  const { toast } = useToast();
  const [renewals, setRenewals] = useState<Renewal[]>(mockRenewals);

  const handleSendReminder = (id: string, customer: string) => {
    toast({
      title: "Reminder Sent",
      description: `Renewal notice sent to ${customer}.`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Renewal Alerts</h2>
          <p className="text-gray-500">Upcoming contract expirations and subscription renewals</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-red-50 border-red-100 shadow-sm">
          <CardContent className="p-4 flex flex-col gap-1">
             <span className="text-sm font-medium text-red-600 flex items-center gap-2">
                <BadgeAlert className="w-4 h-4" /> Critical ({"<"} 7 days)
             </span>
             <span className="text-2xl font-bold text-red-900">
                {renewals.filter(r => r.status === 'critical').length}
             </span>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50 border-yellow-100 shadow-sm">
          <CardContent className="p-4 flex flex-col gap-1">
             <span className="text-sm font-medium text-yellow-600 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Warning ({"<"} 30 days)
             </span>
             <span className="text-2xl font-bold text-yellow-900">
                {renewals.filter(r => r.status === 'warning').length}
             </span>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200 shadow-sm">
             <CardContent className="p-4 flex flex-col gap-1">
                 <span className="text-sm font-medium text-gray-600">Total Value risk</span>
                 <span className="text-2xl font-bold text-gray-900">$215,000</span>
             </CardContent>
        </Card>
        <Card className="bg-white border-gray-200 shadow-sm">
             <CardContent className="p-4 flex flex-col gap-1">
                 <span className="text-sm font-medium text-gray-600">Auto-Renew Eligible</span>
                 <span className="text-2xl font-bold text-gray-900">60%</span>
             </CardContent>
        </Card>
      </div>

      <Card className="border-gray-200 shadow-sm">
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
              {renewals.map((renewal) => (
                <TableRow key={renewal.id}>
                  <TableCell className="font-medium text-gray-900">{renewal.customer}</TableCell>
                  <TableCell>
                     <Badge variant="outline" className="font-normal text-gray-600">{renewal.plan}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                        <span className="text-sm text-gray-900">{renewal.expiryDate}</span>
                        <span className="text-xs text-gray-500">{renewal.daysRemaining} days left</span>
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
                                 <CheckCircle2 className="w-3 h-3" /> Auto
                             </span>
                         )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => handleSendReminder(renewal.id, renewal.customer)}>
                        Send Reminder <ArrowUpRight className="w-3 h-3 ml-1" />
                    </Button>
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
