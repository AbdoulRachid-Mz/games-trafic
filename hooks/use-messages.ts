import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { authClient } from '@/lib/auth-client';
import { toast } from 'sonner';
import type { 
  MessageFilters, 
  ListQuery, 
  PaginationResponse 
} from '@/types/api';
import { getMessageById, getMessages, getConversation, getGroupMessages, getUnreadMessages, countUnreadMessages, getMessageStats, createMessage, updateMessage, deleteMessage, restoreMessage, markMessageAsRead, markMessagesAsRead, markConversationAsRead, replyToMessage } from '@/actions/messages';
import React from 'react';
import { MessageWithRelations, NewMessage } from '@/database/schema';

// ============================================================================
// QUERY KEYS
// ============================================================================

const messageKeys = {
  all: ['messages'] as const,
  lists: () => [...messageKeys.all, 'list'] as const,
  list: (filters: MessageFilters = {}) => [...messageKeys.lists(), filters] as const,
  infinite: (filters: MessageFilters = {}) => [...messageKeys.lists(), 'infinite', filters] as const,
  details: () => [...messageKeys.all, 'detail'] as const,
  detail: (id: string) => [...messageKeys.details(), id] as const,
  conversation: (userId1: string, userId2: string) => [...messageKeys.all, 'conversation', userId1, userId2] as const,
  group: (groupId: string) => [...messageKeys.all, 'group', groupId] as const,
  unread: (userId: string) => [...messageKeys.all, 'unread', userId] as const,
  unreadCount: (userId: string) => [...messageKeys.all, 'unread-count', userId] as const,
  stats: (filters?: MessageFilters) => [...messageKeys.all, 'stats', filters] as const,
  entity: (entityType: string, entityId: string) => [...messageKeys.all, 'entity', entityType, entityId] as const,
};

// ============================================================================
// QUERIES - READ OPERATIONS
// ============================================================================

/**
 * Hook to fetch a single message by ID
 * @param id - Message ID
 * @param options - Optional populate fields
 * @param enabled - Whether to enable the query
 */
