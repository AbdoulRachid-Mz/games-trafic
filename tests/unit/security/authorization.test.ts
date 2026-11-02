import { describe, it, expect } from "vitest";
import {
  getAdminRoutesForLevel,
  checkRouteAccess,
  flatRoutes,
} from "@/config/admin-items";

describe("Access Control & Admin Hierarchy (TASK-SEC-02)", () => {
  describe("getAdminRoutesForLevel", () => {
    it("should return base routes for Level C (Standard Admin)", () => {
      const routesC = getAdminRoutesForLevel("C");
      expect(routesC.length).toBeGreaterThan(0);
    });

    it("should include intermediate routes for Level B (Operations Admin)", () => {
      const routesB = getAdminRoutesForLevel("B");
      const routesC = getAdminRoutesForLevel("C");
      expect(routesB.length).toBeGreaterThan(routesC.length);
    });

    it("should include super admin routes for Level A (Root Admin)", () => {
      const routesA = getAdminRoutesForLevel("A");
      const routesB = getAdminRoutesForLevel("B");
      expect(routesA.length).toBeGreaterThan(routesB.length);
    });
  });

  describe("checkRouteAccess", () => {
    it("should allow Level A to access root administrative paths", () => {
      const access = checkRouteAccess("/admin", "A");
      expect(access.accessible).toBe(true);
    });

    it("should deny Level C access to sensitive Level A routes", () => {
      const accessLogs = checkRouteAccess("/admin/system/logs", "C");
      expect(accessLogs.accessible).toBe(false);

      const accessBackups = checkRouteAccess("/admin/system/backups", "C");
      expect(accessBackups.accessible).toBe(false);
    });

    it("should allow Level B to access financial management paths", () => {
      const accessFinance = checkRouteAccess("/admin/transactions", "B");
      expect(accessFinance.accessible).toBe(true);
    });
  });

  describe("flatRoutes", () => {
    it("should flatten nested route structures accurately", () => {
      const nested = [
        {
          id: "parent",
          label: "Parent",
          path: "/parent",
          icon: () => null,
          minLevel: "C" as const,
          children: [
            {
              id: "child-1",
              label: "Child 1",
              path: "/parent/1",
              icon: () => null,
              minLevel: "C" as const,
            },
          ],
        },
      ];

      const flattened = flatRoutes(nested);
      expect(flattened).toHaveLength(2);
      expect(flattened.map((r) => r.id)).toEqual(["parent", "child-1"]);
    });
  });
});