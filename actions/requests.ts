'use server';

import {
  requests,
  users,
  walletTransactions,
  gameItems,
  type Request,
  type NewRequest,
  type WalletTransaction,
  userWallets,
} from '@/database/schema';
import {
  eq,
  and,
  or,
  between,
  desc,
  asc,
  sql,
  count,
  gt,
  lt,
  gte,
  lte,
  inArray,
  isNull,
  isNotNull,
} from 'drizzle-orm';
import {
  type RequestFilters,
  type ListQuery,
  type PaginationResponse,
  type QueryOptions,
} from '@/types/api';
import { db } from '@/lib/db';

// ============================================================================
// QUERIES - Lecture des données
// ============================================================================

/**
 * Récupère une requête par son ID avec relations optionnelles
 */
export async function getRequestById(
  id: string,
  options?: { populate?: string[] }
): Promise<Request | null> {
  try {
    if (options?.populate && options.populate.length > 0) {
      const query = db.query.requests.findFirst({
        where: (requests, { eq }) => eq(requests.id, id),
        with: {
          user: options.populate.includes('user') ? true : undefined,
          gameItem: options.populate.includes('gameItem') ? true : undefined,
          transaction: options.populate.includes('transaction') ? true : undefined,
          processedBy: options.populate.includes('processedBy') ? true : undefined,
        },
      });
      return (await query) ?? null;
    }

    const result = await db
      .select()
      .from(requests)
      .where(eq(requests.id, id))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error('Error getting request by ID:', error);
    throw new Error('Failed to fetch request');
  }
}

/**
 * Récupère les requêtes d'un utilisateur
 */
export async function getUserRequests(
  userId: string,
  query: ListQuery<RequestFilters> = {}
): Promise<PaginationResponse<Request>> {
  try {
    const { pagination = { page: 1, limit: 50 }, filters = {}, options = {} } = query;
    const offset = (pagination.page - 1) * pagination.limit;

    // Construction des conditions WHERE
    const whereConditions = buildRequestWhereConditions(
      { ...filters, userId },
      options
    );

    // Requête pour les données
    const requestsQuery = db
      .select()
      .from(requests)
      .where(whereConditions)
      .limit(pagination.limit)
      .offset(offset);

    // Application du tri
    if (options.sortBy) {
      const sortField = options.sortBy as keyof Request;
      const sortOrder = options.sortOrder === 'desc' ? desc : asc;
      requestsQuery.orderBy(sortOrder(requests[sortField]));
    } else {
      requestsQuery.orderBy(desc(requests.createdAt));
    }

    // Requête pour le count total
    const countQuery = db
      .select({ count: count() })
      .from(requests)
      .where(whereConditions);

    const [requestsData, totalResult] = await Promise.all([
      requestsQuery,
      countQuery,
    ]);

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
        hasPrev: pagination.page > 1,
      },
    };
  } catch (error) {
    console.error('Error getting user requests:', error);
    throw new Error('Failed to fetch user requests');
  }
}

/**
 * Récupère les statistiques des requêtes
 */
export async function getRequestStats(filters?: RequestFilters) {
  try {
    const whereConditions = buildRequestWhereConditions(filters || {});

    const [
      totalResult,
      pendingResult,
      approvedResult,
      rejectedResult,
      completedResult,
      totalAmountResult,
    ] = await Promise.all([
      db.select({ count: count() }).from(requests).where(whereConditions),
      db
        .select({ count: count() })
        .from(requests)
        .where(and(whereConditions, eq(requests.status, 'PENDING'))),
      db
        .select({ count: count() })
        .from(requests)
        .where(and(whereConditions, eq(requests.status, 'APPROVED'))),
      db
        .select({ count: count() })
        .from(requests)
        .where(and(whereConditions, eq(requests.status, 'REJECTED'))),
      db
        .select({ count: count() })
        .from(requests)
        .where(and(whereConditions, eq(requests.status, 'COMPLETED'))),
      db
        .select({ total: sql<number>`sum(${requests.amount})` })
        .from(requests)
        .where(and(whereConditions, eq(requests.status, 'COMPLETED'))),
    ]);

    const stats = {
      total: totalResult[0]?.count ?? 0,
      pending: pendingResult[0]?.count ?? 0,
      approved: approvedResult[0]?.count ?? 0,
      rejected: rejectedResult[0]?.count ?? 0,
      completed: completedResult[0]?.count ?? 0,
      totalAmount: totalAmountResult[0]?.total ?? 0,
    };

    return stats;
  } catch (error) {
    console.error('Error getting request stats:', error);
    throw new Error('Failed to fetch request statistics');
  }
}

