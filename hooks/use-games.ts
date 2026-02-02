import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import {
  getGameById,
  getGameByName,
  getGames,
  getGameStats,
  getGameItemById,
  getGameItemsByGameId,
  getGameItems,
  getGameItemRequestById,
  getGameItemRequestsByUserId,
  getGameItemRequests,
  createGame,
  updateGame,
  deleteGame,
  createGameItem,
  updateGameItem,
  deleteGameItem,
  createGameItemRequest,
  updateGameItemRequest,
  processGameItemRequest,
  deleteGameItemRequest,
} from "@/actions/games";
import type {
  Game,
  GameItem,
  Request,
  NewGame,
  NewGameItem,
  NewRequest,
} from "@/database/schema";
import {
  GameFilters,
  GameItemFilters,
  GameItemRequestFilters,
  ListQuery,
} from "@/types/api";

// ==========================
// Query Keys Factory
// ==========================
const gameKeys = {
  all: ["games"] as const,
  lists: () => [...gameKeys.all, "list"] as const,
  list: (filters: ListQuery<GameFilters>) =>
    [...gameKeys.lists(), filters] as const,
  details: () => [...gameKeys.all, "detail"] as const,
  detail: (id: string) => [...gameKeys.details(), id] as const,
  stats: () => [...gameKeys.all, "stats"] as const,
  statsWithFilters: (filters?: GameFilters) =>
    [...gameKeys.stats(), filters] as const,
  items: {
    all: ["gameItems"] as const,
    lists: () => [...gameKeys.items.all, "list"] as const,
    list: (filters: ListQuery<GameItemFilters>) =>
      [...gameKeys.items.lists(), filters] as const,
    byGame: (gameId: string, filters?: ListQuery<GameItemFilters>) =>
      [...gameKeys.items.lists(), "byGame", gameId, filters] as const,
    detail: (id: string) => [...gameKeys.items.all, "detail", id] as const,
  },
  requests: {
    all: ["gameItemRequests"] as const,
    lists: () => [...gameKeys.requests.all, "list"] as const,
    list: (filters: ListQuery<GameItemRequestFilters>) =>
      [...gameKeys.requests.lists(), filters] as const,
    byUser: (userId: string, filters?: ListQuery<GameItemRequestFilters>) =>
      [...gameKeys.requests.lists(), "byUser", userId, filters] as const,
    detail: (id: string) => [...gameKeys.requests.all, "detail", id] as const,
  },
};

