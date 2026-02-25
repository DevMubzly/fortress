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
  Square,
  AlertCircle
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
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
  status: 'installed' | 'downloading' | 'available' | 'error';
  description: string;
  tags: string[];
  download_progress?: number;
}

const API_BASE = "http://localhost:8000/api";

const ModelHubPage = () => {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
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
                        status: dl.status === 'completed' ? 'installed' : dl.status === 'error' ? 'error' : 'downloading',
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

  const handleRetry = (modelId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    // Assuming retry is just starting download again
    startDownload(modelId);
    toast({ title: "Retrying Download", description: `Restarting pull for ${modelId}...` });
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
    
    if (activeTab === 'installed') {
        return matchesSearch && (m.status === 'installed' || m.status === 'downloading' || m.status === 'error');
    }
    return matchesSearch;
  });

  const ModelCard = ({ model }: { model: Model }) => {
    const dlState = downloads[model.id];
    // Prioritize local dlState over server state for responsiveness
    // Calculate effective states
    const isDownloading = !!dlState || (model.status === 'downloading' && !dlState);
    const isError = model.status === 'error' || dlState?.status === 'error';
    const progress = dlState?.progress || model.download_progress || 0;
    const isInstalled = model.status === 'installed' && !isDownloading;
    const statusMsg = dlState?.status || (isError ? "Download Failed" : "Starting...");

    return (
    <Card 
        className={`flex flex-col h-full border hover:border-sidebar-primary/50 transition-all duration-300 group overflow-hidden ${isInstalled ? 'bg-card' : 'bg-muted/10'} hover:shadow-lg`}
        onClick={() => {
            setSelectedModel(model);
        }}
    >
      <CardHeader className="p-5 pb-0 space-y-3">
        <div className="flex justify-between items-start gap-4">
            <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="font-mono text-[10px] bg-sidebar-accent/50 text-sidebar-foreground/70 hover:bg-sidebar-accent">
                        {model.provider}
                    </Badge>
                    {isInstalled && (
                        <div className="flex items-center gap-1 text-[10px] text-green-600 font-medium px-1.5 py-0.5 rounded-full bg-green-500/10">
                            <CheckCircle className="w-3 h-3" />
                            <span>Installed</span>
                        </div>
                    )}
                </div>
                <CardTitle className="text-base font-bold truncate leading-snug tracking-tight text-foreground" title={model.name}>
                   {model.name}
                </CardTitle>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
                <Badge variant="outline" className="font-mono text-[10px] text-muted-foreground border-border/60">
                    {model.parameter_count}
                </Badge>
                <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">{model.quantization}</span>
            </div>
        </div>
        <Separator className="bg-border/40" />
      </CardHeader>
      
      <CardContent className="p-5 py-4 flex-grow space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 min-h-[4.5em]">
              {model.description}
          </p>
          
          <div className="flex flex-wrap gap-1.5">
              {model.tags.slice(0, 4).map(tag => (
                  <span key={tag} className="text-[10px] bg-secondary/80 px-2 py-1 rounded-md text-secondary-foreground font-medium">
                      #{tag}
                  </span>
              ))}
              {model.tags.length > 4 && (
                  <span className="text-[10px] text-muted-foreground px-1.5 py-1 font-medium">+{model.tags.length - 4}</span>
              )}
          </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 mt-auto">
          {isDownloading ? (
              <div className="w-full bg-secondary/20 rounded-lg p-3 space-y-3 border border-border/50">
                  <div className="flex justify-between items-center text-xs">
                      <span className="font-medium text-sidebar-primary flex items-center gap-2">
                          <RotateCw className="w-3.5 h-3.5 animate-spin" />
                          {statusMsg === "Starting..." ? "Initializing..." : "Downloading..."}
                      </span>
                      <span className="font-mono text-muted-foreground">
                        {dlState?.completed && dlState?.total ? 
                            `${(dlState.completed / (1024 * 1024 * 1024)).toFixed(2)}GB / ${(dlState.total / (1024 * 1024 * 1024)).toFixed(2)}GB` 
                            : ''
                        } ({Math.round(progress)}%)
                      </span>
                  </div>
                  <Progress value={progress} className="h-2 w-full bg-sidebar-primary/20" />
                  <div className="flex gap-2 justify-end pt-1">
                     <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full hover:bg-background/80" onClick={(e) => { e.stopPropagation(); pauseDownload(model.id); }}>
                        <Pause className="h-3.5 w-3.5" />
                     </Button>
                     <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={(e) => { e.stopPropagation(); stopDownload(model.id); }}>
                        <Square className="h-3.5 w-3.5 fill-current" />
                     </Button>
                  </div>
              </div>
          ) : isInstalled ? (
             <div className="flex w-full gap-3">
                <Button 
                    className="flex-1 h-9 text-xs font-semibold shadow-sm" 
                    variant="default"
                    onClick={(e) => handleLoadModel(model.id, e)}
                >
                    <Zap className="mr-2 h-3.5 w-3.5" />
                    Load Model
                </Button>
                <Button 
                    size="icon" 
                    variant="outline" 
                    className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/5 border-border/60"
                    onClick={(e) => {
                        e.stopPropagation();
                        setDeleteModelId(model.id);
                    }}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
             </div>
          ) : (
             <Button 
                className="w-full h-9 text-xs font-semibold border-primary/20 hover:border-primary/50 group-hover:bg-sidebar-primary group-hover:text-sidebar-primary-foreground transition-all duration-300 shadow-sm" 
                variant="secondary"
                onClick={(e) => handleDownload(model.id, e)}
             >
                <Download className="mr-2 h-4 w-4" />
                Download ({model.size})
             </Button>
          )}
      </CardFooter>
    </Card>
    );
  };

  return (
    <div className="h-full flex flex-col max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
      <PageHeader 
        className="mb-8"
        icon={Box} 
        title="Model Hub" 
        description="Discover, download, and manage AI models via Ollama library." 
      />

      <div className="flex flex-col sm:flex-row items-center gap-4 z-10 mb-8 sticky top-0 bg-background/95 backdrop-blur py-4 border-b">
        <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
                placeholder="Search models by name, tag, or description..." 
                className="pl-9 bg-secondary/50 border-border/50 focus:bg-background transition-colors"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
        </div>
        
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
             <TabsList className="bg-secondary/50 p-1 w-full sm:w-auto grid grid-cols-2 sm:flex">
                <TabsTrigger value="all" className="px-4 text-xs h-8 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <Sparkles className="w-3.5 h-3.5 mr-2" />
                    All Models
                </TabsTrigger>
                <TabsTrigger value="installed" className="px-4 text-xs h-8 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <HardDrive className="w-3.5 h-3.5 mr-2" />
                    Installed
                    {models.filter(m => m.status === 'installed' || m.status === 'downloading').length > 0 && (
                        <Badge variant="secondary" className="ml-2 h-4 px-1 text-[9px] min-w-[1.2rem] justify-center">
                            {models.filter(m => m.status === 'installed' || m.status === 'downloading').length}
                        </Badge>
                    )}
                </TabsTrigger>
            </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 pb-10">
        {filteredModels.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-muted-foreground border border-dashed rounded-lg bg-secondary/5 mt-8">
                <Box className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-lg font-medium text-foreground/80">No models found</p>
                <p className="text-sm mt-1 text-muted-foreground/60 max-w-sm text-center">
                    {searchQuery ? `No results matching "${searchQuery}"` : "No models are currently available."}
                </p>
                {searchQuery && (
                    <Button variant="link" onClick={() => setSearchQuery("")} className="mt-2 text-primary">
                        Clear Search
                    </Button>
                )}
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredModels.map(model => (
                    <ModelCard key={model.id} model={model} />
                ))}
            </div>
        )}
      </div>

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
