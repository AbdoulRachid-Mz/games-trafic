'use server';

import { guides, guideSteps, type Guide, type NewGuide, type GuideStep, type NewGuideStep, users, GuideWithRelations } from '@/database/schema';
import { eq, and, or, like, ilike, inArray, between, desc, asc, sql, count, gt, lt, gte, lte, isNull, isNotNull, exists } from 'drizzle-orm';
import { type GuideFilters, type GuideStepFilters, type ListQuery, type PaginationResponse, type QueryOptions } from '@/types/api';
import { db } from '@/lib/db';
import { cacheTag, cacheLife } from 'next/cache';
import { revalidateTag } from 'next/cache';

// ============================================================================
// QUERIES - Lecture des données
// ============================================================================

/**
 * Récupère un guide par son ID avec relations optionnelles
 */
export async function getGuideById(
  id: string,
  options?: { populate?: string[] }
): Promise<GuideWithRelations | null> {
  'use cache';
  cacheTag(`guide-${id}`, 'guides');
  cacheLife('hours');
  try {
    if (options?.populate && options.populate.length > 0) {
      const query = db.query.guides.findFirst({
        where: (guides, { eq }) => eq(guides.id, id),
        with: {
          admin: options.populate.includes('admin') ? true : undefined,
          steps: options.populate.includes('steps') ? true : undefined,
        }
      });
      return (await query) ?? null;
    }

    const result = await db
      .select()
      .from(guides)
      .where(eq(guides.id, id))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error('Error getting guide by ID:', error);
    throw new Error('Failed to fetch guide');
  }
}

/**
 * Récupère une étape de guide par son ID
 */
export async function getGuideStepById(id: string): Promise<GuideStep | null> {
  'use cache';
  cacheTag(`guide-step-${id}`, 'guides');
  cacheLife('hours');
  try {
    const result = await db
      .select()
      .from(guideSteps)
      .where(eq(guideSteps.id, id))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error('Error getting guide step by ID:', error);
    throw new Error('Failed to fetch guide step');
  }
}

/**
 * Liste les guides avec pagination, filtres et options
 */
export async function getGuides(
  query: ListQuery<GuideFilters> = {}
): Promise<PaginationResponse<Guide>> {
  'use cache';
  cacheTag('guides');
  cacheLife('hours');
  try {
    const { pagination = { page: 1, limit: 50 }, filters = {}, options = {} } = query;
    const offset = (pagination.page - 1) * pagination.limit;

    const whereConditions = buildGuideWhereConditions(filters, options);

    const guidesQuery = db
      .select()
      .from(guides)
      .where(whereConditions)
      .limit(pagination.limit)
      .offset(offset);

    if (options.sortBy) {
      const sortField = options.sortBy as keyof Guide;
      const sortOrder = options.sortOrder === 'desc' ? desc : asc;
      guidesQuery.orderBy(sortOrder(guides[sortField]));
    } else {
      guidesQuery.orderBy(desc(guides.createdAt));
    }

    const countQuery = db
      .select({ count: count() })
      .from(guides)
      .where(whereConditions);

    const [guidesData, totalResult] = await Promise.all([
      guidesQuery,
      countQuery
    ]);

    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / pagination.limit);

    return {
      data: guidesData,
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
    console.error('Error getting guides:', error);
    throw new Error('Failed to fetch guides');
  }
}

/**
 * Liste les étapes d'un guide
 */
export async function getGuideSteps(
  guideId: string,
  query: ListQuery<GuideStepFilters> = {}
): Promise<PaginationResponse<GuideStep>> {
  'use cache';
  cacheTag('guides', `guide-steps-${guideId}`);
  cacheLife('hours');
  try {
    const { pagination = { page: 1, limit: 50 }, filters = {}, options = {} } = query;
    const offset = (pagination.page - 1) * pagination.limit;

    const whereConditions = and(
      eq(guideSteps.guideId, guideId),
      buildGuideStepWhereConditions(filters, options)
    );

    const stepsQuery = db
      .select()
      .from(guideSteps)
      .where(whereConditions)
      .limit(pagination.limit)
      .offset(offset)
      .orderBy(asc(guideSteps.order));

    const countQuery = db
      .select({ count: count() })
      .from(guideSteps)
      .where(whereConditions);

    const [stepsData, totalResult] = await Promise.all([
      stepsQuery,
      countQuery
    ]);

    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / pagination.limit);

    return {
      data: stepsData,
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
    console.error('Error getting guide steps:', error);
    throw new Error('Failed to fetch guide steps');
  }
}

