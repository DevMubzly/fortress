"use client";

import * as React from "react";
import { Search, Loader2 } from "lucide-react";
import { useCompletion } from "ai/react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

export function DocsSearch() {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Use Vercel AI SDK for completion
  const { completion, complete, isLoading, stop } = useCompletion({
    api: "/api/chat",
  });

  const [query, setQuery] = React.useState("");

  const handleSearch = (value: string) => {
    setQuery(value);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && query) {
        complete(query);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        className={cn(
          "relative h-9 w-full justify-start rounded-[0.5rem] bg-background text-sm font-normal text-muted-foreground shadow-none sm:pr-12 md:w-full mb-4"
        )}
        onClick={() => setOpen(true)}
      >
        <span className="hidden lg:inline-flex">Search documentation...</span>
        <span className="inline-flex hidden lg:hidden">Search...</span>
        <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
        <Search className="h-4 w-4 absolute left-3 top-2.5 lg:hidden" />
      </Button>
      
      <CommandDialog open={open} onOpenChange={setOpen}>
        <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
                className={cn(
                    "flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                )}
                placeholder="Ask technical questions..."
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
            />
        </div>
        <CommandList className="max-h-[500px]">
          {isLoading && (
             <div className="p-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Thinking...
             </div>
          )}
          
          {!isLoading && completion && (
            <div className="p-4">
                <h4 className="text-sm font-semibold mb-2 text-primary">Answer:</h4>
                <div className="prose prose-sm dark:prose-invert text-sm">
                    {completion.split('\n').map((line, i) => (
                        <p key={i} className="mb-1">{line}</p>
                    ))}
                </div>
            </div>
          )}

          {!completion && !isLoading && (
              <CommandEmpty>No results found.</CommandEmpty>
          )}

          {!completion && !isLoading && (
             <CommandGroup heading="Suggestions">
                <CommandItem onSelect={() => { setQuery("How do I install Fortress?"); complete("How do I install Fortress?"); }}>
                    How do I install Fortress?
                </CommandItem>
                <CommandItem onSelect={() => { setQuery("What models are supported?"); complete("What models are supported?"); }}>
                    What models are supported?
                </CommandItem>
                <CommandItem onSelect={() => { setQuery("How to configure API keys?"); complete("How to configure API keys?"); }}>
                    How to configure API keys?
                </CommandItem>
             </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
