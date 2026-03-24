import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import {
  getVipSubscriptionById,
  getActiveVipSubscriptionByUserId,
  getVipSubscriptions,
  getVipSubscriptionStats,
  checkUserVipStatus,
  getUserVipBenefits,
  createVipSubscription,
  updateVipSubscription,
  cancelVipSubscription,
  renewVipSubscription,
  deleteVipSubscription,
  restoreVipSubscription,
} from "@/actions/vip";
import type { VipSubscription, NewVipSubscription } from "@/database/schema";
import type {
  VipSubscriptionFilters,
  ListQuery,
  PaginationResponse,
} from "@/types/api";

// ============================================================================
// QUERY KEYS FACTORY
// ============================================================================
const vipKeys = {
  all: ["vip-subscriptions"] as const,
  lists: () => [...vipKeys.all, "list"] as const,
  list: (filters: VipSubscriptionFilters | undefined) =>
    [...vipKeys.lists(), filters] as const,
  details: () => [...vipKeys.all, "detail"] as const,
  detail: (id: string) => [...vipKeys.details(), id] as const,
  user: (userId: string) => [...vipKeys.all, "user", userId] as const,
  stats: (filters?: VipSubscriptionFilters) =>
    [...vipKeys.all, "stats", filters] as const,
  benefits: (userId: string) => [...vipKeys.all, "benefits", userId] as const,
};

// ============================================================================
// READ HOOKS
// ============================================================================

/**
 * Hook to fetch all VIP subscriptions (Admin)
 */
export function useVipSubscriptions(query: ListQuery<VipSubscriptionFilters> = {}) {
  return useQuery<PaginationResponse<VipSubscription>, Error>({
    queryKey: vipKeys.list(query.filters),
    queryFn: () => getVipSubscriptions(query),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch a single VIP subscription by ID
 */
export function useVipSubscriptionById(id: string, options?: { populate?: string[] }) {
  return useQuery({
    queryKey: vipKeys.detail(id),
    queryFn: () => getVipSubscriptionById(id, options),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook to fetch active VIP subscription for a user
 */
export function useActiveVipSubscription(userId: string) {
  return useQuery({
    queryKey: vipKeys.user(userId),
    queryFn: () => getActiveVipSubscriptionByUserId(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook to fetch VIP statistics
 */
export function useVipStats(filters?: VipSubscriptionFilters) {
  return useQuery({
    queryKey: vipKeys.stats(filters),
    queryFn: () => getVipSubscriptionStats(filters),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Hook to check if user is VIP
 */
export function useUserVipStatus(userId: string) {
  return useQuery({
    queryKey: [...vipKeys.user(userId), "status"],
    queryFn: () => checkUserVipStatus(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook to fetch VIP benefits for a user
 */
export function useUserVipBenefits(userId: string) {
  return useQuery({
    queryKey: vipKeys.benefits(userId),
    queryFn: () => getUserVipBenefits(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 10,
  });
}

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Hook to create a new VIP subscription
 */
export function useCreateVipSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: NewVipSubscription) => createVipSubscription(data),
    onSuccess: (newSub) => {
      queryClient.invalidateQueries({ queryKey: vipKeys.lists() });
      queryClient.invalidateQueries({ queryKey: vipKeys.user(newSub.userId) });
      queryClient.invalidateQueries({ queryKey: vipKeys.stats() });
    },
  });
}

/**
 * Hook to update a VIP subscription
 */
export function useUpdateVipSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<NewVipSubscription> }) =>
      updateVipSubscription(id, data),
    onSuccess: (updatedSub) => {
      queryClient.invalidateQueries({ queryKey: vipKeys.detail(updatedSub.id) });
      queryClient.invalidateQueries({ queryKey: vipKeys.lists() });
      queryClient.invalidateQueries({ queryKey: vipKeys.user(updatedSub.userId) });
    },
  });
}

/**
 * Hook to cancel a VIP subscription
 */
export function useCancelVipSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => cancelVipSubscription(id),
    onSuccess: (cancelledSub) => {
      queryClient.invalidateQueries({ queryKey: vipKeys.detail(cancelledSub.id) });
      queryClient.invalidateQueries({ queryKey: vipKeys.lists() });
      queryClient.invalidateQueries({ queryKey: vipKeys.user(cancelledSub.userId) });
    },
  });
}

/**
 * Hook to delete (soft) a VIP subscription
 */
export function useDeleteVipSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteVipSubscription(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: vipKeys.lists() });
      queryClient.invalidateQueries({ queryKey: vipKeys.stats() });
    },
  });
}
