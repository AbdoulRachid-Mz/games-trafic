/**
 * lib/finance/core/idempotency.ts
 *
 * Anti-doublon des opérations financières.
 * La clé est unique par `(scope, key)` et liée au hash exact de la requête :
 * une même clé avec un payload différent renvoie IDEMPOTENCY_CONFLICT.
 */

import { db } from "@/lib/db";
import { idempotencyKeys } from "@/database/schema";
import { and, eq } from "drizzle-orm";
import { FinanceError } from "./errors";
import { hashRequestPayload, stableStringify } from "./hash";

export { hashRequestPayload, stableStringify };

type DbClient = typeof db | any;

export interface IdempotencyRequest {
  scope: string;
  key: string;
  requestHash: string;
}

export type IdempotencyCheck =
  | { state: "NEW" }
  | { state: "IN_PROGRESS" }
  | { state: "FAILED" }
  | {
      state: "COMPLETED";
      response: unknown;
      transactionId: string | null;
    };

/**
 * Vérifie l'état d'une clé d'idempotence.
 */
export async function checkIdempotency(
  client: DbClient,
  request: IdempotencyRequest
): Promise<IdempotencyCheck> {
  const [row] = await client
    .select()
    .from(idempotencyKeys)
    .where(
      and(
        eq(idempotencyKeys.scope, request.scope),
        eq(idempotencyKeys.key, request.key)
      )
    )
    .limit(1)
    .for("update");

  if (!row) return { state: "NEW" };

  if (row.requestHash !== request.requestHash) {
    throw new FinanceError(
      "IDEMPOTENCY_CONFLICT",
      "Cette clé d'idempotence a déjà été utilisée avec un payload différent.",
      { scope: request.scope, key: request.key }
    );
  }

  switch (row.status) {
    case "COMPLETED":
      return {
        state: "COMPLETED",
        response: row.response,
        transactionId: row.transactionId,
      };
    case "FAILED":
      return { state: "FAILED" };
    case "IN_PROGRESS":
    default:
      return { state: "IN_PROGRESS" };
  }
}

/**
 * Réserve une clé d'idempotence. Retourne l'état observé :
 * - NEW : la clé vient d'être réservée, l'opération peut s'exécuter ;
 * - COMPLETED : rejouer la réponse enregistrée ;
 * - IN_PROGRESS / FAILED : refuser ou laisser l'appelant décider.
 */
export async function beginIdempotency(
  client: DbClient,
  request: IdempotencyRequest
): Promise<IdempotencyCheck> {
  const existing = await checkIdempotency(client, request);
  if (existing.state !== "NEW") return existing;

  // `returning` distingue une réservation obtenue par nous-même (réponse NEW)
  // d'une course perdue (le concurrent a déjà réservé la clé).
  const inserted = await client
    .insert(idempotencyKeys)
    .values({
      scope: request.scope,
      key: request.key,
      requestHash: request.requestHash,
      status: "IN_PROGRESS",
      updatedAt: new Date(),
    })
    .onConflictDoNothing({
      target: [idempotencyKeys.scope, idempotencyKeys.key],
    })
    .returning({ id: idempotencyKeys.id });

  if (inserted.length > 0) {
    return { state: "NEW" };
  }

  // Race perdue : relit pour connaître l'état du détenteur (COMPLETED / IN_PROGRESS / FAILED).
  const refetched = await checkIdempotency(client, request);
  if (refetched.state === "NEW") {
    // Incohérence théorique (row supprimée entre-temps) : traiter comme occupé.
    return { state: "IN_PROGRESS" };
  }
  return refetched;
}

/**
 * Marque l'opération comme terminée et enregistre sa réponse.
 */
export async function completeIdempotency(
  client: DbClient,
  request: IdempotencyRequest,
  result: { response: unknown; transactionId?: string | null }
): Promise<void> {
  await client
    .update(idempotencyKeys)
    .set({
      status: "COMPLETED",
      response: result.response ?? null,
      transactionId: result.transactionId ?? null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(idempotencyKeys.scope, request.scope),
        eq(idempotencyKeys.key, request.key),
        eq(idempotencyKeys.requestHash, request.requestHash)
      )
    );
}

/**
 * Marque l'opération comme échouée (la clé reste réservée pour audit).
 */
export async function failIdempotency(
  client: DbClient,
  request: IdempotencyRequest
): Promise<void> {
  await client
    .update(idempotencyKeys)
    .set({ status: "FAILED", updatedAt: new Date() })
    .where(
      and(
        eq(idempotencyKeys.scope, request.scope),
        eq(idempotencyKeys.key, request.key),
        eq(idempotencyKeys.requestHash, request.requestHash)
      )
    );
}
