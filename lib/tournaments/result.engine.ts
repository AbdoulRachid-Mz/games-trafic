import { Match } from "./types";

export function resolveMatch(match: Match): Match {
  if (
    match.scoreA == null ||
    match.scoreB == null ||
    !match.playerA ||
    !match.playerB
  ) {
    return match;
  }

  const winner =
    match.scoreA > match.scoreB
      ? match.playerA
      : match.playerB;

  return {
    ...match,
    winnerId: winner.id,
  };
}
