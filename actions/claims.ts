'use server';

import { claims, type Claim, type NewClaim, users, walletTransactions } from '@/database/schema';
import { eq, and, or, like, ilike, desc, asc, sql, count, inArray, isNull, isNotNull } from 'drizzle-orm';
import { type ClaimFilters, type ListQuery, type PaginationResponse, type QueryOptions } from '@/types/api';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';
import { assertAdmin, assertOwnerOrAdmin } from '@/lib/auth/permissions';

// ============================================================================
// QUERIES - Lecture des données
// ============================================================================

/**
 * Récupère une réclamation par son ID avec relations optionnelles
 */
export async function getClaimById(
  id: string,
  options?: { populate?: string[] }
): Promise<Claim | null> {
  try {
    if (options?.populate && options.populate.length > 0) {
      const query = db.query.claims.findFirst({
        where: (claims, { eq }) => eq(claims.id, id),
        with: {
          user: options.populate.includes('user') ? true : undefined,
          transaction: options.populate.includes('transaction') ? true : undefined,
        }
      });
      return (await query) ?? null;
    }

    const result = await db
      .select()
      .from(claims)
      .where(eq(claims.id, id))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error('Error getting claim by ID:', error);
    throw new Error('Failed to fetch claim');
  }
}

/**
 * Liste les réclamations avec pagination, filtres et options
 */
export async function getClaims(
  query: ListQuery<ClaimFilters> = {}
): Promise<PaginationResponse<Claim>> {
  try {
    const { pagination = { page: 1, limit: 50 }, filters = {}, options = {} } = query;
    const offset = (pagination.page - 1) * pagination.limit;

    const whereConditions = buildClaimWhereConditions(filters, options);

    const claimsQuery = db
      .select({
        claim: claims,
        user: {
          id: users.id,
          username: users.username,
          fullName: users.fullName,
          email: users.email,
          image: users.profileImage,
        },
      })
      .from(claims)
      .leftJoin(users, eq(claims.userId, users.id))
      .where(whereConditions)
      .limit(pagination.limit)
      .offset(offset);

    if (options.sortBy) {
      const sortField = options.sortBy as keyof Claim;
      const sortOrder = options.sortOrder === 'desc' ? desc : asc;
      claimsQuery.orderBy(sortOrder(claims[sortField]));
    } else {
      claimsQuery.orderBy(desc(claims.createdAt));
    }

    const countQuery = db
      .select({ count: count() })
      .from(claims)
      .where(whereConditions);

    const [claimsData, totalResult] = await Promise.all([
      claimsQuery,
      countQuery
    ]);

    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / pagination.limit);

    return {
      data: claimsData.map((row) => ({
        ...row.claim,
        user: row.user?.id ? row.user : null,
      })) as unknown as Claim[],
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
    console.error('Error getting claims:', error);
    throw new Error('Failed to fetch claims');
  }
}

/**
 * Récupère les statistiques des réclamations
 */
export async function getClaimStats(filters?: ClaimFilters) {
  try {
    const whereConditions = buildClaimWhereConditions(filters || {});

    const [
      totalResult,
      pendingResult,
      resolvedResult,
      deletedResult
    ] = await Promise.all([
      db.select({ count: count() }).from(claims).where(whereConditions),
      db.select({ count: count() }).from(claims).where(and(whereConditions, eq(claims.status, 'PENDING'))),
      db.select({ count: count() }).from(claims).where(and(whereConditions, inArray(claims.status, ['RESOLVED', 'CLOSED', 'REJECTED']))),
      db.select({ count: count() }).from(claims).where(and(whereConditions, eq(claims.isDeleted, true)))
    ]);

    const stats = {
      total: totalResult[0]?.count ?? 0,
      pending: pendingResult[0]?.count ?? 0,
      resolved: resolvedResult[0]?.count ?? 0,
      deleted: deletedResult[0]?.count ?? 0
    };

    return stats;
  } catch (error) {
    console.error('Error getting claim stats:', error);
    throw new Error('Failed to fetch claim statistics');
  }
}

/**
 * Récupère les réclamations d'un utilisateur
 */
