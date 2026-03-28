import { Match } from "./types";

export function resolveMatch(match: Match): Match {
  if (
    match.score1 == null ||
    match.score2 == null ||
    !match.playerA ||
    !match.playerB
  ) {
    return match;
  }

  const winner =
    match.score1 > match.score2
      ? match.playerA
      : match.playerB;

  return {
    ...match,
    winnerRegistrationId: winner.id,
  };
}
