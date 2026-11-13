"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  Layers,
  Users,
  GitBranch,
  Swords,
  Trophy,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Zap,
  Clock,
  ArrowRight,
  Shield,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface EditionStructureData {
  phases: Array<{
    id: string;
    name: string;
    phaseType: string;
    order: number;
    groups?: Array<{
      id: string;
      name: string;
      order: number;
      participantCount?: number;
      participants?: Array<{
        id: string;
        registrationId?: string;
        member?: {
          displayName?: string;
          avatar?: string;
          user?: {
            username?: string;
            profileImage?: string;
          };
          team?: {
            name?: string;
            logo?: string;
          };
        };
      }>;
      bracketNodes?: any[];
    }>;
    bracketNodes?: Array<{
      id: string;
      nodeCode: string;
      round: number;
      bracketType?: string;
      metadata?: any;
    }>;
    matches?: Array<{
      id: string;
      matchCode?: string;
      round?: number;
      matchNumber?: number;
      participant1RegistrationId?: string | null;
      participant2RegistrationId?: string | null;
      participant1?: any;
      participant2?: any;
      scheduledTime?: string | null;
    }>;
  }>;
}

export interface EditionStructureRevealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editionName?: string;
  structure: EditionStructureData | null;
  onFinish?: () => void;
}

type RevealStep = "phases" | "groups" | "participants" | "brackets" | "matches";

const STEPS: Array<{ key: RevealStep; label: string; icon: any }> = [
  { key: "phases", label: "Phases", icon: Layers },
  { key: "groups", label: "Groupes", icon: Users },
  { key: "participants", label: "Participants", icon: Users },
  { key: "brackets", label: "Arbre & Confrontations", icon: GitBranch },
  { key: "matches", label: "Matchs générés", icon: Swords },
];

