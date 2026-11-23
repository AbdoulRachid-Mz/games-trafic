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
import {
  assertFinancialCooldown,
  calculateTransactionFees,
  executeDepositApproval,
  executeFinancialOperation,
  executeWithdrawalApproval,
  executeWithdrawalRejection,
  getOrCreateSystemAccount,
  hashRequestPayload,
  reserveWithdrawal,
} from '@/lib/finance';
import {
  consumePasskeyProofForIntent,
  type PasskeyProof,
} from '@/actions/passkey-transaction';
import { verifyWalletPin } from '@/actions/wallets';
import { getCurrentUser } from '@/lib/auth/session';
import { assertCanApproveRequests, getAdminLevel, isAdmin } from '@/lib/auth/permissions';
import { loadAdminActor } from '@/lib/finance/requests/credit-requests';

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
  options?: {
    allowDuplicate?: boolean;
    idempotencyKey?: string;
    pin?: string;
    passkeyProof?: PasskeyProof;
  }
): Promise<Request> {
  try {
    // Validation des données requises
    if (!requestData.userId || !requestData.type || !requestData.amount) {
      throw new Error('userId, type and amount are required');
    }

    // Un utilisateur ne peut créer une demande que pour lui-même.
    const sessionUser = await getCurrentUser();
    if (!sessionUser) {
      throw new Error('Non autorisé : aucune session active trouvée');
    }
    if (requestData.userId !== sessionUser.id && !isAdmin(sessionUser)) {
      throw new Error("Non autorisé à créer une demande pour un autre utilisateur");
    }

    const idempotencyKey =
      typeof options?.idempotencyKey === 'string' ? options.idempotencyKey.trim() : '';
    if (!idempotencyKey) {
      throw new Error('IDEMPOTENCY_KEY_REQUIRED: une clé d\'idempotence déterministe est requise.');
    }

    // Anti-doublon métier conservé (hors retries idempotents stricts gérés plus bas).
    // allowDuplicate reste accepté pour compatibilité d'appel mais ne contourne pas
    // les contrôles serveur de cooldown/idempotence/intégrité.
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

      // 🛡️ Quantity/total Système de vérité = le serveur (jamais le client) :
      // - quantity arrive top-level (la colonne requests.quantity) — était
      //   envoyée dans metadata et donc jamais lue/validation automatisée;
      // - quantité entière >= 1 ;
      // - totalGtc recalculé depuis priceGtc en base ;
      // - amount est ÉCRASÉ par ce total : un client ne peut pas sous-déclarer
      //   le montant d'un achat en manipulant la quantité ou le montant.
      if (requestData.quantity != null) {
        const qty = Math.round(Number(requestData.quantity));
        if (!Number.isFinite(qty) || qty < 1) {
          throw new Error('Quantité invalide');
        }
        const price = parseFloat(item[0].priceGtc);
        if (!Number.isFinite(price) || price <= 0) {
          throw new Error('Article sans prix valide — commande impossible');
        }
        const total = (price * qty).toFixed(2);
        requestData.totalGtc = total;
        requestData.quantity = qty.toString();
        requestData.amount = total;
      }
    }

    const encryptedPassword = requestData.encryptedPassword
      ? encryptData(requestData.encryptedPassword)
      : undefined;

    const result = await db.transaction(async (tx) => {
      const cooldownScope = 'request:create';
      const cooldownPayload = {
        userId: requestData.userId,
        type: requestData.type,
        amount: String(requestData.amount),
        currency: requestData.currency ?? null,
        paymentMethod: requestData.paymentMethod ?? null,
        paymentProvider: requestData.paymentProvider ?? null,
        paymentAccountId: requestData.paymentAccountId ?? null,
        gameItemId: requestData.gameItemId ?? null,
        gameAccount: requestData.gameAccount ?? null,
        quantity: requestData.quantity ?? null,
        totalGtc: requestData.totalGtc ?? null,
      };
      const requestHash = hashRequestPayload(cooldownPayload);

      // Replay idempotent strict (meme cle+payload) : retourner la demande
      // existante sans consommer le cooldown (retry de la meme intention).
      const [existingIdempotent] = await tx
        .select()
        .from(requests)
        .where(
          and(
            eq(requests.userId, requestData.userId),
            eq(requests.type, requestData.type),
            sql`${requests.metadata}->>'idempotencyKey' = ${idempotencyKey}`,
            sql`${requests.metadata}->>'idempotencyScope' = ${cooldownScope}`,
            sql`${requests.metadata}->>'requestHash' = ${requestHash}`
          )
        )
        .limit(1);

      if (existingIdempotent) {
        return existingIdempotent;
      }

      // Cooldown 120s consomme une fois pour cette intention utilisateur.
      // La sous-operation de reservation retrait ne doit pas le re-consommer.
      await assertFinancialCooldown(tx, {
        userId: requestData.userId,
        idempotency: {
          scope: cooldownScope,
          key: idempotencyKey,
          payload: cooldownPayload,
        },
      });

      // Re-verification apres verrou cooldown (course concurrente).
      const [existingAfterLock] = await tx
        .select()
        .from(requests)
        .where(
          and(
            eq(requests.userId, requestData.userId),
            eq(requests.type, requestData.type),
            sql`${requests.metadata}->>'idempotencyKey' = ${idempotencyKey}`,
            sql`${requests.metadata}->>'idempotencyScope' = ${cooldownScope}`,
            sql`${requests.metadata}->>'requestHash' = ${requestHash}`
          )
        )
        .limit(1);
      if (existingAfterLock) {
        return existingAfterLock;
      }

      const [created] = await tx
        .insert(requests)
        .values({
          ...requestData,
          encryptedPassword: encryptedPassword || requestData.encryptedPassword,
          metadata: {
            ...((requestData.metadata as Record<string, unknown>) ?? {}),
            idempotencyKey,
            idempotencyScope: cooldownScope,
            requestHash,
          },
          status: 'PENDING',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      // Un retrait reserve immediatement montant + frais (wallet -> escrow)
      // afin d'empecher tout double spend avant l'approbation.
      if (created.type === 'WITHDRAWAL') {
        const [wallet] = await tx
          .select()
          .from(userWallets)
          .where(eq(userWallets.userId, created.userId))
          .limit(1);

        if (!wallet?.financialAccountId) {
          throw new Error('Wallet financier introuvable pour le retrait');
        }

        // Opération initiée par le propriétaire : preuve PIN/passkey consommée à l'exécution.
        if (sessionUser.id === created.userId) {
          const hasPin = typeof options?.pin === 'string' && options.pin.length > 0;
          const hasPasskeyProof = !!options?.passkeyProof?.challengeId && !!options?.passkeyProof?.assertion;
          if (hasPasskeyProof) {
            const [owner] = await tx
              .select({ isVip: users.isVip })
              .from(users)
              .where(eq(users.id, created.userId))
              .limit(1);
            const feeCalc = await calculateTransactionFees('WITHDRAWAL', Number(created.amount), {
              isVip: !!owner?.isVip,
            });
            await consumePasskeyProofForIntent(tx, {
              userId: sessionUser.id,
              proof: options!.passkeyProof!,
              intent: {
                walletId: wallet.id,
                transactionType: 'WITHDRAWAL',
                amount: Number(created.amount),
                recipientId: null,
                fees: feeCalc.fees,
              },
            });
          } else if (hasPin) {
            const pinResult = await verifyWalletPin(wallet.id, options!.pin!);
            if (!pinResult.success) {
              throw new Error(pinResult.error || 'Code PIN incorrect.');
            }
          } else if (wallet.pinHash) {
            throw new Error('Code PIN ou preuve Passkey requis pour effectuer cette opération.');
          }
        }

        await reserveWithdrawal({
          requestId: created.id,
          userId: created.userId,
          walletId: wallet.id,
          walletAccountId: wallet.financialAccountId,
          amount: Number(created.amount),
          actorId: sessionUser.id,
          actorLevel: getAdminLevel(sessionUser),
          client: tx,
        });
      }

      return created;
    });

    return result;
  } catch (error) {
    console.error('Error creating request:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to create request');
  }
}

/**
 * Update request status.
 * Admin-only low-level mutation. Financial completion must go through approve/reject/cancel workflows.
 */
export async function updateRequestStatus(
  id: string,
  status: Request['status'],
  adminUserId?: string,
  rejectionReason?: string
): Promise<Request> {
  try {
    const sessionUser = await getCurrentUser();
    assertCanApproveRequests(sessionUser);

    const existing = await getRequestById(id);
    if (!existing) {
      throw new Error('Request not found');
    }

    if (
      status === 'COMPLETED' &&
      ['DEPOSIT', 'WITHDRAWAL', 'GAME_ITEMS', 'VIP_SUBSCRIPTION'].includes(existing.type)
    ) {
      throw new Error(
        'INVALID_FLOW: la complétion financière doit passer par le workflow canonique d’approbation/règlement.'
      );
    }

    const updateData: Partial<NewRequest> = {
      status,
      updatedAt: new Date(),
    };

    const effectiveAdminId = adminUserId || sessionUser?.id;
    if (effectiveAdminId) {
      updateData.processedByUserId = effectiveAdminId;
      updateData.processedAt = new Date();
    }

    if (rejectionReason) {
      updateData.rejectionReason = rejectionReason;
      updateData.rejectedAt = new Date();
      updateData.rejectedBy = effectiveAdminId;
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
  adminUserIdParam?: string
) {
  // Authenticate admin from session (P0-F6 / P1-02)
  const sessionUser = await getCurrentUser();
  assertCanApproveRequests(sessionUser);

  if (!sessionUser) {
    throw new Error('Non autorisé : aucune session active trouvée');
  }
  const effectiveAdminId = sessionUser.id;

  return await db.transaction(async (tx) => {
    // Autorité relue en base : le niveau de session n'est jamais utilisé.
    const actor = await loadAdminActor(tx, effectiveAdminId);
    const adminLevel = actor.level;

    const request = await tx
      .select()
      .from(requests)
      .where(eq(requests.id, id))
      .for("update")
      .then((rows) => rows[0]);

    if (!request) throw new Error("Request not found");
    if (request.status !== "PENDING")
      throw new Error("Request is not pending");

    // Refuse self-approval (P0-F6)
    if (request.userId === effectiveAdminId) {
      throw new Error("UNAUTHORIZED: L'auto-approbation d'une demande est strictement interdite.");
    }

    const wallet = await tx.query.userWallets.findFirst({
      where: eq(userWallets.userId, request.userId),
    });

    if (!wallet?.financialAccountId)
      throw new Error("User financial account missing");

    const amount = Number(request.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error("Montant de demande invalide");
    }

    const description = `Approbation de la demande ${request.type} ${request.id}`;
    let transaction;

    // ====================================================
    // 💰 DEPOSIT — crédit depuis SYSTEM_EXTERNAL_CLEARING
    // ====================================================
    if (request.type === "DEPOSIT") {
      const result = await executeDepositApproval({
        requestId: request.id,
        userId: request.userId,
        walletId: wallet.id,
        walletAccountId: wallet.financialAccountId,
        amount,
        actorId: effectiveAdminId,
        actorLevel: adminLevel,
        description,
        client: tx,
      });
      transaction = result.transaction;
    }

    // ====================================================
    // 💸 WITHDRAWAL — réservation → clearing externe
    // ====================================================
    else if (request.type === "WITHDRAWAL") {
      const result = await executeWithdrawalApproval({
        requestId: request.id,
        userId: request.userId,
        walletId: wallet.id,
        walletAccountId: wallet.financialAccountId,
        amount,
        actorId: effectiveAdminId,
        actorLevel: adminLevel,
        description,
        client: tx,
      });
      transaction = result.transaction;
    }
    // ====================================================
    // 🎮 GAME ITEMS — achat, recette plateforme
    // ====================================================
    else if (request.type === "GAME_ITEMS") {
      const feeAccount = await getOrCreateSystemAccount(tx, "FEES");

      const result = await executeFinancialOperation({
        kind: "POST",
        type: "GAME_ITEM_PURCHASE",
        status: "COMPLETED",
        amount,
        walletId: wallet.id,
        walletAccountId: wallet.financialAccountId,
        fromUserId: request.userId,
        toUserId: null,
        description,
        reason: description,
        metadata: {
          requestId: request.id,
          gameItemId: request.gameItemId,
          approvedBy: effectiveAdminId,
          approverLevel: adminLevel,
        },
        postings: [
          { accountId: wallet.financialAccountId, debit: amount },
          { accountId: feeAccount.id, credit: amount },
        ],
        netAmount: 0,
        createdByUserId: effectiveAdminId,
        actorLevel: adminLevel,
        idempotencyKey: `request-approval:${request.id}`,
        idempotencyScope: "request:approval",
        client: tx,
      });
      transaction = result.transaction;
    } else {
      throw new Error("Unsupported request type");
    }

    // 📝 Update request
    await tx
      .update(requests)
      .set({
        status: "COMPLETED",
        processedByUserId: effectiveAdminId,
        approvedBy: effectiveAdminId,
        approvedAt: new Date(),
        processedAt: new Date(),
        completedAt: new Date(),
        transactionId: transaction.id,
        updatedAt: new Date(),
      })
      .where(eq(requests.id, id));

    return transaction;
  });
}


/**
 * Libère la réservation d'un retrait encore PENDING (rejet ou annulation).
 * Sans réservation (demande historique), aucun mouvement financier.
 */
async function releaseWithdrawalReservation(
  requestId: string,
  reason: string,
  actorId: string,
  actorLevel?: 'A' | 'B' | 'C'
): Promise<void> {
  const [request] = await db
    .select()
    .from(requests)
    .where(eq(requests.id, requestId))
    .limit(1);

  if (
    !request ||
    request.type !== 'WITHDRAWAL' ||
    request.status !== 'PENDING'
  ) {
    return;
  }

  const [wallet] = await db
    .select()
    .from(userWallets)
    .where(eq(userWallets.userId, request.userId))
    .limit(1);

  if (!wallet?.financialAccountId) return;

  await executeWithdrawalRejection({
    requestId,
    walletId: wallet.id,
    walletAccountId: wallet.financialAccountId,
    actorId,
    actorLevel,
    reason,
  });
}

/**
 * Reject a request
 */
export async function rejectRequest(
  id: string,
  reasonOrAdminId?: string,
  reasonParam?: string
): Promise<Request> {
  try {
    const sessionUser = await getCurrentUser();
    assertCanApproveRequests(sessionUser);

    if (!sessionUser) {
      throw new Error('Non autorisé : aucune session active trouvée');
    }
    
    const effectiveAdminId = sessionUser.id;
    // Support both signatures: rejectRequest(id, reason) and legacy rejectRequest(id, adminUserId, reason)
    const effectiveReason = reasonParam !== undefined
      ? reasonParam
      : (reasonOrAdminId || "Demande rejetée par l'administrateur");

    const [pendingRequest] = await db
      .select({ id: requests.id, status: requests.status })
      .from(requests)
      .where(eq(requests.id, id))
      .limit(1);

    if (!pendingRequest) {
      throw new Error('Request not found');
    }
    if (pendingRequest.status !== 'PENDING') {
      throw new Error('Seule une demande en attente peut être rejetée');
    }

    await releaseWithdrawalReservation(
      id,
      effectiveReason,
      effectiveAdminId,
      getAdminLevel(sessionUser)
    );

    return await updateRequestStatus(id, 'REJECTED', effectiveAdminId, effectiveReason);
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
    const sessionUser = await getCurrentUser();
    if (!sessionUser) {
      throw new Error('Non autorisé : aucune session active trouvée');
    }

    // Verify that the user is the owner
    const request = await getRequestById(id);
    if (!request) {
      throw new Error('Request not found');
    }

    if (
      request.userId !== userId ||
      (request.userId !== sessionUser.id && !isAdmin(sessionUser))
    ) {
      throw new Error('Unauthorized: You can only cancel your own requests');
    }

    if (request.status !== 'PENDING') {
      throw new Error('Only pending requests can be cancelled');
    }

    await releaseWithdrawalReservation(
      id,
      reason || 'Annulation par le demandeur',
      request.userId
    );

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
 * Supprime une requête (soft delete). Admin uniquement.
 */
export async function deleteRequest(id: string): Promise<Request> {
  try {
    const sessionUser = await getCurrentUser();
    assertCanApproveRequests(sessionUser);

    const existing = await getRequestById(id);
    if (!existing) {
      throw new Error('Request not found');
    }
    if (existing.status === 'PENDING' && existing.type === 'WITHDRAWAL') {
      throw new Error(
        'INVALID_FLOW: annulez/rejetez d’abord une demande de retrait en attente pour libérer la réservation.'
      );
    }

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
