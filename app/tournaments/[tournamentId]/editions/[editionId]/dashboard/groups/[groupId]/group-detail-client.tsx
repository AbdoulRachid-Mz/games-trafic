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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MatchCard } from "@/components/cards/match-card";
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
import {
  DynamicActionMenu,
  MenuItemAction,
} from "@/components/shared/dynamic-action-menu";
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
  PlusCircle,
} from "lucide-react";
import { GenerateGroupMatchesDialog } from "@/components/pages/tournaments/edition-detail/generate-group-matches-dialog";
import { CreateBracketNodeDialog } from "@/components/pages/tournaments/edition-detail/create-bracket-node-dialog";
import { UpdateBracketNodeDialog } from "@/components/pages/tournaments/edition-detail/update-bracket-node-dialog";
import { UpdatePhaseGroupDialog } from "@/components/pages/tournaments/edition-detail/update-phase-group-dialog";
import { MarkCompleteDialog } from "@/components/pages/tournaments/edition-detail/mark-complete-dialog";
import { generateMatchesAction } from "@/actions/phases";

function getName(registrationId: string | null | undefined, allRegs: any[]) {
  const reg = allRegs.find((r: any) => r.id === registrationId);
  return (
    reg?.member?.displayName ||
    reg?.member?.user?.username ||
    reg?.member?.team?.name ||
    "Joueur"
  );
}

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { updateTournamentEditionModeAction } from "@/actions/editions";
import { organizeNextPhaseAction } from "@/actions/phases";
import { AlertTriangle } from "lucide-react";

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
  matches: any[];
  basePath: string;
  totalMatches: number;
  editionConfig: {
    competitionType?: string;
    competitionMode?: "AUTO" | "MANUAL";
    [key: string]: any;
  };
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
  matches,
  basePath,
  totalMatches,
  editionConfig,
}: GroupDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isAutoMode = editionConfig.competitionMode === "AUTO";

  const handleSwitchToManual = () => {
    startTransition(async () => {
      try {
        const res = await updateTournamentEditionModeAction(
          editionId,
          "MANUAL",
        );
        if (res.success) {
          toast.success("Mode manuel activé avec succès.");
          router.refresh();
        } else {
          toast.error(res.error || "Erreur lors du changement de mode.");
        }
      } catch (error) {
        toast.error("Une erreur est survenue.");
      }
    });
  };
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
            <div className="flex gap-2 flex-wrap items-center">
              <Badge
                variant="outline"
                className="text-xs font-semibold px-2 py-0.5 border-primary/20 bg-primary/5 text-primary"
              >
                Ordre {group?.order}
              </Badge>
              {isAutoMode ? (
                <Badge className="bg-blue-600/10 text-blue-600 border-blue-600/20 shadow-sm text-[10px] px-2 py-0.5 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  Mode Auto
                </Badge>
              ) : (
                <Badge className="bg-amber-600/10 text-amber-600 border-amber-600/20 shadow-sm text-[10px] px-2 py-0.5">
                  Mode Manuel
                </Badge>
              )}
              {group?.isLocked && (
                <Badge className="bg-amber-100 text-amber-900 border-amber-200 text-xs gap-1 py-0.5">
                  <Lock className="h-3 w-3" /> Verrouillé
                </Badge>
              )}

              {isAutoMode && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-[9px] text-amber-600 hover:text-amber-700 hover:bg-amber-50 uppercase font-black tracking-tighter"
                    >
                      Passer en manuel
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
                        <AlertTriangle className="h-5 w-5" /> Basculer en mode
                        Manuel ?
                      </AlertDialogTitle>
                      <AlertDialogDescription className="space-y-3">
                        <p>
                          En basculant en mode **Manuel**, vous prenez le
                          contrôle total de la structure.
                        </p>
                        <div className="bg-amber-500/10 p-3 rounded-lg border border-amber-500/20 text-amber-700 text-xs space-y-2">
                          <p className="font-bold">Important :</p>
                          <ul className="list-disc pl-4 space-y-1">
                            <li>
                              L'Assistant ne gérera plus automatiquement ce
                              groupe.
                            </li>
                            <li>
                              Les actions automatiques (wizard) seront
                              désactivées pour cette édition.
                            </li>
                          </ul>
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleSwitchToManual}
                        className="bg-amber-600 hover:bg-amber-700"
                      >
                        Confirmer
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
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
                  <>
                    {isAutoMode && (
                      <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg mb-4 text-amber-700 text-xs flex gap-2">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        <p>
                          <strong>Attention :</strong> Générer manuellement des
                          matchs en mode Auto peut interférer avec la
                          planification automatique de l'Assistant.
                        </p>
                      </div>
                    )}
                    <GenerateGroupMatchesDialog
                      groupId={groupId}
                      editionId={editionId}
                      phaseId={group?.phaseId || ""}
                      maxMatches={100}
                      existingMatchesCount={Math.round(totalMatches)}
                      groupConfig={{
                        maxParticipants: group?.participantCount || 8,
                        matchesPerParticipant:
                          (group?.config as any)?.matchesPerParticipant || 1,
                      }}
                      asFormOnly
                    />
                  </>
                ),
              },
              {
                id: "organize-nodes",
                paramKey: "action",
                paramValue: "organize",
                label: "Organiser les Nœuds",
                icon: Settings,
                variant: "outline",
                href: `${basePath}/organize`,
                ...(isAutoMode
                  ? {
                      overlayType: "dialog",
                      renderContent: (
                        <div className="space-y-4 p-4 text-center">
                          <div className="flex justify-center">
                            <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                              <AlertTriangle className="h-6 w-6 text-amber-600" />
                            </div>
                          </div>
                          <Typography variant="body-base" weight="bold">
                            Action Déconseillée
                          </Typography>
                          <Typography variant="body-sm" theme="muted">
                            La modification de la structure du bracket est
                            réservée à l'Assistant en mode Auto.
                          </Typography>
                          <div className="flex justify-center gap-2 pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                router.push(`${basePath}/organize`)
                              }
                            >
                              Continuer
                            </Button>
                          </div>
                        </div>
                      ),
                    }
                  : {}),
              },
              {
                id: "generate-structure",
                paramKey: "action",
                paramValue: "generate-structure",
                label:
                  nodes.length > 0
                    ? "Régénérer la structure"
                    : "Générer la structure",
                icon: RefreshCcw,
                variant: nodes.length > 0 ? "destructive" : "outline",
                overlayType: "dialog",
                renderContent: (
                  <div className="space-y-4 p-4">
                    <div
                      className={`flex items-center gap-2 mb-2 ${nodes.length > 0 ? "text-destructive" : "text-primary"}`}
                    >
                      <RefreshCcw className="h-5 w-5" />
                      <Typography variant="h4" weight="bold">
                        {nodes.length > 0
                          ? "Régénérer la structure"
                          : "Générer la structure"}
                      </Typography>
                    </div>

                    {nodes.length > 0 ? (
                      <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-xl text-destructive space-y-2">
                        <div className="flex items-center gap-2 font-bold">
                          <AlertTriangle className="h-4 w-4" />
                          <p className="text-sm">
                            Attention : Écrasement irréversible
                          </p>
                        </div>
                        <p className="text-[11px] leading-relaxed">
                          Ce groupe possède déjà une structure. La régénération
                          va **supprimer définitivement** :
                        </p>
                        <ul className="list-disc pl-4 text-[10px] space-y-1">
                          <li>Tous les nœuds de bracket actuels</li>
                          <li>Tous les matchs et leurs scores</li>
                          <li>Toutes les statistiques associées</li>
                        </ul>
                      </div>
                    ) : (
                      <Typography variant="body-sm">
                        Cela va générer les nœuds et les matchs pour ce groupe
                        en fonction des participants actuels.
                      </Typography>
                    )}

                    <div className="bg-primary/5 p-3 rounded-lg border border-primary/20 text-[10px] space-y-1">
                      <p className="font-bold flex items-center gap-1">
                        <Settings className="h-3 w-3" /> Options de génération :
                      </p>
                      <ul className="list-disc pl-4 opacity-80">
                        <li>Création des nœuds (Huitièmes, Quarts, etc.)</li>
                        <li>Génération automatique des matchs</li>
                        <li>Assignation des participants par seed</li>
                      </ul>
                    </div>

                    <div className="flex flex-col gap-2 pt-2">
                      <Button
                        variant={nodes.length > 0 ? "destructive" : "default"}
                        className="w-full"
                        onClick={async () => {
                          // ✅ Utiliser generateMatchesAction au lieu de organizeNextPhaseAction
                          const result = await generateMatchesAction(
                            "GROUP",
                            groupId,
                            {
                              clearExisting: nodes.length > 0,
                              seedingMethod: "RANDOM",
                              isHomeAway:
                                (group?.config as any)?.isHomeAway || false,
                            },
                          );
                          if (result.success) {
                            toast.success(
                              nodes.length > 0
                                ? "Structure réinitialisée !"
                                : "Structure générée !",
                            );
                            router.refresh();
                          } else {
                            toast.error(
                              result.error || "Erreur lors de la génération",
                            );
                          }
                        }}
                      >
                        {nodes.length > 0
                          ? "Confirmer la réinitialisation"
                          : "Confirmer la génération"}
                      </Button>
                    </div>
                  </div>
                ),
              },
              {
                id: "update-group",
                paramKey: "action",
                paramValue: "update-group",
                label: "Modifier le groupe",
                icon: Settings,
                variant: "outline",
                overlayType: "dialog",
                renderContent: (
                  <>
                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg mb-2 text-amber-700 text-xs flex gap-2">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      <p>
                        Modifier la configuration du groupe peut affecter les
                        calculs de l'Assistant.
                      </p>
                    </div>
                    {group ? (
                      <UpdatePhaseGroupDialog group={group} asFormOnly />
                    ) : (
                      <></>
                    )}
                  </>
                ),
              },
              ...((!group?.isCompleted
                ? [
                    {
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
                      ),
                    },
                  ]
                : []) as MenuItemAction[]),
            ]}
          />
        </div>
        <Tabs defaultValue="standings" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="standings" className="gap-2">
              <Trophy className="h-4 w-4" /> Classement
            </TabsTrigger>
            <TabsTrigger value="participants" className="gap-2">
              <Users className="h-4 w-4" /> Participants
            </TabsTrigger>
            <TabsTrigger value="matches" className="gap-2">
              <Swords className="h-4 w-4" /> Matchs
            </TabsTrigger>
            <TabsTrigger
              value="brackets"
              className="gap-2"
              disabled={nodes.length === 0}
            >
              <RefreshCcw className="h-4 w-4" /> Brackets
            </TabsTrigger>
          </TabsList>

          <TabsContent value="standings" className="space-y-6">
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
                        <TableHead className="w-12 text-center font-bold">
                          #
                        </TableHead>
                        <TableHead className="font-bold">Joueur</TableHead>
                        <TableHead className="text-center w-14 font-bold text-primary">
                          Pts
                        </TableHead>
                        <TableHead className="text-center w-12 text-xs font-medium uppercase tracking-wider">
                          J
                        </TableHead>
                        <TableHead className="text-center w-12 text-xs font-medium uppercase tracking-wider text-green-600">
                          G
                        </TableHead>
                        <TableHead className="text-center w-12 text-xs font-medium uppercase tracking-wider text-amber-600">
                          N
                        </TableHead>
                        <TableHead className="text-center w-12 text-xs font-medium uppercase tracking-wider text-red-600">
                          P
                        </TableHead>
                        <TableHead className="text-center w-16 text-xs font-medium uppercase tracking-wider">
                          Diff
                        </TableHead>
                        <TableHead className="text-right w-24">
                          Statut
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {standings.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={9}
                            className="text-center py-12 text-muted-foreground italic"
                          >
                            En attente de participants...
                          </TableCell>
                        </TableRow>
                      ) : (
                        standings.map((p, idx) => {
                          const diff =
                            (p.scoreFor ?? 0) - (p.scoreAgainst ?? 0);
                          const isTop =
                            idx < ((group?.config as any)?.advanceCount || 2);
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
                              <TableCell
                                className={`text-center font-bold ${diff > 0 ? "text-green-600" : diff < 0 ? "text-red-600" : ""}`}
                              >
                                {diff > 0 ? `+${diff}` : diff}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {p.qualified ? (
                                  <Badge className="bg-green-500 hover:bg-green-600 border-none px-2 py-0.5 animate-pulse text-[10px] uppercase tracking-tighter">
                                    Qualifié
                                  </Badge>
                                ) : isTop ? (
                                  <Badge
                                    variant="outline"
                                    className="border-blue-500/30 bg-blue-500/5 text-blue-600 text-[10px] uppercase tracking-tighter"
                                  >
                                    En zone Q
                                  </Badge>
                                ) : (
                                  <span className="text-xs text-muted-foreground/50">
                                    En attente
                                  </span>
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
          </TabsContent>

          <TabsContent value="participants">
            <GroupParticipantsManagement
              groupId={groupId}
              editionId={editionId}
              allEditionRegistrations={allRegs}
              groupParticipants={participants}
              maxParticipants={group?.participantCount || 0}
              previousPhasesData={qualifiedByPhase}
              defaultSource={participantSource}
            />
          </TabsContent>

          <TabsContent value="matches" className="space-y-4">
            {matches.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-muted/5 rounded-xl border-2 border-dashed">
                <Swords className="h-12 w-12 mb-3 opacity-20" />
                <p className="text-sm font-medium">Aucun match généré</p>
                <p className="text-xs">
                  Utilisez le menu d'actions pour générer la structure et les
                  matchs.
                </p>
              </div>
            ) : nodes.length > 0 ? (
              <div className="space-y-6">
                {(() => {
                  const nodesWithMatches = nodes.filter((n) =>
                    matches.some((m) => m.bracketNodeId === n.id),
                  );
                  const roundsMap: Record<number, BracketNode[]> = {};
                  nodesWithMatches.forEach((node) => {
                    if (!roundsMap[node.round]) roundsMap[node.round] = [];
                    roundsMap[node.round].push(node);
                  });
                  const sortedRounds = Object.keys(roundsMap)
                    .map(Number)
                    .sort((a, b) => a - b);

                  if (sortedRounds.length === 0)
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {matches.map((match) => (
                          <MatchCard
                            key={match.id}
                            match={match}
                            isAdmin={true}
                            onUpdate={() => window.location.reload()}
                          />
                        ))}
                      </div>
                    );

                  return (
                    <Tabs
                      defaultValue={String(sortedRounds[0])}
                      className="w-full"
                    >
                      <TabsList className="bg-muted/50 p-1 mb-6 flex-wrap h-auto gap-1">
                        {sortedRounds.map((r) => (
                          <TabsTrigger
                            key={r}
                            value={String(r)}
                            className="text-[10px] px-3 h-7"
                          >
                            ROUND {r}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                      {sortedRounds.map((r) => (
                        <TabsContent
                          key={r}
                          value={String(r)}
                          className="grid grid-cols-1 md:grid-cols-2 gap-4"
                        >
                          {matches
                            .filter((m) =>
                              roundsMap[r].some(
                                (n) => n.id === m.bracketNodeId,
                              ),
                            )
                            .map((match) => (
                              <MatchCard
                                key={match.id}
                                match={match}
                                isAdmin={true}
                                onUpdate={() => window.location.reload()}
                              />
                            ))}
                        </TabsContent>
                      ))}
                    </Tabs>
                  );
                })()}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {matches.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    isAdmin={true}
                    onUpdate={() => window.location.reload()}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="brackets" className="space-y-4">
            <div className="flex items-center justify-between">
              <Typography variant="h5" weight="bold">
                Structure du Bracket
              </Typography>
              {isAutoMode ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <PlusCircle className="h-4 w-4 mr-2" /> Nouveau Nœud
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />{" "}
                        Action Déconseillée
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        L'Assistant gère la structure du bracket. Ajouter
                        manuellement un nœud peut perturber l'arbre de
                        compétition.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction asChild>
                        <CreateBracketNodeDialog
                          phaseId={group?.phaseId || ""}
                          groupId={groupId}
                          groupOrder={group?.order || 0}
                          asFormOnly
                        />
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : (
                <CreateBracketNodeDialog
                  phaseId={group?.phaseId || ""}
                  groupId={groupId}
                  groupOrder={group?.order || 0}
                />
              )}
            </div>

            {nodes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-muted/5 rounded-xl border-2 border-dashed">
                <RefreshCcw className="h-12 w-12 mb-3 opacity-20" />
                <p className="text-sm font-medium">Aucun nœud de bracket</p>
                <p className="text-xs">Identifiez la structure de phase.</p>
              </div>
            ) : (
              (() => {
                // Group nodes by round
                const roundsMap: Record<number, BracketNode[]> = {};
                nodes.forEach((node) => {
                  if (!roundsMap[node.round]) roundsMap[node.round] = [];
                  roundsMap[node.round].push(node);
                });
                const sortedRounds = Object.keys(roundsMap)
                  .map(Number)
                  .sort((a, b) => a - b);

                const getRoundTitle = (roundNum: number) => {
                  const maxRound = Math.max(...sortedRounds);
                  const diff = maxRound - roundNum;
                  if (diff === 0) return "Finale";
                  if (diff === 1) return "Demi-finales";
                  if (diff === 2) return "Quarts de finale";
                  if (diff === 3) return "Huitièmes de finale";
                  return `Round ${roundNum}`;
                };

                return (
                  <Tabs
                    defaultValue={String(sortedRounds[0])}
                    className="w-full"
                  >
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide mb-4">
                      <TabsList className="bg-muted/50 p-1">
                        {sortedRounds.map((roundNum) => (
                          <TabsTrigger
                            key={roundNum}
                            value={String(roundNum)}
                            className="text-xs px-4 h-8 rounded-md"
                          >
                            {getRoundTitle(roundNum)}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </div>

                    {sortedRounds.map((roundNum) => (
                      <TabsContent
                        key={roundNum}
                        value={String(roundNum)}
                        className="space-y-4"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {roundsMap[roundNum].map((node) => {
                            const nodeParticipants =
                              (node.metadata as any)?.participants || [];
                            const nodeMatch = matches.find(
                              (m) => m.bracketNodeId === node.id,
                            );

                            return (
                              <div
                                key={node.id}
                                className="flex flex-col border rounded-xl overflow-hidden shadow-sm bg-card transition-shadow hover:shadow-md"
                              >
                                <div className="flex items-center justify-between p-3 bg-muted/30 border-b">
                                  <div className="flex items-center gap-2">
                                    <Badge
                                      variant="outline"
                                      className="bg-primary/10 text-primary border-none text-[10px] uppercase font-black"
                                    >
                                      {node.nodeCode}
                                    </Badge>
                                    <span className="font-bold text-xs">
                                      Match #{node.matchNumber}
                                    </span>
                                  </div>
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
                                </div>
                                <div className="p-4 flex-1">
                                  {nodeMatch ? (
                                    <MatchCard
                                      match={nodeMatch}
                                      viewMode="compact"
                                      isAdmin={true}
                                      onUpdate={() => window.location.reload()}
                                    />
                                  ) : (
                                    <div className="space-y-3">
                                      <div className="flex flex-wrap gap-1.5">
                                        {nodeParticipants.map(
                                          (regId: string) => (
                                            <Badge
                                              key={regId}
                                              variant="secondary"
                                              className="text-[10px] h-6"
                                            >
                                              {getName(regId, allRegs)}
                                            </Badge>
                                          ),
                                        )}
                                        {nodeParticipants.length === 0 && (
                                          <span className="text-[10px] text-muted-foreground italic">
                                            Aucun participant
                                          </span>
                                        )}
                                      </div>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full h-8 text-[10px] font-bold"
                                        asChild
                                      >
                                        <Link
                                          href={`/tournaments/${tournamentId}/editions/${editionId}/dashboard/brackets/${node.id}`}
                                        >
                                          Gérer le nœud
                                        </Link>
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                );
              })()
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
