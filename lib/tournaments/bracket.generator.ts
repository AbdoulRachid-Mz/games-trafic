import { generateEliminationMatches } from "./match.generator";
import { Bracket, BracketNode, Participant } from "./types";
import { generateId, shuffle } from "./utils";

export function generateSingleEliminationBracket(
  participants: Participant[]
): Bracket {
  const shuffled = shuffle(participants);
  const nodes: BracketNode[] = [];

  let currentRound = 1;
  let currentPlayers = shuffled;

  while (currentPlayers.length > 1) {
    const matches = generateEliminationMatches(currentPlayers, currentRound);

    const roundNodes = matches.map(match => ({
      id: generateId("node"),
      round: currentRound,
      match,
    }));

    nodes.push(...roundNodes);

    currentPlayers = matches.map(
      m => ({ id: `winner_${m.id}`, name: "TBD", status: "PENDING" })
    );

    currentRound++;
  }

  return {
    id: generateId("bracket"),
    type: "SINGLE_ELIMINATION",
    nodes,
  };
}
