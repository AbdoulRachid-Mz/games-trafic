import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import {
  getCategories,
  getCategoryById,
  getCategoryBySlug,
  getRootCategories,
  getCategoryChildren,
  getCategoryTree,
  getCategoriesByEntityType,
  getCategoryStats,
  createCategory,
  updateCategory,
  deleteCategory,
  restoreCategory,
  updateCategoryItemCount,
  attachCategoryToEntity,
  detachCategoryFromEntity,
  getEntityCategories,
  getCategoryEntities,
} from "@/actions/categories";
import type { Category, NewCategory, EntityCategory, CategoryWithChildren } from "@/database/schema";
import type {
  CategoryFilters,
  ListQuery,
  PaginationResponse,
  QueryOptions,
} from "@/types/api";

// Query keys factory
const categoryKeys = {
  all: ["categories"] as const,
  lists: () => [...categoryKeys.all, "list"] as const,
  list: (filters: ListQuery<CategoryFilters>) =>
    [...categoryKeys.lists(), filters] as const,
  details: () => [...categoryKeys.all, "detail"] as const,
  detail: (id: string) => [...categoryKeys.details(), id] as const,
  slug: (slug: string) => [...categoryKeys.details(), "slug", slug] as const,
  roots: () => [...categoryKeys.all, "roots"] as const,
  children: (parentId: string) =>
    [...categoryKeys.all, "children", parentId] as const,
  tree: () => [...categoryKeys.all, "tree"] as const,
  entityType: (entityType: string) =>
    [...categoryKeys.all, "entity-type", entityType] as const,
  stats: (filters?: CategoryFilters) =>
    [...categoryKeys.all, "stats", filters] as const,
  entityCategories: (entityId: string, entityType: string) =>
    [...categoryKeys.all, "entity", entityId, entityType] as const,
  categoryEntities: (categoryId: string, entityType?: string) =>
    [...categoryKeys.all, "category-entities", categoryId, entityType] as const,
};

// ============================================================================
// QUERIES
// ============================================================================

export function useCategories(query: ListQuery<CategoryFilters> = {}) {
  return useQuery<PaginationResponse<Category>, Error>({
    queryKey: categoryKeys.list(query),
    queryFn: () => getCategories(query),
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 20 * 60 * 1000, // 20 minutes
  });
}

export function useInfiniteCategories(query: ListQuery<CategoryFilters> = {}) {
  return useInfiniteQuery<PaginationResponse<Category>, Error>({
    queryKey: [...categoryKeys.list(query), "infinite"],
    queryFn: ({ pageParam = 1 }) =>
      getCategories({
        ...query,
        pagination: {
          ...query.pagination,
          page: pageParam as number,
          limit: query.pagination?.limit ?? 10,
        },
      }),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNext ? lastPage.pagination.page + 1 : undefined,
    getPreviousPageParam: (firstPage) =>
      firstPage.pagination.hasPrev ? firstPage.pagination.page - 1 : undefined,
    initialPageParam: 1,
    staleTime: 15 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
  });
}

export function useCategoryById(id: string, options?: { populate?: string[] }) {
  return useQuery<CategoryWithChildren | null, Error>({
    queryKey: categoryKeys.detail(id),
    queryFn: () => getCategoryById(id, options),
    enabled: !!id,
    staleTime: 15 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
  });
}

export function useCategoryBySlug(slug: string) {
  return useQuery<Category | null, Error>({
    queryKey: categoryKeys.slug(slug),
    queryFn: () => getCategoryBySlug(slug),
    enabled: !!slug,
    staleTime: 15 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
  });
}

export function useRootCategories(options?: QueryOptions) {
  return useQuery<CategoryWithChildren[], Error>({
    queryKey: categoryKeys.roots(),
    queryFn: () => getRootCategories(options),
    staleTime: 15 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
  });
}

export function useCategoryChildren(parentId: string) {
  return useQuery<CategoryWithChildren[], Error>({
    queryKey: categoryKeys.children(parentId),
    queryFn: () => getCategoryChildren(parentId),
    enabled: !!parentId,
    staleTime: 15 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
  });
}

export function useCategoryTree() {
  return useQuery<CategoryWithChildren[], Error>({
    queryKey: categoryKeys.tree(),
    queryFn: getCategoryTree,
    staleTime: 15 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
  });
}

export function useCategoriesByEntityType(
  entityType: string,
  options?: QueryOptions
) {
  return useQuery<Category[], Error>({
    queryKey: categoryKeys.entityType(entityType),
    queryFn: () => getCategoriesByEntityType(entityType, options),
    enabled: !!entityType,
    staleTime: 15 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
  });
}

export function useCategoryStats(filters?: CategoryFilters) {
  return useQuery({
    queryKey: categoryKeys.stats(filters),
    queryFn: () => getCategoryStats(filters),
    staleTime: 15 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
  });
}

