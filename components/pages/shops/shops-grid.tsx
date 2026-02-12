// components/pages/shops/shops-grid.tsx
"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Store, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { ShopCardList } from "@/components/pages/shops/shop-card-list";
import { Shop } from "@/database/schema";
import { ShopCard } from "@/components/cards/shop-card";

interface ShopsGridProps {
  shops: Shop[];
  viewMode: "grid" | "list";
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  onLoadMore: () => void;
  onShopClick: (shopId: string) => void;
  emptyMessage?: React.ReactNode;
}

export function ShopsGrid({
  shops,
  viewMode,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  onLoadMore,
  onShopClick,
  emptyMessage,
}: ShopsGridProps) {
  const loaderRef = useRef<HTMLDivElement>(null);

  // Intersection Observer pour le chargement infini
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          onLoadMore();
        }
      },
      { threshold: 0.1 },
    );

    const currentLoader = loaderRef.current;
    if (currentLoader && hasNextPage) {
      observer.observe(currentLoader);
    }

    return () => {
      if (currentLoader) {
        observer.unobserve(currentLoader);
      }
    };
  }, [hasNextPage, isFetchingNextPage, onLoadMore]);

  // Aucune boutique trouvée
  if (!isLoading && shops.length === 0) {
    return (
      <div className="py-16 text-center">
        {emptyMessage || (
          <>
            <Store className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <Typography variant="h4" weight="semibold" className="mb-2">
              Aucune boutique disponible
            </Typography>
            <Typography variant="body-base" theme="muted">
              Revenez plus tard pour découvrir de nouvelles boutiques
            </Typography>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Grille de boutiques */}
      <AnimatePresence mode="wait">
        <motion.div
          key={viewMode}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {shops.map((shop, index) => (
                <motion.div
                  key={shop.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <ShopCard
                    shop={shop}
                    viewMode="grid"
                    onView={() => onShopClick(shop.id)}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {shops.map((shop, index) => (
                <motion.div
                  key={shop.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <ShopCard
                    shop={shop}
                    viewMode="compact"
                    showDetails={false}
                    showStats={false}
                    showLikeButton={false}
                    onView={() => onShopClick(shop.id)}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Loading initial */}
      {isLoading && shops.length === 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="h-40 bg-muted rounded-xl animate-pulse" />
              <div className="space-y-2">
                <div className="h-6 bg-muted rounded animate-pulse" />
                <div className="h-4 bg-muted rounded animate-pulse" />
                <div className="h-10 bg-muted rounded-lg animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Chargement infini */}
      {isFetchingNextPage && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Bouton pour charger plus (fallback) */}
      {hasNextPage && !isFetchingNextPage && (
        <div ref={loaderRef} className="flex justify-center py-8">
          <Button variant="outline" onClick={onLoadMore} className="gap-2">
            Charger plus de boutiques
          </Button>
        </div>
      )}
    </div>
  );
}
