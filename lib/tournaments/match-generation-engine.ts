import { db } from "@/lib/db";
import { 
  matches, 
  bracketNodes, 
  phaseGroups, 
  tournamentPhases,
  phaseGroupParticipants
} from "@/database/schema";
import { eq, and, inArray, isNull } from "drizzle-orm";
import { 
  generateGroupMatches, 
  generateRoundRobinMatches, 
  generateEliminationMatches 
} from "./match.generator";
import { shuffle } from "./utils";

export interface MatchGenerationOptions {
  dryRun?: boolean;
  clearExisting?: boolean;
  seedingMethod?: "RANDOM" | "SEQUENTIAL" | "MANUAL";
  isHomeAway?: boolean;
}

/**
 * Helper to identify if an ID is a structural placeholder 
 */
function isPlaceholder(id: string | null): boolean {
  if (!id) return true;
  return id === "BYE" || id.startsWith("QUALIFIER_") || id.startsWith("WINNER") || id.includes("-") === false;
}

/**
 * MatchGenerationEngine - Centralized engine for tournament match generation.
 * Handles all hierarchy levels: PHASE, GROUP, NODE.
 */
export async function generateMatchesEngine({
  type,
  id,
  options = {}
}: {
  type: "PHASE" | "GROUP" | "NODE";
  id: string;
  options?: MatchGenerationOptions;
}) {
  const { dryRun = false, clearExisting = false } = options;

  return await db.transaction(async (tx) => {
    if (type === "PHASE") {
      return await generatePhaseMatches(tx, id, options);
    } else if (type === "GROUP") {
      return await generateGroupMatchesEngine(tx, id, options);
    } else if (type === "NODE") {
      return await generateNodeMatches(tx, id, options);
    }
    throw new Error(`Invalid generation type: ${type}`);
  });
}

/**
 * Generates matches for an entire phase.
 */
async function generatePhaseMatches(tx: any, phaseId: string, options: MatchGenerationOptions) {
  const phase = await tx.query.tournamentPhases.findFirst({
    where: eq(tournamentPhases.id, phaseId),
    with: {
      groups: true,
      bracketNodes: {
        where: isNull(bracketNodes.groupId)
      }
    }
  });

  if (!phase) throw new Error("Phase not found");

  const results = [];

  // Generate for each group
  for (const group of phase.groups) {
    results.push(await generateGroupMatchesEngine(tx, group.id, options));
  }

  // Generate for standalone nodes (bracket level)
  for (const node of phase.bracketNodes) {
    results.push(await generateNodeMatches(tx, node.id, options));
  }

  return {
    success: true,
    phaseId,
    groupResults: results,
    dryRun: options.dryRun
  };
}

/**
 * Generates matches for a specific group.
 */
async function generateGroupMatchesEngine(tx: any, groupId: string, options: MatchGenerationOptions) {
  const group = await tx.query.phaseGroups.findFirst({
    where: eq(phaseGroups.id, groupId),
    with: {
      phase: true,
      participants: true
    }
  });

  if (!group) throw new Error("Group not found");

  // Get participant registration IDs
  let participantIds = group.participants.map((p: any) => p.registrationId);
  
  if (options.seedingMethod === "RANDOM") {
    participantIds = shuffle(participantIds);
  }

  const groupConfig = (group.config as any) || {};
  const isHomeAway = options.isHomeAway ?? groupConfig.isHomeAway ?? false;
  
  // Generate match objects
  const generatedMatches = generateGroupMatches(
    participantIds.map((id: string) => ({ id })), 
    { returnType: isHomeAway ? "double" : "single" }
  );

  if (options.dryRun) {
    return {
      groupId,
      matchCount: generatedMatches.length,
      matches: generatedMatches
    };
  }

  // Persistence
  if (options.clearExisting) {
    await tx.delete(matches).where(eq(matches.groupId, groupId));
  }

  // Find or create nodes for these matches if it's a Round Robin with multiple nodes (Journées)
  // For standard groups, we usually have one node per group or one node per group stage.
  // Logic: check for existing nodes or create them.
  
  const existingNodes = await tx.select().from(bracketNodes).where(eq(bracketNodes.groupId, groupId));
  
  // Create matches
  const matchValues = generatedMatches.map((m, idx) => {
    // Determine which node this match belongs to (if multiple nodes exist)
    // Round RR: round 1 -> node 1, etc.
    const node = existingNodes.find((n: any) => n.round === m.round) || existingNodes[0];

    return {
      editionId: group.phase.editionId,
      phaseId: group.phaseId,
      groupId: groupId,
      bracketNodeId: node?.id,
      participant1RegistrationId: isPlaceholder(m.participant1?.id) ? null : m.participant1?.id,
      participant2RegistrationId: isPlaceholder(m.participant2?.id) ? null : m.participant2?.id,
      round: m.round || 1,
      matchNumber: idx + 1,
      matchCode: node ? `${node.nodeCode}-M${idx + 1}` : `G-M${idx + 1}`,
      status: "PENDING",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  if (matchValues.length > 0) {
    await tx.insert(matches).values(matchValues);
  }

  return {
    success: true,
    groupId,
    matchCount: matchValues.length
  };
}

/**
 * Generates matches for a specific node.
 */
async function generateNodeMatches(tx: any, nodeId: string, options: MatchGenerationOptions) {
  const node = await tx.query.bracketNodes.findFirst({
    where: eq(bracketNodes.id, nodeId),
    with: {
      phase: true
    }
  });

  if (!node) throw new Error("Node not found");
  
  const metadata = (node.metadata as any) || {};
  const participants = metadata.participants || [];

  if (participants.length < 2) {
    return { success: true, nodeId, message: "Not enough participants for node match" };
  }

  const generated = generateEliminationMatches(
    participants.map((id: string) => ({ id })), 
    node.round || 1
  );

  if (options.dryRun) {
    return { nodeId, matchCount: generated.length, matches: generated };
  }

  if (options.clearExisting) {
    await tx.delete(matches).where(eq(matches.bracketNodeId, nodeId));
  }

  const matchValues = generated.map((m, idx) => ({
    editionId: node.phase.editionId,
    phaseId: node.phaseId,
    groupId: node.groupId,
    bracketNodeId: nodeId,
    participant1RegistrationId: isPlaceholder(m.participant1?.id) ? null : m.participant1?.id,
    participant2RegistrationId: isPlaceholder(m.participant2?.id) ? null : m.participant2?.id,
    round: m.round || 1,
    matchNumber: idx + 1,
    matchCode: node.nodeCode ? `${node.nodeCode}` : `N-M${idx + 1}`,
    status: "PENDING",
    createdAt: new Date(),
    updatedAt: new Date(),
  })).filter(m => m.participant1RegistrationId || m.participant2RegistrationId); // Filter matches with only nulls if needed, or allow them

  if (matchValues.length > 0) {
    await tx.insert(matches).values(matchValues);
  }

  return {
    success: true,
    nodeId,
    matchCount: matchValues.length
  };
}
