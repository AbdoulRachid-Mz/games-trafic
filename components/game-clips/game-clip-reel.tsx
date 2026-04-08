// @/components/game-clips/game-clip-reel.tsx
"use client";

import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import { Loader2, Volume2, VolumeX, ArrowLeft } from "lucide-react";
import { GameClipPlayer } from "./game-clip-player";
import { cn } from "@/lib/utils";
import { GameClipCard } from "@/types/view-models";
import { Typography } from "../ui/typography";
import { useRouter } from "next/navigation";
import { useGameClipsStore } from "@/stores/game-clips-store";

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
  const containerRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);
  const itemsRef = useRef<(HTMLDivElement | null)[]>([]);
  const isScrollingRef = useRef(false);
  
  const { muted, toggleMute, setGlobalPause } = useGameClipsStore();

  // Fonction pour mélanger aléatoirement les clips
  const shuffleArray = useCallback((array: GameClipCard[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, []);

  // Initialisation et ajout de nouveaux clips de manière aléatoire
  useEffect(() => {
    if (originalClips.length > 0) {
      setOrderedClips(prev => {
        const existingIds = new Set(prev.map(c => c.id));
        const newClips = originalClips.filter(c => !existingIds.has(c.id));
        
        if (newClips.length > 0) {
          // Mélanger les nouveaux clips et les ajouter
          const shuffledNew = shuffleArray(newClips);
          return [...prev, ...shuffledNew];
        }
        return prev;
      });
    }
  }, [originalClips, shuffleArray]);

  // Initial scroll to active
  useEffect(() => {
    if (!isInitialized.current && orderedClips.length > 0) {
      let index = 0;
      if (initialClipId) {
        index = orderedClips.findIndex(c => c.id === initialClipId);
        if (index === -1) index = 0;
      }
      
      setActiveIndex(index);
      if (containerRef.current) {
        containerRef.current.scrollTop = index * window.innerHeight;
      }
      isInitialized.current = true;
    }
  }, [orderedClips, initialClipId]);

  // Gestion du scroll avec détection de fin
  const handleScroll = useCallback(() => {
    if (!containerRef.current || isScrollingRef.current) return;
    
    isScrollingRef.current = true;
    requestAnimationFrame(() => {
      const scrollTop = containerRef.current?.scrollTop || 0;
      const windowHeight = window.innerHeight;
      const newIndex = Math.round(scrollTop / windowHeight);
      
      if (newIndex !== activeIndex && newIndex >= 0 && newIndex < orderedClips.length) {
        setActiveIndex(newIndex);
        onClipChange?.(orderedClips[newIndex].id);
        
        // Charger plus si on approche de la fin
        if (newIndex >= orderedClips.length - 3 && hasNextPage && !isFetchingNextPage) {
          onFetchNextPage?.();
        }
      }
      
      isScrollingRef.current = false;
    });
  }, [activeIndex, orderedClips, onClipChange, hasNextPage, isFetchingNextPage, onFetchNextPage]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (areCommentsOpen) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        const nextIndex = Math.min(activeIndex + 1, orderedClips.length - 1);
        if (containerRef.current) {
          containerRef.current.scrollTo({ top: nextIndex * window.innerHeight, behavior: "smooth" });
        }
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prevIndex = Math.max(activeIndex - 1, 0);
        if (containerRef.current) {
          containerRef.current.scrollTo({ top: prevIndex * window.innerHeight, behavior: "smooth" });
        }
      } else if (e.key === "m" || e.key === "M") {
        toggleMute();
      } else if (e.key === " " || e.key === "Space") {
        e.preventDefault();
        setGlobalPause(!useGameClipsStore.getState().isGloballyPaused);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [areCommentsOpen, activeIndex, orderedClips.length, toggleMute, setGlobalPause]);

  // Gestion de la fin du reel avec reshuffle
  const handleLastClipEnd = useCallback(() => {
    if (!hasNextPage) {
      // Reshuffle tous les clips et recommencer
      const reshuffled = shuffleArray(orderedClips);
      setOrderedClips(reshuffled);
      setActiveIndex(0);
      if (containerRef.current) {
        containerRef.current.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  }, [hasNextPage, orderedClips, shuffleArray]);

  return (
    <div className={cn("relative h-screen w-full bg-black overflow-hidden", className)}>
      {/* Fixed UI Overlays */}
      <div className="absolute top-6 left-6 z-50 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="bg-black/40 backdrop-blur-md rounded-full p-3 text-white border border-white/10 hover:bg-black/60 transition-all shadow-xl"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      </div>

      <button
        onClick={toggleMute}
        className="absolute top-6 right-6 z-50 bg-black/40 backdrop-blur-md rounded-full p-3 text-white border border-white/10 hover:bg-black/60 transition-all shadow-xl md:top-20"
      >
        {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
      </button>

      {/* Reel Scroll Container */}
      <div
        ref={containerRef}
        className="h-full w-full overflow-y-scroll snap-y snap-mandatory no-scrollbar overscroll-none"
      >
        {orderedClips.map((clip, index) => (
          <ReelItem
            key={clip.id}
            clip={clip}
            index={index}
            isActive={index === activeIndex}
            onAutoNext={() => {
              if (index === orderedClips.length - 1) {
                handleLastClipEnd();
              } else {
                const nextIndex = index + 1;
                containerRef.current?.scrollTo({ top: nextIndex * window.innerHeight, behavior: "smooth" });
              }
            }}
            onAutoPrev={() => {
              if (index > 0) {
                const prevIndex = index - 1;
                containerRef.current?.scrollTo({ top: prevIndex * window.innerHeight, behavior: "smooth" });
              }
            }}
            onCommentsToggle={onCommentsToggle}
          />
        ))}

        {/* Loading Indicator at end */}
        {isFetchingNextPage && (
          <div className="h-screen w-full flex items-center justify-center snap-start">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <Typography variant="body-sm" className="text-white/50">Chargement...</Typography>
            </div>
          </div>
        )}
        
        {!hasNextPage && orderedClips.length > 0 && (
          <div className="h-screen w-full flex items-center justify-center snap-start">
            <div className="flex flex-col items-center gap-4 text-white/30">
              <Typography variant="body-sm">Fin des clips</Typography>
              <Typography variant="caption1">Le chargement va reprendre...</Typography>
            </div>
          </div>
        )}
      </div>

      {/* Empty State */}
      {!loading && orderedClips.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black p-6 text-center">
           <Typography variant="h3" className="mb-4">Aucun clip pour le moment</Typography>
           <button 
             onClick={() => router.push("/game-clips?create=true")}
             className="bg-primary px-8 py-3 rounded-full font-bold"
           >
             Créer un Clip
           </button>
        </div>
      )}

      {/* Initial Loading Overlay */}
      {loading && orderedClips.length === 0 && (
        <div className="absolute inset-0 z-[60] bg-black flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      )}
    </div>
  );
}

interface ReelItemProps {
  clip: GameClipCard;
  index: number;
  isActive: boolean;
  onAutoNext: () => void;
  onAutoPrev: () => void;
  onCommentsToggle?: () => void;
}

const ReelItem = memo(({ 
  clip, 
  isActive, 
  onAutoNext, 
  onAutoPrev, 
  onCommentsToggle
}: ReelItemProps) => {
  return (
    <div className="h-screen w-full shrink-0 snap-start snap-always relative">
      <GameClipPlayer
        clip={clip}
        isActive={isActive}
        onAutoNext={onAutoNext}
        onAutoPrev={onAutoPrev}
        onCommentsToggle={onCommentsToggle}
      />
    </div>
  );
});

ReelItem.displayName = "ReelItem";