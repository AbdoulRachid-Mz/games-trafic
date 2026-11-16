"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Swords,
  GitBranch,
  Layers,
  Users,
  Sparkles,
  ArrowRight,
  RotateCcw,
  SkipForward,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Shield,
  Calendar,
  Zap,
  Flame,
  Clock,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { cn } from "@/lib/utils";
import { PlayoffBracketVisual } from "@/components/tournaments/playoffs/playoff-bracket-visual";
import type {
  Tournament,
  TournamentPhase,
  TournamentEditionWithRelations,
} from "@/database/schema";

interface RevealPageClientProps {
  tournament: Tournament;
  edition: TournamentEditionWithRelations;
  phases: TournamentPhase[];
  phaseGroups?: any[];
  matches?: any[];
  level?: string;
  autoRedirect?: boolean;
  redirectUrl?: string;
}

type RevealStage = "intro" | "phases" | "groups" | "participants" | "brackets" | "conclusion";

// Durées calibrées par étape (Phase 6)
const STAGE_DURATIONS: Record<RevealStage, number> = {
  intro: 7,
  phases: 9,
  groups: 11,
  participants: 10,
  brackets: 11,
  conclusion: 7,
};

export function EditionStructureRevealPageClient({
  tournament,
  edition,
  phases = [],
  phaseGroups = [],
  matches = [],
  level = "all",
  autoRedirect = true,
  redirectUrl,
}: RevealPageClientProps) {
  const router = useRouter();
  const { setItem, isClient } = useLocalStorage();

  // Déterminer les étapes actives selon `level` (Phase 10 & 11)
  const availableStages: RevealStage[] = useMemo(() => {
    if (level === "edition") return ["intro", "conclusion"];
    if (level === "phases") return ["intro", "phases", "conclusion"];
    if (level === "groups") return ["intro", "phases", "groups", "conclusion"];
    if (level === "participants") return ["intro", "participants", "conclusion"];
    if (level === "brackets" || level === "matches") return ["intro", "brackets", "conclusion"];
    return ["intro", "phases", "groups", "participants", "brackets", "conclusion"];
  }, [level]);

  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [countdown, setCountdown] = useState(7);
  const targetUrl = redirectUrl || `/tournaments/${tournament.id}/editions/${edition.id}?revealed=1`;

  const currentStage = availableStages[currentStageIndex] || "conclusion";
  const isConclusion = currentStage === "conclusion";

  // Sauvegarder dans localStorage dès l'arrivée ou à la fin
  useEffect(() => {
    if (isClient) {
      setItem(`gt_edition_revealed_${edition.id}`, true);
    }
  }, [isClient, edition.id, setItem]);

  // Durée de l'étape courante
  const stageDuration = STAGE_DURATIONS[currentStage] || 8;
  const [stageProgress, setStageProgress] = useState(0);

  // Timer de progression automatique (Phase 6)
  useEffect(() => {
    if (!isPlaying) return;

    const interval = 50; // ms
    const step = (interval / (stageDuration * 1000)) * 100;

    const timer = setInterval(() => {
      setStageProgress((prev) => {
        if (prev >= 100) {
          // Passer à l'étape suivante automatiquement
          setCurrentStageIndex((idx) => {
            if (idx < availableStages.length - 1) {
              return idx + 1;
            }
            return idx;
          });
          return 0;
        }
        return prev + step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [isPlaying, stageDuration, availableStages.length, currentStageIndex]);

  // Countdown lors de la conclusion (Phase 6)
  useEffect(() => {
    if (isConclusion && autoRedirect && isPlaying) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isConclusion, autoRedirect, isPlaying]);

  // Navigation manuelle (Phase 5)
  const handlePrevious = () => {
    if (currentStageIndex > 0) {
      setCurrentStageIndex((prev) => prev - 1);
      setStageProgress(0);
    }
  };

  const handleNext = () => {
    if (currentStageIndex < availableStages.length - 1) {
      setCurrentStageIndex((prev) => prev + 1);
      setStageProgress(0);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    if (isClient) {
      setItem(`gt_edition_revealed_${edition.id}`, true);
    }
    router.push(targetUrl);
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleRestart = () => {
    setCurrentStageIndex(0);
    setStageProgress(0);
    setCountdown(7);
    setIsPlaying(true);
  };

  const registrations = edition.registrations || [];

  return (
    <div className="relative min-h-screen w-full bg-background text-foreground dark:bg-[#070512] dark:text-white flex flex-col justify-between overflow-hidden select-none transition-colors duration-500">
      {/* ── ARRIÈRE-PLAN DYNAMIQUE CYBER (DARK & LIGHT THEME ADAPTIVE) ── */}
      <div className="absolute inset-0 pointer-events-none -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background/95 to-background dark:from-[#0b051a] dark:via-[#050714] dark:to-[#030108]" />
        {tournament.coverImage && (
          <Image
            src={tournament.coverImage}
            alt={tournament.name}
            fill
            sizes="100vw"
            className="object-cover opacity-10 dark:opacity-20 filter blur-sm scale-105"
            priority
          />
        )}
        {/* Glows d'ambiance néon */}
        <div className="absolute -top-32 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[160px]" />
        <div className="absolute -bottom-32 right-1/4 w-[500px] h-[500px] bg-cyan-500/15 rounded-full blur-[160px]" />
        <div
          className="absolute inset-0 opacity-10 dark:opacity-15"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.15) 0%, transparent 60%),
              linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)`,
            backgroundSize: "100% 100%, 40px 40px, 40px 40px",
          }}
        />
      </div>

      {/* ── TOPBAR D'EN-TÊTE OFFICIEL ── */}
      <header className="relative z-30 container mx-auto px-4 md:px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge className="bg-primary/20 text-primary border-primary/40 font-black uppercase tracking-widest text-[10px] px-2.5 py-1">
            <Sparkles className="w-3 h-3 mr-1" />
            Cérémonie de Révélation
          </Badge>
          <span className="text-xs font-bold text-muted-foreground hidden sm:inline-block">
            {tournament.name} • {edition.name || `Édition #${edition.editionNumber}`}
          </span>
        </div>

        {/* Badge Étape en haut à droite */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-widest bg-card/60 dark:bg-black/30 px-3 py-1.5 rounded-full border border-border/60 dark:border-white/10">
            Étape {currentStageIndex + 1} / {availableStages.length}
          </span>
        </div>
      </header>

      {/* ── BARRE DE PROGRESSION GLOBALE ── */}
      <div className="relative z-30 container mx-auto px-4 md:px-8">
        <div className="flex gap-2 mb-2">
          {availableStages.map((stg, i) => (
            <div
              key={stg}
              className="flex-1 h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden relative"
            >
              <div
                className={cn(
                  "h-full transition-all duration-100",
                  i < currentStageIndex
                    ? "w-full bg-primary"
                    : i === currentStageIndex
                    ? "bg-gradient-to-r from-primary to-cyan-400"
                    : "w-0"
                )}
                style={{
                  width: i === currentStageIndex ? `${stageProgress}%` : undefined,
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── ZONE CENTRALE CINÉMATIQUE ── */}
      <main className="relative z-20 container mx-auto px-4 md:px-8 flex-1 flex items-center justify-center py-6 pb-24">
        <AnimatePresence mode="wait">
          {/* ÉTAPE 1 : INTRO DE L'ÉDITION */}
          {currentStage === "intro" && (
            <motion.div
              key="stage-intro"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.05, y: -20 }}
              transition={{ duration: 0.5 }}
              className="text-center max-w-2xl mx-auto space-y-6"
            >
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-primary/30 rounded-full blur-2xl animate-pulse" />
                <div className="relative p-5 rounded-3xl bg-gradient-to-br from-primary/30 to-violet-900/30 border border-primary/40 text-primary shadow-[0_0_30px_rgba(var(--primary),0.5)]">
                  <Trophy className="w-14 h-14 md:w-20 md:h-20 text-yellow-400" />
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-black uppercase tracking-[0.3em] text-cyan-500 dark:text-cyan-400">
                  {tournament.game} ESPORTS
                </span>
                <h1 className="text-3xl md:text-5xl font-black italic tracking-tight uppercase bg-clip-text text-transparent bg-gradient-to-r from-foreground via-primary to-foreground drop-shadow-sm">
                  {edition.name || `Édition #${edition.editionNumber}`}
                </h1>
                <p className="text-sm md:text-base text-muted-foreground font-medium">
                  {tournament.name} • La structure de compétition a été dévoilée
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                <div className="px-4 py-2 rounded-xl bg-card/80 dark:bg-card/60 border border-border dark:border-white/10 flex items-center gap-2 shadow-sm">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold text-foreground">
                    Format {(edition as any).format || "Standard"}
                  </span>
                </div>
                <div className="px-4 py-2 rounded-xl bg-card/80 dark:bg-card/60 border border-border dark:border-white/10 flex items-center gap-2 shadow-sm">
                  <Users className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
                  <span className="text-xs font-bold text-foreground">
                    {registrations.length} Inscrits confirmés
                  </span>
                </div>
                {edition.prizePool && (
                  <div className="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2 text-amber-600 dark:text-amber-300 shadow-sm">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-black">
                      Prize Pool : {edition.prizePool} {edition.prizeCurrency || "GTC"}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ÉTAPE 2 : PHASES OFFICIELLES */}
          {currentStage === "phases" && (
            <motion.div
              key="stage-phases"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-4xl mx-auto space-y-6"
            >
              <div className="text-center space-y-1">
                <span className="text-xs font-black uppercase tracking-[0.25em] text-primary">
                  Structure Compétitive
                </span>
                <h2 className="text-2xl md:text-4xl font-black italic uppercase tracking-tight">
                  Architecture des Phases
                </h2>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Découpage officiel du parcours compétitif de l&apos;édition
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {phases.map((phase, idx) => (
                  <motion.div
                    key={phase.id}
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: idx * 0.15 }}
                    className="p-5 rounded-2xl bg-card/90 dark:bg-card/80 backdrop-blur-xl border border-primary/30 shadow-xl space-y-3 relative overflow-hidden group hover:border-primary transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <Badge className="bg-primary/20 text-primary border-primary/40 text-[10px] font-black uppercase">
                        Phase {phase.order || idx + 1}
                      </Badge>
                      <span className="text-[10px] font-mono text-muted-foreground uppercase font-bold">
                        {phase.phaseType}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-black text-lg text-foreground italic">{phase.name}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {phase.description || "Phase officielle de qualification et de sélection."}
                      </p>
                    </div>
                    <div className="pt-2 border-t border-border/50 dark:border-white/5 flex items-center justify-between text-xs font-bold text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-primary" />
                        Type : {phase.phaseType}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ÉTAPE 3 : GROUPES & POULES RÉELLES (PHASE 10) */}
          {currentStage === "groups" && (
            <motion.div
              key="stage-groups"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-4xl mx-auto space-y-6"
            >
              <div className="text-center space-y-1">
                <span className="text-xs font-black uppercase tracking-[0.25em] text-cyan-500 dark:text-cyan-400">
                  Tirage & Poules
                </span>
                <h2 className="text-2xl md:text-4xl font-black italic uppercase tracking-tight">
                  Groupes & Journées Dévoilés
                </h2>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Composition officielle des poules et affectations de tournoi
                </p>
              </div>

              {phaseGroups.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[420px] overflow-y-auto no-scrollbar p-1">
                  {phaseGroups.map((group: any, gIdx: number) => {
                    const participants = group.participants || [];

                    return (
                      <motion.div
                        key={group.id || gIdx}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: gIdx * 0.1 }}
                        className="p-4 rounded-2xl bg-card/90 dark:bg-card/80 backdrop-blur-xl border border-cyan-500/30 shadow-lg space-y-3"
                      >
                        <div className="flex items-center justify-between pb-2 border-b border-border/50 dark:border-white/5">
                          <span className="font-black text-sm uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                            {group.name || `Poule ${String.fromCharCode(65 + gIdx)}`}
                          </span>
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {participants.length} participants
                          </Badge>
                        </div>

                        <div className="space-y-1.5 max-h-[220px] overflow-y-auto no-scrollbar">
                          {participants.length > 0 ? (
                            participants.map((gp: any, pIdx: number) => {
                              const reg = gp.registration;
                              const member = reg?.member;
                              const user = member?.user;
                              const team = reg?.team || member?.team;
                              const pName =
                                team?.name ||
                                member?.displayName ||
                                user?.username ||
                                user?.fullName ||
                                `Participant #${pIdx + 1}`;
                              const pAvatar = team?.logo || member?.avatar || user?.profileImage;

                              return (
                                <div
                                  key={gp.id || pIdx}
                                  className="flex items-center justify-between p-1.5 rounded-lg bg-background/60 dark:bg-black/30 border border-border/40 dark:border-white/5 text-xs"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <Avatar className="w-5 h-5 shrink-0 border border-white/20">
                                      <AvatarImage src={pAvatar || undefined} />
                                      <AvatarFallback className="text-[8px] font-black">
                                        {pName.substring(0, 2).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="font-bold truncate text-foreground">
                                      {pName}
                                    </span>
                                  </div>
                                  {gp.seed && (
                                    <span className="text-[10px] font-mono font-bold text-muted-foreground">
                                      #{gp.seed}
                                    </span>
                                  )}
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-xs text-muted-foreground italic text-center py-4">
                              Tirage au sort en attente
                            </p>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 rounded-3xl bg-card/60 dark:bg-card/40 border border-dashed border-cyan-500/40 text-center max-w-lg mx-auto space-y-3">
                  <div className="p-4 rounded-full bg-cyan-500/20 text-cyan-400 inline-block">
                    <Sparkles className="w-8 h-8 animate-pulse" />
                  </div>
                  <h3 className="font-black text-lg text-foreground uppercase tracking-wide">
                    Groupes en cours de constitution
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Le tirage au sort des poules aura lieu dès la clôture définitive des inscriptions.
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* ÉTAPE 4 : PARTICIPANTS & ROSTERS ENGAGÉS */}
          {currentStage === "participants" && (
            <motion.div
              key="stage-participants"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-4xl mx-auto space-y-6"
            >
              <div className="text-center space-y-1">
                <span className="text-xs font-black uppercase tracking-[0.25em] text-primary">
                  Compétiteurs Officiels
                </span>
                <h2 className="text-2xl md:text-4xl font-black italic uppercase tracking-tight">
                  Rosters & Compétiteurs Révélés
                </h2>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Les joueurs et équipes engagés pour remporter le titre
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[380px] overflow-y-auto no-scrollbar p-1">
                {registrations.slice(0, 24).map((reg, idx) => {
                  const regAny = reg as any;
                  const name =
                    reg.team?.name ||
                    regAny.member?.team?.name ||
                    regAny.member?.displayName ||
                    reg.user?.username ||
                    (reg.user as any)?.fullName ||
                    (reg.user as any)?.name ||
                    `Joueur #${idx + 1}`;
                  const avatar =
                    reg.team?.logo ||
                    regAny.member?.team?.logo ||
                    regAny.member?.avatar ||
                    reg.user?.profileImage;

                  return (
                    <motion.div
                      key={reg.id || idx}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.04 }}
                      className="p-3 rounded-xl bg-card/90 dark:bg-card/60 backdrop-blur-md border border-border dark:border-white/10 flex items-center gap-3 shadow-md"
                    >
                      <Avatar className="w-9 h-9 border border-border/80 dark:border-white/15">
                        <AvatarImage src={avatar || undefined} />
                        <AvatarFallback className="bg-primary/20 text-primary font-black text-xs">
                          {name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-bold text-xs truncate text-foreground">{name}</p>
                        <p className="text-[10px] font-mono text-muted-foreground truncate">
                          Seed #{regAny.seed || idx + 1}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ÉTAPE 5 : ARBRE & PLAYOFFS OFFICIELS (PHASE 11) */}
          {currentStage === "brackets" && (
            <motion.div
              key="stage-brackets"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-5xl mx-auto space-y-4 text-center"
            >
              <div className="space-y-1">
                <span className="text-xs font-black uppercase tracking-[0.25em] text-amber-500 dark:text-amber-400">
                  Phase Finale
                </span>
                <h2 className="text-2xl md:text-4xl font-black italic uppercase tracking-tight">
                  Arbre des Play-offs Déverrouillé
                </h2>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Le schéma de confrontations officielles du Championnat
                </p>
              </div>

              {/* Aperçu officiel de l'arbre Playoff */}
              <div className="p-3 md:p-6 rounded-3xl bg-card/90 dark:bg-card/80 border border-cyan-500/30 shadow-2xl overflow-hidden max-h-[460px] flex items-center justify-center">
                <div className="w-full max-w-4xl transform scale-75 md:scale-85 origin-center">
                  <PlayoffBracketVisual
                    matches={matches}
                    tournamentName={tournament.name}
                    editionName={edition.name || `Édition #${edition.editionNumber}`}
                    game={tournament.game}
                    tournamentId={tournament.id}
                    editionId={edition.id}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* ÉTAPE 6 : CONCLUSION & REDIRECTION */}
          {currentStage === "conclusion" && (
            <motion.div
              key="stage-conclusion"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="text-center max-w-xl mx-auto space-y-6"
            >
              <div className="p-4 rounded-full bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 border border-emerald-500/30 inline-block shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                <CheckCircle2 className="w-16 h-16" />
              </div>

              <div className="space-y-2">
                <h2 className="text-3xl md:text-5xl font-black italic uppercase tracking-tight">
                  Prêt pour l&apos;Arène !
                </h2>
                <p className="text-sm md:text-base text-muted-foreground">
                  La structure de {edition.name || `l'Édition #${edition.editionNumber}`} est active et confirmée.
                </p>
              </div>

              <div className="pt-4 flex flex-col items-center gap-3">
                <Button
                  size="lg"
                  onClick={handleComplete}
                  className="px-10 py-6 text-base font-black uppercase tracking-wider italic bg-gradient-to-r from-primary via-violet-600 to-cyan-500 hover:scale-105 transition-all shadow-[0_0_30px_rgba(var(--primary),0.5)]"
                >
                  Accéder à l&apos;Édition
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                {autoRedirect && (
                  <span className="text-xs text-muted-foreground font-mono">
                    Redirection automatique dans {countdown}s...
                  </span>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ── BARRE DE CONTRÔLE FLOTTANTE CENTRÉE EN BAS (PHASE 5 & 12) ── */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 md:gap-2 px-3 py-2 rounded-2xl bg-background/90 dark:bg-black/85 backdrop-blur-2xl border border-border/80 dark:border-white/15 shadow-[0_10px_40px_rgba(0,0,0,0.35)]">
        {/* Précédent */}
        <Button
          variant="ghost"
          size="sm"
          disabled={currentStageIndex === 0}
          onClick={handlePrevious}
          className="text-xs font-bold text-muted-foreground hover:text-foreground h-9 px-2.5 md:px-3"
          title="Étape précédente"
          aria-label="Étape précédente"
        >
          <ChevronLeft className="w-4 h-4 md:mr-1" />
          <span className="hidden md:inline">Précédent</span>
        </Button>

        {/* Lecture / Pause */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsPlaying((p) => !p)}
          className="text-xs font-bold text-muted-foreground hover:text-foreground h-9 px-2.5 md:px-3"
          title={isPlaying ? "Mettre en pause" : "Reprendre la lecture"}
          aria-label={isPlaying ? "Mettre en pause" : "Reprendre la lecture"}
        >
          {isPlaying ? <Pause className="w-4 h-4 md:mr-1" /> : <Play className="w-4 h-4 md:mr-1" />}
          <span className="hidden md:inline">{isPlaying ? "Pause" : "Lecture"}</span>
        </Button>

        {/* Suivant */}
        <Button
          variant="ghost"
          size="sm"
          disabled={currentStageIndex === availableStages.length - 1}
          onClick={handleNext}
          className="text-xs font-bold text-muted-foreground hover:text-foreground h-9 px-2.5 md:px-3"
          title="Étape suivante"
          aria-label="Étape suivante"
        >
          <span className="hidden md:inline">Suivant</span>
          <ChevronRight className="w-4 h-4 md:ml-1" />
        </Button>

        {/* Recommencer */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRestart}
          className="text-xs font-bold text-muted-foreground hover:text-foreground h-9 px-2.5"
          title="Recommencer depuis le début"
          aria-label="Recommencer depuis le début"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>

        <div className="w-px h-5 bg-border/60 dark:bg-white/10 mx-0.5" />

        {/* Passer */}
        <Button
          size="sm"
          onClick={handleSkip}
          className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-black uppercase tracking-wider h-9 px-3 gap-1 shadow-md hover:scale-102 transition-all"
          title="Passer directement à la page de l'édition"
          aria-label="Passer directement à la page de l'édition"
        >
          <span className="hidden md:inline">Passer</span>
          <SkipForward className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
