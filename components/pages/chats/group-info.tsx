// components/pages/chats/group-info.tsx
"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getInitials } from "@/utils/chat-helpers";
import { cn } from "@/lib/utils";
import { Users, Calendar, Lock, Globe, Edit, LogOut } from "lucide-react";
import { format } from "date-fns";

export interface GroupInfoData {
  id: string;
  name: string;
  description?: string;
  image?: string;
  isPrivate: boolean;
  createdAt: Date;
  memberCount: number;
  creatorId: string;
}

interface GroupInfoProps {
  group: GroupInfoData;
  currentUserId: string;
  currentUserRole: "OWNER" | "ADMIN" | "MEMBER";
  onEdit?: () => void;
  onLeave?: () => void;
  onViewMembers?: () => void;
  className?: string;
}

export function GroupInfo({
  group,
  currentUserId,
  currentUserRole,
  onEdit,
  onLeave,
  onViewMembers,
  className,
}: GroupInfoProps) {
  const initials = getInitials(group.name);
  const isOwner = currentUserRole === "OWNER";
  const canEdit = isOwner || currentUserRole === "ADMIN";

  return (
    <div className={cn("space-y-6", className)}>
      {/* Group Header */}
      <div className="flex flex-col items-center text-center space-y-4 p-6 bg-[var(--chat-surface)] rounded-lg border border-[var(--chat-border)]">
        <Avatar className="h-24 w-24">
          <AvatarImage src={group.image || undefined} alt={group.name} />
          <AvatarFallback className="bg-[var(--chat-primary)] text-[var(--chat-messageSentText)] text-2xl">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-[var(--chat-text)]">
            {group.name}
          </h2>
          {group.description && (
            <p className="text-sm text-[var(--chat-textMuted)] max-w-md">
              {group.description}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 w-full">
          {canEdit && onEdit && (
            <Button
              onClick={onEdit}
              className="flex-1 bg-[var(--chat-primary)] hover:bg-[var(--chat-accentHover)] text-[var(--chat-messageSentText)]"
            >
              <Edit className="h-4 w-4 mr-2" />
              Modifier le groupe
            </Button>
          )}
          {!isOwner && onLeave && (
            <Button
              onClick={onLeave}
              variant="outline"
              className={cn(
                "flex-1 border-[var(--chat-error)] text-[var(--chat-error)]",
                "hover:bg-[var(--chat-error)]/10"
              )}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Quitter le groupe
            </Button>
          )}
        </div>
      </div>

      {/* Group Details */}
      <div className="bg-[var(--chat-surface)] rounded-lg border border-[var(--chat-border)] overflow-hidden">
        <div className="p-4 space-y-4">
          <h3 className="font-semibold text-[var(--chat-text)]">
            Détails du groupe
          </h3>

          {/* Privacy */}
          <div className="flex items-center gap-3">
            {group.isPrivate ? (
              <Lock className="h-5 w-5 text-[var(--chat-textMuted)]" />
            ) : (
              <Globe className="h-5 w-5 text-[var(--chat-textMuted)]" />
            )}
            <div className="flex-1">
              <p className="font-medium text-[var(--chat-text)]">
                {group.isPrivate ? "Groupe privé" : "Groupe public"}
              </p>
              <p className="text-sm text-[var(--chat-textMuted)]">
                {group.isPrivate
                  ? "Seuls les membres invités peuvent rejoindre"
                  : "Tout le monde peut rejoindre ce groupe"}
              </p>
            </div>
          </div>

          <Separator />

          {/* Members */}
          <button
            onClick={onViewMembers}
            className="w-full flex items-center gap-3 hover:bg-[var(--chat-surfaceHover)] p-2 rounded-lg transition-colors"
          >
            <Users className="h-5 w-5 text-[var(--chat-textMuted)]" />
            <div className="flex-1 text-left">
              <p className="font-medium text-[var(--chat-text)]">
                {group.memberCount} Membres
              </p>
              <p className="text-sm text-[var(--chat-textMuted)]">
                Voir tous les membres
              </p>
            </div>
          </button>

          <Separator />

          {/* Created Date */}
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-[var(--chat-textMuted)]" />
            <div className="flex-1">
              <p className="font-medium text-[var(--chat-text)]">Créé le</p>
              <p className="text-sm text-[var(--chat-textMuted)]">
                {format(new Date(group.createdAt), "d MMMM yyyy")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
