// hooks/use-conversations.ts
"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback, useMemo } from "react";
import type { Conversation, ConversationFilter, ChatId } from "@/types/chat";
import {
  sortConversationsByTime,
  filterConversations,
} from "@/utils/chat-helpers";

// Query keys
const conversationKeys = {
  all: ["conversations"] as const,
  lists: () => [...conversationKeys.all, "list"] as const,
  list: (userId: string) => [...conversationKeys.lists(), userId] as const,
  detail: (chatId: ChatId) =>
    [...conversationKeys.all, "detail", chatId] as const,
};

/**
 * Hook for managing conversations list
 * Handles fetching, filtering, and searching conversations
 */
export function useConversations(userId: string | undefined) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<ConversationFilter>("all");

  /**
   * Fetch conversations from server
   * TODO: Implement actual API call
   */
  const fetchConversations = useCallback(async (): Promise<Conversation[]> => {
    if (!userId) return [];

    // TODO: Replace with actual API call
    // const response = await fetch(`/api/chats/conversations?userId=${userId}`);
    // return response.json();

    // Placeholder: return empty array
    return [];
  }, [userId]);

  /**
   * Query for conversations
   */
  const {
    data: conversations = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: conversationKeys.list(userId || ""),
    queryFn: fetchConversations,
    enabled: !!userId,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds for real-time feel
  });

  /**
   * Filter conversations by type
   */
  const filteredByType = useMemo(() => {
    if (filter === "all") return conversations;

    return conversations.filter((conv) => {
      switch (filter) {
        case "groups":
          return conv.entityType === "group";
        case "users":
          return conv.entityType === "user";
        case "unread":
          return conv.unreadCount > 0;
        case "archived":
          return conv.isArchived === true;
        default:
          return true;
      }
    });
  }, [conversations, filter]);

  /**
   * Filter by search query
   */
  const filteredConversations = useMemo(() => {
    const filtered = filterConversations(filteredByType, searchQuery);
    return sortConversationsByTime(filtered);
  }, [filteredByType, searchQuery]);

  /**
   * Get total unread count
   */
  const totalUnreadCount = useMemo(() => {
    return conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);
  }, [conversations]);

  /**
   * Get conversation by chat ID
   */
  const getConversation = useCallback(
    (chatId: ChatId): Conversation | undefined => {
      return conversations.find((conv) => conv.chatId === chatId);
    },
    [conversations],
  );

  /**
   * Update conversation in cache
   */
  const updateConversation = useCallback(
    (chatId: ChatId, updates: Partial<Conversation>) => {
      queryClient.setQueryData<Conversation[]>(
        conversationKeys.list(userId || ""),
        (old) => {
          if (!old) return old;
          return old.map((conv) =>
            conv.chatId === chatId ? { ...conv, ...updates } : conv,
          );
        },
      );
    },
    [queryClient, userId],
  );

  /**
   * Mark conversation as read
   */
  const markAsRead = useCallback(
    (chatId: ChatId) => {
      updateConversation(chatId, { unreadCount: 0 });

      // TODO: Call API to mark messages as read
      // await markConversationAsRead(userId, chatId);
    },
    [updateConversation],
  );

  /**
   * Pin/unpin conversation
   */
  const togglePin = useCallback(
    (chatId: ChatId) => {
      const conversation = getConversation(chatId);
      if (!conversation) return;

      updateConversation(chatId, { isPinned: !conversation.isPinned });

      // TODO: Call API to update pin status
    },
    [getConversation, updateConversation],
  );

  /**
   * Mute/unmute conversation
   */
  const toggleMute = useCallback(
    (chatId: ChatId) => {
      const conversation = getConversation(chatId);
      if (!conversation) return;

      updateConversation(chatId, { isMuted: !conversation.isMuted });

      // TODO: Call API to update mute status
    },
    [getConversation, updateConversation],
  );

  /**
   * Archive/unarchive conversation
   */
  const toggleArchive = useCallback(
    (chatId: ChatId) => {
      const conversation = getConversation(chatId);
      if (!conversation) return;

      updateConversation(chatId, { isArchived: !conversation.isArchived });

      // TODO: Call API to update archive status
    },
    [getConversation, updateConversation],
  );

  /**
   * Delete conversation
   */
  const deleteConversation = useCallback(
    async (chatId: ChatId) => {
      queryClient.setQueryData<Conversation[]>(
        conversationKeys.list(userId || ""),
        (old) => {
          if (!old) return old;
          return old.filter((conv) => conv.chatId !== chatId);
        },
      );

      // TODO: Call API to delete conversation
    },
    [queryClient, userId],
  );

  return {
    // Data
    conversations: filteredConversations,
    allConversations: conversations,
    totalUnreadCount,
    isLoading,
    error,

    // Filters
    searchQuery,
    setSearchQuery,
    filter,
    setFilter,

    // Actions
    refetch,
    getConversation,
    updateConversation,
    markAsRead,
    togglePin,
    toggleMute,
    toggleArchive,
    deleteConversation,
  };
}
