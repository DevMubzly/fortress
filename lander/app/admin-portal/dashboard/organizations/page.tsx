"use client";

import { useEffect, useState, useCallback } from "react";
import { 
  MoreHorizontal, 
  Search, 
  ShieldCheck, 
  ShieldAlert, 
  Globe,
  RefreshCw,
  Plus,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface Organization {
  id: string;
  name: string;
  plan: string;
  status: string;
  users_count: number;
  region: string | null;
  renewal_date: string | null;
  created_at: string;
  contract_value?: number;
  contract_start_date?: string;
  contract_end_date?: string;
  internal_notes?: string;
  lead_id?: string;
}

interface Lead {
    id: string;
    first_name: string;
    last_name: string;
    company_name: string;
    work_email: string;
}

export default function OrganizationsPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [availableLeads, setAvailableLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);

  const [newOrg, setNewOrg] = useState({
    leadId: "",
    name: "",
    plan: "standard",
    region: "us-east",
    contractValue: "",
    startDate: "",
    endDate: "",
    notes: ""
  });
  
  const [supabase] = useState(() => createClient());

  const fetchLeads = useCallback(async () => {
    // Fetch leads that are converted or have been added already?
    // Actually simpler: Fetch all leads, filter client-side against existing orgs for now is okay for small scale
    // Or better: fetch leads where status != 'customer' (if used)
    const { data: leads, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });
    
    if (!error && leads) {
        // Filter out leads that are already linked to an organization
        // We need existing orgs lead_ids first.
        // This is done in effect after orgs are loaded
        setAvailableLeads(leads as Lead[]);
    }
  }, [supabase]);

  const fetchOrganizations = useCallback(async () => {
    // setIsLoading(true); // Initial load handles this, or check if already loading?
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error("Error fetching organizations:", error);
      toast({
        title: "Error fetching organizations",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setOrganizations(data as Organization[]);
    }
    setIsLoading(false);
  }, [supabase, toast]);

  useEffect(() => {
    fetchOrganizations();
    fetchLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Compute leads that are not yet added as orgs
  const unlinkedLeads = availableLeads.filter(l => 
    !organizations.some(o => o.lead_id === l.id)
  );

  const handleLeadSelect = (leadId: string) => {
      const lead = unlinkedLeads.find(l => l.id === leadId);
      if (lead) {
          setNewOrg({
              ...newOrg,
              leadId: leadId,
              name: lead.company_name || `${lead.first_name} ${lead.last_name}'s Org`,
              // Preset dates?
              startDate: new Date().toISOString().split('T')[0],
              // endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
              endDate: '' // To make it pure, we initialize empty and user sets it, or compute in effect.
          });
      }
  };

  const createOrganization = async () => {
    if (!newOrg.name) return;

    const { error } = await supabase.from('organizations').insert([{
        name: newOrg.name,
        plan: newOrg.plan,
        region: newOrg.region,
        status: 'active',
        users_count: 1, 
        lead_id: newOrg.leadId || null,
        contract_value: newOrg.contractValue ? parseFloat(newOrg.contractValue) : 0,
        contract_start_date: newOrg.startDate || null,
        contract_end_date: newOrg.endDate || null,
        renewal_date: newOrg.endDate ? new Date(newOrg.endDate).toISOString() : null, // Sync renewal date
        internal_notes: newOrg.notes
    }]);

    if (error) {
        toast({ title: "Error creating organization", description: error.message, variant: "destructive" });
    } else {
        toast({ title: "Organization created", description: `${newOrg.name} has been added.` });
        setIsAddDialogOpen(false);
        setNewOrg({ 
            leadId: "", name: "", plan: "standard", region: "us-east", 
            contractValue: "", startDate: "", endDate: "", notes: "" 
        });
        fetchOrganizations();
    }
  };

  const openDetails = (org: Organization) => {
      setSelectedOrg(org);
      setIsDetailOpen(true);
  };

  const filteredOrgs = organizations.filter(org => 
    org.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Organizations</h2>
          <p className="text-gray-500">Manage client organizations and access details</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" onClick={fetchOrganizations}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Organization
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Add New Organization</DialogTitle>
                        <DialogDescription>Convert a lead or create a new organization manually.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2 col-span-2">
                                <Label>Select Lead (Optional)</Label>
                                <Select value={newOrg.leadId} onValueChange={handleLeadSelect}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choose a lead to convert..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {unlinkedLeads.map(lead => (
                                            <SelectItem key={lead.id} value={lead.id}>
                                                {lead.first_name} {lead.last_name} ({lead.company_name || lead.work_email})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="name">Organization Name</Label>
                                <Input id="name" value={newOrg.name} onChange={(e) => setNewOrg({...newOrg, name: e.target.value})} placeholder="Acme Corp" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="plan">Plan Tier</Label>
                                <Select value={newOrg.plan} onValueChange={(val) => setNewOrg({...newOrg, plan: val})}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a plan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="standard">Standard</SelectItem>
                                        <SelectItem value="enterprise">Enterprise</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Contract Value ($)</Label>
                                <Input 
                                    type="number" 
                                    value={newOrg.contractValue} 
                                    onChange={(e) => setNewOrg({...newOrg, contractValue: e.target.value})}
                                    placeholder="5000"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Region</Label>
                                <Select value={newOrg.region} onValueChange={(val) => setNewOrg({...newOrg, region: val})}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select region" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="us-east">US East</SelectItem>
                                        <SelectItem value="eu-west">EU West</SelectItem>
                                        <SelectItem value="apac">Asia Pacific</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Contract Start</Label>
                                <Input 
                                    type="date"
                                    value={newOrg.startDate}
                                    onChange={(e) => setNewOrg({...newOrg, startDate: e.target.value})}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Contract End</Label>
                                <Input 
                                    type="date"
                                    value={newOrg.endDate}
                                    onChange={(e) => setNewOrg({...newOrg, endDate: e.target.value})}
                                />
                            </div>
                            
                            <div className="col-span-2 space-y-2">
                                <Label>Internal Notes</Label>
                                <Textarea 
                                    value={newOrg.notes}
                                    onChange={(e) => setNewOrg({...newOrg, notes: e.target.value})}
                                    placeholder="Special terms, decision maker details, etc."
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                        <Button type="submit" onClick={createOrganization}>Create Organization</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
      </div>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl">
            <DialogHeader>
                <DialogTitle>Organization Details</DialogTitle>
                <DialogDescription>View contract and status information.</DialogDescription>
            </DialogHeader>
            {selectedOrg && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                    <div className="space-y-4">
                        <div>
                            <h4 className="text-sm font-medium text-gray-500">Organization</h4>
                            <div className="flex items-center mt-1">
                                <Avatar className="h-10 w-10 mr-3">
                                    <AvatarFallback>{selectedOrg.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <span className="text-xl font-bold">{selectedOrg.name}</span>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <h4 className="text-sm font-medium text-gray-500">Status</h4>
                                <Badge variant="secondary" className="mt-1 capitalize">{selectedOrg.status}</Badge>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-gray-500">Plan</h4>
                                <Badge variant="outline" className="mt-1 capitalize">{selectedOrg.plan}</Badge>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-sm font-medium text-gray-500">Region</h4>
                            <div className="flex items-center mt-1">
                                <Globe className="w-4 h-4 mr-2 text-gray-400" />
                                {selectedOrg.region || 'N/A'}
                            </div>
                        </div>

                        <div>
                             <h4 className="text-sm font-medium text-gray-500">Users</h4>
                             <p className="mt-1">{selectedOrg.users_count} licensed users</p>
                        </div>
                    </div>

                    <div className="space-y-4 border-l pl-6">
                        <div>
                            <h4 className="text-sm font-medium text-gray-500 flex items-center">
                                <FileText className="w-4 h-4 mr-2" /> Contract Details
                            </h4>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <h4 className="text-xs text-gray-500 uppercase tracking-wider">Start Date</h4>
                                <p className="font-medium">{selectedOrg.contract_start_date || 'N/A'}</p>
                            </div>
                            <div>
                                <h4 className="text-xs text-gray-500 uppercase tracking-wider">End Date</h4>
                                <p className="font-medium">{selectedOrg.contract_end_date || selectedOrg.renewal_date?.split('T')[0] || 'N/A'}</p>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-xs text-gray-500 uppercase tracking-wider">Contract Value</h4>
                            <p className="text-lg font-bold text-green-700">
                                {selectedOrg.contract_value 
                                    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(selectedOrg.contract_value) 
                                    : '$0.00'}
                            </p>
                        </div>

                        <div>
                            <h4 className="text-xs text-gray-500 uppercase tracking-wider">Notes</h4>
                            <p className="text-sm text-gray-600 mt-1 bg-gray-50 p-3 rounded-md border">
                                {selectedOrg.internal_notes || "No notes available."}
                            </p>
                        </div>

                        <div>
                             <h4 className="text-xs text-gray-500 uppercase tracking-wider">Created At</h4>
                             <p className="text-sm text-gray-600 mt-1">
                                {new Date(selectedOrg.created_at).toLocaleString()}
                             </p>
                        </div>
                    </div>
                </div>
            )}
        </DialogContent>
      </Dialog>


      <div className="flex items-center space-x-2 bg-white p-2 rounded-md border border-gray-200 shadow-sm max-w-sm">
        <Search className="w-4 h-4 text-gray-400 ml-2" />
        <Input 
          placeholder="Search organizations..." 
          className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="rounded-md border border-gray-200 bg-white shadow-sm overflow-hidden min-h-[400px]">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="w-[300px]">Organization</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Region</TableHead>
              <TableHead className="text-right">Users</TableHead>
              <TableHead className="text-right">Contract End</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-10 w-48" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-12 ml-auto" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-24 ml-auto" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                ))
            ) : filteredOrgs.length > 0 ? (
                filteredOrgs.map((org) => (
                <TableRow key={org.id} className="hover:bg-gray-50/50">
                    <TableCell>
                    <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border border-gray-100">
                            <AvatarFallback>{org.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{org.name}</span>
                        <span className="text-xs text-gray-500">ID: {org.id.slice(0, 8)}...</span>
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
                        org.plan === 'standard' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                        'bg-gray-50 text-gray-600 border-gray-200'
                    }`}>
                        {org.plan}
                    </Badge>
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center gap-1 text-gray-600">
                            <Globe className="w-3.5 h-3.5 text-gray-400" />
                            {org.region || 'N/A'}
                        </div>
                    </TableCell>
                    <TableCell className="text-right font-medium text-gray-700">{org.users_count}</TableCell>
                    <TableCell className="text-right text-gray-500 text-sm">
                        {org.renewal_date ? new Date(org.renewal_date).toLocaleDateString() : (org.contract_end_date || 'N/A')}
                    </TableCell>
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
                        <DropdownMenuItem onClick={() => openDetails(org)}>View details</DropdownMenuItem>
                        <DropdownMenuItem>Manage users</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600 focus:text-red-700 focus:bg-red-50">Suspend account</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    </TableCell>
                </TableRow>
                ))
            ) : (
                <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-gray-500">
                        No organizations found.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
