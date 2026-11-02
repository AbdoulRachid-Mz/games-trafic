// tests/unit/tournaments/bracket-engine.test.ts
import { describe, it, expect } from "vitest";
import {
  computeWinner,
  computeAggregatedWinner,
  resolveSlotIndex,
  getRequiredWins,
  FINAL_STATUSES,
} from "@/lib/tournaments/bracket-engine";

// ─── getRequiredWins ──────────────────────────────────────────────────────────

describe("getRequiredWins", () => {
  it("returns 3 for BEST_OF_5", () => expect(getRequiredWins("BEST_OF_5")).toBe(3));
  it("returns 2 for BEST_OF_3", () => expect(getRequiredWins("BEST_OF_3")).toBe(2));
  it("returns 1 for BEST_OF_1", () => expect(getRequiredWins("BEST_OF_1")).toBe(1));
  it("returns 1 for unknown format", () => expect(getRequiredWins("SOME_FORMAT")).toBe(1));
});

// ─── FINAL_STATUSES ───────────────────────────────────────────────────────────

describe("FINAL_STATUSES", () => {
  it("includes COMPLETED", () => expect(FINAL_STATUSES.has("COMPLETED")).toBe(true));
  it("includes CANCELLED", () => expect(FINAL_STATUSES.has("CANCELLED")).toBe(true));
  it("does not include PENDING", () => expect(FINAL_STATUSES.has("PENDING")).toBe(false));
});

// ─── computeWinner ────────────────────────────────────────────────────────────

describe("computeWinner", () => {
  it("returns null winnerId when no matches have a winner", () => {
    const { winnerId } = computeWinner([{ winnerRegistrationId: null }], 1);
    expect(winnerId).toBeNull();
  });

  it("returns the winner when they have enough wins (BEST_OF_1)", () => {
    const matches = [{ winnerRegistrationId: "p1" }];
    const { winnerId } = computeWinner(matches, 1);
    expect(winnerId).toBe("p1");
  });

  it("returns null when winner has not reached required wins (BEST_OF_3, 1 win)", () => {
    const matches = [{ winnerRegistrationId: "p1" }];
    const { winnerId } = computeWinner(matches, 2);
    expect(winnerId).toBeNull();
  });

  it("correctly counts wins across multiple matches", () => {
    const matches = [
      { winnerRegistrationId: "p1" },
      { winnerRegistrationId: "p2" },
      { winnerRegistrationId: "p1" },
    ];
    const { winnerId, wins } = computeWinner(matches, 2);
    expect(winnerId).toBe("p1");
    expect(wins.get("p1")).toBe(2);
    expect(wins.get("p2")).toBe(1);
  });

  it("handles empty matches array", () => {
    const { winnerId } = computeWinner([], 1);
    expect(winnerId).toBeNull();
  });
});

// ─── resolveSlotIndex ─────────────────────────────────────────────────────────

describe("resolveSlotIndex", () => {
  it("returns 0 for UPPER", () => expect(resolveSlotIndex("UPPER")).toBe(0));
  it("returns 0 for WINNER", () => expect(resolveSlotIndex("WINNER")).toBe(0));
  it("returns 1 for LOWER", () => expect(resolveSlotIndex("LOWER")).toBe(1));
  it("returns 1 for LOSER", () => expect(resolveSlotIndex("LOSER")).toBe(1));
  it("returns null for undefined", () => expect(resolveSlotIndex(undefined)).toBeNull());
  it("returns null for null", () => expect(resolveSlotIndex(null)).toBeNull());
  it("returns null for unknown value", () => expect(resolveSlotIndex("UNKNOWN")).toBeNull());
});

// ─── computeAggregatedWinner ──────────────────────────────────────────────────

describe("computeAggregatedWinner", () => {
  const base = {
    status: "COMPLETED",
    confirmedByAdmin: true,
    participant1RegistrationId: "p1",
    participant2RegistrationId: "p2",
  };

  it("returns p1 as winner when aggregate score favours p1", () => {
    const matches = [
      { ...base, score1: 2, score2: 1 },
      { ...base, score1: 3, score2: 0 },
    ];
    const { winnerId, aggregateScore1, aggregateScore2 } = computeAggregatedWinner(matches);
    expect(winnerId).toBe("p1");
    expect(aggregateScore1).toBe(5);
    expect(aggregateScore2).toBe(1);
  });

  it("returns p2 as winner when aggregate score favours p2", () => {
    const matches = [
      { ...base, score1: 0, score2: 2 },
      { ...base, score1: 1, score2: 2 },
    ];
    const { winnerId } = computeAggregatedWinner(matches);
    expect(winnerId).toBe("p2");
  });

  it("returns null winner for a draw", () => {
    const matches = [
      { ...base, score1: 1, score2: 1 },
    ];
    const { winnerId } = computeAggregatedWinner(matches);
    expect(winnerId).toBeNull();
  });

  it("ignores matches not confirmedByAdmin", () => {
    const matches = [
      { ...base, score1: 5, score2: 0, confirmedByAdmin: false },
    ];
    const { winnerId, aggregateScore1, aggregateScore2 } = computeAggregatedWinner(matches);
    expect(winnerId).toBeNull();
    expect(aggregateScore1).toBe(0);
    expect(aggregateScore2).toBe(0);
  });

  it("ignores non-COMPLETED matches", () => {
    const matches = [
      { ...base, status: "PENDING", score1: 5, score2: 0 },
    ];
    const { winnerId } = computeAggregatedWinner(matches);
    expect(winnerId).toBeNull();
  });

  it("handles empty matches array", () => {
    const { winnerId, aggregateScore1, aggregateScore2 } = computeAggregatedWinner([]);
    expect(winnerId).toBeNull();
    expect(aggregateScore1).toBe(0);
    expect(aggregateScore2).toBe(0);
  });
});
