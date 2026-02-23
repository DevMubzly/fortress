import { Shield, Server, Cpu, MemoryStick, HardDrive, CheckCircle, Copy, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";

const AboutPage = () => {
  const systemInfo = {
    version: "1.0.0",
    buildNumber: "2024.03.01.1234",
    environment: "Production",
    nodeId: "fortress-node-01",
    os: "Ubuntu 22.04 LTS",
    architecture: "x86_64",
    cpuCores: 8,
    totalRam: "32 GB",
    gpuModel: "NVIDIA RTX 4090",
    gpuVram: "24 GB",
    storageUsed: "245 GB",
    storageTotal: "1 TB",
    ollamaVersion: "0.1.27",
    chromaVersion: "0.4.22",
    uptime: "14 days, 6 hours",
  };

  const handleCopySystemInfo = () => {
    const infoText = `
Fortress AI Gateway
====================
Version: ${systemInfo.version}
Build: ${systemInfo.buildNumber}
Environment: ${systemInfo.environment}
Node ID: ${systemInfo.nodeId}

System Information
------------------
OS: ${systemInfo.os}
Architecture: ${systemInfo.architecture}
CPU Cores: ${systemInfo.cpuCores}
RAM: ${systemInfo.totalRam}
GPU: ${systemInfo.gpuModel}
GPU VRAM: ${systemInfo.gpuVram}
Storage: ${systemInfo.storageUsed} / ${systemInfo.storageTotal}

Services
--------
Ollama: ${systemInfo.ollamaVersion}
ChromaDB: ${systemInfo.chromaVersion}
Uptime: ${systemInfo.uptime}
    `.trim();

    navigator.clipboard.writeText(infoText);
    toast({
      title: "System Info Copied",
      description: "Full system information copied to clipboard.",
    });
  };

  return (
    <div className="space-y-6 h-full overflow-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">About Fortress</h2>
          <p className="text-sm text-muted-foreground">Enterprise AI Gateway for secure LLM deployment</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleCopySystemInfo}>
          <Copy className="w-4 h-4 mr-2" />
          Copy System Info
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Version Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              Version Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Version</span>
              <Badge variant="outline" className="font-mono">{systemInfo.version}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Build Number</span>
              <span className="text-xs font-mono text-muted-foreground">{systemInfo.buildNumber}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Environment</span>
              <Badge className="bg-success/20 text-success border-success/30">
                <CheckCircle className="w-3 h-3 mr-1" />
                {systemInfo.environment}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Node ID</span>
              <span className="text-xs font-mono">{systemInfo.nodeId}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Uptime</span>
              <span className="text-xs">{systemInfo.uptime}</span>
            </div>
          </CardContent>
        </Card>

        {/* Hardware Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Server className="w-4 h-4 text-primary" />
              Hardware
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <Cpu className="w-3 h-3" /> CPU Cores
              </span>
              <span className="text-sm">{systemInfo.cpuCores}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <MemoryStick className="w-3 h-3" /> RAM
              </span>
              <span className="text-sm">{systemInfo.totalRam}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">GPU</span>
              <span className="text-sm">{systemInfo.gpuModel}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">GPU VRAM</span>
              <span className="text-sm">{systemInfo.gpuVram}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <HardDrive className="w-3 h-3" /> Storage
              </span>
              <span className="text-sm">{systemInfo.storageUsed} / {systemInfo.storageTotal}</span>
            </div>
          </CardContent>
        </Card>

        {/* Services */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Services</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Operating System</span>
              <span className="text-sm">{systemInfo.os}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Architecture</span>
              <span className="text-sm font-mono">{systemInfo.architecture}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Ollama Version</span>
              <Badge variant="outline" className="font-mono text-xs">{systemInfo.ollamaVersion}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">ChromaDB Version</span>
              <Badge variant="outline" className="font-mono text-xs">{systemInfo.chromaVersion}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Links */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Resources</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" size="sm" className="w-full justify-start gap-2">
              <ExternalLink className="w-3 h-3" /> Documentation
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start gap-2">
              <ExternalLink className="w-3 h-3" /> API Reference
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start gap-2">
              <ExternalLink className="w-3 h-3" /> GitHub Repository
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start gap-2">
              <ExternalLink className="w-3 h-3" /> License Agreement
            </Button>
          </CardContent>
        </Card>
      </div>

      <Separator />

      <div className="text-center text-xs text-muted-foreground">
        <p>© 2024 Fortress AI. All rights reserved.</p>
        <p className="mt-1">Built with ❤️ for enterprise AI security</p>
      </div>
    </div>
  );
};

export default AboutPage;
