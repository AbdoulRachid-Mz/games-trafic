import { db } from "@/lib/db";
import {
  matches,
  bracketNodes,
  phaseGroups,
  tournamentPhases,
  tournamentEditions,
  phaseGroupParticipants,
  editionResults,
  editionRegistrations,
} from "@/database/schema";
import { eq, and, asc, desc, or } from "drizzle-orm";
import {
  syncStandingsWithMatches,
  rankParticipants,
  ParticipantStats,
} from "./standings.engine";
import {
  computeAggregatedWinner,
  computeWinner,
  getRequiredWins,
} from "./bracket-engine";
import { getDefaultScheduledTime } from "./utils";

export interface ProgressionResult {
  isNodeComplete: boolean;
  isGroupComplete: boolean;
  isPhaseComplete: boolean;
  isEditionComplete: boolean;
  qualifiers?: any[];
  winners?: any[];
  nextLevelToOrganize?: {
    type: "NODE" | "GROUP" | "PHASE" | "EDITION";
    id: string;
    name: string;
  };
  competitionMode?: string;
}

export async function progressTournamentAfterMatch(
  matchId: string,
): Promise<ProgressionResult> {
  const result: ProgressionResult = {
    isNodeComplete: false,
    isGroupComplete: false,
    isPhaseComplete: false,
    isEditionComplete: false,
  };

  const match = await db.query.matches.findFirst({
    where: eq(matches.id, matchId),
    with: {
      edition: true,
      phase: true,
      group: true,
      bracketNode: true,
    },
  });

  if (!match || match.status !== "COMPLETED") return result;

  const editionConfig = (match.edition?.editionConfig as any) || {};
  const competitionMode = editionConfig.competitionMode || "AUTO";
  result.competitionMode = competitionMode;

  // 1. Check Node Completion (Bracket)
  if (match.bracketNodeId) {
    const nodeMatches = await db.query.matches.findMany({
      where: eq(matches.bracketNodeId, match.bracketNodeId),
    });

    const allCompleted = nodeMatches.every((m) => m.status === "COMPLETED");
    if (allCompleted && nodeMatches.length > 0) {
      result.isNodeComplete = true;
      // Identifier le vainqueur du noeud
      if (match.winnerRegistrationId) {
        result.qualifiers = [match.winnerRegistrationId];
      }

      if (competitionMode === "AUTO") {
        await handleEliminationProgression(db, matchId);
      } else {
        const node = await db.query.bracketNodes.findFirst({
          where: eq(bracketNodes.id, match.bracketNodeId),
        });
        if (node?.parentNodeId) {
          result.nextLevelToOrganize = {
            type: "NODE",
            id: node.parentNodeId,
            name: "Prochain match",
          };
        }
      }
    }
  }

  // 2. Check Group Completion
  if (match.groupId) {
    const groupMatches = await db.query.matches.findMany({
      where: eq(matches.groupId, match.groupId),
    });

    const allCompleted = groupMatches.every((m) => m.status === "COMPLETED");
    if (allCompleted && groupMatches.length > 0) {
      result.isGroupComplete = true;

      // Mettre à jour le statut du groupe
      await db
        .update(phaseGroups)
        .set({ isCompleted: true })
        .where(eq(phaseGroups.id, match.groupId));

      // Calculer les classements
      const groupParticipants = await db.query.phaseGroupParticipants.findMany({
        where: eq(phaseGroupParticipants.groupId, match.groupId),
      });
      const participantIds = groupParticipants.map((p) => p.registrationId);

      const config = (match.group?.config as any) || {};
      const statsMap = syncStandingsWithMatches(
        participantIds,
        groupMatches as any[],
        config,
      );
      const ranked = rankParticipants(statsMap, config);

      const advanceCount = config.advanceCount || 2;

      const qualifiers = [];
      for (let i = 0; i < ranked.length; i++) {
        const { registrationId, stats } = ranked[i];
        const isQualified = i < advanceCount;
        if (isQualified) qualifiers.push(registrationId);

        await db
          .update(phaseGroupParticipants)
          .set({
            position: i + 1,
            qualified: isQualified,
            matchesPlayed: stats.matchesPlayed,
            matchesWon: stats.matchesWon,
            matchesDrawn: stats.matchesDrawn,
            matchesLost: stats.matchesLost,
            points: stats.points,
            scoreFor: stats.scoreFor,
            scoreAgainst: stats.scoreAgainst,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(phaseGroupParticipants.groupId, match.groupId),
              eq(phaseGroupParticipants.registrationId, registrationId),
            ),
          );
      }

      result.qualifiers = qualifiers;

      // 3. Trigger progression if elimination
      if (match.phase?.phaseType === "ELIMINATION" || match.phase?.phaseType === "KNOCKOUT") {
        await handleEliminationProgression(db, matchId);
      }
    }
  }

  // 3. Check Phase Completion
  const phaseMatches = await db.query.matches.findMany({
    where: eq(matches.phaseId, match.phaseId),
  });

  const allPhaseCompleted = phaseMatches.every((m) => m.status === "COMPLETED");
  if (allPhaseCompleted && phaseMatches.length > 0) {
    result.isPhaseComplete = true;

    // Si c'est un Bracket et pas un groupe, le vainqueur de la phase c'est le vainqueur de la finale
    if (!match.groupId && match.bracketNode) {
      // Trouver le noeud racine (qui n'a pas de parent)
      const rootNode = await db.query.bracketNodes.findFirst({
        where: and(
          eq(bracketNodes.phaseId, match.phaseId),
          eq(bracketNodes.depth, 0),
        ),
      });
      if (rootNode && rootNode.winnerRegistrationId) {
        result.winners = [rootNode.winnerRegistrationId];
      } else if (match.winnerRegistrationId) {
        // Fallback si le depth n'est pas bien set
        result.winners = [match.winnerRegistrationId];
      }
    }

    const allPhases = await db.query.tournamentPhases.findMany({
      where: eq(tournamentPhases.editionId, match.editionId),
      orderBy: [asc(tournamentPhases.order)],
    });

    const currentIndex = allPhases.findIndex((p) => p.id === match.phaseId);
    if (currentIndex !== -1 && currentIndex + 1 < allPhases.length) {
      const nextPhase = allPhases[currentIndex + 1];
      result.nextLevelToOrganize = {
        type: "PHASE",
        id: nextPhase.id,
        name: nextPhase.name,
      };

      // La propagation phase vers phase se fera manuellement lors de la clôture de phase
    } else {
      // Pas de prochaine phase = Fin de l'édition !
      result.isEditionComplete = true;
    }
  }

  return result;
}


