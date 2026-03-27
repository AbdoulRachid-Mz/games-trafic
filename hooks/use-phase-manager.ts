// @/hooks/use-phase-manager.ts
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getTournamentPhases,
  getTournamentPhaseById,
  createTournamentPhase,
  updateTournamentPhase,
  deleteTournamentPhase,
} from "@/actions/phases";
import {
  reorderPhasesAction,
  activatePhaseAction,
} from "@/actions/editions";
import type { TournamentPhase, NewTournamentPhase } from "@/database/schema";
import { toast } from "sonner";

// ============================================================================
// QUERY KEYS
// ============================================================================
export const phaseKeys = {
  all: ["phases"] as const,
  lists: () => [...phaseKeys.all, "list"] as const,
  list: (editionId: string) => [...phaseKeys.lists(), editionId] as const,
  details: () => [...phaseKeys.all, "detail"] as const,
  detail: (id: string) => [...phaseKeys.details(), id] as const,
};

// ============================================================================
// QUERIES
// ============================================================================

export function usePhases(editionId: string, enabled = true) {
  return useQuery({
    queryKey: phaseKeys.list(editionId),
    queryFn: () =>
      getTournamentPhases({
        filters: { editionId },
        options: { sortBy: "order", sortOrder: "asc" },
        pagination: { page: 1, limit: 100 },
      }),
    enabled: !!editionId && enabled,
    staleTime: 1000 * 60,
  });
}

export function usePhaseById(id: string, populate?: string[], enabled = true) {
  return useQuery({
    queryKey: phaseKeys.detail(id),
    queryFn: () => getTournamentPhaseById(id, { populate }),
    enabled: !!id && enabled,
    staleTime: 1000 * 60,
  });
}

// ============================================================================
// MANAGER HOOK
// ============================================================================

/**
 * usePhaseManager — gestion complète des phases d'une édition
 */
export function usePhaseManager(editionId: string, tournamentId?: string) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: phaseKeys.list(editionId) });
    queryClient.invalidateQueries({ queryKey: ["tournament-editions", "detail"] });
  };

  // ---- CREATE PHASE ----
  const createPhase = useMutation({
    mutationFn: async (data: Omit<NewTournamentPhase, "editionId" | "order">) => {
      // Auto-compute order: max existing + 1
      const existing = await getTournamentPhases({
        filters: { editionId },
        options: { sortBy: "order", sortOrder: "desc" },
        pagination: { page: 1, limit: 1 },
      });
      const nextOrder = (existing.data[0]?.order ?? 0) + 1;
      return createTournamentPhase({ ...data, editionId, order: nextOrder });
    },
    onSuccess: () => {
      toast.success("Phase créée avec succès");
      invalidate();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erreur lors de la création de la phase");
    },
  });

  // ---- BULK CREATE PHASES ----
  const bulkCreatePhases = useMutation({
    mutationFn: async (
      phases: Array<Omit<NewTournamentPhase, "editionId" | "order">>
    ) => {
      const existing = await getTournamentPhases({
        filters: { editionId },
        options: { sortBy: "order", sortOrder: "desc" },
        pagination: { page: 1, limit: 1 },
      });
      const startOrder = (existing.data[0]?.order ?? 0) + 1;
      return Promise.all(
        phases.map((p, i) =>
          createTournamentPhase({ ...p, editionId, order: startOrder + i })
        )
      );
    },
    onSuccess: (result) => {
      toast.success(`${result.length} phase(s) créée(s)`);
      invalidate();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erreur lors de la création des phases");
    },
  });

  // ---- UPDATE PHASE ----
  const updatePhase = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<NewTournamentPhase>;
    }) => updateTournamentPhase(id, data),
    onSuccess: () => {
      toast.success("Phase mise à jour");
      invalidate();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erreur lors de la mise à jour");
    },
  });

  // ---- DELETE PHASE ----
  const deletePhase = useMutation({
    mutationFn: (id: string) => deleteTournamentPhase(id),
    onSuccess: () => {
      toast.success("Phase supprimée");
      invalidate();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erreur lors de la suppression");
    },
  });

  // ---- REORDER PHASE ----
  const reorderPhase = useMutation({
    mutationFn: ({
      id,
      direction,
    }: {
      id: string;
      direction: "up" | "down";
    }) =>
      reorderPhasesAction({
        id,
        direction,
        editionId,
        tournamentId: tournamentId || "",
      }),
    onSuccess: () => {
      invalidate();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erreur lors du réordonnancement");
    },
  });

  // ---- ACTIVATE PHASE ----
  const activatePhase = useMutation({
    mutationFn: (id: string) =>
      activatePhaseAction({
        id,
        editionId,
        tournamentId: tournamentId || "",
      }),
    onSuccess: () => {
      toast.success("Phase activée");
      invalidate();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erreur lors de l'activation");
    },
  });

  // ---- HELPERS ----
  /**
   * Génère automatiquement des phases standard (Groupes + Quarts + Demies + Finale)
   */
  const generatePhasesAuto = async (config: {
    includeGroups?: boolean;
    includeQuarterFinals?: boolean;
    includeSemiFinals?: boolean;
    includeFinal?: boolean;
  }) => {
    const phases: Array<Omit<NewTournamentPhase, "editionId" | "order">> = [];
    if (config.includeGroups)
      phases.push({ name: "Phase de groupes", phaseType: "GROUP_STAGE", isActive: false, isCompleted: false, isHidden: false, isDeleted: false });
    if (config.includeQuarterFinals)
      phases.push({ name: "Quarts de finale", phaseType: "ELIMINATION", isActive: false, isCompleted: false, isHidden: false, isDeleted: false });
    if (config.includeSemiFinals)
      phases.push({ name: "Demi-finales", phaseType: "ELIMINATION", isActive: false, isCompleted: false, isHidden: false, isDeleted: false });
    if (config.includeFinal)
      phases.push({ name: "Finale", phaseType: "ELIMINATION", isActive: false, isCompleted: false, isHidden: false, isDeleted: false });

    if (phases.length > 0) {
      await bulkCreatePhases.mutateAsync(phases);
    }
  };

  return {
    // Mutations
    createPhase,
    bulkCreatePhases,
    updatePhase,
    deletePhase,
    reorderPhase,
    activatePhase,
    // Helpers
    generatePhasesAuto,
    // State helpers
    isLoading:
      createPhase.isPending ||
      updatePhase.isPending ||
      deletePhase.isPending ||
      reorderPhase.isPending ||
      activatePhase.isPending,
  };
}
