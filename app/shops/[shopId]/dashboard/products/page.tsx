// app/(main)/shops/[id]/products/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Package,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  ShoppingBag,
  TrendingUp,
  Star,
  Copy,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import Image from "next/image";
import { getProductsByShopId, deleteProduct, updateProductStatus } from "@/actions/products";
import { AdvancedUpload } from "@/components/ui/advanced-upload";
import { ProductDialog } from "@/components/pages/shops/products/product-dialog";
import { ProductCard } from "@/components/cards/product-card";

const statusColors = {
  "NON_VENDU": "bg-gray-500",
  "RESERVE": "bg-blue-500",
  "EN_ECHANGE": "bg-purple-500",
  "LIVRE": "bg-green-500",
  "VENDU": "bg-emerald-500",
  "ANNULER": "bg-red-500",
};

const statusLabels = {
  "NON_VENDU": "En stock",
  "RESERVE": "Réservé",
  "EN_ECHANGE": "En échange",
  "LIVRE": "Livré",
  "VENDU": "Vendu",
  "ANNULER": "Annulé",
};

export default function ShopProductsPage() {
  const params = useParams();
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    loadProducts();
  }, [activeTab, statusFilter, categoryFilter]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const filters: any = {
        shopId: params.shopId as string,
        isDeleted: false,
      };

      if (statusFilter !== "all") {
        filters.status = [statusFilter];
      }

      if (search) {
        filters.name = search;
      }

      const result = await getProductsByShopId(params.shopId as string, {
        filters,
        pagination: { page: 1, limit: 50 },
        options: {
          sortBy: "createdAt",
          sortOrder: "desc",
        },
      });

      setProducts(result.data);
    } catch (error) {
      console.error("Erreur chargement produits:", error);
      toast.error("Erreur lors du chargement des produits");
    } finally {
      setLoading(false);
    }
  };

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

  const handleStatusChange = async (productId: string, newStatus: string) => {
    try {
      await updateProductStatus(productId, newStatus as any);
      toast.success("Statut mis à jour");
      loadProducts();
    } catch (error) {
      console.error("Erreur mise à jour:", error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleDuplicate = (product: any) => {
    setSelectedProduct({
      ...product,
      name: `${product.name} (Copie)`,
      id: undefined,
    });
    setIsDialogOpen(true);
  };

  const handleExport = () => {
    // Logique d'export
    toast.success("Export lancé");
  };

  const filteredProducts = products.filter(product => {
    if (activeTab === "active") return product.isActive;
    if (activeTab === "inactive") return !product.isActive;
    if (activeTab === "featured") return product.isFeatured;
    return true;
  });

  if (loading) {
    return <ProductsSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <Typography variant="h2" weight="bold" className="mb-1">
            Produits
          </Typography>
          <Typography variant="body-base" theme="muted">
            Gérez vos produits et votre inventaire ({products.length} produits)
          </Typography>
        </div>
        
        <Button 
          onClick={() => router.push(`/shops/${params.shopId}/dashboard/products/create`)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Ajouter un produit
        </Button>
      </div>

      {/* Filtres */}
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
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                <SelectItem value="gaming">🎮 Gaming</SelectItem>
                <SelectItem value="accounts">👤 Comptes</SelectItem>
                <SelectItem value="items">🛡️ Items</SelectItem>
                <SelectItem value="services">⚡ Services</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Onglets et actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
          <TabsList>
            <TabsTrigger value="all">Tous</TabsTrigger>
            <TabsTrigger value="active">Actifs</TabsTrigger>
            <TabsTrigger value="inactive">Inactifs</TabsTrigger>
            <TabsTrigger value="featured">En vedette</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}>
            <Copy className="h-4 w-4" />
            Exporter
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Plus de filtres
          </Button>
        </div>
      </div>

      {/* Liste des produits */}
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
            <Button 
              onClick={() => {
                setSelectedProduct(null);
                setIsDialogOpen(true);
              }}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Ajouter un produit
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => {
            return (
              <ProductCard
                key={product.id}
                item={product}
                viewMode="grid"
                onView={() => router.push(`/products/${product.id}`)}
                onEdit={() => {
                  setSelectedProduct(product);
                  setIsDialogOpen(true);
                }}
                onDelete={() => handleDelete(product.id)}
                // extraActions={extraActions}
                showLikeButton={false}
                showBookmarkButton={false}
                showBuyButton={false}
              />
            );
          })}
        </div>
      )}

      {/* Dialog produit */}
      <ProductDialog
        shopId={params.shopId as string}
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