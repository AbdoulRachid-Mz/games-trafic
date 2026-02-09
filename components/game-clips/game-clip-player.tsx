// @/components/game-clips/game-clip-player.tsx - version améliorée avec support Images et Share
"use client";

import React, { useRef, useState, useEffect } from "react";
import { InteractionButton } from "@/components/shared/interaction-button";
import {
  MessageCircle,
  Share2,
  Play,
  Pause,
  MoreVertical,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  UserCheck,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import { shareContent } from "@/lib/share";
import { CommentsSection } from "@/components/comments/comments-section";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { GameClipWithRelations } from "@/types/game-clips";
import { useGameClips } from "@/hooks/use-game-clips";
import { useAuthContext } from "@/contexts/auth-context";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface GameClipPlayerProps {
  clip: GameClipWithRelations;
  isActive: boolean;
  isMuted: boolean;
  onAutoNext?: () => void;
  hasMore?: boolean;
}

export function GameClipPlayer({
  clip,
  isActive,
  isMuted,
  onAutoNext,
  hasMore,
}: GameClipPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { shareClip, isSharing } = useGameClips();
  const { user } = useAuthContext();

  const isVideo = !!clip.videoUrl;
  const hasImages = clip.images && clip.images.length > 0;
  const isTextOnly = !isVideo && !hasImages;

  useEffect(() => {
    if (isActive) {
      if (videoRef.current && isVideo) {
        videoRef.current.currentTime = 0;
        videoRef.current.muted = isMuted;
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            setIsPlaying(false);
          });
        }
        setIsPlaying(true);
      } else if (!isVideo) {
        // For non-video clips, reset progress and set auto-next timer if needed
        setProgress(0);
        const timer = setTimeout(() => {
          if (onAutoNext) onAutoNext();
        }, 8000); // 8 seconds for image/text clips
        return () => clearTimeout(timer);
      }
    } else {
      videoRef.current?.pause();
      setIsPlaying(false);
      setProgress(0);
    }
  }, [isActive, isMuted, isVideo, onAutoNext]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && (isPlaying || !isVideo)) {
      interval = setInterval(() => {
        if (isVideo && videoRef.current) {
          const current = videoRef.current.currentTime;
          const duration = videoRef.current.duration || 1;
          const p = (current / duration) * 100;
          setProgress(p);
          if (p >= 99.5 && onAutoNext) {
            onAutoNext();
          }
        } else if (!isVideo) {
          setProgress((prev) => {
            const next = prev + (100 / (8000 / 100)); // Progress over 8 seconds
            if (next >= 100 && onAutoNext) {
              // Handled by the timeout above, but this updates UI
              return 100;
            }
            return next;
          });
        }
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isActive, isPlaying, onAutoNext, isVideo]);

  const togglePlay = () => {
    if (isVideo && videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();

    // Web Share API first
    await shareContent({
      title: "Regardez ce clip sur Games Trafics",
      text: clip.caption || `Clip de ${clip.author?.username}`,
      url: `${window.location.origin}/game-clips?activeClipId=${clip.id}`,
    });

    // Then internal share (create copy) if user is logged in
    if (user && user.id !== clip.authorId) {
      shareClip(clip.id);
    }
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (clip.images) {
      setCurrentImageIndex((prev) => (prev + 1) % clip.images!.length);
    }
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (clip.images) {
      setCurrentImageIndex((prev) => (prev - 1 + clip.images!.length) % clip.images!.length);
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
      className="relative h-full w-full bg-[#0a0a0b] flex items-center justify-center overflow-hidden group"
      onClick={togglePlay}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Background Blur for non-perfect ratios */}
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

      {/* Content Rendering */}
      <div className="relative z-0 h-full w-full flex items-center justify-center">
        {isVideo ? (
          <video
            ref={videoRef}
            src={clip.videoUrl ?? ""}
            className="h-full w-full object-contain"
            loop={!onAutoNext}
            playsInline
            muted={isMuted}
            onEnded={() => onAutoNext?.()}
          />
        ) : hasImages ? (
          <div className="relative h-full w-full flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentImageIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
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

            {clip.images && clip.images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 p-2 rounded-full text-white hover:bg-black/60 transition-colors z-20"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 p-2 rounded-full text-white hover:bg-black/60 transition-colors z-20"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
                <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1 z-20">
                  {clip.images.map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "h-1 w-4 rounded-full transition-all",
                        i === currentImageIndex ? "bg-primary w-8" : "bg-white/30"
                      )}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center max-w-md">
            <Typography variant="h3" className="text-white font-bold mb-4 drop-shadow-lg">
              {clip.caption}
            </Typography>
            <div className="w-12 h-1 bg-primary rounded-full mb-4 shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 z-50 transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0"
        )}
      >
        <div className="h-1 w-full bg-white/20">
          <div
            className="h-full bg-primary transition-all duration-100 ease-linear shadow-[0_0_8px_rgba(var(--primary),0.8)]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Right Side Actions */}
      <div
        className={cn(
          "absolute right-4 bottom-32 flex flex-col gap-5 z-10 transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0"
        )}
      >
        {/* Like */}
        <div className="flex flex-col items-center gap-1">
          <InteractionButton
            type="like"
            entityType="GAMECLIP"
            entityId={clip.id}
            iconOnly
            count={clip.likesCount}
            variant="ghost"
            className="bg-black/40 backdrop-blur-md rounded-full text-white p-3 hover:bg-black/60 h-12 w-12 border border-white/10"
          />
          <Typography variant="caption2" className="text-white font-medium">
            {clip.likesCount}
          </Typography>
        </div>

        {/* Comments */}
        <div className="flex flex-col items-center gap-1">
          <Sheet>
            <SheetTrigger asChild>
              <button className="bg-black/40 backdrop-blur-md rounded-full text-white p-2 hover:bg-black/60 transition-colors h-12 w-12 border border-white/10 md:max-w-md">
                <MessageCircle className="h-6 w-6" />
              </button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-full sm:max-w-md bg-background/95 backdrop-blur-md border-none p-0"
            >
              <SheetHeader className="p-6 border-b">
                <SheetTitle>Commentaires</SheetTitle>
              </SheetHeader>
              <div className="h-[calc(100vh-80px)] overflow-y-auto px-6 py-4 pb-20">
                <CommentsSection entityId={clip.id} entityType="GAMECLIP" />
              </div>
            </SheetContent>
          </Sheet>
          <Typography variant="caption2" className="text-white font-medium">
            {clip.commentsCount}
          </Typography>
        </div>

        {/* Share */}
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={handleShare}
            disabled={isSharing}
            className="bg-black/40 backdrop-blur-md rounded-full text-white p-3 hover:bg-black/60 transition-colors h-12 w-12 border border-white/10 disabled:opacity-50"
          >
            <Share2 className={cn("h-6 w-6", isSharing && "animate-pulse")} />
          </button>
          <Typography variant="caption2" className="text-white font-medium">
            Partager
          </Typography>
        </div>

        {/* Save */}
        <div className="flex flex-col items-center gap-1">
          <InteractionButton
            type="bookmark"
            entityType="GAMECLIP"
            entityId={clip.id}
            iconOnly
            variant="ghost"
            className="bg-black/40 backdrop-blur-md rounded-full text-white p-3 hover:bg-black/60 h-12 w-12 border border-white/10"
          />
          <Typography variant="caption2" className="text-white font-medium">
            Sauver
          </Typography>
        </div>

        {/* Follow */}
        {clip.author && user?.id !== clip.authorId && (
          <div className="flex flex-col items-center gap-1">
            <InteractionButton
              type="follow"
              entityType="USER"
              entityId={clip.authorId}
              iconOnly
              variant="ghost"
              className="bg-black/40 backdrop-blur-md rounded-full text-white p-3 hover:bg-black/60 h-12 w-12 border border-white/10"
            />
            <Typography variant="caption2" className="text-white font-medium">
              Suivre
            </Typography>
          </div>
        )}

        {/* More */}
        <div className="flex flex-col items-center">
          <button
            className="bg-black/40 backdrop-blur-md rounded-full text-white p-3 hover:bg-black/60 transition-colors h-12 w-12 border border-white/10"
          >
            <MoreVertical className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Bottom Info */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/95 via-black/60 to-transparent text-white transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0"
        )}
      >
        <div className="flex items-end justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Author Info */}
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="h-11 w-11 border-2 border-primary ring-2 ring-primary/20">
                <AvatarImage src={clip.author?.profileImage || ""} />
                <AvatarFallback className="bg-primary/20 text-primary">
                  {clip.author?.username?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <Typography variant="body-base" className="font-bold tracking-tight">
                    @{clip.author?.username}
                  </Typography>
                  {clip.authorId === user?.id && (
                    <span className="bg-primary/20 text-primary text-[10px] px-1.5 py-0.5 rounded border border-primary/30 font-bold uppercase tracking-wider">
                      Moi
                    </span>
                  )}
                </div>
                <button
                  className="text-xs text-white/70 hover:text-white transition-colors text-left font-medium"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = `/profile/${clip.authorId}`;
                  }}
                >
                  Voir le profil
                </button>
              </div>
            </div>

            {/* Caption */}
            {clip.caption && (
              <Typography
                variant="body-base"
                className="line-clamp-3 mb-3 leading-relaxed text-white/90"
              >
                {clip.caption}
              </Typography>
            )}

            {/* Tags (extracted from caption) */}
            {clip.caption?.match(/#\w+/g) && (
              <div className="flex flex-wrap gap-x-3 gap-y-1 mb-3">
                {clip.caption.match(/#\w+/g)?.map((tag, index) => (
                  <span
                    key={index}
                    className="text-primary hover:text-primary/80 cursor-pointer text-sm font-semibold transition-colors"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Game Info */}
            {clip.game && (
              <div className="flex items-center gap-2 inline-flex bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10 hover:bg-white/20 transition-colors cursor-pointer">
                <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider opacity-90">{clip.game.name}</span>
              </div>
            )}
          </div>

          {/* Media Controls Side */}
          {isVideo && (
            <div className="flex flex-col items-center gap-2 mb-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlay();
                }}
                className="bg-primary rounded-full p-4 text-primary-foreground hover:scale-110 transition-transform shadow-lg shadow-primary/20"
              >
                {isPlaying ? (
                  <Pause className="h-7 w-7 fill-current" />
                ) : (
                  <Play className="h-7 w-7 fill-current" />
                )}
              </button>
              {clip.duration && (
                <div className="text-[10px] font-bold text-white/60 bg-black/40 px-2 py-0.5 rounded-full border border-white/5 uppercase tracking-tighter">
                  {formatDuration(clip.duration)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Play/Pause Overlay Animated */}
      <AnimatePresence>
        {!isPlaying && isVideo && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
          >
            <div className="bg-black/40 backdrop-blur-sm rounded-full p-10 border border-white/10 ring-4 ring-white/5">
              <Play className="h-12 w-12 text-white fill-white shadow-2xl" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}