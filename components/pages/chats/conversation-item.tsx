// components/pages/chats/conversation-item.tsx
"use client";

import React from "react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/types/chat";
import {
  getEntityName,
  getEntityAvatar,
  getInitials,
  getLastMessagePreview,
} from "@/utils/chat-helpers";
import { formatMessageTime } from "@/lib/chat-utils";
import { Check, CheckCheck, Pin, Volume2, VolumeX } from "lucide-react";

interface ConversationItemProps {
  conversation: Conversation;
  isActive?: boolean;
  onClick?: () => void;
}

export function ConversationItem({
  conversation,
  isActive = false,
  onClick,
}: ConversationItemProps) {
  const entityName = getEntityName(conversation);
  const entityAvatar = getEntityAvatar(conversation);
  const initials = getInitials(entityName);
  const lastMessagePreview = getLastMessagePreview(conversation);
  const hasUnread = conversation.unreadCount > 0;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
        "hover:bg-[var(--chat-surfaceHover)]",
        isActive &&
          "bg-[var(--chat-surface)] border border-[var(--chat-border)]",
        !isActive && "bg-transparent"
      )}
      onClick={onClick}
    >
      {/* Avatar with online status */}
      <div className="relative flex-shrink-0">
        <Avatar className="h-12 w-12">
          <AvatarImage src={entityAvatar || undefined} alt={entityName} />
          <AvatarFallback className="bg-[var(--chat-primary)] text-[var(--chat-messageSentText)]">
            {initials}
          </AvatarFallback>
        </Avatar>

        {/* Online indicator for users */}
        {conversation.entityType === "user" && (
          <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[var(--chat-surface)] bg-[var(--chat-online)]" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2 min-w-0">
            <h3
              className={cn(
                "font-semibold truncate",
                hasUnread
                  ? "text-[var(--chat-text)]"
                  : "text-[var(--chat-textSecondary)]"
              )}
            >
              {entityName}
            </h3>

            {/* Pinned indicator */}
            {conversation.isPinned && (
              <Pin className="h-3 w-3 text-[var(--chat-textMuted)] flex-shrink-0" />
            )}

            {/* Muted indicator */}
            {conversation.isMuted && (
              <VolumeX className="h-3 w-3 text-[var(--chat-textMuted)] flex-shrink-0" />
            )}
          </div>

          {/* Timestamp */}
          {conversation.lastMessageTime && (
            <span
              className={cn(
                "text-xs flex-shrink-0",
                hasUnread
                  ? "text-[var(--chat-primary)] font-medium"
                  : "text-[var(--chat-textMuted)]"
              )}
            >
              {formatMessageTime(conversation.lastMessageTime)}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          {/* Last message preview */}
          <p
            className={cn(
              "text-sm truncate",
              hasUnread
                ? "text-[var(--chat-text)] font-medium"
                : "text-[var(--chat-textMuted)]"
            )}
          >
            {/* Read receipt for sent messages */}
            {conversation.lastMessage?.senderId && (
              <span className="inline-flex items-center gap-1 mr-1">
                {conversation.lastMessage.read ? (
                  <CheckCheck className="h-3 w-3 text-[var(--chat-primary)]" />
                ) : (
                  <Check className="h-3 w-3 text-[var(--chat-textMuted)]" />
                )}
              </span>
            )}
            {lastMessagePreview}
          </p>

          {/* Unread badge */}
          {hasUnread && (
            <Badge className="bg-[var(--chat-primary)] text-[var(--chat-messageSentText)] h-5 min-w-[20px] px-1.5 flex items-center justify-center text-xs font-semibold">
              {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
            </Badge>
          )}
        </div>
      </div>
    </motion.div>
  );
}
