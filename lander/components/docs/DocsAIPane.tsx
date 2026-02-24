"use client";

import * as React from "react";
import { Bot, FileText, Layout, Loader2, MessageSquare, Send, Sparkles, X } from "lucide-react";
import { useCompletion } from "@ai-sdk/react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";

export function DocsAIPane() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  
  // Use Vercel AI SDK for completion
  const { completion, complete, isLoading, stop, error } = useCompletion({
    api: "/api/chat",
    onFinish: () => {
      // Optional: scroll to bottom
    }
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (!query.trim()) return;
    complete(query);
  };
  
  const suggestedQuestions = [
    "How do I install Fortress?",
    "What models are supported?",
    "How to configure API keys?",
    "Explain the security architecture",
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="shrink-0">
          <Sparkles className="h-4 w-4" />
          <span className="sr-only">Ask AI</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-full sm:w-[540px] sm:max-w-none flex flex-col p-0 gap-0">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Fortress AI Assistant
          </SheetTitle>
          <SheetDescription>
            Ask questions about Fortress documentation, installation, and configuration.
          </SheetDescription>
        </SheetHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col">
          <ScrollArea className="flex-1 p-6">
            {!completion && !isLoading && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-8">
                <div className="bg-muted/50 p-4 rounded-full">
                  <Bot className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">How can I help you?</h3>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-1">
                    I can explain concepts, help with configuration, or guide you through installation.
                  </p>
                </div>
                
                <div className="grid gap-2 w-full max-w-sm mt-4">
                  {suggestedQuestions.map((q) => (
                    <Button 
                      key={q} 
                      variant="outline" 
                      className="justify-start text-left h-auto py-2 px-3 text-sm"
                      onClick={() => {
                        setQuery(q);
                        complete(q);
                      }}
                    >
                      <MessageSquare className="mr-2 h-3 w-3 opacity-50" />
                      {q}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {(completion || isLoading) && (
              <div className="space-y-6">
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg shrink-0 mt-0.5">
                    <MessageSquare className="h-4 w-4 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">You asked</p>
                    <p className="text-sm">{query}</p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex items-start gap-3">
                  <div className="bg-primary p-2 rounded-lg shrink-0 mt-0.5">
                    <Sparkles className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div className="space-y-2 flex-1 min-w-0">
                    <p className="text-sm font-medium text-muted-foreground">AI Answer</p>
                    <div className="prose prose-sm dark:prose-invert max-w-none text-sm break-words leading-relaxed">
                        {completion ? (
                          completion.split('\n').map((line, i) => (
                            <p key={i} className="mb-2 last:mb-0 min-h-[1.5em]">{line}</p>
                          ))
                        ) : null}
                        {isLoading && (
                          <span className="inline-flex gap-1 items-center animate-pulse">
                            Thinking... <Loader2 className="h-3 w-3 animate-spin"/>
                          </span>
                        )}
                    </div>
                  </div>
                </div>
                
                {error && (
                   <div className="p-4 bg-destructive/10 text-destructive rounded-md text-sm mt-4">
                     An error occurred. Please try again.
                   </div>
                )}
              </div>
            )}
          </ScrollArea>
          
          <div className="p-4 border-t bg-background">
            <div className="relative">
              <Textarea
                placeholder="Ask a question about Fortress..."
                className="min-h-[60px] w-full resize-none pr-12 py-3 bg-muted/50 focus-visible:ring-1"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <Button 
                size="icon" 
                className="absolute right-2 bottom-2 h-8 w-8" 
                onClick={handleSubmit}
                disabled={isLoading || !query.trim()}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                <span className="sr-only">Send</span>
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-2">
              AI-generated responses may be inaccurate. Verify important information.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
