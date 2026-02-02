// @/actions/historique
'use server';

import { searchHistory, type SearchHistory, type NewSearchHistory } from '@/database/schema';
import { eq, and, ilike, desc, asc, sql, count, between, gte, lte, lt, inArray, SQL } from 'drizzle-orm';
import { db } from '@/lib/db';
import { type ListQuery, type PaginationResponse, type SearchHistoryFilters } from '@/types/api';

// ============================================================================
// QUERIES - Lecture des données
// ============================================================================

/**
 * Récupère un historique de recherche par son ID
 */
export async function getSearchHistoryById(id: string): Promise<SearchHistory | null> {
  try {
    const result = await db
      .select()
      .from(searchHistory)
      .where(eq(searchHistory.id, id))
      .limit(1);
    return result[0] || null;
  } catch (error) {
    console.error('Error getting search history by ID:', error);
    throw new Error('Failed to fetch search history');
  }
}

/**
 * Liste l'historique de recherche d'un utilisateur avec pagination et filtres
 */
export async function getUserSearchHistory(
  userId: string,
  query: ListQuery<SearchHistoryFilters> = {}
): Promise<PaginationResponse<SearchHistory>> {
  try {
    const { pagination = { page: 1, limit: 20 }, filters = {}, options = {} } = query;
    const offset = (pagination.page - 1) * pagination.limit;

    // Construction des conditions WHERE
    const whereConditions = buildSearchHistoryWhereConditions(userId, filters, options);

    // Requête pour les données
    const historyQuery = db
      .select()
      .from(searchHistory)
      .where(whereConditions)
      .limit(pagination.limit)
      .offset(offset);

    // Application du tri
    if (options.sortBy) {
      const sortField = options.sortBy as keyof SearchHistory;
      const sortOrder = options.sortOrder === 'asc' ? asc : desc;
      historyQuery.orderBy(sortOrder(searchHistory[sortField]));
    } else {
      historyQuery.orderBy(desc(searchHistory.createdAt));
    }

    // Requête pour le count total
    const countQuery = db
      .select({ count: count() })
      .from(searchHistory)
      .where(whereConditions);

    const [historyData, totalResult] = await Promise.all([historyQuery, countQuery]);

    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / pagination.limit);

    return {
      data: historyData,
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
    console.error('Error getting user search history:', error);
    throw new Error('Failed to fetch search history');
  }
}

/**
 * Récupère les tendances de recherche (termes les plus recherchés)
 */
export async function getSearchTrends(filters: {
  limit?: number;
  dateFrom?: Date;
  dateTo?: Date;
} = {}): Promise<Array<{ query: string; count: number }>> {
  try {
    const { limit = 10, dateFrom, dateTo } = filters;

    let whereConditions = undefined;
    if (dateFrom || dateTo) {
      const dateConditions = [];
      if (dateFrom) dateConditions.push(gte(searchHistory.createdAt, dateFrom));
      if (dateTo) dateConditions.push(lte(searchHistory.createdAt, dateTo));
      whereConditions = and(...dateConditions);
    }

    const trends = await db
      .select({
        query: searchHistory.query,
        count: count(searchHistory.id).as('count')
      })
      .from(searchHistory)
      .where(whereConditions)
      .groupBy(searchHistory.query)
      .orderBy(desc(sql`count`))
      .limit(limit);

    return trends;
  } catch (error) {
    console.error('Error getting search trends:', error);
    throw new Error('Failed to fetch search trends');
  }
}

// ============================================================================
// MUTATIONS - Écriture des données
// ============================================================================

/**
 * Crée un nouvel historique de recherche
 */
