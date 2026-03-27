// @/hooks/use-match-manager.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMatches,
  getMatchById,
  createMatch,
  updateMatch,
  deleteMatch,
} from "@/actions/phases";
import {
  submitMatchResult,
  confirmMatchResult,
  adminConfirmMatchResult,
} from "@/actions/tournaments";
import type { Match, NewMatch } from "@/database/schema";
import { checkDuplicateMatch } from "@/lib/tournaments/match.generator";
import { toast } from "sonner";

// ============================================================================
// QUERY KEYS
// ============================================================================
export const matchKeys = {
  all: ["matches"] as const,
  lists: () => [...matchKeys.all, "list"] as const,
  listByPhase: (phaseId: string) =>
    [...matchKeys.lists(), "phase", phaseId] as const,
  listByGroup: (groupId: string) =>
    [...matchKeys.lists(), "group", groupId] as const,
  listByEdition: (editionId: string) =>
    [...matchKeys.lists(), "edition", editionId] as const,
  details: () => [...matchKeys.all, "detail"] as const,
  detail: (id: string) => [...matchKeys.details(), id] as const,
};

// ============================================================================
// QUERIES
// ============================================================================

export function useMatchesByPhase(phaseId: string, enabled = true) {
  return useQuery({
    queryKey: matchKeys.listByPhase(phaseId),
    queryFn: () =>
      getMatches({
        filters: { phaseId },
        options: { populate: ["participant1", "participant2", "winner"] },
        pagination: { page: 1, limit: 500 },
      }),
    enabled: !!phaseId && enabled,
    staleTime: 1000 * 30,
  });
}

export function useMatchesByGroup(groupId: string, enabled = true) {
  return useQuery({
    queryKey: matchKeys.listByGroup(groupId),
    queryFn: () =>
      getMatches({
        filters: { groupId },
        options: { populate: ["participant1", "participant2", "winner"] },
        pagination: { page: 1, limit: 500 },
      }),
    enabled: !!groupId && enabled,
    staleTime: 1000 * 30,
  });
}

export function useMatchesByEdition(editionId: string, enabled = true) {
  return useQuery({
    queryKey: matchKeys.listByEdition(editionId),
    queryFn: () =>
      getMatches({
        filters: { editionId },
        options: { populate: ["participant1", "participant2", "winner"] },
        pagination: { page: 1, limit: 500 },
      }),
    enabled: !!editionId && enabled,
    staleTime: 1000 * 30,
  });
}

export function useMatchById(
  id: string,
  populate?: string[],
  enabled = true
) {
  return useQuery({
    queryKey: matchKeys.detail(id),
    queryFn: () => getMatchById(id, { populate }),
    enabled: !!id && enabled,
    staleTime: 1000 * 30,
  });
}

// ============================================================================
// MANAGER HOOK
// ============================================================================

interface MatchContext {
  editionId: string;
  phaseId: string;
  groupId?: string;
  bracketNodeId?: string;
}

/**
 * useMatchManager — gestion complète des matches
 * ⚠️ CRITICAL: vérifie les doublons avant création (non bloquant — warning UI)
 */
