/**
 * lib/finance/core/transaction-engine.ts
 *
 * Moteur financier unique. Toute opération monétaire passe par
 * `executeFinancialOperation`, qui garantit :
 * - une transaction atomique (wallet_transactions + ledger_entries) ;
 * - des écritures équilibrées via `postLedgerEntries` ;
 * - l'idempotence optionnelle ;
 * - des transitions de statut contrôlées.
 */

import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import {
  walletTransactions,
  type LedgerEntry,
  type WalletTransaction,
} from "@/database/schema";
import { eq } from "drizzle-orm";
import { calculateTransactionFees } from "../fees/fee-engine";
import type { TransactionType } from "../types";
import { getOrCreateSystemAccount } from "./accounts";
import { buildIssuancePostings } from "../transactions/issuance";
import {
  beginIdempotency,
  completeIdempotency,
  hashRequestPayload,
  type IdempotencyCheck,
} from "./idempotency";
import {
  getAccountBalanceCents,
  postLedgerEntries,
  type LedgerPosting,
} from "./ledger";
import { FinanceError, toFinanceError } from "./errors";
import {
  assertTransition,
  type FinancialStatus,
} from "./state-machine";
import type { AdminLevel } from "@/lib/auth/permissions";

export { assertTransition };
export type { FinancialStatus };

type DbClient = typeof db | any;

export interface OperationContext {
  /** Clé d'idempotence fournie par l'appelant (facultative). */
  idempotencyKey?: string;
  idempotencyScope?: string;
  description?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
  createdByUserId?: string;
  actorLevel?: AdminLevel;
  status?: FinancialStatus;
  /**
   * Transaction Drizzle existante. Si fournie, le moteur s'exécute dedans
   * au lieu d'ouvrir sa propre transaction (permet de composer une opération
   * métier et une opération financière de façon atomique).
   */
  client?: DbClient;
}

interface OperationBase extends OperationContext {
  /** Wallet journal lié à l'opération (côté payeur ou bénéficiaire). */
  walletId: string;
  /** Compte financier du wallet (pour balanceAfter). */
  walletAccountId: string;
  amount: number;
  type: TransactionType;
  fromUserId?: string | null;
  toUserId?: string | null;
}

export interface TransferOperation extends OperationBase {
  kind: "TRANSFER";
  fromAccountId: string;
  toAccountId: string;
  /** Frais ajoutés au payeur (convention montant + frais). */
  fees?: number;
}

export interface IssuanceOperation extends OperationBase {
  kind: "ISSUANCE";
  toAccountId: string;
  toUserId?: string | null;
}

export interface GenericPostOperation extends OperationBase {
  kind: "POST";
  postings: LedgerPosting[];
  /** Frais effectivement prélevés (information de journal). */
  fees?: number;
  /** Montant net reçu par le bénéficiaire (information de journal). */
  netAmount?: number;
}

export type FinancialOperation =
  | TransferOperation
  | IssuanceOperation
  | GenericPostOperation;

export interface FinancialOperationResult {
  transaction: WalletTransaction;
  entries: LedgerEntry[];
  fees: number;
  totalDebit: number;
  balances: Record<string, number>;
  idempotentReplay: boolean;
}

const toCents = (value: number): number => Math.round(value * 100);
const fromCents = (cents: number): string => (cents / 100).toFixed(2);

function assertPositiveAmount(amount: number): number {
  const cents = toCents(Number(amount));
  if (!Number.isFinite(cents) || cents <= 0) {
    throw new FinanceError(
      "VALIDATION_ERROR",
      "Le montant doit être strictement supérieur à zéro."
    );
  }
  return cents;
}

