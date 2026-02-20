import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getTournamentPhases, getMatches, getPhaseGroups } from "@/actions/tournaments";
import { getBracketNodes } from "@/actions/tournaments";
import type { TournamentPhase, Match, PhaseGroup, BracketNode } from "@/database/schema";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface PageProps {
  params: Promise<{
    tournamentId: string;
    editionId: string;
  }>;
  searchParams: Promise<{
    groupId?: string;
    tab?: string;
  }>;
}

export default async function EditionCalendarPage({ params, searchParams }: PageProps) {
  const { editionId, tournamentId } = await params;
  const { groupId: selectedGroupId, tab = "matches" } = await searchParams;

  const phasesRes = await getTournamentPhases({
    filters: { editionId },
    options: { sortBy: "order", sortOrder: "asc" },
    pagination: { page: 1, limit: 50 },
  });
  const phases = phasesRes.data as TournamentPhase[];
  const activePhase = phases.find((p) => p.isActive) || phases[0];

  const groupsRes = await getPhaseGroups({
    filters: { phaseId: activePhase?.id },
    options: { sortBy: "order", sortOrder: "asc" },
  });
  const groups = groupsRes.data as PhaseGroup[];

  const matchesRes = await getMatches({
    filters: {
      editionId,
      phaseId: activePhase?.id,
      groupId: selectedGroupId
    },
    options: { sortBy: "scheduledTime", sortOrder: "asc" },
    pagination: { page: 1, limit: 1000 },
  });
  const matches = matchesRes.data as Match[];

  const bracketNodesRes = await getBracketNodes({
    filters: {
      phaseId: activePhase?.id,
      groupId: selectedGroupId
    },
  });
  const nodes = bracketNodesRes.data as BracketNode[];

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <Typography variant="h3" weight="bold">Calendrier</Typography>
          <Typography variant="body-sm" theme="muted">
            Phase : <span className="text-foreground font-medium">{activePhase ? activePhase.name : "N/A"}</span>
          </Typography>
        </div>

        {groups.length > 0 && (
          <form className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Filtrer par groupe :</span>
            <Select name="groupId" defaultValue={selectedGroupId}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tous les groupes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les groupes</SelectItem>
                {groups.map((g) => (
                  <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button type="submit" className="hidden" />
          </form>
        )}
      </div>

      <Tabs defaultValue={tab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="matches">Matches</TabsTrigger>
          <TabsTrigger value="nodes">Arborescence (Nodes)</TabsTrigger>
        </TabsList>

        <TabsContent value="matches" className="mt-6 space-y-6">
          {days.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Typography variant="body-sm" theme="muted">Aucun match planifié pour cette sélection.</Typography>
              </CardContent>
            </Card>
          ) : (
            days.map(([dateKey, ms]) => (
              <div key={dateKey} className="space-y-3">
                <Typography variant="h5" weight="bold" className="flex items-center gap-2 bg-muted/50 p-2 rounded-lg">
                  <span className="text-primary h-2 w-2 rounded-full bg-primary" />
                  {format(new Date(dateKey), "EEEE d MMMM yyyy", { locale: fr })}
                </Typography>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {ms.map((m) => (
                    <Card key={m.id} className="hover:border-primary/50 transition-colors group">
                      <CardContent className="p-4 flex flex-col justify-between h-full gap-4">
                        <div className="flex justify-between items-start">
                          <div className="text-[10px] font-black uppercase tracking-widest text-primary/60">
                            Round {m.round} • Match {m.matchNumber}
                          </div>
                          <div className="text-xs font-bold tabular-nums bg-primary/5 px-2 py-0.5 rounded text-primary">
                            {m.scheduledTime ? format(new Date(m.scheduledTime), "HH:mm", { locale: fr }) : "—"}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-bold truncate max-w-[120px]">
                              {(m as any).participant1?.member?.displayName || "TBD"}
                            </span>
                            <span className="text-xs font-black italic opacity-20 group-hover:opacity-100 transition-opacity">VS</span>
                            <span className="font-bold truncate max-w-[120px]">
                              {(m as any).participant2?.member?.displayName || "TBD"}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="nodes" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Nodes de la phase</CardTitle>
            </CardHeader>
            <CardContent>
              {nodes.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">Aucun node trouvé.</div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                  {nodes.map((n) => (
                    <div key={n.id} className="p-3 border rounded-lg bg-muted/20">
                      <div className="text-xs font-bold text-primary">Node #{n.matchNumber}</div>
                      <div className="text-sm font-medium">Code: {n.nodeCode || "N/A"}</div>
                      <div className="text-[10px] text-muted-foreground">Round: {n.round} / Profondeur: {n.depth}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div >
  );
}
