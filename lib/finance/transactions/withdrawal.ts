/**
 * lib/finance/transactions/withdrawal.ts
 *
 * Cycle de vie financier d'un retrait :
 *
 * 1. `reserveWithdrawal` — à la création de la demande, débite immédiatement
 *    le wallet de `montant + frais`, crédite l'escrow du montant brut et les
 *    frais à `PLATFORM_FEES`. La transaction reste PENDING : c'est la
 *    réservation qui empêche le double spend.
 * 2. `executeWithdrawalApproval` — à l'approbation, l'escrow est vidé vers
 *    `SYSTEM_EXTERNAL_CLEARING` (paiement réel). Aucun wallet n'est touché.
 *    Les retraits historiques non réservés retombent sur un débit direct.
 * 3. `executeWithdrawalRejection` — au rejet, la réservation est annulée :
 *    escrow + frais reviennent au wallet.
 */

import type { AdminLevel } from "@/lib/auth/permissions";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, walletTransactions } from "@/database/schema";
import { calculateTransactionFees } from "../fees/fee-engine";
import { getOrCreateSystemAccount } from "../core/accounts";
import {
  executeFinancialOperation,
  type FinancialOperationResult,
} from "../core/transaction-engine";
import { toCents, fromCents } from "../core/postings";
import { FinanceError } from "../core/errors";

type DbClient = typeof db | any;

export interface WithdrawalReservationInput {
  requestId: string;
  userId: string;
  walletId: string;
  walletAccountId: string;
  amount: number;
  actorId: string;
  actorLevel?: AdminLevel;
  /** Transaction Drizzle existante (composition atomique). */
  client?: DbClient;
}

export interface WithdrawalSettlementInput {
  requestId: string;
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

const assertPositive = (amount: number, label: string): void => {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new FinanceError(
      "VALIDATION_ERROR",
      `Le montant ${label} doit être strictement positif.`
    );
  }
};

async function resolveFees(
  client: DbClient,
  userId: string,
  amount: number
): Promise<{ feesCents: number; netCents: number }> {
  const [user] = await client
    .select({ isVip: users.isVip })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const feeCalc = await calculateTransactionFees("WITHDRAWAL", amount, {
    isVip: !!user?.isVip,
  });

  const feesCents = toCents(feeCalc.fees);
  return { feesCents, netCents: toCents(amount) - feesCents };
}

/**
 * Réserve le montant d'un retrait à la création de la demande.
 * Idempotent sur `withdrawal-reserve:<requestId>`.
 */
export async function reserveWithdrawal(
  input: WithdrawalReservationInput
): Promise<FinancialOperationResult> {
  assertPositive(input.amount, "du retrait");

  const run = async (tx: DbClient): Promise<FinancialOperationResult> => {
    const { feesCents } = await resolveFees(tx, input.userId, input.amount);
    const amountCents = toCents(input.amount);

    const escrow = await getOrCreateSystemAccount(tx, "ESCROW");

    const postings = [
      {
        accountId: input.walletAccountId,
        debit: fromCents(amountCents + feesCents),
      },
      { accountId: escrow.id, credit: fromCents(amountCents) },
    ];

    if (feesCents > 0) {
      const feeAccount = await getOrCreateSystemAccount(tx, "FEES");
      postings.push({ accountId: feeAccount.id, credit: fromCents(feesCents) });
    }

    return executeFinancialOperation({
      kind: "POST",
      type: "WITHDRAWAL",
      // PENDING : les fonds sont bloqués, pas encore payés.
      status: "PENDING",
      amount: input.amount,
      walletId: input.walletId,
      walletAccountId: input.walletAccountId,
      fromUserId: input.userId,
      toUserId: null,
      description: `Réservation de retrait (demande ${input.requestId})`,
      reason: "Réservation de retrait",
      metadata: {
        requestId: input.requestId,
        withdrawalPhase: "RESERVATION",
        reservedBy: input.actorId,
        approverLevel: input.actorLevel,
        reservedFees: fromCents(feesCents),
      },
      postings,
      fees: feesCents / 100,
      netAmount: 0,
      createdByUserId: input.actorId,
      actorLevel: input.actorLevel,
      idempotencyKey: `withdrawal-reserve:${input.requestId}`,
      idempotencyScope: "withdrawal:reservation",
      client: tx,
    });
  };

  return input.client ? run(input.client) : db.transaction(run);
}

