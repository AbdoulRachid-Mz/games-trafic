"use server";

import {
  walletTransactions,
  userWallets,
  vipSubscriptions, type WalletTransaction,
  type NewWalletTransaction, users, registrationPayments,
  requests
} from "@/database/schema";
import {
  eq,
  and, desc,
  asc,
  sql,
  count, gte,
  lte,
  inArray
} from "drizzle-orm";
import {
  type WalletTransactionFilters,
  type ListQuery,
  type PaginationResponse,
  type QueryOptions,
} from "@/types/api";
import { db } from "@/lib/db";
import { getAppSettings } from "./app-settings";
import { getUserWalletById } from "./wallets";
import { getCurrentUser } from "@/lib/auth/session";
import {
  executeTransaction,
  getOrCreatePlatformAccount
} from "@/lib/ledger/ledger-utils";

// ============================================================================
// QUERIES - Lecture des données
// ============================================================================

/**
 * Récupère une transaction par son ID avec relations optionnelles
 */
export async function getTransactionById(
  id: string,
  options?: { populate?: string[] }
): Promise<WalletTransaction | null> {
  try {
    if (options?.populate && options.populate.length > 0) {
      const query = db.query.walletTransactions.findFirst({
        where: (walletTransactions, { eq }) => eq(walletTransactions.id, id),
        with: {
          wallet: options.populate.includes("wallet") ? true : undefined,
          fromUser: options.populate.includes("fromUser") ? true : undefined,
          toUser: options.populate.includes("toUser") ? true : undefined,
          vipSubscription: options.populate.includes("vipSubscription")
            ? true
            : undefined,
          gameItemRequests: options.populate.includes("gameItemRequests")
            ? true
            : undefined,
        },
      });
      return (await query) ?? null;
    }

    const result = await db
      .select()
      .from(walletTransactions)
      .where(eq(walletTransactions.id, id))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error("Error getting transaction by ID:", error);
    throw new Error("Failed to fetch transaction");
  }
}

/**
 * Récupère les transactions d'un wallet
 */
export async function getWalletTransactions(
  walletId: string,
  query: ListQuery<WalletTransactionFilters> = {}
): Promise<PaginationResponse<WalletTransaction>> {
  try {
    const {
      pagination = { page: 1, limit: 50 },
      filters = {},
      options = {},
    } = query;
    const offset = (pagination.page - 1) * pagination.limit;

    // Construction des conditions WHERE
    const whereConditions = buildTransactionWhereConditions(
      { ...filters, walletId },
      options
    );

    // Requête pour les données
    const transactionsQuery = db
      .select()
      .from(walletTransactions)
      .where(whereConditions)
      .limit(pagination.limit)
      .offset(offset);

    // Application du tri
    if (options.sortBy) {
      const sortField = options.sortBy as keyof WalletTransaction;
      const sortOrder = options.sortOrder === "desc" ? desc : asc;
      transactionsQuery.orderBy(sortOrder(walletTransactions[sortField]));
    } else {
      transactionsQuery.orderBy(desc(walletTransactions.createdAt));
    }

    // Requête pour le count total
    const countQuery = db
      .select({ count: count() })
      .from(walletTransactions)
      .where(whereConditions);

    const [transactionsData, totalResult] = await Promise.all([
      transactionsQuery,
      countQuery,
    ]);

    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / pagination.limit);

    return {
      data: transactionsData,
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
    console.error("Error getting wallet transactions:", error);
    throw new Error("Failed to fetch wallet transactions");
  }
}

/**
 * Récupère les transactions entre deux utilisateurs
 */
export async function getUserToUserTransactions(
  fromUserId: string,
  toUserId: string,
  options?: { limit?: number; offset?: number }
): Promise<WalletTransaction[]> {
  try {
    const query = db
      .select()
      .from(walletTransactions)
      .where(
        and(
          eq(walletTransactions.fromUserId, fromUserId),
          eq(walletTransactions.toUserId, toUserId)
        )
      )
      .orderBy(desc(walletTransactions.createdAt));

    if (options?.limit) query.limit(options.limit);
    if (options?.offset) query.offset(options.offset);

    return await query;
  } catch (error) {
    console.error("Error getting user-to-user transactions:", error);
    throw new Error("Failed to fetch user transactions");
  }
}

/**
 * Récupère les statistiques des transactions
 */
