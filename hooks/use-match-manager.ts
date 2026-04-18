import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  generateMatchesAction,
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

  const generateMatches = useMutation({
    mutationFn: async ({
      type,
      id,
      options = {},
    }: {
      type: "PHASE" | "GROUP" | "NODE";
      id: string;
      options?: any;
    }) => {
      return generateMatchesAction(type, id, options);
    },
    onSuccess: (res) => {
      if (res.success) {
        toast.success("Matchs générés avec succès.");
        invalidate();
      } else {
        toast.error(res.error || "Erreur lors de la génération des matchs.");
      }
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erreur lors de la génération des matchs.");
    },
  });

  return {
    generateMatches,
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
  // 1. Get user registration first
  const { data: userReg } = useQuery({
    queryKey: ["edition-registration", editionId, userId],
    queryFn: async () => {
      const { getEditionRegistrations } = await import("@/actions/tournaments");
      const res = await getEditionRegistrations({
        filters: { editionId },
        pagination: { page: 1, limit: 1000 },
      });
      return res.data.find((r: any) => r.member?.userId === userId) || null;
    },
    enabled: !!editionId && !!userId,
  });

  // 2. Fetch matches using the registration ID filter
  return useQuery({
    queryKey: ["my-matches", editionId, userId, userReg?.id],
    queryFn: async () => {
      if (!userReg) return { myMatches: [], otherMatches: [], total: 0 };

      const [myMatchesRes, allMatchesRes] = await Promise.all([
        getMatchesWithParticipants({
          filters: { editionId, memberRegistrationId: userReg.id },
          pagination: { page: 1, limit: 50 },
        }),
        getMatchesWithParticipants({
          filters: { editionId },
          pagination: { page: 1, limit: 50 },
        })
      ]);

      const myMatchIds = new Set(myMatchesRes.data.map((m: any) => m.id));
      const otherMatches = allMatchesRes.data.filter((m: any) => !myMatchIds.has(m.id));

      return { 
        myMatches: myMatchesRes.data, 
        otherMatches, 
        total: allMatchesRes.pagination.total 
      };
    },
    enabled: !!editionId && !!userId && !!userReg,
    staleTime: 1000 * 60,
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
