import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createInteraction,
  deleteInteraction,
  deleteInteractionByCriteria,
  restoreInteraction,
  toggleInteraction,
  getInteractionById,
  getInteractions,
  getUserInteractions,
  getEntityInteractions,
  countEntityInteractions,
  getInteractionStats,
  checkInteractionExists,
  getEntityInteractionsWithRelations,
//   type Interaction,
//   type NewInteraction,
//   type InteractionFilters,
//   type ListQuery,
//   type PaginationResponse,
} from '@/actions/interactions';
import { toast } from 'sonner';
import { InteractionFilters, ListQuery, PaginationResponse } from '@/types/api';
import { Interaction, InteractionWithRelations } from '@/database/schema';
import { QueryOptions } from '@/types/api';


// ============================================================================
// HOOKS LECTURE (QUERIES)
// ============================================================================

const QUERY_KEYS = {
  interaction: (id: string) => ['interaction', id],
  interactions: (filters?: InteractionFilters) => ['interactions', filters],
  userInteractions: (userId: string, filters?: InteractionFilters) => ['user-interactions', userId, filters],
  entityInteractions: (entityId: string, entityType: string, filters?: InteractionFilters) => ['entity-interactions', entityId, entityType, filters],
  entityCounts: (entityId: string, entityType: string) => ['entity-counts', entityId, entityType],
  stats: (filters?: InteractionFilters) => ['interaction-stats', filters],
  exists: (userId: string, entityId: string, entityType: string, type: string) => ['interaction-exists', userId, entityId, entityType, type],
} as const;

/** Hook pour récupérer une interaction par ID */
export function useInteraction(id: string, options?: { populate?: string[] }) {
  return useQuery({
    queryKey: QUERY_KEYS.interaction(id),
    queryFn: () => getInteractionById(id, options),
    enabled: !!id,
  });
}

/** Hook pour lister les interactions avec pagination/filtres */
export function useInteractions(query: ListQuery<InteractionFilters> = {}) {
  return useQuery<PaginationResponse<Interaction>>({
    queryKey: QUERY_KEYS.interactions(query.filters),
    queryFn: () => getInteractions(query),
    placeholderData: keepPreviousData => keepPreviousData,
    // keepPreviousData: true,
  });
}

/** Hook pour récupérer les interactions d’un utilisateur */
export function useUserInteractions(userId: string, filters?: InteractionFilters) {
  return useQuery<Interaction[]>({
    queryKey: QUERY_KEYS.userInteractions(userId, filters),
    queryFn: () => getUserInteractions(userId, filters),
    enabled: !!userId,
  });
}

/** Hook pour récupérer les interactions sur une entité */
export function useEntityInteractions(
  entityId: string,
  entityType: string,
  filters?: InteractionFilters
) {
  return useQuery<Interaction[]>({
    queryKey: QUERY_KEYS.entityInteractions(entityId, entityType, filters),
    queryFn: () => getEntityInteractions(entityId, entityType, filters),
    enabled: !!entityId && !!entityType,
  });
}

/** Hook pour récupérer les interactions d’une entité avec relations */
export function useEntityInteractionsWithRelations(
  entityId: string,
  entityType: string,
  filters?: InteractionFilters,
  pagination?: { page: number; limit: number },
  options?: QueryOptions
) {
  return useQuery<InteractionWithRelations[]>({
    queryKey: [...QUERY_KEYS.entityInteractions(entityId, entityType, filters), pagination, options],
    queryFn: async () => {
      const res = await getEntityInteractionsWithRelations(entityId, entityType, filters, pagination, options);
      return res.data;
    },
    enabled: !!entityId && !!entityType,
  });
}


/** Hook pour obtenir les compteurs d’interactions d’une entité */
export function useEntityInteractionCounts(entityId: string, entityType: string) {
  return useQuery<Record<string, number>>({
    queryKey: QUERY_KEYS.entityCounts(entityId, entityType),
    queryFn: () => countEntityInteractions(entityId, entityType),
    enabled: !!entityId && !!entityType,
  });
}

/** Hook pour récupérer les statistiques globales */
export function useInteractionStats(filters?: InteractionFilters) {
  return useQuery({
    queryKey: QUERY_KEYS.stats(filters),
    queryFn: () => getInteractionStats(filters),
  });
}

/** Hook pour vérifier si une interaction existe */
export function useInteractionExists(
  userId: string,
  entityId: string,
  entityType: string,
  type: string
) {
  return useQuery<boolean>({
    queryKey: QUERY_KEYS.exists(userId, entityId, entityType, type),
    queryFn: () => checkInteractionExists(userId, entityId, entityType, type),
    enabled: !!userId && !!entityId && !!entityType && !!type,
  });
}

// ============================================================================
// HOOKS ÉCRITURE (MUTATIONS)
// ============================================================================

/** Hook pour créer une interaction */
export function useCreateInteraction() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: createInteraction,
    onSuccess: (interaction) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.interactions() });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.userInteractions(interaction.userId) });
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.entityInteractions(interaction.entityId, interaction.entityType),
      });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.entityCounts(interaction.entityId, interaction.entityType) });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.stats() });
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.exists(interaction.userId, interaction.entityId, interaction.entityType, interaction.type),
      });
      toast.success('Interaction créée');
    },
    onError: () => toast.error("Erreur lors de la création de l'interaction"),
  });
}

/** Hook pour supprimer une interaction */
export function useDeleteInteraction() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: deleteInteraction,
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.interactions() });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.interaction(id) });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.stats() });
      toast.success('Interaction supprimée');
    },
    onError: () => toast.error("Erreur lors de la suppression de l'interaction"),
  });
}

/** Hook pour supprimer une interaction par critères */
export function useDeleteInteractionByCriteria() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, entityId, entityType, type }: { userId: string; entityId: string; entityType: string; type: string }) =>
      deleteInteractionByCriteria(userId, entityId, entityType, type),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.interactions() });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.userInteractions(vars.userId) });
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.entityInteractions(vars.entityId, vars.entityType),
      });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.entityCounts(vars.entityId, vars.entityType) });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.stats() });
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.exists(vars.userId, vars.entityId, vars.entityType, vars.type),
      });
      toast.success('Interaction supprimée');
    },
    onError: () => toast.error("Erreur lors de la suppression de l'interaction"),
  });
}

/** Hook pour restaurer une interaction */
export function useRestoreInteraction() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: restoreInteraction,
    onSuccess: (interaction) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.interactions() });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.interaction(interaction.id) });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.stats() });
      toast.success('Interaction restaurée');
    },
    onError: () => toast.error("Erreur lors de la restauration de l'interaction"),
  });
}

/** Hook pour basculer (toggle) une interaction */
export function useToggleInteraction() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: toggleInteraction,
    onSuccess: ({ interaction, action }) => {
      if (!interaction) return;
      qc.invalidateQueries({ queryKey: QUERY_KEYS.interactions() });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.userInteractions(interaction.userId) });
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.entityInteractions(interaction.entityId, interaction.entityType),
      });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.entityCounts(interaction.entityId, interaction.entityType) });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.stats() });
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.exists(interaction.userId, interaction.entityId, interaction.entityType, interaction.type),
      });
      toast.success(action === 'created' ? 'Interaction ajoutée' : 'Interaction retirée');
    },
    onError: () => toast.error("Erreur lors du basculement de l'interaction"),
  });
}
