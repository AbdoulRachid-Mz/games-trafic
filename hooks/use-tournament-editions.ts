// @/hooks/use-tournament-editions.ts
import { getEditionDetailTree, getTournamentEditionById, getTournamentEditions } from '@/actions/tournaments';
import { TournamentEditionWithRelations } from '@/database/schema';
import { ListQuery, TournamentEditionFilters } from '@/types/api';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
// ============================================================================
// QUERY KEYS
// ============================================================================
const EDITION_KEYS: {
    all: readonly ["tournament-editions"];
    lists: () => readonly ["tournament-editions", "list"];
    list: (filters: TournamentEditionFilters) => readonly ["tournament-editions", "list", TournamentEditionFilters];
    details: () => readonly ["tournament-editions", "detail"];
    detail: (id: string) => readonly ["tournament-editions", "detail", string];
    detailTree: (id: string) => readonly ["tournament-editions", "detail", string, "tree"];
} = {
    all: ['tournament-editions'] as const,
    lists: () => [...EDITION_KEYS.all, 'list'] as const,
    list: (filters: TournamentEditionFilters) => [...EDITION_KEYS.lists(), filters] as const,
    details: () => [...EDITION_KEYS.all, 'detail'] as const,
    detail: (id: string) => [...EDITION_KEYS.details(), id] as const,
    detailTree: (id: string) => [...EDITION_KEYS.detail(id), 'tree'] as const,
};

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Hook to fetch a single tournament edition by ID
 */
export function useTournamentEdition(
    id: string | undefined,
    options?: { populate?: string[] },
    queryOpts?: { enabled?: boolean }
) {
    return useQuery({
        queryKey: EDITION_KEYS.detail(id!),
        queryFn: () => getTournamentEditionById(id!, options),
        enabled: !!id && (queryOpts?.enabled !== false),
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 10, // 10 minutes
    });
}

/**
 * Hook to fetch tournament editions with pagination, filters and sorting
 */
export function useTournamentEditions(query: ListQuery<TournamentEditionFilters> = {}) {
    return useInfiniteQuery({
        queryKey: EDITION_KEYS.list(query.filters || {}),
        queryFn: ({ pageParam = 1 }) =>
            getTournamentEditions({
                ...query,
                pagination: {
                    page: pageParam,
                    limit: query.pagination?.limit ?? 20,
                    offset: query.pagination?.offset,
                },
            }),
        getNextPageParam: (lastPage) =>
            lastPage.pagination.hasNext ? lastPage.pagination.page + 1 : undefined,
        getPreviousPageParam: (firstPage) =>
            firstPage.pagination.hasPrev ? firstPage.pagination.page - 1 : undefined,
        initialPageParam: 1,
        staleTime: 1000 * 60 * 3, // 3 minutes
        gcTime: 1000 * 60 * 5, // 5 minutes
    });
}

/**
 * Hook to fetch the full detail tree of an edition (phases, groups, matches, etc.)
 */
export function useEditionDetailTree(
    editionId: string | undefined,
    filters?: Parameters<typeof getEditionDetailTree>[1],
    options?: Parameters<typeof getEditionDetailTree>[2],
    queryOpts?: { enabled?: boolean }
) {
    return useQuery({
        queryKey: EDITION_KEYS.detailTree(editionId!),
        queryFn: () => getEditionDetailTree(editionId!, filters, options),
        enabled: !!editionId && (queryOpts?.enabled !== false),
        staleTime: 1000 * 60 * 2, // 2 minutes
        gcTime: 1000 * 60 * 5, // 5 minutes
    });
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Hook to invalidate edition queries after mutations
 */
export function useInvalidateEditions() {
    const queryClient = useQueryClient();

    return {
        invalidateList: () =>
            queryClient.invalidateQueries({ queryKey: EDITION_KEYS.lists() }),
        invalidateDetail: (id: string) =>
            queryClient.invalidateQueries({ queryKey: EDITION_KEYS.detail(id) }),
        invalidateTree: (id: string) =>
            queryClient.invalidateQueries({ queryKey: EDITION_KEYS.detailTree(id) }),
        invalidateAll: () =>
            queryClient.invalidateQueries({ queryKey: EDITION_KEYS.all }),
    };
}

/**
 * Helper hook to optimistically update an edition in the cache
 */
export function useOptimisticEditionUpdate() {
    const queryClient = useQueryClient();

    return (editionId: string, updater: (old: TournamentEditionWithRelations | null) => TournamentEditionWithRelations | null) => {
        queryClient.setQueryData(EDITION_KEYS.detail(editionId), updater);
    };
}

// ============================================================================
// PREFETCHING
// ============================================================================

/**
 * Prefetch a single edition
 */
export async function prefetchTournamentEdition(
    queryClient: ReturnType<typeof useQueryClient>,
    id: string,
    options?: Parameters<typeof getTournamentEditionById>[1]
) {
    await queryClient.prefetchQuery({
        queryKey: EDITION_KEYS.detail(id),
        queryFn: () => getTournamentEditionById(id, options),
        staleTime: 1000 * 60 * 5,
    });
}

/**
 * Prefetch the first page of editions list
 */
export async function prefetchTournamentEditions(
    queryClient: ReturnType<typeof useQueryClient>,
    query: ListQuery<TournamentEditionFilters> = {}
) {
    await queryClient.prefetchInfiniteQuery({
        queryKey: EDITION_KEYS.list(query.filters || {}),
        queryFn: () => getTournamentEditions(query),
        initialPageParam: 1,
        staleTime: 1000 * 60 * 3,
    });
}

/**
 * Prefetch edition detail tree
 */
export async function prefetchEditionDetailTree(
    queryClient: ReturnType<typeof useQueryClient>,
    editionId: string,
    filters?: Parameters<typeof getEditionDetailTree>[1],
    options?: Parameters<typeof getEditionDetailTree>[2]
) {
    await queryClient.prefetchQuery({
        queryKey: EDITION_KEYS.detailTree(editionId),
        queryFn: () => getEditionDetailTree(editionId, filters, options),
        staleTime: 1000 * 60 * 2,
    });
}

