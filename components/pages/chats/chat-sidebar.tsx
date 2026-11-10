"use client";

import React, { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getChatFromParams } from "@/lib/get-chat-from-params";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConversationList } from "./conversation-list";
import { ChatSearch } from "./chat-search";
import { useAuthContext } from "@/contexts/auth-context";
import { useConversations } from "@/hooks/use-conversations";
import type { Conversation, ChatId } from "@/types/chat";
import {
  MessageSquarePlus,
  Users,
  Palette,
  MessageSquare,
  User,
  Bell,
  Settings,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { canCreateGroup, getGroupLimits } from "@/lib/chat-utils";
import { toast } from "sonner";
import { ThemeSelector } from "./theme-selector";

export function ChatSidebar() {
  const router = useRouter();
  const searchParams = useSearchParams();
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

  const chat = getChatFromParams(searchParams);
  const activeConversationId = chat?.chatId || null;
  const [isThemeSelectorOpen, setIsThemeSelectorOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  // Filtrer les conversations par type
  const filteredConversations = useMemo(() => {
    let filtered = conversations;

    // Appliquer le filtre de recherche
    if (searchQuery) {
      filtered = filtered.filter((c) => {
        const name =
          c.entity?.data?.name ||
          c.entity?.data?.username ||
          c.entity?.data?.fullName ||
          "";
        return name.toLowerCase().includes(searchQuery.toLowerCase());
      });
    }

    // Appliquer le filtre de tab
    switch (activeTab) {
      case "direct":
        filtered = filtered.filter((c) => c.entityType === "user");
        break;
      case "groups":
        filtered = filtered.filter((c) => c.entityType === "group");
        break;
      case "unread":
        filtered = filtered.filter((c) => c.unreadCount > 0);
        break;
      case "all":
      default:
        // Pas de filtre supplémentaire
        break;
    }

    return filtered;
  }, [conversations, activeTab, searchQuery]);

  const handleConversationClick = (conversation: Conversation) => {
    router.push(`/chats?entityType=${conversation.entityType}&entityId=${conversation.entityId}`);
  };

  const handleCreateGroup = () => {
    if (!user) {
      toast.error("Vous devez être connecté pour créer des groupes");
      return;
    }

    const currentGroupCount = conversations.filter(
      (c) => c.entityType === "group",
    ).length;
    const validation = canCreateGroup(user, currentGroupCount);

    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    router.push("/chats/groups/create");
  };

  const handleStartConversation = () => {
    toast.info("La sélection d'utilisateur arrive bientôt");
  };

  const handleThemeSelector = () => {
    setIsThemeSelectorOpen(true);
  };

  const limits = getGroupLimits(user);
  const directCount = conversations.filter(
    (c) => c.entityType === "user",
  ).length;
  const groupsCount = conversations.filter(
    (c) => c.entityType === "group",
  ).length;

  return (
    <div className="flex flex-col h-full bg-[var(--chat-surface)] w-full md:w-[380px]">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-[var(--chat-border)]">
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden -ml-2"
            onClick={() => router.push("/")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-[var(--chat-text)]">
              Discussions
            </h1>
            {totalUnreadCount > 0 && (
              <p className="text-xs text-[var(--chat-primary)] font-medium">
                {totalUnreadCount} non lues
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleThemeSelector}
            className="h-9 w-9 text-[var(--chat-textMuted)] hover:text-[var(--chat-text)]"
            title="Thèmes"
          >
            <Palette className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleStartConversation}
            className="h-9 w-9 text-[var(--chat-textMuted)] hover:text-[var(--chat-text)]"
            title="Démarrer une discussion"
          >
            <MessageSquarePlus className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleCreateGroup}
            className="h-9 w-9 text-[var(--chat-textMuted)] hover:text-[var(--chat-text)]"
            title="Nouveau groupe"
          >
            <Users className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search */}
      <ChatSearch
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filter={filter}
        onFilterChange={setFilter}
      />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
        <TabsList className="w-full h-9 bg-transparent p-0 gap-2 border-b border-[var(--chat-border)] rounded-none">
          <TabsTrigger
            value="all"
            className="flex-1 bg-transparent border-b-2 border-transparent data-[state=active]:border-[var(--chat-primary)] data-[state=active]:bg-transparent rounded-none px-0"
          >
            Tout
          </TabsTrigger>
          <TabsTrigger
            value="direct"
            className="flex-1 bg-transparent border-b-2 border-transparent data-[state=active]:border-[var(--chat-primary)] data-[state=active]:bg-transparent rounded-none px-0"
          >
            DM
          </TabsTrigger>
          <TabsTrigger
            value="groups"
            className="flex-1 bg-transparent border-b-2 border-transparent data-[state=active]:border-[var(--chat-primary)] data-[state=active]:bg-transparent rounded-none px-0"
          >
            Groupes
          </TabsTrigger>
          <TabsTrigger
            value="unread"
            className="flex-1 bg-transparent border-b-2 border-transparent data-[state=active]:border-[var(--chat-primary)] data-[state=active]:bg-transparent rounded-none px-0"
          >
            {totalUnreadCount > 0 ? (
              <span className="flex items-center gap-1">
                Non lus{" "}
                <span className="bg-[var(--chat-primary)] text-white text-[10px] rounded-full px-1.5 py-0.5">
                  {totalUnreadCount}
                </span>
              </span>
            ) : (
              "Non lus"
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Conversation list */}
      <div className="flex-1 overflow-hidden">
        <ConversationList
          conversations={filteredConversations}
          activeConversationId={activeConversationId as any}
          isLoading={isLoading}
          onConversationClick={handleConversationClick}
          emptyMessage={
            searchQuery
              ? "Aucune conversation trouvée"
              : activeTab === "unread"
                ? "Aucun message non lu"
                : "Commencez à discuter"
          }
        />
      </div>

      {/* Theme Selector */}
      <ThemeSelector
        open={isThemeSelectorOpen}
        onOpenChange={setIsThemeSelectorOpen}
      />
    </div>
  );
}
