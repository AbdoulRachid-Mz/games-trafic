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

export type ViewMode = "grid" | "list" | "compact";

interface GroupCardProps {
  group: any;
  tournamentId: string;
  editionId: string;
  viewMode?: ViewMode;
  className?: string;
}

export function GroupCard({
  group,
  tournamentId,
  editionId,
  viewMode = "grid",
  className,
}: GroupCardProps) {
  const isGrid = viewMode === "grid";
  const isList = viewMode === "list";
  const isCompact = viewMode === "compact";

  const detailUrl = `/tournaments/${tournamentId}/editions/${editionId}/dashboard/groups/${group.id}`;
  const participantCount = group.participantCount || group.participants?.length || 0;

  if (isCompact) {
    return (
      <Link href={detailUrl}>
        <Card className={cn("hover:border-primary/50 transition-all cursor-pointer group", className)}>
          <CardContent className="p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-xs text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                G{group.order + 1}
              </div>
              <div>
                <p className="text-xs font-bold leading-none">{group.name}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{participantCount} participants</p>
              </div>
            </div>
            <ArrowRight className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
          </CardContent>
        </Card>
      </Link>
    );
  }

  if (isList) {
    return (
      <Card className={cn("hover:border-primary/50 transition-all group overflow-hidden", className)}>
        <CardContent className="p-0 flex flex-col md:flex-row md:items-center justify-between">
          <Link href={detailUrl} className="p-4 flex-1 flex items-center gap-4 hover:bg-muted/30 transition-colors">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center font-black text-lg text-primary">
              G{group.order + 1}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Typography variant="body-base" weight="bold">
                  {group.name}
                </Typography>
                <Badge variant="outline" className="text-[9px] uppercase font-bold">
                  {group.phaseName}
                </Badge>
                {group.isLocked && <Lock className="h-3 w-3 text-amber-500" />}
                {group.isCompleted && <CheckCircle2 className="h-3 w-3 text-emerald-500" />}
              </div>
              <div className="flex items-center gap-3 mt-1">
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
          </Link>
          <div className="flex items-center gap-2 p-4 border-t md:border-t-0 md:border-l bg-muted/5">
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
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden group hover:border-primary/50 transition-all duration-200 hover:shadow-md flex flex-col", className)}>
      <Link href={detailUrl} className="flex-1 block">
        <CardHeader className="pb-2 border-b bg-muted/30 group-hover:bg-muted/50 transition-colors">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-bold">
                {group.phaseName}
              </Badge>
              <CardTitle className="text-lg font-bold tracking-tight">
                {group.name}
              </CardTitle>
            </div>
            <div className="flex gap-1">
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
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
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
      </Link>
      <div className="p-4 pt-0 flex gap-2">
        <Button variant="outline" size="sm" className="flex-1 text-xs gap-1.5" asChild>
          <Link href={detailUrl}>
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