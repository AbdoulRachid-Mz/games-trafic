"use client";

import React, { useState, useMemo } from "react";
import { TournamentFilters, TournamentFilterValues } from "./tournament-filters";
import { CreateTournamentCTA } from "./create-tournament-cta";
import { Typography } from "@/components/ui/typography";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TournamentCard } from "@/components/cards/tournament-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trophy, LayoutGrid, List } from "lucide-react";

interface TournamentsListProps {
  initialTournaments: any[];
}

export function TournamentsList({ initialTournaments }: TournamentsListProps) {
  const [filters, setFilters] = useState<TournamentFilterValues>({
    search: "",
    status: "ALL",
    game: "ALL",
    platform: "ALL",
  });
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Derive unique game list from actual tournaments
  const uniqueGames = useMemo(() => {
    const games = new Set<string>();
    initialTournaments.forEach((t) => {
      if (t.game) games.add(t.game);
    });
    return Array.from(games).sort();
  }, [initialTournaments]);

  // Derive unique tournament names for parent filter (group by name/id)
  const uniqueTournaments = useMemo(() => {
    return initialTournaments.map((t) => ({ id: t.id, name: t.name }));
  }, [initialTournaments]);

  const filteredTournaments = useMemo(() => {
    return initialTournaments.filter((tournament) => {
      // Filter by tournament parent
      if (selectedTournamentId !== "ALL" && tournament.id !== selectedTournamentId) {
        return false;
      }
      // Search filter
      if (
        filters.search &&
        !tournament.name.toLowerCase().includes(filters.search.toLowerCase()) &&
        !tournament.game?.toLowerCase().includes(filters.search.toLowerCase()) &&
        !tournament.description?.toLowerCase().includes(filters.search.toLowerCase())
      ) {
        return false;
      }
      // Status filter
      if (filters.status !== "ALL" && tournament.status !== filters.status) {
        return false;
      }
      // Game filter
      if (filters.game !== "ALL" && tournament.game !== filters.game) {
        return false;
      }
      // Platform filter
      if (filters.platform !== "ALL" && tournament.platform !== filters.platform) {
        return false;
      }
      return true;
    });
  }, [initialTournaments, filters, selectedTournamentId]);

  const handleClearFilters = () => {
    setFilters({ search: "", status: "ALL", game: "ALL", platform: "ALL" });
    setSelectedTournamentId("ALL");
  };

  // Stats
  const stats = useMemo(() => ({
    total: initialTournaments.length,
    live: initialTournaments.filter((t) => t.status === "LIVE").length,
    upcoming: initialTournaments.filter((t) => t.status === "UPCOMING").length,
    completed: initialTournaments.filter((t) => t.status === "COMPLETED").length,
  }), [initialTournaments]);

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <Typography
          variant="h1"
          className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent"
        >
          Tournois & Compétitions
        </Typography>
        <Typography variant="body-base" className="text-muted-foreground max-w-2xl">
          Rejoignez les meilleures compétitions, affrontez d'autres joueurs et remportez des prix.
        </Typography>
      </div>

      {/* Stats pills */}
      <div className="flex flex-wrap gap-2">
        <Badge
          variant="outline"
          className="gap-1.5 px-3 py-1 text-xs font-semibold cursor-pointer"
          onClick={() => setFilters(f => ({ ...f, status: "ALL" }))}
        >
          <Trophy className="h-3 w-3" /> {stats.total} tournois
        </Badge>
        {stats.live > 0 && (
          <Badge
            className="gap-1.5 px-3 py-1 text-xs bg-green-500/10 text-green-600 border-green-500/20 cursor-pointer hover:bg-green-500/20"
            onClick={() => setFilters(f => ({ ...f, status: "LIVE" }))}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
            {stats.live} en cours
          </Badge>
        )}
        {stats.upcoming > 0 && (
          <Badge
            variant="outline"
            className="gap-1.5 px-3 py-1 text-xs text-blue-600 border-blue-500/30 cursor-pointer hover:bg-blue-500/10"
            onClick={() => setFilters(f => ({ ...f, status: "UPCOMING" }))}
          >
            {stats.upcoming} à venir
          </Badge>
        )}
        {stats.completed > 0 && (
          <Badge
            variant="outline"
            className="gap-1.5 px-3 py-1 text-xs text-muted-foreground cursor-pointer hover:bg-muted/50"
            onClick={() => setFilters(f => ({ ...f, status: "COMPLETED" }))}
          >
            {stats.completed} terminés
          </Badge>
        )}
      </div>

      <CreateTournamentCTA />

      {/* Tournament parent filter + View toggle */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        {uniqueTournaments.length > 1 && (
          <Select value={selectedTournamentId} onValueChange={setSelectedTournamentId}>
            <SelectTrigger className="w-full sm:w-[220px] bg-secondary/30 border-border/50">
              <SelectValue placeholder="Filtrer par tournoi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tous les tournois</SelectItem>
              {uniqueTournaments.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <div className="flex items-center gap-1 ml-auto">
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <TournamentFilters
        filters={filters}
        onSearchChange={(v) => setFilters((f) => ({ ...f, search: v }))}
        onStatusChange={(v) => setFilters((f) => ({ ...f, status: v }))}
        onGameChange={(v) => setFilters((f) => ({ ...f, game: v }))}
        onPlatformChange={(v) => setFilters((f) => ({ ...f, platform: v }))}
        onClear={handleClearFilters}
        games={uniqueGames}
      />

      {/* Results */}
      {filteredTournaments.length > 0 ? (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              : "flex flex-col gap-4"
          }
        >
          <AnimatePresence>
            {filteredTournaments.map((tournament, index) => (
              <motion.div
                key={tournament.id}
                initial={{ opacity: 0, scale: 0.95, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.3) }}
              >
                <TournamentCard
                  showDetails={viewMode === "grid" ? false : true}
                  tournament={tournament}
                  viewMode={viewMode}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="bg-secondary/50 p-6 rounded-full">
            <Typography variant="h2" className="text-4xl">
              🔍
            </Typography>
          </div>
          <Typography variant="h3">Aucun tournoi trouvé</Typography>
          <Typography variant="body-base" className="text-muted-foreground max-w-md">
            Essayez de modifier vos filtres ou créez votre propre tournoi pour lancer la compétition !
          </Typography>
          <Button onClick={handleClearFilters} variant="outline">
            Effacer les filtres
          </Button>
        </div>
      )}
    </div>
  );
}
