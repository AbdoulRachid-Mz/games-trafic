// @/lib/ledger/ledger-utils.ts
"use server";

import { db } from "@/lib/db";
import {
    financialAccounts,
    ledgerEntries,
    walletTransactions,
    userWallets,
    type FinancialAccount,
    type LedgerEntry,
    type WalletTransaction,
    type NewWalletTransaction,
} from "@/database/schema";
import { eq, sql, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/session";
import { getAppSettings } from "@/actions/app-settings";

// ============================================================================
// LEDGER BALANCE CALCULATIONS
// ============================================================================

/**
 * Calcule le solde d'un compte financier via le ledger
 * C'est la SEULE façon correcte de calculer un solde
 */
export async function getAccountBalance(accountId: string): Promise<number> {
    try {
        const [result] = await db
            .select({
                balance: sql<string>`COALESCE(SUM(${ledgerEntries.credit}) - SUM(${ledgerEntries.debit}), '0')`,
            })
            .from(ledgerEntries)
            .where(eq(ledgerEntries.accountId, accountId));

        return parseFloat(result?.balance || "0");
    } catch (error) {
        console.error("Error calculating account balance:", error);
        return 0;
    }
}

/**
 * Récupère ou crée un compte plateforme système
 */
export async function getOrCreatePlatformAccount(
    tx: any,
    type: "PLATFORM_ESCROW" | "PLATFORM_FEES" | "SYSTEM_ADJUSTMENT"
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
 * Vérifie la cohérence du ledger pour un compte
 * Utile pour le debugging et les audits
 */
export async function verifyLedgerBalance(accountId: string): Promise<{
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
            parseFloat(stats?.totalCredit || "0") -
            parseFloat(stats?.totalDebit || "0");

        return {
            isValid: true,
            ledgerBalance,
            entryCount: stats?.entryCount || 0,
        };
    } catch (error) {
        console.error("Error verifying ledger balance:", error);
        return {
            isValid: false,
            ledgerBalance: 0,
            entryCount: 0,
        };
    }
}

/**
 * Vérifie les depenses d'un compte
 * Utile pour le debugging et les audits
 */
export async function verifyAccountExpenses(accountId: string): Promise<{
    isValid: boolean;
    ledgerBalance: number;
    entryCount: number;
}> {
    try {
        const [stats] = await db
            .select({
                entryCount: sql<number>`COUNT(*)`, // Nombre d'écritures
                totalDebit: sql<string>`COALESCE(SUM(${ledgerEntries.debit}), '0')`, // Total débité
                totalCredit: sql<string>`COALESCE(SUM(${ledgerEntries.credit}), '0')`, // Total crédité
            })
            .from(ledgerEntries)
            .where(eq(ledgerEntries.accountId, accountId));

        const ledgerBalance =
            parseFloat(stats?.totalCredit || "0") -
            parseFloat(stats?.totalDebit || "0");

        return {
            isValid: true,
            ledgerBalance,
            entryCount: stats?.entryCount || 0,
        };
    } catch (error) {
        console.error("Error verifying ledger balance:", error);
        return {
            isValid: false,
            ledgerBalance: 0,
            entryCount: 0,
        };
    }
}

/**
 * Vérifie les revenus
 * Utile pour le debugging et les audits
 */
export async function verifyAccountRevenues(accountId: string): Promise<{
    isValid: boolean;
    ledgerBalance: number;
    entryCount: number;
}> {
    try {
        const [stats] = await db
            .select({
                entryCount: sql<number>`COUNT(*)`, // Nombre d'écritures
                totalDebit: sql<string>`COALESCE(SUM(${ledgerEntries.debit}), '0')`, // Total débité
                totalCredit: sql<string>`COALESCE(SUM(${ledgerEntries.credit}), '0')`, // Total crédité
            })
            .from(ledgerEntries)
            .where(eq(ledgerEntries.accountId, accountId));

        const ledgerBalance =
            parseFloat(stats?.totalCredit || "0") -
            parseFloat(stats?.totalDebit || "0");

        return {
            isValid: true,
            ledgerBalance,
            entryCount: stats?.entryCount || 0,
        };
    } catch (error) {
        console.error("Error verifying ledger balance:", error);
        return {
            isValid: false,
            ledgerBalance: 0,
            entryCount: 0,
        };
    }
}

// ============================================================================
// CORE TRANSACTION EXECUTION
// ============================================================================

export interface ExecuteTransactionParams {
    fromAccountId: string;
    toAccountId: string;
    amount: number;
    type: NewWalletTransaction["type"];
    status?: WalletTransaction["status"];
    description?: string;
    metadata?: Record<string, any>;
    userId?: string;
    walletId: string; // Required: wallet_id is NOT NULL in DB
    tx?: any; // Optional transaction context
}

export interface ExecuteTransactionResult {
    transaction: WalletTransaction;
    ledgerEntries: LedgerEntry[];
    fromBalance: number;
    toBalance: number;
}

/**
 * Fonction atomique centralisée pour exécuter une transaction
 * Garantit la comptabilité en partie double (double-entry accounting)
 * 
 * Règles:
 * - Toujours créer AU MOINS 2 ledger entries (débit + crédit)
 * - Vérifier le solde AVANT de débiter
 * - Utiliser une transaction DB atomique
 * - Lock les comptes concernés (FOR UPDATE)
 */
export async function executeTransaction(
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

    // Validation
    if (amount <= 0) {
        throw new Error("Le montant doit être supérieur à 0");
    }

    if (fromAccountId === toAccountId) {
        throw new Error("Les comptes source et destination doivent être différents");
    }

    const operation = async (tx: any) => {
        // 🔐 Lock les comptes (anti double-spend)
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

        if (!fromAccount) throw new Error("Compte source introuvable");
        if (!toAccount) throw new Error("Compte destination introuvable");

        if (!fromAccount.isActive) throw new Error("Compte source inactif");
        if (fromAccount.isLocked) throw new Error("Compte source verrouillé");
        if (!toAccount.isActive) throw new Error("Compte destination inactif");
        if (toAccount.isLocked) throw new Error("Compte destination verrouillé");

        // Calculer le solde actuel via ledger
        const fromBalanceResult = await tx
            .select({
                balance: sql<string>`COALESCE(SUM(${ledgerEntries.credit}) - SUM(${ledgerEntries.debit}), '0')`,
            })
            .from(ledgerEntries)
            .where(eq(ledgerEntries.accountId, fromAccountId));

        const fromBalance = parseFloat(fromBalanceResult[0]?.balance || "0");

        if (type !== "DEPOSIT" && fromBalance < amount) {
            throw new Error("Solde insuffisant");
        }

        // Calculer les frais
        const feeCalc = await calculateTransactionFees(type, amount);
        const fees = feeCalc.fees;
        const netAmount = amount - fees;
        const totalAmount = amount;

        // Calculer les nouveaux soldes
        const newFromBalance = fromBalance - amount;
        const toBalanceResult = await tx
            .select({
                balance: sql<string>`COALESCE(SUM(${ledgerEntries.credit}) - SUM(${ledgerEntries.debit}), '0')`,
            })
            .from(ledgerEntries)
            .where(eq(ledgerEntries.accountId, toAccountId));

        const toBalance = parseFloat(toBalanceResult[0]?.balance || "0");
        const newToBalance = toBalance + netAmount;

        // 💾 Créer la transaction wallet (pour l'historique utilisateur)
        const transactionData: any = {
            walletId, // Required: NOT NULL in DB
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
                totalAmount: totalAmount.toFixed(2),
            },
            createdAt: new Date(),
        };

        // Ajouter le fromUserId seulement s'il est défini
        if (userId) transactionData.fromUserId = userId;

        const [transaction] = await tx
            .insert(walletTransactions)
            .values(transactionData)
            .returning();

        // 📒 Créer les ledger entries (double-entry)
        const entries: LedgerEntry[] = [];

        // Entry 1: Débit du compte source
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

        // Entry 2: Crédit du compte destination (montant net)
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

        // Entry 3: Si des frais existent, les créditer au compte PLATFORM_FEES
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
        };
    };

    if (existingTx) {
        return await operation(existingTx);
    } else {
        return await db.transaction(operation);
    }
}

// ============================================================================
// FEE CALCULATION
// ============================================================================

async function calculateTransactionFees(
    type: string,
    amount: number
): Promise<{ feePercentage: number; fees: number; totalAmount: number }> {
    try {
        const settings = await getAppSettings();
        const user = await getCurrentUser();

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
            case "BONUS":
            case "REFUND":
                feePercentage = 0;
                break;
            default:
                feePercentage = 0;
        }

        // Réduction VIP (50%)
        if (user?.isVip) {
            feePercentage = Math.max(0, feePercentage * 0.5);
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
