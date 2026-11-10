import { db } from "@/lib/db";
import { 
  tournamentPhases, 
  phaseGroups, 
  phaseGroupParticipants, 
  bracketNodes, 
  matches 
} from "@/database/schema";
import { eq, and, sql, asc } from "drizzle-orm";
import { shuffle, chunk, getDefaultScheduledTime } from "./utils";
import { buildLeagueCalendar, generateGroupMatches, generateEliminationMatches } from "./match.generator";
import { inheritScoringToGroup } from "./scoring";
import { getEliminationRoundName } from "./get-name";

/**
 * Helper to identify if an ID is a structural placeholder (e.g. QUALIFIER_1, WINNER) 
 * instead of a real UUID from edition_registrations.
 */
export function isPlaceholder(id: string | null): boolean {
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
  matchFormat?: string;
}

/**
 * Set up a League (Round Robin) phase — REFONTE B-2 (Phase 1 PROMPT.md)
 *
 * Nouvelle structure :
 * - groupe = journée (nom configurable, ex. "Journée 1", "Tour 3"…) ;
 * - node = UNE confrontation précise (2 participants) ;
 * - match = une manche (par défaut 1 / node) ;
 * - participants impairs : journée avec un exempt (BYE, aucun node) ;
 * - aller-retour : n journées aller puis n journées retour (confrontations inversées) ;
 * - progression locale : une journée terminée ne qualifie RIEN ;
 *   la qualification n'arrive qu'à la validation de phase
 *   (markPhaseCompleteAction écrit phase.config.qualifiers).
 *
 * Compat : les éditions anciennes (groupe unique « Classement », nodes = journées,
 * metadata.participants = tous) ne passent PAS ici ; elles sont détectées par
 * `isLegacyLeagueEdition` (actions/phases/helpers.ts) et restent traitées tel quel.
 */
