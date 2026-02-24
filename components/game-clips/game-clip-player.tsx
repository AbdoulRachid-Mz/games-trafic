// @/components/game-clips/game-clip-player.tsx
"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { InteractionButton } from "@/components/shared/interaction-button";
import {
  MessageCircle,
  Share2,
  Play,
  Pause,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  Heart,
  Plus,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import { shareContent } from "@/lib/share";
import { GameClipWithRelations } from "@/types/game-clips";
import { useGameClips } from "@/hooks/use-game-clips";
import { useAuthContext } from "@/contexts/auth-context";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useDoubleTap } from "@/hooks/use-double-tap";
import { useLongPress } from "@/hooks/use-long-press";
import { useRouter } from "next/navigation";

interface GameClipPlayerProps {
  clip: GameClipWithRelations;
  isActive: boolean;
  isMuted?: boolean;
  onMuteToggle?: () => void;
  onAutoNext?: () => void;
  onAutoPrev?: () => void;
  onCommentsToggle?: () => void;
  hasMore?: boolean;
  isPaused?: boolean;
}

export function GameClipPlayer({
  clip,
  isActive,
  isMuted,
  onMuteToggle,
  onAutoNext,
  onAutoPrev,
  onCommentsToggle,
  hasMore,
  isPaused = false,
}: GameClipPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const [showDoubleTapHeart, setShowDoubleTapHeart] = useState(false);

  const { shareClip, isSharing } = useGameClips();
  const { user } = useAuthContext();
  const router = useRouter();

  const isVideo = !!clip.videoUrl;
  const hasImages = clip.images && clip.images.length > 0;
  const totalMediaItems = hasImages ? clip.images!.length : 1;

  // Auto-play when active
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isActive) {
      if (isVideo && videoRef.current) {
        // Video playback is now controlled by the isPaused useEffect
        videoRef.current.currentTime = 0; // Reset video on activation
        videoRef.current.muted = !!isMuted;
      } else if (!isVideo) {
        // Auto-advance for images/text
        setProgress(0);
        timer = setTimeout(() => {
          if (currentImageIndex < totalMediaItems - 1) {
            setCurrentImageIndex(prev => prev + 1);
          } else if (onAutoNext) {
            onAutoNext();
          }
        }, 5000); // 5 seconds per image
      }
    } else {
      if (isVideo) {
        videoRef.current?.pause();
        setIsPlaying(false);
      }
      setProgress(0);
      setCurrentImageIndex(0);
    }

    return () => clearTimeout(timer);
  }, [isActive, isMuted, isVideo, currentImageIndex, totalMediaItems, onAutoNext]);

  // Control video playback based on isActive and isPaused
  useEffect(() => {
    if (isVideo && videoRef.current) {
      if (isActive && !isPaused) {
        videoRef.current.muted = !!isMuted; // Ensure mute state is applied
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
        }
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, [isActive, isPaused, isVideo, isMuted]);


  // Progress tracking for videos
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && isPlaying && isVideo && videoRef.current) {
      interval = setInterval(() => {
        const current = videoRef.current?.currentTime || 0;
        const duration = videoRef.current?.duration || 1;
        const p = (current / duration) * 100;
        setProgress(p);

        if (p >= 99.5 && onAutoNext) {
          onAutoNext();
        }
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isActive, isPlaying, isVideo, onAutoNext]);

  const togglePlay = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isVideo && videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isVideo, isPlaying]);

  // Handle click/tap navigation for images
  const handleMediaClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();

    // Get click position relative to container
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const isRightSide = x > rect.width / 2;

    if (hasImages) {
      if (isRightSide) {
        // Next image
        if (currentImageIndex < clip.images!.length - 1) {
          setCurrentImageIndex(prev => prev + 1);
        } else if (onAutoNext) {
          onAutoNext();
        }
      } else {
        // Previous image
        if (currentImageIndex > 0) {
          setCurrentImageIndex(prev => prev - 1);
        } else if (onAutoPrev) {
          onAutoPrev();
        }
      }
    } else if (isVideo) {
      togglePlay(e);
    }
  }, [hasImages, clip.images, currentImageIndex, onAutoNext, onAutoPrev, togglePlay, isVideo]);

  // Double tap to like
  const handleDoubleTap = useCallback(() => {
    if (user) {
      setShowDoubleTapHeart(true);
      setTimeout(() => setShowDoubleTapHeart(false), 1000);
      // Trigger like via InteractionButton will be handled by the component
    }
  }, [user]);

  const doubleTapHandlers = useDoubleTap(handleDoubleTap, 300);

  // Long press to pause
  const handleLongPress = useCallback(() => {
    if (isVideo) {
      togglePlay();
    }
  }, [isVideo, togglePlay]);

  const longPressHandlers = useLongPress(handleLongPress, 500);

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

  const formatDuration = (seconds: number | null | undefined) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full bg-black flex items-center justify-center overflow-hidden group cursor-pointer"
      onClick={handleMediaClick}
      onMouseEnter={() => setShowControls(true)}
      // @ts-ignore
      onMouseLeave={() => setIsHovering(false)}
      {...doubleTapHandlers}
      {...longPressHandlers}
    >
      {/* Background Blur */}
      <div
        className="absolute inset-0 bg-cover bg-center blur-3xl opacity-30 scale-110 pointer-events-none"
        style={{
          backgroundImage: isVideo
            ? `url(${clip.thumbnailUrl || clip.videoUrl})`
            : hasImages
              ? `url(${clip.images?.[currentImageIndex]})`
              : 'none'
        }}
      />

      {/* Content */}
      <div className="relative z-0 h-full w-full flex items-center justify-center">
        {isVideo ? (
          <video
            ref={videoRef}
            src={clip.videoUrl || ""}
            className="h-full w-full object-contain"
            loop={!onAutoNext}
            playsInline
            muted={isMuted}
            onEnded={() => onAutoNext?.()}
          />
        ) : hasImages ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentImageIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative h-full w-full"
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

      {/* Progress Bars - Instagram Stories Style */}
      {/* Progress Bars - Dynamique selon le nombre d'images */}
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
        <div className="absolute top-0 left-0 right-0 z-30">
          <div className="h-1 w-full bg-white/20">
            <motion.div
              className="h-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.8)]"
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.1, ease: "linear" }}
            />
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
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-40"
          >
            <Heart className="h-24 w-24 text-white fill-white drop-shadow-2xl" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Play/Pause Overlay for Video */}
      <AnimatePresence>
        {!isPlaying && isVideo && showControls && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
          >
            <div className="bg-black/40 backdrop-blur-sm rounded-full p-8 border border-white/10">
              <Play className="h-12 w-12 text-white fill-white" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Hints for Images */}
      {hasImages && clip.images && clip.images.length > 1 && showControls && (
        <>
          <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20">
            <div className="bg-black/40 backdrop-blur-sm rounded-full p-2 border border-white/10">
              <ChevronLeft className="h-6 w-6 text-white/70" />
            </div>
          </div>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20">
            <div className="bg-black/40 backdrop-blur-sm rounded-full p-2 border border-white/10">
              <ChevronRight className="h-6 w-6 text-white/70" />
            </div>
          </div>
        </>
      )}

      {/* Right Side Actions */}
      <div
        className={cn(
          "absolute right-4 bottom-24 flex flex-col gap-4 z-30 transition-opacity duration-300",
          showControls || isHovering ? "opacity-100" : "opacity-0 md:opacity-0"
        )}
      >
        {/* Mute/Unmute for Video */}
        {isVideo && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMuteToggle?.();
            }}
            className="bg-black/40 backdrop-blur-md rounded-full p-3 text-white hover:bg-black/60 transition-colors border border-white/10"
          >
            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>
        )}

        {/* Like */}
        <div className="flex flex-col items-center gap-1">
          <InteractionButton
            type="like"
            entityType="GAMECLIP"
            entityId={clip.id}
            iconOnly
            withCount={false}
            variant="ghost"
            className="bg-black/40 backdrop-blur-md rounded-full text-white p-3 hover:bg-black/60 h-12 w-12 border border-white/10"
          />
          <span className="text-xs font-medium text-white">
            {clip.likesCount}
          </span>
        </div>

        {/* Comments */}
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCommentsToggle?.();
            }}
            className="bg-black/40 backdrop-blur-md rounded-full p-3 text-white hover:bg-black/60 transition-colors h-12 w-12 border border-white/10"
          >
            <MessageCircle className="h-5 w-5" />
          </button>
          <span className="text-xs font-medium text-white">
            {clip.commentsCount}
          </span>
        </div>

        {/* Share */}
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={handleShare}
            disabled={isSharing}
            className="bg-black/40 backdrop-blur-md rounded-full p-3 text-white hover:bg-black/60 transition-colors h-12 w-12 border border-white/10 disabled:opacity-50"
          >
            <Share2 className={cn("h-5 w-5", isSharing && "animate-pulse")} />
          </button>
          {/* <span className="text-xs font-medium text-white">
            {clip.sharesCount || 0}
          </span> */}
        </div>

        {/* Bookmark */}
        <div className="flex flex-col items-center gap-1">
          <InteractionButton
            type="bookmark"
            entityType="GAMECLIP"
            entityId={clip.id}
            iconOnly
            variant="ghost"
            className="bg-black/40 backdrop-blur-md rounded-full p-3 hover:bg-black/60 h-12 w-12 border border-white/10"
          />
        </div>
      </div>

      {/* Bottom Info */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/95 via-black/60 to-transparent text-white transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0"
        )}
      >
        <div className="flex items-end justify-between">
          <div className="flex-1">
            {/* Actions overlay - Right side */}
            <div className="absolute right-4 bottom-24 flex flex-col items-center gap-6 z-30">
              {/* Profile/Author */}
              <div className="relative mb-2">
                <Avatar className="h-12 w-12 border-2 border-white ring-2 ring-primary/20">
                  <AvatarImage src={clip.author?.profileImage || ""} />
                  <AvatarFallback className="bg-primary/20 text-primary">
                    {clip.author?.username?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={() => router.push("/game-clips?create=true")}
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-primary text-white p-0.5 rounded-full hover:scale-110 transition-transform"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {/* Like */}
            </div>
            {/* Author */}
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="h-10 w-10 border-2 border-primary/50">
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
                    <span className="bg-primary/20 text-primary text-[8px] px-1.5 py-0.5 rounded-full border border-primary/30 font-bold uppercase tracking-wider">
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
                className="line-clamp-2 mb-2 text-white/90"
              >
                {clip.caption}
              </Typography>
            )}

            {/* Game */}
            {clip.game && (
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  {clip.game.name}
                </span>
              </div>
            )}
          </div>

          {/* Video Duration */}
          {isVideo && clip.duration && (
            <div className="text-xs font-mono text-white/60 bg-black/40 px-2 py-1 rounded border border-white/10">
              {formatDuration(clip.duration)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}