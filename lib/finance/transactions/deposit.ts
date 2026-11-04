/**
 * lib/finance/transactions/deposit.ts
 *
 * Approbation d'un dépôt externe.
 *
 * Convention (cf. plan §3.2) : la contrepartie est le compte
 * `SYSTEM_EXTERNAL_CLEARING`. Le wallet bénéficiaire est crédité du net
 * (montant - frais), les frais éventuels sont crédités à `PLATFORM_FEES`.
 * Aucun crédit n'a lieu avant l'approbation : cette fonction est l'unique
 * point d'entrée du mouvement ledger d'un dépôt.
 */

import type { AdminLevel } from "@/lib/auth/permissions";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/database/schema";
import { calculateTransactionFees } from "../fees/fee-engine";
import { getOrCreateSystemAccount } from "../core/accounts";
import {
  executeFinancialOperation,
  type FinancialOperationResult,
} from "../core/transaction-engine";
import { toCents, fromCents } from "../core/postings";
import { FinanceError } from "../core/errors";

type DbClient = typeof db | any;

export interface DepositApprovalInput {
  requestId: string;
  /** Bénéficiaire du dépôt. */
  userId: string;
  walletId: string;
  walletAccountId: string;
  amount: number;
  actorId: string;
  actorLevel?: AdminLevel;
  description?: string;
  /** Transaction Drizzle existante (composition atomique). */
  client?: DbClient;
}

/**
 * Exécute le crédit d'un dépôt approuvé.
 * Le montant débité du clearing est le montant nominal ; le net est ce que
 * l'utilisateur reçoit réellement.
 */
export async function executeDepositApproval(
  input: DepositApprovalInput
): Promise<FinancialOperationResult> {
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new FinanceError(
      "VALIDATION_ERROR",
      "Le montant du dépôt doit être strictement positif."
    );
  }

  const client: DbClient = input.client ?? db;

  const run = async (tx: DbClient): Promise<FinancialOperationResult> => {
    const [recipient] = await tx
      .select({ isVip: users.isVip })
      .from(users)
      .where(eq(users.id, input.userId))
      .limit(1);

    const feeCalc = await calculateTransactionFees("DEPOSIT", input.amount, {
      isVip: !!recipient?.isVip,
    });

    const amountCents = toCents(input.amount);
    const feesCents = toCents(feeCalc.fees);
    const netCents = amountCents - feesCents;

    if (netCents <= 0) {
      throw new FinanceError(
        "VALIDATION_ERROR",
        "Les frais de dépôt dépassent le montant déposé."
      );
    }

    const clearing = await getOrCreateSystemAccount(tx, "EXTERNAL_CLEARING");

    const postings = [
      { accountId: clearing.id, debit: fromCents(amountCents) },
      { accountId: input.walletAccountId, credit: fromCents(netCents) },
    ];

    if (feesCents > 0) {
      const feeAccount = await getOrCreateSystemAccount(tx, "FEES");
      postings.push({ accountId: feeAccount.id, credit: fromCents(feesCents) });
    }

    return executeFinancialOperation({
      kind: "POST",
      type: "DEPOSIT",
      status: "COMPLETED",
      amount: input.amount,
      walletId: input.walletId,
      walletAccountId: input.walletAccountId,
      fromUserId: null,
      toUserId: input.userId,
      description:
        input.description || `Dépôt approuvé (demande ${input.requestId})`,
      reason: input.description || "Approbation de dépôt",
      metadata: {
        requestId: input.requestId,
        approvedBy: input.actorId,
        approverLevel: input.actorLevel,
        sourceAccount: "SYSTEM_EXTERNAL_CLEARING",
      },
      postings,
      fees: feesCents / 100,
      netAmount: netCents / 100,
      createdByUserId: input.actorId,
      actorLevel: input.actorLevel,
      idempotencyKey: `deposit-request:${input.requestId}`,
      idempotencyScope: "deposit:approval",
      client: tx,
    });
  };

  return input.client ? run(client) : db.transaction(run);
}
