// stores/chat-audio-store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Saved playback state for a single audio message (persisted in localStorage)
 */
export interface AudioPlaybackState {
  currentTime: number;
  duration: number;
  completed: boolean;
}

/**
 * Runtime state for the global audio player
 */
export interface ChatAudioState {
  /** ID of the currently playing audio message */
  activeMessageId: string | null;
  /** Whether the active audio is currently playing */
  isPlaying: boolean;
  /** Persisted playback positions per messageId */
  playbackStates: Record<string, AudioPlaybackState>;
  /** Set of URLs already downloaded/cached by the user */
  cachedMediaUrls: string[];
}

export interface ChatAudioActions {
  /** Start playing an audio message (pauses any other) */
  play: (messageId: string) => void;
  /** Pause the currently playing audio */
  pause: () => void;
  /** Stop and reset the active audio */
  stop: () => void;
  /** Save playback progress for a message */
  saveProgress: (messageId: string, currentTime: number, duration: number) => void;
  /** Mark a message audio as completed */
  markCompleted: (messageId: string) => void;
  /** Get saved progress for a message */
  getProgress: (messageId: string) => AudioPlaybackState | null;
  /** Clear saved progress for a message */
  clearProgress: (messageId: string) => void;
  /** Mark a media URL as cached/downloaded */
  addCachedMedia: (url: string) => void;
  /** Check if a media URL is already cached */
  isMediaCached: (url: string) => boolean;
  /** Reset all state */
  reset: () => void;
}

export type ChatAudioStore = ChatAudioState & ChatAudioActions;

const initialState: ChatAudioState = {
  activeMessageId: null,
  isPlaying: false,
  playbackStates: {},
  cachedMediaUrls: [],
};

export const useChatAudioStore = create<ChatAudioStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      play: (messageId) => {
        const prev = get().activeMessageId;
        // If a different audio is active, it will be paused by the component via the store change
        set({
          activeMessageId: messageId,
          isPlaying: true,
        });
        // Dispatch global event so any HTMLAudioElement knows to stop
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("chat-audio-play", { detail: { id: messageId } })
          );
        }
      },

      pause: () => {
        set({ isPlaying: false });
      },

      stop: () => {
        set({ activeMessageId: null, isPlaying: false });
      },

      saveProgress: (messageId, currentTime, duration) => {
        set((state) => ({
          playbackStates: {
            ...state.playbackStates,
            [messageId]: {
              currentTime,
              duration,
              completed: false,
            },
          },
        }));
      },

      markCompleted: (messageId) => {
        set((state) => ({
          playbackStates: {
            ...state.playbackStates,
            [messageId]: {
              ...(state.playbackStates[messageId] || { currentTime: 0, duration: 0 }),
              completed: true,
              currentTime: 0,
            },
          },
          isPlaying: state.activeMessageId === messageId ? false : state.isPlaying,
        }));
      },

      getProgress: (messageId) => {
        return get().playbackStates[messageId] || null;
      },

      clearProgress: (messageId) => {
        set((state) => {
          const { [messageId]: _, ...rest } = state.playbackStates;
          return { playbackStates: rest };
        });
      },

      addCachedMedia: (url) => {
        set((state) => {
          if (state.cachedMediaUrls.includes(url)) return state;
          // Keep last 200 cached URLs to avoid unbounded growth
          const urls = [...state.cachedMediaUrls, url].slice(-200);
          return { cachedMediaUrls: urls };
        });
      },

      isMediaCached: (url) => {
        return get().cachedMediaUrls.includes(url);
      },

      reset: () => {
        set(initialState);
      },
    }),
    {
      name: "chat-audio-storage",
      partialize: (state) => ({
        playbackStates: state.playbackStates,
        cachedMediaUrls: state.cachedMediaUrls,
      }),
    }
  )
);
