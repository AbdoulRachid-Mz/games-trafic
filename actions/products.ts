'use server';

import { products, type Product, type NewProduct, shops, orders, interactions, categories, users, ProductWithRelations } from '@/database/schema';
import { eq, and, or, like, ilike, inArray, between, desc, asc, sql, count, gt, lt, gte, lte, isNull, isNotNull } from 'drizzle-orm';
import { type ProductFilters, type ListQuery, type PaginationResponse, type QueryOptions } from '@/types/api';
import { db } from '@/lib/db';
import { encryptData, decryptData } from '@/lib/encryption';
import { getCurrentUser } from '@/lib/auth/session';

// ============================================================================
// QUERIES - Lecture des données
// ============================================================================

/**
 * Récupère un produit par son ID avec relations optionnelles
 */
export async function getProductById(
  id: string,
  options?: { populate?: string[] }
): Promise<ProductWithRelations | null> {
  try {
    if (options?.populate && options.populate.length > 0) {
      const query = db.query.products.findFirst({
        where: (products, { eq }) => eq(products.id, id),
        with: {
          shop: options.populate.includes('shop') ? true : undefined,
          user: options.populate.includes('user') ? true : undefined,
          category: options.populate.includes('category') ? true : undefined,
          orders: options.populate.includes('orders') ? true : undefined,
        }
      });
      const result = await query;
      return result ? result as ProductWithRelations : null;
    }

    const result = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    return result[0] ? result[0] as ProductWithRelations : null;
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
): Promise<PaginationResponse<ProductWithRelations>> {
  try {
    const { pagination = { page: 1, limit: 50 }, filters = {}, options = {} } = query;
    const offset = (pagination.page - 1) * pagination.limit;

    const whereConditions = buildProductWhereConditions(filters, options);

    const productsQuery = db
      .select()
      .from(products)
      .where(whereConditions)
      .limit(pagination.limit)
      .offset(offset);

    if (options.sortBy) {
      const sortField = options.sortBy as keyof Product;
      const sortOrder = options.sortOrder === 'desc' ? desc : asc;
      productsQuery.orderBy(sortOrder(products[sortField]));
    } else {
      productsQuery.orderBy(desc(products.createdAt));
    }

    const countQuery = db
      .select({ count: count() })
      .from(products)
      .where(whereConditions);

    const [productsData, totalResult] = await Promise.all([
      productsQuery,
      countQuery
    ]);

    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / pagination.limit);

    return {
      data: productsData,
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
): Promise<PaginationResponse<Product>> {
  try {
    const { pagination = { page: 1, limit: 50 }, filters = {}, options = {} } = query;
    
    const shopProducts = await getProducts({
      pagination,
      filters: { ...filters, shopId },
      options
    });

    return shopProducts;
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
): Promise<PaginationResponse<Product>> {
  try {
    const { pagination = { page: 1, limit: 50 }, filters = {}, options = {} } = query;
    
    const categoryProducts = await getProducts({
      pagination,
      filters: { ...filters, categoryId },
      options
    });

    return categoryProducts;
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
): Promise<PaginationResponse<Product>> {
  try {
    const { pagination = { page: 1, limit: 50 }, filters = {}, options = {} } = query;
    
    const userProducts = await getProducts({
      pagination,
      filters: { ...filters, userId },
      options
    });

    return userProducts;
  } catch (error) {
    console.error('Error getting products by user ID:', error);
    throw new Error('Failed to fetch user products');
  }
}

/**
 * Récupère les statistiques des produits
 */
export async function getProductStats(filters?: ProductFilters) {
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

    const stats = {
      total: totalResult[0]?.count ?? 0,
      active: activeResult[0]?.count ?? 0,
      featured: featuredResult[0]?.count ?? 0,
      sold: soldResult[0]?.count ?? 0,
      reserved: reservedResult[0]?.count ?? 0,
      averagePrice: avgPriceResult[0]?.avgPrice ?? 0
    };

    return stats;
  } catch (error) {
    console.error('Error getting product stats:', error);
    throw new Error('Failed to fetch product statistics');
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
    // Validation des données requises
    if (!productData.shopId || !productData.name || !productData.price) {
      throw new Error('shopId, name and price are required');
    }

    // Vérification que la boutique existe
    const shopExists = await db
      .select()
      .from(shops)
      .where(eq(shops.id, productData.shopId))
      .limit(1);

    if (shopExists.length === 0) {
      throw new Error('Shop not found');
    }

    const result = await db
      .insert(products)
      .values({
        ...productData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Mise à jour du compteur de produits de la boutique
    await updateShopProductCount(productData.shopId);

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
 */
export async function updateProduct(
  id: string,
  productData: Partial<NewProduct>
): Promise<Product> {
  try {
    // Vérification que le produit existe
    const existingProduct = await getProductById(id);
    if (!existingProduct) {
      throw new Error('Product not found');
    }

    const result = await db
      .update(products)
      .set({
        ...productData,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();

    // Si le shopId change, mettre à jour les compteurs des boutiques
    if (productData.shopId && productData.shopId !== existingProduct.shopId) {
      await updateShopProductCount(existingProduct.shopId);
      await updateShopProductCount(productData.shopId);
    }

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
 */
export async function deleteProduct(id: string): Promise<Product> {
  try {
    const product = await getProductById(id);
    if (!product) {
      throw new Error('Product not found');
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
 */
export async function restoreProduct(id: string): Promise<Product> {
  try {
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
