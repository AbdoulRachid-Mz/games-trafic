"use client";

import { useQuery } from "@tanstack/react-query";
import { getPhaseGroups, getPhaseGroupParticipants } from "@/actions/phases";
import { StandingsTable } from "./standings-table";
import { Skeleton } from "@/components/ui/skeleton";

export function EditionStandingsTab({
  activePhaseId,
  registrations,
  currentRegistrationId,
}: {
  activePhaseId?: string;
  registrations: any[];
  currentRegistrationId?: string;
}) {
  const { data: standings, isLoading, isError } = useQuery({
    queryKey: ["edition-standings", activePhaseId],
    queryFn: async () => {
      if (!activePhaseId) return [];

      const groupsRes = await getPhaseGroups({
        filters: { phaseId: activePhaseId },
        options: { sortBy: "order", sortOrder: "asc" },
        pagination: { page: 1, limit: 100 },
      });

      const result = [];
      for (const g of groupsRes.data) {
        const participantsRes = await getPhaseGroupParticipants({
          filters: { groupId: g.id },
          options: { sortBy: "points", sortOrder: "desc" },
          pagination: { page: 1, limit: 500 },
        });

        const rows = (participantsRes.data || []).map((p: any) => ({
          registrationId: p.registrationId,
          points: p.points ?? 0,
          matchesPlayed: p.matchesPlayed ?? 0,
          matchesWon: p.matchesWon ?? 0,
          matchesDrawn: p.matchesDrawn ?? 0,
          matchesLost: p.matchesLost ?? 0,
          scoreFor: p.scoreFor ?? 0,
          scoreAgainst: p.scoreAgainst ?? 0,
          scoreDifference: (p.scoreFor ?? 0) - (p.scoreAgainst ?? 0),
          position: p.position ?? undefined,
          qualified: p.qualified ?? false,
        }));

        result.push({
          groupId: g.id,
          groupName: g.name,
          rows,
        });
      }
      return result;
    },
    enabled: !!activePhaseId,
  });

  if (!activePhaseId) {
    return <div className="p-8 text-center text-muted-foreground border border-dashed rounded-xl">Aucune phase active pour les classements.</div>;
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
         <Skeleton className="h-10 w-full rounded-md" />
         <Skeleton className="h-[400px] w-full rounded-md" />
      </div>
    );
  }

  if (isError) {
    return <div className="p-8 text-center text-destructive border border-destructive/20 rounded-xl bg-destructive/10">Erreur lors du chargement des classements.</div>;
  }

  return (
    <StandingsTable
      groups={standings || []}
      registrations={registrations}
      title={"Classement de la phase en cours"}
      mode={"group"}
      currentRegistrationId={currentRegistrationId}
    />
  );
}
