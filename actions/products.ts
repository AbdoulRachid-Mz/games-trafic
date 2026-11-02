'use server';

import { products, type Product, type NewProduct, shops, orders, interactions, categories, users, type ProductWithRelations } from '@/database/schema';
import { eq, and, or, like, ilike, inArray, between, desc, asc, sql, count, gt, lt, gte, lte, isNull, isNotNull } from 'drizzle-orm';
import { type ProductFilters, type ListQuery, type PaginationResponse, type QueryOptions } from '@/types/api';
import { db } from '@/lib/db';
import { encryptData, decryptData } from '@/lib/encryption';
import { getCurrentUser } from '@/lib/auth/session';
import { createNotification } from '@/actions/notifications';
import { cacheTag, cacheLife } from 'next/cache';
import { revalidateTag } from 'next/cache';
import {
  type ProductCard, type ProductDetail, type ProductStats, type ProductContext,
  USER_MINI_COLUMNS, SHOP_MINI_COLUMNS, CATEGORY_MINI_COLUMNS,
  PRODUCT_CARD_COLUMNS, PAGINATION_DEFAULTS,
} from '@/types/view-models';

// ============================================================================
// QUERIES - Lecture des données
// ============================================================================

/**
 * Récupère un produit par son ID avec relations optionnelles
 */
export async function getProductById(
  id: string,
  options?: { populate?: string[] }
): Promise<ProductDetail | null> {
  'use cache';
  cacheTag(`product-${id}`, 'products');
  cacheLife('minutes');
  try {
    // Get product with relations
    const result = await db.query.products.findFirst({
      where: (products, { eq }) => eq(products.id, id),
      with: {
        shop: options?.populate?.includes('shop') ? { columns: SHOP_MINI_COLUMNS } : undefined,
        user: options?.populate?.includes('user') ? { columns: USER_MINI_COLUMNS } : undefined,
        category: options?.populate?.includes('category') ? { columns: CATEGORY_MINI_COLUMNS } : undefined,
      }
    });

    if (!result) return null;

    // Get stats
    const [orderCount, likeCount] = await Promise.all([
      db.select({ count: count() }).from(orders).where(eq(orders.productId, id)),
      db.select({ count: count() }).from(interactions).where(and(eq(interactions.entityId, id), eq(interactions.entityType, 'PRODUCT'), eq(interactions.type, 'LIKE'))),
    ]);

    return {
      ...(result as unknown as ProductDetail),
      stats: {
        viewCount: result.viewCount || 0,
        orderCount: orderCount[0]?.count || 0,
        likeCount: likeCount[0]?.count || 0,
      }
    };
  } catch (error) {
    console.error('Error getting product by ID:', error);
    throw new Error('Failed to fetch product');
  }
}

/**
 * Liste les produits avec pagination, filtres et options
 */
export async function getProducts(
  query: ListQuery<ProductFilters> = {}
): Promise<PaginationResponse<ProductCard>> {
  'use cache';
  cacheTag('products');
  cacheLife('minutes');
  try {
    const { pagination = { page: 1, limit: PAGINATION_DEFAULTS.FEED }, filters = {}, options = {} } = query;
    const offset = (pagination.page - 1) * pagination.limit;

    const whereConditions = buildProductWhereConditions(filters, options);

    let productsData;
    if (options.populate && options.populate.length > 0) {
      productsData = await db.query.products.findMany({
        columns: PRODUCT_CARD_COLUMNS,
        where: whereConditions,
        limit: pagination.limit,
        offset: offset,
        orderBy: (products, { desc, asc }) => {
          if (options.sortBy) {
            const sortField = options.sortBy as any;
            return [options.sortOrder === 'desc' ? desc((products as any)[sortField]) : asc((products as any)[sortField])];
          }
          return [desc(products.createdAt)];
        },
        with: {
          shop: options.populate.includes('shop') ? { columns: SHOP_MINI_COLUMNS } : undefined,
          user: options.populate.includes('user') ? { columns: USER_MINI_COLUMNS } : undefined,
          category: options.populate.includes('category') ? { columns: CATEGORY_MINI_COLUMNS } : undefined,
        }
      });
    } else {
      const productsQuery = db.query.products.findMany({
        columns: PRODUCT_CARD_COLUMNS,
        where: whereConditions,
        limit: pagination.limit,
        offset: offset,
        orderBy: (products, { desc, asc }) => {
          if (options.sortBy) {
            const sortField = options.sortBy as any;
            return [options.sortOrder === 'desc' ? desc((products as any)[sortField]) : asc((products as any)[sortField])];
          }
          return [desc(products.createdAt)];
        },
      });
      productsData = await productsQuery;
    }

    const totalResult = await db
      .select({ count: count() })
      .from(products)
      .where(whereConditions);

    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / pagination.limit);

    return {
      data: productsData as ProductCard[],
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages,
        hasNext: pagination.page < totalPages,
        hasPrev: pagination.page > 1
      }
    };
  } catch (error) {
    console.error('Error getting products:', error);
    throw new Error('Failed to fetch products');
  }
}

