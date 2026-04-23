import { Group, Participant, Match } from "./types";
import { chunk, generateId, shuffle } from "./utils";
import { generateRoundRobinMatches } from "./match.generator";

interface GenerateGroupsOptions {
  groupCount?: number;
  playersPerGroup?: number;
  generateMatches?: boolean;
}

/**
 * @note Cette fonction est utilisée principalement en mode MANUAL
 * Pour le mode AUTO, utilisez setupGroupPhase dans generators.ts
 */
export function generateGroups(
  participants: Participant[],
  options: GenerateGroupsOptions
): Group[] {
  const shuffled = shuffle(participants);

  const groupsData =
    options.groupCount
      ? chunk(shuffled, Math.ceil(shuffled.length / options.groupCount))
      : chunk(shuffled, options.playersPerGroup || 4);

  return groupsData.map((players, index) => {
    const matches: Match[] = options.generateMatches
      ? generateRoundRobinMatches(players)
      : [];

    return {
      id: generateId("group"),
      name: `Group ${String.fromCharCode(65 + index)}`,
      participants: players,
      matches,
    };
  });
}