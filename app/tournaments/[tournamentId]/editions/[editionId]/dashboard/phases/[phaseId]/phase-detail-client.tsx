// app/tournaments/[tournamentId]/editions/[editionId]/dashboard/phases/[phaseId]/PhaseDetailClient.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Settings2, Users, Swords, ChevronLeft, PlusCircle, RefreshCcw, AlertTriangle } from "lucide-react";
import type { TournamentPhase, PhaseGroup } from "@/database/schema";
import { PhaseDetailActions } from "@/components/pages/tournaments/edition-detail/phase-detail-actions";
import { GroupItemActions } from "@/components/pages/tournaments/edition-detail/group-item-actions";
import { CreateGroupDialog } from "@/components/pages/tournaments/edition-detail/create-group-dialog";
import { GenerateGroupMatchesDialog } from "@/components/pages/tournaments/edition-detail/generate-group-matches-dialog";
import { DynamicActionMenu } from "@/components/shared/dynamic-action-menu";
import { useState, useTransition } from "react";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { updateTournamentEditionModeAction } from "@/actions/editions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface PhaseDetailClientProps {
  tournamentId: string;
  editionId: string;
  phaseId: string;
  phase: TournamentPhase | undefined;
  groups: PhaseGroup[];
  allPhases: TournamentPhase[];
  basePath: string;
  typeConf: { label: string; color: string; bgColor: string };
  editionConfig: {
    competitionType?: string;
    competitionMode?: "AUTO" | "MANUAL";
    [key: string]: any;
  };
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

export function PhaseDetailClient({ 
  tournamentId, 
  editionId, 
  phaseId, 
  phase, 
  groups, 
  allPhases, 
  basePath, 
  typeConf,
  editionConfig 
}: PhaseDetailClientProps) {

  const isAutoMode = editionConfig.competitionMode === "AUTO";
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSwitchToManual = () => {
    startTransition(async () => {
      try {
        await updateTournamentEditionModeAction(editionId, "MANUAL");
        toast.success("Mode basculé en Manuel", {
          description: "Vous avez maintenant le contrôle total de l'édition.",
        });
        router.refresh();
      } catch (error) {
        toast.error("Erreur lors du basculement", {
          description: "Impossible de basculer en mode Manuel.",
        });
      }
    });
  };
  
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
                  {isAutoMode ? (
                    <Badge className="bg-blue-600/10 text-blue-600 border-blue-600/20 shadow-sm text-xs px-3 py-0.5 flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                      Mode Auto (Assistant)
                    </Badge>
                  ) : (
                    <Badge className="bg-amber-600/10 text-amber-600 border-amber-600/20 shadow-sm text-xs px-3 py-0.5">
                      Mode Manuel
                    </Badge>
                  )}
                  {phase.isActive && (
                    <Badge className="bg-green-600/10 text-green-600 border-green-600/20 shadow-sm text-xs px-3 py-0.5">Active</Badge>
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

              <div className="flex items-center gap-2">
                {isAutoMode && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8 border-amber-500/30 text-amber-600 hover:bg-amber-500/5 text-[10px] font-black uppercase tracking-wider">
                        Passer en manuel
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
                          <AlertTriangle className="h-5 w-5" /> Basculer en mode Manuel ?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-3">
                          <p>
                            En basculant en mode **Manuel**, vous prenez le contrôle total de la structure de l'édition.
                          </p>
                          <div className="bg-amber-500/10 p-3 rounded-lg border border-amber-500/20 text-amber-700 text-xs space-y-2">
                             <p className="font-bold">Risques identifiés :</p>
                             <ul className="list-disc pl-4 space-y-1">
                               <li>L'Assistant (Wizard) ne pourra plus générer ou réorganiser automatiquement les phases.</li>
                               <li>Les calculs automatiques de qualification pourraient être perturbés si la structure change.</li>
                               <li>**Cette action est irréversible** pour cette édition.</li>
                             </ul>
                          </div>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handleSwitchToManual}
                          className="bg-amber-600 hover:bg-amber-700"
                        >
                          Confirmer la bascule
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}

                <PhaseDetailActions
                  phaseId={phaseId}
                  isActive={phase.isActive ?? false}
                  isCompleted={phase.isCompleted ?? false}
                  phaseType={phase.phaseType as string | undefined}
                  editionType={editionConfig.competitionType}
                />
              </div>
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
                {groups.length} groupe{groups.length > 1 ? 's' : ''} configuré{groups.length > 1 ? 's' : ''}
              </Typography>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isAutoMode ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <RefreshCcw className="h-4 w-4 mr-2" />
                    Organiser Phase
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                   <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-500" /> Action Déconseillée en Mode Auto
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Cette phase est gérée par l'Assistant. La modification manuelle de la structure (groupes, participants) peut perturber le calcul automatique des qualifications.
                        <br /><br />
                        Il est recommandé de laisser l'Assistant gérer la structure ou de basculer en **Mode Manuel** au préalable.
                      </AlertDialogDescription>
                   </AlertDialogHeader>
                   <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction asChild>
                        <Link href={`./phases/${phaseId}/organize`}>Continuer quand même</Link>
                      </AlertDialogAction>
                   </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <Button variant="outline" asChild size="sm">
                <Link href={`./phases/${phaseId}/organize`}>
                    <RefreshCcw className="h-4 w-4 mr-2" />
                    Organiser Phase
                </Link>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-3">
          {groups.length === 0 ? (
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
              {groups.map((group, idx) => (
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
                      isLast={idx === groups.length - 1}
                      phaseId={phaseId}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <DynamicActionMenu 
        floatingLabel="Actions"
        actions={[
          {
            id: "create-group",
            label: "Nouveau Groupe",
            icon: PlusCircle,
            paramKey: "action",
            paramValue: "createGroup",
            overlayType: "dialog",
            renderContent: (
              <>
                {isAutoMode && (
                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg mb-4 text-amber-700 text-xs flex gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <p>
                      <strong>Attention :</strong> Cette édition est en mode Auto. 
                      Créer manuellement un groupe peut briser la logique de l'Assistant.
                    </p>
                  </div>
                )}
                <CreateGroupDialog 
                  phaseId={phaseId} 
                  nextOrder={groups.length + 1} 
                  previousPhases={allPhases.filter(p => (p.order || 0) < (phase?.order || 0)).map(p => ({ id: p.id, name: p.name || `Phase ${p.order}` }))}
                  asFormOnly
                />
              </>
            )
          },
          {
             id: "organise",
             label: "Générer Structure",
             icon: RefreshCcw,
             href: `./phases/${phaseId}/organize`,
             separatorBefore: true,
             ...(isAutoMode ? {
               overlayType: "dialog",
               renderContent: (
                 <div className="space-y-4 p-4">
                   <div className="flex items-center gap-2 text-amber-600 font-bold">
                     <AlertTriangle className="h-5 w-5" /> Action Déconseillée
                   </div>
                   <p className="text-sm text-muted-foreground">
                     La génération manuelle de structure en mode Auto peut perturber l'Assistant. 
                     Il est préférable de laisser l'Assistant gérer ou de basculer en mode Manuel.
                   </p>
                   <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => router.push(`./phases/${phaseId}/organize`)}>Continuer quand même</Button>
                   </div>
                 </div>
               )
             } : {})
          }
        ]}
      />
    </div>
  );
}