export function useMessageById(
  id: string,
  options?: { populate?: string[] },
  enabled = true
) {
  return useQuery({
    queryKey: messageKeys.detail(id),
    queryFn: () => getMessageById(id, options),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to fetch messages with pagination and filters
 * @param query - List query with pagination, filters and options
 * @param enabled - Whether to enable the query
 */
export function useMessages(
  query: ListQuery<MessageFilters> = {},
  enabled = true
) {
  return useQuery({
    queryKey: messageKeys.list(query.filters || {}),
    queryFn: () => getMessages(query),
    enabled,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch messages with infinite scroll
 * @param filters - Message filters
 * @param pageSize - Number of items per page
 * @param enabled - Whether to enable the query
 */
export function useInfiniteMessages(
  filters: MessageFilters = {},
  pageSize = 50,
  enabled = true
) {
  return useInfiniteQuery({
    queryKey: messageKeys.infinite(filters),
    queryFn: ({ pageParam = 1 }) => getMessages({ 
      pagination: { page: pageParam, limit: pageSize },
      filters,
      options: { sortBy: 'createdAt', sortOrder: 'desc' }
    }),
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.hasNext) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    getPreviousPageParam: (firstPage) => {
      if (firstPage.pagination.hasPrev) {
        return firstPage.pagination.page - 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    enabled,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch conversation between two users
 * @param userId1 - First user ID
 * @param userId2 - Second user ID
 * @param pagination - Pagination options
 * @param enabled - Whether to enable the query
 */
export function useConversation(
  userId1: string,
  userId2: string,
  pagination?: { page: number; limit: number },
  enabled: boolean = true
) {
  return useQuery({
    queryKey: messageKeys.conversation(userId1, userId2),
    queryFn: () => getConversation(userId1, userId2, pagination),
    enabled: enabled && !!userId1 && !!userId2,
    staleTime: 10 * 1000, // 10 seconds for real-time feel
    gcTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to fetch group messages
 * @param groupId - Group ID
 * @param pagination - Pagination options
 * @param enabled - Whether to enable the query
 */
export function useGroupMessages(
  groupId: string,
  pagination?: { page: number; limit: number },
  enabled: boolean = true
) {
  return useQuery({
    queryKey: messageKeys.group(groupId),
    queryFn: () => getGroupMessages(groupId, pagination),
    enabled: enabled && !!groupId,
    staleTime: 10 * 1000, // 10 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to fetch messages for a specific entity (Shop, Tournament, etc.)
 * @param entityType - Entity type (SHOP, TOURNAMENT, EDITION, etc.)
 * @param entityId - Entity ID
 * @param pagination - Pagination options
 * @param enabled - Whether to enable the query
 */
export function useEntityMessages(
  entityType: string,
  entityId: string,
  pagination?: { page: number; limit: number },
  enabled: boolean = true
) {
  return useQuery({
    queryKey: messageKeys.entity(entityType, entityId),
    queryFn: () => getMessages({
      filters: {
        entityType: entityType.toUpperCase() as any,
        entityId: entityId,
      },
      pagination: pagination,
      options: { sortBy: 'createdAt', sortOrder: 'asc' } // Messages are usually ascending in chat
    }),
    enabled: enabled && !!entityType && !!entityId,
    staleTime: 10 * 1000,
    gcTime: 2 * 60 * 1000,
  });
}

/**
 * Hook to fetch unread messages for a user
 * @param userId - User ID
 * @param enabled - Whether to enable the query
 */
export function useUnreadMessages(userId: string, enabled = true) {
  return useQuery({
    queryKey: messageKeys.unread(userId),
    queryFn: () => getUnreadMessages(userId),
    enabled: enabled && !!userId,
    staleTime: 5 * 1000, // 5 seconds for real-time updates
    gcTime: 60 * 1000, // 1 minute
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
}

/**
 * Hook to fetch unread message count for a user
 * @param userId - User ID
 * @param enabled - Whether to enable the query
 */
export function useUnreadMessageCount(userId: string, enabled = true) {
  return useQuery({
    queryKey: messageKeys.unreadCount(userId),
    queryFn: () => countUnreadMessages(userId),
    enabled: enabled && !!userId,
    staleTime: 5 * 1000, // 5 seconds
    gcTime: 60 * 1000, // 1 minute
    refetchInterval: 15 * 1000, // Refetch every 15 seconds
  });
}

/**
 * Hook to fetch message statistics
 * @param filters - Message filters
 * @param enabled - Whether to enable the query
 */
export function useMessageStats(filters?: MessageFilters, enabled = true) {
  return useQuery({
    queryKey: messageKeys.stats(filters),
    queryFn: () => getMessageStats(filters),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// ============================================================================
// MUTATIONS - WRITE OPERATIONS
// ============================================================================

/**
 * Hook to create a new message
 */
export function useCreateMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createMessage,
    onSuccess: (newMessage) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: messageKeys.lists() });
      
      // Invalidate conversation if it's a private message
      if (newMessage.recipientId && newMessage.senderId) {
        queryClient.invalidateQueries({ 
          queryKey: messageKeys.conversation(newMessage.senderId, newMessage.recipientId) 
        });
      }
      
      // Invalidate group messages if it's a group message
      if (newMessage.groupId) {
        queryClient.invalidateQueries({ 
          queryKey: messageKeys.group(newMessage.groupId) 
        });
      }
      
      // Invalidate unread counts for recipient
      if (newMessage.recipientId) {
        queryClient.invalidateQueries({ 
          queryKey: messageKeys.unreadCount(newMessage.recipientId) 
        });
        queryClient.invalidateQueries({ 
          queryKey: messageKeys.unread(newMessage.recipientId) 
        });
      }
      
      toast.success('Message sent successfully');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to send message');
    },
  });
}

/**
 * Hook to update a message
 */
export function useUpdateMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<NewMessage> }) => 
      updateMessage(id, data),
    onSuccess: (updatedMessage) => {
      // Update the message in cache
      queryClient.setQueryData(messageKeys.detail(updatedMessage.id), updatedMessage);
      
      // Invalidate lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: messageKeys.lists() });
      
      toast.success('Message updated successfully');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update message');
    },
  });
}

/**
 * Hook to delete a message (soft delete)
 */
export function useDeleteMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteMessage,
    onSuccess: (deletedMessage) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: messageKeys.detail(deletedMessage.id) });
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: messageKeys.lists() });
      
      // Invalidate conversation if it's a private message
      if (deletedMessage.recipientId && deletedMessage.senderId) {
        queryClient.invalidateQueries({ 
          queryKey: messageKeys.conversation(deletedMessage.senderId, deletedMessage.recipientId) 
        });
      }
      
      // Invalidate group messages if it's a group message
      if (deletedMessage.groupId) {
        queryClient.invalidateQueries({ 
          queryKey: messageKeys.group(deletedMessage.groupId) 
        });
      }
      
      toast.success('Message deleted successfully');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to delete message');
    },
  });
}

/**
 * Hook to restore a deleted message
 */
export function useRestoreMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: restoreMessage,
    onSuccess: (restoredMessage) => {
      // Update cache
      queryClient.setQueryData(messageKeys.detail(restoredMessage.id), restoredMessage);
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: messageKeys.lists() });
      
      toast.success('Message restored successfully');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to restore message');
    },
  });
}

