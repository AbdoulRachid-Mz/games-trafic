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
import {
  getBracketNodeById,
  getPhaseGroupParticipants,
} from "@/actions/phases";
import { getEditionRegistrations, getMatches } from "@/actions/tournaments";
import { revalidatePath } from "next/cache";
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
} from "lucide-react";
import { UpdateBracketNodeDialog } from "@/components/pages/tournaments/edition-detail/update-bracket-node-dialog";
import { CreateMatchDialog } from "@/components/pages/tournaments/edition-detail/create-match-dialog";
import { UpdateMatchDialog } from "@/components/pages/tournaments/edition-detail/update-match-dialog";
import { deleteMatch } from "@/actions/phases";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";

interface PageProps {
  params: Promise<{
    tournamentId: string;
    editionId: string;
    bracketId: string;
  }>;
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

export default async function BracketNodeDetailPage({ params }: PageProps) {
  const { tournamentId, editionId, bracketId } = await params;
  const basePath = `/tournaments/${tournamentId}/editions/${editionId}/dashboard`;

  const node = (await getBracketNodeById(bracketId, {
    populate: ["phase", "group"],
  })) as BracketNode | null;
  const regsRes = await getEditionRegistrations({
    filters: { editionId },
    options: { populate: ["member", "member.user", "member.team"] },
    pagination: { page: 1, limit: 500 },
  });
  const groupParticipantsRes = node?.groupId
    ? await getPhaseGroupParticipants({
        filters: { groupId: node.groupId },
        options: { sortBy: "position", sortOrder: "asc" },
        pagination: { page: 1, limit: 500 },
      })
    : { data: [] as PhaseGroupParticipant[] };

  const matchesRes = await getMatches({
    filters: { editionId, bracketNodeId: bracketId },
    options: { sortBy: "round", sortOrder: "asc" },
    pagination: { page: 1, limit: 100 },
  });

  const bracketTypeColor: Record<string, string> = {
    UPPER: "bg-blue-100 text-blue-700 border-blue-200",
    LOWER: "bg-orange-100 text-orange-700 border-orange-200",
    FINAL: "bg-purple-100 text-purple-700 border-purple-200",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 -ml-2"
              asChild
            >
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
          </div>
        </div>
      </div>

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
                  {(matchesRes.data as Match[]).length} match(s) associé(s)
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
              {(matchesRes.data as Match[]).length}
            </Badge>
          </div>
          <CreateMatchDialog
            editionId={editionId}
            phaseId={node?.phaseId || ""}
            groupId={node?.groupId || null}
            bracketNodeId={bracketId}
            participants={(
              groupParticipantsRes.data as PhaseGroupParticipant[]
            ).map((p) => {
              const reg = (regsRes.data as EditionRegistration[]).find(
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
            maxMatches={10} // Limite max de matchs par bracket node
            currentMatchesCount={(matchesRes.data as Match[]).length}
          />
        </CardHeader>
        <CardContent>
          {(matchesRes.data as Match[]).length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              <Swords className="h-10 w-10 mx-auto mb-3 opacity-20" />
              Aucun match associé à ce nœud.
            </div>
          ) : (
            <div className="grid gap-3">
              {(matchesRes.data as Match[]).map((m) => {
                const reg1 = (regsRes.data as EditionRegistration[]).find(
                  (r: any) => r.id === m.participant1RegistrationId,
                ) as any;
                const reg2 = (regsRes.data as EditionRegistration[]).find(
                  (r: any) => r.id === m.participant2RegistrationId,
                ) as any;
                const name1 =
                  reg1?.member?.displayName ||
                  reg1?.member?.user?.username ||
                  reg1?.member?.team?.name ||
                  "Joueur 1";
                const name2 =
                  reg2?.member?.displayName ||
                  reg2?.member?.user?.username ||
                  reg2?.member?.team?.name ||
                  "Joueur 2";
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
                            <form
                              action={async () => {
                                "use server";
                                await deleteMatch(m.id);
                                revalidatePath(
                                  `${basePath}/brackets/${bracketId}`,
                                );
                              }}
                            >
                              <AlertDialogAction
                                type="submit"
                                variant="destructive"
                              >
                                Supprimer
                              </AlertDialogAction>
                            </form>
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
  );
}
