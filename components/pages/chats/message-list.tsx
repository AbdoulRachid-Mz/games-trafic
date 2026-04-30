// components/pages/chats/message-list.tsx
"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { MessageBubble } from "./message-bubble";
import type { ChatMessage } from "@/types/chat";
import {
  groupMessagesByDate,
  shouldShowSenderName,
  getTypingIndicatorText,
} from "@/utils/chat-helpers";
import { formatMessageDate } from "@/lib/chat-utils";
import { MessageSquare, X, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedItem } from "@/components/AnimatedList";
import { cn } from "@/lib/utils";

const LONG_PRESS_DURATION = 500; // ms

interface MessageListProps {
  messages: ChatMessage[];
  currentUserId: string;
  isGroup?: boolean;
  isLoading?: boolean;
  typingUsers?: string[];
  onReply?: (message: ChatMessage) => void;
  onDelete?: (messageId: string) => void;
  onLike?: (messageId: string) => void;
  onPin?: (messageId: string) => void;
  /** Map of messageId → likeCount */
  likeCounts?: Record<string, number>;
  /** Set of messageIds liked by the current user */
  likedMessageIds?: Set<string>;
  onLoadMore?: () => void;
  hasMore?: boolean;
  className?: string;
}

export function MessageList({
  messages,
  currentUserId,
  isGroup = false,
  isLoading = false,
  typingUsers = [],
  onReply,
  onDelete,
  onLike,
  onPin,
  likeCounts = {},
  likedMessageIds = new Set(),
  onLoadMore,
  hasMore = false,
  className,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isFirstLoad = useRef(true);

  // ── Selection mode ────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const isSelectionMode = selectedIds.size > 0;

  const handleSelect = useCallback((messageId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(messageId)) {
        next.delete(messageId);
      } else {
        next.add(messageId);
      }
      return next;
    });
  }, []);

  const clearSelection = () => setSelectedIds(new Set());

  const handleBulkDelete = () => {
    selectedIds.forEach((id) => onDelete?.(id));
    clearSelection();
  };

  // ── Long press → enter selection mode ─────────────────────────
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLongPressStart = useCallback((messageId: string) => {
    longPressTimer.current = setTimeout(() => {
      setSelectedIds(new Set([messageId]));
    }, LONG_PRESS_DURATION);
  }, []);

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  // ── Scroll to bottom ──────────────────────────────────────────
  const groupedMessages = groupMessagesByDate(messages);

  useEffect(() => {
    if (isFirstLoad.current && messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: "auto" });
      isFirstLoad.current = false;
    } else if (messages.length > 0) {
      const scrollElement = scrollRef.current;
      if (scrollElement) {
        const { scrollTop, scrollHeight, clientHeight } = scrollElement;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
        if (isNearBottom) {
          bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        }
      }
    }
  }, [messages.length]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isNearTop =
      Math.abs(target.scrollTop) + target.clientHeight >=
      target.scrollHeight - 50;
    if (isNearTop && hasMore && !isLoading && onLoadMore) {
      onLoadMore();
    }
  };

  // ── Loading ───────────────────────────────────────────────────
  if (isLoading && messages.length === 0) {
    return (
      <div className="flex-1 p-4 space-y-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className={`flex gap-2 ${i % 2 === 0 ? "flex-row" : "flex-row-reverse"}`}
          >
            <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
            <div className="space-y-2 max-w-[70%]">
              <Skeleton className="h-16 w-full rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ── Empty ─────────────────────────────────────────────────────
  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <MessageSquare className="size-4" />
            </EmptyMedia>
            <EmptyTitle>Aucun message</EmptyTitle>
            <EmptyDescription>
              Commencez la conversation en envoyant un message
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full relative", className)}>
      {/* ── Selection mode header bar ── */}
      <AnimatePresence>
        {isSelectionMode && (
          <motion.div
            initial={{ y: -48, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -48, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className={cn(
              "absolute top-0 left-0 right-0 z-20",
              "flex items-center justify-between px-4 py-2.5",
              "bg-[var(--chat-primary)] text-white shadow-md"
            )}
          >
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-white hover:bg-white/20"
                onClick={clearSelection}
              >
                <X className="h-4 w-4" />
              </Button>
              <span className="font-semibold text-sm">
                {selectedIds.size} sélectionné{selectedIds.size > 1 ? "s" : ""}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 gap-1.5"
              onClick={handleBulkDelete}
            >
              <Trash2 className="h-4 w-4" />
              Supprimer
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Message list ── */}
      <div
        className="flex flex-col-reverse overflow-y-auto no-scrollbar h-full w-full"
        onScroll={handleScroll}
        ref={scrollRef}
      >
        <div className="p-4 flex flex-col-reverse gap-4">
          <div ref={bottomRef} />

          {/* Typing indicator */}
          {typingUsers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex items-center gap-2 mb-2"
            >
              <div className="bg-[var(--chat-messageReceived)] px-4 py-2 rounded-2xl rounded-tl-sm">
                <div className="flex items-center gap-1">
                  <div className="flex gap-1">
                    <span
                      className="w-2 h-2 bg-[var(--chat-textMuted)] rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <span
                      className="w-2 h-2 bg-[var(--chat-textMuted)] rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <span
                      className="w-2 h-2 bg-[var(--chat-textMuted)] rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                </div>
              </div>
              <span className="text-xs text-[var(--chat-textMuted)]">
                {getTypingIndicatorText(typingUsers)}
              </span>
            </motion.div>
          )}

          {/* Messages grouped by date */}
          {Array.from(groupedMessages.entries())
            .reverse()
            .map(([dateKey, dateMessages]) => (
              <div key={dateKey} className="flex flex-col-reverse gap-3">
                <div className="flex flex-col-reverse gap-2">
                  <AnimatePresence mode="popLayout">
                    {dateMessages
                      .slice()
                      .reverse()
                      .map((message, reversedIndex) => {
                        const index = dateMessages.length - 1 - reversedIndex;
                        const previousMessage =
                          index > 0 ? dateMessages[index - 1] : null;
                        const isSent = message.senderId === currentUserId;
                        const showSender = shouldShowSenderName(
                          message,
                          previousMessage,
                          isGroup
                        );

                        return (
                          <AnimatedItem
                            key={message.id}
                            index={index}
                            delay={0.05}
                          >
                            <div
                              onPointerDown={() =>
                                handleLongPressStart(message.id)
                              }
                              onPointerUp={handleLongPressEnd}
                              onPointerLeave={handleLongPressEnd}
                            >
                              <MessageBubble
                                message={message}
                                isSent={isSent}
                                showSender={showSender && !isSent}
                                currentUserId={currentUserId}
                                onReply={onReply}
                                onDelete={onDelete}
                                onLike={onLike}
                                onPin={onPin}
                                isLiked={likedMessageIds.has(message.id)}
                                likeCount={likeCounts[message.id] ?? 0}
                                isSelected={selectedIds.has(message.id)}
                                isSelectionMode={isSelectionMode}
                                onSelect={handleSelect}
                              />
                            </div>
                          </AnimatedItem>
                        );
                      })}
                  </AnimatePresence>
                </div>

                {/* Date separator */}
                <div className="flex items-center justify-center my-2">
                  <div className="bg-[var(--chat-surface)] px-3 py-1 rounded-full border border-[var(--chat-border)]">
                    <span className="text-xs font-medium text-[var(--chat-textMuted)]">
                      {formatMessageDate(
                        dateMessages[0].createdAt ?? new Date()
                      )}
                    </span>
                  </div>
                </div>
              </div>
            ))}

          {/* Load more */}
          {hasMore && (
            <div className="text-center py-4">
              <span className="text-xs text-[var(--chat-textMuted)]">
                {isLoading ? "Chargement..." : "Défilez pour charger plus"}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
