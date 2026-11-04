/**
 * lib/finance/transactions/transfer.ts
 *
 * Façade métier du transfert wallet → wallet.
 * Convention : le payeur est débité du montant + frais, le bénéficiaire
 * reçoit le montant, les frais vont sur `PLATFORM_FEES`.
 */

import type { AdminLevel } from "@/lib/auth/permissions";
import {
  executeFinancialOperation,
  type FinancialOperationResult,
} from "../core/transaction-engine";

export interface TransferInput {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  walletId: string;
  /** Compte financier du wallet du payeur (pour balanceAfter). */
  walletAccountId: string;
  fromUserId?: string | null;
  toUserId?: string | null;
  description?: string;
  metadata?: Record<string, unknown>;
  idempotencyKey?: string;
  createdByUserId?: string;
  actorLevel?: AdminLevel;
  /** Transaction Drizzle existante (composition atomique). */
  client?: any;
}

export async function executeTransfer(
  input: TransferInput
): Promise<FinancialOperationResult> {
  if (input.fromAccountId === input.toAccountId) {
    throw new Error(
      "VALIDATION_ERROR: Les comptes source et destination doivent être distincts."
    );
  }

  return executeFinancialOperation({
    kind: "TRANSFER",
    type: "TRANSFER",
    status: "COMPLETED",
    fromAccountId: input.fromAccountId,
    toAccountId: input.toAccountId,
    amount: input.amount,
    walletId: input.walletId,
    walletAccountId: input.walletAccountId,
    fromUserId: input.fromUserId ?? null,
    toUserId: input.toUserId ?? null,
    description: input.description,
    metadata: input.metadata,
    idempotencyKey: input.idempotencyKey,
    idempotencyScope: "transfer",
    createdByUserId: input.createdByUserId,
    actorLevel: input.actorLevel,
    client: input.client,
  });
}
