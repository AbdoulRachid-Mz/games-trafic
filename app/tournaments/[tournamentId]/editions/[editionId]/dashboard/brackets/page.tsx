import { Metadata } from "next";
import { getTournamentPhases, getBracketNodes } from "@/actions/phases";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BracketRoundCard } from "./bracket-round-card";
import { PhaseFilter } from "../groups/phase-filter";

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
  const distanceToFinal = totalRounds - roundIndex - 1;

  if (distanceToFinal === 0) return "Finale";
  if (distanceToFinal === 1) return "Demi-finale";
  if (distanceToFinal === 2) return "Quart de finale";

  // For others: 1/8, 1/16, 1/32...
  const pow = Math.pow(2, distanceToFinal + 1);
  return `1/${pow} finale`;
}

export default async function BracketsDashboardPage({
  params,
  searchParams,
}: PageProps) {
  const { tournamentId, editionId } = await params;
  const { phaseId } = await searchParams;

  // Fetch all phases to get their bracket nodes
  const phasesRes = await getTournamentPhases({
    filters: { editionId },
    options: { sortBy: "order", sortOrder: "asc" },
  });

  const phases = phasesRes.data || [];
  const eliminationPhases = phases.filter((p) => p.phaseType === "ELIMINATION");

  if (eliminationPhases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <GitBranch className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
        <Typography variant="h4" weight="bold">
          Aucun arbre configuré
        </Typography>
        <Typography variant="body-sm" theme="muted" className="max-w-xs mt-2">
          Cette édition ne contient aucune phase d'élimination directe
          (Bracket).
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

  // Fetch nodes for each elimination phase
  const phasesWithNodes = await Promise.all(
    eliminationPhases.map(async (phase) => {
      const nodesRes = await getBracketNodes({
        filters: { phaseId: phase.id },
        options: { sortBy: "order", sortOrder: "asc" },
        pagination: { page: 1, limit: 200 },
      });
      return {
        ...phase,
        bracketNodes: nodesRes.data || [],
      };
    }),
  );

  // Filter nodes by phase if requested
  const targetPhases = phaseId
    ? phasesWithNodes.filter((p) => p.id === phaseId)
    : phasesWithNodes;

  // Get matches count for each phase to show stats
  const { getMatches } = await import("@/actions/tournaments");

  const phasesWithStats = await Promise.all(
    targetPhases.map(async (phase) => {
      const matchesRes = await getMatches({
        filters: { phaseId: phase.id, editionId },
        pagination: { page: 1, limit: 1000 },
      });
      const matches = matchesRes.data || [];
      const completedMatches = matches.filter(
        (m: any) => m.status === "COMPLETED",
      ).length;

      return {
        ...phase,
        matchesCount: matches.length,
        completedMatchesCount: completedMatches,
      };
    }),
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Typography variant="h3" weight="bold">
            Arbres de Phase
          </Typography>
          <Typography variant="body-sm" theme="muted">
            Gestion des rounds et des rencontres par élimination
          </Typography>
        </div>

        <div className="flex items-center gap-2">
          <PhaseFilter
            phases={eliminationPhases}
            currentPhaseId={phaseId}
            placeholder="Toutes les phases"
            paramName="phaseId"
          />
        </div>
      </div>

      <div className="space-y-12">
        {phasesWithStats.map((phase) => {
          const nodes = phase.bracketNodes || [];

          // Group nodes by round
          const nodesByRound: Record<number, any[]> = {};
          nodes.forEach((node: any) => {
            const round = node.round || 1;
            if (!nodesByRound[round]) nodesByRound[round] = [];
            nodesByRound[round].push(node);
          });

          const maxRound = Math.max(
            1,
            ...Object.keys(nodesByRound).map(Number),
          );

          // Get unique bracket types
          const bracketTypes = new Set(nodes.map((n: any) => n.bracketType));

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
                    <Typography variant="h5" weight="bold">
                      {phase.name}
                    </Typography>
                    <div className="flex items-center gap-3 mt-1">
                      <Typography variant="caption1" theme="muted">
                        {nodes.length} nœud(s) • {phase.matchesCount} match(s)
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
                <div className="flex gap-2">
                  {Array.from(bracketTypes).map((type) => (
                    <Badge
                      key={type}
                      variant="outline"
                      className="text-[10px] uppercase"
                    >
                      {type === "UPPER"
                        ? "Upper Bracket"
                        : type === "LOWER"
                          ? "Lower Bracket"
                          : type}
                    </Badge>
                  ))}
                  <Button size="sm" variant="outline" asChild>
                    <Link
                      href={`/tournaments/${tournamentId}/editions/${editionId}/dashboard/phases/${phase.id}`}
                    >
                      Éditer la phase
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: maxRound }, (_, i) => i + 1).map(
                  (roundNum) => {
                    const roundNodes = nodesByRound[roundNum] || [];
                    const roundName = getRoundLabel(roundNum - 1, maxRound);

                    // Count matches in this round (approx from nodes)
                    const matchesInRound = roundNodes.length;

                    return (
                      <BracketRoundCard
                        key={roundNum}
                        roundNumber={roundNum}
                        roundName={roundName}
                        nodeCount={roundNodes.length}
                        matchesCount={matchesInRound}
                        tournamentId={tournamentId}
                        nodeId={roundNodes[0]?.id || undefined}
                        editionId={editionId}
                        phaseId={phase.id}
                      />
                    );
                  },
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
