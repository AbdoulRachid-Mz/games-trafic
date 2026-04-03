import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTournamentEditions,
  getTournamentEditionById,
  createTournamentEdition,
  updateTournamentEdition,
  deleteTournamentEdition,
  getEditionRegistrations,
  createEditionRegistration,
  updateEditionRegistration,
  getTournamentPhases,
  addPhaseGroupParticipant,
  createTournamentPhase,
  createPhaseGroup,
  updatePhaseGroupParticipant,
  updateMatchResult,
  getBracketNodes,
  getMatches,
} from "@/actions/tournaments";
import {
  getTournamentEditionWithRelations,
  joinEdition,
  updateEdition,
  deleteEdition,
} from "@/actions/editions";
import {
  type TournamentEdition,
  type NewTournamentEdition,
  type EditionRegistration,
  type NewEditionRegistration,
  type TournamentPhase,
  type NewTournamentPhase,
  type PhaseGroup,
  type NewPhaseGroup,
  type PhaseGroupParticipant,
  type NewPhaseGroupParticipant,
  type Match,
} from "@/database/schema";
import {
  type ListQuery,
  type TournamentEditionFilters,
  type EditionRegistrationFilters,
  type TournamentPhaseFilters,
  type BracketNodeFilters,
  type MatchFilters,
} from "@/types/api";

import { toast } from "sonner";

export const EDITION_KEYS = {
  all: ["editions"] as const,
  lists: () => [...EDITION_KEYS.all, "list"] as const,
  list: (query: ListQuery<TournamentEditionFilters>) =>
    [...EDITION_KEYS.lists(), query] as const,
  details: () => [...EDITION_KEYS.all, "detail"] as const,
  detail: (id: string) => [...EDITION_KEYS.details(), id] as const,
  registrations: (editionId: string) =>
    [...EDITION_KEYS.detail(editionId), "registrations"] as const,
  phases: (editionId: string) =>
    [...EDITION_KEYS.detail(editionId), "phases"] as const,
};

export function useEditions(query: ListQuery<TournamentEditionFilters> = {}) {
  return useQuery({
    queryKey: EDITION_KEYS.list(query),
    queryFn: () => getTournamentEditions(query),
  });
}

export function useEdition(id: string) {
  return useQuery({
    queryKey: [...EDITION_KEYS.detail(id)],
    queryFn: () => getTournamentEditionWithRelations(id),
    enabled: !!id,
  });
}

export function useCreateEdition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: NewTournamentEdition) => createTournamentEdition(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EDITION_KEYS.lists() });
      toast.success("Édition créée avec succès");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useUpdateEdition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      updateEdition(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: EDITION_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: EDITION_KEYS.lists() });
    },
  });
}

export function useDeleteEdition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteEdition(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EDITION_KEYS.lists() });
    },
  });
}

// Dans useJoinEdition, assurez-vous de gérer les cas où l'utilisateur n'est pas membre
// Dans useJoinEdition, assurez-vous de gérer les cas où l'utilisateur n'est pas membre
export function useJoinEdition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      editionId,
      userId,
      userInfo,
    }: {
      editionId: string;
      userId: string;
      userInfo: { username: string; image?: string | null };
    }) => {
      try {
        const response = await joinEdition(editionId, userId, userInfo);
        return response;
      } catch (error: any) {
        throw new Error(error.message || "Erreur lors de l'inscription");
      }
    },
    onSuccess: (data, { editionId }) => {
      // If payment is required, we don't invalidate or show success toast yet
      // The component will handle opening the payment dialog
      if (data.paymentRequired) {
        return;
      }
      
      if (data.success) {
        queryClient.invalidateQueries({
          queryKey: EDITION_KEYS.detail(editionId),
        });
        queryClient.invalidateQueries({
          queryKey: EDITION_KEYS.registrations(editionId),
        });
        toast.success("Inscription réussie !");
      }
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

// Registrations
export function useEditionRegistrations(
  filters: EditionRegistrationFilters = {},
  options: any = {}
) {
  return useQuery({
    queryKey: ["edition-registrations", filters],
    queryFn: () =>
      getEditionRegistrations({
        filters,
        pagination: { page: 1, limit: 100 },
        options,
      }),
  });
}

/**
 * Retrouve la registration d'un utilisateur spécifique pour une édition
 */
export function useUserRegistration(editionId: string, userId?: string) {
  return useQuery({
    queryKey: ["edition-registration", editionId, userId],
    queryFn: async () => {
      if (!userId || !editionId) return null;
      const res = await getEditionRegistrations({
        filters: { editionId },
        pagination: { page: 1, limit: 1000 },
      });
      // On cherche la registration qui correspond à l'utilisateur (via le member)
      return res.data.find((r: any) => r.member?.userId === userId) || null;
    },
    enabled: !!editionId && !!userId,
  });
}

export function useRegisterToEdition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: NewEditionRegistration) =>
      createEditionRegistration(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: EDITION_KEYS.registrations(variables.editionId),
      });
      // Invalidate edition detail to update participant counts if populated
      queryClient.invalidateQueries({
        queryKey: EDITION_KEYS.detail(variables.editionId),
      });
      toast.success("Inscription réussie");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useUpdateRegistration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<NewEditionRegistration>;
    }) => updateEditionRegistration(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: EDITION_KEYS.registrations(data.editionId),
      });
      toast.success("Inscription mise à jour");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

// Phases & Groups
export function useEditionPhases(
  editionId: string,
  query: ListQuery<TournamentPhaseFilters> = {}
) {
  return useQuery({
    queryKey: [...EDITION_KEYS.phases(editionId), query],
    queryFn: () =>
      getTournamentPhases({
        ...query,
        filters: { ...query.filters, editionId },
      }),
    enabled: !!editionId,
  });
}

export function useCreatePhase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: NewTournamentPhase) => createTournamentPhase(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: EDITION_KEYS.phases(variables.editionId),
      });
      toast.success("Phase créée");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

// Bracket Nodes
export function usePhaseBracketNodes(
  phaseId: string,
  query: ListQuery<BracketNodeFilters> = {}
) {
  return useQuery({
    queryKey: ["bracket-nodes", phaseId, query],
    queryFn: () =>
      getBracketNodes({
        ...query,
        filters: { ...query.filters, phaseId },
        options: { sortBy: "order", sortOrder: "asc", ...(query.options || {}) },
      }),
    enabled: !!phaseId,
  });
}

// Matches
export function usePhaseMatches(
  phaseId: string,
  query: ListQuery<MatchFilters> = {}
) {
  return useQuery({
    queryKey: ["matches", phaseId, query],
    queryFn: () =>
      getMatches({
        ...query,
        filters: { ...query.filters, phaseId },
        options: { sortBy: "round", sortOrder: "asc", ...(query.options || {}) },
      }),
    enabled: !!phaseId,
  });
}

// Match Result
export function useUpdateMatchResult() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      score1,
      score2,
      winnerId,
      userId,
    }: {
      id: string;
      score1: number;
      score2: number;
      winnerId: string;
      userId: string;
    }) => updateMatchResult(id, score1, score2, winnerId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EDITION_KEYS.all }); // Invalidate aggressively for brackets to update
      toast.success("Résultat mis à jour");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}
