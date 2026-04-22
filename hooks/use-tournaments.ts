import {
    useQuery,
    useInfiniteQuery,
    useMutation,
    useQueryClient,
    InfiniteData,
} from "@tanstack/react-query";
import {
    getTournamentsWithEditions,
    getTournamentById,
    getTournamentEditionById,
    getTournaments,
    getTournamentEditions,
    getTournamentStats,
    getEditionDetailTree,
    createTournament,
    isUserTournamentOrganizer,
    updateTournamentMemberRole,
    deleteTournamentMember,
} from "@/actions/tournaments";
import type {
    Tournament,
    TournamentWithRelations,
    TournamentEdition,
    TournamentEditionWithRelations
} from "@/database/schema";
import type {
    ListQuery,
    PaginationResponse,
    TournamentFilters,
    TournamentEditionFilters,
} from "@/types/api";

// ============================================================================
// QUERY KEYS
// ============================================================================
export const tournamentKeys = {
    all: ["tournaments"] as const,
    lists: () => [...tournamentKeys.all, "list"] as const,
    list: (filters: TournamentFilters = {}) =>
        [...tournamentKeys.lists(), filters] as const,
    details: () => [...tournamentKeys.all, "detail"] as const,
    detail: (id: string, populate?: string[]) =>
        [...tournamentKeys.details(), id, ...(populate || [])] as const,
    editions: (tournamentId: string) =>
        [...tournamentKeys.detail(tournamentId), "editions"] as const,
    edition: (id: string, populate?: string[]) =>
        [...tournamentKeys.editions(""), id, ...(populate || [])] as const,
    stats: () => [...tournamentKeys.all, "stats"] as const,
    editionTree: (editionId: string) =>
        [...tournamentKeys.edition(editionId), "tree"] as const,
    organizer: (tournamentId: string, userId: string) =>
        [...tournamentKeys.detail(tournamentId), "organizer", userId] as const,
};

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Hook to fetch tournaments with their editions
 */
export function useTournamentsWithEditions(
    limit = 20,
    sortBy: keyof Tournament = "createdAt",
    sortOrder: "asc" | "desc" = "desc"
) {
    return useQuery({
        queryKey: [...tournamentKeys.lists(), { limit, sortBy, sortOrder }],
        queryFn: () => getTournamentsWithEditions(limit, sortBy, sortOrder),
        staleTime: 1000 * 60, // 1 minute
    });
}

/**
 * Hook to fetch a single tournament by ID
 */
export function useTournamentById(
    id: string,
    populate?: string[],
    enabled = true
) {
    return useQuery({
        queryKey: tournamentKeys.detail(id, populate),
        queryFn: () => getTournamentById(id, { populate }),
        enabled: !!id && id !== "" && enabled,
        staleTime: 1000 * 60,
    });
}

/**
 * Hook to fetch a tournament edition by ID
 */
export function useTournamentEditionById(
    id: string,
    populate?: string[],
    enabled = true
) {
    return useQuery({
        queryKey: tournamentKeys.edition(id, populate),
        queryFn: () => getTournamentEditionById(id, { populate }),
        enabled: !!id && id !== "" && enabled,
        staleTime: 1000 * 60,
    });
}

/**
 * Hook to fetch paginated tournaments with filters
 */
export function useTournamentsInfinite(
    filters: TournamentFilters = {},
    sortBy?: keyof Tournament,
    sortOrder?: "asc" | "desc"
) {
    return useInfiniteQuery<
        PaginationResponse<Tournament>,
        Error,
        InfiniteData<PaginationResponse<Tournament>>,
        readonly unknown[],
        number
    >({
        queryKey: tournamentKeys.list(filters),
        queryFn: ({ pageParam = 1 }) =>
            getTournaments({
                pagination: { page: pageParam, limit: 20 },
                filters,
                options: { sortBy, sortOrder },
            }),
        getNextPageParam: (lastPage) =>
            lastPage.pagination.hasNext ? lastPage.pagination.page + 1 : undefined,
        getPreviousPageParam: (firstPage) =>
            firstPage.pagination.hasPrev ? firstPage.pagination.page - 1 : undefined,
        initialPageParam: 1,
        staleTime: 1000 * 60,
    });
}

/**
 * Hook to fetch paginated tournament editions
 */
export function useTournamentEditionsInfinite(
    filters: TournamentEditionFilters = {},
    sortBy?: keyof TournamentEdition,
    sortOrder?: "asc" | "desc"
) {
    return useInfiniteQuery<
        PaginationResponse<TournamentEdition>,
        Error,
        InfiniteData<PaginationResponse<TournamentEdition>>,
        readonly unknown[],
        number
    >({
        queryKey: [...tournamentKeys.lists(), "editions", filters],
        queryFn: ({ pageParam = 1 }) =>
            getTournamentEditions({
                pagination: { page: pageParam, limit: 50 },
                filters,
                options: { sortBy, sortOrder },
            }),
        getNextPageParam: (lastPage) =>
            lastPage.pagination.hasNext ? lastPage.pagination.page + 1 : undefined,
        getPreviousPageParam: (firstPage) =>
            firstPage.pagination.hasPrev ? firstPage.pagination.page - 1 : undefined,
        initialPageParam: 1,
        staleTime: 1000 * 60,
    });
}

/**
 * Hook to fetch tournament statistics
 */
export function useTournamentStats(filters?: TournamentFilters) {
    return useQuery({
        queryKey: tournamentKeys.stats(),
        queryFn: () => getTournamentStats(filters),
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

/**
 * Hook to check if user is tournament organizer
 * (NOTE: useEditionDetailTree is now in use-tournament-editions.ts)
 */
export function useIsUserTournamentOrganizer(
    tournamentId: string,
    userId: string,
    enabled = true
) {
    return useQuery({
        queryKey: tournamentKeys.organizer(tournamentId, userId),
        queryFn: () => isUserTournamentOrganizer(tournamentId, userId),
        enabled: !!tournamentId && !!userId && enabled,
        staleTime: 1000 * 60 * 2, // 2 minutes
    });
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Hook to create a new tournament
 */
export function useCreateTournament() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createTournament,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: tournamentKeys.lists() });
            queryClient.invalidateQueries({ queryKey: tournamentKeys.stats() });
        },
    });
}

/**
 * Hook to update a tournament member role
 */
export function useUpdateTournamentMemberRole() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            memberId,
            role,
            isCoOrganizer,
        }: {
            memberId: string;
            role: string;
            isCoOrganizer: boolean;
        }) => updateTournamentMemberRole(memberId, role, isCoOrganizer),
        onSuccess: (_, { memberId }) => {
            queryClient.invalidateQueries({ queryKey: tournamentKeys.details() });
        },
    });
}

/**
 * Hook to delete a tournament member
 */
export function useDeleteTournamentMember() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteTournamentMember,
        onSuccess: (_, memberId) => {
            queryClient.invalidateQueries({ queryKey: tournamentKeys.details() });
        },
    });
}
