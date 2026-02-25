
import { useState, useEffect } from "react";
import { User, Mail, Lock, Key, Shield, AlertTriangle, Loader2, Save, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/PageHeader";

// Helper to get initials
const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

const API_BASE = "http://localhost:8000/api";

export default function ProfilePage() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Edit form state
    const [formData, setFormData] = useState({
        full_name: "",
        username: "",
        email: ""
    });

    const [passwordData, setPasswordData] = useState({
        current_password: "",
        new_password: "",
        confirm_password: ""
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem("fortress_token");
            if (!token) return; // Redirect to login handled by protected route wrapper usually

            const res = await fetch(`${API_BASE}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setUser(data);
                setFormData({
                    full_name: data.full_name || "",
                    username: data.username || "",
                    email: data.email || ""
                });
            }
        } catch (error) {
            console.error("Failed to fetch profile", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const token = localStorage.getItem("fortress_token");
            const res = await fetch(`${API_BASE}/users/me`, {
                method: "PATCH",
                headers: { 
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}` 
                },
                body: JSON.stringify({
                    full_name: formData.full_name,
                    username: formData.username
                })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || "Update failed");
            }

            const updatedUser = await res.json();
            setUser(updatedUser);
            toast({ title: "Profile Updated", description: "Your profile details have been saved." });
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.new_password !== passwordData.confirm_password) {
            toast({ title: "Error", description: "New passwords do not match", variant: "destructive" });
            return;
        }

        setSaving(true);
        try {
            const token = localStorage.getItem("fortress_token");
            const res = await fetch(`${API_BASE}/users/me/password`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}` 
                },
                body: JSON.stringify({
                    old_password: passwordData.current_password,
                    new_password: passwordData.new_password
                })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || "Password update failed");
            }

            toast({ title: "Success", description: "Your password has been changed." });
            setPasswordData({ current_password: "", new_password: "", confirm_password: "" });
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <PageHeader
                title="Account Settings"
                description="Manage your profile information and security settings."
            />

            <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                </TabsList>
                
                <TabsContent value="general" className="mt-6 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Profile Information</CardTitle>
                            <CardDescription>Update your personal details.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center gap-6">
                                <Avatar className="w-20 h-20 border-2 border-border">
                                    <AvatarImage src="" />
                                    <AvatarFallback className="text-xl bg-primary/10 text-primary">
                                        {user?.full_name ? getInitials(user.full_name) : 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="space-y-1">
                                    <h3 className="font-medium text-lg">{user?.full_name || user?.username}</h3>
                                    <p className="text-sm text-muted-foreground">{user?.role === 'admin' ? 'Administrator' : 'User'}</p>
                                </div>
                            </div>

                            <Separator />

                            <form onSubmit={handleUpdateProfile} className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="full_name">Full Name</Label>
                                    <div className="relative">
                                        <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="full_name"
                                            className="pl-9"
                                            value={formData.full_name}
                                            onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="username">Username</Label>
                                    <div className="relative">
                                        <Shield className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="username"
                                            className="pl-9"
                                            value={formData.username}
                                            onChange={(e) => setFormData({...formData, username: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="email"
                                            className="pl-9 bg-muted/50"
                                            value={formData.email}
                                            disabled
                                            title="Email editing is currently disabled."
                                        />
                                    </div>
                                    <p className="text-[10px] text-muted-foreground">
                                        Contact your administrator to change your email address.
                                    </p>
                                </div>

                                <div className="pt-2">
                                    <Button type="submit" disabled={saving}>
                                        {saving ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="mr-2 h-4 w-4" />
                                                Save Changes
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="security" className="mt-6 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Change Password</CardTitle>
                            <CardDescription>Ensure your account is secure with a strong password.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleUpdatePassword} className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="current_password">Current Password</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="current_password"
                                            type="password"
                                            className="pl-9"
                                            value={passwordData.current_password}
                                            onChange={(e) => setPasswordData({...passwordData, current_password: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <Separator />

                                <div className="grid gap-2">
                                    <Label htmlFor="new_password">New Password</Label>
                                    <div className="relative">
                                        <Key className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="new_password"
                                            type="password"
                                            className="pl-9"
                                            value={passwordData.new_password}
                                            onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="confirm_password">Confirm New Password</Label>
                                    <div className="relative">
                                        <Key className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="confirm_password"
                                            type="password"
                                            className="pl-9"
                                            value={passwordData.confirm_password}
                                            onChange={(e) => setPasswordData({...passwordData, confirm_password: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <Button type="submit" variant="outline" disabled={saving}>
                                        {saving ? "Updating..." : "Update Password"}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
