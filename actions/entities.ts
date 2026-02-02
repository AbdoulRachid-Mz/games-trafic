// @/actions/entities.ts
"use server";

import { db } from "@/lib/db";
import * as schema from "@/database/schema";
import { PgTable } from "drizzle-orm/pg-core";
import {
  and,
  or,
  eq,
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
import type { PaginationResponse, BaseFilters, SortOptions } from "@/types/api";

/**
 * Fonction utilitaire pour vérifier si un export est une table Drizzle
 */
function isTable(val: any): val is PgTable<any> {
  return !!val && typeof val === "object" && ("_" in val || "pgConfig" in val);
}

// Type pour les noms de tables
export type TableName = keyof typeof schema;

// Type pour les paramètres de requête
export interface EntityQueryParams extends BaseFilters, SortOptions {
  page?: number;
  limit?: number;
  offset?: number;
  [key: string]: any;
}

// Fonction utilitaire pour construire les conditions WHERE
function buildWhereConditions(table: any, filters: EntityQueryParams) {
  const conditions: any[] = [];

  // Filtres de base
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

// Export d'une map pour faciliter l'accès aux fonctions spécifiques
export const entityFetchers = {
  users: getUsers,
  shops: getShops,
  products: getProducts,
  tournaments: getTournaments,
  gameClips: getGameClips,
  // Ajouter d'autres fonctions spécifiques ici au besoin
} as const;

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
