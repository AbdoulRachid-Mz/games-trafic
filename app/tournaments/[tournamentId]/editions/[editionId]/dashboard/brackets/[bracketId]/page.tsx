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

interface PageProps {
  params: Promise<{
    tournamentId: string;
    editionId: string;
    bracketId: string;
  }>;
}

export default async function BracketNodeDetailPage({ params }: PageProps) {
  const { tournamentId, editionId, bracketId } = await params;

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
    revalidatePath(`/tournaments/${tournamentId}/editions/${editionId}/dashboard/brackets/${bracketId}`);
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
    revalidatePath(`/tournaments/${tournamentId}/editions/${editionId}/dashboard/brackets/${bracketId}`);
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Typography variant="h3" weight="bold">Nœud de Bracket</Typography>
          <Typography variant="body-sm" theme="muted">Gérez ce nœud et ses matchs.</Typography>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/tournaments/${tournamentId}/editions/${editionId}/dashboard/phases/${node?.phaseId}`}>Retour</Link>
        </Button>
      </div>

      {node && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                {node.nodeCode || "Nœud"}
                <Badge variant="secondary" className="text-[10px] h-4">{node.bracketType || "UPPER"}</Badge>
              </CardTitle>
              <Typography variant="caption1" theme="muted">
                Round {node.round} • Match #{node.matchNumber}
              </Typography>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Modifier</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Modifier le nœud</DialogTitle>
                </DialogHeader>
                <form action={updateNodeAction} className="space-y-3">
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
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Matchs liés</CardTitle>
          <Dialog>
            <DialogTrigger asChild>
              <Button>Créer un match</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouveau match</DialogTitle>
              </DialogHeader>
              <form action={createMatchAction} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
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
                <div className="grid grid-cols-2 gap-3">
                  <input name="round" type="number" min={1} defaultValue={node?.round || 1} className="h-9 px-3 py-1 rounded-md border bg-background text-sm w-full" placeholder="Round" />
                  <input name="matchNumber" type="number" min={1} defaultValue={node?.matchNumber || 1} className="h-9 px-3 py-1 rounded-md border bg-background text-sm w-full" placeholder="Match #" />
                </div>
                <input name="scheduledTime" type="datetime-local" className="h-9 px-3 py-1 rounded-md border bg-background text-sm w-full" />
                <select name="format" className="h-9 px-3 py-1 rounded-md border bg-background text-sm w-full">
                  <option value="BEST_OF_1">Aller simple</option>
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
          <div className="grid gap-3">
            {(matchesRes.data as Match[]).map((m) => {
              const reg1 = (regsRes.data as EditionRegistration[]).find((r: any) => r.id === m.participant1RegistrationId) as any;
              const reg2 = (regsRes.data as EditionRegistration[]).find((r: any) => r.id === m.participant2RegistrationId) as any;
              const name1 = reg1?.member?.displayName || reg1?.member?.user?.username || reg1?.member?.team?.name || "Joueur 1";
              const name2 = reg2?.member?.displayName || reg2?.member?.user?.username || reg2?.member?.team?.name || "Joueur 2";
              return (
                <div key={m.id} className="border rounded-xl p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <Typography variant="body-base" weight="bold">Match {m.matchNumber} • Round {m.round}</Typography>
                    <Typography variant="caption1" theme="muted">
                      {name1} vs {name2} • {m.scheduledTime ? format(new Date(m.scheduledTime), "d MMM HH:mm", { locale: fr }) : "à planifier"}
                    </Typography>
                  </div>
                  <div className="flex items-center gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm">Modifier</Button>
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
                          revalidatePath(`/tournaments/${tournamentId}/editions/${editionId}/dashboard/brackets/${bracketId}`);
                        }} className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <input name="score1" type="number" defaultValue={m.score1 ?? undefined} className="h-9 px-3 py-1 rounded-md border bg-background text-sm w-full" placeholder="Score 1" />
                            <input name="score2" type="number" defaultValue={m.score2 ?? undefined} className="h-9 px-3 py-1 rounded-md border bg-background text-sm w-full" placeholder="Score 2" />
                          </div>
                          <input name="scheduledTime" type="datetime-local" defaultValue={m.scheduledTime ? new Date(m.scheduledTime).toISOString().slice(0,16) : ""} className="h-9 px-3 py-1 rounded-md border bg-background text-sm w-full" />
                          <DialogFooter>
                            <Button type="submit">Enregistrer</Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive">Supprimer</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer le match</AlertDialogTitle>
                          <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <form action={async () => {
                            "use server";
                            await deleteMatch(m.id);
                            revalidatePath(`/tournaments/${tournamentId}/editions/${editionId}/dashboard/brackets/${bracketId}`);
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
        </CardContent>
      </Card>
    </div>
  );
}
