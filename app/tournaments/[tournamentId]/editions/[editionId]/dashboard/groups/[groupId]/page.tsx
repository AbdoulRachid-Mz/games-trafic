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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { getPhaseGroupById, getPhaseGroupParticipants, createPhaseGroupParticipant, deletePhaseGroupParticipant, getBracketNodes, createBracketNode, updateBracketNode, deleteBracketNode } from "@/actions/phases";
import { getEditionRegistrations, createMatch } from "@/actions/tournaments";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import type { PhaseGroup, PhaseGroupParticipant, EditionRegistration } from "@/database/schema";
import { ArrowLeft, Plus, Trophy, Swords, UserPlus, Trash2, Lock, Unlock } from "lucide-react";

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

  const group = await getPhaseGroupById(groupId, { populate: ["phase"] }) as PhaseGroup | null;
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
    const gdDiff = ((b.scoreFor ?? 0) - (b.scoreAgainst ?? 0)) - ((a.scoreFor ?? 0) - (a.scoreAgainst ?? 0));
    if (gdDiff !== 0) return gdDiff;
    return (b.scoreFor ?? 0) - (a.scoreFor ?? 0);
  });

  // Global stats
  const totalMatches = standings.reduce((acc, p) => acc + (p.matchesPlayed ?? 0), 0) / 2;
  const totalGoals = standings.reduce((acc, p) => acc + (p.scoreFor ?? 0), 0);

  function getName(registrationId: string | null | undefined) {
    const reg = allRegs.find((r: any) => r.id === registrationId);
    return reg?.member?.displayName || reg?.member?.user?.username || reg?.member?.team?.name || "Joueur";
  }

  // Server actions
  async function addParticipantAction(formData: FormData) {
    "use server";
    const registrationId = (formData.get("registrationId") as string) || "";
    if (registrationId) {
      await createPhaseGroupParticipant({ groupId, registrationId } as any);
    }
    revalidatePath(basePath);
  }

  async function removeParticipantAction(formData: FormData) {
    "use server";
    const id = (formData.get("id") as string) || "";
    await deletePhaseGroupParticipant(id);
    revalidatePath(basePath);
  }

  async function generateGroupMatchesAction(formData: FormData) {
    "use server";
    const format = (formData.get("format") as string) || "SINGLE";
    const list = await getPhaseGroupParticipants({
      filters: { groupId },
      pagination: { page: 1, limit: 500 },
    });
    const items = list.data as PhaseGroupParticipant[];
    const regIds = items.map((p) => p.registrationId).filter(Boolean) as string[];
    let counter = 1;
    for (let i = 0; i < regIds.length; i++) {
      for (let j = i + 1; j < regIds.length; j++) {
        if (format === "HOME_AWAY") {
          await createMatch({
            editionId,
            phaseId: group?.phaseId || "",
            groupId,
            round: 1,
            matchNumber: counter++,
            participant1RegistrationId: regIds[i],
            participant2RegistrationId: regIds[j],
            metadata: { format: "HOME_AWAY", leg: 1 },
          } as any);
          await createMatch({
            editionId,
            phaseId: group?.phaseId || "",
            groupId,
            round: 1,
            matchNumber: counter++,
            participant1RegistrationId: regIds[j],
            participant2RegistrationId: regIds[i],
            metadata: { format: "HOME_AWAY", leg: 2 },
          } as any);
        } else {
          await createMatch({
            editionId,
            phaseId: group?.phaseId || "",
            groupId,
            round: 1,
            matchNumber: counter++,
            participant1RegistrationId: regIds[i],
            participant2RegistrationId: regIds[j],
            metadata: { format: "BEST_OF_1" },
          } as any);
        }
      }
    }
    revalidatePath(basePath);
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Typography variant="h3" weight="bold">{group?.name || "Groupe"}</Typography>
            <Badge variant="secondary" className="text-xs">Ordre {group?.order}</Badge>
            {group?.isLocked && (
              <Badge className="bg-amber-600 text-white text-xs gap-1"><Lock className="h-3 w-3" /> Verrouillé</Badge>
            )}
          </div>
          <Typography variant="body-sm" theme="muted">
            {participants.length} participant{participants.length > 1 ? "s" : ""} · {Math.round(totalMatches)} match{totalMatches > 1 ? "s" : ""} · {totalGoals} but{totalGoals > 1 ? "s" : ""}
          </Typography>
        </div>
        <div className="flex items-center gap-2">
          {/* Generate matches */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-1.5">
                <Swords className="h-4 w-4" /> Générer matchs
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Générer les matchs du groupe</DialogTitle>
                <DialogDescription>Tous les participants seront opposés.</DialogDescription>
              </DialogHeader>
              <form action={generateGroupMatchesAction} className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Format</label>
                  <select name="format" className="h-9 px-3 py-1 rounded-md border bg-background text-sm w-full">
                    <option value="SINGLE">Aller simple</option>
                    <option value="HOME_AWAY">Aller-retour</option>
                  </select>
                </div>
                <DialogFooter>
                  <Button type="submit"><Swords className="mr-2 h-4 w-4" /> Générer</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Button variant="outline" asChild>
            <Link href={`/tournaments/${tournamentId}/editions/${editionId}/dashboard/phases/${group?.phaseId}`}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Retour
            </Link>
          </Button>
        </div>
      </div>

      {/* ─── Standings Table ────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" /> Classement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 text-center">#</TableHead>
                  <TableHead>Joueur</TableHead>
                  <TableHead className="text-center w-12">Pts</TableHead>
                  <TableHead className="text-center w-10">J</TableHead>
                  <TableHead className="text-center w-10">G</TableHead>
                  <TableHead className="text-center w-10">N</TableHead>
                  <TableHead className="text-center w-10">P</TableHead>
                  <TableHead className="text-center w-14">BP</TableHead>
                  <TableHead className="text-center w-14">BC</TableHead>
                  <TableHead className="text-center w-14">Diff</TableHead>
                  <TableHead className="text-center w-14">Q</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {standings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                      Aucun participant dans ce groupe.
                    </TableCell>
                  </TableRow>
                ) : (
                  standings.map((p, idx) => {
                    const diff = (p.scoreFor ?? 0) - (p.scoreAgainst ?? 0);
                    return (
                      <TableRow key={p.id} className={p.qualified ? "bg-green-50/50 dark:bg-green-900/10" : ""}>
                        <TableCell className="text-center font-bold text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell className="font-semibold text-sm whitespace-nowrap">{getName(p.registrationId)}</TableCell>
                        <TableCell className="text-center font-bold text-primary">{p.points ?? 0}</TableCell>
                        <TableCell className="text-center text-sm">{p.matchesPlayed ?? 0}</TableCell>
                        <TableCell className="text-center text-sm text-green-600">{p.matchesWon ?? 0}</TableCell>
                        <TableCell className="text-center text-sm text-amber-600">{p.matchesDrawn ?? 0}</TableCell>
                        <TableCell className="text-center text-sm text-red-600">{p.matchesLost ?? 0}</TableCell>
                        <TableCell className="text-center text-sm">{p.scoreFor ?? 0}</TableCell>
                        <TableCell className="text-center text-sm">{p.scoreAgainst ?? 0}</TableCell>
                        <TableCell className={`text-center text-sm font-semibold ${diff > 0 ? "text-green-600" : diff < 0 ? "text-red-600" : ""}`}>
                          {diff > 0 ? `+${diff}` : diff}
                        </TableCell>
                        <TableCell className="text-center">
                          {p.qualified ? (
                            <Badge className="bg-green-600 text-white text-[10px] px-1.5">Qualifié</Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
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

      {/* ─── Participants Management ──────────────────────────────────── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-sm font-medium">Participants du groupe</CardTitle>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5">
                <UserPlus className="h-3.5 w-3.5" /> Ajouter
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter un participant</DialogTitle>
              </DialogHeader>
              <form action={addParticipantAction} className="space-y-3">
                <select name="registrationId" className="h-9 px-3 py-1 rounded-md border bg-background text-sm w-full">
                  {allRegs.map((reg: any) => (
                    <option key={reg.id} value={reg.id}>{getName(reg.id)}</option>
                  ))}
                </select>
                <DialogFooter>
                  <Button type="submit"><Plus className="mr-2 h-4 w-4" /> Ajouter</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {participants.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                Ajoutez des participants pour constituer ce groupe.
              </div>
            ) : (
              participants.map((p) => (
                <div key={p.id} className="flex items-center justify-between border rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-sm">{getName(p.registrationId)}</span>
                    <Badge variant="outline" className="text-xs">{p.points ?? 0} pts</Badge>
                    {p.qualified && (
                      <Badge className="bg-green-600 text-white text-[10px] px-1.5">Q</Badge>
                    )}
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Retirer « {getName(p.registrationId)} »</AlertDialogTitle>
                        <AlertDialogDescription>Le participant sera retiré du groupe. Les matchs existants ne seront pas supprimés.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <form action={removeParticipantAction}>
                          <input type="hidden" name="id" value={p.id} />
                          <AlertDialogAction type="submit" className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Retirer
                          </AlertDialogAction>
                        </form>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* ─── Bracket Nodes ───────────────────────────────────────────── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-sm font-medium">Bracket Nodes</CardTitle>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Nœud
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouveau nœud de bracket</DialogTitle>
              </DialogHeader>
              <form action={async (formData: FormData) => {
                "use server";
                const nodeCode = ((formData.get("nodeCode") as string) || "").trim() || `G${group?.order}-N${Date.now()}`;
                const round = Number(formData.get("round") || 1);
                const matchNumber = Number(formData.get("matchNumber") || 1);
                const bracketType = (formData.get("bracketType") as string) || "UPPER";
                await createBracketNode({
                  phaseId: group?.phaseId || "",
                  groupId,
                  nodeCode,
                  round,
                  matchNumber,
                  bracketType,
                } as any);
                revalidatePath(basePath);
              }} className="space-y-3">
                <input name="nodeCode" className="h-9 px-3 py-1 rounded-md border bg-background text-sm w-full" placeholder="Code du nœud (ex: U1-1)" />
                <div className="grid grid-cols-2 gap-3">
                  <input name="round" type="number" min={1} className="h-9 px-3 py-1 rounded-md border bg-background text-sm w-full" placeholder="Round" defaultValue={1} />
                  <input name="matchNumber" type="number" min={1} className="h-9 px-3 py-1 rounded-md border bg-background text-sm w-full" placeholder="Match #" defaultValue={1} />
                </div>
                <select name="bracketType" className="h-9 px-3 py-1 rounded-md border bg-background text-sm w-full">
                  <option value="UPPER">Upper</option>
                  <option value="LOWER">Lower</option>
                  <option value="FINAL">Final</option>
                </select>
                <DialogFooter>
                  <Button type="submit">Créer</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <BracketNodesList
            groupId={groupId}
            tournamentId={tournamentId}
            editionId={editionId}
            basePath={basePath}
          />
        </CardContent>
      </Card>
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
    return <div className="text-center py-6 text-muted-foreground text-sm">Aucun nœud de bracket.</div>;
  }

  return (
    <div className="space-y-2">
      {nodes.map((node: any) => (
        <div key={node.id} className="flex flex-col sm:flex-row sm:items-center justify-between border rounded-lg p-3 gap-2">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">{node.nodeCode || "Nœud"}</span>
              <Badge variant="secondary" className="text-[10px] h-4">{node.bracketType || "UPPER"}</Badge>
            </div>
            <span className="text-xs text-muted-foreground">
              Round {node.round} · Match #{node.matchNumber}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8">Modifier</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Modifier le nœud</DialogTitle>
                </DialogHeader>
                <form action={async (formData: FormData) => {
                  "use server";
                  const nodeCode = ((formData.get("nodeCode") as string) || "").trim();
                  const round = Number(formData.get("round") || node.round || 1);
                  const matchNumber = Number(formData.get("matchNumber") || node.matchNumber || 1);
                  const bracketType = (formData.get("bracketType") as string) || node.bracketType || "UPPER";
                  await updateBracketNode(node.id, { nodeCode, round, matchNumber, bracketType } as any);
                  revalidatePath(basePath);
                }} className="space-y-3">
                  <input name="nodeCode" defaultValue={node.nodeCode || ""} className="h-9 px-3 py-1 rounded-md border bg-background text-sm w-full" placeholder="Code du nœud" />
                  <div className="grid grid-cols-2 gap-3">
                    <input name="round" type="number" min={1} defaultValue={node.round || 1} className="h-9 px-3 py-1 rounded-md border bg-background text-sm w-full" placeholder="Round" />
                    <input name="matchNumber" type="number" min={1} defaultValue={node.matchNumber || 1} className="h-9 px-3 py-1 rounded-md border bg-background text-sm w-full" placeholder="Match #" />
                  </div>
                  <select name="bracketType" defaultValue={node.bracketType || "UPPER"} className="h-9 px-3 py-1 rounded-md border bg-background text-sm w-full">
                    <option value="UPPER">Upper</option>
                    <option value="LOWER">Lower</option>
                    <option value="FINAL">Final</option>
                  </select>
                  <DialogFooter>
                    <Button type="submit">Enregistrer</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            <Button size="sm" variant="outline" className="h-8" asChild>
              <Link href={`/tournaments/${tournamentId}/editions/${editionId}/dashboard/brackets/${node.id}`}>Gérer</Link>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Supprimer « {node.nodeCode || "Nœud"} »</AlertDialogTitle>
                  <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <form action={async () => {
                    "use server";
                    await deleteBracketNode(node.id);
                    revalidatePath(basePath);
                  }}>
                    <AlertDialogAction type="submit" className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Supprimer
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
