"use client";

import React, { useState, useMemo } from "react";
import { ResponsiveFilters } from "@/components/shared/responsive-filters";
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Trophy, LayoutGrid, List, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

// Default statuses shown — upcoming & live
const DEFAULT_STATUSES = ["UPCOMING", "LIVE"];

interface TournamentsListProps {
  initialTournaments: any[];
}

export function TournamentsList({ initialTournaments }: TournamentsListProps) {
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("DEFAULT");
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>("ALL");
  const [tournamentSearchOpen, setTournamentSearchOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Unique tournament list for parent dropdown
  const uniqueTournaments = useMemo(() => {
    return initialTournaments.map((t) => ({ id: t.id, name: t.name }));
  }, [initialTournaments]);

  // Selected tournament label
  const selectedTournamentLabel = useMemo(() => {
    if (selectedTournamentId === "ALL") return null;
    return uniqueTournaments.find((t) => t.id === selectedTournamentId)?.name;
  }, [selectedTournamentId, uniqueTournaments]);

  const filteredTournaments = useMemo(() => {
    return initialTournaments.filter((tournament) => {
      // Tournament parent filter
      if (selectedTournamentId !== "ALL" && tournament.id !== selectedTournamentId) {
        return false;
      }
      // Search filter
      if (
        search &&
        !tournament.name?.toLowerCase().includes(search.toLowerCase()) &&
        !tournament.game?.toLowerCase().includes(search.toLowerCase()) &&
        !tournament.description?.toLowerCase().includes(search.toLowerCase())
      ) {
        return false;
      }
      // Status filter
      if (selectedStatus === "DEFAULT") {
        return DEFAULT_STATUSES.includes(tournament.status);
      }
      if (selectedStatus !== "ALL") {
        return tournament.status === selectedStatus;
      }
      return true;
    });
  }, [initialTournaments, search, selectedStatus, selectedTournamentId]);

  const handleClearFilters = () => {
    setSearch("");
    setSelectedStatus("DEFAULT");
    setSelectedTournamentId("ALL");
  };

  // Count active filters (exclude DEFAULT since that's the baseline)
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedTournamentId !== "ALL") count++;
    if (selectedStatus !== "DEFAULT") count++;
    return count;
  }, [selectedTournamentId, selectedStatus]);

  // Stats from all tournaments
  const stats = useMemo(
    () => ({
      total: initialTournaments.length,
      live: initialTournaments.filter((t) => t.status === "LIVE").length,
      upcoming: initialTournaments.filter((t) => t.status === "UPCOMING").length,
      completed: initialTournaments.filter((t) => t.status === "COMPLETED").length,
    }),
    [initialTournaments]
  );

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <Typography
          variant="h1"
          className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent"
        >
          Tournois &amp; Compétitions
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
          onClick={() => setSelectedStatus("ALL")}
        >
          <Trophy className="h-3 w-3" /> {stats.total} tournois
        </Badge>
        {stats.live > 0 && (
          <Badge
            className={cn(
              "gap-1.5 px-3 py-1 text-xs cursor-pointer hover:opacity-80",
              "bg-green-500/10 text-green-600 border-green-500/20",
              selectedStatus === "LIVE" && "ring-2 ring-green-500/40"
            )}
            onClick={() => setSelectedStatus("LIVE")}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
            {stats.live} en cours
          </Badge>
        )}
        {stats.upcoming > 0 && (
          <Badge
            className={cn(
              "gap-1.5 px-3 py-1 text-xs cursor-pointer hover:opacity-80",
              "bg-blue-500/10 text-blue-600 border-blue-500/20",
              selectedStatus === "UPCOMING" && "ring-2 ring-blue-500/40"
            )}
            onClick={() => setSelectedStatus("UPCOMING")}
          >
            {stats.upcoming} à venir
          </Badge>
        )}
        {stats.completed > 0 && (
          <Badge
            variant="outline"
            className={cn(
              "gap-1.5 px-3 py-1 text-xs text-muted-foreground cursor-pointer hover:bg-muted/50",
              selectedStatus === "COMPLETED" && "ring-2 ring-muted-foreground/30"
            )}
            onClick={() => setSelectedStatus("COMPLETED")}
          >
            {stats.completed} terminés
          </Badge>
        )}
      </div>

      <CreateTournamentCTA />

      {/* Responsive Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex-1 w-full">
          <ResponsiveFilters
            searchTerm={search}
            onSearchChange={setSearch}
            searchPlaceholder="Rechercher un tournoi..."
            onReset={handleClearFilters}
            activeFiltersCount={activeFiltersCount}
            title="Filtres"
            type="simple"
          >
            {/* Status selector */}
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[165px] h-8 text-xs bg-background border-border/70">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DEFAULT">Actifs (défaut)</SelectItem>
                <SelectItem value="ALL">Tous les statuts</SelectItem>
                <SelectItem value="UPCOMING">À venir</SelectItem>
                <SelectItem value="LIVE">En cours</SelectItem>
                <SelectItem value="COMPLETED">Terminés</SelectItem>
                <SelectItem value="CANCELLED">Annulés</SelectItem>
              </SelectContent>
            </Select>

            {/* Searchable tournament dropdown */}
            {uniqueTournaments.length > 1 && (
              <Popover open={tournamentSearchOpen} onOpenChange={setTournamentSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={tournamentSearchOpen}
                    className="h-8 text-xs justify-between gap-2 border-border/70 bg-background min-w-[180px]"
                  >
                    <span className="truncate max-w-[130px]">
                      {selectedTournamentLabel ?? "Tous les tournois"}
                    </span>
                    <ChevronsUpDown className="h-3 w-3 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[240px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Rechercher un tournoi..." className="h-9 text-xs" />
                    <CommandList>
                      <CommandEmpty>Aucun tournoi trouvé.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="ALL"
                          onSelect={() => {
                            setSelectedTournamentId("ALL");
                            setTournamentSearchOpen(false);
                          }}
                          className="text-xs"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-3 w-3",
                              selectedTournamentId === "ALL" ? "opacity-100" : "opacity-0"
                            )}
                          />
                          Tous les tournois
                        </CommandItem>
                        {uniqueTournaments.map((t) => (
                          <CommandItem
                            key={t.id}
                            value={t.name}
                            onSelect={() => {
                              setSelectedTournamentId(t.id);
                              setTournamentSearchOpen(false);
                            }}
                            className="text-xs"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-3 w-3",
                                selectedTournamentId === t.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {t.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            )}
          </ResponsiveFilters>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 shrink-0">
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
            {filteredTournaments.map((edition, index) => {
              // Map Edition + Parent Tournament to TournamentCard props
              const tournamentData = {
                ...edition.tournament,
                id: edition.tournamentId,
                status: edition.status, // Use edition status for listing
                currentEdition: {
                  id: edition.id,
                  name: edition.name || `Édition #${edition.editionNumber}`,
                  startDate: edition.startDate,
                  prizePool: Number(edition.prizePool || 0),
                  participants: edition.currentParticipants || 0,
                },
              };

              return (
                <motion.div
                  key={edition.id}
                  initial={{ opacity: 0, scale: 0.95, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.3) }}
                >
                  <TournamentCard
                    showDetails={viewMode !== "grid"}
                    item={tournamentData as any}
                    viewMode={viewMode}
                    onView={() => window.location.href = `/tournaments/${edition.tournamentId}/editions/${edition.id}`}
                  />
                </motion.div>
              );
            })}
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
            {selectedStatus === "DEFAULT"
              ? "Aucun tournoi actif ou à venir pour le moment. Consultez tous les tournois."
              : "Essayez de modifier vos filtres ou créez votre propre tournoi."}
          </Typography>
          <div className="flex gap-2">
            {selectedStatus === "DEFAULT" && (
              <Button onClick={() => setSelectedStatus("ALL")} variant="default">
                Voir tous les tournois
              </Button>
            )}
            <Button onClick={handleClearFilters} variant="outline">
              Effacer les filtres
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
