import { describe, it, expect } from "vitest";
import { buildLeagueCalendar } from "@/lib/tournaments/match.generator";
import {
  resolveScoring,
  inheritScoringToGroup,
  isMatchCountable,
  SCORING_DEFAULTS,
} from "@/lib/tournaments/scoring";
import {
  getEffectiveAdvanceCount,
  isMatchdayGroup,
  isLegacyLeagueStructure,
  DEFAULT_ADVANCE_COUNT,
} from "@/lib/tournaments/config";

function makeIds(n: number): string[] {
  return Array.from(
    { length: n },
    (_, i) => `reg-${i}-${"00000000-0000-0000-0000-" + (100 + i)}`,
  );
}

function allPairs(cal: ReturnType<typeof buildLeagueCalendar>) {
  const pairs: string[] = [];
  for (const d of cal) {
    for (const f of d.fixtures) {
      if (!f.p1 || !f.p2) continue;
      expect(f.p1).not.toBe(f.p2);
      pairs.push([f.p1, f.p2].sort().join("|"));
    }
  }
  return pairs;
}

describe("buildLeagueCalendar — Round Robin groupes = journées (Phase 1)", () => {
  for (const n of [4, 5, 6, 8]) {
    it(`N=${n} aller simple : ${n - (n % 2 === 0 ? 1 : 0)} journées, paires uniques, pas de doublon par journée`, () => {
      const ids = makeIds(n);
      const cal = buildLeagueCalendar(ids, { isHomeAway: false });

      const expectedDays = n % 2 === 0 ? n - 1 : n;
      expect(cal.length).toBe(expectedDays);
      expect(cal[0].day).toBe(1);
      expect(cal[expectedDays - 1].day).toBe(expectedDays);

      // Pas de doublon de confrontation dans une même journée.
      for (const d of cal) {
        const seen = new Set<string>();
        for (const f of d.fixtures) {
          const key = [f.p1, f.p2].sort().join("|");
          expect(seen.has(key)).toBe(false);
          seen.add(key);
        }
      }

      // Participants impairs : au plus 1 exempté par journée.
      if (n % 2 !== 0) {
        for (const d of cal) {
          expect(d.byeParticipants.length).toBe(1);
          expect(d.fixtures.length).toBe((n - 1) / 2);
          expect(ids.includes(d.byeParticipants[0])).toBe(true);
        }
      } else {
        for (const d of cal) {
          expect(d.byeParticipants.length).toBe(0);
          expect(d.fixtures.length).toBe(n / 2);
        }
      }

      // Paires : toutes uniques sur l'aller simple.
      const pairs = allPairs(cal);
      expect(pairs.length).toBe(new Set(pairs).size);
      const expectedPairCount = (n * (n - 1)) / 2;
      expect(new Set(pairs).size).toBe(expectedPairCount);
    });
  }

  it("N=6 aller-retour : 10 journées, seconde moitié inversée, chaque paire 2× (un aller, un retour)", () => {
    const ids = makeIds(6);
    const single = buildLeagueCalendar(ids, { isHomeAway: false });
    const double = buildLeagueCalendar(ids, { isHomeAway: true });

    expect(double.length).toBe(single.length * 2);

    const counts = new Map<string, { a2b: number; b2a: number }>();
    for (const d of double) {
      for (const f of d.fixtures) {
        if (!f.p1 || !f.p2) continue;
        const key = [f.p1, f.p2].sort().join("|");
        const rec = counts.get(key) || { a2b: 0, b2a: 0 };
        if (f.p1 < f.p2) rec.a2b += 1;
        else rec.b2a += 1;
        counts.set(key, rec);
      }
    }
    for (const [key, rec] of counts.entries()) {
      expect(rec.a2b, key).toBe(1);
      expect(rec.b2a, key).toBe(1);
    }

    // La journée 6 (retour de 1) contient les mêmes paires inversées que la 1.
    const day1 = single[0].fixtures.map((f) => [f.p1, f.p2] as const);
    const day6 = double[5].fixtures.map((f) => [f.p1, f.p2] as const);
    const day1Sorted = day1.map(([a, b]) => [a, b].sort().join("|")).sort();
    const day6Sorted = day6.map(([a, b]) => [a, b].sort().join("|")).sort();
    expect(day6Sorted).toEqual(day1Sorted);
    // … avec l'inversion effectif des domiciles.
    const inverted = day1.every(([a, b]) =>
      day6.some(([x, y]) => x === b && y === a),
    );
    expect(inverted).toBe(true);
  });

  it("N=3 : journées avec exempt (BYE jamais présent dans une confrontation)", () => {
    const ids = makeIds(3);
    const cal = buildLeagueCalendar(ids, { isHomeAway: false });
    expect(cal.length).toBe(3);
    for (const d of cal) {
      for (const f of d.fixtures) {
        expect(f.p1 === "BYE" || f.p2 === "BYE").toBe(false);
      }
    }
  });

  it("moins de 2 participants : calendrier vide", () => {
    expect(buildLeagueCalendar([], {})).toEqual([]);
    expect(buildLeagueCalendar(makeIds(1), {})).toEqual([]);
  });
});

