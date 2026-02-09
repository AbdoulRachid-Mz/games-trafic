// @/app/games/page.tsx
"use client";

import React, { useState, Suspense } from "react";
import { useGamesFilters } from "@/hooks/use-games-filters";
import { useGameItems } from "@/hooks/use-games";
import { GamesHero } from "@/components/pages/games/games-hero";
import { GamesFilterSidebar } from "@/components/pages/games/games-filter-sidebar";
import { GamesGrid } from "@/components/pages/games/games-grid";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Filter, X, Gamepad2, Package, LayoutGrid, Info } from "lucide-react";
import { useScreenSize } from "@/hooks/use-screen";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Loader2 } from "lucide-react";

function GamesContent() {
  const {
    filters,
    searchQuery,
    setSearchQuery,
    updateFilter,
    resetFilters,
    hasActiveFilters,
  } = useGamesFilters();
  const { isSmallScreen } = useScreenSize();
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  // Hook pour le chargement infini des items
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useGameItems({
      filters: {
        ...filters,
        isActive: true,
      },
      pagination: {
        page: 1,
        limit: 12,
      },
      options: {
        withRelations: true,
        sortBy: "popularity",
        sortOrder: "desc",
      },
    });

  const allItems = data?.pages.flatMap((page) => page.data) || [];
  const totalItems = data?.pages[0]?.pagination.total || 0;

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Hero Section */}
      <GamesHero searchQuery={searchQuery} onSearch={setSearchQuery} />

      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Desktop only */}
          {!isSmallScreen && (
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <GamesFilterSidebar
                  filters={filters}
                  updateFilter={updateFilter}
                  resetFilters={resetFilters}
                  hasActiveFilters={hasActiveFilters}
                />
              </div>
            </div>
          )}

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-6 md:space-y-8">
            {/* Control Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card border border-border p-4 rounded-2xl shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <Typography variant="h4" className="text-lg font-bold leading-none mb-1">Items Disponibles</Typography>
                  <p className="text-xs text-muted-foreground font-medium">
                    {totalItems} résultats trouvés
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {/* Mobile Filters Trigger */}
                {isSmallScreen && (
                  <Sheet
                    open={isFilterSheetOpen}
                    onOpenChange={setIsFilterSheetOpen}
                  >
                    <SheetTrigger asChild>
                      <Button
                        variant="outline"
                        className="flex-1 sm:flex-none gap-2 bg-background border-border"
                      >
                        <Filter className="h-4 w-4" />
                        Filtres
                        {hasActiveFilters && (
                          <Badge
                            className="ml-1 px-1.5 h-5 min-w-[20px] rounded-full"
                          >
                            !
                          </Badge>
                        )}
                      </Button>
                    </SheetTrigger>
                    <SheetContent
                      side="left"
                      className="bg-background border-r border-border"
                    >
                      <SheetHeader>
                        <SheetTitle className="flex items-center gap-2">
                          <Filter className="h-5 w-5" />
                          Filtres
                        </SheetTitle>
                      </SheetHeader>
                      <div className="mt-8">
                        <GamesFilterSidebar
                          filters={filters}
                          updateFilter={updateFilter}
                          resetFilters={() => {
                            resetFilters();
                            setIsFilterSheetOpen(false);
                          }}
                          hasActiveFilters={hasActiveFilters}
                        />
                      </div>
                    </SheetContent>
                  </Sheet>
                )}

                <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  <span>Trier:</span>
                  <Badge
                    variant="secondary"
                    className="cursor-pointer hover:bg-secondary/80 transition-colors"
                  >
                    Popularité
                  </Badge>
                </div>
              </div>
            </div>

            {/* Active Chips */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 items-center animate-in fade-in slide-in-from-top-2 duration-300">
                <Typography variant="caption1" className="font-bold text-muted-foreground uppercase tracking-wider mr-1">Actifs:</Typography>
                {filters.gameId && filters.gameId !== "all" && (
                  <Badge
                    variant="secondary"
                    className="gap-1.5 pl-2 py-1 bg-primary/10 text-primary border-primary/20"
                  >
                    <Gamepad2 className="h-3 w-3" />
                    Jeu sélectionné
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-foreground"
                      onClick={() => updateFilter("gameId", "all")}
                    />
                  </Badge>
                )}
                {filters.type && (
                  <Badge
                    variant="secondary"
                    className="gap-1.5 pl-2 py-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                  >
                    <Package className="h-3 w-3" />
                    {filters.type}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-foreground"
                      onClick={() => updateFilter("type", "all")}
                    />
                  </Badge>
                )}
                {searchQuery && (
                  <Badge
                    variant="secondary"
                    className="gap-1.5 pl-2 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                  >
                    "{searchQuery}"
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-foreground"
                      onClick={() => setSearchQuery("")}
                    />
                  </Badge>
                )}
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-muted-foreground hover:text-primary transition-colors text-xs font-bold"
                  onClick={resetFilters}
                >
                  Tout effacer
                </Button>
              </div>
            )}

            {/* Grid with Infinite Scroll */}
            <GamesGrid
              items={allItems as any}
              isLoading={isLoading}
              isFetchingNextPage={isFetchingNextPage}
              hasNextPage={hasNextPage}
              onLoadMore={fetchNextPage}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function GamesSkeleton() {
  return (
    <div className="min-h-screen bg-background py-20">
      <div className="container mx-auto px-4 space-y-12">
        <div className="space-y-4 max-w-4xl mx-auto text-center">
          <div className="h-8 w-48 bg-muted rounded-full mx-auto" />
          <div className="h-16 w-full bg-muted rounded-2xl" />
          <div className="h-14 w-full max-w-2xl bg-muted rounded-2xl mx-auto" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="hidden lg:block h-[600px] bg-muted rounded-3xl" />
          <div className="lg:col-span-3 space-y-8">
            <div className="h-24 bg-muted rounded-3xl" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-96 bg-muted rounded-3xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GamesPage() {
  return (
    <Suspense fallback={<GamesSkeleton />}>
      <GamesContent />
    </Suspense>
  );
}
