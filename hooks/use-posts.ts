'use client';

import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import {
  getPostById,
  getPosts,
  getPostsByUserId,
  getActiveStories
} from '@/actions/posts';
import type { PostFilters, ListQuery, PaginationResponse } from '@/types/api';
import { type PostCard } from '@/types/view-models';
import { toast } from 'sonner';

// ============================================================================
// QUERY KEYS
// ============================================================================

const POSTS_QUERY_KEY = 'posts';
const POST_QUERY_KEY = 'post';
const USER_POSTS_QUERY_KEY = 'user-posts';
const STORIES_QUERY_KEY = 'stories';

// ============================================================================
// HOOKS - LECTURE DES DONNÉES
// ============================================================================

/**
 * Hook pour récupérer un post par son ID avec cache et relations optionnelles
 */
export function usePostById(id: string, options?: { populate?: string[] }, enabled = true) {
  return useQuery({
    queryKey: [POST_QUERY_KEY, id, options],
    queryFn: () => getPostById(id, options),
    enabled: enabled && !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Hook infini pour lister les posts avec pagination, filtres et options
 * Optimisé pour le scroll infini
 */
export function useInfinitePosts(filters: PostFilters = {}, options: ListQuery<PostFilters>['options'] = {}, limit = 50) {
  return useInfiniteQuery<
    PaginationResponse<PostCard>,
    Error,
    InfiniteData<PaginationResponse<PostCard>, number>,
    readonly unknown[],
    number
  >({
    queryKey: [POSTS_QUERY_KEY, filters, options],
    queryFn: ({ pageParam = 1 }) => getPosts({ pagination: { page: pageParam, limit }, filters, options }),
    getNextPageParam: (lastPage) => lastPage.pagination.hasNext ? lastPage.pagination.page + 1 : undefined,
    initialPageParam: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Hook pour récupérer les posts d'un utilisateur avec pagination
 */
export function usePostsByUserId(userId: string, filters: PostFilters = {}, options: ListQuery<PostFilters>['options'] = {}, limit = 20) {
  return useInfiniteQuery<
    PaginationResponse<PostCard>,
    Error,
    InfiniteData<PaginationResponse<PostCard>, number>,
    readonly unknown[],
    number
  >({
    queryKey: [USER_POSTS_QUERY_KEY, userId, filters, options],
    queryFn: ({ pageParam = 1 }) => getPostsByUserId(userId, { pagination: { page: pageParam, limit }, filters, options }),
    getNextPageParam: (lastPage) => lastPage.pagination.hasNext ? lastPage.pagination.page + 1 : undefined,
    initialPageParam: 1,
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Hook pour récupérer les stories actives (non expirées)
 */
export function useActiveStories(filters: PostFilters = {}, options: ListQuery<PostFilters>['options'] = {}, limit = 50) {
  return useInfiniteQuery({
    queryKey: [STORIES_QUERY_KEY, filters, options],
    queryFn: ({ pageParam = 1 }) => getActiveStories({ pagination: { page: pageParam, limit }, filters, options }),
    getNextPageParam: (lastPage) => lastPage.pagination.hasNext ? lastPage.pagination.page + 1 : undefined,
    getPreviousPageParam: (firstPage) => firstPage.pagination.hasPrev ? firstPage.pagination.page - 1 : undefined,
    initialPageParam: 1,
    staleTime: 1000 * 30, // 30 secondes (stories courtes durée de vie)
    gcTime: 1000 * 60 * 2, // 2 minutes
    refetchInterval: 1000 * 60, // Re-fetch toutes les minutes
  });
}

// ============================================================================
// MUTATIONS - INVALIDATION OPTIMISÉE
// ============================================================================

/**
 * Hook utilitaire pour invalider les caches de posts
 */
export function useInvalidatePosts() {
  const queryClient = useQueryClient();

  return {
    invalidatePost: (id: string) => queryClient.invalidateQueries({ queryKey: [POST_QUERY_KEY, id] }),
    invalidatePosts: () => queryClient.invalidateQueries({ queryKey: [POSTS_QUERY_KEY] }),
    invalidateUserPosts: (userId: string) => queryClient.invalidateQueries({ queryKey: [USER_POSTS_QUERY_KEY, userId] }),
    invalidateStories: () => queryClient.invalidateQueries({ queryKey: [STORIES_QUERY_KEY] }),
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: [POSTS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [USER_POSTS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [STORIES_QUERY_KEY] });
    },
  };
}
