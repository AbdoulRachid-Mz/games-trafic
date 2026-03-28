import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { generatePhaseMatches as generateMatchesAction, getMatches } from "@/actions/phases";

export function useMatchManager(phaseId: string) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["matches", phaseId] });
    queryClient.invalidateQueries({ queryKey: ["tournament-editions", "detail"] }); // Refresh everything
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
 * Hook pour récupérer les matchs par phase
 */
export function useMatchesByPhase(editionId: string, phaseId: string) {
  return useQuery({
    queryKey: ["matches", "phase", phaseId],
    queryFn: async () => {
      const response = await getMatches({
        filters: { editionId, phaseId },
        pagination: { limit: 100, page: 1 }
      });
      return response.data;
    },
    enabled: !!phaseId && !!editionId,
  });
}

/**
 * Hook pour récupérer les matchs par groupe
 */
export function useMatchesByGroup(editionId: string, groupId: string) {
  return useQuery({
    queryKey: ["matches", "group", groupId],
    queryFn: async () => {
      const response = await getMatches({
        filters: { editionId, groupId },
        pagination: { limit: 100, page: 1 }
      });
      return response.data;
    },
    enabled: !!groupId && !!editionId,
  });
}
