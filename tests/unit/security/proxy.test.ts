import { describe, it, expect } from "vitest";
import { resolveRoute } from "@/lib/routes/resolver";

describe("Proxy Route Protection & Redirection (Étape A)", () => {
  it("should allow unauthenticated access to public routes", () => {
    const resolved = resolveRoute("/", {
      isAuthenticated: false,
      isAdmin: false,
      isVip: false,
      hasWallet: false,
    });
    expect(resolved.hasAccess).toBe(true);
  });

  it("should block unauthenticated access to protected routes like /dashboard", () => {
    const resolved = resolveRoute("/dashboard", {
      isAuthenticated: false,
      isAdmin: false,
      isVip: false,
      hasWallet: false,
    });
    expect(resolved.hasAccess).toBe(false);
    expect(resolved.redirectTo).toBeDefined();
  });

  it("should allow authenticated access to /dashboard", () => {
    const resolved = resolveRoute("/dashboard", {
      isAuthenticated: true,
      isAdmin: false,
      isVip: false,
      hasWallet: true,
    });
    expect(resolved.hasAccess).toBe(true);
  });

  it("should block non-admin users from /admin", () => {
    const resolved = resolveRoute("/admin", {
      isAuthenticated: true,
      isAdmin: false,
      isVip: false,
      hasWallet: true,
    });
    expect(resolved.hasAccess).toBe(false);
  });

  it("should allow admin users into /admin", () => {
    const resolved = resolveRoute("/admin", {
      isAuthenticated: true,
      isAdmin: true,
      isVip: false,
      hasWallet: true,
    });
    expect(resolved.hasAccess).toBe(true);
  });
});