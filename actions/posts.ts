'use server';

import { posts, type Post, type NewPost, interactions, messages, users } from '@/database/schema';
import { eq, and, or, like, ilike, desc, asc, sql, count, isNull, gte, lte, inArray, isNotNull, lt } from 'drizzle-orm';
import { type PostFilters, type ListQuery, type PaginationResponse, type QueryOptions } from '@/types/api';
import { db } from '@/lib/db';
import { cacheTag, cacheLife } from 'next/cache';
import { revalidateTag } from 'next/cache';
import {
  type PostCard, type UserMini,
  POST_CARD_COLUMNS, USER_MINI_COLUMNS,
  PAGINATION_DEFAULTS,
} from '@/types/view-models';

// ============================================================================
// QUERIES - Lecture des données
// ============================================================================

/**
 * Récupère un post par son ID avec relations optionnelles
 */
export async function getPostById(
  id: string,
  options?: { populate?: string[] }
): Promise<Post | null> {
  'use cache';
  cacheTag(`post-${id}`, 'posts');
  cacheLife('minutes');
  try {
    if (options?.populate && options.populate.length > 0) {
      const result = await db.query.posts.findFirst({
        where: (posts, { eq }) => eq(posts.id, id),
        with: {
          author: options.populate.includes('author') ? { columns: USER_MINI_COLUMNS } : undefined,
          interactions: options.populate.includes('interactions') ? true : undefined,
          messages: options.populate.includes('messages') ? true : undefined,
        }
      });
      return result ? result as unknown as Post : null;
    }

    const result = await db
      .select()
      .from(posts)
      .where(eq(posts.id, id))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error('Error getting post by ID:', error);
    throw new Error('Failed to fetch post');
  }
}

/**
 * Liste les posts avec pagination, filtres et options
 */
export async function getPosts(
  query: ListQuery<PostFilters> = {}
): Promise<PaginationResponse<PostCard>> {
  'use cache';
  cacheTag('posts');
  cacheLife('minutes');
  try {
    const { pagination = { page: 1, limit: PAGINATION_DEFAULTS.FEED }, filters = {}, options = {} } = query;
    const offset = (pagination.page - 1) * pagination.limit;

    const whereConditions = buildPostWhereConditions(filters, options);

    const [postsData, totalResult] = await Promise.all([
      db.query.posts.findMany({
        columns: POST_CARD_COLUMNS,
        where: whereConditions,
        limit: pagination.limit,
        offset: offset,
        orderBy: (posts, { desc, asc }) => {
          if (options.sortBy) {
            const sortField = options.sortBy as any;
            return [options.sortOrder === 'desc' ? desc((posts as any)[sortField]) : asc((posts as any)[sortField])];
          }
          return [desc(posts.createdAt)];
        },
        with: options.populate?.includes('author')
          ? { author: { columns: USER_MINI_COLUMNS } }
          : undefined,
      }),
      db.select({ count: count() }).from(posts).where(whereConditions)
    ]);

    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / pagination.limit);

    return {
      data: postsData,
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
    console.error('Error getting posts:', error);
    throw new Error('Failed to fetch posts');
  }
}

/**
 * Récupère les posts d'un utilisateur
 */
export async function getPostsByUserId(
  userId: string,
  query: ListQuery<PostFilters> = {}
): Promise<PaginationResponse<PostCard>> {
  try {
    const { pagination = { page: 1, limit: PAGINATION_DEFAULTS.FEED }, filters = {}, options = {} } = query;
    const offset = (pagination.page - 1) * pagination.limit;

    const whereConditions = and(
      eq(posts.authorId, userId),
      buildPostWhereConditions(filters, options)
    );

    const [postsData, totalResult] = await Promise.all([
      db.query.posts.findMany({
        columns: POST_CARD_COLUMNS,
        where: whereConditions,
        limit: pagination.limit,
        offset: offset,
        orderBy: (posts, { desc }) => [desc(posts.createdAt)],
        with: options.populate?.includes('author')
          ? { author: { columns: USER_MINI_COLUMNS } }
          : undefined,
      }),
      db.select({ count: count() }).from(posts).where(whereConditions)
    ]);

    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / pagination.limit);

    return {
      data: postsData,
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
    console.error('Error getting user posts:', error);
    throw new Error('Failed to fetch user posts');
  }
}

/**
 * Récupère les stories actives (non expirées)
 */
