"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { GitBranch, Users, Swords, Hash, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewMode = "grid" | "list" | "compact";

interface BracketNodeCardProps {
  node: any;
  tournamentId: string;
  editionId: string;
  viewMode?: ViewMode;
  className?: string;
}

export function BracketNodeCard({
  node,
  tournamentId,
  editionId,
  viewMode = "grid",
  className,
}: BracketNodeCardProps) {
  const isGrid = viewMode === "grid";
  const isList = viewMode === "list";
  const isCompact = viewMode === "compact";

  const participants = (node.metadata as any)?.participants || [];
  const matchesCount = node.matchesCount || 0;
  const bracketId = node.id;

  const bracketTypeColor: Record<string, string> = {
    UPPER: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    LOWER: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    FINAL: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    WINNER: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  };

  const typeColor = bracketTypeColor[node.bracketType] || bracketTypeColor.UPPER;
  const detailUrl = `/tournaments/${tournamentId}/editions/${editionId}/dashboard/brackets/${bracketId}`;
  const organizeUrl = `${detailUrl}/organize`;

  if (isCompact) {
    return (
      <Link href={detailUrl}>
        <Card className={cn("hover:border-primary/50 transition-all cursor-pointer group", className)}>
          <CardContent className="p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs transition-colors group-hover:bg-primary group-hover:text-white", typeColor)}>
                {node.nodeCode || "#"}
              </div>
              <div>
                <p className="text-xs font-bold leading-none">{(node.metadata as any)?.name || `Bracket ${bracketId.slice(0, 4)}`}</p>
                <p className="text-[10px] text-muted-foreground mt-1">Round {node.round} • {participants.length} pts</p>
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
            <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center font-black text-lg", typeColor)}>
              {node.nodeCode || "#"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Typography variant="body-base" weight="bold">
                  {(node.metadata as any)?.name || `Bracket #${bracketId.slice(0, 4)}`}
                </Typography>
                <Badge variant="outline" className={cn("text-[9px] uppercase font-bold", typeColor)}>
                  {node.bracketType}
                </Badge>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Hash className="h-3 w-3" /> Round {node.round}
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="h-3 w-3" /> {participants.length} Participants
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Swords className="h-3 w-3" /> {matchesCount} Matches
                </span>
              </div>
            </div>
          </Link>
          <div className="flex items-center gap-2 p-4 border-t md:border-t-0 md:border-l bg-muted/5">
            <Button size="sm" variant="ghost" asChild>
              <Link href={organizeUrl}>
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
              <Badge variant="outline" className={cn("text-[10px] uppercase tracking-wider font-bold", typeColor)}>
                {node.bracketType} Bracket
              </Badge>
              <CardTitle className="text-lg font-bold tracking-tight">
                {(node.metadata as any)?.name || `Bracket #${bracketId.slice(0, 4)}`}
              </CardTitle>
            </div>
            <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center font-bold text-sm", typeColor)}>
              {node.nodeCode || "#"}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase font-bold">Round</p>
              <p className="text-sm font-mono font-bold">#{node.round}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase font-bold">Match Number</p>
              <p className="text-sm font-mono font-bold">#{node.matchNumber}</p>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm py-2 border-y border-border/50">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>Participants</span>
            </div>
            <span className="font-bold">{participants.length}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Swords className="h-4 w-4" />
              <span>Matches</span>
            </div>
            <span className="font-bold">{matchesCount}</span>
          </div>
        </CardContent>
      </Link>
      <div className="p-4 pt-0 flex gap-2">
        <Button variant="outline" size="sm" className="flex-1 text-xs" asChild>
          <Link href={organizeUrl}>
            Organiser
          </Link>
        </Button>
        <Button variant="default" size="sm" className="flex-1 text-xs" asChild>
          <Link href={detailUrl}>
            Voir Détails
          </Link>
        </Button>
      </div>
    </Card>
  );
}
