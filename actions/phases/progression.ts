"use server";

import {
  tournamentPhases,
  phaseGroups,
  phaseGroupParticipants,
  bracketNodes,
  matches,
  tournamentEditions,
  editionRegistrations,
  editionResults,
  type TournamentPhase,
  type PhaseGroup,
  type PhaseGroupParticipant,
  type BracketNode,
  type Match,
} from "@/database/schema";
import {
  eq,
  and,
  or,
  desc,
  asc,
  sql,
  count,
  inArray,
  notInArray,
  isNull,
  isNotNull,
  lt,
  lte,
  gt,
  gte,
} from "drizzle-orm";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import {
  shuffle,
  chunk,
  getDefaultScheduledTime,
} from "@/lib/tournaments/utils";
import { propagatePhaseResults } from "@/lib/tournaments/propagation-service";
import {
  computeWinner,
  getRequiredWins,
  resolveSlotIndex,
  computeAggregatedWinner,
} from "@/lib/tournaments/bracket-engine";
import {
  handleEliminationProgression,
  progressTournamentAfterMatch,
  recomputeParticipantEditionStats,
} from "@/lib/tournaments/progression-engine";
import {
  assertOrganizerOrAdminByEdition,
  assertOrganizerOrAdminByPhase,
  FINAL_STATUSES,
  isMatchPending,
  groupMatchesBy,
  hasPending,
  getEliminationRoundName,
  getWinnersFromGroups,
} from "./helpers";
import {
  getTournamentPhaseById,
  getPhaseGroupById,
  getPhaseGroups,
  getPhaseGroupParticipants,
  getBracketNodeById,
  getBracketNodes,
  getMatchById,
  getMatches,
} from "./queries";
import {
  updatePhaseGroup,
  updateTournamentPhase,
  updateBracketNode,
  updateMatch,
  createPhaseGroupParticipant,
  createBracketNode,
  createMatch,
  bulkCreateMatches,
} from "./mutations";
import {
  distributeParticipantsInEliminationGroup,
  setupEliminationGroups,
} from "./structure";

async function isGroupFullyCompleted(tx: any, groupId: string) {
  const pending = await checkPendingEntitiesAction("GROUP", groupId);
  return pending.pendingEntities.length === 0;
}

async function completeAllNodesInGroup(tx: any, groupId: string) {
  const nodes = await tx.query.bracketNodes.findMany({
    where: and(
      eq(bracketNodes.groupId, groupId),
      eq(bracketNodes.isDeleted, false),
    ),
  });

  for (const node of nodes) {
    if (node.isCompleted) continue;

    const matchesList = await tx.query.matches.findMany({
      where: and(
        eq(matches.bracketNodeId, node.id),
        eq(matches.isDeleted, false),
      ),
    });

    if (matchesList.length === 0) continue;

    const allCompleted = matchesList.every((m: any) =>
      FINAL_STATUSES.has(m.status || ""),
    );

    if (allCompleted) {
      await markBracketNodeCompleteAction(node.id);
    }
  }
}


export async function recalculateGroupStandings(
  groupId: string,
): Promise<void> {
  try {
    const group = await db.query.phaseGroups.findFirst({
      where: eq(phaseGroups.id, groupId),
      with: {
        participants: true,
      },
    });

    if (!group) throw new Error("Group not found");

    const finishedMatches = await db.query.matches.findMany({
      where: and(
        eq(matches.groupId, groupId),
        eq(matches.status, "COMPLETED"),
        eq(matches.confirmedByAdmin, true),
      ),
    });

    const config = (group.config as any) || {};
    const ptsWin = config.pointsPerWin ?? 3;
    const ptsDraw = config.pointsPerDraw ?? 1;
    const ptsLoss = config.pointsPerLoss ?? 0;

    // Reset stats for all participants
    const statsMap = new Map();
    for (const p of group.participants) {
      statsMap.set(p.registrationId, {
        matchesPlayed: 0,
        matchesWon: 0,
        matchesDrawn: 0,
        matchesLost: 0,
        points: 0,
        scoreFor: 0,
        scoreAgainst: 0,
      });
    }

    // Accumulate stats from matches
    for (const m of finishedMatches) {
      if (!m.participant1RegistrationId || !m.participant2RegistrationId)
        continue;

      const p1 = statsMap.get(m.participant1RegistrationId);
      const p2 = statsMap.get(m.participant2RegistrationId);

      if (p1 && p2) {
        p1.matchesPlayed++;
        p2.matchesPlayed++;
        p1.scoreFor += m.score1 ?? 0;
        p1.scoreAgainst += m.score2 ?? 0;
        p2.scoreFor += m.score2 ?? 0;
        p2.scoreAgainst += m.score1 ?? 0;

        if ((m.score1 ?? 0) > (m.score2 ?? 0)) {
          p1.matchesWon++;
          p1.points += ptsWin;
          p2.matchesLost++;
          p2.points += ptsLoss;
        } else if ((m.score1 ?? 0) < (m.score2 ?? 0)) {
          p2.matchesWon++;
          p2.points += ptsWin;
          p1.matchesLost++;
          p1.points += ptsLoss;
        } else {
          p1.matchesDrawn++;
          p1.points += ptsDraw;
          p2.matchesDrawn++;
          p2.points += ptsDraw;
        }
      }
    }

    // Update database for each participant
    await db.transaction(async (tx) => {
      for (const [regId, stats] of statsMap.entries()) {
        const participant = group.participants.find(
          (p) => p.registrationId === regId,
        );
        if (participant) {
          await tx
            .update(phaseGroupParticipants)
            .set({
              ...stats,
              updatedAt: new Date(),
            })
            .where(eq(phaseGroupParticipants.id, participant.id));
        }
      }
    });
  } catch (error) {
    console.error("Error recalculating group standings:", error);
    throw error;
  }
}

/**
 * Verrouille ou déverrouille un groupe
 */

