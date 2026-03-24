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
  NewWalletTransaction,
  type RequestWithRelations,
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
import { encryptData, decryptData } from '@/lib/encryption';
import { executeTransaction, getOrCreatePlatformAccount } from '@/lib/ledger/ledger-utils';
import { createTransaction } from './wallets';
import { getCurrentUser } from '@/lib/auth/session';

// ============================================================================
// QUERIES - Lecture des données
// ============================================================================
//type requests
export type RequestType = 'DEPOSIT' | 'WITHDRAWAL' | 'GAME_ITEMS' | 'OTHER';

/**
 * Récupère une requête par son ID avec relations optionnelles
 */
export async function getRequestById(
  id: string,
  options?: { populate?: string[] }
): Promise<RequestWithRelations | null> {
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
      return (await query) as RequestWithRelations ?? null;
    }

    const result = await db
      .select()
      .from(requests)
      .where(eq(requests.id, id))
      .limit(1);

    return (result[0] as RequestWithRelations) || null;
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
): Promise<PaginationResponse<RequestWithRelations>> {
  try {
    const { pagination = { page: 1, limit: 50 }, filters = {}, options = {} } = query;
    const offset = (pagination.page - 1) * pagination.limit;

    // Construction des conditions WHERE
    const whereConditions = buildRequestWhereConditions(
      { ...filters, userId },
      options
    );

    // Requête pour les données avec relations
    const requestsData = await db.query.requests.findMany({
      where: whereConditions,
      limit: pagination.limit,
      offset: offset,
      orderBy: (requests, { desc, asc }) => [
        options.sortBy
          ? options.sortOrder === "asc"
            ? asc((requests as any)[options.sortBy])
            : desc((requests as any)[options.sortBy])
          : desc(requests.createdAt),
      ],
      with: {
        user: true,
        gameItem: true,
        transaction: true,
        processedBy: true,
      },
    });

    // Requête pour le count total
    const countQuery = db
      .select({ count: count() })
      .from(requests)
      .where(whereConditions);

    const [totalResult] = await Promise.all([countQuery]);

    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / pagination.limit);

    return {
      data: requestsData as RequestWithRelations[],
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

/**
 * Liste les requêtes (admin)
 */
export async function getRequests(
  query: ListQuery<RequestFilters> = {}
): Promise<PaginationResponse<RequestWithRelations>> {
  try {
    const { pagination = { page: 1, limit: 50 }, filters = {}, options = {} } = query;
    const offset = (pagination.page - 1) * pagination.limit;

    const whereConditions = buildRequestWhereConditions(filters, options);

    const data = await db.query.requests.findMany({
      where: whereConditions,
      limit: pagination.limit,
      offset: offset,
      orderBy: (requests, { desc, asc }) => [
        options.sortBy
          ? options.sortOrder === "asc"
            ? asc((requests as any)[options.sortBy])
            : desc((requests as any)[options.sortBy])
          : desc(requests.createdAt),
      ],
      with: {
        user: true,
        gameItem: true,
        transaction: true,
        processedBy: true,
      },
    });

    const countQuery = db
      .select({ count: count() })
      .from(requests)
      .where(whereConditions);

    const [totalResult] = await Promise.all([countQuery]);
    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / pagination.limit);

    return {
      data: data as RequestWithRelations[],
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
    console.error('Error getting requests:', error);
    throw new Error('Failed to fetch requests');
  }
}

// ============================================================================
// MUTATIONS - Écriture des données
// ============================================================================

/**
 * Crée une nouvelle requête
 */
export async function createRequest(
  requestData: NewRequest,
  options?: { allowDuplicate?: boolean }
): Promise<Request> {
  try {
    // Validation des données requises
    if (!requestData.userId || !requestData.type || !requestData.amount) {
      throw new Error('userId, type and amount are required');
    }

    if (!options?.allowDuplicate) {
      const existing = await db
        .select({ id: requests.id })
        .from(requests)
        .where(
          and(
            eq(requests.userId, requestData.userId),
            eq(requests.type, requestData.type),
            inArray(requests.status, ['PENDING', 'PROCESSING'])
          )
        )
        .limit(1);
      if (existing.length > 0) {
        throw new Error('Une transaction du même type est déjà en cours');
      }
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

    const last = await db
      .select()
      .from(requests)
      .where(eq(requests.userId, requestData.userId))
      .orderBy(desc(requests.createdAt))
      .limit(1);
    if (last[0]?.createdAt) {
      const lastDate = new Date(last[0].createdAt as any).getTime();
      const now = Date.now();
      const minWait = 120_000;
      const diff = now - lastDate;
      if (diff < minWait) {
        const remaining = Math.ceil((minWait - diff) / 1000);
        throw new Error(`Veuillez patienter ${remaining}s avant une nouvelle demande`);
      }
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

    const encryptedPassword = requestData.encryptedPassword
      ? encryptData(requestData.encryptedPassword)
      : undefined;

    const result = await db
      .insert(requests)
      .values({
        ...requestData,
        encryptedPassword: encryptedPassword || requestData.encryptedPassword,
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
 * Update request status
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
 * Approve a request and create the associated transaction if necessary
 * Uses ledger-based wallet transactions instead of manual balance updates
 */
export async function approveRequest(
  id: string,
  adminUserId: string
) {
  return await db.transaction(async (tx) => {
    const request = await tx
      .select()
      .from(requests)
      .where(eq(requests.id, id))
      .for("update")
      .then((rows) => rows[0]);

    if (!request) throw new Error("Request not found");
    if (request.status !== "PENDING")
      throw new Error("Request is not pending");

    const wallet = await tx.query.userWallets.findFirst({
      where: eq(userWallets.userId, request.userId),
    });

    if (!wallet?.financialAccountId)
      throw new Error("User financial account missing");

    let fromAccountId: string;
    let toAccountId: string;

    // ====================================================
    // 💰 DEPOSIT
    // ====================================================
    if (request.type === "DEPOSIT") {
      const systemAccount = await getOrCreatePlatformAccount(
        tx,
        "SYSTEM_ADJUSTMENT"
      );

      fromAccountId = systemAccount.id;
      toAccountId = wallet.financialAccountId;
    }

    // ====================================================
    // 💸 WITHDRAWAL
    // ====================================================
    else if (request.type === "WITHDRAWAL") {
      const escrow = await getOrCreatePlatformAccount(tx, "PLATFORM_ESCROW");

      fromAccountId = wallet.financialAccountId;
      toAccountId = escrow.id;
    }
    // ====================================================
    // 🎮 GAME ITEMS (Purchase)
    // ====================================================
    else if (request.type === "GAME_ITEMS") {
      const platformFees = await getOrCreatePlatformAccount(tx, "PLATFORM_FEES");

      fromAccountId = wallet.financialAccountId;
      toAccountId = platformFees.id;
    } else {
      throw new Error("Unsupported request type");
    }

    // 🚀 EXECUTE DOUBLE ENTRY
    const result = await executeTransaction({
      fromAccountId,
      toAccountId,
      amount: Number(request.amount),
      type: request.type as ("PURCHASE" | "VIP_SUBSCRIPTION" | "GAME_ITEM_PURCHASE" | "THEME_PURCHASE" | "DEPOSIT" | "WITHDRAWAL" | "REFUND" | "TRANSFER" | "ORDER_PURCHASE" | "TOURNAMENT_PARTICIPATION" | "BONUS"),
      description: `Approved ${request.type} request ${request.id}`,
      metadata: {
        requestId: request.id,
        approvedBy: adminUserId,
      },
      walletId: wallet.id,
      userId: request.userId,
      tx, // Pass the transaction context
    });

    // 📝 Update request
    await tx
      .update(requests)
      .set({
        status: "COMPLETED",
        processedByUserId: adminUserId,
        processedAt: new Date(),
        completedAt: new Date(),
        transactionId: result.transaction.id,
        updatedAt: new Date(),
      })
      .where(eq(requests.id, id));

    return result.transaction;
  });
}


/**
 * Reject a request
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
 * Cancel a request
 */
export async function cancelRequest(
  id: string,
  userId: string,
  reason?: string
): Promise<Request> {
  try {
    // Verify that the user is the owner
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

export async function getRequestCredentialsForAdmin(requestId: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("Accès refusé");
  }
  const request = await getRequestById(requestId);
  if (!request) {
    throw new Error("Request not found");
  }
  const decryptedPassword = request.encryptedPassword
    ? decryptData(request.encryptedPassword)
    : "";
  return {
    gameAccount: request.gameAccount || null,
    password: decryptedPassword || null,
  };
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
