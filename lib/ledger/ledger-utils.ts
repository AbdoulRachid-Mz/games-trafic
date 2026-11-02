// @/lib/ledger/ledger-utils.ts
// Retro-compatible facade for lib/finance/
"use server";

import { db } from "@/lib/db";
import {
  ledgerEntries,
  type FinancialAccount,
  type LedgerEntry,
  type WalletTransaction,
} from "@/database/schema";
import { eq, sql } from "drizzle-orm";

import {
  getAccountBalance as getAccountBalanceFromFinance,
  getOrCreatePlatformAccount as getOrCreatePlatformAccountFromFinance,
  verifyLedgerBalance as verifyLedgerBalanceFromFinance,
  executeAtomicTransfer,
  calculateTransactionFees as calculateFeesFromFinance,
  type ExecuteTransactionParams as FinanceExecuteParams,
  type ExecuteTransactionResult as FinanceExecuteResult,
} from "@/lib/finance";

export type ExecuteTransactionParams = FinanceExecuteParams;
export type ExecuteTransactionResult = FinanceExecuteResult;

export async function getAccountBalance(accountId: string): Promise<number> {
  return getAccountBalanceFromFinance(accountId);
}

export async function getOrCreatePlatformAccount(
  tx: any,
  type: "PLATFORM_ESCROW" | "PLATFORM_FEES" | "SYSTEM_ADJUSTMENT" | "TOURNAMENT_POOL"
): Promise<FinancialAccount> {
  return getOrCreatePlatformAccountFromFinance(tx, type as any);
}

export async function verifyLedgerBalance(accountId: string): Promise<{
  isValid: boolean;
  ledgerBalance: number;
  entryCount: number;
}> {
  const result = await verifyLedgerBalanceFromFinance(accountId);
  return {
    isValid: result.isValid,
    ledgerBalance: result.ledgerBalance,
    entryCount: result.entryCount,
  };
}

export async function verifyAccountExpenses(accountId: string): Promise<{
  isValid: boolean;
  ledgerBalance: number;
  entryCount: number;
}> {
  try {
    const [stats] = await db
      .select({
        entryCount: sql<number>`COUNT(*)`,
        totalDebit: sql<string>`COALESCE(SUM(${ledgerEntries.debit}), '0')`,
        totalCredit: sql<string>`COALESCE(SUM(${ledgerEntries.credit}), '0')`,
      })
      .from(ledgerEntries)
      .where(eq(ledgerEntries.accountId, accountId));

    const ledgerBalance =
      parseFloat(stats?.totalCredit || "0") - parseFloat(stats?.totalDebit || "0");

    return {
      isValid: true,
      ledgerBalance,
      entryCount: Number(stats?.entryCount || 0),
    };
  } catch (error) {
    console.error("Error verifying account expenses:", error);
    return { isValid: false, ledgerBalance: 0, entryCount: 0 };
  }
}

export async function verifyAccountRevenues(accountId: string): Promise<{
  isValid: boolean;
  ledgerBalance: number;
  entryCount: number;
}> {
  return verifyAccountExpenses(accountId);
}

export async function executeTransaction(
  params: ExecuteTransactionParams
): Promise<ExecuteTransactionResult> {
  return executeAtomicTransfer(params);
}

export async function calculateTransactionFees(
  type: string,
  amount: number
): Promise<{ feePercentage: number; fees: number; totalAmount: number }> {
  return calculateFeesFromFinance(type, amount);
}
