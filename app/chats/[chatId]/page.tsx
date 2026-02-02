// app/chats/[chatId]/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChatHeader } from "@/components/pages/chats/chat-header";
import { MessageList } from "@/components/pages/chats/message-list";
import { MessageInput } from "@/components/pages/chats/message-input";
import { useAuthContext } from "@/contexts/auth-context";
import { useChatContext } from "@/contexts/chat-context";
import { ChatThemeProvider } from "@/contexts/chat-theme-context";
import { useGroupMessages } from "@/hooks/use-messages";
import { useCreateMessage, useMarkMessageAsRead } from "@/hooks/use-messages";
import type { ChatId, ChatMessage, Conversation } from "@/types/chat";
import { parseChatId, validateChatId } from "@/lib/chat-utils";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

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

  const chatId = params.chatId as string;

  // Validate chat ID
  const validation = validateChatId(chatId);
  if (!validation.valid) {
    toast.error(validation.error);
    router.push("/chats");
    return null;
  }

  const parsed = parseChatId(chatId);
  if (!parsed) {
    router.push("/chats");
    return null;
  }

  // Fetch messages based on entity type
  const isGroup = parsed.type === "group";
  const entityId = parsed.id;

  // TODO: Replace with actual API calls based on entity type
  // For now, using group messages as example
  const {
    data: messagesData,
    isLoading,
    refetch,
  } = useGroupMessages(isGroup ? entityId : "", undefined, isGroup);

  const createMessageMutation = useCreateMessage();
  const markAsReadMutation = useMarkMessageAsRead();

  const messages = messagesData?.data || [];

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
    [user, parsed, replyTo, createMessageMutation, refetch]
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

  // Mock conversation data (replace with actual data from API)
  const conversation: Conversation = activeConversation || {
    chatId: chatId as Conversation["chatId"],
    entityType: parsed.type,
    entityId: parsed.id,
    unreadCount: 0,
    entity: {
      type: parsed.type,
      data: {} as any, // TODO: Fetch actual entity data
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
      <MessageList
        messages={messages}
        currentUserId={user?.id || ""}
        isGroup={isGroup}
        isLoading={isLoading}
        typingUsers={typingUsers}
        onReply={handleReply}
        className="flex-1"
      />

      {/* Input */}
      <MessageInput
        user={user}
        onSendMessage={handleSendMessage}
        replyTo={replyTo}
        onCancelReply={handleCancelReply}
        disabled={!user}
      />
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
