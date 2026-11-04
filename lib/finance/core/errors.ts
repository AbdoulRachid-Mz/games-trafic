/**
 * lib/finance/core/errors.ts
 *
 * Erreurs typées du moteur financier. Les codes sont stables et destinés
 * à être exposés aux Server Actions / à l'UI sans fuite de détail interne.
 */

export type FinanceErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "ACCOUNT_NOT_FOUND"
  | "ACCOUNT_INACTIVE"
  | "ACCOUNT_LOCKED"
  | "NEGATIVE_BALANCE_NOT_ALLOWED"
  | "INSUFFICIENT_BALANCE"
  | "UNBALANCED_LEDGER"
  | "INVALID_LEDGER_ENTRY"
  | "INVALID_TRANSACTION_TYPE"
  | "INVALID_STATUS"
  | "INVALID_TRANSITION"
  | "TRANSACTION_NOT_FOUND"
  | "TRANSACTION_ALREADY_REFUNDED"
  | "REFUND_EXCEEDS_REMAINING"
  | "IDEMPOTENCY_CONFLICT"
  | "IDEMPOTENCY_IN_PROGRESS"
  | "PRICE_CHANGED"
  | "SUPPLY_UNAVAILABLE"
  | "FEE_POLICY_UNAVAILABLE"
  | "INTERNAL_ERROR";

export class FinanceError extends Error {
  readonly code: FinanceErrorCode;
  readonly details?: Record<string, unknown>;

  constructor(
    code: FinanceErrorCode,
    message: string,
    details?: Record<string, unknown>
  ) {
    super(`${code}: ${message}`);
    this.name = "FinanceError";
    this.code = code;
    this.details = details;
  }
}

export function isFinanceError(error: unknown): error is FinanceError {
  return error instanceof FinanceError;
}

/**
 * Convertit une erreur inconnue en FinanceError sans masquer son message.
 */
export function toFinanceError(
  error: unknown,
  fallbackCode: FinanceErrorCode = "INTERNAL_ERROR"
): FinanceError {
  if (isFinanceError(error)) return error;
  if (error instanceof Error) {
    return new FinanceError(fallbackCode, error.message);
  }
  return new FinanceError(fallbackCode, "Erreur financière inconnue");
}
