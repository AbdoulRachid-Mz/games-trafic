"use server";

import {
  interactions,
  type Interaction,
  type NewInteraction,
  type InteractionWithRelations,
  users,
  posts,
  products,
  shops,
  tournaments,
  messages,
  themes,
  PaginationParams,
} from "@/database/schema";
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
  type InteractionFilters,
  type ListQuery,
  type PaginationResponse,
  type QueryOptions,
} from "@/types/api";

import { db } from "@/lib/db";

// ============================================================================
// QUERIES - Lecture des données
// ============================================================================

/**
 * Récupère une interaction par son ID avec relations optionnelles
 */
export async function getInteractionById(
  id: string,
  options?: { populate?: string[] }
): Promise<Interaction | null> {
  try {
    if (options?.populate && options.populate.length > 0) {
      const query = db.query.interactions.findFirst({
        where: (interactions, { eq }) => eq(interactions.id, id),
        with: {
          user: options.populate.includes("user") ? true : undefined,
          post: options.populate.includes("post") ? true : undefined,
          product: options.populate.includes("product") ? true : undefined,
          shop: options.populate.includes("shop") ? true : undefined,
          tournament: options.populate.includes("tournament")
            ? true
            : undefined,
          message: options.populate.includes("message") ? true : undefined,
          theme: options.populate.includes("theme") ? true : undefined,
        },
      });

      return (await query) ?? null;
    }

    const result = await db
      .select()
      .from(interactions)
      .where(eq(interactions.id, id))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error("Error getting interaction by ID:", error);
    throw new Error("Failed to fetch interaction");
  }
}

/**
 * Vérifie si une interaction existe déjà
 */
export async function checkInteractionExists(
  userId: string,
  entityId: string,
  entityType: string,
  type: string
): Promise<boolean> {
  try {
    const result = await db
      .select({ count: count() })
      .from(interactions)
      .where(
        and(
          eq(interactions.userId, userId),
          eq(interactions.entityId, entityId),
          eq(interactions.entityType, entityType as any),
          eq(
            interactions.type,
            type as "LIKE" | "FOLLOW" | "BOOKMARK" | "VIEW"
          ),
          eq(interactions.isDeleted, false)
        )
      )
      .limit(1);

    return (result[0]?.count ?? 0) > 0;
  } catch (error) {
    console.error("Error checking interaction existence:", error);
    throw new Error("Failed to check interaction");
  }
}

/**
 * Liste les interactions avec pagination, filtres et options
 */
export async function getInteractions(
  query: ListQuery<InteractionFilters> = {}
): Promise<PaginationResponse<Interaction>> {
  try {
    const {
      pagination = { page: 1, limit: 50 },
      filters = {},
      options = {},
    } = query;

    const offset = (pagination.page - 1) * pagination.limit;

    // Construction des conditions WHERE
    const whereConditions = buildInteractionWhereConditions(filters, options);

    // Query Data using db.query to include relations
    const dataQuery = db.query.interactions.findMany({
      where: whereConditions,
      limit: pagination.limit,
      offset: offset,
      orderBy: (interactions, { desc, asc }) => [
        options.sortBy
          ? options.sortOrder === "asc"
            ? asc((interactions as any)[options.sortBy])
            : desc((interactions as any)[options.sortBy])
          : desc(interactions.createdAt),
      ],
      with: {
        user: true, // Need user for Admin Table
        // Add other relations if needed
      },
    });

    // Requête pour le count total
    const countQuery = db
      .select({ count: count() })
      .from(interactions)
      .where(whereConditions);

    const [interactionsData, totalResult] = await Promise.all([
      dataQuery,
      countQuery,
    ]);

    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / pagination.limit);

    return {
      data: interactionsData,
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
    console.error("Error getting interactions:", error);
    throw new Error("Failed to fetch interactions");
  }
}

/**
 * Récupère les interactions d'un utilisateur spécifique
 */
