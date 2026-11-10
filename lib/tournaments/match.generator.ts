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

/**
 * Construit le calendrier d'un championnat (Round Robin) :
 * UNE journée (matchday) = un groupe = des confrontations indépendantes
 * (1 node = 1 confrontation à 2 participants).
 *
 * Généré par Circle Method ; participants impairs gérés avec un BYE
 * (la journée concernée a une confrontation de moins et un exempté).
 * En aller-retour, la seconde moitié du calendrier inverse chaque
 * confrontation (retour), les journées sont numérotées en continu.
 *
 * Résultat pur (aucun accès DB) → testable unitairement.
 */
export interface LeagueFixture {
  /** Numéro de journée (1-based, continu en aller-retour). */
  day: number;
  /** Index de la confrontation dans la journée (1-based). */
  fixture: number;
  p1: string | null;
  p2: string | null;
}

export interface LeagueDay {
  day: number;
  fixtures: LeagueFixture[];
  /** Participants exemptés (impair) ce jour-là. */
  byeParticipants: string[];
}

export function buildLeagueCalendar(
  participantIds: string[],
  opts?: { isHomeAway?: boolean }
): LeagueDay[] {
  const generated = generateGroupMatches(
    participantIds.map((id) => ({ id })),
    { returnType: opts?.isHomeAway ? "double" : "single" }
  );

  const days = new Map<number, LeagueDay>();
  for (const m of generated) {
    const day = m.round || 1;
    let d = days.get(day);
    if (!d) {
      d = { day, fixtures: [], byeParticipants: [] };
      days.set(day, d);
    }
    d.fixtures.push({
      day,
      fixture: d.fixtures.length + 1,
      p1: m.participant1?.id ?? null,
      p2: m.participant2?.id ?? null,
    });
  }

  // Les BYE n'arrivent pas jusqu'ici (filtrés dans generateRoundRobinMatches) :
  // les exemptés d'une journée sont donc déduits (participants absents ce jour).
  for (const d of days.values()) {
    if (d.fixtures.length === 0) continue;
    const playing = new Set<string>();
    for (const f of d.fixtures) {
      if (f.p1) playing.add(f.p1);
      if (f.p2) playing.add(f.p2);
    }
    d.byeParticipants = participantIds.filter((id) => !playing.has(id));
  }

  return Array.from(days.values()).sort((a, b) => a.day - b.day);
}