export async function getActiveStories(
  query: ListQuery<PostFilters> = {}
): Promise<PaginationResponse<PostCard>> {
  try {
    const { pagination = { page: 1, limit: PAGINATION_DEFAULTS.FEED }, filters = {}, options = {} } = query;
    const offset = (pagination.page - 1) * pagination.limit;

    const whereConditions = and(
      eq(posts.isStory, true),
      eq(posts.isActive, true),
      eq(posts.isDeleted, false),
      or(
        isNull(posts.expiresAt),
        gte(posts.expiresAt, new Date())
      ),
      buildPostWhereConditions(filters, options)
    );

    const [storiesData, totalResult] = await Promise.all([
      db.query.posts.findMany({
        columns: POST_CARD_COLUMNS,
        where: whereConditions,
        limit: pagination.limit,
        offset: offset,
        orderBy: (posts, { desc }) => [desc(posts.createdAt)],
        with: options.populate?.includes('author')
          ? { author: { columns: USER_MINI_COLUMNS } }
          : undefined,
      }),
      db.select({ count: count() }).from(posts).where(whereConditions)
    ]);

    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / pagination.limit);

    return {
      data: storiesData,
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
    console.error('Error getting active stories:', error);
    throw new Error('Failed to fetch active stories');
  }
}

/**
 * Récupère les statistiques des posts
 */
export async function getPostStats(filters?: PostFilters) {
  'use cache';
  cacheTag('posts', 'stats');
  cacheLife('minutes');
  try {
    const whereConditions = buildPostWhereConditions(filters || {});

    const [
      totalResult,
      storiesResult,
      withImagesResult,
      withVideoResult,
      activeResult,
      deletedResult
    ] = await Promise.all([
      db.select({ count: count() }).from(posts).where(whereConditions),
      db.select({ count: count() }).from(posts).where(and(whereConditions, eq(posts.isStory, true))),
      db.select({ count: count() }).from(posts).where(and(whereConditions, sql`${posts.images} != '{}'`)),
      db.select({ count: count() }).from(posts).where(and(whereConditions, isNotNull(posts.video))),
      db.select({ count: count() }).from(posts).where(and(whereConditions, eq(posts.isActive, true))),
      db.select({ count: count() }).from(posts).where(and(whereConditions, eq(posts.isDeleted, true)))
    ]);

    const stats = {
      total: totalResult[0]?.count ?? 0,
      stories: storiesResult[0]?.count ?? 0,
      withImages: withImagesResult[0]?.count ?? 0,
      withVideo: withVideoResult[0]?.count ?? 0,
      active: activeResult[0]?.count ?? 0,
      deleted: deletedResult[0]?.count ?? 0
    };

    return stats;
  } catch (error) {
    console.error('Error getting post stats:', error);
    throw new Error('Failed to fetch post statistics');
  }
}

// ============================================================================
// MUTATIONS - Écriture des données
// ============================================================================

/**
 * Crée un nouveau post
 */
