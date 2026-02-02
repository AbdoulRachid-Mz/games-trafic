"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { EntityList } from "@/components/shared/entity-list";
import { useEntityList } from "@/hooks/use-entity-list";
import { useScreenSize } from "@/hooks/use-screen";
import { getShops } from "@/actions/shops";
import { type Shop } from "@/database/schema";
import {
  Store,
  ShoppingBag,
  Eye,
  ShieldCheck,
  AlertCircle,
  Plus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function ShopsDashboardPage() {
  const { isSmallScreen, isMediumScreen } = useScreenSize();
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
  } = useEntityList<Shop>({
    entityType: "shops",
    defaultLimit: isSmallScreen ? 12 : isMediumScreen ? 15 : 20,
    fetchFunction: async (params) => {
      const res = await getShops({
        pagination: { page: params.page, limit: params.limit },
        filters: params,
      });
      return {
        success: true,
        data: res.data,
        pagination: res.pagination,
      };
    },
  });

  const renderShopCard = (s: Shop, index: number) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -5 }}
      className="h-full"
    >
      <Card className="h-full border-2 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 group overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Store className="h-20 w-20 text-primary rotate-12" />
        </div>

        <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
              <Store className="h-5 w-5" />
            </div>
            <CardTitle className="text-xl font-bold truncate max-w-[150px]">
              {s.name}
            </CardTitle>
          </div>
          <Badge variant={s.isActive ? "default" : "secondary"} className="h-6">
            {s.isActive ? "ACTIF" : "INACTIF"}
          </Badge>
        </CardHeader>

        <CardContent className="relative space-y-4 pt-4">
          <Typography
            variant="body-sm"
            theme="muted"
            className="line-clamp-2 h-10"
          >
            {s.description || "Aucune description fournie pour cette boutique."}
          </Typography>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="flex flex-col gap-1 p-3 rounded-xl bg-muted/50 border border-border/50">
              <div className="flex items-center gap-2 text-primary">
                <ShoppingBag className="h-4 w-4" />
                <span className="text-xs font-bold">PRODUITS</span>
              </div>
              <span className="text-lg font-bold">{s.productCount ?? 0}</span>
            </div>
            <div className="flex flex-col gap-1 p-3 rounded-xl bg-muted/50 border border-border/50">
              <div className="flex items-center gap-2 text-primary">
                <Eye className="h-4 w-4" />
                <span className="text-xs font-bold">VUES</span>
              </div>
              <span className="text-lg font-bold">{s.viewCount ?? 0}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2">
              {s.verified ? (
                <div className="flex items-center gap-1 text-green-500">
                  <ShieldCheck className="h-4 w-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    Vérifiée
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    Non vérifiée
                  </span>
                </div>
              )}
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="group-hover:text-primary transition-colors"
              onClick={() => router.push(`/dashboard/shops/${s.id}`)}
            >
              Gérer
            </Button>
          </div>
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
            Boutiques
          </Typography>
          <Typography variant="body-sm" theme="muted">
            Gérez vos espaces de vente personnalisés
          </Typography>
        </div>
        <Button
          onClick={() => router.push("/dashboard/shops/create")}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Nouvelle Boutique
        </Button>
      </motion.div>

      <EntityList<Shop>
        entityType="shops"
        title="Boutiques"
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
        renderCard={(item, index) => renderShopCard(item, Number(index))}
        showSearch={true}
        showFilters={true}
        showViewToggle={true}
        onRefresh={onRefresh}
        gridClassName="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      />
    </div>
  );
}
