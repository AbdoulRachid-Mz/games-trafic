"use client";

import React from "react";
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
} from "lucide-react";
import { TournamentPhase } from "@/database/schema";
import {
  useEditionRegistrations,
  usePhaseBracketNodes,
  usePhaseMatches,
} from "@/hooks/use-editions";
import { MatchCard } from "@/components/cards/match-card";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

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
  const [activePhaseId, setActivePhaseId] = React.useState<string | null>(
    phases[0]?.id || null,
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

  const sortedPhases = [...phases].sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <div className="space-y-8 mt-6">
      {/* Phase Progression Schema */}
      <div className="relative">
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-muted -translate-y-1/2 hidden md:block" />
        <div className="relative flex flex-col md:flex-row items-center justify-between gap-6 md:gap-4 overflow-x-auto pb-4 px-2 scrollbar-hide">
          {sortedPhases.map((phase, idx) => {
            const isActive = activePhaseId === phase.id;
            const isLast = idx === sortedPhases.length - 1;

            return (
              <div
                key={phase.id}
                className="relative flex flex-col items-center gap-3 shrink-0"
              >
                <button
                  onClick={() => setActivePhaseId(phase.id)}
                  className={cn(
                    "relative z-10 w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all duration-300",
                    isActive
                      ? "bg-primary border-primary text-primary-foreground scale-110 shadow-lg shadow-primary/20"
                      : "bg-background border-muted text-muted-foreground hover:border-primary/50 hover:text-primary",
                  )}
                >
                  {phase.isCompleted ? (
                    <CheckCircle2 className="h-6 w-6" />
                  ) : (
                    <span className="font-bold text-sm">{idx + 1}</span>
                  )}
                </button>
                <div className="text-center">
                  <p
                    className={cn(
                      "text-xs font-black uppercase tracking-widest",
                      isActive ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    Phase {idx + 1}
                  </p>
                  <p
                    className={cn(
                      "text-sm font-bold truncate max-w-[120px]",
                      isActive ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {phase.name}
                  </p>
                </div>
                {!isLast && (
                  <div className="md:hidden h-8 w-0.5 bg-muted my-1" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Phase Details */}
      {activePhaseId && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {sortedPhases
            .filter((p) => p.id === activePhaseId)
            .map((phase) => (
              <Card key={phase.id} className="border-none shadow-2xl overflow-hidden bg-card/50 backdrop-blur-sm">
                <CardHeader className="bg-muted/30 border-b py-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                        {phase.phaseType === "ELIMINATION" ? (
                          <Trophy className="h-6 w-6" />
                        ) : (
                          <LayoutGrid className="h-6 w-6" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-2xl font-black">
                            {phase.name}
                          </CardTitle>
                          <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-tighter">
                            {phase.phaseType}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground font-medium flex items-center gap-1.5 mt-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {phase.scheduledStart
                            ? format(new Date(phase.scheduledStart), "d MMMM yyyy", {
                                locale: fr,
                              })
                            : "Dates à définir"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-background/50 p-1 rounded-lg border">
                       <div className="px-3 py-1.5 flex flex-col items-center">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground">Progression</span>
                          <span className="text-sm font-black">{phase.isCompleted ? "100%" : "En cours"}</span>
                       </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0 sm:p-6">
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
      )}
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
      <div className="flex items-center justify-center p-12 bg-muted/30 rounded-xl border border-dashed animate-pulse">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <Typography theme="muted" variant="body-sm" weight="medium">Chargement du schéma de la phase...</Typography>
        </div>
      </div>
    );
  }

  const nodes = nodesRes?.data || [];
  const matches = matchesRes?.data || [];

  if (nodes.length === 0 && matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-muted/30 rounded-xl border border-dashed gap-4 text-center">
        <GitBranch className="h-10 w-10 text-muted-foreground/30" />
        <div className="space-y-1">
          <Typography variant="h6" weight="bold">Aucun match programmé</Typography>
          <Typography theme="muted" variant="body-sm" className="max-w-[250px]">
            La structure de cette phase n'est pas encore générée ou aucun match n'a été créé.
          </Typography>
        </div>
      </div>
    );
  }

  // Si c'est une phase de groupes, on affiche les groupes
  if (phase.phaseType === "GROUP_STAGE") {
    // Note: Pour simplifier ici, on affiche les matchs groupés par round, 
    // mais idéalement on afficherait les groupes. 
    // Gardons la logique de rounds pour la cohérence visuelle demandée ("schéma").
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
    <div className="relative">
      {/* Background Schema Lines (Decorative) */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] overflow-hidden">
        <svg width="100%" height="100%" className="min-h-[400px]">
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-primary/10 scrollbar-track-transparent">
        <div className="flex gap-8 min-w-max p-4 items-start">
          {sortedRounds.map(([roundNumber, roundMatches], idx) => (
            <div key={roundNumber} className="relative flex flex-col gap-6">
              {/* Round Header */}
              <div className="flex items-center gap-3 mb-2 px-2">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary border border-primary/20">
                  {roundNumber}
                </div>
                <Typography variant="body-sm" weight="bold" className="uppercase tracking-widest text-primary/70">
                  Round {roundNumber}
                </Typography>
                <div className="h-px bg-gradient-to-r from-primary/20 to-transparent flex-1" />
              </div>

              {/* Matches in Round */}
              <div className="space-y-6 w-[320px]">
                {roundMatches
                  .sort((a: any, b: any) => (a.matchNumber ?? 0) - (b.matchNumber ?? 0))
                  .map((match: any) => (
                    <div key={match.id} className="relative group">
                      {/* Connection lines logic could go here */}
                      <MatchCard
                        match={match}
                        viewMode="list"
                        currentUserId={currentUserId}
                        isAdmin={isAdmin}
                        onUpdate={handleUpdate}
                        className="transition-transform duration-300 hover:scale-[1.02] shadow-sm hover:shadow-xl border-primary/5"
                      />
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
