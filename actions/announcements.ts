'use server';

import {
  announcements,
  announcementReads,
  type Announcement,
  type NewAnnouncement,
  type AnnouncementRead,
  type NewAnnouncementRead,
  users,
} from '@/database/schema';
import {
  eq,
  and,
  or,
  like,
  ilike,
  inArray,
  desc,
  asc,
  sql,
  count,
  gte,
  lte,
  isNull,
  gt,
  lt,
} from 'drizzle-orm';
import {
  type AnnouncementFilters,
  type ListQuery,
  type PaginationResponse,
  type QueryOptions,
} from '@/types/api';
import { db } from '@/lib/db';

// ============================================================================
// QUERIES - Lecture des données
// ============================================================================

/**
 * Récupère une annonce par son ID avec relations optionnelles
 */
export async function getAnnouncementById(
  id: string,
  options?: { populate?: string[] }
): Promise<Announcement | null> {
  try {
    if (options?.populate && options.populate.length > 0) {
      const query = db.query.announcements.findFirst({
        where: (announcements, { eq }) => eq(announcements.id, id),
        with: {
          author: options.populate.includes('author') ? true : undefined,
          reads: options.populate.includes('reads') ? true : undefined,
        },
      });
      return (await query) ?? null;
    }

    const result = await db
      .select()
      .from(announcements)
      .where(eq(announcements.id, id))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error('Error getting announcement by ID:', error);
    throw new Error('Failed to fetch announcement');
  }
}

/**
 * Liste les annonces avec pagination, filtres et options
 */
export async function getAnnouncements(
  query: ListQuery<AnnouncementFilters> = {}
): Promise<PaginationResponse<Announcement>> {
  try {
    const {
      pagination = { page: 1, limit: 20 },
      filters = {},
      options = {},
    } = query;

    const offset = (pagination.page - 1) * pagination.limit;

    // Construction des conditions WHERE
    const whereConditions = buildAnnouncementWhereConditions(filters, options);

    // Requête pour les données
    const announcementsQuery = db
      .select()
      .from(announcements)
      .where(whereConditions)
      .limit(pagination.limit)
      .offset(offset);

    // Application du tri
    if (options.sortBy) {
      const sortField = options.sortBy as keyof Announcement;
      const sortOrder = options.sortOrder === 'desc' ? desc : asc;
      announcementsQuery.orderBy(sortOrder(announcements[sortField]));
    } else {
      announcementsQuery.orderBy(
        desc(announcements.isPinned),
        desc(announcements.createdAt)
      );
    }

    // Requête pour le count total
    const countQuery = db
      .select({ count: count() })
      .from(announcements)
      .where(whereConditions);

    const [announcementsData, totalResult] = await Promise.all([
      announcementsQuery,
      countQuery,
    ]);

    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / pagination.limit);

    return {
      data: announcementsData,
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
    console.error('Error getting announcements:', error);
    throw new Error('Failed to fetch announcements');
  }
}

/**
 * Récupère les statistiques des annonces
 */
export async function getAnnouncementStats(filters?: AnnouncementFilters) {
  try {
    const whereConditions = buildAnnouncementWhereConditions(filters || {});

    const [
      totalResult,
      activeResult,
      pinnedResult,
      deletedResult,
      byTypeResult,
    ] = await Promise.all([
      db.select({ count: count() }).from(announcements).where(whereConditions),
      db
        .select({ count: count() })
        .from(announcements)
        .where(and(whereConditions, eq(announcements.isActive, true))),
      db
        .select({ count: count() })
        .from(announcements)
        .where(and(whereConditions, eq(announcements.isPinned, true))),
      db
        .select({ count: count() })
        .from(announcements)
        .where(and(whereConditions, eq(announcements.isDeleted, true))),
      db
        .select({
          type: announcements.type,
          count: count(),
        })
        .from(announcements)
        .where(whereConditions)
        .groupBy(announcements.type),
    ]);

    const stats = {
      total: totalResult[0]?.count ?? 0,
      active: activeResult[0]?.count ?? 0,
      pinned: pinnedResult[0]?.count ?? 0,
      deleted: deletedResult[0]?.count ?? 0,
      byType: byTypeResult.reduce(
        (acc, row) => {
          if (row.type !== null) {
            acc[row.type] = row.count;
          }
          return acc;
        },
        {} as Record<string, number>
      ),
    };

    return stats;
  } catch (error) {
    console.error('Error getting announcement stats:', error);
    throw new Error('Failed to fetch announcement statistics');
  }
}

