import { useState, useEffect, useRef } from "react";
import { 
  Search, 
  Download, 
  Trash2, 
  Box, 
  CheckCircle, 
  RotateCw, 
  Zap, 
  Sparkles,
  HardDrive,
  Info,
  AlertTriangle,
  Layers,
  Play,
  Pause,
  Square
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/PageHeader";
import { useDownload } from "@/contexts/DownloadContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Model {
  id: string; // The primary key (e.g. 'llama3.1:latest')
  name: string;
  provider: string;
  size: string;
  parameter_count: string;
  quantization: string;
  status: 'installed' | 'downloading' | 'available';
  description: string;
  tags: string[];
  download_progress?: number;
}

const API_BASE = "http://localhost:8000/api";

const ModelHubPage = () => {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("installed");
  const { startDownload, stopDownload, pauseDownload, resumeDownload, downloads } = useDownload();
  
  // Modal states
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [deleteModelId, setDeleteModelId] = useState<string | null>(null);

  const fetchModels = async () => {
    try {
      const res = await fetch(`${API_BASE}/models`);
      if (res.ok) {
        const data = await res.json();
        // Merge downloaded state with fetched models so we don't lose progress UI on refresh
        setModels((prevModels) => {
             // If we just got data from API, map it
             return data.map((m: Model) => {
                const dl = downloads[m.id];
                if (dl) {
                    return { 
                        ...m, 
                        status: dl.status === 'completed' ? 'installed' : 'downloading',
                        download_progress: dl.progress 
                    };
                }
                return m;
            });
        });
      }
    } catch (error) {
      console.error("Failed to fetch models", error);
      toast({
          title: "Connection Error",
          description: "Could not connect to model service.",
          variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
    const interval = setInterval(fetchModels, 3000); // Polling for updates
    return () => clearInterval(interval);
  }, [downloads]); // Re-run when downloads change to sync status

  const handleDownload = (modelId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    startDownload(modelId);
    toast({ title: "Download Started", description: `Pulling ${modelId} from Ollama registry...` });
  };

  const handleLoadModel = async (modelId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
        // Just send a dummy generation request with keep_alive to load it
        await fetch(`${API_BASE}/models/load`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: modelId })
        });
        toast({ title: "Model Loaded", description: `${modelId} is now active in memory.` });
    } catch (e) {
        toast({ title: "Load Failed", description: "Could not load model into memory.", variant: "destructive" });
    }
  };

  const confirmDelete = async () => {
    if (!deleteModelId) return;
    try {
      const res = await fetch(`${API_BASE}/models/${deleteModelId}`, {
         method: "DELETE"
      });
      if (res.ok) {
        toast({
          title: "Model Deleted",
          description: `${deleteModelId} has been removed from system.`
        });
        fetchModels();
      } else {
          const err = await res.json();
          throw new Error(err.detail || "Failed to delete");
      }
    } catch (error: any) {
       toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
        setDeleteModelId(null);
    }
  };

  const filteredModels = models.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          m.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (activeTab === "installed") {
        return matchesSearch && (m.status === "installed" || m.status === "downloading");
    } else {
        return matchesSearch; // In discover, show everything? Or just available?
        // User requested: "when dowload is clicked, it should show installing while in the discover and installed area"
        // So Discover should arguably show everything too, or at least available ones + downloading ones.
        // Let's filter to show 'available' + 'downloading' (if not already installed)
        // Actually, easiest is to show ALL in discover, but mark installed ones as installed.
        // But traditional 'Discover' tabs usually hide installed ones.
        // Let's stick to distinct lists for clarity, but show downloading in BOTH if possible.
        // For now: Installed tab shows Installed + Downloading. Discover tab shows Available + Downloading (if originating from there).
        // Actually, simpler logic:
        if (m.status === 'installed') return false;
        return matchesSearch;
    }
  });

  const ModelCard = ({ model }: { model: Model }) => {
    const dlState = downloads[model.id];
    const isDownloading = !!dlState || (model.status === 'downloading' && !dlState);
    const progress = dlState?.progress || model.download_progress || 0;
    const statusMsg = dlState?.status || "Starting...";

    return (
    <Card 
        className={`flex flex-col h-full border-border/50 bg-secondary/10 hover:bg-secondary/20 transition-all duration-200 cursor-pointer ${isDownloading ? 'border-primary/50 bg-primary/5' : ''}`}
        onClick={() => {
            console.log("Card clicked", model);
            setSelectedModel(model);
        }}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-2">
            <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                   <span className="truncate" title={model.name}>{model.name}</span>
                   {model.status === 'installed' && <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />}
                </CardTitle>
                <CardDescription className="text-xs font-mono mt-1">
                    {model.provider} • {model.parameter_count} • {model.quantization}
                </CardDescription>
            </div>
            <Badge variant="outline" className="text-[10px] uppercase shrink-0">{model.size}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pb-3">
        <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px] mb-4">
            {model.description}
        </p>
        
        <div className="flex flex-wrap gap-1.5 mb-4">
            {model.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0 h-5 font-normal bg-background/50">
                    #{tag}
                </Badge>
            ))}
        </div>

        {isDownloading && (
            <div className="space-y-1.5 mt-auto bg-background/50 p-2 rounded-md" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                    <span className="truncate max-w-[120px]">{dlState?.isPaused ? "Paused" : statusMsg}</span>
                    <span>{progress}%</span>
                </div>
                <Progress value={progress} className={`h-1.5 ${dlState?.isPaused ? 'opacity-50' : ''}`} />
            </div>
        )}
      </CardContent>
      <CardFooter className="pt-0 mt-auto" onClick={(e) => e.stopPropagation()}>
        {model.status === 'installed' ? (
             <div className="flex w-full gap-2">
                 <Button variant="default" className="flex-1 h-8 text-xs gap-1.5" onClick={(e) => handleLoadModel(model.id, e)}>
                    <Zap className="w-3.5 h-3.5" />
                    Load
                 </Button>
                 <Button variant="outline" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteModelId(model.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                 </Button>
             </div>
        ) : isDownloading ? (
            <div className="flex w-full gap-2">
                {dlState?.isPaused ? (
                    <Button variant="secondary" className="flex-1 h-8 text-xs gap-1.5 bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20" onClick={(e) => { e.stopPropagation(); resumeDownload(model.id); }}>
                        <Play className="w-3.5 h-3.5" />
                        Resume
                    </Button>
                ) : (
                    <Button variant="secondary" className="flex-1 h-8 text-xs gap-1.5" onClick={(e) => { e.stopPropagation(); pauseDownload(model.id); }}>
                        <Pause className="w-3.5 h-3.5" />
                        Pause
                    </Button>
                )}
                <Button variant="destructive" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); stopDownload(model.id); }}>
                    <Square className="w-3.5 h-3.5 fill-current" />
                </Button>
            </div>
        ) : (
            <Button variant="secondary" className="w-full h-8 text-xs gap-1.5 hover:bg-primary hover:text-primary-foreground" onClick={(e) => handleDownload(model.id, e)}>
                <Download className="w-3.5 h-3.5" />
                Download
            </Button>
        )}
      </CardFooter>
    </Card>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <PageHeader 
        className="mb-8"
        icon={Box} 
        title="Model Hub" 
        description="Discover, download, and manage AI models via Ollama library." 
      />

      <div className="flex items-center gap-4 bg-background z-10 mb-6">
        <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
                placeholder="Search models..." 
                className="pl-9 bg-secondary/30 border-border/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
        </div>
      </div>

      <Tabs defaultValue="installed" value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-6">
             <TabsList className="h-9 bg-secondary/30 p-1">
                <TabsTrigger value="installed" className="px-4 text-xs h-7 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <HardDrive className="w-3.5 h-3.5 mr-2" />
                    Installed ({models.filter(m => m.status === 'installed' || m.status === 'downloading').length})
                </TabsTrigger>
                <TabsTrigger value="discover" className="px-4 text-xs h-7 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <Sparkles className="w-3.5 h-3.5 mr-2" />
                    Discover ({models.filter(m => m.status === 'available').length})
                </TabsTrigger>
            </TabsList>
            
            <div className="text-xs text-muted-foreground flex items-center gap-2 px-2">
                <Layers className="w-3.5 h-3.5" />
                {filteredModels.length} models found
            </div>
        </div>

        <TabsContent value="installed" className="mt-0 outline-none flex-1">
            {filteredModels.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-muted-foreground border border-dashed rounded-lg bg-secondary/5 mt-8">
                    <Box className="w-10 h-10 mb-3 opacity-20" />
                    <p className="text-sm font-medium">No installed models found</p>
                    <p className="text-xs mt-1 text-muted-foreground/60">Switch to the Discover tab to find new models.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-8">
                    {filteredModels.map(model => (
                        <ModelCard key={model.id} model={model} />
                    ))}
                </div>
            )}
        </TabsContent>

        <TabsContent value="discover" className="mt-0 outline-none flex-1">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-8">
                {filteredModels.map(model => (
                    <ModelCard key={model.id} model={model} />
                ))}
            </div>
        </TabsContent>
      </Tabs>

      {/* Model Details Modal */}
      <Dialog open={!!selectedModel} onOpenChange={(o) => !o && setSelectedModel(null)}>
        <DialogContent className="max-w-2xl bg-card border-border">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    {selectedModel?.name}
                    {selectedModel?.status === 'installed' && <CheckCircle className="w-5 h-5 text-green-500" />}
                </DialogTitle>
                <DialogDescription>
                    {selectedModel?.provider} • {selectedModel?.id}
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <h4 className="text-sm font-medium leading-none text-muted-foreground">Parameter Count</h4>
                        <p className="text-sm font-mono">{selectedModel?.parameter_count}</p>
                    </div>
                    <div className="space-y-1">
                        <h4 className="text-sm font-medium leading-none text-muted-foreground">Disk Size</h4>
                        <p className="text-sm font-mono">{selectedModel?.size}</p>
                    </div>
                    <div className="space-y-1">
                        <h4 className="text-sm font-medium leading-none text-muted-foreground">Quantization</h4>
                        <p className="text-sm font-mono">{selectedModel?.quantization}</p>
                    </div>
                </div>
                
                <div className="space-y-2 mt-2">
                    <h4 className="text-sm font-medium leading-none text-muted-foreground">Description</h4>
                    <p className="text-sm leading-relaxed text-foreground/90">{selectedModel?.description}</p>
                </div>

                <div className="space-y-2">
                    <h4 className="text-sm font-medium leading-none text-muted-foreground">Use Cases</h4>
                    <div className="flex flex-wrap gap-2">
                        {selectedModel?.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="font-mono text-xs">{tag}</Badge>
                        ))}
                    </div>
                </div>
            </div>
            
            <DialogFooter>
                 {selectedModel?.status === 'installed' ? (
                     <div className="flex w-full gap-2">
                         <Button variant="default" className="flex-1" onClick={() => { handleLoadModel(selectedModel!.id); setSelectedModel(null); }}>
                            <Zap className="w-4 h-4 mr-2" />
                            Load Model
                         </Button>
                         <Button variant="destructive" onClick={() => { setDeleteModelId(selectedModel!.id); setSelectedModel(null); }}>
                             <Trash2 className="w-4 h-4 mr-2" />
                             Uninstall
                         </Button>
                     </div>
                 ) : (
                     <Button className="w-full" onClick={() => { handleDownload(selectedModel!.id); setSelectedModel(null); }}>
                         <Download className="w-4 h-4 mr-2" />
                         Install Model
                     </Button>
                 )}
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deleteModelId} onOpenChange={(o) => !o && setDeleteModelId(null)}>
        <DialogContent className="max-w-sm bg-destructive/10 border-destructive/50">
            <DialogHeader>
                <DialogTitle className="text-destructive flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Confirm Deletion
                </DialogTitle>
                <DialogDescription className="text-foreground/90">
                    Are you sure you want to delete <strong>{deleteModelId}</strong>? This action cannot be undone and will free up disk space.
                </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => setDeleteModelId(null)}>Cancel</Button>
                <Button variant="destructive" onClick={confirmDelete}>Delete Model</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ModelHubPage;