function buildReference(): string {
  return `GTC-${Date.now()}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

/**
 * Construit les écritures d'une opération et son total débité.
 */
async function buildOperationPostings(
  client: DbClient,
  operation: FinancialOperation
): Promise<{
  postings: LedgerPosting[];
  fees: number;
  netAmount: number;
  totalDebit: number;
}> {
  const amountCents = assertPositiveAmount(operation.amount);
  const amount = amountCents / 100;

  if (operation.kind === "TRANSFER") {
    if (operation.fromAccountId === operation.toAccountId) {
      throw new FinanceError(
        "VALIDATION_ERROR",
        "Les comptes source et destination doivent être distincts."
      );
    }

    const feeCalc = await calculateTransactionFees("TRANSFER", amount);
    const fees = operation.fees !== undefined ? Number(operation.fees) : feeCalc.fees;
    const feesCents = toCents(fees);

    if (feesCents < 0) {
      throw new FinanceError("VALIDATION_ERROR", "Les frais ne peuvent pas être négatifs.");
    }

    const postings: LedgerPosting[] = [
      {
        accountId: operation.fromAccountId,
        debit: fromCents(amountCents + feesCents),
      },
      {
        accountId: operation.toAccountId,
        credit: fromCents(amountCents),
      },
    ];

    if (feesCents > 0) {
      const feeAccount = await getOrCreateSystemAccount(client, "FEES");
      postings.push({
        accountId: feeAccount.id,
        credit: fromCents(feesCents),
      });
    }

    return {
      postings,
      fees: feesCents / 100,
      netAmount: amount,
      totalDebit: (amountCents + feesCents) / 100,
    };
  }

  if (operation.kind === "ISSUANCE") {
    const issuanceAccount = await getOrCreateSystemAccount(client, "GTC_ISSUANCE");

    return {
      postings: buildIssuancePostings({
        issuanceAccountId: issuanceAccount.id,
        recipientAccountId: operation.toAccountId,
        amount: amountCents / 100,
      }).map((posting) => ({
        accountId: posting.accountId,
        debit: posting.debit,
        credit: posting.credit,
        currency: "GTC",
      })) as LedgerPosting[],
      fees: 0,
      netAmount: amount,
      totalDebit: amount,
    };
  }

  if (!operation.postings || operation.postings.length < 2) {
    throw new FinanceError(
      "INVALID_LEDGER_ENTRY",
      "Une opération POST requiert au moins deux écritures."
    );
  }

  const totalDebitCents = operation.postings.reduce(
    (sum, posting) => sum + toCents(Number(posting.debit ?? 0)),
    0
  );

  return {
    postings: operation.postings,
    fees: Number(operation.fees ?? 0),
    netAmount: Number(operation.netAmount ?? amount),
    totalDebit: totalDebitCents / 100,
  };
}

async function executeInTransaction(
  client: DbClient,
  operation: FinancialOperation,
  idempotency?: {
    scope: string;
    key: string;
    requestHash: string;
  }
): Promise<FinancialOperationResult> {
  let replay: IdempotencyCheck | undefined;

  if (idempotency) {
    replay = await beginIdempotency(client, {
      scope: idempotency.scope,
      key: idempotency.key,
      requestHash: idempotency.requestHash,
    });

    if (replay.state === "COMPLETED") {
      const stored = replay.response as {
        transactionId?: string;
        amount?: number;
        fees?: number;
      } | null;

      if (!stored?.transactionId) {
        throw new FinanceError(
          "IDEMPOTENCY_CONFLICT",
          "Réponse d'idempotence incomplète."
        );
      }

      const [transaction] = await client
        .select()
        .from(walletTransactions)
        .where(eq(walletTransactions.id, stored.transactionId))
        .limit(1);

      if (!transaction) {
        throw new FinanceError(
          "TRANSACTION_NOT_FOUND",
          "La transaction liée à la clé d'idempotence est introuvable."
        );
      }

      return {
        transaction: transaction as WalletTransaction,
        entries: [],
        fees: stored.fees ?? 0,
        totalDebit: stored.amount ?? Number(transaction.amount),
        balances: {},
        idempotentReplay: true,
      };
    }

    if (replay.state === "IN_PROGRESS") {
      throw new FinanceError(
        "IDEMPOTENCY_IN_PROGRESS",
        "Une opération identique est déjà en cours."
      );
    }

    if (replay.state === "FAILED") {
      throw new FinanceError(
        "IDEMPOTENCY_CONFLICT",
        "Une opération identique a déjà échoué. Utilisez une nouvelle clé."
      );
    }
  }

  const status = operation.status ?? "COMPLETED";
  const { postings, fees, netAmount, totalDebit } =
    await buildOperationPostings(client, operation);

  const [transaction] = await client
    .insert(walletTransactions)
    .values({
      walletId: operation.walletId,
      financialAccountId: operation.walletAccountId,
      fromUserId: operation.fromUserId ?? null,
      toUserId: operation.toUserId ?? null,
      amount: fromCents(assertPositiveAmount(operation.amount)),
      fees: fees.toFixed(2),
      netAmount: fromCents(toCents(netAmount)),
      balanceAfter: "0",
      type: operation.type,
      status,
      description: operation.description || `Opération ${operation.type}`,
      reference: buildReference(),
      idempotencyKey: idempotency?.key,
      createdByUserId: operation.createdByUserId,
      actorLevel: operation.actorLevel,
      reason: operation.reason,
      completedAt: status === "COMPLETED" ? new Date() : null,
      metadata: {
        ...(operation.metadata ?? {}),
        totalDebit: totalDebit.toFixed(2),
        fees: fees.toFixed(2),
        netAmount: netAmount.toFixed(2),
        operationKind: operation.kind,
      },
      createdAt: new Date(),
    })
    .returning();

  const entries = await postLedgerEntries(client, {
    transactionId: transaction.id,
    entries: postings,
  });

  const walletBalance = await getAccountBalanceCents(
    operation.walletAccountId,
    client
  );

  const [updatedTransaction] = await client
    .update(walletTransactions)
    .set({ balanceAfter: fromCents(walletBalance) })
    .where(eq(walletTransactions.id, transaction.id))
    .returning();

  const balances: Record<string, number> = {};
  for (const posting of postings) {
    if (balances[posting.accountId] === undefined) {
      balances[posting.accountId] =
        (await getAccountBalanceCents(posting.accountId, client)) / 100;
    }
  }

  const result: FinancialOperationResult = {
    transaction: updatedTransaction as WalletTransaction,
    entries,
    fees,
    totalDebit,
    balances,
    idempotentReplay: false,
  };

  if (idempotency) {
    await completeIdempotency(client, idempotency, {
      response: {
        transactionId: result.transaction.id,
        amount: result.totalDebit,
        fees: result.fees,
      },
      transactionId: result.transaction.id,
    });
  }

  return result;
}

/**
 * Exécute une opération financière atomique et idempotente.
 */
export async function executeFinancialOperation(
  operation: FinancialOperation
): Promise<FinancialOperationResult> {
  const idempotency =
    operation.idempotencyKey !== undefined
      ? {
          scope: operation.idempotencyScope || operation.kind,
          key: operation.idempotencyKey,
          requestHash: hashRequestPayload({
            kind: operation.kind,
            type: operation.type,
            amount: operation.amount,
            walletId: operation.walletId,
            walletAccountId: operation.walletAccountId,
            fromAccountId:
              operation.kind === "TRANSFER" ? operation.fromAccountId : undefined,
            toAccountId: operation.kind === "TRANSFER" ? operation.toAccountId : undefined,
            postings: operation.kind === "POST" ? operation.postings : undefined,
            reason: operation.reason,
            metadata: operation.metadata,
          }),
        }
      : undefined;

  try {
    if (operation.client) {
      return await executeInTransaction(
        operation.client,
        operation,
        idempotency
      );
    }

    return await db.transaction((tx) =>
      executeInTransaction(tx, operation, idempotency)
    );
  } catch (error) {
    throw toFinanceError(error);
  }
}
