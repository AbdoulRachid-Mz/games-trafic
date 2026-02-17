"use client";

import { ProductGrid } from "./product-grid";
import { MarketplaceFilters } from "./filters";
import { MarketplaceHero } from "./marketplace-hero";
import { useState } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Filter, Grid3x3, List, X, SlidersHorizontal } from "lucide-react";
import { useScreenSize } from "@/hooks/use-screen";
import { Badge } from "@/components/ui/badge";
import { Typography } from "@/components/ui/typography";

export function MarketplaceContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const { isSmallScreen, isMediumScreen } = useScreenSize();

  const toggleFilter = () => setIsFilterOpen(!isFilterOpen);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <MarketplaceHero 
        searchQuery={searchQuery} 
        isFilterOpen={isFilterOpen} 
        toggleFilter={toggleFilter} 
        onSearch={setSearchQuery} 
      />
      
      <div className="mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters sidebar - Desktop */}
          {!isSmallScreen && (
            <aside className="lg:w-1/4">
              <div className="sticky top-24 space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold">Filtres</h2>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={viewMode === "grid" ? "default" : "outline"}
                      size="icon"
                      onClick={() => setViewMode("grid")}
                      className="h-8 w-8"
                      title="Vue grille"
                    >
                      <Grid3x3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "outline"}
                      size="icon"
                      onClick={() => setViewMode("list")}
                      className="h-8 w-8"
                      title="Vue liste"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <MarketplaceFilters />
              </div>
            </aside>
          )}

          {/* Product grid */}
          <main className={isSmallScreen ? "w-full" : "lg:w-3/4"}>
            {/* Header avec controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 p-4 bg-card rounded-lg border">
              <div className="flex items-center gap-4">
                {isSmallScreen && (
                  <Button
                    variant="outline"
                    onClick={toggleFilter}
                    className="gap-2"
                  >
                    <Filter className="h-4 w-4" />
                    Filtres
                    <Badge variant="secondary" className="ml-1 h-5 w-5 p-0">
                      5
                    </Badge>
                  </Button>
                )}
                
                <div className="hidden sm:flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Affichage:</span>
                  <div className="flex gap-1">
                    <Button
                      variant={viewMode === "grid" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                      className="h-8 px-3"
                    >
                      <Grid3x3 className="h-4 w-4 mr-2" />
                      Grille
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                      className="h-8 px-3"
                    >
                      <List className="h-4 w-4 mr-2" />
                      Liste
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-4">
                <div className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">124</span> comptes
                </div>
                
                {!isSmallScreen && (
                  <div className="flex gap-2">
                    <Button
                      variant={viewMode === "grid" ? "default" : "outline"}
                      size="icon"
                      onClick={() => setViewMode("grid")}
                      className="h-8 w-8 sm:hidden"
                      title="Vue grille"
                    >
                      <Grid3x3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "outline"}
                      size="icon"
                      onClick={() => setViewMode("list")}
                      className="h-8 w-8 sm:hidden"
                      title="Vue liste"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Filter Sheet */}
            <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <SheetContent 
                side={"left"} 
                className={isSmallScreen ? "rounded-t-2xl w-[80%] min-h-fit overflow-y-auto" : "w-[400px] overflow-y-auto"}
              >
                <div className="h-full flex flex-col">
                  <div className="flex items-center justify-between pb-4 border-b mb-4">
                    <SheetTitle className="text-xl font-bold flex items-center gap-2">
                      <Typography>
                      <SlidersHorizontal className="h-5 w-5" />
                      Filtres Gaming
                      </Typography>
                      <Button></Button>
                    </SheetTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsFilterOpen(false)}
                      className="h-8 w-8 p-4 bg-transparent backdrop-blur-md rounded-md"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex-1 overflow-y-auto pr-2">
                    <MarketplaceFilters />
                  </div>
                  {/* <div className="pt-4 border-t mt-4">
                    <Button
                      className="w-full"
                      onClick={() => setIsFilterOpen(false)}
                    >
                      Appliquer les filtres
                    </Button>
                  </div> */}
                </div>
              </SheetContent>
            </Sheet>

            <ProductGrid searchQuery={searchQuery} viewMode={viewMode} />
          </main>
        </div>
      </div>
    </div>
  );
}
