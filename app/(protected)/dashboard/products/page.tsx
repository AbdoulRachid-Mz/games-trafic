"use client";

import { motion } from "framer-motion";
import { Typography } from "@/components/ui/typography";
import { EntityList } from "@/components/shared/entity-list";
import { useEntityList } from "@/hooks/use-entity-list";
import { useScreenSize } from "@/hooks/use-screen";
import { useAuthContext } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { type Product } from "@/database/schema";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/cards/product-card";

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
    defaultFilters: { userId: user?.id },
    defaultLimit: isSmallScreen ? 12 : isMediumScreen ? 15 : 20,
    enabled: !!user?.id,
  });

  const renderProductCard = (p: Product, index: number) => (
    <motion.div
      key={p.id}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.04 }}
      whileHover={{ y: -4 }}
      className="h-full"
    >
      <ProductCard
        item={p}
        viewMode={viewMode === "grid" ? "grid" : "list"}
        showDetails={false}
        onView={() => router.push(`/products/${p.id}`)}
      />
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