async function findReservation(
  client: DbClient,
  requestId: string
) {
  const [reservation] = await client
    .select()
    .from(walletTransactions)
    .where(
      and(
        eq(walletTransactions.type, "WITHDRAWAL"),
        eq(walletTransactions.status, "PENDING"),
        sql`${walletTransactions.metadata}->>'requestId' = ${requestId}`,
        sql`${walletTransactions.metadata}->>'withdrawalPhase' = 'RESERVATION'`
      )
    )
    .limit(1)
    .for("update");

  return reservation ?? null;
}

/**
 * Règle un retrait approuvé.
 *
 * - réservation présente : escrow → clearing externe (le wallet a déjà été
 *   débité à la création) ;
 * - réservation absente (demande historique) : wallet → clearing externe,
 *   frais inclus.
 */
export async function executeWithdrawalApproval(
  input: WithdrawalSettlementInput
): Promise<FinancialOperationResult> {
  assertPositive(input.amount, "du retrait");

  const run = async (tx: DbClient): Promise<FinancialOperationResult> => {
    const reservation = await findReservation(tx, input.requestId);
    const amountCents = toCents(input.amount);

    if (reservation) {
      const reservedAmount = toCents(reservation.amount);
      if (reservedAmount !== amountCents) {
        throw new FinanceError(
          "VALIDATION_ERROR",
          `Le montant réservé (${fromCents(reservedAmount)}) ne correspond pas au montant de la demande (${fromCents(amountCents)}).`
        );
      }

      const reservedFees = toCents(
        (reservation.metadata as Record<string, unknown> | null)
          ?.reservedFees ?? 0
      );

      const escrow = await getOrCreateSystemAccount(tx, "ESCROW");
      const clearing = await getOrCreateSystemAccount(
        tx,
        "EXTERNAL_CLEARING"
      );

      const result = await executeFinancialOperation({
        kind: "POST",
        type: "WITHDRAWAL",
        status: "COMPLETED",
        amount: input.amount,
        walletId: input.walletId,
        walletAccountId: input.walletAccountId,
        fromUserId: input.userId,
        toUserId: null,
        description:
          input.description ||
          `Retrait payé (demande ${input.requestId})`,
        reason: "Paiement de retrait",
        metadata: {
          requestId: input.requestId,
          withdrawalPhase: "SETTLEMENT",
          settledBy: input.actorId,
          approverLevel: input.actorLevel,
          reservationTransactionId: reservation.id,
        },
        postings: [
          { accountId: escrow.id, debit: fromCents(amountCents) },
          { accountId: clearing.id, credit: fromCents(amountCents) },
        ],
        fees: reservedFees / 100,
        netAmount: 0,
        createdByUserId: input.actorId,
        actorLevel: input.actorLevel,
        idempotencyKey: `withdrawal-settle:${input.requestId}`,
        idempotencyScope: "withdrawal:settlement",
        client: tx,
      });

      await tx
        .update(walletTransactions)
        .set({
          status: "COMPLETED",
          completedAt: new Date(),
          metadata: {
            ...((reservation.metadata as Record<string, unknown> | null) ?? {}),
            withdrawalPhase: "RESERVED",
            settlementTransactionId: result.transaction.id,
            settledAt: new Date().toISOString(),
          },
        })
        .where(eq(walletTransactions.id, reservation.id));

      return result;
    }

    // Retrait historique non réservé : débit direct.
    const { feesCents } = await resolveFees(tx, input.userId, input.amount);
    const clearing = await getOrCreateSystemAccount(tx, "EXTERNAL_CLEARING");

    const postings = [
      {
        accountId: input.walletAccountId,
        debit: fromCents(amountCents + feesCents),
      },
      { accountId: clearing.id, credit: fromCents(amountCents) },
    ];

    if (feesCents > 0) {
      const feeAccount = await getOrCreateSystemAccount(tx, "FEES");
      postings.push({ accountId: feeAccount.id, credit: fromCents(feesCents) });
    }

    return executeFinancialOperation({
      kind: "POST",
      type: "WITHDRAWAL",
      status: "COMPLETED",
      amount: input.amount,
      walletId: input.walletId,
      walletAccountId: input.walletAccountId,
      fromUserId: input.userId,
      toUserId: null,
      description:
        input.description || `Retrait payé (demande ${input.requestId})`,
      reason: "Paiement de retrait (non réservé)",
      metadata: {
        requestId: input.requestId,
        withdrawalPhase: "SETTLEMENT_UNRESERVED",
        settledBy: input.actorId,
        approverLevel: input.actorLevel,
      },
      postings,
      fees: feesCents / 100,
      netAmount: 0,
      createdByUserId: input.actorId,
      actorLevel: input.actorLevel,
      idempotencyKey: `withdrawal-settle:${input.requestId}`,
      idempotencyScope: "withdrawal:settlement",
      client: tx,
    });
  };

  return input.client ? run(input.client) : db.transaction(run);
}

