"use client";

import React from "react";
import { GameItemCard } from "./game-item-card";
import { GameItemWithRelations } from "@/database/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Package, RefreshCw } from "lucide-react";
import { Typography } from "@/components/ui/typography";

interface GamesGridProps {
  items: GameItemWithRelations[];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean | undefined;
  onLoadMore: () => void;
  emptyMessage?: React.ReactNode;
}

export function GamesGrid({
  items,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  onLoadMore,
  emptyMessage,
}: GamesGridProps) {
  if (isLoading && items.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="h-40 w-full rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center border-2 border-dashed border-muted rounded-2xl bg-muted/10">
        <Package className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <Typography variant="h4" weight="bold" className="mb-2">
          Aucun item trouvé
        </Typography>
        <Typography variant="body-base" theme="muted" className="max-w-md">
          {emptyMessage ||
            "Nous n'avons trouvé aucun item correspondant à vos critères. Essayez de modifier vos filtres ou revenez plus tard."}
        </Typography>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <GameItemCard key={item.id} item={item} />
        ))}
      </div>

      {hasNextPage && (
        <div className="flex justify-center pt-8 pb-12">
          <Button
            variant="outline"
            size="lg"
            onClick={() => onLoadMore()}
            disabled={isFetchingNextPage}
            className="px-12 border-primary/20 hover:bg-primary/5 group"
          >
            {isFetchingNextPage ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Chargement...
              </>
            ) : (
              "Charger plus d'items"
            )}
          </Button>
        </div>
      )}

      {!hasNextPage && items.length > 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm flex items-center justify-center gap-2">
          <div className="h-[1px] w-12 bg-muted-foreground/20" />
          Vous avez parcouru tous les items disponibles
          <div className="h-[1px] w-12 bg-muted-foreground/20" />
        </div>
      )}
    </div>
  );
}
