/**
 * lib/finance/core/postings.ts
 *
 * Validation pure des écritures comptables. Aucun accès base de données :
 * utilisable côté tests et en amont de `postLedgerEntries`.
 */

import { FinanceError } from "./errors";

export interface LedgerPosting {
  accountId: string;
  /** Montant débité, en GTC (>= 0). */
  debit?: number | string;
  /** Montant crédité, en GTC (>= 0). */
  credit?: number | string;
  currency?: string;
}

export interface NormalizedLedgerPosting {
  accountId: string;
  debit: number;
  credit: number;
  currency: string;
}

export const toCents = (value: number | string | null | undefined): number => {
  const parsed = Number(value ?? 0);
  if (!Number.isFinite(parsed)) {
    throw new FinanceError(
      "INVALID_LEDGER_ENTRY",
      `Montant de ledger invalide: ${value}`
    );
  }
  return Math.round(parsed * 100);
};

export const fromCents = (cents: number): string => (cents / 100).toFixed(2);

/**
 * Valide et normalise les écritures.
 */
export function normalizeLedgerPostings(
  entries: LedgerPosting[]
): NormalizedLedgerPosting[] {
  if (!Array.isArray(entries) || entries.length < 2) {
    throw new FinanceError(
      "INVALID_LEDGER_ENTRY",
      "Au moins deux écritures sont nécessaires."
    );
  }

  return entries.map((entry, index) => {
    const debit = toCents(entry.debit);
    const credit = toCents(entry.credit);

    if (debit < 0 || credit < 0) {
      throw new FinanceError(
        "INVALID_LEDGER_ENTRY",
        `Écriture #${index}: montants négatifs interdits.`
      );
    }
    if (debit > 0 && credit > 0) {
      throw new FinanceError(
        "INVALID_LEDGER_ENTRY",
        `Écriture #${index}: débit et crédit simultanés interdits.`
      );
    }
    if (debit === 0 && credit === 0) {
      throw new FinanceError(
        "INVALID_LEDGER_ENTRY",
        `Écriture #${index}: montant nul.`
      );
    }
    if (!entry.accountId) {
      throw new FinanceError(
        "INVALID_LEDGER_ENTRY",
        `Écriture #${index}: accountId manquant.`
      );
    }

    return {
      accountId: entry.accountId,
      debit,
      credit,
      currency: entry.currency || "GTC",
    };
  });
}

/**
 * Vérifie l'équilibre débit/crédit.
 */
export function assertPostingsBalanced(
  normalized: NormalizedLedgerPosting[]
): { debit: number; credit: number } {
  const totalDebit = normalized.reduce((sum, entry) => sum + entry.debit, 0);
  const totalCredit = normalized.reduce((sum, entry) => sum + entry.credit, 0);

  if (totalDebit !== totalCredit) {
    throw new FinanceError(
      "UNBALANCED_LEDGER",
      `Écritures déséquilibrées: débit ${fromCents(totalDebit)} ≠ crédit ${fromCents(totalCredit)}.`
    );
  }

  return { debit: totalDebit, credit: totalCredit };
}
