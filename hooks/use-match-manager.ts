import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  generatePhaseMatches as generateMatchesAction,
  getMatchesWithParticipants,
  getEditionMatchStats,
  getPhaseGroupParticipants,
  getMatches,
} from "@/actions/phases";
import type { MatchFilters, ListQuery } from "@/types/api";

export const matchManagerKeys = {
  all: ["matches"] as const,
  list: (filters: MatchFilters) =>
    [...matchManagerKeys.all, "list", filters] as const,
  stats: (editionId: string) =>
    [...matchManagerKeys.all, "stats", editionId] as const,
};

/**
 * useMatchManager — Orchestrateur des matchs
 */
export function useMatchManager(phaseId?: string) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: matchManagerKeys.all });
    queryClient.invalidateQueries({
      queryKey: ["tournament-editions", "detail"],
    });
  };

  const generatePhaseMatches = useMutation({
    mutationFn: async ({
      phaseId,
      config,
    }: {
      phaseId: string;
      config?: { forceRecreate?: boolean; groupId?: string };
    }) => {
      return generateMatchesAction(phaseId, config);
    },
    onSuccess: () => {
      toast.success("Matchs générés avec succès.");
      invalidate();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erreur lors de la génération des matchs.");
    },
  });

  return {
    generatePhaseMatches,
  };
}

/**
 * useMatchList — Récupération paginée et filtrée des matchs
 * Supporte "Mes Matchs", par phase, par groupe, etc.
 */
export function useMatchList(query: ListQuery<MatchFilters>) {
  return useQuery({
    queryKey: matchManagerKeys.list(query.filters || {}),
    queryFn: () => getMatchesWithParticipants(query),
    staleTime: 1000 * 60, // 1 minute
  });
}

/**
 * Hook pour les stats d'une édition
 */
export function useEditionMatchStats(editionId: string) {
  return useQuery({
    queryKey: matchManagerKeys.stats(editionId),
    queryFn: () => getEditionMatchStats(editionId),
    enabled: !!editionId,
  });
}

/**
 * @deprecated Use useMatchList instead
 */
export function useMatchesByPhase(editionId: string, phaseId: string) {
  return useMatchList({
    filters: { editionId, phaseId },
    pagination: { limit: 100, page: 1 },
  });
}

/**
 * @deprecated Use useMatchList instead
 */
export function useMatchesByGroup(editionId: string, groupId: string) {
  return useMatchList({
    filters: { editionId, groupId },
    pagination: { limit: 100, page: 1 },
  });
}

export function useMyMatches(editionId: string, userId: string) {
  return useQuery({
    queryKey: ["my-matches", editionId, userId],
    queryFn: async () => {
      const allMatches = await getMatchesWithParticipants({
        filters: { editionId },
        pagination: { page: 1, limit: 100 },
      });

      // Filtrer les matches où l'utilisateur est participant
      const myMatches = allMatches.data.filter((match: any) => {
        const p1UserId = match.participant1?.member?.userId;
        const p2UserId = match.participant2?.member?.userId;
        return p1UserId === userId || p2UserId === userId;
      });

      const otherMatches = allMatches.data.filter((match: any) => {
        const p1UserId = match.participant1?.member?.userId;
        const p2UserId = match.participant2?.member?.userId;
        return p1UserId !== userId && p2UserId !== userId;
      });

      return { myMatches, otherMatches, total: allMatches.pagination.total };
    },
    enabled: !!editionId && !!userId,
  });
}

interface GenerationValidationResult {
  canGenerate: boolean;
  reason?: string;
  expectedMatches: number;
  currentMatches: number;
  participantsCount: number;
}

export function useMatchGenerationValidation(
  groupId: string,
  maxMatches: number = 100,
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: ["match-generation-validation", groupId],
    queryFn: async (): Promise<GenerationValidationResult> => {
      const [participantsRes, matchesRes] = await Promise.all([
        getPhaseGroupParticipants({
          filters: { groupId },
          pagination: { page: 1, limit: 500 },
        }),
        getMatches({
          filters: { groupId },
          pagination: { page: 1, limit: 1000 },
        }),
      ]);

      const participants = participantsRes.data;
      const currentMatches = matchesRes.data.length;
      const participantsCount = participants.length;

      // Calcul pour round-robin simple
      const expectedMatches = (participantsCount * (participantsCount - 1)) / 2;

      if (participantsCount < 2) {
        return {
          canGenerate: false,
          reason: `Minimum 2 participants requis (${participantsCount} actuellement)`,
          expectedMatches,
          currentMatches,
          participantsCount,
        };
      }

      if (currentMatches + expectedMatches > maxMatches) {
        return {
          canGenerate: false,
          reason: `Limite de ${maxMatches} matchs dépassée (${currentMatches} existants, besoin de ${expectedMatches})`,
          expectedMatches,
          currentMatches,
          participantsCount,
        };
      }

      return {
        canGenerate: true,
        expectedMatches,
        currentMatches,
        participantsCount,
      };
    },
    enabled: !!groupId && enabled,
    staleTime: 1000 * 30,
  });
}
