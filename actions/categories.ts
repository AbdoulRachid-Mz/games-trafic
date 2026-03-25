'use server';

import { categories, type Category, type NewCategory, entityCategories, type EntityCategory, type NewEntityCategory, type CategoryWithChildren } from '@/database/schema';
import { eq, and, or, like, ilike, inArray, desc, asc, sql, count, isNull, isNotNull, gte, lte, gt, lt, between, exists } from 'drizzle-orm';
import { type CategoryFilters, type ListQuery, type PaginationResponse, type QueryOptions } from '@/types/api';
import { db } from '@/lib/db';
import { cacheTag, cacheLife } from 'next/cache';
import { revalidateTag } from 'next/cache';

// ============================================================================
// QUERIES - Lecture des données
// ============================================================================

/**
 * Récupère une catégorie par son ID avec relations optionnelles
 */
export async function getCategoryById(
  id: string,
  options?: { populate?: string[] }
): Promise<CategoryWithChildren | null> {
  'use cache';
  cacheTag(`category-${id}`, 'categories');
  cacheLife('hours');
  try {
    if (options?.populate && options.populate.length > 0) {
      const query = db.query.categories.findFirst({
        where: (categories, { eq }) => eq(categories.id, id),
        with: {
          parent: options.populate.includes('parent') ? true : undefined,
          children: options.populate.includes('children') ? true : undefined,
          products: options.populate.includes('products') ? true : undefined,
          entityLinks: options.populate.includes('entityLinks') ? true : undefined,
        }
      });
      return (await query) ?? null;
    }

    const result = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error('Error getting category by ID:', error);
    throw new Error('Failed to fetch category');
  }
}

/**
 * Récupère une catégorie par son slug
 */
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  'use cache';
  cacheTag('categories');
  cacheLife('hours');
  try {
    const result = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, slug))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error('Error getting category by slug:', error);
    throw new Error('Failed to fetch category');
  }
}

/**
 * Liste les catégories avec pagination, filtres et options
 */
export async function getCategories(
  query: ListQuery<CategoryFilters> = {}
): Promise<PaginationResponse<Category>> {
  'use cache';
  cacheTag('categories');
  cacheLife('hours');
  try {
    const { pagination = { page: 1, limit: 50 }, filters = {}, options = {} } = query;
    const offset = (pagination.page - 1) * pagination.limit;

    const whereConditions = buildCategoryWhereConditions(filters, options);

    const categoriesQuery = db
      .select()
      .from(categories)
      .where(whereConditions)
      .limit(pagination.limit)
      .offset(offset);

    if (options.sortBy) {
      const sortField = options.sortBy as keyof Category;
      const sortOrder = options.sortOrder === 'desc' ? desc : asc;
      categoriesQuery.orderBy(sortOrder(categories[sortField]));
    } else {
      categoriesQuery.orderBy(asc(categories.sortOrder), asc(categories.name));
    }

    const countQuery = db
      .select({ count: count() })
      .from(categories)
      .where(whereConditions);

    const [categoriesData, totalResult] = await Promise.all([
      categoriesQuery,
      countQuery
    ]);

    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / pagination.limit);

    return {
      data: categoriesData,
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
    console.error('Error getting categories:', error);
    throw new Error('Failed to fetch categories');
  }
}

/**
 * Récupère les catégories racines (sans parent)
 */
export async function getRootCategories(options?: QueryOptions): Promise<Category[]> {
  'use cache';
  cacheTag('categories', 'category-tree');
  cacheLife('hours');
  try {
    const query = db
      .select()
      .from(categories)
      .where(isNull(categories.parentId))
      .orderBy(asc(categories.sortOrder), asc(categories.name));

    return await query;
  } catch (error) {
    console.error('Error getting root categories:', error);
    throw new Error('Failed to fetch root categories');
  }
}

/**
 * Récupère les sous-catégories d'une catégorie
 */
export async function getCategoryChildren(parentId: string): Promise<CategoryWithChildren[]> {
  'use cache';
  cacheTag('categories', `category-children-${parentId}`);
  cacheLife('hours');
  try {
    const query = db
      .select()
      .from(categories)
      .where(eq(categories.parentId, parentId))
      .orderBy(asc(categories.sortOrder), asc(categories.name));

    return await query;
  } catch (error) {
    console.error('Error getting category children:', error);
    throw new Error('Failed to fetch category children');
  }
}