/**
 * Hook to mark a message as read
 */
export function useMarkMessageAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, userId }: { id: string; userId: string }) => 
      markMessageAsRead(id, userId),
    onSuccess: (updatedMessage) => {
      // Update the message in cache
      queryClient.setQueryData(messageKeys.detail(updatedMessage.id), updatedMessage);
      
      // Invalidate all related queries to update unread counts and status
      queryClient.invalidateQueries({ queryKey: messageKeys.all });
    },
    onError: (error) => {
      console.error('Failed to mark message as read:', error);
    },
  });
}

/**
 * Hook to mark multiple messages as read
 */
export function useMarkMessagesAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ messageIds, userId }: { messageIds: string[]; userId: string }) => 
      markMessagesAsRead(messageIds, userId),
    onSuccess: (count) => {
      if (count > 0) {
        // Invalidate all related queries
        queryClient.invalidateQueries({ queryKey: messageKeys.all });
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to mark messages as read');
    },
  });
}

/**
 * Hook to mark an entire conversation as read
 */
export function useMarkConversationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ chatId, userId }: { chatId: string; userId: string }) => 
      markConversationAsRead(chatId, userId),
    onSuccess: () => {
      // Invalidate all related queries to update conversation list and messages
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: messageKeys.all });
    },
    onError: (error) => {
      console.error('Failed to mark conversation as read:', error);
    },
  });
}

/**
 * Hook to reply to a message
 */
export function useReplyToMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ parentMessageId, replyData }: { 
      parentMessageId: string; 
      replyData: Omit<NewMessage, 'parentMessageId'> 
    }) => replyToMessage(parentMessageId, replyData),
    onSuccess: (newMessage) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: messageKeys.lists() });
      
      // Invalidate the parent message to update replies
      if (newMessage.parentMessageId) {
        queryClient.invalidateQueries({ 
          queryKey: messageKeys.detail(newMessage.parentMessageId) 
        });
      }
      
      // Invalidate conversation
      if (newMessage.recipientId && newMessage.senderId) {
        queryClient.invalidateQueries({ 
          queryKey: messageKeys.conversation(newMessage.senderId, newMessage.recipientId) 
        });
      }
      
      // Invalidate group messages
      if (newMessage.groupId) {
        queryClient.invalidateQueries({ 
          queryKey: messageKeys.group(newMessage.groupId) 
        });
      }
      
      // Invalidate unread counts
      if (newMessage.recipientId) {
        queryClient.invalidateQueries({ 
          queryKey: messageKeys.unreadCount(newMessage.recipientId) 
        });
      }
      
      toast.success('Reply sent successfully');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to send reply');
    },
  });
}

// ============================================================================
// OPTIMISTIC UPDATES HOOKS
// ============================================================================

/**
 * Hook to optimistically send a message
 * This provides instant UI feedback while the message is being sent
 */
