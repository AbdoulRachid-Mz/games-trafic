import { db } from "@/lib/db";
import {
  walletTransactions,
  ledgerEntries,
  type WalletTransaction,
} from "@/database/schema";
import { eq, and, inArray, sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/session";
import { assertCanRefund, getAdminLevel } from "@/lib/auth/permissions";
import { getAccountBalance } from "../ledger/ledger-engine";
import { fromCents, toCents } from "../core/postings";
import { computeRefundReversal } from "./refund-math";
import { writeFinancialAuditLog } from "../audit/audit-log";
import { loadFinancePolicy } from "../policies/limits";
import { canRefund, assertPolicyAllowed } from "../policies/admin-policy";

export { computeRefundReversal };
export type {
  RefundReversalInput,
  ReversalEntry,
} from "./refund-math";

export interface RefundOptions {
  reason?: string;
  /**
   * Remboursement partiel en GTC. Si absent, le reliquat remboursable est soldé.
   * Ne jamais fournir un montant supérieur au reliquat : REFUND_EXCEEDS_REMAINING.
   */
  amount?: number;
  /**
   * Transaction Drizzle existante (composition atomique avec l'annulation
   * métier, par exemple une commande).
   */
  client?: any;
  /**
   * Acteur interne (annulation métier : commande, inscription). Contourne
   * volontairement les plafonds admin : ce n'est pas un remboursement
   * discrétionnaire. Usage interne au serveur uniquement.
   */
  internalActorId?: string;
}

/**
 * Exécute un remboursement autoritaire et atomique d'une transaction terminée.
 *
 * - L'identité de l'approbateur vient UNIQUEMENT de la session serveur.
 * - Les écritures d'origine sont inversées (débit ↔ crédit, mêmes comptes).
 * - Les remboursements partiels sont proportionnels et cumulables.
 * - Un remboursement total passe la transaction d'origine en REFUNDED.
 */
export async function executeRefund(
  originalTransactionId: string,
  options: RefundOptions = {}
): Promise<WalletTransaction> {
  const currentUser = await getCurrentUser();
  if (!options.internalActorId) {
    assertCanRefund(currentUser);
  }
  const processedBy = options.internalActorId ?? currentUser!.id;

  const run = async (tx: any): Promise<WalletTransaction> => {
    // 1. Verrouiller la transaction d'origine
    const [originalTx] = await tx
      .select()
      .from(walletTransactions)
      .where(eq(walletTransactions.id, originalTransactionId))
      .for("update");

    if (!originalTx) {
      throw new Error(
        `TRANSACTION_NOT_FOUND: Transaction ${originalTransactionId} introuvable.`
      );
    }

    if (originalTx.type === "REFUND") {
      throw new Error(
        "INVALID_TRANSACTION_TYPE: Une transaction de remboursement ne peut pas être remboursée."
      );
    }

    if (originalTx.status === "REFUNDED") {
      throw new Error(
        "TRANSACTION_ALREADY_REFUNDED: Cette transaction a déjà été intégralement remboursée."
      );
    }

    if (originalTx.status !== "COMPLETED") {
      // Une capture escrow (ORDER_PURCHASE) est PENDING tant que la commande
      // n'est pas finalisée : l'annulation doit pouvoir la contre-passer.
      const isReversibleReservation =
        (originalTx.type === "ORDER_PURCHASE" ||
          originalTx.type === "TOURNAMENT_PARTICIPATION") &&
        (originalTx.status === "PENDING" || originalTx.status === "PROCESSING");

      if (!isReversibleReservation) {
        throw new Error(
          `INVALID_STATUS: Seules les transactions terminées peuvent être remboursées (statut actuel: ${originalTx.status}).`
        );
      }
    }

    // 2. Écritures d'origine
    const originalEntries = await tx
      .select()
      .from(ledgerEntries)
      .where(eq(ledgerEntries.transactionId, originalTransactionId));

    if (originalEntries.length === 0) {
      throw new Error(
        "LEDGER_INTEGRITY_ERROR: Aucune écriture de ledger trouvée pour cette transaction."
      );
    }

    // 3. Remboursements déjà effectués
    const priorRefunds: Array<{ id: string; amount: string }> = await tx
      .select({
        id: walletTransactions.id,
        amount: walletTransactions.amount,
      })
      .from(walletTransactions)
      .where(
        and(
          eq(walletTransactions.type, "REFUND"),
          eq(walletTransactions.status, "COMPLETED"),
          sql`${walletTransactions.metadata}->>'originalTransactionId' = ${originalTransactionId}`
        )
      );

    const originalTotal = toCents(originalTx.amount);
    if (originalTotal <= 0) {
      throw new Error(
        "INVALID_AMOUNT: La transaction d'origine a un montant nul ou négatif."
      );
    }

    const alreadyRefunded = priorRefunds.reduce(
      (sum, refund) => sum + toCents(refund.amount),
      0
    );
    const remaining = originalTotal - alreadyRefunded;

    if (remaining <= 0) {
      throw new Error(
        "TRANSACTION_ALREADY_REFUNDED: Le reliquat remboursable est nul."
      );
    }

    const requested =
      options.amount !== undefined ? toCents(options.amount) : remaining;

    if (!Number.isFinite(requested) || requested <= 0) {
      throw new Error("INVALID_AMOUNT: Le montant du remboursement doit être positif.");
    }

    if (requested > remaining) {
      throw new Error(
        `REFUND_EXCEEDS_REMAINING: Montant demandé ${fromCents(requested)} GTC, reliquat ${fromCents(remaining)} GTC.`
      );
    }

    // Plafond de remboursement selon le niveau A/B/C (jamais C).
    // Les annulations métier internes ne sont pas plafonnées.
    if (!options.internalActorId) {
      const policy = await loadFinancePolicy();
      assertPolicyAllowed(
        canRefund(getAdminLevel(currentUser), requested / 100, policy)
      );
    }

    const isFullRefund = requested === remaining;

    // 4. Écritures inverses déjà appliquées
    const priorEntryIds = priorRefunds.map((refund) => refund.id);
    const priorReversalRows = priorEntryIds.length
      ? await tx
          .select({
            accountId: ledgerEntries.accountId,
            debit: sql<string>`COALESCE(SUM(${ledgerEntries.debit}), 0)`,
            credit: sql<string>`COALESCE(SUM(${ledgerEntries.credit}), 0)`,
          })
          .from(ledgerEntries)
          .where(inArray(ledgerEntries.transactionId, priorEntryIds))
          .groupBy(ledgerEntries.accountId)
      : [];

    // 5. Calcul des écritures inverses
    const reversalEntries = computeRefundReversal({
      originalEntries,
      priorReversalEntries: priorReversalRows,
      originalAmount: originalTotal / 100,
      alreadyRefunded: alreadyRefunded / 100,
      requested: requested / 100,
    });

    if (reversalEntries.length === 0) {
      throw new Error(
        "LEDGER_INTEGRITY_ERROR: Aucune écriture inverse calculable pour ce remboursement."
      );
    }

    // 6. Transaction de remboursement
    const [refundTx] = await tx
      .insert(walletTransactions)
      .values({
        walletId: originalTx.walletId,
        financialAccountId: originalTx.financialAccountId,
        fromUserId: originalTx.toUserId,
        toUserId: originalTx.fromUserId,
        amount: fromCents(requested),
        fees: "0",
        netAmount: fromCents(requested),
        balanceAfter: "0",
        type: "REFUND",
        status: "COMPLETED",
        description: `Remboursement${isFullRefund ? " total" : " partiel"} de la transaction ${originalTx.id}${options.reason ? `: ${options.reason}` : ""}`,
        metadata: {
          originalTransactionId: originalTx.id,
          reversalOf: originalTx.id,
          refundAmount: fromCents(requested),
          previouslyRefunded: fromCents(alreadyRefunded),
          remainingAfter: fromCents(remaining - requested),
          isFullRefund,
          refundReason: options.reason || "Remboursement administratif",
          processedBy,
        },
        completedAt: new Date(),
        createdAt: new Date(),
      })
      .returning();

    // 7. Écritures inverses
    for (const entry of reversalEntries) {
      await tx.insert(ledgerEntries).values({
        transactionId: refundTx.id,
        accountId: entry.accountId,
        debit: entry.debit,
        credit: entry.credit,
        currency: entry.currency || "GTC",
        createdAt: new Date(),
      });
    }

    // 8. Solde réel du compte source après remboursement
    const balanceAfterRefund = await getAccountBalance(
      originalTx.financialAccountId!,
      tx
    );

    await tx
      .update(walletTransactions)
      .set({ balanceAfter: balanceAfterRefund.toFixed(2) })
      .where(eq(walletTransactions.id, refundTx.id));

    // 9. Mettre à jour l'original (statut + traçabilité)
    const existingMetadata =
      typeof originalTx.metadata === "object" && originalTx.metadata !== null
        ? (originalTx.metadata as Record<string, unknown>)
        : {};

    await tx
      .update(walletTransactions)
      .set({
        status: isFullRefund ? "REFUNDED" : "COMPLETED",
        metadata: {
          ...existingMetadata,
          refundedAmount: fromCents(alreadyRefunded + requested),
          remainingRefundable: fromCents(remaining - requested),
          refunds: [
            ...(Array.isArray(existingMetadata.refunds)
              ? (existingMetadata.refunds as unknown[])
              : []),
            {
              refundTransactionId: refundTx.id,
              amount: fromCents(requested),
              processedBy,
              at: new Date().toISOString(),
            },
          ],
          ...(isFullRefund
            ? {
                reversedBy: refundTx.id,
                refundedAt: new Date().toISOString(),
                refundReason: options.reason,
              }
            : {}),
        },
      })
      .where(eq(walletTransactions.id, originalTx.id));

    await writeFinancialAuditLog(tx, {
      actorId: processedBy,
      actorLevel: getAdminLevel(currentUser),
      action: "REFUND_EXECUTED",
      transactionId: refundTx.id,
      accountId: originalTx.financialAccountId,
      amount: fromCents(requested),
      reason: options.reason || "Remboursement administratif",
      metadata: {
        originalTransactionId: originalTx.id,
        originalType: originalTx.type,
        refundTransactionId: refundTx.id,
        refundAmount: fromCents(requested),
        previouslyRefunded: fromCents(alreadyRefunded),
        remainingAfter: fromCents(remaining - requested),
        isFullRefund,
      },
    });

    return { ...refundTx, balanceAfter: balanceAfterRefund.toFixed(2) };
  };

  return options.client ? run(options.client) : db.transaction(run);
}
