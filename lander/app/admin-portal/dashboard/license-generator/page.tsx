"use client";

import { useState } from "react";
import { FileKey, Copy, Check, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

const tiers = [
  { value: "starter", label: "Starter" },
  { value: "growth", label: "Growth" },
  { value: "enterprise", label: "Enterprise" },
];

const durations = [
  { value: "1", label: "1 Month" },
  { value: "3", label: "3 Months" },
  { value: "6", label: "6 Months" },
  { value: "12", label: "1 Year" },
  { value: "lifetime", label: "Lifetime" },
];

export default function LicenseGeneratorPage() {
  const { toast } = useToast();
  const [orgName, setOrgName] = useState("");
  const [tier, setTier] = useState("growth");
  const [duration, setDuration] = useState("12");
  const [seats, setSeats] = useState("10");
  const [features, setFeatures] = useState({
    analytics: true,
    sso: false,
    apiAccess: true,
    whiteLabel: false,
    auditLogs: false,
    prioritySupport: false,
  });
  const [generatedKey, setGeneratedKey] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  const generateLicense = () => {
    // Simulate API call for key generation
    const prefix = tier.substring(0, 3).toUpperCase();
    const cleanOrg = orgName.replace(/[^a-zA-Z0-9]/g, "").substring(0, 4).toUpperCase();
    const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase();
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    
    const key = `FT-${prefix}-${cleanOrg}-${datePart}-${randomPart}-V2`;
    setGeneratedKey(key);
    setIsCopied(false);
    
    toast({
      title: "License Generated",
      description: `New ${tier} license created for ${orgName || 'Client'}.`,
    });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedKey);
    setIsCopied(true);
    toast({
      title: "Copied to clipboard",
      description: "License key is ready to share.",
    });
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">License Generator</h2>
        <p className="text-gray-500">Create new license keys for clients</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>Set license parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="orgName">Organization Name</Label>
              <Input
                id="orgName"
                placeholder="e.g. Acme Corp"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tier">Plan Tier</Label>
                <Select value={tier} onValueChange={setTier}>
                  <SelectTrigger id="tier">
                    <SelectValue placeholder="Select tier" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiers.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Validity</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger id="duration">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    {durations.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="seats">Seat Limit</Label>
              <Input
                id="seats"
                type="number"
                min="1"
                value={seats}
                onChange={(e) => setSeats(e.target.value)}
              />
            </div>

            <Separator className="my-4" />
            
            <div className="space-y-3">
              <Label>Feature Flags</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="analytics"
                    checked={features.analytics}
                    onCheckedChange={(c) => setFeatures({ ...features, analytics: c })}
                  />
                  <Label htmlFor="analytics" className="font-normal">Advanced Analytics</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="sso"
                    checked={features.sso}
                    onCheckedChange={(c) => setFeatures({ ...features, sso: c })}
                  />
                  <Label htmlFor="sso" className="font-normal">SSO / SAML</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <Switch
                        id="apiAccess"
                        checked={features.apiAccess}
                        onCheckedChange={(c) => setFeatures({ ...features, apiAccess: c })}
                    />
                    <Label htmlFor="apiAccess" className="font-normal">API Access</Label>
                </div>
                 <div className="flex items-center space-x-2">
                    <Switch
                        id="prioritySupport"
                        checked={features.prioritySupport}
                        onCheckedChange={(c) => setFeatures({ ...features, prioritySupport: c })}
                    />
                    <Label htmlFor="prioritySupport" className="font-normal">Priority Support</Label>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={generateLicense} disabled={!orgName}>
              <FileKey className="w-4 h-4 mr-2" />
              Generate Key
            </Button>
          </CardFooter>
        </Card>

        {/* Output Section */}
        <div className="space-y-6">
          <Card className={`border-gray-200 transition-colors ${generatedKey ? 'bg-blue-50/50' : 'bg-gray-50'}`}>
            <CardHeader>
              <CardTitle>Generated License Key</CardTitle>
              <CardDescription>
                {generatedKey ? "Share this key securely with the client." : "Fill out the form to generate a key."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {generatedKey ? (
                <div className="space-y-4">
                  <div className="p-4 bg-white rounded border border-blue-100 font-mono text-center text-lg tracking-wider break-all shadow-sm">
                    {generatedKey}
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={copyToClipboard}
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-4 h-4 mr-2 text-green-600" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy to Clipboard
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-gray-400">
                  <FileKey className="w-12 h-12 mb-3 opacity-20" />
                  <p className="text-sm">Awaiting generation...</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-gray-200">
             <CardHeader className="pb-3">
                 <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-blue-600" />
                    <CardTitle className="text-base">Policy Preview</CardTitle>
                 </div>
             </CardHeader>
             <CardContent className="text-sm">
                <div className="grid grid-cols-2 gap-y-2 text-gray-600">
                    <span className="font-medium">Client:</span>
                    <span className="text-right text-gray-900">{orgName || "-"}</span>
                    
                    <span className="font-medium">Tier:</span>
                    <span className="text-right capitalize text-gray-900">{tier}</span>
                    
                    <span className="font-medium">Seats:</span>
                    <span className="text-right text-gray-900">{seats}</span>
                    
                    <span className="font-medium">Expires:</span>
                    <span className="text-right text-gray-900">{duration === 'lifetime' ? 'Never' : `In ${duration} months`}</span>
                </div>
                <Separator className="my-3" />
                <div className="text-xs text-gray-500">
                    Includes: {Object.entries(features).filter(([,v]) => v).map(([k]) => k).join(", ")}
                </div>
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
