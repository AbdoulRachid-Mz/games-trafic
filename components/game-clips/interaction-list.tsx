// components/game-clips/interaction-list.tsx
"use client";

import React, { useEffect } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useClipEngineStore } from "@/hooks/use-clip-engine";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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

interface Interaction {
  id: string;
  type: string;
  createdAt: Date;
  user: {
    id: string;
    username: string;
    fullName?: string;
    profileImage?: string;
  };
}

interface InteractionListProps {
  entityId: string;
  entityType: EntityType;
  interactionType: "LIKE" | "SHARE" | "FOLLOW" | "BOOKMARK";
  className?: string;
}

function InteractionListContent({
  entityId,
  entityType,
  interactionType,
  className,
}: InteractionListProps) {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ["interactions", entityId, entityType, interactionType],
      queryFn: async ({ pageParam = 1 }) => {
        const res = await getEntityInteractionsWithRelations(
          entityId,
          entityType,
          { types: interactionType === "SHARE" ? ["VIEW"] : [interactionType] },
          { page: pageParam, limit: 20 },
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

  return (
    <div className={cn("space-y-2", className)}>
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
                  ? new Date(interaction.createdAt).toLocaleDateString(
                      "fr-FR",
                      {
                        day: "numeric",
                        month: "short",
                      },
                    )
                  : null}
              </span>
            </div>
            <span className="text-xs text-white/40">
              {interaction.user?.fullName || "Utilisateur"}
            </span>
          </div>
          <div className="text-xs text-white/20 uppercase font-bold">
            {interactionType.toLowerCase()}
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

// Sheet wrapper that pauses playback when open
interface InteractionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityId: string;
  entityType: EntityType;
  interactionType: "LIKE" | "SHARE" | "FOLLOW" | "BOOKMARK";
  title?: string;
}

export function InteractionSheet({
  open,
  onOpenChange,
  entityId,
  entityType,
  interactionType,
  title,
}: InteractionSheetProps) {
  const setGlobalPause = useClipEngineStore((s) => s.setGlobalPause);

  // Pause playback when sheet is open
  useEffect(() => {
    if (open) {
      setGlobalPause(true);
    } else {
      setGlobalPause(false);
    }
  }, [open, setGlobalPause]);

  const getTitle = () => {
    if (title) return title;
    switch (interactionType) {
      case "LIKE":
        return "Likes";
      case "BOOKMARK":
        return "Sauvegardes";
      case "SHARE":
        return "Partages";
      case "FOLLOW":
        return "Abonnes";
      default:
        return "Interactions";
    }
  };

  const getIcon = () => {
    switch (interactionType) {
      case "LIKE":
        return "❤️";
      case "BOOKMARK":
        return "🔖";
      case "SHARE":
        return "🔗";
      case "FOLLOW":
        return "👥";
      default:
        return "✨";
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[70vh] rounded-t-[2.5rem] border-t border-white/10 bg-[#0a0a0b] p-0 overflow-hidden"
      >
        <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mt-4 mb-2" />
        <SheetHeader className="px-6 pb-4 border-b border-white/5">
          <SheetTitle className="text-white flex items-center gap-3">
            <span className="text-lg">{getIcon()}</span>
            <span className="font-black tracking-tight text-xl">
              {getTitle()}
            </span>
          </SheetTitle>
        </SheetHeader>
        <div className="h-full overflow-y-auto pt-4 pb-32 px-4">
          <InteractionListContent
            entityId={entityId}
            entityType={entityType}
            interactionType={interactionType}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

export { InteractionListContent as InteractionList };
