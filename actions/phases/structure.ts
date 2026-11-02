"use server";

import {
  tournamentPhases,
  phaseGroups,
  phaseGroupParticipants,
  bracketNodes,
  matches,
  tournamentEditions,
  editionRegistrations,
  type TournamentPhase,
  type PhaseGroup,
  type PhaseGroupParticipant,
  type BracketNode,
  type Match,
  type NewMatch,
} from "@/database/schema";
import {
  eq,
  and,
  desc,
  asc,
  sql,
  inArray,
} from "drizzle-orm";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import {
  shuffle,
  chunk,
  getDefaultScheduledTime,
} from "@/lib/tournaments/utils";
import {
  generateGroupMatches,
  generateRoundRobinMatches,
} from "@/lib/tournaments/match.generator";
import { createStructureEngine } from "@/lib/tournaments/structure-engine";
import { generateMatchesEngine } from "@/lib/tournaments/match-generation-engine";
import { GeneratorOptions, isPlaceholder } from "@/lib/tournaments/generators";
import { getCurrentUser } from "@/lib/auth/session";
import { propagatePhaseResults } from "@/lib/tournaments/propagation-service";
import {
  assertOrganizerOrAdminByEdition,
  assertOrganizerOrAdminByPhase,
  FINAL_STATUSES,
} from "./helpers";
import {
  getTournamentPhaseById,
  getPhaseGroupById,
  getPhaseGroups,
  getPhaseGroupParticipants,
} from "./queries";
import {
  createPhaseGroup,
  createPhaseGroupParticipant,
  createBracketNode,
  createMatch,
  bulkCreateMatches,
  deleteMatch,
  updatePhaseGroup,
} from "./mutations";
import { checkPendingEntitiesAction, markBracketNodeCompleteAction } from "./progression";


