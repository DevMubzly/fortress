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


interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export function DocsAIPane() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [messages, setMessages] = React.useState<Message[]>([]);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  
  // Use Vercel AI SDK for completion
  const { completion, complete, isLoading, stop, error } = useCompletion({
    api: "/api/chat",
    onFinish: (prompt, completion) => {
      setMessages(prev => [
        ...prev, 
        { id: Date.now().toString(), role: 'assistant', content: completion }
      ]);
    }
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!query.trim() || isLoading) return;
    const userMsg = query;
    setQuery("");
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: userMsg }]);
    await complete(userMsg);
  };

  React.useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, completion, isLoading]);
  
  const suggestedQuestions = [
    "How do I install Fortress?",
    "What models are supported?",
    "How to configure API keys?",
    "Explain the security architecture",
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="shrink-0 text-blue-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 28 28">
                <path
                  className="fill-current opacity-80"
                  fillRule="evenodd"
                  d="M15.052 0c6.914.513 12.434 6.033 12.947 12.947h-5.015a7.932 7.932 0 0 1-7.932-7.932V0Zm-2.105 22.985V28C6.033 27.487.513 21.967 0 15.053h5.015a7.932 7.932 0 0 1 7.932 7.932Z"
                  clipRule="evenodd"
                />
                <path
                  className="fill-current opacity-40"
                  fillRule="evenodd"
                  d="M0 12.947C.513 6.033 6.033.513 12.947 0v5.015a7.932 7.932 0 0 1-7.932 7.932H0Zm22.984 2.106h5.015C27.486 21.967 21.966 27.487 15.052 28v-5.015a7.932 7.932 0 0 1 7.932-7.932Z"
                  clipRule="evenodd"
                />
            </svg>
          <span className="sr-only">Ask AI</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:w-[540px] sm:max-w-none flex flex-col p-0 gap-0">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 28 28">
                <path
                  className="fill-blue-500"
                  fillRule="evenodd"
                  d="M15.052 0c6.914.513 12.434 6.033 12.947 12.947h-5.015a7.932 7.932 0 0 1-7.932-7.932V0Zm-2.105 22.985V28C6.033 27.487.513 21.967 0 15.053h5.015a7.932 7.932 0 0 1 7.932 7.932Z"
                  clipRule="evenodd"
                />
                <path
                  className="fill-blue-300"
                  fillRule="evenodd"
                  d="M0 12.947C.513 6.033 6.033.513 12.947 0v5.015a7.932 7.932 0 0 1-7.932 7.932H0Zm22.984 2.106h5.015C27.486 21.967 21.966 27.487 15.052 28v-5.015a7.932 7.932 0 0 1 7.932-7.932Z"
                  clipRule="evenodd"
                />
            </svg>
            Fortress Assistant
          </SheetTitle>
          <SheetDescription>
            Ask questions about Fortress documentation, installation, and configuration.
          </SheetDescription>
        </SheetHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col bg-slate-50/50">
          <ScrollArea className="flex-1 p-6" ref={scrollRef}>
            {messages.length === 0 && !completion && !isLoading && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-8">
                <div className="bg-muted/50 p-4 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 28 28">
                    <path
                        className="fill-blue-500"
                        fillRule="evenodd"
                        d="M15.052 0c6.914.513 12.434 6.033 12.947 12.947h-5.015a7.932 7.932 0 0 1-7.932-7.932V0Zm-2.105 22.985V28C6.033 27.487.513 21.967 0 15.053h5.015a7.932 7.932 0 0 1 7.932 7.932Z"
                        clipRule="evenodd"
                    />
                    <path
                        className="fill-blue-300"
                        fillRule="evenodd"
                        d="M0 12.947C.513 6.033 6.033.513 12.947 0v5.015a7.932 7.932 0 0 1-7.932 7.932H0Zm22.984 2.106h5.015C27.486 21.967 21.966 27.487 15.052 28v-5.015a7.932 7.932 0 0 1 7.932-7.932Z"
                        clipRule="evenodd"
                    />
                  </svg>
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
                      className="justify-start text-left h-auto py-2 px-3 text-sm hover:bg-blue-50/50 hover:text-blue-600 hover:border-blue-200 transition-colors"
                      onClick={() => {
                        setQuery(q);
                        const userMsg = q;
                        // Manual submit to ensure state updates correctly
                        setQuery("");
                        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: userMsg }]);
                        complete(userMsg);
                      }}
                    >
                      <MessageSquare className="mr-2 h-3 w-3 opacity-50" />
                      {q}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col space-y-6">
            {messages.map((msg) => (
                <div key={msg.id} className={cn("flex w-full gap-2 mb-4", msg.role === 'user' ? "justify-end" : "justify-start")}>
                  {msg.role === 'assistant' && (
                    <div className="bg-white border p-2 rounded-lg shrink-0 h-8 w-8 flex items-center justify-center shadow-sm">
                        <Sparkles className="h-4 w-4 text-blue-600" />
                    </div>
                  )}
                  
                  <div className={cn("flex flex-col max-w-[80%]", msg.role === 'user' ? "items-end" : "items-start")}>
                    <span className="text-xs font-medium text-muted-foreground mb-1 px-1">
                        {msg.role === 'assistant' ? "Fortress" : "You"}
                    </span>
                    <div className={cn("text-sm p-3 rounded-2xl shadow-sm border", 
                        msg.role === 'assistant' 
                            ? "bg-white rounded-tl-sm text-foreground" 
                            : "bg-blue-600 text-white border-transparent rounded-tr-sm" // User bubble
                    )}>
                        <div className="prose prose-sm dark:prose-invert max-w-none break-words leading-relaxed text-inherit">
                             {msg.content.split('\n').map((line, i) => (
                                <p key={i} className="mb-0 min-h-[1em]">{line}</p>
                              ))}
                        </div>
                    </div>
                  </div>

                  {msg.role === 'user' && (
                    <div className="bg-blue-600 p-2 rounded-lg shrink-0 h-8 w-8 flex items-center justify-center shadow-sm text-white">
                        <MessageSquare className="h-4 w-4" />
                    </div>
                  )}
                </div>
            ))}

            {/* Streaming Message (Assistant only) */}
            {(isLoading && completion) && (
                <div className="flex w-full gap-2 mb-4 justify-start">
                  <div className="bg-white border p-2 rounded-lg shrink-0 h-8 w-8 flex items-center justify-center shadow-sm">
                    <Sparkles className="h-4 w-4 text-blue-600 animate-pulse" />
                  </div>
                  <div className="flex flex-col max-w-[80%] items-start">
                    <span className="text-xs font-medium text-muted-foreground mb-1 px-1">Fortress</span>
                    <div className="text-sm p-3 rounded-2xl shadow-sm border bg-white rounded-tl-sm text-foreground">
                        <div className="prose prose-sm dark:prose-invert max-w-none break-words leading-relaxed">
                            {completion.split('\n').map((line, i) => (
                                <p key={i} className="mb-0 min-h-[1em]">{line}</p>
                            ))}
                        </div>
                    </div>
                  </div>
                </div>
            )}
            
            {/* Loading Indicator (Waiting for start) */}
            {isLoading && !completion && (
                 <div className="flex w-full gap-2 mb-4 justify-start">
                    <div className="bg-white border p-2 rounded-lg shrink-0 h-8 w-8 flex items-center justify-center shadow-sm">
                        <Sparkles className="h-4 w-4 text-blue-600 animate-spin" />
                    </div>
                    <div className="flex flex-col max-w-[80%] items-start">
                        <span className="text-xs font-medium text-muted-foreground mb-1 px-1">Fortress</span>
                        <div className="flex items-center gap-1.5 p-4 bg-white border rounded-2xl rounded-tl-sm shadow-sm">
                             <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                             <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                             <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></span>
                        </div>
                    </div>
                 </div>
            )}
             </div>

                
                {error && (
                   <div className="p-4 bg-destructive/10 text-destructive rounded-md text-sm mt-4 border border-destructive/20">
                     An error occurred. Please try again.
                   </div>
                )}
          </ScrollArea>
          
          <div className="p-4 border-t bg-white">
            <div className="relative flex gap-2">
              <Textarea
                placeholder="Ask a question about Fortress..."
                className="min-h-[50px] max-h-[150px] w-full resize-none py-3 px-4 bg-slate-50 focus-visible:ring-1 border-slate-200 rounded-xl shadow-inner"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <Button 
                size="icon" 
                className={cn("h-[50px] w-[50px] shrink-0 rounded-xl shadow-sm transition-all", query.trim() ? "bg-blue-600 hover:bg-blue-700" : "bg-slate-200 text-slate-400 hover:bg-slate-300")}
                onClick={handleSubmit}
                disabled={isLoading || !query.trim()}
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
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
