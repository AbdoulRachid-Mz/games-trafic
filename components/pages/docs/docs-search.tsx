"use client";

import * as React from "react";
import { Search, File, Book, Database } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";

interface DocsSearchProps {
  guides?: { id: string; title: string; category: string }[];
}

export function DocsSearch({ guides = [] }: DocsSearchProps) {
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
      <Button
        variant="outline"
        className="relative h-9 w-full justify-start rounded-[0.5rem] text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64"
        onClick={() => setOpen(true)}
      >
        <span className="hidden lg:inline-flex">Search documentation...</span>
        <span className="inline-flex lg:hidden">Search...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Legal">
            <CommandItem
              onSelect={() =>
                runCommand(() => router.push("/docs/legal/privacy"))
              }
            >
              <File className="mr-2 h-4 w-4" />
              <span>Privacy Policy</span>
            </CommandItem>
            <CommandItem
              onSelect={() =>
                runCommand(() => router.push("/docs/legal/terms"))
              }
            >
              <File className="mr-2 h-4 w-4" />
              <span>Terms of Service</span>
            </CommandItem>
          </CommandGroup>
          <CommandGroup heading="System">
            <CommandItem
              onSelect={() => runCommand(() => router.push("/docs/schema"))}
            >
              <Database className="mr-2 h-4 w-4" />
              <span>Database Schema</span>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          {guides && guides.length > 0 && (
            <CommandGroup heading="Guides">
              {guides.map((guide) => (
                <CommandItem
                  key={guide.id}
                  onSelect={() =>
                    runCommand(() => router.push(`/docs/guides/${guide.id}`))
                  }
                >
                  <Book className="mr-2 h-4 w-4" />
                  <span>{guide.title}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({guide.category})
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