/**
 * Vérifie si un utilisateur a lu une annonce
 */
export async function hasUserReadAnnouncement(
  userId: string,
  announcementId: string
): Promise<boolean> {
  try {
    const result = await db
      .select()
      .from(announcementReads)
      .where(
        and(
          eq(announcementReads.userId, userId),
          eq(announcementReads.announcementId, announcementId)
        )
      )
      .limit(1);

    return result.length > 0;
  } catch (error) {
    console.error('Error checking if user read announcement:', error);
    throw new Error('Failed to check read status');
  }
}

/**
 * Récupère les lectures d'une annonce
 */
export async function getAnnouncementReads(
  announcementId: string
): Promise<AnnouncementRead[]> {
  try {
    const result = await db
      .select()
      .from(announcementReads)
      .where(eq(announcementReads.announcementId, announcementId))
      .orderBy(desc(announcementReads.readAt));

    return result;
  } catch (error) {
    console.error('Error getting announcement reads:', error);
    throw new Error('Failed to fetch announcement reads');
  }
}

/**
 * Récupère les annonces lues par un utilisateur
 */
export async function getUserReadAnnouncements(
  userId: string
): Promise<Announcement[]> {
  try {
    const result = await db
      .select({
        id: announcements.id,
        authorId: announcements.authorId,
        title: announcements.title,
        content: announcements.content,
        type: announcements.type,
        images: announcements.images,
        video: announcements.video,
        isActive: announcements.isActive,
        isPinned: announcements.isPinned,
        isDeleted: announcements.isDeleted,
        createdAt: announcements.createdAt,
        updatedAt: announcements.updatedAt,
      })
      .from(announcementReads)
      .innerJoin(
        announcements,
        eq(announcementReads.announcementId, announcements.id)
      )
      .where(
        and(eq(announcementReads.userId, userId), eq(announcements.isDeleted, false))
      )
      .orderBy(desc(announcementReads.readAt));

    return result;
  } catch (error) {
    console.error('Error getting user read announcements:', error);
    throw new Error('Failed to fetch user read announcements');
  }
}

// ============================================================================
// MUTATIONS - Écriture des données
// ============================================================================

/**
 * Crée une nouvelle annonce
 */
