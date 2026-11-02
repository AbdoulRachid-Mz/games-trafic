import { describe, it, expect } from "vitest";
import { previewPhaseStructure } from "@/lib/tournaments/preview-engine";

describe("lib/tournaments/preview-engine - Pure Phase Simulation (TASK-TOURN-02)", () => {
  describe("Elimination Format", () => {
    it("should calculate exact bracket size and byes for non-power-of-2 (e.g. 6 participants)", () => {
      const preview = previewPhaseStructure({
        format: "ELIMINATION",
        participantCount: 6,
        matchType: "SINGLE",
      });

      expect(preview.bracketSize).toBe(8);
      expect(preview.byesCount).toBe(2); // 8 - 6 = 2 byes
      expect(preview.totalRounds).toBe(3); // Quarts, Demis, Finale
      expect(preview.roundsSummary).toHaveLength(3);
      expect(preview.roundsSummary[0].name).toBe("Quarts de finale");
      expect(preview.roundsSummary[1].name).toBe("Demi-finales");
      expect(preview.roundsSummary[2].name).toBe("Finale");
    });

    it("should handle exact power-of-2 participants (e.g. 16 participants)", () => {
      const preview = previewPhaseStructure({
        format: "ELIMINATION",
        participantCount: 16,
        matchType: "SINGLE",
      });

      expect(preview.bracketSize).toBe(16);
      expect(preview.byesCount).toBe(0);
      expect(preview.totalRounds).toBe(4);
      expect(preview.roundsSummary[0].name).toBe("8èmes de finale");
      expect(preview.roundsSummary[3].name).toBe("Finale");
    });

    it("should double match count for HOME_AWAY rounds except final", () => {
      const preview = previewPhaseStructure({
        format: "ELIMINATION",
        participantCount: 8,
        matchType: "HOME_AWAY",
      });

      expect(preview.totalRounds).toBe(3);
      // R1 (Quarts): 4 ties * 2 = 8 matches
      expect(preview.roundsSummary[0].matchesCount).toBe(8);
      // R2 (Demis): 2 ties * 2 = 4 matches
      expect(preview.roundsSummary[1].matchesCount).toBe(4);
      // R3 (Finale): 1 match (single)
      expect(preview.roundsSummary[2].matchesCount).toBe(1);
    });

    it("should include 3rd place match if requested", () => {
      const preview = previewPhaseStructure({
        format: "ELIMINATION",
        participantCount: 8,
        matchType: "SINGLE",
        hasThirdPlaceMatch: true,
      });

      const thirdPlace = preview.roundsSummary.find((r) => r.name === "Match 3ème place");
      expect(thirdPlace).toBeDefined();
      expect(thirdPlace?.matchesCount).toBe(1);
    });
  });

  describe("Group Stage / Round Robin Format", () => {
    it("should partition 8 participants into 2 balanced groups of 4", () => {
      const preview = previewPhaseStructure({
        format: "GROUP_STAGE",
        participantCount: 8,
        groupCount: 2,
        matchType: "SINGLE",
      });

      expect(preview.groups).toHaveLength(2);
      expect(preview.groups?.[0].participantCount).toBe(4);
      expect(preview.groups?.[1].participantCount).toBe(4);

      // In each group of 4: 4 * 3 / 2 = 6 matches
      expect(preview.groups?.[0].matchCount).toBe(6);
      expect(preview.groups?.[1].matchCount).toBe(6);
      expect(preview.totalMatches).toBe(12);
    });

    it("should handle unbalanced groups (e.g. 10 participants into 3 groups)", () => {
      const preview = previewPhaseStructure({
        format: "GROUP_STAGE",
        participantCount: 10,
        groupCount: 3,
        matchType: "SINGLE",
      });

      expect(preview.groups).toHaveLength(3);
      // 10 / 3 = 4, 3, 3
      expect(preview.groups?.[0].participantCount).toBe(4);
      expect(preview.groups?.[1].participantCount).toBe(3);
      expect(preview.groups?.[2].participantCount).toBe(3);

      // Group 0 (4 players): 6 matches
      // Group 1 (3 players): 3 matches
      // Group 2 (3 players): 3 matches
      // Total: 12 matches
      expect(preview.totalMatches).toBe(12);
    });

    it("should double matches in groups for HOME_AWAY", () => {
      const preview = previewPhaseStructure({
        format: "ROUND_ROBIN",
        participantCount: 4,
        groupCount: 1,
        matchType: "HOME_AWAY",
      });

      // 4 players single round robin = 6 matches, home/away = 12 matches
      expect(preview.totalMatches).toBe(12);
      expect(preview.groups?.[0].matchCount).toBe(12);
    });
  });

  describe("Edge cases", () => {
    it("should handle fewer than 2 participants gracefully", () => {
      const p0 = previewPhaseStructure({ format: "ELIMINATION", participantCount: 0 });
      expect(p0.totalMatches).toBe(0);
      expect(p0.totalRounds).toBe(0);

      const p1 = previewPhaseStructure({ format: "ELIMINATION", participantCount: 1 });
      expect(p1.totalMatches).toBe(0);
      expect(p1.totalRounds).toBe(0);
    });
  });
});
