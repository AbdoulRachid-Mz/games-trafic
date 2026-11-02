"use client";

import { motion } from "framer-motion";
import { Typography } from "@/components/ui/typography";
import { EntityList } from "@/components/shared/entity-list";
import { useEntityList } from "@/hooks/use-entity-list";
import { useScreenSize } from "@/hooks/use-screen";
import { type Shop } from "@/database/schema";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/auth-context";
import { ShopCard } from "@/components/cards/shop-card";

export default function ShopsDashboardPage() {
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
  } = useEntityList<Shop>({
    entityType: "shops",
    defaultFilters: { ownerId: user?.id },
    defaultLimit: isSmallScreen ? 12 : isMediumScreen ? 15 : 20,
    enabled: !!user?.id,
  });

  const renderShopCard = (s: Shop, index: number) => (
    <ShopCard
      key={s.id}
      item={s as any}
      viewMode={viewMode === "grid" ? "grid" : "list"}
      showDetails={false}
      onView={() => router.push(`/shops/${s.id}`)}
    />
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
        <Button onClick={() => router.push("/shops/create")} className="gap-2">
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
