"use client";

import { useQuery } from "@tanstack/react-query";
import { getPhaseStandings } from "@/actions/phases";
import { StandingsTable } from "./standings-table";
import { Skeleton } from "@/components/ui/skeleton";
import { Typography } from "@/components/ui/typography";
import { AlertCircle, Trophy } from "lucide-react";

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
    queryFn: () => getPhaseStandings(activePhaseId!),
    enabled: !!activePhaseId,
    staleTime: 1000 * 60, // 1 minute
  });

  if (!activePhaseId) {
    return (
      <div className="p-12 text-center bg-muted/30 border border-dashed rounded-2xl flex flex-col items-center justify-center space-y-3">
        <AlertCircle className="h-8 w-8 text-muted-foreground opacity-50" />
        <Typography variant="h6" className="text-muted-foreground">
          Aucune phase active
        </Typography>
        <Typography variant="body-sm" theme="muted">
          Activez une phase dans le dashboard pour voir le classement.
        </Typography>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
         <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-8 w-32" />
         </div>
         <Skeleton className="h-[400px] w-full rounded-2xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-12 text-center bg-destructive/10 border border-destructive/20 rounded-2xl flex flex-col items-center justify-center space-y-3">
        <AlertCircle className="h-8 w-8 text-destructive opacity-50" />
        <Typography variant="h6" className="text-destructive">
          Erreur de chargement
        </Typography>
        <Typography variant="body-sm" className="text-destructive/70">
          Impossible de récupérer les classements pour le moment.
        </Typography>
      </div>
    );
  }

  if (!standings || standings.length === 0) {
    return (
      <div className="p-12 text-center bg-muted/30 border border-dashed rounded-2xl flex flex-col items-center justify-center space-y-3">
        <Trophy className="h-8 w-8 text-muted-foreground opacity-50" />
        <Typography variant="h6" className="text-muted-foreground">
          Aucun classement disponible
        </Typography>
        <Typography variant="body-sm" theme="muted">
          Les statistiques seront calculées dès que les premiers matchs seront validés.
        </Typography>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <StandingsTable
        groups={standings}
        registrations={registrations}
        title={"Classement de la phase en cours"}
        mode={"group"}
        currentRegistrationId={currentRegistrationId}
      />
    </div>
  );
}
