import { describe, it, expect } from "vitest";
import {
  normalizeLedgerPostings,
  assertPostingsBalanced,
} from "@/lib/finance/core/postings";
import { assertTransition } from "@/lib/finance/core/state-machine";
import {
  hashRequestPayload,
  stableStringify,
} from "@/lib/finance/core/hash";
import { computeRefundReversal } from "@/lib/finance/transactions/refund-math";

describe("lib/finance/core/ledger - Postings invariants (T1-05)", () => {
  it("normalise des écritures équilibrées", () => {
    const normalized = normalizeLedgerPostings([
      { accountId: "a", debit: 100 },
      { accountId: "b", credit: 100 },
    ]);

    expect(normalized).toEqual([
      { accountId: "a", debit: 10000, credit: 0, currency: "GTC" },
      { accountId: "b", debit: 0, credit: 10000, currency: "GTC" },
    ]);
    expect(assertPostingsBalanced(normalized)).toEqual({
      debit: 10000,
      credit: 10000,
    });
  });

  it("refuse moins de deux écritures", () => {
    expect(() =>
      normalizeLedgerPostings([{ accountId: "a", debit: 10 }])
    ).toThrow(/INVALID_LEDGER_ENTRY/);
  });

  it("refuse débit et crédit simultanés", () => {
    expect(() =>
      normalizeLedgerPostings([
        { accountId: "a", debit: 10, credit: 10 },
        { accountId: "b", credit: 10 },
      ])
    ).toThrow(/INVALID_LEDGER_ENTRY/);
  });

  it("refuse les montants négatifs, nuls et les comptes manquants", () => {
    expect(() =>
      normalizeLedgerPostings([
        { accountId: "a", debit: -1 },
        { accountId: "b", credit: 1 },
      ])
    ).toThrow(/INVALID_LEDGER_ENTRY/);

    expect(() =>
      normalizeLedgerPostings([
        { accountId: "a", debit: 0 },
        { accountId: "b", credit: 0 },
      ])
    ).toThrow(/INVALID_LEDGER_ENTRY/);

    expect(() =>
      normalizeLedgerPostings([
        { accountId: "", debit: 1 },
        { accountId: "b", credit: 1 },
      ])
    ).toThrow(/INVALID_LEDGER_ENTRY/);
  });

  it("refuse un ledger déséquilibré", () => {
    const normalized = normalizeLedgerPostings([
      { accountId: "a", debit: 100 },
      { accountId: "b", credit: 99.99 },
    ]);
    expect(() => assertPostingsBalanced(normalized)).toThrow(
      /UNBALANCED_LEDGER/
    );
  });
});

describe("lib/finance/core/transaction-engine - State machine (T2-03)", () => {
  it("autorise les transitions valides", () => {
    expect(() => assertTransition("PENDING", "COMPLETED")).not.toThrow();
    expect(() => assertTransition("PENDING", "PROCESSING")).not.toThrow();
    expect(() => assertTransition("PROCESSING", "COMPLETED")).not.toThrow();
    expect(() => assertTransition("COMPLETED", "REFUNDED")).not.toThrow();
    expect(() => assertTransition("COMPLETED", "COMPLETED")).not.toThrow();
  });

  it("interdit les transitions inverses ou terminales", () => {
    expect(() => assertTransition("COMPLETED", "PENDING")).toThrow(
      /INVALID_TRANSITION/
    );
    expect(() => assertTransition("REFUNDED", "COMPLETED")).toThrow(
      /INVALID_TRANSITION/
    );
    expect(() => assertTransition("FAILED", "COMPLETED")).toThrow(
      /INVALID_TRANSITION/
    );
  });
});

