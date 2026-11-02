// @/actions/shops.ts
'use server';
import { getCurrentUser } from '@/lib/auth/session';
import { getAccountBalance } from '@/lib/ledger/ledger-utils';

import {
  shops, users, themes, products, entityCategories, categories,
  type Shop, type NewShop, type User, type Theme,
  interactions, orders,
} from '@/database/schema';
import {
  eq, and, or, like, ilike, inArray, between,
  desc, asc, sql, count, gt, lt, gte, lte, isNull, isNotNull,
  sum
} from 'drizzle-orm';
import {
  financialAccounts,
  ledgerEntries,
  walletTransactions
} from '@/database/schema';
import {
  type ShopFilters,
  type ListQuery,
  type PaginationResponse,
  type QueryOptions
} from '@/types/api';
import { db } from '@/lib/db';
import { cacheTag, cacheLife } from 'next/cache';
import { revalidateTag } from 'next/cache';
import {
  type ShopCard, type ShopDetail, type ShopStats, type ShopDetailStats, type ShopContext,
  type ProductCard,
  USER_MINI_COLUMNS, SHOP_CARD_COLUMNS, PRODUCT_CARD_COLUMNS, SHOP_MINI_COLUMNS,
  PAGINATION_DEFAULTS,
} from '@/types/view-models';

// ============================================================================
// QUERIES - Lecture des données
// ============================================================================

/**
 * Récupère une boutique par son ID avec relations optionnelles
 */
export async function getShopById(
  id: string,
  options?: { populate?: string[] }
): Promise<ShopDetail | null> {
  'use cache';
  cacheTag(`shop-${id}`, 'shops');
  cacheLife('minutes');
  try {
    const shopWithRelations = await db.query.shops.findFirst({
      where: (shops, { eq }) => eq(shops.id, id),
      with: {
        owner: options?.populate?.includes('owner') ? { columns: USER_MINI_COLUMNS } : undefined,
        theme: options?.populate?.includes('theme') ? true : undefined,
      },
    });

    if (!shopWithRelations) return null;

    // Get additional stats
    const [followerCount, totalSales] = await Promise.all([
      db.select({ count: count() }).from(interactions).where(and(eq(interactions.entityId, id), eq(interactions.entityType, 'SHOP'), eq(interactions.type, 'LIKE'))),
      db.select({ count: count() }).from(orders).where(and(eq(orders.shopId, id), eq(orders.status, 'COMPLETED'))),
    ]);

    const result = shopWithRelations as unknown as ShopDetail;

    return {
      ...result,
      stats: {
        productCount: result.productCount || 0,
        viewCount: result.viewCount || 0,
        followerCount: followerCount[0]?.count || 0,
        balance: result.balance?.toString() || '0',
        totalSales: totalSales[0]?.count || 0,
      }
    };
  } catch (error) {
    console.error('Error getting shop by ID:', error);
    throw new Error('Failed to fetch shop');
  }
}

/**
 * Récupère une boutique par son nom
 */
