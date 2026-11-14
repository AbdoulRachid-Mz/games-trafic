"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
  Calendar,
  Network,
  ArrowRight,
  Shield,
  HelpCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ============================================================================
// CONTRAT DE DONNÉES & VIEWMODEL TYPÉ
// ============================================================================

export interface GenerationLevel {
  groups: boolean;
  brackets: boolean;
  matches: boolean;
}

export interface EditionRegistrationData {
  id: string;
  seed?: number | null;
  status?: string;
  gameTag?: string | null;
  member?: {
    id?: string;
    displayName?: string;
    gameLevel?: string | null;
    avatar?: string | null;
    user?: {
      id?: string;
      username?: string;
      name?: string;
      profileImage?: string | null;
    };
    team?: {
      id?: string;
      name?: string;
      logo?: string | null;
      tag?: string | null;
    };
  };
}

export interface EditionStructureData {
  id?: string;
  name?: string;
  registrations?: EditionRegistrationData[];
  phases: Array<{
    id: string;
    name: string;
    phaseType: string;
    order: number;
    groups?: Array<{
      id: string;
      name: string;
      order: number;
      groupType?: string;
      participantCount?: number;
      participants?: Array<{
        id: string;
        registrationId?: string;
        registration?: EditionRegistrationData;
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
      groupId?: string | null;
      bracketNodeId?: string | null;
      participant1RegistrationId?: string | null;
      participant2RegistrationId?: string | null;
      participant1?: EditionRegistrationData | null;
      participant2?: EditionRegistrationData | null;
      scheduledTime?: string | null;
      status?: string;
    }>;
  }>;
}

export interface EditionStructureRevealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editionName?: string;
  structure: EditionStructureData | null;
  generationLevel?: GenerationLevel;
  onFinish?: () => void;
}

// ============================================================================
// LES 3 GRANDS MOMENTS NARRATIFS
// ============================================================================

type NarrativeMoment = "entities" | "participants" | "assignments";

interface MomentConfig {
  key: NarrativeMoment;
  title: string;
  subtitle: string;
  icon: React.ElementType;
}

