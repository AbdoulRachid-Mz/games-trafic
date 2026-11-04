/**
 * lib/finance/requests/approval.ts
 *
 * Approbation et rejet des demandes d'émission GTC.
 * L'acteur est toujours relu depuis la session serveur et ses droits
 * sont revérifiés en base dans la transaction.
 */

import { db } from "@/lib/db";
import {
  transactionCreditRequests,
  userWallets,
  type WalletTransaction,
} from "@/database/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/session";
import { assertAuthenticated } from "@/lib/auth/permissions";
import { FinanceError } from "../core/errors";
import { executeIssuance } from "../transactions/issuance";
import {
  canApproveCreditRequest,
  assertPolicyAllowed,
} from "../policies/admin-policy";
import { loadFinancePolicy } from "../policies/limits";
import { writeFinancialAuditLog } from "../audit/audit-log";
import {
  loadAdminActor,
  type CreditRequest,
} from "./credit-requests";

export interface ApprovalResult {
  request: CreditRequest;
  transaction?: WalletTransaction;
  requiresSecondApproval: boolean;
}

const readFirstApproverLevel = (
  metadata: unknown
): "A" | "B" | "C" | null => {
  if (!metadata || typeof metadata !== "object") return null;
  const value = (metadata as Record<string, unknown>).firstApproverLevel;
  return value === "A" || value === "B" || value === "C" ? value : null;
};

/**
 * Approuve une demande. Si le montant dépasse le seuil de double
 * approbation, le premier appel enregistre le premier approbateur et
 * laisse la demande PENDING ; le second appel exécute l'émission.
 */
export async function approveCreditRequest(
  requestId: string
): Promise<ApprovalResult> {
  const currentUser = await getCurrentUser();
  assertAuthenticated(currentUser);

  return db.transaction(async (tx) => {
    const actor = await loadAdminActor(tx, currentUser.id);
    const policy = await loadFinancePolicy();

    const [request] = await tx
      .select()
      .from(transactionCreditRequests)
      .where(eq(transactionCreditRequests.id, requestId))
      .for("update");

    if (!request) {
      throw new FinanceError(
        "TRANSACTION_NOT_FOUND",
        "Demande de crédit introuvable."
      );
    }
    if (request.status !== "PENDING") {
      throw new FinanceError(
        "INVALID_STATUS",
        `Cette demande n'est plus en attente (statut: ${request.status}).`
      );
    }

    const amount = Number(request.amount);
    const firstApproverId = request.decidedBy ?? null;
    const firstApproverLevel = readFirstApproverLevel(request.metadata);

    assertPolicyAllowed(
      canApproveCreditRequest({
        approverLevel: actor.level,
        approverId: actor.id,
        requesterId: request.requesterId,
        requesterLevel: request.requesterLevel,
        amount,
        policy,
        firstApproverId,
        firstApproverLevel,
      })
    );

    const needsSecond = amount > policy.creditRequest.secondApprovalThreshold;

    // Premier approbateur d'une demande à double approbation : on ne crédite rien.
    if (needsSecond && !firstApproverId) {
      const [updated] = await tx
        .update(transactionCreditRequests)
        .set({
          decidedBy: actor.id,
          decidedAt: new Date(),
          metadata: {
            ...(typeof request.metadata === "object" && request.metadata
              ? (request.metadata as Record<string, unknown>)
              : {}),
            firstApproverId: actor.id,
            firstApproverLevel: actor.level,
            awaitingSecondApproval: true,
          },
          updatedAt: new Date(),
        })
        .where(eq(transactionCreditRequests.id, request.id))
        .returning();

      await writeFinancialAuditLog(tx, {
        actorId: actor.id,
        actorLevel: actor.level,
        action: "CREDIT_REQUEST_FIRST_APPROVAL",
        requestId: request.id,
        amount,
        reason: request.reason,
        metadata: {
          requesterId: request.requesterId,
          awaitingSecondApproval: true,
        },
      });

      return {
        request: updated as CreditRequest,
        requiresSecondApproval: true,
      };
    }

    // Crédit du wallet bénéficiaire (relu et verrouillé dans la transaction).
    const [wallet] = await tx
      .select({
        id: userWallets.id,
        userId: userWallets.userId,
        financialAccountId: userWallets.financialAccountId,
        isActive: userWallets.isActive,
        isLocked: userWallets.isLocked,
      })
      .from(userWallets)
      .where(eq(userWallets.id, request.recipientWalletId))
      .for("update");

    if (!wallet) {
      throw new FinanceError("ACCOUNT_NOT_FOUND", "Wallet bénéficiaire introuvable.");
    }
    if (wallet.userId !== request.recipientUserId) {
      throw new FinanceError(
        "VALIDATION_ERROR",
        "Le wallet bénéficiaire ne correspond plus à la demande."
      );
    }
    if (!wallet.financialAccountId) {
      throw new FinanceError(
        "ACCOUNT_NOT_FOUND",
        "Aucun compte financier lié au wallet bénéficiaire."
      );
    }
    if (wallet.isActive === false) {
      throw new FinanceError("ACCOUNT_INACTIVE", "Wallet bénéficiaire inactif.");
    }
    if (wallet.isLocked === true) {
      throw new FinanceError("ACCOUNT_LOCKED", "Wallet bénéficiaire verrouillé.");
    }

    // Émission GTC : débite SYSTEM_GTC_ISSUANCE, crédite le bénéficiaire.
    // Aucun wallet administrateur n'est touché.
    const issuance = await executeIssuance({
      toAccountId: wallet.financialAccountId,
      toUserId: request.recipientUserId,
      amount,
      walletId: wallet.id,
      walletAccountId: wallet.financialAccountId,
      actorId: actor.id,
      actorLevel: actor.level,
      reason: request.reason,
      metadata: {
        creditRequestId: request.id,
        requesterId: request.requesterId,
        firstApproverId: firstApproverId ?? actor.id,
        secondApproverId: firstApproverId ? actor.id : null,
      },
      idempotencyKey: `credit-request:${request.id}`,
      client: tx,
    });

    const [updated] = await tx
      .update(transactionCreditRequests)
      .set({
        status: "APPROVED",
        decidedBy: firstApproverId ?? actor.id,
        decidedAt: new Date(),
        secondApproverId: firstApproverId ? actor.id : null,
        transactionId: issuance.transaction.id,
        metadata: {
          ...(typeof request.metadata === "object" && request.metadata
            ? (request.metadata as Record<string, unknown>)
            : {}),
          awaitingSecondApproval: false,
          approvedBy: actor.id,
          approvedByLevel: actor.level,
        },
        updatedAt: new Date(),
      })
      .where(eq(transactionCreditRequests.id, request.id))
      .returning();

    await writeFinancialAuditLog(tx, {
      actorId: actor.id,
      actorLevel: actor.level,
      action: "CREDIT_REQUEST_APPROVED",
      requestId: request.id,
      transactionId: issuance.transaction.id,
      accountId: wallet.financialAccountId,
      amount,
      reason: request.reason,
      metadata: {
        requesterId: request.requesterId,
        recipientUserId: request.recipientUserId,
        firstApproverId: firstApproverId ?? actor.id,
        secondApproverId: firstApproverId ? actor.id : null,
      },
    });

    return {
      request: updated as CreditRequest,
      transaction: issuance.transaction,
      requiresSecondApproval: false,
    };
  });
}

