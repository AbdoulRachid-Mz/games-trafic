// components/game-clips/clip-media-controller.tsx
"use client";

import { useState, useEffect, useRef, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Loader2, Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { GameVideoController } from "./game-video-controller";

export interface MediaItem {
  type: "image" | "video";
  url: string;
}

interface ClipMediaControllerProps {
  mediaItems: MediaItem[];
  clipIndex: number;
  isActive: boolean;
  isGloballyPaused: boolean;
  isLongPressing: boolean;
  playbackMode: "manual" | "once" | "loop";
  muted: boolean;
  onComplete: () => void;
  onMediaIndexChange?: (index: number) => void;
  onProgressChange?: (progress: number) => void;
  onTapCenter?: () => void;
  onTapLeft?: () => void;
  onTapRight?: () => void;
  onDoubleTap?: () => void;
}

const IMAGE_DURATION = 4000; // 4 seconds per image

export const ClipMediaController = memo(function ClipMediaController({
  mediaItems,
  clipIndex,
  isActive,
  isGloballyPaused,
  isLongPressing,
  playbackMode,
  muted: externalMuted,
  onComplete,
  onMediaIndexChange,
  onProgressChange,
  onTapCenter,
  onTapLeft,
  onTapRight,
  onDoubleTap,
}: ClipMediaControllerProps) {
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const [showPauseIcon, setShowPauseIcon] = useState(false);
  
  // Video states (full control here)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(externalMuted);
  const [videoProgress, setVideoProgress] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const progressIntervalRef = useRef<number | null>(null);
  const imageProgressRef = useRef<{
    startTime: number;
    pausedProgress: number;
  }>({
    startTime: 0,
    pausedProgress: 0,
  });
  const lastTapTimeRef = useRef(0);
  const doubleTapTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentMedia = mediaItems[currentMediaIndex];
  const isVideo = currentMedia?.type === "video";
  const shouldPlay = isActive && !isGloballyPaused && !isLongPressing;
  const isPaused = isActive && (isGloballyPaused || isLongPressing);

  // Sync external muted prop with internal state
  useEffect(() => {
    setIsVideoMuted(externalMuted);
    if (videoRef.current) {
      videoRef.current.muted = externalMuted;
    }
  }, [externalMuted]);

  // Cleanup function
  const cleanupTimers = useCallback(() => {
    if (progressIntervalRef.current) {
      cancelAnimationFrame(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  // Reset state when clip becomes active or media items change
  useEffect(() => {
    if (isActive) {
      setCurrentMediaIndex(0);
      setProgress(0);
      setVideoProgress(0);
      setIsLoading(true);
      setVideoError(false);
      setIsVideoPlaying(false);
      imageProgressRef.current = { startTime: 0, pausedProgress: 0 };
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
      }
    }
    return cleanupTimers;
  }, [clipIndex, isActive, cleanupTimers]);

  // Page Visibility API - pause when tab is hidden
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && videoRef.current && isActive) {
        videoRef.current.pause();
        setIsVideoPlaying(false);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [isActive]);

  // ========== VIDEO FULL CONTROL ==========
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVideo || !isActive) return;

    video.muted = isVideoMuted;

    if (shouldPlay && !videoError) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsVideoPlaying(true);
            setIsLoading(false);
          })
          .catch((error) => {
            console.warn("[Video] Autoplay failed:", error);
            // Try muted autoplay as fallback
            video.muted = true;
            setIsVideoMuted(true);
            video
              .play()
              .then(() => {
                setIsVideoPlaying(true);
                setIsLoading(false);
              })
              .catch(() => {
                setVideoError(true);
                setIsLoading(false);
              });
          });
      }
    } else {
      video.pause();
      setIsVideoPlaying(false);
    }
  }, [shouldPlay, isVideo, isVideoMuted, isActive, videoError]);

  // Video progress tracking (throttled to ~10fps to avoid excessive setState)
  const lastProgressUpdateRef = useRef(0);
  const handleVideoTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (video && video.duration && !isNaN(video.duration)) {
      const now = performance.now();
      if (now - lastProgressUpdateRef.current < 100) return;
      lastProgressUpdateRef.current = now;
      const p = (video.currentTime / video.duration) * 100;
      setVideoProgress(p);
      setProgress(p);
      onProgressChange?.(p);
    }
  }, [onProgressChange]);

  const handleVideoEnded = useCallback(() => {
    setIsVideoPlaying(false);
    setVideoProgress(0);
    
    if (playbackMode === "loop") {
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().then(() => {
          setIsVideoPlaying(true);
        }).catch(() => {});
        setProgress(0);
        setVideoProgress(0);
      }
    } else if (playbackMode === "once") {
      // If there are more media items, go to next
      if (currentMediaIndex < mediaItems.length - 1) {
        setCurrentMediaIndex((prev) => prev + 1);
        setProgress(0);
        setVideoProgress(0);
        onMediaIndexChange?.(currentMediaIndex + 1);
      } else {
        onComplete();
      }
    }
  }, [playbackMode, currentMediaIndex, mediaItems.length, onComplete, onMediaIndexChange]);

  // Video control handlers
  const toggleVideoPlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().then(() => {
        setIsVideoPlaying(true);
      }).catch(() => {});
    } else {
      video.pause();
      setIsVideoPlaying(false);
    }
  }, []);

  const toggleVideoMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const newMuted = !isVideoMuted;
    video.muted = newMuted;
    setIsVideoMuted(newMuted);
  }, [isVideoMuted]);

  // Video event handlers
  const handleLoadStart = () => setIsLoading(true);
  const handleCanPlay = () => {
    setIsLoading(false);
    setVideoError(false);
  };
  const handleWaiting = () => setIsLoading(true);
  const handlePlaying = () => {
    setIsLoading(false);
    setIsVideoPlaying(true);
  };
  const handlePause = () => setIsVideoPlaying(false);
  const handleError = () => {
    setVideoError(true);
    setIsLoading(false);
  };

  // ========== IMAGE SLIDESHOW ==========
  useEffect(() => {
    if (isVideo || !isActive) return;
    if (playbackMode === "manual") {
      setIsLoading(false);
      return;
    }

    if (shouldPlay) {
      // Starting or resuming
      if (imageProgressRef.current.startTime === 0) {
        imageProgressRef.current.startTime =
          Date.now() -
          (imageProgressRef.current.pausedProgress / 100) * IMAGE_DURATION;
      }

      const updateImageProgress = () => {
        const elapsed = Date.now() - imageProgressRef.current.startTime;
        const percent = Math.min((elapsed / IMAGE_DURATION) * 100, 100);

        setProgress(percent);
        onProgressChange?.(percent);

        if (percent >= 100) {
          // Move to next media or complete
          if (currentMediaIndex < mediaItems.length - 1) {
            setCurrentMediaIndex((prev) => prev + 1);
            setProgress(0);
            imageProgressRef.current = {
              startTime: Date.now(),
              pausedProgress: 0,
            };
            onMediaIndexChange?.(currentMediaIndex + 1);
          } else {
            // End of all media
            if (playbackMode === "loop") {
              setCurrentMediaIndex(0);
              setProgress(0);
              imageProgressRef.current = {
                startTime: Date.now(),
                pausedProgress: 0,
              };
              onMediaIndexChange?.(0);
            } else if (playbackMode === "once") {
              onComplete();
            }
          }
        } else {
          progressIntervalRef.current =
            requestAnimationFrame(updateImageProgress);
        }
      };

      progressIntervalRef.current = requestAnimationFrame(updateImageProgress);
    } else {
      // Pausing - save current progress
      imageProgressRef.current.pausedProgress = progress;
      imageProgressRef.current.startTime = 0;
      cleanupTimers();
    }

    return cleanupTimers;
  }, [
    isVideo,
    isActive,
    shouldPlay,
    playbackMode,
    currentMediaIndex,
    mediaItems.length,
    progress,
    onComplete,
    onMediaIndexChange,
    onProgressChange,
    cleanupTimers,
  ]);

  // Show pause icon when paused
  useEffect(() => {
    if (isPaused && isActive && !isLoading) {
      setShowPauseIcon(true);
    } else {
      setShowPauseIcon(false);
    }
  }, [isPaused, isActive, isLoading]);

  // Navigation within media items
  const goToNextMedia = useCallback(() => {
    if (currentMediaIndex < mediaItems.length - 1) {
      setCurrentMediaIndex((prev) => prev + 1);
      setProgress(0);
      setVideoProgress(0);
      imageProgressRef.current = { startTime: Date.now(), pausedProgress: 0 };
      onMediaIndexChange?.(currentMediaIndex + 1);
      return true;
    }
    return false;
  }, [currentMediaIndex, mediaItems.length, onMediaIndexChange]);

  const goToPrevMedia = useCallback(() => {
    if (currentMediaIndex > 0) {
      setCurrentMediaIndex((prev) => prev - 1);
      setProgress(0);
      setVideoProgress(0);
      imageProgressRef.current = { startTime: Date.now(), pausedProgress: 0 };
      onMediaIndexChange?.(currentMediaIndex - 1);
      return true;
    }
    return false;
  }, [currentMediaIndex, onMediaIndexChange]);

  // Tap handlers with double tap detection
  const handleTap = useCallback(
    (zone: "left" | "center" | "right") => {
      const now = Date.now();
      const timeSinceLastTap = now - lastTapTimeRef.current;

      // Double tap detection (within 300ms)
      if (timeSinceLastTap < 300 && zone === "center") {
        if (doubleTapTimeoutRef.current) {
          clearTimeout(doubleTapTimeoutRef.current);
          doubleTapTimeoutRef.current = null;
        }
        onDoubleTap?.();
        lastTapTimeRef.current = 0;
        return;
      }

      lastTapTimeRef.current = now;

      // Single tap with delay to check for double tap
      doubleTapTimeoutRef.current = setTimeout(() => {
        switch (zone) {
          case "left":
            if (!goToPrevMedia()) {
              onTapLeft?.();
            }
            break;
          case "center":
            onTapCenter?.();
            break;
          case "right":
            if (!goToNextMedia()) {
              onTapRight?.();
            }
            break;
        }
      }, 200);
    },
    [goToPrevMedia, goToNextMedia, onTapLeft, onTapCenter, onTapRight, onDoubleTap],
  );

  // Cleanup double tap timeout
  useEffect(() => {
    return () => {
      if (doubleTapTimeoutRef.current) {
        clearTimeout(doubleTapTimeoutRef.current);
      }
    };
  }, []);

  if (!currentMedia) return null;

  return (
    <div className="relative h-full w-full select-none touch-none">
      {/* Media Display */}
      {isVideo ? (
        <div className="relative h-full w-full">
          <video
            ref={videoRef}
            src={currentMedia.url}
            className="h-full w-full object-contain"
            playsInline
            muted={isVideoMuted}
            preload="metadata"
            onLoadStart={handleLoadStart}
            crossOrigin="anonymous"
            onCanPlay={handleCanPlay}
            onWaiting={handleWaiting}
            onPlaying={handlePlaying}
            onPause={handlePause}
            onTimeUpdate={handleVideoTimeUpdate}
            onEnded={handleVideoEnded}
            onError={handleError}
          />
          
          {/* Video UI Overlay */}
          <GameVideoController
            isPlaying={isVideoPlaying}
            isMuted={isVideoMuted}
            progress={videoProgress}
            onTogglePlay={toggleVideoPlay}
            onToggleMute={toggleVideoMute}
          />
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={`image-${clipIndex}-${currentMediaIndex}`}
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative h-full w-full"
          >
            <Image
              src={currentMedia.url}
              alt={`Media ${currentMediaIndex + 1}`}
              fill
              className="object-contain"
              priority={currentMediaIndex === 0}
              sizes="100vw"
              onLoad={() => setIsLoading(false)}
            />
          </motion.div>
        </AnimatePresence>
      )}

      {/* Progress Bars - Stories style */}
      {mediaItems.length > 0 && playbackMode !== "manual" && (
        <div className="absolute top-[calc(0.75rem+env(safe-area-inset-top))] left-3 right-3 z-30 flex gap-1">
          {mediaItems.map((_, idx) => (
            <div
              key={idx}
              className="h-0.5 flex-1 bg-white/30 rounded-full overflow-hidden"
            >
              <motion.div
                className="h-full bg-white"
                style={{
                  width:
                    idx === currentMediaIndex
                      ? `${progress}%`
                      : idx < currentMediaIndex
                        ? "100%"
                        : "0%",
                }}
                transition={{ duration: 0.05, ease: "linear" }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Loading Indicator */}
      <AnimatePresence>
        {isLoading && isActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
          >
            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                <div className="w-12 h-12 border-2 border-white/20 rounded-full" />
                <Loader2 className="absolute inset-0 h-12 w-12 animate-spin text-white" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pause Overlay */}
      {/* <AnimatePresence>
        {showPauseIcon && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
          >
            <motion.div
              className="bg-black/50 backdrop-blur-sm rounded-full p-6 border border-white/10"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            >
              {isLongPressing ? (
                <Pause className="h-10 w-10 text-white" />
              ) : (
                <Play className="h-10 w-10 text-white ml-1" />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence> */}

      {/* Video Error Fallback */}
      {videoError && isVideo && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
          <div className="text-center text-white/60">
            <p className="text-sm">Impossible de lire la vidéo</p>
          </div>
        </div>
      )}

      {/* Touch/Click Zones - 25% | 50% | 25% */}
      <div className="absolute inset-0 z-10 flex">
        <div
          className="w-1/4 h-full cursor-pointer active:bg-white/5 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            handleTap("left");
          }}
        />
        <div
          className="w-1/2 h-full cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            handleTap("center");
          }}
        />
        <div
          className="w-1/4 h-full cursor-pointer active:bg-white/5 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            handleTap("right");
          }}
        />
      </div>
    </div>
  );
});