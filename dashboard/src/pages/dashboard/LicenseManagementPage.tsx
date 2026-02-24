import { useState, useEffect } from "react";
import {
  Shield,
  Upload,
  MoreHorizontal,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  Users,
  Search,
  RefreshCw,
  AlertTriangle
} from "lucide-react";
import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Define License Type
interface License {
  id: string;
  client_name: string;
  tier: string;
  features: string[];
  max_users: number; // mapped from max_gpus
  expires_at: string | null;
  fingerprint: string | null;
  activated_at: string | null;
  issued_at: string | null;
}

const LicenseManagementPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [selectedLicenseId, setSelectedLicenseId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const queryClient = useQueryClient();

  // Fetch Licenses
  const { data: licenses, isLoading } = useQuery({
    queryKey: ["licenses"],
    queryFn: async () => {
      const res = await fetch("/api/admin/licenses");
      if (!res.ok) throw new Error("Failed to fetch licenses");
      return res.json() as Promise<License[]>; // Cast to License array
    },
  });

  // Upload License Mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const reader = new FileReader();
      return new Promise((resolve, reject) => {
        reader.onload = async (e) => {
          try {
            const content = e.target?.result as string;
            // The API expects JSON with "license_file": "base64..." or just the object if sending JSON
            // BUT setup/license expects { license_file: string(base64) }
            // Let's assume we read as text (JSON) or base64. 
            // The file itself might be .lic (text) or .json.
            
            // Let's send it base64 encoded as the setup endpoint expects
            // Actually FileReader.readAsDataURL returns "data:application/json;base64,....."
            // We need just the base64 part if using readAsDataURL, OR readAsText and then btoa.
            // Let's stick with readAsText and sending that string as base64.
            
            // Re-reading logic in license_service: it expects base64 string.
            // So we should encode the file content to base64.
            
            // Let's use readAsArrayBuffer to be safe for any content
          } catch(err) { reject(err); }
        };
        reader.readAsArrayBuffer(file);
      }).then(async (buffer) => {
          // array buffer to base64
          let binary = '';
          const bytes = new Uint8Array(buffer as ArrayBuffer);
          const len = bytes.byteLength;
          for (let i = 0; i < len; i++) {
              binary += String.fromCharCode(bytes[i]);
          }
          const base64Content = window.btoa(binary);

          const res = await fetch("/api/admin/licenses", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ file_content: base64Content }),
          });
          
          if (!res.ok) {
              const error = await res.json();
              throw new Error(error.detail || "Upload failed");
          }
          return res.json();
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["licenses"] });
      toast.success("License uploaded successfully");
      setUploadOpen(false);
      setFile(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Revoke License Mutation
  const revokeMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/licenses/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to revoke license");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["licenses"] });
      toast.success("License revoked successfully");
      setRevokeOpen(false);
      setSelectedLicenseId(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const confirmRevoke = (id: string) => {
      setSelectedLicenseId(id);
      setRevokeOpen(true);
  };

  const handleRevoke = () => {
      if (selectedLicenseId) {
          revokeMutation.mutate(selectedLicenseId);
      }
  };

  const handleUpload = async () => {
    if (!file) return;
    uploadMutation.mutate(file);
  };

  const filteredLicenses = licenses?.filter((lic) =>
    lic.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lic.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatus = (expiry: string | null) => {
    if (!expiry) return "active";
    const now = new Date();
    const exp = new Date(expiry);
    if (exp < now) return "expired";
    const diffTime = Math.abs(exp.getTime() - now.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    if (diffDays <= 30) return "expiring";
    return "active";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">License Management</h2>
          <p className="text-muted-foreground">
            Monitor and manage organization licenses, expirations, and renewals.
          </p>
        </div>
        
        <AlertDialog open={revokeOpen} onOpenChange={setRevokeOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-destructive flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Revoke License?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently revoke the license for this organization. 
                        Users will lose access immediately. This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                        onClick={handleRevoke}
                        className="bg-destructive hover:bg-destructive/90"
                    >
                        {revokeMutation.isPending ? "Revoking..." : "Revoke License"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              Upload New License
            </Button>
          </DialogTrigger>
          <DialogContent>
             <DialogHeader>
                <DialogTitle>Upload / Renew License</DialogTitle>
                <DialogDescription>
                    Upload a new .lic or .json license file to add or renew an organization license.
                </DialogDescription>
             </DialogHeader>
             <div className="grid w-full items-center gap-4">
                 <div className="flex flex-col gap-2">
                    <Label htmlFor="license-file">License File</Label>
                    <Input 
                        id="license-file" 
                        type="file" 
                        accept=".lic,.json" 
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                    <p className="text-xs text-muted-foreground">
                        Supported formats: JSON, LIC. Max size: 1MB.
                    </p>
                 </div>
             </div>
             <DialogFooter>
                <Button variant="outline" onClick={() => setUploadOpen(false)}>Cancel</Button>
                <Button onClick={handleUpload} disabled={!file || uploadMutation.isPending}>
                    {uploadMutation.isPending ? "Uploading..." : "Upload & Activate"}
                </Button>
             </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
            <div className="flex justify-between items-center">
                <CardTitle>Issued Licenses</CardTitle>
                <div className="relative w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search organizations..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
            <CardDescription>
                Overview of all licenses currently in the system.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Organization</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Tier</TableHead>
                        <TableHead>Users</TableHead>
                        <TableHead>Issued</TableHead>
                        <TableHead>Expires</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                         <TableRow>
                             <TableCell colSpan={7} className="h-24 text-center">
                                 Loading licenses...
                             </TableCell>
                         </TableRow>
                    ) : filteredLicenses?.length === 0 ? (
                         <TableRow>
                             <TableCell colSpan={7} className="h-24 text-center">
                                 No licenses found.
                             </TableCell>
                         </TableRow>
                    ) : (
                        filteredLicenses?.map((lic) => {
                            const status = getStatus(lic.expires_at);
                            return (
                                <TableRow key={lic.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex flex-col">
                                            <span>{lic.client_name}</span>
                                            <span className="text-xs text-muted-foreground font-mono">{lic.id.substring(0, 8)}...</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {status === "active" && (
                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
                                        )}
                                        {status === "expiring" && (
                                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Expiring Soon</Badge>
                                        )}
                                        {status === "expired" && (
                                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Expired</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="capitalize">{lic.tier}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <Users className="h-3 w-3 text-muted-foreground" />
                                            {lic.max_users}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {lic.issued_at ? format(new Date(lic.issued_at), "MMM d, yyyy") : "-"}
                                    </TableCell>
                                    <TableCell>
                                        {lic.expires_at ? format(new Date(lic.expires_at), "MMM d, yyyy") : "Never"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(lic.id)}>
                                                    Copy License ID
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem 
                                                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                                    onClick={() => confirmRevoke(lic.id)}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Revoke License
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            );
                        })
                    )}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default LicenseManagementPage;
