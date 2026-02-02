// app/chats/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConversationList } from "@/components/pages/chats/conversation-list";
import { ChatSearch } from "@/components/pages/chats/chat-search";
import { useAuthContext } from "@/contexts/auth-context";
import { useConversations } from "@/hooks/use-conversations";
import { ChatThemeProvider } from "@/contexts/chat-theme-context";
import { ChatProvider } from "@/contexts/chat-context";
import type { Conversation } from "@/types/chat";
import { MessageSquarePlus, Users, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import { canCreateGroup, getGroupLimits } from "@/lib/chat-utils";
import { toast } from "sonner";
import { ThemeSelector } from "@/components/pages/chats/theme-selector";

function ChatsPageContent() {
  const router = useRouter();
  const { user } = useAuthContext();
  const {
    conversations,
    totalUnreadCount,
    isLoading,
    searchQuery,
    setSearchQuery,
    filter,
    setFilter,
  } = useConversations(user?.id);

  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [isThemeSelectorOpen, setIsThemeSelectorOpen] = useState(false);

  const handleConversationClick = (conversation: Conversation) => {
    setActiveConversationId(conversation.chatId);
    router.push(`/chats/${conversation.chatId}`);
  };

  const handleCreateGroup = () => {
    if (!user) {
      toast.error("You must be logged in to create groups");
      return;
    }

    // Check if user can create more groups
    const currentGroupCount = conversations.filter(
      (c) => c.entityType === "group"
    ).length;
    const validation = canCreateGroup(user, currentGroupCount);

    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    router.push("/chats/groups/create");
  };

  const handleStartConversation = () => {
    // TODO: Implement user selection modal
    toast.info("User selection coming soon");
  };

  const handleThemeSelector = () => {
    setIsThemeSelectorOpen(true);
  };

  const limits = getGroupLimits(user);

  return (
    <div className="flex flex-col h-screen bg-[var(--chat-background)]">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-[var(--chat-border)] bg-[var(--chat-surface)] p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--chat-text)]">
              Chats
            </h1>
            {totalUnreadCount > 0 && (
              <p className="text-sm text-[var(--chat-textMuted)]">
                {totalUnreadCount} unread message
                {totalUnreadCount > 1 ? "s" : ""}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Theme selector button */}
            <Button
              variant="outline"
              size="icon"
              onClick={handleThemeSelector}
              className="border-[var(--chat-border)]"
            >
              <Palette className="h-4 w-4" />
            </Button>

            {/* Start conversation button */}
            <Button
              variant="outline"
              size="icon"
              onClick={handleStartConversation}
              className="border-[var(--chat-border)]"
            >
              <MessageSquarePlus className="h-4 w-4" />
            </Button>

            {/* Create group button */}
            <Button
              onClick={handleCreateGroup}
              className="bg-[var(--chat-primary)] hover:bg-[var(--chat-accentHover)] text-[var(--chat-messageSentText)]"
            >
              <Users className="h-4 w-4 mr-2" />
              New Group
              {limits.maxGroups !== Infinity && (
                <span className="ml-2 text-xs opacity-75">
                  (
                  {conversations.filter((c) => c.entityType === "group").length}
                  /{limits.maxGroups})
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Search and filters */}
        <ChatSearch
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filter={filter}
          onFilterChange={setFilter}
        />
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-hidden">
        <ConversationList
          conversations={conversations}
          activeConversationId={activeConversationId ? (activeConversationId as any) : undefined}
          isLoading={isLoading}
          onConversationClick={handleConversationClick}
          emptyMessage={
            searchQuery
              ? "No conversations found"
              : filter === "unread"
              ? "No unread conversations"
              : "Start a conversation to get started"
          }
        />
      </div>

      {/* Theme Selector Modal */}
      <ThemeSelector
        open={isThemeSelectorOpen}
        onOpenChange={setIsThemeSelectorOpen}
      />
    </div>
  );
}

export default function ChatsPage() {
  return (
    <ChatThemeProvider>
      <ChatProvider>
        <ChatsPageContent />
      </ChatProvider>
    </ChatThemeProvider>
  );
}
