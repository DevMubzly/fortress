import { useState } from "react";
import { X, Upload, CheckCircle, Clock, XCircle, AlertTriangle, Shield, Calendar, Key, Users, Building } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type LicenseStatus = "active" | "expiring" | "expired" | "invalid";

interface LicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LicenseModal = ({ isOpen, onClose }: LicenseModalProps) => {
  const [isDragging, setIsDragging] = useState(false);

  // Mock license data
  const licenseData = {
    status: "active" as LicenseStatus,
    type: "Enterprise",
    organization: "Acme Corporation",
    issuedDate: "2024-01-15",
    expiryDate: "2025-01-15",
    licenseKey: "FORT-XXXX-XXXX-XXXX-1234",
    maxUsers: 100,
    activeUsers: 45,
    features: ["API Gateway", "Rate Limiting", "Analytics", "Load Balancing", "SSL Termination"],
  };

  const getStatusBadge = () => {
    switch (licenseData.status) {
      case "active":
        return (
          <Badge className="bg-success/20 text-success border-success/30 gap-1">
            <CheckCircle className="h-3 w-3" />
            Active
          </Badge>
        );
      case "expiring":
        return (
          <Badge className="bg-warning/20 text-warning border-warning/30 gap-1">
            <Clock className="h-3 w-3" />
            Expiring Soon
          </Badge>
        );
      case "expired":
        return (
          <Badge className="bg-destructive/20 text-destructive border-destructive/30 gap-1">
            <XCircle className="h-3 w-3" />
            Expired
          </Badge>
        );
      case "invalid":
        return (
          <Badge className="bg-destructive/20 text-destructive border-destructive/30 gap-1">
            <AlertTriangle className="h-3 w-3" />
            Invalid
          </Badge>
        );
    }
  };

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
    // Handle file upload
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      console.log("License file dropped:", files[0].name);
    }
  };

  const handleFileSelect = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".lic,.key,.license";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        console.log("License file selected:", file.name);
      }
    };
    input.click();
  };

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
              {getStatusBadge()}
              <Badge variant="outline" className="gap-1">
                <Building className="h-3 w-3" />
                {licenseData.type}
              </Badge>
            </div>
          </div>

          <Separator className="bg-border" />

          {/* License Details Grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs">Organization</p>
              <p className="font-medium">{licenseData.organization}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs">License Key</p>
              <p className="font-mono text-xs">{licenseData.licenseKey}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-muted-foreground text-xs">
                <Calendar className="h-3 w-3" />
                Issued Date
              </div>
              <p className="font-medium">{licenseData.issuedDate}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-muted-foreground text-xs">
                <Calendar className="h-3 w-3" />
                Expiry Date
              </div>
              <p className={cn(
                "font-medium",
                licenseData.status === "expiring" && "text-warning",
                licenseData.status === "expired" && "text-destructive"
              )}>
                {licenseData.expiryDate}
              </p>
            </div>
          </div>

          <Separator className="bg-border" />

          {/* User Access */}
          <div className="space-y-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              User Access
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">{licenseData.activeUsers} / {licenseData.maxUsers} users</span>
              <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${(licenseData.activeUsers / licenseData.maxUsers) * 100}%` }}
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
              {licenseData.features.map((feature) => (
                <Badge key={feature} variant="secondary" className="text-xs">
                  {feature}
                </Badge>
              ))}
            </div>
          </div>

          <Separator className="bg-border" />

          {/* Upload New License */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Upload New License</p>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleFileSelect}
              className={cn(
                "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors",
                isDragging 
                  ? "border-primary bg-primary/5" 
                  : "border-border hover:border-muted-foreground"
              )}
            >
              <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                Drag & drop license file or click to browse
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">
                Supports .lic, .key, .license files
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
            <Button size="sm" onClick={handleFileSelect}>
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
