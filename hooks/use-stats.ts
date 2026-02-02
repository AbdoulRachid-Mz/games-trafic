// @/hook/use-stats

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getStats, getGlobalStats, getDashboardStats, getPerformanceMetrics, getRecentActivities } from '@/actions/stats';
import type { StatsFilters, StatsResponse, GlobalStats, RecentActivity } from '@/actions/stats';

// Cache configuration
const STATS_CACHE_TIME = 1000 * 60 * 5; // 5 minutes
const STALE_TIME = 1000 * 60 * 2; // 2 minutes
const RETRY_COUNT = 1;

// Query key factory
const statsKeys = {
  all: ['stats'] as const,
  global: () => [...statsKeys.all, 'global'] as const,
  dashboard: () => [...statsKeys.all, 'dashboard'] as const,
  performance: (timeframe: string) => [...statsKeys.all, 'performance', timeframe] as const,
  recent: () => [...statsKeys.all, 'recent'] as const,
  entity: (entity: string, statId?: string) => 
    [...statsKeys.all, 'entity', entity, ...(statId ? [statId] : [])] as const,
  filtered: (filters: StatsFilters) => [...statsKeys.all, 'filtered', filters] as const,
};

// Optimized stats hook with intelligent caching
export function useStats(filters: StatsFilters = {}) {
  return useQuery({
    queryKey: statsKeys.filtered(filters),
    queryFn: () => getStats(filters),
    staleTime: STALE_TIME,
    gcTime: STATS_CACHE_TIME,
    retry: RETRY_COUNT,
    enabled: Boolean(filters.entity || Object.keys(filters).length > 0),
  });
}

// Global stats hook with dedicated caching
export function useGlobalStats(filters: StatsFilters = {}) {
  return useQuery({
    queryKey: statsKeys.global(),
    queryFn: () => getGlobalStats(filters),
    staleTime: STALE_TIME,
    gcTime: STATS_CACHE_TIME,
    retry: RETRY_COUNT,
  });
}

// Dashboard stats hook
export function useDashboardStats() {
  return useQuery({
    queryKey: statsKeys.dashboard(),
    queryFn: () => getDashboardStats(),
    staleTime: STALE_TIME,
    gcTime: STATS_CACHE_TIME,
    retry: RETRY_COUNT,
  });
}

// Performance metrics hook with timeframe parameter
export function usePerformanceMetrics(timeframe: 'day' | 'week' | 'month' = 'day') {
  return useQuery({
    queryKey: statsKeys.performance(timeframe),
    queryFn: () => getPerformanceMetrics(timeframe),
    staleTime: STALE_TIME,
    gcTime: STATS_CACHE_TIME,
    retry: RETRY_COUNT,
  });
}

// Recent activities hook
export function useRecentActivities(limit: number = 10) {
  return useQuery({
    queryKey: statsKeys.recent(),
    queryFn: () => getRecentActivities(limit),
    staleTime: STALE_TIME,
    gcTime: STATS_CACHE_TIME,
    retry: RETRY_COUNT,
  });
}

// Entity-specific stats hook
export function useEntityStats(entity: string, statId?: string, filters: Omit<StatsFilters, 'entity' | 'statId'> = {}) {
  return useQuery({
    queryKey: statsKeys.entity(entity, statId),
    queryFn: () => getStats({ ...filters, entity, statId }),
    staleTime: STALE_TIME,
    gcTime: STATS_CACHE_TIME,
    retry: RETRY_COUNT,
    enabled: Boolean(entity),
  });
}

// Advanced stats hook with real-time updates
export function useRealtimeStats(filters: StatsFilters = {}, intervalMs: number = 30000) {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: statsKeys.filtered(filters),
    queryFn: () => getStats(filters),
    staleTime: intervalMs / 2,
    gcTime: STATS_CACHE_TIME,
    retry: RETRY_COUNT,
    refetchInterval: intervalMs,
  });

  // Manual invalidation helper
  const invalidateStats = () => {
    queryClient.invalidateQueries({ queryKey: statsKeys.all });
  };

  return { ...query, invalidateStats };
}

// Optimized hook for multiple stat entities
export function useMultipleStats(entities: Array<{ entity: string; statId?: string; filters?: Omit<StatsFilters, 'entity' | 'statId'> }>) {
  const queryClient = useQueryClient();
  
  const results = entities.map(({ entity, statId, filters = {} }) => 
    useEntityStats(entity, statId, filters)
  );

  const isLoading = results.some(result => result.isLoading);
  const isError = results.some(result => result.isError);
  const error = results.find(result => result.error)?.error;

  const invalidateAll = () => {
    entities.forEach(({ entity, statId }) => {
      queryClient.invalidateQueries({ queryKey: statsKeys.entity(entity, statId) });
    });
  };

  return {
    data: results.map(result => result.data),
    isLoading,
    isError,
    error,
    invalidateAll,
  };
}

// Prefetch helpers for SSR/SSG
export async function prefetchStats(queryClient: any, filters: StatsFilters = {}) {
  await queryClient.prefetchQuery({
    queryKey: statsKeys.filtered(filters),
    queryFn: () => getStats(filters),
    staleTime: STALE_TIME,
    gcTime: STATS_CACHE_TIME,
  });
}

export async function prefetchGlobalStats(queryClient: any, filters: StatsFilters = {}) {
  await queryClient.prefetchQuery({
    queryKey: statsKeys.global(),
    queryFn: () => getGlobalStats(filters),
    staleTime: STALE_TIME,
    gcTime: STATS_CACHE_TIME,
  });
}

export async function prefetchDashboardStats(queryClient: any) {
  await queryClient.prefetchQuery({
    queryKey: statsKeys.dashboard(),
    queryFn: () => getDashboardStats(),
    staleTime: STALE_TIME,
    gcTime: STATS_CACHE_TIME,
  });
}

// Export types for external use
export type { StatsFilters, StatsResponse, GlobalStats, RecentActivity };
