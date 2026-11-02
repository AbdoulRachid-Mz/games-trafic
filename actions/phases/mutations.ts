"use server";

import {
  tournamentPhases,
  phaseGroups,
  phaseGroupParticipants,
  bracketNodes,
  matches,
  tournamentEditions,
  type TournamentPhase,
  type NewTournamentPhase,
  type PhaseGroup,
  type NewPhaseGroup,
  type PhaseGroupParticipant,
  type NewPhaseGroupParticipant,
  type BracketNode,
  type NewBracketNode,
  type Match,
  type NewMatch,
} from "@/database/schema";
import {
  eq,
  and,
  or,
  desc,
  asc,
  sql,
  inArray,
} from "drizzle-orm";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import {
  assertOrganizerOrAdminByEdition,
  assertOrganizerOrAdminByPhase,
} from "./helpers";
import {
  getPhaseGroupById,
  getTournamentPhaseById,
  getBracketNodeById,
  getMatchById,
  getPhaseGroupParticipantById,
} from "./queries";
import { recalculateGroupStandings } from "./progression";
import { progressTournamentAfterMatch } from "@/lib/tournaments/progression-engine";
import { generateGroupMatches } from "@/lib/tournaments/match.generator";


export async function deletePhaseGroupParticipant(id: string): Promise<void> {
  try {
    const [participant] = await db
      .select({
        id: phaseGroupParticipants.id,
        groupId: phaseGroupParticipants.groupId,
      })
      .from(phaseGroupParticipants)
      .where(eq(phaseGroupParticipants.id, id))
      .limit(1);

    if (!participant) return;

    await db
      .delete(phaseGroupParticipants)
      .where(eq(phaseGroupParticipants.id, id));

    // Recalculate standings if groupId exists
    if (participant.groupId) {
      await recalculateGroupStandings(participant.groupId);
    }
  } catch (error) {
    console.error("Error deleting phase group participant:", error);
    throw new Error("Failed to delete phase group participant");
  }
}

/**
 * Supprime plusieurs participants de groupe par leurs IDs
 */

export async function bulkDeletePhaseGroupParticipants(
  ids: string[],
): Promise<void> {
  try {
    if (ids.length === 0) return;

    await db
      .delete(phaseGroupParticipants)
      .where(inArray(phaseGroupParticipants.id, ids));
  } catch (error) {
    console.error("Error bulk deleting phase group participants:", error);
    throw new Error("Failed to bulk delete phase group participants");
  }
}

/**
 * Liste les participants d'un groupe avec pagination et filtres
 */

