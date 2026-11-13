// tests/unit/tournaments/bracket-standings.test.ts
import { describe, it, expect } from "vitest";
import { computeBracketStandings } from "@/lib/tournaments/bracket-standings";

describe("computeBracketStandings", () => {
  it("returns empty for no nodes", () => {
    expect(computeBracketStandings([])).toEqual([]);
  });

  it("extracts participants from metadata and resolves names", () => {
    const rows = computeBracketStandings(
      [
        {
          round: 1,
          isCompleted: false,
          winnerRegistrationId: null,
          metadata: { participants: ["r1", "r2"] },
        },
      ],
      new Map([
        ["r1", "Alice"],
        ["r2", "Bob"],
      ]),
    );
    expect(rows.map((row) => row.participantName)).toEqual(["Alice", "Bob"]);
    expect(rows.every((row) => row.round === 1)).toBe(true);
  });

  it("marks winners and losers for completed nodes", () => {
    const rows = computeBracketStandings([
      {
        round: 2,
        isCompleted: true,
        winnerRegistrationId: "r1",
        metadata: { participants: ["r1", "r2"] },
      },
    ]);
    const r1 = rows.find((row) => row.registrationId === "r1")!;
    const r2 = rows.find((row) => row.registrationId === "r2")!;
    expect(r1.won).toBe(true);
    expect(r1.eliminated).toBe(false);
    expect(r2.won).toBe(false);
    expect(r2.eliminated).toBe(true);
    expect(r1.position).toBeLessThan(r2.position);
  });

  it("ignores non-string participants and falls back to winner id", () => {
    const rows = computeBracketStandings([
      {
        round: 1,
        isCompleted: true,
        winnerRegistrationId: "winner-only",
        metadata: { participants: [] },
      },
    ]);
    const ids = rows.map((row) => row.registrationId);
    expect(ids).toContain("winner-only");
  });

  it("correctly ranks 1st, 2nd, 3rd and 4th with a completed consolation match", () => {
    const rows = computeBracketStandings([
      // Semi-finals (round 1)
      {
        round: 1,
        isCompleted: true,
        winnerRegistrationId: "p1",
        metadata: { participants: ["p1", "p3"] },
      },
      {
        round: 1,
        isCompleted: true,
        winnerRegistrationId: "p2",
        metadata: { participants: ["p2", "p4"] },
      },
      // Final (round 2) - p1 beats p2
      {
        round: 2,
        isCompleted: true,
        bracketType: "FINAL",
        winnerRegistrationId: "p1",
        metadata: { participants: ["p1", "p2"] },
      },
      // Consolation / 3rd place (round 2) - p3 beats p4
      {
        round: 2,
        isCompleted: true,
        bracketType: "CONSOLATION",
        winnerRegistrationId: "p3",
        metadata: { participants: ["p3", "p4"], isThirdPlace: true },
      },
    ]);

    expect(rows.find((r) => r.registrationId === "p1")?.position).toBe(1);
    expect(rows.find((r) => r.registrationId === "p2")?.position).toBe(2);
    expect(rows.find((r) => r.registrationId === "p3")?.position).toBe(3);
    expect(rows.find((r) => r.registrationId === "p4")?.position).toBe(4);
  });
});
