// app/tournaments/[tournamentId]/editions/[editionId]/dashboard/groups/[groupId]/GroupDetailClient.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import Link from "next/link";
import { DynamicActionMenu, MenuItemAction } from "@/components/shared/dynamic-action-menu";
import { GroupParticipantsManagement } from "@/components/pages/tournaments/edition-detail/group-participants-management";
import type { PhaseGroupParticipant } from "@/database/schema";
import {
  ArrowLeft,
  Trophy,
  Swords,
  Trash2,
  Lock,
  RefreshCcw,
  Settings,
  Users,
} from "lucide-react";
import { GenerateGroupMatchesDialog } from "@/components/pages/tournaments/edition-detail/generate-group-matches-dialog";
import { CreateBracketNodeDialog } from "@/components/pages/tournaments/edition-detail/create-bracket-node-dialog";
import { UpdateBracketNodeDialog } from "@/components/pages/tournaments/edition-detail/update-bracket-node-dialog";
import { UpdatePhaseGroupDialog } from "@/components/pages/tournaments/edition-detail/update-phase-group-dialog";
import { MarkCompleteDialog } from "@/components/pages/tournaments/edition-detail/mark-complete-dialog";

function getName(registrationId: string | null | undefined, allRegs: any[]) {
  const reg = allRegs.find((r: any) => r.id === registrationId);
  return (
    reg?.member?.displayName ||
    reg?.member?.user?.username ||
    reg?.member?.team?.name ||
    "Joueur"
  );
}

interface BracketNode {
  id: string;
  nodeCode: string;
  round: number;
  matchNumber: number;
  bracketType: string;
  metadata?: any;
}

interface GroupDetailClientProps {
  tournamentId: string;
  editionId: string;
  groupId: string;
  group: any;
  participants: PhaseGroupParticipant[];
  allRegs: any[];
  qualifiedByPhase: Record<string, { name: string; registrationIds: string[] }>;
  participantSource: string;
  nodes: BracketNode[];
  basePath: string;
  totalMatches: number;
}

