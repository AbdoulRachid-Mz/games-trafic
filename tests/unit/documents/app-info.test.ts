// tests/unit/documents/app-info.test.ts
import { describe, it, expect } from "vitest";
import { GAMES_TRAFICS_BRAND } from "@/lib/documents/app-info";

describe("Games-Trafics brand info", () => {
  it("uses only verified contact info", () => {
    expect(GAMES_TRAFICS_BRAND.email).toBe("support@games-trafics.com");
    expect(GAMES_TRAFICS_BRAND.address).toBe("Tahoua, Niger");
    expect(GAMES_TRAFICS_BRAND.logoPath).toBe("/icons/icon-128.png");
  });

  it("does not expose forbidden invented data", () => {
    const serialized = JSON.stringify(GAMES_TRAFICS_BRAND);
    for (const forbidden of [
      "+225 00 00 00 00 00",
      "Abidjan, Côte d'Ivoire",
      "+227 XX XX XX XX",
      "[EMAIL_ADDRESS]",
      "contact@gamestrafics.com",
      "+221 78 274 40 23",
    ]) {
      expect(serialized).not.toContain(forbidden);
    }
  });
});
