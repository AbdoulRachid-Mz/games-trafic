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
import {
  organizeEditionStructure,
  getStructurePreviewAction,
  resetEditionStructure,
} from "@/actions/phases";
import {
  updateEdition,
  updateTournamentEditionModeAction,
} from "@/actions/editions";
import { getEditionDetailTree } from "@/actions/tournaments";
import { EditionStructureRevealDialog } from "./edition-structure-reveal-dialog";
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
import { useScreenSize } from "@/hooks/use-screen";
// Dans les imports, ajouter :
import { getEliminationRoundName } from "@/lib/tournaments/get-name";
import { DEFAULT_ADVANCE_COUNT, getEffectiveAdvanceCount } from "@/lib/tournaments/config";
import { SCORING_DEFAULTS } from "@/lib/tournaments/scoring";

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
    thirdPlaceMatch?: boolean; // Match pour la 3ème place (Petite finale)

    // For SWISS
    roundsCount?: number;

    // For ELIMINATION / KNOCKOUT
    bracketFormat?: "SINGLE" | "DOUBLE";
    matchFormat?: "BEST_OF_1" | "BEST_OF_3" | "BEST_OF_5";

    // For all
    seedingMethod?: "RANDOM" | "SEQUENTIAL" | "SNAKE" | "MANUAL";
    // For ELIMINATION / KNOCKOUT
    knockoutStrategy?: "BARRAGE" | "DIRECT";
  };
};

interface DepthControls {
  groups: boolean;
  brackets: boolean;
  matches: boolean;
}

type AutoConfig = {
  preset: "LEAGUE" | "CHAMPIONS" | "SWISS" | "CUSTOM";
  groupsCount: number;
  groupsQualifiedCount: number;
  knockoutStrategy: "BARRAGE" | "DIRECT";
  roundsCount?: number;
  isHomeAwayGroups: boolean;
  isHomeAwayElimination: boolean;
  thirdPlaceMatch: boolean;
  nodePrefix: string;

  // New granular gen for AUTO mode
  depth: DepthControls;
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
    const participantsPerGroup = p.config.participantsPerGroup || 0;

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
        qualifiedCount: p.qualifiedCount || DEFAULT_ADVANCE_COUNT,

        // Structure des groupes
        groupsCount,
        groupsSize: participantsPerGroup > 0 ? participantsPerGroup : undefined,

        // Configuration ROUND_ROBIN (valeurs explicites uniquement :
        // 0 pour les points est une valeur valide, jamais un défaut)
        isHomeAway: p.config.isHomeAway || false,
        pointsPerWin: p.config.pointsPerWin ?? SCORING_DEFAULTS.pointsPerWin,
        pointsPerDraw: p.config.pointsPerDraw ?? SCORING_DEFAULTS.pointsPerDraw,
        pointsPerLoss: p.config.pointsPerLoss ?? SCORING_DEFAULTS.pointsPerLoss,
        advanceCount: p.config.advanceCount ?? DEFAULT_ADVANCE_COUNT,

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
    pointsPerWin: SCORING_DEFAULTS.pointsPerWin,
    pointsPerDraw: SCORING_DEFAULTS.pointsPerDraw,
    pointsPerLoss: SCORING_DEFAULTS.pointsPerLoss,
    advanceCount: 4,
    seedingMethod: "RANDOM",
    nodePrefix: "Journée",
  },
  GROUP_STAGE: {
    participantsPerGroup: 4,
    groupsCount: 0,
    isHomeAway: false,
    pointsPerWin: SCORING_DEFAULTS.pointsPerWin,
    pointsPerDraw: SCORING_DEFAULTS.pointsPerDraw,
    pointsPerLoss: SCORING_DEFAULTS.pointsPerLoss,
    advanceCount: DEFAULT_ADVANCE_COUNT,
    seedingMethod: "RANDOM",
    nodePrefix: "Round",
  },
  ELIMINATION: {
    bracketFormat: "SINGLE",
    matchFormat: "BEST_OF_1",
    seedingMethod: "RANDOM",
    nodePrefix: "Round",
    thirdPlaceMatch: false,
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
    thirdPlaceMatch: false,
  },
};

const PHASE_TYPE_LABELS: Record<
  PhaseType,
  { label: string; description: string; icon: typeof Zap; defaultGroupName?: string }
