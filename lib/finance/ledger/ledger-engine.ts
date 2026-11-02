import { db } from "@/lib/db";
import {
  financialAccounts,
  ledgerEntries,
  walletTransactions,
  type FinancialAccount,
  type LedgerEntry,
  type WalletTransaction,
} from "@/database/schema";
import { eq, sql } from "drizzle-orm";
import type {
  ExecuteTransactionParams,
  ExecuteTransactionResult,
  LedgerBalanceVerification,
} from "../types";
import { calculateTransactionFees } from "../fees/fee-engine";

/**
 * Calcule le solde réel d'un compte financier directement depuis le Grand Livre (Ledger).
 * Source UNIQUE et autoritaire de vérité pour les soldes.
 */
export async function getAccountBalance(
  accountId: string,
  tx?: any
): Promise<number> {
  const runner = tx || db;
  try {
    const [result] = await runner
      .select({
        balance: sql<string>`COALESCE(SUM(${ledgerEntries.credit}) - SUM(${ledgerEntries.debit}), '0')`,
      })
      .from(ledgerEntries)
      .where(eq(ledgerEntries.accountId, accountId));

    return parseFloat(result?.balance || "0");
  } catch (error) {
    console.error("Error calculating account balance via ledger:", error);
    return 0;
  }
}

/**
 * Récupère ou crée de façon idempotente un compte système de la plateforme.
 */
export async function getOrCreatePlatformAccount(
  tx: any,
  type: "PLATFORM_ESCROW" | "PLATFORM_FEES" | "SYSTEM_ADJUSTMENT" | "TOURNAMENT_POOL"
): Promise<FinancialAccount> {
  const [existing] = await tx
    .select()
    .from(financialAccounts)
    .where(eq(financialAccounts.type, type))
    .limit(1);

  if (existing) {
    return existing as FinancialAccount;
  }

  const [created] = await tx
    .insert(financialAccounts)
    .values({
      type,
      currency: "GTC",
      isActive: true,
    })
    .returning();

  return created as FinancialAccount;
}

/**
 * Vérifie l'intégrité comptable du ledger pour un compte spécifique.
 */
export async function verifyLedgerBalance(
  accountId: string,
  tx?: any
): Promise<LedgerBalanceVerification> {
  const runner = tx || db;
  try {
    const [stats] = await runner
      .select({
        entryCount: sql<number>`COUNT(*)`,
        totalDebit: sql<string>`COALESCE(SUM(${ledgerEntries.debit}), '0')`,
        totalCredit: sql<string>`COALESCE(SUM(${ledgerEntries.credit}), '0')`,
      })
      .from(ledgerEntries)
      .where(eq(ledgerEntries.accountId, accountId));

    const totalDebit = parseFloat(stats?.totalDebit || "0");
    const totalCredit = parseFloat(stats?.totalCredit || "0");
    const ledgerBalance = totalCredit - totalDebit;

    return {
      isValid: true,
      ledgerBalance,
      entryCount: Number(stats?.entryCount || 0),
      totalDebit,
      totalCredit,
    };
  } catch (error) {
    console.error("Error verifying ledger balance:", error);
    return {
      isValid: false,
      ledgerBalance: 0,
      entryCount: 0,
      totalDebit: 0,
      totalCredit: 0,
    };
  }
}

/**
 * Exécute un transfert atomique dans le Grand Livre avec respect strict
 * du principe de la partie double (double-entry bookkeeping).
 */
