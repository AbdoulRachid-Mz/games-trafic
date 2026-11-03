import { db } from "@/lib/db";
import {
  walletTransactions,
  ledgerEntries,
  type WalletTransaction,
} from "@/database/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/session";
import { assertCanRefund, isAdmin as checkIsAdmin } from "@/lib/auth/permissions";

export interface RefundOptions {
  reason?: string;
  adminId?: string;
  amount?: number; // Optional partial refund, default is full amount
}

/**
 * Executes an authoritative, atomic refund of a completed transaction.
 * Strictly reverses original ledger entries (credit ↔ debit on the same accounts)
 * and links reversal metadata.
 */
export async function executeRefund(
  originalTransactionId: string,
  options: RefundOptions = {}
): Promise<WalletTransaction> {
  const currentUser = await getCurrentUser();
  if (!options.adminId) {
    assertCanRefund(currentUser);
  }

  const effectiveAdminId = currentUser?.id || options.adminId || "system";

  return await db.transaction(async (tx) => {
    // 1. Fetch original transaction with lock
    const [originalTx] = await tx
      .select()
      .from(walletTransactions)
      .where(eq(walletTransactions.id, originalTransactionId))
      .for("update");

    if (!originalTx) {
      throw new Error(`TRANSACTION_NOT_FOUND: Transaction ${originalTransactionId} introuvable.`);
    }

    if (originalTx.status === "REFUNDED") {
      throw new Error("TRANSACTION_ALREADY_REFUNDED: Cette transaction a déjà été remboursée.");
    }

    if (originalTx.status !== "COMPLETED") {
      throw new Error(
        `INVALID_STATUS: Seules les transactions terminées peuvent être remboursées (statut actuel: ${originalTx.status}).`
      );
    }

    // 2. Check if a refund transaction already exists for this original transaction
    const existingRefund = await tx.query.walletTransactions.findFirst({
      where: and(
        eq(walletTransactions.type, "REFUND"),
        eq(walletTransactions.status, "COMPLETED")
      ),
    });

    if (
      existingRefund &&
      (existingRefund.metadata as any)?.originalTransactionId === originalTransactionId
    ) {
      throw new Error("TRANSACTION_ALREADY_REFUNDED: Un remboursement lié existe déjà.");
    }

    // 3. Fetch original ledger entries
    const originalEntries = await tx
      .select()
      .from(ledgerEntries)
      .where(eq(ledgerEntries.transactionId, originalTransactionId));

    if (originalEntries.length === 0) {
      throw new Error("LEDGER_INTEGRITY_ERROR: Aucune écriture de ledger trouvée pour cette transaction.");
    }

    const refundAmount = options.amount
      ? options.amount.toString()
      : originalTx.amount;

    const refundNetAmount = options.amount
      ? options.amount.toString()
      : originalTx.netAmount;

    // 4. Insert refund transaction record
    const [refundTx] = await tx
      .insert(walletTransactions)
      .values({
        walletId: originalTx.walletId,
        financialAccountId: originalTx.financialAccountId,
        fromUserId: originalTx.toUserId,
        toUserId: originalTx.fromUserId,
        amount: refundAmount,
        fees: "0",
        netAmount: refundNetAmount,
        balanceAfter: originalTx.balanceAfter,
        type: "REFUND",
        status: "COMPLETED",
        description: `Remboursement de la transaction ${originalTx.id}${options.reason ? `: ${options.reason}` : ""}`,
        metadata: {
          originalTransactionId: originalTx.id,
          reversalOf: originalTx.id,
          refundReason: options.reason || "Remboursement administratif",
          processedBy: effectiveAdminId,
        },
        createdAt: new Date(),
      })
      .returning();

    // 5. Invert ledger entries: swap debit and credit on original accounts
    for (const entry of originalEntries) {
      await tx.insert(ledgerEntries).values({
        transactionId: refundTx.id,
        accountId: entry.accountId,
        // Reverse debit and credit
        debit: entry.credit,
        credit: entry.debit,
        currency: entry.currency || "GTC",
        createdAt: new Date(),
      });
    }

    // 6. Update original transaction status and link to reversal
    const existingMetadata =
      typeof originalTx.metadata === "object" && originalTx.metadata !== null
        ? originalTx.metadata
        : {};

    await tx
      .update(walletTransactions)
      .set({
        status: "REFUNDED",
        metadata: {
          ...existingMetadata,
          reversedBy: refundTx.id,
          refundedAt: new Date().toISOString(),
          refundReason: options.reason,
        },
      })
      .where(eq(walletTransactions.id, originalTx.id));

    return refundTx;
  });
}
