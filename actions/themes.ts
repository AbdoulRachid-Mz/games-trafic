// @/actions/themes.ts
'use server';

import { themes, type Theme, type NewTheme, themePurchases, type ThemePurchase, type NewThemePurchase, users, interactions } from '@/database/schema';
import { eq, and, or, like, ilike, inArray, between, desc, asc, sql, count, gt, lt, gte, lte, isNull, isNotNull, exists } from 'drizzle-orm';
import { type ThemeFilters, type ListQuery, type PaginationResponse, type QueryOptions } from '@/types/api';
import { db } from '@/lib/db';

// ============================================================================
// QUERIES - Lecture des données
// ============================================================================

/**
 * Récupère un thème par son ID avec relations optionnelles
 */
export async function getThemeById(
  id: string,
  options?: { populate?: string[] }
): Promise<Theme | null> {
  try {
    if (options?.populate && options.populate.length > 0) {
      const query = db.query.themes.findFirst({
        where: (themes, { eq }) => eq(themes.id, id),
        with: {
          creator: options.populate.includes('creator') ? true : undefined,
          purchases: options.populate.includes('purchases') ? true : undefined,
          tournaments: options.populate.includes('tournaments') ? true : undefined,
          shops: options.populate.includes('shops') ? true : undefined,
          interactions: options.populate.includes('interactions') ? true : undefined,
        }
      });
      return (await query) ?? null;
    }

    const result = await db
      .select()
      .from(themes)
      .where(eq(themes.id, id))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error('Error getting theme by ID:', error);
    throw new Error('Failed to fetch theme');
  }
}

/**
 * Récupère un thème par son nom
 */
export async function getThemeByName(name: string): Promise<Theme | null> {
  try {
    const result = await db
      .select()
      .from(themes)
      .where(eq(themes.name, name))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error('Error getting theme by name:', error);
    throw new Error('Failed to fetch theme');
  }
}

/**
 * Liste les thèmes avec pagination, filtres et options
 */
export async function getThemes(
  query: ListQuery<ThemeFilters> = {}
): Promise<PaginationResponse<Theme>> {
  try {
    const { pagination = { page: 1, limit: 50 }, filters = {}, options = {} } = query;
    const offset = (pagination.page - 1) * pagination.limit;

    const whereConditions = buildThemeWhereConditions(filters, options);

    const themesQuery = db
      .select()
      .from(themes)
      .where(whereConditions)
      .limit(pagination.limit)
      .offset(offset);

    if (options.sortBy) {
      const sortField = options.sortBy as keyof Theme;
      const sortOrder = options.sortOrder === 'desc' ? desc : asc;
      themesQuery.orderBy(sortOrder(themes[sortField]));
    } else {
      themesQuery.orderBy(desc(themes.createdAt));
    }

    const countQuery = db
      .select({ count: count() })
      .from(themes)
      .where(whereConditions);

    const [themesData, totalResult] = await Promise.all([
      themesQuery,
      countQuery
    ]);

    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / pagination.limit);

    return {
      data: themesData,
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
    console.error('Error getting themes:', error);
    throw new Error('Failed to fetch themes');
  }
}

/**
 * Récupère les statistiques des thèmes
 */
export async function getThemeStats(filters?: ThemeFilters) {
  try {
    const whereConditions = buildThemeWhereConditions(filters || {});

    const [
      totalResult,
      premiumResult,
      publicResult,
      activeResult,
      deletedResult,
      avgDownloadsResult,
      avgViewsResult
    ] = await Promise.all([
      db.select({ count: count() }).from(themes).where(whereConditions),
      db.select({ count: count() }).from(themes).where(and(whereConditions, eq(themes.isPremium, true))),
      db.select({ count: count() }).from(themes).where(and(whereConditions, eq(themes.isPublic, true))),
      db.select({ count: count() }).from(themes).where(and(whereConditions, eq(themes.isActive, true))),
      db.select({ count: count() }).from(themes).where(and(whereConditions, eq(themes.isDeleted, true))),
      db.select({ 
        avgDownloads: sql<number>`avg(${themes.downloads})::float`.mapWith(Number) 
      }).from(themes).where(whereConditions),
      db.select({ 
        avgViews: sql<number>`avg(${themes.viewCount})::float`.mapWith(Number) 
      }).from(themes).where(whereConditions)
    ]);

    const stats = {
      total: totalResult[0]?.count ?? 0,
      premium: premiumResult[0]?.count ?? 0,
      public: publicResult[0]?.count ?? 0,
      active: activeResult[0]?.count ?? 0,
      deleted: deletedResult[0]?.count ?? 0,
      averageDownloads: avgDownloadsResult[0]?.avgDownloads ?? 0,
      averageViews: avgViewsResult[0]?.avgViews ?? 0
    };

    return stats;
  } catch (error) {
    console.error('Error getting theme stats:', error);
    throw new Error('Failed to fetch theme statistics');
  }
}

/**
 * Récupère les thèmes populaires
 */