export async function setupLeaguePhase(
  tx: any,
  editionId: string,
  phase: any,
  participantRegIds: string[],
  options: GeneratorOptions
) {
  // Calendrier déduit (fonction pure, sans accès DB) ; si l'appelant ne veut
  // PAS de nodes, on ne persiste que le membership phase-échelle.
  const calendar = buildLeagueCalendar(participantRegIds, {
    isHomeAway: options.isHomeAway || false,
  });

  // Nom configurable des journées ("Journée", "Matchday", "Tour"…).
  const dayNamePrefix = options.nodePrefix || "Journée";

  // Scoring hérité phase → groupe (explicite, 3/1/0 par défaut).
  const phaseConfig = (phase.config as any) || {};
  const generateMatches = options.generateMatches !== false;
  const homeAway = options.isHomeAway || false;
  const firstHalfDayCount = homeAway
    ? Math.ceil(calendar.length / 2)
    : calendar.length;

  if (options.generateNodes === false) return;

  for (const day of calendar) {
    // Confrontés de la journée uniquement (2 par confrontation + exemptés).
    const members = Array.from(
      new Set([
        ...day.fixtures.flatMap((f) =>
          [f.p1, f.p2].filter((id): id is string => !!id)
        ),
        ...day.byeParticipants,
      ])
    );

    const groupName = `${dayNamePrefix} ${day.day}`;
    const isLegTwo = homeAway && day.day > firstHalfDayCount;

    const [group] = await tx
      .insert(phaseGroups)
      .values({
        phaseId: phase.id,
        name: groupName,
        // order = index de la journée (0-based) ; le classement de PHASE
        // est fourni par l'agrégation serveur (matches = source de vérité).
        order: day.day - 1,
        participantCount: members.length,
        groupType: "ROUND_ROBIN",
        config: inheritScoringToGroup(phaseConfig, {
          isMatchday: true,
          dayNumber: day.day,
          isLegTwo,
          isHomeAway: homeAway,
          generateMatches,
          fixturesCount: day.fixtures.length,
        }),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Participants de la journée (confrontés + exemptés), jamais tous les
    // participants de la phase : le classement de phase est recalculé
    // depuis les matches, pas depuis ces lignes de journée.
    for (const regId of members) {
      if (isPlaceholder(regId)) continue;
      await tx.insert(phaseGroupParticipants).values({
        groupId: group.id,
        registrationId: regId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // 1 node = 1 confrontation (2 participants, jamais la journée entière).
    for (const [fixtureIdx, fixtureItem] of day.fixtures.entries()) {
      const [node] = await tx
        .insert(bracketNodes)
        .values({
          phaseId: phase.id,
          groupId: group.id,
          nodeCode: `J${day.day}-C${fixtureIdx + 1}`,
          round: day.day,
          matchNumber: fixtureIdx + 1,
          bracketType: "UPPER",
          order: day.day * 100 + (fixtureIdx + 1),
          metadata: {
            participants: [fixtureItem.p1, fixtureItem.p2].filter(Boolean),
            name: `${groupName} — Confrontation ${fixtureIdx + 1}`,
            dayNumber: day.day,
            fixtureIndex: fixtureIdx + 1,
            isLegTwo,
            generateMatches,
            matchesCount: 1,
            format: options.matchFormat || "BEST_OF_1",
            nodeType: "ROUND_ROBIN",
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      if (generateMatches) {
        await tx.insert(matches).values({
          editionId,
          phaseId: phase.id,
          groupId: group.id,
          bracketNodeId: node.id,
          participant1RegistrationId: fixtureItem.p1,
          participant2RegistrationId: fixtureItem.p2,
          matchCode: node.nodeCode,
          status: "PENDING",
          round: day.day,
          matchNumber: fixtureIdx + 1,
          metadata: {
            dayNumber: day.day,
            leg: isLegTwo ? 2 : 1,
          },
          scheduledTime: getDefaultScheduledTime(day.day, fixtureIdx + 1),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
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
    if (players.length > 0) {
      for (const regId of players) {
        await tx.insert(phaseGroupParticipants).values({
          groupId: group.id,
          registrationId: regId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    if (options.generateNodes === false) continue;

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

  return createdGroups;
}

/**
 * Set up an Elimination (Bracket) phase with groups per level
 */
export async function setupEliminationGroups(
  tx: any,
  editionId: string,
  phase: any,
  participantRegIds: string[],
  options: GeneratorOptions
) {
  const workingRegIds = [...participantRegIds];
  const participantCount = workingRegIds.length;
  
  if (options.generateNodes === false) return;

  const totalRounds = Math.ceil(Math.log2(participantCount || 2));
  let matchCounter = 1;
  let previousRoundNodes: any[] = [];
  const allCreatedNodes = [];
  const createdGroups = [];

  // Build tree from Finals down to Round 1
  for (let round = totalRounds; round >= 1; round--) {
    const matchesThisRound = Math.pow(2, totalRounds - round);
    const roundParticipantCount = matchesThisRound * 2;
    const groupName = getEliminationRoundName(roundParticipantCount);
    
    // Create group for this round
    const [group] = await tx.insert(phaseGroups).values({
      phaseId: phase.id,
      name: groupName,
      order: round - 1, // Round 1 is order 0, Round 2 is order 1, etc.
      participantCount: round === 1 ? participantCount : 0, 
      groupType: 'ELIMINATION',
      config: {
        isHomeAway: options.isHomeAway || false,
        generateMatches: options.generateMatches !== false,
        advanceCount: matchesThisRound, // IMPORTANT: Autant de qualifiés que de matchs
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    
    createdGroups.push(group);

    // If first round, assign participants to the group
    if (round === 1 && workingRegIds.length > 0) {
      for (const regId of workingRegIds) {
        if (!isPlaceholder(regId)) {
          await tx.insert(phaseGroupParticipants).values({
            groupId: group.id,
            registrationId: regId,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      }
    }

    const currentRoundNodes = [];

    for (let i = 0; i < matchesThisRound; i++) {
      const p1 = round === 1 ? workingRegIds[i * 2] || null : null;
      const p2 = round === 1 ? workingRegIds[i * 2 + 1] || null : null;

      let parentNodeId = null;
      let childPosition = null;
      
      if (round < totalRounds) {
        const parentIndex = Math.floor(i / 2);
        if (previousRoundNodes[parentIndex]) {
          parentNodeId = previousRoundNodes[parentIndex].id;
          childPosition = i % 2 === 0 ? "UPPER" : "LOWER";
        }
      }

      const [node] = await tx.insert(bracketNodes).values({
        phaseId: phase.id,
        groupId: group.id, // Link node to the group of its round
        nodeCode: `R${round}-M${i + 1}`,
        round,
        matchNumber: matchCounter++,
        // depth = 0 for the root/final (highest round), increasing toward leaves.
        // Used by progression-engine to identify the winner node (depth === 0).
        depth: totalRounds - round,
        bracketType: 'UPPER',
        order: matchCounter,
        parentNodeId,
        childPosition,
        metadata: {
          participants: [p1, p2].filter(Boolean),
          requiresMatch: round === 1 ? !!p1 && !!p2 : false,
          generateMatches: options.generateMatches !== false,
          matchesCount: options.isHomeAway ? 2 : 1,
          format: 'BEST_OF_1'
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      currentRoundNodes.push(node);
      allCreatedNodes.push({ node, round, i, p1, p2 });

      // Generate matches for the node if requested
      if (options.generateMatches !== false) {
        const matchesToCreate = options.isHomeAway ? 2 : 1;
        for (let mIdx = 0; mIdx < matchesToCreate; mIdx++) {
          await tx.insert(matches).values({
            editionId,
            phaseId: phase.id,
            groupId: group.id,
            bracketNodeId: node.id,
            participant1RegistrationId: round === 1 ? (mIdx === 0 ? p1 : p2) : null, 
            participant2RegistrationId: round === 1 ? (mIdx === 0 ? p2 : p1) : null,
            matchCode: matchesToCreate > 1 ? `${node.nodeCode}-A${mIdx + 1}` : `${node.nodeCode}`,
            status: 'PENDING',
            round: round,
            matchNumber: node.matchNumber,
            metadata: {
              format: options.isHomeAway ? "HOME_AWAY" : "BEST_OF_1",
              leg: mIdx + 1,
            },
            scheduledTime: getDefaultScheduledTime(round, node.matchNumber),
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      }
    }

    previousRoundNodes = currentRoundNodes;
  }

  return createdGroups;
}

/**
 * @deprecated Use setupEliminationGroups instead
 */
export async function setupBracketPhase(
  tx: any,
  editionId: string,
  phase: any,
  participantRegIds: string[],
  options: GeneratorOptions
) {
  return await setupEliminationGroups(tx, editionId, phase, participantRegIds, options);
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

  if (options.generateNodes === false) return;

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
