// app/chats/[chatId]/detail/page.tsx
"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ChatThemeProvider } from "@/contexts/chat-theme-context";
import { parseChatId } from "@/lib/chat-utils";
import { getInitials } from "@/utils/chat-helpers";
import { toast } from "sonner";
import {
  ArrowLeft,
  Bell,
  BellOff,
  Trash2,
  UserX,
  Image as ImageIcon,
  Users,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

function ChatDetailContent() {
  const params = useParams();
  const router = useRouter();
  const chatId = params.chatId as string;

  const parsed = parseChatId(chatId);
  if (!parsed) {
    router.push("/chats");
    return null;
  }

  const isGroup = parsed.type === "group";

  // Mock data - replace with actual API calls
  const entityName = isGroup ? "Sample Group" : "John Doe";
  const entityAvatar = null;
  const initials = getInitials(entityName);
  const memberCount = isGroup ? 5 : undefined;
  const isMuted = false;
  const sharedMedia = []; // Mock shared media

  const handleBack = () => {
    router.back();
  };

  const handleToggleMute = () => {
    toast.info("Mute feature coming soon");
  };

  const handleBlock = () => {
    toast.info("Block feature coming soon");
  };

  const handleDelete = () => {
    toast.info("Delete feature coming soon");
  };

  const handleViewMedia = () => {
    toast.info("Media gallery coming soon");
  };

  return (
    <div className="min-h-screen bg-[var(--chat-background)]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[var(--chat-surface)] border-b border-[var(--chat-border)] p-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-[var(--chat-text)]">
            {isGroup ? "Group Info" : "Contact Info"}
          </h1>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-73px)]">
        <div className="max-w-2xl mx-auto p-6 space-y-6">
          {/* Profile Section */}
          <div className="bg-[var(--chat-surface)] rounded-lg border border-[var(--chat-border)] p-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={entityAvatar || undefined} alt={entityName} />
                <AvatarFallback className="bg-[var(--chat-primary)] text-[var(--chat-messageSentText)] text-2xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold text-[var(--chat-text)]">
                  {entityName}
                </h2>
                {isGroup && memberCount && (
                  <p className="text-sm text-[var(--chat-textMuted)] mt-1">
                    {memberCount} members
                  </p>
                )}
              </div>
              {isGroup && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push(`/chats/groups/${parsed.id}`)}
                >
                  <Users className="h-4 w-4 mr-2" />
                  View Group Details
                </Button>
              )}
            </div>
          </div>

          {/* Settings Section */}
          <div className="bg-[var(--chat-surface)] rounded-lg border border-[var(--chat-border)] overflow-hidden">
            <div className="p-4 space-y-4">
              <h3 className="font-semibold text-[var(--chat-text)]">
                Settings
              </h3>

              {/* Mute Notifications */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isMuted ? (
                    <BellOff className="h-5 w-5 text-[var(--chat-textMuted)]" />
                  ) : (
                    <Bell className="h-5 w-5 text-[var(--chat-textMuted)]" />
                  )}
                  <div>
                    <Label>Mute Notifications</Label>
                    <p className="text-sm text-[var(--chat-textMuted)]">
                      Stop receiving notifications
                    </p>
                  </div>
                </div>
                <Switch checked={isMuted} onCheckedChange={handleToggleMute} />
              </div>
            </div>
          </div>

          {/* Shared Media */}
          <div className="bg-[var(--chat-surface)] rounded-lg border border-[var(--chat-border)] overflow-hidden">
            <button
              onClick={handleViewMedia}
              className="w-full p-4 flex items-center justify-between hover:bg-[var(--chat-surfaceHover)] transition-colors"
            >
              <div className="flex items-center gap-3">
                <ImageIcon className="h-5 w-5 text-[var(--chat-textMuted)]" />
                <div className="text-left">
                  <p className="font-medium text-[var(--chat-text)]">
                    Shared Media
                  </p>
                  <p className="text-sm text-[var(--chat-textMuted)]">
                    {sharedMedia.length} items
                  </p>
                </div>
              </div>
              <ArrowLeft className="h-5 w-5 rotate-180 text-[var(--chat-textMuted)]" />
            </button>
          </div>

          {/* Danger Zone */}
          <div className="bg-[var(--chat-surface)] rounded-lg border border-[var(--chat-error)]/20 overflow-hidden">
            <div className="p-4 space-y-2">
              <h3 className="font-semibold text-[var(--chat-error)]">
                Danger Zone
              </h3>

              {!isGroup && (
                <Button
                  variant="ghost"
                  className="w-full justify-start text-[var(--chat-error)] hover:text-[var(--chat-error)] hover:bg-[var(--chat-error)]/10"
                  onClick={handleBlock}
                >
                  <UserX className="h-4 w-4 mr-2" />
                  Block User
                </Button>
              )}

              <Button
                variant="ghost"
                className="w-full justify-start text-[var(--chat-error)] hover:text-[var(--chat-error)] hover:bg-[var(--chat-error)]/10"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Conversation
              </Button>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

export default function ChatDetailPage() {
  return (
    <ChatThemeProvider>
      <ChatDetailContent />
    </ChatThemeProvider>
  );
}