export async function getTransactionStats(filters?: WalletTransactionFilters) {
  try {
    const whereConditions = buildTransactionWhereConditions(filters || {});

    const [
      totalResult,
      completedResult,
      pendingResult,
      failedResult,
      refundedResult,
      totalAmountResult,
      totalFeesResult,
    ] = await Promise.all([
      db
        .select({ count: count() })
        .from(walletTransactions)
        .where(whereConditions),
      db
        .select({ count: count() })
        .from(walletTransactions)
        .where(
          and(whereConditions, eq(walletTransactions.status, "COMPLETED"))
        ),
      db
        .select({ count: count() })
        .from(walletTransactions)
        .where(and(whereConditions, eq(walletTransactions.status, "PENDING"))),
      db
        .select({ count: count() })
        .from(walletTransactions)
        .where(and(whereConditions, eq(walletTransactions.status, "FAILED"))),
      db
        .select({ count: count() })
        .from(walletTransactions)
        .where(and(whereConditions, eq(walletTransactions.status, "REFUNDED"))),
      db
        .select({ total: sql<number>`sum(${walletTransactions.amount})` })
        .from(walletTransactions)
        .where(
          and(whereConditions, eq(walletTransactions.status, "COMPLETED"))
        ),
      db
        .select({ total: sql<number>`sum(${walletTransactions.fees})` })
        .from(walletTransactions)
        .where(
          and(whereConditions, eq(walletTransactions.status, "COMPLETED"))
        ),
    ]);

    const stats = {
      total: totalResult[0]?.count ?? 0,
      completed: completedResult[0]?.count ?? 0,
      pending: pendingResult[0]?.count ?? 0,
      failed: failedResult[0]?.count ?? 0,
      refunded: refundedResult[0]?.count ?? 0,
      totalAmount: totalAmountResult[0]?.total ?? 0,
      totalFees: totalFeesResult[0]?.total ?? 0,
    };

    return stats;
  } catch (error) {
    console.error("Error getting transaction stats:", error);
    throw new Error("Failed to fetch transaction statistics");
  }
}

// ============================================================================
// MUTATIONS - Ancienne implémentation (commentée pour référence)
// ============================================================================
/**
 * Crée une transaction wallet
 * ⚠️ REFACTORÉ: Utilise maintenant executeTransaction pour garantir la comptabilité double-entry
 */