/**
 * Récupère les produits d'une boutique
 */
export async function getProductsByShopId(
  shopId: string,
  query: ListQuery<ProductFilters> = {}
): Promise<PaginationResponse<ProductCard>> {
  try {
    const { pagination = { page: 1, limit: PAGINATION_DEFAULTS.FEED }, filters = {}, options = {} } = query;
    
    return await getProducts({
      pagination,
      filters: { ...filters, shopId },
      options
    });
  } catch (error) {
    console.error('Error getting products by shop ID:', error);
    throw new Error('Failed to fetch shop products');
  }
}

/**
 * Récupère les produits par catégorie
 */
export async function getProductsByCategoryId(
  categoryId: string,
  query: ListQuery<ProductFilters> = {}
): Promise<PaginationResponse<ProductCard>> {
  try {
    const { pagination = { page: 1, limit: PAGINATION_DEFAULTS.FEED }, filters = {}, options = {} } = query;
    
    return await getProducts({
      pagination,
      filters: { ...filters, categoryId },
      options
    });
  } catch (error) {
    console.error('Error getting products by category ID:', error);
    throw new Error('Failed to fetch category products');
  }
}

/**
 * Récupère les produits par utilisateur
 */
export async function getProductsByUserId(
  userId: string,
  query: ListQuery<ProductFilters> = {}
): Promise<PaginationResponse<ProductCard>> {
  try {
    const { pagination = { page: 1, limit: PAGINATION_DEFAULTS.FEED }, filters = {}, options = {} } = query;
    
    return await getProducts({
      pagination,
      filters: { ...filters, userId },
      options
    });
  } catch (error) {
    console.error('Error getting products by user ID:', error);
    throw new Error('Failed to fetch user products');
  }
}

/**
 * Récupère les statistiques des produits
 */
export async function getProductStats(filters?: ProductFilters): Promise<ProductStats> {
  'use cache';
  cacheTag('products', 'stats');
  cacheLife('minutes');
  try {
    const whereConditions = buildProductWhereConditions(filters || {});

    const [
      totalResult,
      activeResult,
      featuredResult,
      soldResult,
      reservedResult,
      avgPriceResult
    ] = await Promise.all([
      db.select({ count: count() }).from(products).where(whereConditions),
      db.select({ count: count() }).from(products).where(and(whereConditions, eq(products.isActive, true))),
      db.select({ count: count() }).from(products).where(and(whereConditions, eq(products.isFeatured, true))),
      db.select({ count: count() }).from(products).where(and(whereConditions, eq(products.status, 'VENDU'))),
      db.select({ count: count() }).from(products).where(and(whereConditions, eq(products.status, 'RESERVE'))),
      db.select({ avgPrice: sql<number>`avg(${products.price})`.mapWith(Number) })
        .from(products)
        .where(whereConditions)
    ]);

    return {
      total: totalResult[0]?.count ?? 0,
      active: activeResult[0]?.count ?? 0,
      featured: featuredResult[0]?.count ?? 0,
      sold: soldResult[0]?.count ?? 0,
      reserved: reservedResult[0]?.count ?? 0,
      averagePrice: avgPriceResult[0]?.avgPrice ?? 0
    };
  } catch (error) {
    console.error('Error getting product stats:', error);
    throw new Error('Failed to fetch product statistics');
  }
}

/**
 * Récupère le contexte complet d'un produit (détail + stats + produits similaires)
 */
