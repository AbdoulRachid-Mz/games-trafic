// @/hooks/use-game-clips.ts
"use client";

import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getGameClips, getGameClipById, createGameClip, shareGameClip } from "@/actions/game-clips";
import { useAuthContext } from "@/contexts/auth-context";
import { toast } from "sonner";
import { useCallback } from "react";
import { ClipFilters, GameClipWithRelations } from "@/types/game-clips";

// @/hooks/use-game-clips.ts
export function useGameClips(filters: ClipFilters = {}) {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["game-clips", filters, user?.id],
    queryFn: async ({ pageParam = 0 }) => {
      const result = await getGameClips({
        filters: {
          ...filters,
          limit: filters.limit || 20,
          offset: pageParam,
          sortBy: filters.sortBy || "createdAt",
          sortOrder: filters.sortOrder || "desc",
        },
        userId: user?.id,
      });

      return {
        data: result.data as unknown as GameClipWithRelations[],
        total: result.total,
        nextOffset: pageParam + (filters.limit || 20),
      };
    },
    getNextPageParam: (lastPage, allPages) => {
      const totalLoaded = allPages.flatMap((p) => p.data).length;
      return totalLoaded < lastPage.total ? lastPage.nextOffset : undefined;
    },
    initialPageParam: 0,
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