> = {
  ROUND_ROBIN: {
    label: "Championnat (Ligue)",
    description: "Tous les participants s'affrontent en aller simple ou aller-retour",
    icon: GraduationCap,
    defaultGroupName: "Journée",
  },
  GROUP_STAGE: {
    label: "Phase de groupes",
    description: "Répartition en groupes, puis qualification",
    icon: Users,
    defaultGroupName: "Groupe",
  },
  ELIMINATION: {
    label: "Élimination directe",
    description: "Tableau à élimination directe",
    icon: Zap,
    defaultGroupName: "Round",
  },
  SWISS: {
    label: "Système Suisse",
    description: "Participants affrontés selon leur classement",
    icon: Layers,
    defaultGroupName: "Round",
  },
  KNOCKOUT: {
    label: "Matchs à élimination",
    description: "Séries de matchs (BO3/BO5)",
    icon: ShieldCheck,
    defaultGroupName: "Match",
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
  const [mode, setMode] = useState<"AUTO" | "MANUAL">(
    edition?.editionConfig?.competitionMode ?? "AUTO",
  );
  const [showPreview, setShowPreview] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

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

  const [autoConfig, setAutoConfig] = useState<AutoConfig>({
    preset: (() => {
      const type = edition?.editionConfig?.competitionType;
      if (type === "CHAMPIONSHIP") return "LEAGUE";
      if (type === "LDC") return "CHAMPIONS";
      if (type === "SWISS") return "SWISS";
      return "CHAMPIONS"; // Default to CHAMPIONS for CUP or others
    })() as "LEAGUE" | "CHAMPIONS" | "SWISS" | "CUSTOM",
    isHomeAwayGroups: edition?.editionConfig?.isHomeAwayGroups ?? edition?.editionConfig?.isHomeAway ?? false,
    isHomeAwayElimination: edition?.editionConfig?.isHomeAwayElimination ?? false,
    thirdPlaceMatch: edition?.editionConfig?.thirdPlaceMatch ?? false,
    groupsQualifiedCount: edition?.editionConfig?.advanceCount ?? DEFAULT_ADVANCE_COUNT,
    groupsCount: edition?.editionConfig?.groupsCount || 4,
    nodePrefix: edition?.editionConfig?.nodePrefix || "Journée",
    knockoutStrategy:
      (edition?.editionConfig?.knockoutStrategy as any) || "BARRAGE",
    depth: {
      groups: edition?.editionConfig?.generateGroups !== false,
      brackets: edition?.editionConfig?.generateNodes !== false,
      matches: edition?.editionConfig?.generateMatches !== false,
    },
  });

  const [hasPendingConfigChange, setHasPendingConfigChange] = useState(false);
  const [showConfigConfirm, setShowConfigConfirm] = useState(false);
  const [pendingConfig, setPendingConfig] = useState<AutoConfig | null>(null);
  const [revealStructure, setRevealStructure] = useState<any | null>(null);
  const [isRevealOpen, setIsRevealOpen] = useState(false);

  // Sync mode if editionConfig changes after mount (e.g. router refresh)
  useEffect(() => {
    if (edition?.editionConfig?.competitionMode) {
      setMode(edition.editionConfig.competitionMode);
    }
  }, [edition?.editionConfig?.competitionMode]);

  // Charger la config existante de l'édition si elle change
  useEffect(() => {
    if (edition?.editionConfig) {
      const config = edition.editionConfig;
      let preset: "LEAGUE" | "CHAMPIONS" | "SWISS" | "CUSTOM" = "CHAMPIONS";
      if (config.competitionType === "CHAMPIONSHIP") preset = "LEAGUE";
      else if (config.competitionType === "SWISS") preset = "SWISS";

      setAutoConfig((prev) => ({
        ...prev,
        preset,
        isHomeAwayGroups: config.isHomeAwayGroups ?? config.isHomeAway ?? false,
        isHomeAwayElimination: config.isHomeAwayElimination ?? false,
        groupsQualifiedCount: config.advanceCount ?? DEFAULT_ADVANCE_COUNT,
        groupsCount: config.groupsCount || 4,
        nodePrefix: config.nodePrefix || "Journée",
        knockoutStrategy: (config.knockoutStrategy as any) || "BARRAGE",
        depth: {
          groups: config.generateGroups !== false,
          brackets: config.generateNodes !== false,
          matches: config.generateMatches !== false,
        },
      }));
    }
  }, [edition?.editionConfig]);

  const saveEditionConfig = useCallback(
    async (newConfig: AutoConfig) => {
      try {
        await updateTournamentEditionModeAction(editionId, "AUTO");
        await updateEdition(editionId, {
          editionConfig: {
            ...edition?.editionConfig,
            competitionType:
              newConfig.preset === "LEAGUE"
                ? "CHAMPIONSHIP"
                : newConfig.preset === "SWISS"
                  ? "SWISS"
                  : "LDC",
            competitionMode: "AUTO",
            isHomeAwayGroups: newConfig.isHomeAwayGroups,
            isHomeAwayElimination: newConfig.isHomeAwayElimination,
            advanceCount: newConfig.groupsQualifiedCount,
            groupsCount: newConfig.groupsCount,
            nodePrefix: newConfig.nodePrefix,
            knockoutStrategy: newConfig.knockoutStrategy,
            generateGroups: newConfig.depth.groups,
            generateNodes: newConfig.depth.brackets,
            generateMatches: newConfig.depth.matches,
          },
        } as any);

        toast.success("Configuration de l'édition mise à jour");
        setHasPendingConfigChange(false);
        router.refresh();
      } catch (error) {
        toast.error("Erreur lors de la sauvegarde de la configuration");
      }
    },
    [editionId, edition?.editionConfig, router],
  );

  const existingPhasesCount = edition?.phases?.length || 0;
  const hasExistingPhases = existingPhasesCount > 0;

  const handleAutoConfigChange = useCallback(
    (newConfig: AutoConfig) => {
      if (hasExistingPhases) {
        setPendingConfig(newConfig);
        setShowConfigConfirm(true);
      } else {
        setAutoConfig(newConfig);
        setHasPendingConfigChange(true);
      }
    },
    [hasExistingPhases],
  );

  const [participantStrategy, setParticipantStrategy] = useState<
    "ALL" | "SELECTED"
  >("ALL");
  const [selectedRegIds, setSelectedRegIds] = useState<string[]>(
    edition?.registrations?.map((r: any) => r.id) || [],
  );

  const [autoInit, setAutoInit] = useState(true);
  const [randomize, setRandomize] = useState(true);
  const [serverPreview, setServerPreview] = useState<any>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  const maxParticipants = edition?.maxParticipants || 0;
  const currentParticipantsCount = selectedRegIds.length;
  const isOverLimit =
    maxParticipants > 0 && currentParticipantsCount > maxParticipants;

  // Helper for power of 2
  const isPowerOfTwo = (n: number) => (n & (n - 1)) === 0 && n !== 0;
  const getNearestLowerPowerOfTwo = (n: number) =>
    Math.pow(2, Math.floor(Math.log2(n)));

  // Auto-build phases selon le preset
  const buildAutoPhases = useCallback((): DraftPhase[] => {
    const phases: DraftPhase[] = [];
    const {
      preset,
      isHomeAwayGroups,
      isHomeAwayElimination,
      thirdPlaceMatch,
      groupsQualifiedCount,
      nodePrefix,
      groupsCount,
      knockoutStrategy,
      depth = { groups: true, brackets: true, matches: true },
    } = autoConfig;

    const getDepthOptions = (isGroupPhase: boolean) => ({
      generateGroups: isGroupPhase ? depth.groups : false,
      generateNodes: depth.brackets,
      generateMatches: depth.brackets && depth.matches,
    });

    if (preset === "LEAGUE") {
      const options = getDepthOptions(true);
      phases.push({
        id: generateTempId(),
        name: isHomeAwayGroups ? "Championnat (A/R)" : "Championnat",
        phaseType: "ROUND_ROBIN",
        order: 0,
        participantSource: "EDITION",
        qualifiedCount: groupsQualifiedCount,
        ...options,
        config: {
          ...DEFAULT_PHASE_CONFIGS.ROUND_ROBIN,
          groupsCount: 1,
          isHomeAway: isHomeAwayGroups,
          advanceCount: groupsQualifiedCount,
          nodePrefix,
        },
      });
    } else if (preset === "CHAMPIONS") {
      // 1. Phase de groupes
      const groupPhaseOptions = getDepthOptions(true);
      const groupPhaseId = generateTempId();
      const qualifiedTotal = (groupsCount || 4) * groupsQualifiedCount;

      phases.push({
        id: groupPhaseId,
        name: isHomeAwayGroups ? "Phase de groupes (A/R)" : "Phase de groupes",
        phaseType: "GROUP_STAGE",
        order: 0,
        participantSource: "EDITION",
        qualifiedCount: qualifiedTotal,
        ...groupPhaseOptions,
        config: {
          ...DEFAULT_PHASE_CONFIGS.GROUP_STAGE,
          groupsCount: groupsCount,
          advanceCount: groupsQualifiedCount,
          isHomeAway: isHomeAwayGroups,
          nodePrefix: "Groupe",
        },
      });

      // 2. Phase Éliminatoire (nomenclature LDC correcte)
      const koOptions = getDepthOptions(false);
      
      phases.push({
        id: generateTempId(),
        name: isHomeAwayElimination ? "Phase éliminatoire (A/R)" : "Phase éliminatoire",
        phaseType: "ELIMINATION",
        order: 1,
        participantSource: "PHASE_QUALIFIED",
        sourcePhaseId: groupPhaseId,
        qualifiedCount: qualifiedTotal,
        ...koOptions,
        config: {
          ...DEFAULT_PHASE_CONFIGS.ELIMINATION,
          isHomeAway: isHomeAwayElimination,
          nodePrefix: "Match",
          knockoutStrategy, // Pour transmission éventuelle
          thirdPlaceMatch,
        },
      });

    } else if (preset === "SWISS") {
      const options = getDepthOptions(true);
      phases.push({
        id: generateTempId(),
        name: "Système Suisse",
        phaseType: "SWISS",
        order: 0,
        participantSource: "EDITION",
        qualifiedCount: groupsQualifiedCount,
        ...options,
        config: {
          ...DEFAULT_PHASE_CONFIGS.SWISS,
          advanceCount: groupsQualifiedCount,
          nodePrefix: "Round",
        },
      });
    }

    return phases;
  }, [autoConfig]);

  /**
   * Formate les phases draft pour l'API de preview
   */
  function buildPhasesForPreview(phases: DraftPhase[]): any[] {
    return phases.map((p, idx) => ({
      name: p.name,
      phaseType: p.phaseType,
      order: idx,
      config: p.config,
    }));
  }

  // Mettre à jour le preview via le serveur
  useEffect(() => {
    const updatePreview = async () => {
      if (selectedRegIds.length < 2) return;

      setIsPreviewLoading(true);
      try {
        const phasesToPreview =
          mode === "AUTO" ? buildAutoPhases() : draftPhases;

        // Formatter pour l'API StructureEngine
        const phasesForApi = buildPhasesForPreview(phasesToPreview);

        const preview = await getStructurePreviewAction(
          editionId,
          phasesForApi,
          selectedRegIds,
        );
        setServerPreview(preview);
      } catch (error) {
        console.error("Preview update error:", error);
      } finally {
        setIsPreviewLoading(false);
      }
    };

    const timer = setTimeout(updatePreview, 500); // Debounce
    return () => clearTimeout(timer);
  }, [
    mode,
    draftPhases,
    autoConfig,
    selectedRegIds,
    editionId,
    buildAutoPhases,
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

      // Removed strict power-of-2 validation to allow BYEs and flexible brackets
      /*
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
      */

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

    const totalMatches = serverPreview?.totalMatches || 0;

    startTransition(async () => {
      try {
        const result = await organizeEditionStructure(
          editionId,
          phasesForApi,
          selectedRegIds,
          {
            autoInitializeFirstPhase: autoInit,
            randomizeDistribution: randomize,
            clearExisting: true, // Dans le wizard, on repart généralement de zéro
          },
        );

        if (result.success) {
          toast.success("Structure déployée avec succès !", {
            description: `${phasesToCreate.length} phase(s) créée(s), ${totalMatches} match(s) généré(s)`,
            duration: 5000,
          });

          try {
            const tree = await getEditionDetailTree(editionId);
            if (tree && tree.phases?.length > 0) {
              setRevealStructure(tree);
              setIsRevealOpen(true);
              return;
            }
          } catch (e) {
            console.warn("Could not load tree for reveal dialog:", e);
          }

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
    serverPreview,
    router,
  ]);

  const handleResetStructure = useCallback(async () => {
    setIsResetting(true);
    try {
      const result = await resetEditionStructure(editionId);
      if (result.success) {
        toast.success("Structure réinitialisée avec succès");
        setShowResetConfirm(false);
        router.refresh();
      }
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la réinitialisation");
    } finally {
      setIsResetting(false);
    }
  }, [editionId, router]);

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
              <div className="flex flex-wrap justify-center gap-3">
                <Button variant="outline" onClick={() => setShowPreview(true)}>
                  <Eye className="h-4 w-4 mr-2" /> Voir la structure
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setShowResetConfirm(true)}
                  disabled={isResetting}
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Réinitialiser
                </Button>
                <Button variant="secondary" onClick={() => setMode("MANUAL")}>
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
                onConfigChange={handleAutoConfigChange}
                currentParticipantsCount={currentParticipantsCount}
                hasPendingChanges={hasPendingConfigChange}
                onSave={() => saveEditionConfig(autoConfig)}
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
          totalMatches={serverPreview?.totalMatches || 0}
          onClick={handleDeploy}
          isLoading={isPreviewLoading}
        />
      )}

      {/* Preview dialog */}
      <PreviewDialog
        open={showPreview}
        onOpenChange={setShowPreview}
        preview={serverPreview}
        phases={mode === "AUTO" ? buildAutoPhases() : draftPhases}
        onConfirm={handleDeploy}
        isPending={isPending}
      />

      {/* Confirm dialog */}
      <ConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        preview={serverPreview}
        phases={mode === "AUTO" ? buildAutoPhases() : draftPhases}
        onConfirm={confirmDeploy}
        isPending={isPending}
      />

      {/* Reset confirm dialog */}
      <Dialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Réinitialiser la structure ?
            </DialogTitle>
            <DialogDescription>
              Cette action est{" "}
              <span className="font-bold text-destructive">irréversible</span>.
              Toutes les phases, tous les groupes, tous les nœuds de bracket et
              TOUS les matchs de cette édition seront définitivement supprimés.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowResetConfirm(false)}
              disabled={isResetting}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleResetStructure}
              className="gap-2"
              disabled={isResetting}
            >
              {isResetting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Confirmer la suppression totale
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Config Change Confirm Dialog */}
      <Dialog open={showConfigConfirm} onOpenChange={setShowConfigConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Changement de configuration
            </DialogTitle>
            <DialogDescription className="space-y-3">
              <p>
                Vous avez déjà des phases existantes dans cette édition. Changer
                le format ou la structure pourrait rendre la structure actuelle
                incohérente.
              </p>
              <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-md text-xs text-amber-700">
                <strong>Attention:</strong> Il est fortement recommandé de{" "}
                <span className="font-bold">réinitialiser la structure</span>{" "}
                avant d'appliquer un nouveau format automatique si des matchs
                ont déjà été générés.
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowConfigConfirm(false);
                setPendingConfig(null);
              }}
            >
              Annuler
            </Button>
            <Button
              variant="default"
              className="bg-amber-600 hover:bg-amber-700"
              onClick={() => {
                if (pendingConfig) {
                  setAutoConfig(pendingConfig);
                  setHasPendingConfigChange(true);
                }
                setShowConfigConfirm(false);
                setPendingConfig(null);
              }}
            >
              Appliquer quand même
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EditionStructureRevealDialog
        open={isRevealOpen}
        onOpenChange={setIsRevealOpen}
        editionName={edition?.name}
        structure={revealStructure}
        generationLevel={{
          groups: mode === "AUTO" ? autoConfig.depth.groups : draftPhases.some((p) => p.generateGroups),
          brackets: mode === "AUTO" ? autoConfig.depth.brackets : draftPhases.some((p) => p.generateNodes),
          matches: mode === "AUTO" ? autoConfig.depth.matches : draftPhases.some((p) => p.generateMatches),
        }}
        onFinish={() => {
          router.push(
            `/tournaments/${tournamentId}/editions/${editionId}/dashboard/phases`,
          );
          router.refresh();
        }}
      />
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function AutoModeConfig({
  autoConfig,
  onConfigChange,
  currentParticipantsCount,
  hasPendingChanges,
  onSave,
}: {
  autoConfig: AutoConfig;
  onConfigChange: (config: AutoConfig) => void;
  currentParticipantsCount: number;
  hasPendingChanges?: boolean;
  onSave?: () => void;
}) {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!onSave) return;
    setIsSaving(true);
    await onSave();
    setIsSaving(false);
  };

  // Limites dynamiques basées sur les participants
  const maxGroupsCount = Math.max(1, Math.floor(currentParticipantsCount / 2));
  const safeGroupsCount = Math.min(autoConfig.groupsCount || 1, maxGroupsCount);
  const participantsPerGroup = safeGroupsCount > 0 ? Math.floor(currentParticipantsCount / safeGroupsCount) : 0;
  const maxQualifiedPerGroup = Math.max(1, participantsPerGroup - 1);
  const safeQualifiedCount = Math.min(autoConfig.groupsQualifiedCount, maxQualifiedPerGroup);

  return (
    <div className="space-y-6">
      {hasPendingChanges && (
        <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-amber-600 text-xs font-medium">
            <AlertCircle className="h-4 w-4" />
            <span>Modifications non enregistrées</span>
          </div>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="h-7 text-[10px] bg-amber-600 hover:bg-amber-700"
          >
            {isSaving ? (
              <RefreshCw className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <CheckCircle2 className="h-3 w-3 mr-1" />
            )}
            Enregistrer la config
          </Button>
        </div>
      )}

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
              onClick={() =>
                onConfigChange({ ...autoConfig, preset: p.id as any })
              }
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
              checked={autoConfig.isHomeAwayGroups}
              onCheckedChange={(v) =>
                onConfigChange({ ...autoConfig, isHomeAwayGroups: !!v })
              }
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium">Préfixe des journées</Label>
            <Input
              className="h-8 text-sm"
              value={autoConfig.nodePrefix}
              onChange={(e) =>
                onConfigChange({ ...autoConfig, nodePrefix: e.target.value })
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
                  onConfigChange({ ...autoConfig, groupsQualifiedCount: v[0] })
                }
                min={1}
                max={Math.max(1, currentParticipantsCount - 1)}
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
        <>
          <div className="space-y-4 p-4 rounded-xl bg-muted/30">
            <div className="flex items-center justify-between border-b pb-3 border-primary/10">
              <Label className="text-sm font-bold">
                Aller-Retour (Groupes)
              </Label>
              <Checkbox
                checked={autoConfig.isHomeAwayGroups}
                onCheckedChange={(v) =>
                  onConfigChange({ ...autoConfig, isHomeAwayGroups: !!v })
                }
              />
            </div>
            
            <div className="flex items-center justify-between border-b pb-3 border-primary/10">
              <Label className="text-sm font-bold">
                Aller-Retour (Éliminations)
              </Label>
              <Checkbox
                checked={autoConfig.isHomeAwayElimination}
                onCheckedChange={(v) =>
                  onConfigChange({ ...autoConfig, isHomeAwayElimination: !!v })
                }
              />
            </div>

            <div className="flex items-center justify-between border-b pb-3 border-primary/10">
              <div>
                <Label className="text-sm font-bold">
                  Match pour la 3ème place
                </Label>
                <p className="text-xs text-muted-foreground">
                  Générer une petite finale opposant les deux perdants des demi-finales
                </p>
              </div>
              <Checkbox
                checked={autoConfig.thirdPlaceMatch}
                onCheckedChange={(v) =>
                  onConfigChange({ ...autoConfig, thirdPlaceMatch: !!v })
                }
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium">Nombre de groupes
                <span className="ml-2 text-[10px] text-muted-foreground font-normal">
                  (max {maxGroupsCount} pour {currentParticipantsCount} participants)
                </span>
              </Label>
              <div className="flex items-center gap-3">
                <Slider
                  value={[Math.min(autoConfig.groupsCount || 1, maxGroupsCount)]}
                  onValueChange={(v) => {
                    const newGroupsCount = v[0];
                    const newParticipantsPerGroup = Math.floor(currentParticipantsCount / newGroupsCount);
                    const newMaxQualified = Math.max(1, newParticipantsPerGroup - 1);
                    const newQualified = Math.min(autoConfig.groupsQualifiedCount, newMaxQualified);
                    onConfigChange({ ...autoConfig, groupsCount: newGroupsCount, groupsQualifiedCount: newQualified });
                  }}
                  min={1}
                  max={maxGroupsCount}
                  step={1}
                  className="flex-1"
                />
                <span className="w-8 text-center font-bold text-sm">
                  {Math.min(autoConfig.groupsCount, maxGroupsCount)}
                </span>
              </div>
              {currentParticipantsCount > 0 && (
                <p className="text-[10px] text-muted-foreground">
                  {Math.floor(currentParticipantsCount / Math.min(autoConfig.groupsCount || 1, maxGroupsCount))} participants/groupe
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium">Qualifiés par groupe
                <span className="ml-2 text-[10px] text-muted-foreground font-normal">
                  (max {maxQualifiedPerGroup})
                </span>
              </Label>
              <div className="flex items-center gap-3">
                <Slider
                  value={[Math.min(autoConfig.groupsQualifiedCount, maxQualifiedPerGroup)]}
                  onValueChange={(v) =>
                    onConfigChange({
                      ...autoConfig,
                      groupsQualifiedCount: v[0],
                    })
                  }
                  min={1}
                  max={maxQualifiedPerGroup}
                  step={1}
                  className="flex-1"
                />
                <span className="w-8 text-center font-bold text-sm">
                  {Math.min(autoConfig.groupsQualifiedCount, maxQualifiedPerGroup)}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Total qualifiés : {Math.min(autoConfig.groupsCount, maxGroupsCount)} × {Math.min(autoConfig.groupsQualifiedCount, maxQualifiedPerGroup)} = <span className="font-bold text-primary">{Math.min(autoConfig.groupsCount, maxGroupsCount) * Math.min(autoConfig.groupsQualifiedCount, maxQualifiedPerGroup)}</span> en phase éliminatoire
              </p>
            </div>

            {/* Knockout Strategy choice */}
            {(() => {
              const qualifiedTotal = safeGroupsCount * safeQualifiedCount;
              const isPowerOfTwo = (n: number) => (n & (n - 1)) === 0 && n !== 0;

              if (qualifiedTotal > 0 && !isPowerOfTwo(qualifiedTotal)) {
                return (
                  <div className="space-y-3 pt-2 border-t border-primary/10">
                    <Label className="text-xs font-bold text-primary">
                      Gestion du tableau ({qualifiedTotal} qualifiés — non puissance de 2)
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        variant={
                          autoConfig.knockoutStrategy === "BARRAGE"
                            ? "default"
                            : "outline"
                        }
                        onClick={() =>
                          onConfigChange({
                            ...autoConfig,
                            knockoutStrategy: "BARRAGE",
                          })
                        }
                        className="text-[10px] h-7"
                      >
                        Tour de Barrage
                      </Button>
                      <Button
                        size="sm"
                        variant={
                          autoConfig.knockoutStrategy === "DIRECT"
                            ? "default"
                            : "outline"
                        }
                        onClick={() =>
                          onConfigChange({
                            ...autoConfig,
                            knockoutStrategy: "DIRECT",
                          })
                        }
                        className="text-[10px] h-7"
                      >
                        Direct (avec BYEs)
                      </Button>
                    </div>
                  </div>
                );
              }
              return null;
            })()}
          </div>


          {/* Dynamic Knockout Preview Box inside CHAMPIONS config */}
          {(() => {
            const qualifiedTotal = safeGroupsCount * safeQualifiedCount;
            const rounds = Math.ceil(Math.log2(Math.max(2, qualifiedTotal)));
            const stages: string[] = [];

            // Nommage LDC correct selon le nombre de qualifiés
            if (qualifiedTotal >= 2) stages.unshift("Finale");
            if (qualifiedTotal >= 4) stages.unshift("Demi-finale");
            if (qualifiedTotal >= 8) stages.unshift("1/4 de finale");
            if (qualifiedTotal >= 16) stages.unshift("1/8 de finale");
            if (qualifiedTotal >= 32) stages.unshift("1/16 de finale");
            if (qualifiedTotal >= 64) stages.unshift("1/32 de finale");
            if (qualifiedTotal >= 128) stages.unshift("1/64 de finale");

            return (
              <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 mt-2">
                <Label className="text-xs font-bold text-primary flex items-center gap-2 mb-3">
                  <Trophy className="h-4 w-4" />
                  Phase éliminatoire ({qualifiedTotal} qualifiés)
                </Label>
                <div className="flex items-center flex-wrap gap-2 text-sm">
                  {stages.map((stage, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-muted-foreground font-medium"
                    >
                      <div className={`px-2 py-1 border rounded text-xs shadow-sm ${idx === stages.length - 1 ? "bg-primary text-primary-foreground border-primary font-bold" : "bg-background"}`}>
                        {stage}
                      </div>
                      {idx < stages.length - 1 && (
                        <ArrowRight className="h-3 w-3" />
                      )}
                    </div>
                  ))}
                  {stages.length === 0 && (
                    <span className="text-xs text-destructive">
                      Il faut au moins 2 qualifiés au total.
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground mt-3 leading-tight">
                  {safeGroupsCount} groupe(s) × {safeQualifiedCount} qualifié(s) = <strong>{qualifiedTotal}</strong> en phase éliminatoire.
                </p>
              </div>
            );
          })()}
        </>
      )}

      {autoConfig.preset === "SWISS" && (
        <div className="space-y-2 p-4 rounded-xl bg-muted/30">
          <Label className="text-sm font-bold">Nombre de rounds</Label>
          <div className="flex items-center gap-3">
            <Slider
              value={[5]}
              onValueChange={(v) =>
                onConfigChange({ ...autoConfig, roundsCount: v[0] })
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

      {/* Contrôles de profondeur de structure */}
      <div className="space-y-3 mt-4 pt-4 border-t">
        <Label className="font-bold text-xs uppercase tracking-wider text-primary">
          Niveaux de génération
        </Label>

        <div className="space-y-3">
          {/* Niveau 1: Groupes - Toujours actif pour GROUP_STAGE/ROUND_ROBIN */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="depth-groups"
              checked={autoConfig.depth?.groups !== false}
              onCheckedChange={(v) =>
                onConfigChange({
                  ...autoConfig,
                  depth: { ...autoConfig.depth, groups: !!v },
                })
              }
              disabled={
                autoConfig.preset !== "LEAGUE" &&
                autoConfig.preset !== "CHAMPIONS"
              }
            />
            <Label
              htmlFor="depth-groups"
              className="text-sm cursor-pointer flex items-center gap-2"
            >
              Groupes / Poules
              {(autoConfig.preset === "LEAGUE" ||
                autoConfig.preset === "CHAMPIONS") && (
                <span className="text-[10px] text-muted-foreground">
                  (Obligatoire)
                </span>
              )}
            </Label>
          </div>

          {/* Niveau 2: Brackets / Journées - Désactivé si groupes non cochés */}
          <div className="flex items-center gap-2 pl-6 border-l-2 border-muted">
            <Checkbox
              id="depth-brackets"
              checked={autoConfig.depth?.brackets !== false}
              onCheckedChange={(v) =>
                onConfigChange({
                  ...autoConfig,
                  depth: { ...autoConfig.depth, brackets: !!v },
                })
              }
              disabled={autoConfig.depth?.groups === false}
            />
            <Label htmlFor="depth-brackets" className="text-sm cursor-pointer">
              Brackets / Journées / Nœuds
            </Label>
          </div>

          {/* Niveau 3: Matchs - Désactivé si brackets non cochés */}
          <div className="flex items-center gap-2 pl-12 border-l-2 border-muted">
            <Checkbox
              id="depth-matches"
              checked={autoConfig.depth?.matches !== false}
              onCheckedChange={(v) =>
                onConfigChange({
                  ...autoConfig,
                  depth: { ...autoConfig.depth, matches: !!v },
                })
              }
              disabled={autoConfig.depth?.brackets === false}
            />
            <Label htmlFor="depth-matches" className="text-sm cursor-pointer">
              Générer les Matchs
            </Label>
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground mt-2">
          {!autoConfig.depth?.brackets
            ? "La structure s'arrêtera à la création des groupes."
            : !autoConfig.depth?.matches
              ? "Les brackets seront créés, mais les matchs devront être générés manuellement."
              : "Structure complète (Groupes > Brackets > Matchs)."}
        </p>
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
    : getEffectiveAdvanceCount(phase) * (phase.config.groupsCount || 1);

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
                Niveaux de génération
              </Label>
              <div className="flex flex-col gap-3">
                {/* Level 1: Groups (Mandatory for group stages) */}
                <div className="flex items-center gap-2">
                  <div className="relative flex items-center">
                    <Checkbox
                      id={`gen-groups-${phase.id}`}
                      checked={
                        phase.generateGroups ||
                        phase.phaseType === "GROUP_STAGE" ||
                        phase.phaseType === "ROUND_ROBIN"
                      }
                      onCheckedChange={(v) => onUpdate({ generateGroups: !!v })}
                      disabled={
                        phase.phaseType === "GROUP_STAGE" ||
                        phase.phaseType === "ROUND_ROBIN" ||
                        phase.phaseType === "ELIMINATION" ||
                        phase.phaseType === "KNOCKOUT"
                      }
                    />
                  </div>
                  <Label
                    htmlFor={`gen-groups-${phase.id}`}
                    className="text-xs flex items-center gap-2 cursor-pointer"
                  >
                    Groupes / Poules
                    {(phase.phaseType === "GROUP_STAGE" ||
                      phase.phaseType === "ROUND_ROBIN") && (
                      <span className="text-[9px] text-muted-foreground italic">
                        (Obligatoire)
                      </span>
                    )}
                  </Label>
                </div>

                {/* Level 2: Brackets / Nodes */}
                <div className="flex items-center gap-2 pl-4 border-l-2 border-muted">
                  <Checkbox
                    id={`gen-nodes-${phase.id}`}
                    checked={phase.generateNodes}
                    onCheckedChange={(v) => {
                      const enabled = !!v;
                      onUpdate({
                        generateNodes: enabled,
                        generateMatches: enabled
                          ? phase.generateMatches
                          : false,
                      });
                    }}
                  />
                  <Label
                    htmlFor={`gen-nodes-${phase.id}`}
                    className="text-xs cursor-pointer"
                  >
                    Brackets / Journées
                  </Label>
                </div>

                {/* Level 3: Matches */}
                <div
                  className={cn(
                    "flex items-center gap-2 pl-8 border-l-2 border-muted transition-opacity",
                    !phase.generateNodes && "opacity-50",
                  )}
                >
                  <Checkbox
                    id={`gen-matches-${phase.id}`}
                    checked={phase.generateMatches}
                    disabled={!phase.generateNodes}
                    onCheckedChange={(v) => onUpdate({ generateMatches: !!v })}
                  />
                  <Label
                    htmlFor={`gen-matches-${phase.id}`}
                    className="text-xs cursor-pointer"
                  >
                    Générer les Matchs
                  </Label>
                </div>
              </div>
              <p className="text-[9px] text-muted-foreground mt-1">
                {!phase.generateNodes
                  ? "La structure de la phase s'arrêtera à la création des groupes."
                  : !phase.generateMatches
                    ? "Les brackets seront créés, mais les matchs devront être générés manuellement."
                    : "Structure complète (Groupes > Brackets > Matchs)."}
              </p>
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
          {phase.phaseType === "ROUND_ROBIN" ? (
            <>
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">
                Groupes
              </Label>
              <div className="h-8 px-2 flex items-center text-xs rounded-md border bg-muted/10 text-muted-foreground">
                Journées automatiques
              </div>
            </>
          ) : (
            <>
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">
                Groupes
              </Label>
              <Input
                type="number"
                min={1}
                max={maxGroups}
                className="h-8 text-xs"
                value={phase.config.groupsCount || defaultGroupsCount}
                onChange={(e) =>
                  onUpdate({
                    config: {
                      ...phase.config,
                      groupsCount: parseInt(e.target.value) || 1,
                    },
                  })
                }
              />
            </>
          )}
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
            value={getEffectiveAdvanceCount(phase)}
            onChange={(e) =>
              onUpdate({
                config: {
                  ...phase.config,
                  advanceCount: parseInt(e.target.value) || getEffectiveAdvanceCount(phase),
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
        Structure: {structure.rounds} journée(s) (1 groupe = 1 journée,{" "}
        1 nœud = 1 confrontation à 2), {structure.totalMatches} match(s) au
        total. La qualification se fait à la clôture de la phase.
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

      <div className="flex items-center justify-between pt-2 border-t border-border/30">
        <div>
          <Label
            className="text-xs font-bold cursor-pointer"
            htmlFor={`third-place-${phase.id}`}
          >
            Match pour la 3ème place
          </Label>
          <p className="text-[10px] text-muted-foreground">
            Petite finale opposant les deux perdants des demi-finales
          </p>
        </div>
        <Checkbox
          id={`third-place-${phase.id}`}
          checked={phase.config?.thirdPlaceMatch || false}
          onCheckedChange={(v) =>
            onUpdate({ config: { ...phase.config, thirdPlaceMatch: !!v } })
          }
        />
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
          value={getEffectiveAdvanceCount(phase)}
          onChange={(e) =>
            onUpdate({
              config: {
                ...phase.config,
                advanceCount: parseInt(e.target.value) || getEffectiveAdvanceCount(phase),
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
  isLoading,
}: any) {
  const { isMobile } = useScreenSize();
  if (currentParticipantsCount < 2) return null;

  return (
    <div
      className={cn(
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4",
        isMobile ? "bottom-2" : "",
      )}
    >
      <Button
        size={isMobile ? "sm" : "lg"}
        className={cn(
          "h-14 w-full rounded-full shadow-2xl gap-3 font-bold text-base transition-all duration-300",
          isOverLimit
            ? "bg-destructive hover:bg-destructive/90"
            : "shadow-primary/30 hover:scale-105",
        )}
        disabled={isPending || phasesCount === 0 || isOverLimit || isLoading}
        onClick={onClick}
      >
        {isPending ? (
          <>
            <RefreshCw className="w-5 h-5 animate-spin" />
            Déploiement...
          </>
        ) : isLoading ? (
          <>
            <RefreshCw className="w-5 h-5 animate-spin" />
            Calcul de l'aperçu...
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
  const { isMobile } = useScreenSize();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-w-6xl max-h-[85vh] overflow-y-auto flex flex-col",
          isMobile ? "w-[95%]" : "",
        )}
      >
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
                  {preview?.totalParticipants || 0}
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
                <div className="text-2xl font-bold">
                  {preview?.totalMatches || 0}
                </div>
                <div className="text-[10px] text-muted-foreground">Matchs</div>
              </div>
              <div className="bg-primary/5 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold">
                  {preview?.phases?.reduce(
                    (acc: number, p: any) => acc + (p.groups?.length || 0),
                    0,
                  ) || 0}
                </div>
                <div className="text-[10px] text-muted-foreground">Groupes</div>
              </div>
            </div>

            {/* Détail des phases */}
            {preview?.phases?.map((phase: any, idx: number) => (
              <div key={idx} className="border rounded-lg overflow-hidden">
                <div className="bg-muted/50 p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                      {idx + 1}
                    </div>
                    <span className="font-bold">{phase.name}</span>
                    <Badge variant="outline" className="text-[9px]">
                      {phase.type}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {phase.participantCount} participants
                    </span>
                    <Badge
                      variant="default"
                      className="text-[9px] bg-primary/20 text-primary border-none"
                    >
                      {phase.matchesCount} matchs
                    </Badge>
                  </div>
                </div>

                <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {phase.groups.map((group: any, gIdx: number) => (
                    <div
                      key={gIdx}
                      className="border rounded-lg p-3 bg-card/50"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-bold">{group.name}</span>
                        <span className="text-[10px] text-muted-foreground font-medium">
                          {group.participantCount} part.
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-[10px] text-muted-foreground">
                          {group.rounds
                            ? `${group.rounds} rounds`
                            : "Poule unique"}
                        </div>
                        <Badge
                          variant={
                            group.matchesCount > 0 ? "secondary" : "outline"
                          }
                          className="text-[9px] h-4"
                        >
                          {group.matchesCount} match
                          {group.matchesCount > 1 ? "s" : ""}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-3 pb-3">
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Zap className="h-2.5 w-2.5 text-primary" />
                    {phase.seedingNote}
                  </p>
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
      <DialogContent className="sm:max-w-md">
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
              <li>• {preview?.totalParticipants || 0} participant(s)</li>
              <li>• {preview?.totalMatches || 0} match(s) à jouer</li>
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