describe("resolveScoring — hiérarchie phase → défauts (Phase 1/2)", () => {
  it("applique les défauts 3/1/0 explicites", () => {
    expect(resolveScoring({}, {})).toEqual({
      pointsPerWin: 3,
      pointsPerDraw: 1,
      pointsPerLoss: 0,
    });
    expect(SCORING_DEFAULTS.pointsPerWin).toBe(3);
  });

  it("priorise group.config sur phase.config", () => {
    expect(
      resolveScoring({ pointsPerWin: 5 }, { pointsPerWin: 2 }),
    ).toEqual({
      pointsPerWin: 2,
      pointsPerDraw: 1,
      pointsPerLoss: 0,
    });
  });

  it("0 est une valeur explicite valide, pas un défaut", () => {
    expect(resolveScoring({ pointsPerDraw: 0 }, {})).toEqual({
      pointsPerWin: 3,
      pointsPerDraw: 0,
      pointsPerLoss: 0,
    });
    expect(resolveScoring({}, { pointsPerLoss: 0 })).toEqual({
      pointsPerWin: 3,
      pointsPerDraw: 1,
      pointsPerLoss: 0,
    });
  });

  it("les valeurs string numériques sont acceptées (l'UI envoie parfois des strings)", () => {
    expect(resolveScoring({ pointsPerWin: "4" }, {})).toEqual({
      pointsPerWin: 4,
      pointsPerDraw: 1,
      pointsPerLoss: 0,
    });
    expect(resolveScoring({ pointsPerWin: "abc" }, {})).toEqual({
      pointsPerWin: 3,
      pointsPerDraw: 1,
      pointsPerLoss: 0,
    });
  });

  it("inheritScoringToGroup pérennise le scoring + extras", () => {
    const cfg = inheritScoringToGroup({ pointsPerWin: 4 }, { isMatchday: true });
    expect(cfg).toEqual({
      isMatchday: true,
      pointsPerWin: 4,
      pointsPerDraw: 1,
      pointsPerLoss: 0,
    });
  });
});

describe("isMatchCountable — frontière de décompte", () => {
  it("COMPLETED/FINISHED/AWAITING_ADMIN_CONFIRMATION décomptables", () => {
    expect(isMatchCountable({ status: "COMPLETED" })).toBe(true);
    expect(isMatchCountable({ status: "FINISHED" })).toBe(true);
    expect(
      isMatchCountable({ status: "AWAITING_ADMIN_CONFIRMATION" }),
    ).toBe(true);
  });

  it("PENDING/annulés/perdants par forfait/pendingvue non décomptés", () => {
    expect(isMatchCountable({ status: "PENDING" })).toBe(false);
    expect(isMatchCountable({ status: "CANCELLED" })).toBe(false);
    expect(isMatchCountable({ status: "PENDING_REVIEW" })).toBe(false);
    expect(
      isMatchCountable({ status: "PENDING_REVIEW", confirmedByAdmin: true }),
    ).toBe(true);
  });
});

describe("getEffectiveAdvanceCount — top-N dynamique (Phase 1)", () => {
  it("défaut explicite 2 quand rien n'est configuré", () => {
    expect(getEffectiveAdvanceCount(null, null)).toBe(DEFAULT_ADVANCE_COUNT);
    expect(getEffectiveAdvanceCount({}, {})).toBe(2);
  });

  it("priorité group.config → phase.config → advanceFromGroup (legacy)", () => {
    expect(
      getEffectiveAdvanceCount({ config: { advanceCount: 4 } }, { config: { advanceCount: 3 } }),
    ).toBe(3);
    expect(
      getEffectiveAdvanceCount({ config: { advanceCount: 4, advanceFromGroup: 6 } }, null),
    ).toBe(4);
    expect(
      getEffectiveAdvanceCount({ config: { advanceFromGroup: 5 } }, null),
    ).toBe(5);
  });

  it("0/négatif/NaN = valeur invalide (retombe au niveau suivant)", () => {
    expect(getEffectiveAdvanceCount({ config: { advanceCount: 0 } }, null)).toBe(2);
    expect(
      getEffectiveAdvanceCount(
        { config: { advanceCount: -1 } },
        { config: { advanceCount: NaN } },
      ),
    ).toBe(2);
  });
});

describe("isMatchdayGroup / isLegacyLeagueStructure — compat anciennes éditions", () => {
  it("matchday = groupe-journée refondu", () => {
    expect(isMatchdayGroup({ isMatchday: true })).toBe(true);
    expect(isMatchdayGroup({})).toBe(false);
    expect(isMatchdayGroup(null)).toBe(false);
  });

  it("ancien RR = 1 seul groupe non-matchday, phaseType ROUND_ROBIN", () => {
    expect(
      isLegacyLeagueStructure("ROUND_ROBIN", [
        { groupType: "ROUND_ROBIN", name: "Classement", config: {} },
      ]),
    ).toBe(true);
    expect(
      isLegacyLeagueStructure("ROUND_ROBIN", [
        { groupType: "ROUND_ROBIN", name: "Journée 1", config: { isMatchday: true } },
      ]),
    ).toBe(false);
    expect(
      isLegacyLeagueStructure("ROUND_ROBIN", [
        { groupType: "ROUND_ROBIN", name: "Journée 1", config: {} },
        { groupType: "ROUND_ROBIN", name: "Journée 2", config: {} },
      ]),
    ).toBe(false);
    expect(isLegacyLeagueStructure("GROUP_STAGE", [{ config: {} }])).toBe(false);
  });
});