export function useMatchManager(context: MatchContext) {
  const { editionId, phaseId, groupId, bracketNodeId } = context;
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: matchKeys.listByPhase(phaseId) });
    if (groupId) {
      queryClient.invalidateQueries({
        queryKey: matchKeys.listByGroup(groupId),
      });
    }
    queryClient.invalidateQueries({
      queryKey: matchKeys.listByEdition(editionId),
    });
    queryClient.invalidateQueries({
      queryKey: ["tournament-editions", "detail"],
    });
    queryClient.invalidateQueries({ queryKey: ["phase-groups"] });
  };

  // ---- CREATE MATCH ----
  const create = useMutation({
    mutationFn: async (
      data: Omit<NewMatch, "editionId" | "phaseId"> & {
        /** Set to true to skip duplicate warning */
        forceDuplicate?: boolean;
      }
    ) => {
      const { forceDuplicate, ...matchData } = data;

      // ⚠️ Check for duplicates (non-bloquant — just a warning)
      if (
        matchData.participant1RegistrationId &&
        matchData.participant2RegistrationId &&
        !forceDuplicate
      ) {
        // Fetch existing matches in this context
        const existing = await getMatches({
          filters: groupId ? { groupId } : { phaseId },
          pagination: { page: 1, limit: 500 },
        });
        const isDuplicate = checkDuplicateMatch(
          existing.data,
          matchData.participant1RegistrationId,
          matchData.participant2RegistrationId
        );
        if (isDuplicate) {
          // Non-bloquant: émettre un warning
          toast.warning(
            "⚠️ Attention : un match entre ces deux participants existe déjà. Le match a tout de même été créé."
          );
        }
      }

      return createMatch({
        ...matchData,
        editionId,
        phaseId,
        groupId: groupId || null,
        bracketNodeId: bracketNodeId || null,
      });
    },
    onSuccess: () => {
      invalidate();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erreur lors de la création du match");
    },
  });

  // ---- UPDATE MATCH ----
  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<NewMatch> }) =>
      updateMatch(id, data),
    onSuccess: () => {
      invalidate();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erreur lors de la mise à jour du match");
    },
  });

  // ---- DELETE MATCH ----
  const remove = useMutation({
    mutationFn: (id: string) => deleteMatch(id),
    onSuccess: () => {
      toast.success("Match supprimé");
      invalidate();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erreur lors de la suppression du match");
    },
  });

  // ---- BULK CREATE MATCHES ----
  const bulkCreate = useMutation({
    mutationFn: async (
      matchDataList: Array<Omit<NewMatch, "editionId" | "phaseId">>
    ) => {
      // Check all existing matches first
      const existing = await getMatches({
        filters: groupId ? { groupId } : { phaseId },
        pagination: { page: 1, limit: 500 },
      });

      let duplicatesFound = 0;
      const results: Match[] = [];

      for (const matchData of matchDataList) {
        if (
          matchData.participant1RegistrationId &&
          matchData.participant2RegistrationId
        ) {
          const isDuplicate = checkDuplicateMatch(
            [...existing.data, ...results],
            matchData.participant1RegistrationId,
            matchData.participant2RegistrationId
          );
          if (isDuplicate) {
            duplicatesFound++;
            continue; // Skip duplicate en bulk (contrairement au single)
          }
        }

        const created = await createMatch({
          ...matchData,
          editionId,
          phaseId,
          groupId: groupId || null,
          bracketNodeId: bracketNodeId || null,
        });
        results.push(created);
      }

      if (duplicatesFound > 0) {
        toast.warning(
          `${duplicatesFound} match(s) ignoré(s) car déjà existants`
        );
      }

      return results;
    },
    onSuccess: (results) => {
      toast.success(`${results.length} match(s) créé(s)`);
      invalidate();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erreur lors de la création des matches");
    },
  });

  // ---- BULK DELETE MATCHES ----
  const bulkDelete = useMutation({
    mutationFn: async (ids: string[]) => {
      return Promise.all(ids.map((id) => deleteMatch(id)));
    },
    onSuccess: (_, ids) => {
      toast.success(`${ids.length} match(s) supprimé(s)`);
      invalidate();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erreur lors de la suppression des matches");
    },
  });

  // ---- SUBMIT RESULT ----
  const submitResult = useMutation({
    mutationFn: ({
      matchId,
      score1,
      score2,
      userId,
      proofUrl,
    }: {
      matchId: string;
      score1: number;
      score2: number;
      userId: string;
      proofUrl?: string;
    }) => submitMatchResult(matchId, score1, score2, userId, proofUrl),
    onSuccess: () => {
      toast.success("Résultat soumis — en attente de confirmation");
      invalidate();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erreur lors de la soumission du résultat");
    },
  });

  // ---- CONFIRM RESULT ----
  const confirmResult = useMutation({
    mutationFn: ({
      matchId,
      registrationId,
    }: {
      matchId: string;
      registrationId: string;
    }) => confirmMatchResult(matchId, registrationId),
    onSuccess: () => {
      toast.success("Résultat confirmé");
      invalidate();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erreur lors de la confirmation");
    },
  });

  // ---- ADMIN CONFIRM ----
  const adminConfirm = useMutation({
    mutationFn: ({
      matchId,
      score1,
      score2,
    }: {
      matchId: string;
      score1?: number;
      score2?: number;
    }) => adminConfirmMatchResult(matchId, score1, score2),
    onSuccess: () => {
      toast.success("Résultat validé par l'administrateur");
      invalidate();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erreur lors de la validation admin");
    },
  });

  return {
    // CRUD
    create,
    update,
    remove,
    // Bulk
    bulkCreate,
    bulkDelete,
    // Result flow
    submitResult,
    confirmResult,
    adminConfirm,
    // State
    isLoading:
      create.isPending ||
      update.isPending ||
      remove.isPending ||
      bulkCreate.isPending ||
      bulkDelete.isPending,
  };
}
