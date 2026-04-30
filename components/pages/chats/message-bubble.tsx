// components/pages/chats/message-bubble.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types/chat";
import { formatMessageTime } from "@/lib/chat-utils";
import { getInitials } from "@/utils/chat-helpers";
import { Check, CheckCheck, Reply, Play, Pause, Mic, Download } from "lucide-react";
import Image from "next/image";
import { MessageActionsDropdown } from "./message-actions-dropdown";
import { toast } from "sonner";
import { useChatThemeContext } from "@/contexts/chat-theme-context";

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

function AudioPlayer({ url, messageId, autoDownload = true }: { url: string; messageId: string; autoDownload?: boolean }) {
  const [isDownloaded, setIsDownloaded] = useState(autoDownload);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!isDownloaded) return;

    const handleOtherAudioPlay = (e: CustomEvent) => {
      if (e.detail.id !== messageId && isPlaying) {
        if (audioRef.current) {
          audioRef.current.pause();
        }
        setIsPlaying(false);
      }
    };
    window.addEventListener("chat-audio-play", handleOtherAudioPlay as EventListener);
    return () => window.removeEventListener("chat-audio-play", handleOtherAudioPlay as EventListener);
  }, [isPlaying, messageId, isDownloaded]);

  useEffect(() => {
    if (!isDownloaded) return;
    const audio = new Audio(url);
    audioRef.current = audio;

    const setAudioData = () => setDuration(audio.duration);
    const setAudioTime = () =>
      setProgress((audio.currentTime / audio.duration) * 100);
    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      audio.currentTime = 0;
    };

    audio.addEventListener("loadedmetadata", setAudioData);
    audio.addEventListener("timeupdate", setAudioTime);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.pause();
      audio.removeEventListener("loadedmetadata", setAudioData);
      audio.removeEventListener("timeupdate", setAudioTime);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [url, isDownloaded]);

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDownloaded(true);
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        window.dispatchEvent(new CustomEvent("chat-audio-play", { detail: { id: messageId } }));
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  if (!isDownloaded) {
    return (
      <div className="flex items-center gap-3 py-2 min-w-[200px]">
        <div
          onClick={handleDownload}
          className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors"
        >
          <Download className="h-5 w-5 fill-current" />
        </div>
        <div className="flex-1 space-y-1">
          <div className="h-1 w-full bg-white/30 rounded-full overflow-hidden" />
          <div className="flex justify-between text-[10px] opacity-70">
            <span>Télécharger l'audio</span>
            <div className="flex items-center gap-1">
              <Mic className="h-3 w-3" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 py-2 min-w-[200px]">
      <div
        onClick={togglePlay}
        className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors"
      >
        {isPlaying ? (
          <Pause className="h-5 w-5 fill-current" />
        ) : (
          <Play className="h-5 w-5 fill-current ml-1" />
        )}
      </div>
      <div className="flex-1 space-y-1">
        <div className="h-1 w-full bg-white/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-white transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] opacity-70">
          <span>{formatTime(audioRef.current?.currentTime || 0)}</span>
          <div className="flex items-center gap-1">
            <span>{duration ? formatTime(duration) : "..."}</span>
            <Mic className="h-3 w-3" />
          </div>
        </div>
      </div>
    </div>
  );
}

interface MessageBubbleProps {
  message: ChatMessage;
  isSent: boolean;
  showSender?: boolean;
  showTimestamp?: boolean;
  // Actions
  onReply?: (message: ChatMessage) => void;
  onDelete?: (messageId: string) => void;
  onLike?: (messageId: string) => void;
  onPin?: (messageId: string) => void;
  // Like state
  isLiked?: boolean;
  likeCount?: number;
  // Selection mode
  isSelected?: boolean;
  isSelectionMode?: boolean;
  onSelect?: (messageId: string) => void;
  // Permissions
  currentUserId: string;
  canPin?: boolean;
  className?: string;
}

