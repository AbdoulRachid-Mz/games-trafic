import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, GitBranch, AlertCircle, ArrowRight, Settings2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TournamentPhase } from "@/database/schema";
import { getTournamentPhases, createTournamentPhase, getEditionRegistrations, createMatch, getMatches } from "@/actions/tournaments";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { revalidatePath } from "next/cache";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { updateTournamentPhase, deleteTournamentPhase } from "@/actions/phases";
import Link from "next/link";

interface PageProps {
  params: Promise<{
    tournamentId: string;
    editionId: string;
  }>;
}

export default async function DashboardPhasesPage({ params }: PageProps) {
  const { tournamentId, editionId } = await params;

  const phasesResponse = await getTournamentPhases({
    filters: { editionId },
    options: { sortBy: "order", sortOrder: "asc" },
  });

  const phases = phasesResponse.data;

  async function createPhaseAction(formData: FormData) {
    "use server";
    const editionIdForm = (formData.get("editionId") as string) || "";
    const tournamentIdForm = (formData.get("tournamentId") as string) || "";
    const name = ((formData.get("name") as string) || "").trim() || "Nouvelle phase";
    const phaseType = ((formData.get("phaseType") as string) || "ELIMINATION").trim();

    const existing = await getTournamentPhases({
      filters: { editionId: editionIdForm },
      options: { sortBy: "order", sortOrder: "asc" },
      pagination: { page: 1, limit: 500 },
    });
    const order = (existing?.data?.length || 0) + 1;

    await createTournamentPhase({
      editionId: editionIdForm,
      name,
      phaseType: phaseType as any,
      order,
    });

    revalidatePath(`/tournaments/${tournamentIdForm}/editions/${editionIdForm}/dashboard/phases`);
  }

  async function updatePhaseAction(formData: FormData) {
    "use server";
    const id = (formData.get("id") as string) || "";
    const name = ((formData.get("name") as string) || "").trim();
    const phaseType = (formData.get("phaseType") as string) as any;
    await updateTournamentPhase(id, { name, phaseType });
    const editionIdForm = (formData.get("editionId") as string) || editionId;
    const tournamentIdForm = (formData.get("tournamentId") as string) || tournamentId;
    revalidatePath(`/tournaments/${tournamentIdForm}/editions/${editionIdForm}/dashboard/phases`);
  }

  async function deletePhaseAction(formData: FormData) {
    "use server";
    const id = (formData.get("id") as string) || "";
    await deleteTournamentPhase(id);
    const editionIdForm = (formData.get("editionId") as string) || editionId;
    const tournamentIdForm = (formData.get("tournamentId") as string) || tournamentId;
    revalidatePath(`/tournaments/${tournamentIdForm}/editions/${editionIdForm}/dashboard/phases`);
  }

  async function setActivePhaseAction(formData: FormData) {
    "use server";
    const id = (formData.get("id") as string) || "";
    const editionIdForm = (formData.get("editionId") as string) || editionId;
    const tournamentIdForm = (formData.get("tournamentId") as string) || tournamentId;
    const list = await getTournamentPhases({
      filters: { editionId: editionIdForm },
      options: { sortBy: "order", sortOrder: "asc" },
      pagination: { page: 1, limit: 500 },
    });
    for (const p of list.data) {
      await updateTournamentPhase(p.id, { isActive: p.id === id });
    }
    revalidatePath(`/tournaments/${tournamentIdForm}/editions/${editionIdForm}/dashboard/phases`);
  }

  async function movePhaseAction(formData: FormData) {
    "use server";
    const id = (formData.get("id") as string) || "";
    const direction = (formData.get("direction") as string) || "up";
    const editionIdForm = (formData.get("editionId") as string) || editionId;
    const tournamentIdForm = (formData.get("tournamentId") as string) || tournamentId;
    const list = await getTournamentPhases({
      filters: { editionId: editionIdForm },
      options: { sortBy: "order", sortOrder: "asc" },
      pagination: { page: 1, limit: 500 },
    });
    const phasesArr = list.data.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const idx = phasesArr.findIndex((p) => p.id === id);
    if (idx === -1) {
      revalidatePath(`/tournaments/${tournamentIdForm}/editions/${editionIdForm}/dashboard/phases`);
      return;
    }
    const swapWith = direction === "up" ? idx - 1 : idx + 1;
    if (swapWith < 0 || swapWith >= phasesArr.length) {
      revalidatePath(`/tournaments/${tournamentIdForm}/editions/${editionIdForm}/dashboard/phases`);
      return;
    }
    const a = phasesArr[idx];
    const b = phasesArr[swapWith];
    const aOrder = a.order ?? idx + 1;
    const bOrder = b.order ?? swapWith + 1;
    await updateTournamentPhase(a.id, { order: bOrder });
    await updateTournamentPhase(b.id, { order: aOrder });
    revalidatePath(`/tournaments/${tournamentIdForm}/editions/${editionIdForm}/dashboard/phases`);
  }

  async function generateEliminationBracketAction(formData: FormData) {
    "use server";
    const phaseId = (formData.get("phaseId") as string) || "";
    const editionIdForm = (formData.get("editionId") as string) || "";
    const tournamentIdForm = (formData.get("tournamentId") as string) || "";

    const existingMatchesRes = await getMatches({
      filters: { phaseId },
      pagination: { page: 1, limit: 1 },
    });
    if ((existingMatchesRes?.data?.length || 0) > 0) {
      revalidatePath(`/tournaments/${tournamentIdForm}/editions/${editionIdForm}/dashboard/phases`);
      return;
    }

    const regsRes = await getEditionRegistrations({
      filters: { editionId: editionIdForm },
      pagination: { page: 1, limit: 512 },
      options: {},
    });
    const regs = regsRes.data || [];
    const ids = regs.map((r: any) => r.id);

    function shuffle<T>(arr: T[]): T[] {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }

    const shuffled = shuffle(ids);
    const n = shuffled.length;
    if (n === 0) {
      revalidatePath(`/tournaments/${tournamentIdForm}/editions/${editionIdForm}/dashboard/phases`);
      return;
    }
    const nextPow2 = (x: number) => {
      let p = 1;
      while (p < x) p <<= 1;
      return p;
    };
    const size = nextPow2(n);
    const byes = size - n;
    const seeds: (string | null)[] = shuffled.concat(Array(byes).fill(null));

    let matchCounter = 1;
    for (let i = 0; i < size / 2; i++) {
      const p1 = seeds[2 * i] || null;
      const p2 = seeds[2 * i + 1] || null;
      await createMatch({
        editionId: editionIdForm,
        phaseId,
        round: 1,
        matchNumber: matchCounter++,
        participant1RegistrationId: p1 || undefined,
        participant2RegistrationId: p2 || undefined,
      } as any);
    }

    let round = 2;
    let matchesInRound = size / 4;
    while (matchesInRound >= 1) {
      for (let i = 0; i < matchesInRound; i++) {
        await createMatch({
          editionId: editionIdForm,
          phaseId,
          round,
          matchNumber: i + 1,
        } as any);
      }
      round += 1;
      matchesInRound = matchesInRound / 2;
    }

    revalidatePath(`/tournaments/${tournamentIdForm}/editions/${editionIdForm}/dashboard/phases`);
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Typography variant="h3" weight="bold" className="tracking-tight">
            Configuration des Phases
          </Typography>
          <Typography variant="body-sm" theme="muted" className="mt-1">
            Gérez la structure et le déroulement de votre édition.
          </Typography>
        </div>
        <form action={createPhaseAction} className="shrink-0 flex items-center gap-2">
          <input type="hidden" name="editionId" value={editionId} />
          <input type="hidden" name="tournamentId" value={tournamentId} />
          <input
            name="name"
            defaultValue={`Phase ${phases.length + 1}`}
            className="h-9 px-3 py-1 rounded-md border bg-background text-sm"
            placeholder="Nom de la phase"
          />
          <select
            name="phaseType"
            defaultValue="ELIMINATION"
            className="h-9 px-3 py-1 rounded-md border bg-background text-sm"
          >
            <option value="ELIMINATION">Élimination directe</option>
            <option value="ROUND_ROBIN">Poules</option>
          </select>
          <Button type="submit" className="h-9">
            <Plus className="mr-2 h-4 w-4" /> Ajouter
          </Button>
        </form>
      </div>

      {phases.length === 0 ? (
        <Card className="border-dashed border-2 bg-muted/20">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <GitBranch className="h-8 w-8 text-muted-foreground" />
            </div>
            <Typography variant="h5" weight="bold" className="mb-2">Aucune phase configurée</Typography>
            <Typography variant="body-sm" theme="muted" className="max-w-xs mb-8">
              Ajoutez une phase pour structurer votre tournoi : Élimination directe, Poules, Championnat, etc.
            </Typography>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Ajouter ma première phase
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {phases.map((phase: TournamentPhase) => (
            <Card key={phase.id} className="group hover:border-primary/50 transition-all border-border/50 overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors" />
              <CardHeader className="flex flex-row items-center justify-between py-4 space-y-0 relative">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Typography variant="body-base" weight="bold">
                      {phase.name}
                    </Typography>
                    <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-widest px-1.5 h-4">
                      {phase.phaseType}
                    </Badge>
                  </div>
                  <Typography variant="caption1" theme="muted" className="flex items-center gap-2">
                    <Settings2 className="h-3 w-3" /> Ordre de progression: {phase.order}
                  </Typography>
                </div>
                <div className="flex items-center gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8">
                        Modifier
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Modifier la phase</DialogTitle>
                      </DialogHeader>
                      <form action={updatePhaseAction} className="space-y-3">
                        <input type="hidden" name="id" value={phase.id} />
                        <input type="hidden" name="editionId" value={editionId} />
                        <input type="hidden" name="tournamentId" value={tournamentId} />
                        <input
                          name="name"
                          defaultValue={phase.name}
                          className="h-9 px-3 py-1 rounded-md border bg-background text-sm w-full"
                          placeholder="Nom de la phase"
                        />
                        <select
                          name="phaseType"
                          defaultValue={phase.phaseType as any}
                          className="h-9 px-3 py-1 rounded-md border bg-background text-sm w-full"
                        >
                          <option value="ELIMINATION">Élimination directe</option>
                          <option value="ROUND_ROBIN">Poules</option>
                        </select>
                        <DialogFooter>
                          <Button type="submit">Enregistrer</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                  <form action={setActivePhaseAction}>
                    <input type="hidden" name="id" value={phase.id} />
                    <input type="hidden" name="editionId" value={editionId} />
                    <input type="hidden" name="tournamentId" value={tournamentId} />
                    <Button size="sm" variant={phase.isActive ? "default" : "outline"} className="h-8">
                      {phase.isActive ? "Active" : "Activer"}
                    </Button>
                  </form>
                  <form action={movePhaseAction} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={phase.id} />
                    <input type="hidden" name="editionId" value={editionId} />
                    <input type="hidden" name="tournamentId" value={tournamentId} />
                    <input type="hidden" name="direction" value="up" />
                    <Button size="sm" variant="outline" className="h-8">Monter</Button>
                  </form>
                  <form action={movePhaseAction} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={phase.id} />
                    <input type="hidden" name="editionId" value={editionId} />
                    <input type="hidden" name="tournamentId" value={tournamentId} />
                    <input type="hidden" name="direction" value="down" />
                    <Button size="sm" variant="outline" className="h-8">Descendre</Button>
                  </form>
                  <form action={generateEliminationBracketAction}>
                    <input type="hidden" name="phaseId" value={phase.id} />
                    <input type="hidden" name="editionId" value={editionId} />
                    <input type="hidden" name="tournamentId" value={tournamentId} />
                    <Button size="sm" variant="outline" className="h-8 gap-2" type="submit">
                      Générer bracket <ArrowRight className="h-3 w-3" />
                    </Button>
                  </form>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="destructive" className="h-8">
                        Supprimer
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer la phase</AlertDialogTitle>
                        <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <form action={deletePhaseAction}>
                          <input type="hidden" name="id" value={phase.id} />
                          <input type="hidden" name="editionId" value={editionId} />
                          <input type="hidden" name="tournamentId" value={tournamentId} />
                          <AlertDialogAction type="submit" variant="destructive">Supprimer</AlertDialogAction>
                        </form>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <Button size="sm" variant="ghost" className="h-8" asChild>
                    <Link href={`/tournaments/${tournamentId}/editions/${editionId}/dashboard/phases/${phase.id}`}>
                      Gérer
                    </Link>
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {phases.length > 0 && (
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex gap-4 items-start">
          <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <Typography variant="body-sm" weight="bold" className="text-primary">Note sur la progression</Typography>
            <Typography variant="caption1" theme="muted" className="mt-1">
              L'ordre des phases détermine comment les participants progressent. Assurez-vous que l'ordre numérique (1, 2, 3...) correspond à votre planning.
            </Typography>
          </div>
        </div>
      )}
    </div>
  );
}