export async function handleEliminationProgression(
  tx: any,
  matchId: string,
) {
  const match = await tx.query.matches.findFirst({
    where: eq(matches.id, matchId),
    with: {
      bracketNode: true,
      edition: true,
    },
  });

  if (!match || match.status !== "COMPLETED") return;
  if (!match.winnerRegistrationId) return;

  const node = match.bracketNode;
  if (!node) return;

  console.log("[PROGRESSION] Match completed:", match.id, "Node:", node.nodeCode);

  // 1. Advance winner to the next round
  await advanceWinnerToNextRound(tx, node, match.winnerRegistrationId);

  // 2. Update stats idempotently
  await updateEditionResultsFromBracketNodeSafe(tx, node.id);

  // 3. Check if the entire phase is complete
  const isPhaseComplete = await isEliminationPhaseComplete(tx, node.phaseId);
  if (isPhaseComplete) {
    console.log("[PROGRESSION] Elimination Phase Complete!", node.phaseId);
    // You could trigger phase completion here or leave it for the action
  }
}

async function getNextBracketNode(tx: any, currentNode: any) {
  // 1. Utiliser parentNodeId si disponible (methode preferee)
  if (currentNode.parentNodeId) {
    const parentNode = await tx.query.bracketNodes.findFirst({
      where: eq(bracketNodes.id, currentNode.parentNodeId),
    });
    if (parentNode) {
      console.log("[PROGRESSION] Found next node via parentNodeId:", parentNode.nodeCode);
      return parentNode;
    }
  }
  
  // 2. Fallback: Chercher par round et position
  const currentGroup = await tx.query.phaseGroups.findFirst({
    where: eq(phaseGroups.id, currentNode.groupId),
  });
  
  if (!currentGroup) {
    console.log("[PROGRESSION] Current group not found for node:", currentNode.id);
    return null;
  }
  
  // Trouver le groupe du round suivant (order + 1)
  const nextGroup = await tx.query.phaseGroups.findFirst({
    where: and(
      eq(phaseGroups.phaseId, currentNode.phaseId),
      eq(phaseGroups.order, currentGroup.order + 1),
      eq(phaseGroups.isDeleted, false),
    ),
  });
  
  if (!nextGroup) {
    console.log("[PROGRESSION] No next group found - this might be the final");
    return null;
  }
  
  // Calculer la position dans le round suivant
  // matchNumber est l'index du match dans son round (1-indexed)
  const nextMatchNumber = Math.ceil(currentNode.matchNumber / 2);
  
  const nextNode = await tx.query.bracketNodes.findFirst({
    where: and(
      eq(bracketNodes.groupId, nextGroup.id),
      eq(bracketNodes.matchNumber, nextMatchNumber),
    ),
  });
  
  if (nextNode) {
    console.log("[PROGRESSION] Found next node via fallback:", nextNode.nodeCode);
  } else {
    console.log("[PROGRESSION] No next node found in group", nextGroup.name);
  }
  
  return nextNode;
}

