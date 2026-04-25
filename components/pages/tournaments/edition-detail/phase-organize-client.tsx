// @/components/pages/tournaments/edition-detail/phase-organize-client.tsx
"use client";

import {
  useState,
  useTransition,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Trash2,
  Loader2,
  Settings2,
  RefreshCcw,
  CheckCircle2,
  AlertCircle,
  X,
  Users,
  LayoutGrid,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Trophy,
  Calendar,
  Info,
  Play,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  organizeEditionStructure,
  generateMatchesAction,
  getStructurePreviewAction,
} from "@/actions/phases";
import { Badge } from "@/components/ui/badge";
import { Typography } from "@/components/ui/typography";
import Link from "next/link";
import { MatchGenerationDialog } from "./match-generation-dialog";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface PhaseOrganizeClientProps {
  tournamentId: string;
  editionId: string;
  phaseId: string;
  phaseName: string;
  phaseType: string;
  phaseConfig: any;
  sourceParticipants: any[];
  existingGroups: any[];
  editionConfig: {
    competitionType?: string;
    competitionMode?: "AUTO" | "MANUAL";
    [key: string]: any;
  };
}

type DraftGroup = {
  id: string;
  name: string;
  order: number;
  participantIds: string[];
  config: {
    participantsPerGroup?: number;
    isHomeAway?: boolean;
    pointsPerWin?: number;
    pointsPerDraw?: number;
    pointsPerLoss?: number;
    advanceCount?: number;
    generateNodes?: boolean;
    generateMatches?: boolean;
    nodesConfig?: {
      type: "ROUND_ROBIN" | "ELIMINATION" | "SWISS";
      roundsCount?: number;
      matchesPerNode?: number;
    };
  };
};