export async function executeAtomicTransfer(
  params: ExecuteTransactionParams
): Promise<ExecuteTransactionResult> {
  const {
    fromAccountId,
    toAccountId,
    amount,
    type,
    description,
    metadata = {},
    userId,
    walletId,
    tx: existingTx,
  } = params;

  if (amount <= 0 || isNaN(amount)) {
    throw new Error("Le montant de la transaction doit être supérieur à zéro");
  }

  if (fromAccountId === toAccountId) {
    throw new Error("Les comptes source et destination doivent être distincts");
  }

  const operation = async (tx: any): Promise<ExecuteTransactionResult> => {
    // 🔐 Verrouillage pessimiste FOR UPDATE des deux comptes pour éliminer tout double-spend
    const [fromAccount] = await tx
      .select()
      .from(financialAccounts)
      .where(eq(financialAccounts.id, fromAccountId))
      .for("update");

    const [toAccount] = await tx
      .select()
      .from(financialAccounts)
      .where(eq(financialAccounts.id, toAccountId))
      .for("update");

    if (!fromAccount) throw new Error("Compte financier source introuvable");
    if (!toAccount) throw new Error("Compte financier destination introuvable");

    if (!fromAccount.isActive) throw new Error("Compte financier source inactif");
    if (fromAccount.isLocked) throw new Error("Compte financier source verrouillé");
    if (!toAccount.isActive) throw new Error("Compte financier destination inactif");
    if (toAccount.isLocked) throw new Error("Compte financier destination verrouillé");

    // Calcul du solde disponible actuel
    const fromBalanceResult = await tx
      .select({
        balance: sql<string>`COALESCE(SUM(${ledgerEntries.credit}) - SUM(${ledgerEntries.debit}), '0')`,
      })
      .from(ledgerEntries)
      .where(eq(ledgerEntries.accountId, fromAccountId));

    const fromBalance = parseFloat(fromBalanceResult[0]?.balance || "0");

    // Vérification du solde (sauf pour injection de crédit initial ou ajustement système)
    const isCreditSource =
      fromAccount.type === "SYSTEM_ADJUSTMENT" || type === "DEPOSIT" || type === "BONUS";

    if (!isCreditSource && fromBalance < amount) {
      throw new Error(`Solde insuffisant (disponible: ${fromBalance} GTC, requis: ${amount} GTC)`);
    }

    // 💡 Calcul centralisé et autoritaire des frais
    const feeCalc = await calculateTransactionFees(type, amount);
    const fees = feeCalc.fees;
    const netAmount = feeCalc.netAmount;

    const newFromBalance = fromBalance - amount;

    // Calcul du solde de destination
    const toBalanceResult = await tx
      .select({
        balance: sql<string>`COALESCE(SUM(${ledgerEntries.credit}) - SUM(${ledgerEntries.debit}), '0')`,
      })
      .from(ledgerEntries)
      .where(eq(ledgerEntries.accountId, toAccountId));

    const toBalance = parseFloat(toBalanceResult[0]?.balance || "0");
    const newToBalance = toBalance + netAmount;

    // 💾 Insertion de la transaction dans le journal wallet
    const transactionData: any = {
      walletId,
      financialAccountId: fromAccountId,
      amount: amount.toFixed(2),
      fees: fees.toFixed(2),
      netAmount: netAmount.toFixed(2),
      balanceAfter: newFromBalance.toFixed(2),
      type,
      status: params.status || "COMPLETED",
      description: description || `Transaction ${type}`,
      metadata: {
        ...metadata,
        fromAccountId,
        toAccountId,
        calculatedFees: feeCalc,
        totalAmount: amount.toFixed(2),
      },
      createdAt: new Date(),
    };

    if (userId) {
      transactionData.fromUserId = userId;
    }

    const [transaction] = await tx
      .insert(walletTransactions)
      .values(transactionData)
      .returning();

    // 📒 Écritures comptables en partie double (Double-entry)
    const entries: LedgerEntry[] = [];

    // 1. Débit du compte source pour le montant brut total
    const [debitEntry] = await tx
      .insert(ledgerEntries)
      .values({
        transactionId: transaction.id,
        accountId: fromAccountId,
        debit: amount.toFixed(2),
        credit: "0",
        currency: "GTC",
        createdAt: new Date(),
      })
      .returning();
    entries.push(debitEntry as LedgerEntry);

    // 2. Crédit du compte destination pour le montant net
    const [creditEntry] = await tx
      .insert(ledgerEntries)
      .values({
        transactionId: transaction.id,
        accountId: toAccountId,
        debit: "0",
        credit: netAmount.toFixed(2),
        currency: "GTC",
        createdAt: new Date(),
      })
      .returning();
    entries.push(creditEntry as LedgerEntry);

    // 3. Si des frais sont prélevés, crédit du compte PLATFORM_FEES
    if (fees > 0) {
      const feeAccount = await getOrCreatePlatformAccount(tx, "PLATFORM_FEES");
      const [feeEntry] = await tx
        .insert(ledgerEntries)
        .values({
          transactionId: transaction.id,
          accountId: feeAccount.id,
          debit: "0",
          credit: fees.toFixed(2),
          currency: "GTC",
          createdAt: new Date(),
        })
        .returning();
      entries.push(feeEntry as LedgerEntry);
    }

    return {
      transaction: transaction as WalletTransaction,
      ledgerEntries: entries,
      fromBalance: newFromBalance,
      toBalance: newToBalance,
      fees,
      netAmount,
    };
  };

  if (existingTx) {
    return await operation(existingTx);
  } else {
    return await db.transaction(operation);
  }
}
