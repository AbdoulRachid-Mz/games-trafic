import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { getTournamentPhases, getMatches } from "@/actions/tournaments";
import type { TournamentPhase, Match } from "@/database/schema";

interface PageProps {
  params: Promise<{
    tournamentId: string;
    editionId: string;
  }>;
}

export default async function EditionMatchesPage({ params }: PageProps) {
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
    options: { sortBy: "round", sortOrder: "asc" },
    pagination: { page: 1, limit: 1000 },
  });
  const matches = matchesRes.data as Match[];

  const roundsMap = new Map<number, Match[]>();
  for (const m of matches) {
    const r = (m.round as any) || 1;
    const arr = roundsMap.get(r) || [];
    arr.push(m);
    roundsMap.set(r, arr);
  }
  const rounds = Array.from(roundsMap.entries()).sort((a, b) => a[0] - b[0]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Typography variant="h3" weight="bold">Matchs</Typography>
          <Typography variant="body-sm" theme="muted">Phase par défaut: {activePhase ? activePhase.name : "N/A"}</Typography>
        </div>
      </div>

      {rounds.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">Aucun match trouvé</CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {rounds.map(([roundNumber, ms]) => (
            <Card key={roundNumber}>
              <CardHeader className="flex flex-row justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  Round {roundNumber}
                  <Badge variant="secondary" className="text-[10px] h-4">{activePhase?.phaseType}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {ms.sort((a, b) => (a.matchNumber ?? 0) - (b.matchNumber ?? 0)).map((m) => (
                    <div key={m.id} className="rounded-lg border bg-card p-3">
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">Match {m.matchNumber}</div>
                        <div className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground">{m.status}</div>
                      </div>
                      <div className="mt-2 space-y-2">
                        <div className="flex justify-between items-center bg-muted/30 p-2 rounded-md">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-muted-foreground w-4 text-center">1</span>
                            <span className="font-semibold truncate max-w-[150px]">
                              {(m as any).participant1?.member?.displayName || (m as any).participant1?.member?.user?.username || "TBD"}
                            </span>
                          </div>
                          <span className="font-black tabular-nums">{m.score1 ?? "-"}</span>
                        </div>
                        <div className="flex justify-between items-center bg-muted/30 p-2 rounded-md">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-muted-foreground w-4 text-center">2</span>
                            <span className="font-semibold truncate max-w-[150px]">
                              {(m as any).participant2?.member?.displayName || (m as any).participant2?.member?.user?.username || "TBD"}
                            </span>
                          </div>
                          <span className="font-black tabular-nums">{m.score2 ?? "-"}</span>
                        </div>
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
