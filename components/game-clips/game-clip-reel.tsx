// components/game-clips/game-clip-reel.tsx
"use client";

import React, { useEffect, useRef, useCallback, useState, memo } from "react";
import { Loader2, Volume2, VolumeX, ArrowLeft, RefreshCw } from "lucide-react";
import { GameClipPlayer } from "./game-clip-player";
import { cn } from "@/lib/utils";
import { useRouter, usePathname } from "next/navigation";
import { useClipEngineStore, useClipEngine } from "@/hooks/use-clip-engine";
import { motion, AnimatePresence } from "framer-motion";
import { CommentsSheet } from "@/components/comments/comments-sheet";
import { InteractionSheet } from "./interaction-list";
import { CircularProgress } from "@/components/shared/circular-progress";

// Minimal type for clip data
interface ClipData {
  id: string;
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
  images?: string[] | null;
  caption?: string | null;
  authorId: string;
  author?: {
    id: string;
    username?: string | null;
    profileImage?: string | null;
  } | null;
  game?: {
    id: string;
    name: string;
    profileImage?: string | null;
  } | null;
  stats?: {
    likesCount?: number;
    commentsCount?: number;
    viewsCount?: number;
    liked?: boolean;
    bookmarked?: boolean;
  } | null;
}

interface GameClipReelProps {
  clips: ClipData[];
  initialClipId?: string | null;
  userId?: string;
  loading?: boolean;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onFetchNextPage?: () => void;
  onClipChange?: (clipId: string, index: number) => void;
  onCommentsToggle?: (clipId: string) => void;
  onLike?: (clipId: string) => void;
  onBookmark?: (clipId: string) => void;
  onShare?: (clipId: string) => void;
  className?: string;
}

// Individual clip wrapper component for intersection observer
const ClipItem = memo(function ClipItem({
  clip,
  index,
  isActive,
  isPreload,
  userId,
  onComplete,
  onCommentsToggle,
  onLike,
  onBookmark,
  onShare,
  onNext,
  onPrev,
  onVisible,
}: {
  clip: ClipData;
  index: number;
  isActive: boolean;
  isPreload: boolean;
  userId?: string;
  onComplete: () => void;
  onCommentsToggle?: () => void;
  onLike?: () => void;
  onBookmark?: () => void;
  onShare?: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  onVisible: (index: number, isVisible: boolean) => void;
}) {
  const itemRef = useRef<HTMLDivElement>(null);
  
  // Intersection observer for this item
  useEffect(() => {
    const element = itemRef.current;
    if (!element) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            onVisible(index, true);
          }
        });
      },
      {
        threshold: [0.6],
        rootMargin: "0px",
      }
    );
    
    observer.observe(element);
    return () => observer.disconnect();
  }, [index, onVisible]);
  
  return (
    <div
      ref={itemRef}
      data-index={index}
      data-clip-id={clip.id}
      className="h-screen w-full shrink-0 snap-start snap-always relative"
    >
      <GameClipPlayer
        clip={clip}
        clipIndex={index}
        isActive={isActive}
        isPreload={isPreload}
        userId={userId}
        onComplete={onComplete}
        onCommentsToggle={onCommentsToggle}
        onLike={onLike}
        onBookmark={onBookmark}
        onShare={onShare}
        onNext={onNext}
        onPrev={onPrev}
      />
    </div>
  );
});

