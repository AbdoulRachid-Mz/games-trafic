// @/components/game-clips/game-clip-reel.tsx
"use client";

import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import { Loader2, Volume2, VolumeX, ArrowLeft } from "lucide-react";
import { GameClipPlayer } from "./game-clip-player";
import { cn } from "@/lib/utils";
import { GameClipCard } from "@/types/view-models";
import { Typography } from "../ui/typography";
import { useRouter } from "next/navigation";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";

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
  const containerRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);
  const itemsRef = useRef<(HTMLDivElement | null)[]>([]);

  // Shuffle logic
  const shuffleAndSet = useCallback((clipsToShuffle: GameClipCard[]) => {
    const shuffled = [...clipsToShuffle].sort(() => Math.random() - 0.5);
    setOrderedClips(shuffled);
    setActiveIndex(0);
    if (containerRef.current) containerRef.current.scrollTop = 0;
  }, []);

  // Sync clips
  useEffect(() => {
    if (originalClips.length > 0 && orderedClips.length === 0) {
      setOrderedClips(originalClips);
    } else if (originalClips.length > orderedClips.length) {
      // Append new clips from pagination
      setOrderedClips(prev => {
        const existingIds = new Set(prev.map(c => c.id));
        const news = originalClips.filter(c => !existingIds.has(c.id));
        return [...prev, ...news];
      });
    }
  }, [originalClips, orderedClips.length]);

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

  // Hook to handle intersection and update activeIndex
  const handleIntersect = useCallback((index: number, isIntersecting: boolean) => {
    if (isIntersecting) {
      setActiveIndex(index);
      onClipChange?.(orderedClips[index].id);

      // Load more if near end
      if (index >= orderedClips.length - 2 && hasNextPage && !isFetchingNextPage) {
        onFetchNextPage?.();
      }
    }
  }, [orderedClips, onClipChange, hasNextPage, isFetchingNextPage, onFetchNextPage]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (areCommentsOpen) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        containerRef.current?.scrollBy({ top: window.innerHeight, behavior: "smooth" });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        containerRef.current?.scrollBy({ top: -window.innerHeight, behavior: "smooth" });
      } else if (e.key === "m" || e.key === "M") {
        setIsMuted(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [areCommentsOpen]);

  // Handle end of reel
  const handleLastClipEnd = useCallback(() => {
    if (!hasNextPage) {
      // Shuffle and restart
      shuffleAndSet(orderedClips);
    }
  }, [hasNextPage, orderedClips, shuffleAndSet]);

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
        onClick={() => setIsMuted(!isMuted)}
        className="absolute top-6 right-6 z-50 bg-black/40 backdrop-blur-md rounded-full p-3 text-white border border-white/10 hover:bg-black/60 transition-all shadow-xl md:top-20"
      >
        {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
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
            isMuted={isMuted}
            isPaused={areCommentsOpen}
            onAutoNext={() => {
              if (index === orderedClips.length - 1) {
                handleLastClipEnd();
              } else {
                containerRef.current?.scrollBy({ top: window.innerHeight, behavior: "smooth" });
              }
            }}
            onAutoPrev={() => {
              containerRef.current?.scrollBy({ top: -window.innerHeight, behavior: "smooth" });
            }}
            onIntersect={handleIntersect}
            onCommentsToggle={onCommentsToggle}
            onMuteToggle={() => setIsMuted(!isMuted)}
            // Windowing: only render core player for active and neighbors
            shouldRenderPlayer={index >= activeIndex - 1 && index <= activeIndex + 1}
          />
        ))}

        {/* Loading Indicator at end */}
        {hasNextPage && (
          <div className="h-screen w-full flex items-center justify-center snap-start">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <Typography variant="body-sm" className="text-white/50">Chargement...</Typography>
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
  isMuted: boolean;
  isPaused: boolean;
  onAutoNext: () => void;
  onAutoPrev: () => void;
  onIntersect: (index: number, isIntersecting: boolean) => void;
  onCommentsToggle?: () => void;
  onMuteToggle: () => void;
  shouldRenderPlayer: boolean;
}

const ReelItem = memo(({ 
  clip, 
  index, 
  isActive, 
  isMuted, 
  isPaused, 
  onAutoNext, 
  onAutoPrev, 
  onIntersect,
  onCommentsToggle,
  onMuteToggle,
  shouldRenderPlayer
}: ReelItemProps) => {
  const itemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        onIntersect(index, entry.isIntersecting);
      },
      { threshold: 0.6 } // High threshold to ensure it's mostly centered
    );

    if (itemRef.current) observer.observe(itemRef.current);
    return () => observer.disconnect();
  }, [index, onIntersect]);

  return (
    <div
      ref={itemRef}
      className="h-screen w-full shrink-0 snap-start snap-always relative"
    >
      {shouldRenderPlayer ? (
        <GameClipPlayer
          clip={clip}
          isActive={isActive}
          isMuted={isMuted}
          onMuteToggle={onMuteToggle}
          onAutoNext={onAutoNext}
          onAutoPrev={onAutoPrev}
          onCommentsToggle={onCommentsToggle}
          isPaused={isPaused}
        />
      ) : (
        <div className="h-full w-full bg-black/40 animate-pulse flex items-center justify-center">
            {clip.thumbnailUrl && (
                <img src={clip.thumbnailUrl} className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-20" alt="" />
            )}
            <Loader2 className="h-8 w-8 animate-spin text-white/10" />
        </div>
      )}
    </div>
  );
});

ReelItem.displayName = "ReelItem";