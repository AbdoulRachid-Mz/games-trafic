import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import {
  getBlogById,
  getBlogs,
  getBlogsByAuthor,
  getBlogStats,
  createBlog,
  updateBlog,
  deleteBlog,
  restoreBlog,
  toggleBlogStatus,
  incrementBlogViews,
  getPopularBlogs,
  searchBlogs,
} from '@/actions/blogs';
import type { BlogFilters, ListQuery, PaginationResponse } from '@/types/api';
import { type BlogCard } from '@/types/view-models';
import { type InfiniteData } from '@tanstack/react-query';
import { NewBlog } from '@/database/schema';

// Query keys factory
const blogKeys = {
  all: ['blogs'] as const,
  lists: () => [...blogKeys.all, 'list'] as const,
  list: (filters: BlogFilters, options: ListQuery<BlogFilters>['options']) =>
    [...blogKeys.lists(), { filters, options }] as const,
  details: () => [...blogKeys.all, 'detail'] as const,
  detail: (id: string, populate?: string[]) =>
    [...blogKeys.details(), id, { populate }] as const,
  author: (authorId: string) => [...blogKeys.lists(), 'author', authorId] as const,
  stats: () => [...blogKeys.all, 'stats'] as const,
  popular: () => [...blogKeys.all, 'popular'] as const,
  search: (term: string) => [...blogKeys.lists(), 'search', term] as const,
};

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Fetch a single blog by ID
 */
export function useBlogById(id: string, options?: { populate?: string[] }) {
  return useQuery<Awaited<ReturnType<typeof getBlogById>>, Error>({
    queryKey: blogKeys.detail(id, options?.populate),
    queryFn: () => getBlogById(id, options),
    enabled: !!id,
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}

/**
 * Fetch paginated blogs with filters
 */
export function useBlogs(filters: BlogFilters = {}, options: ListQuery<BlogFilters>['options'] = {}) {
  return useInfiniteQuery<
    PaginationResponse<BlogCard>,
    Error,
    InfiniteData<PaginationResponse<BlogCard>, number>,
    readonly unknown[],
    number
  >({
    queryKey: blogKeys.list(filters, options),
    queryFn: async ({ pageParam = 1 }) => {
      const pagination = { page: pageParam, limit: 20 };
      const [blogsResponse, statsResponse] = await Promise.all([
        getBlogs({ pagination, filters, options }),
        getBlogStats(filters),
      ]);

      const total = statsResponse?.total || blogsResponse.pagination.total;
      const totalPages = Math.ceil(total / pagination.limit);

      return {
        data: blogsResponse.data,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          totalPages,
          hasNext: pagination.page < totalPages,
          hasPrev: pagination.page > 1,
        },
      };
    },
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNext ? lastPage.pagination.page + 1 : undefined,
    initialPageParam: 1,
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}

/**
 * Fetch blogs by author
 */
export function useBlogsByAuthor(authorId: string, filters: BlogFilters = {}) {
  return useInfiniteQuery<
    PaginationResponse<BlogCard>,
    Error,
    InfiniteData<PaginationResponse<BlogCard>, number>,
    readonly unknown[],
    number
  >({
    queryKey: blogKeys.author(authorId),
    queryFn: ({ pageParam = 1 }) =>
      getBlogsByAuthor(authorId, {
        pagination: { page: pageParam, limit: 20 },
        filters,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNext ? lastPage.pagination.page + 1 : undefined,
    initialPageParam: 1,
    enabled: !!authorId,
    staleTime: 15 * 60 * 1000,
  });
}

/**
 * Fetch blog statistics
 */
export function useBlogStats(filters?: BlogFilters) {
  return useQuery({
    queryKey: blogKeys.stats(),
    queryFn: () => getBlogStats(filters),
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}

/**
 * Fetch popular blogs
 */
export function usePopularBlogs(limit = 10) {
  return useQuery<BlogCard[], Error>({
    queryKey: blogKeys.popular(),
    queryFn: () => getPopularBlogs(limit),
    staleTime: 15 * 60 * 1000,
  });
}

/**
 * Search blogs with debounced term
 */
export function useSearchBlogs(searchTerm: string, filters: BlogFilters = {}) {
  return useInfiniteQuery({
    queryKey: blogKeys.search(searchTerm),
    queryFn: ({ pageParam = 1 }) =>
      searchBlogs(searchTerm, {
        pagination: { page: pageParam, limit: 20 },
        filters,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNext ? lastPage.pagination.page + 1 : undefined,
    initialPageParam: 1,
    enabled: searchTerm.length > 2,
    staleTime: 15 * 60 * 1000,
  });
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new blog
 */
export function useCreateBlog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: NewBlog) => createBlog(data),
    onSuccess: (newBlog) => {
      // Invalidate lists to refetch
      queryClient.invalidateQueries({ queryKey: blogKeys.lists() });
      queryClient.invalidateQueries({ queryKey: blogKeys.author(newBlog.authorId) });
      queryClient.invalidateQueries({ queryKey: blogKeys.stats() });
    },
  });
}

/**
 * Update an existing blog
 */
export function useUpdateBlog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<NewBlog> }) => updateBlog(id, data),
    onSuccess: (_, { id }) => {
      // Invalidate specific blog and lists
      queryClient.invalidateQueries({ queryKey: blogKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: blogKeys.lists() });
      queryClient.invalidateQueries({ queryKey: blogKeys.stats() });
    },
  });
}

/**
 * Soft delete a blog
 */
export function useDeleteBlog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteBlog(id),
    onSuccess: (deletedBlog) => {
      queryClient.invalidateQueries({ queryKey: blogKeys.lists() });
      queryClient.invalidateQueries({ queryKey: blogKeys.author(deletedBlog.authorId) });
      queryClient.invalidateQueries({ queryKey: blogKeys.stats() });
    },
  });
}

/**
 * Restore a deleted blog
 */
export function useRestoreBlog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => restoreBlog(id),
    onSuccess: (restoredBlog) => {
      queryClient.invalidateQueries({ queryKey: blogKeys.lists() });
      queryClient.invalidateQueries({ queryKey: blogKeys.author(restoredBlog.authorId) });
      queryClient.invalidateQueries({ queryKey: blogKeys.stats() });
    },
  });
}

/**
 * Toggle blog active status
 */
export function useToggleBlogStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => toggleBlogStatus(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: blogKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: blogKeys.lists() });
      queryClient.invalidateQueries({ queryKey: blogKeys.stats() });
    },
  });
}

/**
 * Increment blog views (optimistic)
 */
export function useIncrementBlogViews() {
  return useMutation({
    mutationFn: ({ blogId, userId, sessionId }: { blogId: string; userId?: string; sessionId?: string }) =>
      incrementBlogViews(blogId, userId, sessionId),
  });
}
