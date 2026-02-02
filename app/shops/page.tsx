// app/(main)/shops/page.tsx
"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Search,
  Filter,
  MapPin,
  Star,
  TrendingUp,
  Store,
  Users,
  ChevronRight,
  Sparkles,
  Globe,
  Shield,
  Award,
  Plus,
  Grid,
  List,
  SlidersHorizontal,
  X,
} from "lucide-react";
// import { ShopsHero } from "@/components/pages/shops/shops-hero";
import { ShopsFilterSidebar } from "@/components/pages/shops/shops-filter-sidebar";
// import { ShopsGrid } from "@/components/pages/shops/shops-grid";
import { ShopsMobileFilters } from "@/components/pages/shops/shops-mobile-filters";
// import { ChatbotAssistant } from "@/components/shared/chatbot-assistant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
// import { useShopsFilters } from "@/hooks/use-shops-filters";
import { useInfiniteShops, useShopsFilters } from "@/hooks/use-shops";
import { useScreenSize } from "@/hooks/use-screen";
import { useAuthContext } from "@/contexts/auth-context";
import { ShopsHero } from "@/components/pages/shops/shops-hero";
import { ShopsGrid } from "@/components/pages/shops/shops-grid";
// import { ChatbotAssistant } from "@/components/shared/chatbot-assistant";