/**
 * Rejette une demande. Aucun mouvement ledger.
 */
export async function rejectCreditRequest(
  requestId: string,
  reason: string
): Promise<CreditRequest> {
  const currentUser = await getCurrentUser();
  assertAuthenticated(currentUser);

  const rejectionReason = reason?.trim();
  if (!rejectionReason) {
    throw new FinanceError(
      "VALIDATION_ERROR",
      "Le motif de rejet est obligatoire."
    );
  }

  return db.transaction(async (tx) => {
    const actor = await loadAdminActor(tx, currentUser.id);

    const [request] = await tx
      .select()
      .from(transactionCreditRequests)
      .where(eq(transactionCreditRequests.id, requestId))
      .for("update");

    if (!request) {
      throw new FinanceError(
        "TRANSACTION_NOT_FOUND",
        "Demande de crédit introuvable."
      );
    }
    if (actor.level === "C") {
      throw new FinanceError(
        "FORBIDDEN",
        "Un administrateur de niveau C ne peut pas rejeter une demande."
      );
    }
    if (request.requesterId === actor.id) {
      throw new FinanceError(
        "FORBIDDEN",
        "Utilisez l'annulation pour retirer votre propre demande."
      );
    }
    if (request.status !== "PENDING") {
      throw new FinanceError(
        "INVALID_STATUS",
        `Cette demande n'est plus en attente (statut: ${request.status}).`
      );
    }

    const [updated] = await tx
      .update(transactionCreditRequests)
      .set({
        status: "REJECTED",
        decidedBy: actor.id,
        decidedAt: new Date(),
        rejectionReason,
        updatedAt: new Date(),
      })
      .where(eq(transactionCreditRequests.id, request.id))
      .returning();

    await writeFinancialAuditLog(tx, {
      actorId: actor.id,
      actorLevel: actor.level,
      action: "CREDIT_REQUEST_REJECTED",
      requestId: request.id,
      amount: request.amount,
      reason: rejectionReason,
      metadata: { requesterId: request.requesterId },
    });

    return updated as CreditRequest;
  });
}
