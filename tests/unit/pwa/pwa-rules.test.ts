import { describe, it, expect } from "vitest";

describe("PWA Caching & Financial Exclusions (TASK-PWA-01 & TASK-PWA-02)", () => {
  // Regex rules mirrors from sw.js
  const NEVER_CACHE_PATTERNS = [
    /\/api\//,
    /auth\//,
    /sign-in/,
    /sign-up/,
    /\/wallet(\/|\?|$)/i,
    /\/wallets(\/|\?|$)/i,
    /\/transactions(\/|\?|$)/i,
    /\/checkout(\/|\?|$)/i,
    /\/payments(\/|\?|$)/i,
    /\/shops\/[^\/]+\/dashboard\/wallet/i,
    /\/tournaments\/[^\/]+\/editions\/[^\/]+\/dashboard\/payments/i,
    /\/admin\/transactions/i,
    /\/admin\/wallets/i,
    /socket/,
    /ws:/,
    /wss:/,
    /analytics/,
    /gtag/,
    /_next\/webpack/,
    /_next\/static\/hmr/,
    /sw\.js$/,
  ];

  const CACHE_PATTERNS = [
    /\/_next\/static\//,
    /\.(?:js|css|woff|woff2|ttf|png|jpg|jpeg|svg|ico|webp)$/i,
    /\/images\//,
    /\/fonts\//,
    /\/icons\//,
  ];

  it("should NEVER intercept or cache financial routes (SEC-01)", () => {
    const sensitiveUrls = [
      "https://games-trafics.com/wallet",
      "https://games-trafics.com/wallet/transactions",
      "https://games-trafics.com/wallet?tab=deposit",
      "https://games-trafics.com/wallets",
      "https://games-trafics.com/transactions",
      "https://games-trafics.com/checkout",
      "https://games-trafics.com/payments",
      "https://games-trafics.com/shops/shop-123/dashboard/wallet",
      "https://games-trafics.com/tournaments/t-1/editions/ed-2/dashboard/payments",
      "https://games-trafics.com/admin/transactions",
      "https://games-trafics.com/admin/wallets",
      "https://games-trafics.com/api/wallet/balance",
      "https://games-trafics.com/api/transactions/process",
    ];

    for (const url of sensitiveUrls) {
      const isExcluded = NEVER_CACHE_PATTERNS.some((pattern) => pattern.test(url));
      expect(isExcluded, `URL ${url} must be excluded from SW cache`).toBe(true);
    }
  });

  it("should allow caching for immutable static assets", () => {
    const staticUrls = [
      "https://games-trafics.com/_next/static/chunks/app/layout.js",
      "https://games-trafics.com/_next/static/css/styles.css",
      "https://games-trafics.com/images/hero.webp",
      "https://games-trafics.com/fonts/montserrat.woff2",
      "https://games-trafics.com/icons/icon-192.png",
    ];

    for (const url of staticUrls) {
      const isNeverCached = NEVER_CACHE_PATTERNS.some((pattern) => pattern.test(url));
      const isCacheable = CACHE_PATTERNS.some((pattern) => pattern.test(url));

      expect(isNeverCached, `Static asset ${url} must not be in NEVER_CACHE`).toBe(false);
      expect(isCacheable, `Static asset ${url} should match CACHE_PATTERNS`).toBe(true);
    }
  });

  it("should bypass Next.js Server Actions", () => {
    const mockHeadersWithNextAction = new Headers({
      "Next-Action": "c5f8842...action-id",
    });
    const mockHeadersWithXAction = new Headers({
      "x-action": "submit-form",
    });
    const standardHeaders = new Headers({
      Accept: "text/html",
    });

    const isServerAction = (headers: Headers) =>
      Boolean(headers.get("Next-Action") || headers.get("x-action"));

    expect(isServerAction(mockHeadersWithNextAction)).toBe(true);
    expect(isServerAction(mockHeadersWithXAction)).toBe(true);
    expect(isServerAction(standardHeaders)).toBe(false);
  });
});
