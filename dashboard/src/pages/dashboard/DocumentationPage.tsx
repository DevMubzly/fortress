import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Search, ChevronLeft, ChevronRight, Menu, X } from "lucide-react";
import { docsContent, docCategories, type DocItem } from "./docs/content";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const DocumentationPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeId = searchParams.get("doc") || "introduction";
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Find current doc
  const currentDocIndex = docsContent.findIndex(doc => doc.id === activeId);
  const currentDoc = docsContent[currentDocIndex >= 0 ? currentDocIndex : 0];

  // Navigation logic
  const prevDoc = currentDocIndex > 0 ? docsContent[currentDocIndex - 1] : null;
  const nextDoc = currentDocIndex < docsContent.length - 1 ? docsContent[currentDocIndex + 1] : null;

  const navigateTo = (id: string) => {
    setSearchParams({ doc: id });
    setIsMobileOpen(false);
  };

  // Filter for sidebar
  const filteredDocs = docsContent.filter(doc => 
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    doc.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group by category
  const groupedDocs = docCategories.map(category => ({
    category,
    items: filteredDocs.filter(doc => doc.category === category)
  })).filter(group => group.items.length > 0);

  const SidebarContent = () => (
    <div className="h-full flex flex-col gap-4 py-4">
      <div className="px-4">
        <h2 className="text-lg font-semibold tracking-tight mb-2">Documentation</h2>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search docs..." 
            className="pl-8 h-9" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-6 pb-8">
          {groupedDocs.map((group) => (
            <div key={group.category}>
              <h3 className="mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                {group.category}
              </h3>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <Button
                    key={item.id}
                    variant={activeId === item.id ? "secondary" : "ghost"}
                    size="sm"
                    className={cn(
                      "w-full justify-start font-normal h-8",
                      activeId === item.id && "bg-secondary font-medium"
                    )}
                    onClick={() => navigateTo(item.id)}
                  >
                    {item.icon && <item.icon className="mr-2 h-4 w-4 opacity-70" />}
                    {item.title}
                  </Button>
                ))}
              </div>
            </div>
          ))}
          {groupedDocs.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No results found
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 border-r bg-muted/10 shrink-0">
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto min-w-0">
        <div className="container max-w-4xl mx-auto px-6 py-8 md:py-12">
          {/* Mobile Header */}
          <div className="md:hidden mb-6 flex items-center justify-between">
            <h1 className="text-lg font-semibold">Documentation</h1>
            <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-80">
                <SidebarContent />
              </SheetContent>
            </Sheet>
          </div>

          {/* Breadcrumbs / Navigation Header */}
          <div className="mb-8 hidden md:block">
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <span>Docs</span>
              <ChevronRight className="h-3 w-3" />
              <span>{currentDoc.category}</span>
              <ChevronRight className="h-3 w-3" />
              <span className="font-medium text-foreground">{currentDoc.title}</span>
            </div>
          </div>

          {/* Content */}
          <article className="prose prose-slate dark:prose-invert max-w-none mb-16">
             {/* Use a simple custom renderer instead of react-markdown to keep deps zero */}
             <SimpleMarkdownRenderer content={currentDoc.content} />
          </article>

          <Separator className="my-8" />

          {/* Footer Navigation */}
          <div className="flex flex-col sm:flex-row justify-between gap-4 mt-8 pb-12">
            {prevDoc ? (
              <Button 
                variant="outline" 
                className="h-auto py-4 px-6 justify-start text-left group w-full sm:w-auto"
                onClick={() => navigateTo(prevDoc.id)}
              >
                <div className="flex flex-col items-start gap-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <ChevronLeft className="h-3 w-3 group-hover:-translate-x-1 transition-transform" /> 
                    Previous
                  </span>
                  <span className="font-medium">{prevDoc.title}</span>
                </div>
              </Button>
            ) : <div />}
            
            {nextDoc ? (
              <Button 
                variant="outline" 
                className="h-auto py-4 px-6 justify-end text-right group w-full sm:w-auto"
                onClick={() => navigateTo(nextDoc.id)}
              >
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    Next 
                    <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <span className="font-medium">{nextDoc.title}</span>
                </div>
              </Button>
            ) : <div />}
          </div>
        </div>
      </main>
    </div>
  );
};

// Simple Markdown Renderer component to avoid dependencies
const SimpleMarkdownRenderer = ({ content }: { content: string }) => {
  if (!content) return null;
  
  // Split by newlines but preserve code blocks? Simple approach first.
  const lines = content.split('\n');
  
  return (
    <div className="space-y-4">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <br key={i} className="content-spacer" />;
        
        // Headers
        if (trimmed.startsWith('### ')) return <h3 key={i} className="text-xl font-bold mt-6 mb-2">{trimmed.substring(4)}</h3>;
        if (trimmed.startsWith('## ')) return <h2 key={i} className="text-2xl font-bold mt-8 mb-4 border-b pb-2">{trimmed.substring(3)}</h2>;
        if (trimmed.startsWith('# ')) return <h1 key={i} className="text-3xl font-extrabold mb-6">{trimmed.substring(2)}</h1>;
        
        // Lists
        if (trimmed.startsWith('- ')) {
          // Check if previous line was also a list item to wrap in ul? 
          // For simplicity, just render individual items with bullet styling
          return (
            <div key={i} className="flex gap-2 ml-4">
              <span className="text-primary mt-1.5">•</span>
              <span dangerouslySetInnerHTML={{ __html: formatInline(trimmed.substring(2)) }} />
            </div>
          );
        }

        // Ordered lists (1. )
        if (/^\d+\.\s/.test(trimmed)) {
             const [num, ...rest] = trimmed.split('.');
             return (
                 <div key={i} className="flex gap-2 ml-4">
                     <span className="text-primary font-mono font-bold">{num}.</span>
                     <span dangerouslySetInnerHTML={{ __html: formatInline(rest.join('.').trim()) }} />
                 </div>
             )
        }
        
        // Code Blocks (simplistic - assumes single line code blocks for now or blocks start/end on separate lines)
        // If line is just ```, ignore? No, let's treat lines starting with specific chars specially.
        // For standard paragraphs:
        if (trimmed.startsWith('`') && trimmed.endsWith('`')) { // full line code
             return <pre key={i} className="bg-muted p-3 rounded-md overflow-x-auto text-sm"><code>{trimmed.replace(/`/g, '')}</code></pre>
        }

        return <p key={i} className="leading-7" dangerouslySetInnerHTML={{ __html: formatInline(trimmed) }} />;
      })}
    </div>
  );
};

// Helper for inline styles
const formatInline = (text: string) => {
    // Bold
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Inline code
    formatted = formatted.replace(/`([^`]+)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-primary">$1</code>');
    // Links (simple)
    formatted = formatted.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-primary hover:underline underline-offset-4">$1</a>');
    
    return formatted;
};

export default DocumentationPage;

