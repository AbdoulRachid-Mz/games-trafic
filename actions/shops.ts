// @/actions/shops.ts
'use server';

import { 
  shops, users, themes, products, entityCategories, categories,
  type Shop, type NewShop, type User, type Theme,
  interactions
} from '@/database/schema';
import { 
  eq, and, or, like, ilike, inArray, between, 
  desc, asc, sql, count, gt, lt, gte, lte, isNull, isNotNull, 
  sum
} from 'drizzle-orm';
import { 
  type ShopFilters, 
  type ListQuery, 
  type PaginationResponse,
  type QueryOptions 
} from '@/types/api';
import { db } from '@/lib/db';

// ============================================================================
// QUERIES - Lecture des données
// ============================================================================

/**
 * Récupère une boutique par son ID avec relations optionnelles
 */
export async function getShopById(
  id: string, 
  options?: { populate?: string[] }
): Promise<(Shop & {
  owner?: User;
  theme?: Theme;
  productsCount?: number;
  categories?: any[];
}) | null> {
  try {
    if (options?.populate && options.populate.length > 0) {
      // Utilisation des relational queries pour les relations complexes
      const shopWithRelations = await db.query.shops.findFirst({
        where: (shops, { eq }) => eq(shops.id, id),
        with: {
          owner: options.populate.includes('owner') ? true : undefined,
          theme: options.populate.includes('theme') ? true : undefined,
          products: options.populate.includes('products') ? {
            columns: { id: true }
          } : undefined,
          categories: options.populate.includes('categories') ? {
            with: {
              category: true
            }
          } : undefined,
        },
      });

      if (!shopWithRelations) return null;

      // Transformation des données pour inclure les counts
      const result: any = { ...shopWithRelations };
      
      if (options.populate.includes('products')) {
        result.productsCount = shopWithRelations.products?.length || 0;
      }

      return result;
    }

    // Requête simple sans relations
    const result = await db
      .select()
      .from(shops)
      .where(eq(shops.id, id))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error('Error getting shop by ID:', error);
    throw new Error('Failed to fetch shop');
  }
}

/**
 * Récupère une boutique par son nom
 */
export async function getShopByName(name: string): Promise<Shop | null> {
  try {
    const result = await db
      .select()
      .from(shops)
      .where(eq(shops.name, name))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error('Error getting shop by name:', error);
    throw new Error('Failed to fetch shop');
  }
}

/**
 * Récupère les boutiques d'un propriétaire
 */
export async function getShopsByOwner(
  ownerId: string,
  query: ListQuery<ShopFilters> = {}
): Promise<PaginationResponse<Shop>> {
  try {
    const filters = { ...query.filters, ownerId };
    return await getShops({ ...query, filters });
  } catch (error) {
    console.error('Error getting shops by owner:', error);
    throw new Error('Failed to fetch shops');
  }
}

/**
 * Liste les boutiques avec pagination, filtres et options
 */
export async function getShops(
  query: ListQuery<ShopFilters> = {}
): Promise<PaginationResponse<Shop>> {
  try {
    const {
      pagination = { page: 1, limit: 50 },
      filters = {},
      options = {}
    } = query;

    const offset = (pagination.page - 1) * pagination.limit;

    // Construction des conditions WHERE
    const whereConditions = buildShopWhereConditions(filters, options);

    // Requête pour les données
    const shopsQuery = db
      .select()
      .from(shops)
      .where(whereConditions)
      .limit(pagination.limit)
      .offset(offset);

    // Application du tri
    if (options.sortBy) {
      const sortField = options.sortBy as keyof Shop;
      const sortOrder = options.sortOrder === 'desc' ? desc : asc;
      shopsQuery.orderBy(sortOrder(shops[sortField]));
    } else {
      shopsQuery.orderBy(desc(shops.createdAt));
    }

    // Requête pour le count total
    const countQuery = db
      .select({ count: count() })
      .from(shops)
      .where(whereConditions);

    const [shopsData, totalResult] = await Promise.all([
      shopsQuery,
      countQuery
    ]);

    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / pagination.limit);

    return {
      data: shopsData,
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
    console.error('Error getting shops:', error);
    throw new Error('Failed to fetch shops');
  }
}

