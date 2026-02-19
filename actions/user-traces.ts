'use server';

import { userTraces, type UserTrace, type NewUserTrace } from '@/database/schema';
import { eq, and, or, like, ilike, inArray, between, desc, asc, sql, count, gt, lt, gte, lte, isNull, isNotNull } from 'drizzle-orm';
import { type UserTraceFilters, type ListQuery, type PaginationResponse, type QueryOptions } from '@/types/api';
import { db } from '@/lib/db';
import { TraceType } from '@/types/trace';

// ============================================================================
// QUERIES - Lecture des données
// ============================================================================

/**
 * Récupère une trace par son ID
 */
export async function getUserTraceById(id: string): Promise<UserTrace | null> {
  try {
    const result = await db
      .select()
      .from(userTraces)
      .where(eq(userTraces.id, id))
      .limit(1);
    return result[0] || null;
  } catch (error) {
    console.error('Error getting user trace by ID:', error);
    throw new Error('Failed to fetch user trace');
  }
}

/**
 * Liste les traces utilisateur avec pagination, filtres et options
 */
export async function getUserTraces(
  query: ListQuery<UserTraceFilters> = {}
): Promise<PaginationResponse<UserTrace>> {
  try {
    const { pagination = { page: 1, limit: 50 }, filters = {}, options = {} } = query;
    const offset = (pagination.page - 1) * pagination.limit;

    // Construction des conditions WHERE
    const whereConditions = buildUserTraceWhereConditions(filters, options);

    // Requête pour les données
    const tracesQuery = db
      .select()
      .from(userTraces)
      .where(whereConditions)
      .limit(pagination.limit)
      .offset(offset);

    // Application du tri
    if (options.sortBy) {
      const sortField = options.sortBy as keyof UserTrace;
      const sortOrder = options.sortOrder === 'desc' ? desc : asc;
      tracesQuery.orderBy(sortOrder(userTraces[sortField]));
    } else {
      tracesQuery.orderBy(desc(userTraces.createdAt));
    }

    // Requête pour le count total
    const countQuery = db
      .select({ count: count() })
      .from(userTraces)
      .where(whereConditions);

    const [tracesData, totalResult] = await Promise.all([
      tracesQuery,
      countQuery
    ]);

    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / pagination.limit);

    return {
      data: tracesData,
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
    console.error('Error getting user traces:', error);
    throw new Error('Failed to fetch user traces');
  }
}

/**
 * Récupère les statistiques des traces utilisateur
 */
export async function getUserTraceStats(filters?: UserTraceFilters) {
  try {
    const whereConditions = buildUserTraceWhereConditions(filters || {});

    const [totalResult, byTypeResult, syncedResult] = await Promise.all([
      // Total des traces
      db.select({ count: count() }).from(userTraces).where(whereConditions),
      // Répartition par type
      db.select({
        type: userTraces.type,
        count: count()
      })
        .from(userTraces)
        .where(whereConditions)
        .groupBy(userTraces.type),
      // Traces synchronisées vs non synchronisées
      db.select({
        synced: userTraces.synced,
        count: count()
      })
        .from(userTraces)
        .where(whereConditions)
        .groupBy(userTraces.synced)
    ]);

    const stats = {
      total: totalResult[0]?.count ?? 0,
      byType: byTypeResult.reduce((acc, row) => {
        acc[row.type] = row.count;
        return acc;
      }, {} as Record<string, number>),
      synced: syncedResult.reduce((acc, row) => {
        acc[row.synced ? 'synced' : 'unsynced'] = row.count;
        return acc;
      }, {} as Record<string, number>)
    };

    return stats;
  } catch (error) {
    console.error('Error getting user trace stats:', error);
    throw new Error('Failed to fetch user trace statistics');
  }
}

/**
 * Récupère les traces d'un utilisateur spécifique
 */
export async function getUserTracesByUserId(
  userId: string,
  options?: { limit?: number; types?: string[] }
): Promise<UserTrace[]> {
  try {
    const conditions = [eq(userTraces.userId, userId)];

    if (options?.types && options.types.length > 0) {
      conditions.push(inArray(userTraces.type, options.types as any));
    }

    const query = db
      .select()
      .from(userTraces)
      .where(and(...conditions))
      .orderBy(desc(userTraces.createdAt));

    if (options?.limit) {
      query.limit(options.limit);
    }

    return await query;
  } catch (error) {
    console.error('Error getting user traces by user ID:', error);
    throw new Error('Failed to fetch user traces');
  }
}

/**
 * Récupère les traces par session ID
 */
