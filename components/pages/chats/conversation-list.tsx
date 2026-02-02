// components/pages/chats/conversation-list.tsx
"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty } from "@/components/ui/empty";
import { ConversationItem } from "./conversation-item";
import type { Conversation, ChatId } from "@/types/chat";
import { MessageSquare } from "lucide-react";

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId?: ChatId;
  isLoading?: boolean;
  onConversationClick?: (conversation: Conversation) => void;
  emptyMessage?: string;
}

export function ConversationList({
  conversations,
  activeConversationId,
  isLoading = false,
  onConversationClick,
  emptyMessage = "No conversations yet",
}: ConversationListProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-2 p-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <Empty
          icon={MessageSquare}
          title="No conversations"
          description={emptyMessage}
        />
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-1">
        <AnimatePresence mode="popLayout">
          {conversations.map((conversation, index) => (
            <motion.div
              key={conversation.chatId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: index * 0.05 }}
            >
              <ConversationItem
                conversation={conversation}
                isActive={conversation.chatId === activeConversationId}
                onClick={() => onConversationClick?.(conversation)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ScrollArea>
  );
}
