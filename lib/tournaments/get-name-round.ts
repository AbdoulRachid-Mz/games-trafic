// @/lib/tournaments/get-name-round.ts

/**
 * Automate le nommage des rounds pour les phases à élimination directe
 */
export function getRoundName(round: number, totalRounds: number, matchesInRound: number): string {
  if (round === totalRounds) return "Finale";
  if (round === totalRounds - 1) return "1/2 Finale";
  if (round === totalRounds - 2) return "1/4 Finale";
  
  // Naming based on match count (standard bracket)
  if (matchesInRound === 1) return "Finale";
  if (matchesInRound === 2) return "1/2 Finale";
  if (matchesInRound === 4) return "1/4 Finale";
  if (matchesInRound === 8) return "1/8 Finale";
  if (matchesInRound === 16) return "1/16 Finale";
  
  return `Round ${round}`;
}