const MOMENTS: MomentConfig[] = [
  {
    key: "entities",
    title: "1. Architecture du Tournoi",
    subtitle: "Entités, phases et arborescence structurelle",
    icon: Network,
  },
  {
    key: "participants",
    title: "2. Rosters & Inscrits",
    subtitle: "Tous les compétiteurs qualifiés",
    icon: Users,
  },
  {
    key: "assignments",
    title: "3. Déploiement dans la Structure",
    subtitle: "Poules, journées, brackets et confrontations",
    icon: GitBranch,
  },
];

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export function EditionStructureRevealDialog({
  open,
  onOpenChange,
  editionName = "Édition",
  structure,
  generationLevel = { groups: true, brackets: true, matches: true },
  onFinish,
}: EditionStructureRevealDialogProps) {
  const [currentMomentIndex, setCurrentMomentIndex] = useState(0);
  const [revealedItemsCount, setRevealedItemsCount] = useState(0);
  const [isAllRevealed, setIsAllRevealed] = useState(false);
  const finishTriggeredRef = useRef(false);

  // Détecter prefers-reduced-motion
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      setPrefersReducedMotion(mediaQuery.matches);
      const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener("change", listener);
      return () => mediaQuery.removeEventListener("change", listener);
    }
  }, []);

  const phases = useMemo(() => structure?.phases || [], [structure]);

  // Tous les participants globaux (sans doublons)
  const globalParticipants = useMemo(() => {
    const list: EditionRegistrationData[] = [];
    const seen = new Set<string>();

    if (structure?.registrations && structure.registrations.length > 0) {
      for (const reg of structure.registrations) {
        if (!seen.has(reg.id)) {
          seen.add(reg.id);
          list.push(reg);
        }
      }
    }

    // Compléter depuis les participants des groupes si non présents dans registrations
    for (const p of phases) {
      for (const g of p.groups || []) {
        for (const part of g.participants || []) {
          const regId = part.registrationId || part.id;
          if (regId && !seen.has(regId)) {
            seen.add(regId);
            list.push(part.registration || (part as any));
          }
        }
      }
    }

    return list;
  }, [structure, phases]);

  // Nombre d'éléments maximal du moment actif pour borner l'animation
  const maxItemsForActiveMoment = useMemo(() => {
    const moment = MOMENTS[currentMomentIndex]?.key;
    if (moment === "entities") {
      let count = phases.length;
      for (const p of phases) {
        count += (p.groups?.length || 0);
        if (generationLevel.brackets) {
          count += (p.bracketNodes?.length || 0);
        }
      }
      return Math.max(count, 1);
    }
    if (moment === "participants") {
      return Math.max(globalParticipants.length, 1);
    }
    if (moment === "assignments") {
      let count = 0;
      for (const p of phases) {
        count += (p.groups?.length || 0);
        if (generationLevel.brackets) {
          count += (p.bracketNodes?.length || 0);
        }
        if (generationLevel.matches) {
          count += (p.matches?.length || 0);
        }
      }
      return Math.max(count, 1);
    }
    return 10;
  }, [currentMomentIndex, phases, globalParticipants, generationLevel]);

  // Réinitialisation propre à l'ouverture
  useEffect(() => {
    if (open) {
      setCurrentMomentIndex(0);
      setRevealedItemsCount(prefersReducedMotion ? 999 : 0);
      setIsAllRevealed(prefersReducedMotion);
      finishTriggeredRef.current = false;
    }
  }, [open, prefersReducedMotion]);

  // Interval d'animation incrémentale borné (pas de timer infini)
  useEffect(() => {
    if (!open || isAllRevealed || prefersReducedMotion) return;

    const timer = setInterval(() => {
      setRevealedItemsCount((prev) => {
        if (prev >= maxItemsForActiveMoment) {
          clearInterval(timer);
          return prev;
        }
        return prev + 1;
      });
    }, 280);

    return () => clearInterval(timer);
  }, [open, isAllRevealed, currentMomentIndex, maxItemsForActiveMoment, prefersReducedMotion]);

  const isLastMoment = currentMomentIndex === MOMENTS.length - 1;

  const handleNextMoment = () => {
    if (!isLastMoment) {
      setCurrentMomentIndex((prev) => prev + 1);
      setRevealedItemsCount(prefersReducedMotion ? 999 : 0);
    } else {
      setIsAllRevealed(true);
      triggerFinishOnce();
    }
  };

  const handleRevealAll = () => {
    setIsAllRevealed(true);
    setCurrentMomentIndex(MOMENTS.length - 1);
    setRevealedItemsCount(999);
  };

  const triggerFinishOnce = () => {
    if (!finishTriggeredRef.current) {
      finishTriggeredRef.current = true;
      onFinish?.();
    }
  };

  const handleFinish = () => {
    onOpenChange(false);
    triggerFinishOnce();
  };

  const currentMoment = MOMENTS[currentMomentIndex] || MOMENTS[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden bg-card/95 backdrop-blur-2xl border-white/10 shadow-[0_0_60px_rgba(0,0,0,0.85)]">
        {/* Header Gaming avec Stepper 3 Moments */}
        <div className="p-5 sm:p-6 border-b border-white/10 bg-gradient-to-r from-primary/15 via-primary/5 to-transparent shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shadow-[0_0_25px_rgba(var(--primary),0.35)] shrink-0">
                <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 animate-pulse" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-lg sm:text-xl font-black italic uppercase tracking-tighter text-foreground truncate">
                  Déploiement de la Structure
                </DialogTitle>
                <DialogDescription className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
                  {editionName} · Révélation officielle
                </DialogDescription>
              </div>
            </div>

            {/* Stepper des 3 moments narratifs (scrollable sur mobile) */}
            <div className="flex items-center gap-1.5 bg-background/60 p-1.5 rounded-xl border border-white/5 overflow-x-auto no-scrollbar">
              {MOMENTS.map((m, idx) => {
                const Icon = m.icon;
                const isPassed = idx < currentMomentIndex || isAllRevealed;
                const isCurrent = idx === currentMomentIndex && !isAllRevealed;
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => {
                      setCurrentMomentIndex(idx);
                      setRevealedItemsCount(999);
                    }}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer",
                      isCurrent &&
                        "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.35)] font-black",
                      isPassed && "text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20",
                      !isCurrent && !isPassed && "text-muted-foreground opacity-50 hover:opacity-80",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>Moment {idx + 1}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bandeau de contexte du moment actif */}
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
            <span className="font-bold text-foreground flex items-center gap-1.5">
              <currentMoment.icon className="h-4 w-4 text-primary" />
              {currentMoment.title}
            </span>
            <span className="text-muted-foreground text-[11px] hidden sm:inline">
              {currentMoment.subtitle}
            </span>
          </div>
        </div>

        {/* Corps de révélation scrollable */}
        <ScrollArea className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {phases.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <HelpCircle className="h-10 w-10 text-muted-foreground mx-auto" />
              <p className="text-sm font-semibold text-muted-foreground">
                Aucune structure configurée pour cette édition.
              </p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={currentMoment.key + (isAllRevealed ? "-all" : "")}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                {/* Moment 1 : Révélation des entités (Arborescence stricte) */}
                {(currentMoment.key === "entities" || isAllRevealed) && (
                  <EntitiesMomentStep
                    phases={phases}
                    generationLevel={generationLevel}
                    revealedCount={
                      isAllRevealed || currentMoment.key !== "entities"
                        ? 999
                        : revealedItemsCount
                    }
                  />
                )}

                {/* Moment 2 : Révélation globale des participants */}
                {(currentMoment.key === "participants" || isAllRevealed) && (
                  <ParticipantsMomentStep
                    participants={globalParticipants}
                    revealedCount={
                      isAllRevealed || currentMoment.key !== "participants"
                        ? 999
                        : revealedItemsCount
                    }
                  />
                )}

                {/* Moment 3 : Présentation détaillée des affectations réelles */}
                {(currentMoment.key === "assignments" || isAllRevealed) && (
                  <AssignmentsMomentStep
                    phases={phases}
                    generationLevel={generationLevel}
                    revealedCount={
                      isAllRevealed || currentMoment.key !== "assignments"
                        ? 999
                        : revealedItemsCount
                    }
                  />
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </ScrollArea>

        {/* Footer avec contrôles */}
        <div className="p-4 border-t border-white/10 bg-card/80 backdrop-blur-md flex items-center justify-between gap-3 shrink-0">
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
            {!isLastMoment && !isAllRevealed ? (
              <Button
                size="sm"
                onClick={handleNextMoment}
                className="gap-2 font-black text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(var(--primary),0.25)]"
              >
                <span>Étape suivante</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                size="sm"
                variant="default"
                onClick={handleFinish}
                className="gap-2 font-black text-xs uppercase tracking-wider bg-emerald-500 hover:bg-emerald-600 text-black shadow-[0_0_20px_rgba(16,185,129,0.35)]"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Terminer et Accéder</span>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// MOMENT 1 : Révélation des entités en arborescence stricte
// ============================================================================

function EntitiesMomentStep({
  phases,
  generationLevel,
  revealedCount,
}: {
  phases: EditionStructureData["phases"];
  generationLevel: GenerationLevel;
  revealedCount: number;
}) {
  let counter = 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Network className="h-5 w-5 text-primary" />
          <h3 className="font-black italic text-base sm:text-lg uppercase tracking-tight text-foreground">
            Architecture Hiérarchique du Tournoi
          </h3>
        </div>
        <Badge variant="outline" className="text-[10px] font-mono border-white/10">
          {phases.length} Phase(s)
        </Badge>
      </div>

      <div className="space-y-4">
        {phases.map((phase) => {
          counter++;
          const isPhaseRevealed = counter <= revealedCount;

          return (
            <motion.div
              key={phase.id}
              initial={{ opacity: 0, y: 15 }}
              animate={isPhaseRevealed ? { opacity: 1, y: 0 } : { opacity: 0.2 }}
              transition={{ duration: 0.3 }}
              className={cn(
                "p-4 sm:p-5 rounded-2xl border bg-card/70 backdrop-blur-xl transition-all relative overflow-hidden",
                isPhaseRevealed
                  ? "border-primary/40 shadow-[0_0_25px_rgba(var(--primary),0.08)]"
                  : "border-white/5 opacity-25",
              )}
            >
              {/* Header de phase */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] font-black uppercase font-mono border-white/10">
                    Phase #{phase.order + 1}
                  </Badge>
                  <h4 className="font-black italic text-base sm:text-lg text-foreground">
                    {phase.name}
                  </h4>
                </div>
                <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] font-black uppercase">
                  {phase.phaseType}
                </Badge>
              </div>

              {/* Groupes ou journées de la phase */}
              {(phase.groups && phase.groups.length > 0) && (
                <div className="mt-4 space-y-2">
                  <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-primary" />
                    <span>
                      {phase.phaseType === "ROUND_ROBIN" ? "Journées programmées" : "Groupes & Poules"} (
                      {phase.groups.length})
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {phase.groups.map((g) => {
                      counter++;
                      const isGroupRevealed = counter <= revealedCount;
                      return (
                        <div
                          key={g.id}
                          className={cn(
                            "p-2.5 rounded-xl border bg-background/50 flex items-center justify-between transition-all text-xs font-semibold",
                            isGroupRevealed
                              ? "border-white/10 text-foreground"
                              : "border-transparent text-muted-foreground opacity-30",
                          )}
                        >
                          <span className="font-bold truncate">{g.name}</span>
                          <span className="text-[10px] font-mono text-primary font-bold">
                            {g.participants?.length || g.participantCount || 0} part.
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Brackets, rounds et petite finale (uniquement si autorisés par generationLevel) */}
              {generationLevel.brackets && (phase.bracketNodes && phase.bracketNodes.length > 0) && (
                <div className="mt-4 pt-3 border-t border-white/5 space-y-2">
                  <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <GitBranch className="h-3.5 w-3.5 text-amber-400" />
                    <span>Arborescence Éliminatoire & Nœuds ({phase.bracketNodes.length})</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {phase.bracketNodes.map((n) => {
                      counter++;
                      const isNodeRevealed = counter <= revealedCount;
                      const isConsolation =
                        n.bracketType === "CONSOLATION" || n.metadata?.isThirdPlace === true;

                      return (
                        <div
                          key={n.id}
                          className={cn(
                            "p-2 rounded-lg border text-xs flex items-center justify-between font-mono font-bold transition-all",
                            isConsolation
                              ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                              : "bg-background/40 border-white/5 text-foreground",
                            !isNodeRevealed && "opacity-25",
                          )}
                        >
                          <span className="truncate">{n.nodeCode}</span>
                          <span className="text-[9px] uppercase">
                            {isConsolation ? "3ème Pl." : `R${n.round || 1}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// MOMENT 2 : Révélation globale des participants réels
// ============================================================================

function ParticipantsMomentStep({
  participants,
  revealedCount,
}: {
  participants: EditionRegistrationData[];
  revealedCount: number;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h3 className="font-black italic text-base sm:text-lg uppercase tracking-tight text-foreground">
            Roster Global des Participants
          </h3>
        </div>
        <Badge className="bg-primary/20 text-primary border-primary/30 font-mono text-xs font-bold">
          {participants.length} Participant(s) Inscrits
        </Badge>
      </div>

      {participants.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground border border-dashed border-white/10 rounded-2xl">
          Aucun participant inscrit à afficher pour le moment.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {participants.map((reg, idx) => {
            const isRevealed = idx < revealedCount;
            const name =
              reg.member?.displayName ||
              reg.member?.user?.name ||
              reg.member?.user?.username ||
              reg.member?.team?.name ||
              `Joueur #${idx + 1}`;
            const image =
              reg.member?.user?.profileImage ||
              reg.member?.avatar ||
              reg.member?.team?.logo;
            const seed = reg.seed ? `#Seed ${reg.seed}` : null;
            const tag = reg.gameTag || reg.member?.team?.tag;

            return (
              <motion.div
                key={reg.id || idx}
                initial={{ scale: 0.92, opacity: 0 }}
                animate={isRevealed ? { scale: 1, opacity: 1 } : { opacity: 0.15 }}
                transition={{ duration: 0.25 }}
                className={cn(
                  "p-3 rounded-2xl border flex items-center gap-3 bg-card/70 backdrop-blur-md relative overflow-hidden transition-all",
                  isRevealed
                    ? "border-white/10 hover:border-primary/40 shadow-sm"
                    : "border-white/5 opacity-20",
                )}
              >
                <Avatar className="h-10 w-10 border border-white/15 shrink-0 rounded-xl">
                  <AvatarImage src={image || undefined} />
                  <AvatarFallback className="text-xs font-black bg-primary/20 text-primary">
                    {name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-bold text-xs text-foreground truncate">
                      {name}
                    </span>
                    {tag && (
                      <span className="text-[10px] text-primary font-mono font-bold">
                        [{tag}]
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-2 mt-0.5">
                    {seed && (
                      <span className="text-emerald-400 font-bold font-mono">
                        {seed}
                      </span>
                    )}
                    {reg.member?.gameLevel && (
                      <span className="truncate">{reg.member.gameLevel}</span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MOMENT 3 : Présentation détaillée des affectations réelles
// ============================================================================

function AssignmentsMomentStep({
  phases,
  generationLevel,
  revealedCount,
}: {
  phases: EditionStructureData["phases"];
  generationLevel: GenerationLevel;
  revealedCount: number;
}) {
  let counter = 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitBranch className="h-5 w-5 text-primary" />
          <h3 className="font-black italic text-base sm:text-lg uppercase tracking-tight text-foreground">
            Affectations Structurelles & Confrontations
          </h3>
        </div>
      </div>

      {phases.map((phase) => {
        const isGroupBased =
          phase.phaseType === "GROUP_STAGE" || phase.phaseType === "ROUND_ROBIN";
        const isElimination =
          phase.phaseType === "ELIMINATION" || phase.phaseType === "KNOCKOUT";
        const isSwiss = phase.phaseType === "SWISS";

        return (
          <div
            key={phase.id}
            className="p-4 sm:p-5 rounded-2xl border border-white/10 bg-card/80 backdrop-blur-xl space-y-4"
          >
            {/* Header de la phase */}
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-primary tracking-wider">
                  Phase #{phase.order + 1}
                </span>
                <h4 className="font-black italic text-base text-foreground">
                  {phase.name}
                </h4>
              </div>
              <Badge variant="outline" className="text-[9px] font-black uppercase border-white/10">
                {phase.phaseType}
              </Badge>
            </div>

            {/* CAS 1 : Phases par groupes ou Round Robin */}
            {isGroupBased && (
              <div className="space-y-4">
                {(phase.groups || []).map((group) => {
                  counter++;
                  const isRevealed = counter <= revealedCount;

                  // Matchs de ce groupe si autorisés par generationLevel.matches
                  const groupMatches = generationLevel.matches
                    ? (phase.matches || []).filter((m) => m.groupId === group.id)
                    : [];

                  return (
                    <motion.div
                      key={group.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={isRevealed ? { opacity: 1, y: 0 } : { opacity: 0.15 }}
                      transition={{ duration: 0.25 }}
                      className="p-3.5 sm:p-4 rounded-xl border border-white/5 bg-background/40 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black italic text-sm text-foreground">
                          {group.name}
                        </span>
                        <Badge variant="secondary" className="text-[9px] font-bold">
                          {group.participants?.length || 0} participants
                        </Badge>
                      </div>

                      {/* Participants affectés au groupe */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {(group.participants || []).map((part, pIdx) => {
                          const name =
                            part.registration?.member?.displayName ||
                            part.registration?.member?.user?.username ||
                            part.member?.displayName ||
                            part.member?.user?.username ||
                            `Part. #${pIdx + 1}`;
                          const image =
                            part.registration?.member?.user?.profileImage ||
                            part.registration?.member?.avatar ||
                            part.member?.user?.profileImage;

                          return (
                            <div
                              key={part.id || pIdx}
                              className="p-2 rounded-lg bg-card/60 border border-white/5 flex items-center gap-2 truncate"
                            >
                              <Avatar className="h-6 w-6 rounded-md shrink-0">
                                <AvatarImage src={image} />
                                <AvatarFallback className="text-[9px] font-black bg-primary/20 text-primary">
                                  {name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs font-semibold truncate text-foreground">
                                {name}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Matchs du groupe (uniquement si autorisés et présents) */}
                      {generationLevel.matches && groupMatches.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-white/5 space-y-1.5">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                            <Swords className="h-3 w-3 text-primary" />
                            Rencontres programmées ({groupMatches.length})
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {groupMatches.map((m) => (
                              <MatchMiniCard key={m.id} match={m} />
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* CAS 2 : Phase Éliminatoire & Bracket */}
            {isElimination && (
              <div className="space-y-4">
                {generationLevel.brackets && (phase.bracketNodes && phase.bracketNodes.length > 0) ? (
                  <div className="overflow-x-auto pb-2 -mx-2 px-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 min-w-[500px]">
                      {phase.bracketNodes.map((node) => {
                        counter++;
                        const isNodeRevealed = counter <= revealedCount;
                        const isThirdPlace =
                          node.bracketType === "CONSOLATION" ||
                          node.metadata?.isThirdPlace === true;

                        // Match associé au nœud si matches activés
                        const nodeMatch = generationLevel.matches
                          ? (phase.matches || []).find((m) => m.bracketNodeId === node.id)
                          : null;

                        return (
                          <motion.div
                            key={node.id}
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={isNodeRevealed ? { scale: 1, opacity: 1 } : { opacity: 0.2 }}
                            transition={{ duration: 0.25 }}
                            className={cn(
                              "p-3 rounded-xl border backdrop-blur-md space-y-2",
                              isThirdPlace
                                ? "bg-amber-500/10 border-amber-500/30 text-amber-200"
                                : "bg-background/50 border-white/10 text-foreground",
                            )}
                          >
                            <div className="flex items-center justify-between text-xs font-mono font-bold">
                              <span>{node.nodeCode}</span>
                              <Badge
                                variant={isThirdPlace ? "default" : "outline"}
                                className={cn(
                                  "text-[9px] uppercase",
                                  isThirdPlace && "bg-amber-500 text-black font-black",
                                )}
                              >
                                {isThirdPlace ? "Petite Finale" : `Round ${node.round || 1}`}
                              </Badge>
                            </div>

                            {nodeMatch ? (
                              <MatchMiniCard match={nodeMatch} />
                            ) : (
                              <div className="text-[11px] text-muted-foreground/70 italic p-2 rounded bg-black/20 text-center">
                                Confrontation structurelle prête
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 text-center text-xs text-muted-foreground border border-dashed border-white/10 rounded-xl">
                    Les brackets seront générés lors de l'activation des phases finales.
                  </div>
                )}
              </div>
            )}

            {/* CAS 3 : Système Suisse */}
            {isSwiss && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Rondes suisses générées dynamiquement après chaque tour selon les scores des participants.
                </p>
                {generationLevel.matches && (phase.matches || []).length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(phase.matches || []).map((m) => (
                      <MatchMiniCard key={m.id} match={m} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// SOUS-COMPOSANT MINI MATCH CARD
// ============================================================================

function MatchMiniCard({ match }: { match: any }) {
  const p1Name =
    match.participant1?.member?.displayName ||
    match.participant1?.member?.user?.username ||
    match.participant1?.member?.team?.name ||
    "TBD";

  const p2Name =
    match.participant2?.member?.displayName ||
    match.participant2?.member?.user?.username ||
    match.participant2?.member?.team?.name ||
    "TBD";

  return (
    <div className="p-2 rounded-lg bg-card/80 border border-white/10 flex items-center justify-between gap-2 text-xs">
      <div className="flex items-center gap-1.5 font-bold truncate flex-1">
        <span className="truncate text-foreground">{p1Name}</span>
        <span className="text-[10px] text-muted-foreground/50 font-black">VS</span>
        <span className="truncate text-foreground">{p2Name}</span>
      </div>
      <Badge variant="outline" className="text-[9px] font-mono shrink-0 border-white/10">
        {match.matchCode || `#${match.matchNumber || 1}`}
      </Badge>
    </div>
  );
}
