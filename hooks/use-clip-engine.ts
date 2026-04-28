// hooks/use-clip-engine.ts
"use client";

import { useCallback, useEffect, useRef } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type PlaybackMode = "manual" | "once" | "loop";

interface MediaState {
  currentMediaIndex: number;
  totalMedia: number;
  progress: number;
  isMediaLoading: boolean;
}

interface ClipEngineState {
  // Core State
  currentIndex: number;
  playbackMode: PlaybackMode;
  isGloballyPaused: boolean;
  muted: boolean;
  
  // Transition & Interaction
  isTransitioning: boolean;
  isLongPressing: boolean;
  
  // Media per clip (keyed by clip index)
  mediaStates: Record<number, MediaState>;
  
  // Preload tracking
  preloadedIndices: Set<number>;
  
  // Actions
  setCurrentIndex: (index: number) => void;
  setPlaybackMode: (mode: PlaybackMode) => void;
  setGlobalPause: (paused: boolean) => void;
  toggleMute: () => void;
  setMuted: (muted: boolean) => void;
  setIsTransitioning: (transitioning: boolean) => void;
  setIsLongPressing: (pressing: boolean) => void;
  
  // Media actions
  setMediaState: (clipIndex: number, state: Partial<MediaState>) => void;
  resetMediaState: (clipIndex: number) => void;
  
  // Navigation
  goNext: (total: number) => void;
  goPrev: () => void;
  goToIndex: (index: number, total: number) => void;
  
  // Preload
  markPreloaded: (index: number) => void;
  clearPreloaded: () => void;
  
  // Reset
  reset: () => void;
}

export const useClipEngineStore = create<ClipEngineState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentIndex: 0,
      playbackMode: "once",
      isGloballyPaused: false,
      muted: true,
      isTransitioning: false,
      isLongPressing: false,
      mediaStates: {},
      preloadedIndices: new Set(),
      
      // Basic setters
      setCurrentIndex: (index) => set({ currentIndex: index }),
      setPlaybackMode: (mode) => set({ playbackMode: mode }),
      setGlobalPause: (paused) => set({ isGloballyPaused: paused }),
      toggleMute: () => set((s) => ({ muted: !s.muted })),
      setMuted: (muted) => set({ muted }),
      setIsTransitioning: (transitioning) => set({ isTransitioning: transitioning }),
      setIsLongPressing: (pressing) => set({ isLongPressing: pressing }),
      
      // Media state management
      setMediaState: (clipIndex, state) => set((s) => ({
        mediaStates: {
          ...s.mediaStates,
          [clipIndex]: {
            ...s.mediaStates[clipIndex],
            currentMediaIndex: 0,
            totalMedia: 0,
            progress: 0,
            isMediaLoading: false,
            ...state,
          },
        },
      })),
      
      resetMediaState: (clipIndex) => set((s) => ({
        mediaStates: {
          ...s.mediaStates,
          [clipIndex]: {
            currentMediaIndex: 0,
            totalMedia: 0,
            progress: 0,
            isMediaLoading: false,
          },
        },
      })),
      
      // Navigation - NO scrollIntoView, just state change
      goNext: (total) => {
        const state = get();
        if (state.isTransitioning || total === 0) return;
        
        const nextIndex = state.currentIndex + 1;
        if (nextIndex < total) {
          set({ isTransitioning: true });
          // Small delay for transition animation
          setTimeout(() => {
            set({ currentIndex: nextIndex, isTransitioning: false });
          }, 50);
        } else if (state.playbackMode === "loop") {
          set({ isTransitioning: true });
          setTimeout(() => {
            set({ currentIndex: 0, isTransitioning: false });
          }, 50);
        }
        // In "once" mode at end, do nothing (or trigger end callback)
      },
      
      goPrev: () => {
        const state = get();
        if (state.isTransitioning || state.currentIndex === 0) return;
        
        set({ isTransitioning: true });
        setTimeout(() => {
          set({ currentIndex: state.currentIndex - 1, isTransitioning: false });
        }, 50);
      },
      
      goToIndex: (index, total) => {
        const state = get();
        if (state.isTransitioning) return;
        if (index < 0 || index >= total) return;
        if (index === state.currentIndex) return;
        
        set({ currentIndex: index });
      },
      
      // Preload tracking
      markPreloaded: (index) => set((s) => ({
        preloadedIndices: new Set([...s.preloadedIndices, index]),
      })),
      
      clearPreloaded: () => set({ preloadedIndices: new Set() }),
      
      // Reset
      reset: () => set({
        currentIndex: 0,
        playbackMode: "once",
        isGloballyPaused: false,
        isTransitioning: false,
        isLongPressing: false,
        mediaStates: {},
        preloadedIndices: new Set(),
        // Keep muted preference
      }),
    }),
    {
      name: "clip-engine-storage-v2",
      partialize: (state) => ({
        muted: state.muted,
        playbackMode: state.playbackMode,
      }),
    }
  )
);

