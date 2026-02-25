import { useState } from "react";
import { X, Upload, CheckCircle, Clock, XCircle, AlertTriangle, Shield, Calendar, Key, Users, Building, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useLicense } from "@/contexts/LicenseContext";
import { useToast } from "@/components/ui/use-toast";

type LicenseStatus = "active" | "expiring" | "expired" | "invalid";

interface LicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LicenseModal = ({ isOpen, onClose }: LicenseModalProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { license, refreshLicense } = useLicense();
  const { toast } = useToast();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await processFile(files[0]);
    }
  };

  const handleFileSelect = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".lic,.key,.license,.txt";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        await processFile(file);
      }
    };
    input.click();
  };

  const processFile = async (file: File) => {
    setIsUploading(true);
    try {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const content = e.target?.result as string;
            // Content might be plain text or base64 depending on file. 
            // If it's a binary file read as text, it might be garbage.
            // But license files are usually text (base64 encoded).
            
            // If the user uploads a binary file, we might need readAsDataURL and strip header.
            // Assuming license file is text content (the base64 string itself).
            
            // Let's try to detect if it's the raw base64 string vs a file that needs encoding
            // The backend expects the base64 content of the license payload.
            // If the .lic file contains the base64 string directly (which is standard for this app based on verify_license.py),
            // then we just send that string.
            
            // However, LicenseUpdate model expects `file_content` to be the base64 string.
            // If the file content IS the base64 string, we send it as is? 
            // Or should we base64 encode the file content? 
            // backend: decoded_bytes = base64.b64decode(file_content_b64)
            // So backend expects a base64 encoded string.
            // If the file content is "ewogIC..." (already base64), and we send "ewogIC...", 
            // backend decodes it to original JSON.
            
            // But if the file content is raw JSON (not base64), backend decode will fail or return garbage.
            // `verify_license.py` reads file content and does `base64.b64decode(license_content)`.
            // So the file on disk IS base64 encoded.
            // We should send the file content AS IS (which is a base64 string).
            
            // BUT, `LicenseUpdate` in system.py takes `file_content`.
            // And system.py does `base64.b64decode(file_content_b64)`.
            // So we just send the text content of the file.
            
            // Wait, if we use `readAsText`, we get the string.
            // If we send that string, backend decodes it. Correct.
            
            const fileContent = content.trim();

            try {
                const response = await fetch("/api/system/license", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ file_content: fileContent }),
                });

                const data = await response.json();

                if (!response.ok) {
                    if (response.status === 403) {
                         toast({
                            title: "License Rejected",
                            description: data.detail || "Organization mismatch. License revoked.",
                            variant: "destructive"
                        });
                    } else {
                        throw new Error(data.detail || "Failed to update license");
                    }
                } else {
                    toast({
                        title: "Success",
                        description: "License updated successfully.",
                        variant: "default" // success variant isn't standard in shadcn usually, default is fine
                    });
                    refreshLicense();
                    onClose();
                }
            } catch (error: any) {
                toast({
                    title: "Error",
                    description: error.message,
                    variant: "destructive"
                });
            }
        };
        reader.readAsText(file);
    } catch (error) {
        console.error("File processing error:", error);
        toast({
            title: "Error",
            description: "Failed to read file.",
            variant: "destructive"
        });
    } finally {
        setIsUploading(false);
    }
  };

  if (!license) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-primary" />
            License Management
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status and Type Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className={cn(
                  "gap-1",
                  license.status === 'active' ? "border-green-500 text-green-500" : 
                  license.status === 'expired' ? "border-red-500 text-red-500" : "border-yellow-500 text-yellow-500"
              )}>
                {license.status === 'active' && <CheckCircle className="h-3 w-3" />}
                {license.status === 'expired' && <XCircle className="h-3 w-3" />}
                {license.status === 'expiring' && <Clock className="h-3 w-3" />}
                {license.status.toUpperCase()}
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Building className="h-3 w-3" />
                {license.type}
              </Badge>
            </div>
          </div>

          <Separator className="bg-border" />

          {/* License Details Grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs">Organization</p>
              <p className="font-medium">{license.organization}</p>
            </div>
            {/* 
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs">License Key</p>
              <p className="font-mono text-xs truncate" title="Hidden">••••••••••••••••</p>
            </div> 
            */}
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-muted-foreground text-xs">
                <Calendar className="h-3 w-3" />
                Issued Date
              </div>
              <p className="font-medium">{license.issuedDate ? new Date(license.issuedDate).toLocaleDateString() : 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-muted-foreground text-xs">
                <Calendar className="h-3 w-3" />
                Expiry Date
              </div>
              <p className={cn(
                "font-medium",
                license.status === "expiring" && "text-warning",
                license.status === "expired" && "text-destructive"
              )}>
                {license.expiryDate ? new Date(license.expiryDate).toLocaleDateString() : 'Never'}
              </p>
            </div>
             <div className="space-y-1">
              <p className="text-muted-foreground text-xs">Days Remaining</p>
              <p className="font-medium">{license.daysRemaining}</p>
            </div>
          </div>

          <Separator className="bg-border" />

          {/* User Access */}
          <div className="space-y-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
               Resource Usage
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">{license.activeUsers} / {license.maxUsers} GPUs</span>
              <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${Math.min((license.activeUsers / license.maxUsers) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Key className="h-3 w-3" />
              Licensed Features
            </div>
            <div className="flex flex-wrap gap-1.5">
              {license.features?.map((feature) => (
                <Badge key={feature} variant="secondary" className="text-xs">
                  {feature}
                </Badge>
              ))}
            </div>
          </div>

          <Separator className="bg-border" />

          {/* Upload New License */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Update License</p>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={isUploading ? undefined : handleFileSelect}
              className={cn(
                "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors",
                isDragging 
                  ? "border-primary bg-primary/5" 
                  : "border-border hover:border-muted-foreground",
                isUploading && "opacity-50 cursor-not-allowed"
              )}
            >
                {isUploading ? (
                    <div className="flex flex-col items-center justify-center py-2">
                        <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
                        <p className="text-xs text-muted-foreground">Verifying and updating...</p>
                    </div>
                ) : (
                    <>
                        <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">
                            Drag & drop license file or click to browse
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                            Supports .lic files
                        </p>
                    </>
                )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={onClose} disabled={isUploading}>
              Close
            </Button>
            <Button size="sm" onClick={handleFileSelect} disabled={isUploading}>
              <Upload className="h-3.5 w-3.5 mr-1.5" />
              Upload License
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LicenseModal;
