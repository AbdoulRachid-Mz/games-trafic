import { describe, expect, it } from "vitest";
import {
  assertPostingsBalanced,
  normalizeLedgerPostings,
} from "@/lib/finance/core/postings";
import {
  buildWithdrawalReleasePostings,
  buildWithdrawalReservationPostings,
} from "@/lib/finance/transactions/withdrawal";
import {
  buildOrderCapturePostings,
  buildOrderPayoutPostings,
  splitOrderAmount,
} from "@/lib/finance/transactions/purchase";
import { buildTournamentEntryPostings } from "@/lib/finance/transactions/tournament";

const totals = (postings: Parameters<typeof normalizeLedgerPostings>[0]) =>
  assertPostingsBalanced(normalizeLedgerPostings(postings));

describe("T5-04 — réservation et libération de retrait", () => {
  it("réserve montant + frais et équilibre les écritures", () => {
    const postings = buildWithdrawalReservationPostings({
      walletAccountId: "wallet",
      escrowAccountId: "escrow",
      feeAccountId: "fees",
      amount: 100,
      fees: 2.5,
    });

    expect(totals(postings)).toEqual({ debit: 10_250, credit: 10_250 });
    expect(postings).toContainEqual({ accountId: "wallet", debit: 102.5 });
    expect(postings).toContainEqual({ accountId: "escrow", credit: 100 });
    expect(postings).toContainEqual({ accountId: "fees", credit: 2.5 });
  });

  it("libère exactement la réservation (inverse comptable)", () => {
    const plan = {
      walletAccountId: "wallet",
      escrowAccountId: "escrow",
      feeAccountId: "fees",
      amount: 100,
      fees: 2.5,
    };

    const reservation = normalizeLedgerPostings(
      buildWithdrawalReservationPostings(plan)
    );
    const release = normalizeLedgerPostings(
      buildWithdrawalReleasePostings(plan)
    );

    expect(assertPostingsBalanced(release)).toEqual({
      debit: 10_250,
      credit: 10_250,
    });

    const netByAccount = new Map<string, number>();
    for (const entry of [...reservation, ...release]) {
      netByAccount.set(
        entry.accountId,
        (netByAccount.get(entry.accountId) ?? 0) + entry.debit - entry.credit
      );
    }
    expect([...netByAccount.values()]).toEqual([0, 0, 0]);
  });

  it("n'émet pas d'écriture de frais quand les frais sont nuls", () => {
    const postings = buildWithdrawalReservationPostings({
      walletAccountId: "wallet",
      escrowAccountId: "escrow",
      feeAccountId: "fees",
      amount: 50,
      fees: 0,
    });

    expect(postings).toHaveLength(2);
    expect(totals(postings)).toEqual({ debit: 5_000, credit: 5_000 });
  });
});

describe("T4-05 — escrow et commission des commandes", () => {
  it("capture le prix brut dans l'escrow, sans frais", () => {
    const postings = buildOrderCapturePostings({
      buyerAccountId: "buyer",
      escrowAccountId: "escrow",
      amount: 80,
    });

    expect(postings).toEqual([
      { accountId: "buyer", debit: 80 },
      { accountId: "escrow", credit: 80 },
    ]);
    expect(totals(postings)).toEqual({ debit: 8_000, credit: 8_000 });
  });

  it("paie le vendeur net et crédite la commission à PLATFORM_FEES", () => {
    const postings = buildOrderPayoutPostings({
      escrowAccountId: "escrow",
      sellerAccountId: "seller",
      feeAccountId: "fees",
      amount: 100,
      commission: 5,
    });

    expect(totals(postings)).toEqual({ debit: 10_000, credit: 10_000 });
    expect(postings).toContainEqual({ accountId: "seller", credit: 95 });
    expect(postings).toContainEqual({ accountId: "fees", credit: 5 });
  });

  it("ne crée pas d'écriture de frais quand la commission est nulle", () => {
    const postings = buildOrderPayoutPostings({
      escrowAccountId: "escrow",
      sellerAccountId: "seller",
      feeAccountId: null,
      amount: 100,
      commission: 0,
    });

    expect(postings).toHaveLength(2);
    expect(totals(postings)).toEqual({ debit: 10_000, credit: 10_000 });
  });

  it("borne la commission au montant disponible", () => {
    expect(splitOrderAmount(10, 12)).toEqual({
      sellerNet: 0,
      commission: 10,
    });
    expect(splitOrderAmount(10, -1)).toEqual({
      sellerNet: 10,
      commission: 0,
    });
  });

  it("refuse une commission positive sans compte de frais", () => {
    expect(() =>
      buildOrderPayoutPostings({
        escrowAccountId: "escrow",
        sellerAccountId: "seller",
        feeAccountId: null,
        amount: 100,
        commission: 5,
      })
    ).toThrow(/FEE_ACCOUNT_REQUIRED/);
  });
});

describe("T4-02 — inscription tournoi", () => {
  it("débite entryFee + frais, crédite le pool et les frais", () => {
    const postings = buildTournamentEntryPostings({
      participantAccountId: "player",
      poolAccountId: "pool",
      feeAccountId: "fees",
      entryFee: 100,
      fees: 2.5,
    });

    expect(totals(postings)).toEqual({ debit: 10_250, credit: 10_250 });
    expect(postings).toContainEqual({ accountId: "player", debit: 102.5 });
    expect(postings).toContainEqual({ accountId: "pool", credit: 100 });
    expect(postings).toContainEqual({ accountId: "fees", credit: 2.5 });
  });

  it("refuse des frais positifs sans compte de frais", () => {
    expect(() =>
      buildTournamentEntryPostings({
        participantAccountId: "player",
        poolAccountId: "pool",
        feeAccountId: null,
        entryFee: 100,
        fees: 2.5,
      })
    ).toThrow(/FEE_ACCOUNT_REQUIRED/);
  });
});
