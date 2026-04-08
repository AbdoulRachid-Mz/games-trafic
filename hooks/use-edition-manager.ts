// @/hooks/use-edition-manager.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getEditionMatchStats } from "@/actions/phases";
import {
  exportEditionParticipants,
  exportEditionMatches,
} from "@/actions/editions";
import { updateEdition } from "@/actions/editions";
import type { NewTournamentEdition } from "@/database/schema";

// ============================================================================
// QUERY KEYS
// ============================================================================
export const editionManagerKeys = {
  all: ["edition-manager"] as const,
  stats: (editionId: string) =>
    [...editionManagerKeys.all, "stats", editionId] as const,
};

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Stats rapides des matchs d'une édition :
 * total, terminés, en cours, en attente
 */
export function useEditionMatchStats(editionId: string, enabled = true) {
  return useQuery({
    queryKey: editionManagerKeys.stats(editionId),
    queryFn: () => getEditionMatchStats(editionId),
    enabled: !!editionId && enabled,
    staleTime: 1000 * 30,
  });
}

// ============================================================================
// MANAGER HOOK
// ============================================================================

/**
 * useEditionManager — orchestrateur central de l'édition
 * Expose : finishEdition, exportParticipants, exportMatches
 */
export function useEditionManager(editionId: string, tournamentId?: string) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({
      queryKey: editionManagerKeys.stats(editionId),
    });
    queryClient.invalidateQueries({
      queryKey: ["tournament-editions", "detail"],
    });
    queryClient.invalidateQueries({ queryKey: ["editions"] });
  };

  // ---- FINISH EDITION ----
  const finishEdition = useMutation({
    mutationFn: async () => {
      return updateEdition(editionId, {
        status: "COMPLETED",
        endDate: new Date(),
      } as Partial<NewTournamentEdition>);
    },
    onSuccess: () => {
      toast.success("Édition terminée et verrouillée ✓");
      invalidate();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erreur lors de la clôture de l'édition");
    },
  });

  // ---- EXPORT PARTICIPANTS ----
  const exportParticipants = useMutation({
    mutationFn: async (format: "csv" | "json" | "pdf") => {
      const result = await exportEditionParticipants(editionId, format);
      if (!result.success || !result.data) {
        throw new Error(result.error || "Erreur lors de l'export");
      }

      // Déclencher le téléchargement côté client
      const blob = await (await fetch(result.data)).blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", result.filename || `export_participants.${format}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      return result;
    },
    onSuccess: (_, format) => {
      toast.success(`Export participants (${format.toUpperCase()}) téléchargé`);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erreur lors de l'export des participants");
    },
  });

  // ---- EXPORT MATCHES ----
  const exportMatches = useMutation({
    mutationFn: async (format: "csv" | "json" | "pdf") => {
      const result = await exportEditionMatches(editionId, format);
      if (!result.success || !result.data) {
        throw new Error(result.error || "Erreur lors de l'export");
      }

      // Déclencher le téléchargement côté client
      const blob = await (await fetch(result.data)).blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", result.filename || `export_matchs.${format}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      return result;
    },
    onSuccess: (_, format) => {
      toast.success(`Export matchs (${format.toUpperCase()}) téléchargé`);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erreur lors de l'export des matchs");
    },
  });

  return {
    // Mutations
    finishEdition,
    exportParticipants,
    exportMatches,
    // State helpers
    isLoading:
      finishEdition.isPending ||
      exportParticipants.isPending ||
      exportMatches.isPending,
  };
}