export function EditionStructureRevealDialog({
  open,
  onOpenChange,
  editionName = "Édition",
  structure,
  onFinish,
}: EditionStructureRevealDialogProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [revealedItemsCount, setRevealedItemsCount] = useState(0);
  const [isAllRevealed, setIsAllRevealed] = useState(false);

  const phases = useMemo(() => structure?.phases || [], [structure]);

  // Toutes les étapes applicables à la structure réelle
  const activeSteps = useMemo(() => {
    if (!structure || phases.length === 0) return STEPS;
    const hasGroups = phases.some((p) => (p.groups?.length || 0) > 0);
    const hasParticipants = phases.some((p) =>
      p.groups?.some((g) => (g.participants?.length || 0) > 0),
    );
    const hasBrackets = phases.some(
      (p) =>
        (p.bracketNodes?.length || 0) > 0 ||
        p.groups?.some((g) => (g.bracketNodes?.length || 0) > 0),
    );
    const hasMatches = phases.some((p) => (p.matches?.length || 0) > 0);

    return STEPS.filter((step) => {
      if (step.key === "phases") return true;
      if (step.key === "groups") return hasGroups;
      if (step.key === "participants") return hasParticipants;
      if (step.key === "brackets") return hasBrackets;
      if (step.key === "matches") return hasMatches;
      return true;
    });
  }, [structure, phases]);

  const currentStep = activeSteps[currentStepIndex] || activeSteps[0];
  const isLastStep = currentStepIndex === activeSteps.length - 1;

  useEffect(() => {
    if (open) {
      setCurrentStepIndex(0);
      setRevealedItemsCount(0);
      setIsAllRevealed(false);
    }
  }, [open]);

  // Interval d'animation par sous-élément dans l'étape active
  useEffect(() => {
    if (!open || isAllRevealed) return;
    const timer = setInterval(() => {
      setRevealedItemsCount((prev) => prev + 1);
    }, 400);
    return () => clearInterval(timer);
  }, [open, isAllRevealed, currentStepIndex]);

  const handleNextStep = () => {
    if (!isLastStep) {
      setCurrentStepIndex((prev) => prev + 1);
      setRevealedItemsCount(0);
    } else {
      setIsAllRevealed(true);
      onFinish?.();
    }
  };

  const handleRevealAll = () => {
    setIsAllRevealed(true);
    setCurrentStepIndex(activeSteps.length - 1);
    setRevealedItemsCount(999);
  };

  const handleFinish = () => {
    onOpenChange(false);
    onFinish?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-card/95 backdrop-blur-2xl border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)]">
        {/* Header Gaming */}
        <div className="p-6 border-b border-white/10 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shadow-[0_0_20px_rgba(var(--primary),0.3)]">
                <Sparkles className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black italic uppercase tracking-tighter text-foreground">
                  Déploiement de la Structure
                </DialogTitle>
                <DialogDescription className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {editionName} · Révélation officielle
                </DialogDescription>
              </div>
            </div>

            {/* Stepper Pills */}
            <div className="hidden sm:flex items-center gap-1.5 bg-background/50 p-1 rounded-xl border border-white/5">
              {activeSteps.map((s, idx) => {
                const Icon = s.icon;
                const isPassed = idx < currentStepIndex || isAllRevealed;
                const isCurrent = idx === currentStepIndex && !isAllRevealed;
                return (
                  <div
                    key={s.key}
                    className={cn(
                      "flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all",
                      isCurrent &&
                        "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.3)]",
                      isPassed && "text-emerald-400 bg-emerald-500/10",
                      !isCurrent && !isPassed && "text-muted-foreground opacity-50",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="hidden md:inline">{s.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Corps avec animation de l'étape active */}
        <ScrollArea className="flex-1 p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep?.key + (isAllRevealed ? "-all" : "")}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Étape 1 : Phases */}
              {(currentStep?.key === "phases" || isAllRevealed) && (
                <PhaseRevealStep
                  phases={phases}
                  revealedCount={
                    isAllRevealed || currentStep?.key !== "phases"
                      ? 999
                      : revealedItemsCount
                  }
                />
              )}

              {/* Étape 2 : Groupes */}
              {(currentStep?.key === "groups" || isAllRevealed) && (
                <GroupRevealStep
                  phases={phases}
                  revealedCount={
                    isAllRevealed || currentStep?.key !== "groups"
                      ? 999
                      : revealedItemsCount
                  }
                />
              )}

              {/* Étape 3 : Participants */}
              {(currentStep?.key === "participants" || isAllRevealed) && (
                <ParticipantRevealStep
                  phases={phases}
                  revealedCount={
                    isAllRevealed || currentStep?.key !== "participants"
                      ? 999
                      : revealedItemsCount
                  }
                />
              )}

              {/* Étape 4 : Brackets & Petite Finale */}
              {(currentStep?.key === "brackets" || isAllRevealed) && (
                <BracketRevealStep
                  phases={phases}
                  revealedCount={
                    isAllRevealed || currentStep?.key !== "brackets"
                      ? 999
                      : revealedItemsCount
                  }
                />
              )}

              {/* Étape 5 : Matchs générés */}
              {(currentStep?.key === "matches" || isAllRevealed) && (
                <MatchRevealStep
                  phases={phases}
                  revealedCount={
                    isAllRevealed || currentStep?.key !== "matches"
                      ? 999
                      : revealedItemsCount
                  }
                />
              )}
            </motion.div>
          </AnimatePresence>
        </ScrollArea>

        {/* Footer avec contrôles */}
        <div className="p-4 border-t border-white/10 bg-card/60 flex items-center justify-between gap-3">
          <div>
            {!isAllRevealed && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRevealAll}
                className="text-xs font-bold text-muted-foreground hover:text-foreground"
              >
                Tout révéler immédiatement
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isLastStep && !isAllRevealed ? (
              <Button
                size="sm"
                onClick={handleNextStep}
                className="gap-2 font-bold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(var(--primary),0.2)]"
              >
                <span>Étape suivante</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                size="sm"
                variant="default"
                onClick={handleFinish}
                className="gap-2 font-bold text-xs uppercase tracking-wider bg-emerald-500 hover:bg-emerald-600 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Accéder au Dashboard</span>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ----------------------------------------------------------------------------
// SOUS-COMPOSANT 1 : Révélation des Phases
// ----------------------------------------------------------------------------
function PhaseRevealStep({
  phases,
  revealedCount,
}: {
  phases: EditionStructureData["phases"];
  revealedCount: number;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Layers className="h-5 w-5 text-primary" />
        <h3 className="font-black italic text-lg uppercase tracking-tight">
          Phases du Tournoi
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {phases.map((phase, idx) => {
          const isRevealed = idx < revealedCount;
          return (
            <motion.div
              key={phase.id}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={isRevealed ? { scale: 1, opacity: 1 } : { opacity: 0.2 }}
              transition={{ duration: 0.35 }}
              className={cn(
                "p-4 rounded-2xl border bg-card/70 backdrop-blur-xl relative overflow-hidden transition-all",
                isRevealed
                  ? "border-primary/40 shadow-[0_0_20px_rgba(var(--primary),0.1)]"
                  : "border-white/5 opacity-30",
              )}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <Badge
                  variant="outline"
                  className="text-[9px] font-black uppercase tracking-wider border-white/10"
                >
                  Phase #{phase.order + 1}
                </Badge>
                <Badge className="bg-primary/20 text-primary border-primary/30 text-[9px] font-black uppercase">
                  {phase.phaseType}
                </Badge>
              </div>

              <h4 className="font-black italic text-base truncate mb-1">
                {phase.name}
              </h4>

              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-3">
                <span className="flex items-center gap-1 font-semibold">
                  <Users className="h-3.5 w-3.5 text-primary" />
                  {phase.groups?.length || 0} groupe(s)
                </span>
                <span className="flex items-center gap-1 font-semibold">
                  <Swords className="h-3.5 w-3.5 text-primary" />
                  {phase.matches?.length || 0} match(s)
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// SOUS-COMPOSANT 2 : Révélation des Groupes
// ----------------------------------------------------------------------------
function GroupRevealStep({
  phases,
  revealedCount,
}: {
  phases: EditionStructureData["phases"];
  revealedCount: number;
}) {
  const allGroups = useMemo(() => {
    return phases.flatMap((p) =>
      (p.groups || []).map((g) => ({ ...g, phaseName: p.name })),
    );
  }, [phases]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-primary" />
        <h3 className="font-black italic text-lg uppercase tracking-tight">
          Poules & Groupes Déployés
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {allGroups.map((group, idx) => {
          const isRevealed = idx < revealedCount;
          return (
            <motion.div
              key={group.id}
              initial={{ y: 20, opacity: 0 }}
              animate={isRevealed ? { y: 0, opacity: 1 } : { opacity: 0.2 }}
              transition={{ duration: 0.3 }}
              className={cn(
                "p-4 rounded-2xl border bg-card/80 backdrop-blur-xl relative transition-all",
                isRevealed
                  ? "border-primary/40 shadow-lg"
                  : "border-white/5 opacity-30",
              )}
            >
              <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1 truncate">
                {group.phaseName}
              </div>
              <div className="font-black italic text-base text-foreground mb-2">
                {group.name}
              </div>
              <Badge variant="secondary" className="text-[9px] font-bold">
                {group.participants?.length || group.participantCount || 0}{" "}
                participants
              </Badge>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// SOUS-COMPOSANT 3 : Révélation des Participants
// ----------------------------------------------------------------------------
function ParticipantRevealStep({
  phases,
  revealedCount,
}: {
  phases: EditionStructureData["phases"];
  revealedCount: number;
}) {
  const allParticipants = useMemo(() => {
    return phases.flatMap((p) =>
      (p.groups || []).flatMap((g) =>
        (g.participants || []).map((part) => ({
          ...part,
          groupName: g.name,
          phaseName: p.name,
        })),
      ),
    );
  }, [phases]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-primary" />
        <h3 className="font-black italic text-lg uppercase tracking-tight">
          Affectation des Participants
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {allParticipants.map((part, idx) => {
          const isRevealed = idx < revealedCount;
          const name =
            part.member?.displayName ||
            part.member?.user?.username ||
            part.member?.team?.name ||
            "Joueur";
          const image =
            part.member?.user?.profileImage ||
            part.member?.avatar ||
            part.member?.team?.logo;

          return (
            <motion.div
              key={part.id || idx}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={isRevealed ? { scale: 1, opacity: 1 } : { opacity: 0.15 }}
              transition={{ duration: 0.25 }}
              className={cn(
                "p-3 rounded-xl border flex items-center gap-3 bg-card/60 backdrop-blur-md",
                isRevealed
                  ? "border-white/10 hover:border-primary/40"
                  : "border-white/5 opacity-20",
              )}
            >
              <Avatar className="h-9 w-9 border border-white/10 shrink-0">
                <AvatarImage src={image} />
                <AvatarFallback className="text-[10px] font-black bg-primary/10 text-primary">
                  {name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <div className="font-bold text-xs truncate text-foreground">
                  {name}
                </div>
                <div className="text-[10px] text-muted-foreground truncate font-medium">
                  {part.groupName} · {part.phaseName}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// SOUS-COMPOSANT 4 : Révélation de l'Arbre & Petite Finale
// ----------------------------------------------------------------------------
function BracketRevealStep({
  phases,
  revealedCount,
}: {
  phases: EditionStructureData["phases"];
  revealedCount: number;
}) {
  const nodes = useMemo(() => {
    return phases.flatMap((p) => [
      ...(p.bracketNodes || []),
      ...(p.groups || []).flatMap((g) => g.bracketNodes || []),
    ]);
  }, [phases]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <GitBranch className="h-5 w-5 text-primary" />
        <h3 className="font-black italic text-lg uppercase tracking-tight">
          Arbre Éliminatoire & Petite Finale
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {nodes.map((node, idx) => {
          const isRevealed = idx < revealedCount;
          const isThirdPlace =
            node.bracketType === "CONSOLATION" ||
            node.metadata?.isThirdPlace === true;

          return (
            <motion.div
              key={node.id}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={isRevealed ? { scale: 1, opacity: 1 } : { opacity: 0.15 }}
              transition={{ duration: 0.3 }}
              className={cn(
                "p-4 rounded-2xl border relative overflow-hidden backdrop-blur-xl",
                isThirdPlace
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                  : "bg-card/70 border-white/10",
                isRevealed ? "opacity-100" : "opacity-20",
              )}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[9px] font-black uppercase tracking-wider",
                    isThirdPlace
                      ? "border-amber-500/40 text-amber-300"
                      : "border-white/10",
                  )}
                >
                  {isThirdPlace
                    ? "3ème Place"
                    : `Round ${node.round || 1}`}
                </Badge>

                {isThirdPlace && (
                  <Badge className="bg-amber-500 text-black font-black text-[9px] uppercase">
                    Petite Finale
                  </Badge>
                )}
              </div>

              <div className="font-black italic text-sm text-foreground truncate">
                {node.metadata?.name || node.nodeCode}
              </div>

              <div className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1 font-semibold">
                <Swords className="h-3 w-3 text-primary" />
                <span>Format : {node.metadata?.format || "BO1"}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// SOUS-COMPOSANT 5 : Révélation des Matchs générés
// ----------------------------------------------------------------------------
function MatchRevealStep({
  phases,
  revealedCount,
}: {
  phases: EditionStructureData["phases"];
  revealedCount: number;
}) {
  const allMatches = useMemo(() => {
    return phases.flatMap((p) => p.matches || []);
  }, [phases]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Swords className="h-5 w-5 text-primary" />
        <h3 className="font-black italic text-lg uppercase tracking-tight">
          Rencontres Officielles Générées ({allMatches.length})
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {allMatches.map((m, idx) => {
          const isRevealed = idx < revealedCount;
          const p1Name =
            m.participant1?.member?.displayName ||
            m.participant1?.member?.user?.username ||
            "TBD";
          const p2Name =
            m.participant2?.member?.displayName ||
            m.participant2?.member?.user?.username ||
            "TBD";

          return (
            <motion.div
              key={m.id}
              initial={{ x: -15, opacity: 0 }}
              animate={isRevealed ? { x: 0, opacity: 1 } : { opacity: 0.15 }}
              transition={{ duration: 0.25 }}
              className={cn(
                "p-3.5 rounded-xl border flex items-center justify-between gap-3 bg-card/80 backdrop-blur-md",
                isRevealed ? "border-white/10" : "border-white/5 opacity-20",
              )}
            >
              <div className="flex items-center gap-2 font-black italic text-xs flex-1 truncate">
                <span className="truncate">{p1Name}</span>
                <span className="text-[10px] text-muted-foreground/50">VS</span>
                <span className="truncate">{p2Name}</span>
              </div>

              <Badge
                variant="outline"
                className="text-[9px] font-black uppercase border-white/10 shrink-0 font-mono"
              >
                {m.matchCode || `#${m.matchNumber || idx + 1}`}
              </Badge>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
