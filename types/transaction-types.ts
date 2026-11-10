import { transactionTypeEnum } from "@/database/schema";

export type PostgresTransactionType = (typeof transactionTypeEnum.enumValues)[number];

// Includes canonical PostgreSQL enum values + backwards-compatible UI aliases (I4-01, I4-02)
export type TransactionType =
  | PostgresTransactionType;



export interface TransactionEntity {
  id: string;
  name: string;
  description?: string;
  price?: number;
  currency?: string;
  image?: string;
  metadata?: Record<string, any>;
}

/**
 * Mode de tarification explicite (PROMPT.md §11.2).
 *
 * - FIXED : le prix de référence est CONNU (y compris 0 — un produit gratuit
 *   reste un produit avec prix) ; le montant ne peut pas être modifié.
 * - VARIABLE : l'utilisateur saisit librement le montant.
 * - QUANTITY : l'utilisateur saisit une quantité × prix unitaire.
 */
export type TransactionPricingMode = "FIXED" | "VARIABLE" | "QUANTITY";

/**
 * Type de contenu d'un item de jeu (détermine VARIABLE vs QUANTITY).
 * Les "coins"/monnaies se s'achètent en montant libre ; le reste en unités.
 */
export function isCurrencyLikeGameItem(entity?: TransactionEntity | null): boolean {
  const itemType =
    entity?.metadata?.type?.toString()?.toUpperCase() ||
    (entity as any)?.type?.toString()?.toUpperCase() ||
    "";
  return itemType === "COIN" || itemType === "CURRENCY";
}

/**
 * Mode de tarification, résolu de manière explicite — JAMAIS `!!price`
 * (incorrect pour un prix égal à 0). À utiliser côté UI et, en miroir,
 * pour documenter la revalidation serveur (prix reconfirmés en base).
 */
export function resolveTransactionPricingMode(
  transactionType: TransactionType,
  entity?: TransactionEntity | null,
): TransactionPricingMode {
  switch (transactionType) {
    case "GAME_ITEM_PURCHASE":
      return isCurrencyLikeGameItem(entity) ? "VARIABLE" : "QUANTITY";
    case "VIP_SUBSCRIPTION":
      // Tarif officiel (mensuel/annuel lu côté serveur) — non modifiable.
      return "FIXED";
    case "THEME_PURCHASE":
    case "ORDER_PURCHASE":
    case "TOURNAMENT_PARTICIPATION":
      // Prix de référence connu dès que l'entité le définit (0 compris).
      return entity?.price != null && Number.isFinite(entity.price)
        ? "FIXED"
        : "VARIABLE";
    default:
      // DEPOSIT, WITHDRAWAL, TRANSFER, PURCHASE, REFUND, BONUS, etc.
      return "VARIABLE";
  }
}

export interface TransactionConfig {
  type: TransactionType;
  label: string;
  requiresEntity: boolean;
  entityType?: string;
  needsTargetId: boolean;
  isAdminAction?: boolean;
  feeType: 'purchase' | 'transfer' | 'deposit' | 'withdrawal' | 'subscription' | 'participation';
  steps: TransactionStep[];
}

export type TransactionStep =
  | 'TYPE_SELECTION'
  | 'ENTITY_SELECTION'
  | 'AMOUNT_INPUT'
  | 'RECIPIENT_SELECTION'
  | 'DEPOSIT_DETAILS'
  | 'WITHDRAWAL_DETAILS'
  | 'PIN_VERIFICATION'
  | 'CONFIRMATION'
  | 'SUCCESS';

