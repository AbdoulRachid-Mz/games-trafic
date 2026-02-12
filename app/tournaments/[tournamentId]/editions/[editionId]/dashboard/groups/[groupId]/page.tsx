import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { getPhaseGroupById, getPhaseGroupParticipants, createPhaseGroupParticipant, deletePhaseGroupParticipant, getBracketNodes, createBracketNode, updateBracketNode, deleteBracketNode } from "@/actions/phases";
import { getEditionRegistrations, createMatch } from "@/actions/tournaments";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import type { PhaseGroup, PhaseGroupParticipant, EditionRegistration } from "@/database/schema";

interface PageProps {
  params: Promise<{
    tournamentId: string;
    editionId: string;
    groupId: string;
  }>;
}

export default async function GroupDetailPage({ params }: PageProps) {
  const { tournamentId, editionId, groupId } = await params;

  const group = await getPhaseGroupById(groupId, { populate: ["phase"] }) as PhaseGroup | null;
  const participantsRes = await getPhaseGroupParticipants({
    filters: { groupId },
    options: { sortBy: "position", sortOrder: "asc" },
    pagination: { page: 1, limit: 500 },
  });
  const regsRes = await getEditionRegistrations({
    filters: { editionId },
    options: { populate: ["member", "member.user", "member.team"] },
    pagination: { page: 1, limit: 500 },
  });

  async function addParticipantAction(formData: FormData) {
    "use server";
    const registrationId = (formData.get("registrationId") as string) || "";
    if (registrationId) {
      await createPhaseGroupParticipant({ groupId, registrationId } as any);
    }
    revalidatePath(`/tournaments/${tournamentId}/editions/${editionId}/dashboard/groups/${groupId}`);
  }

  async function removeParticipantAction(formData: FormData) {
    "use server";
    const id = (formData.get("id") as string) || "";
    await deletePhaseGroupParticipant(id);
    revalidatePath(`/tournaments/${tournamentId}/editions/${editionId}/dashboard/groups/${groupId}`);
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
    revalidatePath(`/tournaments/${tournamentId}/editions/${editionId}/dashboard/groups/${groupId}`);
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Typography variant="h3" weight="bold">Gestion du Groupe</Typography>
          <Typography variant="body-sm" theme="muted">Configurez ce groupe et ses participants.</Typography>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/tournaments/${tournamentId}/editions/${editionId}/dashboard/phases/${group?.phaseId}`}>Retour</Link>
        </Button>
      </div>

      {group && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                {group.name}
                <Badge variant="secondary" className="text-[10px] h-4">Ordre {group.order}</Badge>
              </CardTitle>
              <Typography variant="caption1" theme="muted">
                Participants: {group.participantCount ?? 0} • Matchs: {group.matchCount ?? 0}
              </Typography>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Générer les matchs</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Générer les matchs du groupe</DialogTitle>
                </DialogHeader>
                <form action={generateGroupMatchesAction} className="space-y-3">
                  <select name="format" className="h-9 px-3 py-1 rounded-md border bg-background text-sm w-full">
                    <option value="SINGLE">Aller simple</option>
                    <option value="HOME_AWAY">Aller-retour</option>
                  </select>
                  <DialogFooter>
                    <Button type="submit">Générer</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Participants du groupe</CardTitle>
          <Dialog>
            <DialogTrigger asChild>
              <Button>Ajouter un participant</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter un participant</DialogTitle>
              </DialogHeader>
              <form action={addParticipantAction} className="space-y-3">
                <select name="registrationId" className="h-9 px-3 py-1 rounded-md border bg-background text-sm w-full">
                  {(regsRes.data as any[]).map((reg: any) => {
                    const name =
                      reg.member?.displayName ||
                      reg.member?.user?.username ||
                      reg.member?.team?.name ||
                      "Joueur";
                    return (
                      <option key={reg.id} value={reg.id}>{name}</option>
                    );
                  })}
                </select>
                <DialogFooter>
                  <Button type="submit">Ajouter</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {(participantsRes.data as PhaseGroupParticipant[]).map((p) => {
              const reg = (regsRes.data as EditionRegistration[]).find((r: any) => r.id === p.registrationId) as any;
              const name =
                reg?.member?.displayName ||
                reg?.member?.user?.username ||
                reg?.member?.team?.name ||
                "Joueur";
              return (
                <div key={p.id} className="border rounded-xl p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <Typography variant="body-base" weight="bold">{name}</Typography>
                    <Typography variant="caption1" theme="muted">Points {p.points ?? 0}</Typography>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="destructive">Retirer</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Retirer le participant</AlertDialogTitle>
                        <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <form action={removeParticipantAction}>
                          <input type="hidden" name="id" value={p.id} />
                          <AlertDialogAction type="submit" variant="destructive">Retirer</AlertDialogAction>
                        </form>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Brackets du groupe</CardTitle>
          <Dialog>
            <DialogTrigger asChild>
              <Button>Ajouter un nœud</Button>
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
                revalidatePath(`/tournaments/${tournamentId}/editions/${editionId}/dashboard/groups/${groupId}`);
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
          <div className="grid gap-3">
            {((await getBracketNodes({
              filters: { groupId },
              options: { sortBy: "order", sortOrder: "asc" },
              pagination: { page: 1, limit: 200 },
            })).data as any[]).map((node: any) => (
              <div key={node.id} className="border rounded-xl p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Typography variant="body-base" weight="bold">{node.nodeCode || "Nœud"}</Typography>
                    <Badge variant="secondary" className="text-[10px] h-4">{node.bracketType || "UPPER"}</Badge>
                  </div>
                  <Typography variant="caption1" theme="muted">
                    Round {node.round} • Match #{node.matchNumber}
                  </Typography>
                </div>
                <div className="flex items-center gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm">Modifier</Button>
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
                        revalidatePath(`/tournaments/${tournamentId}/editions/${editionId}/dashboard/groups/${groupId}`);
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
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/tournaments/${tournamentId}/editions/${editionId}/dashboard/brackets/${node.id}`}>Gérer</Link>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="destructive">Supprimer</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer le nœud</AlertDialogTitle>
                        <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <form action={async () => {
                          "use server";
                          await deleteBracketNode(node.id);
                          revalidatePath(`/tournaments/${tournamentId}/editions/${editionId}/dashboard/groups/${groupId}`);
                        }}>
                          <AlertDialogAction type="submit" variant="destructive">Supprimer</AlertDialogAction>
                        </form>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
