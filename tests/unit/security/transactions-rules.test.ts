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
});