export function GameClipReel({
  clips,
  initialClipId,
  userId,
  loading = false,
  hasNextPage = false,
  isFetchingNextPage = false,
  onFetchNextPage,
  onClipChange,
  onCommentsToggle,
  onLike,
  onBookmark,
  onShare,
  className,
}: GameClipReelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isReshuffling, setIsReshuffling] = useState(false);
  
  // Sheet states
  const [commentsSheetOpen, setCommentsSheetOpen] = useState(false);
  const [likesSheetOpen, setLikesSheetOpen] = useState(false);
  const [bookmarksSheetOpen, setBookmarksSheetOpen] = useState(false);
  const [activeSheetClipId, setActiveSheetClipId] = useState<string | null>(null);
  
  // Find initial index from initialClipId
  const initialIndex = initialClipId
    ? clips.findIndex((c) => c.id === initialClipId)
    : 0;
  
  // Use clip engine
  const {
    currentIndex,
    playbackMode,
    muted,
    goNext,
    goPrev,
    goToIndex,
    setPlaybackMode,
    toggleMute,
    setGlobalPause,
    reset,
  } = useClipEngine({
    totalClips: clips.length,
    initialIndex: initialIndex >= 0 ? initialIndex : 0,
    onIndexChange: (index) => {
      const clip = clips[index];
      if (clip) {
        onClipChange?.(clip.id, index);
      }
    },
    onEndReached: () => {
      if (hasNextPage && !isFetchingNextPage) {
        onFetchNextPage?.();
      }
    },
  });
  
  // Scroll to current index when it changes (only from store, not from user scroll)
  useEffect(() => {
    if (!containerRef.current || isScrollingRef.current || clips.length === 0) return;
    
    const targetElement = containerRef.current.querySelector(
      `[data-index="${currentIndex}"]`
    ) as HTMLElement;
    
    if (targetElement) {
      const container = containerRef.current;
      const targetTop = targetElement.offsetTop;
      const currentScroll = container.scrollTop;
      
      // Only scroll if we're not already at the right position
      if (Math.abs(targetTop - currentScroll) > 10) {
        isScrollingRef.current = true;
        container.scrollTo({
          top: targetTop,
          behavior: "smooth",
        });
        
        // Clear scrolling flag after animation
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = setTimeout(() => {
          isScrollingRef.current = false;
        }, 500);
      }
    }
  }, [currentIndex, clips.length]);
  
  // Handle visible clip from intersection observer
  const handleClipVisible = useCallback(
    (index: number, isVisible: boolean) => {
      if (isVisible && !isScrollingRef.current) {
        const currentState = useClipEngineStore.getState();
        if (index !== currentState.currentIndex && !currentState.isTransitioning) {
          goToIndex(index);
        }
      }
    },
    [goToIndex]
  );
  
  // Handle clip complete (end of media)
  const handleComplete = useCallback(() => {
    if (playbackMode === "once") {
      goNext();
    }
    // In manual and loop modes, the media controller handles it
  }, [playbackMode, goNext]);
  
  // Page visibility API
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        setGlobalPause(true);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [setGlobalPause]);
  
  // Pause all clips when navigating away from /game-clips
  useEffect(() => {
    if (pathname && !pathname.startsWith("/game-clips")) {
      setGlobalPause(true);
    }
  }, [pathname, setGlobalPause]);
  
  // Cleanup: pause on unmount
  useEffect(() => {
    return () => {
      setGlobalPause(true);
    };
  }, [setGlobalPause]);
  
  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle if focus is in an input
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }
      
      switch (e.key) {
        case "ArrowDown":
        case "j":
          e.preventDefault();
          goNext();
          break;
        case "ArrowUp":
        case "k":
          e.preventDefault();
          goPrev();
          break;
        case "m":
        case "M":
          toggleMute();
          break;
        case " ":
          e.preventDefault();
          setGlobalPause(!useClipEngineStore.getState().isGloballyPaused);
          break;
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goNext, goPrev, toggleMute, setGlobalPause]);
  
  // Sheet handlers
  const handleOpenComments = useCallback((clipId: string) => {
    setActiveSheetClipId(clipId);
    setCommentsSheetOpen(true);
  }, []);
  
  const handleOpenLikes = useCallback((clipId: string) => {
    setActiveSheetClipId(clipId);
    setLikesSheetOpen(true);
  }, []);
  
  const handleOpenBookmarks = useCallback((clipId: string) => {
    setActiveSheetClipId(clipId);
    setBookmarksSheetOpen(true);
  }, []);

  // Shuffle function
  const handleReshuffle = useCallback(() => {
    setIsReshuffling(true);
    reset();
    
    setTimeout(() => {
      setIsReshuffling(false);
      if (containerRef.current) {
        containerRef.current.scrollTo({ top: 0, behavior: "smooth" });
      }
    }, 600);
  }, [reset]);
  
  // Cleanup
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);
  
  const isAtEnd = currentIndex === clips.length - 1 && clips.length > 0;
  const showReshuffle = !hasNextPage && isAtEnd && !isFetchingNextPage && !loading;
  const activeClip = clips[currentIndex];
  
  return (
    <div className={cn("relative h-screen w-full bg-black overflow-hidden", className)}>
      {/* Header Controls */}
      <div className="absolute top-4 left-4 z-50 flex items-center gap-3">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="bg-black/40 backdrop-blur-md rounded-full p-2.5 text-white border border-white/10 hover:bg-black/60 transition-all active:scale-95"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        
        {/* Playback Mode Toggle */}
        <div className="flex gap-0.5 bg-black/40 backdrop-blur-md rounded-full p-0.5 border border-white/10">
          {(["manual", "once", "loop"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setPlaybackMode(mode)}
              className={cn(
                "px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-tight transition-all",
                playbackMode === mode
                  ? "bg-white text-black"
                  : "text-white/50 hover:text-white/80"
              )}
            >
              {mode === "manual" ? "Manuel" : mode === "once" ? "Auto" : "Boucle"}
            </button>
          ))}
        </div>
      </div>
      
      {/* Mute Button */}
      <button
        onClick={toggleMute}
        className="absolute top-4 right-4 z-50 bg-black/40 backdrop-blur-md rounded-full p-2.5 text-white border border-white/10 hover:bg-black/60 transition-all active:scale-95"
      >
        {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
      </button>
      
      {/* Clip Counter with Circular Progress */}
      {clips.length > 0 && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-50">
          <CircularProgress
            value={((currentIndex + 1) / clips.length) * 100}
            size={44}
            strokeWidth={2.5}
            gradient={{ from: "#ffffff", to: "#a78bfa" }}
          >
            <span className="text-[10px] font-bold text-white/90">
              {currentIndex + 1}/{clips.length}
            </span>
          </CircularProgress>
        </div>
      )}
      
      {/* Main Scroll Container */}
      <div
        ref={containerRef}
        className="h-full w-full overflow-y-scroll snap-y snap-mandatory overscroll-none scrollbar-none"
        style={{ scrollSnapType: "y mandatory" }}
      >
        {clips.map((clip, index) => {
          const isActive = index === currentIndex;
          const isPreload = Math.abs(index - currentIndex) <= 1;
          
          return (
            <ClipItem
              key={clip.id}
              clip={clip}
              index={index}
              isActive={isActive}
              isPreload={isPreload}
              userId={userId}
              onComplete={handleComplete}
              onCommentsToggle={() => handleOpenComments(clip.id)}
              onLike={() => onLike?.(clip.id)}
              onBookmark={() => onBookmark?.(clip.id)}
              onShare={() => onShare?.(clip.id)}
              onNext={goNext}
              onPrev={goPrev}
              onVisible={handleClipVisible}
            />
          );
        })}
        
        {/* Loading More */}
        {isFetchingNextPage && (
          <div className="h-screen w-full flex items-center justify-center snap-start bg-black">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-white/40" />
              <span className="text-xs text-white/30 font-medium">Chargement...</span>
            </div>
          </div>
        )}
        
        {/* End of Feed / Reshuffle */}
        {showReshuffle && !isReshuffling && clips.length > 0 && (
          <div className="h-screen w-full flex items-center justify-center snap-start bg-gradient-to-b from-black to-zinc-900">
            <motion.button
              onClick={handleReshuffle}
              className="group flex flex-col items-center gap-4 p-8 rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              >
                <RefreshCw className="h-12 w-12 text-white/60 group-hover:text-white transition-colors" />
              </motion.div>
              <div className="text-center">
                <p className="text-lg font-bold text-white mb-1">Fin du fil</p>
                <p className="text-sm text-white/40">Appuyez pour recharger</p>
              </div>
            </motion.button>
          </div>
        )}
        
        {/* Reshuffling State */}
        {isReshuffling && (
          <div className="h-screen w-full flex items-center justify-center snap-start bg-black">
            <div className="flex flex-col items-center gap-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
              >
                <RefreshCw className="h-8 w-8 text-white/60" />
              </motion.div>
              <span className="text-xs text-white/40 uppercase tracking-wider font-bold">
                Rechargement...
              </span>
            </div>
          </div>
        )}
      </div>
      
      {/* Empty State */}
      {!loading && clips.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black p-6 text-center z-50">
          <div className="text-6xl mb-4 opacity-20">🎬</div>
          <h2 className="text-xl font-bold mb-2">Pas encore de clips</h2>
          <p className="text-white/50 mb-6 max-w-xs">
            Soyez le premier à partager un moment épique !
          </p>
          <button
            onClick={() => router.push("/game-clips/create")}
            className="bg-white text-black px-6 py-3 rounded-full font-bold hover:bg-white/90 transition-colors active:scale-95"
          >
            Créer un clip
          </button>
        </div>
      )}
      
      {/* Initial Loading State */}
      {loading && clips.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-50">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-white/40" />
            <div className="h-1 w-20 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-white/40"
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Comments Sheet */}
      {activeSheetClipId && (
        <CommentsSheet
          open={commentsSheetOpen}
          onOpenChange={setCommentsSheetOpen}
          entityId={activeSheetClipId}
          entityType="GAMECLIP"
        />
      )}
      
      {/* Likes Sheet */}
      {activeSheetClipId && (
        <InteractionSheet
          open={likesSheetOpen}
          onOpenChange={setLikesSheetOpen}
          entityId={activeSheetClipId}
          entityType="GAMECLIP"
          interactionType="LIKE"
          title="Likes"
        />
      )}
      
      {/* Bookmarks Sheet */}
      {activeSheetClipId && (
        <InteractionSheet
          open={bookmarksSheetOpen}
          onOpenChange={setBookmarksSheetOpen}
          entityId={activeSheetClipId}
          entityType="GAMECLIP"
          interactionType="BOOKMARK"
          title="Sauvegardes"
        />
      )}
    </div>
  );
}
