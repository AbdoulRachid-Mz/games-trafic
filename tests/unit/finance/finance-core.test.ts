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
import {
  canApproveCreditRequest,
  canIssueDirectly,
  canRefund,
  requiresSecondApproval,
} from "@/lib/finance/policies/admin-policy";
import {
  DEFAULT_FINANCE_POLICY,
  resolveFinancePolicy,
} from "@/lib/finance/policies/limits";

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

describe("lib/finance/policies - A/B/C (T6-04, T6-07)", () => {
  it("charge la politique par défaut quand aucune valeur n'est stockée", () => {
    expect(resolveFinancePolicy(undefined)).toEqual(DEFAULT_FINANCE_POLICY);
    expect(resolveFinancePolicy({})).toEqual(DEFAULT_FINANCE_POLICY);
  });

  it("fusionne les plafonds stockés sans perdre les défauts", () => {
    const policy = resolveFinancePolicy({
      issuance: { max: { B: 12_345 } },
    });

    expect(policy.issuance.max.B).toBe(12_345);
    expect(policy.issuance.max.A).toBe(DEFAULT_FINANCE_POLICY.issuance.max.A);
    expect(policy.issuance.daily).toEqual(
      DEFAULT_FINANCE_POLICY.issuance.daily
    );
  });

  it("interdit toute émission directe au niveau C", () => {
    const result = canIssueDirectly(
      "C",
      5_000,
      0,
      DEFAULT_FINANCE_POLICY
    );
    expect(result.allowed).toBe(false);
  });

  it("applique le plafond par opération et le plafond quotidien", () => {
    expect(
      canIssueDirectly("B", 25_000, 0, DEFAULT_FINANCE_POLICY).allowed
    ).toBe(true);
    expect(
      canIssueDirectly("B", 25_001, 0, DEFAULT_FINANCE_POLICY).allowed
    ).toBe(false);
    expect(
      canIssueDirectly("B", 10_000, 95_000, DEFAULT_FINANCE_POLICY).allowed
    ).toBe(false);
  });

  it("interdit l'auto-approbation et l'approbation par un C", () => {
    const base = {
      requesterId: "requester",
      requesterLevel: "B" as const,
      amount: 10_000,
      policy: DEFAULT_FINANCE_POLICY,
    };

    expect(
      canApproveCreditRequest({
        ...base,
        approverId: "requester",
        approverLevel: "A",
      }).allowed
    ).toBe(false);

    expect(
      canApproveCreditRequest({
        ...base,
        approverId: "admin-c",
        approverLevel: "C",
      }).allowed
    ).toBe(false);
  });

  it("n'autorise B que sur les demandes d'un C sous le seuil", () => {
    const underThreshold = {
      approverId: "admin-b",
      approverLevel: "B" as const,
      requesterId: "requester",
      amount: 10_000,
      policy: DEFAULT_FINANCE_POLICY,
    };

    expect(
      canApproveCreditRequest({
        ...underThreshold,
        requesterLevel: "C",
      }).allowed
    ).toBe(true);
    expect(
      canApproveCreditRequest({
        ...underThreshold,
        requesterLevel: "B",
      }).allowed
    ).toBe(false);
  });

  it("exige deux approbateurs distincts au-dessus du seuil", () => {
    expect(requiresSecondApproval(50_001, DEFAULT_FINANCE_POLICY)).toBe(true);
    expect(requiresSecondApproval(50_000, DEFAULT_FINANCE_POLICY)).toBe(false);

    const base = {
      approverLevel: "A" as const,
      requesterId: "requester",
      requesterLevel: "B" as const,
      amount: 80_000,
      policy: DEFAULT_FINANCE_POLICY,
      firstApproverId: "admin-a",
      firstApproverLevel: "A" as const,
    };

    expect(
      canApproveCreditRequest({ ...base, approverId: "admin-a" }).allowed
    ).toBe(false);
    expect(
      canApproveCreditRequest({
        ...base,
        approverId: "admin-b",
        approverLevel: "B",
      }).allowed
    ).toBe(true);
    expect(
      canApproveCreditRequest({
        ...base,
        approverId: "admin-b2",
        approverLevel: "B",
        firstApproverLevel: "B",
      }).allowed
    ).toBe(false);
  });

  it("interdit le remboursement au niveau C", () => {
    expect(
      canRefund("C", 100, DEFAULT_FINANCE_POLICY).allowed
    ).toBe(false);
    expect(
      canRefund("B", 25_000, DEFAULT_FINANCE_POLICY).allowed
    ).toBe(true);
    expect(
      canRefund("B", 25_001, DEFAULT_FINANCE_POLICY).allowed
    ).toBe(false);
  });
});