export async function getUserInteractions(
  userId: string,
  filters?: InteractionFilters,
  options?: QueryOptions
): Promise<Interaction[]> {
  try {
    const whereConditions = buildInteractionWhereConditions(
      filters || {},
      options || {}
    );
    const userCondition = eq(interactions.userId, userId);

    const finalWhere = whereConditions
      ? and(whereConditions, userCondition)
      : userCondition;

    const query = db.select().from(interactions).where(finalWhere);

    if (options?.sortBy) {
      const sortField = options.sortBy as keyof Interaction;
      const sortOrder = options.sortOrder === "desc" ? desc : asc;
      query.orderBy(sortOrder(interactions[sortField]));
    } else {
      query.orderBy(desc(interactions.createdAt));
    }

    return await query;
  } catch (error) {
    console.error("Error getting user interactions:", error);
    throw new Error("Failed to fetch user interactions");
  }
}

/**
 * Récupère les interactions sur une entité spécifique
 */
export async function getEntityInteractions(
  entityId: string,
  entityType: string,
  filters?: InteractionFilters,
  options?: QueryOptions
): Promise<Interaction[]> {
  try {
    const whereConditions = buildInteractionWhereConditions(
      filters || {},
      options || {}
    );
    const entityCondition = and(
      eq(interactions.entityId, entityId),
      eq(
        interactions.entityType,
        entityType as
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
          | "MATCH"
      )
    );

    const finalWhere = whereConditions
      ? and(whereConditions, entityCondition)
      : entityCondition;

    const query = db.select().from(interactions).where(finalWhere);

    if (options?.sortBy) {
      const sortField = options.sortBy as keyof Interaction;
      const sortOrder = options.sortOrder === "desc" ? desc : asc;
      query.orderBy(sortOrder(interactions[sortField]));
    } else {
      query.orderBy(desc(interactions.createdAt));
    }

    return await query;
  } catch (error) {
    console.error("Error getting entity interactions:", error);
    throw new Error("Failed to fetch entity interactions");
  }
}

/**
 * Récupère les interactions sur une entité spécifique avec relations et pagination
 */
