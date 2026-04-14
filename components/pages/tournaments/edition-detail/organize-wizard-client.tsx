"use client";

import { useState, useTransition, useCallback, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  RefreshCw,
  Play,
  Settings2,
  ShieldCheck,
  CheckCircle2,
  Users,
  Plus,
  Trash2,
  MoveRight,
  Zap,
  AlertCircle,
  Info,
  Layers,
  Filter,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { organizeEditionStructure } from "@/actions/phases";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type DraftPhase = {
  id: string;
  name: string;
  phaseType: "GROUP_STAGE" | "ELIMINATION" | "ROUND_ROBIN" | "SWISS" | "KNOCKOUT";
  order: number;
  participantSource: "EDITION" | "PHASE_QUALIFIED" | "PHASE_ELIMINATED" | "ALL";
  sourcePhaseId?: string;
  qualifiedCount?: number;
  generateGroups: boolean;
  generateNodes: boolean;
  generateMatches: boolean;
  isHomeAway?: boolean;
  participantsPerGroup?: number;
  groupsCount?: number;
  roundsCount?: number;
};

const generateTempId = () => `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

interface OrganizeWizardClientProps {
  editionId: string;
  tournamentId: string;
  edition: any;
}

export function OrganizeWizardClient({
  editionId,
  tournamentId,
  edition,
}: OrganizeWizardClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<"AUTO" | "MANUAL">("AUTO");

  const [draftPhases, setDraftPhases] = useState<DraftPhase[]>([
    {
      id: generateTempId(),
      name: "Phase 1: Groupes",
      phaseType: "GROUP_STAGE",
      order: 0,
      participantSource: "EDITION",
      qualifiedCount: 2,
      generateGroups: true,
      generateNodes: true,
      generateMatches: true,
      participantsPerGroup: 4,
    },
    {
      id: generateTempId(),
      name: "Phase 2: Élimination",
      phaseType: "ELIMINATION",
      order: 1,
      participantSource: "PHASE_QUALIFIED",
      sourcePhaseId: undefined,
      qualifiedCount: 8,
      generateGroups: false,
      generateNodes: true,
      generateMatches: true,
      participantsPerGroup: 2,
    },
  ]);

  const [autoConfig, setAutoConfig] = useState({
    preset: "CHAMPIONS" as "LEAGUE" | "CHAMPIONS" | "SWISS" | "CUSTOM",
    includeGroups: true,
    includeElimination: true,
    includeQuarterFinals: true,
    includeSemiFinals: true,
    includeFinal: true,
    groupsQualifiedCount: 2,
    isHomeAway: false,
  });

  const [participantStrategy, setParticipantStrategy] = useState<
    "ALL" | "SELECTED"
  >("ALL");
  const [selectedRegIds, setSelectedRegIds] = useState<string[]>(
    edition?.registrations?.map((r: any) => r.id) || [],
  );

  const [autoInit, setAutoInit] = useState(true);
  const [randomize, setRandomize] = useState(true);
  const [groupsSize, setGroupsSize] = useState(4);

  const [autoGenFlags, setAutoGenFlags] = useState({
    generateGroups: true,
    generateNodes: true,
    generateMatches: true,
  });

  const maxParticipants = edition?.maxParticipants || 0;
  const currentParticipantsCount = selectedRegIds.length;
  const isOverLimit =
    maxParticipants > 0 && currentParticipantsCount > maxParticipants;
  const existingPhasesCount = edition?.phases?.length || 0;
  const hasExistingPhases = existingPhasesCount > 0;

  const phasesWithSourceLinks = useMemo(() => {
    return draftPhases.map((phase, idx) => {
      if (idx === 0) return phase;
      
      if (phase.participantSource !== "EDITION" && !phase.sourcePhaseId) {
        const previousPhase = draftPhases[idx - 1];
        if (previousPhase) {
          return { ...phase, sourcePhaseId: previousPhase.id };
        }
      }
      return phase;
    });
  }, [draftPhases]);

  const updateDraftPhasesWithLinks = useCallback(() => {
    const updated = phasesWithSourceLinks;
    if (JSON.stringify(updated) !== JSON.stringify(draftPhases)) {
      setDraftPhases(updated);
    }
  }, [phasesWithSourceLinks, draftPhases]);

  const handleUpdateDraftPhase = useCallback((
    index: number,
    updates: Partial<DraftPhase>
  ) => {
    setDraftPhases(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], ...updates };
      return updated;
    });
  }, []);

  useEffect(() => {
    updateDraftPhasesWithLinks();
  }, [updateDraftPhasesWithLinks]);

  const handleAddDraftPhase = () => {
    const newOrder = draftPhases.length;
    const previousPhase = draftPhases[draftPhases.length - 1];
    const newPhase: DraftPhase = {
      id: generateTempId(),
      name: `Phase ${newOrder + 1}`,
      phaseType: "ELIMINATION",
      order: newOrder,
      participantSource: previousPhase ? "PHASE_QUALIFIED" : "EDITION",
      sourcePhaseId: previousPhase ? previousPhase.id : undefined,
      qualifiedCount: 2,
      generateGroups: true,
      generateNodes: true,
      generateMatches: true,
      isHomeAway: false,
    };
    setDraftPhases([...draftPhases, newPhase]);
  };

  const handleRemoveDraftPhase = (index: number) => {
    const updated = draftPhases
      .filter((_, i) => i !== index)
      .map((p, i) => ({ ...p, order: i }));
    setDraftPhases(updated);
  };

  const getAvailablePhasesForSource = (currentIndex: number) => {
    return draftPhases
      .filter((_, i) => i < currentIndex)
      .map((p) => ({ id: p.id, name: p.name }));
  };

  const validatePhaseConfig = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    for (let i = 0; i < draftPhases.length; i++) {
      const phase = draftPhases[i];

      if (
        phase.participantSource === "PHASE_QUALIFIED" &&
        !phase.sourcePhaseId
      ) {
        errors.push(`Phase "${phase.name}": source des qualifiés non définie`);
      }

      if (
        phase.participantSource === "PHASE_QUALIFIED" &&
        phase.phaseType === "GROUP_STAGE"
      ) {
        errors.push(
          `Phase "${phase.name}": une phase de groupes ne peut pas prendre des qualifiés`
        );
      }

      if (
        phase.phaseType === "ELIMINATION" &&
        phase.participantSource === "EDITION" &&
        i === 0
      ) {
        const participantCount =
          participantStrategy === "ALL"
            ? edition?.registrations?.length || 0
            : selectedRegIds.length;
        const isPowerOfTwo = (n: number) => (n & (n - 1)) === 0 && n !== 0;
        if (!isPowerOfTwo(participantCount) && participantCount > 0) {
          errors.push(
            `Phase "${phase.name}": élimination directe nécessite un nombre de participants puissance de 2 (${participantCount} actuellement)`
          );
        }
      }
    }

    return { isValid: errors.length === 0, errors };
  };

  const buildAutoPhases = (): DraftPhase[] => {
    const phases: DraftPhase[] = [];
    const { preset, groupsQualifiedCount, isHomeAway } = autoConfig;
    const { generateGroups, generateNodes, generateMatches } = autoGenFlags;

    if (preset === "LEAGUE") {
      phases.push({
        id: generateTempId(),
        name: isHomeAway ? "Championnat (Aller-Retour)" : "Championnat",
        phaseType: "ROUND_ROBIN",
        order: 0,
        participantSource: "EDITION",
        generateGroups: true,
        generateNodes: generateNodes,
        generateMatches: generateMatches,
        isHomeAway: isHomeAway,
      });
    } else if (preset === "SWISS") {
      phases.push({
        id: generateTempId(),
        name: "Système Suisse",
        phaseType: "SWISS",
        order: 0,
        participantSource: "EDITION",
        generateGroups: true,
        generateNodes: generateNodes,
        generateMatches: generateMatches,
      });
    } else if (preset === "CHAMPIONS") {
      let lastPhaseId = null;
      
      const groupsId = generateTempId();
      phases.push({
        id: groupsId,
        name: "Phase de groupes",
        phaseType: "GROUP_STAGE",
        order: 0,
        participantSource: "EDITION",
        qualifiedCount: groupsQualifiedCount,
        generateGroups: true,
        generateNodes: generateNodes,
        generateMatches: generateMatches,
        isHomeAway: isHomeAway,
      });
      lastPhaseId = groupsId;

      const eliminationId = generateTempId();
      phases.push({
        id: eliminationId,
        name: "Phases finales",
        phaseType: "ELIMINATION",
        order: 1,
        participantSource: "PHASE_QUALIFIED",
        sourcePhaseId: lastPhaseId,
        qualifiedCount: 2,
        generateGroups: false,
        generateNodes: generateNodes,
        generateMatches: generateMatches,
      });
    }

    return phases;
  };

  const handleSaveOrganize = () => {
    const phasesToCreate: DraftPhase[] =
      mode === "AUTO" ? buildAutoPhases() : draftPhases;

    if (phasesToCreate.length === 0) {
      toast.error("Veuillez configurer au moins une phase.");
      return;
    }

    const validation = validatePhaseConfig();
    if (!validation.isValid) {
      validation.errors.forEach((err) => toast.error(err));
      return;
    }

    startTransition(async () => {
      try {
        const phasesForCreation = phasesToCreate.map((p, idx) => {
          let sourcePhaseIndex = undefined;
          if (p.sourcePhaseId) {
            const sourceIndex = phasesToCreate.findIndex(
              (phase) => phase.id === p.sourcePhaseId
            );
            if (sourceIndex !== -1) {
              sourcePhaseIndex = sourceIndex;
            }
          }

          return {
            name: p.name,
            phaseType: p.phaseType,
            order: idx + existingPhasesCount,
            isActive: idx === 0 && !hasExistingPhases,
            isCompleted: false,
            isHidden: false,
            isDeleted: false,
            config: {
              participantSource: p.participantSource,
              sourcePhaseIndex: sourcePhaseIndex,
              qualifiedCount: p.qualifiedCount,
              groupsSize: p.participantsPerGroup || groupsSize,
              groupsCount: p.groupsCount,
              roundsCount: p.roundsCount,
              generateGroups: p.generateGroups,
              generateNodes: p.generateNodes,
              generateMatches: p.generateMatches,
              isHomeAway: p.isHomeAway,
            },
          };
        });

        await organizeEditionStructure(
          editionId,
          phasesForCreation,
          selectedRegIds,
          {
            autoInitializeFirstPhase: autoInit,
            groupsSize: groupsSize,
            randomizeDistribution: randomize,
            generateGroups: phasesToCreate[0]?.generateGroups ?? true,
            generateNodes: phasesToCreate[0]?.generateNodes ?? true,
            generateMatches: phasesToCreate[0]?.generateMatches ?? true,
            isHomeAway: phasesToCreate[0]?.isHomeAway ?? false,
          }
        );

        toast.success("Structure et participants configurés avec succès !");

        setTimeout(() => {
          router.push(
            `/tournaments/${tournamentId}/editions/${editionId}/dashboard/phases`
          );
          router.refresh();
        }, 1000);
      } catch (error: any) {
        toast.error(error.message || "Erreur lors de l'organisation.");
      }
    });
  };

  const getName = (reg: any) =>
    reg.member?.displayName || reg.member?.user?.username || "Joueur";

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">
            Organisateur d'Édition
          </h2>
          <p className="text-muted-foreground text-sm">
            Configurez la hiérarchie des phases et les participants de départ.
          </p>
        </div>
        <div className="flex bg-muted p-1 rounded-lg self-start">
          <Button
            variant={mode === "AUTO" ? "default" : "ghost"}
            size="sm"
            onClick={() => setMode("AUTO")}
            className="gap-2"
          >
            <Zap className="h-4 w-4" /> Assistant
          </Button>
          <Button
            variant={mode === "MANUAL" ? "default" : "ghost"}
            size="sm"
            onClick={() => setMode("MANUAL")}
            className="gap-2"
          >
            <Settings2 className="h-4 w-4" /> Expert
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <Card className="relative overflow-hidden border-primary/20 shadow-xl">
          {hasExistingPhases && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-6 text-center">
              <ShieldCheck className="w-16 h-16 text-emerald-500 mb-4" />
              <h3 className="text-xl font-bold mb-2">Structure Existante</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Votre édition contient déjà {existingPhasesCount} phase(s).
              </p>
              <Button variant="outline" onClick={() => setMode("MANUAL")}>
                Continuer en Mode Expert
              </Button>
            </div>
          )}

          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Layers className="w-6 h-6 text-primary" /> 1. Configuration des
              Phases
            </CardTitle>
            <CardDescription>
              {mode === "AUTO"
                ? "Assistant rapide pour les structures classiques."
                : "Contrôle total sur la séquence et la source des participants."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {mode === "AUTO" ? (
              <AutoModeConfig
                autoConfig={autoConfig}
                setAutoConfig={setAutoConfig}
                groupsSize={groupsSize}
                setGroupsSize={setGroupsSize}
                autoGenFlags={autoGenFlags}
                setAutoGenFlags={setAutoGenFlags}
              />
            ) : (
              <ManualModeConfig
                draftPhases={draftPhases}
                onUpdatePhase={handleUpdateDraftPhase}
                onAddPhase={handleAddDraftPhase}
                onRemovePhase={handleRemoveDraftPhase}
                getAvailablePhases={getAvailablePhasesForSource}
              />
            )}

            <ParticipantStrategySection
              participantStrategy={participantStrategy}
              setParticipantStrategy={setParticipantStrategy}
              selectedRegIds={selectedRegIds}
              setSelectedRegIds={setSelectedRegIds}
              currentParticipantsCount={currentParticipantsCount}
              isPending={isPending}
              editionRegistrations={edition?.registrations || []}
              getName={getName}
            />

            <AutoInitSection
              autoInit={autoInit}
              setAutoInit={setAutoInit}
              randomize={randomize}
              setRandomize={setRandomize}
            />

            <SubmitButton
              isPending={isPending}
              isOverLimit={isOverLimit}
              currentParticipantsCount={currentParticipantsCount}
              maxParticipants={maxParticipants}
              mode={mode}
              draftPhasesLength={draftPhases.length}
              onSave={handleSaveOrganize}
            />
          </CardContent>
        </Card>

        <ParticipantSelectionCard
          editionRegistrations={edition?.registrations || []}
          participantStrategy={participantStrategy}
          selectedRegIds={selectedRegIds}
          setSelectedRegIds={setSelectedRegIds}
          isPending={isPending}
          getName={getName}
        />
      </div>

      <InfoBanner />
    </div>
  );
}

function AutoModeConfig({ autoConfig, setAutoConfig, groupsSize, setGroupsSize, autoGenFlags, setAutoGenFlags }: any) {
  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <Label className="font-bold text-xs uppercase tracking-wider text-primary">Preset de tournoi</Label>
        <div className="flex flex-wrap gap-2">
          {[
            { id: "LEAGUE", label: "Championnat", icon: Zap },
            { id: "CHAMPIONS", label: "LDC Style", icon: Layers },
            { id: "SWISS", label: "Système Suisse", icon: ShieldCheck },
            { id: "CUSTOM", label: "Personnalisé", icon: Settings2 }
          ].map((p) => (
            <Button
              key={p.id}
              variant={autoConfig.preset === p.id ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoConfig({ ...autoConfig, preset: p.id as any })}
              className="gap-2"
            >
              <p.icon className="h-3.5 w-3.5" /> {p.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl border bg-card hover:border-primary/40 transition-all space-y-3">
          <Label className="font-bold text-xs uppercase tracking-wider text-primary">
            Contenu à générer
          </Label>
          <div className="space-y-3 pt-1">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="gen-groups"
                checked={autoGenFlags.generateGroups}
                onCheckedChange={(v) =>
                  setAutoGenFlags({ ...autoGenFlags, generateGroups: !!v })
                }
              />
              <Label htmlFor="gen-groups" className="text-sm font-medium cursor-pointer">
                Groupes / Divisions
              </Label>
            </div>
            <div className="flex items-center space-x-3">
              <Checkbox
                id="gen-nodes"
                checked={autoGenFlags.generateNodes}
                onCheckedChange={(v) =>
                  setAutoGenFlags({ ...autoGenFlags, generateNodes: !!v })
                }
              />
              <Label htmlFor="gen-nodes" className="text-sm font-medium cursor-pointer">
                Brackets / Rencontres
              </Label>
            </div>
            <div className="flex items-center space-x-3">
              <Checkbox
                id="gen-matches"
                checked={autoGenFlags.generateMatches}
                onCheckedChange={(v) =>
                  setAutoGenFlags({ ...autoGenFlags, generateMatches: !!v })
                }
              />
              <Label htmlFor="gen-matches" className="text-sm font-medium cursor-pointer">
                Matches (Horaires/Scores)
              </Label>
            </div>
            <div className="pt-2 border-t mt-2">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="home-away"
                  checked={autoConfig.isHomeAway}
                  onCheckedChange={(v) =>
                    setAutoConfig({ ...autoConfig, isHomeAway: !!v })
                  }
                />
                <Label htmlFor="home-away" className="text-sm font-bold text-primary cursor-pointer">
                  Aller-Retour
                </Label>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl border bg-card space-y-3">
          <Label className="font-bold text-xs uppercase tracking-wider text-primary">
            Paramètres
          </Label>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="groupsQualified" className="text-xs">
                Qualifiés par groupe
              </Label>
              <Input
                id="groupsQualified"
                type="number"
                min={1}
                max={8}
                className="w-20 h-8 text-center"
                value={autoConfig.groupsQualifiedCount}
                onChange={(e) =>
                  setAutoConfig({
                    ...autoConfig,
                    groupsQualifiedCount: parseInt(e.target.value) || 2,
                  })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="groupsSize" className="text-xs">
                Taille des groupes
              </Label>
              <Input
                id="groupsSize"
                type="number"
                min={2}
                max={64}
                className="w-20 h-8 text-center"
                value={groupsSize}
                onChange={(e) => setGroupsSize(parseInt(e.target.value) || 4)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ManualModeConfig({
  draftPhases,
  onUpdatePhase,
  onAddPhase,
  onRemovePhase,
  getAvailablePhases,
}: any) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="font-bold text-xs uppercase tracking-wider text-primary">
          Séquence des phases
        </Label>
        <Button size="sm" variant="outline" onClick={onAddPhase} className="h-7 gap-1">
          <Plus className="h-3 w-3" /> Ajouter
        </Button>
      </div>

      <div className="space-y-4">
        {draftPhases.map((phase: DraftPhase, idx: number) => (
          <PhaseConfigCard
            key={phase.id}
            phase={phase}
            index={idx}
            isFirst={idx === 0}
            availablePhases={getAvailablePhases(idx)}
            onUpdate={(updates: Partial<DraftPhase>) => onUpdatePhase(idx, updates)}
            onRemove={() => onRemovePhase(idx)}
          />
        ))}

        {draftPhases.length === 0 && (
          <div className="py-6 text-center border-dashed border-2 rounded-xl text-muted-foreground text-xs">
            Aucune phase dans la séquence.
          </div>
        )}
      </div>
    </div>
  );
}

function PhaseConfigCard({
  phase,
  index,
  isFirst,
  availablePhases,
  onUpdate,
  onRemove,
}: {
  phase: DraftPhase;
  index: number;
  isFirst: boolean;
  availablePhases: Array<{ id: string; name: string }>;
  onUpdate: (updates: Partial<DraftPhase>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="bg-card p-4 rounded-lg border border-primary/10 space-y-3 animate-in slide-in-from-left-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
            {index + 1}
          </div>
          <Input
            className="w-40 h-8 text-sm font-semibold bg-transparent border-none focus:ring-0 px-0"
            value={phase.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="Nom de la phase"
          />
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={onRemove}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-[10px] font-bold uppercase text-muted-foreground">
            Type
          </Label>
          <Select
            value={phase.phaseType}
            onValueChange={(value) => onUpdate({ phaseType: value as any })}
          >
            <SelectTrigger className="h-8 text-xs mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ROUND_ROBIN">Ligue / Round Robin</SelectItem>
              <SelectItem value="GROUP_STAGE">Phase de groupes</SelectItem>
              <SelectItem value="ELIMINATION">Élimination directe</SelectItem>
              <SelectItem value="SWISS">Système Suisse</SelectItem>
              <SelectItem value="KNOCKOUT">Matchs à élimination</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-[10px] font-bold uppercase text-muted-foreground">
            Source participants
          </Label>
          <Select
            value={phase.participantSource}
            onValueChange={(value) =>
              onUpdate({ participantSource: value as any })
            }
            disabled={isFirst}
          >
            <SelectTrigger className="h-8 text-xs mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EDITION">Tous les inscrits</SelectItem>
              {!isFirst && (
                <>
                  <SelectItem value="PHASE_QUALIFIED">
                    Qualifiés phase précédente
                  </SelectItem>
                  <SelectItem value="PHASE_ELIMINATED">
                    Éliminés phase précédente
                  </SelectItem>
                  <SelectItem value="ALL">
                    Tous participants phase précédente
                  </SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="pt-3 border-t space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-[10px] font-bold uppercase text-primary">Générer enfant</Label>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Checkbox
                checked={phase.generateGroups}
                onCheckedChange={(v) => onUpdate({ generateGroups: !!v })}
              />
              <span className="text-[10px] font-medium">Groupes</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Checkbox
                checked={phase.generateNodes}
                onCheckedChange={(v) => onUpdate({ generateNodes: !!v })}
              />
              <span className="text-[10px] font-medium">Nodes</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Checkbox
                checked={phase.generateMatches}
                onCheckedChange={(v) => onUpdate({ generateMatches: !!v })}
              />
              <span className="text-[10px] font-medium">Matches</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 bg-primary/5 p-3 rounded-lg border border-primary/10">
          {(phase.phaseType === "ROUND_ROBIN" || phase.phaseType === "GROUP_STAGE") && (
            <>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Participants par groupe</Label>
                <Input 
                  type="number" 
                  className="h-7 text-[10px]" 
                  value={phase.participantsPerGroup || 4}
                  onChange={(e) => onUpdate({ participantsPerGroup: parseInt(e.target.value) || 4 })}
                />
                <p className="text-[8px] text-muted-foreground italic">Mettre le total pour une Ligue unique</p>
              </div>
              <div className="flex items-center gap-2 pt-4">
                <Checkbox
                  id={`home-away-${phase.id}`}
                  checked={phase.isHomeAway}
                  onCheckedChange={(v) => onUpdate({ isHomeAway: !!v })}
                />
                <Label htmlFor={`home-away-${phase.id}`} className="text-[10px] font-bold cursor-pointer">Aller-Retour</Label>
              </div>
            </>
          )}
          
          {phase.phaseType === "SWISS" && (
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">Nombre de Rounds</Label>
              <Input 
                type="number" 
                className="h-7 text-[10px]" 
                value={phase.roundsCount || 5}
                onChange={(e) => onUpdate({ roundsCount: parseInt(e.target.value) || 5 })}
              />
            </div>
          )}

          {(phase.phaseType === "ELIMINATION" || phase.phaseType === "KNOCKOUT") && (
            <div className="space-y-1.5 col-span-2">
              <p className="text-[10px] text-muted-foreground italic">Structure d'arbre automatique basée sur le nombre de qualifiés.</p>
            </div>
          )}
        </div>
      </div>

      {phase.participantSource !== "EDITION" && !isFirst && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-[10px] font-bold uppercase text-muted-foreground">
              Phase source
            </Label>
            <Select
              value={phase.sourcePhaseId || ""}
              onValueChange={(value) => onUpdate({ sourcePhaseId: value })}
            >
              <SelectTrigger className="h-8 text-xs mt-1">
                <SelectValue placeholder="Sélectionner..." />
              </SelectTrigger>
              <SelectContent>
                {availablePhases.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {phase.participantSource === "PHASE_QUALIFIED" && (
            <div>
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">
                Nb qualifiés
              </Label>
              <Input
                type="number"
                min={1}
                max={32}
                className="mt-1 h-8 text-xs"
                value={phase.qualifiedCount || 2}
                onChange={(e) =>
                  onUpdate({ qualifiedCount: parseInt(e.target.value) || 2 })
                }
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ParticipantStrategySection({
  participantStrategy,
  setParticipantStrategy,
  selectedRegIds,
  setSelectedRegIds,
  currentParticipantsCount,
  isPending,
  editionRegistrations,
  getName,
}: any) {
  return (
    <div className="pt-4 border-t border-primary/10 space-y-4">
      <div className="flex items-center justify-between">
        <Label className="font-bold text-xs uppercase tracking-wider text-primary flex items-center gap-2">
          <Users className="h-3 w-3" />
          Participants initiaux
        </Label>
        <Badge variant="secondary" className="text-[10px]">
          {currentParticipantsCount} sélectionnés
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          variant={participantStrategy === "ALL" ? "default" : "outline"}
          size="sm"
          className="justify-start gap-2 h-10"
          onClick={() => {
            setParticipantStrategy("ALL");
            setSelectedRegIds(editionRegistrations.map((r: any) => r.id));
          }}
        >
          <Users className="h-4 w-4" /> Tous les inscrits
        </Button>
        <Button
          variant={participantStrategy === "SELECTED" ? "default" : "outline"}
          size="sm"
          className="justify-start gap-2 h-10"
          onClick={() => setParticipantStrategy("SELECTED")}
        >
          <CheckCircle2 className="h-4 w-4" /> Sélection manuelle
        </Button>
      </div>
    </div>
  );
}

function AutoInitSection({
  autoInit,
  setAutoInit,
  randomize,
  setRandomize,
}: any) {
  return (
    <div className="bg-primary/5 rounded-lg p-4 border border-primary/10 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Checkbox
            id="autoInit"
            checked={autoInit}
            onCheckedChange={(v) => setAutoInit(!!v)}
          />
          <Label htmlFor="autoInit" className="text-xs font-bold cursor-pointer">
            Initialiser automatiquement la Phase 1
          </Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3 w-3 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-[10px] max-w-[200px]">
                  Crée automatiquement les groupes/nœuds et assigne les participants sélectionnés.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <div className="flex items-center gap-2 pl-6 border-l-2 border-primary/20">
        <Checkbox
          id="randomize"
          checked={randomize}
          onCheckedChange={(v) => setRandomize(!!v)}
          disabled={!autoInit}
        />
        <Label htmlFor="randomize" className={cn("text-xs font-medium cursor-pointer", !autoInit && "opacity-50")}>
          Mélanger aléatoirement les participants
        </Label>
      </div>
    </div>
  );
}

function SubmitButton({
  isPending,
  isOverLimit,
  currentParticipantsCount,
  maxParticipants,
  mode,
  draftPhasesLength,
  onSave,
}: any) {
  return (
    <Button
      className={cn(
        "w-full h-14 text-lg font-bold shadow-lg gap-3",
        isOverLimit ? "bg-destructive hover:bg-destructive" : "shadow-primary/20"
      )}
      disabled={
        isPending ||
        (mode === "MANUAL" && draftPhasesLength === 0) ||
        isOverLimit
      }
      onClick={onSave}
    >
      {isPending ? (
        <RefreshCw className="w-6 h-6 animate-spin" />
      ) : isOverLimit ? (
        <AlertCircle className="w-6 h-6" />
      ) : (
        <Play className="w-6 h-6" />
      )}
      {isPending
        ? "Déploiement..."
        : isOverLimit
          ? `Limite dépassée (${currentParticipantsCount}/${maxParticipants})`
          : "Déployer la structure"}
    </Button>
  );
}

function ParticipantSelectionCard({
  editionRegistrations,
  participantStrategy,
  selectedRegIds,
  setSelectedRegIds,
  isPending,
  getName,
}: any) {
  return (
    <Card className="border-none shadow-xl bg-muted/30">
      <CardHeader className="pb-4">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Filter className="w-4 h-4 text-primary" /> 2. Participants ({editionRegistrations.length})
        </CardTitle>
        <CardDescription className="text-xs">
          {participantStrategy === "ALL"
            ? "Tous les inscrits seront inclus dans la première phase."
            : "Cochez les participants à inclure dans la structure."}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0 border-t">
        <div className="max-h-[550px] overflow-y-auto">
          {editionRegistrations.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground italic text-sm">
              Aucun participant inscrit.
            </div>
          ) : (
            <table className="w-full text-sm">
              <tbody className="divide-y divide-border/50">
                {editionRegistrations.map((reg: any) => (
                  <tr key={reg.id} className="hover:bg-primary/5 transition-colors group">
                    <td className="p-4 w-12">
                      <Checkbox
                        checked={selectedRegIds.includes(reg.id)}
                        disabled={participantStrategy === "ALL" || isPending}
                        onCheckedChange={(v: boolean) => {
                          if (v) setSelectedRegIds([...selectedRegIds, reg.id]);
                          else setSelectedRegIds(selectedRegIds.filter((id: string) => id !== reg.id));
                        }}
                        className="h-5 w-5"
                      />
                    </td>
                    <td className="p-4">
                      <div
                        className={cn(
                          "font-bold text-sm",
                          !selectedRegIds.includes(reg.id) && "text-muted-foreground/50"
                        )}
                      >
                        {getName(reg)}
                      </div>
                      <div className="text-[10px] text-muted-foreground flex items-center gap-2 mt-0.5">
                        <span className="bg-muted px-1.5 py-0.5 rounded uppercase font-mono">
                          ID: {reg.id.slice(0, 8)}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      {selectedRegIds.includes(reg.id) ? (
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-none text-[10px]">
                          INCLUS
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground text-[10px] opacity-40">
                          EXCLU
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function InfoBanner() {
  return (
    <div className="flex items-center gap-4 bg-primary/5 border border-primary/20 p-4 rounded-xl text-primary text-sm shadow-sm">
      <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
        <MoveRight className="w-5 h-5" />
      </div>
      <div className="space-y-0.5">
        <p className="font-bold">Validation de la hiérarchie</p>
        <p className="text-xs opacity-80">
          Les participants sélectionnés seront propagés à la Phase 1. Les
          phases suivantes dépendront des résultats (qualifiés/éliminés) des
          phases précédentes.
        </p>
      </div>
    </div>
  );
}