export function MessageBubble({
  message,
  isSent,
  showSender = false,
  showTimestamp = false,
  onReply,
  onDelete,
  onLike,
  onPin,
  isLiked = false,
  likeCount = 0,
  isSelected = false,
  isSelectionMode = false,
  onSelect,
  currentUserId,
  canPin = false,
  className,
}: MessageBubbleProps) {
  const { settings } = useChatThemeContext();
  const autoDownload = settings?.autoDownloadMedia !== false;
  const [downloadedImages, setDownloadedImages] = useState(autoDownload);

  const senderName =
    message.sender?.fullName || message.sender?.username || "Unknown";
  const senderAvatar = message.sender?.profileImage;
  const initials = getInitials(senderName);
  const canDelete = isSent;

  const handleCopy = async () => {
    if (!message.content) return;
    try {
      await navigator.clipboard.writeText(message.content);
      toast.success("Texte copié");
    } catch {
      toast.error("Impossible de copier");
    }
  };

  const handleBubbleClick = () => {
    if (isSelectionMode && onSelect) {
      onSelect(message.id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex gap-2 group relative",
        isSent ? "flex-row-reverse" : "flex-row",
        isSelectionMode && "cursor-pointer",
        className
      )}
      onClick={handleBubbleClick}
    >
      {/* Selection checkbox */}
      {isSelectionMode && (
        <div
          className={cn(
            "flex-shrink-0 flex items-center",
            isSent ? "order-last ml-2" : "order-first mr-2"
          )}
        >
          <div
            className={cn(
              "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
              isSelected
                ? "bg-[var(--chat-primary)] border-[var(--chat-primary)]"
                : "border-[var(--chat-textMuted)] bg-transparent"
            )}
          >
            {isSelected && (
              <Check className="h-3 w-3 text-white" />
            )}
          </div>
        </div>
      )}

      {/* Avatar (only for received messages in groups) */}
      {!isSent && showSender && (
        <Avatar className="h-8 w-8 flex-shrink-0 self-end mb-6">
          <AvatarImage src={senderAvatar || undefined} alt={senderName} />
          <AvatarFallback className="text-xs bg-[var(--chat-primary)] text-[var(--chat-messageSentText)]">
            {initials}
          </AvatarFallback>
        </Avatar>
      )}

      {/* Message content column */}
      <div className={cn("flex flex-col gap-1 max-w-[70%]", isSent && "items-end")}>
        {/* Sender name (for group chats) */}
        {showSender && !isSent && (
          <span className="text-xs text-[var(--chat-textMuted)] px-3">
            {senderName}
          </span>
        )}

        {/* Reply preview */}
        {message.replyTo && (
          <div
            className={cn(
              "px-3 py-2 rounded-lg text-xs border-l-2",
              isSent
                ? "bg-[var(--chat-messageSent)]/20 border-[var(--chat-messageSentText)]"
                : "bg-[var(--chat-messageReceived)]/50 border-[var(--chat-primary)]"
            )}
          >
            <p className="font-semibold text-[var(--chat-primary)]">
              En réponse à
            </p>
            <p className="text-[var(--chat-textMuted)] truncate">
              {message.replyTo.content}
            </p>
          </div>
        )}

        {/* Bubble row with ... button */}
        <div
          className={cn(
            "flex items-end gap-1.5",
            isSent ? "flex-row-reverse" : "flex-row"
          )}
        >
          {/* Message bubble */}
          <div
            className={cn(
              "px-3 py-1.5 rounded-2xl relative shadow-sm",
              isSent
                ? "bg-[var(--chat-primary)] text-white rounded-tr-none"
                : "bg-[var(--chat-surface)] text-[var(--chat-text)] rounded-tl-none border border-[var(--chat-border)]",
              message.isDeleted && "opacity-60 italic"
            )}
          >
            {message.isDeleted ? (
              <p className="text-[13px] text-current/70 select-none">
                🚫 Message supprimé
              </p>
            ) : (
              <>
                {/* Images */}
                {message.images && message.images.length > 0 && (
                  <div
                    className={cn(
                      "grid gap-1 mb-1.5",
                      message.images.length === 1 && "grid-cols-1",
                      message.images.length === 2 && "grid-cols-2",
                      message.images.length >= 3 && "grid-cols-2"
                    )}
                  >
                    {message.images.slice(0, 4).map((image, index) => (
                      <div
                        key={index}
                        className="relative rounded-lg overflow-hidden aspect-square cursor-pointer hover:opacity-90 transition-opacity bg-black/10 flex items-center justify-center"
                        onClick={(e) => {
                          if (!downloadedImages) {
                            e.stopPropagation();
                            setDownloadedImages(true);
                          }
                        }}
                      >
                        {downloadedImages ? (
                          <>
                            <Image
                              src={image}
                              alt={`Image ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                            {message.images!.length > 4 && index === 3 && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-semibold">
                                +{message.images!.length - 4}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <div className="h-10 w-10 rounded-full bg-black/40 flex items-center justify-center">
                              <Download className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-[10px] text-white/80 font-medium bg-black/40 px-2 py-0.5 rounded-full">
                              Télécharger
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Audio */}
                {message.type === "AUDIO" && message.audioUrl && (
                  <AudioPlayer url={message.audioUrl} messageId={message.id} autoDownload={autoDownload} />
                )}

                {/* Text */}
                {message.content && (
                  <p className="text-[15px] whitespace-pre-wrap break-words leading-relaxed mb-1">
                    {message.content}
                  </p>
                )}
              </>
            )}

            {/* Timestamp + read receipts */}
            <div className="flex items-center gap-1 justify-end opacity-70">
              <span className="text-[10px]">
                {message.createdAt ? formatMessageTime(message.createdAt) : ""}
              </span>
              {isSent && (
                <span className="flex-shrink-0">
                  {message.readBy && message.readBy.length > 1 ? (
                    <CheckCheck className="h-4 w-4 text-[#53bdeb]" />
                  ) : (
                    <CheckCheck className="h-4 w-4" />
                  )}
                </span>
              )}
            </div>
          </div>

          {/* ··· Actions button — visible on hover, hidden in selection mode */}
          {!isSelectionMode && !message.isDeleted && (
            <MessageActionsDropdown
              message={message}
              isSent={isSent}
              isLiked={isLiked}
              canDelete={canDelete}
              canPin={canPin}
              onReply={() => onReply?.(message)}
              onLike={() => onLike?.(message.id)}
              onCopy={handleCopy}
              onDelete={() => onDelete?.(message.id)}
              onPin={onPin ? () => onPin(message.id) : undefined}
              onSelect={onSelect ? () => onSelect(message.id) : undefined}
              className={cn(
                "mb-1 flex-shrink-0",
                isSent ? "mr-0.5" : "ml-0.5"
              )}
            />
          )}
        </div>

        {/* ❤️ Likes badge */}
        {likeCount > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onLike?.(message.id);
            }}
            className={cn(
              "flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium",
              "bg-[var(--chat-surface)] border border-[var(--chat-border)] shadow-sm",
              "hover:scale-105 transition-transform cursor-pointer",
              isSent ? "self-end" : "self-start",
              "-mt-1 mb-0.5"
            )}
          >
            <span className="text-[13px]">❤️</span>
            <span className="text-[var(--chat-text)]">{likeCount}</span>
          </button>
        )}
      </div>
    </motion.div>
  );
}