/**
 * Récupère l'arborescence complète des catégories
 */
export async function getCategoryTree(): Promise<CategoryWithChildren[]> {
  'use cache';
  cacheTag('categories', 'category-tree');
  cacheLife('hours');
  try {
    const allCategories = await db
      .select()
      .from(categories)
      .where(eq(categories.isDeleted, false))
      .orderBy(asc(categories.level), asc(categories.sortOrder), asc(categories.name));

    // Construire l'arborescence
    const categoryMap = new Map<string, CategoryWithChildren>();
    const roots: CategoryWithChildren[] = [];

    allCategories.forEach(cat => {
      categoryMap.set(cat.id, { ...cat, children: [] });
    });

    allCategories.forEach(cat => {
      const category = categoryMap.get(cat.id)!;
      if (cat.parentId) {
        const parent = categoryMap.get(cat.parentId);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(category);
        }
      } else {
        roots.push(category);
      }
    });

    return roots;
  } catch (error) {
    console.error('Error getting category tree:', error);
    throw new Error('Failed to fetch category tree');
  }
}

/**
 * Récupère les catégories par type d'entité applicable
 */
export async function getCategoriesByEntityType(
  entityType: string,
  options?: QueryOptions
): Promise<Category[]> {
  'use cache';
  cacheTag('categories', `category-entity-${entityType}`);
  cacheLife('hours');
  try {
    // ✅ Correction: Utiliser le format PostgreSQL pour les tableaux
    // L'opérateur && vérifie si les tableaux se chevauchent
    // On doit passer un tableau PostgreSQL valide: `{ENTITY_TYPE}`
    const query = db
      .select()
      .from(categories)
      .where(
        and(
          eq(categories.isDeleted, false),
          sql`${categories.applicableEntities} && ARRAY[${entityType}]::entity_type[]`
        )
      )
      .orderBy(asc(categories.sortOrder), asc(categories.name));

    return await query;
  } catch (error) {
    console.error('Error getting categories by entity type:', error);
    throw new Error('Failed to fetch categories by entity type');
  }
}

/**
 * Récupère les statistiques des catégories
 */
export async function getCategoryStats(filters?: CategoryFilters) {
  'use cache';
  cacheTag('categories', 'stats');
  cacheLife('hours');
  try {
    const whereConditions = buildCategoryWhereConditions(filters || {});

    const [
      totalResult,
      activeResult,
      featuredResult,
      deletedResult,
      withChildrenResult
    ] = await Promise.all([
      db.select({ count: count() }).from(categories).where(whereConditions),
      db.select({ count: count() }).from(categories).where(and(whereConditions, eq(categories.isActive, true))),
      db.select({ count: count() }).from(categories).where(and(whereConditions, eq(categories.isFeatured, true))),
      db.select({ count: count() }).from(categories).where(and(whereConditions, eq(categories.isDeleted, true))),
      db.select({ count: count() }).from(categories).where(
        and(
          whereConditions,
          exists(
            db.select()
              .from(categories)
              .where(eq(sql`children.parent_id`, categories.id))
          )
        )
      )
    ]);

    const stats = {
      total: totalResult[0]?.count ?? 0,
      active: activeResult[0]?.count ?? 0,
      featured: featuredResult[0]?.count ?? 0,
      deleted: deletedResult[0]?.count ?? 0,
      withChildren: withChildrenResult[0]?.count ?? 0
    };

    return stats;
  } catch (error) {
    console.error('Error getting category stats:', error);
    throw new Error('Failed to fetch category statistics');
  }
}

// ============================================================================
// MUTATIONS - Écriture des données
// ============================================================================

/**
 * Crée une nouvelle catégorie
 */