export async function checkPendingEntitiesAction(
  type: "PHASE" | "GROUP" | "BRACKET_NODE",
  id: string,
) {
  const pendingEntities: Array<{
    type: "MATCH" | "GROUP" | "NODE";
    id: string;
    label: string;
    reason: string;
  }> = [];

  try {
    // 🔥 FETCH GLOBAL MATCHES (1 seule source)
    let matchesList: Array<
      typeof db.query.matches.findMany extends (
        ...args: any[]
      ) => Promise<infer R>
        ? R extends (infer M)[]
          ? M
          : never
        : never
    > = [];

    if (type === "PHASE") {
      matchesList = await db.query.matches.findMany({
        where: and(eq(matches.phaseId, id), eq(matches.isDeleted, false)),
      });
    }

    if (type === "GROUP") {
      matchesList = await db.query.matches.findMany({
        where: and(eq(matches.groupId, id), eq(matches.isDeleted, false)),
      });
    }

    if (type === "BRACKET_NODE") {
      matchesList = await db.query.matches.findMany({
        where: and(eq(matches.bracketNodeId, id), eq(matches.isDeleted, false)),
      });
    }

    // 🔥 CAS SIMPLE : BRACKET NODE
    if (type === "BRACKET_NODE") {
      for (const match of matchesList) {
        if (isMatchPending(match.status)) {
          pendingEntities.push({
            type: "MATCH",
            id: match.id,
            label: match.matchCode || `Match ${match.id.slice(0, 8)}`,
            reason: `Statut: ${match.status}`,
          });
        }
      }

      return { success: true, pendingEntities };
    }

    // 🔥 GROUP LOGIC
    if (type === "GROUP") {
      const nodes = await db.query.bracketNodes.findMany({
        where: and(
          eq(bracketNodes.groupId, id),
          eq(bracketNodes.isDeleted, false),
        ),
      });

      const nodeMatches = await db.query.matches.findMany({
        where: and(
          inArray(
            matches.bracketNodeId,
            nodes.map((n) => n.id),
          ),
          eq(matches.isDeleted, false),
        ),
      });

      const matchesByNode = groupMatchesBy(nodeMatches, "bracketNodeId");

      for (const node of nodes) {
        const m = matchesByNode.get(node.id) || [];

        if (m.length === 0) {
          pendingEntities.push({
            type: "NODE",
            id: node.id,
            label: node.nodeCode || node.id,
            reason: "Aucun match généré",
          });
          continue;
        }

        if (hasPending(m)) {
          pendingEntities.push({
            type: "NODE",
            id: node.id,
            label: node.nodeCode || node.id,
            reason: "Matchs non terminés",
          });
        }
      }

      // matchs directs du groupe
      for (const match of matchesList) {
        if (isMatchPending(match.status)) {
          pendingEntities.push({
            type: "MATCH",
            id: match.id,
            label: match.matchCode || match.id,
            reason: `Statut: ${match.status}`,
          });
        }
      }

      return { success: true, pendingEntities };
    }

    // 🔥 PHASE LOGIC (ULTRA OPTI)
    if (type === "PHASE") {
      const groups = await db.query.phaseGroups.findMany({
        where: and(
          eq(phaseGroups.phaseId, id),
          eq(phaseGroups.isDeleted, false),
        ),
      });

      for (const group of groups) {
        // On récupère les matchs rattachés à ce groupe
        const groupMatches = matchesList.filter((m) => m.groupId === group.id);

        // Si le groupe a des participants prévus mais aucun match généré, c'est bloquant
        if (
          groupMatches.length === 0 &&
          group.participantCount &&
          group.participantCount > 0
        ) {
          pendingEntities.push({
            type: "GROUP",
            id: group.id,
            label: group.name || `Groupe ${group.order}`,
            reason: "Aucun match généré",
          });
          continue;
        }

        // S'il y a des matchs non terminés
        if (hasPending(groupMatches)) {
          pendingEntities.push({
            type: "GROUP",
            id: group.id,
            label: group.name || `Groupe ${group.order}`,
            reason: "Matchs non terminés",
          });
        }
      }

      // 🔥 BRACKET DIRECT (nodes rattachés à la phase sans group - legacy)
      const nodeMatches = matchesList.filter((m) => m.bracketNodeId);
      const matchesByNode = groupMatchesBy(nodeMatches, "bracketNodeId");

      const nodes = await db.query.bracketNodes.findMany({
        where: and(
          eq(bracketNodes.phaseId, id),
          isNull(bracketNodes.groupId), // ⚠️ On garde pour compatibilité legacy
          eq(bracketNodes.isDeleted, false),
        ),
      });

      // Pour chaque node legacy, on vérifie ses matchs
      for (const node of nodes) {
        const nm = matchesByNode.get(node.id) || [];
        if (nm.length === 0 || hasPending(nm)) {
          pendingEntities.push({
            type: "NODE",
            id: node.id,
            label: node.nodeCode || node.id,
            reason:
              nm.length === 0 ? "Aucun match généré" : "Matchs non terminés",
          });
        }
      }

      // matchs directs
      for (const match of matchesList) {
        if (!match.groupId && !match.bracketNodeId) {
          if (isMatchPending(match.status)) {
            pendingEntities.push({
              type: "MATCH",
              id: match.id,
              label: match.matchCode || match.id,
              reason: `Statut: ${match.status}`,
            });
          }
        }
      }
    }

    return { success: true, pendingEntities };
  } catch (error) {
    console.error("checkPendingEntitiesAction error:", error);
    return { success: false, pendingEntities: [] };
  }
}

/**
 * Distribue les participants d'un groupe d'elimination dans ses brackets
 * et genere les matches correspondants.
 *
 * Flux:
 * 1. Recupere les participants du groupe (phaseGroupParticipants)
 * 2. Applique le tirage au sort selon la config
 * 3. Cree/met a jour les brackets avec les participants
 * 4. Genere les matches pour chaque bracket
 */

