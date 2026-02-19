import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { getTournamentPhases, getMatches } from "@/actions/tournaments";
import { updateMatch, deleteMatch } from "@/actions/phases";
import { revalidatePath } from "next/cache";
import type { TournamentPhase, Match } from "@/database/schema";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Trash2, Save, Clock, Swords } from "lucide-react";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";

interface PageProps {
  params: Promise<{
    tournamentId: string;
    editionId: string;
  }>;
}

function matchStatusBadge(status: string | null | undefined) {
  switch (status) {
    case "COMPLETED": return <Badge className="bg-green-600 text-white text-xs">Terminé</Badge>;
    case "IN_PROGRESS": return <Badge className="bg-blue-600 text-white text-xs">En cours</Badge>;
    case "CANCELLED": return <Badge variant="destructive" className="text-xs">Annulé</Badge>;
    default: return <Badge variant="outline" className="text-xs">En attente</Badge>;
  }
}

export default async function DashboardMatchesPage({ params }: PageProps) {
  const { tournamentId, editionId } = await params;
  const basePath = `/tournaments/${tournamentId}/editions/${editionId}/dashboard/matches`;

  const phasesRes = await getTournamentPhases({
    filters: { editionId },
    options: { sortBy: "order", sortOrder: "asc" },
    pagination: { page: 1, limit: 100 },
  });
  const phases = phasesRes.data as TournamentPhase[];
  const activePhase = phases.find((p) => p.isActive) || phases[0];

  const matchesRes = await getMatches({
    filters: { editionId, phaseId: activePhase?.id },
    options: { sortBy: "round", sortOrder: "asc" },
    pagination: { page: 1, limit: 1000 },
  });
  const matches = matchesRes.data as Match[];

  // Group matches by round
  const matchesByRound = matches.reduce<Record<number, Match[]>>((acc, m) => {
    const r = m.round ?? 0;
    if (!acc[r]) acc[r] = [];
    acc[r].push(m);
    return acc;
  }, {});
  const rounds = Object.keys(matchesByRound).map(Number).sort((a, b) => a - b);

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
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <Typography variant="h3" weight="bold">Gestion des matchs</Typography>
          <Typography variant="body-sm" theme="muted">
            Phase : {activePhase ? activePhase.name : "Aucune phase"} · {matches.length} match{matches.length > 1 ? "s" : ""}
          </Typography>
        </div>
        {/* Phase selector for future: could add tabs/select here */}
        {phases.length > 1 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {phases.map((p) => (
              <Badge key={p.id} variant={p.id === activePhase?.id ? "default" : "outline"} className="cursor-default">
                {p.name}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Matches by round */}
      {matches.length === 0 ? (
        <Card className="border-dashed border-2 bg-muted/20">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Swords className="h-12 w-12 text-muted-foreground mb-4" />
            <Typography variant="h5" weight="bold" className="mb-2">Aucun match</Typography>
            <Typography variant="body-sm" theme="muted" className="max-w-xs">
              Générez les brackets depuis la page des phases pour créer automatiquement les matchs.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        rounds.map((round) => (
          <Card key={round}>
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Swords className="h-4 w-4" />
                Round {round}
                <Badge variant="secondary" className="ml-auto">{matchesByRound[round].length} match{matchesByRound[round].length > 1 ? "s" : ""}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {matchesByRound[round].map((m) => (
                <div key={m.id} className="border rounded-lg p-3 sm:p-4">
                  {/* Match info */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Typography variant="body-sm" weight="bold">Match {m.matchNumber}</Typography>
                      {matchStatusBadge(m.status)}
                      {m.scheduledTime && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {format(new Date(m.scheduledTime), "d MMM HH:mm", { locale: fr })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Score update form - separate from delete */}
                  <form action={updateMatchAction} className="mt-3">
                    <input type="hidden" name="id" value={m.id} />
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          name="score1"
                          type="number"
                          defaultValue={m.score1 ?? undefined}
                          className="h-9 px-2 py-1 rounded-md border bg-background text-sm w-full sm:w-20 text-center font-bold"
                          placeholder="—"
                        />
                        <span className="text-xs font-bold text-muted-foreground">vs</span>
                        <input
                          name="score2"
                          type="number"
                          defaultValue={m.score2 ?? undefined}
                          className="h-9 px-2 py-1 rounded-md border bg-background text-sm w-full sm:w-20 text-center font-bold"
                          placeholder="—"
                        />
                      </div>
                      <input
                        name="scheduledTime"
                        type="datetime-local"
                        defaultValue={m.scheduledTime ? new Date(m.scheduledTime).toISOString().slice(0, 16) : ""}
                        className="h-9 px-2 py-1 rounded-md border bg-background text-sm flex-1"
                      />
                      <div className="flex items-center gap-1.5">
                        <Button type="submit" size="sm" variant="outline" className="gap-1">
                          <Save className="h-3.5 w-3.5" /> Sauver
                        </Button>

                        {/* DELETE — separate form, NOT nested */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button type="button" size="sm" variant="ghost" className="text-destructive hover:text-destructive h-9 w-9 p-0">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Supprimer ce match ?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Match {m.matchNumber} (Round {m.round}) sera supprimé définitivement.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <form action={deleteMatchAction}>
                                <input type="hidden" name="id" value={m.id} />
                                <AlertDialogAction type="submit" className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                  Supprimer
                                </AlertDialogAction>
                              </form>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </form>
                </div>
              ))}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
