/**
 * lib/finance/transactions/issuance.ts
 *
 * Façade métier de l'émission GTC.
 * L'émission débite le compte système `SYSTEM_GTC_ISSUANCE` (solde négatif
 * autorisé) et crédite le compte du bénéficiaire. Aucun wallet admin n'est
 * débité. Les contrôles de plafond A/B/C sont appliqués par la couche
 * `policies/admin-policy.ts` avant d'appeler cette fonction.
 */

import type { AdminLevel } from "@/lib/auth/permissions";
import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { userWallets, walletTransactions } from "@/database/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { assertAuthenticated } from "@/lib/auth/permissions";
import { FinanceError } from "../core/errors";
import {
  executeFinancialOperation,
  type FinancialOperationResult,
} from "../core/transaction-engine";
import {
  canIssueDirectly,
  assertPolicyAllowed,
} from "../policies/admin-policy";
import { loadFinancePolicy } from "../policies/limits";
import { writeFinancialAuditLog } from "../audit/audit-log";
import { loadAdminActor } from "../requests/credit-requests";

export interface IssuancePosting {
  accountId: string;
  debit?: number;
  credit?: number;
}

export interface IssuancePostingPlan {
  issuanceAccountId: string;
  recipientAccountId: string;
  amount: number;
}

const roundMoney = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100;

/**
 * Décomposition comptable d'une émission GTC :
 * - le compte système `SYSTEM_GTC_ISSUANCE` est débité du montant ;
 * - le compte du bénéficiaire est crédité du même montant.
 *
 * Aucun wallet administrateur n'apparaît : la contrepartie est exclusivement
 * le compte d'émission. Fonction pure, testable sans base de données.
 */
export function buildIssuancePostings(
  plan: IssuancePostingPlan
): IssuancePosting[] {
  const amount = roundMoney(plan.amount);
  return [
    { accountId: plan.issuanceAccountId, debit: amount },
    { accountId: plan.recipientAccountId, credit: amount },
  ];
}

export interface IssuanceInput {
  /** Compte financier du bénéficiaire. */
  toAccountId: string;
  toUserId?: string | null;
  amount: number;
  /** Wallet du bénéficiaire (journal). */
  walletId: string;
  walletAccountId: string;
  actorId: string;
  actorLevel?: AdminLevel;
  reason: string;
  metadata?: Record<string, unknown>;
  idempotencyKey?: string;
  /** Transaction Drizzle existante (composition atomique). */
  client?: any;
}

export async function executeIssuance(
  input: IssuanceInput
): Promise<FinancialOperationResult> {
  if (!input.reason?.trim()) {
    throw new Error("VALIDATION_ERROR: Le motif d'émission est obligatoire.");
  }

  return executeFinancialOperation({
    kind: "ISSUANCE",
    type: "BONUS",
    status: "COMPLETED",
    toAccountId: input.toAccountId,
    toUserId: input.toUserId ?? null,
    amount: input.amount,
    walletId: input.walletId,
    walletAccountId: input.walletAccountId,
    fromUserId: null,
    description: `Émission GTC: ${input.reason}`,
    reason: input.reason,
    metadata: {
      ...(input.metadata ?? {}),
      issuance: true,
      issuedBy: input.actorId,
    },
    idempotencyKey: input.idempotencyKey,
    idempotencyScope: "issuance",
    createdByUserId: input.actorId,
    actorLevel: input.actorLevel,
    client: input.client,
  });
}

export interface DirectIssuanceInput {
  recipientWalletId: string;
  amount: number;
  reason: string;
  idempotencyKey?: string;
}

const startOfToday = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

async function getIssuedToday(
  client: any,
  actorId: string
): Promise<number> {
  const [row] = await client
    .select({
      total: sql<string>`COALESCE(SUM(${walletTransactions.amount}), 0)`,
    })
    .from(walletTransactions)
    .where(
      and(
        eq(walletTransactions.createdByUserId, actorId),
        eq(walletTransactions.type, "BONUS"),
        eq(walletTransactions.status, "COMPLETED"),
        gte(walletTransactions.createdAt, startOfToday())
      )
    );

  const parsed = Number(row?.total ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Émission directe par un administrateur A/B, dans la limite de son plafond.
 * Aucun wallet administrateur n'est débité : la contrepartie est
 * `SYSTEM_GTC_ISSUANCE`, autorisé à être négatif.
 */
export async function issueGtcDirect(
  input: DirectIssuanceInput
): Promise<FinancialOperationResult> {
  const currentUser = await getCurrentUser();
  assertAuthenticated(currentUser);

  const reason = input.reason?.trim();
  if (!reason) {
    throw new FinanceError(
      "VALIDATION_ERROR",
      "Le motif d'émission est obligatoire."
    );
  }

  return db.transaction(async (tx) => {
    const actor = await loadAdminActor(tx, currentUser.id);
    const policy = await loadFinancePolicy();
    const issuedToday = await getIssuedToday(tx, actor.id);

    assertPolicyAllowed(
      canIssueDirectly(actor.level, input.amount, issuedToday, policy)
    );

    const [wallet] = await tx
      .select({
        id: userWallets.id,
        userId: userWallets.userId,
        financialAccountId: userWallets.financialAccountId,
        isActive: userWallets.isActive,
        isLocked: userWallets.isLocked,
      })
      .from(userWallets)
      .where(eq(userWallets.id, input.recipientWalletId))
      .for("update");

    if (!wallet) {
      throw new FinanceError("ACCOUNT_NOT_FOUND", "Wallet bénéficiaire introuvable.");
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

    const result = await executeIssuance({
      toAccountId: wallet.financialAccountId,
      toUserId: wallet.userId,
      amount: input.amount,
      walletId: wallet.id,
      walletAccountId: wallet.financialAccountId,
      actorId: actor.id,
      actorLevel: actor.level,
      reason,
      metadata: {
        directIssuance: true,
        issuedTodayBefore: issuedToday,
      },
      idempotencyKey: input.idempotencyKey,
      client: tx,
    });

    await writeFinancialAuditLog(tx, {
      actorId: actor.id,
      actorLevel: actor.level,
      action: "ISSUANCE_DIRECT",
      transactionId: result.transaction.id,
      accountId: wallet.financialAccountId,
      amount: input.amount,
      reason,
      metadata: {
        recipientUserId: wallet.userId,
        issuedTodayBefore: issuedToday,
      },
    });

    return result;
  });
}
