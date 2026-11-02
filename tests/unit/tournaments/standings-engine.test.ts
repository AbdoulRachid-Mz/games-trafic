// tests/unit/tournaments/standings-engine.test.ts
import { describe, it, expect } from "vitest";
import {
  syncStandingsWithMatches,
  rankParticipants,
  type StandingsConfig,
} from "@/lib/tournaments/standings.engine";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeMatch(
  p1: string,
  p2: string,
  score1: number,
  score2: number,
  winner: string | null = null
) {
  return {
    participant1RegistrationId: p1,
    participant2RegistrationId: p2,
    score1,
    score2,
    winnerRegistrationId: winner,
    status: "COMPLETED",
    confirmedByAdmin: true,
  };
}

// ─── syncStandingsWithMatches ─────────────────────────────────────────────────

describe("syncStandingsWithMatches", () => {
  it("initialises all participants to zero stats", () => {
    const stats = syncStandingsWithMatches(["p1", "p2"], []);
    const p1 = stats.get("p1")!;
    expect(p1.matchesPlayed).toBe(0);
    expect(p1.points).toBe(0);
  });

  it("correctly attributes a win to the higher-scoring participant", () => {
    const stats = syncStandingsWithMatches(
      ["p1", "p2"],
      [makeMatch("p1", "p2", 3, 1)] as any[]
    );
    const p1 = stats.get("p1")!;
    const p2 = stats.get("p2")!;
    expect(p1.matchesWon).toBe(1);
    expect(p1.matchesLost).toBe(0);
    expect(p1.points).toBe(3); // default pointsPerWin = 3
    expect(p2.matchesLost).toBe(1);
    expect(p2.points).toBe(0);
  });

  it("correctly attributes a draw (equal scores)", () => {
    const stats = syncStandingsWithMatches(
      ["p1", "p2"],
      [makeMatch("p1", "p2", 1, 1)] as any[]
    );
    const p1 = stats.get("p1")!;
    const p2 = stats.get("p2")!;
    expect(p1.matchesDrawn).toBe(1);
    expect(p2.matchesDrawn).toBe(1);
    expect(p1.points).toBe(1); // default pointsPerDraw = 1
    expect(p2.points).toBe(1);
  });

  it("correctly counts scoreFor and scoreAgainst", () => {
    const stats = syncStandingsWithMatches(
      ["p1", "p2"],
      [makeMatch("p1", "p2", 4, 2)] as any[]
    );
    const p1 = stats.get("p1")!;
    expect(p1.scoreFor).toBe(4);
    expect(p1.scoreAgainst).toBe(2);
    expect(p1.scoreDifference).toBe(2);
  });

  it("accumulates stats across multiple matches", () => {
    const matches = [
      makeMatch("p1", "p2", 2, 0),
      makeMatch("p1", "p3", 1, 1),
      makeMatch("p2", "p3", 3, 1),
    ] as any[];
    const stats = syncStandingsWithMatches(["p1", "p2", "p3"], matches);

    expect(stats.get("p1")!.matchesPlayed).toBe(2);
    expect(stats.get("p2")!.matchesPlayed).toBe(2);
    expect(stats.get("p3")!.matchesPlayed).toBe(2);
  });

  it("ignores non-COMPLETED matches when not confirmedByAdmin", () => {
    // The engine skips when: status != COMPLETED/FINISHED AND !confirmedByAdmin
    // So a PENDING match with confirmedByAdmin=false is ignored; confirmedByAdmin=true is included.
    const match = { ...makeMatch("p1", "p2", 3, 0), status: "PENDING", confirmedByAdmin: false };
    const stats = syncStandingsWithMatches(["p1", "p2"], [match] as any[]);
    expect(stats.get("p1")!.matchesPlayed).toBe(0);
  });

  it("uses custom pointsPerWin config", () => {
    const stats = syncStandingsWithMatches(
      ["p1", "p2"],
      [makeMatch("p1", "p2", 1, 0)] as any[],
      { pointsPerWin: 2 }
    );
    expect(stats.get("p1")!.points).toBe(2);
  });

  it("adds unknown participant encountered mid-match to the map", () => {
    // p3 wasn't in the initial list but appears in a match
    const stats = syncStandingsWithMatches(
      ["p1", "p2"],
      [makeMatch("p1", "p3", 2, 0)] as any[]
    );
    expect(stats.has("p3")).toBe(true);
  });
});

// ─── rankParticipants ─────────────────────────────────────────────────────────

describe("rankParticipants", () => {
  it("ranks by points descending", () => {
    const statsMap = new Map([
      ["p1", { matchesPlayed: 2, matchesWon: 1, matchesDrawn: 0, matchesLost: 1, points: 3, scoreFor: 2, scoreAgainst: 1, scoreDifference: 1 }],
      ["p2", { matchesPlayed: 2, matchesWon: 2, matchesDrawn: 0, matchesLost: 0, points: 6, scoreFor: 4, scoreAgainst: 0, scoreDifference: 4 }],
    ]);
    const ranked = rankParticipants(statsMap);
    expect(ranked[0].registrationId).toBe("p2");
    expect(ranked[1].registrationId).toBe("p1");
  });

  it("uses goal difference as tiebreaker when points are equal", () => {
    const statsMap = new Map([
      ["p1", { matchesPlayed: 1, matchesWon: 1, matchesDrawn: 0, matchesLost: 0, points: 3, scoreFor: 2, scoreAgainst: 1, scoreDifference: 1 }],
      ["p2", { matchesPlayed: 1, matchesWon: 1, matchesDrawn: 0, matchesLost: 0, points: 3, scoreFor: 4, scoreAgainst: 0, scoreDifference: 4 }],
    ]);
    const ranked = rankParticipants(statsMap);
    expect(ranked[0].registrationId).toBe("p2"); // higher goal diff
  });

  it("uses goals for as secondary tiebreaker", () => {
    const statsMap = new Map([
      ["p1", { matchesPlayed: 1, matchesWon: 1, matchesDrawn: 0, matchesLost: 0, points: 3, scoreFor: 2, scoreAgainst: 1, scoreDifference: 1 }],
      ["p2", { matchesPlayed: 1, matchesWon: 1, matchesDrawn: 0, matchesLost: 0, points: 3, scoreFor: 3, scoreAgainst: 2, scoreDifference: 1 }],
    ]);
    const ranked = rankParticipants(statsMap);
    expect(ranked[0].registrationId).toBe("p2"); // higher goals for
  });

  it("returns stable order when all stats are equal", () => {
    const statsMap = new Map([
      ["p1", { matchesPlayed: 0, matchesWon: 0, matchesDrawn: 0, matchesLost: 0, points: 0, scoreFor: 0, scoreAgainst: 0, scoreDifference: 0 }],
      ["p2", { matchesPlayed: 0, matchesWon: 0, matchesDrawn: 0, matchesLost: 0, points: 0, scoreFor: 0, scoreAgainst: 0, scoreDifference: 0 }],
    ]);
    const ranked = rankParticipants(statsMap);
    expect(ranked).toHaveLength(2);
  });
});
