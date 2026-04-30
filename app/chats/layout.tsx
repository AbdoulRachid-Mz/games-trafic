"use client";

import React from "react";
import { useScreenSize } from "@/hooks/use-screen";
import { useParams, usePathname } from "next/navigation";
import { ChatSidebar } from "@/components/pages/chats/chat-sidebar";
import { cn } from "@/lib/utils";
import { ChatThemeProvider } from "@/contexts/chat-theme-context";
import { ChatProvider } from "@/contexts/chat-context";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const { isMobile } = useScreenSize();
  const params = useParams();
  const pathname = usePathname();
  
  // Nouvelle logique : on vérifie si une entité est sélectionnée ou si on est dans une sous-page groupe
  const isGroupAction = pathname?.includes("/chats/groups/");
  const hasActiveChat = !!params.entityId || !!params.chatId || isGroupAction;
  
  // Sur mobile, si on a une conversation ouverte ou une action groupe, on cache la sidebar
  const showSidebar = !isMobile || !hasActiveChat;
  const showContent = !isMobile || hasActiveChat;

  return (
    <ChatThemeProvider>
      <ChatProvider>
        <div className="flex h-[calc(100dvh-5rem)] w-full bg-[var(--chat-background)] overflow-hidden text-[var(--chat-text)]">
          {/* Sidebar */}
          {showSidebar && (
            <div className={cn(
              "flex-shrink-0 border-r border-[var(--chat-border)] bg-[var(--chat-surface)]",
              isMobile ? "w-full" : "w-[380px]"
            )}>
              <ChatSidebar />
            </div>
          )}

          {/* Content */}
          {showContent && (
            <div className="flex-1 h-full overflow-y-auto no-scrollbar relative">
              {children}
            </div>
          )}
        </div>
      </ChatProvider>
    </ChatThemeProvider>
  );
}