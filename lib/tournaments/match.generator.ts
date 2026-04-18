import { Match, Participant } from "./types";
import { generateId } from "./utils";

/**
 * Vérifie si un match entre participant1 et participant2 existe déjà.
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

/**
 * Génère les matchs de type Round Robin en utilisant l'algorithme du ruban (Circle Method).
 */
export function generateRoundRobinMatches(
  participants: any[]
): any[] {
  const n = participants.length;
  if (n < 2) return [];

  const players = [...participants];
  if (n % 2 !== 0) {
    players.push({ id: "BYE", name: "Exempt" });
  }

  const numRounds = players.length - 1;
  const half = players.length / 2;
  const matches = [];

  for (let round = 1; round <= numRounds; round++) {
    for (let i = 0; i < half; i++) {
      const p1 = players[i];
      const p2 = players[players.length - 1 - i];

      if (p1.id !== "BYE" && p2.id !== "BYE") {
        matches.push({
          participant1: p1,
          participant2: p2,
          round,
        });
      }
    }

    // Rotate
    const last = players.pop()!;
    players.splice(1, 0, last);
  }

  return matches;
}

/**
 * Génère les matchs de groupe avec option Aller Simple ou Aller-Retour.
 */
export function generateGroupMatches(
  participants: any[],
  opts?: { returnType?: "single" | "double" }
) {
  const firstHalf = generateRoundRobinMatches(participants);
  let allMatches = [...firstHalf];

  if (opts?.returnType === "double") {
    const numFirstHalfRounds = Math.max(...firstHalf.map(m => m.round), 0);
    const secondHalf = firstHalf.map(m => ({
      ...m,
      participant1: m.participant2,
      participant2: m.participant1,
      round: m.round + numFirstHalfRounds
    }));
    allMatches = [...allMatches, ...secondHalf];
  }
    
  return allMatches;
}

/**
 * Génère les matchs d'élimination directe pour un tour donné.
 */
export function generateEliminationMatches(
  participants: any[],
  currentRound: number
): any[] {
  const matches = [];

  for (let i = 0; i < participants.length; i += 2) {
    const p1 = participants[i];
    const p2 = participants[i + 1] || null;
    
    matches.push({
      participant1: p1,
      participant2: p2,
      round: currentRound,
    });
  }

  return matches;
}
