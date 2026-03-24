import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
  type UseQueryOptions,
  type UseMutationOptions,
  type UseInfiniteQueryOptions,
  type InfiniteData,
  type UseInfiniteQueryResult,
} from "@tanstack/react-query";
import {
  getServiceById,
  getServices,
  getServiceStats,
  createService,
  updateService,
  deleteService,
} from "@/actions/services";
import { type ListQuery, type PaginationResponse, type QueryOptions, type ServiceFilters } from '@/types/api';
import { NewService, Service } from "@/database/schema";
import {
  type ServiceCard, type UserMini,
} from "@/types/view-models";

// ============================================================================
// QUERY KEYS FACTORY
// ============================================================================
const serviceKeys = {
  all: ["services"] as const,
  lists: () => [...serviceKeys.all, "list"] as const,
  list: (filters: ServiceFilters | undefined) =>
    [...serviceKeys.lists(), { filters }] as const,
  details: () => [...serviceKeys.all, "detail"] as const,
  detail: (id: string | undefined) =>
    id
      ? ([...serviceKeys.details(), id] as const)
      : ([...serviceKeys.details(), "undefined"] as const),
  stats: (filters?: ServiceFilters) =>
    [...serviceKeys.all, "stats", filters] as const,
};

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Hook to fetch a single service by ID
 */
export function useService(
  id: string | undefined,
  options?: { populate?: string[] },
  queryOpts?: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof getServiceById>>, Error>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: serviceKeys.detail(id),
    queryFn: () => (id ? getServiceById(id, options) : null),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
    ...queryOpts,
  });
}

/**
 * Hook to fetch paginated services with filters
 */
export function useServices(
  query: ListQuery<ServiceFilters> = {},
  queryOpts?: Omit<
    UseQueryOptions<PaginationResponse<ServiceCard>, Error>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: serviceKeys.list(query.filters),
    queryFn: () => getServices(query),
    staleTime: 10 * 60 * 1000,
    ...queryOpts,
  });
}

/**
 * Infinite scroll hook for services
 */
export function useInfiniteServices(
  query: ListQuery<ServiceFilters> = {},
  queryOpts?: Omit<
    UseInfiniteQueryOptions<
      PaginationResponse<ServiceCard>,
      Error,
      InfiniteData<PaginationResponse<ServiceCard>, number>,
      readonly unknown[],
      number
    >,
    "queryKey" | "queryFn" | "getNextPageParam" | "initialPageParam"
  >
): UseInfiniteQueryResult<
  InfiniteData<PaginationResponse<ServiceCard>, number>,
  Error
> {
  return useInfiniteQuery<
    PaginationResponse<ServiceCard>,
    Error,
    InfiniteData<PaginationResponse<ServiceCard>, number>,
    readonly unknown[],
    number
  >({
    queryKey: [...serviceKeys.lists(), "infinite", query.filters],
    queryFn: ({ pageParam = 1 }) =>
      getServices({
        ...query,
        pagination: {
          ...query.pagination,
          page: pageParam,
          limit: query.pagination?.limit ?? 20,
        },
      }),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNext ? lastPage.pagination.page + 1 : undefined,
    initialPageParam: 1,
    staleTime: 10 * 60 * 1000,
    ...queryOpts,
  });
}

/**
 * Hook to fetch service statistics
 */
export function useServiceStats(
  filters?: ServiceFilters,
  queryOpts?: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof getServiceStats>>, Error>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: serviceKeys.stats(filters),
    queryFn: () => getServiceStats(filters),
    staleTime: 10 * 60 * 1000,
    ...queryOpts,
  });
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Hook to create a new service
 */
export function useCreateService(
  mutationOpts?: Omit<UseMutationOptions<Service, Error, NewService>, "mutationFn">
) {
  const queryClient = useQueryClient();
  return useMutation({
    ...mutationOpts,
    mutationFn: createService,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: serviceKeys.lists() });
      (mutationOpts?.onSuccess as any)?.(...args);
    },
  });
}

/**
 * Hook to update a service
 */
export function useUpdateService(
  mutationOpts?: Omit<
    UseMutationOptions<Service, Error, { id: string; data: Partial<NewService> }>,
    "mutationFn"
  >
) {
  const queryClient = useQueryClient();
  return useMutation({
    ...mutationOpts,
    mutationFn: ({ id, data }) => updateService(id, data),
    onSuccess: (...args) => {
      const { id } = args[1] as { id: string };
      queryClient.invalidateQueries({ queryKey: serviceKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: serviceKeys.lists() });
      (mutationOpts?.onSuccess as any)?.(...args);
    },
  });
}

/**
 * Hook to delete a service
 */
export function useDeleteService(
  mutationOpts?: Omit<UseMutationOptions<Service, Error, string>, "mutationFn">
) {
  const queryClient = useQueryClient();
  return useMutation({
    ...mutationOpts,
    mutationFn: deleteService,
    onSuccess: (...args) => {
      const id = args[1] as string;
      queryClient.invalidateQueries({ queryKey: serviceKeys.lists() });
      queryClient.removeQueries({ queryKey: serviceKeys.detail(id) });
      (mutationOpts?.onSuccess as any)?.(...args);
    },
  });
}
