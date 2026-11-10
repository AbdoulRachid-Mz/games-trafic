// components/pages/chats/chat-header.tsx
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/types/chat";
import {
  getEntityName,
  getEntityAvatar,
  getInitials,
  formatLastSeen,
} from "@/utils/chat-helpers";
import { ArrowLeft, MoreVertical, Phone, Video, Info } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChatHeaderProps {
  conversation: Conversation;
  onlineStatus?: { isOnline: boolean; lastSeen?: Date };
  onBack?: () => void;
  onViewDetails?: () => void;
  onMute?: () => void;
  onBlock?: () => void;
  onDelete?: () => void;
  className?: string;
}

export function ChatHeader({
  conversation,
  onlineStatus,
  onBack,
  onViewDetails,
  onMute,
  onBlock,
  onDelete,
  className,
}: ChatHeaderProps) {
  const router = useRouter();
  const entityName = getEntityName(conversation);
  const entityAvatar = getEntityAvatar(conversation);
  const initials = getInitials(entityName);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const isGroup = conversation.entityType === "group";
  const memberCount =
    isGroup && conversation.entity.type === "group"
      ? conversation.entity.data.memberCount
      : undefined;

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-4 border-b border-[var(--chat-border)] bg-[var(--chat-surface)]",
        className
      )}
    >
      {/* Back button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleBack}
        className="flex-shrink-0"
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>

      {/* Avatar and info */}
      <div
        className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
        onClick={onViewDetails}
      >
        <div className="relative flex-shrink-0">
          <Avatar className="h-10 w-10">
            <AvatarImage src={entityAvatar || undefined} alt={entityName} />
            <AvatarFallback className="bg-[var(--chat-primary)] text-[var(--chat-messageSentText)]">
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* Online indicator for users */}
          {!isGroup && onlineStatus?.isOnline && (
            <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[var(--chat-surface)] bg-[var(--chat-online)]" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-[var(--chat-text)] truncate">
            {entityName}
          </h2>
          <p className="text-xs text-[var(--chat-textMuted)] truncate">
            {isGroup
              ? memberCount
                ? `${memberCount} membres`
                : "Groupe"
              : onlineStatus?.isOnline
              ? "En ligne"
              : onlineStatus?.lastSeen
              ? formatLastSeen(onlineStatus.lastSeen)
              : "Hors ligne"}
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {/* Call button (for users only) */}
        {!isGroup && (
          <>
            <Button variant="ghost" size="icon" className="h-10 w-10">
              <Phone className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-10 w-10">
              <Video className="h-5 w-5" />
            </Button>
          </>
        )}

        {/* Info button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10"
          onClick={onViewDetails}
        >
          <Info className="h-5 w-5" />
        </Button>

        {/* More options */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-10 w-10">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={onViewDetails}>
              <Info className="h-4 w-4 mr-2" />
              Voir les détails
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onMute}>
              {conversation.isMuted ? "Réactiver" : "Couper"} les notifications
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {!isGroup && (
              <DropdownMenuItem
                onClick={onBlock}
                className="text-[var(--chat-warning)]"
              >
                Bloquer l'utilisateur
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={onDelete}
              className="text-[var(--chat-error)]"
            >
              Supprimer la conversation
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