export async function createCategory(categoryData: NewCategory): Promise<Category> {
  try {
    // Validation des données requises
    if (!categoryData.name || !categoryData.slug) {
      throw new Error('Name and slug are required');
    }

    // Vérification des doublons de slug
    const existingCategory = await getCategoryBySlug(categoryData.slug);
    if (existingCategory) {
      throw new Error('Category with this slug already exists');
    }

    // ✅ Correction: Gérer correctement parentId
    const parentId = categoryData.parentId && categoryData.parentId !== '' && categoryData.parentId !== 'null'
      ? categoryData.parentId
      : null;

    // Si parentId est fourni, vérifier que le parent existe
    if (parentId) {
      const parent = await getCategoryById(parentId);
      if (!parent) {
        throw new Error('Parent category not found');
      }
      // Calculer le niveau et le chemin
      const level = (parent.level || 0) + 1;
      const path = parent.path ? `${parent.path}/${categoryData.slug}` : categoryData.slug;
      const fullPath = parent.fullPath ? `${parent.fullPath}/${categoryData.name}` : categoryData.name;

      const result = await db
        .insert(categories)
        .values({
          ...categoryData,
          parentId,
          level,
          path,
          fullPath,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      revalidateTag('categories', 'max');
      revalidateTag('category-tree', 'max');
      return result[0];
    }

    // ✅ Correction: Pour les catégories racines, parentId doit être null
    const result = await db
      .insert(categories)
      .values({
        ...categoryData,
        parentId: null,
        level: 0,
        path: categoryData.slug,
        fullPath: categoryData.name,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    revalidateTag('categories', 'max');
    revalidateTag('category-tree', 'max');
    return result[0];
  } catch (error) {
    console.error('Error creating category:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to create category');
  }
}

/**
 * Met à jour une catégorie
 */
export async function updateCategory(
  id: string,
  categoryData: Partial<NewCategory>
): Promise<Category> {
  try {
    // Vérification que la catégorie existe
    const existingCategory = await getCategoryById(id);
    if (!existingCategory) {
      throw new Error('Category not found');
    }

    // Vérification des doublons de slug si le slug est modifié
    if (categoryData.slug && categoryData.slug !== existingCategory.slug) {
      const categoryWithSlug = await getCategoryBySlug(categoryData.slug);
      if (categoryWithSlug) {
        throw new Error('Slug already exists');
      }
    }

    // Si parentId est modifié, recalculer le niveau et le chemin
    if (categoryData.parentId !== undefined && categoryData.parentId !== existingCategory.parentId) {
      if (categoryData.parentId === null) {
        // Devenir une catégorie racine
        categoryData.level = 0;
        categoryData.path = categoryData.slug || existingCategory.slug;
        categoryData.fullPath = categoryData.name || existingCategory.name;
      } else {
        const parent = await getCategoryById(categoryData.parentId);
        if (!parent) {
          throw new Error('Parent category not found');
        }
        categoryData.level = (parent.level || 0) + 1;
        categoryData.path = parent.path ? `${parent.path}/${categoryData.slug || existingCategory.slug}` : (categoryData.slug || existingCategory.slug);
        categoryData.fullPath = parent.fullPath ? `${parent.fullPath}/${categoryData.name || existingCategory.name}` : (categoryData.name || existingCategory.name);
      }
    } else if (categoryData.slug || categoryData.name) {
      // Mettre à jour le chemin si le nom ou le slug change
      const parent = existingCategory.parentId ? await getCategoryById(existingCategory.parentId) : null;
      if (parent) {
        categoryData.path = parent.path ? `${parent.path}/${categoryData.slug || existingCategory.slug}` : (categoryData.slug || existingCategory.slug);
        categoryData.fullPath = parent.fullPath ? `${parent.fullPath}/${categoryData.name || existingCategory.name}` : (categoryData.name || existingCategory.name);
      } else {
        categoryData.path = categoryData.slug || existingCategory.slug;
        categoryData.fullPath = categoryData.name || existingCategory.name;
      }
    }

    const result = await db
      .update(categories)
      .set({
        ...categoryData,
        updatedAt: new Date(),
      })
      .where(eq(categories.id, id))
      .returning();

    revalidateTag('categories', 'max');
    revalidateTag('category-tree', 'max');
    revalidateTag(`category-${id}`, 'max');
    return result[0];
  } catch (error) {
    console.error('Error updating category:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to update category');
  }
}

/**
 * Supprime une catégorie (soft delete)
 */
export async function deleteCategory(id: string): Promise<Category> {
  try {
    // Vérifier s'il y a des sous-catégories
    const children = await getCategoryChildren(id);
    if (children.length > 0) {
      throw new Error('Cannot delete category with subcategories');
    }

    // Vérifier s'il y a des produits ou entités liées
    const linkedEntities = await db
      .select({ count: count() })
      .from(entityCategories)
      .where(eq(entityCategories.categoryId, id));

    if (linkedEntities[0]?.count > 0) {
      throw new Error('Cannot delete category with linked entities');
    }

    const result = await db
      .update(categories)
      .set({
        isDeleted: true,
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(categories.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error('Category not found');
    }

    revalidateTag('categories', 'max');
    revalidateTag('category-tree', 'max');
    revalidateTag(`category-${id}`, 'max');
    return result[0];
  } catch (error) {
    console.error('Error deleting category:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to delete category');
  }
}

/**
 * Restaure une catégorie supprimée
 */
export async function restoreCategory(id: string): Promise<Category> {
  try {
    const result = await db
      .update(categories)
      .set({
        isDeleted: false,
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(categories.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error('Category not found');
    }

    revalidateTag('categories', 'max');
    revalidateTag('category-tree', 'max');
    revalidateTag(`category-${id}`, 'max');
    return result[0];
  } catch (error) {
    console.error('Error restoring category:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to restore category');
  }
}

/**
 * Met à jour le compteur d'éléments d'une catégorie
 */
export async function updateCategoryItemCount(categoryId: string, increment: number = 1): Promise<Category> {
  try {
    const result = await db
      .update(categories)
      .set({
        itemCount: sql`item_count + ${increment}`,
        updatedAt: new Date(),
      })
      .where(eq(categories.id, categoryId))
      .returning();

    if (result.length === 0) {
      throw new Error('Category not found');
    }

    revalidateTag('categories', 'max');
    revalidateTag(`category-${categoryId}`, 'max');
    return result[0];
  } catch (error) {
    console.error('Error updating category item count:', error);
    throw new Error('Failed to update category item count');
  }
}

// ============================================================================
// ENTITY CATEGORIES - Gestion des liens entre catégories et entités
// ============================================================================

/**
 * Attache une catégorie à une entité
 */
export async function attachCategoryToEntity(
  entityId: string,
  entityType: string,
  categoryId: string
): Promise<EntityCategory> {
  try {
    // Vérifier que la catégorie existe
    const category = await getCategoryById(categoryId);
    if (!category) {
      throw new Error('Category not found');
    }

    // Vérifier que la catégorie accepte ce type d'entité
    if (!category.applicableEntities.includes(entityType as any)) {
      throw new Error('Category does not accept this entity type');
    }

    const result = await db
      .insert(entityCategories)
      .values({
        entityId,
        entityType: entityType as any,
        categoryId,
        createdAt: new Date(),
      })
      .returning();

    // Mettre à jour le compteur d'éléments
    await updateCategoryItemCount(categoryId, 1);

    revalidateTag('categories', 'max');
    return result[0];
  } catch (error) {
    console.error('Error attaching category to entity:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to attach category to entity');
  }
}

/**
 * Détache une catégorie d'une entité
 */
export async function detachCategoryFromEntity(
  entityId: string,
  entityType: string,
  categoryId: string
): Promise<void> {
  try {
    const result = await db
      .delete(entityCategories)
      .where(
        and(
          eq(entityCategories.entityId, entityId),
          eq(entityCategories.entityType, entityType as any),
          eq(entityCategories.categoryId, categoryId)
        )
      );

    if (result.count > 0) {
      // Mettre à jour le compteur d'éléments
      await updateCategoryItemCount(categoryId, -1);
      revalidateTag('categories', 'max');
    }
  } catch (error) {
    console.error('Error detaching category from entity:', error);
    throw new Error('Failed to detach category from entity');
  }
}

/**
 * Récupère les catégories attachées à une entité
 */
export async function getEntityCategories(
  entityId: string,
  entityType: string
): Promise<Category[]> {
  'use cache';
  cacheTag('categories', `entity-categories-${entityId}`);
  cacheLife('hours');
  try {
    const query = db
      .select({
        id: categories.id,
        name: categories.name,
        description: categories.description,
        slug: categories.slug,
        icon: categories.icon,
        color: categories.color,
        image: categories.image,
        parentId: categories.parentId,
        level: categories.level,
        path: categories.path,
        fullPath: categories.fullPath,
        sortOrder: categories.sortOrder,
        isFeatured: categories.isFeatured,
        isActive: categories.isActive,
        isDeleted: categories.isDeleted,
        metadata: categories.metadata,
        applicableEntities: categories.applicableEntities,
        itemCount: categories.itemCount,
        filters: categories.filters,
        createdAt: categories.createdAt,
        updatedAt: categories.updatedAt,
      })
      .from(entityCategories)
      .innerJoin(categories, eq(entityCategories.categoryId, categories.id))
      .where(
        and(
          eq(entityCategories.entityId, entityId),
          eq(entityCategories.entityType, entityType as any),
          eq(categories.isDeleted, false)
        )
      )
      .orderBy(asc(categories.sortOrder), asc(categories.name));

    return await query;
  } catch (error) {
    console.error('Error getting entity categories:', error);
    throw new Error('Failed to fetch entity categories');
  }
}

/**
 * Récupère les entités liées à une catégorie
 */
export async function getCategoryEntities(
  categoryId: string,
  entityType?: string
): Promise<EntityCategory[]> {
  'use cache';
  cacheTag('categories', `category-entities-${categoryId}`);
  cacheLife('hours');
  try {
    const conditions = [eq(entityCategories.categoryId, categoryId)];

    if (entityType) {
      conditions.push(eq(entityCategories.entityType, entityType as any));
    }

    const query = db
      .select()
      .from(entityCategories)
      .where(and(...conditions))
      .orderBy(desc(entityCategories.createdAt));

    return await query;
  } catch (error) {
    console.error('Error getting category entities:', error);
    throw new Error('Failed to fetch category entities');
  }
}

// ============================================================================
// UTILITAIRES
// ============================================================================

/**
 * Construit les conditions WHERE pour les requêtes categories
 */

function buildCategoryWhereConditions(
  filters: CategoryFilters,
  options: QueryOptions = {}
) {
  const conditions = [];

  // Filtres de base
  if (!options.includeDeleted) {
    conditions.push(eq(categories.isDeleted, false));
  }
  if (!options.includeInactive) {
    conditions.push(eq(categories.isActive, true));
  }

  // Filtres spécifiques
  if (filters.name) {
    conditions.push(ilike(categories.name, `%${filters.name}%`));
  }
  if (filters.slug) {
    conditions.push(ilike(categories.slug, `%${filters.slug}%`));
  }

  // ✅ Correction: parentId doit être null pour les catégories racines
  if (filters.parentId !== undefined) {
    if (filters.parentId === null || filters.parentId === '' || filters.parentId === 'null') {
      conditions.push(isNull(categories.parentId));
    } else {
      conditions.push(eq(categories.parentId, filters.parentId));
    }
  }

  if (filters.level !== undefined) {
    conditions.push(eq(categories.level, filters.level));
  }
  if (filters.path) {
    conditions.push(ilike(categories.path, `%${filters.path}%`));
  }
  if (filters.fullPath) {
    conditions.push(ilike(categories.fullPath, `%${filters.fullPath}%`));
  }

  // ✅ Correction: Format PostgreSQL correct pour les tableaux
  if (filters.applicableEntities && filters.applicableEntities.length > 0) {
    conditions.push(
      sql`${categories.applicableEntities} && ARRAY[${filters.applicableEntities.join(',')}]::entity_type[]`
    );
  }

  if (typeof filters.isFeatured === 'boolean') {
    conditions.push(eq(categories.isFeatured, filters.isFeatured));
  }

  // Filtres numériques
  if (filters.itemCountMin !== undefined) {
    conditions.push(gte(categories.itemCount, filters.itemCountMin));
  }
  if (filters.itemCountMax !== undefined) {
    conditions.push(lte(categories.itemCount, filters.itemCountMax));
  }
  if (filters.sortOrderMin !== undefined) {
    conditions.push(gte(categories.sortOrder, filters.sortOrderMin));
  }
  if (filters.sortOrderMax !== undefined) {
    conditions.push(lte(categories.sortOrder, filters.sortOrderMax));
  }

  // Filtres de date
  if (filters.startDate) {
    conditions.push(gte(categories.createdAt, new Date(filters.startDate)));
  }
  if (filters.endDate) {
    conditions.push(lte(categories.createdAt, new Date(filters.endDate)));
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}