// ==========================
// Games Queries
// ==========================
export function useGameById(id: string) {
  return useQuery({
    queryKey: gameKeys.detail(id),
    queryFn: () => getGameById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useGameByName(name: string) {
  return useQuery({
    queryKey: [...gameKeys.details(), "byName", name],
    queryFn: () => getGameByName(name),
    enabled: !!name,
    staleTime: 5 * 60 * 1000,
  });
}

export function useGames(query: ListQuery<GameFilters> = {}) {
  return useInfiniteQuery({
    queryKey: gameKeys.list(query),
    queryFn: ({ pageParam = query.pagination?.page ?? 1 }) =>
      getGames({
        ...query,
        pagination: {
          page: pageParam,
          limit: query.pagination?.limit ?? 20,
          offset: query.pagination?.offset,
        },
      }),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNext ? lastPage.pagination.page + 1 : undefined,
    getPreviousPageParam: (firstPage) =>
      firstPage.pagination.hasPrev ? firstPage.pagination.page - 1 : undefined,
    initialPageParam: query.pagination?.page ?? 1,
    staleTime: 5 * 60 * 1000,
  });
}

export function useGameStats(filters?: GameFilters) {
  return useQuery({
    queryKey: gameKeys.statsWithFilters(filters),
    queryFn: () => getGameStats(filters),
    staleTime: 5 * 60 * 1000,
  });
}

// ==========================
// Game Items Queries
// ==========================
export function useGameItemById(id: string) {
  return useQuery({
    queryKey: gameKeys.items.detail(id),
    queryFn: () => getGameItemById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useGameItemsByGameId(
  gameId: string,
  query: ListQuery<GameItemFilters> = {}
) {
  return useInfiniteQuery({
    queryKey: gameKeys.items.byGame(gameId, query),
    queryFn: ({ pageParam = query.pagination?.page ?? 1 }) =>
      getGameItemsByGameId(gameId, {
        ...query,
        pagination: {
          page: pageParam,
          limit: query.pagination?.limit ?? 20,
          offset: query.pagination?.offset,
        },
      }),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNext ? lastPage.pagination.page + 1 : undefined,
    getPreviousPageParam: (firstPage) =>
      firstPage.pagination.hasPrev ? firstPage.pagination.page - 1 : undefined,
    initialPageParam: query.pagination?.page ?? 1,
    enabled: !!gameId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useGameItems(query: ListQuery<GameItemFilters> = {}) {
  return useInfiniteQuery({
    queryKey: gameKeys.items.list(query),
    queryFn: ({ pageParam = query.pagination?.page ?? 1 }) =>
      getGameItems({
        ...query,
        pagination: {
          page: pageParam,
          limit: query.pagination?.limit ?? 20,
          offset: query.pagination?.offset,
        },
      }),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNext ? lastPage.pagination.page + 1 : undefined,
    getPreviousPageParam: (firstPage) =>
      firstPage.pagination.hasPrev ? firstPage.pagination.page - 1 : undefined,
    initialPageParam: query.pagination?.page ?? 1,
    staleTime: 5 * 60 * 1000,
  });
}

// ==========================
// Game Item Requests Queries
// ==========================
export function useGameItemRequestById(id: string) {
  return useQuery({
    queryKey: gameKeys.requests.detail(id),
    queryFn: () => getGameItemRequestById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useGameItemRequestsByUserId(
  userId: string,
  query: ListQuery<GameItemRequestFilters> = {}
) {
  return useInfiniteQuery({
    queryKey: gameKeys.requests.byUser(userId, query),
    queryFn: ({ pageParam = query.pagination?.page ?? 1 }) =>
      getGameItemRequestsByUserId(userId, {
        ...query,
        pagination: {
          page: pageParam,
          limit: query.pagination?.limit ?? 20,
          offset: query.pagination?.offset,
        },
      }),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNext ? lastPage.pagination.page + 1 : undefined,
    getPreviousPageParam: (firstPage) =>
      firstPage.pagination.hasPrev ? firstPage.pagination.page - 1 : undefined,
    initialPageParam: query.pagination?.page ?? 1,
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useGameItemRequests(
  query: ListQuery<GameItemRequestFilters> = {}
) {
  return useInfiniteQuery({
    queryKey: gameKeys.requests.list(query),
    queryFn: ({ pageParam = query.pagination?.page ?? 1 }) =>
      getGameItemRequests({
        ...query,
        pagination: {
          page: pageParam,
          limit: query.pagination?.limit ?? 20,
          offset: query.pagination?.offset,
        },
      }),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNext ? lastPage.pagination.page + 1 : undefined,
    getPreviousPageParam: (firstPage) =>
      firstPage.pagination.hasPrev ? firstPage.pagination.page - 1 : undefined,
    initialPageParam: query.pagination?.page ?? 1,
    staleTime: 5 * 60 * 1000,
  });
}

// ==========================
// Mutations
// ==========================
export function useCreateGame() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: NewGame) => createGame(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gameKeys.lists() });
      queryClient.invalidateQueries({ queryKey: gameKeys.stats() });
    },
  });
}

export function useUpdateGame() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<NewGame> }) =>
      updateGame(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: gameKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: gameKeys.lists() });
      queryClient.invalidateQueries({ queryKey: gameKeys.stats() });
    },
  });
}

export function useDeleteGame() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteGame(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gameKeys.lists() });
      queryClient.invalidateQueries({ queryKey: gameKeys.stats() });
    },
  });
}

export function useCreateGameItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: NewGameItem) => createGameItem(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: gameKeys.items.byGame(variables.gameId),
      });
      queryClient.invalidateQueries({ queryKey: gameKeys.items.lists() });
    },
  });
}

export function useUpdateGameItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<NewGameItem> }) =>
      updateGameItem(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: gameKeys.items.detail(id) });
      queryClient.invalidateQueries({ queryKey: gameKeys.items.lists() });
    },
  });
}

export function useDeleteGameItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteGameItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gameKeys.items.lists() });
    },
  });
}

export function useCreateGameItemRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: NewRequest) => createGameItemRequest(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: gameKeys.requests.byUser(variables.userId),
      });
      queryClient.invalidateQueries({ queryKey: gameKeys.requests.lists() });
    },
  });
}

export function useUpdateGameItemRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<NewRequest> }) =>
      updateGameItemRequest(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: gameKeys.requests.detail(id) });
      queryClient.invalidateQueries({ queryKey: gameKeys.requests.lists() });
    },
  });
}

export function useProcessGameItemRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      processedByUserId,
      status,
      adminNotes,
    }: {
      id: string;
      processedByUserId: string;
      status: "COMPLETED" | "FAILED" | "CANCELLED";
      adminNotes?: string;
    }) => processGameItemRequest(id, processedByUserId, status, adminNotes),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: gameKeys.requests.detail(id) });
      queryClient.invalidateQueries({ queryKey: gameKeys.requests.lists() });
    },
  });
}

export function useDeleteGameItemRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteGameItemRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gameKeys.requests.lists() });
    },
  });
}
