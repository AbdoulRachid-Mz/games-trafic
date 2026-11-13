import { Metadata } from "next";
import { getTournamentPhases, getBracketNodes, getMatches } from "@/actions/phases";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  GitBranch,
  Trophy,
  ArrowRight,
  Settings2,
  Hash,
  Swords,
  CheckCircle2,
  Clock,
  AlertCircle,
  LayoutGrid,
  List,
  StretchHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BracketNodeCard } from "@/components/cards/bracket-node-card";
import { PhaseFilter } from "../groups/phase-filter";
import { BracketExportButton } from "@/components/pages/tournaments/edition-detail/bracket-export-button";

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
    viewMode?: "grid" | "list" | "compact";
  }>;
}

/**
 * Utility to get professional round naming
 */
function getRoundLabel(roundIndex: number, totalRounds: number) {
  const distanceToFinal = totalRounds - roundIndex - 1;

  if (distanceToFinal === 0) return "Finale";
  if (distanceToFinal === 1) return "Demi-finale";
  if (distanceToFinal === 2) return "Quart de finale";

  // For others: 1/8, 1/16, 1/32...
  const pow = Math.pow(2, distanceToFinal + 1);
  return `1/${pow} finale`;
}

function phaseTypeLabel(type: string | null | undefined): string {
  switch (type) {
    case "ELIMINATION": return "Élimination directe";
    case "DOUBLE_ELIMINATION": return "Double élimination";
    case "ROUND_ROBIN": return "Round Robin";
    case "GROUP_STAGE": return "Phase de poules";
    case "SWISS": return "Système suisse";
    case "KNOCKOUT": return "Knockout";
    case "CUSTOM": return "Personnalisé";
    case "GROUP_ELIMINATION": return "Groupes + Élimination";
    default: return "Inconnu";
  }
}

