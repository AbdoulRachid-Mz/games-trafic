import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { getTournamentPhases, getMatches } from "@/actions/tournaments";
import { updateMatch, deleteMatch } from "@/actions/phases";
import { revalidatePath } from "next/cache";
import type { TournamentPhase, Match } from "@/database/schema";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface PageProps {
  params: Promise<{
    tournamentId: string;
    editionId: string;
  }>;
}

export default async function DashboardMatchesPage({ params }: PageProps) {
  const { tournamentId, editionId } = await params;

  const phasesRes = await getTournamentPhases({
    filters: { editionId },
    options: { sortBy: "order", sortOrder: "asc" },
    pagination: { page: 1, limit: 100 },
  });
  const phases = phasesRes.data as TournamentPhase[];
  const activePhase = phases.find((p) => p.isActive) || phases[0];

  const matchesRes = await getMatches({
    filters: { editionId, phaseId: activePhase?.id },
    options: { sortBy: "scheduledTime", sortOrder: "asc" },
    pagination: { page: 1, limit: 1000 },
  });
  const matches = matchesRes.data as Match[];

  async function updateMatchAction(formData: FormData) {
    "use server";
    const id = (formData.get("id") as string) || "";
    const score1 = formData.get("score1") ? Number(formData.get("score1")) : null;
    const score2 = formData.get("score2") ? Number(formData.get("score2")) : null;
    const scheduledTime = formData.get("scheduledTime") ? new Date(formData.get("scheduledTime") as string) : undefined;
    await updateMatch(id, { score1: score1 as any, score2: score2 as any, scheduledTime } as any);
    revalidatePath(`/tournaments/${tournamentId}/editions/${editionId}/dashboard/matches`);
  }

  async function deleteMatchAction(formData: FormData) {
    "use server";
    const id = (formData.get("id") as string) || "";
    await deleteMatch(id);
    revalidatePath(`/tournaments/${tournamentId}/editions/${editionId}/dashboard/matches`);
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Typography variant="h3" weight="bold">Gestion des matchs</Typography>
          <Typography variant="body-sm" theme="muted">Phase par défaut: {activePhase ? activePhase.name : "N/A"}</Typography>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Matchs planifiés</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {matches.length === 0 ? (
              <div className="text-sm text-muted-foreground">Aucun match</div>
            ) : (
              matches.map((m) => (
                <div key={m.id} className="border rounded-xl p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <Typography variant="body-base" weight="bold">Match {m.matchNumber} • Round {m.round}</Typography>
                    <Typography variant="caption1" theme="muted">
                      {m.scheduledTime ? format(new Date(m.scheduledTime), "d MMM HH:mm", { locale: fr }) : "Non planifié"} • Statut {m.status}
                    </Typography>
                  </div>
                  <form action={updateMatchAction} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={m.id} />
                    <input name="score1" type="number" defaultValue={m.score1 ?? undefined} className="h-9 px-2 py-1 rounded-md border bg-background text-sm w-20" placeholder="S1" />
                    <input name="score2" type="number" defaultValue={m.score2 ?? undefined} className="h-9 px-2 py-1 rounded-md border bg-background text-sm w-20" placeholder="S2" />
                    <input name="scheduledTime" type="datetime-local" defaultValue={m.scheduledTime ? new Date(m.scheduledTime).toISOString().slice(0,16) : ""} className="h-9 px-2 py-1 rounded-md border bg-background text-sm" />
                    <Button type="submit" size="sm" variant="outline">Enregistrer</Button>
                    <form action={deleteMatchAction}>
                      <input type="hidden" name="id" value={m.id} />
                      <Button type="submit" size="sm" variant="destructive">Supprimer</Button>
                    </form>
                  </form>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
