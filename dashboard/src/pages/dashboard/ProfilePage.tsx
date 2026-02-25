import { useState, useEffect } from "react";
import { User, Mail, Lock, Shield, AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

const profileSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email(),
});

const passwordSchema = z.object({
  current_password: z.string().min(1, "Current password is required"),
  new_password: z.string().min(8, "Password must be at least 8 characters"),
  confirm_password: z.string().min(8, "Password must be at least 8 characters"),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"],
});

const ProfilePage = () => {
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Forms
  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: "",
      username: "",
      email: "",
    },
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      current_password: "",
      new_password: "",
      confirm_password: "",
    },
  });

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem("fortress_token");
      if (!token) return;

      const res = await fetch("http://localhost:8000/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const user = await res.json();
        setCurrentUser(user);
        profileForm.reset({
          full_name: user.full_name,
          username: user.username,
          email: user.email,
        });
      }
    } catch (e) {
      console.error("Failed to fetch user", e);
    }
  };

  const onProfileSubmit = async (data: z.infer<typeof profileSchema>) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("fortress_token");
      const res = await fetch("http://localhost:8000/api/users/me", {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          full_name: data.full_name,
          username: data.username,
          // Email is excluded intentionally as per requirements
        }),
      });

      if (res.ok) {
        toast({ title: "Profile updated", description: "Your profile details have been changed." });
        fetchUser(); // Refresh
      } else {
        throw new Error("Failed to update profile");
      }
    } catch (error) {
       toast({ title: "Error", description: "Could not update profile.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const onPasswordSubmit = async (data: z.infer<typeof passwordSchema>) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("fortress_token");
      const res = await fetch("http://localhost:8000/api/users/me/password", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          old_password: data.current_password,
          new_password: data.new_password,
        }),
      });

      if (res.ok) {
        toast({ title: "Password updated", description: "Your password has been changed successfully." });
        passwordForm.reset();
      } else {
        toast({ title: "Error", description: "Failed to update password. Check your current password.", variant: "destructive" });
      }
    } catch (error) {
       toast({ title: "Error", description: "Could not update password.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 p-6 max-w-5xl mx-auto w-full">
      
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
          <User className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{currentUser?.full_name || "Loading..."}</h1>
          <p className="text-muted-foreground flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5" /> 
            {currentUser?.role || "User"} Account
          </p>
        </div>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="general">General Information</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Update your personal details.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form id="profile-form" onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input 
                      id="full_name" 
                      {...profileForm.register("full_name")} 
                    />
                    {profileForm.formState.errors.full_name && (
                      <p className="text-xs text-destructive">{profileForm.formState.errors.full_name.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input 
                      id="username" 
                      {...profileForm.register("username")} 
                    />
                    {profileForm.formState.errors.username && (
                      <p className="text-xs text-destructive">{profileForm.formState.errors.username.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                     <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                     <Input 
                        id="email" 
                        disabled 
                        className="pl-9 bg-muted/50"
                        {...profileForm.register("email")} 
                     />
                     <div className="absolute right-3 top-2.5">
                        <Lock className="h-4 w-4 text-muted-foreground opacity-50" />
                     </div>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Email changes are currently disabled. Contact administrator.
                  </p>
                </div>
              </form>
            </CardContent>
            <CardFooter className="flex justify-end border-t bg-muted/5 p-4">
              <Button type="submit" form="profile-form" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Password Change</CardTitle>
              <CardDescription>
                Ensure your account is using a long, random password to stay secure.
              </CardDescription>
            </CardHeader>
            <CardContent>
               <form id="password-form" onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4 max-w-md">
                  <div className="space-y-2">
                    <Label htmlFor="current_password">Current Password</Label>
                    <Input 
                      id="current_password" 
                      type="password"
                      {...passwordForm.register("current_password")} 
                    />
                     {passwordForm.formState.errors.current_password && (
                      <p className="text-xs text-destructive">{passwordForm.formState.errors.current_password.message}</p>
                    )}
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label htmlFor="new_password">New Password</Label>
                    <Input 
                      id="new_password" 
                      type="password"
                      {...passwordForm.register("new_password")} 
                    />
                     {passwordForm.formState.errors.new_password && (
                      <p className="text-xs text-destructive">{passwordForm.formState.errors.new_password.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm_password">Confirm New Password</Label>
                    <Input 
                      id="confirm_password" 
                      type="password"
                      {...passwordForm.register("confirm_password")} 
                    />
                     {passwordForm.formState.errors.confirm_password && (
                      <p className="text-xs text-destructive">{passwordForm.formState.errors.confirm_password.message}</p>
                    )}
                  </div>
               </form>
            </CardContent>
             <CardFooter className="flex justify-end border-t bg-muted/5 p-4">
              <Button type="submit" form="password-form" disabled={isLoading}>
                {isLoading ? "Updating..." : "Update Password"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};


export default ProfilePage;