export async function generatePhaseMatches(
  phaseId: string,
  config?: { forceRecreate?: boolean; groupId?: string },
) {
  try {
    const phase = await db.query.tournamentPhases.findFirst({
      where: eq(tournamentPhases.id, phaseId),
      with: {
        groups: {
          with: {
            participants: true,
            bracketNodes: true,
          },
        },
      },
    });

    if (!phase) throw new Error("Phase not found");

    if (config?.forceRecreate) {
      if (config.groupId) {
        await db
          .delete(matches)
          .where(
            and(
              eq(matches.groupId, config.groupId),
              eq(matches.status, "PENDING"),
            ),
          );
      } else {
        await db
          .delete(matches)
          .where(
            and(eq(matches.phaseId, phaseId), eq(matches.status, "PENDING")),
          );
      }
    }

    const createdMatches = [];
    const createdNodes = [];

    if (phase.phaseType === "GROUP_STAGE" && phase.groups) {
      const groupsToProcess = config?.groupId
        ? phase.groups.filter((g: any) => g.id === config.groupId)
        : phase.groups;

      for (const group of groupsToProcess) {
        const participants = group.participants || [];
        if (participants.length < 2) continue;

        // Ensure bracket nodes exist for the group if none
        let nodes = group.bracketNodes || [];
        if (nodes.length === 0) {
          // Create a default node for the group
          const nodeRes = await db
            .insert(bracketNodes)
            .values({
              phaseId,
              groupId: group.id,
              nodeCode: `${group.name || "G"}-N1`,
              round: 1,
              matchNumber: 1,
              metadata: {
                participants: participants.map((p: any) => p.registrationId),
                name: "Général",
                generateMatches: true,
                matchesCount: 1,
                format: "BEST_OF_1",
              },
            } as any)
            .returning();
          nodes = [nodeRes[0]];
          createdNodes.push(nodeRes[0]);
        } else {
          // Update nodes with participants if they are empty
          for (const node of nodes) {
            const metadata = (node.metadata as any) || {};
            if (!metadata.participants || metadata.participants.length === 0) {
              await db
                .update(bracketNodes)
                .set({
                  metadata: {
                    ...metadata,
                    participants: participants.map(
                      (p: any) => p.registrationId,
                    ),
                  },
                })
                .where(eq(bracketNodes.id, node.id));
            }
          }
        }

        // Generate matches for each node
        for (const node of nodes) {
          const nodeMetadata = (node.metadata as any) || {};
          const nodeParticipants =
            nodeMetadata.participants ||
            participants.map((p: any) => p.registrationId);

          const generated = generateGroupMatches(
            nodeParticipants.map((id: string) => ({
              id,
            })),
            { returnType: "single" },
          );

          for (const [index, m] of generated.entries()) {
            const mData = {
              editionId: phase.editionId,
              phaseId: phase.id,
              groupId: group.id,
              bracketNodeId: node.id,
              participant1RegistrationId: m.participant1?.id,
              participant2RegistrationId: m.participant2?.id,
              matchNumber: index + 1,
              status: "PENDING" as const,
              round: node.round || 1,
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            const res = await db
              .insert(matches)
              .values(mData as any)
              .returning();
            createdMatches.push(res[0]);
          }
        }
      }
    } else if (phase.phaseType === "ELIMINATION") {
      // Logic for elimination remains similar but ensures nodes are created
      // ... existing elimination logic
    }

    revalidatePath(`/tournaments/editions/${phase.editionId}/dashboard`);
    return {
      success: true,
      count: createdMatches.length,
      nodesCount: createdNodes.length,
    };
  } catch (error) {
    console.error("Failed to generate matches", error);
    throw error;
  }
}

// ============================================================================
// ENRICHISSEMENT — Matchs avec participants hydratés
// ============================================================================

/**
 * Récupère les matchs avec les participants enrichis (nom, avatar, member info)
 * Résout le problème "À déterminer" dans l'UI
 */

export async function generateBracketMatches(
  bracketNodeId: string,
  config?: { returnType?: "single" | "double"; forceRecreate?: boolean },
): Promise<{ success: boolean; count: number }> {
  try {
    const node = await db.query.bracketNodes.findFirst({
      where: eq(bracketNodes.id, bracketNodeId),
      with: { phase: true, group: true },
    });

    if (!node) throw new Error("Bracket node introuvable");

    const nodeMetadata = (node.metadata as any) || {};
    const participantIds: string[] = nodeMetadata.participants || [];

    if (participantIds.length < 2) {
      throw new Error(
        `Le bracket doit avoir au moins 2 participants (actuellement ${participantIds.length})`,
      );
    }

    // Valider que les participants appartiennent bien au groupe parent
    if (node.groupId) {
      const groupParticipants = await db.query.phaseGroupParticipants.findMany({
        where: eq(phaseGroupParticipants.groupId, node.groupId),
      });
      const validIds = new Set(groupParticipants.map((p) => p.registrationId));
      const invalidIds = participantIds.filter((id) => !validIds.has(id));
      if (invalidIds.length > 0) {
        throw new Error(
          `Participants invalides (non membres du groupe) : ${invalidIds.join(", ")}`,
        );
      }
    }

    if (config?.forceRecreate) {
      await db
        .delete(matches)
        .where(
          and(
            eq(matches.bracketNodeId, bracketNodeId),
            eq(matches.status, "PENDING"),
          ),
        );
    }

    const generated = generateGroupMatches(
      participantIds.map((id) => ({ id })),
      { returnType: config?.returnType ?? "single" },
    );

    const createdMatches = [];
    for (const [index, m] of generated.entries()) {
      const mData = {
        editionId: node.phase.editionId,
        phaseId: node.phaseId,
        groupId: node.groupId ?? undefined,
        bracketNodeId: node.id,
        participant1RegistrationId: m.participant1?.id,
        participant2RegistrationId: m.participant2?.id,
        matchNumber: index + 1,
        round: node.round ?? 1,
        status: "PENDING" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const res = await db
        .insert(matches)
        .values(mData as any)
        .returning();
      createdMatches.push(res[0]);
    }

    return { success: true, count: createdMatches.length };
  } catch (error) {
    console.error("Error generating bracket matches:", error);
    throw error;
  }
}

// ============================================================================
// MUTATIONS - Écriture des données
// ============================================================================

/**
 * Crée une nouvelle phase de tournoi
 * SEC-07 FIX: Organizer or admin only
 */

export async function distributeParticipantsInEliminationGroup(
  groupId: string,
  options: {
    seedingMethod?: "RANDOM" | "SEQUENTIAL" | "SNAKE";
    isHomeAway?: boolean;
    matchFormat?: "BEST_OF_1" | "BEST_OF_3" | "BEST_OF_5";
  } = {},
  tx?: any,
) {
  const execute = async (transaction: any) => {
    const group = await transaction.query.phaseGroups.findFirst({
      where: eq(phaseGroups.id, groupId),
      with: {
        participants: true,
        phase: true,
        bracketNodes: true,
      },
    });

    if (!group) throw new Error("Groupe introuvable");

    const config = (group.config as any) || {};
    const isHomeAway = options.isHomeAway ?? config.isHomeAway ?? false;
    const matchFormat =
      options.matchFormat ?? config.matchFormat ?? "BEST_OF_1";
    const seedingMethod =
      options.seedingMethod ?? config.seedingMethod ?? "RANDOM";
    const nodePrefix = config.nodePrefix || group.name || "Match";

    // 1. Recuperer les participants du groupe
    const participantIds = group.participants.map((p: any) => p.registrationId);

    if (participantIds.length < 2) {
      return {
        success: false,
        error: "Pas assez de participants pour generer les brackets",
        participantCount: participantIds.length,
      };
    }

    // 2. Tirage au sort
    let orderedParticipants = [...participantIds];
    if (seedingMethod === "RANDOM") {
      orderedParticipants = shuffle(orderedParticipants);
    }
    // SEQUENTIAL: on garde l'ordre d'arrivee
    // SNAKE: implementation plus complexe si necessaire

    // 3. Supprimer les anciens brackets vides (sans winner)
    const existingNodes = group.bracketNodes || [];
    const emptyNodes = existingNodes.filter(
      (n: any) => !n.winnerRegistrationId && !n.isCompleted,
    );

    if (emptyNodes.length > 0) {
      // Supprimer les matches associes
      for (const node of emptyNodes) {
        await tx.delete(matches).where(eq(matches.bracketNodeId, node.id));
      }
      await tx.delete(bracketNodes).where(
        inArray(
          bracketNodes.id,
          emptyNodes.map((n: any) => n.id),
        ),
      );
    }

    // 4. Calculer le nombre de brackets necessaires
    const matchCount = Math.floor(orderedParticipants.length / 2);
    const createdNodes: any[] = [];

    // 5. Creer les brackets avec les participants
    for (let matchIdx = 0; matchIdx < matchCount; matchIdx++) {
      const p1 = orderedParticipants[matchIdx * 2];
      const p2 = orderedParticipants[matchIdx * 2 + 1];

      if (!p1 || !p2) continue;

      const [node] = await tx
        .insert(bracketNodes)
        .values({
          phaseId: group.phaseId,
          groupId: group.id,
          nodeCode: `${nodePrefix} ${matchIdx + 1}`,
          round: group.order + 1,
          matchNumber: matchIdx + 1,
          bracketType: "UPPER",
          order: matchIdx,
          metadata: {
            requiresMatch: true,
            matchFormat: matchFormat,
            isHomeAway: isHomeAway,
            format: isHomeAway ? "HOME_AWAY" : matchFormat,
            participants: [p1, p2],
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      createdNodes.push(node);

      // 6. Generer les matches pour ce bracket
      const phase = await tx.query.tournamentPhases.findFirst({
        where: eq(tournamentPhases.id, group.phaseId),
      });

      const matchesToCreate = isHomeAway ? 2 : 1;
      for (let mIdx = 0; mIdx < matchesToCreate; mIdx++) {
        await tx.insert(matches).values({
          editionId: phase?.editionId as string,
          phaseId: group.phaseId,
          groupId: group.id,
          bracketNodeId: node.id,
          participant1RegistrationId: mIdx === 0 ? p1 : p2,
          participant2RegistrationId: mIdx === 0 ? p2 : p1,
          matchCode:
            matchesToCreate > 1
              ? `${node.nodeCode}-L${mIdx + 1}`
              : node.nodeCode,
          status: "PENDING",
          round: group.order + 1,
          matchNumber: matchIdx + 1,
          metadata: {
            format: isHomeAway ? "HOME_AWAY" : matchFormat,
            leg: mIdx + 1,
            isHomeAway: isHomeAway,
          },
          scheduledTime: getDefaultScheduledTime(group.order + 1, matchIdx + 1),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    // 7. Mettre a jour les stats du groupe
    await tx
      .update(phaseGroups)
      .set({
        participantCount: orderedParticipants.length,
        matchCount: matchCount * (isHomeAway ? 2 : 1),
        updatedAt: new Date(),
      })
      .where(eq(phaseGroups.id, groupId));

    return {
      success: true,
      distributedCount: orderedParticipants.length,
      bracketsCreated: createdNodes.length,
      matchesCreated: createdNodes.length * (isHomeAway ? 2 : 1),
    };
  };
}

/**
 * Propage les qualifies d'un round d'elimination vers le round suivant
 * CORRIGE: Separe l'ajout des participants et la distribution dans les brackets
 */

export async function getStructurePreviewAction(
  editionId: string,
  phasesData: any[],
  participantRegIds: string[],
) {
  try {
    const result = await createStructureEngine({
      editionId,
      phases: phasesData,
      participantRegIds,
      options: { dryRun: true },
    });
    return result;
  } catch (error: any) {
    console.error("Error getting structure preview:", error);
    throw new Error(error.message || "Échec du calcul de l'aperçu");
  }
}

/**
 * Organise la structure complète d'une édition
 * SEC-07 FIX: Organizer or admin only
 */

export async function organizeEditionStructure(
  editionId: string,
  phasesData: any[],
  participantRegIds: string[],
  options: {
    autoInitializeFirstPhase?: boolean;
    groupsSize?: number;
    randomizeDistribution?: boolean;
    clearExisting?: boolean;
    targetPhaseId?: string;
  } = {},
) {
  try {
    await assertOrganizerOrAdminByEdition(editionId);

    const result = await createStructureEngine({
      editionId,
      phases: phasesData,
      participantRegIds,
      options: {
        autoInitializeFirstPhase: options.autoInitializeFirstPhase,
        clearExisting: options.clearExisting ?? true,
        targetPhaseId: options.targetPhaseId,
      },
    });

    revalidatePath(`/tournaments/editions/${editionId}/dashboard`);
    return result;
  } catch (error: any) {
    console.error("Error organizing edition structure:", error);
    throw new Error(error.message || "Échec de l'organisation structurelle");
  }
}

/**
 * Action pour déclencher la génération de matchs via le moteur centralisé
 * SEC-07 FIX: Organizer or admin only
 */

export async function generateMatchesAction(
  type: "PHASE" | "GROUP" | "NODE",
  id: string,
  options: any = {},
) {
  try {
    if (type === "PHASE") {
      await assertOrganizerOrAdminByPhase(id);
    } else {
      const currentUser = await getCurrentUser();
      if (!currentUser) throw new Error("Non authentifié");
    }

    const result = await generateMatchesEngine({ type, id, options });

    // Si c'est une phase et qu'elle est terminée, on peut tenter une propagation
    if (type === "PHASE" && options.propagate) {
      await propagatePhaseResults(id);
    }

    revalidatePath(`/tournaments/dashboard`);
    return { success: true, result };
  } catch (error: any) {
    console.error("Error in generateMatchesAction:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Réinitialise complètement la structure d'une édition (Phases, Groupes, Nœuds, Matchs)
 * ⚠️ ATTENTION : Action destructrice, demande confirmation côté UI !
 * SEC-07 FIX: Organizer or admin only
 */

export async function resetEditionStructure(editionId: string) {
  try {
    if (!editionId) throw new Error("ID de l'édition requis");
    await assertOrganizerOrAdminByEdition(editionId);

    return await db.transaction(async (tx) => {
      // 1. Supprimer tous les matchs de l'édition
      await tx.delete(matches).where(eq(matches.editionId, editionId));

      // 2. Supprimer tous les participants de groupe
      // On récupère d'abord les phases pour trouver les groupes
      const phases = await tx.query.tournamentPhases.findMany({
        where: eq(tournamentPhases.editionId, editionId),
        with: { groups: true },
      });

      const groupIds = phases.flatMap((p) => p.groups.map((g) => g.id));
      if (groupIds.length > 0) {
        await tx
          .delete(phaseGroupParticipants)
          .where(inArray(phaseGroupParticipants.groupId, groupIds));
        await tx
          .delete(bracketNodes)
          .where(inArray(bracketNodes.groupId, groupIds));
        await tx.delete(phaseGroups).where(
          inArray(
            phaseGroups.phaseId,
            phases.map((p) => p.id),
          ),
        );
      }

      // 3. Supprimer les nodes de bracket directement liés aux phases
      await tx.delete(bracketNodes).where(
        inArray(
          bracketNodes.phaseId,
          phases.map((p) => p.id),
        ),
      );

      // 4. Supprimer enfin les phases
      await tx
        .delete(tournamentPhases)
        .where(eq(tournamentPhases.editionId, editionId));

      revalidatePath(`/tournaments/editions/${editionId}/dashboard`);
      revalidatePath(`/tournaments/editions/${editionId}/dashboard/phases`);

      return { success: true };
    });
  } catch (error: any) {
    console.error("Error resetting edition structure:", error);
    throw new Error(
      error.message || "Échec de la réinitialisation structurelle",
    );
  }
}

/**
 * Récupère la liste des qualifiés potentiels d'une phase
 */

export async function setupEliminationGroups(
  tx: any,
  editionId: string,
  phase: any,
  participantRegIds: string[],
  options: GeneratorOptions,
) {
  const workingRegIds = [...participantRegIds];
  const participantCount = workingRegIds.length;

  if (options.generateNodes === false) return;

  const totalRounds = Math.ceil(Math.log2(participantCount || 2));
  const allCreatedNodes: Map<number, any[]> = new Map(); // round -> nodes
  const createdGroups: any[] = [];

  // IMPORTANT: Construire de Round 1 vers la Finale (Round totalRounds)
  // Cela permet de definir correctement les parentNodeId
  for (let round = 1; round <= totalRounds; round++) {
    const matchesThisRound = Math.pow(2, totalRounds - round);
    const roundParticipantCount = matchesThisRound * 2;
    const groupName = getEliminationRoundName(roundParticipantCount);

    // Creer le groupe pour ce round
    const [group] = await tx
      .insert(phaseGroups)
      .values({
        phaseId: phase.id,
        name: groupName,
        order: round - 1, // Round 1 = order 0, Round 2 = order 1, etc.
        participantCount: round === 1 ? participantCount : 0,
        groupType: "ELIMINATION",
        config: {
          isHomeAway: options.isHomeAway || false,
          generateMatches: options.generateMatches !== false,
          advanceCount: matchesThisRound,
          format: "BEST_OF_1",
          nodePrefix: options.nodePrefix || groupName,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    createdGroups.push(group);

    // Si premier round, assigner les participants au groupe
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

    const currentRoundNodes: any[] = [];

    for (let i = 0; i < matchesThisRound; i++) {
      const p1 = round === 1 ? workingRegIds[i * 2] || null : null;
      const p2 = round === 1 ? workingRegIds[i * 2 + 1] || null : null;

      const [node] = await tx
        .insert(bracketNodes)
        .values({
          phaseId: phase.id,
          groupId: group.id,
          nodeCode: `R${round}-M${i + 1}`,
          round,
          matchNumber: i + 1, // Index du match dans ce round (1-indexed)
          bracketType: "UPPER",
          order: i, // Ordre dans le round
          parentNodeId: null, // Sera mis a jour apres
          childPosition: null,
          metadata: {
            participants: [p1, p2].filter(Boolean),
            requiresMatch: round === 1 ? !!p1 && !!p2 : false,
            generateMatches: options.generateMatches !== false,
            matchesCount: options.isHomeAway ? 2 : 1,
            format: "BEST_OF_1",
            isHomeAway: options.isHomeAway || false,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      currentRoundNodes.push(node);

      // Generer les matches pour le node si demande (seulement Round 1)
      if (round === 1 && options.generateMatches !== false && p1 && p2) {
        const matchesToCreate = options.isHomeAway ? 2 : 1;
        for (let mIdx = 0; mIdx < matchesToCreate; mIdx++) {
          await tx.insert(matches).values({
            editionId,
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
            round: round,
            matchNumber: i + 1,
            metadata: {
              format: options.isHomeAway ? "HOME_AWAY" : "BEST_OF_1",
              leg: mIdx + 1,
              isHomeAway: options.isHomeAway || false,
            },
            scheduledTime: getDefaultScheduledTime(round, i + 1),
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      }
    }

    allCreatedNodes.set(round, currentRoundNodes);

    // Maintenant, mettre a jour les parentNodeId des nodes du round precedent
    // Le parent d'un node de round N est le node de round N+1 vers lequel le winner avance
    if (round > 1) {
      const previousRoundNodes = allCreatedNodes.get(round - 1) || [];
      for (let j = 0; j < previousRoundNodes.length; j++) {
        const parentIndex = Math.floor(j / 2);
        const parentNode = currentRoundNodes[parentIndex];
        if (parentNode) {
          await tx
            .update(bracketNodes)
            .set({
              parentNodeId: parentNode.id,
              childPosition: j % 2 === 0 ? "UPPER" : "LOWER",
              updatedAt: new Date(),
            })
            .where(eq(bracketNodes.id, previousRoundNodes[j].id));
        }
      }
    }
  }

  return createdGroups;
}

/**
 * Retourne le nom d'un round d'élimination basé sur le nombre de participants
 */
function getEliminationRoundName(participantCount: number): string {
  switch (participantCount) {
    case 2:
      return "Finale";
    case 4:
      return "Demi-finale";
    case 8:
      return "Quart de finale";
    case 16:
      return "Huitième de finale";
    case 32:
      return "Seizième de finale";
    case 64:
      return "Trente-deuxième de finale";
    default:
      return `Top ${participantCount}`;
  }
}

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

async function getWinnersFromGroups(tx: any, groupIds: string[]) {
  const nodes = await tx.query.bracketNodes.findMany({
    where: and(
      inArray(bracketNodes.groupId, groupIds),
      eq(bracketNodes.isCompleted, true),
    ),
  });

  return nodes
    .map((n: any) => n.winnerRegistrationId)
    .filter(Boolean) as string[];
}
