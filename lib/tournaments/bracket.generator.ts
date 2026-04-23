import { generateEliminationMatches } from "./match.generator";
import { Bracket, BracketNode, MatchType, Participant } from "./types";
import { generateId, shuffle } from "./utils";

/**
 * @deprecated Utilisez setupEliminationGroups dans phases.ts à la place
 * Cette fonction est conservée pour compatibilité avec le mode MANUAL.
 */
export function generateSingleEliminationBracket(
  participants: Participant[]
): Bracket {
  console.warn("[DEPRECATED] generateSingleEliminationBracket is deprecated. Use setupEliminationGroups instead.");
  
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
      metadata: {
        participants: [match.playerA?.id, match.playerB?.id].filter(Boolean) as string[],
        name: `Node R${currentRound}`,
        generateMatches: true,
        matchesCount: 1,
        format: 'SINGLE' as MatchType
      }
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