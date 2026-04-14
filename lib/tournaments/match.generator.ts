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

/**
 * Génère les matchs de type Round Robin en utilisant l'algorithme du ruban (Circle Method).
 * Cela permet de grouper les matchs par "Journées" où chaque participant joue au plus une fois.
 */
export function generateRoundRobinMatches(
  participants: Participant[]
): Match[] {
  const matches: Match[] = [];
  const n = participants.length;
  if (n < 2) return [];

  const players = [...participants];
  if (n % 2 !== 0) {
    players.push({ id: "BYE", name: "Exempt", status: "PENDING" });
  }

  const numRounds = players.length - 1;
  const half = players.length / 2;

  for (let round = 1; round <= numRounds; round++) {
    for (let i = 0; i < half; i++) {
      const p1 = players[i];
      const p2 = players[players.length - 1 - i];

      if (p1.id !== "BYE" && p2.id !== "BYE") {
        matches.push({
          id: generateId("match"),
          playerA: p1,
          playerB: p2,
          round,
        });
      }
    }

    // Faire tourner les joueurs (garder le premier fixe)
    const last = players.pop()!;
    players.splice(1, 0, last);
  }

  return matches;
}

/**
 * Génère les matchs de groupe avec option Aller Simple ou Aller-Retour.
 * Groupé par journées.
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
      id: generateId("match"),
      playerA: m.playerB,
      playerB: m.playerA,
      round: m.round + numFirstHalfRounds
    }));
    allMatches = [...allMatches, ...secondHalf];
  }
    
  // Map .playerA to .participant1 to match the expected output
  return allMatches.map((m) => ({
    ...m,
    participant1: m.playerA,
    participant2: m.playerB,
  }));
}

/**
 * Génère les matchs d'élimination directe pour un tour donné.
 */
export function generateEliminationMatches(
  participants: Participant[],
  currentRound: number
): Match[] {
  const matches: Match[] = [];

  for (let i = 0; i < participants.length; i += 2) {
    const playerA = participants[i];
    const playerB = participants[i + 1] || null; // Gérer les BYE si impaire
    
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
 * Système Suisse : Initialisation (Seeding)
 * En mode Suisse, les rounds suivants sont générés dynamiquement après chaque round.
 * Ici on fournit juste la base pour le premier round.
 */
export function generateSwissFirstRound(participants: Participant[]): Match[] {
  // Similaire à un round de tournoi mais basé sur le rang
  return generateEliminationMatches(participants, 1);
}

/**
 * Génère les matchs aller-retour (Ancienne méthode, conservée pour compatibilité si besoin mais dépréciée par generateGroupMatches)
 */
export function generateHomeAwayMatches(participants: Participant[]): Match[] {
  return generateGroupMatches(participants, { returnType: "double" }).map(m => ({
    ...m,
    playerA: (m as any).participant1,
    playerB: (m as any).participant2,
  }));
}
