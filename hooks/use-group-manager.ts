// @/hooks/use-group-manager.ts
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getPhaseGroups,
  getPhaseGroupById,
  createPhaseGroup,
  updatePhaseGroup,
  deletePhaseGroup,
  createPhaseGroupParticipant,
  deletePhaseGroupParticipant,
  getPhaseGroupParticipants,
} from "@/actions/phases";
import { getEditionRegistrations } from "@/actions/tournaments";
import type {
  PhaseGroup,
  NewPhaseGroup,
  PhaseGroupParticipant,
  NewPhaseGroupParticipant,
} from "@/database/schema";
import { generateGroups } from "@/lib/tournaments/group.generator";
import { toast } from "sonner";

// ============================================================================
// QUERY KEYS
// ============================================================================
export const groupKeys = {
  all: ["phase-groups"] as const,
  lists: () => [...groupKeys.all, "list"] as const,
  list: (phaseId: string) => [...groupKeys.lists(), phaseId] as const,
  details: () => [...groupKeys.all, "detail"] as const,
  detail: (id: string) => [...groupKeys.details(), id] as const,
  participants: (groupId: string) =>
    [...groupKeys.detail(groupId), "participants"] as const,
};

// ============================================================================
// QUERIES
// ============================================================================

export function useGroups(phaseId: string, enabled = true) {
  return useQuery({
    queryKey: groupKeys.list(phaseId),
    queryFn: () =>
      getPhaseGroups({
        filters: { phaseId },
        options: { sortBy: "order", sortOrder: "asc" },
        pagination: { page: 1, limit: 100 },
      }),
    enabled: !!phaseId && enabled,
    staleTime: 1000 * 60,
  });
}

export function useGroupParticipants(groupId: string, enabled = true) {
  return useQuery({
    queryKey: groupKeys.participants(groupId),
    queryFn: () =>
      getPhaseGroupParticipants({
        filters: { groupId },
        pagination: { page: 1, limit: 200 },
      }),
    enabled: !!groupId && enabled,
    staleTime: 1000 * 60,
  });
}

// ============================================================================
// MANAGER HOOK
// ============================================================================

/**
 * useGroupManager — gestion complète des groupes d'une phase
 * ⚠️ RÈGLE : les participants = editionRegistrations, jamais tournamentMembers directement
 */