/**
 * Récupère les boutiques populaires (les plus suivies/vues)
 */
export async function getPopularShops(
  limit: number = 10
): Promise<Shop[]> {
  try {
    // Use a subquery to count products per shop
    const productCountSubquery = db
      .select({
        shopId: products.shopId,
        productCount: count(products.id).as('productCount'),
      })
      .from(products)
      .where(eq(products.isDeleted, false))
      .groupBy(products.shopId)
      .as('productCountSubquery');

    // Use a subquery to count followers per shop via interactions
    const followerCountSubquery = db
      .select({
        entityId: interactions.entityId,
        followerCount: count(interactions.userId).as('followerCount'),
      })
      .from(interactions)
      .where(
        and(
          eq(interactions.entityType, 'SHOP'),
          eq(interactions.type, 'FOLLOW'),
          eq(interactions.isDeleted, false)
        )
      )
      .groupBy(interactions.entityId)
      .as('followerCountSubquery');

    // Main query joining shops with computed counts
    const result = await db
      .select({
        id: shops.id,
        ownerId: shops.ownerId,
        name: shops.name,
        description: shops.description,
        profileImage: shops.profileImage,
        coverImage: shops.coverImage,
        phoneNumber: shops.phoneNumber,
        country: shops.country,
        address: shops.address,
        website: shops.website,
        socialMedia: shops.socialMedia,
        productCount: sql<number>`COALESCE(${productCountSubquery.productCount}, 0)`,
        viewCount: shops.viewCount,
        balance: shops.balance,
        verified: shops.verified,
        featured: shops.featured,
        isActive: shops.isActive,
        isVisible: shops.isVisible,
        isDeleted: shops.isDeleted,
        themeId: shops.themeId,
        customTheme: shops.customTheme,
        notificationSettings: shops.notificationSettings,
        createdAt: shops.createdAt,
        updatedAt: shops.updatedAt,
      })
      .from(shops)
      .leftJoin(
        productCountSubquery,
        eq(shops.id, productCountSubquery.shopId)
      )
      .leftJoin(
        followerCountSubquery,
        eq(shops.id, followerCountSubquery.entityId)
      )
      .where(
        and(
          eq(shops.isActive, true),
          eq(shops.isVisible, true),
          eq(shops.isDeleted, false)
        )
      )
      .orderBy(
        desc(sql`COALESCE(${followerCountSubquery.followerCount}, 0)`),
        desc(shops.viewCount)
      )
      .limit(limit);

    return result;
  } catch (error) {
    console.error('Error getting popular shops:', error);
    throw new Error('Failed to fetch popular shops');
  }
}

/**
 * Récupère les boutiques vérifiées
 */
export async function getVerifiedShops(
  query: ListQuery<ShopFilters> = {}
): Promise<PaginationResponse<Shop>> {
  try {
    const filters = { ...query.filters, verified: true };
    return await getShops({ ...query, filters });
  } catch (error) {
    console.error('Error getting verified shops:', error);
    throw new Error('Failed to fetch verified shops');
  }
}

/**
 * Récupère les statistiques des boutiques
 */
