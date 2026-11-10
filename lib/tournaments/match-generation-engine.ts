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
import { getDefaultScheduledTime, shuffle } from "./utils";

export interface MatchGenerationOptions {
  dryRun?: boolean;
  clearExisting?: boolean;
  seedingMethod?: "RANDOM" | "SEQUENTIAL" | "MANUAL";
  isHomeAway?: boolean;
}

function isPlaceholder(id: string | null): boolean {
  if (!id) return true;
  return id === "BYE" || id.startsWith("QUALIFIER_") || id.startsWith("WINNER") || id.includes("-") === false;
}

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

  for (const group of phase.groups) {
    results.push(await generateGroupMatchesEngine(tx, group.id, options));
  }

  // Legacy: standalone nodes (sans groupId)
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

async function generateGroupMatchesEngine(tx: any, groupId: string, options: MatchGenerationOptions) {
  const group = await tx.query.phaseGroups.findFirst({
    where: eq(phaseGroups.id, groupId),
    with: {
      phase: true,
      participants: true
    }
  });

  if (!group) throw new Error("Group not found");

  let participantIds = group.participants.map((p: any) => p.registrationId);
  
  if (options.seedingMethod === "RANDOM") {
    participantIds = shuffle(participantIds);
  }

  const groupConfig = (group.config as any) || {};
  const isHomeAway = options.isHomeAway ?? groupConfig.isHomeAway ?? false;
  
  let generatedMatches;
  if (group.groupType === 'ELIMINATION') {
    generatedMatches = generateEliminationMatches(
      participantIds.map((id: string) => ({ id })), 
      1
    );
  } else {
    generatedMatches = generateGroupMatches(
      participantIds.map((id: string) => ({ id })), 
      { returnType: isHomeAway ? "double" : "single" }
    );
  }

  if (options.dryRun) {
    return {
      groupId,
      matchCount: generatedMatches.length,
      matches: generatedMatches
    };
  }

  if (options.clearExisting) {
    await tx.delete(matches).where(eq(matches.groupId, groupId));
  }

  const existingNodes = await tx.select().from(bracketNodes).where(eq(bracketNodes.groupId, groupId));

  // 🆕 Journée (matchday) Round Robin refondu : 1 node = 1 confrontation
  // déjà en place. Une régénération round-robin full créerait des doublons
  // A-B / B-A ; on saute explicitement.
  if (
    (((group.config as any) || {}).isMatchday === true) &&
    existingNodes.length > 0
  ) {
    return {
      groupId,
      skipped: true,
      reason: "ROUND_ROBIN_MATCHDAY_NODES_EXIST",
      matchCount: existingNodes.length,
    };
  }
  
  const matchValues = generatedMatches.map((m, idx) => {
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
      scheduledTime: getDefaultScheduledTime(m.round || 1, idx + 1),
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
 * ✅ CORRECTION: Génère les matchs pour un node en utilisant les participants du groupe parent
 */
async function generateNodeMatches(tx: any, nodeId: string, options: MatchGenerationOptions) {
  const node = await tx.query.bracketNodes.findFirst({
    where: eq(bracketNodes.id, nodeId),
    with: {
      phase: true,
      group: true  // ← IMPORTANT: récupérer le groupe parent
    }
  });

  if (!node) throw new Error("Node not found");

  // ✅ PRIORITÉ 1: metadata.participants (spécifique à ce nœud/match)
  const metadata = (node.metadata as any) || {};
  let participantIds: string[] = metadata.participants || [];

  // ⚠️ FALLBACK: Participants via le groupe parent (seulement si vide)
  if (participantIds.length === 0 && node.groupId) {
    const groupParticipants = await tx.query.phaseGroupParticipants.findMany({
      where: eq(phaseGroupParticipants.groupId, node.groupId),
    });
    participantIds = groupParticipants.map((p: any) => p.registrationId);
  }

  if (participantIds.length < 2) {
    return { success: true, nodeId, message: "Not enough participants for node match", participantCount: participantIds.length };
  }

  const isHomeAway = options.isHomeAway ?? metadata.isHomeAway ?? false;
  
  // Générer les matchs
  let generatedMatches;
  if (isHomeAway) {
    const singles = generateEliminationMatches(participantIds.map(id => ({ id })), node.round || 1);
    generatedMatches = [
      ...singles,
      ...singles.map(m => ({
        ...m,
        participant1: m.participant2,
        participant2: m.participant1,
        round: (m.round || 1) + 1
      }))
    ];
  } else {
    generatedMatches = generateEliminationMatches(participantIds.map(id => ({ id })), node.round || 1);
  }

  if (options.dryRun) {
    return { nodeId, matchCount: generatedMatches.length, matches: generatedMatches };
  }

  if (options.clearExisting) {
    await tx.delete(matches).where(eq(matches.bracketNodeId, nodeId));
  }

  const matchValues = generatedMatches.map((m, idx) => ({
    editionId: node.phase.editionId,
    phaseId: node.phaseId,
    groupId: node.groupId,
    bracketNodeId: nodeId,
    participant1RegistrationId: isPlaceholder(m.participant1?.id) ? null : m.participant1?.id,
    participant2RegistrationId: isPlaceholder(m.participant2?.id) ? null : m.participant2?.id,
    round: m.round || 1,
    matchNumber: idx + 1,
    matchCode: node.nodeCode ? `${node.nodeCode}` : `N-M${idx + 1}`,
    scheduledTime: getDefaultScheduledTime(m.round || 1, idx + 1),
    status: "PENDING",
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  if (matchValues.length > 0) {
    await tx.insert(matches).values(matchValues);
  }

  return {
    success: true,
    nodeId,
    matchCount: matchValues.length,
    source: node.groupId ? "group_participants" : "metadata_legacy"
  };
}