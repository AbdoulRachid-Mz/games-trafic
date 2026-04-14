// @/actions/game-clips.ts
"use server";

import { z } from "zod";
import {
  gameClips,
  users,
  shops,
  games, 
  interactions,
  messages
} from "@/database/schema";
import { eq, and, desc, asc, sql, inArray, or, count } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  type GameClipCard, type UserMini, type ShopMini, type GameCard,
  GAME_CLIP_CARD_COLUMNS, USER_MINI_COLUMNS, SHOP_MINI_COLUMNS, GAME_CARD_COLUMNS,
  PAGINATION_DEFAULTS,
} from "@/types/view-models";
import {
  createGameClipSchema,
  updateGameClipSchema,
  gameClipFiltersSchema
} from "@/validations/game-clips";
import { ListQuery, PaginationResponse } from "@/types/api";
import { cacheLife, cacheTag } from "next/cache";

// Types réutilisables
export type CreateGameClipParams = {
  data: z.infer<typeof createGameClipSchema>;
  userId: string;
};

export type UpdateGameClipParams = {
  id: string;
  data: z.infer<typeof updateGameClipSchema>;
  userId: string;
};

export type GetGameClipsParams = ListQuery<z.input<typeof gameClipFiltersSchema>> & {
  userId?: string;
};

// Helper functions
async function getInteractionCounts(entityIds: string[], entityType: string = "GAMECLIP") {
  if (entityIds.length === 0) return {};

  const interactionsData = await db
    .select({
      entityId: interactions.entityId,
      type: interactions.type,
      count: sql<number>`count(*)::int`,
    })
    .from(interactions)
    .where(
      and(
        eq(interactions.entityType, entityType as any),
        inArray(interactions.entityId, entityIds),
      ),
    )
    .groupBy(interactions.entityId, interactions.type);

  const counts: Record<
    string,
    { likes: number; views: number; bookmarks: number }
  > = {};

  for (const row of interactionsData) {
    if (!counts[row.entityId]) {
      counts[row.entityId] = { likes: 0, views: 0, bookmarks: 0 };
    }
    if (row.type === "LIKE") counts[row.entityId].likes = row.count;
    if (row.type === "VIEW") counts[row.entityId].views = row.count;
    if (row.type === "BOOKMARK") counts[row.entityId].bookmarks = row.count;
  }

  return counts;
}


// shareGameClip
export async function shareGameClip({ id, userId }: { id: string; userId: string }) {
  // Check user exists
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    throw new Error("User not found");
  }

  // Check clip exists
  const [clip] = await db
    .select({ id: gameClips.id })
    .from(gameClips)
    .where(eq(gameClips.id, id))
    .limit(1);

  if (!clip) {
    throw new Error("Clip not found");
  }

  // Create share interaction
  await db.insert(interactions).values({
    userId,
    entityId: id,
    entityType: "GAMECLIP",
    type: "SHARE",
  });

  return { success: true };
}


// share counts
async function getShareCounts(entityIds: string[], entityType: string = "GAMECLIP") {
  if (entityIds.length === 0) return {};

  const shareCountsData = await db
    .select({
      entityId: interactions.entityId,
      count: sql<number>`count(*)::int`,
    })
    .from(interactions)
    .where(
      and(
        eq(interactions.entityType, entityType as any),
        inArray(interactions.entityId, entityIds),
        eq(interactions.type, "SHARE"),
      ),
    )
    .groupBy(interactions.entityId);

  const counts: Record<string, number> = {};
  for (const row of shareCountsData) {
    if (row.entityId) {
      counts[row.entityId] = row.count;
    }
  }
  return counts;
}

async function getCommentsCount(entityIds: string[], entityType: string = "GAMECLIP") {
  if (entityIds.length === 0) return {};

  const commentsData = await db
    .select({
      entityId: messages.entityId,
      count: sql<number>`count(*)::int`,
    })
    .from(messages)
    .where(
      and(
        eq(messages.entityType, entityType as any),
        inArray(messages.entityId, entityIds),
        eq(messages.isActive, true)
      )
    )
    .groupBy(messages.entityId);

  const counts: Record<string, number> = {};
  for (const row of commentsData) {
    if (row.entityId) {
      counts[row.entityId] = row.count;
    }
  }
  return counts;
}

