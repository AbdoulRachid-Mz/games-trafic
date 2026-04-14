import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { getTournamentPhases } from "@/actions/phases";
import { getPhaseGroups } from "@/actions/phases";
import Link from "next/link";
import { Settings2, Users, Swords, ChevronLeft } from "lucide-react";
import type { TournamentPhase, PhaseGroup } from "@/database/schema";
import { PhaseDetailActions } from "@/components/pages/tournaments/edition-detail/phase-detail-actions";
import { GroupItemActions } from "@/components/pages/tournaments/edition-detail/group-item-actions";
import { CreateGroupDialog } from "@/components/pages/tournaments/edition-detail/create-group-dialog";
import { GenerateGroupMatchesDialog } from "@/components/pages/tournaments/edition-detail/generate-group-matches-dialog";

interface PageProps {
  params: Promise<{
    tournamentId: string;
    editionId: string;
    phaseId: string;
  }>;
}

const phaseTypeConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  ELIMINATION: { label: "Élimination directe", color: "text-red-700", bgColor: "bg-red-100 border-red-200" },
  DOUBLE_ELIMINATION: { label: "Double élimination", color: "text-orange-700", bgColor: "bg-orange-100 border-orange-200" },
  ROUND_ROBIN: { label: "Round Robin", color: "text-blue-700", bgColor: "bg-blue-100 border-blue-200" },
  GROUP_STAGE: { label: "Phase de groupes", color: "text-green-700", bgColor: "bg-green-100 border-green-200" },
  SWISS: { label: "Suisse", color: "text-purple-700", bgColor: "bg-purple-100 border-purple-200" },
  KNOCKOUT: { label: "K.O.", color: "text-pink-700", bgColor: "bg-pink-100 border-pink-200" },
  CUSTOM: { label: "Personnalisé", color: "text-gray-700", bgColor: "bg-gray-100 border-gray-200" },
  GROUP_ELIMINATION: { label: "Groupes + Élimination", color: "text-teal-700", bgColor: "bg-teal-100 border-teal-200" },
};

export default async function PhaseDetailPage({ params }: PageProps) {
  const { tournamentId, editionId, phaseId } = await params;

  const allPhasesRes = await getTournamentPhases({
    filters: { editionId },
    options: { sortBy: "order", sortOrder: "asc" },
  });
  const allPhases = allPhasesRes.data;
  const phase = allPhases.find((p) => p.id === phaseId);

  const groupsRes = await getPhaseGroups({
    filters: { phaseId },
    options: { sortBy: "order", sortOrder: "asc" },
    pagination: { page: 1, limit: 500 },
  });

  const basePath = `/tournaments/${tournamentId}/editions/${editionId}/dashboard`;
  const typeConf = phaseTypeConfig[phase?.phaseType || ""] || phaseTypeConfig.CUSTOM;

  return (
    <div className="space-y-3 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Button variant="ghost" size="sm" className="h-7 px-2 -ml-2 hover:bg-transparent" asChild>
              <Link href={`${basePath}/phases`}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Retour aux phases
              </Link>
            </Button>
          </div>
          <Typography variant="h3" weight="bold">{phase?.name || "Détails de la phase"}</Typography>
        </div>
      </div>

      {/* Phase info card */}
      {phase && (
        <Card className="overflow-hidden border-border/50">
          <CardContent className="p-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-2">
                {/* Type badge + status */}
                <div className="flex items-center gap-2.5 flex-wrap">
                  <Badge className={`${typeConf.bgColor} ${typeConf.color} border shadow-sm text-xs font-bold px-3 py-0.5`}>
                    {typeConf.label}
                  </Badge>
                  {phase.isActive && (
                    <Badge className="bg-green-600/10 text-green-600 border-green-600/20 shadow-sm text-xs px-3 py-0.5">Active</Badge>
                  )}
                  {!phase.isActive && (
                    <Badge variant="outline" className="text-muted-foreground text-xs px-3 py-0.5">Inactive</Badge>
                  )}
                  {phase.isCompleted && (
                    <Badge variant="secondary" className="text-xs px-3 py-0.5">Terminée</Badge>
                  )}
                </div>

                {/* Config details */}
                <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap font-medium">
                  <span className="flex items-center gap-2">
                    <Settings2 className="h-4 w-4" /> Ordre de passage: {phase.order}
                  </span>
                  {(phase as any).seedingMethod && (
                    <span className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-border" />
                      Seeding: {(phase as any).seedingMethod}
                    </span>
                  )}
                </div>
              </div>

              <PhaseDetailActions
                phaseId={phaseId}
                isActive={phase.isActive ?? false}
                isCompleted={phase.isCompleted ?? false}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Groups */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b py-5 px-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Groupes & Écuries</CardTitle>
              <Typography variant="caption1" theme="muted" className="mt-0.5">
                {groupsRes.data.length} groupe{groupsRes.data.length > 1 ? 's' : ''} configuré{groupsRes.data.length > 1 ? 's' : ''}
              </Typography>
            </div>
          </div>
          <CreateGroupDialog 
            phaseId={phaseId} 
            nextOrder={groupsRes.data.length + 1} 
            previousPhases={allPhases.filter(p => (p.order || 0) < (phase?.order || 0)).map(p => ({ id: p.id, name: p.name || `Phase ${p.order}` }))}
          />
        </CardHeader>
        <CardContent className="p-3">
          {groupsRes.data.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 opacity-20" />
              </div>
              <Typography variant="body-base" weight="semibold">Aucun groupe</Typography>
              <Typography variant="body-sm" theme="muted" className="mt-1 max-w-xs mx-auto">
                Commencez par créer un groupe pour y ajouter des participants et générer des matchs.
              </Typography>
            </div>
          ) : (
            <div className="grid gap-4">
              {(groupsRes.data as PhaseGroup[]).map((group, idx) => (
                <div key={group.id} className="group relative border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-primary/50 hover:bg-primary/5 transition-all">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Typography variant="body-base" weight="bold">{group.name}</Typography>
                      <Badge variant="outline" className="text-[10px] h-5 bg-background font-bold tracking-wider">ORDRE {group.order}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium">
                      <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> {group.participantCount ?? 0} participants</span>
                      <span className="flex items-center gap-1.5"><Swords className="h-3.5 w-3.5" /> {group.matchCount ?? 0} matchs</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {(!group.matchCount || group.matchCount === 0) && (
                      <GenerateGroupMatchesDialog
                        groupId={group.id}
                        editionId={editionId}
                        phaseId={phaseId}
                      />
                    )}
                    <GroupItemActions
                      group={group}
                      basePath={basePath}
                      isFirst={idx === 0}
                      isLast={idx === groupsRes.data.length - 1}
                      phaseId={phaseId}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
