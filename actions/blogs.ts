'use server';

import { blogs, type Blog, type NewBlog, users, interactions, viewers, BlogWithRelations } from '@/database/schema';
import { eq, and, or, like, ilike, desc, asc, sql, count, gte, lte, isNull } from 'drizzle-orm';
import { type BlogFilters, type ListQuery, type PaginationResponse, type QueryOptions } from '@/types/api';
import { db } from '@/lib/db';

// ============================================================================
// QUERIES - Lecture des données
// ============================================================================

/**
 * Récupère un blog par son ID avec relations optionnelles
 */
export async function getBlogById(
  id: string,
  options?: { populate?: string[] }
): Promise<BlogWithRelations | null> {
  try {
    if (options?.populate && options.populate.length > 0) {
      const query = db.query.blogs.findFirst({
        where: (blogs, { eq }) => eq(blogs.id, id),
        with: {
          author: options.populate.includes('author') ? true : undefined,
        }
      });
      return (await query) ?? null;
    }

    const result = await db
      .select()
      .from(blogs)
      .where(eq(blogs.id, id))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error('Error getting blog by ID:', error);
    throw new Error('Failed to fetch blog');
  }
}

/**
 * Liste les blogs avec pagination, filtres et options
 */
export async function getBlogs(
  query: ListQuery<BlogFilters> = {}
): Promise<PaginationResponse<Blog>> {
  try {
    const { pagination = { page: 1, limit: 50 }, filters = {}, options = {} } = query;
    const offset = (pagination.page - 1) * pagination.limit;

    const whereConditions = buildBlogWhereConditions(filters, options);

    const blogsQuery = db
      .select()
      .from(blogs)
      .where(whereConditions)
      .limit(pagination.limit)
      .offset(offset);

    if (options.sortBy) {
      const sortField = options.sortBy as keyof Blog;
      const sortOrder = options.sortOrder === 'desc' ? desc : asc;
      blogsQuery.orderBy(sortOrder(blogs[sortField]));
    } else {
      blogsQuery.orderBy(desc(blogs.createdAt));
    }

    const countQuery = db
      .select({ count: count() })
      .from(blogs)
      .where(whereConditions);

    const [blogsData, totalResult] = await Promise.all([
      blogsQuery,
      countQuery
    ]);

    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / pagination.limit);

    return {
      data: blogsData,
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
    console.error('Error getting blogs:', error);
    throw new Error('Failed to fetch blogs');
  }
}

/**
 * Récupère les blogs d'un auteur spécifique
 */
export async function getBlogsByAuthor(
  authorId: string,
  query: ListQuery<BlogFilters> = {}
): Promise<PaginationResponse<Blog>> {
  try {
    const { pagination = { page: 1, limit: 20 }, filters = {}, options = {} } = query;
    const offset = (pagination.page - 1) * pagination.limit;

    const whereConditions = and(
      eq(blogs.authorId, authorId),
      buildBlogWhereConditions(filters, options)
    );

    const blogsQuery = db
      .select()
      .from(blogs)
      .where(whereConditions)
      .limit(pagination.limit)
      .offset(offset)
      .orderBy(desc(blogs.createdAt));

    const countQuery = db
      .select({ count: count() })
      .from(blogs)
      .where(whereConditions);

    const [blogsData, totalResult] = await Promise.all([
      blogsQuery,
      countQuery
    ]);

    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / pagination.limit);

    return {
      data: blogsData,
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
    console.error('Error getting blogs by author:', error);
    throw new Error('Failed to fetch author blogs');
  }
}

/**
 * Récupère les statistiques des blogs
 */
export async function getBlogStats(filters?: BlogFilters) {
  try {
    const whereConditions = buildBlogWhereConditions(filters || {});

    const [totalResult, activeResult, deletedResult, withImagesResult] = await Promise.all([
      db.select({ count: count() }).from(blogs).where(whereConditions),
      db.select({ count: count() }).from(blogs).where(and(whereConditions, eq(blogs.isActive, true))),
      db.select({ count: count() }).from(blogs).where(and(whereConditions, eq(blogs.isDeleted, true))),
      db.select({ count: count() }).from(blogs).where(and(whereConditions, isNull(blogs.images), sql`${blogs.images}::text[] IS NOT NULL AND array_length(${blogs.images}, 1) > 0`)),
    ]);

    const stats = {
      total: totalResult[0]?.count ?? 0,
      active: activeResult[0]?.count ?? 0,
      deleted: deletedResult[0]?.count ?? 0,
      withImages: withImagesResult[0]?.count ?? 0,
    };

    return stats;
  } catch (error) {
    console.error('Error getting blog stats:', error);
    throw new Error('Failed to fetch blog statistics');
  }
}

// ============================================================================
// MUTATIONS - Écriture des données
// ============================================================================

/**
 * Crée un nouveau blog
 */