// ============================================================================
// MUTATIONS - Écriture des données
// ============================================================================

/**
 * Crée une nouvelle requête
 */
export async function createRequest(
  requestData: NewRequest
): Promise<Request> {
  try {
    // Validation des données requises
    if (!requestData.userId || !requestData.type || !requestData.amount) {
      throw new Error('userId, type and amount are required');
    }

    // Vérification de l'utilisateur
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, requestData.userId))
      .limit(1);

    if (!user[0]) {
      throw new Error('User not found');
    }

    // Pour les requêtes de type GAME_ITEMS, vérification de l'item
    if (requestData.type === 'GAME_ITEMS' && requestData.gameItemId) {
      const item = await db
        .select()
        .from(gameItems)
        .where(eq(gameItems.id, requestData.gameItemId))
        .limit(1);

      if (!item[0]) {
        throw new Error('Game item not found');
      }

      // Calcul du total GTC si quantity est fournie
      if (requestData.quantity) {
        const price = parseFloat(item[0].priceGtc);
        const qty = parseFloat(requestData.quantity);
        requestData.totalGtc = (price * qty).toFixed(2);
      }
    }

    const result = await db
      .insert(requests)
      .values({
        ...requestData,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Error creating request:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to create request');
  }
}

/**
 * Met à jour le statut d'une requête
 */
