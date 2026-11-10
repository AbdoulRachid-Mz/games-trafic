// components/pages/chats/message-actions-dropdown.tsx
"use client";

import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  MoreVertical,
  Heart,
  Reply,
  Copy,
  Trash2,
  Pin,
  CheckSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types/chat";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";

export interface MessageAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  destructive?: boolean;
  separator?: boolean;
  isDelete?: boolean;
}

interface MessageActionsDropdownProps {
  message: ChatMessage;
  isSent: boolean;
  isLiked: boolean;
  canDelete: boolean;
  canPin?: boolean;
  onReply: () => void;
  onLike: () => void;
  onCopy: () => void;
  onDelete: () => void;
  onPin?: () => void;
  onSelect?: () => void;
  className?: string;
}

export function MessageActionsDropdown({
  message,
  isSent,
  isLiked,
  canDelete,
  canPin = false,
  onReply,
  onLike,
  onCopy,
  onDelete,
  onPin,
  onSelect,
  className,
}: MessageActionsDropdownProps) {
  const actions: MessageAction[] = [
    {
      id: "like",
      label: isLiked ? "Retirer le like" : "J'aime",
      icon: (
        <Heart
          className={cn(
            "h-4 w-4",
            isLiked && "fill-red-500 text-red-500"
          )}
        />
      ),
      onClick: onLike,
    },
    {
      id: "reply",
      label: "Répondre",
      icon: <Reply className="h-4 w-4" />,
      onClick: onReply,
    },
    ...(message.content
      ? [
          {
            id: "copy",
            label: "Copier le texte",
            icon: <Copy className="h-4 w-4" />,
            onClick: onCopy,
          },
        ]
      : []),
    ...(canPin && onPin
      ? [
          {
            id: "pin",
            label: "Épingler",
            icon: <Pin className="h-4 w-4" />,
            onClick: onPin,
          },
        ]
      : []),
    ...(onSelect
      ? [
          {
            id: "select",
            label: "Sélectionner",
            icon: <CheckSquare className="h-4 w-4" />,
            onClick: onSelect,
            separator: true,
          },
        ]
      : []),
    ...(canDelete
      ? [
          {
            id: "delete",
            label: "Supprimer",
            icon: <Trash2 className="h-4 w-4" />,
            onClick: onDelete,
            destructive: true,
            separator: !onSelect,
            isDelete: true,
          },
        ]
      : []),
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-9 w-9 rounded-full",
            "opacity-100 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100",
            "bg-[var(--chat-surface)]/80 backdrop-blur-sm border border-[var(--chat-border)]",
            "hover:bg-[var(--chat-surfaceHover)] text-[var(--chat-textMuted)]",
            "transition-all duration-150 shadow-sm",
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical className="h-3.5 w-3.5" />
          <span className="sr-only">Actions du message</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align={isSent ? "end" : "start"}
        side="top"
        sideOffset={4}
        className={cn(
          "w-48 rounded-xl shadow-xl border border-[var(--chat-border)]",
          "bg-[var(--chat-surface)] text-[var(--chat-text)]"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {actions.map((action, idx) => (
          <React.Fragment key={action.id}>
            {action.separator && idx > 0 && <DropdownMenuSeparator />}
            {action.isDelete ? (
              <ConfirmationDialog
                title="Supprimer le message"
                description="Êtes-vous sûr de vouloir supprimer ce message ? Cette action est irréversible."
                onConfirm={action.onClick}
                confirmLabel="Supprimer"
              >
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                  }}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg cursor-pointer px-3 py-2",
                    "hover:bg-[var(--chat-surfaceHover)] focus:bg-[var(--chat-surfaceHover)]",
                    action.destructive &&
                      "text-destructive hover:text-destructive focus:text-destructive"
                  )}
                >
                  {action.icon}
                  <span className="text-sm">{action.label}</span>
                </DropdownMenuItem>
              </ConfirmationDialog>
            ) : (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  action.onClick();
                }}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg cursor-pointer px-3 py-2",
                  "hover:bg-[var(--chat-surfaceHover)] focus:bg-[var(--chat-surfaceHover)]",
                  action.destructive &&
                    "text-destructive hover:text-destructive focus:text-destructive"
                )}
              >
                {action.icon}
                <span className="text-sm">{action.label}</span>
              </DropdownMenuItem>
            )}
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
