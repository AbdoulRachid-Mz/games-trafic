import { Metadata } from "next";
import { getTournamentPhases } from "@/actions/phases";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { GitBranch, Trophy, Calendar, ArrowRight, Settings2, Hash } from "lucide-react";
import { cn } from "@/lib/utils";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Gestion des Brackets - Dashboard",
};

interface PageProps {
  params: Promise<{
    tournamentId: string;
    editionId: string;
  }>;
  searchParams: Promise<{
    phaseId?: string;
  }>;
}

/**
 * Utility to get professional round naming
 */
function getRoundLabel(roundIndex: number, totalRounds: number) {
  const distanceToFinal = totalRounds - roundIndex;
  
  if (distanceToFinal === 0) return "Finale";
  if (distanceToFinal === 1) return "Demi-finale";
  if (distanceToFinal === 2) return "Quart de finale";
  
  // For others: 1/8, 1/16, 1/32...
  const pow = Math.pow(2, distanceToFinal + 1);
  return `1/${pow} finale`;
}

export default async function BracketsDashboardPage({ params, searchParams }: PageProps) {
  const { tournamentId, editionId } = await params;
  const { phaseId } = await searchParams;

  // Fetch all phases to get their bracket nodes
  const phasesRes = await getTournamentPhases({
    filters: { editionId },
    options: { populate: ["bracketNodes"] }
  });

  const phases = phasesRes.data || [];
  const eliminationPhases = phases.filter(p => p.phaseType === "ELIMINATION");

  if (eliminationPhases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <GitBranch className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
        <Typography variant="h4" weight="bold">Aucun arbre configuré</Typography>
        <Typography variant="body-sm" theme="muted" className="max-w-xs mt-2">
          Cette édition ne contient aucune phase d'élimination directe (Bracket).
        </Typography>
        <Button className="mt-6" asChild>
          <Link href={`/tournaments/${tournamentId}/editions/${editionId}/dashboard/phases`}>
            Configurer les phases
          </Link>
        </Button>
      </div>
    );
  }

  // Filter nodes by phase if requested
  const targetPhases = phaseId 
    ? eliminationPhases.filter(p => p.id === phaseId)
    : eliminationPhases;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Typography variant="h3" weight="bold">Arbres de Phase</Typography>
          <Typography variant="body-sm" theme="muted">
            Gestion des rounds et des rencontres par élimination
          </Typography>
        </div>

        <div className="flex items-center gap-2">
           <SelectPhaseFilter phases={eliminationPhases} currentPhaseId={phaseId} />
        </div>
      </div>

      <div className="space-y-12">
        {targetPhases.map(phase => {
          const nodes = (phase as any).bracketNodes || [];
          const maxDepth = Math.max(0, ...nodes.map((n: any) => n.depth || 0));
          
          // Group nodes by depth (round)
          const nodesByDepth: Record<number, any[]> = {};
          nodes.forEach((node: any) => {
            if (!nodesByDepth[node.depth]) nodesByDepth[node.depth] = [];
            nodesByDepth[node.depth].push(node);
          });

          return (
            <div key={phase.id} className="space-y-6 bg-card border rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Trophy className="h-5 w-5" />
                  </div>
                  <div>
                    <Typography variant="h5" weight="bold">{phase.name}</Typography>
                    <Typography variant="caption1" theme="muted">
                      {nodes.length} nœuds répartis sur {maxDepth + 1} rounds
                    </Typography>
                  </div>
                </div>
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/tournaments/${tournamentId}/editions/${editionId}/dashboard/phases/${phase.id}`}>
                    Éditer la phase
                  </Link>
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.keys(nodesByDepth).sort((a, b) => Number(a) - Number(b)).map(depthStr => {
                  const depth = Number(depthStr);
                  const depthNodes = nodesByDepth[depth];
                  const roundName = getRoundLabel(depth, maxDepth);

                  return (
                    <Card key={depth} className="bg-muted/10 border-muted-foreground/10 hover:bg-muted/20 transition-all cursor-default">
                      <CardHeader className="py-3 bg-muted/20">
                        <div className="flex items-center justify-between">
                          <Typography variant="body-sm" weight="bold" className="uppercase tracking-widest opacity-80">
                            {roundName}
                          </Typography>
                          <Badge variant="outline" className="text-[10px]">Round {depth + 1}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="py-4 space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Enfants :</span>
                          <span className="font-mono font-bold">{depthNodes.length}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Type :</span>
                          <span className="font-mono text-[10px] bg-primary/5 px-1.5 py-0.5 rounded uppercase">
                            {depthNodes[0]?.nodeType}
                          </span>
                        </div>
                        <Button variant="ghost" size="xs" className="w-full h-7 mt-2 text-[10px] gap-1 group" asChild>
                          <Link href={`/tournaments/${tournamentId}/editions/${editionId}/dashboard/brackets/${phase.id}?depth=${depth}`}>
                            Voir les détails <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Reuse or adapt from groups page
function SelectPhaseFilter({ phases, currentPhaseId }: { phases: any[], currentPhaseId?: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground">Phase :</span>
      <select 
        className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        defaultValue={currentPhaseId || "ALL"}
        onChange={(e) => {
          const val = e.target.value;
          const url = new URL(window.location.href);
          if (val === "ALL") url.searchParams.delete("phaseId");
          else url.searchParams.set("phaseId", val);
          window.location.href = url.pathname + url.search;
        }}
        //@ts-ignore
      >
        <option value="ALL">Toutes les phases</option>
        {phases.map(p => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
    </div>
  );
}
