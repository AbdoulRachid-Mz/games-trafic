"use server";

import { medias, type Media, type NewMedia, users, EntityType } from "@/database/schema";
import {
  eq,
  and,
  or,
  like,
  ilike,
  inArray,
  between,
  desc,
  asc,
  sql,
  count,
  gt,
  lt,
  gte,
  lte,
  isNull,
  isNotNull,
} from "drizzle-orm";
import {
  MediaFilters,
  type ListQuery,
  type PaginationResponse,
  type QueryOptions,
} from "@/types/api";

import { db } from "@/lib/db";

// ============================================================================
// QUERIES - Lecture des données
// ============================================================================

/**
 * Récupère un média par son ID
 */
export async function getMediaById(
  id: string,
  options?: { populate?: string[] }
): Promise<Media | null> {
  try {
    if (options?.populate && options.populate.length > 0) {
      const query = db.query.medias.findFirst({
        where: (medias, { eq }) => eq(medias.id, id),
        with: {
          owner: options.populate.includes("owner") ? true : undefined,
        },
      });

      return (await query) ?? null;
    }

    const result = await db
      .select()
      .from(medias)
      .where(eq(medias.id, id))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error("Error getting media by ID:", error);
    throw new Error("Failed to fetch media");
  }
}

/**
 * Liste les médias avec pagination, filtres et options
 */
export async function getMedias(
  query: ListQuery<MediaFilters> = {}
): Promise<PaginationResponse<Media>> {
  try {
    const {
      pagination = { page: 1, limit: 50 },
      filters = {},
      options = {},
    } = query;

    const offset = (pagination.page - 1) * pagination.limit;

    // Construction des conditions WHERE
    const whereConditions = buildMediaWhereConditions(filters, options);

    // Requête pour les données
    const mediasQuery = db
      .select()
      .from(medias)
      .where(whereConditions)
      .limit(pagination.limit)
      .offset(offset);

    // Application du tri
    if (options.sortBy) {
      const sortField = options.sortBy as keyof Media;
      const sortOrder = options.sortOrder === "desc" ? desc : asc;
      mediasQuery.orderBy(sortOrder(medias[sortField]));
    } else {
      mediasQuery.orderBy(desc(medias.createdAt));
    }

    // Requête pour le count total
    const countQuery = db
      .select({ count: count() })
      .from(medias)
      .where(whereConditions);

    const [mediasData, totalResult] = await Promise.all([
      mediasQuery,
      countQuery,
    ]);

    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / pagination.limit);

    return {
      data: mediasData,
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
    console.error("Error getting medias:", error);
    throw new Error("Failed to fetch medias");
  }
}

/**
 * Récupère les médias d'un utilisateur spécifique
 */
export async function getUserMedias(
  userId: string,
  filters?: MediaFilters,
  options?: QueryOptions
): Promise<Media[]> {
  try {
    const whereConditions = buildMediaWhereConditions(
      filters || {},
      options || {}
    );
    const userCondition = eq(medias.ownerId, userId);

    const finalWhere = whereConditions
      ? and(whereConditions, userCondition)
      : userCondition;

    const query = db.select().from(medias).where(finalWhere);

    if (options?.sortBy) {
      const sortField = options.sortBy as keyof Media;
      const sortOrder = options.sortOrder === "desc" ? desc : asc;
      query.orderBy(sortOrder(medias[sortField]));
    } else {
      query.orderBy(desc(medias.createdAt));
    }

    return await query;
  } catch (error) {
    console.error("Error getting user medias:", error);
    throw new Error("Failed to fetch user medias");
  }
}

/**
 * Récupère les médias liés à une entité spécifique
 */
