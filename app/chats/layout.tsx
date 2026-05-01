"use client";

import React, { Suspense } from "react";
import { useScreenSize } from "@/hooks/use-screen";
import { useSearchParams, usePathname } from "next/navigation";
import { ChatSidebar } from "@/components/pages/chats/chat-sidebar";
import { cn } from "@/lib/utils";
import { ChatThemeProvider } from "@/contexts/chat-theme-context";
import { ChatProvider } from "@/contexts/chat-context";
import { getChatFromParams } from "@/lib/get-chat-from-params";

function ChatLayoutInner({ children }: { children: React.ReactNode }) {
  const { isMobile } = useScreenSize();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const chat = getChatFromParams(searchParams);
  const isGroupAction = pathname?.includes("/chats/groups/");
  const hasActiveChat = !!chat || isGroupAction;

  // Sur mobile, si on a une conversation ouverte ou une action groupe, on cache la sidebar
  const showSidebar = !isMobile || !hasActiveChat;
  const showContent = !isMobile || hasActiveChat;

  return (
    <div className="flex h-[calc(100dvh)] w-full bg-[var(--chat-background)] overflow-hidden text-[var(--chat-text)]">
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
  );
}

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <ChatThemeProvider>
      <ChatProvider>
        <Suspense fallback={<div className="flex h-[calc(100dvh)] w-full bg-[var(--chat-background)]" />}>
          <ChatLayoutInner>{children}</ChatLayoutInner>
        </Suspense>
      </ChatProvider>
    </ChatThemeProvider>
  );
}