export async function updateRequestStatus(
  id: string,
  status: Request['status'],
  adminUserId?: string,
  rejectionReason?: string
): Promise<Request> {
  try {
    const updateData: Partial<NewRequest> = {
      status,
      updatedAt: new Date(),
    };

    if (adminUserId) {
      updateData.processedByUserId = adminUserId;
      updateData.processedAt = new Date();
    }

    if (rejectionReason) {
      updateData.rejectionReason = rejectionReason;
      updateData.rejectedAt = new Date();
      updateData.rejectedBy = adminUserId;
    }

    if (status === 'COMPLETED') {
      updateData.completedAt = new Date();
    }

    if (status === 'CANCELLED') {
      updateData.cancelledAt = new Date();
    }

    const result = await db
      .update(requests)
      .set(updateData)
      .where(eq(requests.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error('Request not found');
    }

    return result[0];
  } catch (error) {
    console.error('Error updating request status:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to update request status');
  }
}

/**
 * Approuve une requête et crée la transaction associée si nécessaire
 */
export async function approveRequest(
  id: string,
  adminUserId: string,
  options?: {
    createTransaction?: boolean;
    transactionMetadata?: Record<string, any>;
  }
): Promise<Request> {
  try {
    // Récupération de la requête
    const request = await getRequestById(id, { populate: ['user'] });
    if (!request) {
      throw new Error('Request not found');
    }

    if (request.status !== 'PENDING') {
      throw new Error('Request is not pending');
    }

    // Mise à jour du statut
    const updatedRequest = await updateRequestStatus(id, 'APPROVED', adminUserId);

    // Création de la transaction si demandé et si c'est un DEPOSIT/WITHDRAWAL
    if (options?.createTransaction && ['DEPOSIT', 'WITHDRAWAL'].includes(request.type)) {
      const wallet = await db
        .select()
        .from(userWallets)
        .where(eq(userWallets.userId, request.userId))
        .limit(1);

      if (wallet[0]) {
        const transactionData = {
          walletId: wallet[0].id,
          fromUserId: request.type === 'DEPOSIT' ? adminUserId : request.userId,
          toUserId: request.type === 'DEPOSIT' ? request.userId : adminUserId,
          amount: request.amount,
          fees: '0',
          netAmount: request.amount,
          balanceAfter: request.type === 'DEPOSIT' 
            ? (parseFloat(wallet[0].balance ?? '0') + parseFloat(request.amount)).toFixed(2)
            : (parseFloat(wallet[0].balance ?? '0') - parseFloat(request.amount)).toFixed(2),
          type: request.type as WalletTransaction['type'],
          status: 'COMPLETED' as const,
          description: `${request.type} request approved: ${request.id}`,
          metadata: {
            requestId: id,
            ...options.transactionMetadata,
          },
        };

        await db.insert(walletTransactions).values(transactionData);

        // Mise à jour du solde du wallet
        await db
          .update(userWallets)
          .set({ 
            balance: transactionData.balanceAfter,
            updatedAt: new Date(),
          })
          .where(eq(userWallets.id, wallet[0].id));
      }
    }

    return updatedRequest;
  } catch (error) {
    console.error('Error approving request:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to approve request');
  }
}

/**
 * Rejette une requête
 */
export async function rejectRequest(
  id: string,
  adminUserId: string,
  reason: string
): Promise<Request> {
  try {
    return await updateRequestStatus(id, 'REJECTED', adminUserId, reason);
  } catch (error) {
    console.error('Error rejecting request:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to reject request');
  }
}

/**
 * Annule une requête
 */
export async function cancelRequest(
  id: string,
  userId: string,
  reason?: string
): Promise<Request> {
  try {
    // Vérification que l'utilisateur est le propriétaire
    const request = await getRequestById(id);
    if (!request) {
      throw new Error('Request not found');
    }

    if (request.userId !== userId) {
      throw new Error('Unauthorized: You can only cancel your own requests');
    }

    if (request.status !== 'PENDING') {
      throw new Error('Only pending requests can be cancelled');
    }

    const result = await db
      .update(requests)
      .set({
        status: 'CANCELLED',
        cancellationReason: reason,
        cancelledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(requests.id, id))
      .returning();

    return result[0];
  } catch (error) {
    console.error('Error cancelling request:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to cancel request');
  }
}

/**
 * Supprime une requête (soft delete)
 */
export async function deleteRequest(id: string): Promise<Request> {
  try {
    const result = await db
      .update(requests)
      .set({
        isDeleted: true,
        updatedAt: new Date(),
      })
      .where(eq(requests.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error('Request not found');
    }

    return result[0];
  } catch (error) {
    console.error('Error deleting request:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to delete request');
  }
}

/**
 * Restaure une requête supprimée
 */
export async function restoreRequest(
  id: string
): Promise<Request> {
  try {
    const result = await db
      .update(requests)
      .set({
        isDeleted: false,
        updatedAt: new Date(),
      })
      .where(eq(requests.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error('Request not found');
    }

    return result[0];
  } catch (error) {
    console.error('Error restoring request:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to restore request');
  }
}

// ============================================================================
// UTILITAIRES
// ============================================================================

/**
 * Construit les conditions WHERE pour les requêtes
 */
function buildRequestWhereConditions(
  filters: RequestFilters,
  options: QueryOptions = {}
) {
  const conditions = [];
  // Filtres de base
  if (!options.includeDeleted) {
    conditions.push(eq(requests.isDeleted, false));
  }
  // Filtres spécifiques
  if (filters.id) {
    conditions.push(eq(requests.id, filters.id));
  }
  if (filters.userId) {
    conditions.push(eq(requests.userId, filters.userId));
  }
  if (filters.types && filters.types.length > 0) {
    conditions.push(inArray(requests.type, filters.types));
  }
  if (filters.statuses && filters.statuses.length > 0) {
    conditions.push(inArray(requests.status, filters.statuses));
  }
  if (filters.amountMin !== undefined) {
    conditions.push(gte(requests.amount, filters.amountMin.toString()));
  }
  if (filters.amountMax !== undefined) {
    conditions.push(lte(requests.amount, filters.amountMax.toString()));
  }
  if (filters.currency) {
    conditions.push(eq(requests.currency, filters.currency));
  }
  if (filters.paymentMethod && filters.paymentMethod.length > 0) {
    conditions.push(inArray(requests.paymentMethod, filters.paymentMethod));
  }
  if (filters.paymentProvider && filters.paymentProvider.length > 0) {
    conditions.push(inArray(requests.paymentProvider, filters.paymentProvider));
  }
  if (filters.rejectionReason) {
    conditions.push(
      sql`${requests.rejectionReason} ILIKE ${`%${filters.rejectionReason}%`}`
    );
  }
  if (filters.rejectedBy) {
    conditions.push(eq(requests.rejectedBy, filters.rejectedBy));
  }

  // Filtres de date
  if (filters.createdFrom) {
    conditions.push(
      gte(requests.createdAt, new Date(filters.createdFrom))
    );
  }
  if (filters.createdTo) {
    conditions.push(
      lte(requests.createdAt, new Date(filters.createdTo))
    );
  }
  if (filters.rejectedFrom) {
    conditions.push(
      gte(requests.rejectedAt, new Date(filters.rejectedFrom))
    );
  }
  if (filters.rejectedTo) {
    conditions.push(
      lte(requests.rejectedAt, new Date(filters.rejectedTo))
    );
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}
