// @/components/pages/tournaments/edition-detail/brackets-organize-client.tsx
'use client'; 

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
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
import type {
  BracketNode,
  PhaseGroupParticipant,
  EditionRegistration,
  Match,
} from "@/database/schema";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ChevronLeft,
  Swords,
  Clock,
  CheckCircle,
  XCircle,
  Pause,
  Settings2,
  Users,
  RefreshCw,
} from "lucide-react";
import { UpdateBracketNodeDialog } from "@/components/pages/tournaments/edition-detail/update-bracket-node-dialog";
import { MarkCompleteDialog } from "@/components/pages/tournaments/edition-detail/mark-complete-dialog";
import { CreateMatchDialog } from "@/components/pages/tournaments/edition-detail/create-match-dialog";
import { UpdateMatchDialog } from "@/components/pages/tournaments/edition-detail/update-match-dialog";
import { GenerateBracketMatchesButton } from "@/components/pages/tournaments/edition-detail/generate-bracket-matches-button";
import { deleteMatch } from "@/actions/phases";
import { toast } from "sonner";
import { BracketNodeWithDetails } from "@/types/api";

interface ClientPageProps {
  tournamentId: string;
  editionId: string;
  bracketId: string;
  basePath: string;
  node: BracketNodeWithDetails | null;
  registrations: EditionRegistration[];
  groupParticipants: PhaseGroupParticipant[];
  matches: Match[];
}

function getMatchStatusBadge(m: Match) {
  if (m.status === "COMPLETED" || (m.score1 != null && m.score2 != null)) {
    return (
      <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px]">
        <CheckCircle className="h-3 w-3 mr-1" />
        Terminé
      </Badge>
    );
  }
  if (m.status === "IN_PROGRESS") {
    return (
      <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-[10px]">
        <Pause className="h-3 w-3 mr-1" />
        En cours
      </Badge>
    );
  }
  if (m.status === "CANCELLED") {
    return (
      <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px]">
        <XCircle className="h-3 w-3 mr-1" />
        Annulé
      </Badge>
    );
  }
  return (
    <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px]">
      <Clock className="h-3 w-3 mr-1" />
      En attente
    </Badge>
  );
}

