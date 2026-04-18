"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface TournamentFilterValues {
  search: string;
  status: string;
  game: string;
  platform: string;
}

interface TournamentFiltersProps {
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onGameChange: (value: string) => void;
  onPlatformChange: (value: string) => void;
  onClear: () => void;
  filters: TournamentFilterValues;
  games?: string[]; // unique list of game names from the data
}

export function TournamentFilters({
  onSearchChange,
  onStatusChange,
  onGameChange,
  onPlatformChange,
  onClear,
  filters,
  games = [],
}: TournamentFiltersProps) {
  const hasActiveFilters =
    filters.search ||
    filters.status !== "ALL" ||
    filters.game !== "ALL" ||
    filters.platform !== "ALL";

  const statusLabels: Record<string, string> = {
    UPCOMING: "À venir",
    LIVE: "En cours",
    COMPLETED: "Terminé",
    CANCELLED: "Annulé",
  };

  const platformLabels: Record<string, string> = {
    PC: "PC",
    PLAYSTATION: "PlayStation",
    XBOX: "Xbox",
    NINTENDO_SWITCH: "Nintendo Switch",
    MOBILE: "Mobile",
    VR: "VR / AR",
    OTHER: "Autre",
  };

  return (
    <div className="space-y-3 mb-6">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un tournoi ou un jeu..."
            className="pl-9 bg-secondary/30 border-border/50 focus:border-primary/50 transition-colors"
            value={filters.search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {/* Status filter */}
          <Select value={filters.status} onValueChange={onStatusChange}>
            <SelectTrigger className="w-[145px] bg-secondary/30 border-border/50 shrink-0">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tous les statuts</SelectItem>
              <SelectItem value="UPCOMING">À venir</SelectItem>
              <SelectItem value="LIVE">En cours</SelectItem>
              <SelectItem value="COMPLETED">Terminé</SelectItem>
              <SelectItem value="CANCELLED">Annulé</SelectItem>
            </SelectContent>
          </Select>

          {/* Game filter */}
          {games.length > 0 && (
            <Select value={filters.game} onValueChange={onGameChange}>
              <SelectTrigger className="w-[145px] bg-secondary/30 border-border/50 shrink-0">
                <SelectValue placeholder="Jeu" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les jeux</SelectItem>
                {games.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Platform filter */}
          <Select value={filters.platform} onValueChange={onPlatformChange}>
            <SelectTrigger className="w-[145px] bg-secondary/30 border-border/50 shrink-0">
              <SelectValue placeholder="Plateforme" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Toutes plateformes</SelectItem>
              {Object.entries(platformLabels).map(([val, label]) => (
                <SelectItem key={val} value={val}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClear}
              className="shrink-0 text-muted-foreground hover:text-foreground border border-border/50"
              title="Effacer les filtres"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Active filter badges */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-1.5">
          {filters.search && (
            <Badge
              variant="secondary"
              className="flex items-center gap-1 text-xs"
            >
              <Search className="h-2.5 w-2.5" /> {filters.search}
              <X
                className="h-2.5 w-2.5 cursor-pointer ml-0.5 hover:text-destructive"
                onClick={() => onSearchChange("")}
              />
            </Badge>
          )}
          {filters.status !== "ALL" && (
            <Badge
              variant="secondary"
              className="flex items-center gap-1 text-xs"
            >
              {statusLabels[filters.status] || filters.status}
              <X
                className="h-2.5 w-2.5 cursor-pointer ml-0.5 hover:text-destructive"
                onClick={() => onStatusChange("ALL")}
              />
            </Badge>
          )}
          {filters.game !== "ALL" && (
            <Badge
              variant="secondary"
              className="flex items-center gap-1 text-xs"
            >
              🎮 {filters.game}
              <X
                className="h-2.5 w-2.5 cursor-pointer ml-0.5 hover:text-destructive"
                onClick={() => onGameChange("ALL")}
              />
            </Badge>
          )}
          {filters.platform !== "ALL" && (
            <Badge
              variant="secondary"
              className="flex items-center gap-1 text-xs"
            >
              {platformLabels[filters.platform] || filters.platform}
              <X
                className="h-2.5 w-2.5 cursor-pointer ml-0.5 hover:text-destructive"
                onClick={() => onPlatformChange("ALL")}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
