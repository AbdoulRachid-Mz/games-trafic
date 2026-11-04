/**
 * lib/finance/core/ledger.ts
 *
 * Socle unique d'écriture du Grand Livre (double-entry bookkeeping).
 * Toute opération financière doit passer par `postLedgerEntries`.
 */

import { db } from "@/lib/db";
import {
  financialAccounts,
  ledgerEntries,
  type FinancialAccount,
  type LedgerEntry,
} from "@/database/schema";
import { eq, sql } from "drizzle-orm";
import { FinanceError } from "./errors";
import {
  assertPostingsBalanced,
  fromCents,
  normalizeLedgerPostings,
  toCents,
  type LedgerPosting,
  type NormalizedLedgerPosting,
} from "./postings";

export {
  assertPostingsBalanced,
  fromCents,
  normalizeLedgerPostings,
  toCents,
  type LedgerPosting,
  type NormalizedLedgerPosting,
};

export interface PostLedgerParams {
  transactionId: string;
  entries: LedgerPosting[];
  /** Comptes autorisés à devenir négatifs malgré leur flag (usage exceptionnel). */
  allowNegativeAccountIds?: string[];
}

type DbClient = typeof db | any;

/**
 * Calcule le solde réel d'un compte depuis le ledger (en centimes).
 */
export async function getAccountBalanceCents(
  accountId: string,
  client: DbClient = db
): Promise<number> {
  const [row] = await client
    .select({
      balance: sql<string>`COALESCE(SUM(${ledgerEntries.credit}) - SUM(${ledgerEntries.debit}), 0)`,
    })
    .from(ledgerEntries)
    .where(eq(ledgerEntries.accountId, accountId));

  return toCents(row?.balance ?? 0);
}

/**
 * Verrouille plusieurs comptes dans un ordre déterministe (anti-deadlock).
 */
export async function lockAccounts(
  client: DbClient,
  accountIds: string[]
): Promise<Map<string, FinancialAccount>> {
  const uniqueSorted = [...new Set(accountIds)].sort();

  if (uniqueSorted.length === 0) {
    throw new FinanceError("ACCOUNT_NOT_FOUND", "Aucun compte à verrouiller.");
  }

  const accounts = new Map<string, FinancialAccount>();

  // Verrouillage un par un dans l'ordre trié pour garantir un ordre déterministe
  // et éviter les interblocages entre transactions concurrentes.
  for (const accountId of uniqueSorted) {
    const [row] = await client
      .select()
      .from(financialAccounts)
      .where(eq(financialAccounts.id, accountId))
      .for("update");

    if (!row) {
      throw new FinanceError(
        "ACCOUNT_NOT_FOUND",
        `Compte financier introuvable: ${accountId}`
      );
    }

    accounts.set(accountId, row as FinancialAccount);
  }

  return accounts;
}

/**
 * Écrit un ensemble d'écritures équilibrées pour une transaction.
 *
 * Règles :
 * - au moins deux écritures ;
 * - chaque écriture porte soit un débit, soit un crédit (jamais les deux) ;
 * - somme(débits) === somme(crédits) ;
 * - comptes existants, actifs et non verrouillés ;
 * - solde négatif interdit sauf `allowNegativeBalance` ou override explicite.
 */
export async function postLedgerEntries(
  client: DbClient,
  params: PostLedgerParams
): Promise<LedgerEntry[]> {
  const { transactionId, entries, allowNegativeAccountIds = [] } = params;

  if (!transactionId) {
    throw new FinanceError(
      "INVALID_LEDGER_ENTRY",
      "transactionId est obligatoire."
    );
  }

  const normalized = normalizeLedgerPostings(entries);
  assertPostingsBalanced(normalized);

  const accounts = await lockAccounts(
    client,
    normalized.map((entry) => entry.accountId)
  );

  const allowOverride = new Set(allowNegativeAccountIds);

  // Agrège les mouvements par compte pour un contrôle de solde fiable.
  const movements = new Map<string, number>();
  for (const entry of normalized) {
    movements.set(
      entry.accountId,
      (movements.get(entry.accountId) ?? 0) + entry.credit - entry.debit
    );
  }

  for (const [accountId, delta] of movements.entries()) {
    const account = accounts.get(accountId)!;

    if (!account.isActive) {
      throw new FinanceError(
        "ACCOUNT_INACTIVE",
        `Compte financier inactif: ${accountId}`
      );
    }
    if (account.isLocked) {
      throw new FinanceError(
        "ACCOUNT_LOCKED",
        `Compte financier verrouillé: ${accountId}`
      );
    }

    if (delta >= 0) continue;

    const currentBalance = await getAccountBalanceCents(accountId, client);
    const nextBalance = currentBalance + delta;
    const mayGoNegative =
      account.allowNegativeBalance === true || allowOverride.has(accountId);

    if (nextBalance < 0 && !mayGoNegative) {
      throw new FinanceError(
        "INSUFFICIENT_BALANCE",
        `Solde insuffisant sur ${accountId}: disponible ${fromCents(currentBalance)} GTC, requis ${fromCents(Math.abs(delta))} GTC.`
      );
    }
  }

  const inserted: LedgerEntry[] = [];
  for (const entry of normalized) {
    const [row] = await client
      .insert(ledgerEntries)
      .values({
        transactionId,
        accountId: entry.accountId,
        debit: fromCents(entry.debit),
        credit: fromCents(entry.credit),
        currency: entry.currency,
        createdAt: new Date(),
      })
      .returning();

    inserted.push(row as LedgerEntry);
  }

  return inserted;
}

/**
 * Vérifie que le ledger d'une transaction est équilibré.
 */
export async function assertTransactionBalanced(
  transactionId: string,
  client: DbClient = db
): Promise<{ debit: number; credit: number }> {
  const [row] = await client
    .select({
      debit: sql<string>`COALESCE(SUM(${ledgerEntries.debit}), 0)`,
      credit: sql<string>`COALESCE(SUM(${ledgerEntries.credit}), 0)`,
    })
    .from(ledgerEntries)
    .where(eq(ledgerEntries.transactionId, transactionId));

  const debit = toCents(row?.debit);
  const credit = toCents(row?.credit);

  if (debit !== credit) {
    throw new FinanceError(
      "UNBALANCED_LEDGER",
      `Transaction ${transactionId} déséquilibrée: ${fromCents(debit)} ≠ ${fromCents(credit)}.`
    );
  }

  return { debit, credit };
}
