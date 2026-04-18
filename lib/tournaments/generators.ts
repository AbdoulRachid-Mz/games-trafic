import { db } from "@/lib/db";
import { 
  tournamentPhases, 
  phaseGroups, 
  phaseGroupParticipants, 
  bracketNodes, 
  matches 
} from "@/database/schema";
import { eq, and, sql } from "drizzle-orm";
import { shuffle, chunk } from "./utils";
import { generateGroupMatches } from "./match.generator";

/**
 * Helper to identify if an ID is a structural placeholder (e.g. QUALIFIER_1, WINNER) 
 * instead of a real UUID from edition_registrations.
 */
function isPlaceholder(id: string | null): boolean {
  if (!id) return true;
  return id.startsWith("QUALIFIER_") || id.startsWith("WINNER") || id.includes("-") === false;
}

// GeneratorOptions
export interface GeneratorOptions {
  generateGroups?: boolean;
  generateNodes?: boolean;
  generateMatches?: boolean;
  isHomeAway?: boolean;
  nodePrefix?: string;
}

/**
 * Set up a League (Round Robin) phase
 */
export async function setupLeaguePhase(
  tx: any,
  editionId: string,
  phase: any,
  participantRegIds: string[],
  options: GeneratorOptions
) {
  const groupName = "Classement";
  const [group] = await tx
    .insert(phaseGroups)
    .values({
      phaseId: phase.id,
      name: groupName,
      order: 0,
      participantCount: participantRegIds.length,
      groupType: 'ROUND_ROBIN',
      config: {
        isHomeAway: options.isHomeAway || false,
        generateMatches: options.generateMatches !== false,
        nodePrefix: options.nodePrefix || "Journée",
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  // Assign participants
  for (const regId of participantRegIds) {
    await tx.insert(phaseGroupParticipants).values({
      groupId: group.id,
      registrationId: regId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  if (options.generateNodes !== false) {
    const roundsCount = participantRegIds.length % 2 === 0 
      ? participantRegIds.length - 1 
      : participantRegIds.length;
    
    const matchesPerRound = Math.floor(participantRegIds.length / 2);
    const returnType = options.isHomeAway ? 'double' : 'single';
    const allMatches = generateGroupMatches(participantRegIds.map(id => ({ id })), { returnType });

    for (let round = 1; round <= (options.isHomeAway ? roundsCount * 2 : roundsCount); round++) {
      const startIdx = (round - 1) * matchesPerRound;
      const roundMatches = allMatches.slice(startIdx, startIdx + matchesPerRound);
      const nodePrefix = options.nodePrefix || "Journée";

      const [node] = await tx.insert(bracketNodes).values({
        phaseId: phase.id,
        groupId: group.id,
        nodeCode: `L-R${round}`,
        round,
        matchNumber: round,
        order: round,
        metadata: {
          participants: participantRegIds,
          name: `${nodePrefix} ${round}`,
          generateMatches: options.generateMatches !== false,
          matchesCount: roundMatches.length,
          format: 'BEST_OF_1',
          nodeType: 'ROUND_ROBIN'
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      if (options.generateMatches !== false) {
        for (const [idx, m] of roundMatches.entries()) {
          await tx.insert(matches).values({
            editionId,
            phaseId: phase.id,
            groupId: group.id,
            bracketNodeId: node.id,
            participant1RegistrationId: m.participant1?.id,
            participant2RegistrationId: m.participant2?.id,
            matchCode: `${node.nodeCode}-M${idx + 1}`,
            status: 'PENDING',
            round,
            matchNumber: idx + 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      }
    }
  }
}

/**
 * Set up a Group Stage phase
 */
export async function setupGroupPhase(
  tx: any,
  editionId: string,
  phase: any,
  participantRegIds: string[],
  options: GeneratorOptions & { groupsCount?: number; participantsPerGroup?: number }
) {
  const workingRegIds = options.nodePrefix === 'RANDOM' ? shuffle([...participantRegIds]) : [...participantRegIds];
  let groupsChunks = [];
  let finalGroupsCount = 1;

  if (options.groupsCount && options.groupsCount > 0) {
    const maxAllowedGroups = Math.max(1, Math.floor(workingRegIds.length / 2));
    finalGroupsCount = Math.min(options.groupsCount, maxAllowedGroups);
    const dynamicGroupSize = Math.ceil(workingRegIds.length / finalGroupsCount);
    groupsChunks = chunk(workingRegIds, Math.max(2, dynamicGroupSize));
    
    if (groupsChunks.length > finalGroupsCount) {
      const overflow = groupsChunks.splice(finalGroupsCount - 1);
      groupsChunks[finalGroupsCount - 1] = overflow.flat();
    }
  } else {
    const groupSize = options.participantsPerGroup || 4;
    groupsChunks = chunk(workingRegIds, Math.max(2, groupSize));
    finalGroupsCount = groupsChunks.length;
  }

  const createdGroups = [];

  for (let i = 0; i < finalGroupsCount; i++) {
    const players = groupsChunks[i];
    const groupName = `Groupe ${String.fromCharCode(65 + i)}`;

    const [group] = await tx
      .insert(phaseGroups)
      .values({
        phaseId: phase.id,
        name: groupName,
        order: i,
        participantCount: players.length,
        groupType: 'STANDARD',
        config: {
          isHomeAway: options.isHomeAway || false,
          generateMatches: options.generateMatches !== false,
          nodePrefix: options.nodePrefix || "Poule",
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    createdGroups.push(group);

    // Assign participants
    for (const regId of players) {
      await tx.insert(phaseGroupParticipants).values({
        groupId: group.id,
        registrationId: regId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    if (options.generateNodes !== false) {
      const participantCount = players.length;
      const totalMatches = (participantCount * (participantCount - 1)) / 2;
      const returnType = options.isHomeAway ? 'double' : 'single';
      
      const [node] = await tx.insert(bracketNodes).values({
        phaseId: phase.id,
        groupId: group.id,
        nodeCode: `${groupName.slice(0, 3).toUpperCase()}-Poule`,
        round: 1,
        matchNumber: i + 1,
        order: i,
        metadata: {
          participants: players,
          name: groupName,
          generateMatches: options.generateMatches !== false,
          matchesCount: options.isHomeAway ? totalMatches * 2 : totalMatches,
          format: 'BEST_OF_1',
          nodeType: 'GROUP_STAGE'
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      if (options.generateMatches !== false) {
        const generated = generateGroupMatches(players.map(id => ({ id })), { returnType });
        for (const [idx, m] of generated.entries()) {
          await tx.insert(matches).values({
            editionId,
            phaseId: phase.id,
            groupId: group.id,
            bracketNodeId: node.id,
            participant1RegistrationId: m.participant1?.id,
            participant2RegistrationId: m.participant2?.id,
            matchCode: `${node.nodeCode}-M${idx + 1}`,
            status: 'PENDING',
            round: m.round || 1,
            matchNumber: idx + 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      }
    }
  }

  return createdGroups;
}

/**
 * Set up an Elimination (Bracket) phase
 */
export async function setupBracketPhase(
  tx: any,
  editionId: string,
  phase: any,
  participantRegIds: string[],
  options: GeneratorOptions
) {
  const workingRegIds = [...participantRegIds];
  const participantCount = workingRegIds.length;
  
  // Power of 2 logic for brackets
  // For 20 participants, if it's the second phase after groups:
  // Usually this is called with the qualifiers (e.g. 8 participants)
  const totalRounds = Math.ceil(Math.log2(participantCount || 2));
  const totalNodesInFullBracket = Math.pow(2, totalRounds) - 1;
  let matchCounter = 1;

  for (let round = 1; round <= totalRounds; round++) {
    // Number of matches in this round
    // Round 1: pow(2, totalRounds - 1)
    // Round 2: pow(2, totalRounds - 2)
    const matchesThisRound = Math.pow(2, totalRounds - round);
    const nodePrefix = options.nodePrefix || "Round";

    for (let i = 0; i < matchesThisRound; i++) {
      // For round 1, we might have initial participants
      const p1 = round === 1 ? workingRegIds[i * 2] || null : null;
      const p2 = round === 1 ? workingRegIds[i * 2 + 1] || null : null;

      const [node] = await tx.insert(bracketNodes).values({
        phaseId: phase.id,
        nodeCode: `R${round}-M${i + 1}`,
        round,
        matchNumber: matchCounter++,
        bracketType: 'UPPER',
        order: matchCounter,
        metadata: {
          participants: [p1, p2].filter(Boolean),
          requiresMatch: true,
          generateMatches: options.generateMatches !== false,
          matchesCount: 1,
          format: 'BEST_OF_1'
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      if (options.generateMatches !== false && p1 && p2 && !isPlaceholder(p1) && !isPlaceholder(p2)) {
        const matchesToCreate = options.isHomeAway ? 2 : 1;
        for (let mIdx = 0; mIdx < matchesToCreate; mIdx++) {
          await tx.insert(matches).values({
            editionId,
            phaseId: phase.id,
            bracketNodeId: node.id,
            participant1RegistrationId: mIdx === 0 ? p1 : p2, // Swap for home/away
            participant2RegistrationId: mIdx === 0 ? p2 : p1,
            matchCode: matchesToCreate > 1 ? `${node.nodeCode}-A${mIdx + 1}` : `${node.nodeCode}`,
            status: 'PENDING',
            round,
            matchNumber: i + 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      }
    }
  }
}

/**
 * Set up a Swiss phase
 */
export async function setupSwissPhase(
  tx: any,
  editionId: string,
  phase: any,
  participantRegIds: string[],
  options: GeneratorOptions & { roundsCount?: number }
) {
  const roundsCount = options.roundsCount || 5;
  const nodePrefix = options.nodePrefix || "Round";

  for (let round = 1; round <= roundsCount; round++) {
    const [node] = await tx.insert(bracketNodes).values({
      phaseId: phase.id,
      nodeCode: `S-R${round}`,
      round,
      matchNumber: round,
      order: round,
      metadata: {
        participants: round === 1 ? participantRegIds : [],
        name: `${nodePrefix} ${round}`,
        generateMatches: options.generateMatches !== false,
        matchesCount: Math.floor(participantRegIds.length / 2),
        format: 'BEST_OF_1',
        nodeType: 'SWISS'
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    // Swiss matches beyond round 1 are usually generated after each round results
    if (round === 1 && options.generateMatches !== false) {
      const workingRegIds = shuffle([...participantRegIds]);
      const matchPairs = chunk(workingRegIds, 2);
      
      for (const [idx, pair] of matchPairs.entries()) {
        if (pair.length < 2) continue;
        
        const p1 = pair[0];
        const p2 = pair[1];

        // Skip if placeholders are present (foreign key constraint)
        if (isPlaceholder(p1) || isPlaceholder(p2)) continue;

        await tx.insert(matches).values({
          editionId,
          phaseId: phase.id,
          bracketNodeId: node.id,
          participant1RegistrationId: p1,
          participant2RegistrationId: p2,
          matchCode: `${node.nodeCode}-M${idx + 1}`,
          status: 'PENDING',
          round: 1,
          matchNumber: idx + 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }
  }
}
