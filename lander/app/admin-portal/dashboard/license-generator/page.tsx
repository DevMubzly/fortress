"use client";

import { useState, useEffect } from "react";
import { FileKey, Copy, Check, CheckCircle, Download, Mail, RefreshCw, ChevronsUpDown } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { generateLicenseAction } from "@/app/actions/license";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase";

const tiers = [
  { 
    value: "standard", 
    label: "Standard", 
    priceRange: "$500 - $2,000",
    features: [
      "Basic Analytics",
      "API Access",
      "Email Support", 
      "Up to 10 Users",
      "Standard Integrations"
    ]
  },
  { 
    value: "enterprise", 
    label: "Enterprise", 
    priceRange: "$5,000 - $10,000",
    features: [
      "Advanced Analytics", 
      "SSO (SAML/OIDC)", 
      "Audit Logs", 
      "Priority Support", 
      "White Labeling", 
      "Unlimited Users",
      "Custom Contracts"
    ]
  },
];

export default function LicenseGeneratorPage() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
      orgName: "",
      tier: "standard",
      validityDays: "365",
      maxUsers: "10",
      notes: ""
  });
  const [result, setResult] = useState<{ key: string, id: string } | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [openCombobox, setOpenCombobox] = useState(false);
  const [selectorItems, setSelectorItems] = useState<{ label: string, value: string, type: 'org' | 'lead', email?: string }[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<string>("");

  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
        const [orgsRes, leadsRes] = await Promise.all([
            supabase.from('organizations').select('id, name'),
            supabase.from('leads').select('id, first_name, last_name, company_name, work_email').eq('status', 'new')
        ]);

        const items: { label: string, value: string, type: 'org' | 'lead', email?: string }[] = [];

        if (orgsRes.data) {
            orgsRes.data.forEach(org => {
                items.push({ 
                    label: org.name, 
                    value: org.name,
                    type: 'org' 
                });
            });
        }

        if (leadsRes.data) {
             leadsRes.data.forEach(lead => {
                const name = lead.company_name || `${lead.first_name} ${lead.last_name}`;
                items.push({
                    label: `${name} (Lead ${lead.work_email})`,
                    value: name, // Use company name as text-value
                    type: 'lead',
                    email: lead.work_email
                });
            });
        }
        setSelectorItems(items);
    }
    fetchData();
  }, [supabase]);

  // Get current tier details safely
  const currentTier = tiers.find(t => t.value === formData.tier) || tiers[0];

  const handleOrgSelect = (currentValue: string) => {
      // Check if it's a known item to set email
      const matchedItem = selectorItems.find(item => item.value === currentValue);
      if (matchedItem && matchedItem.email) {
          setSelectedEmail(matchedItem.email);
      } else {
          setSelectedEmail(""); // Reset if custom or org without email loaded
      }
      
      setFormData({...formData, orgName: currentValue});
      setOpenCombobox(false);
  };


  const handleGenerate = async () => {
      if (!formData.orgName) {
          toast({ title: "Organization Name required", variant: "destructive" });
          return;
      }
      setIsGenerating(true);
      
      const payload = {
          organization: formData.orgName,
          tier: formData.tier,
          // Include fixed features based on tier for the payload
          features: currentTier.features,
          validUntil: new Date(Date.now() + parseInt(formData.validityDays) * 24 * 60 * 60 * 1000).toISOString(),
          maxUsers: parseInt(formData.maxUsers),
          notes: formData.notes
      };

      try {
        const res: any = await generateLicenseAction(payload);
        if (res.success) {
            setResult({ key: res.licenseKey, id: res.licenseId });
            toast({ title: "License Generated", description: "License key is ready for distribution." });
        } else {
             toast({ title: "Generation Failed", description: res.error, variant: "destructive" });
        }
      } catch (e) {
          console.error(e);
          toast({ title: "Error", description: "Failed to generate license.", variant: "destructive" });
      }
      setIsGenerating(false);
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.key);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    toast({ title: "Copied to clipboard" });
  };

  const handleDownload = () => {
      if (!result) return;
      const blob = new Blob([result.key], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `license-${formData.orgName.replace(/\s+/g, '-').toLowerCase()}.lic`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  const handleEmail = () => {
      if (!result) return;
      const subject = `Your Fortress License Key - ${formData.orgName}`;
      const body = `Here is your license key for Fortress:\n\n${result.key}\n\nValid until: ${new Date(Date.now() + parseInt(formData.validityDays) * 24 * 60 * 60 * 1000).toLocaleDateString()}\n\nInstructions: Download the attached file and place it in your config directory.`;
      
      const mailtoLink = `mailto:${selectedEmail || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.open(mailtoLink);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">License Generator</h2>
        <p className="text-gray-500">Create cryptographically signed license keys for clients.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Form Side */}
          <div className="md:col-span-3 space-y-6">
              <Card>
                  <CardHeader>
                      <CardTitle>Client Details</CardTitle>
                      <CardDescription>Configure the license parameters.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                      <div className="space-y-2">
                          <Label>Organization Name</Label>
                          <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                            <PopoverTrigger asChild>
                                <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openCombobox}
                                className="w-full justify-between font-normal"
                                >
                                {formData.orgName
                                    ? formData.orgName
                                    : "Select organization or lead..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[400px] p-0" align="start">
                                <Command>
                                <CommandInput placeholder="Search organizations or leads..." />
                                <CommandList>
                                    <CommandEmpty>No results found.</CommandEmpty>
                                    <CommandGroup heading="Existing Organizations">
                                        {selectorItems.filter(i => i.type === 'org').map((item) => (
                                            <CommandItem
                                            key={item.value + '_org'}
                                            onSelect={() => {
                                                setFormData({...formData, orgName: item.value});
                                                setSelectedEmail(""); // Or fetch org email if stored
                                                setOpenCombobox(false);
                                            }}
                                            >
                                            <Check
                                                className={cn(
                                                "mr-2 h-4 w-4",
                                                formData.orgName === item.value ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            {item.label}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                    <CommandSeparator />
                                    <CommandGroup heading="New Leads">
                                        {selectorItems.filter(i => i.type === 'lead').map((item) => (
                                            <CommandItem
                                            key={item.email + '_lead'} // Use email or unique id for key
                                            onSelect={() => {
                                                setFormData({...formData, orgName: item.value});
                                                if (item.email) setSelectedEmail(item.email);
                                                setOpenCombobox(false);
                                            }}
                                            >
                                            <Check
                                                className={cn(
                                                "mr-2 h-4 w-4",
                                                formData.orgName === item.value ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            {item.label}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                    <CommandSeparator />
                                    <CommandGroup heading="Direct Lead">
                                         <CommandItem onSelect={() => {
                                              setFormData({...formData, orgName: "New Organization"});
                                              setSelectedEmail("");
                                              setOpenCombobox(false);
                                         }}>
                                            <Check className="mr-2 h-4 w-4 opacity-0" />
                                            + Add New Organization (Custom)
                                         </CommandItem>
                                    </CommandGroup>
                                </CommandList>
                                </Command>
                            </PopoverContent>
                            </Popover>
                            {/* Fallback input if they want to edit the name manually after selection or custom */}
                            <Input 
                                className="mt-2"
                                placeholder="Edit organization name..." 
                                value={formData.orgName}
                                onChange={(e) => setFormData({...formData, orgName: e.target.value})}
                            />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                              <Label>License Tier</Label>
                              <Select value={formData.tier} onValueChange={(val: any) => setFormData({...formData, tier: val})}>
                                  <SelectTrigger>
                                      <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                      {tiers.map(t => (
                                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                      ))}
                                  </SelectContent>
                              </Select>
                          </div>
                          <div className="space-y-2">
                              <Label>Validity (Days)</Label>
                              <Select value={formData.validityDays} onValueChange={(val: any) => setFormData({...formData, validityDays: val})}>
                                  <SelectTrigger>
                                      <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                      <SelectItem value="30">30 Days (drial)</SelectItem>
                                      <SelectItem value="90">3 Months</SelectItem>
                                      <SelectItem value="365">1 Year</SelectItem>
                                      <SelectItem value="1095">3 Years</SelectItem>
                                  </SelectContent>
                              </Select>
                          </div>
                      </div>

                      <div className="space-y-2">
                          <Label>Max Users</Label>
                          <Input 
                            type="number"
                            value={formData.maxUsers}
                            onChange={(e) => setFormData({...formData, maxUsers: e.target.value})}
                          />
                      </div>

                      <div className="space-y-2">
                          <Label>Internal Notes</Label>
                          <Textarea 
                            placeholder="Reason for issuance, special terms..." 
                            value={formData.notes}
                            onChange={(e) => setFormData({...formData, notes: e.target.value})}
                          />
                      </div>
                      
                      <Separator className="my-4" />

                      <div className="space-y-3">
                          <Label>Included Tier Features</Label>
                          <div className="bg-slate-50 p-4 rounded-md border border-slate-100">
                              <ul className="grid grid-cols-2 gap-2">
                                  {currentTier.features.map((feature, i) => (
                                      <li key={i} className="flex items-center text-sm text-slate-700">
                                          <CheckCircle className="h-3.5 w-3.5 text-green-600 mr-2 flex-shrink-0" />
                                          {feature}
                                      </li>
                                  ))}
                              </ul>
                          </div>
                      </div>
                  </CardContent>
                  <CardFooter className="bg-gray-50 flex justify-between items-center px-6 py-4">
                      <div className="text-sm text-gray-500">
                          Est. value: <span className="font-semibold text-gray-900">{currentTier.priceRange}</span>
                      </div>
                      <Button onClick={handleGenerate} disabled={isGenerating}>
                          {isGenerating ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <FileKey className="mr-2 h-4 w-4" />}
                          Generate License
                      </Button>
                  </CardFooter>
              </Card>
          </div>

          {/* Result Side */}
          <div className="md:col-span-2 space-y-6">
              <Card className="h-full bg-slate-900 text-white border-slate-800">
                  <CardHeader>
                      <CardTitle className="text-slate-100">License Output</CardTitle>
                      <CardDescription className="text-slate-400">Generated key payload</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                      {result ? (
                          <>
                            <div className="p-3 bg-slate-800 rounded-md border border-slate-700 font-mono text-xs break-all max-h-[300px] overflow-y-auto">
                                {result.key}
                            </div>
                            <div className="space-y-2">
                                <Button className="w-full bg-white text-slate-900 hover:bg-slate-200" onClick={handleCopy}>
                                    {isCopied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                                    {isCopied ? "Copied" : "Copy to Clipboard"}
                                </Button>
                                <Button variant="outline" className="w-full border-slate-700 hover:bg-slate-800 text-black hover:text-white" onClick={handleDownload} >
                                    <Download className="mr-2 h-4 w-4" />
                                    Download .lic
                                </Button>
                                <Button variant="ghost" className="w-full text-slate-300 hover:text-white hover:bg-slate-800" onClick={handleEmail}>
                                    <Mail className="mr-2 h-4 w-4" />
                                    Email to Client
                                </Button>
                            </div>
                            <div className="pt-4 border-t border-slate-800">
                                <div className="text-xs text-slate-500">License ID</div>
                                <div className="text-sm font-mono text-slate-300 truncate">{result.id}</div>
                            </div>
                          </>
                      ) : (
                          <div className="flex flex-col items-center justify-center h-[200px] text-slate-500 text-center text-sm p-4 border border-dashed border-slate-700 rounded-lg">
                              <FileKey className="h-8 w-8 mb-2 opacity-50" />
                              Configure details and click generation to see output.
                          </div>
                      )}
                  </CardContent>
              </Card>
          </div>
      </div>
    </div>
  );
}
