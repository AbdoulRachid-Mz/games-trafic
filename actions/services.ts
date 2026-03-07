// @/actions/services
'use server';

import { services, type Service, type NewService } from '@/database/schema';
import { eq, and, like, ilike, desc, asc, count, sql } from 'drizzle-orm';
import { type ListQuery, type PaginationResponse, type QueryOptions } from '@/types/api';
import { db } from '@/lib/db';

// ============================================================================
// QUERIES - Lecture des données
// ============================================================================

/**
 * Récupère un service par son ID
 */
export async function getServiceById(
  id: string,
  options?: { populate?: string[] }
): Promise<Service | null> {
  try {
    if (!id) {
      throw new Error('Service ID is required');
    }

    if (options?.populate?.includes('admin')) {
      const query = db.query.services.findFirst({
        where: (services, { eq }) => eq(services.id, id),
        with: { admin: true },
      });
      return (await query) ?? null;
    }

    const result = await db
      .select()
      .from(services)
      .where(eq(services.id, id))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error('Error getting service by ID:', error);
    throw new Error('Failed to fetch service');
  }
}

/**
 * Liste les services avec pagination, filtres et options
 */
export async function getServices(
  query: ListQuery<ServiceFilters> = {}
): Promise<PaginationResponse<Service>> {
  try {
    const { pagination = { page: 1, limit: 50 }, filters = {}, options = {} } = query;
    const offset = (pagination.page - 1) * pagination.limit;

    const whereConditions = buildServiceWhereConditions(filters, options);

    const servicesQuery = db
      .select()
      .from(services)
      .where(whereConditions)
      .limit(pagination.limit)
      .offset(offset);

    if (options.sortBy) {
      const sortField = options.sortBy as keyof Service;
      const sortOrder = options.sortOrder === 'desc' ? desc : asc;
      servicesQuery.orderBy(sortOrder(services[sortField]));
    } else {
      servicesQuery.orderBy(desc(services.createdAt));
    }

    const countQuery = db
      .select({ count: count() })
      .from(services)
      .where(whereConditions);

    const [servicesData, totalResult] = await Promise.all([servicesQuery, countQuery]);

    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / pagination.limit);

    return {
      data: servicesData,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages,
        hasNext: pagination.page < totalPages,
        hasPrev: pagination.page > 1,
      },
    };
  } catch (error) {
    console.error('Error getting services:', error);
    throw new Error('Failed to fetch services');
  }
}

/**
 * Récupère les statistiques des services
 */
export async function getServiceStats(filters?: ServiceFilters) {
  try {
    const whereConditions = buildServiceWhereConditions(filters || {});

    const [totalResult, activeResult, deletedResult] = await Promise.all([
      db.select({ count: count() }).from(services).where(whereConditions),
      db
        .select({ count: count() })
        .from(services)
        .where(and(whereConditions, eq(services.isActive, true))),
      db
        .select({ count: count() })
        .from(services)
        .where(and(whereConditions, eq(services.isDeleted, true))),
    ]);

    return {
      total: totalResult[0]?.count ?? 0,
      active: activeResult[0]?.count ?? 0,
      deleted: deletedResult[0]?.count ?? 0,
    };
  } catch (error) {
    console.error('Error getting service stats:', error);
    throw new Error('Failed to fetch service statistics');
  }
}

// ============================================================================
// MUTATIONS - Écriture des données
// ============================================================================

/**
 * Crée un nouveau service
 */
export async function createService(serviceData: NewService): Promise<Service> {
  try {
    if (!serviceData.title || !serviceData.description || !serviceData.adminId) {
      throw new Error('Title, description, and adminId are required');
    }

    const result = await db
      .insert(services)
      .values({
        ...serviceData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Error creating service:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to create service');
  }
}

/**
 * Met à jour un service
 */
export async function updateService(
  id: string,
  serviceData: Partial<NewService>
): Promise<Service> {
  try {
    const existingService = await getServiceById(id);
    if (!existingService) {
      throw new Error('Service not found');
    }

    const result = await db
      .update(services)
      .set({
        ...serviceData,
        updatedAt: new Date(),
      })
      .where(eq(services.id, id))
      .returning();

    return result[0];
  } catch (error) {
    console.error('Error updating service:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to update service');
  }
}

/**
 * Supprime un service (soft delete)
 */
export async function deleteService(id: string): Promise<Service> {
  try {
    const result = await db
      .update(services)
      .set({
        isDeleted: true,
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(services.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error('Service not found');
    }

    return result[0];
  } catch (error) {
    console.error('Error deleting service:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to delete service');
  }
}

/**
 * Restaure un service supprimé
 */
export async function restoreService(id: string): Promise<Service> {
  try {
    const result = await db
      .update(services)
      .set({
        isDeleted: false,
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(services.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error('Service not found');
    }

    return result[0];
  } catch (error) {
    console.error('Error restoring service:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to restore service');
  }
}

/**
 * Active/Désactive un service
 */
export async function toggleServiceActive(id: string, isActive: boolean): Promise<Service> {
  try {
    const result = await db
      .update(services)
      .set({
        isActive,
        updatedAt: new Date(),
      })
      .where(eq(services.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error('Service not found');
    }

    return result[0];
  } catch (error) {
    console.error('Error toggling service active status:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to update service active status');
  }
}

// ============================================================================
// UTILITAIRES
// ============================================================================

/**
 * Construit les conditions WHERE pour les requêtes services
 */
function buildServiceWhereConditions(
  filters: ServiceFilters,
  options: QueryOptions = {}
) {
  const conditions = [];

  if (!options.includeDeleted) {
    conditions.push(eq(services.isDeleted, false));
  }

  if (!options.includeInactive && typeof filters.isActive === 'boolean') {
    conditions.push(eq(services.isActive, filters.isActive));
  }

  if (filters.title) {
    conditions.push(ilike(services.title, `%${filters.title}%`));
  }

  if (filters.description) {
    conditions.push(ilike(services.description, `%${filters.description}%`));
  }

  if (filters.adminId) {
    conditions.push(eq(services.adminId, filters.adminId));
  }

  if (filters.hasImages === true) {
    conditions.push(sql`array_length(${services.images}, 1) > 0`);
  } else if (filters.hasImages === false) {
    conditions.push(sql`array_length(${services.images}, 1) = 0`);
  }

  if (filters.createdFrom) {
    conditions.push(sql`${services.createdAt} >= ${new Date(filters.createdFrom)}`);
  }

  if (filters.createdTo) {
    conditions.push(sql`${services.createdAt} <= ${new Date(filters.createdTo)}`);
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

/**
 * Types de filtres pour les services
 */
export interface ServiceFilters {
  id?: string;
  title?: string;
  description?: string;
  adminId?: string;
  isActive?: boolean;
  isDeleted?: boolean;
  hasImages?: boolean;
  createdFrom?: Date | string;
  createdTo?: Date | string;
}
