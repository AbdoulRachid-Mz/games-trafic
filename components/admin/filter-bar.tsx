// components/admin/filter-bar.tsx
"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, X } from "lucide-react";
import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

interface FilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onClearFilters?: () => void;
  hasActiveFilters?: boolean;
  placeholder?: string;
  children?: React.ReactNode;
  className?: string;
}

export function FilterBar({
  searchValue,
  onSearchChange,
  onClearFilters,
  hasActiveFilters = false,
  placeholder = "Rechercher...",
  children,
  className,
}: FilterBarProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row gap-4", className)}>
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 bg-background/50 border-border/50 focus:border-primary/50 rounded-xl"
        />
      </div>

      {/* Additional Filters */}
      {children}

      {/* Clear Filters */}
      {hasActiveFilters && onClearFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={onClearFilters}
          className="gap-2 rounded-xl"
        >
          <X className="h-4 w-4" />
          Réinitialiser
        </Button>
      )}
    </div>
  );
}
