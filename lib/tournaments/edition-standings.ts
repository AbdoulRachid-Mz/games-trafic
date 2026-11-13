/**
 * lib/tournaments/edition-standings.ts
 *
 * Classement global d'une ÉDITION (toutes phases confondues).
 *
 * Source de vérité unique : les moteurs officiels
 * `syncStandingsWithMatches` + `rankParticipants`. Ce module est PUR
 * (aucun accès DB) et ne réimplémente aucune règle de points ni de
 * départage.
 */

import type { Match } from "./types";
import {
  rankParticipants,
  syncStandingsWithMatches,
  type ParticipantStats,
  type StandingsConfig,
} from "./standings.engine";

export interface EditionStandingEntry {
  registrationId: string;
  position: number;
  stats: ParticipantStats;
}

export function computeEditionStandings(
  participantIds: string[],
  editionMatches: Match[],
  config: Partial<StandingsConfig> = {},
): EditionStandingEntry[] {
  const uniqueIds = Array.from(
    new Set(participantIds.filter((id): id is string => Boolean(id))),
  );
  if (uniqueIds.length === 0) return [];

  const statsMap = syncStandingsWithMatches(uniqueIds, editionMatches, config);
  const tiebreakerOverride = Array.isArray(config.tiebreakerRules)
    ? { tiebreakerRules: config.tiebreakerRules }
    : {};
  const ranked = rankParticipants(statsMap, tiebreakerOverride);

  return ranked.map((entry, index) => ({
    registrationId: entry.registrationId,
    position: index + 1,
    stats: entry.stats,
  }));
}
