import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { getTournamentPhases, getMatches } from "@/actions/tournaments";
import type { TournamentPhase, Match } from "@/database/schema";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface PageProps {
  params: Promise<{
    tournamentId: string;
    editionId: string;
  }>;
}

export default async function EditionCalendarPage({ params }: PageProps) {
  const { editionId } = await params;

  const phasesRes = await getTournamentPhases({
    filters: { editionId },
    options: { sortBy: "order", sortOrder: "asc" },
    pagination: { page: 1, limit: 50 },
  });
  const phases = phasesRes.data as TournamentPhase[];
  const activePhase = phases.find((p) => p.isActive) || phases[0];

  const matchesRes = await getMatches({
    filters: { editionId, phaseId: activePhase?.id },
    options: { sortBy: "scheduledTime", sortOrder: "asc" },
    pagination: { page: 1, limit: 1000 },
  });
  const matches = matchesRes.data as Match[];

  const byDate = new Map<string, Match[]>();
  for (const m of matches) {
    if (!m.scheduledTime) continue;
    const key = format(new Date(m.scheduledTime), "yyyy-MM-dd");
    const arr = byDate.get(key) || [];
    arr.push(m);
    byDate.set(key, arr);
  }
  const days = Array.from(byDate.entries()).sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Typography variant="h3" weight="bold">Calendrier</Typography>
          <Typography variant="body-sm" theme="muted">Phase par défaut: {activePhase ? activePhase.name : "N/A"}</Typography>
        </div>
      </div>

      {days.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">Aucun match planifié</CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {days.map(([dateKey, ms]) => (
            <Card key={dateKey}>
              <CardHeader>
                <CardTitle>{format(new Date(dateKey), "EEEE d MMMM yyyy", { locale: fr })}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {ms.map((m) => (
                    <div key={m.id} className="rounded-lg border bg-card p-3 flex items-center justify-between">
                      <div className="text-sm">
                        <div className="font-medium">Match {m.matchNumber} • Round {m.round}</div>
                        <div className="text-muted-foreground">
                          {m.participant1RegistrationId ? "Joueur 1" : "TBD"} vs {m.participant2RegistrationId ? "Joueur 2" : "TBD"}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {m.scheduledTime ? format(new Date(m.scheduledTime), "HH:mm", { locale: fr }) : "—"}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
