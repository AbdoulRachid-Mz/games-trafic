"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface UseGameClipPlaybackProps {
  clipId: string;
  isVideo: boolean;
  hasImages: boolean;
  totalImages: number;
  isActive: boolean;
  isPaused: boolean;
  imageDuration?: number;
  onAutoNext?: () => void;
}

export function useGameClipPlayback({
  clipId,
  isVideo,
  hasImages,
  totalImages,
  isActive,
  isPaused,
  imageDuration = 4000,
  onAutoNext,
}: UseGameClipPlaybackProps) {
  const [progress, setProgress] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const lastProgressRef = useRef<number>(0);

  // Reset when clip changes
  useEffect(() => {
    setProgress(0);
    setCurrentImageIndex(0);
    startTimeRef.current = 0;
    lastProgressRef.current = 0;
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  }, [clipId]);

  const update = useCallback(() => {
    if (!isActive || isPaused) return;

    if (isVideo && videoRef.current) {
      const v = videoRef.current;
      if (v.duration && !v.paused) {
        const p = (v.currentTime / v.duration) * 100;
        setProgress(p);
        lastProgressRef.current = p;
      }
    } else if (hasImages) {
      if (!startTimeRef.current) {
        startTimeRef.current =
          performance.now() - (lastProgressRef.current * imageDuration) / 100;
      }

      const now = performance.now();
      const elapsed = now - startTimeRef.current;
      const p = (elapsed / imageDuration) * 100;

      if (p >= 100) {
        if (currentImageIndex < totalImages - 1) {
          setCurrentImageIndex((prev) => prev + 1);
          startTimeRef.current = now;
          setProgress(0);
          lastProgressRef.current = 0;
        } else {
          // Finished all images
          onAutoNext?.();
          return; // rAF stops here for this clip
        }
      } else {
        setProgress(p);
        lastProgressRef.current = p;
      }
    }
    rafRef.current = requestAnimationFrame(update);
  }, [
    isActive,
    isPaused,
    isVideo,
    hasImages,
    totalImages,
    imageDuration,
    currentImageIndex,
    onAutoNext,
  ]);

  // Handle Play/Pause
  useEffect(() => {
    if (isActive && !isPaused) {
      // If resuming images, startTime will be recalculated in update() using lastProgressRef
      if (!isVideo) {
        startTimeRef.current = 0; // Trigger recalculation
      }

      rafRef.current = requestAnimationFrame(update);

      if (isVideo && videoRef.current) {
        videoRef.current.play().catch((err) => {
          console.warn("Autoplay blocked or video error:", err);
        });
      }
    } else {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (isVideo && videoRef.current) {
        videoRef.current.pause();
      }
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isActive, isPaused, isVideo, update]);

  // Specific handler for video ended
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVideo) return;

    const handleEnded = () => {
      if (isActive && !isPaused) {
        onAutoNext?.();
      }
    };

    video.addEventListener("ended", handleEnded);
    return () => video.removeEventListener("ended", handleEnded);
  }, [isVideo, isActive, isPaused, onAutoNext]);

  const goToNextImage = useCallback(() => {
    if (currentImageIndex < totalImages - 1) {
      setCurrentImageIndex((prev) => prev + 1);
      setProgress(0);
      lastProgressRef.current = 0;
      startTimeRef.current = performance.now();
    } else {
      onAutoNext?.();
    }
  }, [currentImageIndex, totalImages, onAutoNext]);

  const goToPrevImage = useCallback(() => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex((prev) => prev - 1);
      setProgress(0);
      lastProgressRef.current = 0;
      startTimeRef.current = performance.now();
    } else {
      // Go to previous clip handled by parent
      return true; // signal to parent
    }
    return false;
  }, [currentImageIndex]);

  return {
    progress,
    currentImageIndex,
    videoRef,
    goToNextImage,
    goToPrevImage,
    setCurrentImageIndex,
  };
}
