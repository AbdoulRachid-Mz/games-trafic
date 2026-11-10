"use client";

import { ProductGrid } from "./product-grid";
import { MarketplaceFilters } from "./filters";
import { MarketplaceHero } from "./marketplace-hero";
import { useCallback, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Filter, Grid3x3, List, X, SlidersHorizontal } from "lucide-react";
import { useScreenSize } from "@/hooks/use-screen";
import { Badge } from "@/components/ui/badge";
import { Typography } from "@/components/ui/typography";

export function MarketplaceContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [totalProducts, setTotalProducts] = useState<number | null>(null);
  const { isSmallScreen, isMediumScreen } = useScreenSize();

  const handleSearch = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value.trim() !== "") params.set("q", value.trim());
      else params.delete("q");
      router.replace(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams],
  );

  // Badge mobile : nombre réel de facettes actives dans l'URL.
  const activeFilterKeys = [
    "q",
    "games",
    "platforms",
    "ranks",
    "features",
    "countries",
    "minPrice",
    "maxPrice",
    "minLevel",
    "maxLevel",
  ];
  const activeFilterCount = activeFilterKeys.filter((k) =>
    searchParams.get(k),
  ).length;

  const toggleFilter = () => setIsFilterOpen(!isFilterOpen);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <MarketplaceHero 
        searchQuery={searchParams.get("q") || ""} 
        isFilterOpen={isFilterOpen} 
        toggleFilter={toggleFilter} 
        onSearch={handleSearch} 
      />
      
      <div className="mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters sidebar - Desktop : masquée SOUS lg (zone 640–1023px
              couverte par le drawer, pas un empilement de la sidebar) */}
          <aside className="hidden lg:block lg:w-1/4">
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

          {/* Product grid */}
          <main className="w-full flex-1 min-w-0">
            {/* Header avec controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 p-4 bg-card rounded-lg border">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={toggleFilter}
                  className="gap-2 lg:hidden"
                >
                  <Filter className="h-4 w-4" />
                  Filtres
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 min-w-5 p-0 px-1">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
                
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
                  <span className="font-semibold text-foreground">
                    {totalProducts ?? "…"}
                  </span>{" "}
                  produit{totalProducts === 1 ? "" : "s"}
                </div>

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

            <ProductGrid viewMode={viewMode} onTotalChange={setTotalProducts} />
          </main>
        </div>
      </div>
    </div>
  );
}