export async function createTransaction(
  data: {
    walletId: string;
    type: NewWalletTransaction["type"];
    amount: string;
    description?: string;
    metadata?: Record<string, any>;
    fees?: string;
    netAmount?: string;
  },
  options?: { allowDuplicate?: boolean }
): Promise<WalletTransaction> {
  if (!data.walletId || !data.type || !data.amount) {
    throw new Error("Données de transaction incomplètes");
  }

  const user = await getCurrentUser();
  if (!user) throw new Error("Utilisateur non authentifié");

  // Récupérer le wallet
  const wallet = await getUserWalletById(data.walletId);
  if (!wallet) throw new Error("Wallet non trouvé");
  if (wallet.userId !== user.id) throw new Error("Non autorisé");
  if (!wallet.isActive) throw new Error("Wallet inactif");
  if (wallet.isLocked) throw new Error("Wallet verrouillé");
  if (!wallet.financialAccountId) throw new Error("Compte financier non lié");

  const amount = Number(data.amount);
  if (isNaN(amount) || amount <= 0) {
    throw new Error("Montant invalide");
  }

  const lastTx = await db
    .select()
    .from(walletTransactions)
    .where(eq(walletTransactions.walletId, wallet.id))
    .orderBy(desc(walletTransactions.createdAt))
    .limit(1);
  if (lastTx[0]?.createdAt) {
    const lastDate = new Date(lastTx[0].createdAt as any).getTime();
    const now = Date.now();
    const lastStatus = lastTx[0].status;
    const minWait = lastStatus === "FAILED" ? 60_000 : 120_000;
    const diff = now - lastDate;
    if (diff < minWait) {
      const remaining = Math.ceil((minWait - diff) / 1000);
      throw new Error(`Veuillez patienter ${remaining}s avant une nouvelle transaction`);
    }
  }

  if (
    !options?.allowDuplicate &&
    ["GAME_ITEM_PURCHASE", "DEPOSIT", "WITHDRAWAL", "PRODUCT_PURCHASE", "ORDER_PURCHASE"].includes(data.type)
  ) {
    const existing = await db
      .select({ id: walletTransactions.id })
      .from(walletTransactions)
      .where(
        and(
          eq(walletTransactions.fromUserId, user.id),
          eq(walletTransactions.type, data.type),
          inArray(walletTransactions.status, ["PENDING", "PROCESSING"])
        )
      )
      .limit(1);
    if (existing.length > 0) {
      throw new Error("Une transaction du même type est déjà en cours");
    }
  }

  // Déterminer le compte destination selon le type de transaction
  const escrowDebitTypes = [
    "PURCHASE",
    "VIP_SUBSCRIPTION",
    "THEME_PURCHASE",
    "PRODUCT_PURCHASE",
    "GAME_ITEM_PURCHASE",
    "TOURNAMENT_PARTICIPATION",
    "WITHDRAWAL",
  ];

  const creditTypes = ["DEPOSIT", "BONUS", "REFUND"];

  let fromAccountId: string;
  let toAccountId: string;

  if (data.type === "TRANSFER") {
    // TRANSFER direct wallet-to-wallet, pas via escrow
    const recipientWalletId = data.metadata?.recipientWalletId;
    if (!recipientWalletId) throw new Error("Wallet destinataire requis");

    const recipientWallet = await getUserWalletById(recipientWalletId);
    if (!recipientWallet) throw new Error("Wallet destinataire introuvable");
    if (!recipientWallet.financialAccountId) throw new Error("Compte financier destinataire non lié");

    fromAccountId = wallet.financialAccountId;
    toAccountId = recipientWallet.financialAccountId;
  } else if (escrowDebitTypes.includes(data.type)) {
    // User paye → argent va vers plateforme
    fromAccountId = wallet.financialAccountId;
    // On récupère ou crée le compte plateforme
    const platformAccount = await db.transaction(async (tx) => {
      return await getOrCreatePlatformAccount(tx, "PLATFORM_ESCROW");
    });
    toAccountId = platformAccount.id;
  } else if (creditTypes.includes(data.type)) {
    // Plateforme crédite user
    const platformAccount = await db.transaction(async (tx) => {
      return await getOrCreatePlatformAccount(tx, "SYSTEM_ADJUSTMENT");
    });
    fromAccountId = platformAccount.id;
    toAccountId = wallet.financialAccountId;
  } else {
    throw new Error(`Type de transaction non supporté: ${data.type}`);
  }

  // 🚀 Utiliser executeTransaction pour garantir la double-entry
  const result = await executeTransaction({
    fromAccountId,
    toAccountId,
    amount,
    type: data.type,
    description: data.description,
    metadata: data.metadata,
    userId: user.id,
    walletId: wallet.id,
  });

  // 🎯 Actions spécifiques selon le type
  await db.transaction(async (tx) => {
    await handleTransactionTypeSafe(tx, {
      type: data.type,
      metadata: result.transaction.metadata as Record<string, any>,
      userId: user.id,
      transactionId: result.transaction.id,
      wallet,
      amount: Number(result.transaction.amount),
      netAmount: Number(result.transaction.netAmount),
    });
  });

  return result.transaction;
}


