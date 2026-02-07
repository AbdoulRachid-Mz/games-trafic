// @/components/game-clips/game-clip-player.tsx - version améliorée
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

interface GameClipPlayerProps {
  clip: GameClipWithRelations;
  isActive: boolean;
  isMuted: boolean;
  onAutoNext?: () => void;
}

export function GameClipPlayer({
  clip,
  isActive,
  isMuted,
  onAutoNext,
}: GameClipPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showControls, setShowControls] = useState(true);

  useEffect(() => {
    if (isActive) {
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.muted = isMuted;
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // Auto-play was prevented
            setIsPlaying(false);
          });
        }
        setIsPlaying(true);
      }
    } else {
      videoRef.current?.pause();
      setIsPlaying(false);
      setProgress(0);
    }
  }, [isActive, isMuted]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && isPlaying && videoRef.current) {
      interval = setInterval(() => {
        if (videoRef.current) {
          const current = videoRef.current.currentTime;
          const duration = videoRef.current.duration || 1;
          const p = (current / duration) * 100;
          setProgress(p);
          if (p >= 99.5 && onAutoNext) {
            onAutoNext();
          }
        }
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isActive, isPlaying, onAutoNext]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleShare = () => {
    shareContent({
      title: "Regardez ce clip sur Games Trafics",
      text: clip.caption || `Clip de ${clip.author?.username}`,
      url: `${window.location.origin}/game-clips/${clip.id}`,
    });
  };

  const handleFollow = () => {
    // TODO: Implement follow functionality
  };

  const handleMore = () => {
    // TODO: Implement more options menu
  };

  const formatDuration = (seconds: number | null | undefined) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className="relative h-full w-full bg-black flex items-center justify-center overflow-hidden group"
      onClick={togglePlay}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Video */}
      <video
        ref={videoRef}
        src={clip.videoUrl}
        className="h-full w-full object-contain"
        loop={!onAutoNext}
        playsInline
        muted={isMuted}
        onEnded={() => onAutoNext?.()}
      />

      {/* Progress Bar */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 z-50 transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0"
        )}
      >
        <div className="h-1 w-full bg-white/20">
          <div
            className="h-full bg-primary transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Right Side Actions */}
      <div
        className={cn(
          "absolute right-4 bottom-32 flex flex-col gap-4 z-10 transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0"
        )}
      >
        {/* Like */}
        <div className="flex flex-col items-center">
          <InteractionButton
            type="like"
            entityType="GAMECLIP"
            entityId={clip.id}
            iconOnly
            count={clip.likesCount}
            variant="ghost"
            className="bg-black/40 backdrop-blur-md rounded-full text-white p-3 hover:bg-black/60 h-14 w-14"
          />
          <Typography variant="caption2" className="text-white mt-1">
            {clip.likesCount}
          </Typography>
        </div>

        {/* Comments */}
        <div className="flex flex-col items-center">
          <Sheet>
            <SheetTrigger asChild>
              <button className="bg-black/40 backdrop-blur-md rounded-full text-white p-3 hover:bg-black/60 transition-colors h-14 w-14">
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
          <Typography variant="caption2" className="text-white mt-1">
            {clip.commentsCount}
          </Typography>
        </div>

        {/* Share */}
        <div className="flex flex-col items-center">
          <button
            onClick={handleShare}
            className="bg-black/40 backdrop-blur-md rounded-full text-white p-3 hover:bg-black/60 transition-colors h-14 w-14"
          >
            <Share2 className="h-6 w-6" />
          </button>
          <Typography variant="caption2" className="text-white mt-1">
            Partager
          </Typography>
        </div>

        {/* Save */}
        <div className="flex flex-col items-center">
          <InteractionButton
            type="bookmark"
            entityType="GAMECLIP"
            entityId={clip.id}
            iconOnly
            variant="ghost"
            className="bg-black/40 backdrop-blur-md rounded-full text-white p-3 hover:bg-black/60 h-14 w-14"
          />
          <Typography variant="caption2" className="text-white mt-1">
            Sauvegarder
          </Typography>
        </div>

        {/* Follow */}
        {clip.author && (
          <div className="flex flex-col items-center">
            <button
              onClick={handleFollow}
              className="bg-black/40 backdrop-blur-md rounded-full text-white p-3 hover:bg-black/60 transition-colors h-14 w-14"
            >
              <UserPlus className="h-6 w-6" />
            </button>
            <Typography variant="caption2" className="text-white mt-1">
              Suivre
            </Typography>
          </div>
        )}

        {/* More */}
        <div className="flex flex-col items-center">
          <button
            onClick={handleMore}
            className="bg-black/40 backdrop-blur-md rounded-full text-white p-3 hover:bg-black/60 transition-colors h-14 w-14"
          >
            <MoreVertical className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Bottom Info */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent text-white transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0"
        )}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Author Info */}
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="h-10 w-10 border-2 border-primary">
                <AvatarImage src={clip.author?.profileImage || ""} />
                <AvatarFallback>
                  {clip.author?.username?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <Typography variant="body-sm" className="font-bold">
                  @{clip.author?.username}
                </Typography>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-1 h-7 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = `/profile/${clip.authorId}`;
                  }}
                >
                  Voir le profil
                </Button>
              </div>
            </div>

            {/* Caption */}
            {clip.caption && (
              <Typography
                variant="body-base"
                className="line-clamp-2 mb-2 leading-relaxed"
              >
                {clip.caption}
              </Typography>
            )}

            {/* Tags */}
            {clip.caption?.match(/#\w+/g) && (
              <div className="flex flex-wrap gap-2 mb-2">
                {clip.caption.match(/#\w+/g)?.map((tag, index) => (
                  <span
                    key={index}
                    className="text-primary hover:underline cursor-pointer text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Game Info */}
            {clip.game && (
              <div className="flex items-center gap-2 text-sm text-white/70">
                <span>Jeu:</span>
                <span className="font-medium">{clip.game.name}</span>
              </div>
            )}

            {/* Duration */}
            {clip.duration && (
              <div className="text-xs text-white/50 mt-2">
                Durée: {formatDuration(clip.duration)}
              </div>
            )}
          </div>

          {/* Play/Pause Button */}
          <div className="flex items-center justify-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              className="bg-black/40 backdrop-blur-md rounded-full p-3 text-white hover:bg-black/60 transition-colors"
            >
              {isPlaying ? (
                <Pause className="h-6 w-6" />
              ) : (
                <Play className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Play/Pause Overlay */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-black/50 rounded-full p-8 animate-in fade-in zoom-in duration-300">
            <Play className="h-16 w-16 text-white fill-white" />
          </div>
        </div>
      )}
    </div>
  );
}