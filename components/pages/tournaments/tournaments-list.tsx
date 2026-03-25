"use client";

import React, { useState } from "react";
// import { TournamentCard } from "./tournament-card";
import { TournamentFilters } from "./tournament-filters";
import { CreateTournamentCTA } from "./create-tournament-cta";
import { Typography } from "@/components/ui/typography";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { TournamentCard } from "@/components/cards/tournament-card";

interface TournamentsListProps {
  initialTournaments: any[]; // À typer correctement avec le schéma
}

export function TournamentsList({ initialTournaments }: TournamentsListProps) {
  const [filters, setFilters] = useState({
    search: "",
    status: "ALL",
  });

  const filteredTournaments = initialTournaments.filter((tournament) => {
    // Filtre par recherche
    if (
      filters.search &&
      !tournament.name.toLowerCase().includes(filters.search.toLowerCase())
    ) {
      return false;
    }

    // Filtre par statut
    if (filters.status !== "ALL" && tournament.status !== filters.status) {
      return false;
    }

    return true;
  });

  const handleClearFilters = () => {
    setFilters({
      search: "",
      status: "ALL",
    });
  };

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div className="flex flex-col gap-2">
        <Typography
          variant="h1"
          className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent"
        >
          Tournois & Compétitions
        </Typography>
        <Typography
          variant="body-base"
          className="text-muted-foreground max-w-2xl"
        >
          Rejoignez les meilleures compétitions, affrontez d'autres joueurs et
          remportez des prix. Trouvez le tournoi qui correspond à votre style de
          jeu.
        </Typography>
      </div>

      <CreateTournamentCTA />

      <TournamentFilters
        filters={filters}
        onSearchChange={(value) => setFilters({ ...filters, search: value })}
        onStatusChange={(value) => setFilters({ ...filters, status: value })}
        onClear={handleClearFilters}
      />

      {filteredTournaments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence>
            {filteredTournaments.map((tournament, index) => (
              <motion.div
                key={tournament.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <TournamentCard showDetails={false} tournament={tournament} />
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
          <Typography
            variant="body-base"
            className="text-muted-foreground max-w-md"
          >
            Essayez de modifier vos filtres ou créez votre propre tournoi pour
            lancer la compétition !
          </Typography>
          <Button onClick={handleClearFilters} variant="outline">
            Effacer les filtres
          </Button>
        </div>
      )}
    </div>
  );
}
