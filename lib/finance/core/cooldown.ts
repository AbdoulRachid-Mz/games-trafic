/**
 * lib/finance/core/cooldown.ts
 *
 * Uniform 120s server-side, DB/clock-concurrency-safe cooldown for
 * user-initiated financial operations.
 *
 * - Enforced against users.lastFinancialActionAt under a row lock (FOR UPDATE)
 *   in the same DB transaction as the operation.
 * - Uses DB clock (now()) to avoid app-clock skew.
 * - Strict idempotent retries of the SAME operation (same scope+key+payload
 *   hash, already COMPLETED or IN_PROGRESS reservation held for this request)
 *   are exempt from cooldown and do not advance the cooldown timestamp.
 * - A new financial intent always consumes/advances the cooldown window.
 */

import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/database/schema";
import { FinanceError } from "./errors";
import { checkIdempotency, hashRequestPayload } from "./idempotency";

type DbClient = typeof db | any;

export const FINANCIAL_COOLDOWN_SECONDS = 120;
export const FINANCIAL_COOLDOWN_MS = FINANCIAL_COOLDOWN_SECONDS * 1000;

export interface FinancialCooldownInput {
  userId: string;
  /**
   * Deterministic idempotency identity of the operation being attempted.
   * When provided and the operation is a strict idempotent replay (same
   * scope+key+hash, state COMPLETED/IN_PROGRESS for this request), cooldown
   * is exempted.
   */
  idempotency?: {
    scope: string;
    key: string;
    payload?: unknown;
    requestHash?: string;
  };
  /**
   * If true, record cooldown advancement (lastFinancialActionAt = now()).
   * Defaults to true. Set false only when you need to check without consuming.
   */
  consume?: boolean;
}

export interface FinancialCooldownResult {
  enforced: boolean;
  exemptedIdempotentReplay: boolean;
  remainingSeconds: number;
}

function asClient(client?: DbClient): DbClient {
  return client ?? db;
}

async function isExemptIdempotentReplay(
  client: DbClient,
  idempotency: NonNullable<FinancialCooldownInput["idempotency"]>
): Promise<boolean> {
  const requestHash =
    idempotency.requestHash ?? hashRequestPayload(idempotency.payload);
  try {
    const state = await checkIdempotency(client, {
      scope: idempotency.scope,
      key: idempotency.key,
      requestHash,
    });
    // COMPLETED => strict replay, engine will return stored result.
    // IN_PROGRESS with identical hash means the same request is already
    // reserved/executing; re-entering it must not be blocked by cooldown.
    return state.state === "COMPLETED" || state.state === "IN_PROGRESS";
  } catch (error) {
    // Payload mismatch on same key is a real conflict; not an exempt replay.
    if (error instanceof FinanceError && error.code === "IDEMPOTENCY_CONFLICT") {
      return false;
    }
    // On unexpected errors, fail closed (do not exempt).
    return false;
  }
}

/**
 * Assert and (by default) consume the per-user financial cooldown.
 * Must run inside the transaction that performs the financial operation so the
 * user-row lock serializes concurrent attempts.
 */
export async function assertFinancialCooldown(
  client: DbClient,
  input: FinancialCooldownInput
): Promise<FinancialCooldownResult> {
  const tx = asClient(client);
  const consume = input.consume !== false;

  if (input.idempotency) {
    const exempt = await isExemptIdempotentReplay(tx, input.idempotency);
    if (exempt) {
      return { enforced: false, exemptedIdempotentReplay: true, remainingSeconds: 0 };
    }
  }

  // Lock user row for concurrency-safe cooldown check/update (DB clock).
  const rows = await tx
    .select({
      id: users.id,
      lastFinancialActionAt: users.lastFinancialActionAt,
      now: sql<Date>`now()`,
      remainingSeconds: sql<number>`
        GREATEST(
          0,
          CEIL(
            EXTRACT(EPOCH FROM (
              (${users.lastFinancialActionAt} + make_interval(secs => ${FINANCIAL_COOLDOWN_SECONDS})) - now()
            ))
          )::int
        )
      `,
    })
    .from(users)
    .where(eq(users.id, input.userId))
    .limit(1)
    .for("update");

  const row = rows[0];
  if (!row) {
    throw new FinanceError("VALIDATION_ERROR", "Utilisateur introuvable pour le cooldown financier.");
  }

  const remainingSeconds = Number(row.remainingSeconds ?? 0);
  const inCooldown =
    row.lastFinancialActionAt != null &&
    remainingSeconds > 0;

  if (inCooldown) {
    throw new FinanceError(
      "COOLDOWN_ACTIVE",
      `Veuillez patienter ${remainingSeconds}s avant une nouvelle opération financière.`,
      { remainingSeconds, cooldownSeconds: FINANCIAL_COOLDOWN_SECONDS }
    );
  }

  if (consume) {
    await tx
      .update(users)
      .set({ lastFinancialActionAt: sql`now()` })
      .where(eq(users.id, input.userId));
  }

  return { enforced: true, exemptedIdempotentReplay: false, remainingSeconds: 0 };
}

/**
 * Convenience wrapper that opens a transaction when none is provided.
 */
export async function withFinancialCooldown<T>(
  input: FinancialCooldownInput,
  fn: (tx: DbClient) => Promise<T>,
  client?: DbClient
): Promise<T> {
  if (client) {
    await assertFinancialCooldown(client, input);
    return fn(client);
  }
  return db.transaction(async (tx) => {
    await assertFinancialCooldown(tx, input);
    return fn(tx);
  });
}
