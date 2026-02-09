// components/pages/chats/message-list.tsx
"use client";

import React, { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { MessageBubble } from "./message-bubble";
import type { ChatMessage } from "@/types/chat";
import {
  groupMessagesByDate,
  shouldShowSenderName,
  getTypingIndicatorText,
} from "@/utils/chat-helpers";
import { formatMessageDate } from "@/lib/chat-utils";
import { MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MessageListProps {
  messages: ChatMessage[];
  currentUserId: string;
  isGroup?: boolean;
  isLoading?: boolean;
  typingUsers?: string[];
  onReply?: (message: ChatMessage) => void;
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
  onLoadMore,
  hasMore = false,
  className,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isFirstLoad = useRef(true);

  // Group messages by date
  const groupedMessages = groupMessagesByDate(messages);

  // Scroll to bottom on first load or new message
  useEffect(() => {
    if (isFirstLoad.current && messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: "auto" });
      isFirstLoad.current = false;
    } else if (messages.length > 0) {
      // Check if user is near bottom before auto-scrolling
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

  // Handle scroll for load more
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop } = e.currentTarget;

    // Load more when scrolled to top
    if (scrollTop === 0 && hasMore && !isLoading && onLoadMore) {
      onLoadMore();
    }
  };

  // Loading state
  if (isLoading && messages.length === 0) {
    return (
      <div className="flex-1 p-4 space-y-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className={`flex gap-2 ${i % 2 === 0 ? "flex-row" : "flex-row-reverse"
              }`}
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

  // Empty state
  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <MessageSquare className="size-4" />
            </EmptyMedia>
            <EmptyTitle>No messages yet</EmptyTitle>
            <EmptyDescription>Start the conversation by sending a message</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return (
    <ScrollArea className={className} onScroll={handleScroll} ref={scrollRef}>
      <div className="p-4 space-y-4">
        {/* Load more indicator */}
        {hasMore && (
          <div className="text-center py-2">
            <span className="text-xs text-[var(--chat-textMuted)]">
              {isLoading ? "Loading..." : "Scroll up to load more"}
            </span>
          </div>
        )}

        {/* Messages grouped by date */}
        {Array.from(groupedMessages.entries()).map(
          ([dateKey, dateMessages]) => (
            <div key={dateKey} className="space-y-3">
              {/* Date separator */}
              <div className="flex items-center justify-center">
                <div className="bg-[var(--chat-surface)] px-3 py-1 rounded-full border border-[var(--chat-border)]">
                  <span className="text-xs font-medium text-[var(--chat-textMuted)]">
                    {formatMessageDate(dateMessages[0].createdAt ?? new Date())}
                  </span>
                </div>
              </div>

              {/* Messages for this date */}
              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {dateMessages.map((message, index) => {
                    const previousMessage =
                      index > 0 ? dateMessages[index - 1] : null;
                    const isSent = message.senderId === currentUserId;
                    const showSender = shouldShowSenderName(
                      message,
                      previousMessage,
                      isGroup
                    );

                    return (
                      <MessageBubble
                        key={message.id}
                        message={message}
                        isSent={isSent}
                        showSender={showSender && !isSent}
                        onReply={onReply}
                      />
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          )
        )}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex items-center gap-2"
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

        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
