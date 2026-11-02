// @/components/pages/tournaments/edition-detail/edition-brackets-tab.tsx
"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  GitBranch,
  Trophy,
  Swords,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  ChevronRight,
  Filter,
  Layers,
  Sparkles,
} from "lucide-react";
import { TournamentPhase } from "@/database/schema";
import { useQuery } from "@tanstack/react-query";
import { getMatches } from "@/actions/tournaments";
import { getBracketNodes } from "@/actions/phases";
import { BracketNodeCard } from "@/components/cards/bracket-node-card";
import { BracketExportButton } from "./bracket-export-button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { MatchCard } from "@/components/cards/match-card";

interface EditionBracketsTabProps {
  editionId: string;
  tournamentId: string;
  phases: TournamentPhase[];
  isOrganizer?: boolean;
}

export function EditionBracketsTab({
  editionId,
  tournamentId,
  phases = [],
  isOrganizer = false,
}: EditionBracketsTabProps) {
  // Filtrer les phases qui sont de type ELIMINATION, KNOCKOUT ou contiennent des mots-clés d'arbre
  const bracketPhases = useMemo(() => {
    return phases.filter(
      (p) =>
        p.phaseType === "KNOCKOUT" ||
        p.phaseType === "ELIMINATION" ||
        p.name?.toLowerCase().includes("bracket") ||
        p.name?.toLowerCase().includes("arbre") ||
        p.name?.toLowerCase().includes("playoff") ||
        p.name?.toLowerCase().includes("finale")
    );
  }, [phases]);

  // Si aucune phase explicitement marquée bracket, utiliser les phases existantes
  const availablePhases = bracketPhases.length > 0 ? bracketPhases : phases;

  const [selectedPhaseId, setSelectedPhaseId] = useState<string>(
    availablePhases[0]?.id || ""
  );

  // Charger les nœuds de bracket pour la phase sélectionnée
  const {
    data: nodesResponse,
    isLoading: isNodesLoading,
  } = useQuery({
    queryKey: ["bracket-nodes", selectedPhaseId, editionId],
    queryFn: async () => {
      if (!selectedPhaseId) return { data: [] };
      return await getBracketNodes({
        filters: { phaseId: selectedPhaseId },
        options: { sortBy: "order", sortOrder: "asc" },
        pagination: { page: 1, limit: 100 },
      });
    },
    enabled: !!selectedPhaseId,
  });

  // Charger les matchs pour la phase sélectionnée
  const {
    data: matchesResponse,
    isLoading: isMatchesLoading,
  } = useQuery({
    queryKey: ["edition-bracket-matches", selectedPhaseId, editionId],
    queryFn: async () => {
      return await getMatches({
        filters: { editionId, phaseId: selectedPhaseId },
        options: { sortBy: "round", sortOrder: "asc" },
        pagination: { page: 1, limit: 200 },
      });
    },
    enabled: !!selectedPhaseId,
  });

  const nodes = nodesResponse?.data || [];
  const matches = matchesResponse?.data || [];

  // Grouper les matchs par round
  const matchesByRound = useMemo(() => {
    const grouped: Record<number, any[]> = {};
    matches.forEach((match: any) => {
      const round = match.round || 1;
      if (!grouped[round]) grouped[round] = [];
      grouped[round].push(match);
    });
    return grouped;
  }, [matches]);

  const rounds = Object.keys(matchesByRound)
    .map(Number)
    .sort((a, b) => a - b);

  const getRoundName = (roundIndex: number, totalRounds: number) => {
    const distanceToFinal = totalRounds - roundIndex - 1;
    if (distanceToFinal === 0) return "Grande Finale";
    if (distanceToFinal === 1) return "Demi-finales";
    if (distanceToFinal === 2) return "Quarts de finale";
    if (distanceToFinal === 3) return "Huitièmes (1/8)";
    return `Tour ${roundIndex + 1}`;
  };

  if (phases.length === 0) {
    return (
      <div className="p-12 text-center bg-card/40 backdrop-blur-xl border border-white/5 rounded-3xl flex flex-col items-center justify-center space-y-4">
        <GitBranch className="h-12 w-12 text-muted-foreground opacity-40 animate-pulse" />
        <Typography variant="h4" className="font-black italic tracking-tighter">
          Aucun arbre configuré
        </Typography>
        <Typography variant="body-base" theme="muted" className="max-w-md">
          Les phases éliminatoires et l&apos;arbre de tournoi n&apos;ont pas encore été générés pour cette édition.
        </Typography>
        {isOrganizer && (
          <Button asChild className="font-bold gap-2 mt-2 shadow-[0_0_20px_rgba(var(--primary),0.3)]">
            <Link href={`/tournaments/${tournamentId}/editions/${editionId}/dashboard/brackets`}>
              Générer l&apos;arbre de tournoi
            </Link>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header du Bracket : Sélecteur de phase & Outils */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/60 backdrop-blur-xl border border-white/5 rounded-2xl p-4 md:p-6 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
            <GitBranch className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl md:text-2xl font-black italic tracking-tighter flex items-center gap-2">
              Arbre des Play-offs
              <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] uppercase font-black tracking-wider">
                Tournoi
              </Badge>
            </h3>
            <p className="text-xs md:text-sm text-muted-foreground font-medium">
              Structure à élimination directe et progression des équipes
            </p>
          </div>
        </div>

        {/* Phase switcher if multiple */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {availablePhases.length > 1 && (
            <div className="flex flex-wrap gap-1.5 p-1 bg-background/50 border border-white/5 rounded-xl">
              {availablePhases.map((phase) => (
                <button
                  key={phase.id}
                  onClick={() => setSelectedPhaseId(phase.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                    selectedPhaseId === phase.id
                      ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.4)]"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  )}
                >
                  {phase.name}
                </button>
              ))}
            </div>
          )}

          {isOrganizer && (
            <Button variant="outline" size="sm" asChild className="gap-2 border-white/10 shrink-0">
              <Link href={`/tournaments/${tournamentId}/editions/${editionId}/dashboard/brackets`}>
                Gérer les nœuds
              </Link>
            </Button>
          )}

          <BracketExportButton
            phase={availablePhases.find((p) => p.id === selectedPhaseId) || availablePhases[0]}
            nodes={nodes}
            tournamentName="Tournoi"
          />
        </div>
      </div>

      {/* Chargement */}
      {(isNodesLoading || isMatchesLoading) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-80 w-full rounded-2xl bg-card/40" />
          <Skeleton className="h-80 w-full rounded-2xl bg-card/40" />
          <Skeleton className="h-80 w-full rounded-2xl bg-card/40" />
        </div>
      )}

      {/* Visualisation par rounds horizontaux façon Liquipedia / Esports */}
      {!isNodesLoading && !isMatchesLoading && rounds.length > 0 && (
        <div className="overflow-x-auto pb-6 pt-2">
          <div className="flex gap-6 min-w-max items-start">
            {rounds.map((round, rIndex) => {
              const roundMatches = matchesByRound[round] || [];
              const roundName = getRoundName(rIndex, rounds.length);
              const isFinal = rIndex === rounds.length - 1;

              return (
                <div
                  key={round}
                  className="w-80 flex flex-col gap-4 relative"
                >
                  {/* Round Header */}
                  <div
                    className={cn(
                      "p-3 rounded-xl border flex items-center justify-between shadow-lg",
                      isFinal
                        ? "bg-gradient-to-r from-yellow-500/20 via-amber-500/10 to-yellow-500/5 border-yellow-500/30 text-yellow-400"
                        : "bg-card/70 backdrop-blur-md border-white/10 text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {isFinal ? (
                        <Trophy className="h-4 w-4 text-yellow-500 animate-bounce" />
                      ) : (
                        <Swords className="h-4 w-4 text-primary" />
                      )}
                      <span className="font-black text-sm uppercase tracking-wider italic">
                        {roundName}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-bold border-white/10">
                      {roundMatches.length} {roundMatches.length > 1 ? "matchs" : "match"}
                    </Badge>
                  </div>

                  {/* Matches list in round */}
                  <div className="flex flex-col gap-4">
                    {roundMatches.map((match: any) => (
                      <div
                        key={match.id}
                        className={cn(
                          "transition-all duration-300 hover:scale-[1.02]",
                          isFinal && "border-2 border-yellow-500/30 rounded-2xl"
                        )}
                      >
                        <MatchCard
                          item={match}
                          viewMode="compact"
                          showMinInfo={false}
                          className="w-full bg-card/90 backdrop-blur-md border border-white/10 shadow-xl"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Si aucun match généré mais des nœuds existent */}
      {!isNodesLoading && !isMatchesLoading && rounds.length === 0 && nodes.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {nodes.map((node: any) => (
            <BracketNodeCard
              key={node.id}
              item={node}
              tournamentId={tournamentId}
              editionId={editionId}
              viewMode="grid"
            />
          ))}
        </div>
      )}

      {/* Si ni nœuds ni matchs */}
      {!isNodesLoading && !isMatchesLoading && rounds.length === 0 && nodes.length === 0 && (
        <div className="p-12 text-center bg-card/40 backdrop-blur-xl border border-white/5 rounded-3xl flex flex-col items-center justify-center space-y-4">
          <GitBranch className="h-12 w-12 text-muted-foreground opacity-30" />
          <Typography variant="h5" className="font-black italic tracking-tighter">
            Arbre en attente de génération
          </Typography>
          <Typography variant="body-sm" theme="muted" className="max-w-md">
            Les rencontres de cette phase n&apos;ont pas encore été tirées au sort ou programmées.
          </Typography>
          {isOrganizer && (
            <Button asChild size="sm" className="font-bold gap-2">
              <Link href={`/tournaments/${tournamentId}/editions/${editionId}/dashboard/brackets`}>
                Configurer dans le tableau de bord
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