export async function createPost(postData: NewPost): Promise<Post> {
  try {
    // Validation des données requises
    if (!postData.authorId) {
      throw new Error('authorId is required');
    }

    // Vérification que l'utilisateur existe
    const author = await db
      .select()
      .from(users)
      .where(eq(users.id, postData.authorId))
      .limit(1);

    if (author.length === 0) {
      throw new Error('Author not found');
    }

    // Validation des stories
    if (postData.isStory && !postData.expiresAt) {
      throw new Error('expiresAt is required for stories');
    }

    const result = await db
      .insert(posts)
      .values({
        ...postData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    revalidateTag('posts', 'max');
    return result[0];
  } catch (error) {
    console.error('Error creating post:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to create post');
  }
}

/**
 * Met à jour un post
 */
export async function updatePost(
  id: string,
  postData: Partial<NewPost>
): Promise<Post> {
  try {
    // Vérification que le post existe
    const existingPost = await getPostById(id);
    if (!existingPost) {
      throw new Error('Post not found');
    }

    // Validation des stories
    if (postData.isStory && !postData.expiresAt && !existingPost.expiresAt) {
      throw new Error('expiresAt is required for stories');
    }

    const result = await db
      .update(posts)
      .set({
        ...postData,
        updatedAt: new Date(),
      })
      .where(eq(posts.id, id))
      .returning();

    revalidateTag('posts', 'max');
    revalidateTag(`post-${id}`, 'max');
    return result[0];
  } catch (error) {
    console.error('Error updating post:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to update post');
  }
}

/**
 * Supprime un post (soft delete)
 */
export async function deletePost(id: string): Promise<Post> {
  try {
    const result = await db
      .update(posts)
      .set({
        isDeleted: true,
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(posts.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error('Post not found');
    }

    revalidateTag('posts', 'max');
    revalidateTag(`post-${id}`, 'max');
    return result[0];
  } catch (error) {
    console.error('Error deleting post:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to delete post');
  }
}

/**
 * Restaure un post supprimé
 */
export async function restorePost(id: string): Promise<Post> {
  try {
    const result = await db
      .update(posts)
      .set({
        isDeleted: false,
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(posts.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error('Post not found');
    }

    revalidateTag('posts', 'max');
    revalidateTag(`post-${id}`, 'max');
    return result[0];
  } catch (error) {
    console.error('Error restoring post:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to restore post');
  }
}

/**
 * Active/désactive un post
 */
export async function togglePostStatus(id: string): Promise<Post> {
  try {
    const post = await getPostById(id);
    if (!post) {
      throw new Error('Post not found');
    }

    const result = await db
      .update(posts)
      .set({
        isActive: !post.isActive,
        updatedAt: new Date(),
      })
      .where(eq(posts.id, id))
      .returning();

    revalidateTag('posts', 'max');
    revalidateTag(`post-${id}`, 'max');
    return result[0];
  } catch (error) {
    console.error('Error toggling post status:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to toggle post status');
  }
}

// ============================================================================
// UTILITAIRES
// ============================================================================

/**
 * Construit les conditions WHERE pour les requêtes posts
 */
function buildPostWhereConditions(
  filters: PostFilters,
  options: QueryOptions = {}
) {
  const conditions = [];

  // Filtres de base
  if (!options.includeDeleted) {
    conditions.push(eq(posts.isDeleted, false));
  }

  if (!options.includeInactive && !options.includeDeleted) {
    conditions.push(eq(posts.isActive, true));
  }

  // Filtres spécifiques
  if (filters.authorId) {
    conditions.push(eq(posts.authorId, filters.authorId));
  }

  if (filters.content) {
    conditions.push(ilike(posts.content, `%${filters.content}%`));
  }

  if (typeof filters.isStory === 'boolean') {
    conditions.push(eq(posts.isStory, filters.isStory));
  }

  if (filters.hasImages === true) {
    conditions.push(sql`${posts.images} != '{}'::text[]`);
  } else if (filters.hasImages === false) {
    conditions.push(sql`${posts.images} = '{}'::text[]`);
  }

  if (filters.hasVideo === true) {
    conditions.push(isNotNull(posts.video));
  } else if (filters.hasVideo === false) {
    conditions.push(isNull(posts.video));
  }

  // Filtres de date
  if (filters.expiresFrom) {
    conditions.push(gte(posts.expiresAt, new Date(filters.expiresFrom)));
  }

  if (filters.expiresTo) {
    conditions.push(lte(posts.expiresAt, new Date(filters.expiresTo)));
  }

  if (filters.createdFrom) {
    conditions.push(gte(posts.createdAt, new Date(filters.createdFrom)));
  }

  if (filters.createdTo) {
    conditions.push(lte(posts.createdAt, new Date(filters.createdTo)));
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

/**
 * Nettoie les stories expirées
 */
export async function cleanupExpiredStories(): Promise<number> {
  try {
    const result = await db
      .update(posts)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(posts.isStory, true),
          eq(posts.isActive, true),
          isNotNull(posts.expiresAt),
          lt(posts.expiresAt, new Date())
        )
      );

    return result.count || 0;
  } catch (error) {
    console.error('Error cleaning up expired stories:', error);
    throw new Error('Failed to cleanup expired stories');
  }
}

/**
 * Récupère le nombre de posts par utilisateur
 */
export async function getPostCountByUserId(userId: string): Promise<number> {
  try {
    const result = await db
      .select({ count: count() })
      .from(posts)
      .where(
        and(
          eq(posts.authorId, userId),
          eq(posts.isDeleted, false)
        )
      );

    return result[0]?.count ?? 0;
  } catch (error) {
    console.error('Error getting post count by user ID:', error);
    throw new Error('Failed to fetch post count');
  }
}

/**
 * Met à jour le compteur de posts de l'utilisateur
 */
export async function updateUserPostCount(userId: string): Promise<void> {
  try {
    const postCount = await getPostCountByUserId(userId);

    await db
      .update(users)
      .set({ postsCreatedCount: postCount })
      .where(eq(users.id, userId));
  } catch (error) {
    console.error('Error updating user post count:', error);
    throw new Error('Failed to update user post count');
  }
}
