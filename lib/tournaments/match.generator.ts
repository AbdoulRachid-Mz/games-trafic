import { Match, Participant } from "./types";
import { generateId } from "./utils";

export function generateRoundRobinMatches(
  participants: Participant[]
): Match[] {
  const matches: Match[] = [];
  let round = 1;

  for (let i = 0; i < participants.length; i++) {
    for (let j = i + 1; j < participants.length; j++) {
      matches.push({
        id: generateId("match"),
        playerA: participants[i],
        playerB: participants[j],
        round,
      });
      round++;
    }
  }

  return matches;
}

export function generateEliminationMatches(participants: Participant[], currentRound: number): Match[] {
  const matches: Match[] = [];

  for (let i = 0; i < participants.length; i += 2) {
    const playerA = participants[i];
    const playerB = participants[i + 1];
    matches.push({
      id: generateId("match"),
      playerA,
      playerB,
      round: currentRound,
    });
  }

  return matches;
}

