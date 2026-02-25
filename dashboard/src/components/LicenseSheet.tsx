import { useState, useEffect } from "react";
import { Upload, CheckCircle, Clock, XCircle, AlertTriangle, Shield, Calendar, Key, Users, Building, FileCheck, RefreshCw } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useLicense } from "@/contexts/LicenseContext";
import { differenceInHours, differenceInMinutes, differenceInDays } from "date-fns";

const API_BASE = "http://localhost:8000/api";

const ExpiryCountdown = ({ expiryDate }: { expiryDate: string }) => {
    const [timeLeft, setTimeLeft] = useState<{days: number, hours: number, minutes: number} | null>(null);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date();
            const expiry = new Date(expiryDate);
            const diff = expiry.getTime() - now.getTime();
            
            if (diff <= 0) {
                setTimeLeft(null);
                return;
            }
            
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            
            setTimeLeft({ days, hours, minutes });
        };
        
        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 60000); // Update every minute
        return () => clearInterval(timer);
    }, [expiryDate]);

    if (!timeLeft) return <p className="text-sm font-semibold text-destructive">Expired</p>;

    if (timeLeft.days > 3) {
        return <p className="text-sm opacity-90">{timeLeft.days} days remaining until expiration.</p>;
    }

    return (
        <div className="flex flex-col gap-1">
             <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                Expires in {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m
             </p>
             <p className="text-xs text-muted-foreground">Renew immediately to avoid interruption.</p>
        </div>
    );
};

// Use types from context if possible or keep local if simple matching
// For now, mapping context data to local structure or using context directly
// Context LicenseData is slightly different structure perhaps? No, I made them match closely.

