import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  BookOpen,
  Star,
  Copy,
  Plus,
  FileText,
  Code,
  Mail,
  MessageSquare,
  Briefcase,
  PenTool,
  Sparkles,
  Heart,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PromptTemplate {
  id: string;
  title: string;
  description: string;
  prompt: string;
  category: string;
  icon: React.ElementType;
  isFavorite: boolean;
  usageCount: number;
}

const categories = [
  { id: "all", label: "All Templates", icon: BookOpen },
  { id: "writing", label: "Writing", icon: PenTool },
  { id: "coding", label: "Coding", icon: Code },
  { id: "email", label: "Email", icon: Mail },
  { id: "analysis", label: "Analysis", icon: Briefcase },
  { id: "creative", label: "Creative", icon: Sparkles },
];

const mockTemplates: PromptTemplate[] = [
  {
    id: "1",
    title: "Summarize Document",
    description: "Create a concise summary of any document or text",
    prompt: "Please summarize the following document in bullet points, highlighting the key takeaways:\n\n[Paste your document here]",
    category: "writing",
    icon: FileText,
    isFavorite: true,
    usageCount: 245,
  },
  {
    id: "2",
    title: "Code Review",
    description: "Get a comprehensive code review with suggestions",
    prompt: "Please review the following code for:\n1. Bugs and potential issues\n2. Performance optimizations\n3. Best practices\n4. Security concerns\n\n```\n[Paste your code here]\n```",
    category: "coding",
    icon: Code,
    isFavorite: false,
    usageCount: 189,
  },
  {
    id: "3",
    title: "Professional Email",
    description: "Draft a professional email response",
    prompt: "Help me write a professional email response. Context:\n- Recipient: [Name/Role]\n- Purpose: [What you need to communicate]\n- Tone: [Formal/Semi-formal/Friendly]\n\nOriginal email (if replying):\n[Paste email here]",
    category: "email",
    icon: Mail,
    isFavorite: true,
    usageCount: 312,
  },
  {
    id: "4",
    title: "Data Analysis",
    description: "Analyze data patterns and provide insights",
    prompt: "Analyze the following data and provide:\n1. Key trends and patterns\n2. Notable outliers\n3. Actionable insights\n4. Recommendations\n\nData:\n[Paste your data here]",
    category: "analysis",
    icon: Briefcase,
    isFavorite: false,
    usageCount: 156,
  },
  {
    id: "5",
    title: "Creative Brainstorm",
    description: "Generate creative ideas for any topic",
    prompt: "I need creative ideas for [topic/project]. Please generate 10 unique ideas with:\n- A catchy name\n- Brief description\n- Key benefits\n- Potential challenges",
    category: "creative",
    icon: Sparkles,
    isFavorite: true,
    usageCount: 278,
  },
  {
    id: "6",
    title: "Meeting Notes",
    description: "Format and organize meeting notes",
    prompt: "Convert these raw meeting notes into a structured format:\n- Attendees\n- Key decisions made\n- Action items (with owners and deadlines)\n- Next steps\n\nRaw notes:\n[Paste notes here]",
    category: "writing",
    icon: MessageSquare,
    isFavorite: false,
    usageCount: 198,
  },
];

const PromptLibraryPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [templates, setTemplates] = useState(mockTemplates);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { toast } = useToast();

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCopyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt);
    toast({
      title: "Copied to clipboard",
      description: "Prompt template has been copied.",
    });
  };

  const handleToggleFavorite = (id: string) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isFavorite: !t.isFavorite } : t))
    );
  };

  return (
    <div className="h-full overflow-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold">Prompt Library</h2>
            <p className="text-xs text-muted-foreground">Pre-built templates to boost your productivity</p>
          </div>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input placeholder="Template title" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Input placeholder="Brief description" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Prompt Template</label>
                <Textarea placeholder="Enter your prompt template..." rows={6} />
              </div>
              <Button className="w-full" onClick={() => setIsCreateOpen(false)}>
                Save Template
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Categories */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid grid-cols-6 w-full">
          {categories.map((cat) => (
            <TabsTrigger key={cat.id} value={cat.id} className="gap-1.5 text-xs">
              <cat.icon className="h-3.5 w-3.5" />
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-4">
          <div className="grid grid-cols-2 gap-4">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="border-border/40 hover:border-primary/30 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded bg-primary/10">
                        <template.icon className="h-4 w-4 text-primary" />
                      </div>
                      <CardTitle className="text-sm">{template.title}</CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleToggleFavorite(template.id)}
                    >
                      <Heart
                        className={`h-4 w-4 ${
                          template.isFavorite ? "fill-destructive text-destructive" : ""
                        }`}
                      />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground mb-3">{template.description}</p>
                  <div className="bg-muted/30 rounded p-2 mb-3">
                    <p className="text-xs font-mono line-clamp-2">{template.prompt}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-[10px]">
                      {template.usageCount} uses
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 gap-1"
                      onClick={() => handleCopyPrompt(template.prompt)}
                    >
                      <Copy className="h-3 w-3" />
                      Copy
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PromptLibraryPage;
