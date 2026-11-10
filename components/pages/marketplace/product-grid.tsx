"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { getProducts } from "@/actions/products";
// import { ProductCard } from "@/components/cards/product-card";
import { Loader2, Gamepad2, SearchX, Swords, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useScreenSize } from "@/hooks/use-screen";
import { ProductCard } from "./product-card";

interface ProductGridProps {
  /** Défaut : valeur de l'URL (?q=). */
  searchQuery?: string;
  viewMode?: "grid" | "list";
  /** Remonte le total réel (serveur) — utilisé par le compteur du header. */
  onTotalChange?: (total: number) => void;
}

export function ProductGrid({ searchQuery: externalSearchQuery, viewMode: externalViewMode, onTotalChange }: ProductGridProps) {
  const searchParams = useSearchParams();
  const { isSmallScreen } = useScreenSize();
  const [internalViewMode, setInternalViewMode] = useState<"grid" | "list">("grid");
  
  const viewMode = externalViewMode || internalViewMode;

  // Recherche : l'URL (?q=) est la source de vérité — la prop est un
  // contournement optionnel. Avant : le hero et la sidebar écrivaient `q` dans
  // l'URL, mais ce grid lisait un state local désynchronisé.
  const searchQuery = externalSearchQuery ?? searchParams.get("q") ?? undefined;

  const games = searchParams.get("games")?.split(",");
  const platforms = searchParams.get("platforms")?.split(",");
  const ranks = searchParams.get("ranks")?.split(",");
  const features = searchParams.get("features")?.split(",");
  const countries = searchParams.get("countries")?.split(",");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const minLevel = searchParams.get("minLevel");
  const maxLevel = searchParams.get("maxLevel");
  const sortBy = searchParams.get("sortBy") || "popularity";

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useInfiniteQuery({
    queryKey: [
      "products",
      searchQuery,
      games,
      platforms,
      ranks,
      features,
      countries,
      minPrice,
      maxPrice,
      minLevel,
      maxLevel,
      sortBy,
      viewMode,
    ],
    queryFn: async ({ pageParam = 1 }) => {
      let sortOptions = {};
      
      switch (sortBy) {
        case "newest":
          sortOptions = { sortBy: "createdAt", sortOrder: "desc" };
          break;
        case "price_low":
          sortOptions = { sortBy: "price", sortOrder: "asc" };
          break;
        case "price_high":
          sortOptions = { sortBy: "price", sortOrder: "desc" };
          break;
        case "popularity":
        default:
          sortOptions = { sortBy: "viewCount", sortOrder: "desc" };
          break;
      }

      const res = await getProducts({
        pagination: { page: pageParam as number, limit: viewMode === "list" ? 10 : 20 },
        filters: {
          search: searchQuery,
          game: games?.[0],
          platform: platforms as ("PC" | "PLAYSTATION" | "XBOX" | "NINTENDO_SWITCH" | "MOBILE" | "VR" | "OTHER")[] | undefined,
          accountRank: ranks?.[0],
          features,
          countries,
          levelMin: minLevel ? Number(minLevel) : undefined,
          levelMax: maxLevel ? Number(maxLevel) : undefined,
          status: ["NON_VENDU", "RESERVE"],
          isActive: true,
          isDeleted: false,
          priceMin: minPrice ? Number(minPrice) : undefined,
          priceMax: maxPrice ? Number(maxPrice) : undefined,
        },
        options: {
          populate: ["shop", "category"],
          ...sortOptions,
        },
      });
      return {
        products: res.data,
        pagination: res.pagination,
      };
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.hasNext) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });

  const { ref, isIntersecting } = useIntersectionObserver({
    threshold: 0.5,
  });

  useEffect(() => {
    if (isIntersecting && hasNextPage) {
      fetchNextPage();
    }
  }, [isIntersecting, hasNextPage, fetchNextPage]);

  // Compteur global réel (serveur, toutes pages) remonté au header.
  const totalProducts = data?.pages[0]?.pagination?.total;
  useEffect(() => {
    if (totalProducts != null) onTotalChange?.(totalProducts);
  }, [totalProducts, onTotalChange]);

  // Loading skeleton avec design gaming
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className={viewMode === "grid" 
          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6"
          : "space-y-6"
        }>
          {[...Array(viewMode === "grid" ? 6 : 3)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              {viewMode === "grid" ? (
                <div className="space-y-4">
                  <Skeleton className="aspect-[4/3] rounded-2xl bg-muted" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-3/4 bg-muted" />
                    <Skeleton className="h-4 w-1/2 bg-muted" />
                  </div>
                </div>
              ) : (
                <div className="flex gap-4 p-4 border rounded-xl">
                  <Skeleton className="w-48 h-48 rounded-xl bg-muted flex-shrink-0" />
                  <div className="flex-1 space-y-4">
                    <Skeleton className="h-6 w-3/4 bg-muted" />
                    <Skeleton className="h-4 w-1/2 bg-muted" />
                    <Skeleton className="h-4 w-full bg-muted" />
                    <Skeleton className="h-4 w-2/3 bg-muted" />
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  // Error state avec design gaming
  if (isError) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-16 px-4"
      >
        <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-4 border border-destructive/20">
          <SearchX className="h-10 w-10 text-destructive" />
        </div>
        <Typography variant="h4" weight="bold" className="mb-2 text-center">
          Erreur de chargement
        </Typography>
        <Typography
          variant="body-base"
          className="text-center mb-6 max-w-md text-muted-foreground"
        >
          Une erreur est survenue lors du chargement des comptes. Le serveur gaming a peut-être besoin d'un reboot !
        </Typography>
        <Button 
          onClick={() => refetch()} 
          className="rounded-xl"
        >
          Réessayer
        </Button>
      </motion.div>
    );
  }

  const allProducts = data?.pages.flatMap((page) => page.products) || [];

  // Empty state avec design gaming
  if (allProducts.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-16 px-4"
      >
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
            <Swords className="h-12 w-12 text-primary" />
          </div>
          <div className="absolute -top-2 -right-2">
            <Sparkles className="h-6 w-6 text-amber-400 animate-pulse" />
          </div>
        </div>
        <Typography variant="h3" weight="bold" className="mb-2 text-center">
          Aucun compte trouvé
        </Typography>
        <Typography
          variant="body-base"
          className="text-center mb-6 max-w-md text-muted-foreground"
        >
          Aucun compte de jeu ne correspond à tes critères. Essaie de modifier tes filtres ou de rechercher un autre jeu.
        </Typography>
        <Button
          variant="outline"
          onClick={() => (window.location.href = "/marketplace")}
          className="rounded-xl"
        >
          <Gamepad2 className="h-4 w-4 mr-2" />
          Réinitialiser les filtres
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Results count */}
      <div className="flex items-center justify-between">
        <Typography variant="body-sm" className="text-muted-foreground">
          <span className="font-bold text-primary">{allProducts.length}</span>{" "}
          compte(s) de jeu disponible(s)
        </Typography>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border">
            <Sparkles className="h-3 w-3 mr-1" />
            {sortBy === "popularity" ? "Populaire" : 
             sortBy === "newest" ? "Nouveau" : 
             sortBy === "price_low" ? "Prix croissant" : "Prix décroissant"}
          </Badge>
        </div>
      </div>

      {/* Product grid/list avec animations */}
      <div className={viewMode === "grid" 
        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6"
        : "space-y-6"
      }>
        {allProducts.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            whileHover={{ y: -5 }}
          >
            <ProductCard
              product={product as any}
              viewMode={viewMode}
              showStats={true}
              showActions={true}
            />
          </motion.div>
        ))}
      </div>

      {/* Load more indicator */}
      <div ref={ref} className="flex justify-center py-8 h-20">
        {isFetchingNextPage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3"
          >
            <div className="relative">
              <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin"></div>
              <Swords className="h-4 w-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary" />
            </div>
            <Typography variant="body-sm" className="text-muted-foreground">
              Chargement des prochains combats...
            </Typography>
          </motion.div>
        )}
        {!hasNextPage && allProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <Typography variant="caption1" className="text-muted-foreground">
              Tu as atteint la fin de l'arène !
            </Typography>
          </motion.div>
        )}
      </div>
    </div>
  );
}
