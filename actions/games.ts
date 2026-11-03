'use server';

import { games, gameItems, requests, type Game, type NewGame, type GameItem, type NewGameItem, type Request, type NewRequest } from '@/database/schema';
import { eq, and, or, like, ilike, inArray, between, desc, asc, sql, count, gt, lt, gte, lte, isNull, isNotNull } from 'drizzle-orm';
import { type GameFilters, type GameItemFilters, type GameItemRequestFilters, type ListQuery, type PaginationResponse, type QueryOptions } from '@/types/api';
import { db } from '@/lib/db';
import { cacheTag, cacheLife } from 'next/cache';
import { revalidateTag } from 'next/cache';
import { type GameCard, GAME_CARD_COLUMNS, PAGINATION_DEFAULTS } from '@/types/view-models';

// ============================================================================
// QUERIES - Lecture des données
// ============================================================================

/**
 * Récupère un jeu par son ID
 */
export async function getGameById(id: string): Promise<Game | null> {
  'use cache';
  cacheTag(`game-${id}`, 'games');
  cacheLife('minutes');
  try {
    const result = await db
      .select()
      .from(games)
      .where(eq(games.id, id))
      .limit(1);
    return result[0] || null;
  } catch (error) {
    console.error('Error getting game by ID:', error);
    throw new Error('Failed to fetch game');
  }
}

/**
 * Récupère un jeu par son nom
 */
export async function getGameByName(name: string): Promise<Game | null> {
  'use cache';
  cacheTag('games');
  cacheLife('minutes');
  try {
    const result = await db
      .select()
      .from(games)
      .where(eq(games.name, name))
      .limit(1);
    return result[0] || null;
  } catch (error) {
    console.error('Error getting game by name:', error);
    throw new Error('Failed to fetch game');
  }
}

/**
 * Liste les jeux avec pagination, filtres et options
 */
export async function getGames(query: ListQuery<GameFilters> = {}): Promise<PaginationResponse<GameCard>> {
  'use cache';
  cacheTag('games');
  cacheLife('minutes');
  try {
    const { pagination = { page: 1, limit: PAGINATION_DEFAULTS.FEED }, filters = {}, options = {} } = query;
    const offset = (pagination.page - 1) * pagination.limit;

    const whereConditions = buildGameWhereConditions(filters, options);

    const [gamesData, totalResult] = await Promise.all([
      db.query.games.findMany({
        columns: GAME_CARD_COLUMNS,
        where: whereConditions,
        limit: pagination.limit,
        offset: offset,
        orderBy: (games, { desc, asc }) => {
          if (options.sortBy) {
            const sortField = options.sortBy as any;
            return [options.sortOrder === 'desc' ? desc((games as any)[sortField]) : asc((games as any)[sortField])];
          }
          return [desc(games.createdAt)];
        },
        with: options.withRelations ? {
          gameItems: true
        } : undefined
      }),
      db.select({ count: count() }).from(games).where(whereConditions)
    ]);
    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / pagination.limit);

    return {
      data: gamesData as GameCard[],
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
    console.error('Error listing games:', error);
    throw new Error('Failed to fetch games');
  }
}

/**
 * Récupère les statistiques des jeux
 */
export async function getGameStats(filters?: GameFilters) {
  'use cache';
  cacheTag('games', 'stats');
  cacheLife('minutes');
  try {
    const whereConditions = buildGameWhereConditions(filters || {});

    const [totalResult, featuredResult, activeResult] = await Promise.all([
      db.select({ count: count() }).from(games).where(whereConditions),
      db.select({ count: count() }).from(games).where(and(whereConditions, eq(games.featured, true))),
      db.select({ count: count() }).from(games).where(and(whereConditions, eq(games.isActive, true)))
    ]);

    return {
      total: totalResult[0]?.count ?? 0,
      featured: featuredResult[0]?.count ?? 0,
      active: activeResult[0]?.count ?? 0
    };
  } catch (error) {
    console.error('Error getting game stats:', error);
    throw new Error('Failed to fetch game statistics');
  }
}

// ============================================================================
// GAME ITEMS QUERIES
// ============================================================================

/**
 * Récupère un item de jeu par son ID
 */
