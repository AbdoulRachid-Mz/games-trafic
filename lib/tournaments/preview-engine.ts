import type { MatchType } from "./types";

export interface PhasePreviewConfig {
  format:
    | "ELIMINATION"
    | "GROUP_STAGE"
    | "ROUND_ROBIN"
    | "SWISS"
    | "KNOCKOUT"
    | "CUSTOM";
  participantCount: number;
  matchType?: MatchType;
  groupCount?: number;
  qualifiersPerGroup?: number;
  hasThirdPlaceMatch?: boolean;
}

export interface GroupPreview {
  groupIndex: number;
  name: string;
  participantCount: number;
  matchCount: number;
  roundRobinRounds: number;
}

export interface RoundSummary {
  round: number;
  name: string;
  matchesCount: number;
}

export interface PhasePreviewResult {
  format: string;
  totalParticipants: number;
  totalMatches: number;
  totalRounds: number;
  byesCount: number;
  bracketSize?: number;
  groups?: GroupPreview[];
  roundsSummary: RoundSummary[];
}

/**
 * Calcule purement la prévisualisation d'une structure de phase (sans accès DB).
 * Fonction 100% déterministe.
 */
export function previewPhaseStructure(
  config: PhasePreviewConfig
): PhasePreviewResult {
  const {
    format,
    participantCount,
    matchType = "SINGLE",
    groupCount = 1,
    hasThirdPlaceMatch = false,
  } = config;

  if (participantCount < 2) {
    return {
      format,
      totalParticipants: Math.max(0, participantCount),
      totalMatches: 0,
      totalRounds: 0,
      byesCount: 0,
      roundsSummary: [],
    };
  }

  // 1. FORMATS À ÉLIMINATION DIRECTE (ELIMINATION / KNOCKOUT)
  if (format === "ELIMINATION" || format === "KNOCKOUT") {
    // Puissance de 2 immédiatement supérieure ou égale
    let bracketSize = 2;
    let rounds = 1;
    while (bracketSize < participantCount) {
      bracketSize *= 2;
      rounds++;
    }

    const byesCount = bracketSize - participantCount;
    // Round 1 : matches avec les participants qui ne sont pas exemptés (BYE)
    const round1NonByes = participantCount - byesCount;
    const round1Matches = Math.floor(round1NonByes / 2);

    const roundsSummary: RoundSummary[] = [];

    // Noms standards de rounds selon la profondeur
    const getRoundName = (roundNum: number, totalR: number) => {
      const remainingRounds = totalR - roundNum;
      if (remainingRounds === 0) return "Finale";
      if (remainingRounds === 1) return "Demi-finales";
      if (remainingRounds === 2) return "Quarts de finale";
      if (remainingRounds === 3) return "8èmes de finale";
      if (remainingRounds === 4) return "16èmes de finale";
      return `Tour ${roundNum}`;
    };

    let totalMatches = 0;
    let activeParticipants = bracketSize / 2;

    for (let r = 1; r <= rounds; r++) {
      const matchesInRound = r === 1 ? round1Matches : activeParticipants;
      const count = matchType === "HOME_AWAY" && r < rounds ? matchesInRound * 2 : matchesInRound;

      roundsSummary.push({
        round: r,
        name: getRoundName(r, rounds),
        matchesCount: count,
      });

      totalMatches += count;
      activeParticipants = Math.floor(activeParticipants / 2);
    }

    if (hasThirdPlaceMatch) {
      roundsSummary.push({
        round: rounds,
        name: "Match 3ème place",
        matchesCount: 1,
      });
      totalMatches += 1;
    }

    return {
      format,
      totalParticipants: participantCount,
      totalMatches,
      totalRounds: rounds,
      byesCount,
      bracketSize,
      roundsSummary,
    };
  }

  // 2. FORMATS DE POULES / GROUPES (GROUP_STAGE / ROUND_ROBIN)
  const actualGroupCount = Math.max(1, Math.min(groupCount, Math.floor(participantCount / 2)));
  const basePerGroup = Math.floor(participantCount / actualGroupCount);
  const extraParticipants = participantCount % actualGroupCount;

  const groups: GroupPreview[] = [];
  let totalGroupMatches = 0;
  let maxRounds = 0;

  for (let i = 0; i < actualGroupCount; i++) {
    const pInGroup = basePerGroup + (i < extraParticipants ? 1 : 0);
    // Dans un round-robin complet, chaque paire joue: n * (n - 1) / 2
    const singleMatches = (pInGroup * (pInGroup - 1)) / 2;
    const groupMatches = matchType === "HOME_AWAY" ? singleMatches * 2 : singleMatches;
    const roundsInGroup = pInGroup % 2 === 0 ? pInGroup - 1 : pInGroup;

    if (roundsInGroup > maxRounds) {
      maxRounds = roundsInGroup;
    }

    totalGroupMatches += groupMatches;

    const groupLetter = String.fromCharCode(65 + i); // A, B, C...
    groups.push({
      groupIndex: i,
      name: `Poule ${groupLetter}`,
      participantCount: pInGroup,
      matchCount: groupMatches,
      roundRobinRounds: matchType === "HOME_AWAY" ? roundsInGroup * 2 : roundsInGroup,
    });
  }

  const roundsSummary: RoundSummary[] = [];
  const effectiveRounds = matchType === "HOME_AWAY" ? maxRounds * 2 : maxRounds;
  for (let r = 1; r <= effectiveRounds; r++) {
    roundsSummary.push({
      round: r,
      name: `Journée ${r}`,
      matchesCount: Math.ceil(totalGroupMatches / effectiveRounds),
    });
  }

  return {
    format,
    totalParticipants: participantCount,
    totalMatches: totalGroupMatches,
    totalRounds: effectiveRounds,
    byesCount: 0,
    groups,
    roundsSummary,
  };
}