export const TRANSACTION_CONFIGS: Record<TransactionType, TransactionConfig> = {
  THEME_PURCHASE: {
    type: 'THEME_PURCHASE',
    label: 'Achat de thème',
    requiresEntity: true,
    entityType: 'theme',
    needsTargetId: true,
    feeType: 'purchase',
    steps: ['ENTITY_SELECTION', 'AMOUNT_INPUT', 'PIN_VERIFICATION', 'CONFIRMATION', 'SUCCESS']
  },
  VIP_SUBSCRIPTION: {
    type: 'VIP_SUBSCRIPTION',
    label: 'Abonnement VIP',
    requiresEntity: false,
    needsTargetId: false,
    feeType: 'subscription',
    steps: ['AMOUNT_INPUT', 'PIN_VERIFICATION', 'CONFIRMATION', 'SUCCESS']
  },
  TOURNAMENT_PARTICIPATION: {
    type: 'TOURNAMENT_PARTICIPATION',
    label: 'Participation tournoi',
    requiresEntity: true,
    entityType: 'tournament',
    needsTargetId: true,
    feeType: 'participation',
    steps: ['ENTITY_SELECTION', 'AMOUNT_INPUT', 'PIN_VERIFICATION', 'CONFIRMATION', 'SUCCESS']
  },
  GAME_ITEM_PURCHASE: {
    type: 'GAME_ITEM_PURCHASE',
    label: 'Achat item jeu',
    requiresEntity: true,
    entityType: 'gameItem',
    needsTargetId: true,
    feeType: 'purchase',
    steps: ['ENTITY_SELECTION', 'AMOUNT_INPUT', 'PIN_VERIFICATION', 'CONFIRMATION', 'SUCCESS']
  },
  DEPOSIT: {
    type: 'DEPOSIT',
    label: 'Dépôt',
    requiresEntity: false,
    needsTargetId: false,
    isAdminAction: true,
    feeType: 'deposit',
    steps: ['DEPOSIT_DETAILS', 'AMOUNT_INPUT', 'CONFIRMATION', 'SUCCESS']
  },
  WITHDRAWAL: {
    type: 'WITHDRAWAL',
    label: 'Retrait',
    requiresEntity: false,
    needsTargetId: false,
    isAdminAction: true,
    feeType: 'withdrawal',
    steps: ['WITHDRAWAL_DETAILS', 'AMOUNT_INPUT', 'PIN_VERIFICATION', 'CONFIRMATION', 'SUCCESS']
  },
  TRANSFER: {
    type: 'TRANSFER',
    label: 'Transfert',
    requiresEntity: false,
    needsTargetId: false,
    feeType: 'transfer',
    steps: ['RECIPIENT_SELECTION', 'AMOUNT_INPUT', 'PIN_VERIFICATION', 'CONFIRMATION', 'SUCCESS']
  },
  ORDER_PURCHASE: {
    type: 'ORDER_PURCHASE',
    label: 'Achat de produit',
    requiresEntity: true,
    entityType: 'product',
    needsTargetId: true,
    feeType: 'purchase',
    steps: ['ENTITY_SELECTION', 'AMOUNT_INPUT', 'PIN_VERIFICATION', 'CONFIRMATION', 'SUCCESS']
  },
  PURCHASE: {
    type: 'PURCHASE',
    label: 'Achat général',
    requiresEntity: false,
    needsTargetId: false,
    feeType: 'purchase',
    steps: ['AMOUNT_INPUT', 'CONFIRMATION', 'SUCCESS']
  },
  REFUND: {
    type: 'REFUND',
    label: 'Remboursement',
    requiresEntity: false,
    needsTargetId: false,
    isAdminAction: true,
    feeType: 'transfer',
    steps: ['AMOUNT_INPUT', 'CONFIRMATION', 'SUCCESS']
  },
  BONUS: {
    type: 'BONUS',
    label: 'Bonus / Gratification',
    requiresEntity: false,
    needsTargetId: false,
    isAdminAction: true,
    feeType: 'deposit',
    steps: ['AMOUNT_INPUT', 'CONFIRMATION', 'SUCCESS']
  }
};

export interface TransactionData {
  type: TransactionType;
  amount: number;

  // ⚠️ IMPORTANT: Use accountId for ledger-based operations
  fromAccountId?: string;
  toAccountId?: string;

  // Legacy (listé ci-dessous) supprimé : `fromWalletId` / `toWalletId` n'étaient
  // JAMAIS écrits ni lus par le flux de création (le wallet pèseur vient de la
  // session, la cible passe par recipientWalletId). Les colonnes DB
  // walletTransactions.from_wallet_id/to_wallet_id restent remplies côté
  // serveur (actions/transactions.ts) — jamais par un état UI.

  targetId?: string;
  entity?: TransactionEntity;
  /**
   * Wallet destinataire d'un TRANSFER.
   * ⚠️ L'exécution serveur lit `metadata.recipientWalletId`
   * (voir actions/transactions.ts) — le champ build-value ici est recopié
   * dans metadata avant l'appel ; ne pas en faire deux sources de vérité.
   */
  recipientWalletId?: string;
  recipientAccountId?: string;
  recipientUser?: {
    id: string;
    name: string;
    walletNumber: string;
  };
  /** Nom du bénéficiaire (affichage reçu/confirmation, non authentifié). */
  recipientName?: string;
  /** Note libre attachée par l'utilisateur (persistée en metadata). */
  notes?: string;

  metadata: {
    paymentMethod?: string;
    paymentProvider?: string;
    paymentAccountId?: string;
    /**
     * TRANSFER uniquement : wallet destinataire lu par l'exécution serveur
     * (createTransaction) — la colonne recipient_wallet_id est KEY.
     */
    recipientWalletId?: string;
    description?: string;
    feePercentage?: number;
    entityData?: any;
    gameAccount?: string;
    encryptedPassword?: string;
    additionalInfo?: string;
    buyerInstructions?: string;
    sellerInstructions?: string;
    originalAmount?: number;
    image?: string;
  };
}

export interface TransactionFee {
  percentage: number;
  amount: number;
  totalAmount: number;
}

// ============================================================================
// LEDGER-BASED TRANSACTION TYPES
// ============================================================================

/**
 * Data structure for executing a ledger-based transaction
 * This enforces double-entry accounting principles
 */
export interface LedgerTransactionData {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  type: TransactionType;
  description?: string;
  metadata?: Record<string, any>;
}

/**
 * Result of a ledger transaction execution
 */
export interface LedgerTransactionResult {
  transactionId: string;
  ledgerEntries: Array<{
    id: string;
    accountId: string;
    debit: string;
    credit: string;
  }>;
  fromAccountBalance: number;
  toAccountBalance: number;
}
