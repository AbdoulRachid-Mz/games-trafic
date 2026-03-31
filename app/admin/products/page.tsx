"use client";

import React, { useState, useEffect } from "react";
import { EntityList } from "@/components/shared/entity-list";
import { useEntityList } from "@/hooks/use-entity-list";
import {
  getProducts,
  updateProduct,
  deleteProduct,
  getProductStats,
} from "@/actions/products";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatCurrency } from "@/lib/utils";
import {
  Package,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Tag,
  Gamepad2,
  TrendingUp,
  Activity,
  DollarSign,
  Store,
} from "lucide-react";
import { StatCard } from "@/components/admin/stat-card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import Image from "next/image";
import { cn } from "@/lib/utils";

export default function AdminProductsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);

  const {
    data,
    loading,
    page,
    limit,
    searchTerm,
    filters,
    viewMode,
    total,
    setPage,
    setLimit,
    setSearchTerm,
    setFilters,
    setViewMode,
    onRefresh,
    isPlaceholderData,
  } = useEntityList<any>({
    entityType: "products",
    defaultFilters: {
      limit: 20,
      populate: ["shop", "category", "user"],
    },
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const s = await getProductStats();
      setStats(s);
    } catch (error) {
      console.error("Error loading product stats:", error);
    }
  };

  const handleToggleStatus = async (product: any) => {
    try {
      await updateProduct(product.id, { isActive: !product.isActive });
      toast.success(product.isActive ? "Produit désactivé" : "Produit activé");
      onRefresh();
      loadStats();
    } catch (error) {
      toast.error("Erreur lors de la modification");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce produit ?")) return;
    try {
      await deleteProduct(id);
      toast.success("Produit supprimé");
      onRefresh();
      loadStats();
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const renderStats = () => {
    if (!stats) return null;
    return (
      <>
        <StatCard
          title="Total Produits"
          value={stats.total}
          icon={Package}
          iconClassName="bg-blue-500/10 text-blue-500"
        />
        <StatCard
          title="Prix Moyen"
          value={formatCurrency(stats.averagePrice || 0, "GTC")}
          icon={DollarSign}
          iconClassName="bg-green-500/10 text-green-500"
        />
        <StatCard
          title="Produits Vendus"
          value={stats.sold}
          icon={CheckCircle}
          iconClassName="bg-purple-500/10 text-purple-500"
        />
        <StatCard
          title="En vedette"
          value={stats.featured}
          icon={TrendingUp}
          iconClassName="bg-amber-500/10 text-amber-500"
        />
      </>
    );
  };

  return (
    <div className="space-y-6">
      <EntityList
        title="Gestion des Produits"
        description="Gérez le catalogue de comptes et items en vente"
        entityType="products"
        data={data}
        loading={loading}
        isPlaceholderData={isPlaceholderData}
        page={page}
        limit={limit}
        total={total}
        searchTerm={searchTerm}
        filters={filters}
        viewMode={viewMode}
        onPageChange={setPage}
        onLimitChange={setLimit}
        onSearchChange={setSearchTerm}
        onFilterChange={setFilters}
        onViewModeChange={setViewMode}
        onRefresh={() => {
          onRefresh();
          loadStats();
        }}
        renderStats={renderStats}
        availableFilters={[
          {
            key: "status",
            label: "Statut",
            type: "select",
            options: [
              { label: "Tous", value: "all" },
              { label: "À vendre", value: "A_VENDRE" },
              { label: "Réservé", value: "RESERVE" },
              { label: "Vendu", value: "VENDU" },
            ],
          },
          {
            key: "isActive",
            label: "Visibilité",
            type: "select",
            options: [
              { label: "Tous", value: "all" },
              { label: "Actif", value: "true" },
              { label: "Inactif", value: "false" },
            ],
          },
        ]}
        renderTableHeader={() => (
          <tr className="border-b">
            <th className="text-left p-4">Produit</th>
            <th className="text-left p-4">Boutique</th>
            <th className="text-left p-4">Prix</th>
            <th className="text-left p-4">Statut</th>
            <th className="text-right p-4">Actions</th>
          </tr>
        )}
        renderTableRow={(product: any) => (
          <tr key={product.id} className="border-b hover:bg-muted/50">
            <td className="p-4">
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10 rounded overflow-hidden bg-muted">
                  {product.featuredImage ? (
                    <Image src={product.featuredImage} alt={product.name} fill className="object-cover" />
                  ) : (
                    <Package className="h-5 w-5 m-2.5 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <div className="font-medium">{product.name}</div>
                  <div className="text-xs text-muted-foreground">{product.game} • {product.platform}</div>
                </div>
              </div>
            </td>
            <td className="p-4 text-sm">
              <div className="flex items-center gap-2">
                <Store className="h-3 w-3 text-muted-foreground" />
                {product.shop?.name || "N/A"}
              </div>
            </td>
            <td className="p-4 font-semibold">{product.price} GTC</td>
            <td className="p-4">
              <Badge variant={product.status === "VENDU" ? "secondary" : "default"}>
                {product.status}
              </Badge>
            </td>
            <td className="p-4 text-right">
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push(`/products/${product.slug || product.id}`)}>
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(product.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </td>
          </tr>
        )}
        renderCard={(product: any) => (
          <Card key={product.id} className="overflow-hidden h-full flex flex-col">
            <div className="relative h-32 bg-muted">
              {product.featuredImage ? (
                <Image src={product.featuredImage} alt={product.name} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div className="absolute top-2 right-2">
                <Badge variant={product.isActive ? "default" : "secondary"}>
                  {product.isActive ? "Actif" : "Inactif"}
                </Badge>
              </div>
            </div>
            <CardContent className="p-4 flex-1 flex flex-col gap-3">
              <div>
                <div className="font-bold line-clamp-1">{product.name}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Gamepad2 className="h-3 w-3" /> {product.game}
                </div>
              </div>
              
              <div className="flex justify-between items-center mt-auto pt-3 border-t">
                <div className="font-bold text-primary">{product.price} GTC</div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => router.push(`/products/${product.slug || product.id}`)}>
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(product.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      />
    </div>
  );
}