export async function getGameItemById(id: string): Promise<GameItem | null> {
  'use cache';
  cacheTag(`game-item-${id}`, 'game-items');
  cacheLife('minutes');
  try {
    const result = await db
      .select()
      .from(gameItems)
      .where(eq(gameItems.id, id))
      .limit(1);
    return result[0] || null;
  } catch (error) {
    console.error('Error getting game item by ID:', error);
    throw new Error('Failed to fetch game item');
  }
}

/**
 * Liste les items d'un jeu spécifique
 */
export async function getGameItemsByGameId(gameId: string, query: ListQuery<GameItemFilters> = {}): Promise<PaginationResponse<GameItem>> {
  'use cache';
  cacheTag('game-items', `game-items-${gameId}`);
  cacheLife('minutes');
  try {
    const { pagination = { page: 1, limit: PAGINATION_DEFAULTS.FEED }, filters = {}, options = {} } = query;
    const offset = (pagination.page - 1) * pagination.limit;

    const whereConditions = and(
      eq(gameItems.gameId, gameId),
      buildGameWhereConditions(filters, options)
    );

    const itemsQuery = db
      .select()
      .from(gameItems)
      .where(whereConditions)
      .limit(pagination.limit)
      .offset(offset);

    if (options.sortBy) {
      const sortField = options.sortBy as keyof GameItem;
      const sortOrder = options.sortOrder === 'desc' ? desc : asc;
      itemsQuery.orderBy(sortOrder(gameItems[sortField]));
    } else {
      itemsQuery.orderBy(desc(gameItems.createdAt));
    }

    const countQuery = db
      .select({ count: count() })
      .from(gameItems)
      .where(whereConditions);

    const [itemsData, totalResult] = await Promise.all([itemsQuery, countQuery]);
    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / pagination.limit);

    return {
      data: itemsData,
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
    console.error('Error getting game items by game ID:', error);
    throw new Error('Failed to fetch game items');
  }
}

/**
 * Liste tous les items de jeu avec pagination, filtres et options
 */
export async function getGameItems(query: ListQuery<GameItemFilters> = {}): Promise<PaginationResponse<GameItem>> {
  'use cache';
  cacheTag('game-items');
  cacheLife('minutes');
  try {
    const { pagination = { page: 1, limit: PAGINATION_DEFAULTS.FEED }, filters = {}, options = {} } = query;
    const offset = (pagination.page - 1) * pagination.limit;

    const whereConditions = buildGameItemWhereConditions(filters, options);

    let itemsData: GameItem[];

    if (options.withRelations) {
      itemsData = await db.query.gameItems.findMany({
        where: whereConditions,
        limit: pagination.limit,
        offset,
        orderBy: (items, { desc, asc }) => {
          if (options.sortBy) {
            const sortField = options.sortBy as any;
            return [options.sortOrder === 'desc' ? desc((items as any)[sortField]) : asc((items as any)[sortField])];
          }
          return [desc(items.createdAt)];
        },
        with: {
          game: true
        }
      }) as any[];
    } else {
      const itemsQuery = db
        .select()
        .from(gameItems)
        .where(whereConditions)
        .limit(pagination.limit)
        .offset(offset);

      if (options.sortBy) {
        const sortField = options.sortBy as keyof GameItem;
        const sortOrder = options.sortOrder === 'desc' ? desc : asc;
        itemsQuery.orderBy(sortOrder(gameItems[sortField]));
      } else {
        itemsQuery.orderBy(desc(gameItems.createdAt));
      }
      
      itemsData = await itemsQuery;
    }

    const countQuery = db
      .select({ count: count() })
      .from(gameItems)
      .where(whereConditions);

    const totalResult = await countQuery;
    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / pagination.limit);

    return {
      data: itemsData,
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
    console.error('Error listing game items:', error);
    throw new Error('Failed to fetch game items');
  }
}

// ============================================================================
// GAME ITEM REQUESTS QUERIES (migrated to unified requests table)
// ============================================================================

/**
 * Récupère une demande d'item de jeu par son ID
 */
export async function getGameItemRequestById(id: string): Promise<Request | null> {
  'use cache';
  cacheTag(`game-request-${id}`, 'game-requests');
  cacheLife('minutes');
  try {
    const result = await db
      .select()
      .from(requests)
      .where(and(eq(requests.id, id), eq(requests.type, 'GAME_ITEMS')))
      .limit(1);
    return result[0] || null;
  } catch (error) {
    console.error('Error getting game item request by ID:', error);
    throw new Error('Failed to fetch game item request');
  }
}

