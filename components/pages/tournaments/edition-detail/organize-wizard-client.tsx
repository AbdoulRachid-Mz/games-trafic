// @/components/pages/tournaments/edition-detail/organize-wizard-client.tsx
"use client";

import {
  useState,
  useTransition,
  useCallback,
  useMemo,
  useEffect,
} from "react";
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
  Eye,
  X,
  Calendar,
  Trophy,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  FolderTree,
  ListTree,
  GraduationCap,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";

// ============================================================================
// TYPES
// ============================================================================

type PhaseType =
  | "ROUND_ROBIN"
  | "GROUP_STAGE"
  | "ELIMINATION"
  | "SWISS"
  | "KNOCKOUT";

type DraftPhase = {
  id: string;
  name: string;
  phaseType: PhaseType;
  order: number;
  participantSource: "EDITION" | "PHASE_QUALIFIED" | "PHASE_ELIMINATED" | "ALL";
  sourcePhaseId?: string;
  qualifiedCount?: number;

  // Structure generation
  generateGroups: boolean;
  generateNodes: boolean;
  generateMatches: boolean;

  // Phase-specific config
  config: {
    // For ROUND_ROBIN / GROUP_STAGE
    participantsPerGroup?: number;
    groupsCount?: number;
    isHomeAway?: boolean;
    pointsPerWin?: number;
    pointsPerDraw?: number;
    pointsPerLoss?: number;
    advanceCount?: number;
    nodePrefix?: string; // "Journée", "Round", "Match"

    // For SWISS
    roundsCount?: number;

    // For ELIMINATION / KNOCKOUT
    bracketFormat?: "SINGLE" | "DOUBLE";
    matchFormat?: "BEST_OF_1" | "BEST_OF_3" | "BEST_OF_5";

    // For all
    seedingMethod?: "RANDOM" | "SEQUENTIAL" | "SNAKE" | "MANUAL";
  };
};

type StructurePreview = {
  phases: {
    id: string;
    name: string;
    type: PhaseType;
    groups: {
      name: string;
      participantCount: number;
      nodes: {
        name: string;
        matchesCount: number;
      }[];
    }[];
  }[];
  totalMatches: number;
  totalParticipants: number;
};

