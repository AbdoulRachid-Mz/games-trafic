// @/stores/game-clips-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ClipPlaybackState {
  activeClipId: string | null;
  isGloballyPaused: boolean;
  muted: boolean;
  volume: number;
  playbackRates: Record<string, number>;
  commentSheetOpen: boolean;
  activeTab: 'comments' | 'likes';
}

export interface ClipActions {
  setActiveClip: (clipId: string | null) => void;
  setGlobalPause: (paused: boolean) => void;
  toggleMute: () => void;
  setVolume: (volume: number) => void;
  setPlaybackRate: (clipId: string, rate: number) => void;
  setCommentSheetOpen: (open: boolean) => void;
  setActiveTab: (tab: 'comments' | 'likes') => void;
  reset: () => void;
}

export type GameClipsStore = ClipPlaybackState & ClipActions;

const initialState: ClipPlaybackState = {
  activeClipId: null,
  isGloballyPaused: false,
  muted: true,
  volume: 0.7,
  playbackRates: {},
  commentSheetOpen: false,
  activeTab: 'comments',
};

export const useGameClipsStore = create<GameClipsStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setActiveClip: (clipId) => {
        set({ activeClipId: clipId });
      },

      setGlobalPause: (paused) => {
        set({ isGloballyPaused: paused });
      },

      toggleMute: () => {
        set((state) => ({ muted: !state.muted }));
      },

      setVolume: (volume) => {
        set({ volume: Math.max(0, Math.min(1, volume)) });
      },

      setPlaybackRate: (clipId, rate) => {
        set((state) => ({
          playbackRates: { ...state.playbackRates, [clipId]: rate },
        }));
      },

      setCommentSheetOpen: (open) => {
        set({ commentSheetOpen: open });
      },

      setActiveTab: (tab) => {
        set({ activeTab: tab });
      },

      reset: () => {
        set(initialState);
      },
    }),
    {
      name: 'game-clips-storage',
      partialize: (state) => ({
        muted: state.muted,
        volume: state.volume,
      }),
    }
  )
);