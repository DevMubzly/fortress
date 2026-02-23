import { useState, useEffect } from "react";
import { Shield, Users, Plus, Trash2, Edit, Check, X, Search, RefreshCw, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
  active: boolean;
  auth_provider: string;
  last_login?: string;
  created_at: string;
}

const IdentityAccessPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  
  // New User Form State
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    full_name: "",
    password: "",
    role: "user"
  });

  const validRoles = ["admin", "manager", "analyst", "user"];

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("fortress_token");
      const res = await fetch("http://localhost:8000/api/users/", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to load users", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async () => {
    try {
      const token = localStorage.getItem("fortress_token");
      const res = await fetch("http://localhost:8000/api/users/", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newUser)
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to create user");
      }

      toast({ title: "Success", description: "User created successfully" });
      setIsAddUserOpen(false);
      setNewUser({ username: "", email: "", full_name: "", password: "", role: "user" });
      fetchUsers();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
        const token = localStorage.getItem("fortress_token");
        const newStatus = !user.active;
        const res = await fetch(`http://localhost:8000/api/users/${user.id}/status`, {
            method: "PUT",
            headers: { 
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ active: newStatus })
        });
        
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || "Failed to update status");
        }
        
        setUsers(users.map(u => u.id === user.id ? { ...u, active: newStatus } : u));
        toast({ title: "Success", description: "User status updated successfully" });
    } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;

    try {
      const token = localStorage.getItem("fortress_token");
      const res = await fetch(`http://localhost:8000/api/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error("Failed to delete user");
      
      setUsers(users.filter(u => u.id !== userId));
      toast({ title: "Success", description: "User deleted successfully" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete user", variant: "destructive" });
    }
  };

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-destructive/10 text-destructive border-destructive/20',
      manager: 'bg-warning/10 text-warning border-warning/20',
      analyst: 'bg-primary/10 text-primary border-primary/20',
      user: 'bg-muted text-muted-foreground border-border',
    };
    return <Badge variant="outline" className={`${colors[role]} text-[10px]`}>{role}</Badge>;
  };

  return (
    <div className="space-y-6 h-full p-1 overflow-y-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Identity & Access Management
          </h2>
          <p className="text-sm text-muted-foreground">Manage platform users, roles, and access controls</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
           <Button variant="outline" size="sm" onClick={fetchUsers} disabled={isLoading}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
           </Button>
           <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New User</DialogTitle>
                  <DialogDescription>Add a new user to the platform. They will be able to log in immediately.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Username</Label>
                        <Input 
                          placeholder="jbond" 
                          value={newUser.username}
                          onChange={e => setNewUser({...newUser, username: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Full Name</Label>
                        <Input 
                          placeholder="James Bond" 
                          value={newUser.full_name}
                          onChange={e => setNewUser({...newUser, full_name: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input 
                        type="email" 
                        placeholder="james.bond@mi6.gov.uk" 
                        value={newUser.email}
                        onChange={e => setNewUser({...newUser, email: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Password</Label>
                      <Input 
                        type="password" 
                        value={newUser.password}
                        onChange={e => setNewUser({...newUser, password: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <Select value={newUser.role} onValueChange={v => setNewUser({...newUser, role: v})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {validRoles.map(role => (
                            <SelectItem key={role} value={role}>{role}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreateUser}>Create User</Button>
                </DialogFooter>
              </DialogContent>
           </Dialog>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
          <Card className="md:col-span-3 h-fit border-border/50">
             <CardHeader className="py-4">
               <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Platform Users</CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search users..." 
                      className="pl-9 h-9 text-xs"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </div>
               </div>
             </CardHeader>
             <CardContent className="p-0">
               <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead>User</TableHead>
                     <TableHead>Role</TableHead>
                     <TableHead>Status</TableHead>
                     <TableHead>Joined</TableHead>
                     <TableHead className="text-right">Actions</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {isLoading ? (
                     <TableRow>
                       <TableCell colSpan={5} className="h-24 text-center">
                         <div className="flex items-center justify-center gap-2 text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading users...
                         </div>
                       </TableCell>
                     </TableRow>
                   ) : filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                          No users found.
                        </TableCell>
                      </TableRow>
                   ) : (
                     filteredUsers.map((user) => (
                       <TableRow key={user.id}>
                         <TableCell>
                           <div className="flex flex-col">
                             <span className="font-medium text-sm">{user.full_name}</span>
                             <span className="text-xs text-muted-foreground">{user.email}</span>
                           </div>
                         </TableCell>
                         <TableCell>
                           {getRoleBadge(user.role)}
                         </TableCell>
                         <TableCell>
                            {user.active ? (
                              <Badge variant="outline" className="text-success border-success/30 bg-success/10 text-[10px]">Active</Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground text-[10px]">Inactive</Badge>
                            )}
                         </TableCell>
                         <TableCell className="text-xs text-muted-foreground">
                           {new Date(user.created_at).toLocaleDateString()}
                         </TableCell>
                         <TableCell className="text-right">
                           <div className="flex justify-end gap-2">
                             <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 hover:text-success hover:bg-success/10"
                                onClick={() => handleToggleStatus(user)}
                                title={user.active ? "Deactivate User" : "Activate User"}
                             >
                               {user.active ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                             </Button>
                             <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleDeleteUser(user.id)}
                             >
                               <Trash2 className="h-4 w-4" />
                             </Button>
                           </div>
                         </TableCell>
                       </TableRow>
                     ))
                   )}
                 </TableBody>
               </Table>
             </CardContent>
          </Card>

          <Card className="h-fit border-border/50">
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                 <Shield className="h-4 w-4 text-primary" />
                 Roles & Permissions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               <div>
                  <h4 className="text-xs font-semibold mb-2">Admin</h4>
                  <p className="text-xs text-muted-foreground">Full access to system settings, user management, and all resources.</p>
               </div>
               <div>
                  <h4 className="text-xs font-semibold mb-2">Manager</h4>
                  <p className="text-xs text-muted-foreground">Can manage team resources, view analytics, and manage non-admin users.</p>
               </div>
               <div>
                  <h4 className="text-xs font-semibold mb-2">Analyst</h4>
                  <p className="text-xs text-muted-foreground">Access to monitoring dashboards, audit logs, and read-only system configurations.</p>
               </div>
               <div>
                  <h4 className="text-xs font-semibold mb-2">User</h4>
                  <p className="text-xs text-muted-foreground">Standard access to workspaces, model hub, and personal resources.</p>
               </div>
            </CardContent>
          </Card>
      </div>
    </div>
  );
};

export default IdentityAccessPage;
