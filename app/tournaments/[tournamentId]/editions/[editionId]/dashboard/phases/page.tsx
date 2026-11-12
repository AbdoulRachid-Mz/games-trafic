import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { AlertCircle, GitBranch } from "lucide-react";
import { TournamentPhase } from "@/database/schema";
import { getTournamentPhases } from "@/actions/phases";
import { Typography } from "@/components/ui/typography";
import { CreatePhaseDialog } from "@/components/pages/tournaments/edition-detail/create-phase-dialog";
import { PhaseCard } from "@/components/cards/phase-card";

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
    options: { sortBy: "order", sortOrder: "asc", includeInactive: true },
  });
  const phases = phasesResponse.data;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Typography variant="h3" weight="bold" className="tracking-tight">
            Configuration des Phases
          </Typography>
          <Typography variant="body-sm" theme="muted" className="mt-1">
            Gérez la structure et le déroulement de votre édition.
          </Typography>
        </div>

        <CreatePhaseDialog
          editionId={editionId}
          tournamentId={tournamentId}
          nextOrder={phases.length + 1}
        />
      </div>

      {/* Empty state */}
      {phases.length === 0 ? (
        <Card className="border-dashed border-2 bg-muted/20">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <GitBranch className="h-8 w-8 text-muted-foreground" />
            </div>
            <Typography variant="h5" weight="bold" className="mb-2">Aucune phase configurée</Typography>
            <Typography variant="body-sm" theme="muted" className="max-w-xs mb-8">
              Ajoutez une phase pour structurer votre tournoi : Élimination directe, Poules, Round Robin, etc.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {phases.map((phase: TournamentPhase, idx: number) => (
            <PhaseCard
              key={phase.id}
              item={phase}
              tournamentId={tournamentId}
              editionId={editionId}
              isFirst={idx === 0}
              isLast={idx === phases.length - 1}
              phasesCount={phases.length}
              canManage
            />
          ))}
        </div>
      )}

      {/* Info note */}
      {phases.length > 0 && (
        <div className="p-5 rounded-2xl bg-primary/5 border border-primary/10 flex gap-4 items-start shadow-sm shadow-primary/5">
          <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1">
            <Typography variant="body-sm" weight="bold" className="text-primary">Note sur la structure</Typography>
            <Typography variant="caption1" theme="muted" className="leading-relaxed">
              L&apos;ordre des phases détermine comment les participants progressent à travers la compétition.
              Vous pouvez réorganiser les phases en utilisant les flèches. Activez une phase pour la rendre visible pour les participants.
            </Typography>
          </div>
        </div>
      )}
    </div>
  );
}