async function advanceWinnerToNextRound(
  tx: any,
  currentNode: any,
  winnerId: string,
) {
  const nextNode = await getNextBracketNode(tx, currentNode);

  if (!nextNode) {
    console.log("[PROGRESSION] No next node → possible final at node", currentNode.id);
    return;
  }

  const metadata = (nextNode.metadata as any) || {};
  let participants: string[] = metadata.participants || [];

  // ✅ Idempotence: check if winner already in participants
  if (participants.includes(winnerId)) {
    console.log("[PROGRESSION] Winner already in next node", nextNode.id);
    return;
  }

  if (participants.length < 2) {
    participants.push(winnerId);
  } else {
    // This shouldn't happen in a standard bracket unless someone is overwriting
    console.warn("[PROGRESSION] Next node already has 2 participants", nextNode.id);
  }

  console.log("[PROGRESSION] Advancing:", winnerId, "→ node", nextNode.id);

  await tx
    .update(bracketNodes)
    .set({
      metadata: {
        ...metadata,
        participants,
        isPlaceholder: participants.length < 2,
      },
      updatedAt: new Date(),
    })
    .where(eq(bracketNodes.id, nextNode.id));

  // ✅ NEW: Insert into phaseGroupParticipants for the next group if not already there
  if (nextNode.groupId) {
    const existingParticipation = await tx.query.phaseGroupParticipants.findFirst({
      where: and(
        eq(phaseGroupParticipants.groupId, nextNode.groupId),
        eq(phaseGroupParticipants.registrationId, winnerId),
      ),
    });

    if (!existingParticipation) {
      console.log("[PROGRESSION] Adding winner to phaseGroupParticipants:", winnerId, "Group:", nextNode.groupId);
      await tx.insert(phaseGroupParticipants).values({
        groupId: nextNode.groupId,
        registrationId: winnerId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  // 🚀 Si prêt (2 participants réels) → créer match
  if (participants.length === 2) {
    await createMatchesIfReady(tx, nextNode.id);
  }
}

async function createMatchesIfReady(tx: any, nodeId: string) {
  const node = await tx.query.bracketNodes.findFirst({
    where: eq(bracketNodes.id, nodeId),
    with: {
      phase: {
        with: {
          edition: true
        }
      }
    }
  });

  if (!node) return;

  const metadata = (node.metadata as any) || {};
  const participants: string[] = metadata.participants || [];

  // MUST NOT rely on placeholders or nulls
  if (participants.length !== 2 || participants.some(p => !p || p.startsWith("WINNER") || p.startsWith("QUALIFIER"))) {
    return;
  }

  const existingMatches = await tx.query.matches.findMany({
    where: eq(matches.bracketNodeId, node.id),
  });

  if (existingMatches.length > 0) {
    console.log("[PROGRESSION] Matches already exist for node", node.id);
    return; 
  }

  const [p1, p2] = participants;
  const isHomeAway = metadata.isHomeAway === true || metadata.format === "HOME_AWAY";
  const matchFormat = metadata.matchFormat || "BEST_OF_1";

  const matchesToCreate = isHomeAway ? 2 : 1;

  console.log("[MATCH CREATE] Node ready:", node.nodeCode, "Participants:", participants);

  for (let i = 0; i < matchesToCreate; i++) {
    await tx.insert(matches).values({
      editionId: node.phase.editionId,
      phaseId: node.phaseId,
      groupId: node.groupId,
      bracketNodeId: node.id,
      participant1RegistrationId: i === 0 ? p1 : p2,
      participant2RegistrationId: i === 0 ? p2 : p1,
      matchCode:
        matchesToCreate > 1
          ? `${node.nodeCode}-L${i + 1}`
          : node.nodeCode,
      status: "PENDING",
      round: node.round,
      matchNumber: node.matchNumber,
      metadata: {
        format: isHomeAway ? "HOME_AWAY" : matchFormat,
        leg: i + 1,
        isHomeAway,
      },
      scheduledTime: getDefaultScheduledTime(
        node.round || 1,
        node.matchNumber || 1,
      ),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
  }
}

export async function isEliminationPhaseComplete(
  tx: any,
  phaseId: string,
) {
  const phase = await tx.query.tournamentPhases.findFirst({
    where: eq(tournamentPhases.id, phaseId),
    with: {
      edition: true,
    },
  });

  if (!phase) return false;

  const nodes = await tx.query.bracketNodes.findMany({
    where: eq(bracketNodes.phaseId, phaseId),
  });

  if (!nodes.length) return false;

  // 🔹 Trouver dernier round
  const maxRound = Math.max(...nodes.map((n: any) => n.round || 0));
  const finalNodes = nodes.filter((n: any) => n.round === maxRound);

  // 🔹 Check structure: A final should have only 1 node (usually)
  if (finalNodes.length !== 1) return false;

  const finalNode = finalNodes[0];

  // 🔹 Check matches completed
  const matchesList = await tx.query.matches.findMany({
    where: eq(matches.bracketNodeId, finalNode.id),
  });

  if (!matchesList.length) return false;

  const allCompleted = matchesList.every(
    (m: any) => m.status === "COMPLETED",
  );

  if (!allCompleted) return false;

  // 🔥 PARTICIPANT STATE CHECK
  const metadata = (finalNode.metadata as any) || {};
  const participants = metadata.participants || [];

  if (participants.length !== 2) return false;

  const winnerExists = matchesList.some(
    (m: any) => m.winnerRegistrationId,
  );

  if (!winnerExists) return false;

  return true;
}

async function updateEditionResultsFromBracketNodeSafe(
  tx: any,
  nodeId: string,
) {
  const node = await tx.query.bracketNodes.findFirst({
    where: eq(bracketNodes.id, nodeId),
    with: { 
      matches: true,
      phase: true
    },
  });

  if (!node || !node.phase?.editionId) return;

  const editionId = node.phase.editionId;
  const metadata = (node.metadata as any) || {};
  const participants = metadata.participants || [];

  for (const regId of participants) {
    if (!regId) continue;
    await recomputeParticipantEditionStats(tx, editionId, regId);
  }
}

export async function recomputeParticipantEditionStats(
  tx: any,
  editionId: string,
  registrationId: string,
  additionalData: Partial<typeof editionResults.$inferInsert> = {}
) {
  const allMatches = await tx.query.matches.findMany({
    where: and(
      eq(matches.editionId, editionId),
      eq(matches.status, "COMPLETED"),
      or(
        eq(matches.participant1RegistrationId, registrationId),
        eq(matches.participant2RegistrationId, registrationId)
      )
    )
  });

  let won = 0, lost = 0, drawn = 0;
  allMatches.forEach((m: any) => {
    if (m.winnerRegistrationId === registrationId) won++;
    else if (m.winnerRegistrationId) lost++;
    else drawn++;
  });

  await tx
    .insert(editionResults)
    .values({
      editionId,
      registrationId,
      position: 0, // Default position to satisfy not-null constraint
      matchesPlayed: allMatches.length,
      matchesWon: won,
      matchesLost: lost,
      matchesDrawn: drawn,
      updatedAt: new Date(),
      ...additionalData,
    })
    .onConflictDoUpdate({
      target: [editionResults.editionId, editionResults.registrationId],
      set: {
        matchesPlayed: allMatches.length,
        matchesWon: won,
        matchesLost: lost,
        matchesDrawn: drawn,
        updatedAt: new Date(),
        ...additionalData,
      },
    });
}



