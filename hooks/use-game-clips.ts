// @/hooks/use-game-clips.ts - version corrigée
"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getGameClips,
  getGameClipById,
  interactWithGameClip,
  createGameClip,
} from "@/actions/game-clips";
import { useAuthContext } from "@/contexts/auth-context";
import { toast } from "sonner";
import { useCallback } from "react";
import { ClipFilters } from "@/types/clips";

export function useGameClips(filters: ClipFilters = {}) {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  // Infinite query for clips
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["game-clips", filters, user?.id],
// @/hooks/use-game-clips.ts - version corrigée
    queryFn: async ({ pageParam = 0 }) => {
      // Strip unsupported fields before passing to getGameClips
      const {
        minDuration,
        maxDuration,
        createdFrom,
        createdTo,
        sortBy,
        sortOrder,
        ...safeFilters
      } = filters;

      const result = await getGameClips({
        filters: {
          ...safeFilters,
          limit: safeFilters.limit || 10,
          offset: pageParam,
          ...(sortBy && sortBy !== "comments" ? { sortBy } : {}),
          ...(sortOrder ? { sortOrder } : {}),
        },
        userId: user?.id,
      });
      return {
        data: result.data,
        total: result.total,
        nextOffset: pageParam + (safeFilters.limit || 10),
      };
    },
    getNextPageParam: (lastPage, allPages) => {
      const totalLoaded = allPages.flatMap(p => p.data).length;
      return totalLoaded < lastPage.total ? lastPage.nextOffset : undefined;
    },
    initialPageParam: 0,
  });

  const clips = data?.pages.flatMap((page) => page.data) || [];

  // Mutation for interactions
  const interactMutation = useMutation({
    mutationFn: async ({
      clipId,
      type,
    }: {
      clipId: string;
      type: "LIKE" | "BOOKMARK" | "VIEW";
    }) => {
      if (!user?.id) throw new Error("User required");
      return await interactWithGameClip(clipId, user.id, type);
    },
    onSuccess: (_, { clipId, type }) => {
      if (type !== "VIEW") {
        queryClient.invalidateQueries({ queryKey: ["game-clips"] });
        queryClient.invalidateQueries({ queryKey: ["game-clip", clipId] });
      }
    },
    onError: (error) => {
      toast.error("Erreur lors de l'interaction");
      console.error(error);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: {
      videoUrl: string;
      imageUrls: string;
      caption?: string;
      shopId?: string;
      gameId?: string;
      isPublic?: boolean;
    }) => {
      if (!user?.id) throw new Error("User required");
      return await createGameClip({ 
        data: { 
          ...data, 
          isPublic: data.isPublic ?? true 
        }, 
        userId: user.id 
      });
    },
    onSuccess: () => {
      toast.success("Clip créé avec succès");
      queryClient.invalidateQueries({ queryKey: ["game-clips"] });
    },
    onError: (error) => {
      toast.error("Erreur lors de la création du clip");
      console.error(error);
    },
  });

  const toggleLike = useCallback(
    (clipId: string) => {
      if (!user) {
        toast.error("Connectez-vous pour liker");
        return;
      }
      interactMutation.mutate({ clipId, type: "LIKE" });
    },
    [user, interactMutation]
  );

  const recordView = useCallback(
    (clipId: string) => {
      if (!user) return;
      interactMutation.mutate({ clipId, type: "VIEW" });
    },
    [user, interactMutation]
  );

  return {
    clips,
    loading: isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refresh: refetch,
    toggleLike,
    recordView,
    createClip: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}