/**
 * Liste les demandes d'items d'un utilisateur
 */
export async function getGameItemRequestsByUserId(userId: string, query: ListQuery<GameItemRequestFilters> = {}): Promise<PaginationResponse<Request>> {
  try {
    const { pagination = { page: 1, limit: PAGINATION_DEFAULTS.FEED }, filters = {}, options = {} } = query;
    const offset = (pagination.page - 1) * pagination.limit;

    const whereConditions = and(
      eq(requests.userId, userId),
      eq(requests.type, 'GAME_ITEMS'),
      buildGameItemRequestWhereConditions(filters, options)
    );

    const requestsQuery = db
      .select()
      .from(requests)
      .where(whereConditions)
      .limit(pagination.limit)
      .offset(offset);

    if (options.sortBy) {
      const sortField = options.sortBy as keyof Request;
      const sortOrder = options.sortOrder === 'desc' ? desc : asc;
      requestsQuery.orderBy(sortOrder(requests[sortField]));
    } else {
      requestsQuery.orderBy(desc(requests.createdAt));
    }

    const countQuery = db
      .select({ count: count() })
      .from(requests)
      .where(whereConditions);

    const [requestsData, totalResult] = await Promise.all([requestsQuery, countQuery]);
    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / pagination.limit);

    return {
      data: requestsData,
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
    console.error('Error getting game item requests by user ID:', error);
    throw new Error('Failed to fetch game item requests');
  }
}

/**
 * Liste toutes les demandes d'items de jeu avec pagination, filtres et options
 */
export async function getGameItemRequests(query: ListQuery<GameItemRequestFilters> = {}): Promise<PaginationResponse<Request>> {
  try {
    const { pagination = { page: 1, limit: PAGINATION_DEFAULTS.FEED }, filters = {}, options = {} } = query;
    const offset = (pagination.page - 1) * pagination.limit;

    const whereConditions = and(
      eq(requests.type, 'GAME_ITEMS'),
      buildGameItemRequestWhereConditions(filters, options)
    );

    const requestsQuery = db
      .select()
      .from(requests)
      .where(whereConditions)
      .limit(pagination.limit)
      .offset(offset);

    if (options.sortBy) {
      const sortField = options.sortBy as keyof Request;
      const sortOrder = options.sortOrder === 'desc' ? desc : asc;
      requestsQuery.orderBy(sortOrder(requests[sortField]));
    } else {
      requestsQuery.orderBy(desc(requests.createdAt));
    }

    const countQuery = db
      .select({ count: count() })
      .from(requests)
      .where(whereConditions);

    const [requestsData, totalResult] = await Promise.all([requestsQuery, countQuery]);
    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / pagination.limit);

    return {
      data: requestsData,
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
    console.error('Error getting game item requests:', error);
    throw new Error('Failed to fetch game item requests');
  }
}

// ============================================================================
// MUTATIONS - Écriture des données
// ============================================================================

/**
 * Crée un nouveau jeu
 */
