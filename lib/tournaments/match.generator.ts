import { Match, Participant } from "./types";
import { generateId } from "./utils";

/**
 * Vérifie si un match entre participant1 et participant2 existe déjà.
 * Vérifie dans les deux sens (p1 vs p2 ET p2 vs p1).
 * @returns true si doublon détecté
 */
export function checkDuplicateMatch(
  existingMatches: Array<{
    participant1RegistrationId?: string | null;
    participant2RegistrationId?: string | null;
    id?: string;
  }>,
  p1Id: string,
  p2Id: string
): boolean {
  return existingMatches.some(
    (m) =>
      (m.participant1RegistrationId === p1Id &&
        m.participant2RegistrationId === p2Id) ||
      (m.participant1RegistrationId === p2Id &&
        m.participant2RegistrationId === p1Id)
  );
}

export function generateRoundRobinMatches(
  participants: Participant[]
): Match[] {
  const matches: Match[] = [];
  let round = 1;

  for (let i = 0; i < participants.length; i++) {
    for (let j = i + 1; j < participants.length; j++) {
      matches.push({
        id: generateId("match"),
        playerA: participants[i],
        playerB: participants[j],
        round,
      });
      round++;
    }
  }

  return matches;
}

export function generateEliminationMatches(
  participants: Participant[],
  currentRound: number
): Match[] {
  const matches: Match[] = [];

  for (let i = 0; i < participants.length; i += 2) {
    const playerA = participants[i];
    const playerB = participants[i + 1];
    matches.push({
      id: generateId("match"),
      playerA,
      playerB,
      round: currentRound,
    });
  }

  return matches;
}

/**
 * Génère les matchs aller-retour entre tous les participants.
 * Chaque paire joue deux fois (A vs B ET B vs A).
 */
export function generateHomeAwayMatches(participants: Participant[]): Match[] {
  const matches: Match[] = [];
  let round = 1;

  for (let i = 0; i < participants.length; i++) {
    for (let j = 0; j < participants.length; j++) {
      if (i === j) continue;
      matches.push({
        id: generateId("match"),
        playerA: participants[i],
        playerB: participants[j],
        round,
      });
      round++;
    }
  }

  return matches;
}
