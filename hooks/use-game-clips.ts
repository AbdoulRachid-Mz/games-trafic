// hooks/use-game-clips.ts
"use client";

import { useInfiniteQuery, useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { getGameClips, getGameClipById, createGameClip, shareGameClip } from "@/actions/game-clips";
import { useAuthContext } from "@/contexts/auth-context";
import { toast } from "sonner";
import { useCallback } from "react";
import { type GameClipFilters, type PaginationResponse } from "@/types/api";
import { type GameClipCard } from "@/types/view-models";

export function useGameClips(filters: GameClipFilters = {}) {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery<
    PaginationResponse<GameClipCard>,
    Error,
    InfiniteData<PaginationResponse<GameClipCard>, number>,
    readonly unknown[],
    number
  >({
    queryKey: ["game-clips", filters, user?.id],
    queryFn: async ({ pageParam = 1 }) => {
      const result = await getGameClips({
        filters,
        pagination: {
          page: pageParam,
          limit: filters.limit || 20,
        },
        userId: user?.id,
      });

      return result;
    },
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNext ? lastPage.pagination.page + 1 : undefined,
    initialPageParam: 1,
  });

  const clips = data?.pages.flatMap((page) => page.data) || [];

  const createMutation = useMutation({
    mutationFn: async (data: {
      videoUrl: string;
      imageUrls?: string;
      caption?: string;
      shopId?: string;
      gameId?: string;
      isPublic?: boolean;
    }) => {
      if (!user?.id) throw new Error("User required");
      return await createGameClip({
        data: {
          ...data,
          isPublic: data.isPublic ?? true,
        },
        userId: user.id,
      });
    },
    onSuccess: () => {
      toast.success("Clip créé avec succès");
      queryClient.invalidateQueries({ queryKey: ["game-clips"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors de la création du clip");
      console.error(error);
    },
  });

  const shareMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error("User required");
      return await shareGameClip({ id, userId: user.id });
    },
    onSuccess: () => {
      toast.success("Clip partagé avec succès");
      queryClient.invalidateQueries({ queryKey: ["game-clips"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors du partage du clip");
      console.error(error);
    },
  });

  const getClip = useCallback(
    async (id: string) => {
      return await getGameClipById(id, user?.id);
    },
    [user?.id]
  );

  return {
    clips,
    loading: isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refresh: refetch,
    createClip: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    shareClip: shareMutation.mutateAsync,
    isSharing: shareMutation.isPending,
    getClip,
  };
}