export function useGroupManager(phaseId: string) {
  const queryClient = useQueryClient();

  const invalidate = (groupId?: string) => {
    queryClient.invalidateQueries({ queryKey: groupKeys.list(phaseId) });
    if (groupId) {
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(groupId) });
      queryClient.invalidateQueries({
        queryKey: groupKeys.participants(groupId),
      });
    }
    queryClient.invalidateQueries({
      queryKey: ["tournament-editions", "detail"],
    });
  };

  // ---- CREATE GROUP ----
  const createGroup = useMutation({
    mutationFn: async (data: Omit<NewPhaseGroup, "phaseId" | "order">) => {
      const existing = await getPhaseGroups({
        filters: { phaseId },
        options: { sortBy: "order", sortOrder: "desc" },
        pagination: { page: 1, limit: 1 },
      });
      const nextOrder = (existing.data[0]?.order ?? 0) + 1;
      return createPhaseGroup({ ...data, phaseId, order: nextOrder });
    },
    onSuccess: () => {
      toast.success("Groupe créé");
      invalidate();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erreur lors de la création du groupe");
    },
  });

  // ---- UPDATE GROUP ----
  const updateGroup = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<NewPhaseGroup> }) =>
      updatePhaseGroup(id, data),
    onSuccess: (_, { id }) => {
      toast.success("Groupe mis à jour");
      invalidate(id);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erreur lors de la mise à jour");
    },
  });

  // ---- DELETE GROUP ----
  const deleteGroup = useMutation({
    mutationFn: (id: string) => deletePhaseGroup(id),
    onSuccess: () => {
      toast.success("Groupe supprimé");
      invalidate();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erreur lors de la suppression");
    },
  });

  // ---- ASSIGN PARTICIPANT (depuis editionRegistrations) ----
  const assignParticipant = useMutation({
    mutationFn: (data: NewPhaseGroupParticipant) =>
      createPhaseGroupParticipant(data),
    onSuccess: (_, vars) => {
      toast.success("Participant ajouté au groupe");
      invalidate(vars.groupId);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erreur lors de l'ajout du participant");
    },
  });

  // ---- REMOVE PARTICIPANT ----
  const removeParticipant = useMutation({
    mutationFn: ({
      participantId,
      groupId,
    }: {
      participantId: string;
      groupId: string;
    }) => deletePhaseGroupParticipant(participantId),
    onSuccess: (_, { groupId }) => {
      toast.success("Participant retiré du groupe");
      invalidate(groupId);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Impossible de retirer le participant");
    },
  });

  // ---- BULK ASSIGN PARTICIPANTS ----
  const bulkAssignParticipants = useMutation({
    mutationFn: async ({
      groupId,
      registrationIds,
    }: {
      groupId: string;
      registrationIds: string[];
    }) => {
      return Promise.all(
        registrationIds.map((registrationId) =>
          createPhaseGroupParticipant({ groupId, registrationId })
        )
      );
    },
    onSuccess: (_, { groupId }) => {
      toast.success("Participants assignés");
      invalidate(groupId);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erreur lors de l'assignation");
    },
  });

  // ---- GENERATE GROUPS AUTO ----
  /**
   * Génère automatiquement des groupes depuis les registrations de l'édition.
   * SOURCE : editionRegistrations (jamais tournamentMembers directement)
   */
  const generateGroupsAuto = useMutation({
    mutationFn: async ({
      editionId,
      config,
    }: {
      editionId: string;
      config: {
        groupCount?: number;
        playersPerGroup?: number;
        generateMatches?: boolean;
        namingPrefix?: string;
      };
    }) => {
      // 1. Récupérer les registrations de l'édition (source of truth)
      const registrations = await getEditionRegistrations({
        filters: { editionId },
        pagination: { page: 1, limit: 500 },
      });

      if (registrations.data.length === 0) {
        throw new Error(
          "Aucun participant inscrit à l'édition pour générer des groupes"
        );
      }

      // 2. Mapper vers le format Participant
      const participants = registrations.data.map((reg: any) => ({
        id: reg.id,
        name:
          reg.member?.displayName ||
          reg.member?.user?.username ||
          `Participant_${reg.id.slice(0, 4)}`,
        status: "ACTIVE" as const,
      }));

      // 3. Générer les groupes logiques
      const logicalGroups = generateGroups(participants, {
        groupCount: config.groupCount,
        playersPerGroup: config.playersPerGroup,
        generateMatches: false, // Matches = géré via useMatchManager
      });

      // 4. Récupérer l'ordre actuel pour le calcul de nextOrder
      const existing = await getPhaseGroups({
        filters: { phaseId },
        options: { sortBy: "order", sortOrder: "desc" },
        pagination: { page: 1, limit: 1 },
      });
      const startOrder = (existing.data[0]?.order ?? 0) + 1;
      const prefix = config.namingPrefix || "Groupe";

      // 5. Créer les groupes en DB
      const createdGroups = await Promise.all(
        logicalGroups.map((g, i) =>
          createPhaseGroup({
            phaseId,
            name: `${prefix} ${String.fromCharCode(65 + i)}`,
            order: startOrder + i,
            groupType: "STANDARD",
            isCompleted: false,
            isLocked: false,
            isDeleted: false,
          })
        )
      );

      // 6. Assigner les participants aux groupes créés
      await Promise.all(
        logicalGroups.map((logicGroup, i) => {
          const createdGroup = createdGroups[i];
          if (!createdGroup) return;
          return Promise.all(
            logicGroup.participants.map((p) =>
              createPhaseGroupParticipant({
                groupId: createdGroup.id,
                registrationId: p.id,
              })
            )
          );
        })
      );

      return createdGroups;
    },
    onSuccess: (result) => {
      toast.success(`${result.length} groupe(s) générés automatiquement`);
      invalidate();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erreur lors de la génération des groupes");
    },
  });

  // ---- SEED HELPERS ----
  const seedParticipantsRandom = async ({
    groupId,
    editionId,
    count,
  }: {
    groupId: string;
    editionId: string;
    count: number;
  }) => {
    const registrations = await getEditionRegistrations({
      filters: { editionId },
      pagination: { page: 1, limit: 500 },
    });
    // Filter out already assigned
    const existing = await getPhaseGroupParticipants({
      filters: { groupId },
      pagination: { page: 1, limit: 500 },
    });
    const assignedIds = new Set(
      existing.data.map((p: PhaseGroupParticipant) => p.registrationId)
    );
    const available = registrations.data.filter(
      (r: any) => !assignedIds.has(r.id)
    );
    const shuffled = [...available].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, count);

    await bulkAssignParticipants.mutateAsync({
      groupId,
      registrationIds: selected.map((r: any) => r.id),
    });
  };

  const seedParticipantsManual = async ({
    groupId,
    registrationIds,
  }: {
    groupId: string;
    registrationIds: string[];
  }) => {
    await bulkAssignParticipants.mutateAsync({ groupId, registrationIds });
  };

  return {
    // Mutations
    createGroup,
    updateGroup,
    deleteGroup,
    assignParticipant,
    removeParticipant,
    bulkAssignParticipants,
    generateGroupsAuto,
    // Helpers
    seedParticipantsRandom,
    seedParticipantsManual,
    // State helpers
    isLoading:
      createGroup.isPending ||
      updateGroup.isPending ||
      deleteGroup.isPending ||
      assignParticipant.isPending ||
      removeParticipant.isPending ||
      generateGroupsAuto.isPending,
  };
}
