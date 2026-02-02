// @/actions/game-clips.ts
"use server";

import {
  gameClips,
  users,
  shops,
  games,
  interactions,
  messages, // Kept for types/constants if needed, but primary logic moved to actions/interactions
} from "@/database/schema";
import { eq, and, desc, asc, sql, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
// import { getCurrentUser } from "@/lib/auth/session"; // REMOVED as requested
import { GameClipFilters } from "@/types/api";
import { z } from "zod";
import {
  checkInteractionExists,
  createInteraction,
  deleteInteractionByCriteria,
} from "@/actions/interactions";
import { createGameClipSchema, gameClipFiltersSchema, updateGameClipSchema } from "@/validations/game-clips";

interface CreateGameClipParams {
  data: z.infer<typeof createGameClipSchema>;
  userId: string;
}

interface UpdateGameClipParams {
  id: string;
  data: z.infer<typeof updateGameClipSchema>;
  userId: string;
}

interface GetGameClipsParams {
  filters?: Partial<z.infer<typeof gameClipFiltersSchema>>;
  userId?: string;
}

interface GameClipWithRelations {
  id: string;
  authorId: string;
  shopId: string | null;
  gameId: string | null;
  caption: string | null;
  videoUrl: string;
  images: string[] | null;
  isPublic?: boolean;
  likesCount: number;
  viewsCount: number;
  commentsCount?: number;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    username: string | null;
    fullName: string | null;
    profileImage: string | null;
  };
  shop?: {
    id: string;
    name: string;
    profileImage: string | null;
  };
  game?: {
    id: string;
    name: string;
    coverImage: string | null;
  };
  userInteractions?: {
    liked: boolean;
    bookmarked: boolean;
  };
}

