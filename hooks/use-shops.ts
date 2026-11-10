"use client";

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
  getShopById,
  getShopByName,
  getShopsByOwner,
  getShops,
  getPopularShops,
  getVerifiedShops,
  getShopStats,
  getShopStatsById,
  createShop,
  updateShop,
  deleteShop,
  restoreShop,
  updateShopStats,
  incrementShopViews,
  updateShopTheme,
  addShopCategory,
  removeShopCategory,
} from "@/actions/shops";
import { ListQuery, PaginationResponse, ShopFilters } from "@/types/api";
import { NewShop, Shop, Theme } from "@/database/schema";
import {
  type ShopCard, type UserMini, type ShopMini,
} from "@/types/view-models";
import { useCallback, useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useDebounce } from "./use-debounce";

// ============================================================================
// QUERY KEYS FACTORY
// ============================================================================
export const shopKeys = {
  all: ["shops"] as const,
  lists: () => [...shopKeys.all, "list"] as const,
  list: (
    filters: ShopFilters | undefined,
    options: ListQuery<ShopFilters>["options"]
  ) => [...shopKeys.lists(), { filters, options }] as const,
  details: () => [...shopKeys.all, "detail"] as const,
  detail: (id: string | undefined, populate?: string[]) =>
    id
      ? ([...shopKeys.details(), id, { populate }] as const)
      : ([...shopKeys.details(), "undefined"] as const),
  byOwner: (ownerId: string | undefined, query?: ListQuery<ShopFilters>) =>
    ownerId
      ? ([...shopKeys.lists(), "owner", ownerId, query] as const)
      : ([...shopKeys.lists(), "owner", "undefined"] as const),
  popular: (limit?: number) => [...shopKeys.lists(), "popular", limit] as const,
  verified: (query?: ListQuery<ShopFilters>) =>
    [...shopKeys.lists(), "verified", query] as const,
  stats: (filters?: ShopFilters) =>
    [...shopKeys.all, "stats", filters] as const,
  statsById: (id: string | undefined) =>
    id
      ? ([...shopKeys.all, "stats", id] as const)
      : ([...shopKeys.all, "stats", "undefined"] as const),
};

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Hook to fetch a single shop by ID with optional population
 */
export function useShopById(
  id: string | undefined,
  options?: { populate?: string[] },
  queryOpts?: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof getShopById>>, Error>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: shopKeys.detail(id, options?.populate),
    queryFn: () => (id ? getShopById(id, options) : null),
    enabled: !!id && id !== "" && id !== "undefined",
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...queryOpts,
  });
}

/**
 * Hook to fetch a single shop by name
 */
export function useShopByName(
  name: string | undefined,
  queryOpts?: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof getShopByName>>, Error>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: shopKeys.detail(name),
    queryFn: () => (name ? getShopByName(name) : null),
    enabled: !!name,
    staleTime: 10 * 60 * 1000,
    ...queryOpts,
  });
}

/**
 * Hook to fetch paginated shops by owner
 */
export function useShopsByOwner(
  ownerId: string | undefined,
  query: ListQuery<ShopFilters> = {},
  queryOpts?: Omit<
    UseQueryOptions<PaginationResponse<ShopCard>, Error>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: shopKeys.byOwner(ownerId, query),
    queryFn: () =>
      ownerId
        ? getShopsByOwner(ownerId, query)
        : {
          data: [],
          pagination: {
            page: 1,
            limit: 50,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          },
        },
    enabled: !!ownerId,
    staleTime: 10 * 60 * 1000,
    ...queryOpts,
  });
}

/**
 * Hook to fetch paginated shops with filters
 */
export function useShops(
  query: ListQuery<ShopFilters> = {},
  queryOpts?: Omit<
    UseQueryOptions<PaginationResponse<ShopCard>, Error>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: shopKeys.list(query.filters, query.options),
    queryFn: () => getShops(query),
    staleTime: 10 * 60 * 1000,
    ...queryOpts,
  });
}

/**
 * Hook to fetch popular shops
 */
export function usePopularShops(
  limit: number = 10,
  queryOpts?: Omit<UseQueryOptions<ShopCard[], Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: shopKeys.popular(limit),
    queryFn: () => getPopularShops(limit),
    staleTime: 10 * 60 * 1000,
    ...queryOpts,
  });
}

/**
 * Hook to fetch verified shops
 */
export function useVerifiedShops(
  query: ListQuery<ShopFilters> = {},
  queryOpts?: Omit<
    UseQueryOptions<PaginationResponse<ShopCard>, Error>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: shopKeys.verified(query),
    queryFn: () => getVerifiedShops(query),
    staleTime: 10 * 60 * 1000,
    ...queryOpts,
  });
}

