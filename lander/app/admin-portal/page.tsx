"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

import { createClient } from "@/lib/supabase";

export default function VendorLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const supabase = createClient();
    const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        toast({
            title: "Authentication Failed",
            description: error.message,
            variant: "destructive",
        });
        setIsLoading(false);
        return;
    }

    // Check if user is an admin
    const { data: adminData, error: adminError } = await supabase
        .from("admins")
        .select("*")
        .eq("id", data.user.id)
        .single();

    if (adminError || !adminData) {
        toast({
            title: "Access Denied",
            description: "You are not an authorized administrator.",
            variant: "destructive"
        });
        await supabase.auth.signOut();
        setIsLoading(false);
        return;
    }

    toast({ title: "Welcome", description: "Logged in to Admin Portal successfully." });
    router.push("/admin-portal/dashboard/analytics");
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center font-inter p-4">
      <div className="w-full max-w-sm space-y-8">
            <div className="text-center space-y-4">
                <div className="mx-auto flex flex-col items-center justify-center">
                    <div className="p-3">
                      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 28 28">
                        <path
                          className="fill-blue-600"
                          fillRule="evenodd"
                          d="M15.052 0c6.914.513 12.434 6.033 12.947 12.947h-5.015a7.932 7.932 0 0 1-7.932-7.932V0Zm-2.105 22.985V28C6.033 27.487.513 21.967 0 15.053h5.015a7.932 7.932 0 0 1 7.932 7.932Z"
                          clipRule="evenodd"
                        />
                        <path
                          className="fill-blue-400"
                          fillRule="evenodd"
                          d="M0 12.947C.513 6.033 6.033.513 12.947 0v5.015a7.932 7.932 0 0 1-7.932 7.932H0Zm22.984 2.106h5.015C27.486 21.967 21.966 27.487 15.052 28v-5.015a7.932 7.932 0 0 1 7.932-7.932Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                </div>
                <div>
                   <h1 className="text-2xl font-bold tracking-tight text-gray-900">Admin Portal</h1>
                   <p className="text-sm text-gray-500 mt-2">
                      Enter your credentials to access the internal dashboard.
                   </p>
                </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                    <Label htmlFor="email">Email address</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="admin@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="h-10"
                    />
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                    </div>
                    <div className="relative">
                        <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="h-10 pr-10 hover:border-blue-400 focus:border-blue-600 transition-colors"
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-gray-600"
                            onClick={() => setShowPassword(!showPassword)}
                            tabIndex={-1}
                        >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                    </div>
                </div>
                
                <Button type="submit" className="w-full h-10 bg-blue-600 hover:bg-blue-700 font-medium transition-all shadow-sm hover:shadow-md" disabled={isLoading}>
                    {isLoading ? "Authenticating..." : (
                        <>
                            Sign In
                            <LogIn className="w-4 h-4 ml-2" />
                        </>
                    )}
                </Button>
            </form>

            <p className="text-center text-xs text-gray-400 mt-8">
                &copy; {new Date().getFullYear()} Fortress AI. All rights reserved.
            </p>
      </div>
    </div>
  );
}

