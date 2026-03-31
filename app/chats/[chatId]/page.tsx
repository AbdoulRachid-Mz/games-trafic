// app/chats/[chatId]/page.tsx
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
import type { ChatId, ChatMessage, Conversation } from "@/types/chat";
import { parseChatId, validateChatId } from "@/lib/chat-utils";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { ChatThemeProvider } from "@/contexts/chat-theme-context";
import { JoinGroupDialog } from "@/components/pages/chats/join-group-dialog";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

function ChatConversationContent() {
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

  const chatId = params.chatId as string;
  const validation = validateChatId(chatId);
  const parsed = parseChatId(chatId);

  useEffect(() => {
    if (!validation.valid || !parsed) {
      toast.error(validation.error || "Invalid chat");
      router.push("/chats");
    }
  }, [validation.valid, validation.error, parsed, router]);

  if (!validation.valid || !parsed) {
    return null;
  }

  // Fetch entity details
  const isGroup = parsed.type === "group";
  const entityId = parsed.id;

  const { data: groupData, isLoading: isLoadingGroup } = useGroupById(
    isGroup ? entityId : undefined
  );
  const { data: userData, isLoading: isLoadingUser } = useUserById(
    !isGroup && parsed.type === "user" ? entityId : undefined
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
    !isGroup && parsed.type === "user" ? entityId : "",
    undefined,
    Boolean(!isGroup && parsed.type === "user" && !!user)
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
    const indicators = typingIndicators.get(chatId as ChatId) || [];
    const usernames = indicators.map((ind) => ind.username);
    setTypingUsers(usernames);
  }, [typingIndicators, chatId]);

  // Get online status for user chats
  const onlineStatus =
    parsed.type === "user" ? onlineStatuses.get(parsed.id) : undefined;

  // Mark messages as read when viewing
  useEffect(() => {
    if (messages.length > 0 && user) {
      const unreadMessages = messages.filter(
        (msg) => msg.recipientId === user.id && !msg.read
      );

      if (unreadMessages.length > 0) {
        // Mark as read after a short delay
        const timer = setTimeout(() => {
          unreadMessages.forEach((msg) => {
            markAsReadMutation.mutate(msg.id);
          });
        }, 1000);

        return () => clearTimeout(timer);
      }
    }
  }, [messages, user, markAsReadMutation]);

  // Refetch messages periodically for real-time feel
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 10000); // Every 10 seconds

    return () => clearInterval(interval);
  }, [refetch]);

  // Handle send message
  const handleSendMessage = useCallback(
    async (content: string, images?: string[]) => {
      if (!user) {
        toast.error("You must be logged in to send messages");
        return;
      }

      if (isGroup && !membership) {
        toast.error("You must be a member to send messages");
        return;
      }

      try {
        const messageData: any = {
          senderId: user.id,
          content,
          images: images || [],
        };

        // Set recipient based on entity type
        if (parsed.type === "group") {
          messageData.groupId = parsed.id;
        } else if (parsed.type === "user") {
          messageData.recipientId = parsed.id;
        } else {
          // For other entity types (shop, product, etc.)
          messageData.entityType = parsed.type.toUpperCase();
          messageData.entityId = parsed.id;
        }

        // Add reply reference if replying
        if (replyTo) {
          messageData.parentMessageId = replyTo.id;
        }

        await createMessageMutation.mutateAsync(messageData);

        // Clear reply
        setReplyTo(null);

        // Refetch messages
        refetch();
      } catch (error) {
        console.error("Failed to send message:", error);
        toast.error("Failed to send message");
      }
    },
    [user, parsed, replyTo, createMessageMutation, refetch, isGroup, membership]
  );

  // Handle reply
  const handleReply = useCallback((message: ChatMessage) => {
    setReplyTo(message);
  }, []);

  const handleCancelReply = useCallback(() => {
    setReplyTo(null);
  }, []);

  // Handle view details
  const handleViewDetails = useCallback(() => {
    router.push(`/chats/${chatId}/detail`);
  }, [router, chatId]);

  // Conversation data with actual entity details
  const conversation: Conversation = activeConversation || {
    chatId: chatId as Conversation["chatId"],
    entityType: parsed.type,
    entityId: parsed.id,
    unreadCount: 0,
    entity: {
      type: parsed.type as any,
      data: (isGroup ? groupData : userData) as any,
    },
  };

  if (isLoading && messages.length === 0) {
    return (
      <div className="flex flex-col h-screen bg-[var(--chat-background)]">
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
    <div className="flex flex-col h-screen bg-[var(--chat-background)]">
      {/* Header */}
      <ChatHeader
        conversation={conversation}
        onlineStatus={onlineStatus}
        onViewDetails={handleViewDetails}
        onMute={() => toast.info("Mute feature coming soon")}
        onBlock={() => toast.info("Block feature coming soon")}
        onDelete={() => toast.info("Delete feature coming soon")}
      />

      {/* Messages */}
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

      {/* Input */}
      <MessageInput
        user={user}
        onSendMessage={handleSendMessage}
        replyTo={replyTo}
        onCancelReply={handleCancelReply}
        disabled={!user || (isGroup && (groupData?.isPrivate ?? false) && !membership)}
      />

      {/* Join Dialog */}
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

export default function ChatConversationPage() {
  return (
    <ChatThemeProvider>
      <ChatConversationContent />
    </ChatThemeProvider>
  );
}
