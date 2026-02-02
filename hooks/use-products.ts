// hooks/use-products.ts
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsByShopId,
  getProductsByCategoryId,
  getProductsByUserId,
  getProductStats,
  updateProductStatus,
  markProductAsSold,
  incrementProductViewCount,
} from "@/actions/products";
import type { ProductFilters, ListQuery } from "@/types/api";
import { toast } from "sonner";

// Clés de requête
export const productKeys = {
  all: ["products"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  list: (filters?: ProductFilters) => [...productKeys.lists(), { filters }] as const,
  details: () => [...productKeys.all, "detail"] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
  shop: (shopId: string) => [...productKeys.all, "shop", shopId] as const,
  category: (categoryId: string) => [...productKeys.all, "category", categoryId] as const,
  user: (userId: string) => [...productKeys.all, "user", userId] as const,
  stats: (filters?: ProductFilters) => [...productKeys.all, "stats", { filters }] as const,
};

// Hook pour la liste des produits (infinie)
export function useProducts(query: ListQuery<ProductFilters> = {}) {
  return useInfiniteQuery({
    queryKey: productKeys.list(query.filters),
    queryFn: async ({ pageParam = 1 }) => {
      const res = await getProducts({
        ...query,
        pagination: {
          ...query.pagination,
          page: pageParam,
          limit: query.pagination?.limit ?? 20,
        },
      });
      return {
        products: res.data,
        pagination: res.pagination,
      };
    },
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasNext ? lastPage.pagination.page + 1 : undefined;
    },
    initialPageParam: 1,
  });
}

// Hook pour un produit spécifique
export function useProduct(id: string, options?: { populate?: string[] }) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => getProductById(id, options),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook pour les produits d'une boutique
export function useProductsByShopId(shopId: string, query: ListQuery<ProductFilters> = {}) {
  return useQuery({
    queryKey: [...productKeys.shop(shopId), query],
    queryFn: () => getProductsByShopId(shopId, query),
    enabled: !!shopId,
  });
}

// Hook pour les produits d'une catégorie
export function useProductsByCategoryId(categoryId: string, query: ListQuery<ProductFilters> = {}) {
  return useQuery({
    queryKey: [...productKeys.category(categoryId), query],
    queryFn: () => getProductsByCategoryId(categoryId, query),
    enabled: !!categoryId,
  });
}

// Hook pour créer un produit
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProduct,
    onSuccess: (product) => {
      // Invalider les caches pertinents
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      queryClient.invalidateQueries({ queryKey: productKeys.shop(product.shopId) });
      if (product.categoryId) {
        queryClient.invalidateQueries({ queryKey: productKeys.category(product.categoryId) });
      }
      if (product.userId) {
        queryClient.invalidateQueries({ queryKey: productKeys.user(product.userId) });
      }
      
      toast.success("Produit créé avec succès");
    },
    onError: (error) => {
      console.error("Error creating product:", error);
      toast.error(error.message || "Erreur lors de la création du produit");
    },
  });
}

// Hook pour mettre à jour un produit
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<any> }) =>
      updateProduct(id, data),
    onSuccess: (product) => {
      // Mettre à jour le cache du produit spécifique
      queryClient.setQueryData(productKeys.detail(product.id), product);
      
      // Invalider les listes
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.shop(product.shopId) });
      
      toast.success("Produit mis à jour avec succès");
    },
    onError: (error) => {
      console.error("Error updating product:", error);
      toast.error(error.message || "Erreur lors de la mise à jour du produit");
    },
  });
}

// Hook pour supprimer un produit
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProduct,
    onSuccess: (product) => {
      // Supprimer du cache
      queryClient.removeQueries({ queryKey: productKeys.detail(product.id) });
      
      // Invalider les listes
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.shop(product.shopId) });
      
      toast.success("Produit supprimé avec succès");
    },
    onError: (error) => {
      console.error("Error deleting product:", error);
      toast.error(error.message || "Erreur lors de la suppression du produit");
    },
  });
}

// Hook pour les statistiques des produits
export function useProductStats(filters?: ProductFilters) {
  return useQuery({
    queryKey: productKeys.stats(filters),
    queryFn: () => getProductStats(filters),
  });
}

// Hook pour marquer comme vendu
export function useMarkProductAsSold() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, userId }: { id: string; userId: string }) =>
      markProductAsSold(id, userId),
    onSuccess: (product) => {
      queryClient.setQueryData(productKeys.detail(product.id), product);
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      
      toast.success("Produit marqué comme vendu");
    },
    onError: (error) => {
      console.error("Error marking product as sold:", error);
      toast.error(error.message || "Erreur lors de la mise à jour du statut");
    },
  });
}

// Hook pour incrémenter les vues
export function useIncrementViewCount() {
  return useMutation({
    mutationFn: incrementProductViewCount,
    onError: (error) => {
      console.error("Error incrementing view count:", error);
    },
  });
}