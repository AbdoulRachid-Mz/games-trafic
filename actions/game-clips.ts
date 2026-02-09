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
import { eq, and, desc, asc, sql, inArray, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { 
  createGameClipSchema, 
  updateGameClipSchema, 
  gameClipFiltersSchema 
} from "@/validations/game-clips";

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

export type GetGameClipsParams = {
  filters?: z.infer<typeof gameClipFiltersSchema>;
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

  // Check daily limit based on user type
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [todaysClipsCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(gameClips)
    

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

export async function getGameClips({
  filters = { sortBy: "createdAt", sortOrder: "desc", limit: 20, offset: 0 },
  userId,
}: GetGameClipsParams) {
  // Validate filters
  const validatedFilters = gameClipFiltersSchema.parse(filters);

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

  // Get total count
  const [countResult] = await db
    .select({
      count: sql<number>`count(*)::int`,
    })
    .from(gameClips)
    .leftJoin(users, eq(gameClips.authorId, users.id))
    .where(whereClause);

  const total = countResult?.count || 0;

  // Get clips
  const clips = await db
    .select({
      clip: gameClips,
      author: {
        id: users.id,
        username: users.username,
        fullName: users.fullName,
        profileImage: users.profileImage,
      },
      shop: {
        id: shops.id,
        name: shops.name,
        profileImage: shops.profileImage,
      },
      game: {
        id: games.id,
        name: games.name,
        coverImage: games.coverImage,
      },
    })
    .from(gameClips)
    .leftJoin(users, eq(gameClips.authorId, users.id))
    .leftJoin(shops, eq(gameClips.shopId, shops.id))
    .leftJoin(games, eq(gameClips.gameId, games.id))
    .where(whereClause)
    .orderBy(
      ...(validatedFilters.sortOrder === "desc"
        ? [desc(
            validatedFilters.sortBy === "likes"
              ? sql`(
                  SELECT COUNT(*)::int
                  FROM interactions
                  WHERE interactions.entity_id = ${gameClips.id}
                    AND interactions.entity_type = 'GAMECLIP'
                    AND interactions.type = 'LIKE'
                )`
              : validatedFilters.sortBy === "views"
              ? sql`(
                  SELECT COUNT(*)::int
                  FROM interactions
                  WHERE interactions.entity_id = ${gameClips.id}
                    AND interactions.entity_type = 'GAMECLIP'
                    AND interactions.type = 'VIEW'
                )`
              : gameClips.createdAt
          )]
        : [asc(
            validatedFilters.sortBy === "likes"
              ? sql`(
                  SELECT COUNT(*)::int
                  FROM interactions
                  WHERE interactions.entity_id = ${gameClips.id}
                    AND interactions.entity_type = 'GAMECLIP'
                    AND interactions.type = 'LIKE'
                )`
              : validatedFilters.sortBy === "views"
              ? sql`(
                  SELECT COUNT(*)::int
                  FROM interactions
                  WHERE interactions.entity_id = ${gameClips.id}
                    AND interactions.entity_type = 'GAMECLIP'
                    AND interactions.type = 'VIEW'
                )`
              : gameClips.createdAt
          )]
      )
    )
    .limit(validatedFilters.limit)
    .offset(validatedFilters.offset);

  // Get interaction counts and comments
  const clipIds = clips.map(item => item.clip.id);
  const [interactionCounts, commentsCounts, userInteractions] = await Promise.all([
    getInteractionCounts(clipIds),
    getCommentsCount(clipIds),
    userId ? getUserInteractions(clipIds, userId) : Promise.resolve({}),
  ]);

  // Transform data
  const data = clips.map(item => {
    const counts = interactionCounts[item.clip.id] || { likes: 0, views: 0, bookmarks: 0 };
    const commentsCount = commentsCounts[item.clip.id] || 0;
    
    return {
      ...item.clip,
      author: item.author,
      shop: item.shop?.id ? item.shop : undefined,
      game: item.game?.id ? item.game : undefined,
      likesCount: counts.likes,
      viewsCount: counts.views,
      bookmarksCount: counts.bookmarks,
      commentsCount,
      userInteractions: userId ? {
        liked: (userInteractions as Record<string, { liked?: boolean; bookmarked?: boolean }>)[item.clip.id]?.liked || false,
        bookmarked: (userInteractions as Record<string, { liked?: boolean; bookmarked?: boolean }>)[item.clip.id]?.bookmarked || false,
      } : undefined,
    };
  });

  return { data, total };
}

export async function getGameClipById(id: string, userId?: string) {
  const [result] = await db
    .select({
      clip: gameClips,
      author: {
        id: users.id,
        username: users.username,
        fullName: users.fullName,
        profileImage: users.profileImage,
      },
      shop: {
        id: shops.id,
        name: shops.name,
        profileImage: shops.profileImage,
      },
      game: {
        id: games.id,
        name: games.name,
        coverImage: games.coverImage,
      },
    })
    .from(gameClips)
    .leftJoin(users, eq(gameClips.authorId, users.id))
    .leftJoin(shops, eq(gameClips.shopId, shops.id))
    .leftJoin(games, eq(gameClips.gameId, games.id))
    .where(eq(gameClips.id, id))
    .limit(1);

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
    ...result.clip,
    author: result.author,
    shop: result.shop?.id ? result.shop : undefined,
    game: result.game?.id ? result.game : undefined,
    likesCount: counts.likes,
    viewsCount: counts.views,
    bookmarksCount: counts.bookmarks,
    commentsCount,
    userInteractions: userId ? {
      liked: (userInteractions as Record<string, { liked?: boolean; bookmarked?: boolean }>)[id]?.liked || false,
      bookmarked: (userInteractions as Record<string, { liked?: boolean; bookmarked?: boolean }>)[id]?.bookmarked || false,
    } : undefined,
  };
}