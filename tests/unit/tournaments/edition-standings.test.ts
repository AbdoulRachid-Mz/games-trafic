// tests/unit/tournaments/edition-standings.test.ts
import { describe, it, expect } from "vitest";
import { computeEditionStandings } from "@/lib/tournaments/edition-standings";

describe("computeEditionStandings", () => {
  it("returns empty when there are no participants", () => {
    expect(computeEditionStandings([], [], {})).toEqual([]);
  });

  it("deduplicates participant ids", () => {
    const result = computeEditionStandings(
      ["p1", "p1", "p2"],
      [],
      {},
    );
    expect(result.map((entry) => entry.registrationId)).toEqual(["p1", "p2"]);
    result.forEach((entry, index) => expect(entry.position).toBe(index + 1));
  });

  it("attributes points from edition matches using official engine", () => {
    const result = computeEditionStandings(
      ["p1", "p2"],
      [
        {
          participant1RegistrationId: "p1",
          participant2RegistrationId: "p2",
          score1: 3,
          score2: 1,
          winnerRegistrationId: "p1",
          status: "COMPLETED",
          confirmedByAdmin: true,
        } as any,
      ],
      {},
    );
    const p1 = result.find((entry) => entry.registrationId === "p1")!;
    const p2 = result.find((entry) => entry.registrationId === "p2")!;
    expect(p1.stats.matchesWon).toBe(1);
    expect(p1.stats.points).toBeGreaterThan(0);
    expect(p2.stats.matchesLost).toBe(1);
    expect(p1.position).toBeLessThan(p2.position);
  });

  it("respects tiebreaker override from config", () => {
    const result = computeEditionStandings(
      ["p1", "p2"],
      [
        {
          participant1RegistrationId: "p1",
          participant2RegistrationId: "p2",
          score1: 1,
          score2: 1,
          winnerRegistrationId: null,
          status: "COMPLETED",
          confirmedByAdmin: true,
        } as any,
      ],
      { tiebreakerRules: ["scoreDifference"] },
    );
    expect(result).toHaveLength(2);
    expect(result[0].position).toBe(1);
  });
});
