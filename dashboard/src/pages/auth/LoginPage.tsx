import { useState, useEffect } from "react";
import { 
  Shield, 
  Lock, 
  Upload, 
  Server, 
  Key, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  ArrowRight,
  Eye,
  EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";
import { WelcomeModal } from "@/components/WelcomeModal";

type SetupStep = 1 | 2 | 3 | 4;

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFirstRun, setIsFirstRun] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  
  // Setup Wizard State
  const [setupStep, setSetupStep] = useState<SetupStep>(1);
  const [showWelcome, setShowWelcome] = useState(false);
  
  // Step 1: Admin
  const [adminName, setAdminName] = useState("");
  const [adminUsername, setAdminUsername] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  
  // Step 2: License
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Step 3: SSO
  const [oidcClientId, setOidcClientId] = useState("");
  const [oidcClientSecret, setOidcClientSecret] = useState("");
  const [oidcIssuerUrl, setOidcIssuerUrl] = useState("");
  
  // Step 4: Infra
  const [ollamaUrl, setOllamaUrl] = useState("http://localhost:11434");
  const [chromaUrl, setChromaUrl] = useState("http://localhost:8000");
  
  const navigate = useNavigate();

  useEffect(() => {
    const checkSetupStatus = async () => {
      try {
        const response = await fetch(`${API_BASE}/setup/status`);
        if (response.ok) {
          const data = await response.json();
          // setIsFirstRun(!data.completed); // Uncomment for production
          // For dev, if setup is not completed, launch wizard
          if (!data.completed && data.step) {
             setIsFirstRun(true);
             setSetupStep(data.step);
          } else {
             setIsFirstRun(false);
          }
        }
      } catch (error) {
        console.error("Backend unreachable", error);
        // Default to login if backend unavailable? Or maybe show error screen.
      } finally {
        setCheckingStatus(false);
      }
    };
    checkSetupStatus();
  }, []);

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    if (password.length < 12) errors.push("At least 12 chars");
    if (!/[A-Z]/.test(password)) errors.push("Uppercase letter");
    if (!/[a-z]/.test(password)) errors.push("Lowercase letter");
    if (!/[0-9]/.test(password)) errors.push("Number");
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push("Special character");
    return errors;
  };

  const handlePasswordChange = (value: string) => {
    setAdminPassword(value);
    setPasswordErrors(validatePassword(value));
  };

  const handleLocalLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email || !password) {
        toast({ title: "Required Fields", description: "Please enter your username and password", variant: "destructive" });
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
      toast({ title: "Authenticated", description: "Welcome to Fortress." });
      navigate("/dashboard");
    } catch (error) {
      toast({ title: "Access Denied", description: "Invalid credentials provided.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetupStep1 = async () => {
    if (!adminName || !adminUsername || !adminEmail || !adminPassword || !confirmPassword) return;
    if (passwordErrors.length > 0 || adminPassword !== confirmPassword) return;

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
      setSetupStep(2);
    } catch (error: any) {
        toast({ title: "Creation Failed", description: error.message, variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };

  const handleSetupStep2 = async () => {
    if (!licenseFile) return;

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
      setSetupStep(3);
    } catch (error) {
      toast({ title: "License Invalid", description: "Could not verify the provided license file.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetupStep3 = async () => {
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
        toast({ title: "Configuration Error", description: "Failed to save SSO settings.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };

  const handleSetupComplete = async () => {
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

        const completeRes = await fetch(`${API_BASE}/setup/complete`, { method: "POST" });
        if (!completeRes.ok) throw new Error("Failed to finalize setup");

        localStorage.setItem("fortress_setup_just_completed", "true");
        setIsFirstRun(false);
        setShowWelcome(true);
    } catch (error) {
         toast({ title: "Setup Error", description: "Could not finalize system configuration.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };

  // UI Components
  if (checkingStatus) {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-4 selection:bg-blue-100">
      {isFirstRun ? (
        // **********************
        // SETUP WIZARD
        // **********************
        <div className="w-full max-w-2xl animate-in fade-in zoom-in-95 duration-500">
            <div className="text-center mb-8">
                 <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-900/20 mb-4 ring-4 ring-blue-50">
                    <Shield className="w-6 h-6" />
                 </div>
                 <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Initialization</h1>
                 <p className="text-slate-500 mt-1 font-medium text-sm">Configure your Fortress environment</p>
            </div>

            <Card className="border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
                <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-6">
                     <div className="flex items-center justify-between px-4">
                         {[1, 2, 3, 4].map((step) => (
                             <div key={step} className="flex flex-col items-center gap-2 relative z-10 group">
                                 <div className={cn(
                                     "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 border-2",
                                     setupStep > step ? "bg-green-500 border-green-500 text-white" : 
                                     setupStep === step ? "bg-blue-600 border-blue-600 text-white scale-110 shadow-md shadow-blue-500/20" : 
                                     "bg-white border-slate-200 text-slate-400"
                                 )}>
                                     {setupStep > step ? <CheckCircle2 className="w-4 h-4" /> : step}
                                 </div>
                                 <span className={cn(
                                     "text-[10px] font-bold uppercase tracking-wider transition-colors duration-300",
                                     setupStep === step ? "text-blue-700" : "text-slate-400"
                                 )}>
                                     {step === 1 ? "Admin" : step === 2 ? "License" : step === 3 ? "SSO" : "Infra"}
                                 </span>
                             </div>
                         ))}
                         {/* Progress Line */}
                         <div className="absolute left-[15%] right-[15%] top-[5.25rem] h-0.5 bg-slate-100 -z-0 hidden md:block" />
                     </div>
                </CardHeader>

                <CardContent className="pt-8 px-8 min-h-[420px]">
                    {setupStep === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
                            <div className="space-y-1">
                                <h2 className="text-lg font-semibold text-slate-900">Create Administrator</h2>
                                <p className="text-sm text-slate-500">Establish the root account for this installation.</p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Full Name</Label>
                                    <Input placeholder="John Doe" value={adminName} onChange={e => setAdminName(e.target.value)} className="bg-slate-50 border-slate-200 focus:bg-white transition-colors" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Username</Label>
                                    <Input placeholder="admin" value={adminUsername} onChange={e => setAdminUsername(e.target.value)} className="bg-slate-50 border-slate-200 focus:bg-white transition-colors" />
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <Label>Email Address</Label>
                                <Input type="email" placeholder="admin@org.gov" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} className="bg-slate-50 border-slate-200 focus:bg-white transition-colors" />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Password</Label>
                                    <Input type="password" value={adminPassword} onChange={e => handlePasswordChange(e.target.value)} className="bg-slate-50 border-slate-200 focus:bg-white transition-colors" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Confirm</Label>
                                    <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="bg-slate-50 border-slate-200 focus:bg-white transition-colors" />
                                </div>
                            </div>
                            
                            {adminPassword && (
                                <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-slate-50 border border-slate-100">
                                    {["At least 12 chars", "Uppercase letter", "Lowercase letter", "Number", "Special character"].map((req, i) => {
                                        const isMet = !passwordErrors.includes(req);
                                        return (
                                        <div key={i} className={cn("flex items-center gap-1.5 text-[10px] font-medium transition-colors duration-200", isMet ? "text-emerald-600" : "text-slate-400")}>
                                            {isMet ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-200 mx-0.5" />}
                                            {req}
                                        </div>
                                    )})}
                                </div>
                            )}
                        </div>
                    )}

                    {setupStep === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
                            <div className="space-y-1">
                                <h2 className="text-lg font-semibold text-slate-900">Upload License</h2>
                                <p className="text-sm text-slate-500">Verify your enterprise deployment key.</p>
                            </div>
                            
                            <div 
                                className={cn(
                                    "border-2 border-dashed rounded-xl p-10 text-center transition-all duration-200 cursor-pointer group",
                                    isDragging ? "border-blue-500 bg-blue-50/50 scale-[1.02]" : "border-slate-200 hover:border-blue-400 hover:bg-slate-50",
                                    licenseFile && "border-blue-500 bg-blue-50/10 ring-1 ring-blue-500/20 border-solid"
                                )}
                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    setIsDragging(false);
                                    if(e.dataTransfer.files[0]?.name.endsWith('.lic')) setLicenseFile(e.dataTransfer.files[0]);
                                }}
                                onClick={() => document.getElementById('lic-upload')?.click()}
                            >
                                <input id="lic-upload" type="file" accept=".lic" className="hidden" onChange={e => e.target.files?.[0] && setLicenseFile(e.target.files[0])} />
                                <div className={cn(
                                    "p-4 rounded-full w-fit mx-auto shadow-sm border mb-4 transition-colors duration-200",
                                    licenseFile ? "bg-white border-blue-100 text-blue-600" : "bg-white border-slate-100 text-slate-400 group-hover:text-blue-500 group-hover:border-blue-200"
                                )}>
                                    <Upload className="w-6 h-6" />
                                </div>
                                {licenseFile ? (
                                    <div className="animate-in fade-in zoom-in duration-300">
                                        <p className="font-semibold text-blue-900">{licenseFile.name}</p>
                                        <p className="text-xs text-blue-600/80 mt-1 font-medium">Ready to verify</p>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="font-medium text-slate-900">Click to upload license</p>
                                        <p className="text-xs text-slate-500 mt-1">or drag and drop .lic file</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {setupStep === 3 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
                            <div className="space-y-1">
                                <h2 className="text-lg font-semibold text-slate-900">Single Sign-On (Optional)</h2>
                                <p className="text-sm text-slate-500">Configure OIDC for centralized identity management.</p>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Issuer URL</Label>
                                    <Input placeholder="https://auth.agency.gov" value={oidcIssuerUrl} onChange={e => setOidcIssuerUrl(e.target.value)} className="bg-slate-50 border-slate-200 focus:bg-white transition-colors" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Client ID</Label>
                                    <Input placeholder="fortress-app" value={oidcClientId} onChange={e => setOidcClientId(e.target.value)} className="bg-slate-50 border-slate-200 focus:bg-white transition-colors" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Client Secret</Label>
                                    <Input type="password" placeholder="••••••••" value={oidcClientSecret} onChange={e => setOidcClientSecret(e.target.value)} className="bg-slate-50 border-slate-200 focus:bg-white transition-colors" />
                                </div>
                            </div>
                            
                             <Alert className="bg-blue-50 border-blue-100 text-blue-800">
                                <AlertCircle className="h-4 w-4 text-blue-600" />
                                <AlertDescription className="text-xs font-medium ml-2">
                                    You can skip this step and configure SSO later in system settings.
                                </AlertDescription>
                            </Alert>
                        </div>
                    )}

                    {setupStep === 4 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
                            <div className="space-y-1">
                                <h2 className="text-lg font-semibold text-slate-900">Connect Infrastructure</h2>
                                <p className="text-sm text-slate-500">Link external AI services.</p>
                            </div>
                            
                            <div className="space-y-4 bg-slate-50 p-6 rounded-xl border border-slate-100">
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2 text-slate-700">
                                        <Server className="w-4 h-4 text-slate-400" /> 
                                        Ollama API Endpoint
                                    </Label>
                                    <Input className="font-mono text-xs bg-white" value={ollamaUrl} onChange={e => setOllamaUrl(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2 text-slate-700">
                                        <Key className="w-4 h-4 text-slate-400" /> 
                                        ChromaDB API Endpoint
                                    </Label>
                                    <Input className="font-mono text-xs bg-white" value={chromaUrl} onChange={e => setChromaUrl(e.target.value)} />
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
                
                <CardFooter className="bg-slate-50/50 border-t border-slate-100 p-6 flex justify-between items-center">
                    {setupStep > 1 ? (
                        <Button variant="outline" onClick={() => setSetupStep(prev => (prev - 1) as SetupStep)} className="text-slate-600 hover:text-slate-900">Back</Button>
                    ) : <div />}
                    
                    <div className="flex gap-3">
                        {setupStep === 3 && (
                            <Button variant="ghost" onClick={() => setSetupStep(4)} className="text-slate-500 hover:text-slate-800">Skip SSO</Button>
                        )}
                        <Button 
                            className="bg-blue-600 hover:bg-blue-700 min-w-[140px] shadow-md shadow-blue-500/20" 
                            disabled={isLoading || (setupStep === 1 && (!adminName || passwordErrors.length > 0)) || (setupStep === 2 && !licenseFile)}
                            onClick={() => {
                                if (setupStep === 1) handleSetupStep1();
                                else if (setupStep === 2) handleSetupStep2();
                                else if (setupStep === 3) handleSetupStep3();
                                else handleSetupComplete();
                            }}
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : setupStep === 4 ? "Complete Setup" : "Continue"}
                            {!isLoading && setupStep !== 4 && <ArrowRight className="w-4 h-4 ml-2" />}
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </div>
      ) : (
        // **********************
        // LOGIN FORM
        // **********************
        <div className="w-full max-w-sm animate-in fade-in zoom-in-95 duration-500">
             <div className="text-center mb-8">
                 <div className="mb-4 flex justify-center">
                    <Logo size={48} />
                 </div>
                 <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Fortress AI</h1>
                 <p className="text-slate-500 text-sm mt-1 font-medium">Secure Workspace Access</p>
            </div>
            
            <Card className="overflow-hidden border-none shadow-none bg-transparent">
                <form onSubmit={handleLocalLogin}>
                    <CardHeader className="space-y-1 pb-6 px-0">
                        <CardTitle className="text-lg font-bold text-slate-800">Sign In</CardTitle>
                        <CardDescription className="text-slate-500 text-xs">Enter your credentials to verify identity.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5 pt-0 px-0">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Username</Label>
                            <Input 
                                id="email" 
                                placeholder="name@agency.gov" 
                                value={email} 
                                onChange={e => setEmail(e.target.value)} 
                                className="bg-slate-50 border-slate-200 focus:bg-white transition-all duration-200 h-10"
                            />
                        </div>
                        <div className="space-y-2">
                             <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Password</Label>
                            </div>
                            <div className="relative">
                                <Input 
                                    id="password" 
                                    type={showPassword ? "text" : "password"} 
                                    value={password} 
                                    onChange={e => setPassword(e.target.value)} 
                                    className="bg-slate-50 border-slate-200 focus:bg-white transition-all duration-200 h-10 pr-10"
                                />
                                <button 
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="pt-2 pb-6 px-0">
                        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 h-10 shadow-md shadow-blue-500/20 font-semibold transition-all hover:scale-[1.01]" disabled={isLoading}>
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
                            {isLoading ? "Verifying..." : "Sign In"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>

            <div className="mt-8 text-center flex items-center justify-center gap-2 text-[10px] text-slate-400 font-bold tracking-widest uppercase">
                <Shield className="w-3 h-3" />
                <span>End-to-End Encrypted Session</span>
            </div>
            
            <div className="mt-4 text-center">
                <p className="text-[10px] text-slate-400/80 max-w-[250px] mx-auto leading-tight">
                    By logging in, you agree to the Enterprise Security Policy and Acceptable Use Standards.
                </p>
            </div>
        </div>
      )}

      <WelcomeModal open={showWelcome} onOpenChange={setShowWelcome} />
    </div>
  );
};

export default LoginPage;
