import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, GitBranch, AlertCircle, ArrowUp, ArrowDown, Settings2, Trash2, Zap, Eye, ArrowRight } from "lucide-react";
import { TournamentPhase } from "@/database/schema";
import { getTournamentPhases } from "@/actions/tournaments";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { CreatePhaseDialog } from "@/components/pages/tournaments/edition-detail/create-phase-dialog";
import { PhaseItemActions } from "@/components/pages/tournaments/edition-detail/phase-item-actions";

interface PageProps {
  params: Promise<{
    tournamentId: string;
    editionId: string;
  }>;
}

const PHASE_TYPES = [
  { value: "ELIMINATION", label: "Élimination directe", description: "Bracket à élimination simple" },
  { value: "ROUND_ROBIN", label: "Round Robin", description: "Chaque joueur affronte tous les autres" },
  { value: "GROUP_STAGE", label: "Phase de poules", description: "Plusieurs groupes avec qualifications" },
  { value: "SWISS", label: "Système suisse", description: "Adversaires de même niveau à chaque ronde" },
  { value: "KNOCKOUT", label: "Knockout", description: "Élimination directe - variante" },
  { value: "CUSTOM", label: "Personnalisé", description: "Configuration libre" },
] as const;

function phaseTypeLabel(type: string | null | undefined): string {
  return PHASE_TYPES.find((t) => t.value === type)?.label || type || "—";
}

function phaseTypeBadgeColor(type: string | null | undefined): string {
  switch (type) {
    case "ELIMINATION": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    case "ROUND_ROBIN": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    case "GROUP_STAGE": return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
    case "SWISS": return "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400";
    case "KNOCKOUT": return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
    default: return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400";
  }
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
        <div className="grid gap-4">
          {phases.map((phase: TournamentPhase, idx: number) => (
            <Card key={phase.id} className="relative group hover:border-primary/50 transition-all border-border/50 overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors" />
              <CardHeader className="py-4 px-6 space-y-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Typography variant="body-base" weight="bold">
                        {phase.name}
                      </Typography>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${phaseTypeBadgeColor(phase.phaseType)}`}>
                        {phaseTypeLabel(phase.phaseType)}
                      </span>
                      {phase.isDoubleElimination && (
                        <Badge variant="outline" className="text-[10px] h-5 px-2 bg-muted/50">Double Élim.</Badge>
                      )}
                      {phase.isActive && (
                        <Badge className="bg-green-600 text-white text-[10px] h-5 px-2 shadow-sm border-none">Active</Badge>
                      )}
                      {phase.isCompleted && (
                        <Badge variant="secondary" className="text-[10px] h-5 px-2">Terminée</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
                      <span className="flex items-center gap-1.5">
                        <Settings2 className="h-3.5 w-3.5" /> Ordre: {phase.order}
                      </span>
                      {phase.totalMatches !== null && phase.totalMatches !== undefined && (
                        <>
                          <span className="text-muted-foreground/30">|</span>
                          <span>{phase.completedMatches ?? 0}/{phase.totalMatches} matches terminés</span>
                        </>
                      )}
                    </div>
                  </div>

                  <PhaseItemActions
                    phase={phase}
                    tournamentId={tournamentId}
                    editionId={editionId}
                    isFirst={idx === 0}
                    isLast={idx === phases.length - 1}
                    phasesCount={phases.length}
                  />
                </div>
              </CardHeader>
            </Card>
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