const generateTempId = () =>
  `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export function PhaseOrganizeClient({
  tournamentId,
  editionId,
  phaseId,
  phaseName,
  phaseType,
  phaseConfig: inheritedConfig,
  sourceParticipants,
  existingGroups,
  editionConfig,
}: PhaseOrganizeClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isAutoMode = editionConfig.competitionMode === "AUTO";
  const [draftGroups, setDraftGroups] = useState<DraftGroup[]>([]);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"draft" | "existing">("draft");

  // Héritage de la configuration parente
  const defaultConfig = useMemo(
    () => ({
      participantsPerGroup: inheritedConfig?.participantsPerGroup || 4,
      groupsCount:
        inheritedConfig?.groupsCount ||
        Math.ceil(sourceParticipants.length / 4) ||
        1,
      isHomeAway: inheritedConfig?.isHomeAway || false,
      pointsPerWin: inheritedConfig?.pointsPerWin || 3,
      pointsPerDraw: inheritedConfig?.pointsPerDraw || 1,
      pointsPerLoss: inheritedConfig?.pointsPerLoss || 0,
      advanceCount: inheritedConfig?.advanceCount || 2,
      seedingMethod: inheritedConfig?.seedingMethod || "RANDOM",
      generateNodes: inheritedConfig?.generateNodes !== false,
      generateMatches: inheritedConfig?.generateMatches !== false,
      nodesType:
        inheritedConfig?.nodesType ||
        (phaseType === "ROUND_ROBIN" ? "ROUND_ROBIN" : "ELIMINATION"),
      roundsCount: inheritedConfig?.roundsCount || 5,
    }),
    [inheritedConfig, phaseType, sourceParticipants.length],
  );

  const [groupsCount, setGroupsCount] = useState(defaultConfig.groupsCount);
  const [participantsPerGroup, setParticipantsPerGroup] = useState(
    defaultConfig.participantsPerGroup,
  );
  const [seedingMethod, setSeedingMethod] = useState<
    "RANDOM" | "SEQUENTIAL" | "SNAKE"
  >(defaultConfig.seedingMethod);
  const [generateMatches, setGenerateMatches] = useState(
    defaultConfig.generateMatches,
  );
  const [groupPrefix, setGroupPrefix] = useState(
    phaseType === "ROUND_ROBIN" ? "Ligue" : "Groupe",
  );
  const [isHomeAway, setIsHomeAway] = useState(defaultConfig.isHomeAway);
  const [advanceCount, setAdvanceCount] = useState(defaultConfig.advanceCount);
  const [nodesType, setNodesType] = useState<
    "ROUND_ROBIN" | "ELIMINATION" | "SWISS"
  >(defaultConfig.nodesType);
  const [roundsCount, setRoundsCount] = useState(defaultConfig.roundsCount);

  // Calcul du nombre de groupes optimisé
  const optimalGroupsCount = useMemo(() => {
    if (phaseType === "ROUND_ROBIN") return 1;
    return Math.ceil(sourceParticipants.length / participantsPerGroup);
  }, [phaseType, sourceParticipants.length, participantsPerGroup]);

  const [serverPreview, setServerPreview] = useState<any>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // Mettre à jour le preview via le serveur
  useEffect(() => {
    const updatePreview = async () => {
      if (sourceParticipants.length === 0) return;

      setIsPreviewLoading(true);
      try {
        const actualGroupsCount = groupsCount || optimalGroupsCount;
        const previewConfig = {
          groupsCount: actualGroupsCount,
          advanceCount,
          isHomeAway,
          seedingMethod,
          generateMatches,
          nodesType,
          roundsCount,
          // ✅ Ajouter nodePrefix pour un meilleur preview
          nodePrefix: groupPrefix,
        };

        const previewData = await getStructurePreviewAction(
          editionId,
          [
            {
              name: phaseName,
              phaseType: phaseType as
                | "GROUP_STAGE"
                | "ROUND_ROBIN"
                | "ELIMINATION"
                | "SWISS",
              order: 0,
              config: previewConfig,
            },
          ],
          sourceParticipants.map((p) => p.id),
        );

        setServerPreview(previewData?.phases?.[0] || null);
      } catch (error) {
        console.error("Preview error:", error);
      } finally {
        setIsPreviewLoading(false);
      }
    };

    const timer = setTimeout(updatePreview, 500);
    return () => clearTimeout(timer);
  }, [
    groupsCount,
    optimalGroupsCount,
    advanceCount,
    isHomeAway,
    seedingMethod,
    generateMatches,
    nodesType,
    roundsCount,
    groupPrefix,
    editionId,
    phaseName,
    phaseType,
    sourceParticipants,
  ]);

  const handleAutoGenerate = () => {
    const actualGroupsCount = groupsCount || optimalGroupsCount;

    startTransition(async () => {
      try {
        const result = await organizeEditionStructure(
          editionId,
          [
            {
              name: phaseName,
              phaseType: phaseType as any,
              order: 0,
              config: {
                groupsCount: actualGroupsCount,
                advanceCount,
                isHomeAway,
                seedingMethod,
                generateGroups: true,
                generateNodes: true,
                generateMatches,
                nodePrefix: groupPrefix,
              },
            },
          ],
          sourceParticipants.map((p) => p.id),
          {
            clearExisting: true,
            targetPhaseId: phaseId, // ✅ Ajouter targetPhaseId pour ne toucher que cette phase
          },
        );

        if (result.success) {
          toast.success("Structure générée avec succès.");
          router.refresh();
        }
      } catch (error: any) {
        toast.error(
          error.message || "Erreur lors de la génération automatique.",
        );
      }
    });
  };

  // ✅ CORRECTION: generateMatchesAction utilise clearExisting, pas forceRecreate
  const handleGenerateMatchesForPhase = () => {
    startTransition(async () => {
      try {
        const result = await generateMatchesAction("PHASE", phaseId, {
          clearExisting: false, // ✅ Option correcte
          seedingMethod: seedingMethod === "RANDOM" ? "RANDOM" : "SEQUENTIAL",
          isHomeAway,
        });
        if (result.success) {
          toast.success("Matchs générés avec succès.");
          router.refresh();
        } else {
          toast.error(
            result.error || "Erreur lors de la génération des matchs.",
          );
        }
      } catch (error: any) {
        toast.error(
          error.message || "Erreur lors de la génération des matchs.",
        );
      }
    });
  };

  // ✅ NOUVELLE FONCTION: générer les matchs pour un groupe spécifique
  const handleGenerateMatchesForGroup = (groupId: string) => {
    startTransition(async () => {
      try {
        const result = await generateMatchesAction("GROUP", groupId, {
          clearExisting: false,
          seedingMethod: seedingMethod === "RANDOM" ? "RANDOM" : "SEQUENTIAL",
          isHomeAway,
        });
        if (result.success) {
          toast.success("Matchs générés avec succès pour le groupe.");
          router.refresh();
        } else {
          toast.error(
            result.error || "Erreur lors de la génération des matchs.",
          );
        }
      } catch (error: any) {
        toast.error(
          error.message || "Erreur lors de la génération des matchs.",
        );
      }
    });
  };

  const handleAddDraftGroup = () => {
    const newOrder = draftGroups.length + existingGroups.length;
    const newGroup: DraftGroup = {
      id: generateTempId(),
      name: `${groupPrefix} ${String.fromCharCode(65 + newOrder)}`,
      order: newOrder,
      participantIds: [],
      config: {
        participantsPerGroup,
        isHomeAway,
        pointsPerWin: defaultConfig.pointsPerWin,
        pointsPerDraw: defaultConfig.pointsPerDraw,
        pointsPerLoss: defaultConfig.pointsPerLoss,
        advanceCount,
        generateNodes: defaultConfig.generateNodes,
        generateMatches,
        nodesConfig: {
          type: nodesType,
          roundsCount,
          matchesPerNode: 1,
        },
      },
    };
    setDraftGroups([...draftGroups, newGroup]);
    toast.success("Groupe ajouté au draft");
  };

  const handleRemoveDraftGroup = (index: number) => {
    setDraftGroups(draftGroups.filter((_, i) => i !== index));
  };

  const handleUpdateDraftGroup = (
    index: number,
    updates: Partial<DraftGroup>,
  ) => {
    setDraftGroups((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], ...updates };
      return updated;
    });
  };

  const handleAssignParticipantToGroup = (
    groupId: string,
    registrationId: string,
  ) => {
    setDraftGroups((prev) =>
      prev.map((group) => {
        if (
          group.id === groupId &&
          !group.participantIds.includes(registrationId)
        ) {
          return {
            ...group,
            participantIds: [...group.participantIds, registrationId],
          };
        }
        return group;
      }),
    );
  };

  const handleRemoveParticipantFromGroup = (
    groupId: string,
    registrationId: string,
  ) => {
    setDraftGroups((prev) =>
      prev.map((group) => {
        if (group.id === groupId) {
          return {
            ...group,
            participantIds: group.participantIds.filter(
              (id) => id !== registrationId,
            ),
          };
        }
        return group;
      }),
    );
  };

  const handleDistributeParticipants = () => {
    const availableParticipants = sourceParticipants.map((p) => p.id);
    const shuffled = [...availableParticipants];
    if (seedingMethod === "RANDOM") {
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
    }

    const groupsWithParticipants = draftGroups.map((group, idx) => {
      const start = idx * participantsPerGroup;
      const end = start + participantsPerGroup;
      const participantIds = shuffled.slice(start, end);
      return { ...group, participantIds };
    });

    setDraftGroups(groupsWithParticipants);
    toast.success("Participants distribués dans les groupes");
  };

  const handleSaveGroups = () => {
    if (draftGroups.length === 0) return;

    startTransition(async () => {
      try {
        const { bulkCreatePhaseGroups } = await import("@/actions/phases");
        const createdGroups = await bulkCreatePhaseGroups(
          draftGroups.map((g) => ({
            phaseId,
            name: g.name,
            order: g.order + existingGroups.length,
            groupType: phaseType === "ROUND_ROBIN" ? "ROUND_ROBIN" : "STANDARD",
            participantCount: g.participantIds.length,
            config: {
              ...g.config,
              participants: g.participantIds,
            },
            isCompleted: false,
            isLocked: false,
            isDeleted: false,
          })),
        );

        const { bulkCreatePhaseGroupParticipants } =
          await import("@/actions/phases");
        for (let i = 0; i < createdGroups.length; i++) {
          const group = createdGroups[i];
          const draftGroup = draftGroups[i];
          if (draftGroup.participantIds.length > 0) {
            await bulkCreatePhaseGroupParticipants(
              draftGroup.participantIds.map((registrationId) => ({
                groupId: group.id,
                registrationId,
              })),
            );
          }
        }

        toast.success(`${createdGroups.length} groupe(s) créé(s) avec succès.`);
        setDraftGroups([]);
        router.refresh();
      } catch (error: any) {
        toast.error(error.message || "Erreur lors de la création des groupes.");
      }
    });
  };

  const getName = (registrationId: string) => {
    const reg = sourceParticipants.find((p) => p.id === registrationId);
    return reg?.member?.displayName || reg?.member?.user?.username || "Joueur";
  };

  const isParticipantAssigned = (registrationId: string) => {
    return draftGroups.some((g) => g.participantIds.includes(registrationId));
  };

  const getAvailableParticipants = () => {
    const assignedIds = new Set(draftGroups.flatMap((g) => g.participantIds));
    return sourceParticipants.filter((p) => !assignedIds.has(p.id));
  };

  return (
    <div className="space-y-6">
      {/* Fil d'Ariane */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href={`/tournaments/${tournamentId}/editions/${editionId}/dashboard/phases/${phaseId}`}
          className="hover:text-primary transition-colors"
        >
          {phaseName}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-foreground">Organisation</span>
      </div>

      {/* Mode Auto Warning */}
      {isAutoMode && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-4 items-start shadow-sm">
          <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <AlertCircle className="h-6 w-6 text-amber-600" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-amber-900 text-sm flex items-center gap-2">
              Mode Assistant Actif
            </h4>
            <p className="text-amber-800 text-xs leading-relaxed">
              Cette édition est actuellement gérée par l'Assistant (Mode Auto).
              Toute modification manuelle de la structure (ajout de groupes,
              matches) peut perturber l'arbre de compétition généré
              automatiquement. Il est vivement conseillé de basculer en{" "}
              <strong>Mode Manuel</strong> si vous souhaitez reprendre le
              contrôle total.
            </p>
          </div>
        </div>
      )}

      {/* Bandeau de configuration héritée */}
      {inheritedConfig && Object.keys(inheritedConfig).length > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Info className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Configuration héritée
            </span>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            {inheritedConfig.participantsPerGroup && (
              <Badge variant="secondary">
                {inheritedConfig.participantsPerGroup} part./groupe
              </Badge>
            )}
            {inheritedConfig.isHomeAway && (
              <Badge variant="secondary">Aller-Retour</Badge>
            )}
            {inheritedConfig.advanceCount && (
              <Badge variant="secondary">
                {inheritedConfig.advanceCount} qualifiés/groupe
              </Badge>
            )}
            {inheritedConfig.nodesType && (
              <Badge variant="secondary">
                Nœuds: {inheritedConfig.nodesType}
              </Badge>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Colonne gauche: Configuration */}
        <div className="space-y-6 lg:col-span-1">
          <Card className="border-primary/10 shadow-lg sticky top-24">
            <CardHeader className="bg-primary/5 pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-primary" /> Configuration
              </CardTitle>
              <CardDescription className="text-xs">
                Paramètres hérités de l'organisation principale
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              {isAutoMode ? (
                <div className="space-y-4">
                  <div className="bg-primary/5 p-3 rounded-lg border border-primary/20 space-y-2">
                    <p className="text-xs font-bold text-primary flex items-center gap-1.5">
                      <Trophy className="h-3.5 w-3.5" /> Configuration
                      Automatique
                    </p>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      Ce tournoi utilise le mode Assistant (Auto). Les
                      paramètres de cette phase sont définis globalement.
                    </p>
                  </div>
                  <div className="space-y-1.5 opacity-70 cursor-not-allowed">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground">
                      Type de phase
                    </Label>
                    <div className="flex gap-1.5">
                      <Badge variant="outline" className="text-[10px]">
                        {phaseType}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {nodesType}
                      </Badge>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Type de phase */}
                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Type de phase
                    </Label>
                    <div className="flex gap-2">
                      <Badge
                        variant={
                          phaseType === "ROUND_ROBIN" ? "default" : "outline"
                        }
                        className="text-xs"
                      >
                        Championnat
                      </Badge>
                      <Badge
                        variant={
                          phaseType === "GROUP_STAGE" ? "default" : "outline"
                        }
                        className="text-xs"
                      >
                        Groupes
                      </Badge>
                      <Badge
                        variant={
                          phaseType === "ELIMINATION" ? "default" : "outline"
                        }
                        className="text-xs"
                      >
                        Élimination
                      </Badge>
                    </div>
                  </div>

                  {/* Type de nœuds */}
                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Organisation des nœuds
                    </Label>
                    <Select
                      value={nodesType}
                      onValueChange={(v: any) => setNodesType(v)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ROUND_ROBIN">
                          Round Robin (Journées)
                        </SelectItem>
                        <SelectItem value="ELIMINATION">
                          Élimination directe
                        </SelectItem>
                        <SelectItem value="SWISS">Système Suisse</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Groupes */}
                  {(phaseType === "GROUP_STAGE" ||
                    nodesType === "ROUND_ROBIN") && (
                    <>
                      <div className="space-y-2">
                        <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          Nombre de groupes
                        </Label>
                        <div className="flex items-center gap-3">
                          <Slider
                            value={[groupsCount || optimalGroupsCount]}
                            onValueChange={(v) => setGroupsCount(v[0])}
                            min={1}
                            max={Math.min(
                              16,
                              Math.ceil(sourceParticipants.length / 2),
                            )}
                            step={1}
                            className="flex-1"
                          />
                          <span className="w-12 text-center font-bold text-sm">
                            {groupsCount || optimalGroupsCount}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          Optimal: {optimalGroupsCount} groupes
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          Participants par groupe
                        </Label>
                        <div className="flex items-center gap-3">
                          <Slider
                            value={[participantsPerGroup]}
                            onValueChange={(v) => setParticipantsPerGroup(v[0])}
                            min={2}
                            max={16}
                            step={1}
                            className="flex-1"
                          />
                          <span className="w-12 text-center font-bold text-sm">
                            {participantsPerGroup}
                          </span>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Rounds pour Swiss */}
                  {nodesType === "SWISS" && (
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Nombre de rounds
                      </Label>
                      <div className="flex items-center gap-3">
                        <Slider
                          value={[roundsCount]}
                          onValueChange={(v) => setRoundsCount(v[0])}
                          min={3}
                          max={11}
                          step={2}
                          className="flex-1"
                        />
                        <span className="w-12 text-center font-bold text-sm">
                          {roundsCount}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Options */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="home-away"
                        checked={isHomeAway}
                        onCheckedChange={(v) => setIsHomeAway(!!v)}
                      />
                      <Label
                        htmlFor="home-away"
                        className="text-xs font-medium cursor-pointer"
                      >
                        Aller-Retour (double confrontation)
                      </Label>
                    </div>

                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="gen-matches"
                        checked={generateMatches}
                        onCheckedChange={(v) => setGenerateMatches(!!v)}
                      />
                      <Label
                        htmlFor="gen-matches"
                        className="text-xs font-medium cursor-pointer"
                      >
                        Générer les matches immédiatement
                      </Label>
                    </div>
                  </div>

                  {/* Points */}
                  {(phaseType === "ROUND_ROBIN" ||
                    nodesType === "ROUND_ROBIN") && (
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                      <div>
                        <Label className="text-[9px] text-muted-foreground">
                          Points/V
                        </Label>
                        <Input
                          type="number"
                          className="h-7 text-xs"
                          value={defaultConfig.pointsPerWin}
                          disabled
                        />
                      </div>
                      <div>
                        <Label className="text-[9px] text-muted-foreground">
                          Points/N
                        </Label>
                        <Input
                          type="number"
                          className="h-7 text-xs"
                          value={defaultConfig.pointsPerDraw}
                          disabled
                        />
                      </div>
                      <div>
                        <Label className="text-[9px] text-muted-foreground">
                          Points/D
                        </Label>
                        <Input
                          type="number"
                          className="h-7 text-xs"
                          value={defaultConfig.pointsPerLoss}
                          disabled
                        />
                      </div>
                    </div>
                  )}

                  {/* Seeding */}
                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Méthode de seeding
                    </Label>
                    <Select
                      value={seedingMethod}
                      onValueChange={(v: any) => setSeedingMethod(v)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="RANDOM">Aléatoire</SelectItem>
                        <SelectItem value="SEQUENTIAL">Séquentiel</SelectItem>
                        <SelectItem value="SNAKE">Serpentin (Snake)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter className="pt-4 border-t bg-muted/30 flex flex-col gap-2">
              {isAutoMode ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      className="w-full gap-2 font-bold"
                      disabled={isPending || sourceParticipants.length === 0}
                    >
                      {isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4 fill-current" />
                      )}
                      Générer la phase
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmation</AlertDialogTitle>
                      <AlertDialogDescription>
                        L'Assistant va organiser cette phase automatiquement.
                        Toute structure existante pour cette phase sera
                        réinitialisée.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction onClick={handleAutoGenerate}>
                        Confirmer la génération
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : (
                <div className="w-full space-y-2">
                  <Button
                    className="w-full gap-2 font-bold"
                    onClick={handleSaveGroups}
                    disabled={isPending || draftGroups.length === 0}
                  >
                    {isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    Sauvegarder l&apos;organisation
                  </Button>
                  
                  <MatchGenerationDialog 
                    editionId={editionId}
                    phaseId={phaseId}
                    phaseType={phaseType}
                    config={inheritedConfig}
                  />
                </div>
              )}

              {!generateMatches && (
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={handleGenerateMatchesForPhase}
                  disabled={isPending || existingGroups.length === 0}
                >
                  <Calendar className="h-4 w-4" />
                  Générer les Matchs
                </Button>
              )}
            </CardFooter>
          </Card>

          {/* Stats participants */}
          <Card>
            <CardHeader className="bg-muted/30 pb-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Users className="h-4 w-4" /> Participants Source
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-2xl font-black text-primary">
                {sourceParticipants.length}
              </div>
              <p className="text-xs text-muted-foreground">
                Participants disponibles pour cette phase
              </p>
              <div className="mt-3 pt-3 border-t">
                {isPreviewLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  </div>
                ) : serverPreview ? (
                  <>
                    <div className="flex justify-between text-xs">
                      <span>Groupes:</span>
                      <span className="font-medium">
                        {serverPreview.groups?.length || 0}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                      <span>Matchs estimés:</span>
                      <span className="font-medium text-primary font-bold">
                        {serverPreview.matchesCount || 0}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2 italic">
                      {serverPreview.seedingNote || "Seed: " + seedingMethod}
                    </p>
                  </>
                ) : (
                  <p className="text-[10px] text-muted-foreground">
                    Aperçu indisponible
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Colonne droite: Draft des groupes */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-xl">
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as any)}
              className="w-full"
            >
              <CardHeader className="border-b pb-0">
                <div className="flex items-center justify-between mb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <LayoutGrid className="h-4 w-4 text-primary" /> Groupes
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleAddDraftGroup}
                      className="h-8 gap-1"
                    >
                      <Plus className="h-3 w-3" /> Nouveau groupe
                    </Button>
                    {draftGroups.length > 0 && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={handleDistributeParticipants}
                        className="h-8 gap-1"
                      >
                        <Users className="h-3 w-3" /> Distribuer
                      </Button>
                    )}
                  </div>
                </div>
                <TabsList className="bg-transparent gap-6 p-0 h-10 justify-start">
                  <TabsTrigger
                    value="draft"
                    className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-10 gap-2"
                  >
                    Draft{" "}
                    <Badge variant="secondary" className="h-5 min-w-5 px-1">
                      {draftGroups.length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger
                    value="existing"
                    className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-10 gap-2"
                  >
                    Existants{" "}
                    <Badge variant="outline" className="h-5 min-w-5 px-1">
                      {existingGroups.length}
                    </Badge>
                  </TabsTrigger>
                </TabsList>
              </CardHeader>
              <CardContent className="p-0">
                <TabsContent value="draft" className="m-0 focus-visible:ring-0">
                  {draftGroups.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-muted-foreground opacity-40">
                      <LayoutGrid className="h-12 w-12 mb-3" />
                      <p className="text-sm font-medium">
                        Aucun groupe dans le draft
                      </p>
                      <p className="text-xs">
                        Ajoutez des groupes ou utilisez l'auto-génération
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y max-h-[600px] overflow-y-auto">
                      {draftGroups.map((group, idx) => (
                        <GroupDraftCard
                          key={group.id}
                          group={group}
                          index={idx}
                          isExpanded={expandedGroup === group.id}
                          onToggleExpand={() =>
                            setExpandedGroup(
                              expandedGroup === group.id ? null : group.id,
                            )
                          }
                          onUpdate={(updates: any) =>
                            handleUpdateDraftGroup(idx, updates)
                          }
                          onRemove={() => handleRemoveDraftGroup(idx)}
                          onAssignParticipant={(regId: string) =>
                            handleAssignParticipantToGroup(group.id, regId)
                          }
                          onRemoveParticipant={(regId: string) =>
                            handleRemoveParticipantFromGroup(group.id, regId)
                          }
                          availableParticipants={getAvailableParticipants()}
                          allParticipants={sourceParticipants}
                          getName={getName}
                          isParticipantAssigned={isParticipantAssigned}
                          onGenerateMatches={handleGenerateMatchesForGroup}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>
                <TabsContent
                  value="existing"
                  className="m-0 focus-visible:ring-0"
                >
                  {existingGroups.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-muted-foreground opacity-40">
                      <LayoutGrid className="h-12 w-12 mb-3" />
                      <p className="text-sm font-medium">
                        Aucun groupe existant
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y max-h-[600px] overflow-y-auto">
                      {existingGroups.map((group) => (
                        <div
                          key={group.id}
                          className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary text-xs">
                              {group.order + 1}
                            </div>
                            <div>
                              <div className="font-bold text-sm">
                                {group.name}
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                <span>
                                  {group.participantCount || 0} participants
                                </span>
                                <span>{group.matchCount || 0} matchs</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {(!group.matchCount || group.matchCount === 0) && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 text-xs"
                                onClick={() =>
                                  handleGenerateMatchesForGroup(group.id)
                                }
                                disabled={isPending}
                              >
                                <Calendar className="h-3 w-3 mr-1" />
                                Générer
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs"
                              asChild
                            >
                              <Link
                                href={`/tournaments/${tournamentId}/editions/${editionId}/dashboard/groups/${group.id}/nodes`}
                              >
                                Gérer les nœuds{" "}
                                <ChevronRight className="h-3 w-3 ml-1" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>

          {/* Bouton de sauvegarde flottant */}
          {draftGroups.length > 0 && (
            <div className="fixed bottom-6 right-6 z-50">
              {isAutoMode ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="lg"
                      className="h-12 px-6 rounded-full shadow-2xl gap-2 font-bold"
                      disabled={isPending}
                    >
                      {isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      Sauvegarder {draftGroups.length} groupe(s)
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-amber-500" />{" "}
                        Confirmer la Création Manuelle
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Vous allez ajouter manuellement {draftGroups.length}{" "}
                        groupe(s) à cette phase gérée par l'Assistant. Il est
                        recommandé de laisser l'Assistant gérer la structure
                        pour éviter toute erreur de qualification.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction onClick={handleSaveGroups}>
                        Confirmer la sauvegarde
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : (
                <Button
                  size="lg"
                  className="h-12 px-6 rounded-full shadow-2xl gap-2 font-bold"
                  onClick={handleSaveGroups}
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Sauvegarder {draftGroups.length} groupe(s)
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Composant pour la carte de groupe en draft
function GroupDraftCard({
  group,
  index,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onRemove,
  onAssignParticipant,
  onRemoveParticipant,
  availableParticipants,
  allParticipants,
  getName,
  isParticipantAssigned,
  onGenerateMatches,
}: any) {
  const getParticipantDisplay = (regId: string) => {
    const reg = allParticipants.find((p: any) => p.id === regId);
    return reg?.member?.displayName || reg?.member?.user?.username || "Joueur";
  };

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggleExpand}>
      <div
        className={cn(
          "transition-all",
          isExpanded ? "bg-primary/5" : "hover:bg-muted/30",
        )}
      >
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between p-4 cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                {String.fromCharCode(65 + index)}
              </div>
              <div>
                <Input
                  className="h-7 text-sm font-semibold bg-transparent border-none focus:ring-0 px-0 w-32"
                  value={group.name}
                  onChange={(e) => onUpdate({ name: e.target.value })}
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="text-[10px] text-muted-foreground flex items-center gap-2">
                  <span>{group.participantIds.length} /{" "}
                  {group.config.participantsPerGroup} participants</span>
                  <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                  <span>{group.matchCount || 0} matchs</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={group.config.generateMatches ? "default" : "outline"}
                className="text-[9px]"
              >
                {group.config.generateMatches ? "Matchs ✓" : "Sans matchs"}
              </Badge>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="p-4 pt-0 border-t space-y-3">
            {/* Participants assignés */}
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">
                Participants ({group.participantIds.length})
              </Label>
              <div className="flex flex-wrap gap-2">
                {group.participantIds.map((regId: string) => (
                  <Badge
                    key={regId}
                    variant="secondary"
                    className="gap-1 pr-1 h-7 text-xs"
                  >
                    {getParticipantDisplay(regId)}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-5 w-5 hover:bg-destructive/10 hover:text-destructive rounded-full"
                      onClick={() => onRemoveParticipant(regId)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
                <select
                  className="h-7 text-xs bg-primary/10 border-none rounded-full px-3 font-bold text-primary outline-none focus:ring-1 focus:ring-primary"
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      onAssignParticipant(e.target.value);
                      e.target.value = "";
                    }
                  }}
                >
                  <option value="">+ Ajouter</option>
                  {availableParticipants.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {getName(p.id)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Configuration du groupe */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <Label className="text-[9px] text-muted-foreground">
                  Participants max
                </Label>
                <Input
                  type="number"
                  className="h-7 text-xs"
                  value={group.config.participantsPerGroup}
                  onChange={(e) =>
                    onUpdate({
                      config: {
                        ...group.config,
                        participantsPerGroup: parseInt(e.target.value) || 4,
                      },
                    })
                  }
                />
              </div>
              <div>
                <Label className="text-[9px] text-muted-foreground">
                  Qualifiés
                </Label>
                <Input
                  type="number"
                  className="h-7 text-xs"
                  value={group.config.advanceCount}
                  onChange={(e) =>
                    onUpdate({
                      config: {
                        ...group.config,
                        advanceCount: parseInt(e.target.value) || 2,
                      },
                    })
                  }
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Checkbox
                id={`home-away-${group.id}`}
                checked={group.config.isHomeAway}
                onCheckedChange={(v) =>
                  onUpdate({ config: { ...group.config, isHomeAway: !!v } })
                }
              />
              <Label
                htmlFor={`home-away-${group.id}`}
                className="text-xs cursor-pointer"
              >
                Aller-Retour
              </Label>
            </div>

            {/* ✅ Bouton pour générer les matchs directement depuis le draft */}
            <Button
              size="sm"
              variant="outline"
              className="w-full mt-2 text-xs"
              onClick={() => onGenerateMatches(group.id)}
              disabled={group.participantIds.length < 2}
            >
              <Calendar className="h-3 w-3 mr-1" />
              Générer les matchs
            </Button>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
