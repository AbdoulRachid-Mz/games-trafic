import { Metadata } from "next";
import { getTournamentPhases } from "@/actions/phases";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  LayoutGrid,
  Users,
  CheckCircle2,
  Lock,
  ArrowRight,
  Settings2,
  Trophy,
  List,
  StretchHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { notFound } from "next/navigation";
import { PhaseFilter } from "./phase-filter";
import { GroupCard } from "@/components/cards/group-card";

export const metadata: Metadata = {
  title: "Gestion des Groupes - Dashboard",
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

export default async function GroupsDashboardPage({
  params,
  searchParams,
}: PageProps) {
  const { tournamentId, editionId } = await params;
  const { phaseId, viewMode = "grid" } = await searchParams;

  // Fetch all phases to get their groups
  const phasesRes = await getTournamentPhases({
    filters: { editionId },
    options: { sortBy: "order", sortOrder: "asc" },
  });

  const phases = phasesRes.data || [];
  if (phases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <LayoutGrid className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
        <Typography variant="h4" weight="bold">
          Aucune phase configurée
        </Typography>
        <Typography variant="body-sm" theme="muted" className="max-w-xs mt-2">
          Vous devez d'abord configurer les phases de votre édition pour gérer
          les groupes.
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

  // Fetch groups for each phase
  const { getPhaseGroups } = await import("@/actions/phases");
  
  const phasesWithGroups = await Promise.all(
    phases.map(async (phase) => {
      const groupsRes = await getPhaseGroups({
        filters: { phaseId: phase.id },
        options: { sortBy: "order", sortOrder: "asc" },
        pagination: { page: 1, limit: 100 },
      });
      return {
        ...phase,
        groups: groupsRes.data || [],
      };
    })
  );

  // Filter groups by phase if phaseId is provided
  const filteredPhases = phaseId
    ? phasesWithGroups.filter((p) => p.id === phaseId)
    : phasesWithGroups.filter(
        (p) => p.phaseType === "GROUP_STAGE" || p.phaseType === "ROUND_ROBIN"
      );

  const allGroups = filteredPhases.flatMap(
    (p) =>
      p.groups.map((g: any) => ({
        ...g,
        phaseName: p.name,
        phaseId: p.id,
        phaseType: p.phaseType,
      })) || []
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Typography variant="h3" weight="bold">
            Gestion des Groupes
          </Typography>
          <Typography variant="body-sm" theme="muted">
            {allGroups.length} groupe{allGroups.length > 1 ? "s" : ""} au total
            dans cette édition
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
            phases={phases.filter(p => p.phaseType === "GROUP_STAGE" || p.phaseType === "ROUND_ROBIN")}
            currentPhaseId={phaseId}
            placeholder="Toutes les phases"
          />
        </div>
      </div>

      {allGroups.length === 0 ? (
        <Card className="border-dashed py-12">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
            <Typography variant="h5">Aucun groupe trouvé</Typography>
            <p className="text-sm text-muted-foreground mt-1">
              Les phases sélectionnées ne contiennent pas de groupes.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className={cn(
          "grid gap-4",
          viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : 
          viewMode === "compact" ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6" : 
          "grid-cols-1"
        )}>
          {allGroups.map((group: any) => (
            <GroupCard
              key={group.id}
              group={group}
              tournamentId={tournamentId}
              editionId={editionId}
              viewMode={viewMode}
            />
          ))}
        </div>
      )}
    </div>
  );
}
