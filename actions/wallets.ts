// actions/wallets.ts - Actions serveur complètes
'use server';

import {
  userWallets,
  walletTransactions,
  users,
  type UserWallet,
  type NewUserWallet,
  type WalletTransaction,
  type NewWalletTransaction,
  type User,
  VerificationEnum,
} from '@/database/schema';
import {
  eq,
  and,
  or,
  desc,
  asc,
  sql,
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
export async function createUserWallet(
  walletData: NewUserWallet
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
    const defaultBalance = appSettings?.defaultUserBalance?.toString() || '250';

    // Générer un numéro de carte sécurisé
    const cardNumber = WalletUtils.generateSecureCardNumber();

    // Créer le wallet
    const [newWallet] = await db
      .insert(userWallets)
      .values({
        userId: walletData.userId,
        pinHash: walletData.pinHash,
        cardNumberHash: cardNumber,
        balance: defaultBalance,
        isActive: true,
        isLocked: false,
        failedAttempts: 0,
        verificationStatus: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Créer une transaction de bienvenue
    const welcomeTransaction: NewWalletTransaction = {
      walletId: newWallet.id,
      amount: defaultBalance,
      netAmount: defaultBalance,
      balanceAfter: defaultBalance,
      type: 'BONUS',
      status: 'COMPLETED',
      description: 'Bonus de bienvenue - Création de wallet',
      metadata: {
        type: 'WELCOME_BONUS',
        walletCreation: true,
      },
    };

    await createTransaction(welcomeTransaction);

    // Journalisation
    await createUserTrace({
      userId: walletData.userId,
      type: 'ACTION',
      entityId: newWallet.id,
      payload: {
        action: 'WALLET_CREATED',
        walletId: newWallet.id,
        bonusAmount: parseInt(defaultBalance),
        cardNumber,
      },
    });

    return newWallet;
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
      balance: '0', // Le bonus sera ajouté dans createUserWallet
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
        balance: newBalance,
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

    // Si c'est un retrait ou achat, vérifier le solde
    const spendTypes = ['PURCHASE', 'WITHDRAWAL', 'TRANSFER', 'VIP_SUBSCRIPTION', 'GAME_ITEM_PURCHASE'];
    if (spendTypes.includes(transactionData.type)) {
      const wallet = await getUserWalletById(transactionData.walletId);
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      const currentBalance = parseFloat(wallet.balance || '0');
      const amount = parseFloat(transactionData.amount);

      if (currentBalance < amount) {
        throw new Error('Solde insuffisant');
      }

      // Calculer le nouveau solde
      const newBalance = currentBalance - amount;
      balanceAfter = newBalance.toString();

      // Mettre à jour le solde du wallet
      await updateWalletBalance(transactionData.walletId, newBalance.toString());
    }

    // Créer la transaction
    const [newTransaction] = await db
      .insert(walletTransactions)
      .values({
        ...transactionData,
        fees,
        netAmount,
        balanceAfter,
        createdAt: new Date(),
      })
      .returning();

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

    // Vérifier le solde
    const fromBalance = parseFloat(fromWallet.balance || '0');
    if (fromBalance < amount) {
      return { success: false, error: 'Solde insuffisant' };
    }

    // Calculer les frais
    const fees = WalletUtils.calculateFees(amount, 'TRANSFER', false);
    const netAmount = amount - fees.amount;

    // Débiter l'expéditeur
    const newFromBalance = fromBalance - amount;
    await updateWalletBalance(fromWallet.id, newFromBalance.toString());

    // Créditer le destinataire
    const toBalance = parseFloat(toWallet.balance || '0');
    const newToBalance = toBalance + netAmount;
    await updateWalletBalance(toWallet.id, newToBalance.toString());

    // Créer la transaction de transfert
    const transaction = await createTransaction({
      walletId: fromWallet.id,
      fromUserId,
      toUserId,
      amount: amount.toString(),
      fees: fees.amount.toString(),
      netAmount: netAmount.toString(),
      balanceAfter: newFromBalance.toString(),
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
    await createTransaction({
      walletId: toWallet.id,
      fromUserId,
      toUserId,
      amount: netAmount.toString(),
      fees: '0',
      netAmount: netAmount.toString(),
      balanceAfter: newToBalance.toString(),
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

    // Calculer le nouveau solde
    const currentBalance = parseFloat(wallet.balance || '0');
    const newBalance = currentBalance + amount;

    // Mettre à jour le solde
    await updateWalletBalance(walletId, newBalance.toString());

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
        totalBalance: sql`sum(${userWallets.balance}::numeric)`,
        averageBalance: sql`avg(${userWallets.balance}::numeric)`,
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

  // Filtres de solde
  if (filters.balanceMin !== undefined) {
    conditions.push(gte(sql`${userWallets.balance}::numeric`, filters.balanceMin));
  }

  if (filters.balanceMax !== undefined) {
    conditions.push(lte(sql`${userWallets.balance}::numeric`, filters.balanceMax));
  }

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
    if (!wallet || !wallet.balance) {
      return 0;
    }
    return parseFloat(wallet.balance);
  } catch (error) {
    console.error('Error getting current user balance:', error);
    return 0;
  }
}