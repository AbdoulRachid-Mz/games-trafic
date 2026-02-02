// components/pages/chats/chat-search.tsx
"use client";

import React, { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, X, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConversationFilter } from "@/types/chat";
import { debounce } from "@/lib/chat-utils";

interface ChatSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filter: ConversationFilter;
  onFilterChange: (filter: ConversationFilter) => void;
  className?: string;
}

export function ChatSearch({
  searchQuery,
  onSearchChange,
  filter,
  onFilterChange,
  className,
}: ChatSearchProps) {
  const [localQuery, setLocalQuery] = useState(searchQuery);

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      onSearchChange(query);
    }, 300),
    [onSearchChange]
  );

  const handleSearchChange = (value: string) => {
    setLocalQuery(value);
    debouncedSearch(value);
  };

  const handleClear = () => {
    setLocalQuery("");
    onSearchChange("");
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--chat-textMuted)]" />
        <Input
          type="text"
          placeholder="Search conversations..."
          value={localQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className={cn(
            "pl-10 pr-10",
            "bg-[var(--chat-surface)]",
            "border-[var(--chat-border)]",
            "text-[var(--chat-text)]",
            "placeholder:text-[var(--chat-textMuted)]",
            "focus-visible:ring-[var(--chat-primary)]"
          )}
        />
        {localQuery && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Filter tabs */}
      <Tabs
        value={filter}
        onValueChange={(value) => onFilterChange(value as ConversationFilter)}
      >
        <TabsList className="w-full bg-[var(--chat-surface)] border border-[var(--chat-border)]">
          <TabsTrigger
            value="all"
            className="flex-1 data-[state=active]:bg-[var(--chat-primary)] data-[state=active]:text-[var(--chat-messageSentText)]"
          >
            All
          </TabsTrigger>
          <TabsTrigger
            value="unread"
            className="flex-1 data-[state=active]:bg-[var(--chat-primary)] data-[state=active]:text-[var(--chat-messageSentText)]"
          >
            Unread
          </TabsTrigger>
          <TabsTrigger
            value="groups"
            className="flex-1 data-[state=active]:bg-[var(--chat-primary)] data-[state=active]:text-[var(--chat-messageSentText)]"
          >
            Groups
          </TabsTrigger>
          <TabsTrigger
            value="users"
            className="flex-1 data-[state=active]:bg-[var(--chat-primary)] data-[state=active]:text-[var(--chat-messageSentText)]"
          >
            Users
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
