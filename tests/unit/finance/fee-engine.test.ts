import { describe, it, expect } from "vitest";
import {
  calculatePureFee,
  resolveBaseFeePercentage,
} from "@/lib/finance/fees/fee-engine";

describe("lib/finance/fees/fee-engine - Fee Engine Invariants (TASK-FIN-01)", () => {
  describe("calculatePureFee", () => {
    it("should accurately calculate standard transaction fees", () => {
      const result = calculatePureFee(100, 0.05); // 5% on 100 GTC
      expect(result.feePercentage).toBe(0.05);
      expect(result.fees).toBe(5);
      expect(result.netAmount).toBe(95);
      expect(result.totalAmount).toBe(100);
      expect(result.fees + result.netAmount).toBe(result.totalAmount);
    });

    it("should apply 50% discount for VIP users", () => {
      const result = calculatePureFee(100, 0.05, { isVip: true }); // 2.5% on 100 GTC
      expect(result.feePercentage).toBe(0.025);
      expect(result.fees).toBe(2.5);
      expect(result.netAmount).toBe(97.5);
      expect(result.totalAmount).toBe(100);
      expect(result.fees + result.netAmount).toBe(result.totalAmount);
    });

    it("should handle fractional decimals with proper rounding", () => {
      const result = calculatePureFee(33.33, 0.035);
      expect(result.fees).toBe(1.17); // 33.33 * 0.035 = 1.16655 -> 1.17
      expect(result.netAmount).toBe(32.16);
      expect(result.totalAmount).toBe(33.33);
      expect(Math.abs(result.fees + result.netAmount - result.totalAmount)).toBeLessThanOrEqual(0.01);
    });

    it("should return zeros for invalid, zero, or negative amounts", () => {
      expect(calculatePureFee(0, 0.05)).toEqual({
        feePercentage: 0,
        fees: 0,
        netAmount: 0,
        totalAmount: 0,
      });

      expect(calculatePureFee(-50, 0.05)).toEqual({
        feePercentage: 0,
        fees: 0,
        netAmount: 0,
        totalAmount: 0,
      });

      expect(calculatePureFee(NaN, 0.05)).toEqual({
        feePercentage: 0,
        fees: 0,
        netAmount: 0,
        totalAmount: 0,
      });
    });

    it("should guarantee fees + netAmount === totalAmount invariant across randomized scenarios", () => {
      const amounts = [1, 10, 25.5, 99.99, 1500, 10000];
      const percentages = [0, 0.01, 0.025, 0.05, 0.1, 0.2];

      for (const amt of amounts) {
        for (const pct of percentages) {
          const res = calculatePureFee(amt, pct, { isVip: false });
          expect(res.fees + res.netAmount).toBeCloseTo(res.totalAmount, 2);

          const vipRes = calculatePureFee(amt, pct, { isVip: true });
          expect(vipRes.fees + vipRes.netAmount).toBeCloseTo(vipRes.totalAmount, 2);
          expect(vipRes.fees).toBeLessThanOrEqual(res.fees);
        }
      }
    });
  });

  describe("resolveBaseFeePercentage", () => {
    const mockSettings = {
      purchaseFeePercentage: "0.05",
      transactionFeePercentage: "0.03",
      tournamentParticipationFeePercentage: "0.02",
      depositFeePercentage: "0.01",
      withdrawalFeePercentage: "0.04",
      transferFeePercentage: "0.015",
    };

    it("should resolve correct rates for marketplace purchase types", () => {
      expect(resolveBaseFeePercentage("THEME_PURCHASE", mockSettings)).toBe(0.05);
      expect(resolveBaseFeePercentage("PRODUCT_PURCHASE", mockSettings)).toBe(0.05);
      expect(resolveBaseFeePercentage("GAME_ITEM_PURCHASE", mockSettings)).toBe(0.05);
      expect(resolveBaseFeePercentage("ORDER_PURCHASE", mockSettings)).toBe(0.05);
    });

    it("should resolve correct rates for other operations", () => {
      expect(resolveBaseFeePercentage("VIP_SUBSCRIPTION", mockSettings)).toBe(0.03);
      expect(resolveBaseFeePercentage("TOURNAMENT_PARTICIPATION", mockSettings)).toBe(0.02);
      expect(resolveBaseFeePercentage("DEPOSIT", mockSettings)).toBe(0.01);
      expect(resolveBaseFeePercentage("WITHDRAWAL", mockSettings)).toBe(0.04);
      expect(resolveBaseFeePercentage("TRANSFER", mockSettings)).toBe(0.015);
    });

    it("should resolve 0 for refunds and bonuses", () => {
      expect(resolveBaseFeePercentage("BONUS", mockSettings)).toBe(0);
      expect(resolveBaseFeePercentage("REFUND", mockSettings)).toBe(0);
    });

    it("should handle null or empty settings gracefully", () => {
      expect(resolveBaseFeePercentage("PRODUCT_PURCHASE", null)).toBe(0);
      expect(resolveBaseFeePercentage("UNKNOWN_TYPE", {})).toBe(0);
    });
  });
});