/**
 * Annule la réservation d'un retrait rejeté : escrow + frais → wallet.
 * Sans réservation, aucun mouvement (le wallet n'a jamais été débité).
 */
export async function executeWithdrawalRejection(input: {
  requestId: string;
  walletId: string;
  walletAccountId: string;
  actorId: string;
  actorLevel?: AdminLevel;
  reason?: string;
  client?: DbClient;
}): Promise<FinancialOperationResult | null> {
  const run = async (
    tx: DbClient
  ): Promise<FinancialOperationResult | null> => {
    const reservation = await findReservation(tx, input.requestId);
    if (!reservation) return null;

    const amountCents = toCents(reservation.amount);
    const feesCents = toCents(
      (reservation.metadata as Record<string, unknown> | null)
        ?.reservedFees ?? 0
    );

    const escrow = await getOrCreateSystemAccount(tx, "ESCROW");
    const postings = [
      { accountId: escrow.id, debit: fromCents(amountCents) },
      {
        accountId: input.walletAccountId,
        credit: fromCents(amountCents + feesCents),
      },
    ];

    if (feesCents > 0) {
      const feeAccount = await getOrCreateSystemAccount(tx, "FEES");
      postings.push({ accountId: feeAccount.id, debit: fromCents(feesCents) });
    }

    const result = await executeFinancialOperation({
      kind: "POST",
      type: "REFUND",
      status: "COMPLETED",
      amount: reservation.amount,
      walletId: input.walletId,
      walletAccountId: input.walletAccountId,
      fromUserId: null,
      toUserId: reservation.fromUserId,
      description: `Annulation de la réservation de retrait (demande ${input.requestId})`,
      reason: input.reason || "Retrait rejeté",
      metadata: {
        requestId: input.requestId,
        withdrawalReversal: true,
        reservationTransactionId: reservation.id,
        rejectedBy: input.actorId,
        approverLevel: input.actorLevel,
        rejectionReason: input.reason ?? null,
      },
      postings,
      fees: feesCents / 100,
      netAmount: 0,
      createdByUserId: input.actorId,
      actorLevel: input.actorLevel,
      idempotencyKey: `withdrawal-reject:${input.requestId}`,
      idempotencyScope: "withdrawal:rejection",
      client: tx,
    });

    await tx
      .update(walletTransactions)
      .set({
        status: "REFUNDED",
        metadata: {
          ...((reservation.metadata as Record<string, unknown> | null) ?? {}),
          withdrawalPhase: "RELEASED",
          reversalTransactionId: result.transaction.id,
          releasedAt: new Date().toISOString(),
          rejectionReason: input.reason ?? null,
        },
      })
      .where(eq(walletTransactions.id, reservation.id));

    return result;
  };

  return input.client ? run(input.client) : db.transaction(run);
}
