/**
 * lib/tournaments/scoring.ts
 *
 * Configuration de scoring centralisée (points victoire/nul/défaite).
 * Hiérarchie : group.config → phase.config → défauts explicites.
 *
 * Distinction importante : une valeur explicite (number, y compris 0)
 * écrase toujours le défaut ; un défaut n'est appliqué QUE si la valeur
 * est absente ou non numérique. On n'écrase jamais la config utilisateur.
 */

export interface ScoringConfig {
  pointsPerWin: number;
  pointsPerDraw: number;
  pointsPerLoss: number;
}

/** Défauts métier explicites (3/1/0). */
export const SCORING_DEFAULTS: ScoringConfig = {
  pointsPerWin: 3,
  pointsPerDraw: 1,
  pointsPerLoss: 0,
};

export const TIEBREAKER_DEFAULTS = ["POINTS", "GOAL_DIFF", "GOALS_FOR"];

/**
 * Défaut par niveau avec distinction « absent / invalide » vs
 * « explicitement fixé » (0 est une valeur valide, pas un défaut).
 */
export function pickScoreValue(
  explicitValue: unknown,
  fallback: number
): number {
  if (typeof explicitValue === "number" && !isNaN(explicitValue)) {
    return explicitValue;
  }
  if (
    typeof explicitValue === "string" &&
    explicitValue.trim() !== "" &&
    !isNaN(Number(explicitValue))
  ) {
    return Number(explicitValue);
  }
  return fallback;
}

/**
 * Résout le scoring effectif :
 * - priorité au group.config (hérité de la phase lors de la création,
 *   mais l'UI peut ajuster groupe par groupe) ;
 * - sinon phase.config ;
 * - sinon défauts 3/1/0.
 */
export function resolveScoring(
  phaseConfig?: Record<string, any> | null,
  groupConfig?: Record<string, any> | null
): ScoringConfig {
  return {
    pointsPerWin: pickScoreValue(
      groupConfig?.pointsPerWin,
      pickScoreValue(phaseConfig?.pointsPerWin, SCORING_DEFAULTS.pointsPerWin)
    ),
    pointsPerDraw: pickScoreValue(
      groupConfig?.pointsPerDraw,
      pickScoreValue(phaseConfig?.pointsPerDraw, SCORING_DEFAULTS.pointsPerDraw)
    ),
    pointsPerLoss: pickScoreValue(
      groupConfig?.pointsPerLoss,
      pickScoreValue(phaseConfig?.pointsPerLoss, SCORING_DEFAULTS.pointsPerLoss)
    ),
  };
}

/** Fusionne le scoring de la phase vers la config d'un groupe héritier. */
export function inheritScoringToGroup(
  phaseConfig?: Record<string, any> | null,
  groupExtra?: Record<string, any> | null
): Record<string, any> {
  const resolved = resolveScoring(phaseConfig);
  return {
    ...(groupExtra ?? {}),
    pointsPerWin: resolved.pointsPerWin,
    pointsPerDraw: resolved.pointsPerDraw,
    pointsPerLoss: resolved.pointsPerLoss,
  };
}

/**
 * Détermine si un match est décomptable pour le classement :
 * COMPLETED/FINISHED, ou AWAITING_ADMIN_CONFIRMATION (final côté moteur).
 */
export function isMatchCountable(matchLike: {
  status?: string | null;
  confirmedByAdmin?: boolean | null;
}): boolean {
  if (!matchLike) return false;
  const status = matchLike.status;
  if (status === "COMPLETED" || status === "FINISHED") return true;
  if (status === "AWAITING_ADMIN_CONFIRMATION") return true;
  // PENDING_REVIEW uniquement s'il a déjà été confirmé en base.
  return status === "PENDING_REVIEW" && !!matchLike.confirmedByAdmin;
}
