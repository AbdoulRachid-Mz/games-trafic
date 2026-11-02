"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { MessageSquare, Shield, Smartphone, Laptop, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getChatFromParams } from "@/lib/get-chat-from-params";
import { ChatConversationView } from "@/components/pages/chats/chat-conversation-view";
import { Skeleton } from "@/components/ui/skeleton";

function ChatPageContent() {
  const searchParams = useSearchParams();
  const chat = getChatFromParams(searchParams);

  // If we have valid chat params, render conversation view
  if (chat) {
    return (
      <ChatConversationView
        key={chat.chatId}
        entityType={chat.entityType}
        entityId={chat.entityId}
      />
    );
  }

  // Otherwise, show welcome screen
  return (
    <div className="h-full flex flex-col items-center justify-center bg-[var(--chat-background)] p-8 text-center">
      <div className="max-w-md space-y-3">
        <div className="flex justify-center">
          <div className="h-24 w-24 bg-[var(--chat-surface)] rounded-full flex items-center justify-center shadow-lg border border-[var(--chat-border)]">
            <MessageSquare className="h-12 w-12 text-[var(--chat-primary)]" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-[var(--chat-text)]">
            GT Messenger
          </h1>
          <p className="text-[var(--chat-textMuted)] leading-relaxed text-sm">
            Échangez en temps réel avec vos coéquipiers, vendeurs et adversaires.
            Négociez vos transactions, organisez vos matchs et restez connecté à la communauté Games-Trafics.
          </p>
        </div>

        <div className="pt-4">
          <Button
            className="bg-[var(--chat-primary)] hover:bg-[var(--chat-accentHover)] text-white px-6"
            asChild
          >
            <Link href="/chats">
              Commencer à discuter
              <ChevronRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>

        <div className="pt-4 border-t border-[var(--chat-border)]">
          <div className="flex items-center justify-center gap-2 text-sm text-[var(--chat-textMuted)]">
            <Shield className="h-4 w-4" />
            <span>Chiffrement et protection des échanges</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-6 pt-2 text-[var(--chat-textMuted)]">
          <div className="flex flex-col items-center gap-1">
            <Smartphone className="h-5 w-5" />
            <span className="text-[10px]">Mobile</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Laptop className="h-5 w-5" />
            <span className="text-[10px]">Desktop</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChatsPage() {
  return (
    <Suspense
      fallback={
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
      }
    >
      <ChatPageContent />
    </Suspense>
  );
}