async function handleTransactionTypeSafe(
  tx: any,
  params: {
    type: string;
    metadata: Record<string, any>;
    userId: string;
    transactionId: string;
    wallet: any;
    amount: number;
    netAmount: number;
  }
) {
  const { type, metadata, userId, transactionId, wallet, amount, netAmount } = params;

  switch (type) {
    // =====================================================
    // 🔁 TRANSFER (ultra sécurisé)
    // =====================================================
    case "TRANSFER": {
      const recipientWalletId = metadata?.recipientWalletId;
      if (!recipientWalletId)
        throw new Error("Wallet destinataire requis");

      if (recipientWalletId === wallet.id)
        throw new Error("Transfert vers soi interdit");

      // 🔒 Lock recipient wallet
      const recipientWallet = await tx.query.userWallets.findFirst({
        where: eq(userWallets.id, recipientWalletId),
        for: "update",
      });

      if (!recipientWallet)
        throw new Error("Wallet destinataire introuvable");

      // Use the verified net amount from the transaction
      const transferAmount = netAmount;
      if (isNaN(transferAmount) || transferAmount <= 0)
        throw new Error("Montant transfert invalide");

      // Le transfert a déjà été comptabilisé dans createTransaction
      // On ne fait ici que les actions métiers annexes (notifications, logs, etc.)

      break;
    }

    // =====================================================
    // 💎 VIP
    // =====================================================
    case "VIP_SUBSCRIPTION": {
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);

      await tx.insert(vipSubscriptions).values({
        userId,
        planType: "MONTHLY",
        status: "ACTIVE",
        startDate: new Date(),
        endDate,
        pricePaid: metadata.amount,
        transactionId,
        activeBenefits: [
          "theme_creation",
          "multiple_shops",
          "priority_support",
          "no_ads",
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await tx
        .update(users)
        .set({ isVip: true })
        .where(eq(users.id, userId));

      break;
    }

    // =====================================================
    // 🎮 GAME ITEM
    // =====================================================
    case "GAME_ITEM_PURCHASE": {
      await tx.insert(requests).values({
        userId,
        type: "GAME_ITEMS",
        amount: metadata.amount,
        currency: "GTC",
        status: "PENDING",
        gameItemId: metadata.targetId ?? null,
        quantity: metadata.quantity ?? null,
        totalGtc: metadata.amount,
        commission: "0",
        transactionId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      break;
    }

    // =====================================================
    // 🏆 TOURNAMENT
    // =====================================================
    case "TOURNAMENT_PARTICIPATION": {
      const editionId = metadata?.targetId;
      if (!editionId) break;

      await tx.insert(registrationPayments).values({
        registrationId: metadata.registrationId,
        transactionId,
        amount: metadata.amount,
        currency: "GTC",
        status: "PENDING",
        paymentMethod: "WALLET",
        paidAt: new Date(),
        metadata: { fromTransaction: transactionId },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      break;
    }

    default:
      break;
  }
}


export async function getTransactionFees(type: string, amount: number) {
  try {
    const settings = await getAppSettings();

    let feePercentage = 0;
    switch (type) {
      case "THEME_PURCHASE":
      case "PRODUCT_PURCHASE":
      case "GAME_ITEM_PURCHASE":
      case "ORDER_PURCHASE":
        feePercentage = parseFloat(
          settings?.purchaseFeePercentage?.toString() || "0"
        );
        break;
      case "VIP_SUBSCRIPTION":
        feePercentage = parseFloat(
          settings?.transactionFeePercentage?.toString() || "0"
        );
        break;
      case "TOURNAMENT_PARTICIPATION":
        feePercentage = parseFloat(
          settings?.tournamentParticipationFeePercentage?.toString() || "0"
        );
        break;
      case "DEPOSIT":
        feePercentage = parseFloat(
          settings?.depositFeePercentage?.toString() || "0"
        );
        break;
      case "WITHDRAWAL":
        feePercentage = parseFloat(
          settings?.withdrawalFeePercentage?.toString() || "0"
        );
        break;
      case "TRANSFER":
        feePercentage = parseFloat(
          settings?.transferFeePercentage?.toString() || "0"
        );
        break;
      default:
        feePercentage = 0;
    }

    const sessionUser = await getCurrentUser();
    if (sessionUser) {
      const found = await db
        .select()
        .from(users)
        .where(eq(users.id, sessionUser.id))
        .limit(1);
      const isVip = !!found[0]?.isVip;
      if (isVip) {
        feePercentage = Math.max(0, feePercentage * 0.5);
      }
    }

    const fees = amount * feePercentage;
    const totalAmount = amount;

    return {
      feePercentage,
      fees,
      totalAmount,
    };
  } catch (error) {
    console.error("Error calculating fees:", error);
    const feePercentage = 0;
    const fees = 0;
    const totalAmount = amount;
    return { feePercentage, fees, totalAmount };
  }
}

/**
 * Met à jour le statut d'une transaction
 */
export async function updateTransactionStatus(
  id: string,
  status: WalletTransaction["status"],
  metadata?: Record<string, any>
): Promise<WalletTransaction> {
  try {
    const updateData: Partial<NewWalletTransaction> = {
      status,
      //   updatedAt: new Date(),
    };

    if (metadata) {
      updateData.metadata = metadata;
    }

    const result = await db
      .update(walletTransactions)
      .set(updateData)
      .where(eq(walletTransactions.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error("Transaction not found");
    }

    return result[0];
  } catch (error) {
    console.error("Error updating transaction status:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to update transaction status");
  }
}

/**
 * Annule (rembourse) une transaction
 */
export async function refundTransaction(
  id: string,
  reason?: string
): Promise<WalletTransaction> {
  try {
    // Récupération de la transaction originale
    const originalTransaction = await getTransactionById(id);
    if (!originalTransaction) {
      throw new Error("Transaction not found");
    }

    if (originalTransaction.status !== "COMPLETED") {
      throw new Error("Only completed transactions can be refunded");
    }

    // Création d'une transaction de remboursement
    const refundTransactionData: NewWalletTransaction = {
      walletId: originalTransaction.walletId,
      fromUserId: originalTransaction.toUserId,
      toUserId: originalTransaction.fromUserId,
      amount: originalTransaction.netAmount,
      fees: "0",
      netAmount: originalTransaction.netAmount,
      balanceAfter: originalTransaction.netAmount,
      type: "REFUND",
      status: "COMPLETED",
      description: `Refund for transaction ${id}${reason ? `: ${reason}` : ""}`,
      metadata: {
        originalTransactionId: id,
        refundReason: reason,
      },
    };

    const refundResult = await createTransaction({
      walletId: refundTransactionData.walletId,
      type: refundTransactionData.type,
      amount: refundTransactionData.amount,
      fees: refundTransactionData.fees ?? undefined,
      netAmount: refundTransactionData.netAmount,
      description: refundTransactionData.description ?? undefined,
      metadata: refundTransactionData.metadata as Record<string, any>,
    });

    // Mise à jour du statut de la transaction originale
    await updateTransactionStatus(id, "REFUNDED", {
      refundTransactionId: refundResult.id,
      refundReason: reason,
      refundedAt: new Date(),
    });

    return refundResult;
  } catch (error) {
    console.error("Error refunding transaction:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to refund transaction");
  }
}

/**
 * Supprime une transaction (soft delete)
 */
export async function deleteTransaction(
  id: string
): Promise<WalletTransaction> {
  try {
    const result = await db
      .update(walletTransactions)
      .set({
        isDeleted: true,
        // updatedAt: new Date(),
      })
      .where(eq(walletTransactions.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error("Transaction not found");
    }

    return result[0];
  } catch (error) {
    console.error("Error deleting transaction:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to delete transaction");
  }
}

/**
 * Restaure une transaction supprimée
 */
export async function restoreTransaction(
  id: string
): Promise<WalletTransaction> {
  try {
    const result = await db
      .update(walletTransactions)
      .set({
        isDeleted: false,
        // updatedAt: new Date(),
      })
      .where(eq(walletTransactions.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error("Transaction not found");
    }

    return result[0];
  } catch (error) {
    console.error("Error restoring transaction:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to restore transaction");
  }
}

// ============================================================================
// UTILITAIRES
// ============================================================================

/**
 * Construit les conditions WHERE pour les requêtes de transactions
 */
function buildTransactionWhereConditions(
  filters: WalletTransactionFilters,
  options: QueryOptions = {}
) {
  const conditions = [];

  // Filtres de base
  if (!options.includeDeleted) {
    conditions.push(eq(walletTransactions.isDeleted, false));
  }

  // Filtres spécifiques
  if (filters.id) {
    conditions.push(eq(walletTransactions.id, filters.id));
  }
  if (filters.walletId) {
    conditions.push(eq(walletTransactions.walletId, filters.walletId));
  }
  if (filters.financialAccountId) {
    conditions.push(eq(walletTransactions.financialAccountId, filters.financialAccountId));
  }
  if (filters.fromUserId) {
    conditions.push(eq(walletTransactions.fromUserId, filters.fromUserId));
  }
  if (filters.toUserId) {
    conditions.push(eq(walletTransactions.toUserId, filters.toUserId));
  }
  if (filters.types && filters.types.length > 0) {
    conditions.push(inArray(walletTransactions.type, filters.types));
  }
  if (filters.statuses && filters.statuses.length > 0) {
    conditions.push(inArray(walletTransactions.status, filters.statuses));
  }
  if (filters.currency) {
    conditions.push(eq(walletTransactions.currency, filters.currency));
  }
  if (filters.description) {
    conditions.push(
      sql`${walletTransactions.description} ILIKE ${`%${filters.description}%`}`
    );
  }

  // Filtres de montant
  if (filters.amountMin !== undefined) {
    conditions.push(
      gte(walletTransactions.amount, filters.amountMin.toString())
    );
  }
  if (filters.amountMax !== undefined) {
    conditions.push(
      lte(walletTransactions.amount, filters.amountMax.toString())
    );
  }
  if (filters.feesMin !== undefined) {
    conditions.push(gte(walletTransactions.fees, filters.feesMin.toString()));
  }
  if (filters.feesMax !== undefined) {
    conditions.push(lte(walletTransactions.fees, filters.feesMax.toString()));
  }
  if (filters.netAmountMin !== undefined) {
    conditions.push(
      gte(walletTransactions.netAmount, filters.netAmountMin.toString())
    );
  }
  if (filters.netAmountMax !== undefined) {
    conditions.push(
      lte(walletTransactions.netAmount, filters.netAmountMax.toString())
    );
  }

  // Filtres de date
  if (filters.createdFrom) {
    conditions.push(
      gte(walletTransactions.createdAt, new Date(filters.createdFrom))
    );
  }
  if (filters.createdTo) {
    conditions.push(
      lte(walletTransactions.createdAt, new Date(filters.createdTo))
    );
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}
