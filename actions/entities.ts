// @/actions/entities.ts
"use server";

import { db } from "@/lib/db";
import * as schema from "@/database/schema";
import { PgTable } from "drizzle-orm/pg-core";
import {
  and,
  or,
  eq,
  ne,
  gte,
  lte,
  like,
  desc,
  asc,
  sql,
  count,
  isNull,
  isNotNull,
} from "drizzle-orm";
import { PaginationResponse, EntityQueryParams, TableName, entityFetchers } from "@/types/api";

/**
 * Fonction utilitaire pour vérifier si un export est une table Drizzle
 */
function isTable(val: any): val is PgTable<any> {
  return !!val && typeof val === "object" && ("_" in val || "pgConfig" in val);
}


// Fonction utilitaire pour construire les conditions WHERE
function buildWhereConditions(table: any, filters: EntityQueryParams) {
  const conditions: any[] = [];

  // Filtres d'identité (Propriétaire/Auteur)
  if (filters.userId && table.userId) {
    conditions.push(eq(table.userId, filters.userId));
  }
  if (filters.ownerId && table.ownerId) {
    conditions.push(eq(table.ownerId, filters.ownerId));
  }
  if (filters.authorId && table.authorId) {
    conditions.push(eq(table.authorId, filters.authorId));
  }
  if (filters.organizerId && table.organizerId) {
    conditions.push(eq(table.organizerId, filters.organizerId));
  }
  if (filters.creatorId && table.creatorId) {
    conditions.push(eq(table.creatorId, filters.creatorId));
  }
  if (filters.buyerId && table.buyerId) {
    conditions.push(eq(table.buyerId, filters.buyerId));
  }

  // Filtres de base
  if (filters.id && table.id) {
    conditions.push(eq(table.id, filters.id));
  }
  if (filters.slug && table.slug) {
    conditions.push(eq(table.slug, filters.slug));
  }
  if (filters.editionSlug && table.editionSlug) {
    conditions.push(eq(table.editionSlug, filters.editionSlug));
  }
  if (filters.search && table.name) {
    conditions.push(like(table.name, `%${filters.search}%`));
  }

  if (filters.isActive !== undefined && table.isActive) {
    conditions.push(eq(table.isActive, filters.isActive));
  }

  if (filters.isDeleted !== undefined && table.isDeleted) {
    conditions.push(eq(table.isDeleted, filters.isDeleted));
  } else if (table.isDeleted) {
    // Par défaut, exclure les éléments supprimés
    conditions.push(eq(table.isDeleted, false));
  }

  // Filtres de date
  if (filters.startDate && table.createdAt) {
    conditions.push(gte(table.createdAt, new Date(filters.startDate)));
  }

  if (filters.endDate && table.createdAt) {
    conditions.push(lte(table.createdAt, new Date(filters.endDate)));
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

// Fonction utilitaire pour construire l'ordre de tri
function buildOrderBy(
  table: any,
  sortBy?: string,
  sortOrder: "asc" | "desc" = "desc",
) {
  if (!sortBy || !table[sortBy]) {
    // Par défaut, trier par createdAt si disponible
    if (table.createdAt) {
      return sortOrder === "asc" ? asc(table.createdAt) : desc(table.createdAt);
    }
    return undefined;
  }

  return sortOrder === "asc" ? asc(table[sortBy]) : desc(table[sortBy]);
}

/**
 * Fonction universelle pour récupérer des entités avec pagination et filtres
 * @param tableName - Nom de la table dans le schéma
 * @param params - Paramètres de requête (pagination, filtres, tri)
 * @returns Réponse paginée avec les données
 */
export async function getEntities<T = any>(
  tableName: TableName,
  params: EntityQueryParams = {},
): Promise<PaginationResponse<T>> {
  try {
    // Récupérer la table du schéma
    const table = (schema as any)[tableName];

    if (!table) {
      throw new Error(`Table "${tableName}" not found in schema`);
    }

    // Paramètres de pagination
    const page = params.page || 1;
    const limit = params.limit || 20;
    const offset = params.offset || (page - 1) * limit;

    // Construire les conditions WHERE
    const whereConditions = buildWhereConditions(table, params);

    // Construire l'ordre de tri
    const orderBy = buildOrderBy(table, params.sortBy, params.sortOrder);

    // Compter le total d'éléments
    const [{ total }] = await db
      .select({ total: count() })
      .from(table)
      .where(whereConditions);

    // Récupérer les données
    let query = db.select().from(table).where(whereConditions);

    if (orderBy) {
      query = query.orderBy(orderBy) as any;
    }

    const data = await query.limit(limit).offset(offset);

    // Calculer les métadonnées de pagination
    const totalPages = Math.ceil(Number(total) / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      data: data as T[],
      pagination: {
        page,
        limit,
        total: Number(total),
        totalPages,
        hasNext,
        hasPrev,
      },
    };
  } catch (error) {
    console.error(`Error fetching entities from ${tableName}:`, error);
    throw error;
  }
}

/**
 * Fonction optimisée pour récupérer des utilisateurs
 */
export async function getUsers(params: EntityQueryParams = {}) {
  const table = schema.users;
  const conditions: any[] = [];

  // Filtres spécifiques aux utilisateurs
  if (params.email) {
    conditions.push(like(table.email, `%${params.email}%`));
  }

  if (params.username) {
    conditions.push(like(table.username, `%${params.username}%`));
  }
  if ((params as any).phoneNumber && (table as any).phoneNumber) {
    conditions.push(like((table as any).phoneNumber, `%${(params as any).phoneNumber}%`));
  }

  if (params.isVip !== undefined) {
    conditions.push(eq(table.isVip, params.isVip));
  }

  if (params.isAdmin !== undefined) {
    conditions.push(eq(table.isAdmin, params.isAdmin));
  }

  if (params.country) {
    conditions.push(eq(table.country, params.country));
  }

  // Filtres de base
  if (params.isActive !== undefined) {
    conditions.push(eq(table.isActive, params.isActive));
  }

  if (params.search) {
    conditions.push(
      or(
        like(table.fullName, `%${params.search}%`),
        like(table.username, `%${params.search}%`),
        like(table.email, `%${params.search}%`),
        ((table as any).phoneNumber ? like((table as any).phoneNumber, `%${params.search}%`) : undefined)
      )!,
    );
  }

  // Pagination
  const page = params.page || 1;
  const limit = params.limit || 20;
  const offset = (page - 1) * limit;

  // Compter le total
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const [{ total }] = await db
    .select({ total: count() })
    .from(table)
    .where(whereClause);

  // Récupérer les données
  const orderBy = buildOrderBy(table, params.sortBy, params.sortOrder);
  let query = db.select().from(table).where(whereClause);

  if (orderBy) {
    query = query.orderBy(orderBy) as any;
  }

  const data = await query.limit(limit).offset(offset);

  return {
    data,
    pagination: {
      page,
      limit,
      total: Number(total),
      totalPages: Math.ceil(Number(total) / limit),
      hasNext: page < Math.ceil(Number(total) / limit),
      hasPrev: page > 1,
    },
  };
}

/**
 * Fonction optimisée pour récupérer des wallets
 */
// @/actions/entities.ts
export async function getWallets(params: EntityQueryParams = {}) {
  const walletTable = schema.userWallets;
  const userTable = schema.users;
  const financialTable = schema.financialAccounts;
  const conditions: any[] = [];

  // Filtres spécifiques aux wallets
  if (params.userId) {
    conditions.push(eq(walletTable.userId, params.userId));
  }

  if (params.financialAccountId) {
    conditions.push(eq(walletTable.financialAccountId, params.financialAccountId));
  }

  if (params.cardNumberHash) {
    conditions.push(eq(walletTable.cardNumberHash, params.cardNumberHash));
  }

  if (params.verificationStatus) {
    conditions.push(eq(walletTable.verificationStatus, params.verificationStatus));
  }

  if (params.isActive !== undefined) {
    conditions.push(eq(walletTable.isActive, params.isActive));
  }

  if (params.isLocked !== undefined) {
    conditions.push(eq(walletTable.isLocked, params.isLocked));
  }

  if (params.search) {
    // Recherche dans les champs texte pertinents
    conditions.push(
      or(
        like(walletTable.identityDocumentType, `%${params.search}%`),
        like(walletTable.identityDocumentUrl, `%${params.search}%`)
      )!
    );
  }

  // Filtres de base
  if (params.isDeleted !== undefined) {
    conditions.push(eq(walletTable.isDeleted, params.isDeleted));
  } else {
    // Par défaut, exclure les éléments supprimés
    conditions.push(eq(walletTable.isDeleted, false));
  }

  // Pagination
  const page = params.page || 1;
  const limit = params.limit || 20;
  const offset = (page - 1) * limit;

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Compter le total
  const [{ total }] = await db
    .select({ total: count() })
    .from(walletTable)
    .where(whereClause);

  // Construire l'ordre de tri
  const orderBy = buildOrderBy(walletTable, params.sortBy, params.sortOrder);

  // Récupérer les données avec les relations
  let query = db
    .select({
      id: walletTable.id,
      userId: walletTable.userId,
      financialAccountId: walletTable.financialAccountId,
      cardNumberHash: walletTable.cardNumberHash,
      pinHash: walletTable.pinHash,
      isActive: walletTable.isActive,
      isLocked: walletTable.isLocked,
      isDeleted: walletTable.isDeleted,
      failedAttempts: walletTable.failedAttempts,
      lastFailedAttempt: walletTable.lastFailedAttempt,
      identityDocumentType: walletTable.identityDocumentType,
      identityDocumentUrl: walletTable.identityDocumentUrl,
      verificationStatus: walletTable.verificationStatus,
      verifiedAt: walletTable.verifiedAt,
      createdAt: walletTable.createdAt,
      updatedAt: walletTable.updatedAt,
      user: {
        id: userTable.id,
        email: userTable.email,
        username: userTable.username,
        fullName: userTable.fullName,
        profileImage: userTable.profileImage,
      },
      financialAccount: {
        id: financialTable.id,
        ownerUserId: financialTable.ownerUserId,
        type: financialTable.type,
        currency: financialTable.currency,
        isActive: financialTable.isActive,
        isLocked: financialTable.isLocked,
      },
    })
    .from(walletTable)
    .where(whereClause)
    .leftJoin(userTable, eq(walletTable.userId, userTable.id))
    .leftJoin(financialTable, eq(walletTable.financialAccountId, financialTable.id));

  if (orderBy) {
    query = query.orderBy(orderBy) as any;
  }

  const data = await query.limit(limit).offset(offset);

  return {
    data,
    pagination: {
      page,
      limit,
      total: Number(total),
      totalPages: Math.ceil(Number(total) / limit),
      hasNext: page < Math.ceil(Number(total) / limit),
      hasPrev: page > 1,
    },
  };
}



/**
 * Fonction optimisée pour récupérer des shops
 */
export async function getShops(params: EntityQueryParams = {}) {
  const table = schema.shops;
  const conditions: any[] = [];

  // Filtres spécifiques
  if (params.ownerId) {
    conditions.push(eq(table.ownerId, params.ownerId));
  }

  if (params.verified !== undefined) {
    conditions.push(eq(table.verified, params.verified));
  }

  if (params.featured !== undefined) {
    conditions.push(eq(table.featured, params.featured));
  }

  if (params.country) {
    conditions.push(eq(table.country, params.country));
  }

  if (params.search) {
    conditions.push(like(table.name, `%${params.search}%`));
  }

  // Filtres de base
  if (params.isActive !== undefined) {
    conditions.push(eq(table.isActive, params.isActive));
  }

  if (table.isDeleted) {
    conditions.push(eq(table.isDeleted, params.isDeleted ?? false));
  }

  // Pagination
  const page = params.page || 1;
  const limit = params.limit || 20;
  const offset = (page - 1) * limit;

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const [{ total }] = await db
    .select({ total: count() })
    .from(table)
    .where(whereClause);

  const orderBy = buildOrderBy(table, params.sortBy, params.sortOrder);
  let query = db.select().from(table).where(whereClause);

  if (orderBy) {
    query = query.orderBy(orderBy) as any;
  }

  const data = await query.limit(limit).offset(offset);

  return {
    data,
    pagination: {
      page,
      limit,
      total: Number(total),
      totalPages: Math.ceil(Number(total) / limit),
      hasNext: page < Math.ceil(Number(total) / limit),
      hasPrev: page > 1,
    },
  };
}

/**
 * Fonction optimisée pour récupérer des produits
 */
export async function getProducts(params: EntityQueryParams = {}) {
  const table = schema.products;
  const conditions: any[] = [];

  if (params.shopId) {
    conditions.push(eq(table.shopId, params.shopId));
  }

  if (params.userId) {
    conditions.push(eq(table.userId, params.userId));
  }
  if (params.excludeUserId) {
    conditions.push(ne(table.userId, params.excludeUserId));
  }

  if (params.status) {
    conditions.push(eq(table.status, params.status));
  }

  if (params.game) {
    conditions.push(like(table.game, `%${params.game}%`));
  }

  if (params.platform) {
    conditions.push(eq(table.platform, params.platform));
  }

  if (params.search) {
    conditions.push(
      or(
        like(table.name, `%${params.search}%`),
        like(table.description, `%${params.search}%`),
      )!,
    );
  }

  if (params.isActive !== undefined) {
    conditions.push(eq(table.isActive, params.isActive));
  }

  if (table.isDeleted) {
    conditions.push(eq(table.isDeleted, params.isDeleted ?? false));
  }

  const page = params.page || 1;
  const limit = params.limit || 20;
  const offset = (page - 1) * limit;

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const [{ total }] = await db
    .select({ total: count() })
    .from(table)
    .where(whereClause);

  const orderBy = buildOrderBy(table, params.sortBy, params.sortOrder);
  let query = db.select().from(table).where(whereClause);

  if (orderBy) {
    query = query.orderBy(orderBy) as any;
  }

  const data = await query.limit(limit).offset(offset);

  return {
    data,
    pagination: {
      page,
      limit,
      total: Number(total),
      totalPages: Math.ceil(Number(total) / limit),
      hasNext: page < Math.ceil(Number(total) / limit),
      hasPrev: page > 1,
    },
  };
}

/**
 * Fonction optimisée pour récupérer des tournois
 */
export async function getTournaments(params: EntityQueryParams = {}) {
  const table = schema.tournaments;
  const conditions: any[] = [];

  if (params.organizerId) {
    conditions.push(eq(table.organizerId, params.organizerId));
  }

  if (params.status) {
    conditions.push(eq(table.status, params.status));
  }

  if (params.game) {
    conditions.push(like(table.game, `%${params.game}%`));
  }

  if (params.platform) {
    conditions.push(eq(table.platform, params.platform));
  }

  if (params.search) {
    conditions.push(
      or(
        like(table.name, `%${params.search}%`),
        like(table.description, `%${params.search}%`),
      )!,
    );
  }

  if (params.isActive !== undefined) {
    conditions.push(eq(table.isActive, params.isActive));
  }

  if (table.isDeleted) {
    conditions.push(eq(table.isDeleted, params.isDeleted ?? false));
  }

  const page = params.page || 1;
  const limit = params.limit || 20;
  const offset = (page - 1) * limit;

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const [{ total }] = await db
    .select({ total: count() })
    .from(table)
    .where(whereClause);

  const orderBy = buildOrderBy(table, params.sortBy, params.sortOrder);
  let query = db.select().from(table).where(whereClause);

  if (orderBy) {
    query = query.orderBy(orderBy) as any;
  }

  const data = await query.limit(limit).offset(offset);

  return {
    data,
    pagination: {
      page,
      limit,
      total: Number(total),
      totalPages: Math.ceil(Number(total) / limit),
      hasNext: page < Math.ceil(Number(total) / limit),
      hasPrev: page > 1,
    },
  };
}

/**
 * Fonction optimisée pour récupérer des game clips
 */
export async function getGameClips(params: EntityQueryParams = {}) {
  const table = schema.gameClips;
  const conditions: any[] = [];

  if (params.userId) {
    conditions.push(eq(table.authorId, params.userId));
  }

  if (params.gameId) {
    conditions.push(eq(table.gameId, params.gameId));
  }

  if (params.search) {
    conditions.push(like(table.caption, `%${params.search}%`));
  }

  if (params.isActive !== undefined) {
    conditions.push(eq(table.isActive, params.isActive));
  }

  if (table.isDeleted) {
    conditions.push(eq(table.isDeleted, params.isDeleted ?? false));
  }

  const page = params.page || 1;
  const limit = params.limit || 20;
  const offset = (page - 1) * limit;

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const [{ total }] = await db
    .select({ total: count() })
    .from(table)
    .where(whereClause);

  const orderBy = buildOrderBy(
    table,
    params.sortBy || "createdAt",
    params.sortOrder,
  );
  let query = db.select().from(table).where(whereClause);

  if (orderBy) {
    query = query.orderBy(orderBy) as any;
  }

  const data = await query.limit(limit).offset(offset);

  return {
    data,
    pagination: {
      page,
      limit,
      total: Number(total),
      totalPages: Math.ceil(Number(total) / limit),
      hasNext: page < Math.ceil(Number(total) / limit),
      hasPrev: page > 1,
    },
  };
}

/**
 * Fonction optimisée pour récupérer des orders
 */
export async function getOrders(params: EntityQueryParams = {}) {
  const table = schema.orders;
  const conditions: any[] = [];

  if (params.buyerId) {
    conditions.push(eq(table.buyerId, params.buyerId));
  }

  if (params.productId) {
    conditions.push(eq(table.productId, params.productId));
  }

  if (params.shopId) {
    conditions.push(eq(table.shopId, params.shopId));
  }

  if (params.status) {
    conditions.push(eq(table.status, params.status));
  }

  if (params.search) {
    // Recherche dans les notes ou autres champs texte
    if (table.message) {
      conditions.push(like(table.message, `%${params.search}%`));
    }
  }


  if (table.isDeleted) {
    conditions.push(eq(table.isDeleted, params.isDeleted ?? false));
  }

  const page = params.page || 1;
  const limit = params.limit || 20;
  const offset = (page - 1) * limit;

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const [{ total }] = await db
    .select({ total: count() })
    .from(table)
    .where(whereClause);

  const orderBy = buildOrderBy(table, params.sortBy, params.sortOrder);
  let query = db.select().from(table).where(whereClause);

  if (orderBy) {
    query = query.orderBy(orderBy) as any;
  }

  const data = await query.limit(limit).offset(offset);

  return {
    data,
    pagination: {
      page,
      limit,
      total: Number(total),
      totalPages: Math.ceil(Number(total) / limit),
      hasNext: page < Math.ceil(Number(total) / limit),
      hasPrev: page > 1,
    },
  };
}

/**
 * Fonction optimisée pour récupérer des themes
 */
export async function getThemes(params: EntityQueryParams = {}) {
  const table = schema.themes;
  const conditions: any[] = [];

  if (params.creatorId) {
    conditions.push(eq(table.creatorId, params.creatorId));
  }

  if (params.search) {
    conditions.push(
      or(
        like(table.name, `%${params.search}%`),
        like(table.description, `%${params.search}%`),
      )!,
    );
  }

  if (params.isActive !== undefined) {
    conditions.push(eq(table.isActive, params.isActive));
  }

  if (table.isDeleted) {
    conditions.push(eq(table.isDeleted, params.isDeleted ?? false));
  }

  const page = params.page || 1;
  const limit = params.limit || 20;
  const offset = (page - 1) * limit;

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const [{ total }] = await db
    .select({ total: count() })
    .from(table)
    .where(whereClause);

  const orderBy = buildOrderBy(table, params.sortBy, params.sortOrder);
  let query = db.select().from(table).where(whereClause);

  if (orderBy) {
    query = query.orderBy(orderBy) as any;
  }

  const data = await query.limit(limit).offset(offset);

  return {
    data,
    pagination: {
      page,
      limit,
      total: Number(total),
      totalPages: Math.ceil(Number(total) / limit),
      hasNext: page < Math.ceil(Number(total) / limit),
      hasPrev: page > 1,
    },
  };
}

/**
 * Fonction optimisée pour récupérer des game items
 */
export async function getGameItems(params: EntityQueryParams = {}) {
  const table = schema.gameItems;
  const conditions: any[] = [];

  if (params.gameId) {
    conditions.push(eq(table.gameId, params.gameId));
  }

  if (params.type) {
    conditions.push(eq(table.type, params.type));
  }

  if (params.status) {
    conditions.push(eq(table.processingTime, params.status));
  }

  if (params.search) {
    conditions.push(
      or(
        like(table.name, `%${params.search}%`),
        like(table.description, `%${params.search}%`),
      )!,
    );
  }

  if (params.isActive !== undefined) {
    conditions.push(eq(table.isActive, params.isActive));
  }

  if (table.isDeleted) {
    conditions.push(eq(table.isDeleted, params.isDeleted ?? false));
  }

  const page = params.page || 1;
  const limit = params.limit || 20;
  const offset = (page - 1) * limit;

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const [{ total }] = await db
    .select({ total: count() })
    .from(table)
    .where(whereClause);

  const orderBy = buildOrderBy(table, params.sortBy, params.sortOrder);
  let query = db.select().from(table).where(whereClause);

  if (orderBy) {
    query = query.orderBy(orderBy) as any;
  }

  const data = await query.limit(limit).offset(offset);

  return {
    data,
    pagination: {
      page,
      limit,
      total: Number(total),
      totalPages: Math.ceil(Number(total) / limit),
      hasNext: page < Math.ceil(Number(total) / limit),
      hasPrev: page > 1,
    },
  };
}


/**
 * Fonction principale pour récupérer des entités
 * Utilise les fonctions optimisées si disponibles, sinon utilise la fonction générique
 */
export async function fetchEntities<T = any>(
  tableName: string,
  params: EntityQueryParams = {},
): Promise<PaginationResponse<T>> {
  // Vérifier si une fonction optimisée existe
  const fetcher = (entityFetchers as any)[tableName];

  if (fetcher) {
    return fetcher(params);
  }

  // Sinon, utiliser la fonction générique
  return getEntities<T>(tableName as TableName, params);
}

/**
 * Action universelle pour supprimer une entité (soft delete si supporté)
 */
export async function deleteEntity(
  tableName: string,
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const table =
      (schema as any)[tableName] ||
      (schema as any)[
      tableName.replace(/-([a-z])/g, (g) => g[1].toUpperCase())
      ];

    if (!table || !isTable(table)) {
      throw new Error(`Table "${tableName}" not found or is not a valid table`);
    }

    // Tenter un soft delete si la colonne isDeleted existe
    if ("isDeleted" in table) {
      await db
        .update(table)
        .set({ isDeleted: true, updatedAt: new Date() } as any)
        .where(eq((table as any).id, id));
    } else {
      // Sinon suppression physique
      await db.delete(table).where(eq((table as any).id, id));
    }

    return { success: true };
  } catch (error) {
    console.error(`Error deleting entity from ${tableName}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete entity",
    };
  }
}

/**
 * Approuver une commande
 */
export async function approveOrder(
  orderId: string,
  notes: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await db
      .update(schema.orders)
      .set({
        status: "ACCEPTED" as any,
        message: notes,
        updatedAt: new Date(),
      })
      .where(eq(schema.orders.id, orderId));

    return { success: true };
  } catch (error) {
    console.error("Error approving order:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to approve order",
    };
  }
}

/**
 * Rejeter une commande
 */
export async function rejectOrder(
  orderId: string,
  reason: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await db
      .update(schema.orders)
      .set({
        status: "REJECTED" as any,
        rejectionReason: reason,
        updatedAt: new Date(),
      })
      .where(eq(schema.orders.id, orderId));

    return { success: true };
  } catch (error) {
    console.error("Error rejecting order:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to reject order",
    };
  }
}
