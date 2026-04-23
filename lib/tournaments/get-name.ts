// @/lib/tournaments/get-name.ts

/**
 * Retourne le nom d'un round d'élimination basé sur le nombre de participants
 */
export function getEliminationRoundName(participantCount: number): string {
  switch (participantCount) {
    case 2:
      return "Finale";
    case 4:
      return "Demi-finale";
    case 8:
      return "Quart de finale";
    case 16:
      return "Huitième de finale";
    case 32:
      return "Seizième de finale";
    case 64:
      return "Trente-deuxième de finale";
    default:
      return `Top ${participantCount}`;
  }
}

// ============================================================================
// FONCTIONS D'AFFICHAGE type edition
export function getTypeName(type: string): string {
  const upperType = type.toUpperCase();
  switch (upperType) {
    case "ELIMINATION":
      return "Élimination";
    case "GROUP_STAGE":
      return "Phase de groupes";
    case "ROUND_ROBIN":
      return "Round-robin";
    case "SWISS":
      return "Suisse";
    case "KNOCKOUT":
      return "Knock-out";
    case "CUSTOM":
      return "Personnalisé";
    default:
      return type;
  }
}

/**
 * Retourne le nom d'un round basé sur le round number et le total de rounds
 * Pour usage dans les brackets
 */
export function getRoundName(round: number, totalRounds: number): string {
  const distanceToFinal = totalRounds - round;
  
  if (distanceToFinal === 0) return "Finale";
  if (distanceToFinal === 1) return "Demi-finale";
  if (distanceToFinal === 2) return "Quart de finale";
  if (distanceToFinal === 3) return "Huitième de finale";
  if (distanceToFinal === 4) return "Seizième de finale";
  
  return `Round ${round}`;
}

/**
 * Retourne le nom d'un groupe basé sur sa position
 */
export function getGroupName(index: number, prefix: string = "Groupe"): string {
  return `${prefix} ${String.fromCharCode(65 + index)}`;
}

/**
 * Retourne le nom d'un nœud (match) basé sur son round et son index
 */
export function getNodeName(round: number, matchIndex: number, totalRounds: number): string {
  const roundName = getRoundName(round, totalRounds);
  return `${roundName} - Match ${matchIndex + 1}`;
}