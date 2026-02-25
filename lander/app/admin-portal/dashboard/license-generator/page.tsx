"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Loader2, Download, Copy, RefreshCw } from "lucide-react";

import { generateLicenseAction } from "@/app/actions/generate-license";

export default function LicenseGeneratorPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedLicense, setGeneratedLicense] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    organization: "",
    tier: "enterprise",
    features: ["sso", "audit-logs", "advanced-analytics", "api-access"],
    maxUsers: "100",
    validityDays: "365"
  });

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await generateLicenseAction({
        organization: formData.organization,
        tier: formData.tier,
        features: formData.features,
        maxUsers: parseInt(formData.maxUsers),
        validityDays: parseInt(formData.validityDays)
      });
      
      if (result.success && result.license) {
        setGeneratedLicense(result.license);
        toast({
          title: "License Generated",
          description: "New license key has been created successfully.",
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate license.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (generatedLicense) {
      navigator.clipboard.writeText(generatedLicense);
      toast({
        title: "Copied",
        description: "License key copied to clipboard",
      });
    }
  };

  const downloadLicense = () => {
    if (generatedLicense) {
        const blob = new Blob([generatedLicense], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${formData.organization.toLowerCase().replace(/\s+/g, '-')}-license.lic`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">License Generator</h2>
          <p className="text-gray-500">Create new enterprise licenses for clients</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card >
          <CardHeader>
            <CardTitle className="text-blue-900">Configuration</CardTitle>
            <CardDescription>Enter the license parameters.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="org">Organization Name</Label>
                <Input 
                  id="org" 
                  placeholder="e.g. Acme Corp" 
                  required
                  value={formData.organization}
                  onChange={(e) => setFormData({...formData, organization: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="tier">License Tier</Label>
                    <Select 
                        value={formData.tier} 
                        onValueChange={(val) => setFormData({...formData, tier: val})}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select tier" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="standard">Standard</SelectItem>
                            <SelectItem value="enterprise">Enterprise</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="users">Max Users</Label>
                    <Input 
                        id="users" 
                        type="number" 
                        value={formData.maxUsers}
                        onChange={(e) => setFormData({...formData, maxUsers: e.target.value})}
                    />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="days">Validity (Days)</Label>
                <Select 
                    value={formData.validityDays} 
                    onValueChange={(val) => setFormData({...formData, validityDays: val})}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="30">30 Days (Trial)</SelectItem>
                        <SelectItem value="90">90 Days (Quarterly)</SelectItem>
                        <SelectItem value="180">6 Months</SelectItem>
                        <SelectItem value="365">1 Year</SelectItem>
                        <SelectItem value="730">2 Years</SelectItem>
                        <SelectItem value="1095">3 Years</SelectItem>
                    </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Features</Label>
                <div className="grid grid-cols-2 gap-2 border border-blue-100 rounded-md p-3 bg-blue-50/30">
                    {["sso", "audit-logs", "advanced-analytics", "custom-models", "api-access", "priority-support"].map((feature) => (
                        <div key={feature} className="flex items-center space-x-2">
                            <input 
                                type="checkbox" 
                                id={feature}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                checked={formData.features.includes(feature)}
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        setFormData({...formData, features: [...formData.features, feature]});
                                    } else {
                                        setFormData({...formData, features: formData.features.filter(f => f !== feature)});
                                    }
                                }}
                            />
                            <Label htmlFor={feature} className="text-sm font-normal capitalize">
                                {feature.replace('-', ' ')}
                            </Label>
                        </div>
                    ))}
                </div>
              </div>

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                {isLoading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                    </>
                ) : (
                    <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Generate License
                    </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className={generatedLicense ? "border-green-200 bg-green-50/10" : "opacity-50"}>
            <CardHeader>
                <CardTitle className="text-blue-900">Generated License</CardTitle>
                <CardDescription>
                    {generatedLicense 
                        ? "License key generated successfully. Send this file to the client." 
                        : "Configure and generate a license to see the output here."}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {generatedLicense ? (
                    <>
                        <div className="relative">
                            <Textarea 
                                readOnly 
                                value={generatedLicense} 
                                className="min-h-[200px] font-mono text-xs resize-none bg-white"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" className="flex-1 hover:text-blue-600 hover:border-blue-200" onClick={copyToClipboard}>
                                <Copy className="mr-2 h-4 w-4" />
                                Copy Key
                            </Button>
                            <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={downloadLicense}>
                                <Download className="mr-2 h-4 w-4" />
                                Download File
                            </Button>
                        </div>
                    </>
                ) : (
                    <div className="h-[200px] flex items-center justify-center border-2 border-dashed rounded-lg text-gray-400">
                        <FileCheck className="h-8 w-8" />
                    </div>
                )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { FileCheck } from "lucide-react";
