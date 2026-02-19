import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { getBracketNodeById, updateBracketNode, getPhaseGroupParticipants } from "@/actions/phases";
import { getEditionRegistrations, getMatches, createMatch } from "@/actions/tournaments";
import { updateMatch, deleteMatch } from "@/actions/phases";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import type { BracketNode, PhaseGroupParticipant, EditionRegistration, Match } from "@/database/schema";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, Plus, Swords, Clock, CheckCircle, XCircle, Pause } from "lucide-react";

interface PageProps {
  params: Promise<{
    tournamentId: string;
    editionId: string;
    bracketId: string;
  }>;
}

function getMatchStatusBadge(m: Match) {
  if (m.status === "COMPLETED" || (m.score1 != null && m.score2 != null)) {
    return <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px]"><CheckCircle className="h-3 w-3 mr-1" />Terminé</Badge>;
  }
  if (m.status === "IN_PROGRESS") {
    return <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-[10px]"><Pause className="h-3 w-3 mr-1" />En cours</Badge>;
  }
  if (m.status === "CANCELLED") {
    return <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px]"><XCircle className="h-3 w-3 mr-1" />Annulé</Badge>;
  }
  return <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px]"><Clock className="h-3 w-3 mr-1" />En attente</Badge>;
}

export default async function BracketNodeDetailPage({ params }: PageProps) {
  const { tournamentId, editionId, bracketId } = await params;
  const basePath = `/tournaments/${tournamentId}/editions/${editionId}/dashboard`;

  const node = await getBracketNodeById(bracketId, { populate: ["phase", "group"] }) as BracketNode | null;
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

  async function updateNodeAction(formData: FormData) {
    "use server";
    const nodeCode = ((formData.get("nodeCode") as string) || "").trim();
    const round = Number(formData.get("round") || 1);
    const matchNumber = Number(formData.get("matchNumber") || 1);
    const bracketType = (formData.get("bracketType") as string) || "UPPER";
    await updateBracketNode(bracketId, { nodeCode, round, matchNumber, bracketType } as any);
    revalidatePath(`${basePath}/brackets/${bracketId}`);
  }

  async function createMatchAction(formData: FormData) {
    "use server";
    const participant1RegistrationId = (formData.get("p1") as string) || "";
    const participant2RegistrationId = (formData.get("p2") as string) || "";
    const round = Number(formData.get("round") || node?.round || 1);
    const matchNumber = Number(formData.get("matchNumber") || node?.matchNumber || 1);
    const scheduledTime = formData.get("scheduledTime") ? new Date(formData.get("scheduledTime") as string) : undefined;
    const formatOpt = (formData.get("format") as string) || "BEST_OF_1";
    await createMatch({
      editionId,
      phaseId: node?.phaseId || "",
      groupId: node?.groupId || null as any,
      bracketNodeId: bracketId,
      round,
      matchNumber,
      participant1RegistrationId,
      participant2RegistrationId,
      scheduledTime,
      metadata: { format: formatOpt },
    } as any);
    revalidatePath(`${basePath}/brackets/${bracketId}`);
  }

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
            <Button variant="ghost" size="sm" className="h-7 px-2 -ml-2" asChild>
              <Link href={`${basePath}/phases/${node?.phaseId}`}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Phase
              </Link>
            </Button>
          </div>
          <Typography variant="h3" weight="bold">
            Nœud {node?.nodeCode || bracketId.slice(0, 6)}
          </Typography>
        </div>
      </div>

      {/* Node info card */}
      {node && (
        <Card>
          <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={`border text-xs font-semibold ${bracketTypeColor[node.bracketType || "UPPER"] || bracketTypeColor.UPPER}`}>
                    {node.bracketType || "UPPER"} Bracket
                  </Badge>
                  <Badge variant="outline" className="text-xs">Round {node.round}</Badge>
                  <Badge variant="outline" className="text-xs">Match #{node.matchNumber}</Badge>
                </div>
                <Typography variant="caption1" theme="muted">
                  {(matchesRes.data as Match[]).length} match(s) associé(s)
                </Typography>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">Modifier le nœud</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Modifier le nœud</DialogTitle>
                  </DialogHeader>
                  <form action={updateNodeAction} className="space-y-3">
                    <input name="nodeCode" defaultValue={node.nodeCode || ""} className="h-9 px-3 py-1 rounded-md border bg-background text-sm w-full" placeholder="Code du nœud (ex: QF1)" />
                    <div className="grid grid-cols-2 gap-3">
                      <input name="round" type="number" min={1} defaultValue={node.round || 1} className="h-9 px-3 py-1 rounded-md border bg-background text-sm w-full" placeholder="Round" />
                      <input name="matchNumber" type="number" min={1} defaultValue={node.matchNumber || 1} className="h-9 px-3 py-1 rounded-md border bg-background text-sm w-full" placeholder="Match #" />
                    </div>
                    <select name="bracketType" defaultValue={node.bracketType || "UPPER"} className="h-9 px-3 py-1 rounded-md border bg-background text-sm w-full">
                      <option value="UPPER">Upper Bracket</option>
                      <option value="LOWER">Lower Bracket</option>
                      <option value="FINAL">Grand Final</option>
                    </select>
                    <DialogFooter>
                      <Button type="submit">Enregistrer</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
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
            <Badge variant="secondary" className="text-xs">{(matchesRes.data as Match[]).length}</Badge>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1.5" /> Créer un match</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouveau match</DialogTitle>
              </DialogHeader>
              <form action={createMatchAction} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Joueur 1</label>
                    <select name="p1" className="h-9 px-3 py-1 rounded-md border bg-background text-sm w-full">
                      {(groupParticipantsRes.data as PhaseGroupParticipant[]).map((p) => {
                        const reg = (regsRes.data as EditionRegistration[]).find((r: any) => r.id === p.registrationId) as any;
                        const name =
                          reg?.member?.displayName ||
                          reg?.member?.user?.username ||
                          reg?.member?.team?.name ||
                          "Joueur";
                        return <option key={p.id} value={p.registrationId}>{name}</option>;
                      })}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Joueur 2</label>
                    <select name="p2" className="h-9 px-3 py-1 rounded-md border bg-background text-sm w-full">
                      {(groupParticipantsRes.data as PhaseGroupParticipant[]).map((p) => {
                        const reg = (regsRes.data as EditionRegistration[]).find((r: any) => r.id === p.registrationId) as any;
                        const name =
                          reg?.member?.displayName ||
                          reg?.member?.user?.username ||
                          reg?.member?.team?.name ||
                          "Joueur";
                        return <option key={p.id} value={p.registrationId}>{name}</option>;
                      })}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input name="round" type="number" min={1} defaultValue={node?.round || 1} className="h-9 px-3 py-1 rounded-md border bg-background text-sm w-full" placeholder="Round" />
                  <input name="matchNumber" type="number" min={1} defaultValue={node?.matchNumber || 1} className="h-9 px-3 py-1 rounded-md border bg-background text-sm w-full" placeholder="Match #" />
                </div>
                <input name="scheduledTime" type="datetime-local" className="h-9 px-3 py-1 rounded-md border bg-background text-sm w-full" />
                <select name="format" className="h-9 px-3 py-1 rounded-md border bg-background text-sm w-full">
                  <option value="BEST_OF_1">Aller simple (BO1)</option>
                  <option value="BEST_OF_3">BO3</option>
                  <option value="BEST_OF_5">BO5</option>
                  <option value="HOME_AWAY">Aller-retour</option>
                </select>
                <DialogFooter>
                  <Button type="submit">Créer</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
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
                const reg1 = (regsRes.data as EditionRegistration[]).find((r: any) => r.id === m.participant1RegistrationId) as any;
                const reg2 = (regsRes.data as EditionRegistration[]).find((r: any) => r.id === m.participant2RegistrationId) as any;
                const name1 = reg1?.member?.displayName || reg1?.member?.user?.username || reg1?.member?.team?.name || "Joueur 1";
                const name2 = reg2?.member?.displayName || reg2?.member?.user?.username || reg2?.member?.team?.name || "Joueur 2";
                const isCompleted = m.status === "COMPLETED" || (m.score1 != null && m.score2 != null);

                return (
                  <div key={m.id} className="border rounded-xl p-4 space-y-3 hover:bg-muted/30 transition-colors">
                    {/* Match header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Typography variant="body-base" weight="bold">Match {m.matchNumber}</Typography>
                        <Badge variant="outline" className="text-[10px]">Round {m.round}</Badge>
                        {getMatchStatusBadge(m)}
                      </div>
                      <Typography variant="caption1" theme="muted">
                        {m.scheduledTime ? format(new Date(m.scheduledTime), "d MMM HH:mm", { locale: fr }) : "À planifier"}
                      </Typography>
                    </div>

                    {/* Players + Score */}
                    <div className="flex items-center justify-center gap-4 py-2">
                      <div className="flex-1 text-right">
                        <span className={`text-sm font-medium ${isCompleted && (m.score1 ?? 0) > (m.score2 ?? 0) ? "text-green-600 font-bold" : ""}`}>
                          {name1}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-lg font-black tabular-nums w-8 text-center">{m.score1 ?? "-"}</span>
                        <span className="text-muted-foreground text-xs">VS</span>
                        <span className="text-lg font-black tabular-nums w-8 text-center">{m.score2 ?? "-"}</span>
                      </div>
                      <div className="flex-1">
                        <span className={`text-sm font-medium ${isCompleted && (m.score2 ?? 0) > (m.score1 ?? 0) ? "text-green-600 font-bold" : ""}`}>
                          {name2}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 justify-end">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-xs h-7">Modifier</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Modifier le match</DialogTitle>
                          </DialogHeader>
                          <form action={async (formData: FormData) => {
                            "use server";
                            const score1 = formData.get("score1") ? Number(formData.get("score1")) : null;
                            const score2 = formData.get("score2") ? Number(formData.get("score2")) : null;
                            const scheduledTime = formData.get("scheduledTime") ? new Date(formData.get("scheduledTime") as string) : undefined;
                            await updateMatch(m.id, { score1: score1 as any, score2: score2 as any, scheduledTime } as any);
                            revalidatePath(`${basePath}/brackets/${bracketId}`);
                          }} className="space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="flex-1">
                                <label className="text-xs text-muted-foreground mb-1 block">{name1}</label>
                                <input name="score1" type="number" defaultValue={m.score1 ?? undefined} className="h-9 px-3 py-1 rounded-md border bg-background text-sm w-full text-center font-bold" placeholder="0" />
                              </div>
                              <span className="text-xs text-muted-foreground pt-4">VS</span>
                              <div className="flex-1">
                                <label className="text-xs text-muted-foreground mb-1 block">{name2}</label>
                                <input name="score2" type="number" defaultValue={m.score2 ?? undefined} className="h-9 px-3 py-1 rounded-md border bg-background text-sm w-full text-center font-bold" placeholder="0" />
                              </div>
                            </div>
                            <input name="scheduledTime" type="datetime-local" defaultValue={m.scheduledTime ? new Date(m.scheduledTime).toISOString().slice(0, 16) : ""} className="h-9 px-3 py-1 rounded-md border bg-background text-sm w-full" />
                            <DialogFooter>
                              <Button type="submit">Enregistrer</Button>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive text-xs h-7">Supprimer</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer le match</AlertDialogTitle>
                            <AlertDialogDescription>
                              Cette action supprimera {name1} vs {name2} de façon irréversible.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <form action={async () => {
                              "use server";
                              await deleteMatch(m.id);
                              revalidatePath(`${basePath}/brackets/${bracketId}`);
                            }}>
                              <AlertDialogAction type="submit" variant="destructive">Supprimer</AlertDialogAction>
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
