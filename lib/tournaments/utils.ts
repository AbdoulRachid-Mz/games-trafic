/**
 * Fisher-Yates avec source aléatoire Web Crypto (disponible côté serveur et
 * navigateur). Remplace l'ancien `sort(() => Math.random() - 0.5)`, biaisé et
 * interdit par les règles du projet.
 */
export function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const random = new Uint32Array(1);
    crypto.getRandomValues(random);
    const j = random[0] % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
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

export const getDefaultScheduledTime = (round: number, matchIndex: number): Date => {
  const now = new Date();
  // Ajouter N jours selon le round (ex: round 1 = jour 0, round 2 = +7 jours, etc.)
  const daysToAdd = (round - 1) * 7;
  const defaultDate = new Date(now);
  defaultDate.setDate(now.getDate() + daysToAdd);
  defaultDate.setHours(19, 0, 0, 0); // 19h par défaut
  return defaultDate;
};