export async function createGame(gameData: NewGame): Promise<Game> {
  try {
    if (!gameData.name) {
      throw new Error('Game name is required');
    }

    const existingGame = await db
      .select()
      .from(games)
      .where(eq(games.name, gameData.name))
      .limit(1);

    if (existingGame.length > 0) {
      throw new Error('Game with this name already exists');
    }

    const result = await db
      .insert(games)
      .values({
        ...gameData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    revalidateTag('games', 'max');
    return result[0];
  } catch (error) {
    console.error('Error creating game:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to create game');
  }
}

/**
 * Met à jour un jeu
 */
export async function updateGame(id: string, gameData: Partial<NewGame>): Promise<Game> {
  try {
    const existingGame = await getGameById(id);
    if (!existingGame) {
      throw new Error('Game not found');
    }

    if (gameData.name && gameData.name !== existingGame.name) {
      const gameWithName = await getGameByName(gameData.name);
      if (gameWithName) {
        throw new Error('Game with this name already exists');
      }
    }

    const result = await db
      .update(games)
      .set({
        ...gameData,
        updatedAt: new Date(),
      })
      .where(eq(games.id, id))
      .returning();

    revalidateTag('games', 'max');
    revalidateTag(`game-${id}`, 'max');
    return result[0];
  } catch (error) {
    console.error('Error updating game:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to update game');
  }
}

/**
 * Supprime un jeu (soft delete)
 */
export async function deleteGame(id: string): Promise<Game> {
  try {
    const result = await db
      .update(games)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(games.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error('Game not found');
    }

    revalidateTag('games', 'max');
    revalidateTag(`game-${id}`, 'max');
    return result[0];
  } catch (error) {
    console.error('Error deleting game:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to delete game');
  }
}

/**
 * Crée un nouvel item de jeu
 */
export async function createGameItem(itemData: NewGameItem): Promise<GameItem> {
  try {
    if (!itemData.gameId || !itemData.name || !itemData.type) {
      throw new Error('Game ID, name and type are required');
    }

    const game = await getGameById(itemData.gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    const result = await db
      .insert(gameItems)
      .values({
        ...itemData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    revalidateTag('game-items', 'max');
    return result[0];
  } catch (error) {
    console.error('Error creating game item:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to create game item');
  }
}

/**
 * Met à jour un item de jeu
 */
export async function updateGameItem(id: string, itemData: Partial<NewGameItem>): Promise<GameItem> {
  try {
    const existingItem = await getGameItemById(id);
    if (!existingItem) {
      throw new Error('Game item not found');
    }

    const result = await db
      .update(gameItems)
      .set({
        ...itemData,
        updatedAt: new Date(),
      })
      .where(eq(gameItems.id, id))
      .returning();

    revalidateTag('game-items', 'max');
    revalidateTag(`game-item-${id}`, 'max');
    return result[0];
  } catch (error) {
    console.error('Error updating game item:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to update game item');
  }
}

/**
 * Supprime un item de jeu (soft delete)
 */
export async function deleteGameItem(id: string): Promise<GameItem> {
  try {
    const result = await db
      .update(gameItems)
      .set({
        isActive: false,
        isDeleted: true,
        updatedAt: new Date(),
      })
      .where(eq(gameItems.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error('Game item not found');
    }

    revalidateTag('game-items', 'max');
    revalidateTag(`game-item-${id}`, 'max');
    return result[0];
  } catch (error) {
    console.error('Error deleting game item:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to delete game item');
  }
}

/**
 * Crée une nouvelle demande d'item de jeu
 */
export async function createGameItemRequest(requestData: NewRequest): Promise<Request> {
  try {
    if (!requestData.userId || !requestData.gameItemId || !requestData.gameAccount) {
      throw new Error('User ID, game item ID and game account are required');
    }

    const gameItem = await getGameItemById(requestData.gameItemId);
    if (!gameItem) {
      throw new Error('Game item not found');
    }

    const result = await db
      .insert(requests)
      .values({
        ...requestData,
        type: 'GAME_ITEMS',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    revalidateTag('game-requests', 'max');
    return result[0];
  } catch (error) {
    console.error('Error creating game item request:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to create game item request');
  }
}

/**
 * Met à jour une demande d'item de jeu
 */
export async function updateGameItemRequest(id: string, requestData: Partial<NewRequest>): Promise<Request> {
  try {
    const existingRequest = await getGameItemRequestById(id);
    if (!existingRequest) {
      throw new Error('Game item request not found');
    }

    const result = await db
      .update(requests)
      .set({
        ...requestData,
        updatedAt: new Date(),
      })
      .where(eq(requests.id, id))
      .returning();

    revalidateTag('game-requests', 'max');
    revalidateTag(`game-request-${id}`, 'max');
    return result[0];
  } catch (error) {
    console.error('Error updating game item request:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to update game item request');
  }
}

/**
 * Traite une demande d'item de jeu (changé le statut et assigne l'admin)
 */
export async function processGameItemRequest(id: string, processedByUserId: string, status: 'COMPLETED' | 'FAILED' | 'CANCELLED', adminNotes?: string): Promise<Request> {
  try {
    const existingRequest = await getGameItemRequestById(id);
    if (!existingRequest) {
      throw new Error('Game item request not found');
    }

    const updateData: Partial<NewRequest> = {
      status,
      processedByUserId,
      processedAt: new Date(),
      adminNotes
    };

    if (status === 'COMPLETED') {
      updateData.completedAt = new Date();
    } else if (status === 'CANCELLED') {
      updateData.cancelledAt = new Date();
    }

    const result = await db
      .update(requests)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(requests.id, id))
      .returning();

    revalidateTag('game-requests', 'max');
    revalidateTag(`game-request-${id}`, 'max');
    return result[0];
  } catch (error) {
    console.error('Error processing game item request:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to process game item request');
  }
}

/**
 * Supprime une demande d'item de jeu
 */
export async function deleteGameItemRequest(id: string): Promise<Request> {
  try {
    const result = await db
      .delete(requests)
      .where(eq(requests.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error('Game item request not found');
    }

    revalidateTag('game-requests', 'max');
    return result[0];
  } catch (error) {
    console.error('Error deleting game item request:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to delete game item request');
  }
}

// ============================================================================
// UTILITAIRES
// ============================================================================

/**
 * Construit les conditions WHERE pour les requêtes games
 */
function buildGameWhereConditions(filters: GameFilters, options: QueryOptions = {}) {
  const conditions = [];

  if (!options.includeDeleted) {
    conditions.push(eq(games.isDeleted, false));
    conditions.push(eq(games.isActive, true));
  }

  if (filters.name) {
    conditions.push(ilike(games.name, `%${filters.name}%`));
  }

  if (filters.description) {
    conditions.push(ilike(games.description, `%${filters.description}%`));
  }

  if (filters.publisher) {
    conditions.push(ilike(games.publisher, `%${filters.publisher}%`));
  }

  if (filters.genre) {
    conditions.push(ilike(games.genre, `%${filters.genre}%`));
  }

  if (filters.platforms && filters.platforms.length > 0) {
    conditions.push(sql`${games.platforms} && ${filters.platforms}::text[]`);
  }

  if (filters.isActive !== undefined) {
    conditions.push(eq(games.isActive, filters.isActive));
  }

  if (filters.featured !== undefined) {
    conditions.push(eq(games.featured, filters.featured));
  }

  if (filters.popularityMin !== undefined) {
    conditions.push(gte(games.popularity, filters.popularityMin));
  }

  if (filters.popularityMax !== undefined) {
    conditions.push(lte(games.popularity, filters.popularityMax));
  }

  if (filters.website) {
    conditions.push(ilike(games.website, `%${filters.website}%`));
  }

  if (filters.minAgeMin !== undefined) {
    conditions.push(gte(games.minAge, filters.minAgeMin));
  }

  if (filters.minAgeMax !== undefined) {
    conditions.push(lte(games.minAge, filters.minAgeMax));
  }

  if (filters.tags && filters.tags.length > 0) {
    // Tags are stored as JSONB array; use Postgres array overlap operator
    conditions.push(sql`${games.tags} && ${filters.tags}::text[]`);
  }

  if (filters.releaseDateFrom) {
    conditions.push(gte(games.releaseDate, new Date(filters.releaseDateFrom)));
  }

  if (filters.releaseDateTo) {
    conditions.push(lte(games.releaseDate, new Date(filters.releaseDateTo)));
  }

  if (filters.startDate) {
    conditions.push(gte(games.createdAt, new Date(filters.startDate)));
  }

  if (filters.endDate) {
    conditions.push(lte(games.createdAt, new Date(filters.endDate)));
  }

  if (filters.search) {
    conditions.push(
      or(
        ilike(games.name, `%${filters.search}%`),
        ilike(games.description, `%${filters.search}%`),
        ilike(games.publisher, `%${filters.search}%`),
        ilike(games.genre, `%${filters.search}%`)
      )
    );
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

/**
 * Construit les conditions WHERE pour les requêtes de demandes d'items de jeu
 */
function buildGameItemRequestWhereConditions(filters: GameItemRequestFilters, options: QueryOptions = {}) {
  const conditions = [];

  // Filtres de base
  if (!options.includeDeleted) {
    conditions.push(eq(requests.isDeleted, false));
  }

  if (filters.id) {
    conditions.push(eq(requests.id, filters.id));
  }

  if (filters.userId) {
    conditions.push(eq(requests.userId, filters.userId));
  }

  if (filters.gameItemId) {
    conditions.push(eq(requests.gameItemId, filters.gameItemId));
  }

  if (filters.gameId) {
    conditions.push(eq(requests.gameId, filters.gameId));
  }

  if (filters.gameAccount) {
    conditions.push(ilike(requests.gameAccount, `%${filters.gameAccount}%`));
  }

  if (filters.processedByUserId) {
    conditions.push(eq(requests.processedByUserId, filters.processedByUserId));
  }

  if (filters.transactionId) {
    conditions.push(eq(requests.transactionId, filters.transactionId));
  }

  // Filtres par statut
  if (filters.statuses && filters.statuses.length > 0) {
    conditions.push(inArray(requests.status, filters.statuses));
  }

  // Filtres numériques
  if (filters.quantityMin !== undefined) {
    conditions.push(gte(requests.quantity, String(filters.quantityMin)));
  }

  if (filters.quantityMax !== undefined) {
    conditions.push(lte(requests.quantity, String(filters.quantityMax)));
  }

  if (filters.totalGtcMin !== undefined) {
    conditions.push(gte(requests.totalGtc, String(filters.totalGtcMin)));
  }

  if (filters.totalGtcMax !== undefined) {
    conditions.push(lte(requests.totalGtc, String(filters.totalGtcMax)));
  }

  // Filtres de date
  if (filters.processedFrom) {
    conditions.push(gte(requests.processedAt, new Date(filters.processedFrom)));
  }

  if (filters.processedTo) {
    conditions.push(lte(requests.processedAt, new Date(filters.processedTo)));
  }

  if (filters.completedFrom) {
    conditions.push(gte(requests.completedAt, new Date(filters.completedFrom)));
  }

  if (filters.completedTo) {
    conditions.push(lte(requests.completedAt, new Date(filters.completedTo)));
  }

  if (filters.createdFrom) {
    conditions.push(gte(requests.createdAt, new Date(filters.createdFrom)));
  }

  if (filters.createdTo) {
    conditions.push(lte(requests.createdAt, new Date(filters.createdTo)));
  }

  // Filtre de recherche générale
  if (filters.search) {
    conditions.push(
      or(
        ilike(requests.gameAccount, `%${filters.search}%`),
        ilike(requests.adminNotes, `%${filters.search}%`),
        ilike(requests.userNotes, `%${filters.search}%`)
      )
    );
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

/**
 * Construit les conditions WHERE pour les requêtes d'items de jeu
 */
function buildGameItemWhereConditions(filters: GameItemFilters, options: QueryOptions = {}) {
  const conditions = [];

  if (!options.includeDeleted) {
    conditions.push(eq(gameItems.isActive, true));
  }

  if (filters.gameId) {
    conditions.push(eq(gameItems.gameId, filters.gameId));
  }

  if (filters.name) {
    conditions.push(ilike(gameItems.name, `%${filters.name}%`));
  }

  if (filters.type) {
    conditions.push(eq(gameItems.type, filters.type));
  }

  if (filters.types && filters.types.length > 0) {
    conditions.push(inArray(gameItems.type, filters.types));
  }

  if (filters.priceGtcMin !== undefined) {
    conditions.push(gte(gameItems.priceGtc, String(filters.priceGtcMin)));
  }

  if (filters.priceGtcMax !== undefined) {
    conditions.push(lte(gameItems.priceGtc, String(filters.priceGtcMax)));
  }

  if (filters.availability) {
    conditions.push(eq(gameItems.availability, filters.availability));
  }

  if (filters.featured !== undefined) {
    conditions.push(eq(gameItems.featured, filters.featured));
  }

  if (filters.search) {
    conditions.push(
      or(
        ilike(gameItems.name, `%${filters.search}%`),
        ilike(gameItems.description || '', `%${filters.search}%`)
      )
    );
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

/**
 * Pont pour useEntityList (server-action)
 */
export async function fetchEntities(entityType: string, params: any): Promise<any> {
  if (entityType === 'games') {
    const result = await getGames({
      pagination: {
        page: params.page || 1,
        limit: params.limit || 20,
      },
      filters: params,
      options: {
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
        includeDeleted: params.includeDeleted,
      }
    });
    return { success: true, ...result };
  }
  
  if (entityType === 'game-items') {
    const result = await getGameItems({
      pagination: {
        page: params.page || 1,
        limit: params.limit || 20,
      },
      filters: params,
      options: {
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
        includeDeleted: params.includeDeleted,
      }
    });
    return { success: true, ...result };
  }

  throw new Error(`Entity type ${entityType} not supported in games actions`);
}

