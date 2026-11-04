/**
 * lib/finance/transactions/refund-math.ts
 *
 * Calcul pur des écritures inverses d'un remboursement (total ou partiel).
 * Aucun accès base : testable indépendamment du moteur.
 */

import { fromCents, toCents } from "../core/postings";

export interface ReversalEntry {
  accountId: string;
  debit?: string | number | null;
  credit?: string | number | null;
  currency?: string | null;
}

export interface RefundReversalInput {
  originalEntries: ReversalEntry[];
  priorReversalEntries: ReversalEntry[];
  /** Montant total de la transaction d'origine, en GTC. */
  originalAmount: number;
  /** Montant déjà remboursé, en GTC. */
  alreadyRefunded: number;
  /** Montant demandé pour ce remboursement, en GTC. */
  requested: number;
}

interface AccountMovement {
  debit: number;
  credit: number;
  currency: string;
}

/**
 * Calcule les écritures inverses d'un remboursement.
 * Les remboursements partiels sont proportionnels au montant demandé.
 */
export function computeRefundReversal(
  input: RefundReversalInput
): Array<{ accountId: string; debit: string; credit: string; currency: string }> {
  const originalTotal = toCents(input.originalAmount);
  const alreadyRefunded = toCents(input.alreadyRefunded);
  const requested = toCents(input.requested);
  const remaining = originalTotal - alreadyRefunded;

  if (originalTotal <= 0) {
    throw new Error(
      "INVALID_AMOUNT: La transaction d'origine a un montant nul ou négatif."
    );
  }
  if (requested <= 0) {
    throw new Error(
      "INVALID_AMOUNT: Le montant du remboursement doit être positif."
    );
  }
  if (requested > remaining) {
    throw new Error(
      `REFUND_EXCEEDS_REMAINING: Montant demandé ${fromCents(requested)} GTC, reliquat ${fromCents(Math.max(remaining, 0))} GTC.`
    );
  }

  const isFullRefund = requested === remaining;
  const rate = requested / originalTotal;

  const alreadyReversed = new Map<string, AccountMovement>();
  for (const row of input.priorReversalEntries) {
    const current = alreadyReversed.get(row.accountId) ?? {
      debit: 0,
      credit: 0,
      currency: row.currency || "GTC",
    };
    current.debit += toCents(row.debit);
    current.credit += toCents(row.credit);
    current.currency = row.currency || current.currency;
    alreadyReversed.set(row.accountId, current);
  }

  const originalByAccount = new Map<string, AccountMovement>();
  for (const entry of input.originalEntries) {
    const current = originalByAccount.get(entry.accountId) ?? {
      debit: 0,
      credit: 0,
      currency: entry.currency || "GTC",
    };
    current.debit += toCents(entry.debit);
    current.credit += toCents(entry.credit);
    current.currency = entry.currency || current.currency;
    originalByAccount.set(entry.accountId, current);
  }

  const reversalEntries: Array<{
    accountId: string;
    debit: number;
    credit: number;
    currency: string;
  }> = [];

  for (const [accountId, movement] of originalByAccount.entries()) {
    const previous = alreadyReversed.get(accountId) ?? {
      debit: 0,
      credit: 0,
      currency: movement.currency,
    };

    // Le crédit d'origine devient un débit, et inversement.
    const remainingReversalDebit = Math.max(0, movement.credit - previous.debit);
    const remainingReversalCredit = Math.max(0, movement.debit - previous.credit);

    const reversalDebit = isFullRefund
      ? remainingReversalDebit
      : Math.min(remainingReversalDebit, Math.round(movement.credit * rate));
    const reversalCredit = isFullRefund
      ? remainingReversalCredit
      : Math.min(remainingReversalCredit, Math.round(movement.debit * rate));

    if (reversalDebit === 0 && reversalCredit === 0) continue;

    reversalEntries.push({
      accountId,
      debit: reversalDebit,
      credit: reversalCredit,
      currency: movement.currency,
    });
  }

  // Équilibrage de l'arrondi (un remboursement partiel peut dériver d'un centime)
  const totalDebit = reversalEntries.reduce((sum, entry) => sum + entry.debit, 0);
  const totalCredit = reversalEntries.reduce((sum, entry) => sum + entry.credit, 0);
  const drift = totalDebit - totalCredit;

  if (drift !== 0 && reversalEntries.length > 0) {
    const target = [...reversalEntries].sort(
      (a, b) => Math.max(b.debit, b.credit) - Math.max(a.debit, a.credit)
    )[0];
    if (drift > 0) {
      target.credit += drift;
    } else {
      target.debit += Math.abs(drift);
    }
  }

  return reversalEntries.map((entry) => ({
    accountId: entry.accountId,
    debit: fromCents(entry.debit),
    credit: fromCents(entry.credit),
    currency: entry.currency || "GTC",
  }));
}
