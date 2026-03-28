"use client";

import { usePhaseMatches } from "@/hooks/use-editions";
import { MatchCard } from "@/components/cards/match-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Typography } from "@/components/ui/typography";

export function EditionMatchesTab({
  activePhaseId,
  currentUserId,
  isAdmin,
}: {
  activePhaseId?: string;
  currentUserId?: string;
  isAdmin?: boolean;
}) {
  const { data: matchesRes, isLoading, isError, refetch } = usePhaseMatches(
    activePhaseId || "",
    {
      filters: { phaseId: activePhaseId },
      options: { sortBy: "createdAt", sortOrder: "desc" },
    }
  );

  if (!activePhaseId) {
    return (
      <div className="p-8 text-center text-muted-foreground border border-dashed rounded-xl">
        Aucune phase active détaillée.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
         <Skeleton className="h-24 w-full rounded-md" />
         <Skeleton className="h-24 w-full rounded-md" />
         <Skeleton className="h-24 w-full rounded-md" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 text-center text-destructive border border-destructive/20 rounded-xl bg-destructive/10">
        Erreur lors du chargement des matchs.
      </div>
    );
  }

  const matches = matchesRes?.data || [];

  if (matches.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground border border-dashed rounded-xl">
        Aucun match n'a encore été généré pour la phase en cours.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b">
         <Typography variant="h6" weight="bold">Matchs Récents (Phase en cours)</Typography>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {matches.map((match: any) => (
          <MatchCard
            key={match.id}
            match={match}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
            onUpdate={() => refetch()}
          />
        ))}
      </div>
    </div>
  );
}