export async function getShopStats(filters?: ShopFilters) {
  try {
    const whereConditions = buildShopWhereConditions(filters || {});

    // Récupérer le total de boutiques
    const totalResult = await db
      .select({ count: count() })
      .from(shops)
      .where(whereConditions);

    // Récupérer les comptes actifs
    const activeResult = await db
      .select({ count: count() })
      .from(shops)
      .where(
        and(
          whereConditions || sql`true`,
          eq(shops.isActive, true)
        )
      );

    // Récupérer les comptes visibles
    const visibleResult = await db
      .select({ count: count() })
      .from(shops)
      .where(
        and(
          whereConditions || sql`true`,
          eq(shops.isVisible, true)
        )
      );

    // Récupérer les comptes vérifiés
    const verifiedResult = await db
      .select({ count: count() })
      .from(shops)
      .where(
        and(
          whereConditions || sql`true`,
          eq(shops.verified, true)
        )
      );

    // Récupérer les comptes en vedette
    const featuredResult = await db
      .select({ count: count() })
      .from(shops)
      .where(
        and(
          whereConditions || sql`true`,
          eq(shops.featured, true)
        )
      );

    // Récupérer les totaux et moyennes via des requêtes séparées
    const totalProductsResult = await db
      .select({ total: sum(shops.productCount) })
      .from(shops)
      .where(whereConditions);

    const totalViewsResult = await db
      .select({ total: sum(shops.viewCount) })
      .from(shops)
      .where(whereConditions);

    const totalBalanceResult = await db
      .select({ total: sum(shops.balance) })
      .from(shops)
      .where(whereConditions);

    const averageProductsResult = await db
      .select({ avg: sql<number>`avg(${shops.productCount})`.mapWith(Number) })
      .from(shops)
      .where(whereConditions);

    const averageViewsResult = await db
      .select({ avg: sql<number>`avg(${shops.viewCount})`.mapWith(Number) })
      .from(shops)
      .where(whereConditions);

    const averageBalanceResult = await db
      .select({ avg: sql<number>`avg(${shops.balance})`.mapWith(Number) })
      .from(shops)
      .where(whereConditions);

    // Compiler les résultats
    return {
      total: totalResult[0]?.count || 0,
      active: activeResult[0]?.count || 0,
      visible: visibleResult[0]?.count || 0,
      verified: verifiedResult[0]?.count || 0,
      featured: featuredResult[0]?.count || 0,
      totalProducts: totalProductsResult[0]?.total || 0,
      totalViews: totalViewsResult[0]?.total || 0,
      totalFollowers: 0, // Non disponible dans le schéma actuel
      totalBalance: totalBalanceResult[0]?.total || '0',
      averageProducts: averageProductsResult[0]?.avg || 0,
      averageViews: averageViewsResult[0]?.avg || 0,
      averageFollowers: 0, // Non disponible dans le schéma actuel
      averageBalance: averageBalanceResult[0]?.avg || '0',
    };
  } catch (error) {
    console.error('Error getting shop stats:', error);
    throw new Error('Failed to fetch shop statistics');
  }
}

// @/actions/shops.ts
/**
 * Récupère les statistiques d'une boutique spécifique
 */
export async function getShopStatsById(
  shopId: string
): Promise<{
  productCount: number;
  viewCount: number;
  followerCount: number;
  balance: string;
  averageRating: number;
  totalSales: number;
} | null> {
  try {
    // Vérification que la boutique existe
    const shop = await getShopById(shopId);
    if (!shop) {
      return null;
    }

    // Compter les produits actifs
    const productCountResult = await db
      .select({ count: count() })
      .from(products)
      .where(
        and(
          eq(products.shopId, shopId),
          eq(products.isDeleted, false)
        )
      );

    // Compter les followers
    const followerCountResult = await db
      .select({ count: count() })
      .from(interactions)
      .where(
        and(
          eq(interactions.entityId, shopId),
          eq(interactions.entityType, 'SHOP'),
          eq(interactions.type, 'FOLLOW'),
          eq(interactions.isDeleted, false)
        )
      );

    // Récupérer la note moyenne (si disponible dans le schéma)
    // Ici on suppose qu'une table reviews existe avec un champ rating
    // Sinon, retourner 0 par défaut
    const averageRatingResult = await db
      .select({
        avg: sql<number>`avg(rating)`.mapWith(Number)
      })
      .from(sql`reviews`) // Remplacer par la vraie table si elle existe
      .where(
        and(
          sql`shop_id = ${shopId}`,
          sql`is_deleted = false`
        )
      );

    // Récupérer le total des ventes (si disponible dans le schéma)
    // Ici on suppose qu'une table orders existe
    // Sinon, retourner 0 par défaut
    const totalSalesResult = await db
      .select({ count: count() })
      .from(sql`orders`) // Remplacer par la vraie table si elle existe
      .where(
        and(
          sql`shop_id = ${shopId}`,
          sql`status = 'completed'`
        )
      );

    return {
      productCount: productCountResult[0]?.count || 0,
      viewCount: shop.viewCount || 0,
      followerCount: followerCountResult[0]?.count || 0,
      balance: shop.balance || '0',
      averageRating: averageRatingResult[0]?.avg || 0,
      totalSales: totalSalesResult[0]?.count || 0,
    };
  } catch (error) {
    console.error('Error getting shop stats by ID:', error);
    throw new Error('Failed to fetch shop statistics');
  }
}