// Custom hook with helpers
interface UseClipEngineProps {
  totalClips: number;
  initialIndex?: number;
  onIndexChange?: (index: number) => void;
  onEndReached?: () => void;
}

export function useClipEngine({
  totalClips,
  initialIndex = 0,
  onIndexChange,
  onEndReached,
}: UseClipEngineProps) {
  const store = useClipEngineStore();
  const hasInitialized = useRef(false);
  const prevIndex = useRef(store.currentIndex);
  
  // Initialize index once
  useEffect(() => {
    if (!hasInitialized.current && initialIndex > 0 && initialIndex < totalClips) {
      store.setCurrentIndex(initialIndex);
      hasInitialized.current = true;
    }
  }, [initialIndex, totalClips, store]);
  
  // Notify on index change
  useEffect(() => {
    if (prevIndex.current !== store.currentIndex) {
      prevIndex.current = store.currentIndex;
      onIndexChange?.(store.currentIndex);
    }
  }, [store.currentIndex, onIndexChange]);
  
  // Check for end reached
  useEffect(() => {
    if (store.currentIndex >= totalClips - 1 && totalClips > 0) {
      onEndReached?.();
    }
  }, [store.currentIndex, totalClips, onEndReached]);
  
  // Navigation helpers
  const goNext = useCallback(() => {
    store.goNext(totalClips);
  }, [totalClips, store]);
  
  const goPrev = useCallback(() => {
    store.goPrev();
  }, [store]);
  
  const goToIndex = useCallback((index: number) => {
    store.goToIndex(index, totalClips);
  }, [totalClips, store]);
  
  // Pause/Resume helpers
  const pause = useCallback(() => store.setGlobalPause(true), [store]);
  const resume = useCallback(() => store.setGlobalPause(false), [store]);
  const togglePause = useCallback(() => {
    store.setGlobalPause(!store.isGloballyPaused);
  }, [store]);
  
  // Long press handlers
  const startLongPress = useCallback(() => {
    store.setIsLongPressing(true);
    store.setGlobalPause(true);
  }, [store]);
  
  const endLongPress = useCallback(() => {
    if (store.isLongPressing) {
      store.setIsLongPressing(false);
      store.setGlobalPause(false);
    }
  }, [store]);
  
  return {
    // State
    currentIndex: store.currentIndex,
    playbackMode: store.playbackMode,
    isGloballyPaused: store.isGloballyPaused,
    muted: store.muted,
    isTransitioning: store.isTransitioning,
    isLongPressing: store.isLongPressing,
    mediaStates: store.mediaStates,
    preloadedIndices: store.preloadedIndices,
    
    // Navigation
    goNext,
    goPrev,
    goToIndex,
    
    // Playback control
    pause,
    resume,
    togglePause,
    setPlaybackMode: store.setPlaybackMode,
    toggleMute: store.toggleMute,
    setMuted: store.setMuted,
    setGlobalPause: store.setGlobalPause,
    
    // Long press
    startLongPress,
    endLongPress,
    
    // Media state
    setMediaState: store.setMediaState,
    resetMediaState: store.resetMediaState,
    
    // Preload
    markPreloaded: store.markPreloaded,
    
    // Reset
    reset: store.reset,
  };
}