// Helper function to get interaction counts
async function getInteractionCounts(gameClipIds: string[]) {
  if (gameClipIds.length === 0) return {};

  const interactionsData = await db
    .select({
      entityId: interactions.entityId,
      type: interactions.type,
      count: sql<number>`count(*)::int`,
    })
    .from(interactions)
    .where(
      and(
        eq(interactions.entityType, "GAMECLIP"),
        inArray(interactions.entityId, gameClipIds),
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
    counts[row.entityId][
      row.type.toLowerCase() as "likes" | "views" | "bookmarks"
    ] = row.count;
  }

  return counts;
}

// Helper function to get user interactions
async function getUserInteractions(gameClipIds: string[], userId: string) {
  if (gameClipIds.length === 0 || !userId) return {};

  const userInteractionsData = await db
    .select({
      entityId: interactions.entityId,
      type: interactions.type,
    })
    .from(interactions)
    .where(
      and(
        eq(interactions.entityType, "GAMECLIP"),
        eq(interactions.userId, userId),
        inArray(interactions.entityId, gameClipIds),
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
    if (row.type === "BOOKMARK")
      userInteractions[row.entityId].bookmarked = true;
  }

  return userInteractions;
}

export async function createGameClip({ data, userId }: CreateGameClipParams) {
  // REMOVED SESSION CHECK - relying on passed userId
  // const session = await getCurrentUser();
  // if (!session || session.id !== userId) {
  //   throw new Error("Unauthorized");
  // }

  // Validate input
  const validatedData = createGameClipSchema.parse(data);

  // Check if user exists
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

    if (!shop) {
      throw new Error("Shop not found");
    }
  }

  // Validate game if provided
  if (validatedData.gameId) {
    const [game] = await db
      .select({ id: games.id })
      .from(games)
      .where(eq(games.id, validatedData.gameId))
      .limit(1);

    if (!game) {
      throw new Error("Game not found");
    }
  }

  const result = await db
    .insert(gameClips)
    .values({
      authorId: userId,
      shopId: validatedData.shopId || null,
      gameId: validatedData.gameId || null,
      caption: validatedData.caption || null,
      videoUrl: validatedData.videoUrl,
      images: validatedData.imageUrls || null,
    })
    .returning();

  return result[0];
}

export async function updateGameClip({
  id,
  data,
  userId,
}: UpdateGameClipParams) {

  // Validate input
  const validatedData = updateGameClipSchema.parse(data);

  // Check if game clip exists and user owns it
  const [existingClip] = await db
    .select({ id: gameClips.id, authorId: gameClips.authorId })
    .from(gameClips)
    .where(eq(gameClips.id, id))
    .limit(1);

  if (!existingClip) {
    throw new Error("Game clip not found");
  }

  if (existingClip.authorId !== userId) {
    throw new Error("Unauthorized to update this game clip");
  }

  // Validate shop if provided
  if (validatedData.shopId) {
    const [shop] = await db
      .select({ id: shops.id })
      .from(shops)
      .where(eq(shops.id, validatedData.shopId))
      .limit(1);

    if (!shop) {
      throw new Error("Shop not found");
    }
  }

  // Validate game if provided
  if (validatedData.gameId) {
    const [game] = await db
      .select({ id: games.id })
      .from(games)
      .where(eq(games.id, validatedData.gameId))
      .limit(1);

    if (!game) {
      throw new Error("Game not found");
    }
  }

  const result = await db
    .update(gameClips)
    .set({
      ...validatedData,
      updatedAt: new Date(),
    })
    .where(eq(gameClips.id, id))
    .returning();

  return result[0];
}

export async function deleteGameClip(id: string, userId: string) {
  // REMOVED SESSION CHECK
  // const session = await getCurrentUser();
  // if (!session || session.id !== userId) {
  //   throw new Error("Unauthorized");
  // }

  // Check if game clip exists and user owns it
  const [existingClip] = await db
    .select({ id: gameClips.id, authorId: gameClips.authorId })
    .from(gameClips)
    .where(eq(gameClips.id, id))
    .limit(1);

  if (!existingClip) {
    throw new Error("Game clip not found");
  }

  if (existingClip.authorId !== userId) {
    throw new Error("Unauthorized to delete this game clip");
  }

  await db.delete(gameClips).where(eq(gameClips.id, id));

  return { success: true };
}

export async function getGameClips({
  filters = {},
  userId,
}: GetGameClipsParams): Promise<{
  data: GameClipWithRelations[];
  total: number;
}> {
  // Validate filters
  const validatedFilters = gameClipFiltersSchema.parse(filters);

  // Build where conditions
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
    conditions.push(
      sql`(${gameClips.caption} ilike ${`%${validatedFilters.search}%`} or ${users.username} ilike ${`%${validatedFilters.search}%`})`
    );
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

  // Get clips with relations
  const clips = await db
    .select({
      id: gameClips.id,
      authorId: gameClips.authorId,
      shopId: gameClips.shopId,
      gameId: gameClips.gameId,
      caption: gameClips.caption,
      videoUrl: gameClips.videoUrl,
      images: gameClips.images,
      thumbnailUrl: gameClips.thumbnailUrl,
      duration: gameClips.duration,
      expiresAt: gameClips.expiresAt,
      isPublic: gameClips.isPublic,
      createdAt: gameClips.createdAt,
      updatedAt: gameClips.updatedAt,
      authorUsername: users.username,
      authorFullName: users.fullName,
      authorProfileImage: users.profileImage,
      shopName: shops.name,
      shopImage: shops.profileImage,
      gameName: games.name,
      gameCoverImage: games.coverImage,
    })
    .from(gameClips)
    .leftJoin(users, eq(gameClips.authorId, users.id))
    .leftJoin(shops, eq(gameClips.shopId, shops.id))
    .leftJoin(games, eq(gameClips.gameId, games.id))
    .where(whereClause)
    .orderBy(
      validatedFilters.sortOrder === "desc"
        ? desc(
            validatedFilters.sortBy === "createdAt"
              ? gameClips.createdAt
              : validatedFilters.sortBy === "likes"
              ? sql`likes_count`
              : sql`views_count`
          )
        : asc(
            validatedFilters.sortBy === "createdAt"
              ? gameClips.createdAt
              : validatedFilters.sortBy === "likes"
              ? sql`likes_count`
              : sql`views_count`
          )
    )
    .limit(validatedFilters.limit)
    .offset(validatedFilters.offset);

  // Get interaction counts
  const clipIds = clips.map((clip) => clip.id);
  const interactionCounts = await getInteractionCounts(clipIds);
  
  // Get comments count
  const commentsCounts = await getCommentsCount(clipIds, "GAMECLIP");
  
  // Get user interactions
  const userInteractions = userId
    ? await getUserInteractions(clipIds, userId)
    : {};

  // Transform data
  const data: GameClipWithRelations[] = clips.map((clip) => ({
    id: clip.id,
    authorId: clip.authorId,
    shopId: clip.shopId,
    gameId: clip.gameId,
    caption: clip.caption,
    videoUrl: clip.videoUrl,
    images: clip.images || [],
    thumbnailUrl: clip.thumbnailUrl,
    duration: clip.duration,
    expiresAt: clip.expiresAt,
    isPublic: clip.isPublic ?? undefined,
    likesCount: interactionCounts[clip.id]?.likes || 0,
    viewsCount: interactionCounts[clip.id]?.views || 0,
    commentsCount: commentsCounts[clip.id] || 0,
    createdAt: clip.createdAt!,
    updatedAt: clip.updatedAt!,
    author: {
      id: clip.authorId,
      username: clip.authorUsername,
      fullName: clip.authorFullName,
      profileImage: clip.authorProfileImage,
    },
    shop: clip.shopId
      ? {
          id: clip.shopId,
          name: clip.shopName || "",
          profileImage: clip.shopImage,
        }
      : undefined,
    game: clip.gameId
      ? {
          id: clip.gameId,
          name: clip.gameName || "",
          coverImage: clip.gameCoverImage,
        }
      : undefined,
    userInteractions: userId
      ? {
          liked: userInteractions[clip.id]?.liked || false,
          bookmarked: userInteractions[clip.id]?.bookmarked || false,
        }
      : undefined,
  }));

  return { data, total };
}

// Helper function to get comments count
async function getCommentsCount(entityIds: string[], entityType: string) {
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
// @/actions/game-clips.ts
  for (const row of commentsData) {
    if (row.entityId) {
      counts[row.entityId] = row.count;
    }
  }
  return counts;
}

export async function getGameClipById(
  id: string,
  userId?: string,
): Promise<GameClipWithRelations | null> {
  // Get clip with relations
  const [clip] = await db
    .select({
      id: gameClips.id,
      authorId: gameClips.authorId,
      shopId: gameClips.shopId,
      gameId: gameClips.gameId,
      caption: gameClips.caption,
      videoUrl: gameClips.videoUrl,
      images: gameClips.images,
      isPublic: gameClips.isPublic,
      createdAt: gameClips.createdAt,
      updatedAt: gameClips.updatedAt,
      authorUsername: users.username,
      authorFullName: users.fullName,
      authorProfileImage: users.profileImage,
      shopName: shops.name,
      shopImage: shops.profileImage,
      gameName: games.name,
      gameCoverImage: games.coverImage,
    })
    .from(gameClips)
    .leftJoin(users, eq(gameClips.authorId, users.id))
    .leftJoin(shops, eq(gameClips.shopId, shops.id))
    .leftJoin(games, eq(gameClips.gameId, games.id))
    .where(eq(gameClips.id, id))
    .limit(1);

  if (!clip) return null;

  // Check privacy
  // if (!clip.isPublic && clip.authorId !== userId) {
  //   return null;
  // }

  // Get interaction counts
  const interactionCounts = await getInteractionCounts([clip.id]);
  const userInteractions = userId
    ? await getUserInteractions([clip.id], userId)
    : {};

  // Record view if user is viewing someone else's clip
  // We use interactions action logic here safely (no session check needed for db insert if we trust userId from client OR we don't care about session)
  // But wait, interactions actions usually check session. I am using the DB functions directly here or the actions?
  // I replaced logic to NOT require session.
  if (userId && userId !== clip.authorId) {
    try {
      // Just insert directly to avoid session check in `createInteraction` if it had one (but createInteraction in my generated file doesn't seem to check session, it checks user existence).
      // Actually I imported createInteraction from actions/interactions. I need to verify if THAT checks session.
      // Based on file I viewed earlier (Step 8), createInteraction does NOT check session, it just checks user existence.
      await createInteraction({
        userId,
        entityType: "GAMECLIP",
        entityId: clip.id,
        type: "VIEW",
      });
    } catch (e) {
      // ignore
    }
  }

  return {
    id: clip.id,
    authorId: clip.authorId,
    shopId: clip.shopId,
    gameId: clip.gameId,
    caption: clip.caption,
    videoUrl: clip.videoUrl,
    images: clip.images,
    isPublic: clip.isPublic ?? undefined,
    likesCount: interactionCounts[clip.id]?.likes || 0,
    viewsCount: interactionCounts[clip.id]?.views || 0,
    createdAt: clip.createdAt!,
    updatedAt: clip.updatedAt!,
    author: {
      id: clip.authorId,
      username: clip.authorUsername,
      fullName: clip.authorFullName,
      profileImage: clip.authorProfileImage,
    },
    shop: clip.shopId
      ? {
          id: clip.shopId,
          name: clip.shopName || "",
          profileImage: clip.shopImage,
        }
      : undefined,
    game: clip.gameId
      ? {
          id: clip.gameId,
          name: clip.gameName || "",
          coverImage: clip.gameCoverImage,
        }
      : undefined,
    userInteractions: userId
      ? {
          liked: userInteractions[clip.id]?.liked || false,
          bookmarked: userInteractions[clip.id]?.bookmarked || false,
        }
      : undefined,
  };
}

export async function interactWithGameClip(
  gameClipId: string,
  userId: string,
  type: "LIKE" | "BOOKMARK" | "VIEW",
) {
  // REMOVED SESSION CHECK
  // const session = await getCurrentUser();
  // if (!session || session.id !== userId) {
  //   throw new Error("Unauthorized");
  // }

  // Check if game clip exists
  const [clip] = await db
    .select({ id: gameClips.id })
    .from(gameClips)
    .where(eq(gameClips.id, gameClipId))
    .limit(1);

  if (!clip) {
    throw new Error("Game clip not found");
  }

  // Use shared interaction logic
  if (type === "LIKE" || type === "BOOKMARK") {
    const exists = await checkInteractionExists(
      userId,
      gameClipId,
      "GAMECLIP",
      type,
    );

    if (exists) {
      await deleteInteractionByCriteria(userId, gameClipId, "GAMECLIP", type);
      return { action: "removed", type };
    } else {
      await createInteraction({
        userId,
        entityType: "GAMECLIP",
        entityId: gameClipId,
        type,
      });
      return { action: "added", type };
    }
  } else if (type === "VIEW") {
    try {
      await createInteraction({
        userId,
        entityType: "GAMECLIP",
        entityId: gameClipId,
        type,
      });
    } catch (e) {
      // ignore
    }
    return { action: "added", type };
  }
}

export async function buildClipsWhereConditions(filters: GameClipFilters) {
  const whereConditions = [];

  if (filters.shopId) {
    whereConditions.push(eq(gameClips.shopId, filters.shopId));
  }

  if (filters.gameId) {
    whereConditions.push(eq(gameClips.gameId, filters.gameId));
  }

  return whereConditions;
}