export async function getUserClaims(
  userId: string,
  query: ListQuery<ClaimFilters> = {}
): Promise<PaginationResponse<Claim>> {
  try {
    const { pagination = { page: 1, limit: 20 }, filters = {}, options = {} } = query;
    const offset = (pagination.page - 1) * pagination.limit;

    const whereConditions = and(
      eq(claims.userId, userId),
      buildClaimWhereConditions(filters, options)
    );

    const claimsQuery = db
      .select()
      .from(claims)
      .where(whereConditions)
      .limit(pagination.limit)
      .offset(offset)
      .orderBy(desc(claims.createdAt));

    const countQuery = db
      .select({ count: count() })
      .from(claims)
      .where(whereConditions);

    const [claimsData, totalResult] = await Promise.all([
      claimsQuery,
      countQuery
    ]);

    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / pagination.limit);

    return {
      data: claimsData,
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
    console.error('Error getting user claims:', error);
    throw new Error('Failed to fetch user claims');
  }
}

// ============================================================================
// MUTATIONS - Écriture des données
// ============================================================================

/**
 * Crée une nouvelle réclamation
 */
export async function createClaim(claimData: NewClaim): Promise<Claim> {
  try {
    const sessionUser = await getCurrentUser();
    if (!sessionUser) {
      throw new Error('UNAUTHORIZED: Connexion requise pour créer une réclamation.');
    }
    // Enforce authenticated user ID (S4-01)
    claimData.userId = sessionUser.id;

    if (!claimData.type || !claimData.title || !claimData.description) {
      throw new Error('type, title and description are required');
    }

    // Anti-spam : max 3 réclamations ouvertes (PENDING / IN_PROGRESS) par utilisateur
    const [openClaims] = await db
      .select({ count: count() })
      .from(claims)
      .where(
        and(
          eq(claims.userId, sessionUser.id),
          eq(claims.isDeleted, false),
          inArray(claims.status, ['PENDING', 'IN_PROGRESS'])
        )
      );
    if ((openClaims?.count ?? 0) >= 3) {
      throw new Error(
        'Vous avez déjà 3 réclamations en cours. Attendez leur traitement avant d\'en soumettre une nouvelle.'
      );
    }

    // Vérification de la transaction si elle est fournie
    if (claimData.transactionId) {
      const transactionExists = await db
        .select({ id: walletTransactions.id })
        .from(walletTransactions)
        .where(eq(walletTransactions.id, claimData.transactionId))
        .limit(1);

      if (!transactionExists.length) {
        throw new Error('Transaction not found');
      }
    }

    // Préparation des données à insérer
    const insertData = {
      ...claimData,
      status: claimData.status || 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Si transactionId est une chaîne vide, le supprimer
    if (insertData.transactionId === '') {
      delete insertData.transactionId;
    }

    const result = await db
      .insert(claims)
      .values(insertData)
      .returning();

    return result[0];
  } catch (error) {
    console.error('Error creating claim:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to create claim');
  }
}

/**
 * Met à jour une réclamation
 */
export async function updateClaim(
  id: string,
  claimData: Partial<NewClaim>
): Promise<Claim> {
  try {
    const sessionUser = await getCurrentUser();
    if (!sessionUser) {
      throw new Error('UNAUTHORIZED: Connexion requise.');
    }

    const existingClaim = await getClaimById(id);
    if (!existingClaim) {
      throw new Error('Claim not found');
    }

    assertOwnerOrAdmin(sessionUser, existingClaim.userId);

    // Vérification de la transaction si elle est fournie
    if (claimData.transactionId) {
      const transactionExists = await db
        .select({ id: walletTransactions.id })
        .from(walletTransactions)
        .where(eq(walletTransactions.id, claimData.transactionId))
        .limit(1);

      if (!transactionExists.length) {
        throw new Error('Transaction not found');
      }
    }

    // Préparation des données à mettre à jour
    const updateData = {
      ...claimData,
      updatedAt: new Date(),
    };

    // Si transactionId est une chaîne vide, le supprimer
    if (updateData.transactionId === '') {
      delete updateData.transactionId;
    }

    const result = await db
      .update(claims)
      .set(updateData)
      .where(eq(claims.id, id))
      .returning();

    return result[0];
  } catch (error) {
    console.error('Error updating claim:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to update claim');
  }
}

/**
 * Change le statut d'une réclamation
 */
export async function updateClaimStatus(
  id: string,
  status: string,
  resolution?: string
): Promise<Claim> {
  try {
    const sessionUser = await getCurrentUser();
    assertAdmin(sessionUser);
    const allowedStatuses = ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED', 'CLOSED'];
    if (!allowedStatuses.includes(status)) {
      throw new Error('INVALID_STATUS: Statut non supporté.');
    }
    if ((status === 'RESOLVED' || status === 'REJECTED') && !resolution?.trim()) {
      throw new Error('Une résolution écrite est obligatoire pour résoudre ou rejeter.');
    }
    const result = await db
      .update(claims)
      .set({
        status,
        resolution,
        updatedAt: new Date(),
      })
      .where(eq(claims.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error('Claim not found');
    }

    return result[0];
  } catch (error) {
    console.error('Error updating claim status:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to update claim status');
  }
}

/**
 * Supprime une réclamation (soft delete)
 */
export async function deleteClaim(id: string): Promise<Claim> {
  try {
    const sessionUser = await getCurrentUser();
    assertAdmin(sessionUser);
    const result = await db
      .update(claims)
      .set({
        isDeleted: true,
        updatedAt: new Date(),
      })
      .where(eq(claims.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error('Claim not found');
    }

    return result[0];
  } catch (error) {
    console.error('Error deleting claim:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to delete claim');
  }
}

/**
 * Restaure une réclamation supprimée
 */
export async function restoreClaim(id: string): Promise<Claim> {
  try {
    const sessionUser = await getCurrentUser();
    assertAdmin(sessionUser);
    const result = await db
      .update(claims)
      .set({
        isDeleted: false,
        updatedAt: new Date(),
      })
      .where(eq(claims.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error('Claim not found');
    }

    return result[0];
  } catch (error) {
    console.error('Error restoring claim:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to restore claim');
  }
}

/**
 * Ajoute une preuve à une réclamation
 */
export async function addClaimEvidence(
  id: string,
  evidence: string,
  image?: string
): Promise<Claim> {
  try {
    const sessionUser = await getCurrentUser();
    if (!sessionUser) {
      throw new Error('UNAUTHORIZED: Connexion requise.');
    }
    const existingClaim = await getClaimById(id);
    if (!existingClaim) {
      throw new Error('Claim not found');
    }
    assertOwnerOrAdmin(sessionUser, existingClaim.userId);
    const result = await db
      .update(claims)
      .set({
        evidence,
        image,
        updatedAt: new Date(),
      })
      .where(eq(claims.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error('Claim not found');
    }

    return result[0];
  } catch (error) {
    console.error('Error adding claim evidence:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to add claim evidence');
  }
}

// ============================================================================
// UTILITAIRES
// ============================================================================

/**
 * Construit les conditions WHERE pour les requêtes claims
 */
function buildClaimWhereConditions(
  filters: ClaimFilters,
  options: QueryOptions = {}
) {
  const conditions = [];

  if (!options.includeDeleted) {
    conditions.push(eq(claims.isDeleted, false));
  }

  if (filters.userId) {
    conditions.push(eq(claims.userId, filters.userId));
  }

  if (filters.transactionId) {
    conditions.push(eq(claims.transactionId, filters.transactionId));
  }

  if (filters.type) {
    conditions.push(eq(claims.type, filters.type));
  }

  if (filters.title) {
    conditions.push(ilike(claims.title, `%${filters.title}%`));
  }

  if (filters.status && filters.status.length > 0) {
    conditions.push(inArray(claims.status, filters.status));
  }

  if (filters.hasEvidence === true) {
    conditions.push(isNotNull(claims.evidence));
  } else if (filters.hasEvidence === false) {
    conditions.push(isNull(claims.evidence));
  }

  if (filters.hasImage === true) {
    conditions.push(isNotNull(claims.image));
  } else if (filters.hasImage === false) {
    conditions.push(isNull(claims.image));
  }

  if (filters.createdFrom) {
    conditions.push(sql`${claims.createdAt} >= ${new Date(filters.createdFrom)}`);
  }

  if (filters.createdTo) {
    conditions.push(sql`${claims.createdAt} <= ${new Date(filters.createdTo)}`);
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}