export async function getPopularThemes(limit: number = 10): Promise<Theme[]> {
  try {
    const result = await db
      .select()
      .from(themes)
      .where(and(eq(themes.isActive, true), eq(themes.isPublic, true), eq(themes.isDeleted, false)))
      .orderBy(desc(themes.downloads), desc(themes.viewCount))
      .limit(limit);

    return result;
  } catch (error) {
    console.error('Error getting popular themes:', error);
    throw new Error('Failed to fetch popular themes');
  }
}

/**
 * Récupère les thèmes par catégorie
 */
export async function getThemesByCategory(category: string): Promise<Theme[]> {
  try {
    const result = await db
      .select()
      .from(themes)
      .where(and(eq(themes.category, category), eq(themes.isActive, true), eq(themes.isDeleted, false)))
      .orderBy(desc(themes.createdAt));

    return result;
  } catch (error) {
    console.error('Error getting themes by category:', error);
    throw new Error('Failed to fetch themes by category');
  }
}

/**
 * Récupère les thèmes créés par un utilisateur
 */
export async function getUserThemes(userId: string): Promise<Theme[]> {
  try {
    const result = await db
      .select()
      .from(themes)
      .where(and(eq(themes.creatorId, userId), eq(themes.isDeleted, false)))
      .orderBy(desc(themes.createdAt));

    return result;
  } catch (error) {
    console.error('Error getting user themes:', error);
    throw new Error('Failed to fetch user themes');
  }
}

/**
 * Récupère les thèmes achetés par un utilisateur
 */
export async function getUserPurchasedThemes(userId: string): Promise<Theme[]> {
  try {
    const result = await db
      .select({
        theme: themes
      })
      .from(themePurchases)
      .innerJoin(themes, eq(themePurchases.themeId, themes.id))
      .where(eq(themePurchases.userId, userId));

    return result.map(row => row.theme);
  } catch (error) {
    console.error('Error getting user purchased themes:', error);
    throw new Error('Failed to fetch user purchased themes');
  }
}

// ============================================================================
// MUTATIONS - Écriture des données
// ============================================================================

/**
 * Crée un nouveau thème
 */
