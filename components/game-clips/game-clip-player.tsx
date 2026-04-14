import React, { useState, useCallback, useRef, useEffect } from "react";
import { InteractionButton } from "@/components/shared/interaction-button";
import {
  MessageCircle,
  Share2,
  Heart,
  Plus,
  Volume2,
  VolumeX,
  Play,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import { shareContent } from "@/lib/share";
import { GameClipCard } from "@/types/view-models";
import { useGameClips } from "@/hooks/use-game-clips";
import { useAuthContext } from "@/contexts/auth-context";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { ClipMediaController } from "./clip-media-controller";
import { useClipEngineStore } from "@/hooks/use-clip-engine";

interface GameClipPlayerProps {
  clip: GameClipCard;
  isActive: boolean;
  onComplete: () => void;
  onCommentsToggle?: () => void;
  onNext?: () => void;
  onPrev?: () => void;
}

export function GameClipPlayer({
  clip,
  isActive,
  onComplete,
  onCommentsToggle,
  onNext,
  onPrev,
}: GameClipPlayerProps) {
  const [showControls, setShowControls] = useState(false);
  const [showDoubleTapHeart, setShowDoubleTapHeart] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const doubleTapTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { shareClip, isSharing } = useGameClips();
  const { user } = useAuthContext();
  const router = useRouter();
  
  const isGloballyPaused = useClipEngineStore((s) => s.isGloballyPaused);
  const playbackMode = useClipEngineStore((s) => s.playbackMode);
  const setGlobalPause = useClipEngineStore((s) => s.setGlobalPause);
  const muted = useClipEngineStore((s) => s.muted);
  const toggleMute = useClipEngineStore((s) => s.toggleMute);
  const setUserInteracting = useClipEngineStore((s) => s.setUserInteracting);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
      if (doubleTapTimerRef.current) clearTimeout(doubleTapTimerRef.current);
    };
  }, []);

  const mediaItems = [
    ...(clip.videoUrl ? [{ type: "video" as const, url: clip.videoUrl }] : []),
    ...(clip.images?.map((url) => ({ type: "image" as const, url })) || []),
  ];

  const handleDoubleTap = useCallback(() => {
    if (user) {
      setShowDoubleTapHeart(true);
      if (doubleTapTimerRef.current) clearTimeout(doubleTapTimerRef.current);
      doubleTapTimerRef.current = setTimeout(() => setShowDoubleTapHeart(false), 1000);
    }
  }, [user]);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await shareContent({
      title: "Regardez ce clip sur Games Trafics",
      text: clip.caption || `Clip de ${clip.author?.username}`,
      url: `${window.location.origin}/game-clips?activeClipId=${clip.id}`,
    });
    if (user && user.id !== clip.authorId) {
      shareClip(clip.id);
    }
  };

  // Improved Long press for pause
  const handleTouchStart = useCallback(() => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      setGlobalPause(true);
      setUserInteracting(true, "longpress");
    }, 400); // threshold for long press
  }, [setGlobalPause, setUserInteracting]);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    setGlobalPause(false);
    setUserInteracting(false);
  }, [setGlobalPause, setUserInteracting]);

  const handleTapCenter = useCallback(() => {
    setGlobalPause(!isGloballyPaused);
    setUserInteracting(true, "tap");
    setTimeout(() => setUserInteracting(false), 500);
  }, [isGloballyPaused, setGlobalPause, setUserInteracting]);

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full bg-black overflow-hidden group cursor-pointer"
      onMouseEnter={() => setShowControls(true)}
      onMouseMove={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      onDoubleClick={handleDoubleTap}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
    >
      {/* Background Blur */}
      <div
        className="absolute inset-0 bg-cover bg-center blur-3xl opacity-30 scale-110 pointer-events-none"
        style={{
          backgroundImage: clip.videoUrl
            ? `url(${clip.thumbnailUrl || clip.videoUrl})`
            : `url(${clip.images?.[0]})`,
        }}
      />

      {/* Media Controller */}
      <ClipMediaController
        mediaItems={mediaItems}
        isActive={isActive}
        isGloballyPaused={isGloballyPaused}
        playbackMode={playbackMode}
        muted={muted}
        onComplete={onComplete}
        onTapCenter={handleTapCenter}
        onTapLeft={onPrev}
        onTapRight={onNext}
      />

      {/* Double Tap Heart Animation */}
      <AnimatePresence>
        {showDoubleTapHeart && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1.5, opacity: 1 }}
            exit={{ scale: 2, opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-40"
          >
            <Heart className="h-24 w-24 text-white fill-white drop-shadow-2xl" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right Actions Bar */}
      <div
        className={cn(
          "absolute bottom-24 right-4 flex flex-col items-center gap-4 z-30 transition-all duration-300",
          showControls ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10",
        )}
      >
        {/* Profile */}
        <div className="relative group/avatar">
          <Avatar 
            className="h-12 w-12 border-2 border-white ring-2 ring-primary/30 shadow-2xl transition-transform active:scale-90 cursor-pointer"
            onClick={(e) => { e.stopPropagation(); router.push(`/profile/${clip.author?.id}`); }}
          >
            <AvatarImage
              src={clip.author?.profileImage || "/icons/avatar-500.png"}
            />
            <AvatarFallback className="bg-primary/20 text-primary">
              {clip.author?.username?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <button
            onClick={(e) => { e.stopPropagation(); router.push("/game-clips/create"); }}
            className="absolute -bottom-1 -right-1 bg-primary text-white p-1 rounded-full hover:scale-110 transition-transform shadow-lg border border-white z-10"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>

        {/* Like */}
        <div className="flex flex-col items-center gap-1">
          <InteractionButton
            type="like"
            entityType="GAMECLIP"
            entityId={clip.id}
            iconOnly
            withCount={false}
            variant="ghost"
            className="bg-black/40 backdrop-blur-xl rounded-full p-3 text-white hover:bg-black/60 h-12 w-12 border border-white/10 shadow-xl hover:scale-110 active:scale-95 transition-all"
          />
          <span className="text-xs font-bold text-white drop-shadow-md">
            {clip.stats?.likesCount || 0}
          </span>
        </div>

        {/* Comments */}
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCommentsToggle?.();
            }}
            className="bg-black/40 backdrop-blur-xl rounded-full p-3 text-white hover:bg-black/60 transition-all h-12 w-12 border border-white/10 shadow-xl hover:scale-110 active:scale-95"
          >
            <MessageCircle className="h-5 w-5" />
          </button>
          <span className="text-xs font-bold text-white drop-shadow-md">
            {clip.stats?.commentsCount || 0}
          </span>
        </div>

        {/* Share */}
        <button
          onClick={handleShare}
          disabled={isSharing}
          className="bg-black/40 backdrop-blur-xl rounded-full p-3 text-white hover:bg-black/60 transition-all h-12 w-12 border border-white/10 shadow-xl hover:scale-110 active:scale-95 disabled:opacity-50"
        >
          <Share2 className={cn("h-5 w-5", isSharing && "animate-spin")} />
        </button>

        {/* Bookmark */}
        <InteractionButton
          type="bookmark"
          entityType="GAMECLIP"
          entityId={clip.id}
          iconOnly
          variant="ghost"
          className="bg-black/40 backdrop-blur-xl text-white rounded-full p-3 hover:bg-black/60 h-12 w-12 border border-white/10 shadow-xl hover:scale-110 active:scale-95 transition-all"
        />

        {/* Volume */}
        <button
          onClick={(e) => { e.stopPropagation(); toggleMute(); }}
          className="bg-black/40 backdrop-blur-xl rounded-full p-3 text-white hover:bg-black/60 transition-all h-12 w-12 border border-white/10 shadow-xl hover:scale-110 active:scale-95"
        >
          {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>
      </div>

      {/* Bottom Info Overlay */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 p-6 pb-10 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white transition-opacity duration-500 pointer-events-none",
          showControls ? "opacity-100" : "opacity-0",
        )}
      >
        <div className="max-w-[80%] pointer-events-auto">
          {/* Author */}
          <div
            className="flex items-center gap-2 mb-3 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={(e) => { e.stopPropagation(); router.push(`/profile/${clip.author?.id}`); }}
          >
            <Typography variant="body-base" className="font-bold text-white flex items-center gap-2">
              @{clip.author?.username}
              {clip.authorId === user?.id && (
                <span className="bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded-full border border-primary/30 font-bold uppercase">
                  Toi
                </span>
              )}
            </Typography>
          </div>

          {/* Caption */}
          {clip.caption && (
            <Typography
              variant="body-sm"
              className="line-clamp-2 mb-3 text-white/90 leading-relaxed"
            >
              {clip.caption}
            </Typography>
          )}

          {/* Game Tag */}
          {clip.game && (
            <div 
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/20 transition-colors cursor-pointer"
              onClick={(e) => { e.stopPropagation(); router.push(`/games/${clip.game?.id}`); }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {clip.game.name}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Tap micro-animation */}
      <AnimatePresence>
        {isGloballyPaused && isActive && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.2, opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
          >
            <div className="p-4 rounded-full bg-black/20 backdrop-blur-sm border border-white/10">
               <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
                  <Play className="h-10 w-10 text-white/50 fill-white/20" />
               </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}