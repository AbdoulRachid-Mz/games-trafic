
"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getInitials } from "@/utils/chat-helpers";
import { cn } from "@/lib/utils";
import { MoreVertical, Crown, Shield, UserMinus } from "lucide-react";

export interface GroupMember {
  id: string;
  userId: string;
  username: string;
  fullName?: string;
  profileImage?: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  joinedAt: Date;
}



interface GroupMembersProps {
  members: GroupMember[];
  currentUserId: string;
  currentUserRole: "OWNER" | "ADMIN" | "MEMBER";
  onPromoteToAdmin?: (memberId: string) => void;
  onDemoteToMember?: (memberId: string) => void;
  onRemoveMember?: (memberId: string) => void;
  className?: string;
}

export function GroupMembers({
  members,
  currentUserId,
  currentUserRole,
  onPromoteToAdmin,
  onDemoteToMember,
  onRemoveMember,
  className,
}: GroupMembersProps) {
  const canManageMembers =
    currentUserRole === "OWNER" || currentUserRole === "ADMIN";

  const getRoleIcon = (role: GroupMember["role"]) => {
    switch (role) {
      case "OWNER":
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case "ADMIN":
        return <Shield className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const getRoleBadge = (role: GroupMember["role"]) => {
    const variants = {
      OWNER: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      ADMIN: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      MEMBER:
        "bg-[var(--chat-surface)] text-[var(--chat-textMuted)] border-[var(--chat-border)]",
    };

    return (
      <Badge variant="outline" className={cn("text-xs shrink-0", variants[role])}>
        {role === "OWNER" && <Crown className="h-3 w-3 mr-1" />}
        {role === "ADMIN" && <Shield className="h-3 w-3 mr-1" />}
        {role === "OWNER" ? "PROPRIÉTAIRE" : role === "ADMIN" ? "ADMIN" : "MEMBRE"}
      </Badge>
    );
  };

  const canManageMember = (member: GroupMember) => {
    if (member.userId === currentUserId) return false;
    if (member.role === "OWNER") return false;
    if (currentUserRole === "OWNER") return true;
    if (currentUserRole === "ADMIN" && member.role === "MEMBER") return true;
    return false;
  };

  return (
    <ScrollArea className={cn("h-full", className)}>
      <div className="space-y-2 p-2">
        {members.map((member) => {
          const memberName = member.fullName || member.username;
          const initials = getInitials(memberName);
          const isCurrentUser = member.userId === currentUserId;
          const canManage = canManageMember(member);

          return (
            <div
              key={member.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg",
                "bg-[var(--chat-surface)] border border-[var(--chat-border)]",
                isCurrentUser && "ring-1 ring-[var(--chat-primary)]"
              )}
            >
              {/* Avatar */}
              <Avatar className="h-12 w-12">
                <AvatarImage
                  src={member.profileImage || undefined}
                  alt={memberName}
                />
                <AvatarFallback className="bg-[var(--chat-primary)] text-[var(--chat-messageSentText)]">
                  {initials}
                </AvatarFallback>
              </Avatar>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-[var(--chat-text)] truncate">
                    {memberName}
                    {isCurrentUser && (
                      <span className="text-sm text-[var(--chat-textMuted)] ml-2">
                        (Vous)
                      </span>
                    )}
                  </p>
                  {getRoleIcon(member.role)}
                </div>
                <p className="text-sm text-[var(--chat-textMuted)] truncate">
                  @{member.username}
                </p>
              </div>

              {/* Role Badge */}
              <div className="flex items-center gap-2">
                {getRoleBadge(member.role)}

                {/* Actions Menu */}
                {canManage && canManageMembers && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-9 w-9">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {member.role === "MEMBER" && onPromoteToAdmin && (
                        <DropdownMenuItem
                          onClick={() => onPromoteToAdmin(member.id)}
                        >
                          <Shield className="h-4 w-4 mr-2" />
                          Promouvoir administrateur
                        </DropdownMenuItem>
                      )}
                      {member.role === "ADMIN" &&
                        currentUserRole === "OWNER" &&
                        onDemoteToMember && (
                          <DropdownMenuItem
                            onClick={() => onDemoteToMember(member.id)}
                          >
                            Rétrograder membre
                          </DropdownMenuItem>
                        )}
                      {onRemoveMember && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onRemoveMember(member.id)}
                            className="text-[var(--chat-error)]"
                          >
                            <UserMinus className="h-4 w-4 mr-2" />
                            Retirer du groupe
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
