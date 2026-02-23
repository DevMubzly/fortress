import { useState, useEffect } from "react";
import { KeyRound, Plus, Trash2, Copy, Check, Filter, MoreHorizontal, Ban, RefreshCcw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

interface APIKey {
    id: number;
    prefix: string;
    name: string;
    description?: string;
    created_at: string;
    last_used_at: string | null;
    expires_at: string | null;
    is_active: boolean;
    allowed_models: string[]; 
}

interface User {
    id: number;
    username: string;
    role: string;
}

export default function ApiKeysPage() {
    const [keys, setKeys] = useState<APIKey[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newKeyName, setNewKeyName] = useState("");
    const [newKeyDescription, setNewKeyDescription] = useState("");
    const [expiry, setExpiry] = useState("never");
    const [createdKey, setCreatedKey] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [viewingKey, setViewingKey] = useState<APIKey | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
    const [revealedKey, setRevealedKey] = useState<string | null>(null);

    const fetchKeys = async () => {
        try {
            const token = localStorage.getItem("fortress_token");
            const res = await fetch("http://localhost:8000/api/apikeys", {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setKeys(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        const fetchUser = async () => {
            const token = localStorage.getItem("fortress_token");
            if (!token) return;
            const res = await fetch("http://localhost:8000/api/auth/me", {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) setCurrentUser(await res.json());
        };
        fetchUser();
        fetchKeys();
    }, []);

    const handleReveal = async (id: number) => {
        try {
            const token = localStorage.getItem("fortress_token");
            const res = await fetch(`http://localhost:8000/api/apikeys/${id}/reveal`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setRevealedKey(data.key);
            } else {
                 toast({ title: "Failed to reveal key",  variant: "destructive" });
            }
        } catch (e) {
            console.error(e);
            toast({ title: "Error revealing key", variant: "destructive" });
        }
    };

    const handleCreate = async () => {
        if (!newKeyName.trim()) {
            toast({ title: "Name required", variant: "destructive" });
            return;
        }

        try {
            const token = localStorage.getItem("fortress_token");
            
            let expiresAt = null;
            if (expiry !== "never") {
                const date = new Date();
                date.setDate(date.getDate() + parseInt(expiry)); // 30, 90, 365
                expiresAt = date.toISOString();
            }

            const res = await fetch("http://localhost:8000/api/apikeys", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}` 
                },
                body: JSON.stringify({
                    name: newKeyName,
                    description: newKeyDescription,
                    user_id: currentUser?.id,
                    expires_at: expiresAt,
                    allowed_models: [] // All for now
                })
            });

            if (res.ok) {
                const data = await res.json();
                setCreatedKey(data.key);
                fetchKeys();
                // Wait for user to close modal in "Done" step
            } else {
                toast({ title: "Failed to create key", variant: "destructive" });
            }
        } catch (e) {
            console.error(e);
            toast({ title: "Error", description: "Network error", variant: "destructive" });
        }
    };

    const resetForm = () => {
        setNewKeyName("");
        setNewKeyDescription("");
        setExpiry("never");
        setCreatedKey(null);
        setIsCreateOpen(false);
    };

    const handleRevoke = async (id: number) => {
        try {
            const token = localStorage.getItem("fortress_token");
            const res = await fetch(`http://localhost:8000/api/apikeys/${id}/revoke`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (res.ok) {
                toast({ title: "Key Revoked" });
                fetchKeys();
            }
        } catch (e) {
            toast({ title: "Error", variant: "destructive" });
        }
    };

    const handleRestore = async (id: number, expires_at: string | null) => {
        // Prevent restoring if expired
        if (expires_at && new Date(expires_at) < new Date()) {
             toast({ title: "Cannot Restore", description: "This key has expired. Please create a new one.", variant: "destructive" });
             return;
        }

        try {
            const token = localStorage.getItem("fortress_token");
            const res = await fetch(`http://localhost:8000/api/apikeys/${id}/restore`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (res.ok) {
                toast({ title: "Key Restored" });
                fetchKeys();
            } else {
                 const err = await res.json();
                 toast({ title: "Cannot Restore", description: err.detail, variant: "destructive" });
            }
        } catch (e) {
            toast({ title: "Error", variant: "destructive" });
        }
    };

    const handleDelete = async (id: number) => {
        try {
            const token = localStorage.getItem("fortress_token");
            const res = await fetch(`http://localhost:8000/api/apikeys/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (res.ok) {
                toast({ title: "Key Deleted" });
                setKeys(prev => prev.filter(k => k.id !== id));
            }
        } catch (e) {
            toast({ title: "Error", variant: "destructive" });
        }
    };

    const copyKey = () => {
        if (createdKey) {
            navigator.clipboard.writeText(createdKey);
            toast({ title: "Copied to clipboard" });
        }
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex justify-between items-start">
                <PageHeader 
                    icon={KeyRound} 
                    title="API Keys" 
                    description="Manage access keys for programmatic usage of models." 
                />
                <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Create API Key
                </Button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : keys.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 border border-dashed rounded-lg bg-secondary/5 p-12">
                     <div className="bg-primary/10 p-4 rounded-full mb-4">
                        <KeyRound className="w-8 h-8 text-primary" />
                     </div>
                     <h3 className="text-lg font-medium mb-1">No API Keys Found</h3>
                     <p className="text-muted-foreground text-sm max-w-sm text-center mb-6">
                        Create an API key to authenticate requests from your applications or scripts.
                     </p>
                     <Button variant="outline" onClick={() => setIsCreateOpen(true)}>Create First Key</Button>
                </div>
            ) : (
                <div className="border rounded-lg bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Key Details</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead>Last Used</TableHead>
                                <TableHead>Expires</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {keys.map((key) => {
                                const isExpired = key.expires_at && new Date(key.expires_at) < new Date();
                                return (
                                <TableRow key={key.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex flex-col gap-1">
                                            <span className="font-semibold">{key.name}</span>
                                            {key.description && <span className="text-xs text-muted-foreground">{key.description}</span>}
                                            <span className="text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded w-fit">{key.prefix}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <Badge variant={key.is_active ? "default" : "secondary"} className={`rounded-lg w-fit ${key.is_active ? "bg-green-500/15 text-green-500 hover:bg-green-500/25 border-green-500/30" : "bg-red-500/15 text-red-500 hover:bg-red-500/25 border-red-500/30"}`}>
                                                {key.is_active ? "Active" : isExpired ? "Expired" : "Revoked"}
                                            </Badge>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {new Date(key.created_at).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {key.last_used_at ? formatDistanceToNow(new Date(key.last_used_at), { addSuffix: true }) : 'Never'}
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {key.expires_at ? new Date(key.expires_at).toLocaleDateString() : 'Never'}
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
                                                <DropdownMenuItem onClick={() => setViewingKey(key)}>
                                                    <KeyRound className="mr-2 h-4 w-4" /> View Key
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(key.prefix)}>
                                                    <Copy className="mr-2 h-4 w-4" /> Copy Prefix
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                {key.is_active ? (
                                                    <DropdownMenuItem onClick={() => handleRevoke(key.id)} className="text-yellow-600 focus:text-yellow-600">
                                                        <Ban className="mr-2 h-4 w-4" /> Revoke Key
                                                    </DropdownMenuItem>
                                                ) : (
                                                    <DropdownMenuItem onClick={() => handleRestore(key.id, key.expires_at)} disabled={!!isExpired}>
                                                        <RefreshCcw className="mr-2 h-4 w-4" /> Restore Key
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => setConfirmDeleteId(key.id)} className="text-destructive focus:text-destructive">
                                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            )})}
                        </TableBody>
                    </Table>
                </div>
            )}

            <Dialog open={isCreateOpen} onOpenChange={(open) => {
                if (!open) resetForm();
            }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Create API Key</DialogTitle>
                        <DialogDescription>
                            Generate a new key for accessing models.
                        </DialogDescription>
                    </DialogHeader>

                    {!createdKey ? (
                        <div className="space-y-4 py-4">
                            <div className="grid gap-3">
                                <Label htmlFor="name">Name</Label>
                                <Input 
                                    id="name" 
                                    placeholder="e.g. Production Key" 
                                    value={newKeyName}
                                    onChange={(e) => setNewKeyName(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-3">
                                <Label htmlFor="description">Description</Label>
                                <Input 
                                    id="description" 
                                    placeholder="Purpose of this key" 
                                    value={newKeyDescription}
                                    onChange={(e) => setNewKeyDescription(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-3">
                                <Label>Expiration</Label>
                                <Select value={expiry} onValueChange={setExpiry}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select expiration" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="never">Never expires</SelectItem>
                                        <SelectItem value="30">30 days</SelectItem>
                                        <SelectItem value="60">60 days</SelectItem>
                                        <SelectItem value="90">90 days</SelectItem>
                                        <SelectItem value="365">1 year</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    ) : (
                        <div className="py-4 space-y-4">
                            <div className="flex items-center justify-center py-4">
                                <div className="bg-green-500/10 p-3 rounded-full">
                                    <Check className="w-8 h-8 text-green-500" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Your Secret Key</Label>
                                <div className="flex gap-2">
                                    <Input value={createdKey} readOnly className="font-mono text-sm bg-muted/50" />
                                    <Button size="icon" variant="outline" onClick={copyKey}>
                                        <Copy className="w-4 h-4" />
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">
                                    Make sure to copy your API key now. You won't be able to see it again!
                                </p>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        {!createdKey ? (
                            <div className="flex gap-2 w-full justify-end">
                                <Button variant="outline" onClick={resetForm}>Cancel</Button>
                                <Button onClick={handleCreate}>Create Key</Button>
                            </div>
                        ) : (
                            <Button onClick={resetForm} className="w-full">Done</Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!viewingKey} onOpenChange={(open) => { if (!open) { setViewingKey(null); setRevealedKey(null); } }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>API Key Details</DialogTitle>
                        <DialogDescription>
                            Key information.
                        </DialogDescription>
                    </DialogHeader>
                    {viewingKey && (
                        <div className="space-y-4 py-4">
                            <div className="grid gap-2">
                                <Label>Key Name</Label>
                                <Input value={viewingKey.name} readOnly className="bg-muted/50" />
                            </div>
                            <div className="grid gap-2">
                                <Label>Key Prefix</Label>
                                <div className="flex gap-2">
                                    <Input value={viewingKey.prefix} readOnly className="font-mono bg-muted/50" />
                                    <Button size="icon" variant="outline" onClick={() => {
                                        navigator.clipboard.writeText(viewingKey.prefix);
                                        toast({ title: "Copied Prefix" });
                                    }}>
                                        <Copy className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>Secret Key</Label>
                                {!revealedKey ? (
                                    <div className="flex flex-col gap-2">
                                        <div className="text-xs text-muted-foreground bg-secondary/30 p-3 rounded-lg flex items-center gap-2 border border-orange-500/20">
                                            <AlertCircle className="w-4 h-4 text-orange-500 shrink-0" />
                                            <span>The full secret key is hidden. Click Reveal to view it once.</span>
                                        </div>
                                        <Button 
                                            variant="secondary" 
                                            size="sm" 
                                            className="w-full text-xs" 
                                            onClick={() => handleReveal(viewingKey.id)}
                                        >
                                            <KeyRound className="w-3 h-3 mr-2" />
                                            Reveal Secret Key
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <Input value={revealedKey} readOnly className="font-mono text-sm bg-yellow-500/10 border-yellow-500/30 text-yellow-600" />
                                        <Button size="icon" variant="outline" onClick={() => {
                                            navigator.clipboard.writeText(revealedKey);
                                            toast({ title: "Copied to clipboard" });
                                        }}>
                                            <Copy className="w-4 h-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button onClick={() => { setViewingKey(null); setRevealedKey(null); }}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!confirmDeleteId} onOpenChange={(open) => !open && setConfirmDeleteId(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Delete API Key</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this API key? This action cannot be undone and any applications using this key will lose access immediately.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
                        <Button 
                            variant="destructive" 
                            onClick={() => { 
                                if (confirmDeleteId) handleDelete(confirmDeleteId); 
                                setConfirmDeleteId(null); 
                            }}
                        >
                            Delete Key
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
