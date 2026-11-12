/**
 * lib/tournaments/scheduling.ts
 *
 * Programmation d'un match — source de vérité unique.
 *
 * Le modèle actuel stocke :
 *  - `scheduledTime`      : début planifié du match
 *  - `estimatedDuration`  : durée planifiée (minutes) → fin = début + durée
 *  - `actualStartTime` / `actualEndTime` / `duration` : exécution réelle
 *
 * Une programmation est « valide » si elle possède un début exploitable, une
 * durée strictement positive et donc une fin postérieure au début. Une
 * programmation valide n'est JAMAIS remplacée. Sinon on en crée une à partir
 * d'une référence temporelle UNIQUE (`now`), avec la durée configurée si elle
 * existe, sinon 20 minutes par défaut.
 *
 * Module PUR → testable et utilisable dans les transactions serveur.
 */

export const DEFAULT_MATCH_DURATION_MINUTES = 20;

export interface MatchScheduleInput {
  scheduledTime?: Date | string | null;
  estimatedDuration?: number | null;
}

export interface ResolvedMatchSchedule {
  scheduledTime: Date;
  estimatedDuration: number;
  scheduledEnd: Date;
  /** true si la programmation existante était valide et a été conservée. */
  preserved: boolean;
}

export interface ScheduleOptions {
  /** Durée fournie par la phase / l'édition / la discipline. */
  configuredDuration?: number | null;
  /** Référence temporelle unique (défaut : maintenant). */
  now?: Date;
}

function toValidDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toPositiveMinutes(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? Math.round(value)
    : null;
}

/** Valide une programmation (début + durée + fin cohérente). */
export function isMatchScheduleValid(
  input: MatchScheduleInput | null | undefined,
): boolean {
  if (!input) return false;
  const start = toValidDate(input.scheduledTime);
  const duration = toPositiveMinutes(input.estimatedDuration);
  if (!start || !duration) return false;
  return start.getTime() + duration * 60_000 > start.getTime();
}

/**
 * Résout la programmation effective d'un match.
 * - programmation valide → conservée telle quelle
 * - sinon → début = now (référence unique), durée = configurée ou 20 min
 */
export function resolveMatchSchedule(
  current: MatchScheduleInput | null | undefined,
  options: ScheduleOptions = {},
): ResolvedMatchSchedule {
  const now = options.now ?? new Date();

  if (isMatchScheduleValid(current)) {
    const scheduledTime = toValidDate(current!.scheduledTime)!;
    const estimatedDuration = toPositiveMinutes(current!.estimatedDuration)!;
    return {
      scheduledTime,
      estimatedDuration,
      scheduledEnd: new Date(
        scheduledTime.getTime() + estimatedDuration * 60_000,
      ),
      preserved: true,
    };
  }

  const estimatedDuration =
    toPositiveMinutes(options.configuredDuration) ??
    toPositiveMinutes(current?.estimatedDuration) ??
    DEFAULT_MATCH_DURATION_MINUTES;

  // Un début existant mais sans durée exploitable est conservé : on ne
  // remplace pas une information de planification réelle.
  const existingStart = toValidDate(current?.scheduledTime);
  const scheduledTime = existingStart ?? now;

  return {
    scheduledTime,
    estimatedDuration,
    scheduledEnd: new Date(scheduledTime.getTime() + estimatedDuration * 60_000),
    preserved: false,
  };
}