// ============================================================================
// MUTATIONS - Écriture des données
// ============================================================================

/**
 * Crée une nouvelle boutique
 */
export async function createShop(shopData: NewShop): Promise<Shop> {
  try {
    // Validation des données requises
    if (!shopData.ownerId || !shopData.name) {
      throw new Error('ownerId and name are required');
    }

    // Vérification des doublons de nom
    const existingShop = await getShopByName(shopData.name);
    if (existingShop) {
      throw new Error('Shop with this name already exists');
    }

    // Vérification que le propriétaire existe
    const owner = await db
      .select()
      .from(users)
      .where(eq(users.id, shopData.ownerId))
      .limit(1);

    if (owner.length === 0) {
      throw new Error('Owner user not found');
    }

    const result = await db
      .insert(shops)
      .values({
        ...shopData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Mise à jour du compteur de boutiques de l'utilisateur
    // await db
    //   .update(users)
    //   .set({
    //     shopsCount: sql`${users.shopsCount} + 1`,
    //     updatedAt: new Date(),
    //   })
    //   .where(eq(users.id, shopData.ownerId));

    return result[0];
  } catch (error) {
    console.error('Error creating shop:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to create shop');
  }
}

/**
 * Met à jour une boutique
 */
export async function updateShop(
  id: string, 
  shopData: Partial<NewShop>
): Promise<Shop> {
  try {
    // Vérification que la boutique existe
    const existingShop = await getShopById(id);
    if (!existingShop) {
      throw new Error('Shop not found');
    }

    // Vérification des doublons de nom si le nom est modifié
    if (shopData.name && shopData.name !== existingShop.name) {
      const shopWithName = await getShopByName(shopData.name);
      if (shopWithName) {
        throw new Error('Shop with this name already exists');
      }
    }

    const result = await db
      .update(shops)
      .set({
        ...shopData,
        updatedAt: new Date(),
      })
      .where(eq(shops.id, id))
      .returning();

    return result[0];
  } catch (error) {
    console.error('Error updating shop:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to update shop');
  }
}

/**
 * Supprime une boutique (soft delete)
 */
export async function deleteShop(id: string): Promise<Shop> {
  try {
    const result = await db
      .update(shops)
      .set({
        isDeleted: true,
        isActive: false,
        isVisible: false,
        updatedAt: new Date(),
      })
      .where(eq(shops.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error('Shop not found');
    }

    // Mise à jour du compteur de boutiques de l'utilisateur
    // await db
    //   .update(users)
    //   .set({
    //     shopsCount: sql`${users.shopsCount} - 1`,
    //     updatedAt: new Date(),
    //   })
    //   .where(eq(users.id, result[0].ownerId));

    return result[0];
  } catch (error) {
    console.error('Error deleting shop:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to delete shop');
  }
}

/**
 * Restaure une boutique supprimée
 */
export async function restoreShop(id: string): Promise<Shop> {
  try {
    const result = await db
      .update(shops)
      .set({
        isDeleted: false,
        isActive: true,
        isVisible: true,
        updatedAt: new Date(),
      })
      .where(eq(shops.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error('Shop not found');
    }

    // Mise à jour du compteur de boutiques de l'utilisateur
    // await db
    //   .update(users)
    //   .set({
    //     shopsCount: sql`${users.shopsCount} + 1`,
    //     updatedAt: new Date(),
    //   })
    //   .where(eq(users.id, result[0].ownerId));

    return result[0];
  } catch (error) {
    console.error('Error restoring shop:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to restore shop');
  }
}

/**
 * Met à jour les statistiques d'une boutique
 */
export async function updateShopStats(
  id: string, 
  stats: Partial<{
    productCount: number;
    viewCount: number;
    followerCount: number;
    balance: string;
  }>
): Promise<Shop> {
  try {
    const result = await db
      .update(shops)
      .set({
        ...stats,
        updatedAt: new Date(),
      })
      .where(eq(shops.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error('Shop not found');
    }

    return result[0];
  } catch (error) {
    console.error('Error updating shop stats:', error);
    throw new Error('Failed to update shop statistics');
  }
}

/**
 * Incrémente le compteur de vues d'une boutique
 */
export async function incrementShopViews(id: string): Promise<Shop> {
  try {
    const result = await db
      .update(shops)
      .set({
        viewCount: sql`${shops.viewCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(shops.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error('Shop not found');
    }

    return result[0];
  } catch (error) {
    console.error('Error incrementing shop views:', error);
    throw new Error('Failed to increment shop views');
  }
}

/**
 * Met à jour le thème d'une boutique
 */
export async function updateShopTheme(
  shopId: string, 
  themeId: string | null,
  customTheme?: any
): Promise<Shop> {
  try {
    const result = await db
      .update(shops)
      .set({
        themeId,
        customTheme,
        updatedAt: new Date(),
      })
      .where(eq(shops.id, shopId))
      .returning();

    if (result.length === 0) {
      throw new Error('Shop not found');
    }

    return result[0];
  } catch (error) {
    console.error('Error updating shop theme:', error);
    throw new Error('Failed to update shop theme');
  }
}

// ============================================================================
// GESTION DES CATÉGORIES DE BOUTIQUES
// ============================================================================

/**
 * Ajoute une catégorie à une boutique
 */
export async function addShopCategory(
  shopId: string, 
  categoryId: string
): Promise<void> {
  try {
    // Vérification que la boutique existe
    const shop = await getShopById(shopId);
    if (!shop) {
      throw new Error('Shop not found');
    }

    // Vérification que la catégorie existe
    const category = await db
      .select()
      .from(categories)
      .where(eq(categories.id, categoryId))
      .limit(1);

    if (category.length === 0) {
      throw new Error('Category not found');
    }

    // Vérification que la liaison n'existe pas déjà
    const existingLink = await db
      .select()
      .from(entityCategories)
      .where(
        and(
          eq(entityCategories.entityId, shopId),
          eq(entityCategories.entityType, 'SHOP'),
          eq(entityCategories.categoryId, categoryId)
        )
      )
      .limit(1);

    if (existingLink.length > 0) {
      throw new Error('Shop already has this category');
    }

    await db
      .insert(entityCategories)
      .values({
        entityId: shopId,
        entityType: 'SHOP',
        categoryId,
        createdAt: new Date(),
      });
  } catch (error) {
    console.error('Error adding shop category:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to add shop category');
  }
}

/**
 * Supprime une catégorie d'une boutique
 */
export async function removeShopCategory(
  shopId: string, 
  categoryId: string
): Promise<void> {
  try {
    await db
      .delete(entityCategories)
      .where(
        and(
          eq(entityCategories.entityId, shopId),
          eq(entityCategories.entityType, 'SHOP'),
          eq(entityCategories.categoryId, categoryId)
        )
      );
  } catch (error) {
    console.error('Error removing shop category:', error);
    throw new Error('Failed to remove shop category');
  }
}

// ============================================================================
// UTILITAIRES
// ============================================================================

/**
 * Construit les conditions WHERE pour les requêtes shops
 */
// lib/actions/shops.ts
function buildShopWhereConditions(
  filters: ShopFilters, 
  options: QueryOptions = {}
) {
  const conditions: any[] = [];

  // Base filters
  if (!options.includeDeleted) {
    conditions.push(eq(shops.isDeleted, false));
  }

  if (!options.includeInactive) {
    conditions.push(eq(shops.isActive, true));
  }

  // Specific filters
  if (filters.ownerId) {
    conditions.push(eq(shops.ownerId, filters.ownerId));
  }

  if (filters.name) {
    conditions.push(ilike(shops.name, `%${filters.name}%`));
  }

  if (filters.country) {
    conditions.push(ilike(shops.country, `%${filters.country}%`));
  }

  if (typeof filters.verified === 'boolean') {
    conditions.push(eq(shops.verified, filters.verified));
  }

  if (typeof filters.featured === 'boolean') {
    conditions.push(eq(shops.featured, filters.featured));
  }

  if (typeof filters.isVisible === 'boolean') {
    conditions.push(eq(shops.isVisible, filters.isVisible));
  }

  // Filters on counts using subqueries
  if (filters.productCountMin !== undefined || filters.productCountMax !== undefined) {
    const productCountSubquery = db
      .select({
        shopId: products.shopId,
        productCount: count(products.id).as('productCount'),
      })
      .from(products)
      .where(eq(products.isDeleted, false))
      .groupBy(products.shopId)
      .as('productCountSubquery');

    if (filters.productCountMin !== undefined) {
      conditions.push(
        gte(
          sql`(SELECT COALESCE(productCount, 0) FROM ${productCountSubquery} WHERE ${productCountSubquery.shopId} = ${shops.id})`,
          filters.productCountMin
        )
      );
    }
    if (filters.productCountMax !== undefined) {
      conditions.push(
        lte(
          sql`(SELECT COALESCE(productCount, 0) FROM ${productCountSubquery} WHERE ${productCountSubquery.shopId} = ${shops.id})`,
          filters.productCountMax
        )
      );
    }
  }

  if (filters.viewCountMin !== undefined) {
    conditions.push(gte(shops.viewCount, filters.viewCountMin));
  }
  if (filters.viewCountMax !== undefined) {
    conditions.push(lte(shops.viewCount, filters.viewCountMax));
  }

  if (filters.followerCountMin !== undefined || filters.followerCountMax !== undefined) {
    const followerCountSubquery = db
      .select({
        entityId: interactions.entityId,
        followerCount: count(interactions.userId).as('followerCount'),
      })
      .from(interactions)
      .where(
        and(
          eq(interactions.entityType, 'SHOP'),
          eq(interactions.type, 'FOLLOW'),
          eq(interactions.isDeleted, false)
        )
      )
      .groupBy(interactions.entityId)
      .as('followerCountSubquery');

    if (filters.followerCountMin !== undefined) {
      conditions.push(
        gte(
          sql`(SELECT COALESCE(followerCount, 0) FROM ${followerCountSubquery} WHERE ${followerCountSubquery.entityId} = ${shops.id})`,
          filters.followerCountMin
        )
      );
    }
    if (filters.followerCountMax !== undefined) {
      conditions.push(
        lte(
          sql`(SELECT COALESCE(followerCount, 0) FROM ${followerCountSubquery} WHERE ${followerCountSubquery.entityId} = ${shops.id})`,
          filters.followerCountMax
        )
      );
    }
  }

  if (filters.balanceMin !== undefined) {
    conditions.push(gte(shops.balance, filters.balanceMin.toString()));
  }
  if (filters.balanceMax !== undefined) {
    conditions.push(lte(shops.balance, filters.balanceMax.toString()));
  }

  if (filters.themeId) {
    conditions.push(eq(shops.themeId, filters.themeId));
  }

  // Date filters
  if (filters.startDate) {
    conditions.push(gte(shops.createdAt, new Date(filters.startDate)));
  }
  if (filters.endDate) {
    conditions.push(lte(shops.createdAt, new Date(filters.endDate)));
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}