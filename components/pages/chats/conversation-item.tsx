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

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useConversations } from "@/hooks/use-conversations";

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
  const { togglePin, toggleMute, deleteConversation, markAsRead } = useConversations(undefined);
  const entityName = getEntityName(conversation);
  const entityAvatar = getEntityAvatar(conversation);
  const initials = getInitials(entityName);
  const lastMessagePreview = getLastMessagePreview(conversation);
  const hasUnread = conversation.unreadCount > 0;
  
  // Logic for read ticks
  const isLastMessageFromMe = conversation.lastMessage?.senderId !== conversation.entityId;
  const isRead = conversation.lastMessage?.readBy && conversation.lastMessage.readBy.length > 1;

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <motion.div
          whileTap={{ scale: 0.98 }}
          className={cn(
            "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 group",
            isActive 
              ? "bg-[var(--chat-surfaceHover)] shadow-sm" 
              : "hover:bg-[var(--chat-surfaceHover)]"
          )}
          onClick={onClick}
        >
          {/* Avatar with online status */}
          <div className="relative flex-shrink-0">
            <Avatar className="h-14 w-14 border-2 border-transparent group-hover:border-[var(--chat-primary)] transition-colors">
              <AvatarImage src={entityAvatar || undefined} alt={entityName} />
              <AvatarFallback className="bg-gradient-to-br from-[var(--chat-primary)] to-[var(--chat-accent)] text-white text-lg font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>

            {conversation.entityType === "user" && (
              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-[var(--chat-surface)] bg-[var(--chat-online)] shadow-sm" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 py-1">
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <h3
                  className={cn(
                    "font-bold truncate text-[15px]",
                    hasUnread
                      ? "text-[var(--chat-text)]"
                      : "text-[var(--chat-textSecondary)]"
                  )}
                >
                  {entityName}
                </h3>

                {conversation.isPinned && (
                  <Pin className="h-3 w-3 text-[var(--chat-primary)] fill-[var(--chat-primary)] flex-shrink-0 rotate-45" />
                )}
                
                {conversation.isMuted && (
                  <VolumeX className="h-3 w-3 text-[var(--chat-textMuted)] flex-shrink-0" />
                )}
              </div>

              {conversation.lastMessageTime && (
                <span
                  className={cn(
                    "text-[11px] flex-shrink-0",
                    hasUnread
                      ? "text-[var(--chat-primary)] font-bold"
                      : "text-[var(--chat-textMuted)]"
                  )}
                >
                  {formatMessageTime(conversation.lastMessageTime)}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 min-w-0">
                {/* Read receipt for sent messages */}
                {isLastMessageFromMe && conversation.lastMessage && (
                  <span className="flex-shrink-0">
                    {isRead ? (
                      <CheckCheck className="h-4 w-4 text-[#53bdeb]" />
                    ) : (
                      <CheckCheck className="h-4 w-4 text-[var(--chat-textMuted)]" />
                    )}
                  </span>
                )}
                
                <p
                  className={cn(
                    "text-[13.5px] truncate leading-tight",
                    hasUnread
                      ? "text-[var(--chat-textSecondary)] font-medium"
                      : "text-[var(--chat-textMuted)]"
                  )}
                >
                  {lastMessagePreview}
                </p>
              </div>

              {hasUnread && (
                <div className="bg-[var(--chat-primary)] text-white h-5 min-w-[20px] px-1.5 rounded-full flex items-center justify-center text-[10px] font-black shadow-sm">
                  {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </ContextMenuTrigger>
      
      <ContextMenuContent className="w-56 bg-[var(--chat-surface)] border-[var(--chat-border)]">
        <ContextMenuItem onClick={() => markAsRead(conversation.chatId)}>
          <Check className="mr-2 h-4 w-4" /> Marquer comme lu
        </ContextMenuItem>
        <ContextMenuItem onClick={() => togglePin(conversation.chatId)}>
          <Pin className="mr-2 h-4 w-4" /> {conversation.isPinned ? "Désépingler" : "Épingler"}
        </ContextMenuItem>
        <ContextMenuItem onClick={() => toggleMute(conversation.chatId)}>
          <VolumeX className="mr-2 h-4 w-4" /> {conversation.isMuted ? "Réactiver" : "Sourdine"}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem 
          className="text-red-500 focus:text-red-500" 
          onClick={() => deleteConversation(conversation.chatId)}
        >
          Effacer la discussion
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
