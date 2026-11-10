// @/components/cards/group-card.tsx
"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  Users, 
  Trophy, 
  LayoutGrid, 
  Lock, 
  CheckCircle2, 
  ArrowRight, 
  Settings2 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { isMatchdayGroup } from "@/lib/tournaments/config";
import { BaseCardProps, CardActionMenu, extraActionsProps } from "./card-action-menu";
import { useRouter } from "next/navigation";

export interface GroupCardProps extends BaseCardProps<any> {
  tournamentId: string;
  editionId: string;
  onManageGroup?: (item: any) => void;
}

export function GroupCard({
  item: group,
  viewMode = "grid",
  status,
  isCliquable = true,
  isMini = false,
  activeAction = "view",
  onEdit,
  onView,
  onDelete,
  onManageGroup,
  tournamentId,
  editionId,
  className,
}: GroupCardProps) {
  const isGrid = viewMode === "grid";
  const isList = viewMode === "list";
  const isCompact = viewMode === "compact" || isMini;
  const router = useRouter();

  const detailUrl = `/tournaments/${tournamentId}/editions/${editionId}/dashboard/groups/${group.id}`;
  const participantCount = group.participantCount || group.participants?.length || 0;

  // RR refondu : ce « groupe » est en réalité une journée du championnat.
  const isMatchday = isMatchdayGroup((group.config as any) || null);
  const matchdayNumber = isMatchday ? ((group.config as any)?.dayNumber ?? null) : null;

  const handleView = () => {
    if (onView) onView(group);
    else router.push(detailUrl);
  };

  const handleMainAction = () => {
    if (!isCliquable) return;
    if (activeAction === "view") handleView();
    else if (activeAction === "edit" && onEdit) onEdit(group);
    else if (activeAction === "delete" && onDelete) onDelete(group);
    else handleView();
  };

  const extraActions: extraActionsProps[] = [
    {
      id: "details",
      label: "Détails",
      icon: ArrowRight,
      onClick: handleView
    },
    {
      id: "manage",
      label: "Gérer",
      icon: Settings2,
      onClick: () => {
        if (onManageGroup) onManageGroup(group);
        else router.push(`${detailUrl}/organize`);
      }
    }
  ];

  const hasActions = onEdit || onView || onDelete || extraActions.length > 0;

  if (isCompact) {
    return (
      <Card 
        className={cn("hover:border-primary/50 transition-all cursor-pointer group relative overflow-hidden", className)}
        onClick={handleMainAction}
      >
        <CardContent className="p-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-xs text-primary group-hover:bg-primary group-hover:text-white transition-colors shrink-0">
              G{group.order + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 flex-wrap">
                <p className="text-xs font-bold leading-none truncate">{group.name}</p>
                {isMatchday && (
                  <Badge variant="outline" className="text-[8px] px-1 py-0 border-primary/30 text-primary">
                    J{matchdayNumber ?? group.order + 1}
                  </Badge>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">{participantCount} participants</p>
            </div>
          </div>
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            {hasActions && (
              <CardActionMenu
                onEdit={onEdit ? () => onEdit(group) : undefined}
                onView={onView ? () => onView(group) : undefined}
                onDelete={onDelete ? () => onDelete(group) : undefined}
                entityName={`le groupe ${group.name}`}
                extraActions={extraActions}
              />
            )}
            <ArrowRight className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isList) {
    return (
      <Card className={cn("hover:border-primary/50 transition-all group overflow-hidden relative", className)}>
        <CardContent className="p-0 flex flex-col md:flex-row md:items-center justify-between">
          <div 
            onClick={handleMainAction}
            className="p-4 flex-1 flex items-center gap-4 hover:bg-muted/30 transition-colors cursor-pointer"
          >
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center font-black text-lg text-primary shrink-0">
              G{group.order + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Typography variant="body-base" weight="bold" className="truncate">
                  {group.name}
                </Typography>
                <Badge variant="outline" className="text-[9px] uppercase font-bold">
                  {group.phaseName}
                </Badge>
                {isMatchday && (
                  <Badge variant="outline" className="text-[9px] font-bold border-primary/30 text-primary">
                    Journée {matchdayNumber ?? group.order + 1}
                  </Badge>
                )}
                {group.isLocked && <Lock className="h-3 w-3 text-amber-500 shrink-0" />}
                {group.isCompleted && <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />}
              </div>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="h-3 w-3" /> {participantCount} Participants
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Trophy className="h-3 w-3" /> {group.groupType || "STANDARD"}
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <LayoutGrid className="h-3 w-3" /> Ordre {group.order + 1}
                </span>
              </div>
            </div>
          </div>
          <div 
            className="flex items-center gap-2 p-4 border-t md:border-t-0 md:border-l bg-muted/5 justify-end"
            onClick={(e) => e.stopPropagation()}
          >
            <Button size="sm" variant="ghost" asChild>
              <Link href={`${detailUrl}/organize`}>
                Gérer
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link href={detailUrl}>
                Détails
              </Link>
            </Button>
            {hasActions && (
              <CardActionMenu
                onEdit={onEdit ? () => onEdit(group) : undefined}
                onView={onView ? () => onView(group) : undefined}
                onDelete={onDelete ? () => onDelete(group) : undefined}
                entityName={`le groupe ${group.name}`}
                extraActions={extraActions}
              />
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={cn("overflow-hidden group hover:border-primary/50 transition-all duration-200 hover:shadow-md flex flex-col relative", isCliquable && "cursor-pointer active:scale-[0.99]", className)}
      onClick={handleMainAction}
    >
      <CardHeader className="pb-2 border-b bg-muted/30 group-hover:bg-muted/50 transition-colors">
        <div className="flex justify-between items-start gap-2">
          <div className="space-y-1 min-w-0">
            <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-bold">
              {group.phaseName}
            </Badge>
            {isMatchday && (
              <Badge variant="outline" className="text-[10px] tracking-wider font-bold w-fit border-primary/30 text-primary">
                Journée {matchdayNumber ?? group.order + 1}
              </Badge>
            )}
            <CardTitle className="text-lg font-bold tracking-tight truncate">
              {group.name}
            </CardTitle>
          </div>
          <div className="flex gap-1 items-center shrink-0" onClick={(e) => e.stopPropagation()}>
            {group.isLocked && (
              <div className="h-6 w-6 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Lock className="h-3 w-3 text-amber-500" />
              </div>
            )}
            {group.isCompleted && (
              <div className="h-6 w-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              </div>
            )}
            {hasActions && (
              <CardActionMenu
                onEdit={onEdit ? () => onEdit(group) : undefined}
                onView={onView ? () => onView(group) : undefined}
                onDelete={onDelete ? () => onDelete(group) : undefined}
                entityName={`le groupe ${group.name}`}
                extraActions={extraActions}
              />
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-4 space-y-4 flex-1">
        <div className="flex items-center justify-between text-sm py-2 border-b border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>Participants</span>
          </div>
          <span className="font-bold">{participantCount}</span>
        </div>

        <div className="flex items-center justify-between text-sm py-2 border-b border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Trophy className="h-4 w-4" />
            <span>Type</span>
          </div>
          <Badge variant="secondary" className="text-[10px] uppercase">
            {group.groupType || "STANDARD"}
          </Badge>
        </div>

        <div className="flex items-center justify-between text-sm py-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <LayoutGrid className="h-4 w-4" />
            <span>Ordre</span>
          </div>
          <span className="font-mono text-sm">#{group.order + 1}</span>
        </div>
      </CardContent>
      
      <div 
        className="p-4 pt-0 flex gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        <Button variant="outline" size="sm" className="flex-1 text-xs gap-1.5" asChild>
          <Link href={`${detailUrl}/organize`}>
            <Settings2 className="h-3.5 w-3.5" /> Gérer
          </Link>
        </Button>
        <Button variant="default" size="sm" className="flex-1 text-xs gap-1.5" asChild>
          <Link href={detailUrl}>
            <ArrowRight className="h-3.5 w-3.5" /> Détails
          </Link>
        </Button>
      </div>
    </Card>
  );
}