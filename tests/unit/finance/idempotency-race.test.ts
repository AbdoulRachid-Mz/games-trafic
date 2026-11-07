import { describe, it, expect, vi } from "vitest";

// Évite l'initialisation du Pool DB dans l'environnement de test.
vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("@/database/schema", () => {
  const table = { scope: "scope", key: "key" };
  return { idempotencyKeys: table };
});

import {
  beginIdempotency,
  type IdempotencyRequest,
} from "@/lib/finance/core/idempotency";

const request: IdempotencyRequest = {
  scope: "transfer",
  key: "k-1",
  requestHash: "hash",
};

/** Client factice simulant la chaîne Drizzle. */
function makeClient(opts: {
  existingRow?: Record<string, any> | null;
  insertReturningCount: number;
}) {
  const chain: any = {};
  const selectResult = opts.existingRow ? [opts.existingRow] : [];

  chain.select = vi.fn(() => chain);
  chain.from = vi.fn(() => chain);
  chain.where = vi.fn(() => chain);
  chain.limit = vi.fn(() => chain);
  chain.for = vi.fn(async () => selectResult);
  chain.insert = vi.fn(() => chain);
  chain.values = vi.fn(() => chain);
  chain.onConflictDoNothing = vi.fn(() => chain);
  chain.returning = vi.fn(
    async () => Array.from({ length: opts.insertReturningCount }, () => ({ id: "row" }))
  );

  return chain;
}

describe("lib/finance/core/idempotency - Course de réservation (Phase 9)", () => {
  it("retourne NEW quand l'insert de réservation réussit (course gagnée)", async () => {
    const client = makeClient({ existingRow: null, insertReturningCount: 1 });
    const state = await beginIdempotency(client as any, request);
    expect(state.state).toBe("NEW");
  });

  it("retourne l'état du détenteur quand la course est perdue (aucune ligne insérée)", async () => {
    const client = makeClient({
      existingRow: { requestHash: "hash", status: "IN_PROGRESS" },
      insertReturningCount: 0,
    });
    const state = await beginIdempotency(client as any, request);
    expect(state.state).toBe("IN_PROGRESS");
  });

  it("conflicté sur un hash différent pour la même clé", async () => {
    const client = makeClient({
      existingRow: { requestHash: "other-hash", status: "IN_PROGRESS" },
      insertReturningCount: 0,
    });
    await expect(beginIdempotency(client as any, request)).rejects.toMatchObject({
      code: "IDEMPOTENCY_CONFLICT",
    });
  });

  it("rejoue la réponse COMPLETED avec transactionId", async () => {
    const client = makeClient({
      existingRow: {
        requestHash: "hash",
        status: "COMPLETED",
        response: { transactionId: "tx-1", amount: 10, fees: 0 },
        transactionId: "tx-1",
      },
      insertReturningCount: 0,
    });
    const state = await beginIdempotency(client as any, request);
    expect(state).toMatchObject({ state: "COMPLETED", transactionId: "tx-1" });
  });
});
