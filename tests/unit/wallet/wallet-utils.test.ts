import { describe, it, expect } from "vitest";
import { WalletUtils } from "@/lib/wallet/wallet-utils";

describe("lib/wallet/wallet-utils - PIN Strength & Utilities (TASK-SEC-10)", () => {
  describe("validatePinStrength", () => {
    it("should reject PIN with less than 4 digits", () => {
      const result = WalletUtils.validatePinStrength("123");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Le PIN doit contenir au moins 4 chiffres");
    });

    it("should reject non-digit characters", () => {
      const result = WalletUtils.validatePinStrength("12a4");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Le PIN ne doit contenir que des chiffres");
    });

    it("should reject repeated digits like 0000 or 1111", () => {
      const result = WalletUtils.validatePinStrength("0000");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Veuillez éviter les séquences trop simples");
    });

    it("should reject sequential digits like 1234 or 4321", () => {
      const result = WalletUtils.validatePinStrength("1234");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Veuillez éviter les séquences trop simples");
    });

    it("should reject birth years like 1995", () => {
      const result = WalletUtils.validatePinStrength("1995");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Évitez d'utiliser une année de naissance");
    });

    it("should accept a strong random 6-digit PIN", () => {
      const result = WalletUtils.validatePinStrength("941837");
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.strength).toBe("strong");
    });
  });

  describe("formatBalance", () => {
    it("should format standard balance with currency suffix", () => {
      const formatted = WalletUtils.formatBalance(1500, "GTC");
      expect(formatted).toContain("GTC");
      expect(formatted).toMatch(/1[\s\u202F,]?500/);
    });

    it("should format string numbers", () => {
      const formatted = WalletUtils.formatBalance("25000.50", "GTC");
      expect(formatted).toContain("GTC");
    });
  });

  describe("generateSecureCardNumber", () => {
    it("should generate a 16-digit card number", () => {
      const card = WalletUtils.generateSecureCardNumber();
      expect(card).toMatch(/^\d{16}$/);
    });
  });

  describe("generateSHA256", () => {
    it("should compute accurate sha256 hash", () => {
      const hash = WalletUtils.generateSHA256("test-input");
      expect(hash).toHaveLength(64);
      expect(hash).toBe("ae1608896372720b6ebb58261e0c0092c608324b0804bc99267c1753990faaa8");
    });
  });
});