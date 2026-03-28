"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { Trophy, Calendar } from "lucide-react";
import { usePhases } from "@/hooks/use-phase-manager";
import { useGroups } from "@/hooks/use-group-manager";
import { useMatchesByPhase, useMatchesByGroup } from "@/hooks/use-match-manager";
import { MatchCard } from "@/components/cards/match-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuthContext } from "@/contexts/auth-context";
import { useIsUserTournamentOrganizer } from "@/hooks/use-tournaments";
import { useEdition } from "@/hooks/use-editions";

interface EditionMatchesClientProps {
  editionId: string;
}

export function EditionMatchesClient({ editionId }: EditionMatchesClientProps) {
  const { user } = useAuthContext();
  const { data: editionData } = useEdition(editionId);
  const edition = editionData;

  // Verify roles
  const { data: isOrganizer } = useIsUserTournamentOrganizer(
    edition?.tournamentId || "",
    user?.id || ""
  );

  // Fetch Phases
  const { data: phasesRes, isLoading: isLoadingPhases } = usePhases(editionId);
  const phases = phasesRes?.data || [];

  const [selectedPhaseId, setSelectedPhaseId] = useState<string>("all");
  const [selectedGroupId, setSelectedGroupId] = useState<string>("all");

  // Select active phase initially
  useEffect(() => {
    if (phases.length > 0 && selectedPhaseId === "all") {
      const active = phases.find((p) => p.isActive);
      if (active) setSelectedPhaseId(active.id);
      else setSelectedPhaseId(phases[0].id);
    }
  }, [phases, selectedPhaseId]);

  // Fetch Groups for selected Phase
  const { data: groupsRes, isLoading: isLoadingGroups } = useGroups(
    selectedPhaseId !== "all" ? selectedPhaseId : "",
    selectedPhaseId !== "all"
  );
  const groups = groupsRes?.data || [];

  // Re-init group selection when phase changes
  useEffect(() => {
    setSelectedGroupId("all");
  }, [selectedPhaseId]);

  // Fetch Matches
  const { data: matchesResPhase, isLoading: isLoadingPhaseMatches } = useMatchesByPhase(
    selectedPhaseId !== "all" ? selectedPhaseId : "",
    selectedPhaseId !== "all" && selectedGroupId === "all" ? "true" : "false"
  );

  const { data: matchesResGroup, isLoading: isLoadingGroupMatches } = useMatchesByGroup(
    selectedGroupId !== "all" ? selectedGroupId : "",
    selectedGroupId !== "all" ? "true" : "false"
  );

  const matches = useMemo(() => {
    if (selectedGroupId !== "all") return matchesResGroup || [];
    if (selectedPhaseId !== "all") return matchesResPhase || [];
    return [];
  }, [selectedPhaseId, selectedGroupId, matchesResPhase, matchesResGroup]);

  // Grouping matches by Round
  const roundsMap = new Map<number, any[]>();
  for (const m of matches) {
    const r = (m.round as number) || 1;
    const arr = roundsMap.get(r) || [];
    arr.push(m);
    roundsMap.set(r, arr);
  }
  const rounds = Array.from(roundsMap.entries()).sort((a, b) => a[0] - b[0]);

  const isLoading = isLoadingPhases || isLoadingGroups || isLoadingPhaseMatches || isLoadingGroupMatches;

  return (
    <div className="space-y-6 container p-4 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Typography variant="h3" weight="bold">Calendrier des matchs</Typography>

        <div className="flex items-center gap-3">
          <Select
            value={selectedPhaseId}
            onValueChange={setSelectedPhaseId}
            disabled={phases.length === 0}
          >
            <SelectTrigger className="w-[180px] bg-background">
              <SelectValue placeholder="Sélectionner une phase" />
            </SelectTrigger>
            <SelectContent>
              {phases.map((phase) => (
                <SelectItem key={phase.id} value={phase.id}>
                  {phase.name} {phase.isActive && "(Active)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {groups.length > 0 && selectedPhaseId !== "all" && (
            <Select
              value={selectedGroupId}
              onValueChange={setSelectedGroupId}
            >
              <SelectTrigger className="w-[180px] bg-background">
                <SelectValue placeholder="Tous les groupes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={"all"}>Tous les groupes</SelectItem>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {isLoading ? (
        <Card className="border-none shadow-none bg-transparent">
          <CardContent className="py-12 text-center text-muted-foreground">
            <div className="animate-spin h-6 w-6 border-b-2 border-primary mx-auto rounded-full" />
            <p className="mt-4">Chargement des rencontres...</p>
          </CardContent>
        </Card>
      ) : rounds.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground flex flex-col items-center gap-2">
            <Calendar className="h-8 w-8 opacity-20" />
            <p>Aucun match programmé pour cette sélection.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {rounds.map(([roundNumber, ms]) => (
            <div key={roundNumber} className="space-y-4">
              <div className="flex items-center gap-3">
                <Typography variant="h4" weight="semibold">Round {roundNumber}</Typography>
                <div className="h-px bg-border flex-1" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                {ms
                  .sort((a, b) => (a.matchNumber ?? 0) - (b.matchNumber ?? 0))
                  .map((m) => (
                    <MatchCard
                      key={m.id}
                      match={m}
                      currentUserId={user?.id}
                      isAdmin={isOrganizer}
                    />
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
