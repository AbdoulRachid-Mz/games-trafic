import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import {
  getClaimById,
  getClaims,
  getClaimStats,
  getUserClaims,
  createClaim,
  updateClaim,
  updateClaimStatus,
  deleteClaim,
  restoreClaim,
  addClaimEvidence,
} from "@/actions/claims";
import type { Claim, NewClaim } from "@/database/schema";
import type { ClaimFilters, ListQuery, PaginationResponse } from "@/types/api";

// Query keys factory
const claimKeys = {
  all: ["claims"] as const,
  lists: () => [...claimKeys.all, "list"] as const,
  list: (filters: ClaimFilters) => [...claimKeys.lists(), filters] as const,
  infinite: (filters: ClaimFilters) =>
    [...claimKeys.all, "infinite", filters] as const,
  details: () => [...claimKeys.all, "detail"] as const,
  detail: (id: string) => [...claimKeys.details(), id] as const,
  stats: () => [...claimKeys.all, "stats"] as const,
  stat: (filters: ClaimFilters) => [...claimKeys.stats(), filters] as const,
  user: (userId: string) => [...claimKeys.all, "user", userId] as const,
};

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Hook to fetch a single claim by ID
 */
export function useClaimById(id: string, options?: { populate?: string[] }) {
  return useQuery({
    queryKey: claimKeys.detail(id),
    queryFn: () => getClaimById(id, options),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to fetch paginated claims with filters
 */
export function useClaims(query: ListQuery<ClaimFilters> = {}) {
  return useQuery({
    queryKey: claimKeys.list(query.filters || {}),
    queryFn: () => getClaims(query),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch claims with infinite scroll
 */
export function useInfiniteClaims(filters: ClaimFilters = {}) {
  return useInfiniteQuery({
    queryKey: claimKeys.infinite(filters),
    queryFn: ({ pageParam = 1 }) =>
      getClaims({
        pagination: { page: pageParam, limit: 50 },
        filters,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNext ? lastPage.pagination.page + 1 : undefined,
    getPreviousPageParam: (firstPage) =>
      firstPage.pagination.hasPrev ? firstPage.pagination.page - 1 : undefined,
    initialPageParam: 1,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch claim statistics
 */
export function useClaimStats(filters?: ClaimFilters) {
  return useQuery({
    queryKey: claimKeys.stat(filters || {}),
    queryFn: () => getClaimStats(filters),
    staleTime: 60 * 1000, // 1 minute
    gcTime: 3 * 60 * 1000, // 3 minutes
  });
}

/**
 * Hook to fetch user-specific claims
 */
export function useUserClaims(
  userId: string,
  query: ListQuery<ClaimFilters> = {}
) {
  return useQuery({
    queryKey: [...claimKeys.user(userId), query.filters || {}],
    queryFn: () => getUserClaims(userId, query),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Hook to create a new claim
 */
export function useCreateClaim() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createClaim,
    onSuccess: (newClaim) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: claimKeys.lists() });
      queryClient.invalidateQueries({ queryKey: claimKeys.stats() });
      if (newClaim.userId) {
        queryClient.invalidateQueries({
          queryKey: claimKeys.user(newClaim.userId),
        });
      }
    },
  });
}

/**
 * Hook to update a claim
 */
export function useUpdateClaim() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<NewClaim> }) =>
      updateClaim(id, data),
    onSuccess: (updatedClaim) => {
      // Update the specific claim in cache
      queryClient.setQueryData(claimKeys.detail(updatedClaim.id), updatedClaim);
      // Invalidate lists and stats
      queryClient.invalidateQueries({ queryKey: claimKeys.lists() });
      queryClient.invalidateQueries({ queryKey: claimKeys.stats() });
      if (updatedClaim.userId) {
        queryClient.invalidateQueries({
          queryKey: claimKeys.user(updatedClaim.userId),
        });
      }
    },
  });
}

/**
 * Hook to update claim status
 */
export function useUpdateClaimStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
      resolution,
    }: {
      id: string;
      status: string;
      resolution?: string;
    }) => updateClaimStatus(id, status, resolution),
    onSuccess: (updatedClaim) => {
      queryClient.setQueryData(claimKeys.detail(updatedClaim.id), updatedClaim);
      queryClient.invalidateQueries({ queryKey: claimKeys.lists() });
      queryClient.invalidateQueries({ queryKey: claimKeys.stats() });
      if (updatedClaim.userId) {
        queryClient.invalidateQueries({
          queryKey: claimKeys.user(updatedClaim.userId),
        });
      }
    },
  });
}

/**
 * Hook to soft delete a claim
 */
export function useDeleteClaim() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteClaim,
    onSuccess: (deletedClaim) => {
      // Remove from cache
      queryClient.removeQueries({
        queryKey: claimKeys.detail(deletedClaim.id),
      });
      queryClient.invalidateQueries({ queryKey: claimKeys.lists() });
      queryClient.invalidateQueries({ queryKey: claimKeys.stats() });
      if (deletedClaim.userId) {
        queryClient.invalidateQueries({
          queryKey: claimKeys.user(deletedClaim.userId),
        });
      }
    },
  });
}

/**
 * Hook to restore a soft-deleted claim
 */
export function useRestoreClaim() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: restoreClaim,
    onSuccess: (restoredClaim) => {
      queryClient.setQueryData(
        claimKeys.detail(restoredClaim.id),
        restoredClaim
      );
      queryClient.invalidateQueries({ queryKey: claimKeys.lists() });
      queryClient.invalidateQueries({ queryKey: claimKeys.stats() });
      if (restoredClaim.userId) {
        queryClient.invalidateQueries({
          queryKey: claimKeys.user(restoredClaim.userId),
        });
      }
    },
  });
}

/**
 * Hook to add evidence to a claim
 */
export function useAddClaimEvidence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      evidence,
      image,
    }: {
      id: string;
      evidence: string;
      image?: string;
    }) => addClaimEvidence(id, evidence, image),
    onSuccess: (updatedClaim) => {
      queryClient.setQueryData(claimKeys.detail(updatedClaim.id), updatedClaim);
      queryClient.invalidateQueries({ queryKey: claimKeys.lists() });
      if (updatedClaim.userId) {
        queryClient.invalidateQueries({
          queryKey: claimKeys.user(updatedClaim.userId),
        });
      }
    },
  });
}
