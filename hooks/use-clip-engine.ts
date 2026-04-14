// hooks/use-clip-engine.ts
"use client";

import { useCallback, useEffect } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type PlaybackMode = "manual" | "once" | "loop";

interface ClipEngineState {
  // State
  currentIndex: number;
  playbackMode: PlaybackMode;
  isGloballyPaused: boolean;
  isTransitioning: boolean;
  muted: boolean;
  isUserInteracting: boolean;
  lastInteractionType: "tap" | "longpress" | "scroll" | null;
  
  // Actions
  setCurrentIndex: (index: number) => void;
  setPlaybackMode: (mode: PlaybackMode) => void;
  setGlobalPause: (paused: boolean) => void;
  setIsTransitioning: (transitioning: boolean) => void;
  toggleMute: () => void;
  setMuted: (muted: boolean) => void;
  setUserInteracting: (interacting: boolean, type?: "tap" | "longpress" | "scroll" | null) => void;
  goNext: (total: number) => void;
  goPrev: () => void;
  reset: () => void;
}

export const useClipEngineStore = create<ClipEngineState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentIndex: 0,
      playbackMode: "once",
      isGloballyPaused: false,
      isTransitioning: false,
      muted: true,
      isUserInteracting: false,
      lastInteractionType: null,
      
      // Basic actions
      setCurrentIndex: (index) => set({ currentIndex: index }),
      setPlaybackMode: (mode) => set({ playbackMode: mode }),
      setGlobalPause: (paused) => set({ isGloballyPaused: paused }),
      setIsTransitioning: (transitioning) => set({ isTransitioning: transitioning }),
      
      // Mute actions
      toggleMute: () => set((state) => ({ muted: !state.muted })),
      setMuted: (muted) => set({ muted }),

      // Interaction actions
      setUserInteracting: (interacting, type = null) => set({ 
        isUserInteracting: interacting,
        lastInteractionType: interacting ? type : null 
      }),
      
      // Navigation actions
      goNext: (total) => {
        const state = get();
        if (state.isTransitioning) return;
        
        if (state.currentIndex < total - 1) {
          set({ 
            currentIndex: state.currentIndex + 1,
            isTransitioning: true 
          });
          setTimeout(() => set({ isTransitioning: false }), 400); 
        } else if (state.playbackMode === "once" && total > 0) {
          // Reset to first if at end and mode is once
          set({ currentIndex: 0, isTransitioning: true });
          setTimeout(() => set({ isTransitioning: false }), 400);
        }
      },
      
      goPrev: () => {
        const state = get();
        if (state.isTransitioning) return;
        
        if (state.currentIndex > 0) {
          set({ 
            currentIndex: state.currentIndex - 1,
            isTransitioning: true 
          });
          setTimeout(() => set({ isTransitioning: false }), 400);
        }
      },
      
      // Reset all state
      reset: () => set({
        currentIndex: 0,
        playbackMode: "once",
        isGloballyPaused: false,
        isTransitioning: false,
        muted: true,
        isUserInteracting: false,
        lastInteractionType: null,
      }),
    }),
    {
      name: "clip-engine-storage",
      partialize: (state) => ({ 
        muted: state.muted,
        playbackMode: state.playbackMode,
      }),
    }
  )
);

interface UseClipEngineProps {
  totalClips: number;
  onIndexChange?: (index: number) => void;
}

export function useClipEngine({ totalClips, onIndexChange }: UseClipEngineProps) {
  const store = useClipEngineStore();
  
  const {
    currentIndex,
    playbackMode,
    isGloballyPaused,
    isTransitioning,
    muted,
    isUserInteracting,
    lastInteractionType,
    setCurrentIndex,
    setPlaybackMode,
    setGlobalPause,
    setIsTransitioning,
    toggleMute,
    setUserInteracting,
    reset,
  } = store;

  const goNext = useCallback(() => {
    store.goNext(totalClips);
  }, [totalClips, store]);

  const goPrev = useCallback(() => {
    store.goPrev();
  }, [store]);

  // Notify parent of index change
  useEffect(() => {
    onIndexChange?.(currentIndex);
  }, [currentIndex, onIndexChange]);

  const pause = useCallback(() => setGlobalPause(true), [setGlobalPause]);
  const resume = useCallback(() => setGlobalPause(false), [setGlobalPause]);

  return {
    // State
    currentIndex,
    playbackMode,
    isGloballyPaused,
    isTransitioning,
    muted,
    isUserInteracting,
    lastInteractionType,
    
    // Navigation
    goNext,
    goPrev,
    
    // Actions
    setPlaybackMode,
    setGlobalPause,
    setIsTransitioning,
    setCurrentIndex,
    toggleMute,
    setUserInteracting,
    pause,
    resume,
    reset,
  };
}