export async function propagateEliminationRoundToNextGroup(
  phaseId: string,
  currentGroupOrder: number,
  tx?: any,
) {
  const execute = async (transaction: any) => {
    // 1. Get current round groups
    const groupsInCurrentRound = await transaction.query.phaseGroups.findMany({
      where: and(
        eq(phaseGroups.phaseId, phaseId),
        eq(phaseGroups.order, currentGroupOrder),
        eq(phaseGroups.isDeleted, false),
      ),
    });

    if (groupsInCurrentRound.length === 0) {
      return { success: false, message: "No groups found" };
    }

    // 2. HARD CHECK → matches are the truth
    for (const group of groupsInCurrentRound) {
      // Check if group is complete
      const isComplete = await isGroupFullyCompleted(tx, group.id);
      if (!isComplete) {
        return {
          success: true,
          propagated: false,
          message: `Group ${group.name} still has pending matches`,
        };
      }
    }

    // 3. FORCE COMPLETE ALL NODES (safety)
    for (const group of groupsInCurrentRound) {
      await completeAllNodesInGroup(tx, group.id);
    }

    // 4. RE-FETCH winners from DB ONLY
    // Add type annotation for the map function
    const groupIds: string[] = groupsInCurrentRound.map((g: any) => g.id);
    let allQualifiers = await getWinnersFromGroups(tx, groupIds);

    if (allQualifiers.length === 0) {
      return {
        success: true,
        propagated: false,
        message: "No winners found",
      };
    }

    // 5. Validate bracket consistency
    const expectedWinners = Math.floor(allQualifiers.length * 1); // safe fallback
    if (allQualifiers.length < 1) {
      throw new Error("Invalid winners count");
    }

    // 6. Find next group
    const nextGroup = await tx.query.phaseGroups.findFirst({
      where: and(
        eq(phaseGroups.phaseId, phaseId),
        eq(phaseGroups.order, currentGroupOrder + 1),
        eq(phaseGroups.isDeleted, false),
      ),
    });

    // 7. SMART FINAL DETECTION
    if (!nextGroup) {
      // No next round → check if truly finished
      if (allQualifiers.length <= 1) {
        return {
          success: true,
          propagated: false,
          isFinal: true,
          winner: allQualifiers[0] || null,
        };
      }

      // Not final → structure problem
      return {
        success: false,
        error:
          "No next group but multiple winners remain → structure inconsistency",
      };
    }

    // 8. CLEAN INSERT (idempotent)
    for (const regId of allQualifiers) {
      const exists = await tx.query.phaseGroupParticipants.findFirst({
        where: and(
          eq(phaseGroupParticipants.groupId, nextGroup.id),
          eq(phaseGroupParticipants.registrationId, regId),
        ),
      });

      if (!exists) {
        await tx.insert(phaseGroupParticipants).values({
          groupId: nextGroup.id,
          registrationId: regId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    return {
      success: true,
      propagated: true,
      nextGroupId: nextGroup.id,
      count: allQualifiers.length,
    };
  };

  if (tx) return await execute(tx);
  return await db.transaction(execute);
}

/**
 * Marque un groupe comme terminé avec qualification des participants
 * CORRIGÉ : Gère les groupes d'élimination (brackets) correctement
 */

export async function markGroupCompleteAction(
  groupId: string,
  options: {
    isHomeAway?: boolean;
    matchFormat?: "BEST_OF_1" | "BEST_OF_3" | "BEST_OF_5";
    seedingMethod?: "RANDOM" | "SEQUENTIAL" | "SNAKE";
  } = {},
) {
  try {
    const group = await db.query.phaseGroups.findFirst({
      where: eq(phaseGroups.id, groupId),
      with: {
        participants: true,
        phase: {
          with: { edition: true },
        },
        bracketNodes: true,
      },
    });
    if (!group) throw new Error("Groupe introuvable");

    // 1. Verification des matches non termines
    const pending = await checkPendingEntitiesAction("GROUP", groupId);
    if (pending.pendingEntities.length > 0) {
      return {
        success: false,
        error: "Certaines entites ne sont pas encore terminees.",
        pendingEntities: pending.pendingEntities,
      };
    }

    const config = (group.config as any) || {};
    const advanceCount = config.advanceCount || 2;
    const groupType = group.groupType;
    const phaseType = group.phase?.phaseType;

    // **NOUVEAU: Pour les phases elimination, completer d'abord tous les brackets non completes**
    if (phaseType === "ELIMINATION" || phaseType === "KNOCKOUT") {
      const incompleteBrackets = group.bracketNodes.filter(
        (node) => !node.isCompleted,
      );

      for (const node of incompleteBrackets) {
        // Verifier si tous les matches du bracket sont termines
        const nodeMatches = await db.query.matches.findMany({
          where: and(
            eq(matches.bracketNodeId, node.id),
            eq(matches.isDeleted, false),
          ),
        });

        const allMatchesCompleted =
          nodeMatches.length > 0 &&
          nodeMatches.every((m) =>
            [
              "COMPLETED",
              "CANCELLED",
              "FORFEIT",
              "DISPUTED",
              "AWAITING_ADMIN_CONFIRMATION",
              "PENDING_REVIEW",
            ].includes(m.status || ""),
          );

        if (allMatchesCompleted) {
          // Completer ce bracket automatiquement
          const result = await markBracketNodeCompleteAction(node.id);
          if (!result.success) {
            console.log(
              `[GROUP_COMPLETE] Could not complete bracket ${node.nodeCode}:`,
              (result as any).error || result,
            );
          } else {
            console.log(
              `[GROUP_COMPLETE] Auto-completed bracket ${node.nodeCode}, winner: ${result.winnerId}`,
            );
          }
        }
      }

      // Recharger les brackets apres completion
      const updatedGroup = await db.query.phaseGroups.findFirst({
        where: eq(phaseGroups.id, groupId),
        with: {
          participants: true,
          phase: {
            with: { edition: true },
          },
          bracketNodes: true,
        },
      });

      if (updatedGroup) {
        group.bracketNodes = updatedGroup.bracketNodes;
      }
    }

    let qualifiedRegistrationIds: string[] = [];

    // CAS 1: Phase de groupes classique
    if (
      phaseType === "GROUP_STAGE" ||
      phaseType === "ROUND_ROBIN" ||
      groupType === "ROUND_ROBIN"
    ) {
      const standings = await calculateGroupStandings(groupId);
      const tiebreakerRules = config.tiebreakerRules || [
        "POINTS",
        "GOAL_DIFF",
        "GOALS_FOR",
      ];
      const sortedParticipants = rankParticipants(standings, tiebreakerRules);
      qualifiedRegistrationIds = sortedParticipants
        .slice(0, advanceCount)
        .map((p) => p.registrationId);
    }
    // CAS 2: Phase elimination - Recuperer les winners des brackets
    else if (phaseType === "ELIMINATION" || phaseType === "KNOCKOUT") {
      // Recuperer les brackets du groupe avec leurs winners
      const completedNodes = group.bracketNodes.filter(
        (node) => node.isCompleted && node.winnerRegistrationId,
      );
      qualifiedRegistrationIds = completedNodes
        .map((node) => node.winnerRegistrationId)
        .filter(Boolean) as string[];

      console.log(
        `[GROUP_COMPLETE] Found ${qualifiedRegistrationIds.length} qualified from ${completedNodes.length} completed brackets`,
      );
    }
    // CAS 3: Ronde Suisse
    else if (phaseType === "SWISS") {
      const standings = await calculateGroupStandings(groupId);
      const sortedParticipants = rankParticipants(standings, [
        "POINTS",
        "GOAL_DIFF",
      ]);
      qualifiedRegistrationIds = sortedParticipants
        .slice(0, advanceCount)
        .map((p) => p.registrationId);
    }
    // CAS 4: Fallback
    else {
      const standings = await calculateGroupStandings(groupId);
      const sortedParticipants = rankParticipants(standings, ["POINTS"]);
      qualifiedRegistrationIds = sortedParticipants
        .slice(0, advanceCount)
        .map((p) => p.registrationId);
    }

    return await db.transaction(async (tx) => {
      // Marquer les qualifies
      for (const participant of group.participants) {
        const isQualified = qualifiedRegistrationIds.includes(
          participant.registrationId,
        );
        const position =
          qualifiedRegistrationIds.indexOf(participant.registrationId) + 1;

        await tx
          .update(phaseGroupParticipants)
          .set({
            qualified: isQualified,
            position: position > 0 ? position : null,
            updatedAt: new Date(),
          })
          .where(eq(phaseGroupParticipants.id, participant.id));
      }

      // Marquer le groupe comme termine
      await tx
        .update(phaseGroups)
        .set({
          isCompleted: true,
          isLocked: true,
          updatedAt: new Date(),
        })
        .where(eq(phaseGroups.id, groupId));

      // PROPAGATION pour phase elimination
      if (
        (phaseType === "ELIMINATION" || phaseType === "KNOCKOUT") &&
        qualifiedRegistrationIds.length > 0
      ) {
        const propagationResult = await propagateEliminationRoundToNextGroup(
          group.phaseId,
          group.order,
          tx,
        );

        console.log("[GROUP_COMPLETE] Propagation result:", propagationResult);

        // Si la propagation a reussi et qu'il y a un groupe suivant, distribuer les participants
        if (propagationResult.success && propagationResult.nextGroupId) {
          const distributionResult =
            await distributeParticipantsInEliminationGroup(
              propagationResult.nextGroupId,
              {
                isHomeAway: options.isHomeAway,
                matchFormat: options.matchFormat,
                seedingMethod: options.seedingMethod,
              },
              tx,
            );

          console.log(
            "[GROUP_COMPLETE] Distribution result:",
            distributionResult,
          );
        }
      }

      await updateEditionResultsFromGroup(tx, groupId);
      revalidatePath(`/tournaments/dashboard`);
      return { success: true, qualifiedCount: qualifiedRegistrationIds.length };
    });
  } catch (error) {
    console.error("Error marking group complete:", error);
    throw error;
  }
}

/**
 * Calcule les classements d'un groupe à partir des matchs réels
 */
async function calculateGroupStandings(
  groupId: string,
): Promise<Map<string, ParticipantStats & { participantId: string }>> {
  // Récupérer tous les matchs terminés du groupe
  const finishedMatches = await db.query.matches.findMany({
    where: and(
      eq(matches.groupId, groupId),
      eq(matches.status, "COMPLETED"),
      eq(matches.confirmedByAdmin, true),
    ),
  });

  // Récupérer les participants
  const participants = await db.query.phaseGroupParticipants.findMany({
    where: eq(phaseGroupParticipants.groupId, groupId),
  });

  const statsMap = new Map<
    string,
    ParticipantStats & { participantId: string }
  >();

  // Initialiser les stats
  for (const p of participants) {
    statsMap.set(p.registrationId, {
      participantId: p.id,
      matchesPlayed: 0,
      matchesWon: 0,
      matchesDrawn: 0,
      matchesLost: 0,
      points: 0,
      scoreFor: 0,
      scoreAgainst: 0,
      scoreDifference: 0,
    });
  }

  // Calculer les stats à partir des matchs
  for (const match of finishedMatches) {
    const p1Id = match.participant1RegistrationId;
    const p2Id = match.participant2RegistrationId;

    if (!p1Id || !p2Id) continue;

    const p1Stats = statsMap.get(p1Id);
    const p2Stats = statsMap.get(p2Id);

    if (!p1Stats || !p2Stats) continue;

    const s1 = match.score1 ?? 0;
    const s2 = match.score2 ?? 0;

    p1Stats.matchesPlayed++;
    p2Stats.matchesPlayed++;
    p1Stats.scoreFor += s1;
    p1Stats.scoreAgainst += s2;
    p2Stats.scoreFor += s2;
    p2Stats.scoreAgainst += s1;

    if (s1 > s2) {
      p1Stats.matchesWon++;
      p1Stats.points += 3;
      p2Stats.matchesLost++;
      p2Stats.points += 0;
    } else if (s1 < s2) {
      p2Stats.matchesWon++;
      p2Stats.points += 3;
      p1Stats.matchesLost++;
      p1Stats.points += 0;
    } else {
      p1Stats.matchesDrawn++;
      p2Stats.matchesDrawn++;
      p1Stats.points += 1;
      p2Stats.points += 1;
    }

    p1Stats.scoreDifference = p1Stats.scoreFor - p1Stats.scoreAgainst;
    p2Stats.scoreDifference = p2Stats.scoreFor - p2Stats.scoreAgainst;
  }

  return statsMap;
}

/**
 * Interface pour les statistiques des participants
 */
interface ParticipantStats {
  participantId: string;
  matchesPlayed: number;
  matchesWon: number;
  matchesDrawn: number;
  matchesLost: number;
  points: number;
  scoreFor: number;
  scoreAgainst: number;
  scoreDifference: number;
}

/**
 * Trie les participants selon les règles de départage
 */
function rankParticipants(
  statsMap: Map<string, ParticipantStats & { participantId: string }>,
  tiebreakerRules: string[],
): { id: string; registrationId: string; stats: ParticipantStats }[] {
  const list = Array.from(statsMap.entries()).map(
    ([registrationId, stats]) => ({
      id: stats.participantId, // Use the actual record ID
      registrationId,
      stats,
    }),
  );

  return list.sort((a, b) => {
    for (const rule of tiebreakerRules) {
      if (rule === "POINTS" && a.stats.points !== b.stats.points) {
        return b.stats.points - a.stats.points;
      }
      if (
        rule === "GOAL_DIFF" &&
        a.stats.scoreDifference !== b.stats.scoreDifference
      ) {
        return b.stats.scoreDifference - a.stats.scoreDifference;
      }
      if (rule === "GOALS_FOR" && a.stats.scoreFor !== b.stats.scoreFor) {
        return b.stats.scoreFor - a.stats.scoreFor;
      }
      if (
        rule === "GOALS_AGAINST" &&
        a.stats.scoreAgainst !== b.stats.scoreAgainst
      ) {
        return a.stats.scoreAgainst - b.stats.scoreAgainst;
      }
      // HEAD_TO_HEAD nécessite une logique plus complexe
    }
    return 0;
  });
}

export async function markPhaseCompleteAction(phaseId: string) {
  try {
    const phase = await db.query.tournamentPhases.findFirst({
      where: eq(tournamentPhases.id, phaseId),
      with: { edition: true },
    });
    if (!phase) throw new Error("Phase introuvable");

    const pending = await checkPendingEntitiesAction("PHASE", phaseId);
    if (pending.pendingEntities.length > 0) {
      return {
        success: false,
        error: "Certaines entités ne sont pas encore terminées.",
        pendingEntities: pending.pendingEntities,
      };
    }

    // 🔥 Trouver la phase suivante en fonction de l'ordre
    const allPhases = await db.query.tournamentPhases.findMany({
      where: and(
        eq(tournamentPhases.editionId, phase.editionId),
        eq(tournamentPhases.isDeleted, false),
      ),
      orderBy: asc(tournamentPhases.order),
    });

    const currentIndex = allPhases.findIndex((p) => p.id === phaseId);
    const nextPhase =
      currentIndex !== -1 && currentIndex + 1 < allPhases.length
        ? allPhases[currentIndex + 1]
        : null;

    // 🔥 Déterminer si c'est la dernière phase selon la config de l'édition
    const editionConfig = (phase.edition?.editionConfig as any) || {};
    const competitionType = editionConfig.competitionType || "LDC";

    let expectedPhasesCount = 1;
    if (competitionType === "LDC") expectedPhasesCount = 2;
    else if (competitionType === "CUP") expectedPhasesCount = 1;
    else if (competitionType === "CHAMPIONSHIP") expectedPhasesCount = 1;
    else if (competitionType === "SWISS") expectedPhasesCount = 1;

    // Une phase est la dernière si:
    // - Pas de phase suivante dans la BDD, OU
    // - Le nombre total de phases atteint le nombre attendu
    const isLastPhase = !nextPhase || allPhases.length >= expectedPhasesCount;

    // Calculer le nombre de qualifiés
    let qualifiedCount = 0;
    const groups = await db.query.phaseGroups.findMany({
      where: eq(phaseGroups.phaseId, phaseId),
    });
    for (const group of groups) {
      const qualified = await db.query.phaseGroupParticipants.findMany({
        where: and(
          eq(phaseGroupParticipants.groupId, group.id),
          eq(phaseGroupParticipants.qualified, true),
        ),
      });
      qualifiedCount += qualified.length;
    }

    return await db.transaction(async (tx) => {
      await tx
        .update(tournamentPhases)
        .set({ isCompleted: true, isActive: false, updatedAt: new Date() })
        .where(eq(tournamentPhases.id, phaseId));

      await tx
        .update(phaseGroups)
        .set({ isLocked: true, isCompleted: true, updatedAt: new Date() })
        .where(eq(phaseGroups.phaseId, phaseId));

      revalidatePath(
        `/tournaments/${phase.edition.tournamentId}/editions/${phase.editionId}/dashboard`,
      );
      revalidatePath(
        `/tournaments/${phase.edition.tournamentId}/editions/${phase.editionId}`,
      );

      // Activer la phase suivante si elle existe
      if (nextPhase && !isLastPhase) {
        await tx
          .update(tournamentPhases)
          .set({ isActive: true, updatedAt: new Date() })
          .where(eq(tournamentPhases.id, nextPhase.id));
      }

      await updateEditionResultsFromPhase(tx, phaseId);

      revalidatePath(`/tournaments/dashboard`);
      return {
        success: true,
        isLastPhase,
        nextPhaseId: nextPhase?.id,
        nextPhaseName: nextPhase?.name,
        qualifiedCount,
        editionId: phase.editionId,
      };
    });
  } catch (error) {
    console.error("Error marking phase complete:", error);
    throw error;
  }
}

/**
 * Marque un bracket node comme terminé et fait progresser le gagnant
 * CORRIGÉ : Gère correctement les BO3/BO5 et Aller-Retour (score agrégé)
 */
// phases.ts - markBracketNodeCompleteAction corrigé avec propagation

export async function markBracketNodeCompleteAction(nodeId: string) {
  try {
    const node = await db.query.bracketNodes.findFirst({
      where: eq(bracketNodes.id, nodeId),
      with: {
        phase: { with: { edition: true } },
        group: true,
      },
    });

    if (!node) throw new Error("Bracket node introuvable");

    // 🔒 GUARD
    if (node.isCompleted && node.winnerRegistrationId) {
      return {
        success: true,
        winnerId: node.winnerRegistrationId,
        alreadyCompleted: true,
      };
    }

    // 🔍 Vérifier les matchs
    const matchesList = await db.query.matches.findMany({
      where: and(
        eq(matches.bracketNodeId, nodeId),
        eq(matches.isDeleted, false),
      ),
    });

    if (matchesList.length === 0) {
      return { success: false, error: "Aucun match généré pour ce node." };
    }

    const hasPending = matchesList.some(
      (m) => !FINAL_STATUSES.has(m.status || ""),
    );
    if (hasPending) {
      return {
        success: false,
        error: "Des matchs ne sont pas encore terminés.",
      };
    }

    // 🎯 Déterminer le vainqueur selon le format
    const completedMatches = matchesList.filter(
      (m) => m.status === "COMPLETED" && m.confirmedByAdmin,
    );
    const metadata = (node.metadata as any) || {};
    const format = metadata.format || "BEST_OF_1";
    const isHomeAway = format === "HOME_AWAY" || metadata.isHomeAway === true;

    let winnerId: string | null = null;
    let aggregateScore1 = 0;
    let aggregateScore2 = 0;

    if (isHomeAway) {
      const result = computeAggregatedWinner(completedMatches);
      winnerId = result.winnerId;
      aggregateScore1 = result.aggregateScore1;
      aggregateScore2 = result.aggregateScore2;
    } else {
      const requiredWins = getRequiredWins(format);
      const result = computeWinner(completedMatches, requiredWins);
      winnerId = result.winnerId;
    }

    if (!winnerId) {
      const errorMsg = isHomeAway
        ? `Match aller-retour non décisif (score agrégé: ${aggregateScore1}-${aggregateScore2})`
        : `Match non décisif (${getRequiredWins(format)} wins requis)`;
      return {
        success: false,
        error: errorMsg,
      };
    }

    return await db.transaction(async (tx) => {
      // ✅ Marquer le node comme terminé
      await tx
        .update(bracketNodes)
        .set({
          isCompleted: true,
          winnerRegistrationId: winnerId,
          metadata: isHomeAway
            ? {
                ...metadata,
                aggregateScore1,
                aggregateScore2,
              }
            : metadata,
          updatedAt: new Date(),
        })
        .where(eq(bracketNodes.id, nodeId));

      // ✅ Utiliser le moteur de progression robuste
      // On peut simuler la progression en appelant handleEliminationProgression avec le dernier match du node
      const lastMatch = completedMatches[completedMatches.length - 1];
      if (lastMatch) {
        await handleEliminationProgression(tx, lastMatch.id);
      }

      revalidatePath(
        `/tournaments/${node.phase?.edition?.tournamentId}/editions/${node.phase?.editionId}/dashboard`,
      );

      return { success: true, winnerId };
    });
  } catch (error) {
    console.error("markBracketNodeCompleteAction error:", error);
    throw error;
  }
}

/**
 * Récupère un aperçu de la structure du tournoi sans persistance
 */

export async function getQualifiedParticipantsPreviewAction(phaseId: string) {
  try {
    const phase = await db.query.tournamentPhases.findFirst({
      where: eq(tournamentPhases.id, phaseId),
      with: {
        groups: {
          where: eq(phaseGroups.isDeleted, false),
          orderBy: [asc(phaseGroups.order)],
          with: {
            participants: {
              with: {
                registration: {
                  with: {
                    member: {
                      with: { user: true, team: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!phase) return { success: false, error: "Phase introuvable" };

    const qualified: any[] = [];
    const others: any[] = [];

    // Uniquement via les groups
    for (const group of phase.groups) {
      for (const participant of group.participants) {
        const participantData = {
          id: participant.registrationId,
          participantId: participant.id,
          registrationId: participant.registrationId,
          name:
            participant.registration.member?.displayName ||
            participant.registration.member?.team?.name ||
            participant.registration.member?.user?.fullName ||
            "Participant",
          image:
            participant.registration.member?.avatar ||
            participant.registration.member?.user?.profileImage ||
            participant.registration.member?.user?.image,
          email:
            participant.registration.member?.contactEmail ||
            participant.registration.member?.user?.email,
          phone:
            participant.registration.member?.contactPhone ||
            participant.registration.member?.user?.phoneNumber,
          groupId: group.id,
          position: participant.position,
          isQualified: participant.qualified,
        };

        if (participant.qualified) {
          qualified.push(participantData);
        } else {
          others.push(participantData);
        }
      }
    }

    // 🔥 BRACKET DIRECT (nodes rattachés à la phase sans group - legacy)
    const nodes = await db.query.bracketNodes.findMany({
      where: and(
        eq(bracketNodes.phaseId, phaseId),
        isNull(bracketNodes.groupId), // ⚠️ On garde pour compatibilité legacy
        eq(bracketNodes.isDeleted, false),
      ),
    });

    // Pour chaque node legacy, on vérifie ses matchs
    for (const node of nodes) {
      const nodeMatches = await db.query.matches.findMany({
        where: and(
          eq(matches.bracketNodeId, node.id),
          eq(matches.isDeleted, false),
        ),
      });

      if (
        nodeMatches.length === 0 ||
        nodeMatches.some((m) => !FINAL_STATUSES.has(m.status || ""))
      ) {
        qualified.push({
          id: node.id,
          participantId: node.id,
          registrationId: node.winnerRegistrationId,
          name: node.nodeCode || node.id,
          image: null,
          email: null,
          phone: null,
          nodeId: node.id,
          position: 1,
          isQualified: true,
        });
      }
    }

    return {
      success: true,
      qualified: qualified.sort(
        (a, b) => (a.position || 99) - (b.position || 99),
      ),
      others: others.sort((a, b) => (a.position || 99) - (b.position || 99)),
      totalCount: qualified.length + others.length,
    };
  } catch (error: any) {
    console.error("Error getting qualified participants:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Organise UNIQUEMENT le premier round de la phase suivante
 * CORRIGÉ : Ne crée que les matchs du premier round, pas toute la structure
 */

export async function organizeNextPhaseAction(
  phaseId: string,
  options: {
    generateNodes?: boolean;
    generateMatches?: boolean;
    seedMethod?: "RANDOM" | "ORDERED";
    force?: boolean;
    isHomeAway?: boolean;
    matchFormat?: "BEST_OF_1" | "BEST_OF_3" | "BEST_OF_5";
    customQualifiedIds?: string[];
  } = {},
) {
  try {
    const phase = await db.query.tournamentPhases.findFirst({
      where: eq(tournamentPhases.id, phaseId),
      with: {
        edition: {
          with: {
            tournament: true,
          },
        },
      },
    });

    if (!phase) throw new Error("Phase introuvable");

    const edConfig = (phase.edition?.editionConfig as any) || {};
    const isAutoMode = edConfig.competitionMode === "AUTO";

    let generateNodes = options.generateNodes ?? true;
    let generateMatches = options.generateMatches ?? true;
    let matchFormat = options.matchFormat ?? "BEST_OF_1";
    let isHomeAway = options.isHomeAway ?? false;

    if (isAutoMode) {
      const isElim =
        phase.phaseType === "ELIMINATION" || phase.phaseType === "KNOCKOUT";
      const isGroups =
        phase.phaseType === "GROUP_STAGE" || phase.phaseType === "ROUND_ROBIN";

      if (isElim) {
        isHomeAway = edConfig.isHomeAwayElimination ?? isHomeAway;
      } else if (isGroups) {
        isHomeAway = edConfig.isHomeAwayGroups ?? isHomeAway;
      }

      if (options.generateNodes === undefined) generateNodes = true;
      if (options.generateMatches === undefined) generateMatches = true;
    }

    // 🔎 RÉCUPÉRER LES QUALIFIÉS DES PHASES PRÉCÉDENTES
    let participantRegIds: string[] = [];

    if (options.customQualifiedIds && options.customQualifiedIds.length > 0) {
      participantRegIds = options.customQualifiedIds;
    } else {
      // Chercher la phase précédente
      const previousPhase = await db.query.tournamentPhases.findFirst({
        where: and(
          eq(tournamentPhases.editionId, phase.editionId),
          lt(tournamentPhases.order, phase.order),
          eq(tournamentPhases.isDeleted, false),
        ),
        orderBy: desc(tournamentPhases.order),
      });

      if (previousPhase) {
        // Vérifier si la phase précédente a des groupes (cas GROUP_STAGE ou ROUND_ROBIN)
        const previousGroups = await db.query.phaseGroups.findMany({
          where: and(
            eq(phaseGroups.phaseId, previousPhase.id),
            eq(phaseGroups.isDeleted, false),
          ),
        });

        if (previousGroups.length > 0) {
          // Récupérer les participants qualifiés
          const qualifiedParticipants =
            await db.query.phaseGroupParticipants.findMany({
              where: and(
                inArray(
                  phaseGroupParticipants.groupId,
                  previousGroups.map((g) => g.id),
                ),
                eq(phaseGroupParticipants.qualified, true),
                eq(phaseGroupParticipants.isDeleted, false),
              ),
            });
          participantRegIds = qualifiedParticipants.map(
            (p) => p.registrationId,
          );
        }

        // Fallback via editionResults si aucun qualifié trouvé
        if (participantRegIds.length === 0) {
          const editionResultsList = await db.query.editionResults.findMany({
            where: eq(editionResults.editionId, phase.editionId),
            orderBy: asc(editionResults.position),
          });
          const advanceCount = (phase.config as any)?.advanceCount || 2;
          const groupsCount = previousGroups.length || 1;
          participantRegIds = editionResultsList
            .slice(0, advanceCount * groupsCount)
            .map((r) => r.registrationId);
        }
      }
    }

    // Fallback ultime : tous les inscrits
    if (participantRegIds.length === 0) {
      const registrations = await db.query.editionRegistrations.findMany({
        where: eq(editionRegistrations.editionId, phase.editionId),
      });
      participantRegIds = registrations.map((r) => r.id);
    }

    // Dédoublonnage strict des participants pour garantir l'unicité des slots
    participantRegIds = Array.from(new Set(participantRegIds));

    if (participantRegIds.length < 2) {
      throw new Error(
        `Pas assez de participants qualifiés (${participantRegIds.length}). Minimum 2 requis.`,
      );
    }

    let participants = [...participantRegIds];
    if (options.seedMethod === "RANDOM") {
      participants = shuffle(participants);
    }

    // Supprimer la structure existante si force
    if (options.force) {
      await db.transaction(async (tx) => {
        await tx.delete(matches).where(eq(matches.phaseId, phase.id));
        await tx.delete(bracketNodes).where(eq(bracketNodes.phaseId, phase.id));
        await tx.delete(phaseGroups).where(eq(phaseGroups.phaseId, phase.id));
      });
    }

    await db.transaction(async (tx) => {
      // =========================
      // 🟢 CAS 1: PHASE DE GROUPES (GROUP_STAGE / ROUND_ROBIN)
      // =========================
      if (
        phase.phaseType === "GROUP_STAGE" ||
        phase.phaseType === "ROUND_ROBIN"
      ) {
        const groupsCount = (phase.config as any)?.groupsCount ?? 1;
        const perGroup = Math.ceil(participants.length / groupsCount);
        const createdGroups: any[] = [];

        for (let i = 0; i < groupsCount; i++) {
          const start = i * perGroup;
          const chunk = participants.slice(start, start + perGroup);
          if (chunk.length === 0) continue;

          const groupName =
            groupsCount === 1
              ? "Classement"
              : `Groupe ${String.fromCharCode(65 + i)}`;

          const [group] = await tx
            .insert(phaseGroups)
            .values({
              phaseId: phase.id,
              name: groupName,
              order: i,
              participantCount: chunk.length,
              groupType:
                phase.phaseType === "ROUND_ROBIN" ? "ROUND_ROBIN" : "STANDARD",
              config: {
                isHomeAway: isHomeAway,
                advanceCount: (phase.config as any)?.advanceCount || 2,
              },
              createdAt: new Date(),
              updatedAt: new Date(),
            })
            .returning();

          createdGroups.push({ group, participants: chunk });

          for (const regId of chunk) {
            await tx.insert(phaseGroupParticipants).values({
              groupId: group.id,
              registrationId: regId,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }
        }

        if (generateNodes && createdGroups.length > 0) {
          for (const g of createdGroups) {
            if (phase.phaseType === "ROUND_ROBIN") {
              // ROUND_ROBIN: créer un nœud par journée
              const roundsCount = g.participants.length - 1;
              if (roundsCount > 0) {
                for (let round = 1; round <= roundsCount; round++) {
                  const [node] = await tx
                    .insert(bracketNodes)
                    .values({
                      phaseId: phase.id,
                      groupId: g.group.id,
                      nodeCode: `J${round}`,
                      round: round,
                      matchNumber: round,
                      bracketType: "UPPER",
                      order: round,
                      metadata: {
                        participants: g.participants,
                        name: `Journée ${round}`,
                        generateMatches: generateMatches,
                        format: "BEST_OF_1",
                        nodeType: "ROUND_ROBIN",
                      },
                      createdAt: new Date(),
                      updatedAt: new Date(),
                    })
                    .returning();

                  if (generateMatches) {
                    const roundMatches = generateRoundRobinMatchesForRound(
                      g.participants,
                      round,
                      g.participants.length,
                    );
                    for (let idx = 0; idx < roundMatches.length; idx++) {
                      const m = roundMatches[idx];
                      await tx.insert(matches).values({
                        editionId: phase.editionId,
                        phaseId: phase.id,
                        groupId: g.group.id,
                        bracketNodeId: node.id,
                        participant1RegistrationId: m.participant1.id,
                        participant2RegistrationId: m.participant2.id,
                        matchCode: `${node.nodeCode}-M${idx + 1}`,
                        status: "PENDING",
                        round: round,
                        matchNumber: idx + 1,
                        scheduledTime: getDefaultScheduledTime(round, idx + 1),
                        createdAt: new Date(),
                        updatedAt: new Date(),
                      });
                    }
                  }
                }
              }
            } else {
              // GROUP_STAGE standard: un seul nœud par groupe (poule)
              const totalMatches =
                (g.participants.length * (g.participants.length - 1)) / 2;
              const [node] = await tx
                .insert(bracketNodes)
                .values({
                  phaseId: phase.id,
                  groupId: g.group.id,
                  nodeCode: `${g.group.name.slice(0, 3).toUpperCase()}-Poule`,
                  round: 1,
                  matchNumber: 1,
                  bracketType: "UPPER",
                  order: g.group.order,
                  metadata: {
                    participants: g.participants,
                    name: g.group.name,
                    generateMatches: generateMatches,
                    matchesCount: totalMatches,
                    format: "BEST_OF_1",
                    nodeType: "GROUP_STAGE",
                  },
                  createdAt: new Date(),
                  updatedAt: new Date(),
                })
                .returning();

              if (generateMatches) {
                const allMatches = generateAllRoundRobinMatches(g.participants);
                for (let idx = 0; idx < allMatches.length; idx++) {
                  const m = allMatches[idx];
                  await tx.insert(matches).values({
                    editionId: phase.editionId,
                    phaseId: phase.id,
                    groupId: g.group.id,
                    bracketNodeId: node.id,
                    participant1RegistrationId: m.participant1.id,
                    participant2RegistrationId: m.participant2.id,
                    matchCode: `${node.nodeCode}-M${idx + 1}`,
                    status: "PENDING",
                    round: m.round || 1,
                    matchNumber: idx + 1,
                    scheduledTime: getDefaultScheduledTime(
                      m.round || 1,
                      idx + 1,
                    ),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  });
                }
              }
            }
          }
        }
      }

      // =========================
      // 🟡 CAS 2: PHASE À ÉLIMINATION DIRECTE
      // =========================
      else if (
        phase.phaseType === "ELIMINATION" ||
        phase.phaseType === "KNOCKOUT"
      ) {
        const participantCount = participants.length;
        const totalRounds = Math.ceil(Math.log2(participantCount));
        const nodePrefix = (phase.config as any)?.nodePrefix || "Match";
        const advanceCountGlobal = (phase.config as any)?.advanceCount || 1;

        let currentParticipants = [...participants];

        for (let roundIndex = 0; roundIndex < totalRounds; roundIndex++) {
          const matchesThisRound = Math.pow(2, totalRounds - roundIndex - 1);
          const groupName = getEliminationRoundName(matchesThisRound * 2);

          // Nombre de qualifiés pour ce round
          const advanceCountForRound =
            roundIndex === totalRounds - 1 ? 1 : matchesThisRound;

          // Créer le groupe pour ce round
          const [group] = await tx
            .insert(phaseGroups)
            .values({
              phaseId: phase.id,
              name: groupName,
              order: roundIndex,
              participantCount:
                roundIndex === 0 ? participantCount : matchesThisRound * 2,
              groupType: "STANDARD",
              config: {
                round: roundIndex + 1,
                advanceCount: advanceCountForRound,
                isHomeAway: isHomeAway,
                matchFormat: matchFormat,
                nodePrefix: nodePrefix,
              },
              createdAt: new Date(),
              updatedAt: new Date(),
            })
            .returning();

          // Assigner les participants UNIQUEMENT au premier round
          if (roundIndex === 0 && currentParticipants.length > 0) {
            for (const regId of currentParticipants) {
              await tx.insert(phaseGroupParticipants).values({
                groupId: group.id,
                registrationId: regId,
                createdAt: new Date(),
                updatedAt: new Date(),
              });
            }
          }

          // Créer les brackets
          if (generateNodes !== false) {
            for (let matchIdx = 0; matchIdx < matchesThisRound; matchIdx++) {
              const p1 =
                roundIndex === 0 ? currentParticipants[matchIdx * 2] : null;
              const p2 =
                roundIndex === 0 ? currentParticipants[matchIdx * 2 + 1] : null;

              const [node] = await tx
                .insert(bracketNodes)
                .values({
                  phaseId: phase.id,
                  groupId: group.id,
                  nodeCode: `${nodePrefix} ${matchIdx + 1}`,
                  round: roundIndex + 1,
                  matchNumber: matchIdx + 1,
                  bracketType: "UPPER",
                  order: matchIdx,
                  metadata: {
                    requiresMatch: roundIndex === 0,
                    matchFormat: matchFormat,
                    isHomeAway: isHomeAway,
                    format: isHomeAway ? "HOME_AWAY" : matchFormat,
                    participants: p1 && p2 ? [p1, p2] : [],
                  },
                  createdAt: new Date(),
                  updatedAt: new Date(),
                })
                .returning();

              // Générer les matchs pour le premier round seulement
              if (roundIndex === 0 && p1 && p2 && generateMatches !== false) {
                const matchesToCreate = isHomeAway ? 2 : 1;
                for (let mIdx = 0; mIdx < matchesToCreate; mIdx++) {
                  await tx.insert(matches).values({
                    editionId: phase.editionId,
                    phaseId: phase.id,
                    groupId: group.id,
                    bracketNodeId: node.id,
                    participant1RegistrationId: mIdx === 0 ? p1 : p2,
                    participant2RegistrationId: mIdx === 0 ? p2 : p1,
                    matchCode:
                      matchesToCreate > 1
                        ? `${node.nodeCode}-L${mIdx + 1}`
                        : node.nodeCode,
                    status: "PENDING",
                    round: roundIndex + 1,
                    matchNumber: matchIdx + 1,
                    scheduledTime: getDefaultScheduledTime(
                      roundIndex + 1,
                      matchIdx + 1,
                    ),
                    metadata: {
                      format: isHomeAway ? "HOME_AWAY" : matchFormat,
                      leg: mIdx + 1,
                      isHomeAway: isHomeAway,
                    },
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  });
                }
              }
            }
          }

          // Préparer les participants pour le round suivant (null = à déterminer)
          currentParticipants = Array(matchesThisRound).fill(null);
        }
      }

      // =========================
      // 🔵 CAS 3: SYSTÈME SUISSE
      // =========================
      else if (phase.phaseType === "SWISS") {
        const roundsCount = (phase.config as any)?.roundsCount || 5;

        for (let round = 1; round <= roundsCount; round++) {
          const [node] = await tx
            .insert(bracketNodes)
            .values({
              phaseId: phase.id,
              nodeCode: `S-R${round}`,
              round: round,
              matchNumber: round,
              order: round,
              metadata: {
                participants: round === 1 ? participants : [],
                name: `Round ${round}`,
                generateMatches: generateMatches && round === 1,
                matchesCount: Math.floor(participants.length / 2),
                format: "BEST_OF_1",
                nodeType: "SWISS",
              },
              createdAt: new Date(),
              updatedAt: new Date(),
            })
            .returning();

          if (round === 1 && generateMatches) {
            const shuffled =
              options.seedMethod === "RANDOM"
                ? shuffle([...participants])
                : [...participants];
            const matchPairs = [];
            for (let i = 0; i < shuffled.length; i += 2) {
              if (i + 1 < shuffled.length) {
                matchPairs.push([shuffled[i], shuffled[i + 1]]);
              }
            }

            for (let idx = 0; idx < matchPairs.length; idx++) {
              const [p1, p2] = matchPairs[idx];
              await tx.insert(matches).values({
                editionId: phase.editionId,
                phaseId: phase.id,
                bracketNodeId: node.id,
                participant1RegistrationId: p1,
                participant2RegistrationId: p2,
                matchCode: `${node.nodeCode}-M${idx + 1}`,
                status: "PENDING",
                round: 1,
                matchNumber: idx + 1,
                scheduledTime: getDefaultScheduledTime(1, idx + 1),
                createdAt: new Date(),
                updatedAt: new Date(),
              });
            }
          }
        }
      }
    });

    revalidatePath(`/tournaments/editions/${phase.editionId}/dashboard`);
    return { success: true };
  } catch (err: any) {
    console.error("Error in organizeNextPhaseAction:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Génère tous les matchs round-robin pour un groupe
 */
function generateAllRoundRobinMatches(participants: string[]): {
  participant1: { id: string };
  participant2: { id: string };
  round: number;
}[] {
  const n = participants.length;
  if (n < 2) return [];

  const players = [...participants];
  if (n % 2 !== 0) {
    players.push("BYE");
  }

  const allMatches: {
    participant1: { id: string };
    participant2: { id: string };
    round: number;
  }[] = [];
  const numRounds = players.length - 1;
  const half = players.length / 2;

  for (let round = 1; round <= numRounds; round++) {
    for (let i = 0; i < half; i++) {
      const p1 = players[i];
      const p2 = players[players.length - 1 - i];

      if (p1 !== "BYE" && p2 !== "BYE") {
        allMatches.push({
          participant1: { id: p1 },
          participant2: { id: p2 },
          round: round,
        });
      }
    }

    // Rotation
    const last = players.pop()!;
    players.splice(1, 0, last);
  }

  return allMatches;
}

/**
 * Génère les matchs round-robin pour un round spécifique
 */
function generateRoundRobinMatchesForRound(
  participants: string[],
  round: number,
  totalRounds: number,
): { participant1: { id: string }; participant2: { id: string } }[] {
  const n = participants.length;
  if (n < 2) return [];

  const players = [...participants];
  if (n % 2 !== 0) {
    players.push("BYE");
  }

  const half = players.length / 2;
  const matches: {
    participant1: { id: string };
    participant2: { id: string };
  }[] = [];

  // Rotation cyclique pour atteindre le round demandé
  const roundIndex = round - 1;
  for (let i = 0; i < roundIndex; i++) {
    const last = players.pop()!;
    players.splice(1, 0, last);
  }

  for (let i = 0; i < half; i++) {
    const p1 = players[i];
    const p2 = players[players.length - 1 - i];

    if (p1 !== "BYE" && p2 !== "BYE") {
      matches.push({
        participant1: { id: p1 },
        participant2: { id: p2 },
      });
    }
  }

  return matches;
}

/**
 * Mise à jour des résultats d'édition à partir d'un groupe clôturé
 */
async function updateEditionResultsFromGroup(tx: any, groupId: string) {
  const group = await tx.query.phaseGroups.findFirst({
    where: eq(phaseGroups.id, groupId),
    with: {
      participants: true,
      phase: true,
    },
  });

  if (!group || !group.phase?.editionId) return;

  for (const p of group.participants) {
    await recomputeParticipantEditionStats(
      tx,
      group.phase.editionId,
      p.registrationId,
      { position: p.position || 0 },
    );
  }
}

/**
 * Mise à jour des résultats finaux à partir d'une phase clôturée
 */
async function updateEditionResultsFromPhase(tx: any, phaseId: string) {
  const phase = await tx.query.tournamentPhases.findFirst({
    where: eq(tournamentPhases.id, phaseId),
    with: { groups: true },
  });

  if (!phase) return;

  // Récupérer tous les résultats de la phase
  for (const group of phase.groups) {
    await updateEditionResultsFromGroup(tx, group.id);
  }

  // Si c'est la dernière phase (ex: Finale), on peut déterminer le vainqueur final
  // Cette logique peut être étendue selon les besoins spécifiques (tiers, récompenses)
}

/**
 * Mise à jour des résultats à partir d'un nœud de bracket
 */
async function updateEditionResultsFromBracketNode(tx: any, nodeId: string) {
  const node = await tx.query.bracketNodes.findFirst({
    where: eq(bracketNodes.id, nodeId),
    with: {
      phase: true,
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

/**
 * Retourne le contexte d'une phase pour le dialogue de clôture
 * Utilisé par MarkCompleteDialog
 */
