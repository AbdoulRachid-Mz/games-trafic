// components/pages/chats/chat-conversation-view.tsx
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChatHeader } from "@/components/pages/chats/chat-header";
import { MessageList } from "@/components/pages/chats/message-list";
import { MessageInput } from "@/components/pages/chats/message-input";
import { useAuthContext } from "@/contexts/auth-context";
import { useQueryClient } from "@tanstack/react-query";
import { useChatContext } from "@/contexts/chat-context";
import { useGroupById, useGroupMemberByUserAndGroup } from "@/hooks/use-groupes";
import { useUserById } from "@/hooks/use-users";
import { useShopById } from "@/hooks/use-shops";
import { useTournamentById } from "@/hooks/use-tournaments";
import {
  useGroupMessages,
  useConversation,
  useEntityMessages,
  useCreateMessage,
  useMarkMessageAsRead,
  useDeleteMessage,
} from "@/hooks/use-messages";
import { messageKeys } from "@/hooks/use-messages";
import { useToggleInteraction } from "@/hooks/use-interactions";
import type { ChatId, ChatMessage, Conversation, ChatEntityType } from "@/types/chat";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { JoinGroupDialog } from "@/components/pages/chats/join-group-dialog";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { useChatAudioStore } from "@/stores/chat-audio-store";

interface ChatConversationViewProps {
  entityType: ChatEntityType;
  entityId: string;
}