export async function getProductContext(id: string): Promise<ProductContext | null> {
  'use cache';
  cacheTag(`product-${id}`, 'products');
  cacheLife('minutes');
  try {
    const product = await getProductById(id, { populate: ['shop', 'user', 'category'] });
    if (!product) return null;

    const [stats, relatedRes] = await Promise.all([
      getProductStats(product.shopId ? { shopId: product.shopId } : undefined),
      product.categoryId
        ? getProducts({
            filters: {
              categoryId: product.categoryId,
              status: ['NON_VENDU', 'RESERVE'],
            },
            pagination: { limit: PAGINATION_DEFAULTS.RELATED, page: 1 },
            options: { sortBy: 'viewCount', sortOrder: 'desc' }
          })
        : Promise.resolve({ data: [] as ProductCard[], pagination: { page: 1, limit: 6, total: 0, totalPages: 0, hasNext: false, hasPrev: false } }),
    ]);

    return {
      product,
      stats,
      related: relatedRes.data.filter(p => p.id !== id),
    };
  } catch (error) {
    console.error('Error getting product context:', error);
    throw new Error('Failed to fetch product context');
  }
}

// ============================================================================
// MUTATIONS - Écriture des données
// ============================================================================

/**
 * Crée un nouveau produit
 */
export async function createProduct(productData: NewProduct): Promise<Product> {
  try {
    // SEC-05 FIX: Verify the current user owns the shop they're adding to
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error('Non authentifié');
    const isAdmin = currentUser.role === 'admin' || (currentUser as any).isAdmin === true;

    // Validation des données requises
    if (!productData.shopId || !productData.name || !productData.price) {
      throw new Error('shopId, name and price are required');
    }

    // Vérification que la boutique existe ET appartient à l'utilisateur
    const shopExists = await db
      .select()
      .from(shops)
      .where(eq(shops.id, productData.shopId))
      .limit(1);

    if (shopExists.length === 0) {
      throw new Error('Shop not found');
    }

    if (!isAdmin && shopExists[0].ownerId !== currentUser.id) {
      throw new Error('Accès refusé — vous n\'êtes pas propriétaire de cette boutique');
    }

    // userId is always sourced from session, never from client input
    const safeProductData = { ...productData, userId: currentUser.id };

    const result = await db
      .insert(products)
      .values({
        ...safeProductData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Mise à jour du compteur de produits de la boutique
    await updateShopProductCount(productData.shopId);

    // Notifier les followers de la boutique
    try {
      const followers = await db
        .select({ userId: interactions.userId })
        .from(interactions)
        .where(and(
          eq(interactions.entityId, productData.shopId),
          eq(interactions.entityType, 'SHOP'),
          eq(interactions.type, 'FOLLOW'),
          eq(interactions.isDeleted, false)
        ));

      if (followers.length > 0) {
        // Obtenir le nom de la boutique pour le message
        const shop = await db.query.shops.findFirst({
          where: (shops, { eq }) => eq(shops.id, productData.shopId),
          columns: { name: true }
        });

        const shopName = shop?.name || "Une boutique que vous suivez";

        await Promise.all(followers.map(follower => 
          createNotification({
            userId: follower.userId,
            title: "Nouveau produit !",
            message: `${shopName} a ajouté un nouveau produit : ${productData.name}`,
            type: "SYSTEM",
            linkUrl: `/marketplace/${result[0].id}`,
            shopId: productData.shopId,
          })
        ));
      }
    } catch (notifError) {
      console.error("Error sending notifications to followers:", notifError);
    }

    revalidateTag('products', 'max');
    return result[0];
  } catch (error) {
    console.error('Error creating product:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to create product');
  }
}

/**
 * Met à jour un produit
 * SEC-05 FIX: Owner (via shop) or admin only
 */
export async function updateProduct(
  id: string,
  productData: Partial<NewProduct>
): Promise<Product> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error('Non authentifié');
    const isAdmin = currentUser.role === 'admin' || (currentUser as any).isAdmin === true;

    // Vérification que le produit existe
    const existingProduct = await getProductById(id);
    if (!existingProduct) {
      throw new Error('Product not found');
    }

    // Ownership check via shop
    if (!isAdmin) {
      const shop = await db.select({ ownerId: shops.ownerId }).from(shops)
        .where(eq(shops.id, existingProduct.shopId)).limit(1);
      if (!shop[0] || shop[0].ownerId !== currentUser.id) {
        throw new Error('Accès refusé — vous n\'êtes pas propriétaire de ce produit');
      }
    }

    // Strip fields non-admins cannot modify
    const safeData = { ...productData };
    if (!isAdmin) {
      delete (safeData as any).userId;
      delete (safeData as any).shopId;
      delete (safeData as any).status;
    }

    const result = await db
      .update(products)
      .set({
        ...safeData,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();

    // Si le shopId change, mettre à jour les compteurs des boutiques
    if (productData.shopId && productData.shopId !== existingProduct.shopId) {
      await updateShopProductCount(existingProduct.shopId);
      await updateShopProductCount(productData.shopId);
    }

    revalidateTag('products', 'max');
    revalidateTag(`product-${id}`, 'max');
    return result[0];
  } catch (error) {
    console.error('Error updating product:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to update product');
  }
}

/**
 * Supprime un produit (soft delete)
 * SEC-05 FIX: Owner (via shop) or admin only
 */
export async function deleteProduct(id: string): Promise<Product> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error('Non authentifié');
    const isAdmin = currentUser.role === 'admin' || (currentUser as any).isAdmin === true;

    const product = await getProductById(id);
    if (!product) {
      throw new Error('Product not found');
    }

    if (!isAdmin) {
      const shop = await db.select({ ownerId: shops.ownerId }).from(shops)
        .where(eq(shops.id, product.shopId)).limit(1);
      if (!shop[0] || shop[0].ownerId !== currentUser.id) {
        throw new Error('Accès refusé — vous n\'êtes pas propriétaire de ce produit');
      }
    }

    const result = await db
      .update(products)
      .set({
        isDeleted: true,
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();

    // Mise à jour du compteur de produits de la boutique
    await updateShopProductCount(product.shopId);

    revalidateTag('products', 'max');
    revalidateTag(`product-${id}`, 'max');
    return result[0];
  } catch (error) {
    console.error('Error deleting product:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to delete product');
  }
}

/**
 * Restaure un produit supprimé
 * SEC-05 FIX: Admin only
 */
export async function restoreProduct(id: string): Promise<Product> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error('Non authentifié');
    const isAdmin = currentUser.role === 'admin' || (currentUser as any).isAdmin === true;
    if (!isAdmin) throw new Error('Accès réservé aux administrateurs');
    const result = await db
      .update(products)
      .set({
        isDeleted: false,
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error('Product not found');
    }

    // Mise à jour du compteur de produits de la boutique
    await updateShopProductCount(result[0].shopId);

    revalidateTag('products', 'max');
    revalidateTag(`product-${id}`, 'max');
    return result[0];
  } catch (error) {
    console.error('Error restoring product:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to restore product');
  }
}

/**
 * Met à jour le statut d'un produit
 */
export async function updateProductStatus(
  id: string,
  status: 'NON_VENDU' | 'RESERVE' | 'EN_ECHANGE' | 'LIVRE' | 'VENDU' | 'ANNULER'
): Promise<Product> {
  try {
    const result = await db
      .update(products)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error('Product not found');
    }

    revalidateTag('products', 'max');
    revalidateTag(`product-${id}`, 'max');
    return result[0];
  } catch (error) {
    console.error('Error updating product status:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to update product status');
  }
}