export function useOptimisticSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createMessage,
    onMutate: async (newMessage) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: messageKeys.lists() });

      // Create optimistic message
      const optimisticMessage = {
        ...newMessage,
        id: `optimistic-${Date.now()}`,
        createdAt: new Date(),
        read: false,
        isActive: true,
        isDeleted: false,
      };

      // Snapshot the previous value
      const previousMessages = queryClient.getQueryData(messageKeys.lists());

      // Optimistically update the cache
      queryClient.setQueryData(messageKeys.lists(), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: [optimisticMessage, ...old.data],
        };
      });

      // Return context with the previous state
      return { previousMessages, optimisticMessage };
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousMessages) {
        queryClient.setQueryData(messageKeys.lists(), context.previousMessages);
      }
      toast.error(error instanceof Error ? error.message : 'Failed to send message');
    },
    onSettled: () => {
      // Always refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: messageKeys.lists() });
    },
  });
}

/**
 * Hook to optimistically mark messages as read
 */
export function useOptimisticMarkAsRead() {
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;

  return useMutation({
    mutationFn: (messageId: string) => {
      if (!userId) throw new Error("User not logged in");
      return markMessageAsRead(messageId, userId);
    },
    onMutate: async (messageId) => {
      // Cancel related queries
      await queryClient.cancelQueries({ queryKey: messageKeys.detail(messageId) });
      
      // Snapshot previous states
      const previousMessage = queryClient.getQueryData<MessageWithRelations>(messageKeys.detail(messageId));
      const previousUnreadCount = queryClient.getQueryData<number>(
        messageKeys.unreadCount(userId || '')
      );

      // Optimistically update the message
      if (userId) {
        queryClient.setQueryData(messageKeys.detail(messageId), (old: any) => {
          if (!old) return old;
          const currentReadBy = old.readBy || [];
          if (!currentReadBy.includes(userId)) {
            return { ...old, readBy: [...currentReadBy, userId] };
          }
          return old;
        });

        // Optimistically decrement unread count
        if (typeof previousUnreadCount === 'number') {
          queryClient.setQueryData(
            messageKeys.unreadCount(userId),
            Math.max(0, previousUnreadCount - 1)
          );
        }
      }

      return { previousMessage, previousUnreadCount };
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousMessage) {
        queryClient.setQueryData(messageKeys.detail(_variables), context.previousMessage);
      }
      if (userId && context?.previousUnreadCount !== undefined) {
        queryClient.setQueryData(
          messageKeys.unreadCount(userId),
          context.previousUnreadCount
        );
      }
    },
    onSettled: (messageId) => {
      // Always refetch to ensure consistency
      if (messageId && typeof messageId === 'string') {
        queryClient.invalidateQueries({ queryKey: messageKeys.detail(messageId) });
        if (userId) {
          queryClient.invalidateQueries({ queryKey: messageKeys.unreadCount(userId) });
        }
      }
    },
  });
}

// ============================================================================
// REAL-TIME SUBSCRIPTION HOOKS
// ============================================================================

/**
 * Hook to subscribe to new messages in real-time
 * This would typically integrate with WebSocket or Server-Sent Events
 */
export function useMessageSubscription(userId: string) {
  const queryClient = useQueryClient();

  // This is a placeholder for real-time subscription
  // In a real implementation, you would connect to your WebSocket/SSE endpoint
  React.useEffect(() => {
    if (!userId) return;

    // Simulate real-time updates (replace with actual WebSocket/SSE implementation)
    const interval = setInterval(() => {
      // Refetch unread count and messages periodically
      queryClient.invalidateQueries({ queryKey: messageKeys.unreadCount(userId) });
      queryClient.invalidateQueries({ queryKey: messageKeys.unread(userId) });
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [userId, queryClient]);

  return null;
}

/**
 * Hook to subscribe to conversation updates
 */
export function useConversationSubscription(userId1: string, userId2: string) {
  const queryClient = useQueryClient();

  React.useEffect(() => {
    if (!userId1 || !userId2) return;

    // Simulate real-time conversation updates
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ 
        queryKey: messageKeys.conversation(userId1, userId2) 
      });
    }, 10000); // Every 10 seconds

    return () => clearInterval(interval);
  }, [userId1, userId2, queryClient]);

  return null;
}

