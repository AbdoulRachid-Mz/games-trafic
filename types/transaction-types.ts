export type TransactionType =
  | 'THEME_PURCHASE'
  | 'VIP_SUBSCRIPTION'
  | 'PRODUCT_PURCHASE'
  | 'TOURNAMENT_PARTICIPATION'
  | 'GAME_ITEM_PURCHASE'
  | 'DEPOSIT'
  | 'WITHDRAWAL'
  | 'TRANSFER';



export interface TransactionEntity {
  id: string;
  name: string;
  description?: string;
  price?: number;
  currency?: string;
  image?: string;
  metadata?: Record<string, any>;
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
  PRODUCT_PURCHASE: {
    type: 'PRODUCT_PURCHASE',
    label: 'Achat de produit',
    requiresEntity: true,
    entityType: 'product',
    needsTargetId: true,
    feeType: 'purchase',
    steps: ['ENTITY_SELECTION', 'AMOUNT_INPUT', 'PIN_VERIFICATION', 'CONFIRMATION', 'SUCCESS']
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
  }
};

export interface TransactionData {
  type: TransactionType;
  amount: number;

  // ⚠️ IMPORTANT: Use accountId for ledger-based operations
  fromAccountId?: string;
  toAccountId?: string;

  // Legacy: kept for backward compatibility with wallet-based operations
  fromWalletId?: string;
  toWalletId?: string;

  targetId?: string;
  entity?: TransactionEntity;
  recipientWalletId?: string;
  recipientAccountId?: string;
  recipientUser?: {
    id: string;
    name: string;
    walletNumber: string;
  };

  metadata: {
    paymentMethod?: string;
    paymentProvider?: string;
    paymentAccountId?: string;
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
