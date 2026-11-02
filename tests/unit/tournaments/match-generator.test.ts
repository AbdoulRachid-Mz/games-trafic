// tests/unit/tournaments/match-generator.test.ts
import { describe, it, expect } from "vitest";
import {
  generateRoundRobinMatches,
  generateGroupMatches,
  generateEliminationMatches,
  checkDuplicateMatch,
} from "@/lib/tournaments/match.generator";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeParticipants(n: number) {
  return Array.from({ length: n }, (_, i) => ({ id: `p${i + 1}`, name: `Player ${i + 1}` }));
}

// ─── generateRoundRobinMatches ────────────────────────────────────────────────

describe("generateRoundRobinMatches", () => {
  it("returns empty array for 0 participants", () => {
    expect(generateRoundRobinMatches([])).toEqual([]);
  });

  it("returns empty array for 1 participant", () => {
    expect(generateRoundRobinMatches(makeParticipants(1))).toEqual([]);
  });

  it("generates correct number of matches for 2 participants (1 match)", () => {
    const matches = generateRoundRobinMatches(makeParticipants(2));
    expect(matches).toHaveLength(1);
    expect(matches[0].round).toBe(1);
  });

  it("generates n*(n-1)/2 matches for even n participants", () => {
    const n = 4;
    const matches = generateRoundRobinMatches(makeParticipants(n));
    expect(matches).toHaveLength((n * (n - 1)) / 2);
  });

  it("generates n*(n-1)/2 matches for odd n participants (BYE handled)", () => {
    const n = 5;
    const matches = generateRoundRobinMatches(makeParticipants(n));
    // With BYE, effectively n+1=6 players → (n+1)*n/2 - n/2 BYE matches excluded
    // = n*(n-1)/2 real matches
    expect(matches).toHaveLength((n * (n - 1)) / 2);
  });

  it("no match contains a BYE participant", () => {
    const matches = generateRoundRobinMatches(makeParticipants(5));
    for (const m of matches) {
      expect(m.participant1.id).not.toBe("BYE");
      expect(m.participant2.id).not.toBe("BYE");
    }
  });

  it("no two matches are duplicates (same pair regardless of order)", () => {
    const matches = generateRoundRobinMatches(makeParticipants(6));
    for (let i = 0; i < matches.length; i++) {
      for (let j = i + 1; j < matches.length; j++) {
        const a = matches[i];
        const b = matches[j];
        const sameOrder =
          a.participant1.id === b.participant1.id &&
          a.participant2.id === b.participant2.id;
        const reverseOrder =
          a.participant1.id === b.participant2.id &&
          a.participant2.id === b.participant1.id;
        expect(sameOrder || reverseOrder).toBe(false);
      }
    }
  });

  it("round numbers are contiguous starting from 1", () => {
    const n = 4;
    const matches = generateRoundRobinMatches(makeParticipants(n));
    const rounds = [...new Set(matches.map((m) => m.round))].sort((a, b) => a - b);
    expect(rounds[0]).toBe(1);
    for (let i = 1; i < rounds.length; i++) {
      expect(rounds[i]).toBe(rounds[i - 1] + 1);
    }
  });
});

// ─── generateGroupMatches ─────────────────────────────────────────────────────

describe("generateGroupMatches", () => {
  it("single returnType produces n*(n-1)/2 matches", () => {
    const n = 4;
    const matches = generateGroupMatches(makeParticipants(n), { returnType: "single" });
    expect(matches).toHaveLength((n * (n - 1)) / 2);
  });

  it("double returnType produces exactly twice the single matches", () => {
    const n = 4;
    const single = generateGroupMatches(makeParticipants(n), { returnType: "single" });
    const double = generateGroupMatches(makeParticipants(n), { returnType: "double" });
    expect(double).toHaveLength(single.length * 2);
  });

  it("double returnType second leg has reversed participants vs first leg", () => {
    const n = 3;
    const double = generateGroupMatches(makeParticipants(n), { returnType: "double" });
    const half = double.length / 2;
    for (let i = 0; i < half; i++) {
      const leg1 = double[i];
      const leg2 = double[i + half];
      expect(leg2.participant1.id).toBe(leg1.participant2.id);
      expect(leg2.participant2.id).toBe(leg1.participant1.id);
    }
  });
});

// ─── generateEliminationMatches ───────────────────────────────────────────────

describe("generateEliminationMatches", () => {
  it("pairs participants sequentially for a given round", () => {
    const participants = makeParticipants(4);
    const matches = generateEliminationMatches(participants, 1);
    expect(matches).toHaveLength(2);
    expect(matches[0].participant1.id).toBe("p1");
    expect(matches[0].participant2.id).toBe("p2");
    expect(matches[1].participant1.id).toBe("p3");
    expect(matches[1].participant2.id).toBe("p4");
  });

  it("handles odd participant count — last participant gets null opponent", () => {
    const participants = makeParticipants(3);
    const matches = generateEliminationMatches(participants, 1);
    expect(matches).toHaveLength(2);
    expect(matches[1].participant2).toBeNull();
  });

  it("assigns correct round number", () => {
    const matches = generateEliminationMatches(makeParticipants(4), 3);
    for (const m of matches) {
      expect(m.round).toBe(3);
    }
  });

  it("returns empty array for 0 participants", () => {
    expect(generateEliminationMatches([], 1)).toEqual([]);
  });
});

// ─── checkDuplicateMatch ──────────────────────────────────────────────────────

describe("checkDuplicateMatch", () => {
  const existing = [
    { participant1RegistrationId: "p1", participant2RegistrationId: "p2" },
    { participant1RegistrationId: "p3", participant2RegistrationId: "p4" },
  ];

  it("detects an exact duplicate", () => {
    expect(checkDuplicateMatch(existing, "p1", "p2")).toBe(true);
  });

  it("detects a reversed-order duplicate", () => {
    expect(checkDuplicateMatch(existing, "p2", "p1")).toBe(true);
  });

  it("returns false for a non-existing pair", () => {
    expect(checkDuplicateMatch(existing, "p1", "p3")).toBe(false);
  });

  it("returns false for empty existing matches", () => {
    expect(checkDuplicateMatch([], "p1", "p2")).toBe(false);
  });
});