/**
 * Hook to fetch shop statistics
 */
export function useShopStats(
  filters?: ShopFilters,
  queryOpts?: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof getShopStats>>, Error>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: shopKeys.stats(filters),
    queryFn: () => getShopStats(filters),
    staleTime: 10 * 60 * 1000,
    ...queryOpts,
  });
}

/**
 * Hook to fetch statistics for a specific shop
 */
export function useShopStatsById(
  shopId: string | undefined,
  queryOpts?: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof getShopStatsById>>, Error>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: shopKeys.statsById(shopId),
    queryFn: () => (shopId ? getShopStatsById(shopId) : null),
    enabled: !!shopId && shopId !== "" && shopId !== "undefined",
    staleTime: 10 * 60 * 1000,
    ...queryOpts,
  });
}

// ============================================================================
// INFINITE QUERIES
// ============================================================================

/**
 * Infinite scroll hook for shops
 */
export function useInfiniteShops(
  query: ListQuery<ShopFilters> = {},
  queryOpts?: Omit<
    UseInfiniteQueryOptions<
      PaginationResponse<ShopCard>,                // TQueryFnData
      Error,                                  // TError
      InfiniteData<PaginationResponse<ShopCard>>, // TData
      readonly unknown[],                     // TQueryKey
      number                                  // ✅ TPageParam
    >,
    "queryKey" | "queryFn" | "getNextPageParam" | "initialPageParam"
  >
): UseInfiniteQueryResult<
  InfiniteData<PaginationResponse<ShopCard>, number>,
  Error
> {
  // @ts-ignore
  return useInfiniteQuery<
    PaginationResponse<ShopCard>,                 // TQueryFnData
    Error,                                   // TError
    InfiniteData<PaginationResponse<ShopCard>>,  // TData
    readonly unknown[],                      // TQueryKey
    number                                   // ✅ TPageParam
  >({
    queryKey: shopKeys.list(query.filters, query.options),

    queryFn: ({ pageParam = 1 }) =>
      getShops({
        ...query,
        pagination: {
          ...query.pagination,
          page: pageParam,
          limit: query.pagination?.limit ?? 50,
        },
      }),

    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNext
        ? lastPage.pagination.page + 1
        : undefined,

    initialPageParam: 1,
    staleTime: 10 * 60 * 1000,

    ...queryOpts,
  });
}



// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Hook to create a new shop
 */
export function useCreateShop(
  mutationOpts?: Omit<UseMutationOptions<Shop, Error, NewShop>, "mutationFn">
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createShop,
    onSuccess: (data, variables, onMutateResult, context) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: shopKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: shopKeys.byOwner(data.ownerId),
      });
      mutationOpts?.onSuccess?.(data, variables, onMutateResult, context);
    },
    ...mutationOpts,
  });
}

/**
 * Hook to update a shop
 */
export function useUpdateShop(
  mutationOpts?: Omit<
    UseMutationOptions<Shop, Error, { id: string; data: Partial<NewShop> }>,
    "mutationFn"
  >
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateShop(id, data),
    onSuccess: (data, variables, onMutateResult, context) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({
        queryKey: shopKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: shopKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: shopKeys.byOwner(data.ownerId),
      });
      mutationOpts?.onSuccess?.(data, variables, onMutateResult, context);
    },
    ...mutationOpts,
  });
}

/**
 * Hook to delete (soft delete) a shop
 */
export function useDeleteShop(
  mutationOpts?: Omit<UseMutationOptions<Shop, Error, string>, "mutationFn">
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteShop,
    onSuccess: (data, id, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: shopKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: shopKeys.byOwner(data.ownerId),
      });
      queryClient.removeQueries({ queryKey: shopKeys.detail(id) });
      mutationOpts?.onSuccess?.(data, id, onMutateResult, context);
    },
    ...mutationOpts,
  });
}

/**
 * Hook to restore a deleted shop
 */
export function useRestoreShop(
  mutationOpts?: Omit<UseMutationOptions<Shop, Error, string>, "mutationFn">
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: restoreShop,
    onSuccess: (data, id, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: shopKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: shopKeys.byOwner(data.ownerId),
      });
      mutationOpts?.onSuccess?.(data, id, onMutateResult, context);
    },
    ...mutationOpts,
  });
}

/**
 * Hook to update shop statistics
 */
export function useUpdateShopStats(
  mutationOpts?: Omit<
    UseMutationOptions<
      Shop,
      Error,
      { id: string; stats: Parameters<typeof updateShopStats>[1] }
    >,
    "mutationFn"
  >
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, stats }) => updateShopStats(id, stats),
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({
        queryKey: shopKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: shopKeys.statsById(variables.id),
      });
      mutationOpts?.onSuccess?.(data, variables, onMutateResult, context);
    },
    ...mutationOpts,
  });
}

