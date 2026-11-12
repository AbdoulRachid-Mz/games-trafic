import { describe, expect, it } from "vitest";
import {
  applyQualificationToRanking,
  buildResultProgressionMessage,
  getFormatDefaultAdvanceCount,
  resolveQualification,
} from "@/lib/tournaments/qualification";
import {
  DEFAULT_MATCH_DURATION_MINUTES,
  isMatchScheduleValid,
  resolveMatchSchedule,
} from "@/lib/tournaments/scheduling";

const ranked = (count: number) =>
  Array.from({ length: count }, (_, index) => ({
    registrationId: `reg-${index + 1}`,
    stats: { points: count - index },
  }));

describe("resolveQualification — priorité groupe → phase → édition → format", () => {
  it("respecte un advanceCount différent de 2 au niveau groupe", () => {
    const resolved = resolveQualification({
      group: { config: { advanceCount: 4 } },
      phase: { config: { advanceCount: 3 }, phaseType: "GROUP_STAGE" },
      edition: { editionConfig: { advanceCount: 2 } },
    });
    expect(resolved.advanceCount).toBe(4);
    expect(resolved.source).toBe("GROUP");
  });

  it("hérite de la phase quand le groupe ne définit rien", () => {
    const resolved = resolveQualification({
      group: { config: {} },
      phase: { config: { advanceCount: 3 }, phaseType: "GROUP_STAGE" },
    });
    expect(resolved.advanceCount).toBe(3);
    expect(resolved.source).toBe("PHASE");
    expect(resolved.inherited).toBe(true);
  });

  it("hérite de l'édition quand groupe et phase ne définissent rien", () => {
    const resolved = resolveQualification({
      phase: { config: {}, phaseType: "GROUP_STAGE" },
      edition: { editionConfig: { advanceCount: 6 } },
    });
    expect(resolved.advanceCount).toBe(6);
    expect(resolved.source).toBe("EDITION");
  });

  it("utilise le défaut du format en dernier recours (CUP=1, SWISS=8)", () => {
    expect(
      resolveQualification({ phase: { config: {}, phaseType: "CUP" } }),
    ).toMatchObject({ advanceCount: 1, source: "FORMAT_DEFAULT" });
    expect(
      resolveQualification({ phase: { config: {}, phaseType: "SWISS" } }),
    ).toMatchObject({ advanceCount: 8, source: "FORMAT_DEFAULT" });
    expect(getFormatDefaultAdvanceCount("LDC")).toBe(2);
  });

  it("ignore les valeurs invalides (0, négatif, NaN)", () => {
    const resolved = resolveQualification({
      group: { config: { advanceCount: 0 } },
      phase: { config: { advanceCount: -4 }, phaseType: "GROUP_STAGE" },
      edition: { editionConfig: { advanceCount: Number.NaN } },
    });
    expect(resolved.advanceCount).toBe(2);
    expect(resolved.source).toBe("FORMAT_DEFAULT");
  });

  it("lit advanceFromGroup comme alias legacy", () => {
    const resolved = resolveQualification({
      phase: { config: { advanceFromGroup: 5 }, phaseType: "GROUP_STAGE" },
    });
    expect(resolved.advanceCount).toBe(5);
  });
});

