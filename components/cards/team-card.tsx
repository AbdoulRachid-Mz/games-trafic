// @/components/cards/team-card.tsx
"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Crown } from "lucide-react";
import { TeamWithRelations } from "@/database/schema";
import { BaseCardProps, CardActionMenu, extraActionsProps } from "./card-action-menu";
import { cn } from "@/lib/utils";

export interface TeamCardProps extends BaseCardProps<TeamWithRelations> {
  userDisplay?: "admin" | "organizer" | "member";
  onViewReset?: (item: TeamWithRelations) => void;
}

export function TeamCard({
  item: team,
  viewMode = "grid",
  status,
  isCliquable = true,
  isMini = false,
  activeAction = "view",
  onEdit,
  onView,
  onDelete,
  onViewReset,
  userDisplay = "member",
  className,
}: TeamCardProps) {
  const memberCount = team.currentSquadSize || 0;
  const captainName = team.captain?.username || "N/A";
  const isListView = viewMode === "list";

  const handleView = () => {
    if (onView) onView(team);
    else if (onViewReset) onViewReset(team);
  };

  const handleMainAction = () => {
    if (!isCliquable) return;
    if (activeAction === "view") handleView();
    else if (activeAction === "edit" && onEdit) onEdit(team);
    else if (activeAction === "delete" && onDelete) onDelete(team);
    else handleView();
  };

  const extraActions = [];
  if (onViewReset) {
    extraActions.push({
      id: "view-reset",
      label: "Voir détails",
      icon: Users,
      onClick: () => onViewReset(team)
    });
  }

  const hasActions = onEdit || onView || onDelete || extraActions.length > 0;

  if (isListView) {
    return (
      <div 
        className={cn(
          "flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors group relative overflow-hidden",
          isCliquable && "cursor-pointer active:scale-[0.99]",
          className
        )}
        onClick={handleMainAction}
      >
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12 rounded-lg border bg-muted">
            <AvatarImage
              src={team.logo || undefined}
              alt={team.name}
              className="object-cover"
            />
            <AvatarFallback className="rounded-lg">
              {team.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-bold text-lg">{team.name}</div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Crown className="w-3 h-3 text-amber-500" />
                {captainName}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {memberCount} membres
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <span className="text-xs text-muted-foreground hidden sm:inline-block mr-4">
            Créée le {team.createdAt ? new Date(team.createdAt).toLocaleDateString() : "N/A"}
          </span>
          {hasActions && (
            <CardActionMenu
              onEdit={onEdit ? () => onEdit(team) : undefined}
              onView={onView ? () => onView(team) : undefined}
              onDelete={onDelete ? () => onDelete(team) : undefined}
              entityName={`l'équipe ${team.name}`}
              extraActions={extraActions}
            />
          )}
        </div>
      </div>
    );
  }

  // Grid View
  return (
    <Card 
      className={cn(
        "overflow-hidden hover:shadow-md transition-shadow group relative flex flex-col",
        isCliquable && "cursor-pointer active:scale-[0.99]",
        className
      )}
      onClick={handleMainAction}
    >
      {/* Banner/Header Pattern */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary/50 to-purple-500/50" />

      <CardContent className="p-6 flex flex-col gap-4 h-full flex-1">
        <div className="flex justify-between items-start">
          <Avatar className="h-14 w-14 rounded-xl border-2 border-background shadow-sm bg-muted">
            <AvatarImage
              src={team.logo || undefined}
              alt={team.name}
              className="object-cover"
            />
            <AvatarFallback className="rounded-xl text-lg font-bold">
              {team.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {hasActions && (
            <div onClick={(e) => e.stopPropagation()}>
              <CardActionMenu
                onEdit={onEdit ? () => onEdit(team) : undefined}
                onView={onView ? () => onView(team) : undefined}
                onDelete={onDelete ? () => onDelete(team) : undefined}
                entityName={`l'équipe ${team.name}`}
                extraActions={extraActions}
              />
            </div>
          )}
        </div>

        <div>
          <h3
            className="font-bold text-lg leading-tight mb-1 truncate"
            title={team.name}
          >
            {team.name}
          </h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Crown className="w-3 h-3 text-amber-500 shrink-0" />
            <span className="truncate">Cap: {captainName}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-auto pt-4 border-t">
          <Badge variant="secondary" className="gap-1">
            <Users className="w-3 h-3" />
            {memberCount}
          </Badge>
          <div className="text-xs text-muted-foreground ml-auto">
            {team.createdAt ? new Date(team.createdAt).toLocaleDateString() : "N/A"}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
