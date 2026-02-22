"use client";

import { useState } from "react";
import { 
  Building2, 
  MapPin, 
  MoreHorizontal, 
  Search, 
  ShieldCheck, 
  ShieldAlert, 
  Globe 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Organization {
  id: string;
  name: string;
  domain: string;
  plan: 'free' | 'starter' | 'enterprise';
  status: 'active' | 'suspended' | 'pending';
  users: number;
  region: string;
  lastActive: string;
}

const mockOrgs: Organization[] = [
  { id: '1', name: 'Acme Corp', domain: 'acme.com', plan: 'enterprise', status: 'active', users: 120, region: 'NA', lastActive: '2h ago' },
  { id: '2', name: 'Globex Inc', domain: 'globex.net', plan: 'starter', status: 'active', users: 45, region: 'EU', lastActive: '1d ago' },
  { id: '3', name: 'Soylent Corp', domain: 'soylent.co', plan: 'free', status: 'pending', users: 5, region: 'APAC', lastActive: '5d ago' },
  { id: '4', name: 'Initech', domain: 'initech.com', plan: 'starter', status: 'suspended', users: 12, region: 'NA', lastActive: '2w ago' },
  { id: '5', name: 'Umbrella Corp', domain: 'umbrella.com', plan: 'enterprise', status: 'active', users: 850, region: 'EU', lastActive: '10m ago' },
  { id: '6', name: 'Massive Dynamic', domain: 'massivedynamic.com', plan: 'enterprise', status: 'active', users: 320, region: 'NA', lastActive: '4h ago' },
  { id: '7', name: 'Hooli', domain: 'hooli.xyz', plan: 'starter', status: 'active', users: 80, region: 'NA', lastActive: '1h ago' },
];

export default function OrganizationsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [organizations, setOrganizations] = useState<Organization[]>(mockOrgs);

  const filteredOrgs = organizations.filter(org => 
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    org.domain.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Organizations</h2>
          <p className="text-gray-500">Manage client organizations and access</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Building2 className="w-4 h-4 mr-2" />
          Add Organization
        </Button>
      </div>

      <div className="flex items-center space-x-2 bg-white p-2 rounded-md border border-gray-200 shadow-sm max-w-sm">
        <Search className="w-4 h-4 text-gray-400 ml-2" />
        <Input 
          placeholder="Search organizations..." 
          className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="rounded-md border border-gray-200 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="w-[300px]">Organization</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Region</TableHead>
              <TableHead className="text-right">Users</TableHead>
              <TableHead className="text-right">Last Active</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrgs.map((org) => (
              <TableRow key={org.id} className="hover:bg-gray-50/50">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 border border-gray-100">
                        <AvatarImage src={`https://avatar.vercel.sh/${org.domain}`} />
                        <AvatarFallback>{org.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900">{org.name}</span>
                      <span className="text-xs text-gray-500">{org.domain}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                    org.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' :
                    org.status === 'suspended' ? 'bg-red-50 text-red-700 border-red-200' :
                    'bg-yellow-50 text-yellow-700 border-yellow-200'
                  }`}>
                    {org.status === 'active' ? <ShieldCheck className="w-3 h-3 mr-1" /> : <ShieldAlert className="w-3 h-3 mr-1" />}
                    <span className="capitalize">{org.status}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={`capitalize ${
                    org.plan === 'enterprise' ? 'bg-purple-50 text-purple-700 border-purple-200' : 
                    org.plan === 'starter' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                    'bg-gray-50 text-gray-600 border-gray-200'
                  }`}>
                    {org.plan}
                  </Badge>
                </TableCell>
                <TableCell>
                    <div className="flex items-center gap-1 text-gray-600">
                        <Globe className="w-3.5 h-3.5 text-gray-400" />
                        {org.region}
                    </div>
                </TableCell>
                <TableCell className="text-right font-medium text-gray-700">{org.users}</TableCell>
                <TableCell className="text-right text-gray-500 text-sm">{org.lastActive}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0 text-gray-400 hover:text-gray-900">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem>View details</DropdownMenuItem>
                      <DropdownMenuItem>Manage users</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600 focus:text-red-700 focus:bg-red-50">Suspend account</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