const generateTempId = () =>
  `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calcule le nombre de participants qualifiés pour la phase suivante
 */
function calculateQualifiedCount(
  participantsCount: number,
  phaseType: PhaseType,
  config: DraftPhase["config"],
): number {
  if (phaseType === "ROUND_ROBIN") {
    return (
      config.advanceCount || Math.min(4, Math.floor(participantsCount / 2))
    );
  }
  if (phaseType === "GROUP_STAGE") {
    const groupsCount = config.groupsCount || 1;
    const perGroup = config.advanceCount || 2;
    return groupsCount * perGroup;
  }
  if (phaseType === "ELIMINATION" || phaseType === "KNOCKOUT") {
    const nextPower = Math.pow(2, Math.ceil(Math.log2(participantsCount)));
    return Math.min(nextPower, participantsCount);
  }
  return participantsCount;
}

/**
 * Calcule la structure d'un bracket ROUND_ROBIN (journées)
 */
function calculateRoundRobinStructure(
  participantCount: number,
  isHomeAway: boolean,
): {
  rounds: number;
  matchesPerRound: number;
  totalMatches: number;
} {
  const matchesPerRound = Math.floor(participantCount / 2);
  const rounds = participantCount - 1;
  const totalMatches = (participantCount * (participantCount - 1)) / 2;

  return {
    rounds,
    matchesPerRound,
    totalMatches: isHomeAway ? totalMatches * 2 : totalMatches,
  };
}

/**
 * Calcule la structure d'un bracket ELIMINATION
 */
function calculateEliminationStructure(participantCount: number): {
  rounds: number;
  totalMatches: number;
  firstRoundMatches: number;
} {
  const totalRounds = Math.ceil(Math.log2(participantCount));
  const totalMatches = participantCount - 1;
  const firstRoundMatches = Math.pow(2, totalRounds - 1);

  return {
    rounds: totalRounds,
    totalMatches,
    firstRoundMatches,
  };
}

/**
 * Génère les phases pour l'API
 */
function buildPhasesForApi(
  phases: DraftPhase[],
  existingPhasesCount: number,
  hasExistingPhases: boolean,
): any[] {
  return phases.map((p, idx) => {
    // Calculer le nombre de groupes et participants par groupe
    let groupsCount = p.config.groupsCount || 1;
    let participantsPerGroup = p.config.participantsPerGroup || 0;

    // Pour ROUND_ROBIN, on force groupsCount = 1
    if (p.phaseType === "ROUND_ROBIN") {
      groupsCount = 1;
    }

    // Trouver l'index de la phase source
    let sourcePhaseIndex: number | undefined;
    if (p.sourcePhaseId) {
      const sourceIndex = phases.findIndex(
        (phase) => phase.id === p.sourcePhaseId,
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
        // Source des participants
        participantSource: p.participantSource,
        sourcePhaseIndex,
        qualifiedCount: p.qualifiedCount || 2,

        // Structure des groupes
        groupsCount,
        groupsSize: participantsPerGroup > 0 ? participantsPerGroup : undefined,

        // Configuration ROUND_ROBIN
        isHomeAway: p.config.isHomeAway || false,
        pointsPerWin: p.config.pointsPerWin || 3,
        pointsPerDraw: p.config.pointsPerDraw || 1,
        pointsPerLoss: p.config.pointsPerLoss || 0,
        advanceCount: p.config.advanceCount || 2,

        // Configuration des nœuds (journées)
        nodePrefix:
          p.config.nodePrefix ||
          (p.phaseType === "ROUND_ROBIN" ? "Journée" : "Round"),

        // Pour SWISS
        roundsCount: p.config.roundsCount,

        // Pour élimination
        bracketFormat: p.config.bracketFormat,
        matchFormat: p.config.matchFormat,

        // Génération
        seedingMethod: p.config.seedingMethod || "RANDOM",
        generateGroups: p.generateGroups,
        generateNodes: p.generateNodes,
        generateMatches: p.generateMatches,
      },
    };
  });
}

/**
 * Génère le preview de la structure
 */
function generateStructurePreview(
  phases: DraftPhase[],
  totalParticipants: number,
  existingPhasesCount: number = 0,
): StructurePreview {
  let remainingParticipants = totalParticipants;
  const preview: StructurePreview = {
    phases: [],
    totalMatches: 0,
    totalParticipants: totalParticipants,
  };

  for (let i = 0; i < phases.length; i++) {
    const phase = phases[i];
    const phasePreview: StructurePreview["phases"][0] = {
      id: phase.id,
      name: phase.name,
      type: phase.phaseType,
      groups: [],
    };

    const participantsForPhase =
      i === 0
        ? totalParticipants
        : calculateQualifiedCount(
            remainingParticipants,
            phase.phaseType,
            phase.config,
          );

    if (phase.phaseType === "ROUND_ROBIN") {
      const structure = calculateRoundRobinStructure(
        participantsForPhase,
        phase.config.isHomeAway || false,
      );

      const nodePrefix = phase.config.nodePrefix || "Journée";

      // Un seul groupe pour le championnat
      const nodes: { name: string; matchesCount: number }[] = [];
      for (let r = 1; r <= structure.rounds; r++) {
        nodes.push({
          name: `${nodePrefix} ${r}`,
          matchesCount: structure.matchesPerRound,
        });
      }

      phasePreview.groups.push({
        name: "Classement",
        participantCount: participantsForPhase,
        nodes,
      });
      preview.totalMatches += structure.totalMatches;

      remainingParticipants = phase.config.advanceCount
        ? phase.config.advanceCount
        : Math.min(8, participantsForPhase);
    } else if (phase.phaseType === "GROUP_STAGE") {
      const groupCount =
        phase.config.groupsCount || Math.ceil(participantsForPhase / 4);
      const participantsPerGroup = Math.ceil(participantsForPhase / groupCount);
      const structure = calculateRoundRobinStructure(
        participantsPerGroup,
        false,
      );

      for (let g = 0; g < groupCount; g++) {
        phasePreview.groups.push({
          name: `Groupe ${String.fromCharCode(65 + g)}`,
          participantCount: participantsPerGroup,
          nodes: [
            {
              name: "Poule unique",
              matchesCount: structure.totalMatches,
            },
          ],
        });
        preview.totalMatches += structure.totalMatches;
      }
      remainingParticipants = (phase.config.advanceCount || 2) * groupCount;
    } else if (
      phase.phaseType === "ELIMINATION" ||
      phase.phaseType === "KNOCKOUT"
    ) {
      const structure = calculateEliminationStructure(participantsForPhase);
      const nodes: { name: string; matchesCount: number }[] = [];
      let matchesThisRound = structure.firstRoundMatches;

      for (let r = 1; r <= structure.rounds; r++) {
        let roundName = "";
        if (r === structure.rounds) roundName = "Finale";
        else if (r === structure.rounds - 1) roundName = "Demi-finale";
        else if (r === structure.rounds - 2) roundName = "Quart de finale";
        else if (r === structure.rounds - 3) roundName = "Huitième de finale";
        else roundName = `${Math.pow(2, structure.rounds - r)}ème de finale`;

        nodes.push({
          name: roundName,
          matchesCount: matchesThisRound,
        });
        matchesThisRound = Math.ceil(matchesThisRound / 2);
      }

      phasePreview.groups.push({
        name: "Tableau principal",
        participantCount: participantsForPhase,
        nodes,
      });
      preview.totalMatches += structure.totalMatches;
      remainingParticipants = 1;
    } else if (phase.phaseType === "SWISS") {
      const roundsCount = phase.config.roundsCount || 5;
      phasePreview.groups.push({
        name: "Système Suisse",
        participantCount: participantsForPhase,
        nodes: Array.from({ length: roundsCount }, (_, i) => ({
          name: `Round ${i + 1}`,
          matchesCount: Math.floor(participantsForPhase / 2),
        })),
      });
      preview.totalMatches +=
        roundsCount * Math.floor(participantsForPhase / 2);
      remainingParticipants =
        phase.config.advanceCount || Math.min(8, participantsForPhase);
    }

    preview.phases.push(phasePreview);
  }

  return preview;
}

// ============================================================================
// DEFAULT CONFIGURATIONS
// ============================================================================

const DEFAULT_PHASE_CONFIGS: Record<
  PhaseType,
  Partial<DraftPhase["config"]>
> = {
  ROUND_ROBIN: {
    groupsCount: 1,
    isHomeAway: false,
    pointsPerWin: 3,
    pointsPerDraw: 1,
    pointsPerLoss: 0,
    advanceCount: 4,
    seedingMethod: "RANDOM",
    nodePrefix: "Journée",
  },
  GROUP_STAGE: {
    participantsPerGroup: 4,
    groupsCount: 0,
    isHomeAway: false,
    pointsPerWin: 3,
    pointsPerDraw: 1,
    pointsPerLoss: 0,
    advanceCount: 2,
    seedingMethod: "RANDOM",
    nodePrefix: "Round",
  },
  ELIMINATION: {
    bracketFormat: "SINGLE",
    matchFormat: "BEST_OF_1",
    seedingMethod: "RANDOM",
    nodePrefix: "Round",
  },
  SWISS: {
    roundsCount: 5,
    advanceCount: 8,
    seedingMethod: "RANDOM",
    nodePrefix: "Round",
  },
  KNOCKOUT: {
    bracketFormat: "SINGLE",
    matchFormat: "BEST_OF_3",
    seedingMethod: "RANDOM",
    nodePrefix: "Round",
  },
};

const PHASE_TYPE_LABELS: Record<
  PhaseType,
  { label: string; description: string; icon: typeof Zap }
> = {
  ROUND_ROBIN: {
    label: "Championnat (Ligue)",
    description:
      "Tous les participants s'affrontent en aller simple ou aller-retour",
    icon: GraduationCap,
  },
  GROUP_STAGE: {
    label: "Phase de groupes",
    description: "Répartition en groupes, puis qualification",
    icon: Users,
  },
  ELIMINATION: {
    label: "Élimination directe",
    description: "Tableau à élimination directe",
    icon: Zap,
  },
  SWISS: {
    label: "Système Suisse",
    description: "Participants affrontés selon leur classement",
    icon: Layers,
  },
  KNOCKOUT: {
    label: "Matchs à élimination",
    description: "Séries de matchs (BO3/BO5)",
    icon: ShieldCheck,
  },
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

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
  const [showPreview, setShowPreview] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const [draftPhases, setDraftPhases] = useState<DraftPhase[]>([
    {
      id: generateTempId(),
      name: "Championnat",
      phaseType: "ROUND_ROBIN",
      order: 0,
      participantSource: "EDITION",
      qualifiedCount: 4,
      generateGroups: true,
      generateNodes: true,
      generateMatches: true,
      config: { ...DEFAULT_PHASE_CONFIGS.ROUND_ROBIN },
    },
  ]);

  const [autoConfig, setAutoConfig] = useState({
    preset: "LEAGUE" as "LEAGUE" | "CHAMPIONS" | "SWISS" | "CUSTOM",
    isHomeAway: false,
    groupsQualifiedCount: 2,
    nodePrefix: "Journée",
  });

  const [participantStrategy, setParticipantStrategy] = useState<
    "ALL" | "SELECTED"
  >("ALL");
  const [selectedRegIds, setSelectedRegIds] = useState<string[]>(
    edition?.registrations?.map((r: any) => r.id) || [],
  );

  const [autoInit, setAutoInit] = useState(true);
  const [randomize, setRandomize] = useState(true);

  const maxParticipants = edition?.maxParticipants || 0;
  const currentParticipantsCount = selectedRegIds.length;
  const isOverLimit =
    maxParticipants > 0 && currentParticipantsCount > maxParticipants;
  const existingPhasesCount = edition?.phases?.length || 0;
  const hasExistingPhases = existingPhasesCount > 0;

  // Auto-build phases selon le preset
  const buildAutoPhases = useCallback((): DraftPhase[] => {
    const phases: DraftPhase[] = [];
    const { preset, isHomeAway, groupsQualifiedCount, nodePrefix } = autoConfig;

    if (preset === "LEAGUE") {
      phases.push({
        id: generateTempId(),
        name: isHomeAway ? "Championnat (Aller-Retour)" : "Championnat",
        phaseType: "ROUND_ROBIN",
        order: 0,
        participantSource: "EDITION",
        qualifiedCount: groupsQualifiedCount,
        generateGroups: true,
        generateNodes: true,
        generateMatches: true,
        config: {
          ...DEFAULT_PHASE_CONFIGS.ROUND_ROBIN,
          groupsCount: 1,
          isHomeAway,
          advanceCount: groupsQualifiedCount,
          nodePrefix,
        },
      });
    } else if (preset === "CHAMPIONS") {
      // Phase de groupes
      phases.push({
        id: generateTempId(),
        name: "Phase de groupes",
        phaseType: "GROUP_STAGE",
        order: 0,
        participantSource: "EDITION",
        qualifiedCount: groupsQualifiedCount * 4,
        generateGroups: true,
        generateNodes: true,
        generateMatches: true,
        config: {
          ...DEFAULT_PHASE_CONFIGS.GROUP_STAGE,
          groupsCount: 4,
          advanceCount: groupsQualifiedCount,
          nodePrefix: "Groupe",
        },
      });
      // Phase d'élimination
      phases.push({
        id: generateTempId(),
        name: "Phases finales",
        phaseType: "ELIMINATION",
        order: 1,
        participantSource: "PHASE_QUALIFIED",
        sourcePhaseId: phases[0].id,
        qualifiedCount: 2,
        generateGroups: false,
        generateNodes: true,
        generateMatches: true,
        config: {
          ...DEFAULT_PHASE_CONFIGS.ELIMINATION,
          nodePrefix: "Round",
        },
      });
    } else if (preset === "SWISS") {
      phases.push({
        id: generateTempId(),
        name: "Système Suisse",
        phaseType: "SWISS",
        order: 0,
        participantSource: "EDITION",
        qualifiedCount: groupsQualifiedCount,
        generateGroups: true,
        generateNodes: true,
        generateMatches: true,
        config: {
          ...DEFAULT_PHASE_CONFIGS.SWISS,
          advanceCount: groupsQualifiedCount,
          nodePrefix: "Round",
        },
      });
    }

    return phases;
  }, [autoConfig]);

  // Calculer le preview
  const structurePreview = useMemo(() => {
    const phasesToPreview = mode === "AUTO" ? buildAutoPhases() : draftPhases;
    return generateStructurePreview(
      phasesToPreview,
      currentParticipantsCount,
      existingPhasesCount,
    );
  }, [
    mode,
    draftPhases,
    autoConfig,
    currentParticipantsCount,
    existingPhasesCount,
  ]);

  // Validation de la configuration
  const validateConfig = useCallback((): {
    isValid: boolean;
    errors: string[];
  } => {
    const errors: string[] = [];
    const phasesToValidate = mode === "AUTO" ? buildAutoPhases() : draftPhases;

    if (phasesToValidate.length === 0) {
      errors.push("Au moins une phase est requise");
    }

    for (let i = 0; i < phasesToValidate.length; i++) {
      const phase = phasesToValidate[i];

      if (i === 0 && currentParticipantsCount < 2) {
        errors.push(
          `Phase "${phase.name}": minimum 2 participants requis (${currentParticipantsCount} actuellement)`,
        );
      }

      if (phase.phaseType === "ELIMINATION" || phase.phaseType === "KNOCKOUT") {
        const participantsForPhase =
          i === 0
            ? currentParticipantsCount
            : (phase.config.advanceCount || 2) *
              (phasesToValidate[i - 1]?.config.groupsCount || 1);

        const isPowerOfTwo = (n: number) => (n & (n - 1)) === 0 && n !== 0;
        if (!isPowerOfTwo(participantsForPhase) && participantsForPhase > 0) {
          errors.push(
            `Phase "${phase.name}": élimination directe nécessite un nombre de participants puissance de 2 (${participantsForPhase} actuellement).`,
          );
        }
      }

      if (
        i > 0 &&
        phase.participantSource !== "EDITION" &&
        !phase.sourcePhaseId
      ) {
        errors.push(
          `Phase "${phase.name}": source des participants non définie`,
        );
      }
    }

    return { isValid: errors.length === 0, errors };
  }, [
    mode,
    draftPhases,
    autoConfig,
    buildAutoPhases,
    currentParticipantsCount,
  ]);

  const handleUpdateDraftPhase = useCallback(
    (index: number, updates: Partial<DraftPhase>) => {
      setDraftPhases((prev) => {
        const updated = [...prev];
        const current = updated[index];

        updated[index] = {
          ...current,
          ...updates,
          config: { ...current.config, ...(updates.config || {}) },
        };

        if (updates.id || updates.name) {
          for (let i = index + 1; i < updated.length; i++) {
            if (updated[i].sourcePhaseId === current.id) {
              updated[i] = { ...updated[i], sourcePhaseId: updated[index].id };
            }
          }
        }

        return updated;
      });
    },
    [],
  );

  const handleAddDraftPhase = useCallback(() => {
    const previousPhase = draftPhases[draftPhases.length - 1];
    const newOrder = draftPhases.length;

    const newPhase: DraftPhase = {
      id: generateTempId(),
      name: `Phase ${newOrder + 1}`,
      phaseType: "ELIMINATION",
      order: newOrder,
      participantSource: previousPhase ? "PHASE_QUALIFIED" : "EDITION",
      sourcePhaseId: previousPhase?.id,
      qualifiedCount: 2,
      generateGroups: false,
      generateNodes: true,
      generateMatches: true,
      config: { ...DEFAULT_PHASE_CONFIGS.ELIMINATION },
    };

    setDraftPhases([...draftPhases, newPhase]);
  }, [draftPhases]);

  const handleRemoveDraftPhase = useCallback(
    (index: number) => {
      const updated = draftPhases
        .filter((_, i) => i !== index)
        .map((p, i) => ({ ...p, order: i }));
      setDraftPhases(updated);
    },
    [draftPhases],
  );

  const handleDeploy = useCallback(() => {
    const validation = validateConfig();
    if (!validation.isValid) {
      validation.errors.forEach((err) => toast.error(err));
      return;
    }
    setShowConfirmDialog(true);
  }, [validateConfig]);

  const confirmDeploy = useCallback(() => {
    setShowConfirmDialog(false);
    setShowPreview(false);

    const phasesToCreate = mode === "AUTO" ? buildAutoPhases() : draftPhases;

    // Construire les phases pour l'API
    const phasesForApi = buildPhasesForApi(
      phasesToCreate,
      existingPhasesCount,
      hasExistingPhases,
    );

    startTransition(async () => {
      try {
        const result = await organizeEditionStructure(
          editionId,
          phasesForApi,
          selectedRegIds,
          {
            autoInitializeFirstPhase: autoInit,
            groupsSize: phasesToCreate[0]?.config.participantsPerGroup || 4,
            randomizeDistribution: randomize,
            generateGroups: phasesToCreate[0]?.generateGroups ?? true,
            generateNodes: phasesToCreate[0]?.generateNodes ?? true,
            generateMatches: phasesToCreate[0]?.generateMatches ?? true,
            isHomeAway: phasesToCreate[0]?.config.isHomeAway ?? false,
          },
        );

        if (result.success) {
          toast.success("Structure déployée avec succès !", {
            description: `${phasesToCreate.length} phase(s) créée(s), ${structurePreview.totalMatches} match(s) généré(s)`,
            duration: 5000,
          });

          setTimeout(() => {
            router.push(
              `/tournaments/${tournamentId}/editions/${editionId}/dashboard/phases`,
            );
            router.refresh();
          }, 1500);
        } else {
          toast.error("Erreur lors du déploiement");
        }
      } catch (error: any) {
        console.error("Deploy error:", error);
        toast.error(error.message || "Erreur lors du déploiement");
      }
    });
  }, [
    mode,
    draftPhases,
    autoConfig,
    buildAutoPhases,
    selectedRegIds,
    autoInit,
    randomize,
    editionId,
    tournamentId,
    existingPhasesCount,
    hasExistingPhases,
    structurePreview.totalMatches,
    router,
  ]);

  const getName = (reg: any) =>
    reg.member?.displayName || reg.member?.user?.username || "Joueur";

  return (
    <div className="flex flex-col gap-8 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 bg-background/95 backdrop-blur-sm z-10 py-4 border-b">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FolderTree className="h-6 w-6 text-primary" />
            Organisation de l'Édition
          </h2>
          <p className="text-muted-foreground text-sm">
            Configurez la hiérarchie des phases, groupes et brackets
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-muted p-1 rounded-lg">
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(true)}
            className="gap-2"
          >
            <Eye className="h-4 w-4" /> Preview
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Configuration column */}
        <Card className="relative overflow-hidden border-primary/20 shadow-xl">
          {hasExistingPhases && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-6 text-center">
              <ShieldCheck className="w-16 h-16 text-emerald-500 mb-4" />
              <h3 className="text-xl font-bold mb-2">Structure Existante</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Cette édition contient déjà {existingPhasesCount} phase(s).
              </p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowPreview(true)}>
                  <Eye className="h-4 w-4 mr-2" /> Voir la structure
                </Button>
                <Button variant="default" onClick={() => setMode("MANUAL")}>
                  <Settings2 className="h-4 w-4 mr-2" /> Mode Expert
                </Button>
              </div>
            </div>
          )}

          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <ListTree className="w-6 h-6 text-primary" /> 1. Configuration des
              Phases
            </CardTitle>
            <CardDescription>
              {mode === "AUTO"
                ? "Assistant rapide pour les structures classiques."
                : "Contrôle total sur la séquence et la configuration."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {mode === "AUTO" ? (
              <AutoModeConfig
                autoConfig={autoConfig}
                setAutoConfig={setAutoConfig}
                currentParticipantsCount={currentParticipantsCount}
              />
            ) : (
              <ManualModeConfig
                draftPhases={draftPhases}
                onUpdatePhase={handleUpdateDraftPhase}
                onAddPhase={handleAddDraftPhase}
                onRemovePhase={handleRemoveDraftPhase}
                currentParticipantsCount={currentParticipantsCount}
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
          </CardContent>
        </Card>

        {/* Participants selection column */}
        <ParticipantSelectionCard
          editionRegistrations={edition?.registrations || []}
          participantStrategy={participantStrategy}
          selectedRegIds={selectedRegIds}
          setSelectedRegIds={setSelectedRegIds}
          isPending={isPending}
          getName={getName}
        />
      </div>

      {/* Info banner */}
      <InfoBanner />

      {/* Floating deploy button */}
      {!hasExistingPhases && currentParticipantsCount >= 2 && (
        <FloatingDeployButton
          isPending={isPending}
          isOverLimit={isOverLimit}
          currentParticipantsCount={currentParticipantsCount}
          maxParticipants={maxParticipants}
          phasesCount={
            mode === "AUTO" ? buildAutoPhases().length : draftPhases.length
          }
          totalMatches={structurePreview.totalMatches}
          onClick={handleDeploy}
        />
      )}

      {/* Preview dialog */}
      <PreviewDialog
        open={showPreview}
        onOpenChange={setShowPreview}
        preview={structurePreview}
        phases={mode === "AUTO" ? buildAutoPhases() : draftPhases}
        onConfirm={handleDeploy}
        isPending={isPending}
      />

      {/* Confirm dialog */}
      <ConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        preview={structurePreview}
        phases={mode === "AUTO" ? buildAutoPhases() : draftPhases}
        onConfirm={confirmDeploy}
        isPending={isPending}
      />
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function AutoModeConfig({
  autoConfig,
  setAutoConfig,
  currentParticipantsCount,
}: {
  autoConfig: any;
  setAutoConfig: any;
  currentParticipantsCount: number;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Label className="font-bold text-xs uppercase tracking-wider text-primary">
          Format du tournoi
        </Label>
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              id: "LEAGUE",
              label: "Championnat",
              icon: GraduationCap,
              description: "Tous contre tous",
            },
            {
              id: "CHAMPIONS",
              label: "LDC Style",
              icon: Layers,
              description: "Groupes + Élimination",
            },
            {
              id: "SWISS",
              label: "Système Suisse",
              icon: ShieldCheck,
              description: "Rounds par classement",
            },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => setAutoConfig({ ...autoConfig, preset: p.id })}
              className={cn(
                "p-4 rounded-xl border-2 text-left transition-all",
                autoConfig.preset === p.id
                  ? "border-primary bg-primary/5 shadow-md"
                  : "border-border hover:border-primary/50",
              )}
            >
              <p.icon
                className={cn(
                  "h-6 w-6 mb-2",
                  autoConfig.preset === p.id
                    ? "text-primary"
                    : "text-muted-foreground",
                )}
              />
              <div className="font-bold text-sm">{p.label}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                {p.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {autoConfig.preset === "LEAGUE" && (
        <div className="space-y-4 p-4 rounded-xl bg-muted/30">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-bold">Aller-Retour</Label>
            <Checkbox
              checked={autoConfig.isHomeAway}
              onCheckedChange={(v) =>
                setAutoConfig({ ...autoConfig, isHomeAway: !!v })
              }
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium">Préfixe des journées</Label>
            <Input
              className="h-8 text-sm"
              value={autoConfig.nodePrefix}
              onChange={(e) =>
                setAutoConfig({ ...autoConfig, nodePrefix: e.target.value })
              }
              placeholder="Journée, Round, Match..."
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium">
              Qualifiés pour la phase suivante
            </Label>
            <div className="flex items-center gap-3">
              <Slider
                value={[autoConfig.groupsQualifiedCount]}
                onValueChange={(v) =>
                  setAutoConfig({ ...autoConfig, groupsQualifiedCount: v[0] })
                }
                min={1}
                max={Math.min(
                  16,
                  Math.floor(currentParticipantsCount / 2) || 8,
                )}
                step={1}
                className="flex-1"
              />
              <span className="w-8 text-center font-bold text-sm">
                {autoConfig.groupsQualifiedCount}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Nombre de meilleurs classés qualifiés (0 = pas de phase suivante)
            </p>
          </div>
        </div>
      )}

      {autoConfig.preset === "CHAMPIONS" && (
        <div className="space-y-4 p-4 rounded-xl bg-muted/30">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-bold">Aller-Retour en groupes</Label>
            <Checkbox
              checked={autoConfig.isHomeAway}
              onCheckedChange={(v) =>
                setAutoConfig({ ...autoConfig, isHomeAway: !!v })
              }
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium">Qualifiés par groupe</Label>
            <div className="flex items-center gap-3">
              <Slider
                value={[autoConfig.groupsQualifiedCount]}
                onValueChange={(v) =>
                  setAutoConfig({ ...autoConfig, groupsQualifiedCount: v[0] })
                }
                min={1}
                max={4}
                step={1}
                className="flex-1"
              />
              <span className="w-8 text-center font-bold text-sm">
                {autoConfig.groupsQualifiedCount}
              </span>
            </div>
          </div>
        </div>
      )}

      {autoConfig.preset === "SWISS" && (
        <div className="space-y-2 p-4 rounded-xl bg-muted/30">
          <Label className="text-sm font-bold">Nombre de rounds</Label>
          <div className="flex items-center gap-3">
            <Slider
              value={[5]}
              onValueChange={(v) =>
                setAutoConfig({ ...autoConfig, roundsCount: v[0] })
              }
              min={3}
              max={11}
              step={2}
              className="flex-1"
            />
            <span className="w-8 text-center font-bold text-sm">5</span>
          </div>
        </div>
      )}

      <div className="text-xs text-muted-foreground bg-primary/5 p-3 rounded-lg">
        <Info className="h-3 w-3 inline mr-1" />
        Basé sur {currentParticipantsCount} participant(s) inscrit(s)
      </div>
    </div>
  );
}

function ManualModeConfig({
  draftPhases,
  onUpdatePhase,
  onAddPhase,
  onRemovePhase,
  currentParticipantsCount,
}: any) {
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="font-bold text-xs uppercase tracking-wider text-primary">
          Séquence des phases
        </Label>
        <Button
          size="sm"
          variant="outline"
          onClick={onAddPhase}
          className="h-7 gap-1"
        >
          <Plus className="h-3 w-3" /> Ajouter
        </Button>
      </div>

      <div className="space-y-3">
        {draftPhases.map((phase: DraftPhase, idx: number) => (
          <PhaseConfigCard
            key={phase.id}
            phase={phase}
            index={idx}
            isFirst={idx === 0}
            isExpanded={expandedPhase === phase.id}
            onToggleExpand={() =>
              setExpandedPhase(expandedPhase === phase.id ? null : phase.id)
            }
            onUpdate={(updates: Partial<DraftPhase>) =>
              onUpdatePhase(idx, updates)
            }
            onRemove={() => onRemovePhase(idx)}
            availablePhases={draftPhases
              .slice(0, idx)
              .map((p: DraftPhase) => ({ id: p.id, name: p.name }))}
            currentParticipantsCount={currentParticipantsCount}
          />
        ))}

        {draftPhases.length === 0 && (
          <div className="py-6 text-center border-dashed border-2 rounded-xl text-muted-foreground text-xs">
            Aucune phase dans la séquence. Cliquez sur "Ajouter" pour commencer.
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
  isExpanded,
  onToggleExpand,
  onUpdate,
  onRemove,
  availablePhases,
  currentParticipantsCount,
}: {
  phase: DraftPhase;
  index: number;
  isFirst: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (updates: Partial<DraftPhase>) => void;
  onRemove: () => void;
  availablePhases: Array<{ id: string; name: string }>;
  currentParticipantsCount: number;
}) {
  const phaseInfo = PHASE_TYPE_LABELS[phase.phaseType];
  const PhaseIcon = phaseInfo?.icon || Zap;

  const participantsForPhase = isFirst
    ? currentParticipantsCount
    : (phase.config.advanceCount || 2) * (phase.config.groupsCount || 1);

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggleExpand}>
      <div
        className={cn(
          "border rounded-lg transition-all",
          isExpanded
            ? "border-primary/30 bg-primary/5"
            : "border-border hover:border-primary/20",
        )}
      >
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between p-3 cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                {index + 1}
              </div>
              <PhaseIcon className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-semibold text-sm">{phase.name}</div>
                <div className="text-[10px] text-muted-foreground">
                  {phaseInfo?.label} • {participantsForPhase} participant(s)
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={phase.generateMatches ? "default" : "outline"}
                className="text-[9px]"
              >
                {phase.generateMatches ? "Matchs ✓" : "Sans matchs"}
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
          <div className="p-4 pt-0 border-t space-y-4">
            <div className="pt-3">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">
                Nom de la phase
              </Label>
              <Input
                className="h-8 text-sm mt-1"
                value={phase.name}
                onChange={(e) => onUpdate({ name: e.target.value })}
              />
            </div>

            <div>
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">
                Type de phase
              </Label>
              <Select
                value={phase.phaseType}
                onValueChange={(value) => {
                  const newType = value as PhaseType;
                  onUpdate({
                    phaseType: newType,
                    config: { ...DEFAULT_PHASE_CONFIGS[newType] },
                    generateGroups:
                      newType === "GROUP_STAGE" || newType === "ROUND_ROBIN",
                    generateNodes: true,
                    generateMatches: true,
                  });
                }}
              >
                <SelectTrigger className="h-8 text-xs mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PHASE_TYPE_LABELS).map(([type, info]) => (
                    <SelectItem key={type} value={type}>
                      <div className="flex items-center gap-2">
                        <info.icon className="h-3 w-3" />
                        <span>{info.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!isFirst && (
              <div>
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">
                  Source des participants
                </Label>
                <Select
                  value={phase.participantSource}
                  onValueChange={(value) =>
                    onUpdate({ participantSource: value as any })
                  }
                >
                  <SelectTrigger className="h-8 text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EDITION">Tous les inscrits</SelectItem>
                    <SelectItem value="PHASE_QUALIFIED">
                      Qualifiés phase précédente
                    </SelectItem>
                    <SelectItem value="PHASE_ELIMINATED">
                      Éliminés phase précédente
                    </SelectItem>
                    <SelectItem value="ALL">
                      Tous participants phase précédente
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {!isFirst && phase.participantSource !== "EDITION" && (
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
            )}

            {(phase.phaseType === "ROUND_ROBIN" ||
              phase.phaseType === "GROUP_STAGE") && (
              <RoundRobinConfig
                phase={phase}
                onUpdate={onUpdate}
                participantsForPhase={participantsForPhase}
              />
            )}

            {(phase.phaseType === "ELIMINATION" ||
              phase.phaseType === "KNOCKOUT") && (
              <EliminationConfig
                phase={phase}
                onUpdate={onUpdate}
                participantsForPhase={participantsForPhase}
              />
            )}

            {phase.phaseType === "SWISS" && (
              <SwissConfig phase={phase} onUpdate={onUpdate} />
            )}

            <div className="space-y-3 pt-2 border-t">
              <Label className="text-[10px] font-bold uppercase text-primary">
                Génération automatique
              </Label>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={phase.generateGroups}
                    onCheckedChange={(v) => onUpdate({ generateGroups: !!v })}
                    disabled={
                      phase.phaseType === "ELIMINATION" ||
                      phase.phaseType === "KNOCKOUT"
                    }
                  />
                  <span className="text-xs">Groupes / Poules</span>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={phase.generateNodes}
                    onCheckedChange={(v) => onUpdate({ generateNodes: !!v })}
                  />
                  <span className="text-xs">Nœuds / Journées</span>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={phase.generateMatches}
                    onCheckedChange={(v) => onUpdate({ generateMatches: !!v })}
                  />
                  <span className="text-xs">Matchs</span>
                </div>
              </div>
            </div>

            <div>
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">
                Méthode de seed
              </Label>
              <Select
                value={phase.config.seedingMethod || "RANDOM"}
                onValueChange={(value) =>
                  onUpdate({
                    config: { ...phase.config, seedingMethod: value as any },
                  })
                }
              >
                <SelectTrigger className="h-8 text-xs mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RANDOM">Aléatoire</SelectItem>
                  <SelectItem value="SEQUENTIAL">
                    Séquentiel (par ordre d'inscription)
                  </SelectItem>
                  <SelectItem value="SNAKE">Serpentin</SelectItem>
                  <SelectItem value="MANUAL">Manuel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function RoundRobinConfig({ phase, onUpdate, participantsForPhase }: any) {
  const maxGroups = Math.min(8, Math.floor(participantsForPhase / 2));
  const defaultGroupsCount = Math.min(4, Math.ceil(participantsForPhase / 8));
  const structure = calculateRoundRobinStructure(
    participantsForPhase,
    phase.config.isHomeAway || false,
  );

  return (
    <div className="space-y-3 p-3 rounded-lg bg-muted/20">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-[10px] font-bold uppercase text-muted-foreground">
            Groupes
          </Label>
          <Input
            type="number"
            min={1}
            max={maxGroups}
            className="h-8 text-xs"
            value={
              phase.phaseType === "ROUND_ROBIN"
                ? 1
                : phase.config.groupsCount || defaultGroupsCount
            }
            onChange={(e) =>
              onUpdate({
                config: {
                  ...phase.config,
                  groupsCount:
                    phase.phaseType === "ROUND_ROBIN"
                      ? 1
                      : parseInt(e.target.value) || 1,
                },
              })
            }
            disabled={phase.phaseType === "ROUND_ROBIN"}
          />
        </div>
        <div>
          <Label className="text-[10px] font-bold uppercase text-muted-foreground">
            Qualifiés
          </Label>
          <Input
            type="number"
            min={1}
            max={16}
            className="h-8 text-xs"
            value={phase.config.advanceCount || 2}
            onChange={(e) =>
              onUpdate({
                config: {
                  ...phase.config,
                  advanceCount: parseInt(e.target.value) || 2,
                },
              })
            }
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-[10px] font-bold uppercase text-muted-foreground">
          Préfixe des nœuds
        </Label>
        <Input
          className="h-8 text-xs"
          value={
            phase.config.nodePrefix ||
            (phase.phaseType === "ROUND_ROBIN" ? "Journée" : "Round")
          }
          onChange={(e) =>
            onUpdate({
              config: { ...phase.config, nodePrefix: e.target.value },
            })
          }
          placeholder="Journée, Round, Match..."
        />
      </div>

      <div className="flex items-center gap-3">
        <Checkbox
          id={`home-away-${phase.id}`}
          checked={phase.config.isHomeAway}
          onCheckedChange={(v) =>
            onUpdate({ config: { ...phase.config, isHomeAway: !!v } })
          }
        />
        <Label
          htmlFor={`home-away-${phase.id}`}
          className="text-xs cursor-pointer"
        >
          Aller-Retour (double confrontation)
        </Label>
      </div>

      <div className="text-[10px] text-muted-foreground bg-background/50 p-2 rounded">
        <Info className="h-3 w-3 inline mr-1" />
        Structure: {structure.rounds} {phase.config.nodePrefix || "journée"}(s),{" "}
        {structure.totalMatches} match(s) au total
      </div>
    </div>
  );
}

function EliminationConfig({ phase, onUpdate, participantsForPhase }: any) {
  const structure = calculateEliminationStructure(participantsForPhase);

  return (
    <div className="space-y-3 p-3 rounded-lg bg-muted/20">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-[10px] font-bold uppercase text-muted-foreground">
            Format
          </Label>
          <Select
            value={phase.config.bracketFormat || "SINGLE"}
            onValueChange={(value) =>
              onUpdate({ config: { ...phase.config, bracketFormat: value } })
            }
          >
            <SelectTrigger className="h-8 text-xs mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SINGLE">Simple élimination</SelectItem>
              <SelectItem value="DOUBLE">Double élimination</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-[10px] font-bold uppercase text-muted-foreground">
            Format des matchs
          </Label>
          <Select
            value={phase.config.matchFormat || "BEST_OF_1"}
            onValueChange={(value) =>
              onUpdate({ config: { ...phase.config, matchFormat: value } })
            }
          >
            <SelectTrigger className="h-8 text-xs mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BEST_OF_1">BO1</SelectItem>
              <SelectItem value="BEST_OF_3">BO3</SelectItem>
              <SelectItem value="BEST_OF_5">BO5</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="text-[10px] text-muted-foreground bg-background/50 p-2 rounded">
        <Info className="h-3 w-3 inline mr-1" />
        Structure: {structure.rounds} round(s), {structure.totalMatches}{" "}
        match(s)
        {participantsForPhase % 2 !== 0 && (
          <span className="block text-amber-500 mt-1">
            ⚠️ Nombre impair : des BYE seront générés
          </span>
        )}
      </div>
    </div>
  );
}

function SwissConfig({ phase, onUpdate }: any) {
  return (
    <div className="space-y-3 p-3 rounded-lg bg-muted/20">
      <div>
        <Label className="text-[10px] font-bold uppercase text-muted-foreground">
          Nombre de rounds
        </Label>
        <div className="flex items-center gap-3 mt-1">
          <Slider
            value={[phase.config.roundsCount || 5]}
            onValueChange={(v) =>
              onUpdate({ config: { ...phase.config, roundsCount: v[0] } })
            }
            min={3}
            max={11}
            step={2}
            className="flex-1"
          />
          <span className="w-8 text-center font-bold text-sm">
            {phase.config.roundsCount || 5}
          </span>
        </div>
      </div>
      <div>
        <Label className="text-[10px] font-bold uppercase text-muted-foreground">
          Qualifiés
        </Label>
        <Input
          type="number"
          min={1}
          max={32}
          className="h-8 text-xs mt-1"
          value={phase.config.advanceCount || 8}
          onChange={(e) =>
            onUpdate({
              config: {
                ...phase.config,
                advanceCount: parseInt(e.target.value) || 8,
              },
            })
          }
        />
      </div>
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
          <Label
            htmlFor="autoInit"
            className="text-xs font-bold cursor-pointer"
          >
            Initialiser automatiquement la Phase 1
          </Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3 w-3 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-[10px] max-w-[200px]">
                  Crée automatiquement les groupes/nœuds et assigne les
                  participants sélectionnés.
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
        <Label
          htmlFor="randomize"
          className={cn(
            "text-xs font-medium cursor-pointer",
            !autoInit && "opacity-50",
          )}
        >
          Mélanger aléatoirement les participants
        </Label>
      </div>
    </div>
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
  const [search, setSearch] = useState("");

  const filteredRegistrations = editionRegistrations.filter((reg: any) =>
    getName(reg).toLowerCase().includes(search.toLowerCase()),
  );

  const selectAll = () => {
    setSelectedRegIds(editionRegistrations.map((r: any) => r.id));
  };

  const selectNone = () => {
    setSelectedRegIds([]);
  };

  const toggleSelect = (regId: string) => {
    if (selectedRegIds.includes(regId)) {
      setSelectedRegIds(selectedRegIds.filter((id: string) => id !== regId));
    } else {
      setSelectedRegIds([...selectedRegIds, regId]);
    }
  };

  return (
    <Card className="border-none shadow-xl bg-muted/30">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Filter className="w-4 h-4 text-primary" /> Participants (
            {editionRegistrations.length})
          </CardTitle>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-[10px]"
              onClick={selectAll}
            >
              Tout
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-[10px]"
              onClick={selectNone}
            >
              Aucun
            </Button>
          </div>
        </div>
        <CardDescription className="text-xs">
          {participantStrategy === "ALL"
            ? "Tous les inscrits seront inclus dans la structure."
            : "Sélectionnez les participants à inclure"}
        </CardDescription>
        <Input
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 text-xs mt-2"
        />
      </CardHeader>
      <CardContent className="p-0 border-t">
        <ScrollArea className="h-[450px]">
          {filteredRegistrations.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground italic text-sm">
              {editionRegistrations.length === 0
                ? "Aucun participant inscrit."
                : "Aucun résultat"}
            </div>
          ) : (
            <table className="w-full text-sm">
              <tbody className="divide-y divide-border/50">
                {filteredRegistrations.map((reg: any) => (
                  <tr
                    key={reg.id}
                    className="hover:bg-primary/5 transition-colors group"
                  >
                    <td className="p-3 w-12">
                      <Checkbox
                        checked={selectedRegIds.includes(reg.id)}
                        disabled={participantStrategy === "ALL" || isPending}
                        onCheckedChange={() => toggleSelect(reg.id)}
                        className="h-4 w-4"
                      />
                    </td>
                    <td className="p-3">
                      <div
                        className={cn(
                          "font-medium text-sm",
                          !selectedRegIds.includes(reg.id) &&
                            "text-muted-foreground/50",
                        )}
                      >
                        {getName(reg)}
                      </div>
                      <div className="text-[9px] text-muted-foreground font-mono">
                        {reg.id.slice(0, 8)}...
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      {selectedRegIds.includes(reg.id) ? (
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-none text-[9px]">
                          INCLUS
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-muted-foreground text-[9px] opacity-40"
                        >
                          EXCLU
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function FloatingDeployButton({
  isPending,
  isOverLimit,
  currentParticipantsCount,
  maxParticipants,
  phasesCount,
  totalMatches,
  onClick,
}: any) {
  if (currentParticipantsCount < 2) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        size="lg"
        className={cn(
          "h-14 px-6 rounded-full shadow-2xl gap-3 font-bold text-base transition-all duration-300",
          isOverLimit
            ? "bg-destructive hover:bg-destructive/90"
            : "shadow-primary/30 hover:scale-105",
        )}
        disabled={isPending || phasesCount === 0 || isOverLimit}
        onClick={onClick}
      >
        {isPending ? (
          <>
            <RefreshCw className="w-5 h-5 animate-spin" />
            Déploiement...
          </>
        ) : isOverLimit ? (
          <>
            <AlertCircle className="w-5 h-5" />
            Limite dépassée
          </>
        ) : (
          <>
            <Play className="w-5 h-5" />
            Déployer {phasesCount} phase(s) • {totalMatches} match(s)
          </>
        )}
      </Button>
    </div>
  );
}

function PreviewDialog({
  open,
  onOpenChange,
  preview,
  phases,
  onConfirm,
  isPending,
}: any) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            Aperçu de la structure
          </DialogTitle>
          <DialogDescription>
            Voici à quoi ressemblera l'organisation de votre tournoi
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            {/* Résumé stats */}
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-primary/5 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold">
                  {preview.totalParticipants}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  Participants
                </div>
              </div>
              <div className="bg-primary/5 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold">{phases.length}</div>
                <div className="text-[10px] text-muted-foreground">Phases</div>
              </div>
              <div className="bg-primary/5 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold">{preview.totalMatches}</div>
                <div className="text-[10px] text-muted-foreground">Matchs</div>
              </div>
              <div className="bg-primary/5 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold">
                  {preview.phases.reduce(
                    (acc: number, p: any) =>
                      acc +
                      p.groups.reduce((gacc: number, g: any) => gacc + g.nodes.length, 0),
                    0,
                  )}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  Journées/Rounds
                </div>
              </div>
            </div>

            {/* Détail des phases */}
            {preview.phases.map((phase: any, idx: number) => (
              <div key={idx} className="border rounded-lg overflow-hidden">
                <div className="bg-muted/50 p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                      {idx + 1}
                    </div>
                    <span className="font-bold">{phase.name}</span>
                    <Badge variant="outline" className="text-[9px]">
                      {phase.type === "ROUND_ROBIN"
                        ? "Championnat"
                        : phase.type === "GROUP_STAGE"
                          ? "Groupes"
                          : phase.type === "ELIMINATION"
                            ? "Élimination"
                            : phase.type}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {phase.groups.reduce(
                      (acc: number, g: any) => acc + g.participantCount,
                      0,
                    )}{" "}
                    participants
                  </div>
                </div>

                <div className="p-3 space-y-3">
                  {phase.groups.map((group: any, gIdx: number) => (
                    <div
                      key={gIdx}
                      className="border-l-2 border-primary/30 pl-3"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">
                          {group.name}
                        </span>
                        <Badge variant="secondary" className="text-[9px]">
                          {group.participantCount} participants
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {group.nodes.map((node: any, nIdx: number) => (
                          <Badge
                            key={nIdx}
                            variant="outline"
                            className="text-[9px]"
                          >
                            {node.name} ({node.matchesCount} match
                            {node.matchesCount > 1 ? "s" : ""})
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter className="pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
          <Button onClick={onConfirm} disabled={isPending}>
            {isPending ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Confirmer et déployer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ConfirmDialog({
  open,
  onOpenChange,
  preview,
  phases,
  onConfirm,
  isPending,
}: any) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-amber-500" />
            Confirmation
          </DialogTitle>
          <DialogDescription>
            Une fois déployée, cette structure ne pourra pas être modifiée
            automatiquement.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
            <p className="text-sm font-medium">Récapitulatif</p>
            <ul className="text-xs text-muted-foreground mt-2 space-y-1">
              <li>• {phases.length} phase(s)</li>
              <li>• {preview.totalParticipants} participant(s)</li>
              <li>• {preview.totalMatches} match(s) à jouer</li>
            </ul>
          </div>
          <p className="text-xs text-center text-muted-foreground">
            Cette action est irréversible. Voulez-vous continuer ?
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={onConfirm} disabled={isPending}>
            {isPending ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-2" />
            )}
            Confirmer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InfoBanner() {
  return (
    <div className="flex items-center gap-4 bg-primary/5 border border-primary/20 p-4 rounded-xl text-primary text-sm shadow-sm">
      <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
        <MoveRight className="w-5 h-5" />
      </div>
      <div className="space-y-0.5">
        <p className="font-bold">Validation de la hiérarchie</p>
        <p className="text-xs opacity-80">
          Les participants sélectionnés seront propagés à la Phase 1. Les phases
          suivantes dépendront des résultats des phases précédentes.
        </p>
      </div>
    </div>
  );
}
