"use server";

import {
  walletTransactions,
  userWallets,
  vipSubscriptions, type WalletTransaction,
  type NewWalletTransaction, users, registrationPayments,
  requests
, gameItems, themes, tournamentEditions} from "@/database/schema";
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
import { getUserWalletById, verifyWalletPin } from "./wallets";
import { getCurrentUser } from "@/lib/auth/session";
import { isAdmin, assertAuthenticated } from "@/lib/auth/permissions";
import {
  calculateTransactionFees,
  executeRefund,
  executeFinancialOperation,
  getOrCreateSystemAccount,
  type FinancialOperation,
  type LedgerPosting,
  TransactionType,
} from "@/lib/finance";

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
 * ⚠️ REFACTORÉ: Utilise le moteur unique `executeFinancialOperation` pour
 * garantir la comptabilité double-entry, l'idempotence et le verrouillage.
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
    pin?: string;
  },
  options?: { allowDuplicate?: boolean; isSystem?: boolean }
): Promise<WalletTransaction> {
  if (!data.walletId || !data.type || !data.amount) {
    throw new Error("Données de transaction incomplètes");
  }

  const user = await getCurrentUser();
  assertAuthenticated(user);

  const isAdminUser = isAdmin(user);

  // 🛡️ SEC-001: Bloquer tout crédit direct (DEPOSIT, BONUS, REFUND) non-admin et non-système
  const creditTypes = ["DEPOSIT", "BONUS", "REFUND"];
  if (creditTypes.includes(data.type) && !isAdminUser && !options?.isSystem) {
    throw new Error(
      "Opération non autorisée: les crédits directs (dépôts, bonus, remboursements) doivent résulter d'un paiement certifié ou d'une validation administrateur."
    );
  }

  // Récupérer le wallet
  const wallet = await getUserWalletById(data.walletId);
  if (!wallet) throw new Error("Wallet non trouvé");
  if (wallet.userId !== user.id && !isAdminUser) throw new Error("Non autorisé");
  if (!wallet.isActive) throw new Error("Wallet inactif");
  if (wallet.isLocked) throw new Error("Wallet verrouillé");
  if (!wallet.financialAccountId) throw new Error("Compte financier non lié");

  // 🛡️ SEC-010: Validation obligatoire du code PIN côté serveur pour transferts et retraits
  if (["TRANSFER", "WITHDRAWAL"].includes(data.type) && !isAdminUser && !options?.isSystem) {
    if (wallet.pinHash) {
      if (!data.pin) {
        throw new Error("Code PIN requis pour effectuer cette opération.");
      }
      const pinResult = await verifyWalletPin(wallet.id, data.pin);
      if (!pinResult.success) {
        throw new Error(pinResult.error || "Code PIN incorrect.");
      }
    }
  }

  let amount = Number(data.amount);

  // 🛡️ P0-F5: Server-side price enforcement for purchase/entry types
  if (data.type === "GAME_ITEM_PURCHASE") {
    const itemId = data.metadata?.targetId || data.metadata?.gameItemId;
    if (itemId) {
      const item = await db.query.gameItems.findFirst({
        where: eq(gameItems.id, itemId),
      });
      if (!item || !item.isActive) {
        throw new Error("Item non disponible");
      }
      const quantity = Math.max(1, Number(data.metadata?.quantity || 1));
      const serverPrice = parseFloat(item.priceGtc) * quantity;
      if (!isNaN(amount) && Math.abs(amount - serverPrice) > 0.01) {
        throw new Error("PRICE_CHANGED: Le prix de l'article a été actualisé.");
      }
      amount = serverPrice;
    }
  } else if (data.type === "TOURNAMENT_PARTICIPATION") {
    const editionId = data.metadata?.targetId || data.metadata?.editionId;
    if (editionId) {
      const edition = await db.query.tournamentEditions.findFirst({
        where: eq(tournamentEditions.id, editionId),
      });
      if (!edition) {
        throw new Error("Édition introuvable");
      }
      const serverFee = parseFloat(edition.entryFee || "0");
      if (!isNaN(amount) && Math.abs(amount - serverFee) > 0.01) {
        throw new Error("PRICE_CHANGED: Les frais d'inscription du tournoi ont été actualisés.");
      }
      amount = serverFee;
    }
  } else if (data.type === "THEME_PURCHASE") {
    const themeId = data.metadata?.targetId || data.metadata?.themeId;
    if (themeId) {
      const theme = await db.query.themes.findFirst({
        where: eq(themes.id, themeId),
      });
      if (!theme) {
        throw new Error("Thème introuvable");
      }
      const serverPrice = parseFloat(theme.price || "0");
      if (!isNaN(amount) && Math.abs(amount - serverPrice) > 0.01) {
        throw new Error("PRICE_CHANGED: Le prix du thème a été actualisé.");
      }
      amount = serverPrice;
    }
  } else if (data.type === "VIP_SUBSCRIPTION") {
    const settings = await getAppSettings();
    const isYearly = data.metadata?.plan === "YEARLY";
    const serverVipPrice = parseFloat(
      (isYearly ? settings?.vipYearlyPrice : settings?.vipMonthlyPrice) || (isYearly ? "2500" : "250")
    );
    if (!isNaN(amount) && Math.abs(amount - serverVipPrice) > 0.01) {
      throw new Error("PRICE_CHANGED: Le tarif de l'abonnement VIP a été actualisé.");
    }
    amount = serverVipPrice;
  }

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
    const minWait = 60_000; // 1 minute interval pour toute opération
    const diff = now - lastDate;
    if (diff < minWait) {
      const remaining = Math.ceil((minWait - diff) / 1000);
      throw new Error(`Veuillez patienter ${remaining}s avant une nouvelle transaction`);
    }
  }

  if (
    !options?.allowDuplicate &&
    ["GAME_ITEM_PURCHASE", "DEPOSIT", "WITHDRAWAL", "ORDER_PURCHASE"].includes(data.type)
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

  // Déterminer les écritures et comptes selon le type de transaction
  const canonicalType: TransactionType = data.type as TransactionType;

  const pendingTypes = ["ORDER_PURCHASE", "TOURNAMENT_PARTICIPATION"];
  const initialStatus: "PENDING" | "COMPLETED" = pendingTypes.includes(
    canonicalType
  )
    ? "PENDING"
    : "COMPLETED";

  const idempotencyKey =
    typeof data.metadata?.idempotencyKey === "string"
      ? data.metadata.idempotencyKey
      : undefined;

  const metadata = {
    ...(data.metadata ?? {}),
    originalType: data.type,
  };

  const feeCalc = await calculateTransactionFees(canonicalType, amount);
  const fees = feeCalc.fees;

  let operation: FinancialOperation;

  if (canonicalType === "TRANSFER") {
    const recipientWalletId = data.metadata?.recipientWalletId;
    if (!recipientWalletId) throw new Error("Wallet destinataire requis");

    const recipientWallet = await getUserWalletById(recipientWalletId);
    if (!recipientWallet) throw new Error("Wallet destinataire introuvable");
    if (!recipientWallet.financialAccountId)
      throw new Error("Compte financier destinataire non lié");
    if (recipientWallet.id === wallet.id)
      throw new Error("Transfert vers soi interdit");

    operation = {
      kind: "TRANSFER",
      type: "TRANSFER",
      status: initialStatus,
      amount,
      fromAccountId: wallet.financialAccountId,
      toAccountId: recipientWallet.financialAccountId,
      walletId: wallet.id,
      walletAccountId: wallet.financialAccountId,
      fromUserId: user.id,
      toUserId: recipientWallet.userId,
      description: data.description,
      metadata,
      createdByUserId: user.id,
      idempotencyKey,
      idempotencyScope: "transaction:transfer",
    };
  } else if (canonicalType === "BONUS") {
    operation = {
      kind: "ISSUANCE",
      type: "BONUS",
      status: initialStatus,
      amount,
      toAccountId: wallet.financialAccountId,
      toUserId: user.id,
      walletId: wallet.id,
      walletAccountId: wallet.financialAccountId,
      fromUserId: null,
      description: data.description,
      reason: data.description || "Bonus administrateur",
      metadata,
      createdByUserId: user.id,
      idempotencyKey,
      idempotencyScope: "transaction:bonus",
    };
  } else {
    const postings: LedgerPosting[] = [];
    let netAmount = amount;
    let journalFees = 0;
    let fromUserId: string | null = user.id;
    let toUserId: string | null = null;

    if (canonicalType === "DEPOSIT" || canonicalType === "REFUND") {
      // Entrée externe : contrepartie SYSTEM_EXTERNAL_CLEARING.
      const clearing = await getOrCreateSystemAccount(db, "EXTERNAL_CLEARING");
      netAmount = Math.round((amount - fees) * 100) / 100;
      journalFees = fees;
      postings.push({ accountId: clearing.id, debit: amount });
      postings.push({
        accountId: wallet.financialAccountId,
        credit: netAmount,
      });
      if (fees > 0) {
        const feeAccount = await getOrCreateSystemAccount(db, "FEES");
        postings.push({ accountId: feeAccount.id, credit: fees });
      }
      fromUserId = null;
      toUserId = user.id;
    } else if (canonicalType === "VIP_SUBSCRIPTION") {
      // L'abonnement VIP est une recette plateforme.
      const feeAccount = await getOrCreateSystemAccount(db, "FEES");
      postings.push({ accountId: wallet.financialAccountId, debit: amount });
      postings.push({ accountId: feeAccount.id, credit: amount });
      netAmount = 0;
    } else if (
      canonicalType === "TOURNAMENT_PARTICIPATION" ||
      canonicalType === "WITHDRAWAL"
    ) {
      const escrow = await getOrCreateSystemAccount(db, "ESCROW");
      journalFees = fees;
      postings.push({
        accountId: wallet.financialAccountId,
        debit: Math.round((amount + fees) * 100) / 100,
      });
      postings.push({ accountId: escrow.id, credit: amount });
      if (fees > 0) {
        const feeAccount = await getOrCreateSystemAccount(db, "FEES");
        postings.push({ accountId: feeAccount.id, credit: fees });
      }
      netAmount = 0;
    } else if (
      [
        "ORDER_PURCHASE",
        "GAME_ITEM_PURCHASE",
        "THEME_PURCHASE",
        "PURCHASE",
      ].includes(canonicalType)
    ) {
      // Achat : débit du payeur, mise sous séquestre du brut.
      const escrow = await getOrCreateSystemAccount(db, "ESCROW");
      postings.push({ accountId: wallet.financialAccountId, debit: amount });
      postings.push({ accountId: escrow.id, credit: amount });
      netAmount = 0;
    } else {
      throw new Error(`Type de transaction non supporté: ${canonicalType}`);
    }

    operation = {
      kind: "POST",
      type: canonicalType,
      status: initialStatus,
      amount,
      walletId: wallet.id,
      walletAccountId: wallet.financialAccountId,
      fromUserId,
      toUserId,
      description: data.description,
      reason: data.description,
      metadata,
      postings,
      fees: journalFees,
      netAmount,
      createdByUserId: user.id,
      idempotencyKey,
      idempotencyScope: `transaction:${canonicalType.toLowerCase()}`,
    };
  }

  // 🚀 Moteur unique : écritures équilibrées, idempotence et verrouillage
  const result = await executeFinancialOperation(operation);

  // 🎯 Actions spécifiques selon le type
  await db.transaction(async (tx) => {
    await handleTransactionTypeSafe(tx, {
      type: canonicalType,
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
  const calculation = await calculateTransactionFees(type, amount);

  // Convention §3.2 : pour les opérations où les frais sont ajoutés au
  // payeur, le total débité est `montant + frais`. Pour les achats, les frais
  // sont retenus sur le vendeur et le payeur est débité du montant seul.
  const feesAddedToPayer = [
    "TRANSFER",
    "WITHDRAWAL",
    "TOURNAMENT_PARTICIPATION",
  ].includes(type);

  const totalDebit = feesAddedToPayer
    ? Math.round((Number(amount) + calculation.fees) * 100) / 100
    : Number(amount);

  return {
    ...calculation,
    totalAmount: totalDebit,
    totalDebit,
  };
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
 * Utilise le moteur de remboursement autoritaire avec inversion stricte du ledger
 */
export async function refundTransaction(
  id: string,
  reason?: string,
  amount?: number
): Promise<WalletTransaction> {
  try {
    return await executeRefund(id, { reason, amount });
  } catch (error) {
    console.error("Erreur lors du remboursement de la transaction:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Impossible de rembourser la transaction");
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
      throw new Error("Transaction non trouvée");
    }

    return result[0];
  } catch (error) {
    //en fr: Erreur lors de la suppression de la transaction
    console.error("Erreur lors de la suppression de la transaction:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Impossible de supprimer la transaction");
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
      throw new Error("Transaction non trouvée");
    }

    return result[0];
  } catch (error) {
    console.error("Erreur lors de la restauration de la transaction:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Impossible de restaurer la transaction");
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
