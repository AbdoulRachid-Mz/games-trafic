"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Package,
  Plus,
  Search,
  Filter,
  AlertCircle,
  CheckCircle2,
  Lock,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShopExportButton } from "@/components/pages/shops/shop-export-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { getProductsByShopId, deleteProduct } from "@/actions/products";
import { getOrdersByShopId } from "@/actions/orders";
import { ProductDialog } from "@/components/pages/shops/products/product-dialog";
import { ProductCard } from "@/components/cards/product-card";

const statusLabels: Record<string, string> = {
  NON_VENDU: "En stock",
  RESERVE: "Réservé",
  EN_ECHANGE: "En échange",
  LIVRE: "Livré",
  VENDU: "Vendu",
  ANNULER: "Annulé",
};

export default function ShopProductsPage() {
  const params = useParams();
  const router = useRouter();
  const shopId = params.shopId as string;
  const [products, setProducts] = useState<any[]>([]);
  const [completedProductIds, setCompletedProductIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const filters: any = {
        shopId,
        isDeleted: false,
      };

      if (statusFilter !== "all") {
        filters.status = [statusFilter];
      }

      if (search) {
        filters.name = search;
      }

      const [result, completedOrdersRes] = await Promise.all([
        getProductsByShopId(shopId, {
          filters,
          pagination: { page: 1, limit: 50 },
          options: {
            sortBy: "createdAt",
            sortOrder: "desc",
          },
        }),
        getOrdersByShopId(shopId, { status: "COMPLETED", limit: 200 }),
      ]);

      const completedIds = new Set<string>(
        (completedOrdersRes?.data || [])
          .map((o: any) => o.productId)
          .filter(Boolean)
      );

      setCompletedProductIds(completedIds);
      setProducts(result.data || []);
    } catch (error) {
      console.error("Erreur chargement produits:", error);
      toast.error("Erreur lors du chargement des produits");
    } finally {
      setLoading(false);
    }
  }, [shopId, search, statusFilter]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts, activeTab, categoryFilter]);

  const handleDelete = async (productId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) {
      return;
    }

    try {
      await deleteProduct(productId);
      toast.success("Produit supprimé avec succès");
      loadProducts();
    } catch (error) {
      console.error("Erreur suppression:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const enrichedProducts = useMemo(
    () =>
      products.map((p) => {
        const hasCompletedOrder = completedProductIds.has(p.id);
        const isSold = p.status === "VENDU";
        const isPaid = hasCompletedOrder; // commande complétée (paiement validé) + statut vendu pris en compte
        const isLocked = isSold || isPaid;
        return { ...p, _sales: { isSold, isPaid, isLocked, hasCompletedOrder } };
      }),
    [products, completedProductIds]
  );

  const filteredProducts = enrichedProducts.filter((product) => {
    if (activeTab === "active") return product.isActive && !product._sales.isLocked;
    if (activeTab === "inactive") return !product.isActive;
    if (activeTab === "featured") return product.isFeatured;
    if (activeTab === "sold") return product._sales.isLocked;
    return true;
  });

  if (loading) {
    return <ProductsSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <Typography variant="h2" weight="bold" className="mb-1">
            Produits
          </Typography>
          <Typography variant="body-base" theme="muted">
            Gérez vos produits et votre inventaire ({products.length} produits)
          </Typography>
        </div>

        <Button onClick={() => router.push(`/marketplace/create?shopId=${shopId}`)} className="gap-2">
          <Plus className="h-4 w-4" />
          Ajouter un produit
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un produit..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                {Object.entries(statusLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                <SelectItem value="gaming">Gaming</SelectItem>
                <SelectItem value="accounts">Comptes</SelectItem>
                <SelectItem value="items">Items</SelectItem>
                <SelectItem value="services">Services</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
          <TabsList className="flex flex-wrap h-auto">
            <TabsTrigger value="all">Tous</TabsTrigger>
            <TabsTrigger value="active">Actifs</TabsTrigger>
            <TabsTrigger value="inactive">Inactifs</TabsTrigger>
            <TabsTrigger value="featured">En vedette</TabsTrigger>
            <TabsTrigger value="sold">Vendus / Payés</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <ShopExportButton shopId={shopId} kind="products" />
          <Button variant="outline" size="sm" className="gap-2" onClick={loadProducts}>
            <Filter className="h-4 w-4" />
            Actualiser
          </Button>
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <Typography variant="h4" weight="semibold" className="mb-2">
              Aucun produit trouvé
            </Typography>
            <Typography variant="body-base" theme="muted" className="mb-6 max-w-md mx-auto">
              {search || statusFilter !== "all" || categoryFilter !== "all"
                ? "Essayez de modifier vos filtres de recherche"
                : "Commencez par ajouter votre premier produit"}
            </Typography>
            <Button onClick={() => router.push(`/marketplace/create?shopId=${shopId}`)} className="gap-2">
              <Plus className="h-4 w-4" />
              Ajouter un produit
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => {
            const locked = product._sales?.isLocked;
            const sold = product._sales?.isSold || product.status === "VENDU";
            const paid = product._sales?.isPaid;
            return (
              <div key={product.id} className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {paid && (
                    <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30 gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Payé
                    </Badge>
                  )}
                  {sold && (
                    <Badge className="bg-amber-500/15 text-amber-700 border-amber-500/30 gap-1">
                      <AlertCircle className="h-3 w-3" /> Vendu
                    </Badge>
                  )}
                  {locked && (
                    <Badge variant="secondary" className="gap-1">
                      <Lock className="h-3 w-3" /> Verrouillé
                    </Badge>
                  )}
                </div>
                <ProductCard
                  item={product}
                  viewMode="grid"
                  onView={() => router.push(`/marketplace/${product.id}`)}
                  onEdit={() => {
                    if (locked) {
                      toast.info("Produit vendu/payé: modifications limitées. Ouvrez les paramètres pour consulter les détails.");
                      router.push(`/marketplace/${product.id}/dashboard/settings`);
                      return;
                    }
                    setSelectedProduct(product);
                    setIsDialogOpen(true);
                  }}
                  onDelete={
                    locked
                      ? undefined
                      : () => handleDelete(product.id)
                  }
                  showLikeButton={false}
                  showBookmarkButton={false}
                  showBuyButton={false}
                  extraActions={
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      title="Paramètres du produit"
                      aria-label="Paramètres du produit"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/marketplace/${product.id}/dashboard/settings`);
                      }}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  }
                />
              </div>
            );
          })}
        </div>
      )}

      <ProductDialog
        shopId={shopId}
        product={selectedProduct}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={() => {
          loadProducts();
          setIsDialogOpen(false);
          setSelectedProduct(null);
        }}
      />
    </div>
  );
}

function ProductsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-40" />
      </div>
      <Skeleton className="h-20 w-full" />
      <div className="flex justify-between">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-40" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-96 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