export async function getEntityInteractionsWithRelations(
  entityId: string,
  entityType: string,
  filters?: InteractionFilters,
  pagination?: { page: number; limit: number },
  options?: QueryOptions
): Promise<{
  data: InteractionWithRelations[];
  pagination: PaginationParams;
}> {
  try {
    const whereConditions = buildInteractionWhereConditions(
      filters || {},
      options || {}
    );
    const entityCondition = and(
      eq(interactions.entityId, entityId),
      eq(
        interactions.entityType,
        entityType as
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
          | "GAME"
          | "GAME_ITEM"
          | "ANNOUNCEMENT"
          | "SERVICE"
          | "GUIDE"
          | "COMMENT"
          | "MATCH"
      )
    );

    const finalWhere = whereConditions
      ? and(whereConditions, entityCondition)
      : entityCondition;

    // Build orderBy array first
    const orderByClause = options?.sortBy
      ? options.sortOrder === "asc"
        ? asc((interactions as any)[options.sortBy])
        : desc((interactions as any)[options.sortBy])
      : desc(interactions.createdAt);

    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 50;
    const offset = (page - 1) * limit;

    // Query for total count
    const countQuery = db
      .select({ count: count() })
      .from(interactions)
      .where(finalWhere);

    // Query for paginated data
    const dataQuery = db.query.interactions.findMany({
      where: finalWhere,
      with: {
        user: true,
        post: true,
        product: true,
        message: true,
        tournament: true,
        shop: true,
        theme: true,
        game: true,
        gameItem: true,
      },
      orderBy: [orderByClause],
      limit,
      offset,
    });

    const [totalResult, raw] = await Promise.all([countQuery, dataQuery]);

    const total = totalResult[0]?.count ?? 0;
    const totalPages = Math.ceil(total / limit);

    const data = raw.map(i => ({
      ...i,
      post: i.post ?? undefined,
      product: i.product ?? undefined,
      message: i.message ?? undefined,
      tournament: i.tournament ?? undefined,
      shop: i.shop ?? undefined,
      theme: i.theme ?? undefined,
      game: i.game ?? undefined,
      gameItem: i.gameItem ?? undefined,
    }));

    return {
      data,
      pagination: {
        page,
        limit,
        total: String(total),
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  } catch (error) {
    console.error("Error getting entity interactions with relations:", error);
    throw new Error("Failed to fetch entity interactions");
  }
}

/**
 * Compte les interactions par type pour une entité
 */
export async function countEntityInteractions(
  entityId: string,
  entityType: string
): Promise<Record<string, number>> {
  try {
    const result = await db
      .select({
        type: interactions.type,
        count: count(),
      })
      .from(interactions)
      .where(
        and(
          eq(interactions.entityId, entityId),
          eq(
            interactions.entityType,
            entityType as
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
              | "MATCH"
          ),
          eq(interactions.isDeleted, false)
        )
      )
      .groupBy(interactions.type);

    return result.reduce((acc, row) => {
      acc[row.type] = row.count;
      return acc;
    }, {} as Record<string, number>);
  } catch (error) {
    console.error("Error counting entity interactions:", error);
    throw new Error("Failed to count interactions");
  }
}

/**
 * Récupère les statistiques des interactions
 */
export async function getInteractionStats(filters?: InteractionFilters) {
  try {
    const whereConditions = buildInteractionWhereConditions(filters || {});

    const [
      totalResult,
      likesResult,
      followsResult,
      bookmarksResult,
      viewsResult,
    ] = await Promise.all([
      db.select({ count: count() }).from(interactions).where(whereConditions),
      db
        .select({ count: count() })
        .from(interactions)
        .where(and(whereConditions, eq(interactions.type, "LIKE"))),
      db
        .select({ count: count() })
        .from(interactions)
        .where(and(whereConditions, eq(interactions.type, "FOLLOW"))),
      db
        .select({ count: count() })
        .from(interactions)
        .where(and(whereConditions, eq(interactions.type, "BOOKMARK"))),
      db
        .select({ count: count() })
        .from(interactions)
        .where(and(whereConditions, eq(interactions.type, "VIEW"))),
    ]);

    return {
      total: totalResult[0]?.count ?? 0,
      likes: likesResult[0]?.count ?? 0,
      follows: followsResult[0]?.count ?? 0,
      bookmarks: bookmarksResult[0]?.count ?? 0,
      views: viewsResult[0]?.count ?? 0,
    };
  } catch (error) {
    console.error("Error getting interaction stats:", error);
    throw new Error("Failed to fetch interaction statistics");
  }
}

// ============================================================================
// MUTATIONS - Écriture des données
// ============================================================================

/**
 * Crée une nouvelle interaction
 */
export async function createInteraction(
  interactionData: NewInteraction
): Promise<Interaction> {
  try {
    // Validation des données requises
    if (
      !interactionData.userId ||
      !interactionData.entityId ||
      !interactionData.entityType ||
      !interactionData.type
    ) {
      throw new Error("userId, entityId, entityType and type are required");
    }

    // Vérification de l'existence de l'utilisateur
    const userExists = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.id, interactionData.userId))
      .limit(1);

    if ((userExists[0]?.count ?? 0) === 0) {
      throw new Error("User not found");
    }

    // Vérification si l'interaction existe déjà
    const exists = await checkInteractionExists(
      interactionData.userId,
      interactionData.entityId,
      interactionData.entityType,
      interactionData.type
    );

    if (exists) {
      throw new Error("Interaction already exists");
    }

    const result = await db
      .insert(interactions)
      .values({
        ...interactionData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error("Error creating interaction:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to create interaction");
  }
}

/**
 * Supprime une interaction (soft delete)
 */
export async function deleteInteraction(id: string): Promise<Interaction> {
  try {
    const result = await db
      .update(interactions)
      .set({
        isDeleted: true,
        updatedAt: new Date(),
      })
      .where(eq(interactions.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error("Interaction not found");
    }

    return result[0];
  } catch (error) {
    console.error("Error deleting interaction:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to delete interaction");
  }
}

/**
 * Supprime une interaction par ses critères
 */
export async function deleteInteractionByCriteria(
  userId: string,
  entityId: string,
  entityType: string,
  type: string
): Promise<Interaction | null> {
  try {
    const result = await db
      .update(interactions)
      .set({
        isDeleted: true,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(interactions.userId, userId),
          eq(interactions.entityId, entityId),
          eq(interactions.entityType, entityType as any),
          eq(
            interactions.type,
            type as "LIKE" | "FOLLOW" | "BOOKMARK" | "VIEW"
          ),
          eq(interactions.isDeleted, false)
        )
      )
      .returning();

    return result[0] || null;
  } catch (error) {
    console.error("Error deleting interaction by criteria:", error);
    throw new Error("Failed to delete interaction");
  }
}

/**
 * Restaure une interaction supprimée
 */
export async function restoreInteraction(id: string): Promise<Interaction> {
  try {
    const result = await db
      .update(interactions)
      .set({
        isDeleted: false,
        updatedAt: new Date(),
      })
      .where(eq(interactions.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error("Interaction not found");
    }

    return result[0];
  } catch (error) {
    console.error("Error restoring interaction:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to restore interaction");
  }
}

/**
 * Basculer une interaction (créer si n'existe pas, supprimer si existe)
 */
export async function toggleInteraction(
  interactionData: NewInteraction
): Promise<{ interaction: Interaction | null; action: "created" | "deleted" }> {
  try {
    // Vérifier si l'interaction existe
    const existingInteraction = await db
      .select()
      .from(interactions)
      .where(
        and(
          eq(interactions.userId, interactionData.userId),
          eq(interactions.entityId, interactionData.entityId),
          eq(interactions.entityType, interactionData.entityType),
          eq(interactions.type, interactionData.type),
          eq(interactions.isDeleted, false)
        )
      )
      .limit(1);

    if (existingInteraction.length > 0) {
      // Supprimer l'interaction existante
      const deleted = await deleteInteraction(existingInteraction[0].id);
      return { interaction: deleted, action: "deleted" };
    } else {
      // Créer une nouvelle interaction
      const created = await createInteraction(interactionData);
      return { interaction: created, action: "created" };
    }
  } catch (error) {
    console.error("Error toggling interaction:", error);
    throw new Error("Failed to toggle interaction");
  }
}

// ============================================================================
// UTILITAIRES
// ============================================================================

/**
 * Construit les conditions WHERE pour les requêtes interactions
 */
function buildInteractionWhereConditions(
  filters: InteractionFilters,
  options: QueryOptions = {}
) {
  const conditions = [];

  // Base filters
  if (!options.includeDeleted) {
    conditions.push(eq(interactions.isDeleted, false));
  }

  // Specific filters
  if (filters.userId) {
    conditions.push(eq(interactions.userId, filters.userId));
  }

  if (filters.entityId) {
    conditions.push(eq(interactions.entityId, filters.entityId));
  }

  if (filters.entityType) {
    // entityType est une enum, on doit caster en any pour satisfaire Drizzle
    conditions.push(eq(interactions.entityType, filters.entityType as any));
  }

  if (filters.types && filters.types.length > 0) {
    conditions.push(inArray(interactions.type, filters.types));
  }

  if (filters.postId) {
    conditions.push(eq(interactions.postId, filters.postId));
  }

  if (filters.productId) {
    conditions.push(eq(interactions.productId, filters.productId));
  }

  if (filters.shopId) {
    conditions.push(eq(interactions.shopId, filters.shopId));
  }

  if (filters.tournamentId) {
    conditions.push(eq(interactions.tournamentId, filters.tournamentId));
  }

  if (filters.messageId) {
    conditions.push(eq(interactions.messageId, filters.messageId));
  }

  if (filters.themeId) {
    conditions.push(eq(interactions.themeId, filters.themeId));
  }

  // Filtres de date
  if (filters.createdFrom) {
    conditions.push(gte(interactions.createdAt, new Date(filters.createdFrom)));
  }
  if (filters.createdTo) {
    conditions.push(lte(interactions.createdAt, new Date(filters.createdTo)));
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}
