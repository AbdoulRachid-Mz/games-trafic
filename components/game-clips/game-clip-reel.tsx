// @/components/game-clips/game-clip-reel.tsx - version améliorée
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Loader2, Volume2, VolumeX } from "lucide-react";
import { GameClipWithRelations } from "@/types/clips";
import { GameClipPlayer } from "./game-clip-player";
import { cn } from "@/lib/utils";

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
// @/components/game-clips/game-clip-reel.tsx
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

  // Setup intersection observer for infinite scroll
  useEffect(() => {
    if (!containerRef.current || !onFetchNextPage) return;

    const options = {
      root: containerRef.current,
      rootMargin: "0px 0px 100px 0px",
      threshold: 0.1,
    };

    observerRef.current = new IntersectionObserver((entries) => {
      const lastEntry = entries[entries.length - 1];
      if (lastEntry.isIntersecting && !loading && hasNextPage) {
        onFetchNextPage();
      }
    }, options);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [loading, hasNextPage, onFetchNextPage]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        goToNext();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        goToPrev();
      } else if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        setIsMuted(!isMuted);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, clips.length, isMuted]);

  const goToNext = useCallback(() => {
    if (activeIndex < clips.length - 1) {
      setActiveIndex(activeIndex + 1);
    } else if (hasNextPage && onFetchNextPage) {
      onFetchNextPage();
    }
  }, [activeIndex, clips.length, hasNextPage, onFetchNextPage]);

  const goToPrev = useCallback(() => {
    if (activeIndex > 0) {
      setActiveIndex(activeIndex - 1);
    }
  }, [activeIndex]);

  // Handle wheel/touch scroll
  const handleScroll = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY > 0) {
      goToNext();
    } else {
      goToPrev();
    }
  }, [goToNext, goToPrev]);

  // Handle touch swipe
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 50) {
      // Swipe up
      goToNext();
    } else if (touchEnd - touchStart > 50) {
      // Swipe down
      goToPrev();
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative h-screen w-full overflow-hidden bg-black",
        className
      )}
      onWheel={handleScroll}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Mute Toggle Button */}
      <button
        onClick={() => setIsMuted(!isMuted)}
        className="absolute top-6 right-6 z-50 bg-black/50 backdrop-blur-md rounded-full p-3 text-white hover:bg-black/70 transition-all"
      >
        {isMuted ? (
          <VolumeX className="h-5 w-5" />
        ) : (
          <Volume2 className="h-5 w-5" />
        )}
      </button>

      {/* Current Clip */}
      {clips.length > 0 && (
        <div className="h-full w-full">
          <GameClipPlayer
            clip={clips[activeIndex]}
            isActive={true}
            isMuted={isMuted}
            onAutoNext={goToNext}
          />
        </div>
      )}

      {/* Next Clip (preload) */}
      {clips.length > activeIndex + 1 && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="h-full w-full opacity-0">
            <GameClipPlayer
              clip={clips[activeIndex + 1]}
              isActive={false}
              isMuted={true}
            />
          </div>
        </div>
      )}

      {/* Navigation Dots */}
      {clips.length > 1 && (
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-50 flex gap-2">
          {clips.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                index === activeIndex
                  ? "w-8 bg-white"
                  : "w-1.5 bg-white/50 hover:bg-white/70"
              )}
              aria-label={`Aller au clip ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Loading Indicator */}
      {(loading || isFetchingNextPage) && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-50">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      )}

      {/* Empty State */}
      {clips.length === 0 && !loading && (
        <div className="h-full w-full flex flex-col items-center justify-center text-white p-6 text-center">
          <div className="mb-4 p-6 rounded-full bg-white/10">
            <Loader2 className="h-16 w-16" />
          </div>
          <h3 className="text-2xl font-bold mb-2">Aucun clip disponible</h3>
          <p className="text-white/70 max-w-md">
            Il n'y a pas encore de clips à afficher. Revenez plus tard ou créez
            votre premier clip !
          </p>
        </div>
      )}

      {/* Instructions */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-50 text-white/70 text-sm">
        <span className="hidden md:inline">
          Utilisez les flèches ↑↓ ou faites glisser pour naviguer
        </span>
        <span className="md:hidden">Faites glisser pour naviguer</span>
      </div>
    </div>
  );
}