export async function createAnnouncement(
  announcementData: NewAnnouncement
): Promise<Announcement> {
  try {
    // Validation des données requises
    if (!announcementData.authorId || !announcementData.title || !announcementData.content) {
      throw new Error('authorId, title and content are required');
    }

    // Vérification que l'auteur existe
    const author = await db
      .select()
      .from(users)
      .where(eq(users.id, announcementData.authorId))
      .limit(1);

    if (author.length === 0) {
      throw new Error('Author not found');
    }

    const result = await db
      .insert(announcements)
      .values({
        ...announcementData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Error creating announcement:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to create announcement');
  }
}

/**
 * Met à jour une annonce
 */
export async function updateAnnouncement(
  id: string,
  announcementData: Partial<NewAnnouncement>
): Promise<Announcement> {
  try {
    // Vérification que l'annonce existe
    const existingAnnouncement = await getAnnouncementById(id);
    if (!existingAnnouncement) {
      throw new Error('Announcement not found');
    }

    const result = await db
      .update(announcements)
      .set({
        ...announcementData,
        updatedAt: new Date(),
      })
      .where(eq(announcements.id, id))
      .returning();

    return result[0];
  } catch (error) {
    console.error('Error updating announcement:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to update announcement');
  }
}

/**
 * Supprime une annonce (soft delete)
 */
export async function deleteAnnouncement(id: string): Promise<Announcement> {
  try {
    const result = await db
      .update(announcements)
      .set({
        isDeleted: true,
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(announcements.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error('Announcement not found');
    }

    // Suppression des lectures associées
    await db
      .delete(announcementReads)
      .where(eq(announcementReads.announcementId, id));

    return result[0];
  } catch (error) {
    console.error('Error deleting announcement:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to delete announcement');
  }
}

/**
 * Restaure une annonce supprimée
 */
export async function restoreAnnouncement(id: string): Promise<Announcement> {
  try {
    const result = await db
      .update(announcements)
      .set({
        isDeleted: false,
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(announcements.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error('Announcement not found');
    }

    return result[0];
  } catch (error) {
    console.error('Error restoring announcement:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to restore announcement');
  }
}

/**
 * Marque une annonce comme lue par un utilisateur
 */
export async function markAnnouncementAsRead(
  userId: string,
  announcementId: string
): Promise<AnnouncementRead> {
  try {
    // Vérification que l'annonce existe
    const announcement = await getAnnouncementById(announcementId);
    if (!announcement) {
      throw new Error('Announcement not found');
    }

    // Vérification que l'utilisateur n'a pas déjà lu l'annonce
    const alreadyRead = await hasUserReadAnnouncement(userId, announcementId);
    if (alreadyRead) {
      throw new Error('Announcement already marked as read');
    }

    const result = await db
      .insert(announcementReads)
      .values({
        announcementId,
        userId,
        readAt: new Date(),
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Error marking announcement as read:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to mark announcement as read');
  }
}

/**
 * Marque plusieurs annonces comme lues
 */
export async function bulkMarkAnnouncementsAsRead(
  userId: string,
  announcementIds: string[]
): Promise<number> {
  try {
    // Filtrer les annonces non lues
    const unreadAnnouncements = [];
    for (const announcementId of announcementIds) {
      const alreadyRead = await hasUserReadAnnouncement(userId, announcementId);
      if (!alreadyRead) {
        unreadAnnouncements.push({
          announcementId,
          userId,
          readAt: new Date(),
        });
      }
    }

    if (unreadAnnouncements.length === 0) {
      return 0;
    }

    const result = await db
      .insert(announcementReads)
      .values(unreadAnnouncements)
      .onConflictDoNothing();

    return unreadAnnouncements.length;
  } catch (error) {
    console.error('Error bulk marking announcements as read:', error);
    throw new Error('Failed to bulk mark announcements as read');
  }
}

/**
 * Compte le nombre d'annonces non lues pour un utilisateur
 */
export async function countUnreadAnnouncements(userId: string): Promise<number> {
  try {
    const result = await db
      .select({ count: count() })
      .from(announcements)
      .leftJoin(
        announcementReads,
        and(
          eq(announcementReads.announcementId, announcements.id),
          eq(announcementReads.userId, userId)
        )
      )
      .where(
        and(
          eq(announcements.isActive, true),
          eq(announcements.isDeleted, false),
          isNull(announcementReads.id)
        )
      );

    return result[0]?.count ?? 0;
  } catch (error) {
    console.error('Error counting unread announcements:', error);
    throw new Error('Failed to count unread announcements');
  }
}

// ============================================================================
// UTILITAIRES
// ============================================================================

/**
 * Construit les conditions WHERE pour les requêtes announcements
 */
function buildAnnouncementWhereConditions(
  filters: AnnouncementFilters,
  options: QueryOptions = {}
) {
  const conditions = [];

  // Filtres de base
  if (!options.includeDeleted) {
    conditions.push(eq(announcements.isDeleted, false));
  }
  if (!options.includeInactive) {
    conditions.push(eq(announcements.isActive, true));
  }

  // Filtres spécifiques
  if (filters.authorId) {
    conditions.push(eq(announcements.authorId, filters.authorId));
  }
  if (filters.title) {
    conditions.push(ilike(announcements.title, `%${filters.title}%`));
  }
  if (filters.content) {
    conditions.push(ilike(announcements.content, `%${filters.content}%`));
  }
  if (filters.type && filters.type.length > 0) {
    conditions.push(inArray(announcements.type, filters.type));
  }
  if (typeof filters.isPinned === 'boolean') {
    conditions.push(eq(announcements.isPinned, filters.isPinned));
  }

  // Filtres de date
  if (filters.createdFrom) {
    conditions.push(gte(announcements.createdAt, new Date(filters.createdFrom)));
  }
  if (filters.createdTo) {
    conditions.push(lte(announcements.createdAt, new Date(filters.createdTo)));
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}
