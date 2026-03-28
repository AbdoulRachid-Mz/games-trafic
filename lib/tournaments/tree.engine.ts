import { Bracket } from "./types";

export function propagateWinners(bracket: Bracket): Bracket {
  const nodes = [...bracket.nodes];

  nodes.forEach(node => {
    if (!node.match?.winnerRegistrationId || !node.nextNodeId) return;

    const nextNode = nodes.find(n => n.id === node.nextNodeId);
    if (!nextNode?.match) return;

    if (!nextNode.match.playerA)
      nextNode.match.playerA = node.match.playerA;
    else
      nextNode.match.playerB = node.match.playerA;
  });

  return { ...bracket, nodes };
}
