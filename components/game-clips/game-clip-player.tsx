// @/components/game-clips/game-clip-player.tsx
"use client";

import React, { useState, useCallback, useRef, useEffect, memo } from "react";
import {
  MessageCircle,
  Share2,
  Heart,
  Plus,
  Volume2,
  VolumeX,
  Bookmark,
  BookmarkCheck,
  Download,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { ClipMediaController, type MediaItem } from "./clip-media-controller";
import { useClipEngineStore } from "@/hooks/use-clip-engine";

// Minimal type for what we need
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

interface GameClipPlayerProps {
  clip: ClipData;
  clipIndex: number;
  isActive: boolean;
  isPreload?: boolean;
  userId?: string;
  onComplete: () => void;
  onCommentsToggle?: () => void;
  onLike?: () => void;
  onBookmark?: () => void;
  onShare?: () => void;
  onNext?: () => void;
  onPrev?: () => void;
}

export const GameClipPlayer = memo(function GameClipPlayer({
  clip,
  clipIndex,
  isActive,
  isPreload = false,
  userId,
  onComplete,
  onCommentsToggle,
  onLike,
  onBookmark,
  onShare,
  onNext,
  onPrev,
}: GameClipPlayerProps) {
  const [showDoubleTapHeart, setShowDoubleTapHeart] = useState(false);
  const [localLiked, setLocalLiked] = useState(clip.stats?.liked ?? false);
  const [localBookmarked, setLocalBookmarked] = useState(
    clip.stats?.bookmarked ?? false,
  );
  const [localLikesCount, setLocalLikesCount] = useState(
    clip.stats?.likesCount ?? 0,
  );
  const [isDownloading, setIsDownloading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const doubleTapHeartTimerRef = useRef<NodeJS.Timeout | null>(null);

  const router = useRouter();

  // Get store state
  const isGloballyPaused = useClipEngineStore((s) => s.isGloballyPaused);
  const isLongPressing = useClipEngineStore((s) => s.isLongPressing);
  const playbackMode = useClipEngineStore((s) => s.playbackMode);
  const muted = useClipEngineStore((s) => s.muted);
  const toggleMute = useClipEngineStore((s) => s.toggleMute);
  const setGlobalPause = useClipEngineStore((s) => s.setGlobalPause);
  const setIsLongPressing = useClipEngineStore((s) => s.setIsLongPressing);

  // Sync local state with props
  useEffect(() => {
    setLocalLiked(clip.stats?.liked ?? false);
    setLocalBookmarked(clip.stats?.bookmarked ?? false);
    setLocalLikesCount(clip.stats?.likesCount ?? 0);
  }, [clip.stats?.liked, clip.stats?.bookmarked, clip.stats?.likesCount]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
      if (doubleTapHeartTimerRef.current)
        clearTimeout(doubleTapHeartTimerRef.current);
    };
  }, []);

  // Build media items array: video first, then images
  const mediaItems: MediaItem[] = [
    ...(clip.videoUrl ? [{ type: "video" as const, url: clip.videoUrl }] : []),
    ...(clip.images?.map((url) => ({ type: "image" as const, url })) || []),
  ];

  // Double tap to like
  const handleDoubleTap = useCallback(() => {
    if (!userId) return;

    // Show heart animation
    setShowDoubleTapHeart(true);
    if (doubleTapHeartTimerRef.current)
      clearTimeout(doubleTapHeartTimerRef.current);
    doubleTapHeartTimerRef.current = setTimeout(
      () => setShowDoubleTapHeart(false),
      1000,
    );

    // Like if not already liked
    if (!localLiked) {
      setLocalLiked(true);
      setLocalLikesCount((prev) => prev + 1);
      onLike?.();
    }
  }, [userId, localLiked, onLike]);

  // Tap center to toggle pause
  const handleTapCenter = useCallback(() => {
    setGlobalPause(!isGloballyPaused);
  }, [isGloballyPaused, setGlobalPause]);

  // Long press handlers
  const handlePointerDown = useCallback(() => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      setIsLongPressing(true);
      setGlobalPause(true);
    }, 400);
  }, [setIsLongPressing, setGlobalPause]);

  const handlePointerUp = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (isLongPressing) {
      setIsLongPressing(false);
      setGlobalPause(false);
    }
  }, [isLongPressing, setIsLongPressing, setGlobalPause]);

  const handlePointerLeave = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  // Like handler
  const handleLike = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!userId) return;

      setLocalLiked((prev) => !prev);
      setLocalLikesCount((prev) => (localLiked ? prev - 1 : prev + 1));
      onLike?.();
    },
    [userId, localLiked, onLike],
  );

  // Bookmark handler
  const handleBookmark = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!userId) return;

      setLocalBookmarked((prev) => !prev);
      onBookmark?.();
    },
    [userId, onBookmark],
  );

  // Share handler
  const handleShare = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();

      const shareData = {
        title: "Regardez ce clip",
        text: clip.caption || `Clip de ${clip.author?.username}`,
        url: `${window.location.origin}/game-clips?activeClipId=${clip.id}`,
      };

      if (navigator.share) {
        try {
          await navigator.share(shareData);
          onShare?.();
        } catch (err) {
          // User cancelled or error
          if ((err as Error).name !== "AbortError") {
            console.warn("[v0] Share failed:", err);
          }
        }
      } else {
        // Fallback: copy to clipboard
        try {
          await navigator.clipboard.writeText(shareData.url);
          toast.success("Lien copie dans le presse-papier");
          onShare?.();
        } catch {
          console.warn("[v0] Clipboard write failed");
        }
      }
    },
    [clip.id, clip.caption, clip.author?.username, onShare],
  );

  // Download handler
  const handleDownload = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();

      // Determine what to download: video or first image
      const downloadUrl = clip.videoUrl || clip.images?.[0];
      if (!downloadUrl) {
        toast.error("Aucun media a telecharger");
        return;
      }

      setIsDownloading(true);

      try {
        const response = await fetch(downloadUrl);
        if (!response.ok) throw new Error("Download failed");

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;

        // Generate filename
        const extension = clip.videoUrl ? "mp4" : "jpg";
        const filename = `clip_${clip.id}_${Date.now()}.${extension}`;

        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast.success("Telechargement lance");
      } catch (err) {
        console.error("[v0] Download failed:", err);
        toast.error("Echec du telechargement");
      } finally {
        setIsDownloading(false);
      }
    },
    [clip.id, clip.videoUrl, clip.images],
  );

  // If preload only, render minimal content
  if (isPreload && !isActive) {
    return (
      <div className="relative h-full w-full bg-black">
        {/* Preload thumbnail or first frame */}
        {(clip.thumbnailUrl || clip.images?.[0]) && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-30 blur-2xl"
            style={{
              backgroundImage: `url(${clip.thumbnailUrl || clip.images?.[0]})`,
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full bg-black overflow-hidden"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onPointerCancel={handlePointerUp}
    >
      {/* Blurred Background */}
      <div
        className="absolute inset-0 bg-cover bg-center blur-3xl opacity-30 scale-110 pointer-events-none"
        style={{
          backgroundImage: clip.thumbnailUrl
            ? `url(${clip.thumbnailUrl})`
            : clip.videoUrl
              ? `url(${clip.videoUrl})`
              : clip.images?.[0]
                ? `url(${clip.images[0]})`
                : undefined,
        }}
      />

      {/* Media Controller */}
      <ClipMediaController
        mediaItems={mediaItems}
        clipIndex={clipIndex}
        isActive={isActive}
        isGloballyPaused={isGloballyPaused}
        isLongPressing={isLongPressing}
        playbackMode={playbackMode}
        muted={muted}
        onComplete={onComplete}
        onTapCenter={handleTapCenter}
        onTapLeft={onPrev}
        onTapRight={onNext}
        onDoubleTap={handleDoubleTap}
      />

      {/* Double Tap Heart Animation */}
      <AnimatePresence>
        {showDoubleTapHeart && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1.5, opacity: 1 }}
            exit={{ scale: 2, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-40"
          >
            <Heart className="h-16 w-16 text-red-500 fill-red-500 drop-shadow-2xl" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right Action Bar */}
      <div className="absolute bottom-16 right-3 flex flex-col items-center gap-3 z-30">
        {/* Author Avatar */}
        <div className="relative">
          <Avatar
            className="h-11 w-11 border-2 border-white shadow-lg cursor-pointer active:scale-95 transition-transform"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/profile/${clip.author?.id}`);
            }}
          >
            <AvatarImage
              src={clip.author?.profileImage || "/icons/avatar-500.png"}
            />
            <AvatarFallback className="bg-primary/20 text-primary text-sm">
              {clip.author?.username?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push("/game-clips/create");
            }}
            className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-primary text-white p-1 rounded-full hover:scale-110 transition-transform shadow-lg border-2 border-black"
          >
            <Plus className="h-2.5 w-2.5" />
          </button>
        </div>

        {/* Like Button */}
        <div className="flex flex-col items-center gap-0.5">
          <button
            onClick={handleLike}
            className={cn(
              "p-2 rounded-full transition-all active:scale-90",
              "bg-black/40 backdrop-blur-sm border border-white/10",
              localLiked && "text-red-500",
            )}
          >
            <Heart className={cn("h-4 w-4", localLiked && "fill-current")} />
          </button>
          <span className="text-xs font-semibold text-white drop-shadow-md">
            {localLikesCount}
          </span>
        </div>

        {/* Comments Button */}
        <div className="flex flex-col items-center gap-0.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCommentsToggle?.();
            }}
            className="p-2 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 transition-all active:scale-90"
          >
            <MessageCircle className="h-4 w-4 text-white" />
          </button>
          <span className="text-xs font-semibold text-white drop-shadow-md">
            {clip.stats?.commentsCount ?? 0}
          </span>
        </div>

        {/* Bookmark Button */}
        <button
          onClick={handleBookmark}
          className={cn(
            "p-2 rounded-full transition-all active:scale-90",
            "bg-black/40 backdrop-blur-sm border border-white/10",
            localBookmarked && "text-yellow-500",
          )}
        >
          {localBookmarked ? (
            <BookmarkCheck className="h-4 w-4 fill-current" />
          ) : (
            <Bookmark className="h-4 w-4 text-white" />
          )}
        </button>

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="p-2 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 transition-all active:scale-90"
        >
          <Share2 className="h-4 w-4 text-white" />
        </button>

        {/* Download Button */}
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className={cn(
            "p-2 rounded-full transition-all active:scale-90",
            "bg-black/40 backdrop-blur-sm border border-white/10",
            isDownloading && "opacity-50",
          )}
        >
          {isDownloading ? (
            <Loader2 className="h-4 w-4 text-white animate-spin" />
          ) : (
            <Download className="h-4 w-4 text-white" />
          )}
        </button>

        {/* Volume Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleMute();
          }}
          className="p-2 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 transition-all active:scale-90"
        >
          {muted ? (
            <VolumeX className="h-4 w-4 text-white" />
          ) : (
            <Volume2 className="h-4 w-4 text-white" />
          )}
        </button>
      </div>

      {/* Bottom Info Overlay - Always visible */}
      <div className="absolute bottom-0 left-0 right-16 p-4 pb-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none z-20">
        {/* Author */}
        <div
          className="flex items-center gap-2 mb-2 pointer-events-auto cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/profile/${clip.author?.id}`);
          }}
        >
          <span className="text-sm font-bold text-white">
            @{clip.author?.username || "utilisateur"}
          </span>
          {clip.authorId === userId && (
            <span className="bg-primary/20 text-primary text-[9px] px-1.5 py-0.5 rounded-full border border-primary/30 font-bold uppercase">
              Toi
            </span>
          )}
        </div>

        {/* Caption */}
        {clip.caption && (
          <p className="text-sm text-white/90 line-clamp-2 mb-2 leading-relaxed">
            {clip.caption}
          </p>
        )}

        {/* Game Tag */}
        {clip.game && (
          <div
            className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/10 pointer-events-auto cursor-pointer hover:bg-white/20 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/games/${clip.game?.id}`);
            }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-semibold uppercase tracking-wide text-white">
              {clip.game.name}
            </span>
          </div>
        )}
      </div>
    </div>
  );
});