export default function ClientBracketNodeDetailPage({
  tournamentId,
  editionId,
  bracketId,
  basePath,
  node,
  registrations,
  groupParticipants,
  matches,
}: ClientPageProps) {
  // Fonction utilitaire côté client
  const getName = (id: string | null | undefined) => {
    if (!id) return "À déterminer";
    const reg = registrations.find(r => r.id === id);
    // @ts-ignore - gestion des relations
    return reg?.member?.displayName || reg?.member?.user?.username || reg?.member?.team?.name || "Joueur";
  };

  const bracketTypeColor: Record<string, string> = {
    UPPER: "bg-blue-100 text-blue-700 border-blue-200",
    LOWER: "bg-orange-100 text-orange-700 border-orange-200",
    FINAL: "bg-purple-100 text-purple-700 border-purple-200",
  };

  const nodeParticipants = (node?.metadata as any)?.participants || [];

  // Handler pour le rafraîchissement
  const handleRefresh = () => {
    // revalidatePath(`${basePath}/brackets/${bracketId}`);
    window.location.reload();
  };

  // Handler pour la suppression d'un match
  const handleDeleteMatch = async (matchId: string) => {
    try {
      await deleteMatch(matchId);
    //   revalidatePath(`${basePath}/brackets/${bracketId}`);
      toast.success("Match supprimé avec succès");
      handleRefresh();
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Button variant="ghost" size="sm" className="h-7 px-2 -ml-2" asChild>
              <Link href={`${basePath}/phases/${node?.phaseId}`}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Phase
              </Link>
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <Typography variant="h3" weight="bold">
              Nœud {node?.nodeCode || bracketId.slice(0, 6)}
            </Typography>
            <Button variant="outline" size="sm" className="gap-2 h-8" asChild>
              <Link href={`${basePath}/brackets/${bracketId}/organize`}>
                <Settings2 className="h-4 w-4" /> Organiser en masse
              </Link>
            </Button>
            
            <MarkCompleteDialog
              type="BRACKET_NODE"
              id={bracketId}
              name={node?.nodeCode || "Nœud"}
              onComplete={handleRefresh}
            />

            <Button variant="ghost" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Reste de votre JSX - identique à avant */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Node info card */}
          {node && (
            <Card>
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        className={`border text-xs font-semibold ${bracketTypeColor[node.bracketType || "UPPER"] || bracketTypeColor.UPPER}`}
                      >
                        {node.bracketType || "UPPER"} Bracket
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Round {node.round}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Match #{node.matchNumber}
                      </Badge>
                    </div>
                    <Typography variant="caption1" theme="muted">
                      {matches.length} match(s) associé(s)
                    </Typography>
                  </div>
                  <UpdateBracketNodeDialog
                    node={{
                      id: bracketId,
                      nodeCode: node.nodeCode,
                      round: node.round,
                      matchNumber: node.matchNumber,
                      bracketType: node.bracketType,
                    }}
                    revalidatePath={`${basePath}/brackets/${bracketId}`}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Matches */}
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4">
              <div className="flex items-center gap-2">
                <Swords className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Matchs liés</CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {matches.length}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <GenerateBracketMatchesButton 
                  bracketNodeId={bracketId}
                  hasMatches={matches.length > 0}
                  participantsCount={nodeParticipants.length}
                />
                <CreateMatchDialog
                  editionId={editionId}
                  phaseId={node?.phaseId || ""}
                  groupId={node?.groupId || null}
                  bracketNodeId={bracketId}
                  participants={groupParticipants.map((p) => {
                    const reg = registrations.find(
                      (r: any) => r.id === p.registrationId,
                    ) as any;
                    return {
                      registrationId: p.registrationId || "",
                      displayName:
                        reg?.member?.displayName ||
                        reg?.member?.user?.username ||
                        reg?.member?.team?.name ||
                        "Joueur",
                    };
                  })}
                  defaultRound={node?.round || 1}
                  defaultMatchNumber={node?.matchNumber || 1}
                  maxMatches={10}
                  currentMatchesCount={matches.length}
                />
              </div>
            </CardHeader>
            <CardContent>
              {matches.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  <Swords className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  Aucun match associé à ce nœud.
                </div>
              ) : (
                <div className="grid gap-3">
                  {matches.map((m) => {
                    const name1 = getName(m.participant1RegistrationId);
                    const name2 = getName(m.participant2RegistrationId);
                    const isCompleted =
                      m.status === "COMPLETED" ||
                      (m.score1 != null && m.score2 != null);

                    return (
                      <div
                        key={m.id}
                        className="border rounded-xl p-4 space-y-3 hover:bg-muted/30 transition-colors"
                      >
                        {/* Match header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Typography variant="body-base" weight="bold">
                              Match {m.matchNumber}
                            </Typography>
                            <Badge variant="outline" className="text-[10px]">
                              Round {m.round}
                            </Badge>
                            {getMatchStatusBadge(m)}
                          </div>
                          <Typography variant="caption1" theme="muted">
                            {m.scheduledTime
                              ? format(new Date(m.scheduledTime), "d MMM HH:mm", {
                                  locale: fr,
                                })
                              : "À planifier"}
                          </Typography>
                        </div>

                        {/* Players + Score */}
                        <div className="flex items-center justify-center gap-4 py-2">
                          <div className="flex-1 text-right">
                            <span
                              className={`text-sm font-medium ${isCompleted && (m.score1 ?? 0) > (m.score2 ?? 0) ? "text-green-600 font-bold" : ""}`}
                            >
                              {name1}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-lg font-black tabular-nums w-8 text-center">
                              {m.score1 ?? "-"}
                            </span>
                            <span className="text-muted-foreground text-xs">
                              VS
                            </span>
                            <span className="text-lg font-black tabular-nums w-8 text-center">
                              {m.score2 ?? "-"}
                            </span>
                          </div>
                          <div className="flex-1">
                            <span
                              className={`text-sm font-medium ${isCompleted && (m.score2 ?? 0) > (m.score1 ?? 0) ? "text-green-600 font-bold" : ""}`}
                            >
                              {name2}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 justify-end">
                          <UpdateMatchDialog
                            match={{
                              id: m.id,
                              score1: m.score1,
                              score2: m.score2,
                              scheduledTime: m.scheduledTime,
                            }}
                            p1Name={name1}
                            p2Name={name2}
                          />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive hover:text-destructive text-xs h-7"
                              >
                                Supprimer
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Supprimer le match
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Cette action supprimera {name1} vs {name2} de
                                  façon irréversible.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <Button
                                  onClick={() => handleDeleteMatch(m.id)}
                                  variant="destructive"
                                >
                                  Supprimer
                                </Button>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Participants Stand */}
          <Card className="h-fit">
            <CardHeader className="bg-primary/5 pb-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" /> Stand des Participants
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {nodeParticipants.length > 0 ? (
                <div className="space-y-2">
                  {nodeParticipants.map((regId: string) => (
                    <div key={regId} className="flex items-center gap-3 p-2 rounded-lg border bg-card/50">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                        {getName(regId).charAt(0)}
                      </div>
                      <span className="text-sm font-medium">{getName(regId)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground text-xs italic bg-muted/30 rounded-lg border border-dashed">
                  Aucun participant assigné spécifiquement à ce bracket.
                </div>
              )}
              
              <Button variant="outline" size="sm" className="w-full text-xs" asChild>
                <Link href={`${basePath}/brackets/${bracketId}/organize`}>
                  Gérer les participants
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Configuration Summary */}
          <Card>
            <CardHeader className="bg-muted/50 pb-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-muted-foreground" /> Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Type de Bracket</span>
                <span className="font-bold">{node?.bracketType}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Round</span>
                <span className="font-bold">#{node?.round}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">N° Match</span>
                <span className="font-bold">#{node?.matchNumber}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Groupe</span>
                <span className="font-bold">{node?.group?.name || "N/A"}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}