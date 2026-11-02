// components/game-clips/game-clip-reel.tsx
"use client";

import React, { useEffect, useRef, useCallback, useState, memo, useMemo } from "react";
import { Loader2, Volume2, VolumeX, ArrowLeft, MessageCircle, Heart, Bookmark, Share2, X } from "lucide-react";
import { GameClipPlayer } from "./game-clip-player";
import { cn } from "@/lib/utils";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useClipEngineStore, useClipEngine } from "@/hooks/use-clip-engine";
import { motion, AnimatePresence } from "framer-motion";
import { CommentsSection } from "@/components/comments/comments-section";
import { InteractionList } from "./interaction-list";
import { CircularProgress } from "@/components/shared/circular-progress";
import { useScreenSize } from "@/hooks/use-screen";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import Image from "next/image";

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
  isDesktopLayoutCompact = false,
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
  isDesktopLayoutCompact?: boolean;
}) {
  const itemRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Intersection observer for this item - with debounce
  useEffect(() => {
    const element = itemRef.current;
    if (!element) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.8) {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => {
              onVisible(index, true);
            }, 100);
          }
        });
      },
      {
        threshold: [0.8],
        rootMargin: "0px",
      }
    );
    
    observer.observe(element);
    return () => {
      observer.disconnect();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [index, onVisible]);
  
  return (
    <div
      ref={itemRef}
      data-index={index}
      data-clip-id={clip.id}
      className={cn(
        "h-screen shrink-0 snap-start snap-always relative transition-all duration-300 ease-out",
        isDesktopLayoutCompact ? "w-[70%]" : "w-full"
      )}
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

// Local feed buffer hook - with continuous duplication
function useFeedBuffer(clips: ClipData[], hasNextPage: boolean) {
  const [feedClips, setFeedClips] = useState<ClipData[]>([]);
  const [duplicationCount, setDuplicationCount] = useState(0);
  const MAX_DUPLICATIONS = 5;

  // Accumulate clips without duplicates
  useEffect(() => {
    if (clips.length > 0) {
      setFeedClips((prev) => {
        const existingIds = new Set(prev.map(c => c.id));
        const newClips = clips.filter(c => !existingIds.has(c.id));
        
        if (newClips.length === 0) return prev;
        
        return [...prev, ...newClips];
      });
    }
  }, [clips]);

  // Continuous duplication when no more data
  useEffect(() => {
    if (!hasNextPage && feedClips.length > 0 && duplicationCount < MAX_DUPLICATIONS) {
      const shuffledBatch = [...feedClips]
        .sort(() => Math.random() - 0.5)
        .slice(0, 12);
      
      setFeedClips((prev) => [...prev, ...shuffledBatch]);
      setDuplicationCount(prev => prev + 1);
    }
  }, [hasNextPage, feedClips.length, duplicationCount]);

  // Reset duplication count when we get new real data
  useEffect(() => {
    if (clips.length > 0 && hasNextPage) {
      setDuplicationCount(0);
    }
  }, [clips.length, hasNextPage]);

  return { feedClips, duplicationCount };
}

// Desktop side panel with clip resizing
function DesktopSidePanel({ 
  clip, 
  userId, 
  isOpen,
  onClose,
  onLike,
  onBookmark,
  onShare,
}: {
  clip: ClipData | null;
  userId?: string;
  isOpen: boolean;
  onClose: () => void;
  onLike?: (clipId: string) => void;
  onBookmark?: (clipId: string) => void;
  onShare?: (clipId: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<"comments" | "likes" | "bookmarks">("comments");
  const setGlobalPause = useClipEngineStore((s) => s.setGlobalPause);

  useEffect(() => {
    if (isOpen) {
      setGlobalPause(true);
    } else {
      setGlobalPause(false);
    }
    return () => {
      setGlobalPause(false);
    };
  }, [isOpen, setGlobalPause]);

  if (!clip) return null;

  return (
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: isOpen ? "30%" : 0, opacity: isOpen ? 1 : 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "h-full bg- border-l border-white/10 z-40 overflow-hidden",
        !isOpen && "border-l-0"
      )}
    >
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 relative rounded-full bg-primary/20 flex items-center justify-center">
              {clip.game?.profileImage ? (
                <Image src={clip.game.profileImage} alt={`image-${clip.id}`} className="w-6 h-6 rounded-full" />
              ) : (
                <span className="text-primary text-xs font-bold">{clip.game?.name?.[0] || "G"}</span>
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-white line-clamp-1">{clip.game?.name || "Game Clip"}</p>
              <p className="text-xs text-white/40">@{clip.author?.username}</p>
            </div>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-white/10"
          >
            <X className="h-5 w-5 text-white/60" />
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col min-h-0">
          <TabsList className="w-full rounded-none border-b border-white/10 bg-transparent p-0 h-auto">
            <TabsTrigger
              value="comments"
              className="flex-1 py-3 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-white text-white/50"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Commentaires
              <span className="ml-1 text-xs">({clip.stats?.commentsCount || 0})</span>
            </TabsTrigger>
            <TabsTrigger
              value="likes"
              className="flex-1 py-3 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-white text-white/50"
            >
              <Heart className="h-4 w-4 mr-2" />
              Likes
              <span className="ml-1 text-xs">({clip.stats?.likesCount || 0})</span>
            </TabsTrigger>
            <TabsTrigger
              value="bookmarks"
              className="flex-1 py-3 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-white text-white/50"
            >
              <Bookmark className="h-4 w-4 mr-2" />
              Sauvegardes
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1">
            <TabsContent value="comments" className="m-0 p-4">
              <CommentsSection
                entityId={clip.id}
                entityType="GAMECLIP"
                title=""
                className="mt-0"
              />
            </TabsContent>
            <TabsContent value="likes" className="m-0 p-4">
              <InteractionList
                entityId={clip.id}
                entityType="GAMECLIP"
                interactionType="LIKE"
                className="mt-0"
              />
            </TabsContent>
            <TabsContent value="bookmarks" className="m-0 p-4">
              <InteractionList
                entityId={clip.id}
                entityType="GAMECLIP"
                interactionType="BOOKMARK"
                className="mt-0"
              />
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </div>
    </motion.div>
  );
}

export function GameClipReel({
  clips: rawClips,
  initialClipId,
  userId,
  loading = false,
  hasNextPage = false,
  isFetchingNextPage = false,
  onFetchNextPage,
  onClipChange,
  onLike,
  onBookmark,
  onShare,
  className,
}: GameClipReelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isNearEndTriggeredRef = useRef(false);
  const { isDesktop } = useScreenSize();
  
  // Refs pour la détection de swipe
  const touchStartRef = useRef<{ y: number; x: number } | null>(null);
  
  // Sheet state for mobile
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [mobileSheetType, setMobileSheetType] = useState<"comments" | "likes" | "bookmarks">("comments");
  
  // Desktop side panel state
  const [desktopPanelOpen, setDesktopPanelOpen] = useState(false);
  
  // Local feed buffer
  const { feedClips, duplicationCount } = useFeedBuffer(rawClips, hasNextPage);
  
  // Find initial index
  const initialIndex = useMemo(() => {
    if (initialClipId && feedClips.length > 0) {
      const idx = feedClips.findIndex((c) => c.id === initialClipId);
      return idx >= 0 ? idx : 0;
    }
    return 0;
  }, [initialClipId, feedClips]);
  
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
  } = useClipEngine({
    totalClips: feedClips.length,
    initialIndex,
    onIndexChange: (index) => {
      const clip = feedClips[index];
      if (clip) {
        onClipChange?.(clip.id, index);
        // Close panel when clip changes on desktop
        if (isDesktop) {
          setDesktopPanelOpen(false);
        } else {
          setMobileSheetOpen(false);
        }
      }
    },
    onEndReached: () => {
      if (hasNextPage && !isFetchingNextPage && !isNearEndTriggeredRef.current) {
        isNearEndTriggeredRef.current = true;
        onFetchNextPage?.();
        setTimeout(() => {
          isNearEndTriggeredRef.current = false;
        }, 2000);
      }
    },
  });

  // Get current clip
  const currentClip = feedClips[currentIndex];
  
  // Reset near end trigger when clips change
  useEffect(() => {
    isNearEndTriggeredRef.current = false;
  }, [feedClips.length]);
  
  // Auto-load when near end
  useEffect(() => {
    if (feedClips.length === 0) return;
    
    const isNearEnd = currentIndex >= feedClips.length - 3;
    
    if (isNearEnd && hasNextPage && !isFetchingNextPage && !isNearEndTriggeredRef.current) {
      isNearEndTriggeredRef.current = true;
      onFetchNextPage?.();
      setTimeout(() => {
        isNearEndTriggeredRef.current = false;
      }, 2000);
    }
  }, [currentIndex, feedClips.length, hasNextPage, isFetchingNextPage, onFetchNextPage]);
  
  // Gestion des swipes tactiles
  const SWIPE_THRESHOLD = 50;
  const MIN_SWIPE_DELTA = 30;
  
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (touch) {
      touchStartRef.current = {
        y: touch.clientY,
        x: touch.clientX,
      };
    }
  }, []);
  
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    
    const touch = e.changedTouches[0];
    if (touch) {
      const deltaY = touch.clientY - touchStartRef.current.y;
      const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
      
      if (Math.abs(deltaY) > SWIPE_THRESHOLD && Math.abs(deltaY) > deltaX + MIN_SWIPE_DELTA) {
        if (deltaY > 0) {
          goPrev();
        } else {
          goNext();
        }
      }
    }
    
    touchStartRef.current = null;
  }, [goPrev, goNext]);
  
  // Scroll to current index with guard
  useEffect(() => {
    if (!containerRef.current || isScrollingRef.current || feedClips.length === 0) return;
    
    const targetElement = containerRef.current.querySelector(
      `[data-index="${currentIndex}"]`
    ) as HTMLElement;
    
    if (targetElement) {
      const container = containerRef.current;
      const targetTop = targetElement.offsetTop;
      const currentScroll = container.scrollTop;
      const diff = Math.abs(targetTop - currentScroll);
      
      if (diff < 5) return;
      
      isScrollingRef.current = true;
      container.scrollTo({
        top: targetTop,
        behavior: "smooth",
      });
      
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        isScrollingRef.current = false;
      }, 800);
    }
  }, [currentIndex, feedClips.length]);
  
  // Handle visible clip
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
  
  // Handle clip complete
  const handleComplete = useCallback(() => {
    goNext();
  }, [goNext]);
  
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
  
  // Pause on navigate away
  useEffect(() => {
    if (pathname && !pathname.startsWith("/game-clips")) {
      setGlobalPause(true);
    }
  }, [pathname, setGlobalPause]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setGlobalPause(true);
    };
  }, [setGlobalPause]);
  
  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
  
  // Mobile sheet handlers
  const handleOpenMobileSheet = useCallback((type: "comments" | "likes" | "bookmarks") => {
    setMobileSheetType(type);
    setMobileSheetOpen(true);
    setGlobalPause(true);
  }, [setGlobalPause]);
  
  const handleCloseMobileSheet = useCallback(() => {
    setMobileSheetOpen(false);
    setGlobalPause(false);
  }, [setGlobalPause]);
  
  // Desktop panel handlers
  const handleToggleDesktopPanel = useCallback(() => {
    setDesktopPanelOpen(prev => !prev);
  }, []);
  
  // Cleanup scroll timeout
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);
  
  const isCurrentlyEmpty = !loading && feedClips.length === 0;
  
  // Desktop layout: video with dynamic width + panel on right
  if (isDesktop) {
    return (
      <div 
        className={cn("relative h-screen w-full bg-black overflow-hidden flex", className)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Left side - Scroll Container with dynamic width */}
        <div className={cn(
          "h-full transition-all duration-300 ease-out",
          desktopPanelOpen ? "w-[65%]" : "w-full"
        )}>
          {/* Header Controls */}
          <div className="absolute top-4 left-4 z-50 flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="bg-black/40 backdrop-blur-md rounded-full p-2.5 text-white border border-white/10 hover:bg-black/60 transition-all active:scale-95"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            
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
            style={{ right: desktopPanelOpen ? "calc(30% + 1rem)" : "1rem" }}
          >
            {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>
          
          {/* Main Scroll Container */}
          <div
            ref={containerRef}
            className="h-full w-full overflow-y-scroll snap-y snap-mandatory overscroll-none scrollbar-none flex flex-col items-center"
            style={{ scrollSnapType: "y mandatory" }}
          >
            {feedClips.map((clip, index) => {
              const isActive = index === currentIndex;
              const isPreload = Math.abs(index - currentIndex) <= 2;
              
              return (
                <ClipItem
                  key={`${clip.id}-${index}`}
                  clip={clip}
                  index={index}
                  isActive={isActive}
                  isPreload={isPreload}
                  userId={userId}
                  onComplete={handleComplete}
                  onCommentsToggle={handleToggleDesktopPanel}
                  onLike={() => onLike?.(clip.id)}
                  onBookmark={() => onBookmark?.(clip.id)}
                  onShare={() => onShare?.(clip.id)}
                  onNext={goNext}
                  onPrev={goPrev}
                  onVisible={handleClipVisible}
                  isDesktopLayoutCompact={desktopPanelOpen}
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
          </div>
          
          {/* Empty State */}
          {isCurrentlyEmpty && (
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
          {loading && feedClips.length === 0 && (
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
        </div>
        
        {/* Desktop Side Panel */}
        <DesktopSidePanel
          clip={currentClip}
          userId={userId}
          isOpen={desktopPanelOpen}
          onClose={() => setDesktopPanelOpen(false)}
          onLike={onLike}
          onBookmark={onBookmark}
          onShare={onShare}
        />
      </div>
    );
  }
  
  // Mobile layout (original)
  return (
    <div 
      className={cn("relative h-screen w-full bg-black overflow-hidden", className)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header Controls */}
      <div className="absolute top-4 left-4 z-50 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="bg-black/40 backdrop-blur-md rounded-full p-2.5 text-white border border-white/10 hover:bg-black/60 transition-all active:scale-95"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        
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
      {/* <button
        onClick={toggleMute}
        className="absolute top-4 right-4 z-50 bg-black/40 backdrop-blur-md rounded-full p-2.5 text-white border border-white/10 hover:bg-black/60 transition-all active:scale-95"
      >
        {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
      </button> */}
      
      {/* Main Scroll Container */}
      <div
        ref={containerRef}
        className="h-full w-full overflow-y-scroll snap-y snap-mandatory overscroll-none scrollbar-none"
        style={{ scrollSnapType: "y mandatory" }}
      >
        {feedClips.map((clip, index) => {
          const isActive = index === currentIndex;
          const isPreload = Math.abs(index - currentIndex) <= 2;
          
          return (
            <ClipItem
              key={`${clip.id}-${index}`}
              clip={clip}
              index={index}
              isActive={isActive}
              isPreload={isPreload}
              userId={userId}
              onComplete={handleComplete}
              onCommentsToggle={() => handleOpenMobileSheet("comments")}
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
      </div>
      
      {/* Empty State */}
      {isCurrentlyEmpty && (
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
      {loading && feedClips.length === 0 && (
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
      
      {/* Mobile Sheets */}
      <>
        {/* Comments Sheet */}
        <div
          className={cn(
            "fixed bottom-0 left-0 right-0 bg-[#0a0a0b] rounded-t-2xl z-50 transition-transform duration-300 ease-out h-[70vh]",
            mobileSheetOpen && mobileSheetType === "comments" ? "translate-y-0" : "translate-y-full"
          )}
        >
          <div className="sticky top-0 bg-[#0a0a0b] pt-3 pb-2">
            <div 
              className="w-12 h-1.5 bg-white/20 rounded-full mx-auto cursor-pointer"
              onClick={handleCloseMobileSheet}
            />
            <div className="flex items-center justify-between px-4 pt-2">
              <h3 className="text-white font-bold">Commentaires</h3>
              <button onClick={handleCloseMobileSheet} className="p-1">
                <X className="h-5 w-5 text-white/60" />
              </button>
            </div>
          </div>
          <div className="h-[calc(70vh-60px)] overflow-y-auto px-4 pb-20">
            {currentClip && (
              <CommentsSection
                entityId={currentClip.id}
                entityType="GAMECLIP"
                title=""
                className="mt-0"
              />
            )}
          </div>
        </div>
        
        {/* Likes Sheet */}
        <div
          className={cn(
            "fixed bottom-0 left-0 right-0 bg-[#0a0a0b] rounded-t-2xl z-50 transition-transform duration-300 ease-out h-[70vh]",
            mobileSheetOpen && mobileSheetType === "likes" ? "translate-y-0" : "translate-y-full"
          )}
        >
          <div className="sticky top-0 bg-[#0a0a0b] pt-3 pb-2">
            <div 
              className="w-12 h-1.5 bg-white/20 rounded-full mx-auto cursor-pointer"
              onClick={handleCloseMobileSheet}
            />
            <div className="flex items-center justify-between px-4 pt-2">
              <h3 className="text-white font-bold">Likes</h3>
              <button onClick={handleCloseMobileSheet} className="p-1">
                <X className="h-5 w-5 text-white/60" />
              </button>
            </div>
          </div>
          <div className="h-[calc(70vh-60px)] overflow-y-auto px-4 pb-20">
            {currentClip && (
              <InteractionList
                entityId={currentClip.id}
                entityType="GAMECLIP"
                interactionType="LIKE"
                className="mt-0"
              />
            )}
          </div>
        </div>
        
        {/* Bookmarks Sheet */}
        <div
          className={cn(
            "fixed bottom-0 left-0 right-0 bg-[#0a0a0b] rounded-t-2xl z-50 transition-transform duration-300 ease-out h-[70vh]",
            mobileSheetOpen && mobileSheetType === "bookmarks" ? "translate-y-0" : "translate-y-full"
          )}
        >
          <div className="sticky top-0 bg-[#0a0a0b] pt-3 pb-2">
            <div 
              className="w-12 h-1.5 bg-white/20 rounded-full mx-auto cursor-pointer"
              onClick={handleCloseMobileSheet}
            />
            <div className="flex items-center justify-between px-4 pt-2">
              <h3 className="text-white font-bold">Sauvegardes</h3>
              <button onClick={handleCloseMobileSheet} className="p-1">
                <X className="h-5 w-5 text-white/60" />
              </button>
            </div>
          </div>
          <div className="h-[calc(70vh-60px)] overflow-y-auto px-4 pb-20">
            {currentClip && (
              <InteractionList
                entityId={currentClip.id}
                entityType="GAMECLIP"
                interactionType="BOOKMARK"
                className="mt-0"
              />
            )}
          </div>
        </div>
      </>
    </div>
  );
}