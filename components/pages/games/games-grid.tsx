// @/components/pages/games/games-grid.tsx
"use client";

import React from "react";
import { GameItemCard } from "./game-item-card";
import { GameItemWithRelations } from "@/database/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Package, RefreshCw, Layers } from "lucide-react";
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
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="space-y-5 p-4 rounded-3xl border border-border/50 bg-card/30">
            <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
            <div className="space-y-3">
              <Skeleton className="h-6 w-3/4 rounded-lg" />
              <Skeleton className="h-4 w-1/2 rounded-md" />
              <div className="pt-4 flex justify-between items-center">
                <Skeleton className="h-10 w-1/3 rounded-xl" />
                <Skeleton className="h-10 w-1/2 rounded-xl" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 md:py-32 px-6 text-center rounded-[2.5rem] bg-muted/20 border-2 border-dashed border-border/50 animate-in fade-in zoom-in duration-500">
        <div className="p-8 rounded-full bg-background shadow-xl mb-8 relative">
          <Package className="h-16 w-16 text-muted-foreground/20" />
          <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary animate-ping opacity-20" />
        </div>
        <Typography variant="h3" className="mb-3 font-black tracking-tight">
          Oups ! Le coffre est vide
        </Typography>
        <Typography variant="body-base" className="text-muted-foreground max-w-sm mx-auto leading-relaxed">
          {emptyMessage ||
            "Nous n'avons trouvé aucun trésor correspondant à vos critères. Essayez d'élargir vos filtres."}
        </Typography>
      </div>
    );
  }

  return (
    <div className="space-y-16">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
        {items.map((item, index) => (
          <GameItemCard key={item.id} item={item} />
        ))}
      </div>

      {hasNextPage && (
        <div className="flex flex-col items-center justify-center pt-8 pb-16 gap-4">
          <Button
            variant="outline"
            size="lg"
            onClick={() => onLoadMore()}
            disabled={isFetchingNextPage}
            className="px-16 py-7 rounded-2xl border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary font-black uppercase tracking-widest text-xs transition-all hover:scale-[1.02] shadow-xl shadow-primary/5 group h-auto"
          >
            {isFetchingNextPage ? (
              <RefreshCw className="mr-3 h-5 w-5 animate-spin" />
            ) : (
              <Layers className="mr-3 h-5 w-5 group-hover:rotate-12 transition-transform" />
            )}
            {isFetchingNextPage ? "Chargement..." : "Voir plus d'items"}
          </Button>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-50">
            Découvrir plus d'opportunités
          </p>
        </div>
      )}

      {!hasNextPage && items.length > 0 && (
        <div className="flex items-center justify-center gap-6 py-12">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border" />
          <Typography variant="caption1" className="font-black text-muted-foreground/40 uppercase tracking-[0.2em] whitespace-nowrap">
            Fin de la sélection
          </Typography>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border" />
        </div>
      )}
    </div>
  );
}