export async function createBlog(blogData: NewBlog): Promise<Blog> {
  try {
    if (!blogData.title || !blogData.content || !blogData.authorId) {
      throw new Error('Title, content, and authorId are required');
    }

    // Vérification que l'auteur existe
    const author = await db
      .select()
      .from(users)
      .where(eq(users.id, blogData.authorId))
      .limit(1);

    if (author.length === 0) {
      throw new Error('Author not found');
    }

    const result = await db
      .insert(blogs)
      .values({
        ...blogData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Error creating blog:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to create blog');
  }
}

/**
 * Met à jour un blog
 */
export async function updateBlog(
  id: string,
  blogData: Partial<NewBlog>
): Promise<Blog> {
  try {
    // Vérification que le blog existe
    const existingBlog = await getBlogById(id);
    if (!existingBlog) {
      throw new Error('Blog not found');
    }

    const result = await db
      .update(blogs)
      .set({
        ...blogData,
        updatedAt: new Date(),
      })
      .where(eq(blogs.id, id))
      .returning();

    return result[0];
  } catch (error) {
    console.error('Error updating blog:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to update blog');
  }
}

/**
 * Supprime un blog (soft delete)
 */
export async function deleteBlog(id: string): Promise<Blog> {
  try {
    const result = await db
      .update(blogs)
      .set({
        isDeleted: true,
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(blogs.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error('Blog not found');
    }

    return result[0];
  } catch (error) {
    console.error('Error deleting blog:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to delete blog');
  }
}

/**
 * Restaure un blog supprimé
 */
export async function restoreBlog(id: string): Promise<Blog> {
  try {
    const result = await db
      .update(blogs)
      .set({
        isDeleted: false,
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(blogs.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error('Blog not found');
    }

    return result[0];
  } catch (error) {
    console.error('Error restoring blog:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to restore blog');
  }
}

/**
 * Active/désactive un blog
 */
export async function toggleBlogStatus(id: string): Promise<Blog> {
  try {
    const blog = await getBlogById(id);
    if (!blog) {
      throw new Error('Blog not found');
    }

    const result = await db
      .update(blogs)
      .set({
        isActive: !blog.isActive,
        updatedAt: new Date(),
      })
      .where(eq(blogs.id, id))
      .returning();

    return result[0];
  } catch (error) {
    console.error('Error toggling blog status:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to toggle blog status');
  }
}

// ============================================================================
// MÉTIERS - Actions spécifiques
// ============================================================================

/**
 * Incrémente le compteur de vues d'un blog
 */
export async function incrementBlogViews(
  blogId: string,
  userId?: string,
  sessionId?: string
): Promise<void> {
  try {
    // Créer une entrée de viewer
    await db.insert(viewers).values({
      entityId: blogId,
      entityType: 'BLOG',
      userId,
      sessionId,
      viewedAt: new Date(),
    });

    // Note: Si vous avez un champ viewCount dans la table blogs, vous pouvez l'incrémenter ici
  } catch (error) {
    console.error('Error incrementing blog views:', error);
    // Ne pas throw d'erreur pour ne pas bloquer l'affichage du blog
  }
}

/**
 * Récupère les blogs populaires (par nombre de vues)
 */
export async function getPopularBlogs(limit: number = 10): Promise<Blog[]> {
  try {
    // Récupérer les blogs avec le plus de vues
    const popularBlogs = await db
      .select({
        blog: blogs,
        viewCount: count(viewers.id).as('viewCount'),
      })
      .from(blogs)
      .leftJoin(viewers, and(
        eq(viewers.entityId, blogs.id),
        eq(viewers.entityType, 'BLOG')
      ))
      .where(eq(blogs.isActive, true))
      .groupBy(blogs.id)
      .orderBy(desc(sql`viewCount`))
      .limit(limit);

    return popularBlogs.map(item => item.blog);
  } catch (error) {
    console.error('Error getting popular blogs:', error);
    throw new Error('Failed to fetch popular blogs');
  }
}

/**
 * Recherche des blogs par titre ou contenu
 */
export async function searchBlogs(
  searchTerm: string,
  query: ListQuery<BlogFilters> = {}
): Promise<PaginationResponse<Blog>> {
  try {
    const { pagination = { page: 1, limit: 20 }, filters = {}, options = {} } = query;
    const offset = (pagination.page - 1) * pagination.limit;

    const whereConditions = and(
      or(
        ilike(blogs.title, `%${searchTerm}%`),
        ilike(blogs.content, `%${searchTerm}%`)
      ),
      buildBlogWhereConditions(filters, options)
    );

    const blogsQuery = db
      .select()
      .from(blogs)
      .where(whereConditions)
      .limit(pagination.limit)
      .offset(offset)
      .orderBy(desc(blogs.createdAt));

    const countQuery = db
      .select({ count: count() })
      .from(blogs)
      .where(whereConditions);

    const [blogsData, totalResult] = await Promise.all([
      blogsQuery,
      countQuery
    ]);

    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / pagination.limit);

    return {
      data: blogsData,
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
    console.error('Error searching blogs:', error);
    throw new Error('Failed to search blogs');
  }
}

// ============================================================================
// UTILITAIRES
// ============================================================================

/**
 * Construit les conditions WHERE pour les requêtes blogs
 */
function buildBlogWhereConditions(
  filters: BlogFilters,
  options: QueryOptions = {}
) {
  const conditions = [];

  // Filtres de base
  if (!options.includeDeleted) {
    conditions.push(eq(blogs.isDeleted, false));
  }
  if (!options.includeInactive) {
    conditions.push(eq(blogs.isActive, true));
  }

  // Filtres spécifiques
  if (filters.authorId) {
    conditions.push(eq(blogs.authorId, filters.authorId));
  }
  if (filters.title) {
    conditions.push(ilike(blogs.title, `%${filters.title}%`));
  }
  if (filters.content) {
    conditions.push(ilike(blogs.content, `%${filters.content}%`));
  }
  if (filters.hasImages) {
    conditions.push(isNull(blogs.images), sql`${blogs.images}::text[] IS NOT NULL AND array_length(${blogs.images}, 1) > 0`);
  }
  if (filters.createdFrom) {
    conditions.push(gte(blogs.createdAt, new Date(filters.createdFrom)));
  }
  if (filters.createdTo) {
    conditions.push(lte(blogs.createdAt, new Date(filters.createdTo)));
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}