async function getUserInteractions(entityIds: string[], userId: string, entityType: string = "GAMECLIP") {
  if (entityIds.length === 0 || !userId) return {};

  const userInteractionsData = await db
    .select({
      entityId: interactions.entityId,
      type: interactions.type,
    })
    .from(interactions)
    .where(
      and(
        eq(interactions.entityType, entityType as any),
        eq(interactions.userId, userId),
        inArray(interactions.entityId, entityIds),
      ),
    );

  const userInteractions: Record<
    string,
    { liked: boolean; bookmarked: boolean }
  > = {};

  for (const row of userInteractionsData) {
    if (!userInteractions[row.entityId]) {
      userInteractions[row.entityId] = { liked: false, bookmarked: false };
    }
    if (row.type === "LIKE") userInteractions[row.entityId].liked = true;
    if (row.type === "BOOKMARK") userInteractions[row.entityId].bookmarked = true;
  }

  return userInteractions;
}

// Main functions
export async function createGameClip({ data, userId }: CreateGameClipParams) {
  // Validate input
  // const validatedData = createGameClipSchema.parse(data);
  const validatedData = data;

  // Check user exists
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    throw new Error("User not found");
  }

  // Validate shop if provided
  if (validatedData.shopId) {
    const [shop] = await db
      .select({ id: shops.id })
      .from(shops)
      .where(eq(shops.id, validatedData.shopId))
      .limit(1);
    if (!shop) throw new Error("Shop not found");
  }

  // Validate game if provided
  if (validatedData.gameId) {
    const [game] = await db
      .select({ id: games.id })
      .from(games)
      .where(eq(games.id, validatedData.gameId))
      .limit(1);
    if (!game) throw new Error("Game not found");
  }

  // Create clip
  const result = await db
    .insert(gameClips)
    .values({
      authorId: userId,
      shopId: validatedData.shopId || null,
      gameId: validatedData.gameId || null,
      caption: validatedData.caption || null,
      videoUrl: validatedData.videoUrl || null,
      images: validatedData.imageUrls ? validatedData.imageUrls.split(",") : null,
      isPublic: validatedData.isPublic,
      thumbnailUrl: validatedData.videoUrl || null, // For now, use video URL as thumbnail
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return result[0];
}

export async function getGameClips(
  query: GetGameClipsParams = {}
): Promise<PaginationResponse<GameClipCard>> {
  'use cache';
  cacheTag('game-clips');
  cacheLife('minutes');
  
  const { 
    filters = {}, 
    pagination = { page: 1, limit: PAGINATION_DEFAULTS.FEED },
    userId 
  } = query;
  // Validate filters
  const validatedFilters = gameClipFiltersSchema.parse(filters);
  const offset = (pagination.page - 1) * pagination.limit;

  // Build conditions
  const conditions = [eq(gameClips.isActive, true)];

  if (validatedFilters.authorId) {
    conditions.push(eq(gameClips.authorId, validatedFilters.authorId));
  }

  if (validatedFilters.shopId) {
    conditions.push(eq(gameClips.shopId, validatedFilters.shopId));
  }

  if (validatedFilters.gameId) {
    conditions.push(eq(gameClips.gameId, validatedFilters.gameId));
  }

  if (validatedFilters.search) {
    const searchCondition = or(
      sql`${gameClips.caption} ilike ${`%${validatedFilters.search}%`}`,
      sql`${users.username} ilike ${`%${validatedFilters.search}%`}`
    );
    if (searchCondition) {
      conditions.push(searchCondition);
    }
  }

  if (validatedFilters.isPublic !== undefined) {
    conditions.push(eq(gameClips.isPublic, validatedFilters.isPublic));
  }

  const whereClause = and(...conditions);

  // Get total count and clips in parallel
  const [countResult, clips] = await Promise.all([
    db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(gameClips)
      .leftJoin(users, eq(gameClips.authorId, users.id))
      .where(whereClause),
    db.query.gameClips.findMany({
      columns: GAME_CLIP_CARD_COLUMNS,
      where: whereClause,
      with: {
        author: { columns: USER_MINI_COLUMNS },
        shop: { columns: SHOP_MINI_COLUMNS },
        game: { columns: GAME_CARD_COLUMNS },
      },
      orderBy: (gameClips, { desc, asc }) => {
        const sortOrder = validatedFilters.sortOrder === "desc" ? desc : asc;
        if (validatedFilters.sortBy === "likes") {
          return [sortOrder(sql`(SELECT count(*) FROM interactions WHERE entity_id = ${gameClips.id} AND entity_type = 'GAMECLIP' AND type = 'LIKE')`)];
        }
        if (validatedFilters.sortBy === "views") {
          return [sortOrder(sql`(SELECT count(*) FROM interactions WHERE entity_id = ${gameClips.id} AND entity_type = 'GAMECLIP' AND type = 'VIEW')`)];
        }
        return [sortOrder(gameClips.createdAt)];
      },
      limit: pagination.limit,
      offset: offset,
    })
  ]);

  const total = countResult[0]?.count || 0;

  // Get interaction counts and comments
  const clipIds = clips.map(item => item.id);
  const [interactionCounts, commentsCounts, userInteractions] = await Promise.all([
    getInteractionCounts(clipIds),
    getCommentsCount(clipIds),
    userId ? getUserInteractions(clipIds, userId) : Promise.resolve({}),
  ]);

  // Transform data
  const data = clips.map(item => {
    const counts = interactionCounts[item.id] || { likes: 0, views: 0, bookmarks: 0 };
    const commentsCount = commentsCounts[item.id] || 0;

    return {
      ...item,
      author: item.author,
      shop: (item.shop as any)?.id ? item.shop : undefined,
      game: item.game ? { id: item.game.id, name: item.game.name, profileImage: item.game.profileImage } : null,
      authorId: item.authorId,
      stats: {
        likesCount: counts.likes,
        viewsCount: counts.views,
        commentsCount,
        liked: userId ? (userInteractions as Record<string, { liked?: boolean; bookmarked?: boolean }>)[item.id]?.liked || false : false,
        bookmarked: userId ? (userInteractions as Record<string, { liked?: boolean; bookmarked?: boolean }>)[item.id]?.bookmarked || false : false,
      },
      createdAt: item.createdAt,
    } as GameClipCard;
  });

  return {
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.ceil(total / pagination.limit),
      hasNext: pagination.page * pagination.limit < total,
      hasPrev: pagination.page > 1,
    }
  };
}

