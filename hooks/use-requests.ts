import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import {
  getRequestById,
  getUserRequests,
  getRequestStats,
  createRequest,
} from "@/actions/requests";
import {
  type RequestFilters,
  type ListQuery,
  type PaginationResponse,
} from "@/types/api";
import { type Request, type NewRequest } from "@/database/schema";

// Query keys factory for consistent caching
const requestKeys = {
  all: ["requests"] as const,
  lists: () => [...requestKeys.all, "list"] as const,
  list: (filters: RequestFilters | undefined) =>
    [...requestKeys.lists(), filters] as const,
  details: () => [...requestKeys.all, "detail"] as const,
  detail: (id: string) => [...requestKeys.details(), id] as const,
  stats: () => [...requestKeys.all, "stats"] as const,
  stat: (filters: RequestFilters | undefined) =>
    [...requestKeys.stats(), filters] as const,
  infinite: () => [...requestKeys.all, "infinite"] as const,
};

// ============================================================================
// HOOKS - Lectures optimisées
// ============================================================================

/**
 * Hook pour récupérer une requête par son ID avec cache et invalidation automatique
 */
export function useRequestById(
  id: string,
  options?: { populate?: string[] },
  queryOpts?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: requestKeys.detail(id),
    queryFn: () => getRequestById(id, options),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    enabled: queryOpts?.enabled !== false && !!id,
  });
}

/**
 * Hook pour récupérer les requêtes paginées d’un utilisateur avec cache et prefetching
 */
export function useUserRequests(
  userId: string,
  query: ListQuery<RequestFilters> = {},
  options?: { keepPreviousData?: boolean },
) {
  return useQuery<PaginationResponse<Request>, Error>({
    queryKey: requestKeys.list({ ...query.filters, userId }),
    queryFn: () => getUserRequests(userId, query),
    staleTime: 1000 * 60 * 3, // 3 minutes
    gcTime: 1000 * 60 * 5,
    placeholderData: options?.keepPreviousData
      ? undefined
      : {
          data: [],
          pagination: {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          },
        },
  });
}

/**
 * Hook pour récupérer les statistiques des requêtes avec cache
 */
export function useRequestStats(filters?: RequestFilters) {
  return useQuery({
    queryKey: requestKeys.stat(filters),
    queryFn: () => getRequestStats(filters),
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5,
  });
}

/**
 * Hook infini pour charger les requêtes au scroll (optimisé pour grandes listes)
 */
export function useInfiniteUserRequests(
  userId: string,
  filters?: RequestFilters,
  limit = 20,
) {
  return useInfiniteQuery({
    queryKey: requestKeys.infinite(),
    queryFn: ({ pageParam = 1 }) =>
      getUserRequests(userId, {
        pagination: { page: pageParam, limit },
        filters,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNext ? lastPage.pagination.page + 1 : undefined,
    initialPageParam: 1,
    staleTime: 1000 * 60 * 3,
    gcTime: 1000 * 60 * 5,
  });
}

// ============================================================================
// HOOKS - Mutations optimisées
// ============================================================================

/**
 * Hook pour créer une requête avec invalidation automatique des caches liés
 */
export function useCreateRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: NewRequest) => createRequest(data),
    onSuccess: (newRequest) => {
      // Invalidate list queries to refetch
      queryClient.invalidateQueries({ queryKey: requestKeys.lists() });
      queryClient.invalidateQueries({ queryKey: requestKeys.stats() });
      // Optionally populate the new detail cache instantly
      queryClient.setQueryData(requestKeys.detail(newRequest.id), newRequest);
    },
    onError: (error) => {
      console.error("Create request error:", error);
    },
  });
}

// ============================================================================
// UTILITAIRES
// ============================================================================

/**
 * Précharge les requêtes côté serveur (SSR) si nécessaire
 */
export function prefetchRequestById(
  queryClient: ReturnType<typeof useQueryClient>,
  id: string,
  options?: { populate?: string[] },
) {
  return queryClient.prefetchQuery({
    queryKey: requestKeys.detail(id),
    queryFn: () => getRequestById(id, options),
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Annule les requêtes en cours si l'utilisateur quitte la page rapidement
 */
export function cancelRequestQueries(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  queryClient.cancelQueries({ queryKey: requestKeys.all });
}
