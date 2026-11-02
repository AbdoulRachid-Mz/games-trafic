import type {
  WalletTransaction,
  NewWalletTransaction,
  FinancialAccount,
  LedgerEntry,
} from "@/database/schema";

export type TransactionType = NewWalletTransaction["type"];
export type TransactionStatus = NonNullable<WalletTransaction["status"]>;
export type FinancialAccountType = FinancialAccount["type"];

export interface FeeCalculation {
  feePercentage: number;
  fees: number;
  netAmount: number;
  totalAmount: number;
}

export interface FeeOptions {
  isVip?: boolean;
  customPercentage?: number;
}

export interface ExecuteTransactionParams {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  type: TransactionType;
  status?: TransactionStatus;
  description?: string;
  metadata?: Record<string, any>;
  userId?: string;
  walletId: string;
  tx?: any;
}

export interface ExecuteTransactionResult {
  transaction: WalletTransaction;
  ledgerEntries: LedgerEntry[];
  fromBalance: number;
  toBalance: number;
  fees: number;
  netAmount: number;
}

export interface LedgerBalanceVerification {
  isValid: boolean;
  ledgerBalance: number;
  entryCount: number;
  totalDebit: number;
  totalCredit: number;
}
