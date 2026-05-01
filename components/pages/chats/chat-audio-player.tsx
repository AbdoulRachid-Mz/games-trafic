// components/pages/chats/chat-audio-player.tsx
"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Play, Pause, Download, Mic } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChatAudioStore } from "@/stores/chat-audio-store";
import { toast } from "sonner";

interface ChatAudioPlayerProps {
  src: string;
  messageId: string;
  isSent: boolean;
  autoDownload?: boolean;
}

function formatTime(sec: number) {
  if (!sec || !isFinite(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

export function ChatAudioPlayer({
  src,
  messageId,
  isSent,
  autoDownload = true,
}: ChatAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const {
    activeMessageId,
    isPlaying: globalIsPlaying,
    play,
    pause,
    stop,
    saveProgress,
    markCompleted,
    getProgress,
    addCachedMedia,
    isMediaCached,
  } = useChatAudioStore();

  const isActive = activeMessageId === messageId;
  const isPlaying = isActive && globalIsPlaying;

  // Local UI state
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(
    autoDownload || isMediaCached(src)
  );

  // Initialize audio element
  useEffect(() => {
    if (!isDownloaded) return;

    const audio = document.createElement("audio");
    audio.src = src;
    audio.crossOrigin = "anonymous";
    audio.preload = "metadata";
    audioRef.current = audio;

    const onLoaded = () => {
      setDuration(audio.duration || 0);
      setIsLoaded(true);

      // Restore saved progress
      const saved = getProgress(messageId);
      if (saved && !saved.completed && saved.currentTime > 0) {
        audio.currentTime = saved.currentTime;
        setCurrentTime(saved.currentTime);
        setProgress((saved.currentTime / audio.duration) * 100);
      }
    };

    const onTimeUpdate = () => {
      const ct = audio.currentTime;
      const dur = audio.duration;
      setCurrentTime(ct);
      setProgress((ct / dur) * 100);
    };

    const onEnded = () => {
      setProgress(0);
      setCurrentTime(0);
      markCompleted(messageId);
    };

    const onError = () => {
      console.error("Audio load error for:", src);
    };

    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    // Mark as cached
    addCachedMedia(src);

    return () => {
      // Save progress before unmount
      if (audio.currentTime > 0 && audio.duration > 0) {
        saveProgress(messageId, audio.currentTime, audio.duration);
      }
      audio.pause();
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
      audioRef.current = null;
    };
  }, [src, isDownloaded, messageId]);

  // React to global store changes (another audio started playing)
  useEffect(() => {
    if (!audioRef.current) return;

    if (isActive && globalIsPlaying) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [isActive, globalIsPlaying]);

  // Listen for external play events (stops this audio if another starts)
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      if (e.detail?.id !== messageId && audioRef.current) {
        audioRef.current.pause();
      }
    };
    window.addEventListener(
      "chat-audio-play",
      handler as EventListener
    );
    return () =>
      window.removeEventListener(
        "chat-audio-play",
        handler as EventListener
      );
  }, [messageId]);

  // Save progress when page becomes hidden (user leaves)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && audioRef.current && isActive) {
        const audio = audioRef.current;
        if (audio.currentTime > 0 && audio.duration > 0) {
          saveProgress(messageId, audio.currentTime, audio.duration);
        }
        audio.pause();
        pause();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [messageId, isActive, pause, saveProgress]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current || !isLoaded) return;

    if (isPlaying) {
      pause();
    } else {
      play(messageId);
    }
  }, [isPlaying, isLoaded, messageId, play, pause]);

  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!audioRef.current || !progressBarRef.current || !isLoaded) return;
      const rect = progressBarRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = Math.max(0, Math.min(1, x / rect.width));
      audioRef.current.currentTime = pct * audioRef.current.duration;
    },
    [isLoaded]
  );

  const handleDownloadFile = useCallback(() => {
    const link = document.createElement("a");
    link.href = src;
    link.download = `audio-${messageId}.webm`;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Téléchargement lancé");
  }, [src, messageId]);

  const handleUnlock = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsDownloaded(true);
    },
    []
  );

  // ─── NOT DOWNLOADED YET ───
  if (!isDownloaded) {
    return (
      <div
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-2xl min-w-[220px]",
          isSent ? "text-white" : "text-[var(--chat-text)]"
        )}
      >
        <button
          onClick={handleUnlock}
          className={cn(
            "h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors",
            isSent
              ? "bg-white/20 hover:bg-white/30"
              : "bg-[var(--chat-primary)]/15 hover:bg-[var(--chat-primary)]/25"
          )}
        >
          <Download
            className={cn(
              "h-5 w-5",
              isSent ? "text-white" : "text-[var(--chat-primary)]"
            )}
          />
        </button>
        <div className="flex-1 space-y-1.5">
          <div
            className={cn(
              "h-1 w-full rounded-full",
              isSent ? "bg-white/20" : "bg-[var(--chat-border)]"
            )}
          />
          <div className="flex justify-between items-center">
            <span className="text-[10px] opacity-60">Télécharger l'audio</span>
            <Mic
              className={cn(
                "h-3 w-3",
                isSent ? "text-white/60" : "text-[var(--chat-textMuted)]"
              )}
            />
          </div>
        </div>
      </div>
    );
  }

  // ─── PLAYER ───
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-2xl min-w-[220px]",
        isSent ? "text-white" : "text-[var(--chat-text)]"
      )}
    >
      {/* Play/Pause button */}
      <button
        onClick={togglePlay}
        className={cn(
          "h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all",
          isSent
            ? "bg-white/20 hover:bg-white/30"
            : "bg-[var(--chat-primary)]/15 hover:bg-[var(--chat-primary)]/25",
          isPlaying && "animate-pulse"
        )}
      >
        {isPlaying ? (
          <Pause
            className={cn(
              "h-5 w-5",
              isSent ? "text-white" : "text-[var(--chat-primary)]"
            )}
          />
        ) : (
          <Play
            className={cn(
              "h-5 w-5 ml-0.5",
              isSent ? "text-white fill-white" : "text-[var(--chat-primary)] fill-[var(--chat-primary)]"
            )}
          />
        )}
      </button>

      {/* Waveform + time */}
      <div className="flex-1 space-y-1.5">
        {/* Progress bar (clickable for seek) */}
        <div
          ref={progressBarRef}
          onClick={handleSeek}
          className={cn(
            "h-1.5 w-full rounded-full overflow-hidden cursor-pointer relative",
            isSent ? "bg-white/20" : "bg-[var(--chat-border)]"
          )}
        >
          <div
            className={cn(
              "h-full rounded-full transition-all duration-100",
              isSent ? "bg-white" : "bg-[var(--chat-primary)]"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Time + controls */}
        <div className="flex justify-between items-center">
          <span className="text-[10px] opacity-60">
            {isPlaying || currentTime > 0
              ? formatTime(currentTime)
              : formatTime(duration)}
          </span>
          <div className="flex items-center gap-1.5">
            {/* Download button */}
            <button
              onClick={handleDownloadFile}
              className="opacity-50 hover:opacity-100 transition-opacity"
              title="Télécharger"
            >
              <Download className="h-3 w-3" />
            </button>
            <Mic
              className={cn(
                "h-3 w-3",
                isSent ? "text-white/50" : "text-[var(--chat-textMuted)]"
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
