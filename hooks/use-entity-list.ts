// hooks/use-entity-list.ts
"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useQuery,
  keepPreviousData,
  useQueryClient,
} from "@tanstack/react-query";
import {
  fetchEntities,
  deleteEntity,
  type EntityQueryParams,
} from "@/actions/entities";
import type { PaginationResponse } from "@/types/api";

// Types d'entités basés sur votre schéma
export type EntityType =
  | "users"
  | "shops"
  | "products"
  | "tournaments"
  | "teams"
  | "orders"
  | "transactions"
  | "games"
  | "posts"
  | "messages"
  | "themes"
  | "categories"
  | "tournament-editions"
  | "team-members"
  | "tournament-members"
  | "edition-registrations"
  | "matches"
  | "game-items"
  | "interactions"
  | "notifications"
  | "groups"
  | "announcements"
  | "blogs"
  | "services"
  | "guides"
  | "claims"
  | "subscriptions"
  | "game-clips"
  | "gameClips"
  | "partners";

export interface UseEntityListProps<T> {
  entityType: EntityType;
  defaultFilters?: EntityQueryParams;
  defaultLimit?: number;
  defaultPage?: number;
  initialData?: PaginationResponse<T>;
  enabled?: boolean;
  staleTime?: number;
  refetchInterval?: number;
}

export function useEntityList<T = any>({
  entityType,
  defaultFilters = {},
  defaultLimit = 20,
  defaultPage = 1,
  initialData,
  enabled = true,
  staleTime = 30000, // 30 secondes par défaut
  refetchInterval,
}: UseEntityListProps<T>) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  // États locaux pour la pagination et les filtres
  const [page, setPage] = useState(defaultPage);
  const [limit, setLimit] = useState(defaultLimit);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<EntityQueryParams>(defaultFilters);
  const [viewMode, setViewMode] = useState<"grid" | "list" | "table">("grid");

  // Construction des paramètres de requête
  const queryParams = useMemo((): EntityQueryParams => {
    const params: EntityQueryParams = {
      page,
      limit,
      ...filters,
    };

    if (searchTerm) {
      params.search = searchTerm;
    }

    return params;
  }, [page, limit, filters, searchTerm]);

  // Utilisation de TanStack Query avec server actions
  const {
    data: responseData,
    isLoading,
    isError,
    error,
    refetch,
    isPlaceholderData,
    isFetching,
  } = useQuery({
    queryKey: [entityType, "list", queryParams],
    queryFn: async () => {
      // Convertir le type d'entité (ex: 'game-clips' -> 'gameClips')
      const tableName = entityType.replace(/-([a-z])/g, (g) =>
        g[1].toUpperCase(),
      );
      return fetchEntities<T>(tableName, queryParams);
    },
    placeholderData: keepPreviousData,
    enabled: enabled,
    staleTime: staleTime,
    refetchInterval: refetchInterval,
    initialData: initialData,
  });

  // Extraction des données
  const data = responseData?.data || [];
  const total = responseData?.pagination?.total || 0;
  const totalPages = responseData?.pagination?.totalPages || 0;
  const hasNext = responseData?.pagination?.hasNext || false;
  const hasPrev = responseData?.pagination?.hasPrev || false;

  // Prefetch de la page suivante pour une navigation fluide
  const prefetchNextPage = useCallback(() => {
    if (hasNext) {
      const nextParams = { ...queryParams, page: page + 1 };
      const tableName = entityType.replace(/-([a-z])/g, (g) =>
        g[1].toUpperCase(),
      );

      queryClient.prefetchQuery({
        queryKey: [entityType, "list", nextParams],
        queryFn: () => fetchEntities<T>(tableName, nextParams),
        staleTime: staleTime,
      });
    }
  }, [hasNext, queryParams, page, entityType, queryClient, staleTime]);

  // Gestion des événements
  const handlePageChange = useCallback(
    (newPage: number) => {
      setPage(newPage);
      // Prefetch la page suivante
      if (newPage < totalPages) {
        const nextParams = { ...queryParams, page: newPage + 1 };
        const tableName = entityType.replace(/-([a-z])/g, (g) =>
          g[1].toUpperCase(),
        );

        queryClient.prefetchQuery({
          queryKey: [entityType, "list", nextParams],
          queryFn: () => fetchEntities<T>(tableName, nextParams),
          staleTime: staleTime,
        });
      }
    },
    [queryParams, totalPages, entityType, queryClient, staleTime],
  );

  const handleLimitChange = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  }, []);

  const handleSearchChange = useCallback((newSearch: string) => {
    setSearchTerm(newSearch);
    setPage(1);
  }, []);

  const handleFilterChange = useCallback((newFilters: EntityQueryParams) => {
    setFilters(newFilters);
    setPage(1);
  }, []);

  const handleSortChange = useCallback(
    (sortBy: string, sortOrder: "asc" | "desc") => {
      setFilters((prev) => ({
        ...prev,
        sortBy,
        sortOrder,
      }));
      setPage(1);
    },
    [],
  );

  const handleAdd = useCallback(() => {
    router.push(`/admin/${entityType}/new`);
  }, [router, entityType]);

  const handleEdit = useCallback(
    (item: any) => {
      if (item.id) {
        router.push(`/admin/${entityType}/${item.id}/edit`);
      }
    },
    [router, entityType],
  );

  const handleView = useCallback(
    (item: any) => {
      if (item.id) {
        router.push(`/${entityType}/${item.id}`);
      }
    },
    [router, entityType],
  );

  const handleDelete = useCallback(
    async (item: any) => {
      if (confirm(`Êtes-vous sûr de vouloir supprimer cet élément ?`)) {
        try {
          const result = await deleteEntity(entityType, item.id);

          if (result.success) {
            // Invalider le cache
            queryClient.invalidateQueries({ queryKey: [entityType] });
            refetch();
          } else {
            alert(`Erreur: ${result.error}`);
          }
        } catch (error) {
          console.error("Erreur lors de la suppression:", error);
        }
      }
    },
    [entityType, queryClient, refetch],
  );

  const handleExport = useCallback(
    async (format: "csv" | "excel" | "pdf" = "excel") => {
      try {
        // TODO: Implémenter l'export via server action
        console.log("Export not implemented yet", format);
      } catch (error) {
        console.error("Erreur lors de l'export:", error);
      }
    },
    [],
  );

  const resetFilters = useCallback(() => {
    setSearchTerm("");
    setFilters(defaultFilters);
    setPage(1);
  }, [defaultFilters]);

  // Invalider le cache pour forcer un rafraîchissement
  const invalidateCache = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [entityType] });
  }, [queryClient, entityType]);

  return {
    // Données
    data,
    total,
    loading: isLoading,
    fetching: isFetching,
    error: isError ? (error as Error).message : null,
    isPlaceholderData,

    // États
    page,
    limit,
    searchTerm,
    filters,
    viewMode,
    totalPages,
    hasNext,
    hasPrev,

    // Setters
    setPage: handlePageChange,
    setLimit: handleLimitChange,
    setSearchTerm: handleSearchChange,
    setFilters: handleFilterChange,
    setViewMode,
    setSort: handleSortChange,

    // Actions
    onAdd: handleAdd,
    onEdit: handleEdit,
    onView: handleView,
    onDelete: handleDelete,
    onExport: handleExport,
    onRefresh: refetch,
    onResetFilters: resetFilters,

    // Utilitaires
    refetch,
    invalidateCache,
    prefetchNextPage,
    hasData: data.length > 0,
    isEmpty: !isLoading && data.length === 0,

    // Méthodes de construction
    buildQueryParams: () => queryParams,
  };
}
