import { describe, it, expect } from "vitest";
import {
  isAdmin,
  getAdminLevel,
  hasAdminLevel,
  assertAuthenticated,
  assertAdmin,
  assertOwnerOrAdmin,
  assertCanManageFees,
  assertCanDeposit,
  assertCanApproveRequests,
  assertCanRefund,
  assertCanManageOrders,
  type BaseUserContext,
} from "@/lib/auth/permissions";

describe("lib/auth/permissions - Permissions Matrix & Guards (TASK P1-01 / P1-03)", () => {
  const superAdminA: BaseUserContext = { id: "u-admin-a", role: "admin", isAdmin: true, level: "A" };
  const opsAdminB: BaseUserContext = { id: "u-admin-b", role: "admin", isAdmin: true, level: "B" };
  const modAdminC: BaseUserContext = { id: "u-admin-c", role: "admin", isAdmin: true, level: "C" };
  const standardAdmin: BaseUserContext = { id: "u-admin-def", role: "admin", isAdmin: true }; // defaults to C
  const regularUser: BaseUserContext = { id: "u-user", role: "user", isAdmin: false, level: "A" }; // fake level on regular user
  const anonymous = null;

  describe("isAdmin", () => {
    it("should correctly identify admins by role or isAdmin flag", () => {
      expect(isAdmin(superAdminA)).toBe(true);
      expect(isAdmin(opsAdminB)).toBe(true);
      expect(isAdmin(modAdminC)).toBe(true);
      expect(isAdmin(standardAdmin)).toBe(true);
      expect(isAdmin({ id: "1", role: "admin" })).toBe(true);
      expect(isAdmin({ id: "2", isAdmin: true })).toBe(true);
      expect(isAdmin(regularUser)).toBe(false);
      expect(isAdmin(anonymous)).toBe(false);
    });
  });

  describe("getAdminLevel", () => {
    it("should return the correct level for admins, defaulting to C", () => {
      expect(getAdminLevel(superAdminA)).toBe("A");
      expect(getAdminLevel(opsAdminB)).toBe("B");
      expect(getAdminLevel(modAdminC)).toBe("C");
      expect(getAdminLevel(standardAdmin)).toBe("C");
      // Non-admins always return C and cannot spoof level
      expect(getAdminLevel(regularUser)).toBe("C");
      expect(getAdminLevel(anonymous)).toBe("C");
    });
  });

  describe("hasAdminLevel weight comparison", () => {
    it("should correctly enforce level hierarchy A >= B >= C", () => {
      // Super Admin A can do A, B, C
      expect(hasAdminLevel(superAdminA, "A")).toBe(true);
      expect(hasAdminLevel(superAdminA, "B")).toBe(true);
      expect(hasAdminLevel(superAdminA, "C")).toBe(true);

      // Ops Admin B can do B, C, but NOT A
      expect(hasAdminLevel(opsAdminB, "A")).toBe(false);
      expect(hasAdminLevel(opsAdminB, "B")).toBe(true);
      expect(hasAdminLevel(opsAdminB, "C")).toBe(true);

      // Mod Admin C can do C, but NOT B or A
      expect(hasAdminLevel(modAdminC, "A")).toBe(false);
      expect(hasAdminLevel(modAdminC, "B")).toBe(false);
      expect(hasAdminLevel(modAdminC, "C")).toBe(true);

      // Non-admin can do none
      expect(hasAdminLevel(regularUser, "C")).toBe(false);
      expect(hasAdminLevel(anonymous, "C")).toBe(false);
    });
  });

  describe("assertAuthenticated", () => {
    it("should pass for valid user and throw for null/empty user", () => {
      expect(() => assertAuthenticated(superAdminA)).not.toThrow();
      expect(() => assertAuthenticated(regularUser)).not.toThrow();
      expect(() => assertAuthenticated(anonymous)).toThrow("Non authentifié");
      expect(() => assertAuthenticated({ id: "" })).toThrow("Non authentifié");
    });
  });

  describe("assertAdmin", () => {
    it("should throw for non-admins", () => {
      expect(() => assertAdmin(regularUser)).toThrow("Accès réservé aux administrateurs");
      expect(() => assertAdmin(anonymous)).toThrow("Non authentifié");
    });

    it("should enforce required level", () => {
      expect(() => assertAdmin(superAdminA, "A")).not.toThrow();
      expect(() => assertAdmin(opsAdminB, "A")).toThrow("Niveau d'administration A requis");
      expect(() => assertAdmin(opsAdminB, "B")).not.toThrow();
      expect(() => assertAdmin(modAdminC, "B")).toThrow("Niveau d'administration B requis");
      expect(() => assertAdmin(modAdminC, "C")).not.toThrow();
    });
  });

  describe("assertOwnerOrAdmin", () => {
    const ownerId = "u-owner-123";
    const resourceOwner: BaseUserContext = { id: ownerId, role: "user" };
    const otherUser: BaseUserContext = { id: "u-other-456", role: "user" };

    it("should allow the owner", () => {
      expect(() => assertOwnerOrAdmin(resourceOwner, ownerId)).not.toThrow();
    });

    it("should allow an admin with sufficient level", () => {
      expect(() => assertOwnerOrAdmin(superAdminA, ownerId, "A")).not.toThrow();
      expect(() => assertOwnerOrAdmin(opsAdminB, ownerId, "B")).not.toThrow();
      expect(() => assertOwnerOrAdmin(modAdminC, ownerId, "C")).not.toThrow();
    });

    it("should reject another user who is neither owner nor admin", () => {
      expect(() => assertOwnerOrAdmin(otherUser, ownerId)).toThrow("Accès refusé: Vous devez être le propriétaire ou administrateur");
    });

    it("should reject an admin if requiredLevel is higher than admin level", () => {
      expect(() => assertOwnerOrAdmin(modAdminC, ownerId, "B")).toThrow("Accès refusé: Vous devez être le propriétaire ou administrateur");
    });
  });

  describe("Specialized Financial Guards Matrix", () => {
    it("assertCanManageFees - requires Level A", () => {
      expect(() => assertCanManageFees(superAdminA)).not.toThrow();
      expect(() => assertCanManageFees(opsAdminB)).toThrow("Niveau d'administration A requis");
      expect(() => assertCanManageFees(modAdminC)).toThrow("Niveau d'administration A requis");
      expect(() => assertCanManageFees(regularUser)).toThrow("Accès réservé aux administrateurs");
    });

    it("assertCanDeposit - requires Level A", () => {
      expect(() => assertCanDeposit(superAdminA)).not.toThrow();
      expect(() => assertCanDeposit(opsAdminB)).toThrow("Niveau d'administration A requis");
      expect(() => assertCanDeposit(modAdminC)).toThrow("Niveau d'administration A requis");
      expect(() => assertCanDeposit(regularUser)).toThrow("Accès réservé aux administrateurs");
    });

    it("assertCanApproveRequests - requires Level B", () => {
      expect(() => assertCanApproveRequests(superAdminA)).not.toThrow();
      expect(() => assertCanApproveRequests(opsAdminB)).not.toThrow();
      expect(() => assertCanApproveRequests(modAdminC)).toThrow("Niveau d'administration B requis");
      expect(() => assertCanApproveRequests(regularUser)).toThrow("Accès réservé aux administrateurs");
    });

    it("assertCanRefund - requires Level B", () => {
      expect(() => assertCanRefund(superAdminA)).not.toThrow();
      expect(() => assertCanRefund(opsAdminB)).not.toThrow();
      expect(() => assertCanRefund(modAdminC)).toThrow("Niveau d'administration B requis");
      expect(() => assertCanRefund(regularUser)).toThrow("Accès réservé aux administrateurs");
    });

    it("assertCanManageOrders - requires Level B", () => {
      expect(() => assertCanManageOrders(superAdminA)).not.toThrow();
      expect(() => assertCanManageOrders(opsAdminB)).not.toThrow();
      expect(() => assertCanManageOrders(modAdminC)).toThrow("Niveau d'administration B requis");
      expect(() => assertCanManageOrders(regularUser)).toThrow("Accès réservé aux administrateurs");
    });
  });
});
