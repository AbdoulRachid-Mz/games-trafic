import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Play, Pause, Loader2 } from "lucide-react";

interface MediaItem {
  type: "image" | "video";
  url: string;
} 

interface ClipMediaControllerProps {
  mediaItems: MediaItem[];
  isActive: boolean;
  isGloballyPaused: boolean;
  playbackMode: "manual" | "once" | "loop";
  muted: boolean;
  onComplete: () => void;
  onMediaChange?: (index: number) => void;
  onTapCenter?: () => void;
  onTapLeft?: () => void;
  onTapRight?: () => void;
}

const IMAGE_DURATION = 4000; // 4 seconds per image

export function ClipMediaController({
  mediaItems,
  isActive,
  isGloballyPaused,
  playbackMode,
  muted,
  onComplete,
  onMediaChange,
  onTapCenter,
  onTapLeft,
  onTapRight,
}: ClipMediaControllerProps) {
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageTimerRef = useRef<NodeJS.Timeout | null>(null);
  const imageStartTimeRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);

  const currentMedia = mediaItems[currentMediaIndex];
  const isVideo = currentMedia?.type === "video";
  const shouldPlay = isActive && !isGloballyPaused;

  const cleanupTimers = useCallback(() => {
    if (imageTimerRef.current) {
      clearInterval(imageTimerRef.current);
      imageTimerRef.current = null;
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  // Reset when clip changes
  useEffect(() => {
    setCurrentMediaIndex(0);
    setProgress(0);
    setIsLoading(true);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
    cleanupTimers();
  }, [mediaItems, cleanupTimers]);

  // Page Visibility API
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && videoRef.current) {
        videoRef.current.pause();
      } else if (!document.hidden && shouldPlay && videoRef.current) {
        videoRef.current.play().catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [shouldPlay]);

  // Video playback handling
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVideo) return;

    video.muted = muted;

    if (shouldPlay) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [shouldPlay, isVideo, muted]);

  // Video progress tracking
  useEffect(() => {
    if (!isVideo || !shouldPlay) return;

    const updateProgress = () => {
      const video = videoRef.current;
      if (video && video.duration && !isNaN(video.duration)) {
        const p = (video.currentTime / video.duration) * 100;
        setProgress(p);
      }
      rafRef.current = requestAnimationFrame(updateProgress);
    };

    rafRef.current = requestAnimationFrame(updateProgress);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isVideo, shouldPlay]);

  // Video events
  const handleLoadStart = () => setIsLoading(true);
  const handleCanPlay = () => setIsLoading(false);
  const handleWaiting = () => setIsLoading(true);

  // Video ended handler
  const handleVideoEnded = useCallback(() => {
    if (playbackMode === "loop") {
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {});
        setProgress(0);
      }
    } else if (playbackMode === "once") {
      onComplete();
    }
    // In "manual" mode, we just stop at the end
  }, [playbackMode, onComplete]);

  // Image slideshow handling
  useEffect(() => {
    if (isVideo || !shouldPlay) return;

    if (playbackMode === "manual") {
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    imageStartTimeRef.current = Date.now() - (progress / 100) * IMAGE_DURATION;

    const interval = setInterval(() => {
      const elapsed = Date.now() - imageStartTimeRef.current;
      const percent = (elapsed / IMAGE_DURATION) * 100;

      if (percent >= 100) {
        if (currentMediaIndex < mediaItems.length - 1) {
          setCurrentMediaIndex(prev => prev + 1);
          setProgress(0);
          imageStartTimeRef.current = Date.now();
          onMediaChange?.(currentMediaIndex + 1);
        } else {
          if (playbackMode === "once") {
            onComplete();
          } else if (playbackMode === "loop") {
            setCurrentMediaIndex(0);
            setProgress(0);
            imageStartTimeRef.current = Date.now();
          }
        }
      } else {
        setProgress(percent);
      }
    }, 50);

    imageTimerRef.current = interval;
    return () => clearInterval(interval);
  }, [isVideo, shouldPlay, playbackMode, currentMediaIndex, mediaItems.length, onComplete, onMediaChange, progress]);

  const goToNextMedia = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onTapRight) {
      onTapRight();
      return;
    }
    if (isVideo) {
      if (playbackMode !== "manual") onComplete();
    } else if (currentMediaIndex < mediaItems.length - 1) {
      setCurrentMediaIndex(prev => prev + 1);
      setProgress(0);
      imageStartTimeRef.current = Date.now();
      onMediaChange?.(currentMediaIndex + 1);
    } else {
      if (playbackMode !== "manual") onComplete();
    }
  }, [isVideo, currentMediaIndex, mediaItems.length, onComplete, onMediaChange, onTapRight, playbackMode]);

  const goToPrevMedia = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onTapLeft) {
      onTapLeft();
      return;
    }
    if (currentMediaIndex > 0) {
      setCurrentMediaIndex(prev => prev - 1);
      setProgress(0);
      imageStartTimeRef.current = Date.now();
      onMediaChange?.(currentMediaIndex - 1);
    }
  }, [currentMediaIndex, onMediaChange, onTapLeft]);

  if (!currentMedia) return null;

  return (
    <div className="relative h-full w-full select-none">
      {/* Media Display */}
      {isVideo ? (
        <video
          ref={videoRef}
          src={currentMedia.url}
          className="h-full w-full object-contain"
          loop={false}
          playsInline
          muted={muted}
          preload="auto"
          onEnded={handleVideoEnded}
          onLoadStart={handleLoadStart}
          onCanPlay={handleCanPlay}
          onWaiting={handleWaiting}
          onPlaying={() => setIsLoading(false)}
        />
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentMediaIndex}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="relative h-full w-full"
          >
            <Image
              src={currentMedia.url}
              alt={`Media ${currentMediaIndex + 1}`}
              fill
              className="object-contain"
              priority={currentMediaIndex === 0}
              onLoadingComplete={() => setIsLoading(false)}
            />
          </motion.div>
        </AnimatePresence>
      )}

      {/* Loader */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px] z-10"
          >
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <span className="text-[10px] font-bold text-white/50 tracking-tighter uppercase font-mono">Chargement...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Bars */}
      {mediaItems.length > 1 && !isVideo && playbackMode !== "manual" && (
        <div className="absolute top-4 left-4 right-4 z-30 flex gap-1">
          {mediaItems.map((_, idx) => (
            <div
              key={idx}
              className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden"
            >
              <motion.div
                className="h-full bg-white"
                initial={{ width: "0%" }}
                animate={{
                  width: idx === currentMediaIndex
                    ? `${progress}%`
                    : idx < currentMediaIndex
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
      {isVideo && playbackMode !== "manual" && (
        <div className="absolute top-0 left-0 right-0 z-30">
          <div className="h-1 w-full bg-white/20">
            <div
              className="h-full bg-primary transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Pause Overlay */}
      <AnimatePresence>
        {!shouldPlay && isActive && !isLoading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
          >
            <div className="bg-black/60 backdrop-blur-xl rounded-full p-8 shadow-2xl border border-white/10">
              <Pause className="h-12 w-12 text-white" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Areas */}
      <div 
        className="absolute inset-y-0 left-0 w-1/4 z-20 cursor-pointer" 
        onClick={goToPrevMedia}
      />
      <div 
        className="absolute inset-0 z-10 cursor-pointer" 
        onClick={(e) => {
          e.stopPropagation();
          onTapCenter?.();
        }}
      />
      <div 
        className="absolute inset-y-0 right-0 w-1/4 z-20 cursor-pointer" 
        onClick={goToNextMedia}
      />
    </div>
  );
}