export function useEntityCategories(entityId: string, entityType: string) {
  return useQuery<CategoryWithChildren[], Error>({
    queryKey: categoryKeys.entityCategories(entityId, entityType),
    queryFn: () => getEntityCategories(entityId, entityType),
    enabled: !!entityId && !!entityType,
    staleTime: 15 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
  });
}

export function useCategoryEntities(categoryId: string, entityType?: string) {
  return useQuery<EntityCategory[], Error>({
    queryKey: categoryKeys.categoryEntities(categoryId, entityType),
    queryFn: () => getCategoryEntities(categoryId, entityType),
    enabled: !!categoryId,
    staleTime: 15 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
  });
}

// ============================================================================
// MUTATIONS
// ============================================================================

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation<Category, Error, NewCategory>({
    mutationFn: createCategory,
    onSuccess: (newCategory) => {
      // Invalidate lists and tree
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: categoryKeys.tree() });
      queryClient.invalidateQueries({ queryKey: categoryKeys.roots() });
      // Add new category to cache
      queryClient.setQueryData(
        categoryKeys.detail(newCategory.id),
        newCategory
      );
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation<
    Category,
    Error,
    { id: string; data: Partial<NewCategory> }
  >({
    mutationFn: ({ id, data }) => updateCategory(id, data),
    onSuccess: (updatedCategory) => {
      // Update cached category
      queryClient.setQueryData(
        categoryKeys.detail(updatedCategory.id),
        updatedCategory
      );
      // Invalidate lists and tree
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: categoryKeys.tree() });
      queryClient.invalidateQueries({ queryKey: categoryKeys.roots() });
      // Invalidate children if parent changed
      queryClient.invalidateQueries({
        queryKey: categoryKeys.children(updatedCategory.id),
      });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation<Category, Error, string>({
    mutationFn: deleteCategory,
    onSuccess: (deletedCategory) => {
      // Remove from cache
      queryClient.removeQueries({
        queryKey: categoryKeys.detail(deletedCategory.id),
      });
      // Invalidate lists and tree
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: categoryKeys.tree() });
      queryClient.invalidateQueries({ queryKey: categoryKeys.roots() });
      // Invalidate parent children
      if (deletedCategory.parentId) {
        queryClient.invalidateQueries({
          queryKey: categoryKeys.children(deletedCategory.parentId),
        });
      }
    },
  });
}

export function useRestoreCategory() {
  const queryClient = useQueryClient();

  return useMutation<Category, Error, string>({
    mutationFn: restoreCategory,
    onSuccess: (restoredCategory) => {
      // Update cached category
      queryClient.setQueryData(
        categoryKeys.detail(restoredCategory.id),
        restoredCategory
      );
      // Invalidate lists and tree
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: categoryKeys.tree() });
      queryClient.invalidateQueries({ queryKey: categoryKeys.roots() });
    },
  });
}

export function useUpdateCategoryItemCount() {
  const queryClient = useQueryClient();

  return useMutation<
    Category,
    Error,
    { categoryId: string; increment?: number }
  >({
    mutationFn: ({ categoryId, increment }) =>
      updateCategoryItemCount(categoryId, increment),
    onSuccess: (updatedCategory) => {
      // Update cached category
      queryClient.setQueryData(
        categoryKeys.detail(updatedCategory.id),
        updatedCategory
      );
      // Invalidate lists and stats
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: categoryKeys.stats() });
    },
  });
}

export function useAttachCategoryToEntity() {
  const queryClient = useQueryClient();

  return useMutation<
    EntityCategory,
    Error,
    { entityId: string; entityType: string; categoryId: string }
  >({
    mutationFn: ({ entityId, entityType, categoryId }) =>
      attachCategoryToEntity(entityId, entityType, categoryId),
    onSuccess: (_, variables) => {
      // Invalidate entity categories
      queryClient.invalidateQueries({
        queryKey: categoryKeys.entityCategories(
          variables.entityId,
          variables.entityType
        ),
      });
      // Invalidate category entities
      queryClient.invalidateQueries({
        queryKey: categoryKeys.categoryEntities(variables.categoryId),
      });
      // Invalidate category stats
      queryClient.invalidateQueries({ queryKey: categoryKeys.stats() });
    },
  });
}

export function useDetachCategoryFromEntity() {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    Error,
    { entityId: string; entityType: string; categoryId: string }
  >({
    mutationFn: ({ entityId, entityType, categoryId }) =>
      detachCategoryFromEntity(entityId, entityType, categoryId),
    onSuccess: (_, variables) => {
      // Invalidate entity categories
      queryClient.invalidateQueries({
        queryKey: categoryKeys.entityCategories(
          variables.entityId,
          variables.entityType
        ),
      });
      // Invalidate category entities
      queryClient.invalidateQueries({
        queryKey: categoryKeys.categoryEntities(variables.categoryId),
      });
      // Invalidate category stats
      queryClient.invalidateQueries({ queryKey: categoryKeys.stats() });
    },
  });
}
