// @/components/game-clips/game-clip-reel.tsx
"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Loader2, Volume2, VolumeX, Plus } from "lucide-react";
import { GameClipPlayer } from "./game-clip-player";
import { cn } from "@/lib/utils";
import { GameClipCard } from "@/types/view-models";
import { Typography } from "../ui/typography";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface GameClipReelProps {
  initialClipId?: string;
  clips: GameClipCard[];
  loading?: boolean;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onFetchNextPage?: () => void;
  onClipChange?: (clipId: string) => void;
  onCommentsToggle?: () => void;
  areCommentsOpen?: boolean;
  className?: string;
}

export function GameClipReel({
  initialClipId,
  clips: originalClips,
  loading = false,
  hasNextPage = false,
  isFetchingNextPage = false,
  onFetchNextPage,
  onClipChange,
  onCommentsToggle,
  areCommentsOpen = false,
  className,
}: GameClipReelProps) {
  const router = useRouter();
  const [orderedClips, setOrderedClips] = useState<GameClipCard[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const touchStartX = useRef(0);
  const wheelTimeout = useRef<NodeJS.Timeout | undefined>(undefined);
  const isInitialized = useRef(false);

  // Pause globale
  const globalPaused = areCommentsOpen || isTransitioning;

  // Fonction de shuffle
  const shuffleArray = useCallback((array: GameClipCard[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, []);

  // Initialiser l'ordre des clips
  useEffect(() => {
    if (originalClips.length > 0) {
      setOrderedClips(originalClips);
    }
  }, [originalClips]);

  // Initialisation de l'index actif
  useEffect(() => {
    if (!isInitialized.current && orderedClips.length > 0) {
      if (initialClipId) {
        const index = orderedClips.findIndex((c) => c.id === initialClipId);
        if (index !== -1) {
          setActiveIndex(index);
          onClipChange?.(orderedClips[index].id);
        } else {
          setActiveIndex(0);
          onClipChange?.(orderedClips[0].id);
        }
      } else {
        setActiveIndex(0);
        onClipChange?.(orderedClips[0].id);
      }
      isInitialized.current = true;
    }
  }, [orderedClips, initialClipId, onClipChange]);

  // Reset quand on change de clip
  useEffect(() => {
    if (!globalPaused) {
      // Le player gère le reset
    }
  }, [activeIndex, globalPaused]);

  const handleClipChange = useCallback((index: number) => {
    if (orderedClips[index]) {
      onClipChange?.(orderedClips[index].id);
    }
  }, [orderedClips, onClipChange]);

  const goToNext = useCallback(() => {
    if (isTransitioning || orderedClips.length === 0) return;

    setIsTransitioning(true);
    setTimeout(() => setIsTransitioning(false), 500);

    if (activeIndex < orderedClips.length - 1) {
      // Clip suivant normal
      const newIndex = activeIndex + 1;
      setActiveIndex(newIndex);
      handleClipChange(newIndex);
    } else if (hasNextPage && onFetchNextPage && !isFetchingNextPage) {
      // Charger plus de clips
      onFetchNextPage();
    } else {
      // Dernier clip atteint : shuffle et recommencer
      const shuffled = shuffleArray(orderedClips);
      setOrderedClips(shuffled);
      setActiveIndex(0);
      handleClipChange(0);
    }
  }, [
    activeIndex,
    orderedClips,
    hasNextPage,
    onFetchNextPage,
    isFetchingNextPage,
    isTransitioning,
    shuffleArray,
    handleClipChange
  ]);

  const goToPrev = useCallback(() => {
    if (isTransitioning || orderedClips.length === 0) return;

    setIsTransitioning(true);
    setTimeout(() => setIsTransitioning(false), 500);

    if (activeIndex > 0) {
      const newIndex = activeIndex - 1;
      setActiveIndex(newIndex);
      handleClipChange(newIndex);
    } else {
      // Au début, on va à la fin (avec shuffle optionnel)
      const newIndex = orderedClips.length - 1;
      setActiveIndex(newIndex);
      handleClipChange(newIndex);
    }
  }, [activeIndex, orderedClips.length, isTransitioning, handleClipChange]);

  // Wheel navigation
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();

    if (isTransitioning || globalPaused) return;

    clearTimeout(wheelTimeout.current);
    wheelTimeout.current = setTimeout(() => {
      if (Math.abs(e.deltaY) < 10) return;

      if (e.deltaY > 0) {
        goToNext();
      } else {
        goToPrev();
      }
    }, 100);
  }, [goToNext, goToPrev, isTransitioning, globalPaused]);

  // Touch navigation
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.targetTouches[0].clientY;
    touchStartX.current = e.targetTouches[0].clientX;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY;
    const touchEndX = e.changedTouches[0].clientX;
    const deltaY = touchStartY.current - touchEndY;
    const deltaX = touchStartX.current - touchEndX;

    if (isTransitioning || globalPaused) return;

    // Navigation verticale (clips)
    if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 50) {
      if (deltaY > 0) {
        goToNext();
      } else {
        goToPrev();
      }
    }
    // Navigation horizontale (gérée par le player)
  }, [goToNext, goToPrev, isTransitioning, globalPaused]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (globalPaused) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        goToNext();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        goToPrev();
      } else if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        setIsMuted((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToNext, goToPrev, globalPaused]);

  const currentClip = orderedClips[activeIndex];

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative h-screen w-full overflow-hidden bg-black touch-pan-y",
        className
      )}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Global Mute Toggle */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsMuted(!isMuted);
        }}
        className="absolute top-6 right-6 z-50 bg-black/60 backdrop-blur-xl rounded-full p-4 text-white hover:bg-black/80 transition-all border border-white/20 md:top-20 shadow-2xl hover:scale-105"
      >
        {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
      </button>

      {/* Create Clip Button */}
      {/* <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: "spring" }}
        onClick={() => router.push("/game-clips?create=true")}
        className="fixed bottom-8 right-8 z-50 bg-primary rounded-full p-4 shadow-2xl hover:scale-110 transition-all border-2 border-white/20"
      >
        <Plus className="h-6 w-6 text-white" />
      </motion.button> */}

      {/* Clips Container */}
      <div
        className="h-full w-full transition-transform duration-300 ease-out will-change-transform"
        style={{ transform: `translateY(-${activeIndex * 100}%)` }}
      >
        {orderedClips.map((clip, index) => (
          <div key={clip.id} className="h-full w-full shrink-0 snap-start snap-always">
            <GameClipPlayer
              clip={clip}
              isActive={index === activeIndex}
              isMuted={isMuted}
              onMuteToggle={() => setIsMuted(!isMuted)}
              onAutoNext={goToNext}
              onAutoPrev={goToPrev}
              onCommentsToggle={onCommentsToggle}
              isPaused={globalPaused}
              hasMore={hasNextPage}
            />
          </div>
        ))}

        {/* Loading State */}
        {hasNextPage && (
          <div className="h-full w-full shrink-0 flex items-center justify-center bg-black/95 backdrop-blur-xl">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <Typography variant="body-sm" className="text-white/50 font-medium">
                Chargement du clip suivant...
              </Typography>
            </div>
          </div>
        )}
      </div>

      {/* Empty State */}
      {!loading && orderedClips.length === 0 && (
        <div className="h-full w-full flex flex-col items-center justify-center text-white p-6 text-center bg-gradient-to-b from-black/95 to-black/80">
          <div className="mb-6 p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl">
            <div className="text-6xl mb-4 animate-pulse">🎮</div>
          </div>
          <Typography variant="h3" className="text-2xl font-bold mb-3 tracking-tight">
            Aucun clip à l'horizon
          </Typography>
          <Typography variant="body-base" className="text-white/50 max-w-sm mb-8">
            Sois le premier à partager ton meilleur moment de jeu !
          </Typography>
          <button
            onClick={() => router.push('/game-clips?create=true')}
            className="bg-primary text-primary-foreground px-8 py-3 rounded-full font-bold hover:scale-105 transition-transform shadow-lg shadow-primary/20"
          >
            Créer un Clip
          </button>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && orderedClips.length === 0 && (
        <div className="absolute inset-0 z-[60] bg-black/95 backdrop-blur-xl flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      )}
    </div>
  );
}