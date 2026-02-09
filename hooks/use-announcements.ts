import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import {
  getAnnouncementById,
  getAnnouncements,
  getAnnouncementStats,
  hasUserReadAnnouncement,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from '@/actions/announcements';
import type { AnnouncementFilters, ListQuery, PaginationResponse } from '@/types/api';
import type { Announcement, NewAnnouncement } from '@/database/schema';


/**
 * Hook to create a new announcement
 */
export function useCreateAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: NewAnnouncement) => createAnnouncement(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: announcementKeys.lists() });
      queryClient.invalidateQueries({ queryKey: announcementKeys.stats() });
    },
  });
}

/**
 * Hook to update an existing announcement
 */
export function useUpdateAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<NewAnnouncement> }) =>
      updateAnnouncement(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: announcementKeys.lists() });
      queryClient.invalidateQueries({ queryKey: announcementKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: announcementKeys.stats() });
    },
  });
}

/**
 * Hook to delete an announcement
 */
export function useDeleteAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAnnouncement(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: announcementKeys.lists() });
      queryClient.invalidateQueries({ queryKey: announcementKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: announcementKeys.stats() });
    },
  });
}

// Query keys factory for announcements
const announcementKeys = {
  all: ['announcements'] as const,
  lists: () => [...announcementKeys.all, 'list'] as const,
  list: (filters: AnnouncementFilters) => [...announcementKeys.lists(), filters] as const,
  infinite: (filters: AnnouncementFilters) => [...announcementKeys.lists(), 'infinite', filters] as const,
  details: () => [...announcementKeys.all, 'detail'] as const,
  detail: (id: string) => [...announcementKeys.details(), id] as const,
  stats: () => [...announcementKeys.all, 'stats'] as const,
  stat: (filters: AnnouncementFilters) => [...announcementKeys.stats(), filters] as const,
  reads: () => [...announcementKeys.all, 'reads'] as const,
  read: (userId: string, announcementId: string) => [...announcementKeys.reads(), userId, announcementId] as const,
};

/**
 * Hook to fetch a single announcement by ID with optional population
 * @param id - Announcement ID
 * @param options - Optional population settings
 */
export function useAnnouncement(id: string, options?: { populate?: string[] }) {
  return useQuery({
    queryKey: announcementKeys.detail(id),
    queryFn: () => getAnnouncementById(id, options),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch paginated announcements with filters
 * @param query - List query with filters, pagination, and options
 */
export function useAnnouncements(query: ListQuery<AnnouncementFilters> = {}) {
  return useQuery({
    queryKey: announcementKeys.list(query.filters || {}),
    queryFn: () => getAnnouncements(query),
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook to fetch announcements infinitely with filters
 * @param filters - Announcement filters
 * @param limit - Items per page
 */
export function useInfiniteAnnouncements(filters: AnnouncementFilters = {}, limit = 20) {
  return useInfiniteQuery({
    queryKey: announcementKeys.infinite(filters),
    queryFn: ({ pageParam = 1 }) => getAnnouncements({ pagination: { page: pageParam, limit }, filters }),
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.hasNext) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
/**
 * Hook to fetch announcement statistics
 * @param filters - Optional filters for statistics
 */
export function useAnnouncementStats(filters?: AnnouncementFilters) {
  return useQuery({
    queryKey: announcementKeys.stat(filters || {}),
    queryFn: () => getAnnouncementStats(filters),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to check if a user has read an announcement
 * @param userId - User ID
 * @param announcementId - Announcement ID
 */
export function useHasUserReadAnnouncement(userId: string, announcementId: string) {
  return useQuery({
    queryKey: announcementKeys.read(userId, announcementId),
    queryFn: () => hasUserReadAnnouncement(userId, announcementId),
    enabled: !!userId && !!announcementId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to prefetch an announcement by ID
 * @param id - Announcement ID
 */
export function usePrefetchAnnouncement(id: string) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.prefetchQuery({
      queryKey: announcementKeys.detail(id),
      queryFn: () => getAnnouncementById(id),
      staleTime: 5 * 60 * 1000,
    });
  };
}

/**
 * Hook to invalidate announcement queries
 */
export function useInvalidateAnnouncements() {
  const queryClient = useQueryClient();
  return {
    invalidateList: () => queryClient.invalidateQueries({ queryKey: announcementKeys.lists() }),
    invalidateDetail: (id: string) => queryClient.invalidateQueries({ queryKey: announcementKeys.detail(id) }),
    invalidateStats: () => queryClient.invalidateQueries({ queryKey: announcementKeys.stats() }),
    invalidateReads: () => queryClient.invalidateQueries({ queryKey: announcementKeys.reads() }),
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: announcementKeys.all }),
  };
}