export async function getShopByName(name: string): Promise<Shop | null> {
  'use cache';
  cacheTag('shops');
  cacheLife('minutes');
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
): Promise<PaginationResponse<ShopCard>> {
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
): Promise<PaginationResponse<ShopCard>> {
  'use cache';
  cacheTag('shops');
  cacheLife('minutes');
  try {
    const {
      pagination = { page: 1, limit: PAGINATION_DEFAULTS.FEED },
      filters = {},
      options = {}
    } = query;

    const offset = (pagination.page - 1) * pagination.limit;
    const whereConditions = buildShopWhereConditions(filters, options);

    const [shopsData, totalResult] = await Promise.all([
      db.query.shops.findMany({
        columns: SHOP_CARD_COLUMNS,
        where: whereConditions,
        limit: pagination.limit,
        offset: offset,
        orderBy: (shops, { desc, asc }) => {
          if (options.sortBy) {
            const sortField = options.sortBy as any;
            return [options.sortOrder === 'desc' ? desc((shops as any)[sortField]) : asc((shops as any)[sortField])];
          }
          return [desc(shops.createdAt)];
        },
        with: options.populate?.includes('owner')
          ? { owner: { columns: USER_MINI_COLUMNS } }
          : undefined,
      }),
      db.select({ count: count() }).from(shops).where(whereConditions),
    ]);

    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / pagination.limit);

    return {
      data: shopsData as ShopCard[],
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
): Promise<ShopCard[]> {
  'use cache';
  cacheTag('shops');
  cacheLife('minutes');
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
        financialAccountId: shops.financialAccountId, // Added this field
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

    // @ts-ignore
    return result.map(row => ({
      ...row,
    })) as unknown as ShopCard[];
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
): Promise<PaginationResponse<ShopCard>> {
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
export async function getShopStats(filters?: ShopFilters): Promise<ShopStats> {
  'use cache';
  cacheTag('shops', 'stats');
  cacheLife('minutes');
  try {
    const whereConditions = buildShopWhereConditions(filters || {});
    const safeWhere = whereConditions || sql`true`;

    // Parallelize ALL stat queries
    const [
      totalResult,
      activeResult,
      visibleResult,
      verifiedResult,
      featuredResult,
      totalProductsResult,
      totalViewsResult,
      totalBalanceResult,
      averageProductsResult,
      averageViewsResult,
      averageBalanceResult,
    ] = await Promise.all([
      db.select({ count: count() }).from(shops).where(whereConditions),
      db.select({ count: count() }).from(shops).where(and(safeWhere, eq(shops.isActive, true))),
      db.select({ count: count() }).from(shops).where(and(safeWhere, eq(shops.isVisible, true))),
      db.select({ count: count() }).from(shops).where(and(safeWhere, eq(shops.verified, true))),
      db.select({ count: count() }).from(shops).where(and(safeWhere, eq(shops.featured, true))),
      db.select({ total: sum(shops.productCount) }).from(shops).where(whereConditions),
      db.select({ total: sum(shops.viewCount) }).from(shops).where(whereConditions),
      db.select({ total: sum(shops.balance) }).from(shops).where(whereConditions),
      db.select({ avg: sql<number>`avg(${shops.productCount})`.mapWith(Number) }).from(shops).where(whereConditions),
      db.select({ avg: sql<number>`avg(${shops.viewCount})`.mapWith(Number) }).from(shops).where(whereConditions),
      db.select({ avg: sql<number>`avg(${shops.balance})`.mapWith(Number) }).from(shops).where(whereConditions),
    ]);

    return {
      total: totalResult[0]?.count || 0,
      active: activeResult[0]?.count || 0,
      visible: visibleResult[0]?.count || 0,
      verified: verifiedResult[0]?.count || 0,
      featured: featuredResult[0]?.count || 0,
      totalProducts: totalProductsResult[0]?.total || 0,
      totalViews: totalViewsResult[0]?.total || 0,
      totalFollowers: 0,
      totalBalance: totalBalanceResult[0]?.total || '0',
      averageProducts: averageProductsResult[0]?.avg || 0,
      averageViews: averageViewsResult[0]?.avg || 0,
      averageFollowers: 0,
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
): Promise<ShopDetailStats | null> {
  try {
    // Vérification que la boutique existe
    const shop = await getShopById(shopId);
    if (!shop) {
      return null;
    }

    // Parallelize all stat queries
    const [productCountResult, followerCountResult, totalSalesResult] = await Promise.all([
      // Compter les produits actifs
      db
        .select({ count: count() })
        .from(products)
        .where(
          and(
            eq(products.shopId, shopId),
            eq(products.isDeleted, false)
          )
        ),
      // Compter les followers
      db
        .select({ count: count() })
        .from(interactions)
        .where(
          and(
            eq(interactions.entityId, shopId),
            eq(interactions.entityType, 'SHOP'),
            eq(interactions.type, 'FOLLOW'),
            eq(interactions.isDeleted, false)
          )
        ),
      // Compter les ventes complétées (utilise la vraie table orders)
      db
        .select({ count: count() })
        .from(orders)
        .where(
          and(
            eq(orders.shopId, shopId),
            eq(orders.status, 'COMPLETED'),
            eq(orders.isDeleted, false)
          )
        ),
    ]);

    const balance = shop.financialAccountId 
      ? await getAccountBalance(shop.financialAccountId)
      : 0;

    return {
      productCount: productCountResult[0]?.count || 0,
      viewCount: shop.viewCount || 0,
      followerCount: followerCountResult[0]?.count || 0,
      balance: balance.toString(),
      totalSales: totalSalesResult[0]?.count || 0,
    };
  } catch (error) {
    console.error('Error getting shop stats by ID:', error);
    throw new Error('Failed to fetch shop statistics');
  }
}

/**
 * Récupère le contexte complet d'une boutique (détail + stats + top produits)
 */
export async function getShopContext(shopId: string): Promise<ShopContext | null> {
  'use cache';
  cacheTag(`shop-${shopId}`, 'shops');
  cacheLife('minutes');
  try {
    const shop = await getShopById(shopId, { populate: ['owner'] });
    if (!shop) return null;

    const [stats, topProductsRes] = await Promise.all([
      getShopStatsById(shopId),
      db.query.products.findMany({
        columns: PRODUCT_CARD_COLUMNS,
        where: (products, { and, eq }) => and(
          eq(products.shopId, shopId),
          eq(products.isDeleted, false),
          eq(products.isActive, true),
        ),
        limit: PAGINATION_DEFAULTS.RELATED,
        orderBy: (products, { desc }) => [desc(products.viewCount)],
      }),
    ]);

    return {
      shop: shop as ShopDetail,
      stats: stats || { productCount: 0, viewCount: 0, followerCount: 0, balance: '0', totalSales: 0 },
      topProducts: topProductsRes as ProductCard[],
    };
  } catch (error) {
    console.error('Error getting shop context:', error);
    throw new Error('Failed to fetch shop context');
  }
}

/**
 * Récupère les statistiques financières d'une boutique (via ledger)
 */
export async function getShopFinancialStats(shopId: string) {
  try {
    if (!shopId) {
      console.warn('getShopFinancialStats called with missing shopId');
      return { balance: 0, transactionsCount: 0 };
    }

    const shop = await getShopById(shopId);
    if (!shop || !shop.financialAccountId) {
      return { balance: 0, transactionsCount: 0 };
    }

    const [
      balanceResult,
      countResult,
    ] = await Promise.all([
      db.select({
        balance: sql<string>`COALESCE(SUM(${ledgerEntries.credit}) - SUM(${ledgerEntries.debit}), '0')`,
      })
        .from(ledgerEntries)
        .where(eq(ledgerEntries.accountId, shop.financialAccountId)),

      db.select({ count: count() })
        .from(walletTransactions)
        .where(eq(walletTransactions.financialAccountId, shop.financialAccountId))
    ]);

    return {
      balance: parseFloat(balanceResult[0]?.balance || '0'),
      transactionsCount: countResult[0]?.count || 0,
    };
  } catch (error) {
    console.error('Error getting shop financial stats:', error);
    throw new Error('Failed to fetch shop financial data');
  }
}

/**
 * Récupère les agrégats ledger (revenus/dépenses) pour une boutique
 */
export async function getShopLedgerStats(shopId: string, params?: { startDate?: string; endDate?: string }) {
  try {
    if (!shopId) {
      console.warn('getShopLedgerStats called with missing shopId');
      return { income: 0, expense: 0, total: 0, pending: 0 };
    }

    const shop = await getShopById(shopId);
    if (!shop || !shop.financialAccountId) {
      return { income: 0, expense: 0, total: 0, pending: 0 };
    }

    const ledgerWhere: any[] = [eq(ledgerEntries.accountId, shop.financialAccountId)];
    if (params?.startDate) {
      ledgerWhere.push(gte(ledgerEntries.createdAt, new Date(params.startDate)));
    }
    if (params?.endDate) {
      ledgerWhere.push(lte(ledgerEntries.createdAt, new Date(params.endDate)));
    }

    const [ledgerAgg, txAgg, pendingAgg] = await Promise.all([
      db
        .select({
          income: sql<string>`COALESCE(SUM(${ledgerEntries.credit}), '0')`,
          expense: sql<string>`COALESCE(SUM(${ledgerEntries.debit}), '0')`,
        })
        .from(ledgerEntries)
        .where(and(...ledgerWhere)),
      db
        .select({ count: count() })
        .from(walletTransactions)
        .where(eq(walletTransactions.financialAccountId, shop.financialAccountId)),
      db
        .select({ count: count() })
        .from(walletTransactions)
        .where(and(eq(walletTransactions.financialAccountId, shop.financialAccountId), eq(walletTransactions.status, 'PENDING'))),
    ]);

    return {
      total: txAgg[0]?.count || 0,
      pending: pendingAgg[0]?.count || 0,
      income: parseFloat(ledgerAgg[0]?.income || '0'),
      expense: parseFloat(ledgerAgg[0]?.expense || '0'),
    };
  } catch (error) {
    console.error('Error getting shop ledger stats:', error);
    return { income: 0, expense: 0, total: 0, pending: 0 };
  }
}




// ============================================================================
// MUTATIONS - Écriture des données
// ============================================================================

/**
 * Crée une nouvelle boutique
 */
export async function createShop(shopData: Omit<NewShop, 'ownerId'> & { ownerId?: string }): Promise<Shop> {
  try {
    // SEC-05 FIX: ownerId is always sourced from the authenticated session,
    // never from client-supplied input — prevents IDOR / shop ownership hijacking.
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error('Non authentifié');

    const resolvedOwnerId = currentUser.id;

    if (!shopData.name) throw new Error('name is required');

    // Vérification des doublons de nom
    const existingShop = await getShopByName(shopData.name);
    if (existingShop) {
      throw new Error('Shop with this name already exists');
    }

    return await db.transaction(async (tx) => {
      // 1. Create Financial Account
      const [account] = await tx
        .insert(financialAccounts)
        .values({
          ownerShopId: undefined, // Will link after shop is created
          type: 'SHOP_WALLET',
          currency: 'GTC',
          isActive: true,
          createdAt: new Date(),
        })
        .returning();

      // 2. Create Shop — ownerId is always the authenticated user
      const [newShop] = await tx
        .insert(shops)
        .values({
          ...shopData,
          ownerId: resolvedOwnerId,
          financialAccountId: account.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      // 3. Update Financial Account with ownerShopId
      await tx
        .update(financialAccounts)
        .set({ ownerShopId: newShop.id })
        .where(eq(financialAccounts.id, account.id));

      return newShop;
    });
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
    // SEC-05 FIX: Require auth + ownership or admin
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error('Non authentifié');
    const isAdmin = currentUser.role === 'admin' || (currentUser as any).isAdmin === true;

    // Vérification que la boutique existe
    const existingShop = await getShopById(id);
    if (!existingShop) {
      throw new Error('Shop not found');
    }

    if (!isAdmin && existingShop.ownerId !== currentUser.id) {
      throw new Error('Accès refusé — vous n\'êtes pas propriétaire de cette boutique');
    }

    // Strip ownership-altering fields for non-admins
    const safeData = { ...shopData };
    if (!isAdmin) {
      delete (safeData as any).ownerId;
      delete (safeData as any).isVerified;
      delete (safeData as any).isActive;
      delete (safeData as any).financialAccountId;
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
        ...safeData,
        updatedAt: new Date(),
      })
      .where(eq(shops.id, id))
      .returning();

    revalidateTag('shops', 'max');
    revalidateTag(`shop-${id}`, 'max');
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
 * SEC-05 FIX: Owner or admin only
 */
export async function deleteShop(id: string): Promise<Shop> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error('Non authentifié');
    const isAdmin = currentUser.role === 'admin' || (currentUser as any).isAdmin === true;

    const shop = await getShopById(id);
    if (!shop) throw new Error('Shop not found');
    if (!isAdmin && shop.ownerId !== currentUser.id) {
      throw new Error('Accès refusé — vous n\'êtes pas propriétaire de cette boutique');
    }

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

    revalidateTag('shops', 'max');
    revalidateTag(`shop-${id}`, 'max');
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
 * SEC-05 FIX: Admin only (restoring a shop is an admin operation)
 */
export async function restoreShop(id: string): Promise<Shop> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error('Non authentifié');
    const isAdmin = currentUser.role === 'admin' || (currentUser as any).isAdmin === true;
    if (!isAdmin) throw new Error('Accès réservé aux administrateurs');

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

    revalidateTag('shops', 'max');
    revalidateTag(`shop-${id}`, 'max');
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

    revalidateTag('shops', 'max');
    revalidateTag(`shop-${id}`, 'max');
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

    revalidateTag('shops', 'max');
    revalidateTag(`shop-${id}`, 'max');
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

    revalidateTag('shops', 'max');
    revalidateTag(`shop-${shopId}`, 'max');
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

/**
 * Récupère les clients d'une boutique (utilisateurs ayant passé des commandes complétées)
 */
export async function getShopClients(shopId: string) {
  try {
    const results = await db
      .select({
        id: users.id,
        username: users.username,
        fullName: users.fullName,
        email: users.email,
        image: users.image,
        totalSpent: sql<number>`COALESCE(SUM(${orders.price}::numeric), 0)`,
        orderCount: sql<number>`COUNT(${orders.id})::int`,
        lastOrderDate: sql<Date>`MAX(${orders.createdAt})`,
      })
      .from(users)
      .innerJoin(orders, eq(orders.buyerId, users.id))
      .where(
        and(
          eq(orders.shopId, shopId),
          eq(orders.status, 'COMPLETED')
        )
      )
      .groupBy(users.id)
      .orderBy(desc(sql`MAX(${orders.createdAt})`));

    return results;
  } catch (error) {
    console.error('Error getting shop clients:', error);
    throw new Error('Failed to fetch shop clients');
  }
}