export async function createTournamentPhase(
  phaseData: NewTournamentPhase,
): Promise<TournamentPhase> {
  try {
    if (
      !phaseData.editionId ||
      !phaseData.name ||
      phaseData.order === undefined
    ) {
      throw new Error("editionId, name and order are required");
    }

    await assertOrganizerOrAdminByEdition(phaseData.editionId);

    const result = await db
      .insert(tournamentPhases)
      .values({
        ...phaseData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error("Error creating tournament phase:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to create tournament phase");
  }
}

/**
 * Crée plusieurs phases de tournoi en une seule transaction
 * SEC-07 FIX: Organizer or admin only
 */

export async function bulkCreateTournamentPhases(
  phasesData: NewTournamentPhase[],
): Promise<TournamentPhase[]> {
  try {
    if (phasesData.length === 0) return [];
    if (phasesData[0].editionId) {
      await assertOrganizerOrAdminByEdition(phasesData[0].editionId);
    }

    const result = await db
      .insert(tournamentPhases)
      .values(
        phasesData.map((p) => ({
          ...p,
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
      )
      .returning();

    return result;
  } catch (error) {
    console.error("Error bulk creating tournament phases:", error);
    throw new Error("Failed to bulk create tournament phases");
  }
}

/**
 * Met à jour une phase de tournoi
 * SEC-07 FIX: Organizer or admin only
 */

export async function updateTournamentPhase(
  id: string,
  phaseData: Partial<NewTournamentPhase>,
): Promise<TournamentPhase> {
  try {
    await assertOrganizerOrAdminByPhase(id);

    const existingPhase = await getTournamentPhaseById(id);
    if (!existingPhase) {
      throw new Error("Tournament phase not found");
    }

    const result = await db
      .update(tournamentPhases)
      .set({
        ...phaseData,
        updatedAt: new Date(),
      })
      .where(eq(tournamentPhases.id, id))
      .returning();

    return result[0];
  } catch (error) {
    console.error("Error updating tournament phase:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to update tournament phase");
  }
}

/**
 * Supprime une phase de tournoi (soft delete)
 * SEC-07 FIX: Organizer or admin only
 */

export async function deleteTournamentPhase(
  id: string,
): Promise<TournamentPhase> {
  try {
    await assertOrganizerOrAdminByPhase(id);

    const result = await db
      .update(tournamentPhases)
      .set({
        isDeleted: true,
        updatedAt: new Date(),
      })
      .where(eq(tournamentPhases.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error("Tournament phase not found");
    }
    return result[0];
  } catch (error) {
    console.error("Error deleting tournament phase:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to delete tournament phase");
  }
}

/**
 * Crée un nouveau groupe de phase
 */

export async function createPhaseGroup(
  groupData: NewPhaseGroup,
): Promise<PhaseGroup> {
  try {
    if (
      !groupData.phaseId ||
      !groupData.name ||
      groupData.order === undefined
    ) {
      throw new Error("phaseId, name and order are required");
    }

    const result = await db
      .insert(phaseGroups)
      .values({
        ...groupData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error("Error creating phase group:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to create phase group");
  }
}

/**
 * Crée plusieurs groupes de phase en une seule transaction
 */

export async function bulkCreatePhaseGroups(
  groupsData: NewPhaseGroup[],
): Promise<PhaseGroup[]> {
  try {
    if (groupsData.length === 0) return [];

    const result = await db
      .insert(phaseGroups)
      .values(
        groupsData.map((g) => ({
          ...g,
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
      )
      .returning();

    return result;
  } catch (error) {
    console.error("Error bulk creating phase groups:", error);
    throw new Error("Failed to bulk create phase groups");
  }
}

/**
 * Met à jour un groupe de phase
 */

export async function updatePhaseGroup(
  id: string,
  groupData: Partial<NewPhaseGroup>,
): Promise<PhaseGroup> {
  try {
    const existingGroup = await getPhaseGroupById(id);
    if (!existingGroup) {
      throw new Error("Phase group not found");
    }

    const result = await db
      .update(phaseGroups)
      .set({
        ...groupData,
        updatedAt: new Date(),
      })
      .where(eq(phaseGroups.id, id))
      .returning();

    return result[0];
  } catch (error) {
    console.error("Error updating phase group:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to update phase group");
  }
}

/**
 * Supprime un groupe de phase (soft delete)
 */

export async function deletePhaseGroup(id: string): Promise<PhaseGroup> {
  try {
    const result = await db
      .update(phaseGroups)
      .set({
        isDeleted: true,
        updatedAt: new Date(),
      })
      .where(eq(phaseGroups.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error("Phase group not found");
    }
    return result[0];
  } catch (error) {
    console.error("Error deleting phase group:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to delete phase group");
  }
}

/**
 * Crée un nouveau participant de groupe
 */

export async function createPhaseGroupParticipant(
  participantData: NewPhaseGroupParticipant,
): Promise<PhaseGroupParticipant> {
  try {
    if (!participantData.groupId || !participantData.registrationId) {
      throw new Error("groupId and registrationId are required");
    }

    const result = await db
      .insert(phaseGroupParticipants)
      .values({
        ...participantData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error("Error creating phase group participant:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to create phase group participant");
  }
}

/**
 * Crée plusieurs participants de groupe en une seule transaction
 */

export async function bulkCreatePhaseGroupParticipants(
  participantsData: NewPhaseGroupParticipant[],
): Promise<PhaseGroupParticipant[]> {
  try {
    if (participantsData.length === 0) return [];

    const result = await db
      .insert(phaseGroupParticipants)
      .values(
        participantsData.map((p) => ({
          ...p,
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
      )
      .returning();

    return result;
  } catch (error) {
    console.error("Error bulk creating phase group participants:", error);
    throw new Error("Failed to bulk create phase group participants");
  }
}

/**
 * Met à jour un participant de groupe
 */

export async function updatePhaseGroupParticipant(
  id: string,
  participantData: Partial<NewPhaseGroupParticipant>,
): Promise<PhaseGroupParticipant> {
  try {
    const existingParticipant = await getPhaseGroupParticipantById(id);
    if (!existingParticipant) {
      throw new Error("Phase group participant not found");
    }

    const result = await db
      .update(phaseGroupParticipants)
      .set({
        ...participantData,
        updatedAt: new Date(),
      })
      .where(eq(phaseGroupParticipants.id, id))
      .returning();

    return result[0];
  } catch (error) {
    console.error("Error updating phase group participant:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to update phase group participant");
  }
}

/**
 * Supprime un participant de groupe (soft delete)
 */
// export async function deletePhaseGroupParticipant(id: string): Promise<PhaseGroupParticipant> {
//   try {
//     const result = await db
//       .update(phaseGroupParticipants)
//       .set({
//         isDeleted: true,
//         updatedAt: new Date(),
//       })
//       .where(eq(phaseGroupParticipants.id, id))
//       .returning();

//     if (result.length === 0) {
//       throw new Error('Phase group participant not found');
//     }
//     return result[0];
//   } catch (error) {
//     console.error('Error deleting phase group participant:', error);
//     if (error instanceof Error) {
//       throw error;
//     }
//     throw new Error('Failed to delete phase group participant');
//   }
// }

/**
 * Crée un nouveau nœud de bracket
 */

export async function createBracketNode(
  nodeData: NewBracketNode,
): Promise<BracketNode> {
  try {
    if (!nodeData.phaseId || !nodeData.nodeCode) {
      throw new Error("phaseId and nodeCode are required");
    }

    const result = await db
      .insert(bracketNodes)
      .values({
        ...nodeData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error("Error creating bracket node:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to create bracket node");
  }
}

/**
 * Crée plusieurs nœuds de bracket en une seule transaction
 */

export async function bulkCreateBracketNodes(
  nodesData: (NewBracketNode & { editionId?: string })[],
): Promise<BracketNode[]> {
  try {
    if (nodesData.length === 0) return [];

    return await db.transaction(async (tx) => {
      const result = await tx
        .insert(bracketNodes)
        .values(
          nodesData.map((n) => {
            const { editionId, ...rest } = n;
            return {
              ...rest,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
          }),
        )
        .returning();

      // Pour chaque nœud, vérifier si on doit générer les matchs
      for (let i = 0; i < result.length; i++) {
        const node = result[i];
        const inputData = nodesData[i];
        const metadata = (node.metadata as any) || {};
        const participants = metadata.participants || [];
        const generateMatches = metadata.generateMatches !== false;

        if (
          participants.length >= 2 &&
          inputData.editionId &&
          generateMatches
        ) {
          // Vérifier si des matchs existent déjà pour ce nœud
          const existingMatches = await tx.query.matches.findMany({
            where: eq(matches.bracketNodeId, node.id),
          });

          // Ne générer que si aucun match n'existe
          if (existingMatches.length === 0) {
            const matchesToCreate = metadata.matchesCount || 1;
            const format = metadata.format || "BEST_OF_1";

            const generated = generateGroupMatches(
              participants.map((id: string) => ({ id })),
              { returnType: format === "HOME_AWAY" ? "double" : "single" },
            );

            for (const [idx, m] of generated.entries()) {
              await tx.insert(matches).values({
                editionId: inputData.editionId,
                phaseId: node.phaseId,
                groupId: node.groupId,
                bracketNodeId: node.id,
                participant1RegistrationId: m.participant1?.id,
                participant2RegistrationId: m.participant2?.id,
                matchCode: `${node.nodeCode || "BR"}-M${idx + 1}`,
                status: "PENDING",
                round: node.round || 1,
                matchNumber: idx + 1,
                metadata: { format },
                createdAt: new Date(),
                updatedAt: new Date(),
              } as any);
            }
          }
        }
      }

      return result;
    });
  } catch (error) {
    console.error("Error bulk creating bracket nodes:", error);
    throw new Error("Failed to bulk create bracket nodes");
  }
}

/**
 * Met à jour un nœud de bracket
 */

export async function updateBracketNode(
  id: string,
  nodeData: Partial<NewBracketNode>,
): Promise<BracketNode> {
  try {
    const existingNode = await getBracketNodeById(id);
    if (!existingNode) {
      throw new Error("Bracket node not found");
    }

    const result = await db
      .update(bracketNodes)
      .set({
        ...nodeData,
        updatedAt: new Date(),
      })
      .where(eq(bracketNodes.id, id))
      .returning();

    return result[0];
  } catch (error) {
    console.error("Error updating bracket node:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to update bracket node");
  }
}

/**
 * Supprime un nœud de bracket (soft delete)
 */

export async function deleteBracketNode(id: string): Promise<BracketNode> {
  try {
    const result = await db
      .update(bracketNodes)
      .set({
        isDeleted: true,
        updatedAt: new Date(),
      })
      .where(eq(bracketNodes.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error("Bracket node not found");
    }
    return result[0];
  } catch (error) {
    console.error("Error deleting bracket node:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to delete bracket node");
  }
}

/**
 * Crée un nouveau match
 */

export async function createMatch(matchData: NewMatch): Promise<Match> {
  try {
    if (!matchData.editionId || !matchData.phaseId) {
      throw new Error("editionId and phaseId are required");
    }

    if (
      matchData.participant1RegistrationId &&
      matchData.participant2RegistrationId &&
      matchData.participant1RegistrationId ===
        matchData.participant2RegistrationId
    ) {
      throw new Error("Un participant ne peut pas jouer contre lui-même");
    }

    // Duplicate Check
    if (
      matchData.participant1RegistrationId &&
      matchData.participant2RegistrationId
    ) {
      const p1 = matchData.participant1RegistrationId;
      const p2 = matchData.participant2RegistrationId;

      const filterConditions = [
        eq(matches.editionId, matchData.editionId),
        eq(matches.phaseId, matchData.phaseId),
      ];

      if (matchData.groupId)
        filterConditions.push(eq(matches.groupId, matchData.groupId));
      if (matchData.bracketNodeId)
        filterConditions.push(
          eq(matches.bracketNodeId, matchData.bracketNodeId),
        );

      const existingMatch = await db.query.matches.findFirst({
        where: and(
          ...filterConditions,
          or(
            and(
              eq(matches.participant1RegistrationId, p1),
              eq(matches.participant2RegistrationId, p2),
            ),
            and(
              eq(matches.participant1RegistrationId, p2),
              eq(matches.participant2RegistrationId, p1),
            ),
          ),
        ),
      });

      if (existingMatch) {
        throw new Error(
          "Ce match existe déjà pour ces deux participants dans cette phase/groupe.",
        );
      }
    }

    const result = await db
      .insert(matches)
      .values({
        ...matchData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error("Error creating match:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to create match");
  }
}

/**
 * Crée plusieurs matchs en une seule transaction
 */

export async function bulkCreateMatches(
  matchesData: NewMatch[],
): Promise<Match[]> {
  try {
    if (matchesData.length === 0) return [];

    const result = await db
      .insert(matches)
      .values(
        matchesData.map((m) => ({
          ...m,
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
      )
      .returning();

    return result;
  } catch (error) {
    console.error("Error bulk creating matches:", error);
    throw new Error("Failed to bulk create matches");
  }
}

/**
 * Met à jour un match
 */

export async function updateMatch(
  id: string,
  matchData: Partial<NewMatch>,
): Promise<Match> {
  try {
    const existingMatch = await getMatchById(id);
    if (!existingMatch) {
      throw new Error("Match not found");
    }

    const result = await db
      .update(matches)
      .set({
        ...matchData,
        updatedAt: new Date(),
      })
      .where(eq(matches.id, id))
      .returning();

    const updatedMatch = result[0];

    // Auto-check qualification and trigger standings recalculation
    if (matchData.status === "COMPLETED") {
      await progressTournamentAfterMatch(id);
    }

    revalidatePath(`/tournaments/editions/${updatedMatch.editionId}/dashboard`);
    return updatedMatch;
  } catch (error) {
    console.error("Error updating match:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to update match");
  }
}

/**
 * Supprime un match (soft delete)
 */

export async function deleteMatch(id: string): Promise<Match> {
  try {
    const result = await db
      .update(matches)
      .set({
        isDeleted: true,
        updatedAt: new Date(),
      })
      .where(eq(matches.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error("Match not found");
    }
    return result[0];
  } catch (error) {
    console.error("Error deleting match:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to delete match");
  }
}

// ============================================================================
// UTILITAIRES
// ============================================================================

/**
 * Construit les conditions WHERE pour les phases de tournoi
 */

export async function toggleGroupLock(groupId: string, isLocked: boolean) {
  try {
    await db
      .update(phaseGroups)
      .set({ isLocked, updatedAt: new Date() })
      .where(eq(phaseGroups.id, groupId));

    revalidatePath(`/tournaments/dashboard`);
    return { success: true };
  } catch (error) {
    console.error("Error toggling group lock:", error);
    throw new Error("Erreur lors du changement de verrouillage du groupe");
  }
}

const FINAL_STATUSES = new Set(["COMPLETED", "CANCELLED"]);

function isMatchPending(status?: string | null) {
  return !status || !FINAL_STATUSES.has(status);
}

function groupMatchesBy<T extends { [key: string]: any }>(
  matches: T[],
  key: keyof T,
) {
  const map = new Map<string, T[]>();

  for (const m of matches) {
    const k = m[key];
    if (!k) continue;

    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(m);
  }

  return map;
}

function hasPending(matches: { status?: string | null }[]) {
  return matches.some((m) => isMatchPending(m.status));
}

/**
 * Vérifie les entités non terminées d'une entité parente (Phase, Group, BracketNode)
 * CORRIGÉ : Élimine les N+1 queries et utilise les matchs comme source de vérité
 */