export default async function BracketsDashboardPage({
  params,
  searchParams,
}: PageProps) {
  const { tournamentId, editionId } = await params;
  const { phaseId, viewMode = "grid" } = await searchParams;

  // Fetch all phases to get their bracket nodes
  const phasesRes = await getTournamentPhases({
    filters: { editionId },
    options: { sortBy: "order", sortOrder: "asc" },
  });

  const phases = phasesRes.data || [];
  const eliminationPhases = phases.filter((p) => p.phaseType === "ELIMINATION" || p.phaseType === "ROUND_ROBIN" || p.phaseType === "GROUP_STAGE");

  if (eliminationPhases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <GitBranch className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
        <Typography variant="h4" weight="bold">
          Aucun arbre configuré
        </Typography>
        <Typography variant="body-sm" theme="muted" className="max-w-xs mt-2">
          Cette édition ne contient aucune phase configurée avec des brackets.
        </Typography>
        <Button className="mt-6" asChild>
          <Link
            href={`/tournaments/${tournamentId}/editions/${editionId}/dashboard/phases`}
          >
            Configurer les phases
          </Link>
        </Button>
      </div>
    );
  }

  // Fetch nodes for each phase
  const phasesWithNodes = await Promise.all(
    eliminationPhases.map(async (phase) => {
      const nodesRes = await getBracketNodes({
        filters: { phaseId: phase.id },
        options: { sortBy: "round", sortOrder: "asc" },
        pagination: { page: 1, limit: 200 },
      });

      const nodes = nodesRes.data || [];
      return {
        ...phase,
        bracketNodes: nodes,
      };
    }),
  );

  // 🆕 RR refondu (« groupes = journées ») : cette phase n'est PAS un arbre.
  // Ses nodes sont des confrontations de journée (metadata.dayNumber), gérées
  // dans l'onglet Groupes/Matchs — on les exclut de la vue brackets. Les
  // structures RR héritées (groupe « Classement ») n'ont pas de dayNumber et
  // restent visibles.
  const bracketPhases = phasesWithNodes.filter(
    (p) =>
      !(
        p.phaseType === "ROUND_ROBIN" &&
        (p.bracketNodes || []).some((n: any) => n.metadata?.dayNumber)
      ),
  );

  // Filter nodes by phase if requested
  const targetPhases = phaseId
    ? bracketPhases.filter((p) => p.id === phaseId)
    : bracketPhases;

  // Stats matchs par phase et par node : UNE seule requête par phase
  // (avant : une requête par node, N+1 évité).
  const phasesWithStats = await Promise.all(
    targetPhases.map(async (phase: any) => {
      const matchesRes = await getMatches({
        filters: { phaseId: phase.id, editionId },
        pagination: { page: 1, limit: 1000 },
      });
      const matches = matchesRes.data || [];
      const completedMatches = matches.filter(
        (m: any) => m.status === "COMPLETED",
      ).length;

      // Comptage matchs par node à partir du même lot (consistent).
      const matchesPerNode = new Map<string, number>();
      for (const m of matches) {
        const nodeId = m.bracketNodeId;
        if (!nodeId) continue;
        matchesPerNode.set(nodeId, (matchesPerNode.get(nodeId) || 0) + 1);
      }
      const bracketNodes = (phase.bracketNodes || []).map((node: any) => ({
        ...node,
        matchesCount: matchesPerNode.get(node.id) ?? 0,
      }));

      return {
        ...phase,
        bracketNodes,
        matchesCount: matches.length,
        completedMatchesCount: completedMatches,
      };
    }),
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <Typography variant="h3" weight="bold">
            Gestion des Brackets/rencontres
          </Typography>
          <Typography variant="body-sm" theme="muted">
            Gestion des rounds et des rencontres par bracket
          </Typography>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-muted p-1 rounded-lg">
            <Button 
              variant={viewMode === "grid" ? "default" : "ghost"} 
              size="icon" 
              className="h-8 w-8" 
              asChild
            >
              <Link href={`?${new URLSearchParams({ ...(phaseId ? { phaseId } : {}), viewMode: "grid" })}`}>
                <LayoutGrid className="h-4 w-4" />
              </Link>
            </Button>
            <Button 
              variant={viewMode === "list" ? "default" : "ghost"} 
              size="icon" 
              className="h-8 w-8"
              asChild
            >
              <Link href={`?${new URLSearchParams({ ...(phaseId ? { phaseId } : {}), viewMode: "list" })}`}>
                <List className="h-4 w-4" />
              </Link>
            </Button>
            <Button 
              variant={viewMode === "compact" ? "default" : "ghost"} 
              size="icon" 
              className="h-8 w-8"
              asChild
            >
              <Link href={`?${new URLSearchParams({ ...(phaseId ? { phaseId } : {}), viewMode: "compact" })}`}>
                <StretchHorizontal className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <PhaseFilter
            phases={bracketPhases}
            currentPhaseId={phaseId}
            placeholder="Toutes les phases"
            paramName="phaseId"
          />
        </div>
      </div>

      <div className="space-y-12">
        {phasesWithStats.map((phase) => {
          const nodes = phase.bracketNodes || [];

          const progressPercent =
            phase.matchesCount > 0
              ? Math.round(
                  (phase.completedMatchesCount / phase.matchesCount) * 100,
                )
              : 0;

          return (
            <div
              key={phase.id}
              className="space-y-6 bg-card border rounded-xl p-6 shadow-sm"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Trophy className="h-6 w-6" />
                  </div>
                  <div>
                    <Link href={`/tournaments/${tournamentId}/editions/${editionId}/dashboard/phases/${phase.id}`} className="text-lg font-semibold hover:underline hover:text-primary transition-colors" >
                      {phase.name}
                    </Link>
                    <div className="flex items-center gap-3 mt-1">
                      <Typography variant="caption1" theme="muted">
                        {nodes.length} bracket(s) • {phase.matchesCount} match(s)
                      </Typography>
                      <div className="flex items-center gap-1">
                        <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-medium">
                          {progressPercent}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <Badge variant="secondary" className="text-[10px] uppercase">
                    {phaseTypeLabel(phase.phaseType)}
                  </Badge>
                  <BracketExportButton
                    editionId={editionId}
                    phase={phase}
                    nodes={nodes}
                  />
                  <Button size="sm" variant="outline" asChild>
                    <Link
                      href={`/tournaments/${tournamentId}/editions/${editionId}/dashboard/phases/${phase.id}`}
                    > 
                      Éditer la phase
                    </Link>
                  </Button>
                </div>
              </div>

              <div className={cn(
                "grid gap-4",
                viewMode === "grid" ? "grid-cols-1 lg:grid-cols-2 xl:grid-cols-3" : 
                viewMode === "compact" ? "grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5" : 
                "grid-cols-1"
              )}>
                {nodes.map((node: any) => (
                  <BracketNodeCard
                    key={node.id}
                    item={node}
                    tournamentId={tournamentId}
                    editionId={editionId}
                    viewMode={viewMode}
                  />
                ))}
              </div>
              
              {nodes.length === 0 && (
                <div className="text-center py-12 border border-dashed rounded-xl bg-muted/5">
                  <GitBranch className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-20" />
                  <Typography variant="body-sm" theme="muted">Aucun bracket généré pour cette phase.</Typography>
                  <Button variant="link" size="sm" asChild>
                    <Link href={`/tournaments/${tournamentId}/editions/${editionId}/dashboard/phases/${phase.id}`}>
                      Générer les brackets
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

