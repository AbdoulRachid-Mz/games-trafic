// @/components/game-clips/game-clip-reel.tsx
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Loader2, Volume2, VolumeX } from "lucide-react";
import { GameClipPlayer } from "./game-clip-player";
import { cn } from "@/lib/utils";
import { GameClipWithRelations } from "@/types/game-clips";
import { Typography } from "../ui/typography";

interface GameClipReelProps {
  initialClipId?: string;
  clips: GameClipWithRelations[];
  loading?: boolean;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onFetchNextPage?: () => void;
  onClipChange?: (clipId: string) => void;
  onCommentsToggle?: () => void;
  className?: string;
}

export function GameClipReel({
  initialClipId,
  clips = [],
  loading = false,
  hasNextPage = false,
  isFetchingNextPage = false,
  onFetchNextPage,
  onClipChange,
  onCommentsToggle,
  className,
}: GameClipReelProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const wheelTimeout = useRef<NodeJS.Timeout | undefined>(undefined);
  const isInitialized = useRef(false);

  // Initialisation unique sans dépendance circulaire
  useEffect(() => {
    if (!isInitialized.current && clips.length > 0) {
      if (initialClipId) {
        const index = clips.findIndex((c) => c.id === initialClipId);
        if (index !== -1) {
          setActiveIndex(index);
          onClipChange?.(clips[index].id);
        }
      }
      isInitialized.current = true;
    }
  }, [clips, initialClipId, onClipChange]);

  // Notifier du changement de clip sans créer de boucle
  const handleClipChange = useCallback((index: number) => {
    if (clips[index]) {
      onClipChange?.(clips[index].id);
    }
  }, [clips, onClipChange]);

  const goToNext = useCallback(() => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setTimeout(() => setIsTransitioning(false), 500);

    if (activeIndex < clips.length - 1) {
      const newIndex = activeIndex + 1;
      setActiveIndex(newIndex);
      handleClipChange(newIndex);
    } else if (hasNextPage && onFetchNextPage && !isFetchingNextPage) {
      onFetchNextPage();
    }
  }, [activeIndex, clips.length, hasNextPage, onFetchNextPage, isFetchingNextPage, isTransitioning, handleClipChange]);

  const goToPrev = useCallback(() => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setTimeout(() => setIsTransitioning(false), 500);

    if (activeIndex > 0) {
      const newIndex = activeIndex - 1;
      setActiveIndex(newIndex);
      handleClipChange(newIndex);
    }
  }, [activeIndex, isTransitioning, handleClipChange]);

  // Wheel navigation with throttling
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    
    if (isTransitioning) return;

    clearTimeout(wheelTimeout.current);
    wheelTimeout.current = setTimeout(() => {
      if (Math.abs(e.deltaY) < 10) return;

      if (e.deltaY > 0) {
        goToNext();
      } else {
        goToPrev();
      }
    }, 100);
  }, [goToNext, goToPrev, isTransitioning]);

  // Touch navigation
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.targetTouches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY;
    const deltaY = touchStartY.current - touchEndY;

    if (Math.abs(deltaY) > 50 && !isTransitioning) {
      if (deltaY > 0) {
        goToNext();
      } else {
        goToPrev();
      }
    }
  }, [goToNext, goToPrev, isTransitioning]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
  }, [goToNext, goToPrev]);

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
        className="absolute top-6 right-6 z-50 bg-black/40 backdrop-blur-md rounded-full p-3 text-white hover:bg-black/60 transition-all border border-white/10 md:top-20"
      >
        {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
      </button>

      {/* Clips Container */}
      <div
        className="h-full w-full transition-transform duration-500 ease-out will-change-transform"
        style={{ transform: `translateY(-${activeIndex * 100}%)` }}
      >
        {clips.map((clip, index) => (
          <div key={clip.id} className="h-full w-full shrink-0 snap-start snap-always">
            <GameClipPlayer
              clip={clip}
              isActive={index === activeIndex}
              isMuted={isMuted}
              onMuteToggle={() => setIsMuted(!isMuted)}
              onAutoNext={goToNext}
              onAutoPrev={goToPrev}
              onCommentsToggle={onCommentsToggle}
              hasMore={hasNextPage}
            />
          </div>
        ))}

        {/* Loading State */}
        {hasNextPage && (
          <div className="h-full w-full shrink-0 flex items-center justify-center bg-black">
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
      {!loading && clips.length === 0 && (
        <div className="h-full w-full flex flex-col items-center justify-center text-white p-6 text-center bg-[#0a0a0b]">
          <div className="mb-6 p-8 rounded-3xl bg-white/5 border border-white/10">
            <div className="text-6xl mb-4">🎮</div>
          </div>
          <Typography variant="h3" className="text-2xl font-bold mb-3 tracking-tight">
            Aucun clip à l'horizon
          </Typography>
          <Typography variant="body-base" className="text-white/50 max-w-sm mb-8">
            Sois le premier à partager ton meilleur moment de jeu !
          </Typography>
          <button
            onClick={() => window.location.href = '/game-clips?create=true'}
            className="bg-primary text-primary-foreground px-8 py-3 rounded-full font-bold hover:scale-105 transition-transform shadow-lg shadow-primary/20"
          >
            Créer un Clip
          </button>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && clips.length === 0 && (
        <div className="absolute inset-0 z-[60] bg-black flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      )}
    </div>
  );
}