/**
 * Marque un produit comme vendu
 */
export async function markProductAsSold(
  id: string,
  deliveredToUserId: string
): Promise<Product> {
  try {
    const result = await db
      .update(products)
      .set({
        status: 'VENDU',
        deliveredToUserId,
        deliveredAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error('Product not found');
    }

    revalidateTag('products', 'max');
    revalidateTag(`product-${id}`, 'max');
    return result[0];
  } catch (error) {
    console.error('Error marking product as sold:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to mark product as sold');
  }
}

/**
 * Incrémente le compteur de vues d'un produit
 */
export async function incrementProductViewCount(id: string): Promise<Product> {
  try {
    const result = await db
      .update(products)
      .set({
        viewCount: sql`${products.viewCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error('Product not found');
    }

    revalidateTag('products', 'max');
    revalidateTag(`product-${id}`, 'max');
    return result[0];
  } catch (error) {
    console.error('Error incrementing product view count:', error);
    throw new Error('Failed to increment product view count');
  }
}

export async function setProductCredentials(
  id: string,
  login: string,
  plainPassword: string
): Promise<Product> {
  try {
    const encrypted = encryptData(plainPassword);
    const result = await db
      .update(products)
      .set({
        accountLogin: login,
        encryptedPassword: encrypted,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();
    if (result.length === 0) {
      throw new Error('Product not found');
    }
    revalidateTag('products', 'max');
    revalidateTag(`product-${id}`, 'max');
    return result[0];
  } catch (error) {
    console.error('Error setting product credentials:', error);
    if (error instanceof Error) throw error;
    throw new Error('Failed to set product credentials');
  }
}

export async function getProductCredentialsForAdmin(productId: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("Accès refusé");
  }
  const product = await getProductById(productId);
  if (!product) {
    throw new Error("Product not found");
  }
  const decryptedPassword = product.encryptedPassword
    ? decryptData(product.encryptedPassword)
    : "";
  return {
    accountLogin: product.accountLogin || null,
    password: decryptedPassword || null,
  };
}

// ============================================================================
// UTILITAIRES
// ============================================================================

/**
 * Construit les conditions WHERE pour les requêtes products
 */
function buildProductWhereConditions(
  filters: ProductFilters,
  options: QueryOptions = {}
) {
  const conditions = [];

  // Filtres de base
  if (!options.includeDeleted) {
    conditions.push(eq(products.isDeleted, false));
  }
  if (!options.includeInactive) {
    conditions.push(eq(products.isActive, true));
  }

  // Filtres spécifiques
  if (filters.id) {
    conditions.push(eq(products.id, filters.id));
  }
  if (filters.shopId) {
    conditions.push(eq(products.shopId, filters.shopId));
  }
  if (filters.userId) {
    conditions.push(eq(products.userId, filters.userId));
  }
  if (filters.categoryId) {
    conditions.push(eq(products.categoryId, filters.categoryId));
  }
  if (filters.name) {
    conditions.push(ilike(products.name, `%${filters.name}%`));
  }
  if (filters.game) {
    conditions.push(ilike(products.game, `%${filters.game}%`));
  }
  if (filters.platform && filters.platform.length > 0) {
    conditions.push(inArray(products.platform, filters.platform));
  }
  if (filters.status && filters.status.length > 0) {
    conditions.push(inArray(products.status, filters.status));
  }
  if (filters.currency) {
    conditions.push(eq(products.currency, filters.currency));
  }
  if (filters.accountLevel) {
    conditions.push(eq(products.accountLevel, filters.accountLevel));
  }
  if (filters.accountRank) {
    conditions.push(eq(products.accountRank, filters.accountRank));
  }
  if (typeof filters.isNegotiable === 'boolean') {
    conditions.push(eq(products.isNegotiable, filters.isNegotiable));
  }
  if (typeof filters.isFeatured === 'boolean') {
    conditions.push(eq(products.isFeatured, filters.isFeatured));
  }
  if (typeof filters.isVisible === 'boolean') {
    conditions.push(eq(products.isVisible, filters.isVisible));
  }
  if (filters.deliveredToUserId) {
    conditions.push(eq(products.deliveredToUserId, filters.deliveredToUserId));
  }

  // Filtres de prix
  if (filters.priceMin !== undefined) {
    conditions.push(gte(products.price, sql`${filters.priceMin}`));
  }
  if (filters.priceMax !== undefined) {
    conditions.push(lte(products.price, sql`${filters.priceMax}`));
  }

  // Filtres de vues
  if (filters.viewCountMin !== undefined) {
    conditions.push(gte(products.viewCount, filters.viewCountMin));
  }
  if (filters.viewCountMax !== undefined) {
    conditions.push(lte(products.viewCount, filters.viewCountMax));
  }

  // Filtres de date
  if (filters.deliveredFrom) {
    conditions.push(gte(products.deliveredAt, new Date(filters.deliveredFrom)));
  }
  if (filters.deliveredTo) {
    conditions.push(lte(products.deliveredAt, new Date(filters.deliveredTo)));
  }
  if (filters.createdFrom) {
    conditions.push(gte(products.createdAt, new Date(filters.createdFrom)));
  }
  if (filters.createdTo) {
    conditions.push(lte(products.createdAt, new Date(filters.createdTo)));
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

/**
 * Met à jour le compteur de produits d'une boutique
 */
async function updateShopProductCount(shopId: string): Promise<void> {
  try {
    const countResult = await db
      .select({ count: count() })
      .from(products)
      .where(and(eq(products.shopId, shopId), eq(products.isDeleted, false)));

    const productCount = countResult[0]?.count ?? 0;

    await db
      .update(shops)
      .set({ productCount })
      .where(eq(shops.id, shopId));
  } catch (error) {
    console.error('Error updating shop product count:', error);
  }
}
