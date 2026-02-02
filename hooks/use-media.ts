import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import {
  getMediaById,
  getMedias,
  getUserMedias,
  getEntityMedias,
  countEntityMedias,
  getMediaStats,
  createMedia,
  deleteMedia,
  restoreMedia,
  updateMediaMetadata,
  updateMediaPrivacy,
} from "@/actions/media";
import type { EntityType, Media, NewMedia } from "@/database/schema";
import type {
  MediaFilters,
  ListQuery,
  PaginationResponse,
  QueryOptions,
} from "@/types/api";

// ============================================================================
// QUERY KEYS FACTORY
// ============================================================================
const mediaKeys = {
  all: ["medias"] as const,
  lists: () => [...mediaKeys.all, "list"] as const,
  list: (filters: MediaFilters, options?: QueryOptions) =>
    [...mediaKeys.lists(), { filters, options }] as const,
  infinite: (filters: MediaFilters, options?: QueryOptions) =>
    [...mediaKeys.all, "infinite", { filters, options }] as const,
  details: () => [...mediaKeys.all, "detail"] as const,
  detail: (id: string, populate?: string[]) =>
    [...mediaKeys.details(), id, { populate }] as const,
  user: (userId: string, filters?: MediaFilters, options?: QueryOptions) =>
    [...mediaKeys.all, "user", userId, { filters, options }] as const,
  entity: (
    entityId: string,
    entityType: string,
    filters?: MediaFilters,
    options?: QueryOptions
  ) =>
    [
      ...mediaKeys.all,
      "entity",
      entityId,
      entityType,
      { filters, options },
    ] as const,
  stats: (filters?: MediaFilters) =>
    [...mediaKeys.all, "stats", { filters }] as const,
  counts: (entityId: string, entityType: string) =>
    [...mediaKeys.all, "counts", entityId, entityType] as const,
};

// ============================================================================
// READ HOOKS
// ============================================================================

/**
 * Hook to fetch a single media by ID
 */
export function useMediaById(id: string, options?: { populate?: string[] }) {
  return useQuery({
    queryKey: mediaKeys.detail(id, options?.populate),
    queryFn: () => getMediaById(id, options),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch paginated media list
 */
export function useMedias(query: ListQuery<MediaFilters> = {}) {
  return useQuery({
    queryKey: mediaKeys.list(query.filters || {}, query.options),
    queryFn: () => getMedias(query),
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook to fetch media list with infinite scroll
 */
export function useInfiniteMedias(
  filters: MediaFilters = {},
  options?: QueryOptions
) {
  return useInfiniteQuery({
    queryKey: mediaKeys.infinite(filters, options),
    queryFn: ({ pageParam = 1 }) =>
      getMedias({
        pagination: { page: pageParam, limit: 50 },
        filters,
        options,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNext ? lastPage.pagination.page + 1 : undefined,
    getPreviousPageParam: (firstPage) =>
      firstPage.pagination.hasPrev ? firstPage.pagination.page - 1 : undefined,
    initialPageParam: 1,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook to fetch user-specific medias
 */
export function useUserMedias(
  userId: string,
  filters?: MediaFilters,
  options?: QueryOptions
) {
  return useQuery({
    queryKey: mediaKeys.user(userId, filters, options),
    queryFn: () => getUserMedias(userId, filters, options),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook to fetch entity-specific medias
 */
export function useEntityMedias(
  entityId: string,
  entityType: EntityType,
  filters?: MediaFilters,
  options?: QueryOptions
) {
  return useQuery({
    queryKey: mediaKeys.entity(entityId, entityType, filters, options),
    queryFn: () => getEntityMedias(entityId, entityType, filters, options),
    enabled: !!entityId && !!entityType,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook to fetch media statistics
 */
export function useMediaStats(filters?: MediaFilters) {
  return useQuery({
    queryKey: mediaKeys.stats(filters),
    queryFn: () => getMediaStats(filters),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Hook to fetch entity media counts by type
 */
export function useEntityMediaCounts(entityId: string, entityType: string) {
  return useQuery({
    queryKey: mediaKeys.counts(entityId, entityType),
    queryFn: () => countEntityMedias(entityId, entityType),
    enabled: !!entityId && !!entityType,
    staleTime: 1000 * 60 * 10,
  });
}

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Hook to create a new media
 */
export function useCreateMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: NewMedia) => createMedia(data),
    onSuccess: (newMedia) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: mediaKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: mediaKeys.user(newMedia.ownerId),
      });
      if (newMedia.entityId && newMedia.entityType) {
        queryClient.invalidateQueries({
          queryKey: mediaKeys.entity(newMedia.entityId, newMedia.entityType),
        });
      }
    },
  });
}

/**
 * Hook to delete (soft) a media
 */
export function useDeleteMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteMedia(id),
    onSuccess: (_, id) => {
      // Remove from detail cache
      queryClient.removeQueries({ queryKey: mediaKeys.detail(id) });
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: mediaKeys.lists() });
    },
  });
}

/**
 * Hook to restore a deleted media
 */
export function useRestoreMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => restoreMedia(id),
    onSuccess: (restoredMedia) => {
      queryClient.invalidateQueries({ queryKey: mediaKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: mediaKeys.user(restoredMedia.ownerId),
      });
    },
  });
}

/**
 * Hook to update media metadata
 */
export function useUpdateMediaMetadata() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      metadata,
    }: {
      id: string;
      metadata: Record<string, any>;
    }) => updateMediaMetadata(id, metadata),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: mediaKeys.detail(id) });
    },
  });
}

/**
 * Hook to update media privacy
 */
export function useUpdateMediaPrivacy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      privacy,
    }: {
      id: string;
      privacy: "PUBLIC" | "PRIVATE" | "FRIENDS";
    }) => updateMediaPrivacy(id, privacy),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: mediaKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: mediaKeys.lists() });
    },
  });
}
