/**
 * lib/tournaments/qualification.ts
 *
 * Source de vérité UNIQUE pour la qualification d'une phase / d'un groupe.
 *
 * Priorité de résolution (addendum §4) :
 *   1. configuration explicitement définie au niveau du GROUPE
 *   2. configuration explicitement définie au niveau de la PHASE
 *   3. configuration de l'ÉDITION (editionConfig)
 *   4. valeur par défaut du format (CUP / LDC / CHAMPIONSHIP / SWISS / …)
 *
 * Une valeur explicitement définie (`source !== "FORMAT_DEFAULT"`) est
 * distinguée d'une valeur héritée (`inherited === true`). Aucun appelant ne
 * doit réintroduire un `|| 2` local : tout passe par `resolveQualification`.
 *
 * Module PUR (aucun accès DB) → utilisable côté lib, actions, composants et
 * tests unitaires.
 */

export type QualificationSource = "GROUP" | "PHASE" | "EDITION" | "FORMAT_DEFAULT";

/** Nombre de qualifiés par défaut selon le format de compétition. */
export const FORMAT_DEFAULT_ADVANCE_COUNT: Record<string, number> = {
  CUP: 1,
  LDC: 2,
  CHAMPIONSHIP: 2,
  SWISS: 8,
  GROUP_STAGE: 2,
  ROUND_ROBIN: 2,
  KNOCKOUT: 1,
  ELIMINATION: 1,
};

/** Valeur utilisée quand aucun format n'est identifiable. */
export const FALLBACK_ADVANCE_COUNT = 2;

export const DEFAULT_TIEBREAKERS = ["POINTS", "GOAL_DIFF", "GOALS_FOR"];

export interface QualificationResolution {
  /** Nombre de participants qualifiés par groupe (top-N). */
  advanceCount: number;
  /** Niveau qui a fourni la valeur. */
  source: QualificationSource;
  /** true si la valeur n'a pas été définie explicitement (héritage/défaut). */
  inherited: boolean;
  /** Règles de départage effectives (groupe → phase → édition → défaut). */
  tiebreakerRules: string[];
  /** Qualifications transversales (meilleurs deuxièmes, etc.). */
  additionalQualifiers: number;
  /** true si le groupe est une simple journée (aucune qualification isolée). */
  isMatchday: boolean;
  /** Type de phase ayant servi au défaut de format. */
  phaseType?: string | null;
}

export interface QualificationInput {
  group?: { config?: unknown } | null;
  phase?: { config?: unknown; phaseType?: string | null } | null;
  edition?: { editionConfig?: unknown; config?: unknown } | null;
}

function asRecord(value: unknown): Record<string, any> {
  if (!value || typeof value !== "object") return {};
  return value as Record<string, any>;
}

function isPositiveInt(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function readStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const rules = value.filter((rule): rule is string => typeof rule === "string" && rule.length > 0);
  return rules.length > 0 ? rules : null;
}

function readPositiveInt(...values: unknown[]): number | null {
  for (const value of values) {
    if (isPositiveInt(value)) return value;
  }
  return null;
}

export function getFormatDefaultAdvanceCount(
  phaseType?: string | null,
  editionConfig?: Record<string, any>,
): number {
  const competitionType =
    editionConfig?.competitionType || editionConfig?.competitionMode;

  if (phaseType && FORMAT_DEFAULT_ADVANCE_COUNT[phaseType] !== undefined) {
    return FORMAT_DEFAULT_ADVANCE_COUNT[phaseType];
  }
  if (competitionType && FORMAT_DEFAULT_ADVANCE_COUNT[competitionType] !== undefined) {
    return FORMAT_DEFAULT_ADVANCE_COUNT[competitionType];
  }
  return FALLBACK_ADVANCE_COUNT;
}

/**
 * Résout la configuration de qualification effective.
 * Aucune valeur n'est inventée : chaque niveau est testé explicitement.
 */
export function resolveQualification(input: QualificationInput = {}): QualificationResolution {
  const groupConfig = asRecord(input.group?.config);
  const phaseConfig = asRecord(input.phase?.config);
  const editionConfig = asRecord(
    input.edition?.editionConfig ?? input.edition?.config,
  );
  const phaseType = input.phase?.phaseType ?? null;

  const isMatchday = groupConfig.isMatchday === true;

  // 1 → 2 → 3 : valeurs explicitement définies.
  // `advanceFromGroup` est l'alias historique de `advanceCount` (wizard legacy),
  // il n'est lu qu'aux niveaux groupe/phase.
  let advanceCount: number | null = readPositiveInt(groupConfig.advanceCount);
  let source: QualificationSource = "GROUP";

  if (advanceCount === null) {
    advanceCount = readPositiveInt(phaseConfig.advanceCount, phaseConfig.advanceFromGroup);
    source = "PHASE";
  }
  if (advanceCount === null) {
    advanceCount = readPositiveInt(
      editionConfig.advanceCount,
      editionConfig.advanceFromGroup,
      editionConfig.groupsQualifiedCount,
    );
    source = "EDITION";
  }
  if (advanceCount === null) {
    advanceCount = getFormatDefaultAdvanceCount(phaseType, editionConfig);
    source = "FORMAT_DEFAULT";
  }

  const tiebreakerRules =
    readStringArray(groupConfig.tiebreakerRules) ??
    readStringArray(phaseConfig.tiebreakerRules) ??
    readStringArray(editionConfig.tiebreakerRules) ??
    DEFAULT_TIEBREAKERS;

  const additionalQualifiers =
    readPositiveInt(
      groupConfig.additionalQualifiers,
      phaseConfig.additionalQualifiers,
      phaseConfig.bestRunnersUp,
      editionConfig.additionalQualifiers,
      editionConfig.bestRunnersUp,
    ) ?? 0;

  return {
    advanceCount,
    source,
    inherited: source !== "GROUP",
    tiebreakerRules,
    additionalQualifiers,
    isMatchday,
    phaseType,
  };
}

