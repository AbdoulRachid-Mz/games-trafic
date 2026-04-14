import React, { useState, useEffect, useRef, useCallback } from "react";
import { Loader2, Volume2, VolumeX, ArrowLeft, RefreshCw } from "lucide-react";
import { GameClipPlayer } from "./game-clip-player";
import { cn } from "@/lib/utils";
import { GameClipCard } from "@/types/view-models";
import { Typography } from "../ui/typography";
import { useRouter } from "next/navigation";
import { useClipEngineStore } from "@/hooks/use-clip-engine";
import { CommentsSheet } from "@/components/comments/comments-sheet";
import { motion, AnimatePresence } from "framer-motion";

interface GameClipReelProps {
  clips: GameClipCard[];
  loading?: boolean;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onFetchNextPage?: () => void;
  onClipChange?: (clipId: string) => void;
  className?: string;
}

export function GameClipReel({
  clips: originalClips,
  loading = false,
  hasNextPage = false,
  isFetchingNextPage = false,
  onFetchNextPage,
  onClipChange,
  className,
}: GameClipReelProps) {
  const router = useRouter();
  const [orderedClips, setOrderedClips] = useState<GameClipCard[]>([]);
  const [isReshuffling, setIsReshuffling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const [commentSheetOpen, setCommentSheetOpen] = useState(false);
  const isScrollingRef = useRef(false);
  
  const currentIndex = useClipEngineStore((s) => s.currentIndex);
  const setCurrentIndex = useClipEngineStore((s) => s.setCurrentIndex);
  const goNextStore = useClipEngineStore((s) => s.goNext);
  const goPrevStore = useClipEngineStore((s) => s.goPrev);
  const isTransitioning = useClipEngineStore((s) => s.isTransitioning);
  const muted = useClipEngineStore((s) => s.muted);
  const toggleMute = useClipEngineStore((s) => s.toggleMute);
  const setGlobalPause = useClipEngineStore((s) => s.setGlobalPause);
  const setPlaybackMode = useClipEngineStore((s) => s.setPlaybackMode);
  const playbackMode = useClipEngineStore((s) => s.playbackMode);

  const activeClipId = orderedClips[currentIndex]?.id;

  // Shuffle function
  const shuffleArray = useCallback((array: GameClipCard[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, []);

  // Reshuffle existing clips
  const handleReshuffle = useCallback(() => {
    setIsReshuffling(true);
    setTimeout(() => {
      setOrderedClips(prev => shuffleArray(prev));
      setIsReshuffling(false);
      setCurrentIndex(0);
      if (containerRef.current) {
        isScrollingRef.current = true;
        const element = itemRefs.current.get(0);
        element?.scrollIntoView({ behavior: "smooth", block: "start" });
        setTimeout(() => { isScrollingRef.current = false; }, 800);
      }
    }, 800);
  }, [shuffleArray, setCurrentIndex]);

  // Initialize and update clips
  useEffect(() => {
    if (originalClips.length > 0) {
      setOrderedClips(prev => {
        const existingIds = new Set(prev.map(c => c.id));
        const newClips = originalClips.filter(c => !existingIds.has(c.id));
        if (newClips.length > 0) return [...prev, ...shuffleArray(newClips)];
        return prev;
      });
    }
  }, [originalClips, shuffleArray]);

  // Stable Intersection Observer
  useEffect(() => {
    if (!containerRef.current) return;

    const options = {
      threshold: 0.6,
      root: containerRef.current,
    };

    const observer = new IntersectionObserver((entries) => {
      if (isScrollingRef.current) return;
      
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = Number(entry.target.getAttribute("data-index"));
          const state = useClipEngineStore.getState();
          if (!isNaN(index) && index !== state.currentIndex && !state.isTransitioning) {
             setCurrentIndex(index);
          }
        }
      });
    }, options);

    const currentItemRefs = itemRefs.current;
    currentItemRefs.forEach((el) => { if (el) observer.observe(el); });

    return () => observer.disconnect();
  }, [orderedClips.length, setCurrentIndex]);

  // Scroll to active index
  useEffect(() => {
    const element = itemRefs.current.get(currentIndex);
    if (element && containerRef.current && !isReshuffling) {
      isScrollingRef.current = true;
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      setTimeout(() => { isScrollingRef.current = false; }, 600);
      onClipChange?.(orderedClips[currentIndex].id);
    }

    if (currentIndex >= orderedClips.length - 2 && hasNextPage && !isFetchingNextPage && !isReshuffling) {
      onFetchNextPage?.();
    }
  }, [currentIndex, orderedClips, hasNextPage, isFetchingNextPage, onFetchNextPage, isReshuffling, onClipChange]);

  // Global Page Visibility
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) setGlobalPause(true);
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [setGlobalPause]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (commentSheetOpen) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        goNextStore(orderedClips.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        goPrevStore();
      } else if (e.key === "m" || e.key === "M") {
        toggleMute();
      } else if (e.key === " " || e.key === "Space") {
        e.preventDefault();
        setGlobalPause(!useClipEngineStore.getState().isGloballyPaused);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [commentSheetOpen, orderedClips.length, goNextStore, goPrevStore, toggleMute, setGlobalPause]);

  const handleComplete = useCallback(() => {
    if (playbackMode === "once") {
      goNextStore(orderedClips.length);
    }
  }, [playbackMode, goNextStore, orderedClips.length]);

  const isAtEnd = currentIndex === orderedClips.length - 1 && orderedClips.length > 0;
  const showReshuffle = !hasNextPage && isAtEnd && !isFetchingNextPage && !loading && orderedClips.length > 0;

  return (
    <div className={cn("relative h-screen w-full bg-black overflow-hidden", className)}>
      {/* HUD Header */}
      <div className="absolute top-6 left-6 z-50 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="bg-black/30 backdrop-blur-md rounded-full p-3 text-white border border-white/5 hover:bg-black/50 transition-all hover:scale-105 active:scale-95"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="flex gap-1 bg-black/20 backdrop-blur-md rounded-full p-1 border border-white/5">
          {["manual", "once", "loop"].map((mode) => (
            <button
              key={mode}
              onClick={() => { if (playbackMode !== mode) setPlaybackMode(mode as any); }}
              className={cn(
                "px-3 py-1.5 rounded-full text-[10px] font-bold transition-all uppercase tracking-tighter",
                playbackMode === mode 
                  ? "bg-primary text-white shadow-[0_0_15px_rgba(var(--primary),0.4)]" 
                  : "text-white/40 hover:text-white/60"
              )}
            >
              {mode === "manual" ? "Manuel" : mode === "once" ? "Suivant" : "Boucle"}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={toggleMute}
        className="absolute top-6 right-6 z-50 bg-black/30 backdrop-blur-md rounded-full p-3 text-white border border-white/5 hover:bg-black/50 transition-all hover:scale-105 active:scale-95"
      >
        {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
      </button>

      {/* Reel Scroll Container */}
      <div
        ref={containerRef}
        className="h-full w-full overflow-y-scroll snap-y snap-mandatory no-scrollbar overscroll-none"
      >
        {orderedClips.map((clip, index) => (
          <div
            key={clip.id}
            ref={(el) => {
              if (el) itemRefs.current.set(index, el);
              else itemRefs.current.delete(index);
            }}
            data-index={index}
            className="h-screen w-full shrink-0 snap-start snap-always relative"
          >
            <GameClipPlayer
              clip={clip}
              isActive={index === currentIndex}
              onComplete={handleComplete}
              onCommentsToggle={() => setCommentSheetOpen(true)}
              onNext={() => goNextStore(orderedClips.length)}
              onPrev={() => goPrevStore()}
            />
          </div>
        ))}

        {isFetchingNextPage && (
          <div className="h-screen w-full flex items-center justify-center snap-start bg-black">
             <Loader2 className="h-10 w-10 animate-spin text-primary/50" />
          </div>
        )}
        
        {showReshuffle && !isReshuffling && (
          <div className="h-screen w-full flex items-center justify-center snap-start bg-gradient-to-b from-black to-[#0a0a0b]">
            <button
              onClick={handleReshuffle}
              className="group flex flex-col items-center gap-6 p-10 rounded-[2.5rem] bg-white/[0.03] backdrop-blur-3xl border border-white/10 hover:bg-white/[0.06] transition-all duration-700 hover:scale-105"
            >
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                <RefreshCw className="h-16 w-16 text-primary group-hover:rotate-180 transition-transform duration-1000" />
              </div>
              <div className="text-center space-y-2">
                <Typography variant="h4" className="font-black text-white tracking-tight">Fin du fil</Typography>
                <Typography variant="body-sm" className="text-white/40 max-w-[200px]">Découvrez de nouveaux clips ou recommencez l'aventure.</Typography>
              </div>
              <div className="text-[10px] font-bold text-primary/60 tracking-[0.2em] uppercase">Recharger</div>
            </button>
          </div>
        )}

        {isReshuffling && (
          <div className="h-screen w-full flex items-center justify-center snap-start bg-black">
              <div className="relative flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-2 border-primary/20 rounded-full animate-spin border-t-primary" />
                <Typography variant="caption1" className="text-primary/50 font-bold animate-pulse uppercase tracking-widest">Calcul en cours...</Typography>
              </div>
          </div>
        )}
      </div>

      <CommentsSheet
        open={commentSheetOpen}
        onOpenChange={(open) => {
          setCommentSheetOpen(open);
          setGlobalPause(open);
        }}
        entityId={activeClipId || ""}
        entityType="GAMECLIP"
      />

      {!loading && orderedClips.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black p-6 text-center z-[70]">
          <Typography variant="h2" className="mb-6 font-black tracking-tighter">Pas encore de clips ici</Typography>
          <button 
            onClick={() => router.push("/game-clips/create")}
            className="bg-primary text-white px-10 py-4 rounded-full font-bold hover:scale-105 active:scale-95 transition-all shadow-[0_10px_30px_rgba(var(--primary),0.3)]"
          >
            Créer le premier clip
          </button>
        </div>
      )}

      {loading && orderedClips.length === 0 && (
        <div className="absolute inset-0 z-[100] bg-black flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
               <Loader2 className="h-12 w-12 animate-spin text-primary" />
               <div className="h-1 w-24 bg-white/5 rounded-full overflow-hidden">
                  <motion.div initial={{ x: "-100%" }} animate={{ x: "100%" }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }} className="h-full w-full bg-primary" />
               </div>
            </div>
        </div>
      )}
    </div>
  );
}