/**
 * lib/tournaments/config.ts
 *
 * Résolution de la configuration structurante d'un tournoi :
 * advanceCount (top-N qualifiés par groupe), journées (matchday),
 * détection des structures Round Robin héritées.
 *
 * Module pur (aucun accès DB, aucun import serveur) → réutilisable
 * côté lib, actions et tests unitaires.
 */

import { FALLBACK_ADVANCE_COUNT, resolveQualification } from "./qualification";

/** Défaut explicite de qualification par groupe (jamais lu en dur ailleurs). */
export const DEFAULT_ADVANCE_COUNT = FALLBACK_ADVANCE_COUNT;

/** Nom du groupe unique des éditions RR héritées (legacy). */
export const LEGACY_LEAGUE_GROUP_NAME = "Classement";

/**
 * AdvanceCount effectif, priorité : group.config.advanceCount →
 * phase.config.advanceCount → phase.config.advanceFromGroup (legacy,
 * écrit par l'ancien wizard mais jamais lu avant) → editionConfig →
 * défaut du format. Délègue à `resolveQualification` (source unique).
 *
 * Accepte directement les records Drizzle (le config est lu génériquement).
 */
export function getEffectiveAdvanceCount(
  phase?: { config?: unknown; phaseType?: string | null } | null,
  group?: { config?: unknown } | null,
  edition?: { editionConfig?: unknown; config?: unknown } | null,
): number {
  return resolveQualification({ phase, group, edition }).advanceCount;
}

/**
 * Un groupe-journée (matchday) est un groupe d'une phase Round Robin refondue :
 * il porte les confrontations d'une seule journée et ne qualifie JAMAIS ses
 * participants isolément (la qualification est actée à la validation de phase).
 */
export function isMatchdayGroup(
  groupConfig?: Record<string, any> | null
): boolean {
  return groupConfig?.isMatchday === true;
}

/**
 * Ancienne édition Round Robin : groupe unique « Classement » + nodes = journées
 * (metadata.participants = tous les participants). Doivent rester traitées tel
 * quel (aucune migration silencieuse) : classement au niveau du groupe unique.
 */
export function isLegacyLeagueStructure(
  phaseType: string | null | undefined,
  groups: Array<{
    groupType?: string | null;
    config?: unknown;
    name?: string | null;
  }>
): boolean {
  if (phaseType !== "ROUND_ROBIN") return false;
  if (groups.length !== 1) return false;
  const g = groups[0];
  if (g.groupType === "ELIMINATION") return false;
  return !isMatchdayGroup((g.config || {}) as Record<string, any>);
}
