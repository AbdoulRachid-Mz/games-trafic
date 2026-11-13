"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getEditionStandings, getPhaseStandings } from "@/actions/phases";
import { StandingsTable, type StandingRow } from "./standings-table";
import { Skeleton } from "@/components/ui/skeleton";
import { Typography } from "@/components/ui/typography";
import { AlertCircle, Globe2, Layers, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

type Scope = "edition" | "phase";

export function EditionStandingsTab({
  editionId,
  activePhaseId,
  registrations,
  currentRegistrationId,
}: {
  editionId?: string;
  activePhaseId?: string;
  registrations: any[];
  currentRegistrationId?: string;
}) {
  const [scope, setScope] = useState<Scope>("edition");

  const editionQuery = useQuery({
    queryKey: ["edition-standings", editionId, "global"],
    queryFn: () => getEditionStandings(editionId!),
    enabled: !!editionId,
    staleTime: 1000 * 60,
  });

  const phaseQuery = useQuery({
    queryKey: ["edition-standings", activePhaseId, "phase"],
    queryFn: () => getPhaseStandings(activePhaseId!),
    enabled: !!activePhaseId && scope === "phase",
    staleTime: 1000 * 60,
  });

  const editionRows: StandingRow[] = (editionQuery.data?.rows ?? []).map(
    (row) => ({
      registrationId: row.registrationId,
      position: row.position,
      points: row.points,
      matchesPlayed: row.matchesPlayed,
      matchesWon: row.matchesWon,
      matchesDrawn: row.matchesDrawn,
      matchesLost: row.matchesLost,
      scoreFor: row.scoreFor,
      scoreAgainst: row.scoreAgainst,
      scoreDifference: row.scoreDifference,
      qualified: row.qualified,
      participantName: row.displayName,
      participantImage: row.avatar ?? undefined,
    }),
  );

  const isLoading =
    scope === "edition" ? editionQuery.isLoading : phaseQuery.isLoading;
  const isError =
    scope === "edition" ? editionQuery.isError : phaseQuery.isError;
  const phaseGroups = phaseQuery.data ?? [];

  if (!editionId) {
    return (
      <div className="p-12 text-center bg-muted/30 border border-dashed rounded-2xl flex flex-col items-center justify-center space-y-3">
        <AlertCircle className="h-8 w-8 text-muted-foreground opacity-50" />
        <Typography variant="h6" className="text-muted-foreground">
          Édition introuvable
        </Typography>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          <Typography variant="h5" weight="bold">
            Classements
          </Typography>
        </div>

        <div
          role="tablist"
          aria-label="Portée du classement"
          className="inline-flex rounded-xl border bg-muted/40 p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={scope === "edition"}
            onClick={() => setScope("edition")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs md:text-sm font-medium transition",
              scope === "edition"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Globe2 className="h-3.5 w-3.5" />
            Toute l&apos;édition
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={scope === "phase"}
            onClick={() => setScope("phase")}
            disabled={!activePhaseId}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs md:text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed",
              scope === "phase"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Layers className="h-3.5 w-3.5" />
            Phase en cours
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-[400px] w-full rounded-2xl" />
        </div>
      ) : isError ? (
        <div className="p-12 text-center bg-destructive/10 border border-destructive/20 rounded-2xl flex flex-col items-center justify-center space-y-3">
          <AlertCircle className="h-8 w-8 text-destructive opacity-50" />
          <Typography variant="h6" className="text-destructive">
            Erreur de chargement
          </Typography>
          <Typography variant="body-sm" className="text-destructive/70">
            Impossible de récupérer les classements pour le moment.
          </Typography>
        </div>
      ) : scope === "edition" ? (
        <StandingsTable
          mode="edition"
          editionRows={editionRows}
          registrations={registrations}
          title="Classement global de l'édition"
          editionId={editionId}
          currentRegistrationId={currentRegistrationId}
        />
      ) : !activePhaseId ? (
        <div className="p-12 text-center bg-muted/30 border border-dashed rounded-2xl flex flex-col items-center justify-center space-y-3">
          <AlertCircle className="h-8 w-8 text-muted-foreground opacity-50" />
          <Typography variant="h6" className="text-muted-foreground">
            Aucune phase active
          </Typography>
          <Typography variant="body-sm" theme="muted">
            Activez une phase dans le dashboard pour voir le classement.
          </Typography>
        </div>
      ) : phaseGroups.length === 0 ? (
        <div className="p-12 text-center bg-muted/30 border border-dashed rounded-2xl flex flex-col items-center justify-center space-y-3">
          <Trophy className="h-8 w-8 text-muted-foreground opacity-50" />
          <Typography variant="h6" className="text-muted-foreground">
            Aucun classement disponible
          </Typography>
          <Typography variant="body-sm" theme="muted">
            Les statistiques seront calculées dès que les premiers matchs seront
            validés.
          </Typography>
        </div>
      ) : (
        <StandingsTable
          groups={phaseGroups}
          registrations={registrations}
          title="Classement de la phase en cours"
          mode="group"
          editionId={editionId}
          phaseId={activePhaseId}
          currentRegistrationId={currentRegistrationId}
        />
      )}
    </div>
  );
}
