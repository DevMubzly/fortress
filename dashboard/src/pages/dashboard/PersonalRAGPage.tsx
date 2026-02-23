import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Upload,
  FileText,
  File,
  FileImage,
  FileSpreadsheet,
  Trash2,
  Search,
  FolderOpen,
  HardDrive,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PersonalDocument {
  id: string;
  name: string;
  type: "pdf" | "doc" | "txt" | "xlsx" | "image";
  size: string;
  uploadedAt: string;
  status: "indexed" | "indexing" | "failed";
  chunks: number;
}

const mockDocuments: PersonalDocument[] = [
  {
    id: "1",
    name: "Project_Proposal_2024.pdf",
    type: "pdf",
    size: "2.4 MB",
    uploadedAt: "2024-01-15",
    status: "indexed",
    chunks: 45,
  },
  {
    id: "2",
    name: "Meeting_Notes_Q4.docx",
    type: "doc",
    size: "156 KB",
    uploadedAt: "2024-01-14",
    status: "indexed",
    chunks: 12,
  },
  {
    id: "3",
    name: "Research_Data.xlsx",
    type: "xlsx",
    size: "4.1 MB",
    uploadedAt: "2024-01-13",
    status: "indexing",
    chunks: 0,
  },
  {
    id: "4",
    name: "Team_Photo.png",
    type: "image",
    size: "892 KB",
    uploadedAt: "2024-01-12",
    status: "indexed",
    chunks: 1,
  },
  {
    id: "5",
    name: "Requirements.txt",
    type: "txt",
    size: "24 KB",
    uploadedAt: "2024-01-11",
    status: "failed",
    chunks: 0,
  },
];

const getFileIcon = (type: string) => {
  switch (type) {
    case "pdf":
    case "doc":
      return FileText;
    case "xlsx":
      return FileSpreadsheet;
    case "image":
      return FileImage;
    default:
      return File;
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "indexed":
      return <CheckCircle className="h-4 w-4 text-success" />;
    case "indexing":
      return <Clock className="h-4 w-4 text-warning animate-pulse" />;
    case "failed":
      return <AlertCircle className="h-4 w-4 text-destructive" />;
    default:
      return null;
  }
};

const PersonalRAGPage = () => {
  const [documents, setDocuments] = useState(mockDocuments);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const totalStorage = 50; // MB
  const usedStorage = 7.6; // MB
  const storagePercentage = (usedStorage / totalStorage) * 100;

  const filteredDocuments = documents.filter((doc) =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const indexedCount = documents.filter((d) => d.status === "indexed").length;
  const totalChunks = documents.reduce((acc, d) => acc + d.chunks, 0);

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
    // Mock file upload
    toast({
      title: "Files uploaded",
      description: "Your files are being processed and indexed.",
    });
  };

  const handleDelete = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    toast({
      title: "Document deleted",
      description: "The document has been removed from your personal library.",
    });
  };

  return (
    <div className="h-full overflow-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <FolderOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold">Personal Knowledge Base</h2>
            <p className="text-xs text-muted-foreground">Upload and manage your personal documents for AI context</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Upload Zone */}
        <Card className="border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Upload Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm font-medium mb-1">Drop files here</p>
              <p className="text-xs text-muted-foreground mb-3">
                PDF, DOCX, TXT, XLSX up to 10MB
              </p>
              <Button variant="outline" size="sm">
                Browse Files
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Storage Stats */}
        <Card className="border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              Storage Usage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Used</span>
                <span>{usedStorage} MB / {totalStorage} MB</span>
              </div>
              <Progress value={storagePercentage} className="h-2" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded bg-muted/30 text-center">
                <p className="text-lg font-bold">{documents.length}</p>
                <p className="text-[10px] text-muted-foreground">Documents</p>
              </div>
              <div className="p-2 rounded bg-muted/30 text-center">
                <p className="text-lg font-bold">{totalChunks}</p>
                <p className="text-[10px] text-muted-foreground">Chunks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Index Status */}
        <Card className="border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Index Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-2 rounded bg-success/10">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span className="text-sm">Indexed</span>
              </div>
              <span className="font-bold">{indexedCount}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-warning/10">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-warning" />
                <span className="text-sm">Processing</span>
              </div>
              <span className="font-bold">
                {documents.filter((d) => d.status === "indexing").length}
              </span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-destructive/10">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <span className="text-sm">Failed</span>
              </div>
              <span className="font-bold">
                {documents.filter((d) => d.status === "failed").length}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Documents List */}
      <Card className="border-border/40">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Your Documents</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-8 text-xs"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {filteredDocuments.map((doc) => {
                const FileIcon = getFileIcon(doc.type);
                return (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="p-2 rounded bg-background">
                      <FileIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{doc.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{doc.size}</span>
                        <span>•</span>
                        <span>{doc.uploadedAt}</span>
                        {doc.status === "indexed" && (
                          <>
                            <span>•</span>
                            <span>{doc.chunks} chunks</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(doc.status)}
                      <Badge
                        variant={
                          doc.status === "indexed"
                            ? "default"
                            : doc.status === "indexing"
                            ? "secondary"
                            : "destructive"
                        }
                        className="text-[10px]"
                      >
                        {doc.status}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(doc.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default PersonalRAGPage;