export function GroupDetailClient({
  tournamentId,
  editionId,
  groupId,
  group,
  participants,
  allRegs,
  qualifiedByPhase,
  participantSource,
  nodes,
  basePath,
  totalMatches,
}: GroupDetailClientProps) {
  // Sort by points DESC, then goal diff, then goals scored
  const standings = [...participants].sort((a, b) => {
    const pDiff = (b.points ?? 0) - (a.points ?? 0);
    if (pDiff !== 0) return pDiff;
    const bDiff = (b.scoreFor ?? 0) - (b.scoreAgainst ?? 0);
    const aDiff = (a.scoreFor ?? 0) - (a.scoreAgainst ?? 0);
    const gdDiff = bDiff - aDiff;
    if (gdDiff !== 0) return gdDiff;
    return (b.scoreFor ?? 0) - (a.scoreFor ?? 0);
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col flex-wrap sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3 flex-wrap">
            <Typography variant="h2" weight="bold" className="tracking-tight">
              {group?.name || "Groupe"}
            </Typography>
            <div className="flex gap-1.5">
              <Badge
                variant="outline"
                className="text-xs font-semibold px-2 py-0.5 border-primary/20 bg-primary/5 text-primary"
              >
                Ordre {group?.order}
              </Badge>
              {group?.isLocked && (
                <Badge className="bg-amber-100 text-amber-900 border-amber-200 text-xs gap-1 py-0.5">
                  <Lock className="h-3 w-3" /> Verrouillé
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-primary/60" />
              <span>
                {participants.length} Participant
                {participants.length > 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Swords className="h-4 w-4 text-primary/60" />
              <span>
                {Math.round(totalMatches)} Match{totalMatches > 1 ? "s" : ""}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link
                href={`/tournaments/${tournamentId}/editions/${editionId}/dashboard/phases/${group?.phaseId}`}
              >
                <ArrowLeft className="h-4 w-4 mr-1" /> Retour
              </Link>
            </Button>
          </div>
        </div>
        <div className="flex items-center flex-wrap gap-2 w-full justify-end">
          <DynamicActionMenu 
            variant="floating"
            floatingPosition="bottom-8 right-8"
            actions={[
              {
                id: "generate-matches",
                paramKey: "action",
                paramValue: "generate-matches",
                label: "Générer les matchs",
                icon: Swords,
                variant: "default",
                overlayType: "dialog",
                renderContent: (
                  <GenerateGroupMatchesDialog
                    groupId={groupId}
                    editionId={editionId}
                    phaseId={group?.phaseId || ""}
                    maxMatches={100}
                    existingMatchesCount={Math.round(totalMatches)}
                    groupConfig={{
                      maxParticipants: group?.participantCount || 8,
                      matchesPerParticipant: (group?.config as any)?.matchesPerParticipant || 1,
                    }}
                    asFormOnly
                  />
                )
              },
              {
                id: "organize-nodes",
                paramKey: "action",
                paramValue: "organize",
                label: "Organiser les Nœuds",
                icon: Settings,
                variant: "outline",
                href: `${basePath}/organize`
              },
              {
                id: "update-group",
                paramKey: "action",
                paramValue: "update-group",
                label: "Modifier le groupe",
                icon: Settings,
                variant: "outline",
                overlayType: "dialog",
                renderContent: group ? <UpdatePhaseGroupDialog group={group} asFormOnly /> : <></>
              },
              ...((!group?.isCompleted ? [{
                id: "mark-complete",
                paramKey: "action",
                paramValue: "mark-complete",
                label: "Marquer comme terminé",
                icon: RefreshCcw,
                variant: "default",
                overlayType: "dialog",
                renderContent: (
                  <MarkCompleteDialog
                    type="GROUP"
                    id={groupId}
                    name={group?.name || "Groupe"}
                    asFormOnly
                  />
                )
              }] : []) as MenuItemAction[])
            ]}
          />
        </div>
      </div>

      {/* Standings Table */}
      <Card className="border-none shadow-md bg-gradient-to-br from-card to-card/95">
        <CardHeader className="pb-4 border-b border-primary/10">
          <CardTitle className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Trophy className="h-4 w-4 text-amber-500" />
            </div>
            <span>Classement du groupe</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-primary/10">
                  <TableHead className="w-12 text-center font-bold">#</TableHead>
                  <TableHead className="font-bold">Joueur</TableHead>
                  <TableHead className="text-center w-14 font-bold text-primary">Pts</TableHead>
                  <TableHead className="text-center w-12 text-xs font-medium uppercase tracking-wider">J</TableHead>
                  <TableHead className="text-center w-12 text-xs font-medium uppercase tracking-wider text-green-600">G</TableHead>
                  <TableHead className="text-center w-12 text-xs font-medium uppercase tracking-wider text-amber-600">N</TableHead>
                  <TableHead className="text-center w-12 text-xs font-medium uppercase tracking-wider text-red-600">P</TableHead>
                  <TableHead className="text-center w-16 text-xs font-medium uppercase tracking-wider">Diff</TableHead>
                  <TableHead className="text-right w-24">Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {standings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-muted-foreground italic">
                      En attente de participants...
                    </TableCell>
                  </TableRow>
                ) : (
                  standings.map((p, idx) => {
                    const diff = (p.scoreFor ?? 0) - (p.scoreAgainst ?? 0);
                    const isTop = idx < ((group?.config as any)?.advanceCount || 2);
                    return (
                      <TableRow
                        key={p.id}
                        className={`group transition-colors ${p.qualified ? "bg-green-500/5 hover:bg-green-500/10" : "hover:bg-primary/5"}`}
                      >
                        <TableCell className="text-center">
                          <span
                            className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${idx === 0 ? "bg-amber-500 text-white" : idx === 1 ? "bg-slate-400 text-white" : idx === 2 ? "bg-amber-700 text-white" : "text-muted-foreground"}`}
                          >
                            {idx + 1}
                          </span>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {getName(p.registrationId, allRegs)}
                        </TableCell>
                        <TableCell className="text-center font-black text-primary text-base">
                          {p.points ?? 0}
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {p.matchesPlayed ?? 0}
                        </TableCell>
                        <TableCell className="text-center text-green-600 font-medium">
                          {p.matchesWon ?? 0}
                        </TableCell>
                        <TableCell className="text-center text-amber-600 font-medium">
                          {p.matchesDrawn ?? 0}
                        </TableCell>
                        <TableCell className="text-center text-red-600 font-medium">
                          {p.matchesLost ?? 0}
                        </TableCell>
                        <TableCell className={`text-center font-bold ${diff > 0 ? "text-green-600" : diff < 0 ? "text-red-600" : ""}`}>
                          {diff > 0 ? `+${diff}` : diff}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {p.qualified ? (
                            <Badge className="bg-green-500 hover:bg-green-600 border-none px-2 py-0.5 animate-pulse text-[10px] uppercase tracking-tighter">
                              Qualifié
                            </Badge>
                          ) : isTop ? (
                            <Badge variant="outline" className="border-blue-500/30 bg-blue-500/5 text-blue-600 text-[10px] uppercase tracking-tighter">
                              En zone Q
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground/50">En attente</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6">
        {/* Participants Management */}
        <GroupParticipantsManagement
          groupId={groupId}
          editionId={editionId}
          allEditionRegistrations={allRegs}
          groupParticipants={participants}
          maxParticipants={group?.participantCount || 0}
          previousPhasesData={qualifiedByPhase}
          defaultSource={participantSource}
        />

        {/* Bracket Nodes */}
        <Card className="border-none shadow-md overflow-hidden flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-4 bg-muted/30 border-b border-primary/5">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <RefreshCcw className="h-4 w-4 text-primary" /> Nœuds de bracket
            </CardTitle>
            <CreateBracketNodeDialog
              phaseId={group?.phaseId || ""}
              groupId={groupId}
              groupOrder={group?.order || 0}
            />
          </CardHeader>
          <CardContent className="pt-4 flex-1">
            <div className="space-y-2">
              {nodes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <RefreshCcw className="h-12 w-12 mb-3 opacity-20" />
                  <p className="text-sm font-medium">Aucun nœud de bracket</p>
                  <p className="text-xs">Initialisez la structure de phase.</p>
                </div>
              ) : (
                nodes.map((node) => {
                  const nodeParticipants = (node.metadata as any)?.participants || [];
                  
                  return (
                    <div
                      key={node.id}
                      className="flex flex-col border border-primary/5 rounded-xl bg-card hover:border-primary/20 transition-all hover:shadow-sm overflow-hidden"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-3 border-b border-primary/5 bg-muted/10">
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-10 w-10 rounded-lg flex items-center justify-center ${node.bracketType === "LOWER" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}
                          >
                            <span className="font-bold text-xs">{node.nodeCode || "N"}</span>
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm">
                                {(node.metadata as any)?.name || node.nodeCode || "Nœud"}
                              </span>
                              <div className="flex gap-1">
                                <Badge
                                  variant="secondary"
                                  className="text-[9px] h-4 py-0 leading-none bg-primary/10 text-primary border-none uppercase tracking-tighter"
                                >
                                  {node.bracketType || "UPPER"}
                                </Badge>
                                {(node.metadata as any)?.format && (
                                  <Badge
                                    variant="outline"
                                    className="text-[9px] h-4 py-0 leading-none border-primary/20 text-muted-foreground uppercase tracking-tighter"
                                  >
                                    {(node.metadata as any).format}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
                              Round {node.round} • Match #{node.matchNumber}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1.5 shrink-0 justify-end">
                          <UpdateBracketNodeDialog
                            node={{
                              id: node.id,
                              nodeCode: node.nodeCode,
                              round: node.round,
                              matchNumber: node.matchNumber,
                              bracketType: node.bracketType,
                            }}
                            revalidatePath={basePath}
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs font-bold border-primary/20 bg-primary/5 text-primary"
                            asChild
                          >
                            <Link
                              href={`/tournaments/${tournamentId}/editions/${editionId}/dashboard/brackets/${node.id}`}
                            >
                              Gérer
                            </Link>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Supprimer le nœud ?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Êtes-vous sûr de vouloir supprimer ce nœud de bracket ? Les
                                  données associées seront perdues.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <form action={`/api/bracket-nodes/${node.id}/delete`} method="POST">
                                  <AlertDialogAction
                                    type="submit"
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Supprimer définitivement
                                  </AlertDialogAction>
                                </form>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>

                      {/* Participants in this Node */}
                      <div className="p-3 bg-card">
                        <div className="flex flex-wrap gap-1.5">
                          {nodeParticipants.length > 0 ? (
                            nodeParticipants.map((regId: string) => (
                              <Badge 
                                key={regId} 
                                variant="outline" 
                                className="bg-muted/30 text-[10px] font-medium py-0 h-6 px-2 border-primary/5"
                              >
                                {getName(regId, allRegs)}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-[10px] text-muted-foreground italic ml-1">
                              Aucun participant assigné
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}