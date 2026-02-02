// components/pages/chats/message-bubble.tsx
"use client";

import React from "react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types/chat";
import { formatMessageTime } from "@/lib/chat-utils";
import { getInitials } from "@/utils/chat-helpers";
import { Check, CheckCheck, Reply } from "lucide-react";
import Image from "next/image";

interface MessageBubbleProps {
  message: ChatMessage;
  isSent: boolean;
  showSender?: boolean;
  showTimestamp?: boolean;
  onReply?: (message: ChatMessage) => void;
  className?: string;
}

export function MessageBubble({
  message,
  isSent,
  showSender = false,
  showTimestamp = false,
  onReply,
  className,
}: MessageBubbleProps) {
  const senderName =
    message.sender?.fullName || message.sender?.username || "Unknown";
  const senderAvatar = message.sender?.profileImage;
  const initials = getInitials(senderName);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex gap-2 group",
        isSent ? "flex-row-reverse" : "flex-row",
        className
      )}
    >
      {/* Avatar (only for received messages in groups) */}
      {!isSent && showSender && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={senderAvatar || undefined} alt={senderName} />
          <AvatarFallback className="text-xs bg-[var(--chat-primary)] text-[var(--chat-messageSentText)]">
            {initials}
          </AvatarFallback>
        </Avatar>
      )}

      <div
        className={cn("flex flex-col gap-1 max-w-[70%]", isSent && "items-end")}
      >
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
              Replying to
            </p>
            <p className="text-[var(--chat-textMuted)] truncate">
              {message.replyTo.content}
            </p>
          </div>
        )}

        {/* Message bubble */}
        <div
          className={cn(
            "px-3 py-2 rounded-2xl relative",
            isSent
              ? "bg-[var(--chat-messageSent)] text-[var(--chat-messageSentText)] rounded-tr-sm"
              : "bg-[var(--chat-messageReceived)] text-[var(--chat-messageReceivedText)] rounded-tl-sm",
            "shadow-sm"
          )}
        >
          {/* Images */}
          {message.images && message.images.length > 0 && (
            <div
              className={cn(
                "grid gap-1 mb-2",
                message.images.length === 1 && "grid-cols-1",
                message.images.length === 2 && "grid-cols-2",
                message.images.length >= 3 && "grid-cols-2"
              )}
            >
              {message.images.slice(0, 4).map((image, index) => (
                <div
                  key={index}
                  className="relative rounded-lg overflow-hidden aspect-square cursor-pointer hover:opacity-90 transition-opacity"
                >
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
                </div>
              ))}
            </div>
          )}

          {/* Text content */}
          {message.content && (
            <p className="text-sm whitespace-pre-wrap break-words">
              {message.content}
            </p>
          )}

          {/* Timestamp and status */}
          <div
            className={cn(
              "flex items-center gap-1 mt-1",
              isSent ? "justify-end" : "justify-start"
            )}
          >
            <span
              className={cn(
                "text-[10px]",
                isSent
                  ? "text-[var(--chat-messageSentText)]/70"
                  : "text-[var(--chat-textMuted)]"
              )}
            >
              {message.createdAt ? formatMessageTime(message.createdAt) : ""}
            </span>

            {/* Read receipts (for sent messages) */}
            {isSent && (
              <span className="flex-shrink-0">
                {message.status === "read" || message.read ? (
                  <CheckCheck className="h-3 w-3 text-[var(--chat-messageSentText)]" />
                ) : message.status === "delivered" ? (
                  <CheckCheck className="h-3 w-3 text-[var(--chat-messageSentText)]/50" />
                ) : message.status === "sent" ? (
                  <Check className="h-3 w-3 text-[var(--chat-messageSentText)]/50" />
                ) : message.status === "sending" ? (
                  <div className="h-3 w-3 rounded-full border-2 border-[var(--chat-messageSentText)]/50 border-t-transparent animate-spin" />
                ) : message.status === "failed" ? (
                  <span className="text-[var(--chat-error)]">!</span>
                ) : (
                  <Check className="h-3 w-3 text-[var(--chat-messageSentText)]/50" />
                )}
              </span>
            )}
          </div>
        </div>

        {/* Reply button (on hover) */}
        {onReply && (
          <button
            onClick={() => onReply(message)}
            className={cn(
              "opacity-0 group-hover:opacity-100 transition-opacity",
              "text-xs text-[var(--chat-textMuted)] hover:text-[var(--chat-primary)]",
              "flex items-center gap-1 px-2",
              isSent && "flex-row-reverse"
            )}
          >
            <Reply className="h-3 w-3" />
            Reply
          </button>
        )}
      </div>
    </motion.div>
  );
}
