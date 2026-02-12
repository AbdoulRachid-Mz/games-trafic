import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { getTournamentPhases } from "@/actions/tournaments";
import { getPhaseGroups } from "@/actions/phases";
import { updateTournamentPhase, createPhaseGroup, updatePhaseGroup, deletePhaseGroup } from "@/actions/phases";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { Settings2, ArrowUp, ArrowDown } from "lucide-react";
import type { TournamentPhase, PhaseGroup } from "@/database/schema";

interface PageProps {
  params: Promise<{
    tournamentId: string;
    editionId: string;
    phaseId: string;
  }>;
}

export default async function PhaseDetailPage({ params }: PageProps) {
  const { tournamentId, editionId, phaseId } = await params;

  const phaseRes = await getTournamentPhases({
    filters: { id: phaseId },
    pagination: { page: 1, limit: 1 },
  });
  const phase = phaseRes.data[0] as TournamentPhase | undefined;
  const groupsRes = await getPhaseGroups({
    filters: { phaseId },
    options: { sortBy: "order", sortOrder: "asc" },
    pagination: { page: 1, limit: 500 },
  });

  async function toggleCompletedAction() {
    "use server";
    await updateTournamentPhase(phaseId, { isCompleted: !(phase?.isCompleted ?? false) });
    revalidatePath(`/tournaments/${tournamentId}/editions/${editionId}/dashboard/phases/${phaseId}`);
  }

  async function createGroupAction(formData: FormData) {
    "use server";
    const name = ((formData.get("name") as string) || "").trim() || "Groupe";
    const existingGroups = await getPhaseGroups({
      filters: { phaseId },
      options: { sortBy: "order", sortOrder: "asc" },
      pagination: { page: 1, limit: 500 },
    });
    const order = (existingGroups?.data?.length || 0) + 1;
    await createPhaseGroup({ phaseId, name, order } as any);
    revalidatePath(`/tournaments/${tournamentId}/editions/${editionId}/dashboard/phases/${phaseId}`);
  }

  async function moveGroupAction(formData: FormData) {
    "use server";
    const id = (formData.get("id") as string) || "";
    const direction = (formData.get("direction") as string) || "up";
    const list = await getPhaseGroups({
      filters: { phaseId },
      options: { sortBy: "order", sortOrder: "asc" },
      pagination: { page: 1, limit: 500 },
    });
    const arr = list.data.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const idx = arr.findIndex((g) => g.id === id);
    const swapWith = direction === "up" ? idx - 1 : idx + 1;
    if (idx === -1 || swapWith < 0 || swapWith >= arr.length) {
      revalidatePath(`/tournaments/${tournamentId}/editions/${editionId}/dashboard/phases/${phaseId}`);
      return;
    }
    const a = arr[idx];
    const b = arr[swapWith];
    await updatePhaseGroup(a.id, { order: b.order ?? swapWith + 1 } as any);
    await updatePhaseGroup(b.id, { order: a.order ?? idx + 1 } as any);
    revalidatePath(`/tournaments/${tournamentId}/editions/${editionId}/dashboard/phases/${phaseId}`);
  }

  async function deleteGroupAction(formData: FormData) {
    "use server";
    const id = (formData.get("id") as string) || "";
    await deletePhaseGroup(id);
    revalidatePath(`/tournaments/${tournamentId}/editions/${editionId}/dashboard/phases/${phaseId}`);
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Typography variant="h3" weight="bold">Gestion de la Phase</Typography>
          <Typography variant="body-sm" theme="muted">Configurez cette phase et ses groupes.</Typography>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/tournaments/${tournamentId}/editions/${editionId}/dashboard/phases`}>Retour</Link>
        </Button>
      </div>

      {phase && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                {phase.name}
                <Badge variant="secondary" className="text-[10px] h-4">{phase.phaseType}</Badge>
              </CardTitle>
              <Typography variant="caption1" theme="muted" className="flex items-center gap-2">
                <Settings2 className="h-3 w-3" /> Ordre: {phase.order} • Statut: {phase.isCompleted ? "Terminé" : "En cours"}
              </Typography>
            </div>
            <form action={toggleCompletedAction}>
              <Button variant={phase.isCompleted ? "outline" : "default"}>
                {phase.isCompleted ? "Marquer en cours" : "Marquer terminé"}
              </Button>
            </form>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Groupes</CardTitle>
          <Dialog>
            <DialogTrigger asChild>
              <Button>Ajouter un groupe</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouveau groupe</DialogTitle>
              </DialogHeader>
              <form action={createGroupAction} className="space-y-3">
                <input
                  name="name"
                  placeholder="Nom du groupe"
                  className="h-9 px-3 py-1 rounded-md border bg-background text-sm w-full"
                  defaultValue={`Groupe ${(groupsRes.data?.length || 0) + 1}`}
                />
                <DialogFooter>
                  <Button type="submit">Créer</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {(groupsRes.data as PhaseGroup[]).map((group) => (
              <div key={group.id} className="border rounded-xl p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Typography variant="body-base" weight="bold">{group.name}</Typography>
                    <Badge variant="secondary" className="text-[10px] h-4">Ordre {group.order}</Badge>
                  </div>
                  <Typography variant="caption1" theme="muted">
                    Participants: {group.participantCount ?? 0} • Matchs: {group.matchCount ?? 0}
                  </Typography>
                </div>
                <div className="flex items-center gap-2">
                  <form action={moveGroupAction}>
                    <input type="hidden" name="id" value={group.id} />
                    <input type="hidden" name="direction" value="up" />
                    <Button variant="outline" size="sm"><ArrowUp className="h-3 w-3" /></Button>
                  </form>
                  <form action={moveGroupAction}>
                    <input type="hidden" name="id" value={group.id} />
                    <input type="hidden" name="direction" value="down" />
                    <Button variant="outline" size="sm"><ArrowDown className="h-3 w-3" /></Button>
                  </form>
                  <Button size="sm" variant="ghost" asChild>
                    <Link href={`/tournaments/${tournamentId}/editions/${editionId}/dashboard/groups/${group.id}`}>Gérer</Link>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="destructive">Supprimer</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer le groupe</AlertDialogTitle>
                        <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <form action={deleteGroupAction}>
                          <input type="hidden" name="id" value={group.id} />
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
