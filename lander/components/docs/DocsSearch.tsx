"use client";

import * as React from "react";
import { Search, FileText, Settings, Shield, BookOpen, GitBranch } from "lucide-react";
import { useRouter } from "next/navigation";

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
import { DocsAIPane } from "./DocsAIPane";

export function DocsSearch() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

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

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false);
    command();
  }, []);

  return (
    <>
      <div className="flex items-center w-full gap-2 mb-4">
        <Button
          variant="outline"
          className={cn(
            "relative h-9 flex-1 justify-start rounded-lg bg-background text-sm font-normal text-muted-foreground shadow-none sm:pr-12"
          )}
          onClick={() => setOpen(true)}
        >
          <span className="hidden lg:inline-flex">Search documentation...</span>
          <span className="inline-flex lg:hidden">Search...</span>
          <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
          <Search className="h-4 w-4 absolute left-3 top-2.5 lg:hidden" />
        </Button>
        
        <DocsAIPane />
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Links">
            <CommandItem
              onSelect={() => runCommand(() => router.push("/docs"))}
            >
              <BookOpen className="mr-2 h-4 w-4" />
              Introduction
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push("/docs/installation"))}
            >
              <FileText className="mr-2 h-4 w-4" />
              Installation
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push("/docs/architecture"))}
            >
              <GitBranch className="mr-2 h-4 w-4" />
              Architecture
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push("/docs/administration"))}
            >
              <Settings className="mr-2 h-4 w-4" />
              Administration
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push("/docs/security"))}
            >
              <Shield className="mr-2 h-4 w-4" />
              Security Protocols
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Actions">
             <CommandItem
              onSelect={() => runCommand(() => {})}
             >
                <Search className="mr-2 h-4 w-4" />
                Search for keywords 
             </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
