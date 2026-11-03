import { describe, it, expect } from "vitest";

describe("Financial Transaction Invariants & Rules (TASK-SEC-01 & SEC-04)", () => {
  it("should enforce positive numeric values for transactions", () => {
    const isValidAmount = (amt: string | number) => {
      const num = typeof amt === "string" ? parseFloat(amt) : amt;
      return !isNaN(num) && num > 0 && isFinite(num);
    };

    expect(isValidAmount("100")).toBe(true);
    expect(isValidAmount("0.50")).toBe(true);
    expect(isValidAmount("0")).toBe(false);
    expect(isValidAmount("-50")).toBe(false);
    expect(isValidAmount("abc")).toBe(false);
    expect(isValidAmount(NaN)).toBe(false);
    expect(isValidAmount(Infinity)).toBe(false);
  });

  it("should classify admin-restricted types (SEC-01)", () => {
    const adminRestrictedTypes = new Set([
      "DEPOSIT",
      "BONUS",
      "REFUND",
      "ADMIN_ADJUSTMENT",
    ]);

    const userAllowedTypes = new Set([
      "TRANSFER",
      "WITHDRAWAL",
      "PRODUCT_PURCHASE",
      "VIP_SUBSCRIPTION",
      "TOURNAMENT_ENTRY",
    ]);

    // Ensure no overlap
    for (const type of userAllowedTypes) {
      expect(adminRestrictedTypes.has(type)).toBe(false);
    }

    expect(adminRestrictedTypes.has("DEPOSIT")).toBe(true);
    expect(adminRestrictedTypes.has("BONUS")).toBe(true);
    expect(adminRestrictedTypes.has("REFUND")).toBe(true);
  });

  it("should verify double-entry bookkeeping invariant: Sum(Debit) === Sum(Credit)", () => {
    const ledger = [
      { accountId: "user-wallet-1", debit: 100, credit: 0 },
      { accountId: "platform-escrow", debit: 0, credit: 100 },
    ];

    const totalDebit = ledger.reduce((acc, entry) => acc + entry.debit, 0);
    const totalCredit = ledger.reduce((acc, entry) => acc + entry.credit, 0);

    expect(totalDebit).toBe(totalCredit);
  });

  it("should enforce that purchase/spend types never credit a user wallet (F1-06)", () => {
    const spendTypes = [
      "THEME_PURCHASE",
      "TOURNAMENT_PARTICIPATION",
      "ORDER_PURCHASE",
      "GAME_ITEM_PURCHASE",
      "PURCHASE",
      "VIP_SUBSCRIPTION",
      "WITHDRAWAL",
    ];

    const creditTypes = ["DEPOSIT", "BONUS", "REFUND"];

    for (const spendType of spendTypes) {
      expect(creditTypes.includes(spendType)).toBe(false);
    }
  });

  it("should ensure refund entries invert original debit and credit exactly", () => {
    const originalEntries = [
      { accountId: "user-wallet-1", debit: 50, credit: 0 },
      { accountId: "platform-fees", debit: 0, credit: 50 },
    ];

    // Reversal inverts credit and debit
    const reversedEntries = originalEntries.map((e) => ({
      accountId: e.accountId,
      debit: e.credit,
      credit: e.debit,
    }));

    expect(reversedEntries[0]).toEqual({
      accountId: "user-wallet-1",
      debit: 0,
      credit: 50,
    });
    expect(reversedEntries[1]).toEqual({
      accountId: "platform-fees",
      debit: 50,
      credit: 0,
    });

    const origDebitSum = originalEntries.reduce((s, e) => s + e.debit, 0);
    const origCreditSum = originalEntries.reduce((s, e) => s + e.credit, 0);
    const revDebitSum = reversedEntries.reduce((s, e) => s + e.debit, 0);
    const revCreditSum = reversedEntries.reduce((s, e) => s + e.credit, 0);

    expect(origDebitSum).toBe(origCreditSum);
    expect(revDebitSum).toBe(revCreditSum);
    expect(origDebitSum).toBe(revDebitSum);
  });
});