/**
 * Hook to increment shop views
 */
export function useIncrementShopViews(
  mutationOpts?: Omit<UseMutationOptions<Shop, Error, string>, "mutationFn">
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: incrementShopViews,
    onSuccess: (data, id, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: shopKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: shopKeys.statsById(id) });
      mutationOpts?.onSuccess?.(data, id, onMutateResult, context);
    },
    ...mutationOpts,
  });
}

/**
 * Hook to update shop theme
 */
export function useUpdateShopTheme(
  mutationOpts?: Omit<
    UseMutationOptions<
      Shop,
      Error,
      { shopId: string; themeId: string | null; customTheme?: Theme }
    >,
    "mutationFn"
  >
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ shopId, themeId, customTheme }) =>
      updateShopTheme(shopId, themeId, customTheme),
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({
        queryKey: shopKeys.detail(variables.shopId),
      });
      mutationOpts?.onSuccess?.(data, variables, onMutateResult, context);
    },
    ...mutationOpts,
  });
}

/**
 * Hook to add a category to a shop
 */
export function useAddShopCategory(
  mutationOpts?: Omit<
    UseMutationOptions<void, Error, { shopId: string; categoryId: string }>,
    "mutationFn"
  >
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ shopId, categoryId }) => addShopCategory(shopId, categoryId),
    onSuccess: (_, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({
        queryKey: shopKeys.detail(variables.shopId, ["categories"]),
      });
      mutationOpts?.onSuccess?.(_, variables, onMutateResult, context);
    },
    ...mutationOpts,
  });
}

/**
 * Hook to remove a category from a shop
 */
export function useRemoveShopCategory(
  mutationOpts?: Omit<
    UseMutationOptions<void, Error, { shopId: string; categoryId: string }>,
    "mutationFn"
  >
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ shopId, categoryId }) =>
      removeShopCategory(shopId, categoryId),
    onSuccess: (_, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({
        queryKey: shopKeys.detail(variables.shopId, ["categories"]),
      });
      mutationOpts?.onSuccess?.(_, variables, onMutateResult, context);
    },
    ...mutationOpts,
  });
}

export function useShopsFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 🔗 Sync URL (pattern MatchesDashboardFilters) : l'URL est la source de
  // vérité — un refresh/lien partagé reconstruit exactement la même liste.
  const q = searchParams.get("q") || "";
  const country = searchParams.get("country") || undefined;
  const category = searchParams.get("category") || undefined;
  const countriesParam = searchParams.get("countries");
  const countries = countriesParam?.split(",").filter(Boolean) || [];
  const verifiedParam = searchParams.get("verified");
  const verified = verifiedParam === "true" ? true : undefined;

  const [searchQuery, setSearchQuery] = useState(q);

  // Debounce pour la recherche
  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    if (debouncedSearch === q) return;
    const params = new URLSearchParams(searchParams.toString());
    if (debouncedSearch) params.set("q", debouncedSearch);
    else params.delete("q");
    router.replace(`${pathname}?${params.toString()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  // Filtres dérivés de l'URL — même shape que l'ancien state local.
  const filters = {
    search: q,
    category,
    country,
    countries: countries.length > 0 ? countries : undefined,
    verified,
  };

  // Vérifie s'il y a des filtres actifs
  const hasActiveFilters =
    !!q || !!country || !!category || verifiedParam === "true";

  // Mettre à jour un filtre → écrit dans l'URL.
  const updateFilter = useCallback(
    (key: string, value: any) => {
      const params = new URLSearchParams(searchParams.toString());
      const urlKey = key === "search" ? "q" : key;
      const isUndefined = value === "all" || value === "" || value === undefined || value === null;
      if (isUndefined) {
        params.delete(urlKey);
      } else if (Array.isArray(value)) {
        params.set(urlKey, value.join(","));
      } else if (typeof value === "boolean") {
        if (value) params.set(urlKey, "true");
        else params.delete(urlKey);
      } else {
        params.set(urlKey, String(value));
      }
      router.replace(`${pathname}?${params.toString()}`);
    },
    [searchParams, router, pathname],
  );

  // Réinitialiser tous les filtres (ne touche que les filtres, pas viewMode).
  const resetFilters = useCallback(() => {
    setSearchQuery("");
    const params = new URLSearchParams(searchParams.toString());
    ["q", "country", "countries", "category", "verified"].forEach((k) =>
      params.delete(k),
    );
    router.replace(`${pathname}?${params.toString()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, router, pathname]);

  return {
    filters,
    searchQuery,
    setSearchQuery,
    updateFilter,
    resetFilters,
    hasActiveFilters,
  };
}