// @/components/pages/tournaments/edition-detail/edition-phases-view.tsx
"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import {
  GitBranch,
  ArrowRight,
  ChevronRight,
  Trophy,
  Users,
  Swords,
  Calendar,
  LayoutGrid,
  CheckCircle2,
  Lock,
  ChevronDown,
  Info,
  Circle,
  Clock,
  AlertCircle,
  Eye,
} from "lucide-react";
import { TournamentPhase } from "@/database/schema";
import {
  useEditionRegistrations,
  usePhaseBracketNodes,
  usePhaseMatches,
} from "@/hooks/use-editions";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface EditionPhasesViewProps {
  phases: TournamentPhase[];
  isLoading?: boolean;
  editionId: string;
  tournamentId?: string;
  currentUserId?: string;
  isAdmin?: boolean;
  onUpdate?: () => void;
}

export function EditionPhasesView({
  phases,
  isLoading,
  editionId,
  tournamentId,
  currentUserId,
  isAdmin,
  onUpdate,
}: EditionPhasesViewProps) {
  const [activePhaseId, setActivePhaseId] = React.useState<string | null>(
    phases.find((p) => p.isActive)?.id || phases[0]?.id || null,
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-20 bg-muted animate-pulse rounded-xl" />
        <div className="h-[400px] bg-muted animate-pulse rounded-xl" />
      </div>
    );
  }

  if (phases.length === 0) {
    return (
      <Card className="border-dashed py-16">
        <CardContent className="flex flex-col items-center justify-center text-center text-muted-foreground">
          <GitBranch className="h-16 w-16 mb-6 opacity-20" />
          <Typography variant="h5" weight="bold" className="mb-2">
            Structure non définie
          </Typography>
          <Typography variant="body-base" className="max-w-xs">
            L&apos;organisateur n&apos;a pas encore configuré les phases de
            cette édition.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const sortedPhases = [...phases].sort(
    (a, b) => (a.order || 0) - (b.order || 0),
  );
  const currentPhase = sortedPhases.find((p) => p.id === activePhaseId);

  return (
    <div className="space-y-8 mt-6">
      {/* Phase Progression Schema */}
      <div className="relative">
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-muted to-transparent -translate-y-1/2 hidden md:block" />

        <div className="relative flex flex-col md:flex-row items-center justify-between gap-6 md:gap-2 overflow-x-auto pb-6 px-2 scrollbar-hide">
          {sortedPhases.map((phase, idx) => {
            const isActive = activePhaseId === phase.id;
            const isCompleted = phase.isCompleted;
            const isLast = idx === sortedPhases.length - 1;
            const phaseTypeIcon =
              phase.phaseType === "ELIMINATION" ? (
                <Trophy className="h-4 w-4" />
              ) : (
                <LayoutGrid className="h-4 w-4" />
              );

            return (
              <div
                key={phase.id}
                className="relative flex flex-col items-center gap-2 shrink-0 min-w-[100px] cursor-pointer group"
                onClick={() => setActivePhaseId(phase.id)}
              >
                <div
                  className={cn(
                    "relative z-10 w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all duration-300",
                    isActive
                      ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20 scale-110"
                      : isCompleted
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500 hover:border-primary/50"
                        : "bg-background border-muted text-muted-foreground hover:border-primary/50 hover:text-primary",
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-6 w-6" />
                  ) : (
                    <span className="font-bold text-lg">{idx + 1}</span>
                  )}
                </div>

                <div className="text-center max-w-[110px]">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    {phaseTypeIcon}
                    <span
                      className={cn(
                        "text-[9px] font-black uppercase tracking-wider",
                        isActive ? "text-primary" : "text-muted-foreground",
                      )}
                    >
                      {phase.phaseType === "ELIMINATION"
                        ? "ELIM"
                        : phase.phaseType === "ROUND_ROBIN"
                          ? "LIGUE"
                          : "GROUPE"}
                    </span>
                  </div>
                  <p
                    className={cn(
                      "text-sm font-bold truncate",
                      isActive ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {phase.name}
                  </p>
                  {phase.isActive && (
                    <Badge
                      variant="default"
                      className="mt-1 text-[8px] h-4 bg-primary/20 text-primary"
                    >
                      ACTIVE
                    </Badge>
                  )}
                </div>

                {!isLast && (
                  <div className="md:hidden absolute -bottom-6 left-1/2 transform -translate-x-1/2">
                    <ArrowRight className="h-4 w-4 text-muted-foreground rotate-90" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Phase Details */}
      {activePhaseId && currentPhase && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <PhaseSchemaView
            phase={currentPhase}
            editionId={editionId}
            tournamentId={tournamentId}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
            onUpdate={onUpdate}
          />
        </div>
      )}
    </div>
  );
}

// Composant pour afficher le schéma d'une phase
function PhaseSchemaView({
  phase,
  editionId,
  tournamentId,
  currentUserId,
  isAdmin,
  onUpdate,
}: {
  phase: TournamentPhase;
  editionId: string;
  tournamentId?: string;
  currentUserId?: string;
  isAdmin?: boolean;
  onUpdate?: () => void;
}) {
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const { data: registrationsRes } = useEditionRegistrations(
    { editionId },
    { populate: ["member", "member.user", "member.team"] },
  );

  const { data: nodesRes, isLoading: nodesLoading } = usePhaseBracketNodes(
    phase.id,
    {
      filters: { phaseId: phase.id },
      options: { sortBy: "order", sortOrder: "asc" },
      pagination: { page: 1, limit: 100 },
    },
  );

  const { data: matchesRes, isLoading: matchesLoading } = usePhaseMatches(
    phase.id,
    {
      filters: { phaseId: phase.id },
      options: { sortBy: "round", sortOrder: "asc" },
      pagination: { page: 1, limit: 500 },
    },
  );

  if (nodesLoading || matchesLoading) {
    return <PhaseSchemaSkeleton />;
  }

  const nodes = nodesRes?.data || [];
  const matches = matchesRes?.data || [];

  // Grouper les matchs par bracketNodeId d'abord, puis par round
  const matchesByNode = new Map<string, any[]>();
  for (const m of matches as any[]) {
    const nodeId = m.bracketNodeId || "default";
    const arr = matchesByNode.get(nodeId) || [];
    arr.push(m);
    matchesByNode.set(nodeId, arr);
  }

  // Créer un map des nodes par ID
  const nodesMap = new Map();
  for (const node of nodes) {
    nodesMap.set(node.id, node);
  }

  const isGroupStage =
    phase.phaseType === "GROUP_STAGE" || phase.phaseType === "ROUND_ROBIN";
  const isElimination =
    phase.phaseType === "ELIMINATION" || phase.phaseType === "KNOCKOUT";

  return (
    <Card className="border-none shadow-xl bg-gradient-to-br from-card to-background overflow-hidden">
      <CardHeader className="bg-muted/30 border-b py-4 px-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              {isElimination ? (
                <Trophy className="h-6 w-6" />
              ) : (
                <LayoutGrid className="h-6 w-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-xl font-black">
                  {phase.name}
                </CardTitle>
                <Badge
                  variant="secondary"
                  className="text-[9px] uppercase font-bold tracking-tighter"
                >
                  {phase.phaseType === "ELIMINATION"
                    ? "ÉLIMINATION DIRECTE"
                    : phase.phaseType === "ROUND_ROBIN"
                      ? "CHAMPIONNAT"
                      : "PHASE DE GROUPES"}
                </Badge>
                {phase.isActive && (
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[9px]">
                    En cours
                  </Badge>
                )}
                {phase.isCompleted && (
                  <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px]">
                    Terminée
                  </Badge>
                )}
              </div>
              {phase.scheduledStart && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(phase.scheduledStart), "d MMMM yyyy", {
                    locale: fr,
                  })}
                </p>
              )}
            </div>
          </div>

          {isAdmin && tournamentId && (
            <Button size="sm" variant="outline" asChild className="gap-1">
              <Link
                href={`/tournaments/${tournamentId}/editions/${editionId}/dashboard/phases/${phase.id}/organize`}
              >
                <LayoutGrid className="h-3 w-3" />
                Organiser
              </Link>
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Légende */}
          <div className="flex flex-wrap gap-4 text-[10px] text-muted-foreground border-b pb-3">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span>Match terminé</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
              <span>En cours</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
              <span>À venir</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span>Litige</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <span>En attente validation</span>
            </div>
          </div>

          {/* Schéma selon le type de phase */}
          {isGroupStage && (
            <GroupStageSchema
              nodes={nodes}
              matches={matches}
              matchesByNode={matchesByNode}
              nodesMap={nodesMap}
              expandedGroup={expandedGroup}
              setExpandedGroup={setExpandedGroup}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              onUpdate={onUpdate}
              phase={phase}
            />
          )}

          {isElimination && (
            <EliminationSchema
              nodes={nodes}
              matches={matches}
              matchesByNode={matchesByNode}
              nodesMap={nodesMap}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              onUpdate={onUpdate}
              phase={phase}
            />
          )}

          {!isGroupStage &&
            !isElimination &&
            nodes.length === 0 &&
            matches.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="bg-muted/30 p-4 rounded-full mb-4">
                  <GitBranch className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <Typography variant="body-sm" theme="muted">
                  Cette phase n'a pas encore de structure configurée.
                </Typography>
                {isAdmin && tournamentId && (
                  <Button size="sm" variant="outline" className="mt-4" asChild>
                    <Link
                      href={`/tournaments/${tournamentId}/editions/${editionId}/dashboard/phases/${phase.id}/organize`}
                    >
                      Configurer la phase
                    </Link>
                  </Button>
                )}
              </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
}

// Schéma pour les phases de groupes / championnat
function GroupStageSchema({
  nodes,
  matches,
  matchesByNode,
  nodesMap,
  expandedGroup,
  setExpandedGroup,
  currentUserId,
  isAdmin,
  onUpdate,
  phase,
}: any) {
  // Si pas de nodes, regrouper les matchs par round
  if (nodes.length === 0 && matches.length > 0) {
    const rounds = new Map<number, any[]>();
    for (const m of matches) {
      const r = m.round || 1;
      const arr = rounds.get(r) || [];
      arr.push(m);
      rounds.set(r, arr);
    }
    const sortedRounds = Array.from(rounds.entries()).sort(
      (a, b) => a[0] - b[0],
    );

    return (
      <div className="space-y-6">
        <Typography
          variant="h6"
          weight="bold"
          className="flex items-center gap-2"
        >
          <Calendar className="h-4 w-4 text-primary" />
          Calendrier des rencontres
        </Typography>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedRounds.map(([roundNumber, roundMatches]) => (
            <RoundCard
              key={roundNumber}
              roundNumber={roundNumber}
              matches={roundMatches}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              onUpdate={onUpdate}
              phaseType={phase?.phaseType}
            />
          ))}
        </div>
      </div>
    );
  }

  // Affichage par groupes/nodes
  const sortedNodes = [...nodes].sort(
    (a, b) => (a.order || 0) - (b.order || 0),
  );

  return (
    <div className="space-y-4">
      <Typography
        variant="h6"
        weight="bold"
        className="flex items-center gap-2"
      >
        <LayoutGrid className="h-4 w-4 text-primary" />
        Groupes / Poules
      </Typography>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {sortedNodes.map((node: any) => {
          const nodeMatches = matchesByNode.get(node.id) || [];
          const metadata = node.metadata || {};
          const participants = metadata.participants || [];
          const nodeName = metadata.name || node.nodeCode || "Groupe";

          // Grouper les matchs de ce node par round
          const nodeRounds = new Map<number, any[]>();
          for (const m of nodeMatches) {
            const r = m.round || 1;
            const arr = nodeRounds.get(r) || [];
            arr.push(m);
            nodeRounds.set(r, arr);
          }
          const sortedNodeRounds = Array.from(nodeRounds.entries()).sort(
            (a, b) => a[0] - b[0],
          );

          const isExpanded = expandedGroup === node.id;

          return (
            <Collapsible
              key={node.id}
              open={isExpanded}
              onOpenChange={() => setExpandedGroup(isExpanded ? null : node.id)}
              className="border rounded-xl overflow-hidden bg-card/50 hover:shadow-md transition-shadow"
            >
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary">
                      {node.nodeCode?.charAt(0) || "G"}
                    </div>
                    <div>
                      <div className="font-bold">{nodeName}</div>
                      <div className="text-[10px] text-muted-foreground flex items-center gap-2">
                        <Users className="h-3 w-3" />
                        {participants.length} participants
                        <Swords className="h-3 w-3 ml-1" />
                        {nodeMatches.length} matchs
                      </div>
                    </div>
                  </div>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform",
                      isExpanded && "rotate-180",
                    )}
                  />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="p-4 pt-0 border-t space-y-4">
                  {sortedNodeRounds.length > 0 ? (
                    sortedNodeRounds.map(([roundNum, roundMatches]) => (
                      <div key={roundNum} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[9px] font-bold">
                            {roundNum}
                          </div>
                          <span className="text-[10px] font-medium uppercase text-muted-foreground">
                            {phase?.phaseType === "ROUND_ROBIN"
                              ? `Journée ${roundNum}`
                              : `Round ${roundNum}`}
                          </span>
                          <Badge variant="outline" className="text-[8px]">
                            {roundMatches.length} matchs
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 gap-2 pl-6">
                          {roundMatches.map((match: any) => (
                            <MiniMatchCard
                              key={match.id}
                              match={match}
                              currentUserId={currentUserId}
                              isAdmin={isAdmin}
                              onUpdate={onUpdate}
                            />
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-muted-foreground text-xs">
                      Aucun match programmé pour ce groupe
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
}

// Schéma pour les phases à élimination directe
function EliminationSchema({
  nodes,
  matches,
  matchesByNode,
  nodesMap,
  currentUserId,
  isAdmin,
  onUpdate,
  phase,
}: any) {
  // Si pas de nodes, regrouper par round
  if (nodes.length === 0 && matches.length > 0) {
    const rounds = new Map<number, any[]>();
    for (const m of matches) {
      const r = m.round || 1;
      const arr = rounds.get(r) || [];
      arr.push(m);
      rounds.set(r, arr);
    }
    const sortedRounds = Array.from(rounds.entries()).sort(
      (a, b) => a[0] - b[0],
    );
    const totalRounds = sortedRounds.length;

    return (
      <div className="space-y-6">
        <Typography
          variant="h6"
          weight="bold"
          className="flex items-center gap-2"
        >
          <Trophy className="h-4 w-4 text-primary" />
          Tableau d'élimination
        </Typography>
        <div className="relative overflow-x-auto pb-4">
          <div className="flex justify-center items-start gap-6 min-w-max p-4">
            {sortedRounds
              .map(([roundNum, roundMatches]) => {
                const distanceToFinal = totalRounds - roundNum;
                let roundName = `Round ${roundNum}`;
                if (distanceToFinal === 0) roundName = "FINALE";
                else if (distanceToFinal === 1) roundName = "DEMI-FINALE";
                else if (distanceToFinal === 2) roundName = "QUART DE FINALE";
                else if (distanceToFinal === 3)
                  roundName = "HUITIÈME DE FINALE";

                return (
                  <div key={roundNum} className="space-y-3">
                    <div className="text-center text-[9px] font-bold uppercase text-muted-foreground">
                      {roundName}
                    </div>
                    <div className="space-y-3">
                      {roundMatches.map((match: any) => (
                        <MiniMatchCard
                          key={match.id}
                          match={match}
                          currentUserId={currentUserId}
                          isAdmin={isAdmin}
                          onUpdate={onUpdate}
                          compact
                        />
                      ))}
                    </div>
                  </div>
                );
              })
              .reduce((acc: any[], curr, idx, arr) => {
                acc.push(curr);
                if (idx < arr.length - 1) {
                  acc.push(
                    <div
                      key={`arrow-${idx}`}
                      className="flex items-center h-full pt-8"
                    >
                      <ArrowRight className="h-5 w-5 text-muted-foreground/50" />
                    </div>,
                  );
                }
                return acc;
              }, [])}
          </div>
        </div>
      </div>
    );
  }

  // Affichage par nodes (bracket structuré)
  const sortedNodes = [...nodes].sort(
    (a, b) => (a.round || 0) - (b.round || 0),
  );
  const maxRound = Math.max(...sortedNodes.map((n) => n.round || 0), 0);

  // Grouper les nodes par round
  const nodesByRound = new Map<number, any[]>();
  for (const node of sortedNodes) {
    const r = node.round || 1;
    const arr = nodesByRound.get(r) || [];
    arr.push(node);
    nodesByRound.set(r, arr);
  }

  return (
    <div className="space-y-6">
      <Typography
        variant="h6"
        weight="bold"
        className="flex items-center gap-2"
      >
        <Trophy className="h-4 w-4 text-primary" />
        Tableau d'élimination
      </Typography>
      <div className="relative overflow-x-auto pb-4">
        <div className="flex justify-center items-start gap-6 min-w-max p-4">
          {Array.from(nodesByRound.entries())
            .sort((a, b) => a[0] - b[0])
            .map(([roundNum, roundNodes]) => {
              const distanceToFinal = maxRound - roundNum;
              let roundName = `Round ${roundNum}`;
              if (distanceToFinal === 0) roundName = "FINALE";
              else if (distanceToFinal === 1) roundName = "DEMI-FINALE";
              else if (distanceToFinal === 2) roundName = "QUART DE FINALE";
              else if (distanceToFinal === 3) roundName = "HUITIÈME DE FINALE";

              return (
                <div key={roundNum} className="space-y-3">
                  <div className="text-center text-[9px] font-bold uppercase text-muted-foreground">
                    {roundName}
                  </div>
                  <div className="space-y-3">
                    {roundNodes.map((node: any) => {
                      const nodeMatches = matchesByNode.get(node.id) || [];
                      const metadata = node.metadata || {};
                      const nodeName =
                        metadata.name ||
                        node.nodeCode ||
                        `Match ${node.matchNumber}`;

                      return (
                        <div
                          key={node.id}
                          className="border rounded-lg p-2 min-w-[180px] bg-card/50"
                        >
                          <div className="text-[8px] text-muted-foreground text-center mb-1">
                            {nodeName}
                          </div>
                          {nodeMatches.length > 0 ? (
                            nodeMatches.map((match: any) => (
                              <MiniMatchCard
                                key={match.id}
                                match={match}
                                currentUserId={currentUserId}
                                isAdmin={isAdmin}
                                onUpdate={onUpdate}
                                compact
                              />
                            ))
                          ) : (
                            <div className="text-center text-[9px] text-muted-foreground py-2">
                              À déterminer
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
            .reduce((acc: any[], curr, idx, arr) => {
              acc.push(curr);
              if (idx < arr.length - 1) {
                acc.push(
                  <div
                    key={`arrow-${idx}`}
                    className="flex items-center h-full pt-8"
                  >
                    <ArrowRight className="h-5 w-5 text-muted-foreground/50" />
                  </div>,
                );
              }
              return acc;
            }, [])}
        </div>
      </div>
    </div>
  );
}

// Composant pour une carte de round/journée
function RoundCard({
  roundNumber,
  matches,
  currentUserId,
  isAdmin,
  onUpdate,
  phaseType,
}: any) {
  const getRoundName = (round: number, totalMatches: number) => {
    if (phaseType === "ROUND_ROBIN") {
      return `Journée ${round}`;
    }
    if (totalMatches === 1) return "Finale";
    if (totalMatches === 2) return "Demi-finale";
    if (totalMatches === 4) return "Quart de finale";
    if (totalMatches === 8) return "Huitième de finale";
    return `Round ${round}`;
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="py-3 px-4 bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
              {roundNumber}
            </div>
            <span className="font-bold text-sm">
              {getRoundName(roundNumber, matches.length)}
            </span>
          </div>
          <Badge variant="outline" className="text-[9px]">
            {matches.length} matchs
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-3 space-y-2">
        {matches.map((match: any) => (
          <MiniMatchCard
            key={match.id}
            match={match}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
            onUpdate={onUpdate}
          />
        ))}
      </CardContent>
    </Card>
  );
}

// Mini carte de match (version compacte pour le schéma)
function MiniMatchCard({
  match,
  currentUserId,
  isAdmin,
  onUpdate,
  compact,
  isFinal,
}: any) {
  const getParticipantName = (regId: string | null) => {
    if (!regId) return "TBD";
    const p1Reg = match.participant1;
    const p2Reg = match.participant2;
    if (p1Reg?.id === regId) {
      return (
        p1Reg.member?.displayName || p1Reg.member?.user?.username || "Joueur"
      );
    }
    if (p2Reg?.id === regId) {
      return (
        p2Reg.member?.displayName || p2Reg.member?.user?.username || "Joueur"
      );
    }
    return "Joueur";
  };

  const getStatusColor = () => {
    switch (match.status) {
      case "COMPLETED":
        return "border-emerald-500/30 bg-emerald-500/5";
      case "IN_PROGRESS":
        return "border-blue-500/30 bg-blue-500/5";
      case "DISPUTED":
        return "border-amber-500/30 bg-amber-500/5";
      case "PENDING_REVIEW":
        return "border-purple-500/30 bg-purple-500/5";
      default:
        return "border-border/50 bg-card";
    }
  };

  const getStatusIcon = () => {
    switch (match.status) {
      case "COMPLETED":
        return <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" />;
      case "IN_PROGRESS":
        return <Clock className="h-2.5 w-2.5 text-blue-500 animate-pulse" />;
      case "DISPUTED":
        return <AlertCircle className="h-2.5 w-2.5 text-amber-500" />;
      case "PENDING_REVIEW":
        return <Eye className="h-2.5 w-2.5 text-purple-500" />;
      default:
        return <Circle className="h-2.5 w-2.5 text-muted-foreground/50" />;
    }
  };

  const isWinner = (regId: string | null) =>
    match.winnerRegistrationId === regId;
  const isUserParticipant =
    match.participant1?.member?.userId === currentUserId ||
    match.participant2?.member?.userId === currentUserId;

  return (
    <div
      className={cn(
        "rounded-lg border transition-all",
        getStatusColor(),
        compact ? "p-1.5" : "p-2",
        isFinal && "border-primary/30 bg-primary/5",
        isUserParticipant && !isAdmin && "border-primary/50 bg-primary/5",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        {/* Participant 1 */}
        <div
          className={cn(
            "flex-1 text-xs font-medium truncate",
            isWinner(match.participant1RegistrationId) &&
              "text-emerald-600 font-bold",
          )}
        >
          {getParticipantName(match.participant1RegistrationId)}
        </div>

        {/* Score */}
        <div className="flex items-center gap-1 font-mono text-xs font-bold">
          {match.score1 !== null && match.score2 !== null ? (
            <>
              <span
                className={cn(
                  "min-w-[20px] text-center",
                  (match.score1 || 0) > (match.score2 || 0) &&
                    "text-emerald-600",
                )}
              >
                {match.score1}
              </span>
              <span className="text-muted-foreground">-</span>
              <span
                className={cn(
                  "min-w-[20px] text-center",
                  (match.score2 || 0) > (match.score1 || 0) &&
                    "text-emerald-600",
                )}
              >
                {match.score2}
              </span>
            </>
          ) : (
            <span className="text-[9px] text-muted-foreground">vs</span>
          )}
        </div>

        {/* Participant 2 */}
        <div
          className={cn(
            "flex-1 text-xs font-medium truncate text-right",
            isWinner(match.participant2RegistrationId) &&
              "text-emerald-600 font-bold",
          )}
        >
          {getParticipantName(match.participant2RegistrationId)}
        </div>
      </div>

      {/* Status indicator */}
      {!compact && (
        <div className="flex items-center justify-center gap-1 mt-1">
          {getStatusIcon()}
          <span className="text-[8px] text-muted-foreground">
            {match.status === "COMPLETED"
              ? "Terminé"
              : match.status === "IN_PROGRESS"
                ? "En cours"
                : match.status === "PENDING_REVIEW"
                  ? "Validation en attente"
                  : match.status === "DISPUTED"
                    ? "Litige"
                    : match.scheduledTime
                      ? format(new Date(match.scheduledTime), "dd/MM HH:mm")
                      : "Programmé"}
          </span>
        </div>
      )}
    </div>
  );
}

// Skeleton loader pour le schéma
function PhaseSchemaSkeleton() {
  return (
    <Card className="border-none shadow-xl overflow-hidden">
      <CardHeader className="bg-muted/30 border-b py-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-muted animate-pulse" />
          <div className="space-y-2">
            <div className="h-5 w-32 bg-muted animate-pulse rounded" />
            <div className="h-3 w-24 bg-muted animate-pulse rounded" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="h-4 w-24 bg-muted animate-pulse rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
