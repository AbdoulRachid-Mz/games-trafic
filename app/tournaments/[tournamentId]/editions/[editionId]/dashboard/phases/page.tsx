// import { getTournamentPhases } from "@/actions/tournanents";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, GitBranch, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TournamentPhase } from "@/database/schema";
import { getTournamentPhases } from "@/actions/tournaments";

interface DashboardPhasesPageProps {
  params: {
    tournamentId: string;
    editionId: string;
  };
}

export default async function DashboardPhasesPage({
  params,
}: DashboardPhasesPageProps) {
  const { editionId } = params;

  const phasesResponse = await getTournamentPhases({
    filters: { editionId },
    options: { sortBy: "order", sortOrder: "asc" },
  });

  const phases = phasesResponse.data;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Phases du Tournoi
          </h2>
          <p className="text-muted-foreground">
            Gérez la structure de votre tournoi (éliminations directes, poules,
            etc.)
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Nouvelle Phase
        </Button>
      </div>

      {phases.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Aucune phase configurée</AlertTitle>
          <AlertDescription>
            Commencez par ajouter une phase (ex: "Phase de poules" ou "Arbre
            final") pour structurer votre tournoi.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-6">
          {phases.map((phase : TournamentPhase) => (
            <Card key={phase.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-base font-medium">
                    {phase.name}
                  </CardTitle>
                  <CardDescription>
                    {phase.phaseType} • Ordre: {phase.order}
                  </CardDescription>
                </div>
                <GitBranch className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground mt-2">
                  {/* Configure phase button would go here */}
                  <Button variant="outline" size="sm">
                    Configurer
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
