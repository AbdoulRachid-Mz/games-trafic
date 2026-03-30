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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
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
  getPhaseGroupById,
  getPhaseGroupParticipants,
  createPhaseGroupParticipant,
  deletePhaseGroupParticipant,
  getBracketNodes,
  recalculateGroupStandings,
} from "@/actions/phases";
import { getEditionRegistrations, createMatch } from "@/actions/tournaments";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { GroupParticipantsManagement } from "@/components/pages/tournaments/edition-detail/group-participants-management";
function getName(registrationId: string | null | undefined, allRegs: any[]) {
  const reg = allRegs.find((r: any) => r.id === registrationId);
  return (
    reg?.member?.displayName ||
    reg?.member?.user?.username ||
    reg?.member?.team?.name ||
    "Joueur"
  );
}
import type {
  PhaseGroup,
  PhaseGroupParticipant,
  EditionRegistration,
} from "@/database/schema";
import {
  ArrowLeft,
  Plus,
  Trophy,
  Swords,
  UserPlus,
  Trash2,
  Lock,
  Unlock,
  RefreshCcw,
  LayoutDashboard,
  Settings,
  Users,
} from "lucide-react";
import { GenerateGroupMatchesDialog } from "@/components/pages/tournaments/edition-detail/generate-group-matches-dialog";
import { CreateBracketNodeDialog } from "@/components/pages/tournaments/edition-detail/create-bracket-node-dialog";
import { UpdateBracketNodeDialog } from "@/components/pages/tournaments/edition-detail/update-bracket-node-dialog";
import { UpdatePhaseGroupDialog } from "@/components/pages/tournaments/edition-detail/update-phase-group-dialog";
import { deleteBracketNode } from "@/actions/phases";
import { QuicKAction } from "./quick-acions";

interface PageProps {
  params: Promise<{
    tournamentId: string;
    editionId: string;
    groupId: string;
  }>;
}

export default async function GroupDetailPage({ params }: PageProps) {
  const { tournamentId, editionId, groupId } = await params;
  const basePath = `/tournaments/${tournamentId}/editions/${editionId}/dashboard/groups/${groupId}`;

  // Ensure standings are fresh
  await recalculateGroupStandings(groupId);

  const group = (await getPhaseGroupById(groupId, {
    populate: ["phase"],
  })) as PhaseGroup | null;
  const participantsRes = await getPhaseGroupParticipants({
    filters: { groupId },
    options: { sortBy: "points", sortOrder: "desc" },
    pagination: { page: 1, limit: 500 },
  });
  const regsRes = await getEditionRegistrations({
    filters: { editionId },
    options: { populate: ["member", "member.user", "member.team"] },
    pagination: { page: 1, limit: 500 },
  });

  const participants = participantsRes.data as PhaseGroupParticipant[];
  const allRegs = regsRes.data as any[];

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

  // Global stats
  const totalMatches =
    standings.reduce((acc, p) => acc + (p.matchesPlayed ?? 0), 0) / 2;
  const totalGoals = standings.reduce((acc, p) => acc + (p.scoreFor ?? 0), 0);

  function getName(registrationId: string | null | undefined) {
    const reg = allRegs.find((r: any) => r.id === registrationId);
    return (
      reg?.member?.displayName ||
      reg?.member?.user?.username ||
      reg?.member?.team?.name ||
      "Joueur"
    );
  }


  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-6">
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
        </div>
        {/* <div className="flex items-center gap-2">
     
          <GenerateGroupMatchesDialog
            groupId={groupId}
            editionId={editionId}
            phaseId={group?.phaseId || ""}
          />

          <Button variant="outline" className="gap-1.5" asChild>
            <Link href={`${basePath}/organize`}>
              <Settings className="h-4 w-4" /> Organiser les Nœuds
            </Link>
          </Button>

          {group && <UpdatePhaseGroupDialog group={group} />}

          <Button variant="outline" asChild>
            <Link
              href={`/tournaments/${tournamentId}/editions/${editionId}/dashboard/phases/${group?.phaseId}`}
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Retour
            </Link>
          </Button>
        </div> */}
        <QuicKAction
          basePath={basePath}
          groupId={groupId}
          editionId={editionId}
          group={group}
          tournamentId={tournamentId}
        />
      </div>

      {/* ─── Standings Table ────────────────────────────────────────────── */}
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
                  <TableHead className="text-right w-24">Statut</TableHead>
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
                    const diff = (p.scoreFor ?? 0) - (p.scoreAgainst ?? 0);
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
                          {getName(p.registrationId)}
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

      <div className="grid grid-cols-1 gap-6">
        {/* Participants Management - Refactored to Two-List Layout */}
        <GroupParticipantsManagement
          groupId={groupId}
          editionId={editionId}
          allEditionRegistrations={allRegs}
          groupParticipants={participants}
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
            <BracketNodesList
              groupId={groupId}
              tournamentId={tournamentId}
              editionId={editionId}
              basePath={basePath}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Extracted to an async component to avoid top-level await in JSX iteration
async function BracketNodesList({
  groupId,
  tournamentId,
  editionId,
  basePath,
}: {
  groupId: string;
  tournamentId: string;
  editionId: string;
  basePath: string;
}) {
  const nodesRes = await getBracketNodes({
    filters: { groupId },
    options: { sortBy: "order", sortOrder: "asc" },
    pagination: { page: 1, limit: 200 },
  });
  const nodes = nodesRes.data as any[];

  if (nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <RefreshCcw className="h-12 w-12 mb-3 opacity-20" />
        <p className="text-sm font-medium">Aucun nœud de bracket</p>
        <p className="text-xs">Initialisez la structure de phase.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {nodes.map((node: any) => (
        <div
          key={node.id}
          className="flex flex-col sm:flex-row sm:items-center justify-between border border-primary/5 rounded-xl p-3 bg-card hover:border-primary/20 transition-all hover:shadow-sm gap-3"
        >
          <div className="flex items-center gap-3">
            <div
              className={`h-10 w-10 rounded-lg flex items-center justify-center ${node.bracketType === "LOWER" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}
            >
              <span className="font-bold text-xs">{node.nodeCode || "N"}</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">
                  {node.nodeCode || "Nœud"}
                </span>
                <Badge
                  variant="secondary"
                  className="text-[9px] h-4 py-0 leading-none bg-primary/10 text-primary border-none uppercase tracking-tighter"
                >
                  {node.bracketType || "UPPER"}
                </Badge>
              </div>
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
                Round {node.round} • Match #{node.matchNumber} · Profondeur{" "}
                {node.depth}
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
                  <form
                    action={async () => {
                      "use server";
                      await deleteBracketNode(node.id);
                      revalidatePath(basePath);
                    }}
                  >
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
      ))}
    </div>
  );
}