describe("lib/finance/core/idempotency - Request hashing (I3-04)", () => {
  it("produit le même hash quel que soit l'ordre des clés", () => {
    const a = { amount: 10, scope: "transfer", nested: { b: 2, a: 1 } };
    const b = { nested: { a: 1, b: 2 }, scope: "transfer", amount: 10 };

    expect(stableStringify(a)).toBe(stableStringify(b));
    expect(hashRequestPayload(a)).toBe(hashRequestPayload(b));
  });

  it("produit un hash différent pour un payload différent", () => {
    expect(hashRequestPayload({ amount: 10 })).not.toBe(
      hashRequestPayload({ amount: 11 })
    );
  });
});

describe("lib/finance/transactions/refund - Reversal computation (T3-05)", () => {
  const originalEntries = [
    { accountId: "payer", debit: "100.00", credit: "0.00" },
    { accountId: "recipient", debit: "0.00", credit: "95.00" },
    { accountId: "fees", debit: "0.00", credit: "5.00" },
  ];

  it("inverse intégralement les écritures d'origine", () => {
    const entries = computeRefundReversal({
      originalEntries,
      priorReversalEntries: [],
      originalAmount: 100,
      alreadyRefunded: 0,
      requested: 100,
    });

    const byAccount = Object.fromEntries(
      entries.map((entry) => [entry.accountId, entry])
    );

    expect(byAccount.payer).toMatchObject({ debit: "0.00", credit: "100.00" });
    expect(byAccount.recipient).toMatchObject({ debit: "95.00", credit: "0.00" });
    expect(byAccount.fees).toMatchObject({ debit: "5.00", credit: "0.00" });

    const debit = entries.reduce((sum, entry) => sum + Number(entry.debit), 0);
    const credit = entries.reduce((sum, entry) => sum + Number(entry.credit), 0);
    expect(debit).toBe(credit);
  });

  it("calcule un remboursement partiel proportionnel et équilibré", () => {
    const entries = computeRefundReversal({
      originalEntries,
      priorReversalEntries: [],
      originalAmount: 100,
      alreadyRefunded: 0,
      requested: 40,
    });

    const byAccount = Object.fromEntries(
      entries.map((entry) => [entry.accountId, entry])
    );

    expect(byAccount.payer).toMatchObject({ debit: "0.00", credit: "40.00" });
    expect(byAccount.recipient).toMatchObject({ debit: "38.00", credit: "0.00" });
    expect(byAccount.fees).toMatchObject({ debit: "2.00", credit: "0.00" });

    const debit = entries.reduce((sum, entry) => sum + Number(entry.debit), 0);
    const credit = entries.reduce((sum, entry) => sum + Number(entry.credit), 0);
    expect(debit).toBe(credit);
  });

  it("solde exactement le reliquat après un remboursement partiel", () => {
    const entries = computeRefundReversal({
      originalEntries,
      priorReversalEntries: [
        { accountId: "recipient", debit: "38.00", credit: "0.00" },
        { accountId: "fees", debit: "2.00", credit: "0.00" },
        { accountId: "payer", debit: "0.00", credit: "40.00" },
      ],
      originalAmount: 100,
      alreadyRefunded: 40,
      requested: 60,
    });

    const byAccount = Object.fromEntries(
      entries.map((entry) => [entry.accountId, entry])
    );

    expect(byAccount.payer).toMatchObject({ credit: "60.00" });
    expect(byAccount.recipient).toMatchObject({ debit: "57.00" });
    expect(byAccount.fees).toMatchObject({ debit: "3.00" });
  });

  it("refuse un remboursement supérieur au reliquat", () => {
    expect(() =>
      computeRefundReversal({
        originalEntries,
        priorReversalEntries: [],
        originalAmount: 100,
        alreadyRefunded: 0,
        requested: 100.01,
      })
    ).toThrow(/REFUND_EXCEEDS_REMAINING/);

    expect(() =>
      computeRefundReversal({
        originalEntries,
        priorReversalEntries: [],
        originalAmount: 100,
        alreadyRefunded: 100,
        requested: 10,
      })
    ).toThrow(/REFUND_EXCEEDS_REMAINING/);
  });
});
