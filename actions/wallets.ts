// actions/wallets.ts - Actions serveur complètes
'use server';

import {
  userWallets,
  walletTransactions,
  users,
  financialAccounts,
  ledgerEntries,
  type UserWallet,
  type NewUserWallet,
  type WalletTransaction,
  type NewWalletTransaction,
  type User,
  type FinancialAccount,
  type LedgerEntry,
  VerificationEnum,
  shops,
} from '@/database/schema';
import {
  eq,
  and,
  or,
  sql,
  desc,
  asc,
  count,
  gte,
  lte,
  inArray,
  isNull,
  isNotNull,
} from 'drizzle-orm';
import {
  type UserWalletFilters,
  type WalletTransactionFilters,
  type ListQuery,
  type PaginationResponse,
  type QueryOptions,
} from '@/types/api';
import { db } from '@/lib/db';
import { WalletUtils } from '@/lib/wallet/wallet-utils';
import { getAppSettings } from '@/actions/app-settings';
import { createUserTrace } from '@/actions/user-traces';
import { getCurrentUser } from '@/lib/auth/session';
import {
  executeTransaction,
  getOrCreatePlatformAccount,
  getAccountBalance
} from '@/lib/ledger/ledger-utils';
import { createTransaction as createWalletTransaction } from '@/actions/transactions';

// ============================================================================
// USER WALLETS - Queries
// ============================================================================

/**
 * Récupère un wallet par son ID
 */
export async function getUserWalletById(
  id: string
): Promise<UserWallet | null> {
  try {
    const wallet = await db.query.userWallets.findFirst({
      where: (wallets, { eq }) => eq(wallets.id, id),
    });
    return wallet ?? null;
  } catch (error) {
    console.error('Error getting wallet by ID:', error);
    throw new Error('Failed to fetch wallet');
  }
}

/**
 * Récupère le wallet d'un utilisateur
 */
export async function getUserWalletByUserId(
  userId: string
): Promise<UserWallet | null> {
  try {
    const wallet = await db.query.userWallets.findFirst({
      where: (wallets, { eq }) => eq(wallets.userId, userId),
    });
    return wallet ?? null;
  } catch (error) {
    console.error('Error getting wallet by user ID:', error);
    throw new Error('Failed to fetch wallet');
  }
}

/**
 * Récupère un wallet par son numéro de carte
 */
export async function getUserWalletByCardNumber(
  cardNumber: string
): Promise<UserWallet | null> {
  try {
    const wallet = await db.query.userWallets.findFirst({
      where: (wallets, { eq }) => eq(wallets.cardNumberHash, cardNumber.replace(/\s+/g, '')),
    });
    return wallet ?? null;
  } catch (error) {
    console.error('Error getting wallet by card number:', error);
    throw new Error('Failed to fetch wallet');
  }
}

/**
 * Récupère le solde réel d'un wallet via le ledger
 */
export async function getWalletBalance(walletId: string): Promise<number> {
  try {
    const wallet = await getUserWalletById(walletId);
    if (!wallet?.financialAccountId) return 0;

    return await getAccountBalance(wallet.financialAccountId);
  } catch (error) {
    console.error('Error getting wallet balance:', error);
    return 0;
  }
}

/**
 * Liste les wallets avec pagination
 */
export async function getUserWallets(
  query: ListQuery<UserWalletFilters> = {}
): Promise<PaginationResponse<UserWallet>> {
  try {
    const { pagination = { page: 1, limit: 50 }, filters = {}, options = {} } = query;
    const offset = (pagination.page - 1) * pagination.limit;

    // Construction des conditions
    const conditions = buildWalletConditions(filters, options);

    // Requête pour les données
    const walletsData = await db
      .select()
      .from(userWallets)
      .where(conditions)
      .limit(pagination.limit)
      .offset(offset)
      .orderBy(getWalletSort(options));

    // Count total
    const totalResult = await db
      .select({ count: count() })
      .from(userWallets)
      .where(conditions);

    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / pagination.limit);

    return {
      data: walletsData,
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
    console.error('Error getting wallets:', error);
    throw new Error('Failed to fetch wallets');
  }
}

// ============================================================================
// USER WALLETS - Mutations
// ============================================================================

/**
 * Crée un nouveau wallet utilisateur
 */
/**
 * Crée un nouveau wallet utilisateur
 * ⚠️ REFACTORÉ: Crée d'abord le financial_account, puis utilise executeTransaction pour le bonus
 */
