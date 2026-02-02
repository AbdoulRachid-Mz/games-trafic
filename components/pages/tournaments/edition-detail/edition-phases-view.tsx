"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { GitBranch, Info } from "lucide-react";
import { TournamentPhase } from "@/database/schema";

interface EditionPhasesViewProps {
  phases: TournamentPhase[];
  isLoading?: boolean;
}

export function EditionPhasesView({
  phases,
  isLoading,
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
            <div className="flex items-center justify-center p-8 bg-muted/30 rounded-lg border border-dashed">
              <Typography theme="muted" className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                Visualisation des brackets bientôt disponible
              </Typography>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
