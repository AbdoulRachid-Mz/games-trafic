import { Metadata } from "next";
import { getTournamentPhases } from "@/actions/phases";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { LayoutGrid, Users, CheckCircle2, Lock, ArrowRight, Settings2, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { notFound } from "next/navigation";

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
  }>;
}

export default async function GroupsDashboardPage({ params, searchParams }: PageProps) {
  const { tournamentId, editionId } = await params;
  const { phaseId } = await searchParams;

  // Fetch all phases to get their groups
  const phasesRes = await getTournamentPhases({
    filters: { editionId },
    options: { populate: ["groups"] }
  });

  const phases = phasesRes.data || [];
  if (phases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <LayoutGrid className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
        <Typography variant="h4" weight="bold">Aucune phase configurée</Typography>
        <Typography variant="body-sm" theme="muted" className="max-w-xs mt-2">
          Vous devez d'abord configurer les phases de votre édition pour gérer les groupes.
        </Typography>
        <Button className="mt-6" asChild>
          <Link href={`/tournaments/${tournamentId}/editions/${editionId}/dashboard/phases`}>
            Configurer les phases
          </Link>
        </Button>
      </div>
    );
  }

  // Filter groups by phase if phaseId is provided
  const filteredPhases = phaseId 
    ? phases.filter(p => p.id === phaseId)
    : phases.filter(p => p.phaseType === "GROUP_STAGE" || p.phaseType === "ROUND_ROBIN");

  const allGroups = filteredPhases.flatMap(p => 
    (p as any).groups?.map((g: any) => ({ ...g, phaseName: p.name, phaseId: p.id })) || []
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Typography variant="h3" weight="bold">Gestion des Groupes</Typography>
          <Typography variant="body-sm" theme="muted">
            {allGroups.length} groupe{allGroups.length > 1 ? "s" : ""} au total dans cette édition
          </Typography>
        </div>

        <div className="flex items-center gap-2">
          <SelectPhaseFilter phases={phases} currentPhaseId={phaseId} />
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allGroups.map((group: any) => (
            <Card key={group.id} className="overflow-hidden group hover:border-primary/50 transition-colors">
              <CardHeader className="pb-2 border-b bg-muted/30">
                <div className="flex justify-between items-start">
                  <div>
                    <Badge variant="outline" className="mb-1 text-[10px] uppercase tracking-wider">
                      {group.phaseName}
                    </Badge>
                    <CardTitle className="text-lg">{group.name}</CardTitle>
                  </div>
                  <div className="flex gap-1">
                    {group.isLocked && (
                      <Badge variant="secondary" className="h-6 w-6 p-0 flex items-center justify-center rounded-full">
                        <Lock className="h-3 w-3" />
                      </Badge>
                    )}
                    {group.isCompleted && (
                      <Badge className="bg-emerald-500 hover:bg-emerald-600 h-6 w-6 p-0 flex items-center justify-center rounded-full">
                        <CheckCircle2 className="h-3 w-3" />
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>Participants</span>
                  </div>
                  <span className="font-bold">{group.participantCount || 0}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Trophy className="h-4 w-4" />
                    <span>Type</span>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">
                    {group.groupType}
                  </Badge>
                </div>

                <div className="pt-2 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 text-xs gap-1.5" asChild>
                    <Link href={`/tournaments/${tournamentId}/editions/${editionId}/dashboard/groups/${group.id}`}>
                      <Settings2 className="h-3.5 w-3.5" /> Gérer
                    </Link>
                  </Button>
                  <Button variant="default" size="sm" className="flex-1 text-xs gap-1.5" asChild>
                    <Link href={`/tournaments/${tournamentId}/editions/${editionId}/phase/${group.phaseId}?group=${group.id}`}>
                      <ArrowRight className="h-3.5 w-3.5" /> Voir
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function SelectPhaseFilter({ phases, currentPhaseId }: { phases: any[], currentPhaseId?: string }) {
  // Simplifié pour éviter d'installer des composants si non nécessaires, mais on utilise le shadcn select d'habitude.
  // Ici je fais un select basique ou un lien.
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
        //@ts-ignore - this is a simplified client part in server component for the demo
      >
        <option value="ALL">Toutes les phases</option>
        {phases.map(p => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
    </div>
  );
}
