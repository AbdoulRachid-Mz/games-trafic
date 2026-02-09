// @/components/game-clips/game-clip-reel.tsx - version améliorée avec défilement infini et préchargement
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
  className?: string;
}

export function GameClipReel({
  initialClipId,
  clips = [],
  loading = false,
  hasNextPage = false,
  isFetchingNextPage = false,
  onFetchNextPage,
  className,
}: GameClipReelProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Initial scroll to starting clip if provided
  useEffect(() => {
    if (initialClipId && clips.length > 0) {
      const index = clips.findIndex((c) => c.id === initialClipId);
      if (index !== -1) {
        setActiveIndex(index);
      }
    }
  }, [initialClipId, clips.length]);

  // Handle keyboard navigation
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
  }, [activeIndex, clips.length, isMuted]);

  const goToNext = useCallback(() => {
    if (activeIndex < clips.length - 1) {
      setActiveIndex((prev) => prev + 1);
    } else if (hasNextPage && onFetchNextPage && !isFetchingNextPage) {
      onFetchNextPage();
    }
  }, [activeIndex, clips.length, hasNextPage, onFetchNextPage, isFetchingNextPage]);

  const goToPrev = useCallback(() => {
    if (activeIndex > 0) {
      setActiveIndex((prev) => prev - 1);
    }
  }, [activeIndex]);

  // Handle wheel scroll with throttling
  const lastScrollTime = useRef(0);
  const handleScroll = useCallback((e: React.WheelEvent) => {
    const now = Date.now();
    if (now - lastScrollTime.current < 800) return; // Throttle 800ms

    if (Math.abs(e.deltaY) < 10) return; // Ignore small movements

    if (e.deltaY > 0) {
      goToNext();
    } else {
      goToPrev();
    }
    lastScrollTime.current = now;
  }, [goToNext, goToPrev]);

  // Handle touch swipe
  const touchStartY = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.targetTouches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY;
    const deltaY = touchStartY.current - touchEndY;

    if (Math.abs(deltaY) > 50) {
      if (deltaY > 0) {
        goToNext();
      } else {
        goToPrev();
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative h-screen w-screen md:w-full overflow-hidden bg-black selection:bg-transparent",
        className
      )}
      onWheel={handleScroll}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Mute Toggle Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsMuted(!isMuted);
        }}
        className="absolute top-6 right-6 z-50 bg-black/40 backdrop-blur-md rounded-full p-3 text-white hover:bg-black/60 transition-all border border-white/10"
      >
        {isMuted ? (
          <VolumeX className="h-5 w-5" />
        ) : (
          <Volume2 className="h-5 w-5" />
        )}
      </button>

      {/* Progress Multi-Lines (Instagram style) */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 flex gap-1.5 w-full max-w-lg px-6">
        {clips.map((_, index) => (
          <div
            key={index}
            className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden"
          >
            <div
              className={cn(
                "h-full bg-white transition-all duration-300",
                index === activeIndex ? "w-full" : index < activeIndex ? "w-full opacity-100" : "w-0"
              )}
            />
          </div>
        ))}
      </div>

      {/* Clip Content Layer */}
      {clips.length > 0 ? (
        <div
          className="h-full w-full transition-transform duration-500 ease-out flex flex-col"
          style={{ transform: `translateY(-${activeIndex * 100}%)` }}
        >
          {clips.map((clip, index) => (
            <div key={clip.id} className="h-full w-full shrink-0">
              <GameClipPlayer
                clip={clip}
                isActive={index === activeIndex}
                isMuted={isMuted}
                onAutoNext={goToNext}
                hasMore={hasNextPage}
              />
            </div>
          ))}

          {/* Loading slot at the end */}
          {hasNextPage && (
            <div className="h-full w-full shrink-0 flex items-center justify-center bg-black">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <Typography variant="body-sm" className="text-white/50 font-medium">Chargement du clip suivant...</Typography>
              </div>
            </div>
          )}
        </div>
      ) : !loading && (
        /* Empty State */
        <div className="h-full w-full flex flex-col items-center justify-center text-white p-6 text-center bg-[#0a0a0b]">
          <div className="mb-6 p-8 rounded-3xl bg-white/5 border border-white/10">
            <Loader2 className="h-12 w-12 text-primary/40" />
          </div>
          <h3 className="text-2xl font-bold mb-3 tracking-tight">Aucun clip à l'horizon</h3>
          <p className="text-white/50 max-w-sm mb-8 leading-relaxed">
            Exploration terminée ! Revenez plus tard ou partagez votre propre talent pour animer cet espace.
          </p>
          <button
            onClick={() => window.location.href = '/game-clips?create=true'}
            className="bg-primary text-primary-foreground px-8 py-3 rounded-full font-bold hover:scale-105 transition-transform shadow-lg shadow-primary/20"
          >
            Créer un Clip
          </button>
        </div>
      )}

      {/* Global Loader Overlay */}
      {loading && clips.length === 0 && (
        <div className="absolute inset-0 z-[60] bg-black flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      )}

      {/* Navigation Tips Desktop */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 hidden md:flex items-center gap-3 text-white/40 pointer-events-none bg-black/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/5">
        <kbd className="px-2 py-1 bg-white/10 rounded-md text-[10px] uppercase font-bold text-white/60">Flèches</kbd>
        <div className="h-3 w-px bg-white/10" />
        <span className="text-xs font-medium uppercase tracking-widest">Naviguer</span>
        <div className="h-3 w-px bg-white/10" />
        <kbd className="px-2 py-1 bg-white/10 rounded-md text-[10px] uppercase font-bold text-white/60">M</kbd>
        <span className="text-xs font-medium uppercase tracking-widest">Muet</span>
      </div>
    </div>
  );
}