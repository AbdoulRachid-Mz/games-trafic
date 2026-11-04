/**
 * lib/finance/core/state-machine.ts
 *
 * Machine à états des transactions financières (pure, sans base).
 */

import { FinanceError } from "./errors";

export type FinancialStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "REFUNDED";

export const ALLOWED_TRANSITIONS: Record<FinancialStatus, FinancialStatus[]> = {
  PENDING: ["PROCESSING", "COMPLETED", "FAILED"],
  PROCESSING: ["COMPLETED", "FAILED"],
  COMPLETED: ["REFUNDED"],
  REFUNDED: [],
  FAILED: [],
};

export function assertTransition(
  from: FinancialStatus,
  to: FinancialStatus
): void {
  if (from === to) return;
  if (!ALLOWED_TRANSITIONS[from]?.includes(to)) {
    throw new FinanceError(
      "INVALID_TRANSITION",
      `Transition de statut interdite: ${from} → ${to}.`
    );
  }
}