export async function getUserTracesBySessionId(
  sessionId: string,
  options?: { limit?: number; types?: string[] }
): Promise<UserTrace[]> {
  try {
    const conditions = [eq(userTraces.sessionId, sessionId)];

    if (options?.types && options.types.length > 0) {
      conditions.push(inArray(userTraces.type, options.types as any));
    }

    const query = db
      .select()
      .from(userTraces)
      .where(and(...conditions))
      .orderBy(desc(userTraces.createdAt));

    if (options?.limit) {
      query.limit(options.limit);
    }

    return await query;
  } catch (error) {
    console.error('Error getting user traces by session ID:', error);
    throw new Error('Failed to fetch user traces');
  }
}

// ============================================================================
// MUTATIONS - Écriture des données
// ============================================================================

/**
 * Crée une nouvelle trace utilisateur
 */
export async function createUserTrace(traceData: NewUserTrace): Promise<UserTrace> {
  try {
    // Validation des données requises
    if (!traceData.type) {
      throw new Error('Type is required');
    }

    const result = await db
      .insert(userTraces)
      .values({
        ...traceData,
        createdAt: new Date(),
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Error creating user trace:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to create user trace');
  }
}

/**
 * Crée plusieurs traces en batch
 */
export async function createUserTracesBatch(
  tracesData: NewUserTrace[]
): Promise<UserTrace[]> {
  try {
    if (!tracesData.length) {
      throw new Error('Traces data cannot be empty');
    }

    // Validation des données
    for (const trace of tracesData) {
      if (!trace.type) {
        throw new Error('Type is required for all traces');
      }
    }

    const filtered = tracesData.filter(trace => {
      const id = (trace.entityId || '').toUpperCase();
      if (trace.type === 'VIEW' && ['SCROLL_DEPTH', 'PAGE_DURATION', 'CLICK'].includes(id)) {
        return false;
      }
      return true;
    });

    if (!filtered.length) {
      return [];
    }

    const tracesWithTimestamps = filtered.map(trace => ({
      ...trace,
      createdAt: new Date(),
    }));

    const result = await db
      .insert(userTraces)
      .values(tracesWithTimestamps)
      .returning();

    return result;
  } catch (error) {
    console.error('Error creating user traces batch:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to create user traces batch');
  }
}

/**
 * Met à jour une trace
 */
export async function updateUserTrace(
  id: string,
  traceData: Partial<NewUserTrace>
): Promise<UserTrace> {
  try {
    // Vérification que la trace existe
    const existingTrace = await getUserTraceById(id);
    if (!existingTrace) {
      throw new Error('User trace not found');
    }

    const result = await db
      .update(userTraces)
      .set(traceData)
      .where(eq(userTraces.id, id))
      .returning();

    return result[0];
  } catch (error) {
    console.error('Error updating user trace:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to update user trace');
  }
}

// actions/user-traces.ts - Ajouter cette fonction
export async function createOptimizedUserTraces(
  tracesData: Array<{
    userId: string | null;
    sessionId: string | null;
    type: TraceType;
    entityId?: string | null;
    payload?: any;
  }>
): Promise<number> {
  try {
    if (!tracesData.length) return 0;
    
    // FILTRER les traces avant insertion
    const filteredTraces = tracesData.filter(trace => {
      // Ignorer les traces sans type
      if (!trace.type) return false;
      
      // Ignorer certains types en excès
      const lowPriorityTypes: TraceType[] = ['VIEW', 'NAVIGATION'];
      if (lowPriorityTypes.includes(trace.type)) {
        // Échantillonner seulement 30% des traces VIEW/NAVIGATION
        return Math.random() < 0.3;
      }
      
      return true;
    });
    
    // LIMITER le nombre de traces insérées
    const tracesToInsert = filteredTraces.slice(0, 100); // Max 100 traces
    
    if (tracesToInsert.length === 0) return 0;
    
    // Préparer les données avec timestamps
    const tracesWithTimestamps = tracesToInsert.map(trace => ({
      ...trace,
      createdAt: new Date(),
      payload: trace.payload || {},
    }));
    
    // Insérer en batch
    const result = await db
      .insert(userTraces)
      .values(tracesWithTimestamps);
    
    return result.count || 0;
  } catch (error) {
    console.error('Error creating optimized user traces:', error);
    // Ne pas throw pour éviter de bloquer l'application
    return 0;
  }
}


/**
 * Marque une trace comme synchronisée
 */
export async function markTraceAsSynced(id: string): Promise<UserTrace> {
  try {
    const result = await db
      .update(userTraces)
      .set({ synced: true })
      .where(eq(userTraces.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error('User trace not found');
    }

    return result[0];
  } catch (error) {
    console.error('Error marking trace as synced:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to mark trace as synced');
  }
}

/**
 * Marque plusieurs traces comme synchronisées
 */
export async function markTracesAsSynced(ids: string[]): Promise<number> {
  try {
    if (!ids.length) return 0;

    const result = await db
      .update(userTraces)
      .set({ synced: true })
      .where(inArray(userTraces.id, ids));

    return result.count || 0;
  } catch (error) {
    console.error('Error marking traces as synced:', error);
    throw new Error('Failed to mark traces as synced');
  }
}

/**
 * Supprime une trace (soft delete)
 */
export async function deleteUserTrace(id: string): Promise<UserTrace> {
  try {
    const result = await db
      .delete(userTraces)
      .where(eq(userTraces.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error('User trace not found');
    }

    return result[0];
  } catch (error) {
    console.error('Error deleting user trace:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to delete user trace');
  }
}

/**
 * Supprime plusieurs traces par IDs
 */
export async function deleteUserTracesBatch(ids: string[]): Promise<number> {
  try {
    if (!ids.length) return 0;

    const result = await db
      .delete(userTraces)
      .where(inArray(userTraces.id, ids));

    return result.count || 0;
  } catch (error) {
    console.error('Error deleting user traces batch:', error);
    throw new Error('Failed to delete user traces batch');
  }
}

/**
 * Nettoie les anciennes traces (plus vieilles que X jours)
 */
export async function cleanupOldTraces(daysOld: number): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await db
      .delete(userTraces)
      .where(lt(userTraces.createdAt, cutoffDate));

    return result.count || 0;
  } catch (error) {
    console.error('Error cleaning up old traces:', error);
    throw new Error('Failed to cleanup old traces');
  }
}

// ============================================================================
// UTILITAIRES
// ============================================================================

/**
 * Construit les conditions WHERE pour les requêtes userTraces
 */
function buildUserTraceWhereConditions(
  filters: UserTraceFilters,
  options: QueryOptions = {}
) {
  const conditions = [];

  // Filtres de base
  if (!options.includeDeleted) {
    // userTraces n'a pas de champ isDeleted, donc on ne fait rien ici
  }

  // Filtres spécifiques
  if (filters.userId) {
    conditions.push(eq(userTraces.userId, filters.userId));
  }

  if (filters.sessionId) {
    conditions.push(eq(userTraces.sessionId, filters.sessionId));
  }

  if (filters.types && filters.types.length > 0) {
    conditions.push(inArray(userTraces.type, filters.types as any));
  }

  if (filters.entityId) {
    conditions.push(eq(userTraces.entityId, filters.entityId));
  }

  if (typeof filters.synced === 'boolean') {
    conditions.push(eq(userTraces.synced, filters.synced));
  }

  // Filtres de date
  if (filters.createdFrom) {
    conditions.push(gte(userTraces.createdAt, new Date(filters.createdFrom)));
  }

  if (filters.createdTo) {
    conditions.push(lte(userTraces.createdAt, new Date(filters.createdTo)));
  }

  // Filtres de recherche générale
  if (filters.search) {
    conditions.push(
      or(
        ilike(userTraces.type, `%${filters.search}%`),
        ilike(userTraces.entityId || '', `%${filters.search}%`),
        ilike(userTraces.sessionId || '', `%${filters.search}%`)
      )
    );
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

/**
 * Enregistre une trace de navigation
 */
export async function logNavigationTrace(
  userId: string | null,
  sessionId: string | null,
  entityId: string,
  entityType: string,
  metadata?: any
): Promise<UserTrace> {
  return createUserTrace({
    userId,
    sessionId,
    type: 'NAVIGATION',
    entityId,
    payload: {
      entityType,
      ...metadata
    }
  });
}

/**
 * Enregistre une trace de connexion
 */
export async function logSignInTrace(
  userId: string,
  sessionId: string,
  metadata?: any
): Promise<UserTrace> {
  return createUserTrace({
    userId,
    sessionId,
    type: 'SIGNIN',
    payload: metadata
  });
}

/**
 * Enregistre une trace de déconnexion
 */
export async function logSignOutTrace(
  userId: string,
  sessionId: string,
  metadata?: any
): Promise<UserTrace> {
  return createUserTrace({
    userId,
    sessionId,
    type: 'SIGNOUT',
    payload: metadata
  });
}

/**
 * Enregistre une trace d'erreur
 */
export async function logErrorTrace(
  userId: string | null,
  sessionId: string | null,
  error: string,
  metadata?: any
): Promise<UserTrace> {
  return createUserTrace({
    userId,
    sessionId,
    type: 'ERROR',
    payload: {
      error,
      ...metadata
    }
  });
}

/**
 * Enregistre une trace d'interaction
 */
export async function logInteractionTrace(
  userId: string,
  sessionId: string,
  interactionType: string,
  entityId: string,
  metadata?: any
): Promise<UserTrace> {
  return createUserTrace({
    userId,
    sessionId,
    type: interactionType as any,
    entityId,
    payload: metadata
  });
}