export async function getEntityMedias(
  entityId: string,
  entityType:
    | "PRODUCT"
    | "POST"
    | "SHOP"
    | "TOURNAMENT"
    | "USER"
    | "BLOG"
    | "MESSAGE"
    | "TEAM"
    | "THEME"
    | "NEWS"
    | "GROUP"
    | "ANNOUNCEMENT"
    | "SERVICE"
    | "GUIDE"
    | "COMMENT"
    | "MATCH",
  filters?: MediaFilters,
  options?: QueryOptions
): Promise<Media[]> {
  try {
    const whereConditions = buildMediaWhereConditions(
      filters || {},
      options || {}
    );
    const entityCondition = and(
      eq(medias.entityId, entityId),
      eq(medias.entityType, entityType)
    );

    const finalWhere = whereConditions
      ? and(whereConditions, entityCondition)
      : entityCondition;

    const query = db.select().from(medias).where(finalWhere);

    if (options?.sortBy) {
      const sortField = options.sortBy as keyof Media;
      const sortOrder = options.sortOrder === "desc" ? desc : asc;
      query.orderBy(sortOrder(medias[sortField]));
    } else {
      query.orderBy(desc(medias.createdAt));
    }

    return await query;
  } catch (error) {
    console.error("Error getting entity medias:", error);
    throw new Error("Failed to fetch entity medias");
  }
}

/**
 * Compte les médias par type pour une entité
 */
export async function countEntityMedias(
  entityId: string,
  entityType: string
): Promise<Record<string, number>> {
  try {
    const result = await db
      .select({
        type: medias.type,
        count: count(),
      })
      .from(medias)
      .where(
        and(
          eq(medias.entityId, entityId),
          eq(medias.entityType, entityType as EntityType),
          eq(medias.isDeleted, false)
        )
      )
      .groupBy(medias.type);

    return result.reduce((acc, row) => {
      acc[row.type] = row.count;
      return acc;
    }, {} as Record<string, number>);
  } catch (error) {
    console.error("Error counting entity medias:", error);
    throw new Error("Failed to count medias");
  }
}

/**
 * Récupère les statistiques des médias
 */
export async function getMediaStats(filters?: MediaFilters) {
  try {
    const whereConditions = buildMediaWhereConditions(filters || {});

    const [
      totalResult,
      imageResult,
      videoResult,
      documentResult,
      audioResult,
      otherResult,
    ] = await Promise.all([
      db.select({ count: count() }).from(medias).where(whereConditions),
      db
        .select({ count: count() })
        .from(medias)
        .where(and(whereConditions, eq(medias.type, "image"))),
      db
        .select({ count: count() })
        .from(medias)
        .where(and(whereConditions, eq(medias.type, "video"))),
      db
        .select({ count: count() })
        .from(medias)
        .where(and(whereConditions, eq(medias.type, "document"))),
      db
        .select({ count: count() })
        .from(medias)
        .where(and(whereConditions, eq(medias.type, "audio"))),
      db
        .select({ count: count() })
        .from(medias)
        .where(and(whereConditions, eq(medias.type, "other"))),
    ]);

    return {
      total: totalResult[0]?.count ?? 0,
      images: imageResult[0]?.count ?? 0,
      videos: videoResult[0]?.count ?? 0,
      documents: documentResult[0]?.count ?? 0,
      audio: audioResult[0]?.count ?? 0,
      other: otherResult[0]?.count ?? 0,
    };
  } catch (error) {
    console.error("Error getting media stats:", error);
    throw new Error("Failed to fetch media statistics");
  }
}

// ============================================================================
// MUTATIONS - Écriture des données
// ============================================================================

/**
 * Crée un nouveau média
 */
export async function createMedia(mediaData: NewMedia): Promise<Media> {
  try {
    // Validation des données requises
    if (
      !mediaData.ownerId ||
      !mediaData.fileName ||
      !mediaData.url ||
      !mediaData.type
    ) {
      throw new Error("ownerId, fileName, url and type are required");
    }

    // Vérification de l'existence de l'utilisateur
    const userExists = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.id, mediaData.ownerId))
      .limit(1);

    if ((userExists[0]?.count ?? 0) === 0) {
      throw new Error("User not found");
    }

    const result = await db
      .insert(medias)
      .values({
        ...mediaData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error("Error creating media:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to create media");
  }
}