export async function getGameClipById(id: string, userId?: string) {
  const result = await db.query.gameClips.findFirst({
    where: eq(gameClips.id, id),
    with: {
      author: { columns: USER_MINI_COLUMNS },
      shop: { columns: SHOP_MINI_COLUMNS },
      game: { columns: GAME_CARD_COLUMNS },
    },
  });

  if (!result) return null;

  // Get stats
  const [interactionCounts, commentsCounts, userInteractions] = await Promise.all([
    getInteractionCounts([id]),
    getCommentsCount([id]),
    userId ? getUserInteractions([id], userId) : Promise.resolve({}),
  ]);

  const counts = interactionCounts[id] || { likes: 0, views: 0, bookmarks: 0 };
  const commentsCount = commentsCounts[id] || 0;

  return {
    ...result,
    author: result.author,
    shop: (result.shop as any)?.id ? result.shop : undefined,
    game: result.game ? { id: result.game.id, name: result.game.name, profileImage: result.game.profileImage } : null,
    authorId: result.authorId,
    stats: {
      likesCount: counts.likes,
      viewsCount: counts.views,
      commentsCount,
      liked: userId ? (userInteractions as Record<string, { liked?: boolean; bookmarked?: boolean }>)[id]?.liked || false : false,
      bookmarked: userId ? (userInteractions as Record<string, { liked?: boolean; bookmarked?: boolean }>)[id]?.bookmarked || false : false,
    },
    createdAt: result.createdAt,
  };
}