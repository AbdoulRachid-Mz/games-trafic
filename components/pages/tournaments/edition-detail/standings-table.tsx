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
import { Trophy, Sword, ChevronUp, ChevronDown, Minus, Download, FileSpreadsheet, FileJson, FileText, File, Swords } from "lucide-react";
import { cn } from "@/lib/utils";
import { useScreenSize } from "@/hooks/use-screen";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { exportData, createExportData, type ExportFormat } from "@/utils/export-utils";

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

  const handleExport = async (format: ExportFormat) => {
    let exportRows: any[] = [];
    let fileName = "classement";

    if (mode === "group" && activeGroup) {
      exportRows = sortedGroupRows.map((row, idx) => ({
        ...row,
        position: row.position || idx + 1,
        participantName: getParticipantInfo(row.registrationId, row).name,
        status: row.qualified ? "Qualifié" : row.eliminated ? "Éliminé" : "En cours",
      }));
      fileName = `classement_${activeGroup.groupName.replace(/\s+/g, "_")}`;
    } else if (mode === "edition") {
      exportRows = editionRows.map((row, idx) => ({
        ...row,
        position: row.position || idx + 1,
        participantName: getParticipantInfo(row.registrationId, row).name,
        status: row.qualified ? "Qualifié" : "En cours",
      }));
      fileName = "classement_general";
    } else if (mode === "bracket") {
       exportRows = sortedBracketRows.map((row, idx) => ({
        position: row.position || idx + 1,
        participantName: getParticipantInfo(row.registrationId, row).name,
        round: row.round,
        roundLabel: row.roundLabel,
        status: row.won ? "Qualifié" : row.eliminated ? "Éliminé" : "En cours",
      }));
      fileName = "classement_phases_finales";
    }

    const config = {
      filename: fileName,
      title: title || "Classement du Tournoi",
      subtitle: mode === "group" ? `Groupe: ${activeGroup?.groupName}` : mode === "edition" ? "Classement Général" : "Phases Finales",
      header: {
        title: "Game Trafics",
        subtitle: "Export du classement automatique",
      }
    };

    const tableData = createExportData(exportRows, "standings");
    await exportData(format, tableData, config);
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
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {title && (
          <Typography variant="h4" weight="bold">
            {title}
          </Typography>
        )}
        
        {showFilter && mode === "group" && groups.length > 1 && (
          <div className="flex items-center gap-2">
            <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Choisir un groupe" />
              </SelectTrigger>
              <SelectContent>
                {groups.map((g) => (
                  <SelectItem key={g.groupId} value={g.groupId}>
                    {g.groupName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              {isMobile ? "" : "Exporter"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Format d'export</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleExport("excel")}>
              <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />
              Excel (XLSX)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("csv")}>
              <FileText className="h-4 w-4 mr-2 text-blue-600" />
              CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("json")}>
              <FileJson className="h-4 w-4 mr-2 text-orange-500" />
              JSON
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("pdf")}>
              <File className="h-4 w-4 mr-2 text-red-500" />
              PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Card className="overflow-hidden border-border/50 shadow-2xl relative">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
           <Trophy className="h-64 w-64 rotate-12" />
        </div>
        <div className="overflow-x-auto relative z-10">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-white/5">
              <tr className="text-muted-foreground">
                <th className="text-left p-4 w-12 font-black uppercase tracking-tighter italic">#</th>
                <th className="text-left p-4 font-black uppercase tracking-tighter italic">Guerrier</th>
                <th className="text-center p-4 font-black text-foreground uppercase tracking-widest bg-primary/5">Pts</th>
                {!isMobile && (
                  <>
                    <th className="text-center p-4 font-medium uppercase text-[10px] tracking-[0.2em]">J</th>
                    <th className="text-center p-4 font-medium uppercase text-[10px] tracking-[0.2em]">V</th>
                    <th className="text-center p-4 font-medium uppercase text-[10px] tracking-[0.2em]">N</th>
                    <th className="text-center p-4 font-medium uppercase text-[10px] tracking-[0.2em]">D</th>
                    <th className="text-center p-4 font-medium uppercase text-[10px] tracking-[0.2em]">Buts</th>
                    <th className="text-center p-4 font-medium uppercase text-[10px] tracking-[0.2em]">Diff</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-background/50 backdrop-blur-sm">
              {sortedGroupRows.map((row, idx) => {
                const { name, image } = getParticipantInfo(
                  row.registrationId,
                  row
                );
                return (
                  <tr
                    key={row.registrationId}
                    className={cn(
                      "hover:bg-primary/[0.03] transition-all group",
                      row.qualified && "bg-green-500/[0.02]",
                      currentRegistrationId === row.registrationId && "bg-primary/10 hover:bg-primary/15"
                    )}
                  >
                    <td className="p-4 font-black italic text-muted-foreground/50 whitespace-nowrap group-hover:text-primary transition-colors">
                      {row.position || idx + 1}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                           <Avatar className="h-11 w-11 border-2 border-background ring-4 ring-muted transition-all group-hover:ring-primary/20">
                             <AvatarImage src={image} />
                             <AvatarFallback className="text-[10px] font-black bg-muted">
                               {name.substring(0, 2).toUpperCase()}
                             </AvatarFallback>
                           </Avatar>
                           {idx === 0 && (
                             <div className="absolute -top-2 -left-2 bg-yellow-500 rounded-full p-1 shadow-lg ring-2 ring-background animate-bounce">
                               <Trophy className="h-3 w-3 text-black" />
                             </div>
                           )}
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-base uppercase tracking-tighter italic group-hover:text-primary transition-colors">
                              {name}
                            </span>
                            {currentRegistrationId === row.registrationId && (
                              <Badge className="bg-primary/20 text-primary border-primary/20 text-[10px] h-5 px-2 font-black uppercase italic">Moi</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {row.qualified && (
                              <span className="text-[10px] bg-green-500/10 text-green-500 px-1.5 py-0.5 rounded-md font-black uppercase tracking-widest border border-green-500/20">
                                Qualifié
                              </span>
                            )}
                            {row.eliminated && (
                              <span className="text-[10px] bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded-md font-black uppercase tracking-widest border border-red-500/20">
                                Éliminé
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center bg-primary/[0.02]">
                      <span className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-primary text-white font-black italic text-lg shadow-lg shadow-primary/30 transform group-hover:scale-110 transition-transform">
                        {row.points}
                      </span>
                    </td>
                    {!isMobile && (
                      <>
                        <td className="p-4 text-center font-bold text-muted-foreground">{row.matchesPlayed}</td>
                        <td className="p-4 text-center">
                           <Badge variant="outline" className="bg-green-500/5 text-green-500 border-green-500/20 font-black">{row.matchesWon}</Badge>
                        </td>
                        <td className="p-4 text-center">
                           <Badge variant="outline" className="bg-amber-500/5 text-amber-500 border-amber-500/20 font-black">{row.matchesDrawn}</Badge>
                        </td>
                        <td className="p-4 text-center">
                           <Badge variant="outline" className="bg-red-500/5 text-red-500 border-red-500/20 font-black">{row.matchesLost}</Badge>
                        </td>
                        <td className="p-4 text-center font-bold text-muted-foreground tabular-nums">
                          <span className="text-green-500">{row.scoreFor}</span>
                          <span className="opacity-30 mx-1">/</span>
                          <span className="text-red-400">{row.scoreAgainst}</span>
                        </td>
                        <td className="p-4 text-center">
                          <span className={cn(
                            "font-black italic px-2 py-1 rounded-lg text-sm",
                            row.scoreDifference > 0 ? "bg-green-500/10 text-green-500" : 
                            row.scoreDifference < 0 ? "bg-red-500/10 text-red-500" : "bg-muted text-muted-foreground"
                          )}>
                            {row.scoreDifference > 0 ? `+${row.scoreDifference}` : row.scoreDifference}
                          </span>
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
