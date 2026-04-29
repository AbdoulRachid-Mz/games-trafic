// app/chats/[entityType]/[entityId]/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChatHeader } from "@/components/pages/chats/chat-header";
import { MessageList } from "@/components/pages/chats/message-list";
import { MessageInput } from "@/components/pages/chats/message-input";
import { useAuthContext } from "@/contexts/auth-context";
import { useChatContext } from "@/contexts/chat-context";
import { useGroupById, useGroupMemberByUserAndGroup } from "@/hooks/use-groupes";
import { useUserById } from "@/hooks/use-users";
import {
  useGroupMessages,
  useConversation,
  useCreateMessage,
  useMarkMessageAsRead,
} from "@/hooks/use-messages";
import type { ChatId, ChatMessage, Conversation, ChatEntityType } from "@/types/chat";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { JoinGroupDialog } from "@/components/pages/chats/join-group-dialog";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

const VALID_ENTITY_TYPES: ChatEntityType[] = ["user", "group", "shop", "product", "post", "tournament"];

export default function ChatConversationPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthContext();
  const {
    activeConversation,
    setActiveConversation,
    typingIndicators,
    onlineStatuses,
  } = useChatContext();

  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [showJoinDialog, setShowJoinDialog] = useState(false);

  const entityType = params.entityType as ChatEntityType;
  const entityId = params.entityId as string;
  const chatId = `${entityType}:${entityId}` as ChatId;

  // Validation des paramètres
  useEffect(() => {
    if (!entityType || !entityId || !VALID_ENTITY_TYPES.includes(entityType)) {
      toast.error("Type de discussion invalide");
      router.push("/chats");
    }
  }, [entityType, entityId, router]);

  if (!entityType || !entityId || !VALID_ENTITY_TYPES.includes(entityType)) {
    return null;
  }

  // Fetch entity details
  const isGroup = entityType === "group";

  const { data: groupData, isLoading: isLoadingGroup } = useGroupById(
    isGroup ? entityId : undefined
  );
  const { data: userData, isLoading: isLoadingUser } = useUserById(
    !isGroup && entityType === "user" ? entityId : undefined
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
  const {
    data: groupMessagesData,
    isLoading: isLoadingGroupMessages,
    refetch: refetchGroupMessages,
  } = useGroupMessages(isGroup ? entityId : "", undefined, Boolean(isGroup && !!membership));

  const {
    data: dmMessagesData,
    isLoading: isLoadingDmMessages,
    refetch: refetchDmMessages,
  } = useConversation(
    user?.id || "",
    !isGroup && entityType === "user" ? entityId : "",
    undefined,
    Boolean(!isGroup && entityType === "user" && !!user)
  );

  const isLoading =
    isLoadingGroup ||
    isLoadingUser ||
    isLoadingGroupMessages ||
    isLoadingDmMessages ||
    Boolean(isGroup && isLoadingMembership);
  
  const messages = isGroup
    ? groupMessagesData?.data || []
    : dmMessagesData?.data || [];

  const refetch = isGroup ? refetchGroupMessages : refetchDmMessages;

  const createMessageMutation = useCreateMessage();
  const markAsReadMutation = useMarkMessageAsRead();

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
        const messageData: any = {
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

        await createMessageMutation.mutateAsync(messageData);
        setReplyTo(null);
        refetch();
      } catch (error) {
        console.error("Failed to send message:", error);
        toast.error("Erreur lors de l'envoi du message");
      }
    },
    [user, entityType, entityId, replyTo, createMessageMutation, refetch, isGroup, membership]
  );

  const handleReply = useCallback((message: ChatMessage) => {
    setReplyTo(message);
  }, []);

  const handleCancelReply = useCallback(() => {
    setReplyTo(null);
  }, []);

  const handleViewDetails = useCallback(() => {
    if (isGroup) {
      router.push(`/chats/groups/${entityId}`);
    } else {
      router.push(`/profile/${entityId}`);
    }
  }, [router, isGroup, entityId]);

  const conversation: Conversation = activeConversation || {
    id: chatId,
    chatId: chatId,
    entityType: entityType,
    entityId: entityId,
    unreadCount: 0,
    entity: {
      type: entityType,
      data: (isGroup ? groupData : userData) as any,
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
    <div className="flex flex-col h-full bg-[var(--chat-background)] relative">
      <ChatHeader
        conversation={conversation}
        onlineStatus={onlineStatus}
        onViewDetails={handleViewDetails}
        onMute={() => toast.info("Le mode silencieux arrive bientôt")}
        onBlock={() => toast.info("Le blocage arrive bientôt")}
        onDelete={() => toast.info("La suppression arrive bientôt")}
      />

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
          className="flex-1"
        />
      )}

      <MessageInput
        user={user}
        onSendMessage={handleSendMessage}
        replyTo={replyTo}
        onCancelReply={handleCancelReply}
        disabled={!user || (isGroup && (groupData?.isPrivate ?? false) && !membership)}
      />

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