export async function createUserWallet(
  walletData: NewUserWallet,
  options?: { currency?: string }
): Promise<UserWallet> {
  try {
    // Validation
    if (!walletData.userId || !walletData.pinHash) {
      throw new Error('userId et pinHash sont requis');
    }

    // Vérifier qu'un wallet n'existe pas déjà
    const existingWallet = await getUserWalletByUserId(walletData.userId);
    if (existingWallet) {
      throw new Error('L\'utilisateur a déjà un wallet');
    }

    // Récupérer les paramètres de l'app
    const appSettings = await getAppSettings();
    const defaultBalance = parseFloat(appSettings?.defaultUserBalance?.toString() || '250');

    // Générer un numéro de carte sécurisé
    const cardNumber = WalletUtils.generateSecureCardNumber();

    return await db.transaction(async (tx) => {
      // 1️⃣ Créer d'abord le financial_account
      const [account] = await tx
        .insert(financialAccounts)
        .values({
          ownerUserId: walletData.userId,
          type: 'USER_WALLET',
          currency: options?.currency || 'GTC',
          isActive: true,
          isLocked: false,
          metadata: { initialBonus: defaultBalance },
          createdAt: new Date(),
        })
        .returning();

      // 2️⃣ Créer le wallet lié au financial_account
      const [newWallet] = await tx
        .insert(userWallets)
        .values({
          userId: walletData.userId,
          pinHash: walletData.pinHash,
          cardNumberHash: cardNumber,
          financialAccountId: account.id,
          isActive: true,
          isLocked: false,
          failedAttempts: 0,
          verificationStatus: 'PENDING',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      // 3️⃣ Créer le bonus de bienvenue via executeTransaction
      // Le bonus vient du compte SYSTEM_ADJUSTMENT vers le compte user
      const systemAccount = await getOrCreatePlatformAccount(tx, 'SYSTEM_ADJUSTMENT');

      // Créer les ledger entries pour le bonus
      const transactionId = crypto.randomUUID();

      // Transaction wallet pour l'historique
      const [welcomeTransaction] = await tx
        .insert(walletTransactions)
        .values({
          id: transactionId,
          walletId: newWallet.id,
          financialAccountId: account.id,
          amount: defaultBalance.toFixed(2),
          fees: '0',
          netAmount: defaultBalance.toFixed(2),
          balanceAfter: defaultBalance.toFixed(2),
          type: 'BONUS',
          status: 'COMPLETED',
          description: 'Bonus de bienvenue - Création de wallet',
          metadata: {
            type: 'WELCOME_BONUS',
            walletCreation: true,
          },
          createdAt: new Date(),
        })
        .returning();

      // Ledger entries (double-entry)
      // Débit du compte système
      await tx.insert(ledgerEntries).values({
        transactionId,
        accountId: systemAccount.id,
        debit: defaultBalance.toFixed(2),
        credit: '0',
        currency: 'GTC',
        createdAt: new Date(),
      });

      // Crédit du compte user
      await tx.insert(ledgerEntries).values({
        transactionId,
        accountId: account.id,
        debit: '0',
        credit: defaultBalance.toFixed(2),
        currency: 'GTC',
        createdAt: new Date(),
      });

      // Journalisation
      await createUserTrace({
        userId: walletData.userId,
        type: 'ACTION',
        entityId: newWallet.id,
        payload: {
          action: 'WALLET_CREATED',
          walletId: newWallet.id,
          bonusAmount: defaultBalance,
          cardNumber,
        },
      });

      return newWallet;
    });
  } catch (error) {
    console.error('Error creating wallet:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to create wallet');
  }
}

/**
 * Fonction publique pour créer un wallet
 */
export async function createWalletServer(
  userId: string,
  pin: string,
  options?: {
    enableBiometrics?: boolean;
    enableNotifications?: boolean;
    currency?: string;
  }
): Promise<{ success: boolean; wallet?: UserWallet; error?: string }> {
  try {
    // Valider le PIN
    const pinValidation = WalletUtils.validatePinStrength(pin);
    if (!pinValidation.isValid) {
      return {
        success: false,
        error: pinValidation.errors.join(', '),
      };
    }

    // Hash le PIN
    const pinHash = await WalletUtils.hashPin(pin);

    // Créer le wallet
    const wallet = await createUserWallet({
      userId,
      pinHash,
    });

    return {
      success: true,
      wallet,
    };
  } catch (error: any) {
    console.error('Error creating wallet:', error);

    // Messages d'erreur conviviaux
    let userMessage = 'Erreur lors de la création du wallet';
    if (error.message.includes('déjà un wallet')) {
      userMessage = 'Vous avez déjà un wallet';
    } else if (error.message.includes('PIN invalide')) {
      userMessage = 'PIN invalide';
    }

    return {
      success: false,
      error: userMessage,
    };
  }
}

/**
 * Met à jour un wallet
 */
export async function updateUserWallet(
  id: string,
  walletData: Partial<NewUserWallet>
): Promise<UserWallet> {
  try {
    const [updatedWallet] = await db
      .update(userWallets)
      .set({
        ...walletData,
        updatedAt: new Date(),
      })
      .where(eq(userWallets.id, id))
      .returning();

    if (!updatedWallet) {
      throw new Error('Wallet not found');
    }

    return updatedWallet;
  } catch (error) {
    console.error('Error updating wallet:', error);
    throw error instanceof Error ? error : new Error('Failed to update wallet');
  }
}

/**
 * Met à jour le solde d'un wallet
 */
export async function updateWalletBalance(
  walletId: string,
  newBalance: string
): Promise<UserWallet> {
  try {
    const [updatedWallet] = await db
      .update(userWallets)
      .set({
        updatedAt: new Date(),
      })
      .where(eq(userWallets.id, walletId))
      .returning();

    if (!updatedWallet) {
      throw new Error('Wallet not found');
    }

    return updatedWallet;
  } catch (error) {
    console.error('Error updating wallet balance:', error);
    throw new Error('Failed to update wallet balance');
  }
}

/**
 * Verrouille/déverrouille un wallet
 */
export async function toggleWalletLock(
  walletId: string,
  isLocked: boolean
): Promise<UserWallet> {
  try {
    const [updatedWallet] = await db
      .update(userWallets)
      .set({
        isLocked,
        updatedAt: new Date(),
      })
      .where(eq(userWallets.id, walletId))
      .returning();

    if (!updatedWallet) {
      throw new Error('Wallet not found');
    }

    return updatedWallet;
  } catch (error) {
    console.error('Error toggling wallet lock:', error);
    throw new Error('Failed to toggle wallet lock');
  }
}

/**
 * Vérifie un PIN de wallet
 */
export async function verifyWalletPin(
  walletId: string,
  pin: string
): Promise<{ success: boolean; error?: string; attemptsRemaining?: number }> {
  try {
    const wallet = await getUserWalletById(walletId);
    if (!wallet) {
      return { success: false, error: 'Wallet non trouvé' };
    }

    if (wallet.isLocked) {
      return { success: false, error: 'Wallet verrouillé. Contactez le support.' };
    }

    // Vérifier le PIN
    const isValid = await WalletUtils.verifyPin(pin, wallet.pinHash);

    if (!isValid) {
      // Incrémenter les tentatives échouées
      const newAttempts = (wallet.failedAttempts || 0) + 1;
      const isNowLocked = newAttempts >= 5;

      await db
        .update(userWallets)
        .set({
          failedAttempts: newAttempts,
          lastFailedAttempt: new Date(),
          isLocked: isNowLocked,
          updatedAt: new Date(),
        })
        .where(eq(userWallets.id, walletId));

      const attemptsRemaining = 5 - newAttempts;

      return {
        success: false,
        error: `PIN incorrect${isNowLocked ? ' - Wallet verrouillé' : ''}`,
        attemptsRemaining: attemptsRemaining > 0 ? attemptsRemaining : 0,
      };
    }

    // Réinitialiser les tentatives en cas de succès
    await db
      .update(userWallets)
      .set({
        failedAttempts: 0,
        lastFailedAttempt: null,
        updatedAt: new Date(),
      })
      .where(eq(userWallets.id, walletId));

    return { success: true };
  } catch (error) {
    console.error('Error verifying wallet PIN:', error);
    return { success: false, error: 'Erreur lors de la vérification' };
  }
}

// ============================================================================
// WALLET TRANSACTIONS
// ============================================================================

/**
 * Récupère une transaction par son ID
 */
export async function getTransactionById(
  id: string
): Promise<WalletTransaction | null> {
  try {
    const transaction = await db.query.walletTransactions.findFirst({
      where: (transactions, { eq }) => eq(transactions.id, id),
    });
    return transaction ?? null;
  } catch (error) {
    console.error('Error getting transaction by ID:', error);
    throw new Error('Failed to fetch transaction');
  }
}

/**
 * Récupère les transactions d'un wallet
 */
export async function getWalletTransactions(
  query: ListQuery<WalletTransactionFilters> = {}
): Promise<PaginationResponse<WalletTransaction>> {
  try {
    const { pagination = { page: 1, limit: 50 }, filters = {}, options = {} } = query;
    const offset = (pagination.page - 1) * pagination.limit;

    // Construction des conditions
    const conditions = buildTransactionConditions(filters, options);

    // Requête pour les données
    const transactionsData = await db
      .select()
      .from(walletTransactions)
      .where(conditions)
      .limit(pagination.limit)
      .offset(offset)
      .orderBy(getTransactionSort(options));

    // Count total
    const totalResult = await db
      .select({ count: count() })
      .from(walletTransactions)
      .where(conditions);

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
    console.error('Error getting transactions:', error);
    throw new Error('Failed to fetch transactions');
  }
}

/**
 * Crée une nouvelle transaction
 */
export async function createTransaction(
  transactionData: NewWalletTransaction
): Promise<WalletTransaction> {
  try {
    // Validation
    if (!transactionData.walletId || !transactionData.amount || !transactionData.type) {
      throw new Error('walletId, amount et type sont requis');
    }

    // Calculer les frais si non fournis
    const fees = transactionData.fees || '0';
    const netAmount = transactionData.netAmount || transactionData.amount;
    let balanceAfter = transactionData.balanceAfter || transactionData.amount;

    const wallet = await getUserWalletById(transactionData.walletId);
    if (!wallet) {
      throw new Error('Wallet not found');
    }
    const accountId = wallet.financialAccountId || null;
    let currentBalance = 0;
    if (accountId) {
      const balRes = await db
        .select({ balance: sql<string>`coalesce(sum(${ledgerEntries.credit}) - sum(${ledgerEntries.debit}), '0')` })
        .from(ledgerEntries)
        .where(eq(ledgerEntries.accountId, accountId));
      currentBalance = parseFloat(balRes[0]?.balance || '0');
    }
    const amountNum = parseFloat(transactionData.amount);
    const spendTypes = ['PURCHASE', 'WITHDRAWAL', 'TRANSFER', 'VIP_SUBSCRIPTION', 'GAME_ITEM_PURCHASE'];
    if (spendTypes.includes(transactionData.type) && currentBalance < amountNum) {
      throw new Error('Solde insuffisant');
    }
    balanceAfter = spendTypes.includes(transactionData.type)
      ? (currentBalance - amountNum).toFixed(2)
      : (currentBalance + parseFloat(netAmount)).toFixed(2);

    // Créer la transaction
    const [newTransaction] = await db
      .insert(walletTransactions)
      .values({
        ...transactionData,
        financialAccountId: accountId,
        fees,
        netAmount,
        balanceAfter,
        createdAt: new Date(),
      })
      .returning();

    if (accountId) {
      const debit = spendTypes.includes(transactionData.type) ? transactionData.amount : '0';
      const credit = spendTypes.includes(transactionData.type) ? '0' : netAmount;
      await db.insert(ledgerEntries).values({
        transactionId: newTransaction.id,
        accountId,
        debit,
        credit,
        currency: 'GTC',
        createdAt: new Date(),
      });
      // Contrepartie plateforme/système
      const [platformAccount] = await db
        .select()
        .from(financialAccounts)
        .where(eq(financialAccounts.type, spendTypes.includes(transactionData.type) ? 'PLATFORM_ESCROW' : 'SYSTEM_ADJUSTMENT'))
        .limit(1);
      const platformId = platformAccount?.id || (await db.insert(financialAccounts).values({
        type: spendTypes.includes(transactionData.type) ? 'PLATFORM_ESCROW' : 'SYSTEM_ADJUSTMENT',
        currency: 'GTC',
        isActive: true,
        isLocked: false,
        metadata: { autoCreated: true },
        createdAt: new Date(),
      }).returning())[0].id;
      await db.insert(ledgerEntries).values({
        transactionId: newTransaction.id,
        accountId: platformId,
        debit: spendTypes.includes(transactionData.type) ? '0' : netAmount,
        credit: spendTypes.includes(transactionData.type) ? transactionData.amount : '0',
        currency: 'GTC',
        createdAt: new Date(),
      });
    }

    return newTransaction;
  } catch (error) {
    console.error('Error creating transaction:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to create transaction');
  }
}

/**
 * Met à jour le statut d'une transaction
 */
export async function updateTransactionStatus(
  id: string,
  status: WalletTransaction['status']
): Promise<WalletTransaction> {
  try {
    const [updatedTransaction] = await db
      .update(walletTransactions)
      .set({
        status,
        // updatedAt: new Date(),
      })
      .where(eq(walletTransactions.id, id))
      .returning();

    if (!updatedTransaction) {
      throw new Error('Transaction not found');
    }

    return updatedTransaction;
  } catch (error) {
    console.error('Error updating transaction status:', error);
    throw new Error('Failed to update transaction status');
  }
}

// ============================================================================
// TRANSFERT ET OPERATIONS FINANCIERES
// ============================================================================

/**
 * Transfert d'argent entre utilisateurs
 */
export async function transferMoney(
  fromUserId: string,
  toUserId: string,
  amount: number,
  description?: string
): Promise<{ success: boolean; transaction?: WalletTransaction; error?: string }> {
  try {
    // Valider le montant
    if (amount <= 0) {
      return { success: false, error: 'Montant invalide' };
    }

    // Récupérer les wallets
    const fromWallet = await getUserWalletByUserId(fromUserId);
    const toWallet = await getUserWalletByUserId(toUserId);

    if (!fromWallet || !toWallet) {
      return { success: false, error: 'Un des wallets n\'existe pas' };
    }

    if (fromWallet.isLocked || toWallet.isLocked) {
      return { success: false, error: 'Un des wallets est verrouillé' };
    }

    // Vérifier le solde via ledger
    let fromBalance = 0;
    if (fromWallet.financialAccountId) {
      const [bal] = await db
        .select({ balance: sql<string>`coalesce(sum(${ledgerEntries.credit}) - sum(${ledgerEntries.debit}), '0')` })
        .from(ledgerEntries)
        .where(eq(ledgerEntries.accountId, fromWallet.financialAccountId));
      fromBalance = parseFloat(bal?.balance || '0');
    }
    if (fromBalance < amount) return { success: false, error: 'Solde insuffisant' };

    // Calculer les frais
    const fees = WalletUtils.calculateFees(amount, 'TRANSFER', false);
    const netAmount = amount - fees.amount;

    // Créer la transaction de transfert
    const transaction = await createTransaction({
      walletId: fromWallet.id,
      fromUserId,
      toUserId,
      amount: amount.toString(),
      fees: fees.amount.toString(),
      netAmount: netAmount.toString(),
      balanceAfter: (fromBalance - amount).toFixed(2),
      type: 'TRANSFER',
      status: 'COMPLETED',
      description: description || `Transfert vers ${toUserId}`,
      metadata: {
        transferType: 'user_to_user',
        recipientWalletId: toWallet.id,
        fees: fees,
      },
    });

    // Créer une transaction de réception pour le destinataire
    let toBalance = 0;
    if (toWallet.financialAccountId) {
      const [bal] = await db
        .select({ balance: sql<string>`coalesce(sum(${ledgerEntries.credit}) - sum(${ledgerEntries.debit}), '0')` })
        .from(ledgerEntries)
        .where(eq(ledgerEntries.accountId, toWallet.financialAccountId));
      toBalance = parseFloat(bal?.balance || '0');
    }
    await createTransaction({
      walletId: toWallet.id,
      fromUserId,
      toUserId,
      amount: netAmount.toString(),
      fees: '0',
      netAmount: netAmount.toString(),
      balanceAfter: (toBalance + netAmount).toFixed(2),
      type: 'TRANSFER',
      status: 'COMPLETED',
      description: `Transfert reçu de ${fromUserId}`,
      metadata: {
        transferType: 'user_to_user',
        senderWalletId: fromWallet.id,
        originalTransactionId: transaction.id,
      },
    });

    // Journalisation
    await createUserTrace({
      userId: fromUserId,
      type: 'TRANSFER',
      entityId: transaction.id,
      payload: {
        action: 'MONEY_TRANSFER',
        toUserId,
        amount,
        fees: fees.amount,
      },
    });

    return { success: true, transaction };
  } catch (error: any) {
    console.error('Error transferring money:', error);
    return { success: false, error: error.message || 'Erreur lors du transfert' };
  }
}

/**
 * Transfert entre identités appartenant au même utilisateur (ex: Retrait Shop -> Wallet)
 */
export async function transferBetweenIdentities(params: {
  fromIdentityId: string;
  fromType: 'USER' | 'SHOP' | 'TOURNAMENT';
  toIdentityId: string;
  toType: 'USER' | 'SHOP' | 'TOURNAMENT';
  amount: number;
  description?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Non authentifié");

    return await db.transaction(async (tx) => {
      // 1. Resolve source account
      let fromAccount: FinancialAccount | undefined;
      if (params.fromType === 'USER') {
        const wallet = await tx.query.userWallets.findFirst({ where: eq(userWallets.userId, params.fromIdentityId) });
        if (wallet?.userId !== user.id) throw new Error("Accès refusé");
        fromAccount = await tx.query.financialAccounts.findFirst({ where: eq(financialAccounts.id, wallet.financialAccountId!) });
      } else if (params.fromType === 'SHOP') {
        const shop = await tx.query.shops.findFirst({ where: eq(shops.id, params.fromIdentityId) });
        if (shop?.ownerId !== user.id) throw new Error("Accès refusé (Non propriétaire)");
        fromAccount = await tx.query.financialAccounts.findFirst({ where: eq(financialAccounts.id, shop.financialAccountId!) });
      }

      // 2. Resolve destination account
      let toAccount: FinancialAccount | undefined;
      if (params.toType === 'USER') {
        const wallet = await tx.query.userWallets.findFirst({ where: eq(userWallets.userId, params.toIdentityId) });
        toAccount = await tx.query.financialAccounts.findFirst({ where: eq(financialAccounts.id, wallet!.financialAccountId!) });
      } else if (params.toType === 'SHOP') {
        const shop = await tx.query.shops.findFirst({ where: eq(shops.id, params.toIdentityId) });
        toAccount = await tx.query.financialAccounts.findFirst({ where: eq(financialAccounts.id, shop!.financialAccountId!) });
      }

      if (!fromAccount || !toAccount) throw new Error("Comptes introuvables");

      // 3. Execute Transaction
      await executeTransaction({
        fromAccountId: fromAccount.id,
        toAccountId: toAccount.id,
        amount: params.amount,
        type: 'TRANSFER',
        description: params.description || `Transfert interne entre ${params.fromType} et ${params.toType}`,
        userId: user.id,
        metadata: { transferType: 'internal_identity_transfer' }
      });

      return { success: true };
    });
  } catch (error: any) {
    console.error("Error in transferBetweenIdentities:", error);
    return { success: false, error: error.message || "Erreur lors du transfert" };
  }
}

/**
 * Déposer de l'argent sur un wallet
 */
export async function depositToWallet(
  walletId: string,
  amount: number,
  method: string = 'MANUAL'
): Promise<{ success: boolean; transaction?: WalletTransaction; error?: string }> {
  try {
    if (amount <= 0) {
      return { success: false, error: 'Montant invalide' };
    }

    const wallet = await getUserWalletById(walletId);
    if (!wallet) {
      return { success: false, error: 'Wallet non trouvé' };
    }

    // Calculer le nouveau solde via ledger
    let currentBalance = 0;
    if (wallet.financialAccountId) {
      const [bal] = await db
        .select({ balance: sql<string>`coalesce(sum(${ledgerEntries.credit}) - sum(${ledgerEntries.debit}), '0')` })
        .from(ledgerEntries)
        .where(eq(ledgerEntries.accountId, wallet.financialAccountId));
      currentBalance = parseFloat(bal?.balance || '0');
    }
    const newBalance = currentBalance + amount;

    // Créer la transaction
    const transaction = await createTransaction({
      walletId,
      amount: amount.toString(),
      netAmount: amount.toString(),
      balanceAfter: newBalance.toString(),
      type: 'DEPOSIT',
      status: 'COMPLETED',
      description: `Dépôt via ${method}`,
      metadata: {
        depositMethod: method,
        previousBalance: currentBalance,
      },
    });

    return { success: true, transaction };
  } catch (error: any) {
    console.error('Error depositing to wallet:', error);
    return { success: false, error: error.message || 'Erreur lors du dépôt' };
  }
}

// ============================================================================
// STATISTIQUES
// ============================================================================

/**
 * Récupère les statistiques des wallets
 */
export async function getWalletStats(filters?: UserWalletFilters) {
  try {
    const conditions = buildWalletConditions(filters || {});

    const [stats] = await db
      .select({
        total: count(),
        active: sql`count(case when ${userWallets.isActive} = true then 1 end)`.mapWith(Number),
        locked: sql`count(case when ${userWallets.isLocked} = true then 1 end)`.mapWith(Number),
        totalBalance: sql<number>`sum((SELECT coalesce(sum(le.credit) - sum(le.debit), 0) FROM ledger_entries le WHERE le.account_id = ${userWallets.financialAccountId}))`,
        averageBalance: sql<number>`avg((SELECT coalesce(sum(le.credit) - sum(le.debit), 0) FROM ledger_entries le WHERE le.account_id = ${userWallets.financialAccountId}))`,
      })
      .from(userWallets)
      .where(conditions);

    return stats || {
      total: 0,
      active: 0,
      locked: 0,
      totalBalance: 0,
      averageBalance: 0,
    };
  } catch (error) {
    console.error('Error getting wallet stats:', error);
    throw new Error('Failed to fetch wallet statistics');
  }
}

/**
 * Récupère les statistiques des transactions
 */
export async function getTransactionStats(filters?: WalletTransactionFilters) {
  try {
    const conditions = buildTransactionConditions(filters || {});

    const [stats] = await db
      .select({
        total: count(),
        completed: sql`count(case when ${walletTransactions.status} = 'COMPLETED' then 1 end)`.mapWith(Number),
        pending: sql`count(case when ${walletTransactions.status} = 'PENDING' then 1 end)`.mapWith(Number),
        totalAmount: sql`sum(${walletTransactions.amount}::numeric)`,
        totalFees: sql`sum(${walletTransactions.fees}::numeric)`,
      })
      .from(walletTransactions)
      .where(conditions);

    return stats || {
      total: 0,
      completed: 0,
      pending: 0,
      totalAmount: 0,
      totalFees: 0,
    };
  } catch (error) {
    console.error('Error getting transaction stats:', error);
    throw new Error('Failed to fetch transaction statistics');
  }
}

export async function getWalletLedgerStats(params: {
  walletId: string;
  startDate?: string;
  endDate?: string;
}) {
  try {
    const { walletId, startDate, endDate } = params;
    const wallet = await getUserWalletById(walletId);
    if (!wallet?.financialAccountId) {
      return { total: 0, pending: 0, income: 0, expense: 0 };
    }

    const ledgerWhere: any[] = [eq(ledgerEntries.accountId, wallet.financialAccountId)];
    if (startDate) {
      ledgerWhere.push(gte(ledgerEntries.createdAt, new Date(startDate)));
    }
    if (endDate) {
      ledgerWhere.push(lte(ledgerEntries.createdAt, new Date(endDate)));
    }

    const [ledgerAgg] = await db
      .select({
        income: sql<string>`COALESCE(SUM(${ledgerEntries.credit}), '0')`,
        expense: sql<string>`COALESCE(SUM(${ledgerEntries.debit}), '0')`,
      })
      .from(ledgerEntries)
      .where(and(...ledgerWhere));

    const [txAgg, pendingAgg] = await Promise.all([
      db
        .select({ count: count() })
        .from(walletTransactions)
        .where(eq(walletTransactions.walletId, walletId)),
      db
        .select({ count: count() })
        .from(walletTransactions)
        .where(and(eq(walletTransactions.walletId, walletId), eq(walletTransactions.status, 'PENDING'))),
    ]);

    return {
      total: txAgg[0]?.count || 0,
      pending: pendingAgg[0]?.count || 0,
      income: parseFloat(ledgerAgg?.income || '0'),
      expense: parseFloat(ledgerAgg?.expense || '0'),
    };
  } catch (error) {
    console.error('Error getting wallet ledger stats:', error);
    return { total: 0, pending: 0, income: 0, expense: 0 };
  }
}

export async function getWalletLedgerDailyFlow(walletId: string, days: number = 7): Promise<number[]> {
  try {
    const wallet = await getUserWalletById(walletId);
    if (!wallet?.financialAccountId) {
      return Array.from({ length: days }, () => 0);
    }

    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date();
    start.setDate(end.getDate() - (days - 1));
    start.setHours(0, 0, 0, 0);

    const rows = await db
      .select({
        day: sql<string>`to_char(${ledgerEntries.createdAt}, 'YYYY-MM-DD')`,
        income: sql<string>`COALESCE(SUM(${ledgerEntries.credit}), '0')`,
        expense: sql<string>`COALESCE(SUM(${ledgerEntries.debit}), '0')`,
      })
      .from(ledgerEntries)
      .where(and(
        eq(ledgerEntries.accountId, wallet.financialAccountId),
        gte(ledgerEntries.createdAt, start),
        lte(ledgerEntries.createdAt, end),
      ))
      .groupBy(sql`to_char(${ledgerEntries.createdAt}, 'YYYY-MM-DD')`)
      .orderBy(sql`to_char(${ledgerEntries.createdAt}, 'YYYY-MM-DD')`);

    const map: Record<string, number> = {};
    for (const r of rows as any[]) {
      const net = parseFloat(r.income || '0') - parseFloat(r.expense || '0');
      map[r.day] = net;
    }

    const result: number[] = [];
    const cursor = new Date(start);
    for (let i = 0; i < days; i++) {
      const key = cursor.toISOString().slice(0, 10);
      result.push(map[key] ?? 0);
      cursor.setDate(cursor.getDate() + 1);
    }
    return result;
  } catch (error) {
    console.error('Error getting wallet ledger daily flow:', error);
    return Array.from({ length: days }, () => 0);
  }
}

// ============================================================================
// UTILITAIRES INTERNES
// ============================================================================

/**
 * Construit les conditions WHERE pour les wallets
 */
function buildWalletConditions(filters: UserWalletFilters, options: QueryOptions = {}) {
  const conditions = [];

  // Exclure les supprimés
  if (!options.includeDeleted) {
    conditions.push(eq(userWallets.isDeleted, false));
  }

  // Filtres spécifiques
  if (filters.userId) {
    conditions.push(eq(userWallets.userId, filters.userId));
  }
  if (filters.financialAccountId) {
    conditions.push(eq(userWallets.financialAccountId, filters.financialAccountId));
  }

  if (filters.isActive !== undefined) {
    conditions.push(eq(userWallets.isActive, filters.isActive));
  }

  if (filters.isLocked !== undefined) {
    conditions.push(eq(userWallets.isLocked, filters.isLocked));
  }

  if (filters.verificationStatus) {
    if (Array.isArray(filters.verificationStatus)) {
      conditions.push(inArray(userWallets.verificationStatus, filters.verificationStatus as any));
    } else {
      conditions.push(eq(userWallets.verificationStatus, filters.verificationStatus as any));
    }
  }

  // Les filtres de solde basés sur user_wallets.balance sont retirés

  return conditions.length > 0 ? and(...conditions) : undefined;
}

/**
 * Construit les conditions WHERE pour les transactions
 */
function buildTransactionConditions(filters: WalletTransactionFilters, options: QueryOptions = {}) {
  const conditions = [];

  // Exclure les supprimés
  if (!options.includeDeleted) {
    conditions.push(eq(walletTransactions.isDeleted, false));
  }

  // Filtres spécifiques
  if (filters.walletId) {
    conditions.push(eq(walletTransactions.walletId, filters.walletId));
  }
  if (filters.financialAccountId) {
    conditions.push(eq(walletTransactions.financialAccountId, filters.financialAccountId));
  }
  if (filters.shopId) {
    const shopAccountSubquery = db
      .select({ id: financialAccounts.id })
      .from(financialAccounts)
      .where(eq(financialAccounts.ownerShopId, filters.shopId));
    conditions.push(inArray(walletTransactions.financialAccountId, shopAccountSubquery));
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

  // Filtres de date
  if (filters.startDate) {
    conditions.push(gte(walletTransactions.createdAt, new Date(filters.startDate)));
  }

  if (filters.endDate) {
    conditions.push(lte(walletTransactions.createdAt, new Date(filters.endDate)));
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

/**
 * Détermine l'ordre de tri pour les wallets
 */
function getWalletSort(options: QueryOptions) {
  if (options.sortBy) {
    const sortField = options.sortBy as keyof UserWallet;
    const sortOrder = options.sortOrder === 'desc' ? desc : asc;
    return sortOrder(userWallets[sortField]);
  }
  return desc(userWallets.createdAt);
}

/**
 * Détermine l'ordre de tri pour les transactions
 */
function getTransactionSort(options: QueryOptions) {
  if (options.sortBy) {
    const sortField = options.sortBy as keyof WalletTransaction;
    const sortOrder = options.sortOrder === 'desc' ? desc : asc;
    return sortOrder(walletTransactions[sortField]);
  }
  return desc(walletTransactions.createdAt);
}

/**
 * Récupère le wallet de l'utilisateur courant
 */
export async function getCurrentUserWallet(): Promise<UserWallet | null> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return null;
    }
    return await getUserWalletByUserId(user.id);
  } catch (error) {
    console.error('Error getting current user wallet:', error);
    return null;
  }
}

/**
 * Récupère le solde de l'utilisateur courant
 */
export async function getCurrentUserBalance(): Promise<number> {
  try {
    const wallet = await getCurrentUserWallet();
    if (!wallet || !wallet.financialAccountId) return 0;
    const balance = await getAccountBalance(wallet.financialAccountId);
    return balance;
  } catch (error) {
    console.error('Error getting current user balance:', error);
    return 0;
  }
}