/**
 * Hook to subscribe to group message updates
 */
export function useGroupMessageSubscription(groupId: string) {
  const queryClient = useQueryClient();

  React.useEffect(() => {
    if (!groupId) return;

    // Simulate real-time group message updates
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ 
        queryKey: messageKeys.group(groupId) 
      });
    }, 10000); // Every 10 seconds

    return () => clearInterval(interval);
  }, [groupId, queryClient]);

  return null;
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Hook to prefetch messages for better performance
 */
export function usePrefetchMessages(filters: MessageFilters = {}) {
  const queryClient = useQueryClient();

  return React.useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: messageKeys.list(filters),
      queryFn: () => getMessages({ filters }),
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  }, [queryClient, filters]);
}

/**
 * Hook to bulk delete messages
 */
export function useBulkDeleteMessages() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageIds: string[]) => {
      // Delete messages in parallel with error handling
      const results = await Promise.allSettled(
        messageIds.map(id => deleteMessage(id))
      );
      
      // Count successful deletions
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      return { successful, failed, total: messageIds.length };
    },
    onSuccess: (result) => {
      // Invalidate all message queries
      queryClient.invalidateQueries({ queryKey: messageKeys.all });
      
      if (result.failed > 0) {
        toast.warning(`${result.successful} messages deleted, ${result.failed} failed`);
      } else {
        toast.success(`${result.successful} messages deleted successfully`);
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to delete messages');
    },
  });
}

/**
 * Hook to export messages as JSON/CSV
 */
export function useExportMessages(filters: MessageFilters = {}) {
  return useMutation({
    mutationFn: async (format: 'json' | 'csv' = 'json') => {
      const response = await getMessages({ 
        filters, 
        pagination: { page: 1, limit: 10000 } // Large limit for export
      });
      
      if (format === 'json') {
        return JSON.stringify(response.data, null, 2);
      } else {
        // Simple CSV conversion (you might want to use a library for complex data)
        const headers = Object.keys(response.data[0] || {}).join(',');
        const rows = response.data.map(row => 
          Object.values(row).map(val => 
            typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val
          ).join(',')
        );
        return [headers, ...rows].join('\n');
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to export messages');
    },
  });
}

// ============================================================================
// ADVANCED HOOKS
// ============================================================================

/**
 * Hook for message search with debouncing
 */
export function useMessageSearch(
  searchQuery: string,
  filters: MessageFilters = {},
  debounceMs = 500
) {
  const [debouncedQuery, setDebouncedQuery] = React.useState(searchQuery);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchQuery, debounceMs]);

  return useMessages(
    {
      filters: {
        ...filters,
        content: debouncedQuery || undefined,
      },
    },
    !!debouncedQuery
  );
}

/**
 * Hook for typing indicators in conversations
 */
export function useTypingIndicator(conversationId: string) {
  const [isTyping, setIsTyping] = React.useState(false);
  const [typingUsers, setTypingUsers] = React.useState<string[]>([]);

  // This would integrate with your real-time system
  const startTyping = React.useCallback(() => {
    setIsTyping(true);
    // Send typing indicator to server
  }, []);

  const stopTyping = React.useCallback(() => {
    setIsTyping(false);
    // Stop typing indicator
  }, []);

  return {
    isTyping,
    typingUsers,
    startTyping,
    stopTyping,
  };
}

/**
 * Hook for message drafts (local storage)
 */
export function useMessageDraft(recipientId?: string, groupId?: string) {
  const storageKey = `message_draft_${recipientId || groupId || 'general'}`;
  
  const [draft, setDraft] = React.useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem(storageKey) || '';
  });

  const saveDraft = React.useCallback((content: string) => {
    setDraft(content);
    localStorage.setItem(storageKey, content);
  }, [storageKey]);

  const clearDraft = React.useCallback(() => {
    setDraft('');
    localStorage.removeItem(storageKey);
  }, [storageKey]);

  return { draft, saveDraft, clearDraft };
}