export function ChatConversationView({ entityType, entityId }: ChatConversationViewProps) {
  const router = useRouter();
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const {
    activeConversation,
    setActiveConversation,
    typingIndicators,
    onlineStatuses,
  } = useChatContext();
  const { pause: pauseAudio } = useChatAudioStore();

  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const failedPayloadsRef = useRef<Record<string, { content: string; images?: string[]; audioUrl?: string }>>({});
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [likedMessageIds, setLikedMessageIds] = useState<Set<string>>(new Set());
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});

  const chatId = `${entityType}:${entityId}` as ChatId;

  // Pause audio when conversation changes
  useEffect(() => {
    pauseAudio();
  }, [chatId]);

  // Fetch entity details
  const isGroup = entityType === "group";

  const { data: groupData, isLoading: isLoadingGroup } = useGroupById(
    isGroup ? entityId : undefined
  );
  const { data: userData, isLoading: isLoadingUser } = useUserById(
    !isGroup && entityType === "user" ? entityId : undefined
  );
  const { data: shopData, isLoading: isLoadingShop } = useShopById(
    entityType === "shop" ? entityId : undefined
  );
  const { data: tournamentData, isLoading: isLoadingTournament } = useTournamentById(
    entityType === "tournament" ? entityId : ""
  );

  // Check group membership for private groups
  const { data: membership, isLoading: isLoadingMembership } = useGroupMemberByUserAndGroup(
    user?.id,
    isGroup ? entityId : undefined
  );

  useEffect(() => {
    if (isGroup && groupData && !isLoadingMembership && !membership && groupData.isPrivate) {
      setShowJoinDialog(true);
    }
  }, [isGroup, groupData, isLoadingMembership, membership]);

  // Fetch messages based on entity type
  const groupQueryResult = useGroupMessages(isGroup ? entityId : "", undefined, Boolean(isGroup && !!membership));
  const groupMessagesData = groupQueryResult;
  const isLoadingGroupMessages = groupQueryResult.isLoading;
  const refetchGroupMessages = groupQueryResult.refetch;

  const dmQueryResult = useConversation(
    user?.id || "",
    !isGroup && entityType === "user" ? entityId : "",
    undefined,
    Boolean(!isGroup && entityType === "user" && !!user)
  );
  const dmMessagesData = dmQueryResult;
  const isLoadingDmMessages = dmQueryResult.isLoading;
  const refetchDmMessages = dmQueryResult.refetch;

  const {
    data: entityMessagesData,
    isLoading: isLoadingEntityMessages,
    refetch: refetchEntityMessages,
  } = useEntityMessages(
    entityType,
    entityId,
    undefined,
    Boolean(entityType === "shop" || entityType === "tournament")
  );

  const isLoading =
    isLoadingGroup ||
    isLoadingUser ||
    isLoadingShop ||
    isLoadingTournament ||
    isLoadingGroupMessages ||
    isLoadingDmMessages ||
    isLoadingEntityMessages ||
    Boolean(isGroup && isLoadingMembership);

  // Pagination infinie (cursor) pour DM & groupes
  const activeInfinite = isGroup ? groupQueryResult : entityType === "user" ? dmQueryResult : null;
  const hasMore = Boolean(activeInfinite?.hasNextPage);
  const loadMore = () => {
    if (activeInfinite?.hasNextPage && !activeInfinite?.isFetchingNextPage) {
      activeInfinite.fetchNextPage();
    }
  };

  const flattenedMessages = isGroup
    ? (groupMessagesData?.data?.pages?.flatMap((p: any) => p?.data || []) ?? [])
    : entityType === "user"
      ? (dmMessagesData?.data?.pages?.flatMap((p: any) => p?.data || []) ?? [])
      : entityMessagesData?.data || [];
  const seenIds = new Set<string>();
  const messages = flattenedMessages.filter((m: any) => {
    if (!m?.id) return true;
    if (seenIds.has(m.id)) return false;
    seenIds.add(m.id);
    return true;
  });

  const refetch = isGroup
    ? refetchGroupMessages
    : entityType === "user"
      ? refetchDmMessages
      : refetchEntityMessages;

  const createMessageMutation = useCreateMessage();
  const markAsReadMutation = useMarkMessageAsRead();
  const deleteMessageMutation = useDeleteMessage();
  const toggleInteractionMutation = useToggleInteraction();

  // Get typing indicators for this chat
  useEffect(() => {
    const indicators = typingIndicators.get(chatId) || [];
    const usernames = indicators.map((ind) => ind.username);
    setTypingUsers(usernames);
  }, [typingIndicators, chatId]);

  // Get online status for user chats
  const onlineStatus =
    entityType === "user" ? onlineStatuses.get(entityId) : undefined;

  // Mark messages as read when viewing
  useEffect(() => {
    if (messages.length > 0 && user) {
      const unreadMessages = messages.filter(
        (msg) => msg.recipientId === user.id && !(msg.readBy || []).includes(user.id)
      );

      if (unreadMessages.length > 0) {
        const timer = setTimeout(() => {
          unreadMessages.forEach((msg) => {
            markAsReadMutation.mutate({ id: msg.id, userId: user.id });
          });
        }, 1000);

        return () => clearTimeout(timer);
      }
    }
  }, [messages, user, markAsReadMutation]);

  // Refetch messages periodically
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 10000);

    return () => clearInterval(interval);
  }, [refetch]);

  // Handle send message
  const handleSendMessage = useCallback(
    async (content: string, images?: string[], audioUrl?: string) => {
      if (!user) {
        toast.error("Vous devez être connecté pour envoyer des messages");
        return;
      }

      if (isGroup && !membership) {
        toast.error("Vous devez être membre pour envoyer des messages");
        return;
      }

      try {
        const tempId =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`;

       const messageData: any = {
          id: tempId,
          senderId: user.id,
          content,
          images: images || [],
          audioUrl: audioUrl,
          type: audioUrl ? "AUDIO" : images?.length ? "IMAGE" : "TEXT",
        };

        if (entityType === "group") {
          messageData.groupId = entityId;
        } else if (entityType === "user") {
          messageData.recipientId = entityId;
        } else {
          messageData.entityType = entityType.toUpperCase();
          messageData.entityId = entityId;
        }

        if (replyTo) {
          messageData.parentMessageId = replyTo.id;
        }

        failedPayloadsRef.current[tempId] = { content, images, audioUrl };
        await createMessageMutation.mutateAsync(messageData);
        setReplyTo(null);
      } catch (error) {
        console.error("Failed to send message:", error);
        toast.error("Erreur lors de l'envoi du message");
      }
    },
    [user, entityType, entityId, replyTo, createMessageMutation, refetch, isGroup, membership]
  );

  const handleRetryMessage = useCallback(async (messageId: string) => {
    const payload = failedPayloadsRef.current[messageId];
    const targetKey =
      entityType === "group"
        ? messageKeys.group(entityId)
        : entityType === "user"
          ? messageKeys.conversation(user?.id || "", entityId)
          : messageKeys.entity(entityType, entityId);
    queryClient.setQueryData(targetKey, (old: any) => {
      const filter = (a: any[]) => a.filter((m: any) => m.id !== messageId);
      if (Array.isArray(old)) return filter(old);
      if (old?.data && Array.isArray(old.data)) return { ...old, data: filter(old.data) };
      return old;
    });
    delete failedPayloadsRef.current[messageId];
    if (payload) {
      await handleSendMessage(payload.content, payload.images, payload.audioUrl);
    }
  }, [entityType, entityId, user, queryClient, handleSendMessage]);

  const handleReply = useCallback((message: ChatMessage) => {
    setReplyTo(message);
  }, []);

  const handleCancelReply = useCallback(() => {
    setReplyTo(null);
  }, []);

  const handleDeleteMessage = useCallback(
    (messageId: string) => {
      deleteMessageMutation.mutate(messageId);
    },
    [deleteMessageMutation]
  );

  const handleLikeMessage = useCallback(
    (messageId: string) => {
      if (!user) {
        toast.error("Vous devez être connecté pour aimer un message");
        return;
      }
      // Optimistic update
      setLikedMessageIds((prev) => {
        const next = new Set(prev);
        const isLiked = next.has(messageId);
        if (isLiked) {
          next.delete(messageId);
        } else {
          next.add(messageId);
        }

        // Update local counts
        setLikeCounts((prevCounts) => {
          const currentCount = prevCounts[messageId] || 0;
          return {
            ...prevCounts,
            [messageId]: isLiked ? Math.max(0, currentCount - 1) : currentCount + 1,
          };
        });

        return next;
      });

      toggleInteractionMutation.mutate({
        userId: user.id,
        entityId: messageId,
        entityType: "MESSAGE",
        type: "LIKE",
      });
    },
    [user, toggleInteractionMutation]
  );

  const handleViewDetails = useCallback(() => {
    if (isGroup) {
      router.push(`/chats/groups/${entityId}`);
    } else {
      router.push(`/profile/${entityId}`);
    }
  }, [router, isGroup, entityId]);

  const getEntityData = () => {
    switch (entityType) {
      case "group": return groupData;
      case "user": return userData;
      case "shop": return shopData;
      case "tournament": return tournamentData;
      default: return null;
    }
  };

  const conversation: Conversation = activeConversation || {
    id: chatId,
    chatId: chatId,
    entityType: entityType,
    entityId: entityId,
    unreadCount: 0,
    entity: {
      type: entityType,
      data: getEntityData() as any,
    },
    lastMessage: null,
    lastMessageTime: null,
  };

  if (isLoading && messages.length === 0) {
    return (
      <div className="flex flex-col h-full bg-[var(--chat-background)]">
        <div className="flex-shrink-0 p-4 border-b border-[var(--chat-border)]">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        </div>
        <div className="flex-1" />
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col bg-[var(--chat-background)] overflow-hidden z-10">
      <div className="flex-none z-10 bg-[var(--chat-background)] border-b border-[var(--chat-border)] shadow-sm">
        <ChatHeader
          conversation={conversation}
          onlineStatus={onlineStatus}
          onViewDetails={handleViewDetails}
          onMute={() => toast.info("Le mode silencieux arrive bientôt")}
          onBlock={() => toast.info("Le blocage arrive bientôt")}
          onDelete={() => toast.info("La suppression arrive bientôt")}
        />
      </div>

      {isGroup && groupData?.isPrivate && !membership ? (
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <div className="space-y-4 max-w-sm">
            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-[var(--chat-text)]">Accès restreint</h2>
            <p className="text-[var(--chat-textMuted)]">
              Ce groupe est privé. Vous devez être membre pour voir les messages.
            </p>
            <Button onClick={() => setShowJoinDialog(true)}>Demander l'accès</Button>
          </div>
        </div>
      ) : (
        <MessageList
          messages={messages}
          currentUserId={user?.id || ""}
          isGroup={isGroup}
          isLoading={isLoading}
          typingUsers={typingUsers}
          onReply={handleReply}
          onDelete={handleDeleteMessage}
          onLike={handleLikeMessage}
          onRetry={handleRetryMessage}
          likedMessageIds={likedMessageIds}
          likeCounts={likeCounts}
          hasMore={hasMore}
          onLoadMore={loadMore}
          className="flex-1 relative z-0"
        />
      )}

      <div className="flex-none z-10 bg-[var(--chat-background)] border-t border-[var(--chat-border)] pb-[env(safe-area-inset-bottom)]">
        <MessageInput
          user={user}
          onSendMessage={handleSendMessage}
          replyTo={replyTo}
          onCancelReply={handleCancelReply}
          disabled={!user || (isGroup && (groupData?.isPrivate ?? false) && !membership)}
        />
      </div>

      {isGroup && groupData && user && (
        <JoinGroupDialog
          group={groupData}
          userId={user.id}
          isOpen={showJoinDialog}
          onClose={() => {
            setShowJoinDialog(false);
            if (!membership) router.push("/chats");
          }}
        />
      )}
    </div>
  );
}
