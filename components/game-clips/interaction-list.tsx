// components/game-clips/interaction-list.tsx
"use client";

import React from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getEntityInteractionsWithRelations } from "@/actions/interactions";
import { Typography } from "../ui/typography";

type EntityType =
  | "GAMECLIP"
  | "POST"
  | "PRODUCT"
  | "SHOP"
  | "USER"
  | "GAME"
  | "TOURNAMENT"
  | "BLOG"
  | "MESSAGE"
  | "TEAM"
  | "THEME"
  | "NEWS"
  | "GROUP"
  | "ANNOUNCEMENT"
  | "SERVICE"
  | "GUIDE"
  | "COMMENT"
  | "MATCH"
  | "GAME_ITEM"
  | "PARTNER"
  | "EDITION";

// components/game-clips/interaction-list.tsx
interface InteractionListProps {
  entityId: string;
  entityType: EntityType;
  interactionType: "LIKE" | "FOLLOW" | "BOOKMARK" | "VIEW";
  className?: string;
  limit?: number;
}

export function InteractionList({
  entityId,
  entityType,
  interactionType,
  className,
  limit = 20,
}: InteractionListProps) {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ["interactions", entityId, entityType, interactionType],
      queryFn: async ({ pageParam = 1 }) => {
        const types: ("LIKE" | "FOLLOW" | "BOOKMARK" | "VIEW")[] = [interactionType];
        const res = await getEntityInteractionsWithRelations(
          entityId,
          entityType,
          { types },
          { page: pageParam, limit },
          { sortBy: "createdAt", sortOrder: "desc" },
        );
        return {
          items: res.data,
          nextPage: res.pagination.hasNext ? pageParam + 1 : undefined,
        };
      },
      getNextPageParam: (lastPage) => lastPage.nextPage,
      initialPageParam: 1,
      enabled: !!entityId && !!entityType,
    });

  const interactions = data?.pages.flatMap((page) => page.items) || [];

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-white/30" />
      </div>
    );
  }

  if (interactions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4 opacity-20">👥</div>
        <Typography variant="body-sm" className="text-white/40">
          Aucune interaction pour le moment
        </Typography>
      </div>
    );
  }

  const getTitle = () => {
    switch (interactionType) {
      case "LIKE":
        return "J'aime";
      case "BOOKMARK":
        return "Sauvegardes";
      case "FOLLOW":
        return "Abonnés";
      default:
        return "Interactions";
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2 mb-4">
        <Typography variant="body-sm" className="text-white/40 uppercase text-xs font-bold tracking-wider">
          {getTitle()} · {interactions.length}
        </Typography>
      </div>
      
      {interactions.map((interaction) => (
        <div
          key={interaction.id}
          className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors"
        >
          <Avatar className="h-10 w-10 border border-white/10">
            <AvatarImage src={interaction.user?.profileImage || ""} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {interaction.user?.username?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">
                @{interaction.user?.username}
              </span>
              <span className="text-[10px] text-white/30">
                {interaction.createdAt
                  ? new Date(interaction.createdAt).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                    })
                  : null}
              </span>
            </div>
            <span className="text-xs text-white/40">
              {interaction.user?.fullName || "Utilisateur"}
            </span>
          </div>
        </div>
      ))}

      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className="w-full py-3 text-xs font-bold uppercase tracking-wider text-white/30 hover:text-white/60 transition-colors"
        >
          {isFetchingNextPage ? (
            <Loader2 className="h-4 w-4 animate-spin mx-auto" />
          ) : (
            "Charger plus"
          )}
        </button>
      )}
    </div>
  );
}