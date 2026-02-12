"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { GitBranch } from "lucide-react";
import { TournamentPhase } from "@/database/schema";
import { useEditionRegistrations, usePhaseBracketNodes, usePhaseMatches } from "@/hooks/use-editions";

interface EditionPhasesViewProps {
  phases: TournamentPhase[];
  isLoading?: boolean;
  editionId: string;
}

export function EditionPhasesView({
  phases,
  isLoading,
  editionId,
}: EditionPhasesViewProps) {
  if (isLoading) {
    return <div>Chargement des phases...</div>;
  }

  if (phases.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
          <GitBranch className="h-12 w-12 mb-4 opacity-50" />
          <Typography variant="h6" className="mb-1">
            Aucune phase configurée
          </Typography>
          <Typography variant="body-sm">
            La structure du tournoi n'a pas encore été définie.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {phases.map((phase) => (
        <Card key={phase.id}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-lg">
              <span>{phase.name}</span>
              <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-1 rounded">
                {phase.phaseType}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PhaseBracket phase={phase} editionId={editionId} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function PhaseBracket({ phase, editionId }: { phase: TournamentPhase; editionId: string }) {
  const { data: registrationsRes } = useEditionRegistrations(
    { editionId },
    { populate: ["member", "member.user", "member.team"] }
  );
  const registrations = registrationsRes?.data || [];
  const nameByRegistrationId = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const reg of registrations as any[]) {
      const member = reg.member;
      const username = member?.user?.username || member?.user?.fullName;
      const teamName = member?.team?.name;
      const display = username || teamName || "TBD";
      map.set(reg.id, display);
    }
    return map;
  }, [registrations]);

  const { data: nodesRes, isLoading: nodesLoading } = usePhaseBracketNodes(phase.id, {
    filters: { phaseId: phase.id },
    options: { sortBy: "order", sortOrder: "asc" },
  });
  const { data: matchesRes, isLoading: matchesLoading } = usePhaseMatches(phase.id, {
    filters: { phaseId: phase.id },
    options: { sortBy: "round", sortOrder: "asc" },
  });

  if (nodesLoading || matchesLoading) {
    return (
      <div className="flex items-center justify-center p-8 bg-muted/30 rounded-lg border border-dashed">
        <Typography theme="muted">Chargement du bracket...</Typography>
      </div>
    );
  }

  const nodes = nodesRes?.data || [];
  const matches = matchesRes?.data || [];

  if (nodes.length === 0 && matches.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 bg-muted/30 rounded-lg border border-dashed">
        <Typography theme="muted">Aucun bracket configuré pour cette phase</Typography>
      </div>
    );
  }

  const rounds = new Map<number, any[]>();
  for (const m of matches as any[]) {
    const r = m.round || 1;
    const arr = rounds.get(r) || [];
    arr.push(m);
    rounds.set(r, arr);
  }
  const sortedRounds = Array.from(rounds.entries()).sort((a, b) => a[0] - b[0]);

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-4 min-w-full">
        {sortedRounds.map(([roundNumber, roundMatches]) => (
          <div key={roundNumber} className="min-w-[260px]">
            <div className="mb-2 text-xs font-semibold text-muted-foreground">Round {roundNumber}</div>
            <div className="space-y-3">
              {roundMatches
                .sort((a: any, b: any) => (a.matchNumber ?? 0) - (b.matchNumber ?? 0))
                .map((match: any) => {
                  const p1 = nameByRegistrationId.get(match.participant1RegistrationId) || "TBD";
                  const p2 = nameByRegistrationId.get(match.participant2RegistrationId) || "TBD";
                  const statusLabel =
                    match.status === "COMPLETED"
                      ? "Terminé"
                      : match.status === "LIVE"
                      ? "En cours"
                      : "À venir";
                  return (
                    <div key={match.id} className="rounded-lg border bg-card p-3">
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">Match {match.matchNumber}</div>
                        <div className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground">{statusLabel}</div>
                      </div>
                      <div className="mt-2">
                        <div className="flex justify-between">
                          <span className="font-medium">{p1}</span>
                          <span className="text-sm">{match.score1 ?? "-"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">{p2}</span>
                          <span className="text-sm">{match.score2 ?? "-"}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
