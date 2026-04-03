import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { 
  generatePhaseMatches as generateMatchesAction, 
  getMatchesWithParticipants,
  getEditionMatchStats
} from "@/actions/phases";
import type { MatchFilters, ListQuery } from "@/types/api";

export const matchManagerKeys = {
  all: ["matches"] as const,
  list: (filters: MatchFilters) => [...matchManagerKeys.all, "list", filters] as const,
  stats: (editionId: string) => [...matchManagerKeys.all, "stats", editionId] as const,
};

/**
 * useMatchManager — Orchestrateur des matchs
 */
export function useMatchManager(phaseId?: string) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: matchManagerKeys.all });
    queryClient.invalidateQueries({ queryKey: ["tournament-editions", "detail"] });
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
    pagination: { limit: 100, page: 1 }
  });
}

/**
 * @deprecated Use useMatchList instead
 */
export function useMatchesByGroup(editionId: string, groupId: string) {
  return useMatchList({
    filters: { editionId, groupId },
    pagination: { limit: 100, page: 1 }
  });
}