// ============================================================================
// ERROR BOUNDARY HOOK
// ============================================================================

/**
 * Hook to handle message-related errors gracefully
 */
export function useMessageErrorHandler() {
  const handleError = React.useCallback((error: unknown, context?: string) => {
    console.error(`Message Error${context ? ` (${context})` : ''}:`, error);
    
    if (error instanceof Error) {
      toast.error(error.message);
    } else {
      toast.error('An unexpected error occurred');
    }
    
    // You could also send errors to your error tracking service here
    // Sentry.captureException(error, { context });
  }, []);

  return { handleError };
}

// ============================================================================
// PERFORMANCE HOOKS
// ============================================================================

/**
 * Hook to memoize message data transformations
 */
export function useMemoizedMessages(messages: MessageWithRelations[] = []) {
  return React.useMemo(() => {
    return {
      // Group messages by date
      byDate: messages.reduce((acc, message) => {
        const date = message.createdAt ? new Date(message.createdAt).toDateString() : '';
        if (!acc[date]) acc[date] = [];
        acc[date].push(message);
        return acc;
      }, {} as Record<string, MessageWithRelations[]>),

      // Group messages by sender
      bySender: messages.reduce((acc, message) => {
        const senderId = message.senderId;
        if (!acc[senderId]) acc[senderId] = [];
        acc[senderId].push(message);
        return acc;
      }, {} as Record<string, MessageWithRelations[]>),

      // Get unique senders
      uniqueSenders: Array.from(new Set(messages.map(m => m.senderId))),

      // Filter unread messages (generic: not read by anyone)
      unread: messages.filter(m => (!m.readBy || m.readBy.length === 0) && m.recipientId),

      // Sort by creation date (newest first)
      sorted: [...messages].sort((a, b) => 
        (b.createdAt ? new Date(b.createdAt).getTime() : 0) - (a.createdAt ? new Date(a.createdAt).getTime() : 0)
      ),
    };
  }, [messages]);
}

/**
 * Hook to virtualize long message lists
 */
export function useVirtualizedMessages(
  messages: MessageWithRelations[] = [],
  itemHeight = 80,
  containerHeight = 600
) {
  const [visibleRange, setVisibleRange] = React.useState({ start: 0, end: 50 });
  const scrollTop = React.useRef(0);

  const totalHeight = messages.length * itemHeight;
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const buffer = 10;

  const updateVisibleRange = React.useCallback((scrollPosition: number) => {
    scrollTop.current = scrollPosition;
    const start = Math.floor(scrollPosition / itemHeight) - buffer;
    const end = start + visibleCount + buffer * 2;
    
    setVisibleRange({
      start: Math.max(0, start),
      end: Math.min(messages.length, end),
    });
  }, [itemHeight, visibleCount, messages.length]);

  const visibleMessages = React.useMemo(() => 
    messages.slice(visibleRange.start, visibleRange.end),
    [messages, visibleRange]
  );

  return {
    visibleMessages,
    visibleRange,
    totalHeight,
    updateVisibleRange,
    scrollTop: scrollTop.current,
  };
}

// Export all hooks
export const messageHooks = {
  // Queries
  useMessageById,
  useMessages,
  useInfiniteMessages,
  useConversation,
  useGroupMessages,
  useUnreadMessages,
  useUnreadMessageCount,
  useMessageStats,
  
  // Mutations
  useCreateMessage,
  useUpdateMessage,
  useDeleteMessage,
  useRestoreMessage,
  useMarkMessageAsRead,
  useMarkMessagesAsRead,
  useReplyToMessage,
  
  // Optimistic
  useOptimisticSendMessage,
  useOptimisticMarkAsRead,
  
  // Subscriptions
  useMessageSubscription,
  useConversationSubscription,
  useGroupMessageSubscription,
  
  // Utilities
  usePrefetchMessages,
  useBulkDeleteMessages,
  useExportMessages,
  useMessageSearch,
  useTypingIndicator,
  useMessageDraft,
  useMessageErrorHandler,
  
  // Performance
  useMemoizedMessages,
  useVirtualizedMessages,
};

export default messageHooks;