/**
 * Récupère les statistiques des guides
 */
export async function getGuideStats(filters?: GuideFilters) {
  'use cache';
  cacheTag('guides', 'stats');
  cacheLife('hours');
  try {
    const whereConditions = buildGuideWhereConditions(filters || {});

    const [totalResult, activeResult, deletedResult, avgViewCountResult] = await Promise.all([
      db.select({ count: count() }).from(guides).where(whereConditions),
      db.select({ count: count() }).from(guides).where(and(whereConditions, eq(guides.isActive, true))),
      db.select({ count: count() }).from(guides).where(and(whereConditions, eq(guides.isDeleted, true))),
      db.select({ avg: sql<number>`avg(${guides.viewCount})`.mapWith(Number) }).from(guides).where(whereConditions)
    ]);

    const stats = {
      total: totalResult[0]?.count ?? 0,
      active: activeResult[0]?.count ?? 0,
      deleted: deletedResult[0]?.count ?? 0,
      averageViewCount: avgViewCountResult[0]?.avg ?? 0
    };

    return stats;
  } catch (error) {
    console.error('Error getting guide stats:', error);
    throw new Error('Failed to fetch guide statistics');
  }
}

// ============================================================================
// MUTATIONS - Écriture des données
// ============================================================================

/**
 * Vérifie si un titre de guide existe déjà (pour l'unicité)
 */
export async function checkGuideTitleExists(
  title: string,
  excludeId?: string
): Promise<boolean> {
  try {
    const conditions = [eq(guides.title, title), eq(guides.isDeleted, false)];
    if (excludeId) {
      conditions.push(sql`${guides.id} != ${excludeId}`);
    }

    const result = await db
      .select({ count: count() })
      .from(guides)
      .where(and(...conditions));

    return (result[0]?.count ?? 0) > 0;
  } catch (error) {
    console.error("Error checking guide title existence:", error);
    return false;
  }
}

/**
 * Crée un nouveau guide
 */
