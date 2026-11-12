// lib/tournaments/edition-cover.ts

export const DEFAULT_TOURNAMENT_COVER = "/icons/tournament-500.png";

type MaybeImage = {
  coverImage?: string | null;
  bannerImage?: string | null;
  banner?: string | null;
  thumbnail?: string | null;
  thumbnailUrl?: string | null;
  profileImage?: string | null;
};

function firstValid(...values: Array<string | null | undefined>): string | null {
  for (const value of values) {
    if (typeof value !== "string") continue;
    const trimmed = value.trim();
    if (trimmed.length === 0) continue;
    if (trimmed === "null" || trimmed === "undefined") continue;
    return trimmed;
  }
  return null;
}

/**
 * Résolution de l'image de couverture d'une édition, dans l'ordre :
 * 1. image propre à l'édition (si le schéma en expose une un jour) ;
 * 2. image de couverture du tournoi ;
 * 3. image de profil / bannière du tournoi ;
 * 4. visuel de secours local (jamais d'image cassée).
 */
export function resolveEditionCover(
  edition: MaybeImage | null | undefined,
  tournament: MaybeImage | null | undefined,
  fallback: string = DEFAULT_TOURNAMENT_COVER,
): string {
  return (
    firstValid(
      edition?.coverImage,
      edition?.bannerImage,
      edition?.banner,
      edition?.thumbnail,
      edition?.thumbnailUrl,
    ) ??
    firstValid(
      tournament?.coverImage,
      tournament?.bannerImage,
      tournament?.banner,
      tournament?.thumbnail,
      tournament?.thumbnailUrl,
    ) ??
    firstValid(tournament?.profileImage, edition?.profileImage) ??
    fallback
  );
}
