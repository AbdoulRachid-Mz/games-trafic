"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import {
  Trophy,
  Swords,
  GitBranch,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Calendar,
  Clock,
  Sparkles,
  Shield,
  Layers,
  ChevronRight,
  Eye,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import {
  PlayoffMatchNode,
  SymmetricalPlayoffTree,
  buildSymmetricalPlayoffTree,
  PLAYOFF_THEMES,
} from "@/lib/tournaments/playoffs-engine";

interface PlayoffBracketVisualProps {
  matches?: any[];
  nodes?: any[];
  tournamentName?: string;
  editionName?: string;
  game?: string;
  tournamentId?: string;
  editionId?: string;
  className?: string;
  onMatchClick?: (matchId: string) => void;
}

export function PlayoffBracketVisual({
  matches = [],
  nodes = [],
  tournamentName = "GAMES-TRAFICS ESPORTS",
  editionName = "CHAMPIONSHIP PLAYOFFS",
  game,
  tournamentId,
  editionId,
  className,
  onMatchClick,
}: PlayoffBracketVisualProps) {
  const router = useRouter();

  // Mode de rendu : "symmetrical" (The Playoffs) | "horizontal" (Flow Esports) | "cards"
  const [viewMode, setViewMode] = useState<"symmetrical" | "horizontal" | "cards">("symmetrical");
  const [selectedThemeId, setSelectedThemeId] = useState<string>("classic-championship");
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  const tree: SymmetricalPlayoffTree = useMemo(() => {
    return buildSymmetricalPlayoffTree(matches, nodes);
  }, [matches, nodes]);

  const selectedTheme = useMemo(() => {
    return (
      PLAYOFF_THEMES.find((t) => t.id === selectedThemeId) || PLAYOFF_THEMES[0]
    );
  }, [selectedThemeId]);

  const handleMatchSelect = (match: PlayoffMatchNode) => {
    if (onMatchClick) {
      onMatchClick(match.id);
    } else if (tournamentId && editionId && !match.id.startsWith("mock-") && !match.id.startsWith("R16-") && !match.id.startsWith("QF-") && !match.id.startsWith("SF-")) {
      router.push(`/tournaments/${tournamentId}/editions/${editionId}/matches/${match.id}`);
    }
  };

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(150, prev + 15));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(70, prev - 15));
  const handleZoomReset = () => setZoomLevel(100);

  return (
    <div
      className={cn(
        "relative w-full rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-[#08080f] select-none",
        className
      )}
    >
      {/* ─── FOND D'ARÈNE ET PARTICULES ─────────────────────────────────── */}
      <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
        {selectedTheme.bgImage ? (
          <Image
            src={selectedTheme.bgImage}
            alt="Playoffs Arena Background"
            fill
            sizes="100vw"
            className="object-cover object-center opacity-25 filter blur-[0.5px] scale-105 transition-opacity duration-700"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-[#0a0518] via-[#050714] to-[#04020a]" />
        )}
        {/* Grille hexagonale et radial glows */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.15) 0%, transparent 70%),
              linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)`,
            backgroundSize: "100% 100%, 36px 36px, 36px 36px",
          }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-amber-500/10 rounded-full blur-[140px]" />
      </div>

      {/* ─── TOOLBAR SUPÉRIEURE : MODES ET CONTRÔLES ────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 md:px-6 border-b border-white/10 bg-background/60 backdrop-blur-xl relative z-20">
        <div className="flex items-center gap-2">
          <Badge className="bg-primary/20 text-primary border-primary/40 uppercase tracking-widest text-[10px] font-black px-2.5 py-1">
            <Swords className="w-3 h-3 mr-1" />
            Playoffs Officiels
          </Badge>
          {game && (
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider hidden sm:inline-block">
              {game}
            </span>
          )}
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1.5 p-1 bg-black/40 rounded-xl border border-white/10 text-xs font-bold">
          <button
            onClick={() => setViewMode("symmetrical")}
            className={cn(
              "px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5",
              viewMode === "symmetrical"
                ? "bg-gradient-to-r from-primary to-violet-600 text-white shadow-[0_0_15px_rgba(var(--primary),0.5)] font-black"
                : "text-muted-foreground hover:text-white"
            )}
          >
            <GitBranch className="w-3.5 h-3.5 rotate-90" />
            <span className="hidden sm:inline">Symétrique</span>
          </button>
          <button
            onClick={() => setViewMode("horizontal")}
            className={cn(
              "px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5",
              viewMode === "horizontal"
                ? "bg-gradient-to-r from-primary to-violet-600 text-white shadow-[0_0_15px_rgba(var(--primary),0.5)] font-black"
                : "text-muted-foreground hover:text-white"
            )}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Arbre Linéaire</span>
          </button>
          <button
            onClick={() => setViewMode("cards")}
            className={cn(
              "px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5",
              viewMode === "cards"
                ? "bg-gradient-to-r from-primary to-violet-600 text-white shadow-[0_0_15px_rgba(var(--primary),0.5)] font-black"
                : "text-muted-foreground hover:text-white"
            )}
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cartes</span>
          </button>
        </div>

        {/* Thèmes et Zoom */}
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center bg-black/40 rounded-xl border border-white/10 p-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-white"
              onClick={handleZoomOut}
              title="Zoom arrière"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </Button>
            <span className="text-[11px] font-mono px-2 text-muted-foreground min-w-[42px] text-center">
              {zoomLevel}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-white"
              onClick={handleZoomIn}
              title="Zoom avant"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </Button>
            {zoomLevel !== 100 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-white"
                onClick={handleZoomReset}
                title="Réinitialiser zoom"
              >
                <RotateCcw className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ─── CONTENEUR D'AFFICHAGE DU BRACKET AVEC ZOOM ─────────────────── */}
      <div className="overflow-x-auto overflow-y-hidden p-6 md:p-8 min-h-[580px] flex items-center justify-center">
        <div
          className="transition-transform duration-200 ease-out origin-center min-w-max"
          style={{ transform: `scale(${zoomLevel / 100})` }}
        >
          {viewMode === "symmetrical" && (
            <SymmetricalChampionshipBracket
              tree={tree}
              tournamentName={tournamentName}
              editionName={editionName}
              onMatchClick={handleMatchSelect}
            />
          )}

          {viewMode === "horizontal" && (
            <HorizontalFlowBracket
              tree={tree}
              tournamentName={tournamentName}
              onMatchClick={handleMatchSelect}
            />
          )}

          {viewMode === "cards" && (
            <CardsBracketView
              matches={tree.allMatches}
              onMatchClick={handleMatchSelect}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// COMPOSANT 1 : ARBRE SYMÉTRIQUE DU CHAMPIONNAT ("THE PLAYOFFS")
// Conforme au modèle de référence visuel avec les barres biseautées Cyan & Orange
// ============================================================================

interface SymmetricalChampionshipBracketProps {
  tree: SymmetricalPlayoffTree;
  tournamentName: string;
  editionName: string;
  onMatchClick: (match: PlayoffMatchNode) => void;
}

function SymmetricalChampionshipBracket({
  tree,
  tournamentName,
  editionName,
  onMatchClick,
}: SymmetricalChampionshipBracketProps) {
  const leftRounds = tree.leftWing.rounds;
  const rightRounds = tree.rightWing.rounds;
  const finalMatch = tree.center.finalMatch;

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      {/* ── BANNIÈRE EN-TÊTE BISEAUTÉE OFFICIELLE "THE PLAYOFFS" ── */}
      <div className="relative flex flex-col items-center">
        <div className="relative px-12 py-3 bg-gradient-to-r from-transparent via-[#1a1230] to-transparent border-t border-b border-primary/40 flex flex-col items-center justify-center">
          <span className="text-[11px] font-black uppercase tracking-[0.3em] text-cyan-400">
            THE
          </span>
          <h2 className="text-3xl md:text-5xl font-black italic tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-white drop-shadow-[0_0_25px_rgba(6,182,212,0.6)] uppercase">
            PLAYOFFS
          </h2>
          <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent mt-1" />
        </div>
      </div>

      {/* ── ARÈNE CENTRALE : AILE GAUCHE | CENTRE FINALE | AILE DROITE ── */}
      <div className="flex items-center justify-center gap-6 md:gap-10">
        {/* AILE GAUCHE (CONVERGE VERS LA DROITE) */}
        <div className="flex items-center gap-6">
          {leftRounds.map((round, rIdx) => (
            <div key={`left-r-${round.roundIndex}`} className="flex flex-col gap-6">
              <div className="text-center pb-2 border-b border-cyan-500/20">
                <span className="text-[11px] font-black uppercase tracking-wider text-cyan-400">
                  {round.roundName}
                </span>
              </div>
              <div
                className="flex flex-col justify-around gap-6"
                style={{ height: `${Math.max(1, round.matches.length) * 110}px` }}
              >
                {round.matches.map((m) => (
                  <PlayoffCapsuleCard
                    key={m.id}
                    match={m}
                    colorScheme="cyan"
                    onClick={() => onMatchClick(m)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* CENTRE : TROPHÉE & GRANDE FINALE */}
        <div className="flex flex-col items-center justify-center px-4 md:px-8 py-6 rounded-3xl bg-gradient-to-b from-amber-500/10 via-background/80 to-transparent border border-amber-500/30 shadow-[0_0_50px_rgba(245,158,11,0.2)]">
          {/* Trophée Brillant */}
          <div className="relative mb-3 group flex flex-col items-center">
            <div className="absolute inset-0 bg-amber-400/20 rounded-full blur-xl group-hover:blur-2xl transition-all" />
            <div className="relative p-3.5 rounded-2xl bg-gradient-to-b from-amber-400/30 to-amber-600/10 border border-amber-400/40 text-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.4)]">
              <Trophy className="w-8 h-8 md:w-10 md:h-10 animate-pulse text-amber-400" />
            </div>
            <span className="mt-2 text-xs font-black uppercase tracking-[0.25em] text-amber-300">
              FINAL
            </span>
          </div>

          {/* Carte du Match de Grande Finale */}
          {finalMatch ? (
            <div className="w-56 md:w-64 flex flex-col gap-2">
              <FinalCapsule
                name={finalMatch.participant1.name}
                score={finalMatch.participant1.score}
                isWinner={finalMatch.participant1.isWinner}
                colorScheme="orange"
                onClick={() => onMatchClick(finalMatch)}
              />
              <div className="flex items-center justify-center gap-2 py-0.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  VS
                </span>
                {finalMatch.status === "COMPLETED" && (
                  <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[9px] font-black uppercase">
                    Champion Couronné
                  </Badge>
                )}
              </div>
              <FinalCapsule
                name={finalMatch.participant2.name}
                score={finalMatch.participant2.score}
                isWinner={finalMatch.participant2.isWinner}
                colorScheme="cyan"
                onClick={() => onMatchClick(finalMatch)}
              />
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-dashed border-amber-500/30 text-center text-xs text-muted-foreground font-bold">
              En attente des finalistes
            </div>
          )}
        </div>

        {/* AILE DROITE (CONVERGE VERS LA GAUCHE) */}
        <div className="flex items-center gap-6">
          {[...rightRounds].reverse().map((round) => (
            <div key={`right-r-${round.roundIndex}`} className="flex flex-col gap-6">
              <div className="text-center pb-2 border-b border-orange-500/20">
                <span className="text-[11px] font-black uppercase tracking-wider text-orange-400">
                  {round.roundName}
                </span>
              </div>
              <div
                className="flex flex-col justify-around gap-6"
                style={{ height: `${Math.max(1, round.matches.length) * 110}px` }}
              >
                {round.matches.map((m) => (
                  <PlayoffCapsuleCard
                    key={m.id}
                    match={m}
                    colorScheme="orange"
                    onClick={() => onMatchClick(m)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── BAS DE PAGE : "WORLD CHAMPIONSHIP" ── */}
      <div className="text-center pt-2">
        <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-white/20 to-transparent mx-auto mb-2" />
        <h4 className="text-xs md:text-sm font-black uppercase tracking-[0.35em] text-muted-foreground">
          {tournamentName} — {editionName}
        </h4>
      </div>
    </div>
  );
}

// ============================================================================
// CAPSULE DE MATCH STYLE GAMING (Conforme aux badges 3D biseautés de l'image)
// ============================================================================

interface PlayoffCapsuleCardProps {
  match: PlayoffMatchNode;
  colorScheme: "cyan" | "orange";
  onClick: () => void;
}

function PlayoffCapsuleCard({ match, colorScheme, onClick }: PlayoffCapsuleCardProps) {
  const isCyan = colorScheme === "cyan";

  const p1 = match.participant1;
  const p2 = match.participant2;

  return (
    <div
      onClick={onClick}
      className={cn(
        "group cursor-pointer rounded-2xl p-2.5 transition-all duration-300 hover:scale-105 shadow-xl border w-44 md:w-52 flex flex-col gap-1.5",
        isCyan
          ? "bg-[#0b1426]/90 border-cyan-500/30 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)]"
          : "bg-[#1f100a]/90 border-orange-500/30 hover:border-orange-400 hover:shadow-[0_0_20px_rgba(249,115,22,0.4)]"
      )}
    >
      {/* Barre Joueur 1 */}
      <div
        className={cn(
          "px-3 py-1.5 rounded-lg flex items-center justify-between transition-all",
          isCyan
            ? "bg-gradient-to-r from-cyan-600 via-blue-600 to-blue-700 text-white shadow-[0_2px_8px_rgba(6,182,212,0.4)] border-t border-cyan-300/40"
            : "bg-gradient-to-r from-orange-600 via-red-600 to-amber-600 text-white shadow-[0_2px_8px_rgba(249,115,22,0.4)] border-t border-orange-300/40",
          p1.isWinner && "ring-2 ring-yellow-400 ring-offset-1 ring-offset-black"
        )}
      >
        <span className="font-black text-xs uppercase tracking-wider truncate max-w-[120px]">
          {p1.name}
        </span>
        {p1.score !== null && p1.score !== undefined && (
          <span className="font-mono font-black text-xs px-1.5 py-0.5 rounded bg-black/40 text-white">
            {p1.score}
          </span>
        )}
      </div>

      {/* Barre Joueur 2 */}
      <div
        className={cn(
          "px-3 py-1.5 rounded-lg flex items-center justify-between transition-all",
          isCyan
            ? "bg-gradient-to-r from-cyan-600 via-blue-600 to-blue-700 text-white shadow-[0_2px_8px_rgba(6,182,212,0.4)] border-t border-cyan-300/40"
            : "bg-gradient-to-r from-orange-600 via-red-600 to-amber-600 text-white shadow-[0_2px_8px_rgba(249,115,22,0.4)] border-t border-orange-300/40",
          p2.isWinner && "ring-2 ring-yellow-400 ring-offset-1 ring-offset-black"
        )}
      >
        <span className="font-black text-xs uppercase tracking-wider truncate max-w-[120px]">
          {p2.name}
        </span>
        {p2.score !== null && p2.score !== undefined && (
          <span className="font-mono font-black text-xs px-1.5 py-0.5 rounded bg-black/40 text-white">
            {p2.score}
          </span>
        )}
      </div>
    </div>
  );
}

function FinalCapsule({
  name,
  score,
  isWinner,
  colorScheme,
  onClick,
}: {
  name: string;
  score?: number | null;
  isWinner?: boolean;
  colorScheme: "cyan" | "orange";
  onClick: () => void;
}) {
  const isCyan = colorScheme === "cyan";

  return (
    <div
      onClick={onClick}
      className={cn(
        "cursor-pointer px-4 py-2.5 rounded-xl flex items-center justify-between transition-all duration-300 hover:scale-105 shadow-2xl",
        isCyan
          ? "bg-gradient-to-r from-cyan-600 via-blue-600 to-blue-800 text-white border-t border-cyan-300/50 shadow-[0_0_20px_rgba(6,182,212,0.4)]"
          : "bg-gradient-to-r from-orange-600 via-red-600 to-amber-700 text-white border-t border-orange-300/50 shadow-[0_0_20px_rgba(249,115,22,0.4)]",
        isWinner && "ring-2 ring-amber-300 ring-offset-2 ring-offset-black"
      )}
    >
      <span className="font-black text-sm uppercase tracking-wider truncate max-w-[150px]">
        {name}
      </span>
      {score !== null && score !== undefined && (
        <span className="font-mono font-black text-sm px-2 py-0.5 rounded bg-black/50 text-white">
          {score}
        </span>
      )}
    </div>
  );
}

// ============================================================================
// COMPOSANT 2 : ARBRE HORIZONTAL ESPORTS / LIQUIPEDIA
// ============================================================================

function HorizontalFlowBracket({
  tree,
  tournamentName,
  onMatchClick,
}: {
  tree: SymmetricalPlayoffTree;
  tournamentName: string;
  onMatchClick: (match: PlayoffMatchNode) => void;
}) {
  // Reconstituer les rounds linéaires
  const roundsMap: Record<number, PlayoffMatchNode[]> = {};
  tree.allMatches.forEach((m) => {
    if (!roundsMap[m.round]) roundsMap[m.round] = [];
    roundsMap[m.round].push(m);
  });

  const rounds = Object.keys(roundsMap)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="flex gap-8 items-start py-4">
      {rounds.map((roundNumber, idx) => {
        const roundMatches = roundsMap[roundNumber];
        const isFinal = idx === rounds.length - 1;

        return (
          <div key={roundNumber} className="w-64 flex flex-col gap-4">
            <div
              className={cn(
                "p-3 rounded-xl border flex items-center justify-between",
                isFinal
                  ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                  : "bg-card/70 border-white/10 text-foreground"
              )}
            >
              <div className="flex items-center gap-2">
                {isFinal ? (
                  <Trophy className="w-4 h-4 text-amber-400" />
                ) : (
                  <Swords className="w-4 h-4 text-primary" />
                )}
                <span className="font-black text-xs uppercase tracking-wider">
                  {roundMatches[0]?.roundName || `Tour ${roundNumber}`}
                </span>
              </div>
              <Badge variant="outline" className="text-[10px] font-bold">
                {roundMatches.length}
              </Badge>
            </div>

            <div className="flex flex-col justify-around gap-6">
              {roundMatches.map((m) => (
                <div
                  key={m.id}
                  onClick={() => onMatchClick(m)}
                  className="cursor-pointer bg-card/80 backdrop-blur-md border border-white/10 hover:border-primary/50 rounded-xl p-3 shadow-lg hover:scale-102 transition-all space-y-2"
                >
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pb-1 border-b border-white/5">
                    <span className="font-bold">{m.code || `Match ${m.matchNumber}`}</span>
                    <span className="text-[10px]">{m.status}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs truncate max-w-[140px]">
                      {m.participant1.name}
                    </span>
                    <span className="font-mono text-xs font-black">
                      {m.participant1.score ?? "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs truncate max-w-[140px]">
                      {m.participant2.name}
                    </span>
                    <span className="font-mono text-xs font-black">
                      {m.participant2.score ?? "-"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// COMPOSANT 3 : VUE CARTES / GRILLE
// ============================================================================

function CardsBracketView({
  matches,
  onMatchClick,
}: {
  matches: PlayoffMatchNode[];
  onMatchClick: (match: PlayoffMatchNode) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-6xl">
      {matches.map((m) => (
        <div
          key={m.id}
          onClick={() => onMatchClick(m)}
          className="cursor-pointer bg-card/90 border border-white/10 hover:border-primary/50 rounded-2xl p-4 shadow-xl hover:scale-102 transition-all space-y-3"
        >
          <div className="flex items-center justify-between">
            <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] font-black uppercase">
              {m.roundName}
            </Badge>
            <span className="text-[10px] font-mono text-muted-foreground">{m.code}</span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between p-2 rounded-lg bg-background/50 border border-white/5">
              <span className="text-xs font-black truncate">{m.participant1.name}</span>
              <span className="font-mono font-black text-xs text-primary">
                {m.participant1.score ?? "-"}
              </span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-background/50 border border-white/5">
              <span className="text-xs font-black truncate">{m.participant2.name}</span>
              <span className="font-mono font-black text-xs text-primary">
                {m.participant2.score ?? "-"}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
