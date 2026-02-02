"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface TournamentFiltersProps {
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onClear: () => void;
  filters: {
    search: string;
    status: string;
  };
}

export function TournamentFilters({
  onSearchChange,
  onStatusChange,
  onClear,
  filters,
}: TournamentFiltersProps) {
  const hasActiveFilters = filters.search || filters.status !== "ALL";

  return (
    <div className="space-y-4 mb-8">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un tournoi..."
            className="pl-9 bg-secondary/30"
            value={filters.search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
          <Select value={filters.status} onValueChange={onStatusChange}>
            <SelectTrigger className="w-[150px] bg-secondary/30">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tous les statuts</SelectItem>
              <SelectItem value="UPCOMING">À venir</SelectItem>
              <SelectItem value="LIVE">En cours</SelectItem>
              <SelectItem value="COMPLETED">Terminé</SelectItem>
            </SelectContent>
          </Select>
          
          {hasActiveFilters && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClear}
              className="shrink-0 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      {/* Active filters badges */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.search && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Recherche: {filters.search}
              <X 
                className="h-3 w-3 cursor-pointer ml-1" 
                onClick={() => onSearchChange("")}
              />
            </Badge>
          )}
          {filters.status !== "ALL" && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Statut: {filters.status === "UPCOMING" ? "À venir" : filters.status === "LIVE" ? "En cours" : "Terminé"}
              <X 
                className="h-3 w-3 cursor-pointer ml-1" 
                onClick={() => onStatusChange("ALL")}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
