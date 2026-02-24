import { useState, useEffect } from "react";
import { Shield, Lock, Upload, Server, Key, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { WelcomeModal } from "@/components/WelcomeModal";

type SetupStep = 1 | 2 | 3 | 4;

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(""); // Main login password
  const [isLoading, setIsLoading] = useState(false);
  const [isFirstRun, setIsFirstRun] = useState(false);
  const [setupStep, setSetupStep] = useState<SetupStep>(1);
  const [showWelcome, setShowWelcome] = useState(false);
  
  // Setup wizard state
  const [adminName, setAdminName] = useState("");
  const [adminUsername, setAdminUsername] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const [oidcClientId, setOidcClientId] = useState("");
  const [oidcClientSecret, setOidcClientSecret] = useState("");
  const [oidcIssuerUrl, setOidcIssuerUrl] = useState("");
  
  const [ollamaUrl, setOllamaUrl] = useState("http://localhost:11434");
  const [chromaUrl, setChromaUrl] = useState("http://localhost:8000");
  
  const navigate = useNavigate();

  useEffect(() => {
    const checkSetupStatus = async () => {
      try {
        const response = await fetch(`${API_BASE}/setup/status`);
        if (response.ok) {
          const data = await response.json();
          setIsFirstRun(!data.completed);
        } else {
             // Fallback if API fails (e.g. backend not running)
             // Default to not first run to avoid stuck loading if desired, 
             // but here we keep existing logic or default to false
             console.error("Failed to check setup status");
        }
      } catch (error) {
        console.error("Backend unreachable", error);
      }
    };
    checkSetupStatus();
  }, []);

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    if (password.length < 12) errors.push("At least 12 characters");
    if (!/[A-Z]/.test(password)) errors.push("One uppercase letter");
    if (!/[a-z]/.test(password)) errors.push("One lowercase letter");
    if (!/[0-9]/.test(password)) errors.push("One number");
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push("One special character");
    return errors;
  };

  const handlePasswordChange = (value: string) => {
    setAdminPassword(value);
    setPasswordErrors(validatePassword(value));
  };

  const handleLocalLogin = async () => {
    if (!email || !password) {
        toast({ title: "Check Credentials", description: "Please enter your email and password", variant: "destructive" });
        return;
    }
    setIsLoading(true);
    
    try {
      const formData = new FormData();
      formData.append("username", email);
      formData.append("password", password);

      const response = await fetch(`${API_BASE}/auth/token`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Invalid credentials");
      }

      const data = await response.json();
      localStorage.setItem("fortress_token", data.access_token);
      
      toast({ title: "Welcome back", description: "Identity verified securely." });
      navigate("/dashboard");
    } catch (error) {
      toast({ title: "Login Failed", description: "Invalid email or password", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSSOLogin = async () => {
    if (!email) {
      toast({ title: "Email Required", description: "Please enter your email address", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast({ title: "SSO Redirect", description: "Redirecting to Government SSO..." });
    setIsLoading(false);
    navigate("/dashboard");
  };

  const handleSetupStep1 = async () => {
    if (!adminName || !adminUsername || !adminEmail || !adminPassword || !confirmPassword) {
      toast({ title: "All fields required", variant: "destructive" });
      return;
    }
    if (passwordErrors.length > 0) {
      toast({ title: "Password does not meet requirements", variant: "destructive" });
      return;
    }
    if (adminPassword !== confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/setup/admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
           username: adminUsername,
           email: adminEmail,
           full_name: adminName,
           password: adminPassword,
           role: "admin"
        }),
      });

      if (!response.ok) {
         const err = await response.json();
         throw new Error(err.detail || "Failed to create admin");
      }

      toast({ title: "Admin Created", description: "Super administrator account set up successfully." });
      setSetupStep(2);
    } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith(".lic")) {
      setLicenseFile(file);
    } else {
      toast({ title: "Invalid file", description: "Please upload a .lic file", variant: "destructive" });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setLicenseFile(file);
  };

  const handleSetupStep2 = async () => {
    if (!licenseFile) {
      toast({ title: "License file required", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const fileContent = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
           const result = reader.result as string;
           const base64Content = result.split(",")[1];
           resolve(base64Content);
        };
        reader.onerror = reject;
        reader.readAsDataURL(licenseFile);
      });

      const response = await fetch(`${API_BASE}/setup/license`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file_content: fileContent }),
      });

      if (!response.ok) throw new Error("Invalid license file");

      toast({ title: "License Verified", description: "Enterprise license activated successfully." });
      setSetupStep(3);
    } catch (error) {
      toast({ title: "License Error", description: "Failed to verify license", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetupStep3 = async () => {
    if (!oidcClientId || !oidcClientSecret || !oidcIssuerUrl) {
      toast({ title: "All SSO fields required", variant: "destructive" });
      return;
    }
    
    setIsLoading(true);
    try {
        const response = await fetch(`${API_BASE}/setup/sso`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                issuer_url: oidcIssuerUrl,
                client_id: oidcClientId,
                client_secret: oidcClientSecret
            }),
        });

        if (!response.ok) throw new Error("Failed to configure SSO");
        setSetupStep(4);
    } catch (error) {
        toast({ title: "Error", description: "Failed to save SSO config", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };

  const handleSetupComplete = async () => {
    if (!ollamaUrl || !chromaUrl) {
      toast({ title: "Infrastructure URLs required", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
        const infraRes = await fetch(`${API_BASE}/setup/infra`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ollama_url: ollamaUrl,
                chroma_url: chromaUrl
            }),
        });
        if (!infraRes.ok) throw new Error("Failed to configure infrastructure");

        const completeRes = await fetch(`${API_BASE}/setup/complete`, {
            method: "POST"
        });
        if (!completeRes.ok) throw new Error("Failed to finalize setup");

        toast({ title: "Setup Complete", description: "Fortress is now configured. Please log in." });
        setIsFirstRun(false);
        setShowWelcome(true);
        // We don't navigate yet, user needs to login first.
        // We can pass a prop or state to login form to say "just finished setup"?
        // Actually, let's just use localStorage for the "just finished setup" flag
        localStorage.setItem("fortress_setup_just_completed", "true");
    } catch (error) {
         toast({ title: "Error", description: "Setup failed to complete", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };

  const stepLabels = ["Account", "License", "SSO", "Infrastructure"];

  const renderSetupWizard = () => (
    <div className="w-full max-w-2xl space-y-8 animate-fade-in p-8 bg-white shadow-xl rounded-2xl border border-slate-200 ring-1 ring-slate-100">
      {/* Header */}
      <div className="text-center">
        <div className="flex flex-col items-center justify-center gap-4 mb-6">
           <div className="p-2 rounded-xl bg-blue-50 border border-blue-100 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 28 28">
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
          <div>
            <h1 className="text-2xl font-persis font-bold text-slate-900 tracking-tight">System Setup</h1>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1">Initial Configuration</p>
          </div>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-between px-4">
        {stepLabels.map((label, idx) => (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors border",
                setupStep > idx + 1 ? "bg-blue-600 border-blue-600 text-white" :
                setupStep === idx + 1 ? "bg-blue-50 border-2 border-blue-600 text-blue-600" :
                "bg-slate-50 border-2 border-slate-300 text-slate-400"
              )}>
                {setupStep > idx + 1 ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
              </div>
              <span className={cn(
                "text-xs mt-1 font-medium",
                setupStep === idx + 1 ? "text-slate-900" : "text-slate-500"
              )}>{label}</span>
            </div>
            {idx < 3 && (
              <div className={cn(
                "w-12 h-0.5 mx-2 mb-4",
                setupStep > idx + 1 ? "bg-blue-600" : "bg-slate-200"
              )} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="mt-8">
        {setupStep === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold mb-1 text-slate-900">Create Super Admin</h2>
              <p className="text-sm text-slate-500">Set up the primary administrator account</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="admin-name" className="text-slate-700">Full Name</Label>
              <Input
                id="admin-name"
                type="text"
                placeholder="John Doe"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                className="h-11 bg-white border-slate-300 focus:border-blue-500 focus:ring-blue-200 text-slate-900"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="admin-username" className="text-slate-700">Username</Label>
              <Input
                id="admin-username"
                type="text"
                placeholder="admin"
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                className="h-11 bg-white border-slate-300 focus:border-blue-500 focus:ring-blue-200 text-slate-900"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-email" className="text-slate-700">Admin Email</Label>
              <Input
                id="admin-email"
                type="email"
                placeholder="admin@agency.gov"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="h-11 bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-200 text-slate-900"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-password" className="text-slate-700">Password</Label>
              <Input
                id="admin-password"
                type="password"
                placeholder="••••••••••••"
                value={adminPassword}
                onChange={(e) => handlePasswordChange(e.target.value)}
                className="h-11 bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-200 text-slate-900"
              />
              {adminPassword && (
                <div className="grid grid-cols-2 gap-1 mt-2">
                  {["At least 12 characters", "One uppercase letter", "One lowercase letter", "One number", "One special character"].map((req) => (
                    <div key={req} className={cn(
                      "flex items-center gap-1 text-xs",
                      passwordErrors.includes(req) ? "text-red-500" : "text-green-600"
                    )}>
                      {passwordErrors.includes(req) ? <AlertCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                      {req}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-slate-700">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="••••••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-11 bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-200"
              />
            </div>

            <Button 
                onClick={handleSetupStep1} 
                className="w-full h-11 bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!adminName || !adminEmail || !adminPassword || !confirmPassword || passwordErrors.length > 0 || adminPassword !== confirmPassword || isLoading}
            >
              {isLoading ? "Creating Admin..." : "Continue"}
            </Button>
          </div>
        )}

        {setupStep === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold mb-1 text-slate-900">Upload License</h2>
              <p className="text-sm text-slate-500">Upload your cryptographically signed license file</p>
            </div>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
                isDragging ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-blue-400 hover:bg-slate-50",
                licenseFile && "border-blue-500 bg-blue-50"
              )}
              onClick={() => document.getElementById("license-input")?.click()}
            >
              <input
                id="license-input"
                type="file"
                accept=".lic"
                className="hidden"
                onChange={handleFileSelect}
              />
              <Upload className={cn("w-10 h-10 mx-auto mb-3", licenseFile ? "text-blue-600" : "text-slate-400")} />
              {licenseFile ? (
                <div>
                  <p className="font-medium text-blue-700">{licenseFile.name}</p>
                  <p className="text-xs text-slate-500 mt-1">Click or drag to replace</p>
                </div>
              ) : (
                <div>
                  <p className="font-medium text-slate-700">Drop license file here</p>
                  <p className="text-xs text-slate-500 mt-1">or click to browse (.lic)</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setSetupStep(1)} className="flex-1 h-11">Back</Button>
              <Button 
                onClick={handleSetupStep2} 
                className="flex-1 h-11 bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!licenseFile || isLoading}
              >
                {isLoading ? "Verifying..." : "Continue"}
              </Button>
            </div>
          </div>
        )}

        {setupStep === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold mb-1 text-slate-900">SSO Configuration</h2>
              <p className="text-sm text-slate-500">Configure OpenID Connect for Government SSO</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="issuer-url" className="text-slate-700">OIDC Issuer URL</Label>
              <Input
                id="issuer-url"
                type="url"
                placeholder="https://sso.agency.gov/realms/main"
                value={oidcIssuerUrl}
                onChange={(e) => setOidcIssuerUrl(e.target.value)}
                className="h-11 bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-200 text-slate-900"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client-id" className="text-slate-700">Client ID</Label>
              <Input
                id="client-id"
                type="text"
                placeholder="fortress-client"
                value={oidcClientId}
                onChange={(e) => setOidcClientId(e.target.value)}
                className="h-11 bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-200 text-slate-900"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client-secret" className="text-slate-700">Client Secret</Label>
              <Input
                id="client-secret"
                type="password"
                placeholder="••••••••••••••••••••"
                value={oidcClientSecret}
                onChange={(e) => setOidcClientSecret(e.target.value)}
                className="h-11 bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-200 text-slate-900"
              />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setSetupStep(2)} className="w-[80px] h-11 shrink-0">Back</Button>
              <Button variant="ghost" onClick={() => setSetupStep(4)} className="flex-1 h-11 text-slate-500 hover:text-slate-700 hover:bg-slate-100">Skip SSO</Button>
              <Button 
                onClick={handleSetupStep3} 
                className="flex-1 h-11 bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!oidcClientId || !oidcClientSecret || !oidcIssuerUrl || isLoading}
              >
                {isLoading ? "Configuring..." : "Configure SSO"}
              </Button>
            </div>
          </div>
        )}

        {setupStep === 4 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold mb-1 text-slate-900">Infrastructure</h2>
              <p className="text-sm text-slate-500">Configure local AI and vector database endpoints</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ollama-url" className="flex items-center gap-2 text-slate-700">
                <Server className="w-4 h-4" /> Ollama Endpoint
              </Label>
              <Input
                id="ollama-url"
                type="url"
                placeholder="http://localhost:11434"
                value={ollamaUrl}
                onChange={(e) => setOllamaUrl(e.target.value)}
                className="h-11 bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-200 text-slate-900 font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="chroma-url" className="flex items-center gap-2 text-slate-700">
                <Key className="w-4 h-4" /> ChromaDB Endpoint
              </Label>
              <Input
                id="chroma-url"
                type="url"
                placeholder="http://localhost:8000"
                value={chromaUrl}
                onChange={(e) => setChromaUrl(e.target.value)}
                className="h-11 bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-200 text-slate-900 font-mono text-sm"
              />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setSetupStep(3)} className="flex-1 h-11 border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900">Back</Button>
              <Button 
                onClick={handleSetupComplete} 
                disabled={!ollamaUrl || !chromaUrl || isLoading} 
                className="flex-1 h-11 bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Configuring..." : "Complete Setup"}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Security Note */}
      <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 border border-blue-100 mt-6">
        <Lock className="w-4 h-4 text-blue-600 flex-shrink-0" />
        <p className="text-xs text-blue-700 font-medium">
          All configuration is encrypted and stored locally on this server
        </p>
      </div>
    </div>
  );

  const renderLoginForm = () => (
    <div className="w-full max-w-xl space-y-8 animate-fade-in p-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex flex-col items-center justify-center gap-4 mb-6">
          <div className="p-3 rounded-2xl">
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
          <div className="space-y-1">
            <h1 className="text-3xl font-persis font-bold text-slate-900 tracking-tight">Fortress AI</h1>
            <p className="text-sm font-medium text-slate-500 border-t border-slate-200 pt-1 mt-1 mx-auto w-fit px-4">SECURE WORKSPACE</p>
          </div>
        </div>
        <p className="text-slate-600 font-medium">
          Sign in to access your secure environment
        </p>
      </div>

      {/* Identity-first Form */}
      <div className="space-y-6">
        <div className="space-y-4">
            <div className="space-y-2 text-left">
            <Label htmlFor="email" className="text-sm font-semibold text-slate-700">
                Email / Username
            </Label>
            <Input
                id="email"
                type="text"
                placeholder="username or email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 bg-white rounded-xl border-slate-300 focus:border-blue-500 focus:ring-blue-200 text-slate-900 placeholder:text-slate-400"
            />
            </div>
             <div className="space-y-2 text-left">
            <Label htmlFor="password" className="text-sm font-semibold text-slate-700">
                Password
            </Label>
            <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 bg-white rounded-xl border-slate-300 focus:border-blue-500 focus:ring-blue-200 text-slate-900 placeholder:text-slate-400"
            />
            </div>
        </div>

        <div className="space-y-4">
        <Button
            onClick={handleLocalLogin}
            className="w-full h-12 bg-blue-500 rounded-xl hover:bg-blue-600 text-white font-semibold shadow-lg shadow-blue-900/20 transition-all hover:scale-[1.02]"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing In...
              </span>
            ) : (
              "Sign In"
            )}
          </Button>
        </div>
      </div>

      {/* Security Note */}
      <div className="flex items-center justify-center gap-2 py-4">
        <Lock className="w-3 h-3 text-slate-400" />
        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
          End-to-End Encrypted Session
        </p>
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-slate-400/80">
        By logging in, you agree to the Enterprise Security Policy and Terms of Use.
      </p>
    </div>
  );

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 font-sans">
      <div className="w-full flex flex-col items-center justify-center p-4">
        {isFirstRun ? renderSetupWizard() : renderLoginForm()}
        
         {!isFirstRun && (
            <div className="mt-8 text-center animate-fade-in animation-delay-500">
               <p className="text-slate-400 text-xs font-mono font-medium tracking-wide">SECURED BY FORTRESS AI</p>
            </div>
         )}
      </div>

      <WelcomeModal open={showWelcome} onOpenChange={setShowWelcome} />
    </div>
  );
};

export default LoginPage;