/** Libellé lisible de la provenance de la configuration. */
export function describeQualificationSource(
  resolution: QualificationResolution,
): string {
  switch (resolution.source) {
    case "GROUP":
      return "configuration du groupe";
    case "PHASE":
      return "configuration de la phase";
    case "EDITION":
      return "configuration de l'édition";
    default:
      return `défaut du format${
        resolution.phaseType ? ` ${resolution.phaseType}` : ""
      }`;
  }
}

export interface RankedParticipant {
  registrationId: string;
  stats?: {
    points?: number;
    scoreDifference?: number;
    scoreFor?: number;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface QualificationOutcome {
  qualified: RankedParticipant[];
  eliminated: RankedParticipant[];
  /** Nombre de qualifiés directs (top-N par groupe). */
  advanceCount: number;
  /** Qualifiés transversaux supplémentaires (meilleurs deuxièmes…). */
  additionalQualified: RankedParticipant[];
  messages: string[];
  resolution: QualificationResolution;
}

/**
 * Applique la résolution de qualification à un classement réel.
 * Le résultat (qualifiés/éliminés + textes) provient uniquement du calcul.
 */
export function applyQualificationToRanking(
  ranked: RankedParticipant[],
  resolution: QualificationResolution,
  options: {
    groupName?: string;
    /** Candidats transversaux (non qualifiés directs) triés. */
    additionalCandidates?: RankedParticipant[];
  } = {},
): QualificationOutcome {
  const groupLabel = options.groupName ? `${options.groupName} — ` : "";

  // Une journée Round Robin ne qualifie jamais isolément ses participants.
  if (resolution.isMatchday) {
    return {
      qualified: [],
      eliminated: [...ranked],
      advanceCount: 0,
      additionalQualified: [],
      messages: [
        `${groupLabel}journée terminée : aucune qualification individuelle. Le classement est validé au niveau de la phase.`,
      ],
      resolution,
    };
  }

  const qualified = ranked.slice(0, resolution.advanceCount);
  let eliminated = ranked.slice(resolution.advanceCount);

  const additionalQualified: RankedParticipant[] = [];
  if (resolution.additionalQualifiers > 0) {
    const candidates = options.additionalCandidates ?? eliminated;
    const alreadyQualified = new Set(
      qualified.map((p) => p.registrationId),
    );
    for (const candidate of candidates) {
      if (additionalQualified.length >= resolution.additionalQualifiers) break;
      if (alreadyQualified.has(candidate.registrationId)) continue;
      additionalQualified.push(candidate);
      alreadyQualified.add(candidate.registrationId);
    }
    eliminated = eliminated.filter(
      (p) => !alreadyQualified.has(p.registrationId),
    );
  }

  const source = describeQualificationSource(resolution);
  const messages: string[] = [];

  if (resolution.advanceCount > 0) {
    messages.push(
      `${groupLabel}${qualified.length} participant(s) qualifié(s) via le top ${resolution.advanceCount} (${source}).`,
    );
  }

  if (additionalQualified.length > 0) {
    messages.push(
      `${additionalQualified.length} qualification(s) transversale(s) attribuée(s) au meilleur classement restant.`,
    );
  }

  if (eliminated.length > 0) {
    messages.push(
      `${eliminated.length} participant(s) éliminé(s) à l'issue du classement.`,
    );
  }

  if (qualified.length + additionalQualified.length === 0) {
    messages.push(
      `Aucun participant qualifié : la configuration effective (${source}) ne désigne aucun qualifié.`,
    );
  }

  return {
    qualified,
    eliminated,
    advanceCount: resolution.advanceCount,
    additionalQualified,
    messages,
    resolution,
  };
}

/**
 * Message de résumé après validation d'un résultat de match, basé sur le
 * calcul réel de la phase (et non sur une règle codée en dur).
 */
export function buildResultProgressionMessage(outcome: {
  isNodeComplete?: boolean;
  isGroupComplete?: boolean;
  isPhaseComplete?: boolean;
  isEditionComplete?: boolean;
  qualifiedCount?: number;
  advanceCount?: number;
  nextPhaseName?: string;
  source?: QualificationSource;
}): string | null {
  if (outcome.isEditionComplete) {
    return "L'édition est terminée : le vainqueur final est désigné.";
  }
  if (outcome.isPhaseComplete) {
    const count =
      typeof outcome.qualifiedCount === "number" && outcome.qualifiedCount > 0
        ? ` ${outcome.qualifiedCount} participant(s) qualifié(s)`
        : "";
    const next = outcome.nextPhaseName
      ? ` pour « ${outcome.nextPhaseName} »`
      : "";
    return `Phase terminée.${count}${next}.`;
  }
  if (outcome.isGroupComplete) {
    const count =
      typeof outcome.qualifiedCount === "number"
        ? ` ${outcome.qualifiedCount} participant(s) qualifié(s)`
        : "";
    const rule =
      typeof outcome.advanceCount === "number"
        ? ` (top ${outcome.advanceCount})`
        : "";
    return `Groupe terminé.${count}${rule}.`;
  }
  if (outcome.isNodeComplete) {
    return "Confrontation terminée : le vainqueur progresse dans le bracket.";
  }
  return null;
}