export async function createTheme(themeData: NewTheme): Promise<Theme> {
  try {
    if (!themeData.name) {
      throw new Error('Theme name is required');
    }

    const existingTheme = await getThemeByName(themeData.name);
    if (existingTheme) {
      throw new Error('Theme with this name already exists');
    }

    const result = await db
      .insert(themes)
      .values({
        ...themeData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Error creating theme:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to create theme');
  }
}

/**
 * Met à jour un thème
 */
export async function updateTheme(
  id: string,
  themeData: Partial<NewTheme>
): Promise<Theme> {
  try {
    const existingTheme = await getThemeById(id);
    if (!existingTheme) {
      throw new Error('Theme not found');
    }

    if (themeData.name && themeData.name !== existingTheme.name) {
      const themeWithName = await getThemeByName(themeData.name);
      if (themeWithName) {
        throw new Error('Theme name already exists');
      }
    }

    const result = await db
      .update(themes)
      .set({
        ...themeData,
        updatedAt: new Date(),
      })
      .where(eq(themes.id, id))
      .returning();

    return result[0];
  } catch (error) {
    console.error('Error updating theme:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to update theme');
  }
}

/**
 * Supprime un thème (soft delete)
 */
export async function deleteTheme(id: string): Promise<Theme> {
  try {
    const result = await db
      .update(themes)
      .set({
        isDeleted: true,
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(themes.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error('Theme not found');
    }

    return result[0];
  } catch (error) {
    console.error('Error deleting theme:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to delete theme');
  }
}

/**
 * Restaure un thème supprimé
 */
export async function restoreTheme(id: string): Promise<Theme> {
  try {
    const result = await db
      .update(themes)
      .set({
        isDeleted: false,
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(themes.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error('Theme not found');
    }

    return result[0];
  } catch (error) {
    console.error('Error restoring theme:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to restore theme');
  }
}

/**
 * Incrémente le compteur de téléchargements d'un thème
 */
export async function incrementThemeDownloads(id: string): Promise<Theme> {
  try {
    const result = await db
      .update(themes)
      .set({
        downloads: sql`${themes.downloads} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(themes.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error('Theme not found');
    }

    return result[0];
  } catch (error) {
    console.error('Error incrementing theme downloads:', error);
    throw new Error('Failed to increment theme downloads');
  }
}

/**
 * Incrémente le compteur de vues d'un thème
 */
export async function incrementThemeViews(id: string): Promise<Theme> {
  try {
    const result = await db
      .update(themes)
      .set({
        viewCount: sql`${themes.viewCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(themes.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error('Theme not found');
    }

    return result[0];
  } catch (error) {
    console.error('Error incrementing theme views:', error);
    throw new Error('Failed to increment theme views');
  }
}

// ============================================================================
// ACTIONS D'ACHAT DE THÈMES
// ============================================================================

/**
 * Achète un thème pour un utilisateur
 */
export async function purchaseTheme(userId: string, themeId: string, price: number): Promise<ThemePurchase> {
  try {
    const existingPurchase = await db
      .select()
      .from(themePurchases)
      .where(and(eq(themePurchases.userId, userId), eq(themePurchases.themeId, themeId)))
      .limit(1);

    if (existingPurchase.length > 0) {
      throw new Error('Theme already purchased');
    }

    const result = await db
      .insert(themePurchases)
      .values({
        userId,
        themeId,
        price: String(price),
        createdAt: new Date(),
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Error purchasing theme:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to purchase theme');
  }
}

/**
 * Vérifie si un utilisateur a acheté un thème
 */
export async function hasUserPurchasedTheme(userId: string, themeId: string): Promise<boolean> {
  try {
    const result = await db
      .select()
      .from(themePurchases)
      .where(and(eq(themePurchases.userId, userId), eq(themePurchases.themeId, themeId)))
      .limit(1);

    return result.length > 0;
  } catch (error) {
    console.error('Error checking theme purchase:', error);
    throw new Error('Failed to check theme purchase');
  }
}

/**
 * Récupère les achats de thèmes avec filtres
 */
export async function getThemePurchases(
  query: ListQuery<{}> = {}
): Promise<PaginationResponse<ThemePurchase>> {
  try {
    const { pagination = { page: 1, limit: 50 }, filters = {}, options = {} } = query;
    const offset = (pagination.page - 1) * pagination.limit;

    const whereConditions = buildThemePurchaseWhereConditions(filters, options);

    const purchasesQuery = db
      .select()
      .from(themePurchases)
      .where(whereConditions)
      .limit(pagination.limit)
      .offset(offset)
      .orderBy(desc(themePurchases.createdAt));

    const countQuery = db
      .select({ count: count() })
      .from(themePurchases)
      .where(whereConditions);

    const [purchasesData, totalResult] = await Promise.all([
      purchasesQuery,
      countQuery
    ]);

    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / pagination.limit);

    return {
      data: purchasesData,
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
    console.error('Error getting theme purchases:', error);
    throw new Error('Failed to fetch theme purchases');
  }
}

// ============================================================================
// UTILITAIRES
// ============================================================================

/**
 * Construit les conditions WHERE pour les requêtes themes
 */
function buildThemeWhereConditions(
  filters: ThemeFilters,
  options: QueryOptions = {}
) {
  const conditions = [];

  if (!options.includeDeleted) {
    conditions.push(eq(themes.isDeleted, false));
  }

  if (!options.includeInactive) {
    conditions.push(eq(themes.isActive, true));
  }

  if (filters.id) {
    conditions.push(eq(themes.id, filters.id));
  }

  if (filters.creatorId) {
    conditions.push(eq(themes.creatorId, filters.creatorId));
  }

  if (filters.name) {
    conditions.push(ilike(themes.name, `%${filters.name}%`));
  }

  if (typeof filters.isPremium === 'boolean') {
    conditions.push(eq(themes.isPremium, filters.isPremium));
  }

  if (typeof filters.isPublic === 'boolean') {
    conditions.push(eq(themes.isPublic, filters.isPublic));
  }

  if (typeof filters.isCopy === 'boolean') {
    conditions.push(eq(themes.isCopy, filters.isCopy));
  }

  if (filters.category) {
    conditions.push(eq(themes.category, filters.category));
  }

  if (filters.tags && filters.tags.length > 0) {
    conditions.push(sql`${themes.tags} && ${filters.tags}`);
  }

  if (filters.downloadsMin !== undefined) {
    conditions.push(gte(themes.downloads, filters.downloadsMin));
  }

  if (filters.downloadsMax !== undefined) {
    conditions.push(lte(themes.downloads, filters.downloadsMax));
  }

  if (filters.viewCountMin !== undefined) {
    conditions.push(gte(themes.viewCount, filters.viewCountMin));
  }

  if (filters.viewCountMax !== undefined) {
    conditions.push(lte(themes.viewCount, filters.viewCountMax));
  }

  if (filters.priceMin !== undefined) {
    conditions.push(gte(themes.price, String(filters.priceMin)));
  }

  if (filters.priceMax !== undefined) {
    conditions.push(lte(themes.price, sql`${filters.priceMax}::numeric`));
  }

  if (filters.createdFrom) {
    conditions.push(gte(themes.createdAt, new Date(filters.createdFrom)));
  }

  if (filters.createdTo) {
    conditions.push(lte(themes.createdAt, new Date(filters.createdTo)));
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

/**
 * Construit les conditions WHERE pour les requêtes themePurchases
 */
function buildThemePurchaseWhereConditions(
  filters: any,
  options: QueryOptions = {}
) {
  const conditions = [];

  if (filters.userId) {
    conditions.push(eq(themePurchases.userId, filters.userId));
  }

  if (filters.themeId) {
    conditions.push(eq(themePurchases.themeId, filters.themeId));
  }

  if (filters.priceMin !== undefined) {
    conditions.push(gte(themePurchases.price, filters.priceMin));
  }

  if (filters.priceMax !== undefined) {
    conditions.push(lte(themePurchases.price, filters.priceMax));
  }

  if (filters.createdFrom) {
    conditions.push(gte(themePurchases.createdAt, new Date(filters.createdFrom)));
  }

  if (filters.createdTo) {
    conditions.push(lte(themePurchases.createdAt, new Date(filters.createdTo)));
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}
