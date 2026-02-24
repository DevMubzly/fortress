"use client";

import { useEffect, useState, useCallback } from "react";
import { 
  Shield, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Search,
  RefreshCw 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format } from "date-fns";

interface License {
  id: string;
  organization: string;
  tier: string;
  features: string[];
  max_users: number;
  valid_until: string;
  issued_at: string;
  revoked: boolean;
  active: boolean;
}

export default function LicensesPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [licenses, setLicenses] = useState<License[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null); // ID being actually revoked (loading state)
  const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null); // ID for confirmation dialog

  const supabase = createClient();

  const fetchLicenses = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('licenses')
      .select('*')
      .order('issued_at', { ascending: false });

    if (error) {
      console.error("Error fetching licenses:", error);
      toast({
        title: "Error fetching licenses",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setLicenses(data as License[]);
    }
    setIsLoading(false);
  }, [supabase, toast]);

  useEffect(() => {
    fetchLicenses();
  }, [fetchLicenses]);

  const handleRevoke = async () => {
    if (!confirmRevokeId) return;
    
    setRevokingId(confirmRevokeId);
    const { error } = await supabase
        .from('licenses')
        .update({ revoked: true, active: false })
        .eq('id', confirmRevokeId);

    if (error) {
        toast({
            title: "Error revoking license",
            description: error.message,
            variant: "destructive",
        });
    } else {
        toast({
            title: "License Revoked",
            description: "The license has been permanently revoked."
        });
        fetchLicenses();
    }
    setRevokingId(null);
    setConfirmRevokeId(null);
  };

  const filteredLicenses = licenses.filter(lic => 
    lic.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lic.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">License Management</h2>
          <p className="text-gray-500">Monitor and revoke issued licenses.</p>
        </div>
        <Button onClick={fetchLicenses} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-gray-400" />
        <Input
            placeholder="Search organizations or license IDs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
        />
      </div>

      <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Organization</TableHead>
                    <TableHead>License ID</TableHead>
                    <TableHead>Issued</TableHead>
                    <TableHead>Valid Until</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {filteredLicenses.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            No licenses found.
                        </TableCell>
                    </TableRow>
                ) : (
                    filteredLicenses.map((lic) => {
                        const isExpired = new Date(lic.valid_until) < new Date();
                        const isActive = lic.active && !lic.revoked && !isExpired;
                        
                        return (
                            <TableRow key={lic.id}>
                                <TableCell className="font-medium">{lic.organization}</TableCell>
                                <TableCell className="font-mono text-xs text-muted-foreground">{lic.id}</TableCell>
                                <TableCell>{format(new Date(lic.issued_at), 'MMM d, yyyy')}</TableCell>
                                <TableCell>{format(new Date(lic.valid_until), 'MMM d, yyyy')}</TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="capitalize">{lic.tier}</Badge>
                                </TableCell>
                                <TableCell>
                                    {lic.revoked ? (
                                        <Badge variant="destructive" className="flex w-fit items-center gap-1">
                                            <XCircle className="h-3 w-3" /> Revoked
                                        </Badge>
                                    ) : isExpired ? (
                                        <Badge variant="secondary" className="flex w-fit items-center gap-1">
                                            <AlertTriangle className="h-3 w-3" /> Expired
                                        </Badge>
                                    ) : (
                                        <Badge className="bg-green-600 hover:bg-green-700 flex w-fit items-center gap-1">
                                            <CheckCircle className="h-3 w-3" /> Active
                                        </Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    {!lic.revoked && (
                                        <Button 
                                            size="sm" 
                                            variant="ghost" 
                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                            onClick={() => setConfirmRevokeId(lic.id)}
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Revoke
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        );
                    })
                )}
            </TableBody>
        </Table>
      </div>

      <Dialog open={!!confirmRevokeId} onOpenChange={(open) => !open && setConfirmRevokeId(null)}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Revoke License?</DialogTitle>
                <DialogDescription>
                    This action cannot be undone. The license will be marked as revoked immediately.
                    Clients checking license validity will be denied access.
                </DialogDescription>
            </DialogHeader>
            <DialogFooter>
                <Button variant="outline" onClick={() => setConfirmRevokeId(null)}>Cancel</Button>
                <Button 
                    onClick={handleRevoke}
                    disabled={!!revokingId}
                    variant="destructive"
                >
                    {revokingId ? "Revoking..." : "Revoke License"}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