interface LicenseSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const LicenseSheet = ({ isOpen, onClose }: LicenseSheetProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Use context
  const { license, isLoading, refreshLicense } = useLicense();
  
  // Helper to map context license to local expected format if needed, but looks compatible.
  const licenseData = license; 

  const getStatusConfig = () => {
    const status = licenseData?.status || "none";
    switch (status) {
      case "active":
        return { icon: CheckCircle, label: "Active", className: "bg-green-50 text-green-700 border-green-200" };
      case "expiring":
        return { icon: Clock, label: "Expiring Soon", className: "bg-yellow-50 text-yellow-700 border-yellow-200" };
      case "expired":
        return { icon: XCircle, label: "Expired", className: "bg-red-50 text-red-700 border-red-200" };
      default:
        return { icon: AlertTriangle, label: "No License", className: "bg-slate-50 text-slate-700 border-slate-200" };
    }
  };

  const statusConfig = getStatusConfig();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleUpload(files[0]);
    }
  };

  const handleFileSelect = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".lic,.key,.license";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handleUpload(file);
      }
    };
    input.click();
  };

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    try {
        const fileContent = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result as string;
                // We send the raw text content. The backend handles if it needs decoding or parsing.
                // Assuming the .lic file contains the license string (base64) directly.
                resolve(result);
            };
            reader.onerror = reject;
            reader.readAsText(file);
        });

        const res = await fetch(`${API_BASE}/system/license`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ file_content: fileContent })
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || "Upload failed");
        }
        
        toast({
            title: "License Updated",
            description: `${file.name} has been processed successfully.`,
        });
        refreshLicense(); // Refresh data
        onClose();
    } catch (error: any) {
        toast({
            title: "Update Failed",
            description: error.message,
            variant: "destructive"
        });
    } finally {
        setIsUploading(false);
    }
  };

  // Safe user percentage
  const userPercentage = licenseData ? Math.min((licenseData.activeUsers / licenseData.maxUsers) * 100, 100) : 0;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-[600px] w-[90vw] overflow-y-auto">
        <SheetHeader className="pb-6 border-b mb-6">
          <SheetTitle className="flex items-center gap-3 text-xl">
            <div className="w-10 h-10">
               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" className="w-full h-full">
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
            Enterprise License Details
          </SheetTitle>
          <SheetDescription>
            View and manage your organization's license entitlements and validity.
          </SheetDescription>
        </SheetHeader>

        {!licenseData && !isLoading ? (
            <div className="py-10 text-center space-y-4">
                <AlertTriangle className="w-12 h-12 mx-auto text-yellow-500 mb-2" />
                <h3 className="text-lg font-medium">No valid license found</h3>
                <p className="text-sm text-muted-foreground px-6">Upload a valid license file to activate enterprise features.</p>
                <Button onClick={handleFileSelect}>Upload License</Button>
            </div>
        ) : (
        <div className="space-y-6">
          {/* Status Card */}
          <div className={cn("p-4 rounded-lg border flex items-start gap-4", statusConfig.className)}>
            <statusConfig.icon className="w-5 h-5 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <h3 className="font-semibold">{statusConfig.label}</h3>
              {licenseData?.expiryDate ? (
                  <ExpiryCountdown expiryDate={licenseData.expiryDate} />
              ) : (licenseData?.daysRemaining !== undefined && (
                  <p className="text-sm opacity-90">
                    {licenseData.daysRemaining >= 0 
                      ? `${licenseData.daysRemaining} days remaining until expiration.` 
                      : `License expired ${Math.abs(licenseData.daysRemaining)} days ago.`}
                  </p>
              ))}
            </div>
          </div>

          {/* Details */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">License Parameters</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-secondary/30 border border-border/50 rounded-lg space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                  <Building className="w-3.5 h-3.5" />
                  Organization
                </div>
                <p className="font-semibold text-base truncate" title={licenseData?.organization}>{licenseData?.organization}</p>
              </div>

              <div className="p-4 bg-secondary/30 border border-border/50 rounded-lg space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                  <FileCheck className="w-3.5 h-3.5" />
                  Plan Type
                </div>
                <div className="flex items-center gap-2">
                    <p className="font-semibold text-base">{licenseData?.type}</p>
                    <Badge variant="outline" className="text-[10px] h-5 px-1.5 uppercase font-mono">Enterprise</Badge>
                </div>
              </div>

              <div className="p-4 bg-secondary/30 border border-border/50 rounded-lg space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                  <Calendar className="w-3.5 h-3.5" />
                  Issued Date
                </div>
                <p className="font-medium font-mono text-sm">{licenseData?.issuedDate || "N/A"}</p>
              </div>

              <div className="p-4 bg-secondary/30 border border-border/50 rounded-lg space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                  <Clock className="w-3.5 h-3.5" />
                  Expiry Date
                </div>
                <p className="font-medium font-mono text-sm">{licenseData?.expiryDate}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Usage */}
          <div className="space-y-3">
             <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Usage Limits</h4>
             </div>
             
             <div className="space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        Active Users
                    </span>
                    <span className="font-medium">
                        {licenseData?.activeUsers} / {licenseData?.maxUsers === -1 ? "Unlimited" : licenseData?.maxUsers}
                    </span>
                </div>
                <Progress value={userPercentage} className="h-2" />
             </div>
          </div>

          <Separator />

          {/* Features */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Entitlements</h4>
            <div className="grid grid-cols-1 gap-2">
                {licenseData?.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        {feature}
                    </div>
                ))}
            </div>
          </div>
        </div>
        )}

        <Separator className="my-6" />

        {/* Upload Section */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Update License</h4>
          
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleFileSelect}
            className={cn(
              "border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer hover:bg-secondary/50",
              isDragging ? "border-blue-500 bg-blue-50/50" : "border-muted-foreground/25",
              isUploading && "pointer-events-none opacity-60"
            )}
          >
            {isUploading ? (
              <div className="flex flex-col items-center gap-2 py-2">
                <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                <p className="text-sm font-medium">Verifying signature...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="p-3 bg-secondary rounded-full">
                  <Upload className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-sm">Click or drag new license file</p>
                  <p className="text-xs text-muted-foreground mt-1">Supports .lic files (signed JSON)</p>
                </div>
              </div>
            )}
          </div>
          
          <p className="text-xs text-center text-muted-foreground">
            License keys are cryptographically signed and verified securely on the server.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default LicenseSheet;
