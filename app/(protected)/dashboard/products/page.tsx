"use client";

import React from "react";
import { motion } from "framer-motion";
import { Typography } from "@/components/ui/typography";
import { EntityList } from "@/components/shared/entity-list";
import { useEntityList } from "@/hooks/use-entity-list";
import { useScreenSize } from "@/hooks/use-screen";
import { useAuthContext } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { type Product } from "@/database/schema";
import { ShopCard } from "@/components/cards/shop-card";
import {
  ShoppingBag,
  Plus,
  Eye,
  Star,
  Package,
  Tag,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { motion as m } from "framer-motion";

export default function ProductsDashboardPage() {
  const { isSmallScreen, isMediumScreen } = useScreenSize();
  const { user } = useAuthContext();
  const router = useRouter();

  const {
    data,
    total,
    loading,
    error,
    page,
    limit,
    searchTerm,
    filters,
    setPage,
    setLimit,
    setSearchTerm,
    setFilters,
    viewMode,
    setViewMode,
    onRefresh,
  } = useEntityList<Product>({
    entityType: "products",
    defaultFilters: { sellerId: user?.id },
    defaultLimit: isSmallScreen ? 12 : isMediumScreen ? 15 : 20,
    enabled: !!user?.id,
  });

  const renderProductCard = (p: Product, index: number) => (
    <motion.div
      key={(p as any).id}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.04 }}
      whileHover={{ y: -4 }}
      className="h-full"
    >
      <Card className="h-full overflow-hidden group transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 border-border/50">
        {/* Product image */}
        <div className="relative aspect-video bg-muted overflow-hidden">
          {(p as any).featuredImage ? (
            <Image
              src={(p as any).featuredImage}
              alt={(p as any).name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Package className="h-12 w-12 text-muted-foreground/30" />
            </div>
          )}
          {/* Status badge */}
          <div className="absolute top-2 right-2">
            <Badge
              variant={(p as any).isActive ? "default" : "secondary"}
              className="text-[10px] font-bold"
            >
              {(p as any).status || ((p as any).isActive ? "ACTIF" : "INACTIF")}
            </Badge>
          </div>
        </div>

        <CardContent className="p-4 space-y-3">
          <div>
            <CardTitle className="text-base font-bold line-clamp-1 group-hover:text-primary transition-colors">
              {(p as any).name}
            </CardTitle>
            {(p as any).description && (
              <Typography variant="body-sm" theme="muted" className="line-clamp-2 mt-1">
                {(p as any).description}
              </Typography>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-primary font-black text-lg">
              <Tag className="h-4 w-4" />
              {Number((p as any).price || 0).toLocaleString()}
              <span className="text-xs font-normal text-muted-foreground">GTC</span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <span className="flex items-center gap-1 text-xs">
                <Eye className="h-3.5 w-3.5" />
                {(p as any).viewCount || 0}
              </span>
              <span className="flex items-center gap-1 text-xs">
                <Star className="h-3.5 w-3.5 text-amber-500" />
                {((p as any).rating || 0).toFixed(1)}
              </span>
            </div>
          </div>

          <Button
            size="sm"
            variant="ghost"
            className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors h-8"
            onClick={() => router.push(`/marketplace/${(p as any).id}`)}
          >
            Gérer le produit
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="mx-auto p-2 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center px-2"
      >
        <div>
          <Typography variant="h2" weight="bold">
            Mes Produits
          </Typography>
          <Typography variant="body-sm" theme="muted">
            Gérez votre catalogue de produits et services
          </Typography>
        </div>
        <Button
          onClick={() => router.push("/marketplace/create")}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Nouveau Produit
        </Button>
      </motion.div>

      <EntityList<Product>
        entityType="products"
        title="Produits"
        data={data}
        total={total}
        loading={loading}
        error={error}
        page={page}
        limit={limit}
        searchTerm={searchTerm}
        filters={filters as Record<string, any>}
        viewMode={viewMode}
        onPageChange={setPage}
        onLimitChange={setLimit}
        onSearchChange={setSearchTerm}
        onFilterChange={setFilters}
        onViewModeChange={setViewMode}
        renderCard={(item, index) => renderProductCard(item, Number(index))}
        showSearch={true}
        showFilters={true}
        showViewToggle={true}
        onRefresh={onRefresh}
        gridClassName="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      />
    </div>
  );
}
