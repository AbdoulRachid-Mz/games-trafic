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
  CheckCircle2,
  Shield,
  Calendar,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { cn } from "@/lib/utils";
import type {
  Tournament,
  TournamentPhase,
  TournamentEditionWithRelations,
} from "@/database/schema";

interface RevealPageClientProps {
  tournament: Tournament;
  edition: TournamentEditionWithRelations;
  phases: TournamentPhase[];
  level?: string;
  autoRedirect?: boolean;
  redirectUrl?: string;
}

type RevealStage = "intro" | "phases" | "participants" | "brackets" | "conclusion";

export function EditionStructureRevealPageClient({
  tournament,
  edition,
  phases = [],
  level = "all",
  autoRedirect = true,
  redirectUrl,
}: RevealPageClientProps) {
  const router = useRouter();
  const { setItem, isClient } = useLocalStorage();

  // Déterminer les étapes actives selon `level`
  const availableStages: RevealStage[] = useMemo(() => {
    if (level === "edition") return ["intro", "conclusion"];
    if (level === "phases" || level === "groups") return ["intro", "phases", "conclusion"];
    if (level === "participants") return ["intro", "participants", "conclusion"];
    if (level === "brackets" || level === "matches") return ["intro", "brackets", "conclusion"];
    return ["intro", "phases", "participants", "brackets", "conclusion"];
  }, [level]);

  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [countdown, setCountdown] = useState(5);
  const targetUrl = redirectUrl || `/tournaments/${tournament.id}/editions/${edition.id}?revealed=1`;

  const currentStage = availableStages[currentStageIndex] || "conclusion";
  const isConclusion = currentStage === "conclusion";

  // Sauvegarder dans localStorage dès l'arrivée ou à la fin
  useEffect(() => {
    if (isClient) {
      setItem(`gt_edition_revealed_${edition.id}`, true);
    }
  }, [isClient, edition.id, setItem]);

  // Durée des étapes (en secondes)
  const stageDuration = currentStage === "intro" ? 4 : currentStage === "conclusion" ? 5 : 6;
  const [stageProgress, setStageProgress] = useState(0);

  // Timer de progression automatique
  useEffect(() => {
    if (!isPlaying) return;

    const interval = 50; // ms
    const step = (interval / (stageDuration * 1000)) * 100;

    const timer = setInterval(() => {
      setStageProgress((prev) => {
        if (prev >= 100) {
          // Passer à l'étape suivante
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

  // Countdown lors de la conclusion
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
    setCountdown(5);
    setIsPlaying(true);
  };

  const registrations = edition.registrations || [];

  return (
    <div className="relative min-h-screen w-full bg-[#05030a] text-white flex flex-col justify-between overflow-hidden select-none">
      {/* ── ARRIÈRE-PLAN DYNAMIQUE CYBER ── */}
      <div className="absolute inset-0 pointer-events-none -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0b051a] via-[#050714] to-[#030108]" />
        {tournament.coverImage && (
          <Image
            src={tournament.coverImage}
            alt={tournament.name}
            fill
            sizes="100vw"
            className="object-cover opacity-15 filter blur-sm scale-110"
            priority
          />
        )}
        {/* Glows d'ambiance néon */}
        <div className="absolute -top-32 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[160px]" />
        <div className="absolute -bottom-32 right-1/4 w-[500px] h-[500px] bg-cyan-500/15 rounded-full blur-[160px]" />
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.1) 0%, transparent 60%),
              linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)`,
            backgroundSize: "100% 100%, 40px 40px, 40px 40px",
          }}
        />
      </div>

      {/* ── TOPBAR DE CONTRÔLE ── */}
      <header className="relative z-30 container mx-auto px-4 md:px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge className="bg-primary/20 text-primary border-primary/40 font-black uppercase tracking-widest text-[10px] px-2.5 py-1">
            <Sparkles className="w-3 h-3 mr-1" />
            Révélation de Structure
          </Badge>
          <span className="text-xs font-bold text-muted-foreground hidden sm:inline-block">
            {tournament.name} • {edition.name || `Édition #${edition.editionNumber}`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsPlaying((p) => !p)}
            className="text-xs font-bold text-muted-foreground hover:text-white border border-white/10"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 mr-1" /> : <Play className="w-3.5 h-3.5 mr-1" />}
            {isPlaying ? "Pause" : "Reprendre"}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleRestart}
            className="text-xs font-bold text-muted-foreground hover:text-white border border-white/10"
            title="Revoir depuis le début"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>

          <Button
            size="sm"
            onClick={handleSkip}
            className="bg-white/10 hover:bg-primary text-white text-xs font-black uppercase tracking-wider gap-1.5 border border-white/15 transition-all shadow-[0_0_15px_rgba(var(--primary),0.2)]"
          >
            <span>Passer</span>
            <SkipForward className="w-3.5 h-3.5" />
          </Button>
        </div>
      </header>

      {/* ── BARRE DE PROGRESSION GLOBALE ── */}
      <div className="relative z-30 container mx-auto px-4 md:px-8">
        <div className="flex gap-2 mb-2">
          {availableStages.map((stg, i) => (
            <div
              key={stg}
              className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden relative"
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
      <main className="relative z-20 container mx-auto px-4 md:px-8 flex-1 flex items-center justify-center py-6">
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
                <span className="text-xs font-black uppercase tracking-[0.3em] text-cyan-400">
                  {tournament.game} ESPORTS
                </span>
                <h1 className="text-3xl md:text-5xl font-black italic tracking-tight uppercase bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-white drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]">
                  {edition.name || `Édition #${edition.editionNumber}`}
                </h1>
                <p className="text-sm md:text-base text-muted-foreground font-medium">
                  {tournament.name} • La structure de compétition a été dévoilée
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                <div className="px-4 py-2 rounded-xl bg-card/60 border border-white/10 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold text-foreground">
                    Format {(edition as any).format || "Standard"}
                  </span>
                </div>
                <div className="px-4 py-2 rounded-xl bg-card/60 border border-white/10 flex items-center gap-2">
                  <Users className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-foreground">
                    {registrations.length} Inscrits confirmés
                  </span>
                </div>
                {edition.prizePool && (
                  <div className="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2 text-amber-300">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-black">
                      Prize Pool : {edition.prizePool} {edition.prizeCurrency || "GTC"}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ÉTAPE 2 : PHASES & GROUPES */}
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
                  Étape 1 sur 3
                </span>
                <h2 className="text-2xl md:text-4xl font-black italic uppercase tracking-tight">
                  Architecture des Phases & Poules
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
                    className="p-5 rounded-2xl bg-card/80 backdrop-blur-xl border border-primary/30 shadow-xl space-y-3 relative overflow-hidden group hover:border-primary transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <Badge className="bg-primary/20 text-primary border-primary/40 text-[10px] font-black uppercase">
                        Phase {phase.order || idx + 1}
                      </Badge>
                      <span className="text-[10px] font-mono text-muted-foreground uppercase">
                        {phase.phaseType}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-black text-lg text-foreground italic">{phase.name}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {phase.description || "Phase officielle de qualification et de sélection."}
                      </p>
                    </div>
                    <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs font-bold text-muted-foreground">
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

          {/* ÉTAPE 3 : PARTICIPANTS ET ROSTERS QUALIFIÉS */}
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
                <span className="text-xs font-black uppercase tracking-[0.25em] text-cyan-400">
                  Étape 2 sur 3
                </span>
                <h2 className="text-2xl md:text-4xl font-black italic uppercase tracking-tight">
                  Rosters & Compétiteurs Révélés
                </h2>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Les joueurs et équipes engagés pour le titre
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[380px] overflow-y-auto no-scrollbar p-1">
                {registrations.slice(0, 16).map((reg, idx) => {
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
                      transition={{ delay: idx * 0.05 }}
                      className="p-3 rounded-xl bg-card/60 backdrop-blur-md border border-white/10 flex items-center gap-3 shadow-lg"
                    >
                      <Avatar className="w-9 h-9 border border-white/15">
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

          {/* ÉTAPE 4 : ARBRE & MATCHUPS */}
          {currentStage === "brackets" && (
            <motion.div
              key="stage-brackets"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-4xl mx-auto space-y-6 text-center"
            >
              <div className="space-y-1">
                <span className="text-xs font-black uppercase tracking-[0.25em] text-amber-400">
                  Étape 3 sur 3
                </span>
                <h2 className="text-2xl md:text-4xl font-black italic uppercase tracking-tight">
                  Arbre des Play-offs Déverrouillé
                </h2>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Le schéma de confrontations officielles est prêt
                </p>
              </div>

              <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-card/80 to-background border border-cyan-500/30 shadow-[0_0_40px_rgba(6,182,212,0.15)] flex flex-col items-center justify-center gap-4">
                <div className="relative">
                  <div className="p-4 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 animate-pulse">
                    <GitBranch className="w-12 h-12 rotate-90" />
                  </div>
                </div>
                <h3 className="text-xl md:text-2xl font-black italic uppercase tracking-wider">
                  The Playoffs World Championship
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground max-w-md">
                  Toutes les confrontations, horaires et arbres de progression sont configurés et synchronisés en temps réel.
                </p>
              </div>
            </motion.div>
          )}

          {/* ÉTAPE FINALE : CONCLUSION & REDIRECTION */}
          {currentStage === "conclusion" && (
            <motion.div
              key="stage-conclusion"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="text-center max-w-xl mx-auto space-y-6"
            >
              <div className="p-4 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 inline-block shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                <CheckCircle2 className="w-16 h-16" />
              </div>

              <div className="space-y-2">
                <h2 className="text-3xl md:text-5xl font-black italic uppercase tracking-tight">
                  Prêt pour l&apos;Arène !
                </h2>
                <p className="text-sm md:text-base text-muted-foreground">
                  La structure de {edition.name || `l'Édition #${edition.editionNumber}`} est active.
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

      {/* ── FOOTER DE STATUT ── */}
      <footer className="relative z-30 container mx-auto px-4 md:px-8 py-4 flex items-center justify-between text-xs text-muted-foreground font-mono border-t border-white/5">
        <span>GAMES-TRAFICS ESPORTS PLATFORM</span>
        <span>
          ÉTAPE {currentStageIndex + 1} / {availableStages.length}
        </span>
      </footer>
    </div>
  );
}