// Composant principal avec Suspense
function ShopsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuthContext();
  const { isSmallScreen } = useScreenSize();

  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeTab, setActiveTab] = useState("all");

  // Hook personnalisé pour la gestion des filtres
  const {
    filters,
    searchQuery,
    setSearchQuery,
    updateFilter,
    resetFilters,
    hasActiveFilters,
  } = useShopsFilters();

  // Hook pour le chargement infini
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteShops({
    filters: {
      ...filters,
      isActive: true,
      isVisible: true,
    },
    pagination: {
      page: 1,
      limit: 12,
    },
    options: {
      sortBy: activeTab === "popular" ? "viewCount" : "createdAt",
      sortOrder: "desc",
    },
  });

  // Toutes les boutiques paginées
  const allShops = data?.pages.flatMap((page) => page.data) || [];

  // Statistiques pour les badges
  const stats = {
    total: allShops.length,
    verified: allShops.filter((s) => s.verified).length,
    popular: data?.pages[0]?.pagination.total || 0,
    local: allShops.filter((s) =>
      ["France", "Belgique", "Suisse"].includes(s.country || "")
    ).length,
  };

  // Gestion des onglets
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // On pourrait ajuster les filtres en fonction de l'onglet
    if (value === "verified") {
      updateFilter("verified", true);
    } else if (value === "popular") {
      // Pas besoin de filtre spécifique, le tri se fait côté serveur
    } else {
      updateFilter("verified", undefined);
    }
  };

  // Recherche avec debounce intégré dans le hook
  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };

  const handleShopClick = (shopId: string) => {
    router.push(`/shops/${shopId}`);
  };

  const handleCreateShop = () => {
    router.push("/shops/create");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      {/* Hero Section */}
      <ShopsHero
        searchQuery={searchQuery}
        onSearch={handleSearch}
        onCreateShop={handleCreateShop}
        user={user}
      />

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Desktop */}
          {!isSmallScreen && (
            <div className="lg:col-span-1">
              <ShopsFilterSidebar
                filters={filters}
                updateFilter={updateFilter}
                resetFilters={resetFilters}
                hasActiveFilters={hasActiveFilters}
              />
            </div>
          )}

          {/* Contenu principal */}
          <div className="lg:col-span-3 space-y-6">
            {/* Header avec contrôles */}
            <div className="flex flex-col gap-4">
              {/* Barre de contrôle supérieure */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <Typography variant="h2" weight="bold">
                    {activeTab === "popular"
                      ? "Boutiques populaires"
                      : activeTab === "verified"
                      ? "Boutiques vérifiées"
                      : activeTab === "local"
                      ? "Boutiques locales"
                      : "Toutes les boutiques"}
                  </Typography>
                  <Badge variant="secondary" className="text-sm">
                    {stats.total} boutiques
                  </Badge>
                </div>

                <div className="flex items-center gap-3">
                  {/* Mode d'affichage */}
                  <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
                    <Button
                      size="icon"
                      variant={viewMode === "grid" ? "default" : "ghost"}
                      onClick={() => setViewMode("grid")}
                      className="h-8 w-8"
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant={viewMode === "list" ? "default" : "ghost"}
                      onClick={() => setViewMode("list")}
                      className="h-8 w-8"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Bouton filtres mobile */}
                  {isSmallScreen && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => setShowMobileFilters(true)}
                    >
                      <Filter className="h-4 w-4" />
                      Filtres
                      {hasActiveFilters && (
                        <Badge className="ml-1 h-5 w-5 p-0" variant="secondary">
                          !
                        </Badge>
                      )}
                    </Button>
                  )}
                </div>
              </div>

              {/* Onglets de navigation */}
              <div>
                <Tabs value={activeTab} onValueChange={handleTabChange}>
                  <TabsList className="grid grid-cols-4">
                    <TabsTrigger value="all" className="gap-2">
                      <Store className="h-4 w-4" />
                      Toutes
                    </TabsTrigger>
                    <TabsTrigger value="popular" className="gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Populaires
                    </TabsTrigger>
                    <TabsTrigger value="verified" className="gap-2">
                      <Shield className="h-4 w-4" />
                      Vérifiées
                    </TabsTrigger>
                    <TabsTrigger value="local" className="gap-2">
                      <MapPin className="h-4 w-4" />
                      Local
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Filtres actifs */}
              {hasActiveFilters && (
                <div className="flex flex-wrap gap-2 items-center">
                  <Typography variant="body-sm" weight="medium">
                    Filtres actifs:
                  </Typography>
                  {filters.verified && (
                    <Badge variant="secondary" className="gap-1">
                      <Shield className="h-3 w-3" />
                      Vérifié
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-4 w-4 ml-1"
                        onClick={() => updateFilter("verified", undefined)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  )}
                  {filters.country && (
                    <Badge variant="secondary" className="gap-1">
                      <MapPin className="h-3 w-3" />
                      {filters.country}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-4 w-4 ml-1"
                        onClick={() => updateFilter("country", undefined)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  )}
                  {filters.category && (
                    <Badge variant="secondary" className="gap-1">
                      {filters.category}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-4 w-4 ml-1"
                        onClick={() => updateFilter("category", undefined)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-sm"
                    onClick={resetFilters}
                  >
                    Tout effacer
                  </Button>
                </div>
              )}
            </div>

            {/* Grille de boutiques avec chargement infini */}
            <ShopsGrid
              shops={allShops}
              viewMode={viewMode}
              isLoading={isLoading}
              isFetchingNextPage={isFetchingNextPage}
              hasNextPage={hasNextPage}
              onLoadMore={fetchNextPage}
              onShopClick={handleShopClick}
              emptyMessage={
                hasActiveFilters ? (
                  <div className="text-center py-12">
                    <Store className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <Typography variant="h4" weight="semibold" className="mb-2">
                      Aucune boutique trouvée
                    </Typography>
                    <Typography
                      variant="body-base"
                      theme="muted"
                      className="mb-6"
                    >
                      Essayez de modifier vos critères de recherche
                    </Typography>
                    <Button onClick={resetFilters}>
                      Réinitialiser les filtres
                    </Button>
                  </div>
                ) : null
              }
            />

            {/* CTA Création boutique */}
            {user && allShops.length > 0 && (
              <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="space-y-2">
                      <Typography variant="h4" weight="bold">
                        Prêt à lancer votre boutique ?
                      </Typography>
                      <Typography variant="body-base" theme="muted">
                        Rejoignez notre communauté et commencez à vendre dès
                        aujourd'hui
                      </Typography>
                    </div>
                    <Button
                      size="lg"
                      className="gap-2 whitespace-nowrap"
                      onClick={handleCreateShop}
                    >
                      <Plus className="h-5 w-5" />
                      Créer ma boutique
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Filtres mobiles */}
      {isSmallScreen && (
        <ShopsMobileFilters
          open={showMobileFilters}
          onOpenChange={setShowMobileFilters}
          filters={filters}
          updateFilter={updateFilter}
          resetFilters={resetFilters}
          hasActiveFilters={hasActiveFilters}
        />
      )}
    </div>
  );
}

// Skeleton pour loading
function ShopsSkeleton() {
  return (
    <div className="min-h-screen">
      {/* Hero Skeleton */}
      <div className="h-64 bg-gradient-to-r from-primary/10 via-primary/5 to-purple-500/10">
        <div className="container mx-auto px-4 h-full flex items-center">
          <div className="max-w-3xl mx-auto text-center space-y-4 w-full">
            <Skeleton className="h-6 w-48 mx-auto" />
            <Skeleton className="h-12 w-3/4 mx-auto" />
            <Skeleton className="h-6 w-2/3 mx-auto" />
            <Skeleton className="h-14 w-full max-w-2xl mx-auto rounded-xl" />
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 hidden lg:block">
            <Skeleton className="h-[600px] rounded-xl" />
          </div>
          <div className="lg:col-span-3 space-y-8">
            {/* Header Skeleton */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-10 w-32" />
              </div>
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>

            {/* Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-40 rounded-xl" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Page principale avec Suspense
export default function ShopsPage() {
  return (
    <Suspense fallback={<ShopsSkeleton />}>
      <ShopsContent />
    </Suspense>
  );
}
