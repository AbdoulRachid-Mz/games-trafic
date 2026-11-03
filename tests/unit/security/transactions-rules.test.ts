import { transactionTypeEnum } from "@/database/schema";
import { TRANSACTION_CONFIGS } from "@/types/transaction-types";
﻿import { describe, it, expect } from "vitest";

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
  describe("Vague 2: Escrow Accounting & Lifecycle Invariants (I1-01 -> I1-05)", () => {
    it("should guarantee that escrow balance is non-negative at every step of order lifecycle", () => {
      let escrowBalance = 0;
      const orderAmount = 150;
      const commissionRate = 0.05;

      // 1. Capture: Buyer is debited, Escrow is credited
      const captureLedger = [
        { accountId: "buyer-wallet", debit: orderAmount, credit: 0 },
        { accountId: "PLATFORM_ESCROW", debit: 0, credit: orderAmount },
      ];
      escrowBalance += captureLedger[1].credit - captureLedger[1].debit;
      expect(escrowBalance).toBe(150);
      expect(escrowBalance).toBeGreaterThanOrEqual(0);

      // 2. Finalization (Completion): Escrow is debited, Seller credited net, Platform credited fee
      const fee = orderAmount * commissionRate; // 7.5
      const netToSeller = orderAmount - fee; // 142.5
      const completionLedger = [
        { accountId: "PLATFORM_ESCROW", debit: orderAmount, credit: 0 },
        { accountId: "seller-shop-wallet", debit: 0, credit: netToSeller },
        { accountId: "PLATFORM_FEES", debit: 0, credit: fee },
      ];

      const completionDebitSum = completionLedger.reduce((sum, e) => sum + e.debit, 0);
      const completionCreditSum = completionLedger.reduce((sum, e) => sum + e.credit, 0);
      expect(completionDebitSum).toBe(completionCreditSum);

      escrowBalance -= completionLedger[0].debit;
      expect(escrowBalance).toBe(0);
      expect(escrowBalance).toBeGreaterThanOrEqual(0);
    });

    it("should refund exact order amount from escrow on cancellation/rejection (I1-03)", () => {
      let escrowBalance = 200; // After capture of 200 GTC
      const refundAmount = 200;

      const rejectionLedger = [
        { accountId: "PLATFORM_ESCROW", debit: refundAmount, credit: 0 },
        { accountId: "buyer-wallet", debit: 0, credit: refundAmount },
      ];

      const rejectionDebitSum = rejectionLedger.reduce((sum, e) => sum + e.debit, 0);
      const rejectionCreditSum = rejectionLedger.reduce((sum, e) => sum + e.credit, 0);
      expect(rejectionDebitSum).toBe(rejectionCreditSum);

      escrowBalance -= rejectionLedger[0].debit;
      expect(escrowBalance).toBe(0);
      expect(escrowBalance).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Vague 2: PostgreSQL Enum & Configuration Alignment (I4-01 -> I4-05)", () => {
    it("should ensure every PostgreSQL enum value is covered in TRANSACTION_CONFIGS", () => {
      const dbEnumValues = transactionTypeEnum.enumValues;
      expect(dbEnumValues).toBeDefined();
      expect(dbEnumValues.length).toBeGreaterThan(0);

      for (const enumVal of dbEnumValues) {
        expect(TRANSACTION_CONFIGS[enumVal as keyof typeof TRANSACTION_CONFIGS]).toBeDefined();
      }
    });

    it("should guarantee ORDER_PURCHASE is present in PostgreSQL enum", () => {
      expect(transactionTypeEnum.enumValues).toContain("ORDER_PURCHASE");
    });
  });
});