/**
 * Supprime un média (soft delete)
 */
export async function deleteMedia(id: string): Promise<Media> {
  try {
    const result = await db
      .update(medias)
      .set({
        isDeleted: true,
        status: "DELETED",
        updatedAt: new Date(),
      })
      .where(eq(medias.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error("Media not found");
    }

    return result[0];
  } catch (error) {
    console.error("Error deleting media:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to delete media");
  }
}

/**
 * Restaure un média supprimé
 */
export async function restoreMedia(id: string): Promise<Media> {
  try {
    const result = await db
      .update(medias)
      .set({
        isDeleted: false,
        status: "ACTIVE",
        updatedAt: new Date(),
      })
      .where(eq(medias.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error("Media not found");
    }

    return result[0];
  } catch (error) {
    console.error("Error restoring media:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to restore media");
  }
}

/**
 * Met à jour les métadonnées d'un média
 */
export async function updateMediaMetadata(
  id: string,
  metadata: Record<string, any>
): Promise<Media> {
  try {
    const result = await db
      .update(medias)
      .set({
        metadata: sql`metadata || ${JSON.stringify(metadata)}`,
        updatedAt: new Date(),
      })
      .where(eq(medias.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error("Media not found");
    }

    return result[0];
  } catch (error) {
    console.error("Error updating media metadata:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to update media metadata");
  }
}

/**
 * Change la privacy d'un média
 */
export async function updateMediaPrivacy(
  id: string,
  privacy: "PUBLIC" | "PRIVATE" | "FRIENDS"
): Promise<Media> {
  try {
    const result = await db
      .update(medias)
      .set({
        privacy,
        updatedAt: new Date(),
      })
      .where(eq(medias.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error("Media not found");
    }

    return result[0];
  } catch (error) {
    console.error("Error updating media privacy:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to update media privacy");
  }
}

// ============================================================================
// UTILITAIRES
// ============================================================================

/**
 * Construit les conditions WHERE pour les requêtes médias
 */
function buildMediaWhereConditions(filters: MediaFilters, options: QueryOptions = {}) {
  const conditions = [];

  // Filtres de base
  if (!options.includeDeleted) {
    conditions.push(eq(medias.isDeleted, false));
  }

  // Filtres spécifiques
  if (filters.id) {
    conditions.push(eq(medias.id, filters.id));
  }

  if (filters.ownerId) {
    conditions.push(eq(medias.ownerId, filters.ownerId));
  }

  if (filters.entityId) {
    conditions.push(eq(medias.entityId, filters.entityId));
  }

  if (filters.entityType && filters.entityType.length > 0) {
    conditions.push(inArray(medias.entityType, filters.entityType));
  }

  if (filters.type && filters.type.length > 0) {
    conditions.push(inArray(medias.type, filters.type));
  }

  if (filters.status && filters.status.length > 0) {
    conditions.push(inArray(medias.status, filters.status));
  }

  if (filters.privacy && filters.privacy.length > 0) {
    conditions.push(inArray(medias.privacy, filters.privacy));
  }

  if (filters.fileName) {
    conditions.push(ilike(medias.fileName, `%${filters.fileName}%`));
  }

  if (filters.originalName) {
    conditions.push(ilike(medias.originalName, `%${filters.originalName}%`));
  }

  if (filters.mimeType) {
    conditions.push(eq(medias.mimeType, filters.mimeType));
  }

  // Filtres de date
  if (filters.createdFrom) {
    conditions.push(gte(medias.createdAt, new Date(filters.createdFrom)));
  }
  if (filters.createdTo) {
    conditions.push(lte(medias.createdAt, new Date(filters.createdTo)));
  }

  // Filtres de taille
  if (filters.sizeMin) {
    conditions.push(gte(medias.size, filters.sizeMin));
  }
  if (filters.sizeMax) {
    conditions.push(lte(medias.size, filters.sizeMax));
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}