describe("applyQualificationToRanking — messages issus du calcul réel", () => {
  it("qualifie exactement top-N et élimine le reste", () => {
    const resolution = resolveQualification({
      group: { config: { advanceCount: 3 } },
      phase: { config: {}, phaseType: "GROUP_STAGE" },
    });
    const outcome = applyQualificationToRanking(ranked(8), resolution, {
      groupName: "Groupe A",
    });

    expect(outcome.qualified.map((p) => p.registrationId)).toEqual([
      "reg-1",
      "reg-2",
      "reg-3",
    ]);
    expect(outcome.eliminated).toHaveLength(5);
    expect(outcome.messages[0]).toContain("3 participant(s) qualifié(s)");
    expect(outcome.messages[0]).toContain("top 3");
    expect(outcome.messages[0]).toContain("configuration du groupe");
  });

  it("une journée Round Robin ne qualifie personne", () => {
    const resolution = resolveQualification({
      group: { config: { isMatchday: true } },
      phase: { config: { advanceCount: 4 }, phaseType: "ROUND_ROBIN" },
    });
    const outcome = applyQualificationToRanking(ranked(6), resolution);
    expect(outcome.qualified).toHaveLength(0);
    expect(outcome.advanceCount).toBe(0);
    expect(outcome.messages[0]).toContain("aucune qualification individuelle");
  });

  it("ajoute les qualifications transversales configurées", () => {
    const resolution = resolveQualification({
      phase: {
        config: { advanceCount: 2, additionalQualifiers: 2 },
        phaseType: "GROUP_STAGE",
      },
    });
    const outcome = applyQualificationToRanking(ranked(6), resolution);
    expect(outcome.qualified).toHaveLength(2);
    expect(outcome.additionalQualified.map((p) => p.registrationId)).toEqual([
      "reg-3",
      "reg-4",
    ]);
    expect(outcome.eliminated).toHaveLength(2);
  });

  it("le résumé de fin de phase reflète le nombre réel de qualifiés", () => {
    expect(
      buildResultProgressionMessage({
        isPhaseComplete: true,
        qualifiedCount: 4,
        nextPhaseName: "Demi-finales",
      }),
    ).toContain("4 participant(s) qualifié(s)");
    expect(
      buildResultProgressionMessage({ isGroupComplete: true, advanceCount: 3 }),
    ).toContain("top 3");
  });
});

describe("resolveMatchSchedule — programmation idempotente", () => {
  const now = new Date("2026-05-01T12:00:00.000Z");

  it("conserve une programmation valide", () => {
    const current = {
      scheduledTime: new Date("2026-05-02T10:00:00.000Z"),
      estimatedDuration: 45,
    };
    expect(isMatchScheduleValid(current)).toBe(true);
    const schedule = resolveMatchSchedule(current, { now });
    expect(schedule.preserved).toBe(true);
    expect(schedule.scheduledTime.toISOString()).toBe(
      "2026-05-02T10:00:00.000Z",
    );
    expect(schedule.scheduledEnd.toISOString()).toBe(
      "2026-05-02T10:45:00.000Z",
    );
  });

  it("crée début=maintenant et fin=+20 min si absent", () => {
    const schedule = resolveMatchSchedule(null, { now });
    expect(schedule.preserved).toBe(false);
    expect(schedule.scheduledTime.toISOString()).toBe(now.toISOString());
    expect(schedule.estimatedDuration).toBe(DEFAULT_MATCH_DURATION_MINUTES);
    expect(schedule.scheduledEnd.getTime() - now.getTime()).toBe(
      DEFAULT_MATCH_DURATION_MINUTES * 60_000,
    );
  });

  it("utilise la durée configurée quand elle est valide", () => {
    const schedule = resolveMatchSchedule(null, {
      now,
      configuredDuration: 35,
    });
    expect(schedule.estimatedDuration).toBe(35);
    expect(schedule.scheduledEnd.getTime() - now.getTime()).toBe(35 * 60_000);
  });

  it("refuse une durée invalide et garantit fin > début", () => {
    const schedule = resolveMatchSchedule(
      {
        scheduledTime: now,
        estimatedDuration: -10,
      },
      { now },
    );
    expect(schedule.estimatedDuration).toBe(DEFAULT_MATCH_DURATION_MINUTES);
    expect(schedule.scheduledEnd.getTime()).toBeGreaterThan(
      schedule.scheduledTime.getTime(),
    );
  });

  it("est idempotent sur un retry avec la même référence temporelle", () => {
    const first = resolveMatchSchedule(null, { now });
    const second = resolveMatchSchedule(
      {
        scheduledTime: first.scheduledTime,
        estimatedDuration: first.estimatedDuration,
      },
      { now: new Date(now.getTime() + 60_000) },
    );
    expect(second.preserved).toBe(true);
    expect(second.scheduledTime.toISOString()).toBe(
      first.scheduledTime.toISOString(),
    );
  });

  it("préserve un début existant sans durée et complète la durée", () => {
    const start = new Date("2026-05-03T09:00:00.000Z");
    const schedule = resolveMatchSchedule(
      { scheduledTime: start, estimatedDuration: null },
      { now },
    );
    expect(schedule.scheduledTime.toISOString()).toBe(start.toISOString());
    expect(schedule.estimatedDuration).toBe(DEFAULT_MATCH_DURATION_MINUTES);
  });
});