export async function createGuide(guideData: NewGuide): Promise<Guide> {
  try {
    if (!guideData.title || !guideData.category || !guideData.adminId) {
      throw new Error('Title, category and adminId are required');
    }

    const result = await db
      .insert(guides)
      .values({
        ...guideData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    revalidateTag('guides', 'max');
    return result[0];
  } catch (error) {
    console.error('Error creating guide:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to create guide');
  }
}

/**
 * Met à jour un guide
 */
export async function updateGuide(
  id: string,
  guideData: Partial<NewGuide>
): Promise<Guide> {
  try {
    const existingGuide = await getGuideById(id);
    if (!existingGuide) {
      throw new Error('Guide not found');
    }

    const result = await db
      .update(guides)
      .set({
        ...guideData,
        updatedAt: new Date(),
      })
      .where(eq(guides.id, id))
      .returning();

    revalidateTag('guides', 'max');
    revalidateTag(`guide-${id}`, 'max');
    return result[0];
  } catch (error) {
    console.error('Error updating guide:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to update guide');
  }
}

/**
 * Supprime un guide (soft delete)
 */
export async function deleteGuide(id: string): Promise<Guide> {
  try {
    const result = await db
      .update(guides)
      .set({
        isDeleted: true,
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(guides.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error('Guide not found');
    }

    revalidateTag('guides', 'max');
    revalidateTag(`guide-${id}`, 'max');
    return result[0];
  } catch (error) {
    console.error('Error deleting guide:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to delete guide');
  }
}

/**
 * Restaure un guide supprimé
 */
export async function restoreGuide(id: string): Promise<Guide> {
  try {
    const result = await db
      .update(guides)
      .set({
        isDeleted: false,
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(guides.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error('Guide not found');
    }

    revalidateTag('guides', 'max');
    revalidateTag(`guide-${id}`, 'max');
    return result[0];
  } catch (error) {
    console.error('Error restoring guide:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to restore guide');
  }
}

/**
 * Crée une étape de guide
 */
export async function createGuideStep(stepData: NewGuideStep): Promise<GuideStep> {
  try {
    if (!stepData.title || !stepData.content || !stepData.guideId) {
      throw new Error('Title, content and guideId are required');
    }

    const result = await db
      .insert(guideSteps)
      .values({
        ...stepData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    revalidateTag('guides', 'max');
    return result[0];
  } catch (error) {
    console.error('Error creating guide step:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to create guide step');
  }
}

/**
 * Met à jour une étape de guide
 */
export async function updateGuideStep(
  id: string,
  stepData: Partial<NewGuideStep>
): Promise<GuideStep> {
  try {
    const existingStep = await getGuideStepById(id);
    if (!existingStep) {
      throw new Error('Guide step not found');
    }

    const result = await db
      .update(guideSteps)
      .set({
        ...stepData,
        updatedAt: new Date(),
      })
      .where(eq(guideSteps.id, id))
      .returning();

    revalidateTag('guides', 'max');
    revalidateTag(`guide-step-${id}`, 'max');
    return result[0];
  } catch (error) {
    console.error('Error updating guide step:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to update guide step');
  }
}

/**
 * Supprime une étape de guide
 */
export async function deleteGuideStep(id: string): Promise<GuideStep> {
  try {
    const result = await db
      .delete(guideSteps)
      .where(eq(guideSteps.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error('Guide step not found');
    }

    revalidateTag('guides', 'max');
    return result[0];
  } catch (error) {
    console.error('Error deleting guide step:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to delete guide step');
  }
}

/**
 * Incrémente le compteur de vues d'un guide
 */
export async function incrementGuideViewCount(id: string): Promise<Guide> {
  try {
    const result = await db
      .update(guides)
      .set({
        viewCount: sql`${guides.viewCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(guides.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error('Guide not found');
    }

    return result[0];
  } catch (error) {
    console.error('Error incrementing guide view count:', error);
    throw new Error('Failed to increment view count');
  }
}

// ============================================================================
// UTILITAIRES
// ============================================================================

/**
 * Construit les conditions WHERE pour les requêtes guides
 */
function buildGuideWhereConditions(
  filters: GuideFilters,
  options: QueryOptions = {}
) {
  const conditions = [];

  if (!options.includeDeleted) {
    conditions.push(eq(guides.isDeleted, false));
  }

  if (!options.includeInactive) {
    conditions.push(eq(guides.isActive, true));
  }

  if (filters.title) {
    conditions.push(ilike(guides.title, `%${filters.title}%`));
  }

  if (filters.category) {
    conditions.push(ilike(guides.category, `%${filters.category}%`));
  }

  if (filters.adminId) {
    conditions.push(eq(guides.adminId, filters.adminId));
  }

  if (filters.viewCountMin !== undefined) {
    conditions.push(gte(guides.viewCount, filters.viewCountMin));
  }

  if (filters.viewCountMax !== undefined) {
    conditions.push(lte(guides.viewCount, filters.viewCountMax));
  }

  if (filters.hasImages) {
    conditions.push(sql`array_length(${guides.images}, 1) > 0`);
  }

  if (filters.createdFrom) {
    conditions.push(gte(guides.createdAt, new Date(filters.createdFrom)));
  }

  if (filters.createdTo) {
    conditions.push(lte(guides.createdAt, new Date(filters.createdTo)));
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

/**
 * Construit les conditions WHERE pour les requêtes guideSteps
 */
function buildGuideStepWhereConditions(
  filters: GuideStepFilters,
  options: QueryOptions = {}
) {
  const conditions = [];

  if (filters.title) {
    conditions.push(ilike(guideSteps.title, `%${filters.title}%`));
  }

  if (filters.content) {
    conditions.push(ilike(guideSteps.content, `%${filters.content}%`));
  }

  if (filters.orderMin !== undefined) {
    conditions.push(gte(guideSteps.order, filters.orderMin));
  }

  if (filters.orderMax !== undefined) {
    conditions.push(lte(guideSteps.order, filters.orderMax));
  }

  if (filters.hasImages) {
    conditions.push(sql`array_length(${guideSteps.images}, 1) > 0`);
  }

  if (filters.createdFrom) {
    conditions.push(gte(guideSteps.createdAt, new Date(filters.createdFrom)));
  }

  if (filters.createdTo) {
    conditions.push(lte(guideSteps.createdAt, new Date(filters.createdTo)));
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}
