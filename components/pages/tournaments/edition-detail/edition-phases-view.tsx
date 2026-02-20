"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { GitBranch } from "lucide-react";
import { TournamentPhase } from "@/database/schema";
import { useEditionRegistrations, usePhaseBracketNodes, usePhaseMatches } from "@/hooks/use-editions";
import { MatchCard } from "@/components/cards/match-card";

interface EditionPhasesViewProps {
  phases: TournamentPhase[];
  isLoading?: boolean;
  editionId: string;
  currentUserId?: string;
  isAdmin?: boolean;
  onUpdate?: () => void;
}

export function EditionPhasesView({
  phases,
  isLoading,
  editionId,
  currentUserId,
  isAdmin,
  onUpdate,
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
            <PhaseBracket
              phase={phase}
              editionId={editionId}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              onUpdate={onUpdate}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function PhaseBracket({
  phase,
  editionId,
  currentUserId,
  isAdmin,
  onUpdate
}: {
  phase: TournamentPhase;
  editionId: string;
  currentUserId?: string;
  isAdmin?: boolean;
  onUpdate?: () => void;
}) {
  const { data: registrationsRes } = useEditionRegistrations(
    { editionId },
    { populate: ["member", "member.user", "member.team"] }
  );
  const registrations = registrationsRes?.data || [];

  const { data: nodesRes, isLoading: nodesLoading } = usePhaseBracketNodes(phase.id, {
    filters: { phaseId: phase.id },
    options: { sortBy: "order", sortOrder: "asc" },
  });
  const { data: matchesRes, isLoading: matchesLoading, refetch } = usePhaseMatches(phase.id, {
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

  const handleUpdate = () => {
    refetch();
    onUpdate?.();
  };

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-4 min-w-full">
        {sortedRounds.map(([roundNumber, roundMatches]) => (
          <div key={roundNumber} className="min-w-[300px] max-w-[400px]">
            <div className="mb-4 text-xs font-bold uppercase tracking-wider text-muted-foreground border-b pb-1">Round {roundNumber}</div>
            <div className="space-y-4">
              {roundMatches
                .sort((a: any, b: any) => (a.matchNumber ?? 0) - (b.matchNumber ?? 0))
                .map((match: any) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    currentUserId={currentUserId}
                    isAdmin={isAdmin}
                    onUpdate={handleUpdate}
                  />
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
