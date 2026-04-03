export function shuffle<T>(array: T[]): T[] {
  return [...array].sort(() => Math.random() - 0.5);
}

export function chunk<T>(array: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

export function generateId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

/**
 * Utility to get professional round naming for brackets
 * @param roundIndex 0-indexed round number
 * @param totalRounds total number of rounds in the phase
 */
export function getRoundLabel(roundIndex: number, totalRounds: number): string {
  const distanceToFinal = totalRounds - roundIndex - 1;
  
  if (distanceToFinal === 0) return "Finale";
  if (distanceToFinal === 1) return "Demi-finale";
  if (distanceToFinal === 2) return "Quart de finale";
  
  // For others: 1/8, 1/16, 1/32...
  const pow = Math.pow(2, distanceToFinal + 1);
  return `1/${pow} finale`;
}
