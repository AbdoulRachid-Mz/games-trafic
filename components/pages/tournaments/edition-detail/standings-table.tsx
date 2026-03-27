"use client";

import React, { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Typography } from "@/components/ui/typography";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Sword, ChevronUp, ChevronDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useScreenSize } from "@/hooks/use-screen";

// ============================================================================
// TYPES
// ============================================================================

export interface StandingRow {
  registrationId: string;
  points: number;
  matchesPlayed: number;
  matchesWon: number;
  matchesDrawn: number;
  matchesLost: number;
  scoreFor: number;
  scoreAgainst: number;
  scoreDifference: number;
  position?: number;
  qualified?: boolean;
  eliminated?: boolean;
  participantName?: string;
  participantImage?: string;
}

export interface StandingGroup {
  groupId: string;
  groupName: string;
  rows: StandingRow[];
}

export interface BracketStandingRow {
  registrationId: string;
  participantName?: string;
  participantImage?: string;
  round: number;
  /** Round reached label: "Finale", "Demi-finale", etc. */
  roundLabel?: string;
  won: boolean;
  eliminated?: boolean;
  position?: number;
}

export interface StandingsTableProps {
  /** mode=group: classement par groupe (défaut) */
  groups?: StandingGroup[];
  /** mode=bracket: progression dans le bracket */
  bracketRows?: BracketStandingRow[];
  /** mode=edition: classement global de l'édition (aggrégation de tous les groupes) */
  registrations?: any[];
  title?: string;
  showFilter?: boolean;
  /** 'group' | 'bracket' | 'edition' */
  mode?: "group" | "bracket" | "edition";
  className?: string;
  currentRegistrationId?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

function getRoundLabel(round: number, maxRound: number): string {
  const diff = maxRound - round;
  if (diff === 0) return "Finale";
  if (diff === 1) return "Demi-finale";
  if (diff === 2) return "Quart de finale";
  if (diff === 3) return "Huitième de finale";
  return `Tour ${round}`;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function StandingsTable({
  groups = [],
  bracketRows = [],
  registrations = [],
  title = "Classement",
  showFilter = true,
  mode = "group",
  className,
  currentRegistrationId,
}: StandingsTableProps) {
  const { isMobile } = useScreenSize();
  const [selectedGroupId, setSelectedGroupId] = useState<string>(
    groups[0]?.groupId || ""
  );

  // ---- GROUP MODE ----
  const activeGroup = useMemo(() => {
    return groups.find((g) => g.groupId === selectedGroupId) || groups[0];
  }, [groups, selectedGroupId]);

  const sortedGroupRows = useMemo(() => {
    if (!activeGroup) return [];
    return [...activeGroup.rows].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.scoreDifference !== a.scoreDifference)
        return b.scoreDifference - a.scoreDifference;
      if (b.matchesWon !== a.matchesWon) return b.matchesWon - a.matchesWon;
      return 0;
    });
  }, [activeGroup]);

  // ---- EDITION MODE (global aggregation) ----
  const editionRows = useMemo<StandingRow[]>(() => {
    if (mode !== "edition" || groups.length === 0) return [];
    const map = new Map<string, StandingRow>();
    for (const group of groups) {
      for (const row of group.rows) {
        const existing = map.get(row.registrationId);
        if (existing) {
          map.set(row.registrationId, {
            ...existing,
            points: existing.points + row.points,
            matchesPlayed: existing.matchesPlayed + row.matchesPlayed,
            matchesWon: existing.matchesWon + row.matchesWon,
            matchesDrawn: existing.matchesDrawn + row.matchesDrawn,
            matchesLost: existing.matchesLost + row.matchesLost,
            scoreFor: existing.scoreFor + row.scoreFor,
            scoreAgainst: existing.scoreAgainst + row.scoreAgainst,
            scoreDifference: existing.scoreDifference + row.scoreDifference,
          });
        } else {
          map.set(row.registrationId, { ...row });
        }
      }
    }
    return [...map.values()].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.scoreDifference !== a.scoreDifference)
        return b.scoreDifference - a.scoreDifference;
      return b.matchesWon - a.matchesWon;
    });
  }, [mode, groups]);

  // ---- BRACKET MODE ----
  const sortedBracketRows = useMemo<BracketStandingRow[]>(() => {
    if (mode !== "bracket" || bracketRows.length === 0) return [];
    const maxRound = Math.max(...bracketRows.map((r) => r.round));
    return [...bracketRows]
      .map((r) => ({
        ...r,
        roundLabel: r.roundLabel || getRoundLabel(r.round, maxRound),
      }))
      .sort((a, b) => b.round - a.round);
  }, [mode, bracketRows]);

  const getParticipantInfo = (registrationId: string, row?: StandingRow | BracketStandingRow) => {
    const reg = registrations.find((r: any) => r.id === registrationId);
    const member = reg?.member;
    const user = member?.user;
    const name =
      (row as StandingRow | BracketStandingRow)?.participantName ||
      member?.displayName ||
      user?.fullName ||
      user?.username ||
      "Joueur";
    const image = (row as StandingRow | BracketStandingRow)?.participantImage || member?.avatar || user?.profileImage;
    return { name, image };
  };

  const renderEmpty = () => (
    <div className="text-center py-12 text-muted-foreground bg-card border rounded-xl">
      Aucun classement disponible.
    </div>
  );

  // ---- BRACKET TABLE ----
  if (mode === "bracket") {
    if (sortedBracketRows.length === 0) return renderEmpty();
    return (
      <div className={cn("space-y-4", className)}>
        {title && (
          <Typography variant="h4" weight="bold">
            {title}
          </Typography>
        )}
        <Card className="overflow-hidden border-none shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-muted-foreground">
                  <th className="text-left p-4 w-12 font-medium">#</th>
                  <th className="text-left p-4 font-medium">Participant</th>
                  <th className="text-center p-4 font-medium">Phase atteinte</th>
                  <th className="text-center p-4 font-medium">Round</th>
                  <th className="text-center p-4 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sortedBracketRows.map((row, idx) => {
                  const { name, image } = getParticipantInfo(
                    row.registrationId,
                    row
                  );
                  return (
                    <tr
                      key={row.registrationId}
                      className={cn("hover:bg-accent/5 transition-colors", currentRegistrationId === row.registrationId && "bg-primary/10 hover:bg-primary/15")}
                    >
                      <td className="p-4 font-bold text-muted-foreground">
                        {row.position || idx + 1}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border-2 border-background ring-2 ring-border">
                            <AvatarImage src={image} />
                            <AvatarFallback className="text-[10px] bg-muted">
                              {name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-bold text-sm whitespace-nowrap">
                            {name}
                          </span>
                          {currentRegistrationId === row.registrationId && (
                            <Badge variant="default" className="ml-2 text-[10px] h-5 px-1.5">Moi</Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            row.won && "border-green-500 text-green-600"
                          )}
                        >
                          {row.roundLabel}
                        </Badge>
                      </td>
                      <td className="p-4 text-center font-medium">
                        {row.round}
                      </td>
                      <td className="p-4 text-center">
                        {row.won ? (
                          <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                            <Trophy className="h-3 w-3 mr-1" />
                            Qualifié
                          </Badge>
                        ) : row.eliminated ? (
                          <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
                            <Sword className="h-3 w-3 mr-1" />
                            Éliminé
                          </Badge>
                        ) : (
                          <Badge variant="secondary">En cours</Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  }

  // ---- EDITION (global) TABLE ----
  if (mode === "edition") {
    if (editionRows.length === 0) return renderEmpty();
    return (
      <div className={cn("space-y-4", className)}>
        {title && (
          <Typography variant="h4" weight="bold">
            {title}
          </Typography>
        )}
        <Card className="overflow-hidden border-none shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-muted-foreground">
                  <th className="text-left p-4 w-12 font-medium">#</th>
                  <th className="text-left p-4 font-medium">Participant</th>
                  <th className="text-center p-4 font-bold text-foreground">Pts</th>
                  {!isMobile && (
                    <>
                      <th className="text-center p-4 font-medium">J</th>
                      <th className="text-center p-4 font-medium">V</th>
                      <th className="text-center p-4 font-medium">N</th>
                      <th className="text-center p-4 font-medium">D</th>
                      <th className="text-center p-4 font-medium">+/-</th>
                      <th className="text-center p-4 font-medium">Diff.</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y">
                {editionRows.map((row, idx) => {
                  const { name, image } = getParticipantInfo(
                    row.registrationId,
                    row
                  );
                  return (
                    <tr
                      key={row.registrationId}
                      className={cn(
                        "hover:bg-accent/5 transition-colors",
                        idx === 0 && "bg-yellow-500/5",
                        currentRegistrationId === row.registrationId && "bg-primary/10 hover:bg-primary/15"
                      )}
                    >
                      <td className="p-4 font-bold text-muted-foreground">
                        {row.position || idx + 1}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {idx === 0 && (
                            <Trophy className="h-4 w-4 text-yellow-500 shrink-0" />
                          )}
                          <Avatar className="h-9 w-9 border-2 border-background ring-2 ring-border">
                            <AvatarImage src={image} />
                            <AvatarFallback className="text-[10px] bg-muted">
                              {name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm whitespace-nowrap">
                                {name}
                              </span>
                              {currentRegistrationId === row.registrationId && (
                                <Badge variant="default" className="text-[10px] h-5 px-1.5 leading-none">Moi</Badge>
                              )}
                            </div>
                            {row.qualified && (
                              <span className="text-[10px] text-green-600 font-medium leading-none">
                                Qualifié
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-black">
                          {row.points}
                        </span>
                      </td>
                      {!isMobile && (
                        <>
                          <td className="p-4 text-center font-medium">{row.matchesPlayed}</td>
                          <td className="p-4 text-center text-green-600">{row.matchesWon}</td>
                          <td className="p-4 text-center text-amber-600">{row.matchesDrawn}</td>
                          <td className="p-4 text-center text-destructive">{row.matchesLost}</td>
                          <td className="p-4 text-center text-muted-foreground tabular-nums">
                            {row.scoreFor}/{row.scoreAgainst}
                          </td>
                          <td className="p-4 text-center font-bold">
                            {row.scoreDifference > 0
                              ? `+${row.scoreDifference}`
                              : row.scoreDifference}
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  }

  // ---- GROUP TABLE (default mode) ----
  if (!activeGroup) return renderEmpty();

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {title && (
          <Typography variant="h4" weight="bold">
            {title}
          </Typography>
        )}
        {showFilter && groups.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Groupe :</span>
            <Select
              value={selectedGroupId}
              onValueChange={setSelectedGroupId}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Choisir un groupe" />
              </SelectTrigger>
              <SelectContent>
                {groups.map((group) => (
                  <SelectItem key={group.groupId} value={group.groupId}>
                    {group.groupName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <Card className="overflow-hidden border-none shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-muted-foreground">
                <th className="text-left p-4 w-12 font-medium">#</th>
                <th className="text-left p-4 font-medium">Participant</th>
                <th className="text-center p-4 font-bold text-foreground">Pts</th>
                {!isMobile && (
                  <>
                    <th className="text-center p-4 font-medium">J</th>
                    <th className="text-center p-4 font-medium">V</th>
                    <th className="text-center p-4 font-medium">N</th>
                    <th className="text-center p-4 font-medium">D</th>
                    <th className="text-center p-4 font-medium">+/-</th>
                    <th className="text-center p-4 font-medium">Diff.</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y">
              {sortedGroupRows.map((row, idx) => {
                const { name, image } = getParticipantInfo(
                  row.registrationId,
                  row
                );
                return (
                  <tr
                    key={row.registrationId}
                    className={cn(
                      "hover:bg-accent/5 transition-colors",
                      row.qualified && "bg-green-500/5",
                      currentRegistrationId === row.registrationId && "bg-primary/10 hover:bg-primary/15"
                    )}
                  >
                    <td className="p-4 font-bold text-muted-foreground whitespace-nowrap">
                      {row.position || idx + 1}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border-2 border-background ring-2 ring-border">
                          <AvatarImage src={image} />
                          <AvatarFallback className="text-[10px] bg-muted">
                            {name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm whitespace-nowrap">
                              {name}
                            </span>
                            {currentRegistrationId === row.registrationId && (
                              <Badge variant="default" className="text-[10px] h-5 px-1.5 leading-none">Moi</Badge>
                            )}
                          </div>
                          {row.qualified && (
                            <span className="text-[10px] text-green-600 font-medium leading-none">
                              Qualifié
                            </span>
                          )}
                          {row.eliminated && (
                            <span className="text-[10px] text-destructive font-medium leading-none">
                              Éliminé
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-black">
                        {row.points}
                      </span>
                    </td>
                    {!isMobile && (
                      <>
                        <td className="p-4 text-center font-medium">{row.matchesPlayed}</td>
                        <td className="p-4 text-center text-green-600">{row.matchesWon}</td>
                        <td className="p-4 text-center text-amber-600">{row.matchesDrawn}</td>
                        <td className="p-4 text-center text-destructive">{row.matchesLost}</td>
                        <td className="p-4 text-center text-muted-foreground tabular-nums">
                          {row.scoreFor}/{row.scoreAgainst}
                        </td>
                        <td className="p-4 text-center font-bold">
                          {row.scoreDifference > 0
                            ? `+${row.scoreDifference}`
                            : row.scoreDifference}
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
