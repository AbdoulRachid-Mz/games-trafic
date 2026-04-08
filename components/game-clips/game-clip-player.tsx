// @/components/game-clips/game-clip-player.tsx
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { InteractionButton } from "@/components/shared/interaction-button";
import {
  MessageCircle,
  Share2,
  Play,
  Pause,
  Heart,
  Plus,
  Home,
  Volume2,
  VolumeX,
  Maximize2,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import { shareContent } from "@/lib/share";
import { GameClipCard } from "@/types/view-models";
import { useGameClips } from "@/hooks/use-game-clips";
import { useAuthContext } from "@/contexts/auth-context";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useDoubleTap } from "@/hooks/use-double-tap";
import { useLongPress } from "@/hooks/use-long-press";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { useGameClipsPlayer } from "@/hooks/use-game-clips-player";
import { useGameClipsStore } from "@/stores/game-clips-store";
import { Slider } from "@/components/ui/slider";

interface GameClipPlayerProps {
  clip: GameClipCard;
  isActive: boolean;
  onAutoNext?: () => void;
  onAutoPrev?: () => void;
  onCommentsToggle?: () => void;
}

const IMAGE_DURATION = 4000; // 4 secondes par image

// @/components/game-clips/game-clip-player.tsx
// ... imports ...

