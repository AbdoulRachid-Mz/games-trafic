import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, GitBranch, AlertCircle, ArrowRight, Settings2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TournamentPhase } from "@/database/schema";
import { getTournamentPhases } from "@/actions/tournaments";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";

interface PageProps {
  params: Promise<{
    tournamentId: string;
    editionId: string;
  }>;
}

export default async function DashboardPhasesPage({ params }: PageProps) {
  const { tournamentId, editionId } = await params;

  const phasesResponse = await getTournamentPhases({
    filters: { editionId },
    options: { sortBy: "order", sortOrder: "asc" },
  });

  const phases = phasesResponse.data;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Typography variant="h3" weight="bold" className="tracking-tight">
            Configuration des Phases
          </Typography>
          <Typography variant="body-sm" theme="muted" className="mt-1">
            Gérez la structure et le déroulement de votre édition.
          </Typography>
        </div>
        <Button className="shrink-0">
          <Plus className="mr-2 h-4 w-4" /> Nouvelle Phase
        </Button>
      </div>

      {phases.length === 0 ? (
        <Card className="border-dashed border-2 bg-muted/20">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <GitBranch className="h-8 w-8 text-muted-foreground" />
            </div>
            <Typography variant="h5" weight="bold" className="mb-2">Aucune phase configurée</Typography>
            <Typography variant="body-sm" theme="muted" className="max-w-xs mb-8">
              Ajoutez une phase pour structurer votre tournoi : Élimination directe, Poules, Championnat, etc.
            </Typography>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Ajouter ma première phase
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {phases.map((phase: TournamentPhase) => (
            <Card key={phase.id} className="group hover:border-primary/50 transition-all border-border/50 overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors" />
              <CardHeader className="flex flex-row items-center justify-between py-4 space-y-0 relative">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Typography variant="body-base" weight="bold">
                      {phase.name}
                    </Typography>
                    <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-widest px-1.5 h-4">
                      {phase.phaseType}
                    </Badge>
                  </div>
                  <Typography variant="caption1" theme="muted" className="flex items-center gap-2">
                    <Settings2 className="h-3 w-3" /> Ordre de progression: {phase.order}
                  </Typography>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="h-8">
                    Modifier
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 gap-2">
                    Gérer <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {phases.length > 0 && (
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex gap-4 items-start">
          <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <Typography variant="body-sm" weight="bold" className="text-primary">Note sur la progression</Typography>
            <Typography variant="caption1" theme="muted" className="mt-1">
              L'ordre des phases détermine comment les participants progressent. Assurez-vous que l'ordre numérique (1, 2, 3...) correspond à votre planning.
            </Typography>
          </div>
        </div>
      )}
    </div>
  );
}