export async function createSearchHistory(data: NewSearchHistory): Promise<SearchHistory> {
  try {
    // Validation des données requises
    if (!data.userId || !data.query) {
      throw new Error('userId and query are required');
    }

    // Nettoyer la requête (trim et lowercase)
    const cleanQuery = data.query.trim().toLowerCase();

    // Vérifier si une entrée similaire existe déjà pour cet utilisateur dans les dernières 24h
    const existingEntry = await db
      .select()
      .from(searchHistory)
      .where(
        and(
          eq(searchHistory.userId, data.userId),
          eq(searchHistory.query, cleanQuery),
          gte(searchHistory.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000))
        )
      )
      .limit(1);

    if (existingEntry.length > 0) {
      // Mettre à jour la date de création si l'entrée existe déjà
      const result = await db
        .update(searchHistory)
        .set({ createdAt: new Date() })
        .where(eq(searchHistory.id, existingEntry[0].id))
        .returning();
      return result[0];
    }

    // Créer une nouvelle entrée
    const result = await db
      .insert(searchHistory)
      .values({
        ...data,
        query: cleanQuery,
        createdAt: new Date()
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Error creating search history:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to create search history');
  }
}

/**
 * Supprime un historique de recherche
 */
export async function deleteSearchHistory(id: string): Promise<boolean> {
  try {
    const result = await db
      .delete(searchHistory)
      .where(eq(searchHistory.id, id))
      .returning();

    return result.length > 0;
  } catch (error) {
    console.error('Error deleting search history:', error);
    throw new Error('Failed to delete search history');
  }
}

/**
 * Supprime l'historique de recherche d'un utilisateur (bulk delete)
 */
export async function deleteUserSearchHistory(
  userId: string,
  options?: {
    olderThan?: Date;
    queries?: string[];
  }
): Promise<number> {
  try {
    const { olderThan, queries } = options || {};

    let whereConditions = eq(searchHistory.userId, userId);

    if (olderThan) {
      whereConditions = and(whereConditions, lt(searchHistory.createdAt, olderThan)) as SQL<unknown>;
    }

    if (queries && queries.length > 0) {
      const cleanQueries = queries.map(q => q.trim().toLowerCase()) as string[];
      whereConditions = and(whereConditions, inArray(searchHistory.query, cleanQueries)) as SQL<unknown>;
    }

    const result = await db
      .delete(searchHistory)
      .where(whereConditions)
      .returning();

    return result.length;
  } catch (error) {
    console.error('Error deleting user search history:', error);
    throw new Error('Failed to delete user search history');
  }
}

/**
 * Nettoie l'ancien historique de recherche (supprime les entrées de plus de X jours)
 */
export async function cleanupOldSearchHistory(daysToKeep: number = 90): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await db
      .delete(searchHistory)
      .where(lt(searchHistory.createdAt, cutoffDate))
      .returning();

    return result.length;
  } catch (error) {
    console.error('Error cleaning up old search history:', error);
    throw new Error('Failed to cleanup old search history');
  }
}

// ============================================================================
// UTILITAIRES
// ============================================================================

/**
 * Construit les conditions WHERE pour les requêtes d'historique de recherche
 */
function buildSearchHistoryWhereConditions(
  userId?: string,
  filters: SearchHistoryFilters = {},
  options: { includeDeleted?: boolean } = {}
) {
  const conditions = [];

  // Filtre par utilisateur
  if (userId) {
    conditions.push(eq(searchHistory.userId, userId));
  }

  // Filtre par requête
  if (filters.query) {
    conditions.push(ilike(searchHistory.query, `%${filters.query}%`));
  }

  // Filtres de date
  if (filters.createdFrom) {
    conditions.push(gte(searchHistory.createdAt, new Date(filters.createdFrom)));
  }
  if (filters.createdTo) {
    conditions.push(lte(searchHistory.createdAt, new Date(filters.createdTo)));
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

/**
 * Migre l'historique de recherche d'un utilisateur anonyme vers un utilisateur enregistré
 */
export async function migrateSearchHistory(
  fromUserId: string,
  toUserId: string
): Promise<number> {
  try {
    const result = await db
      .update(searchHistory)
      .set({ userId: toUserId })
      .where(eq(searchHistory.userId, fromUserId))
      .returning();

    return result.length;
  } catch (error) {
    console.error('Error migrating search history:', error);
    throw new Error('Failed to migrate search history');
  }
}