export function GameClipPlayer({
  clip,
  isActive,
  onAutoNext,
  onAutoPrev,
  onCommentsToggle,
}: GameClipPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageTimerRef = useRef<NodeJS.Timeout | null>(null);
  const imageStartTimeRef = useRef<number>(0);
  
  const [progress, setProgress] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const [showDoubleTapHeart, setShowDoubleTapHeart] = useState(false);
  const [showVideoControls, setShowVideoControls] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const { shareClip, isSharing } = useGameClips();
  const { user } = useAuthContext();
  const router = useRouter();
  const { commentSheetOpen, setCommentSheetOpen } = useGameClipsStore();

  const {
    videoRef,
    isPlaying,
    togglePlayPause,
    handleAreaClick,
    isMuted,
    toggleMute,
  } = useGameClipsPlayer({
    clipId: clip.id,
    isActive,
    onAutoNext,
    onAutoPrev,
  });

  const isVideo = !!clip.videoUrl;
  const hasImages = clip.images && clip.images.length > 0;
  const totalMediaItems = hasImages ? clip.images!.length : 1;

  // Reset quand le clip change
  useEffect(() => {
    setCurrentImageIndex(0);
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
    
    if (imageTimerRef.current) {
      clearInterval(imageTimerRef.current);
      imageTimerRef.current = null;
    }
  }, [clip.id]);

  // Timer pour les images
  useEffect(() => {
    if (imageTimerRef.current) {
      clearInterval(imageTimerRef.current);
      imageTimerRef.current = null;
    }

    if (!isVideo && isActive && isPlaying && hasImages) {
      imageStartTimeRef.current = Date.now() - (progress / 100) * IMAGE_DURATION;
      
      imageTimerRef.current = setInterval(() => {
        const elapsed = Date.now() - imageStartTimeRef.current;
        const percent = (elapsed / IMAGE_DURATION) * 100;

        if (percent >= 100) {
          if (currentImageIndex < totalMediaItems - 1) {
            setCurrentImageIndex(prev => prev + 1);
            setProgress(0);
            imageStartTimeRef.current = Date.now();
          } else if (onAutoNext && isPlaying) {
            onAutoNext();
          }
        } else {
          setProgress(percent);
        }
      }, 50);
    }

    return () => {
      if (imageTimerRef.current) {
        clearInterval(imageTimerRef.current);
        imageTimerRef.current = null;
      }
    };
  }, [isVideo, isActive, isPlaying, hasImages, currentImageIndex, totalMediaItems, onAutoNext, progress]);

  // Mise à jour de la progression vidéo
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && isPlaying && isVideo && videoRef.current) {
      interval = setInterval(() => {
        const current = videoRef.current?.currentTime || 0;
        const dur = videoRef.current?.duration || 0;
        const p = dur > 0 ? (current / dur) * 100 : 0;
        setProgress(p);
        setCurrentTime(current);
        setDuration(dur);
      }, 100);
    }

    return () => clearInterval(interval);
  }, [isActive, isPlaying, isVideo]);

  // Double tap pour like
  const handleDoubleTap = useCallback(() => {
    if (user) {
      setShowDoubleTapHeart(true);
      setTimeout(() => setShowDoubleTapHeart(false), 1000);
    }
  }, [user]);

  const doubleTapHandlers = useDoubleTap(handleDoubleTap, 300);

  // Long press pour pause
  const handleLongPressStart = useCallback(() => {
    useGameClipsStore.getState().setGlobalPause(true);
  }, []);

  const handleLongPressEnd = useCallback(() => {
    useGameClipsStore.getState().setGlobalPause(false);
  }, []);

  const longPressHandlers = useLongPress(handleLongPressStart, handleLongPressEnd, 500);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await shareContent({
      title: "Regardez ce clip sur Games Trafics",
      text: clip.caption || `Clip de ${clip.author?.username} `,
      url: `${window.location.origin}/game-clips?activeClipId=${clip.id}`,
    });
    if (user && user.id !== clip.authorId) {
      shareClip(clip.id);
    }
  };

  const handleVideoSeek = (value: number[]) => {
    if (videoRef.current && duration > 0) {
      const newTime = (value[0] / 100) * duration;
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      setProgress(value[0]);
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Combiner les handlers de long press avec les handlers personnalisés
  const combinedMouseLeave = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    setShowControls(false);
    setShowVideoControls(false);
    longPressHandlers.onMouseLeave?.(e);
  }, [longPressHandlers.onMouseLeave]);

  const combinedMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    longPressHandlers.onMouseDown?.(e);
  }, [longPressHandlers.onMouseDown]);

  const combinedMouseUp = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    longPressHandlers.onMouseUp?.(e);
  }, [longPressHandlers.onMouseUp]);

  const combinedTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    longPressHandlers.onTouchStart?.(e);
  }, [longPressHandlers.onTouchStart]);

  const combinedTouchEnd = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    longPressHandlers.onTouchEnd?.(e);
  }, [longPressHandlers.onTouchEnd]);

  const combinedTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    longPressHandlers.onTouchMove?.(e);
  }, [longPressHandlers.onTouchMove]);

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full bg-black flex items-center justify-center overflow-hidden group"
      onClick={handleAreaClick}
      onMouseEnter={() => setShowControls(true)}
      onMouseMove={() => setShowControls(true)}
      onMouseLeave={combinedMouseLeave}
      onMouseDown={combinedMouseDown}
      onMouseUp={combinedMouseUp}
      onTouchStart={combinedTouchStart}
      onTouchEnd={combinedTouchEnd}
      onTouchMove={combinedTouchMove}
      onDoubleClick={doubleTapHandlers}
    >
      {/* Reste du contenu inchangé... */}
      {/* Background Blur */}
      <div
        className="absolute inset-0 bg-cover bg-center blur-3xl opacity-30 scale-110 pointer-events-none transition-opacity duration-500"
        style={{
          backgroundImage: isVideo
            ? `url(${clip.thumbnailUrl || clip.videoUrl})`
            : hasImages
              ? `url(${clip.images?.[currentImageIndex]})`
              : 'none'
        }}
      />

      {/* Content */}
      <div className="relative z-10 h-full w-full flex items-center justify-center">
        {isVideo ? (
          <video
            ref={videoRef}
            src={clip.videoUrl || ""}
            className="h-full w-full object-contain"
            loop={false}
            playsInline
            onClick={(e) => e.stopPropagation()}
          />
        ) : hasImages ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentImageIndex}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="relative h-full w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={clip.images?.[currentImageIndex] || ""}
                alt={`Image ${currentImageIndex + 1}`}
                fill
                className="object-contain"
                priority={currentImageIndex === 0}
              />
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center max-w-md">
            <Typography variant="h3" className="text-white font-bold mb-4 drop-shadow-lg">
              {clip.caption}
            </Typography>
          </div>
        )}
      </div>

      {/* Progress Bars */}
      {hasImages && clip.images && clip.images.length > 0 && (
        <div className="absolute top-4 left-4 right-4 z-30 flex gap-1">
          {clip.images.map((_, idx) => (
            <div
              key={idx}
              className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden"
            >
              <motion.div
                className="h-full bg-white"
                initial={{ width: "0%" }}
                animate={{
                  width: idx === currentImageIndex
                    ? `${progress}%`
                    : idx < currentImageIndex
                      ? "100%"
                      : "0%"
                }}
                transition={{ duration: 0.1, ease: "linear" }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Video Progress Bar */}
      {isVideo && (
        <div 
          className="absolute top-0 left-0 right-0 z-30 cursor-pointer"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="h-1 w-full bg-white/20">
            <div
              className="h-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.8)] relative"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Video Controls */}
      {isVideo && showVideoControls && isActive && (
        <div 
          className="absolute bottom-20 left-4 right-4 z-30 bg-black/60 backdrop-blur-xl rounded-2xl p-4 space-y-2"
          onClick={(e) => e.stopPropagation()}
        >
          <Slider
            value={[progress]}
            onValueChange={handleVideoSeek}
            max={100}
            step={0.1}
            className="cursor-pointer"
          />
          <div className="flex items-center justify-between text-white/80 text-xs">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          <div className="flex items-center justify-center gap-4">
            <Button
              size="sm"
              variant="ghost"
              onClick={togglePlayPause}
              className="text-white hover:bg-white/20"
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={toggleMute}
              className="text-white hover:bg-white/20"
            >
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      )}

      {/* Double Tap Heart Animation */}
      <AnimatePresence>
        {showDoubleTapHeart && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1.5, opacity: 1 }}
            exit={{ scale: 2, opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-40"
          >
            <Heart className="h-24 w-24 text-white fill-white drop-shadow-2xl" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Play/Pause Overlay */}
      <AnimatePresence>
        {!isPlaying && isVideo && showControls && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
          >
            <div className="bg-black/60 backdrop-blur-xl rounded-full p-8 border-2 border-white/20 shadow-2xl">
              <Play className="h-12 w-12 text-white fill-white" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Hints */}
      {showControls && isPlaying && (
        <>
          <div className="absolute left-2 top-1/2 -translate-y-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-black/60 backdrop-blur-xl rounded-full p-3 border border-white/20">
              <span className="text-white text-sm font-bold">←</span>
            </div>
          </div>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-black/60 backdrop-blur-xl rounded-full p-3 border border-white/20">
              <span className="text-white text-sm font-bold">→</span>
            </div>
          </div>
        </>
      )}

      {/* Right Side Actions - Toujours visibles sur mobile */}
      <div
        className={cn(
          "absolute right-4 bottom-24 flex flex-col gap-4 z-30",
          "transition-all duration-300",
          showControls ? "opacity-100 translate-x-0" : "opacity-70 translate-x-0"
        )}
      >
        {/* Profile/Author */}
        <div className="relative mb-2 action-button">
          <Avatar className="h-14 w-14 border-2 border-white ring-4 ring-primary/30 shadow-2xl">
            <AvatarImage src={clip.author?.profileImage || ""} />
            <AvatarFallback className="bg-primary/20 text-primary text-xl">
              {clip.author?.username?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <button
            onClick={() => router.push("/game-clips?create=true")}
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-primary text-white p-1 rounded-full hover:scale-110 transition-transform shadow-xl border-2 border-white action-button"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Like */}
        <div className="flex flex-col items-center gap-1 action-button">
          <InteractionButton
            type="like"
            entityType="GAMECLIP"
            entityId={clip.id}
            iconOnly
            withCount={false}
            variant="ghost"
            className="bg-black/60 backdrop-blur-xl rounded-full text-white p-4 hover:bg-black/80 h-14 w-14 border-2 border-white/20 shadow-2xl hover:scale-110 transition-all"
          />
          <span className="text-xs font-bold text-white bg-black/60 backdrop-blur-xl px-2 py-1 rounded-full border border-white/20">
            {clip.stats?.likesCount || 0}
          </span>
        </div>

        {/* Comments */}
        <div className="flex flex-col items-center gap-1 action-button">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCommentsToggle?.();
              setCommentSheetOpen(!commentSheetOpen);
            }}
            className="bg-black/60 backdrop-blur-xl rounded-full p-4 text-white hover:bg-black/80 transition-all h-14 w-14 border-2 border-white/20 shadow-2xl hover:scale-110"
          >
            <MessageCircle className="h-5 w-5" />
          </button>
          <span className="text-xs font-bold text-white bg-black/60 backdrop-blur-xl px-2 py-1 rounded-full border border-white/20">
            {clip.stats?.commentsCount || 0}
          </span>
        </div>

        {/* Share */}
        <div className="flex flex-col items-center gap-1 action-button">
          <button
            onClick={handleShare}
            disabled={isSharing}
            className="bg-black/60 backdrop-blur-xl rounded-full p-4 text-white hover:bg-black/80 transition-all h-14 w-14 border-2 border-white/20 shadow-2xl hover:scale-110 disabled:opacity-50"
          >
            <Share2 className={cn("h-5 w-5", isSharing && "animate-spin")} />
          </button>
        </div>

        {/* Bookmark */}
        <div className="flex flex-col items-center gap-1 action-button">
          <InteractionButton
            type="bookmark"
            entityType="GAMECLIP"
            entityId={clip.id}
            iconOnly
            variant="ghost"
            className="bg-black/60 backdrop-blur-xl rounded-full p-4 hover:bg-black/80 h-14 w-14 border-2 border-white/20 shadow-2xl hover:scale-110 transition-all"
          />
        </div>

        {/* Volume/Mute button for video */}
        {isVideo && (
          <div className="flex flex-col items-center gap-1 action-button">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleMute();
              }}
              className="bg-black/60 backdrop-blur-xl rounded-full p-4 text-white hover:bg-black/80 transition-all h-14 w-14 border-2 border-white/20 shadow-2xl hover:scale-110"
            >
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>
          </div>
        )}

        {/* Video Controls button */}
        {isVideo && (
          <div className="flex flex-col items-center gap-1 action-button">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowVideoControls(!showVideoControls);
              }}
              className="bg-black/60 backdrop-blur-xl rounded-full p-4 text-white hover:bg-black/80 transition-all h-14 w-14 border-2 border-white/20 shadow-2xl hover:scale-110"
            >
              <Maximize2 className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Back home button */}
        <div className="flex flex-col items-center gap-1 action-button">
          <Button
            onClick={() => router.push(`/`)}
            className="bg-black/60 backdrop-blur-xl rounded-full p-4 text-white hover:bg-black/80 transition-all h-14 w-14 border-2 border-white/20 shadow-2xl hover:scale-110"
          >
            <Home className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Bottom Info */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/95 via-black/70 to-transparent text-white transition-opacity duration-500 pointer-events-none",
          showControls ? "opacity-100" : "opacity-0"
        )}
      >
        <div className="flex items-end justify-between">
          <div className="flex-1 pointer-events-auto">
            {/* Author */}
            <div 
              className="flex items-center gap-3 mb-3 cursor-pointer hover:opacity-80 transition-opacity" 
              onClick={() => router.push(`/profile/${clip.author?.id}`)}
            >
              <Avatar className="h-12 w-12 border-2 border-primary/50 ring-4 ring-primary/20">
                <AvatarImage src={clip.author?.profileImage || ""} />
                <AvatarFallback className="bg-primary/20 text-primary">
                  {clip.author?.username?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <Typography variant="body-base" className="font-bold text-white">
                    @{clip.author?.username}
                  </Typography>
                  {clip.authorId === user?.id && (
                    <span className="bg-primary/20 text-primary text-[8px] px-2 py-1 rounded-full border border-primary/30 font-bold uppercase tracking-wider">
                      Toi
                    </span>
                  )}
                </div>
                <Typography variant="caption1" className="text-white/60">
                  {clip.createdAt
                    ? new Date(clip.createdAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short'
                    })
                    : ''}
                </Typography>
              </div>
            </div>

            {/* Caption */}
            {clip.caption && (
              <Typography
                variant="body-sm"
                className="line-clamp-2 mb-3 text-white/90 max-w-lg"
              >
                {clip.caption}
              </Typography>
            )}

            {/* Game */}
            {clip.game && (
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-xl px-4 py-2 rounded-full border border-white/20">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  {clip.game.name}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}