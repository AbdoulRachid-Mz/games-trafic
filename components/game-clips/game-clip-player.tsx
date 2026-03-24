// @/components/game-clips/game-clip-player.tsx
"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { InteractionButton } from "@/components/shared/interaction-button";
import {
  MessageCircle,
  Share2,
  Play,
  Pause,
  Heart,
  Plus,
  Home,
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

interface GameClipPlayerProps {
  clip: GameClipCard;
  isActive: boolean;
  isMuted?: boolean;
  onMuteToggle?: () => void;
  onAutoNext?: () => void;
  onAutoPrev?: () => void;
  onCommentsToggle?: () => void;
  hasMore?: boolean;
  isPaused?: boolean;
}

const IMAGE_DURATION = 4000; // 4 secondes par image

export function GameClipPlayer({
  clip,
  isActive,
  isMuted,
  onMuteToggle,
  onAutoNext,
  onAutoPrev,
  onCommentsToggle,
  isPaused = false,
}: GameClipPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageTimerRef = useRef<NodeJS.Timeout | null>(null);
  const imageStartTimeRef = useRef<number>(0);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [showDoubleTapHeart, setShowDoubleTapHeart] = useState(false);
  const [localPaused, setLocalPaused] = useState(false); // État de pause locale (long press)

  const { shareClip, isSharing } = useGameClips();
  const { user } = useAuthContext();
  const router = useRouter();

  const isVideo = !!clip.videoUrl;
  const hasImages = clip.images && clip.images.length > 0;
  const totalMediaItems = hasImages ? clip.images!.length : 1;

  // Pause effective = pause externe OU pause locale
  const effectivePaused = isPaused || localPaused;

  // Reset quand le clip change
  useEffect(() => {
    setCurrentImageIndex(0);
    setProgress(0);
    setLocalPaused(false);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
    
    // Nettoyer le timer d'images
    if (imageTimerRef.current) {
      clearInterval(imageTimerRef.current);
      imageTimerRef.current = null;
    }
  }, [clip.id]);

  // Gestion centralisée de la lecture vidéo
  useEffect(() => {
    if (isVideo && videoRef.current) {
      if (isActive && !effectivePaused) {
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => setIsPlaying(true))
            .catch(() => setIsPlaying(false));
        }
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, [isActive, effectivePaused, isVideo]);

  // Gestion de la fin de vidéo via onended
  useEffect(() => {
    if (isVideo && videoRef.current) {
      const handleEnded = () => {
        if (isActive && onAutoNext && !effectivePaused) {
          onAutoNext();
        }
      };
      
      videoRef.current.addEventListener('ended', handleEnded);
      return () => {
        videoRef.current?.removeEventListener('ended', handleEnded);
      };
    }
  }, [isVideo, isActive, onAutoNext, effectivePaused]);

  // Mise à jour du mute
  useEffect(() => {
    if (isVideo && videoRef.current) {
      videoRef.current.muted = !!isMuted;
    }
  }, [isMuted, isVideo]);

  // Timer pour les images basé sur le temps réel
  useEffect(() => {
    // Nettoyer l'ancien timer
    if (imageTimerRef.current) {
      clearInterval(imageTimerRef.current);
      imageTimerRef.current = null;
    }

    // Démarrer le timer uniquement si conditions remplies
    if (!isVideo && isActive && !effectivePaused && hasImages) {
      imageStartTimeRef.current = Date.now() - (progress / 100) * IMAGE_DURATION;
      
      imageTimerRef.current = setInterval(() => {
        const elapsed = Date.now() - imageStartTimeRef.current;
        const percent = (elapsed / IMAGE_DURATION) * 100;

        if (percent >= 100) {
          // Image suivante
          if (currentImageIndex < totalMediaItems - 1) {
            setCurrentImageIndex(prev => prev + 1);
            setProgress(0);
            imageStartTimeRef.current = Date.now();
          } else {
            // Dernière image → clip suivant
            if (onAutoNext && !effectivePaused) {
              onAutoNext();
            }
          }
        } else {
          setProgress(percent);
        }
      }, 50); // Mise à jour 20 fois par seconde pour fluidité
    }

    return () => {
      if (imageTimerRef.current) {
        clearInterval(imageTimerRef.current);
        imageTimerRef.current = null;
      }
    };
  }, [isVideo, isActive, effectivePaused, hasImages, currentImageIndex, totalMediaItems, onAutoNext]);

  // Progress tracking pour vidéos (uniquement pour l'affichage)
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && isPlaying && isVideo && videoRef.current) {
      interval = setInterval(() => {
        const current = videoRef.current?.currentTime || 0;
        const duration = videoRef.current?.duration || 1;
        const p = (current / duration) * 100;
        setProgress(p);
      }, 100);
    }

    return () => clearInterval(interval);
  }, [isActive, isPlaying, isVideo]);

  // Gestion du clic pour navigation images
  const handleMediaClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();

    // Ne pas naviguer si en pause
    if (effectivePaused) return;

    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const isRightSide = x > rect.width / 2;

    if (hasImages) {
      if (isRightSide) {
        // Image suivante
        if (currentImageIndex < totalMediaItems - 1) {
          setCurrentImageIndex(prev => prev + 1);
          setProgress(0);
          imageStartTimeRef.current = Date.now();
          
          // Pause temporaire pour éviter le double trigger
          setLocalPaused(true);
          setTimeout(() => setLocalPaused(false), 100);
        } else if (onAutoNext) {
          onAutoNext();
        }
      } else {
        // Image précédente
        if (currentImageIndex > 0) {
          setCurrentImageIndex(prev => prev - 1);
          setProgress(0);
          imageStartTimeRef.current = Date.now();
          
          // Pause temporaire pour éviter le double trigger
          setLocalPaused(true);
          setTimeout(() => setLocalPaused(false), 100);
        } else if (onAutoPrev) {
          onAutoPrev();
        }
      }
    } else if (isVideo) {
      // Pour vidéo, on utilise le bouton pause dédié
      // Donc on ne fait rien ici
    }
  }, [hasImages, isVideo, currentImageIndex, totalMediaItems, onAutoNext, onAutoPrev, effectivePaused]);

  // Double tap pour like
  const handleDoubleTap = useCallback(() => {
    if (user) {
      setShowDoubleTapHeart(true);
      setTimeout(() => setShowDoubleTapHeart(false), 1000);
    }
  }, [user]);

  const doubleTapHandlers = useDoubleTap(handleDoubleTap, 300);

  // Long press avec gestion start/end
  const handleLongPressStart = useCallback(() => {
    setLocalPaused(true);
  }, []);

  const handleLongPressEnd = useCallback(() => {
    setLocalPaused(false);
  }, []);

  const longPressHandlers = useLongPress(handleLongPressStart, handleLongPressEnd, 500);
  const {
    onMouseDown,
    onMouseUp,
    onMouseLeave: longPressMouseLeave,
    onTouchStart,
    onTouchEnd,
    onTouchMove,
  } = longPressHandlers;

  // Pause button handler
  const handlePauseToggle = useCallback(() => {
    setLocalPaused(prev => !prev);
  }, []);

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
      onMouseMove={() => {
        setShowControls(true);
        setIsHovering(true);
      }}
      onMouseLeave={(e) => {
        setShowControls(false);
        setIsHovering(false);
        longPressMouseLeave?.(e);
      }}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onTouchMove={onTouchMove}
      onDoubleClick={doubleTapHandlers}
    >

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
            muted={isMuted}
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
            transition={{ duration: 0.5 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-40"
          >
            <Heart className="h-24 w-24 text-white fill-white drop-shadow-2xl" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Play/Pause Overlay */}
      <AnimatePresence>
        {!isPlaying && isVideo && (showControls || isHovering) && (
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

      {/* Pause Indicator (quand en pause manuelle) */}
      <AnimatePresence>
        {effectivePaused && (showControls || isHovering) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
          >
            <div className="bg-black/60 backdrop-blur-xl rounded-full p-8 border-2 border-white/20 shadow-2xl">
              <Pause className="h-12 w-12 text-white fill-white" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Hints */}
      {hasImages && clip.images && clip.images.length > 1 && showControls && !effectivePaused && (
        <>
          <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20">
            <div className="bg-black/60 backdrop-blur-xl rounded-full p-4 border-2 border-white/20 shadow-2xl">
              <span className="text-white text-sm font-bold">←</span>
            </div>
          </div>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20">
            <div className="bg-black/60 backdrop-blur-xl rounded-full p-4 border-2 border-white/20 shadow-2xl">
              <span className="text-white text-sm font-bold">→</span>
            </div>
          </div>
        </>
      )}

      {/* Right Side Actions */}
      <div
        className={cn(
          "absolute right-4 bottom-24 flex flex-col gap-4 z-30 transition-all duration-300",
          showControls || isHovering ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
        )}
      >
        {/* Profile/Author */}
        <div className="relative mb-2">
          <Avatar className="h-14 w-14 border-2 border-white ring-4 ring-primary/30 shadow-2xl">
            <AvatarImage src={clip.author?.profileImage || ""} />
            <AvatarFallback className="bg-primary/20 text-primary text-xl">
              {clip.author?.username?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <button
            onClick={() => router.push("/game-clips?create=true")}
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-primary text-white p-1 rounded-full hover:scale-110 transition-transform shadow-xl border-2 border-white"
          >
            <Plus className="h-4 w-4" />
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
            className="bg-black/60 backdrop-blur-xl rounded-full text-white p-4 hover:bg-black/80 h-14 w-14 border-2 border-white/20 shadow-2xl hover:scale-110 transition-all"
          />
          <span className="text-xs font-bold text-white bg-black/60 backdrop-blur-xl px-2 py-1 rounded-full border border-white/20">
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
            className="bg-black/60 backdrop-blur-xl rounded-full p-4 text-white hover:bg-black/80 transition-all h-14 w-14 border-2 border-white/20 shadow-2xl hover:scale-110"
          >
            <MessageCircle className="h-5 w-5" />
          </button>
          <span className="text-xs font-bold text-white bg-black/60 backdrop-blur-xl px-2 py-1 rounded-full border border-white/20">
            {clip.stats?.commentsCount || 0}
          </span>
        </div>

        {/* Share */}
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={handleShare}
            disabled={isSharing}
            className="bg-black/60 backdrop-blur-xl rounded-full p-4 text-white hover:bg-black/80 transition-all h-14 w-14 border-2 border-white/20 shadow-2xl hover:scale-110 disabled:opacity-50"
          >
            <Share2 className={cn("h-5 w-5", isSharing && "animate-spin")} />
          </button>
        </div>

        {/* Bookmark */}
        <div className="flex flex-col items-center gap-1">
          <InteractionButton
            type="bookmark"
            entityType="GAMECLIP"
            entityId={clip.id}
            iconOnly
            variant="ghost"
            className="bg-black/60 backdrop-blur-xl rounded-full p-4 hover:bg-black/80 h-14 w-14 border-2 border-white/20 shadow-2xl hover:scale-110 transition-all"
          />
        </div>

        {/* Pause/Play button */}
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={handlePauseToggle}
            disabled={!isActive}
            className="bg-black/60 backdrop-blur-xl rounded-full p-4 text-white hover:bg-black/80 transition-all h-14 w-14 border-2 border-white/20 shadow-2xl hover:scale-110 disabled:opacity-50"
          >
            {effectivePaused ? (
              <Play className="h-5 w-5" />
            ) : (
              <Pause className="h-5 w-5" />
            )}
          </button>
          <span className="text-[8px] font-bold text-white/60 uppercase tracking-wider">
            {effectivePaused ? "Play" : "Pause"}
          </span>
        </div>

        {/* Back home button */}
        <div className="flex flex-col items-center gap-1">
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
          "absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/95 via-black/70 to-transparent text-white transition-opacity duration-500",
          showControls ? "opacity-100" : "opacity-0"
        )}
      >
        <div className="flex items-end justify-between">
          <div className="flex-1">
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

          {/* Video Duration */}
          {isVideo && clip.duration && (
            <div className="text-xs font-mono text-white/80 bg-black/60 backdrop-blur-xl px-3 py-2 rounded-full border border-white/20">
              {formatDuration(clip.duration)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}